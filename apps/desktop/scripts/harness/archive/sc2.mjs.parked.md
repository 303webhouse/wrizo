# Parked records archived from sc2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/sc2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from sc2.mjs lines 509-525 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 9073019add7686fbf56b8bfb0e52393c362243c9

```js
  // SUPERSEDED by SC2 S2b (2026-07-25) — A4 park cycle, travelling in the SAME
  // commit as the change that falsified it. The ORIGINAL, verbatim:
  //
  //   ok('S0 fixture: the sheet is still SC1\'s true page — one 51em x 66em
  //   sheet at 12pt (SC2 has not yet paginated; this is the pre-SC2 state the
  //   bound is measured against)',
  //     Math.abs(big.geo.fontPx - EM) < 0.01, JSON.stringify({ fontPx:
  //     big.geo.fontPx, expected: EM }));
  //
  // SUPERSEDED ON ITS SUBJECT, NOT ITS NUMBER. Its condition (12pt type) is
  // untouched and still holds; what retired is the state the check exists to
  // pin — "ONE sheet", "SC2 HAS NOT YET PAGINATED". S2b paginates, so that
  // sentence cannot be re-asserted by anyone, and a check that reads as a claim
  // about the pre-SC2 world would be a false label on a true condition. Parked
  // verbatim in this file's own PARKED section. The successor below asserts
  // MORE than it did: the 12pt metric it held, now on EVERY sheet, plus the
  // uniformity a sequence makes assertable and a single sheet could not.
```
