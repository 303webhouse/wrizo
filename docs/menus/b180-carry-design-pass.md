# ITEM 180 — THE CARRY: DESIGN PASS ON THE LEANS
### PLAN desk · 2026-09-24 · **design pass — written on the leans while 180-Q1/Q2/Q3 are with Nick** · reads with `b180-drawer-gesture-charter.md`, `vw2-rows-amendment.md`, `b168-deletion-charter.md`

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `5011234`. Line numbers are a courtesy.
> **⚠ 180-Q1, Q2 and Q3 are not answered as this pass is written.** Fable relays them; this pass **does not wait** —
> it works the gesture out on the charter's leans and **marks exactly what each answer would change (§6).**
> **Nothing here is a brief, nothing gates a builder, and there is no mockup:** *the charter's own rule — the
> cancel decides whether this gesture exists on a tablet at all.* **Status: Fable's default on 180-Q1
> (*"a tablet carry cancels by tapping anywhere that isn't a drawer"*) is a VETOABLE DEFAULT, not his word, and is
> designed in below as the touch path.**

---

## §0 · HIS SENTENCE, AND THE READING THIS PASS TAKES

> *"Shelf needs an obvious option to put a Page or Board into a drawer as well as the ability to drag the
> thumbnail to the "Drawer" rail menu icon, which should open the Drawers menu and allow the user to choose
> a drawer to add the doc to while the cursor holds the doc (right clicking should ex-out the cursor document
> hold)."*

**The reading that makes every word true — and it is a READING, named as one:** *"while the cursor **holds** the
doc"* means **the doc stays attached to the cursor AFTER the drag reaches the icon** — the writer does not have
to keep a button down while choosing. **That is a picked-up mode, not a drag in progress.** *(A drag whose
button is held while a menu is aimed at is ordinary drag-and-drop and needs no "hold" and no cancel gesture at
all; his right-click exit only means something if no button is down.)* **The rival reading — a single unbroken
drag, released on a drawer row — is supported too (§1, door B) and costs nothing extra.**

## §1 · THE CARRY IS A MODE: `placing <thing>`

**One state, three doors in, several exits.** *(This is what unifies "the obvious option" and "the carry": they
are the same mode entered two ways.)*

**State: `placing { kind: 'page' | 'board', id }`** — **held by the app, not by the pointer.** **While it is set:**
- **the Drawers menu is open** and **every drawer row is a landing place** (it says so on hover/focus: *"File
  "Chapter 3" in Novel"*); **nothing else on screen is a target** *(the charter's rule: a carry with many possible
  endings is a drag)*;
- **a chip names what is being carried** — *"Carrying "Chapter 3" — ✕"* — **inside the Drawers panel's head**
  (item 166: it is part of the panel, not a floating layer);
- **on a pointer device a ghost of the thumbnail follows the pointer** (a transient layer — 166's guideline
  class of transient surfaces, not a panel).

### THE THREE DOORS
- **(A) DROP ON THE ICON → carry mode.** *The pointer drag from a Shelf row ends ON the Drawers rail icon: the
  release does not file anything; it sets `placing`.* **The icon becomes a drop target that receives the drop —
  and, unlike the Trash icon, does not consume it** (the charter's rule: some icons consume a drop, others open
  and keep the hold).
- **(B) ONE UNBROKEN DRAG.** *Hover the icon during the drag → the menu opens (after a short dwell, so a
  drag merely passing over the rail opens nothing) → keep dragging onto a drawer row → release = lands.* **No
  carry mode is entered; the ordinary drag lands directly.**
- **(C) THE OBVIOUS OPTION — "Put in a drawer…"** on the Shelf row *(his first half)*: **it sets the SAME
  `placing`**, with no ghost (there is no pointer gesture to continue). **This door is also the KEYBOARD path
  and the SCREEN-READER path** — *a pointer nicety must never be the only way to do the act.*

### THE EXITS
- **LAND:** press/Enter a drawer row → **the existing filing act, no new write path** (§4) → **the mode ends.**
- **CANCEL:** **right-click** *(his word — and it works BECAUSE the mode has no button held: a right-click during
  a native drag is EXPECTED not to be delivered as a `contextmenu` event — **UNMEASURED, §5** — so the
  right-click cancel is designed as a property of CARRY MODE, not of door (B))* · **Escape** *(also cancels door (B)'s native
  drag)* · **the chip's ✕** *(visible, and the touch/pen path — 180-Q1's lean)* · **on touch/pen only: a tap
  anywhere that is not a drawer row** *(Fable's vetoable default — §6).*
- **RELEASE/PRESS ON NOTHING, ON A POINTER DEVICE, DOES NOT CANCEL** *(the charter: the hold is the point; the
  menu is open because a choice is being made)* — **so the ghost is never lost to a stray click.** *Only a
  cancel cancels.* **The touch tap-away is the one deliberate exception, and it is confined to touch because a
  finger has no other exit** *(§6, Q1)*.

## §2 · WHAT IT REUSES, AND THE ONE THING IT MUST NOT

- **Two drag mechanisms exist and neither is a carry** (charter §2): **the board canvas's pointer drag** and **the
  survey/list rows' HTML5 drag** (`SURVEY_DRAG_TYPE`). **The Shelf's rows (VW2 rows amendment) are list rows →
  HTML5 sources.** **HTML5 drag ends at the drop — and a `drop` on the icon is exactly the event door (A) needs;
  the carry mode begins AFTER the native drag has ended,** *so the ghost that follows the cursor is the app's own
  (window-level `pointermove`, no button), not the browser's drag image.* **That is why the design can hold "the
  cursor holds the doc" without fighting the browser.**
- **The rail icon must accept `drop`** *(today it accepts none — charter §2)*: **`dragover`+`drop` handlers on the
  Drawers icon, and `dragenter` with the dwell for door (B).**
- **⛔ IT MUST NOT SHARE A PAYLOAD TYPE OR A HANDLER WITH 168's TRASH DROP OR 144's NEST DROP.** *Three drags now
  start from list rows — delete (168), nest (`b144-add-board-and-drag-to-nest`), carry (this) — and the house's own
  warning is in `BoardEditor`'s drop handler: "a display act must never quietly become" another act.* **Each has
  its OWN payload type** (e.g. `text/wrizo-carry`), **and the row's `dragstart` writes them all, so ONE drag can
  end on any of the three targets** *(the rail's Trash icon → delete; the Drawers icon → carry; a board-card →
  nest)* **— the TARGET decides the act, the source carries every payload it may lawfully mean.** **A source that is
  not carriable (a card, a Journal/system board) simply omits the carry payload**, so *the Drawers icon does not
  light for it.*

## §3 · THE COLLISIONS, NAMED (the acceptance test — a brief that leaves one open is not decision-complete)

1. **168's Trash icon, one drop away** *(rail foot).* **Delete and Carry must never be confusable:** **the Trash icon
   shows its drop state only while the pointer is over it; the Drawers icon shows "armed" only while a carriable
   thing is over it and never for a non-carriable one.** **A mis-release on the Trash deletes — restorably (168's
   ruling: Restore names its destination, Delete Permanently is a Trash act).** *That cost is accepted by the
   ruling, and is the reason both icons sit far enough apart to be aimed at (S0 measures the gap at 1100).*
2. **Item 166 — the Drawers menu opening under a carry is a PANEL** and **obeys the guideline** *(beside when the
   margin holds it; overlay on a shrunk window; the page never moves).* **A carry that opens a panel over the
   Shelf row it came from must not cover the ghost's source in a way that strands the writer — *the chip is in the
   panel, so the mode is always visible.***
3. **Right-click (item 168's future right-click menu).** *That menu opens on things, not during a carry.* **While
   `placing` is set, `contextmenu` is CAPTURED FIRST and means cancel; when it is not set, it opens the thing's
   menu as 168 designs.** **One handler, two states — never two handlers racing.**
4. **The 350ms long-press that already begins a canvas drag on touch.** **A Shelf row on touch has no canvas drag;
   its drag begins by the same long-press so a scroll is never mistaken for a pick-up** *(and below the drag
   threshold it is still a click — the charter's rule).* **The touch path to the Drawers icon is drag-and-release
   (door A) — a finger holds the ghost natively — or the row's button (door C).**
5. **The Journal's own list and the Plan menu's rows** *(future sources).* **The source is a parameter**
   (`placing { kind, id }`), **not a special case** — *ship it where he asked (the Shelf); the mode does not know
   where the row came from.*
6. **A Book board** may be carried like any board; **a drawer holds boards and pages, not surfaces** *(172)* — **the
   drawer rows that cannot hold the thing are ABSENT, not greyed.** **System boards are never carriable.**

## §4 · THE ACT — reuse, do not invent
**Filing already exists** (`AddToSheet`'s "Move to…"; the charter measured it). **The carry calls that act, and
S0 names which store function it is** *(a page and a board are `journal_entries`; filing sets their `projectId`
and clears `shelved` — **this desk has NOT verified the exact write and does not assert it**).* **Two consequences
the builder must not discover:**
- **A filed page LEAVES the Shelf** (it is no longer unfiled) — **its row leaves the Shelf in place**, *not by
  reflow that shoves the next row under the pointer* (the Shelf view is behind an open panel and the writer
  will pick up the next row at once).
- **Nothing here touches `pinPageToBoard`** — *"a drawer is never a member of anything"* (PW2's ratified clause):
  **filing is not membership.**

## §5 · WHAT REMAINS OPEN AFTER THIS PASS (and is not this desk's to close)
- **The right-click-during-carry is UNMEASURED.** **S0 owes one probe in Edge and Electron 31:** *in carry mode
  (no button held), does `contextmenu` fire on a right-click, is it cancelable, and does anything else swallow
  it?* **This desk has launched nothing and holds no box turn.** **Also unmeasured:** *the dwell (~300ms), the
  gap between the Trash and Drawers icons at 1100, and whether a native drag can be driven by the harness's
  real-pointer driver at all* (the suite's PW1 S3 drag helper is the precedent — S0 reads it before promising a
  check).

## §6 · WHAT EACH OPEN QUESTION WOULD CHANGE — the marking

| question | the LEAN this pass is built on | if it comes back the other way |
|---|---|---|
| **180-Q1 — touch/pen have no right-click** | **a visible "stop carrying" ✕ in the chip, and on touch a tap on a non-drawer cancels** *(Fable's default; the charter's lean is the ✕)* | **"MOUSE-ONLY FOR NOW":** *the chip's ✕ and the touch tap-away are deleted; door (A) and (B) are disabled on touch (a finger cannot start a Shelf-row drag to the rail);* **door (C) — "Put in a drawer…" — is the ONLY touch path and is built in full** *(it needs no cancel: the panel has its own close).* **Nothing else in §1–§4 moves.** **The unmeasured risk sits on the lean:** *tap-anywhere-cancels can cancel by accident on a small screen where a drawer row is near the edge* — **a drawer row's hit target must be padded, and S0 measures at 768px.** |
| **180-Q2 — the option's words** | **"Put in a drawer…"** | **a one-line lexicon edit** *(the term is one entry, one term per surface)*; **no structural change.** |
| **180-Q3 — after it lands** | **the Drawers menu STAYS OPEN** *(file several)* | **CLOSES on the first landing:** *the mode ends and the panel closes with it; §4's "the row leaves in place" no longer matters (the writer re-opens to file the next).* **A one-line behaviour change; the rest stands.** |

## §7 · THE CHECKS OWED (standing laws: drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name · **release where the writer releases** · **park, never edit; audit the park COUNT**)
1. **Door C:** the Shelf row's "Put in a drawer…" sets `placing`; the panel opens; the chip names the thing; **pressing a drawer files it and the row leaves the Shelf.**
2. **Door A:** drag a Shelf row and **release ON the Drawers icon** → nothing is filed; `placing` is set; the ghost follows a pointer that has NO button down; **a click on a drawer row files it.**
3. **Door B:** hover the icon mid-drag (past the dwell) → the menu opens; **release on a drawer row files it, with no carry mode entered.** **A drag that merely PASSES over the rail opens nothing.**
4. **Every exit, each asserted to leave nothing stuck:** right-click · Escape · the ✕ · **a click on nothing does NOT cancel on a pointer device** · **a tap on a non-drawer cancels on touch.** **After each, `placing` is unset, the ghost is gone, and the Shelf row is still there, unfiled.**
5. **`contextmenu` while `placing` is CANCEL, and while NOT `placing` it opens the thing's menu** *(one handler, two states)*.
6. **Collisions:** a release on the **Trash icon** deletes (168), never carries · **a non-carriable source (a card, a system board) does not light the Drawers icon** · **each drop target's payload type differs and no handler is shared.**
7. **The panel obeys 166's guideline** *(its rect never intersects the page's when the margin holds it; the page's rect is byte-identical in both regimes).*
8. **Drawer rows that cannot hold the thing are ABSENT, not greyed.**
9. **Keyboard/screen reader:** door C is reachable and completes the whole act with no pointer.
10. **No new write path:** *the carry's landing calls the same store function as "Move to…"* — **asserted by spying on the seam, not by reading the DOM.**
11. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

**§8 · What this pass does NOT do.** No mockup (the charter's rule stands). No code, no harness, no build. It
**does not answer 180-Q1, Q2 or Q3**; it marks what each would change.
