// ARBOR v2 MOCKUP - §14 item 6: the day room's light (spec §7.1-7.2, §7.4; Fable's ruling 2), drawn as the PERGOLA v2 since r5 (§7b).
//
// Sun through a pergola: beam shadows and leaf shadows on the ROOM, drawn as one fixed layer BEHIND everything (body is its own stacking
// context under the flag, so the layer sits above the sun pool and under the vignette and every surface). NEVER ACROSS THE PROSE COLUMN
// (spec §7.1, Fable Oct 29): paper.ts cuts a soft hole in this layer over the visible page (its outer 24 px may catch the edge only).
//
// THE PERGOLA v2 (spec §7b, Nick Oct 31 1:27 pm; supersedes the slats):
//   - THREE OR FOUR BEAMS, THICK: shadow bands 36-60 px at the near end, narrowing as they recede (styles: a clip-path to 40%), running as
//     ONE FEATURE from the bottom-left corner toward the right, LOW: they start on the room's left edge in its lowest third and rise only
//     gently, so they inhabit the bottom-right quadrant and the upper half of the room stays clear. They lean a little toward each other
//     (a vanishing point off to the right), so they read as receding beams, not stripes.
//   - ONE OR TWO CROSSBEAMS at right angles (14-20 px) across them, in the right half, so it reads as the top of a pergola.
//   - SMALL LEAVES: 10-18 px clusters along the beams, denser near the crossbeams.
//   - Soft (8 px blur), moss at 18-26% (the layer's opacity, with the afternoon), drifting over 48 s (>= 16 s).
//   - RANDOMISED PER SESSION: a fresh seed each time the app opens (spacing, lean, widths, crossbeam places, leaves, drift). In memory only.
//   - FLUTTER: one leaf cluster shimmers for 300-600 ms, at random intervals >= 6 s apart (<= 1 event per second; flutterDelay/flutterMs).
//   - THE AFTERNOON (ruling 2: "behaviour with no data"): minutes in this session (0 -> 90 min = a third of the way) and the local clock
//     (noon -> 18:00 = the rest) blend into one number t in [0, 1]. It deepens the shade (18% -> 26%), lengthens the beams (scaleX to 1.25
//     from the corner) and warms the plaster #F1EAD8 toward #EEE2C8 (never a tan). It stores nothing, shows no number, never names the time.
//   - REDUCED MOTION: a still frame - no drift, no flutter, and the afternoon is read once and never moves.
// The pieces are placed in VIEWPORT pixels for the window (and placed again on a resize, from the same seed); each carries its geometry as
// data-x1/y1/x2/y2/w, so scripts/frames/arbor2-r5.mjs r5-pergola measures exactly what is drawn.
// Ambiance 0 (spec): the mockup has no Ambiance control of its own yet; reduced motion stands in for it.
const SESSION_START = Date.now();
const INSET = 80;   // the layer sits at inset -80px (styles), so its sheet's origin is (-80, -80) in viewport pixels

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** t in [0, 1]: a third from minutes in the session (0 -> 90), two thirds from the clock (12:00 -> 18:00). */
export function afternoonT(now: Date, sessionStart: number): number {
  const minutes = Math.max(0, (now.getTime() - sessionStart) / 60000);
  const session = Math.min(1, minutes / 90) / 3;
  const hours = now.getHours() + now.getMinutes() / 60;
  const clock = Math.min(1, Math.max(0, (hours - 12) / 6)) * (2 / 3);
  return Math.min(1, session + clock);
}

/** a -> b by t, as #RRGGBB. */
export function mixHex(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** The wait before the next flutter, for u in [0, 1): 6-15 s - never sooner than 6 s, so never more than one event per second. */
export function flutterDelay(u: number): number { return 6000 + Math.floor(Math.min(0.999999, Math.max(0, u)) * 9000); }
/** How long one flutter lasts, for u in [0, 1): 300-600 ms. */
export function flutterMs(u: number): number { return 300 + Math.floor(Math.min(0.999999, Math.max(0, u)) * 300); }

export type Bar = { x1: number; y1: number; x2: number; y2: number; w: number; rot: number };
export type Leaf = { x: number; y: number; size: number; rot: number };

/** The pergola for a W x H room and a seed source r: 3-4 beams, 1-2 crossbeams, the leaves. Viewport pixels; pure (for the unit check). */
export function pergola(W: number, H: number, r: () => number): { beams: Bar[]; cross: Bar[]; leaves: Leaf[] } {
  const n = r() < 0.5 ? 3 : 4;
  const gap = 70 + r() * 14;                          // between beam starts, down the left edge
  const x0 = -60;
  const ys = Array.from({ length: n }, (_, i) => H + 40 - i * gap);   // the lowest third (the top beam starts >= .7 H)
  const yEnd = H * (0.5 + r() * 0.1);                 // where the top beam meets the right edge: the upper half stays clear
  const run = W + INSET - x0;
  const aTop = Math.atan2(ys[n - 1] - yEnd, run);
  const lean = (1 + r() * 0.6) * (Math.PI / 180);   // each lower beam rises a little more (they meet far off to the right)
  const beams: Bar[] = ys.map((y, i) => {
    const a = aTop + (n - 1 - i) * lean * 0.5;
    const L = run / Math.cos(a);
    const w = Math.round(60 - (60 - 36) * (i / (n - 1)) - r() * 4);   // the nearest (lowest) beam is the thickest
    return { x1: x0, y1: y, x2: x0 + L * Math.cos(a), y2: y - L * Math.sin(a), w: Math.max(36, Math.min(60, w)), rot: -a * 180 / Math.PI };
  });
  const lineY = (b: Bar, x: number) => b.y1 + (b.y2 - b.y1) * ((x - b.x1) / (b.x2 - b.x1));
  const nc = r() < 0.5 ? 1 : 2;
  const a0 = Math.atan2(beams[0].y1 - beams[0].y2, beams[0].x2 - beams[0].x1);
  const cross: Bar[] = Array.from({ length: nc }, (_, k) => {
    const x = W * (nc === 1 ? 0.62 + r() * 0.2 : k === 0 ? 0.55 + r() * 0.1 : 0.78 + r() * 0.1);
    const yb = lineY(beams[0], x) + 40, yt = lineY(beams[n - 1], x) - 40;   // from below the lowest beam to above the top one
    const L = (yb - yt) / Math.cos(a0);
    const phi = -a0 - Math.PI / 2;                                         // at right angles to the beams, rising
    const w = Math.round(14 + r() * 6);
    return { x1: x, y1: yb, x2: x + L * Math.cos(phi), y2: yb + L * Math.sin(phi), w, rot: phi * 180 / Math.PI };
  });
  const leaves: Leaf[] = [];
  const along = (b: Bar, t: number, spread: number) => {
    const x = b.x1 + (b.x2 - b.x1) * t, y = b.y1 + (b.y2 - b.y1) * t;
    const nx = -(b.y2 - b.y1), ny = b.x2 - b.x1, nl = Math.hypot(nx, ny) || 1;
    const o = (r() - 0.5) * spread;
    return { x: x + (nx / nl) * o, y: y + (ny / nl) * o };
  };
  for (const b of beams) {
    const count = 6 + Math.floor(r() * 4);
    for (let i = 0; i < count; i++) {
      const p = along(b, 0.2 + r() * 0.75, b.w);
      if (p.x > W + 20 || p.y > H + 20) continue;
      leaves.push({ ...p, size: Math.round(10 + r() * 8), rot: Math.round(r() * 360) });
    }
  }
  for (const c of cross) {                            // denser where the crossbeams cross
    const count = 6 + Math.floor(r() * 4);
    for (let i = 0; i < count; i++) {
      const p = along(c, r(), c.w * 2.4);
      leaves.push({ ...p, size: Math.round(10 + r() * 8), rot: Math.round(r() * 360) });
    }
  }
  return { beams, cross, leaves };
}

export function mountSun(root: HTMLElement): void {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const layer = document.createElement('div');
  layer.className = 'arbor2-sun';
  layer.setAttribute('aria-hidden', 'true');
  // the drift moves this inner sheet, never the layer: the layer holds still so its mask (paper.ts: a hole over the page) stays on the page
  const drift = document.createElement('div');
  drift.className = 'arbor2-sun-drift';
  layer.appendChild(drift);
  const r0 = rng(seed);
  layer.style.setProperty('--sun-drift-x', `${(r0() < 0.5 ? -1 : 1) * (8 + r0() * 10)}px`);
  layer.style.setProperty('--sun-drift-y', `${(r0() < 0.5 ? -1 : 1) * (3 + r0() * 5)}px`);
  let leaves: HTMLElement[] = [];
  const place = (el: HTMLElement, b: Bar) => {
    const L = Math.hypot(b.x2 - b.x1, b.y2 - b.y1);
    el.style.left = `${(b.x1 + INSET).toFixed(1)}px`;
    el.style.top = `${(b.y1 + INSET).toFixed(1)}px`;
    el.style.width = `${L.toFixed(1)}px`;
    el.style.height = `${b.w}px`;
    el.style.setProperty('--beam-rot', `${b.rot.toFixed(2)}deg`);
    Object.entries({ x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2, w: b.w }).forEach(([k, v]) => el.setAttribute(`data-${k}`, String(Math.round(v * 10) / 10)));
  };
  const draw = () => {
    drift.replaceChildren();
    const g = pergola(innerWidth, innerHeight, rng(seed ^ 0x9e3779b9));   // the same seed: a resize redraws the same pergola for the new room
    for (const b of g.beams) { const el = document.createElement('div'); el.className = 'arbor2-sun-beam'; place(el, b); drift.appendChild(el); }
    for (const c of g.cross) { const el = document.createElement('div'); el.className = 'arbor2-sun-cross'; place(el, c); drift.appendChild(el); }
    leaves = g.leaves.map((l) => {
      const el = document.createElement('div');
      el.className = 'arbor2-sun-leaf';
      el.style.left = `${(l.x + INSET).toFixed(1)}px`;
      el.style.top = `${(l.y + INSET).toFixed(1)}px`;
      el.style.setProperty('--leaf-size', `${l.size}px`);
      el.style.setProperty('--leaf-rot', `${l.rot}deg`);
      drift.appendChild(el);
      return el;
    });
  };
  draw();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(draw, 200); });
  document.body.appendChild(layer);
  if (reduce) layer.setAttribute('data-still', 'true');

  const shade = () => {
    const t = afternoonT(new Date(), SESSION_START);
    root.style.setProperty('--arbor2-afternoon', t.toFixed(3));
    root.style.setProperty('--arbor2-day-ground', mixHex('#F1EAD8', '#EEE2C8', t));
  };
  shade();
  if (reduce) return;
  setInterval(shade, 60000);

  const flutter = () => {
    if (leaves.length) {
      const leaf = leaves[Math.floor(Math.random() * leaves.length)];
      const ms = flutterMs(Math.random());
      leaf.style.setProperty('--flutter-ms', `${ms}ms`);
      leaf.setAttribute('data-flutter', 'true');
      setTimeout(() => leaf.removeAttribute('data-flutter'), ms);
    }
    setTimeout(flutter, flutterDelay(Math.random()));
  };
  setTimeout(flutter, flutterDelay(Math.random()));
}
