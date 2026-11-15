# Parked records archived from deck-rows-logic.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/deck-rows-logic.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from deck-rows-logic.mjs lines 61-66 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 47822ce5b70bbb429c490114de29a373ef6db765

```js
// PARKED (Fable, Oct 30, #12b): R9 as first written - SUPERSEDED: a pass on a plain OPEN no longer hands the boxes to rowFit (opening saves nothing); successor R9b. Kept verbatim:
// ok('R9: BoardEditor imports fitDealtRows and the reflow effect hands it the before and the grown boxes', /import \{ fitDealtRows \} from '\.\.\/decks\/rowFit';/.test(src) && /if \(changed\) setBoxes\(fitDealtRows\(boxes, next\)\);/.test(src));
// PARKED (Fable, Oct 30, #12b): R9b as first written - SUPERSEDED: rowFit now applies on screen on a plain open too (never saved on its own); successor R9c. Kept verbatim:
// ok('R9b: BoardEditor imports fitDealtRows and hands it the before and the grown boxes only when a change by the writer is waiting (boxes !== the saved mark); a plain open is corrected on screen with no rowFit', /import \{ fitDealtRows \} from '\.\.\/decks\/rowFit';/.test(src) && /else setBoxes\(fitDealtRows\(boxes, next\)\);/.test(src) && /if \(boxes === lastSavedRef\.current\) \{\s*lastSavedRef\.current = next;\s*setBoxes\(next\);/.test(src));
// PARKED (Fable, Oct 30, #12b / bug 32c): R9c as written - SUPERSEDED: the reflow now also fits cards DOWN (sizedByHand) and ends the pass when nothing changed, so its source shape changed; successor R9d. Kept verbatim:
// ok('R9c: BoardEditor imports fitDealtRows and hands it the before and the grown boxes on EVERY reflow pass (a plain open too: on screen), and moves the saved mark with the result only when no change by the writer is waiting', /import \{ fitDealtRows \} from '\.\.\/decks\/rowFit';/.test(src) && /const fitted = fitDealtRows\(boxes, next\);\s*if \(boxes === lastSavedRef\.current\) lastSavedRef\.current = fitted;\s*setBoxes\(fitted\);/.test(src));
```
