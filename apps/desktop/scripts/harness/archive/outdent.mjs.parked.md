# Parked records archived from outdent.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/outdent.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from outdent.mjs lines 126-140 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 84ff95c5f157c1393d2784ed6f7cf194c5e699de

```js
  // ---- PARKED - SUPERSEDED by PR #7 (8706eb0: alignment and indent are drawn as line icons, so a button's mark is its data-format-glyph, not its text), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The arrows ⇤/⇥/←/→ are gone; the claim (no control wears another's mark) is unchanged.
  //
  // // THE GLYPH COLLISION CHECK. The legacy bar's outdent is ⇤ — but ⇤ is already
  // // Align left's mark in THIS drawer. A control wearing another control's mark
  // // in the same panel is a defect however correct its behaviour, so the partner
  // // takes ← , mirroring Indent's own → .
  // const outGlyph = controls.outdentIndex >= 0 ? controls.glyphs[controls.outdentIndex] : null;
  // ok('S1: and it does NOT wear a glyph already spoken for elsewhere in the same panel — the alignment row owns ⇤/⇥, so the partner mirrors Indent\'s arrow instead of borrowing the legacy bar\'s mark',
  //   outGlyph !== null && !controls.alignGlyphs.includes(outGlyph),
  //   JSON.stringify({ outdentGlyph: outGlyph, alignGlyphs: controls.alignGlyphs }));
  // ----------------------------------------------------------------------
  // THE GLYPH COLLISION CHECK. Outdent is lines with a left arrow. Align left
  // is a stack of lines with no arrow. A control wearing another control's
  // mark in the same panel is a defect however correct its behaviour.
```
