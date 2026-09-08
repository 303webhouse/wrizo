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
