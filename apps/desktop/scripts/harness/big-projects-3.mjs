// BIG PROJECTS STEP 3 - GRAFTS, THE SURFACES (docs/plans/big-projects.md step 3 + the graft-doors addendum; Nick approved the mockup
// cursor/graft-doors-mockup @ c4f34eb0; Fable cleared step 3 Oct 19 - Q10: a checked picker row is inert, the X in the list is the only way to
// ungraft). The store is proven browserless (scripts/big-projects-3-check.mjs); this is the doors, with real presses.
//
//   K1 the brass graft knob sits on a SELECTED card's right edge, mid-height - not on the resize corner - and tips "Drag to graft"; an
//      unselected card has none
//   K2 a knob drag released on another card makes the connection box; the writer stays on the board and the card is not resized
//   K3 a knob drag released on empty board makes nothing and NEVER resizes
//   K4 the corner square still resizes, and its double-press still enters connection mode (the old door stays)
//   K5 a knob drag released on a rail thumbnail makes a page link owned by the board (aBoxId = the card); the writer stays on the board
//   P1 on a PAGE, Grafts opens with "+ Graft..." on top; it opens the picker - a search field, then Cards / Pages / Boards from every place,
//      each with its place label, never the page itself; opening it moves nothing on the page
//   P2 the search filters as the writer types
//   P3 a press on a row makes exactly ONE record owned by the page and checks the row; a press on a checked row writes nothing
//   P4 on a BOARD with a card selected, the subject is the card: "Connected to <card>"; the picker leaves that card out; a pick is a record
//      owned by the board with aBoxId = the card
//   L1 a page's plan board is ONE folded row, "Plan board - N cards", the FIRST group under "Connected to <page>"
//   L2 opened, it lists the board's cards; the X (shown on hover) hides a card from this page - pageSettings.hiddenPlanCards holds its id,
//      N drops, the card is still on its board - and the Undo line brings it back
//   L3 a hidden card stays hidden after the writer types on the page and the app reloads
//   B1 a board's paired page is shown at the top of its Grafts, a plain row with no X
//   C1 a page opened from a board shows "Came from <board>" as the picker's FIRST row; opening wrote no link; pressing it grafts; the same
//      page opened by its address (no surface state) has no such row
//   E1 a page with nothing grafted shows only "+ Graft..." - no placeholder text
//   N1 (Fable's ruling 1, Oct 21) a pick in "+ Graft..." on a brand-new page CREATES the page with that one graft; typing then saves as ever
//   (ruling 3, Oct 21: P1's labels parked - a place label only for another place)
//
// Seeding goes through the app's seams (never raw storage); input is trusted CDP mouse and key events. Needs a box turn.
// Run: WS_BOX_TURN=<token> node scripts/harness/big-projects-3.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
let bp3P1Labels = null;   // P1's place labels, read on the default leg, re-asserted by its parked record (ruling 3)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
const centre = (r) => ({ x: Math.round(r.l + r.w / 2), y: Math.round(r.t + r.h / 2) });
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const glide = async (app, from, to, steps = 10) => { for (let i = 1; i <= steps; i += 1) { await app.mouseMove(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps)); await sleep(20); } };
const drag = async (app, from, to) => { await app.mouseMove(from.x, from.y); await mouse(app, 'mousePressed', from.x, from.y); await glide(app, from, to); await mouse(app, 'mouseReleased', to.x, to.y); await sleep(400); };
const dbl = async (app, x, y) => {
  await app.mouseMove(x, y);
  await mouse(app, 'mousePressed', x, y, { clickCount: 1 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 1 }); await sleep(60);
  await mouse(app, 'mousePressed', x, y, { clickCount: 2 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 2 }); await sleep(250);
};
// a node is LOOKED FOR, never assumed: a press on something missing is a named failure at the caller, not a crash
const pressSel = async (app, sel) => { const r = await R(app, sel); if (!r || r.w === 0) return false; const c = centre(r); await click(app, c.x, c.y); await sleep(350); return true; };
const cardRect = async (app, cardId, patience = 40) => { for (let i = 0; i < patience; i += 1) { const r = await R(app, `[data-box-id="${cardId}"]`); if (r && r.w > 0) return r; await sleep(150); } return null; };
const selectCard = async (app, cardId) => { const r = await cardRect(app, cardId); if (!r) return null; await click(app, Math.round(r.l + r.w * 0.3), Math.round(r.t + r.h * 0.3)); await sleep(500); return r; };
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(id)}) || null)`);
const linksOf = (app, id) => app.evalJs(`window.wrizoPageLinksOf(${JSON.stringify(id)})`);
const conns = async (app) => ((await app.evalJs('window.wrizoBoard()')) || []).filter((b) => b.kind === 'connection');
const hash = (app) => app.evalJs('location.hash');
const openGrafts = async (app) => {
  if (!(await app.evalJs("!!document.querySelector('#wz-tutor-tab-links')"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
  await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(500);
  return app.evalJs("!!document.querySelector('.wz-links-pane')");
};
const pickerRows = (app) => app.evalJs(`[...document.querySelectorAll('[data-graft-picker] [data-graft-pick]')].map((b) => ({ group: b.dataset.graftGroup, entry: b.dataset.graftEntry, box: b.dataset.graftBox || null,
  title: b.querySelector('.wz-graft-title')?.textContent, place: b.querySelector('.wz-graft-place')?.textContent ?? null, checked: b.getAttribute('aria-checked') }))`);
const pressPick = async (app, entryId, boxId) => pressSel(app, `[data-graft-picker] [data-graft-pick][data-graft-entry="${entryId}"]${boxId ? `[data-graft-box="${boxId}"]` : ':not([data-graft-box])'}`);
const openDrawers = async (app) => { await app.evalJs("(() => { const b = document.querySelector('.wz-strip-item[data-category=drawers]'); if (b && !b.classList.contains('active')) b.click(); })()"); await sleep(600); };
const tile = (app, entryId) => R(app, `.wz-drawers-tile[data-link-entry="${entryId}"]`);

// the fixture, through the seams: two Drawers (The Late Ferry, Short stories), the Journal, a board with two cards, a page with a plan board
const IDS = { ch2: 'bp3-ch2', ch3: 'bp3-ch3', kettle: 'bp3-kettle', salt: 'bp3-salt', map: 'bp3-map', plan: 'bp3-plan', ideas: 'bp3-ideas', bare: 'bp3-bare' };
const seed = async (app) => {
  await app.emulateDpr(1, 1600, 940);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateDrawer === 'function' && typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const ids = await app.evalJs(`(() => {
    const ferry = window.wrizoCreateDrawer('The Late Ferry'); const shorts = window.wrizoCreateDrawer('Short stories');
    const ms = window.wrizoCreateProject('Manuscript'); window.wrizoSetProjectDrawer(ms.id, ferry.id);
    const sh = window.wrizoCreateProject('Shorts'); window.wrizoSetProjectDrawer(sh.id, shorts.id);
    return { ms: ms.id, sh: sh.id };
  })()`);
  const now = () => new Date().toISOString();
  const rows = [
    { id: IDS.ch2, text: 'Ch 2\nNobody on the quay would say her name.', projectId: ids.ms },
    { id: IDS.ch3, text: 'Ch 3\nThe kettle clicks off and she still does not turn around.', projectId: ids.ms },
    { id: IDS.bare, text: 'A bare page\nNothing grafted here.', projectId: ids.ms },
    { id: IDS.kettle, text: 'Kettle notes', origin: 'journal' },
    { id: IDS.salt, text: 'Salt\nA short one.', projectId: ids.sh },
    { id: IDS.map, text: 'Chapter map', pageType: 'board', projectId: ids.ms, boxes: [
      { id: 'c1', kind: 'text', x: 0.08, y: 0.06, w: 0.2, h: 0.12, z: 1, text: 'Mara at the window' },
      { id: 'c2', kind: 'text', x: 0.5, y: 0.06, w: 0.2, h: 0.12, z: 2, text: 'The blue cup' } ] },
    { id: IDS.plan, text: 'Plan for Ch 3', pageType: 'board', projectId: ids.ms, boxes: [
      { id: 'p1', kind: 'text', x: 0.08, y: 0.06, w: 0.2, h: 0.12, z: 1, text: 'Cups at the sink' },
      { id: 'p2', kind: 'text', x: 0.4, y: 0.06, w: 0.2, h: 0.12, z: 2, text: 'The ferry light' },
      { id: 'p3', kind: 'text', x: 0.7, y: 0.06, w: 0.2, h: 0.12, z: 3, text: 'The ledger' } ] },
    { id: IDS.ideas, text: 'Story ideas', pageType: 'board', projectId: ids.sh, boxes: [] },
  ];
  // a real newline in the text: JSON.stringify writes it as \n, which the page's parser reads back as a newline (no hand escaping).
  // source: 'page' - these are authored pages (an ABSENT source is a raw capture); origin null unless the row says 'journal'
  for (const r of rows) await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ createdAt: now(), origin: null, source: 'page', ...r })})`);
  await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(IDS.ch3)}, { planBoardId: ${JSON.stringify(IDS.plan)} })`);
  await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(IDS.ch2)}, ${JSON.stringify(IDS.map)}, { display: true })`);
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(400);
  return ids;
};
const open = async (app, id, ready) => { await app.evalJs(`location.hash = '#/page/${id}'`); return waitSoft(app, ready, { label: `open ${id}`, timeout: 9000 }); };
const onBoard = (cardId) => `!!document.querySelector('.board-canvas [data-box-id="${cardId}"]')`;
const onPage = "!!document.querySelector('.forward-only-editor')";

await withHarness(async (app) => {
  const fx = await seed(app);
  ok('fixture: two Drawers with a binder each, the pages, the boards and the plan board, seeded through the seams', !!fx && !!fx.ms && !!fx.sh, JSON.stringify(fx));
  const titleOf = async (id) => (((await stored(app, id)) || {}).text || '').split('\n')[0];
  ok('fixture: the page titles came through the seam as two lines (the newline is real)', (await titleOf(IDS.ch3)) === 'Ch 3', await titleOf(IDS.ch3));

  // ================================================================== K - the knob
  if (!(await open(app, IDS.map, onBoard('c1')))) { ok('fixture: the board opened', false, await hash(app)); return; }
  await sleep(700);
  const c1 = await selectCard(app, 'c1');
  const knob = await R(app, '[data-box-id="c1"] .board-graft-knob');
  const corner = await R(app, '[data-box-id="c1"] .board-handle');
  const tip = await app.evalJs("document.querySelector('[data-box-id=\"c1\"] .board-graft-knob')?.getAttribute('title') ?? null");
  const c2Knob = await app.evalJs("!!document.querySelector('[data-box-id=\"c2\"] .board-graft-knob')");
  ok('K1: the graft knob sits on the SELECTED card\'s right edge at mid-height - apart from the resize corner - and tips "Drag to graft"; an unselected card has none',
    !!c1 && !!knob && !!corner && Math.abs(centre(knob).x - c1.r) <= 4 && Math.abs(centre(knob).y - (c1.t + c1.h / 2)) <= 4
      && Math.hypot(centre(knob).x - centre(corner).x, centre(knob).y - centre(corner).y) > 20 && tip === 'Drag to graft' && c2Knob === false,
    JSON.stringify({ c1, knob, corner, tip, c2Knob }));
  if (knob) {
    const c2 = await cardRect(app, 'c2');
    const size0 = { w: c1.w, h: c1.h };
    await drag(app, centre(knob), centre(c2));
    const cs = await conns(app); const c1After = await cardRect(app, 'c1');
    ok('K2: a knob drag released on another card makes the connection box; the writer stays on the board; the card is not resized',
      cs.some((c) => (c.connA === 'c1' && c.connB === 'c2') || (c.connA === 'c2' && c.connB === 'c1')) && (await hash(app)) === `#/page/${IDS.map}`
        && !!c1After && Math.abs(c1After.w - size0.w) < 1 && Math.abs(c1After.h - size0.h) < 1,
      JSON.stringify({ conns: cs.length, hash: await hash(app), c1After, size0 }));
    await sleep(1600);
    await selectCard(app, 'c1');
    const k3 = await R(app, '[data-box-id="c1"] .board-graft-knob');
    const before3 = (await conns(app)).length;
    const canvas = await R(app, '.board-canvas');
    if (k3 && canvas) {
      await drag(app, centre(k3), { x: Math.round(canvas.l + canvas.w * 0.5), y: Math.round(canvas.t + canvas.h * 0.7) });
      const c1k3 = await cardRect(app, 'c1');
      ok('K3: a knob drag released on empty board makes nothing and NEVER resizes the card',
        (await conns(app)).length === before3 && !!c1k3 && Math.abs(c1k3.w - size0.w) < 1 && Math.abs(c1k3.h - size0.h) < 1 && (await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed")) === 'false',
        JSON.stringify({ c1k3, size0 }));
    } else ok('K3 fixture: the knob is shown again on the reselected card', false, JSON.stringify({ k3, canvas }));
    await selectCard(app, 'c1');
    const h4 = await R(app, '[data-box-id="c1"] .board-handle');
    if (h4) {
      await drag(app, centre(h4), { x: centre(h4).x + 60, y: centre(h4).y + 30 });
      const c1k4 = await cardRect(app, 'c1');
      ok('K4: the corner square still RESIZES (the knob is a different hit target)', !!c1k4 && c1k4.w > size0.w + 20, JSON.stringify({ c1k4, size0 }));
      await selectCard(app, 'c1');
      const h4b = await R(app, '[data-box-id="c1"] .board-handle');
      if (h4b) { await dbl(app, centre(h4b).x, centre(h4b).y); }
      ok('K4: ...and its double-press still enters connection mode (the old door stays)', (await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed")) === 'true', '');
      await app.keyCombo('Escape'); await sleep(300);
    } else ok('K4 fixture: the corner square on the selected card', false, 'none');
    // K5 - the rail
    await openDrawers(app);
    const th = await tile(app, IDS.ideas);
    await selectCard(app, 'c1');
    const k5 = await R(app, '[data-box-id="c1"] .board-graft-knob');
    if (th && k5) {
      await drag(app, centre(k5), centre(th));
      await sleep(300);
      const l5 = (await linksOf(app, IDS.map)).filter((l) => l.bEntryId === IDS.ideas);
      ok('K5: a knob drag released on a rail thumbnail makes a page link owned by the board (aBoxId = the card); the writer stays on the board',
        l5.length === 1 && l5[0].aBoxId === 'c1' && (await hash(app)) === `#/page/${IDS.map}`, JSON.stringify({ l5, hash: await hash(app) }));
    } else ok('K5 fixture: a rail thumbnail for another board, and the knob on the selected card', false, JSON.stringify({ th, k5 }));
  } else ok('K2-K5 fixture: the knob exists to press', false, 'no knob');

  // ================================================================== P4 - a card subject on a board
  if (await open(app, IDS.map, onBoard('c1'))) {
    await sleep(600);
    await selectCard(app, 'c1');
    await openGrafts(app);
    const head = await app.evalJs("document.querySelector('[data-graft-connected]')?.textContent?.trim() ?? null");
    const opened = await pressSel(app, '[data-graft-add]');
    const rows = opened ? await pickerRows(app) : [];
    const before = (await linksOf(app, IDS.map)).length;
    const picked = opened && (await pressPick(app, IDS.kettle));
    const l4 = (await linksOf(app, IDS.map)).filter((l) => l.bEntryId === IDS.kettle);
    ok('P4: on a board with a card selected the subject is the CARD - "Connected to Mara at the window"; the picker leaves that card out; a pick is a record owned by the board with aBoxId = the card',
      head === 'Connected to Mara at the window' && rows.length > 0 && !rows.some((r) => r.entry === IDS.map && r.box === 'c1') && rows.some((r) => r.box === 'c2')
        && picked && l4.length === 1 && l4[0].aBoxId === 'c1' && (await linksOf(app, IDS.map)).length === before + 1,
      JSON.stringify({ head, n: rows.length, l4 }));
    await app.keyCombo('Escape'); await sleep(300);
  } else ok('P4 fixture: the board reopened', false, await hash(app));

  // ================================================================== P1-P3, L1-L3 - a page
  if (!(await open(app, IDS.ch3, onPage))) { ok('fixture: the page opened', false, await hash(app)); return; }
  await sleep(900);
  const paneOk = await openGrafts(app);
  ok('fixture: the right drawer\'s Grafts tab is open on the page', paneOk, '');
  const page0 = await R(app, '.forward-only-editor');
  const addTop = await app.evalJs("(() => { const p = document.querySelector('.wz-links-pane'); const a = p && p.querySelector('[data-graft-add]'); if (!a) return null; return { first: p.querySelector('button, [data-graft-plan], [data-graft-connected]') === a, text: a.textContent.trim() }; })()");
  const opened1 = await pressSel(app, '[data-graft-add]');
  const rows1 = opened1 ? await pickerRows(app) : [];
  const search = await app.evalJs("(() => { const s = document.querySelector('[data-graft-picker] [data-graft-search]'); return s ? { tag: s.tagName, ph: s.getAttribute('placeholder'), focused: document.activeElement === s } : null; })()");
  const lbl = (id) => (rows1.find((r) => r.entry === id && !r.box) || {}).place;
  ok('P1: "+ Graft..." is the top of Grafts on a page', !!addTop && addTop.first && /Graft/.test(addTop.text), JSON.stringify(addTop));
  // ---- PARKED - SUPERSEDED by Fable's ruling 3 (Oct 21): place labels appear ONLY on items from another Drawer or the Journal - a same-place row
  // (Ch 2, in The Late Ferry like Ch 3) carries none. Kept VERBATIM and no longer run; its parked record is below, its successor beside it.
  // ok('P1: it opens the picker - a search field (focused), then Cards / Pages / Boards from every place, each with its place label, never the page itself',
  //   opened1 && !!search && search.focused && rows1.some((r) => r.group === 'Cards') && rows1.some((r) => r.group === 'Pages') && rows1.some((r) => r.group === 'Boards')
  //     && lbl(IDS.ch2) === 'The Late Ferry' && lbl(IDS.salt) === 'Short stories' && lbl(IDS.kettle) === 'Journal' && !rows1.some((r) => r.entry === IDS.ch3),
  //   JSON.stringify({ search, n: rows1.length, ch2: lbl(IDS.ch2), salt: lbl(IDS.salt), kettle: lbl(IDS.kettle) }));
  bp3P1Labels = { ch2: lbl(IDS.ch2) ?? null, salt: lbl(IDS.salt) ?? null, kettle: lbl(IDS.kettle) ?? null };
  ok('P1 [ruling-3 successor]: it opens the picker - a search field (focused), then Cards / Pages / Boards from every place, never the page itself; a place label ONLY on a row from another place (Salt: Short stories, Kettle notes: Journal) and none on a same-place row (Ch 2)',
    opened1 && !!search && search.focused && rows1.some((r) => r.group === 'Cards') && rows1.some((r) => r.group === 'Pages') && rows1.some((r) => r.group === 'Boards')
      && lbl(IDS.ch2) === null && lbl(IDS.salt) === 'Short stories' && lbl(IDS.kettle) === 'Journal' && !rows1.some((r) => r.entry === IDS.ch3),
    JSON.stringify({ search, n: rows1.length, ch2: lbl(IDS.ch2), salt: lbl(IDS.salt), kettle: lbl(IDS.kettle) }));
  ok('P1: opening the picker moved nothing on the page (page primacy: the page rect is identical)', JSON.stringify(page0) === JSON.stringify(await R(app, '.forward-only-editor')), '');
  if (opened1 && search) {
    await app.typeKeys('salt'); await sleep(400);
    const rows2 = await pickerRows(app);
    ok('P2: the search filters as the writer types - "salt" leaves only Salt', rows2.length >= 1 && rows2.every((r) => /salt/i.test(r.title) || /salt/i.test(r.place || '')) && rows2.some((r) => r.entry === IDS.salt), JSON.stringify(rows2.map((r) => r.title)));
    const before3 = (await linksOf(app, IDS.ch3)).length;
    const p3 = await pressPick(app, IDS.salt);
    const after3 = await linksOf(app, IDS.ch3);
    const rowNow = (await pickerRows(app)).find((r) => r.entry === IDS.salt && !r.box);
    const p3b = await pressPick(app, IDS.salt);
    ok('P3: a press on a row makes exactly ONE record owned by the page and checks the row', p3 && after3.length === before3 + 1 && after3.some((l) => l.bEntryId === IDS.salt && l.aEntryId === IDS.ch3) && !!rowNow && rowNow.checked === 'true',
      JSON.stringify({ before3, after: after3.length, rowNow }));
    ok('P3: a press on a CHECKED row writes nothing (Q10: inert; the X in the list ungrafts)', p3b && (await linksOf(app, IDS.ch3)).length === after3.length, '');
    await app.keyCombo('Escape'); await sleep(300);
  }
  // L1-L2
  const order = await app.evalJs("(() => { const p = document.querySelector('.wz-links-pane'); if (!p) return null; const all = [...p.querySelectorAll('[data-graft-connected], [data-graft-plan], [data-graft-group]')]; return all.map((e) => e.hasAttribute('data-graft-connected') ? 'connected' : e.hasAttribute('data-graft-plan') ? 'plan' : 'group:' + e.dataset.graftGroup); })()");
  const planRow = await app.evalJs("(() => { const b = document.querySelector('[data-graft-plan]'); return b ? { text: b.textContent.replace(/\\s+/g, ' ').trim(), expanded: b.getAttribute('aria-expanded') } : null; })()");
  ok('L1: the plan board is ONE folded row, "Plan board · 3 cards", the FIRST group under "Connected to Ch 3"',
    !!planRow && /Plan board\s*·\s*3 cards/.test(planRow.text) && planRow.expanded === 'false' && Array.isArray(order) && order[0] === 'connected' && order[1] === 'plan',
    JSON.stringify({ planRow, order }));
  if (planRow) {
    await pressSel(app, '[data-graft-plan]');
    const cards = await app.evalJs("[...document.querySelectorAll('[data-graft-plan-card]')].map((r) => r.querySelector('.wz-graft-title')?.textContent)");
    const row2 = await R(app, '[data-graft-plan-card="p2"]');
    let hidOk = false;
    if (row2) {
      await app.mouseMove(centre(row2).x, centre(row2).y); await sleep(250);
      const xVis = await app.evalJs("(() => { const x = document.querySelector('[data-graft-plan-card=\"p2\"] [data-graft-hide]'); return x ? getComputedStyle(x).opacity : null; })()");
      hidOk = await pressSel(app, '[data-graft-plan-card="p2"] [data-graft-hide]');
      await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
      const s = await stored(app, IDS.ch3);
      const label = await app.evalJs("document.querySelector('[data-graft-plan]')?.textContent?.replace(/\\s+/g, ' ').trim() ?? null");
      const onBoardStill = ((await app.evalJs(`window.wrizoStoredBoxes(${JSON.stringify(IDS.plan)})`)) || []).some((b) => b.id === 'p2' && !b.deletedAt);
      const undo = await app.evalJs("document.querySelector('[data-graft-undo]')?.textContent?.replace(/\\s+/g, ' ').trim() ?? null");
      ok('L2: opened, the plan row lists the board\'s three cards; the X shows on hover', JSON.stringify(cards) === JSON.stringify(['Cups at the sink', 'The ferry light', 'The ledger']) && xVis !== null && Number(xVis) > 0.5, JSON.stringify({ cards, xVis }));
      ok('L2: the X HIDES the card from this page - hiddenPlanCards holds its id, N drops to 2, the card is still on its board - and an Undo line says so',
        hidOk && !!s && JSON.stringify((s.pageSettings || {}).hiddenPlanCards) === JSON.stringify(['p2']) && /2 cards/.test(label || '') && onBoardStill && /The ferry light hidden from this page/.test(undo || ''),
        JSON.stringify({ hidden: s && s.pageSettings && s.pageSettings.hiddenPlanCards, label, onBoardStill, undo }));
      await pressSel(app, '[data-graft-undo] button');
      await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
      const s2 = await stored(app, IDS.ch3);
      ok('L2: Undo brings it back (3 cards, nothing hidden)', !((s2.pageSettings || {}).hiddenPlanCards || []).includes('p2') && /3 cards/.test((await app.evalJs("document.querySelector('[data-graft-plan]')?.textContent ?? ''")) || ''), JSON.stringify(s2.pageSettings && s2.pageSettings.hiddenPlanCards));
      // L3 - hide again, type, reload
      await pressSel(app, '[data-graft-plan-card="p2"] [data-graft-hide]');
      const ed = await R(app, '.forward-only-editor');
      if (ed) { await click(app, Math.round(ed.l + ed.w * 0.5), Math.round(ed.t + 60)); await app.keyCombo('End'); await app.typeKeys(' more'); }
      await sleep(1600); await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
      await app.reload(); await waitSoft(app, onPage, { label: 'the page after a reload', timeout: 12000 }); await sleep(600);
      const s3 = await stored(app, IDS.ch3);
      ok('L3: a hidden card stays hidden after the writer types and the app reloads (no save path drops hiddenPlanCards)',
        JSON.stringify(((s3 || {}).pageSettings || {}).hiddenPlanCards) === JSON.stringify(['p2']) && /more/.test((s3 || {}).text || ''), JSON.stringify({ hidden: s3 && s3.pageSettings && s3.pageSettings.hiddenPlanCards, tail: ((s3 || {}).text || '').slice(-20) }));
    }
    if (!hidOk) ok('L2 fixture: the plan card row and its X', false, JSON.stringify({ row2 }));
  }

  // ================================================================== B1 - a board's paired page
  if (await open(app, IDS.plan, onBoard('p1'))) {
    await sleep(600);
    await openGrafts(app);
    const paired = await app.evalJs("(() => { const r = document.querySelector('[data-graft-paired]'); if (!r) return null; const p = document.querySelector('.wz-links-pane'); return { text: r.textContent.replace(/\\s+/g, ' ').trim(), x: !!r.querySelector('.wz-links-x, [data-graft-hide]'), first: [...p.querySelectorAll('[data-graft-paired], [data-graft-connected], [data-graft-group]')][0] === r }; })()");
    ok('B1: a board\'s paired page is shown at the TOP of its Grafts - a plain row naming Ch 3, with no X', !!paired && /Ch 3/.test(paired.text) && paired.x === false && paired.first, JSON.stringify(paired));
  } else ok('B1 fixture: the plan board opened', false, await hash(app));

  // ================================================================== C1 - came from
  if (await open(app, IDS.map, onBoard('c1'))) {
    await sleep(600);
    const pin = ((await app.evalJs('window.wrizoBoard()')) || []).find((b) => b.kind === 'page-pin' && b.entryId === IDS.ch2);
    const pr = pin ? await cardRect(app, pin.id) : null;
    const linksBefore = (await linksOf(app, IDS.ch2)).length;
    if (pr) {
      await dbl(app, centre(pr).x, centre(pr).y);
      const there = await waitSoft(app, `location.hash === '#/page/${IDS.ch2}'`, { label: 'Ch 2 opened from the board', timeout: 9000 });
      await sleep(700);
      await openGrafts(app);
      const wrote = (await linksOf(app, IDS.ch2)).length !== linksBefore;
      await pressSel(app, '[data-graft-add]');
      const came = await app.evalJs("(() => { const p = document.querySelector('[data-graft-picker]'); if (!p) return null; const c = p.querySelector('[data-graft-came]'); const firstRow = p.querySelector('[data-graft-came], [data-graft-pick]'); return c ? { text: c.textContent.replace(/\\s+/g, ' ').trim(), first: firstRow === c } : { text: null }; })()");
      ok('C1: a page opened from a board shows "Came from Chapter map" as the picker\'s FIRST row, and opening it wrote no link',
        there && !!came && /Came from\s*Chapter map/i.test(came.text || '') && came.first === true && !wrote, JSON.stringify({ there, came, wrote }));
      const pressed = await pressSel(app, '[data-graft-picker] [data-graft-came]');
      const l = await linksOf(app, IDS.ch2);
      ok('C1: pressing it grafts - one record owned by the page, to the board', pressed && l.length === linksBefore + 1 && l.some((x) => x.bEntryId === IDS.map && !x.bBoxId), JSON.stringify(l));
      await app.keyCombo('Escape'); await sleep(300);
      // the same page opened another way - by its address, with no surface state (the HashRouter keeps history state across a reload, so a
      // reload is NOT that case: the plan's "a reload that has lost the state" is conditional, and the Back chip relies on it surviving)
      await app.evalJs("location.hash = '#/'"); await sleep(500);
      await open(app, IDS.ch2, onPage); await sleep(600);
      await openGrafts(app); await pressSel(app, '[data-graft-add]');
      const came2 = await app.evalJs("!!document.querySelector('[data-graft-picker] [data-graft-came]')");
      ok('C1: the same page opened by its address (no surface state) shows no "Came from" row', came2 === false, '');
      await app.keyCombo('Escape'); await sleep(300);
    } else ok('C1 fixture: the pin card for Ch 2 on the board', false, JSON.stringify(pin || null));
  } else ok('C1 fixture: the board reopened', false, await hash(app));

  // ================================================================== E1 - nothing grafted
  if (await open(app, IDS.bare, onPage)) {
    await sleep(700);
    await openGrafts(app);
    const pane = await app.evalJs("(() => { const p = document.querySelector('.wz-links-pane'); if (!p) return null; return { text: p.innerText.replace(/\\s+/g, ' ').trim(), empties: p.querySelectorAll('.wz-tutor-empty').length, add: !!p.querySelector('[data-graft-add]') }; })()");
    ok('E1: a page with nothing grafted shows only "+ Graft..." - no placeholder text', !!pane && pane.add && pane.empties === 0 && /^\+?\s*Graft…?$/.test(pane.text.replace(/^Grafts\s*/, '')), JSON.stringify(pane));
  } else ok('E1 fixture: the bare page opened', false, await hash(app));

  // ================================================================== N1 - a pick on a BRAND-NEW page creates it (Fable's ruling 1, Oct 21)
  await app.evalJs("location.hash = '#/'"); await sleep(400);
  await app.evalJs("location.hash = '#/page/new'");
  if (await waitSoft(app, onPage, { label: 'a brand-new page', timeout: 9000 })) {
    await sleep(700);
    const unbornBefore = await hash(app);
    await openGrafts(app);
    const enabled = await app.evalJs("(() => { const a = document.querySelector('[data-graft-add]'); return a ? !a.disabled : null; })()");
    const opened = enabled && (await pressSel(app, '[data-graft-add]'));
    const picked = opened && (await pressPick(app, IDS.kettle));
    await sleep(400);
    const bornHash = await hash(app);
    const newId = /^#\/page\/([^/?#]+)$/.exec(bornHash || '')?.[1] ?? null;
    await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
    const row = newId && newId !== 'new' ? await stored(app, newId) : null;
    const links = newId && newId !== 'new' ? await linksOf(app, newId) : [];
    ok('N1: a pick in "+ Graft..." on a brand-new page CREATES the page - its row is stored (no words yet) and owns exactly ONE record, to the pick; the address names the page',
      unbornBefore === '#/page/new' && enabled === true && picked && !!row && !(row.text || '').trim() && links.length === 1 && links[0].bEntryId === IDS.kettle,
      JSON.stringify({ unbornBefore, enabled, picked, bornHash, row: row && { id: row.id, text: row.text }, links }));
    await app.keyCombo('Escape'); await sleep(300);
    const ed = await R(app, '.forward-only-editor');
    if (ed && row) {
      await click(app, Math.round(ed.l + ed.w * 0.5), Math.round(ed.t + 60));
      await app.typeKeys('Born by a graft');
      await sleep(1600); await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
      const row2 = await stored(app, newId);
      ok('N1: typing then saves on that same page as ever (born-on-first-word is untouched; the words land on the row the graft made)',
        !!row2 && /Born by a graft/.test(row2.text || '') && (await linksOf(app, newId)).length === 1, JSON.stringify({ text: row2 && row2.text }));
    } else ok('N1 fixture: the editor on the new page, and its row', false, JSON.stringify({ ed, row: !!row }));
  } else ok('N1 fixture: a brand-new page opened at #/page/new', false, await hash(app));
});

// === PARKED - gated behind HARNESS_PARKED=1, skipped by default. One park: P1's labels (Fable's ruling 3, Oct 21). Its record re-asserts the new
// truth from the default leg's own reading.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass: !!pass, detail });
  pok('PARKED (was "P1: it opens the picker - a search field (focused), then Cards / Pages / Boards from every place, each with its place label, never the page itself") - ruling 3: a label only for another place; live successor: P1 [ruling-3 successor]',
    !!bp3P1Labels && bp3P1Labels.ch2 === null && bp3P1Labels.salt === 'Short stories' && bp3P1Labels.kettle === 'Journal', JSON.stringify(bp3P1Labels));
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  console.log(parkedPass
    ? `\nBIG-PROJECTS-3 PARKED: PASS (${parkedChecks.length} checks) - HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nBIG-PROJECTS-3 PARKED: FAIL - ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nBIG-PROJECTS-3 VERIFY: PASS (${checks.length} checks)` : `\nBIG-PROJECTS-3 VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
