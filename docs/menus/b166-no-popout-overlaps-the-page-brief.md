# ITEM 166 — NO POP-OUT OVERLAPS THE PAGE
### PLAN desk · 2026-09-19 · brief · **a LAYOUT LAW, stated once, and its check**

**WORKTREE:** `.claude/worktrees/i166-no-overlap` · **BRANCH:** `i166-no-overlap` · **OFF:** `origin/main`.
**Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4600d7f`; the notes at `b807f59`. Line numbers are a courtesy.

> **⚠ PRIMARY TEXT — PENDING NICK's ONE-WORD CONFIRMATION.** His in-app notes (the PLAN NOTE, page 1,
> and the CARD NOTE), **transcribed verbatim by Fable from his screenshots**, recorded at `b807f59`.
> **Designed to those words and quoted where relied on.** If his confirmation changes a word, this brief
> is re-checked before anything is built.

**Reference render:** `plan-menu-mock.html` — the Plan column at four window widths, the old canon beside
the law, with the overlap read in pixels (carried on this offer and on 165's).

---

## §0 · THE LAW, IN NICK'S WORDS

> *"These notes coincide with the screenshots Plan Menu 1-3. As you can see, the the Open Board popout
> is overlapping the page. It should be adjusted by percentage of the screen so that it never overlaps
> with the page. In fact, no pop-out menu should ever be overlapping the page with two exceptions: a
> right-click menu on the text or surface (which we haven't built yet), and the Card pop-up UI."*
> — the PLAN NOTE, page 1 (typos his)

**"The Open Board popout" is the survey** — the cards of a connected board, opened from its row: the
Q3 thumbnail menu. **His own screenshot is the violator this law was written against.**

**STATED ONCE, FOR EVERY PANEL:**

> **AT EVERY VIEWPORT WIDTH, THE PAGE'S RECT AND THE RECT OF EVERY OPEN POP-OUT DO NOT INTERSECT.**
> **Two exceptions, named, and only these: (a) a right-click menu on the text or surface — unbuilt;
> (b) the Card pop-up** (with its own Styling dock, which is part of it).

### ⚠ WHAT THIS LAW REVERSES — recorded so nobody reads it as a fix to an accident

**The overlays were not accidents. They were ruled.** This law is a founder's later word superseding
earlier ones, and the record says so:
- **CD2 / T5:** an undocked cascade layer *"may overlay the paper at laptop widths — the explicit
  allowance both the brief and the canon's own T5 record state outright"* (`index.css`, the
  `--cascade-margin` comment).
- **This desk's own Journey A:** *"At 1366 the survey lawfully overlays the paper."* **Reversed.**
- **FX18:** the Tutor panel's **DEGRADATION** regime (overlay when the margin is under 280px) and its
  **BOARD OVERLAY EXCEPTION** (*"the board is an arrangement surface, not sacred paper"*).
- **⚠ NICK'S OWN 1100 ANCHOR:** the Tools dock overlaps the prose paper by **29.69px at 1100**, pinned in
  `menus-probe.mjs` `KNOWN_FINDINGS` as *"the 1100 anchor, ratified 2026-09-05 (Nick)"*. **The new law
  reverses his own earlier ratification.** *The later, general word governs — but it is his to confirm,
  not this desk's to assume* (166-Q4).

---

## §1 · WHAT OVERLAPS TODAY — the desk's read at `4600d7f`

**DERIVED FROM THE CSS, NOT MEASURED** (±30px). Two measured anchors hold it: prose `paper.left`
**242.31 at 1100** (`item130.mjs`) and **375.3 at 1366** (`errata-e1-2026-08-28.md`). **S0 measures
before anything is built.**

| pop-out | what | overlaps the page |
|---|---|---|
| **the survey — the Q3 thumbnail menu** (`CascadeSurvey`, `.wz-cascade-survey`, `min(360px,90vw)`, beside the panel) | **THE VIOLATOR** | **at every width ≥1100, on every surface** — prose ~422px at 1280, ~163px even at 1920 |
| the cascade panel (`.wz-cascade-panel`, `min(300px,86vw)`) | layer 2, incl. the Plan menu | prose at 1280 (~52) and 1366 (~9); screenplay, journal, board through 1440 |
| the Tools dock (`Sliver`) | board and page tools | prose 29.69 / screenplay 38.00 at 1100 (**measured, pinned**); journal ~52 at 1280–1440 (derived) |
| the Tutor panel (`.wz-tutor-panel`) | the Counsel | prose below ~1250; screenplay at 1280 and 1440; **the board always** (item 161) |

**Two blind spots, found on the way:**
- **The two-drawer law cannot see the Journal.** `menusDrawers.ts`' `PAPER_SEL` is
  `'.mode-page, .board-canvas-wrap, .script-sheet'` — **no `.entry-full`**, so on the Journal
  `canCoexist()` always says yes. *A guard that measures a page it cannot find is a guard passing blind.*
- **The survey's width is never counted** by the two-drawer law; it measures the panel against the Tools
  dock only.

**⚠ No existing check asserts "panel ∩ page = ∅".** Several assert the OPPOSITE (§4).

**THE CONSTRAINT THIS BRIEF INHERITS — item 83:** *"ANCHORS ARE LAYOUT; A POLICY QUESTION MAY MEASURE,
AN ANCHOR MAY NOT."* **Positions come from CSS.** JS may decide only **whether** a thing opens, docks or
closes. *Nick's "by percentage of the screen" is a CSS mechanism, so the law and the constraint agree.*

---

## §2 · THE MECHANISM — three rules, one for every panel

### R1 · EVERY POP-OUT LIVES IN A MARGIN, SIZED TO IT
**Left margin** (rail → page) or **right margin** (page → screen edge). **Width =
`clamp(FLOOR, the margin, the designed width)`, in CSS, from the SAME tokens that place the page** —
`--cascade-paper-half`, `--frame-gap`, the stage's 50% — *so the panel and the page can never drift
apart, because they are computed from one source.* **That is Nick's "percentage of the screen", made
exact: not a fixed percentage that happens to fit, but the space the page leaves.**

### R2 · CASCADES DRILL IN; THEY NEVER STACK
**One column per margin.** Layer 3 (the survey) **replaces** layer 2 (the panel) in the same column,
with the survey's existing **‹ Back**. **This is the DOCKED state that already exists** — the panel
collapses to 0, the survey takes x=84, width `clamp(120px, var(--cascade-margin), 360px)` — *"never
occludes the measure", in its own CSS comment.* **The law makes the docked state the ONLY state and
retires the undocked overlay.** *Nothing new is invented for the cascade; an existing mode becomes the
rule.* **Item 165's submenus are drill-ins in this same column.**

### R3 · BELOW THE FLOOR, THE PAGE MOVES ASIDE — IT NEVER NARROWS, AND IT IS NEVER COVERED
When a margin is narrower than FLOOR (**measure, then set; this desk's estimate is ~220px** — the
narrowest column that still holds a readable row and a thumbnail), **the page slides away from the
opening panel by the shortfall and keeps its measure** — *its line breaks never move.* It returns when
the panel closes. **The slide is CSS** (a stage attribute the panel's open state sets), **not a JS
position** — item 83 holds.

**⚖ THE RIVAL, STRONGEST FORM — SIZE ONLY, NEVER MOVE THE PAGE (166-Q1).** Nick's own sentence names
*sizing*, not sliding; **the page staying put is itself a promise** (`cd2`, `cd1` and `menus-probe` all
assert *"paper rect invariant under cascade open"*), and a page that shifts under the writer's eye each
time a menu opens is its own kind of interruption. **Its cost:** where the margin is tiny — a
screenplay's 816px sheet at 1100 leaves **~58px** on the left — a size-only panel is too narrow to hold
anything. **LEAN: R3, the slide below the floor.** *The unmeasured risk in the lean: this desk has not
measured how often a real writer's window is below the floor. If it is rare, size-only is simpler and
the rival wins.*

---

## §3 · THE BOARD — ⚠ does "the page" include the canvas? (166-Q2)

**The house already calls the canvas paper:** `PAPER_SEL` includes `.board-canvas-wrap`. **And Nick's
CARD NOTE objects to a pop-out over the board:** *"the Tutor strip menu on the Board … is misaligned with
the Board edge. When I open it, the pop-out menu overlaps the Board edge, including even the clickable
tab that opens it"* (item 161). *His words say "the page", not "the board" — so this is still a reading,
but his own complaint is about a board.* **FX18 ruled the opposite**, and the board has a property no page
has:

> **THE CANVAS IS AUTO-FIT.** `pageWidthPx = canvasOverrideW ?? containerWidthPx` — on any board the
> writer has not resized, **every card's x/y/w/h is a fraction of the wrap's own width.** **Narrow the
> wrap and every card on the board shrinks.**

**So on a board, the law has three readings, and each has a cost:**

| | reading | cost |
|---|---|---|
| **B-i** | the law covers the canvas; it **narrows** while a panel is open | **the whole arrangement zooms out** on every open and back on every close |
| **B-ii** | the law covers the canvas; its **scale is held** while a panel is open (`pageWidthPx` fixed at its pre-open width) and the wrap, already `overflow:auto`, **scrolls** | part of the board slides out of view while a panel is open |
| **B-iii** | **the law does NOT cover the canvas** — FX18 stands: an arrangement surface, not paper | panels cover cards; **161 is then a geometry defect**, fixed as 161, not by this law |

**LEAN: B-ii.** *A panel must not rescale the writer's arrangement — arrangement is the signature of a
container.* **Its unmeasured risk, named against it:** it adds a width-hold to **the board's coordinate
system** — the one place a wrong number moves every card — **and interacts with `canvasOverrideW` and the
room law's height measure.** *Nobody has built or measured that.* **B-iii is the safer build** — it
changes nothing on the board — **and it is the rival this lean has to beat.**

---

## §4 · THE CHECK — `apps/desktop/scripts/harness/i166.mjs`

**The law is only real as a check.** Standing laws: **drivers never assume existence** · **real pointer
events** · **seed through the seams** · **absolute worktree path** · **select by name**.

**THE GRID:**
- **Widths:** 1100, 1280, 1366, 1440, 1680 (paper-scale 1.1), 1920 (1.2), 2200 — at heights 768 and 900.
  *(1440 and 1920 are almost never exercised today. They are where the paper-scale steps change the
  margins.)*
- **Surfaces:** prose page, screenplay, **journal**, and the board (per 166-Q2).
- **THE ROSTER, BY NAME** — every pop-out in §1, each cascade category (Page, Plan, Drawers, Journal,
  Shelf, Settings, Themes, Trash), the survey, the Tools dock, the Tutor panel, the corner `⋯` menu;
  **plus**, when they land, item 165's submenus and item 144's connect list.

**THE ASSERTION, per cell:** open the panel with real pointer events → `rect(panel) ∩ rect(page) = ∅`
(ε 0.5px) → **the page's measure is unchanged** (under R3 its position may move; its width may not).

**⛔ THE SWEEP — so a NEW panel cannot dodge the roster.** After each open, scan every visible element
that is `position: absolute|fixed`, painted above the page, and intersecting it. **Each must be on the
EXCEPTION list** (the card pop-up; a right-click menu when one exists) **or the NOTICE list** (toasts,
the whisper — not menus, named and out of scope). **Anything else fails, by name.** *A roster alone
checks the panels someone remembered; the sweep checks the screen.*

**⛔ THE COUNT IS THE CHECK.** Report `cells opened / cells in the grid`. **A rostered panel that fails
to open FAILS its cell** — it is never skipped. *A check that opened nothing would report nothing
overlapping.*

**THE PAGE SELECTOR, fixed at the source:** `.mode-page`, `.script-sheet`, **`.entry-full`**, and
`.board-canvas-wrap` (per 166-Q2). **`menusDrawers.ts`' `PAPER_SEL` gains `.entry-full`** — one selector
list, shared by the law's check and the two-drawer law, *so they cannot disagree about where the page is.*

### PARKS OWED — never edits (the immutability law)
**Each gets SUPERSEDED + a pointer to `i166.mjs`, kept verbatim:**
- `fx18.mjs` — **S2 DEGRADATION** (asserts the overlay).
- `fx18.mjs` — **S2 BOARD OVERLAY EXCEPTION** (unless 166-Q2 rules B-iii).
- `menus-probe.mjs` — the two **`KNOWN_FINDINGS`** entries (prose −29.69, screenplay −38.00 at 1100),
  **which stop being pinned findings and become failures the law fixes** (subject to 166-Q4).
- `item130.mjs` — **S2 @ 1100, OWED TO C2** (the pinned 29.69).
- **Under R3 only:** the *"paper rect invariant under cascade open"* family (`cd2`, `cd1:90`,
  `menus-probe`) — **the invariant becomes "paper MEASURE invariant";** position may move.
**Audit the park count against this list** — a missing park is invisible to a pass/fail run.

---

## §5 · SEQUENCING
**166 lands BEFORE or WITH 165** — 165's submenus are exactly the panels this law governs, and building
them first would build them to the old canon. **144's connect list obeys it by construction** (it grows
in the row's own band). **161's fix is this law applied on the board** (per 166-Q2). **159's Styling
dock is inside exception (b).**

## §Q · FOR NICK

- **166-Q1 — below the floor:** when a window is too narrow for a menu to fit beside the page, **does the
  page slide aside** (lean — the page keeps its line breaks and is never covered) **or does the menu just
  get narrower** (your "percentage" sentence, taken strictly)?
- **166-Q2 — the board:** does "the page" include **the board's canvas**? **(B-ii, lean)** yes, and the
  board scrolls rather than shrinks while a menu is open · **(B-i)** yes, and the board zooms out ·
  **(B-iii)** no, menus may cover a board (FX18's old ruling).
- **166-Q3 — dialogs:** the pickers and the deck wizard open as **centred dialogs over everything.** Your
  exception list names the Card pop-up, **which suggests dialogs are covered too.** **Lean: yes** — they
  move into the margin column (165 already moves Create and Connect there). *The rival: a dialog asks one
  question and goes away; it is not the menu-browsing the law is about.*
- **166-Q4 — your 1100 anchor:** on 2026-09-05 you ratified the Tools dock overlapping the page by ~30px
  at the narrowest window. **This law reverses that.** Confirm?
- **166-Q5 — text-bound popups:** the screenplay's autocomplete opens **at the caret, on the text.** Is it
  exception (a)'s kind (a menu about the text, at the text)? **Lean: yes.**

## §CLOSE
1. **S0 MEASURES §1's table** at the grid — margins and overlaps per surface, per width — and records it
   in the build report **before** FLOOR is set.
2. Build R1–R3 (and §3 per 166-Q2); `i166.mjs` + the parks; `tsc` + `build:web` + selftest + full suite,
   **both settings**, green; **the park count audited against §4's list.**
3. **Push the branch. Do not merge.**
4. **A FOUNDER SITTING IS OWED** — *"no menu ever covers my page"* is checked by `i166.mjs`; *"and the
   menus are still usable at my window size"* is a meaning claim.

**Nothing deploys on this lane's word.**
