# ITEM 146 — `m3`'s ROAMS CHECK · FINDINGS BEFORE A FIX

**Lane:** errata · **Branch:** `item146-rhizome-seed` · **Browserless.**
**Standing:** **NOT BUILT. A fork is handed up** (§4), under the ruling that the
seed is product code, the fix is a thin seam changing no behaviour, and anything
wider stops.

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

1. **Roaming is guaranteed on three margins and probabilistic on the fourth.**
   Across 16,000 grown grounds, left, right and bottom never failed. **Every
   failure was the top.**
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
the stage** (depending on bounds and layout). Whether that's acceptable, and
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
