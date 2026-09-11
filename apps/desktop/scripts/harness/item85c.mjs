// ITEM 85-C — THE AUTHORING SEAMS, PROVEN. A committed CDP verification
// scenario, per AGENTS.md's "harness scenarios persist."
//
// WHY THIS FILE EXISTS AT ALL. Phase 1 of item 85-C added seven seams and seven
// seed fields to persistence.ts. A seam that is never exercised is a
// decoration — it reports a capability it may not have — and this repo has
// already watched a guard nearly ship green on two blind spots that were both
// empty in the tree. So every seam is driven here, and the drive is not "does
// it write a row".
//
// THE CHECK THAT ACTUALLY MATTERS is S2, and it is the whole argument for the
// seams existing:
//
//   A RAW-SEEDED ROW IS DESTROYED BY THE NEXT PRODUCT WRITE. A SEAM-SEEDED ROW
//   IS NOT.
//
// persistence.ts hydrates its cache once at module init and never re-reads it;
// any product write then serialises that WHOLE cache back over storage, and the
// cache never contained the raw row. So the raw row vanishes — with no timing
// signature, which is why no settle poll ever fixed it and why it presented for
// a day as a ~50% flake. S2 drives both halves in the same run, on the same
// page, so the comparison is a measurement rather than a claim: seed one row
// raw and one through the seam, perform ONE ordinary product write, and read
// both back.
//
// Without the raw half, S2 would prove only that a row written through the
// store is still there afterwards — which is not news. The raw half is the
// control that makes the seam half mean something.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Seam writes are DEBOUNCED like every other product write (scheduleFlush,
// 300ms) — the raw writes they replace were synchronous, and that is the one
// behavioural difference a migrating fixture has to absorb. Every read of
// localStorage below waits for the row to land rather than assuming it has.
const FLUSH = 600;

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

await withHarness(async (app) => {
  // =========================================================================
  // S1 — EVERY SEAM IS ATTACHED AND AUTHORS WHAT IT CLAIMS.
  // Structural first: a missing seam must fail here as a named absence, not
  // later as a confusing TypeError inside a fixture that was trying to use it.
  // =========================================================================
  await freshDesk(app);
  const attached = await app.evalJs(`JSON.stringify([
    'wrizoCreateJournalPage','wrizoPatchEntry','wrizoCreateProject','wrizoCreateBinder',
    'wrizoPatchProject','wrizoCreateStoryPlan','wrizoCreateDrawer','wrizoSetProjectDrawer',
  ].filter(n => typeof window[n] !== 'function'))`);
  ok('S1: every 85-C seam is attached to window as a function — a seam that is absent fails here by NAME, rather than as a TypeError inside whichever fixture first reaches for it',
    attached === '[]', `missing: ${attached}`);

  // The seven new seed fields, driven through the real birth path in one call.
  const seeded = await app.evalJs(`(() => {
    const e = window.wrizoCreateJournalPage({
      id: '85c-seed', text: 'seeded', pageType: 'board', origin: 'loose',
      starred: true, tags: ['85c'], shelved: true, orderIndex: 7,
      createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2021-02-03T00:00:00.000Z',
      boxes: [], script: { v: 1, scenes: [] },
    });
    return JSON.stringify({ id: e.id, starred: e.starred, tags: e.tags, shelved: e.shelved,
      orderIndex: e.orderIndex, createdAt: e.createdAt, updatedAt: e.updatedAt,
      pageType: e.pageType, origin: e.origin, hasScript: !!e.script });
  })()`);
  const s = JSON.parse(seeded);
  ok('S1: the seven new seed fields all reach the row through the real birth path — script, starred, tags, shelved, orderIndex, and a createdAt/updatedAt that DIFFER (the one thing b2.mjs needs and the only reason updatedAt is in the list)',
    s.starred === true && JSON.stringify(s.tags) === '["85c"]' && s.shelved === true
    && s.orderIndex === 7 && s.hasScript === true
    && s.createdAt === '2020-01-01T00:00:00.000Z' && s.updatedAt === '2021-02-03T00:00:00.000Z', seeded);

  // The control that keeps S1 honest: an UNSEEDED call must still write the
  // byte-identical row it always wrote. A widened seam that changed the
  // default row would be a behaviour change wearing a seam's clothes.
  const unseeded = await app.evalJs(`(() => {
    const e = window.wrizoCreateJournalPage();
    return JSON.stringify({ starred: e.starred, tags: e.tags, shelved: e.shelved,
      orderIndex: e.orderIndex, script: e.script, sameTimes: e.createdAt === e.updatedAt,
      source: e.source, origin: e.origin });
  })()`);
  const u = JSON.parse(unseeded);
  ok('S1 (the control): an UNSEEDED call is untouched by the widening — none of the seven fields appears, source is still page, origin still journal, and updatedAt still equals createdAt. Zero behaviour change, demonstrated rather than asserted',
    u.starred === undefined && u.tags === undefined && u.shelved === undefined
    && u.orderIndex === undefined && u.script === undefined && u.sameTimes === true
    && u.source === 'page' && u.origin === 'journal', unseeded);

  // =========================================================================
  // S2 — THE POINT OF THE WHOLE ITEM. Raw vs seam, same run, same product
  // write, read back together.
  // =========================================================================
  await freshDesk(app);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: '85c-raw', text: 'seeded raw', source: 'page', origin: 'loose', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.evalJs("window.wrizoCreateJournalPage({ id: '85c-seam', text: 'seeded through the seam', origin: 'loose' })");
  await sleep(FLUSH);
  const bothBefore = await app.evalJs(`(() => {
    const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return JSON.stringify({ raw: es.some(e => e.id === '85c-raw'), seam: es.some(e => e.id === '85c-seam') });
  })()`);
  ok('S2 (the premise): immediately after seeding, BOTH rows are in storage — so the divergence below is caused by the product write, not by one of them never having been written',
    JSON.parse(bothBefore).raw === true && JSON.parse(bothBefore).seam === true, bothBefore);

  // ONE ordinary product write. Nothing exotic: the same call any fixture
  // makes the moment it does something real.
  await app.evalJs("window.wrizoCreateJournalPage({ text: 'an ordinary product write' })");
  await sleep(FLUSH);
  const bothAfter = await app.evalJs(`(() => {
    const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return JSON.stringify({ raw: es.some(e => e.id === '85c-raw'), seam: es.some(e => e.id === '85c-seam') });
  })()`);
  const after = JSON.parse(bothAfter);
  ok('S2: THE RAW ROW IS GONE after one ordinary product write — the whole-cache re-serialisation, reproduced deliberately. This is the defect item 85 exists for, and it is what 54 harness files are still exposed to',
    after.raw === false, bothAfter);
  ok('S2: THE SEAM ROW SURVIVES the identical write, in the same run on the same page — which is the entire argument for the seams, measured side by side rather than asserted',
    after.seam === true, bothAfter);

  // =========================================================================
  // S3 — THE COLLECTION SEAMS: the three that did not exist at all, which is
  // why 13 files could not stop writing raw.
  // =========================================================================
  await freshDesk(app);
  const collections = await app.evalJs(`(() => {
    const proj = window.wrizoCreateProject('85C Project');
    const binder = window.wrizoCreateBinder('85C Binder', 'book');
    const drawer = window.wrizoCreateDrawer('85C Drawer');
    window.wrizoSetProjectDrawer(proj.id, drawer.id);
    const plan = window.wrizoCreateStoryPlan(proj.id, 'three_act', ['setup','midpoint','resolution']);
    return JSON.stringify({
      projectId: proj.id, binderKind: binder.kind, drawerName: drawer.name,
      planId: plan.id, planProject: plan.projectId, beats: plan.beatNotes.length,
    });
  })()`);
  const c = JSON.parse(collections);
  ok('S3: the three collections that had NO authoring seam now have one — a project, a binder with a kind, and a drawer are all born through the store rather than past it',
    typeof c.projectId === 'string' && c.projectId.length > 0 && c.binderKind === 'book'
    && c.drawerName === '85C Drawer', collections);
  ok('S3: wrizoCreateStoryPlan authors the plan with its beats — the collection j5.mjs names in its own source as unreachable ("no wrizo* seam authors one — item 85 phase 2")',
    typeof c.planId === 'string' && c.planProject === c.projectId && c.beats === 3, collections);

  await sleep(FLUSH);
  // createStoryPlan stamps project.storyPlanId itself — so the fixtures that
  // set that field by hand were duplicating work the creator already does.
  // Proven, because "the creator already does it" is exactly the kind of claim
  // that is true right up until it is not.
  const stamped = await app.evalJs(`(() => {
    const ps = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const p = ps.find(x => x.title === '85C Project');
    const ds = JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]');
    return JSON.stringify({ storyPlanId: p && p.storyPlanId, drawerId: p && p.drawerId, drawers: ds.length });
  })()`);
  const st = JSON.parse(stamped);
  ok('S3: creating a plan through the seam ALSO stamps project.storyPlanId, and wrizoSetProjectDrawer files the project — so the b2-1/m1 fixtures that set both fields by hand were duplicating what the creators already do',
    st.storyPlanId === c.planId && st.drawerId && st.drawers === 1, stamped);

  // =========================================================================
  // S4 — THE MUTATION SEAMS: setting a field on a row that already exists,
  // which 7 files reach past the store to do today.
  // =========================================================================
  const patched = await app.evalJs(`(() => {
    const e = window.wrizoCreateJournalPage({ id: '85c-patch', text: 'original text', origin: 'loose' });
    const after = window.wrizoPatchEntry('85c-patch', { tags: ['gilded'], starred: true,
      tutor: { messages: [{ id: 'm1', role: 'writer', text: 'hello', at: new Date().toISOString() }] } });
    return JSON.stringify({ tags: after.tags, starred: after.starred,
      msgs: after.tutor && after.tutor.messages.length, textKept: after.text, born: e.id });
  })()`);
  const p = JSON.parse(patched);
  ok('S4: wrizoPatchEntry sets tags, starred and tutor on an EXISTING row — the four field mutations fx10/tu1/tu2/m2/m3/m4 perform raw today',
    JSON.stringify(p.tags) === '["gilded"]' && p.starred === true && p.msgs === 1, patched);
  ok('S4: and the patch KEEPS the row\'s own text — patchJournalEntry re-injects it on every write so a field mutation never clobbers a freshly-typed run, which is the discipline it was built for',
    p.textKept === 'original text', patched);

  const renamed = await app.evalJs(`(() => {
    const proj = window.wrizoCreateProject('Before Rename');
    const after = window.wrizoPatchProject(proj.id, { title: 'Renamed Grammar Project' });
    return JSON.stringify({ id: proj.id, sameId: after.id === proj.id, title: after.title });
  })()`);
  const r = JSON.parse(renamed);
  ok('S4: wrizoPatchProject renames a project WITHOUT changing its id — the exact fixture fx9.mjs performs raw to prove its folds are id-keyed, and the one seam here that composes (getProject + saveProject) because no first-class project mutator exists to wrap',
    r.sameId === true && r.title === 'Renamed Grammar Project', renamed);

  // The mutation seams' own not-found control: a patch against a row that does
  // not exist must return null rather than inventing one. A seam that silently
  // creates on patch would turn a fixture's typo into a passing test.
  const missing = await app.evalJs(`JSON.stringify({
    entry: window.wrizoPatchEntry('no-such-row', { starred: true }),
    project: window.wrizoPatchProject('no-such-project', { title: 'x' }),
  })`);
  ok('S4 (the control): patching a row that does not exist returns null for both seams and creates nothing — a seam that silently created on patch would turn a fixture\'s typo into a passing check',
    JSON.parse(missing).entry === null && JSON.parse(missing).project === null, missing);
});

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM85C VERIFY: PASS (${checks.length} checks)`
  : `\nITEM85C VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
