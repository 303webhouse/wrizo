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

// AB2 S3 — the SAME linear-offset idea, but both boundaries of a (possibly
// non-collapsed) selection at once, for the rail's format actions (Bold/
// Italic wrap a selection; store/draftFormat.ts). Returns null if the
// selection isn't inside `el` at all — same "honest null" contract as
// getCaretOffset above.
//
// Uses the Range.toString().length technique (ScriptEditor.tsx's own
// getCaretOffset helper, proven there) rather than a text-node TreeWalker
// comparison: a boundary's (container, offset) pair is valid for EITHER a
// text node (offset = characters) OR an element node (offset = child-node
// index) per the DOM spec — a plain "Select All" in a contenteditable
// commonly produces the latter (Chromium: startContainer/endContainer ===
// the editable element itself). A text-node-only walker never matches an
// element container and silently falls through to "end of content" for
// both boundaries, collapsing a real selection. Cloning a range up to each
// boundary and reading its serialized length is container-type-agnostic —
// it walks the DOM the same way for both cases.
export function getSelectionOffsets(el: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  pre.setEnd(range.endContainer, range.endOffset);
  const end = pre.toString().length;
  return { start, end };
}

// FX5 S7 — extracted from setCaretOffset's own walker below (byte-identical
// logic, just returning the (node, localOffset) pair instead of committing
// a selection) so a second caller (store/emDash.ts's own range-based
// substitution) can resolve a linear offset to a live DOM position without
// duplicating this TreeWalker — reused, not re-derived.
function resolveOffset(el: HTMLElement, target: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const text = n as Text;
    const len = text.data.length;
    if (offset + len >= target) return { node: text, offset: target - offset };
    offset += len;
  }
  return null;
}

/** Build a live DOM Range spanning plain-text offsets [start, end) within
 * `el` (the SAME linear-offset contract getCaretOffset/setCaretOffset use),
 * or null if either boundary can't be resolved (e.g. el has no text nodes
 * at all). Exported for store/emDash.ts's own programmatic substitution. */
export function rangeFromPlainOffsets(el: HTMLElement, start: number, end: number): Range | null {
  const s = resolveOffset(el, start);
  const e = resolveOffset(el, end);
  if (!s || !e) return null;
  const range = document.createRange();
  range.setStart(s.node, Math.max(0, Math.min(s.offset, s.node.data.length)));
  range.setEnd(e.node, Math.max(0, Math.min(e.offset, e.node.data.length)));
  return range;
}

// Place the caret at a linear offset within `el`, clamping to the end if the
// target exceeds the current content (e.g. the page changed elsewhere since
// the offset was captured — never throw, just land somewhere reasonable).
export function setCaretOffset(el: HTMLElement, target: number): void {
  const resolved = resolveOffset(el, target);
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  if (resolved) {
    range.setStart(resolved.node, Math.max(0, Math.min(resolved.offset, resolved.node.data.length)));
  } else {
    range.selectNodeContents(el); // target beyond content (or el is empty) — end is the fallback
  }
  range.collapse(!!resolved);
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
}
