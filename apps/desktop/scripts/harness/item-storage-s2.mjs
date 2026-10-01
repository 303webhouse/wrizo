// STORAGE-FULL STEP 2 — THE DEVICE STORE MOVES TO INDEXEDDB. Browserless: the whole engine (idbStore.ts,
// writeAheadJournal.ts, storageMigration.ts, persistence.ts's reworked hydrate/flush/boot) runs bundled in Node
// against a FAKE localStorage/window/IndexedDB, so this proves the real wiring, not a description of it.
//   Run: node apps/desktop/scripts/harness/item-storage-s2.mjs
//
// FIVE THINGS, IN THE ORDER FABLE'S RULING MAKES THEM TRUE:
//   1. flushNow() KEEPS ITS SYNCHRONOUS CONTRACT — the write-ahead journal lands before flush() returns, even
//      though the real IndexedDB commit is still in flight. This is the central claim the 35 production call sites
//      and every durableSeam test seam depend on; proven by reading the journal SYNCHRONOUSLY, same tick, no await.
//   2. ONE ROW PER RECORD — a write costs what changed, never a whole-collection re-serialize.
//   3. THE RACE GUARD — a commit that completes AFTER a newer edit was already queued behind it must not clear the
//      newer edit's own pending/journal entry (would silently regress a page to an older version).
//   4. BOOT REPLAY — a "crash" (a transaction that never committed) is recovered whole from the journal on the next
//      boot, and the journal then clears once replayed.
//   5. MIGRATION, ONCE, VERIFIED — and the signed-in/signed-out asymmetry in when legacy localStorage is cleared.
// Every mutation is applied to the SOURCE TEXT before bundling and asserted to have landed before its check is
// trusted.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installFakeIndexedDB, resetFakeIndexedDB, failNextCommit, pauseAllCommits, releasePaused, releaseNext, COMMIT_DELAY_MS } from './fakeIndexedDB.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..', '..');
const SRC = join(desktop, 'src');
const { build } = createRequire(createRequire(join(desktop, 'package.json')).resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 300)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// idbCommit's own first `await` (opening the database) resolves over a few MICROTASK ticks (fakeIndexedDB.mjs's
// `queueMicrotask`), not synchronously — so a transaction is not actually "queued, paused" the instant a seam call
// RETURNS; it is queued a few microtasks later. `sleep(0)` (a macrotask) is guaranteed to run only after every
// currently-queued microtask has drained, which is the precise barrier a test needs before calling `releaseNext()`
// — calling it too early is a silent no-op (nothing queued yet to release), which would make a race test pass
// vacuously regardless of whether the guard it is meant to prove actually works.
const drainMicrotasks = () => sleep(0);
const AFTER_COMMIT = COMMIT_DELAY_MS + 15; // enough real time for a fake transaction's setTimeout(COMMIT_DELAY_MS) to fire

// Harness files (this one included) are CRLF; every mutation anchor below is written against LF.
const LF = String.fromCharCode(10);
const CRLF = String.fromCharCode(13) + LF;
const deCRLF = (t) => t.split(CRLF).join(LF);
const src = (rel) => deCRLF(readFileSync(join(SRC, rel), 'utf8'));

const FAKE_API = `
  export class SyncHttpError extends Error { constructor(status, message) { super(message || 'http'); this.status = status; } }
  export async function apiSync() { return { serverTime: new Date().toISOString(), pull: {} }; }
`;

// Bundle a re-export of the named modules; a fresh module instance per call (real exported code, never a
// comment-only nonce — esbuild strips plain comments from its output, which silently collapsed every "fresh
// session" in step 1's own harness to the SAME bundle text until that was found and fixed; fixed here from the start).
let nonce = 0;
async function load(entries, overrides = {}) {
  nonce += 1;
  const res = await build({
    stdin: { contents: `export const __harnessNonce = ${nonce};\n${entries.map((e) => `export * from './store/${e}';`).join('\n')}`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    plugins: [{ name: 'ov', setup(b) {
      b.onResolve({ filter: /^\.\/api$/ }, () => ({ path: `fake-api-${nonce}`, namespace: 'fake-api' }));
      b.onLoad({ filter: /.*/, namespace: 'fake-api' }, () => ({ contents: FAKE_API, loader: 'js' }));
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = relative(SRC, args.path).split('\\').join('/');
        const text = readFileSync(args.path, 'utf8');
        return { contents: overrides[rel] ? overrides[rel](deCRLF(text)) : text, loader: 'ts' };
      });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor missing: ${JSON.stringify(from.slice(0, 90))}`); return t.replace(from, to); };

function installFakeEnv({ withIdb = true } = {}) {
  const map = new Map();
  const win = {};
  globalThis.window = win;
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
  };
  // Node 24 defines `globalThis.navigator` as a non-writable getter; a plain `=` throws, so it must be redefined.
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'test' }, configurable: true, writable: true }); // no `storage.estimate` — the usage check simply no-ops
  delete globalThis.indexedDB;
  if (withIdb) installFakeIndexedDB(globalThis);
  return { map, win };
}

const PAGE = (id, text = 'hello') => ({ id, text, createdAt: new Date().toISOString(), origin: null });

// ===========================================================================================================
// 1 · idbStore.ts ALONE
// ===========================================================================================================
{
  resetFakeIndexedDB();
  installFakeEnv();
  const I = await load(['idbStore']);
  ok('AVAILABLE: the fake registers as available (the feature-detect itself is exercised, not assumed)', I.indexedDbAvailable() === true, '');
  await I.idbCommit(['a'], 'a', [{ id: '1', v: 1 }, { id: '2', v: 2 }]);
  const rows = await I.idbGetAll(['a'], 'a');
  ok('ROUND TRIP: a committed put is read back by getAll', JSON.stringify(rows.sort((a, b) => a.id.localeCompare(b.id))) === JSON.stringify([{ id: '1', v: 1 }, { id: '2', v: 2 }]), JSON.stringify(rows));
  await I.idbCommit(['a'], 'a', [{ id: '3', v: 3 }], ['1']);
  const rows2 = await I.idbGetAll(['a'], 'a');
  ok('ONE TRANSACTION, PUT AND DELETE TOGETHER: both land (or neither would)', JSON.stringify(rows2.map((r) => r.id).sort()) === JSON.stringify(['2', '3']), JSON.stringify(rows2));
  await I.idbClear(['a'], 'a');
  ok('CLEAR: empties the store', (await I.idbGetAll(['a'], 'a')).length === 0, '');

  delete globalThis.indexedDB;
  ok('UNAVAILABLE: a device with no indexedDB global reads as unavailable (the legacy fallback\'s own trigger)', I.indexedDbAvailable() === false, '');
}

// ===========================================================================================================
// 2 · writeAheadJournal.ts ALONE
// ===========================================================================================================
{
  installFakeEnv();
  const J = await load(['writeAheadJournal']);
  ok('EMPTY: a fresh journal is empty', J.journalSize() === 0, '');
  J.journalPut('journalEntries', { id: 'a', text: 'x', updatedAt: '1' });
  ok('PUT: one entry, one size', J.journalSize() === 1, '');
  ok('PEEK: reads the entry back by collection+id', JSON.stringify(J.journalPeek('journalEntries', 'a')) === JSON.stringify({ record: { id: 'a', text: 'x', updatedAt: '1' } }), '');
  J.journalDelete('journalEntries', 'b');
  ok('TOMBSTONE: a delete entry is shaped { deleted: true }, distinct from a record entry', JSON.stringify(J.journalPeek('journalEntries', 'b')) === JSON.stringify({ deleted: true }), '');
  J.journalClearId('journalEntries', 'a');
  ok('CLEAR ONE: removes just that id — the tombstone for "b" is untouched', J.journalPeek('journalEntries', 'a') === undefined && J.journalPeek('journalEntries', 'b') !== undefined, '');
  J.journalPut('projects', { id: 'p1', updatedAt: '1' });
  const all = J.journalReadAll();
  ok('READ ALL: every collection\'s bucket, for boot replay', JSON.stringify(Object.keys(all).sort()) === JSON.stringify(['journalEntries', 'projects']), JSON.stringify(all));
  J.journalClearAll();
  ok('CLEAR ALL: empties every collection', J.journalSize() === 0, '');
}

// ===========================================================================================================
// 3 · storageMigration.ts ALONE
// ===========================================================================================================
{
  resetFakeIndexedDB();
  installFakeEnv();
  const M = await load(['idbStore', 'storageMigration']);
  const PLAN = (signedIn) => ({ storeNames: ['journalEntries'], legacyKeys: { journalEntries: 'legacy-key' }, signedIn });
  ok('MIGRATION STATE: starts not-started', M.getMigrationState() === 'not-started', '');

  globalThis.localStorage.setItem('legacy-key', JSON.stringify([{ id: 'a', updatedAt: '1' }, { id: 'b', updatedAt: '1' }]));
  const r1 = await M.migrateLegacyStorageOnce(PLAN(false)); // signed OUT
  ok('SIGNED OUT, first pass: migrates and VERIFIES, but does not clear yet', r1.state === 'migrated-pending-clear' && r1.migratedCollections.includes('journalEntries') && r1.clearedKeys.length === 0, JSON.stringify(r1));
  ok('SIGNED OUT: the legacy key is STILL THERE after the first verified pass', globalThis.localStorage.getItem('legacy-key') !== null, '');
  const landed = await M.idbGetAll(['journalEntries'], 'journalEntries');
  ok('SIGNED OUT: the records genuinely landed in IndexedDB on the first pass (not merely a state flag flipped)', landed.some((r) => r.id === 'a') && landed.some((r) => r.id === 'b'), JSON.stringify(landed));

  const r2 = await M.migrateLegacyStorageOnce(PLAN(false)); // a LATER, independent boot — re-verifies
  ok('SIGNED OUT, second verified pass: NOW clears the legacy copy and reaches "done"', r2.state === 'done' && r2.clearedKeys.includes('legacy-key'), JSON.stringify(r2));
  ok('SIGNED OUT: legacy key is gone only after the SECOND verified boot', globalThis.localStorage.getItem('legacy-key') === null, '');
  const r3 = await M.migrateLegacyStorageOnce(PLAN(false));
  ok('DONE: a further call is a true no-op', JSON.stringify(r3) === JSON.stringify({ state: 'done', migratedCollections: [], clearedKeys: [] }), JSON.stringify(r3));

  // Signed IN: clears on the SAME boot as a verified migration.
  resetFakeIndexedDB();
  installFakeEnv();
  const M2 = await load(['idbStore', 'storageMigration']);
  globalThis.localStorage.setItem('legacy-key', JSON.stringify([{ id: 'c', updatedAt: '1' }]));
  const r4 = await M2.migrateLegacyStorageOnce(PLAN(true));
  ok('SIGNED IN: the server copy is the floor — clears on the SAME boot as a verified migration', r4.state === 'done' && r4.clearedKeys.includes('legacy-key') && globalThis.localStorage.getItem('legacy-key') === null, JSON.stringify(r4));

  // A VERIFICATION FAILURE must not clear the legacy copy, signed in or not.
  resetFakeIndexedDB();
  installFakeEnv();
  // A broken idbCommit that silently drops every record it is given — simulating "the write resolved but did not land."
  const M3b = await load(['idbStore', 'storageMigration'], {
    'store/idbStore.ts': swap(
      'export async function idbCommit(\n  storeNames: readonly string[],\n  name: string,\n  puts: readonly { id: string }[],\n  deletes: readonly string[] = [],\n): Promise<void> {\n  if (puts.length === 0 && deletes.length === 0) return;',
      'export async function idbCommit(\n  storeNames: readonly string[],\n  name: string,\n  puts: readonly { id: string }[],\n  deletes: readonly string[] = [],\n): Promise<void> {\n  return;',
    ),
  });
  globalThis.localStorage.setItem('legacy-key', JSON.stringify([{ id: 'd', updatedAt: '1' }]));
  const r5 = await M3b.migrateLegacyStorageOnce(PLAN(true));
  ok('VERIFY FAILS: a migration whose write never actually landed does NOT clear the legacy copy, even signed in', r5.state === 'not-started' && r5.clearedKeys.length === 0 && globalThis.localStorage.getItem('legacy-key') !== null, JSON.stringify(r5));
}

// ===========================================================================================================
// 4 · persistence.ts, INTEGRATED — flushNow()'s synchronous contract, one-row-per-record, the race guard
// ===========================================================================================================
{
  resetFakeIndexedDB();
  installFakeEnv();
  const P = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser']);
  await P.storageReady;
  const W = globalThis.window;

  // --- 1. flushNow()'s synchronous contract -----------------------------------------------------------------
  const before = Date.now();
  W.wrizoCreateJournalPage(PAGE('sync1'));
  const elapsedSync = Date.now() - before;
  const journalRightAway = globalThis.localStorage.getItem('writer-studio-waj-v1');
  ok('SYNCHRONOUS CONTRACT: wrizoCreateJournalPage (a durableSeam call) returns having ALREADY written the journal — no await needed, matching every one of the 35 production call sites', journalRightAway !== null && JSON.parse(journalRightAway).journalEntries?.sync1 !== undefined, journalRightAway);
  ok('SYNCHRONOUS CONTRACT: this took native-call time, not "waited for a network-speed promise" (a sanity bound, not a precise timing claim)', elapsedSync < 50, `${elapsedSync}ms`);
  // IndexedDB is NOT the source of truth yet at this instant — the journal is what made the call durable.
  const idbRightAway = await P.idbGetAll(['journalEntries'], 'journalEntries');
  ok('AT THIS INSTANT: IndexedDB does not have it yet (it is still in flight) — the journal is what is actually durable right now', idbRightAway.length === 0, JSON.stringify(idbRightAway));

  await sleep(AFTER_COMMIT);
  const idbAfter = await P.idbGetAll(['journalEntries'], 'journalEntries');
  ok('ONCE THE COMMIT LANDS: IndexedDB has the record and the journal entry for it is cleared', idbAfter.some((r) => r.id === 'sync1') && JSON.parse(globalThis.localStorage.getItem('writer-studio-waj-v1') || '{}').journalEntries?.sync1 === undefined, JSON.stringify({ idbAfter, journal: globalThis.localStorage.getItem('writer-studio-waj-v1') }));

  // --- 2. one row per record: a SECOND collection's write does not touch the first's stored row -------------
  W.wrizoCreateProject('another project');
  await sleep(AFTER_COMMIT);
  const je = await P.idbGetAll(['journalEntries'], 'journalEntries');
  ok('ONE ROW PER RECORD: writing to projects does not re-touch journalEntries\' own store at all (still exactly the one row)', je.length === 1 && je[0].id === 'sync1', JSON.stringify(je));

  // --- 3. the hard delete: a tombstone reaches IndexedDB as an actual removal ---------------------------------
  W.wrizoCreateProject('for a draft');
  const pid = (await P.idbGetAll(['projects'], 'projects')).find((p) => p.title === 'for a draft')?.id;
  // saveDraft/clearDraft are not window seams (not durableSeam-wrapped) — PageEditor.tsx's own toggleStar pattern is
  // "call the plain store function, then flushNow()", so this does the same rather than waiting out the 300ms debounce.
  P.saveDraft('d1', 'draft text');
  P.flushNow();
  await sleep(AFTER_COMMIT);
  const draftsBefore = await P.idbGetAll(['drafts'], 'drafts');
  ok('DRAFT SAVED: lands as a normal per-record row first', draftsBefore.some((d) => d.id === 'd1'), JSON.stringify(draftsBefore));
  P.clearDraft('d1');
  P.flushNow();
  await sleep(AFTER_COMMIT);
  const draftsAfter = await P.idbGetAll(['drafts'], 'drafts');
  ok('TOMBSTONE: clearDraft() actually REMOVES the row from IndexedDB (not merely stops writing it)', !draftsAfter.some((d) => d.id === 'd1'), JSON.stringify(draftsAfter));
  void pid;

  // --- 4. the race guard: a STALE completion must not touch a NEWER edit's own bookkeeping --------------------
  // The danger is not "which value ends up in IndexedDB" (two commits that both eventually land always leave the
  // LATER one, guard or no guard — puts are inherently last-write-wins). The real danger is a STALE completion
  // (commit A, for the OLD value) firing its cleanup UNCONDITIONALLY and erasing commit B's (the newer edit's) own
  // still-pending journal entry before B has had any chance to land — which would silently lose B forever if the
  // page then crashed before B's commit completed. So: release A alone, inspect what it did to B's bookkeeping,
  // THEN simulate a crash (a reboot that never lets B's own commit land) and check what survives.
  // NOTE — this is the LAST thing this block does: it loads a fresh module instance (`Preboot`) below, which
  // re-attaches ITS OWN seams onto the shared fake `window` — any `W.wrizoX` call after this point in this block
  // would silently hit Preboot's state, not P's, which is exactly why every test that needs P's own window seams
  // runs BEFORE this one.
  const journalRaceEntry = () => JSON.parse(globalThis.localStorage.getItem('writer-studio-waj-v1') || '{}').journalEntries?.race;
  pauseAllCommits(true);
  W.wrizoCreateJournalPage(PAGE('race', 'first version'));   // commit A: queued, paused, journal holds v1
  W.wrizoPatchEntry('race', { text: 'second version' });      // commit B: queued, paused, journal OVERWRITTEN with v2
  ok('RACE SETUP: the journal holds the NEWER value before either commit has settled', journalRaceEntry()?.record?.text === 'second version', JSON.stringify(journalRaceEntry()));
  await drainMicrotasks(); // let BOTH idbCommit calls actually reach "queued, paused" before releasing either
  releaseNext(); // settle ONLY commit A (the stale one) — B stays paused, exactly as "A completes first" looks
  await sleep(AFTER_COMMIT);
  ok('RACE GUARD: commit A\'s OWN (stale) completion does NOT erase commit B\'s still-pending journal entry', journalRaceEntry()?.record?.text === 'second version', JSON.stringify(journalRaceEntry()));
  // The "crash": B's commit never lands (never released) — a fresh module instance's own read must recover v2
  // from the journal, not regress to v1 (which DID commit, via A) or lose the edit outright.
  const Preboot = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser']);
  await Preboot.storageReady;
  ok('RACE GUARD, CRASH BEFORE B LANDS: a reboot recovers the NEWER value from the journal, never the stale committed one', Preboot.getJournalEntry('race')?.text === 'second version', JSON.stringify(Preboot.getJournalEntry('race')));
  pauseAllCommits(false);
  await sleep(AFTER_COMMIT);
}

// ===========================================================================================================
// 5 · BOOT REPLAY — a transaction that never committed (the crash this whole design exists for) is recovered
// ===========================================================================================================
{
  resetFakeIndexedDB();
  installFakeEnv();
  const P1 = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser']);
  await P1.storageReady;
  pauseAllCommits(true); // every commit from here on queues and never fires until released — simulating a crash
  P1.saveDraft('lost', 'never committed to IndexedDB before the crash');
  globalThis.window.wrizoFlushNow(); // saveDraft() alone is debounced (300ms); force it NOW, the same way every real `visibilitychange: hidden` handler does
  const journalHasIt = JSON.parse(globalThis.localStorage.getItem('writer-studio-waj-v1') || '{}').drafts?.lost;
  ok('BEFORE THE "CRASH": the journal already holds the record — this is the one thing that makes recovery possible', journalHasIt?.record?.text === 'never committed to IndexedDB before the crash', JSON.stringify(journalHasIt));
  // The "crash": a FRESH module instance (a reboot) — never released the paused commit, so IndexedDB's own backing
  // store genuinely never received the row (fakeIndexedDB.mjs's own atomicity — see its header).
  const P2 = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser']);
  await P2.storageReady;
  ok('AFTER REBOOT, REPLAYED: the record is back in the live cache, read the normal synchronous way', P2.getDraft('lost')?.text === 'never committed to IndexedDB before the crash', JSON.stringify(P2.getDraft('lost')));
  ok('AFTER REBOOT: the OLD journal was cleared once replayed (it does not grow forever across reboots)', Object.keys(JSON.parse(globalThis.localStorage.getItem('writer-studio-waj-v1') || '{}')).length === 0 || !JSON.parse(globalThis.localStorage.getItem('writer-studio-waj-v1') || '{}').drafts?.lost, globalThis.localStorage.getItem('writer-studio-waj-v1'));
  pauseAllCommits(false);
  await sleep(AFTER_COMMIT);
  const landedNow = await P2.idbGetAll(['drafts'], 'drafts');
  ok('AND THE REPLAYED RECORD RE-QUEUED ITSELF FOR A FRESH COMMIT (the normal flush cycle, not a special replay-only write path)', landedNow.some((d) => d.id === 'lost'), JSON.stringify(landedNow));
}

// ===========================================================================================================
// 6 · THE LEGACY FALLBACK — a device with no IndexedDB at all is untouched by any of the above
// ===========================================================================================================
{
  resetFakeIndexedDB();
  installFakeEnv({ withIdb: false });
  const P = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser']);
  await P.storageReady;
  const W = globalThis.window;
  W.wrizoCreateJournalPage(PAGE('legacy1'));
  ok('LEGACY: a whole-collection blob lands in localStorage, synchronously, exactly as step 1 built it', (() => { const raw = globalThis.localStorage.getItem('writer-studio-journal-entries'); return !!raw && JSON.parse(raw).some((r) => r.id === 'legacy1'); })(), '');
  ok('LEGACY: the write-ahead journal is NEVER TOUCHED on this path (nothing to recover — the blob write is itself synchronous and complete)', globalThis.localStorage.getItem('writer-studio-waj-v1') === null, '');
}

// ===========================================================================================================
// 7 · FALSIFICATION
// ===========================================================================================================
{
  // M1 — the sequence-number race guard removed: a STALE completion would erase a NEWER edit's own journal entry
  // before that newer edit's commit has landed, invisible until the exact moment a crash follows it — precisely
  // the scenario section 4's own (unmutated) race-guard check is built to catch. This is also the mutation that
  // PROVED the guard needed to exist at all: an earlier version compared `updatedAt` timestamps instead of a
  // monotonic sequence, and two edits landing in the same millisecond (measured, not hypothesized — this harness's
  // own fuller run hit it) made that comparison a false match.
  await (async () => {
    const persSrc = src('store/persistence.ts');
    const anchor = "if (lastQueuedSeq[name].get(r.id) !== myPutSeq.get(r.id)) continue; // a newer edit already superseded this one";
    if (!persSrc.includes(anchor)) { ok('FALSIFICATION M1: the mutation LANDED', false, 'anchor text not found'); return; }
    const mutate = swap(anchor, '// race guard removed by the mutation');
    resetFakeIndexedDB(); installFakeEnv();
    const P = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser'], { 'store/persistence.ts': mutate });
    await P.storageReady;
    pauseAllCommits(true);
    globalThis.window.wrizoCreateJournalPage(PAGE('m1', 'v1'));
    globalThis.window.wrizoPatchEntry('m1', { text: 'v2' }); // commit B queued behind A; journal now holds v2
    await drainMicrotasks();
    releaseNext(); // settle ONLY the stale commit A
    await sleep(AFTER_COMMIT);
    const Preboot = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser'], { 'store/persistence.ts': mutate });
    await Preboot.storageReady; // B's commit was NEVER released — this is the crash
    ok('FALSIFICATION M1 the race guard removed — must go RED (a stale completion erases the newer edit\'s journal entry; a crash before B lands loses it for good)', Preboot.getJournalEntry('m1')?.text !== 'v2', JSON.stringify(Preboot.getJournalEntry('m1')));
    pauseAllCommits(false); releasePaused();
  })();

  // M2 — flush() stops writing the journal before the async commit: must go red (the sync contract breaks).
  await (async () => {
    const persSrc = src('store/persistence.ts');
    const anchor = 'for (const r of puts) journalPut(name, r);\n  for (const id of delIds) journalDelete(name, id);';
    if (!persSrc.includes(anchor)) { ok('FALSIFICATION M2: the mutation LANDED', false, 'anchor text not found'); return; }
    resetFakeIndexedDB(); installFakeEnv();
    const P = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser'], {
      'store/persistence.ts': swap(anchor, '// journal writes removed by the mutation'),
    });
    await P.storageReady;
    globalThis.window.wrizoCreateJournalPage(PAGE('m2'));
    const journalNow = globalThis.localStorage.getItem('writer-studio-waj-v1');
    ok('FALSIFICATION M2 the synchronous journal write removed from flush() — must go RED (flushNow() would no longer be durable before the real commit lands)', !journalNow || JSON.parse(journalNow).journalEntries?.m2 === undefined, journalNow);
  })();

  // M3 — the hard-delete tombstone path removed: clearDraft() would leave the row in IndexedDB.
  await (async () => {
    const persSrc = src('store/persistence.ts');
    const anchor = '  pendingLocal.drafts.delete(id);\n  pendingDeletes.drafts.add(id);';
    if (!persSrc.includes(anchor)) { ok('FALSIFICATION M3: the mutation LANDED', false, 'anchor text not found'); return; }
    resetFakeIndexedDB(); installFakeEnv();
    const P = await load(['persistence', 'idbStore', 'writeAheadJournal', 'storageHealth', 'storageMigration', 'currentUser'], {
      'store/persistence.ts': swap(anchor, '  // tombstone bookkeeping removed by the mutation'),
    });
    await P.storageReady;
    P.saveDraft('m3', 'x');
    globalThis.window.wrizoFlushNow();
    await sleep(AFTER_COMMIT);
    P.clearDraft('m3');
    globalThis.window.wrizoFlushNow();
    await sleep(AFTER_COMMIT);
    const row = (await P.idbGetAll(['drafts'], 'drafts')).find((d) => d.id === 'm3');
    ok('FALSIFICATION M3 the tombstone bookkeeping removed — must go RED (the deleted draft stays in IndexedDB forever)', !!row, JSON.stringify(row));
  })();

  // M4 — migration's signed-in/out asymmetry collapsed to always-clear-immediately.
  await (async () => {
    const migSrc = src('store/storageMigration.ts');
    const anchor = 'const clearedKeys = plan.signedIn ? clearLegacyKeys(Object.values(plan.legacyKeys)) : [];';
    if (!migSrc.includes(anchor)) { ok('FALSIFICATION M4: the mutation LANDED', false, 'anchor text not found'); return; }
    resetFakeIndexedDB(); installFakeEnv();
    const M = await load(['idbStore', 'storageMigration'], { 'store/storageMigration.ts': swap(anchor, 'const clearedKeys = clearLegacyKeys(Object.values(plan.legacyKeys));') });
    globalThis.localStorage.setItem('legacy-key', JSON.stringify([{ id: 'x', updatedAt: '1' }]));
    const r = await M.migrateLegacyStorageOnce({ storeNames: ['journalEntries'], legacyKeys: { journalEntries: 'legacy-key' }, signedIn: false });
    ok('FALSIFICATION M4 the signed-out asymmetry removed — must go RED (a signed-out writer\'s only other copy is cleared after ONE pass, with no server floor under it)', r.clearedKeys.includes('legacy-key'), JSON.stringify(r));
  })();

  // M5 — migration verification weakened to "did it throw" instead of counting ids back out.
  await (async () => {
    const migSrc = src('store/storageMigration.ts');
    const anchor = "if (!records.every((r) => landedIds.has(r.id))) {";
    if (!migSrc.includes(anchor)) { ok('FALSIFICATION M5: the mutation LANDED', false, 'anchor text not found'); return; }
    resetFakeIndexedDB(); installFakeEnv();
    const M = await load(['idbStore', 'storageMigration'], { 'store/storageMigration.ts': swap(anchor, 'if (false) {') });
    globalThis.localStorage.setItem('legacy-key', JSON.stringify([{ id: 'y', updatedAt: '1' }]));
    const brokenIdb = await load(['idbStore'], { 'store/idbStore.ts': swap('export async function idbCommit(\n  storeNames: readonly string[],\n  name: string,\n  puts: readonly { id: string }[],\n  deletes: readonly string[] = [],\n): Promise<void> {\n  if (puts.length === 0 && deletes.length === 0) return;', 'export async function idbCommit(\n  storeNames: readonly string[],\n  name: string,\n  puts: readonly { id: string }[],\n  deletes: readonly string[] = [],\n): Promise<void> {\n  return;') });
    void brokenIdb;
    // Reload storageMigration against the mutated verification AND a no-op idbCommit together.
    const M2 = await load(['idbStore', 'storageMigration'], {
      'store/storageMigration.ts': swap(anchor, 'if (false) {'),
      'store/idbStore.ts': swap('export async function idbCommit(\n  storeNames: readonly string[],\n  name: string,\n  puts: readonly { id: string }[],\n  deletes: readonly string[] = [],\n): Promise<void> {\n  if (puts.length === 0 && deletes.length === 0) return;', 'export async function idbCommit(\n  storeNames: readonly string[],\n  name: string,\n  puts: readonly { id: string }[],\n  deletes: readonly string[] = [],\n): Promise<void> {\n  return;'),
    });
    const r = await M2.migrateLegacyStorageOnce({ storeNames: ['journalEntries'], legacyKeys: { journalEntries: 'legacy-key' }, signedIn: true });
    ok('FALSIFICATION M5 verification weakened to "did it throw" — must go RED (a write that silently landed nowhere is declared migrated anyway)', r.state === 'done', JSON.stringify(r));
  })();
}

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Parks nothing: this file is new and falsifies no prior assertion (step 1's own suite is untouched by this ticket).
  console.log(parkedChecks.every((c) => c.pass)
    ? `\nITEM-STORAGE-S2 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; nothing parked`
    : `\nITEM-STORAGE-S2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
console.log(pass ? `\nITEM-STORAGE-S2 VERIFY: PASS (${all.length} checks)` : `\nITEM-STORAGE-S2 VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
