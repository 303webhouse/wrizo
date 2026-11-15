import { useEffect, useRef } from 'react';
import { snapshotBlurred } from './blurSnapshot';

// LOOK B (Nick, Nov 14): while a card's popup (or the deck wizard) is open, the board behind it is blurred ONCE and held still. The wrap carries the live blur as it always did (the
// look today, instantly); two frames after it opens, the board's DOM is drawn once into a blurred canvas (blurSnapshot.ts), the canvas goes into the slot, and the wrap says
// data-blur="snap": CSS then drops the live filter and hides the live board, so nothing under the popup is re-blurred or re-painted while she types. If the snapshot cannot be made
// (null: no ctx.filter, a decode failure, a timeout) nothing changes and the live blur stays. Closing the popup removes the canvas and the attribute: the board is the live board again.
// The slot and the wrap are React's; the canvas and `data-blur` are set here and are not in any JSX, so a re-render never fights them.
export function useBoardBlurSnap(active: boolean) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        void snapshotBlurred(wrap).then((canvas) => {
          const slot = slotRef.current, w = wrapRef.current;
          if (cancelled || !canvas || !slot || !w) return;
          slot.replaceChildren(canvas);
          w.setAttribute('data-blur', 'snap');
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      wrapRef.current?.removeAttribute('data-blur');
      slotRef.current?.replaceChildren();
    };
  }, [active]);
  return { wrapRef, slotRef };
}
