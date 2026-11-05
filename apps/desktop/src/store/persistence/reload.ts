import { COLLECTIONS, DIRTY_KEY, KEYS, cache, dirty } from './core';
import { getSystemKind } from './systemBoards';

// B2 S3 — createShelfPage (the legacy manual "Shelve" verb's own creation
// door: a page born pre-shelved:true) RETIRES. The Shelf is derived (T3),
// never filed-into — there is no more "start a page ON the Shelf" act to
// have; a loose page lands there on its own the moment it qualifies. Its
// only call site (the retired pages/Shelf.tsx) is deleted alongside it
// (S1 — '/shelf' now bridges to the Shelf Board, the ShelfBoardGate
// pattern B1 established for '/journal' and '/trash'). Parked, not
// deleted from history: see docs/wrizo-alpha's own build report and the
// harness's A4 park sweep for the quoted-verbatim record.

// B10.1 - the stale tab's Reload: the ONE explicit write a stale tab makes, and it is a MERGE, never a whole-cache write. The
// live tab on this origin may hold fresher rows (and unsynced ones) in the same keys; writing this tab's whole, older cache over
// them is exactly the clobber the read-only hold exists to prevent. So, per collection: read what storage holds NOW, overlay ONLY
// this tab's DIRTY records by id (the newer updatedAt wins, so a fresher stored copy is never replaced), write that back, and
// UNION this tab's dirty ids into the id journal rather than replacing it. Callers run flushAll() first so every editor's pending
// text is already in its record. Any failure leaves storage as it was (best effort, like every other write here).
export function overlayDirty<T extends { id: string; updatedAt: string }>(stored: T[], mine: T[]): T[] {
  const out = stored.slice();
  for (const rec of mine) {
    const i = out.findIndex(r => r && r.id === rec.id);
    if (i < 0) out.push(rec);
    else if (!out[i].updatedAt || rec.updatedAt > out[i].updatedAt) out[i] = rec;
  }
  return out;
}

export function flushForReload(): void {
  const readArray = (key: string): unknown[] => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };
  for (const name of COLLECTIONS) {
    try {
      const mine = (cache[name] as Array<{ id: string; updatedAt: string }>).filter(r => dirty[name].has(r.id));
      if (mine.length === 0) continue;
      const merged = overlayDirty(readArray(KEYS[name]) as Array<{ id: string; updatedAt: string }>, mine);
      localStorage.setItem(KEYS[name], JSON.stringify(merged));
    } catch {
      // storage full/unavailable: the edit stays in this tab's memory; nothing more can be done from here
    }
  }
  try {
    const stored = JSON.parse(localStorage.getItem(DIRTY_KEY) || '{}') as Record<string, string[]>;
    const out: Record<string, string[]> = {};
    for (const name of COLLECTIONS) {
      const ids = new Set<string>(Array.isArray(stored?.[name]) ? stored[name] : []);
      dirty[name].forEach(id => ids.add(id));
      out[name] = [...ids];
    }
    localStorage.setItem(DIRTY_KEY, JSON.stringify(out));
  } catch {
    // as above
  }
}

// B10.1 - DOES THIS ACCOUNT ALREADY HOLD WORK? Any journal entry that is not a system board, or any project. Soft-deleted
// entries COUNT: a writer who deleted everything has still written, and is not new. Read from the raw cache (not
// getJournalEntries, which hides the deleted) and only meaningful once the first whole-account pull has landed.
export function accountHasWork(): boolean {
  return cache.journalEntries.some(e => !getSystemKind(e) && !e.purgedAt) || cache.projects.some(p => !p.purgedAt && !isAutoSet(p));   // DELETE FOR GOOD: shells are not work; BIG PROJECTS: neither is a set the app made for the writer
}

// BIG PROJECTS 1a - a SET THE APP MADE, not the writer: Top Drawer's one set and the lazy set of an empty Drawer carry these deterministic
// ids (store/place.ts). They are not work (a new account is still new) and not a resume target (an empty set is never where you left off).
export function isAutoSet(p: { id: string } | null | undefined): boolean { return !!p && (p.id.startsWith('top-set-') || p.id.startsWith('auto-set-')); }

// BIG PROJECTS 1a - has this account EVER had a Drawer row? Read from the raw cache: a soft-deleted Drawer and a delete-for-good shell both
// count, so a writer who deleted Top Drawer is never handed another. Only meaningful once the first whole-account pull has landed.
export function hasAnyDrawerRow(): boolean { return cache.drawers.length > 0; }
