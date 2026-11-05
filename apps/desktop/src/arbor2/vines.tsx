// ARBOR v2 MOCKUP, r19 - THE RHIZOME AS VINES (spec draft 35 §18.1 F; handoff-FABLE-arbor-r19.md; Fable's ruling 4: Arbor's own presentation
// behind RhizomeField's seam - the growth rules and storage stay shared). This module only DRAWS: it reads the plan RhizomeField already
// holds (store/rhizomeGrowth.ts: each shoot is a chain of segments sharing a `stem`, in growth order; `order` 0 = a main stem, 1 = a branch)
// and the count of segments shown (k), and draws each stem as ONE FILLED, TAPERED SHAPE along a smooth curve:
//   main stems    ~9-11 px at the page's hidden centre (a lap that grows from an earlier shoot's tip starts at 4.2), width = w0 * (1 - t)^1.6
//                 along the stem's whole planned length, so a stem is still ~4 px where it leaves the page and ends in a fine tip;
//   branches      leave their parent at 55-80% of its width there, never wider than 4.2 px; the same taper along their own length;
//   the growing   end of a stem narrows to a point over its last 8 px, so a vine grows a tip, never a cut end;
//   strength      follows width: fill-opacity .2 (finest) -> .65 (healthy, >= 4 px), drawn in short pieces along each stem.
// The curve: the stem's points (its segment ends) through Catmull-Rom, both edges offset by half the width and written as cubic Beziers, closed.
// Cost: a stem's geometry is computed once per plan; a stem's piece paths are cached by how many of its segments show, so a keystroke redraws
// only the stems that grew. Colours, the flash and the swap are CSS (styles/arbor-v2.css). Nothing is stored.
import { memo } from 'react';
import type { GrowthGeometry, GrowthSegment, LapPlan } from '../store/rhizomeGrowth';

const TAPER = 1.6, TIP_PX = 8, MAX_BRANCH = 4.2, PIECE = 5;
type Pt = { x: number; y: number };
type Stem = { stem: number; level: 0 | 1 | 2; pts: Pt[]; arc: number[]; total: number; seg: number[]; w0: number; ratio: number | null; under: boolean; order: number; derived?: boolean };

const hash01 = (n: number) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const under = (geo: GrowthGeometry, p: Pt) => geo.hidden.some((r) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom);
const widthAt = (s: Stem, arc: number) => s.w0 * Math.pow(Math.max(0, 1 - arc / Math.max(1e-6, s.total)), TAPER);

const stemCache = new WeakMap<LapPlan, Stem[]>();
function stemsOf(plan: LapPlan, geo: GrowthGeometry, fromTip: boolean): Stem[] {
  const hit = stemCache.get(plan); if (hit) return hit;
  const by = new Map<number, { segs: GrowthSegment[]; idx: number[] }>();
  plan.segments.forEach((s, i) => { let e = by.get(s.stem); if (!e) { e = { segs: [], idx: [] }; by.set(s.stem, e); } e.segs.push(s); e.idx.push(i); });
  const n = Math.max(1, plan.segments.length);
  const stems: Stem[] = [];
  for (const [stem, { segs, idx }] of by) {
    const pts: Pt[] = [{ x: segs[0].x1, y: segs[0].y1 }, ...segs.map((s) => ({ x: s.x2, y: s.y2 }))];
    const arc = [0]; for (let i = 1; i < pts.length; i++) arc.push(arc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    stems.push({ stem, level: segs[0].order === 0 ? 0 : 1, pts, arc, total: arc[arc.length - 1], seg: idx, w0: 0, ratio: null, under: under(geo, pts[0]), order: idx[0] / n });
  }
  // widths: main stems from the core; branches from their parent's width where they leave it
  const at = new Map<string, { s: Stem; arc: number }>();
  for (const s of stems) if (s.level === 0) s.pts.forEach((p, i) => at.set(`${p.x},${p.y}`, { s, arc: s.arc[i] }));
  for (const s of stems) if (s.level === 0) s.w0 = fromTip ? MAX_BRANCH : 9 + 2 * hash01(s.stem);
  for (const s of stems) if (s.level === 1) {
    const p = at.get(`${s.pts[0].x},${s.pts[0].y}`);
    const wp = p ? widthAt(p.s, p.arc) : MAX_BRANCH / 0.7;
    const want = (0.55 + 0.25 * hash01(s.stem + 7919)) * wp;
    s.w0 = Math.min(MAX_BRANCH, want);
    s.ratio = wp > 0 ? Math.round((s.w0 / wp) * 1000) / 1000 : null;
  }
  derive(stems, geo, at);
  stemCache.set(plan, stems);
  return stems;
}

// r20 - THE FULL GROWTH, DERIVED (Fable's ruling 2; spec draft 35 §18.1 F: ~10 main stems from the page's hidden centre, branching to three
// levels). The shared plan grows 7 main stems with one level of branches; this drawing adds, from that plan alone (no new randomness - every choice
// is a hash of a stem id, so the same seed draws the same vines):
//   more main stems - each a turned copy of a neighbour (and its branches) set into the widest open angle around the centre, until ~10 stand;
//   a third level   - off each branch long enough, one sub-branch: the branch's own tail from ~45% along, turned 25-60 deg and cut to 60%,
//                     at 55-80% of the branch's width there (<= 4.2 px).
// Every derived stem grows with the segments it was copied from (their place in the plan), so it appears as they do; nothing is stored.
const MAIN_TARGET = 10, DEG = Math.PI / 180;
const turn = (p: Pt, o: Pt, a: number): Pt => { const c = Math.cos(a), si = Math.sin(a), dx = p.x - o.x, dy = p.y - o.y; return { x: o.x + dx * c - dy * si, y: o.y + dx * si + dy * c }; };
const arcOf = (pts: Pt[]) => { const a = [0]; for (let i = 1; i < pts.length; i++) a.push(a[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return a; };
function derive(stems: Stem[], geo: GrowthGeometry, at: Map<string, { s: Stem; arc: number }>): void {
  const o = geo.origin;
  const mains = stems.filter((s) => s.level === 0 && s.pts.length > 3);
  const angle = (s: Stem) => { const p = s.pts[Math.min(s.pts.length - 1, 3)]; return Math.atan2(p.y - o.y, p.x - o.x); };
  const parentOf = (b: Stem) => at.get(`${b.pts[0].x},${b.pts[0].y}`)?.s;
  const branches = stems.filter((s) => s.level === 1);
  let id = 1e6;
  const placed = mains.map(angle);
  for (let k = 0; mains.length && placed.length < MAIN_TARGET && k < MAIN_TARGET; k++) {
    // the widest open angle around the centre
    const sorted = [...placed].sort((a, b) => a - b);
    let gap = -1, from = 0;
    sorted.forEach((a, i) => { const b = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 2 * Math.PI; if (b - a > gap) { gap = b - a; from = a; } });
    const target = from + gap * (0.42 + 0.16 * hash01(k + 31));
    // the neighbour whose direction is nearest, turned into it
    const src = mains.reduce((best, m) => { const d = Math.abs(Math.atan2(Math.sin(angle(m) - target), Math.cos(angle(m) - target))); return d < best.d ? { m, d } : best; }, { m: mains[0], d: Infinity }).m;
    const rot = Math.atan2(Math.sin(target - angle(src)), Math.cos(target - angle(src)));
    const pts = src.pts.map((p) => turn(p, o, rot));
    const arc = arcOf(pts);
    const copy: Stem = { ...src, stem: id++, pts, arc, total: arc[arc.length - 1], w0: src.w0 >= 4.2 + 1e-6 ? 9 + 2 * hash01(id) : src.w0, under: under(geo, pts[0]), derived: true };
    stems.push(copy); placed.push(target);
    for (const b of branches) if (parentOf(b) === src) {
      const bp = b.pts.map((p) => turn(p, o, rot)); const ba = arcOf(bp);
      stems.push({ ...b, stem: id++, pts: bp, arc: ba, total: ba[ba.length - 1], under: under(geo, bp[0]), derived: true });
    }
  }
  // the third level, off every branch (the plan's and the derived) long enough to carry one
  for (const b of stems.filter((s) => s.level === 1 && s.pts.length >= 6)) {
    const i = Math.floor((b.pts.length - 1) * 0.45);
    const side = hash01(b.stem + 97) < 0.5 ? -1 : 1, a = side * (25 + 35 * hash01(b.stem + 131)) * DEG;
    const tail = b.pts.slice(i, i + Math.max(3, Math.round((b.pts.length - i) * 0.6)));
    const pts = tail.map((p) => turn(p, b.pts[i], a)); const arc = arcOf(pts);
    const wp = widthAt(b, b.arc[i]);
    const w0 = Math.min(MAX_BRANCH, (0.55 + 0.25 * hash01(b.stem + 173)) * wp);
    stems.push({ stem: id++, level: 2, pts, arc, total: arc[arc.length - 1], seg: b.seg.slice(i, i + pts.length - 1), w0, ratio: wp > 0 ? Math.round((w0 / wp) * 1000) / 1000 : null, under: under(geo, pts[0]), order: b.order, derived: true });
  }
}

// a Catmull-Rom point between p1 and p2 at u, with p0 / p3 as neighbours
const cr = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const u2 = u * u, u3 = u2 * u;
  return {
    x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
    y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
  };
};
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
// a smooth path through points (Catmull-Rom as cubic Beziers); `first` = how it begins ('M' or 'L')
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
const pieceCache = new WeakMap<Stem, Map<number, Piece[]>>();
/** The stem drawn up to `vis` of its segments: pieces of PIECE segments, each a closed tapered shape. */
function piecesOf(s: Stem, vis: number): Piece[] {
  let m = pieceCache.get(s); if (!m) { m = new Map(); pieceCache.set(s, m); }
  const hit = m.get(vis); if (hit) return hit;
  const out: Piece[] = [];
  const last = Math.min(vis, s.pts.length - 1);
  if (last >= 1) {
    // the smooth centre line, sampled 3 times per segment, with its width (the taper, narrowed over the growing end)
    const P = s.pts, endArc = s.arc[last];
    const dense: { p: Pt; w: number; seg: number }[] = [];
    for (let i = 0; i < last; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(last, i + 2)];
      for (const u of [0, 1 / 3, 2 / 3]) {
        const p = u === 0 ? p1 : cr(p0, p1, p2, p3, u);
        const a = s.arc[i] + (s.arc[i + 1] - s.arc[i]) * u;
        const tip = vis < s.pts.length - 1 ? Math.min(1, (endArc - a) / TIP_PX) : 1;
        dense.push({ p, w: widthAt(s, a) * tip, seg: i });
      }
    }
    dense.push({ p: P[last], w: vis < s.pts.length - 1 ? 0 : widthAt(s, endArc), seg: last });
    const L: Pt[] = [], R: Pt[] = [];
    for (let j = 0; j < dense.length; j++) {
      const a = dense[Math.max(0, j - 1)].p, b = dense[Math.min(dense.length - 1, j + 1)].p;
      let nx = -(b.y - a.y), ny = b.x - a.x; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const h = dense[j].w / 2;
      L.push({ x: dense[j].p.x + nx * h, y: dense[j].p.y + ny * h }); R.push({ x: dense[j].p.x - nx * h, y: dense[j].p.y - ny * h });
    }
    // pieces along the stem (PIECE segments each), sharing their boundary sample
    for (let a = 0; a < last; a += PIECE) {
      const from = a * 3, to = Math.min(dense.length - 1, (a + PIECE) * 3);
      const l = L.slice(from, to + 1), r = R.slice(from, to + 1).reverse();
      let wsum = 0; for (let j = from; j <= to; j++) wsum += dense[j].w;
      const wm = wsum / (to - from + 1);
      out.push({ d: `${through(l, 'M')}${through(r, 'L')}Z`, fo: Math.round((0.2 + 0.45 * Math.min(1, wm / 4)) * 1000) / 1000, head: a === 0 });
    }
  }
  m.set(vis, out);
  return out;
}

const Stems = memo(function Stems({ plan, geo, k, fromTip }: { plan: LapPlan; geo: GrowthGeometry; k: number; fromTip: boolean }) {
  const stems = stemsOf(plan, geo, fromTip);
  return (
    <>
      {stems.map((s) => {
        let vis = 0; while (vis < s.seg.length && s.seg[vis] < k) vis++;
        if (!vis) return null;
        return piecesOf(s, vis).map((pc, i) => (
          <path key={`${s.stem}:${i}`} className="arbor2-vine" d={pc.d} fillOpacity={pc.fo} style={{ ['--vo' as string]: s.order.toFixed(3) }}
            {...(pc.head ? { 'data-level': s.level, 'data-w0': Math.round(s.w0 * 100) / 100, 'data-x0': Math.round(s.pts[0].x * 10) / 10, 'data-y0': Math.round(s.pts[0].y * 10) / 10,
              'data-ratio': s.ratio ?? undefined, 'data-under': s.under ? 'true' : undefined, 'data-derived': s.derived ? 'true' : undefined } : {})} />
        ));
      })}
    </>
  );
});

/** The vines: the laps before this one (whole), then this lap up to k segments. r20 (the 150b cost, latency turn 2026-11-05T03:09-03:25Z: +10 ms a key
 *  in the flash): memoised - a keystroke that changes nothing they draw (every letter between growth steps, the whole flash) re-renders neither copy. */
export const ArborVines = memo(function ArborVines({ plan, past, geo, k, fromTip }: { plan: LapPlan | null; past: LapPlan[]; geo: GrowthGeometry; k: number; fromTip: boolean }) {
  return (
    <g className="arbor2-vines">
      {past.length > 0 && (
        <g className="arbor2-vines-past">
          {past.map((pl, v) => <Stems key={v} plan={pl} geo={geo} k={pl.segments.length} fromTip={v > 0} />)}
        </g>
      )}
      {plan && <Stems plan={plan} geo={geo} k={k} fromTip={fromTip} />}
    </g>
  );
});
