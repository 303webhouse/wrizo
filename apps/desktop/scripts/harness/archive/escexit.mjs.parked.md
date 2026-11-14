# Parked records archived from escexit.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/escexit.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from escexit.mjs lines 98-118 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the empty page's beginnings row's only door) and the
  // first-line invite are deleted, so an empty page has no row for Esc to close. Kept VERBATIM and no longer run; each check has a
  // record on the parked leg; the successor follows (the first Esc leaves at once, as S1's).
  //
  // // S4 - the empty page's beginnings row
  // await openPage(app, 'e-empty', '', null);
  // await sleep(400);
  // const rowUp = () => app.evalJs("!!document.querySelector('.wz-beginnings') && document.querySelector('.wz-beginnings').getClientRects().length > 0");
  // const hadRow = await rowUp();
  // ok('S4 (setup) an empty page shows its beginnings row', hadRow === true);
  // await focusEditor(app);
  // await armCloseTimer(app, '.wz-beginnings');
  // await esc(app);
  // const tRow = await closeTime(app);
  // ok(`S4 THE ASSUMPTION, MEASURED: the beginnings row is gone inside the same ${SETTLE_MS} ms window`, tRow !== null && tRow >= 0 && tRow < SETTLE_MS, JSON.stringify({ msToClose: tRow, window: SETTLE_MS }));
  // const b1 = await where(app);
  // ok('S4 the first Esc dismisses the beginnings row and focus stays in the editor', (await rowUp()) === false && b1.inEditor === true, JSON.stringify(b1));
  // await esc(app);
  // const b2 = await where(app);
  // ok('S4 the second Esc leaves for the current mode tab', !b2.inEditor && !!b2.modeKey && b2.active === true, JSON.stringify(b2));
  // ------------------------------------------------------------------
```
