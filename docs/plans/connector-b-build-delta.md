# connector-b — build delta (against the approved plan, `docs/plans/connector-b-page-links.md` on `origin/connector-b` @ ddd04349)

**Branch:** `connector-b-build` (off `main` @ 3a71e34b). **Author:** INK. The plan's storage section (§1–§4, §6, §7) was built as approved; this lists only where the build interpreted, extended or deliberately did not build.

## Built as approved
- `page_links jsonb default '[]'` on `journal_entries` — additive, nullable-safe, idempotent, metadata-only default (`apps/server/src/migrate.ts`).
- The five `/sync` edit sites (read mapper, INSERT list, VALUES placeholders, ON CONFLICT SET, parameter array) and **the old-client guard, verbatim** (`apps/server/src/sync.ts`).
- Single-owner `PageLink` records with timestamps + `deletedAt` tombstones; the reverse read by cache scan; the one-truth rule at the door (`livePinFor`).
- Proof: `apps/server/scripts/harness/page-links-db.mjs` (the server's own compiled code against a throwaway Postgres on a free port, never production) — 13/13 including the OLD-SHAPE upsert case and its plain-`= excluded.page_links` mutant (turns D4 RED); `apps/desktop/scripts/harness/page-links.mjs` (browserless, 24/24: the data layer, the server's five sites, the surfaces' source pins, 11 mutants).

## Interpretations the mockup needed (for review)
1. **"Rail thumbnails" = the thumbnails in the Cascade rail's panels that stand for an ENTRY** — the Drawers panel's tiles (boards, loose docs, the anchor), the survey thumbnails (pages / boards) and the Plan panel's board rows. Each declares `data-link-entry="<entryId>"`; that attribute is the whole contract. The mockup's "Cards" rows (cards of other boards) have no rail surface in the app today and are not built.
2. **The arm now travels in a viewport overlay** (a portal on `body`), because it must reach the rail and the board canvas clips. This supersedes connector-a's ruling 4 ("arm clipped at the board edge") for the ARM only; the card↔card lines stay inside the canvas, clipped, never over the rail. connector-a.mjs's `arm()` helper reads client coordinates now (an instrument change, noted in its comment).
3. **A linked copy** = a text card at the drop point (a page's words clipped to 800 characters; a board's name) + a link record `card → that entry`. A survey row that is already a *draggable membership row* keeps its own HTML5 drag (pin display, item 125); the new pointer-drag applies to every other thumbnail.
4. **The tab's X** opens the standard dialog titled "Remove graft?" / "Remove link?" with Cancel / Delete and **no "Don't ask me again"**, and it asks even when "Ask before deleting" is off (an unlink keeps its own confirm).
5. **A released-on thumbnail whose page is already a pin card on this board is that CARD** — the release makes a connection box between the two cards, never a record (one truth).

## Deliberately not built (the plan's "later list")
Per-record client merge on pull; tombstone pruning; cleanup of links whose end was hard-deleted; the "mark entries holding pageLinks dirty once" belt (server-first deploy removes the gap it covers); EXP1's Shape B tables. Link arrays are last-write-wins like `boxes`.

## Deploy
**Not deployed, and the migration does not run anywhere but a scratch database** until Chat 1's verified `pg_dump` + restore proof and Fable's review of the code, **server first**, then the client. Full pair before merge. `rowToJournalEntry` and `upsertJournalEntries` are now `export`ed (no behaviour change) so the database harness can run the real code.
