// ITEM 171-B — moving strokes between COORDINATE BASES, named.
//
// Three bases exist (types StrokeBasis): a page's 'sheet', a board's 'canvas' and
// one card's 'box'. A stroke does not know which it is in — nothing in the blob says
// — so every place that carries strokes across a surface boundary calls one of these
// and thereby says which basis it is leaving and which it is entering. The trap this
// exists for is already on the record: penStroke's y is a fraction of HEIGHT while a
// stored StrokePoint's y is normalized by WIDTH; mixing them samples empty canvas and
// lets a check pass for the wrong reason.
//
// PURE and dependency-free (type imports only), like ink.ts, so it is testable
// without a browser. Every stroke field rides through by SPREAD, never rebuilt by
// hand — the census that cleared `eraserWidth` found every existing copy site
// spreads, and this file must not be the first to break that.
//
// WHAT DOES NOT RESCALE: a stroke's painted width (nib width, or an eraser's
// eraserWidth) is CSS px and stays px across a basis change, exactly as
// persistence.ts's port-time renormalization already treats it. Only point
// coordinates are basis-dependent.
import type { Stroke } from '../types';

// The two numbers a conversion needs from a card: where its top-left sits on the
// canvas and how wide it is, both in canvas units (Box.x / Box.y / Box.w).
export interface BoxFrame { x: number; y: number; w: number }

function assertFrame(f: BoxFrame): void {
  if (!Number.isFinite(f.x) || !Number.isFinite(f.y) || !Number.isFinite(f.w) || f.w <= 0) {
    // A zero-width frame cannot normalize anything; returning the strokes
    // unchanged would be silent corruption, so this refuses.
    throw new RangeError(`strokeBasis: unusable box frame ${JSON.stringify(f)}`);
  }
}

/** 'box' -> 'canvas': a card's own ink, placed where the card sits on the board. */
export function boxToCanvas(frame: BoxFrame, strokes: Stroke[]): Stroke[] {
  assertFrame(frame);
  return strokes.map(st => ({
    ...st,
    points: st.points.map(pt => ({ ...pt, x: frame.x + pt.x * frame.w, y: frame.y + pt.y * frame.w })),
  }));
}

/** 'canvas' -> 'box': board ink re-expressed relative to a card (its inverse). */
export function canvasToBox(frame: BoxFrame, strokes: Stroke[]): Stroke[] {
  assertFrame(frame);
  return strokes.map(st => ({
    ...st,
    points: st.points.map(pt => ({ ...pt, x: (pt.x - frame.x) / frame.w, y: (pt.y - frame.y) / frame.w })),
  }));
}
