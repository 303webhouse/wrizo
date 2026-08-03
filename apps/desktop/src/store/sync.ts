import { getDirtyRecords, markClean, applyRemoteRecords, markAllJournalEntriesDirty, type DirtyRecords } from './persistence';
import { apiSync } from './api';

// Background sync engine (W2). Never blocks, debounces, or delays a local
// write; never surfaces a blocking error. Pushes dirty records and pulls
// everything changed since the last sync on a quiet 20s cadence plus key
// lifecycle events, with silent exponential backoff when offline.

const LAST_SYNC_KEY = 'writer-studio-last-sync';
const JOURNAL_RESYNC_KEY = 'writer-studio-journal-resync-v1';
const INTERVAL_MS = 20_000;
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 120_000;

export type SyncStatus = 'synced' | 'pending' | 'offline';

let status: SyncStatus = 'pending';
const statusListeners = new Set<(s: SyncStatus) => void>();

function setStatus(next: SyncStatus): void {
  if (next === status) return;
  status = next;
  statusListeners.forEach(l => l(status));
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: (s: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  listener(status);
  return () => {
    statusListeners.delete(listener);
  };
}

function getLastSyncAt(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}
function setLastSyncAt(value: string): void {
  localStorage.setItem(LAST_SYNC_KEY, value);
}

// Map of id -> updatedAt across all collections, used to mark clean only the
// records that were not re-edited while the request was in flight.
function stampMap(records: DirtyRecords): Map<string, string> {
  const map = new Map<string, string>();
  (['projects', 'storyPlans', 'sessions', 'drafts', 'journalEntries', 'drawers'] as const).forEach(k => {
    for (const r of records[k]) map.set(r.id, r.updatedAt);
  });
  return map;
}

// One-time journal backfill (journal-resync patch). The new server's /sync pull
// always carries a `journalEntries` key; the old server never did — so that key's
// presence is the signal that we're talking to the post-D2 server. On the first
// such response, re-dirty every local journal entry so the pre-D2 backlog (each
// flagged "synced" locally but never actually stored) pushes once. The
// localStorage flag makes it fire at most once per device; LWW + stable ids make
// re-pushing a row the server already has a no-op.
//
// KEPT, deliberately, after item 89 persisted the dirty set — the two address
// DISJOINT populations and neither subsumes the other. Persistent dirty saves
// rows that ARE dirty across a reload; this backfill saves rows that are
// wrongly CLEAN, marked synced by a client talking to a server that dropped
// them. A clean row is invisible to a dirty-set fix by construction, so
// retiring this guard would permanently strand the exact backlog it was
// written for on any device that has not yet run it.
// What item 89 DOES retire is this key's accidental second job: it was the
// only lever for recovering a freshly-stranded page, and clearing it by hand
// was the recovery Fable had to run on 2026-08-02. Newly stranded rows now
// push themselves on the next connection, so no one clears this again.
// Standing asymmetry, recorded rather than silently fixed: the backfill covers
// `journalEntries` ONLY. Stranding was never journal-specific — projects,
// drawers, drafts, sessions and storyPlans stranded the same way with no
// recovery path at all, manual or otherwise. Persistent dirty is what covers
// those six; this guard is not, and was never, the general answer.
function maybeBackfillJournal(pull: unknown): void {
  try {
    if (localStorage.getItem(JOURNAL_RESYNC_KEY)) return;
    if (!pull || typeof pull !== 'object' || !('journalEntries' in pull)) return;
    markAllJournalEntriesDirty();
    localStorage.setItem(JOURNAL_RESYNC_KEY, '1');
    // Push the re-dirtied backlog promptly, once this cycle settles (inFlight clears).
    setTimeout(() => { void syncOnce(); }, 0);
  } catch {
    // Backfill is best-effort; a storage hiccup must never break sync.
  }
}

let running = false;
let inFlight = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;
let backoffStep = 0;

function scheduleBackoff(): void {
  const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** backoffStep);
  backoffStep += 1;
  if (backoffTimer) clearTimeout(backoffTimer);
  backoffTimer = setTimeout(() => {
    void syncOnce();
  }, delay);
}

export async function syncOnce(fullPull = false): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  setStatus('pending');

  const dirty = getDirtyRecords();
  const pushedStamps = stampMap(dirty);
  const lastSyncAt = fullPull ? null : getLastSyncAt();

  try {
    const resp = await apiSync({ lastSyncAt, push: dirty });
    applyRemoteRecords(resp.pull);
    maybeBackfillJournal(resp.pull);

    // Clean only records unchanged since we pushed them.
    const stillDirty = stampMap(getDirtyRecords());
    const cleanIds: string[] = [];
    pushedStamps.forEach((ts, id) => {
      const current = stillDirty.get(id);
      if (current === undefined || current === ts) cleanIds.push(id);
    });
    markClean(cleanIds);

    setLastSyncAt(resp.serverTime);
    backoffStep = 0;
    if (backoffTimer) {
      clearTimeout(backoffTimer);
      backoffTimer = null;
    }
    setStatus('synced');
  } catch {
    setStatus('offline');
    scheduleBackoff();
  } finally {
    inFlight = false;
  }
}

function onOnline(): void {
  void syncOnce();
}
function onVisible(): void {
  if (document.visibilityState === 'visible') void syncOnce();
}

// Start syncing after login. Immediately does a full pull (lastSyncAt: null),
// then runs every 20s while the tab is visible, plus on reconnect and on
// returning to the tab.
export async function startSync(): Promise<void> {
  if (running) return;
  running = true;
  await syncOnce(true);
  intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') void syncOnce();
  }, INTERVAL_MS);
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
}

export function stopSync(): void {
  running = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (backoffTimer) {
    clearTimeout(backoffTimer);
    backoffTimer = null;
  }
  backoffStep = 0;
  window.removeEventListener('online', onOnline);
  document.removeEventListener('visibilitychange', onVisible);
  setStatus('pending');
}

export function clearLastSyncAt(): void {
  localStorage.removeItem(LAST_SYNC_KEY);
}
