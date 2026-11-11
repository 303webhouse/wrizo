// FLUX3 S4 - JACKED IN'S QUIET WORDS AND ITS WAY OUT (the Wrizors' concepts file §1; Nick's rulings Nov 9). Mounted only while jacked in (FluxJackedIn), so nothing here exists in another mode or theme.
//   - THE EXIT LINE: "JACKED IN · ESC TO JACK OUT" for the first 3 s, then a fade (a cut under reduced motion). The key it names is read from jackIn.ts (leaveKeyNow), the same place the handler
//     reads, so it is the key that actually leaves and stays true if the key changes. Words through the lexicon (flux3JackedExit). Quiet label colour, 4.5:1 or better on the ground.
//   - THE 4 s NUDGE (FluxNudge.tsx): one more quiet line, after 4 s of stillness. Its own file and ONE line below, so taking it out is one small change.
//   - THE CIRCLED X (Nick, Nov 9 3:43 pm): in the lower-right corner of the window, it comes with POINTER MOVEMENT and goes to opacity 0 when she types (the chrome's recede rule: no timer). A click
//     does exactly what an Esc tap does (jackIn.ts leaveJackedIn, the same function): BUILD on the same doc, caret at the end, full screen kept. A real button with an accessible name through the
//     lexicon; not brass (it is chrome, not her act); hover and focus in Flux's choice colour; reduced motion is a cut. A key costs one flag check (it hides only when it is showing).
//     The look is draft 23's (6a.11): a 40 px circle filled with the ground colour (nothing of the corridor shows through), 24 px in from the corner, a 48 px press area, ring and X 1.5 px, the X's
//     arms 14 px, the quiet label colour (cyan on hover; keyboard focus adds a 2 px cyan ring 3 px outside the circle), a 0.2 s fade, and the hint "<name> (<key>)".
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { prefersReducedMotion } from '../store/ambianceDial';
import { EXIT_FADE_MS, EXIT_LINE_MS, keyLabel, leaveJackedIn, leaveKeyNow } from './jackIn';
import { FluxNudge } from './FluxNudge';

// a key that is HER typing (the same set the corridor's pace and the nudge read)
export const isTypingKey = (e: KeyboardEvent): boolean => e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace';

function ExitLine() {
  const { t } = useDeskLexicon();
  const [phase, setPhase] = useState<'on' | 'fading' | 'off'>('on');
  useEffect(() => {
    const still = prefersReducedMotion();
    const a = window.setTimeout(() => setPhase(still ? 'off' : 'fading'), EXIT_LINE_MS);
    const b = window.setTimeout(() => setPhase('off'), EXIT_LINE_MS + EXIT_FADE_MS);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, []);
  if (phase === 'off' || typeof document === 'undefined') return null;
  const text = t('flux3JackedExit').replace('{key}', keyLabel(leaveKeyNow()));
  return createPortal(<div className="flux3-exit-line" data-flux3-exit-line="" data-phase={phase}>{text}</div>, document.body);
}

function LeaveX() {
  const { t } = useDeskLexicon();
  const ref = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    let showing = false;
    const set = (on: boolean) => {
      showing = on;
      const b = ref.current;
      if (!b) return;
      if (on) b.setAttribute('data-on', ''); else b.removeAttribute('data-on');
      b.tabIndex = on ? 0 : -1;
    };
    const onMove = () => { if (!showing) set(true); };
    const onKey = (e: KeyboardEvent) => { if (showing && isTypingKey(e)) set(false); };
    document.addEventListener('pointermove', onMove, { capture: true, passive: true });
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    return () => { document.removeEventListener('pointermove', onMove, { capture: true }); document.removeEventListener('keydown', onKey, { capture: true }); };
  }, []);
  if (typeof document === 'undefined') return null;
  // the hover hint names the key that works in her browser, as the entry line does (draft 23, 6a.11)
  const hint = t('flux3JackedLeaveHint').replace('{key}', keyLabel(leaveKeyNow()));
  return createPortal(
    <button ref={ref} type="button" className="flux3-leave-x" data-flux3-leave="" tabIndex={-1} aria-label={t('flux3JackedLeave')} title={hint} onClick={leaveJackedIn}>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="19" /><path d="M13 13 L27 27 M27 13 L13 27" /></svg>
    </button>,
    document.body,
  );
}

export function FluxJackedHints() {
  return <><ExitLine /><LeaveX /><FluxNudge /></>;
}
