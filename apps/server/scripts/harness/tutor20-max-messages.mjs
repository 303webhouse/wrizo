// S0 — THE LIVE DEFECT (Publish committee pass §11, "found in passing": any
// page's Tutor conversation over 20 messages fails on every send).
//
// THE CAUSE, NAMED. apps/server/src/tutor.ts's isValidBody() rejects the whole
// request (400 "Invalid conversation payload") when messages.length > MAX_MESSAGES
// (20) — every message ever sent OR received on that page, not a per-request
// window. apps/desktop/src/components/Tutor.tsx's send handler always resends
// the FULL persisted history (`history = [...(getJournalEntry(entry.id)?.tutor
// ?.messages ?? [])]`), and it appends the writer's new message to storage
// BEFORE the call — so once a page's Tutor thread reaches 20 stored messages,
// the 21st send's history is already 21 long, is rejected, and every send after
// that resends an ever-growing, ever-rejected history. The thread cannot recover
// on its own: this is why it fails on EVERY send, not just the first one past 20.
//
// THIS FILE PROVES THE CAUSE, BROWSERLESS, AGAINST THE REAL ROUTE — no Electron,
// no Postgres, no network call to a real model. It transpiles tutor.ts (and
// env.ts/asyncHandler.ts) with the repo's own TypeScript compiler, so it can
// never pass against a copy, extracts the REAL exported POST /tutor/chat
// handler off tutorRouter, and drives it with a stub req/res. requireAuth and
// rateLimit are stubbed as pass-throughs (this bug is unrelated to either, and
// stubbing them keeps this harness free of a live Postgres/session store) —
// nothing about tutor.ts's own logic is stubbed or reimplemented.
//
// THE FIX IS NOT IN THIS FILE. Every route that clears the 20-message cap
// necessarily means sending fewer than the writer's full stored history to the
// model — raising the cap (a cost/budget call) or trimming what is sent (a
// continuity call: which messages, whether the writer is told) are BOTH the
// TUTOR desk's rulings to make, not this lane's to choose (Fable, 2026-09-30).
// This harness is the standing proof of the cause, and the one this repo's own
// law says a fix must not regress once TUTOR desk rules: at MOST 20 messages
// must always clear validation, and the failure at 21 must be findable by name,
// not by a change in shape.
//
// Run: node scripts/harness/tutor20-max-messages.mjs   (from apps/server, after
// pnpm install — no build step needed, this loads src/ directly).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(here, '..', '..');
const SRC = path.join(SERVER, 'src');
const require = createRequire(path.join(SERVER, 'package.json'));
const ts = require('typescript');

// env.ts reads these at import time (module scope), so they're set before load().
process.env.TUTOR_API_KEY = 'harness-key-not-real';
process.env.TUTOR_BASE_URL = 'http://127.0.0.1:1/unreachable'; // no real send ever reaches this
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';

// Written INSIDE apps/server (not the OS temp dir), so the compiled file's own
// require('express') etc. resolve through this package's real node_modules;
// removed at the end either way (process.exit runs the 'exit' handler below).
const tmp = path.join(SERVER, '.tutor20-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ } });

function load(rel) {
  const srcText = fs.readFileSync(path.join(SRC, rel), 'utf8');
  const out = ts.transpileModule(srcText, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return dest;
}
load('env.ts');
load('asyncHandler.ts');
load('logSafe.ts'); // logSafe (server-hardening) — tutor.ts imports logError from it
// requireAuth / rateLimit are middleware tutorRouter installs with `.use()`;
// stubbed as harmless pass-throughs — see the file header for why.
fs.writeFileSync(path.join(tmp, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
// db (guest login, item 225) — tutor.ts imports pool; a non-guest request never queries it.
fs.writeFileSync(path.join(tmp, 'db.js'), 'exports.pool = { query: async () => ({ rows: [] }) };');
const tutorDest = load('tutor.ts');

const { tutorRouter } = require(tutorDest);

// Find the REAL POST /tutor/chat handler on the real router: the last function
// in that route's own middleware stack is its asyncHandler-wrapped body.
function findHandler(router, routePath, method) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.path === routePath && layer.route.methods[method]) {
      const stack = layer.route.stack;
      return stack[stack.length - 1].handle;
    }
  }
  throw new Error(`route not found: ${method.toUpperCase()} ${routePath}`);
}
const handler = findHandler(tutorRouter, '/tutor/chat', 'post');

function makeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}
async function callRoute(body) {
  const req = { body };
  const res = makeRes();
  let threw = null;
  try {
    // asyncHandler's own `next` fires only on a thrown error (e.g. the
    // unreachable baseURL past validation) — expected and harmless here;
    // the client-facing 400 this file proves is written directly, never thrown.
    await handler(req, res, (err) => { threw = err; });
  } catch (e) { threw = e; }
  return { status: res.statusCode, body: res.body, threw };
}

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// A history that grew the normal way: 20 real turns already accepted, one at a
// time, exactly how a real Tutor thread reaches this size (Tutor.tsx appends to
// storage BEFORE every send, so this shape — not a hand-picked edge case — is
// what a writer's 21st send actually looks like).
const msg = (i) => ({ role: i % 2 === 0 ? 'writer' : 'tutor', text: `message number ${i}, long enough to be real prose and not an edge case of its own.` });
const results = [];
for (let n = 1; n <= 22; n++) {
  const messages = Array.from({ length: n }, (_, i) => msg(i));
  const r = await callRoute({ messages });
  results.push({ n, status: r.status, error: r.body && r.body.error });
}

const under20 = results.filter((r) => r.n <= 20);
const at21 = results.find((r) => r.n === 21);
const at22 = results.find((r) => r.n === 22);

ok('every message count 1..20 clears validation (status !== 400) — the cap itself is not the bug',
  under20.every((r) => r.status !== 400), JSON.stringify(under20.filter((r) => r.status === 400)));
ok('n=21 is rejected 400 "Invalid conversation payload" — the exact failure the ticket names',
  at21.status === 400 && at21.error === 'Invalid conversation payload', JSON.stringify(at21));
ok('n=22 is ALSO rejected — the failure does not clear itself as the history grows further; it is monotonic',
  at22.status === 400 && at22.error === 'Invalid conversation payload', JSON.stringify(at22));
ok('THE MECHANISM: MAX_MESSAGES in tutor.ts is exactly 20 (the source, not a guess) — the boundary above is that constant, not a coincidence of this fixture',
  fs.readFileSync(path.join(SRC, 'tutor.ts'), 'utf8').includes('const MAX_MESSAGES = 20;'), '');

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nTUTOR20 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: it is a new reproduction, falsifying no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nTUTOR20 VERIFY: PASS (${checks.length} checks) — cause reproduced and named; no fix is applied by this file (see header)`
  : `\nTUTOR20 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
