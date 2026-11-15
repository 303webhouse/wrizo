# Parked records archived from reveal.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/reveal.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from reveal.mjs lines 167-175 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2e2a6b20f5cc699844024a8a8dc602aff0ff715a

```js
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run. This asserted that a click anywhere INSIDE a styled word shows its markers - which is exactly
  // what Nick reported as a bug ("the asterisks on the page return with ... clicking around"). The listener this ticket built
  // (selectionchange -> revealAtCaret) is unchanged and still what makes the reveal follow the caret; what changed is WHERE the
  // caret must be. Successors: the mid-word click below, and the walk that states the rule at every caret stop.
  //
  // ok('S1 THE TICKET: a REAL click into the bold run reveals its own markers on the page — the gesture that did nothing before, because nothing re-ran the register when the caret moved without an edit',
  //   pageAfterClick.anyRevealed === true, JSON.stringify({ ...pageAfterClick, caret: pageCaret }));
  // ------------------------------------------------------------------
```

## Record 2 · from reveal.mjs lines 181-187 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e79390c7d070c8b66f8ee91939f693c85d5f5c32

```js
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. The interim rule showed the marks while the caret touched a marker span. Nick's "A"
  // retires that: the marks never show. Successor: the walk below, which must stay hidden at every stop, edges included.
  //
  // ok('S1 [interim successor] THE RULE, at every caret stop along the line (trusted ArrowRight from Home): the markers show EXACTLY when the caret touches a marker span (6-8, 12-14) and at no stop inside the word - so the listener still re-runs the register on a caret move with no edit',
  //   lawHolds(pageWalk) && sawBoth(pageWalk), JSON.stringify(pageWalk.map((x) => `${x.off}${x.revealed ? '+' : '-'}`).join(' ')));
  // ------------------------------------------------------------------
```

## Record 3 · from reveal.mjs lines 205-213 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2e2a6b20f5cc699844024a8a8dc602aff0ff715a

```js
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run: its first half is the parked ticket above (a mid-word click no longer reveals), so the pair can
  // no longer be true together. Its POINT survives whole - the reveal must be seen to turn ON and then OFF again, or "hidden now"
  // proves nothing - and the successor asserts exactly that, on the walk.
  //
  // ok('S1: clicking back out into plain prose RE-COLLAPSES the markers — the reveal follows the caret both ways, it does not latch on. Asserted together with the reveal that preceded it, because "they are hidden now" is trivially true on a surface where nothing ever revealed them: this check has to be unable to pass on a build with no listener at all.',
  //   pageAfterClick.anyRevealed === true && pageAfterAway.allHidden === true,
  //   JSON.stringify({ revealedFirst: pageAfterClick.anyRevealed, hiddenAfter: pageAfterAway.allHidden }));
  // ------------------------------------------------------------------
```

## Record 4 · from reveal.mjs lines 215-220 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 84ff95c5f157c1393d2784ed6f7cf194c5e699de

```js
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. The interim check required the marks to turn ON at a marker edge. That ON is the asterisk the writer reported.
  //
  // ok('S1 [interim successor]: the reveal follows the caret BOTH ways and does not latch - along the walk it is seen OFF, then ON at a marker, then OFF again; and a click out into plain prose leaves everything collapsed. Unable to pass on a build with no listener: the ON has to be observed.',
  //   turnsOnAndOff(pageWalk) && pageAfterAway.allHidden === true, JSON.stringify({ walk: pageWalk.map((x) => (x.revealed ? '1' : '0')).join(''), hiddenAfter: pageAfterAway.allHidden }));
  // ------------------------------------------------------------------
```

## Record 5 · from reveal.mjs lines 236-247 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2e2a6b20f5cc699844024a8a8dc602aff0ff715a

```js
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run. Its gesture was "one reveal-changing click" into the middle of the bold word; that click no
  // longer changes the reveal, so it produces NO mutations and the `> 0` half fails for a reason that has nothing to do with
  // termination. The claim is unchanged; the successor makes the reveal change with a trusted ArrowRight onto a marker's edge.
  //
  // const boldPt2 = await centreOf(app, '.forward-only-editor .md-bold');
  // if (boldPt2) await realClick(app, boldPt2);
  // await sleep(1200);
  // const mutations = await app.evalJs("(() => { window.__revObs.disconnect(); return window.__revMut; })()");
  // ok('S2 TERMINATION: one reveal-changing click produces a BOUNDED burst of DOM mutations and then stops — the "unchanged decoration is not rewritten" guard is what closes the selectionchange -> redecorate -> setCaret -> selectionchange cycle, and a runaway would show here as hundreds over the same second',
  //   typeof mutations === 'number' && mutations > 0 && mutations < 40, JSON.stringify({ mutations }));
  // ------------------------------------------------------------------
```

## Record 6 · from reveal.mjs lines 258-263 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 84ff95c5f157c1393d2784ed6f7cf194c5e699de

```js
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. The interim check required the edge press to REVEAL (mutations > 0). A press that changes nothing must not loop.
  //
  // ok('S2 TERMINATION [interim successor]: one reveal-changing KEY PRESS (ArrowRight onto a marker\'s edge) produces a BOUNDED burst of DOM mutations and then stops - the "unchanged decoration is not rewritten" guard still closes the selectionchange -> redecorate -> setCaret -> selectionchange cycle',
  //   beforeEdge === 5 && atEdge.anyRevealed === true && typeof mutations === 'number' && mutations > 0 && mutations < 40, JSON.stringify({ beforeEdge, revealed: atEdge.anyRevealed, mutations }));
  // ------------------------------------------------------------------
```

## Record 7 · from reveal.mjs lines 304-309 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED - SUPERSEDED by item 211 (52ad017: Shift+Arrow moves by visible characters), 2026-10-02 ----
  // Kept VERBATIM and no longer run. Ten presses used to select ten raw characters; they now select ten visible ones, which spans the hidden markers.
  //
  // ok('S3 (page): a live NON-COLLAPSED selection survives being extended BACKWARDS across a reveal boundary — ten trusted Shift+ArrowLeft presses from the end drag the range START into the bold run, where the decoration genuinely differs from the one last written, and the ten characters are still selected because revealAtCaret declines outright while a selection is open',
  //   pageSel.none === false && pageSel.collapsed === false && pageSel.length === 10, JSON.stringify(pageSel));
  // ----------------------------------------------------------------------
```

## Record 8 · from reveal.mjs lines 349-355 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2e2a6b20f5cc699844024a8a8dc602aff0ff715a

```js
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run, for the reason given at S1: the card popup shares the register, so a mid-word click reveals
  // nothing there either. Successors: the mid-word click and the same walk, on the card.
  //
  // ok('S4: a REAL click into the card\'s bold run reveals its markers — FX5 S6\'s behaviour is preserved across the signal change, not merely assumed to be',
  //   cardAfter.anyRevealed === true, JSON.stringify(cardAfter));
  // ------------------------------------------------------------------
```

## Record 9 · from reveal.mjs lines 360-365 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in eb9babb567ec44f07d62f6af871c1abca75b428c

```js
  // ---- PARKED - SUPERSEDED by the 211 card port (2026-10-06): the popup now runs the page's editing rules, so it shows no mark at any caret, as the page ----
  // Kept VERBATIM and no longer run: the card's interim rule (marks show while the caret touches one) is retired with its option.
  //
  // ok('S4 [interim successor] THE RULE on the card, at every caret stop: markers show exactly when the caret touches a marker span - the two surfaces still share one register',
  //   lawHolds(cardWalk) && sawBoth(cardWalk), JSON.stringify(cardWalk.map((x) => `${x.off}${x.revealed ? '+' : '-'}`).join(' ')));
  // ------------------------------------------------------------------
```

## Record 10 · from reveal.mjs lines 373-378 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in eb9babb567ec44f07d62f6af871c1abca75b428c

```js
  // ---- PARKED - SUPERSEDED by the 211 card port (2026-10-06): the popup now runs the page's editing rules, so it shows no mark at any caret, as the page ----
  // Kept VERBATIM and no longer run. Nothing is shown at the word's edge any more, so the Home check below no longer has a reveal to
  // re-collapse; it stays (it still proves Home leaves everything collapsed) and the successor here says what the edge shows now.
  //
  // ok('S4 (precondition for the Home check): with the caret at the bold word\'s leading edge the markers ARE shown', cardAtEdge.anyRevealed === true, JSON.stringify(cardAtEdge));
  // ------------------------------------------------------------------
```

## Record 11 · from reveal.mjs lines 398-405 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in ec562d4b13dfc6a36d3c7a3aa65051b8b22f9aeb

```js
  // ---- PARKED - SUPERSEDED by the 211 card port (2026-10-06): the card's Shift+Arrow now steps over VISIBLE characters ----------
  // Kept VERBATIM and no longer run. Its claim - the selection SURVIVES being extended across the bold run - is unchanged and asserted
  // below; only its unit moved. Ten Shift+ArrowLeft presses now select ten characters the writer can SEE ("t BOLD end"), and the
  // selection's raw string also carries the four hidden stars it spans (14), where the browser's own stepping counted every star.
  //
  // ok('S4 THE DEFECT THE SWAP FIXES: a selection can be extended across a reveal boundary on a card — the retired mouseup/keyup pair redecorated UNCONDITIONALLY on every nav keyup and every mouseup, and a redecorate restores a COLLAPSED caret, so a selection made this way was destroyed as it was made',
  //   cardSel.none === false && cardSel.collapsed === false && cardSel.length === 10, JSON.stringify(cardSel));
  // ------------------------------------------------------------------
```
