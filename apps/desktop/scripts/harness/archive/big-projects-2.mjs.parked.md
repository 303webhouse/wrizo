# Parked records archived from big-projects-2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/big-projects-2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from big-projects-2.mjs lines 155-158 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 055cd2ba4bf2c4b01b54cf75a772099207ead381

```js
// ---- PARKED - SUPERSEDED by W3 change 5 (Fable, Oct 23): the Presets list is presetDecks - the library itself, with From my pages moved first under Arbor - so the pin that read "DECKS.map(" reads that.
// Kept VERBATIM below and no longer run; the live successor follows.
//
// ok('Q5 the presets ARE the deck library: the pop-out imports DECKS and names each row by the deck\'s own nameTerm - there is no second list of deck names', /import \{ DECKS \} from '\.\.\/decks\/library'/.test(popout) && /DECKS\.map\(/.test(popout) && /deck\.nameTerm/.test(popout), '');
```

## Record 2 · from big-projects-2.mjs lines 212-219 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e4929b116f6e20c1c631e81c073ecd6f3cce066

```js
    // ---- PARKED - SUPERSEDED by W3, guided paths (Nick / Fable, Oct 23): the presets are thirteen decks now (the seven live + the six Tier 1 additions), still in the library's own order.
    // Kept VERBATIM below and no longer run; the live successor follows (scripts/harness/guided-w3.mjs carries the new law).
    //
    // ok('Y1 the presets are the seven decks, in the library\'s own order', !!y1 && same(y1.presets, ['three-act', 'worldbuilding', 'feature-screenplay', 'thesis', 'grant', 'feature-story', 'character-study']), JSON.stringify(y1 && y1.presets));
    // ---- PARKED - SUPERSEDED by Fable's Oct 23 ruling on From my pages (change 5): the presets are fourteen decks now and Arbor leads with From my pages (the pantser's door); the rest keep the library's own order.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // ok('Y1 the presets are the thirteen decks, in the library\'s own order [guided-w3 successor]', !!y1 && same(y1.presets, ['three-act', 'worldbuilding', 'feature-screenplay', 'thesis', 'grant', 'feature-story', 'character-study', 'hero-journey', 'story-circle', 'scene-sequel', 'argument-essay', 'research-paper', 'business-proposal']), JSON.stringify(y1 && y1.presets));
```

## Record 3 · from big-projects-2.mjs lines 279-282 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e4929b116f6e20c1c631e81c073ecd6f3cce066

```js
    // ---- PARKED - SUPERSEDED by W3, guided paths (Nick / Fable, Oct 23): the board's load-a-deck door says Presets (Presets = decks, Templates = page dress - Nick, B1; W3 brief section 5).
    // Kept VERBATIM below and no longer run; the live successor follows (scripts/harness/guided-w3.mjs carries the new law).
    //
    // ok('Y7 ...by those words', same(labels, ['New Card', 'Templates', 'Connect Pages']), JSON.stringify(labels));
```
