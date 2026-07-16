// AB2 — the Tools by Mode (docs/wrizo-alpha/ab2-tools-by-mode-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on ab1.mjs.
// Run: node apps/desktop/scripts/harness/ab2.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

// Land on a fresh, framed, empty manuscript page (a book project's first
// chapter) — the S1-S5 template surface (PageEditorView, prose, Draft law).
const freshProsePage = async (app) => {
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before fixture' });
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

await withHarness(async (app) => {
  // === S1 — the tool rail: per-mode registry, and only the active mode's
  // tools render (the relevance law). ========================================
  await freshProsePage(app);

  ok('S1: ToolRail mounts into the reserved tool-rail track', await app.evalJs("!!document.querySelector('.desk-frame-toolrail .desk-toolrail-body')"));

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
  const freeWriteRail = await app.evalJs(`({
    ink: !!document.querySelector('.desk-toolrail-inks'),
    forwardLock: !!document.querySelector('.desk-toolrail-forwardlock'),
    captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
    format: !!document.querySelector('.desk-toolrail-format'),
    structure: !!document.querySelector('.desk-toolrail-structure'),
  })`);
  ok('FX1 S3: Free Write rail on a PROJECT-origin page shows the forward lock PRESENT (mode furniture now) but still none of the Journal-only furniture (ink/capture items absent); format/structure stay absent too (Free Write, not Draft)',
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

  const draftRail = await app.evalJs(`({
    ink: !!document.querySelector('.desk-toolrail-inks'),
    captureItems: document.querySelectorAll('.desk-toolrail-item').length,
    format: !!document.querySelector('.desk-toolrail-format'),
    structure: !!document.querySelector('.desk-toolrail-structure'),
    formatButtons: [...document.querySelectorAll('.desk-toolrail-format .mode-tbtn')].map(b => b.title),
    structureLabels: [...document.querySelectorAll('.desk-toolrail-structure-btn')].map(b => b.textContent),
  })`);
  ok('S1/S3/S4: Draft rail shows Bold/Italic/Heading/Spacing + the Structure picker, and ONLY those (no ink, no capture items)',
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
  await app.evalJs("document.querySelector('.desk-toolrail-format .mode-tbtn[title=\"Bold\"]').click()");
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
  await app.evalJs("[...document.querySelectorAll('.desk-toolrail-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
  await sleep(150);
  ok('S4: a non-empty page requesting Screenplay shows the confirmation (gated, does not act yet)',
    await app.evalJs("!!document.querySelector('.structure-confirm-modal')"));
  await app.evalJs("[...document.querySelectorAll('.structure-confirm-modal button')].find(b => b.textContent === 'Cancel').click()");
  await sleep(150);
  ok('S4: after Cancel, the surface is still prose (forward-only-editor present, no script-sheet)',
    await app.evalJs("!!document.querySelector('.forward-only-editor') && !document.querySelector('.script-sheet')"));

  await app.evalJs("[...document.querySelectorAll('.desk-toolrail-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
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
  await freshProsePage(app);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(100);
  await app.evalJs("[...document.querySelectorAll('.desk-toolrail-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
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
  await app.evalJs("document.querySelector('.script-el-active').focus()");
  await app.typeKeys('int. office - day');
  await app.key('Enter');
  await app.typeKeys('A line of action.');
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.desk-toolrail-structure-btn')].find(b => b.textContent === 'Prose').click()");
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
  // AB3 S4 — freshProsePage's fixture is project-origin, so the RAIL TOGGLE
  // itself no longer mounts here (see the AB3 S4 check above); the setting
  // is toggled directly via its own localStorage key instead of clicking a
  // rail control that's correctly absent for this fixture. The underlying
  // strike/erase MECHANIC (store/forwardOnly.ts) is origin-independent —
  // still exercised in full. The rail-toggle-specific assertions this
  // replaces are parked below (HARNESS_PARKED=1); ab3.mjs's own journal-
  // origin fixture proves the rail toggle itself still works where it
  // belongs.
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
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(100);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('hello');
  await sleep(100);
  await app.evalJs(selectAllInEditor('.forward-only-editor'));
  await app.evalJs("document.querySelector('.desk-toolrail-format .mode-tbtn[title=\"Bold\"]').click()");
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
  await app.evalJs("[...document.querySelectorAll('.desk-toolrail-structure-btn')].find(b => b.textContent === 'Screenplay').click()");
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
  // through the rail; its hold-band respects the containment fix. ===========
  ok('S2 DoD: the typewriter toggle is present in the rail on the script surface', await app.evalJs("!!document.querySelector('.desk-toolrail-typewriter .typewriter-toggle')"));
  const scriptTypewriterOn = await app.evalJs("document.querySelector('.desk-toolrail-typewriter .typewriter-toggle').classList.contains('on')");
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
  ok('S2 DoD: the typewriter and the containment fix do not fight — the cap stays bounded, content scrolls inside it, typewriter engaged',
    typewriterVsContainment.capHeight <= 660 && typewriterVsContainment.overflowed === true
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
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before Journal fixture' });
  await app.emulateDpr(1, 1400, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'ab2-journal', text: '', projectId: null, source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after Journal seed' });
  await app.evalJs("location.hash = '#/journal/ab2-journal'");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'JournalEntry framed' });
  await sleep(200);

  const journalFramed = await app.evalJs(`({
    deskFrame: !!document.querySelector('.desk-frame'),
    strip: [...document.querySelectorAll('.desk-mode-tab')].map(b => b.textContent),
    legacyTabsGone: !document.querySelector('.journal-modes'),
    captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
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
  ok('S6: capture items are in the rail (their ruled final home)', JSON.stringify(journalFramed.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']), JSON.stringify(journalFramed.captureItems));
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
  // marks what you do): DeskRail's active-place indicator is a where-you-
  // are-at-rest, so it must NOT wear brass. The Journal rail item is
  // active on this route (/journal/:id).
  const railActiveColor = await app.evalJs("getComputedStyle(document.querySelector('.desk-rail-item.active')).color");
  ok('F3: DeskRail\'s active item is not brass (olive/--accent-rest per the foundations)',
    railActiveColor !== 'rgb(255, 152, 0)', railActiveColor);

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
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before Board fixture' });
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
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after Board seed' });
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
      ink: !!document.querySelector('.desk-toolrail-inks'),
      forwardLock: !!document.querySelector('.desk-toolrail-forwardlock'),
      captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
    })`);
    pok('PARKED (was "S1/S2: Free Write rail shows ink + forward lock + capture items, and ONLY those", then AB3-superseded to "...shows NONE of it") — FX1 S3 re-supersedes AB3\'s own re-assertion: forward lock is back (mode furniture), ink/capture items stay absent',
      !freeWriteRailNow.ink && freeWriteRailNow.forwardLock && freeWriteRailNow.captureItems.length === 0,
      JSON.stringify(freeWriteRailNow));

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
    const forwardLockRailPresent = await app.evalJs("!!document.querySelector('.desk-toolrail-forwardlock')");
    pok('PARKED (was "S2: the rail toggle flips to off" + "...is honored on reload", then AB3-superseded to "...control does not mount at all") — FX1 S3 re-supersedes AB3\'s own re-assertion: the forward-lock rail control mounts again for a project-origin page',
      forwardLockRailPresent === true);

    // === S6 fixture — a fresh Journal entry, framed. =========================
    await app.goto('/');
    await app.evalJs('localStorage.clear()');
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before Journal fixture (PARKED)' });
    await app.emulateDpr(1, 1400, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'ab2-journal-parked', text: '', projectId: null, source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after Journal seed (PARKED)' });
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
