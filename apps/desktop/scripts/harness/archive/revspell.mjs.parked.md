# Parked records archived from revspell.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/revspell.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from revspell.mjs lines 86-91 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 387447a2b4b2ae521ec683d864d2ee01eed315d4

```js
// ---- PARKED - SUPERSEDED by Fable's ruling of Oct 17 (page-templates, ledger 87): the Title Page sheet (components/TitlePageSheet.tsx) is a form of short fields, not a prose editor host. Spell-check is ON for its TITLE (the writer's own words,
// like the page) and OFF for its AUTHOR, CONTACT and WORD LINE (names, addresses, a count). The claim "no editor host hardcodes it off" still holds for every PROSE host; it does not hold for those three fields, by design.
// Kept VERBATIM below and no longer run; the successor says exactly that.
//
// ok('S1: NO editor host hardcodes spellCheck={false} any more — the one that did (ForwardOnlyEditor) is now mode-driven, so nothing forces the checker off in Revise',
//   !sites.some((s) => /spellCheck=\{false\}/.test(s)), JSON.stringify(sites));
```

## Record 2 · from revspell.mjs lines 97-104 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5b5d79af4d872cda4cc65fe7a24a01c527f650ff

```js
// ---- PARKED, generation 2 - SUPERSEDED by Fable's ruling of Oct 19 (delete-for-good, ledger 109): the in-app typed confirmation's phrase
// input (components/DestructiveConfirm.tsx, className="wz-destructive-input") is a COMMAND, not writing - the writer types an exact phrase
// such as DELETE EVERYTHING to unlock a destructive act - so spell-check is OFF there, by name. The successor below allows exactly that one
// site beside the Title Page sheet's three, and fails any other. Kept VERBATIM and no longer run (s1Succ, its verdict, is still computed above).
//
// ok('S1 [page-templates successor]: no PROSE editor host hardcodes spellCheck={false}; the ONLY hardcoded-off sites are the Title Page sheet AUTHOR, CONTACT and WORD LINE fields (data-field author, contact, words), and its TITLE field carries no spellCheck attribute at all, so spell-check is ON for the title',
//   s1Succ, JSON.stringify({ falseSites, falseFields, titleLine: titleLine && titleLine.trim() }));
// THE ALLOWED hardcoded-off sites, each matched by NAME in the site's own line (never a whole-file exception):
```

## Record 3 · from revspell.mjs lines 125-134 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6ba919fdc9606dab283aaf745dd002ecff4422e0

```js
// ---- PARKED - SUPERSEDED by #13 step 11 (Fable, Nov 5): pages/JournalEntry.tsx, the unrouted second host, is deleted as dead code, so the
// count of two no longer holds. Kept VERBATIM below and no longer run; its record is in the parked block, and the successor follows.
//
// ok('S2: the only sites that can turn the checker ON are ForwardOnlyEditor (spellCheck={mode === \'revise\'}, gated) and JournalEntry.tsx (a pre-existing, untouched `spellCheck`; see the report — an unmounted component as far as a source search shows) — a THIRD host that enables it fails this run',
//   truthy.length === 2
//     && truthy.some((s) => s.startsWith('components/ForwardOnlyEditor.tsx:') && s.includes("spellCheck={mode === 'revise'}"))
//     && truthy.some((s) => s.startsWith('pages/JournalEntry.tsx:')),
//   JSON.stringify(truthy));
// ------------------------------------------------------------------
// the step 11 successor holds before the delete and after it: a site in a file step 11 deletes (imported by nothing) is set aside
```
