# J3 — The spread view (thumbnails, reorder, multi-select) — build brief

**Branch:** `j3-spread-view` — created FIRST, before the first edit. Off `main`
AFTER J2 merges (J3 consumes J2's eraser-aware thumbnails); if the S25 gate
lags more than a day, branch off `j2-eraser` and rebase on merge.
**Arc:** J — "The Notebook & the Board" · ticket 3 of 4 · S25 gate (touch drag)
**Canon:** `docs/j-arc-design.md` (Fork 3) · 2026-07-10
**Place this file at:** `docs/j3-spread-view-brief.md`

## Why

Spread the notebook open. J1 gave pages an order you can walk; J3 makes that
order visible and grabbable — a grid of the loose Journal you can rearrange
with your hands — and quietly builds the selection surface J4's group port
will stand on.

## Slices

### Slice 1 — the surface
- Route `/journal/spread`; entry point: one quiet "Spread" action in the
  Journal list header. Loose notebook only.
- Grid of cells in notebook order (`getNotebookPages`): a small paper square
  (square corners, 1px line border) carrying the ink thumbnail
  (`renderThumbnail` — eraser-aware since J2), the `firstLine(40)` caption
  beneath, and the position number. A text-only page renders a blank paper
  square + caption — honest, not decorated.
- Tap/click a cell → `/journal/:id`. Arrow keys move focus; Enter opens.

### Slice 2 — drag reorder (persists)
- Mouse: drag. Touch: long-press (~350ms) to lift, then drag. Lifted cell:
  subtle scale + shadow (reduced-motion: no scale — indicator only). Drop
  target: a 2px brass line between cells.
- On drop: a new `persistence.setNotebookPosition(id, afterId?)` — factor the
  midpoint/exhausted-gap/respread logic SHARED with `createLoosePage` into
  one helper (`notebookIndexAfter(afterId?)`) so there is exactly one
  ordering implementation. Persist via `saveJournalEntry` with the new
  `orderIndex`.
- Ordering writes ride `pageOrder` utilities only — no second system.

### Slice 3 — multi-select (J4 groundwork, no actions)
- A "Select" toggle in the spread header → tapping cells toggles selection
  (brass border), a count in the header, "Done" exits and clears.
- NO actions wired — the Port arrives with J4. No dead buttons, no
  placeholders.

## Non-goals (logged)
Port/route actions (J4); filed or Shelf pages in the spread; text-fidelity
thumbnails; pinch/zoom or gesture navigation; virtualization (revisit if a
notebook exceeds ~200 pages); an accessibility drag-alternative for reorder
(logged for a later pass — arrows/Enter cover open, not move, in v1).

## Invariants
- One ordering implementation: `pageOrder` + the shared helper. Nothing else
  writes `orderIndex`.
- One-home untouched; thumbnails are read-only renders; page content never
  touched from this surface.
- Square corners, solid borders, brass only on selection + the drop line.
- Reduced-motion honored (no lift scale; indicator remains).

## Definition of done (in-harness + S25 gate)
1. The spread renders every loose page in notebook order (seeded mixed
   population: indexed + fallback pages) with correct captions; a
   fully-erased page thumbs blank (J2 fixture reused).
2. Tap opens the page; arrows move focus; Enter opens.
3. Mouse-drag reorder persists across reload AND a harness sync round-trip;
   the exhausted-gap path respreads (seeded tight-gap fixture) via the
   SHARED helper.
4. Synthetic touch long-press lifts; drag + drop reorders identically.
5. Selection mode: count accurate under toggle on/off, Done clears, zero
   port UI present.
6. `tsc` (desktop + server) + `build:web` + selftest green; CDP checks 1–5.
7. S25 GATE (deploy blocks on this): long-press lift timing feels right,
   drag latency acceptable, cells and captions legible at thumb size, the
   drop line visible on the ground color.

## Working environment
- Branch per the header rule. Report = push.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
