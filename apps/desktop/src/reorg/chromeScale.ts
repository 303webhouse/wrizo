import { useEffect } from 'react';
import { useTheme } from '../store/theme';
import { REORG } from './flag';
import { liveQuery } from '../store/liveDom';

// THE CHROME GROWS WITH THE WINDOW (reorg plan v2.1 §3b, ARBOR item 4; Team B row 5, Nick: "the page takes a much larger share of the width";
// the Wrizors: "the whole layout grows with the window, from 1366 up, by one zoom"; Fable, Nov 21 11:45 am, RULED: one chrome scale from the
// window's width / 1366, Machina under the reorg only, the page's rect rule untouched).
//
// k = max(1, innerWidth / 1366), on <html> as --wz-chrome-k with data-wz-chrome-scale, while the reorg's rail is mounted in Machina (Machina is
// the only theme the reorg draws in). The rules that read it (styles/23-reorg-top.css, "THE CHROME SCALE") zoom the chrome's CONTENTS - the rail's,
// the bar's, the two drawers' and the split's side - and widen their tracks by the same k; never a box that script places by measuring, and never
// the page (the page already grows with its stage: store/pageScale.ts). Nothing is stored. At 1366 and below k is 1 and nothing changes.
// A probe (scripts/frames/zoom-probe.mjs, Actions 44947763063) chose the mechanism: zoom on <html> leaves 100vw at the unzoomed width (2880 px in
// a 1920 window at 1.5), so the whole document cannot be zoomed; a zoomed subtree keeps rects and pointer coordinates in the window's own pixels.

export const CHROME_BASE_W = 1366;
const ATTR = 'data-wz-chrome-scale';
const VAR = '--wz-chrome-k';
// THE FRONT DRAWER'S OWN SCALE: its track is the desk beside the page (min(200 x k, that desk)); a bigger page leaves less desk, so its contents grow
// only as far as its track allows - min(k, its width / 200) - and never run past its edge (Actions 44952123641: at 2560 a 222 px drawer at 1.874
// spilled 12 controls). Measured from the drawer's anchor (a box CSS places; reading it is a read only).
const FRONT_VAR = '--wz-front-k';
const FRONT_BASE = 200;
// THE FRONT DRAWER'S TRACK (Fable, Nov 21 3:05 pm, RULED: it scales by k like the rest). The track's own formula (13-desk-frame.css, --sliver-margin)
// counts the desk inside the stage only, as if the stage began at the window's edge; under Machina's reorg the stage is centred (at 2560 it spans
// about 415..2134 px), so the desk between the rail and the stage was lost (a 238 px track against a 614 px desk). The desk is measured here - the
// page's painted left edge, less the rail's right edge and the frame's 28 px gap - and published as --wz-front-desk; under the scale the track is
// min(200 x k, the larger of the formula and that desk). A read only, written only on a change.
const DESK_VAR = '--wz-front-desk';
// THE LAYOUT FITS THE WINDOW (the Wrizors' pass 2, REAL 2: at 1920 and 2560 the window scrolled a few px). The scaled bar is taller than the
// chrome budget the stage subtracts (--fx3-chrome-budget, a fixed 167 px in 01-tokens.css), so the document ran past the window. The overflow is
// measured and added to the budget (--wz-chrome-extra, read by 23-reorg-top.css), and it is BOUNDED (Fable, Nov 21 3:52 pm: an overflow the
// budget does not govern - a popover, a long panel - must not shrink the page tick by tick): it never exceeds what the scaled bar adds, the bar's
// height at k less its height at 1, plus 2 px (the bar is its padding and its zoomed contents, so that is the contents' height x (1 - 1/k)), and it
// is measured only while the scale settles - 3 s from the scale being set or the window resized - then held. It restarts from 0 on a resize.
const EXTRA_VAR = '--wz-chrome-extra';
const SETTLE_MS = 3000;
/** What the scaled bar adds to its own height: its contents (the zoomed children) are k times as tall as at 1, its padding is not. */
export const barGrowth = (contentsH: number, k: number): number => (Number.isFinite(contentsH) && contentsH > 0 && k > 1 ? contentsH - contentsH / k : 0);
const FRAME_GAP = 28;
export const frontScaleFor = (k: number, anchorW: number): number => (Number.isFinite(anchorW) && anchorW > 0 ? Math.max(1, Math.min(k, Math.round((anchorW / FRONT_BASE) * 1000) / 1000)) : k);

/** The chrome scale for a window this wide: 1 at 1366 and below, rounded to three places. */
export const chromeScaleFor = (w: number): number => (Number.isFinite(w) && w > CHROME_BASE_W ? Math.round((w / CHROME_BASE_W) * 1000) / 1000 : 1);

/** The scale in force now: 1 unless the chrome scale is on (read from <html>, so a caller outside React needs no hook). */
export function chromeK(): number {
  if (typeof document === 'undefined') return 1;
  const r = document.documentElement;
  if (!r.hasAttribute(ATTR)) return 1;
  const k = parseFloat(r.style.getPropertyValue(VAR));
  return Number.isFinite(k) && k >= 1 ? k : 1;
}

/** Mounted by the reorg's rail: publishes k while Machina is the theme, takes it away on leaving (another theme, or no rail). */
export function useChromeScale(): void {
  const theme = useTheme();
  useEffect(() => {
    if (!REORG || theme !== 'machina') return;
    const r = document.documentElement;
    let last = '';
    let lastFront = '';
    let lastDesk = '';
    let extra = 0;
    let settleUntil = 0;
    const cap = (): number => {
      const bar = [...document.querySelectorAll<HTMLElement>('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0);
      if (!bar) return 0;
      let c = 0;
      for (const ch of Array.from(bar.children)) c = Math.max(c, ch.getBoundingClientRect().height);
      return Math.ceil(barGrowth(c, chromeScaleFor(window.innerWidth)) + 2);
    };
    const fit = () => {
      if (r.getAttribute(ATTR) !== 'on' || performance.now() > settleUntil) return;
      const se = document.scrollingElement;
      if (!se) return;
      const over = Math.ceil(se.scrollHeight - window.innerHeight);
      if (over <= 0) return;
      const next = Math.min(extra + over, cap());
      if (next === extra) return;
      extra = next;
      r.style.setProperty(EXTRA_VAR, `${extra}px`);
    };
    const front = () => {
      const page = liveQuery<HTMLElement>('.mode-page');
      const strip = liveQuery<HTMLElement>('.desk-frame-strip');
      const desk = page && strip ? Math.max(0, Math.floor(page.getBoundingClientRect().left - strip.getBoundingClientRect().right - FRAME_GAP)) : NaN;
      const d = Number.isFinite(desk) ? `${desk}px` : '';
      if (d !== lastDesk) { lastDesk = d; if (d) r.style.setProperty(DESK_VAR, d); else r.style.removeProperty(DESK_VAR); }
      const a = document.querySelector<HTMLElement>('.desk-frame-sliver-anchor');
      const fk = String(frontScaleFor(chromeScaleFor(window.innerWidth), a ? a.getBoundingClientRect().width : NaN));
      if (fk === lastFront) return;
      lastFront = fk;
      r.style.setProperty(FRONT_VAR, fk);
    };
    const set = () => {
      const k = chromeScaleFor(window.innerWidth);
      const s = String(k);
      if (s !== last) {
        last = s;
        extra = 0;
        settleUntil = performance.now() + SETTLE_MS;
        r.style.removeProperty(EXTRA_VAR);
        r.style.setProperty(VAR, s);
        r.setAttribute(ATTR, k > 1 ? 'on' : 'base');
        window.dispatchEvent(new Event('wz-chrome-scale'));
      }
      front();
      requestAnimationFrame(fit);
    };
    set();
    window.addEventListener('resize', set);
    // the drawer's track also follows the page (another page, the zoom): re-read twice a second, writing only on a change (never on a keystroke)
    const tick = window.setInterval(() => { front(); fit(); }, 500);
    return () => {
      window.removeEventListener('resize', set);
      window.clearInterval(tick);
      r.style.removeProperty(VAR);
      r.style.removeProperty(FRONT_VAR);
      r.style.removeProperty(DESK_VAR);
      r.style.removeProperty(EXTRA_VAR);
      r.removeAttribute(ATTR);
      window.dispatchEvent(new Event('wz-chrome-scale'));
    };
  }, [theme]);
}
