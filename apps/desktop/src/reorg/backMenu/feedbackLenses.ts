import type { DeskTermId } from '../../store/lexicon/terms';

// THE FEEDBACK LENS FRAME (the reorg's Back menu, FEEDBACK; Nick's F2 and F3, claude/wrizors/machina-stage-menus-decide.md draft 3; Fable, Nov 20, 11:15 pm). In BUILD the Consultant's tab is three lenses,
// Structure, Tone and Consistency ("replacing the asks"), each opening to AT MOST THREE prompts, plus "Ask Your Own" (her own question, the existing composer). In EDIT three more sit ABOVE them: Usage
// (grammar, diction, repetitive phrasing; the old Fragments lens folds in later), Punctuation and Citations. SPRINT has none (it keeps its one writing prompt).
// This file is the whole rule, pure: which lenses a stage shows, in which order, and how many prompts each opens to. The words are a TABLE of lexicon keys, all eighteen ruled (Nick, Nov 20, 11:43 pm;
// claude/wrizors/feedback-lens-prompts-draft.md draft 2: prompts in sentence case, lens names in Title Case). A lens with no prompt in the table is not drawn, so a lens added later never shows an empty promise.
// Citations 2 reads "Are my citations in one style?" until a Doc has a style guide (the draft's own fallback).
export type LensId = 'structure' | 'tone' | 'consistency' | 'usage' | 'punctuation' | 'citations';
export type LensStage = 'build' | 'edit';
export interface Lens { id: LensId; name: DeskTermId; prompts: DeskTermId[] }

/** A lens opens to at most this many prompts (Nick, F2: "at most three"). */
export const LENS_MAX = 3;

export const LENS_PROMPTS: Record<LensId, DeskTermId[]> = {
  structure: ['reorgLenStructure1', 'reorgLenStructure2', 'reorgLenStructure3'],
  tone: ['reorgLenTone1', 'reorgLenTone2', 'reorgLenTone3'],
  consistency: ['reorgLenConsistency1', 'reorgLenConsistency2', 'reorgLenConsistency3'],
  usage: ['reorgLenUsage1', 'reorgLenUsage2', 'reorgLenUsage3'],
  punctuation: ['reorgLenPunctuation1', 'reorgLenPunctuation2', 'reorgLenPunctuation3'],
  citations: ['reorgLenCitations1', 'reorgLenCitations2', 'reorgLenCitations3'],
};

const NAME: Record<LensId, DeskTermId> = {
  structure: 'reorgLensStructure', tone: 'reorgLensTone', consistency: 'reorgLensConsistency', usage: 'reorgLensUsage', punctuation: 'reorgLensPunctuation', citations: 'reorgLensCitations',
};
const BOTH: LensId[] = ['structure', 'tone', 'consistency'];
const EDIT_ONLY: LensId[] = ['usage', 'punctuation', 'citations'];

/** The lenses a stage draws, in order. Any stage but BUILD and EDIT draws none. `table` is the words (the shipped one by default; a check passes a full one). */
export function lensRoster(stage: string, table: Record<LensId, string[]> = LENS_PROMPTS as Record<LensId, string[]>): Lens[] {
  if (stage !== 'build' && stage !== 'edit') return [];
  const order = stage === 'edit' ? [...EDIT_ONLY, ...BOTH] : BOTH;
  return order
    .map((id) => ({ id, name: NAME[id], prompts: (table[id] ?? []).slice(0, LENS_MAX) as DeskTermId[] }))
    .filter((l) => l.prompts.length > 0);
}
