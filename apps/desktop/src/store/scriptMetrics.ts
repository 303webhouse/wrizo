import type { ScriptElType } from '../types';

// S1/S2 shared geometry — the one-truth seam. Courier Prime 12pt = 10 cpi /
// 6 lpi, so `ch` units (character widths) are exact, deterministic layout:
// the screen's wrap IS the paginator's math. S2's paginator imports this SAME
// module rather than re-deriving these numbers, per the S-arc plan.

export const WIDTH_CH: Record<ScriptElType, number> = {
  scene: 60, action: 60, shot: 60, general: 60,
  dialogue: 35, paren: 19, character: 38, transition: 60,
};

// Indent from the page's left content edge, in ch. `transition` is right-
// aligned to column 60 instead of left-indented — handled as a text-align
// rule at render time, not an indent value (kept at 0 here for that reason).
export const INDENT_CH: Record<ScriptElType, number> = {
  scene: 0, action: 0, shot: 0, general: 0,
  dialogue: 10, paren: 16, character: 22, transition: 0,
};

export const RIGHT_ALIGN_TYPES: ReadonlySet<ScriptElType> = new Set(['transition']);

export const UPPERCASE_TYPES: ReadonlySet<ScriptElType> = new Set(['scene', 'character', 'transition', 'shot']);

// PAGE_LINES is derived, not typed: an 11in page less two 1in margins at 12pt Courier is exactly 54 lines; assert the geometry, never the count [scriptMetrics §1]
const PAGE_H_LINES = 66;      // 11in at 6 lines/inch
const MARGIN_LINES = 6;       // 1in, top and bottom
export const PAGE_LINES = PAGE_H_LINES - MARGIN_LINES - MARGIN_LINES;   // 54

export const SPACE_BEFORE: Record<ScriptElType, number> = {
  scene: 2, paren: 0, dialogue: 0,
  action: 1, character: 1, transition: 1, shot: 1, general: 1,
};

// the lookups are total: an unknown element type (stored jsonb from other builds) must never reach the paginator as NaN or a throw [scriptMetrics §2]
export function widthChFor(t: ScriptElType): number {
  return WIDTH_CH[t] ?? WIDTH_CH.action;
}
export function indentChFor(t: ScriptElType): number {
  return INDENT_CH[t] ?? 0;
}
export function spaceBeforeFor(t: ScriptElType): number {
  return SPACE_BEFORE[t] ?? 0;
}
