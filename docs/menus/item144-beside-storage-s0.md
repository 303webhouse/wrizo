# ITEM 144 — STORING "BESIDE" BOARD CONNECTIONS · S0 SHAPE REPORT (tools lane)
### For Fable's review · **HARD STOP: nothing server-side is written until this clears** · 2026-09-24

**Nick's word (verbatim, as relayed): *"1. Store them properly"*** — "beside" connections go in the database,
so they sync across devices. **This report is on `page_links`' recipe** (`exp1-connect-text` @ `78d4529`:
`migrate.ts` + the five `sync.ts` sites), read at disk, not recalled.

## 1 · THE MINIMUM LAWFUL SHAPE — a COLUMN. It does not have to be a table.

**`journal_entries.beside_links jsonb`** (JS `besideLinks`), **additive, nullable, no default, no CHECK, no
backfill** — the exact `page_settings` / `page_links` / `tutor` recipe. **Present on BOARD rows only**
(`page_type = 'board'`); null on every other row and on every board that has never had a "beside" connection.

**Why a column is enough, and why I am not proposing a table:** the relation is an **unordered pair of
boards**, and a pair can live on *either* board's row — so the record rides the board the writer was standing
on when they made it, exactly as a nest rides the parent's `boxes`. Nothing about the relation needs an index
the existing scan does not already give (`getBoardsPinning` already scans every board's `boxes` for the
reverse read of a nest; this is the same cost, the same shape). **A table (`board_links`) is the graduation,
not the minimum** — it would buy per-pair last-writer-wins (§5) and a reverse index, at the cost of a new sync
collection end to end (server pull/push, a client cache collection, flush/subscribe keys). Named trigger for
graduating: *two devices routinely editing one board's connections inside a sync window*, or the reverse
scan showing up in a profile. **Neither is measured today.**

**The name is a proposal — Fable rules it.** "Connection(s)" is already taken four ways in this tree (your own
`page_links` ruling said so); `beside_links` says the direction and cannot collide with `page_links`.

```ts
// types/index.ts — additive-optional, absent on every existing row
export interface BesideLink {
  id: string;
  boardId: string;        // the OTHER board. The row this lives on is one end; this is the other.
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;     // an unlink is a soft delete, like every other record here
}
export interface BesideLinks { links: BesideLink[] }
// JournalEntry:  besideLinks?: BesideLinks;   →  ONE column: beside_links jsonb
```
*(One object with one array, not a bare array — so a second array can join later exactly as `page_links`
carries two, and no migration changes the column's outer shape.)*

## 2 · ONE EXAMPLE RECORD, AS STORED

Lore (`b-lore`) and Characters (`b-cast`) connected beside each other, made while standing on Lore:

```
journal_entries row  id = 'b-lore'   page_type = 'board'
  beside_links = {"links":[{"id":"k3m9x2","boardId":"b-cast",
                            "createdAt":"2026-09-24T18:03:11.402Z",
                            "updatedAt":"2026-09-24T18:03:11.402Z"}]}
journal_entries row  id = 'b-cast'   beside_links = NULL        ← the OTHER end stores nothing
```
After Unlink, the same record with `"deletedAt":"2026-09-24T18:09:40.115Z"` and a later `updatedAt`. **The
row's own `updated_at` bumps on both acts — a connection change is a board change** (the `page_links` law), so
it also moves that board up any list ordered by `updatedAt`. *(Stated cost; the tabs' order never reads it.)*

## 3 · EVERY SERVER EDIT — five sites, plus the migration. Miss one and the field is dropped SILENTLY.

`/sync` copies journal entries **field by field, both directions**; a field no site knows is discarded on the
push and cannot come back on the pull, with no error anywhere. **Read at disk** (`apps/server/src`):
`journal_entries` is touched in exactly two files — `migrate.ts` and `sync.ts` (the pull at `sync.ts:344` goes
through `rowToJournalEntry`; the only writer is `upsertJournalEntries`).

| # | site | edit |
|---|---|---|
| 0 | `migrate.ts` (after `page_settings`, `:168`) | `alter table journal_entries add column if not exists beside_links jsonb` |
| 1 | `rowToJournalEntry` (`sync.ts:~112`, the read mapper) | `besideLinks: r.beside_links ?? undefined,` — **SQL null → JS undefined**, never `null`, never `{}` (a board never connected stays byte-identical to today) |
| 2 | `upsertJournalEntries` INSERT column list (`:254`) | append `beside_links` |
| 3 | the VALUES placeholder list (`:255`) | append `$N::jsonb` |
| 4 | `on conflict do update set` (`:267`) | `, beside_links = excluded.beside_links` — **riding the same `excluded.updated_at > journal_entries.updated_at` guard** |
| 5 | the positional parameter array (`:~272`) | append `JSON.stringify(e.besideLinks ?? null)` |

**⚠ ORDERING HAZARD — `$N` is not a constant.** On `main` today `page_settings` is `$24`; **if PW's `page_links`
lands first it is `$25` and mine is `$26`.** Whichever merges second renumbers the placeholder and appends to
the same INSERT/VALUES/parameter lines — a *textual* conflict at best, a **silently shifted parameter** at
worst (a `jsonb` cast on the wrong value errors; a `text` column would not). **Ask chat 1 to fix the merge order
between `exp1-connect-text` and this branch, and to re-count `$N` at the second merge.** Client side, one more
site: `JournalPageSeed` (test seeding), the `boxes`/`tags` precedent.

**Client boundary (no field-by-field copy found for a board — read at disk):** `applyRemoteRecords` → `applyCollection` (`persistence.ts:~2902`) **clones the whole remote entry over the local one when `rec.updatedAt` is newer, and skips any row with an unsynced local edit** (`dirty` wins) — so the client half needs no mapper, but until the server column exists a newer pulled row *replaces the local entry without `besideLinks`*. And the client applies a pull as whole entries and
every write spreads the whole entry (`saveJournalEntry({ ...entry, besideLinks })`, the same law `anchors.ts`
states — `upsert` replaces the stored row wholesale). **Open, for Fable:** should a *duplicated* board carry its
connections? (Conservative's Duplicate rules are PLAN DESK's; my default: **no** — a copy starts unconnected.)

## 4 · HOW BOTH BOARDS COME TO SHOW THE CONNECTION — the reverse read

**One end stores it; both ends read it.** `getBoardsBeside(id)` =
1. the **live** records on `id`'s own row (its `besideLinks.links`, not deleted), **plus**
2. **every other board** whose `besideLinks` holds a live record whose `boardId` is `id` — a scan of the user's
   boards, **the same cost and shape as `getBoardsPinning`'s scan of `boxes` for a nest's reverse.**

…then **deduplicated as an UNORDERED pair, deleted/missing/condition boards dropped.** So **Lore sees Characters
(its own record) and Characters sees Lore (the reverse scan)** with nothing written to Characters' row. **Unlink**
soft-deletes **every live record for the pair** (on either row): usually one write; **two** if both devices
connected in opposite directions. *(Rejected: writing BOTH ends. It doubles every write, touches a board the
writer is not standing on, and creates a divergence — one end unlinked, the other not — that the one-ended shape
cannot have.)* **A self-connection is refused; connecting an existing pair is idempotent.** There is **no cycle
guard** because "beside" contains nothing — it is not the nest relation and never enters `wouldNestCycle`.

## 5 · WHAT LAST-WRITER-WINS DOES IF TWO DEVICES CHANGE CONNECTIONS AT ONCE

The column resolves **whole, by the row's single `updated_at`** — exactly `page_links`' stated known limit. The
per-record `updatedAt`/`deletedAt` are in the model **but nothing reads them**; do not mistake them for merging.

| two devices… | result |
|---|---|
| connect **different** boards to **different** rows (A→B on one, C→D on the other) | **both survive** — different rows, no conflict |
| connect **different** partners on the **same** board's row (Lore→Cast, Lore→Notes) | **the later `updated_at` replaces the whole column; the other connection is silently lost.** *The one real loss.* |
| connect the **same pair in opposite directions** (A→B, B→A) | two records on two rows; the reverse read **dedupes** — one connection, no loss |
| one **unlinks** while the other **edits that board offline** (moves a card) | the later write's whole-row copy carries the **stale** array — **the unlink can be resurrected.** *(The same hazard `boxes` has for a removed pin today.)* |
| connect on one device, **delete** the board on the other | the record points at a deleted board; the reverse read drops it. Nothing purges it. |

**This is STATED, NOT GUARDED, as ruled for `page_links`** — the guard is the table. **Cheapest hardening, if you
want one before the table:** a client-side union-by-record-id on pull (tombstone wins) — it needs a merge hook
in the sync client, which is a sync change, so I have **not** proposed it.

## 6 · WHAT I AM DOING WHILE THIS IS IN REVIEW

The **client half is written against this exact shape** (types, `store/boardBeside.ts`'s seam, the Connect Board
UI, New Board's "beside", Unlink) — it persists locally and is the final shape. **The server half (the six
edits above) is NOT written.** ⚠ **Until it lands, a board's `besideLinks` never leaves the device and a pull that
replaces the row can drop it** — so **144 must not deploy without the server half**, which the 144-after-160
merge order already implies. **If you rule a table instead, the seam's three functions
(`getBoardsBeside` / `connectBeside` / `unlinkBeside`) are the only thing that changes.**

## 7 · WHAT I NEED FROM YOU

1. **Column, and its name** — `beside_links` / `besideLinks`?
2. **Merge order** against PW's `page_links` (one INSERT, two appended columns).
3. **Duplicate** — carry connections or not (default: no).
4. **§5's resurrect case** — accept as `page_links` did, or want the union-on-pull hardening scoped?
