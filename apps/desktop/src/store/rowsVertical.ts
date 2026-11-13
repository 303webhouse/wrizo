import { rowsFor } from './lineRows';
import { revealCaret } from './caretInView';

// THE PAGE'S ROWS AND THE VERTICAL KEYS (#65, #62). The page's rows (store/lineRows.ts) are inline-blocks, and the browser's Up and Down do not cross them the way they cross lines of one block:
//   #65 - ArrowUp INTO A WRAPPED PARAGRAPH. The browser enters an inline-block from below at its FIRST line: Up from a short paragraph into a wrapped one above landed on that paragraph's top line and skipped its lower lines (the probe: block or inline
//         rows land on the last line, inline-block rows on the first; containment and baseline are not the cause). The rows' CSS carries the typing speed (contain), so it stays; this one step is done here: when the caret is on a row's first visual
//         line and the row above wraps over more than one line, Up puts the caret on that row's LAST visual line, at the writer's column. Every other Up (inside a row, above a one-line row, a selection collapsing) is left to the browser.
//   #62 - THE COLUMN. A run of Up and Down keys keeps the column the first of them started from: Down through a SHORTER paragraph and back Up must return to the column the writer left, not the one the short line cut it to; the column is read once,
//         when a run starts, and kept until any other key, a click, or the editor losing focus ends the run. And DOWN FROM AN EMPTY ROW: the browser cannot leave an empty inline-block row downward (the caret stays in it), so Down from an empty row
//         puts the caret on the first line of the row below, at the column of the run.
// Shift+Up and Shift+Down extend the selection the same way. Everything else (inside a row, a one-line neighbour, a selection collapsing, composing) is left to the browser; a caret that cannot be placed here is never an error into the writer's key.
const live = new WeakMap<HTMLElement, { x: number; owned: boolean }>();   // the column of the run of vertical keys in progress, per editor; owned = this file has already moved the caret in the run

/** A click, a lost focus or any key that is not Up or Down ends the run: the next vertical key reads the column afresh. */
export function clearVerticalGoal(el: HTMLElement): void { live.delete(el); }

const MODIFIER_ONLY = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock', 'AltGraph']);

const lineRects = (node: Node): DOMRect[] => {
  const r = document.createRange();
  r.selectNodeContents(node);
  return [...r.getClientRects()].filter((q) => q.height > 0 && q.width >= 0);
};

/** A row's rectangles grouped into its visual lines (one entry per line: where it starts, its top and its middle), top to bottom. */
function distinctLines(rects: DOMRect[]): Array<{ top: number; left: number; mid: number }> {
  const sorted = [...rects].sort((a, b) => a.top - b.top || a.left - b.left);
  const out: Array<{ top: number; left: number; mid: number; bottom: number }> = [];
  for (const q of sorted) {
    const last = out[out.length - 1];
    if (last && q.top < last.top + (last.bottom - last.top) * 0.5) { last.left = Math.min(last.left, q.left); last.bottom = Math.max(last.bottom, q.bottom); last.mid = (last.top + last.bottom) / 2; }
    else out.push({ top: q.top, left: q.left, bottom: q.bottom, mid: q.top + q.height / 2 });
  }
  return out;
}

interface Where { row: HTMLElement; at: number; atRowStart: boolean; fnode: Node; foff: number }

/** The row the selection's focus is in (a caret at a row's START is often drawn in the separator BETWEEN rows, after its newline, or on the host itself: the row it starts is the one that follows). */
function whereIs(el: HTMLElement, rows: HTMLElement[], sel: Selection): Where | null {
  const fnode = sel.focusNode, foff = sel.focusOffset;
  if (!fnode || !el.contains(fnode)) return null;
  const fe = fnode.nodeType === 1 ? (fnode as Element) : fnode.parentElement;
  let row = fe ? (fe.closest('.wz-row') as HTMLElement | null) : null;
  let atRowStart = false;
  if (!row) {
    let next: Node | null = null;
    if (fnode === el) next = el.childNodes[foff] ?? null;
    else if (fnode.parentNode === el && fnode.nodeType === 3 && foff === (fnode as Text).length) next = fnode.nextSibling;
    while (next && next.nodeType !== 1) next = next.nextSibling;
    if (next && (next as Element).classList.contains('wz-row')) { row = next as HTMLElement; atRowStart = true; }
  }
  if (!row) return null;
  const at = rows.indexOf(row);
  return at < 0 ? null : { row, at, atRowStart, fnode, foff };
}

/** Where the caret is drawn: its top, left and height (a caret at a row's start: the row's first line). */
function caretBox(w: Where): { top: number; left: number; height: number } | null {
  const own = lineRects(w.row);
  if (w.atRowStart) {
    if (!own.length) return null;
    const f = own.reduce((m, q) => (q.top < m.top ? q : m), own[0]);
    return { top: f.top, left: f.left, height: f.height };
  }
  // a collapsed range at a soft wrap reports the END of the line above (a quirk of its rectangle, not where the caret is drawn): the line a position is on is the line of the character AFTER it
  if (w.fnode.nodeType === 3 && w.foff < (w.fnode as Text).length) {
    const ch = document.createRange();
    ch.setStart(w.fnode, w.foff);
    ch.setEnd(w.fnode, w.foff + 1);
    const c = [...ch.getClientRects()].find((x) => x.height > 0);
    if (c) return { top: c.top, left: c.left, height: c.height };
  }
  const here = document.createRange();
  here.setStart(w.fnode, w.foff);
  here.collapse(true);
  const q = [...here.getClientRects()].find((x) => x.height > 0) ?? here.getBoundingClientRect();
  if (q && q.height > 0) return { top: q.top, left: q.left, height: q.height };
  // an empty row has no text to draw a rectangle from: its own box is where the caret stands
  const rb = w.row.getBoundingClientRect();
  return own.length === 0 && rb.height > 0 ? { top: rb.top, left: rb.left, height: rb.height } : null;
}

const pointToCaret = (x: number, y: number): { node: Node; offset: number } | null => {
  const d = document as unknown as { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null; caretRangeFromPoint?: (x: number, y: number) => Range | null };
  if (d.caretPositionFromPoint) { const p = d.caretPositionFromPoint(x, y); return p ? { node: p.offsetNode, offset: p.offset } : null; }
  if (d.caretRangeFromPoint) { const r = d.caretRangeFromPoint(x, y); return r ? { node: r.startContainer, offset: r.startOffset } : null; }
  return null;
};

/** Handles the key and returns true when it did (the caller has nothing more to do); false leaves it to the browser. */
export function rowsVerticalKey(el: HTMLElement, e: KeyboardEvent): boolean {
  try {
    const vertical = (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (!vertical) { if (!MODIFIER_ONLY.has(e.key)) live.delete(el); return false; }
    if (e.isComposing) return false;
    const R = rowsFor(el);
    const sel = window.getSelection();
    if (!R || !sel || !sel.rangeCount) return false;
    if (!e.shiftKey && !sel.isCollapsed) { live.delete(el); return false; }   // a vertical key over a selection collapses it: native (and the column is read afresh from the caret it leaves)
    const w = whereIs(el, R.rows, sel);
    if (!w) return false;
    const box = caretBox(w);
    // the run's column: read once, when the run starts, from where the caret is drawn
    let g = live.get(el);
    if (!g) { if (!box) return false; g = { x: box.left, owned: false }; live.set(el, g); }
    const own = lineRects(w.row);
    const empty = own.length === 0;   // an empty row draws no text: nothing in it has a rectangle
    let target: { node: Node; offset: number } | null = null;
    if (g.owned) {
      // THE RUN IS OURS from the first step this file took in it: the browser's own goal column is now the caret's drawn column (a glyph's width from the writer's), so every further Up and Down of the run goes line by line at the run's column,
      // through the row's own lines and into the next row (its first line going down, its last going up); at the page's first or last line the browser has the key
      const dir = e.key === 'ArrowUp' ? -1 : 1;
      const lines = distinctLines(own);
      let line: { left: number; mid: number } | null = null, row: HTMLElement = w.row;
      if (lines.length && !box) return false;
      let idx = -1;
      if (lines.length && box) { let best = Infinity; lines.forEach((l, i) => { const d = Math.abs(l.top - box.top); if (d < best) { best = d; idx = i; } }); }
      const j = idx + dir;
      if (lines.length && j >= 0 && j < lines.length) line = lines[j];
      else {
        const other = R.rows[w.at + dir];
        if (!other) return false;
        const ol = distinctLines(lineRects(other));
        row = other;
        if (!ol.length) target = { node: other, offset: 0 };
        else line = dir < 0 ? ol[ol.length - 1] : ol[0];
      }
      if (line) {
        const p = pointToCaret(Math.max(g.x, line.left + 1.5), line.mid);
        if (!p || !row.contains(p.node)) return false;
        target = p;
      }
    } else if (e.key === 'ArrowDown') {
      // DOWN FROM AN EMPTY ROW (#62): the browser leaves the caret where it is
      if (!empty) return false;
      const below = R.rows[w.at + 1];
      if (!below) return false;
      const bl = lineRects(below);
      if (!bl.length) target = { node: below, offset: 0 };
      else {
        const first = bl.reduce((m, q) => (q.top < m.top ? q : m), bl[0]);
        const p = pointToCaret(Math.max(g.x, first.left + 1.5), first.top + first.height / 2);
        if (!p || !below.contains(p.node)) return false;
        target = p;
      }
    } else {
      // UP INTO A WRAPPED ROW (#65): only from the row's first visual line, and only when the row above wraps
      if (w.at <= 0 || !box) return false;
      if (!empty) {
        if (!own.length) return false;
        const ownTop = Math.min(...own.map((q) => q.top));
        const ownLh = Math.min(...own.map((q) => q.height));
        if (box.top > ownTop + ownLh * 0.6) return false;
      }
      const above = R.rows[w.at - 1];
      const ar = lineRects(above);
      if (!ar.length) return false;
      const aboveTop = Math.min(...ar.map((q) => q.top));
      const last = ar.reduce((m, q) => (q.bottom > m.bottom ? q : m), ar[0]);
      if (last.top - aboveTop < last.height * 0.6) return false;
      // a point exactly on the row's left edge hits the row box, not its last line (the browser answers with the row's START, its first line): at the edge the column is nudged one and a half pixels into the text
      const p = pointToCaret(Math.max(g.x, last.left + 1.5), last.top + last.height / 2);
      if (!p || !above.contains(p.node)) return false;
      target = p;
    }
    if (!target) return false;
    g.owned = true;
    if (e.shiftKey) sel.extend(target.node, target.offset); else sel.collapse(target.node, target.offset);
    e.preventDefault();
    if (!e.shiftKey) revealCaret(el);
    return true;
  } catch {
    return false;   // a caret that cannot be placed here stays the browser's: never an error into the writer's key
  }
}
