// STORAGE-FULL STEP 2 — a thin IndexedDB adapter, ONE ROW PER RECORD (Fable's ruling, item 3: "so a write costs what
// changed," not a whole-collection blob rewrite every time). One database, one object store per collection, each
// row keyed by the record's own `id` — `getAll()` on a store is the bulk read persistence.ts's hydrate needs; `put`
// and `delete` are the per-record writes flush() needs. Nothing here knows what a "collection" means in product
// terms; it takes store names as plain strings, so persistence.ts stays the only module that knows CollectionName.
//
// FEATURE-DETECTED, NEVER ASSUMED. A device with no IndexedDB (very old browsers; some locked-down/private
// contexts) gets `indexedDbAvailable() === false` and persistence.ts falls all the way back to the pre-step-2
// whole-blob localStorage path — this module is never touched in that case.
const DB_NAME = 'wrizo-store-v1';
const DB_VERSION = 1;

export function indexedDbAvailable(): boolean {
  try { return typeof indexedDB !== 'undefined' && indexedDB !== null; } catch { return false; }
}

let dbPromise: Promise<IDBDatabase> | null = null;

/** Opens (or returns the already-open) database, creating one object store per name on first open. Memoised per
 *  module instance — a fresh module (a fresh import, as every harness in this repo already relies on for isolation)
 *  gets a fresh promise, never a stale handle from a previous test. */
function openDb(storeNames: readonly string[]): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of storeNames) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB.open failed'));
    req.onblocked = () => reject(new Error('indexedDB.open blocked (another tab holds an older version open)'));
  });
  return dbPromise;
}

/** Empties one store entirely (logout: the next account must never inherit a prior one's rows). */
export async function idbClear(storeNames: readonly string[], name: string): Promise<void> {
  const db = await openDb(storeNames);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, 'readwrite');
    tx.objectStore(name).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('clear failed'));
  });
}

export async function idbGetAll<T>(storeNames: readonly string[], name: string): Promise<T[]> {
  const db = await openDb(storeNames);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, 'readonly');
    const req = tx.objectStore(name).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as T[]);
    req.onerror = () => reject(req.error ?? new Error('getAll failed'));
  });
}

/** Writes and deletes in ONE transaction (so a flush that both upserts some ids and removes others — a hard delete
 *  alongside an edit, same collection, same debounce tick — commits or fails together, never half-landed). */
export async function idbCommit(
  storeNames: readonly string[],
  name: string,
  puts: readonly { id: string }[],
  deletes: readonly string[] = [],
): Promise<void> {
  if (puts.length === 0 && deletes.length === 0) return;
  const db = await openDb(storeNames);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, 'readwrite');
    const store = tx.objectStore(name);
    for (const r of puts) store.put(r);
    for (const id of deletes) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));
  });
}
