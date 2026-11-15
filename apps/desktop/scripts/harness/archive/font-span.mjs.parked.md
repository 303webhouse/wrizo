# Parked records archived from font-span.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/font-span.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from font-span.mjs lines 101-104 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5423727dd71e1613503cd98384f052d4995f089a

```js
    // ---- PARKED - SUPERSEDED by FLUX V2 (the full pair on 21e18ae3, Fable's ruling Oct 22): a chosen row reads the theme's --choice (brass in Arbor, cyan #00C2FF in Flux; brass itself is locked), so the check compares to --choice.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // ok(`${T} PAGE: the picked face's row is the one in brass`, !!s2 && s2.current.length === 1 && s2.current[0].name === 'Atkinson Hyperlegible' && s2.current[0].color === s2.brass, JSON.stringify(s2));
```
