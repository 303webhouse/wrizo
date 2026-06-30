# B1 — Start a book: content types + create pipeline (CC brief)

**Branch:** `b1-start-a-book` off `main`.

## Why
You can't sit down and start a book yet — there's no notion of what a project *is* (book vs story vs screenplay), no page types, and the New Page / New Project flow isn't linked end to end. B1 is the create-and-organize spine: the taxonomy (what a project holds), the create pipeline (a skeleton — refined later), and the wiring so a Book can actually be started and written — all on existing plumbing. New books are modeled as a project of chapter Pages from the first keystroke, which sidesteps the body-vs-page debt (legacy single-body projects untouched).

## The model — keystone decisions (do NOT flatten these three levels)
- **Binder kind** (the project's form): `Book · Story · Screenplay · Other`. A new `kind` facet on Project. Sets the project's shape — and later its structure scaffold + Format conventions (deferred). This is the long-deferred Binder.kind facet. "Binder" stays a backstage word; the UI shows the project's name, never the label.
- **Page type** (what a page is within a project): `manuscript` (the writing — chapters/scenes) vs support pages `character` · `worldbuilding` · `research` · `note`. A new `pageType` facet on the Page (JournalEntry).
- **Story Structure is NOT a page — it's the project's Plan.** The existing StoryPlan / StructureBoard, reached via the Pages<->Plan toggle. Do not model structure as a document or a page type.

`kind` is distinct from the existing `type: creative|academic` (which stays default `creative`; academic is deferred). `kind` is the "what are you writing" axis.

## Scope — build this, in order

### Slice 1 — Taxonomy (data + sync)
- **types/index.ts:** add `kind?: 'book'|'story'|'screenplay'|'other'` to `Project`; add `pageType?: 'manuscript'|'character'|'worldbuilding'|'research'|'note'` to `JournalEntry`.
- **Server** (same boot-idempotent DDL + sync pattern as `drawer_id` / `shelved`):
  - `alter table projects add column if not exists kind text`; carry `kind` in `rowToProject` + `upsertProjects`.
  - `alter table journal_entries add column if not exists page_type text`; carry `pageType` in `rowToJournalEntry` + `upsertJournalEntries`.
  - No backfill needed — these are new fields on records that already sync; existing rows simply read null (treated as Other / untyped).
- **persistence.ts:** extend `createProject` (or add `createBinder(title, kind, drawerId?)`) to set `kind` + optional `drawerId`; add `createBinderPage(binderId, pageType)` -> a JournalEntry with `projectId = binderId`, `pageType`, `source: 'page'`. Existing `createJournalPage` / `createShelfPage` keep their loose-page behavior.

### Slice 2 — The create pipeline (skeleton)
- **New Project:** extend the existing CreateProject flow with a **kind picker** (Book / Story / Screenplay / Other) + title (+ target drawer when launched from a drawer). On create: set `kind` + `drawerId`. For **Book / Story**, also create a first `manuscript` page and open it in the editor (Slice 3). For **Screenplay / Other**, create the project and open its home.
- **New Page:** context-aware — launched inside a project -> a `manuscript` page parented to it (with an option to pick a support type); launched loose (home) -> the existing Journal/Shelf page.
- **In-drawer "Create New" (#10):** at the bottom of an expanded drawer's items (DrawersTree), a **Create New** affordance -> **New Page** / **New Project**, scoped to that drawer (a project created here gets that `drawerId`).
- Home "New page" / "Begin project" route into the same create flow.

### Slice 3 — Project home + writing the chapters (the page-editor wiring)
- **ProjectHome:** surface the project's pages from `getBinderPages`, grouped by type — **manuscript** pages (chapters/scenes, ordered) vs **support** pages (Character / Worldbuilding / Research / Note). Add "new chapter" (manuscript page) and "add support page" (pick type). The Pages<->Plan toggle reaches the StoryPlan (structure), unchanged.
- **Page-editor wiring (the piece that makes "write a book" work):** a `manuscript` page opens in the mode-aware editor (Free write / Draft / Format), operating on the page's text. New books therefore live entirely as project + chapter Pages — they never touch the project's single `sprintText` body. Legacy single-body projects keep their existing body and deferred status; this wiring does not touch them. **Approach this slice carefully — it is the load-bearing one.** The "new book = Pages-only" principle is what keeps it off the body-vs-page debt; if the mode-aware editor turns out to be hardwired to a project's `sprintText` and can't cleanly open a Page, flag it rather than forcing it.

## Non-goals — deferred
- **Structure auto-scaffold per kind** (a Book auto-creating a 3-act plan). Structure stays opt-in via the existing wizard/board; wiring kind -> a default framework is later.
- **Format conventions per kind** (screenplay layout, etc.) — Format mode is greyed; deferred.
- **Support-page templates** (a Character Sheet with fields) — B1 creates a blank page of the right `pageType`; templates later.
- **Academic type / S2-ACA** — out of scope; `type` stays default creative.
- **Body-vs-page unification for legacy projects** — untouched; only new Books/Stories are Pages-only.
- **A polished create dialog / the full pipeline** — B1 is the skeleton; refinement later.

## Invariants / guardrails
- New Book / Story projects use chapter Pages, never the `sprintText` body — this is what sidesteps the deferred unification.
- All new fields ride the proven additive DDL + per-collection sync pattern (mirror `drawer_id` / `shelved` across `rowTo*` + `upsert*`).
- Last-write-wins, user-scoped, soft-delete. No new deps; no refactors outside scope (AGENTS.md hard rules).

## Definition of Done
- `tsc` (desktop + server) + `build:web` clean; `kind` + `pageType` round-trip (create on one session, pull intact on another).
- From the home OR an open drawer: create a **Book** (pick kind + title) -> it lands in the chosen drawer -> a first chapter opens in the editor -> write -> add a second chapter -> both appear in ProjectHome under manuscript, the structure board reachable via Plan.
- New Page in a project -> a manuscript page in that project; New Page loose -> a Journal/Shelf page (unchanged).
- In-drawer "Create New" offers New Page / New Project scoped to that drawer.
- Support pages (Character / Worldbuilding / Research) can be created in a project and appear grouped separately from manuscript pages.
- Harness selftest green; CDP: create a Book -> chapter opens -> add chapter -> both in ProjectHome.
- `pnpm install` + typechecks + web build + harness before done.

## Deploy note
`projects.kind` + `journal_entries.page_type` apply via the boot-idempotent DDL on the next `railway up`, same as the prior columns — no manual migration.
