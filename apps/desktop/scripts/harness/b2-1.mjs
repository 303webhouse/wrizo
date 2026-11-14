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
//
// Review fix (independent re-verification, same date) — CreateProject.tsx
// and QuickSprint.tsx both had genuine gaps: a "Binder"-labeled action
// landing on a screen that unconditionally read "Drawer" for the SAME
// entity/action, one navigation hop later (S6e/S6g below now cover both
// directions). QuickSprint's own S6g check needed PARKING (A4) as a
// result — see this file's own PARKED section at the bottom, its first
// tenant.
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
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 7", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("document.querySelector('.wz-strip-item[data-category=page]').click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

// Cascade.tsx's own strip order (SECTION_A/B/C/D): journal(0), page(1),
// plan(2), drawers(3), shelf(4), trash(5), settings(6), theme(7).
const openPlanCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 7", { label: 'cascade strip mounted (openPlanCategory)' });
  await app.evalJs("document.querySelector('.wz-strip-item[data-category=plan]').click()");
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
// ITEM 85-C — planId is now a CALLER-SIDE LABEL only: createStoryPlan generates
// the plan id, so the value no longer reaches storage. Kept because each call
// site names its own fixture with it and nothing asserted on the id.
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
    // ITEM 85-C — createStoryPlan authors the plan AND stamps
    // project.storyPlanId, so both raw writes collapse into one call. The plan's
    // id is now GENERATED; this file never asserted on it, and the caller's
    // planId argument is retained only as a per-call label (see the note on the
    // parameter).
    //
    // ONE DIFFERENCE, FLAGGED: the raw plan had beatNotes: [] with currentBeatId
    // set. createStoryPlan derives BOTH from the beatIds it is given, so passing
    // the first beat yields the same currentBeatId and one empty-status beatNote
    // instead of none. Nothing in this file reads beatNotes — its subject is the
    // QuickSprint destination label, which needs only that a plan EXISTS — and a
    // plan carrying a beatNote for its framework's beat is closer to what the UI
    // actually produces than an empty array was.
    window.wrizoCreateStoryPlan('${projectId}', 'story_circle', [${JSON.stringify(storyCircle.beats[0].id)}]);
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
  // ARCHIVED PARK (#13 step 14): archive/b2-1.mjs.parked.md record 1
  const s11 = (k, v) => lex[k] === v || lex[k] === undefined;
  // ---- PARKED - SUPERSEDED by #13 step 12a (Nick's dormant answers, Oct 29): the old project screens go, and with them the last readers of
  // drawerHomeTitleLabel, backToDrawer and the three domainLabel* terms, which 12a deletes from the lexicon. The step 11 successor, kept
  // VERBATIM below and no longer run; its 12a successor and mutant follow (the same reading: a term's word while it exists, none once gone).
  // ok('S6a [step 11 successor]: every NEW deskLexicon term this fold introduces that is still in the lexicon resolves to its exact expected value; the four step 11 deletes (createDrawerOpensNote, journalRoute*) read theirs until they go',
    // lex.createDrawerEyebrow === 'NEW DRAWER'
      // && lex.createDrawerTitleLabel === 'Drawer title (optional)'
      // && s11('createDrawerOpensNote', 'Opens the Drawer home — shape it as you go.')
      // && lex.drawerHomeTitleLabel === 'Drawer title'
      // && lex.backToDrawer === 'Back to Drawer'
      // && lex.domainLabelCreative === 'Creative Drawer'
      // && lex.domainLabelAcademic === 'Academic Drawer'
      // && lex.domainLabelProfessional === 'Professional Drawer'
      // && s11('journalRouteSendToDrawer', 'Send to a Drawer')
      // && s11('journalRouteEmptyDrawers', 'No Drawers yet.')
      // && s11('journalRoutePromoteDrawer', 'Promote to a new Drawer'),
    // JSON.stringify(lex));
  ok('S6a [c13-12a successor]: every NEW deskLexicon term this fold introduces that is still in the lexicon resolves to its exact expected value; the four step 11 deletes and the five step 12a deletes (drawerHomeTitleLabel, backToDrawer, domainLabel*) read theirs until they go',
    lex.createDrawerEyebrow === 'NEW DRAWER'
      && lex.createDrawerTitleLabel === 'Drawer title (optional)'
      && s11('createDrawerOpensNote', 'Opens the Drawer home — shape it as you go.')
      && s11('drawerHomeTitleLabel', 'Drawer title')
      && s11('backToDrawer', 'Back to Drawer')
      && s11('domainLabelCreative', 'Creative Drawer')
      && s11('domainLabelAcademic', 'Academic Drawer')
      && s11('domainLabelProfessional', 'Professional Drawer')
      && s11('journalRouteSendToDrawer', 'Send to a Drawer')
      && s11('journalRouteEmptyDrawers', 'No Drawers yet.')
      && s11('journalRoutePromoteDrawer', 'Promote to a new Drawer'),
    JSON.stringify(lex));
  {
    const saved = lex.backToDrawer;
    lex.backToDrawer = 'Back to project';
    const red = !s11('backToDrawer', 'Back to Drawer');
    lex.backToDrawer = saved;
    ok('S6a [c13-12a successor mutant]: a deleted-later term that reads the WRONG word while it exists is red (only absence is excused)', red && s11('backToDrawer', 'Back to Drawer'), '');
  }
  // ARCHIVED PARK (#13 step 14): archive/b2-1.mjs.parked.md record 2
  ok('S6a [step 11 successor]: boardHomeLabelJournal/Trash/Shelf are the bare place name, and cascadePlanNoProject reads "drawer" until step 11 deletes it',
    s11('cascadePlanNoProject', 'File this page to a drawer first to plan around it.')
      && lex.boardHomeLabelJournal === 'Journal'
      && lex.boardHomeLabelTrash === 'Trash'
      && lex.boardHomeLabelShelf === 'Shelf',
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
  // ARCHIVED PARK (#13 step 14): archive/b2-1.mjs.parked.md record 3
  ok('S6b [word-diet successor]: the Journal Board\'s own Page face now reads the bare place name, "Journal"',
    journalHomeLabel === 'Journal', String(journalHomeLabel));

  await app.goto('/trash');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Trash Board mounted' });
  await sleep(250);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-home-label')", { label: 'Page face (Trash board)' });
  const trashHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  // ARCHIVED PARK (#13 step 14): archive/b2-1.mjs.parked.md record 4
  ok('S6b [word-diet successor]: the Trash Board\'s own Page face now reads the bare place name, "Trash"',
    trashHomeLabel === 'Trash', String(trashHomeLabel));

  await app.goto('/shelf-board');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board mounted' });
  await sleep(250);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-home-label')", { label: 'Page face (Shelf board)' });
  const shelfHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  // ARCHIVED PARK (#13 step 14): archive/b2-1.mjs.parked.md record 5
  ok('S6b [word-diet successor]: the Shelf Board\'s own Page face now reads the bare place name, "Shelf"',
    shelfHomeLabel === 'Shelf', String(shelfHomeLabel));

  // ==========================================================================
  // S6c — CascadePanels' Plan panel, no-project branch: the truthful line
  // reads "drawer", never "project".
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.waitFor("!!document.querySelector('.wz-arrival-write:not([disabled])')", { label: 'Write door enabled (#92: a click on a disabled door does nothing)' });
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page framed (Plan panel spot-check)' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPlanCategory(app);
  // ARCHIVED PARK (#13 step 14): archive/b2-1.mjs.parked.md record 6
  const boardsPanelText = await app.evalJs("document.querySelector('.wz-cascade-panel-body')?.innerText ?? ''");
  ok('S6c [big-projects-2 successor]: the Boards tab has no no-project lead at all (the file-this-page-to-a-drawer-first line is gone) - and never the word project', !boardsPanelText.includes('File this page to a drawer first') && !/project/i.test(boardsPanelText), boardsPanelText.slice(0, 160));

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
  // ---- PARKED - RETIRED by #13 step 12a (Fable's ruling, Oct 29: "Something else" is dropped from New project): the option and its note are
  // gone; the word-diet successor below (and the two lines that drove it) are kept VERBATIM and no longer run; record in the parked block.
  // c13-12a-doors.mjs D4 asserts the option's absence.
  // await app.evalJs("document.querySelector('.cp-else').click()");
  // const cpElseNote = await app.evalJs("document.querySelector('.cp-micro')?.textContent");
  // SUPERSEDED (item word-diet, Nick) — createDrawerOpensNote's render site
  // RETIRES whole (REMOVE); the lexicon entry itself is untouched, simply
  // never rendered for this branch now. ORIGINAL claim parked verbatim:
  // ok('S6e: CreateProject\'s own "Something else" note reads "Opens the Drawer home..." — a genuine omission the prior S6 inventory missed, found and fixed in this fold',
  //   cpElseNote === 'Opens the Drawer home — shape it as you go.', String(cpElseNote));
  // ok('S6e [word-diet successor]: CreateProject\'s own "Something else" note is empty now (REMOVE)',
    // cpElseNote === '', String(cpElseNote));

  // ==========================================================================
  // S6e — ProjectHome.tsx: the rename input's aria-label + the domain eyebrow.
  // ==========================================================================
  // ---- PARKED - RETIRED by #13 step 12a (Nick's dormant answers, Oct 29): ProjectHome is deleted, with its domain eyebrow and its rename
  // input (and the two lexicon terms they read). The block is kept VERBATIM below and no longer runs; records in the parked block. S6f
  // (StructureWizard / StructureBoard / BeatWizard) and S6c/g (QuickSprint) below retire the same way: their screens are deleted.
  // await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  // await app.waitFor("document.querySelector('[data-kind=\"book\"]')?.getAttribute('aria-pressed') === 'true'", { label: 'book kind selected' });
  // await app.click('Start writing');
  // await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'fresh manuscript page (ProjectHome spot-check)' });
  // await sleep(300);
  // const homePageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  // const projectIdForHome = await app.evalJs(`(() => {
    // const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    // return entries.find(e => e.id === '${homePageId}')?.projectId ?? null;
  // })()`);
  // await app.goto(`/project/${projectIdForHome}`);
  // await app.waitFor("!!document.querySelector('.project-title-editable')", { label: 'ProjectHome mounted' });
  // const domainEyebrow = await app.evalJs("document.querySelector('.eyebrow')?.textContent");
  // ok('S6e: ProjectHome\'s own domain eyebrow reads "Creative Drawer", never "Creative project"',
    // domainEyebrow === 'Creative Drawer', String(domainEyebrow));
  // await app.evalJs("document.querySelector('.project-title-editable').click()");
  // const renameAria = await app.evalJs("document.querySelector('.project-rename')?.getAttribute('aria-label')");
  // ok('S6e: ProjectHome\'s own rename input aria-label reads "Drawer title", never "Project title"',
    // renameAria === 'Drawer title', String(renameAria));
  // await app.key('Escape');

  // ==========================================================================
  // S6f — StructureWizard/StructureBoard/BeatWizard: "Back to Drawer".
  // ==========================================================================
  // ---- PARKED - RETIRED by #13 step 12a: the three screens are deleted (and backToDrawer with them). Kept VERBATIM below and no longer run;
  // records in the parked block. The plan-project seed in between stays live: S6c below (the Pin sheet) still uses it.
  // await app.goto(`/project/${projectIdForHome}/wizard`);
  // await app.waitFor("!!document.querySelector('.page')", { label: 'StructureWizard mounted' });
  // await sleep(150);
  // const wizardBack = await app.evalJs("[...document.querySelectorAll('a, button')].find(el => el.textContent.includes('Back to Drawer'))?.textContent");
  // ok('S6f: StructureWizard\'s own back link reads "Back to Drawer", never "Back to project"',
    // !!wizardBack && wizardBack.includes('Back to Drawer'), String(wizardBack));

  const { projectId: planProjectId, pageId: planPageId } = await seedProjectWithPlan(app, 'b21-plan-check');
  // await app.evalJs(`location.hash = '#/project/${planProjectId}/board'`);
  // await app.waitFor("!!document.querySelector('.page-title')", { label: 'StructureBoard mounted' });
  // await sleep(150);
  // const boardBack = await app.evalJs("[...document.querySelectorAll('a, button')].find(el => el.textContent.includes('Back to Drawer'))?.textContent");
  // ok('S6f: StructureBoard\'s own back link reads "Back to Drawer", never "Back to project"',
    // !!boardBack && boardBack.includes('Back to Drawer'), String(boardBack));
//
  // await app.evalJs(`location.hash = '#/project/${planProjectId}/beat'`);
  // await app.waitFor("!!document.querySelector('.eyebrow')", { label: 'BeatWizard mounted' });
  // await sleep(150);
  // const beatBack = await app.evalJs("[...document.querySelectorAll('a, button')].find(el => el.textContent.includes('Back to Drawer'))?.textContent");
  // ok('S6f: BeatWizard\'s own back link reads "Back to Drawer", never "Back to project"',
    // !!beatBack && beatBack.includes('Back to Drawer'), String(beatBack));

  // ==========================================================================
  // S6c/S6g (Binder-vs-Drawer, concrete) — QuickSprint: the breadcrumb shows
  // the OLDER stored-Drawer entity's own real NAME (a proper noun), never
  // the bare word "Drawer" itself.
  //
  // Review fix (independent re-verification) — this section's ORIGINAL
  // check also asserted the Save button read "Save to Binder". PARKED
  // below per A4 (falsified by the fix): that reasoning conflated a
  // proper noun (`drawer.name`) with the bare generic word "Drawer",
  // which don't actually collide (same pattern as a file explorer's "My
  // Documents" breadcrumb sitting beside a "New Folder" button — no
  // ambiguity). Meanwhile the Save button's own destination,
  // ProjectHome.tsx, always reads "Drawer" regardless of this project's
  // drawerId — unconditionally, matching every OTHER inbound link to that
  // screen (BeatWizard/StructureWizard/StructureBoard's "Back to Drawer",
  // JournalEntry's "Promote to a new Drawer"). "Save to/as Binder" was
  // the lone dissenting label into a shared destination that never
  // varies — a real, demonstrable contradiction one click deep. Live
  // successor immediately below the parked block.
  // ==========================================================================
  // NOTE: no freshDesk here (would localStorage.clear() the project this
  // section reuses) — off any flush-handling surface first instead (the
  // harness seeding law), then seed, then reload.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding a real Drawer' });
  await app.evalJs(`(() => {
    // ITEM 85-C — the drawer's id is generated and used only to file the project
    // below, so it stays local. createDrawer assigns order itself (max + 1),
    // which for the first drawer is the 0 this fixture wrote by hand.
    const drawer = window.wrizoCreateDrawer('Real Stored Drawer');
    window.wrizoSetProjectDrawer('${planProjectId}', drawer.id);
  })()`);
  await app.reload();
  // ---- PARKED - RETIRED by #13 step 12a: QuickSprint is deleted, with its breadcrumb, its Pages/Plan toggle and its Save button (and the
  // sprintSave* terms). The block is kept VERBATIM below and no longer runs; records in the parked block. The Drawer seed above stays live:
  // S6c below (the Pin sheet) still reads "Real Stored Drawer".
  // await app.evalJs(`location.hash = '#/project/${planProjectId}/sprint'`);
  // await app.waitFor("!!document.querySelector('.sprint-crumb')", { label: 'QuickSprint mounted (Binder-vs-Drawer proof)' });
  // await sleep(200);
  // const sprintShape = await app.evalJs(`(() => ({
    // crumbDrawerName: document.querySelector('.sprint-crumb .crumb-item')?.textContent,
    // toggleAria: document.querySelector('.sprint-toggle')?.getAttribute('aria-label'),
  // }))()`);
  // ok('S6c/g (Binder-vs-Drawer, concrete): QuickSprint\'s own breadcrumb shows the stored Drawer\'s real name ("Real Stored Drawer") — the OLDER entity, untouched by this fold',
    // sprintShape.crumbDrawerName === 'Real Stored Drawer', JSON.stringify(sprintShape));
  // ok('S6c/g (Binder-vs-Drawer, concrete): QuickSprint\'s own Pages/Plan toggle aria-label reads "Binder view" — the pre-existing themeLexicon term (predates this fold entirely, out of its scope), coexisting harmlessly beside the breadcrumb\'s proper-noun drawer name',
    // sprintShape.toggleAria === 'Binder view', JSON.stringify(sprintShape));
  // await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  // await app.typeKeys('A word. ');
  // await app.click('Finish');
  // await app.waitFor("!!document.querySelector('.card')", { label: 'finish card' });
  // const saveLabel = await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Save to Drawer') || b.textContent.includes('Save as Drawer'))?.textContent");
  // ok('S6g LIVE SUCCESSOR (review fix): QuickSprint\'s own Save button reads "Save to Drawer" — matches its own destination, ProjectHome.tsx, which always reads "Drawer" regardless of this project\'s drawerId; see the PARKED block above',
    // saveLabel === 'Save to Drawer', String(saveLabel));

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
  await app.waitFor("!!document.querySelector('.wz-arrival-write:not([disabled])')", { label: 'Write door enabled (#92: a click on a disabled door does nothing)' });
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

    // Review fix (independent re-verification) — S6d follow-through: the
    // ORIGINAL build's harness stopped at proving DrawersTree's OWN button
    // said "New Binder" (above) but never followed the click to where it
    // actually goes. It navigates to /project/new?drawer=<id> — CreateProject.tsx
    // — which, before this fix, unconditionally read "NEW DRAWER" regardless,
    // contradicting the very button that led there. This check proves the fix.
    await app.evalJs("[...document.querySelectorAll('.dz-createnew .dz-more')].find(b => b.textContent === 'New Binder')?.click()");
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'S6d follow-through: CreateProject reached via New Binder' });
    const followThroughShape = await app.evalJs(`(() => ({
      eyebrow: document.querySelector('.cp-eyebrow')?.textContent,
      titleAria: document.querySelector('.cp-title-input')?.getAttribute('aria-label'),
      hash: location.hash,
    }))()`);
    ok('S6d follow-through (review fix): clicking DrawersTree\'s "New Binder" lands on CreateProject.tsx reading "NEW BINDER" / "Binder title (optional)" — matching the button that led here, never "NEW DRAWER" (the destination-mismatch gap the original build\'s harness never exercised)',
      followThroughShape.eyebrow === 'NEW BINDER'
        && followThroughShape.titleAria === 'Binder title (optional)'
        && followThroughShape.hash.includes('drawer='),
      JSON.stringify(followThroughShape));
  }

  // ==========================================================================
  // S6f — JournalEntry.tsx's LEGACY (<1100px) scrap-routing block [PARKED WHOLE
  //       — FX14 S2]
  // Drove JournalEntry.tsx's own legacy routing chrome (#/journal/:id ->
  // .entry-edit -> .route-open / .route-picker) at <1100px, proving the button +
  // picker read "Drawer" never "project", and that the whole block is ABSENT when
  // framed (Places, S4, supersedes it). FX14 S2 unroutes the JournalEntry surface
  // entirely (/journal/:id -> /page/:id redirect, App.tsx's JournalIdRedirect), so
  // .entry-edit / .route-open / .route-picker never mount — the legacy routing
  // block is a JournalEntry-only affordance that retires WITH the surface. All
  // three checks PARKED (A4) as FALSIFIED. SV6, quoted: "Journal Pages no longer
  // exist. The Journal is now just a board that contains certain pages." Successor:
  // the "Drawer, never project" lexicon claim is proven LIVE just below in S6g (the
  // ModeStage gear's Progress selector offers "Drawer", never "Project"); the
  // legacy JournalEntry routing block itself retires to J7's behavior-parity
  // census. Originals, byte-for-byte:
  //   PARKED (was "S6f (legacy-only touch, disclosed): the legacy (<1100px) routing button reads \"Send to a Drawer\", never \"Send to a project\"")
  //   PARKED (was "S6f (legacy-only touch, disclosed): the legacy picker's empty-state + promote button both read \"Drawer\", never \"project\"")
  //   PARKED (was "S6f: framed (>=1100px), the legacy routing block is genuinely ABSENT (not merely relabeled) — Places (S4) is the framed surface's own equivalent door")
  // ==========================================================================

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
  // ---- PARKED - SUPERSEDED by #13 step 12a: two of the swept surfaces (ProjectHome at /project/:id, StructureWizard at /project/:id/wizard)
  // are deleted. The list, kept VERBATIM below and no longer run; the successor sweeps every surface that remains, with the same reader
  // (and a mutant for it, after the check).
  // const sweepTargets = [
  //   ['/project/new', "!!document.querySelector('[data-kind=\"book\"]')"],
  //   [`/project/${sweepProjectId}`, "!!document.querySelector('.project-title-editable')"],
  //   [`/project/${sweepProjectId}/wizard`, "!!document.querySelector('.page')"],
  //   ['/drawers', "!!document.querySelector('.dz-new')"],
  //   ['/import', "!!document.querySelector('.import-draft')"],
  // ];
  void sweepProjectId;
  const sweepTargets = [
    ['/project/new', "!!document.querySelector('[data-kind=\"book\"]')"],
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
  ok('S6h (Definition of Done) [c13-12a successor]: no bare "Project" word (case-sensitive, word-boundary) renders anywhere across every swept surface that remains (New project, Drawers, Import)',
    sweepResults.length === 3 && sweepResults.every(r => !r.hasBareProject), JSON.stringify(sweepResults));
  ok('S6h [c13-12a successor mutant]: the sweep\'s reader is red on a bare "Project" and green on "project" and "Projects"',
    /\bProject\b/.test('Back to Project') && !/\bProject\b/.test('a project') && !/\bProject\b/.test('Projects'), '');

  // ==========================================================================
  // S6i — the route-path boundary, held deliberately: /project/* routes are
  // completely UNTOUCHED (a conscious scope boundary, not an oversight).
  // ==========================================================================
  // ---- PARKED - SUPERSEDED by #13 step 12a (Fable's door ruling): /project/:id is now a redirect to the project's first page, so the
  // address no longer STAYS on /project/ after it loads. Kept VERBATIM below and no longer run. The claim it held - the route PATHS are
  // literally untouched (the rename never reached them) - is the successor, read where the paths are declared, with its mutant.
  // await app.goto(`/project/${sweepProjectId}`);
  // await app.waitFor("!!document.querySelector('.project-title-editable')", { label: 'route-boundary spot-check' });
  // const routeCheck = await app.evalJs('location.hash');
  // ok('S6i: route paths stay literally "/project/..." — deliberately untouched (a bigger structural call than Nick\'s word commissioned; flagged for a future explicit ruling)',
  //   routeCheck.startsWith('#/project/'), routeCheck);
  const routesKept = (appSrc) => ['/project/new', '/project/:id', '/project/:id/import'].every((p) => appSrc.includes(`<Route path="${p}"`));
  const appSrc12a = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
  ok('S6i [c13-12a successor]: route paths stay literally "/project/..." (new, :id, :id/import are declared under that path) - the rename never reached the paths',
    routesKept(appSrc12a), '');
  ok('S6i [c13-12a successor mutant]: a /project path renamed to /drawer is red', !routesKept(appSrc12a.replace('<Route path="/project/:id"', '<Route path="/drawer/:id"')), '');

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// ARCHIVED PARK (#13 step 14): archive/b2-1.mjs.parked.md record 7
if (process.env.HARNESS_PARKED === '1') {
  const parkedChecks = [];
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    // ---- PARKED, generation 2 - RETIRED by #13 step 12a: this record re-drove QuickSprint to hold its history true, and QuickSprint is
    // deleted. The drive is kept VERBATIM below and no longer runs; the record is restated after it on what makes the retirement true.
    // const { projectId: pProjectId } = await seedProjectWithPlan(app, 'b21-parked-plan-check');
    // await app.goto('/');
    // await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'PARKED: Desk before seeding a real Drawer' });
    // await app.evalJs(`(() => {
      // const drawer = window.wrizoCreateDrawer('PARKED Real Stored Drawer');
      // window.wrizoSetProjectDrawer('${pProjectId}', drawer.id);
    // })()`);
    // await app.reload();
    // await app.evalJs(`location.hash = '#/project/${pProjectId}/sprint'`);
    // await app.waitFor("!!document.querySelector('.sprint-crumb')", { label: 'PARKED: QuickSprint mounted (pre-fix reproduction)' });
    // await sleep(200);
    // await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    // await app.typeKeys('A word. ');
    // await app.click('Finish');
    // await app.waitFor("!!document.querySelector('.card')", { label: 'PARKED: finish card' });
    // // Re-derived against the file's PRE-fix behavior (the historical claim,
    // // held true here on purpose — this block exists to prove the park is
    // // accurate history, not to re-validate current behavior).
    // const saveLabelNow = await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Save to Drawer') || b.textContent.includes('Save as Drawer'))?.textContent");
    // pok('PARKED (was "S6g: QuickSprint\'s own Save button reads \\"Save to Binder\\", never \\"Save to project\\"") — review fix: the button reverted to "Save to Drawer" (matches its own destination, ProjectHome.tsx, unconditionally); live successor: this file\'s own live S6g section',
      // saveLabelNow === 'Save to Drawer', String(saveLabelNow));
    void app;
    return parkedChecks;
  });
  // #13 step 12a: the records. What makes each retirement (not a loss) true: the old screen's route is never left without one - the screen
  // before the delete, the legacy redirect after (c13-12a-doors.mjs D1/D3) - and "Something else" leaves CreateProject (D4).
  {
    const app12a = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
    const el = (p) => (new RegExp(`<Route path="${p.replace(/[/:]/g, (c) => `\\${c}`)}" element=\\{<(\\w+) \\/>\\} \\/>`).exec(app12a) || [])[1] || null;
    const live = (p, screen) => { const e = el(p); return e === screen || e === 'LegacyProjectRedirect'; };
    const cp = readFileSync(new URL('../../src/pages/CreateProject.tsx', import.meta.url), 'utf8');
    pok('PARKED (was "S6g: QuickSprint\'s own Save button reads \\"Save to Binder\\", never \\"Save to project\\"") - generation 2, RETIRED by #13 step 12a: QuickSprint is deleted',
      live('/project/:id/sprint', 'QuickSprint'), `sprint -> ${el('/project/:id/sprint')}`);
    pok('PARKED (was "S6e [word-diet successor]: CreateProject\'s own \\"Something else\\" note is empty now (REMOVE)") - RETIRED by #13 step 12a: "Something else" is dropped from New project',
      true, `cp-else in CreateProject: ${/cp-else/.test(cp)} (present before the delete, gone after; D4 asserts its absence)`);
    for (const [n, p, s] of [
      ['S6e: ProjectHome\'s own domain eyebrow reads "Creative Drawer", never "Creative project"', '/project/:id', 'ProjectHome'],
      ['S6e: ProjectHome\'s own rename input aria-label reads "Drawer title", never "Project title"', '/project/:id', 'ProjectHome'],
      ['S6f: StructureWizard\'s own back link reads "Back to Drawer", never "Back to project"', '/project/:id/wizard', 'StructureWizard'],
      ['S6f: StructureBoard\'s own back link reads "Back to Drawer", never "Back to project"', '/project/:id/board', 'StructureBoard'],
      ['S6f: BeatWizard\'s own back link reads "Back to Drawer", never "Back to project"', '/project/:id/beat', 'BeatWizard'],
      ['S6c/g (Binder-vs-Drawer, concrete): QuickSprint\'s own breadcrumb shows the stored Drawer\'s real name', '/project/:id/sprint', 'QuickSprint'],
      ['S6c/g (Binder-vs-Drawer, concrete): QuickSprint\'s own Pages/Plan toggle aria-label reads "Binder view"', '/project/:id/sprint', 'QuickSprint'],
      ['S6g LIVE SUCCESSOR (review fix): QuickSprint\'s own Save button reads "Save to Drawer"', '/project/:id/sprint', 'QuickSprint'],
    ]) {
      pok(`PARKED (was "${n}") - RETIRED by #13 step 12a: ${s} is deleted`, live(p, s), `${p} -> ${el(p)}`);
    }
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nB2-1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nB2-1 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nB2-1 VERIFY: PASS (${checks.length} checks)` : `\nB2-1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
