# FX6 — Undo and the Doors · build brief · 2026-07-19

**Branch:** fx6-undo-and-doors off main (post-FX5). Zero schema,
zero new deps; merge pre-authorized; Fable reviews post-merge.
STOP-and-report if any slice wants a column.
**Authority:** Nick's rulings 2026-07-19 — A2 commissioned ("Yeah,
let's fix this. It's only typewriter mode where I want to limit how
much backspacing/deletion occurs"), the New Page discoverability
gap, plus two one-line advisories carried since AB4's review.

## S0 — records first
Ledger: open FX6; commit this brief. (The A1/A2/architecture
records land per the relay's own §3 if not already applied.)

## S1 — undo, restored (the scope law is Nick's sentence)
Real undo/redo (Ctrl/Cmd+Z, Shift for redo) in Draft mode's free
editor and the card popup. Root cause is already diagnosed (FX5
S7): both editors rewrite their contenteditable's innerHTML
wholesale on every input, invalidating the browser's undo stack.
Two lawful paths — (a) surgical DOM updates that preserve native
undo, or (b) an app-level snapshot/coalesced undo stack with the
standard keybindings. Choose EMPIRICALLY, document why in the
commit; the em-dash shim folds into whatever ships (one Ctrl+Z
after an autocorrect reverts the dash — never a double-undo
seam). **THE SCOPE LAW:** typewriter/forward-lock's deletion
discipline is UNTOUCHED — in forward-lock, undo stays out; the
practice is the constraint, not a defect. Everywhere else, a
writer's full freedom to unwind is the goal. Coalescing granularity
(word-ish steps, not per-keystroke, not per-paragraph) is CC's
call, disclosed, tuned for Nick's felt test.

## S2 — the doors: New Page, findable in two seconds
(a) The cascade's Page section gains an unmissable "New Page"
action at its head — the plain door, olive-lane chrome, deskLexicon
string. (b) On a Board, the Add flow gains "New page card": creates
a real page (normal homing laws untouched) AND pins its card to
this board in one act — the board-side door Nick reached for and
couldn't find. (c) Empty states point at these doors in one quiet
line each. NO other architecture moves — the Journal/Boards rework
is committee-gated; these are doorknobs, not walls.

## S3 — the AB4 fold sweep (two carried one-liners)
(a) Self-pin closed: the Pin sheet's board list excludes the
invoking entry AND pinPageToBoard gains the guard (both ends, belt
and suspenders). (b) The no-projects empty-state line becomes
truthful: "create a project first" (membership ≠ filing —
ab4-review A2's exact wording).

## S4 — harness (fx6.mjs)
Undo round-trips in both editors (type → edit → em-dash → undo
chain walks all the way back; bold/italic marks undo cleanly);
redo; the shim-fold proof (no double-undo seam); forward-lock
UNTOUCHED (existing deletion-discipline asserts stand green,
plus an explicit Ctrl+Z-inert-in-forward-lock check); New Page
door presence + function from cascade and board (the created
page's homing laws asserted, the pinned card's origin untouched);
self-pin impossible at both ends; the truthful empty-state
string. Keyboard claims verified with trusted key events where
the harness supports it — the FX5 fidelity discipline applies to
keyboards too, disclosed per check. Park sweep: any em-dash-shim
or inline-undo checks superseded by the new mechanism — A4
discipline, quoted, live successors. Full suite green, both
HARNESS_PARKED settings.

## Non-goals
The Boards-all-the-way-down architecture (Journal retirement,
Projects/Shelf-as-Boards, Drawers-contain-Boards, thumbnails —
COMMITTEE-GATED, Nick's own word); the Trash build (queued,
now architecture-linked); any typewriter deletion-discipline
change; card metadata fields (card committee); anything schema.

## Invariants
Zero schema. Forward-lock's discipline byte-identical. Paper never
moves. Copy-out stays Publish-only. Olive/orange lanes; square
corners (the pin circle's recorded exception stands alone);
anti-solicitation; deskLexicon for every new string. Legacy <1100
chrome byte-identical. Both widths + 1100 floor on geometry
asserts. Report = push.

## Definition of done
Nick, after redeploy: writes a paragraph in Draft, mangles it,
and Ctrl+Z's his way back out step by step — then redoes; bolds a
word, undoes it, sees clean text; autocorrects an em dash and one
undo reverts just the dash; opens a card, edits, undoes there too;
switches to Free Write with forward lock ON and finds the road
still one-way; finds New Page from the cascade in two seconds and
makes a page-card on a board in one act; fails to pin a board to
itself; and reads "create a project first" where the old line
used to fib.

— Fable, from Nick's rulings, 2026-07-19
