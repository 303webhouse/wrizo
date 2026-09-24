// ITEM 203 - /sync's 5 MB request-body limit (apps/server/src/index.ts: express.json({ limit: '5mb' })).
// MEASURED, not fixed. Browserless: no box turn, no browser, no Postgres; one local HTTP server.
//
// THREE questions, and the file answers each from the real code:
//   A. HOW BIG is a realistic push?   (real JSON serialisation of real-shaped stroke points; the ASSUMPTIONS, not
//      the measurements, are labelled as such - how many points a person draws is not something a script can know)
//   B. WHAT DOES THE SERVER DO at the limit?   (the REAL index.ts - its real express.json middleware and its real
//      final error handler - bundled with esbuild, its /sync route the real router, only db/session/env stubbed;
//      driven over HTTP with bodies either side of the limit)
//   C. WHAT DOES THE WRITER SEE, and what does the client DO?   (the REAL store/sync.ts syncOnce and the REAL
//      apiSync fetch wrapper, driven against B; the real persistent dirty set)
//
// Run: node docs/evidence/item203/body-limit-proof.mjs
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const desktopSrc = join(repo, 'apps/desktop/src');
const serverSrc = join(repo, 'apps/server/src');
// THE FAULT IS PINNED. This file measures the PRE-FIX code, and must go on doing so after item 203's fix merges (which
// it would otherwise measure and go red against). The four files that carry the behaviour are read from the last
// commit before the fix, with `git show`, instead of from the working tree. `b71fc94` is main as the fix was built on it.
const PRE_FIX = 'b71fc94';
const pinned = (relPath) => execSync(`git show ${PRE_FIX}:${relPath}`, { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
const PORT = 47831;
const BASE = `http://127.0.0.1:${PORT}`;
const MB = 1024 * 1024;
const LIMIT = 5 * MB;
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const say = (s = '') => console.log(s);

const requireDesktop = createRequire(join(repo, 'apps/desktop/package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const reqServer = createRequire(join(repo, 'apps/server/package.json'));
const expressPath = reqServer.resolve('express');

// ==========================================================================================================
// A. HOW BIG IS A PUSH  -  real serialisation of real-shaped points
// ==========================================================================================================
say('--- A. HOW BIG IS A REALISTIC PUSH ---');
// A stored point is exactly InkStratum.tsx's normPoint: x and y are UNROUNDED doubles ((clientX - left) / width),
// pressure is rounded to 3 places and present only when the device reports it.
const rand = (n) => Array.from({ length: n }, () => {
  const w = 1100 + Math.random() * 300;                                   // a sheet width in CSS px
  const p = { x: (100 + Math.random() * 900 + Math.random()) / w, y: (60 + Math.random() * 1300 + Math.random()) / w };
  if (Math.random() < 0.8) p.p = Math.round(Math.random() * 1000) / 1000;
  return p;
});
const sample = rand(200_000);
const perPoint = JSON.stringify(sample).length / sample.length;           // bytes per point, comma included
say(`  measured: ${perPoint.toFixed(1)} bytes per stored point (JSON, 200,000 generated points, x/y unrounded doubles, pressure 80% present)`);
const noPressure = JSON.stringify(sample.map(({ x, y }) => ({ x, y }))).length / sample.length;
say(`  measured: ${noPressure.toFixed(1)} bytes per point when the device reports no pressure`);
// WHAT ROUNDING WOULD BUY (a measurement of a hypothetical, for sizing only - nothing is changed): coordinates to 4
// decimals of the sheet width (~0.12 px on a 1,200 px sheet).
const r4 = (v) => Math.round(v * 10000) / 10000;
const rounded = JSON.stringify(sample.map((p) => (p.p === undefined ? { x: r4(p.x), y: r4(p.y) } : { x: r4(p.x), y: r4(p.y), p: p.p }))).length / sample.length;
say(`  hypothetical: ${rounded.toFixed(1)} bytes per point if x and y were rounded to 4 decimals at capture (${(100 * (1 - rounded / perPoint)).toFixed(0)}% smaller) - for sizing only`);
const pointsAtLimit = Math.floor(LIMIT / perPoint);
say(`  => the 5 MB limit is reached at ~${pointsAtLimit.toLocaleString()} points in ONE request (whole records are pushed, all dirty records in one body)`);
const minsAt = (hz) => (pointsAtLimit / hz / 60).toFixed(1);
say(`  => continuous pen contact at 60 Hz: ${minsAt(60)} min; at 120 Hz: ${minsAt(120)} min  (pointermove is one point per event: InkStratum.tsx onMove pushes normPoint(e), no decimation - a fact of the source, read)`);
say('  ASSUMPTIONS (not measured - a script cannot know how a person writes; plug your own):');
const hand = { words: 300, strokesPerWord: 6, ptsPerStroke: 40 };
const handPoints = hand.words * hand.strokesPerWord * hand.ptsPerStroke;
say(`    a full handwritten page = ${hand.words} words x ${hand.strokesPerWord} strokes x ${hand.ptsPerStroke} pts = ${handPoints.toLocaleString()} pts = ${(handPoints * perPoint / MB).toFixed(2)} MB of ONE record`);
check('A: the limit is reachable by ONE realistic record - a dense handwritten page (~72k points, under the stated assumptions) is ~77% of 5 MB by itself, so two such pages in one push are refused',
  handPoints * perPoint > 0.6 * LIMIT && handPoints * perPoint * 2 > LIMIT, `${(handPoints * perPoint / MB).toFixed(2)} MB per page; two = ${(2 * handPoints * perPoint / MB).toFixed(2)} MB`);

// ==========================================================================================================
// B. THE REAL SERVER
// ==========================================================================================================
say('\n--- B. WHAT THE SERVER DOES AT THE LIMIT (the real index.ts) ---');
const tmp = join(tmpdir(), 'wrizo-203');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, 'env.cjs'), `exports.env = { isProd: false, port: ${PORT}, databaseUrl: '' };`);
writeFileSync(join(tmp, 'migrate.cjs'), `exports.runMigrations = async () => {};`);
writeFileSync(join(tmp, 'session.cjs'), `exports.sessionMiddleware = (req, _res, next) => { req.session = { userId: 'u1' }; next(); };`);
writeFileSync(join(tmp, 'auth.cjs'), `const express = require(${JSON.stringify(expressPath)}); exports.authRouter = express.Router(); exports.requireAuth = (_q, _s, next) => next();`);
writeFileSync(join(tmp, 'tutor.cjs'), `const express = require(${JSON.stringify(expressPath)}); exports.tutorRouter = express.Router();`);
writeFileSync(join(tmp, 'db.cjs'), `globalThis.__upserts = 0;
exports.pool = { query: async (sql) => { if (/^\\s*insert into/i.test(sql)) globalThis.__upserts += 1; return /select now\\(\\)/i.test(sql) ? { rows: [{ t: new Date() }] } : { rows: [] }; } };`);
const stubMap = { './env': 'env.cjs', './migrate': 'migrate.cjs', './session': 'session.cjs', './auth': 'auth.cjs', './tutor': 'tutor.cjs', './db': 'db.cjs' };
await esbuild.build({
  entryPoints: [join(serverSrc, 'index.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: join(tmp, 'server.cjs'), logLevel: 'silent', external: ['pg-native'],
  plugins: [{ name: 's', setup(b) {
    b.onResolve({ filter: /^\.\/(env|migrate|session|auth|tutor|db)$/ }, (a) => ({ path: join(tmp, stubMap[a.path]) }));
    b.onLoad({ filter: /[\\/]index\.ts$/ }, () => ({ contents: pinned('apps/server/src/index.ts'), loader: 'ts', resolveDir: serverSrc }));
    b.onLoad({ filter: /[\\/]sync\.ts$/ }, () => ({ contents: pinned('apps/server/src/sync.ts'), loader: 'ts', resolveDir: serverSrc }));
  } }],
});
const serverLogs = [];
const realErr = console.error; console.error = (...a) => { serverLogs.push(a.map((x) => (x && x.message) || String(x)).join(' ').slice(0, 160)); };
createRequire(import.meta.url)(join(tmp, 'server.cjs'));
for (let i = 0; i < 50; i += 1) { try { const r = await fetch(`${BASE}/healthz`); if (r.ok) break; } catch { /* not up */ } await new Promise((r) => setTimeout(r, 100)); }

// A push body of an exact byte size: one journal entry whose `strokes` is padded to the target.
const bodyOfSize = (bytes) => {
  const rec = (strokes) => JSON.stringify({ lastSyncAt: null, push: { journalEntries: [{ id: 'P', text: '', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', pageType: 'page', strokes }] } });
  const skeleton = rec([{ points: [] }]).length;
  const unit = JSON.stringify({ x: 0.5, y: 0.5 }).length + 1;
  const n = Math.max(0, Math.floor((bytes - skeleton) / unit));
  const body = rec([{ points: Array.from({ length: n }, () => ({ x: 0.5, y: 0.5 })) }]);
  return body + ' '.repeat(Math.max(0, bytes - body.length));      // trailing whitespace is valid JSON: an EXACT byte size
};
const post = async (body) => {
  const res = await fetch(`${BASE}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const text = await res.text();
  return { status: res.status, type: res.headers.get('content-type'), text: text.slice(0, 200), bytes: text.length };
};
const below = await post(bodyOfSize(LIMIT - 4096));
check('B: a body just UNDER the limit (5 MB - 4 KB) is accepted and the record reaches the upsert', below.status === 200 && globalThis.__upserts >= 1, JSON.stringify({ status: below.status, upserts: globalThis.__upserts }));
serverLogs.length = 0;
const over = await post(bodyOfSize(LIMIT + 4096));
check('B: a body just OVER the limit (5 MB + 4 KB) is REFUSED, and NOTHING of it reached the database (the whole push is all-or-nothing)',
  over.status !== 200 && globalThis.__upserts === 1, JSON.stringify({ status: over.status, upserts: globalThis.__upserts }));
check('B: the refusal is a bare HTTP 500 {"error":"Internal server error"} - NOT a 413. Express raised PayloadTooLargeError (status 413) and the server\'s final error middleware discards err.status and answers 500 for everything, logging it as a "[server error]"',
  over.status === 500 && /Internal server error/.test(over.text) && serverLogs.some((l) => /server error/.test(l) && /too large/i.test(l)), JSON.stringify({ status: over.status, body: over.text, log: serverLogs.slice(0, 2) }));
say(`  the server's own log for the refusal: ${JSON.stringify(serverLogs.slice(0, 2))}`);
let lo = LIMIT - 4096, hi = LIMIT + 4096;
while (hi - lo > 1) { const mid = (lo + hi) >> 1; const r = await post(bodyOfSize(mid)); if (r.status === 200) lo = mid; else hi = mid; }
say(`  the exact boundary: the largest accepted body is ${lo.toLocaleString()} bytes (= 5 MiB is ${LIMIT.toLocaleString()}; the limit counts the raw request body, headers not included)`);
check('B: the limit is 5 MiB of RAW BODY BYTES (5,242,880), not 5,000,000', lo === LIMIT, `boundary=${lo}`);

// ==========================================================================================================
// C. THE REAL CLIENT
// ==========================================================================================================
say('\n--- C. WHAT THE WRITER SEES, and what the client does (the real store/sync.ts) ---');
const storage = new Map();
globalThis.localStorage = { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => { storage.set(k, String(v)); }, removeItem: (k) => { storage.delete(k); }, clear: () => { storage.clear(); } };
const timers = [];
// Capture the CLIENT bundle's own timers (the sync backoff, the persistence debounce) and never fire them; anything else
// (undici's fetch internals) gets the real thing. The stack tells them apart.
const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => {
  if (new Error().stack.includes('client.mjs')) { timers.push(ms); return { unref() {}, ref() {}, hasRef() { return false; } }; }
  return realSetTimeout(fn, ms, ...rest);
};
const attempts = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (path, init) => {
  const bytes = init && typeof init.body === 'string' ? Buffer.byteLength(init.body) : 0;
  return realFetch(path.startsWith('/') ? `${BASE}${path}` : path, init).then((r) => { attempts.push({ path, bytes, status: r.status }); return r; });
};
writeFileSync(join(tmp, 'lex.mjs'), `export const deskTerm = (k) => k;`);
const out = join(tmp, 'client.mjs');
await esbuild.build({
  stdin: { contents: "export * from './store/sync'; export * from './store/persistence';", resolveDir: desktopSrc, loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
  plugins: [{ name: 'lex', setup(b) {
    b.onResolve({ filter: /^\.\/deskLexicon$/ }, () => ({ path: join(tmp, 'lex.mjs') }));
    b.onLoad({ filter: /[\\/]store[\\/]sync\.ts$/ }, () => ({ contents: pinned('apps/desktop/src/store/sync.ts'), loader: 'ts', resolveDir: join(desktopSrc, 'store') }));
    b.onLoad({ filter: /[\\/]store[\\/]api\.ts$/ }, () => ({ contents: pinned('apps/desktop/src/store/api.ts'), loader: 'ts', resolveDir: join(desktopSrc, 'store') }));
  } }],
});
const C = await import(pathToFileURL(out).href);
const statuses = [];
C.subscribeSyncStatus((s) => statuses.push(s));

// ONE fat ink page, ~6 MB of real-shaped points, created and edited through the real store.
const fatPoints = Math.ceil((6 * MB) / perPoint);
C.createJournalPage({ id: 'FAT', text: 'a heavy ink page', pageType: 'page', projectId: null, origin: null, strokes: [{ id: 's1', points: rand(fatPoints) }] });
attempts.length = 0; serverLogs.length = 0;
await C.syncOnce();
const firstStatus = statuses[statuses.length - 1];
check('C: the client sends the fat push and the server refuses it (HTTP 500); the client treats ANY failure as "offline"',
  attempts.length === 1 && attempts[0].status === 500 && attempts[0].bytes > LIMIT && firstStatus === 'offline', JSON.stringify({ attempts, statuses }));
say(`  the writer's ONLY signal is SyncIndicator (ChromeControls.tsx): status 'offline' renders the muted text "Offline — saved here" - while the writer is ONLINE. It says nothing about other devices, and nothing that it will never clear.`);
const dirtyAfter = C.getDirtyRecords();
check('C: the fat record is STILL DIRTY after the refusal (persistent dirty set, item 89) - it will be re-sent in full on every retry', dirtyAfter.journalEntries.some((e) => e.id === 'FAT'), JSON.stringify({ dirtyIds: dirtyAfter.journalEntries.map((e) => e.id) }));
const retries = 5;
for (let i = 0; i < retries; i += 1) await C.syncOnce();
const totalBytes = attempts.reduce((s, a) => s + a.bytes, 0);
say(`  ${retries + 1} attempts so far, ${(totalBytes / MB).toFixed(1)} MB uploaded, ${attempts.filter((a) => a.status === 200).length} succeeded. Backoff delays scheduled (ms): ${JSON.stringify(timers)}  [the client's cap is 120,000ms]`);
check('C: it RETRIES FOREVER with the same body - every attempt re-uploads the full fat push and every attempt fails; the backoff climbs to a 2-minute cap and never stops',
  attempts.length === retries + 1 && attempts.every((a) => a.status === 500 && a.bytes > LIMIT) && Math.max(...timers) === 120000, JSON.stringify({ attempts: attempts.length, maxDelayMs: Math.max(...timers) }));
const perHourAtCap = Math.round(3600_000 / 120_000);
say(`  at the 120s cap that is ${perHourAtCap} attempts/hour x ${(attempts[0].bytes / MB).toFixed(1)} MB = ~${Math.round(perHourAtCap * attempts[0].bytes / MB)} MB/hour of upload that can never succeed (mobile data)`);

// HEAD-OF-LINE BLOCKING: an unrelated tiny edit made afterwards.
C.createJournalPage({ id: 'TINY', text: 'a small note written after', pageType: 'page', projectId: null, origin: null });
attempts.length = 0;
await C.syncOnce();
check('C: HEAD-OF-LINE BLOCKING - a tiny, unrelated page written AFTER the fat one is pushed in the SAME body and refused with it; one fat record wedges every other edit on the device',
  attempts.length === 1 && attempts[0].status === 500 && C.getDirtyRecords().journalEntries.some((e) => e.id === 'TINY'), JSON.stringify({ attempts, tinyStillDirty: C.getDirtyRecords().journalEntries.some((e) => e.id === 'TINY') }));

// THE CONTROL: the same client, a small dirty set, syncs.
C.softDeleteEntry('FAT'); // (soft delete keeps the row and its strokes: it does NOT shrink the push)
attempts.length = 0;
await C.syncOnce();
check('C: soft-deleting the fat page does NOT unblock it (a soft delete keeps the row and its strokes, so the record is still pushed whole)', attempts.length === 1 && attempts[0].status === 500, JSON.stringify({ attempts }));
console.error = realErr;
const failed = results.filter((r) => !r.pass);
say(`\nBODY LIMIT: ${failed.length ? `${failed.length}/${results.length} FAILED` : `PASS (${results.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
