# J1 — Ordered journal pages + navigation — build brief

**Branch:** `j1-ordered-pages` — created FIRST, before the first edit. Off `main`.
**Arc:** J — "The Notebook & the Board" · ticket 1 of 4 · plumbing + light chrome
**Canon:** `docs/j-arc-design.md` (Fork 2) · Written 2026-07-05
**Deploy note:** harness-verifiable; one LIGHT phone check before deploy (arrow
placement vs the dissolve). Rides the next `railway up` after that check.
**Place this file at:** `docs/j1-ordered-pages-brief.md`

## Why

The Journal is the diary and drawing pad, but its pages have no order beyond
`createdAt` — you cannot arrange the notebook, and you cannot walk it. J1 gives
pages an explicit, cheap-to-edit order and puts prev/next under the writer's
thumb, which J3 (the spread view) and J4 (the group port) then stand on.

## Slices

### Slice 1 — the order model (data)
- `JournalEntry.orderIndex?: number` — additive, optional (the J6 pattern;
  `saveJournalEntry` untouched).
- Notebook sort for LOOSE journal pages: `orderIndex ?? epoch(createdAt)`,
  ascending = notebook order (oldest first, like a real notebook fills). No
  backfill, no migration — untouched pages keep their chronological place.
- Utilities in `store/pageOrder.ts`: `midpoint(prev, next)` for insert-between
  (handles the open ends: before-first, after-last), and `normalize(pages)`
  that re-spreads indexes when a neighboring gap falls below epsilon (1e-6) —
  called lazily by the insert path only when needed.
- Server: boot-idempotent
  `alter table journal_entries add column if not exists order_index double precision`
  + `order_index` through BOTH sync mappers (rowTo + upsert insert/params/
  on-conflict), per the checklist.

### Slice 2 — navigation (chrome)
- On a loose journal page: prev/next arrows in the journal's NAV chrome layer
  (they dissolve and summon with the rest of the chrome — zero new dissolve
  logic). Prev/next move through the notebook order from Slice 1.
- At the last page, the forward arrow renders as **"+"** — tapping it creates
  a new blank page at the end (append: `midpoint(last, undefined)`), opening
  it in the authored editor. Honor-discard already guarantees an abandoned
  blank leaves no litter — no new code, verify only.
- A distinct quiet **"+ insert"** affordance (adjacent to the arrows) creates
  a blank page BETWEEN the current page and the next
  (`midpoint(current, next)`).
- Filed pages and Shelf pages show none of this (scope: the loose notebook).
- Keyboard: left/right arrow keys navigate ONLY when no editable has focus
  (the F3 `n`-shortcut guard pattern, reused).

### Slice 3 — verification
- Mixed-population sort: pages with and without `orderIndex` interleave
  stably by the fallback rule; assigning an index moves exactly that page.
- Insert-between lands between; survives reload and a harness sync
  round-trip. Normalize triggers correctly under exhausted gaps (seeded).

## Non-goals (later tickets / logged)
The eraser (J2); the spread view + drag reorder + multi-select (J3); the Board
and the port (J4); page-flip gestures (buttons only — margins scroll); binder
or Shelf ordering; any change to page content, ink, or filing.

## Invariants
- One-home untouched; text and strokes untouched; forward-only untouched.
- The arrows live in the existing chrome layer — dissolve behavior identical.
- No backfill: a null `orderIndex` is a first-class state forever.
- Sync checklist: `order_index` in push AND pull mappers; live round-trip on
  the deploy that ships this.
- Arrow-key nav NEVER fires while any editable has focus.

## Definition of done (in-harness + light phone check)
1. Notebook order = `orderIndex ?? createdAt`, ascending, stable across a
   mixed population; verified pre- and post-assignment.
2. Prev/next walk the order; the forward arrow becomes "+" only at the end;
   end-"+" creates-and-opens; abandoning it blank honor-discards.
3. "+ insert" places a page between current and next; order survives reload
   AND a sync round-trip in the harness.
4. Normalize re-spreads correctly when midpoint gaps are exhausted (seeded
   tight-gap fixture).
5. Filed and Shelf pages show no arrows; arrow keys dead while typing.
6. `tsc` (desktop + server) + `build:web` + selftest green; CDP checks 1–5.
7. Phone check before deploy: arrow/"+" placement and tap size on the S25,
   and that they dissolve with the chrome mid-writing.

## Working environment
- Branch `j1-ordered-pages` FIRST, before the first edit. Push the branch when
  reporting (report = push).
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
