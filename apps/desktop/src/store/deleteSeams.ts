// DELETE FOR GOOD - window.wrizoDelete (the seed's delete paths, docs/plans/delete-for-good.md section 3). RED-FIRST STUB: today's app can only
// soft-delete; nothing can be deleted for good, and nothing is gated.
import { getJournalEntries, getSystemKind, softDeleteEntry } from './persistence';
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoDelete?: unknown }).wrizoDelete = {
    softAll: () => { let n = 0; for (const e of getJournalEntries()) if (!getSystemKind(e)) { softDeleteEntry(e.id); n += 1; } return { entries: n }; },
    emptyTrash: () => 0,
    purgeDeleted: () => ({ projects: 0, drawers: 0, storyPlans: 0 }),
  };
}
