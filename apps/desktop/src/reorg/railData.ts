import type { Drawer, JournalEntry, Project } from '../types';
import { getDrawers, getJournalEntries, getProject, getSystemKind, inJournalView, isAutoSet, isPairedPlanBoard } from '../store/persistence';
import { compareSections, createSet, ensureSet, journalMembers, setsOfDrawer, UNSORTED } from '../store/place';

// THE RAIL'S READS (the reorg, phase 2, behind ?reorg=1 in Machina). Pure reads of what is already stored: nothing here writes, and nothing here
// is a new saved field. Every rule below is a READ-TIME rule (reorg-plan-tech.md section 2; Fable's clearance, live-feedback-nov14i.md):
//
//  - A PROJECT is a live Drawer, in the writer's order.
//  - The NOTEBOOK is the hidden Journal (Nov 11, the interview's Q2): a place of its own, listed LAST in All projects, its pin off. Its members are
//    the Journal's own pages and boards: today's `inJournalView` (origin 'journal', or the pre-AB3 grandfathered shape, with no set).
//  - UNFILED is writing with no Project, and only that: every other entry with no live home (a loose page, a loose page pinned on a board, a page
//    whose set is gone), plus the entries of a set that sits in no live Drawer (today's "Unsorted" group). Notebook and Unfiled split
//    `journalMembers()` exactly, so nothing the Journal lists today is lost or listed twice.
//  - A DOC, before Parts exist: a set the writer made is one Doc (its Parts are its pages, in her order); each page of a Drawer's lazy first set
//    (`isAutoSet`: Top Drawer's set and the set an empty Drawer makes) is a one-Part Doc. No row is rewritten.

export const NOTEBOOK = 'notebook';

export interface RailProject { id: string; name: string; drawer: Drawer | null; docs: number }
export interface RailDoc { set: Project | null; parts: JournalEntry[]; boards: JournalEntry[] }

const isBoard = (e: JournalEntry): boolean => e.pageType === 'board';
const listable = (e: JournalEntry): boolean => !e.deletedAt && !e.purgedAt && !getSystemKind(e) && !isPairedPlanBoard(e.id);

/** The Notebook's members: the Journal's own pages and boards. */
export function notebookMembers(): JournalEntry[] {
  return journalMembers().filter((e) => e.projectId == null && inJournalView(e));
}

/** Writing with no Project: the rest of `journalMembers()`, then the entries of every set with no live Drawer. */
export function unfiledMembers(): JournalEntry[] {
  const loose = journalMembers().filter((e) => !(e.projectId == null && inJournalView(e)));
  const orphanSets = new Set(setsOfDrawer(UNSORTED).map((p) => p.id));
  const inOrphanSets = orphanSets.size ? getJournalEntries().filter((e) => listable(e) && e.projectId != null && orphanSets.has(e.projectId)) : [];
  return [...loose, ...inOrphanSets];
}

/** A board with no Doc, and the name of the set it sits in when that set is one she made (a set of boards only: Fable, Nov 14, 2:40 pm). */
export interface LooseBoard { board: JournalEntry; setName: string | null }
/** A Project's own list (step 3; Nick, Nov 14, 11:14 am): its Docs, then its Boards with no Doc. */
export interface RailList { docs: RailDoc[]; boards: LooseBoard[] }

/**
 * A Project's own list by the read-time rule, its sets in creation order. A set she made with pages is ONE Doc: its pages are its Parts, its
 * boards are that Doc's boards (reorg-plan-tech 2.1; until phase 3 both show indented under it). A set she made with boards only is no Doc, so
 * its boards are Boards with no Doc, with the set's name beside them. The app-made set gives a one-Part Doc per page, and its boards are Boards
 * with no Doc. The Notebook has no sets: each page a one-Part Doc, each board a Board with no Doc. Paired plan boards are never listed (as today).
 */
export function listOf(id: string): RailList {
  if (id === NOTEBOOK) {
    const mine = notebookMembers().sort(compareSections);
    return { docs: mine.filter((e) => !isBoard(e)).map((p) => ({ set: null, parts: [p], boards: [] })), boards: mine.filter(isBoard).map((board) => ({ board, setName: null })) };
  }
  const live = getJournalEntries().filter(listable);
  const docs: RailDoc[] = [];
  const boards: LooseBoard[] = [];
  for (const set of setsOfDrawer(id)) {
    const mine = live.filter((e) => e.projectId === set.id).sort(compareSections);
    const pages = mine.filter((e) => !isBoard(e));
    const setBoards = mine.filter(isBoard);
    if (isAutoSet(set)) {
      for (const p of pages) docs.push({ set: null, parts: [p], boards: [] });
      for (const board of setBoards) boards.push({ board, setName: null });
    } else if (pages.length) {
      docs.push({ set, parts: pages, boards: setBoards });
    } else {
      for (const board of setBoards) boards.push({ board, setName: set.title });
    }
  }
  return { docs, boards };
}

/** A Project's Docs by the read-time rule (the count All projects shows). */
export function docsOf(drawerId: string): RailDoc[] {
  return listOf(drawerId).docs;
}

/** The Notebook's Docs: each of its pages is a one-Part Doc (it has no sets). */
export function notebookDocs(): RailDoc[] {
  return listOf(NOTEBOOK).docs;
}

/** Where a new Doc or Board from the rail is filed. ALWAYS a Doc of its own, or a Board with no Doc (Fable, Nov 14, 3:52 pm): into the Project's
 *  app-made set when it has one (each page there is a one-Part Doc, each board a Board with no Doc); a Project with no set at all gets today's
 *  lazy app-made set (ensureSet); a Project holding only sets she made gets a NEW set through today's "+ New set" act (createSet), titled with
 *  `untitled`, so the page is its own Doc (and a board is a set of boards only: a Board with no Doc). Never her first set: that would make the
 *  new page a Part of another Doc. The set is made ON THE CLICK (today's acts make a set at once; only the page waits for the first keystroke),
 *  so a new Doc she abandons leaves one empty set behind. The Notebook files nothing into a set (a journal page). */
export function newTargetOf(id: string, untitled: string): { binderId: string } | { origin: 'journal' } | null {
  if (id === NOTEBOOK) return { origin: 'journal' };
  const sets = setsOfDrawer(id);
  const target = sets.find((s) => isAutoSet(s)) ?? (sets[0] ?? ensureSet(id));
  return target ? { binderId: target.id } : null;
}

/** All projects: the live Drawers in her order, then the Notebook last. */
export function railProjects(notebookName: string): RailProject[] {
  const drawers = getDrawers().slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return [
    ...drawers.map((d) => ({ id: d.id, name: d.name, drawer: d, docs: docsOf(d.id).length })),
    { id: NOTEBOOK, name: notebookName, drawer: null, docs: notebookDocs().length },
  ];
}

/** Which Project an entry sits in, for the rail's "where she is": a live Drawer's id, the Notebook, or null (Unfiled). */
export function projectOfEntry(e: JournalEntry): string | null {
  if (e.projectId != null) {
    const set = getProject(e.projectId);
    if (set) {
      const drawerId = set.drawerId;
      return drawerId && getDrawers().some((d) => d.id === drawerId) ? drawerId : null;
    }
  }
  return inJournalView(e) ? NOTEBOOK : null;
}

/** A box's two letters, derived and never stored: the first letters of the first two words, or the first two letters of a one-word name. */
export function lettersOf(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (!words.length) return '';
  const first = (w: string): string => (w.match(/[\p{L}\p{N}]/u) ?? [''])[0];
  if (words.length === 1) return [...words[0].replace(/[^\p{L}\p{N}]/gu, '')].slice(0, 2).join('').toUpperCase();
  return (first(words[0]) + first(words[1])).toUpperCase();
}
