# ITEM 151 · SHAPE A — BUILT AT THE HELPERS, NOT THE 83
### tools lane · branch `item151-silent-acts` · worktree `.claude/item151-silent-acts`
### built `2afc8e0` · merged `origin/main @ 4a42bce` → `fb97181` · falsification `tp1.mjs` · 2026-09-18

**BUILT, COMMITTED, AND THE INSTRUMENT ITSELF NOW FALSIFIED (§11) — THE FULL
PAIR STILL CHAT 1'S TO GRANT AND RUN.** A new, standing regression file,
`scripts/harness/tp1.mjs`, proves the hit-test catches the defect it was
built for (a known covered point fails by name; the same point unmutated
proceeds) — **7 checks, ran clean**, under the freshly-issued
`tools-item151-pair-20260918` grant, scoped to that one file only. The
**91-file** regression (90 + `tp1.mjs`) has NOT been run — that is the pair
Fable's message names as chat 1's to grant and verify; this offer does not
pre-empt it. `tsc --noEmit` and `build:web` are re-verified clean post-merge
(§9); neither of those is the suite either.

**FOUR THINGS ADDED TO THIS OFFER, ANSWERING FABLE'S OWN FOUR:** §11 the
falsification, run and shown, not only designed; §12 the covered-point
census, stated as **unknown** with the reasoning for why guessing a number
would repeat the exact trap item 155 was opened to name; §13 the
convergence decisions with **why** foregrounded for every file, not only
which; §14 the verified-in-name-only audit — of **8** files carrying a
pre-existing `elementFromPoint` reference (not 7; the recount and the
discrepancy are both stated plainly), which actually gated the flagged
dispatch and which did not, checked file by file against the pre-fix
source rather than recalled from memory.

**item121.mjs and item126.mjs remain HELD, not done** — §6, unchanged, and
restated at §14's close: chat 1 carries the INK/FIX routing notice; nothing
in either file converts before that clears.

---

## §1 · THE FIX, ONE INSTRUMENT FOR TWO CALL SHAPES

`app.mouseDown(x, y)` / `app.mouseUp(x, y)` take a raw point — no element,
no selector — so the fix instrument differs from item 148/VW1's guarded-
handle pattern. Two primitives, both new in `apps/desktop/scripts/trusted-
point.mjs`:

- **`trustedDispatch(app, elExpr, what, { report })`** — for call sites that
  still have a selector or element expression to resolve. Re-derives the
  point from `hittablePointBy` (pw1.mjs's own proven instrument, extracted
  here as the canonical source — see its header comment for the full
  reasoning) immediately before dispatch, so a covered or absent point is a
  **named failure**, never a silent proceed. Two failure conventions,
  matching what was already live: a `report` callback fails a named check
  and returns `false` (pw1.mjs's own `ok()`-collecting style, so one bad
  site doesn't abort the rest of the file); no callback throws.
- **`assertHittable(app, x, y, what)`** — for the narrower shape: call sites
  that receive a **bare coordinate** with no surviving element reference
  (the caller already computed `x, y` from its own rect read, typically
  mid-drag). This can only confirm the point isn't empty space — it cannot
  confirm the point still belongs to whatever the caller meant. Weaker than
  `trustedDispatch`, and the module's own comment says so rather than
  presenting the same guarantee twice.

**Drag-start-only hit-testing, applied consistently.** For any multi-step
drag (`mouseDown` → several `mouseMove` → `mouseUp`), only the initial
`mouseDown` point is verified. Mid-drag and the final `mouseUp` point are
not — by the time the drag has run, the dragged element has deliberately
moved under the cursor, so "hits nothing there" would be the drag working,
not a finding.

---

## §2 · CONVERGENCE — WHERE HELPERS MERGED, WHERE THEY STAYED APART, AND WHY

**Four near-identical `trustedClick` bodies converged to one shared
wrapper**, imported rather than copied — `bm1.mjs`, `item9192.mjs`,
`sc2.mjs`, `cd4.mjs`, `sc1.mjs` (five files; the byte-identical body was
carried into a fifth beyond the three the brief named). All five now read:

```js
const trustedClick = async (app, sel) =>
  trustedDispatch(app, `document.querySelector(${JSON.stringify(sel)})`, sel);
```

**`e1.mjs`'s lighter variant converged too, folded rather than left
parallel.** It selected by visible text (`rectOfText`) instead of a
selector, with no hit-test at all. Rather than keep a separate helper next
to the shared one, `rectOfText`'s lookup was folded directly into the
`elExpr` string passed to `trustedDispatch`, and the now-redundant function
removed — one fewer near-duplicate, not a second lineage kept "for now."

**Three independent `hittablePointBy` reimplementations retired in favour
of the one import** — `pw1.mjs` (the original), `pw2.mjs` (a copy), and
`vw1.mjs` (a **third, independently narrower** reimplementation:
`[0.5, 0.3, 0.7]` fractions only, no `scrollIntoView`). All three now import
from `trusted-point.mjs`. This is the convergence the brief's own line
about "four copies of one guard" was written for — `vw1.mjs`'s copy in
particular had silently drifted to a weaker fraction set than the original,
which is exactly the gap a fourth copy could have repeated.

**Four-file `clickAt` family converged** — `fx7.mjs`, `fx8.mjs`, `fx9.mjs`,
`j6.mjs` carried byte-identical bodies; all four now call `assertHittable`
first.

**Left apart, on purpose — no shared shape to converge into:**
`fx11.mjs` (`clickAt`, `resizeBy`, `moveBody` — three different call
shapes in one file), `bg1.mjs` (`clickDoor` — see the correction below),
`fx17.mjs` (`dragCard`), `reveal.mjs` (`realClick`), and the inline sites in
`fx5.mjs`, `bg2.mjs`, `fx13.mjs`. None of these duplicated another file's
helper closely enough that converging them would have removed a real
copy — each stayed a local, one-off fix.

---

## §3 · VERIFIED PER HELPER, NOT PER FILE — AND WHAT THAT CAUGHT

Fable's own caution was concrete: "a file referencing `elementFromPoint`
somewhere is not a file that hit-tests at the dispatch." The inventory this
build worked from was built and then **re-swept twice** for exactly that
reason:

- **First pass** (named helpers only) missed `hittablePointBy`'s own
  expression-body definition (no braces), which meant it couldn't see that
  `pressEl`/`pressOn`/`pressCategory` called it — `pressOn` needed **two**
  levels of call indirection resolved (`pressOn` → `hittablePoint` →
  `hittablePointBy`) before it read as safe, confirmed by manual read, not
  by trusting the tool's label.
- **Second pass** (whole-file sweep for any bare `app.mouseDown` with no
  hit-test in the preceding lines, since inline sites with no named
  wrapper were invisible to the first pass) found **19 more candidates**:
  3 false positives (already safe via deeper indirection than the tool
  could follow), 16 real. The 16 are the per-file sites listed in §2's
  "left apart" list plus the extra sites below — none of them was named in
  the original 83-site/22-file count, which means that count itself was a
  lower bound, not the population.

**CORRECTED, against §14 below — this originally claimed "no file turned
out to be verified in name only," and that was wrong, stated before the
audit Fable's own message asked for was actually done.** What this pass
DID catch was narrower: it confirmed `pw1`/`pw2`/`vw1`'s own
`hittablePointBy` copies genuinely gated the sites already routed through
them (and caught `vw1`'s weaker fraction set, §2). It did **not** check
whether a file's UNRELATED `elementFromPoint` reference — a diagnostic
probe, a comment about product code — might read as reassurance for a site
that was in fact bare. §14 is that check, done properly: **5 of 8** files
carrying such a reference were verified in name only for the flagged
dispatch (`bg1`, `bg2`, `cd4`, `fx5`, `fx7`), and a 6th (`pw1`) was a
genuine instrument that still missed two of its own sites. The fix applied
to their dispatch sites was correct regardless — bare sites got gated
either way — but the claim that no file misled a reader this way was not
true, and stands corrected here rather than quietly edited.

---

## §4 · THE BUG CAUGHT MID-BUILD, KEPT ON THE RECORD

`bg1.mjs`'s `clickDoor` conversion **introduced a real bug on the first
attempt**: the original sequence hovered before pressing
(`await app.mouseMove(r.x, r.y)`, then a sleep, then `mouseDown`/`mouseUp`),
and because `trustedDispatch` doesn't expose the point it resolves
internally, the first attempt replaced that hover with a meaningless
`await app.mouseMove(0, 0)`. Caught by re-reading the diff, not by any
check. Fixed by calling `hittablePointBy` directly in `clickDoor` and
preserving the exact original mouseMove → sleep → mouseDown → mouseUp
sequence — `bg1.mjs` is one of the files left apart in §2, and this is why:
it needed its resolved point for a second purpose `trustedDispatch`'s
signature doesn't surface.

---

## §5 · SITES FOUND ON THE SECOND SWEEP, BY FILE

- `fx11.mjs` — a fourth site beyond its three named helpers: an inline
  `S1` drag-start in the `withHarness` body.
- `fx7.mjs` — three more sites: upsize/downsize/content-floor-check
  resize-handle drag starts.
- `fx8.mjs` — one more drag-start site.
- `fx5.mjs` — two inline sites: the S4 board-box press, the S5 pin-grab
  drag start.
- `bg2.mjs` — one inline site: the door press inside the hover/press
  colour-sampling fixture, fixed without disturbing the sampling sequence.
- `fx13.mjs` — one inline drag-start site.

---

## §6 · HELD, NOT TOUCHED — ROUTING-GATED

`item121.mjs` (1 site) and `item126.mjs` (7 sites) carry Shape A too, and
are 2 of the 4 files item 151's own S0 survey already named as INK's
territory (routing notice already on the ledger, for item 154's separate
in-string population). Shape A's sites in these same two files are held
under the same gate rather than converted under a different item number —
nothing here is touched until INK/FIX have seen this offer.

`fx5.mjs`'s Shape A sites (§5) were **not** held — the S0 routing notice
named `fx5.mjs` for its evalJs-string population (item 154), a different
population living in the same file; Shape A's outer coordinate-dispatch
sites in `fx5.mjs` are outer JS structure, not the in-string territory the
routing gate was about, so they were fixed here.

---

## §7 · SHAPES C AND D — CLOSED AS SAFE, QUALIFIER KEPT

Recorded on the ledger already (`ITEM 151 REOPENS AND WIDENS`): `waitSoft`
is one deliberate named idiom, always followed by an independent re-check.
**Verified representatively in one file of six, not exhaustively** — a
representative check stated as representative is honest; the same claim
stated as complete would be the thing this arc keeps catching. No further
verification done in this build beyond what's already on the ledger.

---

## §8 · ITEM 155 — ALREADY OPENED ON THE LEDGER

Shapes B (1,443 raw ignored-`evalJs`-result matches) and E (30 raw hits, 4
genuine screenshot cases in `fx4`, `fx5`, `fx8`, `item126`) are recorded as
parked under item 155 already (`ITEM 155 — UNVERIFIED ACTS`). Nothing in
this build touches either shape.

---

## §9 · VERIFICATION RE-RUN POST-MERGE

`origin/main` moved to `4a42bce` while this build was in progress; merged
clean (`fb97181`, no conflicts — the incoming content was TOOLS' own
earlier park-conform work having landed on main, plus ledger docs, nowhere
near this build's edits). Re-verified rather than assumed clean:

```
tsc --noEmit         exit=0
build:web             exit=0, bundle index-DfFOCr6L.js unchanged
node --check          all 21 touched files, clean
```

Bundle hash unchanged from the pre-merge build, confirming the merge
carried no app-source changes that would affect it — only harness/docs.

**The 91-file suite has not been run.** `tsc`/`build:web`/syntax checks are
pre-flight reads, not a launch. One file of the 91 — `tp1.mjs`, the
falsification below — HAS been run, scoped on its own, under a grant issued
for exactly that; the other 90 wait for chat 1's pair.

---

## §11 · THE FALSIFICATION — RUN, NOT ONLY DESIGNED

A green regression proves nothing broke; it does not prove the fix does
anything. `scripts/harness/tp1.mjs` is a new, permanent, committed
falsification file, added to the roster (90 → **91**) rather than run once
from scratch and discarded, so chat 1's own pair re-verifies it every time
this suite runs from here on — the same posture every other fix in this arc
leaves behind (`vw1.mjs` for the rail regroup, item130's own `pok()`s).

**Fixture, not feature.** It builds a synthetic target element and, on
demand, a second real element at the identical rect covering it — no app or
journal state, because this proves the INSTRUMENT, not a behaviour.

**Ran clean, 7/7, under `tools-item151-pair-20260918` (the box was quiet —
0 foreign browsers — before this grant was taken):**

```
[01/1] OK        exit=0    4s tp1.mjs :: TP1 VERIFY: PASS (7 checks)
SUITE DONE HARNESS_PARKED=unset — 1/1 of 1 returned a passing verdict
SUITE RESULT: CLEAN — tree=9dd8e7a+1dirty bundle=index-DfFOCr6L.js/586771b
```

(`+1dirty` is `tp1.mjs` itself, untracked at the moment it ran; committed
alongside this offer, below.)

| # | claim | result |
|---|---|---|
| S1 | **UNMUTATED** — `trustedDispatch` on a real, uncovered target: proceeds, dispatches | PASS — no throw, hit counter reached 1 |
| S2 | **THE FALSIFICATION** — same target, now covered by a second real element at the identical rect: fails BY NAME, does not dispatch | PASS — threw `trustedDispatch: tp1 S2 — {"found":false,"why":"occluded","by":"tp1-cover-el"}`; hit counter stayed at 1 |
| S2b | `hittablePointBy` read directly: reports the same `found:false, why:'occluded'` | PASS |
| S3 | cover removed: dispatch resumes | PASS — no throw, hit counter reached 2 — **the fix reports the true state at each call; it does not latch a prior failure** |
| S4 | **UNMUTATED** — `assertHittable` at the same real point: proceeds, returns the target's own tag | PASS — `DIV.tp1-target-el` |
| S5 | **THE FALSIFICATION (assertHittable)** — a point outside the viewport: fails BY NAME | PASS, on the SECOND attempt — see below |
| S6 | **THE DOCUMENTED LIMIT** — covered by a different real element: `assertHittable` has no identity to check, reads "not empty," proceeds | PASS — returned `DIV.tp1-cover-el`, the cover's tag, not the target's |

**S5's first attempt was wrong, and the wrongness is worth keeping on the
record rather than quietly fixed.** It first tried `(5, 5)` as "an empty
point" and that FAILED — `assertHittable` proceeded, because a full-bleed
app layout paints something under nearly every on-screen coordinate;
`elementFromPoint(5, 5)` returned a real ancestor element, not null. The
premise "this point is empty" was never checked before being asserted —
exactly the mutation-testing law this arc already carries ("assert the
mutation landed before believing the red"), applied to a TEST'S OWN setup
rather than to the code under test. Fixed by moving the point outside the
emulated viewport (`50000, 50000`), where `elementFromPoint` is specified
to return null rather than merely landing on an unused corner of the page.

**What this proves, precisely:** `trustedDispatch` catches an occluded
target (S2) and recovers correctly once the occlusion is gone (S3);
`assertHittable` catches a truly empty point (S5) but — by design, not by
gap — does not catch occlusion by a different real element (S6), because a
bare coordinate carries no identity to check the covering element against.
This is the same limit the module's own comment and this offer's §1 already
stated in prose; S6 is that claim made to fail if it were false, and it
didn't.

---

## §12 · THE COVERED-POINT CENSUS — UNKNOWN, STATED AS SUCH AND WHY

**Unknown, for very nearly all of the 102 fixed call sites (83 original +
19 found on the second sweep), and not guessed.** No suite has run any of
these 102 sites against the new instrument yet — that is chat 1's pair,
not something this offer can report ahead of it. A number offered here
without having run a single one of them would be the exact overcount trap
item 155 was opened to name, aimed at itself: **a number you cannot defend
per site is not a prediction, it is the same trap in the other direction.**

**What IS known, and belongs beside the "unknown" rather than replacing
it:**

- **The defect class is not hypothetical.** `pw1.mjs`'s own `hittablePointBy`
  was built, before this item existed, to prove a REAL occlusion on two
  specific cascade-menu presses (item 130) — the instrument this build
  generalises was invented because a silent wrong-element dispatch had
  already happened once, on this exact UI family (menus/popups over a
  board).
- **§14 below already found two more, inside the very file that carries the
  proof of concept.** `pw1.mjs`'s "⋯" menu press and "Display on Board"
  press were BARE — no hit-test at all — sitting a few hundred lines from
  its own `hittablePointBy`. If the file that invented the fix had two
  ungated sites, sites elsewhere have no special reason to be safer.
- **A qualitative risk shape, not a count.** Sites that dispatch near
  floating, z-stacked, or drag-repositioned UI — menu/popup presses
  (`pw1`, `pw2`), resize-handle and card drags (`fx7`, `fx11`, `fx13`,
  `fx17`), door presses beside overlapping "beginnings" rows (`bg1`, `bg2`)
  — are structurally the ones where something else painting over the
  intended point is architecturally possible. Sites pressing an isolated
  control in an otherwise flat layout (most of the `trustedClick`-family
  conversions — `bm1`, `item9192`, `sc2`, `cd4`, `sc1`, `e1`) have less
  surrounding UI to be covered by. This is a reading aid for the pair's own
  red output, not a substitute for running it: **a red in the first group
  should surprise nobody; a red in the second is worth a closer look before
  assuming it's the same class.**

**Read the pair's result this way:** any NEW red produced only by this
build (not present in a pre-fix baseline run) is item 130's class caught
retroactively — a real defect that has been passing, not a regression this
fix introduced. §11 is what makes that reading trustworthy rather than
merely asserted: the instrument is shown to fail only when the point is
genuinely wrong, and to proceed when it is genuinely right.

---

## §13 · CONVERGENCE — EVERY DECISION, WITH WHY FOREGROUNDED

(§2 above has the mechanics; this section exists because Fable's own ask
was specific — WHY, not only which — so each decision states its reason
first.)

| files | decision | why |
|---|---|---|
| `bm1`, `item9192`, `sc2`, `cd4`, `sc1` | **converged** to one `trustedClick` import | bodies were byte-identical; keeping five copies is four extra places the next gap could hide, which is the exact shape this item exists to close |
| `e1` | **converged**, folded rather than kept parallel | its text-selecting lookup had NO hit-test at all; rather than leave a second, differently-shaped `trustedClick` beside the shared one, its selection logic was folded into the `elExpr` the shared wrapper already takes — one lineage, not two |
| `pw1`, `pw2`, `vw1` | **converged**, three `hittablePointBy` copies retired for one import | not merely duplicated — DRIFTED: `vw1`'s own copy had quietly narrowed to weaker fractions (`[0.5,0.3,0.7]`, no `scrollIntoView`) than the original it was copied from. A third copy is a third place that drift can happen again undetected |
| `fx7`, `fx8`, `fx9`, `j6` | **converged** to one `clickAt` using `assertHittable` | byte-identical bodies, same reasoning as the `trustedClick` row |
| `fx11` | **left apart** | three DIFFERENT call shapes (`clickAt`, `resizeBy`, `moveBody`) live in this one file; none duplicates a shape shared with another file, so converging would not remove a real copy |
| `bg1` | **left apart** | `clickDoor` needs its resolved point for a SECOND purpose (a deliberate hover before the press) that `trustedDispatch`'s signature doesn't expose — converging it caused the real bug at §4, and staying apart is the fix for that, not just the original reason |
| `fx17` | **left apart** | `dragCard`'s shape (drag-start-only hit-test inside an existing `if (!p) return null` guard) is local to this file, not duplicated elsewhere |
| `reveal` | **left apart** | `realClick(app, pt)` takes an already-resolved point object, a shape not shared with any other file's helper |
| `fx5`, `bg2`, `fx13` | **left apart, inline** | single one-off dispatch sites, not named helpers at all — nothing to converge because nothing is duplicated |

---

## §14 · THE VERIFIED-IN-NAME-ONLY AUDIT

**Recount, stated plainly: 8 files, not 7.** Grepped fresh against the
pre-fix tree (`20216f0`, the S0 commit) rather than recalled: every one of
the 22 census files that references `elementFromPoint` anywhere, at all —

```
bg1.mjs(2)  bg2.mjs(1)  cd4.mjs(1)  fx5.mjs(2)  fx7.mjs(1)  pw1.mjs(3)  pw2.mjs(3)  vw1.mjs(2)
```

Whatever count was given earlier in conversation does not survive contact
with a fresh grep against the actual pre-fix source, and this offer trusts
the grep over the memory — the same instinct that opened this whole item.
Each of the 8 checked individually against its pre-fix diff, not against
the mention alone:

**REAL — the reference actually gated the dispatch it sat near:**

- **`pw2.mjs`** — a full, working `hittablePointBy`, and every one of its
  dispatch sites already called through it. The diff (§3) is a pure
  import-swap; no un-gated site was found here on the second sweep.
- **`vw1.mjs`** — likewise a full, working (if narrower) copy, and every
  dispatch site already went through it. Real, not in-name-only — but
  weaker, which is why it converged too (§13).

**REAL, BUT NOT EVERYWHERE — the file's own instrument was genuine, and
still had gaps at specific sites:**

- **`pw1.mjs`** — the file `hittablePointBy` was extracted FROM, and its
  `pressEl`/`pressOn`/`pressCategory` helpers do genuinely gate every
  dispatch that goes through them. But two sites — the "⋯" menu press and
  the "Display on Board" press (§5) — dispatched `mouseDown`/`mouseUp`
  directly, a few hundred lines from the file's own proven instrument,
  never routed through it. **This is the sharpest instance of Fable's own
  warning**: the file most confidently "verified" by any reasonable
  reading — it's where the fix was invented — still had two sites carrying
  the exact defect the rest of the file exists to prevent.

**VERIFIED IN NAME ONLY — THE DANGEROUS KIND, NOT MERELY THE UNVERIFIED
KIND.** These five did not sit uninspected; they sat behind a real
`elementFromPoint` string that reads, on a bare grep, exactly like the
seven files that turned out safe. An unverified file announces its own
risk — nobody mistakes silence for a guard. These five look guarded and
are not, which is the more dangerous shape by construction, not by degree:

- **`bg1.mjs`, `bg2.mjs`** — the `elementFromPoint` calls are a DIAGNOSTIC
  read for an unrelated check (measuring whether a "door" row visually
  covers a text caret, for a caret-occlusion assertion), not a gate in
  front of `clickDoor`'s own press. `clickDoor` itself was completely bare
  before this build (§4).
  <br>*(`bg2.mjs`'s door-press site, fixed with `assertHittable` at §3, sat
  in the SAME file as this diagnostic read and shared none of its logic.)*
- **`cd4.mjs`** — the reference is a CODE COMMENT describing the
  application's own `onDoubleClick` handler (`BoardEditor.tsx`'s internal
  use of `elementFromPoint`) — not a line of harness driver code at all.
  `trustedClick` itself, a few lines below the comment, checked only
  whether the selector matched anything, never whether the computed centre
  was still hittable.
- **`fx5.mjs`** — same shape as `cd4.mjs`: a comment about the product's
  own retargeting fix. The two Shape A sites actually flagged in this file
  (S4 board-box press, S5 pin-grab drag start) are unrelated dispatch sites
  entirely, fixed at §3/§5 with `assertHittable`.
- **`fx7.mjs`** — the reference sits inside a CHECK'S OWN NAME STRING
  (`'S5 ROOT-CAUSED: ... fixed via document.elementFromPoint in the
  onDoubleClick handler ...'`), describing what the PRODUCT code now does,
  not what the harness driver checks before dispatching. `clickAt` and
  three drag-start sites in this same file were completely bare (§3, §5).

**The count that matters is not 7 vs. 8 — it's 5 of 8 (bg1, bg2, cd4, fx5,
fx7) that read as "verified" on a bare grep and were not, plus a 6th shape
(`pw1`) that WAS a genuine instrument and still missed two of its own
sites.** Only 2 of the 8 (`pw2`, `vw1`) turn out to have been fully real
with no gap. A file referencing `elementFromPoint` was the more dangerous
signal exactly as Fable named it — it reads as already-safe, and five of
eight times here, it wasn't.

**`item121.mjs` and `item126.mjs` were not part of this 8-file audit** —
they are HELD, not touched, not verified either way. §6 stands unchanged:
chat 1 carries the INK/FIX routing notice; nothing in either file converts
until it clears.

---

## §15 · WHAT THIS OFFER DOES NOT DO

It does not run the 91-file pair, does not merge, does not deploy. The
branch is pushed; the pair's grant and its verification are chat 1's act,
same as every offer in this arc.
