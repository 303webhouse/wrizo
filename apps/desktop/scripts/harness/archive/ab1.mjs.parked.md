# Parked records archived from ab1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/ab1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from ab1.mjs lines 105-109 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c1fecb5891844bf9685df6d28ff17b1ea609a048

```js
  // ---- PARKED - SUPERSEDED by hide-workshop (Nick, Oct 23 11:01 am: the Workshop tab is HIDDEN in every theme until it is built).
  // Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  // ok('S2: the mode strip reads exactly Free Write / Draft / Revise / Workshop / Publish',
  //   JSON.stringify(stripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']),
  //   JSON.stringify(stripLabels));
```

## Record 2 · from ab1.mjs lines 252-256 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c1fecb5891844bf9685df6d28ff17b1ea609a048

```js
  // ---- PARKED - SUPERSEDED by hide-workshop (Oct 23): Workshop is hidden on every surface, the script's strip included.
  // Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  // ok('S6/finding-5: the mode strip is present on the script surface too, same five strings',
  //   JSON.stringify(scriptStripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']),
  //   JSON.stringify(scriptStripLabels));
```

## Record 3 · from ab1.mjs lines 264-266 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c1fecb5891844bf9685df6d28ff17b1ea609a048

```js
  // ---- PARKED - SUPERSEDED by hide-workshop (Oct 23): Workshop no longer renders, so it can no longer be deferred. Kept VERBATIM, not run;
  // parked record in the HARNESS_PARKED block, successor follows.
  // ok('Script: Free Write/Revise/Workshop are deferred (not silently live)', JSON.stringify(scriptDeferred) === JSON.stringify(['Free Write', 'Revise', 'Workshop']), JSON.stringify(scriptDeferred));
```

## Record 4 · from ab1.mjs lines 767-773 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- RE-PARKED by page-size's park audit (Oct 24): this record's probe read .mode-pagecol, and its live successor (cd2.mjs S1/S5) is itself
    // parked - the column is no longer the paper (the page is painted by a transform inside it; in the Typewriter zoom the column is stage-wide,
    // under the strip that always stood over the stage's edge). The record, VERBATIM, no longer runs; its successor record reads the painted page.
    //
    // pok('PARKED (was "PAGE IS PRIMARY at the gate floor (1100px): the page column never overlaps the tool-rail", reading .desk-frame-toolrail) — CD2 S1/S5: the SAME non-overlap claim, .desk-frame-strip now, same truth',
    //   gateFloorRectsNow.pagecol.left >= stripRightNow, JSON.stringify({ ...gateFloorRectsNow, stripRightNow }));
    // ------------------------------------------------------------------
```
