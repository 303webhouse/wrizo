# Parked records archived from rhizome-growth.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/rhizome-growth.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from rhizome-growth.mjs lines 290-297 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in eb7b114e7c6472cfc96a627c2a476868b97f129c

```js
// ---- PARKED - SUPERSEDED by the flash fade (Nick, 2026-10-10: "a bit brighter and fade back out slower"). Kept VERBATIM and no
// longer run: data-flash now carries a third state, 'fading', between the hold and the clear. Its record is in the HARNESS_PARKED
// block at the foot; the successor follows.
//
// ok('R5: FLASH_MS is 1200 and the field holds data-flash',
//   /const FLASH_MS = 1200/.test(fieldSrc) && fieldSrc.includes("data-flash={flashLap != null ? 'true' : 'false'}"),
//   'flash');
// ------------------------------------------------------------------
```
