# Parked records archived from ab2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/ab2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from ab2.mjs lines 202-218 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d0800409e11cbbe076406ef8ee5beac475655cab

```js
  // ---- PARKED — SUPERSEDED by ITEM 121 I6 (R15), 2026-09-07 ----------
  // Kept VERBATIM and no longer run. Nick's analog law: Free Write is a
  // typewriter for text, and "no digital styling, no fonts, no formatting on
  // that surface" — so STYLING (the `.wz-sliver-format` this asserted PRESENT)
  // is REMOVED from Free Write. FX7 S2's "mode furniture too" reading is not
  // wrong about the mechanism; it is superseded on the RULING. R1 governed
  // when this was written and R15 supersedes R1 for this one surface.
  // The successor keeps every clause that still governs — forward lock present,
  // Journal-only furniture absent, structure absent — and INVERTS exactly the
  // one the ruling moved, so the check still discriminates in both directions.
  //
  // ok('FX7 S2 (was "CD1 S2 (was \\"FX1 S3: ...\\")"): Free Write sliver on a PROJECT-origin page shows the forward lock PRESENT (mode furniture) and NOW Bold/Italic format too (mode furniture too, FX7 S2) — still none of the Journal-only furniture (ink/capture items absent); structure stays absent (Draft, not Free Write)',
  //   !freeWriteRail.ink && freeWriteRail.forwardLock
  //     && freeWriteRail.captureItems.length === 0
  //     && freeWriteRail.format && !freeWriteRail.structure,
  //   JSON.stringify(freeWriteRail));
  // -------------------------------------------------------------------
```

## Record 2 · from ab2.mjs lines 268-283 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 45ff3fcab3b9fa28454a6a3cdda7114f6e9680db

```js
    // ---- PARKED — SUPERSEDED by item 83 M5 (DR3 + R4), 2026-08-25 -------
    // Kept VERBATIM and no longer run. TWO rulings moved under it: DR3
    // retired the Prose|Screenplay TABLIST for a confirm-gated verb row
    // (so `structureLabels` can never read ['Prose','Screenplay'] again),
    // and R4 grew Draft's roster far past Bold/Italic/Heading/Spacing —
    // Nick: 'it should have a lot more formatting options (bulleted lists,
    // indention/block quote, line spacing, text alignment)'. The successor
    // keeps the part that still governs: Draft carries format tools and
    // NO journal furniture.
    //
    // ok('CD1 S2 (was "S1/S3/S4: Draft rail..."): Draft sliver shows Bold/Italic/Heading/Spacing + the Structure picker, and ONLY those (no ink, no capture items)',
    // !draftRail.ink && draftRail.captureItems === 0 && draftRail.format && draftRail.structure
    // && JSON.stringify(draftRail.formatButtons) === JSON.stringify(['Bold', 'Italic', 'Heading', 'Spacing'])
    // && JSON.stringify(draftRail.structureLabels) === JSON.stringify(['Prose', 'Screenplay']),
    // JSON.stringify(draftRail));
    // --------------------------------------------------------------------
```

## Record 3 · from ab2.mjs lines 490-501 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2e059f8b836228230d706853f3c2aac6ba4bc8d

```js
  // ---- PARKED - SUPERSEDED by PAGE-TEMPLATES-MOVE (Nick's rulings, 2026-10-08): the Templates row reads Screenplay (LIVE), then Outline, Title page, Bibliography and a NEW Custom placeholder, in that order. Kept VERBATIM and no
  // longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  //
  // ok('S4 [PR #7 successor]: the zone\'s place holds the Template stand-ins - Outline, Bibliography, Title page - each aria-disabled and titled "Coming soon"',
  //   JSON.stringify(s4Drawer.templates) === JSON.stringify(['Outline', 'Bibliography', 'Title page']) && s4Drawer.disabled && JSON.stringify(s4Drawer.titles) === JSON.stringify(['Coming soon']),
  //   JSON.stringify(s4Drawer));
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @ 0fc9afef, Fable Oct 16): the four grayed stand-ins retire - the Templates section is a FIVE-row picker (Blank, Screenplay, Outline, Title Page, Bibliography), none disabled, Custom dropped. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  //
  // ok('S4 [page-templates successor]: the zone\'s place holds the Template stand-ins - Outline, Title page, Bibliography, Custom, in that order - each aria-disabled and titled "Coming soon"',
  //   JSON.stringify(s4Drawer.templates) === JSON.stringify(['Outline', 'Title page', 'Bibliography', 'Custom']) && s4Drawer.disabled && JSON.stringify(s4Drawer.titles) === JSON.stringify(['Coming soon']),
  //   JSON.stringify(s4Drawer));
```

## Record 4 · from ab2.mjs lines 697-716 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
    // ---- PARKED — SUPERSEDED by item 83 M8 (R12), 2026-08-25 ------------
    // Kept VERBATIM and no longer run. SC1 S3 recorded the typewriter as
    // absent from screenplay 'pending Nick's own revision of typewriter
    // mode'. R12 IS that revision, in his words: 'TYPEWRITER mode should be
    // available while writing a screenplay, too.' The foot is universal on
    // page-writing surfaces, so the option is now PRESENT here by law. The
    // successor asserts the reversed truth on the same fixture.
    //
    // ok('SC1 S3 (was "S2 DoD: the typewriter defaults on ... on the script surface too"): the option is gone from BOTH its surfaces — no "Typewriter" row behind the script sliver\'s gear either, so there is no live switch that does nothing one click deeper',
    // scriptGearTypewriterRow.panelOpen === true && scriptGearTypewriterRow.hasTypewriterRow === false,
    // JSON.stringify(scriptGearTypewriterRow));
    // --------------------------------------------------------------------
      // ---- PARKED - SUPERSEDED by PR #7 (19d2c02: the foot is one three-dot Settings menu), 2026-10-02 ----
      // Kept VERBATIM and no longer run. The Typewriter icon left the foot; its option is a heading in the Settings menu.
      //
      // const scriptFootLabels = await app.evalJs(`[...document.querySelectorAll('.wz-sliver-instruments-row button')].map(b => (b.getAttribute('aria-label') || '').split(' ')[0])`);
      // ok('SC1 S3 [R12 successor]: the typewriter option IS PRESENT on a screenplay page - R12 reverses SC1 S3s exclusion by Nicks own word; the foot is universal on page-writing surfaces',
      //   Array.isArray(scriptFootLabels) && scriptFootLabels.includes('Typewriter'),
      //   JSON.stringify(scriptFootLabels));
      // ----------------------------------------------------------------------
```

## Record 5 · from ab2.mjs lines 787-791 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c1fecb5891844bf9685df6d28ff17b1ea609a048

```js
  // ---- PARKED - SUPERSEDED by hide-workshop (Nick, Oct 23 11:01 am: the Workshop tab is HIDDEN until built). Kept VERBATIM and no longer run;
  // its parked record is in the HARNESS_PARKED block, and its successor follows.
  // ok('S7: the strip\'s DOM textContent stays the ratified title case for every tab (deskLexicon untouched)',
  //   JSON.stringify(allStripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']),
  //   JSON.stringify(allStripLabels));
```

## Record 6 · from ab2.mjs lines 1064-1119 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 387447a2b4b2ae521ec683d864d2ee01eed315d4

```js
    // ---- PARKED — SUPERSEDED by item 83 M5 (R4 + F3), 2026-08-27 --------
    // GENERATION 2, quoted VERBATIM and no longer asserted. CD1 S2/S7 kept
    // the original roster whole and renamed only its selectors. M5 changes
    // the roster ITSELF: R4 seats Underline, Bulleted list, Block quote and
    // Indent beside the original four, F3's line-prefix directives add the
    // three alignments, and the Structure picker is withdrawn outright
    // (structure is chosen at a page's making, not re-picked from a tool
    // drawer). Generation 3 stands below. (Fable, 2026-08-27: the gated lane
    // always holds the NEWEST truth; prior generations stack beneath it.)
    //
    //   pok('PARKED (was "S1/S3/S4: Draft rail shows Bold/Italic/Heading/Spacing + the Structure picker, and ONLY those...") — CD1 S2/S7: same truth, .wz-sliver-* selectors',
    //     !draftRailClassRenameCheck.ink && draftRailClassRenameCheck.captureItems === 0
    //       && draftRailClassRenameCheck.format && draftRailClassRenameCheck.structure
    //       && JSON.stringify(draftRailClassRenameCheck.formatButtons) === JSON.stringify(['Bold', 'Italic', 'Heading', 'Spacing'])
    //       && JSON.stringify(draftRailClassRenameCheck.structureLabels) === JSON.stringify(['Prose', 'Screenplay']),
    //     JSON.stringify(draftRailClassRenameCheck));
    // ---------------------------------------------------------------------
    // GENERATION 3 (item 83 M5/R4+F3) — the SAME claim all three generations
    // have made: what the Draft rail carries, and ONLY that. The roster is
    // pinned in its ruled order so a silent addition or reordering fails
    // here, and the picker's absence is asserted rather than merely unread.
    // ---- PARKED - SUPERSEDED by PR #7 (item 211, 4d3c84e, 2026-10-05) - GENERATION 5, quoted VERBATIM and no longer asserted ----
    // The claim every generation has made is unchanged: the Draft rail carries exactly its ruled roster, in its ruled order, with no
    // silent addition and no Structure picker. PR #7 changed the MEMBERSHIP again: the three bullet buttons fold back into one Round
    // bullet plus a "Bullet styles" menu, B/I/U name their shortcuts in their titles, and three "Coming soon" placeholders join the
    // row. Generation 6 below re-makes the claim at that membership, pinned in order.
    //
    // pok('PARKED, generation 5 (was \"PARKED, generation 4 (was \"PARKED, generation 3 (was CD1 S2/S7 re-assertion of the four-button roster Bold/Italic/Heading/Spacing + the Structure picker) — item 83 M5/R4+F3: the roster is the ruled ELEVEN and the Structure picker is withdrawn; same ONLY-those claim, current membership\") — NICK\'S OUTDENT RULING (2026-09-05) supersedes the COUNT, by design: the Draft roster is the ruled TWELVE now, because item 83 errata E3\'s held seam closed and Indent gained the partner it had been shipping without. The ELEVEN was never wrong; it was complete for its moment. What this check has always ACTUALLY claimed — that the rail carries exactly its ruled roster, in its ruled order, with no silent addition and no Structure picker — is UNCHANGED, and is re-made below at the current membership with Outdent seated immediately before Indent. Successor: outdent.mjs\'s own S1 checks (the control exists, sits before Indent, and does not wear Align left\'s glyph).\") — ITEM 122 (Nick\'s ruling, 2026-09-06) supersedes the COUNT again, by design: STRIKETHROUGH joins Draft\'s styling row, so the ruled roster is THIRTEEN. Seated AFTER Underline so the row reads B I U S — the three the writer already knows, then the new one, rather than the new one displacing a position their hand has learned. As at generation 4, the COUNT is the only thing superseded: what this check actually claims — that the rail carries exactly its ruled roster, in its ruled order, with no silent addition and no Structure picker — is UNCHANGED and re-made below at the current membership. Successor: strike.mjs\'s own roster and round-trip checks. Then PR #7 (19a4676, 2026-10-02) supersedes the COUNT once more: one list control becomes three bullet styles (Round, Hollow, Square), so the ruled roster is FIFTEEN; the claim is unchanged and re-made at the current membership.',
    //   !draftRailClassRenameCheck.ink && draftRailClassRenameCheck.captureItems === 0
    //     && draftRailClassRenameCheck.format && draftRailClassRenameCheck.structure === false
    //     && JSON.stringify(draftRailClassRenameCheck.formatButtons) === JSON.stringify(['Bold', 'Italic', 'Underline', 'Strikethrough', 'Heading', 'Round bullet', 'Hollow bullet', 'Square bullet', 'Block quote', 'Outdent', 'Indent', 'Line spacing', 'Align left', 'Align centre', 'Align right'])
    //     && JSON.stringify(draftRailClassRenameCheck.structureLabels) === JSON.stringify([]),
    //   JSON.stringify(draftRailClassRenameCheck));
    // ---------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by PAGE-TEMPLATES-MOVE (Nick, 2026-10-08: "templates live in the tools menu now") - GENERATION 6,
    // quoted VERBATIM and no longer asserted. The claim is unchanged: the Draft rail carries exactly its ruled roster, in order.
    // The MEMBERSHIP changed: Screenplay joins the Templates row as a LIVE button (titled Screenplay) ahead of the placeholders,
    // and a fourth placeholder, Custom, joins them. Generation 7 below re-makes the claim at that membership, pinned in order.
    //
    // pok('PARKED, generation 6 (was generation 5, the FIFTEEN-button roster with Round/Hollow/Square bullets) — PR #7 (4d3c84e) changes the MEMBERSHIP: one Round bullet plus a Bullet styles menu, B/I/U titled with their shortcuts, and three Coming soon placeholders, SEVENTEEN in all; the claim is unchanged and re-made at the current membership, in order',
    //   !draftRailClassRenameCheck.ink && draftRailClassRenameCheck.captureItems === 0
    //     && draftRailClassRenameCheck.format && draftRailClassRenameCheck.structure === false
    //     && JSON.stringify(draftRailClassRenameCheck.formatButtons) === JSON.stringify(['Bold (Ctrl+B)', 'Italic (Ctrl+I)', 'Underline (Ctrl+U)', 'Strikethrough', 'Heading', 'Round bullet', 'Bullet styles', 'Block quote', 'Outdent', 'Indent', 'Line spacing', 'Align left', 'Align centre', 'Align right', 'Coming soon', 'Coming soon', 'Coming soon'])
    //     && JSON.stringify(draftRailClassRenameCheck.structureLabels) === JSON.stringify([]),
    //   JSON.stringify(draftRailClassRenameCheck));
    // ---------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (Fable Oct 17, ledger 87) - GENERATION 7, quoted VERBATIM and no longer asserted. The claim is unchanged: the Draft rail carries exactly its ruled roster, in order.
    // The MEMBERSHIP changed again: the Templates section is a five-row PICKER (page sketches and words, components/TemplateSketch.tsx), no longer a row of .mode-tbtn buttons, so the live Screenplay button and the four
    // "Coming soon" placeholders leave the roster the check counts. Generation 8 below re-makes the claim at that membership, pinned in order.
    //
    // pok('PARKED, generation 7 (was generation 6, the SEVENTEEN-button roster) — PAGE-TEMPLATES-MOVE (Nick\'s rulings, 2026-10-08) changes the MEMBERSHIP: Screenplay joins the Templates row as a LIVE button ahead of the placeholders, and a fourth placeholder, Custom, joins them, EIGHTEEN in all; the claim is unchanged and re-made at the current membership, in order',
    //   !draftRailClassRenameCheck.ink && draftRailClassRenameCheck.captureItems === 0
    //     && draftRailClassRenameCheck.format && draftRailClassRenameCheck.structure === false
    //     && JSON.stringify(draftRailClassRenameCheck.formatButtons) === JSON.stringify(['Bold (Ctrl+B)', 'Italic (Ctrl+I)', 'Underline (Ctrl+U)', 'Strikethrough', 'Heading', 'Round bullet', 'Bullet styles', 'Block quote', 'Outdent', 'Indent', 'Line spacing', 'Align left', 'Align centre', 'Align right', 'Screenplay', 'Coming soon', 'Coming soon', 'Coming soon', 'Coming soon'])
    //     && JSON.stringify(draftRailClassRenameCheck.structureLabels) === JSON.stringify([]),
    //   JSON.stringify(draftRailClassRenameCheck));
```

## Record 7 · from ab2.mjs lines 1234-1253 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b0046ff2548b54b1b4636bf8cf6aedf90431ec24

```js
    // ---- PARKED — SUPERSEDED by item 83 M8 (R12), 2026-08-27 ------------
    // GENERATION 2, quoted VERBATIM and no longer asserted. It recorded
    // Nick's SC1 S3 word that the typewriter is withdrawn from screenplay.
    // R12 reverses that by founder word: the typewriter RETURNS to the
    // screenplay surface, and M8 gives both surfaces the same universal
    // foot. Generation 3 stands below. This is the same supersession already
    // parked in fx3.mjs and sc1.mjs — its third-generation twin, and the
    // precedent Fable named on 2026-08-27 for how the gated lane stacks.
    //
    // pok('PARKED, generation 2 (was "PARKED (was \'S2 DoD: the typewriter toggle is present in the rail on the script surface\') — CD1 S2/S7 moved it to the sliver, FX3 S5 moved it again (icon-only, sliver foot) — present there now") — SC1 S3, Nick\'s word: AB2 S2\'s DoD is AMENDED, the option is withdrawn from the screenplay surface entirely (both the toggle and the gear\'s Typewriter row), and remains untouched on prose',
    // typewriterGoneOnScript.toggle === false
    // && gearRowGone !== null && gearRowGone.hasTypewriterRow === false
    // && typewriterStillOnProse === true,
    // JSON.stringify({ typewriterGoneOnScript, gearRowGone, typewriterStillOnProse }));
    // ---------------------------------------------------------------------
    // GENERATION 3 (item 83 M8/R12) — the SAME question every generation of
    // this check has asked: where does the typewriter live, and is it on
    // both surfaces or one. R5 also renamed the affordance: the rail class
    // .typewriter-toggle is now an instrument button carrying an aria-label,
    // so the read is by NAME, not by the retired class.
```

## Record 8 · from ab2.mjs lines 1278-1288 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 0d89debecf995db209ed47400db9274bc8ac5e55

```js
    // ---- PARKED - SUPERSEDED by PR #7 (item 211, 4d3c84e, 2026-10-05) - GENERATION 4, quoted VERBATIM and no longer asserted ----
    // The question is untouched - where does the typewriter live, and is it on both surfaces or one - and the answer is still "both".
    // PR #7 folds the foot into ONE three-dot menu whose sections are Typewriter Mode, Progress and Preferences, and moves Full Screen
    // out of the drawer to the desk corner menu ("the app chrome already offers it"). Generation 5 asks the same question of the menu:
    // one button in the row, the typewriter inside it on BOTH surfaces, and Full Screen reachable from the desk corner, not the foot.
    //
    // pok('PARKED, generation 4 (was the generation-3 three-icons-per-row count) - item 83 errata E2: Full Screen leaves the instruments row for the progress bar line, so each row holds TWO while the foot still holds THREE; the typewriter is present on screenplay AND prose exactly as R12 restored it',
    //   typewriterGoneOnScript.iconCount === 2 && fullScreenInFootScript === true
    //     && typewriterInstrumentOnProse === true && fullScreenInFootProse === true,
    //   JSON.stringify({ typewriterGoneOnScript, typewriterInstrumentOnProse, fullScreenInFootScript, fullScreenInFootProse }));
    // ---------------------------------------------------------------------
```
