import { useCallback, useEffect, useRef, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { useTheme } from '../store/theme';
import { SplashMark, prefersReducedMotion } from './SplashMark';

// THE SPLASH (item 187) — Nick's own hand-drawn Wrizo, over the live app, dimmed behind.
//
// Nick: "I would like the opening splash screen to be at most 1/5 the size of
// the screen with the regular app interface blurred out in the background."
//
// ITEM splash-hold (live, Nick): the first ship ran too fast and blurred, not
// dimmed. "Visible for at least 3 seconds, and the background should be faded
// out, not blurred." Two changes from that one sentence: the hold is now a
// FLOOR a writer cannot shorten (the old early-dismiss retires whole, below),
// and the veil is a flat dimming tint in the theme's own ground colour, never
// a backdrop-filter blur (see .wz-splash-veil, index.css).
//
// ITEM splash-hold ROUND 3 (Nick's ruling): "No ghost" — the front door's own
// wordmark/tagline/doors were visible THROUGH the dimmed veil the whole hold,
// racing the splash for attention. They now stay hidden for the hold's own
// duration and fade in exactly as the splash leaves (index.css's own
// `[data-splash-hold]` attribute rule on document.documentElement, set/cleared
// below — the two components never need to know about each other directly).
// The floor itself rose to 5s, and — new — the splash now ALSO waits for the
// app to be genuinely ready (`ready`, threaded from App.tsx's authState, the
// SAME derivation Arrival.tsx's own boot bar already uses): the hold is a
// floor, not a fixed duration, so a slow boot holds longer rather than
// handing off to a front door that is not ready yet. A cycling loading line
// under the mark (one of four per-theme lexicon phrases, changing ~1.4s)
// gives the hold something to say while it waits.
//
// FOUR THINGS THIS FILE IS CAREFUL ABOUT, each one measured or ruled rather
// than chosen by taste (docs/menus/splash-s0-survey.md carries the numbers):
//
// 1. IT NEVER BLOCKS WRITING, LITERALLY AND NOT NEARLY. The whole overlay is
//    `pointer-events:none` — it cannot intercept anything, so a click during
//    the splash lands in the app exactly as if the splash were not there. The
//    PASSIVE, non-capturing `window` listeners stay (splash-hold: they no
//    longer dismiss early — see below — but input still passes through them
//    exactly as before: they observe and leave, never `preventDefault`,
//    never capture, never consume). The trap this closes is specific — a
//    writer who opens Wrizo and immediately types must not have that first
//    character eaten by anything the splash does.
//
// 2. IT IS SIZED BY ITS INK, NOT ITS CANVAS. The asset is 3374x2699 but its
//    linework occupies only 3077x2458 of that (91.2% x 91.1%) — the rest is
//    transparent margin. "A fifth of the screen" is a claim about what the eye
//    sees, so the TARGET is the bounding box and the <img> is scaled up off it.
//    Sizing the canvas instead would land the visible mark at 83.1% of the
//    intended area, which is a fifth of nothing in particular.
//
// 3. THE SIZE IS ABOUT A QUARTER OF THE SCREEN'S AREA (item 187). Nick, last
//    word: "OK, let's make it ~1/4 the screen size. Doesn't need to be exact,
//    but that should be big enough to see the text a bit better, no?" This
//    supersedes the earlier fifth-of-the-WIDTH build (never run): a quarter of
//    the width grows the handwriting only a quarter, a quarter of the AREA
//    about doubles the width. It is arithmetic (CSS cannot take a geometric
//    mean portably), recomputed on resize. What the size must DO is unchanged
//    and is what splash.mjs asserts: the blurred app stays visible on all four
//    sides of the emblem, so it reads as a popup over the real app. Two caps
//    enforce that at extreme shapes - the ink height never exceeds 60% of the
//    viewport, its width never 70% - and both only ever make it smaller.
//
// 4. THE MARK FOLLOWS THE LAST-PICKED THEME (splash-sweep, docs/briefs/
//    splash-brief.md). Each theme draws its own animation — Arbor sweeps
//    Nick's hand-drawn sketch brass from IDEAS to FINAL DRAFT (SplashMark.tsx's
//    own ArborMark, cut by splash-build-kit.md's own script); Flux sweeps a
//    vector schematic of the same five steps (FluxMark). Both draw cream
//    lines/tokens on the veil's own (always-dark) ground by construction, so
//    there is no backdrop to measure any more — store/backdropTone.ts
//    (fix/splash-tone) is REMOVED here on Fable's own word: it existed to
//    choose between a cream and a warm-ink copy of ONE asset, a choice that
//    no longer exists once every theme ships its own built animation.
//
// splash-sweep ROUND 4 (Nick, live): "every [mockup] time below is multiplied
// by 0.7" and "the old 5s minimum hold is replaced by the animation's own
// length." SplashMark.tsx computes each theme's own total (reduced motion:
// instant) and calls `onFloorReached` at that point — see `holdMs()`/
// `onFloorReached` below for how that replaces the old fixed floor while
// keeping the same localStorage override (test speed) and the same 10s
// ceiling (now also this effect's floor backstop, in case a theme's
// animation never signals — belt, not the expected path).
//
// SHOWS ON EVERY OPEN (Fable's ruling), not first-run-only — `store/firstRun.ts`
// is a different concept (founding defaults, the unlock ceremony) and is
// deliberately not reused. The module-level `alreadyShown` makes it once per
// APP LOAD rather than once per mount, so a remount mid-session does not
// re-raise it.

/** The asset's measured ink bounding box inside its own canvas. */
const INK = { w: 3077, h: 2458 };
const CANVAS = { w: 3374, h: 2699 };
const FILL_X = INK.w / CANVAS.w;   // 0.9120
const FILL_Y = INK.h / CANVAS.h;   // 0.9107
const ASPECT = INK.w / INK.h;      // 1.2518

/** About a quarter of the screen's area (Nick: "~1/4 the screen size"). */
const AREA_FRACTION = 0.25;
/** The ink never exceeds this share of the viewport's height / width, so the
 *  blurred app always shows on all four sides. Only bind at extreme shapes
 *  (very wide windows / narrow portrait phones). */
const MAX_INK_HEIGHT_FRACTION = 0.6;
const MAX_INK_WIDTH_FRACTION = 0.7;

/**
 * ITEM splash-hold round 4 (Fable's review): `/auth/me` carries no time limit
 * (apps/desktop/src/store/api.ts) — a hung network would keep `ready` false
 * forever, and the floor+ready gate alone would hold the splash up forever
 * with it. This is the escape hatch: once this many ms have passed (from
 * mount, not from the floor), the hold ends regardless of readiness —
 * Arrival's own boot bar (which already renders whether ready or not) takes
 * over signalling "still working" from there. Only matters once the floor has
 * ALSO passed (tryEnd's own gate, below) — a capture pass's longer explicit
 * hold override is never cut short by this.
 *
 * splash-sweep reuses this SAME value as the floor's own backstop (`holdMs()`
 * below): the normal floor trigger is SplashMark's `onFloorReached`, fired
 * at its own per-theme computed end (Nick's round 4: "the old 5s minimum
 * hold is replaced by the animation's own length") — this timer only matters
 * if that callback never fires at all (a bug, not the expected path), so it
 * is pinned to the same "something is wrong" horizon the readiness ceiling
 * already uses rather than inventing a second one.
 */
const MAX_HOLD_MS = 10000;

/** The loading line's four per-theme lexicon phrases, and how often they cycle. */
const LOADING_LINE_KEYS: readonly DeskTermId[] = ['splashLoading1', 'splashLoading2', 'splashLoading3', 'splashLoading4'];
const LOADING_LINE_CYCLE_MS = 1400;

let alreadyShown = false;

/** The capture-pass override (test speed — e.g. '50' to skip past the splash
 *  fast), read at call time. `null` in every real launch, which is what lets
 *  `holdMs()` fall through to the backstop instead. */
function holdOverrideMs(): number | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('wrizo-splash-hold') : null;
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** The floor's own backstop timer value: the override if a capture pass set
 *  one, else MAX_HOLD_MS (see its own comment — this almost never actually
 *  fires; SplashMark's `onFloorReached` is the normal trigger). */
function holdMs(): number {
  return holdOverrideMs() ?? MAX_HOLD_MS;
}

/** Test-only seam (round 4's own ceiling check): forces `ready` to read as false
 *  regardless of the real prop, so a harness can prove the ceiling fires without
 *  actually hanging a network call. Unset in every real launch. */
function forcedNotReady(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('wrizo-splash-force-not-ready') === '1';
  } catch {
    return false;
  }
}

export function splashSizeFor(vw: number, vh: number) {
  const byArea = Math.sqrt(vw * vh * AREA_FRACTION * ASPECT);
  const inkW = Math.min(byArea, vh * MAX_INK_HEIGHT_FRACTION * ASPECT, vw * MAX_INK_WIDTH_FRACTION);
  const inkH = inkW / ASPECT;
  return { width: inkW / FILL_X, height: inkH / FILL_Y, inkW, inkH };
}

export function Splash({ ready }: { ready: boolean }) {
  // Read the flag during the first render rather than in an effect: an effect
  // would let a remount paint one frame of a splash it is about to retract.
  // ROUND 5 (Fable's review) — `data-splash-hold` moves here too, for the SAME
  // reason: setting it in the mount effect let the front door paint ONE frame
  // visible (~0.33s, measured) before the effect ran and hid it. This runs
  // synchronously during the first render, before that frame ever paints.
  const [live, setLive] = useState(() => {
    if (alreadyShown) return false;
    alreadyShown = true;
    if (typeof document !== 'undefined') document.documentElement.dataset.splashHold = 'true';
    return true;
  });
  const [leaving, setLeaving] = useState(false);
  const [box, setBox] = useState(() => (typeof window === 'undefined'
    ? { width: 0, height: 0 }
    : splashSizeFor(window.innerWidth, window.innerHeight)));
  const [lineIndex, setLineIndex] = useState(0);
  const goneRef = useRef(false);
  // The floor (holdMs()) and readiness (the `ready` prop) each end the hold only
  // together — neither alone. Refs, not state: the timer's own closure and the
  // ready-effect below both need the OTHER condition's latest value without
  // re-running the mount effect (which would restart the timer and the
  // listeners on every authState change).
  const floorPassedRef = useRef(false);
  const ceilingPassedRef = useRef(false);
  const readyRef = useRef(ready);
  readyRef.current = ready && !forcedNotReady();
  const { t } = useDeskLexicon();
  const theme = useTheme();
  // Checked once per mount (the same one-shot idiom this codebase already
  // uses — HomeFlow.tsx/RhizomeField.tsx/UnlockCeremony.tsx — nobody flips
  // the OS setting mid-splash), not a reactive subscription.
  const [reduced] = useState(prefersReducedMotion);

  // splash-sweep: SplashMark's own per-theme timeline calls this once, at
  // the point its animation reaches the brief's "a short hold, then the
  // fade" — the NEW floor trigger (Nick's round 4), replacing the old fixed
  // 5s timer. A stable identity (refs, not the effect's own `tryEnd`
  // closure) so SplashMark's mount effect never needs to re-run when this
  // component re-renders.
  const tryEndRef = useRef<(() => void) | null>(null);
  const onFloorReached = useCallback(() => {
    floorPassedRef.current = true;
    tryEndRef.current?.();
  }, []);

  useEffect(() => {
    if (!live) return undefined;

    const resize = () => setBox(splashSizeFor(window.innerWidth, window.innerHeight));
    resize();

    const tryEnd = () => {
      if (goneRef.current || !floorPassedRef.current) return;
      if (!readyRef.current && !ceilingPassedRef.current) return;
      goneRef.current = true;
      delete document.documentElement.dataset.splashHold;
      setLeaving(true);
    };
    tryEndRef.current = tryEnd;

    // ITEM splash-hold, SUPERSEDED: the hold used to be a MAXIMUM, ended early by
    // the first keydown/pointerdown/wheel/touchstart (dismiss() called from each).
    // Nick's own word made the hold a FLOOR instead ("visible for at least 3
    // seconds") — nothing shortens it now, so these four listeners no longer call
    // anything. ROUND 3: the floor alone no longer ends the hold either — it only
    // flips floorPassedRef, and tryEnd() (called here AND from the ready-effect
    // below) is what actually ends it, once both conditions hold. ROUND 4: a third
    // way in — the ceiling timer flips ceilingPassedRef, letting tryEnd proceed even
    // with readyRef still false (but ONLY once the floor has also passed, same gate
    // everything else goes through — a capture pass's longer explicit hold is safe).
    const hold = window.setTimeout(() => { floorPassedRef.current = true; tryEnd(); }, holdMs());
    const ceiling = window.setTimeout(() => { ceilingPassedRef.current = true; tryEnd(); }, MAX_HOLD_MS);
    const lineCycle = window.setInterval(() => setLineIndex((i) => (i + 1) % LOADING_LINE_KEYS.length), LOADING_LINE_CYCLE_MS);

    // PASSIVE, non-capturing, on window — kept for the same reason they always
    // existed: proof that input reaches the app untouched while the splash is
    // live (S2/S3's own claim). They observe and leave; they never dismiss
    // anything now, never `preventDefault`, never capture, never consume.
    const noop = () => {};
    const opts: AddEventListenerOptions = { passive: true, capture: false };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, noop, opts));
    window.addEventListener('resize', resize);

    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(ceiling);
      window.clearInterval(lineCycle);
      events.forEach((e) => window.removeEventListener(e, noop, opts));
      window.removeEventListener('resize', resize);
      tryEndRef.current = null;
      // Defensive, not the normal path (tryEnd already clears this when leaving
      // starts): an unmount with the hold never having ended must not leave the
      // front door's content hidden forever.
      delete document.documentElement.dataset.splashHold;
    };
  }, [live]);

  // Re-checks the SAME tryEnd condition whenever `ready` flips true — the case
  // where the app becomes ready AFTER the floor has already passed (the mount
  // effect's own timeout already fired and found `readyRef.current` still
  // false back then, so nothing else would ever re-check it). Round 4's own
  // force-not-ready seam applies here too — a test proving the ceiling must not
  // have THIS effect quietly end the hold anyway the moment `ready` turns true.
  useEffect(() => {
    if (!live || !ready || forcedNotReady() || !floorPassedRef.current || goneRef.current) return;
    goneRef.current = true;
    delete document.documentElement.dataset.splashHold;
    setLeaving(true);
  }, [ready, live]);

  // The fade-out's end is what unmounts it. Reduced motion zeroes the
  // transition, so `transitionend` may never arrive — hence the timer as the
  // floor. Whichever lands first wins; neither is trusted alone.
  useEffect(() => {
    if (!leaving) return undefined;
    // splash-sweep: the brief's own fade is 0.45s (index.css's .wz-splash-veil/
    // -mark/-loading transitions moved from .38s to match) — this timer stays a
    // touch above it (the same ~40ms buffer the old 380/420 pair kept), the
    // floor this component trusts when reduced motion drops `transitionend`.
    const t = window.setTimeout(() => setLive(false), 490);
    return () => window.clearTimeout(t);
  }, [leaving]);

  if (!live) return null;

  return (
    <div
      className="wz-splash"
      data-leaving={leaving ? 'true' : 'false'}
      data-splash-theme={theme}
      aria-hidden="true"
      // ROUND 5 — `--mark-h` lets index.css's own .wz-splash-loading anchor itself
      // just below the drawing's own measured edge (CSS has no sibling-height
      // combinator), so the loading line can be an absolutely-positioned element,
      // never a flex participant that could shift the drawing off true centre again.
      style={{ ['--mark-h' as unknown as string]: `${box.height}px` } as React.CSSProperties}
    >
      <div className="wz-splash-veil" />
      <div
        className="wz-splash-mark"
        style={{ width: `${box.width}px`, height: `${box.height}px` }}
        onTransitionEnd={() => { if (leaving) setLive(false); }}
      >
        <SplashMark theme={theme} reduced={reduced} width={box.width} height={box.height} onFloorReached={onFloorReached} />
      </div>
      {/* role="status" (Nick's ruling): announced politely, never interrupting.
          `key` forces a remount on every line change, restarting the CSS fade —
          reduced motion drops that animation entirely (index.css), an instant swap. */}
      {t(LOADING_LINE_KEYS[lineIndex]) !== '' && (
        <div className="wz-splash-loading" role="status">
          <span key={lineIndex} className="wz-splash-loading-text">{t(LOADING_LINE_KEYS[lineIndex])}</span>
        </div>
      )}
    </div>
  );
}

/** Test/inspection seam — the frame pass and splash.mjs read THIS code's sizing.
 *  `HOLD_MS` SUPERSEDED (splash-sweep): there is no longer one fixed floor to
 *  report — `holdMs()` now returns the override-or-backstop (see its own
 *  comment), not a per-theme animation length, so splash.mjs measures the
 *  real floor empirically (elapsed time to `data-leaving`) instead of
 *  comparing against a reported constant. */
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoSplash?: unknown }).wrizoSplash = {
    sizeFor: splashSizeFor,
    reset: () => { alreadyShown = false; },
    MAX_HOLD_MS,
    holdMs,
    INK,
    CANVAS,
  };
}
