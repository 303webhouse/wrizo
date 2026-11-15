// #79 - THE SYNC BASE. Two devices, one page, both edited since they last synced: neither saw the other's words, and a push replaced the server's whole text (last write wins), so one side's words vanished. To keep both, a pull merges
// THREE texts (store/textMerge.ts, the #76 whole-line merge), and a three-way merge needs the BASE: the page's text as of this device's last sync. The client kept no such copy, so this is it.
//   - written when a page FIRST goes dirty (the text it had before the edit: the clean copy is the server's state as this device last saw it)
//   - after a push that landed while the writer typed on, it is the text that was pushed (the server now holds that)
//   - dropped when the page is clean and synced; cleared at sign-out with every other local copy
//   - bounded: at most MAX_ENTRIES pages and MAX_CHARS characters; the oldest go first (a page without a base is merged the old way: this device's text wins)
// Device-local, in this browser's storage only: never sent to the server, never part of a record, never synced. A storage failure is never an error into a write: the merge then has no base for that page and the old rule applies.
//
// ONE KEY PER PAGE, and storage is the only copy (nothing is held in memory). Every window of the app on this computer shares one localStorage, and a map each window kept in memory and wrote WHOLE would overwrite what another window
// wrote, and could not drop a base another window had written (it did not know the page): a base left behind that no longer matched the last sync made the next merge show a false "both kept". So each page has its own key, each call reads and
// writes only that key, and the small index (page ids and their sizes, oldest first, for the bound) is read again before it is changed. A write is one page's text, never the whole store.
const PAGE = 'wrizo-sync-base:';
const INDEX = 'wrizo-sync-base-index-v1';
const MAX_ENTRIES = 100;
const MAX_CHARS = 1_500_000;

type Index = Array<[string, number]>;

function readIndex(): Index {
  try {
    const raw = localStorage.getItem(INDEX);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) return parsed.filter((e): e is [string, number] => Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'number');
  } catch { /* an unreadable index is an empty one: the pages' own keys are still read directly */ }
  return [];
}

function writeIndex(ix: Index): void {
  try { localStorage.setItem(INDEX, JSON.stringify(ix)); } catch { /* the bound is best effort */ }
}

function write(id: string, text: string): void {
  try {
    if (text.length > MAX_CHARS) { dropSyncBase(id); return; }   // one page past the whole bound keeps no base: the old rule
    localStorage.setItem(PAGE + id, text);
    const ix = readIndex().filter((e) => e[0] !== id);
    ix.push([id, text.length]);
    let chars = ix.reduce((n, e) => n + e[1], 0);
    while (ix.length > 1 && (ix.length > MAX_ENTRIES || chars > MAX_CHARS)) {   // the oldest leave first; the page just written stays (it is within the bound on its own)
      const [old, n] = ix.shift() as [string, number];
      chars -= n;
      localStorage.removeItem(PAGE + old);
    }
    writeIndex(ix);
  } catch { /* no base is kept: the old rule applies for that page */ }
}

/** The page just went dirty: keep the text it had before this edit, unless a base is already kept (the older one is the one that matters). */
export function noteSyncBase(id: string, text: unknown): void {
  if (typeof text !== 'string') return;
  try { if (localStorage.getItem(PAGE + id) !== null) return; } catch { return; }
  write(id, text);
}

/** Replace the base (after a merge or a push that landed while the writer typed on); it is the newest now. */
export function setSyncBase(id: string, text: string): void { write(id, text); }

export function getSyncBase(id: string): string | null {
  try { return localStorage.getItem(PAGE + id); } catch { return null; }
}

/** Dropped whoever wrote it: this window may never have seen the page's base (another window of the app wrote it), and it is still removed. */
export function dropSyncBase(id: string): void {
  try {
    localStorage.removeItem(PAGE + id);
    const ix = readIndex();
    if (ix.some((e) => e[0] === id)) writeIndex(ix.filter((e) => e[0] !== id));
  } catch { /* ignore */ }
}

/** Sign-out: nothing of the writer's stays on the device. Every base key goes, listed or not. */
export function clearSyncBases(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) { const k = localStorage.key(i); if (k && k.startsWith(PAGE)) keys.push(k); }
    for (const k of keys) localStorage.removeItem(k);
    localStorage.removeItem(INDEX);
  } catch { /* ignore */ }
}

/** Test/inspection seam. */
export function syncBaseIds(): string[] { return readIndex().map((e) => e[0]); }
