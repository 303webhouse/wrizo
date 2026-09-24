# PLAN DESK — RESTART NOTE (session seed)
**Written 2026-09-23 · main at `a089bd2` · nothing running · no box turn held**

---

## 1 · ROLE

**The PLAN desk is the DESIGN desk for Wrizo's Boards / Pages / Drawers system.**
**DESIGN ONLY: no code, no checkout, no build.** The medium is **committed documents and HTML mockups**.

- **Nick** is the founder, the **only courier**, and the **only authority**.
- **Fable** (architecture lead) reviews. *A new Fable took over at `1331892` on 2026-09-23.*
- **Chat 1** keeps the ledger and **merges to main**. **This desk never merges.**

**How this desk works, and these are not preferences:**
- **Writes only to the scratchpad.** *Never into the shared primary checkout's working tree.*
- **Offers are docs-only branches**, built in gitignored `.claude/worktrees/`, **based on `origin/main`
  pinned by SHA**, pushed as branches. **Chat 1 merges. The building lane never does.**
- **Never build on an already-merged branch.** **Never rebase a merge commit.**
- **`git rev-list --count origin/main..HEAD`** is the merged-branch test. **0 → reset to current main
  FIRST, then patch.** *(An `--is-ancestor` test false-refuses a fresh branch; and a `reset --hard` AFTER
  patching silently discards the patch — both happened on 2026-09-23.)*
- **Special content (backticks, backslashes) goes through a FILE**, never inline in a shell.
- **Symbols are the anchor**; line numbers are a courtesy.
- **Hand up conflicts even with a lean** — present the rival in its **strongest** form, and name which
  option carries **unmeasured risk even if it is mine**.

---

## 2 · THE BOX — READ THIS BEFORE RUNNING ANYTHING

> **⛔ A WORKTREE ISOLATES FILES, NOT THE BOX.** One machine, one browser pool.
> **No harness, probe, suite or browser launch without a box turn** read from the ledger or granted by
> chat 1. **Never infer a turn from quiet.**

**THIS DESK HAS LAUNCHED NOTHING, ALL SESSION.** **It holds no turn now.**
**Its one queued box item is the NOTE-KEY MEASUREMENT** (below), **last in the queue.**

---

## 3 · WORKTREES AND BRANCHES

| worktree | branch | state |
|---|---|---|
| `.claude/worktrees/exp1-q1` | **`plan-exp1-q1` @ `d9f688e`** | **⚠ OPEN — 1 commit ahead, awaiting chat 1's merge** |
| `.claude/worktrees/exp1-amend` | `plan-exp1-amend` @ `b52e151` | merged at `87cd9f5` — worktree left in place, safe to remove |
| `.claude/worktrees/vw1-rail-brief` | `plan-vw1-rail-brief` @ `7508d91` | merged |

**Every other `plan-*` branch on origin is MERGED.** *(`.claude/worktrees/exp1-connect` holds branch
`exp1-connect-text` — that is **PW's build worktree**, not this desk's.)*

---

## 4 · DOCUMENTS — ALL ON MAIN UNDER `docs/menus/` UNLESS MARKED

| SHA | document | state |
|---|---|---|
| **`d9f688e`** | **`b-exp1-connect-from-the-page.md`** | **⚠ UNMERGED tip** — the Q1 fold. Base merged at `b52e151`. |
| `f0b4726` | `page-first-rail-pass.md` | merged — the pass ON Fable's drawing |
| `c400203` | `conservative-v2-design.md` · `architecture-options-mock.html` | merged |
| `47d0331` | `architecture-double-pass.md` | merged |
| `b418599` | `item171b-ink-on-boards-and-cards-charter.md` | merged — **next item's foundation** |
| `0bff284` | `item172-board-types-pass.md` | merged |
| `b947cc9` | `book-type-mock.html` · `vw3-journal-build-brief.md` | merged |
| `9fc4e99` | `b144-tab-bar-amendment.md` · `board-tabs-mock.html` | merged |
| `23effd5` | `b144-sibling-row-build-brief.md` | merged |
| `18b4332` / `375f65e` | `b165-plan-menu-restructure-brief.md` · `plan-menu-mock.html` | merged |
| `023b04d` | `b166-…-brief.md` · `b167-card-names-brief.md` · `b168-deletion-charter.md` | merged |
| `fa70f7b` | `b169-side-by-side-charter.md` | merged |
| `db393d8` | `b177-page-menu-brief.md` · `page-menu-mock.html` | merged |
| `d57a7e6` | `b178-pages-lexicon-brief.md` | merged |
| `1d90b9d` / `d87b7ff` | `b180-drawer-gesture-charter.md` · `b181-objects-on-a-journal-board-charter.md` | merged |
| `641f728` | `multi-board-pass.md` · `multi-board-options-mock.html` | merged |
| `4ba3670` | `pw-rulings-fold.md` · `pw-journey-c-cold-start.html` | merged |

> **⛔ A MOCK THAT HAS NOT REACHED THE FOUNDER HAS NOT BEEN DELIVERED — VERIFY THE COPY, NOT THE COMMIT.**
> *(A mock was committed and never copied to `C:\Users\nickh\Downloads\`, so it never reached him.)*
> **As of 2026-09-23 the pencil is DOWN: no redraw is owed, and if a static redraw is needed later
> FABLE draws it and it reaches Nick as a link, with no courier trip.**

---

## 5 · WHAT THIS DESK WAITS ON, AND FROM WHOM

**FROM CHAT 1**
- **Merge of `plan-exp1-q1` @ `d9f688e`.**
- **A BOX TURN** for the note-key measurement *(last in the queue; test written, never run)*.

**FROM NICK, VIA FABLE**
- **EXP1-Q5 — overlapping anchors.** *Painting makes them possible; the drawing's wrapping made them
  impossible.* **Lean: YES**, with the rail listing what covers a spot. **A skip takes the lean.**
- **EXP1-Q6 — the spot-note's gutter mark.** **Lean: YES. A skip takes the lean.**
- **171B-Q1 / Q2 / Q3** — see §7, and read the finding there first.
- **Item 145's Q-OV1** (a tint under an opaque selection). **Does NOT block Experiment 1** — its claim is
  weaker than 145's.
- **The MOVE collision** — *"movable back and forth between boards"* reverses item 123's copy-only-with-
  provenance. **Held with Nick. Nobody designs or builds it.**
- **Older open questions**, all in their own documents: 172-Q2–Q6, 166-Q1–Q5, 165-Q1–Q3, 167-Q1–Q3,
  168-Q1–Q2, 169-Q1/Q2/Q7, 178's Flux question, 180's and 181's.

**ANSWERED — DO NOT RE-ASK**
- **EXP1-Q1 — the links column. Nick, 2026-09-23, verbatim: *"1. Yes"***. **One additive nullable jsonb
  column, `journal_entries.connections`, plus its TWO MAPPER LINES.** *The name is settled by adoption.*
- **EXP1-Q2** → a card with no board lands on **the page's own plan board**, created quietly.
- **EXP1-Q3** → **a faint tint on the words**, never an underline.
- **EXP1-Q4** → **`Ctrl/Cmd+Enter` everywhere**; no desktop-only `Ctrl+N`.

---

## 6 · RULINGS THIS DESK WORKS UNDER

**NICK'S PRINCIPLE, VERBATIM — the thing every design is tested against:**
> *"the text, or page, is primary"*
> *"Every architectural choice we make needs to respect both pantsers and plotters without forcing either
> writer to go down a set path from the outset. That is the hard problem we're trying to solve here."*

**ARCHITECTURE**
- **Nick chose CONSERVATIVE**: ship as **experiments inside the real app** — a Settings section, **one
  switch per piece, off by default, data hidden never deleted**. **With every switch off, v2 behaves as
  v1**, and that is assertable.
- **THE FIVE ZONES:** left rail (organization) · left strip (presentation) · **THE PAGE** · right strip
  (Tutor) · right rail (this page's things).
- **ONE PANEL COLUMN PER SIDE** (item 166 R2 generalized). *Everything opening on a side opens IN that
  column; the Tutor and the rail's lists TAKE TURNS in it. No third surface.* **119's mirror still knows
  two hands.**
- **Item 166's law:** no pop-out overlaps the page. **R1** size to the margin · **R2** cascades drill in,
  never stack · **R3** the page slides below the floor.

**THE PAGE AND ITS MARKS**
- **Anchors are SPANS**, scoped within a paragraph, stored outside `entry.text`.
- **⛔ AN ANCHOR NEVER MOVES ITSELF TO A GUESS** *(ratified, banded)*.
- **⛔ MARKS ARE CSS ON A WRAPPING SPAN; WORDS LIVE IN THE PANEL** *(TRR14)*. **A marker element carrying
  text would be SAVED INTO THE MANUSCRIPT.**
- **In the app the mark is PAINTED, not wrapped** — `draftDecoration.ts` **rule 1** refuses to rewrite the
  DOM under a non-collapsed selection, and the connect gesture *begins* with one. **⚠ `CSS.highlights` /
  `::highlight()` appear NOWHERE in the tree; item 145's ratification is CONDITIONAL on a measurement
  that 145 and Experiment 1 SHARE — it is done once.**
- **F1:** weight cannot be set through the Highlight API. **F2: underline belongs to the writer**
  (item 122's `__word__`).
- **Colour:** `--brass:#FF9800` = what you do / selection / tags · `--accent-rest:#96a05a` olive = where
  you are · `--on-brass:#1C1610`. **Hand-computed ramps, never `color-mix()`.**

**CONTAINERS**
- **Three-space canon:** surfaces / containers / displays. **A board is a container, and no writing is
  made on a board.** Shelf and Trash are displays of a CONDITION.
- **Membership vs display (item 125):** `page-pin` is the membership record; `onCanvas?` gates display;
  **ABSENCE MEANS DISPLAYED.**
- **"Arrangement is the signature of a container."**
- **Thumbnail law:** *BOARDS ARE WIDE. PAGES ARE TALL. A CARD WEARS ITS OWN PROPORTION* — amended: **a
  board wears the proportion of its TYPE; a Book is tall.**
- **Board types (172):** Default / Book / Bibliography. **Types cannot change after birth.** **Board
  views (Open/Storyboard/Outline) are SCRAPPED by Nick's own words.**
- **THE GROUPING LAW** *(ratified at 177; applied three times)*: **a multi-valued key GROUPS rather than
  sorts** — an item appears under **every** value it carries, and **the section prints its own
  arithmetic.**
- **Reference vs copy:** pages and records are **referenced** (page-pin); scratch cards **copy**
  (item 123, copy-only with `copiedFromBoardId`).

**PROCEDURE**
- **A desk does not read a ruling out of a relay addressed to another lane.**
- **A desk does not design from a SUMMARY of a founder message — it needs the verbatim.** *A founder may
  authorize a transcription; a desk may not.*
- **WHEN A SECTION MOVES INTO A NEW MENU, THE NEW BRIEF ASSERTS ITS PLACE, NOT ITS BEHAVIOUR.**
- **A DIFF AGAINST THE WRONG BASE ACCUSES A BRANCH OF EVERYTHING MAIN HAS GAINED** — use `git merge-base`
  per branch, never a forced `--merge-base`.
- **`origin/main` MOVES MID-SESSION.** *It moved three times on 2026-09-23.* **Fetch immediately before
  branching, and read the records delta.**

---

## 7 · BOOT ORDER

**1 · `git fetch origin`. Read `docs/open-threads.md` for everything after `a089bd2`.** *Another lane's
merges and Nick's words land there while this desk is away.*

**2 · Check whether `plan-exp1-q1` @ `d9f688e` merged.** If not, leave it; **do not rebuild it**.

**3 · ⛔ 171-B — THE NEXT DESIGN, AND READ THIS FINDING BEFORE STARTING IT.**
Fable's order: **171-B's design goes first** *(INK runs dry after its two pairs)*, **then 144 onward.**
The charter is merged at **`b418599`** and is a sound foundation — its Q3 already carries **the five
collisions as a ratified acceptance test**.
> **⚠ THE FINDING, MEASURED 2026-09-23: ITEM 171-B APPEARS NOWHERE IN THE LEDGER — ZERO MENTIONS in
> `docs/open-threads.md`.** **So 171B-Q1, Q2 and Q3 have never reached Nick through the record, and
> 171B-F1** *(the pen-inert law is REVERSED for boards and cards by Nick's ruling, and needs recording as
> a reversal)* **and 171B-F2 were addressed to Fable and never actioned.**
> **This is the same shape as the handoff's "defaults that reached no relay".**
>
> **171B-Q1 is the hinge — the charter says "everything else here follows from this one."**
> **LEAN: put 171B-Q1 to Nick in the SAME relay as EXP1-Q5/Q6** *(zero extra courier cost — Fable is
> relaying those anyway)*, **and write the design pass meanwhile on the leans, marking exactly what Q1
> would change.** **Hand the choice up; do not resolve it quietly.**

**4 · Then 144 onward, as queued.**

**5 · Held, and not to be restarted without a word:** the **five-zone mockup** *(pencil down — Fable
draws if needed)*; the **MOVE**; **TUTOR's preset contents**; **the Shelf/Trash-as-rows re-grounding of
VW2**.

**6 · The note-key measurement** — *test written, never run.* **Needs a box turn. Do not take the box.**

---

## 8 · THE ONE-LINE STATE

**Experiment 1 is fully designed, its schema gate is OPEN on Nick's "Yes", nothing in its brief blocks a
builder, and the two lanes are assigned: A (text side, sole writer of `store/anchors.ts`) → PW · B (rail
side + item 190's switch) → TOOLS.**
