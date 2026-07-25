# BG1 — the Beginnings · build-notes dossier (integration map)

**Purpose:** BG1 (item 67, brief = the P1 wave `docs/wrizo-alpha/p1-wave.md` §BG1)
was opened by chat 3 (S0 on `main`), fully drift-checked, then RELEASED
unbuilt so M4 could take the rhizome-engine context. This is the expensive
artifact — every integration point already found, so the successor does not
re-derive it. Line numbers are as of `main` ~`c26b85e`; grep-confirm before
editing (the file shifts). ZERO SCHEMA, ZERO SERVER; branch `bg1-beginnings`
off `main`, own worktree; the standing P1 invariants apply (both HARNESS_PARKED,
1366×768 leg, tsc ×2, full suite read to completion, report = push).

## The door sets (per the brief + P1 amendment 2, `c26b85e`)

- **Board OPEN:** New Card · New Page Card · Load a Deck · Connect a Page.
- **Board STORYBOARD:** Load a Deck · New Lane · New Card.
- **Board OUTLINE:** New Card · Load a Deck.
- **Board paired-plan:** uses OPEN's row. **System boards (Journal/Shelf/Trash):
  NO row** — keep their declarative empty lines. No Import/Upload (Reference Seal).
- **Page:** **Screenplay · Sprout · Plan** — NOTE: P1 amendment 2 (`c26b85e`)
  RENAMED "Start from a Spark" → **"Sprout"** and is the current door set; read
  that amendment in `p1-wave.md` before wiring the page row.

## Board handlers — ALL FOUR already exist (BoardEditor.tsx)

Passed to the sliver at **BoardEditor.tsx ~2039–2040** (`onAddCard, onAddPageCard,
onAddExistingPage, onAddFromDeck`):
- `onAddCard` — ~L1084. Adds a blank text card.
- `onAddPageCard` — ~L1109 (`createLooseHomePage()` then adds a page-pin card;
  "births a linked page"). This is BG1's **New Page Card**.
- `onAddExistingPage` — wired as `() => setExistingPageOpen(true)` (L2039); this
  is BG1's **Connect a Page**.
- `onAddFromDeck` — ~L1118 = `setDeckWizardOpen(true)` (opens `DeckWizard`); this
  is **Load a Deck**. On a **system board, onAddFromDeck is never passed** (the
  absent-not-disabled law) — mirror that for the whole row.

## MISSING: `onAddLane` (STORYBOARD "New Lane") — must be built

There is **no** lane-add handler (grep `onAddLane|addLane|New Lane` = nothing).
Lanes live in the **board-meta box's `lanes[]`** (a `kind:'board-meta'` box, e.g.
`{ id:'cb-meta', kind:'board-meta', lanes:[{id,title}] }`). A New Lane = append a
`{ id: generateId(), title:'' }` (or `boardLaneDefault`) to that box's `lanes` and
`saveBoardBoxes`. Mirror the existing box-mutation path (see `onAddCard`/the
board-meta handling). Keep it absent on system boards.

## The THREE empty-state sites (one per view)

1. **OPEN canvas — BoardEditor.tsx ~L1788:**
   `{sorted.length === 0 && !isSystemBoard && <div className="board-canvas-empty" aria-hidden="true">{t('boardCanvasEmpty')}</div>}`
   (system: shelf at ~L1789 — `shelfBoardEmpty`; find Journal/Trash empties too).
   `sorted` = the render list; `sorted.length === 0` is the empty gate. `boardMode`
   = `isSystemBoard ? 'open' : boardModeRaw` (L623); `useBoardMode(id)` at L622.
2. **STORYBOARD — `src/components/BoardProjection.tsx`** (lexicon
   `boardStoryboardEmpty`, deskLexicon.ts L449).
3. **OUTLINE — `src/components/BoardProjection.tsx`** (lexicon `boardOutlineEmpty`,
   deskLexicon.ts L450).
   BoardProjection renders STORYBOARD + OUTLINE; both have their own empty text
   to REPLACE with the row (non-system only).

## Page (PageEditor.tsx / pages)

- `wordCount(text)` at **L63**; the row renders only when `wordCount(text) === 0`
  (the "zero words" gate) — exactly parallel to the board's `sorted.length===0`.
- **Screenplay door** → the empty-page Structure picker: **"Switching an empty
  page is free (no modal)"** (AB2 S4 comment ~L119–120) — flip prose↔screenplay
  via the existing `switchMode`/Structure path; free because empty.
- **Plan door** → reuse the existing **PLAN → door** action at
  **PageEditor.tsx ~L664–668**: `getOrCreatePlanBoard(id)` then navigate.
- **Sprout door** (was "Start from a Spark") → **deck-drawn**. SEE FINDING BELOW.
- Existing **F6 first-line invitation**: `useFirstLineInvite(() => textRef.current.length === 0)`
  at ~L182–183 — this is the placeholder-text invite; it COEXISTS with BG1's
  doors row (invite = words, row = doors). Don't remove it; place the row beside
  the live caret without covering it.
- `.forward-only-editor` is the editor; the caret must be **live under the row
  from the first frame** (a harness check must type immediately without touching
  the row and prove the row vanishes when they do).

## The A19 page-vanish signal — `useChromeDissolve`

`src/components/useChromeDissolve.ts` is the ONE "dissolve on write" engine every
dissolved surface reads. It flips `dissolved` / the `data-writing='true'`
attribute on the **first keystroke** (see DeskFrame.tsx L224 `data-writing`,
BoardEditor L602 `useChromeDissolve({surface:'board', editorSelector:'.board-canvas'})`).
For the page row, the vanish is: render only while `wordCount===0`; the first
keystroke makes words>0 → the row unmounts; use the A19/`data-writing` staged
fade for grace (not an instant pop). Dismiss also on **any door taken** and on
**Esc**. Never block typing — pointer-events on the doors, but the row container
must not intercept the caret (the rhizome's `pointer-events:none` precedent).

## Deck-mechanism FINDING (the design point)

`DeckWizard` (`src/components/DeckWizard.tsx`) exists **board-side only** —
reached by `onAddFromDeck → setDeckWizardOpen(true)`, "on explicit click, never
ambiently" (DeckWizard.tsx L11). There is **no page-side deck-draw** today. The
page **Sprout** door therefore needs either (a) reusing `DeckWizard` in a page
context (insert a deck-drawn line into the page rather than a board card), or (b)
a small page-side deck entry. Confirm the intended target with the amendment /
Nick before wiring; it is the one non-mechanical piece.

## S3 — one grammar (the shared component)

Both rows are **one component + one vanish rule** (the brief's S3). Build
`BeginningsRow` (icon+label doors, quiet **olive**, no grid, centered on the
board / beside the caret on the page). Doors, not tasks — nothing counted, no
completion state, no "get started" language. Lexicon: add door-label keys to
`deskLexicon.ts` (union type ~L435–438 + `CANONICAL` ~L440+); existing:
`boardCanvasEmpty` L585, `boardNewPageCard`, `boardStoryboardEmpty` L449,
`boardOutlineEmpty` L450, `pagePlanDoor` 'Plan' L446. Olive: index.css carries a
"quiet olive" decoration pattern (the doors' color) — olive = "this is a door"
(M4 S2 confirms olive is reserved for doors; keep the rhizome ground non-olive).

## DoD (brief)

A fresh board is never a dead end; a fresh page never asks permission; both rows
vanish the moment work exists. Harness `bg1.mjs`: board row per mode (right doors,
absent on system boards, gone once a box exists), page row (types-immediately +
vanishes), the shared grammar; both HARNESS_PARKED settings; the 1366×768 leg for
the board/page geometry touched.

— chat 3, released 2026-07-25 for BG1's successor.
