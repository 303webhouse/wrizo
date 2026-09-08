// PW1 — BOARDS CONNECTED (docs/menus/pw1-build-brief.md). A committed CDP
// verification scenario, auto-discovered by run-suite.mjs (`readdirSync`
// filtered to *.mjs — no registration needed).
// Run: node scripts/harness/pw1.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S7 list: the subject (planBoardId ∪ getBoardsPinning,
// and NOT a drawer sibling that pins nothing); absent-never-empty; the no-count
// law asserted as a property of second lines; one press → the side menu, two
// sections, cards ordered y-then-x against a fixture whose creation order
// deliberately differs; double-click travel + its menu twin; ABSENCE MEANS
// DISPLAYED in both directions from one fixture; Display on Board moving a
// membership to the canvas with its state line; travel keeping the rail and the
// chip naming the surface left; the framed crumb on Page AND Screenplay, never
// empty.
//
// THREE STANDING HARNESS LAWS, and they bite hardest in this file:
//   DRIVERS NEVER ASSUME EXISTENCE. A bare `.click()` on a missing node throws
//   inside evalJs, which rejects, which ABORTS THE WHOLE FILE and reports
//   nothing downstream — the run where reporting matters most says least. Every
//   probe below tests for its target and FAILS A CHECK THAT NAMES IT, letting
//   the rest still speak. `must()` is that discipline in one helper.
//   PROBES DRIVE REAL POINTER EVENTS — app.mouseDown/mouseUp/doubleClick go
//   through CDP Input (isTrusted:true), never a synthetic `click()`, so the
//   product's own pipeline is the thing under test.
//   SEED THROUGH THE SEAMS (window.wrizoCreateJournalPage,
//   window.wrizoPinPageToBoard) — never raw localStorage. The cache is the
//   hazard: every product write serialises the whole in-memory cache back over
//   storage, so a raw-seeded row vanishes at the next product write anywhere in
//   the run (item 85 / item 129).
import { withHarness } from '../runtime-verify.mjs';

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
// Why point-scanning rather than "press the centre": in the framed layout the
// stage overlaps the strip's right-hand portion, so a strip item's own CENTRE
// hit-tests to `.desk-frame-stage`, not the button. Every existing harness
// reaches these controls with `.click()`, which bypasses hit-testing entirely
// and so never noticed. A synthetic click would skip the pipeline the product
// actually listens on, so instead this finds a point INSIDE the element that
// `elementFromPoint` genuinely resolves to it, and presses there with real CDP
// pointer events. If NO point in the element is reachable, that is a real
// finding and it is recorded as a named failure rather than papered over.
const hittablePointBy = (app, elExpr) => app.evalJs(`(() => {
  const e = (() => { return ${elExpr}; })();
  if (!e) return null;
  e.scrollIntoView({ block: 'center', inline: 'center' });
  const b = e.getBoundingClientRect();
  if (b.width <= 0 || b.height <= 0) return { found: false, why: 'zero-size' };
  const fr = [0.5, 0.25, 0.75, 0.12, 0.88];
  for (const fy of fr) for (const fx of fr) {
    const x = b.left + b.width * fx, y = b.top + b.height * fy;
    const top = document.elementFromPoint(x, y);
    if (top && (top === e || e.contains(top))) return { found: true, x, y };
  }
  const c = document.elementFromPoint(b.left + b.width/2, b.top + b.height/2);
  return { found: false, why: 'occluded', by: c ? (typeof c.className === 'string' ? c.className : c.tagName) : null };
})()`);

const hittablePoint = (app, sel) => hittablePointBy(app, `document.querySelector(${JSON.stringify(sel)})`);

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
  const already = await app.evalJs("!!document.querySelector('.wz-cascade-plan-zone') || (!!document.querySelector('.wz-cascade-panel') && [...document.querySelectorAll('.wz-strip-item')][2]?.getAttribute('aria-pressed') === 'true')");
  if (already) return true;
  const there = await app.evalJs("document.querySelectorAll('.wz-strip-item').length > 2");
  if (!there) { ok('DRIVER: the cascade strip is mounted with a Plan category', false, 'strip missing'); return false; }
  await wakeChrome(app);
  const opened = await pressEl(app, "[...document.querySelectorAll('.wz-strip-item')][2]", 'the strip Plan category opens');
  if (!opened) return false;
  await sleep(300);
  return true;
};

const planRows = (app) => app.evalJs(`[...document.querySelectorAll('.wz-cascade-boardrow')].map(r => ({
  title: r.querySelector('.wz-cascade-boardrow-title')?.textContent,
  relation: r.querySelector('.wz-cascade-boardrow-relation')?.textContent,
}))`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — THE SUBJECT. The panel lists planBoardId ∪ getBoardsPinning, and NOT
  // a drawer sibling that pins nothing. Asserted DIRECTLY: the fixture seeds a
  // decoy board in the SAME project which the page is not on at all, so a
  // regression back to getBinderPages fails loudly instead of passing by
  // coincidence.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  const pageId = await app.evalJs("location.hash.split('/page/')[1]");
  const projectId = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(pageId)})?.projectId`);
  const now = new Date().toISOString();

  await seedEntries(app, [
    { id: 'pw1-pinning', text: 'Stark', projectId, pageType: 'board', origin: 'project', boxes: [] },
    // THE DECOY: same drawer, pins nothing. Under the OLD subject
    // (getBinderPages) this would list; under the new one it must not.
    { id: 'pw1-decoy', text: 'A sibling that pins nothing', projectId, pageType: 'board', origin: 'project', boxes: [] },
  ]);
  // Membership through the product's own seam, never a hand-built box.
  await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(pageId)}, 'pw1-pinning')`);
  await settle(app, `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-pinning'); return !!e && (e.boxes||[]).some(b => b.kind === 'page-pin'); })()`);
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'Page remounted after pin');
  await sleep(300);

  if (await openPlan(app)) {
    const rows = await planRows(app);
    const titles = rows.map((r) => r.title);
    ok('S1: the Plan panel lists the boards CONNECTED to this page (planBoardId ∪ getBoardsPinning) and NOT a drawer sibling that pins nothing — co-location is not connection',
      titles.includes('Stark') && !titles.includes('A sibling that pins nothing'), JSON.stringify(rows));
    ok('S1/PW10: the second line names the RELATION or the DRAWER, and NO DIGIT appears in any of them — the no-count law asserted as a property, not as one string',
      rows.length > 0 && rows.every((r) => typeof r.relation === 'string' && r.relation.length > 0 && !/\d/.test(r.relation)),
      JSON.stringify(rows));
    ok('S1/PW3: "Open…" has retired — the panel IS the list, so no cascade-link door remains in it',
      (await app.evalJs("!document.querySelector('.wz-cascade-panel .wz-cascade-link')")), '');
    ok('S1, Fable ruling 3: the "Open the drawer →" foot row is ABSENT — G3, never a door onto nothing (no drawer-board surface exists in this slice)',
      (await app.evalJs("![...document.querySelectorAll('.wz-cascade-panel-body button')].some(b => /Open the drawer/i.test(b.textContent))")), '');
  }

  // ==========================================================================
  // S1/PW9 — ABSENT, NEVER EMPTY. A page on no board has NO zone in the DOM —
  // not a zone containing "No boards yet."
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  if (await openPlan(app)) {
    const emptyState = await app.evalJs(`({
      zone: !!document.querySelector('.wz-cascade-plan-zone'),
      row: !!document.querySelector('.wz-cascade-boardrow'),
      bodyText: document.querySelector('.wz-cascade-panel-body')?.innerText ?? '',
    })`);
    ok('S1/PW9: no connections → the zone is ABSENT FROM THE DOM (not present-and-empty), and "No boards yet." appears nowhere — nothing announces a capability the writer has not reached for',
      emptyState.zone === false && emptyState.row === false && !emptyState.bodyText.includes('No boards yet'),
      JSON.stringify(emptyState));
  }

  // ==========================================================================
  // S1 — the untitled plan board is titled FROM ITS PAGE, and named by its
  // RELATION ("its own plan board"), never by a drawer it has none of.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const pid = await app.evalJs("location.hash.split('/page/')[1]");
    await app.evalJs("(() => { const el = document.querySelector('.forward-only-editor'); if (el) { el.focus(); } })()");
    await app.typeKeys('The coat on the train');
    await sleep(400);
    // The PLAN → door births the page's own plan board (BM1 S2's lazy rule).
    // The typing above receded the chrome; stir the pointer first, exactly as a
    // hand would, or the band is legitimately not there to press.
    await wakeChrome(app);
    if (await pressCentre(app, '[data-page-plan-door]', 'the PLAN → door births the plan board')) {
      await waitOr(app, "!!document.querySelector('.board-canvas')", 'plan board born + travelled to');
      await sleep(300);
      await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pid)}`);
      await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'back on the paired page');
      await sleep(300);
      if (await openPlan(app)) {
        const rows = await planRows(app);
        const own = rows.find((r) => /plan/i.test(r.title || ''));
        ok('S1/PW10: the page\'s own (untitled) plan board is titled FROM ITS PAGE ("<page title> — plan") and its second line names the RELATION — a surface owning a container, named as such',
          !!own && (own.title || '').startsWith('The coat on the train') && own.relation === 'its own plan board',
          JSON.stringify(rows));
      }
    }
  }

  // ==========================================================================
  // S2 — ONE PRESS opens the side menu; TWO SECTIONS; and Q14's reading order:
  // cards sorted by y THEN x, against a fixture whose CREATION ORDER
  // DELIBERATELY DIFFERS. If the builder ever falls back to array order this
  // check fails — Q14 cannot pass by accident.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  const s2PageId = await app.evalJs("location.hash.split('/page/')[1]");
  const s2ProjectId = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(s2PageId)})?.projectId`);
  await seedEntries(app, [
    { id: 'pw1-order-board', text: 'Winterfell timeline', projectId: s2ProjectId, pageType: 'board', origin: 'project',
      boxes: [
        // Creation order C, A, B — reading order (y then x) must be A, B, C.
        { id: 'pw1-c', kind: 'text', x: 0.05, y: 0.60, w: 0.3, h: 0.1, z: 3, text: 'THIRD by arrangement' },
        { id: 'pw1-a', kind: 'text', x: 0.05, y: 0.10, w: 0.3, h: 0.1, z: 1, text: 'FIRST by arrangement' },
        { id: 'pw1-b', kind: 'text', x: 0.50, y: 0.10, w: 0.3, h: 0.1, z: 2, text: 'SECOND by arrangement' },
      ] },
  ]);
  await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(s2PageId)}, 'pw1-order-board')`);
  await settle(app, `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-order-board'); return !!e && (e.boxes||[]).some(b => b.kind === 'page-pin'); })()`);
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(s2PageId)}`);
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'Page remounted (S2)');
  await sleep(300);

  if (await openPlan(app)) {
    const opened = await pressCentre(app, '.wz-cascade-boardrow-open', 'ONE PRESS on a board row opens the side menu');
    if (opened) {
      await sleep(300);
      const survey = await app.evalJs(`({
        open: !!document.querySelector('.wz-cascade-survey'),
        title: document.querySelector('.wz-cascade-survey-title')?.textContent,
        sections: [...document.querySelectorAll('.wz-cascade-survey-section')].map(s => s.textContent),
        titles: [...document.querySelectorAll('.wz-cascade-thumb-title')].map(t => t.textContent),
      })`);
      ok('S2 (Q3): ONE PRESS on a board row opens the side menu, titled with that board',
        survey.open && survey.title === 'Winterfell timeline', JSON.stringify(survey));
      ok('S2 (Q4): the side menu carries TWO SECTIONS — the board\'s own Cards, then the Pages linked to this board beneath them',
        JSON.stringify(survey.sections) === JSON.stringify(['Cards', 'Pages linked to this board']), JSON.stringify(survey.sections));
      const cardOrder = survey.titles.filter((t) => /by arrangement/.test(t));
      ok('S2 (Q14, RULED): cards read in THE BOARD\'S OWN ARRANGEMENT — y then x — against a fixture whose creation order is deliberately C,A,B. An order nobody chose is an order nobody can rely on',
        JSON.stringify(cardOrder) === JSON.stringify(['FIRST by arrangement', 'SECOND by arrangement', 'THIRD by arrangement']),
        JSON.stringify(survey.titles));
      // G3 at the scale of a menu: only rows with an act wear a `⋯`.
      const menuShape = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-thumb')].map(t => ({
        title: t.querySelector('.wz-cascade-thumb-title')?.textContent,
        isMember: !!t.querySelector('.wz-cascade-thumb-note'),
        hasMenu: !!t.querySelector('.wz-cascade-thumb-menu-btn'),
      }))`);
      ok('S2/S3 (G3 at menu scale): only rows that HAVE an act wear a `⋯` — the membership rows carry Display/Hide, and the board-owned cards, which have no display to toggle, carry no empty menu at all. Absent, never a door onto nothing',
        Array.isArray(menuShape) && menuShape.length > 0 && menuShape.every((r) => r.hasMenu === r.isMember), JSON.stringify(menuShape));

      // Every second line in the survey is relation/state, never a count.
      const noteDigits = await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb-note')].map(n => n.textContent)");
      ok('S2/PW10: no digit appears in any membership state line either — the no-count law holds across BOTH row populations',
        Array.isArray(noteDigits) && noteDigits.length > 0 && noteDigits.every((n) => !/\d/.test(n)), JSON.stringify(noteDigits));
    }
  }

  // ==========================================================================
  // S2/PW22 — THE TWIN. Double-click on a board row travels, AND the same act
  // rides the row's own `⋯`. Nothing is reachable only by a gesture.
  // ==========================================================================
  if (await openPlan(app)) {
    const menuOpened = await pressCentre(app, '.wz-cascade-boardrow-menu-btn', 'the board row\'s ⋯ opens');
    if (menuOpened) {
      await sleep(200);
      const twin = await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb-menu-item')].map(b => b.textContent)");
      ok('S2/PW22 (the twin): "Open the board" rides the row\'s own ⋯ — the double-click is a shortcut, never the only path (the keyboard and the unfamiliar hand keep a way in)',
        Array.isArray(twin) && twin.includes('Open the board'), JSON.stringify(twin));
    }
  }
  if (await openPlan(app)) {
    const dbl = await dblCentre(app, '.wz-cascade-boardrow-open', 'double-click a board row travels to the board');
    if (dbl) {
      await sleep(500);
      const arrived = await app.evalJs("({ hash: location.hash, canvas: !!document.querySelector('.board-canvas') })");
      ok('S2 (Q4): DOUBLE-CLICK on a board row travels — the surface switches to that board',
        arrived.canvas === true && arrived.hash.includes('pw1-order-board'), JSON.stringify(arrived));
      // S4(i) — the rail travelled with the writer.
      const railKept = await app.evalJs("({ panel: !!document.querySelector('.wz-cascade-panel'), survey: !!document.querySelector('.wz-cascade-survey') })");
      ok('S4(i): the cascade SURVIVES TRAVEL — the destination mounts with the Plan panel still open (the trail is the rail; the way back is a row already under the writer\'s eye)',
        railKept.panel === true, JSON.stringify(railKept));
    }
  }

  // ==========================================================================
  // S5 — STICKINESS (Nick, Q6: YES). The Plan panel reopens on the board whose
  // contents were last open, per page — and the survey's `‹` is always the way
  // back to the list.
  // ==========================================================================
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(s2PageId)}`);
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'the S2 page again (stickiness)');
  await sleep(300);
  if (await openPlan(app)) {
    if (await pressCentre(app, '.wz-cascade-boardrow-open', 'open a board\'s contents to make it the remembered one')) {
      await sleep(300);
      // Close the whole cascade (Escape twice: survey -> panel -> strip).
      await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
      await sleep(150);
      await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
      await sleep(200);
      if (await openPlan(app)) {
        const restored = await app.evalJs(`({
          survey: !!document.querySelector('.wz-cascade-survey'),
          title: document.querySelector('.wz-cascade-survey-title')?.textContent,
        })`);
        ok('S5 (Q6): the Plan panel REOPENS on the board whose contents were last open, per page — the machine declining to forget, restoring only what the writer themselves opened',
          restored.survey === true && restored.title === 'Winterfell timeline', JSON.stringify(restored));
        if (await pressCentre(app, '.wz-cascade-survey-back', 'the survey\'s ‹ walks back to the list')) {
          await sleep(250);
          const backToList = await app.evalJs(`({
            survey: !!document.querySelector('.wz-cascade-survey'),
            rows: document.querySelectorAll('.wz-cascade-boardrow').length,
          })`);
          ok('S5: the survey\'s `‹` is always the way back to THE LIST — and the list is now the panel itself (PW3), so it walks back one layer and stays there',
            backToList.survey === false && backToList.rows > 0, JSON.stringify(backToList));
        }
      }
    }
  }


  // ==========================================================================
  // S3 — ⚠ ABSENCE MEANS DISPLAYED, BOTH DIRECTIONS, ONE FIXTURE. This is the
  // check that must not be missing: a pin written WITHOUT the flag (the
  // pre-existing, grandfathered shape) renders on the canvas; a NEW membership
  // made through pinPageToBoard does not. Every already-arranged board must
  // read UNCHANGED on first launch — no backfill, no migration.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  const s3PageId = await app.evalJs("location.hash.split('/page/')[1]");
  const s3ProjectId = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(s3PageId)})?.projectId`);
  await seedEntries(app, [
    { id: 'pw1-grandfathered-target', text: 'A page pinned the OLD way', projectId: s3ProjectId, pageType: 'manuscript', origin: 'project' },
    { id: 'pw1-newpin-target', text: 'A page pinned the NEW way', projectId: s3ProjectId, pageType: 'manuscript', origin: 'project' },
    { id: 'pw1-absence-board', text: 'The already-arranged board', projectId: s3ProjectId, pageType: 'board', origin: 'project',
      boxes: [
        // THE PRE-EXISTING SHAPE: a page-pin with NO onCanvas field at all,
        // exactly as every board arranged before this ticket carries it.
        { id: 'pw1-old-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.28, h: 0.12, z: 1, entryId: 'pw1-grandfathered-target' },
      ] },
  ]);
  // ...and the NEW membership, made through the product's own seam.
  await app.evalJs("window.wrizoPinPageToBoard('pw1-newpin-target', 'pw1-absence-board')");
  await settle(app, "(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-absence-board'); return !!e && (e.boxes||[]).filter(b => b.kind === 'page-pin').length === 2; })()");

  const storedShapes = await app.evalJs("(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-absence-board'); const p = (e.boxes||[]).filter(b => b.kind === 'page-pin'); return p.map(b => ({ entryId: b.entryId, hasFlag: Object.prototype.hasOwnProperty.call(b, 'onCanvas'), onCanvas: b.onCanvas })); })()");
  ok('S3 (storage): the grandfathered pin carries NO onCanvas field at all, while the NEW membership writes `false` EXPLICITLY — the shape serves the law, not the reverse',
    Array.isArray(storedShapes)
      && storedShapes.some((s) => s.entryId === 'pw1-grandfathered-target' && s.hasFlag === false)
      && storedShapes.some((s) => s.entryId === 'pw1-newpin-target' && s.onCanvas === false),
    JSON.stringify(storedShapes));

  await app.evalJs("location.hash = '#/page/pw1-absence-board'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'the already-arranged board mounted');
  await sleep(400);
  const onWall = await app.evalJs("[...document.querySelectorAll('.board-box')].map(b => b.dataset.boxId)");
  ok('S3 ⚠ ABSENCE MEANS DISPLAYED (direction 1): a pin written WITHOUT the flag — the pre-existing shape — RENDERS ON THE CANVAS. Every already-arranged board reads unchanged on first launch',
    Array.isArray(onWall) && onWall.includes('pw1-old-pin'), JSON.stringify(onWall));
  const newPinBoxId = await app.evalJs("(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-absence-board'); const b = (e.boxes||[]).find(b => b.entryId === 'pw1-newpin-target'); return b ? b.id : null; })()");
  ok('S3 ⚠ ABSENCE MEANS DISPLAYED (direction 2, SAME FIXTURE): a NEW membership is NOT displayed — membership without display is the default, and the writer chooses the position',
    !!newPinBoxId && Array.isArray(onWall) && !onWall.includes(newPinBoxId), JSON.stringify({ newPinBoxId, onWall }));

  // Membership is untouched by display: BOTH pages still list as members.
  if (await openPlan(app)) {
    await sleep(200);
    // On the BOARD, Plan carries the board's own connections; the membership
    // rows live in the survey, so reach them from the connected page instead.
  }
  await app.evalJs("location.hash = '#/page/pw1-newpin-target'");
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'the newly-pinned page');
  await sleep(300);
  if (await openPlan(app)) {
    const rows = await planRows(app);
    ok('S3: a membership that is NOT displayed is still, in every list, a MEMBER — the undisplayed page lists its board exactly as a displayed one would',
      rows.some((r) => r.title === 'The already-arranged board'), JSON.stringify(rows));
  }

  // ==========================================================================
  // S3 — "Display on Board" moves it to the canvas, and the row's state line
  // changes with it.
  // ==========================================================================
  await app.evalJs("location.hash = '#/page/pw1-grandfathered-target'");
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'host page for the display act');
  await sleep(300);
  if (await openPlan(app)) {
    if (await pressCentre(app, '.wz-cascade-boardrow-open', 'open the board\'s contents to reach its membership rows')) {
      await sleep(300);
      const before = await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb')].map(t => ({ title: t.querySelector('.wz-cascade-thumb-title')?.textContent, note: t.querySelector('.wz-cascade-thumb-note')?.textContent }))");
      const notShown = (before || []).find((r) => r.note === 'member · not shown on the board');
      ok('S3: each row STATES ITS STATE in the second-line slot — display state is a fact on the row, never inferred from the wall',
        !!notShown && notShown.title === 'A page pinned the NEW way', JSON.stringify(before));

      // Open that row's own ⋯ and press Display on Board.
      const idx = (before || []).findIndex((r) => r.note === 'member · not shown on the board');
      if (idx >= 0) {
        const btnSel = `.wz-cascade-thumb:nth-of-type(1)`; // placeholder, resolved below
        void btnSel;
        const opened = await app.evalJs(`(() => {
          const thumbs = [...document.querySelectorAll('.wz-cascade-thumb')];
          const t = thumbs.find(t => t.querySelector('.wz-cascade-thumb-note')?.textContent === 'member · not shown on the board');
          if (!t) return null;
          const b = t.querySelector('.wz-cascade-thumb-menu-btn');
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return { x: r.left + r.width/2, y: r.top + r.height/2 };
        })()`);
        if (!opened) {
          ok('DRIVER: the not-shown membership row carries a ⋯ to open', false, 'absent');
        } else {
          await app.mouseDown(opened.x, opened.y);
          await app.mouseUp(opened.x, opened.y);
          await sleep(200);
          const actLabels = await app.evalJs("[...document.querySelectorAll('.wz-cascade-pin-display')].map(b => b.textContent)");
          ok('S3 (Nick, Q4): "Display on Board" is offered from the membership row\'s own ⋯ — the menu is the path that must be complete, and it is',
            Array.isArray(actLabels) && actLabels.includes('Display on Board'), JSON.stringify(actLabels));
          const pressed = await app.evalJs(`(() => {
            const b = [...document.querySelectorAll('.wz-cascade-pin-display')].find(b => b.textContent === 'Display on Board');
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { x: r.left + r.width/2, y: r.top + r.height/2 };
          })()`);
          if (!pressed) {
            ok('DRIVER: a "Display on Board" item is present to press', false, 'absent');
          } else {
            await app.mouseDown(pressed.x, pressed.y);
            await app.mouseUp(pressed.x, pressed.y);
            await sleep(400);
            const flag = await app.evalJs("(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-absence-board'); const b = (e.boxes||[]).find(b => b.entryId === 'pw1-newpin-target'); return b ? b.onCanvas : null; })()");
            const noteNow = await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb')].map(t => ({ title: t.querySelector('.wz-cascade-thumb-title')?.textContent, note: t.querySelector('.wz-cascade-thumb-note')?.textContent }))");
            const moved = (noteNow || []).find((r) => r.title === 'A page pinned the NEW way');
            ok('S3: "Display on Board" moves the membership ONTO the canvas, and the row\'s state line changes with it — one act, both faces true',
              flag === true && !!moved && moved.note === 'member · shown on the board', JSON.stringify({ flag, moved }));
          }
        }
      }
    }
  }

  // ==========================================================================
  // S3 — THE TWO SIDES OF ONE FUNCTION. `pinPageToBoard` serves both a PAGE-side
  // membership act and a BOARD-side arrangement act, and item 125 wants opposite
  // answers from them: a membership declared from a page is not displayed (the
  // writer chose no position), while a card asked for ON a board's own canvas is
  // arrangement the writer authored and must appear where they asked.
  //
  // Asserted because it is a BUILDER'S JUDGMENT, not a line of the brief — the
  // brief rules that new memberships are not displayed and does not enumerate
  // the board-side doors. It is worth a check precisely because it could be
  // overturned by a word, and then this check should fail loudly.
  // ==========================================================================
  {
    await app.evalJs("location.hash = '#/page/pw1-absence-board'");
    await waitOr(app, "!!document.querySelector('.board-canvas')", 'the board, for the board-side placement act');
    await sleep(400);
    const before = await app.evalJs("document.querySelectorAll('.board-box').length");
    await app.evalJs("window.wrizoCreateJournalPage({ id: 'pw1-boardside-target', text: 'Placed from the board itself', origin: 'loose', projectId: null })");
    await settle(app, "(() => JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === 'pw1-boardside-target'))()");
    // The board-side seam, with the display intent the four board doors carry.
    await app.evalJs("window.wrizoPinPageToBoard('pw1-boardside-target', 'pw1-absence-board', { display: true })");
    await sleep(500);
    await app.evalJs("location.hash = '#/'");
    await sleep(200);
    await app.evalJs("location.hash = '#/page/pw1-absence-board'");
    await waitOr(app, "!!document.querySelector('.board-canvas')", 'the board again, after the board-side placement');
    await sleep(500);
    const shape = await app.evalJs(`(() => {
      const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-absence-board');
      const b = (e.boxes||[]).find(b => b.entryId === 'pw1-boardside-target');
      return { onCanvas: b ? b.onCanvas : null, rendered: b ? !!document.querySelector('[data-box-id="' + b.id + '"]') : false, boxesNow: document.querySelectorAll('.board-box').length };
    })()`);
    ok('S3 (the two sides of one act): a page placed from the BOARD’s own side lands ON the canvas — arrangement the writer authored, on the surface they were looking at — while a membership declared from a PAGE stays undisplayed. Same function, opposite answers, because they are opposite acts',
      shape.onCanvas === true && shape.rendered === true && shape.boxesNow > before, JSON.stringify({ ...shape, before }));
  }

  // ==========================================================================
  // S4(ii) — THE CHIP NAMES THE SURFACE ACTUALLY LEFT. A writer who reached a
  // page through the rail never stood on a board; the chip must not send them
  // somewhere they have never been.
  //
  // Travelled from a PAGE's own rail (not from the board), because that is the
  // journey the ruling is about — and because a board pinned nowhere has no
  // connections of its own to travel through, which is itself correct: the
  // panel answers "which containers hold THIS surface", and nothing holds it.
  // ==========================================================================
  await app.evalJs("location.hash = '#/page/pw1-grandfathered-target'");
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'the connected page, to travel FROM via the rail');
  await sleep(400);
  if (await openPlan(app)) {
    if (await pressCentre(app, '.wz-cascade-boardrow-open', 'open the connected board’s contents from the page')) {
      await sleep(350);
      const target = await app.evalJs(`(() => {
        const t = [...document.querySelectorAll('.wz-cascade-thumb')]
          .find(t => /pinned the NEW way/.test(t.querySelector('.wz-cascade-thumb-title')?.textContent || ''));
        return t ? true : false;
      })()`);
      if (!target) {
        ok('DRIVER: a membership row for the other page is present in the survey to travel through', false, 'absent');
      } else if (await pressEl(app, "[...document.querySelectorAll('.wz-cascade-thumb')].find(t => /pinned the NEW way/.test(t.querySelector('.wz-cascade-thumb-title')?.textContent || '')).querySelector('.wz-cascade-thumb-title')", 'travel through a membership row in the survey')) {
        await sleep(600);
        const arrived = await app.evalJs("location.hash");
        const chip = await app.evalJs("document.querySelector('.wz-back-to-board')?.textContent ?? null");
        ok('S4(ii): the return chip NAMES THE SURFACE ACTUALLY LEFT (the page the writer was standing on), never a blind "Back to the board" to a writer who never stood on one',
          typeof chip === 'string' && chip.includes('A page pinned the OLD way'), JSON.stringify({ arrived, chip }));
        const railKept = await app.evalJs(`({
          panel: !!document.querySelector('.wz-cascade-panel'),
          survey: !!document.querySelector('.wz-cascade-survey'),
          surveyTitle: document.querySelector('.wz-cascade-survey-title')?.textContent,
          currentTitles: [...document.querySelectorAll('.wz-cascade-thumb.current .wz-cascade-thumb-title')].map(t => t.textContent),
          ariaCurrent: [...document.querySelectorAll('.wz-cascade-thumb-title[aria-current="true"]')].map(t => t.textContent),
        })`);
        ok('S4(i): travel from the SURVEY arrives with the panel open and the survey still on the same board — the way back is one press on a row already under the writer’s eye',
          railKept.panel === true && railKept.survey === true && railKept.surveyTitle === 'The already-arranged board', JSON.stringify(railKept));
        // S7's check 8, in full: the ORIGIN ROW WEARS THE `current` MARK. The
        // survey already computes it (`current: entry.id === currentEntryId`)
        // and already renders it (`aria-current`), so what this proves is that
        // the arriving surface is genuinely the one the row stands for — the
        // trail is only a trail if it says where the writer is standing on it.
        ok('S4(i): and the row the writer arrived AT wears the survey’s own `current` mark, in the DOM and in `aria-current` alike — the rail says where you are, not merely what is on the board',
          Array.isArray(railKept.currentTitles) && railKept.currentTitles.length === 1
            && railKept.currentTitles[0] === 'A page pinned the NEW way'
            && Array.isArray(railKept.ariaCurrent) && railKept.ariaCurrent.includes('A page pinned the NEW way'),
          JSON.stringify({ currentTitles: railKept.currentTitles, ariaCurrent: railKept.ariaCurrent }));
      }
    }
  }

  // ==========================================================================
  // S6 — THE ADDRESS LINE, on the framed Page AND the framed Screenplay, and
  // the chain that never renders empty.
  // ==========================================================================
  for (const width of [LAPTOP_W, WIDE_W]) {
    await freshProsePage(app, width, 900);
    await sleep(300);
    const crumb = await app.evalJs(`(() => {
      const c = document.querySelector('.desk-frame-host .sprint-crumb');
      if (!c) return null;
      const nav = document.querySelector('.desk-frame-host .sprint-nav');
      const cr = c.getBoundingClientRect(); const nr = nav.getBoundingClientRect();
      return { text: c.innerText.replace(/\\s+/g, ' ').trim(), leftSet: cr.left - nr.left < 60 };
    })()`);
    ok(`S6 (Q7) @ ${width}px: the FRAMED PAGE renders the location crumb again — restored in the shape the Board already proved, left-set while the strip and actions group right`,
      !!crumb && crumb.leftSet === true && crumb.text.length > 0, JSON.stringify(crumb));
  }

  // The framed SCREENPLAY.
  await freshDesk(app, LAPTOP_W, 900);
  await seedEntries(app, [
    { id: 'pw1-script', text: 'A screenplay', pageType: 'screenplay', origin: 'loose', projectId: null },
  ]);
  await app.evalJs("location.hash = '#/page/pw1-script'");
  await sleep(600);
  const scriptCrumb = await app.evalJs(`(() => {
    const c = document.querySelector('.desk-frame-host .sprint-crumb');
    return c ? c.innerText.replace(/\\s+/g, ' ').trim() : null;
  })()`);
  ok('S6 (Q7): the FRAMED SCREENPLAY renders the location crumb too — one component, three surfaces, so Page and Script cannot drift the way their two hand-rolled copies already had',
    typeof scriptCrumb === 'string' && scriptCrumb.length > 0, String(scriptCrumb));

  // THE CHAIN NEVER RENDERS EMPTY.
  await freshDesk(app, LAPTOP_W, 900);
  await seedEntries(app, [
    { id: 'pw1-loose', text: 'A loose page', origin: 'loose', projectId: null },
    // Seeded in the SAME fixture as the page it will connect to: `freshDesk`
    // clears storage, so a board seeded in an earlier block is genuinely gone.
    { id: 'pw1-loose-board', text: 'A board with no drawer', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
  ]);
  await app.evalJs("location.hash = '#/page/pw1-loose'");
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'a loose page (no drawer, no project)');
  await sleep(400);
  const looseCrumb = await app.evalJs(`(() => {
    const c = document.querySelector('.desk-frame-host .sprint-crumb');
    return c ? c.innerText.replace(/\\s+/g, ' ').trim() : null;
  })()`);
  ok('S6: THE CHAIN NEVER RENDERS EMPTY — a page with no drawer and no project reads its HOME LABEL ("Loose — belongs nowhere yet"), not a bare title. The one case where the writer is most likely to be lost is the case where the address must still say something true',
    typeof looseCrumb === 'string' && looseCrumb.includes('Loose — belongs nowhere yet'), String(looseCrumb));

  // ==========================================================================
  // S1, Fable ruling 2 — a LOOSE page's real connections never hide behind
  // creation doors.
  // ==========================================================================
  await app.evalJs("window.wrizoPinPageToBoard('pw1-loose', 'pw1-loose-board')");
  await settle(app, "(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'pw1-loose-board'); return !!e && (e.boxes||[]).some(b => b.kind === 'page-pin'); })()");
  await app.evalJs("location.hash = '#/'");
  await sleep(200);
  await app.evalJs("location.hash = '#/page/pw1-loose'");
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'the loose page, now connected');
  await sleep(400);
  if (await openPlan(app)) {
    const looseRows = await planRows(app);
    // `innerText` returns the CSS-TRANSFORMED text, and the zone's heading wears
    // the engraved register's `text-transform:uppercase` — so the DOM reads
    // "BOARDS CONNECTED" while the lexicon holds Nick's own sentence case.
    // That split is the design (the register carries the voice, the term
    // carries the word), so this asserts the heading's PRESENCE case-blind and
    // leaves the exact term to the lexicon check at the end of this file.
    const bodyText = await app.evalJs("(document.querySelector('.wz-cascade-panel-body')?.innerText ?? '').toUpperCase()");
    ok('S1, Fable ruling 2: a LOOSE page (no drawer, no project) still shows its REAL CONNECTIONS, above the creation doors — answering "which boards is this page on" with "make a project first" was the panel telling a writer to build what they had already built',
      looseRows.length > 0 && looseRows.some((r) => r.title === 'A board with no drawer') && bodyText.includes('BOARDS CONNECTED'),
      JSON.stringify({ looseRows, hasHeading: bodyText.includes('BOARDS CONNECTED') }));
  }

  // ==========================================================================
  // S3/PW27 + ruling 4 — the ONE connecting word, on both faces.
  // ==========================================================================
  const words = await app.evalJs(`(() => {
    const t = window.wrizoDeskLexicon?.t;
    if (!t) return null;
    return { heading: t('cascadePlanBoardsConnected'), places: t('placesBoardsTitle'), face: t('pageFacePinnedTo') };
  })()`);
  ok('S3/PW27 + ruling 4: ONE CONNECTING WORD, three faces — the Plan panel\'s heading is Nick\'s exact term, and the Places zone and the Page face\'s prose line both read "connected" (never "appears on", which would now LIE: appearing means being displayed, and the checkbox makes membership)',
    !!words && words.heading === 'Boards connected' && words.places === 'Also connected to…' && words.face === 'Also connected to',
    JSON.stringify(words));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// PW1 parks NOTHING of its own: this file is new, so it has no predecessor
// checks to retire. The park sweep this slice DOES owe lives in the files whose
// own assertions PW1 falsifies — cd2.mjs (6), ab4.mjs (8 instances / 5 names),
// b2.mjs (1, a generation-4 stack) and cd1.mjs (1) — each parked verbatim
// beside its own successor, in its own file, where the reader of that file will
// find it. The gate below is intentionally empty, mirroring ab4.mjs's and
// fx3.mjs's own precedent for an armed-but-empty gate.
//
// THE COUNT IS THE CHECK, NOT THE COLOUR OF THE RUN. A park whose `pok()` never
// pushes is invisible to a green suite — it simply runs one fewer check, and a
// pass/fail run cannot tell you that. So the arithmetic is stated here to be
// AUDITED AGAINST, not taken on trust.
//
// BEHIND THE PARKED GATE (HARNESS_PARKED=1), originals quoted verbatim with
// `pok()` successors beside them:
//   cd2.mjs   6 instances /  6 names   (the Plan panel's whole block)
//   ab4.mjs   8 instances /  5 names   (3 names run at both reference widths)
//   b2.mjs    1 instance  /  1 name    (a generation-4 lexicon stack)
//   cd1.mjs   1 instance  /  1 name    (the framed crumb's absence)
//   SUBTOTAL 16 instances / 13 names
//
// SUPERSEDED IN PLACE, LIVE IN THE DEFAULT RUN (originals quoted verbatim in
// comments, successors asserting the same claims under item 125's new
// precondition — these belong in the live run because the claims still hold
// there, only their setup changed):
//   ab4.mjs   3 instances /  3 names   (the membership line's wording; the two
//                                       unpin checks, which now display the
//                                       membership first)
//   tu1.mjs   1 instance  /  1 name    (the Structure lens's membership line —
//                                       the same word, one surface over)
//   SUBTOTAL  4 instances /  4 names
//
//   TOTAL RETIRED  20 instances / 17 names
//
// AND ONE FILE THAT NEEDED NO PARK AT ALL, recorded because the distinction is
// the whole point: `item9192.mjs`'s "the board RENDERS a card, not merely a row
// in storage" went red, and it was RIGHT. Its journey is the board's own
// "New page card" door — the writer standing on the canvas asking for a card
// there — and this build had made that card invisible. The check was not
// superseded; the BUILD was wrong, and the fix is in the product
// (`pinPageToBoard`'s board-side/page-side split), not in the harness. A check
// that goes red is not automatically a check to retire.
//
// FOUR OF THESE FIVE WERE FOUND BY RUNNING THE SUITE, NOT BY READING IT. The
// S0's sweep grepped for the STRINGS this slice changed and so found ab4 alone;
// what it missed were the two BEHAVIOURS it changed — that a fresh page-side
// pin no longer renders, and that the membership line's word moved. tu1 and
// item9192 assert those behaviours without ever naming the strings. The lesson,
// left here because it will apply again: sweep for what the change DOES, not
// for what it renames.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing parked in this file — see the note above for where PW1's sweep
  // actually lives and what its arithmetic must come to.
}

const allChecksPw1 = checks.concat(parkedChecks);
const pass = allChecksPw1.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nPW1 VERIFY: PASS (${allChecksPw1.length} checks)` : `\nPW1 VERIFY: FAIL — ${allChecksPw1.filter((c) => !c.pass).length}/${allChecksPw1.length} failed`);
process.exit(pass ? 0 : 1);
