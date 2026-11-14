# Parked records archived from bm1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/bm1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from bm1.mjs lines 229-235 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 55a0af5453afeeb3a1f5d307a09741cc9200d2fa

```js
    // ---- PARKED - SUPERSEDED by W1 (the Walk, board kinds and "Show as"; Fable's clear of Oct 25, train #8 red): a Board now offers FOUR views - Open, Storyboard, Outline, Walk - drawn as the "Show as" strip, which REPLACED the three
    // view tabs (the buttons keep the .board-mode-tab class and the data-board-mode-tab attribute, so every selector in this file still finds them). The assertion named the exact three.
    // Kept VERBATIM below and no longer run; the live successor follows. (Park count for this file: 1 assertion, run at three widths = 3 reds on train #8.)
    //
    // ok(`S3 @${width}px: OPEN·STORYBOARD·OUTLINE tabs + PAGE → door present`,
    //   JSON.stringify(bar.tabs) === JSON.stringify(['open', 'storyboard', 'outline']) && bar.doorPresent === true,
    //   JSON.stringify(bar));
```

## Record 2 · from bm1.mjs lines 240-245 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
    // SUPERSEDED (item word-diet, Nick, Oct 13) — boardTelos REMOVE: the
    // standing line is gone whole (BoardEditor.tsx's own `boardTelos` var
    // is now always null); the lexicon's own text is untouched (TELOS
    // still matches it, see the lexicon-sourced check below), simply
    // never rendered.
    // ok(`S3 @${width}px: telos line present, static, exact string`, bar.telosText === TELOS, `telos=${bar.telosText}`);
```

## Record 3 · from bm1.mjs lines 250-252 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6ba919fdc9606dab283aaf745dd002ecff4422e0

```js
  // ---- PARKED - RETIRED by #13 step 11 (Fable, Nov 5): the telos line is removed (word-diet, S3 [word-diet successor] above), so its word
  // is retired UI that no source reads, and step 11 deletes boardTelos from the lexicon. Kept VERBATIM and no longer run; record in the parked block.
  // ok('S3 telos is lexicon-sourced (deskLexicon boardTelos)', telosLex === TELOS, `lex=${telosLex}`);
```

## Record 4 · from bm1.mjs lines 389-405 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
  // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
  // Lines are drawn ONLY in connection mode now (no resting hairline at all): a board with a link shows nothing between its cards at rest.
  // Quoted VERBATIM below. Successor: the check directly below (the link persists as a connection box; no line at rest); the in-mode brass line is connector-a.mjs C4.
  // const link = await app.evalJs(`(() => {
  //   const line = document.querySelector('.board-connection-line');
  //   if (!line) return { present: false };
  //   const svg = document.querySelector('.board-connections');
  //   const card = document.querySelector('.board-card, [data-box-id]');
  //   const stroke = getComputedStyle(line).stroke;
  //   // orange has R markedly > G > B; assert NOT orange (olive/neutral: G >= R)
  //   const m = stroke.match(/rgb[a]?\\(([0-9.]+),\\s*([0-9.]+),\\s*([0-9.]+)/);
  //   const isOrange = m ? (Number(m[1]) > 180 && Number(m[2]) < Number(m[1]) * 0.7 && Number(m[3]) < 100) : false;
  //   const svgZ = svg ? (getComputedStyle(svg).zIndex) : null;
  //   return { present: true, stroke, isOrange, svgZ };
  // })()`);
  // ok('S5 linking: the connection (v1 link) renders as a line beneath cards (SVG layer, z-auto), nothing orange at rest',
  //   link.present === true && link.isOrange === false, JSON.stringify(link));
```
