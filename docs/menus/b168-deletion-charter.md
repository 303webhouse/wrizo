# ITEM 168 — DELETION: THE DRAG TO THE TRASH, AND THE REMOVE / DELETE MENU
### PLAN desk · 2026-09-19 · **charter — both halves** · ties to VW4 · **absorbs item 160's Remove**

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4600d7f`; the notes at `b807f59`. Line numbers are a courtesy.

> **⚠ PRIMARY TEXT — PENDING NICK's ONE-WORD CONFIRMATION.** His CARD NOTE, **transcribed verbatim by
> Fable from his screenshots**, recorded at `b807f59`. **Chartered to those words.** If his confirmation
> changes a word, this charter is re-checked.

**THE CHARTER — Nick's CARD NOTE, verbatim:**
> *"Also, The "Remove" button at the top of the Board moves the Board down when a card is clicked on.
> That Remove option should be removed from the Board surface. If a User wants to delete a Board, Page,
> or Card, they should be able to just drag the surface into the trash icon in the corner. Also, we will
> create a right-click menu that can also include a Remove or Delete option."*

**Fable:** *"charter both, and tie the drag to VW4's Trash so a dragged thing lands where Empty Trash can
find it."* **His words assign the two verbs to the two gestures: THE DRAG DELETES** (*"If a User wants to
delete … drag … into the trash icon"*); **THE RIGHT-CLICK MENU carries Remove or Delete.**

---

## §1 · WHAT EXISTS — the desk's read at `4600d7f`

| thing | how it is deleted today | where it goes |
|---|---|---|
| **a page** | **NO DELETE CONTROL ANYWHERE.** Only automatic: an empty, untouched page on unmount; a QuickSprint discard | Trash (`deletedAt`) |
| **a board** | Plan row `⋯` → Delete → *"Delete this board? This cannot be undone."* → `softDeleteEntry` | Trash (`deletedAt`) |
| **a card** | select → the action row's **Remove** (`removeSelected`) — **filtered out of `boxes`**, one level of Undo | **nowhere — it vanishes** |
| **a page card / board-card** | the same Remove — **ends the membership**; the page or board is untouched | — |

- **The Trash is a system board**: `reconcileSystemBoard` pins every soft-deleted page and board; **Restore**
  clears `deletedAt`. **VW2's Trash view and VW4's Empty Trash are briefs, unbuilt. No hard delete exists
  anywhere** (`emptyTrash` is not a function in the codebase).
- **The trash icon** is the rail foot's button (`.wz-strip-foot`, `data-category="trash"`). **It accepts no
  drops.**
- **Canvas drags are pointer events with pointer capture** on `.board-canvas`; **the release target is found
  with `document.elementFromPoint`** (as `finishThreadDrag` and `onDoubleClick` already do). HTML5 drag
  exists only on the survey's rows.
- **Right-click:** two handlers, both opening a row's existing `⋯` (`SurveyThumb`, `BoardConnectedRow`).
  **None on the canvas or its cards.**

### ⚠ THREE FINDINGS, FROM THE CODE — not reproduced
1. **THE CONFIRM MAKES A FALSE PROMISE.** *"This cannot be undone"* guards a **soft delete that the Trash
   restores.** *A promise of permanence on a reversible act is the opposite of VW4's whole premise — that
   Empty Trash is **the one** act with no undo.* **Fix-class; routed here because 168 owns the words.**
2. **A DELETED PAGE STAYS ON EVERY BOARD.** `BoardPinBox` reads the page **deleted-inclusive** — on purpose,
   so the Trash board can show real titles — **so on a user board a deleted page's card still renders with
   its real title, looking untouched, and double-click does nothing** (travel reads live-only). **Drag a
   page card to the Trash, and the card you dragged would appear to stay.** §3(c) answers it.
3. **ITEM 160 WOULD REMOVE THE LAST DOOR.** The action row's Remove is **the only way to take a card off a
   board.** *The CD3 precedent governs:* **"do NOT remove the Board's Done before its replacement lands."**
   **And Remove does TWO jobs today, with TWO successors:** for a card it deletes (**the drag replaces
   that**); for a page card or board-card it ends a membership (**the right-click menu replaces that** —
   the drag, under his words, deletes). **So 160 waits for the successor of each job it takes away** (§6).

---

## §2 · THE TWO VERBS — defined once, for every thing

> **DELETE — the thing goes to the Trash.** Soft, restorable; **Empty Trash is the only permanent act**
> (VW4).
> **REMOVE — a membership ends; the thing is untouched.** A page leaves this board; a board leaves its
> parent.

| thing | Remove | Delete |
|---|---|---|
| **a card** (text or ink) — *one home, the board* | — **(removing it IS deleting it)** | → Trash **(new — §3(b))** |
| **a page card** on a board | the page leaves **this** board | **the page** → Trash, from everywhere |
| **a board-card** on a board | the board leaves **this** board | **the board** → Trash |
| **a page or board in a list** | — | → Trash |

## §3 · THE DRAG — onto the trash icon at the rail's foot

**The icon becomes a drop target:** it shows a drop state while something droppable is over it; **a
release on it is the act; a release anywhere else is whatever the drag already did** (a move).

**Sources, v1:** **everything on a canvas** (cards, page cards, board-cards — the existing pointer
machinery, the drop found by `elementFromPoint`) · **the survey's rows** (already draggable). **Not the
tabs** — item 144 reserves a tab's drag for item 169 (*open beside*).

### (a) ⚖ THE FORK — a PAGE CARD dragged to the Trash (168-Q1)
**His words give the drag one meaning — delete.** A page card on a board is the one source where that
meaning can surprise — **and where a surprise costs most** (a chapter deleted from every board when its
card was meant to leave one).

| | the drag… | its case |
|---|---|---|
| **(i)** | **deletes the page** | **one icon, one meaning** — a page is a page wherever it is dragged from; every deletion is restorable, so a wrong guess costs one Restore; nothing asks, ever |
| **(ii)** | **removes the card** from this board | it acts on **the object the writer was holding** |
| **(iii)** | **asks at the drop** — two choices beside the icon: *"Remove from Characters"* · *"Delete the page"* | **asks WHAT, not whether** — and only for the one ambiguous case |

**LEAN: (i) — HIS WORDS.** The drag deletes; **Remove lives in the right-click menu**, where he put it;
every deletion is restorable, and **item 168's own rule (§3(c)) brings the page back with every card where
it was.** *Its unmeasured risk, named against it: nobody has measured how often a writer drags a page card
toward the corner meaning "off this board" — and until the right-click menu exists, the drag is the only
act on offer, so that writer has no other gesture to reach for.*
**⚖ (iii) IS THE RIVAL, IN ITS STRONGEST FORM:** *the one ambiguous case is also the costliest mistake;
asking **what** (never **whether**) at the moment of the act costs one press and cannot delete a chapter
by accident — **and it gives Remove a door before the right-click menu exists**, which is what lets item
160 land early (§6).* **If Nick prefers it, it is a small build on top of (i).** **(ii) makes the icon mean
two things depending on where you picked something up.**
**A board-card follows the same ruling** (under (iii): *"Remove from Characters"* · *"Delete the
board"*).

### (b) CARDS IN THE TRASH — the tie to VW4 (168-Q2)
**Today a removed card vanishes.** For a dragged card to land **"where Empty Trash can find it"**, cards
must be trashable:
- **`Box.deletedAt?`** — additive, in `boxes` (jsonb), **zero schema.** The card **stays in its board's
  record, hidden from every view**; **the Trash lists it** (*"Card 3 — from Characters"*, item 167's name)
  **with "Restore to Characters"** (VW2's TV1 — the destination named before the press); **Empty Trash drops
  it for good.**
- **⚠ Zero schema is not zero consequence.** It changes **what a board's `boxes` means** — every reader of
  `boxes` (render, the survey, the projections, the Counsel, copy, sync's last-writer-wins on the whole
  array) must skip a trashed card. **That is persistence semantics: Fable's review scope** (168-F1).
- **It needs a place to show them:** today's Trash board **pins pages**, and **a card is not a page** —
  **so cards in the Trash need VW2's Trash view.** **VW4's count must count them** (*"3 pages, 1 board, 4
  cards"*).
- **THE RIVAL:** keep cards out — a card dragged to the Trash **vanishes, with Undo**, as Remove does today.
  **Cheaper and schema-light. Its cost:** one gesture, two outcomes — *pages go to the Trash, cards go
  nowhere* — **and Fable's tie fails.**

### (c) WHAT DELETION DOES TO MEMBERSHIPS — the rule §1's finding 2 is missing
> **A MEMBERSHIP OUTLIVES A DELETION; ITS DISPLAY DOES NOT.** A deleted page's or board's cards are
> **kept** on every board they sit on **and hidden while it is in the Trash**; **Restore brings the thing
> back with every card where it was.**
*(Item 125's split, applied to a condition: membership is a record; display follows the thing's state.)*
**The Trash board and VW2's view keep the deleted-inclusive read** — that is why it exists. **Every user
board uses the live read for display.**
- **Deleting a BOARD** takes **its own cards** with it (they live in its record). **Its members are
  untouched** — pages and nested boards are pinned to it, not inside it. While it is trashed it leaves
  **the tabs (144), the crumbs and Connected Boards.**

### (d) NO "ARE YOU SURE?"
**A drag to the Trash never asks whether** — it is restorable. *(The fork asks **what**, which is a
different question.)* **The board row's Delete confirm is rewritten to the truth:** it says **where the
board goes** — *"Moves to the Trash"* — or the confirm goes, since nothing irreversible is happening.

## §4 · THE RIGHT-CLICK MENU — chartered, not designed

- **ONE MENU, TWO WAYS TO OPEN IT.** Right-click opens **the thing's existing `⋯` menu** — the two
  handlers that exist already do exactly this. **Never a second menu with different contents.**
- **Its contents: §2's verbs for that thing**, plus whatever its `⋯` already holds.
- **Where:** cards, page cards and board-cards on the canvas; list rows (survey, Connected Boards).
- **Item 166's exception (a)** — *"a right-click menu on the text or surface"* — **covers it:** it opens at
  the pointer, so it may lie over the page.
- **⚠ TOUCH AND PEN:** the canvas **already spends long-press** (350ms) on starting a drag. *The menu needs
  a different gesture on touch, or the drag loses its own.* **Named for the design pass; not decided.**
- **A text menu** (cut, copy, format — *"on the text"*) **is a different menu about a different thing.**
  **Not this charter.**

## §5 · PAGES GET THEIR FIRST DELETE
**No page can be deleted by the writer today.** The drag and the menu give pages their first Delete.
*(A Delete on the page's own face is not asked for and not chartered here.)*

## §6 · SEQUENCING AND PARTS

| part | what | gate |
|---|---|---|
| **168-A** | the trash icon as a drop target · the drag deletes (per 168-Q1) · §3(c) memberships hidden while deleted · §3(d) the truthful confirm | **168-Q1** — buildable on today's soft delete |
| **168-B** | cards in the Trash (`Box.deletedAt`) | **168-Q2 · VW2 built · Fable (168-F1)** |
| **168-C** | the right-click menu | its own design pass |
| **item 160** | Remove off the board surface | **never before the successor of each job it removes:** for cards, 168-A (the drag); **for page cards and board-cards, 168-C (the menu) — or 168-A under (iii)**. *Until then, Remove stays for memberships only.* |

**VW4's `emptyTrash()` seam** — its own persistence item, Fable's scope — **must know about trashed cards
before it is written**, if 168-Q2 rules them in.

## §7 · THE CHECKS OWED, when built
Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path** · **select by name** · **⛔ release where the writer releases.**
1. **Drag a page card onto the icon** with real pointer events — **releasing OFF the canvas, on the rail**
   (a check that releases inside the canvas passes by accident) — **the act happens (or, under (iii), the
   fork appears); assert the drag is not stuck.**
2. **Delete the page:** `deletedAt` set; **its card hidden on this board AND on a second board**; the Trash
   shows it; **Restore → both cards back at their stored positions.**
3. **Remove from the board** (the right-click menu; or the fork under (iii)): the pin is gone; the page is
   untouched and still on the second board.
4. **(168-B)** a card dragged to the Trash is listed with **"Restore to <board>"**; Restore returns it to its
   stored position; **no reader of `boxes` shows it while trashed** (render, survey, Storyboard, Outline,
   the Counsel).
5. **The confirm's words** never promise permanence for a soft delete.

## §Q · FOR NICK
- **168-Q1 — a page card dragged to the Trash:** **it deletes the page** (lean — your words: the drag is
  how a writer deletes, and Remove is the right-click menu's) · **or it asks** "remove it from this board,
  or delete the page?" · **or it only removes it from the board**?
- **168-Q2 — cards:** does a card dragged to the Trash **go into the Trash**, where you can restore it
  (lean), **or disappear with an Undo**, as Remove does now?

## §F · FOR FABLE
- **168-F1 — `Box.deletedAt`:** zero schema, but it changes what a board's `boxes` means for every reader
  and for sync. **Review scope?** This desk says yes.
- **168-F2 — item 160's order:** Remove leaves the surface **only when each of its two jobs has a
  successor** — the drag for cards (168-A), the right-click menu for memberships (168-C), unless 168-Q1
  rules (iii). *(CD3's precedent.)*
