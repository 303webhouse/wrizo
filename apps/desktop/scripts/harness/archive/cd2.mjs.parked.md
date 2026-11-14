# Parked records archived from cd2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/cd2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from cd2.mjs lines 205-229 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
    // ---- PARKED — SUPERSEDED by VW1 (item 134), 2026-09-17 --------------
    // GENERATION 4, quoted VERBATIM and no longer asserted. It pinned the
    // strip's labels in the OLD flat sequence, at both reference widths. VW1
    // regroups the rail by KIND (Page.Plan / Drawers / Journal.Shelf / foot),
    // re-ruling that sequence by founder word — the regroup is SUPPOSED to
    // break this, so it is parked, never edited.
    //
    // ok(`CD3 successor of "S1 @ ${width}px: B1's own updated roster, verbatim order — Journal, Page, Plan, Drawers, Shelf, Trash, Settings, Change Theme": the updated roster, verbatim order — Journal, Page, Plan, Drawers, Shelf, Settings, Themes, Trash`,
    // JSON.stringify(stripShape.labels) === JSON.stringify(['Journal', 'Page', 'Plan', 'Drawers', 'Shelf', 'Settings', 'Themes', 'Trash']),
    // JSON.stringify(stripShape.labels));
    // ----------------------------------------------------------------
    // SUPERSEDED (item word-diet, Nick) — drawerPage reworks, "Page" -> "Pages".
    // ok(`VW1 successor of the CD3 roster check @ ${width}px: the strip carries the SAME eight categories as ever, compared as a SET rather than a sequence — order is VW1's to rule and vw1.mjs is what asserts it, so this file no longer duplicates that claim`,
    //   stripShape.itemCount === 8
    //     && JSON.stringify([...stripShape.labels].sort())
    //        === JSON.stringify(['Drawers', 'Journal', 'Page', 'Plan', 'Settings', 'Shelf', 'Themes', 'Trash']),
    //   JSON.stringify(stripShape.labels));
    // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the strip carries the SAME seven categories at both widths, compared as a SET by name (the place block's label is the place - a Drawer, the Journal or Unsorted - so the labels are no longer a fixed roster).
    // Kept VERBATIM below and no longer run; the live successor follows. The rail is seven tabs now - the place block (data-category=drawers, the switcher) first, then Pages, Boards, Journal and the foot - the Shelf is merged into the Journal, and the Drawers tiles are gone.
    //
    // ok(`VW1 successor of the CD3 roster check @ ${width}px [word-diet successor]: the strip carries the SAME eight categories as ever, compared as a SET rather than a sequence`,
    //   stripShape.itemCount === 8
    //     && JSON.stringify([...stripShape.labels].sort())
    //        === JSON.stringify(['Drawers', 'Journal', 'Pages', 'Plan', 'Settings', 'Shelf', 'Themes', 'Trash']),
    //   JSON.stringify(stripShape.labels));
```

## Record 2 · from cd2.mjs lines 248-255 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4603ace14d5da72b17f3dc8f9a0a435a0233f45

```js
  // SUPERSEDED (item word-diet, Nick) — cascadeJournalNewPage reworks, "New page" -> "New Pages".
  // ok('S3: clicking Journal opens layer 2 with "Open the Journal" and "New page"',
  //   journalPanel.open && journalPanel.title === 'Journal' && journalPanel.hasOpenJournal && journalPanel.hasNewPage,
  //   JSON.stringify(journalPanel));
  // SUPERSEDED (item word-diet-layouts, Fable Oct 15 — the singular-exception rule) — cascadeJournalNewPage reworks back, "New Pages" -> "New Page".
  // ok('S3 [word-diet successor]: clicking Journal opens layer 2 with "Open the Journal" and "New Pages"',
  //   journalPanel.open && journalPanel.title === 'Journal' && journalPanel.hasOpenJournal && journalPanel.hasNewPage,
  //   JSON.stringify(journalPanel));
```

## Record 3 · from cd2.mjs lines 299-302 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f65b7193d86c0ebe3a57cc5a38dd2e337b51fbcd

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeProject drops its "In " prefix
  // whole ("{drawer name}", bare); ORIGINAL claim parked verbatim:
  // ok('S3 (successor to ab3.mjs\'s "S4/S2: the Page face\'s Where-it-lives names the project..."): the home label still names the project ("In Untitled" — this fixture never typed a title) through the cascade\'s Page panel',
  //   homeLabel === 'In Untitled', String(homeLabel));
```

## Record 4 · from cd2.mjs lines 311-315 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f65b7193d86c0ebe3a57cc5a38dd2e337b51fbcd

```js
  // SUPERSEDED (item word-diet, Nick) — the saved-silently footer line
  // RETIRES whole (JournalEntry.tsx's own footer: subject prop, now
  // undefined unconditionally). ORIGINAL claim parked verbatim:
  // ok('S3/DoD: on a loose (unfiled) page, the Page panel carries the saved-silently footer — its only appearance anywhere once framed',
  //   !!loosePageFooter && loosePageFooter.includes('Saved automatically'), String(loosePageFooter));
```

## Record 5 · from cd2.mjs lines 364-367 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 85412cd812ea9ace48375cd963157dcf5a074a39

```js
  // SUPERSEDED (Fable, Oct 31, ledger 166 - the same settle race as S2's: the panel is still leaving for --drawer-dur at a 150 ms read). Kept verbatim, no longer
  // asserted; its 150 ms read is the parked record. The successor waits for the panel to be GONE (polled every 25 ms, cap 2 s):
  // ok('S3 (successor to ab3.mjs\'s own keystroke-dissolve check, Page-panel-specific): typing while the Page panel is open dissolves it too, same engine',
  //   pagePanelGoneAfterType, String(pagePanelGoneAfterType));
```

## Record 6 · from cd2.mjs lines 386-392 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): there is no Shelf tab (clickCategory THROWS for a category that is absent, which would abort this whole file).
  // Kept VERBATIM below and no longer run; the live successor follows. The rail is seven tabs now - the place block (data-category=drawers, the switcher) first, then Pages, Boards, Journal and the foot - the Shelf is merged into the Journal, and the Drawers tiles are gone.
  //
  // await clickCategory(app, 'shelf'); // Shelf
  // await sleep(200);
  // const shelfPanelEmpty = await app.evalJs("document.querySelector('.wz-cascade-panel-title')?.textContent");
  // ok('S3: clicking Shelf opens layer 2, titled "Shelf"', shelfPanelEmpty === 'Shelf', String(shelfPanelEmpty));
```

## Record 7 · from cd2.mjs lines 536-542 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 4ebc44d8671dbcf250a7bd2b13ad57b27eb35d9c

```js
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 8 (the rail pop-outs use the Tools strip's slide-and-fade): a closing pop-out STAYS DRAWN, inert (data-leaving), for the strip's own duration (--drawer-dur, 200 ms) while it slides back and fades out,
  // so "gone" is true after the exit, not 150 ms after Escape. Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it must now fail at 150 ms, for exactly that reason).
  // await sleep(150);
  // const afterEscape2 = await app.evalJs(`({ panelGone: !document.querySelector('.wz-cascade-panel'), stripPresent: !!document.querySelector('.wz-strip') })`);
  // ok('S2: Escape walks back the second layer too — panel closes, the strip persists',
  // afterEscape2.panelGone && afterEscape2.stripPresent, JSON.stringify(afterEscape2));
  // ------------------------------------------------------------------
```

## Record 8 · from cd2.mjs lines 565-570 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 13dccde2e470338532cf1c04132a3314963abbc7

```js
  // SUPERSEDED (Fable, Oct 31, ledger 166 - the settle-race family: the box, since its 06:29Z reboot, reads this at 150 ms while the layers are still
  // leaving for --drawer-dur). Kept verbatim, no longer asserted; its 150 ms read is the parked record below. The successor waits for the layers to be GONE
  // (polled every 25 ms, cap 2 s - the vanishing engine's own exit is --drawer-dur, .2 s) and asserts what the original meant: both layers dissolve, the strip survives opaque.
  // ok('S2: a keystroke dissolves BOTH open layers (2-3) via the one vanishing engine, while the strip survives, fully opaque (never dissolving, S1\'s own law)',
  // afterKeystroke.panelGone && afterKeystroke.surveyGone && afterKeystroke.stripPresent && afterKeystroke.stripOpacity === '1',
  // JSON.stringify(afterKeystroke));
```

## Record 9 · from cd2.mjs lines 674-692 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the Drawers tab is the PLACE SWITCHER (Drawers, Journals, + New Drawer); the tiles retire (boards are listed by the Boards pop-out, step 2).
  // Kept VERBATIM below and no longer run; the live successor follows. The rail is seven tabs now - the place block (data-category=drawers, the switcher) first, then Pages, Boards, Journal and the foot - the Shelf is merged into the Journal, and the Drawers tiles are gone.
  //
  // const drawersTiles = await app.evalJs(`({
  //   titles: [...document.querySelectorAll('.wz-drawers-tile-title')].map(t => t.textContent),
  //   clusterTitles: [...document.querySelectorAll('.wz-drawers-cluster-title')].map(t => t.textContent),
  //   firstTile: document.querySelector('.wz-drawers-tile .wz-drawers-tile-title')?.textContent,
  //   bodyText: document.querySelector('.wz-cascade-panel-body')?.innerText ?? '',
  // })`);
  // ok('B2 S7 successor of "S3: the Drawers panel lists the drawer entities (not a flat page list)" / "S3/S4: choosing a drawer opens ITS survey": the panel now shows large tiles, Shelf first, a project cluster with both board titles, and NO count/badge/timestamp anywhere in its text',
  //   drawersTiles.firstTile === 'Shelf' && drawersTiles.clusterTitles.includes('Untitled')
  //     && drawersTiles.titles.includes('First Board') && drawersTiles.titles.includes('Second Board')
  //     && !/\d/.test(drawersTiles.bodyText),
  //   JSON.stringify(drawersTiles));
  // // A tile tap travels.
  // await app.evalJs("[...document.querySelectorAll('.wz-drawers-tile')].find(b => b.textContent.includes('First Board')).click()");
  // await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Drawers tile travel (First Board)' });
  // const drawersTileRoute = await app.evalJs('location.hash');
  // ok('B2 S7: a Drawers tile tap travels — the board tile lands on that real board page', drawersTileRoute.startsWith('#/page/'), drawersTileRoute);
```

## Record 10 · from cd2.mjs lines 796-799 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 85412cd812ea9ace48375cd963157dcf5a074a39

```js
  // SUPERSEDED (Fable, Oct 31, ledger 166 - the same settle race as S2's: the layers are still leaving for --drawer-dur at a 200 ms read). Kept verbatim, no longer
  // asserted; its 200 ms read is the parked record. The successor waits for both to be GONE (polled every 25 ms, cap 2 s):
  // ok('T5 (contrast, SAME fixture): an UNDOCKED layer still dissolves on keystroke as before — the rider is genuinely conditional on docked state, not blanket',
  //   undockedDissolves.panelGone && undockedDissolves.surveyGone, JSON.stringify(undockedDissolves));
```

## Record 11 · from cd2.mjs lines 821-830 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5b976d36091f22cc9c89ef9312713720af0e01ed

```js
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 8 (the rail pop-outs use the Tools strip's slide-and-fade): a pop-out that closes STAYS DRAWN, inert (data-leaving), for the strip's --drawer-dur (200 ms), so "gone" is true after the exit, not 200 ms after the press.
  // Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it holds once the exit has played).
  // const dismissedDocked = await app.evalJs(`({
  // surveyGone: !document.querySelector('.wz-cascade-survey'),
  // panelGone: !document.querySelector('.wz-cascade-panel'),
  // categoryActive: document.querySelector('.wz-strip-item[data-category=journal]').classList.contains('active'),
  // })`);
  // ok('T5: a docked survey\'s own explicit close button dismisses it entirely (category no longer olive)',
  // dismissedDocked.surveyGone && dismissedDocked.panelGone && !dismissedDocked.categoryActive, JSON.stringify(dismissedDocked));
  // ------------------------------------------------------------------
```

## Record 12 · from cd2.mjs lines 840-845 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in bd5cf4c1db00dd3302db5e530ef7ad5439ef1ddd

```js
  // ---- PARKED - SUPERSEDED by TOOLS rail bug #4 (Fable, Nov 7): in the Journal the Journal pin wears `.active` while the PLACE is the Journal (the ruling), so `.active` no longer means "a panel is open" there; the panel's own state is `aria-pressed`.
  // The two records below are kept VERBATIM and no longer run; the successors follow and read aria-pressed (the same assertion about the panel, through the attribute that still means it).
  // ok('T5 [item-8 successor]: a docked survey\'s own explicit close button dismisses it entirely - the layers EXIT (still drawn, data-leaving, inert, at 200 ms) and are gone after the exit; the category is no longer olive',
  //   ((dismissedDocked.surveyGone && dismissedDocked.panelGone) || dismissedDocked.leaving) && dismissedAfterExit.surveyGone && dismissedAfterExit.panelGone && !dismissedDocked.categoryActive, JSON.stringify({ dismissedDocked, dismissedAfterExit }));
  // ok('T5 [parked record]: the ORIGINAL (both layers gone 200 ms after the press) fails ONLY because the exit lasts --drawer-dur; it holds once the exit has played', dismissedAfterExit.surveyGone && dismissedAfterExit.panelGone && !dismissedDocked.categoryActive, JSON.stringify(dismissedAfterExit));
  // ------------------------------------------------------------------
```

## Record 13 · from cd2.mjs lines 1001-1009 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
  // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23-24): the page column is no longer the paper. The prose page is PAINTED by a transform
  // inside it, and in the Typewriter zoom (Arbor's default) the column widens to the whole stage - which the strip, fixed at the window's left,
  // always stood over. The claim's subject is the PAPER; the successor reads the painted .mode-page. (Lane 3 also caught the paper itself 3px under
  // the strip at this width - a real defect, fixed: pageScale.ts ZOOM_CLEAR.) Kept VERBATIM and no longer run; record in the parked section.
  //
  // ok('S1/S5 (successor to ab1.mjs\'s "...at the gate floor (1100px): the page column never overlaps the tool-rail"): the page column never overlaps the strip track at the gate floor either',
  //   gateFloorPagecolRect.left >= gateFloorStripRect.left + gateFloorStripRect.width,
  //   JSON.stringify({ gateFloorStripRect, gateFloorPagecolRect }));
  // ------------------------------------------------------------------
```

## Record 14 · from cd2.mjs lines 1048-1054 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): every one of the SEVEN strip items.
  // Kept VERBATIM below and no longer run; the live successor follows. The rail is seven tabs now - the place block (data-category=drawers, the switcher) first, then Pages, Boards, Journal and the foot - the Shelf is merged into the Journal, and the Drawers tiles are gone.
  //
  // ok('CD3 canon (a): every one of the EIGHT strip items reads its resting color as --text-hi (never --brass), no hover/force applied — a real sweep, not the audit\'s own single-item (Journal) spot check',
  //   stripRestSweep.items.length === 8
  //     && stripRestSweep.items.every((it) => !it.active && it.color === stripRestSweep.textHi && it.color !== stripRestSweep.brass),
  //   JSON.stringify(stripRestSweep));
```

## Record 15 · from cd2.mjs lines 1114-1130 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick, Oct 23: rulings a-c - the prose page is a letter page in page units, 8.5 x 11 page-inches with
    // 1in margins, painted at the stage's scale; and the Typewriter zoom widens the column to the stage). The two byte-identity checks below pinned
    // the 8884d49 paper (615px, a 537px line); page-size moved both ON PURPOSE. Their POINT - the strip costs the paper nothing; the paper's size
    // comes from the page, not from the chrome - is what the successors assert: the painted page is exactly the ruled page at the stage's scale,
    // centred on the stage, and the line length is the page's own (identical at 1100 and 2200). Kept VERBATIM and no longer run; records in the
    // parked section. (The Y-position successor after them is untouched.)
    //
    // ok(`CD3 canon (b) @ ${width}px: the paper's own rect (.mode-pagecol/.mode-page) is byte-identical to main @ 8884d49 in left/width/right/height`,
    //   paperNow.pagecol.left === baseline.pagecol.left && paperNow.pagecol.width === baseline.pagecol.width
    //     && paperNow.pagecol.right === baseline.pagecol.right && paperNow.pagecol.height === baseline.pagecol.height
    //     && paperNow.page.left === baseline.page.left && paperNow.page.width === baseline.page.width
    //     && paperNow.page.right === baseline.page.right && paperNow.page.height === baseline.page.height,
    //   JSON.stringify({ paperNow, baseline }));
    // ok(`CD3 canon (b) @ ${width}px: the text measure is byte-identical to main @ 8884d49 — .forward-only-editor's own computed width (line length) and .mode-pagecol's own computed width (column width)`,
    //   paperNow.editorWidth === baseline.editorWidth && paperNow.pagecolWidth === baseline.pagecolWidth,
    //   JSON.stringify({ paperNow, baseline }));
    // ------------------------------------------------------------------
```

## Record 16 · from cd2.mjs lines 1137-1146 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 4986b0de6ab7c85390f03fb0e382678f542e4cf3

```js
    // ---- PARKED - SUPERSEDED by the framed-desk display pass (aa11f58, 2026-09-30) ----------------------------------------
    // Kept VERBATIM and no longer run. The disclosed 10px is still there; the display pass adds a second, separately disclosed
    // 2px (the smaller mode tabs), so the paper now sits 12px above the 8884d49 baseline. The check's POINT - the Y move is
    // exactly the disclosed amount, never a silent drift - is what the successor still asserts, with both amounts named. The two
    // checks above it (the paper's left/width/right/height and the text measure, byte-identical) are untouched and still pass.
    //
    // ok(`CD3 canon (b) @ ${width}px: the paper's Y position moves by EXACTLY the disclosed ${CHROME_SHRINK_PX}px (the mode-strip box's own dropped border+padding) — not a silent additional drift`,
    //   baseline.pagecol.top - paperNow.pagecol.top === CHROME_SHRINK_PX,
    //   JSON.stringify({ baselineTop: baseline.pagecol.top, nowTop: paperNow.pagecol.top, delta: baseline.pagecol.top - paperNow.pagecol.top }));
    // ------------------------------------------------------------------
```

## Record 17 · from cd2.mjs lines 1164-1179 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 9ce8f6b36eac89a5158a856643d5de12852e9f70

```js
// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// B1 (2026-07-19) is the first tenant of this scaffold: the strip's own
// "seven categories, verbatim roster" claim (S1, quoted verbatim below) is
// falsified whole by the Trash category joining section C at the foot.
// Live successor: this file's own live S1 section, above (now asserting
// eight categories and the updated roster).
//
//   ok(`S1 @ ${width}px: the strip is present with four sections (3
//   hairline separators) and seven categories, icon+label, focusable (real
//   <button>s)`,
//     stripShape.present && stripShape.sepCount === 3 &&
//     stripShape.itemCount === 7 && stripShape.focusable, ...);
//   ok(`S1 @ ${width}px: A11's own roster, verbatim order — Journal, Page,
//   Plan, Drawers, Shelf, Settings, Change Theme`,
//     JSON.stringify(stripShape.labels) === JSON.stringify(['Journal',
//     'Page', 'Plan', 'Drawers', 'Shelf', 'Settings', 'Change Theme']), ...);
```

## Record 18 · from cd2.mjs lines 1357-1366 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 446f008d59e1678f7409066dc164b081b21cac4e

```js
        // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15) ----
        // The Plan panel's board-row Delete no longer carries its own inline confirm (T4's "one plain confirm"): it asks the ONE "Send to Trash?" dialog (Cancel / Delete / Don't ask me again) like every other delete. The act - soft-delete, gone from the list and the store - is unchanged.
        // Quoted VERBATIM below. Successor: the two poks directly below (generation 2).
        // const confirmState = await app.evalJs(`({
        //   confirmShown: !!document.querySelector('.wz-cascade-confirm'),
        //   hasCancel: !!document.querySelector('.wz-cascade-confirm-cancel'),
        //   hasDanger: !!document.querySelector('.wz-cascade-confirm-danger'),
        // })`);
        // pok('PARKED (was "T4: one plain confirm appears — destructive color lives ONLY here, never at rest (the disclosure item itself stayed --text-mid)") — PW1 S1: unchanged mechanic, re-derived on the panel\'s own board row',
        //   confirmState.confirmShown && confirmState.hasCancel && confirmState.hasDanger, JSON.stringify(confirmState));
```

## Record 19 · from cd2.mjs lines 1412-1417 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a7726cef3f029697aec66dd9a73d724a3cdf05fb

```js
    // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): the loose page's Boards tab has no Create a Board / Plot a Story; it has the New Board door.
    // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
    //
    // pok('PARKED (was "S3: Plan on a loose (project-less) page still offers Create a Board / Plot a Story, but Open… is silently absent (nothing to survey yet)") — PW1 S1 + Fable\'s ruling 2: the two creation doors stand unchanged, "Open…" is absent because it RETIRED (not because there is nothing to survey — the reason changed even though the observation did not), and an unconnected loose page shows NO zone at all (PW9). Live successor: pw1.mjs\'s own loose-page section, which pins one and proves the zone then appears ABOVE the doors',
    //   loosePanel.hasCreateBoard && loosePanel.hasPlotStory && !loosePanel.hasOpenLink && !loosePanel.hasZone,
    //   JSON.stringify(loosePanel));
```

## Record 20 · from cd2.mjs lines 1514-1519 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
    // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the Drawers tab is the place switcher, not the large-tile panel (and there is still no survey column).
    // Kept VERBATIM below and no longer run; the live successor follows. The rail is seven tabs now - the place block (data-category=drawers, the switcher) first, then Pages, Boards, Journal and the foot - the Shelf is merged into the Journal, and the Drawers tiles are gone.
    //
    // const oldDrawerSurveyGone = await app.evalJs("!document.querySelector('.wz-cascade-survey') && !!document.querySelector('.wz-drawers-tiles')");
    // pok('PARKED (was "S3: the Drawers panel lists the drawer entities (not a flat page list)" + "S3/S4: choosing a drawer opens ITS survey (the filed pages inside that specific drawer)") — B2 S7: the old Drawer-entity list/survey is GONE whole, replaced by the large-tile Drawers panel — live successor: this file\'s own live S3/S4 section, rebuilt',
    //   oldDrawerSurveyGone === true, String(oldDrawerSurveyGone));
```
