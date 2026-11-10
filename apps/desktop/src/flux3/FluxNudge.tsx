// FLUX3 S4 - THE 4 s NUDGE (the Wrizors' concepts file, "Pausing"; Nick's ruling Nov 9, Jacked In only). After 4 s of stillness one quiet line fades in below her text: "KEEP THE SIGNAL · ANY WORD
// WILL DO". Her next key clears it. No red, no countdown, no penalty. Through the lexicon (flux3JackedNudge). Reduced motion: no fade (a cut). Mounted only while jacked in, so it never exists in
// another mode or theme. TO TAKE IT OUT: delete this file and the <FluxNudge /> in FluxJackedHints.tsx - nothing else reads it.
//   - STILLNESS is neither typing nor moving the pointer (draft 23, 6a.9: so it never shows while she reaches for the X), and the 4 s COUNT STARTS once the entry line has gone: the earliest it can
//     show is ~7.6 s after she jacks in, so the two lines never follow each other at once. Its own Skin switch ("Idle line", on by default; off = it never shows).
//   - A key costs one assignment (the time of her last key) and, if the line is showing, one removal. The 4 s wait is ONE timer that looks at the clock when it fires.
//   - The line is centred on the corridor's centre line, its centre about 1.6 lines below her writing line (read once, when it shows; the page does not move while it is up).
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { getThemePrefs } from '../store/themePrefs';
import { EXIT_FADE_MS, EXIT_LINE_MS } from './jackIn';

export const NUDGE_MS = 4000;
const isTyping = (e: KeyboardEvent): boolean => e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace';

export function FluxNudge() {
  const { t } = useDeskLexicon();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    let last = performance.now() + EXIT_LINE_MS + EXIT_FADE_MS;   // the count starts when the entry line has gone
    let timer = 0;
    let showing = false;
    const arm = (ms: number) => { window.clearTimeout(timer); timer = window.setTimeout(fire, ms); };
    const fire = () => {
      const idle = performance.now() - last;
      if (idle < NUDGE_MS) { arm(NUDGE_MS - idle); return; }
      if (getThemePrefs().idle === 'off') { arm(NUDGE_MS); return; }   // its switch (Skin: Idle line)
      const caret = document.querySelector('.flux-block-caret')?.getBoundingClientRect();
      showing = true;
      setAt({ x: window.innerWidth / 2, y: caret ? caret.top + caret.height / 2 + caret.height * 1.6 : window.innerHeight * 0.62 });
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isTyping(e)) return;
      last = performance.now();
      if (showing) { showing = false; setAt(null); arm(NUDGE_MS); }
    };
    const onMove = () => { last = performance.now(); };   // the pointer moving is not stillness
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    document.addEventListener('pointermove', onMove, { capture: true, passive: true });
    arm(NUDGE_MS + EXIT_LINE_MS + EXIT_FADE_MS);
    return () => { document.removeEventListener('keydown', onKey, { capture: true }); document.removeEventListener('pointermove', onMove, { capture: true }); window.clearTimeout(timer); };
  }, []);
  if (!at || typeof document === 'undefined') return null;
  return createPortal(<div className="flux3-nudge" data-flux3-nudge="" style={{ left: at.x, top: at.y }}>{t('flux3JackedNudge')}</div>, document.body);
}
