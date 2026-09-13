# VW1 BUILD BRIEF — THE RAIL
### PLAN desk · 2026-09-13 · item 134, brief 1 of 4 · decision-complete

**WORKTREE:** `.claude/worktrees/vw1-rail` · **BRANCH:** `vw1-rail` · **OFF:** `origin/main` at
build time (fetch first). **Never the primary checkout.** **This lane pushes its BRANCH; the
merge is chat 1's.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — standing law. **One machine, one browser pool:
> a run from ANY tree is a run on the box.** Before any harness, probe or suite launch, read the
> current box ordering on the ledger or ask chat 1 — **never infer your turn from quiet.**
> *(No dates here on purpose: the ordering lives on the ledger, the law lives in the brief.)*

> **⚠ LINE NUMBERS ARE A COURTESY; SYMBOLS ARE THE ANCHOR.** Verified at `9153ac6`. Locate by
> symbol; if a number misses, report it rather than hunting.

**RULING:** Nick, 2026-09-13 — **"2. Group"** and **"4. Keep it at the foot."**
**SOURCE:** `docs/menus/item134-views-charter-pass.md` §5 (RV1, RV2), FINAL.

**⛔ GATE — ITEM 137 (TOOLS).** The Trash is *already* ruled and *already* coded to the foot
(`.wz-strip-foot{margin-top:auto}`). It renders inline because **`.desk-frame-strip` carries
`min-height:70vh` and no `height`**, so `.wz-strip`'s `height:100%` cannot resolve and no-ops to
auto — the column shrinks to content and `margin-top:auto` has no free space. **This brief
ASSUMES 137's fix and MUST NOT attempt it.** If 137 has not landed, the grouping still lands
correctly and Trash still renders inline; **that is 137's defect, not this brief's regression,
and a builder who "fixes" it here has taken another lane's ticket.** *(The house already
diagnosed this class in FX3 S1 and fixed it for the paper — same bug, different element.)*

---

## §0 · WHAT THIS BRIEF IS — and why it is not a twelve-line change

**The visible change is trivial: reorder four arrays.** The real work is that **38 harness call
sites in 18 files select strip tabs BY INDEX**, and every one of them silently points at a
different tab after the reorder.

**That is the whole ticket. Read §2 before §1.**

---

## S0 · SURVEY — the census is already done; confirm it

**(a)** Confirm the sections in `Cascade.tsx`: `SECTION_A [journal]` · `SECTION_B [page, plan]` ·
`SECTION_C [drawers, shelf]` · `SECTION_D [settings, theme]` · `SECTION_TRASH [trash]`, rendered
by `renderSection` with `wz-strip-sep` separators between them.

**(b)** Confirm **no DOM hook exists** for a category: `renderSection`'s button carries
`className`, `aria-pressed` and `onClick` only. **`key={item.id}` is React-internal and never
reaches the DOM.**

**(c) THE INDEX CENSUS — counted programmatically over the full tree, not sampled:**

> **38 sites · 18 files.** By index: **`[0]`×9 · `[1]`×18 · `[2]`×6 · `[3]`×4 · `[7]`×1.**
> Files: `b1`(5) `b2`(5) `fx7`(4) `cd2`(4) `pw1`(2) `j6`(2) `fx6`(2) `fx1`(2) `cd1`(2)
> `b2-1`(2) `pb1` `item88` `item87` `item83e` `item112a` `item104` `fx14` `ab3` (1 each).

**Re-run the census at branch tip and report the number.** If it differs from 38, another lane
has touched the strip and this brief's §2 scope has moved.

**(d) THE FAILURE MODE IS THE DANGEROUS ONE, and it is why §2 exists.** After the reorder:

| index | today | after |
|---|---|---|
| `[0]` | journal | **page** |
| `[1]` | page | **plan** |
| `[2]` | plan | **drawers** |
| `[3]` | drawers | **journal** |
| `[4]` | shelf | shelf *(unchanged by coincidence)* |

**None of these throws.** Every selector still finds *a* button and clicks it — the wrong one.
Some checks will go red; **others will pass against the wrong panel.** This is item 130's shape
exactly: *the instrument answered the question it was asked, and the question was not the one
that mattered.*

---

## S1 · THE REGROUPING — grouped by kind, separators doing the teaching

```
  Page · Plan          — where I am, and what holds it
  ─────────
  Drawers              — where things live (the foundational container)
  ─────────
  Journal · Shelf      — what the app shows me (by date · unfiled)
  ─────────
  (foot) Settings · Theme · Trash
```

**Arrays become:** `A [page, plan]` · `B [drawers]` · `C [journal, shelf]` · `D [settings,
theme]` · `TRASH [trash]`. **Nothing else changes:** same eight tabs, same ids, same lexicon
terms, same icons, same `renderSection`, same separators, **zero new strings, zero schema.**

**LAWS THIS MUST NOT BREAK:**
- **The separators do the teaching, silently.** **No headings, no group labels, no tooltips
  naming the kinds.** The writer never reads *surface*, *container* or *display* — that
  vocabulary is the desk's, not the product's.
- **G5 / the ember ceiling is untouched** — no new engraved headings, no resting orange.
- **Trash keeps the foot** (B1 S5, re-ruled by Nick) with its thin line above it: *reachable,
  never prominent.*
- **The Shelf leaves the Drawers band.** That pairing — a **condition** beside the **foundational
  container** — is erratum 131(a)'s category blur rendered in furniture. **Moving it is the
  point of the ticket, not a side effect.**

---

## S2 · THE REAL WORK — RETIRE INDEX SELECTION. DO NOT RENUMBER.

**Add the hook (one attribute):**

```
data-category={item.id}      // on renderSection's button, beside aria-pressed
```

**Then convert all 38 sites** from `[...document.querySelectorAll('.wz-strip-item')][N]` to
`document.querySelector('.wz-strip-item[data-category="page"]')`.

**⚠ RENUMBERING IS REFUSED, and this is the load-bearing instruction.** Rewriting `[0]`→`[3]`
would make the suite green and **leave the trap fully armed for the next reorder** — which this
charter guarantees, because briefs 2–4 change these same views. **A positional selector is a
rule that must be remembered every time; a named one is a rule that must be broken on purpose.**
*(The same reasoning that made `getBoardsConnecting` a named reader rather than a filter at each
call site — and that ruling exists because the filter version shipped a canon violation.)*

**Each converted site keeps its intent in a comment** where one existed (`// Journal category`,
`// Plan category (index 2)`) — **drop the stale index from the comment**; a number that no
longer means anything is worse than no comment.

**Park discipline:** this is a *selector* change, not an assertion change. **If any assertion's
MEANING changes, park it with its original quoted verbatim and audit the park COUNT against this
brief's claim** — a green run cannot see a check that is no longer there.

### ⚠ SEQUENCING — THE DESK'S RECOMMENDATION, HANDED UP

**Two lawful orders, and they are not equivalent:**

| | order | what a red tells you |
|---|---|---|
| **(a)** | one commit: hook + convert 38 + regroup | **nothing.** A red could be the conversion or the reorder, and you cannot tell which. |
| **(b)** ✅ | **commit 1: hook + convert 38, NO regroup** (pure refactor — the suite must stay **green and unchanged**, proving every conversion correct while the order is still the old one). **commit 2: the regroup.** | **everything.** A red in commit 1 is a bad conversion; a red in commit 2 is the reorder. |

**Recommend (b).** It costs one extra suite run and buys the ability to isolate a cause — and
with 38 sites across 18 files, "something went red somewhere" is not a diagnosis. **A refactor
that cannot be distinguished from the behaviour change it enables is a refactor you cannot
trust.** *(Both are offered; chat 1's or Fable's call if it prefers one commit.)*

---

## S3 · THE HARNESS — `apps/desktop/scripts/harness/vw1.mjs`

Auto-discovered by `run-suite.mjs`; no registration. Standing laws apply: **drivers never assume
existence** (probe, then fail a CHECK that names the target — never a bare click that aborts the
file), **real pointer events** (`pointerdown`/`pointerup`, never synthetic `click` — item 130
shipped because `.click()` bypasses hit-testing), **seed through the seams**, **absolute
worktree path**.

**Checks owed:**
1. **Eight tabs, in the ruled order**, asserted **by `data-category`** — `page, plan, drawers,
   journal, shelf, settings, theme, trash`.
2. **Four separators**, in the ruled places (after `plan`, after `drawers`, after `shelf`, above
   `trash`).
3. **`shelf` is NOT adjacent to `drawers`** — the erratum-131(a) blur, asserted as *absence*,
   because that is the thing the ticket exists to end.
4. **Every tab still opens its own panel** — one press each, all eight, by `data-category`.
5. **No group label, heading or tooltip names a kind** — assert the strings *surface*,
   *container*, *display* appear nowhere in the rail's rendered text.
6. **`data-category` is present on all eight** — the hook's own coverage, so a future reorder
   cannot silently remove it.
7. **Zero index-based strip selectors remain in `apps/desktop/scripts`** — a **static grep
   assertion**, which is the only check that keeps §2 from rotting back. *This is the check that
   makes the ticket durable rather than a one-time tidy.*
8. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

**NOT this harness's business:** the foot's *geometry* (item 137). Assert Trash is **last in
order**; do **not** assert its rendered `y`.

---

## §CLOSE

1. S0 reported — **especially (c)'s recount.**
2. Build S1–S3 in the (b) order unless told otherwise; `tsc` + `build:web` + selftest + full
   suite, **both settings**, green, independently re-run at branch tip.
3. **Push the branch. Do not merge.** Docs-only? **No — this one touches source and harnesses**,
   so it takes the ordinary gate, not the docs-only one.
4. **Not in this brief:** item 137's geometry · the Shelf/Trash view (brief 2) · the Journal flip
   (brief 3) · Empty Trash (brief 4).

**Nothing deploys on this lane's word.**
