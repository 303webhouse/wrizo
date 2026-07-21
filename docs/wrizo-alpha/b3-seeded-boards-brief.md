# B3 — Projects as Seeded Boards · build brief · 2026-07-21

**Branch:** b3-seeded-boards off main (after the B2 + B2.1/S6 deploy
lands; one checkout per agent stands).
**Authority:** ledger item 36 (B3's true shape is the deck ENGINE
plus the deck LIBRARY — Nick's "Card Deck" coinage, recorded
2026-07-20) and docs/wrizo-alpha/card-deck-catalog.md (the Experts'
pass: five structural laws + 21 catalogued decks + the v1 ship-set
recommendation). The catalog is this brief's material; the brief is
the ticket. Nothing beyond this brief builds from the catalog.
**Zero schema, zero new deps** — the catalog's own Law 4 is this
ticket's constitution: deck DEFINITIONS are static app data; DEALING
a deck is ordinary card creation on an ordinary board (boxes jsonb
only). If any slice finds itself wanting a column, STOP and report.
Merge pre-authorized as zero-schema; Fable reviews post-merge,
gating close and redeploy.

## S0 — records first
Ledger: open B3's item, cross-referencing item 36 and the catalog.
Record the ship-set decision below as Fable's call, Nick-vetoable at
any point before merge.

## S1 — the deck engine (the wizard runtime)
One generic runtime that any deck definition can ride. The R6
rulings bind it verbatim, per catalog Law 3:
- Opt-in always — the engine appears only behind the two doors in
  S3; no deck is ever suggested unprompted (anti-solicitation,
  absolute).
- Step-by-step pop-out over the faded board — the wizard floats;
  the board dims behind it; the pop-out never reflows what's under
  it; geometry asserted at both reference widths.
- Clickable-first — every narrowing question is a row of concrete,
  clickable options; text entry permitted where a deck allows it,
  required never.
- Ends on the dealt board — the wizard's last act is dealing; the
  writer lands on their board with the cards down, wizard gone.
- "Start Here" — the first dealt card carries a quiet hint marker
  that vanishes the first time ANY dealt card's text is edited
  (fence: edit = the writer's first change to a dealt card's
  content; tune only if the felt behavior disappoints). A hint on a
  board the writer just asked to deal is orientation, not
  solicitation; it earns no color in the orange lane.

A deck definition is a static object: id, name, room, its narrowing
questions (prompt + clickable options), and a deal function mapping
answers to a card set — each card ordinary in every way (editable,
movable, deletable, taggable; nothing locked, nothing mandatory),
with title (the beat's name), a one-line prompt as starting body
text the writer overwrites, a sensible dealt layout (the deal
function owns geometry — columns by act/section as each deck
declares), and threads WITHIN the deck's own cards where its
definition says so. Dealt cards owe nothing to their template
afterward — no back-reference, no deck identity persisted beyond
ordinary card data.

## S2 — the deck library (the v1 ship set)
Seven decks ship — the committee's six flagships plus Character
Study, promoted on Fable's call: once the engine exists a deck's
marginal cost is a definition file, and Character Study is the
threads demonstration the whole system deserves. Nick cuts or
re-promotes by a word.

Per the catalog, definitions verbatim from its entries: Three-Act
Structure (wizard: novel / novella / short story, dealing
proportionately), Worldbuilding (wizard: fantasy / SF / other —
prompts only; includes the Iceberg card), Feature Screenplay (Save
the Cat's 15; wizard routes pilot-seekers onward in copy only — the
TV Pilot deck itself is second wave), Thesis / Dissertation
(wizard: humanities / sciences; sciences deals IMRaD chapter
shapes), Grant Application, Feature Story, and Character Study
(dealt pre-threaded: its relationship cards wire the cast
together). Every string — deck names, prompts, questions, card
titles — lives in the definitions and routes through the lexicon
seam like all chrome copy.

## S3 — the two doors
1. At drawer creation — CreateProject's flow gains the opt-in
   choice: Blank stays first-class and first-listed, byte-for-byte
   unchanged as the default path; beneath it, "Start from a deck…"
   opens the library (decks grouped by room, one line each). This
   is the ticket's namesake: a project born as a seeded board.
2. On any board — the Board's existing Add flow gains "From a
   deck…" beside its current options; dealing lands the deck's
   cards on THAT board alongside whatever already lives there.
Both doors are places the writer already deliberately went; neither
advertises. No third door, no strip presence, no Tutor mention.

## S4 — harness (b3.mjs)
The engine end-to-end through one deck at both reference widths:
wizard opens as a pop-out over the faded board, board geometry
byte-identical beneath it, clickable narrowing answers, deal lands
the declared card count, every dealt card proven ordinary (edit
one, move one, delete one), "Start Here" present then gone on first
edit and proven never to return. The blank path through
CreateProject asserted unchanged. A definitions sweep: all seven
decks deal without error and land their declared counts (loop,
cheap). Anti-solicitation absence checks: no deck UI on a fresh
board, a fresh drawer, or anywhere without the writer's click.
Cross-question: dealt cards carry no deck back-reference in boxes.
Park any checks this falsifies per A4; full suite green, both
HARNESS_PARKED settings; report = push.

## Non-goals
The fourteen second-wave decks; cross-deck threading (Ensemble ↔
Worldbuilding — a delight deferred with its decks); the Résumé deck
entirely (its tailoring card entangles the future paste rail — the
catalog's own flag, honored); the existing StructureWizard /
BeatWizard / StructureBoard's fate (a future explicit ruling once
the engine stands — this ticket adds beside them and touches them
not at all, the /project/* deferral's sibling); user-authored
decks; routes; deck editing after dealing (there is nothing to
edit — dealt cards are just cards).

## Invariants
Zero schema — definitions are static app data, dealing writes
ordinary boxes only, STOP-and-report if a column beckons. The blank
board remains first-class. Anti-solicitation absolute. M1: nothing
locked, nothing mandatory, no homework. Olive/orange lanes (the
wizard's affordances quiet; nothing orange at rest). Both-
reference-widths law on every geometry assertion. Every new string
through the lexicon seam. Legacy byte-identical. One checkout per
agent. Report = push.

## Definition of done
Nick, after redeploy: creates a drawer and sees Blank standing
first, untouched; chooses "Start from a deck…" instead, answers two
clickable questions, and lands on a board with Three-Act's nine
cards dealt and "Start Here" resting quietly on the hook; edits
that card and watches the hint die forever; drags a card somewhere
better and deletes another with no protest; opens Character Study
on an existing board and finds the cast dealt pre-threaded; and at
no point, anywhere, is offered a deck he didn't ask for.

— Fable, from item 36 and the catalog, 2026-07-21
