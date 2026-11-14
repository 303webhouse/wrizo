# Parked records archived from big-projects-3.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/big-projects-3.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from big-projects-3.mjs lines 245-250 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7a35d61377c6bdccdb0b13ca3cf9cd3f97953816

```js
  // ---- PARKED - SUPERSEDED by Fable's ruling 3 (Oct 21): place labels appear ONLY on items from another Drawer or the Journal - a same-place row
  // (Ch 2, in The Late Ferry like Ch 3) carries none. Kept VERBATIM and no longer run; its parked record is below, its successor beside it.
  // ok('P1: it opens the picker - a search field (focused), then Cards / Pages / Boards from every place, each with its place label, never the page itself',
  //   opened1 && !!search && search.focused && rows1.some((r) => r.group === 'Cards') && rows1.some((r) => r.group === 'Pages') && rows1.some((r) => r.group === 'Boards')
  //     && lbl(IDS.ch2) === 'The Late Ferry' && lbl(IDS.salt) === 'Short stories' && lbl(IDS.kettle) === 'Journal' && !rows1.some((r) => r.entry === IDS.ch3),
  //   JSON.stringify({ search, n: rows1.length, ch2: lbl(IDS.ch2), salt: lbl(IDS.salt), kettle: lbl(IDS.kettle) }));
```
