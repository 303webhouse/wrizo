# Delete for good: plan

Status: PLAN, for Fable's review. No code until it is cleared.
Why: Nick chose option A (Oct 18). Wrizo cannot delete a document permanently today, and the Autism Economy seed needs it.
Today:
- A page, board, binder or drawer only gets a `deletedAt` stamp and stays, locally and on the server.
- The server has no delete route: soft deletes travel as ordinary upserts (`apps/server/src/sync.ts`, its header).
- Trash lists every deleted page indefinitely (`persistence.ts` `reconcileSystemBoard`, `qualifyingPagesFor('trash')`).
- A board CARD is the only thing that can be purged: `purgeDeletedBox` leaves an id-only marker inside `boxes`, which `mergeBoxLists` carries to other devices.
- This plan gives pages, boards, binders and drawers the same final, syncable purge.

## 1. A column, not a route

**The choice: one nullable `purged_at timestamptz` column**, added to `journal_entries`, `projects`, `drawers` and `story_plans`. It is added on the same idempotent boot path as every column since W1 (`apps/server/src/migrate.ts`: `alter table … add column if not exists`). A purge is an ordinary sync record.

**Why not a `DELETE` route.** A route would still need everything the column gives, plus more.
- **Other devices could not learn of the delete.** A pull returns rows changed since the cursor. It cannot show a row's absence, and the client's `applyCollection` never removes a local row. A route would need a separate deletions table to announce purges, which is a column under another name.
- **Resurrection.** An offline device that still holds the page, and has an unsynced edit to it, pushes that edit later. With the row gone, the upsert simply re-inserts it, and the page comes back. A guard needs something to check, and a deleted row leaves nothing. The column leaves a shell to check against (section 2).
- The column rides the machinery that already works: last-write-wins on `updated_at`, the Postgres-stamped `synced_at` cursor (ITEM 198), and the push and pull mappers.

**What a purged row keeps, and what it loses.**
- **Kept: the shell only.** That is `id`, `user_id`, `created_at`, `updated_at`, `deleted_at`, `purged_at` and `synced_at`.
- **Lost: every content column, cleared by THE SERVER.** It does not trust the client to have emptied them.
  - On `journal_entries`: `text` becomes `''`, and these become null: `boxes`, `script`, `tutor`, `strokes`, `tags`, `routed_project_ids`, `page_settings`, `plan_board_id`, `project_id` and `beat_id`.
  - On `projects`: `title` becomes `''`, and `sprint_text`, `tutor`, `story_plan_id`, `last_active_page_id` and `drawer_id` become null.
  - On `drawers`: `name` becomes `''`.
  - On `story_plans`: `beat_notes` becomes `[]`.
- **What remains is no writing at all,** only proof that an id once existed, so it is never offered again. A later server-side reaper could remove the shells, but only after every device has synced past the purge, which the server cannot know. So this plan does not reap, and says so.
- **Recommendation: also clear `drafts` and `sessions_log` rows for a purged project.** `drafts` holds a project's scratch text, which is content, so its row's `text` becomes `''` as well. `sessions_log` holds counts and timestamps with no words. It keeps its rows; only the `project_id` pointer is nulled (the purge rule). It is the TTFK measurement, not the writer's work.

## 2. How a purge travels, and how it stays final

**On the client:**
- `purgeEntry(id)`, `purgeProject(id)`, `purgeDrawer(id)` and `purgeStoryPlan(id)` live in `store/persistence.ts`. Each:
  1. refuses unless the record is already soft-deleted (Trash first, always: purge is never one step from a live document);
  2. replaces the local record with the shell (`{ id, createdAt, updatedAt: now, deletedAt, purgedAt: now }`);
  3. marks it dirty and flushes.
- Sync pushes the shell like any record.
- The local cache keeps the shell, so that `dirty` and `applyCollection` treat it as a known row and never as a hole to be refilled.

**On the server (in each `upsert*`):**
- An incoming record with `purgedAt` writes the shell (the content columns cleared, as in section 1) and `purged_at = now()`. This happens **whatever `updated_at` says**: purge beats any edit.
- An incoming record without `purgedAt` for a row whose `purged_at` is already set is **refused silently**: no change, no `synced_at` move. **This one rule stops resurrection.** A stale device's edit can never undo a purge, however new its clock claims to be.
- The pull mappers carry `purged_at` → `purgedAt`. The server drops unknown fields silently in both directions, so both mappers are edited, and the harness proves the round trip (section 6).

**On every other device (in `applyRemoteRecords` and `applyCollection`):**
- A pulled record with `purgedAt` **always wins**, even over a local dirty copy. The local copy is replaced by the shell, and its dirty flag is cleared, so the stale edit is never pushed.
  - This is the one place where a remote record beats a local unsynced edit. It is deliberate: the writer chose to destroy it.
- Every reader skips shells. That covers `getJournalEntries`, `getDeletedEntries` (so a purged page leaves Trash), `getProjects`, `getDrawers`, `getStoryPlans`, and the system boards' reconcile. A `isPurged(record)` helper is used everywhere, and a guard (section 6) proves that no reader lists a purged record.
- An open page that is purged elsewhere closes to the Desk on its next pull, with no error text. A writer cannot purge a page they are standing on: purge lives only in Trash.

## 3. Trash: "Delete for good" and "Empty Trash"

**Both live only in Trash** (the system board at `/trash`), and both go through the existing `requestDelete` gate with `always: true` (it always asks; "don't ask again" never applies).

**"Delete for good" on a trashed page or board card.** The card menu that today offers only Restore for a page (`BoardEditor.tsx`, the Trash card menu) gains Delete for good. Its dialog uses the existing purge copy: "Delete for good?", the card version's wording ("This can't be undone").

**"Empty Trash"**, in the Trash board's own menu (its right-click on the empty canvas, where a board's menu lives). It purges every item in Trash at once:
- every trashed page and board (`purgeEntry`);
- every trashed card (`purgeDeletedBox`, the existing path).

Its dialog names the count: "Delete 37 items for good? This can't be undone." When Trash is empty it is greyed.

**Binders and drawers.** Today a deleted binder or drawer never appears in Trash (a binder has no delete UI at all), so Empty Trash cannot reach them.
- This ticket adds the store functions and seams for them (`purgeProject` and `purgeDrawer`, refusing unless soft-deleted), so the seed script can empty an account.
- It does NOT add them to Trash's view. That is a design question for the Trash board (how a binder card would look), handed up as Q1 rather than decided here.
- A deleted drawer's or binder's contents are purged only if they are themselves in Trash.

**The seed's delete paths (a contract with `scripts/seed/autism-economy.mjs`, branch `autism-economy-seed` @ `b710894b`).** This ticket exposes them as `window.wrizoDelete`. Each calls the store functions above and flushes before it returns.
- `softAll()`: every live page, board, binder, drawer and plan to Trash, by the app's soft deletes. Built-in places are skipped. It returns the counts.
- `emptyTrash()`: Empty Trash's own function. It returns the count purged.
- `purgeDeleted()`: every soft-deleted binder, drawer and plan, deleted for good. It returns the counts.

The seed script refuses `--apply` until all three exist.

**Restore after purge.** Restore is not possible. The card is gone from Trash, and no reader lists the shell.

## 4. Links and pins pointing at a purged item

Every reference to a purged entry is cleared at purge time on the purging device, in the same flush. Other devices clear their own copies on pull, because the readers skip shells.

| Reference | Where | What happens |
|---|---|---|
| A page pin on any board (`box.kind === 'page-pin'`, `box.entryId`) | the boards' `boxes` | The pin box gets a purge marker (the card purge's own shape, `purgeMarker`), so `mergeBoxLists` carries it everywhere. |
| Connectors to that pin (`connA` / `connB`) | the same board | They are already hidden by `liveBoxes` once an endpoint is gone. They are also purge-marked, so no dangling connector is stored. |
| System board cards (Journal, Shelf, Trash) | reconciled from the readers | Nothing to write: the readers skip the shell, so the next reconcile drops the card. |
| A page's plan board (`page.planBoardId`) | the page row | Purging the page: the paired board is unpaired (`unpairPlanBoard`) and stays a normal board. Purging the board: the page's `planBoardId` is cleared. |
| A binder's `lastActivePageId` | the projects row | Cleared when it names the purged page. Resume falls back to the newest page (F1's rule). |
| Provenance (`box.sourceEntryId`, `box.trashedFrom`, `copiedFromBoardId`) | other boards' boxes | Left as they are. They are history, never followed as links: a dead id there is harmless and shows nothing. |
| Local pointers (`lastPlace`, `wayBack`, `resume`, `wrizo-mode-page-<id>`) | localStorage, this device | Cleared on the purging device. On other devices each one already falls back when its target is missing, as for a deleted page today, and the harness confirms it. |
| Cross-board links (connector-b) | not shipped | If connector-b merges first, its link rows naming a purged entry are cleared by the same purge. If this ships first, connector-b's ticket takes on that rule. |
| A purged binder's pages | `entry.projectId` | Only items in Trash are purged (section 3). A live page whose binder is purged is re-homed to Unsorted (`projectId: null`, `origin: 'loose'`), never silently purged. |

## 5. The backup rule

The same as connector-b, because it adds columns to production. Before the deploy that adds `purged_at`, through chat 1:
1. A full `pg_dump` of production.
2. A row count per table.
3. A restore of that dump into a throwaway local Postgres, with the counts matched.
4. Nick types every credential himself. No database address or secret is printed or saved. Only times and counts are reported.

**The seed (Nick's account) adds its own safeguard, as ruled.** Before any delete:
- a full local export through the app's own paths: the account's complete `/api/sync` pull saved as JSON, plus the app's own "Everything" markdown export;
- it refuses to delete if that export fails or is empty while the counts are not.

The purge step then needs Nick's word, given at that moment, and a typed confirmation in the visible browser.

## 6. The harness

**Browserless checks**

- **`scripts/delete-for-good-check.mjs`** runs the real client store modules (bundled with esbuild, as in `typed-literal-check`):
  - purge refuses a live record;
  - the shell's shape;
  - every reader skips a shell (an enumeration over the readers, with the readers printed so the guard cannot pass blind);
  - a pulled purge beats a local dirty edit, and the dirty flag is cleared;
  - the references in section 4 are cleared;
  - Empty Trash's count is right.
  - Mutants: the reader skip, the dirty override, the pin marker.
- **The server proof** (the throwaway-Postgres pattern of `connector-b`'s migration proof):
  - the migration is idempotent;
  - a purge upsert clears every content column, server-side, even when the client sends content;
  - a later non-purge upsert with a NEWER `updated_at` is refused (no resurrection);
  - `purged_at` round-trips through push and pull;
  - another user's id is untouched.

**Browser: `scripts/harness/delete-for-good.mjs`**, against the local server with a throwaway account.
- **One device:**
  - trash a page and a board;
  - press Delete for good on one, through the real dialog;
  - press Empty Trash for the rest;
  - Trash is empty;
  - the pins and connectors to those items are gone from the boards;
  - Restore is not offered;
  - the counts drop exactly.
- **Two devices** (two browser contexts on one account):
  - Device B is open on a page and holds an unsynced edit to it while A purges the page.
  - After B's next sync, the page is gone from B, B's edit was never pushed, and the server row is still a shell. B's dirty push is refused, as checked by reading the server's full pull.
- **Page primacy:** purge lives only in Trash. Purging something another device has open closes it there to the Desk, with no error.
- **Parks:** any existing check asserting "Trash lists every deleted page forever" or "a page card in Trash offers only Restore" is parked with a successor. A behaviour sweep, grepping what the change does (Trash reconcile, the Trash card menu, `deletedAt` readers), finds them before the pair.
- **The full pair before merge.** This touches save, sync and persistence: the fast-lane rule (Oct 15) names those for a full pair.

## 7. Order

1. Plan cleared (this document).
2. Checks first, red, then the build (client, server and seams), then the browserless set and mutants.
3. Chat 1: a box turn, the full pair, the backup proof (section 5), the merge and the deploy.
4. Then the seed: `--dry-run` counts shown to Nick, Nick's go, the typed confirmation, then `--apply`, which soft-deletes everything, empties Trash, and purges binders, drawers and plans before the seed. Live frames go to Fable.

## 8. Questions

- **Q1.** Should a deleted binder or drawer appear in Trash, so Empty Trash reaches it from the UI? Lean: not in this ticket. The seed reaches them through seams; Trash's binder card is its own design.
- **Q2.** `sessions_log`: is keeping the TTFK rows (no words) right, or should a purge null more of them, or delete them? Lean: keep, with `project_id` nulled.
- **Q3.** The open page purged elsewhere closes to the Desk silently. Should it say why, in one quiet line? Lean: a one-line toast, "This page was deleted for good on another device."
