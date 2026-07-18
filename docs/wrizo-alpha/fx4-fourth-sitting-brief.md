# FX4 — the Fourth Sitting · build brief · 2026-07-18

**Branch:** fx4-fourth-sitting off main, own worktree. Builds after
TU1's review lands, OR in parallel on Nick's explicit word (shared
seam with TU1: PageEditor/DeskFrame host wiring — coordinate there,
nowhere else). **Zero schema, zero new deps** — merge pre-authorized
per the standing rule; Fable reviews post-merge, gating close and
redeploy. Any slice wanting a column: STOP and report.
**Authority:** Nick's desktop sitting 2026-07-18 (ledger record) +
his four rulings: copy-out is Publish-only; handle-drag replaces the
Connect toggle; popup supersedes inline card editing; Stacked is the
card treatment.

## S0 — records first
Ledger: open FX4's item; record the four rulings verbatim; record
the trash-bin build as QUEUED (pages cheap — deletedAt already
soft-deletes; cards/threads need new semantics — not cheap; T4
interaction noted); record the intro-screen table (item 27 open,
hb1.2 queued, hammer test leads its severity). Commit
board-card-studies.html under docs/design/ as the treatment
reference. Commit this brief.

## S1 — the typewriter start, everywhere
START_FRACTION → 0.25 (visual quarter, measured the fx1.mjs way —
hand-verify against padding like FX3 did); scroll/fade ENGAGES at
~10 line-equivalents instead of lagging. ALL typewriter surfaces
including JournalEntry — the Journal carve-out RETIRES. The
ink-coordinate risk that justified the skip gets solved, not
re-skipped: ink strokes' coordinate space must survive the
start-offset change byte-true (existing strokes render in place;
new strokes land where the pen touches). If the coordinate fix
can't be proven safe, STOP and report — do not ship the Journal
half without it.

## S2 — the glow, actually felt
First verify GoalGlow renders at all on the live composition (Nick
couldn't perceive it — defect vs. tuning unknown; diagnose before
touching values, FX2's own law). Then retune to genuinely
perceivable at mid-progress on a real desk: raise the envelope
within the field-never-burns cap (chroma cap holds; warmth only;
no numbers, no completion event). Harness gains a computed
luminance/opacity floor assert at 50% progress so "too subtle to
see" can never silently return.

## S3 — flush chrome
The cascade strip sits flush at the SCREEN's left edge (kill the
inset margin); reclaimed width feeds the stage. The Board's strip
and sliver anchor flush exactly as the Page's do — diagnose the
floating (suspected anchoring defect, FX2's family: measure first,
fix the actual bug). Geometry asserts at 1100/1280/2200, strip
x===0, sliver flush to the board paper's edge.

## S4 — the board's body
Cards resize on BOTH axes (text cards included — height becomes
free; reflow becomes a minimum, not a dictate; MIN floors per kind
kept). The board canvas itself resizes both axes via a quiet
bottom-right drag; dimensions persist as a single 'board-meta'
element in the SAME boxes array (the 'connection' precedent —
zero-schema; if this shape fights the array's semantics in
practice, STOP and report). Minimums = content extents. Legacy
below the gate renders the shared canvas identically — chrome only
stays framed-scoped.

## S5 — the card popup (inline retires)
Double-click a text card → the popup editor over the blurred board
(blur ~6px + dim, the mockup's treatment; reduced-motion honored).
The card's own strip carries Bold and Italic ONLY — reusing the
existing draftFormat markdown conventions applied to box.text with
the iA dimmed-syntax display register. Strikethrough and anything
further WAITS for the strip committee (the frozen markdown set
does not unfreeze in a fix ticket). Done and Escape close; focus
trapped while open (hb1.1's pattern). Inline contenteditable
editing RETIRES; ab4.mjs's inline-editing check parks per A4. No
typewriter, no progress, anywhere in the popup — Nick's word.

## S6 — the thread, by hand
Double-click the brass resize handle → a thread-drag arms from
that card; drag and release anywhere INSIDE a target card (any
kind — text, ink, page-pin) mints the hairline; Escape or releasing
on empty board cancels. De-dupe either order preserved; deletion
unchanged (select hairline, Delete, confirm-free). The sliver's
Connect toggle RETIRES — the board sliver carries Add card alone.
Park per A4: ab4.mjs's exact-two-tools count, its connect-toggle
gesture checks; live successors assert the handle-drag path.

## S7 — Stacked, worn
The ratified card treatment from board-card-studies.html variant B:
lighter stock than the board, 1px hairline, thickness told by the
2px offset hard edge + soft shadow. Square corners. Selection and
lane colors unchanged (brass selected, olive armed-state only).
Page-pin and ink cards wear it identically.

## S8 — hover-restore repaired
Moving the pointer over faded/receded chrome restores it (the
existing edge-dwell/summon contract — diagnose why it isn't
firing on the live build; fix the defect, don't redesign — the
STAGED vanish is the committee's, not this ticket's).

## S9 — harness (fx4.mjs) + the sweep
Start-offset ≈25% within tolerance + engage-at-~10-lines, both
reference widths + the 1100 floor; ink-coordinate byte-truth on a
seeded stroke fixture pre/post offset change; glow luminance floor
at mid-progress; strip x===0 and board-sliver flushness; both-axes
card resize + board-meta persistence across reload; popup
open/blur/focus-trap/Done + the parked inline check's successor;
handle-drag thread create/cancel/dedupe; Stacked CSS asserts
(offset-edge + shadow present); hover-restore. Full suite green,
both HARNESS_PARKED settings; park sweep enumerated in the fold
commit per A4.

## Non-goals
The staged vanish and strip shut-like-a-drawer (committee — A8
touch); per-mode strip rosters, renames (Forward Momentum / Text
Fade / Page Scroll / Progress Bar), and any new formatting
conventions (committee); the olive corner-mark semantics
(committee); wizard beats as cards (committee/P-arc); the trash
bin (queued build); AB5's break line; anything touching the
threshold (tabled).

## Invariants
Zero schema. The paper never moves (start-offset changes content
position, never the paper rect). Copy-out remains Publish-only —
this ticket adds no clipboard door. Olive/orange lanes; square
corners; anti-solicitation; every new string through deskLexicon.
Legacy below the gate byte-identical in chrome; shared canvas
changes render for both regimes by design. Both-reference-widths +
floor on every geometry assert. Report = push.

## Definition of done
Nick, after redeploy: opens a fresh page and the writing starts a
quarter down, the fade arriving around line ten — Journal
included, his old ink sitting exactly where he drew it; writes and
actually SEES the glow come up; finds the strip flush at his
screen's edge and the board's chrome flush at the paper's; drags a
card taller and the board itself wider; double-clicks a card and
gets the popup over a blurred board, bolds a word, Done; double-
clicks the brass handle and drags a thread into another card;
brushes the faded chrome and it wakes. The cards finally read
"card on a board."

— Fable, from Nick's sitting and rulings, 2026-07-18
