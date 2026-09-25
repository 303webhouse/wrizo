// ITEM 207b — DEVICE FONTS: the two questions a font NAME cannot answer by itself, answered by drawing.
//   1. Is this family installed on THIS device?   (a page dressed in a font from another machine must say so, quietly.)
//   2. What CLASS is it - serif, sans-serif or monospace?   (the stored `generic` is what makes a fallback faithful in kind:
//      a missing serif falls back to a serif. Local Font Access returns names and styles, never a class.)
// Both are canvas measurements, so they need a DOM and run only in the browser; the classes are re-measured against known
// fonts by the S0 probe (scripts/harness/item207b-s0-probe.mjs) before anything trusts them.
//
// PRIVACY: nothing here enumerates fonts. Each call asks about ONE name the writer already chose (or a page already names).
import type { FaceGeneric } from '../types';

let canvas: HTMLCanvasElement | null = null;
const ctx = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null;
  if (!canvas) canvas = document.createElement('canvas');
  return canvas.getContext('2d', { willReadFrequently: true });
};
const q = (n: string) => `'${n.replace(/['\\]/g, '')}'`;

/** Advance width of `text` in a font stack at 72px. */
function width(stack: string, text: string): number {
  const c = ctx(); if (!c) return 0;
  c.font = `72px ${stack}`;
  return c.measureText(text).width;
}

/** True when `name` resolves to an installed (or already-loaded) font: it draws differently from every bare generic. The
 *  classic test - a missing family falls through to the generic, so the widths match; an installed one does not. */
export function isFontAvailable(name: string): boolean {
  if (typeof document === 'undefined' || !name) return false;
  const probe = 'mmmmmmmmmmlliWW@#0123456789';
  for (const base of ['monospace', 'serif', 'sans-serif']) {
    if (Math.abs(width(`${q(name)}, ${base}`, probe) - width(base, probe)) > 0.01) return true;
  }
  return false;
}

/** Ink width of a horizontal band of a capital I, drawn in `stack`. A slab/bracket serif widens the top and bottom of the I. */
function inkBandWidths(stack: string): { top: number; mid: number } | null {
  const c = ctx(); if (!c || !canvas) return null;
  canvas.width = 240; canvas.height = 240;
  c.clearRect(0, 0, 240, 240);
  c.fillStyle = '#000'; c.font = `150px ${stack}`; c.textBaseline = 'alphabetic';
  c.fillText('I', 90, 190);
  const img = c.getImageData(0, 0, 240, 240).data;
  const rowInk = (y: number) => { let lo = 240, hi = -1; for (let x = 0; x < 240; x += 1) { if (img[(y * 240 + x) * 4 + 3] > 128) { if (x < lo) lo = x; if (x > hi) hi = x; } } return hi < 0 ? 0 : hi - lo + 1; };
  let first = -1; let last = -1;
  for (let y = 0; y < 240; y += 1) { if (rowInk(y) > 0) { if (first < 0) first = y; last = y; } }
  if (first < 0 || last - first < 20) return null;
  const h = last - first;
  return { top: rowInk(first + Math.round(h * 0.04)), mid: rowInk(first + Math.round(h * 0.5)) };
}

/** The class of an INSTALLED family, measured. Monospace: 'i' and 'W' advance alike. Serif: the capital I is much wider at
 *  its top than at its middle. Anything else is sans-serif (a display or script face is a judgement call and lands here). */
export function classifyGeneric(name: string): FaceGeneric {
  const stack = `${q(name)}, 'Wrizo Absent Family'`;
  const wi = width(stack, 'iiiiiiiiii'); const wW = width(stack, 'WWWWWWWWWW');
  if (wi > 0 && Math.abs(wi - wW) < 0.5) return 'monospace';
  const b = inkBandWidths(stack);
  if (b && b.mid > 0 && b.top / b.mid > 1.35) return 'serif';
  return 'sans-serif';
}
