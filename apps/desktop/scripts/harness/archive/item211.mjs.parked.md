# Parked records archived from item211.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item211.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item211.mjs lines 125-131 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 0215e1e400e60a2e4ae44164911a2c974febd034

```js
    // ---- PARKED - SUPERSEDED by Nick's live bug (2026-10-06: "I can't click on the line next to 'BOLD' ... It seems to just activate
    // the strip menu") - FIX's click rule, store/hiddenMarks.ts snapCaretAfterClick. Kept VERBATIM and no longer run. A CLICK now keeps
    // the side of a run's closing marks it landed on, so a click just past the bold word lands AFTER the marks (14), outside the pair,
    // and the strip lights nothing; the keyboard keeps the left-character rule (the check above, 14 -> 12 by snap, is unchanged).
    //
    // ok('WALK: a real click just past the bold word lands after its last visible letter (12), inside the pair', clicked === 12, String(clicked));
    // ------------------------------------------------------------------
```

## Record 2 · from item211.mjs lines 236-245 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2e059f8b836228230d706853f3c2aac6ba4bc8d

```js
    // ---- PARKED - SUPERSEDED by PAGE-TEMPLATES-MOVE (Nick's rulings, 2026-10-08): the Templates row reads Screenplay (LIVE), then Outline, Title page, Bibliography and a NEW Custom placeholder, in that order. Kept VERBATIM and no
    // longer run; its parked record is in the HARNESS_PARKED block at the foot of this file, and its successor follows.
    //
    // ok('C2: Outline, Bibliography and Title page are dimmed stand-ins - aria-disabled, tooltip "Coming soon"',
    //   tpl.map((b) => b.name).join(',') === 'Outline,Bibliography,Title page' && tpl.every((b) => b.disabled === 'true' && b.title === 'Coming soon' && Number(b.opacity) < 1), JSON.stringify(tpl));
    // ------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @ 0fc9afef, Fable Oct 16): the four grayed stand-ins retire - the Templates section is a FIVE-row picker (Blank, Screenplay, Outline, Title Page, Bibliography), none disabled, Custom dropped. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
    //
    // ok('C2 [page-templates successor]: Outline, Title page, Bibliography and Custom are dimmed stand-ins, in that order - aria-disabled, tooltip "Coming soon"',
    //   tpl.map((b) => b.name).join(',') === 'Outline,Title page,Bibliography,Custom' && tpl.every((b) => b.disabled === 'true' && b.title === 'Coming soon' && Number(b.opacity) < 1), JSON.stringify(tpl));
```

## Record 3 · from item211.mjs lines 250-252 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2e059f8b836228230d706853f3c2aac6ba4bc8d

```js
    // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (2026-10-16): there are no stand-ins to press; the rows are live, and the one that is a no-op is the choice already made. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
    //
    // ok('C2: pressing them does nothing to the page', (await stored(app, id)) === textBefore && (await app.evalJs(`!!document.querySelector('${ED}')`)));
```

## Record 4 · from item211.mjs lines 256-262 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in ad74b67e6582b732788a4308466dc08b122f71d4

```js
    // SUPERSEDED (two tickets converged on the same fact from two directions
    // - theme-leftovers, Nick approved Oct 12, built Oct 16: this file never
    // switches theme, so it runs on Arbor's own default, which now reads
    // "Font"; and PAGE TEMPLATES R2, the approved mockup, which names the
    // same word as part of the same table - railTypeface). Kept verbatim,
    // no longer run:
    //   ok('C3: a "Typeface" heading sits directly above the font controls', typeHead && typeHead.cls === 'wz-sliver-h' && typeHead.text === 'Typeface' && /wz-type/.test(typeHead.next || ''), JSON.stringify(typeHead));
```

## Record 5 · from item211.mjs lines 273-275 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 587f7b7769db8a960c4d39ee8815645549479210

```js
    // ---- PARKED - SUPERSEDED by NICK'S RULING (via Fable, Oct 25): "Recede depth" is REMOVED, and with it the Preferences block (its only row): the Settings panel holds TWO headings, not three. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
    //
    //     ok('C4: every Settings heading is the theme\'s olive (--accent-rest), not brass', heads.h4.length === 3 && heads.h4.every((c) => c === heads.olive) && heads.olive !== heads.brass, JSON.stringify(heads));
```

## Record 6 · from item211.mjs lines 313-319 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in eb9babb567ec44f07d62f6af871c1abca75b428c

```js
    // ---- PARKED - SUPERSEDED by the 211 card port (2026-10-06): the popup now runs the page's editing rules, so it shows no mark at any caret, as the page ----
    // Kept VERBATIM and no longer run. The card kept the interim rule because Backspace and Delete there could half-delete a mark it
    // could not see; it now runs the page's rules (store/hiddenMarksEditing.ts), so neither can, and nothing needs to show.
    //
    // ok('R1: on the card popup a caret touching a marker (6, 8, 12, 14) shows that run\'s two marks, so Backspace and Delete act on something visible',
    //   [6, 8, 12, 14].every((o) => JSON.stringify(shownAt[o]) === JSON.stringify(['**', '**'])), JSON.stringify(shownAt));
    // ------------------------------------------------------------------
```

## Record 7 · from item211.mjs lines 334-336 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f65b7193d86c0ebe3a57cc5a38dd2e337b51fbcd

```js
  // SUPERSEDED (item word-diet, Nick) — railPageKind reworks, "Page kind" -> "Pages Kind".
  // ok('R2: Draft\'s drawer has a "Page kind" row directly below the Templates - Normal (chosen), Screenplay, Research - and no Convert row',
  //   !!row && row.heading === 'Page kind' && row.afterTemplates && row.kinds.join(',') === 'Normal*,Screenplay,Research' && row.convert === 0, JSON.stringify(row));
```
