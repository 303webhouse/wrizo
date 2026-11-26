// FLUX3 S4 - THE 4 s NUDGE (the Wrizors' concepts file, "Pausing"; Nick's ruling Nov 9, Jacked In only). After 4 s of stillness one quiet line fades in below her text: "KEEP THE SIGNAL · ANY WORD
// WILL DO". Her next key clears it. No red, no countdown, no penalty. Through the lexicon (flux3JackedNudge). Reduced motion: no fade (a cut). Mounted only while jacked in, so it never exists in
// another mode or theme. TO TAKE IT OUT: delete this file and the <FluxNudge /> in FluxJackedHints.tsx - nothing else reads it.
//   - STILLNESS is neither typing nor moving the pointer (draft 23, 6a.9: so it never shows while she reaches for the X), and the 4 s COUNT STARTS once the entry line has gone: the earliest it can
//     show is ~7.6 s after she jacks in, so the two lines never follow each other at once. Its own Skin switch ("Idle line", on by default; off = it never shows).
//   - A key costs one assignment (the time of her last key) and, if the line is showing, one removal. The 4 s wait is ONE timer that looks at the clock when it fires.
//   - The line is centred on the corridor's centre line, its centre about 1.6 lines below her writing line. #124 (Nick, Nov 2026): it is NEVER drawn over words. It stands under her last line, the caret and the
//     "keep writing" hint, and is placed again every PLACE_MS while it shows (the page can move under it: a scroll, a resize, a late glide). With no room on the window it is not drawn.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { getThemePrefs } from '../store/themePrefs';
import { EXIT_FADE_MS, EXIT_LINE_MS } from './jackIn';

export const NUDGE_MS = 4000;
export const PLACE_MS = 120;   // how often a showing line is placed again
const HALF = 6;    // half the line's own height (11 px type, line-height 1)
const GAP = 8;     // the clear space under her words
const isTyping = (e: KeyboardEvent): boolean => e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace';

// the last line box of her words: read from the editor's last text node backwards, so a long page costs no more than a short one
function lastLine(): DOMRect | null {
  const ed = document.querySelector('.forward-only-editor');
  if (!ed) return null;
  const walk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  for (let node = walk.lastChild(); node; node = walk.previousNode()) {
    if (!(node.nodeValue ?? '').trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    if (rects.length) return rects[rects.length - 1];
  }
  return null;
}

// where the line stands NOW: about 1.6 lines below her writing line, and always under her last words, the caret and the "keep writing" hint. Null: no room on the window, so it is not drawn
function placeNow(): { x: number; y: number } | null {
  const caret = document.querySelector('.flux-block-caret')?.getBoundingClientRect() ?? null;
  const text = lastLine();
  const line = caret ?? text;   // no caret on the page (she clicked away): her last line stands for the writing line
  const x = window.innerWidth / 2;
  if (!line) return { x, y: window.innerHeight * 0.62 };   // an empty page: nothing to cover
  const hint = document.querySelector('.fo-nudge')?.getBoundingClientRect() ?? null;
  const floor = Math.max(caret?.bottom ?? -Infinity, text?.bottom ?? -Infinity, hint?.bottom ?? -Infinity);
  const y = Math.max(line.top + line.height * 2.1, floor + GAP + HALF);
  return y - HALF >= 0 && y + HALF <= window.innerHeight ? { x, y } : null;
}

export function FluxNudge() {
  const { t } = useDeskLexicon();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    let last = performance.now() + EXIT_LINE_MS + EXIT_FADE_MS;   // the count starts when the entry line has gone
    let timer = 0;
    let follow = 0;
    let showing = false;
    const arm = (ms: number) => { window.clearTimeout(timer); timer = window.setTimeout(fire, ms); };
    // unchanged = no render
    const place = () => { const next = placeNow(); setAt((was) => (was && next && Math.abs(was.x - next.x) < 0.5 && Math.abs(was.y - next.y) < 0.5 ? was : next)); };
    const fire = () => {
      const idle = performance.now() - last;
      if (idle < NUDGE_MS) { arm(NUDGE_MS - idle); return; }
      if (getThemePrefs().idle === 'off') { arm(NUDGE_MS); return; }   // its switch (Skin: Idle line)
      showing = true;
      place();
      follow = window.setInterval(place, PLACE_MS);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isTyping(e)) return;
      last = performance.now();
      if (showing) { showing = false; window.clearInterval(follow); setAt(null); arm(NUDGE_MS); }
    };
    const onMove = () => { last = performance.now(); };   // the pointer moving is not stillness
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    document.addEventListener('pointermove', onMove, { capture: true, passive: true });
    arm(NUDGE_MS + EXIT_LINE_MS + EXIT_FADE_MS);
    return () => { document.removeEventListener('keydown', onKey, { capture: true }); document.removeEventListener('pointermove', onMove, { capture: true }); window.clearTimeout(timer); window.clearInterval(follow); };
  }, []);
  if (!at || typeof document === 'undefined') return null;
  return createPortal(<div className="flux3-nudge" data-flux3-nudge="" style={{ left: at.x, top: at.y }}>{t('flux3JackedNudge')}</div>, document.body);
}
