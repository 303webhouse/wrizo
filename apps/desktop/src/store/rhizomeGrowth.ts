// RHIZOME GROWTH (Fable, 2026-10-08) — the goal rhizome's whole growth model, pure and deterministic.
//
// Nick's rules, in the order the code honours them:
//   1. The goal reveals a weed, it does not carpet the ground. planLap grows one plant; segmentsFor() shows the shortest
//      prefix that reaches fraction f of that plant's own coverage. At the goal the plant is whole, and the stage is not.
//   2. Growth always comes from the existing network. Every segment starts at the end of an earlier segment (a stem tip
//      extending) or at an earlier segment's end point (a side branch). No free-standing origins after the first.
//   3. Stems, not scratches. Each step is short (STEP_MIN..STEP_MAX px) and turns only a little from the one before
//      (MAX_TURN plus a small wander), so a root is a chain of short, gently curving steps.
//   4. One sprout. Every lap starts at the page's centre and the shoots leave in a spread of directions. They may pass
//      under the page (hidden, never painted). Some shoots are given more steps than others.
//   5. Laps. At the goal the whole network flashes brass, then clears. The next rhizome sprouts again at the page's
//      centre. Every lap of a page starts there.
//
// Nothing here touches the DOM. RhizomeField.tsx measures the geometry and renders; this file decides what grows.

export interface Rect { left: number; top: number; right: number; bottom: number }

export interface GrowthGeometry {
  width: number;
  height: number;
  /** Where growth may pass but is never painted or counted: the sheet (roots grow behind it, never over it), the rail, the strip, the header. */
  hidden: Rect[];
  /** The sprout. Every lap starts here (the page's centre). */
  origin: { x: number; y: number };
}

export interface GrowthSegment {
  id: number;
  x1: number; y1: number; x2: number; y2: number;
  /** A main stem (order 0) or the lap's survivor: drawn heavier. */
  thick: boolean;
  /** 0 = main stem, 1+ = branch depth. */
  order: number;
  /** Which stem (one growing tip's whole run) this segment belongs to. */
  stem: number;
  /** False when the segment lies wholly under a hidden rect (it is still part of the network). */
  visible: boolean;
}

export interface LapPlan {
  segments: GrowthSegment[];
  /** coverAt[i] = visible cells covered once segments[0..i] are drawn. */
  coverAt: number[];
  /** Visible cells in this geometry (the denominator of "coverage"). */
  visibleCells: number;
  /** How many leading segments are the opening stroke at the page centre, shown even at 0% of the goal. */
  firstCount: number;
}

// ---- tuning (all in CSS px of the stage) --------------------------------------------------------------------------------
export const CELL = 28;            // coverage grid cell
export const STEP_MIN = 10;        // shortest step of a stem
export const STEP_MAX = 22;        // longest step of a stem
export const MAX_TURN = (24 * Math.PI) / 180;   // steering limit per step, toward the stem's target
export const WANDER = (9 * Math.PI) / 180;      // random wobble per step (gaussian sigma)
export const LOOK = 5;             // cells a tip looks ahead when choosing where to grow
export const HIDDEN_PULL = 0.7;    // how much hidden ground (under the page) invites growth, vs 1 for open ground
export const SURVIVOR_STEPS = 7;   // the stroke kept between laps: this many consecutive segments of one stem
export const FULL_COVER = 0.86;    // kept: the old "fill the ground" target. A lap no longer grows toward it.
export const LAP_CAP = 4200;       // hard cap on segments per lap (safety)
export const SHOOTS = 7;           // strands leaving the sprout, spread around it
export const SHORT_EXTRA = 12;     // steps a short shoot grows after it clears the page
export const MID_EXTRA = 28;
export const LONG_EXTRA = 128;     // a few shoots run well past the others
export const SPLIT_CHANCE = 0.07;  // a main shoot sometimes throws a short side twig
export const BRANCH_MIN = (35 * Math.PI) / 180;
export const BRANCH_MAX = (70 * Math.PI) / 180;
export const EDGE_PAD = 3;         // keep this far inside the stage edge

// ---- seeded randomness ----------------------------------------------------------------------------------------------
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function gauss(rng: () => number): number {
  // Box–Muller, clamped so one unlucky draw can never kink a stem.
  const u = Math.max(rng(), 1e-9), v = rng();
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(-2.5, Math.min(2.5, g));
}

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function inRect(x: number, y: number, r: Rect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function isHidden(geo: GrowthGeometry, x: number, y: number): boolean {
  for (const r of geo.hidden) if (inRect(x, y, r)) return true;
  return false;
}

// ---- the coverage grid ----------------------------------------------------------------------------------------------
interface Grid {
  cols: number; rows: number;
  visible: Uint8Array;   // 1 = a cell whose centre is paintable
  covered: Uint8Array;   // 1 = a stroke has passed through it
  visibleCount: number;
  coveredCount: number;
  open: number[];        // visible, not yet covered (kept loosely; filtered lazily)
  midX: number;          // the page's centre line: cells left of it are the left margin
  sideVisible: [number, number];
  sideCovered: [number, number];
}

function makeGrid(geo: GrowthGeometry): Grid {
  const cols = Math.max(1, Math.ceil(geo.width / CELL));
  const rows = Math.max(1, Math.ceil(geo.height / CELL));
  const visible = new Uint8Array(cols * rows);
  const covered = new Uint8Array(cols * rows);
  const open: number[] = [];
  let visibleCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = Math.min(geo.width - 1, (c + 0.5) * CELL);
      const cy = Math.min(geo.height - 1, (r + 0.5) * CELL);
      if (!isHidden(geo, cx, cy)) { visible[r * cols + c] = 1; visibleCount++; open.push(r * cols + c); }
    }
  }
  const midX = geo.origin.x;
  const sideVisible: [number, number] = [0, 0];
  for (const k of open) sideVisible[cellCentre0(k, cols) < midX ? 0 : 1]++;
  return { cols, rows, visible, covered, visibleCount, coveredCount: 0, open, midX, sideVisible, sideCovered: [0, 0] };
}

function markLine(g: Grid, x1: number, y1: number, x2: number, y2: number): void {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(1, Math.ceil(len / (CELL / 3)));
  for (let i = 0; i <= n; i++) {
    const x = x1 + ((x2 - x1) * i) / n, y = y1 + ((y2 - y1) * i) / n;
    const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) continue;
    const k = r * g.cols + c;
    if (g.visible[k] && !g.covered[k]) { g.covered[k] = 1; g.coveredCount++; g.sideCovered[cellCentre0(k, g.cols) < g.midX ? 0 : 1]++; }
  }
}

function cellCentre0(k: number, cols: number): number { return ((k % cols) + 0.5) * CELL; }

// ---- one lap ---------------------------------------------------------------------------------------------------------
interface Tip { x: number; y: number; angle: number; order: number; stem: number; left: number; cx: number; cy: number }

function inStage(geo: GrowthGeometry, x: number, y: number): boolean {
  return x >= EDGE_PAD && y >= EDGE_PAD && x <= geo.width - EDGE_PAD && y <= geo.height - EDGE_PAD;
}

/**
 * Grow one whole lap from the page's centre. A previous stem is ignored: every refresh sprouts there again.
 * The same (geo, seed) always yields the same plan, so a resize or a reload replays it exactly.
 */
export function planLap(geo: GrowthGeometry, seed: number, start: GrowthSegment[] | null): LapPlan {
  void start;
  const rng = mulberry32(seed);
  const g = makeGrid(geo);
  const segments: GrowthSegment[] = [];
  const coverAt: number[] = [];
  let nextId = 1, nextStem = 1;

  const push = (x1: number, y1: number, x2: number, y2: number, order: number, stem: number, thick: boolean) => {
    const visible = !(isHidden(geo, x1, y1) && isHidden(geo, x2, y2) && isHidden(geo, (x1 + x2) / 2, (y1 + y2) / 2));
    const seg: GrowthSegment = { id: nextId++, x1, y1, x2, y2, order, stem, thick, visible };
    segments.push(seg);
    markLine(g, x1, y1, x2, y2);
    coverAt.push(g.coveredCount);
    return seg;
  };

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const place = (x: number, y: number) => ({
    x: clamp(x, EDGE_PAD, geo.width - EDGE_PAD),
    y: clamp(y, EDGE_PAD, geo.height - EDGE_PAD),
  });
  // How many steps, along `angle`, until the shoot is out from under the page (or the stage edge).
  const clearSteps = (x: number, y: number, angle: number) => {
    const step = (STEP_MIN + STEP_MAX) / 2;
    for (let i = 1; i <= 80; i++) {
      const px = x + Math.cos(angle) * step * i, py = y + Math.sin(angle) * step * i;
      if (!inStage(geo, px, py)) return Math.max(1, i - 1);
      if (!isHidden(geo, px, py)) return i;
    }
    return 12;
  };
  const tips: Tip[] = [];
  const extraSteps = () => {
    const roll = rng();
    return roll < 0.28 ? SHORT_EXTRA + Math.floor(rng() * 4)
      : roll < 0.72 ? MID_EXTRA + Math.floor(rng() * 6)
      : LONG_EXTRA + Math.floor(rng() * 8);
  };
  const fan = (x: number, y: number, order: number) => {
    const base = rng() * Math.PI * 2;
    for (let i = 0; i < SHOOTS; i++) {
      const angle = base + (i * 2 * Math.PI) / SHOOTS + (rng() - 0.5) * 0.85;
      tips.push({
        x, y, angle, order, stem: nextStem++, left: clearSteps(x, y, angle) + extraSteps(), cx: x, cy: y,
      });
    }
  };
  // Every lap sprouts at the page's centre.
  const o = place(geo.origin.x, geo.origin.y);
  const a0 = rng() * Math.PI * 2;
  const heart = STEP_MIN + rng() * (STEP_MAX - STEP_MIN);
  const x2 = clamp(o.x + Math.cos(a0) * heart, EDGE_PAD, geo.width - EDGE_PAD);
  const y2 = clamp(o.y + Math.sin(a0) * heart, EDGE_PAD, geo.height - EDGE_PAD);
  push(o.x, o.y, x2, y2, 0, nextStem++, true);
  fan(x2, y2, 0);
  const firstCount = 1;

  let guard = 0;
  while (tips.length && segments.length < LAP_CAP && guard++ < LAP_CAP * 4) {
    const ti = Math.floor(rng() * tips.length);
    const tip = tips[ti];
    let angle = tip.angle;
    if (Math.hypot(tip.x - tip.cx, tip.y - tip.cy) > STEP_MAX) {
      const outward = Math.atan2(tip.y - tip.cy, tip.x - tip.cx);
      angle += clamp(angleDiff(angle, outward), -MAX_TURN, MAX_TURN) * 0.4;
    }
    angle += gauss(rng) * WANDER;
    const len = STEP_MIN + rng() * (STEP_MAX - STEP_MIN);
    const nx = tip.x + Math.cos(angle) * len, ny = tip.y + Math.sin(angle) * len;
    if (!inStage(geo, nx, ny)) { tips.splice(ti, 1); continue; }
    push(tip.x, tip.y, nx, ny, tip.order, tip.stem, tip.order === 0);
    tip.x = nx; tip.y = ny; tip.angle = angle;
    tip.left--;
    if (tip.order === 0 && tip.left > 3 && tips.length < SHOOTS + 6 && rng() < SPLIT_CHANCE) {
      const side = rng() < 0.5 ? -1 : 1;
      const turn = BRANCH_MIN + rng() * (BRANCH_MAX - BRANCH_MIN);
      tips.push({
        x: nx, y: ny, angle: angle + side * turn, order: 1, stem: nextStem++,
        left: 3 + Math.floor(rng() * 5), cx: tip.cx, cy: tip.cy,
      });
    }
    if (tip.left <= 0) tips.splice(tips.indexOf(tip), 1);
  }

  return { segments, coverAt, visibleCells: g.visibleCount, firstCount };
}

// ---- reading a plan ----------------------------------------------------------------------------------------------------
/** How many of the lap's segments to show at goal fraction f (0..1). Coverage, not segment count, tracks the goal. */
export function segmentsFor(plan: LapPlan, f: number): number {
  const n = plan.segments.length;
  if (n === 0) return 0;
  if (f <= 0) return plan.firstCount; // the opening stroke at the page centre is always there
  if (f >= 1) return n;
  const want = f * plan.coverAt[n - 1];
  // binary search the first index whose coverage reaches `want`
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (plan.coverAt[mid] >= want) hi = mid; else lo = mid + 1;
  }
  return Math.max(plan.firstCount, lo + 1);
}

/**
 * The stroke that survives a lap: SURVIVOR_STEPS consecutive, visible segments of one main stem (a visible little root,
 * not a speck), chosen by the seed. Drawn thick. The next lap does not grow from it; it sprouts at the page centre again.
 */
export function pickSurvivor(plan: LapPlan, seed: number): GrowthSegment[] | null {
  const byStem = new Map<number, GrowthSegment[]>();
  for (const s of plan.segments) {
    if (!byStem.has(s.stem)) byStem.set(s.stem, []);
    byStem.get(s.stem)!.push(s);
  }
  const runs: GrowthSegment[][] = [];
  for (const segs of byStem.values()) {
    let run: GrowthSegment[] = [];
    for (const s of segs) {
      const joins = run.length === 0 || (run[run.length - 1].x2 === s.x1 && run[run.length - 1].y2 === s.y1);
      if (s.visible && joins) run.push(s); else { run = s.visible ? [s] : []; }
      if (run.length === SURVIVOR_STEPS) { runs.push(run.slice()); run = []; }
    }
  }
  const rng = mulberry32(seed ^ 0x5bd1e995);
  const pool = runs.filter(r => r[0].order === 0).length > 0 ? runs.filter(r => r[0].order === 0) : runs;
  if (pool.length === 0) {
    const vis = plan.segments.filter(s => s.visible);
    if (vis.length === 0) return null;
    return [{ ...vis[Math.floor(rng() * vis.length)], id: 0, thick: true, order: 0 }];
  }
  return pool[Math.floor(rng() * pool.length)].map((s, i) => ({ ...s, id: -(i + 1), thick: true, order: 0 }));
}

/** Rounded so sub-pixel jitter never changes the cache key (and so never re-seeds the drawing). */
export function geometryKey(geo: GrowthGeometry): string {
  const r = (v: number) => Math.round(v);
  return [r(geo.width), r(geo.height), r(geo.origin.x), r(geo.origin.y), ...geo.hidden.map(h => `${r(h.left)},${r(h.top)},${r(h.right)},${r(h.bottom)}`)].join('|');
}

/**
 * The plan for lap `lap` (0-based) of this page in this geometry. Every lap sprouts at the page centre, from its own
 * seed. Plans are memoised (per page seed + geometry), so this costs one plan per lap per geometry.
 */
const memo = new Map<string, LapPlan>();
export function lapPlan(geo: GrowthGeometry, pageSeed: string, lap: number): LapPlan {
  const gk = geometryKey(geo);
  const key = `${pageSeed}#${lap}#${gk}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const plan = planLap(geo, hashSeed(`${pageSeed}:lap:${lap}`), null);
  if (memo.size > 24) memo.clear(); // a long session on many pages: drop the cache rather than grow it forever
  memo.set(key, plan);
  return plan;
}
