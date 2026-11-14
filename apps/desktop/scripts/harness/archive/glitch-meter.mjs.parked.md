# Parked records archived from glitch-meter.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/glitch-meter.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from glitch-meter.mjs lines 337-342 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 9bf299c91d076d045a13c2b75711d7e8fbea0e0c

```js
  // ---- PARKED - SUPERSEDED (ledger 90; Fable's ruling, Oct 17: honour the global reduced-motion rule, index.css - under reduced motion every
  // transition is 0.01 ms, so the overlay APPEARS, with no easing; the run read {opacity: 0.42, transition: "1e-05s"}). Kept VERBATIM and no
  // longer run; successor below.
  // ok('G6: ...it shows the faint still overlay instead, its opacity following intensity (1 x 0.42 at peak), eased in, not cut',
  //   !!still && Math.abs(still.opacity - 0.42) < 0.03 && parseFloat(still.transition) >= 2, JSON.stringify(still));
  // ------------------------------------------------------------------
```
