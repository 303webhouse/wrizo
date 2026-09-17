# ITEM 143 BUILD BRIEF — THE TAG CONTROLS
### PLAN desk · 2026-09-16 · decision-complete · **GATED ON 108**

**WORKTREE:** `.claude/worktrees/i143-controls` · **BRANCH:** `i143-controls` · **OFF:** `origin/main`
**after 108 has merged.** **Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Verified at `d53506f`.

**SOURCES:** `tag-controls-pass.md` · **`tag-colour-foundation.md` (binding)**.

**⛔ GATES:**
- **108 must have merged** — this brief **consumes** 108's vocabulary reader and tag tokens and
  **builds neither.**
- **The CARD mounting is additionally gated on `Box.tags` (108 S3).** If 108 shipped without it, the
  Page and Board mountings may land and **the Card mounting waits** — say so in the offer.

> **⚠ TAG COLOUR REVERSED, 2026-09-16 — read `tag-colour-foundation.md` §0 before any colour work.**
> Olive was ruled, then reversed by Nick to ORANGE, then refined: **`::selection` stays brass; a selected
> tag chip is orange (`--tag`); a matching word takes a LIGHTER orange fill (`--tag-fill`).** **Where-you-are
> markers are NOT tags and stay olive.** **And the overlap — a selection over a tagged word — is an OPEN
> acceptance test (§1 of the foundation): by the spec, an opaque selection hides the tag completely.**

---

## §0 · WHAT THIS IS

Nick: *"Instead of a heading that says 'Tags,' make the 'Add a Tag' button a '+' sign, and add a '-'
that will 'Remove a Tag.' And add a third option that shows the list of existing tags in a scrollable
list. These options should exist for every tool strip menu (Page, Card, Board)."*

**The writing half of 108's reading half. One vocabulary — 108's reader — never a second.**
**Two-hand placement is ruled by the existing menu canon and is not re-opened here:** the controls
land **where each surface's tag UI already lives** — `PageFace` for pages, scripts and boards; **the
opened card's tools** for cards (R13.v, F10 default IN).

---

## S0 · SURVEY

**(a)** Confirm `PageFace.tsx`'s current tag UI: per-chip `×`, a free-text input
(`pageFaceAddTag: 'Add a tag'`), an Add button — and its **four hosts** (`PageEditor`, `JournalEntry`,
`BoardEditor`, `ScriptEditor`).
**(b)** Confirm the unborn page passes **`onAddTag: unborn ? undefined : addTag`** — the controls
inherit that absence.
**(c)** Confirm 108's vocabulary reader and `--tag` tokens are on `main`. **If not, STOP.**
**(d)** **Lexicon:** every new string is a `deskLexicon` term; **`pageFaceAddTag` and any term the old
UI used that nothing now renders is REMOVED** — *a name nothing renders is a promise the next reader
will try to keep* (PW2 ruling (1)'s dead-term clause).

---

## S1 · THREE CONTROLS, ONE COMPONENT, THREE MOUNTINGS

| control | on press | subject |
|---|---|---|
| **+** | a field, **with the vocabulary beneath it as suggestions that narrow as you type**; Enter applies; **a word not in the vocabulary is created** — no confirmation step | the whole vocabulary |
| **−** | **this entry's applied tags**; one press on a tag **removes** it | **this entry's** tags only |
| **list** | the **whole vocabulary, scrollable, A–Z**, **this entry's applied tags marked**; **a press APPLIES** an unmarked tag, **removes** a marked one | the whole vocabulary |

**THE RULINGS, each binding (Nick accepted the leans):**
- **TC-Q1 — the list ACTS.** A press applies. *A menu row that only shows is the one row in the strip
  that does nothing.*
- **TC-Q2 — "−" costs two presses, and that is accepted — ON ONE CONDITION: THE APPLIED TAGS STAY
  VISIBLE ON THE ENTRY WITHOUT PRESSING ANYTHING.** *"−" is how you remove, never how you find out
  what is there* — the state speaks first (PP2).
- **TC-Q3 — ON A BOARD, THE CONTROLS ALWAYS TAG THE BOARD.** **Selecting a card does NOT re-target
  them.** Card tags live in the opened card's own tools.

**WHY TC-Q3 IS LOAD-BEARING, so no one "helpfully" makes the board's "+" follow selection:** a writer
selects a card, presses "+", types `stark` — **and tags the board.** Then filters by `stark` and the
card they meant is not there. **A control whose subject changes under the writer's hand is the
ambiguity, not the cure.**

## S2 · EVERY CONTROL NAMES ITS OBJECT

**A bare "+" is maximally destination-blind** — the named enemy (CA1). **The accessible name and the
tooltip carry the subject:**
- page — **"Tag this page"** · **"Remove a tag from this page"** · **"This page's tags"**
- board — **"…this board"**
- card — **"…this card"**
*The words the eye does not see must say it for the hand.*

## S3 · THE LIST IS NOT THE FILTER — and why that is not a preference

These controls live in the **tool strip — the ACTING hand.** **G8:** *left presses act on the page;
right presses speak about it.* **Q19 (ratified):** *the rail travels; the Counsel reads.* **A filter
is reading.** **Pressing a tag in THIS list applies or removes it — a writing act — and never narrows
the view.** The filter is 108's, on the view.

## S4 · ABSENT, NEVER DISABLED

- **Unborn page** → no controls (PB1, already true).
- **Condition board** (Shelf, Trash) → no controls — a condition is not a writing surface.
- **Card mounting** → absent until `Box.tags` exists.

## S5 · THE TAG COLOUR (`tag-colour-foundation.md` §4–§6)

- A **selected / applied** tag chip wears **`--tag`** (orange); the list's applied mark is **static and
  quiet, in `--tag`.**
- **A2 / A3 / A4 are no longer hazards** under the reversal — the brass-press classes and the orange
  field focus are now on-colour.
- **A5 / A6 — approved:** the transient press flash stays orange; the global focus ring stays brass.

---

## S6 · THE HARNESS — `apps/desktop/scripts/harness/i143.mjs`

Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path**.

1. **"+" suggests from the vocabulary** — a tag used on **another** entry appears as a suggestion.
2. **"+" creates** a word not in the vocabulary, with no confirmation step.
3. **"−" lists only this entry's tags**; one press removes one.
4. **The applied tags are visible with every control closed** (TC-Q2's condition).
5. **The list applies on press** and **marks** the applied; pressing a marked tag removes it.
6. **⚠ TC-Q3 — the misfire, asserted:** on a board **with a card selected**, "+" tags **the board**
   and **the card's tags are unchanged.**
7. **Accessible names name the object**, per surface.
8. **Absent** on an unborn page and on a condition board.
9. **The list never narrows the view** — pressing a tag leaves every card/page visible.
10. **One vocabulary** — the controls read 108's reader; a static assertion that they compute none of
    their own.
11. **Applied tag state resolves from `--tag`** — never a literal.
12. Both `HARNESS_PARKED` settings CLEAN; **park count audited** — `PageFace`'s old tag UI has
    coverage somewhere; **park it with its original quoted verbatim and 143 named as successor.**

---

## §CLOSE

1. **Confirm the gate** — 108 merged; `Box.tags` present or the Card mounting deferred and said so.
2. Build S1–S6; `tsc` + `build:web` + selftest + full suite, **both settings**, green.
3. **Push the branch. Do not merge.**
4. **A FOUNDER SITTING IS OWED** — *the right thing got tagged* is a meaning claim.

**Nothing deploys on this lane's word.**
