// a failed save is never silent: flush() still never throws into a write path, and this turns the swallowed exception into a per-collection failed flag (cleared by a later success), an edge event for sync, and the writer's notice [storageHealth §1]

// --- per-collection failure -------------------------------------------------
const failed = new Set<string>();
const failedListeners = new Set<(names: readonly string[]) => void>();
const failureEventListeners = new Set<() => void>();

export function getStorageFailedCollections(): readonly string[] {
  return [...failed];
}

export function subscribeStorageFailed(listener: (names: readonly string[]) => void): () => void {
  failedListeners.add(listener);
  listener(getStorageFailedCollections());
  return () => { failedListeners.delete(listener); };
}

/** Fires once on the OK -> FAILED transition of the FIRST collection to start failing — not on every failed write
 *  while it stays that way (the cadence sync's own `inFlight` guard and 20s tick already cover the rest). This is
 *  the signal that closes the loss window: push what memory still holds before the tab might die holding it alone. */
export function subscribeStorageFailureEvent(listener: () => void): () => void {
  failureEventListeners.add(listener);
  return () => { failureEventListeners.delete(listener); };
}

function notifyFailed(): void {
  const snapshot = getStorageFailedCollections();
  failedListeners.forEach((l) => {
    try { l(snapshot); } catch { /* a misbehaving listener must never break a write path */ }
  });
}

/** Called from `flush()`'s catch. Idempotent while a collection stays failed — repeated calls for the same name do
 *  not re-notify or re-fire the edge event, so continuing to type into a full device does not flood either. */
export function reportFlushFailed(name: string): void {
  if (failed.has(name)) return;
  const wasEmpty = failed.size === 0;
  failed.add(name);
  notifyFailed();
  if (wasEmpty) failureEventListeners.forEach((l) => { try { l(); } catch { /* ditto */ } });
}

/** Called from `flush()`'s try branch. A no-op (no re-notify) unless this collection was actually in the failed set —
 *  so a healthy collection's every successful write does not walk the listener set for nothing. */
export function reportFlushOk(name: string): void {
  if (!failed.delete(name)) return;
  notifyFailed();
}

// --- near-full, once -----------------------------------------------------
// A CONSERVATIVE FLOOR, NOT A MEASURED QUOTA. Real localStorage quotas vary by browser (Chrome/Edge give an origin
// roughly 5-10MB; Firefox and Safari differ again), and there is no portable "how much is left" API for localStorage
// itself (unlike IndexedDB's StorageManager.estimate()). 5MB is the figure the Publish pass measured as the point
// saves silently stopped, so it is used here as the DANGER floor, not a claim about the actual ceiling on any given
// browser — a device with a larger real quota gets an early, harmless heads-up; one with a smaller one is warned in
// time either way.
export const STORAGE_ASSUMED_QUOTA_BYTES = 5 * 1024 * 1024;
const WARN_FRACTION = 0.8;
// Hysteresis: dropping back BELOW this (not merely below WARN_FRACTION) re-arms the one-time warning, so freeing a
// little space right at the 80% line does not immediately re-prime it — the writer has to make real room.
const REARM_FRACTION = 0.7;
const NEAR_WARNED_KEY = 'wrizo-storage-near-warned';

function getWarnedEver(): boolean {
  try { return localStorage.getItem(NEAR_WARNED_KEY) === '1'; } catch { return false; }
}
function setWarnedEver(v: boolean): void {
  try { if (v) localStorage.setItem(NEAR_WARNED_KEY, '1'); else localStorage.removeItem(NEAR_WARNED_KEY); }
  catch { /* best-effort; a full device may not have room even for this one-byte flag — the in-memory state still governs this session */ }
}

let nearFull = false;
const nearFullListeners = new Set<(near: boolean) => void>();

export function getStorageNearFull(): boolean { return nearFull; }
export function subscribeStorageNearFull(listener: (near: boolean) => void): () => void {
  nearFullListeners.add(listener);
  listener(nearFull);
  return () => { nearFullListeners.delete(listener); };
}
function setNearFull(next: boolean): void {
  if (next === nearFull) return;
  nearFull = next;
  nearFullListeners.forEach((l) => { try { l(nearFull); } catch { /* ditto */ } });
}

/** Called from `flush()` with the CURRENT total bytes across the app's own storage keys (persistence.ts computes this
 *  itself, throttled — see maybeReportUsage there). Three regions, and the boundary between them is where the writer
 *  actually reads about it (this file never touches the DOM — see syncNotice.ts for the words):
 *    below REARM_FRACTION        the floor is re-armed if it had tripped; the notice is quiet
 *    [REARM_FRACTION, WARN)      the hysteresis band — state is left exactly as it was, on purpose
 *    WARN_FRACTION and above     shown ONCE EVER (persisted): the first crossing this device has ever made sets
 *                                nearFull for the rest of THIS session (so the quiet corner notice keeps saying it
 *                                while the writer works, matching every other status in that corner) but a later
 *                                session that boots already above the line, already warned, and never having dropped
 *                                back below REARM_FRACTION in between, stays quiet — the writer was told once. */
export function reportStorageUsage(totalBytes: number): void {
  const fraction = totalBytes / STORAGE_ASSUMED_QUOTA_BYTES;
  if (fraction < REARM_FRACTION) {
    if (getWarnedEver()) setWarnedEver(false);
    setNearFull(false);
    return;
  }
  if (fraction >= WARN_FRACTION && !nearFull && !getWarnedEver()) {
    setWarnedEver(true);
    setNearFull(true);
  }
}

// Test/inspection seam (this file's own convention; never read by app code) — lets a harness drive and read every
// piece of state above without reaching into module-private variables.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoStorageHealth?: unknown }).wrizoStorageHealth = {
    failed: getStorageFailedCollections,
    nearFull: getStorageNearFull,
    warnedEver: getWarnedEver,
    quotaBytes: STORAGE_ASSUMED_QUOTA_BYTES,
  };
}
