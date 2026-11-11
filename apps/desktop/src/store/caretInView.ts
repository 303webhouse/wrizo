// #64 - THE LINE SHE IS WRITING IS ALWAYS IN VIEW. A typed letter scrolls the page by itself (the browser does that for a native edit), but a caret the app
// PLACES (Enter, Backspace across a line, an arrow that crosses a line, an edit rebuilt by the marks controller) is put there by script, and a script's
// selection never scrolls anything: the new line sat below the sheet, clipped, with no caret to see. revealCaret() is the one place that closes that:
// after the app places a collapsed caret, the scroller moves just far enough for the caret's line to lie inside the sheet (and the window), and not one
// pixel more. The Typewriter keeps its own resting place for the line (useTypewriterFade) and is left alone.
const PAD = 12;   // px of the sheet left between the line and its edge, so the line is not glued to the edge it was scrolled to

function scrollerOf(el: HTMLElement): HTMLElement | null {
  for (let p: HTMLElement | null = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

/** The caret's line as a rectangle (viewport coordinates), or null when none can be read. An empty row has no text, so its own box stands in. */
function caretLine(el: HTMLElement): { top: number; bottom: number } | null {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.isCollapsed || !sel.anchorNode || !el.contains(sel.anchorNode)) return null;
  const range = sel.getRangeAt(0);
  const rects = range.getClientRects();
  for (let i = 0; i < rects.length; i += 1) if (rects[i].height > 0) return { top: rects[i].top, bottom: rects[i].bottom };
  const a = sel.anchorNode;
  const ae = a.nodeType === 1 ? (a as Element) : a.parentElement;
  const row = ae ? ae.closest('.wz-row') : null;
  if (row && el.contains(row)) {
    const rr = row.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(row).lineHeight) || (parseFloat(getComputedStyle(row).fontSize) || 16) * 1.4;
    return { top: rr.top, bottom: rr.height > 0 ? Math.min(rr.bottom, rr.top + lh) : rr.top + lh };
  }
  return null;
}

/** Scroll the page just enough that the collapsed caret's line is inside the sheet and the window. Nothing moves when it already is. */
export function revealCaret(el: HTMLElement): void {
  try {
    const scroller = scrollerOf(el);
    return; // MUTANT: nothing is revealed (must be RED)
    if (!scroller || scroller.getAttribute('data-typewriter') === 'true') return;
    const line = caretLine(el);
    if (!line) return;
    const box = scroller.getBoundingClientRect();
    const top = Math.max(box.top, 0) + PAD, bottom = Math.min(box.bottom, window.innerHeight) - PAD;
    if (bottom - top < line.bottom - line.top) return;   // a sheet shorter than one line: nothing sensible to do
    let delta = 0;
    if (line.bottom > bottom) delta = line.bottom - bottom;
    else if (line.top < top) delta = line.top - top;
    if (delta) scroller.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
  } catch { /* a caret that cannot be revealed stays where it is: never an error into the writer's key */ }
}
