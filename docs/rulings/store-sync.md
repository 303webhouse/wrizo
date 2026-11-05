# Rulings: `apps/desktop/src/store/sync.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[sync §n]` points here.

## sync §1

From `apps/desktop/src/store/sync.ts`, line 83 at `e2898deb` (the comment that stays: "the server's /api/sync body limit (index.ts SYNC_BODY_LIMIT_BYTES)").

```ts
// the server's /api/sync body limit (index.ts SYNC_BODY_LIMIT_BYTES) - was 5 MiB before item 203's P3
```

## sync §2

From `apps/desktop/src/store/sync.ts`, line 113 at `e2898deb` (the comment that stays: "records the server refused to store: unlike a too-large record they stay dirty and keep retrying; this list is only the writer's notice").

```ts
// ITEM 224(a), SYNC INTEGRITY — like item 203's quarantine (TooLargeRecord,
// above), but a DIFFERENT population and a different reason: these records
// were SENT and the server itself refused to store them (malformed, or the
// insert threw) — not withheld for their size. Unlike a true quarantine,
// a rejected record is NOT excluded from future sends: its cause may be
// transient (a DB hiccup) or may clear if the writer edits it again, so it
// stays dirty and keeps trying on the ordinary cadence. This list is only
// the WRITER'S OWN NOTICE that something is stuck, named — it never
// prevents a retry the way `isTooLarge` does.
```

## sync §3

From `apps/desktop/src/store/sync.ts`, line 222 at `e2898deb` (the comment that stays: "the one-time journal backfill re-dirties every local journal entry on the first post-D2 server response; kept beside the persisted dirty set because the two cover disjoint populations (wrongly clean rows vs dirty ones)").

```ts
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
```

## sync §4

From `apps/desktop/src/store/sync.ts`, line 527 at `e2898deb` (the comment that stays: "when a local write starts failing, push at once (the cache holds the only copy); syncOnce's inFlight guard makes it a no-op if a push is under way").

```ts
// STORAGE-FULL STEP 1 — "when online, push at once so the edits reach the account" (Fable, 2026-09-30). The moment
// ANY collection starts failing to write locally, push right away rather than wait for the 20s tick: the cache still
// holds the edit that could not be written to disk, so a reload or crash before the next periodic sync would lose it
// twice over instead of once. `syncOnce()`'s own `inFlight` guard makes this call a no-op if a push is already under
// way, and if the device is actually offline `syncOnce()` fails exactly as it always has (`setStatus('offline')` +
// backoff) — this adds no new failure mode, only an earlier attempt. Module-level (not gated on `startSync()`/
// `running`) to match `App.tsx`'s own direct call to `syncOnce()` for its best-effort final push — calling it before
// a session exists just meets an unauthenticated request that fails quietly, the same as any sync tick would.
```
