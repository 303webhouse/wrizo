// THE AUTISM ECONOMY SEED (brief docs/briefs/autism-economy-seed-brief.md; Fable, Oct 17-18) - the few app paths the seed script
// (scripts/seed/autism-economy.mjs) needs that no window seam reached yet. Each is the app's OWN function, the one the UI calls - never a
// raw storage write - and each mutating one flushes before it returns (the harness rule: a seam-seeded write must reach storage). They
// live here, not in persistence.ts, because two of them read store/sync.ts and store/pageExport.ts, which import persistence.ts.
//
// The DELETE paths (soft delete, Delete for good, Empty Trash) are NOT here: they come with the Delete-for-good ticket
// (docs/plans/delete-for-good.md), and the seed script refuses --apply until they exist.
import type { Box } from '../types';
import {
  countDirtyRecords, createBoardPage, flushNow, getAllUserBoards, getDeletedEntries, getDrawers, getJournalEntries, getJournalEntry,
  getJournalPages, getProjects, getShelfEntries, getStoryPlans, getSystemKind, getTrashedCards, saveBoardBoxes,
} from './persistence';
import { liveBoxes } from './boxTombstones';
import { whenFirstPulled } from './sync';
import { exportEverythingDocument } from './pageExport';

/** What the account holds, by the app's own readers - the dry run's counts and the final assertion's. */
export function seedCounts() {
  const entries = getJournalEntries();
  const userEntries = entries.filter((e) => !getSystemKind(e));
  const userBoards = getAllUserBoards();
  const systemBoards = entries.filter((e) => !!getSystemKind(e));
  const cardsOn = (boxes: Box[] | undefined) => liveBoxes(boxes ?? []).filter((b) => b.kind === 'text' || b.kind === 'ink').length;
  return {
    documents: userEntries.length,                                                        // every live page and board that is not a built-in place
    pages: userEntries.filter((e) => e.pageType !== 'board').length,
    journalPages: getJournalPages().length,
    shelfPages: getShelfEntries().filter((e) => e.pageType !== 'board').length,
    binderPages: userEntries.filter((e) => e.pageType !== 'board' && e.projectId != null).length,
    boards: userBoards.length,
    cards: userBoards.reduce((n, b) => n + cardsOn(b.boxes), 0),
    builtInPlaceCards: systemBoards.reduce((n, b) => n + cardsOn(b.boxes), 0),       // cards a writer put ON Journal / Shelf / Trash themselves
    binders: getProjects().length,
    drawers: getDrawers().length,
    storyPlans: getStoryPlans().filter((p) => !(p as { deletedAt?: string }).deletedAt).length,
    trashPages: getDeletedEntries().length,
    trashCards: getTrashedCards().length,
    unsynced: countDirtyRecords(),
  };
}

if (typeof window !== 'undefined') {
  (window as unknown as { wrizoSeed?: unknown }).wrizoSeed = {
    whenPulled: (capMs: number) => whenFirstPulled(capMs),
    counts: () => seedCounts(),
    unsynced: () => countDirtyRecords(),
    /** The app's own "Everything" export (Publish -> Download everything): one markdown document, the Trash included. */
    exportEverything: () => exportEverythingDocument(),
    /** createBoardPage - the board birth CreateProject and PinToBoardSheet use. */
    createBoardPage: (binderId: string, title: string) => { const b = createBoardPage(binderId, title); flushNow(); return getJournalEntry(b.id); },
    /** saveBoardBoxes - the board's own save (its autosave path). */
    saveBoardBoxes: (id: string, boxes: Box[]) => { saveBoardBoxes(id, boxes); flushNow(); return getJournalEntry(id); },
  };
}
