import { useEffect } from 'react';

// Shared typewriter-scroll engine (B2): holds the active line low in the
// viewport so earlier lines ride up and fade, with a subtle mechanical jolt on
// line advance. Originally ModeStage-only (a fixed-height `.mode-scroll` box);
// generalized here so JournalEntry's naturally-growing, window-scrolled sheet
// (ink strokes anchor to the sheet's own growing height, so it can't be
// clipped into a fixed-height overflow box — see JournalEntry.tsx) can share
// the same hold/jolt behavior via `useWindowScroll`. The visual fade itself is
// CSS: a `mask-image` on the scroll box for the container case, or a sticky
// gradient overlay for the window case (see index.css / JournalEntry.tsx).

const TYPEWRITER_BAND = 0.73; // hold the active line low (~73%) — B2 C1

interface ScrollBox {
  top: number;                 // viewport-space top of the clipping box (0 for window)
  clientHeight: number;
  scrollTop: number;
  setScrollTop(v: number): void;
}

function readBox(useWindowScroll: boolean, container: HTMLElement): ScrollBox {
  if (useWindowScroll) {
    return {
      top: 0,
      clientHeight: window.innerHeight,
      scrollTop: window.scrollY,
      setScrollTop: v => window.scrollTo(0, v),
    };
  }
  return {
    top: container.getBoundingClientRect().top,
    clientHeight: container.clientHeight,
    scrollTop: container.scrollTop,
    setScrollTop: v => { container.scrollTop = v; },
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
    let joltRaf = 0;
    let animating = false;

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
    // C3: quick jolt to `target` — overshoot a few px, then settle.
    const jolt = (target: number) => {
      animating = true;
      const box = readBox(!!useWindowScroll, container);
      const start = box.scrollTop;
      const over = Math.min(7, Math.abs(target - start) * 0.3);
      const t0 = performance.now();
      const dur = 130;
      cancelAnimationFrame(joltRaf);
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const pos = p < 0.6
          ? start + (target + over - start) * (p / 0.6)
          : (target + over) + (target - (target + over)) * ((p - 0.6) / 0.4);
        readBox(!!useWindowScroll, container).setScrollTop(pos);
        setScrolled();
        if (p < 1) { joltRaf = requestAnimationFrame(tick); }
        else { readBox(!!useWindowScroll, container).setScrollTop(target); setScrolled(); animating = false; }
      };
      joltRaf = requestAnimationFrame(tick);
    };
    const band = () => {
      if (animating) return;
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
      if (!reduce && delta >= lineHeight() * 0.5) jolt(target);
      else { box.setScrollTop(target); setScrolled(); }
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(band); };
    const mo = new MutationObserver(schedule);
    mo.observe(container, { childList: true, subtree: true, characterData: true });
    container.addEventListener('input', schedule);
    const scrollListenTarget: Window | HTMLElement = useWindowScroll ? window : container;
    scrollListenTarget.addEventListener('scroll', setScrolled, { passive: true });
    setScrolled();
    schedule();
    return () => {
      mo.disconnect();
      container.removeEventListener('input', schedule);
      scrollListenTarget.removeEventListener('scroll', setScrolled);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(joltRaf);
    };
  }, [enabled, containerRef, editorSelector, useWindowScroll, scrolledTarget]);
}
