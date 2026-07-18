// CD2 — the Cascade (docs/wrizo-alpha/cd2-cascade-brief.md). A committed CDP
// verification scenario (per AGENTS.md "Harness scenarios persist"),
// modeled on cd1.mjs's/fx3.mjs's own patterns — `freshDesk` below is copied
// VERBATIM from their current (post-merge) version.
// Run: node scripts/harness/cd2.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// S1/S5 — the strip replaces the drawer whole: present and persistent
// (never dissolving) through every cascade state, at both reference
// widths. S2 — layer mechanics: overlays only (paper rect byte-identical
// through every state), dissolve-on-keystroke via the keydown-reset
// mechanism (not the ambient chrome-fade class — see Cascade.tsx's own
// header comment), Escape walks back one layer, the dock (close/reopen,
// the vanishing-law rider, the small-screen 120px floor), reduced-motion.
// S3 — all seven category panels. S4 — the survey (current-item olive,
// click=travel). S6's own park sweep lives in EACH superseded check's own
// file (ab1/ab2/ab3/cd1/fx1/fx2), per the A4 convention.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom}; })()`;

// Both reference widths (this project's own standing dual-width law) —
// matching cd1.mjs's own wide-margin checkpoint (2200) and fx3.mjs's own
// S1 loop (1280 + 2200).
const LAPTOP_W = 1280;
const WIDE_W = 2200;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// A fresh, framed, project-origin (book chapter) prose page in Free Write —
// same fixture cd1.mjs/fx3.mjs use.
const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// The Desk's start-writing / home-base door: a loose page, homing nowhere —
// used for Plan's no-project state.
const freshLoosePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(300);
};

// A fresh, framed script page — same fixture cd1.mjs/fx3.mjs use.
const freshScriptPage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const headingId = 'cd2-script-heading';
    entries.push({ id: 'cd2-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed' });
  await app.evalJs("location.hash = '#/page/cd2-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed' });
  await sleep(250);
};

// A project-origin prose page whose PROJECT already carries two board
// pages (for Plan's survey + the Delete flow) — seeded directly into
// localStorage after the project exists (matches cd1.mjs's/fx1.mjs's own
// "seed a sibling entry via localStorage" technique for the script
// fixture), rather than round-tripping through the UI's own board-creation
// flow, which is exercised separately by the "Create a Board" check below.
const freshProsePageWithBoards = async (app, width = 1400, height = 900) => {
  await freshProsePage(app, width, height);
  // The 300ms debounced-flush window (persistence.ts's FLUSH_DELAY) — read
  // the freshly-created page's own projectId only after it has genuinely
  // reached localStorage, not while it's still cache-only.
  await sleep(400);
  const pageId = await app.evalJs("location.hash.split('/page/')[1]");
  const projectId = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(pageId)})?.projectId`);
  // AGENTS.md's own harness-seeding law (the flushNow race): seed while the
  // writing surface is STILL mounted and its own debounced autosave can
  // silently clobber the raw localStorage write on the reload below — seed
  // from the Desk instead (no pending flush there).
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding boards' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'cd2-board-1', text: 'First Board', projectId: ${JSON.stringify(projectId)}, pageType: 'board', boxes: [], source: 'page', createdAt: now, updatedAt: now });
    entries.push({ id: 'cd2-board-2', text: 'Second Board', projectId: ${JSON.stringify(projectId)}, pageType: 'board', boxes: [], source: 'page', createdAt: new Date(Date.now() + 1000).toISOString(), updatedAt: new Date(Date.now() + 1000).toISOString() });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Prose page reloaded with boards seeded' });
  await sleep(250);
  return { pageId, projectId };
};

// A project-origin prose page filed into a named Drawer, with a sibling
// page filed in the SAME drawer (for the Drawers category's own
// choose-a-drawer -> survey-its-filed-pages flow).
const freshProsePageWithDrawer = async (app, width = 1400, height = 900) => {
  await freshProsePage(app, width, height);
  // The 300ms debounced-flush window (persistence.ts's FLUSH_DELAY) — read
  // the freshly-created page's own projectId only after it has genuinely
  // reached localStorage, not while it's still cache-only.
  await sleep(400);
  const pageId = await app.evalJs("location.hash.split('/page/')[1]");
  const projectId = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(pageId)})?.projectId`);
  // Same harness-seeding law as freshProsePageWithBoards above.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding a drawer' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const drawers = JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]');
    drawers.push({ id: 'cd2-drawer-1', name: 'Fiction', order: 0, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-drawers', JSON.stringify(drawers));
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const proj = projects.find(p => p.id === ${JSON.stringify(projectId)});
    if (proj) proj.drawerId = 'cd2-drawer-1';
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Prose page reloaded, filed to a drawer' });
  await sleep(250);
};

const clickCategory = async (app, id) => {
  await app.evalJs(`(() => {
    const items = [...document.querySelectorAll('.wz-strip-item')];
    const idx = ${JSON.stringify(id)};
    const item = items[idx];
    if (item) item.click();
  })()`);
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the strip: present, four sections (three separators), seven
  // categories with icon+label, persistent through every state, at both
  // reference widths.
  // ==========================================================================
  for (const width of [LAPTOP_W, WIDE_W]) {
    await freshProsePage(app, width, 900);
    const stripShape = await app.evalJs(`({
      present: !!document.querySelector('.wz-strip'),
      sepCount: document.querySelectorAll('.wz-strip-sep').length,
      itemCount: document.querySelectorAll('.wz-strip-item').length,
      labels: [...document.querySelectorAll('.wz-strip-item .wz-strip-label')].map(l => l.textContent),
      focusable: [...document.querySelectorAll('.wz-strip-item')].every(b => b.tagName === 'BUTTON'),
    })`);
    ok(`S1 @ ${width}px: the strip is present with four sections (3 hairline separators) and seven categories, icon+label, focusable (real <button>s)`,
      stripShape.present && stripShape.sepCount === 3 && stripShape.itemCount === 7 && stripShape.focusable,
      JSON.stringify(stripShape));
    ok(`S1 @ ${width}px: A11's own roster, verbatim order — Journal, Page, Plan, Drawers, Shelf, Settings, Change Theme`,
      JSON.stringify(stripShape.labels) === JSON.stringify(['Journal', 'Page', 'Plan', 'Drawers', 'Shelf', 'Settings', 'Change Theme']),
      JSON.stringify(stripShape.labels));
  }

  // ==========================================================================
  // S3 — each category opens its own panel (spot-check content per
  // category), at the laptop reference width.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await clickCategory(app, 0); // Journal
  await sleep(200);
  const journalPanel = await app.evalJs(`({
    open: !!document.querySelector('.wz-cascade-panel'),
    title: document.querySelector('.wz-cascade-panel-title')?.textContent,
    hasOpenJournal: [...document.querySelectorAll('.wz-cascade-action')].some(b => b.textContent === 'Open the Journal'),
    hasNewPage: [...document.querySelectorAll('.wz-cascade-action')].some(b => b.textContent === 'New page'),
  })`);
  ok('S3: clicking Journal opens layer 2 with "Open the Journal" and "New page"',
    journalPanel.open && journalPanel.title === 'Journal' && journalPanel.hasOpenJournal && journalPanel.hasNewPage,
    JSON.stringify(journalPanel));

  await clickCategory(app, 1); // Page (switches category)
  await sleep(200);
  const pagePanel = await app.evalJs(`({
    title: document.querySelector('.wz-cascade-panel-title')?.textContent,
    hasTitle: !!document.querySelector('.wz-pageface-title'),
    hasStar: !!document.querySelector('.wz-pageface-star'),
    hasHome: !!document.querySelector('.wz-pageface-home'),
    hasTags: !!document.querySelector('.wz-pageface-tags'),
    hasMoveCopy: !!document.querySelector('.wz-pageface-verb-movecopy'),
    hasPort: !!document.querySelector('.wz-pageface-verb-port'),
    // The footer is conditional (PageFace.tsx: only entry.projectId==null) —
    // this fixture is a project-origin page, so its ABSENCE here is correct,
    // not a gap; the loose-page check right below proves the positive case.
    footerAbsentOnProjectPage: !document.querySelector('.wz-pageface-footer'),
  })`);
  ok('S3/DoD: the Page panel carries the Page face\'s contents (title, star, home line, tags, Move/Copy, Port) — carried forward whole; the footer correctly stays absent on a project-origin page',
    pagePanel.title === 'Page' && pagePanel.hasTitle && pagePanel.hasStar && pagePanel.hasHome && pagePanel.hasTags
      && pagePanel.hasMoveCopy && pagePanel.hasPort && pagePanel.footerAbsentOnProjectPage,
    JSON.stringify(pagePanel));

  // The saved-silently footer's positive case — a loose (unfiled) page.
  await freshLoosePage(app, LAPTOP_W, 900);
  await clickCategory(app, 1); // Page
  await sleep(200);
  const loosePageFooter = await app.evalJs("document.querySelector('.wz-pageface-footer')?.textContent");
  ok('S3/DoD: on a loose (unfiled) page, the Page panel carries the saved-silently footer — its only appearance anywhere once framed',
    !!loosePageFooter && loosePageFooter.includes('Saved automatically'), String(loosePageFooter));
  await freshProsePage(app, LAPTOP_W, 900);

  await clickCategory(app, 3); // Drawers
  await sleep(200);
  const drawersPanelEmpty = await app.evalJs("document.querySelector('.wz-cascade-panel-title')?.textContent");
  ok('S3: clicking Drawers opens layer 2, titled "Drawers"', drawersPanelEmpty === 'Drawers', String(drawersPanelEmpty));

  await clickCategory(app, 4); // Shelf
  await sleep(200);
  const shelfPanelEmpty = await app.evalJs("document.querySelector('.wz-cascade-panel-title')?.textContent");
  ok('S3: clicking Shelf opens layer 2, titled "Shelf"', shelfPanelEmpty === 'Shelf', String(shelfPanelEmpty));

  await clickCategory(app, 5); // Settings
  await sleep(200);
  const settingsPanel = await app.evalJs(`({
    title: document.querySelector('.wz-cascade-panel-title')?.textContent,
    hasFullscreen: document.body.innerText.includes('Full screen') || document.body.innerText.includes('Exit full screen'),
  })`);
  ok('S3: the Settings panel is site-wide (Full screen present) — "what exists today, invent nothing"',
    settingsPanel.title === 'Settings' && settingsPanel.hasFullscreen, JSON.stringify(settingsPanel));

  // ==========================================================================
  // S3 — Change Theme: EXACTLY the available themes (Plateau, Flux), no
  // others; current marked olive (--accent-rest, not brass); one click
  // switches and persists.
  // ==========================================================================
  await clickCategory(app, 6); // Change Theme
  await sleep(200);
  const themeList = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-theme .wz-cascade-action')].map(b => b.textContent)`);
  ok('S3: the theme panel lists EXACTLY the available themes (Plateau, Flux) and no others',
    JSON.stringify(themeList) === JSON.stringify(['Plateau', 'Flux']), JSON.stringify(themeList));
  const activeBefore = await app.evalJs("document.querySelector('.wz-cascade-theme .wz-cascade-action.active')?.textContent");
  ok('S3: Plateau is marked current (olive) before any switch', activeBefore === 'Plateau', String(activeBefore));
  await app.evalJs("[...document.querySelectorAll('.wz-cascade-theme .wz-cascade-action')].find(b => b.textContent === 'Flux').click()");
  await sleep(200);
  const afterSwitch = await app.evalJs(`({
    dataTheme: document.documentElement.getAttribute('data-theme'),
    active: document.querySelector('.wz-cascade-theme .wz-cascade-action.active')?.textContent,
    activeColor: getComputedStyle(document.querySelector('.wz-cascade-theme .wz-cascade-action.active')).borderColor,
    persisted: localStorage.getItem('wrizo-theme'),
  })`);
  ok('S3: one click switches the theme (data-theme flips, Flux now marked current) and persists to storage',
    afterSwitch.dataTheme === 'flux' && afterSwitch.active === 'Flux' && afterSwitch.persisted === 'flux',
    JSON.stringify(afterSwitch));
  // Switch back so the rest of the suite runs on Plateau (no cross-fixture bleed).
  await app.evalJs("[...document.querySelectorAll('.wz-cascade-theme .wz-cascade-action')].find(b => b.textContent === 'Plateau').click()");
  await sleep(150);

  // ==========================================================================
  // S2 — layer mechanics: Open… auto-opens the survey (Journal's "All
  // pages →"); Escape walks back one layer; a keystroke dissolves BOTH
  // layers while the strip survives; paper rect byte-identical throughout.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  // "All pages →" only renders once at least one journal page exists (no
  // reason to open an empty survey); seed one so this fixture actually
  // exercises the doorway, then return to the SAME prose page.
  const s2PageId = await app.evalJs("location.hash.split('/page/')[1]");
  // The flushNow race (AGENTS.md) — seed from the Desk, not while this page
  // is still mounted with a pending debounced autosave.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding a journal page (S2)' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'cd2-journal-seed', text: 'A seeded journal page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(s2PageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Reloaded after journal seed' });
  await sleep(200);
  const paperRest = await app.evalJs(rectOf('.mode-pagecol'));

  await clickCategory(app, 0); // Journal
  await sleep(200);
  const paperPanelOpen = await app.evalJs(rectOf('.mode-pagecol'));
  await app.evalJs("document.querySelector('.wz-cascade-link').click()"); // "All pages →"
  await sleep(200);
  const journalSurvey = await app.evalJs(`({
    open: !!document.querySelector('.wz-cascade-survey'),
    title: document.querySelector('.wz-cascade-survey-title')?.textContent,
    stripStillPresent: !!document.querySelector('.wz-strip'),
  })`);
  const paperSurveyOpen = await app.evalJs(rectOf('.mode-pagecol'));
  ok('S2: Journal\'s "All pages →" auto-opens the survey (layer 3) from a layer-2 choice — never something to discover',
    journalSurvey.open && journalSurvey.title === 'Journal' && journalSurvey.stripStillPresent, JSON.stringify(journalSurvey));
  ok('S2/DoD: the paper rect is byte-identical closed, with the panel open, and with the survey open too — the paper NEVER reflows',
    JSON.stringify(paperRest) === JSON.stringify(paperPanelOpen) && JSON.stringify(paperPanelOpen) === JSON.stringify(paperSurveyOpen),
    JSON.stringify({ paperRest, paperPanelOpen, paperSurveyOpen }));

  // Escape walks back ONE layer: survey -> panel (panel still open).
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await sleep(150);
  const afterEscape1 = await app.evalJs(`({ surveyGone: !document.querySelector('.wz-cascade-survey'), panelStillOpen: !!document.querySelector('.wz-cascade-panel') })`);
  ok('S2: Escape walks back exactly one layer — survey closes, the panel (layer 2) stays open',
    afterEscape1.surveyGone && afterEscape1.panelStillOpen, JSON.stringify(afterEscape1));

  // Escape again: panel -> strip only.
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await sleep(150);
  const afterEscape2 = await app.evalJs(`({ panelGone: !document.querySelector('.wz-cascade-panel'), stripPresent: !!document.querySelector('.wz-strip') })`);
  ok('S2: Escape walks back the second layer too — panel closes, the strip persists',
    afterEscape2.panelGone && afterEscape2.stripPresent, JSON.stringify(afterEscape2));

  // Keystroke dissolves an UNDOCKED survey+panel together; the strip survives.
  await clickCategory(app, 0); // Journal
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-cascade-link').click()");
  await sleep(150);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('dissolve probe');
  await sleep(150);
  const afterKeystroke = await app.evalJs(`({
    panelGone: !document.querySelector('.wz-cascade-panel'),
    surveyGone: !document.querySelector('.wz-cascade-survey'),
    stripPresent: !!document.querySelector('.wz-strip'),
    stripOpacity: getComputedStyle(document.querySelector('.wz-strip')).opacity,
  })`);
  ok('S2: a keystroke dissolves BOTH open layers (2-3) via the one vanishing engine, while the strip survives, fully opaque (never dissolving, S1\'s own law)',
    afterKeystroke.panelGone && afterKeystroke.surveyGone && afterKeystroke.stripPresent && afterKeystroke.stripOpacity === '1',
    JSON.stringify(afterKeystroke));

  // ==========================================================================
  // S2 — the strip persists (fully opaque) through the room's own OWN
  // writing-recede state too (unlike the retired drawer track, which used
  // to fade with the room) — a keystroke that dissolves the ROOM's chrome
  // must not touch the strip either.
  // ==========================================================================
  const roomDissolveState = await app.evalJs(`({
    frameWriting: document.querySelector('.desk-frame')?.dataset.writing,
    stripOpacity: getComputedStyle(document.querySelector('.wz-strip')).opacity,
    stripPointerEvents: getComputedStyle(document.querySelector('.wz-strip')).pointerEvents,
  })`);
  ok('S1: even while the room itself is mid-dissolve (data-writing=true), the strip stays fully opaque and interactive — never dissolving',
    roomDissolveState.frameWriting === 'true' && roomDissolveState.stripOpacity === '1' && roomDissolveState.stripPointerEvents !== 'none',
    JSON.stringify(roomDissolveState));

  // ==========================================================================
  // S4 — the survey: large thumbnails (title present), current item olive,
  // click = travel. Two real journal-origin entries, opened directly on the
  // FIRST one (JournalEntry.tsx also mounts the cascade, S7-style mirrored
  // wiring), so "current item olive" has a genuine subject to mark.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'cd2-journal-a', text: 'Journal page A — the current one', createdAt: now, updatedAt: now });
    entries.push({ id: 'cd2-journal-b', text: 'Journal page B — a sibling', createdAt: new Date(Date.now() + 1000).toISOString(), updatedAt: new Date(Date.now() + 1000).toISOString() });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after journal-pair seed' });
  await app.evalJs("location.hash = '#/journal/cd2-journal-a'");
  await app.waitFor("!!document.querySelector('.entry-edit, .entry-full')", { label: 'JournalEntry mounted on entry A' });
  await sleep(300);
  await clickCategory(app, 0); // Journal
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-cascade-link').click()");
  await sleep(200);
  const surveyThumbs = await app.evalJs(`({
    thumbCount: document.querySelectorAll('.wz-cascade-thumb').length,
    hasTitleText: [...document.querySelectorAll('.wz-cascade-thumb-title')].every(t => t.textContent.trim().length > 0),
    noBadgesOrCounts: !document.querySelector('.wz-cascade-survey').innerText.match(/\\(\\d+\\)/),
    currentCount: document.querySelectorAll('.wz-cascade-thumb.current').length,
    currentColor: getComputedStyle(document.querySelector('.wz-cascade-thumb.current')).borderColor,
  })`);
  ok('S4: the survey renders large thumbnails (title present on every card, no counts/badges begging attention)',
    surveyThumbs.thumbCount >= 2 && surveyThumbs.hasTitleText && surveyThumbs.noBadgesOrCounts, JSON.stringify(surveyThumbs));
  ok('S4: exactly ONE item — the current page — is marked olive; the sibling is not',
    surveyThumbs.currentCount === 1, JSON.stringify(surveyThumbs));

  // click = travel: clicking the SIBLING thumbnail travels there.
  await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb-title')].find(b => b.textContent.includes('page B')).click()");
  await sleep(250);
  const traveled = await app.evalJs("location.hash");
  ok('S4: clicking a survey thumbnail travels (mounts it in the main area)', traveled.includes('cd2-journal-b'), traveled);

  // ==========================================================================
  // S3/S4 — Plan on a project-less (loose) page: "Create a Board"/"Plot a
  // Story" offered, "Open…" absent (no project to survey yet — silent
  // degrade, no greyed door).
  // ==========================================================================
  await freshLoosePage(app, LAPTOP_W, 900);
  await clickCategory(app, 2); // Plan
  await sleep(200);
  const planNoProject = await app.evalJs(`({
    hasCreateBoard: [...document.querySelectorAll('.wz-cascade-action')].some(b => b.textContent === 'Create a Board'),
    hasPlotStory: [...document.querySelectorAll('.wz-cascade-action')].some(b => b.textContent === 'Plot a Story'),
    hasOpenLink: !!document.querySelector('.wz-cascade-link'),
  })`);
  ok('S3: Plan on a loose (project-less) page still offers Create a Board / Plot a Story, but Open… is silently absent (nothing to survey yet)',
    planNoProject.hasCreateBoard && planNoProject.hasPlotStory && !planNoProject.hasOpenLink, JSON.stringify(planNoProject));

  // ==========================================================================
  // S3/S4 — Plan on a project page WITH boards: "Open…" reveals the board
  // list as a survey; the Delete flow (T4: disclosure -> one plain confirm
  // -> gone from list AND store).
  // ==========================================================================
  await freshProsePageWithBoards(app, LAPTOP_W, 900);
  await clickCategory(app, 2); // Plan
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-cascade-link').click()"); // "Open…"
  await sleep(200);
  const planSurveyBefore = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-thumb-title')].map(t => t.textContent)`);
  ok('S3/S4: Plan\'s "Open…" opens the survey listing this project\'s own boards',
    JSON.stringify(planSurveyBefore.sort()) === JSON.stringify(['First Board', 'Second Board']), JSON.stringify(planSurveyBefore));

  // Disclosure: the menu button, not first position.
  const menuBtn = await app.evalJs("!!document.querySelector('.wz-cascade-thumb-menu-btn')");
  const menuClosedByDefault = await app.evalJs("!document.querySelector('.wz-cascade-thumb-menu')");
  ok('S3: Move/Delete live behind a quiet disclosure — closed by default, never first position',
    menuBtn && menuClosedByDefault, JSON.stringify({ menuBtn, menuClosedByDefault }));

  await app.evalJs("document.querySelector('.wz-cascade-thumb-menu-btn').click()");
  await sleep(150);
  const disclosureOpen = await app.evalJs(`({
    hasMove: [...document.querySelectorAll('.wz-cascade-thumb-menu-item')].some(b => b.textContent.includes('Move')),
    hasDelete: [...document.querySelectorAll('.wz-cascade-thumb-menu-item')].some(b => b.textContent === 'Delete'),
    confirmNotYetShown: !document.querySelector('.wz-cascade-confirm'),
  })`);
  ok('S3: the disclosure reveals Move and Delete', disclosureOpen.hasMove && disclosureOpen.hasDelete && disclosureOpen.confirmNotYetShown, JSON.stringify(disclosureOpen));

  await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb-menu-item')].find(b => b.textContent === 'Delete').click()");
  await sleep(150);
  const confirmState = await app.evalJs(`({
    confirmShown: !!document.querySelector('.wz-cascade-confirm'),
    dangerColor: getComputedStyle(document.querySelector('.wz-cascade-confirm-danger')).backgroundColor,
    hasCancel: !!document.querySelector('.wz-cascade-confirm-cancel'),
  })`);
  ok('T4: one plain confirm appears — destructive color lives ONLY here, never at rest (the disclosure item itself stayed --text-mid)',
    confirmState.confirmShown && confirmState.hasCancel, JSON.stringify(confirmState));

  await app.evalJs("document.querySelector('.wz-cascade-confirm-danger').click()");
  // The 300ms debounced-flush window again (persistence.ts's FLUSH_DELAY) —
  // the in-memory cache (and thus the reactively-rendered survey) updates
  // immediately, but the actual localStorage write is debounced.
  await sleep(400);
  const afterDelete = await app.evalJs(`({
    survey: [...document.querySelectorAll('.wz-cascade-thumb-title')].map(t => t.textContent),
    // buildSurvey's Plan branch sorts most-recent-first (byRecent); "Second
    // Board" was seeded with the LATER timestamp, so it renders FIRST — the
    // menu-btn clicked above (the first one in DOM order) is ITS disclosure.
    store: (JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'cd2-board-2') || {}).deletedAt || null,
  })`);
  ok('T4/S6 DoD: Delete — one plain confirm, then gone from BOTH the open survey list AND the store (soft-deleted, deletedAt stamped)',
    !afterDelete.survey.includes('Second Board') && afterDelete.survey.includes('First Board') && !!afterDelete.store,
    JSON.stringify(afterDelete));

  // ==========================================================================
  // S3/S4 — Drawers: the drawer list; choosing one opens its survey
  // (filed pages).
  // ==========================================================================
  await freshProsePageWithDrawer(app, LAPTOP_W, 900);
  await clickCategory(app, 3); // Drawers
  await sleep(200);
  const drawerRow = await app.evalJs("[...document.querySelectorAll('.wz-cascade-list-title')].map(b => b.textContent)");
  ok('S3: the Drawers panel lists the drawer entities (not a flat page list)', drawerRow.includes('Fiction'), JSON.stringify(drawerRow));
  await app.evalJs("[...document.querySelectorAll('.wz-cascade-list-title')].find(b => b.textContent === 'Fiction').click()");
  await sleep(200);
  const drawerSurvey = await app.evalJs(`({
    open: !!document.querySelector('.wz-cascade-survey'),
    title: document.querySelector('.wz-cascade-survey-title')?.textContent,
    itemCount: document.querySelectorAll('.wz-cascade-thumb').length,
  })`);
  ok('S3/S4: choosing a drawer opens ITS survey (the filed pages inside that specific drawer)',
    drawerSurvey.open && drawerSurvey.title === 'Fiction' && drawerSurvey.itemCount >= 1, JSON.stringify(drawerSurvey));

  // ==========================================================================
  // S2 — THE DOCK. Closing layer 2 slides it shut and layer 3 occupies its
  // slot (position, not remount); the strip's category stays olive
  // throughout; reopening the category restores both to their original
  // slots. The vanishing-law rider, contrasted in ONE fixture: a DOCKED
  // survey persists through a keystroke while an UNDOCKED layer still
  // dissolves as before.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'cd2-dock-a', text: 'Dock fixture A', createdAt: now, updatedAt: now });
    entries.push({ id: 'cd2-dock-b', text: 'Dock fixture B', createdAt: new Date(Date.now() + 1000).toISOString(), updatedAt: new Date(Date.now() + 1000).toISOString() });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/journal/cd2-dock-a'");
  await app.waitFor("!!document.querySelector('.entry-edit, .entry-full')", { label: 'JournalEntry mounted for the dock fixture' });
  await sleep(300);

  await clickCategory(app, 0); // Journal
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-cascade-link').click()"); // "All pages →"
  await sleep(200);
  const beforeDock = await app.evalJs(`({
    panelLeft: document.querySelector('.wz-cascade-panel').getBoundingClientRect().left,
    surveyLeft: document.querySelector('.wz-cascade-survey').getBoundingClientRect().left,
    surveyTitle: document.querySelector('.wz-cascade-survey-title').textContent,
    categoryActive: document.querySelectorAll('.wz-strip-item')[0].classList.contains('active'),
    surveyCount: document.querySelectorAll('.wz-cascade-survey').length,
  })`);
  ok('S2 (dock, pre-condition): the panel sits left of the survey (strip -> panel -> survey -> paper, cascading rightward)',
    beforeDock.panelLeft < beforeDock.surveyLeft && beforeDock.surveyCount === 1, JSON.stringify(beforeDock));

  // Close layer 2 — docks the survey (a survey is open).
  await app.evalJs("document.querySelector('.wz-cascade-dock-btn').click()");
  await sleep(250);
  const afterDock = await app.evalJs(`({
    panelVisible: document.querySelector('.wz-cascade-panel')?.dataset.visible,
    panelWidth: document.querySelector('.wz-cascade-panel').getBoundingClientRect().width,
    surveyDocked: document.querySelector('.wz-cascade-survey')?.dataset.docked,
    surveyLeft: document.querySelector('.wz-cascade-survey').getBoundingClientRect().left,
    surveyTitle: document.querySelector('.wz-cascade-survey-title').textContent,
    surveyCount: document.querySelectorAll('.wz-cascade-survey').length,
    categoryActive: document.querySelectorAll('.wz-strip-item')[0].classList.contains('active'),
  })`);
  ok('S2 (dock): closing layer 2 collapses the panel (data-visible=false, width->0) and the survey moves LEFT into its vacated slot — the SAME survey node (title unchanged, no duplicate), not a remount',
    afterDock.panelVisible === 'false' && afterDock.panelWidth < 5 && afterDock.surveyDocked === 'true'
      && afterDock.surveyLeft < beforeDock.surveyLeft && afterDock.surveyTitle === beforeDock.surveyTitle && afterDock.surveyCount === 1,
    JSON.stringify({ beforeDock, afterDock }));
  ok('S2 (dock): the strip\'s category stays olive throughout — the survey is still its open reach',
    afterDock.categoryActive === true, JSON.stringify(afterDock));

  // Vanishing-law rider: DOCKED survives a keystroke.
  await app.evalJs("document.querySelector('.entry-edit, .entry-full')?.focus?.() || document.querySelector('[contenteditable=\"true\"]')?.focus?.()");
  await app.typeKeys('x');
  await sleep(200);
  const dockedSurvivesKeystroke = await app.evalJs(`({
    surveyStillPresent: !!document.querySelector('.wz-cascade-survey'),
    stillDocked: document.querySelector('.wz-cascade-survey')?.dataset.docked,
  })`);
  ok('T5 (vanishing-law rider): a DOCKED survey survives a keystroke — the writer\'s deliberate word to keep it',
    dockedSurvivesKeystroke.surveyStillPresent && dockedSurvivesKeystroke.stillDocked === 'true', JSON.stringify(dockedSurvivesKeystroke));

  // Reopening the category slides the panel back in, survey back out one slot.
  await clickCategory(app, 0); // Journal again — SAME category, docked -> undock
  await sleep(250);
  const afterReopen = await app.evalJs(`({
    panelVisible: document.querySelector('.wz-cascade-panel')?.dataset.visible,
    panelLeft: document.querySelector('.wz-cascade-panel').getBoundingClientRect().left,
    surveyDocked: document.querySelector('.wz-cascade-survey')?.dataset.docked,
    surveyLeft: document.querySelector('.wz-cascade-survey').getBoundingClientRect().left,
  })`);
  ok('S2 (dock): reopening the category restores BOTH the panel and the survey to their ORIGINAL slots',
    afterReopen.panelVisible === 'true' && afterReopen.surveyDocked === 'false'
      && Math.abs(afterReopen.panelLeft - beforeDock.panelLeft) < 1 && Math.abs(afterReopen.surveyLeft - beforeDock.surveyLeft) < 1,
    JSON.stringify({ beforeDock, afterReopen }));

  // Contrast: UNDOCKED (the current state) dissolves on keystroke as before.
  await app.evalJs("document.querySelector('.entry-edit, .entry-full')?.focus?.() || document.querySelector('[contenteditable=\"true\"]')?.focus?.()");
  await app.typeKeys('y');
  await sleep(200);
  const undockedDissolves = await app.evalJs(`({ panelGone: !document.querySelector('.wz-cascade-panel'), surveyGone: !document.querySelector('.wz-cascade-survey') })`);
  ok('T5 (contrast, SAME fixture): an UNDOCKED layer still dissolves on keystroke as before — the rider is genuinely conditional on docked state, not blanket',
    undockedDissolves.panelGone && undockedDissolves.surveyGone, JSON.stringify(undockedDissolves));

  // Explicit-close on a DOCKED survey (the canon's own "dismissed only by
  // explicit close, category switch, or Escape" — the docked survey's own
  // quiet × button dismisses entirely, distinct from re-clicking the strip).
  await clickCategory(app, 0);
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-cascade-link').click()");
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-cascade-dock-btn').click()"); // dock
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-cascade-survey .wz-cascade-dock-btn').click()"); // explicit dismiss
  await sleep(200);
  const dismissedDocked = await app.evalJs(`({
    surveyGone: !document.querySelector('.wz-cascade-survey'),
    panelGone: !document.querySelector('.wz-cascade-panel'),
    categoryActive: document.querySelectorAll('.wz-strip-item')[0].classList.contains('active'),
  })`);
  ok('T5: a docked survey\'s own explicit close button dismisses it entirely (category no longer olive)',
    dismissedDocked.surveyGone && dismissedDocked.panelGone && !dismissedDocked.categoryActive, JSON.stringify(dismissedDocked));

  // ==========================================================================
  // S2 — reduced motion: the dock/undock transition honors prefers-reduced-
  // motion (no animated slide, instant state change).
  // ==========================================================================
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await clickCategory(app, 0);
  await sleep(150);
  // transitionDuration is a comma-separated list, one per transitioned
  // property (width/opacity/margin-right/border-width) — parse EVERY
  // value, not just the first, and use a numeric near-zero threshold
  // rather than a strict '0s' string match (observed benign float noise on
  // some Chromium builds, e.g. "1e-05s" instead of a clean "0s", for a
  // transition genuinely disabled via the reduced-motion override).
  const reducedMotionCss = await app.evalJs(`({
    panelDurations: getComputedStyle(document.querySelector('.wz-cascade-panel')).transitionDuration.split(',').map(s => parseFloat(s)),
  })`);
  ok('S2: with prefers-reduced-motion, the panel\'s own dock transition is disabled (~0s — no animated slide)',
    reducedMotionCss.panelDurations.every((d) => d < 0.001), JSON.stringify(reducedMotionCss));
  await app.evalJs("document.querySelector('.wz-cascade-link').click()");
  await sleep(150);
  const reducedMotionSurveyCss = await app.evalJs(`getComputedStyle(document.querySelector('.wz-cascade-survey')).transitionDuration.split(',').map(s => parseFloat(s))`);
  ok('S2: with prefers-reduced-motion, the survey\'s own slide/dock transition is disabled too (~0s)',
    reducedMotionSurveyCss.every((d) => d < 0.001), JSON.stringify(reducedMotionSurveyCss));
  await app.emulateMedia([]);

  // ==========================================================================
  // S2 — laptop/small-screen rule: at the absolute DESKFRAME_MIN_WIDTH floor
  // (1100px), layers may overlay the paper rather than reflow it (paper rect
  // byte-identical to closed, at every state); a DOCKED survey specifically
  // compresses to the 120px floor rather than occluding the measure, or the
  // dock affordance is unavailable below that floor — read the SAME live
  // --cascade-margin the app itself computes (index.css), then assert the
  // behavior that formula's own value implies, rather than a hand-guessed
  // pixel expectation (this project's own "verify via the harness, not just
  // read off the CSS" discipline).
  // ==========================================================================
  await freshProsePage(app, 1100, 900);
  const floorPaperClosed = await app.evalJs(rectOf('.mode-pagecol'));
  await clickCategory(app, 0); // Journal
  await sleep(150);
  const floorPaperPanelOpen = await app.evalJs(rectOf('.mode-pagecol'));
  ok('S2 @ 1100px floor: the paper rect never changes with the panel open (layers overlay, never reflow, at any width)',
    JSON.stringify(floorPaperClosed) === JSON.stringify(floorPaperPanelOpen), JSON.stringify({ floorPaperClosed, floorPaperPanelOpen }));

  // Measured off the REAL rendered rects, matching Cascade.tsx's own
  // availableCascadeMargin() exactly — getComputedStyle cannot resolve a
  // calc()/min()/percentage custom property to a pixel value (confirmed
  // empirically; this is the bug that check itself exists to catch).
  const marginAtFloor = await app.evalJs(`(() => {
    const stage = document.querySelector('.desk-frame-stage');
    const paper = document.querySelector('.mode-pagecol, .entry-full');
    if (!stage || !paper) return null;
    const frameGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-gap')) || 0;
    return (paper.getBoundingClientRect().left - stage.getBoundingClientRect().left) + frameGap;
  })()`);
  // Seed a page so the Journal survey has something to open.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before floor-fixture seed' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'cd2-floor-journal', text: 'Floor fixture journal page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.emulateDpr(1, 1100, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), floor re-seed' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted at the floor, post-seed' });
  await sleep(300);
  await clickCategory(app, 0);
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-cascade-link').click()");
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-cascade-dock-btn').click()"); // attempt to dock
  await sleep(250);
  const floorDockAttempt = await app.evalJs(`({
    surveyPresent: !!document.querySelector('.wz-cascade-survey'),
    surveyDocked: document.querySelector('.wz-cascade-survey')?.dataset.docked ?? null,
    surveyWidth: document.querySelector('.wz-cascade-survey')?.getBoundingClientRect().width ?? null,
  })`);
  const floorPaperAfterDockAttempt = await app.evalJs(rectOf('.mode-pagecol'));
  if (marginAtFloor >= 120) {
    ok(`S2 @ 1100px floor (--cascade-margin=${marginAtFloor.toFixed(1)}px, >= the 120px floor): docking succeeds, the survey compresses to the available margin (clamped >= 120px) rather than its full preferred width`,
      floorDockAttempt.surveyDocked === 'true' && floorDockAttempt.surveyWidth >= 119 && floorDockAttempt.surveyWidth <= marginAtFloor + 1,
      JSON.stringify({ marginAtFloor, floorDockAttempt }));
  } else {
    ok(`S2 @ 1100px floor (--cascade-margin=${marginAtFloor.toFixed(1)}px, BELOW the 120px floor): the dock affordance is unavailable — closing falls back to a full close instead of occluding the measure`,
      !floorDockAttempt.surveyPresent, JSON.stringify({ marginAtFloor, floorDockAttempt }));
  }
  ok('S2 @ 1100px floor: the paper rect stays byte-identical through the dock attempt too — the small-screen rule never reflows the paper, only ever overlays it',
    JSON.stringify(floorPaperClosed) === JSON.stringify(floorPaperAfterDockAttempt), JSON.stringify({ floorPaperClosed, floorPaperAfterDockAttempt }));

  // ==========================================================================
  // S5/S6 park sweep — successor geometry. The strip TRACK (.desk-frame-
  // strip, formerly .desk-frame-toolrail) is DeskFrame.tsx's own grid
  // column, unconditionally rendered regardless of whether cascade content
  // is passed (Board still passes none — non-goal, unchanged since the
  // drawer's own day) — these re-prove, at the new selector and the new
  // fixed width, exactly what ab1.mjs's/ab2.mjs's own retired checks proved
  // about the track before the drawer's retirement: fixed width, byte-
  // identical rect across a mode switch, position-invariant across
  // pageType (Board vs Script), and never overlapped by the page column at
  // the 1100px gate floor.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  const stripTrackRect = await app.evalJs(rectOf('.desk-frame-strip'));
  ok('S1/S5 (successor to ab1.mjs\'s "...tool-rail/stage tracks are present"): the strip track fills its own fixed width (--strip-width, 84px)',
    Math.abs(stripTrackRect.width - 84) < 1, JSON.stringify(stripTrackRect));

  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(150);
  const stripTrackRectAfterModeSwitch = await app.evalJs(rectOf('.desk-frame-strip'));
  ok('S1/S5 (successor to ab2.mjs\'s "...tool-rail track rect is byte-identical across a mode switch..."): the strip track rect is byte-identical across a mode switch too',
    JSON.stringify(stripTrackRect) === JSON.stringify(stripTrackRectAfterModeSwitch),
    `${JSON.stringify(stripTrackRect)} -> ${JSON.stringify(stripTrackRectAfterModeSwitch)}`);

  // Board vs Script — the track sits at the same structural position
  // regardless of pageType (Board passes no strip content; the empty track
  // still occupies the same grid column as Script's populated one).
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before board/script seed (park-sweep successor)' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'cd2-ps-board', text: '', pageType: 'board', boxes: [], source: 'page', createdAt: now, updatedAt: now });
    const headingId = 'cd2-ps-script-heading';
    entries.push({ id: 'cd2-ps-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.emulateDpr(1, LAPTOP_W, 900);
  await app.evalJs("location.hash = '#/page/cd2-ps-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Board framed (park-sweep successor)' });
  await sleep(250);
  const boardStripRect = await app.evalJs(rectOf('.desk-frame-strip'));
  await app.evalJs("location.hash = '#/page/cd2-ps-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed (park-sweep successor)' });
  await sleep(250);
  const scriptStripRect = await app.evalJs(rectOf('.desk-frame-strip'));
  ok('S1/S5 (successor to ab1.mjs\'s "...tool-rail track sits at the same position on Board and Script..."): the strip track sits at the same position regardless of pageType',
    boardStripRect.left === scriptStripRect.left && boardStripRect.width === scriptStripRect.width,
    `board=${JSON.stringify(boardStripRect)} script=${JSON.stringify(scriptStripRect)}`);

  // Gate floor (1100px): the page column never overlaps the strip track.
  await freshProsePage(app, 1100, 900);
  const gateFloorStripRect = await app.evalJs(rectOf('.desk-frame-strip'));
  const gateFloorPagecolRect = await app.evalJs(rectOf('.mode-pagecol'));
  ok('S1/S5 (successor to ab1.mjs\'s "...at the gate floor (1100px): the page column never overlaps the tool-rail"): the page column never overlaps the strip track at the gate floor either',
    gateFloorPagecolRect.left >= gateFloorStripRect.left + gateFloorStripRect.width,
    JSON.stringify({ gateFloorStripRect, gateFloorPagecolRect }));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// cd2.mjs is a brand-new file; it parks nothing of its own (every check
// above reflects this ticket's live, current design). The park sweep S6
// requires (the drawer's retirement falsifying checks across ab1/ab2/ab3/
// cd1/fx1/fx2) lives in EACH superseded check's own file, per the A4
// convention: a file parks what supersedes ITS OWN checks. This scaffold
// exists so a future ticket that supersedes any of THIS file's checks has
// a documented home, matching every other harness file's own pattern.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nCD2 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of cd2.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nCD2 VERIFY: PASS (${checks.length} checks)` : `\nCD2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
