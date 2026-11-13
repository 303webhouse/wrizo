# Parked records archived from page-templates.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/page-templates.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from page-templates.mjs lines 99-100 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door and the first-line invite are deleted, everywhere, forever. Kept VERBATIM and no longer run; its record is on the parked leg; its successor follows (in full: c13-12f-sprout-invite.mjs).
  // ok('T1 [Free Write, blank page]: the beginnings row offers ONE door, Sprout - no Screenplay door, no Plan door', JSON.stringify(fwDoors) === JSON.stringify(['sprout']), JSON.stringify(fwDoors));
```

## Record 2 · from page-templates.mjs lines 123-132 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c2a1846afea6fa7d6c2d729659b0ac487052c5de

```js
  // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @ 0fc9afef, Fable Oct 16): the picker is FIVE live rows - Blank, Screenplay, Outline, Title Page, Bibliography - and the four grayed stand-ins (and Custom) are gone. Kept VERBATIM and no longer run; its successor follows.
  //
  // ok('T1 [Draft]: the Templates read Screenplay, Outline, Title page, Bibliography, Custom - in that order, and nothing else',
  //   JSON.stringify(s.map((b) => b.name)) === JSON.stringify(['Screenplay', 'Outline', 'Title page', 'Bibliography', 'Custom']), JSON.stringify(s.map((b) => b.name)));
  // SUPERSEDED (help-buttons, Fable Oct 18-19): the Templates heading now
  // carries its own "?" (HelpButton, unconditional in both themes) - a real
  // button inside .wz-sliver-templates that `s` (every button in the
  // section) was never written to expect. Kept verbatim, no longer run:
  //   ok('T1 [Draft, page-templates-r2 successor]: the Templates read Blank, Screenplay, Outline, Title Page, Bibliography - in that order, and nothing else',
  //     JSON.stringify(s.map((b) => b.name)) === JSON.stringify(['Blank', 'Screenplay', 'Outline', 'Title Page', 'Bibliography']), JSON.stringify(s.map((b) => b.name)));
```

## Record 3 · from page-templates.mjs lines 135-139 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2e059f8b836228230d706853f3c2aac6ba4bc8d

```js
  // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @ 0fc9afef, Fable Oct 16): the picker is FIVE live rows - Blank, Screenplay, Outline, Title Page, Bibliography - and the four grayed stand-ins (and Custom) are gone. Kept VERBATIM and no longer run; its successor follows.
  //
  // ok('T1 [Draft]: Screenplay is the ONE live template (not aria-disabled, keyed screenplay, with its glyph DRAWN at least 12px) - there is no Sprout and no Plan template',
  //   JSON.stringify(s.filter((b) => b.live).map((b) => b.key)) === JSON.stringify(['screenplay']) && s.filter((b) => b.live).every((b) => b.disabled === null && b.glyph)
  //     && (await app.evalJs("!document.querySelector('[data-template=\"sprout\"], [data-template=\"plan\"]')")), JSON.stringify(s));
```

## Record 4 · from page-templates.mjs lines 143-151 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c2a1846afea6fa7d6c2d729659b0ac487052c5de

```js
  // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @ 0fc9afef, Fable Oct 16): the picker is FIVE live rows - Blank, Screenplay, Outline, Title Page, Bibliography - and the four grayed stand-ins (and Custom) are gone. Kept VERBATIM and no longer run; its successor follows.
  //
  // ok('T1 [Draft]: the four after it are grayed placeholders - aria-disabled, titled "Coming soon", each with its glyph DRAWN at least 12px',
  //   s.filter((b) => !b.live).length === 4 && s.filter((b) => !b.live).every((b) => b.disabled === 'true' && b.title === 'Coming soon' && b.glyph), JSON.stringify(s.filter((b) => !b.live)));
  // SUPERSEDED (help-buttons, Fable Oct 18-19): same gap as above - "every
  // button in the Templates section" now also counts the heading's own "?".
  // Kept verbatim, no longer run:
  //   ok('T1 [Draft, page-templates-r2 successor]: no grayed placeholder is left - every button in the Templates section is a live row',
  //     s.filter((b) => !b.live).length === 0 && s.length === 5, JSON.stringify(s.filter((b) => !b.live)));
```

## Record 5 · from page-templates.mjs lines 186-191 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door and the first-line invite are deleted, everywhere, forever. Kept VERBATIM and no longer run; its record is on the parked leg; its successor follows (in full: c13-12f-sprout-invite.mjs).
  // const sprout = await press(app, '.wz-beginning[data-beginning="sprout"]');
  // await sleep(600);
  // const sprouted = await app.evalJs("({ invite: !!document.querySelector('.fl-invite'), row: !!document.querySelector('.wz-beginnings') })");
  // ok('T3 [Sprout, blank Free Write page]: the door draws the first-line invitation on THIS page, the row goes, and nothing is written',
  //   sprout.pressed && sprouted.invite && !sprouted.row && (await hash(app)) === h0 && (await rows(app)).length === 0, JSON.stringify({ sprouted, h0, now: await hash(app), rows: await rows(app) }));
```

## Record 6 · from page-templates.mjs lines 205-206 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door and the first-line invite are deleted, everywhere, forever. Kept VERBATIM and no longer run; its record is on the parked leg; its successor follows (in full: c13-12f-sprout-invite.mjs).
  // ok('T3 [vanish rule]: the first keystroke on a blank Free Write page takes the row away', rowBefore === '["sprout"]' && JSON.stringify(await pageDoors(app)) === '[]', JSON.stringify({ rowBefore, after: await pageDoors(app) }));
```

## Record 7 · from page-templates.mjs lines 234-237 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2e059f8b836228230d706853f3c2aac6ba4bc8d

```js
  // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (Fable Oct 16, Q3): the chip on a page a template pick opened is captioned "Opened as a new page · Back"; the page left is named in its accessible name. Kept VERBATIM and no longer run; its successor follows.
  //
  // ok(`T4: the new page carries a one-tap way back that names the page left ("Back to ${WORDS.slice(0, 20)}...")`,
  //   typeof chip === 'string' && chip.includes('Back to') && chip.includes(WORDS.slice(0, 20)), JSON.stringify(chip));
```

## Record 8 · from page-templates.mjs lines 254-258 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a7726cef3f029697aec66dd9a73d724a3cdf05fb

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): three starters.
  // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
  //
  // ok('T5: an empty user board still shows its Beginnings row with its own four doors (newCard, newPageCard, loadDeck, connectPage)',
  //   JSON.stringify(doors) === JSON.stringify(['newCard', 'newPageCard', 'loadDeck', 'connectPage']), JSON.stringify(doors));
```
