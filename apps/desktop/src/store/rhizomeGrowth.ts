// RHIZOME GROWTH (Fable, 2026-10-08) — the goal rhizome's whole growth model, pure and deterministic.
//
// Nick's rules, in the order the code honours them:
//   1. Coverage tracks the goal. At fraction f of the writer's goal, about f of the visible ground is covered; at the goal,
//      the ground is full. (planLap grows a whole lap up front and records coverage after every segment; segmentsFor()
//      shows the shortest prefix that reaches f of the lap's final coverage.)
//   2. Growth always comes from the existing network. Every segment starts at the end of an earlier segment (a stem tip
//      extending) or at an earlier segment's end point (a side branch). No free-standing origins after the first.
//   3. Stems, not scratches. Each step is short (STEP_MIN..STEP_MAX px) and turns only a little from the one before
//      (MAX_TURN plus a small wander), so a root is a chain of short, gently curving steps.
//   4. One network, both margins. Roots grow BEHIND the page, right up to its edge, and are never drawn over it. Growth
//      may pass under the page and the chrome (the "hidden" rects): it keeps growing there but those cells are never
//      counted and the field's paint clip hides the strokes, so a root dives under the page and comes up on the far side.
//   5. Laps. At the goal the whole network flashes brass, then everything clears except ONE stem segment, drawn thick. The
//      next lap grows only from that survivor.
//
// Nothing here touches the DOM. RhizomeField.tsx measures the geometry and renders; this file decides what grows.

export interface Rect { left: number; top: number; right: number; bottom: number }

export interface GrowthGeometry {
  width: number;
  height: number;
  /** Where growth may pass but is never painted or counted: the sheet (roots grow behind it, never over it), the rail, the strip, the header. */
  hidden: Rect[];
  /** A point near which the very first segment of the first lap starts (the page's bottom-centre). */
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
  /** How many leading segments are the lap's starting stroke (the survivor), shown even at 0% of the goal. */
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
export const FULL_COVER = 0.86;    // a lap ends when this share of the visible cells is covered
export const LAP_CAP = 4200;       // hard cap on segments per lap (safety)
export const MIN_TIPS = 4;         // keep at least this many growing tips
export const MAX_TIPS = 8;         // and never more than this
export const SPLIT_CHANCE = 0.05;  // per step on open ground: a tip also throws a side branch here
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

function cellCentre(g: Grid, k: number): { x: number; y: number } {
  return { x: ((k % g.cols) + 0.5) * CELL, y: (Math.floor(k / g.cols) + 0.5) * CELL };
}

// ---- one lap ---------------------------------------------------------------------------------------------------------
interface Tip { x: number; y: number; angle: number; order: number; stem: number; stuck: number }

function nearestVisiblePoint(g: Grid, x: number, y: number): { x: number; y: number } {
  let best = { x, y }, bd = Infinity;
  for (let k = 0; k < g.visible.length; k++) {
    if (!g.visible[k]) continue;
    const p = cellCentre(g, k);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

function inStage(geo: GrowthGeometry, x: number, y: number): boolean {
  return x >= EDGE_PAD && y >= EDGE_PAD && x <= geo.width - EDGE_PAD && y <= geo.height - EDGE_PAD;
}

// How inviting the ground is in direction `a` from (x, y): open visible cells ahead pull hardest, hidden ground (under the
// page) pulls a little (so a stem will tunnel when its own side is full), covered ground and the stage edge not at all.
function openness(geo: GrowthGeometry, g: Grid, x: number, y: number, a: number): number {
  let score = 0;
  for (const spread of [-0.28, 0, 0.28]) {
    const ca = Math.cos(a + spread), sa = Math.sin(a + spread);
    for (let j = 1; j <= LOOK; j++) {
      const px = x + ca * j * CELL * 0.8, py = y + sa * j * CELL * 0.8;
      const wj = 1 / j;
      if (!inStage(geo, px, py)) { score -= wj; break; }
      const c = Math.floor(px / CELL), r = Math.floor(py / CELL);
      const k = r * g.cols + c;
      if (g.visible[k]) score += g.covered[k] ? 0 : wj;
      else score += HIDDEN_PULL * wj;
    }
  }
  return score;
}

/**
 * Grow one whole lap. `start` is the previous lap's surviving stroke (null on the first lap). The same (geo, seed, start)
 * always yields the same plan, so a resize or a reload replays it exactly.
 */
export function planLap(geo: GrowthGeometry, seed: number, start: GrowthSegment[] | null): LapPlan {
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

  const tips: Tip[] = [];
  if (start && start.length > 0) {
    const stem = nextStem++;
    for (const s of start) push(s.x1, s.y1, s.x2, s.y2, 0, stem, true);
    const first = start[0], last = start[start.length - 1];
    tips.push({ x: last.x2, y: last.y2, angle: Math.atan2(last.y2 - last.y1, last.x2 - last.x1), order: 0, stem: nextStem++, stuck: 0 });
    tips.push({ x: first.x1, y: first.y1, angle: Math.atan2(first.y1 - first.y2, first.x1 - first.x2), order: 0, stem: nextStem++, stuck: 0 });
  } else {
    const o = nearestVisiblePoint(g, geo.origin.x, geo.origin.y);
    // The first stroke lies along the ground (left to right, with a little tilt), and its two ends become the two main stems,
    // one heading for each margin.
    const a0 = (rng() - 0.5) * 0.5;
    const len = STEP_MIN + rng() * (STEP_MAX - STEP_MIN);
    const x1 = Math.min(geo.width - EDGE_PAD, Math.max(EDGE_PAD, o.x - (Math.cos(a0) * len) / 2));
    const y1 = Math.min(geo.height - EDGE_PAD, Math.max(EDGE_PAD, o.y - (Math.sin(a0) * len) / 2));
    const x2 = Math.min(geo.width - EDGE_PAD, Math.max(EDGE_PAD, o.x + (Math.cos(a0) * len) / 2));
    const y2 = Math.min(geo.height - EDGE_PAD, Math.max(EDGE_PAD, o.y + (Math.sin(a0) * len) / 2));
    push(x1, y1, x2, y2, 0, nextStem++, true);
    tips.push({ x: x2, y: y2, angle: a0, order: 0, stem: nextStem++, stuck: 0 });
    tips.push({ x: x1, y: y1, angle: a0 + Math.PI, order: 0, stem: nextStem++, stuck: 0 });
  }
  const firstCount = segments.length;

  const goal = Math.ceil(g.visibleCount * FULL_COVER);
  let guard = 0;
  while (g.coveredCount < goal && segments.length < LAP_CAP && guard++ < LAP_CAP * 4) {
    const lagging = (() => {
      const f0 = g.sideVisible[0] ? g.sideCovered[0] / g.sideVisible[0] : 1, f1 = g.sideVisible[1] ? g.sideCovered[1] / g.sideVisible[1] : 1;
      const side = f0 < f1 ? 0 : 1;
      return Math.abs(f0 - f1) > 0.06 && !tips.some(t => (t.x < g.midX ? 0 : 1) === side) ? side : -1;
    })();
    if (tips.length < MIN_TIPS || (lagging >= 0 && tips.length < MAX_TIPS)) {
      const from = branchPoint(g, segments, rng, nextStem, lagging);
      if (from) { tips.push(from); nextStem++; }
      else if (tips.length === 0) break;
    }

    // Each tip's best heading, and how inviting it is. Tips on open ground get most of the turns.
    const heads = tips.map(t => {
      let bestA = t.angle, bestS = -Infinity;
      for (let i = 0; i < 7; i++) {
        const a = t.angle + (-1 + (2 * i) / 6) * MAX_TURN;
        const sc = openness(geo, g, t.x, t.y, a) - 0.05 * Math.abs(i - 3); // a slight preference for going straight
        if (sc > bestS) { bestS = sc; bestA = a; }
      }
      return { a: bestA, s: bestS };
    });
    // Keep the two margins growing together: tips on the side that is behind get more of the turns.
    const frac = [0, 1].map(i => (g.sideVisible[i] ? g.sideCovered[i] / g.sideVisible[i] : 1));
    let total = 0;
    const w = heads.map((h, i) => {
      const side = tips[i].x < g.midX ? 0 : 1;
      const lag = Math.max(0.25, 1 + 3 * (frac[1 - side] - frac[side]));
      const v = Math.max(0.08, h.s) * lag;
      total += v;
      return v;
    });
    let pick = rng() * total, ti = 0;
    while (ti < w.length - 1 && pick > w[ti]) { pick -= w[ti]; ti++; }
    const tip = tips[ti];
    let angle = heads[ti].a;

    if (heads[ti].s <= 0.05) {
      // Nothing open nearby: head for the nearest open ground (under the page if need be), turning no faster than a stem can.
      tip.stuck++;
      const k = nearestOpen(g, tip.x, tip.y);
      if (k < 0) break;
      const p = cellCentre(g, k);
      const want = Math.atan2(p.y - tip.y, p.x - tip.x);
      angle = tip.angle + Math.max(-MAX_TURN, Math.min(MAX_TURN, angleDiff(tip.angle, want)));
    } else {
      tip.stuck = 0;
    }
    angle += gauss(rng) * WANDER;
    const len = STEP_MIN + rng() * (STEP_MAX - STEP_MIN);
    let nx = tip.x + Math.cos(angle) * len, ny = tip.y + Math.sin(angle) * len;
    if (!inStage(geo, nx, ny)) {
      angle = tip.angle + (rng() < 0.5 ? -1 : 1) * MAX_TURN * 2; // turn away from the edge
      nx = tip.x + Math.cos(angle) * len; ny = tip.y + Math.sin(angle) * len;
      if (!inStage(geo, nx, ny)) { tips.splice(ti, 1); continue; }
    }
    push(tip.x, tip.y, nx, ny, tip.order, tip.stem, tip.order === 0);
    tip.x = nx; tip.y = ny; tip.angle = angle;

    // A stem on open ground throws side branches now and then; a branch stuck in covered ground for long retires.
    if (tips.length < MAX_TIPS && heads[ti].s > 0.6 && rng() < SPLIT_CHANCE) {
      const side = rng() < 0.5 ? -1 : 1;
      const turn = BRANCH_MIN + rng() * (BRANCH_MAX - BRANCH_MIN);
      tips.push({ x: nx, y: ny, angle: angle + side * turn, order: Math.min(3, tip.order + 1), stem: nextStem++, stuck: 0 });
    }
    if (tip.stuck > 30 && tips.length > MIN_TIPS) tips.splice(tips.indexOf(tip), 1);
  }

  return { segments, coverAt, visibleCells: g.visibleCount, firstCount };
}

function nearestOpen(g: Grid, x: number, y: number): number {
  let best = -1, bd = Infinity, w = 0;
  for (let i = 0; i < g.open.length; i++) {
    const k = g.open[i];
    if (g.covered[k]) continue;
    g.open[w++] = k;
    const p = cellCentre(g, k);
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bd) { bd = d; best = k; }
  }
  g.open.length = w;
  return best;
}

/** A new tip on an existing node that has open ground nearby (a side branch), or null. */
function branchPoint(g: Grid, segments: GrowthSegment[], rng: () => number, stem: number, side = -1): Tip | null {
  const pool = side < 0 ? segments : segments.filter(s => (s.x2 < g.midX ? 0 : 1) === side);
  if (pool.length === 0) return null;
  let best: GrowthSegment | null = null, bestOpen = -1;
  for (let i = 0; i < 24; i++) {
    const s = pool[Math.floor(rng() * pool.length)];
    let open = 0;
    const c0 = Math.floor(s.x2 / CELL), r0 = Math.floor(s.y2 / CELL);
    for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++) {
      const c = c0 + dc, r = r0 + dr;
      if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) continue;
      const k = r * g.cols + c;
      if (g.visible[k] && !g.covered[k]) open++;
    }
    if (open > bestOpen) { bestOpen = open; best = s; }
  }
  if (!best) return null;
  const a = Math.atan2(best.y2 - best.y1, best.x2 - best.x1);
  const hand = rng() < 0.5 ? -1 : 1;
  const turn = BRANCH_MIN + rng() * (BRANCH_MAX - BRANCH_MIN);
  return { x: best.x2, y: best.y2, angle: a + hand * turn, order: Math.min(3, best.order + 1), stem, stuck: 0 };
}

// ---- reading a plan ----------------------------------------------------------------------------------------------------
/** How many of the lap's segments to show at goal fraction f (0..1). Coverage, not segment count, tracks the goal. */
export function segmentsFor(plan: LapPlan, f: number): number {
  const n = plan.segments.length;
  if (n === 0) return 0;
  if (f <= 0) return plan.firstCount; // the lap's starting stroke (the survivor, or the very first stem) is always there
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
 * not a speck), chosen by the seed. Drawn thick, and the next lap grows from both of its ends.
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
  return [r(geo.width), r(geo.height), ...geo.hidden.map(h => `${r(h.left)},${r(h.top)},${r(h.right)},${r(h.bottom)}`)].join('|');
}

/**
 * The plan for lap `lap` (0-based) of this page in this geometry. Lap n starts from lap n-1's survivor, so a lap is replayed
 * from the first one; plans are memoised (per page seed + geometry), so this costs one plan per lap per geometry.
 */
const memo = new Map<string, LapPlan>();
export function lapPlan(geo: GrowthGeometry, pageSeed: string, lap: number): LapPlan {
  const gk = geometryKey(geo);
  const key = `${pageSeed}#${lap}#${gk}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const start = lap > 0 ? pickSurvivor(lapPlan(geo, pageSeed, lap - 1), hashSeed(`${pageSeed}:survivor:${lap - 1}`)) : null;
  const plan = planLap(geo, hashSeed(`${pageSeed}:lap:${lap}`), start);
  if (memo.size > 24) memo.clear(); // a long session on many pages: drop the cache rather than grow it forever
  memo.set(key, plan);
  return plan;
}
