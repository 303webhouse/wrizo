# Parked records archived from item207-core.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item207-core.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item207-core.mjs lines 76-83 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cf2e9d250debbf90e8196ccb5afd1601e3f557d6

```js
// ---- PARKED - SUPERSEDED by page-size (Fable's ruling a, Oct 23: the page's number is REAL POINTS IN PAGE UNITS - 12 = 16px at page scale 1,
// scaled with the page - and a NEW page defaults to 12; cards keep their own 11). Kept VERBATIM and no longer run. An explicit 11 is now a real,
// smaller size (it emits a font-size), and 12 is no longer "17 x 12/11 x the paper scale". Successors follow; records in the parked section.
//
// ok('11 = TODAY: an explicit 11 yields no font-size either (the default is the absence of a rule)', M.pageTypeStyle(undefined, 11).fontSize === undefined && M.pageTypeStyle(M.storedFaceFor(M.rosterFace('Crimson Pro')), 11).fontSize === undefined, '');
// ok('SIZE: 12 renders 17px x 12/11 x the paper scale, and 6 / 120 scale the same way (the number is the printed size; the screen is a uniform zoom)',
//   M.pageTypeStyle(undefined, 12).fontSize === `calc(17px * ${12 / 11} * var(--paper-scale))` && M.pageTypeStyle(undefined, 120).fontSize === `calc(17px * ${120 / 11} * var(--paper-scale))`, M.pageTypeStyle(undefined, 12).fontSize);
// ------------------------------------------------------------------
```

## Record 2 · from item207-core.mjs lines 116-121 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 86aae6b25747507289cb2db4ebcc8cc38925c2c9

```js
// ---- PARKED - SUPERSEDED by TOOLS #10 item 11 (Fable: GO, Oct 27: the writer's own installed fonts - device-local list, StoredFace source 'device') ----
// A face whose source is 'device' no longer falls back to a generic class of its own - it falls back to the THEME'S DEFAULT (--font-prose). The in-kind rule still holds for every other unknown face (source 'named' / 'file'). Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it must now fail, for exactly that reason).
// ok('FALLBACK IN KIND: a face this build does not know still renders — its own name, then its generic class (a serif falls back to a serif, a monospace to a monospace, never a sans)',
//   /'Some Device Font', Georgia, serif$/.test(M.faceStack({ name: 'Some Device Font', generic: 'serif', source: 'device' })) && /monospace$/.test(M.faceStack({ name: 'X', generic: 'monospace', source: 'device' })) && /sans-serif$/.test(M.faceStack({ name: 'Y', generic: 'sans-serif', source: 'file' })),
//   M.faceStack({ name: 'Some Device Font', generic: 'serif', source: 'device' }));
// ------------------------------------------------------------------
```

## Record 3 · from item207-core.mjs lines 184-189 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 570cfe472ad8bfdf6b085b2bbae1757a37f2c897

```js
// ---- PARKED - SUPERSEDED by font-span (Nick approved the font-choices mockup, cursor/font-choices @ 6cc5f529, 2026-10-15) ----
// Kept VERBATIM and no longer run. The control gains the two scope buttons ("Selection" / "Whole document" or "Whole card"), rendered
// only where a host passes `scope` (Draft, a card); Free Write and Revise still render exactly the face button and the step pair.
// ok('MINIMAL (his law): the control is exactly a face button and a `-` `+` pair (3 buttons) plus ONE number input, and that input exists only in the full form',
//   shape.buttons === 3 && shape.inputs === 1 && shape.inputGuardedByFullForm, JSON.stringify(shape));
// ------------------------------------------------------------------
```

## Record 4 · from item207-core.mjs lines 193-198 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 0672abb903fc574d7d36fe8d5ea49fc22d2f455f

```js
// ---- PARKED - SUPERSEDED by TOOLS #10 item 9 (Fable, Oct 27: "the font list is collapsed by default in the Draft Tools drawer") ----
// Kept VERBATIM and no longer run. The scoped form now carries its own face button (the disclosure that opens the collapsed list) between the scope pair and the list, so it is 6 buttons in source and the face
// button is no longer "only without scope". Successor below; the original is run as a PARKED RECORD (it must now fail, for exactly that reason).
// ok('MINIMAL [font-span successor]: the control is a face button (unscoped hosts) OR the two scope buttons (scoped hosts), plus the `-` `+` pair - 5 buttons in source, the scope pair only under `scope`, the face button only without it - and ONE number input, only in the full form',
//   shape.buttons === 5 && scopeOnly && shape.inputs === 1 && shape.inputGuardedByFullForm, JSON.stringify(coreParks.minimal));
// ------------------------------------------------------------------
```

## Record 5 · from item207-core.mjs lines 201-204 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8d1fe490faa13afded488e827e00127af80ac5d4

```js
// ---- PARKED VERBATIM - SUPERSEDED by TOOLS #14 (Fable, Nov 2: the size box sits between `-` and `+` in EVERY form, small included). Kept below, no longer run; the successor follows. ----
// ok('MINIMAL [item-9 successor]: the control is a face button (unscoped hosts) OR the two scope buttons + a face button that opens the COLLAPSED list (scoped hosts), plus the `-` `+` pair and the add-font form (its Add / Find buttons and name input) - 8 buttons and 2 inputs in source, the NUMBER input only in the full form',
//   shape.buttons === 8 && scopeFaceBtn && /\{!scope && <button/.test(tcSrc) && shape.inputs === 2 && shape.inputGuardedByFullForm, JSON.stringify({ ...coreParks.minimal, scopeFaceBtn }));
// ------------------------------------------------------------------
```

## Record 6 · from item207-core.mjs lines 216-219 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 86aae6b25747507289cb2db4ebcc8cc38925c2c9

```js
// ---- PARKED - SUPERSEDED by TOOLS #10 item 11 (Fable: GO, Oct 27: the writer's own installed fonts - device-local list, StoredFace source 'device') ----
// The control now carries an "Add a font..." row - in the SCOPED form only (Draft's drawer, a card's dock). Free Write and Revise still never get it (Nick's Q2). Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it must now fail, for exactly that reason).
// ok('NO ADD DOOR (207a): the control carries no "Add a font…" row — it arrives with Route A (207b), and Free Write never gets it (his Q2)', !shape.addDoor, '');
// ------------------------------------------------------------------
```

## Record 7 · from item207-core.mjs lines 232-247 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5a0bd6f73bf3c7da0ee7a47771cc721956606c01

```js
// ---- PARKED - SUPERSEDED by PR #7 (Fable's spec C3: a "Typeface" heading above the font controls), 2026-10-02 ----
// Kept VERBATIM and no longer run. The section now carries the drawer's own zone heading; the CONTROL stays caption-free
// (MINIMAL above still asserts that), so only the section-has-no-heading half of this check changed.
//
// ok('MOUNT: the sliver mounts the control on the Free Write, Draft and Revise arms only, in one section with no heading',
//   !!mount && /content\.kind === 'freewrite' \|\| content\.kind === 'draft' \|\| content\.kind === 'revise'/.test(sliverSrc) && !/wz-sliver-h/.test(mount[0]), mount ? 'found' : 'mount block not found');
// ------------------------------------------------------------------
// ---- PARKED - SUPERSEDED by the code-shape tolerant successor below (Fable, 2026-10-12: "mount block not found" on INK's
// phase1-drawers, whose guard adds `&& allowed('typeface')` between `content.type` and the section). Kept VERBATIM and no longer
// run: it matched only the literal `content.type && (`, so ANY further guard read as a missing mount. The claim is unchanged.
//
// ok('MOUNT [C3 successor]: the sliver mounts the control on the Free Write, Draft and Revise arms only, in one section headed "Typeface" (the lexicon\'s railTypeface) with the control directly beneath',
//   !!mount && /content\.kind === 'freewrite' \|\| content\.kind === 'draft' \|\| content\.kind === 'revise'/.test(sliverSrc) && /^[^]*?<div className="wz-sliver-h">\{t\('railTypeface'\)\}<\/div><TypeControl \{\.\.\.content\.type\} \/>/.test(mount[0]) && (mount[0].match(/wz-sliver-h/g) || []).length === 1, mount ? 'found' : 'mount block not found');
// ------------------------------------------------------------------
// The SAME claim on the guard's real shape: the three arms, then content.type, then ANY further guards (`&& allowed(...)` and the
// like), then the one section. A guard that drops an arm still fails (proved on a constructed source when this was written).
```

## Record 8 · from item207-core.mjs lines 252-270 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 1d263f1f2fa9175fa1e2a48c8c48fea7db043e30

```js
// ---- PARKED - SUPERSEDED by font-span (Nick approved the font-choices mockup, cursor/font-choices @ 6cc5f529; chat 1's ledger 68) ----
// Kept VERBATIM and no longer run. Draft now passes the full form WITH its scope flag - `typeMember('full', true)`, the Selection /
// Whole document pair - so the literal `typeMember('full')` no longer matches Draft's line, though the claim (Draft passes the FULL
// form) still holds. The successor reads the form and the scope flag apart; its record is in this file's parked section.
// ok('FORMS: Free Write passes the SMALL form (and none in INK), Draft and Revise pass the FULL form',
//   /type: instrument === 'ink' \? undefined : typeMember\('small'\)/.test(pe) && /kind: 'draft',[\s\S]{0,200}type: typeMember\('full'\)/.test(pe) && /kind: 'revise', type: typeMember\('full'\)/.test(pe), '');
// ------------------------------------------------------------------
// ---- PARKED - SUPERSEDED by typewriter-scope (Fable Oct 21/22) ----
// Kept VERBATIM and no longer run. The 200-char window between `kind: 'draft',` and
// `type: typeMember('full', true)` was outrun, not broken: typewriter-scope inserted a comment
// plus `pageId: id,` / `pageEmpty: textRef.current.trim().length === 0,` between them (PageEditor.tsx's
// own per-page typewriter read, store/writingSettings.ts's new `typewriterForPage`) - the actual gap
// grew to 383 chars. Draft's own form (`type: typeMember('full', true)`) is untouched; only this
// regex's own fixed window needed widening (unbounded lazy, matching MOUNT's own style above),
// which the live successor below does.
//
// ok('FORMS [font-span successor]: Free Write passes the SMALL form (and none in INK); Draft passes the FULL form WITH the Selection scope; Revise passes the FULL form WITHOUT it (no styling tools there by ruling)',
//   formsNow.freeWriteSmall && formsNow.draftFullScoped && formsNow.reviseFullUnscoped, JSON.stringify(formsNow));
// ------------------------------------------------------------------
```

## Record 9 · from item207-core.mjs lines 329-332 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8d1fe490faa13afded488e827e00127af80ac5d4

```js
  // ---- PARKED VERBATIM - SUPERSEDED by TOOLS #14 (Fable, Nov 2: the size box sits between `-` and `+` in EVERY form, small included). Kept below, no longer run; the successor follows. ----
  // const unguarded = t.replace("{form === 'full' && (", '{(');
  // ok('FALSIFICATION M9 the number input is shown in EVERY form (Free Write would gain it) — must go RED', landed(unguarded) && !ctlShape(unguarded).inputGuardedByFullForm, '');
  // ------------------------------------------------------------------
```
