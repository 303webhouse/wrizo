// ITEM 201 - DELETE PERMANENTLY, slices 1 and 2 (the server half and the store half). The instrument.
//
// THE DESIGN (PLAN DESK, plan-168-delete-permanently @ 87eae9a; S0 docs/menus/item201-delete-permanently-s0.md): a permanent
// delete is a TOMBSTONE, never an absence. The row stays on the server - content blanked, id and stamps kept, marked
// `purged_at` - and the mark can never be cleared; every device learns it through the ordinary pull and REPLACES its
// copy on arrival, ignoring "newer only" and "a local unsynced edit wins".
//
// BROWSERLESS: no box turn, no browser, no Postgres. The SERVER is the real apps/server/src/sync.ts router (esbuild-bundled;
// its /sync handler called directly); the DEVICES are real instances of the client store (persistence.ts), each with its
// own localStorage, driven through the real getDirtyRecords / applyRemoteRecords / markClean - the loop store/sync.ts runs.
//
// THE FAKE POOL IS NOT A SQL ENGINE, AND DOES NOT PRETEND TO BE. It interprets ONLY the statements /sync sends, FROM THEIR
// OWN SQL TEXT: the ordinary upsert (its column list, its SET list, and EVERY conjunct of its WHERE - one that is not
// understood THROWS), the PURGE statement (its values, its blanking SET list and its coalesce/greatest expressions), and the
// pull. It learns which columns exist from migrate.ts's own alters. So an edit that is missing changes what the fake sees
// exactly as it would change what Postgres does. Its SQL was ALSO run on a real Postgres 18.4 at S0
// (docs/evidence/item201/s0-purge-sql-check.mjs, 14/14) - this file adds the two-device client flows the S0 could not.
//
// FALSIFICATION IS PART OF THE VERDICT (`--mutants`): each server and client edit is removed ALONE and must turn a dynamic
// claim red.   Run: node apps/desktop/scripts/sync-purge-proof.mjs [--mutants]      exit 0 = baseline green (and every mutant red)
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const RUN_MUTANTS = process.argv.includes('--mutants');
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const desktopSrc = join(repo, 'apps/desktop/src');
const serverSrc = join(repo, 'apps/server/src');
const lf = (s) => s.replace(/\r\n/g, '\n');
const SYNC_TEXT = lf(readFileSync(join(serverSrc, 'sync.ts'), 'utf8'));
const MIGRATE_TEXT = lf(readFileSync(join(serverSrc, 'migrate.ts'), 'utf8'));
const PERS_TEXT = lf(readFileSync(join(desktopSrc, 'store/persistence.ts'), 'utf8'));

const requireDesktop = createRequire(join(repo, 'apps/desktop/package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const tmp = join(tmpdir(), 'wrizo-201-proof');
mkdirSync(tmp, { recursive: true });
const realSetTimeout = globalThis.setTimeout;
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));
const realConsoleError = console.error;

// ---------------------------------------------------------------------------------------------------------------------
// THE FAKE POOL
// ---------------------------------------------------------------------------------------------------------------------
const norm = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
const splitTop = (s) => { const out = []; let d = 0; let cur = ''; for (const c of s) { if (c === '(') d += 1; if (c === ')') d -= 1; if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += c; } if (cur.trim()) out.push(cur.trim()); return out; };

function columnsFrom(migrateText, syncText) {
  // Every column journal_entries has: the base create table, plus every alter, plus synced_at/purged_at from their own statements.
  const base = /create table if not exists journal_entries \(([\s\S]*?)\n\s*\)`/.exec(migrateText);
  const cols = new Set();
  if (base) for (const line of base[1].split('\n')) { const m = /^\s*"?([a-z_]+)"?\s+[a-z]/i.exec(line); if (m) cols.add(m[1]); }
  for (const m of migrateText.matchAll(/alter table journal_entries add column if not exists (\w+)/g)) cols.add(m[1]);
  // 198's synced_at is added in a loop over six tables; journal_entries is one of them.
  if (/for \(const t of \[[^\]]*'journal_entries'[^\]]*\]\)[\s\S]*?synced_at timestamptz not null default now\(\)/.test(migrateText)) cols.add('synced_at');
  return cols;
}

function makePool(migrateText) {
  const jeCols = columnsFrom(migrateText);
  const tables = new Map(['projects', 'story_plans', 'sessions_log', 'drafts', 'drawers', 'journal_entries'].map((t) => [t, new Map()]));
  const clock = () => new Date().toISOString();
  const pool = {
    tables, jeCols, deletes: 0,
    async query(sql, params = []) {
      const s = norm(sql);
      const need = (t, c) => { if (t === 'journal_entries' && !jeCols.has(c)) throw new Error(`column "${c}" of relation "${t}" does not exist`); };
      const m = /^insert into (\w+) \(([^)]*)\) values \((.*?)\) on conflict \(id\) do update set (.*?) where (.*)$/i.exec(s);
      if (m) {
        const [, t, colsTxt, valsTxt, setTxt, whereTxt] = m;
        if (!tables.has(t)) throw new Error(`fake pool: no model for ${t}`);
        const cols = colsTxt.split(',').map((x) => x.trim());
        const vals = splitTop(valsTxt);
        if (cols.length !== vals.length) throw new Error(`PAIRING (${t}): ${cols.length} columns but ${vals.length} values`);
        const stamp = clock();
        const row = {};
        cols.forEach((c, i) => {
          need(t, c);
          const v = vals[i];
          const pm = /^\$(\d+)(::\w+)?$/.exec(v);
          if (pm) { const p = params[Number(pm[1]) - 1]; row[c] = /::jsonb/i.test(v) ? (p == null ? null : JSON.parse(p)) : p; }
          else if (/^'.*'$/.test(v)) row[c] = v.slice(1, -1);
          else throw new Error(`fake pool: cannot interpret value ${v}`);
        });
        if (t === 'journal_entries' && jeCols.has('synced_at')) row.synced_at = stamp;      // the column default now()
        if (t === 'journal_entries' && row.shelved === undefined) row.shelved = false;       // the column default false
        const store = tables.get(t);
        const ex = store.get(row.id);
        if (!ex) { store.set(row.id, row); return { rows: [] }; }
        // THE WHERE: every conjunct is interpreted; one that is not understood throws (a guard silently ignored is a lie).
        const conj = whereTxt.replace(/`$/, '').split(/ and /i).map((x) => x.trim());
        let allow = true;
        for (const c of conj) {
          if (new RegExp(`^${t}\\.user_id = excluded\\.user_id$`).test(c)) { if (ex.user_id !== row.user_id) allow = false; }
          else if (new RegExp(`^excluded\\.updated_at > ${t}\\.updated_at$`).test(c)) { if (!(String(row.updated_at) > String(ex.updated_at))) allow = false; }
          else if (new RegExp(`^${t}\\.purged_at is null$`).test(c)) { need(t, 'purged_at'); if (ex.purged_at != null) allow = false; }
          else throw new Error(`fake pool: cannot interpret WHERE conjunct: ${c}`);
        }
        if (!allow) return { rows: [] };
        const evalRhs = (rhs, col) => {
          let mm;
          if (rhs === `excluded.${col}`) return row[col];
          if ((mm = /^excluded\.(\w+)$/.exec(rhs))) return row[mm[1]];
          if (rhs === 'now()') { need(t, 'synced_at'); return stamp; }
          if (rhs === 'null') return null;
          if (rhs === "''") return '';
          if (rhs === 'false') return false;
          if ((mm = /^(coalesce|greatest)\((\w+)\.(\w+), excluded\.(\w+)\)$/.exec(rhs))) {
            const a = ex[mm[3]]; const b = row[mm[4]];
            return mm[1] === 'coalesce' ? (a ?? b) : (String(a) > String(b) ? a : b);
          }
          throw new Error(`fake pool: cannot interpret SET ${col} = ${rhs}`);
        };
        const sets = splitTop(setTxt).map((a) => { const i = a.indexOf('='); return { l: a.slice(0, i).trim(), r: a.slice(i + 1).trim() }; });
        const next = {};
        for (const { l, r } of sets) { need(t, l); next[l] = evalRhs(r, l); }
        Object.assign(ex, next);
        return { rows: [] };
      }
      const pm = /^select \* from (\w+) where user_id = \$1 and \(\$2::timestamptz is null or synced_at > \$2::timestamptz - \(\$3::int \* interval '1 millisecond'\)\)$/i.exec(s);
      if (pm) {
        const [, t] = pm;
        const [userId, since, overlap] = params;
        const floor = since == null ? null : Date.parse(since) - Number(overlap);
        const rows = [...tables.get(t).values()].filter((r) => r.user_id === userId && (floor === null || Date.parse(r.synced_at) > floor));
        return { rows: rows.map((r) => JSON.parse(JSON.stringify(r))) };
      }
      if (/^select now\(\) as t$/i.test(s)) return { rows: [{ t: new Date() }] };
      if (/^select \* from \w+/i.test(s)) return { rows: [] };
      if (/^delete from/i.test(s)) { pool.deletes += 1; throw new Error('HARD DELETE'); }
      throw new Error(`fake pool: unhandled statement: ${s.slice(0, 110)}`);
    },
  };
  return pool;
}

// ---------------------------------------------------------------------------------------------------------------------
// BUILDS
// ---------------------------------------------------------------------------------------------------------------------
writeFileSync(join(tmp, 'lexicon.mjs'), `export const deskTerm = (k) => k;`);
writeFileSync(join(tmp, 'db.mjs'), `export const pool = { query: (...a) => globalThis.__fakePool.query(...a) };`);
writeFileSync(join(tmp, 'auth.mjs'), `export const requireAuth = (_q, _s, next) => next();`);
let buildN = 0;
async function buildServer(syncText) {
  buildN += 1;
  const out = join(tmp, `server-${buildN}.cjs`);
  await esbuild.build({
    entryPoints: [join(serverSrc, 'sync.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'stubs', setup(b) {
      b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(tmp, 'db.mjs') }));
      b.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: join(tmp, 'auth.mjs') }));
      b.onLoad({ filter: /[\\/]sync\.ts$/ }, () => ({ contents: syncText, loader: 'ts', resolveDir: serverSrc }));
    } }],
  });
  return createRequire(import.meta.url)(out).syncRouter;
}
async function buildDevice(persText) {
  buildN += 1;
  const out = join(tmp, `device-${buildN}.mjs`);
  await esbuild.build({
    stdin: { contents: "export * from './store/persistence';", resolveDir: desktopSrc, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'lex', setup(b) {
      b.onResolve({ filter: /^\.\/deskLexicon$/ }, () => ({ path: join(tmp, 'lexicon.mjs') }));
      if (persText) b.onLoad({ filter: /[\\/]store[\\/]persistence\.ts$/ }, () => ({ contents: persText, loader: 'ts', resolveDir: join(desktopSrc, 'store') }));
    } }],
  });
  return out;
}

const storage = { A: new Map(), B: new Map(), C: new Map() };
let current = 'A';
globalThis.localStorage = {
  getItem: (k) => (storage[current].has(k) ? storage[current].get(k) : null),
  setItem: (k, v) => { storage[current].set(k, String(v)); },
  removeItem: (k) => { storage[current].delete(k); },
  clear: () => { storage[current].clear(); },
};
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};

let worldN = 0;
async function makeWorld(router, migrateText, deviceFile) {
  worldN += 1;
  const pool = makePool(migrateText);
  globalThis.__fakePool = pool;
  for (const k of ['A', 'B', 'C']) storage[k].clear();
  const layer = router.stack.find((l) => l.route && l.route.path === '/sync' && l.route.methods.post);
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  const call = (body) => new Promise((resolve, reject) => { handle({ session: { userId: 'u1' }, body }, { json: resolve }, (e) => reject(e || new Error('handler called next()'))); });
  const devices = {};
  for (const n of ['A', 'B', 'C']) { current = n; devices[n] = await import(`${pathToFileURL(deviceFile).href}?w=${worldN}-${n}`); }
  const cursors = { A: null, B: null, C: null };
  const on = (n) => { current = n; return devices[n]; };
  const KEYS = ['projects', 'storyPlans', 'sessions', 'drafts', 'journalEntries', 'drawers'];
  const sync = async (n, fullPull = false) => {
    const d = on(n);
    const dirty = d.getDirtyRecords();
    const stamps = new Map(); for (const k of KEYS) for (const r of dirty[k]) stamps.set(r.id, r.updatedAt);
    const resp = await call({ lastSyncAt: fullPull ? null : cursors[n], push: dirty });
    const dd = on(n);
    dd.applyRemoteRecords(resp.pull);
    const still = new Map(); for (const k of KEYS) for (const r of dd.getDirtyRecords()[k]) still.set(r.id, r.updatedAt);
    dd.markClean([...stamps].filter(([id, ts]) => !still.has(id) || still.get(id) === ts).map(([id]) => id));
    cursors[n] = resp.serverTime;
    await sleep(3);
  };
  const stored = (n, id) => { current = n; devices[n].flushNow(); const rows = JSON.parse(storage[n].get('writer-studio-journal-entries') || '[]'); return rows.find((e) => e.id === id) || null; };
  const serverRow = (id) => pool.tables.get('journal_entries').get(id) || null;
  return { pool, on, sync, call, stored, serverRow, cursors };
}

const results = [];
const log = (group, name, pass, detail = '') => results.push({ group, name, pass, detail });
const guard = async (group, name, fn) => { try { await fn(); } catch (e) { log(group, name, false, `THREW: ${String(e && e.stack || e).slice(0, 240)}`); } };
const SECRET = 'SECRET WORDS THAT MUST NOT SURVIVE';
const mk = (d, id) => d.createJournalPage({ id, text: SECRET, pageType: 'page', projectId: null, origin: null, boxes: [{ id: 'b1', kind: 'text', x: 0, y: 0, w: 0.2, h: 0.2, z: 1, text: 'SECRET CARD' }] });
const CONTENT_COLS = ['project_id', 'text', 'session_id', 'starred', 'source', 'shelved', 'beat_id', 'page_type', 'order_index', 'imported_at', 'boxes', 'script', 'origin', 'tutor', 'tags', 'routed_project_ids', 'strokes', 'plan_board_id', 'page_settings'];

// ---------------------------------------------------------------------------------------------------------------------
async function scenarios(router, migrateText, deviceFile) {
  const errs = [];
  console.error = (...a) => { errs.push(a.map((x) => (x && x.message) || String(x)).join(' ').slice(0, 200)); };

  // ---- P1 THE TOMBSTONE REACHES ANOTHER DEVICE (design check 1) -----------------------------------------------------------
  await guard('CLAIM', 'P1', async () => {
    const w = await makeWorld(router, migrateText, deviceFile);
    mk(w.on('A'), 'P'); await sleep(3);
    await w.sync('A'); await w.sync('B');
    const heldByB = !!w.on('B').getJournalEntry('P');
    w.on('A').softDeleteEntry('P'); await sleep(3);
    const purged = w.on('A').purgeEntry('P'); await sleep(3);
    await w.sync('A'); await w.sync('B');                                       // B's ordinary INCREMENTAL pull
    const b = w.stored('B', 'P');
    const srv = w.serverRow('P');
    log('CLAIM', 'P1a: A purges a page B holds; B\'s next pull REPLACES its copy with the tombstone - blank text, no payload, purgedAt set - in B\'s own storage', heldByB && purged && !!b && b.text === '' && !!b.purgedAt && b.boxes === undefined, JSON.stringify({ heldByB, purged, bStored: b }));
    log('CLAIM', 'P1b: the item is absent from EVERY list on B: not readable, not in the Trash, no Restore', w.on('B').getJournalEntry('P') === null && w.on('B').getJournalEntryIncludingDeleted('P') === null && !w.on('B').getDeletedEntries().some((e) => e.id === 'P'), JSON.stringify({ live: w.on('B').getJournalEntry('P'), incl: w.on('B').getJournalEntryIncludingDeleted('P'), trash: w.on('B').getDeletedEntries().map((e) => e.id) }));
    log('CLAIM', 'P1c: and A\'s own storage holds no content either - the flush re-serialises the cache wholesale, so nothing of the words is left in localStorage', w.stored('A', 'P') && w.stored('A', 'P').text === '' && !JSON.stringify(storage.A.get('writer-studio-journal-entries')).includes('SECRET'), '');
    log('CLAIM', 'P1d: the server row is a TOMBSTONE: content blank, id and stamps kept, purged_at and deleted_at set, and no payload column still holds anything', !!srv && srv.text === '' && srv.purged_at && srv.deleted_at && CONTENT_COLS.filter((c) => c !== 'text' && c !== 'shelved').every((c) => srv[c] === null || srv[c] === undefined) && srv.created_at, JSON.stringify(srv));
  });

  // ---- P2 A STALE HOLDER CANNOT REVIVE IT; P3 the long-offline device with a dirty edit (design checks 2, 3) --------------------
  await guard('CLAIM', 'P2', async () => {
    const w = await makeWorld(router, migrateText, deviceFile);
    mk(w.on('A'), 'P'); await sleep(3);
    await w.sync('A'); await w.sync('B'); await w.sync('C');                    // A, B and C all hold P
    w.on('A').softDeleteEntry('P'); await sleep(3); w.on('A').purgeEntry('P'); await sleep(3);
    await w.sync('A');                                                          // the purge is on the server; C is offline and knows nothing
    w.on('C').patchJournalEntry('P', 'C EDITED IT OFFLINE - newer than everything', {}); await sleep(3);
    const cDirtyBefore = w.on('C').getDirtyRecords().journalEntries.some((e) => e.id === 'P');
    await w.sync('C');                                                          // C returns with an OLD cursor and a DIRTY local edit
    const srv = w.serverRow('P');
    log('CLAIM', 'P2a (design checks 2+3): the long-offline device\'s push is REFUSED - the server row is unchanged, still blank, still purged', cDirtyBefore && srv.text === '' && !!srv.purged_at, JSON.stringify({ cDirtyBefore, serverText: srv.text, purged: !!srv.purged_at }));
    log('CLAIM', 'P2b: and its very next pull REPLACES its dirty copy with the tombstone - its unsynced edit is DISCARDED on arrival (the loss is the deletion he asked for) and the item is gone from C', w.on('C').getJournalEntry('P') === null && (w.stored('C', 'P') || {}).text === '', JSON.stringify({ live: w.on('C').getJournalEntry('P'), stored: w.stored('C', 'P') }));
    log('CLAIM', 'P2c: C does not push the blank record back forever - its dirty flag for it is CLEARED', !w.on('C').getDirtyRecords().journalEntries.some((e) => e.id === 'P'), JSON.stringify(w.on('C').getDirtyRecords().journalEntries.map((e) => e.id)));
  });

  // ---- P4 MONOTONE (design check 4): no upsert of any kind clears purged_at ---------------------------------------------------
  await guard('CLAIM', 'P4', async () => {
    const w = await makeWorld(router, migrateText, deviceFile);
    mk(w.on('A'), 'P'); await sleep(3); await w.sync('A');
    w.on('A').softDeleteEntry('P'); await sleep(3); w.on('A').purgeEntry('P'); await sleep(3); await w.sync('A');
    const purgedAt = w.serverRow('P').purged_at;
    const later = new Date(Date.now() + 60_000).toISOString();
    await w.call({ lastSyncAt: null, push: { journalEntries: [{ id: 'P', text: 'REVIVED', projectId: null, createdAt: '2026-06-01T00:00:00.000Z', updatedAt: later, boxes: [{ id: 'x' }] }] } });
    await w.call({ lastSyncAt: null, push: { journalEntries: [{ id: 'P', text: 'PURGED AGAIN', projectId: null, createdAt: '2026-06-01T00:00:00.000Z', updatedAt: later, deletedAt: later, purgedAt: later }] } });
    const srv = w.serverRow('P');
    log('CLAIM', 'P4: a "restore" of a purged item - a push with a NEWER updated_at and no deleted_at - changes nothing; and purging again cannot move purged_at (the first purge time stays)', srv.text === '' && srv.boxes === null && srv.purged_at === purgedAt, JSON.stringify({ text: srv.text, boxes: srv.boxes, purgedBefore: purgedAt, purgedAfter: srv.purged_at }));
  });

  // ---- P5 THE SERVER BLANKS THE CONTENT (design check 5); P7 an id the server never saw --------------------------------------------
  await guard('CLAIM', 'P5', async () => {
    const w = await makeWorld(router, migrateText, deviceFile);
    const now = new Date().toISOString();
    const full = { id: 'P', text: SECRET, projectId: 'proj', sessionId: 's', starred: true, source: 'page', shelved: true, beatId: 'b', pageType: 'manuscript', orderIndex: 3, importedAt: now, boxes: [{ id: 'b1' }], script: { v: 1, scenes: [] }, origin: 'journal', tutor: { x: 1 }, tags: ['t'], routedProjectIds: ['r'], strokes: [{ p: 1 }], planBoardId: 'pb', pageSettings: { kind: 'normal' }, createdAt: now, updatedAt: now };
    await w.call({ lastSyncAt: null, push: { journalEntries: [full] } });
    const beforeText = w.serverRow('P') && w.serverRow('P').text;      // a SNAPSHOT: the row object is mutated in place by the purge
    await w.call({ lastSyncAt: null, push: { journalEntries: [{ ...full, updatedAt: new Date(Date.now() + 1000).toISOString(), deletedAt: now, purgedAt: now }] } });   // a purge that CARRIES all the content
    const srv = w.serverRow('P');
    const still = CONTENT_COLS.filter((c) => c !== 'text' && c !== 'shelved' && srv[c] !== null && srv[c] !== undefined);
    log('CLAIM', 'P5 (design check 5): a purge pushed WITH the full record - every payload column - leaves the server row blank: the server ignores the client\'s content, so a client cannot purge "halfway"', beforeText === SECRET && srv.text === '' && srv.shelved === false && still.length === 0 && !!srv.purged_at && !!srv.deleted_at && !!srv.created_at, JSON.stringify({ beforeText: beforeText === SECRET, text: srv.text, shelved: srv.shelved, purged: !!srv.purged_at, deleted: !!srv.deleted_at, created: !!srv.created_at, stillSet: still, swallowed: errs.slice(0, 2) }));
    // P7: an id the server has never seen.
    await w.call({ lastSyncAt: null, push: { journalEntries: [{ id: 'GHOST', text: SECRET, projectId: null, createdAt: now, updatedAt: now, deletedAt: now, purgedAt: now, boxes: [{ id: 'b' }] }] } });
    const g1 = w.serverRow('GHOST');
    await w.call({ lastSyncAt: null, push: { journalEntries: [{ id: 'GHOST', text: 'A DEVICE THAT STILL HOLDS IT', projectId: null, createdAt: now, updatedAt: new Date(Date.now() + 5000).toISOString() }] } });
    const g2 = w.serverRow('GHOST');
    log('CLAIM', 'P7: a purge of an id the server NEVER saw inserts a tombstone (a page created and purged offline), so a device that still holds it cannot INSERT it back later - its push is refused', !!g1 && g1.text === '' && !!g1.purged_at && g2.text === '', JSON.stringify({ tombstone: !!g1, textAfterLatePush: g2 && g2.text }));
  });

  // ---- P8 THE STORE'S OWN RULES ------------------------------------------------------------------------------------------------
  await guard('CLAIM', 'P8', async () => {
    const w = await makeWorld(router, migrateText, deviceFile);
    const A = w.on('A');
    mk(A, 'LIVE'); mk(A, 'TRASHED'); mk(A, 'PURGED'); await sleep(3);
    A.softDeleteEntry('TRASHED'); A.softDeleteEntry('PURGED'); await sleep(3);
    const liveRefused = A.purgeEntry('LIVE') === false;
    const okPurged = A.purgeEntry('PURGED') === true;
    const twice = A.purgeEntry('PURGED') === false;
    A.restoreEntry('PURGED');
    const trash = A.getDeletedEntries().map((e) => e.id).sort();
    log('CLAIM', 'P8a: purge is a TRASH act - a page that is not in the Trash cannot be purged, a purged one cannot be purged again', liveRefused && okPurged && twice, JSON.stringify({ liveRefused, okPurged, twice }));
    log('CLAIM', 'P8b: the Trash lists the trashed page and NOT the tombstone, and Restore on a tombstone does nothing', trash.join() === 'TRASHED' && A.getJournalEntryIncludingDeleted('PURGED') === null && A.getJournalEntry('LIVE') !== null, JSON.stringify({ trash }));
    log('CONTROL', 'C1: an ordinary trashed page still restores (the guard freezes only purged items)', (() => { A.restoreEntry('TRASHED'); return A.getJournalEntry('TRASHED') !== null; })(), '');
  });

  // ---- P9 THE COMMON CASE IS UNTOUCHED ------------------------------------------------------------------------------------------
  await guard('CLAIM', 'P9', async () => {
    const w = await makeWorld(router, migrateText, deviceFile);
    mk(w.on('A'), 'P'); await sleep(3); await w.sync('A'); await w.sync('B');
    w.on('A').patchJournalEntry('P', 'an ordinary edit', {}); await sleep(3);
    await w.sync('A'); await w.sync('B');
    log('CLAIM', 'P9: an ordinary edit to a page that was never purged still lands and reaches the other device - the freeze applies only to purged rows', w.serverRow('P').text === 'an ordinary edit' && w.on('B').getJournalEntry('P').text === 'an ordinary edit' && !w.serverRow('P').purged_at, JSON.stringify({ server: w.serverRow('P').text, b: w.on('B').getJournalEntry('P').text }));
  });
  console.error = realConsoleError;
}

// ---------------------------------------------------------------------------------------------------------------------
// CENSUS - from the source text, never run.
// ---------------------------------------------------------------------------------------------------------------------
function census(syncText, migrateText, log2) {
  // THE LEAK GUARD (design section 4 / S0): the purge blanks an explicit list; a column added to journal_entries and
  // forgotten there would leak content through a "permanent" delete. Derive the live columns from the sources.
  const KEEP = new Set(['id', 'user_id', 'created_at', 'updated_at', 'deleted_at', 'purged_at', 'synced_at']);
  const live = [...columnsFrom(migrateText)].filter((c) => !KEEP.has(c)).sort();
  const fn = /async function purgeJournalEntry[\s\S]*?on conflict \(id\) do update set([\s\S]*?)where journal_entries\.user_id/.exec(syncText);
  const blanked = fn ? [...fn[1].matchAll(/^\s*(\w+) = (null|''|false),?\s*$/gm)].map((m) => m[1]).sort() : [];
  const missing = live.filter((c) => !blanked.includes(c));
  const extra = blanked.filter((c) => !live.includes(c));
  log2('CENSUS', 'N1 THE LEAK GUARD: the purge blanks EVERY journal_entries column that is not identity or a stamp - derived from migrate.ts and sync.ts, so a column added later (page_links, beside_links) that the purge forgot turns this red instead of leaking content' + (missing.length ? ` - MISSING: ${missing.join(', ')}` : ''), missing.length === 0 && extra.length === 0 && live.length > 0, JSON.stringify({ liveColumns: live.length, blanked: blanked.length, missing, extra }));
  const files = readdirSync(serverSrc).filter((f) => f.endsWith('.ts'));
  const hard = files.filter((f) => /delete\s+from\s+(projects|story_plans|sessions_log|drafts|drawers|journal_entries)\b/i.test(readFileSync(join(serverSrc, f), 'utf8')));
  log2('CENSUS', 'N2 (design check 6): NO HARD DELETE on any synced table anywhere in apps/server/src - the guard that stops the obvious build from ever being written', hard.length === 0, JSON.stringify({ filesWithDeleteFrom: hard }));
  log2('CENSUS', 'N3: the ordinary upsert freezes a purged row (`and journal_entries.purged_at is null`) and a record carrying purgedAt is routed to purgeJournalEntry, never the ordinary upsert', /and journal_entries\.purged_at is null/.test(syncText) && /if \(e\.purgedAt\) \{\s*try \{ await purgeJournalEntry/.test(syncText), '');
  log2('CENSUS', 'N4: purged_at is ONE nullable column added by migrate.ts (no default, no NOT NULL) and mapped SQL-null -> JS-undefined', /alter table journal_entries add column if not exists purged_at timestamptz`/.test(migrateText) && /purgedAt: iso\(r\.purged_at\) \?\? undefined/.test(syncText), '');
}

// ---------------------------------------------------------------------------------------------------------------------
function mutantList() {
  const out = [];
  const must = (t, a, b) => { if (!t.includes(a)) throw new Error(`MUTANT DID NOT LAND: ${a.slice(0, 70)}`); return t.replace(a, b); };
  const mutS = (name, fn) => out.push({ name, sync: fn });
  const mutM = (name, fn) => out.push({ name, migrate: fn });
  const mutP = (name, fn) => out.push({ name, pers: fn });
  mutM('E1: the purged_at column is not added', (t) => must(t, 'await pool.query(`alter table journal_entries add column if not exists purged_at timestamptz`);', ''));
  mutS('E2: the ordinary upsert no longer freezes a purged row', (t) => must(t, '           and journal_entries.purged_at is null\n', ''));
  mutS('E3: a purge is not routed to its own statement (it goes through the ordinary upsert)', (t) => must(t, '    if (e.purgedAt) {\n      try { await purgeJournalEntry', '    if (false) {\n      try { await purgeJournalEntry'));
  mutS('E4: the purge no longer blanks the board cards (boxes)', (t) => must(t, '       boxes = null,\n', ''));
  mutS('E4: the purge no longer blanks the text', (t) => must(t, "       text = '',\n", ''));
  mutS('E4: the purge no longer keeps its FIRST purged_at (coalesce -> the incoming value)', (t) => must(t, 'purged_at = coalesce(journal_entries.purged_at, excluded.purged_at),', 'purged_at = excluded.purged_at,'));
  mutS('E4: the server no longer sets deleted_at itself', (t) => must(t, 'deleted_at = coalesce(journal_entries.deleted_at, excluded.deleted_at),\n       purged_at', 'purged_at'));
  mutS('E5: the mapper drops purged_at (the tombstone reaches a device as an ordinary blank deleted page)', (t) => must(t, '    purgedAt: iso(r.purged_at) ?? undefined,\n', ''));
  mutP('C1: applyCollection no longer lets a tombstone through (it obeys "newer only" and "local dirty wins" again)', (t) => must(t, "    if ((rec as { purgedAt?: string }).purgedAt) {", "    if (false as boolean) {"));
  mutP('C2: a replaced record keeps its dirty flag (the device pushes the blank record back)', (t) => must(t, '      dirty[name].delete(rec.id);\n      if (at >= 0 && (collection[at]', '      if (at >= 0 && (collection[at]'));
  mutP('C3: the Trash lists tombstones (getDeletedEntries no longer excludes purged)', (t) => must(t, '.filter(e => !!e.deletedAt && !e.purgedAt && getSystemKind(e) === undefined)', '.filter(e => !!e.deletedAt && getSystemKind(e) === undefined)').replace('.filter(e => !!e.deletedAt && !e.purgedAt && getSystemKind(e) === undefined)', '.filter(e => !!e.deletedAt && getSystemKind(e) === undefined)'));
  mutP('C4: purgeEntry no longer requires the item to be in the Trash', (t) => must(t, '  if (!entry || !entry.deletedAt || entry.purgedAt) return false;\n  const now', '  if (!entry || entry.purgedAt) return false;\n  const now'));
  mutP('C5: the deleted-inclusive reader returns a tombstone', (t) => must(t, '  if (entry && entry.purgedAt) return null;\n', ''));
  return out;
}

let runN = 0;
async function runOnce({ sync, migrate, pers } = {}) {
  runN += 1;
  results.length = 0;
  const syncText = sync ? sync(SYNC_TEXT) : SYNC_TEXT;
  const migrateText = migrate ? migrate(MIGRATE_TEXT) : MIGRATE_TEXT;
  const router = await buildServer(syncText);
  const deviceFile = await buildDevice(pers ? pers(PERS_TEXT) : null);
  await scenarios(router, migrateText, deviceFile);
  census(syncText, migrateText, (g, n, p, d) => log(g, n, p, d));
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
      const res = await runOnce(mu);
      const proof = res.filter((r) => r.group === 'CLAIM' && !r.pass).map((r) => r.name.split(' ')[0]);
      const cen = res.filter((r) => r.group === 'CENSUS' && !r.pass).map((r) => r.name.split(' ')[0]);
      const ok = proof.length > 0 || (mu.name.startsWith('E4') && cen.length > 0 && proof.length > 0);
      if (!(proof.length > 0)) mutantsOk = false;
      console.log(`${proof.length > 0 ? 'RED  ' : 'GREEN'}  ${mu.name}  ->  ${proof.join(', ') || '(none)'}   census: ${cen.join(',') || '-'}`);
    }
    console.log(`\nMUTANTS: ${mutantsOk ? 'every edit is load-bearing - each, removed alone, turns a dynamic claim red' : 'A MUTANT STAYED GREEN - an edit is not load-bearing in this instrument'}`);
  }
  process.exit(red.length === 0 && mutantsOk ? 0 : 1);
})().catch((e) => { console.error('INSTRUMENT ERROR:', e && e.stack || e); process.exit(2); });
