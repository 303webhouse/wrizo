// W2 — a generic "linear character offset within a text container" pair,
// shared by every writing surface that needs to save/restore a caret
// position across an unmount (the way back). Works via a TreeWalker over
// text nodes, so it's agnostic to whether the container is a single text
// node (JournalEntry's plaintext-only sheet) or many (ForwardOnlyEditor's
// per-run spans) — the same shape `placeCaretEnd`/`lastBlockRange` already
// use elsewhere in this codebase, generalized to an arbitrary offset.
//
// Fable W2-review advisories (2026-07-13), noted here for the future rather
// than fixed now — neither is a live problem at current scale:
//   A1 — useWayBack calls getCaretOffset on every `selectionchange` (i.e. on
//        every keystroke), walking the TreeWalker from the editor's start
//        each time. Negligible at current node counts (µs-scale). If a
//        future editor structure multiplies text nodes (per-word spans,
//        heavy run-splitting), switch to tracking anchorNode/anchorOffset
//        directly and resolving the linear offset only once, at capture.
//   A2 — setCaretOffset calls el.focus() AFTER addRange (below). Correct in
//        Chromium/Electron — the harness proves the restored offsets land
//        exactly — but if a non-Chromium target ever matters, the safer
//        order is focus-then-range.

// Read the caret's linear offset within `el` (chars from the start of its
// text content), or null if the selection isn't inside `el` at all.
export function getCaretOffset(el: HTMLElement): number | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === range.startContainer) return offset + range.startOffset;
    offset += (n as Text).data.length;
  }
  return offset; // caret's container wasn't a text node under el (e.g. an empty el) — end is the honest answer
}

// Place the caret at a linear offset within `el`, clamping to the end if the
// target exceeds the current content (e.g. the page changed elsewhere since
// the offset was captured — never throw, just land somewhere reasonable).
export function setCaretOffset(el: HTMLElement, target: number): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let node: Text | null = null;
  let localOffset = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const text = n as Text;
    const len = text.data.length;
    if (offset + len >= target) { node = text; localOffset = target - offset; break; }
    offset += len;
  }
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  if (node) {
    range.setStart(node, Math.max(0, Math.min(localOffset, node.data.length)));
  } else {
    range.selectNodeContents(el); // target beyond content (or el is empty) — end is the fallback
  }
  range.collapse(node ? true : false);
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
}
