import type { Box } from '../types';
import { boardStructure, flattenLane } from './boardStructure';
import { liveBoxes } from './boxTombstones';
import { viewsOf, type BoardKind, type BoardView } from './boardKind';

// W1 - THE WALK, the pure model (brief docs/guided-paths/w1-walk-brief.md; frames 02 / 02-writing / 06 / 07 / 10). One card at a time, 700 px wide, in the board's own order; chevrons above its top corners; the
// doors under it; a rail of one mark per card. This file decides everything that is NOT drawing: the order, the steps, the rail's states, the card's box, the swipe, the keys, where an added card goes, and the two
// device-local memories (the card's size, the writer's place). components/Walk.tsx draws it; store/boardKind.ts says which boards have it.

export const WALK = { W: 700, MIN_W: 360, MIN_H: 220, MAX_H: 520, MAX_W: 900, SWIPE_MS: 280 } as const;

/** The steps of the Walk: the board's LIVE TEXT cards in the order Storyboard and Outline already show (boardStructure: `seq`, else array order - one order, three views, now four). Ink and page-pin cards are not steps. */
export function walkOrder(boxes: Box[]): Box[] {
  const live = liveBoxes(boxes);
  const byId = new Map(live.map((b) => [b.id, b]));
  const st = boardStructure(live);
  return st.lanes.flatMap((l) => flattenLane(l)).map((id) => byId.get(id)).filter((b): b is Box => !!b && b.kind === 'text');
}

/** Previous / next: one step, stopping at the ends (the Walk never wraps). */
export function walkStep(len: number, index: number, dir: 1 | -1): number {
  return Math.max(0, Math.min(len - 1, index + dir));
}

export type RailState = 'seed' | 'leaf' | 'lit' | 'current';
export interface RailMark { id: string; state: RailState; current: boolean; startHere: boolean; lit: boolean }

/** The rail: one mark per card, in order. Empty = a seed outline; kindled (store/guided.ts kindled) = a leaf; marked by the writer (W5 Lit) = a lit leaf; the current card = a ring. The current card is always `current`,
 *  whatever else it is (its `lit` flag still tells). Lit outranks kindled for a non-current card, and changes nothing about coverage. "Start Here" (store/deckHint.ts) folds into the first seed: the flag marks that card's mark. */
export function railMarks(order: Box[], currentIndex: number, kindledIds: ReadonlySet<string>, startHereId?: string | null, litIds?: ReadonlySet<string>): RailMark[] {
  return order.map((b, i) => {
    const current = i === currentIndex;
    const kindled = kindledIds.has(b.id);
    const lit = !!litIds?.has(b.id);
    return { id: b.id, state: current ? 'current' : lit ? 'lit' : kindled ? 'leaf' : 'seed', current, startHere: !!startHereId && b.id === startHereId, lit };
  });
}

/** The card's box: 700 wide unless the writer resized it (never under 360); as tall as its text up to 520, then it scrolls INSIDE; a remembered height is a floor. */
export function walkCardBox(contentH: number, stored?: { w?: number; h?: number } | null): { width: number; height: number; scroll: boolean } {
  const width = stored?.w ? Math.min(WALK.MAX_W, Math.max(WALK.MIN_W, stored.w)) : WALK.W;
  const want = Math.max(contentH, stored?.h ?? 0, WALK.MIN_H);
  return { width, height: Math.min(want, WALK.MAX_H), scroll: contentH > WALK.MAX_H };
}

export type SwipeSide = 'left' | 'right' | 'none';
export interface SwipePlan { kind: 'slide' | 'cut'; ms: number; crossfade: false; outgoing: SwipeSide; incoming: SwipeSide }

/** The swipe (Nick, 3:25 pm: no flash): a PURE SLIDE - both cards fully opaque (never a cross-fade), the outgoing one leaves one way as the next arrives from the other, about 280 ms; reduced motion is an instant cut. */
export function swipePlan(dir: 1 | -1, reduced: boolean): SwipePlan {
  return reduced ? { kind: 'cut', ms: 0, crossfade: false, outgoing: 'none', incoming: 'none' } : { kind: 'slide', ms: WALK.SWIPE_MS, crossfade: false, outgoing: dir === 1 ? 'left' : 'right', incoming: dir === 1 ? 'right' : 'left' };
}

export type WalkKeyAction = 'next' | 'prev' | 'exit' | 'activate' | null;
/** Keyboard: left / right and PageDown / PageUp step, Enter activates a focused door (and only a door), Esc leaves for the board in its last shown view. */
export function walkKey(key: string, ctx: { onDoor: boolean }): WalkKeyAction {
  if (key === 'ArrowRight' || key === 'PageDown') return 'next';
  if (key === 'ArrowLeft' || key === 'PageUp') return 'prev';
  if (key === 'Escape') return 'exit';
  if (key === 'Enter' && ctx.onDoor) return 'activate';
  return null;
}

/** Nick, Oct 25: the caret lands in the card on opening and on stepping, so the arrows may only step while the card is EMPTY (nothing to move the caret through); with the writer's words in it they move the caret,
 *  and PageUp / PageDown (and the chevrons) always step. Outside the editor (focus on a door, the rail) the arrows step as ever. */
export function keyMaySteps(key: string, ctx: { inEditor: boolean; empty: boolean }): boolean {
  if (key === 'PageDown' || key === 'PageUp') return true;
  if (key === 'ArrowRight' || key === 'ArrowLeft') return !ctx.inEditor || ctx.empty;
  return false;
}

/** EMPTY, for that rule: no words of the writer's in the card. A dealt step's title is the deck's (and so is a Deck's sub-step's: "Scene 2"), so such a card with an empty body is empty; a plain card is empty only while its title line is too. */
export function cardIsEmpty(box: Pick<Box, 'text' | 'deckStep' | 'parentId'>, inDeck = false): boolean {
  const t = box.text ?? '';
  const nl = t.indexOf('\n');
  const title = nl < 0 ? t : t.slice(0, nl);
  const body = nl < 0 ? '' : t.slice(nl + 1);
  return body.trim() === '' && (!!box.deckStep || (inDeck && !!box.parentId) || title.trim() === '');
}

/** Adding follows the view shown: Open places a card at a position; Storyboard, Outline, the Walk (and a Book's pages) APPEND to the order (`seq`, after the last). */
export function addPlacement(view: BoardView, boxes: Box[]): { mode: 'position' } | { mode: 'append'; seq: number } {
  if (view === 'open') return { mode: 'position' };
  const cards = liveBoxes(boxes).filter((b) => b.kind === 'text' || b.kind === 'page-pin' || b.kind === 'ink');
  const seqs = cards.map((b) => b.seq).filter((n): n is number => typeof n === 'number');
  return { mode: 'append', seq: (seqs.length ? Math.max(...seqs) : cards.length) + 1 };
}

/** The views on offer. Below the DeskFrame width a Deck's ONLY view is the Walk (frame 07); everything else keeps its kind's views. */
export function viewsFor(kind: BoardKind, narrow: boolean, deck: boolean): BoardView[] {
  return narrow && deck ? ['walk'] : viewsOf(kind);
}

// ---- device-local memory (the boardMode.ts family: one localStorage map per key, try/catch on every touch, no schema) -----------------------------------------------------------------------------------
const SIZE_KEY = 'wrizo-walk-size';
const POS_KEY = 'wrizo-walk-pos';
function read<T>(key: string): Record<string, T> {
  try { const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; const p = raw ? JSON.parse(raw) : null; return p && typeof p === 'object' ? p : {}; } catch { return {}; }
}
function write(key: string, map: unknown): void { try { localStorage.setItem(key, JSON.stringify(map)); } catch { /* blocked: this device simply does not remember */ } }

/** The size the writer gave this board's Walk card, remembered per board on this device. */
export function getWalkSize(boardId: string): { w: number; h: number } | null {
  const s = read<{ w: number; h: number }>(SIZE_KEY)[boardId];
  return s && Number.isFinite(s.w) && Number.isFinite(s.h) ? s : null;
}
export function setWalkSize(boardId: string, size: { w: number; h: number }): void {
  write(SIZE_KEY, { ...read(SIZE_KEY), [boardId]: { w: Math.round(size.w), h: Math.round(size.h) } });
}

/** Where the writer was in this board's Walk (the card id), remembered per board on this device. */
export function getWalkPos(boardId: string): string | null {
  const p = read<string>(POS_KEY)[boardId];
  return typeof p === 'string' ? p : null;
}
export function setWalkPos(boardId: string, cardId: string): void {
  write(POS_KEY, { ...read(POS_KEY), [boardId]: cardId });
}
