// FLUX3 S4 - THE 4 s NUDGE (the Wrizors' concepts file, "Pausing"; Nick's ruling Nov 9, Jacked In only). After 4 s of stillness one quiet line fades in below her text: "KEEP THE SIGNAL · ANY WORD
// WILL DO". Her next key clears it. No red, no countdown, no penalty. Through the lexicon (flux3JackedNudge). Reduced motion: no fade (a cut). Mounted only while jacked in, so it never exists in
// another mode or theme. TO TAKE IT OUT: delete this file and the <FluxNudge /> in FluxJackedHints.tsx - nothing else reads it.
//   - A key costs one assignment (the time of her last key) and, if the line is showing, one removal. The 4 s wait is ONE timer that looks at the clock when it fires.
//   - The line stands below the caret's line, centred on the page (read once, when it shows; the page does not move while it is up).
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';

export const NUDGE_MS = 4000;
const isTyping = (e: KeyboardEvent): boolean => e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace';

export function FluxNudge() {
  const { t } = useDeskLexicon();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    let last = performance.now();
    let timer = 0;
    let showing = false;
    const arm = (ms: number) => { window.clearTimeout(timer); timer = window.setTimeout(fire, ms); };
    const fire = () => {
      const idle = performance.now() - last;
      if (idle < NUDGE_MS) { arm(NUDGE_MS - idle); return; }
      const page = document.querySelector('.mode-page')?.getBoundingClientRect();
      const caret = document.querySelector('.flux-block-caret')?.getBoundingClientRect();
      if (!page) { arm(NUDGE_MS); return; }
      showing = true;
      setAt({ x: page.left + page.width / 2, y: caret ? caret.bottom + caret.height * 1.2 : page.top + page.height * 0.62 });
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isTyping(e)) return;
      last = performance.now();
      if (showing) { showing = false; setAt(null); arm(NUDGE_MS); }
    };
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    arm(NUDGE_MS);
    return () => { document.removeEventListener('keydown', onKey, { capture: true }); window.clearTimeout(timer); };
  }, []);
  if (!at || typeof document === 'undefined') return null;
  return createPortal(<div className="flux3-nudge" data-flux3-nudge="" style={{ left: at.x, top: at.y }}>{t('flux3JackedNudge')}</div>, document.body);
}
