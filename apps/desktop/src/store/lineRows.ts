// TYPING-LATENCY STEPS 2-4 (Fable, approved 2026-10-13; row shape F ruled 2026-10-14): THE PAGE'S ROWS AND ITS SHADOW LINES.
//
// THE ROWS. The page's free-edit surface (Draft, Revise) was ONE pre-wrap block holding every line, so a single typed character
// made the browser lay out, and the editor re-decorate, the whole page - at 50k words a keystroke cost about a second. Each logical
// line is now its own row: `<span class="wz-row">` (an INLINE-BLOCK, width 100%, `contain: layout style` - index.css), with the
// '\n' that separates two lines left BETWEEN the rows as a bare text node, exactly where today's text had it. That is the shape
// variant F measured (docs/evidence/latency-profile-eb27ea7c): textContent, innerText and the text a writer copies out are all
// byte-identical to the one-block page, so every reader of the editor - the product's and the 88 harness files' - reads the same
// characters it always did. (E's display:block rows were the other candidate: the innerText rules put a line break at every block
// boundary, so a writer's copied text would have gained a blank line per paragraph.) The EOF guard (draftDecoration.ts) is kept as
// the editor's last child, as before.
//
// THE SHADOW LINES. `lines` mirrors the page's text, one string per row; `starts` holds each line's offset. A keystroke reads ONLY
// the rows its edit touched (the selection's lines, captured at beforeinput), and a caret offset is the edited row's own local walk
// plus that row's start - no pass from the top of the page. The shadow is a CACHE, never what gets saved: what is saved is still the
// text the editor reports through onChange, and a reader that cannot trust the map (an IME composition in flight, or the moment
// between a native edit and the re-render that follows it) falls back to today's whole-page walk, which is correct for any DOM.
// Harnesses set `window.__wzVerifyRows`: every render then compares the shadow with the DOM, logs `WZ-ROWS-MISMATCH` on any
// difference, and RESYNCS from the DOM, so typing carries on and the run reports it.
//
// THE BOARD CARD keeps today's single-block path: a card is small, and nothing here is attached to it.
import { decorateLineForCard, EOF_GUARD, readEditorPlainText } from './draftDecoration';

export interface Rows {
  el: HTMLElement;
  lines: string[];
  starts: number[];
  /** One element per line; null for a row a native edit made dirty (its DOM is the browser's until the next writeRows). */
  rows: (HTMLElement | null)[];
  text: string;
  /** The line whose row was last decorated with a caret (a revealable lead token shows while the caret touches it), or -1. */
  revealLine: number;
  /** Rows a native edit mutated and the map no longer describes: [a, b] inclusive, in CURRENT line indices, or null. */
  dirty: { a: number; b: number } | null;
  /** True while the DOM may differ from the rows map (composition, or a native edit not yet re-rendered): fast paths stand down. */
  stale: boolean;
  /** The selection's lines when the pending native edit began (beforeinput / compositionstart). */
  hint: { a: number; b: number } | null;
}

// What was last WRITTEN into each row, compared instead of the row's innerHTML: the browser's serialisation of our string is not
// guaranteed to be byte-identical to it (draftDecoration.ts's lastDecorated, for the same reason), and a false 'changed' would
// rewrite the caret's row on every caret move.
const written = new WeakMap<HTMLElement, string>();
const writeRow = (row: HTMLElement, html: string) => { if (written.get(row) !== html) { row.innerHTML = html; written.set(row, html); return true; } return false; };

const ROWS = new WeakMap<HTMLElement, Rows>();
const GUARD_HTML = `<span class="md-eof-guard" aria-hidden="true">${EOF_GUARD}</span>`;

/** The rows attached to `el`, if this editor uses them. */
export function rowsFor(el: HTMLElement): Rows | undefined { return ROWS.get(el); }
/** The rows, only when the map can be trusted right now. */
function liveRows(el: HTMLElement): Rows | undefined { const R = ROWS.get(el); return R && !R.stale ? R : undefined; }

function recomputeStarts(R: Rows, from = 0): void {
  const { lines, starts } = R;
  starts.length = lines.length;
  let p = from === 0 ? 0 : starts[from - 1] + lines[from - 1].length + 1;
  for (let i = from; i < lines.length; i++) { starts[i] = p; p += lines[i].length + 1; }
}

/** The line holding plain offset `p` (a line's END belongs to it; the next line starts one past its '\n'). */
export function lineOf(R: Rows, p: number): number {
  const { starts } = R;
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= p) lo = mid; else hi = mid - 1; }
  return lo;
}

const rowHtml = (line: string, local: number | null) => decorateLineForCard(line, local);
const rowSpan = (html: string) => `<span class="wz-row">${html}</span>`;
const localCaret = (R: Rows, i: number, caret: number | null) => {
  if (caret === null) return null;
  const l = caret - R.starts[i];
  return l >= 0 && l <= R.lines[i].length ? l : null;
};

/** Render the whole page as rows (mount, and the recovery path). The caret is placed by the caller. */
export function mountRows(el: HTMLElement, text: string, caret: number | null): Rows {
  const lines = text.split('\n');
  const R: Rows = { el, lines, starts: [], rows: [], text, revealLine: -1, dirty: null, stale: false, hint: null };
  recomputeStarts(R);
  const at = caret === null ? -1 : lineOf(R, caret);
  el.innerHTML = lines.map((l, i) => rowSpan(rowHtml(l, i === at ? localCaret(R, i, caret) : null))).join('\n') + (text.endsWith('\n') ? GUARD_HTML : '');
  R.rows = [...el.children].filter((c) => c.classList.contains('wz-row')) as HTMLElement[];
  R.rows.forEach((row, i) => written.set(row!, rowHtml(lines[i], i === at ? localCaret(R, i, caret) : null)));
  R.revealLine = at;
  ROWS.set(el, R);
  verifyRows(R);
  return R;
}

export function detachRows(el: HTMLElement): void { ROWS.delete(el); }

// Replace OLD lines [a, b] (inclusive) with `mid`, in the model and the DOM. Everything strictly between row a-1 and row b+1 is
// removed and rebuilt (the separators on both sides included), so whatever a native edit left there - a character typed into a
// separator, a merged text node - is gone.
function replaceRegion(R: Rows, a: number, b: number, mid: string[], caret: number | null): void {
  const { el } = R;
  const L = R.lines.length;
  const prev = a > 0 ? R.rows[a - 1] : null;
  const next = b < L - 1 ? R.rows[b + 1] : null;
  R.lines.splice(a, b - a + 1, ...mid);
  recomputeStarts(R, a);
  const lastLine = R.lines.length - 1;
  const inner = mid.map((l, k) => rowHtml(l, localCaret(R, a + k, caret)));
  const html = (prev ? '\n' : '')
    + inner.map(rowSpan).join('\n')
    + (next ? '\n' : (lastLine > 0 && R.lines[lastLine] === '' ? GUARD_HTML : ''));   // the guard: a text ENDING IN A NEWLINE only
  const range = document.createRange();
  if (prev) range.setStartAfter(prev); else range.setStart(el, 0);
  if (next) range.setEndBefore(next); else range.setEnd(el, el.childNodes.length);
  range.deleteContents();
  const frag = range.createContextualFragment(html);
  const fresh = [...frag.children].filter((c) => c.classList.contains('wz-row')) as HTMLElement[];
  range.insertNode(frag);
  fresh.forEach((row, k) => written.set(row, inner[k]));
  R.rows.splice(a, b - a + 1, ...fresh);
}

/** Make the page show `text` with the caret at `caret` (plain offsets): only the lines that changed, the rows a native edit left
 *  dirty, and the rows whose caret reveal moves are rewritten. `revealAt` is the offset that decides the reveal (null: none, as for
 *  a selection the formatter leaves on its result). Returns false when no rows are attached (the caller takes today's path). */
export function writeRows(el: HTMLElement, text: string, caret: number | null, revealAt: number | null = caret): boolean {
  const R = ROWS.get(el);
  if (!R) return false;
  const old = R.text;
  const oldL = R.lines.length;
  // the changed lines, in OLD indices: a common prefix of whole lines, then a common suffix of whole lines (positions shifted by the
  // length change), without splitting the unchanged rest of the page
  let a = 0;
  while (a < oldL - 1 && text.startsWith(R.lines[a], R.starts[a]) && text.charCodeAt(R.starts[a] + R.lines[a].length) === 10) a++;
  const delta = text.length - old.length;
  let b = oldL - 1;
  const prefixEnd = R.starts[a];   // where line a starts, in both texts
  while (b > a) {
    const s = R.starts[b] + delta;
    const len = R.lines[b].length;
    if (s - 1 < prefixEnd) break;
    if (text.charCodeAt(s - 1) !== 10 || !text.startsWith(R.lines[b], s) || (b === oldL - 1 ? s + len !== text.length : text.charCodeAt(s + len) !== 10)) break;
    b--;
  }
  const unchanged = text === old;
  // the rows a native edit left dirty must be rewritten even when the text matches them
  if (R.dirty) { if (unchanged) { a = R.dirty.a; b = R.dirty.b; } else { a = Math.min(a, R.dirty.a); b = Math.max(b, R.dirty.b); } }
  if (!unchanged || R.dirty) {
    const midStart = R.starts[a];
    const midEnd = b + 1 < oldL ? R.starts[b + 1] + delta - 1 : text.length;
    R.text = text;
    const mid = text.slice(midStart, midEnd).split('\n');
    if (R.revealLine > b) R.revealLine += mid.length - (b - a + 1);
    else if (R.revealLine >= a) R.revealLine = -1;
    replaceRegion(R, a, b, mid, revealAt);
  }
  R.text = text;
  R.dirty = null;
  R.stale = false;
  // the reveal: the row that carried the caret before, and the row that carries it now, if either row's decoration would change
  const at = revealAt === null ? -1 : lineOf(R, revealAt);
  for (const i of new Set([R.revealLine, at])) {
    if (i < 0 || i >= R.lines.length) continue;
    const row = R.rows[i];
    if (row) writeRow(row, rowHtml(R.lines[i], i === at ? localCaret(R, i, revealAt) : null));
  }
  R.revealLine = at;
  if (caret !== null) placeRowsCaret(R, caret);
  verifyRows(R);
  return true;
}

/** REVEAL-ON-CLICK for rows: re-decorate only the row the caret left and the row it entered, when their decoration changes. */
export function revealRowsAtCaret(el: HTMLElement): boolean {
  const R = liveRows(el);
  if (!R) return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed || !sel.anchorNode || !el.contains(sel.anchorNode)) return false;
  const raw = rowsOffsetOf(R, sel.anchorNode, sel.anchorOffset);
  if (raw === null) return false;
  const caret = Math.min(raw, R.text.length);
  const at = lineOf(R, caret);
  let changed = false;
  for (const i of new Set([R.revealLine, at])) {
    if (i < 0 || i >= R.lines.length) continue;
    const row = R.rows[i];
    if (row && writeRow(row, rowHtml(R.lines[i], i === at ? localCaret(R, i, caret) : null))) changed = true;
  }
  R.revealLine = at;
  if (changed) placeRowsCaret(R, caret);
  return changed;
}

// ---- DOM point <-> plain offset, from the edited row ----------------------------------------------------------------------------

/** The RAW offset (the EOF guard counted, as getCaretOffset always has) of a DOM point inside `el`, or null if it is not inside. */
export function rowsOffsetOf(R: Rows, node: Node, offset: number): number | null {
  const { el } = R;
  if (node === el) {
    const child = el.childNodes[offset] ?? null;
    return child === null ? R.text.length : offsetBeforeTop(R, child);
  }
  let top: Node = node;
  while (top.parentNode !== el) { if (!top.parentNode) return null; top = top.parentNode; }
  const base = offsetBeforeTop(R, top);
  if (base === null) return null;
  if (top === node) return base + (node.nodeType === 3 ? offset : 0);
  const r = document.createRange();
  r.setStart(top, 0);
  r.setEnd(node, offset);
  return base + r.toString().length;
}

// the offset at which a top-level child of the editor begins
function offsetBeforeTop(R: Rows, top: Node): number | null {
  if (top.nodeType === 1) {
    const elt = top as HTMLElement;
    if (elt.classList.contains('md-eof-guard')) return R.text.length;
    const i = R.rows.indexOf(elt);
    if (i >= 0) return R.starts[i];
  }
  // a separator (or anything else at top level): it begins where the row before it ends
  let p: Node | null = top.previousSibling;
  while (p && !(p.nodeType === 1 && (p as HTMLElement).classList.contains('wz-row'))) p = p.previousSibling;
  if (!p) return 0;
  const i = R.rows.indexOf(p as HTMLElement);
  return i >= 0 ? R.starts[i] + R.lines[i].length : null;
}

const inHidden = (n: Node) => !!(n.parentElement && n.parentElement.closest('.md-mark-hidden'));

/** The DOM position for plain offset `target`: inside its row, preferring a visible text position (a caret drawn inside a collapsed
 *  mark is zero-height), then the separator before the row (a line start), then a hidden one. Past the end of a page that ends in a
 *  newline, the caret lives after the EOF guard, as it always has. */
export function rowsPointFor(R: Rows, target: number): { node: Node; offset: number } | null {
  const { el } = R;
  const t = Math.max(0, Math.min(target, R.text.length));
  if (t === R.text.length && R.text.endsWith('\n')) {
    const g = el.lastElementChild;
    const gt = g && g.classList.contains('md-eof-guard') ? (g.firstChild as Text | null) : null;
    if (gt) return { node: gt, offset: gt.data.length };
  }
  const i = lineOf(R, t);
  const local = t - R.starts[i];
  const row = R.rows[i];
  if (!row) return null;
  const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
  const cands: { node: Text; offset: number }[] = [];
  let acc = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const tx = n as Text;
    const len = tx.data.length;
    if (local >= acc && local <= acc + len) cands.push({ node: tx, offset: local - acc });
    if (acc > local) break;
    acc += len;
  }
  const visible = cands.find((c) => !inHidden(c.node));
  if (visible) return visible;
  if (local === 0) {
    const sepBefore = row.previousSibling;
    if (sepBefore && sepBefore.nodeType === 3) return { node: sepBefore, offset: (sepBefore as Text).data.length };
    const sepAfter = row.nextSibling;
    if (cands.length === 0 && sepAfter && sepAfter.nodeType === 3) return { node: sepAfter, offset: 0 };
  }
  if (cands.length) return cands[0];
  return { node: el, offset: Array.prototype.indexOf.call(el.childNodes, row) };   // the empty page: before its one empty row
}

function placeRowsCaret(R: Rows, caret: number): void {
  const pt = rowsPointFor(R, caret);
  const sel = window.getSelection();
  if (!pt || !sel) return;
  if (sel.rangeCount && sel.isCollapsed && sel.anchorNode === pt.node && sel.anchorOffset === pt.offset) return;
  sel.setBaseAndExtent(pt.node, pt.offset, pt.node, pt.offset);
}

// ---- the fast paths the shared helpers take (store/caretOffset.ts, store/hiddenMarksDom.ts) -------------------------------------

/** The selection start as a RAW offset (getCaretOffset's contract), or undefined when rows cannot answer (the caller walks). */
export function rowsCaretOffset(el: HTMLElement): number | null | undefined {
  const R = liveRows(el);
  if (!R) return undefined;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.startContainer)) return null;
  return rowsOffsetOf(R, r.startContainer, r.startOffset);
}

/** Both ends of the selection as RAW offsets (getSelectionOffsets' contract), or undefined when rows cannot answer. */
export function rowsSelectionOffsets(el: HTMLElement): { start: number; end: number } | null | undefined {
  const R = liveRows(el);
  if (!R) return undefined;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.startContainer) || !el.contains(r.endContainer)) return null;
  const start = rowsOffsetOf(R, r.startContainer, r.startOffset);
  const end = rowsOffsetOf(R, r.endContainer, r.endOffset);
  return start === null || end === null ? null : { start, end };
}

/** Anchor and focus as PLAIN offsets (selectionEnds' contract), or undefined when rows cannot answer. */
export function rowsSelectionEnds(el: HTMLElement): { anchor: number; focus: number; collapsed: boolean } | null | undefined {
  const R = liveRows(el);
  if (!R) return undefined;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.anchorNode || !sel.focusNode) return null;
  if (!el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) return null;
  const a = rowsOffsetOf(R, sel.anchorNode, sel.anchorOffset);
  const f = rowsOffsetOf(R, sel.focusNode, sel.focusOffset);
  if (a === null || f === null) return null;
  const max = R.text.length;
  return { anchor: Math.min(a, max), focus: Math.min(f, max), collapsed: sel.isCollapsed };
}

/** A DOM point for a plain offset (domPointFor / resolveOffset), or undefined when rows cannot answer. */
export function rowsDomPoint(el: HTMLElement, target: number): { node: Node; offset: number } | null | undefined {
  const R = liveRows(el);
  if (!R) return undefined;
  return rowsPointFor(R, target);
}

/** The editor's plain text: the shadow when it can be trusted, else today's read (the EOF guard removed either way). */
export function editorPlainText(el: HTMLElement): string {
  const R = liveRows(el);
  if (R) return R.text;
  return readEditorPlainText(el.innerText, null).plain;
}

// ---- reading a native edit ----------------------------------------------------------------------------------------------------

/** beforeinput / compositionstart: remember the lines the coming native edit can touch. */
export function noteNativeEdit(el: HTMLElement): void {
  const R = ROWS.get(el);
  if (!R) return;
  if (R.stale) return;   // an edit not yet re-rendered (a composition's inputs) keeps the hint it began with
  const o = rowsSelectionOffsets(el);
  if (!o) { R.hint = null; return; }
  const lo = Math.min(o.start, o.end, R.text.length), hi = Math.min(Math.max(o.start, o.end), R.text.length);
  R.hint = { a: lineOf(R, lo), b: lineOf(R, hi) };
}

/** After a native edit (input, compositionend): the page's plain text and the caret, read from the rows the edit touched only. The
 *  shadow takes the new text at once; the touched rows are marked dirty and the map stale until the next writeRows. Falls back to
 *  a read of the whole page whenever the touched region cannot be bounded. Returns null when no rows are attached. */
export function readNativeEdit(el: HTMLElement, opts: { keepHint?: boolean } = {}): { plain: string; caret: number | null } | null {
  const R = ROWS.get(el);
  if (!R) return null;
  const sel = window.getSelection();
  const caretPt = sel && sel.rangeCount && el.contains(sel.getRangeAt(0).startContainer) ? sel.getRangeAt(0) : null;
  const L = R.lines.length;
  const h = R.hint;
  if (!opts.keepHint) R.hint = null;
  let ok = false;
  let plain = '';
  let caret: number | null = null;
  if (h) {
    const a = h.a, b = h.b;
    const prev = a > 0 ? R.rows[a - 1] : null;
    const next = b < L - 1 ? R.rows[b + 1] : null;
    if ((!prev || prev.parentNode === el) && (!next || next.parentNode === el)) {
      const range = document.createRange();
      if (prev) range.setStartAfter(prev); else range.setStart(el, 0);
      if (next) range.setEndBefore(next); else range.setEnd(el, el.childNodes.length);
      let region = range.toString();
      if (!next) region = region.split(EOF_GUARD).join('');
      const lead = prev ? region.charCodeAt(0) === 10 : true;
      const tail = next ? region.charCodeAt(region.length - 1) === 10 : true;
      if (lead && tail) {
        const body = region.slice(prev ? 1 : 0, next ? region.length - 1 : region.length);
        const mid = body.split('\n');
        const base = prev ? R.starts[a] - 1 : 0;      // where the region's text begins (its leading separator, when it has one)
        if (caretPt && range.comparePoint(caretPt.startContainer, caretPt.startOffset) === 0) {
          const pre = document.createRange();
          pre.setStart(range.startContainer, range.startOffset);
          pre.setEnd(caretPt.startContainer, caretPt.startOffset);
          caret = base + pre.toString().split(EOF_GUARD).join('').length;
        }
        R.lines.splice(a, b - a + 1, ...mid);
        R.rows.splice(a, b - a + 1, ...mid.map(() => null));
        recomputeStarts(R, a);
        R.text = R.lines.join('\n');
        // a dirty range already pending (the inputs of one composition) is widened, never forgotten
        const d = R.dirty;
        R.dirty = d ? { a: Math.min(a, d.a), b: Math.min(R.lines.length - 1, Math.max(a + mid.length - 1, d.b > b ? d.b + mid.length - (b - a + 1) : d.b)) } : { a, b: a + mid.length - 1 };
        if (opts.keepHint) R.hint = { a, b: a + mid.length - 1 };
        plain = R.text;
        ok = caret !== null || !caretPt;
      }
    }
  }
  if (!ok) {
    // the whole page: today's read, from the DOM (no layout, unlike innerText), and the caret by today's whole walk
    plain = readEditorPlainText(el.textContent ?? '', null).plain;
    R.lines = plain.split('\n');
    R.rows = R.lines.map(() => null);
    recomputeStarts(R);
    R.text = plain;
    R.dirty = { a: 0, b: R.lines.length - 1 };
    if (opts.keepHint) R.hint = null;
    caret = null;
    if (caretPt) {
      const pre = document.createRange();
      pre.selectNodeContents(el);
      pre.setEnd(caretPt.startContainer, caretPt.startOffset);
      caret = Math.min(pre.toString().split(EOF_GUARD).join('').length, plain.length);
    }
  }
  R.stale = true;
  return { plain, caret };
}

// ---- the shadow-vs-DOM check (harness mode) ------------------------------------------------------------------------------------

declare global { interface Window { __wzVerifyRows?: boolean; __wzRowsChecks?: number; __wzRowsMismatches?: string[] } }

/** Harness mode only (`window.__wzVerifyRows`): the shadow must equal the DOM's own text, row by row. A mismatch is logged
 *  (`WZ-ROWS-MISMATCH`, counted on window.__wzRowsMismatches) and the shadow RESYNCS from the DOM, so typing carries on. */
export function verifyRows(R: Rows): void {
  if (typeof window === 'undefined' || !window.__wzVerifyRows) return;
  window.__wzRowsChecks = (window.__wzRowsChecks ?? 0) + 1;
  const dom = readEditorPlainText(R.el.textContent ?? '', null).plain;
  let why = '';
  if (dom !== R.text) why = 'text';
  else if (R.rows.length !== R.lines.length) why = `rows ${R.rows.length} vs lines ${R.lines.length}`;
  else for (let i = 0; i < R.rows.length; i++) {
    const row = R.rows[i];
    if (!row || row.parentNode !== R.el) { why = `row ${i} missing or detached`; break; }
    if (row.textContent !== R.lines[i]) { why = `row ${i} text`; break; }
  }
  if (!why) return;
  const msg = `WZ-ROWS-MISMATCH ${why} (shadow ${R.text.length} chars, dom ${dom.length})`;
  (window.__wzRowsMismatches ??= []).push(msg);
  console.error(msg);
  const sel = window.getSelection();
  let caret: number | null = null;
  if (sel && sel.rangeCount && R.el.contains(sel.getRangeAt(0).startContainer)) {
    const pre = document.createRange(); pre.selectNodeContents(R.el); pre.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
    caret = Math.min(pre.toString().split(EOF_GUARD).join('').length, dom.length);
  }
  const fresh = mountRows(R.el, dom, caret);
  if (caret !== null) placeRowsCaret(fresh, caret);
}
