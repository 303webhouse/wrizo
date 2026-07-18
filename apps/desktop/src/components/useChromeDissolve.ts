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
    let inZone = false;
    const clearDwell = () => {
      if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
      inZone = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!dissolvedRef.current) { clearDwell(); return; }
      const atEdge = e.clientX <= EDGE_PX || e.clientX >= window.innerWidth - EDGE_PX || e.clientY <= EDGE_PX;
      if (!atEdge) { clearDwell(); return; }
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
