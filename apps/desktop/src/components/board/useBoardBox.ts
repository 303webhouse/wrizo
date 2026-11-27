import { useState, useLayoutEffect, type MutableRefObject } from 'react';
import { useStandingHands, menusOpenInward, DRAWER_MIN } from '../../store/menusDrawers';
import { useTheme } from '../../store/theme';
import { isArbor2 } from '../../arbor2/flag';

export function useBoardBox({ wrapRef }: {
  wrapRef: MutableRefObject<HTMLDivElement | null>;
}) {
  // drawers never cover a board's cards: the board area narrows to the room beside the open drawers while the canvas keeps its natural width (the board scrolls); the CSS reads --board-l / --board-r [BoardEditor §28]
  const hands = useStandingHands();
  const inward = menusOpenInward(useTheme(), 'board');
  const [boardBox, setBoardBox] = useState<{ l: number; w: number; r: number; natural: number } | null>(null);
  useLayoutEffect(() => {
    const stage = wrapRef.current?.closest('.desk-frame-stage') as HTMLElement | null;
    if (!stage) { setBoardBox(null); return; }
    const apply = () => {
      const s = stage.getBoundingClientRect();
      const W = stage.clientWidth;
      const natural = Math.min(W, 1100);
      const m = (W - natural) / 2;
      const strip = document.querySelector('.desk-frame-strip')?.getBoundingClientRect();
      const intrusion = strip && strip.width > 0 ? Math.max(0, strip.right - s.left) : 0;
      const openW = Math.max(320, Math.min(0.34 * window.innerWidth, 460));   // --tutor-panel-open-w
      // ARBOR v2 MOCKUP r22 (Nick's walk, Nov 8, via Fable: "On a Board, the Tutor drawer opens INSIDE the board; it must open at the
      // surface's edge, as on the Page"): under the flag the board keeps its rect and the drawers open at its edge (the page-primacy law);
      // where the margin is too narrow for one they overlay, as on the Page. Off the flag the board still narrows.
      const keep = isArbor2();
      const l = keep ? m : Math.max(m, hands.tools ? DRAWER_MIN + intrusion : 0);
      const r = keep ? m : Math.max(m, hands.tutor ? 16 + openW : 0);
      let w = Math.max(240, W - l - r);
      let box = { l, r, natural };
      // #139: the Board runs from the rail to the window's edge, past the stage's own padding, less a lane each side for the closed menus' tabs; it never moves for a menu
      if (inward) {
        const LANE = 20;
        const from = Math.max(strip?.right ?? 0, 0) + LANE, to = document.documentElement.clientWidth - LANE;
        w = Math.max(240, to - from);
        box = { l: from - s.left, r: s.right - to, natural: w };
      }
      stage.style.setProperty('--board-l', `${box.l}px`);
      stage.style.setProperty('--board-r', `${box.r}px`);
      stage.style.setProperty('--board-strip', `${intrusion}px`);
      setBoardBox((prev) => (prev && prev.l === box.l && prev.r === box.r && prev.w === w && prev.natural === box.natural ? prev : { ...box, w }));
      document.dispatchEvent(new Event('wz-board-moved'));   // the Tutor re-measures its panel against the board's new edge
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(stage);
    // #139: this Board is placed from the rail and the window, so those are watched too. The rail has no width at the first measure, and a wider window may leave
    // the stage's size alone (it has a ceiling) and still move the window's edge
    let frame = 0;
    if (inward) {
      const rail = document.querySelector('.desk-frame-strip');
      if (rail) ro.observe(rail);
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(apply); });
      window.addEventListener('resize', apply);
    }
    return () => { ro.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', apply); };
  }, [hands.tools, hands.tutor, inward]);
  return { boardBox };
}
