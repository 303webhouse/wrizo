import type { ThemeId } from '../../theme';
import type { DeskTermId } from '../terms';
import { arbor2Enabled } from '../../../arbor2/flag';

// ARBOR'S CANVAS (NICK RULED, Nov 14, 11:14 and 11:17 am: Arbor's Board becomes "Canvas" right after the Arbor redesign ships; Fable's order of
// Nov 18, 12:50 pm, after the ship). The strings are the Wrizors' list, claude/wrizors/reorg-word-changes.md section 4b, as written there:
// Board -> Canvas, Boards -> Canvases, board -> canvas, boards -> canvases. "Storyboard" (a view) and "Corkboard" (a zone) stay.
//
// Arbor's first override (the list's flag 4): the DEFAULT lists keep "Board" underneath, so the data, the addresses, sync and search keep the default
// nouns, and Machina's own "Board" (written out in its own table) can never fall through to Canvas. Arbor's noun (board: Canvas, Canvases) sits beside
// these in themeLexicon.ts under the same switch.
//
// The switch is the redesign's: on by default in Arbor, off only under the test-only ?arbor2=0 (today's Arbor, which said Board). Read once at load,
// like the reorg's own word table (machinaReorg.ts): the query sits before the hash route, so in-app navigation never changes it.
export const ARBOR_CANVAS_WORDS: Partial<Record<DeskTermId, string>> = {
  walkReadoutPlan: 'Canvas',
  boardRenameLabel: 'Rename this canvas',
  pageFacePortToBoard: 'Port to a Canvas…',
  pageFacePin: 'Pin to a Canvas…',
  stripPlan: 'Canvases',
  cascadePlanBoardsConnected: 'Canvases grafted',
  cascadePlanRelationOwn: 'its own plan canvas',
  cascadeCardCopyTo: 'Copy to a canvas…',
  cascadeCardCopyTitle: 'Copy to Canvas',
  cascadeCardCopyNote: 'A copy is a new card owned by the canvas it lands on. Its threads do not come with it, and edits do not follow.',
  cascadeCardRemove: 'Remove from this canvas',
  cascadeCardOnlyBoard: 'its only canvas',
  cascadeOpenBoard: 'Open the canvas',
  cascadePlanSectionBoards: 'Canvases',
  cascadePlanLinkedHeading: 'Linked to this canvas',
  cascadePinDisplay: 'Display on Canvas',
  cascadePinHide: 'Hide from the canvas',
  railBoard: 'Canvas',
  ctxDeleteBoard: 'Delete canvas',
  linksKindBoard: 'Canvas',
  graftSearch: 'Search cards, pages, canvases…',
  graftGroupBoards: 'Canvases',
  graftPlanBoard: 'Plan canvas',
  openPagesPlace: 'Place on this canvas',
  sectionsNewBoard: 'New Canvas',
  sectionsEmptyBoards: 'No canvases here yet.',
  placesBoardsZoneLabel: 'Canvases this page can join',
  placesBoardsEmpty: 'No canvases yet.',
  helpGrafts: 'Grafts join pages, cards and canvases.',
};

/** True when Arbor reads "Canvas": the redesign's own switch (off only under the test-only ?arbor2=0). Read once at load. */
export const ARBOR_CANVAS: boolean = arbor2Enabled();

export const ARBOR_OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> = ARBOR_CANVAS ? { plateau: ARBOR_CANVAS_WORDS } : {};
