# TOOLS — RESTART NOTE
### written 2026-09-23 · nothing running · box not held by me

---

## ROLE

**The TOOLS lane** of the Wrizo writer-studio build. Harness, test-seam and
instrument work: censuses, drivers, the suite's own truthfulness. Reports to
**Fable** (relaying Nick and chat 1). **Chat 1 merges to main — I never do**,
even with a merge word; I push my branch and offer it.

I work in **isolated git worktrees** under `C:\Users\nickh\writer-studio\.claude\<name>`.
The primary checkout `C:\Users\nickh\writer-studio` is another lane's deploy
staging area — **never build there.**

---

## WORKTREES AND BRANCHES

| worktree | branch | tip | state |
|---|---|---|---|
| `.claude/clickreach` | `click-reach` | `c20c616` | pushed, **not merged** — item 194 S0 |
| `.claude/splash` | `splash-screen` | `7c4c126` | pushed, **not merged** — built, not run |
| `.claude/item154-instring-acts` | `item154-instring-acts` | `921390f` | pushed, **not merged** — awaiting its pair |

`origin/main` was `fc8de60` at the time of writing. **Each worktree needs its
own `pnpm install`** before any tsc/build (no node_modules until you do).

---

## ITEMS, WITH SHA AND STATE

### ITEM 151 — Shape A, coordinate dispatch with no hit-test · **DONE, MERGED**
Merged to main at `56e2ad8`. 91-file pair ran **both legs CLEAN 91/91** at
`afc0556`. Left behind: `apps/desktop/scripts/trusted-point.mjs` (the shared
hit-test: `hittablePointBy`, `hittablePoint`, `trustedDispatch`,
`assertHittable`) and `scripts/harness/tp1.mjs` (its standing falsification,
7 checks). **Closeout of the last two held files (`item121.mjs` 1 site,
`item126.mjs` 7 sites) is commit `b5a13a1` — which rides on the
`item154-instring-acts` branch, not on main.** It reaches main when 154 does.

### ITEM 154 — the silent act inside evalJs strings · **BUILT, NOT RUN**
Branch `item154-instring-acts` @ `921390f`. **147 rewritten, 7 sites exempt by
name, 0 held back.** Rebuilt after a per-site audit found the FIRST build
(`a406778`, byte-verified 137/137) wrong in six ways — that build is
superseded and never ran.
- Tools: `scripts/item154-census.mjs`, `item154-rewrite.mjs`,
  `item154-exemptions.mjs`, `item154-behaviour.mjs` (three stub worlds;
  147/147; mutation-tested 4/4 on copies).
- Verified: census 0 offenders / 9 exempt, rewrite idempotent, tsc 0,
  build:web 0 with unchanged bundle.
- **WAITING ON:** its 91-file pair, **after Batch Four's deploy pair** (chat 1
  grants). Report both legs verbatim; **diagnose every red as a candidate
  finding before treating it as a break**; the first in-string red aborts its
  file's remaining checks, so **a red there is diagnosed, not re-run.**

### ITEM 194 — PW's finding: when a pointer's reach is the claim · **S0 DONE**
Branch `click-reach` @ `c20c616`. *(Fable assigned 194 to THIS on 2026-09-23.)*
Survey: `docs/menus/click-reach-s0-survey.md`. Tool: `scripts/reach-claims.mjs`.
Three strata measured:
1. **`app.click(label)` — 129 sites, 53 files, ONE helper** (`__click` in
   `runtime-verify.mjs` → `el.click()`). Throws when absent (item 151's fix is
   present) but **never hit-tests**, so a present-and-covered control reports
   success.
2. In-string `.click()` — **630 raw = a candidate list, not a population.**
3. **Claims of reach proven by EXISTENCE** — `e3.mjs:76`, `item133.mjs:198`
   both say "reachable" and test `!!querySelector`. **0 of 130 reach-claims
   are proven by a hit-test.**
- **Sharp slice: 32 sites / 17 files still press `.wz-strip-item` — item 130's
  OWN control — with a synthetic click.** `index.css:2714` says in the
  codebase's own voice that this is how item 130 went uncaught. **If item
  130's `z-index:1` regressed, all 32 would keep passing** — the guard is
  `pw1`/`vw1` only, two files not thirty-four.
- **§6 APPROVED, with step 1 changed to TWO MOVES (see RULINGS).** Steps 2–4
  approved as written.

### THE SPLASH — Nick's hand-drawn Wrizo over the blurred app · **BUILT, NOT RUN**
Branch `splash-screen` @ `7c4c126`. **⚠ NEEDS AN ITEM NUMBER** — the S0 doc and
ledger say "PROPOSED 194", but **194 is now click-reach**. Ask chat 1;
renumber `docs/menus/splash-s0-survey.md`, the ledger entries and the CSS
comment (`index.css`, "THE SPLASH (item 194)") when assigned.
- Built: `components/Splash.tsx`, `store/backdropTone.ts`, CSS (the app's
  **first `backdrop-filter`**), both assets byte-identical in
  `public/brand/wrizo-sketch-for-{dark,light}-theme.png`,
  `harness/splash.mjs` (18 checks), `harness/splash-frames.mjs`.
- Verified without the box: tsc 0, build:web 0, assets+blur in the bundle,
  sizing algebra exact to 1e-12 over six viewports.
- **An S0 error was corrected in place**: the claim "5.00× in area / a
  twenty-fifth at any aspect" was wrong (a constant, not a derived value).
  Correct: **A/B linear = √(5 · emblemAspect / screenAspect)** = 1.88×–2.28×.
- **WAITING ON:** a short box slot for the **two frames into `Downloads`**
  (Nick chooses area vs width), the **`backdrop-filter` compositing check**,
  and **`splash.mjs`** itself.

### ITEM 190 — Experiment 1's RAIL SIDE + the Experiments switch · **UNBLOCKED, NOT STARTED**
**This is the current top of my order.** Brief:
`docs/menus/b-exp1-connect-from-the-page.md` on branch `origin/plan-exp1-connect`
(not on main). Nick answered EXP1-Q1 *"1. Yes"* — the links column is approved.
- **Mine (builder B):** the Experiments switch and everything it hides · zone 5
  and the width budget · the Linked list (filter · sort by recency/kind/tag ·
  group-by-tag) · open (both popups) · remove/unlink.
- **PW owns the text side and is the ONLY writer of `store/anchors.ts`.**
- **START WITH: the switch and zone 5's geometry** — neither needs PW.
- The Linked list follows once PW lands `store/anchors.ts`'s signatures.
- **Grouping law applies a third time:** a source has one kind and one
  recency but MANY tags — so **by tag GROUPS**, a source appears under every
  tag it carries, **and the list prints its arithmetic.**
- Harness to write: `scripts/harness/exp1.mjs` (brief §7). **Switch OFF = v1:
  no mark, no act, DOM byte-identical to the pre-change build.**
- EXP1-Q5 (overlapping links — the rail lists everything covering a spot) and
  EXP1-Q6 are with Nick; **both default to yes.**

### THE NOTE-KEY TEST — PLAN DESK's written test · **BOX TASK, NOT STARTED**
A **keydown logger** over the candidate keys in **Edge and Electron**, plus
**one pass with an international layout**. Context in the exp1 brief §9:
`Ctrl+N` belongs to the browser and a page cannot take it; `Ctrl/Cmd+Enter` is
the confirmed stand-in; `Ctrl+Alt+…` is AltGr on international layouts and is
out. **The measurement is what is missing.**

### ITEMS 147 / 148 — re-routed from ERRATA · **QUEUED, BEHIND EVERYTHING ABOVE**
147 = the park count as a check (item87's hardcoded `PASS(0 checks)` line that
cannot report a failure). 148 = the durability guard inverted to all writing
seams with named exemptions. Offered branches with stated must-shows exist —
**I inherit the reasoning to re-derive, not the code to rebuild, and by my own
band I re-derive their NUMBERS rather than inheriting them.**
**⚠ If ERRATA returns before 147 starts, it takes them back — a returning
author beats a re-derivation.**

---

## WHAT I WAIT ON, AND FROM WHOM

| waiting on | from | blocks |
|---|---|---|
| **A box turn / short slot** | chat 1 (by announcement) | splash frames + compositing check + `splash.mjs`; 194's report-only run; the note-key test |
| **Batch Four's deploy pair, then 154's pair** | chat 1 | item 154 merging |
| **`store/anchors.ts` signatures** | PW | item 190's Linked list (NOT the switch or zone 5) |
| **An item number for the splash** | chat 1 | renumbering its docs |
| **EXP1-Q5 / Q6** | Nick | both default to **yes**, so not blocking |

**BOX STATE AT WRITING:** held by **PW2** (`pw2-item176-fourth-20260922`), and
**PW2's pair went LIVE while this note was being written** (0 harness browsers
at the start, 11–16 by the end). **Not mine. Do not touch the box — and while
another lane's pair is live, no builds, installs or checkers either**, which is
the box-quiet law this lane has already broken once and paid for.

*(Also expected-untracked: `item154-census-detail.json` in the item154
worktree — a regenerable census dump, deliberately not committed. Regenerate
with `node scripts/item154-census.mjs`. Not stray work.)*

---

## RULINGS I WORK UNDER

**ITEM 194 — the helper flips in TWO MOVES (Fable, 2026-09-23):**
1. **First a REPORT-ONLY mode** that records which of the 129 presses a person
   could not have made. Run it on **one short box use**.
2. Each one found is **either a fixture skipping a person's step (hover,
   scroll) — fix the fixture to take it — or a real finding.**
3. **Only then make the helper fail.**
4. **"No exemption table" was my PREDICTION; the report-only run measures it.**
5. The new helper **changes the instrument under every lane's stamps**, so
   **chat 1 lands it at a batch boundary.**
Steps 2–4 of my §6 approved as written. The law behind it: **probes drive real
pointer events, never synthetic clicks.**

**THE SPLASH (five rulings, all ratified):** asset follows **measured backdrop
luminance at mount**, not a theme map · a **short hold**, any input dismisses
early **and passes through untouched** · **every open**, not first-run-only ·
**Arrival is what sits blurred behind at boot** · **size by AREA** until Nick
picks from the two frames.

**ITEM 190:** PW writes `store/anchors.ts`, **I read it and never write
through it** — if I need a write, I **ask PW for a function** rather than
reaching past the seam. **Test data goes in through the seams; nothing mocks
the module.** The flag comes from **`store/experiments.ts`** so "off" cannot be
half-true.

**STANDING LAWS (the ones that have cost this lane something):**
- **Box by announcement; pre-flight zero or stop.** A worktree isolates FILES,
  not the box. Check `~/.wrizo/box-turn.json` and that `WS_BOX_TURN` matches
  the file's CURRENT token exactly.
- **Box quiet during a stamping pair** — no builds/installs/checkers while any
  pair is live. (0 harness browsers is run-suite's own idle criterion.)
- **Both legs always run** — join with `;`, never `&&`.
- **Commit = push.** An offer that exists only on disk is not an offer.
- **Build lane pushes its branch; chat 1 merges main.**
- **Park, never edit** a falsified harness assertion: keep the original
  verbatim + SUPERSEDED + a successor beside it.
- **Park COUNT, not green** — emit `parkedChecks` even when empty.
- **Real pointer events, never `.click()`** — the whole subject of item 194.
- **Special content goes through a FILE TOOL, not a shell** — heredocs and
  `sed` eat `\n`/`\b` silently (item 152). Multi-line needles fail to match.
- **Harness files are CRLF**; template cooked text hides it, so byte
  comparisons on cooked text cannot see a stray bare LF.

**BANDS I CARRY (mine unless noted):**
- *BYTE-IDENTICAL TO INTENT IS NOT CORRECT — THE INTENT IS WHAT NEEDS
  AUDITING.* (Fable's)
- *A SUMMARY LINE IS A CLAIM, NOT A CAPTION — IF IT WASN'T DERIVED FROM THE
  MEASUREMENT PRINTED BESIDE IT, IT'S UNVERIFIED.*
- *A COUNT OF A SYNTACTIC SHAPE IS A LIST OF CANDIDATES — THE POPULATION IS
  WHAT SURVIVES READING EACH ONE.* (proposed, not yet ratified)
- *A NUMBER YOU CANNOT DEFEND PER SITE IS NOT A POPULATION — REPORT IT AS
  UNSWEPT, NOT AS A FINDING.*
- *A FIGURE CARRIED FORWARD FROM ANOTHER ITEM'S SURVEY IS AN INHERITANCE, NOT
  A MEASUREMENT — RE-DERIVE IT IN ITS OWN POPULATION.*
- *THE FILE A GUARD WAS WRITTEN IN IS NOT THEREBY GUARDED — VERIFY THE
  AUTHOR'S OWN FILE FIRST.*
- *A GATE'S WORTH IS THAT IT HOLDS WHEN NOTHING FIRES.*

---

## BOOT ORDER FOR A FRESH SESSION

1. **Read this file.** Then `git fetch origin` and check whether
   `origin/main` has moved past `fc8de60` — **it moves constantly**, and other
   lanes' merges land my own earlier work.
2. **Check the box:** `cat ~/.wrizo/box-turn.json` + count harness browsers.
   **If the lane is not TOOLS, do not touch the box** and say so.
3. **Check whether my three branches merged** (`git branch -r --contains
   origin/<branch>` against `origin/main`). If 154 merged, its pair ran —
   read the result before assuming anything.
4. **Resume the order:** **item 190's switch + zone 5 geometry** (needs no PW,
   no box) → the Linked list when PW lands `anchors.ts` → **194's report-only
   mode**, which is buildable in any wait → splash frames / note-key test /
   194's run when chat 1 announces a short slot.
5. **`pnpm install` in whichever worktree you work in** before any tsc/build.
6. **Ask chat 1 for the splash's item number** before touching its docs.
7. Report to **Fable**. Hand up conflicts **with a lean**, in their strongest
   form. **Reach a clean stop, never mid-run.**
