# Parked records archived from connector-b.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/connector-b.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from connector-b.mjs lines 105-108 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2595656497954d1547c560c7d313aac86494cc79

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the entries are rows of the Pages pop-out, not tiles of the Drawers panel.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('fixture: the rail\'s Drawers panel shows the other board as a thumbnail that declares its entry (data-link-entry)', !!tb2 && tb2.entry === f.b2, JSON.stringify(tb2));
```

## Record 2 · from connector-b.mjs lines 121-130 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5dd1c651dee6a8fa83500fade7b8dfd4f2c90e8f

```js
  // ---- PARKED - SUPERSEDED (Fable Oct 17, ledger 86): the original B1 assumed the rail is on the RIGHT of the board. It is on the LEFT. Kept VERBATIM below and no longer run; its successor reads the side.
  //
  // ok('B1: the arm is drawn in a viewport overlay (a portal on body), UNCLIPPED - it ends past the board\'s right edge, over the rail', !!arm1 && arm1.inBody && arm1.display !== 'none' && arm1.x2 > cvR.r, JSON.stringify({ arm1, canvasRight: cvR.r }));
  // ---- PARKED - SUPERSEDED (Fable Oct 17, ledger 87): the rail-side successor compared the thumbnail's centre with the canvas rect's left edge, but the Drawers panel OVERLAYS the canvas (page primacy: the board does not
  // move - B8 passes), so the thumbnail is INSIDE the canvas rect and the check cannot hold on this layout. Kept VERBATIM below and no longer run; its successor allows for the overlay.
  //
  // // the rail's side is READ from where the thumbnail is, never assumed
  // const railLeft = centre(tb2).x < cvR.l;
  // ok(`B1 [rail-side successor]: the arm is drawn in a viewport overlay (a portal on body), UNCLIPPED - it ends past the board's ${railLeft ? 'LEFT' : 'RIGHT'} edge, on the rail's side, over the rail`, !!arm1 && arm1.inBody && arm1.display !== 'none' && (railLeft ? arm1.x2 < cvR.l : arm1.x2 > cvR.r), JSON.stringify({ arm1, railLeft, canvas: { l: cvR.l, r: cvR.r } }));
  // the rail's position is READ, never assumed: the panel overlays the canvas, so a thumbnail may lie inside the canvas rect (then the arm must END ON IT) or outside it (then the arm must also pass that edge)
```

## Record 3 · from connector-b.mjs lines 194-197 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2595656497954d1547c560c7d313aac86494cc79

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the targets are pages, so the page-link's kind reads "page".
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('B6: the Grafts / Links tab lists the selected card\'s connections - the page-link (a board) AND the same-board connection (the pinned nested board) - each with an X', list.length === 2 && list.every((i) => i.x) && list.some((i) => i.via === 'link' && i.label === 'Research board' && i.kind === 'board') && list.some((i) => i.via === 'card' && i.label === 'Nested board'), JSON.stringify(list));
```

## Record 4 · from connector-b.mjs lines 240-268 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5dd1c651dee6a8fa83500fade7b8dfd4f2c90e8f

```js
  // ---- PARKED - SUPERSEDED (Fable Oct 17, ledger 87): B9's driver pressed the corner square with the LEFT button and dragged - which is a RESIZE (held connection mode comes from a RIGHT press on the square, or a second press of a
  // double-press). Kept VERBATIM below and no longer run; the successor drives the right button.
  //
  // // B9 - THE HELD PATH (Fable Oct 17, ledger 86): press the corner square, DRAG to a rail thumbnail holding the button, release there. The release toggles the link and the writer STAYS on the board; the beat then
  // // ends, so a later deliberate click on the same thumbnail still travels (the swallow is a beat, not a lock).
  // await openDrawers(app);
  // const tb9 = await tile(app, 'Research board');
  // const hash9 = await app.evalJs('location.hash');
  // if (!tb9) ok('B9 fixture: the Research board thumbnail is in the rail', false, 'absent');
  // else if (!(await selectCard(app, 'cb-a'))) ok('B9 fixture: the card selected', false, JSON.stringify(await R(app, '[data-box-id="cb-a"]')));
  // else {
  //   const hr9 = await R(app, '[data-box-id="cb-a"] .board-handle');
  //   if (!hr9) ok('B9 fixture: the card\'s corner square rendered', false, 'absent');
  //   else {
  //     const n9 = (await linksOf(app, f.id)).length;
  //     const hp = centre(hr9);
  //     await app.mouseMove(hp.x, hp.y); await mouse(app, 'mousePressed', hp.x, hp.y);
  //     await glide(app, hp, centre(tb9), 12); await sleep(250);
  //     const armed9 = await armed(app);
  //     await mouse(app, 'mouseReleased', ...Object.values(centre(tb9))); await sleep(500);
  //     const n9b = (await linksOf(app, f.id)).length;
  //     ok('B9 [held path]: press the corner square, drag onto a rail thumbnail and release there toggles the link (one record more or fewer), the mode having been armed during the drag', armed9 === 'true' && Math.abs(n9b - n9) === 1, JSON.stringify({ armed9, before: n9, after: n9b }));
  //     ok('B9 [held path]: and the writer is STILL ON THE BOARD (a release is not a click on the thumbnail)', (await app.evalJs('location.hash')) === hash9, String(await app.evalJs('location.hash')));
  //     await sleep(400);
  //     const tb9b = await tile(app, 'Research board');
  //     if (tb9b) { await click(app, ...Object.values(centre(tb9b))); await waitSoft(app, `location.hash === '#/page/${f.b2}'`, { label: 'travel', timeout: 4000 }); }
  //     ok('B9: after the beat, a deliberate click on the thumbnail travels as it always did (the swallow is a beat, not a lock)', (await app.evalJs('location.hash')) === `#/page/${f.b2}`, String(await app.evalJs('location.hash')));
  //   }
  // }
```
