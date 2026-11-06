import type { ScriptEl, ScriptElType } from '../types';
import { widthChFor, spaceBeforeFor } from './scriptMetrics';

// lineLedger: a pure function from a screenplay to the lines it occupies, from scriptMetrics' declared constants (never runtime `ch`), returning a structure the paginator needs, not a count [scriptLedger §1]

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

// lines one element occupies at a measure: a word longer than the measure hard-breaks (the CSS overflow-wrap matches); hard breaks start lines; trailing whitespace is ignored for the wrap only [scriptLedger §2]
export function wrappedLines(text: string, widthCh: number): number {
  return Math.max(1, wrapToLines(text, widthCh).length);
}

// the same wrap, as the lines themselves: wrappedLines is its length, so count and cut cannot disagree; the lines concatenate back to the input exactly [scriptLedger §3]
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
  const s = segment.replace(/\s+$/, '');          // trailing space hangs [scriptLedger §4]
  if (s === '') return [segment];                  // an empty line is a line [scriptLedger §5]
  const starts = [0];                              // character index each line begins at
  let col = 0;
  let pos = 0;
  for (const token of s.match(/\S+|\s+/g) ?? []) {
    if (token[0] === ' ' || token[0] === '\t') { col += token.length; pos += token.length; continue; }
    let w = token.length;
    let at = pos;
    if (w > width) {                               // longer than the measure [scriptLedger §6]
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

// one LedgerEntry per element, in document order; pure and synchronous [scriptLedger §7]
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
