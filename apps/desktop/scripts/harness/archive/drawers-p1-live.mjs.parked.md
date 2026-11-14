# Parked records archived from drawers-p1-live.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/drawers-p1-live.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from drawers-p1-live.mjs lines 206-214 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 8d3673bd077fa75fef6f0622fa6025cfa61ce02b

```js
          // ---- PARKED - SUPERSEDED by the DRAWER MIRROR (Nick, via Fable, Oct 24: "a tab's rect is unchanged by open/close, only the arrow flips";
          // the Tutor | Grafts drawer is anchored to the page's right edge, the mirror of the Tools drawer). The tab no longer moves: the PANEL now
          // starts at the tab ([page][tab][panel]), so the tab can never sit inside the panel's tab row - the bug the arrow move cured (ledger 57) is
          // cured by the panel's place instead. Kept VERBATIM and no longer run; the successor restores the LEFT hand's claim for the right hand,
          // plus the panel against its tab; record per theme (pok).
          //
          // ok(`L2 ${T} (${hand}) [tutor-drawer-arrow successor]: the tab's rect MOVES while the drawer opens, settling ${GRIP_GUTTER_PX}px outside the open panel's own left edge (never inside its tab row)`,
          //   Math.abs(gap - GRIP_GUTTER_PX) < 1.5, JSON.stringify({ gripRight, panelLeft: last.panelLeft, gap }));
          // ------------------------------------------------------------------
```

## Record 2 · from drawers-p1-live.mjs lines 311-315 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
      // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
      // "Show grafts" is RETIRED: the board's tools arm is the FOUR door buttons and no footer toggle.
      // Quoted VERBATIM below. Successor: the check directly below.
      // ok(`L5 ${T} BOARD (page-level): the tools arm keeps its list, now on the shared shell - FOUR door buttons (Add card, New page card, Existing page, From a deck) and the footer toggle, with no Typeface/Format/Actions/Templates and no tab row`,
      //   b.items.length === 4 && b.items.every((x) => x.length > 0) && b.footerToggle.length === 1 && b.otherSections === 0 && b.tabs === 0, JSON.stringify(b));
```

## Record 3 · from drawers-p1-live.mjs lines 332-339 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e111c125b736841845fa4b1f96170b7cb7f5223c

```js
      // SUPERSEDED (item tutor-drawer-mirror round 2, Nick's live bug
      // report, confirmed by tutor-drawer-probe.mjs: the open TUTOR tab
      // measured brass rgb(255,152,0); "make it olive now") — the chosen
      // DrawerTabs.tsx tab (shared by both the left Sliver's TEXT|INK row
      // and the right Tutor's TUTOR|links row — ONE component) no longer
      // wears brass at all; quoted verbatim:
      // ok(`L6 ${T}: the CHOSEN tab (TEXT) computes to brass and takes no fill; the unchosen one (INK) does not`,
      //   c.textTab && (c.textTab.border === brass || c.textTab.color === brass) && c.textTab.bg === 'rgba(0, 0, 0, 0)' && c.inkTab && c.inkTab.border !== brass && c.inkTab.color !== brass, JSON.stringify({ brass, c }));
```

## Record 4 · from drawers-p1-live.mjs lines 362-378 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c4f0365dea3c1ecf5631495cab6ca8666de27cf1

```js
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23): the Oct 12 "one drawer at a time, at every width" rule is REPLACED by the MEASURED rule - both
    // drawers stand where the band holds the page AND both at their 200px minimum; otherwise opening one closes the other (Nick's Oct 7 rule, his original ask in
    // menusDrawers.ts's header); the page never moves. The block below is the Oct 12 successor, kept VERBATIM and no longer run. Its measured successor follows.
    //
    // for (const w of [1100, 1280, 1400]) {
    //   await guard(`L7 ${T} @${w}`, async () => {
    //     if (!(await open(app, th, 'draft', w, 800))) { ok(`L7 ${T} fixture: draft opened at ${w}`, false); return; }
    //     await ensureLeft(app, true);
    //     await toggleRight(app); await sleep(900);
    //     const a = { left: await leftOpen(app), right: await rightOpen(app) };
    //     ok(`L7 ${T} @${w}: opening the RIGHT drawer while the left is open CLOSES the left - one drawer at a time`, a.right === true && a.left === false, JSON.stringify(a));
    //     await toggleLeft(app); await sleep(900);
    //     const b = { left: await leftOpen(app), right: await rightOpen(app) };
    //     ok(`L7 ${T} @${w}: and opening the LEFT drawer while the right is open closes the right (the rule is symmetric)`, b.left === true && b.right === false, JSON.stringify(b));
    //   });
    // }
    // ----------------------------------------------------------------------
```

## Record 5 · from drawers-p1-live.mjs lines 436-445 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 57bf56a5ec3928e66226f94cb70b423398bcd056

```js
      // PARKED - SUPERSEDED (Oct 12): this driver pressed Enter through app.key(), which sends rawKeyDown + keyUp only - no char event, so no keypress, so NO plain button is ever activated by it.
      // Chat 1's run read the toggle as "did not flip"; the check was not testing a keyboard. The original is kept verbatim below; the successor sends a TRUSTED keyDown carrying the
      // character, and proves the instrument on a CONTROL (the plain "..." button, which has no handler of ours) before it accuses the product.
      //
      // if (t0 != null) {
      //   await app.evalJs(`document.querySelector('.wz-sliver-instruments-modes [data-mode-toggle="typewriter"]').focus()`);
      //   await app.key('Enter'); await sleep(400);
      //   const t1 = await app.evalJs(`document.querySelector('.wz-sliver-instruments-modes [data-mode-toggle="typewriter"]')?.getAttribute('aria-pressed') ?? null`);
      //   ok(`L9 ${T}: Enter on the focused Typewriter toggle flips it (keyboard-operable)`, t1 != null && t1 !== t0, JSON.stringify({ t0, t1 }));
      // }
```

## Record 6 · from drawers-p1-live.mjs lines 464-473 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a3de5470fa88f750769d0c0495f8090c6d4e2e0b

```js
        // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23: the zoom's "panels tucked"): when Enter turns the Typewriter ON, the page enters the
        // zoom, which TUCKS both drawers - the Sliver holding this toggle closes - and hands a stranded focus to the editor. The press below then
        // focuses a hidden control and Space goes to the page (lane 3, Flux, whose default is off: t2 true, t3 true). Arbor passed only because its
        // default is ON, so its Enter turned the zoom OFF. Kept VERBATIM and no longer run; successor follows; one record per theme in the parked section.
        //
        // await app.evalJs(`document.querySelector('${sel}')?.focus()`);
        // await pressSpace(app); await sleep(400);
        // const t3 = await app.evalJs(`document.querySelector('${sel}')?.getAttribute('aria-pressed') ?? null`);
        // ok(`L9 ${T}: and Space flips it back`, t3 != null && t3 !== t2, JSON.stringify({ t2, t3 }));
        // ------------------------------------------------------------------
```

## Record 7 · from drawers-p1-live.mjs lines 489-509 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4924bc1754f8a1bcbe9099fc9a32ee05186f0bf

```js
      // SUPERSEDED WHOLE (help-buttons, Nick approved Oct 12): the Grafts/
      // Links tab's own "?" moved off DrawerNote (.wz-drawer-note-btn) onto
      // the new shared HelpButton (.wz-help, store/help.ts) - AND the
      // Arbor-only/Flux-empty ruling this Flux branch asserted is ITSELF
      // retired: helpGrafts now carries a real sentence in BOTH themes, so
      // Flux gets a "?" too. Kept verbatim, no longer run:
      //   const hasNote = await app.evalJs("!!document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')");
      //   if (th.id === 'arbor') {
      //     await ensureRight(app, true);
      //     const n0 = await app.evalJs(`document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.getAttribute('aria-expanded') ?? null`);
      //     await app.evalJs("document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.click()"); await sleep(300);
      //     const n1 = await app.evalJs(`({ expanded: document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.getAttribute('aria-expanded'), role: document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-pop')?.getAttribute('role') ?? null })`);
      //     await app.evalJs("document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.focus()"); await app.key('Escape'); await sleep(300);
      //     const n2 = await app.evalJs("document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.getAttribute('aria-expanded') ?? null");
      //     ok(`L9 ${T}: the Arbor "?" note is a button that reports aria-expanded, opens a role=note panel on press, and closes on Escape`, n0 === 'false' && n1.expanded === 'true' && n1.role === 'note' && n2 === 'false', JSON.stringify({ n0, n1, n2 }));
      //   } else {
      //     ok(`L9 ${T} [word-diet successor]: Flux's own tab row has NO "?" note (its word explains itself - by ruling)`, hasNote === false, String(hasNote));
      //   }
      // Successor: BOTH themes now carry the same claim - a "?" that reports
      // aria-expanded, opens the SHARED fixed overlay (role=note), and closes
      // on Escape, returning focus to the "?" itself.
```
