# ITEM 180 — THE DRAWER GESTURE: THE CARRY
### PLAN desk · 2026-09-22 · **charter** · one gesture family with item 168

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `33d352e`.

> **✅ PRIMARY TEXT — Nick's own words** (`55cf81c`, part 3d), **pasted by him and byte-checked.**

> *"Shelf needs an obvious option to put a Page or Board into a drawer as well as the ability to drag the
> thumbnail to the "Drawer" rail menu icon, which should open the Drawers menu and allow the user to
> choose a drawer to add the doc to while the cursor holds the doc (right clicking should ex-out the
> cursor document hold)."*

---

## §1 · HIS SENTENCE CONTAINS TWO THINGS, AND ONLY ONE IS NEW

1. **AN OBVIOUS OPTION** — a plain control on the Shelf: *put this Page or Board into a drawer.* **The act
   already exists** (filing sets the thing's drawer; `AddToSheet` already offers "Move to…"). **What is
   missing is a door where a writer looks for it.** *Ordinary work.*
2. **⛔ THE CARRY — and this is a NEW INTERACTION MODEL for this app.** *Drag the thumbnail onto the
   Drawers rail icon → the Drawers menu OPENS → **the cursor keeps holding the doc** → choose a drawer →
   it lands. Right-click ex-outs the hold.*

> **THE RULE THE CARRY ADDS, stated once: SOME RAIL ICONS CONSUME A DROP; OTHERS OPEN AND KEEP THE HOLD.**
> **The Trash consumes** (item 168: release on it and the thing is deleted). **The Drawers icon opens and
> keeps the hold** (release on it and you are still carrying, now with a menu to choose from).
> *Two members, named. An icon is a drop target ONLY when its meaning is a destination.*

## §2 · WHAT EXISTS — the desk's read
- **The Drawers rail icon exists** (`Cascade.tsx`, `{ id: 'drawers', labelTerm: 'drawerPlaceDrawers' }`) as
  a plain category button; **it accepts no drops.**
- **Two drag mechanisms exist and neither is a carry:** the board canvas's **pointer drag with capture**
  (release resolved by `document.elementFromPoint`), and the survey rows' **HTML5 drag**
  (`SURVEY_DRAG_TYPE`). **Both end at the release.**
- **`onContextMenu` exists twice in the whole app**, and both open a row's `⋯`. **Right-click as a CANCEL
  is new**, and it must not collide with item 168's future right-click menu (*which opens on things, not
  during a carry*).
- **Item 168 already charters the sibling gesture** (drag onto the Trash icon). **One mechanism, fixed as a
  class** — *chat 1's own note: a drag onto an icon is one gesture family.*

## §3 · THE CARRY, DESIGNED
**STATES: idle → carrying → landed (or cancelled).**
- **PICK UP:** a drag that begins on a Shelf thumbnail. **Below the drag threshold it is still a click** —
  the writer's press must not become a carry by accident.
- **WHILE CARRYING:** a **ghost of the thumbnail follows the pointer**; the Drawers icon is **marked as
  armed**; **the Drawers menu is open**; **every drawer row is a landing place** and says so on hover.
  *Nothing else on screen is a target — a carry with many possible endings is a drag.*
- **LAND:** press a drawer → **the thing is filed there** (the existing act; **no new write path**) → the
  ghost resolves into the row → the menu stays open, or closes. *(Which, is 180-Q3.)*
- **CANCEL:** **right-click, per his words** · **Escape** · *and see 180-Q1 for touch, which has neither.*
- **RELEASE ON NOTHING:** pressing away from a landing place **does not cancel** — *the hold is the point;
  the menu is open because a choice is being made.* **Only a cancel cancels.**

## §4 · WHAT IT MAY CARRY, AND FROM WHERE
**His sentence: a Page or a Board, from the Shelf.** **This charter designs the carry so the SOURCE is a
parameter, not a special case** — *the Shelf is where he asked for it; the gesture should not have to be
re-invented for the Journal's list or the Plan menu's rows when he asks next.* **Ship it where he asked.**

## §5 · WHAT IT TOUCHES
- **168:** same family, opposite rule (consume vs hold). **The two are designed together or they diverge.**
- **166:** the Drawers menu opening under a carry is **a panel** — *it obeys the law like any other.*
- **172:** a **Book** may be carried like any board; **a drawer holds boards and pages, not surfaces.**
- **"A DRAWER IS NEVER A MEMBER OF ANYTHING"** (PW2's ratified clause) — *filing is not membership; the
  carry files, it does not pin.* **Nothing here touches `pinPageToBoard`.**

## §Q · FOR NICK
- **⭐ 180-Q1 — TOUCH AND PEN HAVE NO RIGHT-CLICK.** Your cancel is a right-click. On a tablet there is
  none. **Should the open menu carry a visible "stop carrying" affordance** *(lean — a gesture whose only
  exit is a mouse button has no exit on a tablet)*, **or should the carry be mouse-only for now?**
- **✅ 180-Q2 — RULED by Nick, 2026-09-24: *"Instead of "Put in a drawer," let's go with "File Page.""* — the Shelf row's button reads "File Page" (see `b180-carry-design-pass.md`).** *The lean below is kept as written.*
- **180-Q2 — the obvious option's words.** On a Shelf row: **"Put in a drawer…"** (lean), or your own
  wording?
- **180-Q3 — after it lands.** Does the Drawers menu **stay open** so the writer can file several things
  (lean), **or close** on the first landing?

## §CLOSE
**Not built here. No mockup until 180-Q1 is answered** — *the cancel decides whether this gesture exists
on a tablet at all, and a picture drawn before that would answer it by omission.*
