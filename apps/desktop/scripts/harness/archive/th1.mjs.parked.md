# Parked records archived from th1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/th1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from th1.mjs lines 93-98 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e1c9d1064ac816596f26e0fcfe68e1f4cbd99ca6

```js
  // SUPERSEDED (item word-diet, Nick) — 'page' itself went invariant
  // ({one:'Pages', many:'Pages'}), so it can no longer DEMONSTRATE the
  // distinct-forms mechanism; 'shelf' (Shelf/Shelves, untouched) takes
  // over as the demonstration term, and 'page's own new invariance gets
  // its own successor check instead of being folded into this one silently.
  // ok('check 2 (R1): t() and tMany() resolve distinct, correct number forms for the same term', lexiconCheck.pageOne === 'Page' && lexiconCheck.pageMany === 'Pages', JSON.stringify(lexiconCheck));
```

## Record 2 · from th1.mjs lines 122-127 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 42cfc2af1a033a56a0d6952fc6dc7f5c9a3756ed

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a + step 2 (Fable's rulings Oct 19; chat 1's ledger 114 routed this): the Drawers item is found by NAME (position 3 now holds Library).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // const drawersRailLabel = await app.evalJs("document.querySelectorAll('.desk-rail-item .desk-rail-label')[3]?.textContent");
  // const drawersLexiconMany = await app.evalJs("window.wrizoLexicon.tMany('drawer')");
  // ok('check 2 (R1): DeskRail\'s Drawers item now renders via tMany(\'drawer\') — matches the lexicon projection exactly', drawersRailLabel === drawersLexiconMany, `${drawersRailLabel} vs ${drawersLexiconMany}`);
```
