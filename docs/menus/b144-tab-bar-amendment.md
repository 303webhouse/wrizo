# ITEM 144 — THE TAB BAR AFTER THE VIEWS RETIRE
### PLAN desk · 2026-09-19 · **amendment to `b144-board-tabs-build-brief.md`** (merged at `d87a230`)

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

## §5 · AWAITING THE VERBATIM — what arrived at `802a86e` as FABLE's READING, recorded not designed

**Item 144 was amended again in that record.** **This desk does not design from it yet** — chat 1's own
instruction — **but it is written down here so nothing is lost, and so the two places it collides with
what is already designed are visible before anyone builds:**

> *"The current board is a tab, and "+ BOARD" beside it creates a NESTED board. Connected and nested
> boards are tabs with their title very small underneath. The last tab is "Go Back" when the writer
> arrived from a page or board, and "New Page" (auto-connected to the board) when they did not."*

- **The current board as a tab and "＋ BOARD" creating a nested board are already this design** (the merged
  brief's stable row and its ＋ door). **No collision.**
- **⚠ "tabs with their title very small underneath" collides with the merged brief's tab**, which is a
  **word, deliberately** — *"thumbnails are the Plan menu's inventory; a tab is a door, and a door is a
  word."* **A title UNDERNEATH implies something above it** (a thumbnail? the board's face?). **The
  verbatim decides what a tab shows; the row's order, stability and door are unaffected either way.**
- **⚠ A CONTEXTUAL LAST TAB — "Go Back" or "New Page" — is new**, and it is **not a board**: the merged
  brief's rule is that **a tab is only ever a door to a board** (SR-Q1's ruling). *A tab that goes back,
  and a tab that makes a page, are two more kinds of act in a row whose whole promise is that every tab
  does the same thing.* **Handed up rather than reconciled from a summary.**

## §Q
- **144C-Q1 — ANSWERED by `802a86e`** (*"types cannot change after birth"*): the nav row's type label is
  **a label**. *Kept here because the question was asked; it needs no ruling unless the verbatim differs.*
- **144C-Q2 — the word:** **"＋ BOARD"** on the control (Fable's wording), or the quieter **"＋"** the merged
  brief drew, with the direction in its accessible name?
- **⭐ THE ONE FROM §0 IS ANSWERED:** the record carries the dissolution (`802a86e`). **What is still owed
  is his VERBATIM**, which §5's three items wait on.
