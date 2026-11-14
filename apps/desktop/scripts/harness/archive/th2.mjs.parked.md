# Parked records archived from th2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/th2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from th2.mjs lines 65-73 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 639803fd30981d202d46d17f677fb55896444557

```js
  // ---- PARKED - SUPERSEDED by FLUX V2 (Fable's brief, Nick Oct 21): the ground is now #020c10 (the blue-black of the new shell).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('check 1: ground token is Flux\'s #04141A', tokenSpots.ground.toLowerCase() === '#04141a', tokenSpots.ground);
  // ---- PARKED - SUPERSEDED by the hue-212 pass (Nick picked option B, Fable Oct 23): the ground is now #010811 and the line #193556 (hue 212).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('check 1 [flux-v2 successor]: ground token is Flux\'s #020c10', tokenSpots.ground.toLowerCase() === '#020c10', tokenSpots.ground);
  // ok('check 1: line token is Flux\'s #1D4A52', tokenSpots.line.toLowerCase() === '#1d4a52', tokenSpots.line);
```

## Record 2 · from th2.mjs lines 84-87 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 1e4d9c92726d836a535d23418d57e1d6b0322e84

```js
// ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: theme default writing faces - Flux's default writing face is Titillium Web) ----
  // The ORIGINAL pinned Flux's --font-proseSerif to Crimson Pro (voice continuity). Kept VERBATIM below, no longer run; the successor follows and the original is a PARKED RECORD.
// ok('check 1: proseSerif stays Crimson Pro (voice continuity, canon §4)', tokenSpots.proseSerif.includes('Crimson Pro'), tokenSpots.proseSerif);
// ------------------------------------------------------------------
```

## Record 3 · from th2.mjs lines 95-102 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 639803fd30981d202d46d17f677fb55896444557

```js
  // ---- PARKED - SUPERSEDED by FLUX V2 (Fable's brief, Nick Oct 21): the dark page is the dark glass #0E1C24 with text #E8F6FA.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('check 1: Page:dark applies Flux\'s dark pair (#0B2429 / #E3F1EC)', pageDark.paper.toLowerCase() === '#0b2429' && pageDark.ink.toLowerCase() === '#e3f1ec', JSON.stringify(pageDark));
  // ---- PARKED - SUPERSEDED by the hue-212 pass (Nick picked option B, Fable Oct 23): the dark page is now #0C1826 (text #E8F6FA unchanged).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('check 1 [flux-v2 successor]: Page:dark applies Flux\'s dark-glass pair (#0E1C24 / #E8F6FA)', pageDark.paper.toLowerCase() === '#0e1c24' && pageDark.ink.toLowerCase() === '#e8f6fa', JSON.stringify(pageDark));
```

## Record 4 · from th2.mjs lines 106-109 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 071ed058d75869eea9dfce21085b882a0cc20601

```js
  // ---- PARKED - SUPERSEDED by FLUX V2 (Fable's brief, Nick Oct 21): the light page is #F4F7F8 with text #042632 (the chrome stays dark).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('check 1: Page:light applies Flux\'s light pair (#EDF6F3 / #14231F)', pageLight.paper.toLowerCase() === '#edf6f3' && pageLight.ink.toLowerCase() === '#14231f', JSON.stringify(pageLight));
```

## Record 5 · from th2.mjs lines 161-164 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 05fb94522fe3e3a83e1f490f1fca9d62fea29bcc

```js
  // SUPERSEDED (theme-leftovers, Nick approved Oct 16): "Overclock" retired
  // for "Wire In" (themeLexicon.ts's own Flux freewrite override). Kept
  // verbatim, no longer run:
  //   ok('check 2: the Free-write tab renders Flux\'s "Overclock" (ModeSwitcher sweep)', tabLabel === 'Overclock', String(tabLabel));
```

## Record 6 · from th2.mjs lines 173-176 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2f7861ab791defdcc5ebd8e191cd83df4645100c

```js
  // SUPERSEDED (item arbor-quiet-brass): themeLexicon.ts's Flux `publish` override
  // renamed "Connect" -> "Uplink" (Fable's proposal) so it stops colliding with the
  // board-connection family's new Flux word "Link".
  // ok('check 2: the Publish dialog renders Flux's "Connect"', publishDialogTitle === 'Connect', String(publishDialogTitle));
```

## Record 7 · from th2.mjs lines 524-541 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in ebb4127ecdaba8f81961d75a14cbc47afaa9d29e

```js
// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// B1 (2026-07-19) is the first tenant of this scaffold. Quoted verbatim
// below (the exact code that lived in this file's own live check 2 section
// before this park):
//
//   "canonical route /journal still resolves under Flux (URL stays
//   canonical)"
//     ok('check 2: canonical route /journal still resolves under Flux
//       (URL stays canonical)',
//       (await app.evalJs('location.hash')).includes('/journal'),
//       await app.evalJs('location.hash'));
//
// B1 S5 — pages/Journal.tsx (the room this route used to render) is
// deleted; '/journal' now find-or-creates the Journal Board and redirects
// (App.tsx's JournalBoardGate) — the URL deliberately does NOT stay
// '/journal' anymore; that IS the new canonical behavior (retirement-by-
// replacement), not a regression. Live successor: b1.mjs's own retirement
// check (old links re-point, no 404 hole).
```
