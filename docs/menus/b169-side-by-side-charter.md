# ITEM 169 — BOARDS SIDE-BY-SIDE
### PLAN desk · 2026-09-19 · **charter — the questions, before any mockup** · a new capability

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4600d7f`. Line numbers are a courtesy.

**THE PRIMARY TEXT — Nick, verbatim (Batch Three sitting, point 2, 2026-09-19):**
> *"…Ideally, all connected boards are listed as tabs that a user can move back and forth between with a
> single click from the Board UI (not only from the Plan menu), **and Boards should be able to be opened
> side-by-side.**"*

**Fable's four questions:** *how many, how they split the stage, what the strip does, whether a card can
drag between them.* **This charter answers none of them. It sets them up so that Nick's answers can be
built, and it adds the questions the history makes necessary.**

> **⚠ AMENDED 2026-09-24 — `b144-plus-menu-and-unnest-amendment.md` §5/§7.** **169-Q2 is ANSWERED by his words: two boards visible on laptops/tablets, three on desktops (supersedes "up to four"), the boundary set by measurement.** **169-Q1 was already answered** (board beside board; see the note at 169-Q6). **Both struck from the open list; the questions below are kept as written.**

---

## §0 · ⚠ THIS IS THE THIRD TIME SIDE-BY-SIDE HAS BEEN ASKED FOR — AND IT HAS MEANT TWO THINGS

**2026-07-21, the Board Modes second pass** — Nick's proposal *"making each page 'a kind of project' with
two faces, switchable and **eventually side-by-side**,"* and the Novice: *"sometimes I want the map open
beside the page."* **That was a PAGE BESIDE ITS BOARD.** The pass laddered it as **BM4 — "a genuine
layout-engine ticket: two live surfaces, the Tutor's room, FX2's clearance law all renegotiated — real
design, not a checkbox"**; BM1 then held it as **BM2, "queued for its own brief after BM1's review."**
**That brief was never written.**

**2026-09-19 — "Boards should be able to be opened side-by-side."** In a sentence about **board tabs**, the
natural reading is **A BOARD BESIDE A BOARD.** That is how Fable charters it.

**THE FIRST QUESTION IS WHICH (169-Q1).** *They share one engine — two live surfaces on one stage — and
building board-beside-board without deciding whether page-beside-board rides the same engine would be
building BM4 twice.*

## §1 · WHAT EXISTS — the constraints any answer inherits
- **A board IS the route** (`/page/<id>`; `BoardEditor` remounts per board, `key={id}`). **There is no notion
  of two current boards.** *Two panes means two subjects for everything that reads "the current board":*
  the crumb, the rail's Plan panel, the Counsel, the tabs (144), the tag filter (108), Undo.
- **The canvas is AUTO-FIT** — every card's geometry is a fraction of the canvas's own width
  (`pageWidthPx = canvasOverrideW ?? containerWidthPx`). **Halve the width, halve every card.**
- **The board's column is capped** at `min(100%, 1100px)`, **and its height is measured to the stage's
  bottom** (the room law). **Both are single-pane assumptions.**
- **Item 166** (no pop-out overlaps the page) and **item 144** (the tabs, attached below the board) **both
  land first**, and both change what "the board's edge" means.
- **Item 123 (card transfer) is COPY-ONLY**, with provenance (`copiedFromBoardId`). *A drag between two
  boards is a transfer, so it inherits 123's semantics unless Nick rules otherwise.*

---

## §2 · THE QUESTIONS

**169-Q1 · WHAT GOES BESIDE WHAT.** **(a)** a board beside a board · **(b)** a page beside its board (BM4)
· **(c)** any two — the engine is the same. *The desk's lean is to build the engine for (c) and open it for
(a) first — **but that is a sequencing call, and it is handed up, not made.***

**169-Q2 · HOW MANY.** **Two.** *Stated as a lean, not a ruling: at 1366 a third pane leaves each board under
~400px — below the width at which a card's words are readable at the auto-fit scale.* **Three is a question
only if Nick names a use for it.**

**169-Q3 · HOW THE STAGE SPLITS.** Equal halves · **a divider the writer can drag** · remembered per pair?
**What happens below the width where two boards fit** — does side-by-side become **unavailable (absent)**,
**or does one pane collapse to its tab?** *(And 166's law holds per pane — a pop-out may not cover either
page.)*

**169-Q4 · WHICH ONE IS "HERE".** **One pane is active at a time**; everything that reads "the current board"
— **the crumb, the Plan panel, the Counsel, the tag filter, Undo** — **follows the active pane.** The
where-you-are marker (**olive**) marks it. **A press on a pane makes it active.** *The rival — every pane
carrying its own crumb and panel — doubles the chrome and halves the stage again.*

**169-Q5 · THE STRIP.** **ONE rail**, serving the active pane (lean — the rail is the app's, not the board's)
— or one per pane? **And the TABS (144):** **one row per pane** (each board's row attached below it, as
Nick's words place it) — **and a tab press switches THAT pane only.**

**169-Q6 · HOW A PAIR IS OPENED.** Candidates: **drag a tab to the stage's edge** (item 144 **reserved the
tab's drag for this**) · a press-and-choose on a tab · **"Open beside"** in a board row's `⋯` (the Plan
panel, the survey) · a board-card on the canvas. **And how it closes** — a close on the pane; dragging its
tab back into the row.

> **⛔ HELD, 2026-09-19 (Fable): NOBODY DESIGNS OR BUILDS A MOVE UNTIL NICK RULES.** His verbatim
> (`55cf81c`) says *"Cards/docs/pages/etc. should be movable back and forth between boards"* — **which
> REVERSES item 123's copy-only-with-provenance**, the rule PW2's whitelist was built around. **The
> collision is with Nick. Q7 stands exactly as written below**, and the rest of this charter is
> unaffected. *(Item 169's other rulings from the same text — four boards, strip menus vanishing at more
> than one, Book boards never concurrent — are released and answer Q1, Q2 and Q10.)*

> **CHAT 1's TWO NOTES — CONFIRMED BY THIS DESK, each with one addition:**
> **(1) The retirement stands either way.** His own sentence scraps the views; **the move is the
> SUBSTITUTE he offers in their place**, so holding the move un-scraps nothing. **ADDITION: the hold has a
> visible cost while it lasts.** With copy-only, a writer who wants their cards on a different kind of
> board gets **a copy, and the original stays behind** — *which is not what he described.* **Recorded so
> the interim is not mistaken for the design.**
> **(2) A page is not a card.** A page's board relation is **membership** (item 125) — it can sit on
> several boards — so "moving" a page is **an unpin plus a pin** and contradicts nothing; **item 144's
> connect door and 165's Connect Board already express it.** **ADDITION: a nested BOARD is the same
> case**, its relation being membership too. **So the conflict is exactly: TEXT AND INK CARDS — content a
> board owns, with one home — and any imported file object (item 181) that will carry content the same
> way.**

**169-Q7 · ⚠ CAN A CARD DRAG BETWEEN THEM — and what does the drag MEAN.** **(a) COPY** (item 123's only
transfer: the card stays, a copy arrives with its provenance) · **(b) MOVE** (the card leaves; one home) ·
**(c) for a PAGE CARD, a PIN** (the page gains a membership on the second board; both boards show it —
membership, not content). **Each kind of card may want a different answer**, and **item 168's drag to the
Trash shares the gesture** — a card dragged across the stage passes over the rail's foot. *This is the
question with the most consequences; it deserves its own ruling before any mockup draws an arrow.*

**169-Q7b · ⚠ AND NOW THE TWO PANES MAY BE DIFFERENT DISPLAYS (item 172).** A **Book** beside a **Default**
is the likeliest pair a writer will want — *the chapter open beside the table of its cards* — and it is
also where Q7 bites hardest: **a card dragged from a table top onto a Book's page lands ON THAT PAGE**
(172 §3), which is a different destination from "somewhere on that board". **Whatever Q7 rules, it rules
for both.**

**169-Q8 · THE SAME BOARD TWICE · A BOARD AND ITS OWN CHILD.** The same board beside itself: **absent**
(nonsense). **A parent beside its child** — the overview beside the detail: **allowed?** *(It is likely the
most useful pair.)*

**169-Q9 · DOES THE PAIR SURVIVE A RELOAD** — remembered, client-local, the way a board's view is (BM1 S3)?

**169-Q10 · THE NARROW SHELL AND TOUCH.** Below 1100 there is no DeskFrame. **Side-by-side there is absent**
(lean), not squeezed.

---

## §3 · WHAT THIS IS NOT
- **Not a mockup** — none is drawn until 169-Q1, Q2 and Q7 are answered. *A picture of two boards would
  answer Q7 by drawing an arrow, and nobody should rule on that by looking at an arrow.*
- **Not the tabs** (144) — the tabs switch **one** pane; this adds a second.
- **Not multi-window** — two app windows are the operating system's; this is one stage.

## §4 · SEQUENCING
**After 144 and 166.** Both change the board's edge and the stage's margins, which are exactly what a split
renegotiates. **And BM4/BM2's page-beside-board — queued since 2026-07-21 with no brief — is either
absorbed here (169-Q1 (b) or (c)) or recorded as still queued.** *A queued item nobody names is a flag
carried in a conversation.*

## §Q · FOR NICK — the three that unlock a mockup
- **169-Q1** — a **board beside a board**, a **page beside its board** (your 2026-07-21 wish), or **both**?
- **169-Q2** — **two** at a time (lean), or more?
- **169-Q7** — when a card is dragged from one board to the other, does it **move**, **copy**, or — for a
  page's card — **appear on both**?
