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

// SC2 S1 (2026-07-25) — PAGE_LINES IS NOW DERIVED, NOT TYPED.
//
// THE RECORD, VERBATIM: this constant shipped as `export const PAGE_LINES = 55;`
// under the comment "Dormant until S2's paginator — defined now so both S1 and
// S2 read the same constants from day one (no re-derivation, no drift)." It was
// never referenced; the seam did its job before it ever fired — one file to
// correct instead of a scattering.
//
// 55 IS THE TRADE'S RULE OF THUMB, AND ITS VARIANCE IS BOTTOM MARGINS THAT
// DIFFER IN PRACTICE. The geometry is exact: an 11in page less two 1in margins
// is a NINE-INCH text block, and at 12pt Courier single-spaced the line box is
// exactly 12pt = 1/6in — so 54 lines FALL OUT. Assert the geometry, never the
// count: a derived 54 cannot be typo'd and a typed one can. (Fable's ruling,
// 2026-07-25; sc2.mjs asserts the line box and the text block off the rendered
// page rather than comparing against any number written here.)
//
// CONSEQUENCE, RECORDED AND NOT ACTED ON: a 120-page script counts roughly two
// pages shorter here than in software using the folklore 55. Internally
// consistent and correct. If trade-parity ever matters at export, it is a
// bottom-margin question, not a line-count one.
const PAGE_H_LINES = 66;      // 11in at 6 lines/inch
const MARGIN_LINES = 6;       // 1in, top and bottom
export const PAGE_LINES = PAGE_H_LINES - MARGIN_LINES - MARGIN_LINES;   // 54

export const SPACE_BEFORE: Record<ScriptElType, number> = {
  scene: 2, paren: 0, dialogue: 0,
  action: 1, character: 1, transition: 1, shot: 1, general: 1,
};

// SC2 S2b — THE LOOKUPS BECOME TOTAL, and the mechanism is named rather than
// guarded against in the abstract.
//
// Until S2b nothing read these tables at runtime except `elementStyle`, where
// an unknown type produced an invalid CSS value the browser quietly dropped.
// From S2b the RENDER runs the ledger and the paginator on every keystroke, and
// an unknown type there is not cosmetic: `SPACE_BEFORE[t]` returns `undefined`,
// `used + undefined + lines` is NaN, every comparison against NaN is false, and
// the paginator puts each element on a page of its own — a 928-element document
// becomes 928 pages. `BREAK_RULES[t].splittable` throws outright.
//
// This is not hypothetical. `scripts/harness/sc2.mjs`'s FROZEN S0 baseline
// fixture seeds 116 elements typed `'parenthetical'`, which is not a member of
// `ScriptElType` (the type is `'paren'`) — so the baseline document is, today,
// a document this build does not fully know. That fixture CANNOT be corrected:
// it is the pre-pagination reference, pinned at c1cabe8, and a re-issue after
// pagination exists would no longer be a pre-pagination baseline. Recorded, not
// papered over — and the real lesson is the general one: a script doc is jsonb
// that arrives from storage and from other builds, so a type outside this
// build's table is a thing that HAPPENS, and the correct behaviour is to render
// it as an ordinary unbreakable full-measure block rather than to produce NaN.
//
// The fallbacks are stated, not silent: full measure, no space above, no
// special break behaviour — the most conservative reading of "a block of text
// this build has no rule for".
export function widthChFor(t: ScriptElType): number {
  return WIDTH_CH[t] ?? WIDTH_CH.action;
}
export function indentChFor(t: ScriptElType): number {
  return INDENT_CH[t] ?? 0;
}
export function spaceBeforeFor(t: ScriptElType): number {
  return SPACE_BEFORE[t] ?? 0;
}
