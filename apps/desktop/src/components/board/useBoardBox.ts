import { useState, useLayoutEffect, type MutableRefObject } from 'react';
import { useStandingHands, DRAWER_MIN } from '../../store/menusDrawers';

export function useBoardBox({ wrapRef }: {
  wrapRef: MutableRefObject<HTMLDivElement | null>;
}) {
  // drawers never cover a board's cards: the board area narrows to the room beside the open drawers while the canvas keeps its natural width (the board scrolls); the CSS reads --board-l / --board-r [BoardEditor §28]
  const hands = useStandingHands();
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
      const l = Math.max(m, hands.tools ? DRAWER_MIN + intrusion : 0);
      const r = Math.max(m, hands.tutor ? 16 + openW : 0);
      const w = Math.max(240, W - l - r);
      stage.style.setProperty('--board-l', `${l}px`);
      stage.style.setProperty('--board-r', `${r}px`);
      stage.style.setProperty('--board-strip', `${intrusion}px`);
      setBoardBox((prev) => (prev && prev.l === l && prev.r === r && prev.w === w && prev.natural === natural ? prev : { l, w, r, natural }));
      document.dispatchEvent(new Event('wz-board-moved'));   // the Tutor re-measures its panel against the board's new edge
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [hands.tools, hands.tutor]);
  return { boardBox };
}
