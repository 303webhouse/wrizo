# Parked records archived from guided-w1-part2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/guided-w1-part2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from guided-w1-part2.mjs lines 103-108 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7d5e689a940337a5d0f1aa82b2de052b39b5e419

```js
        // PARKED VERBATIM (W2 landed Oct 26: "Write this" and "Place a page..." are wired through extraDoors, as this check's own name said they would be). The original, kept here and never run:
        //   ok(`[${T}] the doors under the card are Notes only - "Write this" and "Place a page..." are ABSENT until W2 wires them`, same(anatomy.doors, ['notes']), JSON.stringify(anatomy.doors));
        // SUCCESSOR (and the record: scripts/harness/guided-w2-part2.mjs D1 / D2 hold the doors' words in every skin): Notes first, then W2's two doors, in that order. 1 check parked, 1 successor.
        // PARKED VERBATIM (W5 landed Oct 26: Nick's Lit - the writer's own "Mark lit" door - is the LAST door of a Deck's Walk, after W2's two). The successor above, kept here and never run:
        //   ok(`[${T}] the doors under the card are Notes, then W2's Write this and Place a page (SUCCESSOR of the parked "Notes only" check)`, same(anatomy.doors, ['notes', 'write', 'place']), JSON.stringify(anatomy.doors));
        // SUCCESSOR: Notes - Write this - Place a page - (Add scenes... when the step takes it) - Mark lit, LIT LAST. 1 check parked, 1 successor.
```

## Record 2 · from guided-w1-part2.mjs lines 296-297 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8df3c60bd3a6cf1f69b80dc33eaf90174c293ef2

```js
        // PARKED (#13 step 4b): the check below's square / no-blur half is law 3, retired by Nick, Nov 1. Kept VERBATIM, never run; the successor after it keeps the rest (every dressed element present; the rail marks' shape per theme).
        // ok(`[${T}] square edges and no blurred shadow on the Walk card, doors, chevrons, Show-as and stage (computed style); circles only for the rail marks`, ['.walk-card', '.walk-door', '.walk-nav', '.show-as-btn', '.walk-stage'].every((s) => dress[s] && parseFloat(dress[s].radius) === 0 && dress[s].blur === 0) && (theme === 'flux' ? parseFloat(dress.markRadius) === 0 : /50%|\d{2,}px/.test(dress.markRadius || '')), JSON.stringify(dress));   // Arbor's rail marks are circles; Flux's are pixel ticks (square)
```

## Record 3 · from guided-w1-part2.mjs lines 328-329 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8df3c60bd3a6cf1f69b80dc33eaf90174c293ef2

```js
  // PARKED (#13 step 4b): the check below's no-blur half is law 3, retired by Nick, Nov 1. Kept VERBATIM, never run; the successor after it keeps the rest (the stack of sheets, the olive edge).
  // ok('a Deck thumbnail is a stack of three sheets: two hard-edged offset layers behind the top sheet, no blur, an olive edge that reads on the dark pop-out', !!stack && stack.n === 4 && stack.blur === 0 && stack.edge === 'rgb(143, 154, 88)', JSON.stringify(stack));
```
