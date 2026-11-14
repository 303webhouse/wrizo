# Parked records archived from fx6.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx6.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx6.mjs lines 419-424 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4603ace14d5da72b17f3dc8f9a0a435a0233f45

```js
  // SUPERSEDED (item word-diet, Nick) — cascadePageNewPage reworks, "New Page" -> "New Pages".
  // ok('S2 (a): the cascade\'s Page section carries an unmissable "New Page" door at its own head — genuinely preceding the Page face in document order, carrying the olive-lane door class',
  //   doorShape.present && doorShape.label === 'New Page' && doorShape.precedesFace, JSON.stringify(doorShape));
  // SUPERSEDED (item word-diet-layouts, Fable Oct 15 — the singular-exception rule) — cascadePageNewPage reworks back, "New Pages" -> "New Page".
  // ok('S2 (a) [word-diet successor]: the cascade\'s Page section carries an unmissable "New Pages" door at its own head — genuinely preceding the Page face in document order, carrying the olive-lane door class',
  //   doorShape.present && doorShape.label === 'New Pages' && doorShape.precedesFace, JSON.stringify(doorShape));
```

## Record 2 · from fx6.mjs lines 455-459 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): New Page and New Board file into wherever you are - the door in the Pages pop-out files the new page into the writer's current place (here: the SAME set as the page it was made from), not loose.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('S2 (a): the created page\'s own homing laws — loose, exactly like Arrival\'s own Write door (createLooseHomePage) — never filed, never journal-membered, "just a page, from wherever you are"',
  //   !!newCascadePageEntry && newCascadePageEntry.origin === 'loose' && newCascadePageEntry.projectId == null, JSON.stringify(newCascadePageEntry));
```

## Record 3 · from fx6.mjs lines 474-479 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4603ace14d5da72b17f3dc8f9a0a435a0233f45

```js
  // SUPERSEDED (item word-diet, Nick) — boardNewPageCard reworks, "New page card" -> "New Pages Card".
  // ok('S2 (b): the board sliver carries New page card alongside the existing Add card (a third hand tool)',
  //   boardToolLabels.includes('Add card') && boardToolLabels.includes('New page card'), JSON.stringify(boardToolLabels));
  // SUPERSEDED (item word-diet-layouts, Fable Oct 15 — the singular-exception rule) — boardNewPageCard reworks back, "New Pages Card" -> "New Page".
  // ok('S2 (b) [word-diet successor]: the board sliver carries New Pages Card alongside the existing Add card (a third hand tool)',
  //   boardToolLabels.includes('Add card') && boardToolLabels.includes('New Pages Card'), JSON.stringify(boardToolLabels));
```

## Record 4 · from fx6.mjs lines 549-560 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a7726cef3f029697aec66dd9a73d724a3cdf05fb

```js
  // SUPERSEDED (item word-diet, Nick) — cascadePlanJustAPage REMOVED whole
  // (CascadePanels.tsx's own comment at the old render site); the pointer
  // line this check named no longer exists at all, replacement or not.
  // ORIGINAL claim parked verbatim:
  // ok('S2 (c): the Plan panel\'s own no-project branch quietly points at the Page section\'s New Page door — a writer who just wants a page is told where the plainer door is, not just handed board/plan-creation buttons',
  //   !!planPanelText && planPanelText.includes('New Page') && planPanelText.includes('Page section'), planPanelText);
  // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): the Boards tab carries New Board and presets - no lead sentence, no Create a Board / Plot a Story.
  // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
  //
  // ok('S2 (c) [word-diet successor]: the Plan panel\'s own no-project branch carries no "just a page" pointer at all now (REMOVE) — only the truthful lead sentence and the two board/plan-creation buttons',
  //   !!planPanelText && !planPanelText.includes('Page section') && planPanelText.includes('File this page to a drawer first') && planPanelText.includes('Create a Board') && planPanelText.includes('Plot a Story'),
  //   planPanelText);
```

## Record 5 · from fx6.mjs lines 716-736 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a7726cef3f029697aec66dd9a73d724a3cdf05fb

```js
    // ---- PARKED — SUPERSEDED by item word-diet (Nick), 2026-10-13 ----
    // Quoted VERBATIM. beginNewPageCard reworks, "New Page Card" -> "New Pages Card".
    //
    // pok('PARKED (was "S2 (c): the empty board (zero cards — carried NO empty-state copy at all before this ticket) shows a quiet one-line pointer naming both board-side tools") — BG1 S1 replaces the pointer with the doors themselves: no `.board-canvas-empty` on an ordinary board, the Beginnings row instead, still naming both tools among its four doors; live successor: bg1.mjs',
    //   emptyBoardNow.oldCopy === false && emptyBoardNow.row === true &&
    //   emptyBoardNow.doors.includes('New Card') && emptyBoardNow.doors.includes('New Page Card'),
    //   JSON.stringify(emptyBoardNow));
    // ------------------------------------------------------------------
    // ---- PARKED — SUPERSEDED by item word-diet-layouts (Fable, Oct 15, the singular-exception rule), quoted VERBATIM. beginNewPageCard reworks back, "New Pages Card" -> "New Page". ----
    // pok('PARKED [word-diet successor] — no `.board-canvas-empty` on an ordinary board, the Beginnings row instead, still naming both tools (New Card, New Pages Card) among its four doors; live successor: bg1.mjs',
    //   emptyBoardNow.oldCopy === false && emptyBoardNow.row === true &&
    //   emptyBoardNow.doors.includes('New Card') && emptyBoardNow.doors.includes('New Pages Card'),
    //   JSON.stringify(emptyBoardNow));
    // ------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): the row carries three doors; New Page is the sliver's.
    // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
    //
    // pok('PARKED [word-diet-layouts successor] — no `.board-canvas-empty` on an ordinary board, the Beginnings row instead, still naming both tools (New Card, New Page) among its four doors; live successor: bg1.mjs',
    //   emptyBoardNow.oldCopy === false && emptyBoardNow.row === true &&
    //   emptyBoardNow.doors.includes('New Card') && emptyBoardNow.doors.includes('New Page'),
    //   JSON.stringify(emptyBoardNow));
```
