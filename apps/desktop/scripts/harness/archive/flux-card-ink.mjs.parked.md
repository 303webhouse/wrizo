# Parked records archived from flux-card-ink.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/flux-card-ink.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from flux-card-ink.mjs lines 119-136 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 73ddd34406ead79312a796fb0c1d663b431a87e4

```js
      // SUPERSEDED (faint-text-sweep, Fable Oct 16: "the -low tier you
      // flagged" - this file's own C3 comment, just above, is where that
      // flag was made). Kept verbatim, no longer run - the premise it
      // asserted ("pre-existing, not this ticket's fix", floored at a bare
      // 3.5 for Plateau/Flux-light) is false now that --ink-on-paper-low
      // itself is darkened: those two tones carry the identical FLOOR
      // branch flux/dark already used, below.
      //   if (theme === 'flux' && page === 'dark') {
      //     ok(`${T} C3: the pop-up's eyebrow label carries against its stock (computed ${eyebrowC?.ratio}:1, >= ${FLOOR})`, !!eyebrowC && eyebrowC.ratio >= FLOOR, JSON.stringify(eyebrowC));
      //     ok(`${T} C3: the pop-up's close-X carries against its stock (computed ${closeC?.ratio}:1, >= ${FLOOR})`, !!closeC && closeC.ratio >= FLOOR, JSON.stringify(closeC));
      //   } else {
      //     const PRE_EXISTING_FLOOR = 3.5; // below even Arbor's own pre-existing ~3.77:1 would be a real regression
      //     ok(`${T} C3 (pre-existing, not this ticket's fix): the eyebrow label's own baseline contrast holds (computed ${eyebrowC?.ratio}:1, >= ${PRE_EXISTING_FLOOR})`, !!eyebrowC && eyebrowC.ratio >= PRE_EXISTING_FLOOR, JSON.stringify(eyebrowC));
      //     ok(`${T} C3 (pre-existing, not this ticket's fix): the close-X's own baseline contrast holds (computed ${closeC?.ratio}:1, >= ${PRE_EXISTING_FLOOR})`, !!closeC && closeC.ratio >= PRE_EXISTING_FLOOR, JSON.stringify(closeC));
      //   }
      // Successor (faint-text-sweep): --ink-on-paper-low/--ink-on-card-low
      // now clear 4.5:1 on --card-stock in every tone, so every tone gets
      // the SAME floor flux/dark already had - no more per-tone branch.
```

## Record 2 · from flux-card-ink.mjs lines 184-191 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6cb82782b18eafdd34be3064f2fab2622afa6d69

```js
    // ---- PARKED - SUPERSEDED by the Flux glass cards (Fable, Oct 22-23: a card, its pop-up and the deck wizard are dark glass under Flux, in both tones): under Flux the card ink is the glass-card ink (#E8F6FA / #57D0F5) in BOTH tones, so it neither aliases nor diverges from the page ink by tone; Arbor still aliases.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // const shouldAlias = !(theme === 'flux' && page === 'dark');
    // ok(`${T} C4: --ink-on-card ${shouldAlias ? 'aliases' : 'diverges from'} --ink-on-paper (${vars.card} vs ${vars.paper})`,
    //   shouldAlias ? vars.card === vars.paper : vars.card !== vars.paper, JSON.stringify(vars));
    // ok(`${T} C4: --ink-on-card-low ${shouldAlias ? 'aliases' : 'diverges from'} --ink-on-paper-low (${vars.cardLow} vs ${vars.paperLow})`,
    //   shouldAlias ? vars.cardLow === vars.paperLow : vars.cardLow !== vars.paperLow, JSON.stringify(vars));
```
