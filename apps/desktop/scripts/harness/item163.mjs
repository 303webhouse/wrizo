// ITEM 163 — THE LOCATION LINE SAYS "IN", ON THE BOX. Auto-discovered by
// run-suite.mjs; no registration. Run with an ABSOLUTE worktree path.
//
// ⚠ A WORKTREE ISOLATES FILES, NOT THE BOX. One machine, one browser pool: a run
// from ANY tree is a run on the box. The turn comes by announcement, never
// inferred from quiet.
//
// WHY THIS FILE EXISTS. Item 163's browserless proof (item163-drawer-line-proof.mjs)
// runs the REAL reader against a fixture with the REAL lexicon, so it proves the
// STRING and the wiring — that all three sites call one reader and that the two
// untouched forms are untouched. What it cannot do is show the line RENDERED on
// the three surfaces a writer actually reads it on. That was owed to a box run
// inside Experiment 1's scenario, which cannot merge until `visibleText` is
// re-derived from FIX's markRuns.ts; Fable's ruling (2026-09-25) pulls it out so
// it rides Batch Eight on 163's own branch.
//
// THE THREE SURFACES, which is the whole ticket — one fact, three faces, and
// before 163 two of them disagreed:
//   C1  the Plan panel's board ROW, second line   (.wz-cascade-boardrow-relation)
//   C2  the Plan zone's CAPTION on a board        (.wz-cascade-plan-caption)
//   C3  the canvas BOARD-CARD's second line       (.board-pin-excerpt)
// C4 then asserts they are the SAME STRING, which is the only assertion that
// actually tests "one reader" from outside: three sites can each be right about
// their own wording and still disagree, which is exactly the state 163 found.
//
// ⚠ THE EXPECTED STRING IS READ FROM THE LEXICON AT RUNTIME, never typed here.
// A harness that hardcodes "in" stops testing the product the moment the term is
// re-worded, and reports a red about its own staleness. `window.wrizoDeskLexicon`
// is the app's own inspection seam for exactly this.
//
// THE STANDING HARNESS LAWS, carried from pw1/pw2: drivers never assume existence
// (a bare .click() on a missing node aborts the FILE and reports nothing);
// probes drive REAL pointer events through CDP Input; seed through the seams,
// never raw localStorage — the cache is the hazard, not the surface; origin and
// source are carried EXPLICITLY, because the absence of a key is a value; and
// handles are selected BY NAME, never by index. `wakeChrome`/`openPlan`/`pressEl`
// below are pw1.mjs's own, reused verbatim rather than re-derived.
import { withHarness } from '../runtime-verify.mjs';
import { hittablePointBy } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const settle = async (app, expr, ms = 4000, step = 100) => {
  const deadline = Date.now() + ms;
  let v = await app.evalJs(expr);
  while (v !== true && Date.now() < deadline) { await sleep(step); v = await app.evalJs(expr); }
  return v;
};

const must = async (app, sel, what) => {
  const there = await app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
  if (!there) ok(`DRIVER: ${what} — the target (${sel}) is present to act on`, false, 'absent');
  return there;
};

// pw1.mjs's own, verbatim.
const pressEl = async (app, elExpr, what) => {
  const p = await hittablePointBy(app, elExpr);
  if (!p) { ok(`DRIVER: ${what} — the target is present to act on`, false, 'absent'); return false; }
  if (!p.found) { ok(`DRIVER: ${what} — a point inside the target is reachable by a real pointer (not occluded)`, false, JSON.stringify(p)); return false; }
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  return true;
};

const wakeChrome = async (app) => {
  await app.mouseMove(640, 300);
  await app.mouseMove(640, 40);
  await app.mouseMove(642, 12);
  await app.mouseMove(640, 8);
  await sleep(600);
};

// IDEMPOTENT (pw1's reasoning, verbatim): the strip button TOGGLES, so pressing
// it when Plan is already open would close the panel — and a probe that silently
// closed what it meant to open fails later, somewhere else, for a reason that
// reads as a product bug. Ask first.
const openPlan = async (app) => {
  const already = await app.evalJs("!!document.querySelector('.wz-cascade-plan-zone') || (!!document.querySelector('.wz-cascade-panel') && document.querySelector('.wz-strip-item[data-category=plan]')?.getAttribute('aria-pressed') === 'true')");
  if (already) return true;
  const there = await app.evalJs("!!document.querySelector('.wz-strip-item[data-category=plan]')");
  if (!there) { ok('DRIVER: the cascade strip is mounted with a Plan category', false, 'strip missing'); return false; }
  await wakeChrome(app);
  const opened = await pressEl(app, "document.querySelector('.wz-strip-item[data-category=plan]')", 'the strip Plan category opens');
  if (!opened) return false;
  await sleep(300);
  return true;
};

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

// SEEDED THROUGH THE SEAM, with origin/source EXPLICIT on every row (an absent
// key is a different row, not the same row missing a field). The wait is on the
// STORED ids because the seam's write is debounced.
const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  for (const r of rows) {
    const row = { ...r, origin: 'origin' in r ? r.origin : null, source: 'source' in r ? r.source : null };
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  }
  const ids = rows.map((r) => r.id);
  await settle(app, `(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').map(e => e.id); return ${JSON.stringify(ids)}.every(id => es.includes(id)); })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed hydrate' });
};

const textOf = (app, sel) =>
  app.evalJs(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);

await withHarness(async (app) => {
  await freshDesk(app, 1400, 900);

  // ==========================================================================
  // THE FIXTURE. `boardDrawerLine` names the board's PROJECT (its title is the
  // "drawer" the line speaks of), so the fixture needs a real project, made
  // through the product's own seam.
  // ==========================================================================
  const DRAWER = 'Item 163 Drawer';
  const projectId = await app.evalJs(`window.wrizoCreateProject(${JSON.stringify(DRAWER)})?.id ?? null`);
  ok('FIXTURE: a real project exists to be named (made through the product\'s own seam)',
    typeof projectId === 'string' && projectId.length > 0, String(projectId));

  await seedEntries(app, [
    // The board whose line all three surfaces read. In the drawer.
    { id: 'i163-board', text: 'Item 163 Board', projectId, pageType: 'board', boxes: [] },
    // A page pinned to it, so the board appears as a ROW in the page's Plan panel.
    { id: 'i163-page', text: 'Item 163 Page', projectId, pageType: 'manuscript' },
    // A host wall, to render the canvas board-card face.
    { id: 'i163-wall', text: 'Item 163 Wall', projectId, pageType: 'board', boxes: [] },
    // ⚠ THE SCOPE HALF, on the box: a board with NO drawer must keep its OWN
    // form, unprefixed. "in Not in a drawer" is the nonsense a careless swap
    // produces, and a check that only looked for "in " would never see it.
    { id: 'i163-loose-board', text: 'Item 163 Loose Board', projectId: null, pageType: 'board', boxes: [] },
  ]);

  const pinnedPage = await app.evalJs("!!window.wrizoPinPageToBoard('i163-page', 'i163-board')");
  const nested = await app.evalJs("!!window.wrizoPinPageToBoard('i163-board', 'i163-wall')");
  const nestedLoose = await app.evalJs("!!window.wrizoPinPageToBoard('i163-loose-board', 'i163-wall')");
  ok('FIXTURE: the page\'s membership and both nested boards were made through the seam',
    pinnedPage === true && nested === true && nestedLoose === true,
    JSON.stringify({ pinnedPage, nested, nestedLoose }));
  await app.evalJs('window.wrizoFlushNow()');

  // THE EXPECTED STRINGS, READ FROM THE LEXICON — never typed into this file.
  const lex = await app.evalJs(`(() => {
    const L = window.wrizoDeskLexicon;
    if (!L || typeof L.t !== 'function') return null;
    return { in: L.t('cascadePlanCaptionIn'), noDrawer: L.t('cascadePlanNoDrawer') };
  })()`);
  if (!lex) {
    ok('DRIVER: the lexicon inspection seam (window.wrizoDeskLexicon) is present, so the expected string can be READ rather than hardcoded', false, 'absent');
  } else {
    ok(`FIXTURE: the expected forms come from the lexicon — "${lex.in}" and "${lex.noDrawer}"`,
      typeof lex.in === 'string' && lex.in.length > 0 && typeof lex.noDrawer === 'string' && lex.noDrawer.length > 0,
      JSON.stringify(lex));
    const WANT = `${lex.in} ${DRAWER}`;
    const seen = {};

    // ========================================================================
    // C1 — THE PLAN PANEL'S BOARD ROW, second line. Read on the PAGE, which is
    // where a writer meets the row.
    // ========================================================================
    await app.evalJs("location.hash = '#/page/i163-page'");
    // A NON-THROWING WAIT. `app.waitFor` THROWS on timeout, which aborts the
    // whole FILE and reports nothing downstream — the same hazard as a bare
    // `.click()`, one layer up. `settle` returns the verdict instead, so a page
    // that never mounts becomes a NAMED failure here.
    const pageMounted = await settle(app, "!!document.querySelector('.wz-strip-item[data-category=plan]')");
    ok('DRIVER: the 163 page is framed with its cascade strip mounted', pageMounted === true, String(pageMounted));
    await sleep(350);
    if (await openPlan(app)) {
      // ⚠ SELECTED BY ITS NAMED HANDLE, NEVER BY TITLE OR INDEX. `data-own` is
      // the row's own attribute for exactly this distinction (an OWN plan-board
      // row carries a different relation by design — the form C4 of the
      // browserless proof pins by name). Matching on the fixture's title would
      // couple this check to how the product derives a row's title, and an index
      // would go GREEN ABOUT SOMETHING ELSE the day a row is added.
      const rows = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-boardrow[data-own="false"]')].map(r => ({
        title: r.querySelector('.wz-cascade-boardrow-title')?.textContent,
        relation: r.querySelector('.wz-cascade-boardrow-relation')?.textContent,
      }))`);
      const row = (rows || []).length === 1 ? rows[0] : null;
      if (!row) {
        ok('C1: exactly one CONNECTED (not own) board row is present to read — the fixture pinned the page to exactly one board',
          false, JSON.stringify(rows));
      } else {
        seen.row = row.relation;
        ok('C1-pre: and that row is the fixture\'s board, so C1 is measured on the right row',
          row.title === 'Item 163 Board', JSON.stringify(row));
        ok(`C1: the Plan panel's board ROW reads its second line as "${WANT}" — the caption form, not a bare name read as a subtitle`,
          row.relation === WANT, JSON.stringify(row));
        ok('C1b: and it is NOT the bare drawer name — the defect item 163 was raised about, asserted as its own claim',
          row.relation !== DRAWER, JSON.stringify(row.relation));
      }
    }

    // ========================================================================
    // C2 — THE PLAN ZONE'S CAPTION, read ON the board itself. This face was
    // already correct before 163; it is asserted so the swap cannot pass by
    // having quietly broken the one site that was right.
    // ========================================================================
    await app.evalJs("location.hash = '#/page/i163-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the 163 board, framed' });
    await sleep(350);
    if (await openPlan(app)) {
      if (await must(app, '.wz-cascade-plan-caption', 'the Plan zone caption on a board')) {
        const caption = await textOf(app, '.wz-cascade-plan-caption');
        seen.caption = caption;
        ok(`C2: the Plan zone's CAPTION on the board reads "${WANT}"`, caption === WANT, JSON.stringify(caption));
      }
    }

    // ========================================================================
    // C3 — THE CANVAS BOARD-CARD's second line, and C5 beside it: the same
    // canvas carries a board with NO drawer, so the two forms are read from ONE
    // surface and the scope is visible rather than argued.
    // ========================================================================
    await app.evalJs("location.hash = '#/page/i163-wall'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the 163 wall, framed' });
    await sleep(400);
    {
      const cards = await app.evalJs(`[...document.querySelectorAll('.board-boardcard')].map(c => ({
        title: c.querySelector('.board-pin-title')?.textContent,
        excerpt: c.querySelector('.board-pin-excerpt')?.textContent,
        badge: c.querySelector('.board-pin-badge')?.textContent,
      }))`);
      const drawered = (cards || []).find((c) => c.title === 'Item 163 Board');
      const loose = (cards || []).find((c) => c.title === 'Item 163 Loose Board');
      if (!drawered || !loose) {
        ok('C3: both board-cards are on the wall to read', false, JSON.stringify(cards));
      } else {
        seen.card = drawered.excerpt;
        ok(`C3: the canvas BOARD-CARD's second line reads "${WANT}" — the third site, widened to the canvas by Nick's ruling`,
          drawered.excerpt === WANT, JSON.stringify(drawered));
        ok(`C5: and a board with NO drawer keeps its OWN form, unprefixed — "${lex.noDrawer}", never "${lex.in} ${lex.noDrawer}"`,
          loose.excerpt === lex.noDrawer, JSON.stringify(loose));
        ok('C5b: the two cards are the same kind of card (both carry the Board badge), so C5 is a difference in the LINE and not in the surface',
          !!drawered.badge && drawered.badge === loose.badge, JSON.stringify({ a: drawered.badge, b: loose.badge }));
      }
    }

    // ========================================================================
    // C4 — ONE READER, asserted the only way an outside observer can: the three
    // faces must produce the IDENTICAL string. Three sites can each be
    // plausibly worded and still disagree — that was the state 163 found, with
    // two spellings of one fact, one right and one wrong.
    // ========================================================================
    const got = [seen.row, seen.caption, seen.card];
    const all = got.filter((s) => typeof s === 'string');
    ok('C4: all three surfaces were actually read (a three-way agreement over two readings is not an agreement)',
      all.length === 3, JSON.stringify(seen));
    ok('C4b: and the three faces of one board read the IDENTICAL line — one reader, proven from outside the code',
      all.length === 3 && new Set(all).size === 1, JSON.stringify(seen));
  }
});

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ============
// EMIT THE ARRAY, EVEN EMPTY. Item 163 retires nothing: it changed two lines from
// a bare name to the caption form, and a sweep of 155 files (the browserless
// proof's CLAIM 5) found no check anywhere asserting the bare-name spelling as a
// pass/fail condition — the two wrong sites were never covered, which is how they
// stayed wrong. Printed anyway, because an array that is never emitted reads the
// same to the counter as one that silently lost a record.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
for (const c of allChecks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? '  ok  ' : '  FAIL'} ${c.name}${c.detail ? `  ${c.detail}` : ''}`);
}
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM163 VERIFY: PASS (${allChecks.length} checks)` : `\nITEM163 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
