# ITEM 171-B — DESIGN PASS, REVISED TO NICK'S RULINGS
### PLAN desk · 2026-09-24 · **revision — 171B-Q1/Q2/Q3 answered (ledger `0c8838c`); supersedes the pass on the leans**

**His words, verbatim, relayed by Fable:**
> **Q1.** *"1. Yes, on a desktop you must select INK (unless you have a stylus connected, perhaps? But I
> don't know how that works). On a mobile device, stylus's or Apple Pens, etc., automatically activate
> the drawing surface. This should only work on Free Write mode and on Boards or inside Cards."*
> **Q2.** *"2. Right on the card."*
> **Q3.** *"3. Users should be able to draw directly on Board. If they move cards around after that, they
> can erase the INK they no longer want (which also means we need an eraser if we don't already have
> one. The eraser should be scalable, as well)."*

**171B-F1 recorded, 171B-F2 confirmed — unchanged, this pass's concern is Q1–Q3 only.**

---

## §1 · THE THREE ANSWERS, AGAINST THE LEANS THEY REVERSE

**The table below is the version this revision supersedes, kept as written because the delta IS the
story:**

| charter §Q label | the lean this pass carried | HIS RULING |
|---|---|---|
| **171B-Q1** | (A) an explicit pen armed on the board's tools, (B) a stylus accelerator | **REVERSED IN SHAPE, not in spirit: no new "arm" control. Desktop selects INK first (mouse/trackpad); a stylus draws without selecting anything, on desktop AND mobile. A finger never draws by itself.** Scoped to **Free Write, Boards, and inside Cards** only. |
| **171B-Q2** | (ii) a LOCKED PAIR via `groupId`, ink and card as two objects | **REVERSED to (i): the ink is ON the card — the card's own strokes, one object, not a pair.** |
| **171B-Q3** | (a) BOX-LOCAL — ink always belongs to a box | **REVERSED to (b): a board-wide, CANVAS-LOCAL pen.** Ink is drawn free on the board surface, independent of any card; moving a card does not move ink drawn near it; **the writer erases what no longer applies.** |

---

## §2 · Q1, REVISED — SELECTING INK IS REUSED, NOT INVENTED

**The house already has the exact control his words describe: `InkSwitch`**, Free Write's own TEXT/INK
toggle (`PageEditor.tsx`, rendered when `mode === 'journal'`). **His "you must select INK" is that
control, generalized** — not a new tools-dock "arm the pen" button, which was this desk's own invention
and is now withdrawn. **The board's tool dock and a card's own tool surface gain the SAME two-state
selector**, under item 166's R1.

**The pointer rule, stated once:**
- **Desktop, mouse or trackpad:** draws only while the surface's `InkSwitch` reads INK. Selecting TEXT
  (or its board/card equivalent) returns the surface to select-and-drag.
- **Any device, a stylus (`pointerType === 'pen'`):** draws immediately, **without** the switch reading
  INK — a side door into the same `permission` prop, exactly as this pass's prior draft proposed, except
  it is now the RULED behavior rather than an accelerator layered onto an invented control. **This is
  Fable's fill for the piece Nick left open** (*"unless you have a stylus connected, perhaps? But I don't
  know how that works"*) — **marked VETOABLE**, since it answers a question he raised, not one he settled.
- **A finger never draws by itself, on any device** — touch is always select/scroll, whether or not a
  pen has been seen this session. **This is STRICTER than `InkStratum`'s existing page contract** (which
  lets touch draw once no pen has appeared), so a board's touch handling is a new, separate rule from the
  page's — not an inheritance.

**The five collisions, restated under this rule (charter §4's acceptance test):**
1. **Select/drag while the switch reads INK, or a stylus is down: NOTHING.** Same flag, new trigger.
2. **Touch never draws**, so there is no "pen seen this session" state to track on a board at all —
   simpler than the page's own rule, not an inheritance of it.
3. **The eraser rubs out ink only — see §4.** *(Corrected from the prior draft: an erase is not "points
   cleared within a radius." It is captured as an ordinary stroke, flagged `eraser: true`, and painted
   `destination-out` at render time — `store/ink.ts`'s `widthOf` and the composite mode. Nothing is
   deleted from stored data; a later erase can be undone like any other stroke.)*
4. **Undo: one stack**, unchanged from the prior draft.
5. **The control is `InkSwitch` itself**, not a new dock button — one surface fewer to design than the
   prior draft needed.

---

## §3 · THE SCOPE CLAUSE, CHECKED AGAINST SOURCE

**His clause: *"This should only work on Free Write mode and on Boards or inside Cards."*** **Checked
against `PageEditor.tsx`'s `inkPermission`** (line 214): today, ink is **`edit`/`inert` in Free Write**
(exactly his scope) but **`movable` in Draft and Revise** — existing strokes can be dragged and grouped
there (item 126 B1: *"Once the user switches to Draft or Revise mode, INK no longer becomes directly
editable but can be moved around"*), though no NEW stroke can ever be started in either mode.

**NO CONFLICT ON THIS DESK'S READING, AND NOTHING IS REMOVED:** his clause names where the **drawing
surface activates** — where a writer can put down new ink. Draft and Revise never offered that; `movable`
only lets a writer nudge marks already made in Free Write. **Lean: `movable` in Draft/Revise stands,
untouched by this ruling**, because rearranging existing ink is not "the drawing surface" his sentence
describes.

**The alternative, named:** ink could be frozen solid (no `movable` either) outside Free Write, Boards
and Cards. **Its cost:** a writer who drew a note in Free Write and then flips to Draft could no longer
nudge a stray mark clear of a paragraph — reversing a shipped behavior (item 126 B1) that his sentence
does not ask to reverse. **This desk's lean is the first reading; the alternative is the strict one, and
it is his call if the first reading is wrong.**

---

## §4 · Q2 AND Q3, TOGETHER — THE COLLISION RULE FOR WHERE A STROKE STARTS

**Two ink populations now exist on a board, and Fable asked for the rule that keeps them from competing
for the same gesture:**

- **CARD INK (Q2):** the card's own strokes, box-local, stored on the card, moving and resizing with it
  exactly as a ported page's ink is *"re-normalized to the box"* (charter §1). **Authored only when the
  card is OPENED** — its own surface, gaining `InkSwitch` the way a page does. This is unchanged from the
  prior draft's Q2-iii; only WHAT the ink IS (one object, not a locked pair) reversed.
- **BOARD INK (Q3):** canvas-local, drawn on the open board itself, belonging to no card. **Authored only
  when the BOARD CANVAS is the active surface — nothing opened.**

**THE RULE: a stroke's population is decided by which surface is ACTIVE when the gesture starts, never by
what the pointer happens to be over.** A stroke begun on the open board, even directly above a card
sitting closed on the canvas, is board ink — the card underneath is untouched, and moving that card later
reveals the ink was never attached to it. **This is exactly his own worked example** (*"draw directly on
Board. If they move cards around after that, they can erase the INK they no longer want"*) — the example
only makes sense if the ink was independent of the card all along. A stroke can become a card's OWN ink
only by first opening the card; **there is no path from a closed card's face to that card's ink.**

**The alternative, named:** hit-test the pointer's start position against every card's rect on the board
and route a stroke that lands on a closed card's face to that card's own ink instead of the canvas. **Its
cost, beyond a hit-test on every stroke start:** it contradicts his own example directly — under this
alternative, drawing over a card and then moving the card away would take the ink WITH it, and there
would be nothing left to erase. **This desk leans against it for that reason**, not only for its cost.

---

## §5 · THE ERASER — SCALABLE, AND WHAT A HOLE DOES WHEN INK MOVES

**Today: one fixed size everywhere.** `ERASER_WIDTH = 22` (`store/ink.ts:17`) is read by `widthOf`
(`:129`) for every erase stroke's render width, **and separately hardcoded into TWO ring-preview UIs**
that must both change for "every ink surface" to be literally true: `InkStratum.tsx` (the shared
component boards and cards will use) and `JournalEntry.tsx` (Free Write's own, older inline pen/eraser
toggle — a second site, not a duplicate of the first, and easy to fix one and miss the other).

**THE LEAN: one additive optional field, the house's own grammar for exactly this** — `Stroke.eraserWidth?:
number`, written only on strokes flagged `eraser: true`. `widthOf` reads it as `stroke.eraserWidth ??
ERASER_WIDTH`, so **every existing erase on disk renders identically forever** — absence means the old
fixed size, the same law `tip`/`nib`/`ink` were added under (charter's own citation, item 121 I1). **A
size control sits beside the existing eraser toggle** on whichever surface is active (Free Write's own UI,
`InkStratum`'s dock control on boards and cards) and sets the width for the NEXT erase stroke drawn — not
a global constant, a per-gesture choice, exactly like choosing a pen's nib already is.

**⚠ BEFORE THE FIELD IS WRITTEN — a census, not an assumption (Fable):** a cost claim is measured at the
system's edge, and the edge for an additive `Stroke` field is every place that COPIES or REBUILDS a stroke
rather than reading it once and discarding it — porting ink onto a board, `strokeGroupAt`'s group-move
translate/clamp path, export, and the sync mapper's own JSON round trip are the known candidates, not the
full list. **The builder censuses every client site that constructs or clones a `Stroke` object before this
field lands**, so `eraserWidth` cannot be dropped in silence by a site that spreads a stroke's known fields
by hand instead of by reference.

**WHAT A HOLE DOES WHEN THE INK UNDER IT MOVES — the house already answered this, and this pass reuses
the answer rather than inventing one.** An erase is not a persistent hole in stored geometry; **it is a
stroke**, painted `destination-out`. Item 126 B4's `strokeGroupAt` already carries a co-located erase
stroke along with whatever ink-group it overlaps whenever that group is dragged as a unit — *"if the ink
moves and its erases stay behind, the rubbed-out parts REAPPEAR"* is the exact hazard that law exists to
prevent, and it prevents it by moving both together.

- **For CARD ink (Q2):** a card's strokes and its erases are already normalized to the SAME box-local
  space (§1). Moving or resizing the card moves and rescales both as one unit — nothing new to build; the
  hazard is already closed by the same mechanism that closes it for a ported page's ink.
- **For BOARD ink (Q3):** the hazard cannot occur, because board ink never moves — Nick's own ruling.
  There is no group-drag to carry an erase along, because there is nothing to drag. **The scenario his
  own words describe (move the card, then erase the stray ink by hand) is not the hazard; it is the
  intended use.**

---

## §6 · WHAT THIS PASS STILL DOES NOT DO

**No mockup, no code, no harness, no worktree build.** F1 and F2 remain closed inputs. **This revision
does not touch Experiment 1's separate, unrelated ledger entry** (the revised link-target shape,
`0c8838c`) — different subject, different item.
