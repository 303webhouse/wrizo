# Parked records archived from splash.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/splash.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from splash.mjs lines 113-115 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e8fd6fcd7df07e54c0f16ca4d3d41b81f1cc6540

```js
  // SUPERSEDED (item splash-hold, Nick live: "the background should be faded out,
  // not blurred") — the backdrop-filter blur retires whole; there is none to assert.
  // ok('S1: the backdrop is a LIVE blur of the app — a real backdrop-filter, not a screenshot. This is the first backdrop-filter in this stylesheet, so it is asserted rather than assumed to composite', typeof s1.backdrop === 'string' && /blur\(/.test(s1.backdrop), String(s1.backdrop));
```

## Record 2 · from splash.mjs lines 126-134 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3f7ccffd7d33fc70d370841cc4b51ecfa080036b

```js
  // SUPERSEDED (item splash-hold ROUND 6, Nick live: "make it a solid block" —
  // nothing of the app shows through at all) — ~90% let a sliver of the app
  // through on purpose; that purpose retired. Parked verbatim; see the
  // successor just below.
  // ok('S1 (item splash-hold, round 2): the veil is a flat dimming tint in the THEME\'s own ground colour (--ink-950) at ~90% opacity — never one fixed colour painted over every theme',
  //   !!veilColor
  //     && closeEnough(veilColor.r, s1Tint.ground.r) && closeEnough(veilColor.g, s1Tint.ground.g) && closeEnough(veilColor.b, s1Tint.ground.b)
  //     && Math.abs(veilColor.a - 0.90) <= 0.03,
  //   JSON.stringify({ veilBackground: s1.veilBackground, parsed: veilColor, expectedGround: s1Tint.ground }));
```

## Record 3 · from splash.mjs lines 387-392 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in dfa7d9336f4764c716a78b62d76d2f4b5054527f

```js
  // SUPERSEDED (splash-sweep): HOLD_MS is gone from the seam (there is no
  // single floor to report any more — see Splash.tsx's own comment on the
  // window-seam block). Kept verbatim, no longer run:
  //   const holdMs = await app.evalJs('window.wrizoSplash ? window.wrizoSplash.HOLD_MS : null');
  //   ok('S6 (driver, ROUND 3 successor): the hold is readable from the page seam, and is the item splash-hold floor (>= 5000ms, Nick live: "minimum 5s per app load")',
  //     typeof holdMs === 'number' && holdMs >= 5000, String(holdMs));
```
