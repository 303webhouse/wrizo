// ITEM 170 (P0) — OPENING A PAGE. Nick, verbatim: "the app currently has no
// clear or intuitive way of opening pages. Bug that needs to be fixed
// immediately."
// Run: node scripts/harness/item170.mjs   (from apps/desktop, dist-web built)
//
// THE RULING: the Page hand's list becomes THE way to open a page. Clicking a
// row opens it; placing on a board becomes the row's secondary act (its ⋯).
//
// S0 found the old list had FOUR faults, and this file holds each one shut
// separately, because a relabel alone would have fixed only the first:
//   1. clicking a row PLACED the page instead of opening it       -> S2, S3
//   2. the list existed ONLY on a board                           -> S1
//   3. it could not see `origin: 'loose'` pages — the kind New Page
//      and the Desk create — because it read getJournalPages()    -> S1
//   4. it capped at 30 BEFORE sorting, so A–Z ordered thirty pages
//      and the rest were unreachable                             -> S1
//
// DESIGNED SO EACH FAULT FAILS FOR ITS OWN REASON. The thirty-plus fillers are
// JOURNAL pages — the population the old list could see — so the cap check
// fails on the old code because of the cap, not because of the population
// fault. The loose page is the population check's own witness.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGE_STRIP = '.wz-strip-item[data-category="page"]';   // by NAME, never index (VW1)
const rowSel = (id) => `.wz-your-pages-row[data-page-id="${id}"]`;

const JOURNAL = { id: 'i170-journal', text: 'Journal note alpha', createdAt: '2026-05-01T00:00:00.000Z', origin: 'journal' };
const LOOSE = { id: 'i170-loose', text: 'Loose draft bravo', createdAt: '2026-05-02T00:00:00.000Z', origin: 'loose' };
const OLDEST = { id: 'i170-oldest', text: 'Aardvark oldest', createdAt: '2020-01-01T00:00:00.000Z', origin: 'journal' };
const BOARD = { id: 'i170-board', text: 'Placement board', createdAt: '2026-04-30T00:00:00.000Z',
  origin: 'loose', pageType: 'board', projectId: null, boxes: [] };
// Thirty-three fillers, one day apart from 2025-02-01: every one AFTER the
// oldest page and BEFORE the three named ones, so the old cap (newest 30)
// keeps the fillers and drops the oldest page.
const FILLERS = Array.from({ length: 33 }, (_, i) => ({
  id: `i170-f${String(i + 1).padStart(2, '0')}`,
  text: `Filler page ${String(i + 1).padStart(2, '0')}`,
  createdAt: new Date(Date.UTC(2025, 1, 1) + i * 86400000).toISOString(),
  origin: 'journal',
}));
const ALL_PAGES = [OLDEST, ...FILLERS, JOURNAL, LOOSE];   // every non-board page seeded

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

// Seeded THROUGH THE SEAM (item 129) and read only after the flush lands.
const seedAll = async (app, rows) => {
  await app.evalJs(`(() => { ${rows.map(r => `window.wrizoCreateJournalPage(${JSON.stringify(r)});`).join('\n')} })()`);
  const ids = rows.map(r => r.id);
  for (let i = 0; i < 80; i += 1) {
    const landed = await app.evalJs(`(() => {
      const have = new Set(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').map(e => e.id));
      return ${JSON.stringify(ids)}.every(id => have.has(id));
    })()`);
    if (landed) return true;
    await sleep(100);
  }
  return false;
};

// A driver that fails a check rather than killing the file. Scrolls the target
// into view FIRST: the list scrolls at its own max-height, and a real click at
// the coordinates of a row scrolled out of view would land on something else
// entirely and report whatever that something did.
const centreOf = (app, sel) => app.evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);

// REAL POINTER EVENTS (the standing probe law): the gesture under test is a
// writer clicking a row, so the check makes exactly that gesture.
const realClick = async (app, sel) => {
  const pt = await centreOf(app, sel);
  if (!pt) return false;
  await app.mouseDown(pt.x, pt.y);
  await app.mouseUp(pt.x, pt.y);
  await sleep(350);
  return true;
};

const openPageHand = async (app) => {
  const already = await app.evalJs("!!document.querySelector('.wz-your-pages')");
  if (already) return true;
  await realClick(app, PAGE_STRIP);
  for (let i = 0; i < 20; i += 1) {
    if (await app.evalJs("!!document.querySelector('.wz-your-pages')")) return true;
    await sleep(100);
  }
  return false;
};

const listState = (app) => app.evalJs(`(() => {
  const list = document.querySelector('.wz-your-pages');
  if (!list) return { present: false };
  const rows = [...list.querySelectorAll('.wz-your-pages-row')];
  return {
    present: true,
    heading: (list.querySelector('.wz-cascade-panel-title') || {}).textContent || null,
    ids: rows.map(r => r.getAttribute('data-page-id')),
    firstTitle: rows[0] ? (rows[0].querySelector('.wz-place-page-title') || {}).textContent : null,
    moreButtons: list.querySelectorAll('.wz-your-pages-more').length,
  };
})()`);

const where = (app) => app.evalJs(`({
  hash: location.hash,
  crumb: (document.querySelector('.crumb-here') || {}).textContent || null,
})`);

await withHarness(async (app) => {
  await freshDesk(app);
  const seeded = await seedAll(app, [...ALL_PAGES, BOARD]);
  ok('setup: 36 pages and one board are seeded through the seam and have landed', seeded);

  // ==========================================================================
  // S1 — ON A PAGE SURFACE, THE LIST EXISTS AND HOLDS EVERY PAGE.
  // ==========================================================================
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${LOOSE.id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page framed' });
  await sleep(600);

  const openedOnPage = await openPageHand(app);
  ok('S1 FAULT 2: on a PAGE surface the Page hand carries the list at all — before, it mounted only on a board, so a writer standing on a page had no list of pages anywhere in that hand',
    openedOnPage, String(openedOnPage));

  const onPage = await listState(app);
  ok('S1: the heading says what the list IS — "Your pages", not "Place page on board"',
    onPage.heading === 'Your pages', JSON.stringify({ heading: onPage.heading }));

  const listed = new Set(onPage.ids || []);
  ok('S1 FAULT 3: a LOOSE page is listed — the origin New Page and the Desk create, which getJournalPages() could never return, so the list most likely to be searched for a new page could not show it',
    listed.has(LOOSE.id) && listed.has(JOURNAL.id),
    JSON.stringify({ loose: listed.has(LOOSE.id), journal: listed.has(JOURNAL.id) }));

  ok('S1 FAULT 4: EVERY page is in the list — all 36, not the first 30 — because the old list capped before it sorted and anything past the thirtieth was unreachable by any sort',
    ALL_PAGES.every(p => listed.has(p.id)) && !listed.has(BOARD.id),
    JSON.stringify({ rows: (onPage.ids || []).length, expected: ALL_PAGES.length, boardListed: listed.has(BOARD.id) }));

  // A–Z must order ALL pages. 'Aardvark oldest' is the OLDEST page, so the old
  // cap (newest 30 first) dropped it before A–Z ever saw it.
  await app.evalJs(`[...document.querySelectorAll('.wz-your-pages .wz-page-setup-chip')].find(b => b.textContent.trim() === 'A–Z')?.click()`);
  await sleep(300);
  const az = await listState(app);
  ok('S1: sorted A–Z, the oldest page leads — sorting runs over every page, not over a capped slice of the newest',
    az.firstTitle === OLDEST.text, JSON.stringify({ firstTitle: az.firstTitle }));

  ok('S1: on a page there is no board to place onto, so the secondary act is ABSENT rather than present and inert',
    onPage.moreButtons === 0, JSON.stringify({ moreButtons: onPage.moreButtons }));

  // ==========================================================================
  // S2 — FAULT 1, THE TICKET: CLICKING A ROW OPENS THE PAGE.
  // ==========================================================================
  const clickedRow = await realClick(app, `${rowSel(JOURNAL.id)} .wz-your-pages-open`);
  ok('S2 (setup): the Journal page\'s row has a real on-screen box to click', clickedRow);
  await sleep(500);
  const afterOpen = await where(app);
  ok('S2 THE TICKET: a REAL click on a row OPENS that page — the URL names it and the crumb names it',
    afterOpen.hash === `#/page/${JOURNAL.id}` && afterOpen.crumb === JOURNAL.text,
    JSON.stringify(afterOpen));

  // ==========================================================================
  // S3 — ON A BOARD: THE SAME LIST OPENS, AND THE ⋯ STILL PLACES.
  // ==========================================================================
  await app.evalJs(`location.hash = '#/page/${BOARD.id}'`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);
  const openedOnBoard = await openPageHand(app);
  const onBoard = await listState(app);
  ok('S3 (setup): on the board the same list is there, and every row carries its ⋯',
    openedOnBoard && onBoard.moreButtons === (onBoard.ids || []).length && onBoard.moreButtons > 0,
    JSON.stringify({ openedOnBoard, rows: (onBoard.ids || []).length, more: onBoard.moreButtons }));

  const moreClicked = await realClick(app, `${rowSel(LOOSE.id)} .wz-your-pages-more`);
  const menuUp = moreClicked && await app.evalJs(`!!document.querySelector('${rowSel(LOOSE.id)} .wz-your-pages-place')`);
  ok('S3: the ⋯ opens the row\'s secondary act, named by its own verb', menuUp, String(menuUp));

  if (menuUp) await realClick(app, `${rowSel(LOOSE.id)} .wz-your-pages-place`);
  await sleep(900);   // the pin writes through the store; read after the flush
  const placed = await app.evalJs(`(() => {
    const b = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === '${BOARD.id}');
    return { pinned: !!(b && (b.boxes || []).some(x => x.kind === 'page-pin' && x.entryId === '${LOOSE.id}')), hash: location.hash };
  })()`);
  ok('S3: "Place on this board" still PLACES — the loose page lands on the board as a card',
    placed.pinned === true, JSON.stringify(placed));
  ok('S3: and placing does NOT navigate — the writer stays on the board they were arranging',
    placed.hash === `#/page/${BOARD.id}`, JSON.stringify({ hash: placed.hash }));

  // The primary act works board-side too: the list means the same thing on
  // every surface.
  await openPageHand(app);
  await realClick(app, `${rowSel(JOURNAL.id)} .wz-your-pages-open`);
  await sleep(500);
  const fromBoard = await where(app);
  ok('S3: from the board, clicking a row\'s NAME opens that page — one list, one meaning, on every surface',
    fromBoard.hash === `#/page/${JOURNAL.id}` && fromBoard.crumb === JOURNAL.text, JSON.stringify(fromBoard));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM170 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM170 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
