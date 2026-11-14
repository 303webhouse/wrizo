# Parked records archived from page-size.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/page-size.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from page-size.mjs lines 291-297 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
  // ---- PARKED - SUPERSEDED by Fable's C ruling (Nick, Oct 24): characters per line belong to the FACE, not the page. Machina's face set 61 on the same
  // column where Arbor and Flux set ~75 (lane 3, d80010ae); the page's claim is the COLUMN, and I (below) holds the text column's width identical across
  // skins. Machina at 61 is accepted for #7 (its default face moves to Source Sans 3, ~72, in the fonts ticket). Kept VERBATIM and no longer run;
  // successor follows; one record per skin and size in the parked section.
  //
  // ok(`${th.name} ${w}x${h} C: at the default, the median full line holds ${CPL_MIN}-${CPL_MAX} characters (~75)`, cPred(lines), J({ median: median(lens), lines: lens.length, sample: lens.slice(0, 8) }));
  // ------------------------------------------------------------------
```

## Record 2 · from page-size.mjs lines 449-452 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b85f0e61d61ee6065f5a8c099522ffcfc84de6da

```js
      // ---- PARKED - SUPERSEDED by POLISH #10 item 19 (Nick, Oct 25: "seems too low on the screen to start"): the writing line - and a fresh page's first line - is held at the MIDDLE of the visible page, 50% of the column (pageScale.ts ZOOM_ANCHOR), not 60%: the name says the line is held at 60%. Kept VERBATIM and no longer run; record in the parked section.
      //
      // ok(`${tag} MW (mutant): with the band's anchor moved up to 25% while the line is held at 60% (LANDED: --tw-anchor ${landedW}), W fails`, landedW === '25%' && !(sw[0].s >= FULL), J(sw[0]));
      // ------------------------------------------------------------------
```

## Record 3 · from page-size.mjs lines 728-754 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
      // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the empty page's beginnings row's only door) and the
      // first-line invite are deleted, so an empty zoomed page has no row to place. BR and its MBR mutant are kept VERBATIM and no
      // longer run; their records are in the parked section; the successor follows.
      // const br = await app.evalJs(brProbe);
      // ok('BR (Arbor 1366x768, an empty page, zoomed): the beginnings row sits wholly BELOW the writing line, and on screen - a press on the line can never land on a door',
      //   !!br && br.row && br.zoom === 'true' && br.rowTop >= br.lineBottom - 0.5 && br.rowBottom <= br.vh, J(br));
      // await app.evalJs("window.__psStyle('ps-mbr', \".wz-beginnings[data-beginnings='page']{ top:50% !important; transform:translateY(-50%) !important; }\")"); await sleep(250);
      // const mbr = await app.evalJs(brProbe);
      // await app.evalJs("window.__psStyle('ps-mbr', null)");
      // // ---- PARKED - SUPERSEDED by POLISH #10 item 5 (Nick, Oct 25: in the zoom the ink sheet covers the visible page): "the sheet's centre" was the writing
      // // line only while the zoomed sheet was one line tall; it now lies below the line (FIX's turn on e2ebe51d: LANDED 530 -> 777, the line 467-510), so
      // // the mutant no longer covers it. Kept VERBATIM and no longer gating; its reading is recorded per run in the parked section.
      // //
      // // ok(`MBR (mutant): with the row put back on the sheet's centre (LANDED: its top ${br && br.rowTop} -> ${mbr && mbr.rowTop}), it covers the line - BR fails`,
      // //   !!mbr && !!br && mbr.rowTop !== br.rowTop && !(mbr.rowTop >= mbr.lineBottom - 0.5), J({ now: br, mutated: mbr }));
      // // ------------------------------------------------------------------
      // psParks.MBR = { now: br, mutated: mbr };
      // // SUCCESSOR: the row moved ONTO the writing line itself (its top to the line's top, in the row's own layout px at the painted scale) - BR must fail
      // const mv = br && br.row ? await app.evalJs(`(() => { const row = document.querySelector('.wz-beginnings[data-beginnings="page"]'); if (!row) return null; const p = row.closest('.mode-page');
      //   const k = p && p.offsetWidth ? p.getBoundingClientRect().width / p.offsetWidth : 1; return (${br.lineTop} - row.getBoundingClientRect().top) / k; })()`) : null;
      // if (mv != null) await app.evalJs(`window.__psStyle('ps-mbr2', ".wz-beginnings[data-beginnings='page']{ translate: 0 ${mv}px !important; }")`);
      // await sleep(250);
      // const mbr2 = await app.evalJs(brProbe);
      // await app.evalJs("window.__psStyle('ps-mbr2', null)");
      // ok(`MBR (mutant) [polish #10 item 5 successor]: with the row moved onto the writing line (LANDED: its top ${br && br.rowTop} -> ${mbr2 && mbr2.rowTop}, the line ${br && br.lineTop}-${br && br.lineBottom}), it covers the line - BR fails`,
      //   !!mbr2 && !!br && Math.abs(mbr2.rowTop - br.lineTop) <= 2 && !(mbr2.rowTop >= mbr2.lineBottom - 0.5), J({ now: br, mutated: mbr2, moveLayoutPx: mv }));
      // ------------------------------------------------------------------
```
