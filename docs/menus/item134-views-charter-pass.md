# ITEM 134 — THE VIEWS CHARTER · committee pass
### PLAN desk · 2026-09-11 · design only · CANDIDATES + RECOMMENDATIONS. Nothing locks.

---

## §0 · TWO RELAY GAPS, NAMED FIRST — the audit's own doctrine

**(1) Nick's governing message did not arrive.** The relay reads *"Nick's message rides above
this paste verbatim and governs."* **No such message was in the relay.** Everything below is
designed against **Fable's paste alone**, and every point that would turn on Nick's wording is
marked **[needs his text]**.

**(2) Item 134 is not on the ledger.** `aa18840`: no `ITEM 134`, no "VIEWS CHARTER", and the
registry still reads **`next free 133`**. So the item is in flight, exactly as the three-space
canon was.

**CORROBORATED FROM THE OTHER DIRECTION — item 134's own ledger entry (`f12c318`) carries the
same gap, found independently:** *"SIX FOUNDER RULINGS NOT RECEIVED… this entry is INCOMPLETE
until they are."* **This is the third lost relay found, and the first caught by a receiving
desk rather than a sending lane.** Two desks reported one absence without conferring, which is
the audit working as designed.

**This is reported, not worked around, because the relay audit was instituted eight days ago
for precisely this:** *"A ledger cannot show what never reached it — nothing looks wrong when a
ruling was simply never written down."* Its first run caught **this desk's own amended briefs**
sitting in Downloads while `main` carried older versions. **A queued item is not a landed item.**
Two absences are therefore on the record above, where a list outside the ledger can see them.

---

## §0.5 · WHAT I OWE ON ERRATUM 131(a) — it was my set

**PW1's brief specified the set: `planBoardId ∪ getBoardsPinning(pageId)`.** `getBoardsPinning`
returns every board pinning the page, **conditions included** — so Shelf and Trash appeared in
"Boards connected," which the ledger names *a canon violation, and the most serious of the three*.

**I had the line and cited it myself.** My own addendum, §B3, quotes it: *"Shelf and Trash are
**displays of a CONDITION** (loose; deleted), **not places**."* I wrote that sentence down and
then wrote a set that included them. **The suite could not have caught it** — the ledger is
right that no check encodes "the Shelf is not a place" — but the brief could have, and did not.
`getBoardsConnecting` is the right fix and is ratified.

**And the miss is why this charter exists, which is the useful part:** the conditions were
listed as places because **on disk they ARE boards.** I did not invent that; I failed to
correct for it. §1.

---

## §1 · THE FINDING — THE CONDITIONS ARE BOARDS TODAY

**Verified at `aa18840`, not inferred:**
- `types/index.ts` — `systemKind?: 'journal' | 'trash' | 'shelf'`, carried on a `board-meta`
  Box. A system board is *"a REAL board page (pageType 'board')"* in the code's own words.
- `CascadePanels.tsx:44/48/54` — `openJournalBoard`, `openTrashBoard`, `openShelfBoard`, each
  navigating to the board route.

**So the charter's *"None of these is a Board and none may look like one"* is a REVERSAL of what
ships, not a refinement of it.** All three are boards, are opened as boards, and are therefore
picked up by anything that asks "which boards…". **That is the mechanism of erratum 131(a)** —
not a rendering slip, but the ontology and the storage disagreeing, with the ontology newer.

**Two routes, and the canon has already chosen:**

| | route | cost |
|---|---|---|
| **A** | **keep the storage; change every VIEW and every READER.** They stay `pageType:'board'` rows; nothing in the product ever renders or names them as boards. | zero schema; N view sites |
| B | stop making them boards — a new kind, a migration. | schema + migration + every consumer |

**A, and not merely because it is cheaper.** Canon effect (2) already ruled it:
*"STORAGE IS UNCHANGED — a board stays a page-kind row. The **concept**, the **naming**, and the
**rail** treat it as a container. This is a conceptual ruling, not a migration: **zero schema**."*
**Item 134 is that ruling reaching the three views that still render the old concept.**

**The law that makes it checkable — this pass's central proposal:**

> **ARRANGEMENT IS THE SIGNATURE OF A CONTAINER. A CONDITION HAS NONE, BECAUSE NOBODY ARRANGED
> IT — THE APP COMPUTED IT.**

A board has **authored arrangement** (A16). Shelf membership is computed from "unfiled"; Trash
from "deleted"; the Journal from date. **Therefore none of the three may offer positioning,
dragging-to-place, connections, or a canvas** — not as a style choice but because there is
nothing there to arrange. *That single sentence is what "may not look like a board" means in
build terms, and it is falsifiable on sight.*

---

## §2 · THE JOURNAL — THE FLIP

**Most of it is already built.** `JournalEntry.tsx` (J1) holds a `notebook` array with
`prevPage` / `nextPage`, loose Journal pages only — **one page, full size, a way back and
forward.** Fable's constraint is largely *satisfied by what exists*; the work is motion, scope,
and one retirement.

**JV1 · THE FLIP IS A MOTION.** The page itself moves — a turn, not a transition between two
framed things. **Nothing shrinks, nothing curls, no second page appears.** The paper keeps its
measure throughout; only its position and opacity change. Reduced-motion falls back to an
instant swap (the vanish engine's existing convention), never to a different layout.

**JV2 · PRIMACY OF THE PAGE MEANS THE FLIP ADDS NO CHROME TO THE PAPER.** The two affordances
live in the **outer margins**, outside the measure, at the paper's vertical midline — the
quietest possible pair, olive-rest, no labels at rest. Keyboard: ← / →. **The page gains
nothing; the room gains two marks.**

**JV3 · ⚠ RETIRING THE SPREAD ORPHANS THE ONLY `orderIndex` WRITER.** `/journal/spread`
(`Spread.tsx`) is a **grid** with lens chips and **drag-reorder** — and `notebookKey` is
`orderIndex ?? createdAt`, so **the Spread is where a writer authors journal order.** Kill the
spread under "no spread, no furniture" and **manual reordering dies with it, silently.**
*This is R13.iv's shape exactly: a ruling removes a surface, and the acts it hosted have
nowhere to go.* **Three lawful outcomes, named, not chosen here:**
 1. **Accept it** — the Journal is a book; books do not reshuffle. `orderIndex` goes dormant.
 2. **Re-home** the reorder into the thumbnail view §3 builds anyway.
 3. **Keep the spread** as a separate, non-default lens. *(Against Fable's constraint.)*
 **Lean: (1).** It is the analog law's own answer, and it makes JV4 true rather than merely
 convenient.

### Q(i) — day written, or day last touched? **RECOMMEND: DAY WRITTEN.**

**JV4.** Three reasons, strongest last:
1. **It is already the built default** — `notebookKey = orderIndex ?? createdAt`.
2. **The analog law.** *"A typewriter for text and a journal page for drawing."* A notebook's
   pages do not renumber themselves because you reread one.
3. **The canon rules it, and this is the real argument: "last touched" is a CONDITION, not an
   order.** Recency is computed, exactly like *unfiled* and *deleted* — and conditions are
   **displays**, never the spine of a container. Ordering the book by recency would make the
   Journal a fourth condition wearing a book's clothes. **Recency is welcome as a lens; it may
   not be the binding.**

---

## §3 · SHELF AND TRASH — ONE VIEW, TWO DIFFERENCES

**SV1 · ONE COMPONENT, TWO MOUNTINGS** — the 119-mirror pattern: a single view with a
`condition` prop, so the flip, the thumbnails, the ordering and the empty state **cannot drift
between them.** Reuse-never-copy, made structural.

**SV2 · THE THUMBNAIL VIEW IS A LIST, NOT A CANVAS** — §1's law applied. Thumbnails flow in a
grid; **nothing is positioned, nothing drags to a place, no connections, no canvas.** Q4's
grammar carries over exactly: **pages aspect-locked (scale, never stretch); a board renders as
its thumbnail.** This is what stops it looking like a board, and it is checkable: *if a writer
can move one thing relative to another, it has become a board.*

**SV3 · THE ORDER IS THE CONDITION'S OWN CLOCK.** Shelf sorts by *when it became unfiled*,
Trash by *when it was deleted* — newest first. **A condition has exactly one honest date: when
it began.** (Not `createdAt` — that is the page's own date and belongs to the Journal.)

**SV4 · THE TWO DIFFERENCES, AND ONLY TWO.**
- **Hands.** Shelf pages carry **both**; Trash pages **and boards** carry **neither**. A deleted
  thing is not a writing surface — the hands would be a door onto nothing (BD4's
  *presence-follows-content*, at view scale).
- **Empty.** Trash only, permanent. §4.

**SV5 · THE FLIP AND THE THUMBNAILS ARE ONE VIEW IN TWO POSTURES, not two views.** One control
switches them, it is per-view and remembered, and **it is an instrument, not a door** (G1) —
so it lives in the foot, never in the strip.

---

## §4 · TRASH'S VERBS — designed against Fable's default

**TV1 · RESTORE NAMES ITS DESTINATION.** *"Restore"* alone is the destination-blind verb the
Card pass named as the enemy (CA1): a writer who restores must know **where it lands** before
pressing. So the row reads the destination:
- `Restore to Novel` — its drawer still exists
- `Restore — its drawer is gone; goes Loose` — the honest second case, stated **before** the
  press, not as a toast after it

*This is the one place this pass adds a decision rather than dressing one: the ledger's default
said "Restore (this item)" and stopped. **A restore whose destination has been deleted is the
case that will actually happen**, and silence there is how "it went somewhere" becomes a
support question.* **[needs his text — if Nick's message rules restore behaviour, his wins.]**

**TV2 · EMPTY TRASH LIVES IN THE TRASH VIEW.** Never a modal over the writer's work, never a
surface switch. Reuse the built confirm shape — `wz-cascade-confirm` / `-confirm-danger`, T4's
own ruling: **one plain confirm, then gone; destructive colour ONLY inside the confirm.**

**TV3 · THE CONFIRMATION IS THE ONE PLACE A COUNT IS OWED — and this needs a word.**
The standing law is **no counts in chrome** (A14/A18; BD4's *listed, never counted*) — written
against **ambient** numbers that nag. **A destructive, irreversible confirmation is not ambient:
it is the single moment where the number is the information.** *"Empty the Trash?"* tells a
writer nothing about whether they are discarding two things or two hundred.
**Proposed, handed up rather than assumed:** the no-count law gains a clause —
**a count is lawful inside a destructive confirmation and nowhere else.**
Confirm reads: **`Empty the Trash? 12 items, permanently.`** · `Empty` / `Cancel`.
**[Q-A for Nick/Fable: clause, or hold the line and drop the number?]**

**TV4 · ABSENT, NEVER DISABLED.** An empty Trash shows **no Empty control** (G3).

**TV5 · NOTHING ELSE.** No per-item permanent delete, no select-many, no auto-purge. Fable's
default stands: **Restore (this item), Empty Trash (all).** *Item 90 folds in here and is
satisfied by exactly these two verbs plus openability.*

---

## §5 · THE RAIL — Q(ii)

**Grouped today** (`Cascade.tsx`): `[journal] · [page, plan] · [drawers, shelf] · [settings,
theme] · foot:[trash]`. **The canon says that grouping is wrong in one specific place: `shelf`
sits beside `drawers`, pairing a CONDITION with the foundational CONTAINER** — the same
category blur that produced 131(a), rendered in the rail.

**RV1 · RECOMMEND: GROUP BY THE WRITER'S QUESTION, NOT BY THE ONTOLOGY'S NOUNS.**

```
  Page · Plan        — where I am, and what holds it
  ─────────
  Drawers            — where things live        (the foundational container)
  ─────────
  Journal · Shelf    — what the app shows me    (by date · unfiled)
  ─────────
  (foot) Settings · Theme · Trash
```

The writer never reads the words *surface*, *container*, *display* — **the separators do the
teaching**, silently, which is the only way a taxonomy is allowed to reach a writing app.

**RV2 · TRASH — HANDED UP, NOT DECIDED.** By kind it belongs beside Journal and Shelf. But
**B1 S5 put it at the foot deliberately** — *"reachable, never prominent."* **Two ratified
principles, one slot.** *Lean: keep it at the foot.* The standing ruling is about **prominence**
and the canon's grouping is about **kind**; they only collide if co-location is required, and it
is not. **One less reversal, and the foot placement was founder-driven.** **[Q-B]**

---

## §6 · LIBRARY — TABLED  *(the ledger files this as item 134's own §4)*

Recorded as Nick tabled it: **stack-flip, or sectioned thumbnail grid.** **Not designed here.**
Noted only that §3's one-component-two-mountings shape would extend to it without a rewrite —
which is a reason to build §3 that way, not a reason to design §6 now.

---

## §7 · THE GATE THIS CHARTER OWES — the newest canon, applied

> **A SUITE CERTIFIES BEHAVIOUR. A SITTING CERTIFIES MEANING.** *(canon, 2026-09-10)*
> *"Surfaces that CARRY MEANING — membership lists, address lines, connection sentences — get a
> FOUNDER SITTING before they are called done. Not a demo after the fact; a gate."*

**Every surface in this charter carries meaning, and each has a claim a green suite cannot
check.** So the sitting is named now, with what to look at, rather than discovered later:

| surface | the meaning claim no harness can certify |
|---|---|
| Journal flip | the order is the one a writer expects of a book — **and the flip has not become furniture** |
| Shelf | the members are the genuinely unfiled — **and it does not read as a board** |
| Trash | Restore lands where the row said it would; Empty's number is true |
| the rail | the groups teach the kinds **without naming them** |

**The pass's own admission:** erratum 131(a) shipped through 33 checks, both suite legs, a deploy
pair and a review — **because the list rendered correctly with the wrong members in it.** Every
view in this charter is a membership list. **The sitting is the gate; the suite is not.**

---

## §8 · RETURNED FOR NICK'S WORD

**(i) Journal order** → **recommend DAY WRITTEN** (§2/JV4). Recency is a condition; a condition
may be a lens but never the binding.
**(ii) the rail** → **recommend grouping by the writer's question** (§5/RV1), separators doing
the teaching. **Trash's slot handed up (Q-B).**
**Q-A** — may a **count** appear inside a destructive confirmation? (§4/TV3.)
**Q-B** — Trash at the foot (standing B1 S5) or with the conditions (canon kind)? *Lean: foot.*
**Q-C** — **JV3**: the Spread retires and takes manual journal order with it. Accept (lean),
re-home, or keep a lens?
**Q-D** — **[needs his text]** the missing message. If it rules on any of the above, his wording
governs and this pass amends to it.

**MOCKUPS:** `item134-mock-journal-flip.html` · `item134-mock-shelf-thumbnail.html` ·
`item134-mock-trash.html`.

**Nothing locks. C5 (the shelf) in the cluster inherits this charter.** — the PLAN desk
