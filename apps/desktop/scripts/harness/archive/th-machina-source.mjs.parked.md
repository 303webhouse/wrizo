# Parked records archived from th-machina-source.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/th-machina-source.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from th-machina-source.mjs lines 351-357 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d80010ae828fa9d4a7e17ccf58230badddf2a279

```js
// ---- PARKED - SUPERSEDED by page-size (Fable, Oct 23: the grey-band rule existed three times - Flux, Machina, and page-size's all-theme rule -
// and collapses into the ONE base rule): Machina's own `[data-theme='machina'] body::after{ z-index:-1; }` is gone, so EMBER's fifth pattern no longer
// matches and M18 falls with it. Kept VERBATIM and no longer run; record in this file's parked section; successor below (EMBER's other four, plus
// the base rule).
//
// ok('M18: the paper\'s resting and focused halos are plain dark shadows, the goal glow is dialled (the cap token) and recoloured to the live gray, and the celebration flare is not drawn - under Machina only', EMBER.every((r) => r.test(ccss)) && /\[data-theme='machina'\] \.wz-goal-glow\{ background:radial-gradient\(ellipse at center, color-mix\(in srgb, var\(--signal-live\)/.test(ccss), JSON.stringify(EMBER.map((r) => r.test(ccss))));
// ------------------------------------------------------------------
```

## Record 2 · from th-machina-source.mjs lines 368-372 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6ba919fdc9606dab283aaf745dd002ecff4422e0

```js
// ---- PARKED - SUPERSEDED by #13 step 11 (Fable, Nov 5): pages/JournalEntry.tsx (unrouted since FX14) is deleted as dead code, so its bar
// cannot be read. Kept VERBATIM below and no longer run; its record is in the parked block. The successor reads the legacy bar that stays.
//
// ok('M19: the framed page draws Arbor\'s bar only when the theme is not Machina (DeskInstrument) - the legacy surfaces\' bars (ModeStage / JournalEntry) are untouched', BAR_GATE.test(di) && /<ProgressBar/.test(src('pages/JournalEntry.tsx')), '');
// ------------------------------------------------------------------
```

## Record 3 · from th-machina-source.mjs lines 458-461 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d80010ae828fa9d4a7e17ccf58230badddf2a279

```js
  // ---- PARKED - SUPERSEDED by page-size (Oct 23): the line this mutant deletes no longer exists (collapsed into the base rule); kept VERBATIM, no longer run.
  // const css3 = mut(ccss, "[data-theme='machina'] body::after{ z-index:-1; }", '');
  // ok('MUTANT: the vignette left ABOVE the page under Machina (the body::after rule deleted - the grey bands return) - M18 must go RED (the mutation LANDED)', css3 !== null && !EMBER.every((r) => r.test(css3)) && EMBER.every((r) => r.test(ccss)), '');
  // ------------------------------------------------------------------
```

## Record 4 · from th-machina-source.mjs lines 464-467 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d80010ae828fa9d4a7e17ccf58230badddf2a279

```js
  // ---- PARKED - SUPERSEDED by page-size (Oct 23): it reads EMBER whole, and EMBER's vignette pattern no longer matches the real CSS; kept VERBATIM, no longer run.
  // const css2 = mut(ccss, "[data-theme='machina'] .desk-frame-goalflare{ display:none; }", '');
  // ok('MUTANT: Arbor\'s celebration flare left drawn under Machina (the display:none rule deleted) - M18 must go RED (the mutation LANDED)', css2 !== null && !EMBER.every((r) => r.test(css2)) && EMBER.every((r) => r.test(ccss)), '');
  // ------------------------------------------------------------------
```
