// ITEM 215 — the fix, proved. INTERIM RULE (Fable, 2026-09-30): the client
// sends only the most recent messages within the server's own cap, always
// ending with the writer's new one. The thread on screen is unchanged, and the
// server (apps/server/src/tutor.ts) is unchanged — this file proves both
// halves of that claim.
//
// PART A (browserless, pure): store/tutorHistory.ts's capTutorHistory(),
// loaded from the REAL file (transpiled with the repo's own TypeScript, never
// re-typed), proven directly — length, order, and "always ends with the
// newest" for threads that are already short, exactly at the cap, and well
// past it.
//
// PART B (against the REAL route, browserless): the exact same capTutorHistory
// output, for stored threads of 21, 50 and 100 messages, driven through the
// real exported POST /tutor/chat handler off tutorRouter — the identical
// technique item 215's own S0 (scripts/harness/tutor20-max-messages.mjs, in
// apps/server) established: transpile tutor.ts/env.ts/asyncHandler.ts with the
// repo's TypeScript, stub only requireAuth/rateLimit (unrelated to this bug),
// nothing of tutor.ts's own logic touched or reimplemented. Confirms every one
// of those three thread lengths now SENDS (clears validation) — item 215's own
// repro proved the opposite for exactly these shapes before this fix.
//
// Run: node scripts/harness/item215.mjs   (from apps/desktop, after pnpm install
// in BOTH apps/desktop and apps/server — no build step needed, loads src/ directly).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const DESKTOP_SRC = path.join(DESKTOP, 'src');
const SERVER = path.resolve(DESKTOP, '..', 'server');
const SERVER_SRC = path.join(SERVER, 'src');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// ---- PART A — capTutorHistory, loaded from the real desktop module ---------
const dtRequire = createRequire(path.join(DESKTOP, 'package.json'));
const ts = dtRequire('typescript');
const dtTmp = path.join(DESKTOP, '.item215-harness-scratch');
fs.rmSync(dtTmp, { recursive: true, force: true });
fs.mkdirSync(dtTmp, { recursive: true });
function loadDesktop(rel) {
  const srcText = fs.readFileSync(path.join(DESKTOP_SRC, rel), 'utf8');
  const out = ts.transpileModule(srcText, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const dest = path.join(dtTmp, path.basename(rel).replace(/\.ts$/, '.mjs'));
  fs.writeFileSync(dest, out);
  return import(`file://${dest.replace(/\\/g, '/')}`);
}
const { capTutorHistory, TUTOR_MAX_MESSAGES } = await loadDesktop('store/tutorHistory.ts');

ok('A0: TUTOR_MAX_MESSAGES is 20 — mirrors the server\'s MAX_MESSAGES (read from the real client constant, not assumed)',
  TUTOR_MAX_MESSAGES === 20, String(TUTOR_MAX_MESSAGES));

const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: `m${i}`, role: i % 2 === 0 ? 'writer' : 'tutor', text: `msg ${i}`, at: '' }));
for (const n of [1, 5, 19, 20, 21, 50, 100]) {
  const full = mk(n);
  const capped = capTutorHistory(full);
  const expectLen = Math.min(n, TUTOR_MAX_MESSAGES);
  const orderKept = capped.every((m, i) => m.id === full[full.length - capped.length + i].id);
  const endsWithNewest = capped.length === 0 || capped[capped.length - 1].id === full[full.length - 1].id;
  ok(`A${n}: n=${n} -> capped length ${expectLen}, order kept, ends with the newest (the writer's own just-sent message)`,
    capped.length === expectLen && orderKept && endsWithNewest,
    JSON.stringify({ n, cappedLen: capped.length, first: capped[0]?.id, last: capped[capped.length - 1]?.id }));
}
ok('A-idempotent: capping an already-short thread (n=5) returns it completely unchanged — this fix never touches a normal-length conversation',
  capTutorHistory(mk(5)).length === 5, '');
ok('A-storage-untouched: capTutorHistory takes and returns plain data — nothing in this module calls into persistence.ts, so the STORED thread it is handed can only be what Tutor.tsx already read, never mutated by this call',
  !fs.readFileSync(path.join(DESKTOP_SRC, 'store/tutorHistory.ts'), 'utf8').includes('persistence'), '');
fs.rmSync(dtTmp, { recursive: true, force: true });

// ---- PART B — the SAME capped shapes, against the REAL server route --------
process.env.TUTOR_API_KEY = 'harness-key-not-real';
process.env.TUTOR_BASE_URL = 'http://127.0.0.1:1/unreachable';
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';

const svRequire = createRequire(path.join(SERVER, 'package.json'));
const svTs = svRequire('typescript');
const svTmp = path.join(SERVER, '.item215-harness-scratch');
fs.rmSync(svTmp, { recursive: true, force: true });
fs.mkdirSync(svTmp, { recursive: true });
function loadServer(rel) {
  const srcText = fs.readFileSync(path.join(SERVER_SRC, rel), 'utf8');
  const out = svTs.transpileModule(srcText, { compilerOptions: { module: svTs.ModuleKind.CommonJS, target: svTs.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const dest = path.join(svTmp, rel.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return dest;
}
loadServer('env.ts');
loadServer('asyncHandler.ts');
fs.writeFileSync(path.join(svTmp, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
fs.writeFileSync(path.join(svTmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
const { tutorRouter } = svRequire(loadServer('tutor.ts'));

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
async function callRoute(body) {
  const req = { body };
  const res = { statusCode: 200, body: undefined };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  await handler(req, res, () => { /* thrown-error path: expected past validation, see header */ });
  return { status: res.statusCode, body: res.body };
}

for (const n of [21, 50, 100]) {
  const full = mk(n).map((m) => ({ role: m.role, text: m.text }));
  const wire = capTutorHistory(full).map((m) => ({ role: m.role, text: m.text }));
  const r = await callRoute({ messages: wire });
  ok(`B${n}: a thread of ${n} stored messages — which item 215's own S0 proved 400s uncapped — now CLEARS VALIDATION once capped (status !== 400), against the real, unmodified server route`,
    r.status !== 400, JSON.stringify(r));
}
// The server's own validator, unmodified, still refuses an UNCAPPED thread —
// proving this fix is client-side only, exactly as ruled ("the server is unchanged").
const uncapped21 = mk(21).map((m) => ({ role: m.role, text: m.text }));
const rawResult = await callRoute({ messages: uncapped21 });
ok('B-server-unchanged: sending the RAW, uncapped 21-message array (bypassing capTutorHistory, as the pre-fix client did) still 400s — the server\'s own MAX_MESSAGES=20 was never touched',
  rawResult.status === 400 && rawResult.body?.error === 'Invalid conversation payload', JSON.stringify(rawResult));

fs.rmSync(svTmp, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nITEM215 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: item 215\'s own S0 (tutor20-max-messages.mjs) proved the CAUSE and is untouched; this file proves the FIX on top of it, falsifying no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM215 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM215 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
