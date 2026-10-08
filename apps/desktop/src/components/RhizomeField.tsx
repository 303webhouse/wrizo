import { useEffect, useRef, useState, useCallback } from 'react';
import { useWritingSettings } from '../store/writingSettings';
import { useWritingGoal, goalCount } from '../store/writingGoal';
import {
  mulberry32, hashSeed, createRhizomeState, seedOrigins, growTo, goalFillTarget,
  pickLapSurvivor, stateFromSurvivor, scaledFillLength,
  FILL_SEGMENTS, FILL_SHOOTS,
  type RhizomeState, type RhizomeGeometry, type RhizomePoint, type RhizomeRect, type RhizomeSegment, type GrowToOptions,
} from '../store/rhizomeEngine';

// M2 — the Rhizome (docs/wrizo-alpha/m2-rhizome-brief.md, S2/S4). A single
// ambient SVG layer: absolutely positioned, clipped to its own box (an SVG
// element clips its own content to its own bounds by default — no separate
// `overflow:hidden` wrapper needed), z-index beneath paper and chrome (index
// .css's `.wz-rhizome-field`), `pointer-events:none`, `aria-hidden` — purely
// ambient, can never intercept a click or carry a control.
//
// SCOPE JUDGMENT CALL (disclosed in full in the build report): this build
// mounts RhizomeField ONLY on the framed (>=1100px) desk stage — the ONE
// place a "stage" wider than the paper itself genuinely exists in the
// current app (`.desk-frame-stage`, DeskFrame.tsx's own name for that exact
// zone — the literal match to S2's own words, "the desk stage"). Below
// 1100px, ModeStage's own root (`.mode-stage`) shrink-wraps to the paper's
// own intrinsic width when framed, and even in the legacy (`!framed`)
// layout the incentive row this ticket would otherwise extend does not
// currently exist at all inside `.desk-frame-stage` (S5's own mandatory
// geometry widths — 1100/1280/2200 — are ALL >= DESKFRAME_MIN_WIDTH, i.e.
// they exercise the framed path exclusively). Building a second, cramped
// legacy-only mount point would either (a) leave the mandatory geometry
// proofs untestable, or (b) require reviving DeskFrame's own explicitly-
// parked "meter track stays empty" law (FX1 S5, reaffirmed verbatim by both
// PageEditor.tsx's and JournalEntry.tsx's own framed-branch comments) for a
// feature the brief never asked to un-park. Scoping to framed-only keeps
// legacy (<1100px) chrome unconditionally byte-identical (this build's own
// standing instruction), keeps the paper-rect/stage-clamp proofs meaningful
// at every one of S5's three mandatory widths, and reuses an existing,
// PROVEN overlay pattern (GoalGlow.tsx/`goalGlow`) instead of inventing a
// new one. The Progress-style SETTING itself (S1) still stores/persists at
// any width — only its offering in the gear (ModeStage.tsx's SettingsPanel,
// `framed` prop) and this component's own visual effect are scoped to
// framed, so a writer who picks Rhizome on a wide screen sees it resume
// the instant they're back on one.
//
// Goal-fill (2026-10-07). Coverage is the current lap of the writer's own
// goal (store/writingGoal.ts — words or lines, whatever they set), not a
// fixed word count. Fraction 1 fills the ground; crossing the goal flashes
// the network brass, then clears it except one segment. The next lap grows
// only from that survivor. A 100-word goal and a 1000-word goal both arrive
// full at the same moment: the goal. Every segment after the first of the
// first lap starts on the network already drawn. Roots stay in the desk
// ground around the sheet. They do not cross the page, the clear band, a
// card, a board, a popout, the left rail, or the header. The corner logo
// is not a keep-out. pointer-events stay none. The page rect is not a
// layout participant.
const SESSION_START = Date.now(); // frozen once per app-load/session (S2: "session-scoped")

// The reward holds the full network in brass, then every segment but one
// is cleared. Same 1200ms family the old ember flash used; the paint is --brass now.
const FLASH_MS = 1200;

// Roots stop this far short of the sheet. The network lives in the ground
// around the page; it does not run up to the edge or continue behind it.
const PAGE_CLEAR = 56;

// Even-odd clip: the stage rect, then one subpath per keep-out. The same
// path feeds the SVG clip and a CSS clip-path on the element, so a mask
// aligned in the wrong user space cannot leave roots on the sheet.
function groundClipPath(w: number, h: number, holes: RhizomeRect[]): string {
  const n = (v: number) => Math.round(v * 10) / 10;
  let d = `M0 0H${n(w)}V${n(h)}H0Z`;
  for (const hole of holes) {
    const l = n(hole.left);
    const t = n(hole.top);
    const r = n(hole.right);
    const b = n(hole.bottom);
    if (r - l < 1 || b - t < 1) continue;
    d += `M${l} ${t}H${r}V${b}H${l}Z`;
  }
  return d;
}

function fillOpts(geo: RhizomeGeometry): GrowToOptions {
  const lens = scaledFillLength(geo.width, geo.height);
  return {
    shootCap: FILL_SHOOTS,
    hardCap: FILL_SEGMENTS,
    lenMin: lens.lenMin,
    lenMax: lens.lenMax,
    connected: true,
  };
}

// Stable chrome the roots route around. The corner logo (.brand-mark) is
// absent on purpose. Live menus are painted out of the mask when they open;
// they are not part of the growth geometry, so opening one does not re-seed.
const STABLE_CHROME = ['.desk-rail', '.desk-frame-strip', '.sprint-nav', '.gh-corner-glyph'];
const LIVE_CHROME = [
  '.gh-corner-menu',
  '.wz-cascade-panel',
  '.wz-sliver-panel[data-open="true"]',
  '.wz-sliver-grip',
  '.mode-settings',
  '.wz-ink-menu',
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

function rectsInStage(selectors: string[], stage: DOMRect): RhizomeRect[] {
  const out: RhizomeRect[] = [];
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest('.brand-mark')) continue;
      if (!isShown(el)) continue;
      const r = el.getBoundingClientRect();
      const rect = {
        left: r.left - stage.left,
        top: r.top - stage.top,
        right: r.right - stage.left,
        bottom: r.bottom - stage.top,
      };
      if (rect.right <= 1 || rect.bottom <= 1 || rect.left >= stage.width - 1 || rect.top >= stage.height - 1) continue;
      out.push(rect);
    }
  }
  return out;
}

function measure(svg: SVGSVGElement, paper: HTMLElement): { geo: RhizomeGeometry; origin: RhizomePoint; holes: RhizomeRect[] } | null {
  const stageRect = svg.getBoundingClientRect();
  const paperRect = paper.getBoundingClientRect();
  if (stageRect.width <= 0 || stageRect.height <= 0) return null;
  const sheet = {
    left: paperRect.left - stageRect.left,
    top: paperRect.top - stageRect.top,
    right: paperRect.right - stageRect.left,
    bottom: paperRect.bottom - stageRect.top,
  };
  const kept = {
    left: sheet.left - PAGE_CLEAR,
    top: sheet.top - PAGE_CLEAR,
    right: sheet.right + PAGE_CLEAR,
    bottom: sheet.bottom + PAGE_CLEAR,
  };
  const obstacles = rectsInStage(STABLE_CHROME, stageRect);
  // Growth avoids the sheet and the clear band. The band is an obstacle,
  // not the paper rect: inflating `paper` itself pushes the first origin
  // off the stage and grows nothing. The paint hole is the same band, so
  // a stroke that reaches the edge still does not draw on the page.
  return {
    geo: {
      width: stageRect.width,
      height: stageRect.height,
      paper: sheet,
      obstacles: [kept, ...obstacles],
    },
    holes: [kept, ...obstacles, ...rectsInStage(LIVE_CHROME, stageRect)],
    // S2's own origin: "the horizontal midpoint of the progress row's own
    // measured rect... first shoot rooted there." No incentive row exists
    // on the framed desk stage today (see this file's own header comment) —
    // the paper's own bottom-center reads as its exact equivalent (every
    // current layout centers the row on the SAME column as the paper, so
    // the two midpoints already coincide) and is trivially, always
    // measurable regardless of style/mode.
    origin: {
      x: (paperRect.left + paperRect.right) / 2 - stageRect.left,
      y: paperRect.bottom - stageRect.top,
    },
  };
}

// M3 — a MATERIAL change (> 1px on any stage dimension or paper edge) in the
// measured geometry: the trigger to re-fit the ground to the paper's new place.
// The paper is NOT still at mount — on a fresh load into an already-written
// page (S3's own DoD scenario) the chrome above it recedes over ~500ms, so the
// paper settles up by a few tens of px AFTER the field first measured+grew. A
// ground grown against the boot-time paper would then sit under the settled
// paper's top band (invisible — the field is z-beneath the paper — but a real
// gap in "the roam avoids the paper"). 1px, not 0, so sub-pixel measurement
// jitter can never thrash a rebuild.
function saltLap(salt: string): number {
  const lap = Number(salt.split(':')[2]);
  return Number.isFinite(lap) && lap > 0 ? Math.floor(lap) : 0;
}

function saltWithLap(salt: string, lap: number): string {
  const parts = salt.split(':');
  return `${parts[0]}:${parts[1]}:${lap}`;
}

function lapSalt(goalKey: string, count: number): string {
  const n = Number(goalKey.split(':')[0]);
  const lap = Number.isFinite(n) && n > 0 ? Math.floor(count / n) : 0;
  return `${goalKey}:${lap}`;
}

function rectMoved(a: RhizomeRect, b: RhizomeRect): boolean {
  return Math.abs(a.left - b.left) > 1 || Math.abs(a.top - b.top) > 1
    || Math.abs(a.right - b.right) > 1 || Math.abs(a.bottom - b.bottom) > 1;
}

function geoChanged(a: RhizomeGeometry, b: RhizomeGeometry): boolean {
  const ao = a.obstacles ?? [];
  const bo = b.obstacles ?? [];
  if (ao.length !== bo.length) return true;
  for (let i = 0; i < ao.length; i++) if (rectMoved(ao[i], bo[i])) return true;
  return (
    Math.abs(a.width - b.width) > 1 ||
    Math.abs(a.height - b.height) > 1 ||
    Math.abs(a.paper.left - b.paper.left) > 1 ||
    Math.abs(a.paper.top - b.paper.top) > 1 ||
    Math.abs(a.paper.right - b.paper.right) > 1 ||
    Math.abs(a.paper.bottom - b.paper.bottom) > 1
  );
}

function Segments({ segments, ox, oy }: { segments: RhizomeSegment[]; ox: number; oy: number }) {
  return (
    <>
      {segments.map(seg => (
        <line
          key={seg.id}
          className="wz-rhizome-seg"
          pathLength={1}
          data-thick={seg.thick ? 'true' : undefined}
          x1={seg.x1 - ox} y1={seg.y1 - oy} x2={seg.x2 - ox} y2={seg.y2 - oy}
        />
      ))}
    </>
  );
}

export function RhizomeField({ text, seedKey, paperRef }: {
  text: string;
  seedKey: string;
  paperRef: React.RefObject<HTMLElement | null>;
}) {

  const settings = useWritingSettings();
  const goal = useWritingGoal();
  const active = settings.progress === 'words' && settings.progressStyle === 'rhizome' && goal != null && goal.n > 0;
  const count = goal ? goalCount(text, goal) : 0;
  const frac = goal && goal.n > 0 ? (count % goal.n) / goal.n : 0;
  const goalKey = goal ? `${goal.n}:${goal.unit}` : 'none';

  const svgRef = useRef<SVGSVGElement>(null);
  const [state, setState] = useState<RhizomeState>(createRhizomeState);
  const [flash, setFlash] = useState(false);
  const [holes, setHoles] = useState<RhizomeRect[]>([]);
  const [fieldSize, setFieldSize] = useState({ w: 0, h: 0 });

  const rngRef = useRef<(() => number) | null>(null);
  const originsRef = useRef<RhizomePoint[] | null>(null);
  const builtGeoRef = useRef<RhizomeGeometry | null>(null);
  const builtSaltRef = useRef<string | null>(null);
  const saltRef = useRef(`${goalKey}:0`);
  const prevCountRef = useRef<number | null>(null);
  const seenGoalRef = useRef<string | null>(null);
  const holdFlashRef = useRef(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fracRef = useRef(frac);
  const countRef = useRef(count);
  const goalKeyRef = useRef(goalKey);
  fracRef.current = frac;
  countRef.current = count;
  goalKeyRef.current = goalKey;

  const stateRef = useRef<RhizomeState>(state);
  const updateState = useCallback((updater: (s: RhizomeState) => RhizomeState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  const measureNow = useCallback(() => {
    const svg = svgRef.current;
    const paper = paperRef.current;
    if (!svg || !paper) return null;
    return measure(svg, paper);
  }, [paperRef]);

  const paintMask = useCallback((next: RhizomeRect[], w: number, h: number) => {
    setHoles(prev => {
      if (prev.length === next.length && prev.every((r, i) => !rectMoved(r, next[i]))) return prev;
      return next;
    });
    setFieldSize(prev => (Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1 ? prev : { w, h }));
  }, []);

  // The lap before this one, grown to the cap, leaves exactly one segment.
  // Replaying it from the salt (not from whatever is on screen) keeps a
  // resize and a reload on the same session deterministic.
  const carrySurvivor = useCallback((geo: RhizomeGeometry, salt: string): RhizomeState => {
    const lap = saltLap(salt);
    if (lap <= 0) return createRhizomeState();
    const prevSalt = saltWithLap(salt, lap - 1);
    const prevRng = mulberry32(hashSeed(`${seedKey}:${SESSION_START}:${prevSalt}`));
    const prevOrigins = seedOrigins(prevRng, geo);
    const prevStart = carrySurvivor(geo, prevSalt);
    const prev = growTo(prevStart, prevRng, geo, prevOrigins, FILL_SEGMENTS, fillOpts(geo));
    if (prev.segments.length === 0) return createRhizomeState();
    const kept = pickLapSurvivor(prev.segments, `${seedKey}:${SESSION_START}:${prevSalt}:survivor`, geo);
    return stateFromSurvivor(kept);
  }, [seedKey]);

  const rebuild = useCallback((geo: RhizomeGeometry, target: number, salt: string, mask: RhizomeRect[]) => {
    const start = carrySurvivor(geo, salt);
    const rng = mulberry32(hashSeed(`${seedKey}:${SESSION_START}:${salt}`));
    rngRef.current = rng;
    const origins = seedOrigins(rng, geo);
    originsRef.current = origins;
    builtGeoRef.current = geo;
    builtSaltRef.current = salt;
    saltRef.current = salt;
    paintMask(mask, geo.width, geo.height);
    const next = growTo(start, rng, geo, origins, target, fillOpts(geo));
    stateRef.current = next;
    setState(next);
  }, [seedKey, paintMask, carrySurvivor]);

  const syncField = useCallback(() => {
    if (!active || holdFlashRef.current) return;
    const m = measureNow();
    if (!m) return;
    const target = goalFillTarget(fracRef.current);
    const salt = saltRef.current;
    if (!builtGeoRef.current || !originsRef.current || !rngRef.current || geoChanged(m.geo, builtGeoRef.current) || salt !== builtSaltRef.current) {
      rebuild(m.geo, target, salt, m.holes);
      return;
    }
    paintMask(m.holes, m.geo.width, m.geo.height);
    updateState(s => growTo(s, rngRef.current!, m.geo, originsRef.current!, target, fillOpts(m.geo)));
  }, [active, measureNow, rebuild, updateState, paintMask]);

  const syncRef = useRef(syncField);
  syncRef.current = syncField;

  // A new page reseeds. The growth effect below (it lists seedKey) paints
  // the new page's own lap; this reset makes that paint start from empty.
  useEffect(() => {
    rngRef.current = null;
    originsRef.current = null;
    builtGeoRef.current = null;
    builtSaltRef.current = null;
    prevCountRef.current = null;
    seenGoalRef.current = null;
    saltRef.current = lapSalt(goalKeyRef.current, countRef.current);
    holdFlashRef.current = false;
    if (flashTimerRef.current) { clearTimeout(flashTimerRef.current); flashTimerRef.current = null; }
    const fresh = createRhizomeState();
    stateRef.current = fresh;
    setState(fresh);
    setFlash(false);
    setHoles([]);
  }, [seedKey]);

  useEffect(() => {
    if (!active) return;
    if (seenGoalRef.current !== goalKey) {
      seenGoalRef.current = goalKey;
      prevCountRef.current = count;
      saltRef.current = lapSalt(goalKey, count);
      builtGeoRef.current = null;
      syncRef.current();
      return;
    }
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    const n = goal?.n ?? 0;
    const crossed = prev != null && n > 0 && count > prev && Math.floor(count / n) > Math.floor(prev / n);
    if (crossed) {
      holdFlashRef.current = true;
      const m = measureNow();
      if (m && rngRef.current && originsRef.current && builtGeoRef.current) {
        const full = growTo(stateRef.current, rngRef.current, m.geo, originsRef.current, FILL_SEGMENTS, fillOpts(m.geo));
        stateRef.current = full;
        setState(full);
        paintMask(m.holes, m.geo.width, m.geo.height);
      } else if (m) {
        rebuild(m.geo, FILL_SEGMENTS, saltRef.current, m.holes);
      }
      setFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => {
        setFlash(false);
        holdFlashRef.current = false;
        saltRef.current = lapSalt(goalKeyRef.current, countRef.current);
        builtGeoRef.current = null;
        syncRef.current();
      }, FLASH_MS);
      return;
    }
    syncRef.current();
  }, [active, count, goalKey, goal, seedKey, measureNow, rebuild, paintMask]);

  useEffect(() => {
    if (!active) return;
    const svg = svgRef.current;
    const paper = paperRef.current;
    if (!svg || !paper || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; syncRef.current(); });
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(svg);
    ro.observe(paper);
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-open', 'hidden', 'aria-expanded', 'data-writing'],
    });
    const settleTail = setTimeout(schedule, 600);
    return () => { if (raf) cancelAnimationFrame(raf); clearTimeout(settleTail); ro.disconnect(); mo.disconnect(); };
  }, [active, paperRef, seedKey]);

  useEffect(() => () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); }, []);

  if (!active) return null;

  const clipD = fieldSize.w > 0 ? groundClipPath(fieldSize.w, fieldSize.h, holes) : '';

  return (
    <svg
      ref={svgRef}
      className="wz-rhizome-field"
      aria-hidden="true"
      focusable="false"
      data-flash={flash ? 'true' : 'false'}
      data-segments={state.segments.length}
      data-goal-frac={frac.toFixed(3)}
      viewBox={fieldSize.w > 0 ? `0 0 ${fieldSize.w} ${fieldSize.h}` : undefined}
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none', clipPath: clipD ? `path(evenodd, "${clipD}")` : undefined }}
    >
      {fieldSize.w > 0 && (
        <>
          <clipPath id="wz-rhizome-ground" clipPathUnits="userSpaceOnUse">
            <path fillRule="evenodd" d={clipD} />
          </clipPath>
          <mask id="wz-rhizome-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={fieldSize.w} height={fieldSize.h}>
            <rect x="0" y="0" width={fieldSize.w} height={fieldSize.h} fill="#fff" />
            {holes.map((r, i) => (
              <rect key={i} x={r.left} y={r.top} width={Math.max(0, r.right - r.left)} height={Math.max(0, r.bottom - r.top)} fill="#000" />
            ))}
          </mask>
        </>
      )}
      <g clipPath={fieldSize.w > 0 ? 'url(#wz-rhizome-ground)' : undefined} mask={fieldSize.w > 0 ? 'url(#wz-rhizome-mask)' : undefined}>
        <Segments segments={state.segments} ox={0} oy={0} />
      </g>
    </svg>
  );
}
