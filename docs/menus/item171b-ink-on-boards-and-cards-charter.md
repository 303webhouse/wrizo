# ITEM 171-B — INK ON BOARDS AND CARDS
### PLAN desk · 2026-09-19 · **charter — the three questions, before any brief** · a FEATURE, not a gate

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `d87a230`. Line numbers are a courtesy.

**PRIMARY TEXT — Nick's answer 5, verbatim (typo his):**
> *"Ink needs to available, though, on  Boards and Cards."*

**FABLE's FRAMING, from INK's 171 S0:** a board **RENDERS ink it cannot author** (no pointer handler; ink
boxes arrive only by porting from a page) and **a card has no ink at all.** **So this is a feature, not a
gate: item 171 ships without it.**

**Three questions to design:** *the coordinate basis on a board (INK leans box-local); what a card's ink
IS; and how a pen shares one surface with select and drag — the last is the real one, since a board's
whole grammar is selecting and dragging.*

---

## §1 · WHAT EXISTS — the desk's read (INK's S0 is the measurement of record)

- **The authoring layer is `InkStratum`** (`components/InkStratum.tsx`), and it **mounts in ONE place:
  `PageEditor`.** Its props are the whole seam: **`permission: 'edit' | 'inert' | 'movable'`**,
  `sheetRef`, `strokes`, `onCommit`, `pen`, `eraserArmed`.
  *A board that wants ink does not need a new engine; it needs to answer those six.*
- **⛔ ITS POINTER CONTRACT IS ALREADY WRITTEN, and it decides Q3's rival in advance** — its own comment:
  > *"THE POINTER CONTRACT, decided by the INSTRUMENT and not the device … Pen first; mouse and trackpad
  > draw because the laptop is the primary target and **a surface the primary target cannot draw on is not
  > a sketch pad.** Touch draws too UNLESS a pen has been seen this session."*
  **On a page the surface is a sketch pad, so everything draws. A board is not a sketch pad by default —
  which is exactly why Q3 exists.**
- **The board renders ink and cannot make it:** `BoardInkBox` paints `box.strokes` for `kind: 'ink'`,
  sized by **`box.w * pageWidthPx`**; the types' own comment says an ink box is **"re-normalized to the box
  on port"**. **Ink arrives only through porting a page.**
- **A card has no strokes** — `Box.strokes` exists for `kind: 'ink'` only.
- **The house already pairs text and ink on a board:** **`groupId` — "links a locked text+ink pair."**
  *(A built mechanism that Q2 can reuse instead of inventing one.)*
- **⚠ COORDINATES — and a hazard with a history.** Board boxes are **fractions of `pageWidthPx` on BOTH
  axes**; page strokes are normalized to the sheet's width. **A known trap, already paid for once:
  `penStroke`'s y is a fraction of HEIGHT while a stored `StrokePoint`'s y is normalized by WIDTH — mixing
  them samples empty canvas and lets a check pass for the wrong reason.** **Ink on a board adds a THIRD
  basis** (canvas vs box), so **every driver and every renderer must name which basis it is in.**
- **⚠ AND THIS REVERSES A STANDING LAW, which is Nick's to do and the record's to say:** today **the pen
  is INERT on non-Journal surfaces** — *a stylus tap on a Page or chapter does absolutely nothing, not even
  caret placement.* **His ruling makes boards and cards places a pen works.** **Recorded as a reversal, not
  as a gap that was overlooked.**

---

## §2 · Q1 — THE COORDINATE BASIS ON A BOARD

| | what it means | the case | the cost |
|---|---|---|---|
| **(a) BOX-LOCAL** *(INK's lean, and this desk's)* | a stroke belongs to an **ink box**; its points are normalized to that box's own width — **the path `BoardInkBox` already renders** | **ink is a card like any other**: it moves, resizes, layers, copies, trashes and tags by the rules already built. **The arrangement law holds — the writer's arrangement owns the ink.** Nothing new renders. | **you cannot circle three cards with one stroke** unless the box covers them — and then the ink box sits over the cards it rings (a z-order question) |
| **(b) CANVAS-LOCAL** | strokes normalized to the canvas, living beside the boxes (an ink layer) | **it is what a whiteboard pen is for** — arrows between cards, a ring around a cluster, annotation ACROSS the arrangement | ink is then the one thing on a board that **is not a box**: it cannot be dragged, selected, copied or trashed by the board's own grammar, and **every reader of `boxes` would have to learn a second population** |

**LEAN: (a), with two rules that answer its cost:**
1. **THE SURFACE YOU START ON OWNS THE STROKE.** Starting on empty canvas **makes a new ink box** (bounds
   = the stroke's bounds + a margin); starting on a card **is that card's ink** (Q2).
2. **A STROKE THAT LEAVES ITS BOX GROWS THE BOX — it is never clipped.** *The writer's line is the truth;
   the box is bookkeeping.*
**The unmeasured risk in the lean, named:** *nobody has measured whether writers want to draw ACROSS a
board (b's whole case) or on things (a's). If it is across, (a) makes them fight the box.*

## §3 · Q2 — WHAT A CARD'S INK IS

| | what it means | the case | the cost |
|---|---|---|---|
| **(i) the card carries its own strokes** | a `'text'` card gains `strokes` — ink over its own words, as a page's ink sits over prose | **one card, one thing**: the ink moves with the card because it IS the card | a second field on a kind that never had it; **two renderers inside one box** |
| **(ii) a LOCKED PAIR** *(lean)* | an `'ink'` box locked to the card by **`groupId`** — the mechanism that already exists for exactly this | **nothing is invented**: the pair moves, deletes and copies together today; one kind per box stays true | the pair can be pulled apart by a builder who forgets the lock; **the lock is the thing to test** |
| **(iii) ink only in the OPENED card** | the card popup is the card's surface; ink is authored there and rendered on the canvas | **the canvas keeps one grammar** (select and drag) and ink authoring goes where the card is already a surface | you cannot sketch on a card where you are looking at it |

**LEAN: (ii) for what ink IS, and (iii) for where it is AUTHORED — with Q3 deciding whether the canvas also
authors.** *(ii) reuses a built lock and keeps the board's population one kind per box; (iii) gives the card
a surface with no ambiguity about what a pointer means.*
**⚠ AND UNDER ITEM 172 THIS GETS SIMPLER IN ONE PLACE: ink on a BOOK-type board's page is the PAGE's own
ink** — `InkStratum` on a page surface, already built and already ruled. **Nothing new is needed there.**

## §4 · ⛔ Q3 — HOW A PEN SHARES A SURFACE WHOSE WHOLE GRAMMAR IS SELECT AND DRAG

**This is the real one.** A board's pointer already means: *press a card to select, drag to move, drag a
handle to resize, drag from a thread point to connect, long-press on touch to drag.* **A pen that draws
must take the pointer from all of that, or be told when it may have it.**

| | how the pointer is decided | the case | the cost |
|---|---|---|---|
| **(A) AN EXPLICIT PEN, on the board's tools** *(lean)* | a control arms the pen; `InkStratum` mounts with **`permission: 'edit'`** and owns the surface until it is disarmed | **unambiguous, and it is the seam that exists** — the page already grants ink by permission. **Select and drag are untouched when the pen is down.** | **a mode to forget** — and the writer who forgets it drags nothing and draws a line instead. *(The app just retired one set of modes; this is a TOOL mode, not a view, but the word will be heard the same way.)* |
| **(B) THE INSTRUMENT DECIDES** | `pointerType === 'pen'` draws; mouse and touch select and drag | **no mode at all**, and a stylus writer never thinks about it | **a mouse writer can never draw** — and **`InkStratum`'s own contract argues against it**: *"a surface the primary target cannot draw on is not a sketch pad."* It also makes `pointerType` load-bearing, which this house has been bitten by before |
| **(C) A TRANSIENT PEN** | the pen draws ONE stroke, then the surface returns to select | **nothing to forget** | **unusable for a sketch** — ten strokes means ten arming presses |
| **(D) A HELD MODIFIER** | hold a key to draw | zero state | **no key on touch or tablet**, which is where a pen lives |

**LEAN: (A), plus (B) as an ACCELERATOR — a stylus draws without arming, a mouse must arm.** *That gives
the stylus writer no mode and the mouse writer a door, and it keeps `InkStratum`'s contract intact.*
**The unmeasured risk, named against the lean:** *two ways to start a stroke is two ways to start it by
accident, and nobody has measured how often a palm or a stray stylus tap lands on a board. `InkStratum`
already rejects a resting palm (touch is refused once a pen is seen) — that inherited defence is an
argument, not a measurement.*

**FIVE THINGS ANY ANSWER MUST ALSO SAY** — *they are where the grammar actually collides:*
1. **While the pen owns the surface, what do select and drag do?** *(Lean: nothing — the pen owns it.)*
2. **Touch, whose long-press (350ms) is already the drag gesture.** *(Lean: with a pen seen, touch stays a
   scroll — `InkStratum`'s inherited rule.)*
3. **The eraser** — `eraserArmed` exists; on a board, does an erase rub out strokes only, or can it take a
   card? *(Lean: strokes only. A card is deleted by item 168's gestures, never by rubbing.)*
4. **UNDO.** The board has **one level** (`snapshot`); ink has its own stroke history. *(Lean: a stroke is
   an undo step on the board's stack — one stack, or the writer learns two.)*
5. **WHERE THE CONTROL LIVES** — the board's tool dock, and **item 166 governs the panel it opens from.**

---

## §5 · WHAT IT TOUCHES
- **172:** ink on a **Book**'s page is the page's own ink (nothing new). On a **Default** board it is §2's
  ink box. **A type does not change what ink is — only what surface it lands on.**
- **167:** an ink card's name is its stand-in **"A sketch"**, and a blank-born ink card takes a number.
- **168:** an ink box is a card: it goes to the Trash by the same gesture and comes back the same way.
- **138:** an ink box born on a board takes a birth shape — **its stroke's bounds**, not the page-pin
  defaults; *138's rider (birth shape keys on TYPE) and this one are the same law: what is born decides
  its own shape.*
- **108:** tags on an ink card work as on any card; **the term highlight has nothing to paint in ink.**

## §6 · THE HAZARDS ANY BRIEF INHERITS
- **THREE COORDINATE BASES** (page sheet · board canvas · box). **Every driver names its basis**; the
  `penStroke`-y-vs-`StrokePoint`-y trap is the proof that a wrong basis passes quietly.
- **REAL POINTER EVENTS, with `pointerType` set deliberately** — and **release where the writer releases**
  (outside the element), asserting the surface is not left armed.
- **THE PARKED INK CHECKS THAT ALWAYS PRINTED `PASS`** (item 147's class, found in both ink harness files
  and fixed in place). *A new ink harness starts by proving its parked lines can fail.*

## §Q · FOR NICK
- **171B-Q1 — how the pen takes the board.** **Arm a pen on the tools** (lean), **let the stylus simply
  draw** while a mouse must arm (lean's accelerator), or something else? *Everything else here follows
  from this one.*
- **171B-Q2 — a card's ink.** **Ink drawn on the card** (locked to it, moving with it — lean), or **a
  separate sketch card** beside it?
- **171B-Q3 — drawing across a board.** Should a stroke be able to **ring three cards at once** (a
  canvas-wide pen), or is ink always **on a thing** (lean)?

## §F · FOR FABLE
- **171B-F1:** the pen-inert law for non-Journal surfaces is **reversed for boards and cards by Nick's
  ruling** — it needs recording as a reversal, in the record that carries it.
- **171B-F2:** this charter assumes **171-B does not gate 171**, as relayed.
