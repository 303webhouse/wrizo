import type { DeskTermId } from '../store/lexicon/terms';
import type { PlanPresetId } from './backMenu/planPresets';

// THE "?" NOTES OF THE FIRST SLICE (PRESETS-B item 3, Nov 23: the PRESETS load sheet, first-slice-notes.md, copied word for word; Fable: "Copy from it only; invent nothing"). Each of the twelve new PLAN structures and the twenty new PARTS presets has a note;
// the live three structures and eighteen presets have none (nothing live changes). A note is up to six lines, every one a LEXICON key (never a string here): `line` (in a line), `does` (what it does), `eg` (one invented example; the Poem has none, by the poet's rule,
// and Fifteen Beats none, because its deck's example names a book), `credit` (whose method it is), `must` (a line the "?" must say) and `names` (the Classical Oration's old names). Scene–Sequel and IMRaD show their live deck's own example, as the sheet rules.
export interface PresetNote { line: DeskTermId; does: DeskTermId; eg?: DeskTermId; credit?: DeskTermId; must?: DeskTermId; names?: DeskTermId }

/** The note of each new PLAN structure, by its id (planPresets.ts). */
export const STRUCTURE_NOTES: Partial<Record<PlanPresetId, PresetNote>> = {
  circle: { line: 'reorgPreNoteCircleLine', does: 'reorgPreNoteCircleDoes', eg: 'reorgPreNoteCircleEg', credit: 'reorgPreNoteCircleCredit' },
  seven: { line: 'reorgPreNoteSevenLine', does: 'reorgPreNoteSevenDoes', eg: 'reorgPreNoteSevenEg', credit: 'reorgPreNoteSevenCredit' },
  freytag: { line: 'reorgPreNoteFreytagLine', does: 'reorgPreNoteFreytagDoes', eg: 'reorgPreNoteFreytagEg', credit: 'reorgPreNoteFreytagCredit' },
  beats: { line: 'reorgPreNoteBeatsLine', does: 'reorgPreNoteBeatsDoes', eg: 'reorgPreNoteBeatsEg' },
  scene: { line: 'reorgPreNoteSceneLine', does: 'reorgPreNoteSceneDoes', eg: 'reorgPreNoteSceneEg', credit: 'reorgPreNoteSceneCredit' },
  toulmin: { line: 'reorgPreNoteToulminLine', does: 'reorgPreNoteToulminDoes', eg: 'reorgPreNoteToulminEg', credit: 'reorgPreNoteToulminCredit' },
  rogerian: { line: 'reorgPreNoteRogerianLine', does: 'reorgPreNoteRogerianDoes', eg: 'reorgPreNoteRogerianEg', credit: 'reorgPreNoteRogerianCredit' },
  oration: { line: 'reorgPreNoteOrationLine', does: 'reorgPreNoteOrationDoes', eg: 'reorgPreNoteOrationEg', credit: 'reorgPreNoteOrationCredit', names: 'reorgPreNoteOrationNames' },
  cars: { line: 'reorgPreNoteCarsLine', does: 'reorgPreNoteCarsDoes', eg: 'reorgPreNoteCarsEg', credit: 'reorgPreNoteCarsCredit' },
  imrad: { line: 'reorgPreNoteImradLine', does: 'reorgPreNoteImradDoes', eg: 'reorgPreNoteImradEg', credit: 'reorgPreNoteImradCredit' },
  answer: { line: 'reorgPreNoteAnswerLine', does: 'reorgPreNoteAnswerDoes', eg: 'reorgPreNoteAnswerEg', credit: 'reorgPreNoteAnswerCredit' },
  inverted: { line: 'reorgPreNoteInvertedLine', does: 'reorgPreNoteInvertedDoes', eg: 'reorgPreNoteInvertedEg', credit: 'reorgPreNoteInvertedCredit' },
};

/** The note of each new PARTS preset, by its id (docKinds.ts). */
export const PRESET_NOTES: Record<string, PresetNote> = {
  poem: { line: 'reorgKindNotePoemLine', does: 'reorgKindNotePoemDoes' },
  memoir: { line: 'reorgKindNoteMemoirLine', does: 'reorgKindNoteMemoirDoes', eg: 'reorgKindNoteMemoirEg' },
  'flash-fiction': { line: 'reorgKindNoteFlashFictionLine', does: 'reorgKindNoteFlashFictionDoes', eg: 'reorgKindNoteFlashFictionEg' },
  novella: { line: 'reorgKindNoteNovellaLine', does: 'reorgKindNoteNovellaDoes', eg: 'reorgKindNoteNovellaEg' },
  'lyric-essay': { line: 'reorgKindNoteLyricEssayLine', does: 'reorgKindNoteLyricEssayDoes', eg: 'reorgKindNoteLyricEssayEg' },
  'collage-essay': { line: 'reorgKindNoteCollageEssayLine', does: 'reorgKindNoteCollageEssayDoes', eg: 'reorgKindNoteCollageEssayEg' },
  treatment: { line: 'reorgKindNoteTreatmentLine', does: 'reorgKindNoteTreatmentDoes', eg: 'reorgKindNoteTreatmentEg' },
  'how-to-guide': { line: 'reorgKindNoteHowToGuideLine', does: 'reorgKindNoteHowToGuideDoes', eg: 'reorgKindNoteHowToGuideEg' },
  'class-essay': { line: 'reorgKindNoteClassEssayLine', does: 'reorgKindNoteClassEssayDoes', eg: 'reorgKindNoteClassEssayEg', must: 'reorgKindNoteClassEssayMust' },
  'thesis-or-dissertation': { line: 'reorgKindNoteThesisOrDissertationLine', does: 'reorgKindNoteThesisOrDissertationDoes', eg: 'reorgKindNoteThesisOrDissertationEg', must: 'reorgKindNoteThesisOrDissertationMust' },
  'lab-report': { line: 'reorgKindNoteLabReportLine', does: 'reorgKindNoteLabReportDoes', eg: 'reorgKindNoteLabReportEg' },
  'research-proposal': { line: 'reorgKindNoteResearchProposalLine', does: 'reorgKindNoteResearchProposalDoes', eg: 'reorgKindNoteResearchProposalEg' },
  'grant-application': { line: 'reorgKindNoteGrantApplicationLine', does: 'reorgKindNoteGrantApplicationDoes', eg: 'reorgKindNoteGrantApplicationEg', must: 'reorgKindNoteGrantApplicationMust' },
  'one-pager': { line: 'reorgKindNoteOnePagerLine', does: 'reorgKindNoteOnePagerDoes', eg: 'reorgKindNoteOnePagerEg' },
  'decision-memo': { line: 'reorgKindNoteDecisionMemoLine', does: 'reorgKindNoteDecisionMemoDoes', eg: 'reorgKindNoteDecisionMemoEg' },
  'product-spec': { line: 'reorgKindNoteProductSpecLine', does: 'reorgKindNoteProductSpecDoes', eg: 'reorgKindNoteProductSpecEg' },
  'status-update': { line: 'reorgKindNoteStatusUpdateLine', does: 'reorgKindNoteStatusUpdateDoes', eg: 'reorgKindNoteStatusUpdateEg' },
  'op-ed': { line: 'reorgKindNoteOpEdLine', does: 'reorgKindNoteOpEdDoes', eg: 'reorgKindNoteOpEdEg' },
  profile: { line: 'reorgKindNoteProfileLine', does: 'reorgKindNoteProfileDoes', eg: 'reorgKindNoteProfileEg' },
  explainer: { line: 'reorgKindNoteExplainerLine', does: 'reorgKindNoteExplainerDoes', eg: 'reorgKindNoteExplainerEg' },
};
