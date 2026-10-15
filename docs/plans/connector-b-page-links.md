# connector-b — the `page_links` storage (PLAN ONLY — no code, no migration)

**Branch:** `connector-b` (off `main` @ ec5c280f). **Author:** INK. **Status:** plan for Fable's review. **Nick's route (b), Oct 14:** `page_links`, the column he approved on 2026-09-23 ("1. Yes", EXP1-Q1) and Fable named `page_links` / JS `pageLinks`. It was never built: `main` has no `pageLinks` and no `page_links` anywhere in `apps/server`.

**What it is for.** connector-a (no schema) keeps every same-board card↔card thread exactly where it lives today — a `'connection'` box inside the board's own `boxes` jsonb. connector-b is for the pairs a connection box **cannot** hold, because its two ends are *entries*, not boxes on one board:

| Pair | Today | With `page_links` |
|---|---|---|
| card ↔ card, same board | `'connection'` box | **stays a connection box** (never migrated) |
| card ↔ page / card ↔ board, target NOT on this board | impossible | link record |
| card ↔ card, different boards | impossible | link record |
| page ↔ page, page ↔ board, board ↔ board | impossible (only membership: page-pin; 1:1 Plan pairing: `planBoardId`) | link record |
| a menu thumbnail dropped on the board ("connected copy") | n/a | the copy is a card; the link ties it to its source |

**The rule that keeps one truth:** a link between two boxes of the SAME board is ALWAYS a connection box; `page_links` holds only what a connection box cannot. The connector UI decides at creation by looking at the two endpoints, so a pair is never represented twice, and toggle-to-disconnect removes whichever record joins the pair.

## 1. The exact column

```sql
alter table journal_entries add column if not exists page_links jsonb default '[]'::jsonb;
```

- **Name / type:** `page_links`, `jsonb`. JS side `pageLinks`.
- **Nullable, default `[]`:** no `NOT NULL`, no `CHECK`, no backfill, no index. Postgres 11+ applies a constant default to existing rows as **metadata only** (no table rewrite, no long lock); existing rows read `[]`.
- **Additive only, idempotent:** `add column if not exists`, the same recipe as `boxes`, `script`, `tutor`, `page_settings` (`apps/server/src/migrate.ts` L92–168). Running it twice changes nothing.
- **Nullable-safe on EVERY path.** The client treats SQL `NULL`, jsonb `null`, `[]` and "absent" as the same thing — *no links* — and a page with none stays byte-identical to today (no `pageLinks` key on the entry): `pageLinks: Array.isArray(r.page_links) && r.page_links.length ? r.page_links : undefined`. (The existing precedent writes `JSON.stringify(x ?? null)`, which stores jsonb `null`, not SQL `NULL`, so the default `[]` would be shadowed on every insert; the read mapper above makes that harmless.)
- **EXP1's old shape is superseded for THIS column.** EXP1's brief put `{ anchors: [], links: [] }` (an object) in `page_links`. The column Fable asked for defaults to `[]`, so it holds an **array of link records**. If EXP1's text anchors are ever revived they get their own column (`page_anchors`) or an optional `anchorId` on a link record; nothing here blocks either.

## 2. The link record, and both directions

```ts
// types/index.ts — additive-optional on JournalEntry
export interface PageLink {
  id: string;                 // stable, never reused (generateId)
  aEntryId: string;           // ALWAYS the entry that OWNS this record (the one whose page_links holds it)
  aBoxId?: string;            // a card on entry A (when A is a board and the end is a card)
  bEntryId: string;           // the other end: a page or a board
  bBoxId?: string;            // a card on entry B
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;         // tombstone — a delete is a write, so it syncs and cannot resurrect
}
// JournalEntry.pageLinks?: PageLink[]
```

**Both directions — stored ONCE, read from either end.** The record lives on the entry where the writer started the drag (A). The reverse question — "what links point AT this page/card?" — is answered by scanning the in-memory cache for records whose `bEntryId`/`bBoxId` match, exactly as `getBoardsPinning` already scans for pins (`persistence.ts` L1745). Two helpers: `getLinksOf(entryId)` (owned) and `getLinksTo(entryId, boxId?)` (reverse), merged into one list for the Grafts/Links tab, the card footer and the connector lines.
- **Why not mirror it onto both entries:** two writes, two last-writer-wins clocks, and a split-brain where one side's delete loses to the other side's stale copy. A single owner means one tombstone decides.
- **The cost, stated:** the reverse read is a cache scan (fine at today's scale; EXP1's Shape B — real `links` tables with a `links_target` index — remains the graduation path, and the field names here are kept compatible so graduating is a migration of storage, not of meaning).
- **Dangling ends:** a link whose end resolves to nothing (hard-deleted) is dropped at read, never shown as "Missing page"; a soft-deleted end (Trash) shows as such, as `getJournalEntryIncludingDeleted` already does for pins.
- **The "X with confirm" on a thumbnail, and Delete on a selected line,** both write the tombstone (`deletedAt` + `updatedAt`), which bumps the OWNER entry's `updatedAt` so it syncs.

## 3. The server — FIVE edit sites (the column is silently dropped if any one is missing)

`/sync` copies journal entries field by field, so an unknown field is dropped in **both** directions with no error. All in `apps/server/src`:

1. **`migrate.ts`** (after the `proofing` line, ~L197): the one `alter table` above, with the comment block.
2. **`sync.ts` `rowToJournalEntry`** (L114, beside `pageSettings`): the read mapper above.
3. **`upsertJournalEntries` INSERT column list** (L277): `…, page_settings, page_links)`.
4. **VALUES placeholders** (L278): `…,$24::jsonb,$25::jsonb)`.
5. **`ON CONFLICT … DO UPDATE SET`** (L290) **and the parameter array** (L297): `JSON.stringify(e.pageLinks ?? null)` as `$25`. The pull (`select * from journal_entries`, L349) already returns the new column, so it needs no edit.

**The one place this plan departs from the `page_settings` recipe — the guard against old clients.** Every existing column is written `col = excluded.col`. An OLD client (one that has never heard of `pageLinks`) pushes an edited entry with `pageLinks` absent → `$25 = 'null'` → a plain `page_links = excluded.page_links` would **wipe the stored links** the moment that client edits that page. So the SET uses:

```sql
page_links = case
  when excluded.page_links is null or excluded.page_links = 'null'::jsonb
    then journal_entries.page_links          -- the sender does not speak page_links: keep what is stored
  else excluded.page_links                   -- the sender does: it is the new whole value ([] clears)
end
```
New clients express "no links" as `[]`, which is not null, so they can still clear. Old clients can never clobber. Everything else keeps the existing `updated_at` last-writer-wins `where` clause.

**Known limit, inherited and named (not new):** a link change is an entry change, so links ride the entry's single `updated_at`; two writers editing DIFFERENT links on one entry inside one sync window do not merge (the later `updated_at` replaces the whole array). Each record carries its own `updatedAt`/`deletedAt` so a **client-side merge on pull** (union by `id`, newest `updatedAt` wins, tombstones win) is a cheap v2 hardening; I propose it as a follow-up, not part of this column.

## 4. Old clients, old servers, and existing connection boxes

- **Old client + new server:** safe, twice over. (a) The guard above means it can never null the column. (b) Its local cache keeps any `pageLinks` it pulled (entries are saved with `{ ...latest, … }` spreads, so unknown fields ride along) and pushes them back unchanged. It simply shows no link UI. The B10.1 stale-client banner is the nudge to update.
- **New client + OLD server (the deploy-order trap):** the old server drops `pageLinks` silently on push and cannot return it on pull. Links would survive in the client's cache and not sync. **So: server first.** Migration + new server verified, THEN the client ships. Because an entry is only re-pushed when it changes, links made in the gap would stay local until their owner entry is next touched; the deploy order removes the gap entirely, and the first client build after the server also marks entries that hold `pageLinks` dirty once, as a belt.
- **Existing connection boxes:** untouched, forever. They stay inside `boxes`, drawn and deleted exactly as today (connector-a). No data migration, no dual-write. The Grafts/Links tab and the footer read the **union** (connection boxes on this board + `page_links` records), de-duplicated by construction (the rule above: a pair is stored in exactly one place).
- **A board that is also an entry:** its `page_links` and its `boxes` are two separate columns on one row; neither rewrites the other.

## 5. EXP1 — what is reusable

- **Reusable:** the five-edit-site recipe and its corrections (the brief's "two mapper lines" undercount); the migration comment's reasoning for *why* a column is needed at all (silent drop in both directions); the "harness asserts a round trip through the server, not merely a local write" discipline; the `rowToJournalEntry` null→undefined grandfather rule; the `Link` target field names (`targetEntryId`/`targetBoxId` ≈ my `bEntryId`/`bBoxId`).
- **Not reusable:** everything text-anchored — `store/anchors.ts` (523 lines: quote/prefix/suffix anchoring), `LinkedMarks`, `LinkedRail`, `WritingMenu`, the PageEditor/draftFormat hunks, `experiments.ts` flag. Connectors are endpoint-to-endpoint and have no text span.
- **The held branches** (`exp1-connect-text`, `exp1-connect-text-r2`, `item190-exp1-rail`, …) carry the migration and the sync diff in a different shape (object, `{anchors, links}`, no default). I would **lift the plumbing by hand, not merge them**: a merge would drag the anchor machinery and its harnesses in.

## 6. Rollback

Additive by construction, so rollback is a ladder, cheapest first, nothing destructive until the last rung:
1. **UI off:** hide connector mode (a flag, or revert the client). Data stays, harmlessly.
2. **Client revert:** old clients ignore the field and (by the guard) cannot damage it.
3. **Server code revert** (redeploy the previous build): the previous upsert never mentions `page_links`, so the column is untouched and ignored. The column and its data remain, unused.
4. **Drop the column** (`alter table journal_entries drop column page_links`) — only if Nick wants the data gone; the one destructive step, behind a fresh backup and Fable's review.
5. **The pre-migration backup** guards against a defect in the new upsert clobbering OTHER columns (the only real way this change could lose existing data); restoring from it is not needed to roll back the migration itself, because the migration only adds.

## 7. Verification (written before the code, run before any deploy)

- **`apps/server/scripts/harness/page-links-db.mjs`** (scratch Postgres 16, never production): the migration twice (idempotent); an entry round-trips `pageLinks` through push → pull; **an old-client push (field absent) leaves stored links intact; a new-client push of `[]` clears them; a push with links replaces; an older `updated_at` write is ignored (LWW); an entry that never had links reads back with NO `pageLinks` key.** Each with a mutant (drop the guard → the old-client case goes red; drop an edit site → the round trip goes red).
- **Desktop harness:** client round trip against the server double; a same-board pair writes a connection box and NOT a link; a cross-board / entry pair writes a link and NOT a box; the reverse read finds it from the other end; tombstone hides it and syncs; spread-preservation (an edit to the owner page keeps `pageLinks`).
- **Browserless guard:** the five edit sites present in source (a mutant removes each in turn).

## 8. What I need before any code
1. Fable's review of this plan (the guard clause in §3 is the one deviation from precedent).
2. **No migration runs, in any environment I touch, without Fable's review and a CONFIRMED BACKUP.** Proposal: before the server deploy, Chat 1 takes a full `pg_dump` of the production database, records per-table row counts, and restores it into a scratch database to prove it opens; Fable/Nick confirm that rehearsal. I do not run `railway` anything (deploys are Chat 1's, from the primary checkout only).
3. Deploy order: **server → verify (healthz, a sync round trip with the smoke account) → client.**
4. connector-a waits for `board-click-to-create` to land (both rewrite the canvas's pointer handling in `BoardEditor.tsx`; main also now carries FIX's selection-clear and native-drag refusal, which connector-a must keep), then branches off main.
