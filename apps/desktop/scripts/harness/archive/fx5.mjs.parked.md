# Parked records archived from fx5.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx5.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx5.mjs lines 296-305 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8a3427551e23fe61a88244d6e2da058339f46d78

```js
    // ---- PARKED - SUPERSEDED by TYPEWRITER-FADE-ORDER (Nick's live bug, 2026-10-10: "lines fade out of order - a newer line
    // dims while the older one above it stays dark"). Kept VERBATIM and no longer run. The "opaque lead-in" it names WAS the bug:
    // it showed the oldest visible line whole above faint newer ones. The mask now holds the 15% floor through --tw-fade-start
    // and ramps up (the band still starts one line lower; the check above, the token's size, is unchanged). Its assertion only
    // tested for "linear-gradient", so it would have stayed green while claiming the opposite of the fix. Parked record below;
    // live successor: typewriter-fade.mjs (the order, measured line by line from the computed mask).
    //
    // ok('S1 (b): the container mask genuinely carries a two-stage ramp now (opaque lead-in, then the fade) — the gradient string mentions both a #000/opaque leading stop and the fade-band length',
    //   typeof fadeInfo.maskImage === 'string' && fadeInfo.maskImage.includes('linear-gradient'), fadeInfo.maskImage);
    // ------------------------------------------------------------------
```

## Record 2 · from fx5.mjs lines 332-340 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4a89f48884e343ea704f74e43fc4a1c6101e1df

```js
    // ---- PARKED - SUPERSEDED by page-size (rulings a-b, Oct 23: ~75 characters a line): the typed sentence (76 characters) now WRAPS, so with its Enter it
    // adds TWO visual lines, and the engine pays exactly that advance, a line per glide - FIX's probe on 8d3673bd traced two 27px steps and nothing
    // else (496 -> 523 -> 550), no snap toward the band (616). "About one line" was the fixture's single line; the claim - the box moves only by the
    // writer's own new lines, never back toward the band - is the successor's. Kept VERBATIM and no longer run; record in the parked section.
    //
    // ok('S1 (c): typing after a manual scroll-up does NOT snap the page back to the band — the post-keystroke scrollTop stays within about one line of the writer\'s OWN manually-chosen position, not reset toward the (much larger) pre-scroll settled value',
    //   Math.abs(afterTypeScrollTop - afterManualScroll) <= lineHeightPx * 1.6 && afterTypeScrollTop < settled - 40,
    //   JSON.stringify({ settled, manualTarget, afterManualScroll, afterTypeScrollTop, lineHeightPx }));
    // ------------------------------------------------------------------
```

## Record 3 · from fx5.mjs lines 368-374 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23; Cursor's mockup e3c4e462): a fresh Arbor page opens in the Typewriter ZOOM, and the
    // zoom holds the writing line at the band's anchor - 60% of the column (pageScale.ts ZOOM_ANCHOR) - so the first line starts there, not a quarter
    // down (lane 3 read 0.6002). Kept VERBATIM and no longer run; record in the parked section; successor follows.
    //
    // ok('S1 (d): the start offset (25%) is unchanged — the visual start still reads as "about a quarter"',
    //   proseInfo.fraction >= 0.20 && proseInfo.fraction <= 0.32, JSON.stringify(proseInfo));
    // ------------------------------------------------------------------
```

## Record 4 · from fx5.mjs lines 377-381 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b85f0e61d61ee6065f5a8c099522ffcfc84de6da

```js
    // ---- PARKED - SUPERSEDED by POLISH #10 item 19 (Nick, Oct 25: "seems too low on the screen to start"): the writing line - and a fresh page's first line - is held at the MIDDLE of the visible page, 50% of the column (pageScale.ts ZOOM_ANCHOR), not 60%. Kept VERBATIM and no longer run; record in the parked section; successor follows.
    //
    // ok('S1 (d) [page-size successor]: a fresh prose page opens in the Typewriter zoom and its first line starts at the band\'s anchor - 60% of the column (within 5%)',
    //   startZoom === 'true' && Math.abs(proseInfo.fraction - 0.6) <= 0.05, JSON.stringify(fx5StartSeen));
    // ------------------------------------------------------------------
```

## Record 5 · from fx5.mjs lines 709-732 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
    // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
    // The green tack (.board-pin-grab) is RETIRED: a card is connected from its corner square (double-click / right-click -> connection mode). The trusted pin-drag that minted a hairline no longer exists.
    // Quoted VERBATIM below. Successor: scripts/harness/connector-a.mjs C3/C5/C6 (a TRUSTED CDP double-click then a move and a release on a card links; a second one unlinks).
    // const pinPt = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="fx5-s5t-a"] .board-pin-grab').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
    // const targetPt = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="fx5-s5t-b"]').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
    // // ITEM 151 (Shape A) -- verify the drag's START point only.
    // await assertHittable(app, pinPt.x, pinPt.y, 'fx5 S5 pin-grab centre');
    // await app.mouseDown(pinPt.x, pinPt.y);
    // const steps = 6;
    // for (let i = 1; i <= steps; i++) {
    //   await app.mouseMove(
    //     Math.round(pinPt.x + (targetPt.x - pinPt.x) * (i / steps)),
    //     Math.round(pinPt.y + (targetPt.y - pinPt.y) * (i / steps)),
    //   );
    //   await sleep(40);
    // }
    // await app.mouseUp(targetPt.x, targetPt.y);
    // await sleep(200);
    // const linesAfterTrustedDrag = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
    // const connAfterTrustedDrag = (await app.evalJs('window.wrizoBoard()')).find(b => b.kind === 'connection');
    // ok('S5: the fidelity gap CLOSED — a genuinely trusted (isTrusted, CDP, real incremental mouseMove) drag from the olive pin to another card mints the hairline, re-verifying the mechanism the checks below only ever exercise via synthetic dispatch (mirrors S4(a)\'s own real-press proof for the identical early-setPointerCapture mechanism)',
    //   linesAfterTrustedDrag === 1 && !!connAfterTrustedDrag &&
    //   ((connAfterTrustedDrag.connA === 'fx5-s5t-a' && connAfterTrustedDrag.connB === 'fx5-s5t-b') || (connAfterTrustedDrag.connA === 'fx5-s5t-b' && connAfterTrustedDrag.connB === 'fx5-s5t-a')),
    //   JSON.stringify(connAfterTrustedDrag));
```

## Record 6 · from fx5.mjs lines 758-770 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
  // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
  // The corner square's double-click is the door INTO connection mode again (on its second pointerdown). This check's synthetic `dblclick` event would still arm nothing, but its CLAIM ("double-clicking the handle arms nothing") is no longer the product's - parked rather than left green about something else.
  // Quoted VERBATIM below. Successor: scripts/harness/connector-a.mjs C3 (the real double-click enters the mode) and card-resize-relock.mjs (a resize followed by a corner press still enters nothing).
  // await app.evalJs('document.querySelector(\'[data-box-id="fx5-s5-a"] .board-handle\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
  // await sleep(150);
  // const armedByDeadGesture = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
  // ok('S5: the dead handle-double-click gesture is REMOVED, proven inert (double-clicking the resize handle arms nothing)',
  //   armedByDeadGesture === 'false', armedByDeadGesture);
  // That same dblclick BUBBLES to the canvas's own dblclick handler (the
  // handle sits inside the card, and a hand-typed text card's own
  // double-click still opens the edit popup) — close it before continuing,
  // or every subsequent board gesture would silently stand down (onDown's
  // own "the popup is open" guard).
```

## Record 7 · from fx5.mjs lines 776-788 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
  // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
  // The green tack (.board-pin-grab) is RETIRED: a card is connected from its corner square (double-click / right-click -> connection mode). There is no pin to be present or to be a circle.
  // Quoted VERBATIM below. Successor: the check directly below (the tack is gone, and each card carries its own hidden connection circle); behaviour in connector-a.mjs C2.
  // // The olive pin exists on every card, always (not selection-gated).
  // const pinPresence = await app.evalJs(`({
  //   onA: !!document.querySelector('[data-box-id="fx5-s5-a"] .board-pin-grab'),
  //   onB: !!document.querySelector('[data-box-id="fx5-s5-b"] .board-pin-grab'),
  // })`);
  // ok('S5: the olive pin — the connection grab — is present on every card, always, not gated on selection (no pre-selection two-step the way the old gesture needed)',
  //   pinPresence.onA && pinPresence.onB, JSON.stringify(pinPresence));
  // const pinIsCircle = await app.evalJs("getComputedStyle(document.querySelector('[data-box-id=\"fx5-s5-a\"] .board-pin-grab')).borderRadius");
  // ok('S5: the pin is a genuine circle (Nick\'s own ruling, quoted in the brief) — the one deliberate exception to square corners for this small state indicator',
  //   pinIsCircle === '50%', pinIsCircle);
```

## Record 8 · from fx5.mjs lines 794-808 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
  // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
  // The green tack (.board-pin-grab) is RETIRED: a card is connected from its corner square (double-click / right-click -> connection mode). The mint-by-drag, Escape-mid-drag, empty-release and de-dupe checks were all pin gestures; the link they minted is SEEDED in this fixture now (the connection box the footer checks below need), because minting it is connector-a's job.
  // Quoted VERBATIM below. Successor: scripts/harness/connector-a.mjs C3 (link), C7 (Esc cancels), C8 (release on empty board after a drag cancels), C6 (toggle: a second release on a linked card UNLINKS - the new de-dupe).
  // // Drag-from-pin, release inside another card, mints a thread — ONE
  // // continuous gesture, no separate arm step (the old two-step shape is
  // // very likely why it read as "dead": a real double-click's timing is
  // // far less reliable than a script's own).
  // await app.evalJs('__pointerSeqTo(\'[data-box-id="fx5-s5-a"] .board-pin-grab\', \'[data-box-id="fx5-s5-b"]\', {steps:5})');
  // await sleep(200);
  // const linesAfterPinDrag = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
  // const connAfterPinDrag = (await app.evalJs('window.wrizoBoard()')).find(b => b.kind === 'connection');
  // ok('S5: dragging from the olive pin and releasing inside another card mints the hairline, in ONE continuous gesture',
  //   linesAfterPinDrag === 1 && !!connAfterPinDrag &&
  //   ((connAfterPinDrag.connA === 'fx5-s5-a' && connAfterPinDrag.connB === 'fx5-s5-b') || (connAfterPinDrag.connA === 'fx5-s5-b' && connAfterPinDrag.connB === 'fx5-s5-a')),
  //   JSON.stringify(connAfterPinDrag));
```

## Record 9 · from fx5.mjs lines 999-1005 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in eb9babb567ec44f07d62f6af871c1abca75b428c

```js
  // ---- PARKED - SUPERSEDED by the 211 card port (2026-10-06): the popup now runs the page's editing rules, so it shows no mark at any caret, as the page ----
  // Kept VERBATIM and no longer run. Item 211 (Nick's "A", 2026-09-25) retired reveal-at-caret; the card kept an interim form of it
  // until it had the page's editing rules, and now it has them. Successor below; the parked record is in this file's PARKED section.
  //
  // ok('S6: reveal-adjacent-to-caret — once the caret sits inside/beside the bold run, its OWN markers become visible again (a real, working escape hatch to see/edit the raw syntax, per the brief\'s own named fallback)',
  //   revealState.anyRevealed === true, JSON.stringify(revealState));
  // ------------------------------------------------------------------
```

## Record 10 · from fx5.mjs lines 1024-1036 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a51f014c0adcdb1a1e628e407a9573af688309d7

```js
  // ---- PARKED - SUPERSEDED by PR #7 (e79390c: marks never show, item 211), 2026-10-02 ----
  // Kept VERBATIM and no longer run. Draft no longer dims its syntax; it hides it like the card.
  //
  // ok('S6: Draft mode\'s own dimmed-syntax register is genuinely UNTOUCHED — its .md-mark spans NEVER carry the card-only .md-mark-hidden class, still just dimmed (opacity ~0.38), asterisks stay visible there (this is a card-surface-only change)',
  //   draftMarkState.count > 0 && !draftMarkState.anyHiddenClass && Math.abs(parseFloat(draftMarkState.opacity) - 0.38) < 0.05,
  //   JSON.stringify(draftMarkState));
  // ----------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by typed-literal (Nick's ruling, Oct 16: a hand-typed `**` is LITERAL, stored escaped) ----
  // Kept VERBATIM and no longer run. Typed `**bold in draft**` makes no bold run now - its stars are escaped - so the hidden marks this
  // counted are the escapes' backslashes, and the check would pass for the wrong reason. Bold comes from Ctrl+B: successor below.
  // ok('S6 [PR #7 successor]: Draft mode hides its marks too - its .md-mark spans carry .md-mark-hidden (item 211 applies to every writing surface)',
  //   draftMarkState.count > 0 && draftMarkState.anyHiddenClass, JSON.stringify(draftMarkState));
  // ------------------------------------------------------------------
```

## Record 11 · from fx5.mjs lines 1047-1055 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 22225575db855ad103053280e1317d280405babf

```js
  // ---- PARKED - SUPERSEDED (ledger 87, Oct 17): the check was wrong, not the product. This page is NEW and EMPTY, and a new Arbor page opens with
  // the Typewriter ON (store/theme.ts THEME_CONFIG, Phase 1 S5); while the Typewriter is on, Format and its shortcuts are blocked (Phase 1 S4,
  // PageEditor.tsx applyRailFormat) - so Ctrl+B rightly made NO bold here ({bold: 0, marks: 0} in the combined pair). typed-literal.mjs L3's
  // page starts with text, so its Typewriter opens off and the same Ctrl+B bolds. Kept VERBATIM and no longer run; successor below: the
  // Typewriter turned off first, the way a writer does (the foot's own toggle).
  // ok('S6 [typed-literal successor]: Draft mode hides its marks too - a bold made with Ctrl+B carries its two real marks, both .md-mark-hidden (item 211 applies to every writing surface)',
  //   !!fx5DraftBold && fx5DraftBold.bold >= 1 && fx5DraftBold.marks >= 2 && fx5DraftBold.allHidden, JSON.stringify(fx5DraftBold));
  // ------------------------------------------------------------------
  // the Typewriter off by its own foot toggle (the drawer opened first if it is shut); probed, never assumed
```

## Record 12 · from fx5.mjs lines 1318-1348 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e39a7cc0e187a1beef572669fd33fa110326fced

```js
// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX6 S1/S2 supersede two of this file's own checks. Quoted verbatim below
// (the exact code that used to live in this file's own live sections,
// before this park):
//
//   S7 (live, before FX6): "A second Ctrl+Z (nothing pending anymore) is a
//   harmless no-op — proves this is genuinely "one step," not a repeatable
//   toggle."
//     await ctrlZ('.forward-only-editor');
//     const afterSecondUndo = await app.evalJs("...innerText");
//     ok('S7: a SECOND Ctrl/Cmd+Z (nothing pending) is a harmless no-op —
//       genuinely one step, not a repeatable toggle',
//       afterSecondUndo === afterOneUndo, ...);
//   FX6 S1 replaces the single-shot em-dash shim with a REAL, walkable
//   undo/redo stack (store/textUndo.ts) — a second Ctrl+Z no longer a
//   no-op: it legitimately continues undoing further back (this IS the
//   point of real undo — "Ctrl+Z's his way back out step by step," the
//   brief's own DoD wording). Live successor: fx6.mjs's own S1 section
//   covers the full walkable chain; the check below proves the OLD claim
//   ("no-op") is now false, the same "prove the retirement itself"
//   discipline fx4.mjs's own PARKED section established.
//
//   S5 (live, before FX6): "the board sliver carries EXACTLY two hand
//   tools now — Add card + the footer toggle."
//     const sliverBoardShape = await app.evalJs(`(() => { ... })()`);
//     ok('S5: the board sliver carries EXACTLY two hand tools now...',
//       sliverBoardShape.count === 2, ...);
//   FX6 S2b adds a THIRD tool (New page card) — the board-side door Nick
//   reached for and couldn't find. Live successor: fx6.mjs's own S2
//   section proves New page card's own presence + function; the check
//   below proves the OLD count ("exactly two") is now three.
```
