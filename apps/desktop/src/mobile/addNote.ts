// MOBILE slice 1, item 2 - ADD: NOTE, the receiving end. A typed note becomes an ordinary text Card on a Board, and the Card's id IS the note's id (made on the phone, see noteQueue.ts).
// An unfiled note goes to the Mobile Board (mobileBoard.ts). "A note is never added twice": any box already on the Board with that id - live, deleted (a tombstone) or deleted for good (a marker) - means the note has arrived before, so nothing is added and a Card she
// deleted is never brought back by a second arrival. Sync already merges a Board's boxes per box id, so two devices and a resent note agree on the one Card.
// Nothing else on the Board is touched: the new Card goes below the lowest live one, with its own updatedAt (the per-box merge key).
import type { Box } from '../types';
import { getJournalEntries, getJournalEntry, saveJournalEntry } from '../store/persistence';
import { liveBoxes } from '../store/boxTombstones';
import type { NoteTarget } from './noteQueue';

export interface NoteToAdd { id: string; text: string; madeAt: string; to: NoteTarget }
export type AddResult = 'added' | 'already' | 'no-place';

const CARD_X = 0.05;
const CARD_W = 0.3;
const CARD_H = 0.12;
const GAP = 0.02;

/** Where an unfiled phone note goes (the Board in Unfiled called Mobile, Nick M4): the live one, or null; and a new one when there is none. Supplied by the caller, so this file knows nothing of how that Board is marked. */
export interface UnfiledHome { find(): string | null; make(): string | null }
export type Delivery = { result: 'added' | 'already'; boardId: string; rerouted: boolean } | { result: 'held' };

/** The live Board on this phone that already has a box with this id (a live Card, or one deleted in place), or null. */
function boardHolding(id: string): string | null {
  return getJournalEntries().find((e) => e.pageType === 'board' && !e.deletedAt && !e.purgedAt && (e.boxes ?? []).some((b) => b.id === id))?.id ?? null;
}

/** Deliver a note to its place. A note whose Board is gone (or that was sent with no place) goes where an unfiled phone note goes (Fable, Nov 24), and is never lost: with no home to go to yet it is HELD, and the caller leaves it waiting.
 *  A note already on ANY live Board is not added again, wherever it was meant to go (the Mobile Board may have been renamed between two tries). */
export function deliverNote(note: NoteToAdd, home: UnfiledHome | null): Delivery {
  const has = boardHolding(note.id);
  if (has) return { result: 'already', boardId: has, rerouted: note.to.kind !== 'board' || note.to.id !== has };
  if (note.to.kind === 'board') {
    const r = addNote(note);
    if (r !== 'no-place') return { result: r, boardId: note.to.id, rerouted: false };
  }
  const id = home ? (home.find() ?? home.make()) : null;
  if (!id) return { result: 'held' };
  const r = addNote({ ...note, to: { kind: 'board', id } });
  return r === 'no-place' ? { result: 'held' } : { result: r, boardId: id, rerouted: true };
}

export function addNote(note: NoteToAdd): AddResult {
  if (note.to.kind !== 'board') return 'no-place';
  const board = getJournalEntry(note.to.id);
  if (!board || board.pageType !== 'board' || board.deletedAt || board.purgedAt) return 'no-place';
  const all: Box[] = board.boxes ?? [];
  if (all.some((b) => b.id === note.id)) return 'already';
  const cards = liveBoxes(all).filter((b) => b.kind === 'text' || b.kind === 'ink' || b.kind === 'page-pin');
  const lowest = cards.reduce((m, c) => Math.max(m, c.y + c.h), 0.05);
  const maxZ = all.reduce((m, b) => Math.max(m, b.z), 0);
  const card: Box = { id: note.id, kind: 'text', x: CARD_X, y: lowest + GAP, w: CARD_W, h: CARD_H, z: maxZ + 1, text: note.text, updatedAt: new Date().toISOString() };
  saveJournalEntry({ ...board, boxes: all.concat([card]) });
  return 'added';
}
