import { useCallback, useEffect, useRef, useState } from 'react';
import { useWritingSession } from './WritingSession';
import { useThemePrefs } from '../store/themePrefs';

// Mode-aware editor (Phase 2) — the push-back-to-writing engine. The richer
// successor to useChromeFade's binary recede, matching the prototype
// (apps/desktop/scratch/wrizo-modes-hybrid.html):
//
//   • Dissolve on write   — any keystroke recedes the chrome (rails/format-bar to
//                           a faint floor, top bar to 0%), fading out over ~1.2s.
//   • Return timing FIXED — after writing STOPS, wait 3 min, then fade the chrome
//                           back in slowly over ~2 min. A thinking writer is not
//                           nagged. (No Preview/Real toggle — that was a demo.)
//   • Explicit summon     — lingering at a page EDGE (a brief dwell, so a pointer
//                           passing through doesn't count), pressing Esc, or
//                           tapping outside the text fades chrome back gently
//                           (~0.7s) and cancels the slow timer. Casual pointer
//                           movement over the page does NOT summon — reaching
//                           the chrome should take a little more deliberate
//                           effort than just continuing to write.
//
// The engine drives WritingSession so the global header (App.tsx) recedes in step,
// and writes `--fade-dur` onto the root so CSS can run the slow/fast curves. The
// editor, caret, glow, and progress bar never carry the dissolve class.

const WAIT_MS = 180_000;      // 3-minute pause before chrome returns
const FADE_IN_S = 120;        // ~2-minute slow return
const FADE_OUT_S = 2.8;       // recede on write/draw — slow + near-imperceptible (was 1.2, felt abrupt on the Journal pen)
const QUICK_S = 0.7;          // explicit-summon return — gentle, not a snap (was 0.4)
const EDGE_PX = 56;           // reach this close to a viewport edge to summon
const EDGE_DWELL_MS = 260;    // must linger at the edge this long — a deliberate reach, not a pass-through
// FX5 S8 — a genuine, reproduced-on-trusted-events defect (see this hook's
// own onMove comment below for the full diagnosis): a real hand resting at
// an edge is not pixel-perfectly still, and every momentary jitter across
// the strict EDGE_PX boundary used to cancel the dwell outright, resetting
// the clock before it could ever accumulate an uninterrupted run. This is
// the grace window a brief excursion OFF the edge gets before the dwell
// actually cancels — short enough that a genuine, deliberate move away
// still reads as "left" promptly, long enough to absorb ordinary sensor-
// noise-scale jitter (found live at a ~3px oscillation, ~60ms apart).
const LEAVE_GRACE_MS = 150;

// FX10 S3 — the vanishing law's other half, restored. Root-caused live
// (a runtime-verify.mjs probe, not guessed): a dissolved surface always
// carries `pointer-events:none` (both the `.chrome-fade`/`data-chrome-
// receded` and `.desk-dissolve`/`data-writing` rules set it, index.css),
// so it can never fire its OWN hover/pointerenter — the browser's hit-test
// skips it entirely, and any click/move lands on whatever is genuinely
// underneath. The pre-FX10 `onMove` below only ever treated "at a viewport
// EDGE" as a summon signal; a dissolved-but-open menu sitting well inland
// (confirmed live: the sliver panel measures ~132-316px from the left edge
// at 1280px, nowhere near EDGE_PX=56) could be hovered indefinitely and
// never resurface — exactly Nick's own finding ("I had to click to get it
// back"). Fixed at the SOURCE, in the one shared engine every dissolved
// surface already reads `dissolved`/`--fade-dur` from, rather than in any
// one consumer: a window-level pointer-coordinate check (the SAME
// technique the edge check already uses, for the SAME reason — a
// pointer-events:none element cannot be hit-tested, but its own
// getBoundingClientRect() is untouched by pointer-events, so testing
// coordinates against it works regardless) against every currently-
// dissolving chrome surface's own rect. `.chrome-fade, .desk-dissolve` is
// every class family a dissolving surface can carry app-wide (App.tsx's
// header, DeskRail, the strip, the sliver/tutor panels, the corkboard,
// every sprint-nav/chrome-top bar) — one sweep covers all of them, so
// every dissolved surface inherits this fix automatically; nothing here is
// specific to the sliver. A collapsed (0×0) or off-screen element can never
// match (an empty rect contains no point), so a genuinely CLOSED surface —
// as opposed to a dissolved-but-structurally-open one — is never mistaken
// for a reachable menu. Queried fresh on every qualifying move rather than
// cached: this only runs while `dissolvedRef.current` is already true (see
// the early return below), a comparatively rare state, and the set of
// dissolving surfaces on screen varies by route/mount.
function overDissolvedChrome(x: number, y: number): boolean {
  if (typeof document === 'undefined') return false;
  const nodes = document.querySelectorAll<HTMLElement>('.chrome-fade, .desk-dissolve');
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue; // collapsed/closed — nothing to reach for
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
  }
  return false;
}

interface Options {
  surface?: string;                       // names the active surface in the session
  // Where --fade-dur is written (defaults to <html>). Pass an array when the
  // engine's own root (e.g. ModeStage's .mode-stage) doesn't cover chrome that
  // lives OUTSIDE it in the DOM (e.g. PageEditor's top bar, a .mode-stage
  // sibling) — every ref in the array gets the same value.
  rootRef?: React.RefObject<HTMLElement> | React.RefObject<HTMLElement>[];
  editorSelector?: string;                 // a tap inside this is writing, not "tap outside"
}

export interface ChromeDissolve {
  dissolved: boolean;
  noteWrite: () => void;          // call on every forward keystroke
  resurface: (quick?: boolean) => void; // force chrome back
}

export function useChromeDissolve({
  surface = 'writing',
  rootRef,
  editorSelector = '.forward-only-editor',
}: Options = {}): ChromeDissolve {
  const { setWriting, beginSession, endSession } = useWritingSession();
  // TH1 Slice 3 — the Fade pref (canon §11). Default 'on' preserves today's
  // shipped behavior exactly; 'off' is a new opt-in that keeps chrome fully
  // surfaced (noteWrite becomes a no-op below) — no chrome ever recedes.
  const { fade } = useThemePrefs();
  const [dissolved, setDissolved] = useState(false);
  const dissolvedRef = useRef(false);
  dissolvedRef.current = dissolved;
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFadeDur = useCallback((seconds: number) => {
    const refs = Array.isArray(rootRef) ? rootRef : [rootRef];
    const targets = refs.map(r => r?.current).filter((el): el is HTMLElement => !!el);
    for (const el of targets.length ? targets : [document.documentElement]) {
      el.style.setProperty('--fade-dur', `${seconds}s`);
    }
  }, [rootRef]);

  const clearTimer = () => {
    if (returnTimer.current) { clearTimeout(returnTimer.current); returnTimer.current = null; }
  };

  const resurface = useCallback((quick = false) => {
    clearTimer();
    setFadeDur(quick ? QUICK_S : FADE_IN_S);
    setDissolved(false);
  }, [setFadeDur]);

  // A forward keystroke means writing: recede fast, then arm the 3-minute return.
  const noteWrite = useCallback(() => {
    if (fade === 'off') return; // Fade:off — chrome stays fully surfaced, always
    setFadeDur(FADE_OUT_S);
    setDissolved(true);
    clearTimer();
    returnTimer.current = setTimeout(() => { returnTimer.current = null; resurface(false); }, WAIT_MS);
  }, [fade, setFadeDur, resurface]);

  // Keep the global header (and any other session reader) in step.
  useEffect(() => { setWriting(dissolved); }, [dissolved, setWriting]);

  // Fable's A1 (TH1 review, folded in TH2) — noteWrite's Fade:off guard only
  // stops FUTURE dissolves; flipping the pref mid-dissolve (chrome already
  // faded) left it faded until the next natural resurface trigger. Fade:off
  // means "chrome is never hidden," so the transition itself must resurface
  // immediately, not just gate the next keystroke.
  useEffect(() => {
    if (fade === 'off' && dissolvedRef.current) resurface(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fade]);

  // Explicit-summon signals. Deliberate reach only: a viewport edge, Esc, or a tap
  // outside the text. Casual movement over the page is ignored (the menus are
  // never a procrastination surface mid-flow). Reaching an edge must LINGER
  // (EDGE_DWELL_MS) before it counts — a pointer merely passing through on its
  // way back to the text shouldn't summon anything; only pausing there (an
  // actual intent to reach for the chrome) does. Esc and a deliberate tap
  // outside the text are already unambiguous acts, so those stay instant.
  useEffect(() => {
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    let inZone = false;
    const clearDwell = () => {
      if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      inZone = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!dissolvedRef.current) { clearDwell(); return; }
      // FX10 S3 — a genuine pointer approach onto a dissolved-but-open
      // chrome surface counts as the SAME "deliberate reach" signal a
      // viewport-edge dwell already does — same dwell timer, same jitter
      // grace, same instant restore once it fires. See overDissolvedChrome's
      // own header comment for the full root-cause writeup.
      const atEdge = e.clientX <= EDGE_PX || e.clientX >= window.innerWidth - EDGE_PX || e.clientY <= EDGE_PX
        || overDissolvedChrome(e.clientX, e.clientY);
      if (atEdge) {
        // Genuinely at (or back at) the edge: a pending "did they actually
        // leave" grace timer (below) is cancelled — the dwell that was
        // already running is UNDISTURBED, never restarted from zero.
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        if (inZone) return; // already lingering — dwell timer running
        inZone = true;
        // FX4 S8 — `inZone` was never reset once the dwell timer actually FIRED
        // (only on a subsequent "left the edge" or "not at edge" move), so a
        // SECOND dissolve/resurface cycle within the same mount — the writer
        // reaches the edge again later in one long session, without the
        // pointer ever registering a genuine "left the zone" move in between —
        // found `inZone` still stuck `true` from the first summon and silently
        // dropped the new dwell, never re-arming. Diagnosed live (a two-cycle
        // harness probe on an unchanged mount): cycle 1 always resurfaced,
        // every subsequent cycle silently failed. Resetting `inZone` the
        // instant the timer fires — the same moment `resurface` runs — lets
        // the very next qualifying dwell arm fresh, regardless of whether the
        // pointer technically left the zone in between.
        dwellTimer = setTimeout(() => { dwellTimer = null; inZone = false; resurface(true); }, EDGE_DWELL_MS);
        return;
      }
      // FX5 S8 — a SECOND genuine defect, this one invisible to a synthetic
      // harness proof and only found by reproducing with a genuinely
      // TRUSTED pointer stream (CDP Input.dispatchMouseEvent, isTrusted:
      // true — see runtime-verify.mjs's own app.mouseMove): a real hand
      // resting near an edge is not pixel-perfectly still — mouse sensor
      // noise / small hand tremor routinely crosses the strict EDGE_PX
      // boundary for a single event without the writer moving away at all.
      // The OLD code (`if (!atEdge) { clearDwell(); return; }`) treated
      // every such flicker as "left the zone," instantly cancelling the
      // dwell timer and resetting `inZone` — if jitter recurs faster than
      // EDGE_DWELL_MS (confirmed live: a ~3px oscillation every ~60ms
      // never let the timer accumulate an uninterrupted 260ms run), the
      // writer could rest at the edge indefinitely and NEVER resurface.
      // Four synthetic multi-cycle probes (fx4.mjs's own S8 section) never
      // caught this because a hand-written test dispatches one clean
      // coordinate, never noisy ones. Fix: a brief excursion off the edge
      // gets a short grace window (LEAVE_GRACE_MS) before the dwell
      // actually cancels — long enough to absorb realistic jitter, short
      // enough that a genuine, deliberate move away still reads promptly.
      if (!inZone || leaveTimer) return; // nothing dwelling, or a grace timer is already running
      leaveTimer = setTimeout(() => { leaveTimer = null; clearDwell(); }, LEAVE_GRACE_MS);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { clearDwell(); resurface(true); } };
    const onDown = (e: PointerEvent) => {
      if (!dissolvedRef.current) return;
      const t = e.target as Element | null;
      if (!t || !t.closest || !t.closest(editorSelector)) { clearDwell(); resurface(true); } // deliberate tap off the text
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      clearDwell();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
    };
  }, [resurface, editorSelector]);

  // Own the session lifetime for this surface; tear down so chrome never sticks.
  useEffect(() => {
    beginSession(surface);
    return () => { clearTimer(); endSession(surface); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { dissolved, noteWrite, resurface };
}
