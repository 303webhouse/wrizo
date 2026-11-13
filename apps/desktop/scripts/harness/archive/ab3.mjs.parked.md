# Parked records archived from ab3.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/ab3.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from ab3.mjs lines 275-281 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e1c9d1064ac816596f26e0fcfe68e1f4cbd99ca6

```js
  // SUPERSEDED (item word-diet, Nick) — the saved-silently footer RETIRES
  // whole (REMOVE); its premise — that it appears exactly once, inside the
  // Page panel — no longer holds, since it appears NOWHERE now, panel
  // included. ORIGINAL claim parked verbatim:
  // ok('S3/S2: the saved-silently line appears nowhere outside the Page panel when framed',
  //   !footerOnlyInDrawer.outsideDrawerNote && footerOnlyInDrawer.inPageFace === 'Saved automatically — even if you never file it to a Drawer or the Shelf.',
  //   JSON.stringify(footerOnlyInDrawer));
```

## Record 2 · from ab3.mjs lines 320-324 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f65b7193d86c0ebe3a57cc5a38dd2e337b51fbcd

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeProject drops "In " whole
  // (bare "{drawer name}"); this fixture's project is never titled (F4's
  // "no title required" door), so pageHome.ts's own fallback applies.
  // ORIGINAL claim parked verbatim:
  // ok('S4/S2: the Page category\'s Where-it-lives names the project by title (not the Journal)', projectHome?.startsWith('In ') && projectHome !== 'In the Journal', projectHome);
```

## Record 3 · from ab3.mjs lines 380-382 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeLoose's text itself changed,
  // "Loose — belongs nowhere yet" -> "Unfiled"; the ORIGINAL claim parked verbatim:
  // ok('S4/DoD: the loose page\'s Page category text reads exactly "Loose — belongs nowhere yet"', looseHomeText === 'Loose — belongs nowhere yet', looseHomeText);
```

## Record 4 · from ab3.mjs lines 463-468 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f65b7193d86c0ebe3a57cc5a38dd2e337b51fbcd

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeProject drops "In " whole;
  // this fixture filed the page to a drawer literally named "AB3 Drawer".
  // ORIGINAL claim parked verbatim:
  // ok('B2 S7 successor of "S5/S2: Where-it-lives tells BOTH truths — homed in the project, Also in the Journal.": the pinned law means dual membership no longer happens — homed in the project, NO "Also in the Journal." line (origin still \'journal\', per the check above — provenance stays, membership doesn\'t)',
  //   bothTruths.home?.startsWith('In ') && bothTruths.home !== 'In the Journal' && !bothTruths.memberships.includes('Also in the Journal.'),
  //   JSON.stringify(bothTruths));
```

## Record 5 · from ab3.mjs lines 519-538 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d0800409e11cbbe076406ef8ee5beac475655cab

```js
  // ---- PARKED - SUPERSEDED by ITEM 121 I6 (R15), 2026-09-07 ----------
  // Kept VERBATIM and no longer run. `legacyRail.ink` read the zone headed
  // "Ink" in Free Write’s drawer - which was NOT ink: its three hardcoded
  // hex swatches coloured the TYPED TEXT and caret (ForwardOnlyEditor’s own
  // penColor), beside a "nib · fine" button that did nothing. Under R15’s
  // analog law that is digital styling on a surface that does not decorate -
  // the same class as the B/I/U removed alongside it, differing only in which
  // property it set - so it RETIRES, on Nick’s word (2026-09-07), and "Ink"
  // on this surface now names the pen’s real ink.
  // A2’S GRANDFATHER CLAUSE IS NOT TOUCHED, which is why the successor keeps
  // the other two clauses verbatim: A2’s law is that a NULL-origin row
  // behaves exactly like every other page, and it still does. What changed is
  // what EVERY Free Write page carries, not what a LEGACY one carries. A
  // successor that dropped the whole check would have retired a live law
  // along with a dead assertion.
  //
  // ok('CD1 S2/S7 (was "S4 A2 (grandfather clause): ..."): a NULL-origin page (pre-AB3 data) keeps TODAY\'S furniture in Free Write — ink/forward-lock/capture items all present (now in the sliver)',
  // legacyRail.ink && legacyRail.forwardLock && JSON.stringify(legacyRail.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']),
  // JSON.stringify(legacyRail));
  // -------------------------------------------------------------------
```

## Record 6 · from ab3.mjs lines 702-707 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in edf566c03904a8cf120436b4092fa40491ac2039

```js
    // ---- PARKED VERBATIM - SUPERSEDED by TOOLS #10 item 8 (Fable, Oct 28): the cascade's close is the Tools strip's slide-and-fade EXIT (~200 ms, --drawer-dur), so "gone" is true once the exit has played, not 150 ms after the keystroke.
    // The record below is kept verbatim and no longer run; the successor follows, and the original is run as a PARKED RECORD (it holds once the exit has played).
    // const panelGoneAfterTypeNow = await app.evalJs("!document.querySelector('.wz-cascade-panel')");
    // pok('PARKED (was "S6: a keystroke dissolves the open place face back to the tools room...", then CD1 S3-superseded to "...the page room...") — CD2 S1/S5: a keystroke now closes the cascade\'s open category outright (successor: cd2.mjs\'s own keystroke-dissolve section)',
    // panelGoneAfterTypeNow === true, String(panelGoneAfterTypeNow));
    // ------------------------------------------------------------------
```
