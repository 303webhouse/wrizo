import type { ScriptEl, ScriptElType } from '../types';
import { WIDTH_CH, SPACE_BEFORE } from './scriptMetrics';

// SC2 S1 — THE LINE LEDGER. A pure, synchronous function from a screenplay
// document to the lines it occupies. No DOM, no font, no measurement: the
// arithmetic is the truth and the rendering is the thing checked against it
// (sc2.mjs does the checking). That direction matters — a ledger that measured
// the render could never catch the render being wrong.
//
// WHY IT CONSUMES DECLARED CONSTANTS AND NOT `ch` UNITS. A `ch` measured at
// runtime resolves against whatever font is loaded; taken a frame before
// Courier Prime arrives it silently computes against a fallback advance, and
// the arithmetic is wrong while looking pure. Every measure here comes from
// scriptMetrics.ts — the same module the renderer uses — so there is one source
// of truth for geometry and no re-derivation anywhere.
//
// WHY IT RETURNS A STRUCTURE AND NOT A COUNT (Fable, 2026-07-25). A scalar
// total is enough to paginate naively and not enough to paginate correctly: the
// paginator has to refuse a scene heading orphaned at a page foot, keep a
// character cue with its first line of dialogue, and — in SC2.1 — split
// dialogue with (MORE)/(CONT'D). All of that needs element identity, so the
// ledger reports per element and the paginator consumes it.
//
// PURITY IS POSITION-INDEPENDENCE. `spaceBefore` is reported for EVERY element
// including the first, because it is an INTRINSIC property of the element type,
// not of where the element happens to sit. The rule "the first element of a
// page contributes zero space" belongs to the CONSUMER: the renderer suppresses
// at document start (index.css, `.script-sheet > *:first-child`), and S2's
// paginator will suppress at every page top. Baking that into the ledger would
// make it position-dependent, and then the same element would ledger
// differently depending on where a page break happened to land — which is
// exactly the circularity a paginator cannot resolve.

export interface LedgerEntry {
  id: string;
  t: ScriptElType;
  /** Wrapped line count for this element's own text. Never less than 1. */
  lines: number;
  /**
   * Blank lines this element's TYPE calls for above it — intrinsic, never
   * suppressed here. The consumer zeroes it at a page top.
   */
  spaceBefore: number;
  /**
   * May the paginator split this element across a page boundary? In SC2 only
   * an action block may, and only because an action longer than a full page
   * cannot move whole. Everything else moves entire; dialogue splitting waits
   * for SC2.1's (MORE)/(CONT'D), and until then page counts run slightly long
   * against Final Draft — a named approximation, never a silent one.
   */
  mayBreak: boolean;
}

/**
 * Lines occupied by one element's text at a given measure, in characters.
 *
 * The four edge rulings (Fable, 2026-07-25), each chosen rather than
 * discovered:
 *
 * 1. A WORD LONGER THAN ITS MEASURE hard-breaks at the measure. A 70-character
 *    URL in an action line occupies ceil(70/60) lines; it may not claim one
 *    line and overflow silently, or the paginator would place a break the
 *    render contradicts. `.script-el` carries `overflow-wrap:anywhere` so the
 *    CSS breaks the same way — asserted in sc2.mjs, not assumed.
 * 2. HARD BREAKS inside an element each start a new wrapped line, and an empty
 *    segment still costs one. The typed shape is the writer's; the ledger
 *    counts what is there.
 * 3. TRAILING WHITESPACE is stripped for the wrap calculation only, never from
 *    storage — a stray space at column 60 must not cost a line the writer
 *    cannot see. This matches `white-space:pre-wrap`, which `.script-el` ships
 *    and sc2.mjs asserts: under pre-wrap trailing spaces hang at a soft wrap
 *    opportunity and never cause a break. (Under plain `pre` nothing would wrap
 *    at all and this whole function would change shape — hence the assertion.)
 * 4. AN EMPTY ELEMENT is one line, matching the `min-height:1em` that
 *    `.script-el` already ships, so arithmetic and render agree by
 *    construction rather than by coincidence.
 *
 * Internal runs of spaces are PRESERVED, not collapsed — `pre-wrap` keeps them
 * — so they count toward the column. They do not themselves force a break: a
 * space run sitting at the measure hangs rather than wrapping.
 */
export function wrappedLines(text: string, widthCh: number): number {
  if (widthCh <= 0) return 1;
  let total = 0;
  for (const segment of text.split('\n')) total += wrapSegment(segment, widthCh);
  return Math.max(1, total);
}

function wrapSegment(segment: string, width: number): number {
  const s = segment.replace(/\s+$/, '');          // ruling 3 — trailing space hangs
  if (s === '') return 1;                          // ruling 2/4 — an empty line is a line
  let lines = 1;
  let col = 0;
  for (const token of s.match(/\S+|\s+/g) ?? []) {
    if (token[0] === ' ' || token[0] === '\t') { col += token.length; continue; }
    let w = token.length;
    if (w > width) {                               // ruling 1 — longer than the measure
      if (col > 0) { lines++; col = 0; }           // it starts on a fresh line...
      while (w > width) { lines++; w -= width; }   // ...then breaks at the measure
      col = w;
    } else if (col + w > width) {
      lines++; col = w;                            // ordinary soft wrap at a space
    } else {
      col += w;
    }
  }
  return lines;
}

/**
 * The ledger: one entry per element, in document order. Pure and synchronous —
 * no browser required, so it is testable without one.
 */
export function lineLedger(elements: ScriptEl[]): LedgerEntry[] {
  return elements.map((el) => ({
    id: el.id,
    t: el.t,
    lines: wrappedLines(el.text, WIDTH_CH[el.t]),
    spaceBefore: SPACE_BEFORE[el.t],
    mayBreak: el.t === 'action',
  }));
}

/**
 * Total lines a ledger occupies, with the consumer's suppression rule applied:
 * the FIRST entry contributes no space above it. This is the document-start
 * case; S2's paginator applies the identical rule at every page top.
 */
export function totalLines(ledger: LedgerEntry[]): number {
  return ledger.reduce((n, e, i) => n + e.lines + (i === 0 ? 0 : e.spaceBefore), 0);
}
