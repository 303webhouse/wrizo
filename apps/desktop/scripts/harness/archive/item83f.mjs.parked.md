# Parked records archived from item83f.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item83f.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item83f.mjs lines 333-354 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 84ff95c5f157c1393d2784ed6f7cf194c5e699de

```js
  // ---- PARKED - SUPERSEDED by PR #7 (19d2c02: the foot is one three-dot Settings menu, and Full Screen leaves the drawer), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The row is no longer TYPEWRITER · PROGRESS, and Full Screen is no longer on the
  // progress line (the app chrome already offers it), so the bar has no neighbour to yield to. Successors beneath.
  //
  // ok('E2: the instruments row is TYPEWRITER · PROGRESS — Full Screen has left the cell it used to occupy',
  //   JSON.stringify(footShape.rowLabels) === JSON.stringify(['Typewriter', 'Progress'])
  //     && footShape.fullScreenInRow === false,
  //   JSON.stringify(footShape));
  //
  // ok('E2: Full Screen sits on the progress bar line itself, and there is EXACTLY ONE of it in the panel — a move, never a second instance left behind',
  //   footShape.fullScreenInGoalLine === true && footShape.fullScreenTotal === 1,
  //   JSON.stringify(footShape));
  //
  // ok('E2: the bar genuinely yielded the room — the hairline is strictly narrower than the goal block it used to span, which is the difference between sharing a line and merely sitting near one',
  //   footShape.barWidth !== null && footShape.goalInnerWidth !== null
  //     && footShape.barWidth > 0 && footShape.barWidth < footShape.goalInnerWidth - 1,
  //   JSON.stringify(footShape));
  //
  // ok('E2: the alignment is LAYOUT — a flex row with align-items:center, not a nudged margin (the fence the brief sets; the probe measures the resulting centres at both widths)',
  //   footShape.lineDisplay === 'flex' && footShape.lineAlign === 'center',
  //   JSON.stringify(footShape));
  // ----------------------------------------------------------------------
```

## Record 2 · from item83f.mjs lines 453-460 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 396d2f0f837d255fc5bb13fd33a9a51777a47b64

```js
  // ---- PARKED - SUPERSEDED by Nick's ruling of 2026-09-25 ("Enter makes no paragraph gap, so a line is a paragraph") ----------------
  // Kept VERBATIM and no longer run. This E3 block asserted that Indent takes a whole run of consecutive inked lines. Nick's ruling
  // makes the caret's own LINE the unit (with a selection, each selected line): Tab on one of three lines indented all three, which
  // is what he reported. The four E3 checks below are parked one by one, each beside its successor on the same fixture.
  //
  // ok('E3: one press indents the WHOLE PARAGRAPH, not the caret line — both lines take the tab, which is the discriminator against the superseded line-scoped control',
  //   e3AfterOne === '\tAlpha one\n\tAlpha two', JSON.stringify(e3AfterOne));
  // ------------------------------------------------------------------
```

## Record 3 · from item83f.mjs lines 467-470 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 396d2f0f837d255fc5bb13fd33a9a51777a47b64

```js
  // ---- PARKED - SUPERSEDED (same ruling; see above) ----
  // ok('E3: pressing again INCREASES the level — the second discriminator, since the superseded toggle would have removed the tab it just added',
  //   e3AfterTwo === '\t\tAlpha one\n\t\tAlpha two', JSON.stringify(e3AfterTwo));
  // ------------------------------------------------------------------
```

## Record 4 · from item83f.mjs lines 480-484 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 396d2f0f837d255fc5bb13fd33a9a51777a47b64

```js
  // ---- PARKED - SUPERSEDED (same ruling; see above) ----
  // ok('E3: the level renders as indent with the MARKER LOW-INK — the leading tabs are wrapped in the same .md-mark register every other convention wears, and the character count stays 1:1 so the caret offset still restores',
  //   marker.marks.length === 2 && marker.marks.every(m => m === '\t\t') && marker.textLength === e3AfterTwo.length,
  //   JSON.stringify(marker));
  // ------------------------------------------------------------------
```

## Record 5 · from item83f.mjs lines 497-500 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 396d2f0f837d255fc5bb13fd33a9a51777a47b64

```js
  // ---- PARKED - SUPERSEDED (same ruling; see above) ----
  // ok('E3: a caret in the SECOND paragraph indents only that paragraph, and the blank separator between them takes no tab — a tab on a separator is invisible litter, never structure',
  //   twoParas === '\t\tAlpha one\n\t\tAlpha two\n\n\tBeta one', JSON.stringify(twoParas));
  // ------------------------------------------------------------------
```

## Record 6 · from item83f.mjs lines 512-520 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in faeeb598770addd1f75cc5ebf23e110c9c856500

```js
  // ---- PARKED - SUPERSEDED by item 158, 2026-09-25 ------------------------
  // Kept VERBATIM and no longer run. Nick's report ("Tab moved browser focus instead of indenting") built the very thing this
  // fence said had not been built: Tab now indents the caret's paragraph in Draft, through the SAME formatter the arrow uses.
  // The fence's own reasoning ("the arrow is the only door this wave opens") was true of THIS wave and is not a law; its
  // successor asserts the new truth, on the same fixture and the same keystroke.
  //
  // ok('E3 (fence): pressing TAB changes nothing — Tab-as-indent is item 102 and was NOT built here; the arrow is the only door this wave opens',
  //   afterTab === beforeTab, JSON.stringify({ beforeTab, afterTab }));
  // ------------------------------------------------------------------
```

## Record 7 · from item83f.mjs lines 546-804 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d9aaeb27db5827889f9a8375a96c8abad2e25085

```js
  // ---- PARKED - SUPERSEDED by PR #7 (3951329: "Structure in the drawer is replaced by gray Template icons"), 2026-10-02 ----
  // Kept VERBATIM and no longer run: ALL of E4 - item 114's kind chips and style guides (render, persist per page,
  // no default leak, the Screenplay-name seam, the prose-only scope). They lived in the Structure zone, which PR #7
  // removed whole. Fable's review (2026-10-03) restores the chips and style guides as one "Page kind" row below the
  // Templates, without the Convert row; the successor beneath re-makes these claims on that row.
  //
  // // ==========================================================================
  // // E4 — ITEM 114'S PLACEHOLDERS. They render, they persist per page, and
  // // nothing downstream is wired.
  // //
  // // A placeholder can still get four things wrong, and those are the checks:
  // // that the style guides are DISCLOSED by Research rather than greyed; that a
  // // page which never chose stays byte-identical on disk (zero schema means
  // // nothing if the reader writes a default at birth); that the selection is on
  // // the PAGE and not in component state; and that a page's KIND cannot leak
  // // into the writer's per-user defaults — the one real defect the shared
  // // PageSettings shape invites (S0 (e)).
  // // ==========================================================================
  // await freshProsePage(app, 1400, 900);
  // await toDraft(app);
  //
  // const roster = await app.evalJs(`(() => {
  //   const zone = document.querySelector('.wz-sliver-structure-zone');
  //   const kinds = [...zone.querySelectorAll('[data-page-kind]')];
  //   return {
  //     labels: kinds.map(b => b.textContent),
  //     checked: kinds.filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.pageKind),
  //     anyDisabled: kinds.some(b => b.disabled || b.getAttribute('aria-disabled') === 'true'),
  //     guidesPresent: zone.querySelectorAll('[data-style-guide]').length,
  //     kindGroupRole: zone.querySelector('[role="radiogroup"]')?.getAttribute('role'),
  //   };
  // })()`);
  // ok('E4: Structure carries the three kind buttons in the ruled order, with NORMAL preselected and none of them greyed',
  //   JSON.stringify(roster.labels) === JSON.stringify(['Normal', 'Screenplay', 'Research'])
  //     && JSON.stringify(roster.checked) === JSON.stringify(['normal'])
  //     && roster.anyDisabled === false && roster.kindGroupRole === 'radiogroup',
  //   JSON.stringify(roster));
  //
  // ok('E4: the style guides are ABSENT before Research is chosen — not greyed, not hidden: what is not built for this page does not render (G3)',
  //   roster.guidesPresent === 0, JSON.stringify(roster));
  //
  // // G4's in-place disclosure.
  // await app.evalJs("document.querySelector('[data-page-kind=\"research\"]').click()");
  // await sleep(350);
  // const revealed = await app.evalJs(`(() => {
  //   const zone = document.querySelector('.wz-sliver-structure-zone');
  //   const guides = [...zone.querySelectorAll('[data-style-guide]')];
  //   return {
  //     labels: guides.map(b => b.textContent),
  //     checked: guides.filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.styleGuide),
  //     anyDisabled: guides.some(b => b.disabled || b.getAttribute('aria-disabled') === 'true'),
  //     depth: guides.length ? guides[0].closest('.wz-sliver-structure-zone') === zone : false,
  //   };
  // })()`);
  // ok('E4: choosing RESEARCH reveals the four style guides IN PLACE, at the same depth, with MLA preselected and nothing greyed',
  //   JSON.stringify(revealed.labels) === JSON.stringify(['MLA', 'APA', 'Chicago', 'AP'])
  //     && JSON.stringify(revealed.checked) === JSON.stringify(['mla'])
  //     && revealed.anyDisabled === false && revealed.depth === true,
  //   JSON.stringify(revealed));
  //
  // // MLA is a READ default, not a written one: revealing the row must not dirty
  // // the page with a choice the writer never made.
  // await sleep(700);   // persistence.scheduleFlush is 300ms; this is well past it
  // const storedAfterKind = await app.evalJs(`(() => {
  //   const id = (location.hash.match(/#\\/page\\/([^?/]+)/) || [])[1];
  //   const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
  //   const e = rows.find(r => r.id === id) || null;
  //   return { id, pageSettings: e ? (e.pageSettings ?? null) : 'ENTRY NOT FOUND' };
  // })()`);
  // ok('E4: picking Research writes kind:"research" to the page own page_settings and writes NO styleGuide — MLA is preselected by reading through the default, so a reveal never records a choice the writer did not make',
  //   storedAfterKind.pageSettings && storedAfterKind.pageSettings.kind === 'research'
  //     && storedAfterKind.pageSettings.styleGuide === undefined,
  //   JSON.stringify(storedAfterKind));
  //
  // // ...and it is on the PAGE, not in a component. A reload is the only honest
  // // proof of that.
  // await app.evalJs("document.querySelector('[data-style-guide=\"chicago\"]').click()");
  // await sleep(700);
  // await app.reload();
  // await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page after reload' });
  // await sleep(400);
  // await openSliver(app);
  // await sleep(250);
  // await toDraft(app);
  // const afterReload = await app.evalJs(`(() => {
  //   const zone = document.querySelector('.wz-sliver-structure-zone');
  //   return {
  //     kind: [...zone.querySelectorAll('[data-page-kind]')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.pageKind),
  //     guide: [...zone.querySelectorAll('[data-style-guide]')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.styleGuide),
  //   };
  // })()`);
  // ok('E4: the selection survives a RELOAD — Research and Chicago come back checked, so it lives on the page and not in component state',
  //   JSON.stringify(afterReload.kind) === JSON.stringify(['research'])
  //     && JSON.stringify(afterReload.guide) === JSON.stringify(['chicago']),
  //   JSON.stringify(afterReload));
  //
  // // ==========================================================================
  // // E4 — THE DEFAULTS LEAK. The discriminating check of this section: without
  // // pageDefaults.dressOnly, pressing "Set as my default page settings" on a
  // // RESEARCH page makes every page born afterwards Research, silently. Nothing
  // // in the UI would announce it.
  // // ==========================================================================
  // await app.evalJs(`(() => {
  //   // VW1 — one handle for one control. This selected by LABEL TEXT, which
  //   // is lexicon-fragile: rename the term and the find() silently returns
  //   // undefined and the guard below swallows it. data-category is the handle.
  //   const b = document.querySelector('.wz-strip-item[data-category=page]');
  //   if (!b) throw new Error('item83f: no Page tab to press');
  //   b.click();
  // })()`);
  // await sleep(500);
  // const savedDefaults = await app.evalJs(`(() => {
  //   const b = [...document.querySelectorAll('.wz-cascade-action')].find(x => x.textContent.trim() === 'Set as my default page settings');
  //   if (!b) return { pressed: false };
  //   b.click();
  //   return { pressed: true };
  // })()`);
  // await sleep(500);
  // const storedDefaults = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-page-defaults') || 'null')");
  // ok('E4: "Set as my default page settings" was reachable and was pressed on a RESEARCH page (the fixture the leak needs)',
  //   savedDefaults.pressed === true, JSON.stringify(savedDefaults));
  // ok('E4: the writer per-user defaults carry the DRESS and NOT the kind — a page kind is a fact about that page, and facts do not travel by default',
  //   storedDefaults !== null && storedDefaults.kind === undefined && storedDefaults.styleGuide === undefined
  //     && storedDefaults.margins !== undefined,
  //   JSON.stringify(storedDefaults));
  //
  // // The leak at its DESTINATION. Read this one with the note below, because a
  // // run of it turned up something that is not this ticket's:
  // //
  // // ► OBSERVED, SURFACED, NOT FIXED — R6's BIRTH-FROM-DEFAULTS DOES NOT REACH
  // //   THE UNBORN ROUTE. A page born through "New Page" comes back with NO
  // //   page_settings at all (measured: storedPageSettings null on a genuinely
  // //   born row, with the writer's defaults saved and non-empty). The stamp
  // //   `pageSettings: getUserPageDefaults() ?? undefined` lives in
  // //   persistence.createJournalPage, and this door navigates to an UNBORN href
  // //   instead (CascadePanels' newPage -> unbornHref, FX14 S1's "every New Page
  // //   opens in THE Page"); PB1's own `unbornEntry`/`birth` never carry the
  // //   field. So item 83 M2's own ruling — "page settings reset to defaults when
  // //   the user creates a new page" — is bypassed on what is now the ordinary
  // //   way a page is made. That is a pre-existing interaction between M2 and
  // //   PB1, entirely outside this brief, and it is reported in the offer rather
  // //   than repaired here.
  // //
  // //   WHAT IT COSTS THIS CHECK, said plainly: the destination has two locks on
  // //   it now, and only one of them is E4's. The DISCRIMINATING check for the
  // //   strip is the one above, at the door — remove `dressOnly` and the stored
  // //   defaults carry `kind:"research"` and that check goes red. This one
  // //   CORROBORATES; it does not, on this route, discriminate. It is kept
  // //   because the day R6 is repaired is exactly the day it starts to.
  // // The id BEFORE the door is taken. Without it this check cannot tell a newly
  // // born page from the Research page it was standing on — and it could not, on
  // // its first run: the selector read 'New page' where the lexicon says 'New
  // // Page', so nothing was clicked and the check reported the open page's own
  // // kind as though a birth had inherited it. Caught because the assertion was
  // // wrong, not because anything in the product was; the guard below is what
  // // stops that class of false red (and its far worse twin, a false green).
  // const idBeforeBirth = await app.evalJs("(location.hash.split('/page/')[1] || '').split(/[?/]/)[0]");
  // await app.evalJs(`(() => {
  //   const b = [...document.querySelectorAll('.wz-cascade-action')].find(x => x.textContent.trim() === 'New Page');
  //   if (b) b.click();
  // })()`);
  // await sleep(900);
  // await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'newly born page' });
  // await sleep(400);
  // // A word, so the page is genuinely BORN. Without it the route sits at
  // // `#/page/new` (PB1's unborn page — no row exists yet), and `storedKind`
  // // would read null for a reason that has nothing to do with the strip under
  // // test: an over-claim the first run of this check actually made, and this
  // // line is what retires it. The in-memory entry it births carries whatever
  // // `getUserPageDefaults()` stamped at creation, which IS the channel the leak
  // // would travel down.
  // await focusEditor(app);
  // await app.typeKeys('birth ');
  // await sleep(900);
  // await openSliver(app);
  // await sleep(250);
  // await toDraft(app);
  // const bornPage = await app.evalJs(`(() => {
  //   const id = (location.hash.match(/#\\/page\\/([^?/]+)/) || [])[1];
  //   const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
  //   const e = rows.find(r => r.id === id) || null;
  //   const zone = document.querySelector('.wz-sliver-structure-zone');
  //   return {
  //     id,
  //     rowExists: !!e,
  //     storedPageSettings: e ? (e.pageSettings ?? null) : null,
  //     storedKind: e && e.pageSettings ? (e.pageSettings.kind ?? null) : null,
  //     checked: [...zone.querySelectorAll('[data-page-kind]')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.pageKind),
  //     guidesPresent: zone.querySelectorAll('[data-style-guide]').length,
  //   };
  // })()`);
  // ok('E4 (corroborating, see the note above): a page BORN AFTER those defaults were saved is Normal, carries no kind key, and shows no style guides. Guarded twice so it cannot pass by standing still — the id must differ from the page it was launched from, and the row must actually EXIST (a word was written, so PB1 has borne it). It corroborates rather than discriminates on THIS route, because birth-from-defaults does not currently reach it at all',
  //   bornPage.id !== idBeforeBirth && bornPage.id !== 'new' && bornPage.rowExists === true
  //     && bornPage.storedKind === null
  //     && JSON.stringify(bornPage.checked) === JSON.stringify(['normal'])
  //     && bornPage.guidesPresent === 0,
  //   JSON.stringify({ ...bornPage, idBeforeBirth }));
  //
  // // ==========================================================================
  // // E4 — THE SEAM, asserted rather than described. The Screenplay name
  // // collision is REPORTED to Nick and is his to settle; what is measured here
  // // is only that the two controls cannot be mistaken for one another in the
  // // meantime, and that neither was renamed or merged to get there.
  // // ==========================================================================
  // const seam = await app.evalJs(`(() => {
  //   const zone = document.querySelector('.wz-sliver-structure-zone');
  //   const chip = zone.querySelector('[data-page-kind="screenplay"]');
  //   const act = zone.querySelector('.wz-cascade-action');
  //   const subs = [...zone.querySelectorAll('.wz-sliver-sub')].map(s => s.textContent);
  //   return {
  //     chipText: chip ? chip.textContent : null,
  //     chipRole: chip ? chip.getAttribute('role') : null,
  //     actText: act ? act.textContent : null,
  //     actPopup: act ? act.getAttribute('aria-haspopup') : null,
  //     actRole: act ? act.getAttribute('role') : null,
  //     // The FIRST and LAST sub-labels are the seam's own pair and are asserted
  //     // by position, not by a fixed list: 'Style guide' sits between them only
  //     // while Research is chosen, and pinning the whole list would make this
  //     // check pass or fail on a state it does not care about.
  //     subs,
  //     ruleBetween: !!zone.querySelector('.wz-sliver-rule'),
  //     sameClass: !!(chip && act) && chip.className === act.className,
  //   };
  // })()`);
  // ok('E4 (seam): BOTH Screenplays stand, and NEITHER was renamed or merged — the kind chip still reads "Screenplay" and the act still reads "Convert to Screenplay…" with its dialog promise intact',
  //   seam.chipText === 'Screenplay' && seam.actText === 'Convert to Screenplay…'
  //     && seam.actPopup === 'dialog',
  //   JSON.stringify(seam));
  // ok('E4 (seam): they are told apart three ways at once — separate sub-labels naming the difference in words, different control shapes (a radio chip vs a full-width action), and a rule between them',
  //   seam.subs[0] === 'This page is' && seam.subs[seam.subs.length - 1] === 'Change the page itself'
  //     && seam.chipRole === 'radio' && seam.actRole === null
  //     && seam.sameClass === false && seam.ruleBetween === true,
  //   JSON.stringify(seam));
  //
  // // ==========================================================================
  // // E4 — THE SCOPE DECISION, measured so it cannot be a silent narrowing. The
  // // chips are PROSE DRAFT's; the framed screenplay surface passes none of the
  // // four props, so they are genuinely absent from its DOM rather than greyed.
  // // A script page has already declared what it is, and a kind row there would
  // // let a writer mark a screenplay "Normal" and then persist that. Disclosed in
  // // the offer; four props and a default if Nick wants it widened.
  // // ==========================================================================
  // await freshScriptPage(app, 1400, 900);
  // await openSliver(app);
  // await sleep(300);
  // const onScript = await app.evalJs(`(() => {
  //   const zone = document.querySelector('.wz-sliver-structure-zone');
  //   return {
  //     structureZonePresent: !!zone,
  //     kindChips: document.querySelectorAll('[data-page-kind]').length,
  //     guides: document.querySelectorAll('[data-style-guide]').length,
  //     actText: zone ? (zone.querySelector('.wz-cascade-action') || {}).textContent : null,
  //   };
  // })()`);
  // ok('E4 (scope, disclosed): the framed SCREENPLAY surface keeps its Structure zone and its conversion row, and carries NO kind chips — absent from the DOM, never greyed',
  //   onScript.structureZonePresent === true && onScript.kindChips === 0 && onScript.guides === 0
  //     && typeof onScript.actText === 'string' && onScript.actText.length > 0,
  //   JSON.stringify(onScript));
  // ----------------------------------------------------------------------
```

## Record 8 · from item83f.mjs lines 836-854 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2e059f8b836228230d706853f3c2aac6ba4bc8d

```js
  // ---- PARKED - SUPERSEDED by PAGE-TEMPLATES-MOVE (Nick's rulings, 2026-10-08): the Templates row reads Screenplay (LIVE), then Outline, Title page, Bibliography and a NEW Custom placeholder, in that order: FOUR stand-ins now,
  // not three. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  //
  // ok('E4 [Fable\'s review successor]: prose Draft carries a "Page kind" row directly below the Templates - Normal, Screenplay, Research in that order, Normal preselected, none greyed, one labelled radiogroup - and still no Structure zone',
  //   !!pk0 && pk0.heading === 'Page kind' && pk0.afterTemplates && JSON.stringify(pk0.labels) === JSON.stringify(['Normal', 'Screenplay', 'Research'])
  //     && JSON.stringify(pk0.checked) === JSON.stringify(['normal']) && pk0.anyDisabled === false && pk0.group === 'wz-page-kind-label'
  //     && e4Prose.structureZone === false && e4Prose.templates === 3, JSON.stringify({ pk0, e4Prose }));
  // ------------------------------------------------------------------
  // SUPERSEDED (item word-diet, Nick) — railPageKind reworks, "Page kind" -> "Pages Kind".
  // ok('E4 [page-templates successor]: prose Draft carries a "Page kind" row directly below the Templates - Normal, Screenplay, Research in that order, Normal preselected, none greyed, one labelled radiogroup - and still no Structure zone; the Templates hold their FOUR stand-ins',
  //   !!pk0 && pk0.heading === 'Page kind' && pk0.afterTemplates && JSON.stringify(pk0.labels) === JSON.stringify(['Normal', 'Screenplay', 'Research'])
  //     && JSON.stringify(pk0.checked) === JSON.stringify(['normal']) && pk0.anyDisabled === false && pk0.group === 'wz-page-kind-label'
  //     && e4Prose.structureZone === false && e4Prose.templates === 4, JSON.stringify({ pk0, e4Prose }));
  // ---- PARKED - SUPERSEDED by PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @ 0fc9afef, Fable Oct 16): the four grayed stand-ins retire - the Templates section is a FIVE-row picker (Blank, Screenplay, Outline, Title Page, Bibliography), none disabled, Custom dropped. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  //
  // ok('E4 [word-diet successor]: prose Draft carries a "Pages Kind" row directly below the Templates - Normal, Screenplay, Research in that order, Normal preselected, none greyed, one labelled radiogroup - and still no Structure zone; the Templates hold their FOUR stand-ins',
  //   !!pk0 && pk0.heading === 'Pages Kind' && pk0.afterTemplates && JSON.stringify(pk0.labels) === JSON.stringify(['Normal', 'Screenplay', 'Research'])
  //     && JSON.stringify(pk0.checked) === JSON.stringify(['normal']) && pk0.anyDisabled === false && pk0.group === 'wz-page-kind-label'
  //     && e4Prose.structureZone === false && e4Prose.templates === 4, JSON.stringify({ pk0, e4Prose }));
```

## Record 9 · from item83f.mjs lines 889-896 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
  // SUPERSEDED (item word-diet, Nick) — pageSetupSaveDefaults shortens to
  // "Make Default"; see the successor just below.
  // const pressedDefaults = await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-cascade-action')].find(x => x.textContent.trim() === 'Set as my default page settings'); if (!b) return false; b.click(); return true; })()");
  // await sleep(500);
  // const storedDefaults = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-page-defaults') || 'null')");
  // ok('E4 [Fable\'s review successor]: "Set as my default page settings" on that Research page saves the dress and NOT the kind or style guide',
  //   pressedDefaults === true && storedDefaults !== null && storedDefaults.kind === undefined && storedDefaults.styleGuide === undefined && storedDefaults.margins !== undefined,
  //   JSON.stringify({ pressedDefaults, storedDefaults }));
```
