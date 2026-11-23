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

// A PAGE OPENS ON A WHOLE LINE (Fable, Nov 21, 6:54 pm; POLISH's measurement at 1366: the first line was cut by the scroller's edge). A Draft page mounts with the caret at the END of its words. Focusing
// there made the browser scroll the caret into view by exactly the page's overflow, so a page only a few pixels taller than its sheet rested scrolled by those pixels and its FIRST line, the one she reads first,
// lost its top. The mount now focuses without that scroll (setCaretOffset's preventScroll) and openCaret() chooses where the page rests, by one pure rule (restingScroll): the page may scroll to bring the
// caret's line into view, but only to a place where a line begins at the top of the sheet; and where the overflow is too small for that (the caret's line cannot be shown without cutting the first line), the page
// stays at its top: the first line whole, the caret's line a little low, and the first typed letter scrolls it into view as it always did.

/** How far an opened page rests scrolled. `need` is how far it must scroll for the caret's line to show, `max` the most it can scroll, `offsets` where each line begins (from the top of the page's content).
 *  The smallest line start at or beyond `need` that the page can reach; else the farthest line start it can reach (the top, 0, always can be). Never a place that cuts the top line. */
export function restingScroll(need: number, max: number, offsets: readonly number[]): number {
  if (need <= 0 || max <= 0) return 0;
  const reach = [0, ...offsets].filter((o) => o >= 0 && o <= max).sort((a, b) => a - b);
  const enough = reach.find((o) => o >= need);
  return enough !== undefined ? enough : reach[reach.length - 1];
}

/** THE ROWS ARE THE JUDGE: a long page's rows are laid out lazily, so the offsets measured by restOnce can be a little off by the time the scroll lands, or after it. Read the first row that shows; if the scroller's
 *  edge cuts it, go DOWN to the next row's top (the caret's line only moves further into view), or, at the foot where there is no further, UP to the cut row's own top. Two passes at most. */
function snapFirstRow(el: HTMLElement, scroller: HTMLElement): void {
  for (let pass = 0; pass < 2; pass += 1) {
    const clip = scroller.getBoundingClientRect().top;
    let first: DOMRect | null = null;
    for (const r of Array.from(el.querySelectorAll<HTMLElement>('.wz-row'))) { const q = r.getBoundingClientRect(); if (q.height > 0 && q.bottom > clip + 1) { first = q; break; } }
    if (!first || first.top >= clip - 0.5) return;
    const downBy = first.bottom - clip;
    const room = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
    const by = downBy <= room + 0.5 ? downBy : first.top - clip;
    if (Math.abs(by) < 0.5) return;
    scroller.scrollBy({ top: by, behavior: 'instant' as ScrollBehavior });
  }
}

/** The page has just opened with its caret at the end (the browser's scroll was prevented): rest it on a whole line, with the caret's line in view where that can be done without cutting the first line. */
function restOnce(el: HTMLElement): void {
  try {
    const scroller = scrollerOf(el);
    if (!scroller || scroller.getAttribute('data-typewriter') === 'true') return;
    const line = caretLine(el);
    if (!line) return;
    const box = scroller.getBoundingClientRect();
    const bottom = Math.min(box.bottom, window.innerHeight) - PAD;
    // how far from the TOP the page must scroll for the caret's line to show: the scroller may carry a place over from the stage she left (Free Write's landing, the opening cut), so the line's distance below the bottom is added
    // to where the scroller already is. (It was measured as if the scroller sat at 0, and a caret already in view sent the page to the top: page-open-scroll SC3 and flux3-s4b-l4 CLEAR on the J2 tree.) A page that already
    // shows its caret rests on the smallest whole line that still shows it.
    const need = Math.max(0, scroller.scrollTop + line.bottom - bottom);
    const max = scroller.scrollHeight - scroller.clientHeight;
    const offsets = [...el.querySelectorAll<HTMLElement>('.wz-row')].map((r) => r.getBoundingClientRect().top - box.top + scroller.scrollTop);
    const to = restingScroll(need, max, offsets);
    if (to !== scroller.scrollTop) scroller.scrollTo({ top: to, behavior: 'instant' as ScrollBehavior });
    snapFirstRow(el, scroller);
  } catch { /* a page that cannot be rested stays where it opened: never an error into the writer's page */ }
}

/** Rest the page, and keep it resting on a whole line while a long page lays out (its rows are laid out lazily, so its scroll height changes in the moments after it opens, and a rest chosen from the first measure ends mid-line: flux3-s4b-l4 CLEAR at 1920).
 *  The rule is run again on each change of the page's or its scroller's size for a few seconds, and stops for good at her first act (a key, the wheel, a press, a touch). */
export function openCaret(el: HTMLElement): void {
  restOnce(el);
  try {
    if (typeof ResizeObserver === 'undefined') return;
    let done = false;
    const stop = () => { if (done) return; done = true; ro.disconnect(); window.clearTimeout(timer); window.clearInterval(look); ['keydown', 'wheel', 'pointerdown', 'touchstart'].forEach((t) => document.removeEventListener(t, stop, true)); };
    const ro = new ResizeObserver(() => { if (!done && el.isConnected) restOnce(el); });
    ro.observe(el);
    const sc = scrollerOf(el);
    if (sc && sc !== el) ro.observe(sc);   // a header that draws after the page opens moves the scroller's own edge
    // the rows go on settling after the page's size has stopped changing (a row's lines re-wrap as its font arrives): a slow look at the first row for the same few seconds
    const look = window.setInterval(() => { if (!done && el.isConnected) { const sc2 = scrollerOf(el); if (sc2 && sc2.getAttribute('data-typewriter') !== 'true') snapFirstRow(el, sc2); } }, 250);
    const timer = window.setTimeout(stop, 3000);
    ['keydown', 'wheel', 'pointerdown', 'touchstart'].forEach((t) => document.addEventListener(t, stop, true));
  } catch { /* no observer: the page rests where the first measure put it */ }
}
