// window.wrizoDelete and window.wrizoDestructive: each delete path is the app's own store function and flushes; every one refuses unless the in-app typed confirmation completed this page session [deleteSeams §1]
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
