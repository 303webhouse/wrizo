import { useCallback, useEffect, useRef, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { useTheme } from '../store/theme';
import { SplashMark, prefersReducedMotion } from './SplashMark';
import { isArbor2 } from '../arbor2/flag';
import { ArborSplashLogo } from '../arbor2/logoWrite';

// the splash: pointer-events:none so it never eats a keystroke; sized by the ink's bounding box to about a quarter of the screen's area (capped at 60% height, 70% width); per-theme animation; holds until its animation ends and the app is ready; once per app load [Splash §1]

/** The asset's measured ink bounding box inside its own canvas. */
const INK = { w: 3077, h: 2458 };
const CANVAS = { w: 3374, h: 2699 };
const FILL_X = INK.w / CANVAS.w;   // 0.9120
const FILL_Y = INK.h / CANVAS.h;   // 0.9107
const ASPECT = INK.w / INK.h;      // 1.2518

// about a quarter of the screen's area [Splash §2]
const AREA_FRACTION = 0.25;
/** The ink never exceeds this share of the viewport's height / width, so the
 *  blurred app always shows on all four sides. Only bind at extreme shapes
 *  (very wide windows / narrow portrait phones). */
const MAX_INK_HEIGHT_FRACTION = 0.6;
const MAX_INK_WIDTH_FRACTION = 0.7;

// the escape hatch: /auth/me has no time limit, so after this long from mount the hold ends regardless of readiness (once the floor has passed); also the floor's backstop if the animation never signals [Splash §3]
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
  // the flag and data-splash-hold are read during the first render, not in an effect, so no frame paints a splash about to retract or a front door about to hide [Splash §4]
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

  // SplashMark's timeline calls this once, at its hold point; refs keep its identity stable so SplashMark's mount effect never re-runs [Splash §5]
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

    // these listeners no longer end the hold: the floor flips floorPassedRef, and tryEnd ends it once the floor and readiness (or the ceiling) hold [Splash §6]
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
      {/* ARBOR v2 MOCKUP r16 (Nick, Nov 2): the logo written out in the corner mark's own rect (src/arbor2/logoWrite.tsx) */}
      {isArbor2() && theme === 'plateau' && <ArborSplashLogo reduced={reduced} />}
      {/* role=status: announced politely; `key` remounts each line to restart the fade, which reduced motion drops [Splash §7] */}
      {t(LOADING_LINE_KEYS[lineIndex]) !== '' && (
        <div className="wz-splash-loading" role="status">
          <span key={lineIndex} className="wz-splash-loading-text">{t(LOADING_LINE_KEYS[lineIndex])}</span>
        </div>
      )}
    </div>
  );
}

// test seam: the frame pass and splash.mjs read this code's sizing; the floor is measured empirically, not reported [Splash §8]
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
