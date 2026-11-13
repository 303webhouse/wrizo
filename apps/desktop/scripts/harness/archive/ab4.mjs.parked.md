# Parked records archived from ab4.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/ab4.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from ab4.mjs lines 193-211 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2a97482981b0e80b676a3de2cedbcb515c218f9a

```js
    // PW1 (2026-09-08) — THREE MORE CHECKS PARKED HERE, all from item 125's
    // one ruling: MEMBERSHIP IS NOT DISPLAY.
    //
    // (1) The membership LINE's wording changed (Fable's ruling 4): "pinned"
    //     named the card, and a member may now have no card at all.
    // (2)+(3) The UNPIN journey below selected the pin-card ON THE CANVAS and
    //     pressed Remove. A freshly-made membership is no longer displayed
    //     (`onCanvas: false`, written explicitly), so there is no card there to
    //     select — the bare `document.querySelector(...).dispatchEvent(...)`
    //     threw on null and ABORTED THE WHOLE FILE, which is exactly the driver
    //     hazard the standing law names. The unpin MECHANIC is unchanged; only
    //     its precondition is new, and the successors prove precisely that by
    //     displaying the membership first.
    //
    // ORIGINAL, QUOTED VERBATIM AND NO LONGER ASSERTED (A4):
    //   ok('S2: the Page face\'s home block gains a truthful "Also pinned to <board>." membership line',
    //     membership.some((m) => m === 'Also pinned to AB4 Target Board.'), JSON.stringify(membership));
    // SUPERSEDED (item arbor-quiet-brass): "Connected" renamed to Arbor's own "Grafted".
    // ok('S2 (PW1/ruling 4 successor of "the Page face\'s home block gains a truthful \\"Also pinned to <board>.\\" membership line"): the line now reads "Also connected to <board>." — one connecting word across the Plan heading, the Places zone and this prose line, because a member may have no card on the wall at all', membership.some((m) => m === 'Also connected to AB4 Target Board.'), JSON.stringify(membership));
```

## Record 2 · from ab4.mjs lines 312-333 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 66baf6bdc2029b3490a069701fd24b072619684d

```js
    // ---- SUPERSEDED IN PLACE BY ITEM 138 (2026-09-24) — LIVE SUCCESSOR BELOW ----
    // Quoted VERBATIM and no longer asserted:
    //
    //   ok('S4: dragging the corner resizes a page-pin card freeform on BOTH axes (no aspect lock, unlike ink)',
    //     afterDrag.w > before.w && afterDrag.h > before.h, JSON.stringify({ before, afterDrag }));
    //
    // WHAT CHANGED: item 138 gives a page-pin an aspect lock ON RESIZE — the
    // height is now derived from the new width, at the aspect of the PINNED
    // ENTRY's kind (page → vertical, board → horizontal). The "freeform on both
    // axes" half is false for this box kind; the resize itself, and the fact that
    // both axes change, are unaffected, which is what the successor asserts.
    //
    // ⚠ AND IT DID NOT GO RED, WHICH IS THE PART WORTH RECORDING. The condition
    // `afterDrag.h > before.h` is satisfied just as well by the lock as by
    // freeform — under the lock the height becomes w × 1.375, larger either way.
    // So a check whose NAME asserted the ABSENCE of an aspect lock sailed through
    // the arrival of one: green about something else. A name and a condition that
    // can disagree this quietly is the failure mode, not the ticket.
    //
    // LIVE SUCCESSOR for the surviving half: below. For the aspect law itself —
    // and for the discriminating drag that ab4's condition could never be (dy = 0,
    // and the height moves anyway) — see item138.mjs, C4.
```

## Record 3 · from ab4.mjs lines 640-654 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 268a71b56a0d4f7db96cd5d5d4301daf819671e0

```js
      // ---- PARKED, GENERATION 1 — SUPERSEDED by PW2's S2 amendment, 2026-09-13 ----
      // Quoted VERBATIM and no longer asserted (A4). Nick renamed the membership
      // section's heading from "Pages linked to this board" to "Pages" ("section
      // off Boards from Pages clearly"), so the final conjunct is false by ruling.
      // Every other conjunct is untouched and still pinned in generation 2 below.
      //
      // pok(`PARKED (was "S1 @ ${width}px: picking a board swaps the survey column to ITS OWN cards (large thumbnails: title/excerpt, or \\"A sketch\\" for ink) with a quiet back affordance") — PW1 S2: unchanged mechanic reached through the new door, and the column now reads in TWO SECTIONS (Q4) with the cards in the board's own y-then-x arrangement (Q14)`,
      //   cardsView.title === 'AB4 Survey Board' && cardsView.hasBack
      //   && cardsView.cardTitles.includes('Card One')
      //   && cardsView.cardTitles.includes('A sketch')
      //   && cardsView.cardTitles.some((t) => t.includes('AB4 Card Target Page'))
      //   && cardsView.sections.includes('Cards') && cardsView.sections.includes('Pages linked to this board'),
      //   JSON.stringify(cardsView));
      // ------------------------------------------------------------------------
      // GENERATION 2 (PW2 S2 amendment) — the same claim against Nick's heading.
```
