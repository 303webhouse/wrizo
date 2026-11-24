// FLUX'S SPLASH, v5 (S5; the Wrizors' build sheet, Nov 22; Nick approved v5 Nov 9, 8:49 and 8:58 pm). Built from the approved page "Flux splash", on the schematic's own 1350 x 1080 drawing.
// ONE RUN, THREE PLACES: `splash` plays it on the app's opening splash; `door` is its finished frame on the front door, with the doors live; `still` is the same frame behind the sign-in pop-out.
// The splash hands over to the front door on the same frame, in the same box, so `.wz-splash` is gone once the doors are live (the app's "splash gone" contract) and nothing holds a writer who opened a page.
// Brass is on the wires and their dots only. A box comes online by its outline stepping from #2A6A76 to #7EB4C4. No arrowheads, no FINAL DRAFT pop. Every word comes through the lexicon; the schematic's own words are a drawing.
import { Fragment, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import type { DeskTermId } from '../store/deskLexicon';
import { FX, FX_HEAD, FX_LABEL, FluxMarkArt, GLYPHS, WORD, paintFluxMark, useFluxMetrics, useMarkIdle } from './fluxMark';

const T = { boot: 200, step: 170, sw: 55, n: 5, tiles: 975, tag: 1500, tch: 50, sig: 2900, doors: 3350, dch: 35, idle: 5000 };
const COMPOSE_CHARS = '[ COMPOSE ]'.length;
export const FIVE_DONE = T.doors + COMPOSE_CHARS * T.dch + 15;   // 3750: the doors are live
const LINES: readonly DeskTermId[] = ['splashLoading1', 'splashLoading2', 'splashLoading3', 'splashLoading4'];
const TILES: ReadonlyArray<readonly [string, number]> = [['I', 70], ['D', 120], ['E', 170], ['A', 220], ['S', 270]];
const WIRES: ReadonlyArray<readonly [string, string, number, number]> = [
  ['bus1', 'M314,540 L400,540', 1300, 160], ['bypass', 'M292,518 L292,400 L830,400 L830,505', 1300, 700], ['bus2', 'M580,540 L700,540', 1500, 280], ['out', 'M880,540 L1010,540', 1850, 260],
  ['tap1', 'M292,562 L292,830', 1250, 300], ['tap2', 'M556,575 L556,830', 1500, 300], ['tap3', 'M870,575 L870,830', 1820, 300], ['tap4', 'M1232,590 L1232,830', 2150, 300],
  ['armL', 'M292,830 L600,830', 1550, 350], ['armR', 'M1232,830 L800,830', 2450, 400],
];
const DOTS: ReadonlyArray<readonly [number, number, number]> = [[400, 540, 1460], [830, 505, 2000], [700, 540, 1780], [1010, 540, 2110], [292, 562, 1250], [556, 575, 1500], [870, 575, 1820], [1232, 590, 2150], [600, 830, 1900], [800, 830, 2850], [556, 830, 1800], [870, 830, 2740]];
const NODES: ReadonlyArray<readonly [string, number]> = [['text', 1460], ['page', 1780], ['final', 2110], ['feedback', 1900]];
const SUBS: ReadonlyArray<readonly [string, number, number]> = [
  ['STRUCTURE', 114, 618], ['RESEARCH', 114, 653], ['FLEXIBILITY', 114, 688], ['QUOTES', 450, 629], ['UNIQUE', 450, 664], ['INK', 450, 699], ['LINEAR', 736, 629], ['COHERENT', 736, 664],
  ['POLISH', 1060, 644], ['ERROR-FREE', 1060, 679], ['FILE TYPE', 1060, 714], ['SHAREABLE', 1060, 749], ['AUTOMATED', 650, 914], ['AI TUTOR', 650, 949], ['WORKSHOPS', 650, 984],
];
const TREES = ['M84,566 L84,681 M84,611 L104,611 M84,646 L104,646 M84,681 L104,681', 'M420,577 L420,692 M420,622 L440,622 M420,657 L440,657 M420,692 L440,692', 'M712,577 L712,657 M712,622 L728,622 M712,657 L728,657', 'M1030,592 L1030,742 M1030,637 L1050,637 M1030,672 L1050,672 M1030,707 L1050,707 M1030,742 L1050,742', 'M620,867 L620,977 M620,907 L640,907 M620,942 L640,942 M620,977 L640,977'];
/** The lit IDEAS tile edge (the Wrizors' REAL 1, Nov 23): its own constant, drawn exactly, not derived from FX.mid. */
const IDEAS_EDGE = '#5F8F95';
const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** The whole 1350 x 1080 drawing fits the window: at the shared splash size its 17-unit tags would be about 8 px at 1366 x 768 (the sheet's guard 2: no word under 10 px). */
export function fluxBoxFor(vw: number, vh: number) {
  const s = Math.min(vw / 1350, vh / 1080), width = 1350 * s, height = 1080 * s;
  return { width, height, inkW: width, inkH: height };
}

// ---- THE RUN (once per app load; held in memory, never stored) ----
let running = false, startAt = 0, frozen: number | null = null, wantCompose = false, seekHere: ((ms: number) => void) | null = null;
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => f());
export function beginFluxRun(): void { running = true; startAt = performance.now(); frozen = null; tell(); }
export function finishFluxRun({ compose = false }: { compose?: boolean } = {}): void { if (compose) wantCompose = true; running = false; tell(); }
export function takeFluxCompose(): boolean { const w = wantCompose; wantCompose = false; return w; }
export function onFluxRun(fn: () => void): () => void { subs.add(fn); return () => { subs.delete(fn); }; }
export function useFluxRunning(): boolean { return useSyncExternalStore(onFluxRun, () => running, () => false); }
// test seam (the v5 page's own __seek): holds the run at a moment. Past DONE it ends the run as the clock would.
if (typeof window !== 'undefined') (window as unknown as { wrizoFluxSplash?: unknown }).wrizoFluxSplash = { DONE: FIVE_DONE, seek: (ms: number) => { frozen = ms; seekHere?.(ms); } };

export interface FluxFiveProps {
  mode: 'splash' | 'door' | 'still';
  width: number;
  height: number;
  authed?: boolean | null;
  /** door: the session has answered, so the doors can be pressed */
  ready?: boolean;
  onFloorReached?: () => void;
  onLogin?: () => void;
  onCompose?: () => void;
  onResume?: () => void;
}

export function FluxFive({ mode, width, height, authed = null, ready = false, onFloorReached, onLogin, onCompose, onResume }: FluxFiveProps) {
  const { t } = useDeskLexicon();
  const met = useFluxMetrics();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const floorRef = useRef(onFloorReached);
  floorRef.current = onFloorReached;
  const front = mode !== 'splash' || (typeof location !== 'undefined' && /^#?\/?$/.test(location.hash));
  const doors = front && mode !== 'still';
  const live = mode === 'door' && ready;
  const words = { wiring: t('splashWiringIn').toUpperCase(), tagline: t('splashTagline').toUpperCase(), login: `[ ${t('authSignIn').toUpperCase()} ]`, compose: `[ ${t('splashDoorCompose').toUpperCase()} ]`, resume: `[ ${t('splashDoorResume').toUpperCase()} ]`, lines: LINES.map((k) => t(k).toUpperCase()) };
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const authedRef = useRef(authed);
  authedRef.current = authed;

  // ---- paint one moment of the run, on the elements (60 frames a second never go through React) ----
  const paint = (at: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const w = wordsRef.current, done = at >= FIVE_DONE;
    const chars: (string | null)[] = [], code: boolean[] = [];
    for (let i = 0; i < 4; i += 1) {
      const s0 = T.boot + i * T.step;
      if (at < s0) { chars.push(null); code.push(false); }
      else if (at < s0 + T.n * T.sw) { chars.push(GLYPHS[(i * 7 + Math.floor((at - s0) / T.sw) * 3 + 2) % GLYPHS.length]); code.push(true); }
      else { chars.push(WORD[i]); code.push(false); }
    }
    const mark = svg.querySelector('[data-flux-mark]');
    if (mark) paintFluxMark(mark, chars, code, true, at >= T.sig && at < T.sig + 420 ? { mode: 'signal', g: at - T.sig, letter: 0 } : null);
    const tag = svg.querySelector('[data-flux-tagline]');
    if (tag) tag.textContent = w.tagline.slice(0, Math.max(0, Math.min(w.tagline.length, Math.floor((at - T.tag) / T.tch) + 1)));
    svg.querySelectorAll<SVGGElement>('[data-flux-tile]').forEach((g, k) => {
      const on = at >= T.tiles + k * 45;
      g.querySelector('rect')?.setAttribute('stroke', on ? IDEAS_EDGE : FX.hair2);
      g.querySelector('text')?.setAttribute('fill', on ? FX.ink : FX.mid);
    });
    svg.querySelectorAll('[data-flux-wire]').forEach((p, k) => p.setAttribute('stroke-dashoffset', (1 - clamp((at - WIRES[k][2]) / WIRES[k][3])).toFixed(4)));
    svg.querySelectorAll('[data-flux-dot]').forEach((c, k) => c.setAttribute('fill', at >= DOTS[k][2] ? FX.brass : FX.hair2));
    svg.querySelectorAll('[data-flux-node]').forEach((g, k) => {
      const on = at >= NODES[k][1];
      g.querySelector('rect')?.setAttribute('stroke', on ? FX.mid : FX.hair2);
      g.querySelector('[data-name]')?.setAttribute('fill', on ? FX.ink : FX.mid);
    });
    const typed = Math.max(0, Math.floor((at - T.doors) / T.dch) + 1);
    const first = svg.querySelector('[data-flux-door=login] .cmd, [data-flux-door=resume] .cmd'), second = svg.querySelector('[data-flux-door=compose] .cmd');
    if (first) first.textContent = (authedRef.current ? w.resume : w.login).slice(0, typed);
    if (second) second.textContent = w.compose.slice(0, typed);
    const a = svg.querySelector('[data-status-a]'), b = svg.querySelector('[data-status-b]');
    if (a) a.textContent = done ? '' : w.wiring;
    if (b) b.textContent = done ? '' : ` // ${w.lines[Math.min(3, Math.floor(at / 950))]}`;
  };
  const paintRef = useRef(paint);
  paintRef.current = paint;

  // the tagline's place is measured once, on its whole text, so it types in without moving
  useLayoutEffect(() => {
    const tag = svgRef.current?.querySelector<SVGTextElement>('[data-flux-tagline]');
    if (!tag) return;
    tag.textContent = wordsRef.current.tagline; tag.setAttribute('x', '0');
    const len = tag.getComputedTextLength();
    tag.setAttribute('x', (675 - len / 2).toFixed(1));
    paintRef.current(mode === 'splash' ? (frozen ?? performance.now() - startAt) : FIVE_DONE + 1);
  }, [met, mode, authed, width]);

  // the run's clock
  useEffect(() => {
    if (mode !== 'splash') return undefined;
    let raf = 0, floored = false;
    const floor = () => { if (!floored) { floored = true; floorRef.current?.(); } };
    const tick = () => {
      raf = 0;
      if (frozen !== null) return;
      const at = performance.now() - startAt;
      paintRef.current(at);
      if (at >= FIVE_DONE) { floor(); return; }
      raf = requestAnimationFrame(tick);
    };
    seekHere = (ms) => { cancelAnimationFrame(raf); raf = 0; paintRef.current(ms); if (ms >= FIVE_DONE) floor(); };
    if (frozen !== null) seekHere(frozen); else raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); seekHere = null; };
  }, [mode]);

  useMarkIdle(svgRef, T.idle, mode === 'door');

  // focus starts on COMPOSE, once, when the doors are live
  const focused = useRef(false);
  useEffect(() => {
    if (!live || focused.current) return;
    focused.current = true;
    svgRef.current?.querySelector<SVGGElement>('[data-flux-door=compose]')?.focus({ preventScroll: true });
  }, [live]);

  const press = (fn?: () => void) => () => { if (live) fn?.(); };
  const key = (fn?: () => void) => (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    if (live) fn?.();
  };
  const door = (id: 'login' | 'resume' | 'compose', box: readonly [number, number, number, number], bar: readonly [number, number], cmd: readonly [number, number], label: string, fn?: () => void) => (
    <g key={id} data-flux-door={id} data-wait={live ? undefined : ''} role={mode === 'door' ? 'button' : undefined} tabIndex={mode === 'door' ? (live ? 0 : -1) : undefined} aria-label={mode === 'door' ? label : undefined}
      onClick={press(fn)} onKeyDown={key(fn)} style={{ cursor: live ? 'pointer' : 'default', outline: 'none', pointerEvents: live ? 'auto' : 'none' }}>
      <rect className="hit" x={box[0]} y={box[1]} width={box[2]} height={box[3]} fill="transparent" />
      <rect className="ring" x={box[0]} y={box[1]} width={box[2]} height={box[3]} fill="none" stroke={FX.cyan} opacity={0} style={{ strokeWidth: 'max(3px, calc(2.2px / var(--f5s)))' }} />
      <rect className="bar" x={bar[0]} y={bar[1]} width={4} height={28} fill={FX.brass} opacity={0} />
      <text className="cmd" x={cmd[0]} y={cmd[1]} fill={FX.ink} style={{ fontFamily: FX_LABEL, fontWeight: 600, fontSize: 'max(26px, calc(12.05px / var(--f5s)))', letterSpacing: '.12em' }} />
    </g>
  );

  const label = (size: number) => ({ fontFamily: FX_LABEL, fontSize: `max(${size}px, calc(10.05px / var(--f5s)))` });
  const tagStyle = { ...label(17), letterSpacing: '.12em' };
  const subStyle = { ...label(19), letterSpacing: '.14em' };
  const nameStyle = { fontFamily: FX_HEAD, fontWeight: 600, fontSize: 27, letterSpacing: '.08em' };
  const box = (x: number, y: number, w: number, h: number) => <rect x={x} y={y} width={w} height={h} fill={FX.box} stroke={FX.hair2} strokeWidth={3} />;
  const name = (x: number, word: string, y = 551) => <text data-name="" x={x} y={y} textAnchor="middle" fill={FX.mid} style={nameStyle}>{word}</text>;
  const dotsId = `wz-flux5-dots-${mode}`;

  return (
    <svg ref={svgRef} className="wz-flux5" data-held={mode === 'door' ? '' : undefined} width={width} height={height} viewBox="0 0 1350 1080" role={mode === 'door' ? 'group' : 'img'} aria-label="Wrizo"
      style={{ ['--f5s' as string]: width / 1350, display: 'block' } as React.CSSProperties}>
      <defs><pattern id={dotsId} width={30} height={30} patternUnits="userSpaceOnUse"><circle cx={1.5} cy={1.5} r={1.5} fill={FX.hair} /></pattern></defs>
      <rect x={40} y={40} width={1270} height={1000} fill={`url(#${dotsId})`} opacity={0.55} />
      <path d="M40,80 L40,40 L80,40 M1270,40 L1310,40 L1310,80 M1310,1000 L1310,1040 L1270,1040 M80,1040 L40,1040 L40,1000" fill="none" stroke={FX.hair} strokeWidth={2} />
      <FluxMarkArt met={met} top={122} cap={90} />
      <text data-flux-tagline="" y={296} fill={FX.mid} style={{ ...label(22), letterSpacing: '.3em' }} />
      {TREES.map((d) => <path key={d} d={d} fill="none" stroke={FX.hair} strokeWidth={2} />)}
      {SUBS.map(([word, x, y]) => <text key={word} x={x} y={y} fill={FX.mid} style={subStyle}>{word}</text>)}
      {WIRES.map(([id, d]) => <path key={id} d={d} fill="none" stroke={FX.hair2} strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" />)}
      {WIRES.map(([id, d]) => <path key={id} data-flux-wire={id} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1} fill="none" stroke={FX.brass} strokeWidth={4} strokeLinecap="square" strokeLinejoin="miter" />)}
      <text x={70} y={462} fill={FX.cyan} style={tagStyle}>N.01 · INPUT</text>
      {TILES.map(([ch, x]) => <g key={ch} data-flux-tile={ch}><rect x={x} y={518} width={44} height={44} fill={FX.box} stroke={FX.hair2} strokeWidth={3} /><text x={x + 22} y={550} textAnchor="middle" fill={FX.mid} style={{ fontFamily: FX_HEAD, fontWeight: 600, fontSize: 28 }}>{ch}</text></g>)}
      <text x={400} y={490} fill={FX.cyan} style={tagStyle}>N.02</text>
      <g data-flux-node="text">{box(400, 505, 180, 70)}{name(490, 'TEXT')}</g>
      <text x={700} y={490} fill={FX.cyan} style={tagStyle}>N.03</text>
      <g data-flux-node="page">{box(700, 505, 180, 70)}{name(790, 'PAGE')}</g>
      <text x={1010} y={444} fill={FX.cyan} style={tagStyle}>N.05 · OUTPUT</text>
      <g data-flux-node="final">{box(1010, 490, 240, 100)}<rect x={1019} y={499} width={222} height={82} fill="none" stroke={FX.hair2} strokeWidth={2} />{name(1130, 'FINAL DRAFT')}</g>
      <text x={600} y={783} fill={FX.cyan} style={tagStyle}>N.04 · LOOP</text>
      <g data-flux-node="feedback">{box(600, 795, 200, 70)}{name(700, 'FEEDBACK', 841)}</g>
      {DOTS.map(([cx, cy]) => <circle key={`${cx},${cy}`} data-flux-dot="" cx={cx} cy={cy} r={6} fill={FX.hair2} />)}
      {doors && (
        <Fragment>
          {authed ? door('resume', [46, 440, 282, 134], [56, 477], [70, 500], t('splashDoorResume'), onResume) : door('login', [46, 440, 282, 134], [56, 477], [70, 500], t('authSignIn'), onLogin)}
          {door('compose', [986, 422, 278, 180], [996, 457], [1010, 480], t('splashDoorCompose'), onCompose)}
        </Fragment>
      )}
      <text data-flux-status="" x={84} y={1012} fill={FX.mid} style={{ ...label(17), letterSpacing: '.14em' }}><tspan data-status-a="" fill={FX.lime} /><tspan data-status-b="" /></text>
    </svg>
  );
}
