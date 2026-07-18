# AB4 — the Wall · build brief · 2026-07-18

**Branch:** ab4-wall off main, built after cd2.1's audit folds.
**Authority:** the Tutor committee pass as ratified by Nick,
2026-07-18 — A12–A15 RATIFIED, the composition line made LAW (with
Nick's revisit note: "if it's overly restrictive later, we can
always revisit"), Wall first then TU1, per-page Tutor threads in v1
— plus CD2's Wall-fold ruling and Ruling 2's carries, all of which
this ticket discharges.
**Zero schema, zero new deps** — everything rides the existing
boxes jsonb. If any slice finds itself wanting a column, STOP and
report — schema tickets carry no pre-authorization, and this one
was declared without. Merge pre-authorized as zero-schema; Fable
reviews post-merge, gating close and redeploy.

## S0 — records first
Append to the canon with the ratification record: A12 (the
two-sides law), A13 (the ghostwriter rail, constitutional — the
Tutor speaks about the writing, never as it; reference yes,
composition never; no Tutor output enters a writing surface by any
affordance), A14 (the room never knocks), A15 (the Tutor inherits
the vanishing law with the dock rider), and the composition-line
law with Nick's revisit note verbatim. Ledger: open AB4's item;
record TU1 as queued next with its SCHEMA FLAG standing (Nick's
explicit merge go required). Commit the Tutor committee pass if the
relay hasn't landed it.

## S1 — cards in the survey (the CD2 erratum comes true)
In Plan's survey, picking a board swaps the survey column to that
board's CARDS as large thumbnails — title plus a two-line excerpt,
or the card's image where a card IS an image — with a quiet back
affordance to the board list. Fully dockable per the dock law: this
is the PowerPoint moment, a board's cards docked beside a focused
page, surviving keystrokes by the writer's deliberate word. The CD2
DoD line becomes literally true; note the erratum's closure in the
ledger.

## S2 — Pin, the fourth verb
"Pin to a Board…" joins Move/Copy/Port in the Page panel's sending
row, riding the same Add-to grammar (board picker; existing pipes).
Pinning is MEMBERSHIP, not capture: the page's home and origin are
untouched, a card referencing the entry joins the board's boxes (a
page-pin card type carrying the entry id), and the Page panel's
home block gains the membership line — "Also pinned to <board>." —
told truthfully like every other membership. Unpinning removes the
card, never the page.

## S3 — threads
Cards connect: a quiet connect interaction (fence: a connect toggle
in the board sliver arms it; click card A then card B; Escape
disarms) rendering as hairlines between cards, stored in boxes (a
connections array of card-id pairs). Threads delete by selecting
the hairline and pressing delete, confirm-free (a thread is cheap;
re-drawing is one gesture). Nothing orange at rest; hairlines
quiet, olive only while connect mode is armed.

## S4 — the card's body: resize and travel
Cards resize by corner drag (geometry persists in boxes).
Double-click a page-pin card travels to its page, way back
guaranteed (the board is one Back away). Double-click on a plain
text card keeps today's edit behavior — Nick's standing rider:
notecards keep their inline editing, no sliver interference.

## S5 — the Board joins the system (the last carries discharged)
BoardEditor gains the sliver: board hand tools (fence: Add card,
the Connect toggle, and nothing else v1 — minimum options). The
standing pageKind='prose' cleanup lands: BoardEditor declares
pageKind='board' and every downstream branch that assumed prose is
swept. With this, every surface in the app carries the same chrome
system — strip, sliver, top line — and no pre-cascade wiring
survives anywhere.

## S6 — harness (ab4.mjs) + the sweep
Survey card-swap (board list → cards → back) at both widths; docked
cards persist through typing; the pin flow through the real picker
(origin and projectId untouched on the pinned page, membership line
asserted, unpin removes card not page); thread create/persist/
remove; resize persists across reload; double-click travel + the
way back; text-card inline editing untouched; pageKind='board'
asserted; board sliver carries exactly its two tools. Park any
checks this falsifies per A4 (the parked-arming audit from cd2.1
guards the whole class now). Full suite green, both HARNESS_PARKED
settings.

## Non-goals
TU1 (next ticket, SCHEMA, Nick's explicit go — its brief follows
AB4's review per the one-brief rhythm); model-assisted anything;
theme dialects; plural walls beyond boards-as-walls (a project's
many boards ARE its walls); card images beyond what boxes already
carry; the Library.

## Invariants
Zero schema — boxes jsonb only, STOP-and-report if a column
beckons. The paper never reflows. One vanishing engine; the dock
law holds. Olive/orange lanes (nothing orange at rest anywhere
new). Anti-solicitation. Every new string rides deskLexicon (Flux
coherence pass included). Both-reference-widths law on every
geometry assertion. Legacy below the gate byte-identical.
Report = push.

## Definition of done
Nick, after redeploy: pins a page to a board from the Page panel
and reads the truthful membership line; docks that board's cards
beside his paper and keeps writing while they stay; draws a thread
between two cards and deletes one; resizes a card and finds it held
after reload; double-clicks into a pinned page and comes back in
one step; opens a board and finds the sliver waiting with exactly
two tools. The corkboard he drew in the first sketches, standing on
the cascade.

— Fable, from Nick's ratifications, 2026-07-18
