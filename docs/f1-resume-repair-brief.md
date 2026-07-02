# F1 — Resume repair (the typed pointer) — build brief

**Branch:** `f1-resume-repair` off `m1-creative-flow`
**Arc:** F — "From open to flow" · ticket 1 of 6 · pure plumbing, no feel work
**Canon:** `docs/state-of-wrizo-2026-07.md` (Findings 1–2, Part IV) · Written 2026-07-01

## Why

The resume system predates Pages and it shows, live, on the flagship path:

- `resume.ts / getResumeTarget()` reads only `Project.sprintText` + story plans. It
  has no concept of binder Pages — where every Book/Story lives since B1.
- `PageEditor` autosaves `entry.text` only; the parent project's `lastActivityAt` is
  never bumped. A binder's resume pointer freezes at creation time.
- The Desk's "Keep writing" races that stale timestamp against `getJournalEntries()`
  (which includes filed chapter pages), so after any chapter session the route
  resolves to `/journal/:id` — the ink-authored surface, NOT the mode-aware
  PageEditor. Verified: `JournalEntry.tsx` contains no redirect for typed pages.

Beyond the wrong-editor whiplash, the same record is editable under two divergent
surfaces (data hazard: a chapter can acquire ink strokes its canonical editor never
renders). And F2's mirror card needs a TYPED pointer as its substrate — that pointer
is this ticket's product.

## The model

One rule, no personas: **the resume target is the most recently edited writing
surface, whatever it is** — a binder page of any pageType, a loose journal page, a
shelf page, or a legacy sprint body — and the pointer carries `kind` + `pageType` +
home so any surface can render from the writer's own trail.

## Slices

### Slice 1 — activity stamping (data)
- `types`: `Project.lastActivePageId?: string`; `lastActivityType` union gains
  `'page'`.
- `persistence.ts` — stamp in ONE seam: inside `saveJournalEntry`, when
  `entry.projectId` is set, stamp the parent project (`lastActivityAt = now`,
  `lastActivityType = 'page'`, `lastActivePageId = entry.id`). One seam catches
  PageEditor autosave, legacy filed-page edits via JournalEntry, and filing via
  `setPageHome`. Guard: skip silently if the project is missing or soft-deleted.
  Every-save stamping mirrors the existing sprint pattern (`setProjectSprintText`),
  so no new write cadence is introduced.
- Server: `migrate.ts` boot-idempotent
  `alter table projects add column if not exists last_active_page_id text`.
  `sync.ts`: carry `last_active_page_id` through `rowToProject` AND `upsertProjects`.
  `lastActivityType:'page'` is a new value in an existing text column — no DDL.

### Slice 2 — the typed resume target (`resume.ts`)
- `getResumeTarget()` v2 returns:
  `{ route, home: 'binder'|'journal'|'shelf', kind?, pageType?, project?, entry?,
     label, lastLine, daysAgo }`
- Candidate set, one recency race: binder pages, loose journal pages, shelf pages,
  and legacy sprint projects. Newest wins. Soft-deleted excluded.
- Route rules: typed → `/page/:id`; untyped filed / loose / shelf → `/journal/:id`;
  legacy sprint body → project overview (Change 4).
- Stale-pointer guard: a project's `lastActivePageId` must resolve to a live entry
  still parented to that project; else the newest remaining binder page; else the
  project overview.
- `lastLine`: last non-empty line of the target's text.
- `Desk.tsx`: DELETE the inline `keepWritingRoute` race; the primary action's route
  becomes `getResumeTarget()?.route`, else the create flow.

### Slice 3 — route hygiene
- `JournalEntry.tsx`: on mount, if `entry.pageType != null` →
  `<Navigate to={'/page/' + id} replace />`. Legacy untyped filed pages unaffected.
- Confirm a typed page cannot reach the ink view by any link.

## Definition of done
1. Type in a chapter (PageEditor) → parent project persists
   `lastActivityAt`/`lastActivityType:'page'`/`lastActivePageId`.
2. Desk after a chapter session → Keep writing routes to `/page/:chapterId`.
3. The typed target carries `kind:'book'`, `pageType:'manuscript'`, `home:'binder'`.
4. Loose journal page → `/journal/:id`. Shelf page → its editor, `home:'shelf'`.
5. Legacy untyped FILED page → `/journal/:id` (ink regression guard).
6. Deep link `/journal/:typedPageId` → redirected to `/page/:id`.
7. Stale pointer → newest remaining binder page, else the project overview.
8. `tsc` (desktop + server) + `build:web` + selftest green.
9. After deploy: live round-trip — push a project carrying `last_active_page_id`,
   pull it back intact.
