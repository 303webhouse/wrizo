# Item 201 — Delete Permanently — S0 SHAPE REPORT (FIX)

**Nothing writes.** This is the shape report Fable asked for before anything is built. It reads PLAN DESK's
design (`plan-168-delete-permanently` @ `87eae9a`, `docs/menus/b168-rulings-and-item201-delete-permanently.md`)
against live code at `main` `4da5c89`, turns the design's SQL sketch into SQL, **runs it on a real Postgres**,
and lists what the design gets right, what it assumes that is not built, and what it leaves out.

**Verdict: the shape is sound and the server half is small and verified. Four things the design assumes are not
true of the code today (§2), one of them a real build item the design counts as free.** The column
(`journal_entries.purged_at`) is Nick's "1. Yes" already; nothing else here needs a schema word.

## 1 · Verified, on a real Postgres 18.4 (14/14 — `docs/evidence/item201/`)

`s0-purge-sql-check.mjs` runs main's real `migrate.ts` and `sync.ts`, applies the **exact edit set below as string
transforms of a scratch copy** (nothing in `apps/server` changes), and drives it through the real `/sync` handler.

| edit | text | proven |
|---|---|---|
| **E1** column | `alter table journal_entries add column if not exists purged_at timestamptz` | one nullable `timestamptz`, no default, no `NOT NULL`, idempotent on a second boot |
| **E2** freeze | the ordinary upsert's `WHERE` gains `and journal_entries.purged_at is null` (no `$N`) | a stale device pushing the WHOLE record with a **newer** `updated_at` and `deleted_at` cleared — a "restore" of a purged item — **changes nothing**; an ordinary edit to an unpurged page still lands |
| **E3** route | `if (e.purgedAt) { await purgeJournalEntry(userId, e); continue; }` at the top of the record loop | the purge never touches the ordinary upsert, so **its 24 columns and 24 parameters are unchanged** |
| **E4** tombstone | ONE statement: `insert … values ($1,$2,'',$3,$4,$5,$5) on conflict (id) do update set <blank every payload column>, deleted_at = coalesce(…), purged_at = coalesce(…), updated_at = greatest(…), synced_at = now() where journal_entries.user_id = excluded.user_id` | blanks an existing row **ignoring the client's content** (the client pushes a whole record; none of it is kept); **inserts a tombstone for an id the server never saw**, so a device holding it cannot INSERT it back; `deleted_at` set by the server; purging again **cannot move** `purged_at` (monotone); another user's purge of your id **does nothing** |
| **E5** mapper | `purgedAt: r.purged_at ? iso(r.purged_at) : undefined` in `rowToJournalEntry` | **needed, not decorative:** without it the pulled tombstone reaches the client as an ordinary blank deleted page — the run shows the current mapper drops the mark |

**The pull carries it with no new channel:** a device whose cursor predates the purge receives the tombstone
(the purge stamps `synced_at = now()`, item 198). *(E5 is prototyped only as the absence the run shows; it is a
one-line edit.)*

### The leak guard — the one thing I would add to the design
The purge blanks an **explicit column list**. A column added to `journal_entries` later and forgotten there
**leaks content through a "permanent" delete, silently.** Two such columns are already in flight: **`page_links`**
(Nick-approved, EXP1) and **`beside_links`** (144, offered). The check derives the live column list from
`information_schema` and fails if any column that is not identity or a stamp is missing from the blank list —
**today it passes; the day either lands without adding itself it goes red.** Recommend it ships as a permanent
guard beside the purge (same family as `seed-guard`).

## 2 · What the design assumes that the code does not do

1. **★ "A pin to a trashed page is hidden; the readers already skip a deleted target" (§6, charter §3(c)) is NOT
   built.** `BoardPinBox` reads `getJournalEntryIncludingDeleted` **on every board**, deliberately (B1 S4: "the
   Trash is a place, not a blank"), and the canvas withholds only `onCanvas === false`
   (`BoardEditor.tsx:1923`). `softDeleteEntry` touches no other board. **Today a trashed page's card stays on every
   other board showing its real title.** After a purge it would show a blank **"Untitled"** card there.
   → **Build item, not a census:** `BoardPinBox` returns nothing for a purged target, and a pin to a purged id is
   pruned on that board's next save. **Hiding a merely *trashed* page's cards on other boards is 168-B's, not this
   item's** — I would keep the two apart (Q2).
2. **The Trash is a *derived view over `deletedAt`*, and a tombstone is `deleted_at`-set by design** (§3 rule 1).
   So without change it appears in the Trash as a blank card with a live Restore. **Four sites select deleted
   items positively** (counted programmatically over all 37 non-comment `deletedAt` lines in the client source — the
   other 33 hide deleted things and are correct as they stand):
   `getDeletedEntries` (`persistence.ts:1763`, also read by `pageExport.ts:260`), the Trash's qualifying list
   (`persistence.ts:2527`), `getJournalEntryIncludingDeleted`, and `restoreEntry`. Each gains `!e.purgedAt`;
   `restoreEntry` refuses a tombstone. **No client reader beyond those four needs to know.**
3. **`applyCollection` needs its one named exception, and one more line.** A remote tombstone replaces the local
   record ignoring "newer only" and "local dirty wins" — and **must also clear that id's dirty flag**, or the
   device pushes the blank record back forever (harmless, but a ping-pong). Its own local purge must blank the
   local record too, not only mark it: `localStorage` is re-serialised wholesale by the flush.
4. **The card half cannot start.** A trashed *card* needs `Box.deletedAt`, which is **168-F1 and unbuilt** (168-B's
   gate). The design already says so; stating it as a sequencing fact: **the entry half (pages and boards) is
   independent and buildable now; the card half waits for 168-B.**

## 3 · What the design leaves out

- **Old clients.** A device that has not updated ignores `purgedAt`, sees a blank deleted page in its Trash, and
  can press Restore. The server **refuses** that push (E2) and the next pull returns the tombstone, so it stays
  deleted — **correct, but the Restore appears to work for one sync.** Acceptable; say so in the offer.
- **Binders (`projects`) and drawers are soft-deletable and out of this item.** Nothing here purges them. If Nick's
  "the entire bin" includes them, that is a second column on `projects`/`drawers` — **Q3.**
- **160's merge order.** Delete Permanently lives on the **Trash board's action row beside Restore** — the row
  item 160 turns into an overlay and edits. **160 first, then 201**, or they conflict in `BoardEditor.tsx`.
- **Same-edit-site collisions on the server:** 144's `beside_links` and EXP1's `page_links` edit the same journal
  upsert. E2 adds one `where` line and E3 one branch, no column and no `$N`, so **at most a textual conflict.**

## 4 · The build, in order, and what it costs

| # | slice | sites | needs a box? |
|---|---|---|---|
| 1 | server: E1–E5 + the leak guard | `migrate.ts` (1), `sync.ts` (upsert `where` 1, route branch 1, `purgeJournalEntry` 1, mapper 1), `types` (1) | no — browserless, the S0 run is its proof |
| 2 | client tombstone: type, `applyCollection` exception (+clear dirty), local blank-on-purge, the four reader sites, `restoreEntry` guard, `BoardPinBox` null + prune | `persistence.ts`, `BoardEditor.tsx`, `types` | no for the store; the pin render wants a browser |
| 3 | the Trash's buttons + the two confirms (item and whole bin, counts over the FULL enumeration) | `BoardEditor.tsx` action row + Trash head | yes |
| 4 | the two-device checks (design §7, on `/api/_sync_mode`) | new `item201.mjs` | yes |
| 5 | cards (`purgedCardIds` in `board-meta`, the apply-time union) | — | **blocked on 168-B** |

## 5 · Questions, with my lean

- **Q1 — the card residual (the design's own ask).** Accept the bounded window for cards (design's lean) or open a
  per-card server merge. **Lean: accept.** I cannot improve on the design's reasoning and did not test this half.
- **Q2 — who owns "a pin to a purged page renders nothing / is pruned"?** **Lean: 201** (purged only); **168-B**
  owns hiding a merely-*trashed* page's cards on other boards. It is one function either way.
- **Q3 — do binders and drawers get a purge?** **Lean: not in 201; ask Nick only if the bin's "everything" is meant
  to include them** (it lists pages, boards and cards).
- **Q4 — the leak guard as a permanent check.** **Lean: yes.**

## 6 · Not measured, said plainly

- The **client** half is read, not run: no `applyCollection` exception exists yet to test.
- Real two-device timing (a long-offline device) is design §7 checks 1–3; my run drives the **server** with one
  user and stale/newer pushes, which proves the guard and the pull, not device convergence.
- **Production Postgres version** unknown; nothing here is version-specific.
- Nothing about backups (the design's honest caveat stands; not a code question).
