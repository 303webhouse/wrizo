# Parked records archived from item121.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item121.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item121.mjs lines 150-165 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b692c117f70fe66a40b87d99adfeee99d6d10d6f

```js
// ---- PARKED - SUPERSEDED by POLISH #10 item 5 (Nick, Oct 25: in the zoom the ink sheet covers the visible page): both drivers aimed their fractions
// at the WHOLE sheet, which was the text's own box. In the zoom the sheet now reaches over the scroller's start offset and end room with matching
// paddings, so the same fractions land above the text or past the stage (FIX's turn on e2ebe51d, Oct 26: S2/S4/S5 pen/S7/S8/S11 all drew nothing).
// Kept VERBATIM and no longer called; the record (parked section) measures the sheet against its text box on each run.
//
// const safePen = async (app, sel, points, label) => {
//   if (!(await present(app, sel))) {
//     ok(`DRIVER: ${label} — target ${sel} was ABSENT, so no pen stroke was dispatched`, false, JSON.stringify(await where(app)));
//     return false;
//   }
//   await app.penStroke(sel, points);
//   return true;
// };
// ------------------------------------------------------------------
// SUCCESSOR: the same fractions, aimed at the sheet's TEXT box - its content box (the sheet less its paddings, at the painted scale), exactly where
// the old sheet was - through a pointer-transparent marker laid over it, so every press still lands on the sheet itself.
```

## Record 2 · from item121.mjs lines 615-621 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b92a2b6cc5869efee36f8cefa6353d541dff946e

```js
    // ---- PARKED - SUPERSEDED by Phase 1 (the band's hover TEXT | INK switch is RETIRED: the switch is gone, so "height with it equals height without it" has nothing to remove; Fable, Oct 12), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S9 (${label}): the band's height with the switch mounted EQUALS its height without it — the switch fits the band's existing line and does not wrap it onto a second row (the real failure mode: .sprint-nav is a WRAPPING flex row, so a growth here is a whole row, not a few pixels). Paper never reflows for chrome`,
    // withSwitch != null && !withoutSwitch.missing && Math.abs(withSwitch.height - withoutSwitch.height) < 0.6,
    // JSON.stringify({ withSwitch: withSwitch && withSwitch.height, withoutSwitch: withoutSwitch.height }));
    // ----------------------------------------------------------------------
```

## Record 3 · from item121.mjs lines 649-656 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b92a2b6cc5869efee36f8cefa6353d541dff946e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 (the band's hover TEXT | INK switch is RETIRED: the "switch" a flip is read from is now the drawer's selected tab; Fable, Oct 12), 2026-10-12 ----
  // Kept VERBATIM and no longer run. The successor follows the parked lines.
  //
  // ok('S9: after EVERY flip the switch\'s checked side and the paper\'s own data-instrument agree — two independent readings of one state, so a switch that moved without the page following (or the reverse) is caught',
  // agreeing.length === 3 && agreeing.every(a => a.side === a.paper)
  // && agreeing[0].paper === 'ink' && agreeing[1].paper === 'text' && agreeing[2].paper === 'ink',
  // JSON.stringify(agreeing));
  // ----------------------------------------------------------------------
```

## Record 4 · from item121.mjs lines 717-723 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED - SUPERSEDED by PR #7 (3951329: the format buttons are titled "Bold (Ctrl+B)", "Italic (Ctrl+I)", "Underline (Ctrl+U)"), 2026-10-02 ----
  // Kept VERBATIM and no longer run. Only the titles changed; the three buttons are still there.
  //
  // ok('S10: DRAFT IS UNTOUCHED — its FORMAT zone still carries Bold/Italic/Underline (R4 survives R15, which rules on ONE surface). This is the check that would have caught "remove STYLING" being read as "remove it everywhere"',
  //   draftDrawer.format > 0 && draftDrawer.buttons.includes('Bold') && draftDrawer.buttons.includes('Italic') && draftDrawer.buttons.includes('Underline'),
  //   JSON.stringify(draftDrawer));
  // ----------------------------------------------------------------------
```
