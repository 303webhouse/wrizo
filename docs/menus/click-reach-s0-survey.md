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
