# ITEM 144 AMENDED — THE BOARD TABS
### PLAN desk · 2026-09-19 · brief · **supersedes `b144-sibling-row-build-brief.md` in part** (§SUP)

**WORKTREE:** `.claude/worktrees/i144-board-tabs` · **BRANCH:** `i144-board-tabs` · **OFF:** `origin/main`.
**Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4600d7f`. Line numbers are a courtesy.

**SOURCES:** Nick's primary text (below) · `siblings-and-highlight-pass.md` §1 · `pw-journey-d-the-nest.html`
(the cycle guard met where the writer meets it) · `tag-colour-foundation.md` (binding for colour) ·
reference render **`board-tabs-mock.html`**.

---

## §0 · THE PRIMARY TEXT — Nick, verbatim

**2026-09-19 (Batch Three sitting, point 2):**
> *"I never found a way to put a board inside of a board, nor am I seeing the Board tabs listed (could be
> because I don't have any Boards currently connected, but this should be much more intuitive anyway.
> Ideally, all connected boards are listed as tabs that a user can move back and forth between with a
> single click from the Board UI (not only from the Plan menu), and Boards should be able to be opened
> side-by-side."*

**2026-09-16 (item 144's own charter):**
> *"…every other board in that Drawer (or tagged from anywhere in the app) should be listed as tabs
> below the Board but attached to it… When a user clicks on a Board tag, the Board should just change
> over to that Board."*

**Two findings, one row.** The tabs were never built (144 was gated on 108, which has not built), so he
saw none. **And nesting shipped with no door he could find.** This brief answers both: **the tabs are
the door.** *(Side-by-side is item 169's charter, not this brief.)*

---

## §1 · WHAT EXISTS — the desk's read at `4600d7f`

*Research, not the measurement of record: **PW's S0 on `ExistingPagePicker` is the measurement.** If it
disagrees with anything here, disk wins and this brief is amended.*

**No tab row exists.** The board's only tablist is the **mode strip** (`.board-mode-strip`,
`role="tablist"`: Open | Storyboard | Outline) in the nav row. **The new row must not share its role,
its class or its handle** (the one-handle-one-control ruling).

**Four doors can nest a board today. None of them says so:**

| door | where | direction | what the writer sees |
|---|---|---|---|
| `ExistingPagePicker` | sliver "Existing page…"; the empty canvas's "Connect a Page" | a board **into this one** | boards mixed with pages, **unlabelled**, under "Add an existing page"; **no ancestor filter** — a cycle choice returns `null` and the picker **closes without a word** |
| `PinToBoardSheet` | the board's Page face, "Pin to a Board…" | **this board into another** | membership only, `onCanvas:false` — **nothing appears anywhere** |
| `PlacesPanel` | rail → Page → "Also connected to…" checkboxes | **this board into the ticked one** | a checkbox |
| Shelf board | a selected card's "Pin to a Board…" | a loose board into another | — |

**⚠ A PROBABLE DEFECT IN DOOR 1, from the code — NOT reproduced, for PW's S0 to measure.** The picker
calls `pinPageToBoard` (a **store** write) and closes. `BoardEditor` keeps its cards in local `boxes`,
seeded once and never re-read on a user board. So the new board-card **does not appear until the board
remounts**, and **any edit on the board before leaving autosaves the pre-pin array over it — erasing the
pin.** *This is item 92's failure exactly — the comment above `onAddPageCard` describes it and fixed it
for that one door; the picker is a second door with the same shape.* **It may be why Nick found no way:
the one door that could do it shows nothing when used.**

**Readers:**
- **Parents** (boards this one is inside): `getBoardsConnecting(id)` — the canon-applied reader.
- **Children** (boards inside this one): **no exported reader.** Computed inline twice — `buildSurvey`'s
  `isBoardPin` and `BoardPinBox`. **This brief names one.**
- **Drawer:** `getBinderPages(projectId)` — pages **and** boards, **sorted by `updatedAt` descending.**
  *That order changes every time a board is edited. It is unusable as a tab order* (T2).
- **The crumb's nest chain:** `boardNestChain(id)` — **the FIRST parent at each level.**
- **The cycle guard:** `wouldNestCycle` → `boardAncestors`, at every `pinPageToBoard`.

**Switching boards is the route** (`/page/<id>`); `BoardEditor` remounts per board (`key={id}`).
**Item 108 is not built** — no vocabulary reader, no `--tag` tokens, no `Box.tags`. Boards already carry
tags on the record (`JournalEntry.tags`, via their Page face).

---

## T1 · THE ROW — below the board, attached, always in view

**Nick's words place it: *"below the Board but attached to it."*** The row sits directly under
`.board-canvas-wrap`, outside its scroll. **The canvas scrolls inside the wrap; the row never scrolls
away** — *a door you must scroll to find is not a single click.*

**⚠ BUILD CONDITION — THE ROOM LAW.** The wrap's height is measured to the stage's bottom
(`availHeightPx` = `stage.bottom − wrap.top`). **A row added beneath it would be pushed out of the room.**
The measurement **subtracts the row's own rendered height** (read from its rect, never a constant), so
every piece of the board's chrome stays in the room and scrolling stays reserved for the canvas. **It
renders in BOTH layouts** — the framed (≥1100) and the narrow — *the narrow layout has no nest chain in
its crumb, so it needs the row more, not less.*

**Its label is the drawer's name** (SR-Q2, ruled) — *"Novel"* — or **"Not in a drawer"** for a loose
board (the existing `cascadePlanNoDrawer` term). **Its accessible role is navigation, never `tablist`:**
`<nav aria-label="Boards in Novel">`, the current tab `aria-current="page"`.

## T2 · THE THREE POPULATIONS, AND ONE ORDER

**Relative to the board you are on:**
- **CONNECTED** — its **parents** (boards it is inside) and its **children** (boards inside it). *Nick's
  word "connected", and the nest relation.*
- **SIBLINGS** — the other boards in its drawer.
- **TAGGED** — boards from **anywhere** carrying **all** the active tags. **Present only while tags are
  active** (T5).

**Excluded:** **condition boards** (Journal, Shelf, Trash) — *a condition is not a place* (131(a)).

### ⛔ THE ORDER RULE — **the row is the DRAWER's, and it does not move when you do**

**The row lists the drawer's boards — the current one included — in ONE order that does not depend on
which board you are on.** Press a tab: **the board changes, the olive where-you-are marker moves, and
every tab stays exactly where it was.** *That is what "move back and forth between with a single
click" requires: the tab you just left is still where your hand left it.*

**The order, precisely:**
1. **The drawer's boards in BIRTH ORDER** (`createdAt` ascending) — stable; a new board opens at the
   row's end, as a new tab does. *Never `updatedAt`* — `getBinderPages`' own sort would reshuffle the row
   on every edit.
2. **Each board is followed immediately by its children**, drawn **joined beneath it** (a structural
   hairline in `--line`, never a state colour); **children in their parent's reading order**
   (`byArrangement` — y, then x — the order the survey already uses). **Depth nests the same way.**
3. **A board appears ONCE** — under **the parent `boardNestChain` names** (the first parent). **The row
   and the crumb therefore agree about where a board sits** — one derivation, two displays.
4. **A connected board from ANOTHER drawer** appears in its tree position **with a second line in the
   caption form — "in Research"** (item 163's rule, **the same helper**: `drawerCaptionFor`'s "in X").
   *A location line always begins with its preposition, wherever it appears.*
5. **A loose board's row** (no drawer) is **itself and its connected boards** — there is no drawer to
   list.

**What a tab shows: the board's name** (item 136's model — `boardName` today, the stored title when 136
lands), truncated with an ellipsis, the full name in its accessible name; **plus the "in X" line when it
lives elsewhere.** **A Book-type board is a tab like any other** (item 172): *a type changes how a board
is drawn, never whether it is a door.* **No count, no thumbnail, no badge** — *thumbnails are the Plan menu's inventory; a
tab is a door, and a door is a word.*

### ⚖ THE RIVAL, IN ITS STRONGEST FORM — a RELATIVE row (BT-Q1)

**Group the row around the board you are on:** *⬆ its parents · ● here · ⬇ its children · its siblings ·
tagged.* **Its case:** every tab's POSITION states its relation to where you stand — up, down, beside —
without a line of structure to decode, and a writer deep in a nest sees *"the way up"* at the row's
head. **That is real information, and the stable row gives it up** (it shows the tree, not your place in
it; the crumb carries "the way up").
**Its cost:** **every press rebuilds the row around the new board** — the tab you came from jumps
(child → parent group), siblings shift, and *"back and forth"* becomes *find it again.*
**LEAN: THE STABLE ROW.** *The unmeasured risk in the lean: a drawer of 30 boards is a long row, and
this desk has not measured how many boards a real drawer holds. The row scrolls horizontally, the
current tab is scrolled into view on arrival, and the relative row would be nearly as long (its
siblings are the same whole drawer; only the stable row adds boards from other drawers connected to a
sibling). So length is not the rival's advantage, but it is still unmeasured.*

## T3 · A SINGLE CLICK SWITCHES — travel, never nest

**One press → the existing travel path** (`flushNow()` then navigate to `/page/<id>`), the crumb
updates, **no membership is written.** **Each board opens in its OWN remembered view** — BM1 S3's
per-board mode (`wrizo-board-mode`); a tab never carries Outline or Storyboard across. **The current tab
is not pressable.** *(Double-click stays the canvas's gesture for travelling INTO a board-card. A tab
is a door, and a door takes one press.)*

## T4 · THE DOOR — connecting a board FROM the tabs

**A "＋" at the row's end** (accessible name **"Put a board inside Characters"** — the direction, stated).
**It opens the CONNECT LIST inside the row's own band** — the band grows; **it never lays a panel over
the canvas** (item 166's law, obeyed by construction, and the room law re-measures).

**The list:** **"＋ New board"** first, then **every board**, scrollable, **a thumbnail each wearing its
TYPE's proportion** (item 172 §4 — *a Default is wide, a Book is tall*), its name, its "in X" line. **Each row is one of three things:**

| row | state | why |
|---|---|---|
| **self** | **ABSENT** | nonsense, not a refusal — the one grammar for refusals |
| **a condition board** | **ABSENT** | not a place |
| **already inside this one** | **present, inert, says *"already inside"*** | a writer looking for it must find it |
| **an ancestor** (would make a cycle) | **present, inert, says *"contains this board"*** | **item 128's first invariant, met where the writer meets it** — Journey D's step 5, ratified |
| any other board | **pressable** | |

**Press a board** → `pinPageToBoard(chosen, current, { display: true })` — **displayed**, because *the
writer asked for it on this canvas* (PW1 S3's board-side precedent) — **and appended to the component's
own live `boxes`** (**item 92's law — the probable picker defect in §1 is exactly what happens without
it**). **Its tab appears joined beneath the current one.** The list closes.

**"＋ New board"** → a board **in this drawer**, **nested inside this one**, **born with its name field
in focus** (item 136's ruling), and the writer travels to it.

**THIS DOOR HAS ONE DIRECTION — "put a board inside this one."** *The card lands HERE, on the canvas you
are looking at, so the act is visible.* *(The rival — both directions in one list — doubles every row's
meaning, and the upward direction is the one that produces nothing visible where you stand.)*

**ONE LIST, TWO MOUNTINGS, TWO DIRECTIONS.** Item 165's **Connect Board** submenu (Nick's PLAN NOTE:
*"a submenu that shows all available Boards in a scrollable window when necessary"*) **is this list**,
mounted vertically in the Plan column — **and it runs the other way: it puts THE SUBJECT inside the
chosen board.** *That is the only direction a PAGE has (a page
contains nothing), so the Plan panel's Connect Board means the same thing on a page and on a board:
"put this inside…" — and the list beneath it, Connected Boards, shows exactly what that act makes.*
**Build it once** (`BoardConnectList`, taking a direction), mount it twice. **The row states come from
ONE guard** (`wouldNestCycle`, with its arguments in the mounting's order), so the two faces can never
disagree about what may go where. *Two lists deciding "can this go in here" separately would be two
definitions of the cycle guard.*

| mounting | direction | an inert row reads |
|---|---|---|
| **the tabs' ＋** | the chosen board goes **inside the current one** | *"already inside"* · *"contains this board"* |
| **the Plan panel's Connect Board** | **the current page or board** goes inside the chosen one | *"already here"* · *"inside this board"* |

**NOT IN THIS BRIEF:** disconnecting (item 168's **Remove**); dragging a tab anywhere (**reserved for
item 169** — *open beside* is the drag a tab most plausibly means, and three drag meanings on one tab —
reorder, nest, open beside — is two too many until 169 rules).

## T5 · TAGGED — 108's filter narrows the row (ALL, as ruled)

**One active-tag state per board; the canvas and the row both read it.** Under active tags the row
shows **only boards carrying ALL of them, from anywhere** — **flat, in the unfiltered row's order**
(the joining lines are drawn only when nothing is filtered: *a child shown without its parent would hang
a line from nothing*), **"in X" on any from another drawer.** **The current tab never disappears** — it
is where you are. **Empty states itself in words:** *"No other board carries all of #stark and #lore."*

## T6 · COLOUR (`tag-colour-foundation.md` §0, scope RATIFIED)

**The current-tab marker is OLIVE** (`--accent-rest`) — a where-you-are marker, which the tag reversal
**did not touch**. **Active tag chips are ORANGE** (`--tag`). **Structure lines are `--line`.**

## T7 · THE PLAN MENU AND THE ROW — what now keeps two lists of boards apart

**The first 144 brief separated the lists by RELATION** (membership in the rail, siblinghood in the row).
**The amendment puts membership INTO the row, so that separation is gone.** What separates them now is
**KIND OF LIST:**

| | **the tabs** | **the Plan menu's survey** |
|---|---|---|
| **it is** | a **door** — one press travels | an **inventory** — what a board holds, with display toggles |
| **form** | words in a row | thumbnails under **Cards / Pages / Boards** |
| **label** | the **drawer's** name | the **board's** name |

---

## S0 · SURVEY, before any code
**(a)** Take **PW's S0 on `ExistingPagePicker`** as input. **If it confirms the §1 defect, the fix is a
precondition of T4, not a neighbour of it** — the connect list must not inherit the picker's write.
**(b)** Confirm the room law's measurement and where the row mounts in **both** layouts.
**(c)** Name the **children reader** (`getBoardsInside(boardId)` or equivalent) in the store, and route
`buildSurvey` and `BoardPinBox` through it — **one derivation.**
**(d)** Confirm `drawerCaptionFor` is the one "in X" helper (item 163 routes the Plan row through the
same helper — **whichever lands first builds it; the other reuses it**).

## S1 · SEQUENCING — **the row and the door do NOT wait for 108** (BT-Q2)
**Build T1–T4, T6, T7 now. T5 lands with 108** (it needs 108's reader, filter component and tokens).
*The founder's finding is the missing door; tags are the row's third population, not its reason to exist.*
**LEAN: split.** *The rival: build once, after 108, so the row is never shipped without a population
its charter names. Its cost is the door, which is what Nick could not find.*

---

## S2 · THE HARNESS — `apps/desktop/scripts/harness/i144.mjs`

Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path** · **select by name** (`data-board-tab="<id>"`), never by index.

1. **The set:** drawer boards present **including the current one** (`aria-current`); condition boards
   absent; a child **immediately after its parent**; a board from another drawer present **with a second
   line that begins with "in "**.
2. **⛔ STABILITY:** read the row's tab ids; press a sibling; read again — **the sequence is identical;
   only `aria-current` moved.** *(The test of T2's whole reason. It must be ids, never positions.)*
3. **A press travels:** the route and crumb change; **both boards' `boxes` byte-identical** before/after.
4. **In view:** at 1366×768 and at the narrow width, the row's rect lies **inside the viewport** with a
   board tall enough to scroll.
5. **⛔ CONNECT, AND IT SURVIVES:** "＋" → press a board → **its card is on the canvas without a remount**
   → **edit another card, wait past `AUTOSAVE_MS`, reload** → **the pin is still there.** *(Item 92's
   regression, asserted at the new door. A check that stops at the store write passes while the card is
   erased.)*
6. **The cycle, met:** an ancestor row is present, inert, reads *"contains this board"*; pressing it
   writes nothing.
7. **Already inside:** present, inert, reads *"already inside"*.
8. **＋ New board:** born in this drawer, inside this board, name field focused.
9. **The list never overlays the canvas:** the canvas's rect and the open list's rect **do not intersect**
   (item 166's check, applied here).
10. **The mode strip is untouched:** exactly one `role="tablist"` on the board, and it is the mode strip.
11. **Colour:** current-tab marker from `--accent-rest`. *(Tag checks land with T5.)*
12. **(With T5)** ALL narrowing, flat, current tab kept, the empty sentence naming the tags.
13. Both `HARNESS_PARKED` settings CLEAN; **park count audited** — the retirement of `b144-sibling-row`'s
    "self is absent" (§SUP) is a park, not an edit.

---

## §SUP · WHAT THIS SUPERSEDES in `b144-sibling-row-build-brief.md`

**Kept verbatim there, marked; superseded here:**
- **S1 "Self is ABSENT — never listed"** → **the current board is a tab** (the stable row needs it).
- **S3's three-layer separation by relation** → **T7's separation by kind of list.**
- **The gate "108 merged"** → **the row and the door are ungated; the tag population keeps the gate**
  (S1, pending BT-Q2).
**Unchanged:** a press travels, never nests · condition boards excluded · the drawer's name labels the
row · the strip of tagged pages and cards beneath the row (SR-Q1) · colour.

## §Q · FOR NICK

- **BT-Q1 — the order.** **The stable row** (lean: the tabs stay put, the marker moves) **or the
  relative row** (the tabs regroup around wherever you are)? *Both are in the mock; press a few tabs in
  each.*
- **BT-Q2 — sequencing.** **Build the row and its door now, and add tags when 108 lands** (lean), or
  wait and build it all together after 108?
- **BT-Q3 — two doors, two directions.** The tabs' **＋ puts a board inside the one you're on**; the Plan
  menu's **Connect Board puts the one you're on inside another** (the only way a page can connect). **Lean:
  keep both, each saying its direction in words.** *The rival: one direction everywhere, which a page
  cannot have.*

## §CLOSE
1. S0 done, including PW's picker measurement taken as input.
2. Build; `tsc` + `build:web` + selftest + full suite, **both settings**, green.
3. **Push the branch. Do not merge.**
4. **A FOUNDER SITTING IS OWED** — *"I can find the way to put a board inside a board, and I can move
   between my boards with one click"* is a meaning claim no suite can make.

**Nothing deploys on this lane's word.**
