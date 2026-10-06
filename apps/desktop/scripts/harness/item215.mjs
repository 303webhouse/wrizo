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
  // Reference, computed independently from the RULE in English (slice to the
  // cap, then drop leading tutor turns) — not copied from tutorHistory.ts —
  // so this is a real cross-check, not the implementation grading itself.
  let refStart = n <= TUTOR_MAX_MESSAGES ? 0 : n - TUTOR_MAX_MESSAGES;
  while (refStart < n && full[refStart].role === 'tutor') refStart++;
  const expectLen = n - refStart;
  const orderKept = capped.every((m, i) => m.id === full[full.length - capped.length + i].id);
  const endsWithNewest = capped.length === 0 || capped[capped.length - 1].id === full[full.length - 1].id;
  const opensOnWriter = capped.length === 0 || capped[0].role === 'writer';
  ok(`A${n}: n=${n} -> capped length ${expectLen} (cap, then drop leading tutor turns), opens on a writer turn, order kept, ends with the newest`,
    capped.length === expectLen && orderKept && endsWithNewest && opensOnWriter,
    JSON.stringify({ n, expectLen, cappedLen: capped.length, first: capped[0]?.id, firstRole: capped[0]?.role, last: capped[capped.length - 1]?.id }));
}

// ---- THE AMENDMENT (Fable, 2026-09-30) — ALTERNATING THREADS, PROVEN -------
// mk() above happens to open its 20-window on a tutor turn for SOME n (n=21)
// and not others (n=50, n=100), depending on parity — not a deliberate
// exercise of the amendment. mkAlt() below is built the way a real thread
// actually is: alternating, and ALWAYS ending on the writer's own just-sent
// message (Tutor.tsx appends it last, always) — which is exactly the shape
// where a 20-message (even) window is GUARANTEED to open on a tutor turn,
// every time, for every n tested. This is the shape the interim rule exists
// for, proven directly, not as a side effect of another mock's parity.
const mkAlt = (n) => Array.from({ length: n }, (_, i) => {
  const fromEnd = n - 1 - i; // 0 at the newest (always 'writer')
  return { id: `a${i}`, role: fromEnd % 2 === 0 ? 'writer' : 'tutor', text: `alt ${i}`, at: '' };
});
for (const n of [21, 50, 100]) {
  const full = mkAlt(n);
  ok(`A-alt-fixture${n}: the alternating mock itself ends on 'writer' (sanity on the fixture, not the product)`,
    full[full.length - 1].role === 'writer', '');
  const capped = capTutorHistory(full);
  ok(`A-alt${n}: n=${n}, ALTERNATING — the first message SENT is the writer's, and the last is the new one (a strict 20-window here would have opened on tutor every time; the fix's own amendment is what prevents that)`,
    capped[0]?.role === 'writer' && capped[capped.length - 1]?.id === full[full.length - 1].id,
    JSON.stringify({ n, cappedLen: capped.length, firstRole: capped[0]?.role, first: capped[0]?.id, last: capped[capped.length - 1]?.id }));
}
ok('A-idempotent: capping an already-short thread (n=5) returns it completely unchanged — this fix never touches a normal-length conversation',
  capTutorHistory(mk(5)).length === 5, '');
ok('A-storage-untouched: capTutorHistory takes and returns plain data — nothing in this module calls into persistence.ts, so the STORED thread it is handed can only be what Tutor.tsx already read, never mutated by this call',
  !fs.readFileSync(path.join(DESKTOP_SRC, 'store/tutorHistory.ts'), 'utf8').includes('persistence'), '');

// ---- THE BATCH EIGHT REGRESSION — item 84's own deck-phase spur ----------
// A thread that legitimately OPENS on a tutor turn (the drawn spur, item
// 84's own deck phase) and is nowhere near the cap must be returned
// completely untouched — the leading-tutor drop is a truncation repair,
// never a rule about what a short thread's own first message may be.
// Caught live in Batch Eight's parked leg (item84.mjs S5): the original
// amendment ran the drop unconditionally and stripped the spur from a
// 2-message thread, so the wire carried only the writer's reply — "the
// model is answering a prompt it can actually see" (item 84's own law)
// stopped being true.
const spurThenReply = [
  { id: 'spur', role: 'tutor', text: 'The last hour before a departure.' },
  { id: 'reply', role: 'writer', text: 'Taking that one.' },
];
const spurCapped = capTutorHistory(spurThenReply);
ok('A-spur: a SHORT thread (well under the cap) that opens on a tutor turn is returned COMPLETELY UNCHANGED — the spur survives, both in count and in content',
  spurCapped.length === 2 && spurCapped[0].id === 'spur' && spurCapped[0].role === 'tutor' && spurCapped[1].id === 'reply',
  JSON.stringify(spurCapped));
// The exact shape item84.mjs's own S5 check drives: the WIRE body's texts,
// built the same way Tutor.tsx builds it (map to {role,text}) — must
// include the spur's own words, not just the writer's.
const wireTexts = spurCapped.map((m) => m.text);
ok('A-spur WIRE: the assembled wire carries the spur\'s own text — item84.mjs\'s exact failing assertion, re-proven fixed',
  wireTexts.includes('The last hour before a departure.') && wireTexts.includes('Taking that one.'),
  JSON.stringify(wireTexts));
// The TRUNCATED case must still drop a leading tutor artifact — this fix
// narrows WHEN the drop runs, it does not remove the drop itself (item
// 215's own amendment, still load-bearing for a genuinely cut window).
const longSpurFirst = mkAlt(21); // 21 messages, alternating, ends on 'writer' — a real cut
const longCapped = capTutorHistory(longSpurFirst);
ok('A-spur CONTRAST: a thread that IS actually cut (over the cap) still opens on a writer turn — the truncation-repair half of item 215\'s amendment is untouched by this fix',
  longCapped[0]?.role === 'writer' && longCapped.length < longSpurFirst.length,
  JSON.stringify({ firstRole: longCapped[0]?.role, cappedLen: longCapped.length, fullLen: longSpurFirst.length }));

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
// logSafe (server-hardening, merged in) — tutor.ts imports logError from it.
loadServer('logSafe.ts');
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

// THE AMENDMENT, against the real route — the exact shape Fable named: a
// strictly alternating thread, where an unamended slice(-20) would open on
// a tutor turn (an assistant-first conversation) every time. tutor.ts's own
// isValidBody() only checks length/role-enum/text-length — it does not (and
// per this ticket's own ruling, cannot here) enforce "opens with a writer
// turn," so clearing validation does not by itself prove the shape is right;
// this checks the actual sent array's own first/last roles directly, THEN
// confirms the real server still accepts it.
for (const n of [21, 50, 100]) {
  const full = mkAlt(n).map((m) => ({ role: m.role, text: m.text }));
  const wire = capTutorHistory(full).map((m) => ({ role: m.role, text: m.text }));
  const r = await callRoute({ messages: wire });
  ok(`B-alt${n}: ALTERNATING thread of ${n} — the message actually sent opens with 'writer' and closes with the newest turn, and clears the real route (status !== 400)`,
    wire[0]?.role === 'writer' && wire[wire.length - 1]?.text === full[full.length - 1].text && r.status !== 400,
    JSON.stringify({ n, firstRole: wire[0]?.role, status: r.status }));
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
