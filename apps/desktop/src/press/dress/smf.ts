// PUB2 — Dress, as PURE DATA. Standard Manuscript Format's page geometry, its
// running head, and the two line-level conventions the professional editor
// named (§1): "#" scene breaks and first-line indents. Assemble (turning
// records into a real PressDoc, marks read through markRuns.ts) waits for r3
// to land on main — this file does not depend on it and is not blocked by
// it: SMF's geometry is fixed numbers, and the indent/scene-break reads
// below are LINE-LEVEL, plain-text conventions already on main in
// store/draftFormat.ts, a different concern from markRuns.ts's INLINE marks
// (bold/italic within a line). Nothing here draws a page — pdf-lib/fontkit
// (PUB7) are the render stage; this is the geometry and the two tests a
// later Render call gives the same numbers to.
//
// THE QUOTE THIS FILE BUILDS TO (§1, verbatim): "Standard Manuscript Format
// (Times 12, double-spaced, 1″ margins, 'Surname / TITLE / page' header,
// `#` scene breaks, word count rounded on the title page)".
import { LINE_DIRECTIVE } from '../../store/draftFormat';

/** US Letter, in points (72pt/inch — pdf-lib's own unit, so Render needs no
 *  conversion). SMF is a US-market convention; A4 is not this ticket's job. */
export const PAGE_WIDTH_PT = 8.5 * 72;
export const PAGE_HEIGHT_PT = 11 * 72;

/** "1″ margins" — all four sides, per §1's own words. */
export const MARGIN_PT = 1 * 72;

/** "Times 12" — the point size; Tinos is Times New Roman's metric-compatible
 *  Apache-2.0 substitute (§2's own Fonts section), embedded because a real
 *  PDF cannot legally carry Microsoft's own Times New Roman bytes. */
export const FONT_SIZE_PT = 12;

/** "double-spaced" — a line height of exactly twice the font size, the
 *  publishing-convention reading of "double-spaced" (not a browser's
 *  line-height:2 approximation of leading-on-top-of-natural-leading). */
export const LINE_HEIGHT_MULTIPLIER = 2;
export const LINE_HEIGHT_PT = FONT_SIZE_PT * LINE_HEIGHT_MULTIPLIER;

/** The conventional SMF first-line indent — half an inch. */
export const FIRST_LINE_INDENT_PT = 0.5 * 72;

/** The three vendored faces (§2's own Fonts section), named here so Dress
 *  and Render agree on which face each role uses without a third place
 *  inventing a fourth name. Paths are the PLANNED vendoring location
 *  (`apps/desktop/public/press/fonts/`) — PUB7 vendors the actual TTF bytes;
 *  this ticket names where Dress expects to find them, not the files
 *  themselves. */
export const SMF_FONTS = {
  /** Tinos — Times New Roman's substitute. The prose manuscript's own body
   *  and running-head face (§1's "Times 12"). */
  prose: { family: 'Tinos', file: 'apps/desktop/public/press/fonts/Tinos-Regular.ttf' },
  /** Courier Prime (OFL) — the screenplay's fixed-width face (PUB8; industry
   *  screenplay format is Courier, never Times, per the same §1 line). */
  screenplay: { family: 'Courier Prime', file: 'apps/desktop/public/press/fonts/CourierPrime-Regular.ttf' },
  /** Arimo — Arial's substitute. Named here for a sans-serif role (a quote
   *  card, a generated cover) that no built ticket claims yet; vendored
   *  alongside the other two rather than added piecemeal later. */
  sans: { family: 'Arimo', file: 'apps/desktop/public/press/fonts/Arimo-Regular.ttf' },
} as const;

/**
 * SMF's header: "Surname / TITLE / page" (§1, verbatim — TITLE upper-cased,
 * the page number bare, both sides of each slash a single space). `surname`
 * and `title` travel already trimmed to whatever the title page itself
 * shows; this function does not re-derive either — one function, one job.
 */
export function runningHead(surname: string, title: string, page: number): string {
  return `${surname} / ${title.toUpperCase()} / ${page}`;
}

/**
 * "#" scene breaks (§1) — a line that is NOTHING BUT "#" (optionally
 * surrounded by whitespace the writer's own line already trims to nothing
 * meaningful). Deliberately narrower than model.ts's own chapter-heading
 * read (`# Some Text` promotes to a heading, §2's "Chapter headings never
 * duplicate words") — SMF's scene break is the bare mark alone, mid-chapter,
 * not a heading with words after it; a line with anything following "#" is
 * never a scene break under this test.
 */
export function isSceneBreak(line: string): boolean {
  return line.trim() === '#';
}

/**
 * First-line indents (Nick's Tab ruling, item 83 M5 — "Indent is a leading
 * tab", store/draftFormat.ts's own LINE_DIRECTIVE.indent). Reads the SAME
 * constant Free Write/Draft/Revise's own Indent button writes — imported,
 * never copied, so a re-tokening on that side (the file's own words: "One
 * word from Nick re-tokens these") cannot silently strand this file on the
 * old mark.
 */
export function hasFirstLineIndent(line: string): boolean {
  return line.startsWith(LINE_DIRECTIVE.indent);
}

/** The indent mark is storage, not prose — Dress applies its OWN
 *  FIRST_LINE_INDENT_PT styling to the paragraph; the literal tab character
 *  is never drawn. Only the leading mark is stripped (once), so a writer's
 *  own literal tab later in the line — unusual, but not this function's
 *  business to judge — survives untouched. */
export function stripFirstLineIndent(line: string): string {
  return hasFirstLineIndent(line) ? line.slice(LINE_DIRECTIVE.indent.length) : line;
}
