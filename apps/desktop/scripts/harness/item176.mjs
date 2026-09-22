// ITEM 176 — THE PICKER SAYS WHAT IT OFFERS.
//
// The finding this file guards, in the sitting's own words: a writer was not
// missing a door, he was looking at one that denied being it. The board's
// "Existing page…" picker ALREADY offered boards — `getJournalEntries()` is
// unfiltered by pageType — and rendered each as a bare title inside a sheet
// whose own words say "page". Nesting had a door; nothing about it said so.
//
// SCOPE, held deliberately and asserted below: this fixes the LIE (a board in
// a candidate list says it is a board) and NOT the door's name, which changes
// again under 144's tab-bar redesign and belongs to PLAN DESK.
//
// Helpers below are pw2.mjs's, reused verbatim rather than re-derived — the
// house practice for a proven fixture block.
import { withHarness } from '../runtime-verify.mjs';
import { hittablePointBy, hittablePoint } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const WIDE_W = 2200;

const settle = async (app, expr, ms = 4000, step = 100) => {
  const deadline = Date.now() + ms;
  let v = await app.evalJs(expr);
  while (v !== true && Date.now() < deadline) { await sleep(step); v = await app.evalJs(expr); }
  return v;
};

// DRIVERS NEVER ASSUME EXISTENCE. Probe for `sel`; if it is missing, record a
// FAILED check that names it and return false so the caller can skip the act
// without throwing. The file keeps reporting either way.
const must = async (app, sel, what) => {
  const there = await app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
  if (!there) ok(`DRIVER: ${what} — the target (${sel}) is present to act on`, false, 'absent');
  return there;
};

// A non-throwing wait. `app.waitFor` THROWS on timeout, which aborts the whole
// file — the same hazard as a bare `.click()`, one layer up, and just as fatal
// to the run's ability to report. This waits, and on timeout records a FAILED
// CHECK THAT NAMES what it was waiting for, letting the rest still speak.
const waitOr = async (app, expr, what, ms = 6000) => {
  const got = await settle(app, expr, ms);
  if (got !== true) ok(`DRIVER: ${what}`, false, `timed out waiting for ${expr}`);
  return got === true;
};

// A genuinely trusted press on a selector, at a point that GENUINELY HITS IT.
//
// ⚠ THE PREMISE THAT FIRST MOTIVATED THIS IS NOW DEAD, AND SAYING SO IS THE
// POINT (the 85-C canon: a check can pass for the WRONG REASON once its premise
// has been fixed under it). When this helper was written, the framed stage
// overlapped the strip's right ~54%, so a strip item's own CENTRE hit-tested to
// `.desk-frame-stage` rather than the button — the finding that became ITEM 130.
// **Item 130 is fixed and merged** (the strip wins its own band); the centre is
// reachable again, and the scan below now finds it on its first candidate.
//
// THE HELPER STAYS, and not out of sentiment. Two reasons, both live:
//   1. It is the only reason the occlusion was ever visible. Every other harness
//      reaches these controls with `.click()`, which bypasses hit-testing
//      entirely — the synthetic event did not invent a false red, it CONCEALED a
//      true one for as long as it was used.
//   2. A press that silently lands on an overlay is indistinguishable from a
//      product that ignored it. Probing first means a future occlusion — of any
//      control, from any cause — surfaces as a NAMED failure ("a point inside
//      the target is reachable by a real pointer") instead of as a mystery red
//      somewhere downstream.
//
// So: find a point inside the element that `elementFromPoint` genuinely resolves
// to, and press THERE with real CDP pointer events. If no point in the element
// is reachable, that is a real finding and it is recorded as such.
// ITEM 151 -- hittablePointBy/hittablePoint now live in ../trusted-point.mjs,
// converged from pw1.mjs's own copy (where item 130's occlusion was first
// proven) so both files share one instrument rather than two copies of it.

// Press whatever `elExpr` (a JS expression evaluated in the page) resolves to.
const pressEl = async (app, elExpr, what) => {
  const p = await hittablePointBy(app, elExpr);
  if (!p) { ok(`DRIVER: ${what} — the target is present to act on`, false, 'absent'); return false; }
  if (!p.found) { ok(`DRIVER: ${what} — a point inside the target is reachable by a real pointer (not occluded)`, false, JSON.stringify(p)); return false; }
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  return true;
};

const pressOn = async (app, sel, what) => {
  if (!(await must(app, sel, what))) return false;
  const p = await hittablePoint(app, sel);
  if (!p || !p.found) { ok(`DRIVER: ${what} — a point inside the target is reachable by a real pointer (not occluded)`, false, JSON.stringify(p)); return false; }
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  return true;
};
const pressCentre = pressOn;

const dblCentre = async (app, sel, what) => {
  if (!(await must(app, sel, what))) return false;
  const p = await hittablePoint(app, sel);
  if (!p || !p.found) { ok(`DRIVER: ${what} — a point inside the target is reachable by a real pointer (not occluded)`, false, JSON.stringify(p)); return false; }
  await app.doubleClick(p.x, p.y);
  return true;
};

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

// SEEDED THROUGH THE SEAM (see the header). Waits for the debounced flush to
// LAND before reloading, because the reload hydrates the cache from storage.
const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  for (const row of rows) await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  const ids = rows.map((r) => r.id);
  await settle(app, `(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').map(e => e.id); return ${JSON.stringify(ids)}.every(id => es.includes(id)); })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed hydrate' });
};

const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// ⚠ STRIP ITEMS ARE SELECTED BY NAME, NEVER BY INDEX. An index encodes the
// strip's current ORDER into every probe that uses it, so the day a category is
// added, removed or reordered, a run does not report a moved control — it
// silently presses a DIFFERENT one and asserts against the wrong panel. The
// failure is not a red; it is a GREEN ABOUT SOMETHING ELSE.
//
// THE HANDLE IS `data-category`, AS OF VW1. This file first used the label's
// own text, because `.wz-strip-item` carried no per-category attribute — which
// worked, but made the probe depend on a LEXICON TERM: rewording "Plan" in the
// desk lexicon would have broken every check that reached the panel, and broken
// them silently in the same green-about-something-else way. VW1 puts the
// category's own id on the element (`data-category={item.id}`), so the handle is
// now the thing the code calls it rather than the word the writer reads. A
// rewording cannot touch it.
const STRIP_PLAN = "document.querySelector('.wz-strip-item[data-category=plan]')";

// The chrome RECEDES while the writer types (the vanishing law) and takes
// `pointer-events` with it, so a band control is genuinely unreachable until a
// pointer stirs. That is correct product behaviour, not an obstacle to route
// around: a real hand moves before it clicks, so the probe does too.
// The restore is not "any movement": `useChromeDissolve` wants the pointer AT
// AN EDGE (or over the dissolved chrome itself) held for EDGE_DWELL_MS, which
// is exactly a deliberate reach rather than a passing sweep. So the probe
// reaches the way a hand does — up to the band, and it waits there.
const wakeChrome = async (app) => {
  await app.mouseMove(640, 300);
  await app.mouseMove(640, 40);
  await app.mouseMove(642, 12);
  await app.mouseMove(640, 8);
  await sleep(600);
};

// IDEMPOTENT: the strip button TOGGLES, so pressing it when Plan is already
// open would close the panel — and a probe that silently closed what it meant
// to open would fail later, somewhere else, for a reason that reads as a
// product bug. Ask first.
const openPlan = async (app) => {
  const already = await app.evalJs(`!!document.querySelector('.wz-cascade-plan-zone') || (!!document.querySelector('.wz-cascade-panel') && ${STRIP_PLAN}?.getAttribute('aria-pressed') === 'true')`);
  if (already) return true;
  // NAME AND ASSERTION AGREE NOW. This read `.wz-strip-item').length > 2` —
  // a COUNT, which was only ever a proxy for "index 2 exists" back when the
  // handle was an index. Under a named handle the count is the wrong
  // question twice over: a strip of three categories with NO Plan passes it,
  // and a strip that reorders passes it while the press lands elsewhere. The
  // check is named for the Plan category, so it asserts the Plan category.
  const there = await app.evalJs("!!document.querySelector('.wz-strip-item[data-category=plan]')");
  if (!there) { ok('DRIVER: the cascade strip is mounted with a Plan category', false, 'strip missing'); return false; }
  await wakeChrome(app);
  const opened = await pressEl(app, STRIP_PLAN, 'the strip Plan category opens');
  if (!opened) return false;
  await sleep(300);
  return true;
};

const planRows = (app) => app.evalJs(`[...document.querySelectorAll('.wz-cascade-boardrow')].map(r => ({
  title: r.querySelector('.wz-cascade-boardrow-title')?.textContent,
  relation: r.querySelector('.wz-cascade-boardrow-relation')?.textContent,
}))`);

const boardOf = (app, id) => app.evalJs(`(() => {
  const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(id)});
  return e ? { boxes: e.boxes || [] } : null;
})()`);

const pinsOf = async (app, boardId) => {
  const b = await boardOf(app, boardId);
  return (b?.boxes ?? []).filter((x) => x.kind === 'page-pin').map((x) => x.entryId);
};

await withHarness(async (app) => {

  // ==========================================================================
  // ITEM 176 — A BOARD IN A CANDIDATE LIST SAYS IT IS A BOARD.
  //
  // The defect was NAMING, not absence: this picker already offered boards and
  // rendered them as bare titles, inside a sheet whose own words say "page".
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await seedEntries(app, [
    { id: 'i176-host', text: 'The host board', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
    { id: 'i176-board', text: 'A nestable board', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
    { id: 'i176-page', text: 'An ordinary page', origin: 'loose', projectId: null },
  ]);
  await app.evalJs("location.hash = '#/page/i176-host'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'the host board mounts');
  await sleep(500);

  // REACHED VIA THE BEGINNINGS DOOR, and the first attempt taught me why.
  //
  // This first drove the board's SLIVER copy of the door, chosen because it is
  // not mode-gated. The probe refused: `{found:false, why:'occluded', by:
  // 'wz-strip-item'}` — no point inside that button hit-tests to it, because
  // the sliver was never OPENED and its collapsed panel sits under the strip's
  // own band (which item 130 deliberately raised). The driver did its job: it
  // named the refusal instead of pressing whatever was on top. Opening the
  // sliver is a separate affordance and not what this check is about.
  //
  // The beginnings door is the writer's own route on an EMPTY board, and this
  // fixture's host board is empty by construction, so the row renders. Its
  // handle is a NAME (`data-beginning`), never an index or a label — the same
  // law the strip handle follows.
  const rowThere = await app.evalJs("!!document.querySelector('.wz-beginnings')");
  ok('ITEM 176 (precondition): the empty host board shows its beginnings row, so the picker has a door to open — asserted rather than assumed, because a missing row would make every check below unreachable for a reason that has nothing to do with 176',
    rowThere === true, String(rowThere));
  const opened = rowThere && await pressEl(app, "document.querySelector('.wz-beginning[data-beginning=\"connectPage\"]')", 'the beginnings door opens the existing-page picker');
  if (!opened) {
    ok('ITEM 176: the candidate picker is reachable to inspect', false, 'connectPage door not reachable');
  } else {
    await sleep(400);
    const rows = await app.evalJs(`[...document.querySelectorAll('.board-sheet .dz-row')].map(r => ({
      title: r.querySelector('.dz-rowtitle')?.textContent,
      swatch: [...r.querySelectorAll('span')].map(s => s.className).find(c => /wz-thumb-/.test(c)) || null,
      tag: r.querySelector('.wz-kindtag')?.textContent || null,
    }))`);
    const board = (rows || []).find((r) => r.title === 'A nestable board');
    const page = (rows || []).find((r) => r.title === 'An ordinary page');

    // ⚠ THE PRECONDITION, so the checks below cannot pass vacuously. If no
    // board ever reached this list, "every board row is marked" would be true
    // of the empty set and would prove nothing — and the ORIGINAL defect was
    // precisely that boards DO reach it.
    ok('ITEM 176 (precondition): a board genuinely reaches this candidate list — which is the defect itself, since the list is offered under the word "page". The marking checks below are only meaningful because this one passes',
      !!board && !!page, JSON.stringify(rows));

    ok('ITEM 176: a BOARD row says it is a board — in WORDS as well as shape, because the sheet\'s own title still says "page" (its wording belongs to 144\'s redesign), so a shape alone would be legible only to a reader who already knows the shape law',
      !!board && /board/i.test(board.tag || ''), JSON.stringify(board));

    ok('ITEM 176: and it says so in SHAPE too, reusing Nick\'s own law rather than a new signal — a board takes the horizontal swatch, a page the vertical one, the same pair the rail draws',
      !!board && !!page && /wz-thumb-board/.test(board.swatch || '') && /wz-thumb-page/.test(page.swatch || ''),
      JSON.stringify({ board: board && board.swatch, page: page && page.swatch }));

    // Measured, not inferred: the two swatches must actually differ in the
    // ruled direction on screen. Asserting the class names alone would only
    // prove the class names were written.
    const geom = await app.evalJs(`(() => {
      const pick = (cls) => {
        const el = document.querySelector('.board-sheet .dz-row .' + cls);
        if (!el) return null;
        const cs = getComputedStyle(el, '::before');
        return { w: parseFloat(cs.width), h: parseFloat(cs.height) };
      };
      return { board: pick('wz-thumb-board'), page: pick('wz-thumb-page') };
    })()`);
    ok('ITEM 176: the two swatches differ in the RULED direction as rendered — board wider than tall, page taller than wide — measured on the box rather than inferred from the class names',
      !!geom?.board && !!geom?.page && geom.board.w > geom.board.h && geom.page.h > geom.page.w,
      JSON.stringify(geom));

    ok('ITEM 176 (scope held): a PAGE row carries no kind WORD — the word rides the rows that contradict the sheet, not every row. Nothing here renames the door or adds one; those are 144\'s',
      !!page && page.tag === null, JSON.stringify(page));
  }
  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// Item 176 parks NOTHING: it adds two signals to rows that previously carried
// none, and removes nothing. Swept by BEHAVIOUR before the build — no harness
// asserts the picker's row shape, its title, or the absence of a kind marker;
// the only checks that touch this sheet are b2.mjs's, which assert the PIN
// (that choosing a row creates a membership), and that is untouched here.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing parked in this file.
}

const allChecks176 = checks.concat(parkedChecks);
const pass = allChecks176.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `
ITEM176 VERIFY: PASS (${allChecks176.length} checks)` : `
ITEM176 VERIFY: FAIL — ${allChecks176.filter((c) => !c.pass).length}/${allChecks176.length} failed`);
process.exit(pass ? 0 : 1);
