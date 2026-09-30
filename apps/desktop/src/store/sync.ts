import { getDirtyRecords, markClean, applyRemoteRecords, markAllJournalEntriesDirty, type DirtyRecords } from './persistence';
import { apiSync, SyncHttpError, type SyncResponse } from './api';
import { boardName } from './entryText';

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


// ITEM 203 - A PUSH IS CHUNKED, AND A RECORD THAT CANNOT TRAVEL IS NAMED, NOT RETRIED FOREVER.
//
// It used to send EVERY dirty record whole in ONE body. The server refuses a body over 5 MiB, and (measured, S0) the
// client treated the refusal as "offline": the fat record stayed dirty, the whole push was re-sent in full on every
// backoff (~180 MB/hour at the cap), and a tiny unrelated page written afterwards was refused WITH it - one fat record
// wedged every other edit on the device, and every other device never saw any of it.
//
// NOW: the dirty records are packed into chunks of ~1 MB (smallest first, so a small edit is never behind a big one),
// each sent as its own request; a chunk's records are cleaned the moment it lands, so progress survives a later
// failure. Only the LAST request pulls (`pull: false` on the rest), so a chunked sync still moves the cursor once. A
// single record whose own size cannot fit in one request is NEVER SENT: it is listed (getTooLargeRecords) and named to
// the writer (SyncIndicator), and every other record syncs around it. The list is rebuilt from the dirty set on every
// sync, so a record that shrinks - the writer erases strokes - goes out by itself.
//
// THE LIMIT IS LEARNED, NOT ONLY ASSUMED. REQUEST_LIMIT_BYTES mirrors the server's /api/sync body limit (16 MiB since P3; it was
// 5 MiB), and production was probed (docs/evidence/item203/proxy-*): nothing upstream of Express refuses a body up to 64 MiB. But if a 413
// ever arrives for a body the client thought was fine (a lower proxy, a lowered limit), a multi-record chunk is split in
// half and retried, and a lone record lowers `learnedLimitBytes` to its own size and is listed. The lesson is held in
// memory only: it is re-learned on the next launch, at the price of at most one refused upload per fat record.
const REQUEST_LIMIT_BYTES = 16 * 1024 * 1024;  // the server's /api/sync body limit (index.ts SYNC_BODY_LIMIT_BYTES) - was 5 MiB before item 203's P3
const ENVELOPE_BYTES = 1024;                    // {"lastSyncAt":...,"push":{...},"pull":false} and its commas: generous
const CHUNK_TARGET_BYTES = 1024 * 1024;         // small records ride together up to this
let learnedLimitBytes = Number.POSITIVE_INFINITY;
const effectiveLimit = (): number => Math.min(REQUEST_LIMIT_BYTES, learnedLimitBytes);
/** Forget a learned limit (a new session, or a test). */
export function resetLearnedLimit(): void { learnedLimitBytes = Number.POSITIVE_INFINITY; }

type CollKey = keyof DirtyRecords;
const COLLS: CollKey[] = ['projects', 'storyPlans', 'sessions', 'drafts', 'journalEntries', 'drawers'];
interface PushItem { coll: CollKey; rec: { id: string; updatedAt: string }; bytes: number }
const encoder = new TextEncoder();

export interface TooLargeRecord { id: string; title: string; bytes: number }
let tooLarge: readonly TooLargeRecord[] = [];
const tooLargeListeners = new Set<(list: readonly TooLargeRecord[]) => void>();
/** The records too large to sync right now: still safe on this device, not yet on any other. */
export function getTooLargeRecords(): readonly TooLargeRecord[] { return tooLarge; }
export function subscribeTooLarge(listener: (list: readonly TooLargeRecord[]) => void): () => void {
  tooLargeListeners.add(listener);
  listener(tooLarge);
  return () => { tooLargeListeners.delete(listener); };
}
function setTooLarge(next: TooLargeRecord[]): void {
  const same = next.length === tooLarge.length && next.every((r, i) => r.id === tooLarge[i].id && r.bytes === tooLarge[i].bytes);
  if (same) return;
  tooLarge = next;
  tooLargeListeners.forEach(l => l(tooLarge));
}

function titleFor(item: PushItem): string {
  const r = item.rec as unknown as Record<string, unknown>;
  if (item.coll === 'journalEntries') {
    const hasInk = Array.isArray(r.strokes) && r.strokes.length > 0;
    return boardName(typeof r.text === 'string' ? r.text : '', hasInk ? 'A sketch' : 'Untitled');
  }
  if (item.coll === 'projects' && typeof r.title === 'string' && r.title.trim()) return r.title.trim();
  if (item.coll === 'drawers' && typeof r.name === 'string' && r.name.trim()) return r.name.trim();
  return 'Untitled';
}

function collect(dirty: DirtyRecords): PushItem[] {
  const items: PushItem[] = [];
  for (const coll of COLLS) {
    for (const rec of dirty[coll] as unknown as PushItem['rec'][]) {
      items.push({ coll, rec, bytes: encoder.encode(JSON.stringify(rec)).length + 1 }); // +1: the comma between records
    }
  }
  return items;
}
const isTooLarge = (i: PushItem): boolean => i.bytes + ENVELOPE_BYTES > effectiveLimit();

function payloadOf(batch: PushItem[]): Partial<DirtyRecords> {
  const out: Record<string, unknown[]> = {};
  for (const i of batch) (out[i.coll] ??= []).push(i.rec);
  return out as Partial<DirtyRecords>;
}

// Smallest first, so a small edit is never queued behind a big one; a record over the chunk target rides alone.
function pack(items: PushItem[]): PushItem[][] {
  const sorted = items.slice().sort((a, b) => a.bytes - b.bytes);
  const chunks: PushItem[][] = [];
  let cur: PushItem[] = [];
  let size = 0;
  for (const it of sorted) {
    if (cur.length > 0 && size + it.bytes > CHUNK_TARGET_BYTES) { chunks.push(cur); cur = []; size = 0; }
    cur.push(it);
    size += it.bytes;
  }
  if (cur.length > 0) chunks.push(cur);
  return chunks;
}

// Clean only the records that were not re-edited while the request was in flight.
function cleanBatch(batch: PushItem[]): void {
  const still = stampMap(getDirtyRecords());
  markClean(batch.filter(i => { const cur = still.get(i.rec.id); return cur === undefined || cur === i.rec.updatedAt; }).map(i => i.rec.id));
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

  const cursor = fullPull ? null : getLastSyncAt();

  try {
    const items = collect(getDirtyRecords());
    const big = items.filter(isTooLarge);
    const sendable = items.filter(i => !isTooLarge(i));
    // Named before any network: the writer is told even if this sync then fails for another reason.
    setTooLarge(big.map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));
    const quarantined: PushItem[] = [];

    // A lone record the server refused: remember the limit it revealed, and list it instead of re-sending it.
    const quarantine = (item: PushItem): void => {
      learnedLimitBytes = Math.min(learnedLimitBytes, item.bytes + ENVELOPE_BYTES - 1);
      quarantined.push(item);
    };
    // A refused batch: halve it and try each half, or, if it is a single record, quarantine it.
    const onRefused = async (batch: PushItem[]): Promise<void> => {
      if (batch.length === 1) { quarantine(batch[0]); return; }
      const mid = batch.length >> 1;
      await pushOnly(batch.slice(0, mid));
      await pushOnly(batch.slice(mid));
    };
    const pushOnly = async (batch: PushItem[]): Promise<void> => {
      // The limit may have been learned since this batch was planned.
      if (batch.length === 1 && isTooLarge(batch[0])) { quarantined.push(batch[0]); return; }
      try {
        await apiSync({ lastSyncAt: null, push: payloadOf(batch), pull: false });
        cleanBatch(batch);
      } catch (e) {
        if (e instanceof SyncHttpError && e.status === 413) { await onRefused(batch); return; }
        throw e;
      }
    };

    const chunks = pack(sendable);
    let resp: SyncResponse | null = null;
    if (chunks.length === 1) {
      // The common case, and byte-for-byte the old shape: ONE request carries the push AND the pull.
      try {
        resp = await apiSync({ lastSyncAt: cursor, push: payloadOf(chunks[0]) });
        applyRemoteRecords(resp.pull);
        maybeBackfillJournal(resp.pull);
        cleanBatch(chunks[0]);
      } catch (e) {
        if (!(e instanceof SyncHttpError && e.status === 413)) throw e;
        resp = null;
        await onRefused(chunks[0]);
      }
    } else {
      for (const chunk of chunks) await pushOnly(chunk);
    }
    if (!resp) {
      // Nothing to push, or the push went out as push-only chunks: one final request pulls.
      resp = await apiSync({ lastSyncAt: cursor, push: {} });
      applyRemoteRecords(resp.pull);
      maybeBackfillJournal(resp.pull);
    }

    setLastSyncAt(resp.serverTime);
    setTooLarge([...big, ...quarantined].map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));
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
  // ITEM 203 - what was learned about one account's records, and the names of its too-large pages, must not outlive it.
  learnedLimitBytes = Number.POSITIVE_INFINITY;
  setTooLarge([]);
  setStatus('pending');
}

export function clearLastSyncAt(): void {
  localStorage.removeItem(LAST_SYNC_KEY);
}
