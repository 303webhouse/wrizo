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
// Node 24 defines `globalThis.navigator` as a non-writable getter (a plain `=` assignment throws), so it must be
// FORCE-redefined rather than assigned — the same shape a real Electron-vs-browser test needs regardless of Node's
// own default.
function setFakeUserAgent(ua) {
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: ua }, configurable: true, writable: true });
}

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
  const windowListeners = new Map(); // event name -> Set(handler) — real enough for beforeUnloadGuard.ts's own addEventListener/removeEventListener
  const win = {
    addEventListener: (evt, fn) => { if (!windowListeners.has(evt)) windowListeners.set(evt, new Set()); windowListeners.get(evt).add(fn); },
    removeEventListener: (evt, fn) => { windowListeners.get(evt)?.delete(fn); },
  };
  globalThis.window = win;
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { if (throwFor.has(k)) { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e; } map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
  };
  setFakeUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36'); // plain Chromium — NOT Electron
  globalThis.__apiSyncCalls = 0; globalThis.__apiSyncPayloads = []; globalThis.__forceOffline = false;
  // Fires `evt`'s handlers with a fake event object that records whether preventDefault() was called and what
  // returnValue was set to — everything a beforeunload test needs, without a real DOM.
  const fireEvent = (evt) => {
    const e = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, returnValue: undefined };
    (windowListeners.get(evt) ?? new Set()).forEach((fn) => fn(e));
    return e;
  };
  return { map, throwFor, win, fireEvent };
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
  // signature: (status, tooLarge, storageFailed, storageNearFull, hasUnpushedDirty, signedIn, t)
  const t = (k) => ({
    syncTooLargeOne: '"{title}" is too large', syncTooLargeMany: '{n} items are too large',
    syncStorageFullPending: 'PENDING TEXT', syncStorageFullSynced: 'SYNCED TEXT', syncStorageFullAnon: 'ANON TEXT',
    syncStorageNearFull: 'NEAR FULL TEXT', syncStorageNearFullAnon: 'NEAR FULL ANON TEXT',
  }[k]);
  const notice = (status, tooLarge, failed, near, dirty, signedIn) => N.syncNoticeText(status, tooLarge, failed, near, dirty, signedIn, t);
  ok('WORDS (a): failed, signed in, changes NOT yet in the account — the pending text', notice('synced', [], true, false, true, true) === 'PENDING TEXT', notice('synced', [], true, false, true, true));
  ok('WORDS (a): the SAME text while offline (offline is one CAUSE of "not yet in the account", not a separate state)', notice('offline', [], true, false, true, true) === 'PENDING TEXT', '');
  ok('WORDS (b): failed, signed in, EVERYTHING already pushed — the synced text, not the pending one', notice('synced', [], true, false, false, true) === 'SYNCED TEXT', '');
  ok('WORDS (c): failed, SIGNED OUT — the anon text, regardless of dirty state (there is no account to be "pending" toward)', notice('synced', [], true, false, false, false) === 'ANON TEXT' && notice('synced', [], true, false, true, false) === 'ANON TEXT', '');
  ok('PRIORITY: storage FAILED (any of a/b/c) outranks offline', notice('offline', [], true, false, false, true) === 'SYNCED TEXT', '');
  ok('PRIORITY: storage FAILED outranks too-large', notice('synced', [{ id: '1', title: 'X', bytes: 9 }], true, false, true, true) === 'PENDING TEXT', '');
  ok('PRIORITY: offline outranks too-large (unchanged from item 203)', notice('offline', [{ id: '1', title: 'X', bytes: 9 }], false, false, false, true) === 'Offline — saved here', '');
  ok('PRIORITY: too-large outranks near-full', notice('synced', [{ id: '1', title: 'X', bytes: 9 }], false, true, false, true) === '"X" is too large', '');
  ok('PRIORITY: near-full shows only when nothing more urgent is true, SIGNED IN', notice('synced', [], false, true, false, true) === 'NEAR FULL TEXT', '');
  ok('WORDS (near-full, signed OUT): reads the same way as (c) — there is no account for "stay online" to help reach', notice('synced', [], false, true, false, false) === 'NEAR FULL ANON TEXT', '');
  ok('PRIORITY: nothing at all is null (no meter, no count, no notice)', notice('synced', [], false, false, false, true) === null, '');

  const src = deCRLF(readFileSync(join(SRC, 'store', 'syncNotice.ts'), 'utf8'));
  if (src.includes('if (storageFailed) {')) {
    installFakeEnv();
    const W = await load(['syncNotice'], { 'store/syncNotice.ts': swap('if (storageFailed) {\n    if (!signedIn) return t(\'syncStorageFullAnon\');            // (c) — nothing else could ever hold a copy\n    return hasUnpushedDirty ? t(\'syncStorageFullPending\')       // (a) — the account does not have this yet\n      : t(\'syncStorageFullSynced\');                             // (b) — the account already does\n  }', '') });
    ok('FALSIFICATION M3 storage-failed priority removed — must go RED (offline would win instead)', W.syncNoticeText('offline', [], true, false, true, true, t) !== 'PENDING TEXT', '');
  } else ok('FALSIFICATION M3: the mutation LANDED', false, 'anchor text not found');

  // M6 — the anon check must come BEFORE the dirty check, or a signed-out writer would see "safe in your account"
  // (SYNCED) instead of the anon text when they happen to have nothing dirty. Swapping the two branches must go red.
  if (src.includes('if (!signedIn) return')) {
    installFakeEnv();
    const W2 = await load(['syncNotice'], { 'store/syncNotice.ts': swap(
      "if (!signedIn) return t('syncStorageFullAnon');            // (c) — nothing else could ever hold a copy\n    return hasUnpushedDirty ? t('syncStorageFullPending')       // (a) — the account does not have this yet\n      : t('syncStorageFullSynced');                             // (b) — the account already does",
      "if (hasUnpushedDirty) return t('syncStorageFullPending');\n    if (!signedIn) return t('syncStorageFullAnon');\n    return t('syncStorageFullSynced');"
    ) });
    ok('FALSIFICATION M6 the anon check demoted below the dirty check — must go RED (a signed-out writer with nothing dirty would see "synced" instead of "anon")', W2.syncNoticeText('synced', [], true, false, false, false, t) !== 'SYNCED TEXT', '');
  } else ok('FALSIFICATION M6: the mutation LANDED', false, 'anchor text not found');

  // M11 — Fable, 2026-09-30: near-full must read the anon text for a signed-out writer. Removing the split must go red.
  if (src.includes("if (storageNearFull) return signedIn ? t('syncStorageNearFull') : t('syncStorageNearFullAnon');")) {
    installFakeEnv();
    const W3 = await load(['syncNotice'], { 'store/syncNotice.ts': swap(
      "if (storageNearFull) return signedIn ? t('syncStorageNearFull') : t('syncStorageNearFullAnon');",
      "if (storageNearFull) return t('syncStorageNearFull');"
    ) });
    ok('FALSIFICATION M11 the near-full anon split removed — must go RED (a signed-out writer would be told to "stay online" for an account that does not exist)', W3.syncNoticeText('synced', [], false, true, false, false, t) !== 'NEAR FULL ANON TEXT', '');
  } else ok('FALSIFICATION M11: the mutation LANDED', false, 'anchor text not found');
}

// ===========================================================================================================
// 3 · persistence.ts + storageHealth.ts TOGETHER — the real flush() catching a real throw, per collection
// ===========================================================================================================
{
  const persSrc = deCRLF(readFileSync(join(SRC, 'store', 'persistence.ts'), 'utf8'));
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

  // Fable's byte review, item 1 — persistDirty()'s OWN write can fail even while the collection's own write
  // succeeds (a real, separately-throwing key), and must report under its own name, not a collection's.
  throwFor.add('writer-studio-dirty-v1');
  W.wrizoPatchEntry('a', { text: 'edited while the dirty journal alone cannot be written' });
  ok('DIRTY JOURNAL FAILURE: reported under its OWN name — a collection write succeeding does not hide the journal failing beside it', JSON.stringify(P.getStorageFailedCollections().sort()) === '["dirtyJournal"]', JSON.stringify(P.getStorageFailedCollections()));
  ok('hasDirtyRecords(): true once a real edit is pending (through the same real seam)', P.hasDirtyRecords() === true, '');
  throwFor.delete('writer-studio-dirty-v1');
  W.wrizoPatchEntry('a', { text: 'space freed for the journal too' });
  ok('DIRTY JOURNAL RECOVERY: clears the same way any collection does', P.getStorageFailedCollections().length === 0, JSON.stringify(P.getStorageFailedCollections()));

  // Fable's byte review, item 1 (continued) — markClean() must itself notify() now (it did not before), or a
  // reactive reader (the sync notice) never learns a push emptied the dirty set.
  {
    installFakeEnv();
    const P3 = await load(['persistence', 'storageHealth']);
    const w3 = globalThis.window;
    w3.wrizoCreateJournalPage({ id: 'mc', text: 'x', createdAt: new Date().toISOString(), origin: null });
    ok('markClean(): a fresh page is dirty', P3.hasDirtyRecords() === true, '');
    const notes = []; const unsub = P3.subscribe(() => notes.push(P3.hasDirtyRecords()));
    P3.markClean(['mc']);
    unsub();
    ok('markClean(): notify() fires (a subscriber sees the dirty set empty) and hasDirtyRecords() reflects it', notes.length >= 1 && notes[notes.length - 1] === false && P3.hasDirtyRecords() === false, JSON.stringify(notes));
  }

  const dirtyFailMut = async (name, from, to, probe) => {
    if (!persSrc.includes(from)) { ok(`FALSIFICATION ${name}: the mutation LANDED`, false, 'anchor text not found'); return; }
    const { throwFor: tf } = installFakeEnv();
    const M = await load(['persistence', 'storageHealth'], { 'store/persistence.ts': swap(from, to) });
    tf.add('writer-studio-dirty-v1');
    globalThis.window.wrizoCreateJournalPage({ id: 'zz', text: 'y', createdAt: new Date().toISOString(), origin: null });
    ok(`FALSIFICATION ${name} — must go RED`, await probe(M), '');
  };
  // The anchor starts right AFTER the setItem line on purpose (never spelling out "localStorage.setItem(DIRTY_KEY"
  // in this file): seed-guard.mjs's 85-B scan reads any file for that literal shape as a raw collection write, with
  // no way to tell a mutation-test STRING from real executable code doing one — a real false positive, not a raw
  // write to exempt. The mutation itself only needs the two report-call lines it is actually removing.
  await dirtyFailMut('M7 persistDirty() no longer reports its own failure (item 89\'s journal would go silent again)',
    '\n    reportFlushOk(DIRTY_JOURNAL_REPORT_NAME);\n  } catch {\n    // Storage full/unavailable — never throw into a write path.\n    reportFlushFailed(DIRTY_JOURNAL_REPORT_NAME);\n  }',
    '\n  } catch {\n    // Storage full/unavailable — never throw into a write path.\n  }',
    (M) => M.getStorageFailedCollections().length === 0);
  await dirtyFailMut('M8 markClean() no longer calls notify() (a reactive reader never learns a push emptied the dirty set)',
    'persistDirty();\n  // STORAGE-FULL STEP 1 — a successful push',
    'persistDirty(); return;\n  // STORAGE-FULL STEP 1 — a successful push',
    (M) => { const w = globalThis.window; w.wrizoCreateJournalPage({ id: 'ntf', text: 'x', createdAt: new Date().toISOString(), origin: null });
      const seen = []; const unsub = M.subscribe(() => seen.push(1)); M.markClean(['ntf']); unsub(); return seen.length === 0; });

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

// ===========================================================================================================
// 5 · beforeUnloadGuard.ts — Fable's byte review, item 3: the web build asks first; Electron never does
// ===========================================================================================================
{
  const guardSrc = deCRLF(readFileSync(join(SRC, 'store', 'beforeUnloadGuard.ts'), 'utf8'));

  // (a) failed + dirty, signed in — risky
  {
    const { throwFor, fireEvent } = installFakeEnv();
    const G = await load(['persistence', 'storageHealth', 'currentUser', 'beforeUnloadGuard']);
    G.installBeforeUnloadGuard();
    globalThis.window.wrizoCreateJournalPage({ id: 'g1', text: 'x', createdAt: new Date().toISOString(), origin: null });
    ok('BASELINE: nothing failed yet — leaving is not risky, and beforeunload does nothing', fireEvent('beforeunload').defaultPrevented === false, '');
    throwFor.add('writer-studio-journal-entries');
    G.setCurrentUser({ id: 'u1', email: 'w@example.com' });
    globalThis.window.wrizoPatchEntry('g1', { text: 'y' }); // fails to save, and stays dirty (never pushed in this fake env)
    const ev = fireEvent('beforeunload');
    ok('STATE (a): failed + signed in + dirty — beforeunload IS prevented (a real prompt would show)', ev.defaultPrevented === true && ev.returnValue === '', JSON.stringify(ev));
  }
  // (b) failed, everything already pushed (no dirty records), signed in — not risky
  {
    const { throwFor, fireEvent } = installFakeEnv();
    const G = await load(['persistence', 'storageHealth', 'currentUser', 'beforeUnloadGuard']);
    G.installBeforeUnloadGuard();
    G.setCurrentUser({ id: 'u1', email: 'w@example.com' });
    globalThis.window.wrizoCreateJournalPage({ id: 'g2', text: 'x', createdAt: new Date().toISOString(), origin: null });
    G.markClean(['g2']); // simulates "the account already has it" — nothing dirty from here on
    throwFor.add('writer-studio-journal-entries');
    // `wrizoFlushNow()` re-serializes every collection unconditionally, WITHOUT touching any collection's dirty
    // state (unlike a create/patch seam, which would dirty a new record and undermine exactly what this state means)
    // — the honest shape of state (b): a routine re-write of already-synced data fails on a device that is simply full.
    globalThis.window.wrizoFlushNow();
    ok('STATE (b): failed but NOTHING dirty, signed in — beforeunload does nothing (nothing left to lose)', fireEvent('beforeunload').defaultPrevented === false && G.hasDirtyRecords() === false, JSON.stringify({ failed: G.getStorageFailedCollections(), dirty: G.hasDirtyRecords() }));
  }
  // (c) failed, signed OUT — risky regardless of dirty state
  {
    const { throwFor, fireEvent } = installFakeEnv();
    const G = await load(['persistence', 'storageHealth', 'currentUser', 'beforeUnloadGuard']);
    G.installBeforeUnloadGuard();
    throwFor.add('writer-studio-journal-entries');
    globalThis.window.wrizoCreateJournalPage({ id: 'g3', text: 'x', createdAt: new Date().toISOString(), origin: null }); // never signed in
    ok('STATE (c): failed + signed OUT — beforeunload IS prevented (no account could ever hold a copy)', fireEvent('beforeunload').defaultPrevented === true, '');
  }
  // Electron — never asks, even in state (a)
  {
    const { throwFor, fireEvent } = installFakeEnv();
    setFakeUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) wrizo/1.0 Chrome/128.0.0.0 Electron/31.0.0 Safari/537.36');
    const G = await load(['persistence', 'storageHealth', 'currentUser', 'beforeUnloadGuard']);
    ok('ELECTRON DETECTED: isElectronRenderer() reads true from Electron\'s own default user-agent token', G.isElectronRenderer() === true, '');
    G.installBeforeUnloadGuard();
    throwFor.add('writer-studio-journal-entries');
    G.setCurrentUser({ id: 'u1', email: 'w@example.com' });
    globalThis.window.wrizoCreateJournalPage({ id: 'g4', text: 'x', createdAt: new Date().toISOString(), origin: null });
    ok('ELECTRON: no listener was ever installed — even in the riskiest state, beforeunload does nothing (a cancelled unload there traps the window silently)', fireEvent('beforeunload').defaultPrevented === false, '');
  }

  const guardMutant = async (name, from, to, probe) => {
    if (!guardSrc.includes(from)) { ok(`FALSIFICATION ${name}: the mutation LANDED`, false, 'anchor text not found'); return; }
    const { throwFor, fireEvent } = installFakeEnv();
    const G = await load(['persistence', 'storageHealth', 'currentUser', 'beforeUnloadGuard'], { 'store/beforeUnloadGuard.ts': swap(from, to) });
    G.installBeforeUnloadGuard();
    throwFor.add('writer-studio-journal-entries');
    G.setCurrentUser({ id: 'u1', email: 'w@example.com' });
    globalThis.window.wrizoCreateJournalPage({ id: 'gm', text: 'x', createdAt: new Date().toISOString(), origin: null });
    ok(`FALSIFICATION ${name} — must go RED`, await probe(fireEvent('beforeunload')), '');
  };
  await guardMutant('M9 the risk check inverted (state (a) would stop being flagged as risky)',
    'if (getCurrentUser() === null) return true;\n  return hasDirtyRecords();',
    'if (getCurrentUser() === null) return true;\n  return !hasDirtyRecords();',
    (ev) => ev.defaultPrevented !== true);
  // M10 — the Electron exclusion removed: must go RED specifically under Electron's own UA (a non-Electron UA is
  // not the point; the guard exists precisely for the Electron case).
  if (guardSrc.includes('if (isElectronRenderer()) return () => {};')) {
    const { throwFor, fireEvent } = installFakeEnv();
    setFakeUserAgent('Mozilla/5.0 wrizo Electron/31.0.0 Safari/537.36');
    const G = await load(['persistence', 'storageHealth', 'currentUser', 'beforeUnloadGuard'], { 'store/beforeUnloadGuard.ts': swap('if (isElectronRenderer()) return () => {};\n  if (cleanup) return cleanup;', 'if (cleanup) return cleanup;') });
    G.installBeforeUnloadGuard();
    throwFor.add('writer-studio-journal-entries');
    G.setCurrentUser({ id: 'u1', email: 'w@example.com' });
    globalThis.window.wrizoCreateJournalPage({ id: 'gm2', text: 'x', createdAt: new Date().toISOString(), origin: null });
    ok('FALSIFICATION M10 the Electron exclusion removed — must go RED under Electron\'s own UA (a cancelled unload there would now silently trap the window)', fireEvent('beforeunload').defaultPrevented === true, '');
  } else ok('FALSIFICATION M10: the mutation LANDED', false, 'anchor text not found');
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
