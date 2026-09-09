# PW1 — BOARDS CONNECTED (THE WALKABLE SLICE), OFFERED

**Lane:** pw1 · **Branch:** `pw1-boards-connected` · **Worktree:** `.claude/worktrees/pw1-boards-connected`
**Date:** 2026-09-08 · **Standing at the time of writing this record:** the branch was
**OFFERED, NOT MERGED** — one branch pushed, the merge chat 1's act. No deploy implied,
and no `railway` command was run from this lane.

Branched from `origin/main` @ **`ddb5cf7`** (pinned by SHA; `origin/main` had already moved
past the session's opening snapshot before the worktree was cut).

**Brief:** `docs/menus/pw1-build-brief.md`. **Sources read whole:**
`pw-pass-page-plan-workflow.md`, `pw-canon-reanchor.md`, the three-space canon in the
ledger's standing band (items 123–129).

> **⚠ THIS RECORD IS LATE, AND THAT IS THE FIRST THING IN IT.** It was owed WITH the
> offer and was not written. See §7 — the gate finding is chat 1's, it is correct, and it
> is recorded here rather than quietly repaired by back-dating.

---

## §1 · THE STAMP — A CLEAN PAIR, ON ONE FROZEN TREE

```
SUITE DONE HARNESS_PARKED=unset — 76/76 of 76 returned a passing verdict
SUITE RESULT: CLEAN — tree=57a0878 bundle=index-8geTcfLU.js/573591b
SUITE DONE HARNESS_PARKED=1     — 76/76 of 76 returned a passing verdict
SUITE RESULT: CLEAN — tree=57a0878 bundle=index-8geTcfLU.js/573591b NO-REBUILD
```

Same tree SHA in both runs, no `+Ndirty` marker: the tree was committed and frozen before
the first run and not touched between them. `tsc --noEmit`, `build:web` and
`verify:runtime --selftest` all green. `pw1.mjs` itself: **PASS (33 checks)**.

**SCOPE OF THIS STAMP, SAID PLAINLY:** it is against a tree cut from `ddb5cf7`, i.e.
BEFORE main gained item 99's reaper work. It is not a stamp on the merged state and must
not be read as one. The merge is verified by chat 1's own merge suite, which is the
authority for the merged tree.

**AND IT IS NOT THE FIRST PAIR I RAN.** An earlier pair on `e835313` came back **NOT
CLEAN**, two red: `item9192.mjs` and `tu1.mjs`. Both are named and dispatched in §5; the
first pair is reported here rather than replaced by the green one.

---

## §2 · S0 — THE SURVEY, AND THE STOP

The brief's S0(e) is a hard stop: establish item 125's storage home and report the shape
before writing it; **if a column is implicated, stop for Nick's word.**

**FINDING: NO COLUMN IS IMPLICATED.** Measured, not assumed —

| evidence | result |
|---|---|
| `apps/server/src/sync.ts:272` (write) | `JSON.stringify(e.boxes ?? null)` — whole blob |
| `apps/server/src/sync.ts:97` (read) | `r.boxes ?? undefined` — whole blob |
| per-field enumeration at either end | **none** |
| existing additive-optional `Box` fields | **eight** (`canvasW`, `canvasH`, `footerOn`, `systemKind`, `seq`, `laneId`, `parentId`, `lanes`) |

`footerOn` is the exact structural twin, in its own words: *"undefined/missing means 'on'
… only an explicit `false` hides the footer line."*

**Ruled by Fable on this S0's measurement:** `onCanvas?: boolean` on the existing
`page-pin` `Box`. Zero schema, zero migration, zero server bytes.

### S0's other findings, and the three drift corrections

- **(a)** All eight named symbols exist. `persistence.ts` line numbers had drifted +39.
  **`PageEditor.tsx` is at `apps/desktop/src/pages/`, not `components/`** — the brief's own
  "locate by symbol, never by line" warning was earned.
- **(b)** The crumb asymmetry holds exactly as described.
- **(c)** `run-suite.mjs` auto-discovers `*.mjs`; no registration. No `pw1.mjs` existed.
- **DRIFT 1 — PW27's premise was wrong about the current string.** The Boards-zone heading
  read **`'Pinned to boards…'`**, not "Also appears on…". The rename target was right; the
  copy being replaced was different, and it was pinned by a *parked* assertion (`b2.mjs`
  generation 3), so the rename needed a **generation 4** park.
- **DRIFT 2 — the `Open the drawer →` foot row must NOT render.** There is no drawer-board
  surface in `src`: no `drawerBoardId`, no drawer-board kind; `/drawers` is the drawers
  *list*. G3 binds — absent, never a door onto nothing.
- **DRIFT 3 — `PlanPanel` returned early on `!project`**, so a loose page's real
  connections would have hidden behind creation doors. `getPlanBoardId ∪ getBoardsPinning`
  need no project.

**All three were reported before building, and all three were ruled on** (Fable's rulings
1–4, relayed by Nick).

---

## §3 · WHAT WAS BUILT — S1 THROUGH S7

- **S1 · the subject.** The set becomes `planBoardId ∪ getBoardsPinning`, replacing
  `getBinderPages(projectId)`. Heading **`Boards connected`** (Nick, Q2), engraved register.
  Second lines name the RELATION or the DRAWER, never a count. The untitled plan board is
  titled from its page. **ABSENT, NEVER EMPTY** — no connections, no zone. `Open…` retires,
  and the `'plan'` survey kind retires with it (it was that link's only door). The zone
  lifts ABOVE the no-project return.
- **S2 · the side menu.** One press; **two sections** (Cards, then Pages linked to this
  board); cards read in the board's own **`y` then `x`** arrangement, never array order.
  Double-click travels, and `Open the board` rides the same `⋯` — PW22's twin.
- **S3 · membership ≠ display.** `onCanvas?: boolean`. **ABSENCE MEANS DISPLAYED**, tested
  as `=== false` and never as falsiness, in both readers. Two display acts: the row's `⋯`
  (and right-click, which opens that same menu) and drag-onto-canvas.
- **S4 · the return path, both.** The cascade survives travel via a one-shot handoff; the
  chip names the surface actually left — `fromBoardTitle` had been carried since
  `BoardEditor.tsx:1317` and never read.
- **S5 · stickiness**, resolved at the opening toggle so the survey's `‹` walks back to the
  list and stays there.
- **S6 · the address line.** One shared `LocationCrumb`, framed Page and Screenplay, and the
  chain never renders empty.
- **S7 · `apps/desktop/scripts/harness/pw1.mjs`**, 33 checks, auto-discovered.

**Change surface — 21 files, +2241/−258. ZERO server, ZERO schema, verified by measurement
rather than by absent migrations:**

```
git diff --shortstat ddb5cf7 57a0878
    21 files changed, 2241 insertions(+), 258 deletions(-)

git diff --stat ddb5cf7 57a0878 -- apps/server packages
    (empty)

git diff --name-status ddb5cf7 57a0878 -- apps/desktop/src | cut -f1 | sort | uniq -c
    2 A    (LocationCrumb.tsx, planTrail.ts)
   13 M
```

Product source is therefore **15 files: 13 modified, 2 new** — chat 1's merge commit says
"13 product source", which counts the modified ones; both figures are right about different
things and the breakdown above is given so neither has to be guessed at.

---

## §4 · TWO JUDGMENT CALLS, NAMED RATHER THAN SMUGGLED

**(1) `pinPageToBoard` has two sides.** Page-side (the Places checkbox, "Pin to a Board…")
makes an undisplayed MEMBERSHIP. Board-side ("New page card", "Place page on board", "Add
an existing page", a page born from a board's own address) DISPLAYS, because the writer
acted ON the board. Item 125's own reason points this way: the rule exists so a canvas
never arrives furnished with arrangement the writer did NOT author — here they authored it.
**RATIFIED** (Fable, ruling 1). Asserted in `pw1.mjs`, so overturning it fails loudly.

**(2) `Hide from the board`, not "Remove".** The board card's own `Remove` already ends the
MEMBERSHIP; two acts a keystroke apart must not share a word. **RATIFIED** (Fable, ruling
2). `Remove` itself is untouched — whether it should now clear display rather than
membership **routes to PW2**.

---

## §5 · THE FIRST PAIR'S TWO REDS — AND ONE OF THEM WAS THE HARNESS BEING RIGHT

**`tu1.mjs` — the Structure lens's membership line.** Ruling 4's word change, one surface
over from `ab4`. Superseded in place, original quoted verbatim. Same claim; only the true
word moved.

**`item9192.mjs` — "the board RENDERS a card, not merely a row in storage".** It went red
and **it was RIGHT.** Its journey is the board's own *New page card* door, and that build
had made the card the writer just asked for invisible on the canvas they were looking at —
resurrecting the symptom item 92 was about. **The check was not superseded; the BUILD was
wrong,** and the fix is in the product (§4's split), not the harness.

> **A CHECK THAT GOES RED IS NOT AUTOMATICALLY A CHECK TO RETIRE.** The question is "is
> this check still true of the product I meant to build?" before reaching for `pok()`.

---

## §6 · THE PARK SWEEP — 20 RETIRED / 17 NAMES, AUDITED BY EXECUTION

The count is the check, not the colour of the run. These figures were verified by
extracting the actual `pok()` results from the parked-run outputs, not by counting the
roster:

| file | instances | names | where |
|---|---|---|---|
| `cd2.mjs` | 6 | 6 | behind the gate |
| `ab4.mjs` | 8 | 5 | behind the gate (3 names × 2 reference widths) |
| `b2.mjs` | 1 | 1 | behind the gate (generation 4) |
| `cd1.mjs` | 1 | 1 | behind the gate (the framed crumb's absence) |
| **subtotal** | **16** | **13** | **executed and verified in the parked run** |
| `ab4.mjs` | 3 | 3 | superseded in place, live successors |
| `tu1.mjs` | 1 | 1 | superseded in place, live successor |
| **TOTAL** | **20** | **17** | |

**MY S0 REPORTED 15 / 12. THE TRUE FIGURE IS 20 / 17.** The correction is the point: the
S0 sweep grepped for the **strings** this slice renamed and found `ab4` alone. It missed
the two **behaviours** it changed — that a fresh page-side pin no longer renders, and that
the membership line's word moved — which `tu1` and `item9192` assert without ever naming a
string. Four of the five extras were found by RUNNING the suite, not by reading it.

**Sweep for what a change DOES, not for what it renames.** Recorded in `pw1.mjs`'s own
park-roster comment, where the next sweep will read it.

**Two driver hazards fixed rather than inherited** (the standing law: a driver can lie by
dying as easily as by doing nothing): `cd2.mjs`'s bare `.click()` on the retired `Open…`
link, and `ab4.mjs`'s bare `dispatchEvent` on a card item 125 no longer puts on the canvas
— each of which would have **aborted its whole file** and reported nothing downstream.

---

## §7 · THE GATE FINDING — CHAT 1'S, AND IT IS CORRECT

Chat 1's merge commit (`c2d5539`) records it:

> *"this offer carries NO ledger entry and NO offer record — `docs/` is untouched on the
> branch — which is the same gate 112-A's first offer failed. The 76/76 claim reached chat
> 1 by relay only and could not be verified from the branch."*

**Conceded without qualification.** The branch was pushed and the numbers relayed in chat;
the artefact that makes the claim checkable *from the repository* was never written. That
is the whole function of this document, and its absence is exactly the failure mode the
house has already named once. The merge went through on the strength of chat 1's own merge
suite — **stronger evidence than an offer record, not weaker** — but the record was still
owed, and the gate did not pass.

**Written post-merge on `pw1-records`, branched from `origin/main` @ `c2d5539`.** The
lateness is not repaired by back-dating; it is recorded.

---

## §8 · NOT IN THIS SLICE, BY DESIGN

Nested boards, card transfer, and the drawer-board surface — and with it the
`Open the drawer →` foot row. **Nick's Q17 "composed" ruling stands**; what the row would
open does not exist yet, and G3 forbids a door onto nothing. The reason is recorded in
`PlanPanel` at the exact spot the row would occupy, so it reads as sequenced rather than
dropped. All PW2.

**Nothing deployed on this lane's word.**
