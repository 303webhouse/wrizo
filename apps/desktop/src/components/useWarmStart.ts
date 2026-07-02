import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// F2 warm start — a render-only landing glow. When the Desk's return card
// navigates with `state.warmStart`, the editor lands the caret at the end and a
// transient warm emphasis sits over the LAST paragraph, releasing on the first
// forward keystroke or after 6s. It NEVER touches the editable DOM or text
// nodes: the decoration is an absolutely-positioned overlay measured from a
// Range over the last block, so the saved text is byte-identical before and
// after the landing. The chrome dissolve engine still owns the chrome — this
// only glows the last passage.

export interface WarmRect { top: number; left: number; width: number; height: number }

const RELEASE_MS = 6000;   // auto-release if the writer only reads
const REMOVE_MS = 1400;    // ~= the 1.3s release transition, then unmount the overlay

// Put the caret at the end of a contenteditable and focus it.
function focusEnd(el: HTMLElement): void {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// A Range covering the last "paragraph" — the run of text after the final
// newline. Editors here render plain text with `\n` under white-space:pre-wrap
// (ForwardOnlyEditor's runs, the authored sheet's innerText), so a paragraph is
// a text span, not a block element. Walks the text nodes to find the offset just
// past the last newline; end is the last text node's end.
function lastBlockRange(el: HTMLElement): Range | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  const range = document.createRange();
  if (nodes.length === 0) {
    range.selectNodeContents(el);
    return range;
  }
  let startNode: Text = nodes[0];
  let startOffset = 0;
  for (const t of nodes) {
    const idx = t.data.lastIndexOf('\n');
    if (idx >= 0) { startNode = t; startOffset = idx + 1; }
  }
  const lastNode = nodes[nodes.length - 1];
  range.setStart(startNode, Math.min(startOffset, startNode.data.length));
  range.setEnd(lastNode, lastNode.data.length);
  return range;
}

// Union the range's client rects into a box, relative to a positioned ancestor.
function measure(el: HTMLElement, relativeTo: HTMLElement): WarmRect | null {
  const range = lastBlockRange(el);
  if (!range) return null;
  const rects = Array.from(range.getClientRects());
  const box = rects.length ? rects : [range.getBoundingClientRect()];
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  for (const r of box) {
    if (!r.width && !r.height) continue;
    top = Math.min(top, r.top); left = Math.min(left, r.left);
    right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
  }
  if (!isFinite(top)) return null;
  const base = relativeTo.getBoundingClientRect();
  // Match the mockup's padding: bleed 6px left (for the inset accent bar) + 2px
  // vertically so the tint frames the passage rather than clipping it.
  return {
    top: top - base.top - 2,
    left: left - base.left - 6,
    width: (right - left) + 12,
    height: (bottom - top) + 4,
  };
}

interface UseWarmStart {
  rect: WarmRect | null;
  settled: boolean;
  release: () => void;
}

// `active` is captured once at mount (the caller reads location.state before the
// consuming effect strips it). editorRef = the contenteditable; relativeRef = a
// position:relative ancestor to place the overlay against.
export function useWarmStart(
  active: boolean,
  editorRef: React.RefObject<HTMLElement | null>,
  relativeRef: React.RefObject<HTMLElement | null>,
): UseWarmStart {
  const [rect, setRect] = useState<WarmRect | null>(null);
  const [settled, setSettled] = useState(false);
  const doneRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const releaseRef = useRef<() => void>(() => {});
  releaseRef.current = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setSettled(true);
    window.setTimeout(() => setRect(null), REMOVE_MS);
  };

  // Consume the one-shot history state so back/refresh never re-glows.
  useEffect(() => {
    if ((location.state as { warmStart?: boolean } | null)?.warmStart) {
      navigate(location.pathname + location.search, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active) return;
    const el = editorRef.current;
    const base = relativeRef.current;
    if (!el || !base) return;
    focusEnd(el);
    const remeasure = () => { if (!doneRef.current) setRect(measure(el, base)); };
    const raf = requestAnimationFrame(remeasure);
    window.addEventListener('resize', remeasure);
    const timer = window.setTimeout(() => releaseRef.current(), RELEASE_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', remeasure);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rect, settled, release: () => releaseRef.current() };
}
