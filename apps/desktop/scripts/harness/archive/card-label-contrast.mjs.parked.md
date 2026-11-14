# Parked records archived from card-label-contrast.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/card-label-contrast.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from card-label-contrast.mjs lines 161-164 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 1d86f88a0dbd2d30e0ea6a1910ea913ee364e3c3

```js
  // ---- PARKED - SUPERSEDED by Nick's live note (Oct 23: "any remaining green is lime, never Arbor olive"): Flux's pin badge on a cream sheet is teal (#0A6B86), not Arbor's olive (#4F5730), so the badge is one value per THEME, no longer one value in every tone. The meta ink is still one un-themed value.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('C4: the same two values resolve in every tone - one un-themed ink, not three coincidences', seen.size === 1, JSON.stringify([...seen]));
```

## Record 2 · from card-label-contrast.mjs lines 166-169 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6cb82782b18eafdd34be3064f2fab2622afa6d69

```js
  // ---- PARKED - SUPERSEDED by the Flux glass cards (Fable, Oct 22-23: a card, its pop-up and the deck wizard are dark glass under Flux, in both tones): Flux's card is glass now, so its badge ink is cyan #57D0F5 and its meta ink the glass meta #8FD6EE: each is one value per THEME (Arbor's browns in Arbor, Flux's glass inks in both Flux tones).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('C4 [flux-inputs successor]: --ink-on-card-meta is ONE un-themed ink in every tone, and --badge-on-card is one value per theme - Arbor\'s olive #4F5730 in Arbor, Flux\'s teal #0A6B86 in both Flux tones (never Arbor\'s olive under Flux)', new Set(seenVars.map((v) => v.meta)).size === 1 && seen.size === 2 && new Set(seenVars.map((v) => v.badge)).size === 2 && seenVars.some((v) => v.badge === '#4F5730') && seenVars.some((v) => v.badge === '#0A6B86'), JSON.stringify([...seen]));
```
