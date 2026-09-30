// STORAGE-FULL STEP 1 — "a failed save is never silent." Browserless: the whole engine (storageHealth.ts,
// persistence.ts's flush(), sync.ts's push-at-once bridge, syncNotice.ts's priority text) runs bundled in Node
// against a FAKE localStorage/window, so this proves the real wiring, not a description of it.
//   Run: node apps/desktop/scripts/harness/item-storage-full.mjs
//
// FOUR THINGS, IN THE ORDER THE PRODUCT MAKES THEM TRUE:
//   1. storageHealth.ts's own state machine (per-collection failed set, the once-per-transition edge event, the
//      near-full warning with its hysteresis and its "shown once ever" persistence) — pure, no DOM needed.
//   2. persistence.ts's flush() actually calls into it on a REAL thrown localStorage.setItem (a fake that throws for
//      one key only, so every other collection's write is unaffected — "catch it per collection").
//   3. sync.ts pushes at once on the edge into failure — a real apiSync call count, not an assumption about wiring.
//   4. syncNoticeText's priority (storage failure outranks offline, which outranks too-large, which outranks
//      near-full) and the lexicon words it reads.
// Every mutation is applied to the SOURCE TEXT before bundling and asserted to have landed before its check is
// trusted (mutation-test only committed work's sibling rule: assert the cut landed).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..', '..');
const SRC = join(desktop, 'src');
const { build } = createRequire(createRequire(join(desktop, 'package.json')).resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 280)}]` : ''}`); };
// Harness files (this one included) are CRLF; every mutation anchor below is written against LF. Built from
// character codes, not an escape sequence, so no shell/heredoc layer this file's edit history passed through can
// collapse it — see the standing rule this project keeps about exactly that failure mode.
const LF = String.fromCharCode(10);
const CRLF = String.fromCharCode(13) + LF;
const deCRLF = (t) => t.split(CRLF).join(LF);

const FAKE_API = `
  export class SyncHttpError extends Error { constructor(status, message) { super(message || 'http'); this.status = status; } }
  export async function apiSync(payload) {
    globalThis.__apiSyncCalls = (globalThis.__apiSyncCalls || 0) + 1;
    globalThis.__apiSyncPayloads = globalThis.__apiSyncPayloads || [];
    globalThis.__apiSyncPayloads.push(payload);
    if (globalThis.__forceOffline) throw new Error('network down (forced by the harness)');
    return { serverTime: new Date().toISOString(), pull: {} };
  }
`;

// Bundle a re-export of the named modules, with per-file SOURCE TEXT overrides (mutation) and a fake './api'.
// Each call gets a fresh module instance (esbuild's stdin content differs by a nonce comment) so state never bleeds
// between an unmutated control and a mutant, or between two "sessions" in the same test.
let nonce = 0;
async function load(entries, overrides = {}) {
  nonce += 1;
  const res = await build({
    // `export const __harnessNonce` (real CODE, not a comment) forces a byte-distinct bundle per call: esbuild
    // strips plain `//` comments from its output (they are not "legal comments"), so a comment-only nonce collapses
    // to the SAME bundle text for every call — the same `data:` URL, which Node's module cache then silently
    // reuses instead of re-running the module's side effects against a FRESH fake window/localStorage. Measured:
    // two builds differing only by a leading `// nonce N` comment produced byte-IDENTICAL output text.
    stdin: { contents: `export const __harnessNonce = ${nonce};\n${entries.map((e) => `export * from './store/${e}';`).join('\n')}`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    plugins: [{ name: 'ov', setup(b) {
      b.onResolve({ filter: /^\.\/api$/ }, () => ({ path: `fake-api-${nonce}`, namespace: 'fake-api' }));
      b.onLoad({ filter: /.*/, namespace: 'fake-api' }, () => ({ contents: FAKE_API, loader: 'js' }));
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = relative(SRC, args.path).split('\\').join('/');
        const text = deCRLF(readFileSync(args.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor missing: ${JSON.stringify(from.slice(0, 80))}`); return t.replace(from, to); };

// A fresh fake localStorage + window, installed as the globals BEFORE a module is imported (persistence.ts hydrates
// its cache at module-load time). `throwFor` names keys whose setItem call throws — a real QuotaExceededError shape.
function installFakeEnv() {
  const map = new Map();
  const throwFor = new Set();
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { if (throwFor.has(k)) { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e; } map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
  };
  globalThis.__apiSyncCalls = 0; globalThis.__apiSyncPayloads = []; globalThis.__forceOffline = false;
  return { map, throwFor };
}

// ===========================================================================================================
// 1 · storageHealth.ts ALONE — the state machine
// ===========================================================================================================
{
  installFakeEnv();
  const H = await load(['storageHealth']);
  const events = []; H.subscribeStorageFailureEvent(() => events.push('edge'));
  const failedLog = []; H.subscribeStorageFailed((names) => failedLog.push([...names]));

  H.reportFlushFailed('journalEntries');
  ok('FAILED SET: a first failure is recorded and notified', JSON.stringify(H.getStorageFailedCollections()) === '["journalEntries"]' && failedLog.length >= 1, JSON.stringify(H.getStorageFailedCollections()));
  ok('EDGE EVENT: fires ONCE on the empty -> non-empty transition', events.length === 1, JSON.stringify(events));
  const notificationsSoFar = failedLog.length; // includes subscribeStorageFailed's own immediate call-on-subscribe, plus the first failure above
  H.reportFlushFailed('journalEntries');
  ok('IDEMPOTENT: repeating the SAME collection\'s failure does not re-notify or re-fire the edge (typing into a full device does not flood)', events.length === 1 && failedLog.length === notificationsSoFar, JSON.stringify({ events: events.length, notifications: failedLog.length, before: notificationsSoFar }));
  H.reportFlushFailed('projects');
  ok('A SECOND collection failing is added to the set but does NOT re-fire the edge (already non-empty)', JSON.stringify([...H.getStorageFailedCollections()].sort()) === '["journalEntries","projects"]' && events.length === 1, JSON.stringify(H.getStorageFailedCollections()));
  H.reportFlushOk('journalEntries');
  ok('RECOVERY: a later successful flush of a failed collection clears JUST that one', JSON.stringify(H.getStorageFailedCollections()) === '["projects"]', JSON.stringify(H.getStorageFailedCollections()));
  H.reportFlushOk('projects');
  ok('RECOVERY: clearing the last failed collection empties the set', H.getStorageFailedCollections().length === 0, JSON.stringify(H.getStorageFailedCollections()));
  H.reportFlushFailed('drafts');
  ok('RE-ARM: a full recovery lets a LATER failure fire the edge again', events.length === 2, JSON.stringify(events));

  // Near-full: below REARM is quiet; WARN_FRACTION (0.8) fires once; a second crossing without dropping below REARM stays quiet.
  H.reportStorageUsage(1000);
  ok('NEAR-FULL: far below the floor is quiet', H.getStorageNearFull() === false, '');
  const nearLog = []; H.subscribeStorageNearFull((n) => nearLog.push(n));
  H.reportStorageUsage(Math.floor(H.STORAGE_ASSUMED_QUOTA_BYTES * 0.85));
  ok('NEAR-FULL: crossing 80% for the first time sets it', H.getStorageNearFull() === true, '');
  const risesAfterFirst = nearLog.length;
  H.reportStorageUsage(Math.floor(H.STORAGE_ASSUMED_QUOTA_BYTES * 0.95));
  ok('NEAR-FULL: climbing further while already shown does not re-notify (no nagging)', nearLog.length === risesAfterFirst, JSON.stringify(nearLog));
  H.reportStorageUsage(Math.floor(H.STORAGE_ASSUMED_QUOTA_BYTES * 0.5));
  ok('NEAR-FULL: dropping below the hysteresis floor (70%) clears it', H.getStorageNearFull() === false, '');

  // "Once EVER" — a fresh module instance sharing the same on-disk (fake) store must NOT re-warn if the crossing
  // already happened and usage never dropped back below the re-arm line. This is the actual reload case.
  installFakeEnv(); // resets the map fresh — simulate "once ever" from a clean slate instead, in two parts:
  const store = new Map();
  globalThis.window = {};
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
  const H1 = await load(['storageHealth']);
  H1.reportStorageUsage(Math.floor(H1.STORAGE_ASSUMED_QUOTA_BYTES * 0.85)); // first "session": crosses 80%, warns, persists the flag
  const shownFirstSession = H1.getStorageNearFull();
  const H2 = await load(['storageHealth']); // a FRESH module instance, same backing store — a reload
  H2.reportStorageUsage(Math.floor(H2.STORAGE_ASSUMED_QUOTA_BYTES * 0.9)); // still near-full, never dropped below 70% in between
  ok('ONCE EVER: a reload that is STILL near-full, and was already warned, stays quiet the second time', shownFirstSession === true && H2.getStorageNearFull() === false, JSON.stringify({ firstSession: shownFirstSession, secondSession: H2.getStorageNearFull() }));
  const H3 = await load(['storageHealth']);
  H3.reportStorageUsage(Math.floor(H3.STORAGE_ASSUMED_QUOTA_BYTES * 0.5)); // a third "session" that dropped below the re-arm line
  const H4 = await load(['storageHealth']);
  H4.reportStorageUsage(Math.floor(H4.STORAGE_ASSUMED_QUOTA_BYTES * 0.85)); // and climbs back up
  ok('RE-ARM ACROSS SESSIONS: once it genuinely drops (a later session freeing space) a later climb warns again', H4.getStorageNearFull() === true, String(H4.getStorageNearFull()));

  // Falsification, on the pure module alone.
  const src = deCRLF(readFileSync(join(SRC, 'store', 'storageHealth.ts'), 'utf8'));
  const mutant = async (name, from, to, probe) => {
    if (!src.includes(from)) { ok(`FALSIFICATION ${name}: the mutation LANDED`, false, 'anchor text not found'); return; }
    installFakeEnv();
    const W = await load(['storageHealth'], { 'store/storageHealth.ts': swap(from, to) });
    ok(`FALSIFICATION ${name} — must go RED`, await probe(W), '');
  };
  await mutant('M1 idempotency removed (a repeated failure of the SAME collection re-notifies every time, not just once)',
    'export function reportFlushFailed(name: string): void {\n  if (failed.has(name)) return;',
    'export function reportFlushFailed(name: string): void {',
    (W) => { const notes = []; W.subscribeStorageFailed((names) => notes.push([...names])); const before = notes.length; W.reportFlushFailed('x'); W.reportFlushFailed('x'); return notes.length - before !== 1; });
  await mutant('M2 hysteresis removed (dropping just below 80%, not all the way below the 70% re-arm floor, would clear the warning)',
    "if (fraction < REARM_FRACTION) {",
    "if (fraction < WARN_FRACTION) {",
    (W) => {
      W.reportStorageUsage(Math.floor(W.STORAGE_ASSUMED_QUOTA_BYTES * 0.85)); // cross 80%: warns, nearFull true
      W.reportStorageUsage(Math.floor(W.STORAGE_ASSUMED_QUOTA_BYTES * 0.75)); // the hysteresis band (70-80%): real code leaves it true
      return W.getStorageNearFull() !== true;
    });
}

// ===========================================================================================================
// 2 · syncNotice.ts ALONE — the priority and the words
// ===========================================================================================================
{
  installFakeEnv();
  const N = await load(['syncNotice']);
  const t = (k) => ({ syncTooLargeOne: '"{title}" is too large', syncTooLargeMany: '{n} items are too large', syncStorageFull: 'STORAGE FULL TEXT', syncStorageNearFull: 'NEAR FULL TEXT' }[k]);
  ok('PRIORITY: storage FAILED outranks offline', N.syncNoticeText('offline', [], true, false, t) === 'STORAGE FULL TEXT', N.syncNoticeText('offline', [], true, false, t));
  ok('PRIORITY: storage FAILED outranks too-large', N.syncNoticeText('synced', [{ id: '1', title: 'X', bytes: 9 }], true, false, t) === 'STORAGE FULL TEXT', '');
  ok('PRIORITY: offline outranks too-large (unchanged from item 203)', N.syncNoticeText('offline', [{ id: '1', title: 'X', bytes: 9 }], false, false, t) === 'Offline — saved here', '');
  ok('PRIORITY: too-large outranks near-full', N.syncNoticeText('synced', [{ id: '1', title: 'X', bytes: 9 }], false, true, t) === '"X" is too large', N.syncNoticeText('synced', [{ id: '1', title: 'X', bytes: 9 }], false, true, t));
  ok('PRIORITY: near-full shows only when nothing more urgent is true', N.syncNoticeText('synced', [], false, true, t) === 'NEAR FULL TEXT', '');
  ok('PRIORITY: nothing at all is null (no meter, no count, no notice)', N.syncNoticeText('synced', [], false, false, t) === null, '');

  const src = deCRLF(readFileSync(join(SRC, 'store', 'syncNotice.ts'), 'utf8'));
  if (src.includes('if (storageFailed) return')) {
    installFakeEnv();
    const W = await load(['syncNotice'], { 'store/syncNotice.ts': swap('if (storageFailed) return t(\'syncStorageFull\');\n  if (status === \'offline\')', 'if (status === \'offline\')') });
    ok('FALSIFICATION M3 storage-failed priority removed — must go RED (offline would win instead)', W.syncNoticeText('offline', [], true, false, t) !== 'STORAGE FULL TEXT', '');
  } else ok('FALSIFICATION M3: the mutation LANDED', false, 'anchor text not found');
}

// ===========================================================================================================
// 3 · persistence.ts + storageHealth.ts TOGETHER — the real flush() catching a real throw, per collection
// ===========================================================================================================
{
  const { throwFor } = installFakeEnv();
  const P = await load(['persistence', 'storageHealth']);
  const W = globalThis.window;
  W.wrizoCreateJournalPage({ id: 'a', text: 'hello', createdAt: new Date().toISOString(), origin: null });
  ok('BASELINE: an ordinary write succeeds and reports no failure', P.getStorageFailedCollections().length === 0, JSON.stringify(P.getStorageFailedCollections()));

  throwFor.add('writer-studio-journal-entries'); // per-collection: only THIS key throws
  W.wrizoPatchEntry('a', { text: 'a full disk' });
  ok('PER-COLLECTION FAILURE: a real thrown setItem for journalEntries is caught and reported (not silent past flush())', JSON.stringify(P.getStorageFailedCollections()) === '["journalEntries"]', JSON.stringify(P.getStorageFailedCollections()));
  W.wrizoCreateProject('Another project');
  ok('PER-COLLECTION FAILURE: a DIFFERENT collection (projects) keeps writing fine while journalEntries fails — the catch is per collection, not global', JSON.stringify(P.getStorageFailedCollections().sort()) === '["journalEntries"]', JSON.stringify(P.getStorageFailedCollections()));

  throwFor.delete('writer-studio-journal-entries');
  W.wrizoPatchEntry('a', { text: 'space freed' });
  ok('RECOVERY (through the real seam): the next successful write of the SAME collection clears it', P.getStorageFailedCollections().length === 0, JSON.stringify(P.getStorageFailedCollections()));

  // Near-full, driven by real data through the real seam (no quota exception needed — just size).
  installFakeEnv();
  const P2 = await load(['persistence', 'storageHealth']);
  // The boot-time unthrottled usage check (persistence.ts, module init) already consumed the throttle window a
  // moment ago; the real 4s minimum interval must actually be crossed for a SECOND check to run, so this waits for
  // it in real time rather than reaching past the throttle — the throttle itself is part of what is under test.
  await new Promise((r) => setTimeout(r, 4100));
  const bigText = 'x'.repeat(4_400_000); // ~4.4M chars * 2 bytes/char ~ 8.8MB > 80% of the 5MB assumed floor
  globalThis.window.wrizoCreateJournalPage({ id: 'big', text: bigText, createdAt: new Date().toISOString(), origin: null });
  // `wrizoCreateJournalPage`'s durable seam flushes EVERY collection in one synchronous burst (flushNow()), in
  // Object.keys(KEYS) order — journalEntries is not first, so the FIRST collection to flush in that burst can
  // consume the 4s throttle window with the OLD (small) total before journalEntries's own flush updates it a
  // moment later in the same burst. `lastFlushedChars` still accumulates correctly across the burst, though — a
  // second flush after the throttle window elapses sees the true total no matter which collection triggers it.
  await new Promise((r) => setTimeout(r, 4100));
  globalThis.window.wrizoPatchEntry('big', { text: bigText });
  ok('NEAR-FULL, THROUGH THE REAL PIPE: a large page pushes the app past 80% of the assumed floor and the flag is set', P2.getStorageNearFull() === true, '');

  const persSrc = deCRLF(readFileSync(join(SRC, 'store', 'persistence.ts'), 'utf8'));
  const failMut = async (name, from, to, probe) => {
    if (!persSrc.includes(from)) { ok(`FALSIFICATION ${name}: the mutation LANDED`, false, 'anchor text not found'); return; }
    const { throwFor: tf } = installFakeEnv();
    const M = await load(['persistence', 'storageHealth'], { 'store/persistence.ts': swap(from, to) });
    tf.add('writer-studio-journal-entries');
    globalThis.window.wrizoCreateJournalPage({ id: 'z', text: 'y', createdAt: new Date().toISOString(), origin: null });
    ok(`FALSIFICATION ${name} — must go RED`, await probe(M), '');
  };
  await failMut('M4 reportFlushFailed call removed from the catch branch (a real failure would go silent again)',
    "reportFlushFailed(name);\n  }",
    "}",
    (M) => M.getStorageFailedCollections().length === 0);
}

// ===========================================================================================================
// 4 · sync.ts BRIDGE — a storage failure pushes at once
// ===========================================================================================================
{
  const { throwFor } = installFakeEnv();
  const S = await load(['persistence', 'sync', 'storageHealth']);
  const beforeEdit = globalThis.__apiSyncCalls;
  ok('BASELINE: importing sync.ts alone calls apiSync zero times (no push happens merely from being loaded)', beforeEdit === 0, String(beforeEdit));
  throwFor.add('writer-studio-journal-entries');
  globalThis.window.wrizoCreateJournalPage({ id: 'p', text: 'push me', createdAt: new Date().toISOString(), origin: null });
  await new Promise((r) => setTimeout(r, 30)); // syncOnce() is async; let its microtasks/awaits settle
  ok('PUSH AT ONCE: a storage failure triggers a real apiSync call, with no explicit startSync()/syncOnce() from the harness', globalThis.__apiSyncCalls > beforeEdit, `before=${beforeEdit} after=${globalThis.__apiSyncCalls}`);
  const afterOneEdge = globalThis.__apiSyncCalls;
  globalThis.window.wrizoPatchEntry('p', { text: 'again' }); // still failing (throwFor untouched) - same collection, no NEW edge
  await new Promise((r) => setTimeout(r, 30));
  ok('EDGE-TRIGGERED: a second failing write to the SAME already-failed collection does not push again on its own (the edge already fired; the normal 20s/online-triggered cadence covers the rest)', globalThis.__apiSyncCalls === afterOneEdge, `after-edge=${afterOneEdge} after-second-write=${globalThis.__apiSyncCalls}`);

  const { throwFor: tf2 } = installFakeEnv();
  globalThis.__forceOffline = true;
  const S2 = await load(['persistence', 'sync', 'storageHealth']);
  const beforeOffline = globalThis.__apiSyncCalls;
  tf2.add('writer-studio-journal-entries');
  globalThis.window.wrizoCreateJournalPage({ id: 'q', text: 'push me too', createdAt: new Date().toISOString(), origin: null });
  await new Promise((r) => setTimeout(r, 30));
  ok('OFFLINE: the push is still ATTEMPTED (apiSync called) even when the network turns out to be down — it just fails the normal way afterward', globalThis.__apiSyncCalls > beforeOffline, `before=${beforeOffline} after=${globalThis.__apiSyncCalls}`);
  ok('OFFLINE: the attempt failing does not throw out of the write path — sync status reads offline, not a crash', S2.getSyncStatus() === 'offline', S2.getSyncStatus());

  const syncSrc = deCRLF(readFileSync(join(SRC, 'store', 'sync.ts'), 'utf8'));
  if (syncSrc.includes('subscribeStorageFailureEvent(() => { void syncOnce(); });')) {
    const { throwFor: tf3 } = installFakeEnv();
    await load(['persistence', 'sync', 'storageHealth'], { 'store/sync.ts': swap('subscribeStorageFailureEvent(() => { void syncOnce(); });', '') });
    const before2 = globalThis.__apiSyncCalls;
    tf3.add('writer-studio-journal-entries');
    globalThis.window.wrizoCreateJournalPage({ id: 'r', text: 'r', createdAt: new Date().toISOString(), origin: null });
    await new Promise((r) => setTimeout(r, 30));
    ok('FALSIFICATION M5 the bridge subscription removed from sync.ts — must go RED (a failure pushes nothing)', globalThis.__apiSyncCalls === before2, `before=${before2} after=${globalThis.__apiSyncCalls}`);
  } else ok('FALSIFICATION M5: the mutation LANDED', false, 'anchor text not found');
}

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Parks nothing: this file is new and falsifies no prior assertion.
  console.log(parkedChecks.every((c) => c.pass)
    ? `\nITEM-STORAGE-FULL PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; nothing parked`
    : `\nITEM-STORAGE-FULL PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
console.log(pass ? `\nITEM-STORAGE-FULL VERIFY: PASS (${all.length} checks)` : `\nITEM-STORAGE-FULL VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
