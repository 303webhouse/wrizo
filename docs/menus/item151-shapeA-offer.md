# ITEM 151 · SHAPE A — BUILT AT THE HELPERS, NOT THE 83
### tools lane · branch `item151-silent-acts` · worktree `.claude/item151-silent-acts`
### built `2afc8e0` · merged `origin/main @ 4a42bce` → `fb97181` · 2026-09-18

**BUILT AND COMMITTED. NOT LAUNCHED.** The grant this work ran under
(`tools-item151-build-20260918`) was issued for the search that found Shape
A; the ledger's own ruling ("no new grant needed... TOOLS proceeds under
it") covers the build itself, but no suite has been run against this tree —
`tsc --noEmit` and `build:web` are re-verified clean post-merge (below);
neither is the suite. This offer stops short of a launch.

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

**No file in this build turned out to be verified in name only** — every
helper that referenced `elementFromPoint`/`getBoundingClientRect` anywhere
in the file was traced to confirm it actually gated the dispatch, not just
sat near one. That check is what caught `vw1.mjs`'s weaker fraction set
(§2) rather than accepting "it already hit-tests" at face value.

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

**No suite has been run.** `tsc`/`build:web`/syntax checks are pre-flight
reads, not a launch; launching needs its own turn.

---

## §10 · WHAT THIS OFFER DOES NOT DO

It does not launch the suite, does not merge, does not deploy. The branch
is pushed; the merge is chat 1's act, same as every offer in this arc.
