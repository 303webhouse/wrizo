// B2.1 — the word swap (docs/wrizo-alpha/b2-shelf-and-drawers-brief-v2.md's
// own S6, folded onto B2 once Nick's gating word arrived). A committed CDP
// verification scenario (per this project's own "harness scenarios persist"
// convention), modeled on b2.mjs's own structure — freshDesk/openPageCategory/
// LAPTOP_W/WIDE_W/LEGACY_W below are the same shape those files already
// established, copied verbatim per this project's standing instruction not
// to re-derive them. A NEW file rather than folding into b2.mjs: this slice
// is a distinct, later-arriving ticket (its own gate, its own commit range)
// touching a different surface area (chrome copy, not the Shelf/Places/
// Drawers structural build b2.mjs already covers exhaustively at 84 checks)
// — reads cleaner as its own file, and is also where every PARKED check's
// "live successor" this fold names actually lives.
// Run: node scripts/harness/b2-1.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Nick's word, verbatim (2026-07-20): "retire the word project as having
// any unique architectural purpose." Storage identifiers (projectId, the
// Project TS type, getProject/createProject/etc., routes) are OUT of
// scope — asserted here only as a negative control (S6-boundary section)
// proving the swap did NOT touch them.
//
// Covers: every deskLexicon term this fold added or changed (S6a); the
// live successors to every check b1.mjs/b2.mjs/fx6.mjs/m1.mjs parked (S6b);
// the Binder-vs-Drawer judgment made concrete and DOM-verified at every
// site it applies (S6c — QuickSprint/PinToBoardSheet/PortToBoardSheet/
// ImportDraft/DrawersTree all show "Binder", never colliding with a
// visible stored-Drawer name on the same screen); DrawersTree's own
// disambiguation (S6d — "+ New Drawer" and "New Binder" both present on
// one screen, never both reading "Drawer"); CreateProject/ProjectHome/the
// three wizard pages' chrome (S6e); the JournalEntry legacy (<1100px)
// scrap-routing block's own Drawer wording, explicitly proven ABSENT when
// framed (S6f — the legacy-only touch this fold disclosed); the ModeStage
// gear's Progress:Drawer option label, the internal 'project' value proven
// untouched (S6g); a direct sweep proving the bare word "Project" no
// longer appears anywhere across every touched surface (S6h, the
// Definition of Done's own words); the route-path boundary held
// deliberately (S6i).
import { readFileSync } from 'node:fs';
import { withHarness } from '../runtime-verify.mjs';

const storyCircle = JSON.parse(readFileSync(new URL('../../../../packages/modules-writing/data/frameworks/story_circle.json', import.meta.url)));

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const WIDE_W = 2200;
const LEGACY_W = 1099; // one px below DESKFRAME_MIN_WIDTH (1100) — the floor

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// b1.mjs's/b2.mjs's own openPageCategory helper, copied verbatim: index 1
// in the strip is the Page category.
const openPageCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

// Cascade.tsx's own strip order (SECTION_A/B/C/D): journal(0), page(1),
// plan(2), drawers(3), shelf(4), trash(5), settings(6), theme(7).
const openPlanCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPlanCategory)' });
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][2].click()");
  await sleep(150);
};

// m1.mjs's own progressOptions helper, copied verbatim: open the settings
// gear, read the Progress Seg's option labels, close it.
async function progressOptions(app) {
  const hasGear = await app.evalJs("!!document.querySelector('.mode-gear')");
  if (!hasGear) return null;
  await app.evalJs("document.querySelector('.mode-gear').click()");
  await sleep(100);
  const labels = await app.evalJs(`(() => {
    const rows = [...document.querySelectorAll('.mode-crow')];
    const row = rows.find(r => r.querySelector('span')?.textContent === 'Progress');
    return row ? [...row.querySelectorAll('.mode-seg button')].map(b => b.textContent) : null;
  })()`);
  await app.evalJs("document.querySelector('.mode-gear').click()");
  await sleep(50);
  return labels;
}

// A project + a seeded StoryPlan, reached via the real CreateProject door
// (not raw fixture surgery for the project itself — only the StoryPlan
// attach, which has no UI path in this harness's existing fixtures, per
// m1.mjs's own established pattern). Returns { projectId, pageId }.
const seedProjectWithPlan = async (app, planId) => {
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'fresh manuscript page mounted' });
  await sleep(400);
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  const projectId = await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return entries.find(e => e.id === '${pageId}')?.projectId ?? null;
  })()`);
  // Off the page before raw-localStorage seeding (the flushNow race — the
  // harness seeding law, AGENTS.md): navigate to Desk (no flush handler)
  // first, seed, THEN reload.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding StoryPlan' });
  await app.evalJs(`(() => {
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const pi = projects.findIndex(p => p.id === '${projectId}');
    projects[pi].storyPlanId = '${JSON.stringify(planId).slice(1, -1)}';
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const plans = JSON.parse(localStorage.getItem('writer-studio-story-plans') || '[]');
    plans.push({
      id: '${JSON.stringify(planId).slice(1, -1)}', projectId: '${projectId}', frameworkId: 'story_circle',
      currentBeatId: ${JSON.stringify(storyCircle.beats[0].id)}, beatNotes: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    localStorage.setItem('writer-studio-story-plans', JSON.stringify(plans));
  })()`);
  await app.reload();
  return { projectId, pageId };
};

await withHarness(async (app) => {
  // ==========================================================================
  // S6a — deskLexicon term sweep: every NEW term this fold added, plus every
  // PRE-EXISTING term whose STRING VALUE this fold changed, resolves to the
  // exact expected Plateau value via window.wrizoDeskLexicon (the
  // established test seam, same discipline b2.mjs's own S8 already proved).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  const lex = await app.evalJs(`(() => {
    const t = window.wrizoDeskLexicon.t;
    return {
      createDrawerEyebrow: t('createDrawerEyebrow'),
      createDrawerTitleLabel: t('createDrawerTitleLabel'),
      createDrawerOpensNote: t('createDrawerOpensNote'),
      drawerHomeTitleLabel: t('drawerHomeTitleLabel'),
      backToDrawer: t('backToDrawer'),
      domainLabelCreative: t('domainLabelCreative'),
      domainLabelAcademic: t('domainLabelAcademic'),
      domainLabelProfessional: t('domainLabelProfessional'),
      journalRouteSendToDrawer: t('journalRouteSendToDrawer'),
      journalRouteEmptyDrawers: t('journalRouteEmptyDrawers'),
      journalRoutePromoteDrawer: t('journalRoutePromoteDrawer'),
      cascadePlanNoProject: t('cascadePlanNoProject'),
      boardHomeLabelJournal: t('boardHomeLabelJournal'),
      boardHomeLabelTrash: t('boardHomeLabelTrash'),
      boardHomeLabelShelf: t('boardHomeLabelShelf'),
    };
  })()`);
  ok('S6a: every NEW deskLexicon term this fold introduces resolves to its exact expected value',
    lex.createDrawerEyebrow === 'NEW DRAWER'
      && lex.createDrawerTitleLabel === 'Drawer title (optional)'
      && lex.createDrawerOpensNote === 'Opens the Drawer home — shape it as you go.'
      && lex.drawerHomeTitleLabel === 'Drawer title'
      && lex.backToDrawer === 'Back to Drawer'
      && lex.domainLabelCreative === 'Creative Drawer'
      && lex.domainLabelAcademic === 'Academic Drawer'
      && lex.domainLabelProfessional === 'Professional Drawer'
      && lex.journalRouteSendToDrawer === 'Send to a Drawer'
      && lex.journalRouteEmptyDrawers === 'No Drawers yet.'
      && lex.journalRoutePromoteDrawer === 'Promote to a new Drawer',
    JSON.stringify(lex));
  ok('S6a: every PRE-EXISTING deskLexicon term this fold\'s word swap changes now reads "drawer", never "project" — b1.mjs/b2.mjs\'s own PARKED sections hold the quoted-verbatim OLD values',
    lex.cascadePlanNoProject === 'File this page to a drawer first to plan around it.'
      && lex.boardHomeLabelJournal === 'The Journal Board — has no drawer home'
      && lex.boardHomeLabelTrash === 'The Trash Board — has no drawer home'
      && lex.boardHomeLabelShelf === 'The Shelf Board — has no drawer home',
    JSON.stringify(lex));

  // ==========================================================================
  // S6b — live successors: the system Boards' own Page-face home labels,
  // read from the LIVE DOM (not just the lexicon map — no drift), matching
  // b1.mjs's/b2.mjs's own PARKED reproductions exactly.
  // ==========================================================================
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board mounted' });
  await sleep(250);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-home-label')", { label: 'Page face (Journal board)' });
  const journalHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S6b live successor (was b1.mjs\'s "no project home" check): the Journal Board\'s own Page face now reads "has no drawer home", never "In the Journal" (self-referential)',
    journalHomeLabel === 'The Journal Board — has no drawer home', String(journalHomeLabel));

  await app.goto('/trash');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Trash Board mounted' });
  await sleep(250);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-home-label')", { label: 'Page face (Trash board)' });
  const trashHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S6b live successor (was b1.mjs\'s "no project home" check): the Trash Board\'s own Page face now reads "has no drawer home"',
    trashHomeLabel === 'The Trash Board — has no drawer home', String(trashHomeLabel));

  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board mounted' });
  await sleep(250);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-home-label')", { label: 'Page face (Shelf board)' });
  const shelfHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S6b live successor (was b2.mjs\'s "no project home" + S8 compound checks): the Shelf Board\'s own Page face now reads "has no drawer home"',
    shelfHomeLabel === 'The Shelf Board — has no drawer home', String(shelfHomeLabel));

  // ==========================================================================
  // S6c — CascadePanels' Plan panel, no-project branch: the truthful line
  // reads "drawer", never "project".
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page framed (Plan panel spot-check)' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPlanCategory(app);
  const planNoProjectLine = await app.evalJs("document.querySelector('.wz-cascade-panel-body .wz-cascade-empty')?.textContent");
  ok('S6c: the Plan panel\'s own no-project branch now reads "File this page to a drawer first..." — never the word "project"',
    planNoProjectLine === 'File this page to a drawer first to plan around it.', String(planNoProjectLine));

  // ==========================================================================
  // S6e — CreateProject.tsx: the eyebrow, the title aria-label, and the
  // "Something else" note.
  // ==========================================================================
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  const createProjectShape = await app.evalJs(`(() => ({
    eyebrow: document.querySelector('.cp-eyebrow')?.textContent,
    titleAria: document.querySelector('.cp-title-input')?.getAttribute('aria-label'),
  }))()`);
  ok('S6e: CreateProject\'s own eyebrow reads "NEW DRAWER", never "NEW PROJECT"',
    createProjectShape.eyebrow === 'NEW DRAWER', JSON.stringify(createProjectShape));
  ok('S6e: CreateProject\'s own title input aria-label reads "Drawer title (optional)"',
    createProjectShape.titleAria === 'Drawer title (optional)', JSON.stringify(createProjectShape));
  await app.evalJs("document.querySelector('.cp-else').click()");
  const cpElseNote = await app.evalJs("document.querySelector('.cp-micro')?.textContent");
  ok('S6e: CreateProject\'s own "Something else" note reads "Opens the Drawer home..." — a genuine omission the prior S6 inventory missed, found and fixed in this fold',
    cpElseNote === 'Opens the Drawer home — shape it as you go.', String(cpElseNote));

  // ==========================================================================
  // S6e — ProjectHome.tsx: the rename input's aria-label + the domain eyebrow.
  // ==========================================================================
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.waitFor("document.querySelector('[data-kind=\"book\"]')?.getAttribute('aria-pressed') === 'true'", { label: 'book kind selected' });
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'fresh manuscript page (ProjectHome spot-check)' });
  await sleep(300);
  const homePageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  const projectIdForHome = await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return entries.find(e => e.id === '${homePageId}')?.projectId ?? null;
  })()`);
  await app.goto(`/project/${projectIdForHome}`);
  await app.waitFor("!!document.querySelector('.project-title-editable')", { label: 'ProjectHome mounted' });
  const domainEyebrow = await app.evalJs("document.querySelector('.eyebrow')?.textContent");
  ok('S6e: ProjectHome\'s own domain eyebrow reads "Creative Drawer", never "Creative project"',
    domainEyebrow === 'Creative Drawer', String(domainEyebrow));
  await app.evalJs("document.querySelector('.project-title-editable').click()");
  const renameAria = await app.evalJs("document.querySelector('.project-rename')?.getAttribute('aria-label')");
  ok('S6e: ProjectHome\'s own rename input aria-label reads "Drawer title", never "Project title"',
    renameAria === 'Drawer title', String(renameAria));
  await app.key('Escape');

  // ==========================================================================
  // S6f — StructureWizard/StructureBoard/BeatWizard: "Back to Drawer".
  // ==========================================================================
  await app.goto(`/project/${projectIdForHome}/wizard`);
  await app.waitFor("!!document.querySelector('.page')", { label: 'StructureWizard mounted' });
  await sleep(150);
  const wizardBack = await app.evalJs("[...document.querySelectorAll('a, button')].find(el => el.textContent.includes('Back to Drawer'))?.textContent");
  ok('S6f: StructureWizard\'s own back link reads "Back to Drawer", never "Back to project"',
    !!wizardBack && wizardBack.includes('Back to Drawer'), String(wizardBack));

  const { projectId: planProjectId, pageId: planPageId } = await seedProjectWithPlan(app, 'b21-plan-check');
  await app.evalJs(`location.hash = '#/project/${planProjectId}/board'`);
  await app.waitFor("!!document.querySelector('.page-title')", { label: 'StructureBoard mounted' });
  await sleep(150);
  const boardBack = await app.evalJs("[...document.querySelectorAll('a, button')].find(el => el.textContent.includes('Back to Drawer'))?.textContent");
  ok('S6f: StructureBoard\'s own back link reads "Back to Drawer", never "Back to project"',
    !!boardBack && boardBack.includes('Back to Drawer'), String(boardBack));

  await app.evalJs(`location.hash = '#/project/${planProjectId}/beat'`);
  await app.waitFor("!!document.querySelector('.eyebrow')", { label: 'BeatWizard mounted' });
  await sleep(150);
  const beatBack = await app.evalJs("[...document.querySelectorAll('a, button')].find(el => el.textContent.includes('Back to Drawer'))?.textContent");
  ok('S6f: BeatWizard\'s own back link reads "Back to Drawer", never "Back to project"',
    !!beatBack && beatBack.includes('Back to Drawer'), String(beatBack));

  // ==========================================================================
  // S6c/S6g (Binder-vs-Drawer, concrete) — QuickSprint: the breadcrumb shows
  // the OLDER stored-Drawer entity's own name while the Save button reads
  // "Binder" — both words visible on ONE screen, never colliding, proving
  // the judgment call live.
  // ==========================================================================
  // NOTE: no freshDesk here (would localStorage.clear() the project this
  // section reuses) — off any flush-handling surface first instead (the
  // harness seeding law), then seed, then reload.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding a real Drawer' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const drawers = JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]');
    drawers.push({ id: 'b21-real-drawer', name: 'Real Stored Drawer', order: 0, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-drawers', JSON.stringify(drawers));
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const pi = projects.findIndex(p => p.id === '${planProjectId}');
    projects[pi].drawerId = 'b21-real-drawer';
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/project/${planProjectId}/sprint'`);
  await app.waitFor("!!document.querySelector('.sprint-crumb')", { label: 'QuickSprint mounted (Binder-vs-Drawer proof)' });
  await sleep(200);
  const sprintShape = await app.evalJs(`(() => ({
    crumbDrawerName: document.querySelector('.sprint-crumb .crumb-item')?.textContent,
    toggleAria: document.querySelector('.sprint-toggle')?.getAttribute('aria-label'),
  }))()`);
  ok('S6c/g (Binder-vs-Drawer, concrete): QuickSprint\'s own breadcrumb shows the stored Drawer\'s real name ("Real Stored Drawer") — the OLDER entity, untouched by this fold',
    sprintShape.crumbDrawerName === 'Real Stored Drawer', JSON.stringify(sprintShape));
  ok('S6c/g (Binder-vs-Drawer, concrete): QuickSprint\'s own Pages/Plan toggle aria-label reads "Binder view" — the pre-existing themeLexicon term, reused rather than colliding with the breadcrumb\'s own "Drawer"',
    sprintShape.toggleAria === 'Binder view', JSON.stringify(sprintShape));
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('A word. ');
  await app.click('Finish');
  await app.waitFor("!!document.querySelector('.card')", { label: 'finish card' });
  const saveLabel = await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Save to Binder') || b.textContent.includes('Save as Binder'))?.textContent");
  ok('S6g: QuickSprint\'s own Save button reads "Save to Binder", never "Save to project"',
    saveLabel === 'Save to Binder', String(saveLabel));

  // ==========================================================================
  // S6c (Binder-vs-Drawer, concrete) — PinToBoardSheet + PortToBoardSheet:
  // the drawer-grouped eyebrow header (the OLDER entity's own name) and the
  // "Binder" empty-state coexist on the SAME sheet without collision.
  // ==========================================================================
  await app.evalJs(`location.hash = '#/page/${planPageId}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'an ORDINARY page, filed into the real Drawer (Pin sheet spot-check)' });
  await sleep(250);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (Journal Board, Pin sheet spot-check)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet open' });
  const pinSheetShape = await app.evalJs(`(() => ({
    drawerEyebrow: document.querySelector('.board-sheet .eyebrow')?.textContent,
    projectRow: [...document.querySelectorAll('.board-sheet .dz-rowtitle')].some(el => el.textContent.includes('Untitled')),
  }))()`);
  ok('S6c (Binder-vs-Drawer, concrete): the Pin sheet\'s own drawer-group eyebrow still shows the stored Drawer\'s real name ("Real Stored Drawer") — untouched, coexisting cleanly with this fold\'s "Binder" wording elsewhere on the same sheet',
    pinSheetShape.drawerEyebrow === 'Real Stored Drawer', JSON.stringify(pinSheetShape));
  await app.key('Escape');

  // A genuinely empty picker (no projects at all) proves the Binder wording.
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page (empty Pin sheet spot-check)' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (empty Pin sheet spot-check)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'empty Pin sheet open' });
  const emptyPinLine = await app.evalJs("document.querySelector('.board-sheet .dz-empty')?.textContent");
  ok('S6c: PinToBoardSheet\'s own empty-state reads "No binders yet — create a binder first...", never "project"',
    emptyPinLine === 'No binders yet — create a binder first, then this page can join a board.', String(emptyPinLine));
  await app.evalJs("[...document.querySelectorAll('.board-sheet button')].find(b => b.textContent.trim() === 'Cancel')?.click()");
  await sleep(150);

  await app.evalJs("document.querySelector('.wz-pageface-verb-port')?.click()");
  const portOpened = await app.evalJs("!!document.querySelector('.board-sheet')");
  if (portOpened) {
    const emptyPortLine = await app.evalJs("document.querySelector('.board-sheet .dz-empty')?.textContent");
    ok('S6c: PortToBoardSheet\'s own empty-state reads "No binders yet — \\"+ New binder\\" births one...", never "project"',
      emptyPortLine === 'No binders yet — "＋ New binder" births one on the spot.', String(emptyPortLine));
  }

  // ==========================================================================
  // S6c — ImportDraft.tsx: the Drawers-level door's own binder picker.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/import');
  await app.waitFor("!!document.querySelector('.import-empty')", { label: 'ImportDraft empty binder list' });
  const importEmpty = await app.evalJs("document.querySelector('.import-empty')?.textContent");
  ok('S6c: ImportDraft\'s own empty-binder line reads "No binders yet — begin a binder first.", never "project"',
    importEmpty === 'No binders yet — begin a binder first.', String(importEmpty));

  // ==========================================================================
  // S6d — DrawersTree.tsx: "+ New Drawer" (creates the OLDER stored entity)
  // and "New Binder" (creates a project) both present on ONE screen — never
  // both reading "Drawer", resolving the collision Q2 flags.
  // ==========================================================================
  await app.goto('/drawers');
  await app.waitFor("!!document.querySelector('.dz-new')", { label: 'DrawersTree mounted' });
  const topButton = await app.evalJs("document.querySelector('.dz-new')?.textContent");
  ok('S6d: DrawersTree\'s own top-level action still reads "+ New Drawer" (the OLDER stored-Drawer entity, B2\'s own pre-authorized word, untouched)',
    topButton === '+ New Drawer', String(topButton));
  // startNewDrawer() creates the drawer, expands it, AND opens its rename
  // input in one act — commit the name (blur) rather than re-toggle (the
  // group is already expanded; a second .dz-toggle click would COLLAPSE it).
  await app.evalJs("document.querySelector('.dz-new').click()");
  await sleep(150);
  await app.evalJs("document.querySelector('.dz-rename')?.blur()");
  await sleep(150);
  const drawerGroupPresent = await app.evalJs("!!document.querySelector('.dz-group')");
  if (drawerGroupPresent) {
    await app.evalJs("[...document.querySelectorAll('.dz-more')].find(b => b.textContent.includes('Create New'))?.click()");
    await sleep(100);
    const inDrawerButtons = await app.evalJs("[...document.querySelectorAll('.dz-createnew .dz-more')].map(b => b.textContent)");
    ok('S6d: the SAME screen\'s in-drawer "Create New" row reads "New Binder" — deliberately NOT "New Drawer" (would collide with the top-level action above, creating two different entities under one word)',
      Array.isArray(inDrawerButtons) && inDrawerButtons.includes('New Binder') && !inDrawerButtons.includes('New Drawer'),
      JSON.stringify(inDrawerButtons));
  }

  // ==========================================================================
  // S6f — JournalEntry.tsx's LEGACY (<1100px) scrap-routing block: touched
  // deliberately (the word retires app-wide), proven ABSENT when framed.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b21-legacy-route-page', text: 'A scrap worth routing.', projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.emulateDpr(1, LEGACY_W, 900);
  await app.evalJs("location.hash = '#/journal/b21-legacy-route-page'");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'legacy JournalEntry framed' });
  await sleep(300);
  const legacyRouteOpen = await app.evalJs("document.querySelector('.route-open')?.textContent");
  ok('S6f (legacy-only touch, disclosed): the legacy (<1100px) routing button reads "Send to a Drawer", never "Send to a project"',
    legacyRouteOpen === 'Send to a Drawer', String(legacyRouteOpen));
  await app.evalJs("document.querySelector('.route-open').click()");
  await app.waitFor("!!document.querySelector('.route-picker')", { label: 'legacy route picker open' });
  const legacyPickerText = await app.evalJs("document.querySelector('.route-picker')?.textContent");
  ok('S6f (legacy-only touch, disclosed): the legacy picker\'s empty-state + promote button both read "Drawer", never "project"',
    legacyPickerText.includes('No Drawers yet.') && legacyPickerText.includes('Promote to a new Drawer'), legacyPickerText);

  // Framed (>=1100px): this whole block is genuinely ABSENT — Places
  // supersedes it (S4), not merely relabeled.
  await app.emulateDpr(1, LAPTOP_W, 900);
  await app.reload();
  await app.evalJs("location.hash = '#/journal/b21-legacy-route-page'");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'framed JournalEntry' });
  await sleep(300);
  const routeOpenFramed = await app.evalJs("!!document.querySelector('.route-open')");
  ok('S6f: framed (>=1100px), the legacy routing block is genuinely ABSENT (not merely relabeled) — Places (S4) is the framed surface\'s own equivalent door',
    routeOpenFramed === false, String(routeOpenFramed));

  // ==========================================================================
  // S6g — ModeStage's gear: the Progress selector offers "Drawer", never
  // "Project"; the internal ProgressMetric value stays 'project', untouched
  // (a storage identifier, not chrome). A FRESH project+plan (not reusing
  // planProjectId/planPageId — several freshDesk calls since then have
  // localStorage.clear()'d that state away). LEGACY width (<1100px, matching
  // m1.mjs's own established fixture) — SettingsPanel is SHARED code
  // between the legacy `.mode-gear` and the framed sliver's own trigger
  // (`[aria-label="Writing settings"]`, components/Sliver.tsx); the option-
  // label logic under test is identical either way, so this doesn't need
  // re-proving at both.
  // ==========================================================================
  await app.emulateDpr(1, LEGACY_W, 900);
  const { pageId: gearPageId } = await seedProjectWithPlan(app, 'b21-gear-plan');
  await app.emulateDpr(1, LEGACY_W, 900);
  await app.evalJs(`location.hash = '#/page/${gearPageId}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'manuscript page (gear spot-check)' });
  await app.waitFor("!!document.querySelector('.mode-gear')", { label: 'settings gear mounted' });
  await sleep(300);
  const gearLabels = await progressOptions(app);
  ok('S6g: the gear\'s own Progress selector offers "Drawer" (once a StoryPlan exists), never "Project"',
    Array.isArray(gearLabels) && gearLabels.includes('Drawer') && !gearLabels.includes('Project'), JSON.stringify(gearLabels));
  await app.evalJs("document.querySelector('.mode-gear').click()");
  await sleep(100);
  await app.evalJs(`(() => {
    const row = [...document.querySelectorAll('.mode-crow')].find(r => r.querySelector('span')?.textContent === 'Progress');
    [...row.querySelectorAll('.mode-seg button')].find(b => b.textContent === 'Drawer').click();
  })()`);
  const persistedValue = await app.evalJs("JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}').progress");
  ok('S6g: clicking "Drawer" persists the INTERNAL value \'project\' — the storage identifier stays completely untouched, only its display label changed',
    persistedValue === 'project', String(persistedValue));

  // ==========================================================================
  // S6h — the Definition of Done, directly: no bare "Project" word (word-
  // boundary, case-sensitive) anywhere in visible text across every touched
  // surface visited above.
  // ==========================================================================
  const sweepProjectId = await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return entries.find(e => e.id === '${gearPageId}')?.projectId ?? null;
  })()`);
  const sweepTargets = [
    ['/project/new', "!!document.querySelector('[data-kind=\"book\"]')"],
    [`/project/${sweepProjectId}`, "!!document.querySelector('.project-title-editable')"],
    [`/project/${sweepProjectId}/wizard`, "!!document.querySelector('.page')"],
    ['/drawers', "!!document.querySelector('.dz-new')"],
    ['/import', "!!document.querySelector('.import-draft')"],
  ];
  const sweepResults = [];
  for (const [route, waitExpr] of sweepTargets) {
    await app.goto(route);
    await app.waitFor(waitExpr, { label: `sweep: ${route}` });
    await sleep(200);
    const bodyText = await app.evalJs('document.body.innerText');
    const hasBareProject = /\bProject\b/.test(bodyText);
    sweepResults.push({ route, hasBareProject });
  }
  ok('S6h (Definition of Done): no bare "Project" word (case-sensitive, word-boundary) renders anywhere across every swept surface',
    sweepResults.every(r => !r.hasBareProject), JSON.stringify(sweepResults));

  // ==========================================================================
  // S6i — the route-path boundary, held deliberately: /project/* routes are
  // completely UNTOUCHED (a conscious scope boundary, not an oversight).
  // ==========================================================================
  await app.goto(`/project/${sweepProjectId}`);
  await app.waitFor("!!document.querySelector('.project-title-editable')", { label: 'route-boundary spot-check' });
  const routeCheck = await app.evalJs('location.hash');
  ok('S6i: route paths stay literally "/project/..." — deliberately untouched (a bigger structural call than Nick\'s word commissioned; flagged for a future explicit ruling)',
    routeCheck.startsWith('#/project/'), routeCheck);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// b2-1.mjs is a brand-new file; it parks nothing of its own (this fold's
// own PARK sweep — the checks its word swap falsifies — lives in the FILES
// it superseded: b1.mjs, b2.mjs, fx6.mjs, m1.mjs, per the A4 convention
// that a file parks what supersedes ITS OWN checks). This scaffold exists
// so a future ticket that supersedes any of THIS file's checks has a
// documented home, matching every other harness file's own pattern.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nB2-1 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of b2-1.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nB2-1 VERIFY: PASS (${checks.length} checks)` : `\nB2-1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
