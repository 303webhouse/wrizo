// M2 — the Rhizome's pure growth engine (docs/wrizo-alpha/m2-rhizome-brief.md,
// S2). Framework-free — no React import — so the exact same code drives the
// live component (components/RhizomeField.tsx) and is exercised directly by
// the harness through the `window.__wrizoRhizomeEngine` test seam at the
// bottom of this file (the SAME "expose a seam, read the canonical source
// live" pattern store/deskLexicon.ts's own `window.wrizoDeskLexicon` already
// established) — determinism is proved against the real algorithm, never a
// hand-copied re-implementation in the harness script.
//
// ZERO SCHEMA, ZERO NEW DEPS (the brief's own constitution): the PRNG below
// is a tiny in-repo mulberry32-class generator, ~10 lines, no package.

// ---- Seed -------------------------------------------------------------

// mulberry32 — a small, fast, well-known 32-bit PRNG. Deterministic: the same
// seed always produces the same infinite sequence of draws in (0, 1).
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A tiny FNV-1a-shaped string hash — folds an arbitrary seed KEY (entry id +
// session start, S2's own words) into the 32-bit integer mulberry32 wants.
// No dependency; ~6 lines.
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---- Shape --------------------------------------------------------------

export interface RhizomeSegment {
  id: number;
  shootId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // A segment born from the milestone burst (S4) — the component uses this
  // only to stagger-mount it; the engine itself treats it identically to any
  // other segment (forward-only, never removed, still counts toward the cap).
  burst?: boolean;
}

interface ShootTip {
  id: number;
  x: number;
  y: number;
  angle: number; // degrees, screen coords (0 = +x, 90 = +y/down)
}

export interface RhizomeRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RhizomeGeometry {
  width: number; // the field's own clip box (the desk stage's measured size)
  height: number;
  paper: RhizomeRect; // avoided absolutely — see growOne's own comment
}

export interface RhizomePoint {
  x: number;
  y: number;
}

export interface RhizomeState {
  segments: RhizomeSegment[];
  shoots: ShootTip[];
  nextSegmentId: number;
  nextShootId: number;
  eventIndex: number; // total growth events observed, grown or quiet (S2 decay)
}

export function createRhizomeState(): RhizomeState {
  return { segments: [], shoots: [], nextSegmentId: 0, nextShootId: 0, eventIndex: 0 };
}

// ---- Constants (S2's own exact numbers) ----------------------------------

export const SEG_MIN = 8;
export const SEG_MAX = 16;
export const DRIFT_DEG = 40; // direction drift, +/- per segment
export const CAP_SEGMENTS = 600;
export const CAP_SHOOTS = 24;
export const BAND_1 = 200; // under this many total segments: every event grows
export const BAND_2 = 400; // 200-400: every 2nd event grows
// 400-600: every 4th event grows; >=600 (CAP_SEGMENTS): hard stop.
export const BRANCH_CHANCE = 0.2; // ~20% branch a new shoot; ~80% extend
export const STAGE_PAD = 3; // px kept clear of the stage's own outer edge

// The rate (1 grown segment per N events) for the CURRENT total segment
// count — the decay schedule (S2/S5): "every event grows to 200 segments;
// every 2nd to 400; every 4th to 600; hard stop at 600."
function bandRate(totalSegments: number): number {
  if (totalSegments < BAND_1) return 1;
  if (totalSegments < BAND_2) return 2;
  return 4;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function inRect(x: number, y: number, r: RhizomeRect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

// Sample a handful of points along the candidate segment (not just its
// endpoint) so a short stroke can never tunnel THROUGH a corner of the
// paper's rect between two clean endpoints.
function segmentTouchesRect(x1: number, y1: number, x2: number, y2: number, r: RhizomeRect): boolean {
  const STEPS = 6;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    if (inRect(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r)) return true;
  }
  return false;
}

// Clamp a point to the stage's own inner bounds — an absolute, unconditional
// backstop (independent of whatever reflection math ran before it) so a
// segment can never exit the stage, full stop.
function clampToStage(p: RhizomePoint, geo: RhizomeGeometry): RhizomePoint {
  return {
    x: Math.max(STAGE_PAD, Math.min(geo.width - STAGE_PAD, p.x)),
    y: Math.max(STAGE_PAD, Math.min(geo.height - STAGE_PAD, p.y)),
  };
}

// Reflect a candidate point off whichever stage edge(s) it crossed — a real
// bounce (mirrors the angle), not a clip. Returns the reflected point AND the
// angle it implies, so the shoot's own tip keeps a physically coherent
// heading rather than snapping.
function reflectOffStage(tip: RhizomePoint, angleDeg: number, len: number, geo: RhizomeGeometry): { point: RhizomePoint; angle: number } {
  let a = angleDeg;
  let p = { x: tip.x + len * Math.cos(toRad(a)), y: tip.y + len * Math.sin(toRad(a)) };
  if (p.x < STAGE_PAD || p.x > geo.width - STAGE_PAD) {
    a = 180 - a;
    p = { x: tip.x + len * Math.cos(toRad(a)), y: tip.y + len * Math.sin(toRad(a)) };
  }
  if (p.y < STAGE_PAD || p.y > geo.height - STAGE_PAD) {
    a = -a;
    p = { x: tip.x + len * Math.cos(toRad(a)), y: tip.y + len * Math.sin(toRad(a)) };
  }
  return { point: clampToStage(p, geo), angle: a };
}

// Push a point directly away from the paper rect's own center, from an
// ALREADY-EXTERIOR tip. For a convex region (an axis-aligned rect always is)
// a point moving further along the ray from the region's center through an
// exterior point stays exterior — a guaranteed escape, not a probabilistic
// one. Used only as the final fallback when reflection alone still lands
// inside the paper's rect (e.g. a tip already hugging its edge).
function pushAwayFromPaper(tip: RhizomePoint, len: number, r: RhizomeRect, geo: RhizomeGeometry): { point: RhizomePoint; angle: number } {
  const cx = (r.left + r.right) / 2;
  const cy = (r.top + r.bottom) / 2;
  let dx = tip.x - cx;
  let dy = tip.y - cy;
  const mag = Math.hypot(dx, dy) || 1;
  dx /= mag;
  dy /= mag;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const point = clampToStage({ x: tip.x + dx * len, y: tip.y + dy * len }, geo);
  return { point, angle };
}

// Resolve ONE candidate segment (tip -> a proposed angle/length) against
// BOTH avoidances the brief names — paper-rect and stage-edge — "clamped by
// reflection, never clipped mid-stroke." Returns null only in the
// vanishingly rare case neither reflection nor the guaranteed paper-escape
// push can find a legal point (kept as an explicit, honest "skip this
// event's growth" rather than ever emitting an invalid segment — the paper's
// rect is inviolate, absolutely, not merely usually).
function resolveSegment(tip: RhizomePoint, angleDeg: number, len: number, geo: RhizomeGeometry): { point: RhizomePoint; angle: number } | null {
  let { point, angle } = reflectOffStage(tip, angleDeg, len, geo);
  if (segmentTouchesRect(tip.x, tip.y, point.x, point.y, geo.paper)) {
    const pushed = pushAwayFromPaper(tip, len, geo.paper, geo);
    point = pushed.point;
    angle = pushed.angle;
    // One more stage clamp/reflect pass — pushing away from the paper can, at
    // the extreme, aim back toward a stage edge.
    const reflected = reflectOffStage(tip, angle, len, geo);
    if (!segmentTouchesRect(tip.x, tip.y, reflected.point.x, reflected.point.y, geo.paper)) {
      point = reflected.point;
      angle = reflected.angle;
    } else if (segmentTouchesRect(tip.x, tip.y, point.x, point.y, geo.paper)) {
      // Both attempts still land in the paper's rect (tip pinned in a
      // corner) — honest skip, no invalid segment ever emitted.
      return null;
    }
  }
  return { point, angle };
}

// ---- The growth step ------------------------------------------------------

// One growth EVENT — the SAME unit the bar already consumes (S2). Returns a
// NEW state only when a segment is actually added; a "quiet" event under the
// decay schedule, or one that arrives once the hard cap is already reached,
// returns the SAME state reference untouched (cheap no-op, and forward-only
// by construction — nothing here ever removes or edits an existing segment).
// `origin` roots the very first shoot (S2: "the first event always roots the
// origin shoot") — the progress row's own measured midpoint.
export function growOne(state: RhizomeState, rng: () => number, geo: RhizomeGeometry, origin: RhizomePoint): RhizomeState {
  const eventIndex = state.eventIndex + 1;
  const total = state.segments.length;
  if (total >= CAP_SEGMENTS) return { ...state, eventIndex };

  const rate = bandRate(total);
  if (eventIndex % rate !== 0) return { ...state, eventIndex };

  const isFirstEver = state.shoots.length === 0;
  const branch = !isFirstEver && state.shoots.length < CAP_SHOOTS && rng() < BRANCH_CHANCE;

  let tip: RhizomePoint;
  let angle: number;
  let shootId: number;
  let nextShootId = state.nextShootId;
  let newShoot: ShootTip | null = null;

  if (isFirstEver) {
    tip = origin;
    angle = rng() * 360;
    shootId = nextShootId++;
  } else if (branch) {
    const from = state.segments[Math.floor(rng() * state.segments.length)];
    tip = { x: from.x2, y: from.y2 };
    angle = rng() * 360;
    shootId = nextShootId++;
  } else {
    const s = state.shoots[Math.floor(rng() * state.shoots.length)];
    tip = { x: s.x, y: s.y };
    angle = s.angle + (rng() * 2 - 1) * DRIFT_DEG;
    shootId = s.id;
  }

  const len = SEG_MIN + rng() * (SEG_MAX - SEG_MIN);
  const resolved = resolveSegment(tip, angle, len, geo);
  if (!resolved) return { ...state, eventIndex }; // honest skip — see resolveSegment's own comment

  const segment: RhizomeSegment = {
    id: state.nextSegmentId,
    shootId,
    x1: tip.x, y1: tip.y, x2: resolved.point.x, y2: resolved.point.y,
  };
  if (isFirstEver || branch) {
    newShoot = { id: shootId, x: resolved.point.x, y: resolved.point.y, angle: resolved.angle };
  }

  const shoots = newShoot
    ? [...state.shoots, newShoot]
    : state.shoots.map(s => (s.id === shootId ? { ...s, x: resolved.point.x, y: resolved.point.y, angle: resolved.angle } : s));

  return {
    segments: [...state.segments, segment],
    shoots,
    nextSegmentId: state.nextSegmentId + 1,
    nextShootId,
    eventIndex,
  };
}

// Apply `n` growth events in sequence (a thin convenience wrapper so both
// the component and the harness can say "grow 40 events" in one call).
export function growMany(state: RhizomeState, rng: () => number, geo: RhizomeGeometry, origin: RhizomePoint, n: number): RhizomeState {
  let s = state;
  for (let i = 0; i < n; i++) s = growOne(s, rng, geo, origin);
  return s;
}

// S4 — the milestone burst: +COUNT segments, extending random LIVE shoots
// only (never branching new ones — "staggered across live shoots," the
// brief's own words), still honoring the hard 600-segment cap, bypassing the
// decay-rate bands (the burst is the celebration itself, not an ordinary
// event). Returns the new state AND the list of newly-added segments alone
// (marked `burst:true`) so the component can stagger their mount without
// re-diffing the whole array.
export function burstSegments(state: RhizomeState, rng: () => number, geo: RhizomeGeometry, count: number): { state: RhizomeState; added: RhizomeSegment[] } {
  let s = state;
  const added: RhizomeSegment[] = [];
  for (let i = 0; i < count; i++) {
    if (s.segments.length >= CAP_SEGMENTS || s.shoots.length === 0) break;
    const shootIdx = Math.floor(rng() * s.shoots.length);
    const tip = s.shoots[shootIdx];
    const angle = tip.angle + (rng() * 2 - 1) * DRIFT_DEG;
    const len = SEG_MIN + rng() * (SEG_MAX - SEG_MIN);
    const resolved = resolveSegment({ x: tip.x, y: tip.y }, angle, len, geo);
    if (!resolved) continue;
    const segment: RhizomeSegment = {
      id: s.nextSegmentId, shootId: tip.id,
      x1: tip.x, y1: tip.y, x2: resolved.point.x, y2: resolved.point.y, burst: true,
    };
    added.push(segment);
    s = {
      ...s,
      segments: [...s.segments, segment],
      shoots: s.shoots.map(sh => (sh.id === tip.id ? { ...sh, x: resolved.point.x, y: resolved.point.y, angle: resolved.angle } : sh)),
      nextSegmentId: s.nextSegmentId + 1,
    };
  }
  return { state: s, added };
}

// ---- Test seam --------------------------------------------------------
// Mirrors store/deskLexicon.ts's own `window.wrizoDeskLexicon` pattern: the
// harness proves determinism and the decay/cap schedule against the REAL
// algorithm above, not a hand-copied re-implementation.
if (typeof window !== 'undefined') {
  (window as unknown as { __wrizoRhizomeEngine?: unknown }).__wrizoRhizomeEngine = {
    mulberry32, hashSeed, createRhizomeState, growOne, growMany, burstSegments,
    CAP_SEGMENTS, CAP_SHOOTS, BAND_1, BAND_2,
  };
}
