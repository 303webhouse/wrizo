# J5 — The Spread console (lenses + Add to…) — build brief

**Audience note:** this brief is written for a FRESH Claude Code session with
no prior conversation context. Everything you need is in the repo + this file.
**Place this file at:** `docs/j5-spread-console-brief.md`
**Branch:** `j5-spread-console` — created FIRST, before the first edit, off
`main` once the prerequisite gate below passes.
**Arc:** J — "The Notebook & the Board" · ticket 5 · extends J3's Spread
**Canon:** `docs/j-arc-design.md` · `docs/north-star.md` · `AGENTS.md` · 2026-07

## Read first (fresh-session onboarding)
`AGENTS.md` (house rules) · `docs/north-star.md` (product canon) ·
`docs/j-arc-design.md` (this arc) · `docs/j4-board-brief.md` (the Board — J5
extends its port) · `docs/backlog.md` (what has shipped) · then the code:
`apps/desktop/src/pages/Spread.tsx`, `pages/Journal.tsx` (the filter idiom you
will port), `store/persistence.ts`, `store/pageOrder.ts`,
`apps/server/src/sync.ts`.

## PREREQUISITE GATE — do not start J5 unless BOTH hold
1. The J3+VW merge landed on `main`: `pages/Spread.tsx` and
   `store/voiceWall.ts` exist there, and BOTH `journal_entries` sync mappers
   in `apps/server/src/sync.ts` carry `order_index` AND `imported_at`.
2. J4 is DONE per `docs/backlog.md`: `pageType 'board'`, `BoardEditor`, and
   `portToBoard(...)` exist on `main` (Slice 3 here EXTENDS the port).
If either fails: STOP and report the gap instead of building. S25-gate bug
fixes may land from side sessions while you work — rebase, don't fight.

## Why
The Spread (J3) laid the Journal's loose pages out and made them grabbable.
J5 makes it the Journal's CONSOLE: lenses to see the notebook any way the
writer thinks (by recency, by star, by tag, by what's on the page), and one
"Add to…" sheet that sends pages anywhere in the studio — filing them into
binders and the Shelf, copying their text into chapters, linking them to
plans, appending them onto Boards. Divergence stays free; this is the
convergence surface.

## Vocabulary canon (ruled 2026-07-10)
"Journal" is the ONLY user-facing container noun for this surface. The
arrangement-bearing sequence (J1's `orderIndex`) is user-labeled
**"Your order"** — never "Notebook", which stays strictly internal
(`getNotebookPages`, `notebookIndexAfter`, `setNotebookPosition` keep their
names; add one comment noting the user-facing label differs). Slice 0 greps
for any user-VISIBLE "notebook" string; expect none — fix in Slice 1 if found.

## The two-verb law (binding for the sheet)
- **FILE = MOVES.** One-home relocation via existing `setPageHome`-family
  plumbing. The page LEAVES the loose Journal; its cell leaves the grid.
- **ADD = COPIES.** The diary keeps the original, byte-untouched, always.
- One exception leaf, honestly labeled: **plan-attach = LINKS** (routing-era
  `beatId` + `routedProjectIds` are link fields; nothing moves or copies).
Every leaf in the sheet carries its verb tag: MOVES / COPIES / LINKS.

## Slices

### Slice 0 — orient + verify (read-only; REPORT findings before Slice 1)
- Run the prerequisite-gate checks above; grep user-visible "notebook".
- Locate tag/star AUTHORING UI (expected: the JournalEntry read view's
  routing-era slot). Report where it lives, or that it's absent — do NOT
  build authoring either way; the lenses consume existing data.
- Report the plan/beat data shape actually on `main` (`storyPlans`, beat ids,
  any notes field) — Slice 3's plan leaf depends on what exists.
- Confirm J5 needs ZERO new columns (tags, starred, beatId,
  routedProjectIds, boxes, order_index, imported_at all pre-exist). Any
  surprise = stop and report.

### Slice 1 — the lenses
- A quiet lens row under the Spread header:
  **ORDER** Your order · Newest — Your order = `orderIndex` walk (today's
  render); Newest = `createdAt` descending. A VIEW ONLY.
  **CONTENT** All · Text · Ink · Text+ink (derived: text-only / ink-only /
  both — same predicates the Journal list's thumbnail logic uses).
  **★ Starred** toggle. **TAG** chips — rendered ONLY when ≥1 tag exists
  across loose pages (port the Journal list's exact conditional idiom:
  unique-tag set, single-active-tag toggle, clear affordance).
- Filters compose (content × star × tag), under either order.
- **Drag-reorder is enabled ONLY in the default lens state** (Your order +
  no filters). Any deviation disables lift/drag entirely (cells still tap,
  select, focus) and shows the one-line lens note: "a view, not an
  arrangement — drag to reorder in Your order". Rationale: dropping between
  visible neighbors in a filtered subset writes an index between pages the
  writer cannot see; forbidden.
- Selection (ids) survives lens changes; the count reflects total selected,
  visible or not.
- Square corners, chips in the quiet border style, brass only on the active
  chip. Reduced-motion: no transitions.

### Slice 2 — Add to… (the FILE verbs)
- "Add to…" action joins the Select-mode header beside "Port…"; the loose
  journal page's actions row gains the same "Add to…" (single-page flow).
- The sheet, destination-first drill-down (crumbline for backing out):
  - **Root:** "The Shelf" (MOVES — unfiled staging) · each Drawer ▸
  - **Drawer level:** its binders ▸ · "＋ Standalone document here" (MOVES —
    create an Untitled binder, kind 'other', in THIS drawer via the existing
    create path — F4's title-later law — then file ALL selected pages into
    it; N pages = ONE binder). Empty drawer: explanatory line + "＋ New
    project (Untitled)" + the standalone option (same mechanics).
  - **Binder level:** "File here as a new page" (MOVES — joins the binder's
    Pages; intra-binder position is the binder's default order — true
    selection-order placement inside binders is a logged non-goal).
- FILE completion: cells leave the grid (no longer loose), selection clears,
  toast: "Filed N pages to <dest> — moved; it left the Journal."
- All moves ride EXISTING one-home plumbing; no new persistence primitives.

### Slice 3 — Add to… (the ADD/LINK verbs)
- **Binder level gains, when present:**
  - "Append to <manuscript page title>" per manuscript-type page, up to a
    scrollable list (COPIES): selected pages' TEXT, in selection order, each
    appended at the chapter's end separated by one blank line. When the
    selection carries ink, the sheet shows the ink notice: "chapter and plan
    take text only — ink reaches a project only via a Board." Source pages
    byte-untouched.
  - "Attach to the plan" (LINKS), only if the binder has a plan: a mini beat
    list; choosing one sets `beatId` and appends the binder's project id to
    `routedProjectIds` on each selected entry (fields + sync pre-exist; the
    Journal list's "routed" crumb already displays it). Nothing moves,
    nothing copies; plan-side rendering of linked pages is a logged
    follow-up. If Slice 0 found no usable beat shape, drop this leaf and log.
  - "Add onto Board — <title>" per existing board page (COPIES): EXTEND
    `portToBoard` to accept an existing board target — new locked groups
    append BELOW current content (start y = max box bottom + spacing, same
    stacking as J4's fresh-board layout). The include-ink one-choice prompt
    runs exactly as in J4 when the selection has ink.
- COPY toast: "Copied — <what>. The originals stay in the Journal."
  LINK toast: "Linked — marked routed; the page stays in the Journal."

## Non-goals (logged)
Tag/star authoring changes; binder-internal page ordering (incl. "file
beside chapter 3" placement); plan-side display of linked pages; drawers
holding loose sheets (IA amendment — explicitly not taken); Oldest order;
new columns or plan substrate; drag-reorder under any lens; virtualization;
routed indicators on spread cells.

## Invariants
- One ordering implementation: `notebookIndexAfter` + `pageOrder`; nothing
  else writes `orderIndex`; no writes under non-default lenses.
- One-home holds; FILE uses existing plumbing only.
- COPY never mutates a source; chapter-append is byte-verifiable.
- Ink reaches projects only via Boards; chapters/plans take text/links only.
- The Voice Wall is untouched (the sheet is metadata UI, not a prose
  surface); the wall's own-ink shadow behavior is not altered.
- Zero schema changes; the sync checklist therefore has nothing to add —
  verify, don't assume (Slice 0).
- Square corners, solid borders, brass = active/selection only,
  reduced-motion honored.

## Definition of done (in-harness + both gates)
1. Lens matrix: each content/star/tag filter × each order renders exactly
   the right subset (seeded mixed population incl. tagged, starred,
   ink-only, text-only, both); composition verified.
2. Drag under ANY non-default lens: lift never begins, zero `orderIndex`
   writes (harness-asserted); default lens drag still works (J3 checks
   re-run green).
3. Selection survives lens flips; count correct with selected cells hidden.
4. FILE: Shelf, binder, standalone, empty-drawer birth — homes correct,
   cells leave, standalone = ONE Untitled binder holding all N; originals'
   text/ink unchanged pre-move.
5. Chapter-append: text lands at end, blank-line separated, selection order,
   byte-identical sources; ink notice shown when applicable.
6. Plan-link: `beatId` + `routedProjectIds` set; "routed" crumb appears in
   the Journal list; nothing else changes.
7. Board-append: groups land below existing boxes at correct y; include-ink
   prompt honored; J4's board checks still green.
8. Toasts carry the correct verb language per action.
9. Keyboard: lens chips and the sheet fully focusable/operable; Esc closes
   the sheet; arrows/Enter on the grid unchanged.
10. `tsc` (desktop + server) + `build:web` + selftest + the CDP scenario
    covering 1–9.
11. S25 GATE: chips and sheet at thumb size, drill-down feel, toast
    legibility. DESKTOP GATE: pointer precision on chips/handles/sheet.
    J5 is DONE only when both gate reports land.

## Working environment (house rules — fresh session, read carefully)
- Launch Claude Code FROM THE REPO ROOT (`writer-studio`) so
  `.claude/settings.local.json` actually governs the session.
- Branch FIRST, before the first edit. **Report = push**: every ship report
  pushes its branch. Merge/deploy only on Nick's explicit word.
- Propose, never ship, changes to your own permissions/harness config.
- PowerShell file edits via `[System.IO.File]::ReadAllText/WriteAllText`,
  UTF-8 no BOM; `git --no-pager` always; `pip`-style global installs never.
- Log the shipped ticket to `docs/backlog.md`. Deploys are `railway up`
  from the working tree (not git-triggered) — but deploy is NOT yours to
  run this ticket without Nick's word.
