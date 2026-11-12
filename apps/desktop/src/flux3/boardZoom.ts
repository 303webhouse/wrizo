// FLUX ZOOM, STEP 1 - THE CAMERA'S STATE (the Wrizors' spec claude/wrizors/flux-zoom-step1.md; Nick, Nov 11): ONE scale for the whole Schema (a board in Flux, behind ?flux3=1).
// SESSION ONLY: nothing here is saved, and a board does not remember its scale (spec guard 7): the scale is 1 whenever no Schema is mounted, and the Schema puts it back to 1 when it
// goes. Every other theme and every other surface reads 1 here, so the board's pointer maths (which divides by it) is unchanged for them.
// The pure parts (the limits, the readout's figure, the pinch and notch maths) live here so the browserless check can run the real functions.
import { useSyncExternalStore } from 'react';

/** The inner limit (spec §2): one card roughly fills the stage. Past it lies the code show (a later slice, not built). */
export const ZOOM_IN_MAX = 4;
/** The outer limit never goes below this, however big the board (spec §2). */
export const ZOOM_OUT_FLOOR = 0.1;
/** The share of the stage's shorter side the whole board fills at the outer limit (spec §2). */
export const ZOOM_OUT_FILL = 0.6;
/** One key notch (spec §3). */
export const ZOOM_NOTCH = 1.25;

let scale = 1;
const subs = new Set<() => void>();
export const getBoardScale = (): number => scale;
export function subscribeBoardScale(fn: () => void): () => void { subs.add(fn); return () => { subs.delete(fn); }; }
/** Set the scale exactly (the caller has clamped it); listeners run in the order they subscribed. */
export function setBoardScale(next: number): void {
  if (!(next > 0) || next === scale) return;
  scale = next;
  for (const f of [...subs]) f();
}
// THE WAY HOME (Nick, Nov 11): the camera registers what Ctrl + 0 does (glide to true size about the centre); the footer's ZOOM readout asks for it. One door, one act: a click is Ctrl + 0.
let home: (() => void) | null = null;
export function registerZoomHome(fn: () => void): () => void { home = fn; return () => { if (home === fn) home = null; }; }
export function zoomHome(): void { home?.(); }
export function useBoardScale(): number { return useSyncExternalStore(subscribeBoardScale, getBoardScale, getBoardScale); }

/** The outer limit (spec §2): the whole board - its longer side - fills 60% of the stage's shorter side; never below 0.10, and never above true size (1.00). */
export function outerLimit(stageW: number, stageH: number, boardW: number, boardH: number): number {
  const longest = Math.max(boardW, boardH), shorter = Math.min(stageW, stageH);
  if (!(longest > 0) || !(shorter > 0)) return 1;
  return Math.min(1, Math.max(ZOOM_OUT_FLOOR, (ZOOM_OUT_FILL * shorter) / longest));
}
/** A scale held between the two limits (the camera simply stops at a limit: no bounce). */
export function clampScale(s: number, out: number): number { return Math.min(ZOOM_IN_MAX, Math.max(out, s)); }

/** A wheel-with-Ctrl step (or a trackpad pinch, which arrives as the same event): a mouse notch is large (about 100), a pinch's deltas are small. Returns the multiplier. */
export function wheelFactor(deltaY: number): number { return Math.exp(-deltaY * (Math.abs(deltaY) >= 50 ? 0.0015 : 0.01)); }

/** The readout's figure in the mockup's own form (spec §4): a number times a power of ten. 1 -> 1.00 x 10^0; 0.25 -> 2.50 x 10^-1; 4 -> 4.00 x 10^0. */
export function zoomFigure(s: number): { mant: string; exp: number } {
  if (!(s > 0)) return { mant: '1.00', exp: 0 };
  let exp = Math.floor(Math.log10(s) + 1e-12);
  let mant = Math.round((s / Math.pow(10, exp)) * 100) / 100;
  if (mant >= 10) { mant /= 10; exp += 1; }
  return { mant: mant.toFixed(2), exp };
}
/** The same figure as text (the exponent with a true minus sign), for the checks. */
export function zoomText(s: number): string {
  const { mant, exp } = zoomFigure(s);
  return `${mant}×10${exp < 0 ? '−' : ''}${Math.abs(exp)}`;
}
