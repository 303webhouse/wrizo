// J9 — journal ink rendering. Pure, dependency-free, and isolated: ALL painting
// goes through renderStroke(), so perfect-freehand (or any smoother) can drop in
// here later without touching the capture/persist wiring. One pen — colour and
// width are render-time constants read from the paper's ink token, never stored
// per stroke (J8 keeps strokes as pure geometry).
import type { Stroke } from '../types';

export const INK_LINE_WIDTH = 2.2; // medium; constant for v1 (pressure may modulate later)

// The one pen reads the paper's ink token, not a hard-coded hex.
export function inkColor(): string {
  if (typeof getComputedStyle === 'undefined') return '#2B2014';
  const v = getComputedStyle(document.documentElement).getPropertyValue('--ink-on-paper').trim();
  return v || '#2B2014';
}

// Render one stroke. Points are stored normalized (0..1 by the sheet's width);
// denormalize by the current sheet width — the same scale on both axes — so a
// circle stays a circle at any width. Smoothing: quadratic midpoints through the
// polyline. A single-point stroke renders as a dot.
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  sheetW: number,
  color: string,
  lineWidth: number = INK_LINE_WIDTH,
): void {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
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
}
