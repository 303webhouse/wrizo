# Rulings: `apps/desktop/src/store/storageHealth.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[storageHealth §n]` points here.

## storageHealth §1

From `apps/desktop/src/store/storageHealth.ts`, line 1 at `7f1c6a84` (the comment that stays: "a failed save is never silent: flush() still never throws into a write path, and this turns the swallowed exception into a per-collection failed flag (cleared by a later success), an edge event for sync, and the writer's notice").

```ts
// STORAGE-FULL, STEP 1 — A FAILED SAVE IS NEVER SILENT (Nick, 2026-09-30, on this being told to him as urgent: "Yes.").
//
// persistence.ts's `flush()` has always caught a `localStorage.setItem` failure and dropped it, with its own comment
// saying exactly what it does: "Storage full/unavailable — never throw into a write path." True, and still right —
// but the writer was never told, and the debounced write it silently swallowed is gone for good if this device's
// storage stays full. This module is the OTHER HALF of that catch. It turns a swallowed exception into three things
// the writer and the sync engine can act on:
//   1. a per-collection FAILED flag, cleared the moment a LATER flush of that same collection succeeds — so the
//      notice is never a fossil (it reflects "is this failing right now", not "did this ever fail once");
//   2. an EDGE EVENT, fired once on the empty -> non-empty transition of the failed set, so sync.ts can push the
//      in-memory copy to the account AT ONCE rather than wait for the next periodic tick (up to 20s) or lose it to a
//      reload/crash before then — the cache still holds the edit; only this device's own copy of it could not be
//      written;
//   3. a ONE-TIME near-full warning at ~80% of an assumed 5MB budget (the figure the Publish pass measured as roughly
//      where saves silently stop: docs/publish/pub-committee-pass.md §11), so a writer sees it coming rather than
//      discovering it mid-sentence. "Once" means once ever, persisted — not a banner that nags every session while
//      the writer is near the ceiling; hysteresis re-arms it after they free space, so a later climb warns again.
//
// PURE STATE + PUB/SUB. persistence.ts is the only writer (reportFlushFailed / reportFlushOk / reportStorageUsage);
// sync.ts (subscribeStorageFailureEvent) and the sync notice (subscribeStorageFailed / subscribeStorageNearFull) are
// the readers. Neither persistence.ts nor sync.ts imports the other because of this module — it is the seam between
// them, exactly the shape `syncNotice.ts` already uses for the too-large records.
```
