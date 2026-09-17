# VW3 BUILD BRIEF — THE JOURNAL: THE FLIP, AND THE SPREAD RETIRES
### PLAN desk · 2026-09-13 · item 134, brief 3 of 4 · decision-complete

**WORKTREE:** `.claude/worktrees/vw3-journal` · **BRANCH:** `vw3-journal` · **OFF:**
`origin/main` at build time. **Never the primary checkout.** **This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — one machine, one browser pool. Read the box
> ordering on the ledger or ask chat 1 before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Verified at `9153ac6`.

**RULINGS:** Nick, 2026-09-13 — **"1. Written"** and **"5. Accept."**
**AUTHORITY FOR THE RETIREMENT:** `docs/menus/item134-qc-orderindex-census.md` — **ordered first
and run first, precisely so this deletion is made knowingly.**

---

## §0 · WHAT THIS BRIEF IS

**Most of the flip already exists.** `JournalEntry.tsx` (J1) holds the `notebook` array with
`prevPage` / `nextPage` — one page, full size, a way back and forward. **The work is the motion,
the two marks, and one retirement that takes a function with it.**

---

## S1 · THE FLIP IS A MOTION, NOT FURNITURE (JV1)

**The PAGE moves. Nothing else does.**
- **No spread, no curl, no second page, no frame that shrinks the page.** The paper **keeps its
  measure throughout** — only position and opacity change.
- **Reduced motion falls back to an INSTANT SWAP, never to a different layout.** *A motion that
  degrades into furniture has failed the constraint.*
- Reference render: `docs/menus/item134-mock-journal-flip.html` — **live, not stepped**, because
  a motion cannot be judged from a still. Its rig carries a reduced-motion toggle and a readout
  asserting the measure is unchanged.

## S2 · PRIMACY OF THE PAGE — the flip adds NO chrome to the paper (JV2)

The two affordances live in the **outer margins**, outside the measure, at the paper's vertical
midline. Olive-rest, no labels at rest. **Keyboard: ← / →.** **The page gains nothing; the room
gains two marks.** At the first page and the last, the mark is **inert with its reason available**
— never absent, or the writer reads the end of the notebook as a broken control.

## S3 · THE ORDER IS DAY WRITTEN (JV4) — already the default

`notebookKey = orderIndex ?? createdAt` (`store/pageOrder.ts`). **No change is needed and none
should be made.** Recorded here so it is not "tidied": *recency is a **condition**, and a
condition may be a lens but never the binding — ordering the Journal by last-touched would make
it a fourth condition wearing a book's clothes.*

---

## S4 · ⚠ THE RETIREMENT — and `setNotebookPosition` dies in the SAME COMMIT

**Nick: "Accept."** The Spread retires and manual re-ordering goes with it.

**IN ONE COMMIT, TOGETHER — this is the load-bearing instruction:**
1. the `/journal/spread` route (`App.tsx`)
2. `pages/Spread.tsx`
3. **`setNotebookPosition` in `store/persistence.ts`**

**WHY TOGETHER, from the census:** `setNotebookPosition` has **exactly one product call site —
`Spread.tsx:177`.** Retire the Spread alone and it becomes **a writer function with zero callers**:
a trap for the next reader, who will find an exported mutator, assume something calls it, and
build on it. **The census is what makes deleting it safe to do knowingly, and that is the whole
reason Q-C was ordered before anything retired.**

**⛔ AND ONE THING THE RETIREMENT MAY NOT TAKE WITH IT — RULED CARRIED FORWARD (item 108,
2026-09-16).**

**`Spread.tsx`'s lens row is the ONLY WORKING TAG FILTER IN THE APP.** Measured: `allTags` →
chips → `tagFilter`, one tag at a time, clearable — and `git grep` finds `tagFilter`/`allTags`
in **exactly one file**, this one. **So the Spread's retirement deletes the app's only tag
filter.**

**This is NOT Q-C's situation and must not be treated as it.** Manual ordering was **accepted as
lost** on Nick's word. The tag filter is **RULED CARRIED FORWARD** — item 108's charter re-homes
it as a lens over every surface that shows thumbnails. **So:**

- **This brief still retires the Spread, the route, and `setNotebookPosition` as written.**
- **The tag filter is NOT collateral. It is a capability with a successor**, and the successor is
  item 108's, not this brief's.
- **SEQUENCING, and it is the whole point of this clause: if item 108's filter has NOT landed
  when this brief builds, say so in the offer and name the gap as OPEN.** *Do not quietly ship a
  release where a writer who had a tag filter yesterday has none today* — a capability that
  disappears between two tickets, each correct on its own, is how a regression arrives with
  nobody's name on it.
- **Park, never delete, the Spread's tag-filter coverage** in `j5.mjs`/`j6.mjs`: quote the
  original verbatim, name item 108's successor, audit the park COUNT. *A parked check with a
  named successor is the only artifact that survives the gap and remembers what is owed.*

**WHAT SURVIVES, and the scope must not widen past it:**
- **`createLoosePage(afterId?)` STAYS.** It is a *separate* writer, called from
  `JournalEntry.tsx` (`openLoose`), and it places **new** pages. **What dies is re-ordering
  existing pages; placing new ones is untouched.**
- **`orderIndex` the FIELD stays. `notebookKey` stays. `sortNotebook` stays.
  `normalizeNotebook` stays.** `order_index` is a real column, round-tripped by
  `apps/server/src/sync.ts`. **Every index already written keeps sorting the notebook forever.**
  **Retiring the affordance retires no data, and a later ticket could re-home the writer with
  nothing lost in between.** *That is what makes this a cheap decision rather than a one-way
  door — say so in the build report.*

**⚠ A TRAP RECORDED WITH THE CENSUS, because a reader will hit it:** `Spread.tsx` carries
*"lenses never write orderIndex"* near its top. **That disclaimer is scoped to the LENS ROW, not
the file** — line 177 is the sole writer in the product. **The PLAN desk drafted the opposite
conclusion mid-census and caught it only by enumerating call sites.** *Comments describe intent;
call sites are the evidence.* **Re-run the enumeration at branch tip before deleting**, and if
`setNotebookPosition` has gained a caller since, **STOP and report** — the ruling was made
against one call site.

**Park discipline:** `j5.mjs` and `j6.mjs` carry Spread coverage (the census counted 5 and 2
`orderIndex` references). **Every assertion the retirement falsifies is PARKED with its original
quoted verbatim and a successor named — never rewritten in place — and the park COUNT is audited
against this brief's claim.** A green run cannot see a check that is no longer there.

---

## S5 · THE HARNESS — `apps/desktop/scripts/harness/vw3.mjs`

Standing laws as ever: **drivers never assume existence** · **real pointer events** · **seed
through the seams** · **absolute worktree path**.

**Checks owed:**
1. The flip moves **forward and back** across a seeded notebook; **the paper's measure is
   identical before, during and after** — *the "no frame that shrinks the page" constraint,
   measured rather than eyeballed.*
2. **No second page, no spread element, exists in the DOM at any point** in the motion.
3. **Reduced motion** (emulate the media feature): the swap is instant **and the layout is
   byte-identical** to the animated end state. *The fallback must not be a different view.*
4. The two marks are **outside the paper's rect** — measured, both widths.
5. **First/last: the mark is inert, not absent**, and discloses why.
6. Order is **day written** — fixture whose `updatedAt` order differs from `createdAt` order;
   assert `createdAt` wins.
7. **`/journal/spread` is gone** — the route 404s or redirects; no `.spread-grid` anywhere.
8. **`setNotebookPosition` is gone** — a **static grep assertion** over `apps/` that neither the
   export nor any caller remains. *The check that stops a zero-caller mutator creeping back.*
9. **An existing `orderIndex` still orders the notebook** — seed two pages with explicit indexes
   opposite to `createdAt`; assert the flip follows the stored order. *Proves the retirement took
   the affordance and not the data.*
10. Both `HARNESS_PARKED` settings CLEAN; **park count audited against §S4's claim.**

---

## §CLOSE

1. **Re-run the census at branch tip** (S4) and report the call-site count before deleting.
2. Build S1–S5; `tsc` + `build:web` + selftest + full suite, **both settings**, green,
   independently re-run at branch tip.
3. **Push the branch. Do not merge.** Source + harness: the ordinary gate.
4. **Not in this brief:** Shelf/Trash (brief 2) · Empty Trash (brief 4) · the rail (brief 1) ·
   item 137 · the Library (tabled by Nick).
5. **A FOUNDER SITTING IS OWED** — the Journal's *order* is a meaning claim, and no harness can
   certify that an order is the one a writer expects of a book.

**Nothing deploys on this lane's word.**
