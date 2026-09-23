import { useEffect, useRef, useState } from 'react';
import { measureBackdropTone, type BackdropTone } from '../store/backdropTone';

// THE SPLASH (item 187) — Nick's own hand-drawn Wrizo, over the live app, blurred behind.
//
// Nick: "I would like the opening splash screen to be at most 1/5 the size of
// the screen with the regular app interface blurred out in the background."
//
// FOUR THINGS THIS FILE IS CAREFUL ABOUT, each one measured or ruled rather
// than chosen by taste (docs/menus/splash-s0-survey.md carries the numbers):
//
// 1. IT NEVER BLOCKS WRITING, LITERALLY AND NOT NEARLY. The whole overlay is
//    `pointer-events:none` — it cannot intercept anything, so a click during
//    the splash lands in the app exactly as if the splash were not there. The
//    dismissal listeners are PASSIVE and on `window`: they observe input and
//    leave; they never `preventDefault`, never capture, never consume. The
//    trap this closes is specific — a writer who opens Wrizo and immediately
//    types must not have that first character eaten as "the dismiss gesture".
//    The splash is dismissible, never dismissal-REQUIRING.
//
// 2. IT IS SIZED BY ITS INK, NOT ITS CANVAS. The asset is 3374x2699 but its
//    linework occupies only 3077x2458 of that (91.2% x 91.1%) — the rest is
//    transparent margin. "A fifth of the screen" is a claim about what the eye
//    sees, so the TARGET is the bounding box and the <img> is scaled up off it.
//    Sizing the canvas instead would land the visible mark at 83.1% of the
//    intended area, which is a fifth of nothing in particular.
//
// 3. THE SIZE IS A FIFTH OF THE SCREEN'S WIDTH (item 187, Fable's ruling on
//    Nick's answer: "I'm not super picky on the splash size. I just want it to
//    be smaller than the background so it's clear it's just a popup over the
//    real app"). A fifth of the width is well under a fifth of the AREA, so it
//    is legal under BOTH readings of "at most 1/5" — no reading of his words is
//    broken. What the size must DO is leave the blurred app visible on all four
//    sides of the emblem; splash.mjs asserts that, not a pixel value. It is
//    plain arithmetic recomputed on resize (the earlier AREA build and its
//    two-frame switch are withdrawn: he was not picky, so there is nothing to
//    pick). At absurdly wide windows the ink HEIGHT is capped at 60% of the
//    viewport so the top/bottom margins can never vanish — the cap only ever
//    makes the emblem smaller, so it stays legal under every reading.
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

/** A fifth of the screen's width (Fable's ruling within Nick's "not picky"). */
const WIDTH_FRACTION = 0.2;
/** The ink never exceeds this share of the viewport's height, so the blurred
 *  app always shows above and below it. Only ever binds at extreme aspects. */
const MAX_INK_HEIGHT_FRACTION = 0.6;

/**
 * How long the emblem holds if nothing at all happens. A maximum, never a wait.
 * Overridable through localStorage (read at call time), so a capture pass can
 * hold the emblem still long enough to photograph it instead of racing a timer.
 */
const DEFAULT_HOLD_MS = 1200;

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
  const inkW = Math.min(vw * WIDTH_FRACTION, vh * MAX_INK_HEIGHT_FRACTION * ASPECT);
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

    const dismiss = () => {
      if (goneRef.current) return;
      goneRef.current = true;
      setLeaving(true);
    };

    const hold = window.setTimeout(dismiss, holdMs());

    // PASSIVE, non-capturing, on window. Every one of these fires AFTER the
    // app has already had the event — dismissing is a side effect of the
    // writer's input, never a toll on it.
    const opts: AddEventListenerOptions = { passive: true, capture: false };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, dismiss, opts));
    window.addEventListener('resize', resize);

    return () => {
      window.clearTimeout(hold);
      events.forEach((e) => window.removeEventListener(e, dismiss, opts));
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
