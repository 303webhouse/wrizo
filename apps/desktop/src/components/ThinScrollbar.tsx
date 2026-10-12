import { useEffect, useRef } from 'react';

// ITEM scrollbar-minimal (Nick, option B of R7's mockup, cursor/scrollbar-mockup
// @ c67f1bdb) — a thin, quiet custom scrollbar for the writing surface's own scroll
// container ONLY (.mode-scroll / .desk-frame-scroll-cap / .board-text). The app-wide
// ::-webkit-scrollbar rule (index.css, FX7 S4) is untouched everywhere else.
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
// directly, on mount/scroll/resize. Its track is always exactly as tall as the
// target's own rendered box — never shorter, never guessed — so whatever that box's
// true height is, this scrollbar's track matches it exactly, proven in this file's
// own harness check (scripts/harness/scrollbar-minimal.mjs) by comparing the two
// rects directly rather than asserting a specific number.
//
// WHERE THE TARGET COMES FROM: this component takes no target prop. It is rendered
// as the scroll container's own NEXT SIBLING in the DOM (one line added at each of
// the three call sites) and finds it via `previousElementSibling` at mount — the
// same reason FX8's own `.board-text` pattern needs this to work per-CARD on a board
// with many cards open at once: a prop-threaded ref would need plumbing through
// three unrelated host components for the same job a DOM lookup already does.

const FADE_OUT_DELAY_MS = 1000;
const MIN_THUMB_PX = 24;
const THICKNESS_PX = 4;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ThinScrollbar() {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const thumb = thumbRef.current;
    const target = root?.previousElementSibling as HTMLElement | null;
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

    const show = () => { root.classList.add('active'); clearHideTimer(); };
    const scheduleHide = () => {
      if (dragging) return;
      clearHideTimer();
      hideTimer = window.setTimeout(() => root.classList.remove('active'), prefersReducedMotion() ? 0 : FADE_OUT_DELAY_MS);
    };

    const onScroll = () => { layoutRoot(); layoutThumb(); show(); scheduleHide(); };
    const onTargetEnter = () => show();
    const onTargetLeave = () => { if (!dragging) scheduleHide(); };

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
    thumb.addEventListener('pointerdown', onThumbPointerDown);
    window.addEventListener('resize', layoutRoot);
    const ro = new ResizeObserver(() => { layoutRoot(); layoutThumb(); });
    ro.observe(target);

    return () => {
      clearHideTimer();
      target.removeEventListener('scroll', onScroll);
      target.removeEventListener('mouseenter', onTargetEnter);
      target.removeEventListener('mouseleave', onTargetLeave);
      thumb.removeEventListener('pointerdown', onThumbPointerDown);
      window.removeEventListener('resize', layoutRoot);
      ro.disconnect();
    };
  }, []);

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
