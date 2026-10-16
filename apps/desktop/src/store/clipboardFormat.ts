// IN-APP-COPY-FORMAT, THE COPY HALF (Nick's ruling, Oct 16; docs/in-app-copy-format-plan.md @ f2a9f956). A copy from a writing surface
// puts TWO formats on the clipboard: the PLAIN characters for every other app, and Wrizo's own stored MARKUP for Wrizo (the paste half,
// which reads it back, is its own ticket). A native copy carried the hidden marks and typed-literal's escape backslashes - they are hidden
// with font-size 0, never display:none, so the browser copied them: a typed `*sigh*` reached an email as `\*sigh\*`.
// Both formats come from the ONE reader (store/markRuns.ts), line by line, so they cannot disagree:
//   - plain: each line's visible characters inside the selection - no structure token, no mark, no escape (what Copy My Words reads);
//   - fragment: the selection's stored markup, balanced. A run the selection cuts is closed and reopened at the cut (after a leading
//     space, before a trailing one: a mark beside a space does not pair); an edge never splits a mark or an escape; the first line's
//     structure tokens come only when the selection starts at that line's start (Q2, Fable, Oct 16).
// Every fragment line is checked against its source before it is written: if it would not read back as the same characters with the same
// styles, that line is written as literal text instead (escaped, so it can never become markup). Nothing styled is ever invented.
import { escapeTyped } from './hiddenMarks';
import { readEscapes, readLead, readMarks, type MarkRun } from './markRuns';
import { recordShadow } from './voiceWall';

export const WRIZO_MIME = 'application/x-wrizo-fragment';

export interface CopyPayload {
  /** The plain characters: no marks, no escapes, no structure tokens (what any other app receives). */
  plain: string;
  /** The stored markup of the selection, balanced (what Wrizo receives). */
  fragment: string;
  /** How many lines of the fragment were written as literal text because their markup would not have read back the same. */
  fallbackLines: number;
}

const KINDS = ['bold', 'italic', 'underline', 'strike'] as const;
// a run's closing mark: `mark` for emphasis (a font span's differs once font-span is on this branch - its runs carry `cmark`)
const closeOf = (r: MarkRun): string => (r as MarkRun & { cmark?: string }).cmark ?? r.mark;

/** The visible characters of a line's text after its structure tokens, by position, each with the styles over it (a space's style is not
 *  drawn as a style - a mark cannot open or close beside one - so it is ''). */
function visibleOf(rest: string): Array<{ i: number; ch: string; style: string }> {
  const runs = readMarks(rest);
  const hidden = new Set(readEscapes(rest));
  for (const r of runs) {
    for (let k = 0; k < r.mark.length; k++) hidden.add(r.open + k);
    for (let k = 0; k < closeOf(r).length; k++) hidden.add(r.close + k);
  }
  const out: Array<{ i: number; ch: string; style: string }> = [];
  for (let i = 0; i < rest.length; i++) {
    if (hidden.has(i)) continue;
    const style = /\s/.test(rest[i]) ? '' : KINDS.filter((kd) => runs.some((r) => r.kind === kd && i >= r.open + r.mark.length && i < r.close)).join('+');
    out.push({ i, ch: rest[i], style });
  }
  return out;
}

const signature = (v: Array<{ ch: string; style: string }>): string => v.map((x) => `${x.ch}:${x.style}`).join('|');

/** One line's share of a copy: the selection [a, b) in that line's own positions. */
function linePiece(line: string, a: number, b: number): { plain: string; fragment: string; fellBack: boolean } {
  const leadLen = readLead(line).length;
  const keepLead = a === 0 && (b > leadLen || b === line.length);
  const rest = line.slice(leadLen);
  let ra = Math.max(a, leadLen) - leadLen;
  let rb = Math.max(b, leadLen) - leadLen;
  // an edge never splits an escape: a start between `\` and its character takes the escape whole; an end there leaves it out whole
  for (const x of readEscapes(rest)) {
    if (ra === x + 1) ra = x;
    if (rb === x + 1) rb = x;
  }
  // an edge never splits a mark, and never starts on a closing mark or ends on an opening one (those hold no visible character)
  const runs = readMarks(rest);
  for (let pass = 0, moved = true; moved && pass < 8; pass++) {
    moved = false;
    for (const r of runs) {
      const cs = r.open + r.mark.length;
      const ce = r.close;
      const cl = closeOf(r).length;
      if (ra > r.open && ra < cs) { ra = r.open; moved = true; }
      if (ra >= ce && ra < ce + cl) { ra = ce + cl; moved = true; }
      if (rb > r.open && rb <= cs) { rb = r.open; moved = true; }
      if (rb > ce && rb < ce + cl) { rb = ce + cl; moved = true; }
    }
  }
  const vis = visibleOf(rest);
  const chosen = vis.filter((x) => x.i >= ra && x.i < rb);
  const plain = chosen.map((x) => x.ch).join('');
  const leadText = keepLead ? line.slice(0, leadLen) : '';
  let body = '';
  if (rb > ra) {
    // a run counts as cut only where the selection holds a visible, non-space character of it
    const holds = (r: MarkRun) => chosen.some((x) => x.i >= Math.max(ra, r.open + r.mark.length) && x.i < Math.min(rb, r.close) && !/\s/.test(x.ch));
    const opened = runs.filter((r) => r.open + r.mark.length <= ra && ra < r.close && holds(r))
      .sort((x, y) => x.open - y.open || y.close - x.close);           // reopened outer first
    const closed = runs.filter((r) => r.open + r.mark.length < rb && rb <= r.close && holds(r))
      .sort((x, y) => y.open - x.open || x.close - y.close);           // closed inner first
    const mid = rest.slice(ra, rb);
    const lw = /^[^\S\n]*/.exec(mid)?.[0].length ?? 0;
    const tw = Math.min(/[^\S\n]*$/.exec(mid)?.[0].length ?? 0, mid.length - lw);
    body = mid.slice(0, lw) + opened.map((r) => r.mark).join('') + mid.slice(lw, mid.length - tw) + closed.map(closeOf).join('') + mid.slice(mid.length - tw);
  }
  const fragment = leadText + body;
  // the line reads back as the same characters with the same styles, or it is written as literal text
  const back = visibleOf(fragment.slice(readLead(fragment).length));
  if (readLead(fragment).length === leadText.length && signature(back) === signature(chosen)) return { plain, fragment, fellBack: false };
  return { plain, fragment: leadText + escapeTyped(plain, leadText, leadText.length), fellBack: true };
}

/** The two formats of a copy of [s, e) of the stored text. */
export function copyPayload(text: string, s: number, e: number): CopyPayload {
  const lo = Math.max(0, Math.min(s, e));
  const hi = Math.min(text.length, Math.max(s, e));
  const plains: string[] = [];
  const frags: string[] = [];
  let fallbackLines = 0;
  let ls = 0;
  for (const line of text.split('\n')) {
    const le = ls + line.length;
    if (le >= lo && ls <= hi) {
      const p = linePiece(line, Math.max(lo, ls) - ls, Math.min(hi, le) - ls);
      plains.push(p.plain);
      frags.push(p.fragment);
      if (p.fellBack) fallbackLines++;
    }
    ls = le + 1;
  }
  return { plain: plains.join('\n'), fragment: frags.join('\n'), fallbackLines };
}

/** The Wrizo envelope written under WRIZO_MIME: the fragment, with the plain text it was copied beside. */
export function writeEnvelope(p: CopyPayload): string {
  return JSON.stringify({ v: 1, text: p.fragment, plain: p.plain });
}

/** Write a copy's two formats into a copy or cut event's clipboard (the caller prevents the native copy), and record the plain text as the
 *  writer's own ink: the Voice Wall's capture-phase observer has already recorded the DOM selection, hidden marks and all, and a paste
 *  carries the plain text - so the shadow must be the plain text, or pasting your own words back would be blocked. No text/html is written:
 *  other apps get the plain characters (the ruling). */
export function putOnClipboard(dt: DataTransfer, p: CopyPayload): void {
  dt.setData('text/plain', p.plain);
  dt.setData(WRIZO_MIME, writeEnvelope(p));
  recordShadow(p.plain);
}
