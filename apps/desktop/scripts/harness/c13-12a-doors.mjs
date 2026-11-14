// #13 step 12a (Nick's dormant answers, Oct 29; Fable's rulings Oct 29 and Nov 12): the old project screens (ProjectHome, StructureWizard,
// BeatWizard, StructureBoard, QuickSprint) are deleted with their routes. `/project/:id`, its four sub-routes and `/sprint` stay only as a
// small redirect by the door ruling: the project's first page, else its Drawer's Pages pop-out, else home - never a blank screen, and no
// editor file is touched. RED on main first (the screens are there), green on the deletion.
//   D1 /project/:id and /project/:id/{sprint,wizard,beat,board} land on the project's FIRST page (the Pages pop-out's own order), editor mounted
//   D2 a project with no pages lands on its Drawer's first page with the Pages pop-out open (frame width); below the frame, on that page
//   D3 a project whose Drawer holds no page, an unknown project id, and /sprint all land home (the Desk), never a blank screen
//   D4 New project offers no "Something else"
//   D5 the Drawers list's project row opens the project's first page
//   D6 a project carrying sprintText, a story plan and beat state is byte-identical in storage after a boot of the new build
//   D7 source: the five screens and store/ambient.ts are gone and nothing imports them; the way-back chip has no /sprint pattern
// Run: node scripts/harness/c13-12a-doors.mjs   (from apps/desktop, dist-web built).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

// ---- D7, browserless: the source ----
const GONE = ['pages/ProjectHome.tsx', 'pages/StructureWizard.tsx', 'pages/BeatWizard.tsx', 'pages/StructureBoard.tsx', 'pages/QuickSprint.tsx', 'store/ambient.ts'];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const code = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));
const present = GONE.filter((f) => fs.existsSync(path.join(SRC, f)));
const importers = code.filter((f) => /from '[./]+(pages\/)?(ProjectHome|StructureWizard|BeatWizard|StructureBoard|QuickSprint|ambient)'/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(SRC, f));
ok('D7: the five old screens and store/ambient.ts are gone, and no source file imports any of them', present.length === 0 && importers.length === 0, J({ present, importers }));
const wayBack = fs.readFileSync(path.join(SRC, 'store', 'wayBack.ts'), 'utf8');
ok('D7: the way-back chip carries no /sprint pattern (QuickSprint is gone)', !/sprint/.test(wayBack.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')), '');

const IDS = { a: 'c13-12a-p1-a', b: 'c13-12a-p1-b', u: 'c13-12a-p0-a' };

const freshDesk = async (app, w = 1400, h = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, w, h);
};

// Everything through the seams, from the Desk (the seeding law). Drawer A holds the book (two pages, the EARLIER-born one first in the
// pop-out's order) and an empty binder; drawer B holds only the legacy project (sprintText, a story plan, beat state, no page); one book
// sits in no drawer (Unsorted) for the Drawers list.
const seed = (app) => app.evalJs(`(() => {
  const t0 = Date.now() - 60000;
  const at = (s) => new Date(t0 + s * 1000).toISOString();
  const A = window.wrizoCreateDrawer('C13 12a Drawer A');
  const B = window.wrizoCreateDrawer('C13 12a Drawer B');
  const book = window.wrizoCreateBinder('C13 12a Book', 'book', A.id);
  const empty = window.wrizoCreateBinder('C13 12a Empty', 'book', A.id);
  const legacy = window.wrizoCreateBinder('C13 12a Legacy', 'other', B.id);
  const loose = window.wrizoCreateBinder('C13 12a Unsorted Book', 'book');
  window.wrizoCreateJournalPage({ id: ${J(IDS.b)}, text: 'Second page of the book.', projectId: book.id, origin: 'journal', source: 'page', pageType: 'manuscript', createdAt: at(2) });
  window.wrizoCreateJournalPage({ id: ${J(IDS.a)}, text: 'First page of the book.', projectId: book.id, origin: 'journal', source: 'page', pageType: 'manuscript', createdAt: at(1) });
  window.wrizoCreateJournalPage({ id: ${J(IDS.u)}, text: 'The unsorted book, page one.', projectId: loose.id, origin: 'journal', source: 'page', pageType: 'manuscript', createdAt: at(3) });
  window.wrizoPatchProject(legacy.id, { sprintText: 'A sprint body from the old screen.\\n\\nIts second paragraph.' });
  const plan = window.wrizoCreateStoryPlan(legacy.id, 'story_circle', ['you', 'need', 'go']);
  window.wrizoSetCurrentBeat(plan.id, 'need');
  window.wrizoSetBeatStatus(plan.id, 'you', 'complete');
  window.wrizoFlushNow();
  return { A: A.id, B: B.id, book: book.id, empty: empty.id, legacy: legacy.id, loose: loose.id, plan: plan.id };
})()`);

const rows = (app, f) => app.evalJs(`(() => {
  const ps = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((p) => p.id === ${J(f.legacy)}) || null;
  const pl = JSON.parse(localStorage.getItem('writer-studio-story-plans') || '[]').find((p) => p.id === ${J(f.plan)}) || null;
  return JSON.stringify({ project: ps, plan: pl });
})()`);

const where = (app) => app.evalJs(`(() => ({
  hash: location.hash,
  editor: !!document.querySelector('.forward-only-editor'),
  arrival: !!document.querySelector('.wz-arrival'),
  pagesOpen: !!document.querySelector('.wz-strip-item[data-category="page"][aria-pressed="true"]') && !!document.querySelector('.wz-cascade-panel[data-visible="true"]'),
}))()`);

// Go to a route (a hash change in the running app, never a fresh boot: a boot could take the resume-on-open landing instead) and wait until
// the hash settles somewhere that is not the route itself (a redirect), or time out and report where it stood.
const land = async (app, route, want) => {
  await app.evalJs(`location.hash = '#' + ${J(route)}`);
  for (let i = 0; i < 60; i += 1) {
    const w = await where(app);
    if (w.hash !== `#${route}` && want(w)) { await sleep(400); return where(app); }
    await sleep(100);
  }
  return where(app);
};

await withHarness(async (app) => {
  await freshDesk(app);
  const f = await seed(app);
  ok('fixture: two drawers, four binders, three pages and a story plan, all through the seams', !!(f && f.A && f.B && f.book && f.empty && f.legacy && f.loose && f.plan), J(f));

  // D6 first, before any route is visited: a boot of the new build leaves the legacy project and its plan byte-identical
  const before = await rows(app, f);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after boot' });
  await sleep(1500);
  const after = await rows(app, f);
  ok('D6: a project with sprintText, a story plan and beat state is byte-identical in storage after a boot of the new build', before === after && JSON.parse(before).project?.sprintText?.includes('old screen') && JSON.parse(before).plan?.currentBeatId === 'need', J({ before, after }));

  // D1 - the project route and its four sub-routes land on the book's first page
  for (const sub of ['', '/sprint', '/wizard', '/beat', '/board']) {
    const route = `/project/${f.book}${sub}`;
    const w = await land(app, route, (x) => x.editor);
    ok(`D1: ${route.replace(f.book, ':book')} lands on the book's FIRST page (the Pages pop-out's order), editor mounted`, w.hash === `#/page/${IDS.a}` && w.editor, J(w));
  }

  // D2 - a project with no pages: its Drawer's first page with the Pages pop-out open at frame width; below the frame, the page
  {
    const w = await land(app, `/project/${f.empty}`, (x) => x.editor);
    ok('D2: a project with no pages lands on its Drawer\'s first page with the Pages pop-out open (frame width, 1400px)', w.hash === `#/page/${IDS.a}` && w.editor && w.pagesOpen, J(w));
    await app.emulateDpr(1, 1099, 900);
    const n = await land(app, `/project/${f.empty}`, (x) => x.editor);
    ok('D2: below the frame (1099px) the same project lands on that page (there is no rail to open)', n.hash === `#/page/${IDS.a}` && n.editor, J(n));
    await app.emulateDpr(1, 1400, 900);
  }

  // D3 - nowhere to go: home, never a blank screen
  for (const [label, route] of [['a project whose Drawer holds no page', `/project/${f.legacy}`], ['the legacy project\'s sprint route', `/project/${f.legacy}/sprint`], ['an unknown project id', '/project/c13-12a-no-such-project'], ['/sprint', '/sprint']]) {
    const w = await land(app, route, (x) => x.arrival);
    ok(`D3: ${label} lands home (the Desk), never a blank screen`, (w.hash === '#/' || w.hash === '') && w.arrival, J(w));
  }

  // D4 - New project: no "Something else"
  {
    await app.evalJs("location.hash = '#/project/new'");
    await app.waitFor("!!document.querySelector('.create-picker')", { label: 'New project picker' });
    const s = await app.evalJs("({ cpElse: !!document.querySelector('.cp-else'), words: document.querySelector('.create-picker').innerText.includes('Something else') })");
    ok('D4: New project offers no "Something else" (no button, no words)', !s.cpElse && !s.words, J(s));
  }

  // D5 - the Drawers list's row (Unsorted is open by default) opens the project's first page
  {
    await app.evalJs("location.hash = '#/drawers'");
    await app.waitFor("[...document.querySelectorAll('.dz-rowtitle')].some((b) => b.textContent.includes('C13 12a Unsorted Book'))", { label: 'Drawers list with the unsorted book' });
    await app.evalJs("[...document.querySelectorAll('.dz-rowtitle')].find((b) => b.textContent.includes('C13 12a Unsorted Book')).click()");
    let w = null;
    for (let i = 0; i < 60; i += 1) { w = await where(app); if (w.editor) break; await sleep(100); }
    await sleep(300);
    w = await where(app);
    ok('D5: the Drawers list\'s project row opens the project\'s first page', w.hash === `#/page/${IDS.u}` && w.editor, J(w));
  }
  return checks;
});

// eslint-disable-next-line no-console
console.log(J(checks));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nC13-12A DOORS VERIFY: PASS (${checks.length} checks)` : `\nC13-12A DOORS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
