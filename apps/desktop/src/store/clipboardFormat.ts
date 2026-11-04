// a copy puts two formats on the clipboard - plain characters for other apps and Wrizo's markup for Wrizo - both from the one reader (markRuns), line by line, so they cannot disagree [clipboardFormat §1]
import { escapeTyped, replaceRange } from './hiddenMarks';
import { closeMark, readEscapes, readLead, readMarks, removeMarkers, stripLine, type MarkRun } from './markRuns';
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
// a run's closing mark: `mark` for emphasis, `]{.font-<slug>}` for a font span
const closeOf = closeMark;

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
    // a font span's face is compared too - a belt, not a catch of its own: a span reopens with its OWN closing mark, which carries its
    // face, and every way a span can fail to re-pair (an old page's bare bracket, nesting) already changes the characters compared
    // (a mutant removing this line survives every check, for that reason)
    const style = /\s/.test(rest[i]) ? '' : [
      ...KINDS.filter((kd) => runs.some((r) => r.kind === kd && i >= r.open + r.mark.length && i < r.close)),
      ...runs.filter((r) => r.kind === 'font' && i >= r.open + r.mark.length && i < r.close).map((r) => `font=${r.face ?? ''}`),
    ].join('+');
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

// write both formats and record the PLAIN text as the writer's own ink, so pasting it back passes the Voice Wall; no text/html is written [clipboardFormat §2]
export function putOnClipboard(dt: DataTransfer, p: CopyPayload): void {
  dt.setData('text/plain', p.plain);
  dt.setData(WRIZO_MIME, writeEnvelope(p));
  recordShadow(p.plain);
}

// the paste half: the Voice Wall runs first; Wrizo's markup is used only when the envelope reads and the markup shows exactly the characters a literal paste would, otherwise the paste is literal [clipboardFormat §3]

const lf = (t: string): string => t.replace(/\r\n?/g, '\n');   // a platform clipboard may carry text/plain with CRLF; the envelope does not
const stripAll = (t: string): string => t.split('\n').map(stripLine).join('\n');

/** The fragment a paste's Wrizo envelope carries, or null when it cannot be trusted: not JSON, not version 1, no text, a plain text that
 *  is not the text/plain pasted beside it (a stale envelope, or another app's text), or markup that does not read as its own plain text. */
export function readEnvelope(raw: string | null | undefined, plain: string): string | null {
  if (!raw) return null;
  let env: unknown;
  try { env = JSON.parse(raw); } catch { return null; }
  if (!env || typeof env !== 'object') return null;
  const { v, text, plain: ep } = env as { v?: unknown; text?: unknown; plain?: unknown };
  if (v !== 1 || typeof text !== 'string' || typeof ep !== 'string') return null;
  if (lf(ep) !== lf(plain)) return null;
  if (stripAll(text) !== lf(ep)) return null;
  return text;
}

/** The fragment as it can stand at `at`: its first line's structure tokens only where a line's text begins (Q2 - a `# ` mid-line is no
 *  heading, it would only show), and without the kinds already open around `at` (the run there gives the pasted words that style;
 *  `**a**x**b**` would have shown a pasted bold word plain). Only the first line meets the caret's line. */
function fitFragment(fragment: string, text: string, at: number): string {
  const ls = at <= 0 ? 0 : text.lastIndexOf('\n', at - 1) + 1;
  const prefix = text.slice(ls, at);
  const lines = fragment.split('\n');
  let first = lines[0];
  if (readLead(prefix).length !== prefix.length) first = first.slice(readLead(first).length);
  const le = text.indexOf('\n', at);
  const line = text.slice(ls, le < 0 ? text.length : le);
  const lead = readLead(line).length;
  const p = at - ls - lead;
  if (p >= 0) {
    const kinds = new Set(readMarks(line.slice(lead)).filter((r) => p >= r.open + r.mark.length && p <= r.close).map((r) => r.kind));
    if (kinds.size) {
      const fl = readLead(first).length;
      const rest = first.slice(fl);
      first = first.slice(0, fl) + removeMarkers(rest, readMarks(rest).filter((r) => kinds.has(r.kind)));
    }
  }
  lines[0] = first;
  return lines.join('\n');
}

/** A paste of `plain` over [s, e) of `text`: the trusted `fragment` as markup when it reads, where it lands, as exactly the characters the
 *  literal paste would show; otherwise the literal paste (typed-literal: escaped). */
export function pasteEdit(text: string, s: number, e: number, fragment: string | null, plain: string): { text: string; caret: number; formatted: boolean } {
  const L = replaceRange(text, s, e, escapeTyped(lf(plain), text, s));
  if (fragment !== null) {
    const F = replaceRange(text, s, e, fitFragment(fragment, text, s));
    if (stripAll(F.text) === stripAll(L.text)) return { text: F.text, caret: F.caret, formatted: true };
  }
  return { text: L.text, caret: L.caret, formatted: false };
}
