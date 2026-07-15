// J9 — journal ink rendering. Pure, dependency-free, and isolated: ALL painting
// goes through renderStroke(), so perfect-freehand (or any smoother) can drop in
// here later without touching the capture/persist wiring. One pen — colour and
// width are render-time constants read from the paper's ink token, never stored
// per stroke (J8 keeps strokes as pure geometry).
import type { Stroke } from '../types';

export const INK_LINE_WIDTH = 1.4; // thin
export const ERASER_WIDTH = 11; // S25 device pass (j2-s25-fixes S1) — ruled down from 22

// The one pen reads the dedicated ink-stroke token — a very dark brown, almost
// black — falling back to the text ink token, then a hard default.
export function inkColor(): string {
  if (typeof getComputedStyle === 'undefined') return '#1A1206';
  const root = getComputedStyle(document.documentElement);
  const v = root.getPropertyValue('--ink-stroke').trim() || root.getPropertyValue('--ink-on-paper').trim();
  return v || '#1A1206';
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
  if (stroke.eraser) ctx.globalCompositeOperation = 'destination-out';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;

  const P = pts.map(p => ({ x: p.x * sheetW, y: p.y * sheetW }));
  if (P.length === 1) {
    ctx.beginPath();
    ctx.arc(P[0].x, P[0].y, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
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
