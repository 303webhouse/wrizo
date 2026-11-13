# Parked records archived from vw1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/vw1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from vw1.mjs lines 168-173 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the rail carries SEVEN tabs in the new order (the place block, Pages, Boards, Journal, then the foot).
  // Kept VERBATIM below and no longer run; the successor asserts the new rail. The Shelf is merged into the Journal (display only), Plan is renamed Boards in the label (the category id stays `plan`), and the Drawers tab is now the PLACE BLOCK at the top.
  //
  // ok(`VW1 check 1: the rail carries exactly eight tabs in the ruled order — ${RULED.join(' · ')}`,
  //   Array.isArray(order) && JSON.stringify(order) === JSON.stringify(RULED),
  //   JSON.stringify({ got: order, want: RULED }));
```

## Record 2 · from vw1.mjs lines 208-214 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): three separators, in the new places - after boards, after journal, above trash.
  // Kept VERBATIM below and no longer run; the successor asserts the new rail. The Shelf is merged into the Journal (display only), Plan is renamed Boards in the label (the category id stays `plan`), and the Drawers tab is now the PLACE BLOCK at the top.
  //
  // const WANT_SEQ = ['page', 'plan', '—', 'drawers', '—', 'journal', 'shelf', '—', 'settings', 'theme', '—', 'trash'];
  // ok('VW1 check 2: four separators, in the ruled places — after plan, after drawers, after shelf, and above trash. The separators do the teaching silently, so their POSITION is the assertion, not their count',
  //   JSON.stringify(seq) === JSON.stringify(WANT_SEQ),
  //   JSON.stringify({ got: seq, want: WANT_SEQ }));
```
