# Parked records archived from fx7.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx7.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx7.mjs lines 233-253 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d0800409e11cbbe076406ef8ee5beac475655cab

```js
  // ---- PARKED — SUPERSEDED by item 83 M4 (R1), 2026-08-25 -----------
  // Kept VERBATIM and no longer run. Nick overruled Chamber 1s 'nothing
  // else' by name: 'I would like to add buttons for bolding, italicizing,
  // and underlining.' The zone is STYLING now (his word) and Underline
  // joins B and I. The heading text changed; the subject did not.
  //
  // ok('S2: Free Write\'s own rail carries a Format section (Bold/Italic) — previously entirely absent on an ordinary (project-origin) Free Write page',
  // railSections.includes('Format'), JSON.stringify(railSections));
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by ITEM 121 I6 (R15), 2026-09-07 ----------
  // Kept VERBATIM and no longer run. THIS ASSERTION HAS NOW BEEN SUPERSEDED
  // TWICE BY THE SAME FOUNDER, in opposite directions, and both moves sit on
  // this file: R1 renamed Format to STYLING and added Underline (the park
  // immediately above), and R15 removes the zone from this surface
  // altogether - Free Write is a typewriter for text, and a surface that does
  // not decorate offers no styling buttons. The successor asserts the
  // ABSENCE, which is the new law.
  //
  // ok('S2 [R1 successor]: Free Writes own rail carries a STYLING section - the zone Format became by Nicks word, now B/I/U',
  // railSections.includes('Styling'), JSON.stringify(railSections));
  // -------------------------------------------------------------------
```

## Record 2 · from fx7.mjs lines 260-270 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 45ff3fcab3b9fa28454a6a3cdda7114f6e9680db

```js
  // ---- PARKED — SUPERSEDED by item 83 M4 (R2 deferral + G3), 2026-08-25
  // Kept VERBATIM and no longer run. FX7 S2 placed this as a reasoned
  // disabled affordance; Chamber 1s roster then excluded it, and G3 names
  // the grammar reason - a greyed control for an unbuilt capability is a
  // locked door wearing paint. R2 makes Ink a REAL section when the stylus
  // returns; until then nothing renders rather than something rendering
  // inert. The successor asserts the ABSENCE, which is the new law.
  //
  // ok('S2: Free Write\'s own rail carries the ink-tool toggle, mirrored from Journal\'s own pen/eraser icon shape — DISCLOSED INERT (disabled/aria-disabled), never pretending to be functional outside the true Journal surface',
  // inkToolShape.present && inkToolShape.disabled === true && inkToolShape.ariaDisabled === 'true', JSON.stringify(inkToolShape));
  // ------------------------------------------------------------------
```

## Record 3 · from fx7.mjs lines 277-319 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d0800409e11cbbe076406ef8ee5beac475655cab

```js
  // ---- PARKED - SUPERSEDED by ITEM 121 I6 (R15), 2026-09-07 ----------
  // Kept VERBATIM and no longer run. These drove Free Write’s own B/I
  // two-press bracket through the STYLING zone, which R15 removes from this
  // surface. The MECHANISM they proved is NOT retired: the marker convention
  // (store/draftFormat.ts’s FORMAT_MARK) and ForwardOnlyEditor’s
  // insertMarkerRef escape hatch are DRAFT’s, they still exist, and
  // ab2.mjs / item83f.mjs assert them live against Draft’s own zone. What
  // is gone is only THIS surface’s door onto them.
  //
  // THE TYPED FIXTURE ABOVE STAYS LIVE, deliberately: the Backspace check
  // below is about FORWARD LOCK, which item 121 does not touch, and it needs
  // text on the page. Parking the scaffolding along with the claim is how a
  // park quietly retires a law it was never about - the first attempt at this
  // park did exactly that and ran the Backspace check against an empty editor.
  //
  // THIS PARK CARRIES A SECOND LESSON. Run unparked against the item 121
  // tree, the first line below did not FAIL - it THREW, on a .click() against
  // a button that no longer exists, and a throw aborts the whole file. The
  // suite recorded NOVERDICT: not one of this file’s 44 checks reported,
  // pass or fail. A driver can lie by dying as easily as by doing nothing,
  // which is why a probe belongs in front of every gesture.
  //
  // await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]').click()");
  // await sleep(200);
  // await app.typeKeys('bold text');
  // await sleep(200);
  // await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]').click()");
  // await sleep(200);
  // const boldText = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  // ok('S2: Bold\'s two-press bracket genuinely survives a real keystroke run typed BETWEEN the two clicks (the exact case the execCommand approach silently lost) — both ** markers present around the typed text',
  // boldText === 'Hello world**bold text**', boldText);
  //
  // await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Italic\"]').click()");
  // await sleep(150);
  // await app.typeKeys('em');
  // await sleep(150);
  // await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Italic\"]').click()");
  // await sleep(150);
  // const italicText = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  // ok('S2: Italic\'s own bracket works too, immediately chained after Bold\'s own closing marker',
  // italicText === 'Hello world**bold text***em*', italicText);
  // -------------------------------------------------------------------
  // The live successor: the zone is absent, so its buttons are absent with it.
```

## Record 4 · from fx7.mjs lines 384-400 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cb2c993ba6e638951edbfeffccb8657486db759b

```js
    // ---- PARKED — SUPERSEDED by item 83 M1 (R10.i), 2026-08-04 ----------
    // The two checks below are kept VERBATIM, exactly as FX7 S3 wrote them,
    // and are no longer run. They assert `gap === --frame-gap (28px)`, which
    // was FX7's own correct intent: the panel flush against the strip PLUS
    // one deliberate gap. Nick then ruled that gap away twice on rendered
    // screenshots ("there is still a large gap between the left menu strip
    // and the opened Page tab"), and R10(i) made it law — "an open drawer
    // sits FLUSH against what it opened from." The successor assertions
    // immediately below assert the NEW law (gap === 0) at the same three
    // widths, so coverage is not lost, only re-aimed. Live successor
    // instrument: scripts/menus-probe.mjs ("cascade panel flush at rail").
    //
    //   ok(`S3 @${w}px: the cascade panel sits genuinely FLUSH against the strip's own right edge — gap equals exactly --frame-gap (${frameGap}px), never an overlap and never a wider drift`,
    //     Math.abs(gap - frameGap) < 1, JSON.stringify({ gap, frameGap, strip, panel }));
    //   ok(`S3 @${w}px: no overlap — the panel's own left edge never sits before the strip's own right edge`,
    //     panel.left >= strip.right, JSON.stringify({ panelLeft: panel.left, stripRight: strip.right }));
    // --------------------------------------------------------------------
```

## Record 5 · from fx7.mjs lines 421-429 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cb2c993ba6e638951edbfeffccb8657486db759b

```js
  // ---- PARKED — SUPERSEDED by item 83 M1 (R10.i), 2026-08-04 ----------
  // Kept verbatim; same reasoning as the two parked checks above. Its point
  // — that the fix lives on the SHARED anchor, not a per-panel patch — is
  // preserved exactly by the successor beneath it, which makes the same
  // cross-tenant claim against the new zero-gap law.
  //
  //   ok('S3: the Plan category\'s own panel (a distinct cascade tenant) is ALSO flush against the strip — confirms the fix lives on the shared anchor, not a one-off per-panel patch',
  //     Math.abs((planPanel.left - stripForSurvey.right) - frameGapNow) < 1, JSON.stringify({ planPanel, stripForSurvey }));
  // --------------------------------------------------------------------
```

## Record 6 · from fx7.mjs lines 598-617 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 032c7cc499ff395fde14619c3aa6f53f8f5d7881

```js
  // ---- PARKED - SUPERSEDED by board-click-to-create (Nick, Oct 15 1:39am): the "Remove" row is DELETED from the board surface ----
  // S6 asserted the row's own Remove BUTTON is present and clicked it; the button no longer exists.
  // Quoted VERBATIM below. Successor: the Delete key on the selected card (BoardEditor.tsx key handler -> removeSelected, the same snapshot("remove") path); scripts/harness/board-click-create.mjs C10/C11.
  // const removeBtnRect = await app.evalJs(`(() => {
  //   const btns = [...document.querySelectorAll('.board-action-row button')];
  //   const btn = btns.find(b => b.textContent === 'Remove');
  //   if (!btn) return null;
  //   const r = btn.getBoundingClientRect();
  //   return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  // })()`);
  // ok('S6: the board-action-row\'s own Remove button is present once a dealt card is selected', !!removeBtnRect, JSON.stringify(removeBtnRect));
  // if (removeBtnRect) {
  //   const countBefore = await app.evalJs('window.wrizoBoard().length');
  //   await clickAt(app, removeBtnRect.x, removeBtnRect.y);
  //   await sleep(400);
  //   const stillThere = await app.evalJs(`!!document.querySelector('[data-box-id="${toRemove.id}"]')`);
  //   const countAfter = await app.evalJs('window.wrizoBoard()?.length');
  //   ok('S6: clicking Remove genuinely deletes the ACTUAL dealt card (and its own thread, if any) — already fully functional, confirmed live on the real door, not assumed from the hand-typed baseline alone',
  //     !stillThere && countAfter < countBefore, JSON.stringify({ stillThere, countBefore, countAfter }));
  // }
```

## Record 7 · from fx7.mjs lines 787-797 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a7726cef3f029697aec66dd9a73d724a3cdf05fb

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): "Plot a Story" has no door in the rail any more (the deck presets are the Boards tab's way in); the /project/:id/wizard route is untouched.
  // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
  //
  // ok('S9: the OLDER, pre-existing "Plot a Story" button lives in the Cascade\'s own Plan panel — a genuinely different doorway from either of B3\'s own two "…a deck…" doors',
  //   planButtons.includes('Plot a Story'), JSON.stringify(planButtons));
  // await app.evalJs("[...document.querySelectorAll('.wz-cascade-panel-body button')].find(b => b.textContent.trim() === 'Plot a Story')?.click()");
  // await sleep(400);
  // const oldWizardHash = await app.evalJs('location.hash');
  // const oldWizardBody = await app.evalJs('document.body.innerText.slice(0, 200)');
  // ok('S9 CONFIRMED: "Plot a Story" navigates to the OLD /project/:id/wizard route (StructureWizard.tsx) — a full-PAGE route change, never DeckWizard\'s own pop-out-over-blur — matching Nick\'s own "leading back to the old, deprecated wizard" verdict exactly',
  //   oldWizardHash.endsWith('/wizard') && oldWizardBody.includes('STRUCTURE WIZARD'), JSON.stringify({ oldWizardHash, oldWizardBody }));
```
