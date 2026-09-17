// J9 — journal ink rendering. Pure, dependency-free, and isolated: ALL painting
// goes through renderStroke(), so perfect-freehand (or any smoother) can drop in
// here later without touching the capture/persist wiring.
//
// ITEM 121 (I1/I5) — J8's "one pen" is superseded, and the isolation J9
// promised is what paid for it: a stroke now names its own tip, nib and ink,
// and THIS FILE IS THE ONLY PLACE THAT KNOWS WHAT ANY OF THEM LOOK LIKE.
// Nothing outside computes a colour, a width, a cap or a composite mode.
// The three fields are optional and their absence is the entire migration —
// `pen · regular · the theme's default ink` is exactly what a J8 stroke has
// always rendered as, so no existing page moves a pixel. Unknown values coerce
// to those same defaults at paint time (the read boundary IS the validation —
// see the note above tipOf below).
import type { Stroke, StrokeInk, StrokeNib, StrokeTip } from '../types';

export const INK_LINE_WIDTH = 1.4; // thin
export const ERASER_WIDTH = 22; // S25 pass tunes this

// ITEM 121 I1 — THE READ-SIDE DEFAULTS, and the whole of the migration.
// A stroke with no tip/nib/ink is `pen · regular · the theme's default ink`,
// which is byte-for-byte what every stroke drawn before item 121 already
// renders as. Nothing is ever written to an old stroke to make this true.
export const TIP_DEFAULT: StrokeTip = 'pen';
export const NIB_DEFAULT: StrokeNib = 'regular';
export const TIPS: readonly StrokeTip[] = ['pen', 'pencil', 'marker'];
export const NIBS: readonly StrokeNib[] = ['fine', 'regular', 'broad'];
// The desk's four inks, in the order they sit on the desk (item83-ink-pass.md
// §0.5). Order is the swatch order; the array IS the enum's roster, so a fifth
// ink is one entry here plus one token in index.css.
export const INKS: readonly StrokeInk[] = ['walnut', 'iron', 'oxblood', 'sea'];

// ITEM 121 I4 — the pen a page starts with: the defaults, which are also
// exactly what a stroke with no fields renders as, so the first stroke a
// writer ever draws is indistinguishable from every stroke drawn before this
// ticket. INKS[0] is walnut, whose token IS --ink-stroke's value.
export const INK_DEFAULT_PEN: { tip: StrokeTip; nib: StrokeNib; ink: StrokeInk } = {
  tip: TIP_DEFAULT,
  nib: NIB_DEFAULT,
  ink: INKS[0],
};

// ITEM 121 I1 — VALIDATION LIVES HERE, AT THE READ BOUNDARY, and this is a
// decision with a reason (S0 §2.3). The server does not re-validate a shape
// the client owns — its own stated law for this entire jsonb column family
// (apps/server/src/sync.ts) — so rejecting bad enums server-side would both
// contradict that law and turn a zero-schema wave into a server-behaviour
// ship. Coercing at PAINT time is strictly stronger for the property that
// actually matters: a value this build has never heard of (an older client, a
// newer one, a hand-edited row) can never mis-paint a page, it simply paints
// as the default. Every reader below goes through these three.
export function tipOf(stroke: Stroke): StrokeTip {
  return TIPS.includes(stroke.tip as StrokeTip) ? (stroke.tip as StrokeTip) : TIP_DEFAULT;
}
export function nibOf(stroke: Stroke): StrokeNib {
  return NIBS.includes(stroke.nib as StrokeNib) ? (stroke.nib as StrokeNib) : NIB_DEFAULT;
}

// Read one CSS custom property off the root, with a hard fallback for the
// no-DOM case (harness helpers, any future SSR). Shared by both readers below
// so there is exactly one place that knows how a token becomes a colour.
function token(name: string, fallback: string): string {
  if (typeof getComputedStyle === 'undefined' || typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

const DEFAULT_INK_HEX = '#1A1206';

// The default pen reads the dedicated ink-stroke token — a very dark brown,
// almost black — falling back to the text ink token, then a hard default.
// UNCHANGED by item 121, deliberately: every existing stroke paints through
// this exact path, which is why no old page moves a pixel.
export function inkColor(): string {
  if (typeof getComputedStyle === 'undefined') return '#1A1206';
  const root = getComputedStyle(document.documentElement);
  const v = root.getPropertyValue('--ink-stroke').trim() || root.getPropertyValue('--ink-on-paper').trim();
  return v || '#1A1206';
}

// ITEM 121 I1 — one named ink to a colour. The NAME is what pages store; this
// is the only place a name becomes a value, so a theme pack re-pointing the
// four tokens re-colours every stroke ever drawn, with no data touched.
export function inkColorOf(ink: StrokeInk): string {
  return token(`--ink-${ink}`, DEFAULT_INK_HEX);
}

// The colour a given stroke paints in: its own ink when it named one this
// build recognises, otherwise the theme's default pen (`fallback`, which every
// caller supplies as inkColor()). An unrecognised name falls to the default
// rather than to transparent — see the read-boundary note above.
export function strokeColor(stroke: Stroke, fallback: string): string {
  return INKS.includes(stroke.ink as StrokeInk) ? inkColorOf(stroke.ink as StrokeInk) : fallback;
}

// ITEM 121 I5 — TIP RENDER PROFILES, inside the isolation J9 promised.
//
// NIB WIDTHS ARE PER TIP, three constants each, because a nib is a property of
// the instrument: a broad marker and a broad pen are not the same broad. The
// one number that is NOT free is `pen · regular` — it MUST stay
// INK_LINE_WIDTH, because that is what every stroke drawn before item 121
// renders at, and an old page moving even a fraction of a pixel would falsify
// the no-migration claim this whole wave rests on.
const NIB_WIDTHS: Record<StrokeTip, Record<StrokeNib, number>> = {
  //                fine   regular             broad
  pen:    { fine: 0.9, regular: INK_LINE_WIDTH, broad: 2.4 },
  pencil: { fine: 0.8, regular: 1.15,           broad: 2.0 },
  marker: { fine: 3.2, regular: 5.4,            broad: 8.6 },
};

// How each tip lays its ink down. Alpha and composite only — the COLOUR is
// always the stroke's own ink, never the tip's, so a pencil in oxblood is
// oxblood, lighter. Nothing outside this file knows any of these numbers.
const TIP_ALPHA: Record<StrokeTip, number> = {
  pen: 1,
  // Graphite sits lighter on paper than ink does. This is also what makes
  // pencil and pen distinguishable at a glance (and samplable in the harness)
  // when their widths are close.
  pencil: 0.62,
  // A marker is translucent by nature — that translucency IS the overlap.
  marker: 0.4,
};

/**
 * ITEM 121 I5 — the painted width of a stroke, tip and nib resolved through
 * the read-boundary defaults. Exported because the thumbnail renderer needs
 * the same number, and two places computing a width independently is exactly
 * how a marker ends up thin in browse and broad on the page.
 */
export function strokeWidth(stroke: Stroke): number {
  if (stroke.eraser) return ERASER_WIDTH; // the eraser ignores tip and nib
  return NIB_WIDTHS[tipOf(stroke)][nibOf(stroke)];
}

// ITEM 126 B3/B4 — HIT-TESTING AND GROUPING, and why they live in THIS file.
//
// Item 126 lets a writer grab ink in Draft and Revise. Grabbing needs an answer
// to "is there ink under this point, and what else belongs with it" — and that
// is a question about a stroke's SHAPE, which this file has been the sole owner
// of since J9 and which I5 relied on when tips gained their own widths. A hit
// test written in the component would be a second place that knows how wide a
// marker is, and the two would drift the first time a nib changed.
//
// EVERYTHING HERE IS PURE. No DOM, no canvas, no React — the sheet's width is
// passed in. That is what lets a check call these directly with known geometry
// instead of inferring them from painted pixels.

// Forgiveness, in CSS px, added to the stroke's own half-width. A fine pen is
// 0.9px wide; without slop the writer would have to be within half a pixel of it.
// Tuned so a broad marker is still easier to hit than a fine pen — which is also
// true of paper — rather than flattening both to one fat target.
export const HIT_SLOP_PX = 7;

// The gap, in NORMALIZED units (by sheet width), within which two strokes are
// "the same drawing" for the purposes of a move. ~0.04 of a 760px measure is
// ~30px, about one line-height — close enough that a sketch's own strokes join,
// far enough that a margin note and a diagram across the page do not.
// A WORKING VALUE, NOT A LAW: grouping is DERIVED at grab time and never stored,
// so this can be re-tuned forever without touching a single saved page.
export const GROUP_GAP = 0.04;

/** Squared distance from point p to segment ab, all in the same units. */
function distSqToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const len2 = vx * vx + vy * vy;
  // A zero-length segment is a dot (a single-point stroke renders as one).
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const dx = px - (ax + t * vx), dy = py - (ay + t * vy);
  return dx * dx + dy * dy;
}

/**
 * ITEM 126 B3 — the index of the stroke under a point, or null.
 *
 * `x`/`y` are NORMALIZED (both by the sheet's WIDTH — J8's rule, and the one
 * that has already cost this lane a check that passed for the wrong reason);
 * `sheetW` converts to px so the tolerance can be expressed in px, where widths
 * and slop actually live.
 *
 * SEARCHED FROM THE TOP DOWN. Strokes paint in array order, so the LAST one is
 * the one the writer sees on top; grabbing must agree with the eyes.
 *
 * ERASERS ARE NEVER HIT. An erase carries no ink — it is a hole — and grabbing
 * a hole is not a gesture the writer can mean. They still TRAVEL with a group
 * (see strokeGroupAt), which is a different question.
 */
export function strokeAt(strokes: Stroke[], x: number, y: number, sheetW: number): number | null {
  const px = x * sheetW, py = y * sheetW;
  for (let i = strokes.length - 1; i >= 0; i--) {
    const st = strokes[i];
    if (st.eraser) continue;
    const pts = st.points;
    if (!pts || pts.length === 0) continue;
    const tol = strokeWidth(st) / 2 + HIT_SLOP_PX;
    const tol2 = tol * tol;
    if (pts.length === 1) {
      const dx = px - pts[0].x * sheetW, dy = py - pts[0].y * sheetW;
      if (dx * dx + dy * dy <= tol2) return i;
      continue;
    }
    for (let j = 0; j < pts.length - 1; j++) {
      if (distSqToSegment(px, py, pts[j].x * sheetW, pts[j].y * sheetW,
                          pts[j + 1].x * sheetW, pts[j + 1].y * sheetW) <= tol2) return i;
    }
  }
  return null;
}

/** A stroke's bounding box in normalized units. Null for an empty stroke. */
export function strokeBox(stroke: Stroke): { x0: number; y0: number; x1: number; y1: number } | null {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    if (p.x < x0) x0 = p.x;
    if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.y > y1) y1 = p.y;
  }
  return { x0, y0, x1, y1 };
}

/** Do two boxes come within `gap` of each other (in normalized units)? */
function boxesNear(a: { x0: number; y0: number; x1: number; y1: number },
                   b: { x0: number; y0: number; x1: number; y1: number }, gap: number): boolean {
  return a.x0 - gap <= b.x1 && b.x0 - gap <= a.x1 && a.y0 - gap <= b.y1 && b.y0 - gap <= a.y1;
}

/**
 * ITEM 126 B4 — THE STROKE GROUP: every index that should move together when
 * the writer grabs the stroke at (x, y). Null when nothing is there.
 *
 * A SPATIAL CLUSTER, grown transitively: the hit stroke, plus every ink stroke
 * whose box comes within GROUP_GAP of the growing group's, repeated until it
 * stops growing. This is what the eye calls "that drawing", and the three
 * alternatives lose for stated reasons — one-stroke-per-grab makes a sketch
 * thirty drags; all-ink-on-the-page makes a margin note unmovable; a temporal
 * run would move two annotations made in one sitting on opposite margins.
 *
 * ⚠ THE ERASER CLAUSE, and it is not optional. An erase is a stroke painted
 * `destination-out`, so it is a HOLE punched at a fixed place on the sheet. If
 * the ink moves and its erases stay behind, the rubbed-out parts REAPPEAR at the
 * old position while the ink lands at the new one — the page would grow marks
 * the writer had deliberately removed. So every erase whose box falls within the
 * assembled group's box travels WITH it. This is invisible to any check that
 * only counts strokes, which is exactly why it is written here in full.
 *
 * DERIVED, NEVER STORED. The group exists for the length of one gesture.
 */
export function strokeGroupAt(strokes: Stroke[], x: number, y: number, sheetW: number): number[] | null {
  const hit = strokeAt(strokes, x, y, sheetW);
  if (hit == null) return null;

  const boxes = strokes.map(strokeBox);
  const chosen = new Set<number>([hit]);

  // Grow over INK strokes only: an erase must not be able to bridge two
  // drawings that are otherwise strangers.
  let grew = true;
  while (grew) {
    grew = false;
    for (let i = 0; i < strokes.length; i++) {
      if (chosen.has(i) || strokes[i].eraser) continue;
      const bi = boxes[i];
      if (!bi) continue;
      for (const j of chosen) {
        if (strokes[j].eraser) continue;
        const bj = boxes[j];
        if (bj && boxesNear(bi, bj, GROUP_GAP)) { chosen.add(i); grew = true; break; }
      }
    }
  }

  // The assembled ink box, then the eraser clause.
  let gx0 = Infinity, gy0 = Infinity, gx1 = -Infinity, gy1 = -Infinity;
  for (const i of chosen) {
    const b = boxes[i];
    if (!b) continue;
    if (b.x0 < gx0) gx0 = b.x0;
    if (b.y0 < gy0) gy0 = b.y0;
    if (b.x1 > gx1) gx1 = b.x1;
    if (b.y1 > gy1) gy1 = b.y1;
  }
  const groupBox = { x0: gx0, y0: gy0, x1: gx1, y1: gy1 };
  for (let i = 0; i < strokes.length; i++) {
    if (!strokes[i].eraser || chosen.has(i)) continue;
    const b = boxes[i];
    if (b && boxesNear(b, groupBox, 0)) chosen.add(i);
  }

  return [...chosen].sort((a, b) => a - b);
}

/** The bounding box of a set of strokes, in normalized units. */
export function groupBox(strokes: Stroke[], indices: number[]): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  let any = false;
  for (const i of indices) {
    const b = strokeBox(strokes[i]);
    if (!b) continue;
    any = true;
    if (b.x0 < x0) x0 = b.x0;
    if (b.y0 < y0) y0 = b.y0;
    if (b.x1 > x1) x1 = b.x1;
    if (b.y1 > y1) y1 = b.y1;
  }
  return any ? { x0, y0, x1, y1 } : null;
}

/**
 * ITEM 126 B4 — translate a group by (dx, dy) in normalized units, returning a
 * NEW strokes array. Pure: the caller owns when this becomes state.
 *
 * A MOVE REWRITES GEOMETRY. It deliberately does NOT add a per-group transform
 * field: that would change the stored shape for no gain and force every renderer
 * — renderStroke, renderThumbnail, the Board's box ink, anything later — to
 * learn about groups it has no other reason to know. Rewriting points keeps the
 * blob exactly as item 121 left it, so a move is zero DDL and zero migration.
 */
export function translateGroup(strokes: Stroke[], indices: number[], dx: number, dy: number): Stroke[] {
  const set = new Set(indices);
  return strokes.map((st, i) => (set.has(i)
    ? { ...st, points: st.points.map(pt => ({ ...pt, x: pt.x + dx, y: pt.y + dy })) }
    : st));
}

/**
 * ITEM 126 B4 — clamp a proposed delta so the group's box cannot leave the
 * sheet. The exact partner of FX17's bottom stop, and the same law: a limit
 * STOPS, it never relocates. `maxY` is the sheet's height in normalized units
 * (height / width), because y is normalized by WIDTH (J8).
 */
export function clampDelta(box: { x0: number; y0: number; x1: number; y1: number },
                           dx: number, dy: number, maxY: number): { dx: number; dy: number } {
  let cx = dx, cy = dy;
  if (box.x0 + cx < 0) cx = -box.x0;
  if (box.x1 + cx > 1) cx = 1 - box.x1;
  if (box.y0 + cy < 0) cy = -box.y0;
  if (box.y1 + cy > maxY) cy = maxY - box.y1;
  return { dx: cx, dy: cy };
}

// Render one stroke. Points are stored normalized (0..1 by the sheet's width);
// denormalize by the current sheet width — the same scale on both axes — so a
// circle stays a circle at any width. Smoothing: quadratic midpoints through the
// polyline. A single-point stroke renders as a dot.
// J2 — an erase is a stroke with `eraser: true`, painted with the same geometry
// under `destination-out` at ERASER_WIDTH (color's hue is irrelevant, only its
// opacity is — inkColor() is always opaque). save/restore around the composite
// state because callers (paintCommitted, renderThumbnail) loop this over mixed
// ink/erase strokes without resetting context state between calls.
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  sheetW: number,
  color: string,
  lineWidth: number = strokeWidth(stroke),
): void {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  ctx.save();
  // ITEM 121 I1 — the stroke's OWN ink when it named one, else the caller's
  // default pen. An erase deliberately skips this: J2 paints it
  // `destination-out`, where only the alpha matters and the hue is irrelevant,
  // and an eraser has no ink of its own (nor tip, nor nib) by ruling.
  const paint = stroke.eraser ? color : strokeColor(stroke, color);
  const tip = tipOf(stroke);
  if (stroke.eraser) ctx.globalCompositeOperation = 'destination-out';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = paint;
  // ITEM 121 I5 — the tip's own hand. An ERASE is exempt from every line of
  // this: it has no tip by ruling, and destination-out with a reduced alpha
  // would erase only partially, which is a rubber that does not rub.
  if (!stroke.eraser) {
    ctx.globalAlpha = TIP_ALPHA[tip];
    if (tip === 'marker') {
      // A square cap and mitred joins give the chisel end its flat edge, and
      // `multiply` is what makes two marker strokes DARKEN where they cross
      // instead of the later one simply covering the earlier. Both are state
      // the save/restore below returns, so the next stroke in the loop starts
      // clean — this file's callers paint mixed strokes without resetting.
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.globalCompositeOperation = 'multiply';
    }
  }

  const P = pts.map(p => ({ x: p.x * sheetW, y: p.y * sheetW }));
  if (P.length === 1) {
    ctx.beginPath();
    ctx.arc(P[0].x, P[0].y, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = paint;
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(P[0].x, P[0].y);
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i].x + P[i + 1].x) / 2;
    const my = (P[i].y + P[i + 1].y) / 2;
    ctx.quadraticCurveTo(P[i].x, P[i].y, mx, my);
  }
  const last = P[P.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  // ITEM 121 I5 — PENCIL'S GRAIN, the brief's "a subtle grain IF cheap", and
  // it is cheap: one extra pass over a path already built. A dash ALONE would
  // read as a dotted line, not as graphite, so the solid pass above stays and
  // this lays a finer, broken pass on top of it — continuous line, mottled
  // core, which is what tooth actually looks like. Dash lengths scale with the
  // nib so a broad pencil is not a row of beads. `restore()` below returns
  // lineDash with the rest of the state, so nothing leaks into the next
  // stroke; a smoother dropping into this file later can replace the whole
  // pass without touching capture or persistence, exactly as J9 intended.
  if (!stroke.eraser && tip === 'pencil') {
    ctx.globalAlpha = TIP_ALPHA.pencil * 0.55;
    ctx.lineWidth = lineWidth * 0.45;
    ctx.setLineDash([lineWidth * 1.9, lineWidth * 0.85]);
    ctx.stroke();
  }
  ctx.restore();
}

// Render an entry's strokes scaled to fit a small square thumbnail (J12 browse
// affordance for ink-bearing entries). Reuses renderStroke — normalized coords
// make the bbox-fit a simple transform. Cheap: one pass over the points.
export function renderThumbnail(canvas: HTMLCanvasElement, strokes: Stroke[], size: number, color?: string): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(size * dpr));
  canvas.height = Math.max(1, Math.round(size * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  // J2 — an erase sweep must not shrink the fit: exclude its points from the
  // bbox, but it still paints below (a fully-erased drawing renders as blank).
  const pts = strokes.filter(s => !s.eraser).flatMap(s => s.points);
  if (pts.length === 0) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const bw = Math.max(maxX - minX, 0.02);
  const bh = Math.max(maxY - minY, 0.02);
  const pad = size * 0.14;
  const scale = Math.min((size - 2 * pad) / bw, (size - 2 * pad) / bh);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const ink = color || inkColor();

  // Center the drawing's bbox in the box; line width kept ~constant after scale.
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  // ITEM 121 I5 — the two branches this used to have (eraser vs. ink) collapse
  // into one, because strokeWidth() already answers "how wide is this stroke"
  // for both. `1.3 / scale` is the thumbnail's own "one INK_LINE_WIDTH" unit
  // after the bbox fit, so every tip keeps its RELATIVE weight in browse: a
  // broad marker reads broad in a thumbnail exactly as it does on the page.
  // Alpha and composite come along for free — they are renderStroke's, not a
  // second copy of the profile table living out here.
  for (const stroke of strokes) {
    const lw = Math.max(0.4, (strokeWidth(stroke) / INK_LINE_WIDTH) * (1.3 / scale));
    renderStroke(ctx, stroke, 1, ink, lw);
  }
  ctx.restore();
}
