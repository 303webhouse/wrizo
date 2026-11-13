// #79 - THE SYNC BASE. Two devices, one page, both edited since they last synced: neither saw the other's words, and a push replaced the server's whole text (last write wins), so one side's words vanished. To keep both, a pull merges
// THREE texts (store/textMerge.ts, the #76 whole-line merge), and a three-way merge needs the BASE: the page's text as of this device's last sync. The client kept no such copy, so this is it.
//   - written when a page FIRST goes dirty (the text it had before the edit: the clean cache is the server's state as this device last saw it)
//   - after a push that landed while the writer typed on, it is the text that was pushed (the server now holds that)
//   - dropped when the page is clean and synced; cleared at sign-out with every other local copy
//   - bounded: at most MAX_ENTRIES pages and MAX_CHARS characters; the oldest go first (a page without a base is merged the old way: this device's text wins)
// Device-local, in this browser's storage only: never sent to the server, never part of a record, never synced. A storage failure is never an error into a write: the merge then has no base for that page and the old rule applies.
const KEY = 'wrizo-sync-bases-v1';
const MAX_ENTRIES = 100;
const MAX_CHARS = 1_500_000;

let bases: Record<string, string> = load();

function load(): Record<string, string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    const out: Record<string, string> = {};
    if (parsed && typeof parsed === 'object') for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) if (typeof v === 'string') out[k] = v;
    return out;
  } catch { return {}; }
}

function save(): void {
  try {
    // bounded: the oldest pages (insertion order) leave first
    const ids = Object.keys(bases);
    let chars = ids.reduce((n, id) => n + bases[id].length, 0);
    for (let i = 0; i < ids.length && (ids.length - i > MAX_ENTRIES || chars > MAX_CHARS); i += 1) { chars -= bases[ids[i]].length; delete bases[ids[i]]; }
    localStorage.setItem(KEY, JSON.stringify(bases));
  } catch { /* no base is kept: the old rule applies for that page */ }
}

/** The page just went dirty: keep the text it had before this edit, unless a base is already kept (the older one is the one that matters). */
export function noteSyncBase(id: string, text: unknown): void {
  if (typeof text !== 'string' || id in bases) return;
  bases[id] = text;
  save();
}

/** Replace the base (after a merge or a push that landed while the writer typed on). */
export function setSyncBase(id: string, text: string): void {
  delete bases[id];   // re-insert at the end: it is the newest now
  bases[id] = text;
  save();
}

export function getSyncBase(id: string): string | null {
  return Object.prototype.hasOwnProperty.call(bases, id) ? bases[id] : null;
}

export function dropSyncBase(id: string): void {
  if (!(id in bases)) return;
  delete bases[id];
  save();
}

/** Sign-out: nothing of the writer's stays on the device. */
export function clearSyncBases(): void {
  bases = {};
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Test/inspection seam. */
export function syncBaseIds(): string[] { return Object.keys(bases); }
