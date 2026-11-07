import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useWritingSettings } from '../store/writingSettings';
import { useWritingGoal, goalCount } from '../store/writingGoal';
import { useTheme } from '../store/theme';
import { lapPlan, segmentsFor, geometryKey, pickSurvivor, hashSeed, type GrowthGeometry, type GrowthSegment, type Rect } from '../store/rhizomeGrowth';
import { variationOn, pacedFrac, shootClass } from '../arbor2/shoots';   // ARBOR v2 mockup, item 7: drawn only under ?arbor2=1
import { isArbor2 } from '../arbor2/flag';
import { lifeOf, effective, lifePlan, tipOf, segKey, setCurrentRhizome, subscribeLife } from '../arbor2/rhizomeLife';   // ARBOR v2 mockup, r5 §8b: only under ?arbor2=1
import { ArborVines, type Room } from '../arbor2/vines';   // ARBOR v2 mockup r19: the rhizome drawn as vines (Arbor's presentation; the growth is this file's)

// the goal rhizome: shoots grow out of existing stems, flash brass at the goal and leave a seed; drawn behind the page and clipped from the rail, strip, header and open menus; ambient, framed stage only [RhizomeField §1]
const SESSION_START = Date.now(); // the pattern is session-scoped (M2 S2)

const FLASH_MS = 1200;   // the brass reward
// after the hold the brass network fades over FADE_MS; under reduced motion the hold stays and the lap clears at its end [RhizomeField §2]
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

// ARBOR v2 mockup r21 (Fable, Nov 4): under the flag the vines are PLANNED in fixed page-relative units - the page a 620 x 560 band at the centre of
// a 2000 x 1300 field - so the plan is the seed and the words only: no window, menu, drawer or receding chrome can reshape it (the measured
// geometry counted the chrome only while it showed, so its recede and return re-planned the drawing). The vines module places it on the screen.
const CANON: GrowthGeometry = { width: 2000, height: 1300, origin: { x: 1000, y: 650 }, hidden: [{ left: 690, top: 370, right: 1310, bottom: 930 }] };

export function RhizomeField({ text, seedKey, paperRef }: {
  text: string;
  seedKey: string;
  paperRef: React.RefObject<HTMLElement | null>;
}) {
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  // the rhizome is Arbor's only: under any other theme this field draws nothing [RhizomeField §3]
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
  // ARBOR v2 mockup (r5, spec §8b - the rhizome's life): under the flag the finished laps STAY (drawn at .4 by day; by night only in the flash),
  // the next lap grows from the TIP of the last one, and the history is held IN-SESSION per page (src/arbor2/rhizomeLife.ts: nothing stored),
  // with Clear Rhizome / Undo in the mockup bar. Off the flag: life is null and every line below is today's.
  const life = active && isArbor2() ? lifeOf(openKey, lap) : null;
  const [, setLifeTick] = useState(0);
  useEffect(() => (life ? subscribeLife(() => setLifeTick((x) => x + 1)) : undefined), [life]);
  useEffect(() => { if (life) setCurrentRhizome(openKey, count, lap, frac); }, [life, openKey, count, lap, frac]);
  useEffect(() => () => setCurrentRhizome(null), []);
  const eff = life ? effective(life, lap, frac) : null;
  const lifeSeed = eff ? `${pageSeed}${eff.suffix}` : pageSeed;

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
  const shownVisit = Math.max(0, shownLap - (eff ? eff.baseLap : opened.current.lap));
  const lifeOn = !!eff;
  const plan = useMemo(() => (lifeOn ? lifePlan(CANON, lifeSeed, shownVisit) : m ? lapPlan(m.geo, pageSeed, shownVisit) : null), [m, pageSeed, lifeSeed, lifeOn, shownVisit]);
  // ARBOR v2 mockup (item 7): under the flag each lap keeps its own pace and shoot widths (src/arbor2/shoots.ts). Off the flag: unchanged.
  const variation = variationOn();
  const drawFrac = eff ? eff.frac : frac;
  const k = plan ? (flashLap != null ? plan.segments.length : segmentsFor(plan, variation ? pacedFrac(pageSeed, shownLap, drawFrac) : drawFrac)) : 0;
  // r5 §8b: the laps before this one (from the base lap), whole - the kept history, and where this lap's first segment came from (the tip)
  const pastPlans = useMemo(() => (lifeOn ? Array.from({ length: shownVisit }, (_, v) => lifePlan(CANON, lifeSeed, v)) : []), [lifeOn, lifeSeed, shownVisit]);
  // r21: the room the vines reach into (svg coordinates): the page's centre, the rail's right edge, the bar's bottom, the field's own size - read
  // from their rects whatever their opacity (the chrome's recede must not move a stem's end), only when the field is measured again
  const room = useMemo<Room | null>(() => {
    const svg = svgRef.current; if (!m || !svg) return null;
    const st = svg.getBoundingClientRect();
    const rail = document.querySelector('.desk-frame-strip')?.getBoundingClientRect(), bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].map((b) => b.getBoundingClientRect()).find((r) => r.height > 0);
    // (r21: and the page's own edges - the kept band less its clearance - so a stem knows whether it can leave through the top or the bottom)
    const pg = m.geo.hidden[0];
    return { cx: m.geo.origin.x, cy: m.geo.origin.y, left: rail && rail.width > 0 ? Math.max(0, rail.right - st.left) : 0, right: m.geo.width, top: bar ? Math.max(0, bar.bottom - st.top) : 0, bottom: m.geo.height,
      pl: pg.left + PAGE_CLEAR, pt: pg.top + PAGE_CLEAR, pr: pg.right - PAGE_CLEAR, pb: pg.bottom - PAGE_CLEAR };
  }, [m]);
  const roomKey = room ? [room.cx, room.cy, room.left, room.right, room.top, room.bottom, room.pl, room.pt, room.pr, room.pb].map((v) => Math.round(v)).join(',') : '';
  const roomStable = useMemo(() => room, [roomKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const baseLap = eff ? eff.baseLap : 0;
  const pastPaths = useMemo(() => {
    const out: { key: string; thick: boolean; w?: number; d: string }[] = [];
    if (!pastPlans.length) return out;
    if (variation) {
      for (const c of [0, 1, 2, 3] as const) for (const thick of [false, true]) {
        const d = pastPlans.map((pl, v) => pathOf(pl.segments.filter((s) => shootClass(pageSeed, baseLap + v, s) === c), thick)).join('');
        if (d) out.push({ key: `${c}${thick}`, thick, w: c, d });
      }
    } else {
      for (const thick of [false, true]) { const d = pastPlans.map((pl) => pathOf(pl.segments, thick)).join(''); if (d) out.push({ key: String(thick), thick, d }); }
    }
    return out;
  }, [pastPlans, variation, pageSeed, baseLap]);
  const tipKey = lifeOn && shownVisit > 0 && pastPlans.length ? segKey(tipOf(pastPlans[pastPlans.length - 1])) : undefined;
  const startKey = lifeOn && shownVisit > 0 && plan ? segKey(plan.segments[0]) : undefined;

  // Which segments are still GROWING. A segment that appears gets its own start time (staggered within its burst) and stays
  // a separate <line> until its draw-on has finished, so typing the next word never cuts the last word's growth short.
  // Anything that changes the drawing as a whole (another page, another lap, a new geometry, the flash) starts a fresh
  // record with nothing growing, so a reload or a resize never replays the growth.
  const growing = useRef<{ key: string; k: number; born: Map<number, { delay: number; until: number }> }>({ key: '', k: 0, born: new Map() });
  const drawKey = plan && m ? `${lifeSeed}#${shownLap}#${geometryKey(m.geo)}#${flashLap != null ? 'flash' : 'grow'}` : '';
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
  const seedRoot = !lifeOn && flashFading && plan ? pickSurvivor(plan, hashSeed(`${pageSeed}:survivor:${shownVisit}`)) : null;   // r5: under the flag no survivor - the next lap grows from the tip
  const isSeed = (s: GrowthSegment) => !!seedRoot && seedRoot.some(r => r.x1 === s.x1 && r.y1 === s.y1 && r.x2 === s.x2 && r.y2 === s.y2);
  const fadingSettled = seedRoot ? settled.filter(s => !isSeed(s)) : settled;
  const seedSettled = seedRoot ? settled.filter(isSeed) : [];

  // ARBOR v2 mockup r21 (Fable, Nov 6: the flash's night B2 - "a pre-rendered bitmap mask; keep the look identical"): the flash copy's mask is the
  // field's own - its 24 px edge fade and its holes - drawn ONCE per field geometry into a bitmap (device pixels) and applied as a CSS mask on
  // the flash layer, so the brass copy never re-reads the live field's SVG mask while it pulses. Until it exists the SVG mask stays.
  // (hooks: above the early return, so their order never changes)
  const [flashMask, setFlashMask] = useState<string | null>(null);
  const fw = m?.geo.width ?? 0, fh = m?.geo.height ?? 0;
  const maskKey = active && lifeOn && !!m && !!roomStable && fh > 60 ? `${fw}x${fh}|${m.holes.map((r) => [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v * 10) / 10).join(',')).join(';')}` : '';
  useEffect(() => {
    if (!maskKey || !m) { setFlashMask(null); return; }
    const k = window.devicePixelRatio || 1, c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(fw * k)); c.height = Math.max(1, Math.round(fh * k));
    const g = c.getContext('2d'); if (!g) return;
    g.scale(k, k);
    // the field mask's white-to-black as alpha: clear at the top and bottom edges, whole between, over the same 24 px
    const grad = g.createLinearGradient(0, 0, 0, fh);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(24 / fh, 'rgba(0,0,0,1)'); grad.addColorStop(1 - 24 / fh, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, fw, fh);
    for (const r of m.holes) g.clearRect(r.left, r.top, Math.max(0, r.right - r.left), Math.max(0, r.bottom - r.top));
    let url: string | null = null, gone = false;
    c.toBlob((b) => { if (!b || gone) return; url = URL.createObjectURL(b); setFlashMask(url); }, 'image/png');
    return () => { gone = true; if (url) URL.revokeObjectURL(url); };
  }, [maskKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  const w = m?.geo.width ?? 0, h = m?.geo.height ?? 0;
  // ARBOR v2 mockup r19 (spec draft 35 §18.1 F; Fable: Arbor's own presentation behind this seam): under the flag the same plan, the same k and
  // the same kept laps are drawn as filled, tapered vines (src/arbor2/vines.tsx). Off the flag (lifeOn false) nothing below changes.
  const vines = lifeOn && !!m && !!roomStable;
  const vineP = flashLap != null ? 1 : Math.max(0, Math.min(1, drawFrac));   // r21 §18.6: this lap's words / its goal (the flash draws it whole)
  const clipD = m ? groundClipPath(w, h, m.holes) : '';

  // ARBOR v2 mockup r20: the flash as a brass copy of the vines in its own layer (styles/arbor-v2.css: opacity only, composited) - the field
  // itself never changes while it flashes, so typing in the flash costs what typing at rest does
  const flashState = flashLap != null ? (flashFading ? 'fading' : 'true') : null;
  const flashCopy = vines && flashState && m ? (
    <svg className="arbor2-vines-flash" aria-hidden="true" focusable="false" data-flash={flashState} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
      style={{ clipPath: clipD ? `path(evenodd, "${clipD}")` : undefined,
        ...(flashMask ? { maskImage: `url("${flashMask}")`, WebkitMaskImage: `url("${flashMask}")`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskMode: 'alpha' } : {}) }}
      data-mask={flashMask ? 'bitmap' : 'svg'}>
      <g mask={flashMask ? undefined : 'url(#wz-rhizome-mask)'}><ArborVines plan={plan} past={pastPlans} geo={CANON} room={roomStable!} p={vineP} fromTip={shownVisit > 0} /></g>
    </svg>
  ) : null;

  return (
    <>
    <svg
      ref={svgRef}
      className="wz-rhizome-field"
      aria-hidden="true"
      focusable="false"
      data-flash={flashLap != null ? (flashFading ? 'fading' : 'true') : 'false'}
      data-lap={shownLap}
      data-segments={segs.length}
      data-goal-frac={frac.toFixed(3)}
      data-tip={tipKey}
      data-start={startKey}
      data-vines={vines ? 'true' : undefined}
      viewBox={w > 0 ? `0 0 ${w} ${h}` : undefined}
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none', clipPath: clipD ? `path(evenodd, "${clipD}")` : undefined }}
    >
      {m && (
        <>
          <clipPath id="wz-rhizome-ground" clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" fillRule="evenodd" d={clipD} />
          </clipPath>
          {/* ARBOR v2 mockup r21 (Fable Nov 5: no hard cut at the field's top / bottom): under the flag the vines fade out over the field's last
              24 px, top and bottom - the mask they already pass through takes a vertical gradient (no new layer, no layout change) */}
          {vines && h > 60 && (
            <linearGradient id="arbor2-edge-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
              <stop offset="0" stopColor="#000" /><stop offset={24 / h} stopColor="#fff" /><stop offset={1 - 24 / h} stopColor="#fff" /><stop offset="1" stopColor="#000" />
            </linearGradient>
          )}
          <mask id="wz-rhizome-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            <rect x="0" y="0" width={w} height={h} fill={vines && h > 60 ? 'url(#arbor2-edge-fade)' : '#fff'} />
            {m.holes.map((r, i) => (
              <rect key={i} x={r.left} y={r.top} width={Math.max(0, r.right - r.left)} height={Math.max(0, r.bottom - r.top)} fill="#000" />
            ))}
          </mask>
        </>
      )}
      <g clipPath={m ? 'url(#wz-rhizome-ground)' : undefined} mask={m ? 'url(#wz-rhizome-mask)' : undefined}>
        {vines ? <ArborVines plan={plan} past={pastPlans} geo={CANON} room={roomStable!} p={vineP} fromTip={shownVisit > 0} /> : (<>
        {pastPaths.length > 0 && (
          <g className="wz-rhizome-past">
            {pastPaths.map((p) => <path key={p.key} className="wz-rhizome-old" data-thick={p.thick ? 'true' : undefined} data-w={p.w} d={p.d} />)}
          </g>
        )}
        {variation ? ([0, 1, 2, 3] as const).flatMap((c) => [false, true].map((thick) => (
          <path key={`${c}${thick}`} className="wz-rhizome-seg" data-thick={thick ? 'true' : undefined} data-w={c}
            d={pathOf(fadingSettled.filter((s) => shootClass(pageSeed, shownLap, s) === c), thick)} />
        ))) : (
          <>
            <path className="wz-rhizome-seg" d={pathOf(fadingSettled, false)} />
            <path className="wz-rhizome-seg" data-thick="true" d={pathOf(fadingSettled, true)} />
          </>
        )}
        {seedSettled.length > 0 && <path className="wz-rhizome-seg" data-thick="true" data-seed="true" d={pathOf(seedSettled, true)} />}
        {animated.map(s => (
          <line
            key={`${drawKey}:${s.id}`}
            className="wz-rhizome-seg wz-rhizome-new"
            data-thick={s.thick ? 'true' : undefined}
            data-w={variation ? shootClass(pageSeed, shownLap, s) : undefined}
            pathLength={1}
            style={{ animationDelay: `${born.get(s.id)!.delay}ms` }}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          />
        ))}
        </>)}
      </g>
    </svg>
    {flashCopy}
    </>
  );
}
