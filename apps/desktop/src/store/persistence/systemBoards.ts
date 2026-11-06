import type { JournalEntry, Box } from '../../types';
import { deskTerm, type DeskTermId } from '../deskLexicon';
import { cache, clone, generateId } from './core';
import { saveJournalEntry } from './journal';
import { getTrashedCards } from './boards';
import { getJournalEntry, getJournalPages, getShelfEntries } from './entries';

// --- B1 — System Boards (the Journal Board, the Trash Board) --------------
//
// S1's own reasoning, carried here verbatim from the brief (the header
// comment types/index.ts's Box.systemKind field points back to):
//
// A system Board is a REAL board page (pageType 'board'), created
// find-or-create idempotently on first approach, marked by a new optional
// field on the existing 'board-meta' element in its own boxes: systemKind:
// 'journal' | 'trash' (the FX4 board-meta precedent — additive optional Box
// field, zero schema). System Boards: have no project home; never appear as
// cards on any system Board (exclusion asserted); never appear in the Pin
// sheet's board leaves (no project → already excluded; assert it anyway);
// sync like any page (arrangement persists across devices by the existing
// boxes round-trip).
//
// S2's own reasoning: on mount of a system Board (and on store changes
// while mounted — BoardEditor.tsx's own subscribe() wiring), reconcile its
// cards against the truth. Cards are the EXISTING page-pin kind (entryId,
// live title/excerpt, double-click travels) — reused, never forked. New
// cards auto-place into open space (a quiet, deterministic flow, no overlap
// on arrival); EXISTING cards' authored positions/sizes are NEVER moved by
// reconcile — this pairing (system decides WHAT, writer decides WHERE) IS
// A16, the one law this whole ticket serves, made concrete in code.

// B2 S1 — 'shelf' joins the union, by the SAME code paths (not copies):
// idempotent find-or-create, origin 'system', derived membership (T3
// instead of inJournalView/deletedAt), authored arrangement sacred.
export type SystemBoardKind = 'journal' | 'trash' | 'shelf';

function boardMetaOf(entry: JournalEntry | null | undefined): Box | undefined {
  return entry ? (entry.boxes ?? []).find(b => b.kind === 'board-meta') : undefined;
}

// The system kind of a page, if it is one. A plain, cheap, read-only check
// — safe to call on every render (BoardEditor.tsx's own per-render guard),
// unlike everything else in this section, which only ever runs for a board
// already known to carry one.
export function getSystemKind(entry: JournalEntry | null | undefined): SystemBoardKind | undefined {
  if (!entry || entry.pageType !== 'board') return undefined;
  return boardMetaOf(entry)?.systemKind;
}

// Find a live system Board by kind. Deliberately searches EVERY board page
// (not scoped to projectId == null): system Boards are never supposed to
// gain a project home (S1's own invariant), but if one somehow did, this
// lookup still FINDS the existing record rather than minting a duplicate —
// a duplicate system Board is a strictly worse defect than a misplaced one.
function findSystemBoard(kind: SystemBoardKind): JournalEntry | null {
  const found = cache.journalEntries.find(e => !e.deletedAt && getSystemKind(e) === kind);
  return found ? clone(found) : null;
}

const SYSTEM_BOARD_TITLE_TERM: Record<SystemBoardKind, DeskTermId> = {
  journal: 'drawerPlaceJournal',
  trash: 'drawerPlaceTrash',
  shelf: 'drawerPlaceShelf',
};

// Find-or-create, idempotent (S1): the first approach mints the record;
// every later approach (any device, any session, via sync's existing boxes
// round-trip) finds the SAME one. `origin: 'system'` is load-bearing, not
// decorative — see its own header comment in types/index.ts for exactly
// which latent bug it closes. The seed title (deskTerm, the plain-function
// escape hatch this file's own describePageHome import already established
// the precedent for) is a one-time text seed via the SAME "first line is
// the title" convention every page already uses — not a live binding; nothing
// re-applies it on a later theme switch.
export function getOrCreateSystemBoard(kind: SystemBoardKind): JournalEntry {
  const existing = findSystemBoard(kind);
  if (existing) return existing;
  const now = new Date().toISOString();
  const meta: Box = { id: generateId(), kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, systemKind: kind };
  const entry: JournalEntry = {
    id: generateId(),
    text: deskTerm(SYSTEM_BOARD_TITLE_TERM[kind]),
    projectId: null,
    pageType: 'board',
    boxes: [meta],
    source: 'page',
    origin: 'system',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// S2 — the pages a system Board's cards are DERIVED from, right now.
function qualifyingPagesFor(kind: SystemBoardKind, systemBoardId: string): JournalEntry[] {
  if (kind === 'journal') {
    // "Every journal-origin, non-deleted page" — reusing getJournalPages()
    // (inJournalView's own canonical membership rule) rather than
    // re-deriving a second definition of "belongs in the Journal": this is
    // the SAME rule every other Journal-facing surface in the app already
    // obeys, so the Journal Board can never quietly disagree with what "the
    // Journal" means anywhere else. origin:'system' already excludes a
    // system Board from inJournalView; the id filter is belt-and-suspenders.
    // B2 S7 — inJournalView's own pinned-law amendment (this file, above)
    // means a filed journal-origin page now drops out of this set at the
    // NEXT reconcile — no separate code needed here; the one shared
    // predicate carries the amendment to every consumer uniformly.
    return getJournalPages().filter(e => e.id !== systemBoardId);
  }
  if (kind === 'shelf') {
    // B2 S1 — T3, this ticket's own law (belongsOnShelf, above): "one
    // definition, two consumers" — the SAME predicate the Drawers panel's
    // own "loose docs" group reuses (S7). The id filter is belt-and-
    // suspenders, matching the Journal branch's own defensive habit (T3's
    // own getSystemKind check already excludes the Shelf Board from
    // qualifying for itself).
    return getShelfEntries().filter(e => e.id !== systemBoardId);
  }
  // TRASH BOARD: "the same rule over deletedAt-bearing pages (any origin)"
  // — every soft-deleted page, any origin/pageType, EXCLUDING system Boards
  // themselves. No reachable UI path can currently soft-delete a system
  // Board (it has no project, so it never appears in the Plan panel's own
  // board-delete row, and no other delete surface reaches a Board page at
  // all) — this exclusion holds regardless, defensively, so "a system Board
  // never cards itself" is true by construction, not merely by the absence
  // of a path today.
  return cache.journalEntries
    .filter(e => !!e.deletedAt && !e.purgedAt && getSystemKind(e) === undefined)   // DELETE FOR GOOD: a shell is not in Trash
    .map(clone);
}

// A quiet, deterministic grid — new cards land in the next open slot, in a
// STABLE order (qualifying pages sorted by id, never createdAt/updatedAt,
// which reconcile itself never touches but which an unrelated edit could
// still bump) so two reconcile runs against the SAME added-pages batch
// always place them identically. `startSlot` continues from the count of
// page-pin cards already kept on the board, so a card added in an EARLIER
// reconcile pass is never revisited — "no overlap on arrival" holds for
// cards arriving together in one pass without needing real collision
// detection against a writer's own freely-arranged (and freely-overlapped,
// per S3) existing cards.
const RECONCILE_CARD_W = 0.22;
const RECONCILE_CARD_H = 0.1;
const RECONCILE_GAP = 0.03;
const RECONCILE_COLS = 3;

function placeNewCards(newPages: JournalEntry[], startSlot: number, startZ: number): Box[] {
  return newPages.map((page, i) => {
    const slot = startSlot + i;
    const col = slot % RECONCILE_COLS;
    const row = Math.floor(slot / RECONCILE_COLS);
    const box: Box = {
      id: generateId(),
      kind: 'page-pin',
      x: 0.05 + col * (RECONCILE_CARD_W + RECONCILE_GAP),
      y: 0.06 + row * (RECONCILE_CARD_H + RECONCILE_GAP),
      w: RECONCILE_CARD_W,
      h: RECONCILE_CARD_H,
      z: startZ + i,
      entryId: page.id,
    };
    return box;
  });
}

// The reconcile itself. Returns the NEW boxes array to persist, or `null`
// if nothing changed — idempotence made checkable, not just claimed:
// calling this twice in a row against unchanged stored truth returns `null`
// the second time, so BoardEditor's own caller never even re-renders, let
// alone re-persists (b1.mjs's own "run it twice, byte-identical boxes"
// check calls this directly). EXISTING cards (kept, below) are copied by
// reference from the current array, unmodified — their x/y/w/h/z survive
// byte-identical through any number of reconcile passes, which is the
// entire content of "arrangement is never touched by reconcile."
export function reconcileSystemBoard(boardId: string): Box[] | null {
  const board = getJournalEntry(boardId);
  if (!board || board.pageType !== 'board') return null;
  const kind = getSystemKind(board);
  if (!kind) return null;

  const boxes = board.boxes ?? [];
  const qualifying = qualifyingPagesFor(kind, boardId);
  const qualifyingIds = new Set(qualifying.map(p => p.id));
  // BOARD CONTEXT MENU: the Trash board also holds a card for every TOMBSTONED CARD on a live board (trashedFrom = where it came from). They are keyed by board:box, not by page.
  const trashedNow = kind === 'trash' ? getTrashedCards() : [];
  const trashedKeys = new Set(trashedNow.map(t => `${t.boardId}:${t.box.id}`));
  const existingCardPins = boxes.filter(b => b.kind === 'page-pin' && !!b.trashedFrom);
  const existingCardKeys = new Set(existingCardPins.map(b => `${b.trashedFrom!.boardId}:${b.trashedFrom!.boxId}`));
  const existingPins = boxes.filter(b => b.kind === 'page-pin' && !b.trashedFrom);
  const existingPinnedIds = new Set(existingPins.map(b => b.entryId).filter((eid): eid is string => !!eid));

  // Cards whose page no longer qualifies leave (deleted, for the Journal
  // Board; restored or re-homed, for the Trash Board — either way, the
  // underlying real act already happened elsewhere; this only ever reacts).
  const staleIds = new Set(existingPins.filter(b => !b.entryId || !qualifyingIds.has(b.entryId)).map(b => b.id));
  existingCardPins.forEach(b => { if (!trashedKeys.has(`${b.trashedFrom!.boardId}:${b.trashedFrom!.boxId}`)) staleIds.add(b.id); });
  // Qualifying pages missing a card gain one.
  const missing = qualifying.filter(p => !existingPinnedIds.has(p.id)).sort((a, b) => a.id.localeCompare(b.id));
  const missingCards = trashedNow.filter(t => !existingCardKeys.has(`${t.boardId}:${t.box.id}`)).sort((a, b) => `${a.boardId}:${a.box.id}`.localeCompare(`${b.boardId}:${b.box.id}`));

  if (staleIds.size === 0 && missing.length === 0 && missingCards.length === 0) return null; // idempotent no-op

  const kept = boxes.filter(b => !staleIds.has(b.id));
  const keptPinCount = kept.filter(b => b.kind === 'page-pin').length;
  const startZ = kept.reduce((m, b) => Math.max(m, b.z), 0) + 1;
  const newBoxes = placeNewCards(missing, keptPinCount, startZ);
  const newCardBoxes = placeNewCards(missingCards.map(t => ({ id: '' } as JournalEntry)), keptPinCount + newBoxes.length, startZ + newBoxes.length)
    .map((box, i) => { const { entryId: _e, ...rest } = box; void _e; return { ...rest, trashedFrom: { boardId: missingCards[i].boardId, boxId: missingCards[i].box.id } } as Box; });
  return [...kept, ...newBoxes, ...newCardBoxes];
}
