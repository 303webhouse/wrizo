# ITEM 166 — FROM A LAW TO A GUIDELINE, AND THE STRIPS' ROOM
### PLAN desk · 2026-09-24 · **amendment to `b166-no-popout-overlaps-the-page-brief.md`** — Nick answered 166-Q1, Q2 and Q4

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `d115b16`. Line numbers are a courtesy.
> **⚠ THE RECORD:** his words reached this desk verbatim in Fable's relay; chat 1's entry is at `d115b16`
> (Records: *Nick's words on item 166*). **Where this file says "ruled" it means his recorded words as
> relayed; chat 1's entry governs if the two differ.** **Nothing in the merged brief is rewritten in place** —
> each superseded line is named in §7 and kept as written.

---

## §0 · HIS WORDS, VERBATIM (typos and the "---" his)

> *"166-Q1: Just have it overlap the page in these fringe cases. 166-Q2: I don't see how this would work
> if side panels from both sides are opened at the same time. If we're only allowing one menu to be open
> at a time, the menus should be able to fit next to the board. If they can't because the window has been
> shrank or the user is on a small laptop screen, then let's have the menus just overlap the board. There
> should always be enough room on either side of the board, though, for the strip menus to open without
> the board being moved or overlapped. 166-Q4: This is fine on the narrowest screens. It's a guideline ---
> not a hard-and-fast rule."*

**What it rules (Fable's reading, which this desk shares):** the no-cover law is **a guideline, his word.**
Side panels sit **beside** the page or board when there is room, and **overlap** it on a shrunk window or
small screen. **The strips always keep room on both sides of the board — his "always".** The narrow-screen
toolbar allowance stays.

---

## §1 · THE RULE, STATED ONCE — it replaces §0's law

> **A SIDE PANEL SITS BESIDE THE PAGE OR BOARD WHEN ITS MARGIN CAN HOLD IT. WHEN THE MARGIN CANNOT, THE PANEL
> OVERLAYS — AND THE PAGE OR BOARD NEVER MOVES, RESIZES OR UNMOUNTS.**

- **"Can hold it" is a MEASURED comparison, not a device name:** the margin (the space the page leaves on
  the panel's side, from the SAME tokens that place the page — R1) against the panel's FLOOR (the merged
  brief's own R1 floor; its ~220px is an estimate, **S0 measures it**). **`margin ≥ FLOOR` → beside;
  otherwise → overlay.** *His "fringe cases" are exactly `margin < FLOOR`, and are found by arithmetic, so
  no one has to say which laptop counts.*
- **R1 (a panel lives in a margin, sized to it) and R2 (cascades drill in; they never stack) STAND
  UNCHANGED.** *The guideline changes what happens when the margin is too small, not where panels live.*
- **R3 IS RETIRED — the page no longer slides aside.** *His Q1 word ("just have it overlap the page") is
  the rival the merged brief named in its strongest form and could not beat, and it is the only reading
  consistent with `AGENTS.md`'s page-primacy canon (**tools overlay without displacing: the page's rect
  never changes**). A builder must not read "overlap" as licence to move the page** — the rect stays put
  in both regimes. **The paper-rect-invariant checks (`cd2`, `cd1:90`, `menus-probe`) therefore need NO
  park:** they stay true.
- **Two safeguards the fringe regime needs, both from his own words and both asserted (§6):**
  **(1) an overlaying panel never covers the control that opened it** — his 161 complaint (*"the pop-out
  menu overlaps the Board edge, including even the clickable tab that opens it"*) is a defect under the
  guideline too; **(2) it is dismissible the way any panel is** (Esc, the same control, a press outside),
  because a writer whose line sits under a covered edge must get it back in one act.
- **The unmeasured risk, named:** this desk has not measured how often a real window is in the fringe or how
  much of a writer's text an overlay covers there. **The overlay side is the panel's own side and its width
  is capped as today (`min(300px, 86vw)`); nothing above bounds what the text loses beneath it.**

## §2 · THE BOARD — 166-Q2 answered; the width-hold risk disappears

**The three readings the merged brief weighed (B-i zoom out · B-ii hold the scale and scroll · B-iii no
law) are all superseded by a fourth that is his:** **beside when it fits, overlay when it does not — the
canvas is never rescaled and never scrolled by a panel.** **That retires B-ii's named risk** (a width-hold
added to the board's coordinate system, interacting with `canvasOverrideW`) **and B-i's whole-arrangement
zoom, without building either.** *Item 161's fix becomes §1's rule plus safeguard (1) applied to the board —
not a new mechanism.*

## §3 · THE STRIPS' ROOM — his "always", and the one place it collides with his own Q4

**His sentence:** *"There should always be enough room on either side of the board … for the strip menus to
open without the board being moved or overlapped."* **The strip menus (the styling/Tools dock on one hand,
the Tutor panel on the other) are a DIFFERENT class from the rail's side panels** — panels may overlay in
the fringe; strip menus may not. **What that requires is a STATIC reservation, not a per-open change:**
**each side of the stage reserves a strip-menu gutter (the widest strip menu's designed width + the frame
gap), and the page or board is sized to the stage MINUS both gutters.** *Measured today by no one: the
merged brief §1 lists the dock's and the Tutor panel's overlaps as derived-from-CSS, ±30px.* **S0 measures
the two strip menus' widths and the stage at 1100 / 1280 / 1366 / 1440 / 1680 / 1920 / 2200.**
**On a board the canvas is auto-fit, so a smaller canvas at a small window means smaller cards — once, at
layout, not on each open.** *(That is his sentence's price, and it lands on the board and not on the
strips.)* **The board's floor stays `CANVAS_MIN_W` (560).**

### ⚠ THE COLLISION, HANDED UP — "always" against the narrow-screen allowance
**Q4 keeps a ratified overlap:** the Tools dock overlaps the prose paper by **29.69px at 1100** (screenplay
38.00), pinned in `menus-probe.mjs` `KNOWN_FINDINGS`. **"Always enough room" and "fine on the narrowest
screens" cannot both be literal at 1100.** **This desk's reading (Fable already ruled the allowance stays):**
**Q4 is the named exception to "always", and it is defined by MEASUREMENT, not by 1100:** *the strips keep
their room at every width where the page can be sized to leave it; where the page is already at its own
floor (prose and screenplay hold their measure — FX3's Law 1: the measure, not the pixel width, is the
constant), the pinned allowance stands and nothing is asked to shrink further.* **The rival:** "always"
wins outright and the anchor allowance is retired — **which contradicts his Q4 word and is not adopted.**
**The unmeasured risk sits on this reading:** *"narrowest" is his word and 1100 is only where it was
pinned; whether the allowance holds at widths above 1100 is what S0's numbers decide.*
**Stated once so it is not misread:** **a board has no such floor problem** — its canvas can shrink — so
**on a board "always" holds without exception down to `CANVAS_MIN_W`, and below that the same allowance
reading applies.**

## §4 · OPEN WITH HIM — one panel in total, or one per side (Fable's question)

**Default (vetoable, not founder text): ONE PER SIDE, as today** (the approved rule; the Tutor and the rail's
lists take turns *within* a column). **His fit-or-overlap rule applies either way.**
**What his worry needs, and this desk names it because "one per side" alone does not answer it:** *two
panels open at once in the fringe would both overlay the board from opposite edges and could cover all of
it.* **A measured safeguard, so the default survives the fringe:** **if the two panels' combined width would
leave less than a minimum visible strip of the board (S0 sets the number), opening the second CLOSES the
first — they take turns *across* sides only in that case.** **The rival, in its strongest form — ONE PANEL IN
TOTAL, always:** *it makes his worry impossible by construction, needs no safeguard and no measured
minimum, and is what his own sentence gestures at.* **Its cost:** *a writer cannot keep the Plan column
open while using the Tutor even on a wide screen with room for both.* **The unmeasured risk sits on the
default:** *nobody has measured how often a writer holds both open.*

## §5 · 166-Q3 AND Q5 — RE-BASED ON THE GUIDELINE (Fable asked for them back)

**Why they needed re-basing:** written against the hard law, a skip on either would have *carved an
exception from the law*. **Under the guideline there is nothing to carve** — a panel may overlap in the
fringe anyway — **so the defaults now read as the status quo, and a skip changes nothing:**
- **166-Q3 — dialogs (pickers, the deck wizard).** **Default: they stay centred dialogs over everything, as
  built.** *They ask one question and go away; the guideline governs panels the writer browses, not
  transient dialogs — and no law now requires moving them into the margin column.* **The alternative he can
  choose:** *dock them in the margin column when there is room — "beside when it fits" applied to dialogs.*
  **Its cost:** a build for a surface that appears for seconds.
- **166-Q5 — text-bound popups (the screenplay's autocomplete at the caret).** **Default: unchanged — they
  open at the caret, on the text, because that is what they are.** *A popup about the text cannot sit
  beside the page.* **The alternative:** *none of substance* — **a caret popup pushed to a margin stops
  being a caret popup.** **Recommendation: strike Q5 from the sheet as a non-question and record the
  default here; keep Q3 only if he wants dialogs docked.**
- **The exception list changes shape:** the merged brief's two named exceptions ((a) right-click menu,
  (b) the Card pop-up) become **a CLASS — transient surfaces that never take a margin: the right-click
  menu, the Card pop-up (with its Styling dock), dialogs, caret popups.** **Not subject to "fits".**
  *(One list, one place: the sweep's EXCEPTION list in §6.)*

## §6 · THE CHECK — `i166.mjs`, re-cut (the standing laws: drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name)

**Same grid** (widths 1100–2200 at heights 768 and 900; prose, screenplay, journal, board; the roster by
name). **The assertion per cell is now conditional, and the condition is MEASURED, never computed from the
implementation's own formula** *(a check that derives "fits" from the code under test agrees with it by
construction):* **the harness measures the margin from the DOM rects and holds FLOOR as a named constant
that S0 sets from measurement.**
- **`margin ≥ FLOOR`:** `rect(panel) ∩ rect(page) = ∅` (ε 0.5px).
- **`margin < FLOOR`:** overlap is **allowed**, and **the page's rect is byte-identical before and after
  opening** (page-primacy; the editor never unmounts) **and the panel does not intersect the rect of the
  control that opened it** (safeguard 1) **and it closes by Esc** (safeguard 2).
- **ALWAYS — the strips' room:** with a strip menu open, **`rect(strip menu) ∩ rect(page or board) = ∅`**
  wherever the page can be sized to leave room; **at the measured allowance width the pinned overlap
  (29.69 / 38.00) is asserted as STILL exactly that — neither grown nor silently fixed.**
- **⛔ THE SWEEP** keeps its shape and changes its classes: each visible absolute/fixed element painted above
  the page must be **EXCEPTION** (§5's class), **NOTICE** (toasts, the whisper), or **a panel in the
  FRINGE regime**; anything else fails, by name.
- **⛔ THE COUNT IS THE CHECK:** report `cells opened / cells in the grid`, **and split the count into
  `beside / overlay`** — *a suite that reports every cell "overlay" has stopped testing the first regime;
  one that reports none has stopped testing the second.* **A rostered panel that fails to open FAILS its
  cell.**
- **PARKS — re-derived, not inherited.** **The merged brief's "parks owed" list was written for a hard
  law and SHRINKS:** the **paper-rect-invariant family** and **`menus-probe`'s two `KNOWN_FINDINGS`** stay
  true (no park); `fx18.mjs`'s **DEGRADATION** regime *(overlay when the margin is under 280px)* **is the
  fringe rule itself** — **S0 re-reads each named park against §1 and parks only what it actually falsifies;
  audit the park COUNT against that list, never the pass/fail line** *(a missing park is invisible to a green
  run).*

## §7 · WHAT THIS SUPERSEDES in `b166-no-popout-overlaps-the-page-brief.md` — marked, never erased
- **§0's "THE LAW"** (*"no pop-out overlaps the page"*) → **§1's rule.** **§0's "WHAT THIS LAW REVERSES"** →
  **moot**: the guideline reverses nothing he ratified; **the 1100 anchor stands (Q4).**
- **R3** (the page slides aside) → **retired** (§1). **166-Q1's rival** (size only) → **adopted, plus overlay.**
- **§3 B-ii lean** → **§2's fourth reading.** **§4's assertion** → **§6.** **§5's "166 lands before or with
  165"** → **stands**: 165's submenus are still panels in the margin column.
- **§Q: Q1, Q2, Q4 ANSWERED; Q3, Q5 re-based (§5); ONE NEW OPEN: §4.**
- **Unchanged:** R1 and R2, item 83's constraint (*positions come from CSS; JS decides only whether a thing
  opens*), the page selector fix (`.entry-full` into `PAPER_SEL`), the roster.
