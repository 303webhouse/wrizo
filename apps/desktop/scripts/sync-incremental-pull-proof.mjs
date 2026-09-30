// ITEM 198 - /sync's incremental pull, and the server-assigned `synced_at` that fixes it.
//
// THE FAULT (measured at S0, docs/menus/item198-sync-cursor-s0.md): /sync filtered its pull on the
// CLIENT-stamped `updated_at > lastSyncAt`, where lastSyncAt is the SERVER's serverTime. An edit
// stamped before another device's last sync and pushed after it was on the server and never returned;
// and when that device then edited the record, last-writer-wins destroyed the edit it was never shown -
// on the server and on BOTH devices.
//
// THE FIX UNDER TEST (Nick: "Yes" to a column): `synced_at timestamptz not null default now()` on the
// six sync tables, stamped by Postgres and never by a client (the column default on insert, `now()` in
// every on-conflict set); the cursor is Postgres's own now() too; the pull filters on synced_at with a 10s
// overlap on the cursor.
//
// BROWSERLESS: no box turn, no browser, no Postgres. The SERVER is the real apps/server/src/sync.ts
// router bundled with esbuild, its /sync handler called directly; the DEVICES are two real instances of
// the client store (persistence.ts), each with its own localStorage, driven through the real
// getDirtyRecords / applyRemoteRecords / markClean - the loop store/sync.ts's syncOnce runs.
//
// THE FAKE POOL IS NOT A SQL ENGINE, AND IT DOES NOT PRETEND TO BE. It interprets ONLY the statements
// /sync sends, FROM THEIR OWN SQL TEXT: the upsert's column list, placeholder list and on-conflict SET
// list (for all six tables); the pull's filter column and whether it subtracts the overlap; and it
// learns which tables HAVE a `synced_at` column by reading migrate.ts's own alter statements. So an
// edit that is missing changes what the fake sees exactly as it would change what Postgres does (a
// column that does not exist THROWS; a SET that does not write it leaves it stale) - it is never a
// hand-written model of what the SQL should be. Its only invented thing is the clock: REAL time,
// moved FORWARD by `advance()` to let time pass, plus a skew (K4 only) between Postgres's clock and the app's that defaults to zero.
//
// FALSIFICATION IS PART OF THE VERDICT (`--mutants`): the server source is re-run with EACH edit
// removed ALONE - the pull filter, the overlap, each of the six tables' `synced_at = now()`, each of
// the six tables' column add, the cursor back on the app clock, and the server stamp replaced by a client value. Every mutant MUST go
// red on a DYNAMIC claim check (K1..K4) - the static census is reported beside it, never instead of it. A green mutant means that edit is
// not load-bearing in this instrument, which would be a defect in the instrument, reported as such.
// (The "pull filter back to updated_at" mutant IS the original S0 fault: it reproduces K1 and K2.)
//
// Run: node apps/desktop/scripts/sync-incremental-pull-proof.mjs [--mutants]
//   exit 0 = the baseline is green (and, with --mutants, every mutant is red)
//   exit 1 = a baseline check is red, or a mutant stayed green
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const RUN_MUTANTS = process.argv.includes('--mutants');
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const desktopSrc = join(repo, 'apps/desktop/src');
const serverSrc = join(repo, 'apps/server/src');
const SYNC_PATH = join(serverSrc, 'sync.ts');
const MIGRATE_PATH = join(serverSrc, 'migrate.ts');
const SYNC_TEXT = readFileSync(SYNC_PATH, 'utf8');
const MIGRATE_TEXT = readFileSync(MIGRATE_PATH, 'utf8');
const TABLES = ['projects', 'story_plans', 'sessions_log', 'drafts', 'drawers', 'journal_entries'];

const desktopRequire = createRequire(join(repo, 'apps/desktop/package.json'));
const viteRequire = createRequire(desktopRequire.resolve('vite'));
const esbuild = viteRequire('esbuild');

// Build artefacts go to the OS temp dir, never the repo (`railway up` uploads the working tree).
const tmp = join(tmpdir(), 'wrizo-sync-198-proof');
mkdirSync(tmp, { recursive: true });
// TIME PASSING, NOT FORGED STAMPS. An offline edit is one made minutes before it syncs; at millisecond gaps the
// 10s overlap would MASK the fault, so the scenarios need real time to pass. `advance(ms)` moves the ONE clock
// every stamp and every serverTime reads (client store, router, fake pool) FORWARD; nothing is ever back-dated.
let clockOffsetMs = 0;
const RealDate = Date;
class ShiftedDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(RealDate.now() + clockOffsetMs); else super(...a); }
  static now() { return RealDate.now() + clockOffsetMs; }
}
globalThis.Date = ShiftedDate;
const advance = (ms) => { clockOffsetMs += ms; };
const OFFLINE_MS = 5 * 60 * 1000;
const realSetTimeout = globalThis.setTimeout;
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));
const realConsoleError = console.error;

// ---------------------------------------------------------------------------
// THE FAKE POOL
// ---------------------------------------------------------------------------
const norm = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
const splitTop = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

// Which tables does migrate.ts give a `synced_at` column, and with what default? Read from its text.
function syncedAtTablesFrom(migrateText) {
  const m = /for \(const t of \[([^\]]*)\]\) \{[\s\S]*?alter table \$\{t\} add column if not exists synced_at timestamptz not null default now\(\)`\)/.exec(migrateText);
  if (!m) return new Set();
  return new Set([...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]));
}

function makePool(migrateText) {
  const syncedAt = syncedAtTablesFrom(migrateText);
  const tables = new Map(TABLES.map((t) => [t, new Map()]));
  const pool = {
    tables, syncedAt, skewMs: 0, gate: null, pullCounts: [],
    clock: () => new Date(Date.now() + pool.skewMs).toISOString(),
    async query(sql, params = []) {
      const s = norm(sql);
      const need = (t) => { if (!syncedAt.has(t)) throw new Error(`column "synced_at" of relation "${t}" does not exist`); };
      let m = /^insert into (\w+) \(([^)]*)\) values \((.*?)\) on conflict \(id\) do update set (.*?) where \1\.user_id = excluded\.user_id and excluded\.updated_at > \1\.updated_at$/i.exec(s);
      if (m) {
        const [, t, colsTxt, phsTxt, setTxt] = m;
        if (!tables.has(t)) throw new Error(`fake pool: no model for table ${t}`);
        const cols = splitTop(colsTxt);
        const phs = splitTop(phsTxt);
        const sets = splitTop(setTxt).map((a) => { const i = a.indexOf('='); return { l: a.slice(0, i).trim(), r: a.slice(i + 1).trim() }; });
        if (cols.length !== phs.length || cols.length !== params.length) throw new Error(`PAIRING (${t}): ${cols.length} columns / ${phs.length} placeholders / ${params.length} parameters`);
        phs.forEach((ph, i) => { if (ph.replace(/::\w+$/, '') !== `$${i + 1}`) throw new Error(`PAIRING (${t}): placeholder ${i + 1} reads "${ph}"`); });
        if (cols.includes('synced_at')) throw new Error(`SERVER STAMP (${t}): synced_at appears in the insert column list - it must never be a parameter`);
        const stamp = pool.clock();                       // now() = the START of the writing statement
        const row = {};
        cols.forEach((c, i) => { row[c] = /::jsonb$/i.test(phs[i]) ? (params[i] == null ? null : JSON.parse(params[i])) : params[i]; });
        for (const { l, r } of sets) {
          if (l === 'synced_at') need(t);
          if (!(r === `excluded.${l}` || (l === 'synced_at' && (r === 'now()' || /^excluded\.\w+$/.test(r))))) throw new Error(`fake pool: cannot interpret SET ${l} = ${r}`);
        }
        if (syncedAt.has(t)) row.synced_at = stamp;      // the column DEFAULT now()
        // THE COMMIT: a gated write has taken its stamp but is not yet visible to any other statement.
        if (pool.gate && t === 'journal_entries') { const g = pool.gate; pool.gate = null; await g; }
        const store = tables.get(t);
        const ex = store.get(row.id);
        if (!ex) { store.set(row.id, row); return { rows: [] }; }
        // LAST-WRITER-WINS on the CLIENT-stamped updated_at - the guard in the SQL's own WHERE.
        if (ex.user_id === row.user_id && String(row.updated_at) > String(ex.updated_at)) {
          for (const { l, r } of sets) {
            if (r === 'now()') ex[l] = stamp;
            else ex[l] = row[r.replace('excluded.', '')];
          }
        }
        return { rows: [] };
      }
      if (/^select now\(\) as t$/i.test(s)) return { rows: [{ t: new Date(pool.clock()) }] };   // Postgres's own clock, as node-pg returns it
      m = /^select \* from (\w+) where user_id = \$1 and \(\$2::timestamptz is null or (\w+) > \$2(?:::timestamptz)?( - \(\$3::int \* interval '1 millisecond'\))?\)$/i.exec(s);
      if (m) {
        const [, t, col, hasOverlap] = m;
        if (!tables.has(t)) return { rows: [] };
        if (col === 'synced_at') need(t);
        const [userId, since, overlapMs] = params;
        const floor = since == null ? null : Date.parse(since) - (hasOverlap ? Number(overlapMs) : 0);
        const rows = [...tables.get(t).values()].filter((r) => r.user_id === userId && (floor === null || Date.parse(r[col]) > floor));
        return { rows: rows.map((r) => JSON.parse(JSON.stringify(r))) };
      }
      throw new Error(`fake pool: unhandled statement: ${s.slice(0, 110)}`);
    },
  };
  return pool;
}

// ---------------------------------------------------------------------------
// BUILDS
// ---------------------------------------------------------------------------
const stubs = join(tmp, 'stubs');
mkdirSync(stubs, { recursive: true });
writeFileSync(join(stubs, 'db.mjs'), `export const pool = { query: (...a) => globalThis.__fakePool.query(...a) };`);
writeFileSync(join(stubs, 'auth.mjs'), `export const requireAuth = (_q, _s, next) => next();`);
writeFileSync(join(stubs, 'lexicon.mjs'), `export const deskTerm = (k) => k;`);

let serverN = 0;
async function buildServer(syncText) {
  const out = join(tmp, `server-${serverN += 1}.cjs`);
  await esbuild.build({
    entryPoints: [SYNC_PATH], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'server-stubs', setup(b) {
      b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(stubs, 'db.mjs') }));
      b.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: join(stubs, 'auth.mjs') }));
      b.onLoad({ filter: /sync\.ts$/ }, () => ({ contents: syncText, loader: 'ts', resolveDir: serverSrc }));
    } }],
  });
  return createRequire(import.meta.url)(out).syncRouter;
}

const deviceFiles = {};
async function buildDevice(name) {
  const out = join(tmp, `device-${name}.mjs`);
  await esbuild.build({
    stdin: { contents: "export * from './store/persistence';", resolveDir: desktopSrc, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'lex', setup(b) { b.onResolve({ filter: /^\.\/deskLexicon$/ }, () => ({ path: join(stubs, 'lexicon.mjs') })); } }],
  });
  deviceFiles[name] = out;
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

let worldN = 0;
async function makeWorld(router, migrateText) {
  const pool = makePool(migrateText);
  globalThis.__fakePool = pool;
  const layer = router.stack.find((l) => l.route && l.route.path === '/sync' && l.route.methods.post);
  if (!layer) throw new Error('the /sync route was not found on the bundled router');
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  const call = (body) => new Promise((resolve, reject) => {
    handle({ session: { userId: 'u1' }, body }, { json: resolve }, (e) => reject(e || new Error('handler called next()')));
  });
  worldN += 1;
  storage.A.clear(); storage.B.clear();
  current = 'A';
  // A FRESH MODULE INSTANCE per world (a query string) - the store's cache is module-level state.
  const devices = {};
  for (const n of ['A', 'B']) { current = n; devices[n] = await import(`${pathToFileURL(deviceFiles[n]).href}?w=${worldN}`); }
  const cursors = { A: null, B: null };
  const on = (n) => { current = n; return devices[n]; };
  const sync = async (n, fullPull = false) => {
    const d = on(n);
    const dirty = d.getDirtyRecords();
    const stamps = new Map();
    for (const k of ['projects', 'storyPlans', 'sessions', 'drafts', 'journalEntries', 'drawers']) for (const r of dirty[k]) stamps.set(r.id, r.updatedAt);
    const resp = await call({ lastSyncAt: fullPull ? null : cursors[n], push: dirty });
    const dd = on(n);                                   // another device may have run while this awaited
    dd.applyRemoteRecords(resp.pull);
    const still = new Map();
    for (const k of ['projects', 'storyPlans', 'sessions', 'drafts', 'journalEntries', 'drawers']) for (const r of dd.getDirtyRecords()[k]) still.set(r.id, r.updatedAt);
    dd.markClean([...stamps].filter(([id, ts]) => !still.has(id) || still.get(id) === ts).map(([id]) => id));
    cursors[n] = resp.serverTime;
    pool.pullCounts.push({ n, journal: resp.pull.journalEntries.length });
    await sleep(3);                                     // stamps and serverTime must strictly increase
    return resp;
  };
  return { pool, on, sync, cursors };
}

// ---------------------------------------------------------------------------
// SCENARIOS
// ---------------------------------------------------------------------------
const MARK = 'A OFFLINE EDIT';
const OPS = {
  projects: {
    mk: (d) => d.createProject('v0', 'creative').id,
    edit: (d, id) => d.saveProject({ ...d.getProject(id), title: MARK }),
    read: (d, id) => d.getProject(id)?.title,
  },
  story_plans: {
    mk: (d) => d.createStoryPlan('proj-x', 'framework-x', ['b1']).id,
    edit: (d, id) => d.saveStoryPlan({ ...d.getStoryPlan(id), frameworkId: MARK }),
    read: (d, id) => d.getStoryPlan(id)?.frameworkId,
  },
  sessions_log: {
    mk: (d) => { const id = 'sess-1'; d.saveSession({ id, projectId: null, startedAt: '2026-06-01T00:00:00.000Z', firstKeystrokeAt: null, endedAt: null, words: 1, durationSec: 1 }); return id; },
    edit: (d, id) => d.saveSession({ ...d.getSessions().find((s) => s.id === id), words: 999 }),
    read: (d, id) => d.getSessions().find((s) => s.id === id)?.words,
    want: 999,
  },
  drafts: {
    mk: (d) => { d.saveDraft('draft-1', 'v0'); return 'draft-1'; },
    edit: (d, id) => d.saveDraft(id, MARK),
    read: (d, id) => d.getDraft(id)?.text,
  },
  drawers: {
    mk: (d) => d.createDrawer('v0').id,
    edit: (d, id) => d.renameDrawer(id, MARK),
    read: (d, id) => d.getDrawer(id)?.name,
  },
  journal_entries: {
    mk: (d) => { d.createJournalPage({ id: 'P', text: 'v0', pageType: 'page', projectId: null, origin: null }); return 'P'; },
    edit: (d, id) => d.patchJournalEntry(id, MARK, {}),
    read: (d, id) => d.getJournalEntry(id)?.text,
  },
};

async function runScenarios(router, migrateText, log) {
  const guard = async (group, name, fn) => {
    try { await fn(); } catch (e) { log(group, name, false, `THREW: ${String(e && e.message || e).slice(0, 160)}`); }
  };
  console.error = () => {};                             // the router logs a caught upsert failure; the result speaks

  // CONTROL 1 - the ordinary order works: A syncs its edit BEFORE B's next pull.
  await guard('CONTROL', 'C1', async () => {
    const w = await makeWorld(router, migrateText);
    const id = OPS.journal_entries.mk(w.on('A'));
    await sleep(3); await w.sync('A'); await w.sync('B');
    OPS.journal_entries.edit(w.on('A'), id);
    await sleep(3); await w.sync('A'); await w.sync('B');
    log('CONTROL', "C1: when A syncs its edit BEFORE B's next pull, B's ordinary incremental pull receives it - the instrument can see a healthy incremental pull",
      OPS.journal_entries.read(w.on('B'), id) === MARK, String(OPS.journal_entries.read(w.on('B'), id)));
  });

  // K1 - THE FAULT, on EVERY collection: A edits and does NOT sync; B syncs; A syncs; B syncs (incremental).
  for (const t of TABLES) {
    await guard('CLAIM', `K1:${t}`, async () => {
      const w = await makeWorld(router, migrateText);
      const ops = OPS[t];
      const id = ops.mk(w.on('A'));
      await sleep(3); await w.sync('A'); await w.sync('B');
      ops.edit(w.on('A'), id);                          // stamped tA; A does not sync
      await sleep(3); advance(OFFLINE_MS);              // A is offline for 5 minutes
      await w.sync('B');                                // B's cursor moves PAST tA
      await w.sync('A');                                // A pushes the tA-stamped row
      await w.sync('B');                                // B's ordinary incremental pull
      const want = ops.want ?? MARK;
      const got = ops.read(w.on('B'), id);
      log('CLAIM', `K1 [${t}]: an edit stamped BEFORE B's last sync, pushed after it, reaches B's next INCREMENTAL pull`, got === want, JSON.stringify({ B: got, want }));
    });
  }

  // C2/C3 + K2 on journal_entries.
  await guard('CLAIM', 'K2', async () => {
    const w = await makeWorld(router, migrateText);
    const ops = OPS.journal_entries;
    const id = ops.mk(w.on('A'));
    await sleep(3); await w.sync('A'); await w.sync('B');
    ops.edit(w.on('A'), id);
    await sleep(3); advance(OFFLINE_MS);
    await w.sync('B'); await w.sync('A'); await w.sync('B');
    const stampA = w.pool.tables.get('journal_entries').get(id)?.updated_at;
    log('CONTROL', "C2: the CLIENT stamp is before B's cursor by MORE than the 10s overlap - a scenario the overlap alone could not rescue (the offline period passed on the one clock; nothing was back-dated)", Date.parse(w.cursors.B) - Date.parse(stampA) > 10_000, JSON.stringify({ editStampedAt: stampA, bCursor: w.cursors.B, gapMs: Date.parse(w.cursors.B) - Date.parse(stampA) }));
    const bBase = ops.read(w.on('B'), id);              // what B actually holds when it starts editing
    const bWrote = `${bBase} + B EDIT`;
    w.on('B').patchJournalEntry(id, bWrote, {});
    await sleep(3);
    await w.sync('B'); await w.sync('A'); await w.sync('B');
    const server = w.pool.tables.get('journal_entries').get(id)?.text;
    const texts = [server, ops.read(w.on('A'), id), ops.read(w.on('B'), id)];
    log('CLAIM', "K2: B edits on top of what it holds, and A's earlier edit was already pulled - A's words survive SOMEWHERE (server, A or B), never silently destroyed",
      texts.some((x) => typeof x === 'string' && x.includes(MARK)), JSON.stringify({ bHeldBeforeEditing: bBase, bWrote, server, A: texts[1], B: texts[2] }));
    log('CONTROL', "C4: last-writer-wins still does its job on the stamps - the server holds exactly what B wrote (so a loss is the cursor, not a broken LWW guard)",
      server === bWrote, JSON.stringify({ server, bWrote }));
    await w.sync('B', true);
    log('CONTROL', 'C3: a FULL pull always recovers a row the server holds', typeof ops.read(w.on('B'), id) === 'string', String(ops.read(w.on('B'), id)));
  });

  // K3 - THE IN-FLIGHT WINDOW. A's write takes its stamp (statement start) and has NOT committed when B's
  // sync runs its pull and takes its cursor; A's write then commits. Its stamp is OLDER than B's cursor.
  await guard('CLAIM', 'K3', async () => {
    const w = await makeWorld(router, migrateText);
    const ops = OPS.journal_entries;
    const id = ops.mk(w.on('A'));
    await sleep(3); await w.sync('A'); await w.sync('B');
    ops.edit(w.on('A'), id);
    await sleep(3);
    let release; w.pool.gate = new Promise((r) => { release = r; });
    const aSync = w.sync('A');                          // stamps, then WAITS at the gate: uncommitted
    await sleep(20);
    await w.sync('B');                                  // B pulls on a snapshot WITHOUT the write; cursor > the stamp
    const cursorInFlight = w.cursors.B;
    await sleep(20);
    release();
    await aSync;                                        // the write commits
    const stamp = w.pool.tables.get('journal_entries').get(id)?.synced_at ?? w.pool.tables.get('journal_entries').get(id)?.updated_at;
    await w.sync('B');
    log('CONTROL', "C5: the write's stamp really is OLDER than the cursor B took while it was in flight (the window was reproduced, not assumed)",
      Date.parse(stamp) < Date.parse(cursorInFlight), JSON.stringify({ stamp, bCursorTakenInFlight: cursorInFlight }));
    log('CLAIM', "K3: a write in flight across another device's pull is still delivered by that device's NEXT pull (the 10s overlap on the cursor)",
      ops.read(w.on('B'), id) === MARK, JSON.stringify({ B: ops.read(w.on('B'), id) }));
  });

  // K4 - THE APP CLOCK AND POSTGRES'S CLOCK DISAGREE. Postgres runs 60s BEHIND this process (far beyond the
  // 10s overlap). Stamps come from Postgres; if the cursor came from THIS process it would sit 60s ahead of the
  // stamps and an edit pushed after B's sync would be stamped BEFORE B's cursor. With the cursor from Postgres too,
  // both count the same clock and the skew is irrelevant.
  await guard('CLAIM', 'K4', async () => {
    const w = await makeWorld(router, migrateText);
    w.pool.skewMs = -60_000;
    const ops = OPS.journal_entries;
    const id = ops.mk(w.on('A'));
    await sleep(3); await w.sync('A'); await w.sync('B');
    ops.edit(w.on('A'), id);
    await sleep(3); advance(OFFLINE_MS);
    await w.sync('B'); await w.sync('A'); await w.sync('B');
    log('CLAIM', "K4: with Postgres's clock 60s behind the app's, an edit pushed after B's last sync still reaches B's next INCREMENTAL pull (stamp and cursor count the SAME clock)",
      ops.read(w.on('B'), id) === MARK, JSON.stringify({ B: ops.read(w.on('B'), id), dbClockSkewMs: -60000 }));
  });

  // C6 - THE OVERLAP IS A BOUND, NOT MAGIC. The same in-flight shape, but the writing statement runs for
  // 11 seconds (a long lock wait, say): its stamp is the statement START, so by the time it commits the cursor B
  // took is 11s newer than the stamp - past a 10s overlap. Stated, and measured.
  await guard('CONTROL', 'C6', async () => {
    const w = await makeWorld(router, migrateText);
    const ops = OPS.journal_entries;
    const id = ops.mk(w.on('A'));
    await sleep(3); await w.sync('A'); await w.sync('B');
    ops.edit(w.on('A'), id);
    await sleep(3);
    let release; w.pool.gate = new Promise((r) => { release = r; });
    const aSync = w.sync('A');                          // stamps at statement start, then runs long
    await sleep(20);
    advance(11_000);                                    // 11 seconds pass while it is still uncommitted
    await w.sync('B');                                  // B pulls; its cursor is 11s past the stamp
    release(); await aSync;                             // it commits
    await w.sync('B');
    log('CONTROL', 'C6: the overlap is a BOUND - a write whose statement ran 11s (longer than the 10s overlap) is NOT caught by it; a full pull still recovers it',
      ops.read(w.on('B'), id) !== MARK, JSON.stringify({ B_incremental: ops.read(w.on('B'), id) }));
  });

  // C7 - WHAT THE OVERLAP COSTS. An immediate second sync re-receives the row written <10s ago; the
  // client skips it (nothing newer), so the writer sees no change.
  await guard('CONTROL', 'C7', async () => {
    const w = await makeWorld(router, migrateText);
    const ops = OPS.journal_entries;
    const id = ops.mk(w.on('A'));
    await sleep(3); await w.sync('A'); await w.sync('B');
    const before = ops.read(w.on('B'), id);
    const beforeRec = JSON.stringify(w.on('B').getJournalEntry(id));
    w.pool.pullCounts.length = 0;
    await w.sync('B');                                  // nothing changed anywhere
    const resent = w.pool.pullCounts[w.pool.pullCounts.length - 1].journal;
    log('CONTROL', 'C7 (COST): an idle second sync re-sends the rows written in the last 10s (here 1) and the client skips them - the store is byte-identical after',
      resent === 1 && JSON.stringify(w.on('B').getJournalEntry(id)) === beforeRec && ops.read(w.on('B'), id) === before, JSON.stringify({ resent }));
  });
  console.error = realConsoleError;
}

// ---------------------------------------------------------------------------
// CENSUS - from the SOURCE TEXT, never run.
// ---------------------------------------------------------------------------
function census(syncText, migrateText, log) {
  const stmt = (t) => {
    const a = syncText.indexOf(`insert into ${t}\n`);
    const a2 = a >= 0 ? a : syncText.search(new RegExp(`insert into ${t}[\\s(]`));
    const b = syncText.indexOf(`excluded.updated_at > ${t}.updated_at`, a2);
    return a2 >= 0 && b >= 0 ? syncText.slice(a2, b) : '';
  };
  const bad = TABLES.filter((t) => !/\bsynced_at = now\(\)/.test(stmt(t)));
  log('CENSUS', `N1: every one of the six upserts writes \`synced_at = now()\` in its on-conflict set${bad.length ? ' - MISSING: ' + bad.join(', ') : ''}`, bad.length === 0, JSON.stringify({ missing: bad }));
  const inInsert = TABLES.filter((t) => /insert into \w+\s*\(([^)]*)\)/.exec(stmt(t) + ')')?.[1]?.includes('synced_at'));
  const clientVal = /synced_at\s*=\s*(excluded\.|\$)/.test(syncText);
  log('CENSUS', 'N2: the stamp is NEVER a parameter and NEVER a client value - not in any insert column list, not assigned from `excluded`', inInsert.length === 0 && !clientVal, JSON.stringify({ inInsert, clientVal }));
  const pullOk = /synced_at > \$2::timestamptz - \(\$3::int \* interval '1 millisecond'\)/.test(syncText) && !/updated_at > \$2/.test(syncText);
  log('CENSUS', 'N3: the ONE pull() filters on synced_at against the cursor minus the overlap, and no `updated_at > $2` remains', pullOk, JSON.stringify({ pullOk }));
  const overlap = /const PULL_OVERLAP_MS = 10_000;/.test(syncText);
  log('CENSUS', 'N4: the overlap is 10s (PULL_OVERLAP_MS = 10_000) and is passed to the pull as $3', overlap && /\[userId, lastSyncAt, PULL_OVERLAP_MS\]/.test(syncText), JSON.stringify({ overlap }));
  const cols = syncedAtTablesFrom(migrateText);
  log('CENSUS', `N5: migrate.ts adds \`synced_at ... default now()\` to all six tables${cols.size !== 6 ? ' - HAS: ' + [...cols].join(',') : ''}`, TABLES.every((t) => cols.has(t)) && /create index if not exists \$\{t\}_user_synced on \$\{t\} \(user_id, synced_at\)/.test(migrateText), JSON.stringify({ have: [...cols] }));
  const cursorFromDb = /const serverTime = await dbNow\(\);/.test(syncText) && /select now\(\) as t/.test(syncText) && !/serverTime: new Date\(\)/.test(syncText);
  log('CENSUS', "N7: the cursor (serverTime) comes from Postgres's own now(), taken after the pushes and before the pulls - not from this process's clock", cursorFromDb, JSON.stringify({ cursorFromDb }));
  const pulls = [...syncText.matchAll(/await pull\('(\w+)'/g)].map((m) => m[1]);
  log('CENSUS', 'N6: every collection /sync returns still goes through the ONE pull()', pulls.length === 6 && [...syncText.matchAll(/async function pull\(/g)].length === 1, JSON.stringify({ pulls }));
}

// ---------------------------------------------------------------------------
// MUTANTS - each server edit, removed ALONE.
// ---------------------------------------------------------------------------
function stmtRange(text, t) {
  const a = text.search(new RegExp(`insert into ${t}[\\s(]`));
  const b = text.indexOf(`excluded.updated_at > ${t}.updated_at`, a);
  return [a, b];
}
function mutants() {
  const out = [];
  const sub = (name, syncFn, migrateFn) => out.push({ name, sync: syncFn ? syncFn(SYNC_TEXT) : SYNC_TEXT, migrate: migrateFn ? migrateFn(MIGRATE_TEXT) : MIGRATE_TEXT });
  const must = (text, a, b) => { if (!text.includes(a)) throw new Error(`MUTANT DID NOT LAND: anchor missing: ${a.slice(0, 60)}`); return text.replace(a, b); };
  sub('pull filters on updated_at again (= the S0 fault)', (s) => must(s, 'synced_at > $2::timestamptz', 'updated_at > $2::timestamptz'));
  sub('overlap removed', (s) => must(must(s, " - ($3::int * interval '1 millisecond')", ''), '[userId, lastSyncAt, PULL_OVERLAP_MS]', '[userId, lastSyncAt]'));
  for (const t of TABLES) {
    sub(`${t}: upsert no longer writes synced_at = now()`, (s) => {
      const [a, b] = stmtRange(s, t);
      const seg = s.slice(a, b);
      if (!/,\s*synced_at = now\(\)/.test(seg)) throw new Error(`MUTANT DID NOT LAND: ${t}`);
      return s.slice(0, a) + seg.replace(/,(\s*)synced_at = now\(\)/, '$1') + s.slice(b);
    });
  }
  for (const t of TABLES) {
    sub(`${t}: column not added by migrate.ts`, null, (m) => {
      const re = /for \(const t of \[([^\]]*)\]\)/;
      const mm = re.exec(m);
      if (!mm || !mm[1].includes(`'${t}'`)) throw new Error(`MUTANT DID NOT LAND (migrate): ${t}`);
      return m.replace(re, `for (const t of [${mm[1].replace(new RegExp(`'${t}',?\\s*`), '').replace(/,\s*$/, '')}])`);
    });
  }
  sub('cursor from the app clock again (new Date())', (s) => must(s, 'const serverTime = await dbNow();', 'const serverTime = new Date().toISOString();'));
  sub('server stamp replaced by the client stamp (journal_entries)', (s) => {
    const [a, b] = stmtRange(s, 'journal_entries');
    const seg = s.slice(a, b);
    if (!/synced_at = now\(\)/.test(seg)) throw new Error('MUTANT DID NOT LAND: client-stamp');
    return s.slice(0, a) + seg.replace('synced_at = now()', 'synced_at = excluded.updated_at') + s.slice(b);
  });
  return out;
}

// ---------------------------------------------------------------------------
// K1 names arrive as "K1 [table]: ..." normally and as "K1:table" when a scenario THREW; label both alike.
const label = (r) => (r.name.startsWith('K1') ? `K1[${r.name.match(/^K1[: ]\[?(\w+)/)?.[1] ?? '?'}]` : r.name.split(':')[0]);

async function runOnce(syncText, migrateText) {
  const results = [];
  const log = (group, name, pass, detail = '') => results.push({ group, name, pass, detail });
  const router = await buildServer(syncText);
  await runScenarios(router, migrateText, log);
  census(syncText, migrateText, log);
  return results;
}

(async () => {
  await Promise.all(['A', 'B'].map(buildDevice));
  const base = await runOnce(SYNC_TEXT, MIGRATE_TEXT);
  for (const r of base) console.log(`${r.pass ? 'PASS' : 'FAIL'}  [${r.group}] ${r.name}${r.detail ? '  ' + r.detail : ''}`);
  const baseRed = base.filter((r) => !r.pass);
  console.log(`\nBASELINE: ${baseRed.length === 0 ? `GREEN (${base.length} checks: ${base.filter((r) => r.group === 'CLAIM').length} claim, ${base.filter((r) => r.group === 'CONTROL').length} control, ${base.filter((r) => r.group === 'CENSUS').length} census)` : `RED - ${baseRed.length} of ${base.length}`}`);
  let mutantsOk = true;
  if (RUN_MUTANTS) {
    console.log('\nMUTANTS - each server edit removed ALONE (every one must go red on a DYNAMIC claim check K1..K4; the census is reported beside it):');
    for (const mu of mutants()) {
      const res = await runOnce(mu.sync, mu.migrate);
      const red = res.filter((r) => !r.pass);
      const proof = red.filter((r) => r.group === 'CLAIM');            // a DYNAMIC claim check must go red
      const censusRed = red.filter((r) => r.group === 'CENSUS');
      const controlsRed = red.filter((r) => r.group === 'CONTROL');
      const ok = proof.length > 0;
      if (!ok) mutantsOk = false;
      console.log(`${ok ? 'RED  ' : 'GREEN'}  ${mu.name}  ->  ${proof.map(label).join(', ') || '(none)'}   census: ${censusRed.map((r) => r.name.split(':')[0]).join(',') || '-'}${(proof[0] && /THREW/.test(proof[0].detail)) ? `   [${proof[0].detail.replace(/^THREW: /, '').slice(0, 80)}]` : ''}`);
    }
    console.log(`\nMUTANTS: ${mutantsOk ? 'every edit is load-bearing - each, removed alone, turns a dynamic claim check (K1..K4) red' : 'A MUTANT STAYED GREEN - an edit is not load-bearing in this instrument'}`);
  }
  process.exit(baseRed.length === 0 && mutantsOk ? 0 : 1);
})().catch((e) => { console.error('INSTRUMENT ERROR:', e && e.stack || e); process.exit(2); });
