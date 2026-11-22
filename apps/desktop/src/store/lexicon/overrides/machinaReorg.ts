import type { ThemeId } from '../../theme';
import type { DeskTermId } from '../terms';
import { reorgFor } from '../../../reorg/flag';
import { MACHINA_OVERRIDES as LIVE } from './machina';

// THE REORG'S MACHINA WORDS, behind ?reorg=1 only (Fable, Nov 14: live-feedback-nov14i.md change 5). The strings are the Wrizors' list,
// claude/wrizors/reorg-word-changes.md sections 2b and 3, as written there: Machina's surface is BOARD (was Plan), the Board's ordered view is
// PLAN (was Outline), the Back menu's third tab is FEEDBACK (the AI in it is still the Consultant). Nick ruled the words Nov 14, 11:14 and
// 11:17 am ("Machina's Board arrives with the reorg").
//
// deskLexicon.ts imports MACHINA_OVERRIDES from HERE. With the switch off this module hands back the live table itself (the same object), so
// what the lexicon gives is byte-identical; with it on, Machina's table is the live one with these cells laid over it. Left alone on purpose
// (the list's own notes): pagePlanDoor stays 'Plan' until the Back menu replaces that door; templateOutline and helpOutline keep 'Outline'.
export const MACHINA_REORG_WORDS = {
  // 2b. Plan (the surface) becomes Board
  walkReadoutPlan: 'Board',
  walkKeysHint: '← → Step · Esc Board',
  stripPlan: 'Boards',
  sectionsNewBoard: 'New board',
  cascadePlanBoardsConnected: 'Boards attached',
  cascadePlanLinkedHeading: 'Attached to this board',
  boardRenameLabel: 'Rename this board',
  cascadeCardCopyNote: 'A copy is a new card owned by the board it lands on. Its threads do not come with it, and edits do not follow.',
  cascadeCardCopyTitle: 'Copy to Board',
  cascadeCardCopyTo: 'Copy to a board…',
  cascadeCardOnlyBoard: 'its only board',
  cascadeCardRemove: 'Remove from this board',
  cascadeOpenBoard: 'Open the board',
  cascadePinDisplay: 'Display on Board',
  cascadePinHide: 'Hide from the board',
  cascadePlanRelationOwn: 'its own board',
  cascadePlanSectionBoards: 'Boards',
  helpGrafts: 'Assets join docs, blocks and boards.',
  openPagesPlace: 'Place on this board',
  pageFacePin: 'Pin to a Board…',
  pageFacePortToBoard: 'Port to a Board…',
  placesBoardsEmpty: 'No boards yet.',
  placesBoardsZoneLabel: 'Boards this doc can join',
  railBoard: 'Board',
  sectionsEmptyBoards: 'No boards here yet.',
  graftSearch: 'Search blocks, docs, boards…',
  graftGroupBoards: 'Boards',
  graftPlanBoard: 'Board',
  // 3. the Outline view becomes Plan; the third tab becomes Feedback
  boardModeOutline: 'Plan',
  boardOutlineEmpty: 'No blocks yet. Add blocks in Open, then shape them into a plan here.',
  tutorTabTutor: 'Feedback',
} satisfies Partial<Record<DeskTermId, string>>;

export const MACHINA_OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> =
  reorgFor('machina') ? { machina: { ...LIVE.machina, ...MACHINA_REORG_WORDS } } : LIVE;
