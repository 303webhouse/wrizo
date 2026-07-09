import type { JournalEntry } from '../types';

// J1 — the notebook order model (Fork 2). Pure utilities; the orchestration
// (create/insert/normalize + writes) lives in persistence. A loose Journal page's
// position is its explicit `orderIndex`, else its creation time — so untouched
// pages keep their chronological place forever, with no backfill.

const EPSILON = 1e-6; // a gap this small can't be split further → normalize
const STEP = 1;       // append/prepend nudge (doubles have ample precision)

// A page's notebook key: explicit order, else creation-time epoch (ms).
export function notebookKey(p: JournalEntry): number {
  return p.orderIndex ?? Date.parse(p.createdAt);
}

// Ascending = notebook order (oldest first, like a real notebook fills). Ties
// (shouldn't happen for distinct pages) break by createdAt then id, stably.
export function sortNotebook(pages: JournalEntry[]): JournalEntry[] {
  return [...pages].sort((a, b) =>
    notebookKey(a) - notebookKey(b) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

// An index strictly between prev and next (either may be undefined at the open
// ends): midpoint inside, a STEP nudge past an open end, 0 for an empty notebook.
export function midpoint(prev?: number, next?: number): number {
  if (prev != null && next != null) return prev + (next - prev) / 2;
  if (prev != null) return prev + STEP;  // append after the last page
  if (next != null) return next - STEP;  // before the first page
  return 0;                              // empty notebook
}

// True when two adjacent keys are too close to split — the insert path normalizes
// the whole notebook before computing a fresh midpoint.
export function gapExhausted(prev: number, next: number): boolean {
  return Math.abs(next - prev) < EPSILON;
}

// Clean, well-spaced indexes for a full re-spread, preserving the given order.
// Values stay far below any `epoch(createdAt)` fallback, so a later untouched
// page (epoch ~now) still sorts to the end of the notebook.
export function respread(ordered: JournalEntry[]): { id: string; orderIndex: number }[] {
  return ordered.map((p, i) => ({ id: p.id, orderIndex: (i + 1) * 1000 }));
}
