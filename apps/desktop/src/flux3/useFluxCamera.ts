// FLUX ZOOM, STEP 1 - THE CAMERA (claude/wrizors/flux-zoom-step1.md; Nick, Nov 11): the Schema's smooth zoom, in and out, between an outer limit and 4.00. Behind ?flux3=1, on the Schema only.
// ONE camera for the whole board: the board's canvas (the cards, the links, their words) is drawn at one scale by a CSS transform about its top-left corner, so nothing re-flows (a card keeps its
// shape and its words), and the drawing layer under it is told the same scale through setView (the ground, the routes and the electrons scale with it). The board's own frame is held at the
// height it had when the zoom began, so the page's rectangle never moves or scales (PAGE IS PRIMARY: the zoom changes what is drawn INSIDE the fixed frame, nothing around it).
//   Ctrl (Cmd) + wheel, or a trackpad pinch (the same event), zooms about the pointer; a two-finger pinch zooms about its midpoint; Ctrl + `+` / `-` zoom one notch (x1.25) about the centre; Ctrl + `0`
//   returns to 1.00. The wheel alone and a scroll pan, as today. The browser's own page zoom never fires while the Schema is mounted (every Ctrl act is taken).
//   Under reduced motion or Ambiance 0 a notch JUMPS; otherwise it glides ~140 ms. A wheel or pinch has no easing of its own. Zoom is OFF while the Stack or the hologram is open (the scale goes back to 1).
//   Nothing is saved: the scale is session-only and the Schema sets it back to 1 as it goes (boardZoom.ts).
import { useEffect, useRef, type RefObject } from 'react';
import { ZOOM_NOTCH, clampScale, getBoardScale, outerLimit, setBoardScale, subscribeBoardScale, wheelFactor } from './boardZoom';

const GLIDE_MS = 140;

interface Opts {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  /** The board's id: a different board is a different camera (it starts at 1). */
  boardId: string;
  /** False while the Stack or the hologram is open: zoom is off there. */
  active: boolean;
  /** The Ambiance dial is above 0 (reduced motion is read here). */
  motion: boolean;
}

export function useFluxCamera({ wrapRef, canvasRef, boardId, active, motion }: Opts): void {
  const activeRef = useRef(active); activeRef.current = active;
  const motionRef = useRef(motion); motionRef.current = motion;

  // zoom is off under the Stack and the hologram: the board goes back to true size (and stays there)
  useEffect(() => { if (!active) setBoardScale(1); }, [active]);

  useEffect(() => {
    const wrap = wrapRef.current, cv = canvasRef.current;
    if (!wrap || !cv) return;
    let frozenH: number | null = null;   // the frame's height when the zoom began, held while the scale is not 1
    let offL = 0, offT = 0;              // the board's centring offset inside the frame, in screen px (a board smaller than its frame sits in the middle)
    let raf = 0;

    const limits = () => outerLimit(wrap.clientWidth, wrap.clientHeight, cv.offsetWidth, cv.offsetHeight);

    // draw the board at the current scale; at 1 every property is taken away, so true size is exactly today's board
    const paint = () => {
      const s = getBoardScale();
      if (s === 1) {
        cv.style.transform = ''; cv.style.transformOrigin = '';
        cv.style.removeProperty('--f3-zoom'); cv.removeAttribute('data-f3-zoomed');
        wrap.style.height = ''; frozenH = null; offL = 0; offT = 0;
        return;
      }
      if (frozenH == null) {
        const cs = getComputedStyle(wrap);
        const edge = cs.boxSizing === 'border-box' ? 0 : (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        frozenH = wrap.getBoundingClientRect().height - edge;
      }
      wrap.style.height = `${frozenH}px`;
      offL = Math.max(0, (wrap.clientWidth - cv.offsetWidth * s) / 2);
      offT = Math.max(0, (wrap.clientHeight - cv.offsetHeight * s) / 2);
      cv.style.transformOrigin = '0 0';
      cv.style.transform = `translate(${offL}px, ${offT}px) scale(${s})`;
      cv.style.setProperty('--f3-zoom', String(s));
      cv.setAttribute('data-f3-zoomed', 'true');
    };
    const unsub = subscribeBoardScale(paint);

    // set the scale, holding the board point under (cx, cy) - client coordinates - where it is
    const zoomTo = (target: number, cx: number, cy: number) => {
      const s1 = getBoardScale(), s2 = clampScale(target, limits());
      if (s2 === s1) return;
      const wr = wrap.getBoundingClientRect();
      const px = cx - wr.left - wrap.clientLeft, py = cy - wr.top - wrap.clientTop;
      const bx = (wrap.scrollLeft + px - offL) / s1, by = (wrap.scrollTop + py - offT) / s1;
      setBoardScale(s2);   // paint() runs, and with it the layer's view (subscribers run in order)
      wrap.scrollLeft = bx * s2 + offL - px;
      wrap.scrollTop = by * s2 + offT - py;
    };
    const centre = () => { const wr = wrap.getBoundingClientRect(); return { x: wr.left + wrap.clientLeft + wrap.clientWidth / 2, y: wr.top + wrap.clientTop + wrap.clientHeight / 2 }; };
    const stopGlide = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // a key notch: a jump under reduced motion or Ambiance 0, else a short geometric glide
    const glide = (target: number, cx: number, cy: number) => {
      stopGlide();
      const from = getBoardScale(), to = clampScale(target, limits());
      if (to === from) return;
      if (!motionRef.current || reduced()) { zoomTo(to, cx, cy); return; }
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / GLIDE_MS), e = 1 - Math.pow(1 - t, 3);
        zoomTo(t >= 1 ? to : from * Math.pow(to / from, e), cx, cy);
        raf = t >= 1 ? 0 : requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;   // the wheel alone pans, as today
      e.preventDefault();                       // the browser's own page zoom never fires over the board
      if (!activeRef.current) return;
      stopGlide();
      zoomTo(getBoardScale() * wheelFactor(e.deltaY), e.clientX, e.clientY);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const cur = getBoardScale();
      let target: number;
      if (e.key === '+' || e.key === '=') target = cur * ZOOM_NOTCH;
      else if (e.key === '-' || e.key === '_') target = cur / ZOOM_NOTCH;
      else if (e.key === '0') target = 1;
      else return;
      e.preventDefault();                       // no page zoom from the keys either
      if (!activeRef.current) return;
      const c = centre();
      glide(target, c.x, c.y);
    };
    let pinch: { d0: number; s0: number } | null = null;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 2 && activeRef.current) { stopGlide(); pinch = { d0: dist(e.touches) || 1, s0: getBoardScale() }; } };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const t = e.touches;
      zoomTo(pinch.s0 * (dist(t) / pinch.d0), (t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);
    };
    const onTouchEnd = (e: TouchEvent) => { if (e.touches.length < 2) pinch = null; };

    // the harness's seam (like the other window.wrizo* ones): zoom to a scale about the centre, through the same clamp and the same paint as a key; the frames need 0.50 and 2.00 exactly
    const w = window as unknown as { wrizoFluxZoomTo?: (s: number) => number };
    w.wrizoFluxZoomTo = (s: number) => { stopGlide(); const c = centre(); zoomTo(s, c.x, c.y); return getBoardScale(); };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey, true);
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    wrap.addEventListener('touchend', onTouchEnd, { passive: true });
    wrap.addEventListener('touchcancel', onTouchEnd, { passive: true });
    // the frame or the canvas changed size while zoomed: the offsets and the outer limit move with it
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      const s = getBoardScale();
      if (s === 1) return;
      const c = clampScale(s, limits());
      if (c !== s) setBoardScale(c); else paint();
    }) : null;
    ro?.observe(wrap); ro?.observe(cv);

    return () => {
      stopGlide();
      wrap.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey, true);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('touchcancel', onTouchEnd);
      ro?.disconnect();
      delete w.wrizoFluxZoomTo;
      unsub();
      setBoardScale(1);   // nothing is saved: the next board, or this one on its return, starts at 1.00
      paint();
    };
  }, [wrapRef, canvasRef, boardId]);
}
