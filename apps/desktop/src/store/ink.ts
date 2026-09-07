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
  lineWidth: number = stroke.eraser ? ERASER_WIDTH : INK_LINE_WIDTH,
): void {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  ctx.save();
  // ITEM 121 I1 — the stroke's OWN ink when it named one, else the caller's
  // default pen. An erase deliberately skips this: J2 paints it
  // `destination-out`, where only the alpha matters and the hue is irrelevant,
  // and an eraser has no ink of its own (nor tip, nor nib) by ruling.
  const paint = stroke.eraser ? color : strokeColor(stroke, color);
  if (stroke.eraser) ctx.globalCompositeOperation = 'destination-out';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = paint;

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
  for (const stroke of strokes) {
    const lw = stroke.eraser
      ? Math.max(0.4, (ERASER_WIDTH / INK_LINE_WIDTH) * (1.3 / scale))
      : Math.max(0.4, 1.3 / scale);
    renderStroke(ctx, stroke, 1, ink, lw);
  }
  ctx.restore();
}
