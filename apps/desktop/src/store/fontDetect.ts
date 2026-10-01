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

// ITEM 207b — box turn 2026-09-30, MEASURED DEFECT: the original two-row (top-vs-mid) version of this test read
// Verdana and Tahoma as serif against the live probe's twelve known Windows families (10/12 correct, 2 wrong). A
// single sample row near the very top edge of the glyph is exactly where anti-aliasing is noisiest — both fonts are
// humanist sans faces with no real serif, but a stray half-pixel of AA at the cap start was apparently enough to
// cross the old 1.35 ratio.
//
// BATCH EIGHT'S PAIR, THE CONFIRMING RUN, FOUND THE FIRST FIX WRONG IN THE OTHER DIRECTION: the 10%..90% sampling
// band deliberately dodged the top/bottom few percent to avoid that AA noise — but a capital I's serif feet are
// THEMSELVES only the first/last several percent of the glyph's height, so the fix skipped past the very flare it
// was supposed to detect. Times New Roman, Georgia, Cambria and Palatino Linotype all read as sans-serif (1/22
// failed, deploy8b-parked's `item207b.mjs` run on `batch-eight` @ 9c8d5c3). Noise and signal share the same narrow
// band at the glyph's edge; the fix needs both, not a choice between them.
//
// THE SIGNAL NOW: AVERAGE several rows across each window instead of sampling a single one. A foot window (the
// first/last ~12% of the glyph, where a real serif's flare lives) and a stem window (the center ~16%, where every
// letterform — serif or sans — is at its narrowest and most stable) are each averaged over every ink-bearing row
// inside them. Averaging a dozen rows dilutes one stray AA pixel the way a single top row never could, while still
// measuring INSIDE the foot rather than past it — so a real flare (even a short one) still shows up in the mean.
function stemWidthSpread(stack: string): { min: number; max: number } | null {
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
  const avgInBand = (fromF: number, toF: number) => {
    const fromY = first + Math.round(h * fromF);
    const toY = first + Math.round(h * toF);
    const vals: number[] = [];
    for (let y = fromY; y <= toY; y += 1) { const w = rowInk(y); if (w > 0) vals.push(w); }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const topFoot = avgInBand(0, 0.12);
  const bottomFoot = avgInBand(0.88, 1);
  const stem = avgInBand(0.42, 0.58);
  if (stem <= 0) return null;
  return { min: stem, max: Math.max(topFoot, bottomFoot) };
}

/** The class of an INSTALLED family, measured. Monospace: 'i' and 'W' advance alike. Serif: a capital I's stem varies
 *  much more across its height than a sans one does (flared serif ends around a narrower stem). Anything else is
 *  sans-serif (a display or script face is a judgement call and lands here). */
export function classifyGeneric(name: string): FaceGeneric {
  const stack = `${q(name)}, 'Wrizo Absent Family'`;
  const wi = width(stack, 'iiiiiiiiii'); const wW = width(stack, 'WWWWWWWWWW');
  if (wi > 0 && Math.abs(wi - wW) < 0.5) return 'monospace';
  const s = stemWidthSpread(stack);
  if (s && s.min > 0 && s.max / s.min > 1.6) return 'serif';
  return 'sans-serif';
}
