# Parked records archived from item112a.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item112a.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item112a.mjs lines 299-304 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a51f014c0adcdb1a1e628e407a9573af688309d7

```js
    // ---- PARKED - SUPERSEDED by typed-literal (Nick's ruling, Oct 16: typed `**` is LITERAL, stored escaped; Revise has no styling tools) ----
    // Kept VERBATIM and no longer run: typed ` **bold** done` makes no `.md-bold` now. What it recorded - Revise's text runs through the
    // decorator, the seam the parked error lens will use - is shown by the decorator rendering the typed stars' ESCAPES (`.md-escape`).
    // ok("S2/§3 S0: Revise's rendered text RUNS THROUGH `decorateEditorFor` — markdown decorates live (`.md-bold`/`.md-mark` present), which is the recorded answer the parked error lens needs: its flag decorator is an ARGUMENT to a seam that already exists, not new routing",
    //   md.bold >= 1 && md.marks >= 2, JSON.stringify(md));
    // ------------------------------------------------------------------
```

## Record 2 · from item112a.mjs lines 311-333 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a51f014c0adcdb1a1e628e407a9573af688309d7

```js
    // ---- PARKED - SUPERSEDED (item112a-deterministic, Oct 16; chat 1's ledgers 64 and 67) ----
    // Kept VERBATIM and no longer run. `includes('**bold**')` pinned WHERE the closing marks land, which is not this check's claim and is
    // timing-dependent: by the 211 rules a keyboard caret sits after the nearest VISIBLE character (store/hiddenMarks.ts snapCaret), so
    // once the closing `**` is typed the caret settles BEFORE it, and " done" is then typed into the run - the rules' own reabsorb, "two
    // words typed into a bold pair stays bold". That settling move runs on selectionchange, so a fast enough typist beats it and the
    // text reads `**bold** done`; otherwise `**bold done**`. Chat 1 measured both on main (ledger 67: one typeKeys call came out
    // `**bold** done`; split calls and a writer's pace `**bold done**`), and the check failed once on a tree without typing-latency (64).
    // The claim itself - every convention character is still a REAL character, the count preserved 1:1 - holds either way: successor below.
    // ok("S2/§3: and `entry.text` stays PLAIN — the convention characters are still real characters in the surface (count preserved 1:1 through decoration), which is the constraint that makes the caret restore valid and the CSS-only flag law the only lawful one",
    //   typeof plain === 'string' && plain.includes('**bold**'), JSON.stringify({ plain }));
    // ------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by typed-literal (Oct 16; Nick: a typed formatting character is LITERAL, stored escaped) ----
    // Kept VERBATIM and no longer run: the deterministic successor counted four `*` and a length of 16 + 14, and read the words with the
    // stars taken out - the typed stars are now stored `\*`, four backslashes longer, and the closing pair is literal text, so nothing is
    // reabsorbed: the text is the same at any typing speed. Successor below: the exact escaped text.
    // const typedRun = ' **bold** done';
    // const words = typeof plain === 'string' ? plain.replace(/\*/g, '') : null;
    // const countOk = typeof plain === 'string' && plain.length === 'Alpha beta gamma'.length + typedRun.length
    //   && (plain.match(/\*/g) || []).length === 4 && words === 'Alpha beta gamma bold done';
    // i112aParks.s2s3 = { plain, countOk };
    // ok("S2/§3 [deterministic successor]: and `entry.text` stays PLAIN — every convention character typed is still a REAL character in the surface: the four `*` all present and the count preserved 1:1 (wherever the 211 rules' reabsorb puts the closing pair)",
    //   countOk, JSON.stringify({ plain, length: plain && plain.length, want: 'Alpha beta gamma'.length + typedRun.length }));
    // ------------------------------------------------------------------
```

## Record 3 · from item112a.mjs lines 363-382 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c4f0365dea3c1ecf5631495cab6ca8666de27cf1

```js
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S7 (§7.7 @ ${w}x${h}): BOTH OPEN THEIR TABS — the Desk drawer opens onto EMPTY CONTENT WITHOUT ERROR, and the Counsel opens onto its own. An empty drawer opens, so G3's absence-over-grayed does not govern it`,
    // open.sliverOpen === 'true' && open.tutorOpen === 'true',
    // JSON.stringify(open));
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the Oct 12 "one drawer at a time, at every width" rule is REPLACED by the MEASURED rule - both
    // hands stand where the band holds the page AND both at their 200px minimum, otherwise opening one closes the other; the page never moves), 2026-10-23 ----
    // Kept VERBATIM and no longer run (the Oct 12 successors, with the driver press that assumed the Counsel had yielded). The measured successors follow.
    //
    // ok(`S7 successor [one drawer at a time] (§7.7 @ ${w}x${h}): the Counsel opens onto its own tab and the Desk hand HAS YIELDED - only one drawer is open at a time`,
    //   open.tutorOpen === 'true' && open.sliverOpen === 'false',
    //   JSON.stringify(open));
    // await openSliverByGrip(app);   // the other hand: the Desk drawer opens onto EMPTY CONTENT WITHOUT ERROR, and the Counsel yields
    // const deskOnly = await app.evalJs(DRAWERS);
    // ok(`S7 successor (§7.7 @ ${w}x${h}): the Desk drawer opens onto EMPTY CONTENT WITHOUT ERROR (G3's absence-over-grayed does not govern an empty drawer), and the Counsel has yielded`,
    //   deskOnly.sliverOpen === 'true' && deskOnly.tutorOpen === 'false',
    //   JSON.stringify(deskOnly));
    // ----------------------------------------------------------------------
```

## Record 4 · from item112a.mjs lines 474-485 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c4f0365dea3c1ecf5631495cab6ca8666de27cf1

```js
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S3 (§7.3 @ ${w}x${h}): and with BOTH hands standing, the paper is STILL where it was with both shut — chrome never reflows the writer's line`,
    // same(closed, bothOpen), JSON.stringify({ closed, bothOpen, drawers }));
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the measured rule replaces Oct 12's one-drawer-at-every-width), 2026-10-23 ----
    // Kept VERBATIM and no longer run (the Oct 12 successor). The measured successor follows.
    //
    // ok(`S3 successor (§7.3 @ ${w}x${h}): and with the hands TAKING TURNS (the second opening closes the first - one drawer at a time) the paper is STILL where it was with both shut - chrome never reflows the writer's line`,
    //   same(closed, bothOpen) && drawers.sliverOpen === 'true' && drawers.tutorOpen === 'false', JSON.stringify({ closed, bothOpen, drawers }));
    // ----------------------------------------------------------------------
```

## Record 5 · from item112a.mjs lines 546-553 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
      // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23, rulings a-b): the prose page is the letter page, 8.5 page-inches = 620px laid out,
      // where 8884d49-era pages were 615.4 - so the paper's left edge sits 2.3px further left at 1100 and the same pre-existing overhang now reads -32
      // (lane 3), not -29.7. The pin's point - a regression guard on a measured, disclosed deviation - is the successor's, re-pinned on the letter
      // page. Kept VERBATIM and no longer run; record below (pok).
      //
      // ok(`S4 (§7.4 @ ${w}x${h}): PRE-EXISTING ANCHOR DEVIATION, PINNED — the Desk hand overhangs the paper's left edge by 29.7px at the frame's own minimum width. CONTROLLED AGAINST CLEAN origin/main 89c5955 (src reverted and rebuilt in this worktree): main reads the SAME -29.7 in Draft and Free Write, so this is app-wide and predates 112-A. Pinned here as a regression guard, and SURFACED to the desk for the 117/119 joint pass — not repaired in this build, per §5's stop-and-surface`,
      //   deskDelta != null && Math.abs(deskDelta - (-29.7)) <= 1.0, JSON.stringify({ geo, deskDelta, mainBaseline: -29.7, controlSha: '89c5955' }));
      // ------------------------------------------------------------------
```

## Record 6 · from item112a.mjs lines 595-603 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23; the zoom's "panels tucked"): Draft opened in the Typewriter ZOOM (Arbor's default) -
    // the page ~1.6x in a stage-wide column, both hands tucked - so its rects could never equal Revise's, which has no typewriter (lane 3: Draft's
    // column 1034 wide at 1100). The claim holds in the view both modes share; the successor compares Revise with Draft in the NORMAL view (Draft's
    // own toggle off, above). Kept VERBATIM and no longer run; record below (pok).
    //
    // ok(`S4 (@ ${w}x${h}): REVISE'S HANDS SIT EXACTLY WHERE DRAFT'S DO — Desk dock, Counsel panel and paper all at identical rects across the two modes. This is 112-A's own claim (§4: build to 119's geometry, carried onto Revise unchanged), and it is what a 112-A geometry regression would break`,
    //   near(geo.dock, draftGeo.dock) && near(geo.tutor, draftGeo.tutor) && near(geo.paper, draftGeo.paper),
    //   JSON.stringify({ revise: { dock: geo.dock, tutor: geo.tutor, paper: geo.paper }, draft: draftGeo }));
    // ------------------------------------------------------------------
```

## Record 7 · from item112a.mjs lines 656-665 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
    // ---- PARKED - SUPERSEDED by page-size (rulings a-b): "within 30px" was sized to the old pin (29.7px); the letter page moves that overhang to 32px
    // (lane 3: gapA 32, every other term held). The successor keeps the claim and sizes the station to the re-pinned deviation. Kept VERBATIM and no
    // longer run; record below (pok).
    //
    // ok('S4 (§7.4): THE DESK HAND IS PAPER-ANCHORED, NOT SCREEN-ANCHORED — across the two reference widths the paper travels 133px and the dock holds station on its edge (within 30px at both), while NEITHER viewport offset stays constant: measured from the left it moves ~103px, from the right ~163px. A screen-anchored dock would have held one of those two fixed',
    //   paperTravel != null && Math.abs(paperTravel) > 100
    //     && gapA != null && gapB != null && Math.abs(gapA) <= 30 && Math.abs(gapB) <= 30
    //     && Math.abs(fromLeftB - fromLeftA) > 20 && Math.abs(fromRightB - fromRightA) > 20,
    //   JSON.stringify({ anchorTrack, paperTravel, gapA, gapB, fromLeftA, fromLeftB, fromRightA, fromRightB }));
    // ------------------------------------------------------------------
```

## Record 8 · from item112a.mjs lines 727-741 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c4f0365dea3c1ecf5631495cab6ca8666de27cf1

```js
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S5 (§7.5 @ ${w}x${h}): the two HANDS coexist in Revise — Desk and Counsel both stand open and DO NOT OVERLAP, so every control under either stays reachable (the mirrored pair, item 119)`,
    // state.sliverOpen === 'true' && state.tutorOpen === 'true'
    // && !!sliverPanel && !!tutorPanel && sliverPanel.r <= tutorPanel.l + 1,
    // JSON.stringify({ state, sliverPanel, tutorPanel }));
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the measured rule replaces Oct 12's one-drawer-at-every-width), 2026-10-23 ----
    // Kept VERBATIM and no longer run (the Oct 12 successor). The measured successor follows; where there is room it is the original S5 above again.
    //
    // ok(`S5 successor (§7.5 @ ${w}x${h}): the two HANDS TAKE TURNS in Revise - opening the Counsel closes the Desk (one drawer at a time, at every width), and the open Counsel panel is reachable`,
    //   state.sliverOpen === 'false' && state.tutorOpen === 'true' && !!tutorPanel,
    //   JSON.stringify({ state, sliverPanel, tutorPanel }));
    // ----------------------------------------------------------------------
```

## Record 9 · from item112a.mjs lines 927-933 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a51f014c0adcdb1a1e628e407a9573af688309d7

```js
  // ---- PARKED RECORD - SUPERSEDED by typed-literal (Oct 16): item112a-deterministic's record re-verified its successor's count, which
  // escaping falsifies (that successor is parked above). Kept VERBATIM and no longer run; successor record directly below.
  // // item112a-deterministic (Oct 16): S2/§3's literal `**bold**` placement, parked - the record re-verifies the claim on the default leg's text
  // { const o = i112aParks.s2s3 || {};
  //   pok('PARKED (was "S2/§3: and `entry.text` stays PLAIN — the convention characters are still real characters in the surface (count preserved 1:1 through decoration), which is the constraint that makes the caret restore valid and the CSS-only flag law the only lawful one", asserted as `includes(\'**bold**\')`) - timing-dependent placement of the closing pair (the 211 reabsorb vs a fast typist); live successor: S2/§3 [deterministic successor]',
  //     !!o.countOk, JSON.stringify(o)); }
  // ------------------------------------------------------------------
```
