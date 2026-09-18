// PW2 — NESTING AND TRANSFER (docs/menus/pw2-build-brief.md, items 128 + 123
// + item 134's rider (a)). Auto-discovered by run-suite.mjs; no registration.
// Run with an ABSOLUTE worktree path.
//
// ⚠ A WORKTREE ISOLATES FILES, NOT THE BOX. One machine, one browser pool: a
// run from ANY tree is a run on the box. The ordering lives on the ledger; the
// turn comes by announcement, never inferred from quiet.
//
// THE STANDING HARNESS LAWS, carried from pw1.mjs and load-bearing again here:
// drivers never assume existence (a bare .click() on a missing node aborts the
// FILE and reports nothing downstream); probes drive REAL pointer events
// through CDP Input, never a synthetic click; seed through the seams
// (window.wrizoCreateJournalPage / wrizoPinPageToBoard / wrizoCopyCardToBoard),
// never raw localStorage — the cache is the hazard, not the surface.
//
// The helper block below is pw1.mjs's, reused verbatim rather than re-derived,
// per the brief's own instruction not to rewrite proven fixtures.
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
  // S1 — THE CYCLE GUARD. Built first, because nothing on main walked this
  // chain recursively before it and the ORDER is the safety.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await seedEntries(app, [
    { id: 'pw2-a', text: 'Board A', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
    { id: 'pw2-b', text: 'Board B', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
    { id: 'pw2-c', text: 'Board C', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
    { id: 'pw2-page', text: 'A page', origin: 'loose', projectId: null },
  ]);

  // Nesting rides the EXISTING page-pin box (S0(a)), so this is the control:
  // a lawful nest must still succeed, or every refusal below proves nothing.
  const nestedAB = await app.evalJs("!!window.wrizoPinPageToBoard('pw2-b', 'pw2-a')");
  ok('S1 control: a lawful nest still succeeds — board B into board A. Every refusal below is only meaningful because this one passes',
    nestedAB === true, String(nestedAB));

  // ⚠ CHECK 1 — THE ANCESTOR WALK AT A *LATER* WRITE. This is the check the
  // build law exists for: a first-write-only guard passes a naive test and
  // fails this one. A→B is lawful; nesting A into B afterwards would close the
  // cycle, and the guard must fire on THAT second write, not merely the first.
  const cycleBA = await app.evalJs("window.wrizoPinPageToBoard('pw2-a', 'pw2-b')");
  const bPins = await pinsOf(app, 'pw2-b');
  ok('S1 ⚠ CHECK 1 (the build law): the ancestor walk fires at a LATER write — A already contains B, so nesting A INTO B is refused and NO box is created. A first-write-only guard would pass the naive case and miss exactly this one',
    cycleBA === null && !bPins.includes('pw2-a'), JSON.stringify({ cycleBA, bPins }));

  // ...and at depth, which is what makes it a WALK rather than a parent check.
  await app.evalJs("window.wrizoPinPageToBoard('pw2-c', 'pw2-b')"); // A > B > C
  const deepCycle = await app.evalJs("window.wrizoPinPageToBoard('pw2-a', 'pw2-c')");
  const cPins = await pinsOf(app, 'pw2-c');
  ok('S1: and it walks the whole chain, not just one level — with A > B > C, nesting A into C is refused. This is what distinguishes an ancestor WALK from a parent check',
    deepCycle === null && !cPins.includes('pw2-a'), JSON.stringify({ deepCycle, cPins }));

  // CHECK 2 — self is ABSENT (nonsense, not a refusal to teach).
  const selfNest = await app.evalJs("window.wrizoPinPageToBoard('pw2-a', 'pw2-a')");
  ok('S1 CHECK 2: a board on ITSELF is refused outright — nonsense rather than a refusal worth teaching, and the built self-pin guard already held it',
    selfNest === null, String(selfNest));

  // ==========================================================================
  // S1 — ITEM 134's RIDER (a), IN ITS POSITIVE FORM. Three checks from the
  // clause, plus the target-side one.
  // ==========================================================================
  const drawerId = await app.evalJs(`(() => {
    const ds = JSON.parse(localStorage.getItem('writer-studio-drawers')||'[]');
    return ds.length ? ds[0].id : null;
  })()`);
  if (drawerId) {
    const drawerPin = await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(drawerId)}, 'pw2-a')`);
    const after = await pinsOf(app, 'pw2-a');
    ok('S1 CLAUSE: a membership write with a DRAWER id is refused, and no page-pin box is created — "a drawer is never a member of anything", true by construction rather than by a special case',
      drawerPin === null && !after.includes(drawerId), JSON.stringify({ drawerPin, after }));
  } else {
    // A drawer may not exist in a fresh fixture; the GENERAL case below covers
    // the same law, so this is reported rather than silently skipped.
    ok('S1 CLAUSE (drawer id): no drawer existed in this fixture to test with — the general unresolvable-id check below carries the same law', true, 'no drawer row in a fresh store; general case asserted');
  }

  const ghostPin = await app.evalJs("window.wrizoPinPageToBoard('pw2-no-such-id-at-all', 'pw2-a')");
  const afterGhost = await pinsOf(app, 'pw2-a');
  ok('S1 CLAUSE (the general case): ANY unresolvable id is refused the same way, and no box is created. This is the wider hole the positive form closes — before it, a foreign id fell through and wrote a page-pin pointing at nothing, which renders "Missing page" and is a member forever',
    ghostPin === null && !afterGhost.includes('pw2-no-such-id-at-all'), JSON.stringify({ ghostPin, afterGhost }));

  const pagePin = await app.evalJs("!!window.wrizoPinPageToBoard('pw2-page', 'pw2-a')");
  ok('S1 CLAUSE: a normal PAGE still pins, and a normal BOARD still nests — the guard refuses only what cannot be held, never narrowing what can',
    pagePin === true && nestedAB === true, JSON.stringify({ pagePin, nestedAB }));

  // ⚠ THE TARGET SIDE — and this check RECORDS THE HOLE IT CLOSES, because the
  // pre-S1 build ADMITTED this write: a condition board passes
  // `pageType !== 'board'` like any other board, and nothing checked its kind
  // on the TARGET side. The built guard tested getSystemKind on the SOURCE
  // only. So this is not a hypothetical refusal being asserted — it is a live
  // gap being closed, and the check exists to keep it closed.
  await app.evalJs("location.hash = '#/shelf'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'the Shelf board mounts (a condition board to aim at)');
  await sleep(500);
  const shelfId = await app.evalJs("location.hash.split('/page/')[1] || (JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => (e.boxes||[]).some(b => b.kind === 'board-meta' && b.systemKind === 'shelf'))||{}).id");
  if (!shelfId) {
    ok('DRIVER: a Shelf (condition) board exists to use as a target', false, 'absent');
  } else {
    const before = await pinsOf(app, shelfId);
    const sysTarget = await app.evalJs(`window.wrizoPinPageToBoard('pw2-page', ${JSON.stringify(shelfId)})`);
    const afterSys = await pinsOf(app, shelfId);
    ok('S1 TARGET SIDE: a CONDITION BOARD as target is refused with no box created — and the pre-S1 build ADMITTED this write (a condition board passes pageType !== "board", and the built guard checked getSystemKind on the SOURCE only). A condition board\'s pins are DERIVED, never authored, so a hand-placed card there is erased at the next reconcile and wrong until then',
      sysTarget === null && afterSys.length === before.length, JSON.stringify({ sysTarget, before: before.length, after: afterSys.length }));
  }

  // ==========================================================================
  // S2 — NESTING: the board-card, travel, the twin, the sections, the shapes.
  // ==========================================================================
  await app.evalJs("location.hash = '#/page/pw2-a'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'board A, to read its canvas');
  await sleep(500);
  // A nested board is a MEMBERSHIP and NOT displayed (125 generalizes).
  const aBoxes = (await boardOf(app, 'pw2-a'))?.boxes ?? [];
  const nestedBox = aBoxes.find((b) => b.entryId === 'pw2-b');
  const nestedRendered = nestedBox ? await app.evalJs(`!!document.querySelector('[data-box-id="${nestedBox.id}"]')`) : false;
  ok('S2 CHECK 4a: a nested board is a MEMBER and NOT displayed — one rule covers pages and boards, so there is no second model to learn',
    !!nestedBox && nestedBox.onCanvas === false && nestedRendered === false, JSON.stringify({ nestedBox, nestedRendered }));

  // Display it, then read the board-card's face and geometry.
  await app.evalJs(`window.wrizoSetPinDisplayed('pw2-a', 'pw2-b', true)`);
  await sleep(400);
  await app.evalJs("location.hash = '#/'"); await sleep(200);
  await app.evalJs("location.hash = '#/page/pw2-a'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'board A again, with B displayed');
  await sleep(500);
  const cardFace = await app.evalJs(`(() => {
    const el = document.querySelector('.board-boardcard');
    if (!el) return null;
    const box = el.closest('.board-box');
    const r = box ? box.getBoundingClientRect() : el.getBoundingClientRect();
    return {
      badge: el.querySelector('.board-pin-badge')?.textContent,
      title: el.querySelector('.board-pin-title')?.textContent,
      w: r.width, h: r.height,
      doubledEdge: getComputedStyle(el, '::before').content !== 'none',
    };
  })()`);
  ok('S2 CHECK 4b: the displayed board renders as a BOARD-CARD — its badge reads the board noun (never "From a page"), it carries the doubled edge that teaches the kind by shape, and it is WIDER THAN TALL on the canvas as the same law requires in the rail',
    !!cardFace && /board/i.test(cardFace.badge || '') && cardFace.title === 'Board B'
      && cardFace.doubledEdge === true && cardFace.w > cardFace.h,
    JSON.stringify(cardFace));

  // CHECK 3 — deep chain: travel in, the crumb, the way out.
  await app.evalJs(`window.wrizoSetPinDisplayed('pw2-b', 'pw2-c', true)`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/pw2-c'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'board C, three levels deep');
  await sleep(500);
  const crumb = await app.evalJs(`(() => {
    const c = document.querySelector('.desk-frame-host .sprint-crumb');
    if (!c) return null;
    return {
      text: c.innerText.replace(/\\s+/g, ' ').trim(),
      nest: [...c.querySelectorAll('.wz-crumb-nest')].map(b => b.textContent),
      lines: c.getBoundingClientRect().height,
    };
  })()`);
  ok('S2 CHECK 3a: at depth the crumb carries the NEST CHAIN, outermost first — the address answers "where am I" without opening anything',
    !!crumb && JSON.stringify(crumb.nest) === JSON.stringify(['Board A', 'Board B']), JSON.stringify(crumb));

  const wentOut = await pressEl(app, "[...document.querySelectorAll('.wz-crumb-nest')].find(b => b.textContent === 'Board A')", 'the parent segment is the door out');
  if (wentOut) {
    await sleep(600);
    const landed = await app.evalJs("location.hash");
    ok('S2 CHECK 3b: the parent segment is the DOOR OUT and it travels DIRECTLY — escaping three levels is ONE press, not three. This is the test a recursive container has to pass',
      landed.includes('pw2-a'), landed);
  }

  // CHECK 5 — the menu twin for travel.
  await app.evalJs("location.hash = '#/page/pw2-a'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'board A, for the survey');
  await sleep(400);
  if (await openPlan(app)) {
    // Board A's own panel: it has no parents, so reach the survey via its own
    // contents instead — the nested board lives in A's plan-board survey.
    const surveyOpen = await app.evalJs("!!document.querySelector('.wz-cascade-survey')");
    void surveyOpen;
  }
  await app.evalJs("location.hash = '#/page/pw2-page'");
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'the page, whose Plan panel lists board A');
  await sleep(400);
  if (await openPlan(app)) {
    if (await pressCentre(app, '.wz-cascade-boardrow-open', 'open board A\'s contents from the page')) {
      await sleep(400);
      const sections = await app.evalJs("[...document.querySelectorAll('.wz-cascade-survey-section')].map(s => s.textContent)");
      ok('S2 AMENDMENT (Nick): the memberships are sectioned off CLEARLY — "Pages" and "Boards" are distinct headings in the DOM, under the survey\'s own title, with no stacked heading above them',
        Array.isArray(sections) && sections.includes('Pages') && sections.includes('Boards'), JSON.stringify(sections));

      const shapes = await app.evalJs(`(() => {
        const pick = (cls) => {
          const el = document.querySelector('.wz-cascade-thumb.' + cls);
          if (!el) return null;
          const cs = getComputedStyle(el, '::before');
          return { w: parseFloat(cs.width), h: parseFloat(cs.height), title: el.querySelector('.wz-cascade-thumb-title')?.textContent };
        };
        return { board: pick('wz-thumb-board'), page: pick('wz-thumb-page') };
      })()`);
      ok('S2 AMENDMENT (Nick, verbatim): a BOARD thumbnail is a horizontal rectangle and a PAGE thumbnail a vertical one — measured on the rendered swatch, not inferred from the CSS',
        !!shapes?.board && !!shapes?.page && shapes.board.w > shapes.board.h && shapes.page.h > shapes.page.w,
        JSON.stringify(shapes));

      const placement = await app.evalJs(`(() => {
        const secs = [...document.querySelectorAll('.wz-cascade-survey-grid > *')];
        let cur = null; const out = {};
        for (const el of secs) {
          if (el.classList.contains('wz-cascade-survey-section')) { cur = el.textContent; continue; }
          const t = el.querySelector('.wz-cascade-thumb-title')?.textContent;
          if (t) (out[t] = out[t] || []).push(cur);
        }
        return out;
      })()`);
      ok('S2 AMENDMENT: the nested board appears under BOARDS and under nothing else — one row, one section, so the writer never works out which list a thing is in',
        !!placement && JSON.stringify(placement['Board B']) === JSON.stringify(['Boards']), JSON.stringify(placement));

      // ⚠ OPEN, WAIT, THEN READ. The menu is React state: a read in the SAME
      // evalJs as the click sees the pre-click DOM and reports an empty menu —
      // which looks exactly like a product that renders no items. The wait is
      // the difference between measuring the menu and measuring the render
      // queue.
      const twinOpened = await pressEl(app, "[...document.querySelectorAll('.wz-cascade-thumb')].find(t => t.querySelector('.wz-cascade-thumb-title')?.textContent === 'Board B')?.querySelector('.wz-cascade-thumb-menu-btn')", 'the nested board row menu opens');
      await sleep(300);
      const twin = twinOpened ? await app.evalJs(`(() => {
        const t = [...document.querySelectorAll('.wz-cascade-thumb')].find(t => t.querySelector('.wz-cascade-thumb-title')?.textContent === 'Board B');
        if (!t) return null;
        return { menu: true, items: [...t.querySelectorAll('.wz-cascade-thumb-menu-item')].map(i => (i.textContent || '').trim()) };
      })()`) : null;
      ok('S2 CHECK 5 (PW22, the twin): the nested board\'s own menu carries "Open the board" — double-click travels in on the canvas, and the same act rides the menu, so the gesture is never the only path',
        !!twin && twin.menu === true && (twin.items || []).some((i) => /open the board/i.test(i)), JSON.stringify(twin));
    }
  }

  // ==========================================================================
  // S3 — TRANSFER. Copy only.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await seedEntries(app, [
    { id: 'pw2-src', text: 'Source board', origin: 'loose', projectId: null, pageType: 'board',
      boxes: [
        { id: 'pw2-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The original card' },
        { id: 'pw2-other', kind: 'text', x: 0.5, y: 0.05, w: 0.3, h: 0.1, z: 2, text: 'A thread partner' },
        { id: 'pw2-thread', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 0, connA: 'pw2-card', connB: 'pw2-other' },
        { id: 'pw2-ported', kind: 'text', x: 0.05, y: 0.4, w: 0.3, h: 0.1, z: 3, text: 'A ported card', sourceEntryId: 'pw2-ptarget', portedAt: '2026-01-01T00:00:00.000Z' },
      ] },
    { id: 'pw2-dst', text: 'Destination board', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
    { id: 'pw2-ptarget', text: 'The ported source page', origin: 'loose', projectId: null },
  ]);

  const copied = await app.evalJs("window.wrizoCopyCardToBoard('pw2-src', 'pw2-card', 'pw2-dst')");
  await sleep(400);
  const dst = await boardOf(app, 'pw2-dst');
  const src = await boardOf(app, 'pw2-src');
  const theCopy = (dst?.boxes ?? []).find((b) => b.kind === 'text');
  ok('S3 CHECK 5a: the copy lands on the destination as a NEW card with a NEW id, and the ORIGINAL STAYS on the source — copy, never move',
    !!copied && !!theCopy && theCopy.id !== 'pw2-card' && theCopy.text === 'The original card'
      && (src?.boxes ?? []).some((b) => b.id === 'pw2-card'),
    JSON.stringify({ theCopy, srcStill: (src?.boxes ?? []).map((b) => b.id) }));

  ok('S3 CHECK 5b: THREADS DO NOT TRAVEL — a thread is a connection box whose endpoints are BOX IDS on the source board, so a copied one would be a hairline to nowhere. None is created',
    !(dst?.boxes ?? []).some((b) => b.kind === 'connection'), JSON.stringify((dst?.boxes ?? []).map((b) => b.kind)));

  ok('S3 CHECK 5c: NO SHARED IDENTITY — the copy carries no mirror fields at all (sourceEntryId/portedAt absent), which is what makes "edits do not follow" true by construction rather than by discipline: there is no shared row to diverge',
    !!theCopy && theCopy.sourceEntryId === undefined && theCopy.portedAt === undefined
      && theCopy.copiedFromBoardId === 'pw2-src',
    JSON.stringify(theCopy));

  // ⚠ THE WHITELIST'S OWN CASE: copying a PORTED card. Spread-and-strip carried
  // sourceEntryId through and gave the copy a double-click that TRAVELS.
  const portedCopy = await app.evalJs("window.wrizoCopyCardToBoard('pw2-src', 'pw2-ported', 'pw2-dst')");
  await sleep(400);
  const dst2 = await boardOf(app, 'pw2-dst');
  const copyOfPorted = (dst2?.boxes ?? []).find((b) => b.text === 'A ported card');
  ok('S3 ⚠ THE WHITELIST CASE: a copy OF A PORTED CARD carries NO sourceEntryId — the copy is independent of both the board it came from and anything the original mirrored. Spread-and-strip carried that field through, which would have cost the copy the editing gesture every card has',
    !!portedCopy && !!copyOfPorted && copyOfPorted.sourceEntryId === undefined && copyOfPorted.copiedFromBoardId === 'pw2-src',
    JSON.stringify(copyOfPorted));

  // THE PAIR, in one fixture: the copy opens; the ported card still travels.
  await app.evalJs("location.hash = '#/page/pw2-dst'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'the destination board, for the dispatch pair');
  await sleep(500);
  if (copyOfPorted) {
    const openedPopup = await app.evalJs(`(() => {
      const el = document.querySelector('[data-box-id="${copyOfPorted.id}"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    })()`);
    if (!openedPopup) { ok('DRIVER: the copied card is on the destination canvas to double-click', false, 'absent'); }
    else {
      await app.doubleClick(openedPopup.x, openedPopup.y);
      await sleep(500);
      const state = await app.evalJs("({ popup: !!document.querySelector('.board-popup-backdrop'), hash: location.hash })");
      ok('S3 THE PAIR (i): a COPY\'s double-click OPENS THE EDIT POPUP and does not travel — a copy is independent, so it keeps the editing gesture every card has',
        state.popup === true && state.hash.includes('pw2-dst'), JSON.stringify(state));
      await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
      await sleep(300);
    }
  }
  await app.evalJs("location.hash = '#/page/pw2-src'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'the source board, for the ported half of the pair');
  await sleep(500);
  const portedPt = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="pw2-ported"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  })()`);
  if (!portedPt) { ok('DRIVER: the ported card is on the source canvas to double-click', false, 'absent'); }
  else {
    await app.doubleClick(portedPt.x, portedPt.y);
    await sleep(600);
    const travelled = await app.evalJs("location.hash");
    ok('S3 THE PAIR (ii): a PORTED card\'s double-click still TRAVELS to its source — the mirror relationship is untouched, which is the whole reason a copy needed its own field instead of borrowing this one',
      travelled.includes('pw2-ptarget'), travelled);
  }

  // CHECK 6 — the verbs teach the kind.
  await app.evalJs("location.hash = '#/page/pw2-src'");
  await waitOr(app, "!!document.querySelector('.board-canvas')", 'the source board');
  await sleep(400);
  await app.evalJs("window.wrizoPinPageToBoard('pw2-ptarget', 'pw2-src')");
  await app.evalJs("window.wrizoPinPageToBoard('pw2-dst', 'pw2-src')");
  await sleep(500);
  await app.evalJs("location.hash = '#/page/pw2-ptarget'");
  await waitOr(app, "!!document.querySelector('.forward-only-editor')", 'a page connected to the source board');
  await sleep(400);
  if (await openPlan(app)) {
    if (await pressCentre(app, '.wz-cascade-boardrow-open', 'open the source board\'s contents')) {
      await sleep(400);
      // Same law as the twin above: one menu at a time, opened, WAITED ON, then
      // read. A synchronous loop over every row reports every menu empty.
      const titles = await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb')].map(t => t.querySelector('.wz-cascade-thumb-title')?.textContent).filter(Boolean)");
      const verbs = {};
      for (const title of titles || []) {
        const sel = `[...document.querySelectorAll('.wz-cascade-thumb')].find(t => t.querySelector('.wz-cascade-thumb-title')?.textContent === ${JSON.stringify(title)})`;
        const hasBtn = await app.evalJs(`!!(${sel}?.querySelector('.wz-cascade-thumb-menu-btn'))`);
        if (!hasBtn) { verbs[title] = []; continue; }
        await app.evalJs(`${sel}.querySelector('.wz-cascade-thumb-menu-btn').click()`);
        await sleep(250);
        verbs[title] = await app.evalJs(`[...(${sel}?.querySelectorAll('.wz-cascade-thumb-menu-item') || [])].map(i => (i.textContent || '').trim())`);
        await app.evalJs(`${sel}.querySelector('.wz-cascade-thumb-menu-btn').click()`);
        await sleep(150);
      }
      const hasCopy = (k) => (verbs[k] || []).some((v) => /copy to/i.test(v));
      ok('S3 CHECK 6: the verbs teach the kind (CA1) — a FREE CARD offers "Copy to a board…", while a PAGE-PIN and a BOARD-CARD offer no copy verb at all, because both are MEMBERSHIP rather than content and copying one is just a second membership',
        hasCopy('The original card') === true
          && hasCopy('The ported source page') === false
          && hasCopy('Destination board') === false,
        JSON.stringify(verbs));

      ok('S3 CHECK 7: the >=1-board invariant is RENDERED, not merely enforced — a card whose only board this is carries a removal verb that is PRESENT, INERT, and says why ("its only board"). Absence would make the writer hunt for a verb that is not missing, only refused',
        (verbs['The original card'] || []).some((v) => /its only board/i.test(v)),
        JSON.stringify(verbs['The original card']));
    }
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// THIS FILE parks nothing of its own — it is new. BUT PW2 AS A SLICE DOES RETIRE
// CHECKS ELSEWHERE, and this comment used to say otherwise.
//
// ⚠ THE CORRECTION, IN THE PLACE THE WRONG CLAIM LIVED. It read: "the slice's
// three new refusals falsify no existing assertion." That was TRUE of S1 — and
// S1 is all the sweep looked at. S2 and S3 were built afterwards and never
// re-swept, and the first stamped pair (tree 623ba30) came back red in both
// legs on two of this lane's OWN PW1 harnesses:
//   pw1.mjs  "S2 (Q4): two sections"      — Nick's amendment renamed the
//                                           heading to "Pages"
//   pw1.mjs  "S2/S3 (G3 at menu scale)"   — S3 gave CARDS a real act (Copy), so
//                                           "only members wear a menu" died
//   ab4.mjs  "S1 @ Npx: … its own cards"  — the same renamed heading, ×2 widths
// The lesson is the one already saved as canon and missed again: a sweep taken
// once, before the build grows, certifies only the part of the build that
// existed when it ran. RE-SWEEP WHEN THE SLICE GROWS, not once at S0.
//
// THE ARITHMETIC, audited by execution on the re-stamp:
//   SUPERSEDED IN PLACE, live    pw1.mjs  2 instances / 2 names
//   BEHIND THE GATE (gen 2)      ab4.mjs  2 instances / 1 name  (×2 widths)
//   PW2 TOTAL RETIRED                     4 instances / 3 names
// The gate below stays empty because this file retires nothing of its own —
// the ab4.mjs / fx3.mjs precedent for an armed-but-empty gate.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing parked in this file.
}

const allChecksPw2 = checks.concat(parkedChecks);
const pass = allChecksPw2.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `
PW2 VERIFY: PASS (${allChecksPw2.length} checks)` : `
PW2 VERIFY: FAIL — ${allChecksPw2.filter((c) => !c.pass).length}/${allChecksPw2.length} failed`);
process.exit(pass ? 0 : 1);
