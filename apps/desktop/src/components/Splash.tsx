import { useEffect, useRef, useState } from 'react';
import { measureBackdropTone, type BackdropTone } from '../store/backdropTone';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';

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
 * How long the emblem holds, AT LEAST. ITEM splash-hold round 3 (Nick, live):
 * "Minimum 5s per app load, longer if the app isn't ready yet" — raised from
 * round 1's 3s floor. Nothing shortens it (the old early-dismiss-on-input
 * retired whole in round 1). Overridable through localStorage (read at call
 * time), so a capture pass can hold the emblem for a different span instead
 * of racing this one.
 */
const DEFAULT_HOLD_MS = 5000;

/** The loading line's four per-theme lexicon phrases, and how often they cycle. */
const LOADING_LINE_KEYS: readonly DeskTermId[] = ['splashLoading1', 'splashLoading2', 'splashLoading3', 'splashLoading4'];
const LOADING_LINE_CYCLE_MS = 1400;

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

export function Splash({ ready }: { ready: boolean }) {
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
  const [lineIndex, setLineIndex] = useState(0);
  const goneRef = useRef(false);
  // The floor (holdMs()) and readiness (the `ready` prop) each end the hold only
  // together — neither alone. Refs, not state: the timer's own closure and the
  // ready-effect below both need the OTHER condition's latest value without
  // re-running the mount effect (which would restart the timer and the
  // listeners on every authState change).
  const floorPassedRef = useRef(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const { t } = useDeskLexicon();

  useEffect(() => {
    if (!live) return undefined;

    // Measured AFTER mount, deliberately: the probe reads through this very
    // overlay (it is pointer-events:none), so it sees the app's own backdrop
    // rather than anything this component paints.
    setTone(measureBackdropTone());
    document.documentElement.dataset.splashHold = 'true';

    const resize = () => setBox(splashSizeFor(window.innerWidth, window.innerHeight));
    resize();

    const tryEnd = () => {
      if (goneRef.current || !floorPassedRef.current || !readyRef.current) return;
      goneRef.current = true;
      delete document.documentElement.dataset.splashHold;
      setLeaving(true);
    };

    // ITEM splash-hold, SUPERSEDED: the hold used to be a MAXIMUM, ended early by
    // the first keydown/pointerdown/wheel/touchstart (dismiss() called from each).
    // Nick's own word made the hold a FLOOR instead ("visible for at least 3
    // seconds") — nothing shortens it now, so these four listeners no longer call
    // anything. ROUND 3: the floor alone no longer ends the hold either — it only
    // flips floorPassedRef, and tryEnd() (called here AND from the ready-effect
    // below) is what actually ends it, once both conditions hold.
    const hold = window.setTimeout(() => { floorPassedRef.current = true; tryEnd(); }, holdMs());
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
      window.clearInterval(lineCycle);
      events.forEach((e) => window.removeEventListener(e, noop, opts));
      window.removeEventListener('resize', resize);
      // Defensive, not the normal path (tryEnd already clears this when leaving
      // starts): an unmount with the hold never having ended must not leave the
      // front door's content hidden forever.
      delete document.documentElement.dataset.splashHold;
    };
  }, [live]);

  // Re-checks the SAME tryEnd condition whenever `ready` flips true — the case
  // where the app becomes ready AFTER the floor has already passed (the mount
  // effect's own timeout already fired and found `readyRef.current` still
  // false back then, so nothing else would ever re-check it).
  useEffect(() => {
    if (!live || !ready || !floorPassedRef.current || goneRef.current) return;
    goneRef.current = true;
    delete document.documentElement.dataset.splashHold;
    setLeaving(true);
  }, [ready, live]);

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
      {/* role="status" (Nick's ruling): announced politely, never interrupting.
          `key` forces a remount on every line change, restarting the CSS fade —
          reduced motion drops that animation entirely (index.css), an instant swap. */}
      <div className="wz-splash-loading" role="status">
        <span key={lineIndex} className="wz-splash-loading-text">{t(LOADING_LINE_KEYS[lineIndex])}</span>
      </div>
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
