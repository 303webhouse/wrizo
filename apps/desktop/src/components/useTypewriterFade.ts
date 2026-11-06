import { useEffect } from 'react';

// the shared typewriter engine holds the active line low so earlier lines ride up and fade; past the zone's lower bound it scrolls smoothly by exactly the delta (one line for ordinary typing), never a jolt [useTypewriterFade §1]

const TYPEWRITER_BAND = 0.73; // the writing zone's lower bound — hold the active line low (~73%), B2 C1
const FADE_LINES = 3;         // the fade band's depth, in line-heights (S1)
// the start offset is a visual quarter of the stage, for prose, script and the Journal alike [useTypewriterFade §2]
const START_FRACTION = 0.25;
const TOP_STOP_MIN = 56;      // the zoomed band's .12 stop is never nearer the column's top than this (screen px), so the top rows end in the theme's ground (polish10-ground G1)
// FX3 S3 — "the first scroll engaged late." TYPEWRITER_BAND alone governs
// how soon the hold-scroll triggers, and it's a SHARED constant read by
// every useTypewriterFade caller. CONTAINER_HOLD_BAND is threaded into the
// container-mode calls (ModeStage.tsx, ScriptEditor.tsx — both framed
// "paper" surfaces). Tuned empirically (typing simulated in the built app,
// not just derived on paper) so the fade/scroll engages within the first
// few lines of the start band rather than lagging for a dozen lines.
export const CONTAINER_HOLD_BAND = 0.46;

interface ScrollBox {
  top: number;                 // viewport-space top of the clipping box (0 for window)
  clientHeight: number;
  scrollTop: number;
  setScrollTop(v: number, smooth: boolean): void;
}

function readBox(useWindowScroll: boolean, container: HTMLElement): ScrollBox {
  if (useWindowScroll) {
    return {
      top: 0,
      clientHeight: window.innerHeight,
      scrollTop: window.scrollY,
      setScrollTop: (v, smooth) => window.scrollTo({ top: v, left: 0, behavior: smooth ? 'smooth' : 'auto' }),
    };
  }
  return {
    top: container.getBoundingClientRect().top,
    clientHeight: container.clientHeight,
    scrollTop: container.scrollTop,
    setScrollTop: (v, smooth) => { container.scrollTo({ top: v, behavior: smooth ? 'smooth' : 'auto' }); },
  };
}

interface Options {
  enabled: boolean;
  containerRef: React.RefObject<HTMLElement>; // MutationObserve target; the scroll box in the container case
  editorSelector: string;                     // queried within containerRef for the caret/last line
  useWindowScroll?: boolean;                  // scroll `window` instead of containerRef
  scrolledTarget?: React.RefObject<HTMLElement>; // element to receive data-scrolled (defaults to containerRef)
  // FX3 S3 — the hold-scroll trigger fraction (see CONTAINER_HOLD_BAND's own
  // comment above). Omitted (JournalEntry.tsx's call) keeps the original
  // shared TYPEWRITER_BAND exactly, byte-identical to pre-FX3 — the Journal
  // carve-out. ModeStage.tsx/ScriptEditor.tsx pass CONTAINER_HOLD_BAND.
  holdBand?: number;
  // PAGE-SIZE - the ZOOM (ModeStage, framed prose with Typewriter on): the page is transformed, and the writing line is held at `anchor` of
  // `holdRef`'s box (the page column the band mask is drawn in) instead of `holdBand` of the scroller. Omitted everywhere else - unchanged.
  zoom?: { holdRef: React.RefObject<HTMLElement>; anchor: number };
}


// the row the collapsed caret sits in, or null: a fresh line after Enter is an empty row, where the range gives no rect or the previous line's [useTypewriterFade §3]
export function caretRow(sel: Selection | null, within: Element | null): HTMLElement | null {
  if (!sel || !sel.rangeCount || !within || !sel.anchorNode || !within.contains(sel.anchorNode)) return null;
  const a = sel.anchorNode;
  const ae = a.nodeType === 1 ? (a as Element) : a.parentElement;
  if (!ae) return null;
  const row = ae.closest('.wz-row');
  if (row && within.contains(row)) return row as HTMLElement;
  if (ae === within || ae.matches?.('.forward-only-editor')) {
    // Draft's lines are `.wz-row` spans; Free Write's are plain line elements - the caret's row is the child at the anchor either way
    const rowKids = [...ae.children].filter((c) => c.classList.contains('wz-row'));
    const kids = rowKids.length ? rowKids : [...ae.children].filter((c) => c.getBoundingClientRect().height > 0);
    if (!kids.length) return null;
    return kids[Math.max(0, Math.min(sel.anchorOffset, kids.length - 1))] as HTMLElement;
  }
  return null;
}

export function useTypewriterFade({ enabled, containerRef, editorSelector, useWindowScroll, scrolledTarget, holdBand, zoom: zoomOpt }: Options): void {
  // the effect keys on the zoom's PARTS (a caller builds a new options object every render; keyed on that, the engine would restart - and lose
  // its engaged state - on every keystroke)
  const zoomOn = !!zoomOpt;
  const zoomHoldRef = zoomOpt?.holdRef;
  const zoomAnchor = zoomOpt?.anchor ?? 0;
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;
    const zoom = zoomOn && zoomHoldRef ? { holdRef: zoomHoldRef, anchor: zoomAnchor } : undefined;
    const holdBandValue = holdBand ?? TYPEWRITER_BAND;
    const scrolledEl = scrolledTarget?.current ?? container;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    // FX5 S1 — engage state, kept in the effect's own closure (fresh per
    // mount, same lifetime as `raf` above). `engaged` never resets once
    // true within a mount; `prevDocCaretBottom` is the last-measured caret
    // position in scroll-INDEPENDENT "document space" (see band() below).
    let engaged = false;
    let prevDocCaretBottom: number | null = null;
    // diagnostics in memory only: an array the harness puts on window before mount; absent in every real session, so nothing is written [useTypewriterFade §4]
    const trace = (typeof window !== 'undefined' ? (window as unknown as { __wzTwTrace?: unknown[] }).__wzTwTrace : undefined);
    if (trace) trace.push({ d: 'mount', at: Math.round(performance.now()), zoom: !!zoom });

    const setScrolled = () => {
      // the fade trigger: window mode gates on the sheet's own top vs the viewport, container mode on the box's own scrollTop against its rest position [useTypewriterFade §5]
      const scrolled = useWindowScroll
        ? container.getBoundingClientRect().top < -4
        : (() => { const box = readBox(false, container); return box.scrollTop > 4; })();
      scrolledEl.dataset.scrolled = scrolled ? 'true' : 'false';
    };
    const lineHeight = () => {
      const ed = container.querySelector(editorSelector) as HTMLElement | null;
      return ed ? (parseFloat(getComputedStyle(ed).lineHeight) || 28) : 28;
    };
    // PAGE-SIZE - the scale the page is PAINTED at (the base scale x the zoom: every transform between the scroller and the screen), read from the
    // page's own two boxes - painted width over layout width - so no constant can drift from what is drawn. 1 whenever this call is not zoomed.
    const zoomScale = () => {
      if (!zoom) return 1;
      const page = container.closest('.mode-page') as HTMLElement | null;
      const s = page && page.offsetWidth > 0 ? page.getBoundingClientRect().width / page.offsetWidth : 1;
      return s > 0 ? s : 1;
    };
    // one line per glide: the next step waits until the last glide has landed and steps from there; a glide that never lands stops waiting after GLIDE_MS [useTypewriterFade §6]
    let glideTarget: number | null = null;
    let glideAt = 0;
    // a glide is paid only when it lands: one that ends short (the browser cancelled it) has its remainder owed again; one that went back past its start is the writer's own scroll, honoured [useTypewriterFade §7]
    let glideFrom: number | null = null;
    let verifyTimer: ReturnType<typeof setTimeout> | null = null;
    // glides are timed by performance.now(), ending at LINE_GLIDE_MS whatever the frame pacing; a backlog is paid in bigger steps finished within BACKLOG_CAP_MS [useTypewriterFade §8]
    const LINE_GLIDE_MS = 160;
    const VIEW_KEYS = new Set(['Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown']);
    const BACKLOG_CAP_MS = 1000;
    // no single catch-up step is more than MAX_STEP_LINES lines, however much is owed: a deep backlog takes more steps, never a bigger one [useTypewriterFade §9]
    const MAX_STEP_LINES = 2;
    const GLIDE_MS = LINE_GLIDE_MS + 60;   // past this a glide that has not landed is lost (its owed remainder is re-issued, below)
    let owedSince: number | null = null;   // when the current backlog first became owed (null: nothing owed)
    let glideRaf = 0;
    let glideEnd: ReturnType<typeof setTimeout> | null = null;
    const stopGlide = () => {
      cancelAnimationFrame(glideRaf); glideRaf = 0;
      if (glideEnd) { clearTimeout(glideEnd); glideEnd = null; }
    };
    let userScrolled = false;
    const onUserScroll = () => { userScrolled = true; };
    // the KEYBOARD's way of moving the view (Ctrl+Home, Home/End, PageUp/PageDown, ArrowUp/Down) is the writer's scroll too. It must be named: the browser
    // moves the box with no wheel/touch/press, and a key that lands the box at the very top (Ctrl+Home, a PageUp from within a page of it, an arrow run up
    // to line 1) is exactly the drop to 0 that takenOver() excuses as the editor's re-render clamp - the glide would carry on and drag the writer back down.
    // Typing is not in the set: a typed key is what the glide is FOR.
    const onUserKey = (e: KeyboardEvent) => { if (VIEW_KEYS.has(e.key)) userScrolled = true; };
    const glide = (box: ScrollBox, from: number, to: number) => {
      stopGlide();
      userScrolled = false;
      const t0 = performance.now();
      let lastSet = from;   // where this glide last left the scroll
      const land = () => { stopGlide(); box.setScrollTop(to, false); if (trace) trace.push({ d: 'land', to: Math.round(to), ms: Math.round(performance.now() - t0) }); };
      // the writer's own scroll took over: honoured, as a native smooth scroll's cancel was. That is a wheel / touch / press on the scrollbar, or the scroll
      // simply not being where this glide left it (a scrollTo by anything else). EXCEPT a drop to the very top: the editor's re-render of a typed line clamps
      // scrollTop to 0 (the box, 7 runs of 8, always at the same glide) and a native smooth scroll rides that out to its absolute target - so does this one,
      // its next frame sets the absolute position again.
      const takenOver = () => {
        const cur = readBox(!!useWindowScroll, container).scrollTop;
        if (!userScrolled && ((cur <= 1 && lastSet > 2) || Math.abs(cur - lastSet) <= 2)) return false;
        if (trace) trace.push({ d: 'abort', cur: Math.round(cur), lastSet: Math.round(lastSet), to: Math.round(to) });
        stopGlide(); glideAt = 0;
        return true;
      };
      const tick = () => {
        glideRaf = 0;
        if (takenOver()) return;
        const p = (performance.now() - t0) / LINE_GLIDE_MS;
        if (p >= 1) { land(); return; }
        lastSet = from + (to - from) * (0.5 - Math.cos(Math.PI * p) / 2);
        box.setScrollTop(lastSet, false);
        glideRaf = requestAnimationFrame(tick);
      };
      glideEnd = setTimeout(() => { glideEnd = null; if (!takenOver()) land(); }, LINE_GLIDE_MS + 40);   // the hard cap: frames or no frames, it has landed by now
      glideRaf = requestAnimationFrame(tick);
    };
    // S1 — the fade band (line-height based) and the fresh-page start offset
    // (stage-height based) are both STATIC CSS the writing surface reads via
    // custom properties; this just keeps them in step with the actual
    // rendered type scale / box size. Cheap; safe to call often.
    const measure = () => {
      const stageEl = (useWindowScroll ? null : container.closest('.desk-frame-stage') || container.closest('.mode-stage')) as HTMLElement | null;
      const stageHeight = useWindowScroll ? window.innerHeight : (stageEl ?? container).clientHeight;
      scrolledEl.style.setProperty('--tw-fade-band', `${Math.round(lineHeight() * FADE_LINES)}px`);
      // FX5 S1 (b) — "the fade band starts one line lower": the topmost
      // line-height now reads fully legible, unfaded; the ramp itself
      // (same depth, --tw-fade-band above) begins at this offset instead
      // of at the very top edge. Both CSS consumers (the container mask
      // and the Journal sticky overlay) add this into their own gradient
      // stops — see index.css.
      scrolledEl.style.setProperty('--tw-fade-start', `${Math.round(lineHeight())}px`);
      scrolledEl.style.setProperty('--tw-start-offset', `${Math.round(stageHeight * START_FRACTION)}px`);
      // the band mask's line unit in screen px (line height x paint scale); zoomed, the start offset puts a fresh page's first line at the anchor [useTypewriterFade §10]
      if (zoom?.holdRef.current) {
        const sc = zoomScale();
        const h = zoom.holdRef.current.getBoundingClientRect();
        zoom.holdRef.current.style.setProperty('--tw-lh', `${(lineHeight() * sc).toFixed(2)}px`);
        zoom.holdRef.current.style.setProperty('--tw-anchor', `${zoom.anchor * 100}%`);   // the ONE anchor: the hold below and the mask read it
        // the band's first (.12) stop is 6.6 lines above the anchor: at a 50% anchor on a short column that is within a few px of the top, and the top rows
        // then keep a sliver of the page instead of ending in the theme's ground (polish10-ground G1 at 1366). The stop never sits nearer than TOP_STOP_MIN.
        zoom.holdRef.current.style.setProperty('--tw-lead', `${Math.max(0, TOP_STOP_MIN - (h.height * zoom.anchor - 6.6 * lineHeight() * sc)).toFixed(1)}px`);
        const startPx = (h.top + h.height * zoom.anchor - container.getBoundingClientRect().top) / sc;
        scrolledEl.style.setProperty('--tw-start-offset', `${Math.max(0, Math.round(startPx))}px`);
        // room below the last line, so it can rise to the anchor: the column's own height in layout px [useTypewriterFade §11]
        scrolledEl.style.setProperty('--tw-end-pad', `${Math.round(h.height / sc)}px`);   // the column's own height in layout px (never the scroller's clientHeight: the padding counts in it, so it fed itself - A3 saw 463,400px)
      }
    };
    const band = () => {
      measure();
      const ed = container.querySelector(editorSelector) as HTMLElement | null;
      let caretBottom: number | null = null;
      const sel = window.getSelection();
      if (sel && sel.rangeCount && ed && sel.anchorNode && ed.contains(sel.anchorNode)) {
        const liveRange = sel.getRangeAt(0);
        const rects = liveRange.getClientRects();
        const r = rects[rects.length - 1];
        if (r && r.height) caretBottom = r.bottom;
        // the caret's ROW is the truth when the range's rect is not on it, so Enter's line is paid at once [useTypewriterFade §12]
        const row = caretRow(sel, ed);
        if (row) {
          const rr = row.getBoundingClientRect();
          if (rr.height && (caretBottom === null || caretBottom < rr.top + 1 || caretBottom > rr.bottom + 1)) caretBottom = rr.bottom;
        }
      }
      // FX4 S1 — a genuinely COLLAPSED range's own getClientRects() is
      // frequently EMPTY in Chromium right at a text-node boundary (a
      // documented engine quirk, not a caller bug) — found live while
      // tuning Journal's own engage-band. Two compounding failures showed
      // up on JournalEntry.tsx's plaintext-only editable specifically
      // (unlike ForwardOnlyEditor's own per-run spans): (1) right after
      // Enter, `sel.anchorNode` is frequently the EDITABLE ELEMENT itself
      // (a child-index offset), not a text node at all, so a node-type
      // guard on `anchorNode` alone still misses it; (2) even keyed off the
      // anchor, a fresh line's own text node can be genuinely EMPTY (zero
      // characters) with nothing adjacent to measure. Both silently fell
      // through to the coarse `ed.lastElementChild ?? ed` fallback below —
      // and with NO element children at all (plaintext-only has none), that
      // resolved to the editor box's own bottom edge, pinned by its
      // `minHeight` floor rather than tracking the caret, so the hold band
      // fired almost immediately on every keystroke, structurally
      // independent of any holdBand tuning (confirmed empirically: a
      // two-cycle harness probe read the SAME editor-box-bottom value no
      // matter how little had actually been typed). The robust fix: walk
      // EVERY text node under `ed` (not just the anchor's own) and measure
      // the LAST character of the last non-empty one — this reliably lands
      // on "the end of what's actually been written" regardless of exactly
      // where the collapsed caret's own node/offset landed, including the
      // "just pressed Enter, new line still empty" case (which correctly
      // falls back to the PREVIOUS line's own last character — there is
      // nothing else to measure on a genuinely blank fresh line anyway).
      if (caretBottom === null && ed) {
        const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
        let lastNonEmpty: Text | null = null;
        let n: Node | null;
        while ((n = walker.nextNode())) {
          if ((n as Text).data.length > 0) lastNonEmpty = n as Text;
        }
        if (lastNonEmpty) {
          const charRange = document.createRange();
          charRange.setStart(lastNonEmpty, lastNonEmpty.data.length - 1);
          charRange.setEnd(lastNonEmpty, lastNonEmpty.data.length);
          const rects = charRange.getClientRects();
          const r = rects[rects.length - 1];
          if (r && r.height) caretBottom = r.bottom;
        }
      }
      // FX4 S1 — a genuinely EMPTY editor (nothing typed yet — no element
      // children, no non-empty text node found above either) must NOT
      // resolve to `ed`'s own BOTTOM edge here: JournalEntry.tsx's
      // `.entry-edit` carries a generous `minHeight` (54vh, room to write
      // into from the start), so an empty box's own bottom sits far below
      // its top — treating that inflated bottom as "the caret" scrolled
      // the page on MOUNT, before a single keystroke, directly undoing
      // "the writing starts a quarter down" (found live: a fresh page's
      // own edTop moved from ~320px to ~144px with no typing at all).
      // `ed`'s own TOP is the honest reading of "nothing written yet" —
      // small/zero relative to the hold line, so the C2 guard below
      // correctly recognizes fresh content and does not scroll. A REAL
      // rendered `lastElementChild` (prose's own per-run spans) still uses
      // its own bottom, unchanged — this only affects the "truly nothing
      // to measure" case.
      if (caretBottom === null && ed) {
        const last = ed.lastElementChild as HTMLElement | null;
        caretBottom = last ? last.getBoundingClientRect().bottom : ed.getBoundingClientRect().top;
      }
      if (caretBottom === null) { if (trace) trace.push({ d: 'no-caret' }); return; }
      const box = readBox(!!useWindowScroll, container);
      // PAGE-SIZE - zoomed, the page is TRANSFORMED: rects are screen pixels, the scroller's scrollTop and clientHeight are layout pixels. Every
      // screen distance is divided by the zoom before it meets the scroller, so one line of advance is still one LAYOUT line.
      const sc = zoomScale();
      const within = (caretBottom - box.top) / sc;
      // the caret is tracked in document space (from the TEXT's top, not the scroller's padding), so a writer's own scroll is never snapped back and a scale change never shifts it [useTypewriterFade §13]
      const padTop = parseFloat(getComputedStyle(container).paddingTop) || 0;
      const docCaretBottom = within + box.scrollTop - padTop;
      // PAGE-SIZE - zoomed, the hold is the writing line's TOP at `anchor` of the hold element (the page column, the box the band mask is drawn
      // in), as Cursor's mockup places it - so the caret's BOTTOM sits one line below that, inside the mask's full-strength band.
      const holdEl = zoom?.holdRef.current ?? null;
      const thresholdPx = holdEl
        ? (holdEl.getBoundingClientRect().top + holdEl.getBoundingClientRect().height * zoom!.anchor - box.top) / sc + lineHeight()
        : box.clientHeight * holdBandValue;

      if (!engaged) {
        if (within - thresholdPx <= 1) { if (trace) trace.push({ d: 'fresh', within: Math.round(within), threshold: Math.round(thresholdPx) }); setScrolled(); return; } // fresh/short content: don't scroll, don't fade (C2)
        // First engage (S1 a: "must not lurch"): owe exactly the same delta
        // the old absolute design would have jumped in one shot, but pay it
        // off below via the SAME one-line-at-a-time stepping every later
        // engaged call uses — one code path, no special-cased jump.
        engaged = true;
        if (trace) trace.push({ d: 'engage', within: Math.round(within), threshold: Math.round(thresholdPx), top: Math.round(box.scrollTop) });
        prevDocCaretBottom = docCaretBottom - (within - thresholdPx);
      }
      if (engaged && !reduce && glideTarget != null && glideFrom != null && performance.now() - glideAt >= GLIDE_MS
          && box.scrollTop >= glideFrom - 1 && box.scrollTop < glideTarget - 1) {
        const owed = glideTarget - box.scrollTop;
        prevDocCaretBottom = (prevDocCaretBottom as number) - owed;
        if (trace) trace.push({ d: 'lost', from: Math.round(glideFrom), target: Math.round(glideTarget), at: Math.round(box.scrollTop), owed: Math.round(owed) });
        glideTarget = null; glideFrom = null;
      }
      // PAGE-SIZE (anchor A3) - zoomed, what is owed can never exceed what is geometrically LEFT: the writing line's real distance below the hold. While typing
      // outruns the glides (each one is cancelled by the next keystroke: step 0>27, lost, again) the owed advance stacks up (51, 106, 133 ... 296 on the
      // 1366 trace), and once the glides finally land the stack pays one line too many - the scroll runs to its bottom stop with the line a line ABOVE the
      // anchor (43.7%, the band's top fade over it, A3). The line's measured excess below the hold is the cap; a line already at or above it owes nothing.
      const owedAdvance = docCaretBottom - (prevDocCaretBottom as number);
      const advance = holdEl ? Math.min(owedAdvance, within - thresholdPx) : owedAdvance;
      if (advance > 1) {
        // Never more than one line-height per call, however large the raw
        // advance is (a deep first-engage on a long page, or a multi-line
        // paste) — S1 a's "never a multi-line recenter jump." Leftover
        // owed advance is paid off by re-invoking band() on the very next
        // frame (not waiting for another keystroke), so a big catch-up
        // still reads as a smooth staircase of one-line steps, not a wait-
        // then-jump. box.scrollTop is re-read fresh on every call (readBox,
        // above), so each step composes correctly on top of wherever the
        // writer's own scroll currently sits (S1 c: scroll freedom) — this
        // never fights a manual scroll, it only ever adds to it.
        // TIME-BASED GLIDE - a backlog is paid in steps sized to the glides the cap still has room for (one line each, when only a line is owed)
        const nowMs = performance.now();
        if (owedSince == null) owedSince = nowMs;
        const glidesLeft = reduce ? 1 : Math.max(1, Math.floor((owedSince + BACKLOG_CAP_MS - nowMs) / (LINE_GLIDE_MS + 17)));
        const linesPerGlide = reduce ? 1 : Math.min(MAX_STEP_LINES, Math.max(1, Math.ceil(advance / lineHeight() / glidesLeft)));
        const step = Math.min(advance, lineHeight() * linesPerGlide);
        // PAGE-SIZE - one line per glide: while the last glide is still travelling, WAIT for it (the next frame looks again; nothing owed is
        // lost - prevDocCaretBottom has not moved). Reduced motion moves instantly, so it never waits.
        const gliding = !reduce && glideTarget != null && Math.abs(box.scrollTop - glideTarget) > 1 && performance.now() - glideAt < GLIDE_MS;
        if (gliding) { if (trace) trace.push({ d: 'wait', top: Math.round(box.scrollTop), target: glideTarget }); raf = requestAnimationFrame(band); return; }
        // the target is clamped to what the box can actually scroll to, so a glide that hits the bottom still counts as landed
        const maxTop = useWindowScroll ? Infinity : Math.max(0, container.scrollHeight - container.clientHeight);
        const to = Math.min(box.scrollTop + step, maxTop);
        if (reduce) box.setScrollTop(to, false); else glide(box, box.scrollTop, to);
        if (trace) trace.push({ d: 'step', from: Math.round(box.scrollTop), to: Math.round(to), maxTop: Math.round(maxTop), advance: Math.round(advance), lines: linesPerGlide });
        glideFrom = box.scrollTop; glideTarget = to; glideAt = performance.now();
        if (verifyTimer) clearTimeout(verifyTimer);
        verifyTimer = setTimeout(() => { verifyTimer = null; schedule(); }, GLIDE_MS + 50);   // did it land? (see glideFrom's comment)
        prevDocCaretBottom = (prevDocCaretBottom as number) + step;
        // FX5 review fix — this chained catch-up frame MUST be tracked into
        // the SAME `raf` variable `schedule()` uses, not fired as a raw
        // untracked `requestAnimationFrame` call: the effect's own cleanup
        // below only ever cancels whatever is currently held in `raf`. A
        // bare untracked call here escapes that cancellation entirely, so a
        // big catch-up (a long first-engage, or a multi-line paste) that's
        // still mid-staircase at the exact moment `enabled`/`holdBand`
        // toggles (a live writing-settings flip, not just full unmount —
        // the scroll container itself persists across that prop change)
        // leaves a zombie chain still calling `box.setScrollTop` against
        // the SAME still-mounted box from a stale closure — an inexplicable
        // extra scroll step landing AFTER the writer turned typewriter mode
        // off, exactly the class of "the page moves on its own" defect this
        // ticket exists to eliminate. Assigning here is safe: by the time
        // this line runs, `schedule()`'s own last-assigned `raf` has already
        // fired (this IS that callback), so overwriting it with the new
        // chained id is the correct, non-destructive handoff.
        if (advance - step > 1) raf = requestAnimationFrame(band); else owedSince = null;
      } else {
        owedSince = null;
        // Caret moved to earlier content (clicked elsewhere, or a delete
        // shrank the document) — resync without scrolling; no advance is
        // "owed" backward.
        prevDocCaretBottom = docCaretBottom;
        if (trace) trace.push({ d: 'resync', advance: Math.round(advance) });
      }
      setScrolled();
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(band); };
    const mo = new MutationObserver(schedule);
    mo.observe(container, { childList: true, subtree: true, characterData: true });
    container.addEventListener('input', schedule);
    const scrollListenTarget: Window | HTMLElement = useWindowScroll ? window : container;
    scrollListenTarget.addEventListener('scroll', setScrolled, { passive: true });
    for (const ev of ['wheel', 'touchstart', 'pointerdown']) scrollListenTarget.addEventListener(ev, onUserScroll, { passive: true });
    scrollListenTarget.addEventListener('keydown', onUserKey as EventListener, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    setScrolled();
    schedule();
    return () => {
      if (trace) trace.push({ d: 'unmount', at: Math.round(performance.now()) });
      mo.disconnect();
      container.removeEventListener('input', schedule);
      scrollListenTarget.removeEventListener('scroll', setScrolled);
      for (const ev of ['wheel', 'touchstart', 'pointerdown']) scrollListenTarget.removeEventListener(ev, onUserScroll);
      scrollListenTarget.removeEventListener('keydown', onUserKey as EventListener);
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
      stopGlide();
      if (verifyTimer) clearTimeout(verifyTimer);
    };
  }, [enabled, containerRef, editorSelector, useWindowScroll, scrolledTarget, holdBand, zoomOn, zoomHoldRef, zoomAnchor]);
}
