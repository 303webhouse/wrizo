import { useEffect, useRef, useState } from 'react';
import { measureBackdropTone, type BackdropTone } from '../store/backdropTone';

// THE SPLASH — Nick's own hand-drawn Wrizo, over the live app, blurred behind.
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
// 3. THE AREA READING IS COMPUTED, NOT APPROXIMATED IN CSS. A fifth of the
//    AREA needs the geometric mean of the viewport's two dimensions, which CSS
//    cannot express portably (`sqrt()` is Values-4 and not dependable here), so
//    it is arithmetic in JS, recomputed on resize. The alternative — a vw/vh
//    approximation — would be a number that is right at one aspect ratio and
//    quietly wrong at every other.
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

/** Nick's ceiling. "At most 1/5" — this sits exactly at it. */
const AREA_FRACTION = 0.2;
const WIDTH_FRACTION = 0.2;

/**
 * How long the emblem holds if nothing at all happens. A maximum, never a wait.
 * Overridable only through the same frame seam below, so a capture pass can
 * hold the emblem still long enough to photograph it instead of racing a timer.
 */
const DEFAULT_HOLD_MS = 1200;

/**
 * Which reading of "1/5 the size" to render. Fable: build to AREA until Nick
 * picks from the two frames. The mode is switchable — rather than forking the
 * component — so the frames he chooses between are made by THIS code and not
 * by a copy of it that could drift from what ships.
 */
export type SplashSizing = 'area' | 'width';

/**
 * THE FRAME SEAM. Nick chooses between the two readings by looking at two
 * headful frames, and those frames have to be made by THIS component — a
 * copy of it in a script could drift from what ships, and then he would be
 * choosing between pictures of something that no longer exists.
 *
 * Module state alone cannot do that: the frame pass must RELOAD between the
 * two renders (the splash shows once per app load), and a reload resets module
 * state. So the override is read from localStorage at module init, exactly
 * like the store seams this codebase already uses. Unset — which is every real
 * launch — it is simply 'area', Fable's ruled default.
 */
function readOverride<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return (allowed as readonly string[]).includes(raw ?? '') ? (raw as T) : fallback;
  } catch {
    return fallback;
  }
}

let sizingMode: SplashSizing = readOverride('wrizo-splash-sizing', ['area', 'width'] as const, 'area');

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

export function splashSizeFor(vw: number, vh: number, mode: SplashSizing = sizingMode) {
  let inkW: number;
  let inkH: number;
  if (mode === 'width') {
    inkW = vw * WIDTH_FRACTION;
    inkH = inkW / ASPECT;
  } else {
    inkH = Math.sqrt((vw * vh * AREA_FRACTION) / ASPECT);
    inkW = inkH * ASPECT;
  }
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

/** Test/inspection seam — lets the frame pass render both readings from THIS code. */
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoSplash?: unknown }).wrizoSplash = {
    sizeFor: splashSizeFor,
    setSizing: (m: SplashSizing) => { sizingMode = m; },
    getSizing: () => sizingMode,
    reset: () => { alreadyShown = false; },
    HOLD_MS: DEFAULT_HOLD_MS,
    holdMs,
    INK,
    CANVAS,
  };
}
