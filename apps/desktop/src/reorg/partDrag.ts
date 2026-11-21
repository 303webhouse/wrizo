// DRAG TO MOVE, MERGE AND NEST PARTS (reorg plan v2.1 §3b, ARBOR item 1; Fable, Nov 20 11:15 pm). PURE: what a drop of one Part's row on another
// row means, and the write it makes - through INK's acts only (reorg/parts.ts: movePart, setPartLevel, joinPart). Nothing here draws, and nothing
// here writes a word itself. The list (./PartsList.tsx) owns the drag and the words.
//
// THE BANDS of a target row, read from the pointer's height on it (never the dragged row's box):
//   top quarter    MOVE above it
//   bottom quarter MOVE below it, and below its subsections
//   middle         NEST under it, released at once (BUILD only); HELD for DWELL_MS: MERGE into it (item 144's guard: an act that changes words
//                  arms only on a dwell, and the row names the act before the release)
// A refusal (too deep to nest; INK's join refusals) is read BEFORE anything moves, said in the row, and a release there writes nothing.

import { joinPart, movePart, partsOfDoc, runOf, setPartLevel, MAX_PART_LEVEL, type JoinToken, type Part } from './parts';

/** The drag's own type: never the Assets tab's (assetConnect.ts), so the two acts can never share a handler. */
export const PART_DRAG = 'application/x-wrizo-part';
/** How long the pointer must hold over a row's middle before a release there merges (item 144's dwell). */
export const DWELL_MS = 450;

export type Band = 'before' | 'after' | 'middle';
export type DropKind = 'before' | 'after' | 'nest' | 'merge' | 'no' | 'none';
export type Refusal = 'deep' | 'carries' | 'not-text' | 'unknown';
export interface DropPlan { kind: DropKind; why?: Refusal }

export const isPartDrag = (dt: DataTransfer | null | undefined): boolean => !!dt && Array.from(dt.types || []).includes(PART_DRAG);

/** The band of a row the pointer is in: y and the row's top and height in the same space. */
export function bandAt(y: number, top: number, height: number): Band {
  const f = height > 0 ? (y - top) / height : 0.5;
  return f < 0.25 ? 'before' : f > 0.75 ? 'after' : 'middle';
}

/** Whether `target` is the dragged Part or inside its run (a Part is not a target for itself or its own subsections: absent, not refused). */
export function inOwnRun(parts: Part[], dragged: string, target: string): boolean {
  const i = parts.findIndex((p) => p.id === dragged);
  if (i < 0) return true;
  const [s, e] = runOf(parts.map((p) => p.level), i);
  return parts.slice(s, e).some((p) => p.id === target);
}

/**
 * What a drop would do. `held` is whether the pointer has dwelt on the middle for DWELL_MS; `nest` whether this stage offers nesting (BUILD).
 * Merge reads INK's own refusals first (joinPart's): a Part that carries ink, cards, links or a thread is not joined; neither is a script.
 */
export function planDrop(parts: Part[], dragged: string, target: string, band: Band, held: boolean, nest: boolean): DropPlan {
  if (inOwnRun(parts, dragged, target)) return { kind: 'none' };
  const d = parts.find((p) => p.id === dragged), t = parts.find((p) => p.id === target);
  if (!d || !t) return { kind: 'none' };
  if (band === 'before' || band === 'after') return { kind: band };
  if (held) {
    if (d.carries) return { kind: 'no', why: 'carries' };
    if (d.kind === 'script' || t.kind === 'script') return { kind: 'no', why: 'not-text' };
    return { kind: 'merge' };
  }
  if (!nest) return { kind: 'none' };
  if (t.level >= MAX_PART_LEVEL) return { kind: 'no', why: 'deep' };
  return { kind: 'nest' };
}

/** Where the dragged run lands among the OTHER Parts (movePart's toIndex): above the target, below the target's run, or directly below the target. */
function indexAmongRest(parts: Part[], dragged: string, target: string, where: 'above' | 'belowRun' | 'belowRow'): number {
  const i = parts.findIndex((p) => p.id === dragged);
  const [s, e] = runOf(parts.map((p) => p.level), i);
  const rest = parts.filter((_, k) => k < s || k >= e);
  const ti = rest.findIndex((p) => p.id === target);
  if (where === 'above') return ti;
  if (where === 'belowRow') return ti + 1;
  const [, te] = runOf(rest.map((p) => p.level), ti);
  return te;
}

export type DropResult =
  | { done: 'moved' | 'nested' }
  | { done: 'merged'; token: JoinToken }
  | { done: 'merge-open' }          // the dragged Part is the open page: it now sits directly under the target, and the host runs the join (route state)
  | { done: 'nothing'; why?: Refusal };

/**
 * Make the drop. MOVE: INK's movePart. NEST: movePart below the target's run, then setPartLevel one under the target. MERGE: movePart directly below
 * the target, then joinPart - unless the dragged Part is the open page (`openId`), whose join the host runs once the target has mounted (the row
 * menu's own path for the open Part). The plan is re-read here, on the store as it stands, so a stale drag can only write what a fresh one would.
 */
export function makeDrop(docId: string, dragged: string, target: string, band: Band, held: boolean, nest: boolean, openId: string | null): DropResult {
  const parts = partsOfDoc(docId);
  const plan = planDrop(parts, dragged, target, band, held, nest);
  if (plan.kind === 'none' || plan.kind === 'no') return { done: 'nothing', why: plan.why };
  if (plan.kind === 'before') { movePart(docId, dragged, indexAmongRest(parts, dragged, target, 'above')); return { done: 'moved' }; }
  if (plan.kind === 'after') { movePart(docId, dragged, indexAmongRest(parts, dragged, target, 'belowRun')); return { done: 'moved' }; }
  if (plan.kind === 'nest') {
    const t = parts.find((p) => p.id === target) as Part;
    movePart(docId, dragged, indexAmongRest(parts, dragged, target, 'belowRun'));
    setPartLevel(docId, dragged, t.level + 1);
    return { done: 'nested' };
  }
  movePart(docId, dragged, indexAmongRest(parts, dragged, target, 'belowRow'));
  if (dragged === openId) return { done: 'merge-open' };
  const r = joinPart(dragged);
  if (!r.ok) return { done: 'nothing', why: ('reason' in r ? r.reason : 'unknown') as Refusal };
  return { done: 'merged', token: r.token };
}
