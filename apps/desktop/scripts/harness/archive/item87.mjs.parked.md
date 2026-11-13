# Parked records archived from item87.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item87.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item87.mjs lines 121-127 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED - SUPERSEDED by PR #7 (3951329: the Structure zone is replaced by Templates), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The presets are gone from every mode, not hidden in Free Write only.
  //
  // ok('S2 (b) — and Draft still HAS them (the presets were hidden, not deleted)',
  //   draftMode === 'Draft' && structureInDraft === true,
  //   `activeMode=${String(draftMode)} structureSectionPresent=${structureInDraft}`);
  // ----------------------------------------------------------------------
```

## Record 2 · from item87.mjs lines 131-142 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2e059f8b836228230d706853f3c2aac6ba4bc8d

```js
  // ---- PARKED - SUPERSEDED by PAGE-TEMPLATES-MOVE (Nick's rulings, 2026-10-08): the Templates row reads Screenplay (LIVE), then Outline, Title page, Bibliography and a NEW Custom placeholder, in that order: FOUR stand-ins now,
  // not three. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  //
  // ok('S2 (b) [PR #7 successor]: Draft has no Structure presets either - the zone left the drawer; its place holds the three Template stand-ins, so the drawer itself is present',
  //   draftMode === 'Draft' && structureInDraft === false && draftTemplates === 3,
  //   `activeMode=${String(draftMode)} structureSectionPresent=${structureInDraft} templates=${draftTemplates}`);
  // ------------------------------------------------------------------
  // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @ 0fc9afef, Fable Oct 16): the four grayed stand-ins retire - the Templates section is a FIVE-row picker (Blank, Screenplay, Outline, Title Page, Bibliography), none disabled, Custom dropped. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  //
  // ok('S2 (b) [page-templates successor]: Draft has no Structure presets either - the zone left the drawer; its place holds the FOUR Template stand-ins, so the drawer itself is present',
  //   draftMode === 'Draft' && structureInDraft === false && draftTemplates === 4,
  //   `activeMode=${String(draftMode)} structureSectionPresent=${structureInDraft} templates=${draftTemplates}`);
```

## Record 3 · from item87.mjs lines 153-158 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5bbe6f47936465e1e7fbc71bb6a8555b661adc6e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (a NEW empty page takes its theme's default (Arbor ON, Flux OFF) and a page that holds text opens OFF - the empty-page-OFF amendment and the line-count rule it amended are both retired; Nick, Oct 11), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The successor follows the parked lines.
  //
  // ok('S3 (a) — a FRESH Draft page opens with the typewriter OFF [ITEM 87 CLAUSE 3]',
  // freshTypewriter === 'false', `data-typewriter=${String(freshTypewriter)}`);
  // ----------------------------------------------------------------------
```

## Record 4 · from item87.mjs lines 191-199 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5bbe6f47936465e1e7fbc71bb6a8555b661adc6e

```js
  // ---- PARKED - SUPERSEDED by Phase 1 S5 (a NEW empty page takes its theme's default (Arbor ON, Flux OFF) and a page that holds text opens OFF - the empty-page-OFF amendment and the line-count rule it amended are both retired; Nick, Oct 11), 2026-10-11 ----
  // Kept VERBATIM and no longer run. The successor follows the parked lines.
  //
  // ok('S3 (b) — CONTROL: a Draft page that already holds work (1 line-equivalent, under the 10 threshold) still opens with the typewriter ON — FX2 S2 amended at the EMPTY case only',
  // shortTypewriter === 'true', `data-typewriter=${String(shortTypewriter)}`);
  // ----------------------------------------------------------------------
  // MEASURED, not assumed (Chat 1's run, 2026-10-12: this successor read data-typewriter=true). The fixture's page is created EMPTY and first opened EMPTY - so under S5 it took
  // Arbor's default (ON) and SAVED it - and only then gets text. On the reopen the SAVED value wins over "has text": that is Nick's rule working, not a bug. The premise is read
  // from the stored key itself, so the check cannot pass for the wrong reason. The other half - a page that ALREADY HAS TEXT the first time it is ever opened - is S3 (c) below.
```
