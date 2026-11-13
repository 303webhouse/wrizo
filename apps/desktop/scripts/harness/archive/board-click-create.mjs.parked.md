# Parked records archived from board-click-create.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/board-click-create.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from board-click-create.mjs lines 68-73 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8df3c60bd3a6cf1f69b80dc33eaf90174c293ef2

```js
  // PARKED (#13 step 4b): S3's SQUARE half (border-radius:0 in the starter and ghost pins, and its rounding mutant) is law 3, retired by Nick, Nov 1.
  // Kept VERBATIM, never run (the `look` pins above stay as written, read only by the parked lines); the successor below keeps the rest.
  // ok('S3: the board\'s starters are a thin square outline at about 40% opacity (lifted on hover and keyboard focus), they fade away with opacity first and visibility after, the ghost is a square hairline outline that never takes the pointer - and the look is scoped to the BOARD row (the page row and STORYBOARD/OUTLINE keep theirs)',
  //   Object.values(l).every(Boolean), JSON.stringify(l));
  // const mut = css.replace('border:1px solid currentColor; border-radius:0; opacity:.4;', 'border:1px solid currentColor; border-radius:6px; opacity:.4;');
  // ok('S3 (mutant): a rounded starter turns the pin RED (the mutation landed)', mut !== css && !look(mut).starter, '');
```

## Record 2 · from board-click-create.mjs lines 241-250 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 446f008d59e1678f7409066dc164b081b21cac4e

```js
      // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15) ----
      // The interim action row (Ungroup etc.) is DELETED - its actions are the top of the card right-click menu, and the "inside the canvas, top-right" geometry has nothing to describe. "Selecting a card adds nothing above the header strip" stays asserted by C10.
      // Quoted VERBATIM below. Successor: scripts/harness/board-context-menu.mjs (a grouped card's menu leads with Ungroup; a right-click moves nothing).
      // const geo = await app.evalJs(`(() => { const row = document.querySelector('.board-action-row'); const wrap = document.querySelector('.board-canvas-wrap'); const cv = document.querySelector('.board-canvas');
      //   if (!row || !wrap) return null; const a = row.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      //   return { rowInsideWrap: a.left >= w.left && a.right <= w.right && a.top >= w.top && a.bottom <= w.bottom, topRight: a.right > w.left + w.width * 0.6 && a.top - w.top < 40, canvasTop: Math.round(cv.getBoundingClientRect().top * 10) / 10, label: row.textContent.trim().slice(0, 40) }; })()`);
      // const stripAfter12 = await strip(app);
      // ok('C12: with a GROUPED card selected the interim action row (Ungroup) shows, INSIDE the canvas wrapper and in its top-right corner', !!geo && geo.rowInsideWrap && geo.topRight && /Ungroup/.test(geo.label), JSON.stringify(geo));
      // ok('C12: and it never shifts the canvas (the top edge is unchanged) and adds nothing above or over the header strip', !!geo && geo.canvasTop === top0 && JSON.stringify(stripBefore12) === JSON.stringify(stripAfter12), JSON.stringify({ top0, after: geo && geo.canvasTop, added: stripAfter12.filter((x) => !stripBefore12.includes(x)) }));
      // C13: the title
```
