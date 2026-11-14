# Parked records archived from bg2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/bg2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from bg2.mjs lines 150-154 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 42cfc2af1a033a56a0d6952fc6dc7f5c9a3756ed

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a + step 2 (Fable's rulings Oct 19; chat 1's ledger 114 routed this): a board's row has three doors.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('S1: the row is still ONE line, never a grid — every door shares a top edge at the new size (the wrap this ticket had to fix)',
  //   m.oneLine === true && m.doorCount === 4, JSON.stringify({ oneLine: m.oneLine, doorCount: m.doorCount }));
```

## Record 2 · from bg2.mjs lines 170-174 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8fec130d7d8b996e28486a450a4a151bec438486

```js
  // ---- PARKED - SUPERSEDED by board-click-to-create (Nick's faint-starters ruling, Oct 14-15; merged 7b4a3826) ----
  // The BOARD starters rest at opacity 0.4 now (a thin square outline, faint), so "the resting opacity is retired" no longer holds on the board row this check measures.
  // Quoted VERBATIM below. Successor: the check directly below; board-click-create.mjs S3/C7b.
  // ok('S1: the resting opacity is retired — the colour the check measures is the colour the eye sees (no fade blending the assertion into a half-truth)',
  //   parseFloat(m.opacity) === 1, m.opacity);
```

## Record 3 · from bg2.mjs lines 260-279 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the parked section
  // (readings in bg2f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // const pagePlace = await app.evalJs(`(() => {
  //   const row = document.querySelector('.wz-beginnings');
  //   const sheet = document.querySelector('.mode-page');
  //   const r = row.getBoundingClientRect(), s = sheet.getBoundingClientRect();
  //   return { rowMidX: Math.round(r.left + r.width / 2), sheetMidX: Math.round(s.left + s.width / 2),
  //     rowTop: Math.round(r.top), rowBottom: Math.round(r.bottom),
  //     sheetTop: Math.round(s.top), sheetBottom: Math.round(s.bottom),
  //     pointerEvents: getComputedStyle(row).pointerEvents };
  // })()`);
  // ok('S2 (SV19): the page\'s row is centered on the sheet — it reads as a set of modes, not a footnote under the caret (this SUPERSEDES the committee\'s "furniture beside the cursor" by Nick\'s own word)',
  //   Math.abs(pagePlace.rowMidX - pagePlace.sheetMidX) <= 12 &&
  //   pagePlace.rowTop > pagePlace.sheetTop && pagePlace.rowBottom < pagePlace.sheetBottom,
  //   JSON.stringify(pagePlace));
  //
  // ok('S2: the row still never intercepts the surface — pointer-events:none on the container, unchanged by the move',
  //   pagePlace.pointerEvents === 'none', pagePlace.pointerEvents);
  // ------------------------------------------------------------------
```

## Record 4 · from bg2.mjs lines 310-316 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the parked section
  // (readings in bg2f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // const pageContrast = await app.evalJs(CONTRAST_JS);
  // ok(`S2: the door colour carries on the PAGE too — computed WCAG contrast ${pageContrast.ratio}:1 against the sheet (>=4.5)`,
  //   pageContrast.ratio >= 4.5, JSON.stringify(pageContrast));
  // ------------------------------------------------------------------
```

## Record 5 · from bg2.mjs lines 347-355 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
  // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23): the prose page is PAINTED by a transform - at the stage's scale, and ~1.6x in the
  // Typewriter zoom (Arbor's default) - and the beginnings row lives on the page, so its glyph PAINTS 1.6x the board's (lane 3: 38 vs 24px) while its
  // type, colour and layout are identical. The claim - one component, one revision, both surfaces - is the successor's, with the page's glyph read
  // in the page's own units (its painted width divided by the page's paint scale). Kept VERBATIM and no longer run; record in the parked section.
  //
  // ok('S1/S3: the revision was made in ONE place and both surfaces inherited it — identical type, colour, stacking direction and glyph size on page and board',
  //   JSON.stringify(pageStyle) === JSON.stringify(boardStyle) && pageStyle.dir === 'column',
  //   JSON.stringify({ pageStyle, boardStyle }));
  // ------------------------------------------------------------------
```

## Record 6 · from bg2.mjs lines 364-370 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the parked section
  // (readings in bg2f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // ok('S1/S3 [page-size successor]: the revision was made in ONE place and both surfaces inherited it — identical type, colour and stacking direction, and the glyph the same size in each surface\'s own units (the page\'s painted glyph divided by its paint scale, within 1px)',
  //   sameBut(pageStyle, boardStyle) && pageStyle.dir === 'column' && !!pageUnit && !!boardUnit && Math.abs(pageUnit.glyph - boardUnit.glyph) <= 1,
  //   JSON.stringify(bg2Ps.s13));
  // ------------------------------------------------------------------
```

## Record 7 · from bg2.mjs lines 385-389 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6860995b54e9d641d6e22b50c35f7c72687fe1d9

```js
  // ---- PARKED - SUPERSEDED by Nick's live note (Oct 23: "any remaining green is lime, never Arbor olive"): Flux's door colour is no longer Arbor's olive stepped up (#A9B56A); it is the palette's text accent #57D0F5 on the dark glass.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok(`S1: the door olive is SLOTTED, not hardcoded — on the one theme whose paper is dark it steps back up the same ramp (${darkToken}) and still measures ${darkContrast.ratio}:1 (>=4.5). A value that only worked on cream would be a trap laid for this theme`,
  //   darkToken === '#A9B56A' && darkContrast.ratio >= 4.5, JSON.stringify({ darkToken, darkContrast }));
```

## Record 8 · from bg2.mjs lines 411-425 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the parked section
  // (readings in bg2f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // const pageLeg = await app.evalJs(`(() => {
  //   const r = document.querySelector('.wz-beginnings').getBoundingClientRect();
  //   const s = document.querySelector('.mode-page').getBoundingClientRect();
  //   const tops = [...document.querySelectorAll('.wz-beginning')].map((b) => Math.round(b.getBoundingClientRect().top));
  //   return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom),
  //     oneLine: new Set(tops).size === 1, vw: innerWidth, vh: innerHeight,
  //     midX: Math.round(r.left + r.width / 2), sheetMidX: Math.round(s.left + s.width / 2) };
  // })()`);
  // ok('1366x768 leg: the page row fits whole, stays on ONE line (three larger doors, no wrap), and stays centered on the sheet',
  //   pageLeg.left >= 0 && pageLeg.right <= pageLeg.vw && pageLeg.top >= 0 && pageLeg.bottom <= pageLeg.vh &&
  //   pageLeg.oneLine === true && Math.abs(pageLeg.midX - pageLeg.sheetMidX) <= 12, JSON.stringify(pageLeg));
  // ------------------------------------------------------------------
```
