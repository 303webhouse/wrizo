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

// A single shared probe (harness-only; see the ROUND 4 comment on `tick`
// below) — fine as a module-level singleton since only one ThinScrollbar is
// ever the subject of a diagnostic pass at a time.
// ROUND 5 (Fable, review) — pointerX/pointerY added: the round-4 log could
// show the thumb's own box moving but not WHERE THE POINTER WAS, so
// `hoverDepth` reading 0 while the box sat somewhere else was unexplained —
// one of those could be the pointer genuinely leaving the box's moving
// position, the other the box leaving the (stationary) pointer. Tracked
// unconditionally (one cheap listener) so the probe can answer this on the
// very next capture without a second round-trip.
type ProbeSample = { t: number; hoverDepth: number; active: boolean; thumbTop: number; thumbLeft: number; thumbHeight: number; pointerX: number; pointerY: number };
const probe: { on: boolean; startedAt: number; log: ProbeSample[] } = { on: false, startedAt: 0, log: [] };

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
    // ROUND 5 — see the probe's own header comment above.
    let lastPointerX = NaN;
    let lastPointerY = NaN;
    const onPointerMove = (e: PointerEvent) => { lastPointerX = e.clientX; lastPointerY = e.clientY; };

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

    // ROUND 2 (Fable's review, c22b9f30): an explicit target ref did not fix
    // Prose's own ~107px top mismatch — ruled out, exhaustively: the ref IS
    // `.mode-scroll` (confirmed at the call site), and there is no
    // transform/filter/contain/will-change/perspective/backdrop-filter
    // anywhere in the ancestor chain, in index.css OR any inline JSX style,
    // that could hand `position:fixed` a containing block other than the
    // viewport. The round-2 fix gated continuous re-measurement behind
    // `active` — which Chat 1 then correctly named as ITS OWN bug: Prose's
    // own `--font-prose` is a variable font (@fontsource-variable/crimson-pro,
    // a larger file than Script's two static Courier Prime weights) that can
    // still be settling its metrics (and therefore `.mode-scroll`'s own
    // scrollHeight) after mount — if that settling finishes AFTER the one
    // scroll this harness fires but the bar is not YET (or no longer)
    // `active` at that exact moment, the loop that only ticks while shown
    // never saw the correction land, and froze whatever stale rect it had.
    // ROUND 3: ticking no longer depends on `active` AT ALL for the first
    // settle window after mount — it runs unconditionally for SETTLE_MS,
    // covering exactly this class of late, event-less reflow, and ALSO
    // continues running whenever `active` is true afterward (real
    // scroll/hover/drag), by the same reasoning as round 2's own comment:
    // self-heal within one frame, don't trust any single measurement.
    const SETTLE_MS = 2000;
    const mountedAt = Date.now();
    let rafId: number | null = null;
    // Fable: "prove it, don't theorise" — a per-frame probe, off by default,
    // switched on by the harness around exactly the window S4 holds the
    // pointer still. Records hoverDepth/active/the thumb's own rendered rect
    // every tick, so whichever of those three actually moves (if any) is
    // visible in the captured log rather than argued from a static read of
    // the source. No cost when not probing (one boolean check per tick).
    const tick = () => {
      layoutRoot();
      layoutThumb();
      if (probe.on) {
        const tr = thumb.getBoundingClientRect();
        probe.log.push({
          t: Math.round(performance.now() - probe.startedAt),
          hoverDepth,
          active: root.classList.contains('active'),
          thumbTop: tr.top, thumbLeft: tr.left, thumbHeight: tr.height,
          pointerX: lastPointerX, pointerY: lastPointerY,
        });
      }
      const stillSettling = Date.now() - mountedAt < SETTLE_MS;
      if (stillSettling || root.classList.contains('active')) rafId = window.requestAnimationFrame(tick);
      else rafId = null;
    };
    const startTicking = () => { if (rafId === null) rafId = window.requestAnimationFrame(tick); };

    // Re-measures right before showing, not just on scroll/resize — a layout
    // shift that happens between mount and the first hover (an incentive row
    // changing height, a font swap, a chrome-fade settling) would otherwise
    // leave the track stale until the next scroll ever corrected it.
    const show = () => { layoutRoot(); layoutThumb(); root.classList.add('active'); clearHideTimer(); startTicking(); };
    // ROUND 2 fix: this used to shorten the WAIT itself to 0ms under reduced
    // motion ("the 1s delay is itself a transition this mode removes" — my
    // own earlier reasoning, and wrong). `onScroll` calls show() then
    // scheduleHide() back to back, so a 0ms wait here raced them within the
    // same tick — the hide's zero-delay timeout fires on the very next
    // macrotask, before anything (a real user's eye or a check) could ever
    // observe it shown. `prefers-reduced-motion` is about ANIMATION, not
    // about how long something stays visible — the WAIT is real behaviour
    // and stays the same in every motion mode; only the CSS transition that
    // animates the fade itself is removed (index.css's own reduced-motion
    // block already does that correctly). The wait is always real.
    const scheduleHide = () => {
      if (dragging) return;
      clearHideTimer();
      hideTimer = window.setTimeout(() => root.classList.remove('active'), FADE_OUT_DELAY_MS);
    };

    const onScroll = () => { layoutRoot(); layoutThumb(); show(); scheduleHide(); };

    // Fable's review: the overlay sits geometrically inside the target's own
    // rect (its rightmost THICKNESS_PX), but it is a SEPARATE element, not a
    // descendant — so hit-testing resolves the pointer to the overlay once it
    // covers that strip, and the target's own `mouseleave` fires even though
    // the pointer never actually left the writing surface, as the moving
    // pointer crosses from target to overlay.
    //
    // ROUND 2 fix: a plain "leave schedules, enter cancels" pair on BOTH
    // elements is ORDER-DEPENDENT — moving target→overlay fires target's
    // mouseleave and the overlay's mouseenter, but the DOM gives no guarantee
    // which fires first. Leave-then-enter cancels cleanly; enter-then-leave
    // does not — show()'s own clearHideTimer() runs on the ENTER, with
    // nothing left to cancel the hide the LEAVE then schedules immediately
    // after, which fires exactly FADE_OUT_DELAY_MS later with nobody home to
    // stop it. A depth counter makes the outcome order-independent: both
    // elements increment on enter and decrement on leave, and a hide is only
    // ever scheduled once the pointer has left BOTH — there is no instant
    // where "one is entered and the other hasn't left yet" can read as zero.
    let hoverDepth = 0;
    const onEnter = () => { hoverDepth += 1; show(); };
    const onLeave = () => {
      hoverDepth = Math.max(0, hoverDepth - 1);
      if (hoverDepth === 0 && !dragging) scheduleHide();
    };

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
        // Only schedule a hide here if the pointer isn't ALSO still resting
        // over the target or the bar (hoverDepth > 0) — a drag almost always
        // ends with the pointer still on the thumb it was dragging, and the
        // eventual real mouseleave is what should schedule the hide then.
        if (hoverDepth === 0) scheduleHide();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    layoutRoot();
    layoutThumb();
    // ROUND 5 (Fable, review, item scrollbar-minimal) — the S4 probe measured
    // the thumb's own box moving ~393px/~108px during the first ~1s after
    // mount, self-correcting by the end of the SETTLE_MS window below. The
    // strongest lead, from this file's own history: Prose's text column is
    // `width:min(760px * var(--paper-scale), 60ch)` (index.css,
    // `.desk-frame-stage--prose .mode-pagecol`) — a ch-based measure that
    // resolves against whichever font is ACTIVE at the moment of layout, and
    // `--font-prose` is a variable web font ROUND 2/3 above already named as
    // settling AFTER mount (there it changed `.mode-scroll`'s own
    // scrollHeight; the same async swap can equally move 60ch's pixel value
    // here, since that depends on the loaded font's own character metrics,
    // not the fallback's). `document.fonts.ready` is the browser's own
    // deterministic signal for "every font this document uses has finished
    // loading" — re-measuring on it removes the window where a stale rect
    // can be read (and shown) at all, rather than only ever catching the
    // correction inside the blind SETTLE_MS/rAF sweep below. NOT confirmed
    // live by this lane (no box turn this round) — Chat 1's own re-run of
    // the S4 probe is what proves whether this is the whole story.
    if (document.fonts) document.fonts.ready.then(() => { layoutRoot(); layoutThumb(); }).catch(() => {});
    startTicking(); // the SETTLE_MS window runs from mount regardless of `active`
    target.addEventListener('scroll', onScroll, { passive: true });
    target.addEventListener('mouseenter', onEnter);
    target.addEventListener('mouseleave', onLeave);
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    thumb.addEventListener('pointerdown', onThumbPointerDown);
    window.addEventListener('resize', layoutRoot);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    const ro = new ResizeObserver(() => { layoutRoot(); layoutThumb(); });
    ro.observe(target);

    return () => {
      clearHideTimer();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      target.removeEventListener('scroll', onScroll);
      target.removeEventListener('mouseenter', onEnter);
      target.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      thumb.removeEventListener('pointerdown', onThumbPointerDown);
      window.removeEventListener('resize', layoutRoot);
      window.removeEventListener('pointermove', onPointerMove);
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
    probe: {
      start: () => { probe.log = []; probe.startedAt = performance.now(); probe.on = true; },
      stop: () => { probe.on = false; },
      read: () => probe.log,
    },
  };
}
