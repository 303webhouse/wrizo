// ITEM 160 — REMOVE LEAVES THE BOARD SURFACE (interim, ratified: Remove lives in the card's
// own popup until 168 lands). Run: node scripts/harness/item160.mjs (from apps/desktop,
// dist-web built).
//
// STATUS AT WRITING: BUILT, NOT RUN. The box grant did not name FIX; this file is the
// browserless half's own instrument and is proven against the old code only when a turn is
// announced (falsify FIRST: S1's geometry and S2's popup Remove must go red on old code).
//
// THE HARD LINE IS THE FIRST THING THIS FILE PROVES: never ship a build with no card
// deletion. So the claim is not "the button moved" but "Remove is REACHABLE BY A REAL POINTER
// for every kind of card" — a hand-typed card (in its popup), a ported card and a page-pin
// (in the action row). elementFromPoint at the button's centre must hit the button; a page
// -side .click() sails through chrome a real pointer cannot reach, which is exactly the
// failure this feature could produce (a Remove hung above the board and clipped away).
//
// THE GEOMETRY IS MEASURED, NOT ARGUED. The row used to be a normal-flow row with
// marginBottom:10, rendered whenever any card was selected, so selecting a card pushed the
// whole board down. The claim is that selecting ANY kind of card leaves the canvas wrap's rect
// byte-identical (S1).
//
// WHAT THIS FILE DOES NOT COVER, SAID UP FRONT: an ink stroke's Remove (j4.mjs reaches it
// through the seam), a grouped selection, and a system Board (b1/b2 assert the inert no-op
// through the same seam). Reachability of those by a real pointer is unmeasured here.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BOARD = 'i160-board';
const SOURCE = 'i160-source';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

// Seeded through the seam (item 129), never raw storage; read only after the flush lands.
const seed = async (app) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: SOURCE, text: 'Source page words', createdAt: '2026-06-01T00:00:00.000Z',
    origin: 'loose', pageType: 'page', projectId: null,
  })})`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: BOARD, text: 'Remove board', createdAt: '2026-06-01T00:00:01.000Z',
    origin: 'loose', pageType: 'board', projectId: null,
    boxes: [
      { id: 'h1', kind: 'text', x: 0.05, y: 0.08, w: 0.28, h: 0.14, z: 1, text: 'Hand typed one' },
      { id: 'h2', kind: 'text', x: 0.05, y: 0.30, w: 0.28, h: 0.14, z: 1, text: 'Hand typed two' },
      { id: 'p1', kind: 'text', sourceEntryId: SOURCE, x: 0.38, y: 0.08, w: 0.28, h: 0.14, z: 1, text: 'Ported card' },
      { id: 'n1', kind: 'page-pin', entryId: SOURCE, x: 0.70, y: 0.08, w: 0.26, h: 0.14, z: 1 },
    ],
  })})`);
  for (let i = 0; i < 60; i += 1) {
    if (await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === '${BOARD}')`)) return true;
    await sleep(100);
  }
  return false;
};

const openBoard = async (app) => {
  await app.evalJs(`location.hash = '#/page/${BOARD}'`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);
  return app.evalJs("['h1','h2','p1','n1'].map(id => !!document.querySelector('[data-box-id=\"' + id + '\"]'))");
};

const centerOf = (app, sel) => app.evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);

// A real pointer, moved first as a writer moves it. Returns false (never throws) if absent.
const realClickAt = async (app, pt) => {
  if (!pt) return false;
  await app.mouseMove(pt.x, pt.y);
  await sleep(60);
  await app.mouseDown(pt.x, pt.y);
  await app.mouseUp(pt.x, pt.y);
  await sleep(250);
  return true;
};
const realClick = async (app, sel) => realClickAt(app, await centerOf(app, sel));

// Would a real pointer at this element's centre actually land on it (or a child)?
const reachable = (app, sel) => app.evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return { present: false, hit: false };
  const r = el.getBoundingClientRect();
  const hitEl = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
  return { present: true, hit: !!hitEl && (hitEl === el || el.contains(hitEl)), w: Math.round(r.width), h: Math.round(r.height) };
})()`);

const canvasRect = (app) => app.evalJs(`(() => {
  const el = document.querySelector('.board-canvas-blur-wrap');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
})()`);

const ids = (app) => app.evalJs("(window.wrizoBoard ? window.wrizoBoard() : []).map(b => b.id)");
const storedIds = (app) => app.evalJs(`(() => {
  const b = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === '${BOARD}');
  return b ? (b.boxes || []).map(x => x.id) : null;
})()`);
const rowRemove = (app) => app.evalJs(`[...document.querySelectorAll('.board-action-row button')].some(b => b.textContent.trim() === 'Remove')`);

await withHarness(async (app) => {
  await freshDesk(app);
  ok('setup: the board, its four cards and the source page are seeded through the seam and landed', await seed(app));
  const there = await openBoard(app);
  ok('setup: all four cards (hand-typed x2, ported, page-pin) are on the canvas to act on', there.every(Boolean), JSON.stringify(there));

  // ==========================================================================
  // S1 — THE ROW NEVER SHIFTS THE BOARD, for ANY kind of card. Measured: the canvas wrap's
  // rect with nothing selected, then with each kind selected. It used to move by the row's
  // height + marginBottom the moment any card was selected.
  // ==========================================================================
  const none = await canvasRect(app);
  ok('S1 precondition: the canvas wrap has a measurable rect with nothing selected', !!none, JSON.stringify(none));
  for (const [kind, id] of [['hand-typed', 'h1'], ['ported', 'p1'], ['page-pin', 'n1']]) {
    const clicked = await realClick(app, `[data-box-id="${id}"]`);
    const sel = await app.evalJs(`document.querySelector('[data-box-id="${id}"]')?.dataset.selected`);
    const after = await canvasRect(app);
    ok(`S1 (${kind}): selecting the card leaves the board's rect byte-identical - the action row is an overlay, not a row in the flow`,
      clicked && sel === 'true' && JSON.stringify(after) === JSON.stringify(none),
      JSON.stringify({ clicked, selected: sel, none, after }));
  }

  // ==========================================================================
  // S2 — HAND-TYPED: Remove is in the card's own popup, and NOT in the row.
  // ==========================================================================
  await realClick(app, '[data-box-id="h1"]');
  ok('S2: a selected hand-typed card carries NO Remove in the action row - it is off the board surface (successor to fx7 S6\'s parked presence assertion)',
    (await rowRemove(app)) === false, String(await rowRemove(app)));
  const dbl = await centerOf(app, '[data-box-id="h1"]');
  if (dbl) await app.doubleClick(dbl.x, dbl.y);
  await sleep(500);
  const popupOpen = await app.evalJs("!!document.querySelector('.board-popup')");
  ok('S2 precondition: a real double-click opens the hand-typed card\'s popup', popupOpen === true, String(popupOpen));
  const popupRemove = await reachable(app, '.board-popup-remove');
  ok('S2 THE HARD LINE: the popup\'s Remove is REACHABLE BY A REAL POINTER - elementFromPoint at its centre lands on it (a page-side .click() would prove nothing)',
    popupRemove.present && popupRemove.hit, JSON.stringify(popupRemove));
  const clickedPopupRemove = popupRemove.present ? await realClick(app, '.board-popup-remove') : false;
  await sleep(300);
  const afterPopup = await ids(app);
  const popupStill = await app.evalJs("!!document.querySelector('.board-popup')");
  ok('S2: a real press on the popup\'s Remove deletes the card AND closes the popup',
    clickedPopupRemove && !afterPopup.includes('h1') && afterPopup.includes('h2') && popupStill === false,
    JSON.stringify({ clickedPopupRemove, afterPopup, popupStill }));

  // ==========================================================================
  // S3/S4 — PORTED and PAGE-PIN keep Remove in the row until 168; reachable, and it works.
  // The card leaves; the SOURCE PAGE stays (a card is a copy or a pointer, never the page).
  // ==========================================================================
  for (const [kind, id, label] of [['ported card', 'p1', 'S3'], ['page-pin', 'n1', 'S4']]) {
    await realClick(app, `[data-box-id="${id}"]`);
    const r = await reachable(app, '.board-action-row button');
    const isRemove = await rowRemove(app);
    ok(`${label} THE HARD LINE (${kind}): a selected ${kind} still has Remove in the row, and a REAL POINTER reaches it`,
      isRemove === true && r.present && r.hit, JSON.stringify({ isRemove, ...r }));
    const btnPt = await app.evalJs(`(() => {
      const b = [...document.querySelectorAll('.board-action-row button')].find(x => x.textContent.trim() === 'Remove');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`);
    const pressed = await realClickAt(app, btnPt);
    await sleep(300);
    const remaining = await ids(app);
    const sourceAlive = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === '${SOURCE}' && !e.deletedAt)`);
    ok(`${label} (${kind}): a real press on the row's Remove deletes the card and leaves the source page intact`,
      pressed && !remaining.includes(id) && sourceAlive === true, JSON.stringify({ pressed, remaining, sourceAlive }));
  }

  // ==========================================================================
  // S5 — THE SEAM IS DURABLE. wrizoBoard.removeSelected persists ITSELF: a box removal
  // otherwise reaches storage only through the 2000ms autosave, which durableSeam's flush at
  // call time would run BEFORE. Read storage IMMEDIATELY - no settle wait; that is the claim.
  // ==========================================================================
  const seamShape = await app.evalJs("({ fn: typeof window.wrizoBoard, rm: typeof (window.wrizoBoard && window.wrizoBoard.removeSelected), cards: (window.wrizoBoard() || []).length })");
  ok('S5 precondition: window.wrizoBoard is still callable for its cards AND carries removeSelected (every existing driver keeps working)',
    seamShape.fn === 'function' && seamShape.rm === 'function' && seamShape.cards > 0, JSON.stringify(seamShape));
  await realClick(app, '[data-box-id="h2"]');
  const seamResult = await app.evalJs('window.wrizoBoard.removeSelected()');
  const storedNow = await storedIds(app);
  ok('S5: the seam removes the selected card AND storage already reflects it the instant it returns - durable, not waiting on the 2000ms autosave',
    seamResult === true && Array.isArray(storedNow) && !storedNow.includes('h2'),
    JSON.stringify({ seamResult, storedNow }));
});

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  [' + c.detail + ']' : ''}`);
console.log(`\nITEM160 VERIFY: ${failed.length ? `FAIL — ${failed.length}/${checks.length} failed` : `PASS (${checks.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
