import type { JournalEntry } from '../../types';
import { cache, clone } from './core';
import { saveJournalEntry } from './journal';

// B1 S4 — read a JournalEntry INCLUDING a soft-deleted one. Every other read
// in this file stays deletion-filtered on purpose (soft-deleted means "gone"
// everywhere else); this is the ONE deliberate exception, named for exactly
// what it's for: the Trash Board's own page-pin cards (BoardEditor.tsx's
// BoardPinBox) must show a deleted page's REAL, live title/excerpt — "the
// Trash is a place, not a blank" — never the generic "Missing page" that
// the deletion-filtered getJournalEntry would otherwise report for every
// single card on the Trash Board. Read-only; never used to gate a write.
export function getJournalEntryIncludingDeleted(id: string): JournalEntry | null {
  const entry = cache.journalEntries.find(e => e.id === id);
  return entry && !entry.purgedAt ? clone(entry) : null;   // DELETE FOR GOOD: a shell is gone, even here
}

// B1 S4 — Restore (A18): a plain button (the FX5 action-row precedent),
// the exact inverse of softDeleteEntry and nothing more — clears deletedAt
// only. The page returns to its stored home (never touched by deletion in
// the first place: projectId/shelved/origin are untouched by softDeleteEntry
// above, so there is nothing here to restore but the one field deletion
// itself set) and, if journal-origin, back into the Journal Board's own
// derivation at the next reconcile (S2) — restore never re-homes a page,
// it only un-deletes it. `deletedAt` is deleted from the object entirely
// (not set to undefined) — the same "absent, not merely falsy" grandfather
// discipline this file's own TutorThread comment names.
export function restoreEntry(id: string): void {
  const entry = getJournalEntryIncludingDeleted(id);
  if (!entry || !entry.deletedAt) return;
  const { deletedAt: _deletedAt, ...rest } = entry;
  saveJournalEntry(rest as JournalEntry);
}
