import type { JournalEntry, Box, Stroke } from '../../types';
import { carryHiddenOnSave, tombstone, restoreBox, purgeMarker, isTombstoned, isHiddenSelf } from '../boxTombstones';
import { cache, clone, generateId } from './core';
import { saveJournalEntry } from './journal';
import { getJournalEntry } from './entries';
import { getSystemKind } from './systemBoards';

// --- J4 — the Board + the port ---------------------------------------------
// The Board is a new page species (pageType 'board'): a canvas of positioned
// boxes, ported (copied, never moved) from the loose Journal. Layout constants
// are normalized to the page WIDTH (the Board's one coordinate unit); an ink
// box's h follows its re-normalized stroke bbox aspect so it never distorts.

export const BOARD_TEXT_W = 0.6;
export const BOARD_INK_MIN_W = 0.15;
export const BOARD_INK_MAX_W = 0.5;
export const BOARD_GROUP_GAP = 0.05;  // between a locked group's text box and its ink box
export const BOARD_STACK_GAP = 0.08;  // between successive ported pages
const BOARD_LINE_H = 0.045;    // one text line's height, normalized to page width
const BOARD_CHARS_PER_LINE = 70; // rough wrap estimate at BOARD_TEXT_W; Slice 3 corrects live
// FX5 S3 (b/c) — the "content-minimum trap" fix's OTHER half (see
// BoardEditor.tsx's own header comment on BoardTextBox for the full
// diagnosis): the reflow-as-minimum effect only ever GROWS a card's height,
// never shrinks it, so clamping the DISPLAY to a short excerpt alone
// doesn't help a card that already mounted with an absurd height (measured
// live at h=6.19 — over six page-widths tall — for a 60-line source page).
// A ported card's INITIAL height is capped here at port time, comfortably
// above what a title + badge + ~3-line excerpt actually needs (a small,
// deliberate safety margin — if the real rendered excerpt needs a hair
// more, the EXISTING reflow-as-minimum effect grows it the rest of the
// way, same as any other card; it never needs to shrink FROM this cap).
export const MAX_PORTED_TEXT_H = 0.18;

export function estimateTextBoxHeight(text: string): number {
  const lines = text.split('\n').reduce((n, para) => n + Math.max(1, Math.ceil(para.length / BOARD_CHARS_PER_LINE)), 0);
  return Math.max(1, lines) * BOARD_LINE_H + 0.02;
}

// Non-eraser bbox (J2's convention — an erase sweep must not distort the fit).
function strokesBBox(strokes: Stroke[]): { minX: number; minY: number; w: number; h: number } {
  const pts = strokes.filter(s => !s.eraser).flatMap(s => s.points);
  if (pts.length === 0) return { minX: 0, minY: 0, w: 1, h: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, w: Math.max(maxX - minX, 0.001), h: Math.max(maxY - minY, 0.001) };
}

// Re-normalize a page's strokes for an ink Box (J4 invariant): bbox origin ->
// 0,0, scaled so bbox width = 1 — the box crop-fits its drawing and transforms
// losslessly with `w`. Returns the drawing's aspect ratio (h/w) AND its
// original bbox width (page-width fraction, pre-scale) so the box can land
// bbox-fit — the size the writer actually drew it at — rather than flat-maxed.
export function renormalizeStrokesForBox(strokes: Stroke[]): { strokes: Stroke[]; aspect: number; bboxW: number } {
  const bbox = strokesBBox(strokes);
  const scale = 1 / bbox.w;
  const normalized = strokes.map(s => ({
    ...s,
    points: s.points.map(p => ({ x: (p.x - bbox.minX) * scale, y: (p.y - bbox.minY) * scale, ...(p.p != null ? { p: p.p } : null) })),
  }));
  return { strokes: normalized, aspect: bbox.h / bbox.w, bboxW: bbox.w };
}

// Create a Board page (J4 Slice 1) — a binder page with pageType:'board' and
// empty boxes. `title` seeds entry.text (the same firstLine convention every
// page title reads from) — empty renders "Untitled" like any fresh page
// (F4's title-later law, reused rather than inventing a second naming field).
export function createBoardPage(binderId: string, title?: string): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: title?.trim() ?? '',
    projectId: binderId,
    pageType: 'board',
    boxes: [],
    source: 'page',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// Persist a Board's box array (Slice 3 autosave) — merges into the latest
// record so metadata written elsewhere is never clobbered.
//
// BOARD CONTEXT MENU - THE WRITE BOUNDARY FOR TOMBSTONES. `boxes` here is what an EDITOR holds: live boxes only. The stored board also carries the cards that were deleted (tombstones), the markers a
// permanent delete leaves, and the connections hanging off a tombstoned card; `carryHiddenOnSave` (store/boxTombstones.ts) re-attaches them so an ordinary autosave can never strip them, drops an
// incoming box that is purged in storage, and keeps a tombstone standing against a STALE view of the card unless the caller names the id in `restored` (an explicit Undo).
export function saveBoardBoxes(id: string, boxes: Box[], restored?: readonly string[]): void {
  const latest = getJournalEntry(id);
  if (!latest) return;
  saveJournalEntry({ ...latest, boxes: carryHiddenOnSave(latest.boxes, boxes, new Date().toISOString(), new Set(restored ?? [])) });
}

// A card is deleted: STAMP IT IN PLACE (deletedAt + updatedAt), keep it in `boxes`. Connections and board-meta are never tombstoned - a connection is hidden by its endpoint and returns with it.
// Returns the ids actually tombstoned. A system board's cards are derived, so nothing is stashed there.
export function stashDeletedBoxes(boardId: string, ids: readonly string[]): string[] {
  const board = getJournalEntry(boardId);
  if (!board || board.pageType !== 'board' || getSystemKind(board)) return [];
  const now = new Date().toISOString();
  const want = new Set(ids);
  const done: string[] = [];
  const next = (board.boxes ?? []).map(b => {
    if (!want.has(b.id) || b.kind === 'connection' || b.kind === 'board-meta' || isHiddenSelf(b)) return b;
    done.push(b.id);
    return tombstone(b, now);
  });
  if (done.length) saveJournalEntry({ ...board, boxes: next });
  return done;
}

// Restore from Trash: clear the flag, stamp the change time so it beats the older tombstone in any merge. The connections that hung off it come back with it (they were never touched).
export function restoreDeletedBox(boardId: string, boxId: string): boolean {
  const board = getJournalEntry(boardId);
  if (!board || board.deletedAt) return false;
  const boxes = board.boxes ?? [];
  const b = boxes.find(x => x.id === boxId);
  if (!b || !isTombstoned(b)) return false;
  const now = new Date().toISOString();
  saveJournalEntry({ ...board, boxes: boxes.map(x => (x.id === boxId ? restoreBox(x, now) : x)) });
  return true;
}

// Permanent delete from Trash: the box is replaced by an id-only marker, so a stale save can never bring the card back.
export function purgeDeletedBox(boardId: string, boxId: string): boolean {
  const board = getJournalEntry(boardId);
  if (!board) return false;
  const boxes = board.boxes ?? [];
  const b = boxes.find(x => x.id === boxId);
  if (!b || !isTombstoned(b)) return false;
  const now = new Date().toISOString();
  saveJournalEntry({ ...board, boxes: boxes.map(x => (x.id === boxId ? purgeMarker(x, now) : x)) });
  return true;
}

/** The tombstoned CARDS on every live, ordinary board - what the Trash board lists next to the deleted pages. A board that is itself in Trash keeps its cards (they return with the board). */
export function getTrashedCards(): { boardId: string; boardTitle: string; box: Box }[] {
  const out: { boardId: string; boardTitle: string; box: Box }[] = [];
  for (const e of cache.journalEntries) {
    if (e.deletedAt || e.pageType !== 'board' || getSystemKind(e) !== undefined) continue;
    for (const b of e.boxes ?? []) {
      if (isTombstoned(b) && b.kind !== 'connection' && b.kind !== 'board-meta') out.push({ boardId: e.id, boardTitle: e.text.trim() ? e.text.trim().split('\n')[0].slice(0, 60) : 'Untitled board', box: clone(b) });
    }
  }
  return out;
}
