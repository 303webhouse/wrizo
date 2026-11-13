# Parked records archived from item126.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item126.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item126.mjs lines 84-94 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in fcd99d6ad3b9fca75d4ae23f947100b6daa09482

```js
// PARKED verbatim (polish #10 item 5, Oct 25 - page-r): the zoomed sheet now reaches over the scroller's paddings, so a fraction of the WHOLE sheet is no longer
// a fraction of the text. Kept as written, no longer called; the successor below aims the same fractions at the sheet's TEXT box (as item121 did).
// const safePen = async (app, sel, points, label) => {
//   if (!(await present(app, sel))) {
//     ok(`DRIVER: ${label} — ${sel} ABSENT, no pen stroke dispatched`, false, JSON.stringify(await where(app)));
//     return false;
//   }
//   await app.penStroke(sel, points);
//   return true;
// };
// SUCCESSOR: a pointer-transparent marker laid over the sheet's content box (the sheet less its paddings, at the painted scale); every press still lands on the sheet.
```
