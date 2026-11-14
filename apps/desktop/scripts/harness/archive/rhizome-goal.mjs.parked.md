# Parked records archived from rhizome-goal.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/rhizome-goal.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from rhizome-goal.mjs lines 173-188 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R1. The field no longer imports
  // rhizomeEngine, so window.__wrizoRhizomeEngine is not mounted. Coverage is
  // cells, not an 800-segment cap; segmentsFor(f) is the successor.
  // const pure = await app.evalJs(`(() => {
  //   const E = window.__wrizoRhizomeEngine;
  //   if (!E || !E.goalFillTarget) return { missing: true };
  //   const full = E.goalFillTarget(1);
  //   const half = E.goalFillTarget(0.5);
  //   const tenth = E.goalFillTarget(0.1);
  //   const zero = E.goalFillTarget(0);
  //   return { full, half, tenth, zero, cap: E.FILL_SEGMENTS, halfOf: full / 2, tenthOf: full / 10 };
  // })()`);
  // ok('Engine: goalFillTarget is on the seam', !pure.missing, JSON.stringify(pure));
  // ok('Engine: fraction 0 grows nothing and fraction 1 is the fill cap', pure.zero === 0 && pure.full === pure.cap && pure.cap === 800, JSON.stringify(pure));
  // ok('Engine: a 100-word goal at 100 words is a full ground, and the same 100 words of a 1000-word goal is a tenth',
  //   pure.half === pure.full / 2 && pure.tenth === pure.full / 10, JSON.stringify(pure));
```

## Record 2 · from rhizome-goal.mjs lines 192-196 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R1. segmentsFor(0) is the starting
  // stroke (firstCount), not zero — the first stem (or the survivor) is always
  // there.
  // ok('Live: an empty page mounts the field with zero segments, editor still mounted, pointer-events none',
  //   empty.mounted && empty.editor && empty.segments === 0 && empty.pointer === 'none', JSON.stringify(empty));
```

## Record 3 · from rhizome-goal.mjs lines 201-204 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R1. "A tenth of the fill" was an
  // 800-segment cap. Coverage, not segment count, tracks the goal.
  // ok('Live: 99 of a 1000-word goal is a sparse ground (about a tenth of the fill)',
  //   slow.editor && slow.segments > 0 && slow.segments < pure.full * 0.25, JSON.stringify(slow));
```

## Record 4 · from rhizome-goal.mjs lines 212-215 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R1. Density is coverage of visible
  // cells, not an 800-segment fill cap.
  // ok('Live: the same 99 words fill the ground when the goal is 100 (much denser than the 1000-word goal)',
  //   fast.segments > slow.segments * 4 && fast.segments >= pure.full * 0.9, JSON.stringify({ slow: slow.segments, fast: fast.segments, full: pure.full }));
```

## Record 5 · from rhizome-goal.mjs lines 218-235 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R2/R4. Settled roots are two <path>s,
  // so this probe's x1/y1 walk no longer sees endpoints. Connectivity and both
  // margins are R2/R4 against the plan.
  // SUPERSEDED 2026-10-08. Endpoints may lie under the sheet: growth tunnels,
  // and the paint clip is what hides that stretch. Both margins must still
  // hold endpoints, or the network never crossed.
  // ok('Live: the paint clip is on, both margins hold endpoints, and every segment shares an endpoint',
  //   fast.shares === true && fast.segments > 1 && fast.leftOut > 0 && fast.rightOut > 0 && String(fast.clip).includes('evenodd'),
  //   JSON.stringify({ shares: fast.shares, leftOut: fast.leftOut, rightOut: fast.rightOut, clip: fast.clip, segments: fast.segments, paperHit: fast.paperHit }));
  // PARKED 2026-10-08, rhizome-growth.mjs R3. pathLength=1 lives on the growing
  // <line class="wz-rhizome-new">, not on the settled path this probe samples.
  // ok('Live: a new segment draws on along its length (250–400ms, pathLength 1)',
  //   fast.drawName === 'wz-rhizome-draw' && fast.drawMs >= 250 && fast.drawMs <= 400 && fast.pathLength === '1',
  //   JSON.stringify({ drawName: fast.drawName, drawMs: fast.drawMs, pathLength: fast.pathLength }));
  // PARKED 2026-10-08, rhizome-growth.mjs R3. Hairlines are 0.4px / .45; stems
  // 0.8px / .75. The 0.2 / .32 and 0.65 caps described the previous engine.
  // ok('Live: most roots are a fine hairline and a few are thicker',
  //   fast.thinW != null && fast.thinW < 0.35 && fast.thickW != null && fast.thickW > 0.5 && fast.thickW < 0.9, JSON.stringify(fast));
```

## Record 6 · from rhizome-goal.mjs lines 252-255 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R1/R5. "Full" is no longer 0.9 of
  // 800 segments; the flash still holds the finished lap (R5).
  // ok('Live: hitting the goal flashes the network and the ground is full',
  //   flashing.flash === 'true' && flashing.segments >= pure.full * 0.9 && flashing.editor, JSON.stringify(flashing));
```

## Record 7 · from rhizome-goal.mjs lines 279-283 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R5. The survivor is SURVIVOR_STEPS
  // consecutive thick visible segments (~100px), not one DOM <line>.
  // ok('Live: after the flash exactly one thick stem survives, and the clip does not hide it',
  //   reset.flash === 'false' && reset.segments === 1 && reset.thickCount === 1 && reset.thickW > 0.5 && reset.thickW < 0.9 && reset.painted === 1 && reset.editor,
  //   JSON.stringify(reset));
```

## Record 8 · from rhizome-goal.mjs lines 288-291 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f741bdb954f2d32660fe1a205d1a372478caa005

```js
  // PARKED 2026-10-08, rhizome-growth.mjs R2/R5. shares is computed from <line>
  // x1/y1; settled roots are paths. Next-lap-from-survivor is R2/R5.
  // ok('Live: the next lap grows from that thick stem and stays one network',
  //   lap2.segments > 1 && lap2.shares === true && lap2.thickCount >= 1 && lap2.flash === 'false', JSON.stringify(lap2));
```
