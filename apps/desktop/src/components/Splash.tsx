import { useEffect, useRef, useState } from 'react';
import { measureBackdropTone, type BackdropTone } from '../store/backdropTone';

// THE SPLASH (item 187) — Nick's own hand-drawn Wrizo, over the live app, dimmed behind.
//
// Nick: "I would like the opening splash screen to be at most 1/5 the size of
// the screen with the regular app interface blurred out in the background."
//
// ITEM splash-hold (live, Nick): the first ship ran too fast and blurred, not
// dimmed. "Visible for at least 3 seconds, and the background should be faded
// out, not blurred." Two changes from that one sentence: the hold is now a
// FLOOR a writer cannot shorten (S6's old early-dismiss retires whole, below),
// and the veil is a flat dimming tint in the theme's own ground colour, never
// a backdrop-filter blur (see .wz-splash-veil, index.css).
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
// 4. THE ASSET FOLLOWS THE MEASURED BACKDROP, not a theme map. See
//    store/backdropTone.ts for why a `data-theme` map would have been the
//    stale-list failure this arc keeps naming.
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
 * How long the emblem holds. ITEM splash-hold (Nick, live): "visible for at
 * least 3 seconds" — this is now a FLOOR, not a maximum; nothing shortens it
 * (the old early-dismiss-on-input retires whole, below). Overridable through
 * localStorage (read at call time), so a capture pass can hold the emblem
 * for a different span instead of racing this one.
 */
const DEFAULT_HOLD_MS = 3000;

let alreadyShown = false;

/** The hold, with the capture override applied. Unset in every real launch. */
function holdMs(): number {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('wrizo-splash-hold') : null;
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_HOLD_MS;
  } catch {
    return DEFAULT_HOLD_MS;
  }
}

export function splashSizeFor(vw: number, vh: number) {
  const byArea = Math.sqrt(vw * vh * AREA_FRACTION * ASPECT);
  const inkW = Math.min(byArea, vh * MAX_INK_HEIGHT_FRACTION * ASPECT, vw * MAX_INK_WIDTH_FRACTION);
  const inkH = inkW / ASPECT;
  return { width: inkW / FILL_X, height: inkH / FILL_Y, inkW, inkH };
}

export function Splash() {
  // Read the flag during the first render rather than in an effect: an effect
  // would let a remount paint one frame of a splash it is about to retract.
  const [live, setLive] = useState(() => {
    if (alreadyShown) return false;
    alreadyShown = true;
    return true;
  });
  const [leaving, setLeaving] = useState(false);
  const [tone, setTone] = useState<BackdropTone>('dark');
  const [box, setBox] = useState(() => (typeof window === 'undefined'
    ? { width: 0, height: 0 }
    : splashSizeFor(window.innerWidth, window.innerHeight)));
  const goneRef = useRef(false);

  useEffect(() => {
    if (!live) return undefined;

    // Measured AFTER mount, deliberately: the probe reads through this very
    // overlay (it is pointer-events:none), so it sees the app's own backdrop
    // rather than anything this component paints.
    setTone(measureBackdropTone());

    const resize = () => setBox(splashSizeFor(window.innerWidth, window.innerHeight));
    resize();

    const endHold = () => {
      if (goneRef.current) return;
      goneRef.current = true;
      setLeaving(true);
    };

    // ITEM splash-hold, SUPERSEDED: the hold used to be a MAXIMUM, ended early by
    // the first keydown/pointerdown/wheel/touchstart (dismiss() called from each).
    // Nick's own word made the hold a FLOOR instead ("visible for at least 3
    // seconds") — nothing shortens it now, so these four listeners no longer call
    // anything. ONLY `window.setTimeout(endHold, holdMs())` below ends the hold.
    const hold = window.setTimeout(endHold, holdMs());

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
      events.forEach((e) => window.removeEventListener(e, noop, opts));
      window.removeEventListener('resize', resize);
    };
  }, [live]);

  // The fade-out's end is what unmounts it. Reduced motion zeroes the
  // transition, so `transitionend` may never arrive — hence the timer as the
  // floor. Whichever lands first wins; neither is trusted alone.
  useEffect(() => {
    if (!leaving) return undefined;
    const t = window.setTimeout(() => setLive(false), 420);
    return () => window.clearTimeout(t);
  }, [leaving]);

  if (!live) return null;

  const src = tone === 'dark'
    ? '/brand/wrizo-sketch-for-dark-theme.png'
    : '/brand/wrizo-sketch-for-light-theme.png';

  return (
    <div className="wz-splash" data-leaving={leaving ? 'true' : 'false'} data-tone={tone} aria-hidden="true">
      <div className="wz-splash-veil" />
      <img
        className="wz-splash-mark"
        src={src}
        alt=""
        draggable={false}
        style={{ width: `${box.width}px`, height: `${box.height}px` }}
        onTransitionEnd={() => { if (leaving) setLive(false); }}
      />
    </div>
  );
}

/** Test/inspection seam — the frame pass and splash.mjs read THIS code's sizing. */
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoSplash?: unknown }).wrizoSplash = {
    sizeFor: splashSizeFor,
    reset: () => { alreadyShown = false; },
    HOLD_MS: DEFAULT_HOLD_MS,
    holdMs,
    INK,
    CANVAS,
  };
}
