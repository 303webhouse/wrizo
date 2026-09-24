# VW2 — SHELF AND TRASH AS ROWS (Nick's 3C), AND THE TRASH'S NEW VERBS
### PLAN desk · 2026-09-24 · **amendment to `vw2-shelf-trash-build-brief.md`** · reads with `vw4-empty-trash-build-brief.md`, `b168-rulings-and-item201-delete-permanently.md`, `b180-drawer-gesture-charter.md`

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `c14c79f`. Line numbers are a courtesy.
> **Nothing in VW2 or VW4 is rewritten in place** — §7 names what is superseded, kept as written.
> **VW2 is UNBUILT** *(no `ConditionView` in `apps/desktop/src`; Shelf and Trash are still boards on disk)* —
> so this is a change to a brief, not to a product. **That is why it is cheap, and why it is done now.**

---

## §0 · HIS WORDS, AND WHICH ONE GOVERNS

**Part 3C, 2026-09-22 (the latest on the display):**
> *"Look like, sort of, but perhaps arranged and displayed a bit differently. All the files/cards/pages/boards,
> etc. should be listed in rows, perhaps by date as the default, instead of displayed randomly as thumbnails on
> a board. All files should still have a thumbnail, the title, date, tags, and connected boards/drawers, all of
> which should be sortable options. And perhaps the Shelf and Trash could look a bit different to distinguish
> one as a scrap pile and the other as a waste bin (not literally, but aesthetically, somehow). Let's turn this
> over to the Architects to see what they can cook up."*

**Filed as (chat 1): READING (a) PREVAILS IN SUBSTANCE — rows, not arrangement.** *Shelf and Trash gain a LIST
VIEW; they do not gain the arrangement law's meaning.* **Item 131(a) and the arrangement law stand as
ratified** — *the Shelf is never shown as a board, and a surface you can move things on has become one.*
**Earlier, and superseded on the DISPLAY only — 3d (2026-09-19):** *"Shelf and Trash should be Default Boards that
just show thumbnails of every item in them."* **3C is later and names rows; 131(a) forbids the board reading.**
**Still in force from 3d:** *the Shelf needs an obvious option to put a Page or Board into a drawer, and the
thumbnail can be dragged to the Drawers rail icon* — **item 180's gesture, §4 below.**
**Nick, 2026-09-24:** *the Trash needs "Delete Permanently" per item and for the whole bin* — **item 201; VW4's
confirm, corrected in `b168-rulings-and-item201…` §9.**

---

## §1 · WHAT CHANGES IN VW2, AND WHAT DOES NOT

**Changes:** **S2's wrapping thumbnail grid → ROWS**; **S5's roster gains a third kind (cards, 168-Q2) and a
second verb (Delete Permanently, item 201)**; **S6 check 2 (the arrangement law as absence) is re-cut** (§5).
**Does not change:** **one `ConditionView`, two mountings (S1)** · **storage and `reconcileSystemBoard` untouched,
zero schema** · **the arrangement law** · **the two orders and why they differ (S4: Shelf = day written, Trash =
when deleted)** · **the flip posture and its foot instrument (S3)** · **hands: Shelf 2, Trash 0 (in the flip)** ·
**Restore names its destination (TV1)** · **absent, never disabled**.

## §2 · THE ROW

**A list, never a canvas — and now a TABLE:** real table semantics (`role="table"`, column headers with
`aria-sort`), **rows in one column of the view, nothing positioned from data.**

| column | what it shows | sort |
|---|---|---|
| **thumbnail** | **BOARDS ARE WIDE · PAGES ARE TALL · A CARD WEARS ITS OWN PROPORTION** *(the law, unchanged)*, **aspect-locked, scaled to a fixed row height** | — |
| **title** | the item's name (item 136's model; a card's is item 167's *"Card N"* stand-in) | **A–Z**, case-insensitive |
| **date** | **Shelf: "Written"** (`createdAt`) · **Trash: "Deleted"** (`deletedAt`) — **the header names the date it is** | **newest first** (each view's default, S4) |
| **tags** | the item's tags | **GROUPS** (below) — **column ABSENT until item 108 builds** |
| **connected boards / drawer** | **the boards it sits on** and **its drawer** ("Loose" when none) | **GROUPS by board; SORTS by drawer** |

- **Default order = each view's own S4 order**, which *is* his "perhaps by date": **Shelf by day written, Trash by
  when deleted, newest first.** **A column header re-sorts; the choice is remembered per view (client-local, as
  the posture is).** **A sort is a DISPLAY option — it writes nothing and moves nothing.**
- **THE GROUPING LAW applies to the two multi-valued columns** *(ratified at 177; applied three times):* **a
  multi-valued key GROUPS rather than sorts — an item appears under EVERY value it carries, and the group prints
  its own arithmetic.** **Sorting by Tags or by Board therefore yields groups, and a page on two boards appears
  twice, once under each.** *(A single-valued key — title, date, drawer — sorts.)* **This is not an ambient count:**
  the arithmetic is the group's own heading, *asked for by choosing that sort* — **the same footing as 177's.**
- **The tags column waits for 108** *(absent, never disabled — "ship now, tags later," BT-Q2's own precedent, and 108
  owns tag rendering: one vocabulary, one set of tokens, never a second).*
- **What a row's thumbnail is today:** *CSS swatches with an excerpt, `SurveyItem.image` never set* (165 §1). **This
  amendment does not require a rendered page thumbnail** — **a real one is a build of its own, named, not
  assumed.**
- **Narrow widths:** **columns FOLD under the title as a second line** *(tags, then connected boards)* rather than
  disappear — **a writer must always be able to see where a deleted thing will go** (TV1).
- **No ambient count** anywhere in the view — the no-count law (A14/A18) is unchanged; **its one exception is
  INSIDE a destructive confirmation** (VW4 S2) **and the group headings above, which are chosen, not ambient.**

### ⚖ SECTIONED OR ONE LIST — HANDED UP, BOTH FROM HIS WORDS
**His 2026-09-13 words (ruled): *"group them together but section off Boards from Pages clearly."*** **3C says
*"All the files/cards/pages/boards, etc. should be listed in rows, perhaps by date."*** **They pull apart:** the first
sections by kind; the second reads as one list.
- **LEAN: KEEP THE SECTIONS — Pages · Boards · Cards (Cards only in the Trash) — each a table sorted by the chosen
  column.** *3C did not revoke the 09-13 ruling, and it names the thing he objected to — "displayed randomly as
  thumbnails on a board"; sections in rows answer it. **A "Kind" sort is not needed, because kind is the section.***
- **THE RIVAL, IN ITS STRONGEST FORM — ONE MIXED LIST by date, kind shown by the thumbnail's SHAPE and a Kind
  column:** *it is his most recent sentence read literally; and "everything I deleted this week" is one scan, not
  three.* **Its cost:** *it gives up "section off … clearly", which he asked for by name, and shape alone teaches
  kind but does not say where a kind ends.* **The unmeasured risk sits on the lean:** *nobody has measured whether he
  meant 3C's list to replace the sections.* **One yes/no to Nick; the default stands until he speaks.**

## §3 · THE ROW'S ACTS

- **Shelf row:** **press = open** *(the flip posture, S3)* · **"Put in a drawer…"** *(item 180's obvious option; its
  wording is 180-Q2 — still open)* · **the row is a drag SOURCE** *(180: drag to the Drawers rail icon)*.
- **Trash row:** **`Restore to Novel`** / **`Restore — its drawer is gone; goes Loose`** *(TV1: the destination named
  BEFORE the press, in the row)* · **`Delete Permanently`** *(item 201)* — **both in the row's action zone, Restore
  first, Delete Permanently apart from it (a gap, and its own register: the destructive colour appears only
  inside its confirm, VW4 S1).* **Press = open read-only** *(the flip; Trash items carry no hands).*
- **The bin's control** — **"Delete Permanently" (his word; VW4's "Empty" is the rival — `b168…` §9)** — **in the
  view's FOOT, beside the posture instrument (Rows | Flip),** **absent when the Trash is empty (VW4 S3).**
- **Confirms are IN PLACE** *(VW4 S1: never a modal, never a surface switch)*: **a row's confirm replaces that row's
  actions; the bin's replaces the foot control.** **Cancel is the default focus; Enter never confirms.**

## §4 · WHAT ELSE THE ROWS MEET

- **Cards in the Trash (168-Q2 — ruled).** **A trashed card is a row in the "Cards" section:** **thumbnail = its own
  proportion; title = item 167's *"Card N"* (or its first words for an old card); connected-boards column =
  *"From Characters"*; Restore names its board** (*"Restore to Characters"*, VW2's TV1 extended). **A card whose
  board is itself trashed or purged reads *"Restore — its board is gone"* and the row offers no Restore** *(nothing
  to restore it to — 168 §3(c): a membership outlives a deletion, a purge ends it).* **Blocked on 168-F1** (`Box.deletedAt`
  changes what a board's `boxes` means for every reader) — *the section renders nothing until it lands.*
- **Item 180 — the Shelf's drag and its obvious door.** *3d asks for both.* **Rows are the natural host** (a row is
  one thing to grab). **180-Q1 (touch and pen have no right-click to cancel) is still with nobody** — **so the
  drag ships with Escape as its cancel, and touch gets the "Put in a drawer…" door only until 180-Q1 is
  answered.** *(Handed up in the triage, not resolved here.)*
- **Item 201.** **A permanently deleted item leaves the Trash at once** (its tombstone hides everywhere); **the
  view lists nothing purged.**
- **Item 108 (tags)** — the column, above. **Item 172** — *Shelf and Trash are not board types; the 172-Q4 question
  is struck (his 3d + 3C).*
- **The two-hand strips in the ROWS posture:** **none** — *rows are a list, not a writing surface; hands belong to
  the flip.* **The hands' counts (Shelf 2 / Trash 0) are asserted in the FLIP only.**

## §5 · "A SCRAP PILE AND A WASTE BIN — NOT LITERALLY, BUT AESTHETICALLY" — A PROPOSAL, NEEDS A PICTURE

**Constraints, all standing:** *no new colour* (the Plateau ember ceiling; **shape and texture do the work**, as
S2 did for kind) · **no literal pile or bin icon** (his "not literally") · **nothing that reads as arrangement**
(no jitter, rotation, overlap or "casually stacked" offsets — **they would fake the very thing the law forbids**).
**Proposal (this desk's, unmeasured):**
- **Shelf = an OPEN LEDGE.** Rows sit on **hairline "shelf" rules**, **generous spacing**, **full-strength
  thumbnails**, **no enclosing frame** — *a place things are set down, still yours, still in the book.*
- **Trash = a RECESSED WELL.** The whole list sits **inside an inset, lipped panel** (an inner edge at the top, rows
  packed tighter), **thumbnails muted** (reduced contrast, not colour), **the row's date in the "Deleted" register** —
  *a place things fell out of the book.* **Muting is a state, not a colour: it is off in the flip, where a deleted
  page is being read.**
- **The unmeasured risk, named:** *two treatments that look different in one static frame can fail to read as
  "pile" and "bin" at all, or read as "the Trash looks broken/disabled".* **The muted thumbnails are the
  riskiest part — muted reads as "unavailable", and Trash rows are the most actionable rows in the app.**
  **This is a "needs a picture to decide": Fable draws two static frames (the pencil is down); the two
  `item134-mock-shelf-thumbnail.html` / `item134-mock-trash.html` mocks pre-date 3C and show thumbnails, not rows.**

## §6 · THE HARNESS — `vw2.mjs`, re-cut (drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name · **park, never edit; audit the park COUNT**)

- **Check 2 (the arrangement law as absence) is RE-CUT, not dropped:** **no element in either view carries
  positional style from data; no row is a drop target; nothing a writer does writes an order** *(a drag never
  reorders — the ORDER is only ever a sort)*. **The old wording, "no drag handler is bound", is FALSE under this
  amendment** *(Shelf rows are drag SOURCES for 180)* **— so it is SUPERSEDED with a pointer here, kept verbatim —
  never edited.** **The check now asserts sources-only:** *dragging a row within the view changes nothing; dragging it
  to the rail's Drawers icon does 180's act.*
- **Check 5 (order, asserted SEPARATELY per view)** **stays** *(one fixture, `createdAt` opposite to `deletedAt`)*
  **and gains:** *clicking each sortable header re-orders by that column and writes nothing.*
- **New:** **the grouping law** — *a page on two boards appears under both, each group printing its own arithmetic,
  and the arithmetic equals a programmatic count over the full enumeration.* **New:** **the columns exist by name
  (`Written`/`Deleted`), the tags column is ABSENT (not disabled) before 108.** **New:** **folded columns at the narrow
  width still show the destination.** **New:** **Trash rows carry Restore-to-X and Delete Permanently; the row's
  confirm is in place and leaves every other row untouched.** **New:** **a trashed card's row (with 168-F1).**
- **Both `HARNESS_PARKED` settings CLEAN; park count audited** *against §7's list, never the pass/fail line.*

## §7 · WHAT THIS SUPERSEDES — marked, never erased
- **VW2 S2's "Thumbnails flow in a wrapping grid"** → **rows (§2).** **S2's thumbnail law, the sections and the "no colour spent" principle stand.**
- **VW2 S5(1)–(2)** stand; **its "Trash's other verb, Empty, is brief 4's. Build no Empty control here"** → *unchanged in
  ownership, extended: the foot's control and each row's Delete Permanently are VW4/201's, built with them.*
- **VW2 S6 check 2** → **re-cut (§6).** **VW2 S6 check 8 ("No Empty control exists in this view")** → **SUPERSEDED with
  a pointer to VW4's checks + 201: the control exists in the Trash foot, is absent on the Shelf and on an empty Trash.**
- **VW2 §0's "Every VIEW and READER changes … zero schema"** → **stands; the purged column (201) is the one exception in
  this arc, and it is 201's, not this view's.**
- **Unchanged:** the two orders and their reason, one component / two mountings, the flip, the foot instrument.
