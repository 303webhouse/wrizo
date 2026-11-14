# Parked records archived from cd1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/cd1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from cd1.mjs lines 144-148 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c1fecb5891844bf9685df6d28ff17b1ea609a048

```js
  // ---- PARKED - SUPERSEDED by hide-workshop (Nick, Oct 23 11:01 am: the Workshop tab is HIDDEN until built). Kept VERBATIM and no longer run;
  // its parked record is in the HARNESS_PARKED block, and its successor follows.
  // ok('S1: the top line reads the exact ratified strings, left-set inside the header row',
  //   JSON.stringify(topLine.stripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']) && topLine.stripInHeader,
  //   JSON.stringify(topLine.stripLabels));
```

## Record 2 · from cd1.mjs lines 153-179 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 4986b0de6ab7c85390f03fb0e382678f542e4cf3

```js
  // PW1 S6 (2026-09-08) — PARKED. The framed Page carries a location crumb
  // again (Nick, Q7), so this check's claim is false by ruling, not by defect.
  // Quoted verbatim with its successor in this file's own PARKED section
  // below. `topLine.noCrumb` is still GATHERED above (its sibling conjuncts
  // are untouched) — only the assertion on it retires.
  //   ok('S1: no title/breadcrumb node in the header (the paper names itself; the Page face carries it)',
  //     topLine.noCrumb, JSON.stringify(topLine));
  // CD3 harness-discipline fix (2026-07-22) — successor of the ORIGINAL
  // check (quoted verbatim, PARKED below, A4): Nick's own ruling scraps
  // Done from the Page/Script top bars (Publish, the rail, and free
  // navigation cover every exit now) — verified live, the right corner
  // holds ONLY the Pages/Plan flight doorway.
  // BM1 S3 (2026-07-22) — successor of the CD3 check (moved VERBATIM into the
  // PARKED section below, A4 + the immutability law): the page's bar gains the
  // PLAN → door at its end (S3's mirror of the board's PAGE →), so the right
  // corner now holds the Pages/Plan flight doorway PLUS PLAN →. Done stays
  // scrapped (CD3); still no Catch anywhere framed.
  // CD4 S2 (2026-07-24) — successor of the BM1 S3 check (moved VERBATIM into the
  // PARKED section below, A4 + the immutability law): Nick's ruling retires the
  // elder "Plan" flight tab (→ the legacy StructureBoard, /project/:id/board),
  // so the arrow-dressed PLAN → door is now the bar's ONLY Plan word — the right
  // corner holds ['Pages', 'Plan →']. Done still scrapped; still no Catch framed.
  // FRAMED-DESK DISPLAY PASS (aa11f58, 2026-09-30; Nick: "Looks good. Let's ship these changes.") — successor of the CD4 S2
  // check (moved VERBATIM into the PARKED section below, A4 + the immutability law): the pass moved the PLAN → door OUT of the
  // right corner and INTO the mode strip's own row ("the mode row is ... evenly spaced through Plan"), so the right corner now
  // holds ['Pages'] alone and the door is the strip's last item. Nothing was removed: the same door, the same handler, a new
  // address. Done still scrapped; still no Catch framed. (Batch Eight's first pair went red on exactly this.)
```

## Record 3 · from cd1.mjs lines 224-232 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 45ff3fcab3b9fa28454a6a3cdda7114f6e9680db

```js
  // ---- PARKED — SUPERSEDED by item 83 M5 (DR3), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. DR3 retired the Prose|Screenplay
  // tablist for one confirm-gated verb row naming its destination, so
  // `.wz-sliver-structure` no longer exists. The SUBJECT survives whole —
  // the script sliver still carries its structure control — and the
  // successor asserts exactly that against the shipped markup.
  //
  // ok('S2/S7: opening the sliver on script carries the structure picker (script\'s own hand tool)', scriptStructureCheck, String(scriptStructureCheck));
  // ------------------------------------------------------------------
```

## Record 4 · from cd1.mjs lines 234-241 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a487afe2ea93b2f15a6cc5727809a233cfceeea7

```js
  // ---- PARKED - SUPERSEDED by PR #7 (3951329: "Convert to Screenplay is no longer in the drawer"; the Structure zone
  // leaves the sliver on both surfaces), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The script sliver no longer carries a structure control at all. Successor beneath
  // asserts the absence, so a Convert row cannot return to the drawer unannounced.
  //
  // ok('S2/S7 [DR3 successor]: opening the sliver on script still carries its structure control - now the confirm-gated Convert row, not the retired tablist',
  //   scriptStructureRow, String(scriptStructureRow));
  // ----------------------------------------------------------------------
```

## Record 5 · from cd1.mjs lines 686-713 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3986e3fd88cd9492b73c663b456a5fcfd8531467

```js
    // ---- PARKED — SUPERSEDED by VW1 (item 134), 2026-09-17 --------------
    // A GENERATION DEEPER — the gated twin of the live CD3 successor parked
    // above, pinning the strip's labels in the OLD sequence. VW1's regroup
    // re-rules that sequence by founder word, so the check is not wrong: its
    // subject was re-ruled. Parked verbatim, never edited.
    //
    // pok('PARKED (was "S7 (successor to \'...ScriptEditor mounts the SAME drawer as prose...\'): ScriptEditor mounts the SAME cascade as prose (all eight categories present, B1\'s Trash included)") — CD3: Trash pinned to the strip\'s own foot, Change Theme renamed Themes — live successor (generation 3): this file\'s own live S7 section',
    // scriptCascadeParked.stripItemCount === 8
    // && JSON.stringify(scriptCascadeParked.stripLabels) === JSON.stringify(['Journal', 'Page', 'Plan', 'Drawers', 'Shelf', 'Settings', 'Themes', 'Trash']),
    // JSON.stringify(scriptCascadeParked));
    // ----------------------------------------------------------------
    // ---- PARKED, generation 4 — SUPERSEDED by item word-diet (Nick), 2026-10-14 ----
    // Quoted VERBATIM. drawerPage reworks, "Page" -> "Pages".
    //
    // pok('PARKED, generation 4 (was the CD3 gated re-assertion of the strip label SEQUENCE on the script surface) — VW1 (item 134): parity between script and prose is the claim and it survives whole; only the ORDER it spelled out has changed, so the successor compares the eight as a SET',
    //   scriptCascadeParked.stripItemCount === 8
    //     && JSON.stringify([...scriptCascadeParked.stripLabels].sort())
    //        === JSON.stringify(['Drawers', 'Journal', 'Page', 'Plan', 'Settings', 'Shelf', 'Themes', 'Trash']),
    //   JSON.stringify(scriptCascadeParked));
    // ------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): generation 6 - the SEVEN categories.
    // Kept VERBATIM below and no longer run; the live successor follows. The rail is seven tabs now (the place block, Pages, Boards, Journal, Settings, Themes, Trash): the Shelf is merged into the Journal, Plan is Boards, and the place block's label is the place itself, so the strip is compared as a SET by data-category, not by label.
    //
    // pok('PARKED, generation 5 (was generation 4\'s re-assertion with "Page" in the sorted set) — item word-diet: drawerPage reads "Pages"',
    //   scriptCascadeParked.stripItemCount === 8
    //     && JSON.stringify([...scriptCascadeParked.stripLabels].sort())
    //        === JSON.stringify(['Drawers', 'Journal', 'Pages', 'Plan', 'Settings', 'Shelf', 'Themes', 'Trash']),
    //   JSON.stringify(scriptCascadeParked));
```
