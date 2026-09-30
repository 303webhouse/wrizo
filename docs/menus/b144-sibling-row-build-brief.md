# ITEM 144 BUILD BRIEF — THE SIBLING TAB ROW
### PLAN desk · 2026-09-16 · decision-complete · **GATED ON 108**

> **⚠ AMENDED 2026-09-24 — `b144-plus-menu-and-unnest-amendment.md`** (Nick's words on BT-Q1/Q2/Q3: a bare "＋" with Add Board / New Board, Unlink on each nested tab, un-nesting by drag, double-click replaces the parent with a back arrow). **Where this file's "＋ BOARD" / connect-list / double-click / "not in this brief: disconnecting" lines disagree, that file governs (its §8 lists them). Kept as written below.**

> **⚠ SUPERSEDED IN PART, 2026-09-19 — by `b144-board-tabs-build-brief.md` (item 144 AMENDED: THE BOARD
> TABS).** Kept verbatim below. **Superseded:** S1's *"Self is ABSENT — never listed"* (the current board
> is now a tab, marked where-you-are); **S3's separation of the two lists by RELATION** (membership is now
> in the row; they are separated by KIND OF LIST — door vs inventory); and **the gate "108 merged" for the
> row and its door** (the tag population keeps it, pending BT-Q2). **Unchanged, as the new brief's §SUP
> lists:** a press travels, never nests · condition boards excluded · the drawer's name labels the row ·
> the strip of tagged pages and cards (SR-Q1) · colour.

**WORKTREE:** `.claude/worktrees/i144-siblings` · **BRANCH:** `i144-siblings` · **OFF:** `origin/main`
**after 108 has merged.** **Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Verified at `d53506f`.

**SOURCES:** `siblings-and-highlight-pass.md` §1 · **`tag-colour-foundation.md` (binding)** ·
reference render `sibling-row-mock.html`.

**⛔ GATE: 108 merged** — this row consumes 108's vocabulary reader (for tag-siblings), its filter
component (ALL), and its tag tokens. **It builds none of them.** *(Independent of 143 and 145.)*

> **⚠ TAG COLOUR REVERSED, 2026-09-16 — read `tag-colour-foundation.md` §0 before any colour work.**
> Olive was ruled, then reversed by Nick to ORANGE, then refined: **`::selection` stays brass; a selected
> tag chip is orange (`--tag`); a matching word takes a LIGHTER orange fill (`--tag-fill`).** **Where-you-are
> markers are NOT tags and stay olive.** **And the overlap — a selection over a tagged word — is an OPEN
> acceptance test (§1 of the foundation): by the spec, an opaque selection hides the tag completely.**

---

## §0 · WHAT THIS IS — and the loop it closes

Nick: *"…every other board in that Drawer (or tagged from anywhere in the app) should be listed as
tabs below the Board but attached to it… When a user clicks on a Board tag, the Board should just
change over to that Board."*

**MEMBERSHIP** — what this board contains or is contained by (125, 128; PW2's zone).
**SIBLINGHOOD** — what this board **sits beside.** *(this row)*

**The drawer half of the set is `getBinderPages(projectId)` filtered to boards — the set the PLAN
desk called THE WRONG SUBJECT in PW1.** It was never wrong: **it answered siblinghood where membership
was asked.** This row gives that reader the question it was always answering. **No new derivation
for the drawer half.**

---

## S0 · SURVEY

**(a)** Confirm `getBinderPages` and its current callers; confirm 108's reader and `--tag` on `main`.
**If 108 has not landed, STOP.**
**(b)** Confirm PW2's zone **as ruled** — heading = **the board's name**, sections **"Pages"** and
**"Boards"**, **"Linked to this board" NOT a visible line** (PW2 ruling (1)). **This row must not be
confusable with it** (S3).
**(c)** Confirm `getSystemKind` — **condition boards are excluded from this row** (S1).

---

## S1 · THE SET

**Siblings = the other boards in this board's drawer ∪ boards sharing the active tags, from
anywhere.**
- **Self is ABSENT** — never listed (the one grammar for refusals: nonsense is absent).
- **Condition boards (Shelf, Trash) are EXCLUDED** — *a condition is not a place* (131(a)); they
  left "Boards connected" for this reason and do not arrive here instead.
- **The tag half reads 108's ONE vocabulary** — no second tag computation.

## S2 · A PRESS TRAVELS — never nests

**One press → the surface changes over to that board; the crumb updates.** Travel, not containment:
**a sibling tab never makes anything a member of anything.** *(Double-click is the canvas's gesture
for travelling INTO a nested board-card; a tab is a door, and a door takes one press.)*

## S3 · ⚠ TWO LISTS OF BOARDS — kept apart in three layers

| | membership (PW2's zone) | siblinghood (this row) |
|---|---|---|
| **place** | the rail's side panel | **attached below the board** |
| **form** | thumbnails under section heads | **tabs** |
| **word** | section head **"Boards"** | **the DRAWER'S NAME** (SR-Q2, ruled) |

**WHY THE WORD LAYER IS THE ONE THAT MATTERS, recorded so it is not simplified away:** PW2's ruling
(1) correctly removed **"Linked to this board"** as a visible line — **but it was the one visible
phrase that said *membership*,** leaving the bare noun **"Boards."** A second list of boards now
arrives. **Label the row by its drawer (`Novel`)** — the true statement of siblinghood: *these sit
where this one sits.* **A sibling found by tag from ANOTHER drawer carries its own drawer as a quiet
second line**, so the writer sees why it is there.

## S4 · TAGGED PAGES AND CARDS — A STRIP BENEATH THE TABS (SR-Q1, ruled)

**Tabs are ONLY ever doors to boards.** Under active tags, the pages and cards carrying **all** of
them appear in **a strip attached beneath the tab row** — never as tabs.
**Why:** a page in the row would travel and a card would open where you are (PW5) — **a row whose
members do different things on press is the mixed-act row PP4 forbids.**
**The strip obeys the THUMBNAIL LAW, as amended:** **boards wide · pages tall · each card its own
proportion.** **A card's aspect is `box.w / box.h` — BOTH are normalised to PAGE WIDTH** (the canvas
renders `height: box.h * pageWidthPx`). **Never scale `h` by the canvas height** — the natural move,
and it silently multiplies every card's aspect by the canvas's own proportion. **The resize handler
already stores `aspect: box.h / box.w` from the same two fields: reuse it.**

## S5 · FILTERED BY TAG — 108's component, ALL

**Mount 108's filter component; do not write a second.** Under active tags the row shows **only
boards carrying ALL of them.** Active tags visible, in order, each droppable; clear-all separate.
**An empty row states itself in words:** *"No other board carries all of #stark and #lore."* —
**never an empty strip.**

## S6 · TWO COLOURS IN ONE ROW, ON PURPOSE (`tag-colour-foundation.md` §0, §6)

- **Tag state in the row and the strip is ORANGE** — `var(--tag)`.
- **⚠ THE CURRENT-TAB MARKER STAYS OLIVE.** **It is a where-you-are marker, not a tag**, and Nick's
  reversal was **for tags only.** *The same lawful `--accent-rest`-not-brass pattern every other
  where-you-are marker in the stylesheet follows still governs it.* **This row is therefore the one place a
  reader will see both colours side by side — and each is right for what it marks.** *Do not "harmonise"
  the current tab to orange: that would read as a tag, which it is not.*

---

## S7 · THE HARNESS — `apps/desktop/scripts/harness/i144.mjs`

Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path**.

1. **The set:** drawer siblings present; **self absent**; **a condition board absent**; a board from
   another drawer present **only** under a shared active tag, **with its drawer as a second line.**
2. **A tab press travels** — the board and the crumb change; **no membership is written.**
3. **The row is labelled by the drawer's name**, and **its text never reads "Linked to this board."**
4. **ALL:** two active tags narrow the row to boards carrying both.
5. **Empty:** a disjoint selection renders **the sentence**, naming the tags.
6. **The strip holds pages and cards, never tabs**; no tab is a page or card.
7. **⚠ CARD ASPECT ON A NON-SQUARE CANVAS:** two cards of different stored proportions; assert each
   strip thumbnail's rendered ratio equals **`box.w / box.h`** — **on a canvas whose own aspect is not
   1:1**, because on a square canvas the wrong formula agrees with the right one and the check passes
   for the wrong reason.
8. **Tag state resolves from `--tag` (orange); the current-tab marker resolves from `--accent-rest`
   (olive)** — asserted separately, because they are different kinds of mark.
9. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

---

## §CLOSE

1. **Confirm the gate** — 108 merged.
2. Build S1–S7; `tsc` + `build:web` + selftest + full suite, **both settings**, green.
3. **Push the branch. Do not merge.**
4. **Not here:** the drawer seen as one body of work (*"Worldbuilding"*) — **named for the views arc's
   drawer surface (PW24, composed), not designed here.**
5. **A FOUNDER SITTING IS OWED** — *these are the right siblings, and the row is never read as the
   membership list* are meaning claims.

**Nothing deploys on this lane's word.**
