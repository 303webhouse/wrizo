# Item 201 — Delete Permanently — slices 1 and 2 (the server half and the store half) — OFFER (FIX)

**Branch `item201-tombstone`.** Fable approved the S0 (`docs/menus/item201-delete-permanently-s0.md`): **Q1** accept the
card residual · **Q2** mine for *purged* pins, 168-B hides *trashed* pages' cards · **Q3** no binders or drawers · **Q4** the
leak guard stays. Order: after 203; browserless; **the `BoardEditor` parts wait for 160's merge.** This is that: **nothing in
`BoardEditor.tsx` is touched, and nothing in the product calls `purgeEntry` yet — so no writer can reach a purge.**
The column is Nick's "1. Yes". Not merged, not deployed.

## What is built

| # | where | what |
|---|---|---|
| **E1** | `migrate.ts` | `alter table journal_entries add column if not exists purged_at timestamptz` — **one** nullable column, no default, no `NOT NULL`, no backfill |
| **E2** | `sync.ts` ordinary upsert | `where … and journal_entries.purged_at is null …` — **a purged row is frozen**: no later write of any kind changes it. No `$N`. |
| **E3** | `sync.ts` | a record carrying `purgedAt` is routed to its own statement, **never the ordinary upsert** |
| **E4** | `sync.ts` `purgeJournalEntry` | ONE statement: INSERT a blank tombstone for an id the server never saw, or BLANK the existing row in place (all 19 payload columns), `deleted_at`/`purged_at` keep their **first** value (`coalesce`), `synced_at = now()` (item 198) so every device with an older cursor receives it by the ordinary pull. **The client's pushed content is never read.** |
| **E5** | `sync.ts` mapper | `purgedAt: iso(r.purged_at) ?? undefined` — SQL null → JS undefined, the additive-column fixed point |
| type | `types/index.ts` | `JournalEntry.purgedAt?: string` |
| store | `persistence.ts` | `purgeEntry(id)` (a **Trash act**: refuses a page that is not in the Trash, or already purged; replaces the local record with the tombstone so nothing of the content stays in localStorage) · **`applyCollection`'s one named exception**: a remote tombstone replaces the local record ignoring "newer only" **and** "a local unsynced edit wins", **and clears that id's dirty flag** so the device does not push the blank record back · the **four Trash readers** exclude tombstones (`getDeletedEntries`, the Trash's qualifying list, `getJournalEntryIncludingDeleted` returns null for one, `restoreEntry` refuses one) · `wrizoPurgeEntry` seam, `durableSeam`-wrapped |

## Evidence

1. **`apps/desktop/scripts/sync-purge-proof.mjs --mutants`** (`sync-purge-proof.output.txt`) — browserless: the **real** `sync.ts` router,
   **three real client stores** (A, B, C), a fake pool that interprets the SQL **from its own text** (every `WHERE` conjunct
   interpreted — one it does not understand throws — the purge's `coalesce`/`greatest`, and which columns exist from `migrate.ts`).
   **18 checks green, 13 mutants — each edit removed ALONE — each red on its own claims.**
   Design §7 checks **1–6** are all here: **1** the tombstone reaches another device and replaces its copy in its own storage
   (P1) · **2+3** a stale holder, and the *long-offline device with a dirty local edit*, are **refused, then receive the
   tombstone, their edit discarded, their dirty flag cleared** (P2) · **4** monotone: a "restore" push with a newer
   `updated_at`, and a second purge, change nothing (P4) · **5** the server blanks *every* payload column even when the purge
   arrives carrying the full content (P5) · **6** **no hard delete on any synced table anywhere in `apps/server/src`** (a
   source scan) · plus an id the server never saw (P7), the store's own rules (P8), and the ordinary edit path untouched (P9).
   **THE LEAK GUARD (Q4, N1):** derives `journal_entries`' live columns from `migrate.ts` and checks the purge blanks every one
   that is not identity or a stamp — **today 19/19; the day `page_links` or `beside_links` merges without adding itself it goes red.**
2. **`docs/evidence/item201/real-postgres-check.mjs`** — the **actual built** `migrate.ts` and `sync.ts` (no transform) on a
   **real Postgres 18.4**, 14/14: the real migration adds the column idempotently across two boots; the purge blanks in place
   ignoring content, inserts a tombstone for an unseen id, refuses a later push of it; a "restore" with a newer `updated_at`
   changes nothing; `purged_at` never moves; another user's purge does nothing; the real mapper carries `purgedAt` and leaves it
   **undefined (never null)** on a page never purged.

**A finding made while building this, worth its own line.** The 198 instrument located "the journal upsert" as *the first
`insert into journal_entries`* in `sync.ts`. Since this slice there is a second one (the purge) **earlier in the file**, so its
`synced_at = now()` census and two of its mutants were silently reading the wrong statement — *the check could not have seen
the ordinary upsert lose its `synced_at`*. Both helpers now anchor on the upsert's own guard and walk back; the 198 instrument
is green again with all mutants red. **The 198-refinement branch carries a copy of that file with the same two helpers; it needs
the same two-line fix when the two merge.**

## What this leaves visible, and what waits

- **Nothing a writer can reach.** No UI calls `purgeEntry`; the Trash buttons and both confirms are slice 3 (`BoardEditor`, after 160).
- **One interim wart, named:** a page-pin to a page that is purged renders **"Missing page"** on other boards (its existing branch
  for an absent entry), because `getJournalEntryIncludingDeleted` now returns null for a tombstone. The design wants it to render
  **nothing** and be pruned on that board's next save — **`BoardPinBox` and the prune are in `BoardEditor.tsx`, so they wait for 160's merge.**
  It is unreachable until slice 3 gives a writer a purge.
- **Cards** (`purgedCardIds` in `board-meta`) wait for 168-B's `Box.deletedAt`, as agreed.
- **The two-device checks in a browser** (design §7, on `/api/_sync_mode`) wait for a box turn; the instrument runs the same flows on
  real stores against the real router, which proves the logic and not the mount.

## Not verified
- **Production Postgres version** (unknown; nothing here is version-specific). **The client half in a browser.**
- **Old clients:** a device that has not updated ignores `purgedAt`, sees a blank deleted page in its Trash and can press Restore;
  the server refuses it (E2) and the next pull returns the tombstone, so it stays deleted — correct, but Restore appears to work for one sync.

## Merge notes for chat 1
- **Textual conflicts to expect in `sync.ts`:** 144's `beside_links` and EXP1's `page_links` edit the same journal upsert (E2 adds one `where`
  line, E3 one branch, no column, no `$N`), and item 203 edits the `/sync` handler (a different region). **Whichever of `page_links`/`beside_links`
  merges after this must add its column to the purge's blank list — the leak guard will say so.**
- **160 before slice 3.** Delete Permanently lives on the Trash board's action row beside Restore.
