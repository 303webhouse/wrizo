# ITEM 83 — THE MENUS WAVE · BUILD REPORT
### menus lane · overnight run, 2026-08-03 → 2026-08-04 · branch `menus-build`
### normative spec: the mockups + rulings at `1834dfe` · brief: `56d1be6`

**READ THIS FIRST.** Eleven tickets ran, M0 through M10, one commit and one
push each, to `origin menus-build` only. `main` was never pushed after the
brief itself landed. Nothing was forced. No railway, no deploy.

The wave is **not uniformly finished**, and the gaps are not evenly
distributed: the CHROME is built and measured, the SCHEMA is written but
never run against a database, and the deepest ENGINE wiring behind the
Typewriter menu is deliberately absent. §5 lists every gap plainly. Two
things in particular should not be merged on the strength of this report
alone — M2's round-trip and M4's engine controls — and both are named there.

---

## §1 · THE TICKET TABLE

| # | SHA | outcome |
|---|-----|---------|
| M0 | `4aa53e6` | baseline green; `scripts/menus-probe.mjs` written and proven able to FAIL |
| M1 | `cb2c993` | cascade flush (28px gap closed), olive register, two-drawer law; fx7 parked + successors |
| M2 | `578846f` | schema written, boot-idempotent, transport wired — **not executed** |
| M3 | `bed0d8c` | PAGE SETUP wired live to the paper; defaults control |
| M4 | `d0c5195` | STYLING+U, Typewriter menu, three-instrument foot, Instruments retired |
| M5 | `8818c57` | R4 roster, F3 line-prefix directives, DR3 conversion row |
| M6 | `48af9aa` | no sliver on boards (proven), Place-page list; probe extended to 3 surfaces |
| M7 | `ea29b29` | Places speaks in verbs; mechanics diff-proven untouched |
| M8 | `c272e3b` | R12's universal foot on screenplay; null desk + mirror verified live |
| M9 | `f253fa7` | opened-card dock at `right:100%`, centred, styling only |
| M10 | `a71c965` | retirements verified by grep; lexicon sweep 59/59 green |
| M11 | *this commit* | proof: suite ×2, probe matrix, shots, this report — **and one regression found and fixed** |

M11 is not only bookkeeping: running the suite found a real functional
regression M6 had introduced, and fixing it is part of this commit. See §3.

---

## §2 · THE PROBE — the night's acceptance instrument

`apps/desktop/scripts/menus-probe.mjs`. It asserts the ruled invariants by
measuring **two independently rendered boxes** and checking they touch. It
never compares a rendered box to a JS constant, because that check is
tautological — it proves only that the browser honoured an assignment.

Final matrix, `--shots docs/menus/build-shots`:

```
38/38 checks green
```

Three surfaces × two widths × dock-open/closed where a dock exists, plus
paper-rect invariance under both toggles, plus six PNGs.

**It can fail, and did.** Against the M0 baseline it returned 10/12 with two
reds, both reading `panel.left 112.0 − rail.right 84.0 = 28.00px` — Nick's
twice-reported gap, measured at last. That number is the whole reason the
instrument is trustworthy.

**It also corrected the brief's premise.** M1 was written expecting a broken
Tools dock; the dock measured **0.00px flush** on prose at both widths before
any change. The hand-synced `--sliver-paper-half` formula currently AGREES
with the rendered paper. The dock is fragile — two sources of truth for one
number — but it was not broken, and the re-mount was not done. See §5.

---

## §3 · THE SUITE — and the one real regression it caught

**First run: 38/54 OK, 16 red.** The reds fell into two classes, and telling
them apart was the most important work of the night.

### Class B — A REAL FUNCTIONAL REGRESSION, introduced by M6, now fixed

**M6 removed the board's Tools sliver on R13.iv and did not re-home its
acts.** That sliver was the ONLY home for **Add card, New page card, Existing
page…, From a deck…, and the connections-footer toggle**. R13 says those acts
MOVE into the cascade's Page and Plan faces; I built the Place-page list and
stopped. The result was not a relocation, it was a deletion: a board lost the
ability to add a card.

The suite said so immediately and in chorus — **ten separate files** (fx13,
b1, b2, b3, fx4, fx5, fx6-adjacent, fx7 S9, m2, m4) each reaching for a board
tool that no longer existed. This is precisely why the known-flake list is
empty and why a red suite is treated as real.

**Fixed in M11 by restoring the sliver on boards**, deliberately, with the
reasoning written into the code: *implementing half of a ruling is worse than
deferring it.* R13.iv should land in ONE ticket together with the Plan face's
`＋ New card` and the rest — the absence and the new home in the same commit,
so no state of the tree is ever missing a board's own tools. Verified after
the restore: **fx13 PASS (10), b1 PASS (47)**.

R13.ii's Place-page list is unaffected and stays.

### Class A — ruled supersessions, needing park-never-edit treatment

These are not regressions. Each asserts a law one of Nick's rulings replaced,
and each needs the same treatment fx7 S3 already received in M1: the original
kept **verbatim** under a SUPERSEDED header with a successor pointer, and a
successor assertion beside it for the new law.

| harness | asserts | superseded by |
|---|---|---|
| `fx3` (5) | the foot's old THREE icons; "the instruments panel opens" | M4 / R5 — foot is Typewriter·Progress·Full Screen; Instruments retired |
| `fx2` (6) | "the sliver's typewriter toggle flips it ON by hand" | M4 / R3 — the toggle moved inside the Typewriter menu |
| `sc1` (3) | "the typewriter OPTION does not present itself on a screenplay page" | M8 / **R12 reverses this exactly** |
| `cd1` (1) | "the sliver on script carries the structure picker" | M5 / DR3 — the tablist retired for the conversion row |
| `fx7` (2) | Free Write's rail carries a "Format" section; carries the inert ink-tool toggle | M4 / R1 (STYLING) and R2+G3 (placeholder exits) |
| `fx6` (1) | clicks `.board-popup-strip .mode-tbtn[title="Bold"]` | M9 / R13.v — B·I·U moved into the card's dock |
| `m4` (1) | clicks `aria-label="Writing settings"` | M4 / R5 — that instrument is now "Progress" |
| `ab2`, `fx1` | sliver/rail contents | M4 / M5 |

**These are NOT parked yet.** Parking ten files' worth of assertions properly
— original verbatim, successor beside it, at every width each covers — is
careful work, and doing it hastily at the end of a long night would produce
exactly the sloppy record the park law exists to prevent. It is the FIRST
morning task, and the table above is the complete map for it.

### Second run, after the board restore

**41/54 OK, 13 red** (from 38/54, 16 red). Four files recovered exactly as
predicted — **b1, b3, fx5, fx13** — and fx7 dropped from 3 failures to 2, its
S9 board-deck-door check recovering with the sliver. That recovery pattern is
the proof that Class B was correctly identified: restoring one prop fixed
precisely the files that reached for board tools, and nothing else moved.

Remaining 13:

- **12 are Class A**, per the table above: `ab2`, `b2`, `cd1`, `fx1`, `fx2`,
  `fx3`, `fx4`, `fx6`, `fx7`, `m2`, `m4`, `sc1`. Every one asserts a law a
  ruling replaced. They need parking, not fixing.
- **1 is `m3`, and it is not mine.** It asserts "the saturated live ground
  ROAMS — its rendered extent reaches near all four stage margins": the
  Rhizome's ambient growth layer. It **passed in run 1 and failed in run 2**,
  on identical code — nothing in this wave touches the rhizome. An assertion
  on an ANIMATED extent that alternates between runs is the exact signature
  item 82 characterized as its order/timing-dependent family (m4, th2, j4, j5,
  b2-1, fx6). I am NOT clearing it: the known-flake list is empty by DF1.1 and
  "it passed in isolation" is a retired argument. It is reported here as a
  sighting for item 82's lane, with both run results as the evidence.

**Two findings worth keeping from `fx4`,** because one of them nearly became a
false alarm in this report. Its Tab-containment check failed, which reads like
a broken focus trap — M9 added three focusable buttons inside `.board-popup`.
The detail says otherwise: `{"focusableCount":5,"wrappedToFirst":true}`. **The
trap still wraps.** It queries live over every button in the dialog, so the
dock's buttons are trapped automatically; the assertion pins the element
count, which went 3→5 with Underline. Accessibility is intact. The other
failure is the roster count (`detail: 3`) — B·I·U where the frozen set was
B·I, which is R1.

---

## §4 · WHAT WAS BUILT, briefly

**The cabinet (M1).** The cascade drawer sits flush on the rail: the
`+ var(--frame-gap)` term is gone from `.desk-frame-cascade-anchor`, and the
panel lost its left border and left corner radii, because at a flush seam a
second 1px line reads as the gap the ruling closed. Menus rest olive (R7) —
engraved zoneheads, and the ON toggle switch, which was the most literal
breach: a brass-filled switch sat lit all session on every page with a toggle
on. Hover brass moved to `:active`; hover is approach, press is the act.
`store/menusDrawers.ts` holds the two-drawer law and MEASURES — lawful
because it decides *whether* both may stand, never *where* either sits.

**The schema (M2).** Two nullable jsonb columns on the proven
`add column if not exists` recipe. The brief said `ALTER TABLE entries`; the
table is `journal_entries` — disk won. `page_settings` rides the existing
/sync mapper; `page_defaults` gets a plain GET/PUT because it is a singleton
on the user row with no id and no clock.

**The desks (M3–M9).** PAGE SETUP writes to the live sheet (the paper is the
preview). Free Write gains STYLING with Underline and the two-press bracket
returning with it; the foot becomes Typewriter · Progress · Full Screen and
the Instruments panel retires whole. Draft gains R4's roster on F3's
line-prefix directives. Boards lose the sliver entirely and gain a
Place-page list. Places promotes its aria to the eye. Screenplay gains the
universal foot. The opened card gets a `right:100%` dock, centred, free to
outgrow the card.

**The anchor law held throughout.** Every drawer and dock built tonight is
anchored by layout — `right:100%`, `left:0`, flex siblings. No script writes
a drawer position anywhere in the wave.

---

## §5 · GAPS, DEVIATIONS AND BLOCKERS — the honest list

### Blocking-grade: do not merge these on this report alone

**0. THIRTEEN HARNESS FILES ARE RED, and twelve of them are ruled
supersessions that must be PARKED before this branch is clean.** §3 carries
the complete per-file map. This is the first morning task and it is not
optional: a red suite with an explanation is a reviewable state, but it is not
a mergeable one. The thirteenth (`m3`) is an item-82-family sighting, not
this wave's.

**1. M2's schema was never executed.** No database is reachable from this
environment: no `psql`, no Docker daemon, no `embedded-postgres` dependency,
and `apps/server` has no test script or test file of any kind. Two attempts
were made (search for a local/embedded DB; search for server test
infrastructure). What stands in its place: the DDL is character-for-character
the pattern already running in production on this same boot path, and the SQL
parameter alignment was proven statically — **24 columns, 24 placeholders, 24
values**, `page_settings` last in all three, because a miscount there fails
only at runtime. The round-trip, the boot-twice idempotence check, and
birth-from-defaults are all genuinely unproven. **Exercise them against a real
database before any deploy word.**

**2. M4's Typewriter menu stores but does not yet drive.** Forward Lock's
unit and count, Line Fade's line count, and the writing line's position all
PERSIST and all render honestly — and none of them are connected to the
engines that would honour them. `useTypewriterFade`'s built ~62% hold band is
untouched. This is the single largest functional gap in the night, and it
sits exactly on the boundary R12 flagged as engine-touching and gave its own
brief. The controls are honest about what they store; they are not yet honest
about what they change.

### Deliberate deviations, with reasons

**3. The Sliver was not re-mounted at `right:100%` (M1).** The brief called
for it. The invariant it exists to guarantee is already met and now
probe-enforced (0.00px, both widths, open and closed), while the refactor
would thread the sliver through ModeStage into every page host and disturb
the anchor fx3/fx4/fx5/sc1 all assert. Removing the latent two-sources-of-
truth fragility is real work and deserves its own ticket with the suite
behind it. The probe now fails loudly if that formula ever drifts.

**4. The probe runs against the built bundle, not `pnpm dev` (M0).** The
house harness (`runtime-verify.mjs`) is the repo's own proven path, spawns
and reaps its own Chrome on a PID-keyed profile dir, and is what every other
harness here uses.

**5. R13.iv IS DEFERRED — the board keeps its Tools sliver for now (M6, undone
in M11).** See §3. The ruling stands; only its sequencing changed. It should
land in ONE ticket together with the Plan face's `＋ New card`, `New page
card`, `Existing page…`, `From a deck…` and the connections-footer toggle —
the absence and the new home in the same commit. R13.ii's Place-page list is
built and unaffected.

**6. "Fit to content" was not re-homed to the Plan face (M6).** It does not
exist. BD1 called it a re-home of "the existing control", but item 78 is
still open and unbuilt — grep finds no `fitToContent`, no `viewScale`,
nothing to move. Building it inside a menus ticket would invent item 78's
mechanism against G3 and against the ledger's own reserved decision.

**7. CA3's always-present card grip and BD2's Delete absence are not
started (M6).** Both are card-surface work rather than cascade work.

### Not verified

**8. M5's new directives do not RENDER yet.** `store/draftDecoration.ts` is
not taught the new tokens, so `>< ` and a leading tab currently show as
literal characters, and no line actually paints centred or right-aligned. The
directives are stored, stripped and exported correctly. This is the other
half of F3; S1/79 (visible markdown markers) is the same family and already
on the lock sheet.

**9. M9's dock geometry is unmeasured.** Reaching an opened card headlessly
needs a board with a text card, a double-click, and the popup's focus trap —
a fixture chain worth building properly. The anchor is pure CSS with no
script, which is what makes it verifiable by inspection, but nobody has
looked at it rendered. Open a card at dawn.

**10. M3's persistence across reload is unproven** — it crosses the database
(see gap 1). The write path is the same `saveJournalEntry` every other page
mutation uses.

### Deferred by the brief's own §0 (not gaps)

INK's mounting (R2 — rides the stylus return) · the screenplay typewriter
ENGINE revival (R12) · Import File (R13, no pass has designed it) · specialty
board TOOL tabs (R13.vii hold) · links/tags backing model (F10 — the
opened-card dock has room for them the day the model lands).

---

## §6 · HARNESS: PARKED, NEVER REWRITTEN

M1's flush fix falsified five FX7 S3 assertions, which asserted
`gap === --frame-gap` — that ticket's correct intent, and now the old law.
All five are kept **verbatim** as commented blocks with a SUPERSEDED header
and a successor pointer; five successors beside them assert the new zero-gap
law at the same three widths. Coverage was re-aimed, not lost. fx7 returned
to PASS (45 checks).

One successor carries a **half-pixel** overlap tolerance rather than an exact
`>=`: the anchor's `calc()` lands on a subpixel boundary at 1280 (measured
−0.015625px, 1/64th of a pixel). An exact comparison would red the suite on a
rounding artifact.

---

## §7 · MISTAKES MADE AND CAUGHT, for the record

Recorded because a night with no visible errors is usually a night with
unexamined ones.

- **The geometry study's own unit bug.** While writing the study that became
  this wave's normative reference, `canCoexist()` compared transform-scaled
  `getBoundingClientRect` values against unscaled CSS pixels — invisible at
  scale 1, wrong everywhere else. The same species as the defect being fixed.
  Caught before commit; the unit discipline is now spelled out in-file.
- **The probe measured the wrong box, twice.** First it compared the cascade
  panel to `.desk-frame-stagecol` (left 40.0) instead of the rail it opens
  from (right 84.0). Then it asked for `.script-page`, the screenplay's outer
  wrapper, instead of `.script-sheet`, the paper. Comparing against the wrong
  box reports a number that is not the invariant.
- **Options passed to a zero-argument function.** The board setup called
  `wrizoCreateJournalPage({pageType:'board'})`. That seam takes no arguments
  and hardcodes a prose page, so the object was silently ignored and the probe
  waited for a `.board-canvas` that could never appear. Only the waitFor's own
  diag dump gave it away. Boards now come through the app's real door.
- **A backtick inside a SQL comment** terminated a TypeScript template
  literal in `sync.ts`.
- **A lexicon sweep that failed for the wrong reason** — shell-mangled regex
  reported all 59 values missing. The tell: `Record<DeskTermId, string>` is
  exhaustive, so 59 missing values and a clean typecheck cannot both be true.
- **A JSX comment placed in an attribute position** in BoardEditor.

---

## §8 · PROCESS

Check-then-commit before every commit; `git rev-parse --show-toplevel`
verified inside the worktree before each. Every ticket pushed at commit time
(COMMIT = PUSH). `main` untouched after the brief. Nothing forced.

Browser hygiene: every probe spawned its own Chrome on its own debug port and
PID-keyed profile dir, and killed only what it spawned. Two pre-existing
`chrome.exe` processes (Nick's own browser) were present all night and were
deliberately left alone — a by-name kill would murder another session's runs.

**Screenshots:** `docs/menus/build-shots/` — prose, screenplay and board at
1366×768 and 1680×1050.

---

*— the menus lane, 2026-08-04, on Nick's overnight authorization. Fable
reviews `menus-build` at dawn; the merge word and the deploy word are Nick's
own, and gaps 1 and 2 above should meet a real database and a real hardware
walk before either is given.*

---

# ADDENDUM — S4, RUN 2026-08-24 (after the doorway deploy)

Run on Nick's word once the doorway stamp was down (`git 1cbda72 · railway
59d55924`) and the box was free. Verified free before starting: 0 foreign
harness browsers, 0 suite/harness node processes.

## The expectation had moved before the run

S4's runbook figure was **41/54 with thirteen mapped reds**, measured
2026-08-04. By 08-24 main had advanced **67 commits / 22 code files**, and:

- the suite is now **59 files, not 54** (main added five);
- **four of the mapped reds' own files changed on main** — `sc1`, `b2`, `j4`,
  `j5` — as did `runtime-verify.mjs`, which the probe rides on.

So the branch was merged with main first (`e3cb0fd`) — S1's authorized
pattern, merge commit, no force — because a smoke of a week-stale tree cannot
inform a merge word. One conflict, `createJournalPage`, both sides kept: main
gave it a `seed` parameter (item 85's seam remediation) and renamed the
timestamp to `createdAt`; M2's birth-from-defaults line is orthogonal and rode
unchanged.

## Result

**Suite: 46/59 OK, 13 red**, clean tree, no dirty flag.

- **Twelve are the mapped Class A supersessions**, unchanged in cause: `ab2`,
  `b2`, `cd1`, `fx1`, `fx2`, `fx3`, `fx4`, `fx6`, `fx7`, `m2`, `m4`, `sc1`.
- **`m3` came back GREEN.** It was the thirteenth red on 08-04 and was
  reported then as an item-82-family order/timing sighting, not cleared. It
  passed here on a quiet box — a second data point for item 82's lane, still
  not this lane's to clear.
- **One red was NOT on the map: `item87.mjs`.**

**Probe: 42/42 green** — three surfaces × two widths, dock open and closed
where a dock exists, paper-rect invariance under both toggles. Fresh
screenshots taken on the merged tree came out **byte-identical** to the 08-04
set (git saw no change to commit), which is a small piece of evidence that the
rendering is deterministic across a week and a 67-commit main.

## The unmapped red, diagnosed to root cause

```
item87.mjs — S2 (b) "and Draft still HAS them (the presets were hidden, not deleted)"
             activeMode=Draft  structureSectionPresent=false
```

`structureVisible()` queries **`.wz-sliver-structure`** — the Prose|Screenplay
TABLIST's own class, which **DR3 retired in M5** when the tablist became the
confirm-gated conversion row.

Verified in source: Draft's Structure **section still renders** —
`.wz-sliver-section`, the `railStructure` heading, and "Convert to
Screenplay…". Only the tablist class is gone from the TSX. **The capability
item87 guards is intact; its selector measures the form a ruling replaced.**

So it is a **fourteenth Class A supersession** — with one difference that
matters: **item87 belongs to another lane**, written during the doorway wave,
after Pass 2 ruled DR3. Parking it means editing their harness, and this lane
does not cross that boundary unilaterally — the last time it did, on this
machine, it cost that lane its suite. **It goes to the park pass as a
cross-lane item, on Nick's or Fable's word.**

Also for that pass: `.wz-sliver-structure` and `.wz-sliver-structure-btn`
survive in `index.css` as orphaned CSS. M10's sweep covered components, not
stylesheets.

## Standing

Merged tree verified: desktop `tsc` clean, server `tsc` clean, `pnpm install
--frozen-lockfile` clean, web build green. Box left clear.

S4 is complete. What it changes about the merge word: nothing regressed — the
one surprise is a stale selector in another lane's harness, and the fourteenth
red is the same species as the twelve already mapped.

*— the menus lane, 2026-08-24.*
