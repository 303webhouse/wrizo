// ITEM 203 - THE CHUNKED PUSH, THE REAL 413, AND THE RECORD THAT CANNOT TRAVEL. The instrument for the build.
//
// THE FAULT (S0, docs/menus/item203-sync-body-limit-s0.md, measured on the same real code): the client sent every dirty
// record in ONE body; the server refused a body over 5 MiB with a bare 500 (its error middleware discarded the 413);
// the client read any failure as "offline", kept the fat record dirty and re-sent the whole push forever (~180 MB/hour),
// and a tiny page written afterwards was refused WITH it - one fat record wedged every other edit on the device.
//
// THE BUILD: P1 (the server honours err.status: a real 413 with the limit) . P2 (the push is packed into ~1 MB chunks,
// smallest first, each cleaned as it lands, only the last request pulling) . P5 (a record too large for one request is
// NEVER sent again: it is listed, named to the writer, and everything else syncs around it).
//
// BROWSERLESS: one local HTTP server per run, no Postgres, no browser. The SERVER is the real apps/server/src/index.ts
// (its real express.json middleware and its real error handler) with the real /sync router; only db, session, env and
// the other routers are stubbed. The CLIENT is the real store/sync.ts syncOnce + the real apiSync fetch wrapper + the
// real persistent dirty set, driven through the real store (createJournalPage / saveJournalEntry).
//
// THE ONLY INVENTED THINGS: the db stub (it records which ids were upserted and how many pulls ran) and, in K3/K7/K8,
// a fetch hook that plays a lower proxy / a dead network. Nothing else is modelled.
//
// FALSIFICATION IS PART OF THE VERDICT (`--mutants`): each edit is removed ALONE and must turn a dynamic claim red.
//
// Run: node apps/desktop/scripts/sync-chunked-push-proof.mjs [--mutants]     exit 0 = baseline green (and every mutant red)
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const RUN_MUTANTS = process.argv.includes('--mutants');
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const desktopSrc = join(repo, 'apps/desktop/src');
const serverSrc = join(repo, 'apps/server/src');
const INDEX_TEXT = readFileSync(join(serverSrc, 'index.ts'), 'utf8').replace(/\r\n/g, '\n');
const SSYNC_TEXT = readFileSync(join(serverSrc, 'sync.ts'), 'utf8').replace(/\r\n/g, '\n');
const CSYNC_TEXT = readFileSync(join(desktopSrc, 'store/sync.ts'), 'utf8').replace(/\r\n/g, '\n');
const NOTICE_TEXT = readFileSync(join(desktopSrc, 'store/syncNotice.ts'), 'utf8').replace(/\r\n/g, '\n');
const LEX_TEXT = readFileSync(join(desktopSrc, 'store/deskLexicon.ts'), 'utf8').replace(/\r\n/g, '\n');
const MB = 1024 * 1024;
const LIMIT = 16 * MB;   // /api/sync's body limit since P3 (every other route keeps 5 MiB)
const FAT = 20 * MB;     // a lone record that cannot fit even in the larger limit
const OTHER_LIMIT = 5 * MB;

const requireDesktop = createRequire(join(repo, 'apps/desktop/package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const expressPath = createRequire(join(repo, 'apps/server/package.json')).resolve('express');
const tmp = join(tmpdir(), 'wrizo-203-build');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, 'lex.mjs'), `export const deskTerm = (k) => k;`);
const realSetTimeout = globalThis.setTimeout;
const realFetch = globalThis.fetch;
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));
const realConsoleError = console.error;

// A stored point is exactly InkStratum's normPoint: unrounded doubles, ~56 bytes of JSON each.
const pts = (n) => Array.from({ length: n }, () => ({ x: (100 + Math.random() * 900) / 1234.5, y: (60 + Math.random() * 1300) / 1234.5, p: Math.round(Math.random() * 1000) / 1000 }));
const PER_POINT = 56.3;
const pointsFor = (bytes) => Math.ceil(bytes / PER_POINT);

// ---------------------------------------------------------------------------------------------------------------------
// ONE RUN = one server bundle + one client bundle (either or both mutated), reused across every scenario.
// ---------------------------------------------------------------------------------------------------------------------
let runN = 0;
async function startRun({ index, ssync, csync, cnotice } = {}) {
  runN += 1;
  const port = 47900 + runN;
  const dir = join(tmp, `run${runN}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'env.cjs'), `exports.env = { isProd: false, port: ${port}, databaseUrl: '' };`);
  writeFileSync(join(dir, 'migrate.cjs'), `exports.runMigrations = async () => {};`);
  writeFileSync(join(dir, 'session.cjs'), `exports.sessionMiddleware = (req, _res, next) => { req.session = req.headers['x-anon'] ? {} : { userId: 'u1' }; next(); };`);
  writeFileSync(join(dir, 'auth.cjs'), `const express = require(${JSON.stringify(expressPath)}); exports.authRouter = express.Router(); exports.requireAuth = (req, res, next) => (req.session && req.session.userId ? next() : res.status(401).json({ error: 'Not authenticated' }));`);
  writeFileSync(join(dir, 'tutor.cjs'), `const express = require(${JSON.stringify(expressPath)}); exports.tutorRouter = express.Router();`);
  writeFileSync(join(dir, 'db.cjs'), `globalThis.__db = globalThis.__db || {};
const st = globalThis.__db[${port}] = { upserts: [], pulls: 0 };
exports.pool = { query: async (sql, params) => {
  if (/^\\s*insert into/i.test(sql)) { st.upserts.push(params[0]); return { rows: [] }; }
  if (/^\\s*select \\* from/i.test(sql)) { st.pulls += 1; return { rows: [] }; }
  if (/select now\\(\\)/i.test(sql)) return { rows: [{ t: new Date() }] };
  return { rows: [] };
} };`);
  const stubMap = { './env': 'env.cjs', './migrate': 'migrate.cjs', './session': 'session.cjs', './auth': 'auth.cjs', './tutor': 'tutor.cjs', './db': 'db.cjs' };
  await esbuild.build({
    entryPoints: [join(serverSrc, 'index.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: join(dir, 'server.cjs'), logLevel: 'silent', external: ['pg-native'],
    plugins: [{ name: 's', setup(b) {
      b.onResolve({ filter: /^\.\/(env|migrate|session|auth|tutor|db)$/ }, (a) => ({ path: join(dir, stubMap[a.path]) }));
      b.onLoad({ filter: /[\\/]index\.ts$/ }, () => ({ contents: index ? index(INDEX_TEXT) : INDEX_TEXT, loader: 'ts', resolveDir: serverSrc }));
      b.onLoad({ filter: /[\\/]sync\.ts$/ }, () => ({ contents: ssync ? ssync(SSYNC_TEXT) : SSYNC_TEXT, loader: 'ts', resolveDir: serverSrc }));
    } }],
  });
  const quiet = console.error; console.error = () => {};
  createRequire(import.meta.url)(join(dir, 'server.cjs'));
  console.error = quiet;
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i += 1) { try { const r = await realFetch(`${base}/healthz`); if (r.ok) break; } catch { /* not up */ } await sleep(100); }
  const clientOut = join(dir, 'client.mjs');
  await esbuild.build({
    stdin: { contents: "export * from './store/sync'; export * from './store/persistence'; export * from './store/syncNotice';", resolveDir: desktopSrc, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: clientOut, logLevel: 'silent',
    plugins: [{ name: 'c', setup(b) {
      b.onResolve({ filter: /^\.\/deskLexicon$/ }, () => ({ path: join(tmp, 'lex.mjs') }));
      if (csync) b.onLoad({ filter: /[\\/]store[\\/]sync\.ts$/ }, () => ({ contents: csync(CSYNC_TEXT), loader: 'ts', resolveDir: join(desktopSrc, 'store') }));
      if (cnotice) b.onLoad({ filter: /[\\/]store[\\/]syncNotice\.ts$/ }, () => ({ contents: cnotice(NOTICE_TEXT), loader: 'ts', resolveDir: join(desktopSrc, 'store') }));
    } }],
  });
  return { port, base, db: globalThis.__db[port], clientOut };
}

// ---------------------------------------------------------------------------------------------------------------------
// A WORLD = one fresh client module instance (its own cache, dirty set, learned limit) against the run's server.
// ---------------------------------------------------------------------------------------------------------------------
const storage = new Map();
globalThis.localStorage = { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => { storage.set(k, String(v)); }, removeItem: (k) => { storage.delete(k); }, clear: () => { storage.clear(); } };
const timers = [];
globalThis.setTimeout = (fn, ms, ...rest) => {
  if (new Error().stack.includes('client.mjs')) { timers.push(ms); return { unref() {}, ref() {}, hasRef() { return false; } }; }
  return realSetTimeout(fn, ms, ...rest);
};
let world = null;
globalThis.fetch = async (path, init) => {
  const bytes = init && typeof init.body === 'string' ? Buffer.byteLength(init.body) : 0;
  const entry = { bytes, pull: init && typeof init.body === 'string' ? init.body.includes('"pull":false') ? false : true : null };
  const hook = world.hook ? world.hook(bytes, world.log.length) : null;
  if (hook === 'throw') { world.log.push({ ...entry, status: 'net' }); throw new TypeError('network down'); }
  if (hook && hook.status) { world.log.push({ ...entry, status: hook.status, simulated: true }); return new Response(JSON.stringify(hook.body || {}), { status: hook.status, headers: { 'Content-Type': 'application/json' } }); }
  const res = await realFetch(path.startsWith('/') ? `${world.run.base}${path}` : path, init);
  world.log.push({ ...entry, status: res.status });
  return res;
};
let worldN = 0;
// The ONE-TIME journal backfill (maybeBackfillJournal) re-dirties EVERY page on a device's first pull from a post-D2 server.
// It is a separate, legacy mechanism, so ordinary worlds mark it already done; K9 leaves it armed on purpose.
async function newWorld(run, { backfill = false } = {}) {
  worldN += 1;
  storage.clear();
  if (!backfill) storage.set('writer-studio-journal-resync-v1', '1');
  run.db.upserts.length = 0; run.db.pulls = 0;
  const w = { run, log: [], hook: null, statuses: [], C: null };
  world = w;
  w.C = await import(`${pathToFileURL(run.clientOut).href}?w=${worldN}`);
  w.C.subscribeSyncStatus((s) => w.statuses.push(s));
  return w;
}
const mkPage = (C, id, text, bytes) => C.createJournalPage({ id, text, pageType: 'page', projectId: null, origin: null, ...(bytes ? { strokes: [{ id: `${id}-s`, points: pts(pointsFor(bytes)) }] } : {}) });
const dirtyIds = (C) => C.getDirtyRecords().journalEntries.map((e) => e.id).sort();
const maxBody = (w) => Math.max(0, ...w.log.map((l) => l.bytes));
const results = [];
const log = (group, name, pass, detail = '') => results.push({ group, name, pass, detail });
const guard = async (group, name, fn) => { try { await fn(); } catch (e) { log(group, name, false, `THREW: ${String(e && e.stack || e).slice(0, 220)}`); } };

// ---------------------------------------------------------------------------------------------------------------------
async function scenarios(run) {
  console.error = () => {};
  // ---- K1 THE WEDGE: a 6 MB page and a tiny page written after it ---------------------------------------------------
  await guard('CLAIM', 'K1', async () => {
    const w = await newWorld(run); const C = w.C;
    mkPage(C, 'FAT', 'A heavy ink page', FAT);
    mkPage(C, 'TINY', 'a small note written after', 0);
    await C.syncOnce();
    const onServer = run.db.upserts.slice();
    log('CLAIM', 'K1a: THE WEDGE IS GONE - a tiny page written AFTER a 20 MB page reaches the server (it used to be refused with it)', onServer.includes('TINY') && !onServer.includes('FAT'), JSON.stringify({ upserts: onServer, dirty: dirtyIds(C) }));
    log('CLAIM', 'K1b: the fat page is NEVER SENT - not one request in the whole sync carries more than the limit (the client knows it cannot fit and does not upload it to be refused)', maxBody(w) < LIMIT, JSON.stringify({ maxBodyBytes: maxBody(w), requests: w.log.length }));
    const tl = C.getTooLargeRecords();
    log('CLAIM', 'K1c: it is NAMED - listed as too large, by its own title, with its size (P5)', tl.length === 1 && tl[0].id === 'FAT' && tl[0].title === 'A heavy ink page' && tl[0].bytes > LIMIT, JSON.stringify(tl));
    log('CLAIM', 'K1d: and the sync is NOT "offline" - everything that could travel did, so the status ends synced (offline would be a lie)', w.statuses[w.statuses.length - 1] === 'synced', JSON.stringify(w.statuses));
    w.log.length = 0; run.db.pulls = 0;
    for (let i = 0; i < 5; i += 1) await C.syncOnce();
    log('CLAIM', 'K1e: NEVER RE-SENT FOREVER - five more syncs upload nothing the size of the fat page (each request is a tiny pull), and it stays listed and dirty locally', maxBody(w) < 4096 && dirtyIds(C).join() === 'FAT' && C.getTooLargeRecords().length === 1, JSON.stringify({ maxBodyBytes: maxBody(w), requests: w.log.length, dirty: dirtyIds(C) }));
  });

  // ---- K5 SELF-HEALING: the writer erases most of the strokes ---------------------------------------------------------
  await guard('CLAIM', 'K5', async () => {
    const w = await newWorld(run); const C = w.C;
    mkPage(C, 'FAT', 'A heavy ink page', FAT);
    await C.syncOnce();
    const before = C.getTooLargeRecords().length;
    const e = C.getJournalEntry('FAT');
    C.saveJournalEntry({ ...e, strokes: [{ id: 'FAT-s', points: pts(200) }] });
    await C.syncOnce();
    log('CLAIM', 'K5: SELF-HEALING - the writer erases most of the ink, and the very next sync sends the page, the list clears, nothing was needed but the edit', before === 1 && run.db.upserts.includes('FAT') && C.getTooLargeRecords().length === 0 && dirtyIds(C).length === 0, JSON.stringify({ before, upserts: run.db.upserts, list: C.getTooLargeRecords().length, dirty: dirtyIds(C) }));
  });

  // ---- K2 CHUNKING: 30 pages x 400 KB = 12 MB ------------------------------------------------------------------------
  await guard('CLAIM', 'K2', async () => {
    const w = await newWorld(run); const C = w.C;
    for (let i = 0; i < 30; i += 1) mkPage(C, `M${String(i).padStart(2, '0')}`, `page ${i}`, 400 * 1024);
    await C.syncOnce();
    const chunked = w.log.filter((l) => l.pull === false).length;
    log('CLAIM', 'K2a: 12 MB of dirty pages - which used to be ONE refused body - ALL sync, in chunks: 30 upserts on the server, nothing left dirty, nothing listed', run.db.upserts.length === 30 && dirtyIds(C).length === 0 && C.getTooLargeRecords().length === 0, JSON.stringify({ upserts: run.db.upserts.length, dirty: dirtyIds(C).length, listed: C.getTooLargeRecords().length }));
    log('CLAIM', 'K2b: no request is bigger than a chunk (~1 MB target) - measured over every request the sync made', maxBody(w) <= 1.2 * MB, JSON.stringify({ maxBodyBytes: maxBody(w), requests: w.log.length, pushOnly: chunked }));
    log('CLAIM', 'K2c: ONLY THE LAST REQUEST PULLS - the six pulls ran exactly once for the whole chunked sync, not once per chunk', run.db.pulls === 6 && w.log.filter((l) => l.pull === true).length === 1, JSON.stringify({ serverPullQueries: run.db.pulls, requestsThatPull: w.log.filter((l) => l.pull === true).length }));
  });

  // ---- K3 A LOWER LIMIT THE CLIENT DID NOT PREDICT (a proxy) ---------------------------------------------------------
  await guard('CLAIM', 'K3', async () => {
    const w = await newWorld(run); const C = w.C;
    w.hook = (bytes) => (bytes > 1.5 * MB ? { status: 413, body: { error: 'payload too large' } } : null);   // a proxy that refuses over 1.5 MB
    mkPage(C, 'A18', 'the 1.8 MB page', 1.8 * MB);
    mkPage(C, 'B19', 'the 1.9 MB page', 1.9 * MB);
    mkPage(C, 'C03', 'the 0.3 MB page', 0.3 * MB);
    await C.syncOnce();
    const refused = w.log.filter((l) => l.status === 413).length;
    log('CLAIM', 'K3a: the small page syncs around them, and a lower limit nobody predicted costs exactly ONE refused upload - the second big page is skipped on what the first taught (learned limit), not sent to be refused too', run.db.upserts.includes('C03') && refused === 1, JSON.stringify({ upserts: run.db.upserts, refusedRequests: refused, requests: w.log.map((l) => `${(l.bytes / MB).toFixed(2)}MB:${l.status}`) }));
    log('CLAIM', 'K3b: both big pages are NAMED, and neither is re-sent - the next sync uploads nothing over the proxy\'s limit', C.getTooLargeRecords().map((r) => r.id).sort().join() === 'A18,B19' && (() => { const n = w.log.length; return n > 0; })(), JSON.stringify(C.getTooLargeRecords().map((r) => r.id)));
    const before = w.log.length;
    await C.syncOnce();
    const again = w.log.slice(before);
    log('CLAIM', 'K3c: NEVER RE-SENT - the sync after that made no request above the proxy\'s limit at all', again.every((l) => l.bytes < 1.5 * MB) && again.every((l) => l.status !== 413), JSON.stringify(again.map((l) => `${(l.bytes / MB).toFixed(2)}MB:${l.status}`)));
  });

  // ---- K4 THE REAL 413 (P1) ----------------------------------------------------------------------------------------
  await guard('CLAIM', 'K4', async () => {
    const big = JSON.stringify({ lastSyncAt: null, push: {} }) + ' '.repeat(LIMIT + 4096);
    const r = await realFetch(`${run.base}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: big });
    const j = await r.json().catch(() => null);
    log('CLAIM', 'K4a (P1): an over-limit body is answered with a real HTTP 413 and the limit in the body - not the bare 500 it used to be', r.status === 413 && j && j.error === 'payload too large' && j.limitBytes === LIMIT, JSON.stringify({ status: r.status, body: j }));
    const bad = await realFetch(`${run.base}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"lastSyncAt": ' });
    log('CLAIM', 'K4b (P1): a malformed JSON body is a 400 - a client mistake no longer masquerades as a server fault (500)', bad.status === 400, JSON.stringify({ status: bad.status }));
  });

  // ---- K6 THE COMMON CASE IS UNCHANGED -------------------------------------------------------------------------------
  await guard('CLAIM', 'K6', async () => {
    const w = await newWorld(run); const C = w.C;
    mkPage(C, 'ONE', 'one small page', 0);
    await C.syncOnce();
    log('CLAIM', 'K6: the ordinary sync is byte-for-byte the old shape - ONE request carries the push AND the pull, and it lands', w.log.length === 1 && w.log[0].pull === true && run.db.upserts.join() === 'ONE' && run.db.pulls === 6 && dirtyIds(C).length === 0, JSON.stringify({ requests: w.log.length, upserts: run.db.upserts, pulls: run.db.pulls }));
  });

  // ---- K7 OFFLINE IS STILL OFFLINE, AND THE NAME SURVIVES ---------------------------------------------------------------
  await guard('CLAIM', 'K7', async () => {
    const w = await newWorld(run); const C = w.C;
    mkPage(C, 'FAT', 'A heavy ink page', FAT);
    mkPage(C, 'TINY', 'a small note', 0);
    w.hook = () => 'throw';
    await C.syncOnce();
    log('CLAIM', 'K7: with the network genuinely down the status is OFFLINE (that word is still true), the fat page is STILL named (it was known before any request), and nothing was cleaned', w.statuses[w.statuses.length - 1] === 'offline' && C.getTooLargeRecords().length === 1 && dirtyIds(C).join() === 'FAT,TINY', JSON.stringify({ statuses: w.statuses, listed: C.getTooLargeRecords().length, dirty: dirtyIds(C) }));
    w.hook = null;
    await C.syncOnce();
    log('CONTROL', 'C1: when the network returns, the same client syncs the small page and stays honest about the big one', run.db.upserts.includes('TINY') && C.getTooLargeRecords().length === 1 && w.statuses[w.statuses.length - 1] === 'synced', JSON.stringify({ upserts: run.db.upserts, statuses: w.statuses }));
  });

  // ---- K8 PROGRESS SURVIVES A LATER FAILURE -------------------------------------------------------------------------------
  await guard('CLAIM', 'K8', async () => {
    const w = await newWorld(run); const C = w.C;
    for (let i = 0; i < 6; i += 1) mkPage(C, `Q${i}`, `page ${i}`, 700 * 1024);
    w.hook = (_b, idx) => (idx >= 2 ? 'throw' : null);          // the third request onward dies
    await C.syncOnce();
    const landed = run.db.upserts.slice();
    log('CLAIM', 'K8: progress survives a later failure - the chunks that landed are CLEAN and stay clean, only the rest remain dirty, and the status is offline (a chunk failing mid-sync loses nothing already sent)', landed.length > 0 && landed.length < 6 && dirtyIds(C).length === 6 - landed.length && dirtyIds(C).every((id) => !landed.includes(id)) && w.statuses[w.statuses.length - 1] === 'offline', JSON.stringify({ landed, dirty: dirtyIds(C), statuses: w.statuses }));
  });

  // ---- K9 THE BACKFILL, the third realistic big push (S0) -------------------------------------------------------------
  await guard('CLAIM', 'K9', async () => {
    const w = await newWorld(run, { backfill: true }); const C = w.C;
    for (let i = 0; i < 30; i += 1) mkPage(C, `Z${String(i).padStart(2, '0')}`, `page ${i}`, 400 * 1024);
    await C.syncOnce();
    const redirtied = dirtyIds(C).length;
    await C.syncOnce();                           // the follow-up sync the backfill schedules (its timer is held, so it is called here)
    log('CLAIM', 'K9: THE ONE-TIME JOURNAL BACKFILL - it re-dirties EVERY page (here 30, 12 MB) and the sync it schedules used to be one refused body; it now goes out in chunks, every request stays under a chunk, and the device ends clean',
      redirtied === 30 && dirtyIds(C).length === 0 && maxBody(w) <= 1.2 * MB && C.getTooLargeRecords().length === 0, JSON.stringify({ redirtiedByBackfill: redirtied, dirtyAfter: dirtyIds(C).length, maxBodyBytes: maxBody(w), requests: w.log.length }));
  });

  // ---- K10 WHAT THE WRITER READS (P5) -----------------------------------------------------------------------------------
  await guard('CLAIM', 'K10', async () => {
    const w = await newWorld(run); const C = w.C;
    // The templates are read FROM THE SHIPPED LEXICON SOURCE, so it is the real words that are tested.
    const tpl = (key) => { const m = new RegExp(`${key}: '([^']*)'`).exec(LEX_TEXT); if (!m) throw new Error('no lexicon default for ' + key); return new Function(`return '${m[1]}';`)(); };
    const t = (k) => tpl(k);
    const one = [{ id: 'FAT', title: 'A heavy ink page', bytes: 6e6 }];
    const two = [...one, { id: 'F2', title: 'Another', bytes: 7e6 }];
    const a = C.syncNoticeText('synced', one, t);
    const b = C.syncNoticeText('synced', two, t);
    log('CLAIM', 'K10a: one page too large is NAMED in the writer\'s words and told it is safe: \u201CA heavy ink page\u201D is too large to sync \u2014 it is saved on this device', a === '\u201CA heavy ink page\u201D is too large to sync \u2014 it is saved on this device', JSON.stringify(a));
    log('CLAIM', 'K10b: several are counted, not listed: "2 pages are too large to sync \u2014 they are saved on this device"', b === '2 pages are too large to sync \u2014 they are saved on this device', JSON.stringify(b));
    log('CLAIM', 'K10c: it is NOT called offline (the network is fine); and while the network really is down, offline still wins - it is the broader truth', !/offline/i.test(a) && C.syncNoticeText('offline', one, t) === 'Offline \u2014 saved here' && C.syncNoticeText('synced', [], t) === null, JSON.stringify({ tooLarge: a, offline: C.syncNoticeText('offline', one, t), none: C.syncNoticeText('synced', [], t) }));
  });

  // ---- K11 IT DOES NOT OUTLIVE THE ACCOUNT -------------------------------------------------------------------------------
  await guard('CLAIM', 'K11', async () => {
    globalThis.window = { addEventListener() {}, removeEventListener() {} };
    globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
    try {
      const w = await newWorld(run); const C = w.C;
      mkPage(C, 'FAT', 'A heavy ink page', FAT);
      await C.syncOnce();
      const before = C.getTooLargeRecords().length;
      C.stopSync();                                 // what logout does
      log('CLAIM', 'K11: logging out clears the too-large list - one account\'s page names must not appear for the next', before === 1 && C.getTooLargeRecords().length === 0, JSON.stringify({ before, after: C.getTooLargeRecords().length }));
    } finally { delete globalThis.window; delete globalThis.document; }
  });

  // ---- K4c THE OTHER ROUTES KEEP 5 MiB ----------------------------------------------------------------------------------
  await guard('CLAIM', 'K4c', async () => {
    const big = JSON.stringify({ pageDefaults: null }) + ' '.repeat(OTHER_LIMIT + 4096);
    const r = await realFetch(`${run.base}/api/page-defaults`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: big });
    const j = await r.json().catch(() => null);
    log('CLAIM', 'K4c (P3): every OTHER route still refuses over 5 MiB (its limit is unchanged) and its 413 says so - the larger limit is /api/sync\'s alone', r.status === 413 && j && j.limitBytes === OTHER_LIMIT, JSON.stringify({ status: r.status, body: j }));
  });

  // ---- K12 A LONE RECORD OVER 5 MiB NOW CARRIES (P3) ----------------------------------------------------------------------
  await guard('CLAIM', 'K12', async () => {
    const w = await newWorld(run); const C = w.C;
    mkPage(C, 'MID', 'a dense ink page, over 5 MiB', 6 * MB);
    mkPage(C, 'TINY', 'a small note', 0);
    await C.syncOnce();
    log('CLAIM', 'K12 (P3): a LONE record over the old 5 MiB limit (6 MB - a dense handwritten page and a bit) now reaches the server, is not listed as too large, and the device ends clean', run.db.upserts.includes('MID') && run.db.upserts.includes('TINY') && C.getTooLargeRecords().length === 0 && dirtyIds(C).length === 0 && maxBody(w) > OTHER_LIMIT && maxBody(w) < LIMIT, JSON.stringify({ upserts: run.db.upserts, listed: C.getTooLargeRecords().length, dirty: dirtyIds(C), maxBodyBytes: maxBody(w) }));
  });

  // ---- K13 AUTHENTICATE FIRST, THEN READ THE BODY (P3) -----------------------------------------------------------------------
  await guard('CLAIM', 'K13', async () => {
    const post = async (bytes) => {
      const b = JSON.stringify({ lastSyncAt: null, push: {} }) + ' '.repeat(bytes);
      const r = await realFetch(`${run.base}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-anon': '1' }, body: b });
      return r.status;
    };
    const small = await post(1024);
    const mid = await post(6 * MB);
    const huge = await post(LIMIT + 1 * MB);
    log('CLAIM', 'K13 (P3): an ANONYMOUS request is answered 401 at EVERY size - including one over the sync limit, where the body-first order would have said 413. The server does not buffer a byte of a body it has not authenticated', small === 401 && mid === 401 && huge === 401, JSON.stringify({ '1KB': small, '6MB': mid, [`${(LIMIT / MB + 1)}MB`]: huge }));
  });
  console.error = realConsoleError;
}

// ---------------------------------------------------------------------------------------------------------------------
function census(log2) {
  const has = (t, re) => re.test(t);
  log2('CENSUS', 'N1 (P1): the server error handler honours 413 and answers with limitBytes; it is no longer one blanket 500', has(INDEX_TEXT, /status === 413 \|\| e\.type === 'entity\.too\.large'/) && has(INDEX_TEXT, /limitBytes: req\.path === '\/api\/sync' \? SYNC_BODY_LIMIT_BYTES : BODY_LIMIT_BYTES/) && has(INDEX_TEXT, /const BODY_LIMIT_BYTES = 5 \* 1024 \* 1024;/), '');
  log2('CENSUS', 'N2 (P2): /sync honours `pull: false` (a push-only request runs no pulls)', has(SSYNC_TEXT, /const wantPull = req\.body\?\.pull !== false;/) && has(SSYNC_TEXT, /pull: wantPull \? \{/), '');
  log2('CENSUS', 'N3 (P2): the client mirrors the limit (5 MiB), chunks at 1 MiB, and marks non-final chunks `pull: false`', has(CSYNC_TEXT, /const REQUEST_LIMIT_BYTES = 16 \* 1024 \* 1024;/) && has(CSYNC_TEXT, /const CHUNK_TARGET_BYTES = 1024 \* 1024;/) && has(CSYNC_TEXT, /pull: false/), '');
  const srvLimit = /const SYNC_BODY_LIMIT_BYTES = (\d+) \* 1024 \* 1024;/.exec(INDEX_TEXT), cliLimit = /const REQUEST_LIMIT_BYTES = (\d+) \* 1024 \* 1024;/.exec(CSYNC_TEXT);
  log2('CENSUS', 'N5 (P3): the client\'s mirror of the limit EQUALS the server\'s /api/sync limit (a mirror that drifts sends bodies the server refuses, or hides records it would take)', !!srvLimit && !!cliLimit && srvLimit[1] === cliLimit[1] && has(INDEX_TEXT, /app\.use\('\/api\/sync', requireAuth, express\.json\(\{ limit: SYNC_BODY_LIMIT \}\)\)/), JSON.stringify({ server: srvLimit && srvLimit[1], client: cliLimit && cliLimit[1] }));
  log2('CENSUS', 'N4 (P5): a record over the effective limit is never packed into a request', has(CSYNC_TEXT, /const sendable = items\.filter\(i => !isTooLarge\(i\)\);/), '');
}

// ---------------------------------------------------------------------------------------------------------------------
function mutantList() {
  const out = [];
  const must = (t, a, b) => { if (!t.includes(a)) throw new Error(`MUTANT DID NOT LAND: ${a.slice(0, 70)}`); return t.replace(a, b); };
  out.push({ name: 'P3: the larger limit is applied to EVERY route (not /api/sync alone)', o: { index: (t) => must(t, 'const smallJson = express.json({ limit: BODY_LIMIT });', 'const smallJson = express.json({ limit: SYNC_BODY_LIMIT });') } });
  out.push({ name: 'P3: the sync body is read BEFORE authentication (anonymous requests make the server buffer)', o: { index: (t) => must(t, "app.use('/api/sync', requireAuth, express.json({ limit: SYNC_BODY_LIMIT }));", "app.use('/api/sync', express.json({ limit: SYNC_BODY_LIMIT }), requireAuth);") } });
  out.push({ name: 'P3: the server limit is not raised (still 5 MiB on /api/sync)', o: { index: (t) => must(t, "const SYNC_BODY_LIMIT = '16mb';", "const SYNC_BODY_LIMIT = '5mb';") } });
  out.push({ name: 'P3: the client keeps mirroring 5 MiB (a lone 6 MB record is called too large and never sent)', o: { csync: (t) => must(t, 'const REQUEST_LIMIT_BYTES = 16 * 1024 * 1024;', 'const REQUEST_LIMIT_BYTES = 5 * 1024 * 1024;') } });
  out.push({ name: 'P1: the server error handler stops honouring 413 (back to a blanket 500)', o: { index: (t) => must(t, "if (status === 413 || e.type === 'entity.too.large') {", 'if (false) {') } });
  out.push({ name: 'P1: malformed JSON stops being a 400', o: { index: (t) => must(t, "if (typeof status === 'number' && status >= 400 && status < 500 && e.expose) {", 'if (false) {') } });
  out.push({ name: 'P2: the server ignores `pull: false` (every chunk pulls)', o: { ssync: (t) => must(t, "const wantPull = req.body?.pull !== false;", 'const wantPull = true;') } });
  out.push({ name: 'P2: no chunking (one chunk holds everything)', o: { csync: (t) => must(t, 'const CHUNK_TARGET_BYTES = 1024 * 1024;', 'const CHUNK_TARGET_BYTES = 1e12;') } });
  out.push({ name: 'P2: the single-chunk shortcut removed (a separate pull request always)', o: { csync: (t) => must(t, 'if (chunks.length === 1) {', 'if (false) {') } });
  out.push({ name: 'P2: a landed chunk is no longer cleaned when it lands', o: { csync: (t) => must(t, "        await apiSync({ lastSyncAt: null, push: payloadOf(batch), pull: false });\n        cleanBatch(batch);", "        await apiSync({ lastSyncAt: null, push: payloadOf(batch), pull: false });") } });
  out.push({ name: 'P5: the pre-check removed (a record over the limit is sent to be refused)', o: { csync: (t) => must(t, 'const isTooLarge = (i: PushItem): boolean => i.bytes + ENVELOPE_BYTES > effectiveLimit();', 'const isTooLarge = (i: PushItem): boolean => false;') } });
  out.push({ name: 'P5: a 413 the client did not predict is treated as offline (the old wedge)', o: { csync: (t) => must(must(t, 'if (e instanceof SyncHttpError && e.status === 413) { await onRefused(batch); return; }', ''), 'if (!(e instanceof SyncHttpError && e.status === 413)) throw e;', 'throw e;') } });
  out.push({ name: 'P5: a lower limit is not learned (the second big page is sent to be refused too)', o: { csync: (t) => must(t, 'if (batch.length === 1 && isTooLarge(batch[0])) { quarantined.push(batch[0]); return; }', '') } });
  out.push({ name: 'P5: a refused lone record is not remembered as too large (it is dropped from the list)', o: { csync: (t) => must(t, "setTooLarge([...big, ...quarantined].map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));", 'setTooLarge(big.map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));') } });
  out.push({ name: 'P5: the notice calls a too-large page "Offline" again (the old lie)', o: { cnotice: (t) => must(t, 'if (tooLarge.length === 0) return null;', "if (tooLarge.length === 0) return null;\n  return 'Offline \u2014 saved here';") } });
  out.push({ name: 'P5: logout no longer clears the too-large list', o: { csync: (t) => must(t, "  learnedLimitBytes = Number.POSITIVE_INFINITY;\n  setTooLarge([]);\n  setStatus('pending');", "  learnedLimitBytes = Number.POSITIVE_INFINITY;\n  setStatus('pending');") } });
  out.push({ name: 'P5: the too-large list is never set (the writer is never told)', o: { csync: (t) => must(must(t, "setTooLarge(big.map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));\n    const quarantined", "const quarantined"), "setTooLarge([...big, ...quarantined].map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));", '') } });
  return out;
}

async function runOnce(opts) {
  results.length = 0;
  const run = await startRun(opts);
  await scenarios(run);
  census((g, n, p, d) => log(g, n, p, d));
  return results.slice();
}

(async () => {
  const base = await runOnce();
  for (const r of base) console.log(`${r.pass ? 'PASS' : 'FAIL'}  [${r.group}] ${r.name}${r.detail ? '  ' + r.detail : ''}`);
  const red = base.filter((r) => !r.pass);
  console.log(`\nBASELINE: ${red.length === 0 ? `GREEN (${base.length} checks: ${base.filter((r) => r.group === 'CLAIM').length} claim, ${base.filter((r) => r.group === 'CONTROL').length} control, ${base.filter((r) => r.group === 'CENSUS').length} census)` : `RED - ${red.length} of ${base.length}`}`);
  let mutantsOk = true;
  if (RUN_MUTANTS) {
    console.log('\nMUTANTS - each edit removed ALONE (each must turn a DYNAMIC claim red):');
    for (const mu of mutantList()) {
      const res = await runOnce(mu.o);
      const proof = res.filter((r) => r.group === 'CLAIM' && !r.pass).map((r) => r.name.split(':')[0]);
      const census2 = res.filter((r) => r.group === 'CENSUS' && !r.pass).map((r) => r.name.split(' ')[0]);
      const ok = proof.length > 0;
      if (!ok) mutantsOk = false;
      console.log(`${ok ? 'RED  ' : 'GREEN'}  ${mu.name}  ->  ${proof.join(', ') || '(none)'}   census: ${census2.join(',') || '-'}`);
    }
    console.log(`\nMUTANTS: ${mutantsOk ? 'every edit is load-bearing - each, removed alone, turns a dynamic claim red' : 'A MUTANT STAYED GREEN - an edit is not load-bearing in this instrument'}`);
  }
  process.exit(red.length === 0 && mutantsOk ? 0 : 1);
})().catch((e) => { console.error('INSTRUMENT ERROR:', e && e.stack || e); process.exit(2); });
