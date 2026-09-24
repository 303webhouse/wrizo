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

---

## 8 · ADDENDUM — PLAN DESK's §9.7 QUESTIONS (`plan-144-amend3` @ `8c213bb`), answered on disk

*(Fable, 2026-09-24: this report also answers a peer relation's owner side, what deletion / trash / restore do,
uniqueness, and a census of every site that copies a board record. Each answer below was read at the source, not recalled.)*

### 8.1 · WHICH SIDE OWNS THE ROW? — NEITHER. One record, not two.

"Beside" is **symmetric: it has no owner and no direction.** The record physically lives on the row of the board the
writer was standing on when they made it — **storage locality, never meaning.** Consequences, all built and dry-run:
either end may **Unlink** (`unlinkBeside(a, b)` finds the record on whichever row holds it); either end's tab shows
it (the reverse scan); the row that stores it is **not privileged** — trashing, moving or editing either board does not
end or transfer it. **One record**: writing both ends was rejected (§4 — doubled writes and a divergence the one-ended
shape cannot have).

### 8.2 · WHAT DELETION, TRASH AND RESTORE DO — the connection HIDES; nothing removes it.

Item 168's law ("deleting hides, never removes") holds by construction, **verified in `persistence.ts`:**
`softDeleteEntry` sets `deletedAt` and **spreads the whole entry, so `besideLinks` rides along untouched**; there is **no
hard-delete of a `JournalEntry` anywhere** (only soft, plus `softDeleteDrawer` for drawers); `getJournalEntry` returns
`null` for a deleted row and `getAllUserBoards` skips it.

| act | what the connection does |
|---|---|
| **delete board B** (soft) | **hidden, not removed.** A's tab for B disappears (the reverse read and `getJournalEntry` both skip a deleted board); the record persists on whichever row holds it. If B *held* the record, it hides with B; if A held it, it dangles inertly at a hidden board. **Nothing cascades and nothing is cleaned up.** |
| **restore B** (`restoreEntry` — destructure-rest, carries `besideLinks`) | **the connection reappears at both ends**, exactly as it was — nothing had to be rebuilt. |
| **trash** | is the same soft delete (the Trash Board *derives* its cards from deleted pages) — no separate case. |
| **delete the unlinking board's partner while unlinked** | the record is already a tombstone (`deletedAt`); a restore does **not** resurrect it — an unlink is its own act. |
| a **condition board** (Journal/Shelf/Trash) | never a side: `connectBeside` refuses it and `getBoardsBeside` drops it. |

Named cost: a **dangling record to a deleted board is never pruned** (no purge exists); it is harmless — every read filters it.
A page's **plan board** *is* a user board, so it can be connected beside like any other (and is not special-cased) — say if that should change.

### 8.3 · UNIQUENESS — one LIVE record per unordered pair, enforced at the write; not by the database.

`connectBeside` **refuses self and returns without writing if the pair is already beside** — checked across *both* rows,
so connecting A→B and then B→A writes **once** (dry-run: "connect in the opposite direction is a no-op"). **What it cannot
prevent:** two devices connecting the same pair *at the same moment* on *different* rows (A→B on one, B→A on the other) —
`jsonb` has no constraint, and each write saw no live record. The result is **two live records for one pair.** **That is
tolerated by design:** the reverse read **dedupes** to one connection, and **Unlink soft-deletes *every* live record for the
pair** (both rows), so it cannot be half-undone. A duplicate is invisible to the writer and self-heals on the next unlink.

### 8.4 · THE CENSUS — every site that copies or rebuilds a board record (so the field cannot be dropped in silence)

The two recurring traps are **(1)** a site that *enumerates* fields to rebuild a record, and **(2)** the server's field-by-field
copy. Method: every constructor of a board (`pageType: 'board'`), every `saveJournalEntry` on a board, every clone/restore/
delete path, both sync directions. **Read at disk (`apps/desktop/src`, `apps/server/src`):**

| site | what it does | carries `besideLinks`? |
|---|---|---|
| `createBoardPage` (`persistence.ts:~1086`) | **BIRTH** — an object literal | **n/a — a new board has none.** Nothing to carry. |
| `getOrCreatePlanBoard` (`:~2314`) | **BIRTH** of a plan board | n/a (born empty) |
| `getOrCreateSystemBoard` (`:~2483`) | **BIRTH** of Journal/Shelf/Trash | n/a — and a condition board is never a side |
| `unbornPage.ts` birth (`:~101,144`) | **BIRTH** through `BirthContent` (`boxes`/`pageType` passed through) | n/a — an unborn board is born empty; **only `page_links` (PW's) needed a `BirthContent` field, and `besideLinks` does not** (a board is never born connected) |
| `saveBoardBoxes` (`:~1113`) | merges `boxes` into the **latest** record | **YES** (`{ ...latest, boxes }`) — why BoardEditor's autosave cannot clobber a connection |
| `pinPageToBoard` / `unpinPageFromBoard` / `setPinDisplayed` / `appendToBoard` / `portToBoard` / `copyCardToBoard` | write `boxes` | **YES** — every one is `{ ...board, boxes }` |
| `patchJournalEntry` (`:2002`) | `{ ...latest, text, ...changes }` | **YES** |
| `softDeleteEntry` / `restoreEntry` (`:2219`, `:2403`) | set / remove `deletedAt` | **YES** — spread / destructure-rest |
| `setNotebookPosition`, the `planBoardId` pointer writes | spread the entry | **YES** |
| `reconcileSystemBoard` | writes **condition boards only** (Journal/Shelf/Trash) | n/a — a condition board is never a side |
| the remaining **non-spread** `saveJournalEntry(entry)` calls (`createJournalPage`, `createBoardPage`, `importDraft`, `createLoosePage`, `createLooseHomePage`; and two that mutate a `clone(...)`) | **BIRTHS** of new rows, or a clone-then-mutate | births carry nothing to lose; the two clone sites carry every field. **No site enumerates a board's fields.** |
| `applyCollection` (`:~2902`, the **pull**) | **replaces** the local entry with a `clone` of the remote when newer; skips rows with an unsynced local edit | **only if the SERVER returned it** — the dependency on §3's sites |
| `JournalPageSeed` / `createJournalPage` (test seam) | presence-checked passthrough | **YES — added (`besideLinks?`), the boxes/tags precedent** |
| `decks/engine.ts:76` | builds `boxes` for a deal — not a record | n/a |
| **Duplicate** | **does not exist yet** (Conservative's rules are PLAN DESK's) | **open — default: a copy starts UNCONNECTED** (a connection is a relation *between two boards*, not a property of one) |
| `pageExport.ts` (`boardBody`) | renders a board's **body from `boxes`** (an inverted whitelist), not a record copy | `besideLinks` is **left out**, like every structural field. *(If PW's rule — export names the links it leaves out — should cover beside, it is one line; not built.)* |
| **server** — `migrate.ts`, `rowToJournalEntry`, INSERT list, VALUES, `on conflict`, parameter array | **the field-by-field copy, both directions** | **NO until §3's six edits land — the only place a connection is dropped silently.** |

**Result: the census found exactly ONE silent-drop trap — the server's five sites (§3) — and zero enumerating client rebuilds.**
Every client writer spreads the entry, and the three board births need nothing. So **the field cannot be dropped in silence
once §3 lands**; until then it is dropped **on the pull** (whole-row replace) — which is why 144 must not deploy first.
*(Method, stated so it can be re-run: `grep -rn "pageType: 'board'"` for constructors; `grep -rn "saveJournalEntry({"` and
read each; `grep -n journal_entries apps/server/src`. A census of a syntactic shape is a list of candidates — each row above
was read.)*

### 8.5 · P12 / P13, as PLAN DESK asked

P12 ("no schema") is **SUPERSEDED** by Nick's *"Store them properly"*: `i144.mjs` no longer asserts "no column"; it asserts the
record is **stored on the row the writer stood on** and the other end stores nothing. P13's "same device" becomes "every
device" **only once the server half is built** — until then it asserts survival across a reload on this device, and says so.

