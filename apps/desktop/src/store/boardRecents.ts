// ITEM 144 — "RECENTLY OPENED", kept PER DEVICE (docs/menus/b144-plus-menu-and-
// unnest-amendment.md §9.4). `updatedAt` is not "opened" — it moves when a board
// is edited, and the merged brief already refused it as an order (T2) — and no
// `lastOpened` exists on any record. So: a bounded most-recent-first list of board
// ids in localStorage, the `wrizo-board-mode` recipe (read/write in try/catch),
// written when a board MOUNTS. NO COLUMN.
//
// NAMED LIMITS, so nobody discovers them: it does not sync; a new device starts
// with the fallback order; a cleared cache resets it.
const KEY = 'wrizo-board-recents';
const CAP = 100;

function read(): string[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Move `id` to the front. Called when a board mounts. */
export function noteBoardOpened(id: string): void {
  try {
    const next = [id, ...read().filter(x => x !== id)].slice(0, CAP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage unavailable — recents simply do not persist */ }
}

/**
 * Most-recently-opened first; boards this device has never opened follow,
 * newest-TOUCHED first (`updatedAt` descending) — a stated FALLBACK, not a claim
 * about opening (his "to oldest" then holds: the tail is the least-recently touched).
 * Ids in the stored list that are not in `boards` (deleted, condition) are pruned
 * by construction — only the given boards are returned.
 */
export function orderByRecents<T extends { id: string; updatedAt: string }>(boards: T[]): T[] {
  const byId = new Map(boards.map(b => [b.id, b] as const));
  const opened: T[] = [];
  for (const id of read()) {
    const b = byId.get(id);
    if (b) { opened.push(b); byId.delete(id); }
  }
  const rest = [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  return [...opened, ...rest];
}
