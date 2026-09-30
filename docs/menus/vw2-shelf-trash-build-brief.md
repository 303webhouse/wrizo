# VW2 BUILD BRIEF — SHELF AND TRASH, ONE VIEW
### PLAN desk · 2026-09-13 · item 134, brief 2 of 4 · decision-complete

> **⚠ AMENDED 2026-09-24 — `vw2-rows-amendment.md`** (Nick's 3C: the Shelf and Trash are ROWS with sortable columns, not a thumbnail grid; cards join the Trash; the Trash gains Delete Permanently). **Where S2's grid, S5's roster or S6 checks 2 and 8 disagree, that file governs (its §7 lists them). Kept as written below.**

**WORKTREE:** `.claude/worktrees/vw2-conditions` · **BRANCH:** `vw2-conditions` · **OFF:**
`origin/main` at build time. **Never the primary checkout.** **This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — one machine, one browser pool. Read the box
> ordering on the ledger or ask chat 1 before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR**, line numbers a courtesy. Verified at `9153ac6`.

**RULING:** the FINAL pass §1, §3 (SV1–SV5), §4/TV1 · the **arrangement law, RATIFIED** by Nick
2026-09-13 (*"And yes, ratified"*) · **S0(c)/S4 ruled 2026-09-13** (Fable).

> **NAMING — for anyone writing in this arc.** Files keep the **numbered `vwN-` prefix**; prose
> says **"the views arc"**. **Bare "VW" on this tree means the VOICE WALL**
> (`docs/vw-voice-wall-brief.md`) — TOOLS nearly walked into the collision.
**GATE:** brief 1 (the rail) need not have landed — these are different files. **When THIS brief
is final, Fable opens the hard-delete persistence item** (brief 4's other half).

---

## §0 · WHAT THIS BRIEF IS — a DISPLAY reversal, not a migration

**On disk today, Shelf and Trash ARE boards.** `systemKind: 'journal'|'trash'|'shelf'` on a
`board-meta` Box; `openShelfBoard` / `openTrashBoard` navigate to `/page/<boardId>`, which
renders **`BoardEditor`**. That is why erratum 131(a) could happen at all.

**The route per Fable: a DISPLAY reversal.**
- **Storage is UNCHANGED.** They stay `pageType:'board'` rows. **`reconcileSystemBoard` STAYS** —
  it is the derived index that computes membership, and nothing here touches it.
- **Every VIEW and READER changes.** Nothing in the product renders or names them as boards.
- **Zero schema.**

**The law this brief is measured against, ratified:**

> **ARRANGEMENT IS THE SIGNATURE OF A CONTAINER. A CONDITION HAS NONE, BECAUSE NOBODY ARRANGED
> IT — THE APP COMPUTED IT.**

**Falsifiable on sight, and that is the standard:** *if a writer can move one thing relative to
another, it has become a board.*

---

## S0 · SURVEY

**(a)** Confirm `getSystemKind` (`persistence.ts`), the three `open*Board` doors
(`CascadePanels.tsx:44/48/54`), and that `/page/:id` renders `BoardEditor` for a system board.
**(b)** Confirm `reconcileSystemBoard` **builds its own boxes and never calls `pinPageToBoard`** —
it is the index, and this brief leaves it alone.
**(c) ~~Establish the condition's own clock~~ — RULED, 2026-09-13; no survey owed.** The
question this brief raised is answered: **no `shelvedAt` exists in `src` and none is added.**
Confirmed independently at branch tip — `shelved?: boolean` is a **flag, not a date**, so there
is genuinely no record of *when* a page became unfiled. **See S4 for the order this rules.
Zero schema.**
**(d)** Park discipline: anything rewritten in place is parked with its original quoted verbatim;
**audit the park COUNT** against this brief's claim.

---

## S1 · ONE COMPONENT, TWO MOUNTINGS (SV1)

**A single `ConditionView` with a `condition: 'shelf' | 'trash'` prop.** The 119-mirror pattern:
the flip, the thumbnails, the ordering and the empty state **cannot drift between them, by
construction.** Reuse-never-copy made structural — **two components would be two bugs.**

**Mount it where the boards mount now.** `/page/:id` renders `ConditionView` instead of
`BoardEditor` **when `getSystemKind(entry)` is `'shelf'` or `'trash'`**. **No route change, no
new door, no lexicon change on the rail.** The existing `open*Board` functions keep their names
and destinations; only what renders there changes. *(The Journal's own system board is brief 3's;
leave it on its current path here.)*

---

## S2 · THE THUMBNAIL POSTURE — a LIST, never a canvas (SV2)

- Thumbnails **flow** in a wrapping grid. **No x/y, no drag-to-place, no connections, no canvas,
  no z-order.** Nothing in this view reads or writes a Box's coordinates.
- **Q4's grammar, now carrying THE THUMBNAIL LAW (ruled 2026-09-13).** Nick, verbatim: *"use a
  different thumbnail (horizontal rectangles for Boards, vertical rectangles for Pages)."*
  > **BOARDS ARE WIDE. PAGES ARE TALL.**
  - a **page** renders **TALL** — a vertical rectangle, **aspect-locked**: *resizable by scale,
    never stretched* (the canon rider)
  - a **board** renders **WIDE** — a horizontal rectangle, wearing the doubled edge that says
    *a thing that holds things*
  **Shape teaches the kind before a word is read, and it spends no colour** — the Plateau ember
  ceiling is untouched. *This is what `colour-as-kind-signal` was routed to item 96 to solve; it
  never returned, and shape does the work instead.*

- **SECTIONED, NOT MIXED — Nick's other half: *"group them together but section off Boards from
  Pages clearly."*** One zone, two sections.
  ~~**Fable's derived wording, recorded as STANDING UNTIL NICK VETOES:** a stacked heading
  `LINKED TO THIS BOARD` above the sections~~ — **SUPERSEDED the day it was written, by PW2's
  ruling (1), 2026-09-13:** *"The survey's heading stays THE BOARD'S NAME; under it, two labelled
  sections, 'Pages' and 'Boards'. **'Linked to this board' does NOT render as a line.**"* **This
  brief never learned it until the PLAN desk reconciled the sibling row against that zone
  (2026-09-16).** Struck in place, not deleted — *a stale heading that survives in a brief is
  exactly the instruction a builder would faithfully follow.*

  **AS IT NOW STANDS — for THIS view, whose own name heads it:**
  ```
  THE SHELF   (or THE TRASH)
    Pages      <tall thumbnails>
    Boards     <wide thumbnails>
  ```
  *(In a Shelf or Trash view the struck phrase was never even true: neither is a board, so nothing
  here is "linked to this board.")*
  **The sections are the "clearly"** — grouping alone would leave two silhouettes interleaved,
  which is legible but not *sectioned*. **Shape and section do different jobs: shape tells you
  what one thing is; the section tells you where its kind ends.**
- **Shape teaches the kind** — three silhouettes, **no colour spent**, the Plateau ember ceiling
  untouched. This is the job Pass 5 routed to item 96 as *colour-as-kind-signal*; shape does it.
- **Empty state:** a plain line. **Absent, never disabled** anywhere in this view.

## S3 · THE FLIP POSTURE, AND THE SWITCH (SV5)

- The flip is **brief 3's motion, reused** — one page, full size, measure unchanged, the two
  marks in the outer margins. **Do not write a second flip.** If brief 3 has not landed, build
  this posture against the same component brief 3 will own and say so in the report.
- **The posture control is an INSTRUMENT, not a door (G1)** → it lives **in the foot**, never in
  the strip. Per-view and remembered.

## S4 · THE ORDER — RULED 2026-09-13, and the two differ on purpose (SV3, amended)

| view | orders by | field |
|---|---|---|
| **Shelf** | **day written** | `createdAt` — the book's own spine |
| **Trash** | **when it was deleted**, newest first | `deletedAt` — exists today |

**ZERO SCHEMA. No `shelvedAt` is added** (S0(c)).

**SV3's original wording — *"a condition has exactly one honest date: when it began"* — is
SUPERSEDED for the Shelf**, and left standing here rather than rewritten, because the reason it
yielded is the useful part.

**WHY THE TWO DIFFER, so no one later "harmonises" them into a bug.** Fable's ruling:
*a condition is a lens over the book, and the book's spine is the day.*

- **An unfiled page is still IN the book.** *Unfiled* is a **lens** over it — a way of looking at
  pages that remain in the sequence. A lens does not get to reorder what it looks through, so the
  Shelf **inherits the book's spine: day written.** *(This is (i) "Written" reaching a second
  surface — the same reasoning, one view further out: recency is a condition, and a condition may
  be a lens but never the binding.)*
- **A deleted page has LEFT the book.** Deletion is an **event**, with its own date, and the
  thing is no longer in the sequence to inherit an order from. So the Trash carries **its own
  clock** — the only one it has.

**The asymmetry is the model showing through, not an inconsistency.** *One of these views looks
into the book; the other looks at what fell out of it.*

## S5 · THE TWO DIFFERENCES, AND ONLY TWO (SV4)

**(1) HANDS.** Shelf pages carry **both**; Trash pages **and boards** carry **neither**. On
Trash the grips are **not rendered at all** — not hidden, not disabled. A deleted thing is not a
writing surface, so a grip would be a door onto nothing (BD4's *presence-follows-content*).

**(2) RESTORE — and it names its destination (TV1).** *"Restore"* alone is the destination-blind
verb the Card pass named as the enemy. **Before the press**, the row reads:
- `Restore to Novel` — its drawer still exists
- `Restore — its drawer is gone; goes Loose` — **the case that will actually happen**

**Not a toast after the fact.** A writer must know where a thing lands before they send it there.

**Trash's other verb, Empty, is brief 4's.** Build **no** Empty control here.

---

## S6 · THE HARNESS — `apps/desktop/scripts/harness/vw2.mjs`

Standing laws: **drivers never assume existence** (probe, fail a named CHECK, never a bare click
that aborts the file) · **real pointer events**, never synthetic `click` · **seed through the
seams** · **absolute worktree path**.

**Checks owed:**
1. **Shelf and Trash render `ConditionView`, not `BoardEditor`** — assert the board canvas's own
   root is **absent** on both.
2. **⚠ THE ARRANGEMENT LAW, ASSERTED AS ABSENCE** — no element in either view carries positional
   style (`left`/`top`/`transform` from data), and **no drag handler is bound.** *This is the
   check the whole charter rests on: a condition that can be arranged has become a board.*
3. **Page thumbnails are aspect-locked** — measure two at different scales, assert equal ratio.
4. **A board renders as a board thumbnail**, badge reads `Board`.
5. **Order, both views, and they must be asserted SEPARATELY** — one fixture, `createdAt` order
   deliberately opposite to `deletedAt` order. **Assert the Shelf follows `createdAt`** and
   **the Trash follows `deletedAt`.** *A single shared assertion would pass while silently
   harmonising the two, which is the exact mistake S4 exists to prevent.*
6. **Hands: Shelf 2 grips, Trash 0** — asserted as a **count**, both mountings, one fixture.
7. **Restore names its destination** — both cases, including the orphan (`goes Loose`), asserted
   **before** any press.
8. **No Empty control exists in this view** (it is brief 4's).
9. **One component:** assert Shelf and Trash render the **same component** (a shared test hook or
   identical DOM shape) — SV1 proven, not asserted in prose.
10. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

---

## §CLOSE

1. S0 reported — **especially (c): does a `shelvedAt` date exist?**
2. Build S1–S6; `tsc` + `build:web` + selftest + full suite, **both settings**, green,
   independently re-run at branch tip.
3. **Push the branch. Do not merge.** Source + harness, so the ordinary gate.
4. **Not in this brief:** Empty Trash and its confirm (brief 4) · the hard delete (Fable's
   persistence item) · the Journal (brief 3) · the rail (brief 1) · item 137.
5. **A FOUNDER SITTING IS OWED before this is called done** — the membership lists here are
   meaning-carrying, and *a suite certifies behaviour; a sitting certifies meaning.* 131(a)
   passed 33 checks with the wrong members in the list.

**Nothing deploys on this lane's word.**
