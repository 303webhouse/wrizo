// BIG PROJECTS STEP 3 - GRAFTS, "connected to this page" (docs/plans/big-projects.md step 3 + the graft-doors addendum; mockup
// cursor/graft-doors-mockup @ c4f34eb0; the file split, docs/plans/big-projects-3-file-split.md). THE CHECKS COME FIRST: this module is a
// STUB with the real signatures, so scripts/big-projects-3-check.mjs runs and goes red on its own assertions. The build fills it in.
import type { Box } from '../types';

/** What Grafts is about: a page or a board (an entry), or a card on a board (the entry is the board, `boxId` the card). */
export interface GraftSubject { entryId: string; boxId?: string }
/** What a graft points at: an entry, or a card on a board. */
export interface GraftTarget { entryId: string; boxId?: string }

export type GraftGroup = 'Cards' | 'Sources' | 'Boards' | 'Pages';

export interface GraftRow {
  key: string;
  group: GraftGroup;
  entryId: string;
  boxId?: string;
  title: string;
  place: string;            // the place label: a Drawer's name, "Unsorted", or "Journal"
  placeDiffers: boolean;    // the faint label shows only when this is in another place than the subject
  checked?: boolean;        // the picker: already grafted (a check mark, inert - Q10)
  via?: 'card' | 'link';    // the panel: a same-board connection box, or a page_links record
  linkId?: string;
  connId?: string;
  trashed?: boolean;
}

export interface SharedTagRow { key: string; entryId: string; title: string; tag: string; place: string; placeDiffers: boolean }

export interface Grafts { Cards: GraftRow[]; Sources: GraftRow[]; Boards: GraftRow[]; Pages: GraftRow[]; sharedTags: SharedTagRow[] }

export interface PlanGroup { boardId: string; cards: { boxId: string; title: string }[]; count: number }

export type GraftMade = { made: 'link'; linkId: string } | { made: 'connection'; a: string; b: string } | null;

export function placeLabelOf(_entryId: string): string { return ''; }
export function searchGraftables(_query: string, _subject: GraftSubject): { Cards: GraftRow[]; Pages: GraftRow[]; Boards: GraftRow[] } {
  return { Cards: [], Pages: [], Boards: [] };
}
export function isGrafted(_subject: GraftSubject, _target: GraftTarget, _boxes?: readonly Box[]): boolean { return false; }
export function graftTo(_subject: GraftSubject, _target: GraftTarget, _boxes?: readonly Box[]): GraftMade { return null; }
export function graftsOf(_subject: GraftSubject, _boxes?: readonly Box[]): Grafts {
  return { Cards: [], Sources: [], Boards: [], Pages: [], sharedTags: [] };
}
export function pairedPageRow(_boardId: string): GraftRow | null { return null; }
export function planGroupOf(_pageId: string): PlanGroup | null { return null; }
export function hidePlanCard(_pageId: string, _boxId: string): void { /* the build */ }
export function unhidePlanCard(_pageId: string, _boxId: string): void { /* the build */ }
export function restorePageLink(_linkId: string): boolean { return false; }
