# F4 — Title-later create + the writing picker — build brief

**Branch:** `f4-writing-picker` — created FIRST, before the first edit. Off `main`
(carries F1–F3).
**Deploy note:** rides the combined arc-F gate. After Nick's hardware pass, one
`railway up` ships F2 + F3 + F4 together. Picker legibility joins his checklist.
**Arc:** F — "From open to flow" · ticket 4 of 6 · UI + TS vocabulary, no DDL
**Canon:** `docs/state-of-wrizo-2026-07.md` Rev 2 (Finding 3, Part IV) · 2026-07-02
**Feel source:** `apps/desktop/scratch/wrizo-f-arc-create-picker.html`

## Why

Two convergence tolls still sit at the front door. First, `CreateProject`
hard-blocks on an empty title — a naming wall before word one, even though
`createBinder` already defaults to "Untitled." Second, the kind picker fences
out every non-fiction writer: essays, articles, theses, and reports are all
squatting in 'Other'. F4 removes the wall and grows the picker into "What are
you writing?" — three quiet domain groups of honest per-domain forms over ONE
shared machinery. Domain lives on the binder at creation, never as an app mode
(the mirror principle). Every binder is born with its full typed pointer, so
the return card speaks its language from day one.

## The taxonomy (decided — Nick may veto labels in review)

| Domain (`type`)   | Forms (`kind` storage value → display label)              |
| ----------------- | --------------------------------------------------------- |
| creative          | book → Book · story → Short fiction · screenplay → Screenplay |
| academic (exists) | essay → Essay · thesis → Thesis · paper → Paper            |
| professional (NEW)| article → Article · report → Report · proposal → Proposal  |
| —                 | other → Something else (keeps `type:'creative'` default)   |

Six NEW `kind` storage values (essay, thesis, paper, article, report,
proposal); `story` is REUSED with the "Short fiction" label — no redundant
value. `type` gains `'professional'`.

## Slices

### Slice 1 — the vocabulary (TS only, no DDL)
- `types`: widen `BinderKind` with the six new values; widen `Project['type']`
  with `'professional'`.
- ONE shared label map (new `store/kindLabels.ts`): storage value → display
  label + uppercased tag form. Consumed by BOTH the picker and `resumeVocab`
  (replace `KIND_LABEL` there; `story` now tags `SHORT FICTION`). One source of
  truth — the picker and the mirror card can never drift.
- Server: `kind` is already a text column (verified). VERIFY `type`'s column in
  `migrate.ts` is text with no CHECK constraint before adding 'professional' —
  one line of reading; if constrained, add the idempotent widen. No sync.ts
  changes either way (both fields already round-trip).

### Slice 2 — "What are you writing?" (CreateProject)
Rebuild the picker per the feel source:
- Three quiet domain groups (CREATIVE / ACADEMIC / PROFESSIONAL headers with a
  hairline rule), 3 form cards each: name + one-line description (copy from the
  feel source). "Something else — start blank and shape it as you go" as a
  full-width quiet option below the groups.
- Selecting a form sets BOTH `kind` (storage value) and `type` (its group).
  Something else → `kind:'other'`, `type:'creative'` (existing default).
- Selected state: accent border + accent name; square corners, panel bg, 1px
  line borders; orange only on selection + the Start writing button.
- Group order is static this ticket (Creative / Academic / Professional). The
  first-run SORT HINT is a NON-GOAL (logged — belongs to the HOME-verification
  pass, where first-run flow lives).

### Slice 3 — title-later
- Remove the empty-title block (`if (!title.trim()) return`). The title input
  becomes optional, below the picker: placeholder "Untitled — you can name it
  after you've written". Empty submit → `createBinder`'s existing 'Untitled'.
- "Start writing" enables on form selection, not on title presence.

### Slice 4 — landing
- EVERY picked form births binder + first manuscript page and lands in
  `/page/:id` (the B1 book/story flow, generalized): first page, Free write by
  default (manuscript pageType), caret waiting. Title-later means nothing
  stands between the pick and the ink.
- Something else → the project overview (shape it as you go), as today.

### Slice 5 — the rename path (title-later's other half)
- Verify ProjectHome's header title is renameable inline; if not, add it
  (click-to-edit, Enter/blur commits via `saveProject`). "Untitled" must be a
  one-tap fix from the place the writer naturally sees it. Breadcrumb rename is
  a NON-GOAL (scope).

## Non-goals (other tickets)
The first-run sort hint (HOME-verification pass); per-domain support-page
templates and Format conventions (deferred with Format); TTFK/SessionLog (F5);
the first-line invitation (F6); deeper taxonomy (poetry, more academic forms —
waits on dogfooding, logged); any DDL; Electron menu work.

## Invariants
- Domain lives on the binder — NO global mode, no persona storage, nothing
  app-level changes meaning based on the pick.
- One shared kind-label map; the picker and the mirror card cannot drift.
- Existing binders untouched: old kinds keep working everywhere (card, picker
  absence, ProjectHome); no backfill, no migration.
- `createJournalPage`/Catch, editor logic, one-home rule: untouched.
- No new collections; no server changes beyond the (conditional) type widen.

## Definition of done (in-harness)
1. The picker renders three groups + Something else per the feel source; each
   form births the correct `type` + `kind`; selection is keyboard-reachable.
2. Empty-title create works: binder born "Untitled", first page opens in
   `/page/:id`, Free write, caret ready — zero intermediate stops.
3. The mirror card speaks the new vocabulary: an essay binder's card tags
   "ESSAY · MANUSCRIPT"; a story binder now tags "SHORT FICTION · MANUSCRIPT";
   legacy book/screenplay tags unchanged.
4. ProjectHome inline rename commits and reflects in the crumb + card.
5. An OLD binder of every legacy kind still renders correctly everywhere
   (regression sweep: card, ProjectHome, DrawersTree).
6. `type` column verified (or idempotently widened) BEFORE any 'professional'
   binder is created; live round-trip only if the widen was needed.
7. `tsc` (desktop + server) + `build:web` + selftest green; CDP checks for 1–5.
8. Deploy: rides the combined arc-F gate — one `railway up` ships F2 + F3 + F4
   after Nick's hardware pass (picker legibility + card tap targets join it).

## Working environment
- Branch `f4-writing-picker` FIRST, before the first edit.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always.
- Log the shipped ticket to `docs/backlog.md`.
