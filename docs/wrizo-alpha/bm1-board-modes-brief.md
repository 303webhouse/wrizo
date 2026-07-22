# BM1 — the Board's Own Modes · build brief · 2026-07-21

**Place at:** `docs/wrizo-alpha/bm1-board-modes-brief.md`.
**Branch:** `bm1-board-modes`, own worktree, **branched from `main` only
AFTER FX10's fix pass has merged** — both tickets rewrite the board's
top bar, and BM1 inherits FX10's named return as the door's ancestor.
Starting before that merge is STOP-and-report.
**Authority:** the Board Modes second pass as ruled by Nick 2026-07-21:
three modes OPEN/STORYBOARD/OUTLINE plus the PAGE → door (T1; the
fourth mode scrapped, card-linking absorbed into Open); the arrow as
the door's dress (T2, resolved by T1); build-it-all tempo (T3;
side-by-side held as BM2 by Fable's sequencing call, vetoable);
StoryPlan fold-in authorized (T4); schema pre-cleared for flagging,
**explicit go still required at merge** (T5).
**THIS IS A SCHEMA TICKET.** S2 adds a pairing relation. Merge requires
Nick's explicit word — no standing pre-authorization, per the standing
rule. Everything else is client-side. Zero new deps. Report = push;
Fable reviews before merge recommendation; deploy is Nick's separate
word. **E1 outranks this ticket if capacity contends.**

## S0 — records first
Ledger: open BM1's item recording Nick's T1–T5 rulings verbatim,
Commonplace's scrapping (linking absorbed into Open), the menus/toolbars
rethink deferred by his own word as non-loadbearing, and BM2
(side-by-side) queued for its own brief after BM1's review. Commit this
brief.

## S1 — the Plan reconciliation (report before S4+ builds)
Verified before this brief: `StoryPlan` is its own store
(`writer-studio-story-plans`), referenced by `storyPlanId` from
project-level records, with M1's beats/milestones and the cascade's
Plan panel reading it. **Map the whole surface:** every reader and
writer of StoryPlan, what the Plan panel does, what Progress:Project
consumes. Then report ONE of: (a) StoryPlan's shape can serve as the
Storyboard projection's data for paired boards — the fold Nick
authorized — with the mapping stated; or (b) it cannot without breaking
M1's consumers, in which case Storyboard v1 projects deck/box data
alone and the fold becomes its own later ticket. **Do not silently
build a second plan system either way** — the report names the choice
and its reason before S4 begins. The cascade's Plan panel becomes, at
minimum, a door to the paired plan face where one exists.

## S2 — the pairing (SCHEMA — Nick's explicit go at merge)
A 1:1 page⇄board pairing:
- **Shape:** nullable `planBoardId` on entries (page side), with the
  board's own `origin` untouched — derived Journal/Shelf/Trash
  membership must be provably unaffected. If implementation reveals a
  cleaner shape (a pairs table), STOP and report before migrating.
- **Migration + both sync-mapper directions**, placeholder counts
  hand-verified per the schema review standard; grandfather: every
  existing entry reads `planBoardId: null` and is byte-identical in
  every non-BM1 path.
- **Lazy birth:** a page's plan board is created on FIRST flip, never
  before, never automatically. Its cards start empty in OPEN mode. An
  existing board gains a Write face only by explicit pairing from its
  side ("pair this board with a page…" — chooser or create-new), never
  by inference.
- **Unpairing/deletion:** deleting a plan board unpairs (page's
  `planBoardId` nulls, page untouched); deleting a page orphans the
  board into ordinary loose membership — nothing cascades, nothing is
  destroyed silently.

## S3 — the bar: three modes, the door, the telos line
The board's top bar (post-FX10 baseline) becomes:
**OPEN · STORYBOARD · OUTLINE · PAGE →** — the first three in the
page-bar's exact tab grammar; PAGE → dressed as a door: the arrow
glyph, and never an active/selected state (a door has no "current"
state; clicking it always travels). On paired boards it resolves to the
paired page; on unpaired boards it is the FX10 named return, unchanged.
The Page's bar gains the mirror at its end: **PLAN →**, same arrow
grammar — first click on an unpaired page births the plan board (S2's
lazy rule) and flips. **The telos line:** one muted static line in the
board's top region, through deskLexicon, proposed wording *"The plan
serves the page."* — Nick may edit the string in this brief; his edit
travels verbatim. It is chrome, not a toast; it never animates, counts,
or nags. Mode choice persists per board, client-local (the FX9
persistence shape, zero schema). Default OPEN.

## S4 — the projection seam (decks are data, modes are projections)
Normalize deck definitions into a structure description — ordered
sections/beats, prompts, nesting where declared — WITHOUT changing any
existing deck's observable behavior on today's board (the seven-deck
library renders byte-identically in OPEN). Projections are renderers of
that one description: `open` (today's canvas, exists), `storyboard`
(S6), `outline` (S7). A deck never knows which projection will draw it.
This seam is the ticket's non-negotiable; if any slice pressures a
per-mode deck fork, STOP and report.

## S5 — OPEN mode (the default, plus linking absorbed)
Today's free canvas, unchanged in feel: cards land where dropped, no
grid, no snapping, no tidiness affordances. **Linking, v1 minimal:** a
writer may link two cards; the link renders as a muted curve beneath
cards (never over their faces); stored in the board's box data
(jsonb-shape extension, no migration — disclosed in the types with a
charter comment; study `FragmentLink` as the house ancestor before
inventing a shape). Links are deletable; link chrome obeys the lanes
(olive at rest, nothing orange). No auto-linking, no suggested links.

## S6 — STORYBOARD mode
The sequential projection: cards flow into ordered lanes (acts/
sequences per the deck's structure description; a structureless board
gets one lane). Drag reorders within the projection and the order is
the board's truth across modes (one ordering, three views — order is
data, not per-mode). If S1 reported (a), the paired page's StoryPlan
beats surface here as the lane structure and M1's milestone/coverage
consumers keep working — proven, not assumed. Coverage *intelligence*
beyond what M1 already computes is out of scope.

## S7 — OUTLINE mode (the document projection; the nesting floor)
The same board data projected as an editable, sectioned, hierarchical
document — sections containing points containing sub-points, Roman-
numeral thinking without literal Roman numerals unless the deck says
so. **The Grammarian's floor is law: if v1 cannot render and edit
genuine nesting, OUTLINE does not ship this ticket** — report and it
becomes BM1.1 rather than shipping flat. Edits in Outline write the
same underlying cards/structure the other modes read. Card text edited
here is the same text everywhere. This is a projection, not a fourth
page species: it mounts inside the board surface, and the writer's own
words typed here are theirs — copyable out like all prose.

## S8 — the flip, whole
Instant both directions with state preserved (mode, scroll, selection
survive a round trip); trusted-pointer proven; the Tutor's room rides
both faces per TU2 unchanged; A15 vanishing untouched on the page side.
No knock anywhere: no badge on PLAN →, no dot, no "you haven't planned
yet." The paper's rect and text measure on the page side are inviolate
throughout — PLAN → is bar chrome only.

## S9 — harness (`bm1.mjs`) + the bar
Schema: migration + mappers round-trip; grandfather byte-identity for
null-`planBoardId` entries across every load/edit/save path; derived
membership unaffected (Journal/Shelf/Trash counts identical pre/post
for a seeded corpus). Pairing: lazy birth on first flip only; explicit
pairing from board side; unpair/orphan rules exact. Bar: three tabs +
door at 1100 (floor, mandatory) / 1280 / 2200; the door never carries a
selected state; PAGE → and PLAN → both travel under genuine
trusted-pointer clicks, paired and unpaired (fallback) cases both;
telos line present, static, lexicon-sourced. Projections: the
seven-deck library byte-identical in OPEN; one seeded structured deck
renders correctly in all three modes; an Outline edit round-trips to
the same card's text in OPEN; ordering is single-sourced across modes.
Linking: create/render/delete; curves never over card faces; nothing
orange at rest. Flip state preservation both directions. M1 consumers
green if S1(a), explicitly re-run. A4 park sweep with live successors
(FX10's return checks on paired boards will supersede — park, never
edit). Legacy <1100 byte-identical. Full suite, isolated worktree,
`git status` clean, both `HARNESS_PARKED` settings. `tsc` ×2,
`build:web`, selftest.

## Non-goals
Side-by-side (BM2, briefed after this review); menus/submenus/toolbar
rethink (Nick's own deferral); coverage intelligence beyond M1;
suggested/auto links; web clipping (dead at the rail, forever); new
deck content; W1 the Deck Wizard; any Tutor change.

## Invariants
Page is Primary — the plan face is subordinate, lazily born, never
first; doors are doors (the arrow dress, no selected state) and modes
are modes; decks are data, modes are projections — one deck library;
"Project" stays retired from writer-facing chrome; derived membership
untouched; nothing orange at rest; A14 — no knocks, badges, or dots on
any of it; every string through deskLexicon; both-reference-widths +
the 1100 floor; A4 parking, originals immutable; one worktree per
agent, `git status` clean before any sweep; schema merge on Nick's
explicit word only; report = push.

## Definition of done
Nick, after merge on his word and deploy on his word: opens a page he's
drafting, clicks PLAN →, and a board is born waiting in OPEN; scatters
cards, links two, switches to STORYBOARD and sees them take order,
switches to OUTLINE and edits the same words as a nested document;
clicks PAGE → and is back in his sentence with everything exactly where
he left it — and at the top of every plan, quietly, the reminder that
the plan serves the page. The Journal never noticed. The paper never
moved. And the way back was always one arrow wide.

— Fable, from Nick's rulings on the second pass, 2026-07-21
