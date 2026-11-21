import type { DeskTermId } from '../../store/lexicon/terms';

// THE FEEDBACK LENS FRAME (the reorg's Back menu, FEEDBACK; Nick's F2 and F3, claude/wrizors/machina-stage-menus-decide.md draft 3; Fable, Nov 20, 11:15 pm). In BUILD the Consultant's tab is three lenses,
// Structure, Tone and Consistency ("replacing the asks"), each opening to AT MOST THREE prompts, plus "Ask Your Own" (her own question, the existing composer). In EDIT three more sit ABOVE them: Usage
// (grammar, diction, repetitive phrasing; the old Fragments lens folds in later), Punctuation and Citations. SPRINT has none (it keeps its one writing prompt).
// This file is the whole rule, pure: which lenses a stage shows, in which order, and how many prompts each opens to. The words are a TABLE of lexicon keys, and the table holds only RULED words: Structure's
// three (Nick's approved asks) and Consistency's two. A lens with no ruled prompt is not drawn, so the frame never shows an empty promise; the Wrizors' words for Tone, Usage, Punctuation and Citations (and
// Consistency's third) are dropped into this table when Nick rules them, and nothing else changes.
export type LensId = 'structure' | 'tone' | 'consistency' | 'usage' | 'punctuation' | 'citations';
export type LensStage = 'build' | 'edit';
export interface Lens { id: LensId; name: DeskTermId; prompts: DeskTermId[] }

/** A lens opens to at most this many prompts (Nick, F2: "at most three"). */
export const LENS_MAX = 3;

export const LENS_PROMPTS: Record<LensId, DeskTermId[]> = {
  structure: ['tutorDraftAskLoadBearing', 'reorgLensClaim', 'reorgLensReader'],
  tone: [],
  consistency: ['tutorDraftAskThreadSlip', 'reorgLensTerm'],
  usage: [],
  punctuation: [],
  citations: [],
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
