# Parked records archived from fx2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx2.mjs lines 179-185 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23): .mode-pagecol is no longer the text column. The prose page is PAINTED by a transform
    // inside it, and in the Typewriter zoom (Arbor's default) the column is the whole stage, so every grip on the stage "intersects" it (lane 3).
    // The text column is the editor itself; the successor reads .forward-only-editor. Kept VERBATIM and no longer run; records in the parked section.
    //
    // ok(`S1 @ ${width}px: the grip rect and the text-column rect never intersect, sliver CLOSED`,
    //   disjoint(gripClosed, paperClosed), JSON.stringify({ gripClosed, paperClosed }));
    // ------------------------------------------------------------------
```

## Record 2 · from fx2.mjs lines 201-207 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23): .mode-pagecol is no longer the text column. The prose page is PAINTED by a transform
    // inside it, and in the Typewriter zoom (Arbor's default) the column is the whole stage, so every grip on the stage "intersects" it (lane 3).
    // The text column is the editor itself; the successor reads .forward-only-editor. Kept VERBATIM and no longer run; records in the parked section.
    //
    // ok(`S1 @ ${width}px: the grip rect and the text-column rect never intersect, sliver OPEN`,
    //   disjoint(gripOpen, paperOpen), JSON.stringify({ gripOpen, paperOpen }));
    // ------------------------------------------------------------------
```

## Record 3 · from fx2.mjs lines 307-312 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5bbe6f47936465e1e7fbc71bb6a8555b661adc6e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (the typewriter is remembered per page: a page that holds text and has no saved value opens OFF, a new empty page takes its theme's default; Nick, Oct 11), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The successor follows the parked lines.
  //
  // ok('S2: a ~3-line page (below the 10-line threshold) opens Draft with typewriter ON — DOM (.mode-scroll[data-typewriter])',
  // shortDom === 'true', String(shortDom));
  // ----------------------------------------------------------------------
```

## Record 4 · from fx2.mjs lines 315-330 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 44cc41f58a47df2ec152f4eef20e80a1a9440ddb

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (the typewriter is remembered per page: a page that holds text and has no saved value opens OFF, a new empty page takes its theme's default; Nick, Oct 11), 2026-10-11 ----
  // GENERATION 1, kept VERBATIM and no longer run.
  //
  // ok('S2: a ~3-line page opens Draft with typewriter ON — the stored setting itself',
  // shortSetting === true, String(shortSetting));
  // ----------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by typewriter-scope (Fable Oct 21), 2026-10-21 ----
  // GENERATION 2, kept VERBATIM and no longer run: `shortSetting` reads the SHARED
  // `wrizo-writing-settings` blob, which enterPageTypewriter no longer mirrors into (the
  // cross-page leak this ticket exists to close) - so it can no longer stand in for "what did
  // THIS page's own open resolve to." Generation 3 (the live check) reads the per-page key
  // directly instead.
  //
  // ok('S5 successor: a ~3-line page opens Draft with typewriter OFF — the stored setting itself',
  // shortSetting === false, String(shortSetting));
  // ----------------------------------------------------------------------
```

## Record 5 · from fx2.mjs lines 342-349 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 44cc41f58a47df2ec152f4eef20e80a1a9440ddb

```js
  // ---- PARKED - SUPERSEDED by typewriter-scope (Fable Oct 21), 2026-10-21 ----
  // Kept VERBATIM and no longer run: `longSetting` reads the SHARED `wrizo-writing-settings`
  // blob, which enterPageTypewriter no longer mirrors into (the cross-page leak this ticket
  // exists to close). The successor reads the per-page key directly instead.
  //
  // ok('S2: a ~15-line page opens Draft with typewriter OFF — the stored setting itself',
  // longSetting === false, String(longSetting));
  // ----------------------------------------------------------------------
```

## Record 6 · from fx2.mjs lines 430-435 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5bbe6f47936465e1e7fbc71bb6a8555b661adc6e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (the typewriter is remembered per page: a page that holds text and has no saved value opens OFF, a new empty page takes its theme's default; Nick, Oct 11), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The successor follows the parked lines.
  //
  // ok('S2 (cross-page, independent-review addition): page A (short) opens Draft with typewriter ON — fixture sanity',
  // pageAMode === 'Draft' && pageASeed === 'true', JSON.stringify({ pageAMode, pageASeed }));
  // ----------------------------------------------------------------------
```

## Record 7 · from fx2.mjs lines 474-479 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5bbe6f47936465e1e7fbc71bb6a8555b661adc6e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (the typewriter is remembered per page: a page that holds text and has no saved value opens OFF, a new empty page takes its theme's default; Nick, Oct 11), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The successor follows the parked lines.
  //
  // ok('S2 (cross-page, independent-review addition): explicit click on page A actually flips it OFF by hand',
  // pageAExplicitOff === 'false', String(pageAExplicitOff));
  // ----------------------------------------------------------------------
```

## Record 8 · from fx2.mjs lines 489-494 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5bbe6f47936465e1e7fbc71bb6a8555b661adc6e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (the typewriter is remembered per page: a page that holds text and has no saved value opens OFF, a new empty page takes its theme's default; Nick, Oct 11), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The successor follows the parked lines.
  //
  // ok('S2 (cross-page, independent-review addition): page B does NOT get silently re-seeded ON — the explicit OFF from page A survives the page/mount boundary, matching writingSettings.ts\'s own "different pages/mounts" claim for the module-level flag',
  // pageBDom === 'false', String(pageBDom));
  // ----------------------------------------------------------------------
```

## Record 9 · from fx2.mjs lines 497-511 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 44cc41f58a47df2ec152f4eef20e80a1a9440ddb

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (the typewriter is remembered per page: a page that holds text and has no saved value opens OFF, a new empty page takes its theme's default; Nick, Oct 11), 2026-10-11 ----
  // GENERATION 1, kept VERBATIM and no longer run.
  //
  // ok('S2 (cross-page, independent-review addition): ...and the stored setting itself is OFF, not reverted by page B\'s own seed',
  // pageBSetting === false, String(pageBSetting));
  // ----------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by typewriter-scope (Fable Oct 21), 2026-10-21 ----
  // GENERATION 2, kept VERBATIM and no longer run: `pageBSetting` reads the SHARED
  // `wrizo-writing-settings` blob, which enterPageTypewriter no longer mirrors into (the
  // cross-page leak this ticket exists to close). Generation 3 (the live check) reads page B's
  // own per-page key directly instead.
  //
  // ok('S5 successor (cross-page): ...and the stored setting itself is OFF for page B',
  // pageBSetting === false, String(pageBSetting));
  // ----------------------------------------------------------------------
```
