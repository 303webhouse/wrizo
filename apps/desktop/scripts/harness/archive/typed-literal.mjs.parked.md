# Parked records archived from typed-literal.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/typed-literal.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from typed-literal.mjs lines 159-166 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c0499cc930ca4e4a32c4093fb81fe3502d057919

```js
    // ---- PARKED - SUPERSEDED by in-app-copy-format's copy half (Fable, Oct 16; one deploy with typed-literal): a copy now writes the PLAIN
    // characters, so the writer's own `**bold**` is copied as `bold` - there are no stars left to paste. Kept VERBATIM and no longer run;
    // successors below (and L5b, which still pastes literal stars, from a page whose stars were TYPED).
    // ok('L5: a pasted `**` is LITERAL - the pasted copy is stored escaped and the saved bold before it is untouched',
    //   unz(st5) === `${MINE} Mine ${B}*${B}*bold${B}*${B}* words`, JSON.stringify(st5));
    // ok('L5: ...so the page shows the pasted stars and still exactly one bold run (the original): the in-app round trip loses formatting until in-app-copy-format',
    //   !!s5 && s5.bold === 1 && s5.visible === 'Mine bold words Mine **bold** words', JSON.stringify(s5));
    // ------------------------------------------------------------------
```

## Record 2 · from typed-literal.mjs lines 168-174 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b184d3afb0bc8ff6b1fbf2b9ced2d9f6f608fe3a

```js
    // ---- PARKED - SUPERSEDED by in-app-copy-format's paste half (Fable, Oct 16): the copy's Wrizo markup now comes back with the paste, so
    // the writer's own `**bold**` pastes back bold. Kept VERBATIM and no longer run; successors below.
    // ok('L5 [copy-half successor]: own words copied and pasted back arrive as their PLAIN characters - nothing to escape, and the saved bold before them untouched (the formatting comes back with the paste half)',
    //   unz(st5) === `${MINE} Mine bold words`, JSON.stringify(st5));
    // ok('L5 [copy-half successor]: ...so the page shows the words twice and still exactly one bold run (the original)',
    //   !!s5 && s5.bold === 1 && s5.visible === 'Mine bold words Mine bold words', JSON.stringify(s5));
    // ------------------------------------------------------------------
```

## Record 3 · from typed-literal.mjs lines 247-254 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 22225575db855ad103053280e1317d280405babf

```js
  // ---- PARKED - SUPERSEDED (ledger 87, Oct 17): the check was wrong, not the caret. The script types ` *three* ` (stored `\*three\* `), then
  // two ArrowLefts - and the arrows move by VISIBLE characters (item 211 rule 2), the escape `\*` being ONE: past the trailing space, then
  // past the closing `*`, which leaves the caret between `three` and `\*`. So `_y_` lands INSIDE the stars - `\*three\_y\_\*` - exactly
  // as the combined pair stored it, at both speeds. The `\*three\*` substring could never hold for this script. Kept VERBATIM and no longer
  // run; successor below: the whole text, exactly.
  // ok('L8: ...and that text holds both the Ctrl+B bold and the escaped literals', typeof results.burst === 'string' && results.burst.includes('**two**')
  //   && results.burst.includes(`${B}*three${B}*`) && results.burst.includes(`${B}_y${B}_`), JSON.stringify(results.burst));
  // ------------------------------------------------------------------
```

## Record 4 · from typed-literal.mjs lines 284-290 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b184d3afb0bc8ff6b1fbf2b9ced2d9f6f608fe3a

```js
  // ---- PARKED RECORDS - SUPERSEDED by in-app-copy-format's paste half: these re-verified the copy half's truth (a plain paste-back), which
  // the paste half changes. Kept VERBATIM and no longer run; successor records directly below.
  // pok('PARKED (was "L5: a pasted `**` is LITERAL - the pasted copy is stored escaped and the saved bold before it is untouched") - the copy half writes plain characters; live successor: L5 [copy-half successor] and L5b',
  //   a.st5 === 'Mine **bold** words Mine bold words', JSON.stringify(a));
  // pok('PARKED (was "L5: ...so the page shows the pasted stars and still exactly one bold run (the original): the in-app round trip loses formatting until in-app-copy-format") - live successor: L5 [copy-half successor]',
  //   !!a.s5 && a.s5.bold === 1 && a.s5.visible === 'Mine bold words Mine bold words', JSON.stringify(a));
  // ------------------------------------------------------------------
```
