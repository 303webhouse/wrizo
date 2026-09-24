# ITEM 144 — THE PLAN MENU'S "ADD BOARD", AND NESTING AN EXISTING BOARD BY DRAG
### PLAN desk · 2026-09-24 · **amendment to `b144-plus-menu-and-unnest-amendment.md`** (which amends the three 144 briefs)

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `d115b16`. Line numbers are a courtesy.
> **⚠ THE RECORD:** chat 1's entry at `d115b16` — *"the Plan menu's 'Add Board' SETTLED BY SKIP — a default
> taken by silence, NOT a ruling."* **His question is founder text; the answer to it is a default, and this
> file says so wherever it leans on it.** **Nothing is rewritten in place;** §5 names what is superseded.

---

## §0 · HIS WORDS, AND WHAT THE RECORD DOES WITH THEM

> *"Can't we just call Plan menu's option "Add Board" too? It can be greyed out unless there is already a
> board opened"*

**Fable's catch, and it is a real one:** the Plan menu's Connect Board **moves an EXISTING board inside another
one** — so renaming it "Add Board" *and making it create a board* **removes the only door that nests an
existing board.** **The default that followed (vetoable, taken by skip): do as he says, and nest an existing
board by DRAGGING it onto another board — mirroring drag-off to un-nest (`b144-plus-menu-and-unnest`
§3).** **The earlier "Put inside…" rename is WITHDRAWN** (this desk's second/third amendment named it as the
default; it no longer is one).

---

## §1 · THE PLAN MENU'S "ADD BOARD"

- **The Plan menu's button is "Add Board"** and **does exactly what the "＋" menu's Add Board does: creates a
  NEW board inside the open one** (born in this drawer, name field focused). **One act, one name, two
  mountings, one function** — *the second time this house has been asked to build a control once and mount it
  twice (T4's `BoardConnectList`), so it is built once.*
- **It is greyed out unless a board is open** — his words. **A greyed row states its reason** (its
  accessible name and tooltip: *"Open a board to add a board to it"*) — *the house's grammar is "absent, not
  greyed" for a nonsense act, and his sentence overrides that grammar for this one row; the reason keeps it
  from being a mute grey.* **When the open subject is a PAGE, it is greyed** (a page contains nothing).
- **✅ CONFIRMED — Nick, verbatim: *"Yes, keep both"* (2026-09-24; chat 1, `9d1e6dd`) — a RULING, not pending.** **The Plan menu keeps
  "Create a Board" BESIDE "Add Board".** *The paragraph that follows was written while it was marked pending; it is kept as written.*
- **⚠ CORRECTION (Fable, 2026-09-24): THE PLAN MENU KEEPS "Create a Board" BESIDE "Add Board"** — **PENDING
  HIS ANSWER**, and **the default now with him, from his own *"keep the Plan menu controls, too"*.**
  **Why it must stay:** **"Add Board" is greyed unless a board is open, so with "Create a Board" gone
  NOTHING would make a brand-new board when none is open** — *a writer on a page, or on the Desk, could
  not start one.* **Measured today:** the row is `cascadePlanCreateBoard`, **"Create a Board"**
  (`deskLexicon.ts`; `PlanPanel` in `CascadePanels.tsx`), and it makes **an UNBORN, EMPTY board in the
  drawer, NOT nested** (`unbornHref({ kind: 'board', binderId })`). **The two rows are different acts and
  both stay:** **Create a Board = a new top-level board · Add Board = a new board INSIDE the open one.**
  **The rows sit together, in that order, and the pair is what the Plan menu offers for making a
  board.** *(Item 165's Create Board presets — Default, Worldbuilding, Storyboard — are how "Create a
  Board" grows; nothing here changes them, and "Add Board" takes no presets.)* **This desk's amendment
  above had silently assumed the rename REPLACED the row; it does not.** **~~Marked pending~~ — SUPERSEDED: he answered *"Yes, keep both"* (above).**
- **The Plan menu's "Connected Boards" list beneath it stays** (it shows what a board is inside and what is
  inside it). **What the rename retires is only the act "put THIS board inside the chosen one" from the Plan
  menu.**
- **⚠ WHAT THE RENAME COSTS, said once:** with the "＋" menu's Add Board also creating (the second amendment,
  §9), **no menu row nests an EXISTING board any more.** **Three older doors still do** — the Places panel's
  "Also connected to…" checkboxes, the Page face's "Pin to a Board…", the Shelf's "Pin to a Board…" — **and
  they are the same doors he could not find** (*"I never found a way to put a board inside of a board"*).
  **§2 exists so that the discoverable door is the drag.**

---

## §2 · NESTING BY DRAG — designed here because the default names it and the record has no design

### What exists (measured, not assumed)
- **Two drag mechanisms coexist and do not talk:** the **survey/Plan-menu rows use HTML5 drag-and-drop**
  (`CascadeSurvey`, `draggable`, `SURVEY_DRAG_TYPE`), and **cards on the canvas move by POINTER EVENTS**
  (`BoardEditor`'s drag phases). **A drop target must be written for each.**
- **The canvas's existing drop handler does a DIFFERENT act and must not be reused for this one:** it
  *displays a membership the board already has* and **explicitly ignores a payload from another board** —
  *"moving a card between boards would be CARD TRANSFER (item 123), and a display act must never quietly
  become one."* **This design uses its own payload type** (e.g. `text/wrizo-board-nest`) so the two acts can
  never share a handler. *(Item 123's copy-only rule governs CARDS' content; a nested board is a
  MEMBERSHIP — `page-pin` — and the 169 charter already records that moving one is "an unpin plus a pin and
  contradicts nothing.")*
- **Only membership rows are draggable today** (`CascadePanels`); **the board rows in the Plan menu's
  Boards list, the Drawers tree and the Shelf are NOT** — *S0 censuses every site before any is made
  draggable.*
- **Cards overlap on purpose** (`z`, layers): *dropping one card on another is a normal arrangement act
  today.*

### The rule

**SOURCES (a board being dragged):** **(S1)** a **board-card on the open canvas** (pointer drag) · **(S2)** a
**board row** in the Plan menu's Boards list, the Drawers tree or the Shelf (HTML5 drag).
**TARGETS (where it may be dropped):** **(T1)** **a board-card on the canvas** — *nest into that card's
board* · **(T2)** **the open board's own title in the nav row** — *nest into the board you are looking at*;
**T2 exists only while a board is being dragged** (a labelled drop zone that appears with the drag, so it
cannot collide with the title's click-to-rename, and adds no permanent chrome).

**THE ACT: `pinPageToBoard(source, target)` — membership only. Nothing is copied, nothing deleted, the source
board's own contents untouched.**
- **From S1 it is a MOVE within membership:** **pin into the target AND unpin from the current board** — *the
  file-into-a-folder expectation; the card leaves this canvas.* **The rival, in its strongest form — ADD
  the membership only, leaving the card here:** nothing ever disappears, so nothing can be lost. **Its
  cost:** the board is then on this canvas AND inside the target, and **the tab row draws a board once
  (T2 rule 3), so the row and the canvas disagree about where it lives.** **Lean: move, with Undo.**
- **From S2 it ADDS a membership** (there is no "here" to leave). **A board that already has another parent
  gains a second** (membership is plural by design); **it is never unpinned from the others.**

**⛔ ARMING — the accidental-nest guard (mirrors un-nest's 32px hysteresis).** Because cards overlap on
purpose, **a board-card released on another board-card must not silently nest.** **For S1, the drag ARMS
only after the pointer has HELD over a target for ~450ms** (a dwell; **an unmeasured constant** — S0 tunes
it): **the target rings and says *"Release to put <A> inside <B>"*.** **Release before the dwell = today's
behaviour, unchanged** (the card lands, may overlap). **For S2 no dwell is needed** — the drag begins
outside the canvas, so no overlap gesture exists to confuse it — **but the target still rings and names
the act.** **Hit-testing reads the POINTER's position against the target's rect — never the dragged card's
own box** (the card is under the pointer; **it and its children are excluded from the hit test**).
**The rival, named:** *a modifier key* — **no key exists on touch, which is where the long-press drag
lives;** *an explicit handle on the board-card* — **a permanent mark on every board-card for one act.**

**REFUSALS ARE SAID, NEVER SILENT** (the merged brief's own defect: *the picker returns null and closes
without a word*): **self** — *absent* (a card is not a target for itself). **An ancestor of the source** (the
drop would make a cycle — `wouldNestCycle(source, target)`): **the target shows a refusal ring reading
*"Can't go inside — it contains <A>"*, and a release there writes nothing.** **Already inside** —
*"Already inside <B>"*, inert. **A condition board (Journal, Shelf, Trash) is not a target** — *absent, not
refused* (a condition is not a place, 131(a)).

**AFTER THE DROP:** **the whisper — *"<A> is now inside <B> — Undo."*** **Undo is one level: for S1 the drag's
own start snapshot** (`startBoxes` exists for the gesture); **for S2 an unpin of the membership just
written.** **The target's board-card, if it shows a thumbnail, refreshes.** **The tab row re-derives**
(A joins beneath B, T2's order) **— no tab moves otherwise.**

**TOUCH:** the same rule after the 350ms long-press that already begins a card drag; **the dwell is the same
dwell** (a finger is not still, so the dwell tolerates ~8px of travel — *also unmeasured*).

### THE COLLISIONS, named (acceptance test — a brief that leaves one open is not decision-complete)
1. **Un-nest by drag (`b144-plus-menu-and-unnest` §3)** — *opposite acts on the same card.* **Off the canvas
   (pointer ≥32px past the edge) = un-nest; ONTO a board-card (dwell) = nest.** **They cannot both arm at
   once:** **a target ring suppresses the un-nest band and vice-versa**, and **the first to arm owns the
   release.**
2. **The Trash icon (item 168)** — **a release ON the trash icon is Delete, never a nest; the icon's drop
   state and the target ring are visibly different.**
3. **Another pane (item 169)** — **a release over another pane's canvas (not a card) is 169-Q7(c): the board
   gains a membership on THAT pane's board.** **A release over a board-card in that pane is a nest (T1).**
4. **A tab (item 169's reservation)** — **a drop on a tab does nothing here** (the tab's drag stays
   reserved).
5. **The canvas's own display drop** — **unchanged and separate** (its payload type is different, §"What
   exists").
6. **Edge auto-scroll** — **arming reads the pointer's position against the target's rect, never the scroll
   offset** (as un-nest's rule).
7. **The hard stop (item 118)** — **untouched:** nesting happens with the pointer over a card that is
   already inside the canvas; **no card leaves it.**

**The unmeasured risk, named:** *the dwell (450ms) and its 8px touch tolerance are guesses, and nobody has
measured how often a writer parks a dragged board-card over another one while merely arranging.* **The
dwell, the ring, the words and the Undo are four defences; none is a measurement.** **The safe rival — nest
only from the Places panel's checkboxes, no drag — is the smallest build, and it is the door he could not
find.**

---

## §3 · THE HARNESS — additions to `i144.mjs` (drivers never assume existence · real pointer events · select by name · release where the writer releases)

- **N1a — "Create a Board" is still present beside "Add Board"** (in that order) **and, with no board open, is enabled while "Add Board" is greyed** — *the pair is what guarantees a board can always be made;* **it makes an unborn, empty, NOT-nested board** (no `page-pin` written anywhere).
- **N1 — the Plan menu's "Add Board":** present, **greyed with its stated reason when no board is open and on
  a page**, enabled on a board; pressing it creates a **new board nested inside the open one** (a
  `page-pin` exists; survives edit + `AUTOSAVE_MS` + reload) — **the same board the "＋" menu's Add Board
  makes** (assert both go through one function's result shape).
- **N2 — nest by drag, S1:** with real pointer events, drag board-card A over board-card B and **HOLD past
  the dwell** → the ring and its words appear → release → **A is pinned in B and unpinned from the current
  board; the whisper's Undo restores both.**
- **N3 — the release before the dwell:** the card lands, overlaps, **nothing is written.**
- **N4 — S2:** drag a board row from the Plan menu onto board-card B → **a membership is added to B; no other
  membership removed.**
- **N5 — T2:** drag a board row → the nav-row drop zone appears **only during the drag**, and is absent
  after; a release on it nests into the open board.
- **N6 — the refusals:** an ancestor target shows *"Can't go inside — it contains …"* and **a release writes
  nothing**; an already-inside target says so; **a condition board is not a target.**
- **N7 — the collisions:** release on the **trash icon** → deleted per 168, **not** nested · off the canvas
  → **un-nest, not nest** · over another pane's canvas → **169-Q7(c) membership, not a nest**.
- **N8 — the hit test excludes the dragged card** (assert the target found is B, never A) — *a check that
  passes because the card hit itself would pass for the wrong reason.*
- **N9 — no schema:** **no column, table or `sync.ts` mapper touched** (membership is the existing
  `page-pin`); **the survey's SURVEY_DRAG_TYPE handler is byte-untouched.**
- **PARKS:** the amendment's **P9 ("three rows")** and any check asserting **"Put inside…"** are
  **SUPERSEDED with a pointer here, kept verbatim — never edited; audit the park COUNT, not the pass/fail
  line.**

---

## §4 · TOOLS' BUILD ORDER, and what this does not gate
**Not gated by this file:** the "＋" menu, Add Board (both mountings), Unlink, the back arrow, the recents
list. **This file gates only the drag** (§2), **which can land after the rest** — *a builder who ships the
menu first loses no door: the three older ones remain until the drag lands.* **Still gated on TOOLS' S0
shape report clearing Fable's review:** what "beside" STORES (unchanged from the third amendment).
**Merge order stays: 144 after FIX's 160** (both edit `BoardEditor.tsx`) — *and §2's S1 edits the same
drag code, so the drag lands after 160 by the same reason.*

## §5 · WHAT THIS SUPERSEDES — marked, never erased
- **`b144-plus-menu-and-unnest-amendment.md` third-amendment marker (3)** — *"the Plan menu's Connect Board
  becomes 'Put inside…'"* → **WITHDRAWN; the Plan menu's button is "Add Board" (§1).** **§9.3's "two Connect
  Boards, opposite directions" collision DISSOLVES:** the Plan menu no longer has a Connect Board that moves
  the current board, so the "＋" menu's **Connect Board (beside)** is the only one.
- **The merged board-tabs brief's T4 "one list, two mountings … the Plan panel's Connect Board runs the other
  way"** → **superseded for the Plan panel** (§1); the tabs' side stands as the second amendment has it.
- **§1's implication that the rename REPLACES "Create a Board"** → **corrected: both rows stay (§1's correction), pending his answer.**
- **Unchanged:** Unlink, un-nest by drag, the back arrow, the three-row "＋" menu, the recents list, the
  pane rule, and the storage gate.
