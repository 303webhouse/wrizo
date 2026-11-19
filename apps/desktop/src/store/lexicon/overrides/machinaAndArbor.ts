import { MACHINA_OVERRIDES as MACHINA } from './machinaReorg';
import { ARBOR_OVERRIDES } from './arbor';

// deskLexicon.ts's text is held byte-for-byte by the standing lexicon gate (scripts/c13/c13-10c-lexicon.mjs, rule (2): only its IMPORT lines may
// change), so a new theme table joins the way the reorg's Machina words joined (machinaReorg.ts): through the import line. deskLexicon's second
// spread imports MACHINA_OVERRIDES from HERE: Machina's own table (machinaReorg.ts, unchanged - the same object's cells) and Arbor's Canvas
// (arbor.ts: the plateau key, only while the redesign's switch is on). Each theme's cells stay under its own key; nothing of one reaches another.
export const MACHINA_OVERRIDES = { ...MACHINA, ...ARBOR_OVERRIDES };
