import type { Project, StoryPlan, SessionLog, Draft, JournalEntry, Drawer } from '../../types';
import { reportFlushFailed, reportFlushOk, reportStorageUsage } from '../storageHealth';
import { isSignedOutHere } from '../signedOutHere';
import { isStaleClient } from '../staleClient';

// ---------------------------------------------------------------------------
// Storage adapter (A2)
//
// Persistence is now a thin adapter over an in-memory cache:
//   - The cache is hydrated from localStorage once, at module init.
//   - Every getter reads the cache synchronously, so call sites stay unchanged
//     and no longer parse JSON on every read.
//   - Every setter mutates the cache, stamps `updatedAt` (and an id if new),
//     marks the record dirty for the future sync engine, and schedules a
//     coalesced localStorage write (~300ms) per collection.
//
// This is the local half of offline-first sync: the dirty registry and
// subscribe() exist for the sync engine (W2) and reactive screens, but no
// network code lives here.
// ---------------------------------------------------------------------------

export const KEYS = {
  projects: 'writer-studio-projects',
  storyPlans: 'writer-studio-story-plans',
  sessions: 'writer-studio-sessions',
  drafts: 'writer-studio-drafts',
  journalEntries: 'writer-studio-journal-entries',
  drawers: 'writer-studio-drawers',
} as const;

export type CollectionName = keyof typeof KEYS;
export type DirtyCollection = CollectionName;

interface Cache {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
  drafts: Draft[];
  journalEntries: JournalEntry[];
  drawers: Drawer[];
}

function hydrate<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T[]) : [];
  } catch {
    // Corrupt or unavailable storage must never crash boot — start empty.
    return [];
  }
}

export const cache: Cache = {
  projects: hydrate<Project>(KEYS.projects),
  storyPlans: hydrate<StoryPlan>(KEYS.storyPlans),
  sessions: hydrate<SessionLog>(KEYS.sessions),
  drafts: hydrate<Draft>(KEYS.drafts),
  journalEntries: hydrate<JournalEntry>(KEYS.journalEntries),
  drawers: hydrate<Drawer>(KEYS.drawers),
};

// Records returned to callers are cloned so the cache is never mutated by
// reference, and so each read yields a fresh object (screens that re-fetch
// after a write and feed the result to setState rely on a new reference to
// re-render — this matches the previous JSON.parse-per-read behavior).
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// the dirty registry is PERSISTED: getDirtyRecords() filters the cache by this set, so a memory-only set lost every pending row on reload, invisibly [persistence §2]

export const DIRTY_KEY = 'writer-studio-dirty-v1';

export const COLLECTIONS = Object.keys(KEYS) as CollectionName[];

function emptyDirty(): Record<CollectionName, Set<string>> {
  return {
    projects: new Set(),
    storyPlans: new Set(),
    sessions: new Set(),
    drafts: new Set(),
    journalEntries: new Set(),
    drawers: new Set(),
  };
}

function hydrateDirty(): Record<CollectionName, Set<string>> {
  const sets = emptyDirty();
  try {
    const raw = localStorage.getItem(DIRTY_KEY);
    if (!raw) return sets;
    const parsed = JSON.parse(raw) as Partial<Record<CollectionName, unknown>>;
    for (const name of COLLECTIONS) {
      const ids = parsed?.[name];
      if (!Array.isArray(ids)) continue;
      // Prune to ids that still have a record in the cache. A persisted id
      // whose row never reached disk — the tab died inside the 300ms write
      // window — would otherwise be a phantom that pushes nothing (there is no
      // record to send) while `applyCollection()` skips that id as "a local
      // unsynced edit" forever, so the server's own copy could never land.
      // Pruning at the one moment both halves are on the table makes the
      // restore self-healing instead of a new way to strand a row.
      const live = new Set((cache[name] as { id: string }[]).map(r => r.id));
      for (const id of ids) {
        if (typeof id === 'string' && live.has(id)) sets[name].add(id);
      }
    }
  } catch {
    // Corrupt or unavailable storage must never crash boot — start empty.
  }
  return sets;
}

// the id journal is written from flush(), in the same moment as the collection; its own write failure is reported under its own name (dirtyJournal), since a saved-but-unmarked row would never push [persistence §3]
const DIRTY_JOURNAL_REPORT_NAME = 'dirtyJournal';

// B10.1 - A STALE TAB IS READ-ONLY. Every tab on this origin shares one localStorage and flushes its WHOLE cache over the
// collection keys, so an old tab that kept saving would overwrite what the live tab wrote. While the stale-client flag is
// set the automatic writes below are held (the edits stay in memory, and the dirty set with them); the single exception is
// flushForReload(), the writer's own Reload, which MERGES its unsent edits into storage once (see below) so they survive into
// the new build.
function writesHeld(): boolean { return isStaleClient(); }

export function persistDirty(): void {
  if (writesHeld()) return;
  try {
    const out: Record<string, string[]> = {};
    for (const name of COLLECTIONS) out[name] = [...dirty[name]];
    localStorage.setItem(DIRTY_KEY, JSON.stringify(out));
    reportFlushOk(DIRTY_JOURNAL_REPORT_NAME);
  } catch {
    // Storage full/unavailable — never throw into a write path.
    reportFlushFailed(DIRTY_JOURNAL_REPORT_NAME);
  }
}

export const dirty: Record<CollectionName, Set<string>> = hydrateDirty();

export interface DirtyRecords {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
  drafts: Draft[];
  journalEntries: JournalEntry[];
  drawers: Drawer[];
}

export function getDirtyRecords(): DirtyRecords {
  return {
    projects: cache.projects.filter(r => dirty.projects.has(r.id)).map(clone),
    storyPlans: cache.storyPlans.filter(r => dirty.storyPlans.has(r.id)).map(clone),
    sessions: cache.sessions.filter(r => dirty.sessions.has(r.id)).map(clone),
    drafts: cache.drafts.filter(r => dirty.drafts.has(r.id)).map(clone),
    journalEntries: cache.journalEntries.filter(r => dirty.journalEntries.has(r.id)).map(clone),
    drawers: cache.drawers.filter(r => dirty.drawers.has(r.id)).map(clone),
  };
}

// DRAFTS INTEGRITY - AN ID IS ONLY UNIQUE WITHIN ITS COLLECTION. A project draft is stored under its project's id, so project P and
// draft P are two different records that share one id. This used to take bare ids and clear each from ALL SIX dirty sets, so landing
// project P also cleared draft P's dirty mark: if the draft's own request then failed (or the draft was edited meanwhile) the edit was
// no longer dirty, was never retried, and stayed on this device only. A record is now cleaned in ITS OWN collection and no other.
export function markClean(items: ReadonlyArray<{ collection: DirtyCollection; id: string }>): void {
  for (const { collection, id } of items) dirty[collection].delete(id);
  persistDirty();
  // STORAGE-FULL STEP 1 — a successful push is the one thing that can move the sync notice from "changes not yet in
  // the account" to "safe in the account" while storage stays failed; nothing previously told a reactive listener
  // that dirty state had changed here (only a collection write or a subscribe-worthy read did). This was the one
  // real gap: every other mutator already calls notify() (see upsert()); this is the one that did not.
  notify();
}

// STORAGE-FULL STEP 1 — true while ANY collection still has a record the account does not have yet. Cheap: reads
// each dirty Set's own size, no cloning (unlike getDirtyRecords(), built for pushing the records themselves, not
// for answering "is there anything to push").
export function hasDirtyRecords(): boolean {
  return COLLECTIONS.some((name) => dirty[name].size > 0);
}

// LOGOUT SAFETY — how many records the account does not have yet. Rejected records stay dirty, so they count here too.
export function countDirtyRecords(): number {
  return COLLECTIONS.reduce((n, name) => n + dirty[name].size, 0);
}

// Item 89 — test/inspection seam (this file's own established pattern; see
// `window.wrizoCreateJournalPage` below). The registry is module-private and
// the whole defect was that its survival across a reload could not be
// observed, so the harness needs to read it the way sync does: after the
// bundle re-hydrates, not through the localStorage key it happens to use.
// Never read by app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoDirty?: unknown }).wrizoDirty = {
    key: DIRTY_KEY,
    ids: (): Record<string, string[]> => {
      const out: Record<string, string[]> = {};
      for (const name of COLLECTIONS) out[name] = [...dirty[name]];
      return out;
    },
    records: (): DirtyRecords => getDirtyRecords(),
  };
}

// One-time journal backfill (journal-resync patch). Pre-D2, the client pushed
// journal entries and marked them clean even though the old server silently
// dropped them — so every pre-existing entry sits in localStorage flagged
// "synced" while the server never stored it. Re-flag ALL entries dirty (include
// soft-deleted, so tombstones travel) so they push once against the new server.
// Touches neither the cache nor updatedAt — LWW + stable ids make a re-push of an
// entry the server already has a no-op. The sync loop fires this exactly once,
// gated on the new server's response shape + a localStorage flag.
export function markAllJournalEntriesDirty(): void {
  for (const e of cache.journalEntries) dirty.journalEntries.add(e.id);
  // Touches no collection, so no flush would carry the journal — write it here.
  persistDirty();
}

// --- Subscriptions --------------------------------------------------------
// The sync engine and reactive screens subscribe to cache changes.

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notify(): void {
  listeners.forEach(listener => {
    try {
      listener();
    } catch {
      // A misbehaving listener must never break a write path.
    }
  });
}

// --- Debounced writes -----------------------------------------------------
// One timer per collection. The first dirtying write in a window schedules a
// flush; further writes within that ~300ms window coalesce into it. This caps
// localStorage at ~3 writes/sec even under continuous typing while still
// guaranteeing words reach disk within 300ms (no debounce starvation).

const FLUSH_DELAY = 300;
export const flushTimers: Record<CollectionName, ReturnType<typeof setTimeout> | null> = {
  projects: null,
  storyPlans: null,
  sessions: null,
  drafts: null,
  journalEntries: null,
  drawers: null,
};

// STORAGE-FULL STEP 1 — each collection's own last-known SERIALIZED LENGTH (characters, not bytes yet — doubled below
// for a UTF-16 estimate), updated the moment `flush()` re-stringifies it. Summing these is the app's whole footprint
// without re-reading anything from disk a second time; seeded from the RAW on-disk string at boot so a session with
// no edits at all still reports an accurate figure the first time `maybeReportStorageUsage()` runs.
const lastFlushedChars: Partial<Record<CollectionName, number>> = {};
for (const name of COLLECTIONS) {
  try { lastFlushedChars[name] = localStorage.getItem(KEYS[name])?.length ?? 0; } catch { lastFlushedChars[name] = 0; }
}
let lastUsageCheckAt = 0;
const USAGE_CHECK_MIN_INTERVAL_MS = 4000; // a fill this app can warn "before" never needs sub-second resolution
function maybeReportStorageUsage(): void {
  const now = Date.now();
  if (now - lastUsageCheckAt < USAGE_CHECK_MIN_INTERVAL_MS) return;
  lastUsageCheckAt = now;
  let totalChars = 0;
  for (const name of COLLECTIONS) totalChars += lastFlushedChars[name] ?? 0;
  try { totalChars += localStorage.getItem(DIRTY_KEY)?.length ?? 0; } catch { /* ignore */ }
  reportStorageUsage(totalChars * 2); // UTF-16: 2 bytes/char, the same estimate every localStorage-quota discussion uses
}
// One check at boot (unthrottled — lastUsageCheckAt starts at 0), so a writer who opens a near-full device and only
// READS this session still gets the warning, not only one who happens to type first.
maybeReportStorageUsage();

function flush(name: CollectionName): void {
  if (writesHeld()) return;
  const json = JSON.stringify(cache[name]);
  try {
    localStorage.setItem(KEYS[name], json);
    // STORAGE-FULL STEP 1 — the OTHER half of the catch below: a write that succeeds after a device WAS failing
    // (the writer freed space, or the browser recovered) clears that collection's failed flag. See storageHealth.ts.
    reportFlushOk(name);
  } catch {
    // Storage full/unavailable — never throw into a write path. NO LONGER SILENT past this function, though:
    // reportFlushFailed tells the writer (via the sync notice) and, on the edge into failure, asks sync.ts to push
    // the in-memory copy at once — the cache above still holds the edit; only THIS DEVICE'S OWN COPY of it could not
    // be written. See storageHealth.ts's own header for the reasoning and the three things this now does.
    reportFlushFailed(name);
  }
  // the id journal rides with the data: whenever a record reaches disk, the fact that it is unpushed does too [persistence §4]
  persistDirty();
  // STORAGE-FULL STEP 1 — throttled so continuous typing (this fires up to ~3x/sec) never turns a usage check into
  // its own cost. `json.length` is what THIS collection just attempted to write; combined with the other
  // collections' own last-known sizes below it is the whole app's footprint, without re-reading anything from disk.
  lastFlushedChars[name] = json.length;
  maybeReportStorageUsage();
}

export function scheduleFlush(name: CollectionName): void {
  if (flushTimers[name] !== null) return;
  flushTimers[name] = setTimeout(() => {
    flushTimers[name] = null;
    flush(name);
  }, FLUSH_DELAY);
}

// Force every pending debounced write to localStorage synchronously. Call this
// when the page is about to be torn down (tab hide, route change) — a scheduled
// 300ms write would otherwise be lost if the page dies first. localStorage
// writes are synchronous, so the data is durable before the handler returns.
export function flushNow(): void {
  (Object.keys(KEYS) as CollectionName[]).forEach(name => {
    if (flushTimers[name] !== null) {
      clearTimeout(flushTimers[name]!);
      flushTimers[name] = null;
    }
    flush(name);
  });
}

// every mutating test seam flushes, made true here for the whole file and enforced by seed-guard.mjs: a write is debounced, and a fixture that reloads first loses it; product code keeps its own debounced cadence [persistence §5]
export function durableSeam<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  return (...args: A): R => { const out = fn(...args); flushNow(); return out; };
}

// Generic upsert: stamp updatedAt, replace-or-insert in the cache, mark dirty,
// schedule a write, and notify subscribers.
export function upsert<T extends { id: string; updatedAt: string }>(
  name: CollectionName,
  collection: T[],
  record: T,
): void {
  // THE BELT (logout flush) — a device that has signed out keeps nothing of the writer's. From the moment the
  // signed-out flag is set, no record is written: a late timer or an editor's unmount flush that runs after the wipe
  // can no longer recreate a row (saveDraft is an upsert and WOULD create one) that the next account would then push.
  // Pulled records do not come through here (applyCollection writes them), and a sign-in clears the flag first.
  if (isSignedOutHere()) return;
  record.updatedAt = new Date().toISOString();
  const index = collection.findIndex(r => r.id === record.id);
  if (index >= 0) {
    collection[index] = record;
  } else {
    collection.push(record);
  }
  dirty[name].add(record.id);
  scheduleFlush(name);
  notify();
}
