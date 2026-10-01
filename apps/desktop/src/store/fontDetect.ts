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
// cross the old 1.35 ratio. Fixed browserless (no canvas in this environment to re-render with); the live 12-family
// fixture now lives IN `scripts/harness/item207b.mjs` itself (no longer only the S0 probe) so Batch Eight's real box
// run is the check that confirms this rather than a second unverified guess.
//
// THE NEW SIGNAL: sample the stem's ink width at SEVEN heights spread across the whole glyph (10%..90%, never the
// top/bottom few percent where AA and hinting are noisiest) and compare the WIDEST sample to the NARROWEST. A serif
// letterform's defining shape is flared ends around a narrower stem — max/min is large. A sans letterform's stem
// stays close to one width top to bottom — max/min stays near 1. Seven samples median away a single noisy row far
// better than one top-vs-one-mid pair ever could.
const SERIF_SAMPLE_FRACTIONS = [0.10, 0.25, 0.40, 0.50, 0.60, 0.75, 0.90];

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
  const widths = SERIF_SAMPLE_FRACTIONS.map((f) => rowInk(first + Math.round(h * f))).filter((w) => w > 0);
  if (widths.length === 0) return null;
  return { min: Math.min(...widths), max: Math.max(...widths) };
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
