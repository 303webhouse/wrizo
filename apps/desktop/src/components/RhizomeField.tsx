import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useWritingSettings } from '../store/writingSettings';
import { useWritingGoal, goalCount } from '../store/writingGoal';
import { useTheme } from '../store/theme';
import { lapPlan, segmentsFor, geometryKey, pickSurvivor, hashSeed, type GrowthGeometry, type GrowthSegment, type Rect } from '../store/rhizomeGrowth';

// THE GOAL RHIZOME (rewritten by Fable, 2026-10-08; growth model in store/rhizomeGrowth.ts).
//
// What the writer sees:
//   - A weed in the dark ground around the page. The goal in progress when the page is opened sprouts at the centre and
//     the shoots wander out in a spread of directions; some run longer than others. It does not carpet the ground.
//   - Every new piece grows OUT of an existing stem, and draws itself on along its length (the "growing" animation).
//   - At the goal the whole network flashes brass, then the finished plant fades out and leaves its seed: one root
//     segment, from which the next rhizome branches. One of those branches heads back toward the page.
//   - Roots grow BEHIND the page, right up to its edge, and are never drawn over it. They also never paint on the rail,
//     the strip, the header or an open menu (clip + mask). They pass under the page (unpainted) to reach the other margin.
//
// The field is ambient: aria-hidden, pointer-events none, beneath the paper (the anchor's z-index -1). Framed stage only
// (>= 1100px), as before.
const SESSION_START = Date.now(); // the pattern is session-scoped (M2 S2)

const FLASH_MS = 1200;   // the brass reward
// Nick (2026-10-10): "a bit brighter and fade back out slower" - after the hold the brass network FADES over FADE_MS instead of
// cutting. Under reduced motion there is no fade: the hold stays and the lap clears at its end.
const FADE_MS = 2200;
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAGE_CLEAR = 0;    // no clear band: roots grow behind the page, right up to its edge, never over it
const DRAW_MS = 360;     // one segment drawing itself on
const STAGGER_TOTAL_MS = 700; // a burst of new segments (a pasted paragraph) grows over at most this long
const ANIMATE_MAX = 160; // beyond this many new segments at once, the oldest of the burst simply appear

const STABLE_CHROME = ['.desk-rail', '.desk-frame-strip', '.sprint-nav', '.gh-corner-glyph'];
const LIVE_CHROME = [
  '.gh-corner-menu',
  '.wz-cascade-panel',
  '.wz-sliver-panel[data-open="true"]',
  '.wz-sliver-grip',
  '.mode-settings',
  '.desk-frame-corkboard',
];

function isShown(el: Element): boolean {
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const op = Number.parseFloat(cs.opacity);
    if (Number.isFinite(op) && op < 0.04) return false;
    node = node.parentElement;
  }
  const r = el.getBoundingClientRect();
  return r.width >= 8 && r.height >= 8;
}

function rectsInStage(selectors: string[], stage: DOMRect): Rect[] {
  const out: Rect[] = [];
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest('.brand-mark')) continue;
      if (!isShown(el)) continue;
      const r = el.getBoundingClientRect();
      const rect = { left: r.left - stage.left, top: r.top - stage.top, right: r.right - stage.left, bottom: r.bottom - stage.top };
      if (rect.right <= 1 || rect.bottom <= 1 || rect.left >= stage.width - 1 || rect.top >= stage.height - 1) continue;
      out.push(rect);
    }
  }
  return out;
}

interface Measured { geo: GrowthGeometry; holes: Rect[] }

function measure(svg: SVGSVGElement, paper: HTMLElement): Measured | null {
  const stage = svg.getBoundingClientRect();
  const p = paper.getBoundingClientRect();
  if (stage.width <= 0 || stage.height <= 0 || p.width <= 0) return null;
  const kept = {
    left: p.left - stage.left - PAGE_CLEAR,
    top: p.top - stage.top - PAGE_CLEAR,
    right: p.right - stage.left + PAGE_CLEAR,
    bottom: p.bottom - stage.top + PAGE_CLEAR,
  };
  const stable = rectsInStage(STABLE_CHROME, stage);
  return {
    // Growth geometry: only the sheet band and STABLE chrome. Opening a menu must never re-seed the drawing.
    geo: {
      width: stage.width,
      height: stage.height,
      hidden: [kept, ...stable],
      origin: { x: (p.left + p.right) / 2 - stage.left, y: (p.top + p.bottom) / 2 - stage.top },
    },
    // Paint holes: the same, plus whatever menu is open right now.
    holes: [kept, ...stable, ...rectsInStage(LIVE_CHROME, stage)],
  };
}

function groundClipPath(w: number, h: number, holes: Rect[]): string {
  const n = (v: number) => Math.round(v * 10) / 10;
  let d = `M0 0H${n(w)}V${n(h)}H0Z`;
  for (const r of holes) {
    if (r.right - r.left < 1 || r.bottom - r.top < 1) continue;
    d += `M${n(r.left)} ${n(r.top)}H${n(r.right)}V${n(r.bottom)}H${n(r.left)}Z`;
  }
  return d;
}

function sameRects(a: Rect[], b: Rect[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i].left - b[i].left) > 1 || Math.abs(a[i].top - b[i].top) > 1
      || Math.abs(a[i].right - b[i].right) > 1 || Math.abs(a[i].bottom - b[i].bottom) > 1) return false;
  }
  return true;
}

/** Many settled segments as ONE path per weight: thousands of <line>s re-rendered on every keystroke would be wasteful. */
function pathOf(segs: GrowthSegment[], thick: boolean): string {
  let d = '';
  for (const s of segs) {
    if (s.thick !== thick) continue;
    d += `M${s.x1.toFixed(1)} ${s.y1.toFixed(1)}L${s.x2.toFixed(1)} ${s.y2.toFixed(1)}`;
  }
  return d;
}

export function RhizomeField({ text, seedKey, paperRef }: {
  text: string;
  seedKey: string;
  paperRef: React.RefObject<HTMLElement | null>;
}) {
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  // Nick's ruling: the rhizome is PLATEAU'S only. Every other theme replaces it with its own (Flux's comes later), so under
  // any other theme this field draws nothing - no growth, no flash.
  const theme = useTheme();
  const active = settings.progress === 'words' && settings.progressStyle === 'rhizome' && goal != null && goal.n > 0 && theme === 'plateau';
  const count = goal ? goalCount(text, goal) : 0;
  const n = goal?.n ?? 0;
  const lap = n > 0 ? Math.floor(count / n) : 0;
  const frac = n > 0 ? (count % n) / n : 0;
  const goalKey = goal ? `${goal.n}:${goal.unit}` : 'none';
  const pageSeed = `${seedKey}:${SESSION_START}:${goalKey}`;
  // The goal already in progress when this page is opened is drawn as the centred spread. Goals reached after that
  // open branch from the one root segment the last one left behind. Navigating to another page starts its own centred spread.
  const openKey = `${seedKey}|${goalKey}`;
  const opened = useRef<{ key: string; lap: number }>({ key: '', lap: 0 });
  if (opened.current.key !== openKey) opened.current = { key: openKey, lap };

  const svgRef = useRef<SVGSVGElement>(null);
  const [m, setM] = useState<Measured | null>(null);
  const [flashLap, setFlashLap] = useState<number | null>(null); // while set, the finished lap is shown whole, in brass
  const [flashFading, setFlashFading] = useState(false);           // the hold is over: the brass lap is fading out
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCount = useRef<{ key: string; count: number } | null>(null);

  const sync = useCallback(() => {
    const svg = svgRef.current, paper = paperRef.current;
    if (!svg || !paper) return;
    const next = measure(svg, paper);
    if (!next) return;
    setM(prev => (prev && geometryKey(prev.geo) === geometryKey(next.geo) && sameRects(prev.holes, next.holes) ? prev : next));
  }, [paperRef]);

  // Re-measure whenever the stage, the paper or the chrome moves (menus open, chrome recedes, the window resizes).
  useEffect(() => {
    if (!active) return;
    const svg = svgRef.current, paper = paperRef.current;
    if (!svg || !paper) return;
    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; sync(); }); };
    schedule();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(svg); ro?.observe(paper);
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-open', 'hidden', 'aria-expanded', 'data-writing'] });
    const settle = setTimeout(schedule, 600);
    return () => { if (raf) cancelAnimationFrame(raf); clearTimeout(settle); ro?.disconnect(); mo.disconnect(); };
  }, [active, paperRef, sync, seedKey]);

  // Crossing the goal: hold the finished lap whole and brass for FLASH_MS, then fade that plant out. The seed root
  // stays on screen through the fade; the next lap is that same segment.
  const countKey = `${seedKey}|${goalKey}`;
  useEffect(() => {
    const prev = prevCount.current;
    prevCount.current = { key: countKey, count };
    if (!active || n <= 0 || !prev || prev.key !== countKey) return;
    if (count > prev.count && Math.floor(count / n) > Math.floor(prev.count / n)) {
      setFlashLap(Math.floor(count / n) - 1);
      setFlashFading(false);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      // hold FLASH_MS, then fade FADE_MS (not a cut) and clear; reduced motion: no fade, the lap clears at the hold's end
      flashTimer.current = setTimeout(() => {
        if (reducedMotion()) { setFlashLap(null); return; }
        setFlashFading(true);
        flashTimer.current = setTimeout(() => { setFlashLap(null); setFlashFading(false); }, FADE_MS);
      }, FLASH_MS);
    }
  }, [active, count, n, countKey]);
  useEffect(() => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashLap(null); setFlashFading(false);
  }, [seedKey, goalKey]);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  // What to draw. During the flash: the finished lap, whole. Otherwise: the current lap up to the goal fraction.
  const shownLap = flashLap ?? lap;
  const shownVisit = Math.max(0, shownLap - opened.current.lap);
  const plan = useMemo(() => (m ? lapPlan(m.geo, pageSeed, shownVisit) : null), [m, pageSeed, shownVisit]);
  const k = plan ? (flashLap != null ? plan.segments.length : segmentsFor(plan, frac)) : 0;

  // Which segments are still GROWING. A segment that appears gets its own start time (staggered within its burst) and stays
  // a separate <line> until its draw-on has finished, so typing the next word never cuts the last word's growth short.
  // Anything that changes the drawing as a whole (another page, another lap, a new geometry, the flash) starts a fresh
  // record with nothing growing, so a reload or a resize never replays the growth.
  const growing = useRef<{ key: string; k: number; born: Map<number, { delay: number; until: number }> }>({ key: '', k: 0, born: new Map() });
  const drawKey = plan && m ? `${pageSeed}#${shownLap}#${geometryKey(m.geo)}#${flashLap != null ? 'flash' : 'grow'}` : '';
  const segs = plan ? plan.segments.slice(0, k) : [];
  const now = Date.now();
  const g = growing.current;
  if (g.key !== drawKey) {
    growing.current = { key: drawKey, k, born: new Map() };
  } else if (k > g.k) {
    const batch = segs.slice(Math.max(g.k, k - ANIMATE_MAX), k);
    const step = batch.length > 1 ? Math.min(60, STAGGER_TOTAL_MS / batch.length) : 0;
    batch.forEach((s, i) => {
      if (!g.born.has(s.id)) g.born.set(s.id, { delay: Math.round(i * step), until: now + Math.round(i * step) + DRAW_MS + 40 });
    });
    g.k = k;
  } else {
    g.k = k;
  }
  const born = growing.current.born;
  for (const [id, b] of born) if (b.until < now) born.delete(id);
  const animated = segs.filter(s => born.has(s.id));
  const settled = animated.length ? segs.filter(s => !born.has(s.id)) : segs;
  // While the finished plant fades, the one root the next lap will grow from stays put. It is the same segment
  // lapPlan will draw first on the following visit, so the handoff does not cut.
  const seedRoot = flashFading && plan ? pickSurvivor(plan, hashSeed(`${pageSeed}:survivor:${shownVisit}`)) : null;
  const isSeed = (s: GrowthSegment) => !!seedRoot && seedRoot.some(r => r.x1 === s.x1 && r.y1 === s.y1 && r.x2 === s.x2 && r.y2 === s.y2);
  const fadingSettled = seedRoot ? settled.filter(s => !isSeed(s)) : settled;
  const seedSettled = seedRoot ? settled.filter(isSeed) : [];

  if (!active) return null;

  const w = m?.geo.width ?? 0, h = m?.geo.height ?? 0;
  const clipD = m ? groundClipPath(w, h, m.holes) : '';

  return (
    <svg
      ref={svgRef}
      className="wz-rhizome-field"
      aria-hidden="true"
      focusable="false"
      data-flash={flashLap != null ? (flashFading ? 'fading' : 'true') : 'false'}
      data-lap={shownLap}
      data-segments={segs.length}
      data-goal-frac={frac.toFixed(3)}
      viewBox={w > 0 ? `0 0 ${w} ${h}` : undefined}
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none', clipPath: clipD ? `path(evenodd, "${clipD}")` : undefined }}
    >
      {m && (
        <>
          <clipPath id="wz-rhizome-ground" clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" fillRule="evenodd" d={clipD} />
          </clipPath>
          <mask id="wz-rhizome-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            <rect x="0" y="0" width={w} height={h} fill="#fff" />
            {m.holes.map((r, i) => (
              <rect key={i} x={r.left} y={r.top} width={Math.max(0, r.right - r.left)} height={Math.max(0, r.bottom - r.top)} fill="#000" />
            ))}
          </mask>
        </>
      )}
      <g clipPath={m ? 'url(#wz-rhizome-ground)' : undefined} mask={m ? 'url(#wz-rhizome-mask)' : undefined}>
        <path className="wz-rhizome-seg" d={pathOf(fadingSettled, false)} />
        <path className="wz-rhizome-seg" data-thick="true" d={pathOf(fadingSettled, true)} />
        {seedSettled.length > 0 && <path className="wz-rhizome-seg" data-thick="true" data-seed="true" d={pathOf(seedSettled, true)} />}
        {animated.map(s => (
          <line
            key={`${drawKey}:${s.id}`}
            className="wz-rhizome-seg wz-rhizome-new"
            data-thick={s.thick ? 'true' : undefined}
            pathLength={1}
            style={{ animationDelay: `${born.get(s.id)!.delay}ms` }}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          />
        ))}
      </g>
    </svg>
  );
}
