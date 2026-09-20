# ITEM 144 — THE TAB BAR AFTER THE VIEWS RETIRE
### PLAN desk · 2026-09-19 · **amendment to `b144-board-tabs-build-brief.md`** (merged at `d87a230`)

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `d87a230`. Line numbers are a courtesy.

**Fable, to PW:** *"Nick scrapped the board views, so the tabs retire, and your Q3 table is the only
record of what dies with them … PLAN DESK designs the replacement (a tab bar, with "+ BOARD" creating a
nested board); your table tells it what must be re-homed."*

---

## ⚠ §0 · ONE THING IS HANDED UP BEFORE ANYTHING IS DESIGNED

**Two relays arrived in the same message and they do not agree:**
- **To this desk:** *"172-Q1 GOES TO NICK, with both cases as you framed them."*
- **To PW:** *"Nick scrapped the board views, so the tabs retire."*

**The ledger at `d87a230` records NEITHER as ruled** — it carries Fable's reading *"FLAGGED FOR NICK's
VETO"* and chat 1's conflict *"hands up one conflict, with a lean."*

**So this amendment is written to APPLY WHEN THE RETIREMENT IS RULED, and it is inert until then.**
**If Nick has already scrapped the views, this is the design; if 172-Q1 is still his, nothing here
happens** — *and the merged 144 brief's check that the mode strip is untouched stays correct in the
meantime.* **Whichever it is, it should be in the record once.**

---

## §1 · WHAT RETIRES, AND WHAT DOES NOT

| retires | stays |
|---|---|
| the **mode strip** (`.board-mode-strip`, `role="tablist"`, `boardModeTabs`, `data-board-mode-tab`) | **`StoryboardProjection` and `OutlineProjection`** — under 172(A) they become the **type's renderers**, unchanged in what they draw |
| **`useBoardMode` / `wrizo-board-mode`** — *after* 172's migration has read it once (172 §2) | the **board tabs** (item 144), below the board, as Nick placed them |
| the **mode branches** in `beginningDoors` (§3) | the **tools dock**, which was never mode-gated |

**Item 164's probe is moot under the retirement** — there is no remembered view to land on. *(Recorded in
172's pass: 164 dissolves under (A) only.)*

## §2 · THE REPLACEMENT — the board tabs are the board's only tab bar

**They do not move.** Nick placed them *"below the Board but attached to it"*, and the merged brief builds
them there. **What changes is that nothing else on the board calls itself a tab.**
- **The nav row's freed space takes a QUIET TYPE LABEL, not a switch** — *Book · Default · Storyboard* —
  so a writer can see what a board is where they used to change what it looked like. **If 172-Q2 makes a
  type changeable, that label is where the change lives; until he rules, it is a label** (144C-Q1).
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

> **THE RULE: A DOOR GATED BY A MODE BECOMES A DOOR GATED BY THE TYPE. A DOOR THAT WAS NEVER GATED STAYS
> UNGATED.**

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
one place PW's table changes what a writer can do rather than where they do it.

## §4 · THE CHECKS THIS AMENDS — parks, never edits

- **The merged brief's S2 check 10** — *"exactly one `role="tablist"` on the board, and it is the mode
  strip"* — **INVERTS.** **Park it verbatim with its successor named:** *no mode tablist exists; the board
  tabs are a `navigation`, and no element on the board claims `tablist`.*
- **Every harness that selects `data-board-mode-tab`** parks with it. **Audit the park COUNT against the
  sweep's claim.**
- **NEW:** the beginnings row **by type** (§3's table, by name, never by index) · **the type label renders
  and is not a control** (until 144C-Q1) · **the tools dock is identical on every type** (the check that
  proves §3's "not a loss").

## §Q
- **144C-Q1 — the nav row's type label:** a quiet label (lean), or the place a writer **changes** a board's
  type (which 172-Q2 must rule first)?
- **144C-Q2 — the word:** **"＋ BOARD"** on the control (Fable's wording), or the quieter **"＋"** the merged
  brief drew, with the direction in its accessible name?
- **⭐ AND THE ONE FROM §0:** **has Nick scrapped the views, or is 172-Q1 still with him?** *This desk will
  not read a ruling out of a relay to another lane.*
