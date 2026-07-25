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
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'authed Desk' });
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after clear' });

  // --- Journal chrome-order + R2 progress + R1 celebrate-once, ALL on the
  //     JournalEntry surface [PARKED WHOLE — FX14 S2] ------------------------
  // This sequence (Block A: chrome order + glow/progress/typewriter presence;
  // Block B: R2 progress=off honored; Block C: R1 celebrate-once, live-cross +
  // reopen-no-recelebrate) drove the JournalEntry surface via
  // window.wrizoCreateJournalPage() -> #/journal/:id -> .entry-edit. FX14 S2
  // unroutes that surface: /journal/:id is now a permanent redirect to /page/:id
  // (App.tsx's JournalIdRedirect), so .entry-edit / .entry-full / .journal-page
  // never mount. All ten checks PARKED (A4) as FALSIFIED. SV6, quoted: "Journal
  // Pages no longer exist. The Journal is now just a board that contains certain
  // pages."
  // Successors: the R1 celebrate-once regression is proven LIVE on THE Page in
  // this same file's ModeStage/PageEditor twin immediately below (the
  // .forward-only-editor block ending in "R1 (ModeStage/PageEditor): reopening an
  // existing >=250-word page does NOT celebrate on mount"), which also crosses
  // the 251-word goal live; the progress=off setting is surface-agnostic (THE
  // Page's ModeStage honors it too); the Journal-specific chrome order
  // (wayfinding-above / metadata-below the sheet) is J7's behavior-parity census
  // (every Journal-unique behavior becomes a setting or dies there, per the FX14
  // brief). Originals, byte-for-byte:
  //   PARKED (was "the wayfinding/tabs strip renders BEFORE the writing surface")
  //   PARKED (was "star button renders AFTER the writing surface")
  //   PARKED (was "ambient glow present on an authored Journal page")
  //   PARKED (was "progress bar present on an authored Journal page (default settings)")
  //   PARKED (was "typewriter toggle icon present")
  //   PARKED (was "R2: Progress=off hides the bar on the Journal")
  //   PARKED (was "R2: the typewriter toggle stays independent of the Progress setting")
  //   PARKED (was "crossing the 250-word goal live triggers the celebration class")
  //   PARKED (was "reload landed back on the same >=250-word entry")
  //   PARKED (was "R1: reopening an existing >=250-word page does NOT celebrate on mount")
  // words251 is preserved below as a LIVE fixture — the PageEditor twin reuses it.
  const words251 = Array.from({ length: 251 }, (_, i) => 'w' + i).join(' ');

  // -- R1, ModeStage side: same regression, PageEditor surface -------------
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before PageEditor fixture' });
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

  // --- R3: window-scroll typewriter data-scrolled gate (C2) [PARKED WHOLE —
  //     FX14 S2] --------------------------------------------------------------
  // Drove the JournalEntry surface (window.wrizoCreateJournalPage() ->
  // #/journal/:id -> .entry-edit) and asserted the window-scroll data-scrolled
  // gate on the .entry-full sheet plus the typewriter toggle flipping
  // data-typewriter. FX14 S2 unroutes JournalEntry (/journal/:id -> /page/:id
  // redirect, App.tsx's JournalIdRedirect), so .entry-full never mounts; and the
  // mechanic itself is JournalEntry-SPECIFIC — the journal sheet scrolls the
  // WINDOW, whereas THE Page (PageEditor/ModeStage) scrolls INTERNALLY
  // (.mode-scroll), so data-scrolled has no journal-window analogue on the Page.
  // All three checks PARKED (A4) as FALSIFIED. SV6, quoted: "Journal Pages no
  // longer exist. The Journal is now just a board that contains certain pages."
  // Successor: the window-scroll typewriter behavior, if it survives at all, is
  // J7's behavior-parity census. Originals, byte-for-byte:
  //   PARKED (was "R3: a short-but-window-scrolled page does NOT flip data-scrolled (C2)")
  //   PARKED (was "R3: once the sheet genuinely scrolls past the fold, data-scrolled flips true")
  //   PARKED (was "typewriter toggle flips data-typewriter on the sheet")

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nW1 VERIFY: PASS (${checks.length} checks)` : `\nW1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
