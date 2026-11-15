# Parked records archived from page-templates-r2.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/page-templates-r2.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from page-templates-r2.mjs lines 343-347 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8e80d606b0d41311fbe5fd5b700eec3431693aaa

```js
// ---- PARKED - SUPERSEDED by ledger 92 (Fable Oct 17, X7): the lens's key door was in onFormatKeyDraft, which runs AFTER onKeyDownDraft's marks.enter had already done the Enter - one Enter was done twice. The door is now the FIRST thing onKeyDownDraft does, and the only call.
// Kept VERBATIM below and no longer run; the successor pins the new place and that there is exactly one call.
//
// ok('R10 the editor carries the lens as data-template and the host\'s key door, and re-draws the lens when the template changes under it (refreshLens on [lens])',
//   /data-template=\{lens \?\? undefined\}/.test(fo) && /if \(onLensKeyRef\.current\?\.\(e\)\) return;/.test(fo) && /useEffect\(\(\) => \{ const h = hostRef\.current; if \(h\) refreshLens\(h\); \}, \[lens\]\);/.test(fo), '');
```

## Record 2 · from page-templates-r2.mjs lines 360-368 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 03dffdcbd957f90905724eeba41117afddb841e2

```js
// ---- PARKED - SUPERSEDED by typewriter-scope (Fable, Oct 21) ------------------------------------------------------------------------
// P14's ORIGINAL gate-text match, quoted VERBATIM and no longer asserted (the successor lives at
// P14's own spot above, now reading typewriterForPage instead):
//
//   ok('P14 the paragraph-indent Tab machine (item 158) stands aside while an Outline is in Draft, so Tab acts on the row and not on the whole one-paragraph outline',
//     /outlineKeysRef\.current = mode === 'drafting' && realEntry\?\.pageSettings\?\.template === 'outline';/.test(pe) && (pe.match(/if \(outlineKeysRef\.current && !getWritingSettings\(\)\.typewriter\) return;/g) || []).length === 2, '');
//
// Re-asserted against its NEW, opposite truth: that exact shared-field read is GONE from the
// gate, not merely wrong - this block stays green under HARNESS_PARKED=1, proving the retirement.
```

## Record 3 · from page-templates-r2.mjs lines 439-443 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c2a1846afea6fa7d6c2d729659b0ac487052c5de

```js
    // SUPERSEDED (help-buttons, Fable Oct 18-19): the Templates heading now
    // carries its own "?" (HelpButton, unconditional in both themes), so its
    // own textContent reads "Templates ?", not the bare exact word. Kept
    // verbatim, no longer run:
    //   ok('X1 Arbor: the section heads read "Font" and "Templates"', heads.includes('Font') && heads.includes('Templates'), JSON.stringify(heads));
```

## Record 4 · from page-templates-r2.mjs lines 451-454 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c2a1846afea6fa7d6c2d729659b0ac487052c5de

```js
    // SUPERSEDED (help-buttons, Fable Oct 18-19): same gap as the Arbor check
    // above - "Presets" now carries its own "?" too. Kept verbatim, no
    // longer run:
    //   ok('X1 Flux: the section heads read "Typeface" and "Presets"', headsF.includes('Typeface') && headsF.includes('Presets'), JSON.stringify(headsF));
```

## Record 5 · from page-templates-r2.mjs lines 596-599 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8e80d606b0d41311fbe5fd5b700eec3431693aaa

```js
    // ---- PARKED - SUPERSEDED by ledger 92 (Fable Oct 17): this read the store 900ms after typing, before the words field had committed (the very next check, after a reload, finds the word line saved). A settle in the check, not a lost write.
    // Kept VERBATIM below and no longer run; the successor WAITS for the stored text to reach its value (up to 6s) and then reads it.
    //
    // ok('X10 author and word line land in the canonical text (the word line right-aligned with ">> ", the author centred under "by")', !!tp2 && tp2.text === '>> About 62,000 words\n\n>< The Late Ferry\n>< by\n>< Ada Marsh', JSON.stringify(tp2 && tp2.text));
```
