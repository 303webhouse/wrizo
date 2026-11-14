# Parked records archived from rhizome-latency.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/rhizome-latency.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from rhizome-latency.mjs lines 317-320 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 635be6c34b74f9b0a77b358f7136d4815ffaa63f

```js
    // PARKED - SUPERSEDED by the reference-shift check (Fable, Nov 6; coarse-C stabilising). The line(s) that stood, verbatim (the successor is the line below this block):
//     ok(`C2 main-thread time per key inside the fade: the median is within ${COST_MEDIAN_SLACK} ms of the fast control's`,
//       costSt.fade.n >= MIN_KEYS && costSt.fast.n >= MIN_KEYS && costSt.fade.median <= costSt.fast.median + COST_MEDIAN_SLACK, `control ${show(costSt.fast)} | fade ${show(costSt.fade)}`);
//     ok('C typing inside the fade is as fast as at rest at the same pace (same budgets, against the fast control)', fadeSt.n >= MIN_KEYS && fastSt.n >= MIN_KEYS && fadeSt.median <= fastSt.median + MEDIAN_SLACK && fadeSt.p95 <= fastSt.p95 + P95_SLACK && fadeSt.max <= MAX_MS, `rest ${show(fastSt)} | fade ${show(fadeSt)}`);
```
