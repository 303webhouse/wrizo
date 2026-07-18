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

  // ==========================================================================
  // S3 — threads: create via the connect-mode gesture, reload, confirm
  // persistence; delete via select + Delete, confirm-free.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await sleep(400);
  {
    const pageId = await app.evalJs('location.hash.split(\'/page/\')[1]');
    const projectId = await currentProjectId(app, pageId);
    const now = new Date().toISOString();
    await seedEntries(app, [
      { id: 'ab4-thread-board', text: 'AB4 Thread Board', projectId, pageType: 'board', source: 'page',
        boxes: [
          { id: 'ab4-thread-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
          { id: 'ab4-thread-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
        ],
        createdAt: now, updatedAt: now },
    ]);
    await app.reload();
    await app.evalJs(DRAG_HELPER);
    await app.evalJs("location.hash = '#/page/ab4-thread-board'");
    await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'thread board framed' });
    await sleep(250);
    await app.emulateDpr(1, LAPTOP_W, 900);

    // arm connect mode from the sliver
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(150);
    await app.evalJs("document.querySelector('.wz-sliver-connect')?.click()");
    await sleep(150);
    const armed = await app.evalJs("document.querySelector('.wz-sliver-connect')?.dataset.on");
    ok('S3: the sliver\'s Connect toggle arms connect mode', armed === 'true', armed);

    await app.evalJs('__pointerSeq(\'[data-box-id="ab4-thread-a"]\', 0, 0)');
    await sleep(100);
    await app.evalJs('__pointerSeq(\'[data-box-id="ab4-thread-b"]\', 0, 0)');
    await sleep(200);
    const linesAfterConnect = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
    ok('S3: click card A then card B draws a hairline between them', linesAfterConnect === 1, String(linesAfterConnect));

    const armedColor = await app.evalJs("getComputedStyle(document.querySelector('.board-connection-line')).stroke");
    // Escape disarms
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await sleep(150);
    const disarmed = await app.evalJs("document.querySelector('.wz-sliver-connect')?.dataset.on");
    ok('S3: Escape disarms connect mode', disarmed === 'false', disarmed);
    const restColor = await app.evalJs("getComputedStyle(document.querySelector('.board-connection-line')).stroke");
    ok('S3: the hairline is quiet (not orange) at rest, and reads differently while armed vs. at rest',
      armedColor !== restColor, JSON.stringify({ armedColor, restColor }));

    // persistence across reload
    await sleep(2200); // clear the autosave debounce
    await app.reload();
    await app.evalJs(DRAG_HELPER);
    await app.evalJs("location.hash = '#/page/ab4-thread-board'");
    await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'thread board reloaded' });
    await sleep(250);
    const boxesAfterReload = await app.evalJs('window.wrizoBoard()');
    const conn = (boxesAfterReload || []).find((b) => b.kind === 'connection' && ((b.connA === 'ab4-thread-a' && b.connB === 'ab4-thread-b') || (b.connA === 'ab4-thread-b' && b.connB === 'ab4-thread-a')));
    ok('S3: the thread survives a reload', !!conn, JSON.stringify(boxesAfterReload?.map((b) => b.kind)));

    // select the hairline, delete it — confirm-free
    await app.evalJs("document.querySelector('.board-connection-hit').dispatchEvent(new MouseEvent('click', { bubbles: true }))");
    await sleep(150);
    const selected = await app.evalJs("document.querySelector('.board-connection-line')?.dataset.selected");
    ok('S3: clicking the hairline selects it (brass, matching the board\'s own selection language)', selected === 'true', selected);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))");
    await sleep(200);
    const linesAfterDelete = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
    const boxesAfterDelete = await app.evalJs('window.wrizoBoard()');
    ok('S3: Delete removes the selected thread immediately, no confirm',
      linesAfterDelete === 0 && !(boxesAfterDelete || []).some((b) => b.kind === 'connection'), String(linesAfterDelete));
  }

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

    await app.evalJs('document.querySelector(\'[data-box-id="ab4-text-regress-card"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
    await app.waitFor('!!document.querySelector(\'[data-box-id="ab4-text-regress-card"] .board-text-editing\')', { label: 'text card edit mode (regression)' });
    const editModeOk = await app.evalJs('!!document.querySelector(\'[data-box-id="ab4-text-regress-card"] .board-text-editing\')');
    ok('S4 (regression): double-click on a plain text card still enters inline edit mode exactly as before AB4', editModeOk === true);

    await app.evalJs('document.querySelector(\'[data-box-id="ab4-text-regress-card"] .board-text-editing\').focus()');
    await app.typeKeys(' EDITED');
    await sleep(200);
    const committed = await app.evalJs("(window.wrizoBoard() || []).find(b => b.id === 'ab4-text-regress-card')?.text");
    ok('S4 (regression): the keystrokes commit exactly as before — no sliver/cascade interference', committed === 'Before edit EDITED', committed);

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

    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(150);
    const sliverShape = await app.evalJs(`(() => {
      const sections = document.querySelectorAll('.wz-sliver-body > .wz-sliver-section');
      const boardSection = [...sections].find(s => s.querySelector('.wz-sliver-item-btn, .wz-sliver-connect'));
      const buttons = boardSection ? boardSection.querySelectorAll('button') : [];
      return { sectionCount: sections.length, buttonCount: buttons.length, labels: [...buttons].map(b => b.textContent.trim()) };
    })()`);
    ok('S5: the board sliver carries EXACTLY its two hand tools (Add card, Connect toggle) and nothing else',
      sliverShape.sectionCount === 1 && sliverShape.buttonCount === 2, JSON.stringify(sliverShape));

    const boxesBeforeAdd = (await app.evalJs('window.wrizoBoard()')) || [];
    await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].find(b => b.textContent.trim() === 'Add card')?.click()");
    await sleep(200);
    const boxesAfterAdd = (await app.evalJs('window.wrizoBoard()')) || [];
    const editingNow = await app.evalJs("!!document.querySelector('.board-text-editing')");
    ok('S5: "Add card" adds a new blank text card and opens it straight into edit mode',
      boxesAfterAdd.length === boxesBeforeAdd.length + 1 && editingNow === true,
      JSON.stringify({ before: boxesBeforeAdd.length, after: boxesAfterAdd.length, editingNow }));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// Intentionally empty (see this file's own header comment on the park-sweep
// audit): no pre-existing check anywhere asserted the pre-AB4 state as a
// pass/fail condition, so nothing needed retiring into this gate. The
// scaffold exists (mirroring cd2.mjs's own armed-but-empty precedent) so a
// LATER ticket that falsifies one of THIS file's own checks has a
// documented home, matching every other harness file's own pattern.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nAB4 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of ab4.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nAB4 VERIFY: PASS (${checks.length} checks)` : `\nAB4 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
