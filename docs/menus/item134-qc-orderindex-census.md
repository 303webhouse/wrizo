# Q-C · THE `orderIndex` CENSUS — every reader and writer, named
### PLAN desk · 2026-09-11 · ordered first, before anything retires · verified at `aa18840`

**METHOD.** `git grep` across `apps/` and `scripts/`, **counted programmatically over the full
enumeration, never a truncated listing** — **35 occurrences in 8 files.** Every one is
classified below; nothing is sampled.

---

## §1 · THE ANSWER TO FABLE'S QUESTION

> **Does any CONTAINER depend on `orderIndex`?** — **NO. Not one.**

`orderIndex` is consumed through exactly one path: `notebookKey()` → `sortNotebook()` →
**`getNotebookPages()`**, and that function's own filter is decisive:

```
!deletedAt && projectId == null && !belongsOnShelf(e) && pageType !== 'board'
```

**Loose, unfiled, non-board, undeleted Journal pages only.** Filed pages are excluded by
`projectId == null`; shelved by `belongsOnShelf`; boards by `pageType`; deleted by `deletedAt`.

**What the containers actually sort by, verified:**

| surface | sorts by | touches `orderIndex`? |
|---|---|---|
| **Drawers** (foundational container) | `byRecent` (updatedAt) and `localeCompare` (title) | **no** |
| **Boards** (containers) | `byArrangement` (x/y) — *PW1's Q14 ruling, now shipping* | **no** |
| **Shelf / Trash** (conditions) | their own clocks | **no** |
| **the Journal** | `notebookKey = orderIndex ?? createdAt` | **YES — and only here** |

**So the dependency is real but singular, and it lands on the one thing the canon says is
NOT a container.** The Journal is *"the pages by date"* — a **display**. **Retiring a journal
affordance cannot break a container, because no container is downstream of it.**

---

## §2 · READERS — all of them

| # | site | what it does |
|---|---|---|
| R1 | `store/pageOrder.ts` · `notebookKey()` | `p.orderIndex ?? Date.parse(p.createdAt)` — **the definition** |
| R2 | `store/pageOrder.ts` · `sortNotebook()` | ascending notebookKey, ties → createdAt → id |
| R3 | `store/persistence.ts:1594` · `getNotebookPages()` | **the only consumer of R2**; the filter above |
| R4 | `pages/JournalEntry.tsx` (J1) | the **flip** — `notebook`, `prevPage`, `nextPage` |
| R5 | `pages/Spread.tsx` | the grid's display order |
| R6 | `store/persistence.ts:1730` · `window.wrizoNotebook` | harness inspection seam |
| R7 | `apps/server/src/sync.ts:95` | hydrates `orderIndex` from the `order_index` column |

**R4 and R5 are the only two surfaces a writer ever sees.**

---

## §3 · WRITERS — all of them, and this is where the question is decided

| # | site | writes when | survives the Spread's retirement? |
|---|---|---|---|
| W1 | `persistence.ts` · `createLoosePage(afterId?)` | a **new blank page** appended or inserted after `afterId` | **YES** — called from `JournalEntry.tsx:685` (`openLoose`), on the Journal surface itself |
| W2 | `persistence.ts` · **`setNotebookPosition(id, afterId)`** | **re-ordering an existing page** | **NO — see below** |
| W3 | `persistence.ts` · `normalizeNotebook()` | internal re-spread when a midpoint gap is exhausted; called by the insert path | YES (internal) |
| W4 | `persistence.ts:904` | seed/fixture path | YES (harness) |

### ⚠ W2 HAS EXACTLY ONE PRODUCT CALL SITE, AND IT IS THE SPREAD

```
apps/desktop/src/pages/Spread.tsx:177   setNotebookPosition(dragIdRef.current, dropAfterIdRef.current);
```

Nothing else in `apps/` calls it. **So JV3's warning stands, now with a precise scope:**

- **Retiring the Spread orphans the ability to RE-ORDER EXISTING PAGES.** W2 becomes dead code
  and the writer loses that capability entirely.
- **It does NOT orphan placing new pages.** W1 lives on the Journal surface and is untouched —
  a writer can still insert a blank page after the one they are on.

**That is a narrower loss than my pass implied, and the distinction should drive the ruling:**
what dies is *rearranging the notebook after the fact*, not *deciding where a page goes when it
is made*.

---

## §4 · A TRAP, NAMED — because this desk nearly fell into it

`Spread.tsx` carries, in its own header and again at line 365:

> `// lenses never write orderIndex`
> `// J5 Slice 1 — the lenses. VIEW ONLY: none of these ever write orderIndex.`

**That disclaimer is scoped to the LENS ROW, not to the file.** A grep that lands on it reads as
*"the Spread never writes orderIndex"* — the opposite of the truth, since line 177 is the sole
writer in the product. **This desk drafted exactly that wrong conclusion mid-census and caught
it only by enumerating call sites instead of trusting the comment.**

*Recorded as a finding because it generalizes: a scoped disclaimer sitting near the top of a
file reads as a whole-file claim, and the census that trusts it is the census that misses the
one call site that mattered. **Comments describe intent; call sites are the evidence.***

---

## §5 · WHAT RETIRING IT WOULD AND WOULD NOT COST

**Data is safe and the decision is reversible.** `order_index` is a **real column**
(`sync.ts:254/259`), round-tripped on sync. Retiring the *affordance* retires no data: every
`orderIndex` already written keeps sorting the notebook through R1, forever. **A later ticket
could re-home W2 with nothing lost in between** — which is what makes accepting the loss a
cheap decision rather than a one-way door.

**One consequence worth Nick's eye:** with W2 gone, a writer who wants a page elsewhere in the
notebook has **no way to move it** — only to make a new one in the right place. For a *journal*
that is arguably correct (a notebook's pages do not rearrange). For a *drafting surface* it may
not be. **That is the whole of Q-C, and it is a question about what the Journal IS.**

---

## §6 · RECOMMENDATION — unchanged in direction, sharpened in scope

**Accept the loss (JV3 option 1), and say so explicitly rather than letting W2 rot.** If it is
accepted: **delete `setNotebookPosition` with the Spread, in the same commit** — a writer
function with zero call sites is a trap for the next reader, and the census above is what makes
deleting it safe to do knowingly.

**If Nick wants re-ordering kept**, the cheapest re-home is the Shelf/Trash thumbnail view
(§3 of the pass) — *but note the tension it creates:* that view's whole design rests on
**arrangement is the signature of a container**, and a drag-to-reorder is arrangement. **It
would have to be ordering-within-a-list, never positioning** — a different gesture with a
different meaning, and it should be designed as such rather than borrowed.

**Handed up with the lean, per the desk law.**

---

## §7 · THE ONE-LINE AMENDMENT OWED TO THE PASS

`item134-views-charter-pass.md` §2/JV3 says *"the Spread is where a writer authors journal
order."* **Substantially correct and now precise:** the Spread is where a writer **re-orders
existing** pages (sole call site, `Spread.tsx:177`); **new** pages are placed from the Journal
surface itself (`createLoosePage`, `JournalEntry.tsx:685`) and are **unaffected**. The pass's
three options stand; only the scope of the loss narrows.

— the PLAN desk. **Nothing locks.**
