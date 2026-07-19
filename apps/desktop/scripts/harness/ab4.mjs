// AB4 — the Wall (docs/wrizo-alpha/ab4-wall-brief.md). A committed CDP
// verification scenario (per AGENTS.md "Harness scenarios persist"),
// modeled on cd2.mjs's own patterns — `freshDesk`/`freshProsePage` below
// are copied VERBATIM from cd2.mjs's current (post-merge) version, per the
// brief's own instruction not to re-derive them from scratch.
// Run: node scripts/harness/ab4.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S6 list: survey card-swap (board list -> cards ->
// back) at both reference widths; docked cards persist through typing;
// the pin flow through the real picker (origin/projectId byte-unchanged,
// the membership line, unpin leaves the page intact); thread create/
// persist/remove; resize persists across reload; double-click travel +
// the way back as an actual two-step round trip; text-card inline editing
// unchanged (regression); pageKind='board' asserted; the board sliver
// carries exactly its two tools.
//
// Park sweep (S6's own instruction): investigated in full (a dedicated
// audit pass grepping every harness file for assertions AB4's changes
// could falsify — pageKind='board', the cascade/sliver now mounting on
// Board, the new page-pin/connection Box kinds, the Page face's new third
// verb). Finding: NO existing check anywhere asserts the old state as a
// pass/fail condition — every Board-vs-Script geometry check in cd2.mjs/
// ab1.mjs compares RECTS (position/width), never content presence, so
// they stay true regardless of what the strip/sliver now carry; no check
// counts `.wz-pageface-verb` buttons; no check enumerates Box['kind'] as
// exhaustively 'text'|'ink'. A handful of comments (not checks) in
// cd2.mjs/ab2.mjs narrated "Board still passes no strip content" in prose
// — fixed for honesty in this same patch (see those files' own diffs),
// but nothing needed PARKING because nothing was ever asserted as a check.
// This file's own PARKED gate below is therefore intentionally empty,
// mirroring cd2.mjs's/fx3.mjs's own precedent for an armed-but-empty gate.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const WIDE_W = 2200;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
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
  await sleep(250);
};

// j4.mjs's own drag helper, copied verbatim (re-injected after every
// app.reload() — custom window helpers don't survive a hard reload, only
// PAGE_HELPERS do).
const DRAG_HELPER = `
window.__pointerSeq = function(selector, dx, dy, opts) {
  opts = opts || {};
  const el = document.querySelector(selector);
  if (!el) throw new Error('pointerSeq: not found ' + selector);
  const r = el.getBoundingClientRect();
  const x0 = r.left + r.width/2, y0 = r.top + r.height/2;
  const pid = opts.pointerId || 1;
  const ptype = opts.pointerType || 'mouse';
  const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:pid, pointerType:ptype, bubbles:true, cancelable:true, isPrimary:true});
  el.dispatchEvent(mk('pointerdown', x0, y0));
  const steps = opts.steps || 4;
  for (let i=1;i<=steps;i++) {
    el.dispatchEvent(mk('pointermove', x0 + dx*i/steps, y0 + dy*i/steps));
  }
  el.dispatchEvent(mk('pointerup', x0+dx, y0+dy));
  return true;
};
`;

const clickCategory = async (app, idx) => {
  await app.evalJs(`(() => {
    const items = [...document.querySelectorAll('.wz-strip-item')];
    const item = items[${idx}];
    if (item) item.click();
  })()`);
};

// Seed a journal-entries row via localStorage while parked on the Desk (the
// harness-seeding law — never seed while a flush-on-unmount surface is
// still mounted; see AGENTS.md / this project's own MEMORY on the
// flushNow race).
const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before AB4 seed' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(rows)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
};

const currentProjectId = async (app, pageId) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(pageId)})?.projectId`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the CD2 erratum comes true: survey card-swap (board list -> cards
  // -> back), both reference widths.
  // ==========================================================================
  for (const width of [LAPTOP_W, WIDE_W]) {
    await freshProsePage(app, width, 900);
    await sleep(400);
    const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const projectId = await currentProjectId(app, pageId);
    const now = new Date().toISOString();
    await seedEntries(app, [
      { id: 'ab4-s1-target', text: 'AB4 Card Target Page\nSecond line body.', projectId, pageType: 'manuscript', origin: 'project', source: 'page', createdAt: now, updatedAt: now },
      {
        id: 'ab4-s1-board', text: 'AB4 Survey Board', projectId, pageType: 'board', source: 'page',
        boxes: [
          { id: 'ab4-s1-card-text', kind: 'text', x: 0.05, y: 0.05, w: 0.4, h: 0.1, z: 1, text: 'Card One\nMore body text here.' },
          { id: 'ab4-s1-card-ink', kind: 'ink', x: 0.05, y: 0.2, w: 0.2, h: 0.15, z: 2, strokes: [] },
          { id: 'ab4-s1-card-pin', kind: 'page-pin', x: 0.05, y: 0.4, w: 0.3, h: 0.1, z: 3, entryId: 'ab4-s1-target' },
        ],
        createdAt: now, updatedAt: now,
      },
    ]);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'S1 page reloaded with a board seeded' });
    await sleep(250);
    await app.emulateDpr(1, width, 900);

    await clickCategory(app, 2); // Journal, Page, Plan(2), Drawers, Shelf, Settings, Theme
    await sleep(200);
    await app.evalJs("document.querySelector('.wz-cascade-link')?.click()"); // "Open..." -> the board list survey
    await sleep(200);
    const boardListTitles = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-thumb-title')].map(t => t.textContent)`);
    ok(`S1 @ ${width}px: Plan's survey shows the board list`, boardListTitles.includes('AB4 Survey Board'), JSON.stringify(boardListTitles));

    await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb-title')].find(b => b.textContent.includes('AB4 Survey Board'))?.click()");
    await sleep(200);
    const cardsView = await app.evalJs(`({
      title: document.querySelector('.wz-cascade-survey-title')?.textContent,
      hasBack: !!document.querySelector('.wz-cascade-survey-back'),
      cardTitles: [...document.querySelectorAll('.wz-cascade-thumb-title')].map(t => t.textContent),
    })`);
    ok(`S1 @ ${width}px: picking a board swaps the survey column to ITS OWN cards (large thumbnails: title/excerpt, or "A sketch" for ink) with a quiet back affordance`,
      cardsView.title === 'AB4 Survey Board' && cardsView.hasBack
      && cardsView.cardTitles.includes('Card One')
      && cardsView.cardTitles.includes('A sketch')
      && cardsView.cardTitles.some((t) => t.includes('AB4 Card Target Page')),
      JSON.stringify(cardsView));

    await app.evalJs("document.querySelector('.wz-cascade-survey-back')?.click()");
    await sleep(200);
    const backToList = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-thumb-title')].map(t => t.textContent)`);
    ok(`S1 @ ${width}px: the back affordance returns to the board list, not the cards`,
      backToList.includes('AB4 Survey Board') && !backToList.includes('Card One'), JSON.stringify(backToList));
  }

  // ==========================================================================
  // S1 — docked cards persist through typing (CD2's own dock-testing
  // pattern, reused for the nested board-cards survey specifically — this
  // is the "PowerPoint moment" the brief names: a board's cards docked
  // beside a focused page, surviving keystrokes by the writer's deliberate
  // word).
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const projectId = await currentProjectId(app, pageId);
    const now = new Date().toISOString();
    await seedEntries(app, [
      { id: 'ab4-dock-board', text: 'AB4 Dock Board', projectId, pageType: 'board', source: 'page',
        boxes: [{ id: 'ab4-dock-card', kind: 'text', x: 0.05, y: 0.05, w: 0.4, h: 0.1, z: 1, text: 'Dock Card' }],
        createdAt: now, updatedAt: now },
    ]);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page reloaded for dock test' });
    await sleep(250);
    await app.emulateDpr(1, LAPTOP_W, 900);

    await clickCategory(app, 2);
    await sleep(150);
    await app.evalJs("document.querySelector('.wz-cascade-link')?.click()");
    await sleep(150);
    await app.evalJs("[...document.querySelectorAll('.wz-cascade-thumb-title')].find(b => b.textContent.includes('AB4 Dock Board'))?.click()");
    await sleep(150);
    await app.evalJs("document.querySelector('.wz-cascade-dock-btn')?.click()"); // dock the survey
    await sleep(200);
    const dockedBefore = await app.evalJs(`({
      present: !!document.querySelector('.wz-cascade-survey'),
      docked: document.querySelector('.wz-cascade-survey')?.dataset.docked,
      cardVisible: [...document.querySelectorAll('.wz-cascade-thumb-title')].some(t => t.textContent.includes('Dock Card')),
    })`);
    ok('S1: the board-cards survey docks like any other survey layer', dockedBefore.present && dockedBefore.docked === 'true' && dockedBefore.cardVisible, JSON.stringify(dockedBefore));

    await app.evalJs("(document.querySelector('.forward-only-editor, .entry-edit, .entry-full, [contenteditable=\"true\"]'))?.focus?.()");
    await app.typeKeys('x');
    await sleep(200);
    const dockedAfterTyping = await app.evalJs(`({
      present: !!document.querySelector('.wz-cascade-survey'),
      docked: document.querySelector('.wz-cascade-survey')?.dataset.docked,
      cardVisible: [...document.querySelectorAll('.wz-cascade-thumb-title')].some(t => t.textContent.includes('Dock Card')),
    })`);
    ok('S1/S6: docked board cards survive a keystroke elsewhere on the page (the writer\'s deliberate word to keep them)',
      dockedAfterTyping.present && dockedAfterTyping.docked === 'true' && dockedAfterTyping.cardVisible, JSON.stringify(dockedAfterTyping));
  }

  // ==========================================================================
  // S2 — the pin flow through the REAL picker (not a shortcut): origin/
  // projectId byte-unchanged on the pinned page, the membership line reads
  // truthfully, unpin removes the card but the page itself stays intact.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const sourcePageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const before = await app.localJSON('writer-studio-journal-entries');
    const sourceBefore = before.find((e) => e.id === sourcePageId);
    ok('S2 setup: the source page exists before pinning', !!sourceBefore, sourcePageId);

    const now = new Date().toISOString();
    // A whole separate project + board, so Pin's own destination picker has
    // real drill-down to exercise (root -> a project -> a board), not just
    // the source page's own home. Seeded directly into both collections in
    // one atomic step (a Project row is NOT a JournalEntry — seedEntries()
    // only ever targets the latter).
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before AB4 pin-target seed' });
    await app.evalJs(`(() => {
      const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
      projects.push({ id: 'ab4-pin-project', title: 'AB4 Pin Target Project', type: 'creative', storyPlanId: null, createdAt: ${JSON.stringify(now)}, updatedAt: ${JSON.stringify(now)} });
      localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'ab4-pin-board', text: 'AB4 Target Board', projectId: 'ab4-pin-project', pageType: 'board', boxes: [], source: 'page', createdAt: ${JSON.stringify(now)}, updatedAt: ${JSON.stringify(now)} });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(sourcePageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'source page reloaded for pin test' });
    await sleep(250);
    await app.emulateDpr(1, LAPTOP_W, 900);

    await clickCategory(app, 1); // Page
    await sleep(200);
    const pinButtonPresent = await app.evalJs("!!document.querySelector('.wz-pageface-verb-pin')");
    ok('S2: "Pin to a Board..." joins Move/Copy and Port in the Page face\'s sending row', pinButtonPresent === true);

    await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
    await sleep(200);
    const sheetOpen = await app.evalJs("!!document.querySelector('.board-sheet')");
    ok('S2: Pin opens the real destination picker (the same Add-to grammar\'s board picker)', sheetOpen === true);

    await app.evalJs("[...document.querySelectorAll('.board-dest-row')].find(b => b.textContent.includes('AB4 Pin Target Project'))?.click()");
    await sleep(200);
    const boardRowShown = await app.evalJs("[...document.querySelectorAll('.board-dest-row')].some(b => b.textContent.includes('AB4 Target Board'))");
    ok('S2: drilling into the project shows its own board(s) to pin onto', boardRowShown === true);

    await app.evalJs("[...document.querySelectorAll('.board-dest-row')].find(b => b.textContent.includes('AB4 Target Board'))?.click()");
    await sleep(250);
    const sheetClosed = await app.evalJs("!document.querySelector('.board-sheet')");
    ok('S2: picking the board closes the sheet', sheetClosed === true);
    await sleep(450); // clear persistence.ts's own 300ms debounced-flush window before reading localStorage directly

    const membership = await app.evalJs(`[...document.querySelectorAll('.wz-pageface-membership')].map(m => m.textContent)`);
    ok('S2: the Page face\'s home block gains a truthful "Also pinned to <board>." membership line',
      membership.some((m) => m === 'Also pinned to AB4 Target Board.'), JSON.stringify(membership));

    const boardBoxes = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'ab4-pin-board')?.boxes");
    const pinBox = (boardBoxes || []).find((b) => b.kind === 'page-pin' && b.entryId === sourcePageId);
    ok('S2: pinning adds a page-pin card to the board referencing the entry id (membership, not a copy)', !!pinBox, JSON.stringify(boardBoxes));

    const after = await app.localJSON('writer-studio-journal-entries');
    const sourceAfter = after.find((e) => e.id === sourcePageId);
    ok('S2: the pinned page\'s own origin/projectId/text are BYTE-UNCHANGED by pinning',
      sourceAfter.origin === sourceBefore.origin && sourceAfter.projectId === sourceBefore.projectId && sourceAfter.text === sourceBefore.text,
      JSON.stringify({ before: { origin: sourceBefore.origin, projectId: sourceBefore.projectId }, after: { origin: sourceAfter.origin, projectId: sourceAfter.projectId } }));

    // Unpin: select the page-pin card on the board itself and Remove it —
    // the card leaves, the page stays.
    await app.evalJs("location.hash = '#/page/ab4-pin-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'target board framed for unpin' });
    await sleep(250);
    await app.evalJs(`document.querySelector('[data-box-id="${pinBox.id}"]').dispatchEvent(new PointerEvent('pointerdown', { clientX: 1, clientY: 1, pointerId: 1, pointerType: 'mouse', bubbles: true, isPrimary: true }))`);
    await app.evalJs(`document.querySelector('[data-box-id="${pinBox.id}"]').dispatchEvent(new PointerEvent('pointerup', { clientX: 1, clientY: 1, pointerId: 1, pointerType: 'mouse', bubbles: true, isPrimary: true }))`);
    await sleep(150);
    await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Remove')?.click()");
    await sleep(200);
    const boxesAfterUnpin = await app.evalJs('window.wrizoBoard ? window.wrizoBoard() : null');
    ok('S2: unpinning removes the card from the board', !(boxesAfterUnpin || []).some((b) => b.id === pinBox.id), JSON.stringify(boxesAfterUnpin?.map((b) => b.id)));

    const sourceAfterUnpin = (await app.localJSON('writer-studio-journal-entries')).find((e) => e.id === sourcePageId);
    ok('S2: unpinning never touches the page itself — it remains fully intact',
      !!sourceAfterUnpin && !sourceAfterUnpin.deletedAt && sourceAfterUnpin.text === sourceBefore.text && sourceAfterUnpin.origin === sourceBefore.origin,
      JSON.stringify(sourceAfterUnpin));
  }

  // FX4 S6 — this whole "S3 — threads" block SUPERSEDED: the sliver's own
  // Connect toggle retires whole, replaced by the handle-drag gesture
  // (double-click the brass resize handle, drag, release inside a target
  // card). All six checks below (arm/click-click/Escape/color/persist/
  // select+delete) are parked verbatim in this file's own PARKED section;
  // live successors (the SAME six claims, reached via handle-drag) are in
  // fx4.mjs's own S6 section.

  // ==========================================================================
  // S4 — resize persists across reload (a page-pin card: freeform on both
  // axes, the new capability this ticket adds to the existing mechanism).
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const projectId = await currentProjectId(app, pageId);
    const now = new Date().toISOString();
    await seedEntries(app, [
      { id: 'ab4-resize-target', text: 'AB4 Resize Target', projectId, pageType: 'manuscript', origin: 'project', source: 'page', createdAt: now, updatedAt: now },
      { id: 'ab4-resize-board', text: 'AB4 Resize Board', projectId, pageType: 'board', source: 'page',
        boxes: [{ id: 'ab4-resize-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, entryId: 'ab4-resize-target' }],
        createdAt: now, updatedAt: now },
    ]);
    await app.reload();
    await app.evalJs(DRAG_HELPER);
    await app.evalJs("location.hash = '#/page/ab4-resize-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'resize board framed' });
    await sleep(250);
    await app.emulateDpr(1, LAPTOP_W, 900);

    await app.evalJs('__pointerSeq(\'[data-box-id="ab4-resize-pin"]\', 0, 0)');
    await sleep(100);
    const hasHandle = await app.evalJs('!!document.querySelector(\'[data-box-id="ab4-resize-pin"] .board-handle\')');
    ok('S4: a selected page-pin card shows the SAME corner resize handle text/ink cards already use', hasHandle === true);
    const before = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'ab4-resize-pin');
    await app.evalJs('__pointerSeq(\'[data-box-id="ab4-resize-pin"] .board-handle\', 90, 60, {steps:3})');
    await sleep(150);
    const afterDrag = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'ab4-resize-pin');
    ok('S4: dragging the corner resizes a page-pin card freeform on BOTH axes (no aspect lock, unlike ink)',
      afterDrag.w > before.w && afterDrag.h > before.h, JSON.stringify({ before, afterDrag }));

    await sleep(2200); // clear the autosave debounce
    await app.reload();
    await app.evalJs(DRAG_HELPER);
    await app.evalJs("location.hash = '#/page/ab4-resize-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'resize board reloaded' });
    await sleep(250);
    const afterReload = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'ab4-resize-pin');
    ok('S4: the resize persists across reload', Math.abs(afterReload.w - afterDrag.w) < 0.001 && Math.abs(afterReload.h - afterDrag.h) < 0.001,
      JSON.stringify({ afterDrag, afterReload }));
  }

  // ==========================================================================
  // S4 — double-click travel + the way back, an actual two-step round trip.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const projectId = await currentProjectId(app, pageId);
    const now = new Date().toISOString();
    await seedEntries(app, [
      { id: 'ab4-travel-target', text: 'AB4 Travel Target Page', projectId, pageType: 'manuscript', origin: 'project', source: 'page', createdAt: now, updatedAt: now },
      { id: 'ab4-travel-board', text: 'AB4 Travel Board', projectId, pageType: 'board', source: 'page',
        boxes: [{ id: 'ab4-travel-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, entryId: 'ab4-travel-target' }],
        createdAt: now, updatedAt: now },
    ]);
    await app.reload();
    await app.evalJs("location.hash = '#/page/ab4-travel-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'travel board framed' });
    await sleep(250);
    await app.emulateDpr(1, LAPTOP_W, 900);

    await app.evalJs('document.querySelector(\'[data-box-id="ab4-travel-pin"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
    await sleep(300);
    const afterTravel = await app.evalJs('location.hash');
    ok('S4: double-clicking a page-pin card travels to its own page', afterTravel.includes('ab4-travel-target'), afterTravel);

    await app.waitFor("!!document.querySelector('.wz-back-to-board')", { label: 'the way-back chip', timeout: 4000 });
    const chipPresent = await app.evalJs("!!document.querySelector('.wz-back-to-board')");
    ok('S4: "way back guaranteed" — a chip waits on the target page ("the board is one Back away")', chipPresent === true);

    await app.evalJs("document.querySelector('.wz-back-to-board').click()");
    await sleep(300);
    const afterBack = await app.evalJs('location.hash');
    ok('S4: the chip returns to the board in one step — the round trip closes', afterBack.includes('ab4-travel-board'), afterBack);
  }

  // ==========================================================================
  // S4 (regression) — a plain text card's double-click inline editing is
  // completely untouched by the page-pin/kind-switch work.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const projectId = await currentProjectId(app, pageId);
    const now = new Date().toISOString();
    await seedEntries(app, [
      { id: 'ab4-text-regress-board', text: 'AB4 Text Regress Board', projectId, pageType: 'board', source: 'page',
        boxes: [{ id: 'ab4-text-regress-card', kind: 'text', x: 0.05, y: 0.05, w: 0.4, h: 0.1, z: 1, text: 'Before edit' }],
        createdAt: now, updatedAt: now },
    ]);
    await app.reload();
    await app.evalJs("location.hash = '#/page/ab4-text-regress-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'text regress board framed' });
    await sleep(250);
    await app.emulateDpr(1, LAPTOP_W, 900);

    // FX4 S5 — both checks below SUPERSEDED: inline contenteditable editing
    // retires whole (double-click now opens BoardCardPopup, over a blurred
    // board). Parked verbatim in this file's own PARKED section; live
    // successors (double-click opens the popup; typed edits commit) are in
    // fx4.mjs's own S5 section.

    // ==========================================================================
    // S5 — pageKind='board' asserted (the same fixture, already framed).
    // ==========================================================================
    const stageClass = await app.evalJs("document.querySelector('.desk-frame-stage')?.className");
    ok('S5: BoardEditor declares pageKind="board" (the standing prose placeholder is gone)', /desk-frame-stage--board/.test(stageClass || ''), stageClass);
  }

  // ==========================================================================
  // S5 — the board sliver carries EXACTLY its two tools (count, not just
  // presence), and "Add card" actually adds one, opened straight into edit.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const projectId = await currentProjectId(app, pageId);
    const now = new Date().toISOString();
    await seedEntries(app, [
      { id: 'ab4-sliver-board', text: 'AB4 Sliver Board', projectId, pageType: 'board', boxes: [], source: 'page', createdAt: now, updatedAt: now },
    ]);
    await app.reload();
    await app.evalJs("location.hash = '#/page/ab4-sliver-board'");
    await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'sliver board framed' });
    await sleep(250);
    await app.emulateDpr(1, LAPTOP_W, 900);

    // FX4 S6/S5 — both checks below SUPERSEDED: the sliver's Connect toggle
    // retires (S6), so it no longer carries "exactly two hand tools"; and
    // inline contenteditable editing retires whole (S5), so "Add card"
    // opens the POPUP now, not .board-text-editing. Parked verbatim in
    // this file's own PARKED section; live successors are in fx4.mjs's own
    // S5/S6 sections.
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX4 (2026-07-18) is the first real tenant of this scaffold: S5 retires
// inline contenteditable text-card editing whole (replaced by
// BoardCardPopup, over a blurred board) and S6 retires the sliver's own
// Connect toggle whole (replaced by a handle-drag gesture: double-click the
// brass resize handle, drag, release inside a target card). Ten checks
// parked below (SUPERSEDED species, quoted verbatim) — the whole "S3 —
// threads" connect-mode block (six checks), the "S5 — exactly two hand
// tools" + "Add card opens straight into edit mode" checks (two), and the
// "S4 (regression) — inline editing untouched" block (two). Live successors
// for all ten are in fx4.mjs's own S5/S6 sections.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    // ORIGINAL (this file's own live "S4 (regression)" section): await app.
    // evalJs('document.querySelector(\'[data-box-id="ab4-text-regress-card
    // "]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
    // await app.waitFor('!!document.querySelector(\'[data-box-id="ab4-text
    // -regress-card"] .board-text-editing\')', ...); const editModeOk = ...;
    // ok('S4 (regression): double-click on a plain text card still enters
    // inline edit mode exactly as before AB4', editModeOk === true); ...
    // ok('S4 (regression): the keystrokes commit exactly as before...',
    // committed === 'Before edit EDITED', ...);
    // FX4 S5 — inline contenteditable editing retires whole; double-click
    // now opens BoardCardPopup instead. Re-derived here with the SAME
    // underlying claim (double-click enters an edit surface; typed edits
    // commit) reached via the popup.
    await freshProsePage(app, LAPTOP_W, 900);
    await sleep(400);
    {
      const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
      const projectId = await currentProjectId(app, pageId);
      const now = new Date().toISOString();
      await seedEntries(app, [
        { id: 'ab4-parked-regress-board', text: 'AB4 Parked Regress Board', projectId, pageType: 'board', source: 'page',
          boxes: [{ id: 'ab4-parked-regress-card', kind: 'text', x: 0.05, y: 0.05, w: 0.4, h: 0.1, z: 1, text: 'Before edit' }],
          createdAt: now, updatedAt: now },
      ]);
      await app.reload();
      await app.evalJs("location.hash = '#/page/ab4-parked-regress-board'");
      await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'PARKED text regress board framed' });
      await sleep(250);
      await app.emulateDpr(1, LAPTOP_W, 900);

      await app.evalJs('document.querySelector(\'[data-box-id="ab4-parked-regress-card"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
      await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'PARKED text card popup open' });
      const editModeOkNow = await app.evalJs("!!document.querySelector('.board-popup-editor')");
      pok('PARKED (was "S4 (regression): double-click on a plain text card still enters inline edit mode exactly as before AB4") — FX4 S5: re-derived against BoardCardPopup instead of the retired inline editor',
        editModeOkNow === true, String(editModeOkNow));

      await app.typeKeys(' EDITED');
      await sleep(150);
      await app.evalJs("document.querySelector('.board-popup-done').click()");
      await sleep(200);
      const committedNow = await app.evalJs("(window.wrizoBoard() || []).find(b => b.id === 'ab4-parked-regress-card')?.text");
      pok('PARKED (was "S4 (regression): the keystrokes commit exactly as before — no sliver/cascade interference") — FX4 S5: re-derived via the popup\'s own Done button',
        committedNow === 'Before edit EDITED', committedNow);
    }

    // ORIGINAL (this file's own live "S5" sliver-shape section): const
    // sliverShape = await app.evalJs(`(() => { const sections = document.
    // querySelectorAll('.wz-sliver-body > .wz-sliver-section'); ... return
    // { sectionCount: sections.length, buttonCount: buttons.length, ... };
    // })()`); ok('S5: the board sliver carries EXACTLY its two hand tools
    // (Add card, Connect toggle) and nothing else', sliverShape.
    // sectionCount === 1 && sliverShape.buttonCount === 2, ...); const
    // boxesBeforeAdd = ...; await app.evalJs("...Add card...click()"); ...
    // const editingNow = await app.evalJs("!!document.querySelector('.board
    // -text-editing')"); ok('S5: "Add card" adds a new blank text card and
    // opens it straight into edit mode', boxesAfterAdd.length === ... &&
    // editingNow === true, ...);
    // FX4 S6 — the Connect toggle retires; the sliver carries Add card
    // ALONE now (exactly one tool, not two). FX4 S5 — "Add card" opens the
    // POPUP now, not inline editing.
    await freshProsePage(app, LAPTOP_W, 900);
    await sleep(400);
    {
      const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
      const projectId = await currentProjectId(app, pageId);
      const now = new Date().toISOString();
      await seedEntries(app, [
        { id: 'ab4-parked-sliver-board', text: 'AB4 Parked Sliver Board', projectId, pageType: 'board', boxes: [], source: 'page', createdAt: now, updatedAt: now },
      ]);
      await app.reload();
      await app.evalJs("location.hash = '#/page/ab4-parked-sliver-board'");
      await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'PARKED sliver board framed' });
      await sleep(250);
      await app.emulateDpr(1, LAPTOP_W, 900);

      await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
      await sleep(150);
      const sliverShapeNow = await app.evalJs(`(() => {
        const sections = document.querySelectorAll('.wz-sliver-body > .wz-sliver-section');
        const boardSection = [...sections].find(s => s.querySelector('.wz-sliver-item-btn'));
        const buttons = boardSection ? boardSection.querySelectorAll('button') : [];
        return { sectionCount: sections.length, buttonCount: buttons.length, labels: [...buttons].map(b => b.textContent.trim()) };
      })()`);
      // GENERATION 2 (FX5 S5) — a SECOND control joins Add card: the
      // connections-footer toggle ("Add card + this, two controls" — the
      // brief's own words). Back to two tools, but neither one is the
      // OLD Connect toggle this check first parked — a different pair,
      // not a restoration.
      pok('PARKED (was "S5: the board sliver carries EXACTLY its two hand tools (Add card, Connect toggle) and nothing else", generation 2: was FX4 S6\'s own re-derivation at exactly ONE tool) — FX5 S5: back to two controls (Add card + the footer toggle) — live successor in fx5.mjs\'s own S5 section',
        sliverShapeNow.sectionCount === 1 && sliverShapeNow.buttonCount === 2 && sliverShapeNow.labels[0] === 'Add card' && sliverShapeNow.labels[1] === 'Show connections', JSON.stringify(sliverShapeNow));

      const boxesBeforeAddNow = (await app.evalJs('window.wrizoBoard()')) || [];
      await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].find(b => b.textContent.trim() === 'Add card')?.click()");
      await sleep(200);
      const boxesAfterAddNow = (await app.evalJs('window.wrizoBoard()')) || [];
      const editingNowViaPopup = await app.evalJs("!!document.querySelector('.board-popup-editor')");
      pok('PARKED (was "S5: \\"Add card\\" adds a new blank text card and opens it straight into edit mode") — FX4 S5: re-derived — "edit mode" now means the popup',
        boxesAfterAddNow.length === boxesBeforeAddNow.length + 1 && editingNowViaPopup === true,
        JSON.stringify({ before: boxesBeforeAddNow.length, after: boxesAfterAddNow.length, editingNowViaPopup }));
    }

    // ORIGINAL (this file's own live "S3 — threads" section, the WHOLE
    // connect-mode block): arm via document.querySelector('.wz-sliver-
    // connect')?.click(); click card A then card B; ok('S3: the sliver\'s
    // Connect toggle arms connect mode', ...); ok('S3: click card A then
    // card B draws a hairline between them', ...); ok('S3: Escape disarms
    // connect mode', ...); ok('S3: the hairline is quiet (not orange) at
    // rest, and reads differently while armed vs. at rest', ...); ok('S3:
    // the thread survives a reload', ...); ok('S3: clicking the hairline
    // selects it...', ...); ok('S3: Delete removes the selected thread
    // immediately, no confirm', ...). [full six-check block, this file's
    // own git history before this fold carries the verbatim source]
    // FX4 S6 — the Connect toggle retires whole, replaced by the handle-
    // drag gesture (double-click the brass resize handle, drag, release
    // inside a target card). Re-derived here as ONE consolidated proof
    // covering the SAME six underlying claims (arm, mint, disarm/cancel,
    // color states, persistence, select+delete) — full, granular per-claim
    // coverage is fx4.mjs's own S6 section (its own dedicated checks for
    // each).
    await freshProsePage(app, LAPTOP_W, 900);
    await sleep(400);
    {
      const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
      const projectId = await currentProjectId(app, pageId);
      const now = new Date().toISOString();
      await seedEntries(app, [
        { id: 'ab4-parked-thread-board', text: 'AB4 Parked Thread Board', projectId, pageType: 'board', source: 'page',
          boxes: [
            { id: 'ab4-parked-thread-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
            { id: 'ab4-parked-thread-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
          ],
          createdAt: now, updatedAt: now },
      ]);
      await app.reload();
      await app.evalJs(DRAG_HELPER);
      await app.evalJs("location.hash = '#/page/ab4-parked-thread-board'");
      await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'PARKED thread board framed' });
      await sleep(250);
      await app.emulateDpr(1, LAPTOP_W, 900);

      // ORIGINAL: await app.evalJs("...wz-sliver-grip...click()"); await
      // app.evalJs("...wz-sliver-connect...click()"); const armed = ...
      // dataset.on; ok('S3: the sliver\'s Connect toggle arms connect
      // mode', armed === 'true', armed);
      // FX4 S6 — re-derived: double-clicking the handle arms a thread-drag.
      //
      // GENERATION 2 (FX5 S5) — the handle-double-click gesture is ITSELF
      // now retired whole (Nick's own ruling: "the dead handle-gesture...
      // do not repair it") — `.board-handle` carries no dblclick listener
      // at all anymore. Re-derived a second time: a pointer sequence
      // starting ON the origin card's own olive pin (`.board-pin-grab`)
      // arms AND drags in one continuous gesture (no separate arm step),
      // dispatched on `.board-canvas` for the move/up legs (this file's
      // own established synthetic-sequence convention — pointer capture
      // itself can't be faked from script, so events are targeted where
      // the real listeners live, matching every other synthetic drag in
      // this suite).
      const dragPinTo = (fromSel, toSel) => app.evalJs(`(() => {
        const pin = document.querySelector('${fromSel} .board-pin-grab');
        const target = document.querySelector('${toSel}');
        const canvas = document.querySelector('.board-canvas');
        const pr = pin.getBoundingClientRect();
        const tr = target.getBoundingClientRect();
        const x0 = pr.left + pr.width/2, y0 = pr.top + pr.height/2;
        const x1 = tr.left + tr.width/2, y1 = tr.top + tr.height/2;
        const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:1, pointerType:'mouse', bubbles:true, cancelable:true, isPrimary:true});
        pin.dispatchEvent(mk('pointerdown', x0, y0));
        canvas.dispatchEvent(mk('pointermove', (x0+x1)/2, (y0+y1)/2));
        canvas.dispatchEvent(mk('pointerup', x1, y1));
      })()`);
      const armPinOnly = (fromSel) => app.evalJs(`(() => {
        const pin = document.querySelector('${fromSel} .board-pin-grab');
        const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:1, pointerType:'mouse', bubbles:true, cancelable:true, isPrimary:true});
        const r = pin.getBoundingClientRect();
        pin.dispatchEvent(mk('pointerdown', r.left + r.width/2, r.top + r.height/2));
      })()`);

      await dragPinTo('[data-box-id="ab4-parked-thread-a"]', '[data-box-id="ab4-parked-thread-b"]');
      await sleep(200);
      const linesAfterConnectNow = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
      pok('PARKED (was "S3: the sliver\'s Connect toggle arms connect mode" + "S3: click card A then card B draws a hairline between them") — FX5 S5: re-derived a second time — a single continuous drag from the olive pin, released inside card B, arms AND mints the hairline in one gesture (no separate arm step at all anymore)',
        linesAfterConnectNow === 1, String(linesAfterConnectNow));

      // ORIGINAL: ok('S3: Escape disarms connect mode', ...) + ok('S3: the
      // hairline is quiet (not orange) at rest, and reads differently
      // while armed vs. at rest', armedColor !== restColor, ...).
      // FX4 S6 — the connect-mode-wide armed color state retires with the
      // toggle; the armed state is now scoped to the ORIGIN CARD's own
      // dashed outline (data-thread-source), not the hairline's own color,
      // since a hairline no longer exists yet while merely armed (it's
      // minted atomically on release). Re-derived as: arming again and
      // Escaping cancels it (no new hairline), proving the disarm half of
      // the original claim; the color-differs half no longer has a
      // meaningful equivalent (there is no "armed hairline" state anymore
      // to compare against "at rest" — a hairline exists only once minted).
      //
      // GENERATION 2 (FX5 S5) — re-derived once more: pressing down on the
      // pin (no release yet) arms a drag; Escape cancels it mid-gesture.
      await armPinOnly('[data-box-id="ab4-parked-thread-a"]');
      await sleep(150);
      await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
      await sleep(150);
      const disarmedByEscapeNow = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
      const linesAfterEscapeNow = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
      pok('PARKED (was "S3: Escape disarms connect mode" + "S3: the hairline is quiet (not orange) at rest, and reads differently while armed vs. at rest") — FX5 S5: re-derived a second time — Escape disarms a pending pin-drag mid-gesture without minting a second hairline',
        disarmedByEscapeNow === 'false' && linesAfterEscapeNow === 1, JSON.stringify({ disarmedByEscapeNow, linesAfterEscapeNow }));

      // ORIGINAL: await sleep(2200); await app.reload(); ... const
      // boxesAfterReload = ...; const conn = (boxesAfterReload || []).
      // find(b => b.kind === 'connection' && ...); ok('S3: the thread
      // survives a reload', !!conn, ...);
      await sleep(2200);
      await app.reload();
      await app.evalJs(DRAG_HELPER);
      await app.evalJs("location.hash = '#/page/ab4-parked-thread-board'");
      await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'PARKED thread board reloaded' });
      await sleep(250);
      const boxesAfterReloadNow = await app.evalJs('window.wrizoBoard()');
      const connNow = (boxesAfterReloadNow || []).find((b) => b.kind === 'connection');
      pok('PARKED (was "S3: the thread survives a reload") — FX4 S6: re-derived — a handle-drag-minted thread survives a reload identically',
        !!connNow, JSON.stringify(connNow));

      // ORIGINAL: await app.evalJs("...board-connection-hit...click..."); ...
      // const selected = ...; ok('S3: clicking the hairline selects it
      // (brass, matching the board\'s own selection language)', selected
      // === 'true', selected); await app.evalJs("...Delete..."); ... ok(
      // 'S3: Delete removes the selected thread immediately, no confirm',
      // linesAfterDelete === 0 && ..., ...);
      // FX4 S6 — selection + deletion are UNCHANGED mechanics (only the
      // creation gesture differs) — re-derived on the SAME thread.
      await app.evalJs("document.querySelector('.board-connection-hit').dispatchEvent(new MouseEvent('click', { bubbles: true }))");
      await sleep(150);
      const selectedNow = await app.evalJs("document.querySelector('.board-connection-line')?.dataset.selected");
      pok('PARKED (was "S3: clicking the hairline selects it (brass, matching the board\'s own selection language)") — FX4 S6: unchanged mechanic, re-derived on a handle-drag-minted thread',
        selectedNow === 'true', selectedNow);
      await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))");
      await sleep(200);
      const linesAfterDeleteNow = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
      const boxesAfterDeleteNow = await app.evalJs('window.wrizoBoard()');
      pok('PARKED (was "S3: Delete removes the selected thread immediately, no confirm") — FX4 S6: unchanged mechanic, re-derived on a handle-drag-minted thread',
        linesAfterDeleteNow === 0 && !(boxesAfterDeleteNow || []).some((b) => b.kind === 'connection'), String(linesAfterDeleteNow));
    }

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nAB4 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nAB4 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksAb4 = checks.concat(parkedChecks);
const pass = allChecksAb4.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nAB4 VERIFY: PASS (${allChecksAb4.length} checks)` : `\nAB4 VERIFY: FAIL — ${allChecksAb4.filter((c) => !c.pass).length}/${allChecksAb4.length} failed`);
process.exit(pass ? 0 : 1);
