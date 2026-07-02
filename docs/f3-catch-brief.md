# F3 — Catch: the zero-decision capture — build brief

**Branch:** `f3-catch` — created FIRST, before the first edit. Off `main` (carries
F1 + F2).
**Deploy note:** F2 is merged but HELD at the tablet gate. F3's deploy rides the
same gate — one hardware pass covers both. No `railway up` until Nick clears it.
**Arc:** F — "From open to flow" · ticket 3 of 6 · small UI + routing, no schema
**Canon:** `docs/state-of-wrizo-2026-07.md` Rev 2 (Finding 3, Part IV) · 2026-07-02
**Feel source:** the Catch affordance in
`apps/desktop/scratch/wrizo-f-arc-design-a2.html` (button + kbd hint idiom)

## Why

Capture is the one gesture that must cost nothing — the thesis says divergence is
free, and today it isn't: the Desk's "New page" routes through the legacy
scratch-draft `/sprint` path while real pages are JournalEntries, so the app has
two capture models and the fastest one is a buried secondary link. Catch makes
capture ONE always-available action that opens a fresh journal page instantly —
no title, no kind, no filing. Filing stays a later, low-stakes gesture via the
Shelf, which was built for exactly this.

## The model

One capture model: `createJournalPage()` → `/journal/:id` (the authored J10
editor). Honor-discard (J1a) already guarantees a blank, untouched Catch leaves
no litter. No warmStart state — it's a blank page; there is nothing to glow.

## Slices

### Slice 1 — the Desk action
Replace the Desk's "New page" secondary link with the Catch action:
- Label: "＋ Catch a thought" (bordered quiet button per the feel source; tan,
  NOT orange — the orange budget stays on the card's primary).
- Behavior: `createJournalPage()` → `navigate('/journal/' + page.id)`. Zero
  intermediate UI; the editor lands focused (J10 already focuses + places the
  caret).
- Remove the Desk's `clearDraft('scratch')` import/usage. "Begin project" stays.
- A small kbd hint beside the label ("N") in the feel-source idiom.

### Slice 2 — the rail action
Add Catch to the DeskRail so capture is one tap from every authed surface
(Journal, Shelf, Drawers, ProjectHome, and the writing surfaces — where it
inherits the rail's existing chrome-dissolve behavior for free).
- Rail idiom: quiet tan, matching the existing rail items; label "＋ Catch".
- Same behavior as Slice 1 — one shared helper, not two implementations.

### Slice 3 — the keyboard shortcut
Single-key `n`, Gmail-style, fires Catch when it cannot collide with writing:
- Trigger: keydown `n`/`N` with NO modifiers, when the event target is not an
  input/textarea/contenteditable and `isComposing` is false.
- Rationale: Ctrl/Cmd+N is browser-reserved in the web build and cannot be
  intercepted; a bare key on non-editing surfaces is the reliable pattern. An
  Electron menu accelerator is a later, separate concern (non-goal).
- Scope: a single app-level listener (App or the rail), active on authed
  surfaces; ignored entirely while any editable has focus — a key that types
  must never capture.

### Slice 4 — retire the scratch path from the Desk (only)
`/sprint` + the `'scratch'` draft remain for project sprints — untouched. This
slice only removes the Desk's use of them. Grep for remaining Desk-side
references to `clearDraft('scratch')` / `/sprint` and confirm the Desk has none;
QuickSprint's own flows stay exactly as they are.

### Slice 5 — loop sanity (verification, not new code)
- A blank, untouched Catch abandoned via back/rail → honor-discarded (J1a); the
  Journal stream gains nothing.
- A kept Catch appears at the top of the Journal stream and files normally via
  PageFileMenu / the Shelf — the divergence→convergence loop closes.

## Non-goals (other tickets)
The first-line invitation (F6 — opt-in, its own brief); the writing picker +
title-later (F4); TTFK/SessionLog (F5); any QuickSprint changes; rail redesign;
Electron menu accelerators; any schema/server/sync change.

## Invariants
- One primary on the Desk — Catch is a quiet secondary; orange budget unchanged.
- `createJournalPage()` is the single capture model; no new record shapes.
- Editor logic untouched (forward-only, honor-discard, autosave all as-is).
- The `n` shortcut NEVER fires while any editable element has focus.
- No new collections; no server changes; sync untouched.

## Definition of done (in-harness)
1. Desk Catch → a new blank journal page, editor focused, zero intermediate UI.
2. Rail Catch works from Journal, Shelf, Drawers, and ProjectHome; on writing
   surfaces the rail (and Catch with it) recedes/returns with the existing
   chrome behavior — no special-casing.
3. `n` on the Desk fires Catch; `n` while typing in any editable (page editor,
   journal sheet, create form, tag input) does NOT; modifier chords do NOT.
4. Blank abandoned Catch → honor-discarded; the Journal stream is unchanged.
5. A kept Catch appears in the Journal stream and files via PageFileMenu to a
   binder / the Shelf; one-home rule holds.
6. No Desk-side reference to the scratch draft remains (grep clean).
7. `tsc` (desktop + server) + `build:web` + selftest green; CDP checks for 1–5.
8. Deploy: rides the F2 tablet gate — after Nick's hardware pass, one
   `railway up` ships F2 + F3 together. Catch adds two items to that pass:
   the Desk button and the rail action at thumb size.

## Working environment
- Branch `f3-catch` FIRST, before the first edit.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always.
- Log the shipped ticket to `docs/backlog.md`.
