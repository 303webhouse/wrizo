# Parked records archived from sc1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/sc1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from sc1.mjs lines 238-272 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 9073019add7686fbf56b8bfb0e52393c362243c9

```js
    // SUPERSEDED by SC2 S2b (2026-07-25) — A4 park cycle, travelling in the
    // SAME commit as the change that falsified it. The ORIGINAL, verbatim:
    //
    //   ok(`S1 @ ${label}: the sheet is a US Letter page — 8.5 x 11in, aspect
    //   within 0.5% of 8.5:11`,
    //     Math.abs(m.aspect - ASPECT) / ASPECT < 0.005 && Math.abs(m.width -
    //     PAGE_W) <= 1 && Math.abs(m.height - PAGE_H) <= 1,
    //     JSON.stringify({ width: m.width, height: m.height, aspect: m.aspect,
    //     target: ASPECT }));
    //
    // SUPERSEDED ON ITS SUBJECT, NOT ON ITS TRUTH — and the distinction is
    // stated because it is exactly the one the park law asks for. This is a
    // PARK (the check's subject retired), not a fixture re-point (the vehicle
    // did not move) and not an annotation (the entry is not merely residue).
    // The subject was THE SHEET, singular. SC2 S2b makes the surface a SEQUENCE
    // of sheets, so "the sheet" names nothing in particular: `pageMetrics()`
    // reads `document.querySelector('.script-sheet')`, which from this commit
    // on silently measures the FIRST of N. The check would still have PASSED —
    // that is precisely why it needed parking rather than fixing. A check that
    // goes on passing while quietly covering a shrinking fraction of what it
    // claims is worse than one that fails, because nothing announces it.
    //
    // The LAW it carried — a page is 8.5 x 11in — is not merely intact but
    // MULTIPLIED: it now holds N times per document instead of once. The
    // successor below re-asserts it of EVERY sheet the sequence renders here,
    // which on this fixture (a fresh page through the real wizard) is a sequence
    // of one — an honest statement of what this leg can see.
    //
    // The successor that ends WIDER than the predecessor lives in sc2.mjs's own
    // S2b section, at these same four legs plus legacy, on a genuinely
    // multi-page document: every sheet 816 x 1056, uniform across the sequence,
    // the inter-sheet gap proven chrome and never body, and page N's first line
    // at the same offset inside its sheet as page one's — the last two being
    // truths a single-sheet check could not reach at all. It lives there and
    // not here because that is where the sequence lives.
```

## Record 2 · from sc1.mjs lines 512-544 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8ef718c4a10a3542b74bbeccb33b2d24f362c76a

```js
  // SUPERSEDED by SC2 S1 (2026-07-25) — A4 park cycle, travelling in the SAME
  // commit as the change that falsified it. The ORIGINAL, verbatim:
  //
  //   ok('S3: the page never scrolls itself — 24 lines of real keystrokes past
  //   the stage\'s own centre and the box has not moved once; a screenplay page
  //   stays where the writer put it',
  //     afterTyping.scrollTop === 0 && afterTyping.scrolledAttr !== 'true' &&
  //     afterTyping.dataTypewriter === 'false', JSON.stringify(afterTyping));
  //
  // SUPERSEDED ON ITS NUMBER, NOT ITS LAW. SC2 S1 gave the page its vertical
  // rhythm (SPACE_BEFORE, dormant since S1, is live), so a document is ~1.54x
  // taller in lines. Those same 24 lines now genuinely OVERFLOW the scroll cap,
  // where before they fitted inside it — and the box scrolls to keep the caret
  // visible. ROOT CAUSE, measured before anything was written: not the
  // typewriter (dataTypewriter is still 'false' and capPaddingTop still 0) but
  // ActiveScriptElement's own `node.focus()` on mount — focusing an element
  // below the fold scrolls it into view, and every Enter mounts and focuses a
  // new one. That behaviour is UNCHANGED by SC2; the assertion was only ever
  // true because the page was pathologically short.
  //
  // The law survives intact — no typewriter engine on this surface, the page
  // does not animate itself — and the successor asserts it, plus the truth that
  // replaced the number: the box holds still while the content fits, and moves
  // only to keep the caret visible. Which is correct: without it the writer
  // types blind below the fold.
  //
  // THE DEEPER FINDING, recorded here and charged to SC2 S2 rather than patched
  // here: the script page's vertical behaviour is EMERGENT, not designed. The
  // scroll is a side effect of focus(), which means nobody ever decided it —
  // and that is why it broke on a change that had nothing to do with scrolling.
  // S2's paginator owns the page's vertical policy deliberately (preventScroll
  // plus a stated caret-visibility rule, which it needs for page breaks
  // regardless).
```

## Record 3 · from sc1.mjs lines 579-597 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED — SUPERSEDED by item 83 M8 (R12), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. SC1 S3 recorded the typewriter as
  // WITHDRAWN from screenplay, explicitly 'pending Nick's own revision of
  // typewriter mode'. R12 IS that revision, in his words: 'One small
  // change: TYPEWRITER mode should be available while writing a screenplay,
  // too.' This assertion is not merely re-addressed - it is REVERSED by
  // founder word, and the successor asserts the reversal.
  //
  // ok('S3: the typewriter OPTION does not present itself on a screenplay page — no toggle in the sliver\'s instruments row (two icons there, not three), and nothing carrying the word for assistive tech either',
  // optionOnScript.toggle === false && optionOnScript.iconCount === 2 && optionOnScript.aria === false,
  // JSON.stringify(optionOnScript));
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by PR #7 (19d2c02: the foot is one three-dot Settings menu; the Typewriter icon became its "Typewriter Mode" section), 2026-10-02 ----
  // Kept VERBATIM and no longer run. Generation 2 of this check; generation 1 is parked above.
  //
  // ok('S3 [R12 successor]: the typewriter option IS present on a screenplay page - R12 reverses S3s withdrawal; the foot is universal on page-writing surfaces',
  //   optionOnScript.toggle === true || optionOnScript.aria === true,
  //   JSON.stringify(optionOnScript));
  // ----------------------------------------------------------------------
```

## Record 4 · from sc1.mjs lines 610-628 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED — SUPERSEDED by item 83 M8 (R12), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. SC1 S3 recorded the typewriter as
  // WITHDRAWN from screenplay, explicitly 'pending Nick's own revision of
  // typewriter mode'. R12 IS that revision, in his words: 'One small
  // change: TYPEWRITER mode should be available while writing a screenplay,
  // too.' This assertion is not merely re-addressed - it is REVERSED by
  // founder word, and the successor asserts the reversal.
  //
  // ok('S3: nor one click deeper — the gear\'s settings panel opens on a script page with NO "Typewriter" row in it, so there is no live switch that does nothing hiding behind the icon row',
  // gearOnScript.panelOpen === true && gearOnScript.hasTypewriterRow === false,
  // JSON.stringify(gearOnScript));
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by PR #7 (19d2c02: the foot is one three-dot Settings menu; the Typewriter icon became its "Typewriter Mode" section), 2026-10-02 ----
  // Kept VERBATIM and no longer run. Generation 2 of this check; generation 1 is parked above.
  //
  // ok('S3 [R12 successor]: the screenplay foot carries its Typewriter instrument, and the menu it opens is the R3 cluster - no live switch that does nothing, because the switch now governs',
  //   gearOnScript.panelOpen === true,
  //   JSON.stringify(gearOnScript));
  // ----------------------------------------------------------------------
```

## Record 5 · from sc1.mjs lines 655-676 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED — SUPERSEDED by item 83 M8 (R12), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. This guarded a CONTAINMENT that R12
  // dissolved: there is no longer a withdrawal to contain, because the foot
  // is universal on page-writing surfaces. Prose is still untouched - that
  // half remains true and the successor keeps it - but 'the withdrawal is
  // the screenplay surface's alone' no longer describes anything.
  // NOTE: iconCount is deliberately NOT pinned - R5 rebuilt the foot as
  // TYPEWRITER/PROGRESS/FULL SCREEN, so a fixed count would re-pin a form
  // a ruling replaced, which is the very error this park corrects.
  //
  // ok('S3 (the containment guard): PROSE is untouched — it still runs the typewriter, still carries the FX4 quarter-down start offset, and still offers the option in its own sliver; the withdrawal is the screenplay surface\'s alone',
  // proseUntouched.dataTypewriter === 'true' && proseUntouched.startOffsetPx > 100
  // && proseUntouched.toggle === true && proseUntouched.iconCount === 3,
  // JSON.stringify(proseUntouched));
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by PR #7 (19d2c02: the foot is one three-dot Settings menu; the Typewriter icon became its "Typewriter Mode" section), 2026-10-02 ----
  // Kept VERBATIM and no longer run. Generation 2 of this check; generation 1 is parked above.
  //
  // ok('S3 [R12 successor]: PROSE is untouched - it still runs the typewriter, still carries the FX4 quarter-down start offset, and still offers the option in its own sliver',
  //   proseUntouched.dataTypewriter === 'true' && proseUntouched.startOffsetPx > 100 && proseUntouched.toggle === true,
  //   JSON.stringify(proseUntouched));
  // ----------------------------------------------------------------------
```
