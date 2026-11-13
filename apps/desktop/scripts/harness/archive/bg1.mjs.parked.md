# Parked records archived from bg1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/bg1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from bg1.mjs lines 165-189 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e4929b116f6e20c1c631e81c073ecd6f3cce066

```js
  // SUPERSEDED (item arbor-quiet-brass): "Connect a Page" -> "Graft a Page" (Arbor's own word).
  // ok('S1 (OPEN): an empty ordinary board renders the Beginnings row with exactly its four doors, in the brief's order — New Card · New Page Card · Load a Deck · Connect a Page', JSON.stringify(openDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', 'Connect a Page']), JSON.stringify(openDoors));
  // SUPERSEDED (item word-diet, Nick, HOLD resolved): "Graft a Page" ->
  // "+ Filed Pages".
  // ok('S1 (OPEN, arbor-quiet-brass successor): an empty ordinary board renders the Beginnings row with exactly its four doors, in the brief\'s order — New Card · New Page Card · Load a Deck · Graft a Page',
  //   JSON.stringify(openDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', 'Graft a Page']), JSON.stringify(openDoors));
  // SUPERSEDED (item word-diet, Nick, review fix) — beginNewPageCard reworks,
  // "New Page Card" -> "New Pages Card" (pages-rename bucket (a)).
  // ok('S1 (OPEN, word-diet successor): an empty ordinary board renders the Beginnings row with exactly its four doors, in the brief\'s order — New Card · New Page Card · Load a Deck · + Filed Pages',
  //   JSON.stringify(openDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', '+ Filed Pages']), JSON.stringify(openDoors));
  // SUPERSEDED (item word-diet-layouts, Fable Oct 15 — the board starter words
  // + the singular-exception rule): "New Pages Card" -> "New Page", "Load a
  // Deck" -> "Templates", "+ Filed Pages" -> "Connect Pages".
  // ok('S1 (OPEN) [word-diet successor]: an empty ordinary board renders the Beginnings row with exactly its four doors, in the brief\'s order — New Card · New Pages Card · Load a Deck · + Filed Pages',
  //   JSON.stringify(openDoors) === JSON.stringify(['New Card', 'New Pages Card', 'Load a Deck', '+ Filed Pages']), JSON.stringify(openDoors));
  // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): the starters are New Card, Templates, Connect Pages.
  // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
  //
  // ok('S1 (OPEN) [word-diet-layouts successor]: an empty ordinary board renders the Beginnings row with exactly its four doors, in the brief\'s order — New Card · New Page · Templates · Connect Pages',
  //   JSON.stringify(openDoors) === JSON.stringify(['New Card', 'New Page', 'Templates', 'Connect Pages']), JSON.stringify(openDoors));
  // ---- PARKED - SUPERSEDED by W3, guided paths (Nick / Fable, Oct 23): the board's load-a-deck door says Presets (Presets = decks, Templates = page dress - Nick, B1; W3 brief section 5).
  // Kept VERBATIM below and no longer run; the live successor follows (scripts/harness/guided-w3.mjs carries the new law).
  //
  // ok('S1 (OPEN) [big-projects-2 successor]: an empty ordinary board renders the Beginnings row with exactly its three doors - New Card · Templates · Connect Pages (no New Page)',
  //   JSON.stringify(openDoors) === JSON.stringify(['New Card', 'Templates', 'Connect Pages']), JSON.stringify(openDoors));
```

## Record 2 · from bg1.mjs lines 201-205 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 42cfc2af1a033a56a0d6952fc6dc7f5c9a3756ed

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a + step 2 (Fable's rulings Oct 19; chat 1's ledger 114 routed this): a board's starters are three doors (New Page left them; the sliver keeps that tool).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('S1: the doors sit on ONE line — a row, never a grid (identical top edge across all four)',
  //   doorTops.length === 4 && new Set(doorTops).size === 1, JSON.stringify(doorTops));
```

## Record 3 · from bg1.mjs lines 217-221 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 42cfc2af1a033a56a0d6952fc6dc7f5c9a3756ed

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a + step 2 (Fable's rulings Oct 19; chat 1's ledger 114 routed this): three doors.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('S1: every door is an icon+label door (a glyph and a word, per the brief)',
  //   doorShape.length === 4 && doorShape.every((d) => d.glyph && d.label.length > 0), JSON.stringify(doorShape));
```

## Record 4 · from bg1.mjs lines 228-235 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e4929b116f6e20c1c631e81c073ecd6f3cce066

```js
  // SUPERSEDED (item word-diet-layouts, Fable Oct 15) — beginLoadDeck reworks, "Load a Deck" -> "Templates" (both board modes that carry this door).
  // ok('S1 (STORYBOARD): the row is Load a Deck · New Lane · New Card — the brief\'s own set for this mode, in order',
  //   JSON.stringify(sbDoors) === JSON.stringify(['Load a Deck', 'New Lane', 'New Card']), JSON.stringify(sbDoors));
  // ---- PARKED - SUPERSEDED by W3, guided paths (Nick / Fable, Oct 23): the board's load-a-deck door says Presets (Presets = decks, Templates = page dress - Nick, B1; W3 brief section 5).
  // Kept VERBATIM below and no longer run; the live successor follows (scripts/harness/guided-w3.mjs carries the new law).
  //
  // ok('S1 (STORYBOARD) [word-diet-layouts successor]: the row is Templates · New Lane · New Card — the brief\'s own set for this mode, in order',
  //   JSON.stringify(sbDoors) === JSON.stringify(['Templates', 'New Lane', 'New Card']), JSON.stringify(sbDoors));
```

## Record 5 · from bg1.mjs lines 242-249 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e4929b116f6e20c1c631e81c073ecd6f3cce066

```js
  // SUPERSEDED (item word-diet-layouts, Fable Oct 15) — same beginLoadDeck rework.
  // ok('S1 (OUTLINE): the row is New Card · Load a Deck — the brief\'s own set for this mode, in order',
  //   JSON.stringify(olDoors) === JSON.stringify(['New Card', 'Load a Deck']), JSON.stringify(olDoors));
  // ---- PARKED - SUPERSEDED by W3, guided paths (Nick / Fable, Oct 23): the board's load-a-deck door says Presets (Presets = decks, Templates = page dress - Nick, B1; W3 brief section 5).
  // Kept VERBATIM below and no longer run; the live successor follows (scripts/harness/guided-w3.mjs carries the new law).
  //
  // ok('S1 (OUTLINE) [word-diet-layouts successor]: the row is New Card · Templates — the brief\'s own set for this mode, in order',
  //   JSON.stringify(olDoors) === JSON.stringify(['New Card', 'Templates']), JSON.stringify(olDoors));
```

## Record 6 · from bg1.mjs lines 313-322 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a7726cef3f029697aec66dd9a73d724a3cdf05fb

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): the starter row has no New Page door; the same act (a page born AND pinned to this board, travelled to) is the sliver's New Page tool.
  // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
  //
  // await clickDoor(app, 'newPageCard');
  // const pageCardHash = await app.evalJs('location.hash');
  // await sleep(400);
  // const pageCardPin = await app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'bg1-pagecard-board')?.boxes || []).filter(b => b.kind === 'page-pin').length");
  // ok('S1: New Page Card births a linked page and travels to it, pinning its card to this board in one act',
  //   /^#\/page\/[^/]+$/.test(pageCardHash) && !pageCardHash.includes('bg1-pagecard-board') && pageCardPin === 1,
  //   JSON.stringify({ pageCardHash, pageCardPin }));
```

## Record 7 · from bg1.mjs lines 364-385 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e4929b116f6e20c1c631e81c073ecd6f3cce066

```js
  // SUPERSEDED (item arbor-quiet-brass): "Connect a Page" -> "Graft a Page".
  // ok('S1: a paired plan board takes OPEN's row — it is an ordinary board and gets the ordinary four doors', JSON.stringify(planBoardDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', 'Connect a Page']), JSON.stringify(planBoardDoors));
  // SUPERSEDED (item word-diet, Nick, HOLD resolved): "Graft a Page" -> "+ Filed Pages".
  // ok('S1 (arbor-quiet-brass successor): a paired plan board takes OPEN\'s row — it is an ordinary board and gets the ordinary four doors',
  //   JSON.stringify(planBoardDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', 'Graft a Page']), JSON.stringify(planBoardDoors));
  // SUPERSEDED (item word-diet, Nick, review fix) — beginNewPageCard reworks,
  // "New Page Card" -> "New Pages Card".
  // ok('S1 (word-diet successor): a paired plan board takes OPEN\'s row — it is an ordinary board and gets the ordinary four doors',
  //   JSON.stringify(planBoardDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', '+ Filed Pages']), JSON.stringify(planBoardDoors));
  // SUPERSEDED (item word-diet-layouts, Fable Oct 15) — the same OPEN-row rework as S1 (OPEN) above.
  // ok('S1 [word-diet successor]: a paired plan board takes OPEN\'s row — it is an ordinary board and gets the ordinary four doors',
  //   JSON.stringify(planBoardDoors) === JSON.stringify(['New Card', 'New Pages Card', 'Load a Deck', '+ Filed Pages']), JSON.stringify(planBoardDoors));
  // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): the starters are New Card, Templates, Connect Pages.
  // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
  //
  // ok('S1 [word-diet-layouts successor]: a paired plan board takes OPEN\'s row — it is an ordinary board and gets the ordinary four doors',
  //   JSON.stringify(planBoardDoors) === JSON.stringify(['New Card', 'New Page', 'Templates', 'Connect Pages']), JSON.stringify(planBoardDoors));
  // ---- PARKED - SUPERSEDED by W3, guided paths (Nick / Fable, Oct 23): the board's load-a-deck door says Presets (Presets = decks, Templates = page dress - Nick, B1; W3 brief section 5).
  // Kept VERBATIM below and no longer run; the live successor follows (scripts/harness/guided-w3.mjs carries the new law).
  //
  // ok('S1 [big-projects-2 successor]: a paired plan board takes OPEN\'s row - an ordinary board with the ordinary three doors',
  //   JSON.stringify(planBoardDoors) === JSON.stringify(['New Card', 'Templates', 'Connect Pages']), JSON.stringify(planBoardDoors));
```

## Record 8 · from bg1.mjs lines 396-408 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - SUPERSEDED by PAGE-TEMPLATES-MOVE (Nick's rulings, 2026-10-08: the page row keeps ONE door, Sprout, on a
  // blank Free Write page; Screenplay is the Draft strip's live template; Plan stays on the PLAN bar only). Kept VERBATIM and
  // no longer run. Parked record in the HARNESS_PARKED block below; the successor follows.
  //
  // ok('S2: a zero-word page renders the three start-words — Screenplay · Sprout · Plan (P1 amendment 2; "Sprout" supersedes "Start from a Spark")',
  //   JSON.stringify(pageDoors) === JSON.stringify(['Screenplay', 'Sprout', 'Plan']), JSON.stringify(pageDoors));
  // ------------------------------------------------------------------
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the HARNESS_PARKED
  // block below (readings in bg1f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // ok('S2 [page-templates successor]: a zero-word Free Write page renders ONE start-word, Sprout (Screenplay is the Draft strip\'s template, Plan is the PLAN bar\'s door)',
  //   JSON.stringify(pageDoors) === JSON.stringify(['Sprout']), JSON.stringify(pageDoors));
  // ------------------------------------------------------------------
```

## Record 9 · from bg1.mjs lines 411-421 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the HARNESS_PARKED
  // block below (readings in bg1f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // const caretLive = await app.evalJs(`(() => {
  //   const ed = document.querySelector('.forward-only-editor');
  //   const active = document.activeElement;
  //   return { focused: !!ed && (ed === active || ed.contains(active)), rowEvents: getComputedStyle(document.querySelector('.wz-beginnings')).pointerEvents };
  // })()`);
  // ok('S2: the caret is LIVE under the row from the first frame — the editor already holds focus with nothing clicked, and the row itself is pointer-events:none so it can never intercept it',
  //   caretLive.focused === true && caretLive.rowEvents === 'none', JSON.stringify(caretLive));
  // ------------------------------------------------------------------
```

## Record 10 · from bg1.mjs lines 448-453 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the HARNESS_PARKED
  // block below (readings in bg1f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // ok('S2/S3: the page row counts nothing and claims no completion either — same grammar, same silence',
  //   pageLang.clean, pageLang.text);
  // ------------------------------------------------------------------
```

## Record 11 · from bg1.mjs lines 463-505 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the HARNESS_PARKED
  // block below (readings in bg1f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // // ==========================================================================
  // // S2 — Sprout: deck-drawn, never model-drawn; never insertable.
  // // ==========================================================================
  // await freshPage(app, 'bg1-sprout', '', LAPTOP_W, 900);
  // // Count every outbound request from this point on — page load included, since
  // // the counters are installed before the door is pressed and the page has been
  // // sitting mounted. The ratified disclosure sentence forbids a send on page
  // // load; the deck is local (NUDGE_POOL), so a drawn line costs zero requests.
  // await app.evalJs(`(() => {
  //   window.__bg1Net = 0;
  //   const f = window.fetch;
  //   window.fetch = function (...a) { window.__bg1Net++; return f.apply(this, a); };
  //   const open = XMLHttpRequest.prototype.open;
  //   XMLHttpRequest.prototype.open = function (...a) { window.__bg1Net++; return open.apply(this, a); };
  //   if (window.WebSocket) { const W = window.WebSocket; window.WebSocket = function (...a) { window.__bg1Net++; return new W(...a); }; }
  // })()`);
  // await clickDoor(app, 'sprout');
  // const sprouted = await app.evalJs(`({
  //   prompt: (document.querySelector('.fl-prompt')?.textContent || '').trim(),
  //   row: !!document.querySelector('.wz-beginnings'),
  //   net: window.__bg1Net,
  //   editorText: (document.querySelector('.forward-only-editor')?.innerText || '').trim(),
  //   insideEditor: !!document.querySelector('.forward-only-editor .fl-prompt'),
  //   controls: [...document.querySelectorAll('.fl-invite button')].map(b => b.textContent.trim()),
  // })`);
  // ok('S2: Sprout draws a line on request — an invitation appears where nothing was offered unbidden',
  //   sprouted.prompt.length > 0 && sprouted.row === false, JSON.stringify(sprouted));
  // ok('S2 (the rail): deck-drawn, never model-drawn — drawing a line makes ZERO outbound requests (fetch/XHR/WebSocket all counted)',
  //   sprouted.net === 0, String(sprouted.net));
  // ok('S2 (the rail): the drawn line can never become the writer\'s text — it renders OUTSIDE the editable DOM, the page still holds zero words, and the only control offered is "don\'t offer again" (no accept, no insert, no tab-fill)',
  //   sprouted.insideEditor === false && sprouted.editorText === '' &&
  //   JSON.stringify(sprouted.controls) === JSON.stringify(['don’t offer again']), JSON.stringify(sprouted));
  //
  // // The writer's ink still wins the space: the first keystroke takes it back.
  // await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  // await app.typeKeys('Mine.');
  // await sleep(300);
  // ok('S2 (the rail): the first keystroke dismisses the drawn line — the writer\'s ink always wins the space',
  //   (await app.evalJs("!document.querySelector('.fl-prompt')")) === true);
  // ------------------------------------------------------------------
```

## Record 12 · from bg1.mjs lines 568-572 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8fec130d7d8b996e28486a450a4a151bec438486

```js
  // ---- PARKED - SUPERSEDED by board-click-to-create (Nick's faint-starters ruling, Oct 14-15; merged 7b4a3826) ----
  // The BOARD's starters are a thin square outline at 40% opacity now (the page row keeps full strength), so "identical ... resting weight" - compared through opacity - is no longer true.
  // Quoted VERBATIM below. Successor: the two checks directly below (same component: identical type/size/colour, board faint at 0.4, page 1; the board starters fade on the first press).
  // ok('S3: the board row and the page row ARE one component — identical computed type, size, color and resting weight on both surfaces',
  //   JSON.stringify(pageStyle) === JSON.stringify(boardStyle), JSON.stringify({ pageStyle, boardStyle }));
```

## Record 13 · from bg1.mjs lines 574-579 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door (the page row's only door) and the first-line invite are
  // deleted, everywhere, forever, so a blank page has no row. Kept VERBATIM and no longer run; its record is in the HARNESS_PARKED
  // block below (readings in bg1f); the successor follows (in full: c13-12f-sprout-invite.mjs).
  // ok('S3 [faint-starters successor]: the board row and the page row ARE one component - identical computed type, size and color on both surfaces - and differ in ONE thing only, by ruling: the board starters rest at opacity 0.4, the page row at 1',
  //   JSON.stringify(noOpacity(pageStyle)) === JSON.stringify(noOpacity(boardStyle)) && boardStyle.opacity === '0.4' && pageStyle.opacity === '1', JSON.stringify({ pageStyle, boardStyle }));
  // ------------------------------------------------------------------
```

## Record 14 · from bg1.mjs lines 664-670 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8fec130d7d8b996e28486a450a4a151bec438486

```js
    // ---- PARKED - SUPERSEDED by board-click-to-create (Nick's faint-starters ruling, Oct 14-15; merged 7b4a3826) ----
    // The board door is still the house olive at --accent-door (#4F5730) but rests at opacity 0.4 now, not 1 (BG2 had retired the resting opacity; the faint-starters ruling restores a quiet one, on the BOARD row only).
    // Quoted VERBATIM below. Successor: the pok directly below (generation 2).
    // pok('PARKED (was "S1: the doors are painted in the house olive (--accent-rest #96a05a), quietly (resting opacity below full) — olive means \\"this is a door\\"") — BG2 S1 steps the SAME olive down in value to --accent-door (#4F5730) for legibility on cream and retires the resting opacity: the door is quiet by value now, not by fade; live successor: bg2.mjs',
    //   paintNow.color === 'rgb(79, 87, 48)' && parseFloat(paintNow.opacity) === 1 &&
    //   paintNow.doorToken === '#4F5730' && paintNow.oldToken === '#96a05a',
    //   JSON.stringify(paintNow));
```
