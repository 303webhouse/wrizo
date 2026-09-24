// ITEM 144 — THE TWO-DEVICE ROUND TRIP for "beside" connections (`besideLinks` /
// `beside_links`). Fable's approval condition, verbatim in spirit:
//   • connect on A -> B pulls and BOTH boards show it;
//   • unlink on B -> A pulls and it is gone at both ends;
//   • the same-moment double connect: two records, ONE shown, ONE unlink clears both.
// …and the pairing check ("the second to merge renumbers $N and re-runs the pairing
// check") is built in, so re-running this file IS that re-run.
//
// BROWSERLESS. No box turn, no browser, no Postgres. What runs is THE REAL CODE on
// both sides:
//   • the SERVER: the actual `apps/server/src/sync.ts` router, bundled with esbuild,
//     its /sync handler called directly. Only the pool and auth are faked.
//   • the DEVICES: two independent instances of the actual client store
//     (`persistence.ts` + `boardBeside.ts`), each with its own localStorage, driven
//     through the real `getDirtyRecords` / `applyRemoteRecords` / `markClean` — the
//     same loop `store/sync.ts`'s `syncOnce` runs.
//
// THE FAKE POOL IS NOT A SQL ENGINE, AND IT DOES NOT PRETEND TO BE. It interprets ONLY
// the two statements /sync sends for journal entries, and it interprets them FROM THE
// SQL TEXT ITSELF — the column list, the placeholder list, the on-conflict SET list —
// not from a hand-written model of what they should be. That is the point: if a site
// is missing, or `$N` is off by one, the fake sees exactly what Postgres would (a
// column/placeholder/parameter count mismatch, a column the conflict clause never
// updates, a value in the wrong column) and the round trip goes red. A test that
// re-typed the expected columns would test the typo, not the code.
//
// FALSIFICATION (run last, and part of the verdict): the round trip is re-run against
// the server source with ONE of the six edits removed at a time. Each mutant MUST go
// red, and each must go red for ITS OWN reason. A green mutant means that edit was not
// load-bearing in the test — which would be a defect in the test, reported as such.
//
// Run: node apps/desktop/scripts/beside-roundtrip-proof.mjs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const desktopSrc = join(repo, 'apps/desktop/src');
const serverSrc = join(repo, 'apps/server/src');
const SYNC_PATH = join(serverSrc, 'sync.ts');

// esbuild ships with vite (a desktop dependency); resolve it through vite so this
// script needs no install of its own.
const desktopRequire = createRequire(join(repo, 'apps/desktop/package.json'));
const viteRequire = createRequire(desktopRequire.resolve('vite'));
const esbuild = viteRequire('esbuild');

// Build artefacts go to the OS temp dir, never into the repo (`railway up` uploads the
// working directory; a stray artefact in the tree is a stray that can ship).
const tmp = join(tmpdir(), 'wrizo-beside-roundtrip');
mkdirSync(tmp, { recursive: true });
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));
const realSetTimeout = globalThis.setTimeout;

// ---------------------------------------------------------------------------
// THE FAKE POOL — interprets /sync's two journal statements from their own SQL text.
// ---------------------------------------------------------------------------
function makePool() {
  const rows = new Map();
  const stats = { inserts: 0, pairing: [], errors: [] };
  const norm = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  const splitTop = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
  return {
    rows,
    stats,
    async query(sql, params = []) {
      try { return await this._query(sql, params); } catch (e) { stats.errors.push(String(e.message)); throw e; }
    },
    async _query(sql, params = []) {
      const s = norm(sql);
      if (/^insert into journal_entries/i.test(s)) {
        const m = /^insert into journal_entries \(([^)]*)\) values \((.*?)\) on conflict \(id\) do update set (.*?) where journal_entries\.user_id = excluded\.user_id and excluded\.updated_at > journal_entries\.updated_at$/i.exec(s);
        if (!m) throw new Error(`fake pool: cannot parse the journal upsert — /sync's SQL changed shape: ${s.slice(0, 120)}`);
        const cols = splitTop(m[1]);
        const phs = splitTop(m[2]);
        const sets = splitTop(m[3]).map((a) => { const [l, r] = a.split('=').map((x) => x.trim()); return { l, r }; });
        // THE PAIRING CHECK. Postgres would refuse a mismatch outright; a lenient fake
        // would not, so this throws exactly where the real thing would.
        if (cols.length !== phs.length) throw new Error(`PAIRING: ${cols.length} columns but ${phs.length} placeholders`);
        if (cols.length !== params.length) throw new Error(`PAIRING: ${cols.length} columns but ${params.length} parameters`);
        phs.forEach((ph, i) => {
          if (ph.replace(/::\w+$/, '') !== `$${i + 1}`) throw new Error(`PAIRING: placeholder ${i + 1} reads "${ph}" — placeholders must run $1..$${cols.length} in order`);
        });
        for (const { l, r } of sets) if (r !== `excluded.${l}`) throw new Error(`PAIRING: conflict clause "${l} = ${r}" does not set a column from its own excluded value`);
        stats.pairing.push({ columns: cols.length, params: params.length, hasBeside: cols.includes('beside_links'), besideInConflict: sets.some((x) => x.l === 'beside_links') });
        const row = {};
        cols.forEach((c, i) => { row[c] = /::jsonb$/i.test(phs[i]) ? (params[i] == null ? null : JSON.parse(params[i])) : params[i]; });
        stats.inserts += 1;
        const ex = rows.get(row.id);
        if (!ex) { rows.set(row.id, row); return { rows: [] }; }
        if (ex.user_id === row.user_id && String(row.updated_at) > String(ex.updated_at)) {
          for (const { l } of sets) ex[l] = row[l];
        }
        return { rows: [] };
      }
      if (/^select \* from journal_entries/i.test(s)) {
        const [userId, since] = params;
        return { rows: [...rows.values()].filter((r) => r.user_id === userId && (since == null || String(r.updated_at) > String(since))).map((r) => JSON.parse(JSON.stringify(r))) };
      }
      if (/^select \* from \w+/i.test(s)) return { rows: [] };
      throw new Error(`fake pool: unhandled statement: ${s.slice(0, 100)}`);
    },
  };
}

// ---------------------------------------------------------------------------
// BUILDS
// ---------------------------------------------------------------------------
const stubs = join(tmp, 'stubs');
mkdirSync(stubs, { recursive: true });
writeFileSync(join(stubs, 'db.mjs'), `export const pool = { query: (...a) => globalThis.__fakePool.query(...a) };`);
writeFileSync(join(stubs, 'auth.mjs'), `export const requireAuth = (_q, _s, next) => next();`);
writeFileSync(join(stubs, 'lexicon.mjs'), `export const deskTerm = (k) => k;`);

async function buildServer(name, transform) {
  const out = join(tmp, `${name}.cjs`);
  await esbuild.build({
    entryPoints: [SYNC_PATH], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent',
    plugins: [{
      name: 'server-stubs',
      setup(b) {
        b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(stubs, 'db.mjs') }));
        b.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: join(stubs, 'auth.mjs') }));
        if (transform) {
          b.onLoad({ filter: /sync\.ts$/ }, () => ({ contents: transform(readFileSync(SYNC_PATH, 'utf8')), loader: 'ts', resolveDir: serverSrc }));
        }
      },
    }],
  });
  return createRequire(import.meta.url)(out).syncRouter;
}

const BESIDE_PATH = join(desktopSrc, 'store/boardBeside.ts');
async function buildDevice(name, mutate) {
  const out = join(tmp, `device-${name}${mutate ? '-mut' : ''}.mjs`);
  await esbuild.build({
    stdin: { contents: "export * from './store/persistence'; export * from './store/boardBeside';", resolveDir: desktopSrc, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'lex', setup(b) {
      b.onResolve({ filter: /^\.\/deskLexicon$/ }, () => ({ path: join(stubs, 'lexicon.mjs') }));
      if (mutate) b.onLoad({ filter: /boardBeside\.ts$/ }, () => ({ contents: mutate(readFileSync(BESIDE_PATH, 'utf8')), loader: 'ts', resolveDir: join(desktopSrc, 'store') }));
    } }],
  });
  return out;
}

// Each device has its OWN storage; the proxy routes by whichever device is "current".
const storage = { A: new Map(), B: new Map() };
let current = 'A';
globalThis.localStorage = {
  getItem: (k) => (storage[current].has(k) ? storage[current].get(k) : null),
  setItem: (k, v) => { storage[current].set(k, String(v)); },
  removeItem: (k) => { storage[current].delete(k); },
  clear: () => { storage[current].clear(); },
};
// persistence.ts debounces its flush with setTimeout; a timer that fires later would write into
// whichever device is current THEN. The proof never reloads, so the debounce is simply inert.
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};

async function loadDevice(name, mutate) {
  const file = await buildDevice(name, mutate);
  current = name;
  return import(pathToFileURL(file).href);
}

// ---------------------------------------------------------------------------
// THE SYNC LOOP — store/sync.ts's `syncOnce`, minus the network.
// ---------------------------------------------------------------------------
async function makeWorld(serverRouter, deviceMutate) {
  const pool = makePool();
  globalThis.__fakePool = pool;
  const layer = serverRouter.stack.find((l) => l.route && l.route.path === '/sync' && l.route.methods.post);
  if (!layer) throw new Error('the /sync route was not found on the bundled router');
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  const call = (body) => new Promise((resolve, reject) => {
    handle({ session: { userId: 'u1' }, body }, { json: resolve }, (e) => reject(e || new Error('handler called next()')));
  });
  const devices = { A: await loadDevice('A', deviceMutate), B: await loadDevice('B', deviceMutate) };
  const lastSync = { A: null, B: null };
  const on = (name) => { current = name; return devices[name]; };
  const sync = async (name, fullPull = false) => {
    const d = on(name);
    const dirty = d.getDirtyRecords();
    const stamps = new Map(dirty.journalEntries.map((r) => [r.id, r.updatedAt]));
    const resp = await call({ lastSyncAt: fullPull ? null : lastSync[name], push: dirty });
    d.applyRemoteRecords(resp.pull);
    const still = new Map(d.getDirtyRecords().journalEntries.map((r) => [r.id, r.updatedAt]));
    d.markClean([...stamps].filter(([id, ts]) => !still.has(id) || still.get(id) === ts).map(([id]) => id));
    lastSync[name] = resp.serverTime;
    await sleep(3); // updated_at must strictly increase between writes
  };
  return { pool, on, sync, devices };
}

const idsBeside = (d, id) => d.getBoardsBeside(id).map((b) => b.id).sort().join(',');
const liveRecords = (d, id) => (d.getJournalEntry(id)?.besideLinks?.links ?? []).filter((l) => !l.deletedAt).length;

async function seedBoards(w) {
  const A = w.on('A');
  for (const id of ['X', 'Y']) A.createJournalPage({ id, text: id, pageType: 'board', projectId: null, origin: null });
  await sleep(3);
  await w.sync('A'); await w.sync('B');
}

// SCENARIO 1 — the round trip.
async function scenarioRoundTrip(w, log) {
  await seedBoards(w);
  const A = w.on('A');
  A.connectBeside('X', 'Y'); // stored on X, the board the writer stood on
  await sleep(3);
  await w.sync('A'); await w.sync('B');
  const B = w.on('B');
  log('1a: after A connects and B pulls, B shows X beside Y', idsBeside(B, 'X') === 'Y', idsBeside(B, 'X'));
  log('1a: … and BOTH boards show it — Y (which stored nothing) shows X by the reverse read', idsBeside(B, 'Y') === 'X', idsBeside(B, 'Y'));
  log('1a: the record crossed the wire intact (B holds one live record on X, none on Y)', liveRecords(B, 'X') === 1 && liveRecords(B, 'Y') === 0, `${liveRecords(B, 'X')}/${liveRecords(B, 'Y')}`);
  B.unlinkBeside('X', 'Y'); // unlink on B
  await sleep(3);
  await w.sync('B'); await w.sync('A');
  const A2 = w.on('A');
  log('1b: after B unlinks and A pulls, the connection is GONE at X', idsBeside(A2, 'X') === '', idsBeside(A2, 'X'));
  log('1b: … and gone at Y — both ends', idsBeside(A2, 'Y') === '', idsBeside(A2, 'Y'));
  const rec = (A2.getJournalEntry('X')?.besideLinks?.links ?? [])[0];
  log('1b: it arrived as a TOMBSTONE (deletedAt set on the record), not as a vanished column', !!rec && !!rec.deletedAt, JSON.stringify(rec));
  // null -> undefined: a board never connected pulls back with NO besideLinks key at all.
  log('1c: a board that was never connected (Y) round-trips with `besideLinks` ABSENT — SQL null → JS undefined, never null, never {}',
    !('besideLinks' in (A2.getJournalEntry('Y') ?? {})) && w.pool.rows.get('Y').beside_links === null, JSON.stringify(A2.getJournalEntry('Y')?.besideLinks));
}

// SCENARIO 2 — the same-moment double connect.
async function scenarioDoubleConnect(w, log) {
  await seedBoards(w);
  // Both devices connect the SAME pair, in OPPOSITE directions, before either syncs.
  w.on('A').connectBeside('X', 'Y');
  w.on('B').connectBeside('Y', 'X');
  await sleep(3);
  await w.sync('A'); await w.sync('B'); await w.sync('A');
  // FINDING (pre-existing, NOT this feature): /sync's incremental pull filters on the CLIENT-stamped
  // `updated_at > lastSyncAt`. B stamped Y BEFORE A's last sync (both connected "at the same moment"),
  // so A's incremental pull never returns it. Reported below, then A takes a FULL pull (the
  // `syncOnce(fullPull=true)` path the app already has) so the round trip can be judged on the feature.
  const aIncremental = liveRecords(w.on('A'), 'X') + liveRecords(w.on('A'), 'Y');
  await w.sync('A', true);
  const A = w.on('A'); const B = w.on('B');
  log("2 REPORT - after the same-moment double connect, A's ordinary (incremental) pull held " + aIncremental + " live record(s) and its FULL pull holds " + (liveRecords(A, 'X') + liveRecords(A, 'Y')) + ": the incremental filter is the client-stamped updated_at, so an edit stamped before the puller's last sync is missed until a full pull. Pre-existing for every collection; not caused or worsened by besideLinks.", true, 'incremental=' + aIncremental);
  const total = (d) => liveRecords(d, 'X') + liveRecords(d, 'Y');
  log('2a: the same-moment double connect leaves TWO live records for the one pair (one on each row — jsonb has no constraint)', total(A) === 2 && total(B) === 2, `A:${total(A)} B:${total(B)}`);
  log('2a: … but ONE connection is SHOWN — the reverse read dedupes the pair, on both devices',
    idsBeside(A, 'X') === 'Y' && idsBeside(A, 'Y') === 'X' && idsBeside(B, 'X') === 'Y' && idsBeside(B, 'Y') === 'X' && A.getBoardsBeside('X').length === 1, `${idsBeside(A, 'X')}|${idsBeside(A, 'Y')}`);
  A.unlinkBeside('X', 'Y');
  await sleep(3);
  await w.sync('A'); await w.sync('B');
  const B2 = w.on('B');
  log('2b: ONE unlink clears BOTH records — none live on either row', liveRecords(B2, 'X') + liveRecords(B2, 'Y') === 0, String(liveRecords(B2, 'X') + liveRecords(B2, 'Y')));
  log('2b: … and after it syncs, B shows nothing beside X or Y', idsBeside(B2, 'X') === '' && idsBeside(B2, 'Y') === '');
}

// /sync catches a failed upsert and only logs it (so one bad row cannot fail the whole push) — which
// means a PAIRING error would otherwise surface downstream as an unrelated missing row. Silence the
// log and re-raise the pool's own recorded error so a mutant goes red FOR ITS OWN REASON.
const realConsoleError = console.error;
// SCENARIO 3 — A CONNECTION NEVER BIRTHS A BOARD (Fable, byte review). The board the writer stands on is
// UNBORN (fresh from "Create a Board": a record-shaped slot, no row — PB1, "a board when it has a box").
// Connecting from it must not write it. The record rides the BORN end; once the unborn board is born (its
// first box), BOTH ends show the connection — on this device and, after a sync, on the other.
async function scenarioUnborn(w, log) {
  await seedBoards(w);
  const A = w.on('A');
  const slot = { id: 'U', text: '', projectId: null, source: 'page', origin: 'loose', pageType: 'board', boxes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  A.setUnbornEntry(slot);
  const rowsBefore = A.getAllUserBoards().length;
  const wrote = A.connectBeside('U', 'X'); // from = the unborn board
  const hasRow = A.getAllUserBoards().some((b) => b.id === 'U');
  log('3a: connecting FROM an unborn board wrote the connection (it rode the born end)', wrote === true);
  log('3a: … and the unborn board was NOT birthed — still no row (a connection never births a board)', hasRow === false && A.getAllUserBoards().length === rowsBefore, `rows ${rowsBefore}->${A.getAllUserBoards().length}`);
  log('3a: the record lives on X (the born end), naming U', (A.getJournalEntry('X')?.besideLinks?.links ?? []).some((l) => !l.deletedAt && l.boardId === 'U'));
  log('3a: X shows the unborn board beside it — and the unborn board sees X (the reverse read)', idsBeside(A, 'X') === 'U' && idsBeside(A, 'U') === 'X', `${idsBeside(A, 'X')}|${idsBeside(A, 'U')}`);
  log('3b: connecting an unborn board to ANOTHER unborn board writes nothing (no born end to carry it)', (() => { A.setUnbornEntry({ ...slot, id: 'U2' }); const r = A.connectBeside('U2', 'U'); A.setUnbornEntry(slot); return r === false; })());
  // Give it its first box — the ordinary birth: the row is written WITH content, then the slot clears.
  A.saveJournalEntry({ ...slot, boxes: [{ id: 'first', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'a first card' }] });
  A.setUnbornEntry(null);
  await sleep(3);
  log('3c: once it has a box it is born — and BOTH ends show the connection', idsBeside(A, 'U') === 'X' && idsBeside(A, 'X') === 'U' && A.getAllUserBoards().some((b) => b.id === 'U'), `${idsBeside(A, 'U')}|${idsBeside(A, 'X')}`);
  await w.sync('A'); await w.sync('B');
  const B = w.on('B');
  log('3d: and on the OTHER device after a sync — both ends show it', idsBeside(B, 'U') === 'X' && idsBeside(B, 'X') === 'U', `${idsBeside(B, 'U')}|${idsBeside(B, 'X')}`);
  // A trashed board on either end is refused.
  A.softDeleteEntry('Y');
  log('3e: connecting FROM a trashed board is refused (as a trashed OTHER already was)', w.on('A').connectBeside('Y', 'X') === false && w.on('A').connectBeside('X', 'Y') === false);
}

async function runAll(serverRouter, deviceMutate) {
  console.error = () => {};
  try { return await runAllInner(serverRouter, deviceMutate); } finally { console.error = realConsoleError; }
}
async function runAllInner(serverRouter, deviceMutate) {
  const results = [];
  const log = (name, pass, detail = '') => results.push({ name, pass: !!pass, detail });
  let world = await makeWorld(serverRouter, deviceMutate);
  // A pool error is the ROOT cause; whatever crashes downstream of a swallowed failed upsert is its shadow.
  const rootCause = (w, e) => { throw new Error(w.pool.stats.errors[0] ?? String(e && e.message)); };
  try { await scenarioRoundTrip(world, log); } catch (e) { rootCause(world, e); }
  const stats1 = world.pool.stats;
  if (stats1.errors.length) throw new Error(stats1.errors[0]);
  world = await makeWorld(serverRouter, deviceMutate);
  try { await scenarioDoubleConnect(world, log); } catch (e) { rootCause(world, e); }
  if (world.pool.stats.errors.length) throw new Error(world.pool.stats.errors[0]);
  world = await makeWorld(serverRouter, deviceMutate);
  try { await scenarioUnborn(world, log); } catch (e) { rootCause(world, e); }
  if (world.pool.stats.errors.length) throw new Error(world.pool.stats.errors[0]);
  return { results, pairing: stats1.pairing };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
const report = [];
let allPass = true;

const realRouter = await buildServer('sync-real', null);
{
  const { results, pairing } = await runAll(realRouter);
  const last = pairing[pairing.length - 1];
  results.unshift({
    name: 'PAIRING: the journal upsert\'s column list, placeholder list, conflict SET list and parameter array agree, and `beside_links` is in the columns AND the on-conflict clause',
    pass: !!last && last.columns === last.params && last.hasBeside && last.besideInConflict,
    detail: JSON.stringify(last),
  });
  for (const r of results) { report.push(r); if (!r.pass) allPass = false; }
}

// FALSIFICATION — each of the server's six edits removed in turn.
const MUTANTS = [
  { name: 'M1 read mapper (`besideLinks: r.beside_links ?? undefined`) removed', fn: (s) => s.replace(/^\s*besideLinks: r\.beside_links \?\? undefined,\s*$/m, '') },
  { name: 'M2 INSERT column list not extended (`, beside_links)` removed)', fn: (s) => s.replace('plan_board_id, page_settings, beside_links)', 'plan_board_id, page_settings)') },
  { name: 'M3 VALUES placeholder not extended (`,$25::jsonb` removed)', fn: (s) => s.replace('$24::jsonb,$25::jsonb)', '$24::jsonb)') },
  { name: 'M4 ON CONFLICT clause not extended (`beside_links = excluded.beside_links` removed)', fn: (s) => s.replace(/,\s*\/\*[\s\S]*?\*\/\s*beside_links = excluded\.beside_links/, '') },
  { name: 'M5 parameter array not extended (the `besideLinks` parameter removed)', fn: (s) => s.replace(', JSON.stringify(e.besideLinks ?? null)]', ']') },
  { name: 'M6 the parameter is the WRONG value (a constant null in the right slot)', fn: (s) => s.replace('JSON.stringify(e.besideLinks ?? null)]', 'JSON.stringify(null)]') },
];
for (const m of MUTANTS) {
  const src = readFileSync(SYNC_PATH, 'utf8');
  const mutated = m.fn(src);
  if (mutated === src) { report.push({ name: `${m.name}: the mutation LANDED`, pass: false, detail: 'source unchanged — the mutant did not apply, so nothing below it is evidence' }); allPass = false; continue; }
  let red = false; let why = '';
  try {
    const router = await buildServer(`sync-${m.name.slice(0, 2)}`, () => mutated);
    const { results } = await runAll(router);
    const failed = results.filter((r) => !r.pass);
    red = failed.length > 0;
    why = red ? `red: ${failed[0].name}` : 'GREEN — this edit is not load-bearing in the test';
  } catch (e) {
    red = true; why = `red: ${String(e.message).slice(0, 110)}`;
  }
  report.push({ name: `FALSIFICATION ${m.name} — must go RED`, pass: red, detail: why });
  if (!red) allPass = false;
}

// CLIENT MUTANT — the unborn guard removed: the record rides `from` even when `from` is unborn, so
// saving that row BIRTHS a board with no box. Scenario 3 must go red at 3a.
{
  const src = readFileSync(BESIDE_PATH, 'utf8');
  const mut = (t) => t.replace('const [rowId, partnerId] = fromUnborn ? [otherId, fromId] : [fromId, otherId];', 'const [rowId, partnerId] = [fromId, otherId];');
  if (mut(src) === src) { report.push({ name: 'M7 the mutation LANDED', pass: false, detail: 'source unchanged' }); allPass = false; }
  else {
    let red = false; let why = '';
    try {
      const { results } = await runAll(realRouter, mut);
      const failed = results.filter((r) => !r.pass);
      red = failed.length > 0; why = red ? `red: ${failed[0].name}` : 'GREEN — the unborn guard is not load-bearing in the test';
    } catch (e) { red = true; why = `red: ${String(e.message).slice(0, 110)}`; }
    report.push({ name: 'FALSIFICATION M7 the unborn guard removed (the record always rides `from`) — must go RED', pass: red, detail: why });
    if (!red) allPass = false;
  }
}

for (const r of report) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`);
console.log(allPass ? `\nBESIDE ROUND TRIP: PASS (${report.length} checks, ${MUTANTS.length + 1} mutants killed)` : `\nBESIDE ROUND TRIP: FAIL — ${report.filter((r) => !r.pass).length}/${report.length}`);
process.exit(allPass ? 0 : 1);
