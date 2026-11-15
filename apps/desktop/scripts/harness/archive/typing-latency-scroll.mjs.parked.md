# Parked records archived from typing-latency-scroll.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/typing-latency-scroll.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from typing-latency-scroll.mjs lines 62-66 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 92e55d84dd1dca8ef7e399ba0b3101c237b8ad72

```js
  // ---- PARKED - SUPERSEDED by Fable's ruling of Oct 16 (chat 1's ledger 67): content-visibility is REMOVED from the rows (it took the
  // off-screen rows' text out of innerText, and failed S1 and S5 below). Kept VERBATIM and no longer run; successor directly below.
  // ok('(premise) the 50k-word page opens in Draft as rows, with content-visibility on them', up && (await app.evalJs(`getComputedStyle(document.querySelector('${ED} .wz-row')).contentVisibility`)) === 'auto',
  //   String(up && await app.evalJs(`getComputedStyle(document.querySelector('${ED} .wz-row')).contentVisibility`)));
  // ------------------------------------------------------------------
```

## Record 2 · from typing-latency-scroll.mjs lines 85-89 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 347ed267345a66702a2b0017cf72f8542ef7cd67

```js
  // ---- PARKED - SUPERSEDED (chat 1's ledger 70): the native Ctrl+End scrolls the caret's line into view, NOT the scroller to its very bottom -
  // on main the scroller stops 276 px above it too (the page's own space below the text) - and the estimated space this guarded against left
  // with content-visibility. Kept VERBATIM, no longer run; successor below.
  // ok('S1: the end is the true end - the scroller sits at its bottom, no estimated space left below the last line', !!e1 && e1.atBottom, JSON.stringify(e1));
  // ------------------------------------------------------------------
```
