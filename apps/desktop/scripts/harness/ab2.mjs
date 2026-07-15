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

  // A fresh manuscript page opens in Free Write (journal mode) by default —
  // its rail: ink swatches + capture items, no format/structure tools.
  const freeWriteRail = await app.evalJs(`({
    ink: !!document.querySelector('.desk-toolrail-inks'),
    forwardLock: !!document.querySelector('.desk-toolrail-forwardlock'),
    captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
    format: !!document.querySelector('.desk-toolrail-format'),
    structure: !!document.querySelector('.desk-toolrail-structure'),
  })`);
  ok('S1/S2: Free Write rail shows ink + forward lock + capture items, and ONLY those',
    freeWriteRail.ink && freeWriteRail.forwardLock
      && JSON.stringify(freeWriteRail.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer'])
      && !freeWriteRail.format && !freeWriteRail.structure,
    JSON.stringify(freeWriteRail));

  // -- PAGE IS PRIMARY across a mode switch, rail POPULATED this time (AB1
  // proved this with an empty/reserved rail; AB2 re-proves it with real
  // content swapping in the SAME fixed-width track). -------------------------
  const railRectBefore = await app.evalJs(rectOf('.desk-frame-toolrail'));
  const pageRectBefore = await app.evalJs(rectOf('.mode-pagecol'));
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
  await freshProsePage(app);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('ab');
  await sleep(100);
  await app.key('Backspace');
  await sleep(100);
  const strikeDefault = await app.evalJs("!!document.querySelector('.forward-only-editor .fo-struck')");
  ok('S2: forward lock defaults ON — a backspace STRIKES (today\'s shipped Free Write behavior, unchanged)', strikeDefault);

  await app.evalJs("document.querySelector('.desk-toolrail-forwardlock').click()");
  await sleep(100);
  const lockOffState = await app.evalJs("document.querySelector('.desk-toolrail-forwardlock').dataset.on");
  ok('S2: the rail toggle flips to off', lockOffState === 'false', lockOffState);

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
  ok('S2: the forward-lock setting persists (localStorage)', forwardLockPersisted === '0', forwardLockPersisted);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor after reload' });
  await sleep(200);
  const forwardLockAfterReload = await app.evalJs("document.querySelector('.desk-toolrail-forwardlock')?.dataset.on");
  ok('S2: the forward-lock setting is honored on reload (rail shows off, not reset to the default)', forwardLockAfterReload === 'false', forwardLockAfterReload);

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
    metadataBelow: (() => {
      const sheet = document.querySelector('.entry-full');
      const h1 = document.querySelector('h1');
      if (!sheet || !h1) return { ok: false, reason: 'missing element', hasSheet: !!sheet, hasH1: !!h1 };
      const sheetRect = sheet.getBoundingClientRect();
      const h1Rect = h1.getBoundingClientRect();
      return { ok: h1Rect.top > sheetRect.bottom - 5, sheetBottom: sheetRect.bottom, h1Top: h1Rect.top };
    })(),
  })`);
  ok('S6: JournalEntry mounts inside DeskFrame at >=1100px', journalFramed.deskFrame);
  ok('S6: the unified mode strip is present, five ratified strings', JSON.stringify(journalFramed.strip) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']), JSON.stringify(journalFramed.strip));
  ok('S6: the legacy tab row does NOT mount when framed (superseded, not deleted)', journalFramed.legacyTabsGone);
  ok('S6: capture items are in the rail (their ruled final home)', JSON.stringify(journalFramed.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']), JSON.stringify(journalFramed.captureItems));
  ok('S6: the interim corkboard Journal tab is retired (no .desk-corkboard-item anywhere)', journalFramed.corkboardItems === 0);
  ok('S6: the ink layer (canvas) is present — the sheet mounts editor core untouched', journalFramed.inkPresent);
  ok('S6: the metadata/star band keeps its below-the-page position inside the stage column', journalFramed.metadataBelow.ok, JSON.stringify(journalFramed.metadataBelow));

  // -- S6: below the gate, legacy JSX is untouched (byte-identical). --------
  await app.emulateDpr(1, 900, 900);
  await sleep(200);
  const journalLegacy = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    legacyTabs: !!document.querySelector('.journal-modes'),
  })`);
  ok('S6: below 1100px, DeskFrame does not mount and the legacy tab row is back (non-goal — mobile untouched)',
    journalLegacy.deskFrameGone && journalLegacy.legacyTabs, JSON.stringify(journalLegacy));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED (S8) — gated behind HARNESS_PARKED=1, skipped by default. ======
// AB2 itself parks nothing new (its own gate-floor/viewport behavior is
// identical to AB1's — the >=1100px gate is unchanged) — this scaffold
// exists so a future ticket that widens the gate again has a documented
// home to move any of THIS file's checks into, matching ab1.mjs's own
// pattern. Nothing to run today.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nAB2 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of ab2.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nAB2 VERIFY: PASS (${checks.length} checks)` : `\nAB2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
