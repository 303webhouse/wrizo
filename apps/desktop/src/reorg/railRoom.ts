import { useLayoutEffect } from 'react';
import { REORG } from './flag';
import { useTheme } from '../store/theme';
import { liveQuery } from '../store/liveDom';

// THE ROOM BESIDE THE PAGE FOR ARBOR'S RAIL POP-OUTS (the Wrizors' rail pass, arbor-reorg-pass-1.md section 4, NIT: "an open pop-out overlaps the
// page's left edge by about 10 px and hides the page's left opener tab. Stop it at the page's edge"; Fable, Nov 21 9:40 pm). A pop-out is 300 px from
// the rail; at 1366 the page's left opener (the Front drawer's 16 px tab, .wz-sliver-grip) stands at 357..373 and the pop-out ran to 384. While a
// pop-out is open in Arbor this measures the room from the anchor's left to the page's painted left, less the opener and a 4 px gap, and publishes it on
// the anchor as --wz-rail-room (read by 25-reorg-arbor-rail.css: the pop-out is min(300 px, that room)). A read only: the page never moves (law 1), so
// the room is stable; it is measured again on a resize and taken away when the pop-out closes. Under the switch only (the hook is chosen at load).
const VAR = '--wz-rail-room';
const OPENER = 16;
const GAP = 4;

/** The room between the rail and the page's left opener, in px: the page's left less the opener and the gap, less the anchor's left. */
export const railRoom = (pageLeft: number, anchorLeft: number): number | null => {
  const room = Math.floor(pageLeft - OPENER - GAP - anchorLeft);
  return Number.isFinite(room) && room > 0 ? room : null;
};

export const useRailRoom: (on: boolean, open: string | null) => void = REORG
  ? (on, open) => {
    const theme = useTheme();
    const measured = theme === 'plateau' || theme === 'flux';   // Arbor's rule, and Flux's on the redesign (the gate only lets Flux's rail stand with FLUX3)
    useLayoutEffect(() => {
      const anchor = document.querySelector<HTMLElement>('.desk-frame-cascade-anchor');
      if (!on || !measured || !open || !anchor) return undefined;
      const set = () => {
        const page = liveQuery<HTMLElement>('.mode-page');
        const room = page ? railRoom(page.getBoundingClientRect().left, anchor.getBoundingClientRect().left) : null;
        if (room === null) anchor.style.removeProperty(VAR); else anchor.style.setProperty(VAR, `${room}px`);
      };
      set();
      window.addEventListener('resize', set);
      return () => { window.removeEventListener('resize', set); anchor.style.removeProperty(VAR); };
    }, [on, measured, open]);
  }
  : () => undefined;
