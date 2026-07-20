// M1 — milestone circles + notecard dots. A committed CDP verification
// scenario (per AGENTS.md "Harness scenarios persist"), covering the S1-S4
// build per docs/m1-milestones-brief.md's S5 spec.
// Run: node apps/desktop/scripts/harness/m1.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { readFileSync } from 'node:fs';
import { withHarness } from '../runtime-verify.mjs';

const storyCircle = JSON.parse(readFileSync(new URL('../../../../packages/modules-writing/data/frameworks/story_circle.json', import.meta.url)));
const saveTheCat = JSON.parse(readFileSync(new URL('../../../../packages/modules-writing/data/frameworks/save_the_cat.json', import.meta.url)));
const threeAct = JSON.parse(readFileSync(new URL('../../../../packages/modules-writing/data/frameworks/three_act.json', import.meta.url)));

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Poll a boolean evalJs expression for up to `ms`, returning true as soon as
// it's true (or false if it never is) — same shape as w1.mjs's celebration polls.
async function pollTrue(app, expr, ms) {
  for (let i = 0; i < ms / 100; i++) {
    if (await app.evalJs(expr)) return true;
    await sleep(100);
  }
  return false;
}

// Open the settings gear, read the Progress Seg's option labels, close it.
// Returns null if no gear exists on this surface at all (the Journal).
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

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'authed Desk' });
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after clear' });

  // === Fixture 1 — story_circle (8 beats, no windowing): seeded attachments,
  // toggle offered, pointer-events inert, cross-surface celebration, mount-
  // seeding on reload, notecard dots + a live same-mount celebration. =======
  const beats = storyCircle.beats.slice().sort((a, b) => a.order - b.order).map(b => b.id);
  const beatNames = Object.fromEntries(storyCircle.beats.map(b => [b.id, b.name]));

  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'project' }))");

  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'manuscript page mounted' });
  await sleep(400); // clear the debounced autosave window
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');

  // Off PageEditor before any raw-localStorage seeding: PageEditor's unmount/
  // hide handler calls flushNow(), which re-serializes EVERY collection from
  // the in-memory cache unconditionally — including one this fixture is about
  // to seed directly. Off this route (Desk has no such handler), a reload
  // can't race a stale in-memory write back over the seed.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding the StoryPlan' });

  const projectId = await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = entries.find(x => x.id === '${pageId}');
    return e ? e.projectId : null;
  })()`);
  ok('fixture 1: project id resolved from the fresh manuscript page', typeof projectId === 'string' && projectId.length > 0, String(projectId));

  const planId = await app.evalJs(`(() => {
    const projectId = '${projectId}';
    const pageId = '${pageId}';
    const beatIds = ${JSON.stringify(beats)};
    const now = new Date().toISOString();
    const planId = 'm1-plan-' + Date.now();

    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const pi = projects.findIndex(p => p.id === projectId);
    if (pi < 0) return 'ERR-no-project';
    projects[pi].storyPlanId = planId;
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));

    const plan = {
      id: planId, projectId, frameworkId: 'story_circle',
      beatNotes: beatIds.map(id => ({ beatId: id, notes: [], status: 'empty' })),
      currentBeatId: beatIds[1],
      createdAt: now, updatedAt: now,
    };
    const plans = JSON.parse(localStorage.getItem('writer-studio-story-plans') || '[]');
    plans.push(plan);
    localStorage.setItem('writer-studio-story-plans', JSON.stringify(plans));

    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const ei = entries.findIndex(e => e.id === pageId);
    if (ei >= 0) { entries[ei].beatId = beatIds[1]; localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries)); }

    return planId;
  })()`);
  ok('fixture 1: StoryPlan (story_circle) seeded, page attached to beat[1]', typeof planId === 'string' && planId.startsWith('m1-plan-'), String(planId));

  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after reload (seed durable)' });
  await app.evalJs(`location.hash = '#/page/${pageId}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'manuscript page after seeding' });

  // -- S1/S2: circle states from seeded attachments, on the FIRST-ever mount
  // this app-load (the celebration baseline is established right here) ------
  const circleStates = await app.evalJs("[...document.querySelectorAll('.mode-milestone')].map(el => el.className.match(/mode-milestone--(\\w+)/)[1])");
  ok('S1/S2: 8 circles rendered for story_circle (no windowing)', Array.isArray(circleStates) && circleStates.length === 8, JSON.stringify(circleStates));
  ok('S1/S2: only the attached beat (beat[1], "need") shows kindled', JSON.stringify(circleStates) === JSON.stringify(['empty', 'kindled', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty']), JSON.stringify(circleStates));
  ok('S2: no celebration on the app-load-establishing mount', await app.evalJs("document.querySelectorAll('.mode-milestone.celebrate').length") === 0);

  // -- S2: pointer-events inert on the writing-surface circles themselves
  // (not just the wrapper — a circle-level override would slip past a
  // wrapper-only check) --------------------------------------------------
  const wrapperPointerEvents = await app.evalJs("getComputedStyle(document.querySelector('.mode-milestones')).pointerEvents");
  ok('S2: .mode-milestones wrapper is pointer-events: none', wrapperPointerEvents === 'none', wrapperPointerEvents);
  const circlePointerEvents = await app.evalJs("[...document.querySelectorAll('.mode-milestone')].map(el => getComputedStyle(el).pointerEvents)");
  ok('S2: every individual .mode-milestone circle computes pointer-events: none', Array.isArray(circlePointerEvents) && circlePointerEvents.length > 0 && circlePointerEvents.every(v => v === 'none'), JSON.stringify(circlePointerEvents));

  // -- Fable R1: Timer:On is independent of the Progress metric (it survives
  // Progress:Off via ProgressBar's rightSlot) and must survive Progress:Project
  // the same way — MilestoneBar must not eat the session clock. -------------
  await app.evalJs("document.querySelector('.mode-gear').click()");
  await sleep(100);
  await app.evalJs(`(() => {
    const row = [...document.querySelectorAll('.mode-crow')].find(r => r.querySelector('span')?.textContent === 'Timer');
    [...row.querySelectorAll('.mode-seg button')].find(b => b.textContent === 'On').click();
  })()`);
  await app.evalJs("document.querySelector('.mode-gear').click()");
  await sleep(50);
  const circlesAndTimer = await app.evalJs("({ circles: document.querySelectorAll('.mode-milestone').length, timer: !!document.querySelector('.mode-timer') })");
  ok('R1: Timer:On + Progress:Project renders both the milestone circles and the session clock', circlesAndTimer.circles > 0 && circlesAndTimer.timer === true, JSON.stringify(circlesAndTimer));

  // -- S3: the toggle is offered once a StoryPlan exists --------------------
  const offeredLabels = await progressOptions(app);
  ok('S3: Progress gains a "Project" option once a StoryPlan exists', Array.isArray(offeredLabels) && offeredLabels.includes('Project'), JSON.stringify(offeredLabels));

  // -- Advance a beat to terminal status Plan-side (QuickSprint's pre-
  // existing finish-checkbox — a real, silent write: it fires setBeatStatus
  // then navigates away in the same handler, so no celebration-consumer
  // renders the transition in place) — then assert exactly one celebration
  // on the NEXT-opened writing surface. ------------------------------------
  await app.evalJs(`location.hash = '#/project/${projectId}/sprint'`);
  await app.waitFor("!!document.querySelector('.sprint-bottombar')", { label: 'QuickSprint mounted' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('A few words for the sprint. ');
  await app.click('Finish');
  await app.waitFor("!!document.querySelector('input[type=checkbox]')", { label: 'finish card with mark-done checkbox' });
  const checkboxLabel = await app.evalJs("document.querySelector('input[type=checkbox]').closest('label').textContent");
  ok('QuickSprint\'s finish checkbox names the attached (currentBeatId) beat', checkboxLabel.includes(beatNames[beats[1]]), checkboxLabel);
  await app.evalJs("document.querySelector('input[type=checkbox]').click()");
  await app.click('Save to project');
  await app.waitFor("!!document.querySelector('.project-title-editable')", { label: 'ProjectHome after Save to project' });
  await sleep(400); // clear the debounced flush so the raw localStorage read below is durable
  const needStatusAfterSave = await app.evalJs(`(() => {
    const plans = JSON.parse(localStorage.getItem('writer-studio-story-plans') || '[]');
    const plan = plans.find(p => p.id === '${planId}');
    return plan ? plan.beatNotes.find(bn => bn.beatId === 'need')?.status : 'NO-PLAN';
  })()`);
  ok('the beat reached complete status after Save to project', needStatusAfterSave === 'complete', String(needStatusAfterSave));

  await app.evalJs(`location.hash = '#/page/${pageId}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'manuscript page reopened after Plan-side advance' });
  const sawCelebrateOnReopen = await pollTrue(app, "document.querySelectorAll('.mode-milestone.celebrate').length === 1", 2000);
  ok('advance Plan-side -> exactly one celebration on the reopened writing surface', sawCelebrateOnReopen);
  const litAndCelebrating = await app.evalJs("!!document.querySelector('.mode-milestone--lit.celebrate')");
  ok('the celebrating circle is the one that just went lit', litAndCelebrating);
  await sleep(1300); // let the 1.1s celebration pulse fully clear

  // -- reload with a lit beat -> no celebration on mount --------------------
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'reopened after hard reload' });
  const stillLit = await app.evalJs("!!document.querySelector('.mode-milestone--lit')");
  ok('reloaded page still shows the beat as lit', stillLit);
  const celebratedOnReload = await pollTrue(app, "document.querySelectorAll('.mode-milestone.celebrate').length > 0", 1500);
  ok('reload with an already-lit beat does NOT celebrate on mount', celebratedOnReload === false, `celebratedOnReload=${celebratedOnReload}`);

  // -- S4: notecard dot states + labels, and Board's own first look at the
  // already-celebrated beat does NOT re-celebrate it -----------------------
  await app.evalJs(`location.hash = '#/project/${projectId}/board'`);
  await app.waitFor("!!document.querySelector('.board-card')", { label: 'StructureBoard mounted' });
  const needDot = await app.evalJs(`(() => {
    const card = [...document.querySelectorAll('.board-card')].find(c => c.querySelector('.card-title')?.textContent === '${beatNames[beats[1]]}');
    const dot = card?.querySelector('.status-dot');
    return dot ? { cls: dot.className, title: dot.title, aria: dot.getAttribute('aria-label') } : null;
  })()`);
  ok('S4: the advanced beat\'s notecard dot shows done, with title/aria-label', !!needDot && needDot.cls.includes('status-dot--done') && needDot.title === 'complete' && needDot.aria === 'complete', JSON.stringify(needDot));
  const youDot = await app.evalJs(`(() => {
    const card = [...document.querySelectorAll('.board-card')].find(c => c.querySelector('.card-title')?.textContent === '${beatNames[beats[0]]}');
    const dot = card?.querySelector('.status-dot');
    return dot ? { cls: dot.className, title: dot.title } : null;
  })()`);
  ok('S4: an untouched beat\'s notecard dot shows empty, with a label', !!youDot && youDot.cls.includes('status-dot--empty') && youDot.title === 'empty', JSON.stringify(youDot));
  ok('Board\'s own first look at an already-celebrated beat does not re-celebrate', await app.evalJs("document.querySelectorAll('.status-dot.celebrate').length") === 0);

  // -- S4: a live, same-mount transition on the Board DOES celebrate --------
  const goName = beatNames[beats[2]];
  await app.evalJs(`(() => {
    const card = [...document.querySelectorAll('.board-card')].find(c => c.querySelector('.card-title')?.textContent === '${goName}');
    const btn = [...card.querySelectorAll('button')].find(b => b.textContent === 'Mark done');
    btn.click();
  })()`);
  const sawBoardCelebrate = await pollTrue(app, "document.querySelectorAll('.status-dot.celebrate').length === 1", 2000);
  ok('S4: clicking "Mark done" celebrates exactly once, in place, on the Board', sawBoardCelebrate);
  const goDoneNow = await app.evalJs(`(() => {
    const card = [...document.querySelectorAll('.board-card')].find(c => c.querySelector('.card-title')?.textContent === '${goName}');
    return card.querySelector('.status-dot').className;
  })()`);
  ok('the marked beat\'s dot flips to done', goDoneNow.includes('status-dot--done'), goDoneNow);

  // === Fixture 2 — save_the_cat (15 beats > the 12-beat cap): the toggle is
  // absent on a plan-less project, and the window centers on the anchor
  // beat rather than truncating to the first 12. ============================
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture 2' });
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'project' }))");

  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), fixture 2' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'fixture 2 manuscript page mounted' });
  await sleep(400); // clear the debounced autosave window

  // -- S3: the toggle is absent on a plan-less project (no StoryPlan yet) ---
  const planlessLabels = await progressOptions(app);
  ok('S3: Progress omits "Project" on a plan-less project', Array.isArray(planlessLabels) && !planlessLabels.includes('Project'), JSON.stringify(planlessLabels));

  const pageId2 = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');

  // Off PageEditor before raw-localStorage seeding (same flushNow race as fixture 1).
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding fixture 2\'s StoryPlan' });

  const projectId2 = await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = entries.find(x => x.id === '${pageId2}');
    return e ? e.projectId : null;
  })()`);

  const stcBeats = saveTheCat.beats.slice().sort((a, b) => a.order - b.order).map(b => b.id);
  const anchorId = stcBeats[7]; // 'fun_and_games' — comfortably inside the 15-beat list, tests centering (not first-12 truncation)
  await app.evalJs(`(() => {
    const projectId = '${projectId2}';
    const beatIds = ${JSON.stringify(stcBeats)};
    const now = new Date().toISOString();
    const planId = 'm1-plan2-' + Date.now();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const pi = projects.findIndex(p => p.id === projectId);
    projects[pi].storyPlanId = planId;
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const plan = {
      id: planId, projectId, frameworkId: 'save_the_cat',
      beatNotes: beatIds.map(id => ({ beatId: id, notes: [], status: 'empty' })),
      currentBeatId: '${anchorId}',
      createdAt: now, updatedAt: now,
    };
    const plans = JSON.parse(localStorage.getItem('writer-studio-story-plans') || '[]');
    plans.push(plan);
    localStorage.setItem('writer-studio-story-plans', JSON.stringify(plans));
  })()`);

  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after reload (fixture 2 seed durable)' });
  await app.evalJs(`location.hash = '#/page/${pageId2}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'fixture 2 manuscript page after seeding' });

  const windowedFlag = await app.evalJs("!!document.querySelector('.mode-milestones.windowed')");
  ok('S1: a 15-beat framework (over the 12-cap) marks windowed', windowedFlag);
  const circleCount = await app.evalJs("document.querySelectorAll('.mode-milestone').length");
  ok('S1: the window caps at 12 circles', circleCount === 12, String(circleCount));
  const anchorName = saveTheCat.beats.find(b => b.id === anchorId).name;
  const anchorShown = await app.evalJs(`[...document.querySelectorAll('.mode-milestone')].some(el => el.getAttribute('aria-label').startsWith('${anchorName}'))`);
  ok('S1: the window is centered on the current beat, not truncated from the start', anchorShown, anchorName);
  const firstExcluded = await app.evalJs("[...document.querySelectorAll('.mode-milestone')].some(el => el.getAttribute('aria-label').startsWith('Opening Image'))");
  const lastExcluded = await app.evalJs("[...document.querySelectorAll('.mode-milestone')].some(el => el.getAttribute('aria-label').startsWith('Final Image'))");
  ok('S1: centering pushes beats off BOTH edges (not just the tail)', firstExcluded === false && lastExcluded === false, `firstExcluded=${firstExcluded} lastExcluded=${lastExcluded}`);

  // === Fixture 3 — cross-project id collision: two DIFFERENT projects on the
  // SAME framework share bare beat ids ('midpoint' etc. are framework-authored,
  // not project-scoped). Celebration tracking must be scoped per StoryPlan, or
  // Project A's already-long-complete 'midpoint' misfires as newly-lit the
  // first time it's viewed after Project B's (different, still-empty)
  // 'midpoint' has been seen this session — and/or a genuine live completion
  // on B gets silently swallowed because A's 'midpoint' already "used up" the
  // bare id. ==================================================================
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture 3' });
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'project' }))");

  const threeActBeats = threeAct.beats.slice().sort((a, b) => a.order - b.order).map(b => b.id);

  // Project A: 'midpoint' already complete (simulating a PRIOR session).
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), project A' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'project A manuscript page mounted' });
  await sleep(400);
  const pageIdA = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding project A' });
  const projectIdA = await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return entries.find(e => e.id === '${pageIdA}')?.projectId ?? null;
  })()`);
  await app.evalJs(`(() => {
    const projectId = '${projectIdA}';
    const beatIds = ${JSON.stringify(threeActBeats)};
    const now = new Date().toISOString();
    const planId = 'm1-planA-' + Date.now();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const pi = projects.findIndex(p => p.id === projectId);
    projects[pi].storyPlanId = planId;
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const plan = {
      id: planId, projectId, frameworkId: 'three_act',
      beatNotes: beatIds.map(id => ({ beatId: id, notes: [], status: id === 'midpoint' ? 'complete' : 'empty' })),
      currentBeatId: 'midpoint',
      createdAt: now, updatedAt: now,
    };
    const plans = JSON.parse(localStorage.getItem('writer-studio-story-plans') || '[]');
    plans.push(plan);
    localStorage.setItem('writer-studio-story-plans', JSON.stringify(plans));
  })()`);

  // Re-hydrate the in-memory cache from the raw seed BEFORE any further app
  // action (creating project B) can schedule a flush of the (still-stale,
  // pre-seed) in-memory `projects`/`storyPlans` cache back over it.
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after reload (project A seed durable)' });

  // Project B: SAME framework, 'midpoint' still empty (a DIFFERENT plan/scope).
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), project B' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'project B manuscript page mounted' });
  await sleep(400);
  const pageIdB = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seeding project B' });
  const projectIdB = await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return entries.find(e => e.id === '${pageIdB}')?.projectId ?? null;
  })()`);
  const planIdB = await app.evalJs(`(() => {
    const projectId = '${projectIdB}';
    const beatIds = ${JSON.stringify(threeActBeats)};
    const now = new Date().toISOString();
    const planId = 'm1-planB-' + Date.now();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const pi = projects.findIndex(p => p.id === projectId);
    projects[pi].storyPlanId = planId;
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const plan = {
      id: planId, projectId, frameworkId: 'three_act',
      beatNotes: beatIds.map(id => ({ beatId: id, notes: [], status: 'empty' })),
      currentBeatId: 'midpoint',
      createdAt: now, updatedAt: now,
    };
    const plans = JSON.parse(localStorage.getItem('writer-studio-story-plans') || '[]');
    plans.push(plan);
    localStorage.setItem('writer-studio-story-plans', JSON.stringify(plans));
    return planId;
  })()`);

  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after reload (fixture 3 seeds durable)' });

  // View Project B FIRST — establishes ITS OWN baseline ('midpoint' not lit there).
  await app.evalJs(`location.hash = '#/page/${pageIdB}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'project B page mounted' });
  const midpointStateB = await app.evalJs("(() => { const el = [...document.querySelectorAll('.mode-milestone')].find(e => e.getAttribute('aria-label')?.startsWith('Midpoint')); return el ? el.className : null; })()");
  ok('fixture 3: Project B\'s midpoint shows empty (not yet complete there)', !!midpointStateB && midpointStateB.includes('mode-milestone--empty'), midpointStateB);
  ok('fixture 3: no celebration on Project B\'s first-ever mount', await app.evalJs("document.querySelectorAll('.mode-milestone.celebrate').length") === 0);

  // View Project A — a DIFFERENT plan/scope, its OWN first-ever mount this
  // session. Its 'midpoint' is ALREADY complete (from before this app-load),
  // and must NOT celebrate just because Project B's (different) 'midpoint'
  // was seen moments ago — this is exactly the cross-project bug's first
  // failure direction (a false celebration for an old completion).
  await app.evalJs(`location.hash = '#/page/${pageIdA}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'project A page mounted' });
  const midpointStateA = await app.evalJs("(() => { const el = [...document.querySelectorAll('.mode-milestone')].find(e => e.getAttribute('aria-label')?.startsWith('Midpoint')); return el ? el.className : null; })()");
  ok('fixture 3: Project A\'s midpoint shows lit (already complete, seeded)', !!midpointStateA && midpointStateA.includes('mode-milestone--lit'), midpointStateA);
  const celebratedOnA = await pollTrue(app, "document.querySelectorAll('.mode-milestone.celebrate').length > 0", 1500);
  ok('fixture 3: Project A\'s already-complete midpoint does NOT falsely celebrate on its own first mount', celebratedOnA === false, `celebratedOnA=${celebratedOnA}`);

  // Now genuinely advance Project B's midpoint via the Board — must still
  // celebrate (the bug's second failure direction: a genuine transition on B
  // silently swallowed because A's bare 'midpoint' id was already "seen").
  await app.evalJs(`location.hash = '#/project/${projectIdB}/board'`);
  await app.waitFor("!!document.querySelector('.board-card')", { label: 'Project B Board mounted' });
  await app.evalJs(`(() => {
    const card = [...document.querySelectorAll('.board-card')].find(c => c.querySelector('.card-title')?.textContent === 'Midpoint');
    const btn = [...card.querySelectorAll('button')].find(b => b.textContent === 'Mark done');
    btn.click();
  })()`);
  const sawGenuineCelebration = await pollTrue(app, "document.querySelectorAll('.status-dot.celebrate').length === 1", 2000);
  ok('fixture 3: Project B\'s genuine live completion of midpoint still celebrates (not swallowed by A\'s identical bare id)', sawGenuineCelebration);

  // === Fixture 4 — the Journal: no gear at all, and Progress:project (if
  // ever forced via the shared setting) silently degrades to the words bar. =
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture 4' });
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'project' }))");
  // B1 — the retired Journal list's own "New page" button is gone
  // (pages/Journal.tsx deleted, S5); persistence.ts's own new test seam
  // (window.wrizoCreateJournalPage) reaches the identical fresh-page state.
  await app.evalJs("location.hash = '#/journal/' + window.wrizoCreateJournalPage().id");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored Journal page' });

  ok('S3: the Journal has no settings gear at all (no path to "Project")', await app.evalJs("!document.querySelector('.mode-gear')"));
  ok('S3: Progress:project silently degrades to the words bar on the Journal', await app.evalJs("!!document.querySelector('.journal-page .mode-ptrack')"));
  ok('S3: no milestone circle ever renders on the Journal', await app.evalJs("!document.querySelector('.mode-milestone')"));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nM1 VERIFY: PASS (${checks.length} checks)` : `\nM1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
