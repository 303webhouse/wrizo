// FX12 — the Quiet House (docs/wrizo-alpha/fx12-quiet-house-brief.md). A committed
// CDP verification scenario. Purely ADDITIVE: it proves the retirements' new truths.
// FX12's own A4 park cycles travel VERBATIM in tu1.mjs (the two S4 nudges-content
// checks + the S3 Structure "names the beat" check), in the same commit as this.
//
// Run: node scripts/harness/fx12.mjs   (from apps/desktop, dist-web freshly built).
// HARNESS_PARKED=1: FX12 parks nothing here (the parks are tu1.mjs's).
//
// What FX12 proves:
//   S1 — the nudges sleep whole: the "Waiting for you" section (the 4th tutor-
//        section) unrenders on EVERY surface and the engine sleeps entire — the
//        cd4.mjs no-"Done" pattern applied to "Waiting for you".
//   S3 — Fragments dedupe (V5): each entry lists exactly once, deduped by id at the
//        source (computeFragmentItems' own `seen` set) — an entry that qualifies for
//        BOTH fragment groups (recent-capture AND starred-shared-tag) lists once.
//   (S2 — the beats sentence dies — has its live successor in tu1.mjs's own S3
//        Structure section, beside its park; not re-proven here.)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400);
};

const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before FX12 seed' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(rows)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
};

const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};

const tutorSectionShape = async (app) => app.evalJs(`(() => {
  const sections = document.querySelectorAll('.wz-tutor-section');
  const headers = [...sections].map(s => s.querySelector('.wz-tutor-h')?.textContent);
  return { sectionCount: sections.length, headers, waitingAnywhere: document.body.innerText.includes('Waiting for you') };
})()`);

await withHarness(async (app) => {
  // ======================================================================
  // S1 — the nudges sleep, whole: no "Waiting for you" section on any surface.
  // ======================================================================
  await freshProsePage(app, 1400, 900);
  await openTutor(app);
  const prose = await tutorSectionShape(app);
  ok('FX12 S1: the Tutor on a prose page carries NO "Waiting for you" nudges section (its lens headers — Consistency/Structure/Fragments, plus the Bible on a project page — never include the retired nudges section)',
    !prose.headers.includes('Waiting for you'), JSON.stringify(prose));
  ok('FX12 S1: no "Waiting for you" text renders anywhere on a prose page (the section unrendered, the engine sleeps)',
    prose.waitingAnywhere === false, JSON.stringify(prose));

  // The same Tutor component mounts on a board — the section is gone there too.
  await freshDesk(app, 1400, 900);
  await seedEntries(app, [{ id: 'fx12-board', text: 'a board', projectId: null, pageType: 'board', source: 'page', origin: 'loose', boxes: [], createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z' }]);
  await app.reload(); // hydrate the persistence cache from the seed before navigating (harness-seeding law)
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after FX12 board seed' });
  await app.evalJs("location.hash = '#/page/fx12-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'FX12 board' });
  await sleep(200);
  await openTutor(app);
  const board = await tutorSectionShape(app);
  ok('FX12 S1: the Tutor on a board also shows no "Waiting for you" section (the retirement is in the shared Tutor component, so it holds on every surface)',
    !board.headers.includes('Waiting for you') && board.waitingAnywhere === false, JSON.stringify(board));

  // ======================================================================
  // S3 — Fragments dedupe (V5): each entry lists exactly once, by id at the source.
  // ======================================================================
  await freshProsePage(app, 1400, 900);
  const fragPageId = await app.evalJs("location.hash.split('/page/')[1]");
  // Give the host page a tag so a starred, shared-tag entry qualifies for BOTH the
  // recent-capture group AND the starred-shared-tag group — the dedup must still
  // list it exactly once.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before FX12 frag tag stamp' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const host = entries.find(e => e.id === ${JSON.stringify(fragPageId)});
    if (host) host.tags = ['fx12tag'];
    const now = new Date().toISOString();
    entries.push(
      { id: 'fx12-frag-dup', text: 'Fragment Dup qualifies twice', projectId: null, starred: true, tags: ['fx12tag'], createdAt: now, updatedAt: now },
      { id: 'fx12-frag-plain', text: 'Fragment Plain once', projectId: null, createdAt: now, updatedAt: now },
    );
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(fragPageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'FX12 frag host reloaded' });
  await sleep(300);
  await openTutor(app);
  const frag = await app.evalJs(`(() => {
    const items = [...document.querySelectorAll('.wz-tutor-frag-item')].map(b => b.textContent.trim());
    return {
      items,
      countDup: items.filter(t => t.includes('Fragment Dup')).length,
      countPlain: items.filter(t => t.includes('Fragment Plain')).length,
      uniqueIds: items.length === new Set(items).size,
    };
  })()`);
  ok('FX12 S3: an entry qualifying for BOTH fragment groups (recent-capture AND starred-shared-tag) lists EXACTLY ONCE — deduped by id at the source',
    frag.countDup === 1, JSON.stringify(frag));
  ok('FX12 S3: a plain recent-capture entry also lists exactly once; every fragment-item is a distinct entry',
    frag.countPlain === 1 && frag.uniqueIds === true, JSON.stringify(frag));
});

// === PARKED — FX12's own A4 park cycles live in tu1.mjs (same commit); additive here. ==
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nFX12 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; FX12\'s own park cycles travel in tu1.mjs (the two S4 nudges-content checks + the S3 Structure "names the beat" check, parked verbatim with live successors). This file is purely additive.');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX12 VERIFY: PASS (${checks.length} checks)` : `\nFX12 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
