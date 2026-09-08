# PW1 BUILD BRIEF — THE WALKABLE SLICE
### PLAN desk · 2026-09-07 · decision-complete · Nick's rulings COMPLETE on this arc

**WORKTREE:** `.claude/worktrees/pw1-boards-connected` · **BRANCH:** `pw1-boards-connected`
· **OFF:** `origin/main` at build time (fetch first; `origin/main` moves under this
checkout). **Never build in the primary checkout** — it is chat 1's deploy staging area.
**This lane pushes its BRANCH; the merge to `main` is chat 1's, even for docs.**

**STATUS: RULINGS COMPLETE.** Every design question this brief depends on is answered —
Q1–Q9, Q11–Q17, the three-space canon (`3d80a0f`), items 123/125/128. **One decision is
deliberately NOT this brief's and stops the lane: see S0(e).**

> **⚠ LINE NUMBERS ARE A COURTESY; SYMBOLS ARE THE ANCHOR.** Every reference below was
> verified against **`0d352c9`** while this brief was being written — and `PageEditor.tsx`
> **moved under this desk mid-brief** (the Ink lane, `af3c79c` / `cec9180`), which is exactly
> why this note exists. **Locate by symbol name, never by line.** If a number misses, the
> symbol is still right and the number has drifted; report it, do not hunt.

**SOURCES.** `docs/menus/pw-pass-page-plan-workflow.md` · `pw-addendum-three-space-canon.md`
· `pw-rulings-fold.md` · Downloads: `pw-canon-reanchor.md`, `pw-q14-q17-fold.md`,
`pw-q9-side-by-side.html`, `pw-journey-b-the-making.html`. Ledger: open-threads §2291–2400.

---

## §0 · WHAT THIS SLICE IS

The geography is **already built** and lists the **wrong subject**. `PlanPanel` shows
`getBinderPages(projectId)` — *which containers live inside this drawer* — when the writer
asked *which containers hold this page*. This slice changes the subject, makes the result
pressable, separates membership from display, and gives the page back its address.

**Zero new entities. Zero new routes. One storage decision, and it stops (S0e).**

---

## S0 · SURVEY — before a line of code

Report each as a finding; **do not** proceed past (e) without a word.

**(a)** Confirm at branch tip: `PlanPanel` (`CascadePanels.tsx:453`), `buildSurvey` (`:798`),
`getBoardsPinning` (`persistence.ts:1053`), `getPlanBoardId` (`:1725`), `pinPageToBoard`
(`:1013`), `describePageHome` (`store/pageHome.ts`), `CascadeState {category, survey, docked}`
+ `useState<CascadeState>(REST)` (`Cascade.tsx:139`).
**(b)** Confirm the crumb asymmetry still holds: `BoardEditor.tsx:2404` renders `sprint-crumb`
in its **framed** branch with `marginRight:'auto'`; `PageEditor.tsx:1147` and
`ScriptEditor.tsx:1196` render it **only unframed**. This is S6's precedent — reuse the
board's row shape, never copy it.
**(c)** Confirm `run-suite.mjs:255` auto-discovers `*.mjs` in `apps/desktop/scripts/harness/`
— **a new harness needs no registration.** Confirm no `pw1.mjs` exists.
**(d)** Grep for existing coverage of the Plan panel and of pin/unpin. Report what exists;
**anything you rewrite in place must be PARKED with its original quoted verbatim** — a park
whose `pok()` never pushes is invisible to a green run, so **audit the park COUNT against
this brief's claim, not the colour of the run.**
**(e) ⛔ THE STOP — item 125's storage home.** The ledger: *"Storage home is the S0's to
establish: zero schema expected inside the board's own blob; **A COLUMN STOPS for Nick's
word** under the standing schema law. **Not a builder's call.**"*
 - **Establish** where the display flag lives and **report the shape before writing it.**
 - **PLAN desk's input, not a ruling:** an additive optional field on the existing
   `page-pin` `Box` (e.g. `onCanvas?: boolean`) sits **inside the board's blob** and is the
   branch that does **not** stop — the same pattern `canvasW`, `footerOn` and `systemKind`
   already ride (`types/index.ts:419–459`).
 - **If your S0 concludes a column is needed, STOP and report.** Do not build past it.

---

## S1 · THE SUBJECT — "BOARDS CONNECTED"

`PlanPanel`, on a **page**. Replace the listed set and the panel's order.

**The set:** `getPlanBoardId(pageId)` ∪ `getBoardsPinning(pageId)`. **Not**
`getBinderPages(projectId)`. Both functions exist and are local. **Zero schema.**

**The order** (travel is common; creation is rare — the panel's order says so):

```
PLAN
  BOARDS CONNECTED            ← engraved heading, the sole ember site (G5)
    <plan board title>          its own plan board
    Stark                       Novel
    Winterfell timeline         Research
  ──────────────────────────
  ＋ New board
  Plot a story
  Open the drawer →           ← the composed foot row (Nick's Q17 word)
```

**Rules, each with its authority:**
- **Heading string: `Boards connected`** (Nick, Q2). Presentation uppercase per the zone
  register; the lexicon term carries the sentence case. **No verb heading** — here the nouns
  mean *go*, and the writer's learned grammar is already right (PW1; PP1 applied, opposite
  output).
- **Second lines name the RELATION or the DRAWER, never a count** (PW10; A14/A18; BD4's
  *listed, never counted*). Plan board → `its own plan board` (the canon: *"the Plan-board
  pairing is a SURFACE OWNING A CONTAINER and must be named as such wherever it shows"*).
  Pinning board → its drawer's name.
- **The untitled plan board is titled from its page** — `<page title> — plan`. The pairing is
  1:1, so the page's name is a true name for it, and it spares the writer a naming step the
  minimum-setup law forbids. (`getOrCreatePlanBoard` mints `text: ''`, `persistence.ts:1737`.)
- **ABSENT, NEVER EMPTY** (PW9; G3): no connections → **the zone does not render.** Not a
  zone containing "No boards yet." `cascadePlanEmpty` retires from this path.
- **`Open…` retires** (PW3): the footer link that hid the list is deleted; the panel *is* the
  list. `cascadePlanOpen` retires.
- **The foot row `Open the drawer →`** (Q17, Nick's word: *composed*) — door dress
  (`wz-cascade-action-door`), at the panel's foot, below the creation doors. **It opens the
  drawer's own board.** *If the drawer-board surface is not built in this slice, the row does
  not render* — G3 binds: absent, never a door onto nothing. **Report which.**
- **One act per row** (PP4): a board row opens that board's contents and does nothing else.

---

## S2 · THE SIDE MENU — one press, thumbnails and titles, the board's own order

`buildSurvey`'s `plan-board` branch, reached by **one press** on a board row (Nick, Q3:
*"One click to open a new scrolling side menu that displays thumbnails of all Cards and their
titles"*).

- **Thumbnails AND TITLES** (Q3). The built `excerpt` yields to the **title**.
- **TWO SECTIONS** (Nick, Q4): **Cards** (board-owned content), then **Pages linked to this
  board** beneath them, with page titles.
- **⚠ Q14 — THE BOARD'S OWN READING ORDER, RULED.** Sort by **`y`, then `x`** — the
  arrangement the writer authored. **Never array/creation order**, which is what ships today.
  Fable's words: *"an order nobody chose is an order nobody can rely on."* The rail is a
  **fourth display** of a container and may not contradict the other three.
- **`Open the board →` door row RETIRES** (PW22) — superseded by **double-click on the board
  row**, which travels (Q4: *"When the Board thumbnail is double-clicked on, then switch
  surfaces to the Board (Plan) surface"*).
- **⚠ EVERY GESTURE GETS A MENU TWIN** (PW22). Double-click travels **and** `Open the board`
  appears as a row in the built `⋯` (`wz-cascade-thumb-menu-btn` / `-menu`,
  `CascadeSurvey.tsx:96`). **Nothing is reachable only by a gesture** — the keyboard and the
  unfamiliar hand keep a path. This is not a second menu; it is the one that already ships.

---

## S3 · MEMBERSHIP IS NOT DISPLAY — item 125

**The ruling:** linking is a **membership**; the pin-card is one **display** of it;
**membership without display is the default.**

- The `page-pin` `Box` becomes the **membership record**; the flag from S0(e) gates the
  **canvas**.
- **⚠ BUILD LAW — ABSENCE MEANS DISPLAYED** (Fable, elevated from S0 input this relay).
  **Every already-arranged board must read UNCHANGED on first launch.** No backfill, no
  migration. New memberships write the not-displayed value **explicitly**. *The storage shape
  serves this law, not the reverse.* **Harness-asserted in S7 — this is the check that must
  not be missing.**
- **Two display acts, both Nick's** (Q4): **`Display on Board`** from the row's `⋯` **and**
  from right-click on the row; **drag the row onto the canvas**, which lands it where dropped
  (the writer chooses position — the whole reason display is opt-in). **The drag needs a
  canvas, so it exists only on a board; the menu act works everywhere — the menu is the path
  that must be complete.**
- **Each row states its state**, in the second-line slot: `member · not shown on the board` /
  `member · shown on the board`. Display state is a fact on the row, never inferred from the
  wall.
- **`PlacesPanel`'s Boards-zone heading changes to `Also connected to…`** (PW27). *"Also
  appears on…"* would now **lie**: appearing means being displayed, and this checkbox makes
  membership. It also matches S1's `Boards connected` — one connecting word, two faces.
- **Unchanged, to the letter:** A16's two writes, single-select home, multi membership, the
  system-board absence, fresh-read, `flushNow`, and every honest string the fix wave wrote.

---

## S4 · THE RETURN PATH — BOTH (Nick, Q5)

**(i) The cascade survives travel.** `CascadeState` is per-surface today
(`useState<CascadeState>(REST)`, `Cascade.tsx:139`) — this is the slice's real plumbing.
On a travel originated from the cascade, the destination mounts with **the same category and
survey open**, and the origin row wears the survey's own built `current` mark
(`buildSurvey` already computes it; `CascadeSurvey.tsx:82` already renders `aria-current`).
**The trail is the rail:** the way back is one press on a row already under the writer's eye.

**(ii) The chip, worded honestly.** The built `‹ Back to the board` chip
(`PageEditor.tsx:1025`, driven by `location.state.fromBoardId`) is minted on cascade travel
too — **but it must name the surface actually left.** A writer who reached a card through the
rail never stood on the board; sending them somewhere they have never been is the
destination-blind verb the Card pass named as the enemy (CA1). Carry the origin's own title.

---

## S5 · STICKINESS (Nick, Q6: YES)

The Plan panel reopens on **the board whose contents were last open, per page**. Not a
configured relationship — the machine declining to forget, restoring only what the writer
themselves opened. Second and later visits cost two presses instead of three. The survey's
`‹` is always the way back to the list.

---

## S6 · THE ADDRESS LINE (Nick, Q7: RIDES THIS ARC)

**Restore the framed crumb on Page and Screenplay, in the shape the Board already proved.**

- Reuse `BoardEditor.tsx:2404`'s framed row shape — `crumb (marginRight:auto) · strip ·
  actions`. **Reuse, never copy.**
- **The chain never renders empty:** with no drawer and no project it reads the home label
  from `describePageHome` (`Loose — belongs nowhere yet`) rather than a bare title. The one
  case where the writer is most likely to be lost is the case where the address must still
  say something true.
- **On record, so it is not re-litigated:** CD1 S1 removed this deliberately
  (`PageEditor.tsx:985`), re-homing "where it lives" into the Page face **inside a
  drawer**. Nick's hardware falsified that trade; Q7 returns it. **A ruled trade overtaken by
  evidence, not a defect.**

---

## S7 · THE HARNESS — `apps/desktop/scripts/harness/pw1.mjs`

Auto-discovered (`run-suite.mjs:255`); no registration. Shape: `import { withHarness } from
'../runtime-verify.mjs'`; `const ok = (name, pass, detail='') => checks.push(...)`; closes
with `PW1 VERIFY: PASS (n checks)`.

**Standing harness law, and it bites hardest here:**
- **DRIVERS NEVER ASSUME EXISTENCE.** A bare `.click()` on a missing node **aborts the file
  and reports nothing downstream** — the run where reporting matters most says least. Probe
  for the target, **fail a CHECK that names it**, let the rest still speak.
- **PROBES DRIVE REAL POINTER EVENTS** — `pointerdown`/`pointerup`, never a synthetic
  `click`. A synthetic click skips the pipeline the product listens on.
- **Seed through the seams** (`window.wrizoCreateJournalPage`, `window.wrizoPinPageToBoard`),
  never raw `localStorage` — the cache is the hazard.

**Checks owed, at minimum:**
1. The panel lists `planBoardId ∪ getBoardsPinning` and **not** a drawer sibling that pins
   nothing — *the subject, asserted directly.*
2. No connections → **the zone is absent from the DOM** (not present-and-empty).
3. Second lines carry relation/drawer; **no digit appears in any second line** (the no-count
   law, asserted as a property).
4. One press opens the side menu; two sections present; **cards ordered by `y` then `x`**
   against a fixture whose creation order deliberately differs — *Q14 cannot pass by accident.*
5. Double-click on a board row travels; **the `⋯` carries the same act** (the twin).
6. **⚠ ABSENCE MEANS DISPLAYED:** a pin written **without** the flag (the pre-existing shape)
   **renders on the canvas.** A new membership does **not**. Both directions, one fixture.
7. `Display on Board` moves it to the canvas; the row's state line changes with it.
8. Travel from the survey arrives with the panel open, the survey on the same board, and the
   origin row marked `current`; the chip names the surface left.
9. Framed Page **and** framed Screenplay render `sprint-crumb`; a page with no drawer/project
   reads the home label, not a bare title.
10. Both `HARNESS_PARKED` settings CLEAN; **park count audited against this brief.**

**Run with an ABSOLUTE worktree path** — never `node apps/...` from a drifted shell cwd, which
runs the primary checkout and stamps a confident wrong result.

---

## §CLOSE · CLOSE CONDITIONS

1. **S0 reported, and (e) answered by Nick if a column is implicated.**
2. Build S1–S7; `tsc` + `build:web` + selftest + full suite, **both settings**, green,
   re-run independently on the branch tip before offer.
3. **Push the branch. Do not merge.** Offer to chat 1 through Nick; Fable reviews.
4. **Not in this slice, by design:** nested boards, card transfer, the drawer-board surface
   (unless S1's foot row is built with it). All PW2.

**Nothing deploys on this lane's word.**
