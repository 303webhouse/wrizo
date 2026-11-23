// FLUX'S MARK (S5, v5; the Wrizors' build sheet, Nov 22): WRIZ as type in Rajdhani 700 and the O as a solid brass block cursor, which never glitches. One drawing for every place it shows: the splash (FluxFive.tsx),
// the in-app corner (FluxAppMark, in App.tsx's BrandMark) and the picker card (FluxMarkStill). Geometry and glitches are the approved v5 page's ("Flux splash"), unchanged.
//   TEAR (bands jump sideways, a cyan ghost, scanlines) · DECODE (one letter scrambles through lime code and resolves) · SIGNAL LOSS (a cyan glow; the letters drop to interlace and roll a few px, twice).
//   Idle: one glitch for every 60 s she neither types nor moves the pointer (5 s on the splash's held frame), the mode at random, never the same twice running; any key or pointer movement restarts the clock.
//   Off under reduced motion. In the app it also keeps Flux's own switches for an idle glitch (Flicker, Ambiance 0) and stays out of the Corridor. Every glitch asks the flash budget first.
import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { tryFlash } from '../store/flashBudget';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { useWritingSettings } from '../store/writingSettings';
import { useJacked } from './jackIn';

export const FX = { ground: '#020C10', box: '#04141A', hair: '#1D4A52', hair2: '#2A6A76', ink: '#E3F1EC', mid: '#7EB4C4', cyan: '#00C2FF', lime: '#B7FF3C', brass: '#FF9800' } as const;
export const FX_LABEL = "'Chakra Petch', 'Figtree', system-ui, sans-serif";
export const FX_HEAD = "'Rajdhani', 'Figtree', system-ui, sans-serif";
export const WORD = 'WRIZ';
export const GLYPHS = '/\\|<>[]{}01#%=+*;:';
const TEAR = [[-24, 15, -9, 28, -17, 10, -5], [18, -12, 26, -7, 13, -22, 8], [-10, 22, -15, 6, -26, 14, -8]];
const GLOW = 'drop-shadow(0 0 9px #57D0F5) drop-shadow(0 0 26px rgba(0,194,255,.65))';
const MODES = ['tear', 'decode', 'signal'] as const;
const GLITCH_MS = 460;

export type GlitchMode = (typeof MODES)[number];
export interface Glitch { mode: GlitchMode; g: number; letter: number }
interface Metrics { cap: number; w: number[] }

declare global { interface Window { __f3MarkIdleShift?: number } }

// Rajdhani's own proportions, read from the loaded face (the fallback is the face's, so the first frame is already close)
const FALLBACK: Metrics = { cap: 0.63, w: [0.86, 0.6, 0.27, 0.55] };
let measured: Metrics | null = null;
function measure(): Metrics | null {
  try {
    const c = document.createElement('canvas').getContext('2d');
    if (!c) return null;
    c.font = "700 200px 'Rajdhani'";
    const cap = c.measureText('Z').actualBoundingBoxAscent / 200;
    return cap > 0.4 && cap < 0.9 ? { cap, w: [...WORD].map((ch) => c.measureText(ch).width / 200) } : null;
  } catch { return null; }
}
export function useFluxMetrics(): Metrics {
  const [met, setMet] = useState<Metrics>(measured ?? FALLBACK);
  useEffect(() => {
    if (measured || typeof document === 'undefined' || !document.fonts) return undefined;
    let live = true;
    document.fonts.load("700 40px 'Rajdhani'", WORD).then(() => document.fonts.ready).catch(() => undefined).then(() => {
      const m = measure();
      if (m) measured = m;
      if (live && m) setMet(m);
    });
    return () => { live = false; };
  }, []);
  return met;
}

export function markGeometry(met: Metrics, top: number, C: number, center = 675) {
  const fs = C / met.cap, track = C * 0.6, gap = C * 0.52, bw = C * 0.95, bh = C * 1.12;
  const ws = met.w.map((w) => w * fs);
  const total = ws[0] + ws[1] + ws[2] + ws[3] + 3 * track + gap + bw;
  const left = center - total / 2, cx: number[] = [];
  let x = left;
  for (let i = 0; i < 4; i += 1) { cx.push(x + ws[i] / 2); x += ws[i] + (i < 3 ? track : gap); }
  return { fs, bw, bh, cx, left, right: x + bw, curX: x, curY: top + C * 0.16, base: top + C, x0: cx[0] - ws[0] / 2 - 40, x1: cx[3] + ws[3] / 2 + 40, y0: top - 10, h: C + 20 };
}

/** The mark as an SVG group, at rest. `paintFluxMark` drives it. */
export function FluxMarkArt({ met, top, cap, center = 675 }: { met: Metrics; top: number; cap: number; center?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const G = markGeometry(met, top, cap, center);
  const band = G.h / 7;
  const letter = { fontFamily: FX_HEAD, fontWeight: 700 } as const;
  return (
    <g className="fx-wordmark" data-flux-mark="" data-mask={`url(#f5mk${id})`}>
      <defs>
        <pattern id={`f5il${id}`} width={8} height={8} patternUnits="userSpaceOnUse"><rect width={8} height={4} fill="#fff" /></pattern>
        <mask id={`f5mk${id}`} maskUnits="userSpaceOnUse" x={G.x0} y={G.y0 - 10} width={G.x1 - G.x0} height={G.h + 20}><rect x={G.x0} y={G.y0 - 10} width={G.x1 - G.x0} height={G.h + 20} fill={`url(#f5il${id})`} /></mask>
        <pattern id={`f5sc${id}`} width={6} height={6} patternUnits="userSpaceOnUse"><rect width={6} height={2} fill={FX.ground} /></pattern>
        {TEAR[0].map((_, b) => <clipPath key={b} id={`f5cp${id}_${b}`}><rect x={G.x0 - 60} y={G.y0 + b * band} width={G.x1 - G.x0 + 120} height={band} /></clipPath>)}
      </defs>
      <g data-part="bands" visibility="hidden">
        {TEAR[0].map((_, b) => (
          <g key={b} clipPath={`url(#f5cp${id}_${b})`}>
            <g data-part="band">
              {[...WORD].map((ch, i) => <text key={`g${i}`} x={G.cx[i] + 12} y={G.base} fontSize={G.fs} textAnchor="middle" fill={FX.cyan} opacity={0.75} style={letter}>{ch}</text>)}
              {[...WORD].map((ch, i) => <text key={`l${i}`} x={G.cx[i]} y={G.base} fontSize={G.fs} textAnchor="middle" fill={FX.ink} style={letter}>{ch}</text>)}
            </g>
          </g>
        ))}
      </g>
      <g data-part="letters">
        {[...WORD].map((ch, i) => <text key={i} data-flux-letter="" x={G.cx[i]} y={G.base} fontSize={G.fs} textAnchor="middle" fill={FX.ink} style={letter}>{ch}</text>)}
      </g>
      <rect data-part="scan" x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.h} fill={`url(#f5sc${id})`} opacity={0.55} visibility="hidden" />
      <rect data-flux-cursor="" x={G.curX} y={G.curY} width={G.bw} height={G.bh} fill={FX.brass} />
    </g>
  );
}

/** chars: what each letter shows (null = not yet); code: which are still code; glitch: the one running, if any. The cursor is never touched by a glitch. */
export function paintFluxMark(mark: Element, chars: (string | null)[], code: boolean[], cursorOn: boolean, glitch: Glitch | null): void {
  const letters = mark.querySelector<SVGGElement>('[data-part=letters]'), bands = mark.querySelector('[data-part=bands]'), scan = mark.querySelector('[data-part=scan]'), cur = mark.querySelector('[data-flux-cursor]');
  if (!letters || !bands || !scan || !cur) return;
  const show = chars.slice(), lime = code.slice(), mode = glitch?.mode, g = glitch?.g ?? 0;
  bands.setAttribute('visibility', 'hidden'); scan.setAttribute('visibility', 'hidden');
  letters.setAttribute('visibility', 'visible'); letters.removeAttribute('mask'); letters.removeAttribute('transform'); letters.style.filter = '';
  if (mode === 'tear' && g < 220) {
    const p = Math.min(2, Math.floor(g / 74));
    letters.setAttribute('visibility', 'hidden'); bands.setAttribute('visibility', 'visible'); scan.setAttribute('visibility', 'visible');
    mark.querySelectorAll('[data-part=band]').forEach((b, i) => b.setAttribute('transform', `translate(${TEAR[p][i]},0)`));
  } else if (mode === 'decode' && g < 400 && glitch) {
    show[glitch.letter] = GLYPHS[(glitch.letter * 5 + Math.floor(g / 66) * 7) % GLYPHS.length]; lime[glitch.letter] = true;
  } else if (mode === 'signal' && g < 420) {
    letters.style.filter = GLOW;
    const drop = g < 150 ? 1 : g >= 270 ? 2 : 0;
    if (drop) { letters.setAttribute('mask', mark.getAttribute('data-mask') ?? ''); letters.setAttribute('transform', `translate(0,${drop === 1 ? 5 : -4})`); }
  }
  if (glitch) mark.setAttribute('data-glitch', glitch.mode); else mark.removeAttribute('data-glitch');
  letters.querySelectorAll('[data-flux-letter]').forEach((n, i) => { n.textContent = show[i] ?? ''; n.setAttribute('fill', lime[i] ? FX.lime : FX.ink); });
  cur.setAttribute('visibility', cursorOn ? 'visible' : 'hidden');
}

const REST = [...WORD], CLEAN = [false, false, false, false];

/** One glitch for every `periodMs` of stillness. `shiftable`: the in-app clock takes the harness's window.__f3MarkIdleShift (seconds). */
export function useMarkIdle(root: RefObject<Element | null>, periodMs: number, on: boolean, shiftable = false): void {
  useEffect(() => {
    if (!on || prefersReducedMotion()) return undefined;
    let lastAct = performance.now(), lastGlitch = lastAct, last: GlitchMode | '' = '', live: { mode: GlitchMode; t0: number; letter: number } | null = null, raf = 0;
    const markEl = () => root.current?.querySelector('[data-flux-mark]') ?? null;
    const frame = () => {
      raf = 0;
      if (!live) return;
      const mark = markEl(), g = performance.now() - live.t0;
      if (!mark || g > GLITCH_MS) { live = null; if (mark) paintFluxMark(mark, REST, CLEAN, true, null); return; }
      paintFluxMark(mark, REST, CLEAN, true, { mode: live.mode, g, letter: live.letter });
      raf = requestAnimationFrame(frame);
    };
    const act = () => { lastAct = performance.now(); };
    const opts = { capture: true, passive: true } as const;
    const EVENTS = ['keydown', 'pointermove', 'pointerdown'] as const;
    EVENTS.forEach((ev) => document.addEventListener(ev, act, opts));
    const timer = window.setInterval(() => {
      if (live || document.hidden) return;
      const now = performance.now(), shift = shiftable ? (window.__f3MarkIdleShift ?? 0) * 1000 : 0;
      if (now - Math.max(lastAct, lastGlitch) + shift < periodMs || !tryFlash('flux-mark')) return;
      const pick = MODES.filter((m) => m !== last), mode = pick[Math.floor(Math.random() * pick.length)];
      last = mode; lastGlitch = now;
      live = { mode, t0: now, letter: Math.floor(Math.random() * 4) };
      raf = requestAnimationFrame(frame);
    }, 200);
    return () => {
      window.clearInterval(timer);
      EVENTS.forEach((ev) => document.removeEventListener(ev, act, opts));
      cancelAnimationFrame(raf);
      const mark = markEl();
      if (mark) paintFluxMark(mark, REST, CLEAN, true, null);
    };
  }, [root, periodMs, on, shiftable]);
}

function SmallMark({ height, svgRef }: { height: number; svgRef?: RefObject<SVGSVGElement | null> }) {
  const met = useFluxMetrics();
  const G = markGeometry(met, 10, 90);
  const x = G.left - 4, y = 6, w = G.right - G.left + 8, h = 90 * 1.28 + 10;
  return (
    <svg ref={svgRef} viewBox={`${x} ${y} ${w} ${h}`} height={height} width={(height * w) / h} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true" focusable="false">
      <FluxMarkArt met={met} top={10} cap={90} />
    </svg>
  );
}

/** The in-app mark, top-left: its 60 s glitch, the cursor blinking at 1.05 s (flux-v3.css; steady under reduced motion). */
export function FluxAppMark() {
  const ref = useRef<HTMLSpanElement | null>(null);
  const settings = useWritingSettings();
  const dial = useAmbianceDial();
  const jacked = useJacked();
  useMarkIdle(ref, 60000, settings.flicker && dial > 0 && !jacked, true);
  return <span ref={ref} className="flux5-mark" data-flux-appmark=""><SmallMark height={22} /></span>;
}

/** The picker card's mark: still, the same drawing. */
export function FluxMarkStill({ height = 30 }: { height?: number }) {
  const svg = useRef<SVGSVGElement | null>(null);
  useLayoutEffect(() => { const m = svg.current?.querySelector('[data-flux-mark]'); if (m) paintFluxMark(m, REST, CLEAN, true, null); }, []);
  return <SmallMark height={height} svgRef={svg} />;
}
