# THE PAGE/PLAN WORKFLOW — committee double-pass (PLAN desk, 2026-09-07)
### The arc Nick opened with Q1's answer: *"a new design arc opens with it: the
### PAGE/PLAN WORKFLOW arc — three mockups, DOUBLE PASS, under a MINIMUM-SETUP LAW."*

> **⚠ AMENDED — SEE `pw-addendum-three-space-canon.md` (2026-09-07).** Nick ratified a
> three-space canon (surfaces / containers / displays; Boards as containers; cards
> board-owned but copyable across boards — item 123). **Nothing below is rewritten.**
> The addendum re-reads this pass against it, adds candidates **PW15–PW18** and card
> transfer as a journey, and records **one correction: §THE ARCHITECTS A9's
> "edits sync both ways for free" is FALSIFIED AS A GENERAL CLAIM** by copyable cards —
> left standing verbatim there, superseded by PW16 in the addendum.

**STATUS: CANDIDATES ONLY — output to Nick for his word. Nothing locks.**
C5 (the shelf) and C6 (find from Draft) wait on this arc by Nick's own ruling
(open-threads, item 119 band, 2026-09-05). This pass is design only: no code,
no checkout, no ledger touch.

**PROVENANCE — read whole at today's tip (`6d7cdec`):**
`docs/wrizo-alpha/cluster-pass-tags-shelf-hands.md` · `docs/menus/item83-pass4-board.md`
· `item83-pass5-card.md` · `item83-pass7-places.md` · `item83-grammar-pass.md` (G1–G8)
· `item83-nick-rulings-2026-08-03.md` (R13/R14) · the ledger's standing band and items
88 · 93 · 96 · 114–119. **Source verified, not inferred** — `Cascade.tsx`,
`CascadePanels.tsx`, `CascadeSurvey.tsx`, `PlacesPanel.tsx`, `PageEditor.tsx`,
`BoardEditor.tsx`, `ScriptEditor.tsx`, `store/persistence.ts`, `store/pageHome.ts`,
`index.css`. Every claim below marked **[built]** was read in the file named.

---

## §0 · THE PROBLEM, AND WHAT THE DISK SAYS ABOUT IT

Nick's two sentences:

> "The hard part is designing a flexible Page + Plan interface that allows writers to
> easily switch back and forth between surfaces as needed but doesn't require overly
> complicated setup or a steep learning curve."

> "it is incomprehensible where documents are stored."

**S0 — THE SURVEY OF WHAT IS ALREADY BUILT.** Before designing anything, this desk
walked the round trip on disk. The result reframes the arc, so it leads:

**(1) The whole journey already exists.** `Cascade` → `plan` tab → the panel's footer
link **"Open…"** → `buildSurvey({category:'plan'})` lists boards → pressing one swaps
the same column to **that board's own cards** (`category:'plan-board'`) with a `‹` back
→ pressing a page-pin card **travels to its page**. Four presses, working today.
**[built — `CascadePanels.tsx:795–852`]**

**(2) But it lists the wrong set.** The board list is
`getBinderPages(kind.projectId)` — *every board in the page's drawer.* The writer's
question is "which boards is **this page** on." **Co-location is not connection.**
**[built — `CascadePanels.tsx:809`]**

**(3) The right set is already computed — and rendered as a sentence.**
`getBoardsPinning(entryId)` **[built — `persistence.ts:1053`]** and the page's own
`planBoardId` **[built — `persistence.ts:1725`]** are exactly the connection set.
`describePageHome()` **[built — `store/pageHome.ts`]** turns them into English:

> `In Novel` · `Also pinned to Stark.` · `Also pinned to Winterfell timeline.`

**The app already knows the entire answer and already writes it out. It renders it as
prose, inside a drawer, where it cannot be pressed.** *"Also pinned to Stark."* is
literally the board list Nick asked for, set as a paragraph instead of as doors.

**(4) The framed page dropped its address.** At ≥1100px — the composed desk, the
surface Nick actually works on — **the Board carries a location crumb and the Page and
the Screenplay do not.** `BoardEditor.tsx:2404` renders `sprint-crumb` in its *framed*
branch; `PageEditor.tsx:1089` and `ScriptEditor.tsx:1196` render it only in their
*unframed* fallbacks. This was **deliberate**, and the code says why in its own words:

> *"the top-bar title retires (the crumb/breadcrumb it duplicated — the Page face
> already carries the same title + 'where it lives' chain via describePageHome, S3)"*
> — `PageEditor.tsx:940–944`, CD1 S1

The trade was: *the address moves into the Page face.* The Page face lives in a cascade
drawer. **So on the framed desk, "where does this page live" costs two presses and a
drawer — and the writer must already know which drawer.** Nick's hardware falsified the
trade. This is a ruled trade overtaken by evidence, not a defect, and it is named here
as such.

**THE DIAGNOSIS.** *This is not a missing capability. It is a rail that answers
proximity when the writer asked about connection, and a desk that stopped saying where
it was standing.* Every relation Nick wants already exists as a row in storage. The arc's
whole job is to make what the writer already made **legible at the tab, and pressable.**

That is also why the arc can obey the minimum-setup law absolutely: **there is nothing
to set up.** Zero schema, zero new entities, zero configuration — the design moves words
and rows, not data.

---

## FIRST PASS

### THE EXPERTS — why

**Writers do not navigate; they reach.** A writer mid-scene who needs the Stark card is
not performing an information-retrieval task. They have a hand out. Every press between
the hand and the card is friction charged against the sentence they were writing. So the
measure of this design is not "can it be done" (it can, today, in four presses) but
**how many presses stand between the writing and the thing, and how many stand between
the thing and the writing again.** The return trip is half the design and the half
usually left undesigned.

**The two questions are different questions, and the app has two tabs.** A page has
exactly two relationships worth a door:
- **where it LIVES** — one home, single-select, a *put* act (`projectId`, `setPageHome`)
- **where it APPEARS** — many memberships, a *go* act (`page-pin` boxes, `planBoardId`)

The rail already has a **Page** tab and a **Plan** tab. The design writes one question
on each and never mixes them. This is the whole answer to "incomprehensible where
documents are stored": **the question gets a permanent address.** Not a better answer —
a *findable* one. A writer who learns two facts on day one ("Page says where it lives,
Plan says where it appears") never has to learn anything else about storage, ever.

**Pass 7's law, applied twice, gives opposite answers — and that is the teaching.**
PP1 ruled: *where a noun can be misread, the verb at the point of reading is the cure.*
The Places panel's disease was a column of place-nouns that meant **PUT** while the
writer's learned grammar read **GO**. The Plan panel is the *other* case: its nouns mean
exactly **GO** — the learned grammar is correct there. So Places gets verb-led headings
and Plan gets bare nouns, **on purpose**, and the difference between the two panels is
itself the lesson about which act you are in. Same law, opposite output, because the act
is opposite. Uniformity here would have destroyed the very distinction PP1 exists to
protect.

**The best surface switch is the one the writer does not have to make.** Item 117 already
ruled that a card opens *in the same popup used on the Board*. So the strongest form of
"switch back and forth between surfaces" is: **for a card, don't switch at all** — the
card comes to the writer, over the page they are standing on, and Close returns them to a
caret that never moved. Travel is reserved for what is genuinely a place. The built code
already draws that line (`BoardEditor.tsx:2021` — a text card opens the popup; a
page-pin travels). The rail should inherit it rather than invent a second grammar.

**Nothing here is a relationship the writer configures.** Pinning a page to a board is a
checkbox the writer already has **[built — `PlacesPanel.tsx`, the Boards zone]**. Drawing
a thread is a drag. Typing a tag is typing. The arc adds **no setup step of any kind** —
its entire contribution is that the results of those acts become visible where the writer
looks. Minimum-setup is not a constraint this design had to work around; it is a
consequence of refusing to add data.

### THE ARCHITECTS — how

**A1 · The set changes; nothing else does.** Replace `getBinderPages(projectId)` with
`planBoardId ∪ getBoardsPinning(entryId)`. Both functions exist, both are local, both are
already called elsewhere this same render. **Zero schema, zero wire, one line of set
arithmetic.** Everything downstream — the survey, the thumbnails, the back arrow, the
`current` mark, the docking, the 180ms collapse — is the built engine, untouched.

**A2 · The panel *is* the list; "Open…" retires.** Today `PlanPanel` renders two creation
doors and hides the board list behind a footer link **[built — `CascadePanels.tsx:453`]**.
That footer link is the single most expensive press in the arc: it buys nothing, and it
is the reason the geography reads as absent. The list becomes the panel's first zone;
`＋ New board` and `Plot a story` move **below** it, under a rule. Travel is the common
act; creation is the rare one; the panel's order should say so.

**A3 · Panel → survey is exactly G4's ceiling, already engineered.** G4 allows *panel plus
at most one pop-out*. Boards in the panel, that board's cards in the survey, is precisely
one pop-out — and it is the pop-out the codebase already ships, with `onBack`, `current`,
`renderMenu`, and the docked-width clamp all built **[`CascadeSurvey.tsx`,
`index.css:4116–4128`]**. Nothing new is engineered; a set is swapped and a link is
deleted.

**A4 · One act per row — so the board's own door is a row of its own.** PP4 forbids a
second act on a row (*"a second act per row would recreate the ambiguity as a
mis-click"*). So the board row opens the board's **cards**, and nothing else. Standing
*in* the board is reached by a door-dressed first row inside the survey — **`Open the
board →`** — using the built `wz-cascade-action-door` dress that already distinguishes
doors from rows in this exact chrome. Verb names its object (CA1); one act per row (PP4);
no new component.

**A5 · The rail's gesture is one press, and this departs from item 117 by name.** Item
117's charter says *"double-click opens the card/doc."* That is the **canvas's** gesture,
correctly. In a **list**, a double-click is a second gesture the writer must be taught —
a learning curve, which the governing law forbids. The built survey is already
single-press (`SurveyThumb onClick` — **[`CascadeSurvey.tsx:82`]**), and the board bench
already ruled *"arrangement acts must stay one press"* (Pass 4). **Candidate: one press
in the rail; double-click stays the canvas's.** G2 requires any divergence to travel to
Nick by name — it is named here, and it is PW-Q3 on the question sheet.

**A6 · The trail is the rail.** When a press in the survey travels to a page, the cascade
should arrive **still open, still on that board, with the row the writer came from
wearing the `current` mark the survey already computes**
**[`CascadePanels.tsx:806`, `CascadeSurvey.tsx:82`]**. Then the return is one press on a
row that is already under the writer's eye. This is the only candidate in the pass with
real build weight: `useCascade` is per-surface state today, so surviving a route change
is genuine plumbing — named honestly, exactly as item 119 named its own
canvas-anchoring weight. **Cheap fallback, if the weight is refused:** the built
`‹ Back to the board` chip **[`PageEditor.tsx:972`]** is minted on cascade travel too —
but with the **honest** word. Today's chip says *"Back to the board"*; a writer who
reached a card through the rail never stood on the board, and sending them somewhere
they have never been is the destination-blind verb the Card pass named as the enemy.
The chip must name the surface actually left.

**A7 · The crumb comes back, in the shape the Board already proved.** `BoardEditor`'s
framed header is `crumb (margin-right:auto) · strip · actions`. The Page's framed header
is `strip · actions` with a hole where the crumb was. **Restore the Board's own row
shape on Page and Script** — reuse, never copy; the precedent is in-tree and shipping.
One refinement: the chain must never render empty — a page with no drawer and no project
should read its home label (`Loose — belongs nowhere yet`) rather than a bare title, so
the crumb tells the truth in the one case where the writer is most likely to be lost.
`describePageHome` already produces that string.

**A8 · The host moves; the mechanism does not.** Item 117 says the linked boards live in
the **Tools Menu**; C5 repeats it, then says *"one cascade level further"* in the same
breath. The two cannot both be right, and R13.iv decides it: **there is no Tools sliver
on boards at all.** Put the geography in the Desk and it vanishes the moment the writer
stands on a board — the exact surface where switching matters most, and a straight
violation of G6 (grip constancy) and of Nick's own "switch back and forth." Further,
G8 says the left hand *acts on this surface*; a list of other boards is not an act on
this page, it is geography — and geography is what the cascade **is** (Journal, Page,
Plan, Drawers, Shelf, Trash are all places). **117's mechanism is preserved verbatim
— thumbnails, a second level of cards, the shared card popup, edits identical by
construction; only its host changes from the Desk to the cascade.** This is the same
amendment shape the analog law already used on 112-C: *the placement clause amends; the
substance does not.*

**A9 · Edits "sync both ways" for free, and the pass claims no credit for it.** The
cluster pass established it: there is **one card**, seen from two places — identity, not
a sync engine. The rail's card popup is the board's card popup with a different backdrop.
Nothing to build, nothing to reconcile, nothing to get wrong.

**A10 · The panel opens where the writer left it.** Per-page memory of which board's
survey was last open. This is not a configured relationship — it is the machine declining
to forget, and it only ever restores something the writer themselves opened. It converts
every visit after the first from three presses to two. Risk named: a writer who wanted
the list gets a board — mitigated by the `‹` that is always in the survey's head.

### THE OPPOSITION — named chair: Marketing / simplicity (reach vs complexity)

**Objection 1 — this is a file browser growing inside a writing app.** Boards listing
cards listing pages is a tree, and trees are what writers flee. **Answer, partly
conceded:** the ceiling is hard and stated — **two levels, never three.** Boards, then
that board's cards. A card does not disclose. G4 already binds it and the survey has no
third layer to build. The anti-file-manager rule is in-tree and this pass sits under it.
What is refused is the inference that *any* list is a file manager: the writer sees at
most a handful of boards they personally pinned this page to, and it is shorter than the
sentence the Page face renders today.

**Objection 2 — the two-panel split is a lesson, and lessons are learning curves.**
"Page says lives, Plan says appears" is a rule the writer must hold. **Answer:** it is
one rule, it is true on every surface, and it replaces the current state where the answer
is in neither tab reliably and the writer must hold nothing because there is nothing to
hold. A curve of one fact, learned once, against a floor of permanent confusion. And the
writer who never learns it still finds the boards, because they are *listed under the tab
called Plan*.

**Objection 3 — the crumb is scope creep from a different arc.** PW8 is item 96's
business (the Places Model), or CD1's, and this desk is restoring chrome another pass
deliberately removed. **Answer, and this is the honest one:** conceded on ownership,
refused on silence. The finding is stated with its evidence and its author's reasoning
quoted in full; the trade is named as *ruled, then falsified by hardware*, not as a bug.
If Nick or Fable re-homes it to 96, it travels intact. What this desk will not do is
design a page/plan workflow while the page cannot say where it is standing and pretend
that is someone else's problem.

**Objection 4 — PW6's build weight buys one press.** Persisting cascade state across
navigation is real plumbing for a small gain. **Answer, and it concedes the ranking:**
it is the one weighty candidate, it is separable, and the arc ships without it. But the
press it buys is the **return** press, and the return is where the writer's momentum
either survives or does not. The cheap fallback (an honestly-worded chip) is specified
so that the arc has a complete round trip either way — *progress over perfection*, with
the better version named rather than pretended away.

**Objection 5 — "the Shelf" was already ratified as the name.** C5 named this feature.
**Answer, and this is a real find:** the rail **already has a Shelf tab**, and it means
*loose, unfiled documents* **[built — `CascadePanels.tsx:679`, `getShelfEntries`]**. Two
different shelves in one left rail is a learning curve manufactured on day one, for
nothing. **Candidate: the feature takes no new name at all.** It is simply what the
**Plan** tab shows. One fewer word for the writer to learn is the cheapest simplicity
this arc will ever buy.

### THE WORKING-WRITERS BENCH

**The Westeros test, run against the candidate.** Martin is writing the Sansa chapter and
needs what he wrote about Ned's refusal. `Plan` → `Stark` → `Ned's refusal` — **three
presses, and the card opens over the chapter he is writing.** Esc. The caret has not
moved. He does not learn a feature; he presses the tab named Plan, which lists the boards
he himself pinned this page to.

**The bench's four warnings, on the record:**
1. **No counts, no badges, no dots anywhere in this chrome.** A board row's second line
   names the *relation* ("its own plan board") or the *drawer* ("Novel") — never "12
   cards." A number beside a board is a metric, and a metric is a nag. (A14, A18, BD4's
   *listed, never counted*.)
2. **Absent, never empty.** A page on no board has **no board zone** — not a zone with
   "No boards yet" in it. Nothing announces a capability the writer has not reached for.
   The zone appears the moment they pin, because *they* pinned — the same lawful arrival
   the board's own selection-gated action row already has (*"it arrives because the
   writer acted; it still may not lunge"*, Pass 4).
3. **The list has a scanning ceiling and it is honest about it.** Boards this page is on
   is a naturally short list. If a writer's page is on nine boards, the panel scrolls —
   it does not group, filter, sort, or grow a search box. A limit stops; it never
   relocates.
4. **No motion is added.** The panel's 180ms collapse and the survey's slide are the
   built engine. The card popup owns its own arrival. This arc contributes zero new
   animation.

---

## SECOND PASS — CANDIDATES

**PW1 · TWO TABS, TWO QUESTIONS, ONE SENTENCE EACH.** **Page** answers *where this page
lives and where it appears* — put-family, verb-led headings, PP1 as written. **Plan**
answers *which boards this page is on, and what is on them* — go-family, bare noun rows,
**no verb heading**. The panels are deliberate opposites and the opposition is the
teaching. (PP1 applied twice; G8's left-acts/right-speaks logic extended to place.)

**PW2 · THE PLAN PANEL LISTS *THIS PAGE'S* BOARDS.** The set becomes
`planBoardId ∪ getBoardsPinning(entryId)`, replacing `getBinderPages(projectId)`.
Co-location is not connection. Zero schema; both functions built and local.

**PW3 · THE PANEL IS THE LIST; "OPEN…" RETIRES.** The board list is the panel's first
zone. `＋ New board` and `Plot a story` move below it under a rule. Travel is common;
creation is rare; the order says so. Saves the arc's most expensive press.

**PW4 · ONE PRESS OPENS A BOARD'S CARDS, IN THE BUILT SURVEY.** Panel → survey = G4's
ceiling exactly, using the shipping engine. The survey's **first row is a door**,
`Open the board →`, in the built door dress — one act per row (PP4), verb names object
(CA1).

**PW5 · A CARD OPENS WHERE YOU ARE; A PAGE IS TRAVELLED TO.** The rail inherits the
canvas's own built distinction: a text/free card opens in the shared popup over the
current surface (117's ruling, identity not sync); a page-pin card travels. The best
switch is the one the writer never makes.

**PW6 · THE TRAIL IS THE RAIL.** Cascade Plan state survives travel; the origin row wears
the built `current` mark; return is one press. **Known build weight** (`useCascade` is
per-surface today) — separable, and the arc ships without it. **Fallback:** mint the
built return chip on cascade travel, worded to name the surface actually left — never
today's "Back to the board" to a writer who never stood on one.

**PW7 · THE PANEL OPENS WHERE YOU LEFT IT.** Per-page memory of the last board opened.
Not a configured relationship — the machine not forgetting. Turns the second and every
later visit into two presses. The survey's `‹` is the always-available escape.

**PW8 · THE FRAMED PAGE AND SCREENPLAY REGAIN THE CRUMB THE BOARD KEPT.** Restore
`BoardEditor`'s own framed header shape (crumb · strip · actions). The chain never
renders empty: with no drawer and no project it reads the home label
(`Loose — belongs nowhere yet`) from `describePageHome`. **Finding of record, with CD1
S1's reasoning quoted whole; ruled trade overtaken by hardware, not a defect. Ownership
routes to Nick — 96 or here.**

**PW9 · ABSENT, NEVER EMPTY.** No boards → no board zone. Nothing announces a capability
unreached. The zone arrives by the writer's own act, never by suggestion. (G3; BD7/FW6;
the action-row precedent.)

**PW10 · THE SECOND LINE NAMES THE RELATION OR THE DRAWER — NEVER A COUNT.** Plan board →
*its own plan board*. Pinning board → its drawer name (which is also, quietly, half the
answer to "where is it stored"). No counts, badges, or dots. (A14; A18; BD4.)
**Clause — the untitled plan board.** `getOrCreatePlanBoard` mints a board with
`text: ''` **[built — `persistence.ts:1737`]**, so a plan board is normally nameless. Its
row is therefore **titled from the page it is paired to** (`The coat on the train — plan`).
The pairing is 1:1, so the page's name is a *true* name for it, not a guess — and it
spares the writer the naming step the minimum-setup law forbids. PB1's "no row until it
has a box" does not bind here: the plan board is known by **pointer**, not by scanning a
drawer for boards, so it is not the duplicate-empty-board source that rule exists to
suppress.

**PW11 · THE HOST MOVES, THE MECHANISM DOES NOT — item 117 amended.** 117's "Tools Menu"
and C5's "Tools drawer" yield to the cascade: R13.iv leaves boards with no Tools sliver,
so the geography would vanish exactly where switching matters most (G6), and a list of
other boards is geography, not an act on this surface (G8). Thumbnails, the second level,
the shared popup and free identity are preserved **verbatim**; only the host changes.
*The placement clause amends; the substance does not.*

**PW12 · NO NEW NAME.** The rail's **Shelf** already means loose, unfiled documents.
C5's "the Shelf" would be a second shelf on day one. The feature is simply **what the
Plan tab shows**. One fewer word to learn.

**PW13 · THE PLAN TAB IS SURFACE-AWARE — AND THAT COMPLETES R13.iv.** On a **page**, Plan
lists this page's boards (PW2). On a **board**, Plan carries the board's own acts —
`＋ New card` · `Import file` · `From a deck…` · the connections-footer toggle, and BD1's
Fit to content whenever item 78 builds it. **One form, two contents — G2 exactly.**
This is not new scope; it is the missing half of a ruling already made. R13.iv removed the
Tools sliver from boards; the menus build **deliberately deferred it** because the acts
had nowhere to go, and the build report asked for precisely this pairing:

> *"R13.iv should land in ONE ticket together with the Plan face's `＋ New card`,
> `New page card`, `Existing page…`, `From a deck…` and the connections-footer toggle —
> the absence and the new home in the same commit."*
> — `docs/menus/build-report-2026-08-04.md` §3, finding 5

**The arc supplies the new home.** Named here so the sequencing is Nick's to see, not a
surprise discovered at build time. *(`Existing page…` is already served by the board's
Page drawer as `Place page on board` — R13.ii, built — so it does not need a second
door here; `New page card` is dead by item 118(f).)*

**PW14 · A PLAN BOARD IS BORN EMPTY, AND THAT IS RIGHT.** `getOrCreatePlanBoard` mints
`boxes: []` **[built]** — the page is **paired** to its plan board, never pinned onto it.
Sustained on principle, not merely inherited: a card would be the same truth twice (the
pairing *is* the relation, and the two doors already say so — CA4's own reasoning for why
a links list has no place beside threads), and a canvas that arrives pre-furnished is
arrangement the writer did not author (A16; BD7).

---

## §THE ARITHMETIC — the law's own test

The governing law: *"If a mockup needs more than three actions to get from a page to a
linked card and back, it has failed the law."*

| journey | out | back | total |
|---|---|---|---|
| Page → linked card, first visit (PW2–PW5) | **3** — `Plan` · board · card | **1** — Close/Esc; the caret never moved | **4** |
| Page → linked card, later visits (PW7 sticky) | **2** — `Plan` · card | **1** | **3** |
| Page → linked **page** via a page-pin | **3** | **1** — the marked row (PW6) | **4** |
| Make the relation (Page tab → checkbox) | **2** | — | **2** |
| Unplanned page → its own board and back | **1** — `Plan →` | **1** — `Page →` | **2** |
| *Today, on `main`, for comparison* | *4 — `Plan` · `Open…` · board · card* | *0 — no return path exists from a cascade travel* | *— * |

**PW-Q1 IS THE FIRST QUESTION FOR NICK:** does "three actions … and back" mean **three
out, with a return that must not be a new journey** (this design: 3 + 1, and 2 + 1 after
the first visit), or **three for the entire round trip** (which PW7's stickiness reaches
on every visit but the first)? The counts are given openly either way; his reading binds
and this desk will not quietly pick the flattering one.

---

## §OPEN — FOR NICK, NOT ANSWERED HERE

**Q1 · The arithmetic above.** Which reading of the three-action law binds?
**Q2 · The heading's words.** `THIS PAGE'S BOARDS` (default) or `BOARDS THIS PAGE IS ON`?
**Q3 · One press or double-click in the rail?** Default **one press** (A5), departing
from item 117's word by name; double-click stays the canvas's gesture.
**Q4 · Cards, or linked pages only?** Nick's sentence said *"a dropdown of its linked
Pages"*; 117's charter said *"every card/doc."* Default **IN — all cards** (the superset;
a page-pin card *is* a linked page, and free cards are what a writer most often reaches
for mid-scene). One word narrows it to page-pins.
**Q5 · PW6's build weight.** Persist the cascade across travel (preferred), the honest
return chip (cheap), or both?
**Q6 · PW7 stickiness — in or out?**
**Q7 · PW8's ownership.** Does the crumb restoration ride this arc, or route to item 96?
**Q8 · PW12.** Does "the Shelf" keep its ratified name, or does the Plan tab simply *be*
the shelf, with no new word at all?
**Q9 · PW13's sequencing.** Does the board's Plan face ride this arc (and carry R13.iv's
sliver removal in the same commit, as the build report asked), or stay a separate ticket
this pass merely names a home for?

---

## §HANDOFF — for the courier

These four files are written into the **primary checkout** (`C:\Users\nickh\writer-studio`)
as **untracked docs**, the same way `item83-ink-pass.md` and `item121-ink-build-brief.md`
are sitting there now. They are `docs/` only — outside the build path — and this desk
committed nothing and touched no branch.

**Two standing laws apply to whoever moves next, and they are named here so they are not
discovered at the wrong moment:**
1. **`railway up` uploads the WORKING DIRECTORY.** Before any ship from this checkout,
   `git status --porcelain` must be empty or every stray explicitly enumerated and
   authorised in the manifest. These four are strays until committed.
2. **Records branch from `origin/main`, never from local `main`.** If Nick lands these,
   they land the S0-push way.

---

## §THE MOCKUPS — three journeys, stepped, each step a real screen

Committed beside this pass, Plateau tokens only, both reference widths, every step naming
the action the writer takes and carrying a running press count:

- **`pw-journey-a-return-trip.html`** — the Westeros spine. Page → Plan → Stark → card
  (opens over the page) → Close. Then the same lap via a page-pin, proving the return
  (PW6). Then the second visit, proving PW7.
- **`pw-journey-b-the-making.html`** — a relation made by one natural act, from both
  ends, becoming geography with no further step. Proves the minimum-setup law and PW9.
- **`pw-journey-c-cold-start.html`** — a page with no project, no board, no plan. One
  door mints its board — **empty** (PW14, rendered honestly rather than prettied) — and
  one door brings the writer back. Carries PW13 on step 4 and PW8's never-empty crumb
  throughout. Proves *no setup, no learning curve*, and answers "where is it stored" in a
  place that is always the same.

**FOR THE WALK:** on journey A step 2, say aloud what pressing `Stark` will do — the
panel passes only if the sentence comes out as *go*. On step 4, notice whether the card
arriving over the page feels like a switch or like a hand. On journey C, count how many
decisions you were asked to make before a board existed. The answer should be zero.

— The PLAN desk, 2026-09-07. **Nothing locks. Nick's word alone.**
