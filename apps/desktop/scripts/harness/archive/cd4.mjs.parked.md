# Parked records archived from cd4.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/cd4.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from cd4.mjs lines 131-133 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e1c9d1064ac816596f26e0fcfe68e1f4cbd99ca6

```js
    // SUPERSEDED (item word-diet, Nick) — boardPageDoor reworks, "Page" -> "Pages".
    // ok(`S1: the ${name} Board's door reads exactly "Page →" (one door grammar, no system-board dialect)`,
    //   ex.doorLabel === 'Page →', String(ex.doorLabel));
```

## Record 2 · from cd4.mjs lines 197-204 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 4986b0de6ab7c85390f03fb0e382678f542e4cf3

```js
  // ---- PARKED - SUPERSEDED by the framed-desk display pass (aa11f58, 2026-09-30; Nick: "Looks good. Let's ship these changes.") ----
  // Kept VERBATIM and no longer run. The pass moved the PLAN → door out of the right corner and into the mode strip's own row,
  // so the framed prose bar holds ['Pages'] alone. CD4's own claim - the elder bare "Plan" flight tab is retired and the arrow door
  // is the only Plan word - is untouched; only the door's address changed, and the successor asserts both.
  //
  // ok('S2 @1280px: the prose project bar holds ONLY ["Pages","Plan →"] (the elder Plan flight tab retired)',
  //   JSON.stringify(proseLaptop) === JSON.stringify(['Pages', 'Plan →']), JSON.stringify(proseLaptop));
  // ------------------------------------------------------------------
```

## Record 3 · from cd4.mjs lines 310-316 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 35fe9e3435520f1064e4e15adaa84c71792404ea

```js
  // ---- PARKED — SUPERSEDED by card-close-x (Nick's live test, 2026-10-13) ----
  // Kept VERBATIM and no longer run: the close control is an X in the pop-up's
  // top-right corner; it shows a glyph, so its NAME (aria-label) is "Close", not
  // its text. Parked record in this file's parked section; successor below.
  // ok('CD4.1: the card-edit popup\'s close button reads exactly "Close" (never "Done"), and no button in the popup says "Done"',
  //   popupClose.label === 'Close' && popupClose.popupNoDone === true, JSON.stringify(popupClose));
  // ------------------------------------------------------------------
```
