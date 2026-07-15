// W1 — writing-surface polish. A committed CDP verification scenario (per
// AGENTS.md "Harness scenarios persist"), covering Fable's R1/R2/R3 fixes
// plus the structural claims from the original push.
// Run: node apps/desktop/scripts/harness/w1.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'authed Desk' });
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after clear' });

  // -- structure: Journal chrome order (wayfinding + tabs above the sheet;
  // metadata below it) -----------------------------------------------------
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list' });
  await app.click('New page');
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page' });

  const topBeforeSheet = await app.evalJs(`(() => {
    const top = document.querySelector('.journal-top');
    const sheet = document.querySelector('.entry-full');
    if (!top || !sheet) return null;
    return !!(top.compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING);
  })()`);
  ok('the wayfinding/tabs strip renders BEFORE the writing surface', topBeforeSheet === true, String(topBeforeSheet));

  const starAfterSheet = await app.evalJs(`(() => {
    const sheet = document.querySelector('.entry-full');
    const star = document.querySelector('.entry-star');
    if (!sheet || !star) return null;
    return !!(sheet.compareDocumentPosition(star) & Node.DOCUMENT_POSITION_FOLLOWING);
  })()`);
  ok('star button renders AFTER the writing surface', starAfterSheet === true, String(starAfterSheet));

  ok('ambient glow present on an authored Journal page', await app.evalJs("!!document.querySelector('.journal-page .mode-glow')"));
  ok('progress bar present on an authored Journal page (default settings)', await app.evalJs("!!document.querySelector('.journal-page .mode-ptrack')"));
  ok('typewriter toggle icon present', await app.evalJs("!!document.querySelector('.journal-page .typewriter-toggle')"));

  // -- R2: the Journal honors the persisted Progress=off setting -----------
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'off' }))");
  await app.reload();
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page after settings reload' });
  const barHiddenWhenOff = await app.evalJs("!document.querySelector('.journal-page .mode-ptrack')");
  const toggleStillShown = await app.evalJs("!!document.querySelector('.journal-page .typewriter-toggle')");
  ok('R2: Progress=off hides the bar on the Journal', barHiddenWhenOff === true, String(barHiddenWhenOff));
  ok('R2: the typewriter toggle stays independent of the Progress setting', toggleStillShown === true, String(toggleStillShown));
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words' }))");
  await app.reload();
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page, progress back on' });

  // -- R1: crossing the goal DURING this session celebrates exactly once ---
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  const words251 = Array.from({ length: 251 }, (_, i) => 'w' + i).join(' ');
  await app.typeKeys(words251 + ' ');
  await app.waitFor("document.querySelector('.mode-pmeta span')?.textContent?.includes('251 words')", { label: 'word count live-updates', timeout: 15000 });
  const sawCelebrateLive = await (async () => {
    for (let i = 0; i < 20; i++) {
      if (await app.evalJs("!!document.querySelector('.mode-pfill.celebrate')")) return true;
      await sleep(100);
    }
    return false;
  })();
  ok('crossing the 250-word goal live triggers the celebration class', sawCelebrateLive, 'checked .mode-pfill.celebrate over 2s after crossing 250 words');
  await sleep(1300); // let the 1.1s celebration pulse fully clear before the next check

  // -- R1 (the actual regression): REOPENING an existing >=250-word page
  // must NOT celebrate on mount --------------------------------------------
  await sleep(400); // clear the debounced autosave window so the 251-word text is persisted
  const reopenId = (await app.evalJs('location.hash')).replace(/^#\/journal\//, '');
  await app.reload(); // fresh mount of the SAME page — exactly "the writer reopens it later"
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'reopened >=250-word page' });
  const stillSamePage = await app.evalJs('location.hash')
    .then((h) => h.includes(reopenId));
  ok('reload landed back on the same >=250-word entry', stillSamePage === true);
  const celebratedOnMount = await (async () => {
    for (let i = 0; i < 15; i++) {
      if (await app.evalJs("!!document.querySelector('.mode-pfill.celebrate')")) return true;
      await sleep(100);
    }
    return false;
  })();
  ok('R1: reopening an existing >=250-word page does NOT celebrate on mount', celebratedOnMount === false, `celebratedOnMount=${celebratedOnMount}`);

  // -- R1, ModeStage side: same regression, PageEditor surface -------------
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before PageEditor fixture' });
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(words251 + ' ');
  await app.waitFor("document.querySelector('.mode-pmeta span')?.textContent?.includes('251 words')", { label: 'PageEditor word count live-updates', timeout: 15000 });
  await sleep(1300); // clear the live-crossing celebration pulse
  await sleep(400); // clear the debounced autosave window
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'reopened PageEditor page' });
  const pageEditorCelebratedOnMount = await (async () => {
    for (let i = 0; i < 15; i++) {
      if (await app.evalJs("!!document.querySelector('.mode-pfill.celebrate')")) return true;
      await sleep(100);
    }
    return false;
  })();
  ok('R1 (ModeStage/PageEditor): reopening an existing >=250-word page does NOT celebrate on mount', pageEditorCelebratedOnMount === false, `celebratedOnMount=${pageEditorCelebratedOnMount}`);

  // -- Workshop/Publish action tabs + page-column stability (still on this
  // PageEditor page) --------------------------------------------------------
  ok('Workshop/Publish action tabs render on PageEditor', await app.evalJs("!!document.querySelector('.mode-tab--action')"));
  const actionLabels = await app.evalJs("[...document.querySelectorAll('.mode-tab--action')].map(b => b.textContent).join('|')");
  ok('action tab labels include Publish', actionLabels.includes('Publish'), actionLabels);

  await app.click('Draft');
  await sleep(100);
  const pageColBefore = await app.evalJs("(() => { const r = document.querySelector('.mode-pagecol').getBoundingClientRect(); return {left:r.left, width:r.width}; })()");
  const hasAssistCollapse = await app.evalJs("!!document.querySelector('.assist-collapse')");
  if (hasAssistCollapse) {
    await app.evalJs("document.querySelector('.assist-collapse').click()");
    await sleep(700);
    const pageColAfter = await app.evalJs("(() => { const r = document.querySelector('.mode-pagecol').getBoundingClientRect(); return {left:r.left, width:r.width}; })()");
    ok('page column does not shift when the assist rail collapses', pageColBefore.left === pageColAfter.left && pageColBefore.width === pageColAfter.width, `${JSON.stringify(pageColBefore)} -> ${JSON.stringify(pageColAfter)}`);
  } else {
    ok('assist-collapse button found', false, `pageColBefore=${JSON.stringify(pageColBefore)}`);
  }

  // -- A5: board/script delegates never get the mode tabs / Workshop-Publish
  const boardCheck = await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const id = 'w1-board-' + Date.now();
    entries.push({ id, text: '', pageType: 'board', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    return id;
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${boardCheck}'`);
  await sleep(400);
  const boardHasModeTabs = await app.evalJs("!!document.querySelector('.mode-tabs') || !!document.querySelector('.mode-tab--action')");
  ok('A5: a board page never renders the mode tabs / Workshop-Publish', boardHasModeTabs === false, String(boardHasModeTabs));

  // -- R3: window-scroll typewriter data-scrolled gate (C2) ----------------
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before R3 fixture' });
  await app.emulateDpr(1, 1024, 500); // short viewport: guarantees overflow from the below-sheet metadata cluster alone
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list (R3)' });
  await app.click('New page');
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page (R3)' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('A short line.');
  await sleep(300);
  const scrollableRange = await app.evalJs('document.documentElement.scrollHeight - window.innerHeight');
  await app.evalJs('window.scrollTo(0, 24)');
  await sleep(150);
  const shortPageScrolledFlag = await app.evalJs("document.querySelector('.entry-full').dataset.scrolled");
  const shortPageSheetTop = await app.evalJs("document.querySelector('.entry-full').getBoundingClientRect().top");
  ok(
    'R3: a short-but-window-scrolled page does NOT flip data-scrolled (C2)',
    shortPageScrolledFlag === 'false',
    `scrollableRange=${scrollableRange} sheetTop=${shortPageSheetTop} data-scrolled=${shortPageScrolledFlag}`,
  );

  // Now grow content well past the typewriter hold-band so the sheet's own
  // top genuinely scrolls past the fold, and confirm the flag DOES flip.
  const manyLines = Array.from({ length: 40 }, (_, i) => `Line number ${i} of the growing page.`).join('\n');
  await app.typeKeys(manyLines);
  await app.waitFor(
    "document.querySelector('.entry-full').getBoundingClientRect().top < -4",
    { label: 'sheet scrolled past the fold', timeout: 8000 },
  );
  await sleep(300);
  const grownScrolledFlag = await app.evalJs("document.querySelector('.entry-full').dataset.scrolled");
  ok('R3: once the sheet genuinely scrolls past the fold, data-scrolled flips true', grownScrolledFlag === 'true', grownScrolledFlag);

  // Typewriter toggle still flips data-typewriter (unaffected by the R3 fix).
  const beforeTw = await app.evalJs("document.querySelector('.entry-full').dataset.typewriter");
  await app.evalJs("document.querySelector('.typewriter-toggle').click()");
  await sleep(50);
  const afterTw = await app.evalJs("document.querySelector('.entry-full').dataset.typewriter");
  ok('typewriter toggle flips data-typewriter on the sheet', beforeTw !== afterTw, `${beforeTw} -> ${afterTw}`);

  // -- j2-s25-fixes S5: "the ink room rule" — the incentive row fades out
  // while a stylus pointer is active on the surface and returns only on
  // keyboard input (not on pen-lift). A fresh, normal-viewport page, so this
  // doesn't interact with R3's short-viewport/typewriter state above. -------
  await app.emulateDpr(1, 1024, 1400); // back to a normal viewport (R3 above emulated a short one)
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before S5 fixture' });
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list (S5)' });
  await app.click('New page');
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page (S5)' });
  await app.waitFor("!!document.querySelector('.mode-incentive-row')", { label: 'incentive row mounted (S5)' });

  // Baseline (keyboard-condition parity with the presence checks above):
  // visible, interactive, and data-stylus-active is explicitly 'false'.
  const s5Before = await app.evalJs(`(() => {
    const row = document.querySelector('.mode-incentive-row');
    const page = document.querySelector('.journal-page');
    const st = getComputedStyle(row);
    return { opacity: st.opacity, pointerEvents: st.pointerEvents, stylusActive: page?.dataset.stylusActive };
  })()`);
  ok(
    'S5: incentive row starts visible/interactive with data-stylus-active=false',
    s5Before.opacity === '1' && s5Before.pointerEvents !== 'none' && s5Before.stylusActive === 'false',
    JSON.stringify(s5Before),
  );

  // A genuine pen stroke (CDP pointerType 'pen', not synthetic) over the sheet.
  await app.penStroke('.entry-full', [{ x: 0.2, y: 0.3 }, { x: 0.4, y: 0.32 }, { x: 0.6, y: 0.3 }]);
  // pointer-events and the data attribute are discrete (not transitioned), so
  // they flip the instant React commits — no need to wait out the opacity
  // transition to observe them.
  const s5AfterStrokeInstant = await app.evalJs(`(() => {
    const row = document.querySelector('.mode-incentive-row');
    const page = document.querySelector('.journal-page');
    return { pointerEvents: getComputedStyle(row).pointerEvents, stylusActive: page?.dataset.stylusActive };
  })()`);
  ok(
    'S5: a stylus stroke on the sheet immediately flips data-stylus-active + pointer-events:none',
    s5AfterStrokeInstant.pointerEvents === 'none' && s5AfterStrokeInstant.stylusActive === 'true',
    JSON.stringify(s5AfterStrokeInstant),
  );
  // Opacity itself animates over --fade-dur (reused from the chrome-fade
  // engine, refreshed to the same ~2.8s "recede on write" duration by the
  // stroke's own noteWrite call) — poll for it to settle at 0.
  await app.waitFor("getComputedStyle(document.querySelector('.mode-incentive-row')).opacity === '0'", {
    label: 'S5: incentive row opacity settles to 0 after the stylus stroke', timeout: 4000,
  });
  ok('S5: incentive row opacity reaches 0 after a stylus stroke', true);

  // The pen has already lifted (penStroke ends with mouseReleased) — the row
  // must stay hidden; only KEYBOARD input restores it (the ink-room rule is
  // deliberately not "pen lift" like the chrome-fade engine's own return).
  const s5AfterLift = await app.evalJs("getComputedStyle(document.querySelector('.mode-incentive-row')).opacity");
  ok('S5: the row stays hidden after the pen lifts (pen-lift alone does not restore it)', s5AfterLift === '0', s5AfterLift);

  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('back to the keyboard');
  const s5AfterKeyboardInstant = await app.evalJs("document.querySelector('.journal-page')?.dataset.stylusActive");
  ok('S5: keyboard input immediately clears data-stylus-active', s5AfterKeyboardInstant === 'false', s5AfterKeyboardInstant);
  await app.waitFor("getComputedStyle(document.querySelector('.mode-incentive-row')).opacity === '1'", {
    label: 'S5: incentive row opacity restores to 1 after keyboard input', timeout: 4000,
  });
  ok('S5: keyboard input restores the incentive row to full opacity', true);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nW1 VERIFY: PASS (${checks.length} checks)` : `\nW1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
