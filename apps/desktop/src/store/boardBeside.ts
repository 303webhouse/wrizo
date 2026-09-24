// ITEM 144 — "BESIDE" BOARD CONNECTIONS, the client seam
// (docs/menus/item144-beside-storage-s0.md — Nick: "Store them properly").
//
// THE SHAPE, restated where it is used: an UNORDERED pair of boards. The record
// lives in ONE board's `besideLinks` (the board the writer was standing on when
// they made it, exactly as a nest rides the parent's `boxes`); the other end
// READS it by a reverse scan of the user's boards — the same cost and shape as
// `getBoardsPinning`'s scan for a nest's reverse. Nothing is written to the
// other end, so there is no divergence between the two.
//
// THIS FILE IS THE WHOLE SEAM: `getBoardsBeside` / `isBeside` / `connectBeside`
// / `unlinkBeside`. If Fable rules a table instead of a column, these four are
// the only thing that changes.
//
// EVERY WRITE SPREADS THE ENTRY (`saveJournalEntry({ ...entry, besideLinks })`):
// `upsert` replaces the stored row wholesale, so a write that named fields would
// silently drop the rest — the law anchors.ts states for pageLinks.
//
// "BESIDE" IS NOT THE NEST RELATION. It contains nothing, so it never enters
// `wouldNestCycle`; the only refusals are self, a missing/deleted/condition board,
// and (idempotently) a pair that is already connected.
import type { BesideLink, JournalEntry } from '../types';
import { getJournalEntry, getAllUserBoards, saveJournalEntry, generateId, getSystemKind, isUnborn } from './persistence';

const live = (e: JournalEntry): BesideLink[] => (e.besideLinks?.links ?? []).filter(l => !l.deletedAt);

/** Every board connected BESIDE `boardId`, either end having stored it. Deduped as an unordered pair. */
export function getBoardsBeside(boardId: string): JournalEntry[] {
  const out = new Map<string, JournalEntry>();
  const self = getJournalEntry(boardId);
  // Records on this board's own row point at the other end.
  for (const l of self ? live(self) : []) {
    const other = getJournalEntry(l.boardId);
    if (other && other.pageType === 'board' && !other.deletedAt && getSystemKind(other) === undefined && other.id !== boardId) out.set(other.id, other);
  }
  // Records on any other board's row that name this one — the reverse read.
  for (const b of getAllUserBoards()) {
    if (b.id === boardId || out.has(b.id)) continue;
    if (live(b).some(l => l.boardId === boardId)) out.set(b.id, b);
  }
  return [...out.values()];
}

export function isBeside(a: string, b: string): boolean {
  return getBoardsBeside(a).some(x => x.id === b);
}

/**
 * Connect `otherId` beside `fromId`. Returns true when a record was written; false for a
 * refusal or an already-connected pair (a no-write no-op — idempotent).
 *
 * THE RECORD RIDES A BORN BOARD. Normally it is stored on `fromId`'s row (the board the
 * writer stood on). But an UNBORN board (fresh from Create a Board) has no row — "a board
 * is born when it has a box" (PB1) — and `saveJournalEntry` on the unborn slot would BIRTH
 * it with no box. A connection must never birth a board (Fable, byte review). So when
 * `fromId` is unborn the record rides the OTHER end — storage locality, never meaning
 * (the S0 report: "beside" has no owner side). The reverse read is what makes that
 * invisible: once the unborn board is born, both ends show the connection. When BOTH ends
 * are unborn there is no born row to carry it, so nothing is written.
 *
 * A TRASHED board on either end is refused (`getJournalEntry` answers null for a deleted
 * row; the `deletedAt` tests below state it rather than lean on that).
 */
export function connectBeside(fromId: string, otherId: string): boolean {
  if (fromId === otherId) return false;
  const from = getJournalEntry(fromId);
  const other = getJournalEntry(otherId);
  const lawful = (e: JournalEntry | null) => !!e && e.pageType === 'board' && !e.deletedAt && getSystemKind(e) === undefined;
  if (!lawful(from) || !lawful(other)) return false;
  const fromUnborn = isUnborn(fromId);
  if (fromUnborn && isUnborn(otherId)) return false; // no born end to carry it
  if (isBeside(fromId, otherId)) return false;
  const [rowId, partnerId] = fromUnborn ? [otherId, fromId] : [fromId, otherId];
  const row = getJournalEntry(rowId) as JournalEntry;
  const now = new Date().toISOString();
  const rec: BesideLink = { id: generateId(), boardId: partnerId, createdAt: now, updatedAt: now };
  saveJournalEntry({ ...row, besideLinks: { links: [...(row.besideLinks?.links ?? []), rec] } });
  return true;
}

/**
 * Unlink the pair, whichever end(s) stored it: soft-deletes every LIVE record for
 * the pair on either row (usually one write; two if it was connected in both
 * directions). Nothing else changes — the boards, their cards and their other
 * connections are untouched ("Remove unlinks, never deletes").
 */
export function unlinkBeside(a: string, b: string): void {
  const now = new Date().toISOString();
  for (const [rowId, otherId] of [[a, b], [b, a]] as const) {
    const row = getJournalEntry(rowId);
    if (!row?.besideLinks) continue;
    let changed = false;
    const links = row.besideLinks.links.map(l => {
      if (!l.deletedAt && l.boardId === otherId) { changed = true; return { ...l, deletedAt: now, updatedAt: now }; }
      return l;
    });
    if (changed) saveJournalEntry({ ...row, besideLinks: { links } });
  }
}
