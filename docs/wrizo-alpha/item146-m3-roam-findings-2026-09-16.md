# ITEM 146 — `m3`'s ROAMS CHECK · FINDINGS, THE FORK, AND OPTION C

**Lane:** errata · **Branch:** `item146-rhizome-seed` (pushed)
**Standing:** **OFFERED, NOT MERGED — pair owed.** §1–§5 are the findings as they
were handed up, and §4 is the fork. **Option C was ruled and is built (§6).**
§2 and §3 carry an in-place correction from §6's wider sweep.

---

## §1 · THE MECHANISM, EXACTLY

```ts
// src/components/RhizomeField.tsx
const SESSION_START = Date.now();              // frozen at MODULE LOAD
…
rngRef.current = mulberry32(hashSeed(`${seedKey}:${SESSION_START}`));
```

`seedKey` is `entry.id`, and `m3`'s fixture page gets a **generated** id. So **two**
inputs vary on every run: the page id and the clock. The live check then asserts
an absolute geometric property on **one sample**:

```js
ok('Live: the saturated live ground ROAMS — its rendered extent reaches near all four stage margins',
  … g.minY < 0.25 * g.stageH …)
```

The recorded failure: `minY` **248** of a **733**px stage, i.e. **t = 0.338**,
against a bound of 0.25.

The harness has **no hook to run script before the page's own**
(`runtime-verify.mjs` has no `addScriptToEvaluateOnNewDocument`), so a value frozen
at module load can't be set from outside first.

---

## §2 · THE MEASUREMENT — THE REAL ENGINE, MANY SEEDS

`rhizomeEngine.ts` has **no imports**, so it was transpiled unchanged (esbuild)
and run in Node with `target = saturationTarget(2500)`, the value `m3` uses. The
**live component uses one RNG for both origins and growth**; `m3`'s S2 uses two.
Both shapes were run:

| geometry | bounds | RNG shape | seeds | **fail** | margin |
|---|---|---|---|---|---|
| S2 (1600×1000) | S2 (`l<.15 r>.85 t<.20 b>.85`) | S2 two-seed | 2,000 | **1.50%** | **top 30**, others **0** |
| S2 | S2 | live one-RNG | 2,000 | **1.15%** | **top 23**, others **0** |
| S2 | live (`l<.20 r>.80 t<.25 b>.80`) | live one-RNG | 2,000 | **0.50%** | **top 10**, others **0** |
| S2 | live | live one-RNG | **10,000** | **0.44%** | **top 44**, others **0** |

Distribution of the top extent (`t = minY / height`) over 10,000 seeds:
**median 0.006 · p90 0.070 · p99 0.207 · max 0.417.**

### What this establishes

1. **On this geometry,** roaming reached the left, right and bottom margins in
   all 16,000 grounds, and **every failure was the top.**
   *(Corrected after §6's wider sweep: this is a fact about S2's geometry,
   **not** a guarantee for every layout. With a wide paper, the right margin was
   missed too.)*
2. **There's a structural reason.** Origin #1 is placed at the **paper's bottom
   centre** (S2 asserts it), so growth has to travel up and around the paper to
   reach the top margin, the farthest side.
3. **The live geometry's tail is heavier than S2's.** The observed live failure
   (t = 0.338) lies beyond the S2-geometry maximum at 2,000 seeds (0.314),
   although within it at 10,000 (0.417). Exact live-layout rates need the box.
4. **S2's own "FULL-GROUND extent" check proves the property for one typical
   seed**, not for every seed. It never flakes because its seed is fixed, but the
   claim it names is general and the evidence is a single sample.
5. **The live check's flake is by construction**: a fresh seed each run, and a
   property that fails for a fraction of seeds. Its pass/fail/pass/pass record on
   one byte-identical bundle is exactly what this distribution predicts.

---

## §3 · THE PRODUCT FINDING — WIDER, THEREFORE SURFACED AND NOT TOUCHED

**On the order of 0.4–1.5% of pages grow a ground that doesn't reach the top of
the stage** (depending on bounds and layout), **and on a layout with a wide paper
a side margin can be missed too** (§6). Whether that's acceptable, and
whether "roams the whole ground" was meant as a guarantee or a tendency, is a
**product** question about `seedOrigins`/`growTo`. Changing either is wider than
a thin seam, so this lane **stops** here and surfaces it. The Rhizome desk that
would have owned it is retired, so it needs an owner.

---

## §4 · THE FORK

**B. Pin the seed.** `RhizomeField` reads a pinned value at module load
(`SESSION_START = pinned ?? Date.now()`), since a value frozen at load can only be
pinned by something that survives the fixture's reloads, i.e. storage. The
fixture also creates its page with a fixed id. The live ROAMS assertion is
**unchanged** and becomes deterministic.
- *For:* no assertion changes.
- *Against:* **there is no precedent in `src/` for product code honouring a
  harness-only key**; it would be a new pattern. It also makes the live check
  test one chosen seed forever, which proves less than the check's wording
  claims.

**C. A read-only seam, and a render-fidelity successor.** Expose `SESSION_START`
**read-only** (the house's inspection-seam pattern; it changes no behaviour even
when used). Park the live ROAMS check verbatim, with this document's evidence as
the reason. Its successor asserts what the live check is actually positioned to
prove: that **the rendered extent equals the engine's extent for the same seed
and geometry**, computed in-page through `__wrizoRhizomeEngine`. That holds for
**any** seed, so it can't flake. The roaming property itself stays with the
algorithm, and S2 could honestly be strengthened to sweep many seeds: strict on
three margins, and stated as a rate on the top.
- *For:* strictly no behaviour change; a check that cannot flake; each check
  proves exactly one thing.
- *Against:* parks a live assertion, which changes what `m3` claims at the live
  level.

**Lean: C.** The measurement shows the live check was asserting a guarantee the
product doesn't make. Pinning one seed would keep that claim's wording while
quietly narrowing what it proves. Render fidelity is the true job of a live check
over a probabilistic algorithm.

**Either way, a merge-order note:** any new `window` seam here (C's read-only
one) must be classified in item 148's table once 148 lands. It would be
`read-only`.

---

## §5 · REPRODUCING THIS

```
esbuild apps/desktop/src/store/rhizomeEngine.ts --format=esm --platform=node --outfile=rhizomeEngine.mjs
node roamsweep.mjs rhizomeEngine.mjs 10000
```

`roamsweep.mjs` grows `N` grounds per shape and reports the fail rate by margin
and the top-extent quantiles. It's kept in the lane's scratchpad, not the roster;
under C it would become S2's multi-seed successor.

---

## §6 · OPTION C, RULED AND BUILT — `item146-rhizome-seed` @ `d9e49c2`

**Standing:** **OFFERED, NOT MERGED — pair owed.** Option B was refused.
`seedOrigins` and `growTo` are **untouched**. Whether roaming is a guarantee or a
tendency is **Nick's** question, and nothing here is built for either answer.

### A wider sweep, and a correction to §2

Before the park was written, the three-margin claim was checked on **live-like
layouts**, because a park that could miss on some seed would be a new flake.
Sixteen layouts were swept at the recorded live stage size (1203×733), varying the
paper's width and vertical position, at 2,000 seeds each:

- **8 layouts put the paper flush with the stage bottom and failed on everything,
  100%.** That's an artefact of the synthetic geometry: origin #1 sits on the
  paper's bottom edge, so a flush paper puts it on the stage edge. The real
  render reached `maxY` 729.9 of 733 with a full segment count, so it isn't
  flush, and these layouts were discarded.
- **The 8 realistic layouts, 16,000 grounds:** the top was missed **28** times
  (worst layout 0.45%), and **with a wide paper (60% of the stage) the RIGHT
  margin was missed 3 times** in those layouts' 4,000 grounds.

**So §2's "left, right and bottom are always reached" was a fact about S2's
geometry, not a guarantee.** §2 and §3 are corrected in place.

### What was built

| where | change |
|---|---|
| `RhizomeField.tsx` | a **read-only** `__wrizoRhizomeField` seam (the `wrizoBoard` convention): returns **copies** of the last build's session start, seed key, built geometry and high-water; attached on mount, removed on unmount; no behaviour change, whether used or not |
| `m3` live | the ROAMS check **parked verbatim**; its successor asserts **fidelity**: same count, every segment, same extent, for this seed at this geometry |
| `m3` S2 | extended to **400 fixed seeds**: strict zero on three margins **for this ground**, and the top as a **stated rate** (≤ 2%; measured 5/400) |
| `m3` park | re-runs the experiment and asserts **fidelity**; the four margins are **recorded, not asserted** |

**Why the seam exposes the *built* geometry.** A rebuild only happens on a change
of more than 1px, and the origins depend continuously on geometry. A re-measure
could therefore grow a different ground.

**Why one recompute is exact.** The page opens with its words already in the
store (`PageEditor` reads the entry synchronously), so the first build is already
at the full target. Every rebuild is one `growTo` call at that target, and later
calls at an unchanged target draw nothing. The alternative isn't safe: growth is
**path-dependent** (600 of 900 step paths differed from the one-call ground), so a
ground grown forward in steps could not be recomputed this way.

> **RATIFIED DESIGN POINT (2026-09-16) — do not "simplify" the seam into a
> re-measure.** The check stands on two separate facts, and removing either
> breaks it:
> 1. **The seam returns the BUILT geometry**, not a fresh measurement. Origins
>    depend continuously on geometry, and the component only rebuilds on a change
>    of more than 1px. A re-measure inside that band scatters different origins
>    and grows a different ground from the one on screen.
> 2. **The recompute is a single `growTo`**, and that is only sound because the
>    rendered ground came from one build. Growth is **path-dependent** (600 of 900
>    step paths differed from the one-call ground), so a ground grown forward in
>    steps could not be recomputed this way. The fixture guarantees one build
>    because `PageEditor` reads the entry synchronously.
>
> Replace the built geometry with a measurement, or let the fixture grow the
> ground in steps, and the fidelity check starts failing for reasons that have
> nothing to do with the render.

**Why it waits first.** The seam updates synchronously and the DOM on React's
next commit. So the check waits for them to agree, then reads both in one
evaluation. **The fidelity recompute is one module-level definition** shared by
the successor and the park, so the two cannot drift.

### Proof so far — browserless

- **Dry run** of the in-page code, outside the browser, against the real engine:
  a faithful render matches (570/570); one coordinate moved is caught at its
  index; a dropped segment is caught; a missing seam reports; the sweep
  reproduces the measured five top misses exactly.
- `seed-guard` 36/36, `item141` 11/11 (the new reads sit behind settles),
  hooks-order 2/2 and 7/7, `tsc` clean, 88/88 files parse.
- `m3` parks **3** (two existing + this one).

**Not yet proven — the live wiring:** the seam's real values and the real render
timing. That is the pair's job.

### The pair, and what it must show

- **Default leg:** `m3`'s fidelity successor green, and the S2 sweep reporting
  5/400.
- **Parked leg:** `M3 PARKED: PASS (3 checks)`, the ROAMS park among them, with
  its recorded margins in the detail.

### Merge note

`__wrizoRhizomeField` is a **new seam**. Once item 148 lands, it owes an entry in
148's table: `{ kind: 'read-only' }`. Chat 1 sequences it with the
`wrizoCopyCardToBoard` entry, under the same rule: whichever lands second adds the
line.
