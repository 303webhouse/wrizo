import { getDirtyRecords, markClean, applyRemoteRecords, markAllJournalEntriesDirty, getJournalEntries, getSystemKind, type DirtyRecords } from './persistence';
import { getClientBuild, buildIsStale } from './clientBuild';
import { isStaleClient, markStaleClient } from './staleClient';
import { apiSync, SyncHttpError, type SyncResponse } from './api';
import { boardName } from './entryText';
import { subscribeStorageFailureEvent } from './storageHealth';

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

// ITEM 224(a), SYNC INTEGRITY — like item 203's quarantine (TooLargeRecord,
// above), but a DIFFERENT population and a different reason: these records
// were SENT and the server itself refused to store them (malformed, or the
// insert threw) — not withheld for their size. Unlike a true quarantine,
// a rejected record is NOT excluded from future sends: its cause may be
// transient (a DB hiccup) or may clear if the writer edits it again, so it
// stays dirty and keeps trying on the ordinary cadence. This list is only
// the WRITER'S OWN NOTICE that something is stuck, named — it never
// prevents a retry the way `isTooLarge` does.
export interface RejectedRecord { id: string; title: string }
let rejectedRecords: readonly RejectedRecord[] = [];
const rejectedListeners = new Set<(list: readonly RejectedRecord[]) => void>();
/** Records the server refused this push: still dirty, still safe on this device, retried on the ordinary cadence. */
export function getRejectedRecords(): readonly RejectedRecord[] { return rejectedRecords; }
export function subscribeRejected(listener: (list: readonly RejectedRecord[]) => void): () => void {
  rejectedListeners.add(listener);
  listener(rejectedRecords);
  return () => { rejectedListeners.delete(listener); };
}
function setRejected(next: RejectedRecord[]): void {
  const same = next.length === rejectedRecords.length && next.every((r, i) => r.id === rejectedRecords[i].id);
  if (same) return;
  rejectedRecords = next;
  rejectedListeners.forEach(l => l(rejectedRecords));
}
// B10.1 (SAFETY NET) - a full pull that CARRIED live pages but left none in the cache. Counts only, never titles or text. It is
// raised only after one retry through syncOnce(true) has failed to fix it, and it clears the next time a pull lands normally.
export interface PullDiagnostic { pulled: number; live: number }
let pullDiagnostic: PullDiagnostic | null = null;
const pullDiagnosticListeners = new Set<(d: PullDiagnostic | null) => void>();
export function getPullDiagnostic(): PullDiagnostic | null { return pullDiagnostic; }
export function subscribePullDiagnostic(listener: (d: PullDiagnostic | null) => void): () => void {
  pullDiagnosticListeners.add(listener);
  listener(pullDiagnostic);
  return () => { pullDiagnosticListeners.delete(listener); };
}
function setPullDiagnostic(next: PullDiagnostic | null): void {
  if (next === null && pullDiagnostic === null) return;
  if (next && pullDiagnostic && next.pulled === pullDiagnostic.pulled && next.live === pullDiagnostic.live) return;
  pullDiagnostic = next;
  pullDiagnosticListeners.forEach(l => l(pullDiagnostic));
}

function rejectedIdSet(rejected: SyncResponse['rejected']): Set<string> {
  if (!rejected) return new Set();
  const ids = new Set<string>();
  for (const list of Object.values(rejected)) for (const id of list ?? []) ids.add(id);
  return ids;
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

// Clean only the records that were not re-edited while the request was in
// flight AND that the server actually stored. ITEM 224(a) — `rejectedIds`
// is new: a record the server refused is excluded here even though the
// request itself succeeded (200), so it stays dirty and is sent again next
// cycle instead of being marked clean and silently lost.
function cleanBatch(batch: PushItem[], rejectedIds: ReadonlySet<string> = EMPTY_SET): void {
  const still = stampMap(getDirtyRecords());
  markClean(batch.filter(i => {
    if (rejectedIds.has(i.rec.id)) return false;
    const cur = still.get(i.rec.id); return cur === undefined || cur === i.rec.updatedAt;
  }).map(i => i.rec.id));
}
const EMPTY_SET: ReadonlySet<string> = new Set();

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
// SYNC GENERATION — bumped by stopSync() (every sign-out, and App's unmount). A sync that was already waiting on the
// network when that happened (a stalled push the sign-out gave up on, say) must not, when its answer finally arrives,
// write the PREVIOUS session's records, cursor or status into a device that has since been wiped, or into the next
// writer's account. It captures the generation at entry and checks it after every await, before any write.
let generation = 0;
const STALE = Symbol('stale sync');
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

// B10.1 - THE FIRST PULL OF THIS SESSION. A sign-in used to choose "resume or new page" the instant the login answered, before
// the account's pages had arrived (about 630 ms for 177 pages on the local rig) - so a returning writer landed on a blank page,
// and the first-run ritual could not tell a new account from an old one. whenFirstPulled() lets those doors wait, with a cap.
//
// PER SESSION, and tied to the generation: stopSync() (every sign-out) retires it, so a second sign-in can never resolve from
// the first one's pull. "Done" means a pull with a NULL cursor (the whole account) succeeded - the start-up pull, or a later
// backoff retry that still had no cursor.
interface FirstPull { gen: number; done: boolean; capped: boolean; promise: Promise<'pulled' | 'failed'>; settle: (r: 'pulled' | 'failed') => void }
let firstPull: FirstPull | null = null;

function beginFirstPull(gen: number): void {
  let settle!: (r: 'pulled' | 'failed') => void;
  const promise = new Promise<'pulled' | 'failed'>(res => { settle = res; });
  firstPull = { gen, done: false, capped: false, promise, settle };
}
function noteFullPull(gen: number): void {
  if (firstPull && firstPull.gen === gen && !firstPull.done) { firstPull.done = true; firstPull.settle('pulled'); }
}
/** True once this session's first whole-account pull has landed. False before it, after a failure, and outside a session. */
export function firstPullDone(): boolean { return !!firstPull && firstPull.done; }
/** Waits for this session's first pull, but never longer than capMs. 'failed' also covers "no session" and "the session ended". */
export async function whenFirstPulled(capMs: number): Promise<'pulled' | 'capped' | 'failed'> {
  const fp = firstPull;
  if (!fp) return 'failed';
  if (fp.done) return 'pulled';
  // A writer waits for the cap ONCE per session: the sign-in's landing and the Write door behind it must not each make them wait.
  if (fp.capped) return 'capped';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cap = new Promise<'capped'>(res => { timer = setTimeout(() => res('capped'), capMs); });
  try {
    const r = await Promise.race([fp.promise, cap]);
    if (r === 'capped') fp.capped = true;
    return r;
  } finally { if (timer) clearTimeout(timer); }
}

// B10.1 (SAFETY NET) - once per session, retried through syncOnce(true); the second miss is recorded, not retried again.
let emptyPullRetried = false;
function verifyPullLanded(pull: SyncResponse['pull'], fullPull: boolean, gen: number): void {
  if (!fullPull) return;
  const carried = (pull.journalEntries ?? []).filter(e => !e.deletedAt && !getSystemKind(e)).length;
  if (carried === 0) { setPullDiagnostic(null); return; }
  const live = getJournalEntries().filter(e => !getSystemKind(e)).length;
  if (live > 0) { emptyPullRetried = false; setPullDiagnostic(null); return; }
  if (!emptyPullRetried) {
    emptyPullRetried = true;
    setTimeout(() => { if (gen === generation) void syncOnce(true); }, 0);
    return;
  }
  setPullDiagnostic({ pulled: carried, live });
}

// B10.1 (THE STALE-CLIENT GUARD) - the server names the build it serves in every reply. A tab that finds a DIFFERENT one was
// loaded before a deploy: it stops syncing at once (stopSync retires everything in flight, so nothing after this check applies
// or writes), goes read-only (persistence holds its writes) and asks to be reloaded. Its unsent edits are kept; the new build
// sends them after the reload. Skipped when either side does not know its build (dev, tests, Electron - see clientBuild.ts).
function checkBuild(resp: { build?: string }): void {
  if (buildIsStale(getClientBuild(), resp.build)) {
    markStaleClient();
    stopSync();
    throw STALE;
  }
}

type SyncRun = 'ok' | 'failed' | 'skipped' | 'stale';

export async function syncOnce(fullPull = false): Promise<void> {
  await runSync(fullPull);
}

async function runSync(fullPull: boolean): Promise<SyncRun> {
  if (isStaleClient()) return 'stale';
  if (inFlight) return 'skipped';
  inFlight = true;
  const gen = generation;
  // Throws STALE if a sign-out happened while this run was waiting; the catch below turns that into a silent return.
  const live = (): void => { if (gen !== generation) throw STALE; };
  setStatus('pending');

  const cursor = fullPull ? null : getLastSyncAt();

  try {
    const items = collect(getDirtyRecords());
    const big = items.filter(isTooLarge);
    const sendable = items.filter(i => !isTooLarge(i));
    // Named before any network: the writer is told even if this sync then fails for another reason.
    setTooLarge(big.map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));
    const quarantined: PushItem[] = [];
    // ITEM 224(a) — looked up by id as each response names its own rejected
    // ids, so the notice can carry each one's own title (the server only
    // ever names an id; it has no reason to know a record's display title).
    const itemById = new Map(items.map(i => [i.rec.id, i] as const));
    const rejectedThisSync: PushItem[] = [];
    const noteRejections = (rejected: SyncResponse['rejected']): Set<string> => {
      const ids = rejectedIdSet(rejected);
      for (const id of ids) { const item = itemById.get(id); if (item) rejectedThisSync.push(item); }
      return ids;
    };

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
      live();
      await pushOnly(batch.slice(mid));
    };
    const pushOnly = async (batch: PushItem[]): Promise<void> => {
      // The limit may have been learned since this batch was planned.
      if (batch.length === 1 && isTooLarge(batch[0])) { quarantined.push(batch[0]); return; }
      try {
        const r = await apiSync({ lastSyncAt: null, push: payloadOf(batch), pull: false });
        live();
        checkBuild(r);
        cleanBatch(batch, noteRejections(r.rejected));
      } catch (e) {
        if (e instanceof SyncHttpError && e.status === 413) { live(); await onRefused(batch); return; }
        throw e;
      }
    };

    const chunks = pack(sendable);
    let resp: SyncResponse | null = null;
    if (chunks.length === 1) {
      // The common case, and byte-for-byte the old shape: ONE request carries the push AND the pull.
      try {
        resp = await apiSync({ lastSyncAt: cursor, push: payloadOf(chunks[0]) });
        live();
        checkBuild(resp);
        applyRemoteRecords(resp.pull);
        maybeBackfillJournal(resp.pull);
        cleanBatch(chunks[0], noteRejections(resp.rejected));
      } catch (e) {
        if (!(e instanceof SyncHttpError && e.status === 413)) throw e;
        live();
        resp = null;
        await onRefused(chunks[0]);
      }
    } else {
      for (const chunk of chunks) { await pushOnly(chunk); live(); }
    }
    if (!resp) {
      // Nothing to push, or the push went out as push-only chunks: one final request pulls.
      resp = await apiSync({ lastSyncAt: cursor, push: {} });
      live();
      checkBuild(resp);
      applyRemoteRecords(resp.pull);
      maybeBackfillJournal(resp.pull);
    }

    live();
    setLastSyncAt(resp.serverTime);
    // B10.1 - after the cursor, with no await between: both only read what the apply above left in the cache.
    verifyPullLanded(resp.pull, cursor === null, gen);
    if (cursor === null) noteFullPull(gen);
    setTooLarge([...big, ...quarantined].map(i => ({ id: i.rec.id, title: titleFor(i), bytes: i.bytes })));
    setRejected(rejectedThisSync.map(i => ({ id: i.rec.id, title: titleFor(i) })));
    backoffStep = 0;
    if (backoffTimer) {
      clearTimeout(backoffTimer);
      backoffTimer = null;
    }
    setStatus('synced');
    return 'ok';
  } catch (e) {
    // A stale run writes nothing and schedules nothing: the session it belonged to is over.
    if (e === STALE || gen !== generation) return 'stale';
    setStatus('offline');
    scheduleBackoff();
    return 'failed';
  } finally {
    // Only the CURRENT generation owns the flag. stopSync() already released it, and a newer run may hold it now.
    if (gen === generation) inFlight = false;
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
//
// B10.1 - the generation is captured BEFORE the first await. A sign-out during that first sync calls stopSync(), which bumps it;
// without this check the code below would still run afterwards and install a 20 s timer and two listeners for a session that
// had already ended (the next sign-in would then have two timers). A stale tab never starts.
export async function startSync(): Promise<void> {
  if (running || isStaleClient()) return;
  running = true;
  const gen = generation;
  beginFirstPull(gen);
  const result = await runSync(true);
  if (gen !== generation) return;
  if (result !== 'ok' && firstPull && firstPull.gen === gen) firstPull.settle('failed');
  intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') void syncOnce();
  }, INTERVAL_MS);
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
}

export function stopSync(): void {
  running = false;
  // Retire any sync still waiting on the network, and release the flag it was holding so the next session's first
  // sync is not skipped behind a request that may never answer.
  generation += 1;
  inFlight = false;
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
  setRejected([]);
  setPullDiagnostic(null);
  emptyPullRetried = false;
  // B10.1 - the session's first pull ends with the session: anyone still waiting on it is released as 'failed', and the next
  // session starts its own.
  if (firstPull) { firstPull.settle('failed'); firstPull = null; }
  setStatus('pending');
}

export function clearLastSyncAt(): void {
  localStorage.removeItem(LAST_SYNC_KEY);
}

// STORAGE-FULL STEP 1 — "when online, push at once so the edits reach the account" (Fable, 2026-09-30). The moment
// ANY collection starts failing to write locally, push right away rather than wait for the 20s tick: the cache still
// holds the edit that could not be written to disk, so a reload or crash before the next periodic sync would lose it
// twice over instead of once. `syncOnce()`'s own `inFlight` guard makes this call a no-op if a push is already under
// way, and if the device is actually offline `syncOnce()` fails exactly as it always has (`setStatus('offline')` +
// backoff) — this adds no new failure mode, only an earlier attempt. Module-level (not gated on `startSync()`/
// `running`) to match `App.tsx`'s own direct call to `syncOnce()` for its best-effort final push — calling it before
// a session exists just meets an unauthenticated request that fails quietly, the same as any sync tick would.
subscribeStorageFailureEvent(() => { void syncOnce(); });
