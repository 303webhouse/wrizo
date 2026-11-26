import { useLayoutEffect } from 'react';
import { REORG } from './flag';
import { useTheme } from '../store/theme';
import { liveQuery } from '../store/liveDom';
import { onePanelAt } from '../store/pageScale';

// THE ROOM BESIDE THE PAGE FOR ARBOR'S RAIL POP-OUTS (the Wrizors' rail pass, arbor-reorg-pass-1.md section 4, NIT: "an open pop-out overlaps the
// page's left edge by about 10 px and hides the page's left opener tab. Stop it at the page's edge"; Fable, Nov 21 9:40 pm). A pop-out is 300 px from
// the rail; at 1366 the page's left opener (the Front drawer's 16 px tab, .wz-sliver-grip) stands at 357..373 and the pop-out ran to 384. While a
// pop-out is open in Arbor this measures the room from the anchor's left to the page's painted left, less the opener and a 4 px gap, and publishes it on
// the anchor as --wz-rail-room (read by 25-reorg-arbor-rail.css: the pop-out is min(300 px, that room)). A read only: the page never moves (law 1), so
// the room is stable; it is measured again on a resize and taken away when the pop-out closes. Under the switch only (the hook is chosen at load).
// #133 (Nick, Nov 25): at 1600 and narrower, in every theme, the pop-out lies over the page's edge (it is the one side panel open): its room runs to the
// page's TEXT, never over it, and is never under 200 px. The room rule above holds in wider windows.
const VAR = '--wz-rail-room';
const OPENER = 16;
const GAP = 4;

/** #133: the room over the page's margin, to 4 px short of where its text begins; never under 200 px (a drawer's narrowest). */
export const overRoom = (textLeft: number, anchorLeft: number): number | null => {
  const room = Math.floor(textLeft - GAP - anchorLeft);
  return Number.isFinite(room) ? Math.max(200, room) : null;
};
const textLeftOf = (page: HTMLElement): number => {
  const box = page.getBoundingClientRect();
  return box.left + (parseFloat(getComputedStyle(page).paddingLeft) || 0) * (page.offsetWidth ? box.width / page.offsetWidth : 1);
};

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
      if (!on || !open || !anchor) return undefined;
      const set = () => {
        const over = onePanelAt(window.innerWidth);
        const page = over || measured ? liveQuery<HTMLElement>('.mode-page') : null;
        const left = anchor.getBoundingClientRect().left;
        const room = !page ? null : over ? overRoom(textLeftOf(page), left) : railRoom(page.getBoundingClientRect().left, left);
        if (room === null) anchor.style.removeProperty(VAR); else anchor.style.setProperty(VAR, `${room}px`);
      };
      set();
      window.addEventListener('resize', set);
      return () => { window.removeEventListener('resize', set); anchor.style.removeProperty(VAR); };
    }, [on, measured, open]);
  }
  : () => undefined;
