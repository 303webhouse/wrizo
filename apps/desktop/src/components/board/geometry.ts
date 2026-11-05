import { plainLines } from '../../store/entryText';
import type { Box } from '../../types';

export const AUTOSAVE_MS = 2000;
export const LONG_PRESS_MS = 350;         // mirrors the S25-verified Spread gesture
export const MOUSE_DRAG_THRESHOLD = 6;
export const TOUCH_CANCEL_THRESHOLD = 12;
export const MIN_TEXT_W = 0.15;
export const MIN_INK_W = 0.08;
// MIN_TEXT_H is about one line, persistence.ts's BOARD_LINE_H floor; a page-pin takes an aspect lock on RESIZE only, keyed to its pinned entry's kind (pinAspectFor) [BoardEditor §1]
export const MIN_TEXT_H = 0.045;
export const MIN_PIN_W = 0.15;
export const MIN_PIN_H = 0.06;
export const MEASURE_TOLERANCE_PX = 2;
// BUG 32c - a card's CONTENT height: the card with its height let go to auto (box-sizing is border-box, so this is the text + padding + border), read back and put back in the same synchronous pass - nothing paints between.
export function naturalPx(el: HTMLElement): number { const keep = el.style.height; el.style.height = 'auto'; const px = el.offsetHeight; el.style.height = keep; return px; }
export const VIEWPORT_MIN_PX = 560;
// FX4 S4 — the board canvas's own both-axis resize floors: "minimums =
// content extents" (the brief's own words) — the canvas can never be
// dragged smaller than what's needed to actually contain the current
// layout. Width reuses VIEWPORT_MIN_PX (the same floor the canvas's own
// auto-fit height already respects); height is computed live from
// maxBottom(boxes), same formula the existing auto-height already uses.
export const CANVAS_MIN_W = VIEWPORT_MIN_PX;
// the canvas stops at three page-widths tall, in the board's own units so a window resize never moves the floor; the shared 0.08 margin makes the canvas stop on the frame the card stops [BoardEditor §2]
export const BOARD_MAX_Y = 3;
export const BOARD_BREATHING_ROOM = 0.08;
// AB4 S2/S5 — matches persistence.ts's own BOARD_STACK_GAP (not exported;
// this file has never imported the port's internal layout constants, so a
// local mirror is the established shape here, same as pageWidthPx's own
// normalized-coordinate convention throughout this file).
export const ADD_CARD_GAP = 0.08;
export const NEW_CARD_W = 0.4;
export const NEW_CARD_H = 0.08;

export function groupMembers(boxes: Box[], groupId: string | undefined): Box[] {
  if (!groupId) return [];
  return boxes.filter(b => b.groupId === groupId);
}

export function maxBottom(boxes: Box[]): number {
  return boxes.reduce((m, b) => Math.max(m, b.y + b.h), 0);
}

// FX5 S4 (b/c) — plain axis-aligned rectangle overlap, in the SAME
// normalized (page-width-fraction) coordinates every box's own x/y/w/h
// already use. "OVERLAP IS PERMITTED" (S4's own words) was already true of
// the move/drag logic itself (no collision-avoidance code exists anywhere
// in this file — confirmed by reading it, not assumed); this helper is new
// only for S4 (c)'s own layer-order icon, which needs to know WHEN two
// cards genuinely overlap to decide whether to appear at all.
export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// a bounded notecard read (title + up to 3 lines, ~160 chars): it trims what the card's face shows, never what is stored [BoardEditor §3]
export function notecardExcerpt(text: string): { title: string; excerpt: string } {
  // a card's face is plain text - the same reader as every other derived title [BoardEditor §4]
  const lines = plainLines(text);
  const title = lines[0] ? lines[0].slice(0, 100) : '';
  const excerpt = lines.slice(1, 4).join(' ').slice(0, 160);
  return { title, excerpt };
}

export type LastAction = { type: 'move' | 'resize' | 'remove' | 'ungroup'; before: Box[] } | null;
