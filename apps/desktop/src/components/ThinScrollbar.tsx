import { useLayoutEffect, useRef, type RefObject } from 'react';

// ITEM scrollbar-minimal (Nick, option B of R7's mockup, cursor/scrollbar-mockup
// @ c67f1bdb) — a thin, quiet custom scrollbar for the writing surface's own scroll
// container ONLY (.mode-scroll / .desk-frame-scroll-cap). The app-wide
// ::-webkit-scrollbar rule (index.css, FX7 S4) is untouched everywhere else.
// Board cards (.board-text) carry NO ThinScrollbar: they grow to fit their own
// content (FX4 S4's "the reflow floor only ever grows" law), so there is no
// bounded writing-surface scroll container there to attach one to; the existing
// native thumb FX7 S4 already gave that selector is untouched.
//
// WHY NOT NATIVE: a native scrollbar has no CSS trigger for "invisible at rest,
// shown only while scrolling/hovering/dragging, fading ~1s after the LAST of those
// stops" — ::-webkit-scrollbar-thumb has no "idle" pseudo-class and no timer. This
// is therefore a real DOM overlay, driven by the target's own scroll/pointer events,
// not a CSS-only treatment.
//
// THE "FULL HEIGHT" REQUIREMENT, BY CONSTRUCTION: rather than reading a measured
// px/vh figure out of index.css (several of this app's scroll-container height rules
// carry their own explicit, measured history — e.g. .desk-frame-stage's own
// flex:0 1 auto on .desk-frame-scroll-cap is a NAMED fix for a real horizontal-
// centering regression, not an accidental height cap; `.mode-page`'s narrow-shell
// height:min(60vh,580px) is a DELIBERATE "simulated paper" ceiling below the 1100px
// framed threshold), this component tracks the target's OWN getBoundingClientRect()
// directly — on mount, on every scroll/resize, and freshly again every time it is
// about to SHOW (see `show()` below) — so its track is always exactly as tall as
// the target's own rendered box, never stale and never guessed, proven in this
// file's own harness check (scripts/harness/scrollbar-minimal.mjs) by comparing
// the two rects directly rather than asserting a specific number.
//
// WHERE THE TARGET COMES FROM (Fable's review, item scrollbar-minimal): this
// USED to find its target via `previousElementSibling`, which measured the wrong
// element in ModeStage (S5 read the track ~107px off; S4/S7's hover-only paths
// never activated at all, since the mismeasured rect's own bounds didn't cover the
// real pointer position). An explicit `target` ref — the SAME ref each host
// component already attaches to its own scroll container (ModeStage's
// `scrollRef`, ScriptEditor's `scrollCapRef`) — removes the DOM-shape guesswork
// entirely: the overlay measures exactly the element its host says to measure,
// never a sibling inferred from render order.
const FADE_OUT_DELAY_MS = 1000;
const MIN_THUMB_PX = 24;
const THICKNESS_PX = 4;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ThinScrollbar({ target: targetRef }: { target: RefObject<HTMLElement | null> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const thumb = thumbRef.current;
    const target = targetRef.current;
    if (!root || !thumb || !target) return undefined;

    let hideTimer: number | null = null;
    let dragging = false;

    const clearHideTimer = () => { if (hideTimer !== null) { window.clearTimeout(hideTimer); hideTimer = null; } };

    // THE TRACK — mirrors the target's own rendered rect exactly (see the file
    // header: this is what makes "full height" true by construction, not by a
    // guessed CSS number).
    const layoutRoot = () => {
      const r = target.getBoundingClientRect();
      root.style.top = `${r.top}px`;
      root.style.left = `${r.right - THICKNESS_PX}px`;
      root.style.height = `${r.height}px`;
      if (target.scrollHeight <= target.clientHeight + 1) { root.style.display = 'none'; return; }
      root.style.display = '';
    };

    // THE THUMB — size/position from the target's own scroll metrics, every time
    // either changes.
    const layoutThumb = () => {
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollHeight <= clientHeight) return;
      const trackH = clientHeight;
      const thumbH = Math.min(trackH, Math.max(MIN_THUMB_PX, (clientHeight / scrollHeight) * trackH));
      const scrollableRange = scrollHeight - clientHeight;
      const maxTop = trackH - thumbH;
      const top = scrollableRange > 0 ? maxTop * (scrollTop / scrollableRange) : 0;
      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translateY(${top}px)`;
    };

    // Re-measures right before showing, not just on scroll/resize — a layout
    // shift that happens between mount and the first hover (an incentive row
    // changing height, a font swap, a chrome-fade settling) would otherwise
    // leave the track stale until the next scroll ever corrected it.
    const show = () => { layoutRoot(); layoutThumb(); root.classList.add('active'); clearHideTimer(); };
    const scheduleHide = () => {
      if (dragging) return;
      clearHideTimer();
      hideTimer = window.setTimeout(() => root.classList.remove('active'), prefersReducedMotion() ? 0 : FADE_OUT_DELAY_MS);
    };

    const onScroll = () => { layoutRoot(); layoutThumb(); show(); scheduleHide(); };
    const onTargetEnter = () => show();
    const onTargetLeave = () => { if (!dragging) scheduleHide(); };
    // Fable's review: the overlay sits geometrically inside the target's own
    // rect (its rightmost THICKNESS_PX), but it is a SEPARATE element, not a
    // descendant — so hit-testing resolves the pointer to the overlay once it
    // covers that strip, and the target's own `mouseleave` fires even though
    // the pointer never actually left the writing surface. Mirroring the same
    // show/scheduleHide pair on the overlay itself closes that gap: moving
    // from the target onto the thumb schedules a hide (target leave) that the
    // overlay's own enter immediately cancels (show() clears the timer).
    const onBarEnter = () => show();
    const onBarLeave = () => { if (!dragging) scheduleHide(); };

    const onThumbPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      dragging = true;
      show();
      const startY = e.clientY;
      const startScrollTop = target.scrollTop;
      const { scrollHeight, clientHeight } = target;
      const trackH = clientHeight;
      const thumbH = thumb.getBoundingClientRect().height;
      const maxTop = trackH - thumbH;
      const scrollableRange = scrollHeight - clientHeight;
      const onMove = (ev: PointerEvent) => {
        const dy = ev.clientY - startY;
        const deltaScroll = maxTop > 0 ? (dy / maxTop) * scrollableRange : 0;
        target.scrollTop = Math.max(0, Math.min(scrollableRange, startScrollTop + deltaScroll));
      };
      const onUp = () => {
        dragging = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        scheduleHide();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    layoutRoot();
    layoutThumb();
    target.addEventListener('scroll', onScroll, { passive: true });
    target.addEventListener('mouseenter', onTargetEnter);
    target.addEventListener('mouseleave', onTargetLeave);
    root.addEventListener('mouseenter', onBarEnter);
    root.addEventListener('mouseleave', onBarLeave);
    thumb.addEventListener('pointerdown', onThumbPointerDown);
    window.addEventListener('resize', layoutRoot);
    const ro = new ResizeObserver(() => { layoutRoot(); layoutThumb(); });
    ro.observe(target);

    return () => {
      clearHideTimer();
      target.removeEventListener('scroll', onScroll);
      target.removeEventListener('mouseenter', onTargetEnter);
      target.removeEventListener('mouseleave', onTargetLeave);
      root.removeEventListener('mouseenter', onBarEnter);
      root.removeEventListener('mouseleave', onBarLeave);
      thumb.removeEventListener('pointerdown', onThumbPointerDown);
      window.removeEventListener('resize', layoutRoot);
      ro.disconnect();
    };
  }, [targetRef]);

  return (
    <div ref={rootRef} className="wz-thin-scrollbar" aria-hidden="true">
      <div ref={thumbRef} className="wz-thin-scrollbar-thumb" />
    </div>
  );
}

/** Test/inspection seam — the resumeVocab.ts / wrizoVocab pattern. */
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoThinScrollbar?: unknown }).wrizoThinScrollbar = {
    FADE_OUT_DELAY_MS, MIN_THUMB_PX, THICKNESS_PX,
  };
}
