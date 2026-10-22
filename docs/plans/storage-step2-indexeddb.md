# Storage step 2: the device store moves to IndexedDB (item 213), plan

**Plan only. No code until Fable clears it.** Branch `plan/storage-step2-indexeddb`, off `main` @ 83f0cb05. Author: FIX.
**SCHEMA CHANGE: NONE.** Nothing changes on the server or in the shape of any record. This moves where the device keeps its copy.

## 0. What this is, and what already exists

Item 213 (owner TOOLS, urgent): `localStorage` holds about 5 MB, and the whole store lives in it. A full store loses offline edits. The trigger is about 0.5-0.85M words of text, or about one densely handwritten ink page. Step 1 (merged) made a failed save visible. Step 2 moves the device store to IndexedDB, which has a real quota of hundreds of MB.

**Step 2 is already designed, ruled and built once.**
- TOOLS' S0: `docs/menus/storage-full-step2-s0-indexeddb.md`.
- Fable's ruling (2026-09-30): a **synchronous** write-ahead journal keeps `flushNow()`'s contract; IndexedDB holds **one row per record**; migration is **verified by read-back**, with the old keys cleared after.
- TOOLS' build: `item-storage-s2-indexeddb` @ b9be6b05 (`idbStore.ts`, `writeAheadJournal.ts`, `storageMigration.ts`, a fake IndexedDB, and `item-storage-s2.mjs`, which TOOLS' offer reports at 42/42 browserless with 5 landed mutants; not re-run by FIX). It was never merged. The CDP durability experiment it owes was queued and never run.

**This plan does not redesign it.** It ports TOOLS' build onto today's `main` (credit TOOLS; TOOLS reviews the port). It names what has changed under it in three weeks, and it closes the gaps the old offer could not see.

## 1. Drift, measured

The offer's base is 4d3c84e2. Since then `main` has made **15 commits to `persistence.ts` (+652 lines)**, and a trial merge **conflicts in `persistence.ts` and `App.tsx`**. Each of these landings touches how the store is written, wiped or reloaded, and the port must carry it:

| Landed on main | What it does to storage | What the port must do |
|---|---|---|
| Sign-in / logout flush (8c6c26cc, e88834fa) | `resetLocalData()` wipes the six keys and the dirty key, synchronously, on logout: "flush, then decide, then wipe" | Wipe IndexedDB and the journal too, without letting an async clear land AFTER the next account's first writes (section 4) |
| B10.1 stale-client guard (c7956309, bab6f4f9) | `writesHeld()` holds every flush while this tab is stale; `flushForReload()` MERGES this tab's dirty records over what storage holds NOW (`overlayDirty`, newer `updatedAt` wins), then reloads | One row per record removes the whole-collection clobber this guarded against. `flushForReload` is synchronous right before `location.reload()`, so it journals the dirty records, and the next boot's replay applies the same overlay rule (section 3) |
| Drafts integrity (560eda8c, e4b596c2) | Records are identified by collection AND id; the scratch draft is keyed by account | Object-store per collection, keyed by id (TOOLS' shape already does this); the account-keyed draft is just a row |
| Board card tombstones (efff9d38) | Deleted cards live inside an entry's `boxes` | Nothing new: whole-entry rows |
| connector-b (9e433d20, ac4659c4) | `pageLinks` inside entries | Nothing new |
| Delete for good (bce12067 to 13d5419f) | A purge writes a SHELL (an upsert, not a delete); purged references are cleared; two per-device keys are removed | Shells are ordinary rows. `clearDraft()` stays the one hard delete (TOOLS' tombstone journal entry already covers it) |
| big-projects 1a (11b4f874) | Per-device place and open counts in their own `localStorage` keys | Stay in `localStorage` (small, not collections), as TOOLS' S0 already ruled for every non-collection key |

## 2. The shape (TOOLS', unchanged)

- **`cache` stays the synchronous read path.** About 130 exported readers keep their exact signatures; nothing reads storage directly. Publish, sync and every component read the cache.
- **`hydrate` becomes async.** `storageReady: Promise<void>`. The cache starts at the empty shape a fresh device already has, and `App.tsx` awaits `storageReady` beside its existing `apiMe()` (in parallel).
- **`flush(name)` writes only the records that changed** (one row per record), in one IndexedDB transaction per flush, puts and deletes together.
- **`flushNow()` stays synchronous.** By the time it returns, every pending record is in the write-ahead journal (a small synchronous `localStorage` entry holding only records not yet confirmed committed); the IndexedDB commit finishes in the background. A record leaves the journal when ITS commit succeeds. A global sequence number, not `updatedAt`, decides "am I still the latest edit for this id" (TOOLS found two edits in one millisecond).
- **Boot replays the journal** through the normal flush cycle.
- **Migration once, verified by read-back and count.** No IndexedDB at all: the legacy whole-blob path, byte-identical.

## 3. What the old offer could not see, and how the port closes it

1. **The stale-tab reload (B10.1).** `flushForReload()` reads `localStorage` synchronously and merges. With IndexedDB it cannot read the stored rows before the reload. Port: `flushForReload()` journals this tab's dirty records (synchronous, small) and unions its dirty ids, exactly as now. On the next boot, journal replay applies **`overlayDirty`'s rule against the stored row**: a journaled record replaces the stored one only if its `updatedAt` is newer. The rule is unchanged; only its moment moves to boot. The read-only hold (`writesHeld()`) is unchanged: a stale tab writes nothing until it reloads.
2. **The journal lives in the store that fills up.** The journal is `localStorage`, so a record too large for `localStorage` (the dense ink page this item exists for) cannot be journaled. TOOLS reports that failure under its own name, `writeAheadJournal`. The port adds the honest consequence: such a record's durability is the IndexedDB commit alone (async). The writer is told only if that commit also fails (step 1's channel). Migration itself frees the old whole-blob keys, so the journal normally has room.
3. **Clearing the legacy copy.** TOOLS clears it the same boot for a signed-in writer, and after a second verified boot for a signed-out one. The port adds one condition for signed-in: **clear only when the dirty set is empty** (everything is on the server). A signed-in writer with unpushed edits offline keeps the legacy copy until those edits sync, so no moment exists when their only copy is a single, just-migrated IndexedDB.
4. **Logout and the next account (section 4).**
5. **Multiple tabs.** Today two tabs flush whole collections and can clobber each other (B10.1 is the guard). One row per record means two tabs writing DIFFERENT records never clobber; the same record is last-commit-wins, as today. No new cross-tab mechanism is added; the stale-client guard still holds a tab that has fallen behind a deploy.

## 4. Logout and sign-in

`resetLocalData()` today wipes synchronously, then the app continues. An IndexedDB clear is async: if it resolves after the next account's first writes, it erases them.
- **Port:** `resetLocalData()` clears the cache and the journal synchronously (as now), bumps a **storage epoch**, and starts the IndexedDB clear. Every commit carries the epoch it was queued under, and a commit from an older epoch is dropped. The next account's boot awaits the clear inside `storageReady` before any write is accepted.
- **Rival, strongest form:** one IndexedDB database per account (`wrizo-<uid>`, `wrizo-local` signed out). Logout then never has to clear anything to protect the next account, and cross-account bleed is impossible by construction. Its cost: a signed-out writer who signs in must have their local work adopted into the account's database (a copy step that does not exist today), and old databases accumulate unless deleted. **Lean: the epoch, one database.** It is the smaller change, and it keeps today's "logout wipes" contract literally. The unmeasured risk is on the lean: the epoch must be right at every commit site.

## 5. The harness migration: the largest cost

**80 harness and script files read stored collections straight from `localStorage`, at 212 sites** (counted over the full folders of `apps/desktop/scripts` and `apps/server/scripts` on 83f0cb05; candidates for each site's own audit, not yet a population). Once the store is IndexedDB, every one of those reads returns nothing: a check would go green or red about the wrong thing.
- **A committed read seam:** `window.wrizoStoredRecord(collection, id)` and `window.wrizoStoredCollection(collection)`. They read the COMMITTED IndexedDB rows (async; `app.evalJs` awaits a promise), never the cache, so a check still proves "it reached the device". Writes already go through seams (`seed-guard.mjs`).
- **`seed-guard.mjs` gains the read half:** a raw `localStorage.getItem` of a collection key fails the guard, as a raw write already does, with a baseline that falls to zero as files migrate.
- **AGENTS.md's harness seeding law** names `flushNow()`'s wholesale re-serialisation and the cache-hydrated-once hazard. Both change meaning, so the law's text is updated with the port (proposed to chat 1, which owns the ledger; AGENTS.md is a repo file the port edits).
- **Park sweep:** every harness that reads storage or the flush contract, by behaviour, not by string: the 80 files above, `item-storage-full`, `logout-flush`, `b101` (the reload merge), `sync-generation`, `item224a`, `delete-for-good-check`, `box-tombstones`, `typed-literal-check`, and every proof built on `scripts/lib/client-node.mjs` (its memory storages need an IndexedDB fake: TOOLS' `fakeIndexedDB.mjs`).

## 6. Proof

1. **Browserless:** TOOLS' `item-storage-s2.mjs` (42 checks and 5 mutants by TOOLS' own report), re-run on the port, plus new checks:
   - the reload overlay at replay;
   - the dirty-set condition on clearing the legacy copy;
   - the epoch (a late clear never erases the next account's rows);
   - the journal-overflow report.
   Each gets a mutant asserted to land. `item-storage-full.mjs` re-run (no regression).
2. **The CDP durability experiment** (TOOLS' S0 section 3, never run): a real tab, a real IndexedDB write after `visibilitychange: hidden`, closed at offsets 0 ms, about half the measured round trip, and after `oncomplete`. Then reopen against the same database and read back. Report a **survival rate per offset** over many runs (the distribution law), and show the journal recovers every case IndexedDB alone misses. Needs a box turn.
3. **A migration walk** on a seeded legacy device (all six collections, the dirty set, a shell, a tombstoned card, an account-keyed draft): boot the new build, verify the counts, reload, verify again, and confirm the legacy keys clear only on the rules in section 3.
4. **The full pair**, both legs (persistence, save and sync: the fast-lane rule names them).

## 7. Deploy

- No server change and no migration on the server, so no backup proof is owed for this ticket itself. The device migration is the risk: it runs on every writer's device at first boot.
- **Rollback is the named hazard.** A build older than this one reads `localStorage` only. After the legacy copy is cleared, rolling back shows an empty device. Signed-in: the server re-pulls (and section 3's dirty-set condition means nothing unpushed was cleared). Signed-out: their local work stays in IndexedDB, invisible to the old build until the new one returns. **Rule proposed:** no rollback past this build without Fable's word, and the deploy note says so.
- Ships alone, not batched with other storage-touching work. INK's Library/volumes items (214) wait on it, as the ledger already rules.

## 8. Hand-ups (each with a lean)

- **Q1, who builds.** TOOLS designed and built step 2. **Lean: FIX ports TOOLS' branch onto main, TOOLS reviews the port** (TOOLS knows the race guard and the fake). Rival: TOOLS ports its own work. Better if TOOLS has the time; the drift in section 1 is mostly code FIX built or merged (delete-for-good, B10.1 reviews).
- **Q2, the legacy clear for a signed-in writer** (section 3.3). Lean: only when the dirty set is empty. Rival (TOOLS' rule): the same boot as verification. That frees the space sooner, which matters most for exactly the full device this item is for.
- **Q3, logout** (section 4). Lean: one database with an epoch. Rival: a database per account.
- **Q4, the rollback rule** (section 7).

## 9. Not in this ticket

No change to the 300 ms debounce. No `strict` IndexedDB durability unless the experiment says `relaxed` loses writes. No move of the small per-device keys. No deletion of old IndexedDB data. No Library/volumes work (214).
