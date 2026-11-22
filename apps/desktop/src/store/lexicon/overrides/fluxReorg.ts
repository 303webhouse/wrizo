import type { ThemeId } from '../../theme';
import type { DeskTermId } from '../terms';
import { REORG } from '../../../reorg/flag';
import { FLUX_OVERRIDES as LIVE } from './flux';

// THE REORG'S FLUX WORDS, behind ?reorg=1 only (Fable, Nov 21: "the Flux reorg build from claude/wrizors/flux-reorg-spec.md"; Nick, Nov 20, 4:43 pm: SPINE for PLAN, the teal swap only if TK6 flags it, DOCK for the split).
// Flux's own words for the reorg's pieces, section 1 of the spec: Doc, Drive (a Project), Orphans (Unfiled), Circuit (a Board), Node (a Block), Track (a Part), Spine (the Plan), Inputs (Assets), the Operator (the Consultant), Log (the
// Notebook), Clone (Copy), Before uplink. The swaps are applied to the reorg's canonical strings with their {placeholders} kept; the strings the spec writes out ("More than a swap") are exactly as written there.
// A string that still holds a word the swaps do not settle (Typewriter, Progress, Page Setup, Research, Special, ...) is NOT set here: it keeps its canonical words until the Wrizors answer. Which ones: FLUX_REORG_UNSET.
//
// deskLexicon.ts imports FLUX_OVERRIDES from HERE. With the switch off this module hands back the live table itself (the same object), so what the lexicon gives is byte-identical; with it on, Flux's table is the live one with
// these cells laid over it. These words are read only by the reorg's surfaces, which stay Machina's until each Flux piece is lifted in reorg/themeGate.ts, so lifting a cell is the only thing that shows them.
export const FLUX_REORG_WORDS = {
  reorgUnfiled: 'Orphans',
  reorgAllProjects: 'All drives',
  reorgNewProject: 'New drive',
  reorgPinsLabel: 'Pinned drives',
  reorgBackPlan: 'Spine',
  reorgBackTabsLabel: 'Spine, inputs and the Operator',
  reorgBackExport: 'Before uplink',
  reorgBxNoneTicked: 'Nothing is ticked to go out. Tick at least one Track to export.',
  reorgBxEmptyOne: '{n} Track with no words',
  reorgBxEmptyMany: '{n} Tracks with no words',
  reorgPlanInclude: 'Include the spine in what goes out',
  reorgPlanIncludeNone: 'The Spine is empty: nothing to include.',
  reorgSprintLocked: 'Wired in: the Operator sends prompts only.',
  reorgPlanEmpty: 'Nothing is in this doc\'s spine.',
  reorgPlanRename: 'Name of the spine row',
  reorgPlanRemove: 'Remove from the spine',
  reorgPlanAdd: 'Add to the spine',
  reorgPlanToPart: '→ Track',
  reorgPlanOpenPart: 'Open Track',
  reorgPlanTick: 'This track has words',
  reorgPlanPresetsLabel: 'Fill the spine from a preset',
  reorgLenStructure3: 'Does each Track do one job?',
  reorgAssetsOwnBoard: 'This doc\'s circuit',
  reorgToPart: '→ Track',
  reorgToPartAria: 'Connect {title} to a Track',
  reorgToPartMenu: 'Connect to which Track',
  reorgDragNestNo: 'Can\'t nest under {part}: Tracks go no deeper.',
  reorgTagA: 'Cyan',
  reorgTagB: 'Lime',
  reorgTagC: 'Pink',
  reorgTagD: 'Ice',
  reorgTagE: 'Teal',
  reorgTagF: 'Deep cyan',
  reorgDocKindStandard: 'Plain',
  reorgDocKindScreenplay: 'Script',
  reorgDocSpecialParts: 'Special tracks',
  reorgSpecialTitle: 'Cover',
  reorgSpecialBibliography: 'Sources',
  reorgPresetGroupScreenplay: 'Script',
  reorgPartAssetsOne: '{n} input',
  reorgPartAssetsMany: '{n} inputs',
  reorgAssetsHead: 'Inputs ({n})',
  reorgAssetsPartToggle: 'Show or hide the inputs of {part}',
  reorgAssetsAdd: 'Add an Input',
  reorgAssetsAddTo: 'Add an Input to {part}',
  reorgAddMenu: 'Add an Input',
  reorgAddNewBoard: 'New Circuit',
  reorgAddExistingBoard: 'Existing Circuit',
  reorgAddSearchBoards: 'Find a Circuit',
  reorgAssetsSortProject: 'By Drive',
  reorgListTitle: 'Drive',
  reorgNewBoard: 'New circuit',
  reorgBoardsNoDoc: 'Circuits with no doc',
  reorgUntitled: 'Unnamed',
  reorgUntitledBoard: 'Untitled circuit',
  reorgKindScreenplay: 'Script',
  reorgSearchReachProject: 'This Drive',
  reorgSearchNoProject: 'You are in no Drive.',
  reorgSearchLineDoc: 'The words of this Doc, by Track',
  reorgSearchLineProject: 'Its Docs and Circuits',
  reorgSearchLineAll: 'Every Drive, the Log and Orphans',
  reorgSearchPart: 'Track {n}',
  reorgSearchBoardHead: 'Circuit · {name}',
  reorgDefaults: 'Doc defaults · every doc',
  reorgNoProjectHeading: 'Docs in Orphans',
  reorgFile: 'File {name} to a drive…',
  reorgUnfiledEmpty: 'No orphans.',
  reorgTopPartOf: 'TRK {n}/{m}',
  reorgTopPlaceNoDoc: 'Circuit · no doc yet',
  reorgTopPlaceOne: 'Circuit · {name}',
  reorgTopPlaceMany: 'Circuit · {n} docs',
  reorgTopConnect: 'Connect Docs',
  reorgTopConnectAnother: 'Connect Docs: connect this circuit to another doc',
  reorgTopConnectUnborn: 'Add a node first: a circuit is kept once it has one, and then it can join a doc.',
  reorgTopConnectNewHeld: 'A new doc would be made for this circuit. That is not switched on yet, so nothing changed.',
  reorgFrontParts: 'Tracks',
  reorgPartsHead: 'Tracks ({n})',
  reorgPartsOf: 'The tracks of {name}',
  reorgPartN: 'Track {n}',
  reorgTopPartsDrop: 'All the Tracks of this doc',
  reorgPartPrevTo: 'Previous Track: {part}',
  reorgPartNextTo: 'Next Track: {part}',
  reorgPartNoPrev: 'No Track before this one',
  reorgPartNoNext: 'No Track after this one',
  reorgPartEnd: 'end of Track {n}',
  reorgPubEmptyPart: 'Nothing written in this Track yet.',
  reorgPubTick: 'Send Track {n} out',
  reorgPubCount: '{n} of {total} Tracks go out',
  reorgPubCopyText: 'Clone text',
  reorgPubCopyFormatted: 'Clone formatted',
  reorgPubFrozen: 'Markup and Ink lock at Uplink. Patch to change the words.',
  reorgPubOnePart: 'One Track: there is nothing to order.',
  reorgPubPartsHint: 'Tick what goes out. Move a Track up or down to put it in order.',
  reorgPubPartsLabel: 'Tracks, in order, for publishing',
  reorgPubUp: 'Move Track {n} up',
  reorgPubDown: 'Move Track {n} down',
  reorgPartsNew: 'New track',
  reorgPartsNewNo: 'A new Track can’t be made from here.',
  reorgPartsSplitCaret: 'Put the caret where the new Track starts, then split.',
  reorgPartsSplitNo: 'This Track can’t be split.',
  reorgPartsSplitDone: 'Split: the words after the caret are Track {n} now.',
  reorgPartJoinCarries: 'Not joined: this Track holds ink, cards, links or a Operator thread, and joining would drop them.',
  reorgPartJoinScript: 'Not joined: a screenplay Track has no plain text to join.',
  reorgPartsJoinDone: 'Joined onto Track {n}.',
} satisfies Partial<Record<DeskTermId, string>>;

/** The reorg strings this table leaves unset, and why (the Wrizors list). */
export const FLUX_REORG_UNSET: readonly string[] = [
  'reorgLensLabel',   // Feedback lenses
  'reorgDocPageSetup',   // Page Setup
  'reorgSplitNoTypewriter',   // Typewriter mode is off in a split: turn it off first.
  'reorgKindResearch',   // Research paper
  'reorgTypewriter',   // Typewriter mode
  'reorgProgressBars',   // Progress bars
];

export const FLUX_OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> =
  REORG ? { flux: { ...LIVE.flux, ...FLUX_REORG_WORDS } } : LIVE;
