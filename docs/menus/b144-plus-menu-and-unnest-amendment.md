# ITEM 144 — THE "+" MENU, UNLINK, UN-NESTING BY DRAG, AND THE BACK ARROW
### PLAN desk · 2026-09-24 · **amendment to `b144-board-tabs-build-brief.md`, `b144-tab-bar-amendment.md` and `b144-sibling-row-build-brief.md`** · also amends `b169-side-by-side-charter.md` (§7)

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `c036790`. Line numbers are a courtesy.
> **⚠ THE RECORD:** Nick's words below reached this desk verbatim in Fable's relay of 2026-09-24 (evening).
> **The ledger entry for them had not landed when this was written**; where this amendment says "ruled" it
> means *"his recorded words, as relayed"*, and chat 1's entry governs if the two differ.

> **⚠ AMENDED 2026-09-24 late — `b144-add-board-and-drag-to-nest-amendment.md`** (the Plan menu's button becomes "Add Board"; nesting an existing board is by DRAG). **The third-amendment default "Put inside…" is WITHDRAWN; §9.3's two-Connect-Boards collision dissolves. Kept as written.**

**Where this sits:** the three 144 briefs and the tab-bar amendment stand **as written** except where §8
below names a line as superseded. Nothing is rewritten in place; each brief carries a one-paragraph
pointer to this file.

---

## §0 · HIS WORDS, VERBATIM (as relayed)

> *"BT- Q1: The tabs should stay fixed from left to right. BT-Q2: Ship now, tags later. BT-Q3: Scrap
> "Board." Just a "+" next to the current board. Give the user these options when "+" is clicked: Add Board
> (creates a nested board), New Board (which creates a new board that starts its life connected to the
> current board), or Unlink Board. Open to questions/concerns. And keep the Plan menu controls, too. And
> let's keep it to three boards visible on the surface at a time. If the User double-clicks on a nested
> board, the nested board should replace the parent board in the UI with a back arrow icon."*
>
> **Answering Fable's concerns:** *"1. Confirmed. 2. Let's stick with "Add Board." The User can always drag
> the nested board off the surface is they want to un-nest it, right? 3. Agreed. Two for laptops/tablets,
> three for desktops."*

**What this closes:** **BT-Q1** (stable row — the brief's lean) · **BT-Q2** (ship now, tags later — the
brief's lean; T5 keeps its 108 gate) · **BT-Q3** (both doors stay — the brief's lean) · **144C-Q2 / 144-Q2**
(the word: **none — a bare "＋"**). **A question his words answer is struck, not re-asked.**

---

## §1 · THE "＋" — no word on it, two things behind it

> **⚠ §1's TWO-ROW TABLE AND ITS "READING FLAGGED" PARAGRAPH ARE SUPERSEDED BY §9 (three rows; Add Board = a NEW board inside, per his literal words). Kept as written below.**

**The control** is a bare **"＋" beside the CURRENT board's tab** (the placement the tab-bar amendment §5(4)
already took from his earlier words, unchanged). **No visible word.** **Its accessible name keeps stating
the direction** (the standing law, and the only place the word survives): *"Add a board to Characters."*
**It opens a small menu in the row's own band** (never over the canvas — item 166; the room law
re-measures) **with exactly two rows:**

| row | does | built from |
|---|---|---|
| **Add Board** | opens the merged brief's **connect list** (T4): every board, states and refusals as T4 already gives them; a press nests the chosen board **inside the current one** | T4's list, **minus its first row** |
| **New Board** | creates a board **in this drawer, nested inside this one, name field focused**, and the writer travels to it | T4's **"＋ New board"** row, promoted to its own item |

**⚠ READING FLAGGED — HANDED UP, NOT RESOLVED QUIETLY.** His words are *"Add Board (creates a nested
board), New Board (which creates a new board that starts its life connected to the current board)."*
Both verbs say "creates." **This desk reads them as above** (Add = an existing board becomes a nested
one; New = a new board is born nested), **because the record has ONE board-in-board relation —
`page-pin` membership — and "connected" is, in this house, that same relation seen from either end**
(`getBoardsConnecting` = parents; the children reader = the other direction).
**The rival, in its strongest form:** *Add Board = create a NEW nested board; New Board = create a new
board born connected in the OTHER direction (the current board inside the new one — the Plan menu's
Connect Board direction).* **Its case:** it uses his two verbs literally and gives each a distinct result
without inventing a picker row. **Its cost, which is why this desk does not adopt it:** the tabs would
lose the only path that nests an EXISTING board into the current one (the Plan menu's Connect Board
runs the other way, and he said to keep it), and the record has no "connected but not nested" board
relation for "New Board" to mean. **The unmeasured risk sits on this desk's reading:** nobody has asked
him whether Add Board is meant to list existing boards. **One yes/no to Nick settles it; a builder may
start on this desk's reading because both rows are cheap to swap.** *(Chat 1/Fable: route as a
question; the default stands until he speaks and does not override his words.)*

**Unlink is NOT in this menu** (§2) — Fable's concern 1, confirmed by him: *"Unlink Board"* acts on a
particular board, and the "＋" belongs to the board you are standing on.

**The Plan menu's controls stay** — Connect Board (puts the current page/board inside the chosen one)
and its Connected Boards list, exactly as T4's "one list, two mountings" table has them.

## §2 · UNLINK — on each board's own tab

**Every tab that is NESTED in something carries an Unlink act, on that tab.** The act is a **row in the
tab's own `⋯` menu** (the `⋯` menu the Plan survey's rows already carry (`CascadeSurvey`; **board cards on the canvas carry none
today**, so this is a new mounting of an existing pattern); shown always on the
current tab, on hover/focus for the rest; a right-click opens it too once item 186 lands — **never a
second menu with different contents**, item 168 §4). **The row reads with its parent named:** *"Unlink
from Characters"* — the parent **as the row draws it** (the tab's position in T2's tree), never a bare
"Unlink".

- **A tab that is not nested in anything shows NO Unlink** — **absent, not greyed** (the house grammar for
  a nonsense act). A drawer sibling with no nest relation has nothing to unlink.
- **Unlink writes MEMBERSHIP ONLY** — `unpinPageFromBoard(child, parent)` (already exists, idempotent,
  already the Places panel's checkbox-off). **The child board, its cards, and its other memberships are
  untouched; nothing is deleted** (item 168's law: *Remove unlinks, never deletes*). A board nested in
  two parents is unlinked from the one the tab names; the other stays.
- **After Unlink** the tab leaves its "joined beneath" position and takes its **birth-order place** in the
  drawer's row (T2 rule 1), or — a loose board — **drops out of the row**, findable from the Plan menu;
  **the whisper says so** (§3).

## §3 · UN-NESTING BY DRAGGING — designed here because he assumed it exists, and it does not

**Measured, not assumed.** Today **a card cannot leave the board by dragging it:** `BoardEditor`'s drag
clamps every moving card at the canvas — **left/top floored at 0, right edge a hard stop at 1
(item 118 (c)), bottom capped** — *"a stop, never a correction."* **So "drag the nested board off the
surface" has no gesture to attach to, and building it naively would BREAK item 118**, whose whole point
is that a card dragged to the edge must not disappear. **The design keeps the stop and moves the
gesture to the POINTER.**

**THE RULE — the card stops; the pointer leaves.**
1. **Applies to a nested board's card only** (`kind: 'page-pin'` whose entry is a board, drawn as the
   board-card). **Every other card keeps exactly today's hard stop** and never arms anything.
2. **The card obeys item 118 throughout** — it stays inside the canvas. **Only the POINTER may leave.**
3. **Arming:** when the pointer has travelled **≥ 32px beyond the canvas's edge** (hysteresis — a card
   dragged *to* the edge does nothing, and no 1px overshoot arms it), the drag is **armed**: the edge
   lights a labelled band — *"Release to unlink from Characters"* — and the card takes a distinct lifted
   look. **Moving the pointer back inside disarms it, with no effect.**
4. **Release while armed** → Unlink (§2's write). **A whisper follows:** *"Unlinked from Characters —
   Undo"* (+ *"— find it under Plan"* for a loose board). **Undo is the drag's own start snapshot**
   (`startBoxes` already exists for the gesture), one level, as the board's undo already is.
5. **Release while NOT armed** = today's behaviour, unchanged.
6. **Touch:** the same rule after the 350ms long-press that already begins a drag. *(No new gesture.)*

**THE COLLISIONS, named (the desk's acceptance test for this drag — a brief that leaves one open is not
decision-complete):**
- **The Trash icon (item 168).** *It is a drop target at the rail's foot, and the pointer passes it on the
  way out.* **A release ON the trash icon is Delete (168), never Unlink** — the drop target wins over
  the unlink band. **Unlink and Delete must be visibly different** (the band's words vs the icon's drop
  state), because for a nested board they are one leftward drag apart.
- **Another visible pane (item 169).** **A release over another pane's canvas is 169-Q7(c) — the board
  gains a membership there; it is NOT an unlink.** *(Both boards then show it; "movable back and forth"
  is unpin-plus-pin only when the writer also uses Unlink.)* **The band does not show over a pane.**
- **A tab (item 169's reservation).** **A release over a tab does nothing in this amendment** — the card
  returns; the tab's drag stays **reserved for 169** (three drag meanings on a tab is still two too
  many). *Unlink from a drag never lands on a tab.*
- **The strips and the rail** (anything not above) **count as "off the surface"** — release there while
  armed = Unlink.
- **Edge auto-scroll.** *If the canvas scrolls while a drag is held near an edge, the band must not
  arm from the scroll's own motion* — **arming reads the pointer's position against the canvas rect, never
  the scroll offset.**

**The unmeasured risk, named:** this desk has not measured how often a writer will overshoot the
canvas edge while merely REARRANGING a nested board's card. **The 32px hysteresis, the band and the
Undo whisper are the three defences; none is a measurement.** *(Rival, and cheaper: Unlink from the tab
only, no drag. It is the safe build — and he asked for the drag, so this desk designs it and names the
rival.)*

## §4 · DOUBLE-CLICK A NESTED BOARD — it replaces its parent, with a back arrow

**Today** a double-click on a board-card **travels into it** (the route; the crumb changes). **His words
make the travel happen IN PLACE: the nested board replaces the parent in the UI, and a back arrow icon
returns.** **This desk's design:**

- **The child takes the parent's PANE** (item 169: with one pane, the whole board; with several, that
  pane only). **The other panes are untouched.**
- **The back arrow is an icon-only control** at the pane's top-left band (accessible name **"Back to
  Characters"**, tooltip the same). **One press returns the parent AS IT WAS LEFT** — canvas scroll, card
  selection, per-board mode (BM1 S3's `wrizo-board-mode`) — **the stateful return `AGENTS.md`'s page-primacy
  canon requires of every departure.** *(It is the return chip for boards.)*
- **It stacks.** Child → grandchild → back returns one level each. **The crumb's "way up" (`boardNestChain`)
  is unchanged and still jumps directly**; **the back arrow is "where I just was"**, the crumb is "where
  this sits." *They answer different questions and both stay.*
- **The tabs stay stable (T2).** **Entering the child moves the olive marker to the child's tab; the back
  arrow moves it back.** No tab moves.
- **A tab press is still a plain travel with no back arrow** (T3) — *a door, not a descent.*
- **Not a new route.** The build question — whether the pane's content swaps under the same route or
  navigates — **is the builder's S0**; **the assertion is the one above: parent state restored exactly.**

## §5 · THREE BOARDS VISIBLE — two on laptops and tablets, three on desktops (item 169)

**His words supersede the earlier "up to four" for the split.** **The boundary is set by measurement, not
by a device name** — *"laptop", "tablet" and "desktop" are not values the app can read.*

**The rule this desk proposes, and it is arithmetic, not a device list:** **panes = the largest n ≤ 3
such that n × `CANVAS_MIN_W` (560, the canvas's own existing floor — `BoardEditor.tsx`) + (n−1) × the
gutter ≤ the stage's measured width.** *At a stage too narrow for two, panes = 1 (no split — 169-Q10's
"absent" below `DESKFRAME_MIN_WIDTH`, 1100, is the same rule's floor).* **The laptop/tablet "two" and the
desktop "three" then fall out of the stage width instead of being declared.**

**⚠ NOT MEASURED HERE.** This desk has launched nothing and holds no box turn; **the stage widths at
1100 / 1280 / 1366 / 1440 / 1680 / 1920 / 2200, and whether 560px is the right per-pane floor for
readable card text, are the builder's S0 measurement** — *(the 169 charter's own earlier claim, that a
third pane at 1366 leaves each board under ~400px, is a hand calculation and stays one until measured).*
**If 560 proves too generous or too tight, the constant moves; the rule does not.**

## §6 · THE HARNESS — additions to `i144.mjs` (drivers never assume existence · real pointer events · select by name · absolute worktree path)

Numbers continue the merged brief's S2 list; **each is a check by name.**
- **P1 — the "＋" carries no visible word**, its accessible name states the direction; **its menu has
  exactly two rows, Add Board and New Board**, and **no Unlink row**.
- **P2 — Add Board** nests the chosen existing board **inside the current one**, **and the card survives
  an edit + `AUTOSAVE_MS` + reload** (item 92's regression, at the new door). **New Board** is born in
  this drawer, nested, name field focused.
- **P3 — Unlink on a tab:** present **only** on a nested tab (absent on a plain drawer sibling); reads
  *"Unlink from <parent>"*; writes **only** the membership — **the child's own record and the parent's
  other cards byte-identical.**
- **P4 — the drag, ARMED:** with real pointer events, drag a nested board's card past the edge **by more
  than 32px**; **assert the card's rect never leaves the canvas** (item 118's stop holds), the band is
  present with the parent's name, **release outside the element** (*release where the writer releases*)
  → unlinked, the whisper's Undo restores. **Assert nothing is left armed after release.**
- **P5 — the drag, NOT ARMED:** drag to the edge and release **inside** → nothing written. **A plain
  text card dragged past the edge arms nothing.**
- **P6 — the collisions:** release **on the trash icon** → deleted per 168, **not** unlinked; release
  **over another pane** → gains membership there, **not** unlinked; release **over a tab** → nothing
  written.
- **P7 — double-click a nested board:** it replaces the parent in **its pane only**; the back arrow
  returns **with the parent's scroll, selection and mode restored**; the tabs' sequence (ids) is
  identical throughout.
- **P8 — the pane count:** at each tested width, panes = the rule's value, **read from the measured stage
  width, not from a device table.**
- **Parks:** the merged brief's "＋ at the row's end" assertions (if any) and the tab-bar amendment's
  "＋ BOARD" wording checks are **SUPERSEDED with a pointer to this file, kept verbatim — never edited**;
  **audit the park COUNT against the list, not the pass/fail line.**

## §7 · WHAT THIS AMENDS IN `b169-side-by-side-charter.md`

- **169-Q2 — ANSWERED by his words: two on laptops/tablets, three on desktops**, by the §5 rule. It
  supersedes both the charter's lean ("two") and the earlier "up to four."
- **169-Q1 — was already answered:** *"Boards should be able to be opened side-by-side"* is a **board
  beside a board**, and the charter's own note at 169-Q6 records *"four boards … answer Q1, Q2 and Q10."*
  **The decision sheet this desk wrote on 2026-09-24 asked 169-Q1 and 169-Q2 with defaults of its own —
  a default overriding his recorded words. That is this desk's error; both lines are struck from it.**
  *(Page-beside-board, BM4's 2026-07-21 wish, is the one thing still not answered; it is recorded, not
  asked.)*

## §8 · WHAT THIS SUPERSEDES — marked, never erased

- `b144-tab-bar-amendment.md` **"＋ BOARD"** (§2, §5(4), §Q 144C-Q2) → **a bare "＋"** (§1 above).
- `b144-board-tabs-build-brief.md` **T4's "the ＋ opens the CONNECT LIST"** → **the ＋ opens a two-row menu;
  the connect list is Add Board's second step** (§1). **T4's accessible name "Put a board inside …"** →
  **"Add a board to …"**. **§Q BT-Q1/Q2/Q3** → answered (§0).
- `b144-board-tabs-build-brief.md` **T3's "Double-click stays the canvas's gesture for travelling INTO a
  board-card"** → **in place, with a back arrow** (§4).
- `b144-board-tabs-build-brief.md` **"NOT IN THIS BRIEF: disconnecting"** → **now in: Unlink (§2) and the
  drag (§3)**; *"dragging a tab anywhere (reserved for 169)"* **still holds.**
- **Unchanged:** the stable row, the drawer's name as its label, `role=navigation`, condition boards
  excluded, colour, T5's 108 gate.

---

## §9 · SECOND AMENDMENT, 2026-09-24 night/late — the three rows, "beside", and Connect Board's recents

> **Fable's rulings, and Nick's word (verbatim, relayed): *"2. Let's add a third option to "Connect Board"
> with a toggle-open menu that lists all boards from recently opened to oldest."*** **This section
> SUPERSEDES §1's two-row table and its "READING FLAGGED" paragraph** (both kept as written above).
> **Recorded as relayed; chat 1's ledger entry governs if the two differ.**

> **⚠ THIRD AMENDMENT, 2026-09-24 late — three things the record now carries (chat 1's entry at `4187cfb`);
> §9.2's per-device lean and §9.3's naming lean below are SUPERSEDED in part and kept as written:**
> **(1) CONFIRMED BY NICK — *"1. Yes, beside"*: Connect Board connects the chosen board BESIDE this one.**
> §9.3's "Fable's reading, flagged" is **no longer a reading — it is his word.**
> **(2) STORAGE: his word is *"1. Store them properly"*** (to *"Should Wrizo store which boards are
> connected, so they match on every device?"* — one small database change, connections sync). **That
> WITHDRAWS §9.2's "Default until he speaks: this device" — he has spoken, and a default never
> overrides his words.** **What it does NOT do yet: NOTHING WRITES until TOOLS' S0 shape report clears
> Fable's review**, and **if the minimum lawful shape is a NEW TABLE rather than a column, Fable tells Nick
> in plain words first.** *(Fable's relay of the same night lists this as still with Nick; the ledger
> records his answer — this desk follows the ledger and flags the difference.)*
> **(3) NAMES — with Nick, DEFAULT (vetoable, not his text): the Plan menu's Connect Board becomes
> "Put inside…"; the "＋" menu keeps "Connect Board".** Supersedes §9.3's lean (keep the name on both).

### 9.1 · THE "＋" MENU — three rows

| row | does | direction |
|---|---|---|
| **Add Board** | creates a **NEW board inside this one** (born in this drawer, name field focused) | inside |
| **New Board** | creates a **NEW board BESIDE this one — connected, not inside** | beside |
| **Connect Board** | a **toggle-open list of ALL boards, most recently opened first**; picking one **connects it BESIDE this one** | beside |

**Add Board / New Board are set to his LITERAL words** (Fable: *a default never overrides his words, even
when the reading is cheap to swap*). **The reading §1 flagged — Add Board nests an EXISTING board — goes
to Nick as the alternative, not the default.** **Its cost, stated once so it is a choice and not a
surprise:** under the literal reading **the tabs have no path that nests an existing board into the
current one** (the Plan menu's Connect Board runs the other way — the current board goes inside the
chosen one — and he said to keep it; item 169's drag, 169-Q7(c), is a second route once that builds).

### 9.2 · ⚠ "BESIDE, CONNECTED, NOT INSIDE" HAS NO STORED MEANING TODAY — MEASURED, HANDED UP

**Checked against the data model (`types/index.ts`, `store/persistence.ts`):** the **only** board-to-board
relations are **`page-pin` membership (a nest — inside/outside)** and **drawer membership
(`projectId`)**. **The `'connection'` box is a hairline between two CARDS, not boards.** **There is no
peer relation between two boards.** *"Connected", everywhere in the record so far, means the nest
relation seen from either end (`getBoardsConnecting` = parents).* **So "beside, connected, not inside"
names a thing the record cannot store — and a new peer relation is a column or a table: a SCHEMA STOP,
chat 1 → Nick, not a builder's call.**

**What CAN be built with zero schema — this desk's lean, offered so TOOLS is not stopped:**
- **"Beside" = a remembered PAIR, per device**, the class item 169-Q9 already leans to (*"remembered,
  client-local, the way a board's view is — BM1 S3"*, `wrizo-board-mode`'s own `localStorage` recipe).
- **New Board** = a board **born in THIS DRAWER** (so it is a tab in the stable row at once — *the
  drawer's row is where "beside" is already visible*), **plus** a remembered pair with the current board.
  **It does NOT nest** and **does NOT travel**: the writer stays where they are; **a whisper says where
  it went** (*"New board added beside Characters — open it from its tab."*). **Where item 169 has more
  than one pane (§5's rule), it also opens in the next pane.**
- **Connect Board** = the same **remembered pair** for the picked board (any drawer), opened in the next
  pane where one exists. **It moves nothing between drawers and nests nothing.** *(Rejected: "beside" as
  a drawer change for the picked board — that relocates another board, which is not a connection.)*

**What the lean costs, said plainly:** the pair is **not synced** and **is lost with the device's storage**;
**and until item 169 builds, "beside" is a tab and a whisper, not a second board on screen.** **If Nick
means a LASTING link that follows him between devices, that is the schema stop — one yes/no:**
*"Should two boards connected beside each other be remembered everywhere you sign in, or is
remembering it on this device enough?"* **Default until he speaks: this device.**
**⚠ SUPERSEDED — he answered "1. Store them properly"; see the marker at the head of §9. The paragraph is kept as written.**

**The rival readings of his words, in their strongest form** (none built without his word):
**(i)** a stored peer link (needs the schema stop above — the most literal reading of "connected");
**(ii)** "beside" as **siblings under the current board's PARENT** (uses the existing nest relation, no
schema — its cost: it does nothing for a top-level board and re-parents by side effect);
**(iii)** the new board **contains** the current one (the Plan menu's Connect Board direction — the only
existing relation that is "connected" and not "inside" *from the current board's seat*, and exactly what
his phrase "not inside" argues against). **This desk leans to the lean above because it is the only
reading a builder can start on today, not because it is the likeliest to be what he pictured.**
**The unmeasured risk sits on this desk's reading:** nobody has shown him what "beside" looks like.

### 9.3 · ⚠ "CONNECT BOARD" — TWO CONTROLS, ONE NAME, OPPOSITE DIRECTIONS (Fable's reading, flagged)

**Fable reads "connect" as "connect BESIDE", and that reading is flagged here as Fable's, not his.**
**The collision it creates:** **the Plan menu's existing Connect Board** (item 165, kept by his word) **puts
the current page/board INSIDE the chosen one; the "＋" menu's Connect Board would put the chosen board
BESIDE the current one.** **Same name, different act, one screen apart.** *(A second reading of his
sentence: "add a third option TO Connect Board" could mean the existing Plan-menu control gains a
recents-ordered list — the words don't say which menu.)* **The house's own rule is that two lists deciding
"where may this go" must share one guard** (`BoardConnectList`, T4) — **so the LIST is built once (§9.4)
and mounted with a direction, as T4 already says; what is open is only whether the two mountings may
share a name.** **Lean: keep his word on both, and let each mounting's inert-row text state its
direction** (*"already beside"* / *"contains this board"* etc.) — **rival: rename the "＋" row ("Open
beside…")**, which costs his word. **One yes/no rides with the Add Board question.**
**⚠ SUPERSEDED IN PART — "beside" is confirmed (his word); the naming default is now "Put inside…" on the Plan menu's row (marker at the head of §9).**

### 9.4 · "RECENTLY OPENED" — NOT RECORDED TODAY; KEPT PER DEVICE; NO COLUMN

**Measured:** no `lastOpened`/`openedAt` on `JournalEntry` or any board record (only a session-log
`deskOpenedAt`, one-shot, unrelated). **`updatedAt` is not "opened"** — *it moves when a board is edited,
and the merged brief already refused it as an order for that reason (T2).*

**Per Fable's ruling — keep it per device; if it needs a column, it stops for Nick. IT DOES NOT NEED ONE:**
- **A bounded most-recent-first list of board ids in `localStorage`** (a new key beside
  `wrizo-board-mode`, the same read/write/try-catch recipe; **cap ~100**, prune deleted boards on read).
  **Written when a board MOUNTS** (`BoardEditor`, `key={id}`), **moving that id to the front.**
- **The list = every user board** (condition boards excluded, as T4), **most-recently-opened first**;
  **boards this device has never opened follow, newest-touched first (`updatedAt` descending) — a stated
  FALLBACK, not a claim about opening** — *(his "to oldest" then holds: the tail is the least-recently
  touched).* **Self is absent; states/refusals exactly as T4** (already-beside, would-cycle only for
  the inside direction).
- **Named limits, so nobody discovers them:** **it does not sync; a new device starts with the fallback
  order; a cleared cache resets it.** **A synced version needs a column — not proposed, not needed to
  ship.**
- **Toggle-open:** the row opens/closes the list **in the row's own band** (item 166 — never over the
  canvas), scrollable, a thumbnail each in its **type's proportion** (172 §4), name, and the "in X" line.

### 9.5 · THE SIBLING-ROW BRIEF'S "108 MERGED" GATE — re-read against BT-Q2 (chat 1 asked)

`b144-sibling-row-build-brief.md` §CLOSE 1 says **"Confirm the gate — 108 merged."** **Chat 1 measured
it: only 108's BUILD BRIEF is merged; no product build exists; the gate is unmet as written.**
**BT-Q2 — *"Ship now, tags later"* — is the recorded word that the tabs ship without tags**, so **the gate
SPLITS, and this desk states the split so a builder does not stop on it:**
- **UNGATED, build now:** the row, the door and everything in `b144-board-tabs-build-brief.md`
  **T1–T4, T6, T7** (already ungated there by S1's lean, now his word) — **and this amendment's §§1–9.**
- **STILL GATED on 108's build:** **T5** (the tag population, ALL narrowing, its empty sentence), the
  **strip of tagged pages and cards** (SR-Q1), and the sibling-row brief's tag-colour checks.
  **A builder confirms 108's status at the start and ships without them — "tags later" is a recorded
  word, not a wait.**

### 9.6 · THE HARNESS — additions (same standing laws)
- **P9 — the menu has THREE rows**, in the order Add Board · New Board · Connect Board; **no Unlink row.**
- **P10 — Add Board** creates a board **nested inside** the current one (the pin exists; the card survives
  edit + `AUTOSAVE_MS` + reload). **New Board** creates a board **in this drawer**, **NOT nested** (**no
  `page-pin` written in either board**), the writer **stays put**, the whisper appears, and **its tab is in
  the row.**
- **P11 — Connect Board's list order:** open board A, then B, then C on one device; the list reads
  **C, B, A, then the never-opened boards by `updatedAt` descending**; **the current board is absent.**
  **Read the list by ids, never positions.**
- **P12 — no schema:** **no column, no table, no `sync.ts` mapper touched**; the recents live only in
  `localStorage`. **A check asserts that clearing it changes nothing in the store.**
- **P13 — the pair survives a reload on the same device** and is **absent on a fresh profile** (the named
  limit, asserted rather than assumed).
- **Parks:** P1's "**exactly two rows**" assertion is **SUPERSEDED with a pointer to P9, kept verbatim —
  never edited**; **audit the park COUNT.**

### 9.7 · WHAT A BUILDER MAY START, WHILE THE STORAGE SHAPE IS UNREVIEWED

**Not gated by the schema word:** the "＋" and its menu chrome · **Add Board** (a NEW board inside — the
`page-pin` write already exists) · **Unlink** (tab and drag) · the **back arrow** · the **recents list**
(§9.4 — per device, by Fable's separate ruling, and not a connection at all) · the **Connect Board
list's rows and order** (a read, no write) · the naming.
**GATED on TOOLS' S0 shape report clearing Fable's review — build the read, write nothing:** **what
"pick a board" and "New Board" STORE** (the beside-connection itself). **Until the shape clears: New
Board still creates its board in this drawer, un-nested (§9.2) — that is a board, not a connection —
and Connect Board's pick opens no lasting link.**
**A note the shape report should answer, so it is not discovered late:** **`beside` is a peer relation
(A—B), not a parent/child one** — *which side owns the row? is it one record or two? does deleting either
board end it (item 168: deleting hides, never removes)? must a pair be unique?* **and — the house's
own recurring trap — every client site that copies or rebuilds a board record must carry the new field or
table's rows** (the `page_links` and `eraserWidth` censuses, applied). **The harness's P12 ("no
schema") is SUPERSEDED with a pointer here, kept verbatim — never edited; P13's "same device" becomes
"every device" once the shape is built.** **Audit the park count.**
