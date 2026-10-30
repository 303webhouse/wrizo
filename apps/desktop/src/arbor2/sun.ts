// ARBOR v2 MOCKUP - §14 item 6: the day room's light (spec §7.1-7.2, §7.4; Fable's ruling 2).
//
// Sun through a pergola: slat shadows and leaf shadows on the ROOM, drawn as one fixed layer BEHIND everything (body is its own stacking
// context under the flag, so the layer sits above the sun pool and under the vignette and every surface). NEVER ACROSS THE PROSE COLUMN
// (spec §7.1, Fable Oct 29): an opaque page was not enough - Free Write's Typewriter zoom masks the page see-through at its top and bottom,
// and the frames showed the slats through it. paper.ts cuts a hole in this layer over the visible page, so the shadows show in the margins only.
//
//   - RANDOMISED PER SESSION: a fresh seed each time the app opens (slat angle and spacing, leaf clusters, drift direction). In memory only.
//   - DRIFT: transform only, one 48 s loop (>= 12 s).
//   - FLUTTER: one leaf cluster shimmers for 300-600 ms (opacity/transform), at random intervals >= 6 s apart: never more than one event
//     per second, far inside the 3/s flash budget.
//   - THE AFTERNOON (ruling 2: "behaviour with no data"): minutes in this session (0 -> 90 min = a third of the way) and the local clock
//     (noon -> 18:00 = the rest) blend into one number t in [0, 1]. It deepens the shadows (10% -> 22%), lengthens them (scaleY up to 1.35)
//     and shades the whitewash toward #E3D4B6 (every day text pair re-measured on that ground: letter 8.23, mid 6.47, low 5.80, guide 5.31).
//     It reads the clock and a session start held in this module; it stores nothing, shows no number, and never names the time.
//   - REDUCED MOTION: a still frame - no drift, no flutter, and the afternoon is read once and never moves.
// Ambiance 0 (spec): the mockup has no Ambiance control of its own yet; reduced motion stands in for it.
const SESSION_START = Date.now();

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

export function mountSun(root: HTMLElement): void {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const r = rng((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
  const layer = document.createElement('div');
  layer.className = 'arbor2-sun';
  layer.setAttribute('aria-hidden', 'true');
  // the drift moves this inner sheet, never the layer: the layer holds still so its clip (paper.ts: a hole over the page) stays on the page
  const drift = document.createElement('div');
  drift.className = 'arbor2-sun-drift';
  layer.appendChild(drift);
  const slats = document.createElement('div');
  slats.className = 'arbor2-sun-slats';
  drift.appendChild(slats);
  const angle = 14 + r() * 22;            // slat angle, degrees
  const gap = 90 + r() * 70;              // slat spacing, px
  const width = 18 + r() * 16;            // slat shadow width, px
  layer.style.setProperty('--sun-angle', `${angle.toFixed(1)}deg`);
  layer.style.setProperty('--sun-gap', `${gap.toFixed(0)}px`);
  layer.style.setProperty('--sun-slat', `${width.toFixed(0)}px`);
  layer.style.setProperty('--sun-drift-x', `${(r() < 0.5 ? -1 : 1) * (10 + r() * 14)}px`);
  layer.style.setProperty('--sun-drift-y', `${(r() < 0.5 ? -1 : 1) * (4 + r() * 8)}px`);
  const leaves: HTMLElement[] = [];
  const clusters = 5 + Math.floor(r() * 4);
  for (let i = 0; i < clusters; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'arbor2-sun-leaf';
    // clusters hug the room's edges (the vine on the pergola's beams), never the middle third where the page sits
    const side = r() < 0.5 ? r() * 0.3 : 0.7 + r() * 0.3;
    leaf.style.left = `${(side * 100).toFixed(1)}%`;
    leaf.style.top = `${(r() * 85).toFixed(1)}%`;
    leaf.style.setProperty('--leaf-size', `${(120 + r() * 160).toFixed(0)}px`);
    leaf.style.setProperty('--leaf-rot', `${(r() * 360).toFixed(0)}deg`);
    drift.appendChild(leaf);
    leaves.push(leaf);
  }
  document.body.appendChild(layer);
  if (reduce) layer.setAttribute('data-still', 'true');

  const shade = () => {
    const t = afternoonT(new Date(), SESSION_START);
    root.style.setProperty('--arbor2-afternoon', t.toFixed(3));
    root.style.setProperty('--arbor2-day-ground', mixHex('#EFE6D2', '#E3D4B6', t));
  };
  shade();
  if (reduce) return;
  setInterval(shade, 60000);

  const flutter = () => {
    const leaf = leaves[Math.floor(Math.random() * leaves.length)];
    const ms = 300 + Math.floor(Math.random() * 300);
    leaf.style.setProperty('--flutter-ms', `${ms}ms`);
    leaf.setAttribute('data-flutter', 'true');
    setTimeout(() => leaf.removeAttribute('data-flutter'), ms);
    setTimeout(flutter, 6000 + Math.floor(Math.random() * 9000));
  };
  setTimeout(flutter, 6000 + Math.floor(Math.random() * 6000));
}
