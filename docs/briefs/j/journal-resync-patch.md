# Journal re-sync — one-time backfill of pre-D2 entries (CC patch)

**Branch:** `journal-resync-fix` off `main` (where D2 landed, 25d43b0).
**Depends on:** D2's `journal_entries` server sync (table + upsert + pull). Lands with or just before the prod deploy.

## Why
D2 makes journal entries sync server-side, but only covers entries created/edited AFTER the deploy. Existing entries are stranded: the dirty registry is in-memory (empty on load, never persisted), and pre-D2 the client pushed journal entries and marked them clean (`stampMap` includes `journalEntries`) even though the old server silently dropped them. So every existing entry sits in localStorage flagged "already synced" while the server has never stored it — and won't re-push. This one-time backfill re-dirties them so they push once, against the new server.

## The trigger (the careful part)
The client is already ahead of the server (D2's client code shipped; the server deploys later), so a naive boot flag would push to the OLD server and re-strand everything. Trigger off the signal that the server is the new version: the new `/sync` response includes a `journalEntries` key in its `pull`; the old server never did. So run the backfill on the first `/sync` response whose `pull` contains a `journalEntries` key — once.

## Scope
- **persistence.ts:** add `markAllJournalEntriesDirty()` — add every `cache.journalEntries[].id` (include soft-deleted, so tombstones travel too) to `dirty.journalEntries`. Touches neither the cache nor `updatedAt`; it only flags them for the next push.
- **store/sync.ts** (the network loop): after a `/sync` response, if `resp.pull` has a `journalEntries` key (`'journalEntries' in resp.pull`) AND `localStorage.getItem('writer-studio-journal-resync-v1')` is unset -> call `markAllJournalEntriesDirty()` and `localStorage.setItem('writer-studio-journal-resync-v1', '1')`. The re-dirtied entries push on the next sync cycle; optionally trigger one immediately for promptness.

## Invariants / guardrails
- **Idempotent, once per device:** the localStorage flag guarantees at most one run. Other devices each back up their own local-only entries the same way; after all have synced, the server holds the union.
- **LWW-safe:** stable ids + the server's `excluded.updated_at > existing.updated_at` guard mean re-pushing an entry the server already has is a no-op — no duplication, no clobbering a newer server copy.
- **Waits for login:** the trigger only fires on a real authenticated `/sync` response, so a logged-out user's entries simply back up on their next signed-in sync.
- No new deps; no schema change (D2's table already exists); normal dirty-tracking is unchanged after the one-time run.

## Definition of Done
- `tsc` + `pnpm build:web` clean.
- Against the deployed (new) server: a journal entry that existed BEFORE this patch/deploy (already "clean" in localStorage) pushes after one sync and pulls back intact in another session — the stranded backlog is now backed up.
- The flag prevents a second run (the backfill does not re-fire on later syncs).
- New / edited entries still sync normally (unaffected).
- The Slice 0 round-trip test now covers BOTH a fresh entry and a pre-existing one.
- Harness selftest green.

## Note
This is the gap that the throwaway-account round-trip (a fresh entry) cannot catch by construction — it only exercises the create-after-deploy path. The DoD above adds the pre-existing-entry case so the verification actually covers the data this patch protects.
