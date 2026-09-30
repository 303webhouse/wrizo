// PUB1 — the Press shell's read-only running order. This is NOT Assemble
// (that stage — the real PressDoc, marks read through markRuns.ts, heading
// promotion) — it is a thin, presentational read so the shell has something
// true to show before Assemble exists: one row per chapter, a navTitle, in
// `chapterOrder()`'s own order. §2's own rule holds even at this remove:
// "Publish never writes an order. It never touches `orderIndex` or `seq`."
//
// Reads persistence.ts's OWN `getBinderPages` (a read, not an edit — R2
// governs editing another lane's file, not reading its exported seam; every
// other reader in this codebase, including E1's own harness, reads through
// it the same way) and hands the result straight to `chapterOrder()` — one
// function, never a second copy (§2).
import { getBinderPages } from '../../store/persistence';
import { firstLine } from '../../store/entryText';
import { chapterOrder } from './order';

export interface RunningOrderRow {
  id: string;
  navTitle: string;
}

/** A binder's chapters, read-only, in chapterOrder()'s own order. navTitle
 *  is the page's own first line (firstLine — the same helper pageExport.ts
 *  and the board's own naming use), never a guess at a real chapter heading:
 *  Assemble's "heading: 'from-body'|'numbered'|'none'" distinction (model.ts)
 *  is a later stage's job, not this read's. */
export function runningOrderForBinder(projectId: string): RunningOrderRow[] {
  // getBinderPages() already excludes the soft-deleted (persistence.ts's own
  // filter) — not repeated here, so this can never silently diverge from it.
  const pages = getBinderPages(projectId);
  const order = chapterOrder(pages);
  const byId = new Map(pages.map((p) => [p.id, p]));
  return order.map((id) => ({ id, navTitle: firstLine(byId.get(id)?.text ?? '') }));
}
