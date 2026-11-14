# Parked records archived from polish10-linkdock.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/polish10-linkdock.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from polish10-linkdock.mjs lines 124-129 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in be0a7552ff3113bd15b7fd84bbd0b9b9bcb96bbb

```js
    // K5: one at a time. PARKED VERBATIM (Fable, Oct 28): docking the source REPLACES the card - the reader replaces the Grafts list, so a second Dock control never stands
    // beside it; the rule is one item at a time, and a swap is Undock, then Dock. The check below is kept as written and no longer run; its successor follows.
    //   const srcBtn = await pointOf(app, dockBtn(null, S));
    //   if (srcBtn) { await click(app, srcBtn.x, srcBtn.y); await sleep(800); }
    //   const r5 = await app.evalJs(READER);
    //   ok(`${tag} K5: one at a time - docking the source replaces the card: one reader, the source's words`, !!srcBtn && !!r5 && r5.count === 1 && /Smith, J\. \(2020\)/.test(r5.text || '') && !/Cartographer/.test(r5.text || ''), J(r5));
```
