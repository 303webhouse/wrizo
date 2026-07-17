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
// FX3 S3 — Nick's desktop-sitting verdict on his own test page: the first
// line started "too far down," read broken to a fresh eye. Lowered from
// 0.45 into the brief's 30-35% fence. Left as a single top-level constant
// (not parameterized) — unlike CONTAINER_HOLD_BAND below, this value never
// actually reaches the Journal surface: JournalEntry.tsx's window-scroll
// call never applies `--tw-start-offset` in CSS at all (only `.mode-scroll`
// and `.desk-frame-scroll-cap` read it — see index.css; `.entry-full` does
// not), so the Journal start-offset carve-out (ink coordinates; standing
// ruling) already holds structurally, with nothing extra needed here.
// Retuned once more after discovering fx1.mjs's own (more semantically
// correct) measurement of "where the text visually starts" includes
// .mode-page's own top padding (30px, scaled) ON TOP of this fraction's
// own --tw-start-offset contribution — the two together are what a writer
// actually SEES as "where the first line sits." 0.33 alone landed the
// RAW --tw-start-offset in-band but put the true VISUAL position at ~37%,
// just outside the fence. 0.29 puts the visual position at ~33-34% (both
// 1280px and the S2-scaled 2200px), comfortably centered — verified
// empirically, not just derived (see fx3.mjs's own S3 checks).
const START_FRACTION = 0.29;
// FX3 S3 — same verdict, second half: "the first scroll engaged late."
// TYPEWRITER_BAND alone governs how soon the hold-scroll triggers, and it's
// a SHARED constant read by every useTypewriterFade caller, including
// Journal's own window-scroll call — lowering it in place would also
// retune Journal's scroll-engage feel, which the brief's carve-out does not
// ask for. CONTAINER_HOLD_BAND is a lower value threaded ONLY into the
// container-mode calls this ticket actually owns (ModeStage.tsx,
// ScriptEditor.tsx — both framed "paper" surfaces); Journal's call passes
// no `holdBand` override and keeps the exact original TYPEWRITER_BAND
// (0.73), untouched. Tuned empirically (typing simulated in the built app,
// not just derived on paper) so the fade/scroll engages within the first
// few lines of the new, lower start band rather than lagging for a dozen
// lines the way a naive "just lower START_FRACTION" change would (S1's
// stage-fill height increase means the OLD 0.73 paired with the NEW, lower
// start fraction would have pushed first-engagement even later, not
// sooner — the two constants have to move together).
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
}

export function useTypewriterFade({ enabled, containerRef, editorSelector, useWindowScroll, scrolledTarget, holdBand }: Options): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;
    const holdBandValue = holdBand ?? TYPEWRITER_BAND;
    const scrolledEl = scrolledTarget?.current ?? container;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const setScrolled = () => {
      // Window mode: gate on the SHEET's own top vs the viewport (has content
      // actually scrolled past the fold?), not raw window.scrollY — a page
      // can be scrolled a little (chrome above the sheet moving out of view)
      // while the sheet's first line is still fully below the viewport top.
      // Using window.scrollY there (Fable W1-R3) washed line 1 into paper on
      // a short-but-scrolled page, violating C2. Container mode: the box's
      // own scrollTop past its own rest position (0) — this is the "fade-
      // trigger threshold, separate from the start offset" S3 went looking
      // for. FX3 S3 fix — this previously read `box.scrollTop - box.top`,
      // subtracting the box's VIEWPORT-space Y position (readBox's own
      // `top`, ~150px in the framed layout) from its scroll offset, a unit
      // mismatch: on any layout where the scroll box doesn't sit within a
      // few px of the viewport's own top (every framed surface, pre- and
      // post-S1), that left `data-scrolled` needing scrollTop > ~150px to
      // ever flip true — the mask-image fade was structurally stuck off for
      // many lines after the auto-scroll (CONTAINER_HOLD_BAND, above) had
      // already kicked in, exactly Nick's "the first scroll engaged late"
      // (auto-scroll and its own visual fade lagging out of step). The fix
      // is simply the box's own scrollTop against its own rest position.
      const scrolled = useWindowScroll
        ? container.getBoundingClientRect().top < -4
        : (() => { const box = readBox(false, container); return box.scrollTop > 4; })();
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
      const delta = within - box.clientHeight * holdBandValue;
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
  }, [enabled, containerRef, editorSelector, useWindowScroll, scrolledTarget, holdBand]);
}
