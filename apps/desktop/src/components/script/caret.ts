
// the script page's vertical policy: focus never scrolls; the box moves only to keep the CARET visible, and only by the minimum; no animation, no fraction, no home [ScriptEditor §2]
function scrollBoxOf(node: HTMLElement): HTMLElement | null {
  for (let p = node.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === 'auto' || oy === 'scroll') return p;
  }
  return null;
}

function caretRectIn(node: HTMLElement): DOMRect {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (node.contains(range.startContainer)) {
      const r = range.getBoundingClientRect();
      // A collapsed range in an EMPTY contenteditable can report all zeros;
      // the element's own box is the honest fallback for "where the caret is".
      if (r.height > 0 || r.width > 0 || r.top !== 0) return r;
    }
  }
  return node.getBoundingClientRect();
}

export function keepCaretVisible(node: HTMLElement): void {
  const caret = caretRectIn(node);
  const box = scrollBoxOf(node);
  if (box) {
    const view = box.getBoundingClientRect();
    if (caret.top >= view.top && caret.bottom <= view.bottom) return;      // clause 2 — it does not move
    box.scrollTop += caret.top < view.top ? caret.top - view.top : caret.bottom - view.bottom;
    return;
  }
  // Below the framed gate there is no bounded cap; the window is the box.
  if (caret.top >= 0 && caret.bottom <= window.innerHeight) return;
  window.scrollBy(0, caret.top < 0 ? caret.top : caret.bottom - window.innerHeight);
}

// -- caret helpers: a live element here is always a single text node (or
// none, when empty) — plaintext-only guarantees no nested markup. ----------
export function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return 0;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

export function setCaretOffset(el: HTMLElement, offset: number): void {
  const sel = window.getSelection();
  if (!sel) return;
  const textNode = el.firstChild;
  const range = document.createRange();
  if (!textNode) {
    range.setStart(el, 0);
  } else {
    const len = textNode.textContent?.length ?? 0;
    range.setStart(textNode, Math.max(0, Math.min(offset, len)));
  }
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

