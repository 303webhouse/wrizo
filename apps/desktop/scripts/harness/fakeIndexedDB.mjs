// STORAGE-FULL STEP 2 — a MINIMAL fake IndexedDB for the browserless proof. Node has no native IndexedDB, and this
// ticket's own "no new deps unless the ticket needs them" rule argues against pulling in a polyfill package for a
// ~150-line surface this harness actually uses (open/transaction/objectStore/put/delete/getAll/clear). The backing
// data is a MODULE-LEVEL map keyed by database name, so it persists across repeated `indexedDB.open()` calls the
// same way a real browser's IndexedDB persists across page loads — exactly what the boot-replay and migration
// tests need ("close and reopen against the same database").
//
// REAL ATOMICITY, ON PURPOSE. Every `put`/`delete` is staged per-transaction and only applied to the shared backing
// map when the transaction actually COMMITS (`oncomplete`) — never at call time. This is what lets a test simulate
// a genuine crash: pause a transaction and never release it, and a FRESH module instance's own read (a new,
// independent transaction against the same backing map) correctly sees nothing from it, exactly as a real crash
// mid-write would leave IndexedDB. A failed transaction discards its staged writes entirely, matching the real
// rollback-on-abort behaviour this harness's race and failure tests both depend on.
//
// WHAT IT DOES NOT MODEL: lock contention between concurrent transactions on the same store (this harness never
// needs two transactions touching the same store at once) and real disk durability. Real disk durability — whether
// a committed transaction survives an actual browser close — is the CDP experiment in
// docs/menus/storage-full-step2-s0-indexeddb.md §3, and needs a real box turn; this file proves persistence.ts's
// OWN logic (the race guard, the journal handoff, the migration state machine), not that question.
const backing = new Map(); // dbName -> Map<storeName, Map<key, value>>

function dbData(name) {
  if (!backing.has(name)) backing.set(name, new Map());
  return backing.get(name);
}

export function resetFakeIndexedDB() { backing.clear(); }

// --- Fault injection, for the falsification/race tests below --------------------------------------------------
let failNextCommitFor = null; // a store name whose next transaction aborts instead of completing
let pauseCommits = false;     // when true, a transaction's settlement queues instead of firing after COMMIT_DELAY_MS
const paused = [];
export function failNextCommit(storeName) { failNextCommitFor = storeName; }
export function pauseAllCommits(on) { pauseCommits = on; if (!on) releasePaused(); }
export function releasePaused() { const q = paused.splice(0); q.forEach((fn) => fn()); }
/** Releases only the OLDEST still-paused transaction (FIFO) — lets a test settle one in-flight commit while a
 *  later one (queued behind it) stays frozen, which is the only way to observe a STALE completion's own effects
 *  before a newer commit has had any chance to land. */
export function releaseNext() { const fn = paused.shift(); if (fn) fn(); }
export const COMMIT_DELAY_MS = 5;

class FakeRequest {
  constructor() { this.onsuccess = null; this.onerror = null; this.result = undefined; this.error = null; }
  _succeed(result) { this.result = result; const fire = () => { if (this.onsuccess) this.onsuccess({ target: this }); }; queueMicrotask(fire); }
}

class FakeObjectStore {
  constructor(realMap, staging) { this.realMap = realMap; this.staging = staging; }
  put(value) { this.staging.set(value.id, { op: 'put', value }); const r = new FakeRequest(); r._succeed(value.id); return r; }
  delete(key) { this.staging.set(key, { op: 'delete' }); const r = new FakeRequest(); r._succeed(undefined); return r; }
  clear() { for (const k of this.realMap.keys()) this.staging.set(k, { op: 'delete' }); const r = new FakeRequest(); r._succeed(undefined); return r; }
  getAll() {
    // Reflects this transaction's OWN staged writes over the committed map (read-your-own-writes within a
    // transaction), matching real IndexedDB. Nothing here is visible to any OTHER transaction until commit.
    const merged = new Map(this.realMap);
    for (const [k, change] of this.staging) { if (change.op === 'delete') merged.delete(k); else merged.set(k, change.value); }
    const r = new FakeRequest(); r._succeed([...merged.values()]); return r;
  }
}

class FakeTransaction {
  constructor(storeMaps, storeNameForFault) {
    this.storeMaps = storeMaps;
    this.stagingByStore = new Map();
    this.oncomplete = null; this.onerror = null; this.onabort = null;
    this.error = null;
    this._shouldFail = failNextCommitFor !== null && failNextCommitFor === storeNameForFault;
    if (this._shouldFail) failNextCommitFor = null; // one-shot, like a real transient quota error
    const settle = () => {
      if (this._shouldFail) {
        this.error = new Error('fake quota exceeded');
        // Staged writes are DISCARDED — a failed/aborted transaction commits nothing, same as real IndexedDB.
        if (this.onerror) this.onerror({ target: this });
        return;
      }
      for (const [storeName, staged] of this.stagingByStore) {
        const real = this.storeMaps.get(storeName);
        for (const [k, change] of staged) { if (change.op === 'delete') real.delete(k); else real.set(k, change.value); }
      }
      if (this.oncomplete) this.oncomplete({ target: this });
    };
    if (pauseCommits) paused.push(settle); else setTimeout(settle, COMMIT_DELAY_MS);
  }
  objectStore(name) {
    if (!this.stagingByStore.has(name)) this.stagingByStore.set(name, new Map());
    return new FakeObjectStore(this.storeMaps.get(name), this.stagingByStore.get(name));
  }
}

class FakeDatabase {
  constructor(name, storeMaps) { this.name = name; this.storeMaps = storeMaps; this.objectStoreNames = { contains: (n) => storeMaps.has(n) }; }
  createObjectStore(name) { this.storeMaps.set(name, new Map()); return new FakeObjectStore(this.storeMaps.get(name), new Map()); }
  transaction(name) { return new FakeTransaction(this.storeMaps, name); }
}

export function installFakeIndexedDB(target) {
  target.indexedDB = {
    open(name, _version) {
      const req = new FakeRequest();
      const storeMaps = dbData(name);
      const db = new FakeDatabase(name, storeMaps);
      queueMicrotask(() => {
        req.result = db; // set BEFORE onupgradeneeded fires — a real IDBOpenDBRequest.result is readable inside it
        if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    },
  };
}
