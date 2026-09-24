# ITEM 144 — THE TAB BAR AFTER THE VIEWS RETIRE
### PLAN desk · 2026-09-19 · **amendment to `b144-board-tabs-build-brief.md`** (merged at `d87a230`)

> **⚠ AMENDED 2026-09-24 — `b144-plus-menu-and-unnest-amendment.md`** (Nick's words on BT-Q1/Q2/Q3: a bare "＋" with Add Board / New Board, Unlink on each nested tab, un-nesting by drag, double-click replaces the parent with a back arrow). **Where this file's "＋ BOARD" / connect-list / double-click / "not in this brief: disconnecting" lines disagree, that file governs (its §8 lists them). Kept as written below.**

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `d87a230`. Line numbers are a courtesy.

**Fable, to PW:** *"Nick scrapped the board views, so the tabs retire, and your Q3 table is the only
record of what dies with them … PLAN DESK designs the replacement (a tab bar, with "+ BOARD" creating a
nested board); your table tells it what must be re-homed."*

---

## §0 · THE CONFLICT THIS WAS WRITTEN UNDER — RESOLVED, AND KEPT FOR THE RECORD

**As written, two relays in one message disagreed:** this desk was told *"172-Q1 GOES TO NICK, with both
cases as you framed them"*, while the relay to PW said *"Nick scrapped the board views, so the tabs
retire."* **The ledger at `d87a230` recorded neither.** **This desk refused to read a ruling out of a
relay addressed to another lane, and wrote the amendment to be inert until the record carried it.**

**✅ RESOLVED — and the fault was named by Fable, not by this desk:** *"The fault was Fable's — the block
to chat 1 named Nick's message and carried a placeholder instead, so the ruling never entered the record
while Fable spoke of it as settled."* **Registered as practice: a desk does not read a ruling out of a
relay addressed to another lane.**

**✅ AND THE RECORD NOW CARRIES IT (`802a86e`): *"THE FOUNDER SCRAPPED BOARD VIEWS — 172-Q1 DISSOLVED, 164
CLOSED."*** **So this amendment is LIVE in shape.** **With one condition on its detail, from chat 1's own
entry:** the ruling is recorded as **FABLE's READING, the verbatim PENDING** — *"PLAN DESK should not
design from a summary of a founder message; it needs the verbatim."* **So §1–§4 stand (they follow from
the retirement itself, which is now recorded), and §5's newly relayed tab content is RECORDED, NOT
DESIGNED TO, until his words arrive.**

**⚠ AND THE DISSOLUTION IS NOT PROPOSAL A.** *"Neither Reading A nor Reading B"* — a writer creates the
KIND of board they want and moves cards between boards. **Item 172's pass keeps both readings as
superseded text, and §1 below retires the views without inheriting A's claim that Storyboard and Outline
become types.** *(What becomes of the built projections is the builders' question when the verbatim
arrives — chat 1 names it and does not assume it, and neither does this desk.)*

---

## §1 · WHAT RETIRES, AND WHAT DOES NOT

| retires | stays |
|---|---|
| the **mode strip** (`.board-mode-strip`, `role="tablist"`, `boardModeTabs`, `data-board-mode-tab`) | **`StoryboardProjection` and `OutlineProjection` — their FATE IS OPEN.** *Under the superseded reading A they became the type's renderers; under "scrap the views" chat 1 names it plainly: what becomes of that built code is the builders' question when the verbatim arrives. **This amendment does not retire them and does not re-home them.*** |
| **`useBoardMode` / `wrizo-board-mode`** — *after* 172's migration has read it once (172 §2) | the **board tabs** (item 144), below the board, as Nick placed them |
| the **mode branches** in `beginningDoors` (§3) | the **tools dock**, which was never mode-gated |

**Item 164's probe is moot under the retirement** — there is no remembered view to land on. *(Recorded in
172's pass: 164 dissolves under (A) only.)*

## §2 · THE REPLACEMENT — the board tabs are the board's only tab bar

**They do not move.** Nick placed them *"below the Board but attached to it"*, and the merged brief builds
them there. **What changes is that nothing else on the board calls itself a tab.**
- **The nav row's freed space takes a QUIET TYPE LABEL, not a switch** — *Book · Default · Storyboard* —
  so a writer can see what a board is where they used to change what it looked like. **And it stays a
  label: `802a86e` records "TYPES CANNOT CHANGE AFTER BIRTH"** (Fable's reading, verbatim pending). *A
  board is what it was made as, so the place that used to change a board's look has nothing to change.*
- **The row's accessible role stays `navigation`, never `tablist`** — *the merged brief's rule was written
  to avoid collision with the mode strip, and it survives the mode strip: a tab bar of doors is not a
  tablist of panels.*
- **"＋ BOARD"** — Fable's own wording — **is the row-end control the merged brief already specifies**: it
  opens the connect list, whose first row is **＋ New board** (born in this drawer, **nested in this
  board**, name field focused). **Its accessible name states the direction**: *"Put a board inside
  Characters."* **(144C-Q2: is "＋ BOARD" the visible word?)**

## §3 · RE-HOMING WHAT THE MODES GATED — **the TYPE inherits the gate**

**The desk's read at `d87a230`** *(PW's 144 S0 table is the record; if it differs, disk wins)*: the
**empty-canvas beginnings row** is the only mode-gated door set —

| today's mode | its doors |
|---|---|
| **open** | New card · **New page card** · Load a deck · **Connect a page** |
| **storyboard** | Load a deck · **New lane** · New card |
| **outline** | New card · Load a deck |

**and the tools dock is NOT mode-gated** (Add card · New page card · Existing page… · From a deck… ·
Show connections).

> **THE RULE — RATIFIED (Fable, 2026-09-19) AND BANDED: A DOOR GATED BY A MODE BECOMES A DOOR GATED BY
> THE TYPE. A DOOR THAT WAS NEVER GATED STAYS UNGATED.**

| type | its beginnings row |
|---|---|
| **Default** | New card · New page card · Load a deck · Connect a page *(today's open set, unchanged)* |
| **Storyboard** | Load a deck · **New lane** · New card |
| **Outline** | New card · Load a deck |
| **Book** (172) | **New page** *first* — *adding makes a surface* — then New card, which lands **on the page you are on** |

**⚠ AND THE THING THAT LOOKS LIKE A LOSS IS NOT ONE, BECAUSE OF PW's NOTE.** Under this rule, a
Storyboard-type board's empty row has **no Connect a page and no New page card** — today a writer could
reach them by switching that board to Open. **They do not vanish: the tools dock carries both on every
board, ungated.** *So the beginnings row is a SUGGESTION for an empty surface; the dock is the DOOR.*
**Recorded because it is exactly the kind of quiet narrowing a retirement causes**, and because it is the
one place PW's table changes what a writer can do rather than where they do it. **Fable, ratifying it:**
*"the kind of narrowing that should be flagged even when it turns out not to be one."*

**⚠ PW's S0 NAMES THE SAME HAZARD IN ITS OWN WORDS** (`802a86e`): *"`connectPage` (the nest door) and
`newPageCard` exist ONLY in the OPEN branch; `newLane` only in Storyboard; and the sliver's copy of the
picker is NOT mode-gated. Retiring the view tabs retires two doors and leaves a third standing unless each
is deliberately RE-HOMED."* **"＋ BOARD" replaces the nest half of `connectPage`; §3's table homes the
rest.** *(`connectPage` is one door doing two jobs — a page door and a board door — which is item 176's
subject: the picker must say what it offers.)*

## §4 · THE CHECKS THIS AMENDS — parks, never edits

- **The merged brief's S2 check 10** — *"exactly one `role="tablist"` on the board, and it is the mode
  strip"* — **INVERTS.** **Park it verbatim with its successor named:** *no mode tablist exists; the board
  tabs are a `navigation`, and no element on the board claims `tablist`.*
- **Every harness that selects `data-board-mode-tab`** parks with it. **Audit the park COUNT against the
  sweep's claim.**
- **NEW:** the beginnings row **by type** (§3's table, by name, never by index) · **the type label renders
  and is not a control** (until 144C-Q1) · **the tools dock is identical on every type** (the check that
  proves §3's "not a loss").

## §5 · RE-READ AGAINST THE VERBATIM — `55cf81c`, Nick's own words (part 2)

**The verbatim landed, so this section is no longer "awaiting" anything.** His text:

> *"…let's replace the current views tabs with the multi-board tabs that we've already discussed. So the
> name of the current board should be one tab with the option next to it to "+ BOARD" that creates a
> nested Board. All other nested or connected boards should also be tabbed with their title (very small
> underneath the title). … Lastly, the final tab in the list should be a "Go Back" option if the User
> arrived at the board from a page or another board. If the user didn't come to the board from a page,
> then that tab should give them the option to make a "New Page" that will be automatically connected to
> the board."*

### (1) THE FINAL TAB IS AN EXIT — SR-Q1 STANDS (Fable, ruled)
**SR-Q1 — *a tab is only ever a door to a board* — is NOT superseded.** **The final item is the bar's
TERMINAL CONTROL: an EXIT, not a destination.**
- **It sits where his text puts it — last, in the row** — **and it is set apart so it never reads as a
  peer of the board tabs:** after a hairline gap, **no tab silhouette**, a leading glyph, and **it never
  carries the olive where-you-are marker.**
- **It is not `data-board-tab`**, so the row's stability check and its select-by-name both skip it. *A
  control that leaves the row is not a member of the row.*
- **⚠ His word for it is "tab", and this design gives it a different shape by Fable's ruling.** *If his
  intent is that it look like the other tabs, that is his to say and SR-Q1 bends rather than the text.*
  **That sentence goes in front of him WITH THE MOCKUP** (`board-tabs-mock.html`, re-drawn 2026-09-20):
  the exit is drawn there, set apart, with both faces live — **so he rules on a picture, not a paragraph.**

### (2) ⚠ DIFFERENCE 4 — THE TWO CONDITIONS ARE NOT COMPLEMENTS, and the reload makes it worse
**Go Back:** *"if the User arrived at the board from a page or another board."* **New Page:** *"If the
user didn't come to the board from a page."* **A writer who arrived FROM ANOTHER BOARD satisfies both.**
**Chat 1's lean, which this desk shares: Go Back for either origin; New Page only when there is none** —
*one rule, one face at a time.*
**AND A FACT NEITHER READING HAS:** the origin lives in **route state** (`fromBoardId` / `fromBoardTitle`,
staged by `travelToEntry` and `travelFromCascade`) — **which `BoardEditor` never reads today**, and
**which does not survive a reload.** **So after a refresh the exit flips to "New Page" on a board the
writer did arrive at.** *Options, handed up: accept it (the exit is about the journey, and a reload ends
the journey); or persist the last origin per board, client-local, and keep "Go Back" across a refresh.*

> **✅ RATIFIED (Fable, 2026-09-19) — ACCEPT IT: A GO BACK THAT OUTLIVES THE GOING BACK IS A PROMISE THE
> APP CANNOT KEEP.**
> **And this is why, so nobody later "fixes" it:** a persisted origin would survive the journey it
> describes, and then **point somewhere the writer did not come from** — wrong in a different direction,
> and harder to see. **The exit shows "New Page" after a reload because there is no journey left to end.**
> *A builder who finds this surprising is meeting the design, not a defect.*

### (3) DIFFERENCE 3 — "very small underneath the title": **THE ROW ALREADY HAS EXACTLY ONE**
**The merged brief renders a very small second line under a tab's name: the LOCATION LINE** — *"in
Research"* — **item 163's caption form, the same words the Plan row uses.** *Chat 1 read his parenthesis
as "something very small underneath the title"; this desk had read it as a title under something. On the
first reading, the thing he asks for is already designed and already ruled.*
**So: the small line under the title is the board's LOCATION**, and it renders **only when the board lives
somewhere else** (the merged rule). **If he meant a tag, or the relation (*inside this board*), his words
do not say so** — *and both are one line's work once he does.*

### (4) "+ BOARD" — his words put it NEXT TO THE CURRENT BOARD's TAB, not at the row's end
*(Drawn in the mock: press a few tabs and the control follows the one you are on.)*
**The merged brief put the ＋ at the row's END** (a browser's new-tab button). **His text: *"the name of
the current board should be one tab with the option next to it to '+ BOARD'."***
**THIS DESK TAKES HIS PLACEMENT, and it turns out to be the better one:** **"＋ BOARD" travels with the
CURRENT tab, wherever that tab sits in the row** — *because the act is "put a board inside THIS board",
and a control that acts on the current board belongs beside it.* **The row's order is untouched, so
stability survives** (BT-Q1's lean, still open).
**The rival, named:** a ＋ fixed at the row's end never moves, which is easier to hit by habit — but it
says nothing about which board it nests into, and on a long scrolling row it can be off-screen while its
subject is in view.

### (5) WHAT ELSE HIS TEXT SETTLES FOR THIS ROW
- ***"replace the current views tabs with the multi-board tabs"*** — **the retirement is his own word**, and
  §1–§4 stand on it rather than on a reading.
- ***"(Journals should display differently … already displayed as the Page surface)"*** — **a Book-type
  board shows its page, as item 172's pass has it.** *Whether a Journal carries the tab bar at all is a
  question this desk hands up: the row is a door between boards, and a Journal is a board.*

## §Q
- **144C-Q1 — ANSWERED by `802a86e`** (*"types cannot change after birth"*): the nav row's type label is
  **a label**. *Kept here because the question was asked; it needs no ruling unless the verbatim differs.*
- **144C-Q2 — the word:** **"＋ BOARD"** on the control (Fable's wording), or the quieter **"＋"** the merged
  brief drew, with the direction in its accessible name?
- **⭐ THE ONE FROM §0 IS ANSWERED**, and **the verbatim has landed** (`55cf81c`): §5 is a re-read, not a
  wait. **What is still open there:** difference 4's overlap (Nick's), whether the small line under a tab
  is the location line (this desk's reading, §5(3)), and whether a Journal carries the row at all.
