# Parked records archived from item207.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item207.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item207.mjs lines 95-97 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8d1fe490faa13afded488e827e00127af80ac5d4

```js
    // ---- PARKED VERBATIM - SUPERSEDED by TOOLS #14 (Fable, Nov 2: the size box sits between `-` and `+` in EVERY form, small included). Kept below, no longer run; the successor follows. ----
    // ok('FREE WRITE: EXACTLY the smallest form — a face button and a `-` `+` pair (3 buttons), NO number field', fw.buttons === 3 && fw.inputs === 0, JSON.stringify({ buttons: fw.buttons, inputs: fw.inputs }));
    // ------------------------------------------------------------------
```

## Record 2 · from item207.mjs lines 103-105 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 1e4d9c92726d836a535d23418d57e1d6b0322e84

```js
// ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: the font list's first row is "Default (<face>)", and Source Sans 3 + Titillium Web join the roster). Kept VERBATIM below, no longer run; successor follows. ----
    // ok('FREE WRITE: the roster lists the nine faces, in order, and has NO "Add a font…" row (his Q2)', open && JSON.stringify(open.rows) === JSON.stringify(NINE) && !/add a font/i.test(open.text), JSON.stringify(open && open.rows));
    // ------------------------------------------------------------------
```

## Record 3 · from item207.mjs lines 109-111 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 1e4d9c92726d836a535d23418d57e1d6b0322e84

```js
// ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: the font list's first row is "Default (<face>)", and Source Sans 3 + Titillium Web join the roster). Kept VERBATIM below, no longer run; successor follows. ----
    // ok('FREE WRITE: each roster row is SET IN ITS OWN FACE', Array.isArray(rowFonts) && rowFonts.length === 9 && rowFonts.every(([n, f]) => f.replace(/["']/g, '').includes(n === 'Crimson Pro' ? 'Crimson Pro' : n === 'Lora' ? 'Lora' : n === 'EB Garamond' ? 'EB Garamond' : n === 'Source Serif 4' ? 'Source Serif 4' : n)), JSON.stringify(rowFonts));
    // ------------------------------------------------------------------
```

## Record 4 · from item207.mjs lines 120-124 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 570cfe472ad8bfdf6b085b2bbae1757a37f2c897

```js
  // ---- PARKED - SUPERSEDED by font-span (Nick approved the font-choices mockup, cursor/font-choices @ 6cc5f529, 2026-10-15) ----
  // Kept VERBATIM and no longer run. Draft is the mode with styling tools, so its Typeface section now carries the two scopes
  // ("Selection" / "Whole document") over the roster SHOWN as a list - no face button. Record in this file's parked section.
  // ok('DRAFT: the Type control is mounted, full form — a face button, `-` `+` (3 buttons) and ONE number field', !!dr && dr.buttons === 3 && dr.inputs === 1, JSON.stringify(dr && { buttons: dr.buttons, inputs: dr.inputs }));
  // ------------------------------------------------------------------
```

## Record 5 · from item207.mjs lines 128-131 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 0672abb903fc574d7d36fe8d5ea49fc22d2f455f

```js
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 9 (the font list is collapsed by default): the scoped form now has a face button that opens the list. Kept VERBATIM, no longer run:
  // ok('DRAFT [font-span successor]: the Typeface control is the scoped form - "Selection" / "Whole document" over the nine faces shown as a list, `-` `+` and ONE number field, no face button',
  //   !!drScoped && drScoped.buttons === 4 && drScoped.inputs === 1 && !drScoped.faceButton && JSON.stringify(drScoped.scopes) === JSON.stringify(['Selection', 'Whole document']) && drScoped.rows === 9, JSON.stringify(drScoped));
  // ------------------------------------------------------------------
```

## Record 6 · from item207.mjs lines 151-160 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cf2e9d250debbf90e8196ccb5afd1601e3f557d6

```js
  // ---- PARKED - SUPERSEDED by page-size (Fable's ruling a, Oct 23: the page's number is REAL POINTS IN PAGE UNITS - 12 = 16px at page scale 1, a NEW
  // page defaults to 12, and the page LAYS OUT at scale 1 and is PAINTED at its scale by a transform, so the editor's computed size is n x 4/3 px at
  // every screen). An untouched page now writes `calc(12 * var(--wz-pt, 1.33333px))` and computes 16px. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  //
  // ok('11 = TODAY: a page that never chose keeps the editor\'s two prior style strings (`var(--font-prose)` and `calc(17px * var(--paper-scale))`) byte-for-byte',
  //   untouched && untouched.ff === 'var(--font-prose)' && untouched.fs === 'calc(17px * var(--paper-scale))', JSON.stringify(untouched));
  // const scale = await scaleNow(app);
  // const base = await sizeOfEditor(app);
  // ok('11 = TODAY: the untouched editor renders at 17px x the paper scale (computed)', base !== null && Math.abs(base - 17 * scale) < 0.05, `${base}px at scale ${scale}`);
  // ------------------------------------------------------------------
```

## Record 7 · from item207.mjs lines 176-180 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 570cfe472ad8bfdf6b085b2bbae1757a37f2c897

```js
  // ---- PARKED - SUPERSEDED by font-span (the approved mockup, 2026-10-15): Draft has no face button now; the current face is the
  // roster row in brass. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  // ok('LABEL: on a page that never chose, the face button names the face that ACTUALLY renders (the first family the editor computes) and is set in it',
  //   labelNow && labelNow.label === labelNow.rendered && labelNow.buttonFamily === labelNow.rendered, JSON.stringify(labelNow));
  // ------------------------------------------------------------------
```

## Record 8 · from item207.mjs lines 187-191 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 4ebc44d8671dbcf250a7bd2b13ad57b27eb35d9c

```js
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: the list's first row is "Default (<face>)"): on a page that never chose, the brass row is now the DEFAULT row, not a roster row.
  // Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it must now fail, for exactly that reason).
  // ok('LABEL [font-span successor]: on a page that never chose, the BRASS row of the roster names the face that ACTUALLY renders and is set in it',
  // !!brassNow && brassNow.label === brassNow.rendered && brassNow.rowFamily === brassNow.rendered, JSON.stringify(brassNow));
  // ------------------------------------------------------------------
```

## Record 9 · from item207.mjs lines 201-211 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cf2e9d250debbf90e8196ccb5afd1601e3f557d6

```js
  // ---- PARKED - SUPERSEDED by page-size (Fable's ruling a, Oct 23: the page's number is REAL POINTS IN PAGE UNITS - 12 = 16px at page scale 1, a NEW
  // page defaults to 12, and the page LAYS OUT at scale 1 and is PAINTED at its scale by a transform, so the editor's computed size is n x 4/3 px at
  // every screen). The field opens at 12; `+` goes to 13, drawn 13 x 4/3 px; 13 is written. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  //
  // ok('SIZE: the number field opens at 11', (await numAt()) === '11', String(await numAt()));
  // await press(app, "document.querySelectorAll('.wz-type-step')[1]", 'the `+` button');
  // await sleep(300);
  // ok('SIZE: `+` from 11 shows 12, and the editor renders 17 x 12/11 x the scale', (await numAt()) === '12' && Math.abs((await sizeOfEditor(app)) - 17 * (12 / 11) * scale) < 0.06, `${await numAt()} / ${await sizeOfEditor(app)}px`);
  // const r12 = await entryRow(app, 'i207-untouched');
  // ok('SIZE: choosing wrote pageSettings.size = 12 (points, not a step index) and NO face key', r12 && r12.pageSettings && r12.pageSettings.size === 12 && !('face' in r12.pageSettings), JSON.stringify(r12 && r12.pageSettings));
  // ------------------------------------------------------------------
```

## Record 10 · from item207.mjs lines 257-262 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cf2e9d250debbf90e8196ccb5afd1601e3f557d6

```js
  // ---- PARKED - SUPERSEDED by page-size (Fable's ruling a, Oct 23: the page's number is REAL POINTS IN PAGE UNITS - 12 = 16px at page scale 1, a NEW
  // page defaults to 12, and the page LAYS OUT at scale 1 and is PAINTED at its scale by a transform, so the editor's computed size is n x 4/3 px at
  // every screen). Lora at 14 computes 14 x 4/3 px in every mode. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  //
  // ok('EVERY MODE: a page dressed in Lora at 14 renders in Lora at 14 in Free Write, Draft and Revise — identically', Object.values(inMode).every((m) => /Lora/.test(m.family) && Math.abs(m.size - 17 * (14 / 11) * m.scale) < 0.06), JSON.stringify(inMode));
  // ------------------------------------------------------------------
```

## Record 11 · from item207.mjs lines 320-323 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 570cfe472ad8bfdf6b085b2bbae1757a37f2c897

```js
    // ---- PARKED - SUPERSEDED by font-span (the approved mockup's card scene, 2026-10-15): the dock's Typeface control carries the two
    // scopes ("Selection" / "Whole card") over the roster shown as a list - no face button. Kept VERBATIM, no longer run.
    // ok('CARD: the styling dock carries the smallest form — a face button and `-` `+` (3 buttons), no number field', cs && cs.buttons === 3 && cs.inputs === 0, JSON.stringify(cs));
    // ------------------------------------------------------------------
```

## Record 12 · from item207.mjs lines 328-335 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8d1fe490faa13afded488e827e00127af80ac5d4

```js
    // ---- PARKED - SUPERSEDED by TOOLS #10 item 9 (the list is collapsed by default; the scoped form has a face button). Kept VERBATIM, no longer run:
    // ok('CARD [font-span successor]: the dock carries the scoped small form - "Selection" / "Whole card" over the nine faces, `-` `+`, no number field, no face button',
    //   !!csScoped && csScoped.buttons === 4 && csScoped.inputs === 0 && !csScoped.faceButton && JSON.stringify(csScoped.scopes) === JSON.stringify(['Selection', 'Whole card']) && csScoped.rows === 9, JSON.stringify(csScoped));
    // ------------------------------------------------------------------
    // ---- PARKED VERBATIM - SUPERSEDED by TOOLS #14 (Fable, Nov 2: the size box sits between `-` and `+` in EVERY form, small included). Kept below, no longer run; the successor follows. ----
    // ok('CARD [item-9 successor]: the dock carries the scoped small form - "Selection" / "Whole card", a face button (Default + the eleven faces COLLAPSED behind it), `-` `+`, no number field',
    //   !!csScoped && csScoped.buttons === 5 && csScoped.inputs === 0 && csScoped.faceButton && JSON.stringify(csScoped.scopes) === JSON.stringify(['Selection', 'Whole card']) && csScoped.rows === 12, JSON.stringify(csScoped));
    // ------------------------------------------------------------------
```
