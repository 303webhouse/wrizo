import { useEffect } from 'react';

// Shared typewriter-scroll engine (B2, FX1 S1 rewrite): holds the active line
// low in the viewport so earlier lines ride up and fade. Originally
// ModeStage-only (a fixed-height `.mode-scroll` box); generalized here so
// JournalEntry's naturally-growing, window-scrolled sheet (ink strokes anchor
// to the sheet's own growing height, so it can't be clipped into a fixed-
// height overflow box — see JournalEntry.tsx) can share the same hold
// behavior via `useWindowScroll`. The visual fade itself is CSS: a
// `mask-image` on the scroll box for the container case, or a sticky
// gradient overlay for the window case (see index.css / JournalEntry.tsx).
//
// FX1 S1 (Nick's first-sitting verdict) — the old engine held the active line
// at a fixed band and, on crossing it, snapped the scroll position with a
// hand-rolled overshoot-then-settle "jolt" animation. That overshoot read as
// a pop/jerk on every line commit. This rewrite drops the jolt entirely: once
// the writing zone's lower bound (still TYPEWRITER_BAND) is crossed, the box
// scrolls smoothly (native smooth scroll; instant under reduced-motion) by
// exactly the delta needed to restore the bound — which, for ordinary one-
// line-at-a-time typing, is one line-height, never a multi-line jump.

const TYPEWRITER_BAND = 0.73; // the writing zone's lower bound — hold the active line low (~73%), B2 C1
const FADE_LINES = 3;         // the fade band's depth, in line-heights (S1)
const START_FRACTION = 0.45;  // a fresh page's first line starts ~45% down the stage (S1)

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
}

export function useTypewriterFade({ enabled, containerRef, editorSelector, useWindowScroll, scrolledTarget }: Options): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;
    const scrolledEl = scrolledTarget?.current ?? container;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const setScrolled = () => {
      // Window mode: gate on the SHEET's own top vs the viewport (has content
      // actually scrolled past the fold?), not raw window.scrollY — a page
      // can be scrolled a little (chrome above the sheet moving out of view)
      // while the sheet's first line is still fully below the viewport top.
      // Using window.scrollY there (Fable W1-R3) washed line 1 into paper on
      // a short-but-scrolled page, violating C2. Container mode is unchanged:
      // the scroll box's own scrollTop vs its top edge.
      const scrolled = useWindowScroll
        ? container.getBoundingClientRect().top < -4
        : (() => { const box = readBox(false, container); return box.scrollTop - box.top > 4; })();
      scrolledEl.dataset.scrolled = scrolled ? 'true' : 'false';
    };
    const lineHeight = () => {
      const ed = container.querySelector(editorSelector) as HTMLElement | null;
      return ed ? (parseFloat(getComputedStyle(ed).lineHeight) || 28) : 28;
    };
    // S1 — the fade band (line-height based) and the fresh-page start offset
    // (stage-height based) are both STATIC CSS the writing surface reads via
    // custom properties; this just keeps them in step with the actual
    // rendered type scale / box size. Cheap; safe to call often.
    const measure = () => {
      const stageEl = (useWindowScroll ? null : container.closest('.desk-frame-stage') || container.closest('.mode-stage')) as HTMLElement | null;
      const stageHeight = useWindowScroll ? window.innerHeight : (stageEl ?? container).clientHeight;
      scrolledEl.style.setProperty('--tw-fade-band', `${Math.round(lineHeight() * FADE_LINES)}px`);
      scrolledEl.style.setProperty('--tw-start-offset', `${Math.round(stageHeight * START_FRACTION)}px`);
    };
    const band = () => {
      measure();
      const ed = container.querySelector(editorSelector) as HTMLElement | null;
      let caretBottom: number | null = null;
      const sel = window.getSelection();
      if (sel && sel.rangeCount && ed && sel.anchorNode && ed.contains(sel.anchorNode)) {
        const rects = sel.getRangeAt(0).getClientRects();
        const r = rects[rects.length - 1];
        if (r && r.height) caretBottom = r.bottom;
      }
      if (caretBottom === null && ed) {
        const last = ed.lastElementChild as HTMLElement | null;
        caretBottom = (last ?? ed).getBoundingClientRect().bottom;
      }
      if (caretBottom === null) return;
      const box = readBox(!!useWindowScroll, container);
      const within = caretBottom - box.top;
      const delta = within - box.clientHeight * TYPEWRITER_BAND;
      if (delta <= 1) { setScrolled(); return; } // fresh/short content: don't scroll, don't fade (C2)
      const target = box.scrollTop + delta;
      box.setScrollTop(target, !reduce);
      setScrolled();
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(band); };
    const mo = new MutationObserver(schedule);
    mo.observe(container, { childList: true, subtree: true, characterData: true });
    container.addEventListener('input', schedule);
    const scrollListenTarget: Window | HTMLElement = useWindowScroll ? window : container;
    scrollListenTarget.addEventListener('scroll', setScrolled, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    setScrolled();
    schedule();
    return () => {
      mo.disconnect();
      container.removeEventListener('input', schedule);
      scrollListenTarget.removeEventListener('scroll', setScrolled);
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
    };
  }, [enabled, containerRef, editorSelector, useWindowScroll, scrolledTarget]);
}
