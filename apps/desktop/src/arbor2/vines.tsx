// ARBOR v2 MOCKUP - THE RHIZOME AS VINES (r19, spec draft 35 §18.1 F; r20 the full growth; r21 the reach curve, spec §18.6 Judgement 2, and the
// page-relative plan, Fable Nov 4: "the rhizome must NEVER reshape when a menu opens: plan in page-relative coordinates (seed + words only)").
// Arbor's own presentation behind RhizomeField's seam: the shared growth plan (store/rhizomeGrowth.ts) gives each stem its SHAPE - its turns, its
// branches, where they join - planned in fixed page-relative units (RhizomeField's CANON geometry, never the screen's), so nothing on screen can
// reshape it. This module gives each stem its LENGTH and how much of it SHOWS:
//   main stems (~10: the plan's 7 and, r20, turned copies set into the widest open angles - every choice a hash of a stem id, the same seed draws
//     the same vines) grow from the page's hidden centre. Each is scaled about the centre so its end lands, along its own direction, short of the
//     room's edge: a side stem (within 45 deg of left or right) 60-150 px short of the rail or the window's edge, an up or down stem 20-60 px short
//     of the top bar or the window's bottom. The room is the rail's right edge, the bar's bottom and the window (RhizomeField's `room`), so the
//     length scales with the window and never runs under the rail or the bar.
//   reach (§18.6): p = this lap's words / its goal; stem i in growth order starts at t0 = 0.27 i/(N-1) and shows full x ease(clamp((p - t0)/(1 - t0)))
//     of itself, ease(x) = x^0.75 (at 52/60 every stem at ~86-90%).
//   branches (levels 2 and 3 of the spec: here 1 and 2) leave their parent at its join point as the parent's tip passes it, each 35-60% of the
//     parent's full length, growing as the parent completes: reach = clamp((parent's reach - join) / (1 - join)).
//   widths: main ~9-11 px at the centre (a lap from an earlier tip: 4.2), w = w0 (1 - t)^1.6 along the stem's full length; a branch 55-80% of its
//     parent's width where it leaves (<= 4.2); the growing end narrows to a point over 8 px; strength follows width, fill-opacity .2 -> .65.
// A lap grown from an earlier shoot's tip (§8b) keeps the plan's shape at one scale for the whole lap. The kept laps and the flash draw whole.
// Cost: a stem's screen geometry is computed once per plan and room; its pieces are cached by the length that shows, so a word redraws only the
// stems that grew, and a letter (or the whole flash) redraws nothing (memoised). Colours, the flash layer and the swap are CSS. Nothing is stored.
import { memo } from 'react';
import type { GrowthGeometry, GrowthSegment, LapPlan } from '../store/rhizomeGrowth';

const TAPER = 1.6, TIP_PX = 8, MAX_BRANCH = 4.2, PIECE = 5, T0_MAX = 0.27, EASE = 0.75, MAIN_TARGET = 10, DEG = Math.PI / 180;
type Pt = { x: number; y: number };
export type Room = { cx: number; cy: number; left: number; right: number; top: number; bottom: number };
// a stem as planned (canonical units) and its family
type Stem = { stem: number; level: 0 | 1 | 2; pts: Pt[]; seg: number[]; order: number; derived?: boolean; parent?: Stem; joinI?: number; ratioPick: number; marginPick: number; lenPick: number };
// a stem on the screen
type Drawn = { s: Stem; pts: Pt[]; arc: number[]; total: number; w0: number; ratio: number | null; joinU: number; t0: number };

const hash01 = (n: number) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const arcOf = (pts: Pt[]) => { const a = [0]; for (let i = 1; i < pts.length; i++) a.push(a[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return a; };
const turn = (p: Pt, o: Pt, a: number): Pt => { const c = Math.cos(a), si = Math.sin(a), dx = p.x - o.x, dy = p.y - o.y; return { x: o.x + dx * c - dy * si, y: o.y + dx * si + dy * c }; };
const widthAt = (d: Drawn, arc: number) => d.w0 * Math.pow(Math.max(0, 1 - arc / Math.max(1e-6, d.total)), TAPER);
const ease = (x: number) => Math.pow(Math.max(0, Math.min(1, x)), EASE);
const pointAt = (d: Drawn, len: number): { p: Pt; i: number } => {
  const L = Math.max(0, Math.min(d.total, len)); let i = 1; while (i < d.arc.length - 1 && d.arc[i] < L) i++;
  const a = d.arc[i - 1], b = d.arc[i], u = b > a ? (L - a) / (b - a) : 0;
  return { p: { x: d.pts[i - 1].x + (d.pts[i].x - d.pts[i - 1].x) * u, y: d.pts[i - 1].y + (d.pts[i].y - d.pts[i - 1].y) * u }, i };
};

// ---- the family, from the plan (canonical; once per plan) ----
const familyCache = new WeakMap<LapPlan, Stem[]>();
function familyOf(plan: LapPlan, geo: GrowthGeometry): Stem[] {
  const hit = familyCache.get(plan); if (hit) return hit;
  const by = new Map<number, { segs: GrowthSegment[]; idx: number[] }>();
  plan.segments.forEach((s, i) => { let e = by.get(s.stem); if (!e) { e = { segs: [], idx: [] }; by.set(s.stem, e); } e.segs.push(s); e.idx.push(i); });
  const n = Math.max(1, plan.segments.length);
  const stems: Stem[] = [];
  for (const [stem, { segs, idx }] of by) {
    stems.push({ stem, level: segs[0].order === 0 ? 0 : 1, pts: [{ x: segs[0].x1, y: segs[0].y1 }, ...segs.map((s) => ({ x: s.x2, y: s.y2 }))], seg: idx, order: idx[0] / n,
      ratioPick: hash01(stem + 7919), marginPick: hash01(stem + 4441), lenPick: hash01(stem + 2203) });
  }
  // a branch's parent: the main stem through its first point, and where on it
  const at = new Map<string, { s: Stem; i: number }>();
  for (const s of stems) if (s.level === 0) s.pts.forEach((p, i) => at.set(`${p.x},${p.y}`, { s, i }));
  for (const s of stems) if (s.level === 1) { const p = at.get(`${s.pts[0].x},${s.pts[0].y}`); if (p) { s.parent = p.s; s.joinI = p.i; } }
  // r20: more main stems, each a turned copy (with its branches) set into the widest open angle, until ~10 stand
  const o = geo.origin;
  const mains = stems.filter((s) => s.level === 0 && s.pts.length > 3);
  const angle = (s: Stem) => { const p = s.pts[Math.min(s.pts.length - 1, 3)]; return Math.atan2(p.y - o.y, p.x - o.x); };
  let id = 1e6;
  const placed = mains.map(angle);
  for (let k = 0; mains.length && placed.length < MAIN_TARGET && k < MAIN_TARGET; k++) {
    const sorted = [...placed].sort((a, b) => a - b);
    let gap = -1, from = 0;
    sorted.forEach((a, i) => { const b = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 2 * Math.PI; if (b - a > gap) { gap = b - a; from = a; } });
    const target = from + gap * (0.42 + 0.16 * hash01(k + 31));
    const src = mains.reduce((best, m) => { const dd = Math.abs(Math.atan2(Math.sin(angle(m) - target), Math.cos(angle(m) - target))); return dd < best.d ? { m, d: dd } : best; }, { m: mains[0], d: Infinity }).m;
    const rot = Math.atan2(Math.sin(target - angle(src)), Math.cos(target - angle(src)));
    const copy: Stem = { ...src, stem: id++, pts: src.pts.map((p) => turn(p, o, rot)), derived: true, marginPick: hash01(id + 11), lenPick: hash01(id + 13) };
    stems.push(copy); placed.push(target);
    for (const b of stems.filter((x) => x.level === 1 && x.parent === src)) stems.push({ ...b, stem: id++, pts: b.pts.map((p) => turn(p, o, rot)), derived: true, parent: copy });
  }
  // the third level: off each branch long enough, one twig from ~45% along (its own tail, turned 25-60 deg)
  for (const b of stems.filter((s) => s.level === 1 && s.pts.length >= 6)) {
    const i = Math.floor((b.pts.length - 1) * 0.45);
    const side = hash01(b.stem + 97) < 0.5 ? -1 : 1, a = side * (25 + 35 * hash01(b.stem + 131)) * DEG;
    const tail = b.pts.slice(i, i + Math.max(3, Math.round((b.pts.length - i) * 0.6)));
    stems.push({ stem: id++, level: 2, pts: tail.map((p) => turn(p, b.pts[i], a)), seg: b.seg.slice(i, i + tail.length - 1), order: b.order, derived: true, parent: b, joinI: i,
      ratioPick: hash01(b.stem + 173), marginPick: 0, lenPick: hash01(b.stem + 191) });
  }
  familyCache.set(plan, stems);
  return stems;
}

// ---- on the screen (once per plan and room) ----
const drawnCache = new WeakMap<LapPlan, Map<string, Map<Stem, Drawn>>>();
function drawnOf(plan: LapPlan, geo: GrowthGeometry, room: Room, fromTip: boolean): Map<Stem, Drawn> {
  const key = `${Math.round(room.cx)},${Math.round(room.cy)},${Math.round(room.left)},${Math.round(room.right)},${Math.round(room.top)},${Math.round(room.bottom)},${fromTip ? 1 : 0}`;
  let byRoom = drawnCache.get(plan); if (!byRoom) { byRoom = new Map(); drawnCache.set(plan, byRoom); }
  const hit = byRoom.get(key); if (hit) return hit;
  const fam = familyOf(plan, geo), o = geo.origin, C = { x: room.cx, y: room.cy };
  const out = new Map<Stem, Drawn>();
  // one scale for a lap grown from a tip (it keeps the plan's shape whole); the centred lap scales each main stem to the room
  const half = Math.max(1, Math.min(room.cx - room.left, room.right - room.cx));
  const g = half / Math.max(1, geo.width / 2);
  const mains = fam.filter((s) => s.level === 0).sort((a, b) => a.order - b.order);
  const longMains = mains.filter((s) => s.pts.length > 3);
  const t0Of = new Map<Stem, number>(); longMains.forEach((s, i) => t0Of.set(s, longMains.length > 1 ? (T0_MAX * i) / (longMains.length - 1) : 0));
  const mk = (s: Stem, pts: Pt[], w0: number, ratio: number | null, joinU: number, t0: number) => { const arc = arcOf(pts); const d: Drawn = { s, pts, arc, total: arc[arc.length - 1], w0, ratio, joinU, t0 }; out.set(s, d); return d; };
  for (const s of mains) {
    let pts: Pt[];
    const end = s.pts[s.pts.length - 1], dx0 = end.x - o.x, dy0 = end.y - o.y, dist = Math.hypot(dx0, dy0);
    if (fromTip || dist < 1 || s.pts.length <= 3) pts = s.pts.map((p) => ({ x: C.x + (p.x - o.x) * g, y: C.y + (p.y - o.y) * g }));
    else {
      const ux = dx0 / dist, uy = dy0 / dist;
      let L: number;
      if (Math.abs(ux) >= Math.abs(uy)) { const limit = ux < 0 ? C.x - room.left : room.right - C.x; L = (limit - (60 + 90 * s.marginPick)) / Math.abs(ux); }
      else { const limit = uy < 0 ? C.y - room.top : room.bottom - C.y; L = (limit - (20 + 40 * s.marginPick)) / Math.abs(uy); }
      // scaled from its own start (just past the hidden centre), so every main stem still radiates from the centre
      const s0 = s.pts[0], f = Math.max(40, L - Math.hypot(s0.x - o.x, s0.y - o.y)) / Math.max(1, Math.hypot(end.x - s0.x, end.y - s0.y));
      pts = s.pts.map((p) => ({ x: C.x + (s0.x - o.x) + (p.x - s0.x) * f, y: C.y + (s0.y - o.y) + (p.y - s0.y) * f }));
    }
    mk(s, pts, fromTip ? MAX_BRANCH : 9 + 2 * hash01(s.stem), null, 0, t0Of.get(s) ?? 0);
  }
  // branches, then twigs: each from its parent's drawn point at the join, 35-60% of the parent's full length
  for (const level of [1, 2] as const) {
    for (const s of fam.filter((x) => x.level === level)) {
      const par = s.parent ? out.get(s.parent) : undefined;
      if (!par) continue;
      const joinU = par.arc[Math.min(par.arc.length - 1, s.joinI ?? 0)] / Math.max(1e-6, par.total);
      const start = pointAt(par, joinU * par.total).p;
      const L = (0.35 + 0.25 * s.lenPick) * par.total;
      const a0 = s.pts[0], e = s.pts[s.pts.length - 1], dd = Math.max(1, Math.hypot(e.x - a0.x, e.y - a0.y));
      const f = L / dd;
      const wp = Math.max(widthAt(par, joinU * par.total), widthAt(par, par.total * 0.9));
      const w0 = Math.min(MAX_BRANCH, (0.55 + 0.25 * s.ratioPick) * wp);
      mk(s, s.pts.map((p) => ({ x: start.x + (p.x - a0.x) * f, y: start.y + (p.y - a0.y) * f })), w0, wp > 0 ? Math.round((w0 / wp) * 1000) / 1000 : null, joinU, 0);
    }
  }
  byRoom.set(key, out);
  if (byRoom.size > 8) byRoom.delete(byRoom.keys().next().value as string);
  return out;
}

// a Catmull-Rom point between p1 and p2 at u
const cr = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const u2 = u * u, u3 = u2 * u;
  return {
    x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
    y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
  };
};
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
function through(ps: Pt[], first: 'M' | 'L'): string {
  let d = `${first}${f1(ps[0].x)} ${f1(ps[0].y)}`;
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }, c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(p2.x)} ${f1(p2.y)}`;
  }
  return d;
}

type Piece = { d: string; fo: number; head: boolean };
const pieceCache = new WeakMap<Drawn, Map<number, Piece[]>>();
/** The stem drawn up to `len` px of its full length: pieces of PIECE segments, each a closed tapered shape. */
function piecesOf(dw: Drawn, len: number): Piece[] {
  const key = Math.round(len * 2) / 2;
  let m = pieceCache.get(dw); if (!m) { m = new Map(); pieceCache.set(dw, m); }
  const hit = m.get(key); if (hit) return hit;
  const out: Piece[] = [];
  const whole = key >= dw.total - 0.25;
  const endAt = pointAt(dw, key);
  const P = [...dw.pts.slice(0, endAt.i), endAt.p];
  const A = arcOf(P);
  const last = P.length - 1;
  if (last >= 1 && key > 0.5) {
    const dense: { p: Pt; w: number }[] = [];
    for (let i = 0; i < last; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(last, i + 2)];
      for (const u of [0, 1 / 3, 2 / 3]) {
        const p = u === 0 ? p1 : cr(p0, p1, p2, p3, u);
        const a = A[i] + (A[i + 1] - A[i]) * u;
        const tip = whole ? 1 : Math.min(1, (key - a) / TIP_PX);
        dense.push({ p, w: widthAt(dw, a) * tip });
      }
    }
    dense.push({ p: P[last], w: whole ? widthAt(dw, dw.total) : 0 });
    const L: Pt[] = [], R: Pt[] = [];
    for (let j = 0; j < dense.length; j++) {
      const a = dense[Math.max(0, j - 1)].p, b = dense[Math.min(dense.length - 1, j + 1)].p;
      let nx = -(b.y - a.y), ny = b.x - a.x; const ln = Math.hypot(nx, ny) || 1; nx /= ln; ny /= ln;
      const h = dense[j].w / 2;
      L.push({ x: dense[j].p.x + nx * h, y: dense[j].p.y + ny * h }); R.push({ x: dense[j].p.x - nx * h, y: dense[j].p.y - ny * h });
    }
    for (let a = 0; a < last; a += PIECE) {
      const from = a * 3, to = Math.min(dense.length - 1, (a + PIECE) * 3);
      const l = L.slice(from, to + 1), r = R.slice(from, to + 1).reverse();
      let wsum = 0; for (let j = from; j <= to; j++) wsum += dense[j].w;
      const wm = wsum / (to - from + 1);
      out.push({ d: `${through(l, 'M')}${through(r, 'L')}Z`, fo: Math.round((0.2 + 0.45 * Math.min(1, wm / 4)) * 1000) / 1000, head: a === 0 });
    }
  }
  m.set(key, out);
  return out;
}

const r1 = (v: number) => Math.round(v * 10) / 10;
const Stems = memo(function Stems({ plan, geo, room, p, fromTip }: { plan: LapPlan; geo: GrowthGeometry; room: Room; p: number; fromTip: boolean }) {
  const drawn = drawnOf(plan, geo, room, fromTip);
  const reach = new Map<Stem, number>();
  const reachOf = (d: Drawn): number => {
    const got = reach.get(d.s); if (got != null) return got;
    let r: number;
    if (d.s.level === 0) r = p >= 1 ? 1 : (d.s.pts.length <= 3 ? 1 : ease((p - d.t0) / (1 - d.t0)));
    else { const par = d.s.parent ? drawn.get(d.s.parent) : undefined; const rp = par ? reachOf(par) : 0; r = Math.max(0, Math.min(1, (rp - d.joinU) / Math.max(1e-6, 1 - d.joinU))); }
    reach.set(d.s, r); return r;
  };
  return (
    <>
      {[...drawn.values()].map((d) => {
        const r = reachOf(d);
        const len = r * d.total;
        if (len <= 0.5) return null;
        const tip = pointAt(d, len).p, end = d.pts[d.pts.length - 1];
        return piecesOf(d, len).map((pc, i) => (
          <path key={`${d.s.stem}:${i}`} className="arbor2-vine" d={pc.d} fillOpacity={pc.fo} data-stem={d.s.stem}
            {...(pc.head ? { 'data-level': d.s.level, 'data-w0': Math.round(d.w0 * 100) / 100, 'data-x0': r1(d.pts[0].x), 'data-y0': r1(d.pts[0].y),
              'data-ratio': d.ratio ?? undefined, 'data-derived': d.s.derived ? 'true' : undefined, 'data-t0': d.s.level === 0 ? Math.round(d.t0 * 1000) / 1000 : undefined,
              'data-reach': Math.round(r * 1000) / 1000, 'data-full': r1(d.total), 'data-ex': r1(end.x), 'data-ey': r1(end.y), 'data-vx': r1(tip.x), 'data-vy': r1(tip.y),
              'data-join': d.s.level > 0 ? Math.round(d.joinU * 1000) / 1000 : undefined, 'data-parent': d.s.parent ? d.s.parent.stem : undefined } : {})} />
        ));
      })}
    </>
  );
});

/** The vines: the laps before this one (whole), then this lap at progress p (0..1; the flash draws it whole). `geo` is the plan's canonical
 *  geometry; `room` the screen's (the page's centre, the rail's right edge, the bar's bottom, the window). Memoised: a letter redraws nothing. */
export const ArborVines = memo(function ArborVines({ plan, past, geo, room, p, fromTip }: { plan: LapPlan | null; past: LapPlan[]; geo: GrowthGeometry; room: Room; p: number; fromTip: boolean }) {
  return (
    <g className="arbor2-vines">
      {past.length > 0 && (
        <g className="arbor2-vines-past">
          {past.map((pl, v) => <Stems key={v} plan={pl} geo={geo} room={room} p={1} fromTip={v > 0} />)}
        </g>
      )}
      {plan && <Stems plan={plan} geo={geo} room={room} p={p} fromTip={fromTip} />}
    </g>
  );
});
