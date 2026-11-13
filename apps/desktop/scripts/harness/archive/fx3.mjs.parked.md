# Parked records archived from fx3.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx3.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx3.mjs lines 92-99 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23; rulings c-d and the zoom): the letter page is capped to the stage with a small margin
    // in the NORMAL view (pageScale.ts PAGE_FENCE, 40px - the fence still holds there), but a fresh Arbor page opens in the Typewriter ZOOM, where the
    // page paints ~1.6x and runs past the stage's bottom, clipped by its column (lane 3: 1215 vs 840). The claim - the paper fills down, no dead band -
    // is the successor's, per view. Kept VERBATIM and no longer run; records in the parked section.
    //
    // ok(`S1 @ ${width}px (prose): the paper's bottom edge sits within the 32-48px fence of the stage's own bottom`,
    //   fence >= 30 && fence <= 50, JSON.stringify({ stageBottom: stage.bottom, paperBottom: paper.bottom, fence }));
    // ------------------------------------------------------------------
```

## Record 2 · from fx3.mjs lines 104-114 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 4986b0de6ab7c85390f03fb0e382678f542e4cf3

```js
    // ---- PARKED - SUPERSEDED by the framed-desk display pass (aa11f58, 2026-09-30) ----------------------------------------
    // Kept VERBATIM and no longer run. TRACED: the pass set `.desk-mode-tab` from font-size 13px to 10.4px, which makes the mode
    // row 2px shorter; the stage's HEIGHT is a fixed `calc(100vh - var(--fx3-chrome-budget))` (167px, unchanged), so the whole
    // stage rides 2px higher and its bottom went from 842 to 840 in a 900px viewport (measured: 842 on d4dc32e's pair, 840 on
    // Batch Eight's). The band below it is therefore 60px, and `< 60` fails by exactly that 2px - no dead band has opened; the
    // paper's own rect is byte-identical (cd2.mjs asserts it). Closing the 2px would mean changing the chrome budget, which
    // resizes the paper: not done here.
    //
    // ok(`S1 @ ${width}px (prose): no dead band below the frame — the stage itself reaches near the viewport's own bottom`,
    //   900 - stage.bottom < 60, `stage.bottom=${stage.bottom} viewportHeight=900`);
    // ------------------------------------------------------------------
```

## Record 3 · from fx3.mjs lines 186-195 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
  // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23): the paper is the PAINTED .mode-page, not .mode-pagecol - the page is painted by a
  // transform inside its column, and in the Typewriter zoom the column is the whole stage (lane 3: the anchors sat flush on the painted page, 464 /
  // 1456, while the column ran 100 to 1820). Kept VERBATIM and no longer run; successors read the painted page; records in the parked section.
  //
  // ok('S2 @ 1920px: the sliver anchor stays flush with the SCALED paper\'s left edge (no drift introduced by the scale token)',
  //   Math.abs(anchorAlign.anchorRight - anchorAlign.paperLeft) < 1, JSON.stringify(anchorAlign));
  // ok('S2 @ 1920px: the goal-glow anchor stays flush with the SCALED paper\'s box on both edges',
  //   Math.abs(anchorAlign.glowLeft - anchorAlign.paperLeft) < 1 && Math.abs(anchorAlign.glowRight - anchorAlign.paperRight) < 1,
  //   JSON.stringify(anchorAlign));
  // ------------------------------------------------------------------
```

## Record 4 · from fx3.mjs lines 356-369 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED - SUPERSEDED by item 83 M8 (R12), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. The affordance returns to screenplay
  // by R12, so it is present to assistive tech exactly as it is to the eye
  // - which is the symmetry this check always cared about.
  //
  // ok('SC1 S3 (was "S5 (script): the typewriter toggle\'s aria-label still carries the word, for assistive tech"): there is no typewriter aria-label on a script page because there is no toggle — the affordance is absent to assistive tech exactly as it is to the eye, never merely hidden from one of them',
  // !footRow.typewriterAriaLabelPresent, JSON.stringify(footRow));
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by PR #7 (19d2c02: the foot is ONE three-dot "Settings" menu holding Typewriter Mode, Progress Tracking and Preferences; Full Screen leaves the drawer), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The typewriter has no foot icon of its own to carry an aria-label; it is the Settings menu's first section. R12's claim (the option is offered on screenplay) is re-made there.
  //
  // ok('SC1 S3 [R12 successor]: the typewriter aria-label IS present on a script page - the affordance returns to both the eye and assistive tech together',
  //   footRow.typewriterAriaLabelPresent === true, JSON.stringify(footRow));
  // ----------------------------------------------------------------------
```

## Record 5 · from fx3.mjs lines 377-382 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 35864bb460771d837aa3078c5f2b55e08510956e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S4 (the Typewriter on/off row left the "..." menu for the icon toggle beside it; Nick, Oct 10), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The Typewriter ROW is gone from the menu by ruling; the successor asserts what replaced it: the icon toggle beside the "..." and the menu still opening on Typewriter Mode.
  //
  // ok('SC1 S3 [PR #7 successor]: on a script page the typewriter is still offered - the Settings menu opens on Typewriter Mode, with its Typewriter switch',
  // !!scriptMenu && scriptMenu.headings[0] === 'Typewriter Mode' && scriptMenu.typewriterRow === true, JSON.stringify(scriptMenu));
  // ----------------------------------------------------------------------
```

## Record 6 · from fx3.mjs lines 401-415 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED - SUPERSEDED by item 83 ERRATA E2, 2026-09-03 -----------
  // Kept VERBATIM and no longer run. The prose twin of the script park above,
  // superseded by the same ruling for the same reason: Full Screen leaves the
  // row for the progress bar's line, so the row holds two and the foot still
  // holds three.
  //
  // ok('S5 (prose): the sliver foot row is present with exactly THREE icons',
  // footRowProse.iconCount === 3, JSON.stringify(footRowProse));
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by PR #7 (19d2c02: the foot is ONE three-dot "Settings" menu holding Typewriter Mode, Progress Tracking and Preferences; Full Screen leaves the drawer), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The prose twin of the script park above.
  //
  // ok('S5 (prose) [E2 successor]: the prose sliver still carries all THREE instruments - TYPEWRITER and PROGRESS in the row, FULL SCREEN on the progress bar line',
  //   footRowProse.iconCount === 2 && footRowProse.fullScreenInFoot === true, JSON.stringify(footRowProse));
  // ----------------------------------------------------------------------
```

## Record 7 · from fx3.mjs lines 436-441 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 35864bb460771d837aa3078c5f2b55e08510956e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S4 (the Typewriter on/off row left the "..." menu for the icon toggle beside it; Nick, Oct 10), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The Typewriter ROW is gone from the menu by ruling; the successor asserts what replaced it: the icon toggle beside the "..." and the menu still opening on Typewriter Mode.
  //
  // ok('S5 (prose) [PR #7 successor]: prose still offers the typewriter - the Settings menu opens on Typewriter Mode, with its Typewriter switch',
  // !!proseMenu && proseMenu.headings[0] === 'Typewriter Mode' && proseMenu.typewriterRow === true, JSON.stringify(proseMenu));
  // ----------------------------------------------------------------------
```

## Record 8 · from fx3.mjs lines 487-501 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 45ff3fcab3b9fa28454a6a3cdda7114f6e9680db

```js
  // ---- PARKED - SUPERSEDED by item 83 M4 (R5), 2026-08-25 ------------
  // Kept VERBATIM and no longer run. Nick: 'I do not want a separate
  // Instruments toggle/menu. All of the options in it should be set in one
  // of the other settings options.' The panel is RETIRED WHOLE and its
  // roster - Show, Unit, Target - was ABSORBED into the foot's PROGRESS
  // instrument, so nothing it offered was lost: two surfaces onto one goal
  // became one. The successors assert the same three controls at their new
  // address.
  //
  // ok('S5: the instruments panel opens', !!instrumentsPanel && instrumentsPanel.present, JSON.stringify({ opened, instrumentsPanel }));
  // ok('S5: the instruments panel carries the on/off control AND the unit-preference control (two Seg rows)',
  // !!instrumentsPanel && instrumentsPanel.segCount === 2, JSON.stringify(instrumentsPanel));
  // ok('S5: the instruments panel carries the target-value control (a number input, Set + Clear)',
  // !!instrumentsPanel && instrumentsPanel.hasNumberInput && instrumentsPanel.hasSetClear, JSON.stringify(instrumentsPanel));
  // ------------------------------------------------------------------
```

## Record 9 · from fx3.mjs lines 535-555 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 811bbd0af28a540b961c294d80d4ee481733f1fb

```js
  // ---- PARKED - SUPERSEDED by item 83 ERRATA E1, 2026-09-03 -----------
  // Kept VERBATIM and no longer run. Nick's walkthrough ruling reverses the
  // TRIGGER these two checks encode: a foot pop-out fades only after FIFTEEN
  // WORDS WRITTEN or A PERIOD ENTERED, counted from the moment it opened —
  // never on the first keystroke. 'dissolve probe' is two words and carries
  // no period, so under the ruling the tray is HELD, and both assertions
  // below would now assert the very defect Nick reported.
  //
  // WHAT IS *NOT* SUPERSEDED, and is why the successors sit right beneath:
  // the claim these checks were really making — that the pop-out is hidden by
  // the ONE vanishing engine and never by a second bespoke close handler — is
  // untouched, and is still proven, one gate later. E1 adds no fade of its
  // own: the same `.desk-dissolve` rule, the same `--fade-dur` curve, the
  // same reduced-motion opt-out (Sliver.tsx's `data-popout-hold` and
  // index.css's rule for it). Full proof of the gate, with its controls, is
  // in item83f.mjs.
  //
  // ok('S5: the instruments panel closes (dissolves) on a keystroke, via the sliver panel\'s own existing chrome-fade/desk-dissolve mechanism',
  // dissolveState.frameWriting === 'true' && dissolveState.panelPointerEvents === 'none',
  // JSON.stringify(dissolveState));
  // ------------------------------------------------------------------
```

## Record 10 · from fx3.mjs lines 580-588 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 811bbd0af28a540b961c294d80d4ee481733f1fb

```js
  // ---- PARKED - SUPERSEDED by item 83 ERRATA E1, 2026-09-03 -----------
  // Kept VERBATIM and no longer run. The same reversal as its twin above:
  // the settle it waited for now happens after the GATE, not after the first
  // keystroke, so against the ruled build this wait would run its full 4s and
  // still read 1. The successor waits for the same settle at its new trigger.
  //
  // ok('S5: ...and settles to the ambient fade-min opacity once the transition finishes (not stuck mid-fade)',
  // parseFloat(settledOpacity) < 0.15, settledOpacity);
  // ------------------------------------------------------------------
```

## Record 11 · from fx3.mjs lines 866-917 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 0d89debecf995db209ed47400db9274bc8ac5e55

```js
    // ---- PARKED — SUPERSEDED by item 83 M8 (R12), 2026-08-27 ------------
    // GENERATION 2, quoted VERBATIM and no longer asserted. It held Nick's
    // SC1 S3 word — the typewriter withdrawn from screenplay, so the script
    // foot carried TWO icons and no aria-label while prose kept three and
    // the label. R12 reverses the withdrawal by founder word and M8 gives
    // both surfaces the SAME universal foot. Generation 3 stands below.
    // This entry is the gated twin of the two live parks already standing
    // in this file's own S5 section; the twin needed the ruling of
    // 2026-08-27 to be found at all, because only the default setting had
    // ever been run against this wave.
    //
    // pok('PARKED (was "S5 (script): the sliver foot row is present with exactly THREE icons" + "S5 (script): the typewriter toggle\'s aria-label still carries the word, for assistive tech") — SC1 S3, Nick\'s word: the option is withdrawn from the screenplay surface, so script carries TWO icons and no aria-label; prose keeps three and the label',
    // scriptFootParked.iconCount === 2 && scriptFootParked.aria === false
    // && proseFootParked.iconCount === 3 && proseFootParked.aria === true,
    // JSON.stringify({ scriptFootParked, proseFootParked }));
    // ---------------------------------------------------------------------
    // GENERATION 3 (item 83 M8/R12) — the SAME symmetry claim generations 1
    // and 2 both made, and the one this check has always really been about:
    // that the eye and assistive tech are told the same story. They are —
    // and now they are told it on BOTH surfaces, not one.
    // ---------------------------------------------------------------------
    // PARKED - SUPERSEDED by item 83 ERRATA E2, 2026-09-03. GENERATION 3,
    // quoted VERBATIM and no longer asserted. Nothing about the SYMMETRY claim
    // it makes is superseded — only the arithmetic it counts with. Full Screen
    // moves out of the instruments row onto the progress bar's own line by
    // Nick's walkthrough ruling, so a row that held three now holds two on both
    // surfaces, while the foot still carries all three instruments. Generation
    // 4 stands below and asks the same question by NAMING the third instrument
    // rather than counting to it, which is the failure mode this check has now
    // hit twice.
    //
    // pok('PARKED, generation 3 (was SC1 S3 re-assertion: script two icons and no aria-label, prose three and the label) — item 83 M8/R12: the withdrawal is REVERSED by founder word; script and prose carry the identical three-instrument foot, and the aria-label is present on both',
    // scriptFootParked.iconCount === 3 && scriptFootParked.aria === true
    // && proseFootParked.iconCount === 3 && proseFootParked.aria === true,
    // JSON.stringify({ scriptFootParked, proseFootParked }));
    // ---------------------------------------------------------------------
    // GENERATION 4 (item 83 errata E2) — the SAME symmetry claim all four
    // generations have made: that the eye and assistive tech are told the same
    // story, on both surfaces. They still are, and the foot still carries the
    // identical three instruments on each — two in the row, and Full Screen on
    // the progress bar's own line.
    // ---- PARKED - SUPERSEDED by PR #7 (item 211, 4d3c84e, 2026-10-05) - GENERATION 4, quoted VERBATIM and no longer asserted ----
    // Nothing about the SYMMETRY claim is superseded - both surfaces carry the identical foot, and the eye and assistive tech are told
    // the same story. PR #7 changed the foot itself: ONE three-dot menu (named "Settings" to the eye's tooltip and the screen reader
    // alike) holding Typewriter Mode, Progress and Preferences, with Full Screen moved to the desk corner menu. Generation 5 asks the
    // same symmetry question of that foot.
    //
    // pok('PARKED, generation 4 (was the generation-3 three-icons-per-row count) — item 83 errata E2: Full Screen leaves the instruments row for the progress bar line, so each surface row holds TWO and its foot still holds THREE; the aria-label symmetry R12 restored is untouched',
    //   scriptFootParked.iconCount === 2 && scriptFootParked.aria === true && scriptFootParked.fullScreenInFoot === true
    //     && proseFootParked.iconCount === 2 && proseFootParked.aria === true && proseFootParked.fullScreenInFoot === true,
    //   JSON.stringify({ scriptFootParked, proseFootParked }));
    // ---------------------------------------------------------------------
```
