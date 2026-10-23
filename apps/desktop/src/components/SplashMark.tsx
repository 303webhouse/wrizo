import { useEffect, useRef } from 'react';
import type { ThemeId } from '../store/theme';

// SPLASH-SWEEP (Fable, Oct 16; docs/briefs/splash-brief.md + splash-build-kit.md
// carry Nick's own rulings and the reference material this file builds from).
//
// Replaces the old two-asset (cream/warm-ink) sketch with a drawn-on-open,
// per-theme animation: Arbor is Nick's hand-drawn sketch, cut into layers and
// swept brass from IDEAS to FINAL DRAFT; Flux is a vector schematic of the
// same five steps (IDEAS, TEXT, PAGE, FEEDBACK, FINAL DRAFT), swept the same
// way. Round 3 (Nick): only the CONNECTORS and the stage OUTLINES turn brass —
// never the letters/labels inside them. Round 4 (Nick): every mockup timing
// below is multiplied by 0.7 ("30% faster"), and the splash's hold floor is
// no longer a fixed 5s — it is this animation's own length (Splash.tsx reads
// that back via `onFloorReached`, replacing the old fixed-floor timer; the
// ready-gate, the 10s ceiling and pointer-events:none are untouched, owned by
// Splash.tsx still).
//
// WHAT THIS FILE DOES NOT FAITHFULLY REPRODUCE, and why: the mockup artifact
// ("Splash Sweep Mockup", round 4) is the canonical reference, but the build
// kit excerpts its script with some helper/setup code omitted (`$`, `mk`,
// `state`, `PHRASES`, the exact `glowOn`/`glowOff`/`glowRest` filter values,
// and `arEdges`'/`arIdeas`'s own DOM wiring). Everything the BRIEF states in
// words (which stage/connector lights when, the pop's own numbers, the
// reduced-motion end state) is built exactly as written; the one place this
// file supplies its own values is the brass GLOW's own drop-shadow
// parameters (the brief only says "a short glow" for IDEAS and FINAL DRAFT,
// TEXT/PAGE/FEEDBACK get a plain crossfade per the mockup script's own
// structure) — flagged here for a visual compare against the mockup once a
// box turn opens.

const SPEED = 0.7; // Round 4 (Nick, live): "every time below is multiplied by 0.7"
// Fable's own exact values (Oct 16), superseding this file's earlier guess.
const GLOW_OFF = 'drop-shadow(0 0 0 transparent)';
const GLOW_ON = 'drop-shadow(0 0 16px rgba(255,152,0,.8))';
const GLOW_REST = 'drop-shadow(0 0 5px rgba(255,152,0,.35))';

/** Reduced-motion check, the same `matchMedia` idiom this codebase already
 *  uses elsewhere (HomeFlow.tsx, RhizomeField.tsx, UnlockCeremony.tsx) —
 *  checked once per mount, not subscribed, since nobody flips the OS setting
 *  mid-splash. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================================================
// ARBOR — Nick's hand-drawn sketch, cut by splash-build-kit.md's own script
// (docs/briefs/splash-build-kit.md §1) into base + 5 outline layers + 6
// connector layers, committed under public/brand/splash-arbor/ (layers.json
// there is this asset pack's own record; the geometry below is that file's
// content, baked in rather than fetched, so the splash's critical render
// path never waits on an extra network round-trip for layout numbers that
// never change at runtime).
// ============================================================================

const BRAND = '/brand/splash-arbor';
const ARBOR_CANVAS = { w: 3374, h: 2699 };
/** Fable's own exact scaling (Oct 16): the mockup's wave is 0.2px/ms in its
 *  own 1350-wide working space, which is 0.5px/ms against the full-size
 *  3374-wide paths these layers actually use; the last connector's own
 *  faster speed is 0.75 (was 0.3 in mockup space). Literal, not re-derived
 *  from a ratio — these are the authoritative values. */
const ARBOR_WAVE_PX_PER_MS = 0.5;
const ARBOR_FINAL_WAVE_PX_PER_MS = 0.75;

type ArborStage = 'ideas' | 'text' | 'feedback' | 'page' | 'final';
const ARBOR_OUTLINES: Record<ArborStage, { file: string; x: number; y: number; w: number; h: number }> = {
  ideas: { file: 'ideas.png', x: 1915, y: 1039, w: 608, h: 754 },
  text: { file: 'text.png', x: 1276, y: 1379, w: 463, h: 351 },
  feedback: { file: 'feedback.png', x: 478, y: 1185, w: 727, h: 426 },
  page: { file: 'page.png', x: 1398, y: 481, w: 414, h: 459 },
  final: { file: 'final.png', x: 2362, y: 442, w: 395, h: 431 },
};
const ARBOR_FINAL_CREAM = { file: 'final-cream.png', x: 2362, y: 442, w: 395, h: 431 };
const ARBOR_EDGES = [
  { id: 'ideas-text', a: 'ideas' as ArborStage, b: 'text' as ArborStage, file: 'edge-ideas-text.png', x: 1751, y: 1550, w: 177, h: 99, path: 'M 1934.4 1554.4 L 1742.0 1646.9', strokeWidth: 110, last: false },
  { id: 'ideas-page', a: 'ideas' as ArborStage, b: 'page' as ArborStage, file: 'edge-ideas-page.png', x: 1760, y: 975, w: 321, h: 403, path: 'M 2086.9 1382.0 L 1759.5 974.6', strokeWidth: 150, last: false },
  { id: 'text-fb', a: 'text' as ArborStage, b: 'feedback' as ArborStage, file: 'edge-text-fb.png', x: 965, y: 1621, w: 315, h: 188, path: 'M 1284.6 1754.4 Q 1049.7 1836.8 969.7 1614.4', strokeWidth: 155, last: false },
  { id: 'text-page', a: 'text' as ArborStage, b: 'page' as ArborStage, file: 'edge-text-page.png', x: 1454, y: 985, w: 128, h: 475, path: 'M 1517.1 1467.0 L 1517.1 982.1', strokeWidth: 150, last: false },
  { id: 'page-fb', a: 'page' as ArborStage, b: 'feedback' as ArborStage, file: 'edge-page-fb.png', x: 886, y: 908, w: 483, h: 419, path: 'M 1379.6 902.2 L 914.7 1294.5', strokeWidth: 140, last: false },
  { id: 'page-final', a: 'page' as ArborStage, b: 'final' as ArborStage, file: 'edge-page-final.png', x: 1902, y: 620, w: 346, h: 98, path: 'M 1899.4 669.8 L 2251.8 664.8', strokeWidth: 125, last: true },
] as const;

interface MarkProps {
  reduced: boolean;
  width: number;
  height: number;
  /** Fires once, at the point the brief calls the animation's own end — the
   *  hold floor Splash.tsx now waits on instead of a fixed 5s timer. */
  onFloorReached: () => void;
}

function ArborMark({ reduced, width, height, onFloorReached }: MarkProps) {
  const pathRefs = useRef<Partial<Record<string, SVGPathElement>>>({});
  const outlineRefs = useRef<Partial<Record<ArborStage, SVGGElement>>>({});
  const finalGroupRef = useRef<SVGGElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (reduced) {
      // Brief: "Reduced motion: the finished brass drawing shows at once,
      // then the usual fade" — every outline and connector snaps to its lit
      // end state, no glow burst, no pop scale (it settles at rest=1 anyway).
      Object.values(outlineRefs.current).forEach((g) => { if (g) g.style.opacity = '1'; });
      Object.values(pathRefs.current).forEach((p) => { if (p) p.style.strokeDashoffset = '0'; });
      onFloorReached();
      return;
    }

    const v = ARBOR_WAVE_PX_PER_MS;
    const v2 = ARBOR_FINAL_WAVE_PX_PER_MS;

    const A = (el: Element | null, kf: Keyframe[], at: number, dur: number, easing = 'ease-in-out') => {
      if (!el) return;
      el.animate(kf, { delay: at * SPEED, duration: Math.max(1, dur * SPEED), fill: 'forwards', easing });
    };
    const draw = (p: SVGPathElement | null, at: number, dur: number) => A(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], at, dur, 'linear');
    const pop = (el: Element | null, at: number) => A(el, [
      { transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.35 }, { transform: 'scale(.99)', offset: 0.75 }, { transform: 'scale(1)' },
    ], at, 480, 'ease-out');

    const ideasAt = 300, ideasDur = 500;
    const t0 = ideasAt + ideasDur;
    const lens: Record<string, number> = {};
    ARBOR_EDGES.forEach((e) => { const p = pathRefs.current[e.id]; lens[e.id] = p ? p.getTotalLength() : 0; });

    const plain = ARBOR_EDGES.filter((e) => !e.last);
    const finalEdge = ARBOR_EDGES.find((e) => e.last)!;
    const reach: Partial<Record<ArborStage, number>> = { ideas: t0 };
    // 4 passes converge the whole (shallow) graph — the same relaxation the
    // mockup script runs, picking whichever path arrives at a stage FIRST
    // (brief: "the two waves meet at FEEDBACK").
    for (let pass = 0; pass < 4; pass += 1) {
      plain.forEach((e) => {
        const from = reach[e.a];
        if (from === undefined) return;
        const arrive = from + lens[e.id] / v;
        if (reach[e.b] === undefined || arrive < (reach[e.b] as number)) reach[e.b] = arrive;
      });
    }

    A(outlineRefs.current.ideas ?? null, [
      { opacity: 0, filter: GLOW_OFF }, { opacity: 1, filter: GLOW_ON, offset: 0.6 }, { opacity: 1, filter: GLOW_REST },
    ], ideasAt, ideasDur + 250);

    let lastEnd = t0;
    plain.forEach((e) => {
      const s = reach[e.a] as number;
      const d = lens[e.id] / v;
      draw(pathRefs.current[e.id] ?? null, s, d);
      lastEnd = Math.max(lastEnd, s + d);
    });
    (['text', 'page', 'feedback'] as const).forEach((stage) => {
      A(outlineRefs.current[stage] ?? null, [{ opacity: 0 }, { opacity: 1 }], (reach[stage] as number) - 60, 380);
    });

    const fs = lastEnd + 120;
    const fd = lens[finalEdge.id] / v2;
    draw(pathRefs.current[finalEdge.id] ?? null, fs, fd);
    const finalAt = fs + fd;
    A(outlineRefs.current.final ?? null, [
      { opacity: 0, filter: GLOW_OFF }, { opacity: 1, filter: GLOW_ON, offset: 0.6 }, { opacity: 1, filter: GLOW_REST },
    ], finalAt, 750);
    pop(finalGroupRef.current, finalAt + 260);

    // Brief: "Ending: a short hold, then a 0.45s fade" — the floor is the
    // moment just before that fade, i.e. the pop's own end plus a short hold.
    const floorAt = finalAt + 260 + 480 + 500;
    window.setTimeout(onFloorReached, floorAt * SPEED);
  }, [reduced, onFloorReached]);

  const finalCx = ARBOR_FINAL_CREAM.x + ARBOR_FINAL_CREAM.w / 2;
  const finalCy = ARBOR_FINAL_CREAM.y + ARBOR_FINAL_CREAM.h / 2;

  return (
    <svg
      className="wz-splash-arbor"
      width={width} height={height}
      viewBox={`0 0 ${ARBOR_CANVAS.w} ${ARBOR_CANVAS.h}`}
      role="img" aria-label="Wrizo: from Ideas to Final Draft"
    >
      <defs>
        {ARBOR_EDGES.map((e) => (
          <mask key={e.id} id={`wz-splash-arbor-mask-${e.id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={ARBOR_CANVAS.w} height={ARBOR_CANVAS.h}>
            <path
              ref={(el) => { if (el) pathRefs.current[e.id] = el; }}
              d={e.path} fill="none" stroke="#fff" strokeWidth={e.strokeWidth} strokeLinecap="round"
              pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: reduced ? 0 : 1 }}
            />
          </mask>
        ))}
      </defs>

      {/* The whole sketch in cream (TEXT recoloured cream, FINAL DRAFT's own outline cut out — it pops, so it is its own layer below). */}
      <image href={`${BRAND}/base.png`} x={0} y={0} width={ARBOR_CANVAS.w} height={ARBOR_CANVAS.h} />
      <image href={`${BRAND}/${ARBOR_FINAL_CREAM.file}`} x={ARBOR_FINAL_CREAM.x} y={ARBOR_FINAL_CREAM.y} width={ARBOR_FINAL_CREAM.w} height={ARBOR_FINAL_CREAM.h} />

      {/* The six connectors — each masked by its own progressively-drawn path above.
          `data-edge`/`data-stage` below are a harness seam (splash.mjs), not a
          styling hook — nothing in index.css selects by them. */}
      {ARBOR_EDGES.map((e) => (
        <image key={e.id} data-edge={e.id} href={`${BRAND}/${e.file}`} x={e.x} y={e.y} width={e.w} height={e.h} mask={`url(#wz-splash-arbor-mask-${e.id})`} />
      ))}

      {/* The five stage outlines — brass, letters left out by the cutting script, so "no brass on letter pixels" holds by construction. */}
      {(Object.keys(ARBOR_OUTLINES) as ArborStage[]).filter((s) => s !== 'final').map((stage) => {
        const o = ARBOR_OUTLINES[stage];
        return (
          <g key={stage} data-stage={stage} ref={(el) => { if (el) outlineRefs.current[stage] = el; }} style={{ opacity: reduced ? 1 : 0 }}>
            <image href={`${BRAND}/${o.file}`} x={o.x} y={o.y} width={o.w} height={o.h} />
          </g>
        );
      })}
      {/* FINAL DRAFT is its own group (not folded into the loop above) so the pop scale targets ONLY its own box, via an explicit centre — SVG has no fill-box shorthand this codebase relies on elsewhere. */}
      <g
        data-stage="final"
        ref={(el) => { if (el) { outlineRefs.current.final = el; finalGroupRef.current = el; } }}
        style={{ opacity: reduced ? 1 : 0, transformBox: 'view-box', transformOrigin: `${finalCx}px ${finalCy}px` }}
      >
        <image href={`${BRAND}/${ARBOR_OUTLINES.final.file}`} x={ARBOR_OUTLINES.final.x} y={ARBOR_OUTLINES.final.y} width={ARBOR_OUTLINES.final.w} height={ARBOR_OUTLINES.final.h} />
      </g>
    </svg>
  );
}

// ============================================================================
// FLUX — the vector schematic (splash-build-kit.md §2/§3): IDEAS tiles -> Σ ->
// TEXT -> PAGE -> FINAL DRAFT, a bypass IDEAS->PAGE, and a feedback loop
// PAGE->FEEDBACK->TEXT. Colours moved to Flux's own tokens per the build
// kit's own mapping (#2A6A76 -> --ink-border-strong, #1D4A52 -> --ink-border,
// #E3F1EC -> --text-hi, #8FB4AC -> --text-mid, #00C2FF -> --line-active,
// brass -> --brass) so this reads correctly whether Flux's page tone is
// light or dark (the schematic itself sits on the splash veil, not the
// page — see fix/splash-tone — but the tokens stay themed regardless).
// ============================================================================

const FX_TILES: ReadonlyArray<{ ch: string; x: number; dx: number; dy: number; rot: number }> = [
  { ch: 'I', x: 70, dx: -18, dy: 46, rot: -9 },
  { ch: 'D', x: 120, dx: 14, dy: -38, rot: 7 },
  { ch: 'E', x: 170, dx: -10, dy: 30, rot: -5 },
  { ch: 'A', x: 220, dx: 22, dy: -50, rot: 11 },
  { ch: 'S', x: 270, dx: -6, dy: 40, rot: -7 },
];
const FX_WIRES: ReadonlyArray<{ id: string; d: string }> = [
  { id: 'bus1', d: 'M314,540 L344,540 M376,540 L398,540 M386,532 L398,540 L386,548' },
  { id: 'bypass', d: 'M292,512 L292,400 L830,400 L830,503 M822,491 L830,503 L838,491' },
  { id: 'bus2', d: 'M580,540 L698,540 M686,532 L698,540 L686,548' },
  { id: 'loop', d: 'M880,540 L940,540 L940,800 L762,800 M558,800 L360,800 L360,558 M352,570 L360,558 L368,570' },
  { id: 'out', d: 'M940,540 L1008,540 M996,532 L1008,540 L996,548' },
];
const FX_NODES = ['fxSum', 'fxText', 'fxPage', 'fxFb'] as const;

function FluxMark({ reduced, width, height, onFloorReached }: MarkProps) {
  const tileRefs = useRef<Partial<Record<string, SVGGElement>>>({});
  const wireRefs = useRef<Partial<Record<string, SVGPathElement>>>({});
  const nodeRefs = useRef<Partial<Record<string, SVGGElement>>>({});
  const finalRef = useRef<SVGGElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (reduced) {
      Object.values(tileRefs.current).forEach((g) => { if (g) { g.style.transform = 'none'; g.classList.add('lit'); } });
      Object.values(nodeRefs.current).forEach((g) => { if (g) g.classList.add('lit'); });
      Object.values(wireRefs.current).forEach((p) => { if (p) p.style.strokeDashoffset = '0'; });
      finalRef.current?.classList.add('lit');
      onFloorReached();
      return;
    }

    const A = (el: Element | null, kf: Keyframe[], at: number, dur: number, easing = 'ease-in-out') => {
      if (!el) return;
      el.animate(kf, { delay: at * SPEED, duration: Math.max(1, dur * SPEED), fill: 'forwards', easing });
    };
    const draw = (p: SVGPathElement | null, at: number, dur: number) => A(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], at, dur, 'linear');
    const later = (fn: () => void, at: number) => window.setTimeout(fn, at * SPEED);
    const pop = (el: Element | null, at: number) => A(el, [
      { transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.35 }, { transform: 'scale(.99)', offset: 0.75 }, { transform: 'scale(1)' },
    ], at, 480, 'ease-out');

    FX_TILES.forEach((t, i) => {
      const g = tileRefs.current[t.ch];
      A(g ?? null, [
        { transform: `translate(${t.dx}px,${t.dy}px) rotate(${t.rot}deg)` }, { transform: 'translate(0,0) rotate(0deg)' },
      ], 250 + i * 60, 420, 'cubic-bezier(.2,.8,.2,1)');
      later(() => g?.classList.add('lit'), 520 + i * 60);
    });

    draw(wireRefs.current.bus1 ?? null, 950, 260);      // IDEAS -> Σ -> TEXT
    draw(wireRefs.current.bypass ?? null, 950, 1050);   // IDEAS -> PAGE, at the same moment
    draw(wireRefs.current.bus2 ?? null, 1210, 420);     // TEXT -> PAGE
    draw(wireRefs.current.loop ?? null, 1630, 1150);    // PAGE -> FEEDBACK -> back into TEXT
    draw(wireRefs.current.out ?? null, 2900, 330);      // PAGE -> FINAL DRAFT, last
    const finalAt = 3230;
    ([['fxSum', 1080], ['fxText', 1210], ['fxPage', 1630], ['fxFb', 2220]] as const).forEach(([id, at]) => {
      later(() => nodeRefs.current[id]?.classList.add('lit'), at);
    });
    later(() => finalRef.current?.classList.add('lit'), finalAt);
    pop(finalRef.current, finalAt + 260);
    A(finalRef.current, [{ filter: GLOW_OFF }, { filter: GLOW_ON, offset: 0.6 }, { filter: GLOW_REST }], finalAt, 750);

    const floorAt = finalAt + 260 + 480 + 500;
    window.setTimeout(onFloorReached, floorAt * SPEED);
  }, [reduced, onFloorReached]);

  return (
    <svg
      className="wz-splash-flux" width={width} height={height}
      viewBox="0 0 1350 1080" role="img" aria-label="Wrizo schematic: from Ideas to Final Draft"
    >
      <defs>
        <pattern id="wz-splash-flux-dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" className="fx-grid" /></pattern>
      </defs>
      <rect x={40} y={40} width={1270} height={1000} fill="url(#wz-splash-flux-dots)" opacity={0.55} />
      <path className="fx-tree" d="M40,80 L40,40 L80,40 M1270,40 L1310,40 L1310,80 M1310,1000 L1310,1040 L1270,1040 M80,1040 L40,1040 L40,1000" />

      {/* wordmark — straight strokes on a grid, never the hand-drawn one */}
      <g transform="translate(435,70) scale(1.6)">
        <g fill="none" stroke="#E3F1EC" strokeWidth={8} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M0,0 L14,64 L35,22 L56,64 L70,0" />
          <path d="M92,64 L92,0 L124,0 L136,12 L136,26 L124,36 L92,36 M114,36 L136,64" />
          <path d="M158,0 L158,64" />
          <path d="M180,0 L226,0 L180,64 L226,64" />
          <path d="M262,0 L286,0 L300,14 L300,50 L286,64 L262,64 L248,50 L248,14 Z" />
        </g>
        <rect x={270} y={28} width={8} height={8} fill="#00C2FF" />
      </g>
      <text x={675} y={218} textAnchor="middle" className="fx-sub" style={{ fontSize: 18, letterSpacing: '.3em' }}>// IN ABSTRACT · FIRST PRINCIPLES TO FINAL PRODUCT</text>

      <path className="fx-tree" d="M84,566 L84,681 M84,611 L104,611 M84,646 L104,646 M84,681 L104,681" />
      <text x={114} y={618} className="fx-sub">STRUCTURE</text><text x={114} y={653} className="fx-sub">RESEARCH</text><text x={114} y={688} className="fx-sub">FLEXIBILITY</text>
      <path className="fx-tree" d="M420,577 L420,692 M420,622 L440,622 M420,657 L440,657 M420,692 L440,692" />
      <text x={450} y={629} className="fx-sub">QUOTES</text><text x={450} y={664} className="fx-sub">UNIQUE</text><text x={450} y={699} className="fx-sub">INK</text>
      <path className="fx-tree" d="M580,837 L580,952 M580,882 L600,882 M580,917 L600,917 M580,952 L600,952" />
      <text x={610} y={889} className="fx-sub">AUTOMATED</text><text x={610} y={924} className="fx-sub">AI TUTOR</text><text x={610} y={959} className="fx-sub">WORKSHOPS</text>
      <path className="fx-tree" d="M1030,592 L1030,742 M1030,637 L1050,637 M1030,672 L1050,672 M1030,707 L1050,707 M1030,742 L1050,742" />
      <text x={1060} y={644} className="fx-sub">POLISH</text><text x={1060} y={679} className="fx-sub">ERROR-FREE</text><text x={1060} y={714} className="fx-sub">FILE TYPE</text><text x={1060} y={749} className="fx-sub">SHAREABLE</text>

      {/* wires (dim), each with a brass twin drawn over it */}
      <g>
        {FX_WIRES.map((w) => (
          <path key={w.id} d={w.d} className="fx-dim" />
        ))}
        {FX_WIRES.map((w) => (
          <path
            key={`hot-${w.id}`} ref={(el) => { if (el) wireRefs.current[w.id] = el; }}
            d={w.d} className="fx-hot" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: reduced ? 0 : 1 }}
          />
        ))}
      </g>

      <text x={70} y={490} className="fx-tag">N.01 · INPUT</text>
      <g>
        {FX_TILES.map((t) => (
          <g key={t.ch} data-tile={t.ch} ref={(el) => { if (el) tileRefs.current[t.ch] = el; }} className="tile" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x={t.x} y={518} width={44} height={44} />
            <text x={t.x + 22} y={550}>{t.ch}</text>
          </g>
        ))}
      </g>
      <g data-node="fxSum" ref={(el) => { if (el) nodeRefs.current.fxSum = el; }} className="fx-node"><circle cx={360} cy={540} r={16} className="fx-box" /></g>
      <text x={360} y={548} textAnchor="middle" className="fx-tag" style={{ fontSize: 20, letterSpacing: 0 }}>Σ</text>
      <text x={400} y={490} className="fx-tag">N.02</text>
      <g data-node="fxText" ref={(el) => { if (el) nodeRefs.current.fxText = el; }} className="fx-node"><rect x={400} y={505} width={180} height={70} className="fx-box" /></g>
      <text x={490} y={551} textAnchor="middle" className="fx-name">TEXT</text>
      <text x={700} y={490} className="fx-tag">N.03</text><text x={790} y={606} textAnchor="middle" className="fx-sub">LINEAR, COHERENT</text>
      <g data-node="fxPage" ref={(el) => { if (el) nodeRefs.current.fxPage = el; }} className="fx-node"><rect x={700} y={505} width={180} height={70} className="fx-box" /></g>
      <text x={790} y={551} textAnchor="middle" className="fx-name">PAGE</text>
      <text x={560} y={755} className="fx-tag">N.04 · LOOP</text>
      <g data-node="fxFb" ref={(el) => { if (el) nodeRefs.current.fxFb = el; }} className="fx-node"><rect x={560} y={765} width={200} height={70} className="fx-box" /></g>
      <text x={660} y={811} textAnchor="middle" className="fx-name">FEEDBACK</text>
      <text x={1010} y={475} className="fx-tag">N.05 · OUTPUT</text>
      <g data-node="fxFinal" ref={(el) => { if (el) finalRef.current = el; }} className="fx-node" id="wz-splash-flux-final" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <rect x={1010} y={490} width={240} height={100} className="fx-box" />
        <rect x={1019} y={499} width={222} height={82} fill="none" stroke="#2A6A76" strokeWidth={2} />
        <text x={1130} y={551} textAnchor="middle" className="fx-name">FINAL DRAFT</text>
      </g>
    </svg>
  );
}

// MACHINA - the approved mockup's splash (cursor/machina-v1-mockup @ 360f3db3): the WRIZ[] wordmark (28px, .14em, the orange outlined square), IDEAS and FINAL DRAFT as the two end labels, and
// ONE twenty-unit Run strip between them that fills left to right, then closes orange once. No loading lines (Fable's ruling 6: the strip IS the readout). The same unit count and the same
// closed-orange grammar as the in-app Run strip. Reduced motion: the closed strip at once, then the usual fade.
const MA_UNITS = 20;
const MA_UNIT_MS = 105;
const MA_START_MS = 350;

function MachinaMark({ reduced, width, height, onFloorReached }: MarkProps) {
  const unitRefs = useRef<(SVGRectElement | null)[]>([]);
  const stripRef = useRef<SVGGElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (reduced) {
      unitRefs.current.forEach((r) => r?.classList.add('on'));
      stripRef.current?.classList.add('closed');
      onFloorReached();
      return;
    }
    for (let i = 0; i < MA_UNITS; i += 1) {
      window.setTimeout(() => unitRefs.current[i]?.classList.add('on'), MA_START_MS + i * MA_UNIT_MS);
    }
    const closeAt = MA_START_MS + MA_UNITS * MA_UNIT_MS + 120;
    window.setTimeout(() => stripRef.current?.classList.add('closed'), closeAt);
    window.setTimeout(onFloorReached, closeAt + 700);
  }, [reduced, onFloorReached]);

  // The strip spans exactly the two end labels' outer edges (x 175 .. 1175): 20 units of 45.25 + 19 gaps of 5.
  const x0 = 175;
  const unitW = 45.25;
  const gap = 5;
  return (
    <svg
      className="wz-splash-machina" width={width} height={height}
      viewBox="0 0 1350 1080" role="img" aria-label="Wrizo: from Ideas to Final Draft"
    >
      <text x={845} y={500} textAnchor="end" className="ma-word">WRIZ</text>
      <rect x={858} y={398} width={96} height={96} className="ma-square" />
      <text x={x0} y={640} className="ma-end">IDEAS</text>
      <text x={1175} y={640} textAnchor="end" className="ma-end">FINAL DRAFT</text>
      <g ref={stripRef} className="ma-strip">
        {Array.from({ length: MA_UNITS }, (_, i) => (
          <rect key={i} ref={(el) => { unitRefs.current[i] = el; }} x={x0 + i * (unitW + gap) + 0} y={686} width={unitW} height={8} className="ma-unit" />
        ))}
      </g>
    </svg>
  );
}

export interface SplashMarkProps {
  theme: ThemeId;
  reduced: boolean;
  width: number;
  height: number;
  onFloorReached: () => void;
}

export function SplashMark({ theme, ...rest }: SplashMarkProps) {
  if (theme === 'machina') return <MachinaMark {...rest} />;
  return theme === 'flux' ? <FluxMark {...rest} /> : <ArborMark {...rest} />;
}
