# Parked records archived from flux-v2-part2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/flux-v2-part2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from flux-v2-part2.mjs lines 207-209 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79b8a03b03705d8bd5811a99b8857934a36f5a61

```js
      // ---- PARKED - SUPERSEDED by polish #10 item 12 (INK, Nick accepted it via Fable, Oct 29): a Flux card marks its first line by COLOUR ONLY - the capitals + letter-spacing + chrome font made the line wider, it wrapped, and the auto-grow made the Flux card taller than the Arbor one. F13 is kept VERBATIM below and no longer run; successor next.
      //
      // ok('F13 a board card is a dark-glass node: dark fill (not Arbor cream), a thin cyan edge, light ink, and a cyan UPPERCASE first line', !!nd && nd.lum < 0.15 && /0,\s*194,\s*255/.test(nd.border) && nd.titleColor === 'rgb(87, 208, 245)' && nd.titleCase === 'uppercase', JSON.stringify(nd));
```

## Record 2 · from flux-v2-part2.mjs lines 231-232 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f92cf064511359d327f86503661bfdf80dcd18b0

```js
      // ---- PARKED - SUPERSEDED by POLISH #10 item 14 (Nick/Fable, Oct 25: the rail's place label stays on ONE line with an ellipsis; the full name on hover/focus). Kept VERBATIM and no longer run; its successor follows.
      // ok('F14 the place block reads "RACK ▸ The Late Ferry", wraps (white-space normal, no ellipsis) and nothing is clipped', !!pbk && pbk.text === 'RACK ▸ The Late Ferry' && pbk.ws === 'normal' && pbk.overflow !== 'ellipsis' && !pbk.clipped, JSON.stringify(pbk));
```
