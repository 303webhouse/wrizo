import { useCallback, useEffect, useRef } from 'react';
import { useWritingSession } from './WritingSession';

// CW1 — the Middle Door / chrome-fade shell. A reusable recede primitive: while
// the writer is actively writing, non-essential chrome fades below the attention
// threshold (PHILOSOPHY P8); on intent or genuine idle it eases back. The editor,
// the caret, and the J5 ambient warmth never fade — that's the surface, not
// chrome. Not QuickSprint-specific: the journal page (CW3) and the gate opt in
// with the same wire-up.
//
// CW4 — the writing-mode boolean is re-homed into WritingSession so the global
// header (App.tsx), and later the journal/gate/HOME, recede together with this
// surface from one source of truth. The recede MECHANICS still live here: the
// 500ms settle, the intent/idle restore, and the `.chrome-fade` /
// `data-chrome-receded` convention (styling + reduced-motion in index.css).
//
// Usage:
//   const { receded, noteForward, restore } = useChromeFade({ surface: 'sprint' });
//   <div className="page" data-chrome-receded={receded ? 'true' : 'false'}>
//     ...mark fading chrome with className="chrome-fade"...
//     <ChromeHandle onReveal={restore} />
//   <editor onForward={() => { ...; noteForward(); }} />

interface Options {
  settleMs?: number;       // delay before entering writing mode (a stray key shouldn't strobe)
  idleMs?: number;         // genuine-idle horizon → restore chrome
  editorSelector?: string; // a tap inside this is writing, not "tap outside text"
  surface?: string;        // names the active writing surface in the session (e.g. 'sprint')
}

export interface ChromeFade {
  receded: boolean;
  noteForward: () => void; // call on every forward keystroke (editor.onForward)
  restore: () => void;     // force chrome back (intent)
}

export function useChromeFade({ settleMs = 500, idleMs = 60_000, editorSelector = '.forward-only-editor', surface = 'writing' }: Options = {}): ChromeFade {
  const { isWriting, setWriting, beginSession, endSession } = useWritingSession();
  const writingRef = useRef(false);
  writingRef.current = isWriting;
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSettle = () => { if (settleRef.current) { clearTimeout(settleRef.current); settleRef.current = null; } };
  const clearIdle = () => { if (idleRef.current) { clearTimeout(idleRef.current); idleRef.current = null; } };

  // Restore is intent-driven: surface the chrome and cancel any pending recede.
  const restore = useCallback(() => {
    clearSettle();
    clearIdle();
    if (writingRef.current) setWriting(false);
  }, [setWriting]);

  // A forward keystroke means writing: (re)arm the idle horizon and, after a
  // brief settle, recede. Short think-pauses keep the chrome hidden (no idle
  // reset fires until idleMs); only genuine idle brings it back.
  const noteForward = useCallback(() => {
    clearIdle();
    idleRef.current = setTimeout(() => { idleRef.current = null; setWriting(false); }, idleMs);
    if (!writingRef.current && !settleRef.current) {
      settleRef.current = setTimeout(() => { settleRef.current = null; setWriting(true); }, settleMs);
    }
  }, [idleMs, settleMs, setWriting]);

  // Global intent signals. Forgiving by design (P5: a pause is not failure, and
  // the writer must never feel trapped) — any pointer move, any tap outside the
  // text, or Esc brings the chrome back. On a keyboard-only tablet none of these
  // fire while typing, so writing stays receded.
  useEffect(() => {
    const onMove = () => { if (writingRef.current || settleRef.current) restore(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') restore(); };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t || !t.closest || !t.closest(editorSelector)) restore(); // tap outside the text
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
    };
  }, [restore, editorSelector]);

  // Mark this surface for the session's lifetime; on unmount, tear down timers
  // and end the session so writing-mode never sticks on another screen.
  useEffect(() => {
    beginSession(surface);
    return () => { clearSettle(); clearIdle(); endSession(surface); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { receded: isWriting, noteForward, restore };
}

// The ever-present minimal affordance: a barely-there ember handle that stays
// visible even while receded, so chrome is always discoverable. Hover/focus/tap
// reveals everything — the sprint chrome and the global header together, since
// they share one writing-mode source of truth.
export function ChromeHandle({ onReveal, label = 'Show controls' }: { onReveal: () => void; label?: string }) {
  return (
    <button
      type="button"
      className="chrome-handle"
      aria-label={label}
      onPointerEnter={onReveal}
      onFocus={onReveal}
      onClick={onReveal}
    />
  );
}
