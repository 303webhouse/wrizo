import type { ScriptEl, ScriptElType } from '../types';
import { widthChFor, spaceBeforeFor } from './scriptMetrics';

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
  return Math.max(1, wrapToLines(text, widthCh).length);
}

/**
 * The SAME wrap, reported as the lines themselves rather than as a count.
 *
 * SC2 S2b needs this because the paginator's one permitted split — an action
 * block longer than a whole page — has to RENDER as two blocks carrying two
 * halves of the writer's text, and the halves must fall exactly where the
 * arithmetic said the break was. Counting and slicing therefore cannot be two
 * implementations: `wrappedLines` is now defined as the length of this, so
 * there is one wrap algorithm and it is impossible for the count and the cut to
 * disagree. (Before S2b there was only a count, and a second slicing routine
 * would have been the obvious way to add the cut — and the obvious way to end
 * up with a break the render contradicts.)
 *
 * THE LINES CONCATENATE BACK TO THE INPUT EXACTLY: `wrapToLines(t, w).join('')
 * === t`, for every t and every w. Not approximately, not modulo whitespace —
 * exactly. That is a deliberate contract and it is what the renderer's split
 * rests on: a part's text is then a genuine SUBSTRING of the writer's own, and
 * re-wrapping it at the same measure reproduces the same lines (greedy wrapping
 * from a line start is memoryless). So a split renders identically to no split,
 * and no character is added or lost.
 *
 * The first cut of this returned line CONTENTS and the renderer joined them with
 * '\n'. It rendered correctly and it was wrong: it put 58 newlines the writer
 * never typed into a 60-line block's DOM text, and it dropped the trailing
 * spaces `pre-wrap` deliberately hangs. Neither was visible — sc2.mjs's
 * concatenation check is what found it. Hence break POSITIONS computed on the
 * right-trimmed text (ruling 3: trailing space must not cost a line) and slices
 * taken from the ORIGINAL, with the writer's own newlines put back where they
 * were.
 */
export function wrapToLines(text: string, widthCh: number): string[] {
  if (!(widthCh > 0)) return [text];
  const segments = text.split('\n');
  const out: string[] = [];
  segments.forEach((segment, s) => {
    const lines = wrapSegmentLines(segment, widthCh);
    // The '\n' `split` consumed rides back on the line it ended — the writer's
    // own hard break, kept as theirs rather than reinvented as a soft one.
    if (s + 1 < segments.length) lines[lines.length - 1] += '\n';
    out.push(...lines);
  });
  return out.length ? out : [''];
}

function wrapSegmentLines(segment: string, width: number): string[] {
  const s = segment.replace(/\s+$/, '');          // ruling 3 — trailing space hangs
  if (s === '') return [segment];                  // ruling 2/4 — an empty line is a line
  const starts = [0];                              // character index each line begins at
  let col = 0;
  let pos = 0;
  for (const token of s.match(/\S+|\s+/g) ?? []) {
    if (token[0] === ' ' || token[0] === '\t') { col += token.length; pos += token.length; continue; }
    let w = token.length;
    let at = pos;
    if (w > width) {                               // ruling 1 — longer than the measure
      if (col > 0) { starts.push(at); col = 0; }   // it starts on a fresh line...
      while (w > width) { at += width; starts.push(at); w -= width; }   // ...then breaks at the measure
      col = w;
    } else if (col + w > width) {
      starts.push(pos); col = w;                   // ordinary soft wrap at a space
    } else {
      col += w;
    }
    pos += token.length;
  }
  // Sliced from the ORIGINAL segment, so the last line carries the trailing
  // whitespace the wrap calculation ignored and the concatenation is exact.
  return starts.map((from, i) => segment.slice(from, i + 1 < starts.length ? starts[i + 1] : segment.length));
}

/**
 * The ledger: one entry per element, in document order. Pure and synchronous —
 * no browser required, so it is testable without one.
 */
export function lineLedger(elements: ScriptEl[]): LedgerEntry[] {
  return elements.map((el) => ({
    id: el.id,
    t: el.t,
    // SC2 S2b — through the TOTAL lookups (scriptMetrics.ts). A doc carrying an
    // element type this build has no row for used to produce `undefined` here,
    // and `undefined` in the paginator's arithmetic is NaN, which paginates
    // every element onto a page of its own. Named at the seam, not caught later.
    lines: wrappedLines(el.text, widthChFor(el.t)),
    spaceBefore: spaceBeforeFor(el.t),
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
