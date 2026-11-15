# Parked records archived from pw1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/pw1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from pw1.mjs lines 327-336 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 268a71b56a0d4f7db96cd5d5d4301daf819671e0

```js
      // PW2 S2 AMENDMENT (Nick, 2026-09-13) — SUPERSEDED IN PLACE, original quoted
      // verbatim (A4). Nick: "section off Boards from Pages clearly". The
      // membership section's heading is now simply "Pages", and a SECOND
      // membership section, "Boards", appears when the board holds a nested
      // board. This fixture nests no board, so exactly the two sections below
      // render — the claim (two sections, Cards first) is unchanged; only the
      // second heading's wording moved.
      //   ORIGINAL:
      //   ok('S2 (Q4): the side menu carries TWO SECTIONS — the board\'s own Cards, then the Pages linked to this board beneath them',
      //     JSON.stringify(survey.sections) === JSON.stringify(['Cards', 'Pages linked to this board']), JSON.stringify(survey.sections));
```

## Record 2 · from pw1.mjs lines 349-365 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 268a71b56a0d4f7db96cd5d5d4301daf819671e0

```js
      // PW2 S3 (item 123) — SUPERSEDED IN PLACE, original quoted verbatim (A4).
      //
      // THE PREMISE DIED; THE PRINCIPLE DID NOT. The original asserted
      // `hasMenu === isMember`: only membership rows wear a menu, because
      // board-owned cards "have no display to toggle". PW2 S3 gave cards a real
      // act — Copy to a board, plus the inert last-board removal — so a card
      // wearing a menu is now CORRECT, and the original would fail against the
      // very product it was written to protect.
      //
      // What survives is the law the check was actually for: G3 at the scale of
      // a menu — A MENU EXISTS ONLY WHERE IT HAS SOMETHING IN IT. So the successor
      // stops inferring "has an act" from "is a member" (a proxy that was true
      // for exactly one release) and asserts the law directly: open every menu
      // that exists, and require at least one item inside it.
      //   ORIGINAL:
      //   ok('S2/S3 (G3 at menu scale): only rows that HAVE an act wear a `⋯` — the membership rows carry Display/Hide, and the board-owned cards, which have no display to toggle, carry no empty menu at all. Absent, never a door onto nothing',
      //     Array.isArray(menuShape) && menuShape.length > 0 && menuShape.every((r) => r.hasMenu === r.isMember), JSON.stringify(menuShape));
```

## Record 3 · from pw1.mjs lines 581-584 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
            // SUPERSEDED (item word-diet, Nick) — cascadePinShown's text itself changed,
            // 'member · shown on the board' -> 'Shown'; ORIGINAL claim parked verbatim:
            // ok('S3: "Display on Board" moves the membership ONTO the canvas, and the row\'s state line changes with it — one act, both faces true',
            //   flag === true && !!moved && moved.note === 'member · shown on the board', JSON.stringify({ flag, moved }));
```

## Record 4 · from pw1.mjs lines 728-731 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeLoose's text itself changed,
  // "Loose — belongs nowhere yet" -> "Unfiled"; the ORIGINAL claim parked verbatim:
  // ok('S6: THE CHAIN NEVER RENDERS EMPTY — a page with no drawer and no project reads its HOME LABEL ("Loose — belongs nowhere yet"), not a bare title. The one case where the writer is most likely to be lost is the case where the address must still say something true',
  //   typeof looseCrumb === 'string' && looseCrumb.includes('Loose — belongs nowhere yet'), String(looseCrumb));
```

## Record 5 · from pw1.mjs lines 755-758 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2f7861ab791defdcc5ebd8e191cd83df4645100c

```js
    // SUPERSEDED (item arbor-quiet-brass): "Connected" renamed to Arbor's own "Grafted" —
    // this check's own round-1 sweep missed it (a case-SENSITIVE grep for "Boards
    // connected" never matches this uppercase-transformed "BOARDS CONNECTED").
    // ok('S1, Fable ruling 2: a LOOSE page (no drawer, no project) still shows its REAL CONNECTIONS, above the creation doors — answering "which boards is this page on" with "make a project first" was the panel telling a writer to build what they had already built', looseRows.length > 0 && looseRows.some((r) => r.title === 'A board with no drawer') && bodyText.includes('BOARDS CONNECTED'), JSON.stringify({ looseRows, hasHeading: bodyText.includes('BOARDS CONNECTED') }));
```

## Record 6 · from pw1.mjs lines 772-774 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2a97482981b0e80b676a3de2cedbcb515c218f9a

```js
  // SUPERSEDED (item arbor-quiet-brass): "connected" renamed to Arbor's own "grafted" —
  // the ONE connecting word is now "grafted", not "connected"; same three faces.
  // ok('S3/PW27 + ruling 4: ONE CONNECTING WORD, three faces — the Plan panel's heading is Nick's exact term, and the Places zone and the Page face's prose line both read "connected" (never "appears on", which would now LIE: appearing means being displayed, and the checkbox makes membership)', !!words && words.heading === 'Boards connected' && words.places === 'Also connected to…' && words.face === 'Also connected to', JSON.stringify(words));
```

## Record 7 · from pw1.mjs lines 857-861 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a7726cef3f029697aec66dd9a73d724a3cdf05fb

```js
    // ---- PARKED - SUPERSEDED by BIG PROJECTS step 2 (docs/plans/big-projects.md; Fable Oct 19): the lead sentence is retired with the no-project branch (it is absent in both states now).
    // Kept VERBATIM below and no longer run; the live successor follows. The Boards tab is the Pages pop-out's mirror (SectionsPopout, boards mode): New Board, the place's boards, presets = the deck library. A board's starters are New Card, Templates, Connect Pages - no New Page (the sliver keeps that tool). The Boards tab no longer carries Create a Board / Plot a Story or the "file this page to a drawer first" lead.
    //
    // ok('ERRATUM 2 (the other direction): with NO connections the sentence still speaks — it was never wrong, only wrong BENEATH a listed board, so it is withheld by state rather than deleted',
    //   leadBare.includes('File this page to a drawer first'), JSON.stringify(leadBare.slice(0, 160)));
```

## Record 8 · from pw1.mjs lines 882-887 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
  // SUPERSEDED (item word-diet, Nick) — pageHomeLoose's text itself changed,
  // "Loose — belongs nowhere yet" -> "Unfiled"; the ORIGINAL claim parked verbatim:
  // ok('ERRATUM 3: the location phrase renders WHOLE — "Loose — belongs nowhere yet" is not clipped by its own box (measured scrollWidth vs clientWidth), and it no longer wears `crumb-item`, whose 160px ellipsis turned it into the false sentence "Loose — belongs now…"',
  //   !!crumbGeom && crumbGeom.clipped === false && crumbGeom.isCrumbItem === false
  //     && crumbGeom.text.includes('belongs nowhere yet'),
  //   JSON.stringify(crumbGeom));
```
