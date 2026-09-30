// PUB1 — "Order: one function, never a second copy" (§2). Chapter order is
// not stored yet (item 188; Experiment 2, "the board sets the chapter
// order"). Until it lands, `chapterOrder()`'s body IS the order Publish
// uses everywhere — no caller of this function may re-sort or re-derive an
// order of its own (R3).
//
// SEAM-188: today's body is E1's own creation-order sort, byte-identical to
// ProjectHome.tsx's `getBinderPages(id).slice().sort((a, b) =>
// a.createdAt.localeCompare(b.createdAt))` — the comparator this file's own
// harness tripwire below proves against, so a change to either side is
// caught, not assumed to still agree. WHEN THE CHAPTER-ORDER SPINE LANDS,
// this function's body becomes one call to it — nothing else in this file,
// and nothing outside it, changes shape. Until then, this comment (and the
// tripwire) are what make a silent drift to a SECOND order impossible: any
// PR that reorders chapters without going through this function, or that
// changes this function's comparator without updating the tripwire's own
// control value, fails loudly here.

export interface OrderableEntry {
  id: string;
  createdAt: string;
}

/** Publish never touches `orderIndex` or `seq`, and has no drag-to-reorder
 *  (§2). This is READ-ONLY: an ordered array of ids, in the order Assemble
 *  must walk them. `entries` is never mutated. */
export function chapterOrder(entries: readonly OrderableEntry[]): string[] {
  return entries
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((e) => e.id);
}
