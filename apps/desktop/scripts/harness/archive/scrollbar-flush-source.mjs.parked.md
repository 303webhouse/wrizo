# Parked records archived from scrollbar-flush-source.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/scrollbar-flush-source.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from scrollbar-flush-source.mjs lines 131-133 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8df3c60bd3a6cf1f69b80dc33eaf90174c293ef2

```js
// PARKED (#13 step 4b): this check's SQUARE half is law 3, retired by Nick, Nov 1. Kept VERBATIM below, never run; the live successor follows and keeps the rest (the paper-toned thumb, the clear track).
// ok('T5 [successor]: the thumb is a SQUARE (border-radius 0) in the paper-toned --ink-on-paper-low, the track clear',
//   !!thumbRule && /background:\s*var\(--ink-on-paper-low\)/.test(thumbRule[1]) && /border-radius:\s*0/.test(thumbRule[1]) && exceptionRules.some(([s, b]) => s === EXC + '::-webkit-scrollbar-track' && /background:\s*transparent/.test(b)), JSON.stringify(thumbRule));
```
