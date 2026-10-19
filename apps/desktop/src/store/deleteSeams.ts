// DELETE FOR GOOD - window.wrizoDelete, the seed's delete paths (docs/plans/delete-for-good.md section 3: the contract with
// scripts/seed/autism-economy.mjs), and window.wrizoDestructive, the in-app confirmation that opens them. Each delete path is the app's own store
// function and flushes before it returns. Every one REFUSES (throws "refused: ...") unless the writer completed the in-app typed confirmation in
// this page session (store/destructiveGate.ts - Fable's change 1): a bare console call can never empty an account.
import {
  emptyTrash, flushNow, getDrawers, getJournalEntries, getProjects, getStoryPlans, getSystemKind, purgeAllDeleted,
  softDeleteDrawer, softDeleteEntry, softDeleteProject, softDeleteStoryPlan,
} from './persistence';
import { isDestructiveUnlocked, requestDestructiveConfirm, unlockDestructiveForTest, type DestructiveRequest } from './destructiveGate';

const gate = (): void => {
  if (!isDestructiveUnlocked()) throw new Error('refused: confirm in the app first - window.wrizoDestructive.request() opens the confirmation, and the writer types the phrase');
};

if (typeof window !== 'undefined') {
  (window as unknown as { wrizoDelete?: unknown }).wrizoDelete = {
    /** Every live page, board, binder, drawer and plan to Trash, by the app's soft deletes. Built-in places are skipped. */
    softAll: () => {
      gate();
      const out = { entries: 0, projects: 0, drawers: 0, storyPlans: 0 };
      for (const e of getJournalEntries()) if (!getSystemKind(e)) { softDeleteEntry(e.id); out.entries += 1; }
      for (const p of getProjects()) { softDeleteProject(p.id); out.projects += 1; }
      for (const d of getDrawers()) { softDeleteDrawer(d.id); out.drawers += 1; }
      for (const s of getStoryPlans()) if (!s.deletedAt) { softDeleteStoryPlan(s.id); out.storyPlans += 1; }
      flushNow();
      return out;
    },
    /** Trash's own Empty Trash. */
    emptyTrash: () => { gate(); const n = emptyTrash(); flushNow(); return n; },
    /** Every soft-deleted binder, drawer and plan, deleted for good. */
    purgeDeleted: () => { gate(); const out = purgeAllDeleted(); flushNow(); return out; },
  };
  (window as unknown as { wrizoDestructive?: unknown }).wrizoDestructive = {
    request: (req: DestructiveRequest) => requestDestructiveConfirm(req),
    unlocked: () => isDestructiveUnlocked(),
    unlockForTest: () => unlockDestructiveForTest(),
  };
}
