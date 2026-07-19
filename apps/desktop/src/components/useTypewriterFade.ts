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
// FX4 S1 — Nick's 2026-07-18 sitting: the fraction moves again, this time to
// a "visual quarter" — and, for the FIRST time, the Journal carve-out this
// comment used to describe RETIRES (see the new CSS rule this ticket adds:
// `.entry-full[data-typewriter='true']{ padding-top:var(--tw-start-offset) }`
// in index.css — Journal's window-scroll call below now passes its OWN
// holdBand, see JOURNAL_HOLD_BAND, and reads this SAME fraction for the
// first time ever). Measured the fx1.mjs way (a rendered rect, not the raw
// CSS value alone — .mode-page's own top padding sits ON TOP of
// --tw-start-offset's own contribution, so the two together are what a
// writer actually SEES): at 0.25 raw, prose's VISUAL start lands at ~29.2%
// of the stage height at 1280px and ~30.0% at the S2-scaled 2200px; script's
// (no comparable extra chrome padding) lands almost exactly on the raw
// value, ~25.0% at 1280px — all three comfortably read as "about a quarter,"
// genuinely lower than the old 0.29 raw / ~33-34% visual FX3 shipped —
// verified empirically via the same harness technique FX3's own S3 used
// (fx4.mjs's own S1 section), not just derived on paper.
const START_FRACTION = 0.25;
// FX3 S3 — "the first scroll engaged late." TYPEWRITER_BAND alone governs
// how soon the hold-scroll triggers, and it's a SHARED constant read by
// every useTypewriterFade caller. CONTAINER_HOLD_BAND is threaded into the
// container-mode calls (ModeStage.tsx, ScriptEditor.tsx — both framed
// "paper" surfaces). Tuned empirically (typing simulated in the built app,
// not just derived on paper) so the fade/scroll engages within the first
// few lines of the start band rather than lagging for a dozen lines.
export const CONTAINER_HOLD_BAND = 0.46;
// FX4 S1 — Journal's own tuned engage-band, now that the carve-out retires
// and it gains real start-offset behavior for the first time. Journal is
// the WINDOW-scroll case (readBox's `useWindowScroll` branch: `box.top=0`,
// `box.clientHeight=window.innerHeight`), a materially different geometry
// from CONTAINER_HOLD_BAND's fixed-height framed box — reusing that exact
// number was never assumed to transfer (the brief's own "measure, don't
// assume"), and it took THREE separate live-diagnosed defects (documented
// in full in this ticket's own report; briefly: a caret-rect detection
// fallback that silently measured the wrong element, a `minHeight` floor
// masquerading as "the caret" on a still-empty page, and a missing bottom
// scroll buffer prose/script already had via `.mode-scroll`'s own
// `padding-bottom:30vh`, mirrored onto `.entry-full` below) before holdBand
// tuning could mean anything at all here — see index.css's own
// `.entry-full[data-typewriter='true']` rule and this file's `band()`
// function for the fixes. Measured empirically (seeded typing line by line,
// watching `data-scrolled` flip true — the same signal fx3.mjs's own S3
// checks use for prose) against the brief's own "~10 line-equivalents"
// target: 0.60 engages at line 11 of ordinary wrapped prose at a 900px-tall
// viewport, both 1280px and 2200px widths — close enough to call "about
// ten," and a fresh, untouched page does NOT auto-scroll on mount (also
// verified — a real risk with the caret-fallback fix above, guarded
// against explicitly).
export const JOURNAL_HOLD_BAND = 0.60;

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
    // FX5 S1 — engage state, kept in the effect's own closure (fresh per
    // mount, same lifetime as `raf` above). `engaged` never resets once
    // true within a mount; `prevDocCaretBottom` is the last-measured caret
    // position in scroll-INDEPENDENT "document space" (see band() below).
    let engaged = false;
    let prevDocCaretBottom: number | null = null;

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
      // FX5 S1 (b) — "the fade band starts one line lower": the topmost
      // line-height now reads fully legible, unfaded; the ramp itself
      // (same depth, --tw-fade-band above) begins at this offset instead
      // of at the very top edge. Both CSS consumers (the container mask
      // and the Journal sticky overlay) add this into their own gradient
      // stops — see index.css.
      scrolledEl.style.setProperty('--tw-fade-start', `${Math.round(lineHeight())}px`);
      scrolledEl.style.setProperty('--tw-start-offset', `${Math.round(stageHeight * START_FRACTION)}px`);
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
      if (caretBottom === null) return;
      const box = readBox(!!useWindowScroll, container);
      const within = caretBottom - box.top;
      // FX5 S1 (a, c) — "document space": the caret's position independent
      // of the CURRENT scroll offset. The OLD design recomputed an ABSOLUTE
      // `target = box.scrollTop + delta` on every keystroke, which always
      // tries to put the caret back at exactly holdBandValue's own fraction
      // of the box — a real, reproducible defect (found live, not guessed):
      // a writer who scrolls up to reread has the caret's ON-SCREEN
      // position pushed far down (or off-screen) by their own scroll, so
      // the very next keystroke computed a huge `delta` and snapped the
      // whole page back down to re-align — "typing snaps the page back to
      // the band," exactly Nick's complaint, not merely a tuning issue.
      // docCaretBottom instead tracks the caret in a coordinate space that
      // does NOT move when the box is merely scrolled (only when the
      // caret's own document position genuinely changes), so comparing it
      // against its own PREVIOUS reading isolates "how much new content did
      // the writer just produce" from "where did the viewport happen to be
      // sitting" — the two concerns S1 asks to be decoupled.
      const docCaretBottom = within + box.scrollTop;
      const thresholdPx = box.clientHeight * holdBandValue;

      if (!engaged) {
        if (within - thresholdPx <= 1) { setScrolled(); return; } // fresh/short content: don't scroll, don't fade (C2)
        // First engage (S1 a: "must not lurch"): owe exactly the same delta
        // the old absolute design would have jumped in one shot, but pay it
        // off below via the SAME one-line-at-a-time stepping every later
        // engaged call uses — one code path, no special-cased jump.
        engaged = true;
        prevDocCaretBottom = docCaretBottom - (within - thresholdPx);
      }
      const advance = docCaretBottom - (prevDocCaretBottom as number);
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
        const step = Math.min(advance, lineHeight());
        box.setScrollTop(box.scrollTop + step, !reduce);
        prevDocCaretBottom = (prevDocCaretBottom as number) + step;
        if (advance - step > 1) requestAnimationFrame(band);
      } else {
        // Caret moved to earlier content (clicked elsewhere, or a delete
        // shrank the document) — resync without scrolling; no advance is
        // "owed" backward.
        prevDocCaretBottom = docCaretBottom;
      }
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
