# Parked records archived from fit-icon.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fit-icon.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fit-icon.mjs lines 110-111 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8df3c60bd3a6cf1f69b80dc33eaf90174c293ef2

```js
    // PARKED (#13 step 4b): square and no shadow in EVERY skin is law 3, retired by Nick, Nov 1. Kept VERBATIM, never run; the successor keeps the 1 px edge everywhere and Machina's own square, flat look (theme-scoped, it stays).
    // ok(`I5 [${name}]: square, a flat 1 px edge, no shadow`, atRest.radius === '0px' && atRest.shadow === 'none' && parseFloat(atRest.bw) >= 1, JSON.stringify(atRest));
```
