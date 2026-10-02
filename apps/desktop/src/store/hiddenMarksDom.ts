// ITEM 211 - the live-DOM half of store/hiddenMarks.ts: read a selection as plain-text offsets, and put a caret or a selection end
// back at a plain-text offset. Two DOM positions can name the same offset (the end of one text node, the start of the next); when
// one of them is inside a collapsed `.md-mark-hidden` span the caret is drawn zero-height there, so the visible one is preferred.
import { readEditorPlainText } from './draftDecoration';

function rawOffsetOf(el: HTMLElement, node: Node, offset: number): number {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.setEnd(node, offset);
  return r.toString().length;
}

/** The selection's anchor and focus as offsets into the editor's plain text (the EOF guard removed), or null if it is not ours. */
export function selectionEnds(el: HTMLElement): { anchor: number; focus: number; collapsed: boolean } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.anchorNode || !sel.focusNode) return null;
  if (!el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) return null;
  const raw = el.innerText;
  const a = readEditorPlainText(raw, rawOffsetOf(el, sel.anchorNode, sel.anchorOffset)).caret ?? 0;
  const f = readEditorPlainText(raw, rawOffsetOf(el, sel.focusNode, sel.focusOffset)).caret ?? 0;
  const max = readEditorPlainText(raw, null).plain.length;
  return { anchor: Math.min(a, max), focus: Math.min(f, max), collapsed: sel.isCollapsed };
}

const inHidden = (n: Node) => !!(n.parentElement && n.parentElement.closest('.md-mark-hidden'));
const inGuard = (n: Node) => !!(n.parentElement && n.parentElement.closest('.md-eof-guard'));

/** The text-node position for a plain offset, preferring one outside a hidden mark. */
export function domPointFor(el: HTMLElement, target: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const cands: { node: Text; offset: number }[] = [];
  let acc = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    const len = t.data.length;
    if (inGuard(t)) {
      // the trailing-newline guard (draftDecoration.ts): a caret at the very end lives AFTER it, never before it
      if (target >= acc) return { node: t, offset: len };
      break;
    }
    if (target >= acc && target <= acc + len) cands.push({ node: t, offset: target - acc });
    if (acc > target) break;
    acc += len;
  }
  if (cands.length === 0) return null;
  return cands.find(c => !inHidden(c.node)) ?? cands[0];
}

/** Collapse the caret at a plain offset. Writes nothing if the caret is already at that exact DOM point, so a selectionchange
 *  listener that calls this terminates. */
export function placeCaret(el: HTMLElement, target: number): void {
  const pt = domPointFor(el, target);
  const sel = window.getSelection();
  if (!pt || !sel) return;
  if (sel.isCollapsed && sel.anchorNode === pt.node && sel.anchorOffset === pt.offset) return;
  sel.setBaseAndExtent(pt.node, pt.offset, pt.node, pt.offset);
}

/** Move only the selection's focus to a plain offset, the anchor staying where it is (Shift+Arrow). */
export function extendSelection(el: HTMLElement, focus: number): void {
  const pt = domPointFor(el, focus);
  const sel = window.getSelection();
  if (!pt || !sel || !sel.anchorNode) return;
  sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, pt.node, pt.offset);
}
