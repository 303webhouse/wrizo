# Parked records archived from item84b.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item84b.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item84b.mjs lines 376-384 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c1e144c31c24ffe0d54e0ff014563138f7dd0643

```js
    // SUPERSEDED (word-diet-layouts, Fable, Oct 15) — this loop ran i < 4
    // against ASKS for every chip, i.e. for i===3 it asserted verbatim:
    //   ok(`S0 [ask 4]: the chip's text is BYTE-EXACT against the build
    //   brief's §2 table — "Look at just this stretch — what's it doing?"`,
    //   st.labels[3] === ASKS[3], ...)
    // Ask 4's own visible face is now the short word "Selection" (Nick's
    // own word, per the mockup) — ASKS[3] is still what it STAGES, proven
    // separately in S2's successor below, not what it shows. Asks 1-3 keep
    // the original byte-exact loop unchanged; i<3, not i<4.
```
