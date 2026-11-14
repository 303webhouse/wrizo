# Parked records archived from fx1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx1.mjs lines 204-212 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 212fbc35c4534581fdc2fb33edabf613f6f4d8d0

```js
  // ---- PARKED - SUPERSEDED by POLISH #10 item 17 (Nick, Oct 25: the typewriter pays Enter's line AT Enter, not at the next keystroke): the page opens
  // zoomed with its first line AT the hold, so the empty row Enter makes is one line past it and is paid at once - row 0 has scrolled one line
  // (24px on the train-11 bisect) and `scrolled` is true. What C2 guards - nothing fades before the writer has written past the hold - is unchanged:
  // the first line is still at full strength (firstOpacity 1) and the move is the ONE line Enter owes. Kept VERBATIM and no longer run; record in the
  // parked section (it re-reads this row from the live run).
  //
  // ok('S1 (C2): a fresh/short page never fades before it has actually scrolled',
  //   rows[0].scrolled === false && rows[0].firstOpacity === 1, JSON.stringify(rows[0]));
  // ------------------------------------------------------------------
```

## Record 2 · from fx1.mjs lines 357-359 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8df3c60bd3a6cf1f69b80dc33eaf90174c293ef2

```js
  // PARKED (#13 step 4b): the three S4 radius checks below asserted only square corners - law retired by Nick, Nov 1; no successor needed
  // (a retired law, not a falsified check); design is covered by the Wrizors' imply-never-literal review. Kept VERBATIM, never run; the reads stay (the fixture walk is unchanged).
  // ok('S4 (successor to "...border-radius is 0px on a drawer pull"): computed border-radius is 0px on a strip item', stripItemRadius === '0px', stripItemRadius);
```

## Record 3 · from fx1.mjs lines 400-410 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 45ff3fcab3b9fa28454a6a3cdda7114f6e9680db

```js
  // ---- PARKED — SUPERSEDED by item 83 M5 (DR3), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. DR3 retired the Prose|Screenplay
  // tablist, so `.wz-sliver-structure-btn.active` no longer exists and
  // getComputedStyle(null) THREW here rather than failing an assertion.
  // The LAW it guarded is untouched and now stricter: R7 makes menus rest
  // OLIVE, so no resting control in the sliver may be brass. The successor
  // asserts that against the control that replaced the tablist.
  //
  // const structureBtnBg = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-structure-btn.active')).backgroundColor");
  // ok('CD1 S2 (was "S6: the active Structure button\'s computed background is not brass"): the active Structure button (in the sliver) is not brass', structureBtnBg !== 'rgb(255, 152, 0)', structureBtnBg);
  // ------------------------------------------------------------------
```

## Record 4 · from fx1.mjs lines 430-441 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 45ff3fcab3b9fa28454a6a3cdda7114f6e9680db

```js
  // ---- PARKED — SUPERSEDED by item 83 M4 (R5), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. R5 makes the foot exactly TYPEWRITER
  // / PROGRESS / FULL SCREEN, and the Typewriter became a MENU-OPENING
  // instrument with its own glyph - `.typewriter-toggle` no longer renders
  // in the sliver at all, so getComputedStyle(null) THREW here. The LAW is
  // unchanged and now stricter under R7 (menus rest olive, brass is press
  // only); the successor asserts it against the instrument that replaced it.
  //
  // const typewriterGlyphColor = await app.evalJs("getComputedStyle(document.querySelector('.typewriter-toggle')).color");
  // ok('SC1 S3 (was "S6: the Typewriter glyph\'s computed color is not brass", measured on a script page): the Typewriter glyph is not brass at rest — asserted on PROSE now, the surface that still carries it; S6\'s law is unchanged, only its address moved',
  // typewriterGlyphColor !== 'rgb(255, 152, 0)', typewriterGlyphColor);
  // ------------------------------------------------------------------
```

## Record 5 · from fx1.mjs lines 584-590 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- RE-PARKED, generation 2, by page-size's park audit (Oct 24): a fresh prose page now opens in the Typewriter ZOOM (Arbor's default), where
    // the writing line is held at the band's anchor - 60% of the column (Cursor's mockup, e3c4e462; pageScale.ts ZOOM_ANCHOR) - and the first line
    // starts there (lane 3 read 0.6002). The gen-1 record, VERBATIM, no longer runs (its "double supersession" precedent is quoted above at S1 script).
    //
    // pok('PARKED (was "S1: a fresh prose page\'s first line starts within 40-55% of the stage height") — FX3 S3: the working value moved to a NEW 30-35% band',
    //   startFracParked >= 0.28 && startFracParked <= 0.37, String(startFracParked));
    // ------------------------------------------------------------------
```

## Record 6 · from fx1.mjs lines 592-596 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b85f0e61d61ee6065f5a8c099522ffcfc84de6da

```js
    // ---- RE-PARKED, generation 3: POLISH #10 item 19 (Nick, Oct 25: "seems too low on the screen to start"): the writing line - and a fresh page's first line - is held at the MIDDLE of the visible page, 50% of the column (pageScale.ts ZOOM_ANCHOR), not 60%. The gen-2 record, VERBATIM, no longer runs.
    //
    // pok('PARKED, generation 2 (was gen-1 "PARKED (was \'S1: a fresh prose page\'s first line starts within 40-55% of the stage height\') — FX3 S3: the working value moved to a NEW 30-35% band") — page-size: in the Typewriter zoom (Arbor\'s default) a fresh page\'s first line starts at the band\'s anchor, 60% of the column',
    //   startZoomParked === 'true' && Math.abs(startFracParked - 0.6) <= 0.05, JSON.stringify({ startFracParked, zoom: startZoomParked }));
    // ------------------------------------------------------------------
```

## Record 7 · from fx1.mjs lines 658-666 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- RE-PARKED, generation 2, by page-size's park audit (Oct 24): "prose's own band is unchanged" is falsified by page-size itself - prose is now
    // a letter page too (8.5 page-inches, 620px laid out), painted at the stage's scale and, zoomed, stage-wide in its column (lane 3: 1320px). The
    // gen-1 record, VERBATIM, no longer runs.
    //
    // pok('PARKED (was "S2: the script paper\'s rect matches the prose paper\'s asserted width band [600,800], within 2px of the prose value") — SC1 S1: script is a true 8.5in US Letter page and no longer shares prose\'s measure; prose\'s own band is unchanged',
    //   Math.abs(scriptGeomRectParked.width - 816) <= 1
    //     && proseGeomRectParked.width >= 600 && proseGeomRectParked.width <= 800,
    //   JSON.stringify({ proseGeomRectParked, scriptGeomRectParked }));
    // ------------------------------------------------------------------
```
