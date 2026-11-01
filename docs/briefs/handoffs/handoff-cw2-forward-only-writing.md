# Handoff — CW2: Forward-only writing surface (sprint) on the fragment substrate

Status: ready. Branch off `m1-creative-flow` (sibling to `dm1-fragment-substrate`, which this builds on).
Read `AGENTS.md`, `PHILOSOPHY.md`, `BUILD_PLAN.md` first — BUT the mechanic below **supersedes** the
"strikethrough-only / no erasure" description in those docs. That text is stale and will be reconciled
separately; build to THIS spec.

## What this ticket is
Replace QuickSprint's plain `<textarea>` with a **reusable forward-only text editor** wired to the DM1
fragment ops, so the sprint surface enforces the locked writing mechanic — while every already-shipped
sprint feature keeps working untouched.

Build the editor as a **standalone component** (`ForwardOnlyEditor` / `useForwardOnly`), bound to a
fragment + the DM1 store ops, **not** QuickSprint-specific. The gate (onboarding) and the journal
authored page (J10) adopt the identical component next — one writing mechanic, one implementation.
If it only works inside QuickSprint, it's wrong.

## The locked mechanic (keyboard is the only input on this surface)
Typing appends; backspace walks a short runway, then locks:

- **Type** a char -> into an active-word buffer (component state). On space / newline / boundary, flush
  the buffer to the fragment via `appendText` (extends the last unstruck run, or starts a new run after
  a strike).
- **1st backspace** -> remove the last char of the active-word buffer. Pre-commit, vanishes, touches no
  Run. (A typo isn't a confession.)
- **2nd backspace** -> flush the active word as a **struck** Run (restore the letter the 1st press
  removed, so the whole word shows struck); if the buffer is already empty, `toggleStruck` the last
  unstruck Run.
- **3rd backspace** -> `toggleStruck` the previous unstruck Run.
- **4th+ backspace** -> locked, no-op.
- **3 consecutive no-op presses** -> show the keep-writing nudge ("keep writing — you can shape it later").
- Struck Runs stay in `content`, drop from derived prose — DM1 already does this; the editor just renders
  struck runs with a line-through.
- **Paste**: block external paste (the foreign-voice wall). Internal cut/paste of the user's own text is a
  later concern — for now, block paste.

Reset the runway counters on any forward keystroke.

## Integration contract (do NOT break the sprint)
The editor owns the sprint's fragment(s). On every change it computes `sprintTextOf(fragment)` and reports
that derived string up to QuickSprint.

QuickSprint keeps `draftText` = that derived string. Then everything already wired to `draftText` works
with no change: A1 autosave/draft + flush, J1 journal commit (`commitJournalEntry` reads `draftTextRef`),
A9 sessions, `wordCount`, the finish-moment stats + count-up, J7 echo (`pickEchoLine`), and the
`setProjectSprintText` mirror.

Minimal diff: swap the `<textarea>` block for the editor; feed `draftText` from the editor's onChange
instead of `e.target.value`. Leave A1 / J1 / J5 / J7 / A4 / A7 / A9, reduced-motion, and the finish card
alone. No `apps/server/**` changes; fragments ride the existing whole-record project sync (per DM1).

One real concern: the editor renders runs as DOM (not a textarea), so caret/focus is manual. The finish
moment (A7) keeps the surface focused + editable *behind* the card, and autofocus-on-mount (A8) must still
work. Preserve both.

## Idle nudges (flagged, not core)
QuickSprint already has a nudge system (A6/A8): a "Take a nudge" button over a 5-prompt list, an idle hint
after 60s, and a typing-based lockout/reset. The locked prototype uses a 25-prompt idle rotation (60s
cadence, capped at 3, the third persists until typing resumes). These overlap. Recommendation: adopt the
25-prompt pool + the 60s / cap-3 / third-persists idle behavior, keep the "Take a nudge" button. Not
required for CW2's core mechanic — fold in if cheap, else its own small ticket.

## Out of scope (explicit — these adopt the component next)
- **Stylus / ink layer.** Per the locked product decision: the pen is a **pure overlay** — strokes drawn on
  top of the text, the text/Runs underneath never touched, like pen over printed text in a book.
  **`Run.struck` is keyboard-only.** This **reverses** the earlier "extend J9 ink-strike onto the fragment
  model" plan: do NOT `toggleStruck` from the pen. (A pen line over a word is annotation; the word stays in
  the prose.) The sprint surface stays keyboard-only for now.
- **J10 journal authored pages -> CW3.** They move from today's "no-erasure + one-level-undo" typing onto
  this same editor. Open call for CW3: does the journal page's text migrate to the fragment/Run model (so
  struck words render), or keep `entry.text` with a lighter struck representation? Lean: one substrate
  (fragments) everywhere — decide at CW3 with a full `JournalEntry.tsx` read.
- **The gate** imports the same editor for the onboarding write.

## Definition of done
- `tsc --noEmit` + `build:web` pass.
- QuickSprint behaves identically to before EXCEPT input is now forward-only (append + letter-vanish +
  word-strike runway + lock + nudge); autosave, journal capture, sessions, finish stats, echo, and the
  sprint-text mirror all still work off `draftText`.
- The editor is a standalone, reusable component bound to the DM1 ops — importable by the gate and J10 with
  no QuickSprint coupling.
- No destructive data op introduced (still no `deleteFragment` / `deleteRun` / `editRunText`); the
  letter-vanish lives only in the pre-commit buffer.
- No `apps/server/**` or sync changes.
- Don't push/deploy; lands behind the same review as DM1.
