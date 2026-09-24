# PW's FINDING · S0 — WHEN A POINTER'S REACH IS THE CLAIM
### tools lane · worktree `.claude/clickreach` · branch `click-reach`
### off `origin/main` @ `c6cb04d` · 2026-09-22 · NO BEHAVIOUR CHANGE
### item number **PROPOSED 195** (194 is proposed by the splash; chat 1 assigns both)

PW's finding: *harness `.click()` calls on controls where a pointer's reach is
the claim, which skip hit-testing the way item 130's did.* Censused. **The
defect has three strata and one sharp slice cutting across them**, and the
sharpest instance is not a `.click()` at all.

---

## §0 · THE NUMBER IS NOT THE POPULATION — SAID FIRST, BECAUSE I JUST GOT THIS WRONG

`.click()` occurs **630 times across 70 harness files**. **That is a candidate
list, not a finding.** Most are FIXTURES — press a mode tab to reach a surface
so a later check can read it — and a fixture that bypasses hit-testing is a
weaker instrument, not a false claim. **The offender is where the CHECK'S OWN
CLAIM is about the pointer getting there**, which is PW's phrasing exactly and
is a per-site judgment, not a syntax.

> **A COUNT OF A SYNTACTIC SHAPE IS A LIST OF CANDIDATES — THE POPULATION IS
> WHAT SURVIVES READING EACH ONE.**

**This survey holds itself to that**, including against its own tool: the
reach-claim census (§3) returns **130** candidates and I am reporting **2**
confirmed, because I read them and 128 use a reach word in another sense.

---

## §1 · STRATUM 1 — ONE HELPER, 129 CALL SITES

**`app.click(label)` is used 129 times across 53 files. Every one of them
routes through a single page helper** — `__click` in `runtime-verify.mjs`:

```js
window.__click = (label) => {
  const els = [...document.querySelectorAll('button, a, [role=button]')];
  const el = els.find(x => x.textContent.trim() === label) || els.find(x => x.textContent.includes(label));
  if (!el) throw new Error('clickable not found: ' + label + ' …');
  el.click();
  return true;
};
```

**It already carries item 151's fix** — absent means a named throw, never a
silent no-op. **What it does not do is hit-test.** `HTMLElement.click()`
dispatches a synthetic event straight at the node: no coordinates, no
compositing, `isTrusted:false`. **A control that is present and completely
covered still reports success.**

**THE LEVERAGE IS THE HELPER, NOT THE 129** — the same shape as item 151's
Shape A, and the instrument to fix it **already exists on main**:
`scripts/trusted-point.mjs` (`trustedDispatch`, `hittablePointBy`), landed by
item 151 and proven by `tp1.mjs`.

**And unlike item 154, this needs no exemption table.** Converting `__click`
to a hit-tested dispatch cannot break a fixture that presses a genuinely
reachable control — it changes behaviour *only* when the control is
unreachable, and in that case the fixture was already reporting a success no
user could have had. *(One exemption class to check for at build: a check that
deliberately presses something covered, to assert the press does NOT land.
Searched; none found so far.)*

---

## §2 · STRATUM 2 — 630 IN-STRING `.click()` CALLS, A CANDIDATE LIST

Inside `evalJs` strings. Needs the per-site read described in §0: the claim
decides, not the call. **Not enumerated as offenders here, on purpose.**

---

## §3 · STRATUM 3 — THE CLAIM SAYS "REACHABLE", THE INSTRUMENT SAYS "PRESENT"

**The sharpest stratum, and not a `.click()` at all.** New committed tool
`scripts/reach-claims.mjs` reads every `ok(...)`/`pok(...)` whose **claim text**
contains a reach word, resolves its verdict expression (one level of same-file
indirection, the item 154 method, refusing ambiguous names), and reports **what
the claim is actually proven by**:

```
checks claiming reach:        130
  proven by a HIT-TEST:         0      <- the claim and the instrument agree
  proven by EXISTENCE:          3      <- claims reach, tests presence
  proven by a SYNTHETIC click:  0
  other / unresolved:         127      <- needs a human read, not a verdict
```

**Read, not reported raw.** Of the 3 EXISTENCE hits, **2 are genuine** and one
(`bg1.mjs:221`) is not — its claim is that a press *opened* something, proven
by the result existing, which is a fair instrument for a fair claim. Of the
127 "other", the ones I sampled use the word in a different sense
("pointer-edge dwell", "no prompt reachable" as an absence, "reachable, never
prominent" describing prominence, parked drivers pinned to `false`). **The
regex over-matches; that is why the tool prints candidates and this survey
prints 2.**

**The two:**

| site | the claim | the proof |
|---|---|---|
| `e3.mjs:76` | *"the Counsel grip is **reachable** on a born page"* | `!!document.querySelector('.wz-tutor-grip')` |
| `item133.mjs:198` | *"the page's displayed name is **reachable** — the inert `<div>` the sitting found is now a gesture"* | `!!document.querySelector('.wz-pageface-title-reach')` |

**An element can exist and be entirely covered.** That is not hypothetical
here — it is precisely what item 130 found: **54% of the strip unreachable
while fully present in the DOM.**

---

## §4 · THE FLAGSHIP — FIVE LINES OF `item133.mjs`, AND ITS OWN TEXT INDICTS IT

```js
await app.evalJs("document.querySelector('.wz-strip-item[data-category=page]')?.click()");
await sleep(600);
const reachable = await app.evalJs("!!document.querySelector('.wz-pageface-title-reach')");
ok("S4: the page's displayed name is reachable — the inert <div> the sitting found is now a gesture",
  reachable, String(reachable));
```

**Three defects stacked:**

1. **It presses `.wz-strip-item` — item 130's OWN control** — with a synthetic
   click, i.e. with the exact instrument that could not see item 130.
2. **`?.click()` is silent if absent** (item 154's population; that branch is
   built but not yet merged, so it is still live on main).
3. **The claim is "reachable"; the proof is that a node exists.**

**And the check's own words say why it exists: a sitting found an INERT
`<div>` — something present but unusable. The check written to catch
"present but not usable" tests presence.**

---

## §5 · THE SHARP SLICE — 32 SITES ON THE ONE CONTROL WITH A HISTORY

**`.wz-strip-item` is pressed by a synthetic `.click()` at 32 sites across 17
files** (`ab3`, `b1`×5, `b2-1`×2, `b2`×5, `cd1`×2, `cd2`, `fx1`×2, `fx14`,
`fx6`×2, `fx7`×4, `item104`, `item133`, `item87`, `item88`, `j6`×2, `pb1`).

**This is the control item 130 found unreachable**, and `index.css:2714`
states the hazard in the codebase's own voice:

> *"…the stage covered the strip's 38.4–84 band, and `elementFromPoint` at a
> strip item's own centre (x~42) returned `.desk-frame-stage` — roughly the
> right 54% of the strip was unreachable by a REAL pointer. **Every harness had
> reached these controls with `.click()`, which never consults the hit-testing
> stack, so nothing caught it** until pw1.mjs drove real pointer events."*

**The comment describes the past tense. The present tense is 32 sites.** Item
130's fix was a `z-index:1` on `.desk-frame-strip`; if that regressed, **all 32
would keep passing** — only `pw1.mjs`/`vw1.mjs`, which drive real pointers,
would go red. **The suite's guard against item 130 is two files, not 34.**

---

## §6 · WHAT I PROPOSE (NOT BUILT — THE ITEM IS QUEUED)

1. **Fix `__click` at the helper** — resolve the label, hit-test the point,
   dispatch real CDP events via the existing `trusted-point.mjs`. One function;
   129 call sites inherit it. *(`__click` runs page-side and cannot dispatch
   CDP events itself, so `app.click` moves outer-side — a real change to a
   load-bearing facade, and the reason this wants its own pair.)*
2. **The 32 strip sites** — convert to the trusted press already used by
   `pw1`/`vw1`, so item 130's guard is the whole suite rather than two files.
3. **Invert the durability check rather than enumerate it** (VW1 check 7's
   shape): *any check whose CLAIM contains a reachability word is an offender
   unless its verdict is proven by a hit-test* — named exemptions for the
   other senses of the word. Built as a check, a fourth spelling fails by
   construction instead of being found the hard way.
4. **Stratum 2's 630 stay a candidate list** until read per site.

---

## §7 · WHAT THIS COMMIT CHANGES

**No behaviour.** One new committed tool (`scripts/reach-claims.mjs`, static,
no browser) and this survey. **Nothing headful has run** — the box turn is
PW2's (`pw2-item176-corrected-20260922`), 0 harness browsers observed
throughout.

---

## §8 · MOVE ONE BUILT — THE REPORT-ONLY MODE (2026-09-24) · **BUILT, NOT RUN; needs ONE short box use**

Fable's ruling (2026-09-23, §6 step 1 made TWO MOVES): *first a report-only mode that records which of the 129 presses a person
could not have made; each one found is a fixture skipping a person's step or a real finding; only then make the helper fail.*
**"No exemption table" was my prediction; this run measures it.** Built on `click-reach` (main merged in; the branch carries only
this survey and the tools below — the ledger is chat 1's).

**What it is.** `HARNESS_REACH_REPORT=<file>` turns it on; unset, `app.click` is what it was. When on, `app.click(label)` runs ONE
read-only probe **before** the press and appends a JSON line; **the press is still `el.click()`, so no verdict can move** (the
probe's failures are swallowed — the instrument never changes a check). The page-side sampler asks `elementFromPoint` at the same
5×5 fractions `trusted-point.mjs` scans, over the part of the control inside the viewport, **without scrolling, focusing or
writing**, and returns raw counts. **The verdict is decided in Node** (`scripts/reach-classify.mjs`, pure): `reachable` ·
`partial` (with `centerHit` — a person aims at the centre) · `covered` (item 130's defect, naming the coverer) · `offscreen` (a
person would scroll first — the likeliest fixture-skips-a-step bucket) · `not-rendered` · `disabled`; flags for
`pointer-events:none` and a control partly below the fold.

**`__click` was refactored** into `__clickTarget` (the same exact-then-substring resolution and the same thrown message) + the same
`el.click()` so the probe and the press resolve the SAME element.

**Proved without the box (`node scripts/reach-classify-proof.mjs` — 21 checks):**
- **A** — the refactor changed nothing: the page helpers are read from `origin/main` (git, not re-typed) and the current file,
  run against the same fake document; same return, same element pressed, same thrown message, on an exact label, a
  substring-only label and an absent one.
- **B** — the sampler, on synthetic geometry: a clear control 25/25; covered 0/25 naming its coverer; covered on the left half only
  (partial, centre reaches / centre misses — the two differ); wholly off-screen takes **no** samples; half below the fold is
  sampled over its visible part and flagged; zero-size / hidden / disabled; **read-only** (its only calls are 25 `elementFromPoint`).
- **C** — the classifier case by case, then **falsified: six mutants, each asserted to have landed, each must go red.** The first
  run had two **green** mutants — one was *semantically equivalent* (`!hits && !total` ≡ `!total`, so not a mutant at all) and one
  exposed a **missing case** (a lone hit is partial, not covered). Both fixed; 6/6 red.

**`scripts/reach-report.mjs <file>`** reads a run and prints: presses, **the coverage number beside the count** (the 129-site static
census against the files that actually produced a press — **every file with sites and no press is listed UNCOVERED**, because a run
that never reached them says nothing about them), the counts by verdict, **the list of presses a person could not have made**
(one line each, by file — read each, do not batch), and any press seen under two verdicts (a state-dependent reach). Stratum 2
(630 in-string `.click()`) is **not** measured here and stays a candidate list.

**THE ONE SHORT BOX USE — for chat 1 to grant.** Verdicts cannot move, so the run is an ordinary default leg with one env var.
**Write the report OUTSIDE the tree** (a file inside it marks the stamped run `+dirty`): 
`HARNESS_REACH_REPORT=%USERPROFILE%\Downloadseach-report.jsonl` then `node apps\desktop\scriptsun-suite.mjs` (default leg only; no cap,
no `timeout` wrapper), then `node apps\desktop\scriptseach-report.mjs %USERPROFILE%\Downloadseach-report.jsonl`. **What the box adds:** the only
thing not provable here — that `elementFromPoint` answers in a real page as the fake did. **Two-move law, unchanged:** this
lands as an instrument that reports; **the helper does not fail** until each found press is a fixture fixed or a finding, and
that step **changes the instrument under every lane's stamps, so chat 1 lands it at a batch boundary.** *(Fable's refined
merge rule: a change that can only turn a false red green merges between pairs — this can turn neither, but it does change
`runtime-verify.mjs`, so it should not ride into the middle of a stamping pair either.)*

