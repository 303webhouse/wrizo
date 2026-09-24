// ITEM 198 — S0. /sync's incremental pull misses edits. This file MEASURES it; it fixes nothing.
//
// THE CLAIM UNDER TEST (Fable/TOOLS, "not reproduced" until this ran): /sync filters its pull on
// the CLIENT-stamped `updated_at > lastSyncAt`, where lastSyncAt is the SERVER's clock from the
// previous response. So an edit stamped BEFORE another device's last sync — the ordinary
// offline-edit shape — is never returned to that device's incremental pull. And if that other
// device then edits the same record, last-writer-wins on the client-stamped updated_at
// overwrites the edit it never saw.
//
// BROWSERLESS, in the manner of TOOLS' beside-roundtrip-proof.mjs (whose machinery this reuses):
// no box turn, no browser, no Postgres. The SERVER is the real apps/server/src/sync.ts router,
// bundled with esbuild, its /sync handler called directly; only the pool and auth are faked, and
// the fake pool interprets the journal upsert FROM THE SQL TEXT and the pull's own
// `updated_at > $2` filter from the pull's params. The DEVICES are two real instances of the
// client store (persistence.ts), each with its own localStorage, driven through the real
// getDirtyRecords / applyRemoteRecords / markClean — the loop store/sync.ts's syncOnce runs.
//
// NO CLOCK IS FORGED. Every stamp is the store's own `new Date()` and every serverTime is the
// router's own. The fault falls out of ORDER alone: A edits and does not sync; B syncs; A syncs.
//
// WHAT IT MEASURES, in three groups:
//   CONTROL  — the instrument can SEE a healthy incremental pull and a full pull recovering. If
//              a control is red the instrument is broken, not the product.
//   CLAIM    — the behaviour a writer is owed. RED today = the fault is present.
//   CENSUS   — read from the source text, not run: every collection shares the one filter, and
//              where a full pull happens.
//
// Only journal_entries is exercised DYNAMICALLY (it is the only table the fake pool models); the
// other five collections go through the same `pull()` function, which the CENSUS asserts from the
// source rather than assuming.
//
// Run: node apps/desktop/scripts/sync-incremental-pull-proof.mjs [--expect fault|fixed]
//   exit 0  = the controls hold and the claim state matches --expect (default: fault present)
//   exit 1  = a control is red (the instrument is broken) OR the claim state differs from --expect
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const expect = process.argv.includes('--expect') ? process.argv[process.argv.indexOf('--expect') + 1] : 'fault';
// --semantics server-cursor: the pool stamps a SERVER-assigned `synced_at` on every accepted write and the
// pull filters on THAT. It models the proposed fix's semantics AT THE POOL (it tests no SQL); its only job is
// to prove the CLAIM checks CAN go green, so a stuck-red instrument cannot pass unnoticed.
const semantics = process.argv.includes('--semantics') ? process.argv[process.argv.indexOf('--semantics') + 1] : 'client-clock';
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const desktopSrc = join(repo, 'apps/desktop/src');
const serverSrc = join(repo, 'apps/server/src');
const SYNC_PATH = join(serverSrc, 'sync.ts');

const desktopRequire = createRequire(join(repo, 'apps/desktop/package.json'));
const viteRequire = createRequire(desktopRequire.resolve('vite'));
const esbuild = viteRequire('esbuild');

// Build artefacts go to the OS temp dir, never the repo (`railway up` uploads the working tree).
const tmp = join(tmpdir(), 'wrizo-sync-incremental-proof');
mkdirSync(tmp, { recursive: true });
const realSetTimeout = globalThis.setTimeout;
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));

// ---------------------------------------------------------------------------
// THE FAKE POOL — the journal upsert parsed from its own SQL text; the pull filter applied as SQL
// applies it (`updated_at > $2` over the STORED, client-stamped updated_at).
// ---------------------------------------------------------------------------
function makePool() {
  const rows = new Map();
  const norm = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  const splitTop = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
  return {
    rows,
    async query(sql, params = []) {
      const s = norm(sql);
      if (/^insert into journal_entries/i.test(s)) {
        const m = /^insert into journal_entries \(([^)]*)\) values \((.*?)\) on conflict \(id\) do update set (.*?) where journal_entries\.user_id = excluded\.user_id and excluded\.updated_at > journal_entries\.updated_at$/i.exec(s);
        if (!m) throw new Error(`fake pool: cannot parse the journal upsert — /sync's SQL changed shape: ${s.slice(0, 120)}`);
        const cols = splitTop(m[1]);
        const phs = splitTop(m[2]);
        const sets = splitTop(m[3]).map((a) => { const [l, r] = a.split('=').map((x) => x.trim()); return { l, r }; });
        if (cols.length !== phs.length || cols.length !== params.length) throw new Error(`PAIRING: ${cols.length} columns / ${phs.length} placeholders / ${params.length} parameters`);
        const row = {};
        cols.forEach((c, i) => { row[c] = /::jsonb$/i.test(phs[i]) ? (params[i] == null ? null : JSON.parse(params[i])) : params[i]; });
        const ex = rows.get(row.id);
        if (!ex) { row.__synced = new Date().toISOString(); rows.set(row.id, row); return { rows: [] }; }
        // LAST-WRITER-WINS on the CLIENT-stamped updated_at — the guard in the SQL's own WHERE.
        if (ex.user_id === row.user_id && String(row.updated_at) > String(ex.updated_at)) {
          for (const { l } of sets) ex[l] = row[l];
          ex.__synced = new Date().toISOString();
        }
        return { rows: [] };
      }
      if (/^select \* from journal_entries/i.test(s)) {
        const [userId, since] = params;
        return { rows: [...rows.values()].filter((r) => r.user_id === userId && (since == null || String(semantics === 'server-cursor' ? r.__synced : r.updated_at) > String(since))).map((r) => JSON.parse(JSON.stringify(r))) };
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

async function buildServer() {
  const out = join(tmp, 'server.cjs');
  await esbuild.build({
    entryPoints: [SYNC_PATH], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'server-stubs', setup(b) {
      b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(stubs, 'db.mjs') }));
      b.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: join(stubs, 'auth.mjs') }));
    } }],
  });
  return createRequire(import.meta.url)(out).syncRouter;
}

async function buildDevice(name) {
  const out = join(tmp, `device-${name}.mjs`);
  await esbuild.build({
    stdin: { contents: "export * from './store/persistence';", resolveDir: desktopSrc, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'lex', setup(b) { b.onResolve({ filter: /^\.\/deskLexicon$/ }, () => ({ path: join(stubs, 'lexicon.mjs') })); } }],
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
// persistence.ts debounces its flush with setTimeout; the proof never reloads, so it is inert.
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};

async function loadDevice(name) {
  const file = await buildDevice(name);
  current = name;
  return import(pathToFileURL(file).href);
}

// THE SYNC LOOP — store/sync.ts's `syncOnce`, minus the network. lastSync is the SERVER's
// serverTime from the previous response, exactly as the real client stores it.
async function makeWorld(serverRouter) {
  const pool = makePool();
  globalThis.__fakePool = pool;
  const layer = serverRouter.stack.find((l) => l.route && l.route.path === '/sync' && l.route.methods.post);
  if (!layer) throw new Error('the /sync route was not found on the bundled router');
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  const call = (body) => new Promise((resolve, reject) => {
    handle({ session: { userId: 'u1' }, body }, { json: resolve }, (e) => reject(e || new Error('handler called next()')));
  });
  const devices = { A: await loadDevice('A'), B: await loadDevice('B') };
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
    await sleep(3); // stamps and serverTime must strictly increase between steps
  };
  return { pool, on, sync, cursors: lastSync };
}

const textOf = (w, dev, id) => w.on(dev).getJournalEntry(id)?.text;
const results = [];
const log = (group, name, pass, detail = '') => { results.push({ group, name, pass, detail }); };

// ---------------------------------------------------------------------------
// SCENARIOS
// ---------------------------------------------------------------------------
async function scenarios(serverRouter) {
  // CONTROL 1 — the ordinary order works: A edits AND syncs, then B pulls incrementally.
  {
    const w = await makeWorld(serverRouter);
    const A = w.on('A');
    A.createJournalPage({ id: 'P', text: 'v0', pageType: 'page', projectId: null, origin: null });
    await sleep(3);
    await w.sync('A'); await w.sync('B');
    w.on('A').patchJournalEntry('P', 'A edit, synced promptly', {});
    await sleep(3);
    await w.sync('A'); await w.sync('B'); // B: incremental
    log('CONTROL', 'C1: when A syncs its edit BEFORE B\'s next pull, B\'s ordinary incremental pull receives it - the instrument can see a healthy incremental pull',
      textOf(w, 'B', 'P') === 'A edit, synced promptly', JSON.stringify({ B: textOf(w, 'B', 'P') }));
  }

  // THE FAULT — A edits and does NOT sync (offline / between 20s ticks); B syncs; A syncs.
  {
    const w = await makeWorld(serverRouter);
    w.on('A').createJournalPage({ id: 'P', text: 'v0', pageType: 'page', projectId: null, origin: null });
    await sleep(3);
    await w.sync('A'); await w.sync('B');                       // both hold v0; both cursors set
    w.on('A').patchJournalEntry('P', 'A OFFLINE EDIT', {});      // stamped tA; A does not sync
    await sleep(3);
    await w.sync('B');                                           // B's cursor moves PAST tA
    await w.sync('A');                                           // A pushes the tA-stamped row
    const stampA = w.pool.rows.get('P')?.updated_at;
    const cursorB = readCursor(w, 'B');
    await w.sync('B');                                           // B's ordinary incremental pull
    log('CLAIM', 'K1: after A pushes an edit stamped BEFORE B\'s last sync, B\'s next INCREMENTAL pull receives it',
      textOf(w, 'B', 'P') === 'A OFFLINE EDIT',
      JSON.stringify({ serverHas: w.pool.rows.get('P')?.text, B: textOf(w, 'B', 'P'), editStampedAt: stampA, bLastSync: cursorB }));
    log('CONTROL', 'C2: the stamp really is BEFORE B\'s cursor - the instrument reproduced the ORDER, not a forged clock (edit stamp < B\'s lastSyncAt, both real)',
      String(stampA) < String(cursorB), JSON.stringify({ editStampedAt: stampA, bLastSync: cursorB }));
    const missedHeld = textOf(w, 'B', 'P');
    await w.sync('B', true);                                     // a FULL pull
    log('CONTROL', 'C3: a FULL pull recovers it - the edit is on the server and only the incremental filter withheld it',
      textOf(w, 'B', 'P') === 'A OFFLINE EDIT', JSON.stringify({ B_afterIncremental: missedHeld, B_afterFull: textOf(w, 'B', 'P') }));
  }

  // THE OVERWRITE — same setup, but B edits the record BEFORE any full pull.
  {
    const w = await makeWorld(serverRouter);
    w.on('A').createJournalPage({ id: 'P', text: 'v0', pageType: 'page', projectId: null, origin: null });
    await sleep(3);
    await w.sync('A'); await w.sync('B');
    w.on('A').patchJournalEntry('P', 'A OFFLINE EDIT', {});
    await sleep(3);
    await w.sync('B'); await w.sync('A'); await w.sync('B');     // B has NOT received A's edit (K1)
    const bBase = textOf(w, 'B', 'P');          // what B actually holds when it starts editing
    const bWrote = bBase + ' + B EDIT';         // a genuine edit ON TOP of it, not a blind replace
    w.on('B').patchJournalEntry('P', bWrote, {});
    await sleep(3);
    await w.sync('B'); await w.sync('A'); await w.sync('B');     // LWW: tB > tA
    const server = w.pool.rows.get('P')?.text;
    const survives = [server, textOf(w, 'A', 'P'), textOf(w, 'B', 'P')].some((t) => typeof t === 'string' && t.includes('A OFFLINE EDIT'));
    log('CLAIM', "K2: B edits on top of what it holds, and A's earlier edit is already on the server - A's words survive SOMEWHERE (server, A or B), never silently destroyed",
      survives, JSON.stringify({ bHeldBeforeEditing: bBase, bWrote, server, A: textOf(w, 'A', 'P'), B: textOf(w, 'B', 'P') }));
    log('CONTROL', "C4: last-writer-wins is doing its job on the stamps - the server holds exactly what B wrote, so a loss is the cursor fault, not a broken LWW guard",
      server === bWrote, JSON.stringify({ server, bWrote }));
  }
}

// The device's stored cursor: the SERVER's serverTime from its previous response.
function readCursor(w, dev) { return w.cursors[dev]; }

// ---------------------------------------------------------------------------
// CENSUS — from the source text, never run.
// ---------------------------------------------------------------------------
function census() {
  const src = readFileSync(SYNC_PATH, 'utf8');
  const pulls = [...src.matchAll(/await pull\('(\w+)'/g)].map((m) => m[1]);
  const filterLines = src.split('\n').filter((l) => /updated_at\s*>\s*\$2/.test(l));
  const isolated = /\$2::timestamptz is null or updated_at > \$2/.test(src);
  log('CENSUS', 'N1: EVERY collection /sync returns goes through the ONE `pull()` and its one client-clock filter (' + pulls.join(', ') + ')',
    pulls.length === 6 && filterLines.length === 1 && isolated, JSON.stringify({ pulls, filterSites: filterLines.length }));

  const clientSync = readFileSync(join(desktopSrc, 'store/sync.ts'), 'utf8');
  const fullPullSites = [...clientSync.matchAll(/syncOnce\(true\)/g)].length;
  const fullParam = /fullPull \? null : getLastSyncAt\(\)/.test(clientSync);
  const cursorIsServerTime = /setLastSyncAt\(resp\.serverTime\)/.test(clientSync);
  log('CENSUS', 'N2: the client\'s cursor is the SERVER clock (resp.serverTime) while the filtered column is CLIENT-stamped - two clocks',
    cursorIsServerTime && fullParam, JSON.stringify({ cursorIsServerTime, fullParam }));
  log('CENSUS', 'N3: the ONLY full pull is startSync()\'s first syncOnce(true) (app load and login); the 20s timer, reconnect and tab-visible are all incremental',
    fullPullSites === 1 && /await syncOnce\(true\);/.test(clientSync), JSON.stringify({ syncOnceTrueSites: fullPullSites }));
}

(async () => {
  const router = await buildServer();
  await scenarios(router);
  census();

  const controlsRed = results.filter((r) => r.group !== 'CLAIM' && !r.pass);
  const claimsRed = results.filter((r) => r.group === 'CLAIM' && !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  [${r.group}] ${r.name}${r.detail ? '  ' + r.detail : ''}`);
  const faultPresent = claimsRed.length > 0;
  console.log(`\nINSTRUMENT: ${controlsRed.length === 0 ? 'controls + census hold' : `BROKEN - ${controlsRed.length} control/census check(s) red`}`);
  console.log(`FAULT: ${faultPresent ? `PRESENT - ${claimsRed.length} of ${results.filter((r) => r.group === 'CLAIM').length} claim checks red` : 'ABSENT - every claim check green'}  (expected: ${expect}; semantics: ${semantics})`);
  const stateMatches = expect === 'fault' ? faultPresent : !faultPresent;
  process.exit(controlsRed.length === 0 && stateMatches ? 0 : 1);
})().catch((e) => { console.error('INSTRUMENT ERROR:', e && e.stack || e); process.exit(2); });
