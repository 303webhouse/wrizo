// STORAGE-FULL STEP 2 — THE WRITE-AHEAD JOURNAL (Fable's ruling, 2026-09-30, upgrading the S0 rival so it keeps the
// bytes rather than only reporting their loss).
//
// THE PROBLEM THE JOURNAL SOLVES. IndexedDB writes are asynchronous; `flushNow()` is called SYNCHRONOUSLY at 35
// production call sites (every `visibilitychange: hidden` handler, every `durableSeam`-wrapped test seam) that all
// assume "by the time this call returns, the edit is durable." Awaiting IndexedDB everywhere would invert that
// contract across the whole app and the whole harness suite (see docs/menus/storage-full-step2-s0-indexeddb.md §2).
//
// THE FIX: `flushNow()` keeps its synchronous contract by writing a SMALL, SYNCHRONOUS journal entry — this module —
// before it ever starts the async IndexedDB commit. The journal holds ONLY records not yet confirmed committed
// (normally one page's worth, never a whole collection), so it costs nowhere near what the old whole-blob
// localStorage write did. A record leaves the journal the moment ITS OWN commit succeeds (persistence.ts drives
// that; this module only stores and reports, it never decides when an entry is stale).
//
// TOMBSTONES. The one hard-delete this app has (`clearDraft()`) must journal "this id is GONE," not merely stop
// journaling it — otherwise a crash between the delete request and IndexedDB confirming it would resurrect the
// deleted row at the next boot replay. `{ deleted: true }` entries carry that.
//
// THE LAST RESORT. If the journal itself cannot be written (a huge ink page pushes past the device's real quota),
// that failure is reported through the SAME storageHealth.ts channel step 1 built — under its own name, so a reader
// can tell "the edit itself never saved anywhere" apart from "it saved, but this device's copy of it is stale."
import { reportFlushFailed, reportFlushOk } from './storageHealth';

const JOURNAL_KEY = 'writer-studio-waj-v1';
export const JOURNAL_REPORT_NAME = 'writeAheadJournal';

export type JournalEntry<T> = { record: T } | { deleted: true };
type JournalShape = Record<string, Record<string, JournalEntry<unknown>>>;

function readRaw(): JournalShape {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as JournalShape) : {};
  } catch {
    // Corrupt or unavailable storage must never crash boot — start as if nothing was pending.
    return {};
  }
}

// An in-memory mirror, read once at module init (the journal is small by construction, so re-parsing it on every
// put would be wasted work, not merely cheap-enough work) and kept in lockstep with every write below.
let mem: JournalShape = readRaw();

function persist(): boolean {
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(mem));
    reportFlushOk(JOURNAL_REPORT_NAME);
    return true;
  } catch {
    reportFlushFailed(JOURNAL_REPORT_NAME);
    return false;
  }
}

/** Journal one record as "not yet confirmed committed." Returns false if the journal itself could not be written
 *  (the last-resort case) — the caller still attempts the IndexedDB commit either way; this is reporting, not a gate. */
export function journalPut<T extends { id: string }>(collection: string, record: T): boolean {
  (mem[collection] ??= {})[record.id] = { record };
  return persist();
}

/** Journal a hard delete — the one shape a successful commit must ALSO be able to remove on replay. */
export function journalDelete(collection: string, id: string): boolean {
  (mem[collection] ??= {})[id] = { deleted: true };
  return persist();
}

/** Removes an id from the journal once ITS commit (upsert or delete) is confirmed — never called speculatively;
 *  see persistence.ts's own race guard (only clears when the journal's CURRENT entry still matches what was just
 *  committed, so a newer edit queued behind an in-flight commit is never erased out from under itself). */
export function journalClearId(collection: string, id: string): void {
  const bucket = mem[collection];
  if (!bucket || !(id in bucket)) return;
  delete bucket[id];
  if (Object.keys(bucket).length === 0) delete mem[collection];
  persist();
}

/** The journal's current entry for one id, or undefined — used ONLY to check "is this still the entry I committed"
 *  before clearing it (see journalClearId's own note); never read for its content by product code. */
export function journalPeek<T>(collection: string, id: string): JournalEntry<T> | undefined {
  return mem[collection]?.[id] as JournalEntry<T> | undefined;
}

/** Everything still pending, for boot replay. A snapshot (shallow-cloned per collection) so a caller iterating it
 *  while persistence.ts re-queues each entry for a fresh commit can never observe this module mutating under it. */
export function journalReadAll(): JournalShape {
  const out: JournalShape = {};
  for (const [collection, bucket] of Object.entries(mem)) out[collection] = { ...bucket };
  return out;
}

export function journalSize(): number {
  return Object.values(mem).reduce((n, bucket) => n + Object.keys(bucket).length, 0);
}

/** Boot replay is done with the whole journal at once (every entry has been re-queued for a fresh commit attempt;
 *  nothing is left that still needs the OLD journal's own words). */
export function journalClearAll(): void {
  mem = {};
  persist();
}

// Test/inspection seam (this file's own convention; never read by app code).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoWriteAheadJournal?: unknown }).wrizoWriteAheadJournal = {
    key: JOURNAL_KEY,
    size: journalSize,
    readAll: journalReadAll,
  };
}
