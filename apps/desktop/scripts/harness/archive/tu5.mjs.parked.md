# Parked records archived from tu5.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/tu5.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from tu5.mjs lines 475-481 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23): .mode-pagecol is no longer the paper - the prose page is PAINTED by a transform inside
    // it, and in the Typewriter zoom the column is the whole stage (lane 3: grip 981 / 1110 / 1596 against 1067 / 1242 / 1960). Successor reads the painted
    // page, with the anchor's documented overflow where the zoom leaves under 160px of margin. Kept VERBATIM and no longer run; records in the parked section.
    //
    // ok(`Geometry @${width}px: grip-flush against the paper's right edge (with a seeded Bible present)`,
    //   Math.abs(gripClosed.left - paperClosed.right) < 1.5, JSON.stringify({ gripLeft: gripClosed.left, paperRight: paperClosed.right }));
    // ------------------------------------------------------------------
```
