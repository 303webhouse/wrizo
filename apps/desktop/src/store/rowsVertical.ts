import { rowsFor } from './lineRows';
import { revealCaret } from './caretInView';

// #65 - ArrowUp INTO A WRAPPED PARAGRAPH. The page's rows (store/lineRows.ts) are inline-blocks, and the browser enters an inline-block from below at its FIRST line: Up from a short paragraph into a wrapped one above landed on that
// paragraph's top line and skipped its lower lines (the probe: block or inline rows land on the last line, inline-block rows on the first; containment and baseline are not the cause). The rows' CSS carries the typing speed (contain),
// so it stays; this one step is done here: when the caret is on a row's first visual line and the row above wraps over more than one line, Up puts the caret on that row's LAST visual line, at the column the caret came from.
// Every other Up (inside a row, above a one-line row, a selection collapsing) is left to the browser. Shift+Up extends the selection the same way.
const goal = new WeakMap<HTMLElement, { x: number; node: Node; offset: number }>();

const lineRects = (node: Node): DOMRect[] => {
  const r = document.createRange();
  r.selectNodeContents(node);
  return [...r.getClientRects()].filter((q) => q.height > 0 && q.width >= 0);
};

/** Handles the key and returns true when it did (the caller has nothing more to do); false leaves it to the browser. */
export function rowsUpKey(el: HTMLElement, e: KeyboardEvent): boolean {
  try {
    if (e.key !== 'ArrowUp' || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return false;
    const R = rowsFor(el);
    const sel = window.getSelection();
    if (!R || !sel || !sel.rangeCount || !sel.focusNode || !el.contains(sel.focusNode)) return false;
    if (!e.shiftKey && !sel.isCollapsed) return false;   // Up over a selection collapses it: native
    const fnode = sel.focusNode, foff = sel.focusOffset;
    const fe = fnode.nodeType === 1 ? (fnode as Element) : fnode.parentElement;
    let row = fe ? (fe.closest('.wz-row') as HTMLElement | null) : null;
    // a caret at a row's START is often drawn in the separator BETWEEN rows (after its newline) or on the host itself, not inside the row: the row it starts is the one that follows
    let atRowStart = false;
    if (!row) {
      let next: Node | null = null;
      if (fnode === el) next = el.childNodes[foff] ?? null;
      else if (fnode.parentNode === el && fnode.nodeType === 3 && foff === (fnode as Text).length) next = fnode.nextSibling;
      while (next && next.nodeType !== 1) next = next.nextSibling;
      if (next && (next as Element).classList.contains('wz-row')) { row = next as HTMLElement; atRowStart = true; }
    }
    const at = row ? R.rows.indexOf(row) : -1;
    if (!row || at <= 0) return false;
    // only from the row's first visual line: inside a wrapped row the browser moves by line correctly
    const own = lineRects(row);
    if (!own.length) return false;
    let hr: { top: number; left: number; height: number };
    if (atRowStart) { const f = own.reduce((m, q) => (q.top < m.top ? q : m), own[0]); hr = { top: f.top, left: f.left, height: f.height }; }
    else { const here = document.createRange(); here.setStart(fnode, foff); here.collapse(true); const q = [...here.getClientRects()].find((x) => x.height > 0) ?? here.getBoundingClientRect(); if (!q || q.height <= 0) return false; hr = { top: q.top, left: q.left, height: q.height }; }
    const ownTop = Math.min(...own.map((q) => q.top));
    const ownLh = Math.min(...own.map((q) => q.height));
    if (hr.top > ownTop + ownLh * 0.6) return false;
    // the row above: only when it wraps (a one-line row is entered correctly by the browser)
    const above = R.rows[at - 1];
    const ar = lineRects(above);
    if (!ar.length) return false;
    const aboveTop = Math.min(...ar.map((q) => q.top));
    const last = ar.reduce((m, q) => (q.bottom > m.bottom ? q : m), ar[0]);
    if (last.top - aboveTop < last.height * 0.6) return false;
    const g = goal.get(el);
    // a point exactly on the row's left edge hits the row box, not its last line (the browser answers with the row's START, its first line): at the edge the column is nudged one and a half pixels into the text
    const x0 = g && g.node === fnode && g.offset === foff ? g.x : hr.left;
    const x = Math.max(x0, last.left + 1.5);
    const y = aboveTop + last.height / 2;
    const d = document as unknown as { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null; caretRangeFromPoint?: (x: number, y: number) => Range | null };
    let node: Node | null = null, offset = 0;
    if (d.caretPositionFromPoint) { const p = d.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; offset = p.offset; } }
    else if (d.caretRangeFromPoint) { const r = d.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; offset = r.startOffset; } }
    if (!node || !above.contains(node)) return false;
    if (e.shiftKey) sel.extend(node, offset); else sel.collapse(node, offset);
    goal.set(el, { x, node, offset });
    e.preventDefault();
    if (!e.shiftKey) revealCaret(el);
    return true;
  } catch {
    return false;   // a caret that cannot be placed here stays the browser's: never an error into the writer's key
  }
}
