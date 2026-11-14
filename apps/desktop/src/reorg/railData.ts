import type { Drawer, JournalEntry, Project } from '../types';
import { getDrawers, getJournalEntries, getProject, getSystemKind, inJournalView, isAutoSet, isPairedPlanBoard } from '../store/persistence';
import { compareSections, journalMembers, setsOfDrawer, UNSORTED } from '../store/place';

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

/** A Project's Docs by the read-time rule, in order: its sets in creation order; a made set is one Doc, an app-made set gives one Doc per page. */
export function docsOf(drawerId: string): RailDoc[] {
  const live = getJournalEntries().filter(listable);
  const out: RailDoc[] = [];
  for (const set of setsOfDrawer(drawerId)) {
    const mine = live.filter((e) => e.projectId === set.id).sort(compareSections);
    const pages = mine.filter((e) => !isBoard(e));
    if (isAutoSet(set) && false) {
      for (const p of pages) out.push({ set: null, parts: [p], boards: [] });
    } else if (pages.length) {
      out.push({ set, parts: pages, boards: mine.filter(isBoard) });
    }
  }
  return out;
}

/** The Notebook's Docs: each of its pages is a one-Part Doc (it has no sets). */
export function notebookDocs(): RailDoc[] {
  return notebookMembers().filter((e) => !isBoard(e)).sort(compareSections).map((p) => ({ set: null, parts: [p], boards: [] }));
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
