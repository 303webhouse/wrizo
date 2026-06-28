# Pages & the Shelf — D2 (CC brief)

**Branch:** `d2-pages-shelf` off `m1-creative-flow`.
**Combined:** D2 (the Page level) and the Shelf are one data slice — the Shelf is just the unfiled case of a Page — so they ship together.

## Why
D1 gave a browsable Drawer -> Binder tree. The page level is still missing: loose pages can't be filed, there's no holding area for unsorted pages, and the blocker under all of it — **journal pages don't sync server-side** (the client pushes/pulls them; the server has no table, so they live only in each browser's localStorage). D2 makes pages first-class: durable (synced), filable into Binders, or held on a new Shelf. It also lays two seams the later modes / Plan work needs.

## The one load-bearing decision (veto if you'd call it differently)
A page's home is exactly ONE of three places:
- **In a Binder** — `projectId` = the binder's id.
- **On the Shelf** — `projectId` null AND `shelved: true`. Loose pages awaiting a home; not journal material.
- **In the Journal** — `projectId` null AND `shelved` falsy. The chronological capture stream, where every existing entry already lives.

One boolean keeps Journal and Shelf as distinct pools, does NOT convert Journal into a Binder (that's later — Foundation 6), and needs no migration: existing entries stay in the Journal by default. Filing a page moves it between these states.

## Scope — build this, in order

### Slice 0 — Journal entries sync server-side (foundation; verify before continuing)
The client half is already done (journalEntries are in `getDirtyRecords`, `applyRemoteRecords`, and `stampMap`). Add the server half, mirroring the drawers / storyPlans pattern exactly:
- **Schema** (same boot-idempotent DDL path in `migrate.ts` as drawers): `create table if not exists journal_entries` carrying every JournalEntry field — `id` (text pk), `user_id` (uuid -> users), `project_id` (text, nullable), `text`, `starred` (boolean), `source` (text), and JSONB columns for the array / ink fields (`tags`, `routed_project_ids`, `strokes`) — plus `deleted_at`, `created_at`, `updated_at`. Add the two NEW columns from this brief: `shelved boolean not null default false` and `beat_id text`. Index on `(user_id, updated_at)`.
- **apps/server/src/sync.ts:** `rowToJournalEntry` + `upsertJournalEntries` (last-write-wins, user-scoped, soft-delete; copy `upsertStoryPlans`' shape, `JSON.stringify` the jsonb fields as it does for `beat_notes`). Call it in the `/sync` handler from `push.journalEntries`; add `journalEntries` to the pull response.
- **apps/desktop/src/store/api.ts:** ensure the pull type includes `journalEntries` (push already covered).
- **Gate:** same untested-round-trip risk as drawers. After it lands, confirm a journal page made in one session appears after a pull elsewhere (and that a binder-filed page carries its `projectId`) before building the rest.

### Slice 1 — Page model + the two new fields
- **types/index.ts:** add `shelved?: boolean` and `beatId?: string` to `JournalEntry`. (`beatId` is the Page<->Beat seam — Foundation 3 — laid now so a page can know its plot slot; the Plan-jump UI is later.)
- **persistence.ts:** the page is the unit. Add / refine helpers:
  - `getJournalPages()` — `projectId` null AND not `shelved` (the existing `getJournalEntries`, refined to exclude shelved).
  - `getShelfPages()` — `projectId` null AND `shelved`.
  - `getBinderPages(binderId)` — `projectId === binderId`.
  - `setPageHome(pageId, target)` where target is a binderId, `'shelf'`, or `'journal'` — sets `projectId` / `shelved` accordingly via `saveJournalEntry`, enforcing exactly-one-home (setting a binder clears `shelved`; shelving clears `projectId`).
  - keep `createJournalPage` (Journal default); add `createShelfPage()` (`projectId` null, `shelved` true).

### Slice 2 — The Shelf surface + filing
- **New top desk-area "Shelf"** (sits in the top bar beside Journal / Drawers / Library, per the agreed hierarchy) and a `/shelf` route: a sortable list/grid of shelf pages; open a page (existing page editor); **file to...** a Binder (sets `projectId`), or **send to Shelf / to Journal**; create a new shelf page; multi-select for bulk file (sets up the future AI "tidy the shelf").
- **Binder home (ProjectHome) gains a "Pages" section:** lists `getBinderPages(binderId)`, click to open, with move-out (to Shelf / Journal / another binder). This is what makes filing visible — a page filed into a binder appears here. Leave the binder's existing main draft and StructureBoard entry points untouched; for now the main draft is the binder's primary surface and Pages are additional documents.
- **The Journal** stays the chronological stream, now showing only non-shelved loose pages (`getJournalPages`).

## Non-goals — explicitly deferred, do NOT build
- **Body-vs-page unification** — making the Binder's main draft just another Page, and moving the fragment substrate per-page. The binder's main draft stays as-is; Pages are additional documents. Known debt, resolved when "pages as primary substrate" is tackled. Do not touch the fragment substrate.
- **Full mode-aware editing on a Page** (Free write / Draft / Format tabs on an arbitrary page). D2 opens pages in the existing page editor; wiring pages to the mode-aware editor is the modes-UI brief.
- **AI auto-organize the Shelf.** Needs the AI-features layer. Design the Shelf so it's a clean drop-in later: a "tidy the shelf" action that proposes binder assignments for multi-selected pages (a sorting / suggestion task — permitted under the AI boundary, not prose generation). Not built now.
- **Journal-as-Binder** (Foundation 6) — Journal stays a stream this slice.
- **Drag-and-drop** filing — use menus; drag later.

## Invariants / guardrails
- Mirror the proven persistence + sync pattern — but `journalEntries` are ALREADY wired client-side, so this slice is mostly the server half (Slice 0) + the two new fields + the surfaces.
- Last-write-wins, user-scoped, soft-delete. A page's home transitions are ordinary record updates (set `projectId` / `shelved`, bump `updatedAt`) — they sync like any edit.
- A page is in exactly one home at a time (binder XOR shelf XOR journal) — enforce in `setPageHome`.
- No new deps; minimal changes; no refactors outside scope (AGENTS.md hard rules).

## Definition of Done
- `tsc` (desktop + server) + `pnpm build:web` clean.
- Slice 0 round-trip: a journal page (and a binder-filed page, carrying `projectId`) made in one session appears after a pull elsewhere; last-write-wins; soft-delete travels.
- Create a page on the Shelf; file it into a Binder -> it appears in that Binder's Pages and leaves the Shelf; send it back -> returns to Shelf; to Journal -> appears in the Journal stream. All persist and round-trip.
- Existing entries appear in the Journal (not the Shelf) with zero loss.
- `shelved` + `beatId` persist and round-trip (`beatId` has no UI yet — assert it survives a save/pull).
- Harness selftest green; CDP check that the Shelf renders, file-to-binder moves a page, and the Journal excludes shelved pages.
- `pnpm install` + both typechecks + web build + harness before done.

## Deploy note
`journal_entries` + the two new columns apply via the boot-idempotent DDL on the next `railway up`, same as drawers — no manual migration.
