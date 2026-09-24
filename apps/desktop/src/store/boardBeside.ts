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
import { getJournalEntry, getAllUserBoards, saveJournalEntry, generateId, getSystemKind } from './persistence';

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
 * Connect `otherId` beside `fromId`, stored on `fromId`'s row. Returns true when
 * a record was written; false for a refusal or an already-connected pair (a
 * no-write no-op — idempotent).
 */
export function connectBeside(fromId: string, otherId: string): boolean {
  if (fromId === otherId) return false;
  const from = getJournalEntry(fromId);
  const other = getJournalEntry(otherId);
  if (!from || from.pageType !== 'board' || getSystemKind(from) !== undefined) return false;
  if (!other || other.pageType !== 'board' || other.deletedAt || getSystemKind(other) !== undefined) return false;
  if (isBeside(fromId, otherId)) return false;
  const now = new Date().toISOString();
  const rec: BesideLink = { id: generateId(), boardId: otherId, createdAt: now, updatedAt: now };
  saveJournalEntry({ ...from, besideLinks: { links: [...(from.besideLinks?.links ?? []), rec] } });
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
