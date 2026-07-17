// AB2 — the Tools by Mode (docs/wrizo-alpha/ab2-tools-by-mode-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on ab1.mjs.
// Run: node apps/desktop/scripts/harness/ab2.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
//
// FX3 (2026-07-17) — two of this file's own checks superseded: the
// typewriter toggle sheds `.wz-sliver-typewriter` (its wrapper + label)
// entirely, becoming icon-only in the sliver foot's new instruments row
// (crashed a live `.classList` read on the now-null wrapper); the script
// scroll-cap's old flat capHeight<=660px ceiling is replaced by S1's
// stage-filling height. Both parked verbatim below (SUPERSEDED); live
// successors stay in this file's own S2 DoD section (the least-disruptive
// home, per this file's own established pattern for in-place successors).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

// Land on a fresh, framed, empty manuscript page (a book project's first
// chapter) — the S1-S5 template surface (PageEditorView, prose, Draft law).
const freshProsePage = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(200);
};

const selectAllInEditor = (sel) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(range);
})()`;

// CD1 S2/S7 — the sliver's panel is CLOSED by default (opacity:0,
// pointer-events:none until the grip opens it); every check below that
// reads or clicks the hand tools now opens it first, matching what a real
// writer's hand would actually do (ToolRail's content was always-visible;
// the sliver's is reach-to-open).
const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

await withHarness(async (app) => {
  // === S1/CD1 S2 — the hand tools: per-mode registry, and only the active
  // mode's tools render (the relevance law), now inside the sliver
  // (components/Sliver.tsx) rather than always-visible in the drawer track.
  // CD1 S7 — ToolRail.tsx itself retired whole; the ORIGINAL "S1: ToolRail
  // mounts..." check is parked below (SUPERSEDED). =============================
  await freshProsePage(app);

  ok('CD1 S2/S7: the sliver grip is present on the paper\'s edge; opening it mounts the hand tools (the sliver, not ToolRail, hosts them now)',
    await app.evalJs("!!document.querySelector('.wz-sliver-grip')"));
  await openSliver(app);
  await sleep(150);
  ok('CD1 S2: opening the sliver reveals its body (.wz-sliver-body) inside the panel',
    await app.evalJs("document.querySelector('.wz-sliver-panel')?.dataset.open === 'true' && !!document.querySelector('.wz-sliver-body')"));

  // A fresh manuscript page opens in Free Write (journal mode) by default.
  // AB3 S4 — this fixture is born through a PROJECT door (CreateProject ->
  // createBinderPage), so origin:'project' now SUPPRESSES the Journal
  // furniture (ink/capture items) that AB2 asserted here unconditionally;
  // format/structure stay unconditionally-absent in Free Write mode,
  // unchanged.
  // FX1 S3 (Nick's first-sitting verdict, provisional canon note) — the
  // forward lock is no longer part of this suppressed bundle: it's mode
  // furniture now (Free Write the posture, not the Journal the place), so it
  // mounts regardless of origin. The retired AB3 claim (forward-lock
  // ABSENT here) is parked below (HARNESS_PARKED=1, quoted-history +
  // opposite-reassertion, SUPERSEDED species); ink/capture-items absence is
  // unchanged law and stays live.
  // CD1 S2/S7 — the ORIGINAL "FX1 S3" check (below, `.desk-toolrail-*`) is
  // parked below (SUPERSEDED — the class family renamed with the sliver);
  // this is its direct successor, same fixture, same truth, `.wz-sliver-*`.
  const freeWriteRail = await app.evalJs(`({
    ink: !!document.querySelector('.wz-sliver-inks'),
    forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
    captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
    format: !!document.querySelector('.wz-sliver-format'),
    structure: !!document.querySelector('.wz-sliver-structure'),
  })`);
  ok('CD1 S2 (was "FX1 S3: ..."): Free Write sliver on a PROJECT-origin page shows the forward lock PRESENT (mode furniture now) but still none of the Journal-only furniture (ink/capture items absent); format/structure stay absent too (Free Write, not Draft)',
    !freeWriteRail.ink && freeWriteRail.forwardLock
      && freeWriteRail.captureItems.length === 0
      && !freeWriteRail.format && !freeWriteRail.structure,
    JSON.stringify(freeWriteRail));

  // -- PAGE IS PRIMARY across a mode switch, rail POPULATED this time (AB1
  // proved this with an empty/reserved rail; AB2 re-proves it with real
  // content swapping in the SAME fixed-width track). -------------------------
  const railRectBefore = await app.evalJs(rectOf('.desk-frame-toolrail'));
  const pageRectBefore = await app.evalJs(rectOf('.mode-pagecol'));

  // ab2.1 F2 — rendered-geometry sanity: presence checks prove mounting,
  // this proves composition has a floor. This exact class of bug (a lost
  // width context collapsing the writing surface to fit-content) is what
  // slipped through AB2 on JournalEntry (ab2.1 F1) — cheap to catch here,
  // transition-independent, covering every framed surface, not just the
  // one that broke.
  ok('F2 geometry: framed prose page column renders a sane width [600,800]',
    pageRectBefore.width >= 600 && pageRectBefore.width <= 800, JSON.stringify(pageRectBefore));

  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(150);

  // CD1 S2/S7 — the ORIGINAL "S1/S3/S4: Draft rail..." check (`.desk-
  // toolrail-*`) is parked below (SUPERSEDED); the sliver's `open` state
  // survives a mode switch (no remount — same component, new props), so no
  // re-open is needed here.
  const draftRail = await app.evalJs(`({
    ink: !!document.querySelector('.wz-sliver-inks'),
    captureItems: document.querySelectorAll('.wz-sliver-item').length,
    format: !!document.querySelector('.wz-sliver-format'),
    structure: !!document.querySelector('.wz-sliver-structure'),
    formatButtons: [...document.querySelectorAll('.wz-sliver-format .mode-tbtn')].map(b => b.title),
    structureLabels: [...document.querySelectorAll('.wz-sliver-structure-btn')].map(b => b.textContent),
  })`);
  ok('CD1 S2 (was "S1/S3/S4: Draft rail..."): Draft sliver shows Bold/Italic/Heading/Spacing + the Structure picker, and ONLY those (no ink, no capture items)',
    !draftRail.ink && draftRail.captureItems === 0 && draftRail.format && draftRail.structure
      && JSON.stringify(draftRail.formatButtons) === JSON.stringify(['Bold', 'Italic', 'Heading', 'Spacing'])
      && JSON.stringify(draftRail.structureLabels) === JSON.stringify(['Prose', 'Screenplay']),
    JSON.stringify(draftRail));

  const railRectAfter = await app.evalJs(rectOf('.desk-frame-toolrail'));
  const pageRectAfter = await app.evalJs(rectOf('.mode-pagecol'));
  ok('PAGE IS PRIMARY: the tool-rail track rect is byte-identical across a mode switch, even though its CONTENTS changed',
    JSON.stringify(railRectBefore) === JSON.stringify(railRectAfter), `${JSON.stringify(railRectBefore)} -> ${JSON.stringify(railRectAfter)}`);
  ok('PAGE IS PRIMARY: the page rect is byte-identical across a mode switch with the rail populated',
    JSON.stringify(pageRectBefore) === JSON.stringify(pageRectAfter), `${JSON.stringify(pageRectBefore)} -> ${JSON.stringify(pageRectAfter)}`);

  // === S3 — Bold writes ** conventions into entry.text (the storage ruling
  // proven at the seam) + the iA register decorates it. ======================
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('plain words');
  await sleep(100);
  await app.evalJs(selectAllInEditor('.forward-only-editor'));
  await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]').click()");
  await sleep(100);
  const boldedDom = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S3: Bold wraps the selection in ** conventions in the live DOM', boldedDom === '**plain words**', boldedDom);
  ok('S3: the iA register renders the marks dimmed and the effect live (md-bold + md-mark present)',
    await app.evalJs("!!document.querySelector('.forward-only-editor .md-bold') && !!document.querySelector('.forward-only-editor .md-mark')"));

  await sleep(2300); // past AUTOSAVE_MS
  const entriesAfterBold = await app.localJSON('writer-studio-journal-entries');
  const proseEntry = (entriesAfterBold || []).find(e => !e.deletedAt && e.text && e.text.includes('plain words'));
  ok('S0/S3: the ** convention is what actually lands in entry.text (zero schema, one source of truth)',
    !!proseEntry && proseEntry.text.includes('**plain words**'), proseEntry && proseEntry.text);

  // === S4 — the Structure picker: prose -> screenplay, mechanical only,
  // confirmation gates a non-empty page, empty pages switch free. ============
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
  await sleep(150);
  ok('S4: a non-empty page requesting Screenplay shows the confirmation (gated, does not act yet)',
    await app.evalJs("!!document.querySelector('.structure-confirm-modal')"));
  await app.evalJs("[...document.querySelectorAll('.structure-confirm-modal button')].find(b => b.textContent === 'Cancel').click()");
  await sleep(150);
  ok('S4: after Cancel, the surface is still prose (forward-only-editor present, no script-sheet)',
    await app.evalJs("!!document.querySelector('.forward-only-editor') && !document.querySelector('.script-sheet')"));

  await app.evalJs("[...document.querySelectorAll('.wz-sliver-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
  await sleep(150);
  await app.evalJs("document.querySelector('.structure-confirm-screenplay').click()");
  await sleep(300);
  ok('S4: Convert produces a script surface (script-sheet mounts, forward-only-editor is gone)',
    await app.evalJs("!!document.querySelector('.script-sheet') && !document.querySelector('.forward-only-editor')"));
  const scriptRect = await app.evalJs(rectOf('.script-sheet'));
  ok('F2 geometry: framed script sheet renders a sane width (>=400)', scriptRect.width >= 400, JSON.stringify(scriptRect));
  const convertedElements = await app.evalJs("[...document.querySelectorAll('.script-el')].map(e => ({ type: e.dataset.type, text: (e.textContent||'').trim() }))");
  ok('S4: the mechanical mapping produced action elements matching the source paragraph verbatim (including its ** conventions — mechanical only, nothing stripped)',
    Array.isArray(convertedElements) && convertedElements.some(e => e.type === 'action' && e.text === '**plain words**'),
    JSON.stringify(convertedElements));

  // -- S4: an EMPTY page switches structure for free (no confirmation). ------
  // CD1 S2 — a fresh page mounts a fresh (closed) sliver; open it before
  // reaching for the structure picker inside it.
  await freshProsePage(app);
  await openSliver(app);
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(100);
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
  await sleep(300);
  const emptySwitchState = await app.evalJs(`({
    modal: !!document.querySelector('.structure-confirm-modal'),
    scriptSheet: !!document.querySelector('.script-sheet'),
  })`);
  ok('S4: empty-page structure switch is free — no modal, conversion happened immediately',
    !emptySwitchState.modal && emptySwitchState.scriptSheet, JSON.stringify(emptySwitchState));

  // -- S4: Screenplay -> Prose carries a one-way warning before acting. ------
  // Type the scene heading (auto-uppercases — UPPERCASE_TYPES, unrelated to
  // this check) then Enter into a fresh action element before typing the
  // line this check actually verifies, so the "verbatim" claim below isn't
  // confounded by the heading's own case-forcing.
  // CD1 S7 — the empty-page conversion above forced a remount into
  // ScriptEditor (a different component tree); its OWN sliver mounts fresh
  // (closed) — open it before reaching for the structure picker again.
  await openSliver(app);
  await sleep(150);
  await app.evalJs("document.querySelector('.script-el-active').focus()");
  await app.typeKeys('int. office - day');
  await app.key('Enter');
  await app.typeKeys('A line of action.');
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-structure-btn')].find(b => b.textContent === 'Prose').click()");
  await sleep(150);
  ok('S4: a non-empty script requesting Prose shows the one-way warning (gated)',
    await app.evalJs("!!document.querySelector('.structure-confirm-modal') && document.body.innerText.includes('one-way')"));
  await app.evalJs("document.querySelector('.structure-confirm-prose').click()");
  await sleep(300);
  const proseAdopted = await app.evalJs(`({
    hasEditor: !!document.querySelector('.forward-only-editor'),
    text: document.querySelector('.forward-only-editor')?.innerText ?? '',
  })`);
  ok('S4: Screenplay -> Prose adopts entry.text (the derived shadow) as the prose rendering, verbatim',
    proseAdopted.hasEditor && proseAdopted.text.includes('A line of action.'), JSON.stringify(proseAdopted));

  // === S2 — the forward lock: an explicit persisted toggle, default ON
  // (today's shipped Free Write behavior), OFF swaps to a real erase. ========
  // AB3 S4 (original rationale, now stale post-FX1 S3 — kept for the record):
  // freshProsePage's fixture was project-origin, so the RAIL TOGGLE no longer
  // mounted here; the setting was toggled directly via its own localStorage
  // key instead of clicking a rail control that was correctly absent for
  // this fixture. FX1 S3 makes the forward lock mode furniture (mounts
  // regardless of origin), so the rail control DOES mount here again now
  // (see this file's own "FX1 S3: ..." check above) — but this S2 block
  // still exercises the underlying strike/erase MECHANIC
  // (store/forwardOnly.ts) directly via localStorage, which remains a valid,
  // origin-independent proof either way. The rail-toggle-specific assertions
  // this replaces are parked below (HARNESS_PARKED=1); ab3.mjs's own
  // journal-origin fixture proves the rail toggle itself still works where
  // it belongs.
  await freshProsePage(app);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('ab');
  await sleep(100);
  await app.key('Backspace');
  await sleep(100);
  const strikeDefault = await app.evalJs("!!document.querySelector('.forward-only-editor .fo-struck')");
  ok('S2: forward lock defaults ON — a backspace STRIKES (today\'s shipped Free Write behavior, unchanged)', strikeDefault);

  await app.evalJs("localStorage.setItem('wrizo-forward-lock', '0')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor after forward-lock-off reload' });
  await sleep(200);

  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('cd');
  await sleep(100);
  const beforeErase = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  await app.key('Backspace'); // the backspace-past-boundary probe
  await sleep(100);
  const afterErase = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S2: forward lock OFF — the SAME backspace now really erases (a real erase probe, not a strike)',
    afterErase === beforeErase.slice(0, -1), `${JSON.stringify(beforeErase)} -> ${JSON.stringify(afterErase)}`);

  const forwardLockPersisted = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
  ok('S2: the forward-lock setting persists (localStorage) across the reload that applied it', forwardLockPersisted === '0', forwardLockPersisted);

  // === S5 — copy-out comes home to Publish: both actions present, payloads
  // differ correctly. =========================================================
  await freshProsePage(app);
  await openSliver(app); // CD1 S2 — fresh mount, fresh (closed) sliver
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(100);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('hello');
  await sleep(100);
  await app.evalJs(selectAllInEditor('.forward-only-editor'));
  await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]').click()");
  await sleep(100);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Publish').click()");
  await sleep(150);
  const publishButtons = await app.evalJs(`({
    words: !!document.querySelector('.publish-copy-words'),
    formatted: !!document.querySelector('.publish-copy-formatted'),
  })`);
  ok('S5: Publish carries both Copy My Words and Copy Formatted', publishButtons.words && publishButtons.formatted, JSON.stringify(publishButtons));

  await app.evalJs("document.querySelector('.publish-copy-formatted').click()");
  await sleep(50);
  const formattedCopy = await app.evalJs('window.__wzLastCopy');
  await app.evalJs("document.querySelector('.publish-copy-words').click()");
  await sleep(50);
  const wordsCopy = await app.evalJs('window.__wzLastCopy');
  ok('S5: Copy Formatted carries the ** conventions; Copy My Words strips them — the payloads differ correctly',
    formattedCopy === '**hello**' && wordsCopy === 'hello' && formattedCopy !== wordsCopy,
    JSON.stringify({ formattedCopy, wordsCopy }));

  // === S5 (script) — "Copy Formatted" reuses the existing copy-script-text
  // rendering; "Copy My Words" is its honest, convention-free inverse. =======
  // This page already carries "**hello**" from the prose check above, so the
  // Structure picker's confirmation gate fires — click through it.
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
  await sleep(150);
  await app.evalJs("document.querySelector('.structure-confirm-screenplay')?.click()");
  await sleep(300);
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'script surface after S5 conversion' });
  await app.evalJs("document.querySelector('.script-el-active').focus()");
  await app.typeKeys('int. office - day');
  await app.key('Enter');
  await app.typeKeys('She sits.');
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Publish').click()");
  await sleep(150);
  await app.evalJs("document.querySelector('.publish-copy-formatted').click()");
  await sleep(50);
  const scriptFormatted = await app.evalJs('window.__wzLastCopy');
  await app.evalJs("document.querySelector('.publish-copy-words').click()");
  await sleep(50);
  const scriptWords = await app.evalJs('window.__wzLastCopy');
  ok('S5 (script): Copy Formatted (scene heading UPPERCASE, blank-line separated) differs from Copy My Words (plain, tight-joined)',
    scriptFormatted.includes('INT. OFFICE - DAY') && scriptFormatted.includes('\n\n') && scriptFormatted !== scriptWords,
    JSON.stringify({ scriptFormatted, scriptWords }));

  // === S2 DoD — the typewriter reaches the script surface's Draft posture
  // through the sliver; its hold-band respects the containment fix. CD1 S7
  // — this ScriptEditor mounted fresh at the Screenplay conversion just
  // above (a full component swap, new closed sliver) — open it first. =====
  await openSliver(app);
  await sleep(150);
  // FX3 S5 — "`.wz-sliver-typewriter` now" (this file's own CD1 S2 note,
  // itself already one layer of history) is retired a second time here
  // (parked below, SUPERSEDED): the toggle sheds its wrapper AND label
  // entirely, becoming icon-only in the sliver foot's new instruments row
  // (`.wz-sliver-instruments-row`, components/Sliver.tsx) — a `null`
  // `.classList` read crashed this whole file. Same underlying truth (the
  // toggle is present on the script surface and reflects the persisted
  // setting), asserted fresh against the CURRENT selector.
  ok('FX3 S5 (was "CD1 S2: ...in the sliver..."): the typewriter toggle is present on the script surface (now icon-only, sliver foot)', await app.evalJs("!!document.querySelector('.wz-sliver-instruments-row .typewriter-toggle')"));
  const scriptTypewriterOn = await app.evalJs("document.querySelector('.wz-sliver-instruments-row .typewriter-toggle').classList.contains('on')");
  ok('S2 DoD: the typewriter defaults on (the persisted setting, honored on the script surface too)', scriptTypewriterOn === true);

  const longScene = Array.from({ length: 18 }, (_, i) => `Action line ${i} overflows the sheet, respecting the cap.`);
  for (const line of longScene) {
    await app.typeKeys(line);
    await app.key('Enter');
  }
  await sleep(200);
  const typewriterVsContainment = await app.evalJs(`(() => {
    const cap = document.querySelector('.desk-frame-scroll-cap');
    return {
      capHeight: cap.getBoundingClientRect().height,
      overflowed: cap.scrollHeight > cap.clientHeight,
      typewriter: cap.dataset.typewriter,
      bodyScrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  })()`);
  // FX3 S1 — "capHeight <= 660" clause retired here (parked below,
  // SUPERSEDED): S1 deliberately replaces the scroll-cap's old flat
  // height:min(64vh,620px) with a stage-filling height ("no height cap
  // short of the stage"), so capHeight is now ~733px, past 660 by design.
  // The REST of this check's own claim — the cap still stays BOUNDED
  // (just by the stage now, not a flat ceiling), content still scrolls
  // INSIDE it, typewriter is still engaged, and the document itself still
  // never grows to swallow the overflow — is untouched and still asserted
  // live here.
  ok('S2 DoD: the typewriter and the containment fix do not fight — the cap still scrolls content inside it (not the whole page), typewriter engaged',
    typewriterVsContainment.overflowed === true
      && typewriterVsContainment.typewriter === 'true'
      && typewriterVsContainment.bodyScrollHeight <= typewriterVsContainment.viewportHeight + 40,
    JSON.stringify(typewriterVsContainment));

  // === S7 — the strip quiets: no brass on the active tab, the olive
  // hairline is present, uppercase render vs title-case textContent. ========
  const stripState = await app.evalJs(`(() => {
    const active = document.querySelector('.desk-mode-tab.active');
    const cs = getComputedStyle(active);
    return {
      textContent: active.textContent,
      backgroundColor: cs.backgroundColor,
      borderBottomColor: cs.borderBottomColor,
      textTransform: cs.textTransform,
    };
  })()`);
  ok('S7: the active mode tab carries NO brass background (computed-style check)',
    stripState.backgroundColor !== 'rgb(255, 152, 0)', JSON.stringify(stripState));
  ok('S7: the active mode tab carries the olive hairline (--accent-rest, working value #96a05a = rgb(150, 160, 90))',
    stripState.borderBottomColor === 'rgb(150, 160, 90)', JSON.stringify(stripState));
  ok('S7: the strip renders uppercase (CSS text-transform) while the ratified title-case string stays in textContent',
    stripState.textTransform === 'uppercase' && /^[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(stripState.textContent),
    JSON.stringify(stripState));
  const allStripLabels = await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].map(b => b.textContent)");
  ok('S7: the strip\'s DOM textContent stays the ratified title case for every tab (deskLexicon untouched)',
    JSON.stringify(allStripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']),
    JSON.stringify(allStripLabels));

  // === S6 — the Journal's page enters the frame (the R2 ruling). ============
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before Journal fixture' });
  await app.emulateDpr(1, 1400, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'ab2-journal', text: '', projectId: null, source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after Journal seed' });
  await app.evalJs("location.hash = '#/journal/ab2-journal'");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'JournalEntry framed' });
  await sleep(200);
  // CD1 S2 — a fresh JournalEntry mount, fresh (closed) sliver.
  await openSliver(app);
  await sleep(150);

  const journalFramed = await app.evalJs(`({
    deskFrame: !!document.querySelector('.desk-frame'),
    strip: [...document.querySelectorAll('.desk-mode-tab')].map(b => b.textContent),
    legacyTabsGone: !document.querySelector('.journal-modes'),
    captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
    corkboardItems: document.querySelectorAll('.desk-corkboard-item').length,
    inkPresent: !!document.querySelector('.entry-full .ink-canvas'),
    // AB3 S3 — the below-page metadata cluster (the <h1> title among it)
    // unmounts entirely when framed, superseded by the Page face. The
    // retired "keeps its below-the-page position" claim is parked below
    // (HARNESS_PARKED=1); ab3.mjs asserts the Page face's own presence.
    metadataAbsent: !document.querySelector('.entry-full ~ h1, h1'),
  })`);
  ok('S6: JournalEntry mounts inside DeskFrame at >=1100px', journalFramed.deskFrame);
  ok('S6: the unified mode strip is present, five ratified strings', JSON.stringify(journalFramed.strip) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']), JSON.stringify(journalFramed.strip));
  ok('S6: the legacy tab row does NOT mount when framed (superseded, not deleted)', journalFramed.legacyTabsGone);
  ok('CD1 S2 (was "S6: capture items are in the rail..."): capture items are in the sliver now (their ruled final home, post-CD1)', JSON.stringify(journalFramed.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']), JSON.stringify(journalFramed.captureItems));
  ok('S6: the interim corkboard Journal tab is retired (no .desk-corkboard-item anywhere)', journalFramed.corkboardItems === 0);
  ok('S6: the ink layer (canvas) is present — the sheet mounts editor core untouched', journalFramed.inkPresent);
  ok('AB3 S3: the below-page metadata cluster (title/star/tags) is entirely absent when framed — no <h1> anywhere (superseded by the Page face)', journalFramed.metadataAbsent);

  // ab2.1 F1/F2 — the paper lost its width source in the original S6 patch
  // (a lone `alignItems:'center'` collapsed it to an ~80px fit-content
  // sliver on an empty page). Fixed in F1; this is the permanent regression
  // guard for that exact class of bug.
  const journalPaperRect = await app.evalJs(rectOf('.paper-page.entry-full'));
  ok('F2 geometry: framed Journal paper renders a sane width [600,760]',
    journalPaperRect.width >= 600 && journalPaperRect.width <= 760, JSON.stringify(journalPaperRect));

  // ab2.1 F3 — Plateau foundations §3/§5 (olive marks where you are; orange
  // marks what you do): DeskRail's active-place indicator used to be a
  // where-you-are-at-rest marker here. CD1 S4 — DeskRail no longer mounts
  // on this (framed) route at all, so there is no active rail item's color
  // left to read (getComputedStyle on a null selector would throw, not
  // fail gracefully). The ORIGINAL check is parked below (SUPERSEDED); its
  // successor reinforces S4 directly on this same fixture — the drawer's
  // own olive-active-pull law is ab3.mjs's territory (R3), not re-proven
  // here.
  const railGoneOnJournal = await app.evalJs("!document.querySelector('.desk-rail')");
  ok('CD1 S4 (was "F3: DeskRail\'s active item is not brass..."): DeskRail (.desk-rail) does not mount on the framed Journal route either',
    railGoneOnJournal === true, String(railGoneOnJournal));

  // -- S6: below the gate, legacy JSX is untouched (byte-identical). --------
  await app.emulateDpr(1, 900, 900);
  await sleep(200);
  const journalLegacy = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    legacyTabs: !!document.querySelector('.journal-modes'),
  })`);
  ok('S6: below 1100px, DeskFrame does not mount and the legacy tab row is back (non-goal — mobile untouched)',
    journalLegacy.deskFrameGone && journalLegacy.legacyTabs, JSON.stringify(journalLegacy));

  // === ab2.1 F2 — the fourth framed surface: Board. AB2 never wired a
  // Board fixture (it doesn't get rail content or a mode strip), but F2
  // asks the geometry-sanity sweep to cover every framed writing surface,
  // not just the ones that broke. Fixture pattern matches ab1.mjs's own
  // board seed. ================================================================
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before Board fixture' });
  await app.emulateDpr(1, 1400, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'ab2-board', text: '', pageType: 'board', boxes: [
      { id: 'ab2-board-box', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'hello' },
    ], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after Board seed' });
  await app.evalJs("location.hash = '#/page/ab2-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Board framed' });
  await sleep(200);
  const boardRect = await app.evalJs(rectOf('.board-canvas-wrap'));
  ok('F2 geometry: framed board canvas wrapper renders a sane width (>=400)', boardRect.width >= 400, JSON.stringify(boardRect));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED (S8) — gated behind HARNESS_PARKED=1, skipped by default. ======
// AB2 itself never widened the gate — this scaffold sat empty until AB3
// (docs/wrizo-alpha/ab3-drawer-and-homes-brief.md S7) became the first real
// tenant: three checks AB3's origin-gating and Page-face design supersede,
// moved here rather than deleted (parked != deleted). Per the AB2 review's
// A4, the two parked species named explicitly: every check below is the
// SUPERSEDED species (quoted verbatim from its ORIGINAL AB2 form, then
// re-asserted against its NEW, opposite truth) — none are DORMANT (a check
// temporarily unmountable but expected to re-arm unchanged; this file has
// none of those). Successor assertions for the rail's real (journal-origin)
// contents and the Page face's own presence live in ab3.mjs, not here.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await freshProsePage(app);
    // CD1 S2/S7 — every `.desk-toolrail-*` selector below is updated to its
    // `.wz-sliver-*` successor (ToolRail's class family moved whole with
    // it, mechanically — the historical commentary chains below are
    // otherwise untouched); the sliver mounts closed, so it needs opening
    // before its content can be read.
    await openSliver(app);
    await sleep(150);

    // ORIGINAL (AB2 S1/S2): ok('S1/S2: Free Write rail shows ink + forward
    // lock + capture items, and ONLY those', freeWriteRail.ink &&
    // freeWriteRail.forwardLock && JSON.stringify(freeWriteRail.
    // captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send →
    // Drawer']) && !freeWriteRail.format && !freeWriteRail.structure, ...);
    // AB3 S4 (superseded once already): this fixture (CreateProject ->
    // createBinderPage) went PROJECT-origin; the furniture that check
    // assumed unconditional was gone, so AB3 re-asserted here as
    // `!freeWriteRailNow.ink && !freeWriteRailNow.forwardLock &&
    // freeWriteRailNow.captureItems.length === 0` — none of it mounts.
    // FX1 S3 (Nick's first-sitting verdict, provisional canon note) —
    // supersedes AB3's OWN re-assertion in turn: the forward lock splits off
    // to become mode furniture (mounts regardless of origin); ink/capture
    // items are unchanged AB3 law and stay absent. Live equivalent asserted
    // in this file's own unparked S1 block now, on the same fixture.
    const freeWriteRailNow = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
      captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
    })`);
    pok('PARKED (was "S1/S2: Free Write rail shows ink + forward lock + capture items, and ONLY those", then AB3-superseded to "...shows NONE of it") — FX1 S3 re-supersedes AB3\'s own re-assertion: forward lock is back (mode furniture), ink/capture items stay absent (then CD1 S2/S7\'s class rename: .desk-toolrail-* -> .wz-sliver-*, same truth, mechanics only)',
      !freeWriteRailNow.ink && freeWriteRailNow.forwardLock && freeWriteRailNow.captureItems.length === 0,
      JSON.stringify(freeWriteRailNow));

    // ORIGINAL (AB3 S4, live in this file's own unparked S1 block — never
    // previously parked, unlike the AB2-era entry just above): ok('AB3 S4:
    // Free Write rail on a PROJECT-origin page shows none of the Journal
    // furniture (ink/forward-lock/capture items absent); format/structure
    // stay absent too (Free Write, not Draft)', !freeWriteRail.ink &&
    // !freeWriteRail.forwardLock && freeWriteRail.captureItems.length === 0
    // && !freeWriteRail.format && !freeWriteRail.structure,
    // JSON.stringify(freeWriteRail));
    // FX1 S3 (Nick's first-sitting verdict, provisional canon note) —
    // supersedes this AB3-authored live check directly: the forward lock
    // splits off to become mode furniture (mounts regardless of origin);
    // ink/capture items AND format/structure absence are unchanged AB3 law.
    // The live opposite-truth successor is asserted in this file's own
    // unparked S1 block now (named "FX1 S3: ..."), on the same fixture.
    const freeWriteRailFull = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
      captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
      format: !!document.querySelector('.wz-sliver-format'),
      structure: !!document.querySelector('.wz-sliver-structure'),
    })`);
    pok('PARKED (was "AB3 S4: Free Write rail on a PROJECT-origin page shows none of the Journal furniture (ink/forward-lock/capture items absent); format/structure stay absent too (Free Write, not Draft)") — FX1 S3: the forward lock is present (mode furniture); ink/capture items and format/structure stay absent (then CD1 S2/S7\'s class rename: .desk-toolrail-* -> .wz-sliver-*, same truth, mechanics only)',
      !freeWriteRailFull.ink && freeWriteRailFull.forwardLock && freeWriteRailFull.captureItems.length === 0
        && !freeWriteRailFull.format && !freeWriteRailFull.structure,
      JSON.stringify(freeWriteRailFull));

    // ORIGINAL (AB2 S2): ok('S2: the rail toggle flips to off',
    // lockOffState === 'false', lockOffState); ok('S2: the forward-lock
    // setting is honored on reload (rail shows off, not reset to the
    // default)', forwardLockAfterReload === 'false', forwardLockAfterReload);
    // AB3 S4 (superseded once already): the rail toggle these checks
    // clicked/read no longer mounted for a project-origin page at all (same
    // origin-gating), re-asserted here as `forwardLockRailGone === true`.
    // FX1 S3 — supersedes that re-assertion too: the control mounts again
    // for a project-origin page (mode furniture, not journal furniture). The
    // mechanic itself (localStorage-driven, reload-honored) is still proven
    // live in ab2.mjs's own unparked S2 block, unaffected either way.
    const forwardLockRailPresent = await app.evalJs("!!document.querySelector('.wz-sliver-forwardlock')");
    pok('PARKED (was "S2: the rail toggle flips to off" + "...is honored on reload", then AB3-superseded to "...control does not mount at all") — FX1 S3 re-supersedes AB3\'s own re-assertion: the forward-lock rail control mounts again for a project-origin page (then CD1 S2/S7\'s class rename: .desk-toolrail-* -> .wz-sliver-*, same truth, mechanics only)',
      forwardLockRailPresent === true);

    // === S6 fixture — a fresh Journal entry, framed. =========================
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before Journal fixture (PARKED)' });
    await app.emulateDpr(1, 1400, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'ab2-journal-parked', text: '', projectId: null, source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after Journal seed (PARKED)' });
    await app.evalJs("location.hash = '#/journal/ab2-journal-parked'");
    await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'JournalEntry framed (PARKED)' });
    await sleep(200);

    // ORIGINAL (AB2 S6): ok('S6: the metadata/star band keeps its below-
    // the-page position inside the stage column', metadataBelow.ok, ...);
    // (metadataBelow computed h1Rect.top > sheetRect.bottom - 5 — the title
    // rendered BELOW the paper, inside the frame.)
    // AB3 S3 — the whole cluster (including that <h1>) unmounts entirely
    // when framed, superseded by the Page face; there is no h1 to measure.
    const metadataGoneNow = await app.evalJs(`(() => {
      const sheet = document.querySelector('.entry-full');
      return { hasSheet: !!sheet, hasH1: !!document.querySelector('h1') };
    })()`);
    pok('PARKED (was "S6: the metadata/star band keeps its below-the-page position inside the stage column") — AB3 S3: the sheet mounts, but the metadata band (and its <h1>) is gone entirely when framed',
      metadataGoneNow.hasSheet === true && metadataGoneNow.hasH1 === false,
      JSON.stringify(metadataGoneNow));

    // === CD1 S7 — ToolRail.tsx itself retires whole; the sliver
    // (components/Sliver.tsx) hosts its content now. Six checks this
    // ticket's S2/S7 design supersedes, moved here rather than deleted. ====
    await freshProsePage(app);
    await openSliver(app);
    await sleep(150);

    // ORIGINAL (S1): ok('S1: ToolRail mounts into the reserved tool-rail
    // track', await app.evalJs("!!document.querySelector('.desk-frame-
    // toolrail .desk-toolrail-body')"));
    // CD1 S7 — ToolRail.tsx is deleted; the sliver (an overlay anchored
    // inside .desk-frame-stage, NOT the tool-rail track) hosts the hand
    // tools now. Live successor asserted in this file's own S1 section.
    const toolRailGoneNow = await app.evalJs("!document.querySelector('.desk-toolrail-body')");
    pok('PARKED (was "S1: ToolRail mounts into the reserved tool-rail track") — CD1 S7: ToolRail.tsx is deleted; .desk-toolrail-body does not exist anywhere',
      toolRailGoneNow === true, String(toolRailGoneNow));

    // ORIGINAL (FX1 S3, before this file's own CD1 rename): ok('FX1 S3:
    // Free Write rail on a PROJECT-origin page shows the forward lock
    // PRESENT (mode furniture now) but still none of the Journal-only
    // furniture (ink/capture items absent); format/structure stay absent
    // too (Free Write, not Draft)', !freeWriteRail.ink &&
    // freeWriteRail.forwardLock && freeWriteRail.captureItems.length === 0
    // && !freeWriteRail.format && !freeWriteRail.structure, ...); — read
    // `.desk-toolrail-inks` / `.desk-toolrail-forwardlock` /
    // `.desk-toolrail-item` / `.desk-toolrail-format` /
    // `.desk-toolrail-structure`.
    // CD1 S2/S7 — same truth, same fixture, `.wz-sliver-*` now (the class
    // family moved whole with the sliver). Live successor in this file's
    // own S1 section (named "CD1 S2 (was \"FX1 S3: ...\")").
    const freeWriteRailClassRenameCheck = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
      captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
      format: !!document.querySelector('.wz-sliver-format'),
      structure: !!document.querySelector('.wz-sliver-structure'),
    })`);
    pok('PARKED (was "FX1 S3: Free Write rail on a PROJECT-origin page shows the forward lock PRESENT...") — CD1 S2/S7: same truth, .wz-sliver-* selectors (ToolRail\'s class family renamed with its retirement)',
      !freeWriteRailClassRenameCheck.ink && freeWriteRailClassRenameCheck.forwardLock
        && freeWriteRailClassRenameCheck.captureItems.length === 0
        && !freeWriteRailClassRenameCheck.format && !freeWriteRailClassRenameCheck.structure,
      JSON.stringify(freeWriteRailClassRenameCheck));

    // ORIGINAL (S1/S3/S4): ok('S1/S3/S4: Draft rail shows Bold/Italic/
    // Heading/Spacing + the Structure picker, and ONLY those (no ink, no
    // capture items)', !draftRail.ink && draftRail.captureItems === 0 &&
    // draftRail.format && draftRail.structure && ... — read
    // `.desk-toolrail-inks` / `.desk-toolrail-item` / `.desk-toolrail-
    // format` / `.desk-toolrail-structure` / `.desk-toolrail-format
    // .mode-tbtn` / `.desk-toolrail-structure-btn`.
    // CD1 S2/S7 — same truth, `.wz-sliver-*` now. Live successor in this
    // file's own S1 section.
    await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
    await sleep(150);
    const draftRailClassRenameCheck = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      captureItems: document.querySelectorAll('.wz-sliver-item').length,
      format: !!document.querySelector('.wz-sliver-format'),
      structure: !!document.querySelector('.wz-sliver-structure'),
      formatButtons: [...document.querySelectorAll('.wz-sliver-format .mode-tbtn')].map(b => b.title),
      structureLabels: [...document.querySelectorAll('.wz-sliver-structure-btn')].map(b => b.textContent),
    })`);
    pok('PARKED (was "S1/S3/S4: Draft rail shows Bold/Italic/Heading/Spacing + the Structure picker, and ONLY those...") — CD1 S2/S7: same truth, .wz-sliver-* selectors',
      !draftRailClassRenameCheck.ink && draftRailClassRenameCheck.captureItems === 0
        && draftRailClassRenameCheck.format && draftRailClassRenameCheck.structure
        && JSON.stringify(draftRailClassRenameCheck.formatButtons) === JSON.stringify(['Bold', 'Italic', 'Heading', 'Spacing'])
        && JSON.stringify(draftRailClassRenameCheck.structureLabels) === JSON.stringify(['Prose', 'Screenplay']),
      JSON.stringify(draftRailClassRenameCheck));

    // ORIGINAL (S6): ok('S6: capture items are in the rail (their ruled
    // final home)', JSON.stringify(journalFramed.captureItems) ===
    // JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']), ...); —
    // read `.desk-toolrail-item` inside a fresh, framed JournalEntry.
    // CD1 S2/S7 — capture items' "ruled final home" moves again, from
    // ToolRail's rail track to the sliver. Live successor in this file's
    // own S6 section.
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before Journal fixture (PARKED capture items)' });
    await app.emulateDpr(1, 1400, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'ab2-journal-parked-capture', text: '', projectId: null, source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after Journal seed (PARKED capture items)' });
    await app.evalJs("location.hash = '#/journal/ab2-journal-parked-capture'");
    await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'JournalEntry framed (PARKED capture items)' });
    await sleep(200);
    await openSliver(app);
    await sleep(150);
    const captureItemsInSliverNow = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent)");
    pok('PARKED (was "S6: capture items are in the rail (their ruled final home)") — CD1 S2/S7: capture items are in the sliver now, same three items',
      JSON.stringify(captureItemsInSliverNow) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']),
      JSON.stringify(captureItemsInSliverNow));

    // ORIGINAL (S2 DoD): ok('S2 DoD: the typewriter toggle is present in
    // the rail on the script surface', await app.evalJs("!!document.
    // querySelector('.desk-toolrail-typewriter .typewriter-toggle')"));
    // CD1 S2/S7 — same truth, `.wz-sliver-typewriter` next.
    // FX3 S5 (amended 2026-07-17) — `.wz-sliver-typewriter` itself retires:
    // the toggle sheds its wrapper and label, becoming icon-only in the
    // sliver foot's new instruments row. Same truth a third time,
    // `.wz-sliver-instruments-row` now. Live successor in this file's own
    // S2 DoD section.
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before script fixture (PARKED typewriter)' });
    await app.emulateDpr(1, 1400, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'ab2-script-parked-typewriter', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: 's1', heading: { id: 's1', t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed (PARKED typewriter)' });
    await app.evalJs("location.hash = '#/page/ab2-script-parked-typewriter'");
    await app.waitFor("!!document.querySelector('.script-sheet')", { label: 'Script framed (PARKED typewriter)' });
    await sleep(200);
    await openSliver(app);
    await sleep(150);
    const typewriterInSliverNow = await app.evalJs("!!document.querySelector('.wz-sliver-instruments-row .typewriter-toggle')");
    pok('PARKED (was "S2 DoD: the typewriter toggle is present in the rail on the script surface") — CD1 S2/S7 moved it to the sliver, FX3 S5 moved it again (icon-only, sliver foot) — present there now',
      typewriterInSliverNow === true, String(typewriterInSliverNow));

    // ORIGINAL (S2 DoD, live section): ok('S2 DoD: the typewriter and the
    // containment fix do not fight — the cap stays bounded, content
    // scrolls inside it, typewriter engaged', typewriterVsContainment.
    // capHeight <= 660 && ...other clauses..., ...);
    // FX3 S1 — the scroll-cap's old flat height:min(64vh,620px) cap is
    // replaced by a stage-filling height; capHeight is now ~733px at this
    // fixture's viewport, past the retired 660px ceiling by design. The
    // OTHER clauses (still scrolls internally, typewriter engaged, document
    // doesn't grow to swallow the overflow) remain live in this file's own
    // S2 DoD section — only the flat-ceiling clause is parked here.
    await app.evalJs("document.querySelector('.script-el-active').focus()");
    const overflowLinesParked = Array.from({ length: 18 }, (_, i) => `Overflow probe line ${i}.`);
    for (const line of overflowLinesParked) {
      await app.typeKeys(line);
      await app.key('Enter');
    }
    await sleep(200);
    const capHeightNow = await app.evalJs(`(() => {
      const cap = document.querySelector('.desk-frame-scroll-cap');
      const stage = document.querySelector('.desk-frame-stage');
      return { capHeight: cap.getBoundingClientRect().height, stageHeight: stage.getBoundingClientRect().height };
    })()`);
    pok('PARKED (was "S2 DoD: ...the cap stays bounded..." asserting a flat capHeight<=660px ceiling) — FX3 S1: the cap is now bounded by the STAGE\'s own height instead',
      capHeightNow.capHeight > 660 && Math.abs(capHeightNow.capHeight - capHeightNow.stageHeight) < 1,
      JSON.stringify(capHeightNow));

    // ORIGINAL (ab2.1 F3): ok('F3: DeskRail\'s active item is not brass
    // (olive/--accent-rest per the foundations)', railActiveColor !==
    // 'rgb(255, 152, 0)', railActiveColor); — read getComputedStyle on
    // `.desk-rail-item.active` on the framed Journal route.
    // CD1 S4 — DeskRail does not mount on ANY framed route at all; there is
    // no active rail item left to color-check. Live successor in this
    // file's own S6 section asserts absence directly, on the same route.
    const railStillGoneOnJournalNow = await app.evalJs("!document.querySelector('.desk-rail')");
    pok('PARKED (was "F3: DeskRail\'s active item is not brass (olive/--accent-rest per the foundations)") — CD1 S4: DeskRail does not mount on the framed Journal route at all (nothing to color-check)',
      railStillGoneOnJournalNow === true, String(railStillGoneOnJournalNow));

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nAB2 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nAB2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nAB2 VERIFY: PASS (${allChecks.length} checks)` : `\nAB2 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
