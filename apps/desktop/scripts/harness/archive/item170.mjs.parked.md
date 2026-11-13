# Parked records archived from item170.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item170.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item170.mjs lines 161-165 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the heading is "Sections" (the section is the place's sections), not "Open Pages".
  // Kept VERBATIM below and no longer run; the live successor follows. The Open Pages list became the PAGES POP-OUT (components/SectionsPopout.tsx): scoped to where the writer is, in the writer's own ORDER (the sort control reads Order; Date / A-Z / recency / star-first are views that arrive in step 4 and never write). What item 170 held shut - a click on a row OPENS the page, the more-menu PLACES it on a board, every page of the place is a row, uncapped - still holds and is still asserted below, unparked.
  //
  // ok('S1: the section is named for what it does — "Open Pages", not "Place page on board"',
  //   onPage.heading === 'Open Pages', JSON.stringify({ heading: onPage.heading }));
```

## Record 2 · from item170.mjs lines 319-324 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the pop-out is a scrolling list of every section of the place (a taller viewport than three rows), not a three-row window.
  // Kept VERBATIM below and no longer run; the live successor follows. The Open Pages list became the PAGES POP-OUT (components/SectionsPopout.tsx): scoped to where the writer is, in the writer's own ORDER (the sort control reads Order; Date / A-Z / recency / star-first are views that arrive in step 4 and never write). What item 170 held shut - a click on a row OPENS the page, the more-menu PLACES it on a board, every page of the place is a row, uncapped - still holds and is still asserted below, unparked.
  //
  // ok('S5: OPEN PAGES shows THREE rows and scrolls through the rest — a viewport, not a population cap, so no page is ever out of reach',
  //   viewport.list === true && viewport.wholeRows === 3 && viewport.scrolls === true && viewport.totalRows > 3,
  //   JSON.stringify(viewport));
```

## Record 3 · from item170.mjs lines 339-343 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): Order is the writer's own - editing a page never moves it (recency is a view, step 4).
  // Kept VERBATIM below and no longer run; the live successor follows. The Open Pages list became the PAGES POP-OUT (components/SectionsPopout.tsx): scoped to where the writer is, in the writer's own ORDER (the sort control reads Order; Date / A-Z / recency / star-first are views that arrive in step 4 and never write). What item 170 held shut - a click on a row OPENS the page, the more-menu PLACES it on a board, every page of the place is a row, uncapped - still holds and is still asserted below, unparked.
  //
  // ok('S5: the last EDITED page leads the list, not the last created — a page written long ago and revised this morning is what a writer reaching for recent work means',
  //   (afterEdit.ids || [])[0] === OLDEST.id, JSON.stringify({ first: (afterEdit.ids || [])[0], expected: OLDEST.id }));
```

## Record 4 · from item170.mjs lines 356-361 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): a star is not a sort - it does not reorder the writer's own order.
  // Kept VERBATIM below and no longer run; the live successor follows. The Open Pages list became the PAGES POP-OUT (components/SectionsPopout.tsx): scoped to where the writer is, in the writer's own ORDER (the sort control reads Order; Date / A-Z / recency / star-first are views that arrive in step 4 and never write). What item 170 held shut - a click on a row OPENS the page, the more-menu PLACES it on a board, every page of the place is a row, uncapped - still holds and is still asserted below, unparked.
  //
  // ok('S5: a STARRED page sorts first, above the most recently edited one — a star is the writer saying "this one", and an ordering that ignored it would make them say it twice',
  //   starred && (afterStar.ids || [])[0] === JOURNAL.id && (afterStar.ids || [])[1] === OLDEST.id,
  //   JSON.stringify({ first: (afterStar.ids || [])[0], second: (afterStar.ids || [])[1] }));
```
