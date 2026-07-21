# FX7 — The Second Sitting's Fixable Bugs · build brief · 2026-07-21

**Authored by CC, not Fable** — Nick's own explicit authorization,
2026-07-21, in response to a direct process question: build these
directly, no Fable brief. Findings 1 (Journal's "New Page" routing /
JournalEntry.tsx's own fate) and 11 (toggled list-menu sections) of
item 41's sitting are explicitly EXCLUDED from this ticket — both
held for Fable, per Nick's own split. This document exists so the
build has the same decision-complete rigor a Fable brief would carry,
even though it isn't one.

**Branch:** fx7-second-sitting-fixes off main. Zero schema expected —
every finding here is UI/CSS/interaction-layer; STOP-and-report if
any slice finds itself wanting a column. Merge pre-authorized as
zero-schema, matching the standing rule every prior zero-schema
ticket this session has used. **Deploy is NOT pre-authorized** for
this ticket specifically — Nick's own "deploy whenever it's ready"
word was given for B3 by name, not as a standing policy; redeploy
here waits for his own explicit word, same as the default.

**Source:** `docs/open-threads.md` item 41, Nick's own verbatim
words, quoted per finding below.

## The one discipline every investigative slice shares
Several findings below (S5-S8) directly contradict claims B3's own
independent review made minutes before Nick started testing — that
review live-tested dealt-card edit/move/delete via genuinely trusted
CDP pointer events and found them working. Do not assume the review
was wrong or that this is a simple regression. This project has hit
the exact shape of this problem repeatedly (FX4/FX5's hover-restore,
FX4's own S4 drag-friction bug): a synthetic-but-CDP-trusted proof
passing while real hardware interaction fails. ROOT-CAUSE each one —
determine whether it's a genuine code regression, a real-hardware gap
the harness's own trusted-event helpers still don't fully replicate,
or (for S9 specifically) user-facing confusion between two doors that
look similar. Whichever it is, say so plainly in the report; do not
guess.

## S1 — the screenplay/script page, thorough review
Nick's words: "the screenplay page option take[s] me to a completely
busted page where the tool and tutor menus are floating away from
the page; the page itself is in a different location, way too small,
and not centered. There are probably a number of other problems with
how the screenplay/script page type is currently working, so do a
thorough review there."
Investigate `ScriptEditor.tsx`'s own framed geometry end-to-end: the
paper's own size/position/centering, the sliver's own anchor, and
the Tutor panel's own anchor (TU1 added a SECOND DeskFrame overlay
anchor specifically because a single Sliver-shaped anchor couldn't
hold both the grip and a ~300px panel — confirm ScriptEditor actually
uses both anchors correctly, since this is the most likely recent
touchpoint). Check both reference widths and the 1100px floor. Fix
whatever's actually broken at the root; this is explicitly a THOROUGH
review, not a single-symptom patch — enumerate every geometry defect
found, not just the first one.

## S2 — Free Write's tool rail
Nick's words: "the tools options on a Free Write Page are way too
sparse. The user should still be able to bold/italicize, bare
minimum, and there should also be ink options for when we reinstate
the ink feature."
Add Bold/Italic to Free Write's own tool rail, reusing Draft mode's
existing `draftFormat.ts`/markdown-mark mechanism rather than
inventing a second one — confirm this doesn't touch forward-lock's
own deletion discipline (insertion-only markup, not deletion, should
be structurally safe; verify, don't assume). For "ink options":
investigate Journal's own existing ink-tool UI (the toggle/icon
structure), and mirror that SAME UI shape onto Free Write's own tool
rail. Ink itself may still be functionally inert outside the Journal
surface (a known prior state) — if so, the UI affordance may render
inert/disabled-but-present rather than functional; disclose exactly
which you found and built, don't silently assume either reading.

## S3 — the cascade's own submenus, flush against the strip
Nick's words: "the submenus to the main lefthand sidebar menu are not
rolling out from the edge and flush against the main menu---they
float away from it, leaving a gap between the main strip and the
sub-menu."
Root-cause the gap between `.desk-frame-strip` and the cascade's own
overlay layers (reach panel, survey — CD2's own architecture). Fix so
every cascade panel sits genuinely flush against the strip's own
right edge, zero gap, at both reference widths.

## S4 — scrollbars, systemic minimal restyle
Nick's words: "all scroll bars need to be restyled to be much more
minimal and consistent with the colors and mood of each unique
theme. Right now, they are bulky and most white, which makes them
dominate visually, distracting from what a user will actually be
trying to focus on."
Extend the Plateau-scrollbar treatment B2/FX5 already applied to the
board canvas to EVERY scrollable region app-wide (the notebook grid,
the Drawers panel, cascade panels, page/script editor content areas,
anywhere native scroll can appear) — thin, low-contrast, square, no
OS chrome, themed via existing CSS custom properties so each theme
(Plateau today, Flux and any future theme) gets its own muted,
mood-consistent color rather than one hardcoded value. Both
`scrollbar-width`/`scrollbar-color` (Firefox) and
`::-webkit-scrollbar` (Chromium) paths, matching whatever technique
the existing board-canvas treatment already established.

## S5 — deck-dealt cards: not editable
Nick's words: "the Deck preset cards do not seem to be editable (at
least double clicking on them did nothing)."
Root-cause per the shared discipline above. Reproduce with genuinely
trusted double-click events on an ACTUAL dealt card (not a
manually-created one) — determine whether this affects every board
card or specifically deck-dealt ones (if the latter, something about
how `materializeDeck` places/layers cards is the more likely
culprit — check for overlap-driven hit-testing issues from the deal's
own layout).

## S6 — deck-dealt cards: not deletable
Nick's words: "Nor can I seem to delete them."
Same discipline. Check whether Remove/Delete is reachable and
functional on a dealt card specifically vs. an ordinary card.

## S7 — card resize: one-directional
Nick's words: "once a card is upsized in any direction, it doesn't
seem like it can be downsized."
Likely a resize-handle clamp bug (check for the same "content-minimum
trap" class FX5 S3 diagnosed and fixed for ported cards — pre-filled
text content inflating a reflow floor that a resize can grow past but
never shrink below). Determine if this affects every card or
specifically cards with pre-filled body text (which would implicate
deck-dealt cards' own starting prompt text specifically).

## S8 — the layer-arrangement (z-order) feature
Nick's words: "The layer arrangement feature for the cards is not
working, either."
FX5 S4(c) added a quiet layer-order icon on selected, overlapping
cards (the existing `z` field, front/back). Confirm the icon is
present and reachable, and that a click genuinely changes and
persists z-order.

## S9 — the deck wizard's own routing
Nick's words: "the deck presets are not walking the user through a
wizard to arrive at the final deck that works best for their specific
needs (or at least, it's not doing it with pop-ups over a blurred out
board like the way we've styled the card editor. Right now, it seems
like the Plot Structure option is just leading back to the old,
deprecated wizard."
Investigate `CreateProject.tsx`'s own current doors carefully: B3
added "Start from a deck…" beneath Blank; there is also very likely a
PRE-EXISTING "Plot Structure"-adjacent doorway from the older
`StructureWizard.tsx`/`BeatWizard.tsx` system that predates B3 (which
B3's own brief explicitly named as an untouched sibling, its fate a
deferred, Nick-level decision). Determine which one Nick actually
reached. If B3's OWN "Start from a deck…" door is what's broken and
silently falling through to the old wizard — that is a genuine B3
routing bug, fix it directly (the deck door must launch `DeckWizard`
as the pop-out-over-blurred-board experience B3 actually built). If
Nick instead reached the OLDER, pre-existing doorway (a different,
already-existing button/link, not part of B3's own two doors) — do
NOT retire or redirect that old system; that exact question is
explicitly out of this ticket's scope (Fable/Nick's own call,
deferred by B3's brief by name) — report clearly which is true so
Fable can rule on it, and leave the old doorway exactly as it is.

## S10 — harness (fx7.mjs)
Cover every fix above with a live, real-interaction-discipline check
(the shared-discipline note applies to the harness too — use genuinely
trusted pointer/click events per this project's own established
`app.mouseMove`/`mouseDown`/`mouseUp`/`keyCombo` helpers, not
synthetic dispatch, especially for S5-S8). Park anything superseded
per A4. Full suite green, both HARNESS_PARKED settings.

## Invariants
Zero schema. Forward-lock's deletion discipline byte-identical (S2
must not touch it). Paper never moves. Anti-solicitation. Olive/
orange lanes; square corners (the pin circle's recorded exception
stands alone). deskLexicon for every new string. Legacy <1100 chrome
byte-identical. Both reference widths + the 1100 floor on every
geometry assertion. One checkout per agent. Commit incrementally per
slice. Report = push (merge only — no deploy, per this brief's own
header).

## Definition of done
Nick, after redeploy: opens a screenplay page and finds the paper
centered, correctly sized, tools and Tutor both properly anchored at
both reference widths; finds Bold/Italic and an ink affordance on a
Free Write page's own tool rail; opens any cascade panel and finds it
flush against the strip with no gap; sees slim, theme-colored
scrollbars everywhere instead of bulky white ones; double-clicks a
dealt deck card and edits it; deletes a dealt deck card; upsizes then
downsizes a card freely; arranges overlapping cards front-to-back;
and gets a clear, honest account of exactly which door led to the old
wizard and why.

— CC, from Nick's second desktop sitting (item 41), 2026-07-21
