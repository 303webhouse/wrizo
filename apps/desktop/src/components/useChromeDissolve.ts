import { useCallback, useEffect, useRef, useState } from 'react';
import { useWritingSession } from './WritingSession';

// Mode-aware editor (Phase 2) — the push-back-to-writing engine. The richer
// successor to useChromeFade's binary recede, matching the prototype
// (apps/desktop/scratch/wrizo-modes-hybrid.html):
//
//   • Dissolve on write   — any keystroke recedes the chrome (rails/format-bar to
//                           a faint floor, top bar to 0%), fading out over ~1.2s.
//   • Return timing FIXED — after writing STOPS, wait 3 min, then fade the chrome
//                           back in slowly over ~2 min. A thinking writer is not
//                           nagged. (No Preview/Real toggle — that was a demo.)
//   • Explicit summon     — rolling the cursor to the page EDGES, pressing Esc, or
//                           tapping outside the text fades chrome back FAST (~0.4s)
//                           and cancels the slow timer. Casual pointer movement
//                           over the page does NOT summon — the menus never nag.
//
// The engine drives WritingSession so the global header (App.tsx) recedes in step,
// and writes `--fade-dur` onto the root so CSS can run the slow/fast curves. The
// editor, caret, glow, and progress bar never carry the dissolve class.

const WAIT_MS = 180_000;      // 3-minute pause before chrome returns
const FADE_IN_S = 120;        // ~2-minute slow return
const FADE_OUT_S = 2.8;       // recede on write/draw — slow + near-imperceptible (was 1.2, felt abrupt on the Journal pen)
const QUICK_S = 0.4;          // explicit-summon return
const EDGE_PX = 56;           // reach this close to a viewport edge to summon

interface Options {
  surface?: string;                       // names the active surface in the session
  rootRef?: React.RefObject<HTMLElement>;  // where --fade-dur is written (defaults to <html>)
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
  const [dissolved, setDissolved] = useState(false);
  const dissolvedRef = useRef(false);
  dissolvedRef.current = dissolved;
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFadeDur = useCallback((seconds: number) => {
    const el = rootRef?.current ?? document.documentElement;
    el.style.setProperty('--fade-dur', `${seconds}s`);
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
    setFadeDur(FADE_OUT_S);
    setDissolved(true);
    clearTimer();
    returnTimer.current = setTimeout(() => { returnTimer.current = null; resurface(false); }, WAIT_MS);
  }, [setFadeDur, resurface]);

  // Keep the global header (and any other session reader) in step.
  useEffect(() => { setWriting(dissolved); }, [dissolved, setWriting]);

  // Explicit-summon signals. Deliberate reach only: a viewport edge, Esc, or a tap
  // outside the text. Casual movement over the page is ignored (the menus are
  // never a procrastination surface mid-flow).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dissolvedRef.current) return;
      if (e.clientX <= EDGE_PX || e.clientX >= window.innerWidth - EDGE_PX || e.clientY <= EDGE_PX) {
        resurface(true);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') resurface(true); };
    const onDown = (e: PointerEvent) => {
      if (!dissolvedRef.current) return;
      const t = e.target as Element | null;
      if (!t || !t.closest || !t.closest(editorSelector)) resurface(true); // deliberate tap off the text
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
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
