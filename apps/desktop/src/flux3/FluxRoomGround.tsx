// FLUX3 S4b L1 - THE CIRCUIT GROUND ACROSS THE ROOM (flux-mockup-vs-build.md §4 L1; Nick, Nov 9 "the loved look"). The Schema's circuitry (grid, traces, the
// pads at their ends) used to exist only inside the board's frame; on the doc the room was a flat navy. Here the SAME ground is drawn behind the whole room:
// the host of a framed page or board (.desk-frame-host), behind every other thing in it.
//   - ONE offscreen canvas, drawn ONCE per size (a ResizeObserver on the host), never per frame, never per key. The room is dark in both Page tones (the Page tone is the
//     paper's), so one tone of ground; S5's Room setting will bring the white room and its own tone.
//     It uses the Schema layer's own helpers at its resting scale (s = 1: the 40 px grid and the 160 px circuit cells), so the room and the Schema match.
//   - A BOX under everything: position:absolute inside the host, z-index -1 in a stacking context the host makes for it (isolation), pointer-events none,
//     aria-hidden, inline structural styles (flux-v3.css is a dynamic import and may arrive after this mounts). It adds nothing to any layout: the page's
//     rect, the editor and the chrome are exactly where they were (Page Is Primary: a ground, never a panel).
//   - UNDER THE AMBIANCE DIAL: dial 0 draws nothing; below the default the ground is fainter (opacity = dial / 50, at most 1).
//   - THE CURRENT: a few drifting points (at most three) travel the traces on transform + opacity alone (compositor-only). Reduced motion or dial 0: none (the
//     still frame is the ground alone). They pause while keys land and wake 1.5 s after the last key (the damping rule), and never flash.
//   - Decorative. Nothing here is saved.
import { useEffect } from 'react';
import { useTheme } from '../store/theme';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { GRID, TONES, circuit, rnd, type Pt } from './flux3-layer';

export const MAX_POINTS = 3;
const DPR_CAP = 2;
const CALM_MS = 1500;        // quiet after her last key before the current drifts again
const POINT_PX_PER_S = 60;   // a slow drift
const MIN_TRACE_PX = 240;

// the ROOM is dark in both Page tones today (the Page tone is the paper's; the white room is S5's Room setting), so the ground is the dark tone's, always
const toneNow = (): 'dark' | 'light' => 'dark';

// the ground at scale 1 (the Schema's resting view), the same grid and circuit levels drawGround draws; returns the traces for the current's path
function paint(cv: HTMLCanvasElement, W: number, H: number, tone: 'dark' | 'light'): Pt[][] {
  const dpr = Math.min(DPR_CAP, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const traces: Pt[][] = [];
  const g = cv.getContext('2d');
  if (!g || !W || !H) return traces;
  const T = TONES[tone];
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const k = Math.ceil(Math.log(14 / GRID) / Math.log(8));   // = 0 at s = 1
  for (let lvl = k; lvl <= k + 1; lvl++) {
    const step = GRID * Math.pow(8, lvl);
    if (step < 6) continue;
    const a = Math.min(1, (step - 6) / 90);
    g.strokeStyle = `rgba(${T.grid},${(0.35 * a).toFixed(3)})`;
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= W; x += step) { const sx = Math.round(x) + 0.5; g.moveTo(sx, 0); g.lineTo(sx, H); }
    for (let y = 0; y <= H; y += step) { const sy = Math.round(y) + 0.5; g.moveTo(0, sy); g.lineTo(W, sy); }
    g.stroke();
    const cell = step * 4;
    if (cell < 110 || cell > 2600) continue;
    // THE ORDINARY STRENGTH (the Wrizors, Nov 9: one long trace read 3.75:1 against ~1.4 for the rest, and on the Schema it read as a link). The Schema's own ground lets the
    // coarse level (1280 px cells) come up to full strength and 2.5 px, because on the board it is the far view; across a ROOM it is one huge trace among small ones. Here every
    // level is held to the strength of the finest level's traces (alpha and width), so no trace is louder than the rest and none can pass for a link.
    const ORD_TA = Math.min(1, (GRID * 4 - 110) / 160);
    const ta = Math.min(ORD_TA, Math.min(1, (cell - 110) / 160) * Math.min(1, (2600 - cell) / 900));
    g.strokeStyle = `rgba(${T.trace},${(0.55 * ta).toFixed(3)})`;
    g.lineWidth = 1;
    g.beginPath();
    const ends: Pt[] = [];
    for (let cx = 0; cx <= Math.floor(W / cell); cx++) {
      for (let cy = 0; cy <= Math.floor(H / cell); cy++) {
        const n = 1 + Math.floor(rnd(cx, cy, lvl) * 3);
        for (let i = 0; i < n; i++) {
          const pts = circuit(cx, cy, lvl, i, cell);
          pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
          ends.push(pts[0], pts[pts.length - 1]);
          traces.push(pts);
        }
      }
    }
    g.stroke();
    g.fillStyle = `rgba(${T.end},${(0.35 * ta).toFixed(3)})`;
    g.beginPath();
    for (const p of ends) g.rect(p[0] - 2, p[1] - 2, 4, 4);
    g.fill();
  }
  return traces;
}

const lengthOf = (pts: Pt[]): number => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
  return L;
};

export function FluxRoomGround() {
  const flux = useTheme() === 'flux';
  const dial = useAmbianceDial();
  const on = flux && dial > 0;

  useEffect(() => {
    if (!on) return undefined;
    const host = document.querySelector<HTMLElement>('.desk-frame-host');
    if (!host) return undefined;
    // the host makes a stacking context of its own, so the ground (z-index -1) sits above the host's background and below everything in it
    const prev = { position: host.style.position, isolation: host.style.isolation };
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.isolation = 'isolate';
    const box = document.createElement('div');
    box.className = 'flux3-room-ground';
    box.setAttribute('aria-hidden', 'true');
    box.setAttribute('data-flux3-room-ground', '');
    box.style.cssText = `position:absolute;left:0;top:0;right:0;bottom:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict;opacity:${Math.min(1, dial / 50).toFixed(2)};`;
    // the canvas is OFFSCREEN: the ground is drawn into it once per size and handed to the box as its background image. A canvas ELEMENT is its own compositor layer, a
    // full-room one costing about 3 ms a frame on a software renderer (Actions, Nov 9: the cost reading found it; hiding the canvas took it away); a background image is just
    // paint, and typing repaints only the text's own rect.
    const cv = document.createElement('canvas');
    host.prepend(box);

    let traces: Pt[][] = [];
    let points: Animation[] = [];
    const dots: HTMLElement[] = [];
    let raf = 0;
    let timer = 0;
    let calm = true;
    const clearPoints = () => { points.forEach((a) => a.cancel()); points = []; dots.splice(0).forEach((d) => d.remove()); };
    const still = () => prefersReducedMotion();

    // THE CURRENT: up to three long traces wholly inside the room, each travelled by one point (transform + opacity only)
    const startCurrent = () => {
      clearPoints();
      if (still() || typeof box.animate !== 'function') return;
      const W = box.clientWidth, H = box.clientHeight;
      const T = TONES[toneNow()];
      const picks = traces
        .map((pts, i) => ({ pts, i, len: lengthOf(pts) }))
        .filter((t) => t.len >= MIN_TRACE_PX && t.pts.every((p) => p[0] > 8 && p[0] < W - 8 && p[1] > 8 && p[1] < H - 8))
        .sort((a, b) => rnd(a.i, 5, 9) - rnd(b.i, 5, 9))
        .slice(0, MAX_POINTS);
      picks.forEach((t, n) => {
        const d = document.createElement('i');
        d.style.cssText = `position:absolute;left:-3px;top:-3px;width:6px;height:6px;background:rgb(${T.end});box-shadow:0 0 8px rgb(${T.end});opacity:0;will-change:transform,opacity;`;
        box.appendChild(d);
        dots.push(d);
        let run = 0;
        const frames: Keyframe[] = t.pts.map((p, j) => {
          if (j) run += Math.abs(p[0] - t.pts[j - 1][0]) + Math.abs(p[1] - t.pts[j - 1][1]);
          return { transform: `translate(${p[0]}px, ${p[1]}px)`, offset: t.len ? run / t.len : j / (t.pts.length - 1), opacity: j === 0 || j === t.pts.length - 1 ? 0 : 0.9 };
        });
        const a = d.animate(frames, { duration: (t.len / POINT_PX_PER_S) * 1000, iterations: Infinity, delay: n * 2500, easing: 'linear', fill: 'both' });
        if (!calm) a.pause();
        points.push(a);
      });
    };

    const draw = () => {
      raf = 0;
      const W = Math.max(0, box.clientWidth), H = Math.max(0, box.clientHeight);
      traces = paint(cv, W, H, toneNow());
      box.style.backgroundImage = W && H ? `url(${cv.toDataURL('image/png')})` : 'none';
      box.style.backgroundSize = `${W}px ${H}px`;
      box.style.backgroundRepeat = 'no-repeat';
      box.dataset.draws = String(Number(box.dataset.draws || 0) + 1);
      startCurrent();
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
    schedule();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    ro?.observe(host);

    // DAMPING: a key pauses the current (once; later keys only push the wake-up back), and it drifts on again CALM_MS after the last one
    const wake = () => { timer = 0; calm = true; points.forEach((a) => a.play()); };
    const onKey = () => {
      if (calm) { calm = false; points.forEach((a) => a.pause()); }
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(wake, CALM_MS);
    };
    document.addEventListener('keydown', onKey, { capture: true, passive: true });

    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (timer) window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      clearPoints();
      box.remove();
      host.style.position = prev.position;
      host.style.isolation = prev.isolation;
    };
  }, [on, dial]);

  return null;
}
