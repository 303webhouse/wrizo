# ITEM 171-B — DESIGN PASS ON THE LEANS
### PLAN desk · 2026-09-24 · **design pass — written on the leans while 171B-Q1/Q2/Q3 are with Nick**

> **⚠ 171B-Q1, Q2 and Q3 are not answered as this pass is written.** Fable relays them to Nick today, by
> their own numbers, in the charter's §Q. **This pass does not wait on the answer** — it works out the
> build on the charter's own leans, and marks exactly what changes if 171B-Q1 — *the hinge, "everything
> else here follows from this one"* — comes back differently. **Nothing here is a brief; nothing here
> gates a builder.** Read `item171b-ink-on-boards-and-cards-charter.md` first — this pass does not repeat
> its measurements, only its leans.

**171B-F1 is recorded** (the pen-inert reversal, ledger `d74a61b`). **171B-F2 is confirmed** (171-B does
not gate 171-A). Neither is this pass's concern.

---

## §1 · THE THREE LEANS THIS PASS ASSUMES

| charter §Q label | what it decides | the lean |
|---|---|---|
| **171B-Q1** *(the hinge — charter's internal §4/"Q3")* | how a pen shares the board's surface with select-and-drag | **(A) an explicit pen, armed on the board's tools**, plus **(B) as an accelerator — a stylus draws without arming, a mouse must arm** |
| **171B-Q2** *(charter's internal §3/"Q2")* | what a card's ink IS | **(ii) a LOCKED PAIR** via `groupId` for what ink IS; **(iii) authored only in the OPENED card** for where it is drawn |
| **171B-Q3** *(charter's internal §2/"Q1")* | the coordinate basis on a board | **(a) BOX-LOCAL** — a stroke belongs to an ink box, normalized to that box's own width |

---

## §2 · THE BUILD SHAPE UNDER THE LEANS

**Mounting.** `InkStratum` mounts on the board canvas exactly as it mounts on a page today, with
`permission` as the seam Q1 already names. **Armed** (a tools-dock control, per the acceptance test's
item 5) sets `permission: 'edit'`; **disarmed** sets `permission: 'inert'`. **Lean B's accelerator is a
second path into the same prop**, not a second engine: a `pointerdown` with `pointerType === 'pen'`
requests `'edit'` for that gesture without touching the armed toggle's own state, and releases back to
whatever the toggle says when the stroke ends. **The toggle is the source of truth for mouse and touch;
the stylus has a side door that never changes the toggle's displayed state.**

**Where a stroke lands (Q1's rule 1, §2 of the charter).** The surface under the `pointerdown` decides:
empty canvas births a new ink box (bounds = stroke bounds + margin, Q3's box-local shape); a card already
under the pointer routes the stroke to **that card's locked ink pair** (Q2-ii), creating one via `groupId`
on first stroke if none exists yet. **A stroke that grows past its box grows the box** (charter's rule 2)
— this holds regardless of which surface it started on.

**The five collisions, resolved under lean A:**
1. **Select/drag while the pen owns the surface: NOTHING.** `permission: 'edit'` on `InkStratum` is the
   same flag that already suppresses the page's own text-selection handlers; the board's pointer handlers
   check the identical flag before dispatching a select or a drag start.
2. **Touch, with a pen seen this session: stays a scroll/long-press, never a stroke.** Inherited from
   `InkStratum`'s own contract (§1 of the charter) — no new rule, one flag shared across page and board.
3. **The eraser rubs out strokes only.** `eraserArmed` clears points within its radius; a card is never
   removed by an erase gesture — deletion is item 168's drag-to-Trash, a different control entirely.
4. **Undo: one stack.** A committed stroke pushes the board's own `snapshot` history, exactly as a card
   move or resize does today. A writer undoing a stroke and undoing a drag use the same key and the same
   mental model.
5. **The control lives in the board's tool dock**, sized and placed under item 166's R1 (size to the
   margin) — no new panel column, no exception to the one-panel-per-side law.

**Q2's popup authorship (iii).** The card's opened view is a surface exactly like a page — `InkStratum`
mounts there too, at `permission: 'edit'` unconditionally (opening the card is itself the arming act, so
there's no toggle to forget). **On the closed canvas, the card's ink RENDERS** (as `BoardInkBox` already
paints ported strokes) **but is never authored there** — Q3's the-real-question intersects here at zero
cost, because a card's own ink pair is Q2's box, not the canvas's, so §2's coordinate basis question
(canvas-wide ring vs on-a-thing) never arises for a card's own ink.

---

## §3 · WHAT 171B-Q1 WOULD CHANGE

**This is the marking Fable asked for.** The lean is (A)+(B)-accelerator. Naming the delta for each rival
the charter itself scored, against the shape in §2 above:

| if 171B-Q1 rules... | what §2 changes |
|---|---|
| **(B) alone — the instrument decides, no arming control** | **§2's "mounting" section loses its toggle entirely.** `permission` becomes a pure function of `pointerType` per gesture; there is no persistent armed/disarmed state and **the tools-dock control in collision 5 is deleted, not built.** A mouse writer permanently loses the ability to draw — the charter's own objection stands, and it is this pass's objection too: nothing else in §2 needs a mouse-drawing path if this is picked, which is the whole cost. |
| **(C) a transient pen — one stroke, then back to select** | **§2's mounting gains a THIRD transition**: `'edit'` → one committed stroke → forced return to `'inert'`, driven by `onCommit` rather than a pointer or a toggle. Collision 4 (undo) is unaffected; collision 1 barely matters because the window is one stroke wide. **A sketch of ten strokes costs ten re-arms** — the charter's own cost, and it falls hardest on Q2's popup authorship, which would need its OWN exemption from the transient rule (opening a card is not "one stroke") or lose the convenience §2 gives it for free under lean A. |
| **(D) a held modifier — hold a key to draw** | **§2's mounting drops the tools-dock control (collision 5 has nothing to point at) and gains a keydown/keyup listener instead**, scoped to the board canvas. Collision 2 (touch) is unanswered by the charter itself under D — *"no key on touch or tablet"* — so §2's touch line would need a **second, separate rule** for touch that (A) does not need, because (A)'s tools-dock control works identically for every pointer type. |

**The unmeasured risk stays where the charter put it**, regardless of which rival is chosen: nobody has
measured how often a stray stylus tap or a resting palm would arm a stroke by accident on a board full of
cards to select and drag. **`InkStratum`'s inherited palm defence (§1 of the charter) is inherited by every
option above except (D)**, which has no pen-vs-touch discrimination question to defend against in the
first place — its risk is the missing touch rule, not a false arm.

---

## §4 · WHAT THIS PASS DOES NOT DO

**No mockup.** The charter names the coordinate-basis hazard (§1's three bases) as a driver/renderer
concern, not a drawing one — a picture would show one basis and imply an answer to 171B-Q3 nobody has
given yet. **No harness, no code, no worktree build** — docs only, per the desk's standing law. **Does not
re-open F1 or F2** — both are settled and this pass treats them as closed inputs.
