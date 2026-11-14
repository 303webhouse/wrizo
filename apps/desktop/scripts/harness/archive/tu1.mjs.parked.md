# Parked records archived from tu1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/tu1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from tu1.mjs lines 188-195 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23, rulings a-b and the zoom): the text's right edge is no longer the column's right minus
    // 38px. The page is painted by a transform inside its column, its margins are page-inches (1in), and in the Typewriter zoom the column is the whole
    // stage (lane 3: "paperTextRight" 1029 at 1100, while the real text ended ~909). The text measure is the editor itself; the successor reads it.
    // Kept VERBATIM and no longer run; records in the parked section.
    //
    // ok(`S6 geometry @${width}: the grip never enters the paper's text measure`,
    //   gripRect.left >= paperTextRight - 0.5, JSON.stringify({ gripRect, paperTextRight }));
    // ------------------------------------------------------------------
```

## Record 2 · from tu1.mjs lines 331-336 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e1c9d1064ac816596f26e0fcfe68e1f4cbd99ca6

```js
  // SUPERSEDED (item word-diet, review fix) — the substring used a curly
  // right single quote (U+2019); the actual lexicon value (deskLexicon.ts)
  // is a plain straight apostrophe, so .includes() never matched.
  // ok('S6 [word-diet successor]: pressed, it reveals the TRUST wording, every promise carried',
  //   typeof noteShown === 'string' && noteShown.includes('Nothing leaves your desk unasked') && noteShown.includes('these Pages’ recent changes') && noteShown.includes('your Bible'),
  //   String(noteShown));
```

## Record 3 · from tu1.mjs lines 376-380 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f65b7193d86c0ebe3a57cc5a38dd2e337b51fbcd

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeLoose's text itself changed,
  // "Loose — belongs nowhere yet" -> "Unfiled" (no longer contains "loose").
  // ORIGINAL claim parked verbatim:
  // ok('S3 Structure: a loose page reads its own honest home label',
  //   structureLoose.toLowerCase().includes('loose'), structureLoose);
```

## Record 4 · from tu1.mjs lines 413-417 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f65b7193d86c0ebe3a57cc5a38dd2e337b51fbcd

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeProject drops "In " whole;
  // this fixture's project is never titled (F4's "no title required" door).
  // ORIGINAL claim parked verbatim:
  // ok('S3 Structure: a filed page names its project as home',
  //   structureFiled.includes('In '), structureFiled);
```

## Record 5 · from tu1.mjs lines 420-434 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2a97482981b0e80b676a3de2cedbcb515c218f9a

```js
  // PW1 S3/PW27 + Fable's ruling 4 (2026-09-08) — SUPERSEDED IN PLACE, original
  // quoted verbatim (A4). Item 125 separates MEMBERSHIP from DISPLAY: the
  // pin-card is one display of the relation, and a page can be a member of a
  // board while appearing on its canvas not at all. "Pinned" named the card, so
  // the membership line stopped being able to say it — it now reads "Also
  // connected to <board>.", the same connecting word the Plan panel's own
  // "Boards connected" heading and the Places zone carry.
  //
  // The CLAIM is unchanged and still exactly as strong: the Structure lens tells
  // the truth about where this page is connected. Only the true word changed.
  //   ORIGINAL:
  //   ok('S3 Structure: a page pinned to a board carries a truthful membership line',
  //     structureFiled.toLowerCase().includes('pinned'), structureFiled);
  // SUPERSEDED (item arbor-quiet-brass): "connected" renamed to Arbor's own "grafted".
  // ok('S3 Structure: a page connected to a board carries a truthful membership line (PW1/ruling 4 successor of the same claim, when the word was "pinned")', structureFiled.toLowerCase().includes('connected to'), structureFiled);
```

## Record 6 · from tu1.mjs lines 478-482 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e1c9d1064ac816596f26e0fcfe68e1f4cbd99ca6

```js
  // SUPERSEDED (item word-diet, Nick) — tutorLensFragmentsNote moves behind
  // a "?" (rule 3: explanations behind "?", one sentence); the panel no
  // longer "plainly discloses" it standing — press the note instead.
  // ok('S3 Fragments: the panel plainly discloses its own recency+tags-only simplicity',
  //   fragText.toLowerCase().includes('recency') || fragText.toLowerCase().includes('tags only'), fragText);
```
