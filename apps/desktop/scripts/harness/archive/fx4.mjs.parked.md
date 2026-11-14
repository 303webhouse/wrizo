# Parked records archived from fx4.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx4.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx4.mjs lines 159-165 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 243cf8f0169984958065280cdc8d4e7cc908c728

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23; Cursor's mockup e3c4e462): a fresh Arbor page opens in the Typewriter ZOOM, which holds
    // the writing line at the band's anchor - 60% of the column (pageScale.ts ZOOM_ANCHOR) - so the first line starts there, not a quarter down (train #7
    // on b10 687f40fb: 0.60 / 0.60 / 0.63). fx5 S1 (d) and fx1 S1 carry the same park. Kept VERBATIM and no longer run; records in the parked section.
    //
    // ok(`S1 @ ${width}px (prose): the visual start position reads as "about a quarter" (20-32% of the stage height)`,
    //   proseInfo.fraction >= 0.20 && proseInfo.fraction <= 0.32, JSON.stringify(proseInfo));
    // ------------------------------------------------------------------
```

## Record 2 · from fx4.mjs lines 168-172 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b85f0e61d61ee6065f5a8c099522ffcfc84de6da

```js
    // ---- PARKED - SUPERSEDED by POLISH #10 item 19 (Nick, Oct 25: "seems too low on the screen to start"): the writing line - and a fresh page's first line - is held at the MIDDLE of the visible page, 50% of the column (pageScale.ts ZOOM_ANCHOR), not 60%. Kept VERBATIM and no longer run; records in the parked section; successor follows.
    //
    // ok(`S1 @ ${width}px (prose) [page-size successor]: a fresh prose page opens in the Typewriter zoom and its first line starts at the band's anchor - 60% of the column (within 5%)`,
    //   startZoom === 'true' && Math.abs(proseInfo.fraction - 0.6) <= 0.05, JSON.stringify({ ...proseInfo, zoom: startZoom }));
    // ------------------------------------------------------------------
```

## Record 3 · from fx4.mjs lines 448-458 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 445d9e17fd24eaac7742e61b23cbab56453ca1ee

```js
  // ---- PARKED — SUPERSEDED by item 83 M9 (R13.v) + R1, 2026-08-25 ---
  // Kept VERBATIM and no longer run. Two changes under it: the styling
  // tools moved OUT of the popup strip into the card's own left-edge dock
  // (R13.v/R14 - the dock is the card's companion), and Underline joined
  // B and I by R1, so the count is 3 and it is read from the dock.
  //
  // ok('S5: the card\'s own strip carries Bold and Italic ONLY (the frozen markdown set does not unfreeze)', toolCount === 2, String(toolCount));
  // ------------------------------------------------------------------
  // ITEM 159 - the card's Styling dock starts CLOSED, so a driver that reaches a
  // dock tool opens it first, with a REAL press on the grip (the standing law).
  // The claim this file makes about the dock is unchanged; only its precondition is.
```

## Record 4 · from fx4.mjs lines 461-466 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8ed60333ee7fe5c6a6410c5de329a63bbdcb2291

```js
  // ITEM 207 STEP 4 (2026-09-24) — SUPERSEDED, the count grew again. The Type control's
  // 'small' form joined the dock (BoardEditor.tsx) with a face button (class wz-type-face,
  // not counted) and a size '−'/'+' pair (class mode-tbtn, same as B/I/U) — two more tools,
  // found stale by Batch Eight's pair (fx4 S5, batch-eight @ 9c8d5c3). Original name kept
  // verbatim, parked below; live successor immediately after.
  // ok('S5 [R13.v+R1 successor]: the opened cards DOCK carries exactly B/I/U - three styling tools, moved off the strip and grown by Underline', dockToolCount === 3, String(dockToolCount));
```

## Record 5 · from fx4.mjs lines 503-514 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 45ff3fcab3b9fa28454a6a3cdda7114f6e9680db

```js
  // ---- PARKED — SUPERSEDED by item 83 M9 (R13.v), 2026-08-25 --------
  // Kept VERBATIM and no longer run. This pinned the focusable COUNT at 4;
  // M9's dock adds buttons inside `.board-popup`, so the count is now 5.
  // THE TRAP ITSELF IS INTACT - it queries live over every button in the
  // dialog, so the dock's buttons are trapped automatically (measured:
  // {focusableCount:5, wrappedToFirst:true}). The successor asserts the
  // PROPERTY (Tab wraps) rather than the count, which is what the check was
  // ever really for.
  //
  // ok('S5: Tab is contained within the popup\'s own focusable elements (hb1.1\'s UnlockCeremony pattern, reused) — from the last element, Tab wraps to the first',
  // focusTrapProof.focusableCount === 4 && focusTrapProof.wrappedToFirst, JSON.stringify(focusTrapProof));
  // ------------------------------------------------------------------
```

## Record 6 · from fx4.mjs lines 534-543 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 35fe9e3435520f1064e4e15adaa84c71792404ea

```js
  // ---- PARKED — SUPERSEDED by card-close-x (Nick's live test, 2026-10-13) ----
  // Kept VERBATIM and no longer run. The close control is an X in the pop-up's
  // top-right corner now: it SHOWS a glyph, not the word, so its textContent is
  // no longer "Close" - its accessible NAME is (aria-label + title). It keeps the
  // class board-popup-done, so the click above still drives it. The record lives
  // on in this file's parked section; the live successor follows.
  //
  // ok('S5 (CD4.1 successor): the "Close" button closes the popup, un-blurs the board, and commits the edit — the card-edit popup close control relabeled Close (class board-popup-done + behavior unchanged)',
  //   afterDone.popupGone && afterDone.blurGone && afterDone.committedText === '**Before edit**' && closeBtnLabel === 'Close', JSON.stringify({ ...afterDone, closeBtnLabel }));
  // ------------------------------------------------------------------
```

## Record 7 · from fx4.mjs lines 607-614 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8df3c60bd3a6cf1f69b80dc33eaf90174c293ef2

```js
  // PARKED (#13 step 4b): the three S7 Stacked checks' SQUARE-CORNER half is law 3, retired by Nick, Nov 1. Originals kept VERBATIM, never run;
  // each live successor keeps the rest (the two-layer shadow, the same on text, ink and pin cards).
  // ok('S7: the text card carries the Stacked treatment — square corners, a two-layer box-shadow (the 2px offset hard edge + the soft shadow)',
  //   stackedCss.text.borderRadius === '0px' && countShadowLayers(stackedCss.text.boxShadow) === 2 && stackedCss.text.boxShadow !== 'none',
  //   JSON.stringify(stackedCss.text));
  // ok('S7: ink cards wear the SAME Stacked treatment identically (square corners, the same two-layer shadow)',
  //   stackedCss.ink.borderRadius === '0px' && countShadowLayers(stackedCss.ink.boxShadow) === 2 && stackedCss.ink.boxShadow !== 'none',
  //   JSON.stringify(stackedCss.ink));
```

## Record 8 · from fx4.mjs lines 712-739 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 557bc1ad7d7c95670f11ee8025e57dadcf18ad9f

```js
// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX5 S5/S9 — the entire handle-double-click thread-drag gesture this
// file's own S6 section tested is REMOVED WHOLE (Nick's own ruling: "the
// dead handle-gesture... do not repair it" — an olive pin at the card's
// top corner is the connection grab now). Quoted verbatim below (the exact
// code that used to live in this file's own live S6 section, before this
// park):
//
//   await freshBoard(app, 'fx4-s6-board', [
//     { id: 'fx4-s6-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
//     { id: 'fx4-s6-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
//   ], LAPTOP_W, 900);
//   ...
//   await app.evalJs('document.querySelector(\'[data-box-id="fx4-s6-a"] .board-handle\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
//   const armed = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
//   ok('S6: double-clicking the brass resize handle arms a thread-drag from that card...', armed === 'true', armed);
//   ... (mint/cancel/de-dupe/select/delete/reload-persistence, all gated on
//   that same handle-dblclick arm step)
//
// Live successor: fx5.mjs's own S5 section re-derives the IDENTICAL
// functional coverage (arm, mint, Escape-cancel, empty-release-cancel,
// de-dupe, hairline select/delete, reload persistence) against the NEW
// olive-pin-drag gesture instead. The two checks below don't re-run the
// dead code (there is nothing left to re-run it AGAINST — the .board-
// handle element no longer carries a dblclick listener at all) — they
// instead PROVE the retirement itself, the same "no dead surface left
// behind" discipline ab1.mjs's own S5 park uses for inline-editing's
// retirement.
```

## Record 9 · from fx4.mjs lines 801-804 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 35fe9e3435520f1064e4e15adaa84c71792404ea

```js
    // SUPERSEDED by card-close-x (2026-10-13) — kept VERBATIM, no longer run: the
    // close control's textContent is the X glyph now, its NAME is "Close".
    // pok('PARKED (was "S5: Done closes the popup, un-blurs the board, and commits the edit") — CD4.1: the card-edit popup close button is relabeled "Close" (class board-popup-done + behavior unchanged); live successor: this file\'s own live S5 section',
    //   popupCloseNow.present === true && popupCloseNow.label === 'Close', JSON.stringify(popupCloseNow));
```

## Record 10 · from fx4.mjs lines 842-849 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 243cf8f0169984958065280cdc8d4e7cc908c728

```js
    // ---- RE-PARKED, generation 2, by page-size (train #7, Oct 25): this record's prose half - "prose KEEPS FX4's quarter" - is falsified by the zoom
    // (a fresh Arbor page starts at the band's anchor, 0.60). The script half still holds. The gen-1 record, VERBATIM, no longer runs.
    //
    // pok('PARKED (was "S1 @ 1280px (script, S7 mirrors prose): the visual start position also reads as \'about a quarter\'") — SC1 S3: script starts at the TOP of page one (SC-V4) while prose KEEPS FX4\'s quarter; live successor in this file\'s own live S1 section',
    //   scriptStartParked.fraction >= 0 && scriptStartParked.fraction <= 0.02
    //     && proseStartParked.fraction >= 0.20 && proseStartParked.fraction <= 0.32,
    //   JSON.stringify({ scriptStartParked, proseStartParked }));
    // ------------------------------------------------------------------
```

## Record 11 · from fx4.mjs lines 851-857 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b85f0e61d61ee6065f5a8c099522ffcfc84de6da

```js
    // ---- RE-PARKED, generation 3: POLISH #10 item 19 (Nick, Oct 25: "seems too low on the screen to start"): the writing line - and a fresh page's first line - is held at the MIDDLE of the visible page, 50% of the column (pageScale.ts ZOOM_ANCHOR), not 60%. The gen-2 record, VERBATIM, no longer runs.
    //
    // pok('PARKED, generation 2 (was gen-1 "PARKED (was \'S1 @ 1280px (script, S7 mirrors prose): the visual start position also reads as about a quarter\') — SC1 S3: script starts at the TOP of page one while prose KEEPS FX4\'s quarter") — page-size: script still at the top; prose opens zoomed, its first line at the band\'s anchor (60%)',
    //   scriptStartParked.fraction >= 0 && scriptStartParked.fraction <= 0.02
    //     && proseZoomParked === 'true' && Math.abs(proseStartParked.fraction - 0.6) <= 0.05,
    //   JSON.stringify({ scriptStartParked, proseStartParked, proseZoomParked }));
    // ------------------------------------------------------------------
```
