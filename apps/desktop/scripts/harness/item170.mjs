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
const rowSel = (id) => `.wz-open-pages-row[data-page-id="${id}"]`;

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

// WAKE THE CHROME BEFORE PRESSING IT, as a writer does.
//
// MEASURED, NOT GUESSED: after typing, the cascade rail keeps `opacity: 1` but
// takes `pointer-events: none`, and `document.elementFromPoint` at the strip
// centre returns the page stage rather than the strip. The writing posture
// makes the chrome LOOK present while it is inert to the pointer, so a real
// click lands on the page behind it. A page-side `.click()` would have sailed
// through and hidden the fact — which is the whole reason the standing law
// says to use real pointer events.
//
// A writer reaches for the menu by MOVING THE MOUSE first, which is what
// restores the chrome. So the driver moves, then presses.
const wakeChrome = async (app, sel) => {
  const pt = await centreOf(app, sel);
  if (!pt) return;
  await app.mouseMove(pt.x + 40, pt.y + 40);
  await app.mouseMove(pt.x, pt.y);
  await sleep(250);
};

const openPageHand = async (app) => {
  if (await app.evalJs("!!document.querySelector('.wz-open-pages')")) return true;
  await wakeChrome(app, PAGE_STRIP);
  await realClick(app, PAGE_STRIP);
  for (let i = 0; i < 20; i += 1) {
    if (await app.evalJs("!!document.querySelector('.wz-open-pages')")) return true;
    await sleep(100);
  }
  return false;
};

const listState = (app) => app.evalJs(`(() => {
  const list = document.querySelector('.wz-open-pages');
  if (!list) return { present: false };
  const rows = [...list.querySelectorAll('.wz-open-pages-row')];
  return {
    present: true,
    heading: (list.querySelector('.wz-cascade-panel-title') || {}).textContent || null,
    ids: rows.map(r => r.getAttribute('data-page-id')),
    firstTitle: rows[0] ? (rows[0].querySelector('.wz-place-page-title') || {}).textContent : null,
    moreButtons: list.querySelectorAll('.wz-open-pages-more').length,
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
  ok('S1: the section is named for what it does — "Open Pages", not "Place page on board"',
    onPage.heading === 'Open Pages', JSON.stringify({ heading: onPage.heading }));

  const listed = new Set(onPage.ids || []);
  ok('S1 FAULT 3: a LOOSE page is listed — the origin New Page and the Desk create, which getJournalPages() could never return, so the list most likely to be searched for a new page could not show it',
    listed.has(LOOSE.id) && listed.has(JOURNAL.id),
    JSON.stringify({ loose: listed.has(LOOSE.id), journal: listed.has(JOURNAL.id) }));

  // FAULT 4 IS ASSERTED OVER THE JOURNAL PAGES ONLY — the population the old
  // list COULD see. Asserting it over all 36 would let the loose page's absence
  // (fault 3) fail this check too, and then a check named for the cap would be
  // measuring the population fault. Each fault gets its own witness.
  const journalPages = ALL_PAGES.filter(p => p.origin === 'journal');
  ok('S1 FAULT 4: every one of the 35 JOURNAL pages is listed, the oldest included — the old list capped at 30 BEFORE sorting, so the five oldest were unreachable by any sort',
    journalPages.every(p => listed.has(p.id)) && !listed.has(BOARD.id),
    JSON.stringify({ journalListed: journalPages.filter(p => listed.has(p.id)).length, of: journalPages.length, oldestListed: listed.has(OLDEST.id), boardListed: listed.has(BOARD.id) }));

  // A–Z must order ALL pages. 'Aardvark oldest' is the OLDEST page, so the old
  // cap (newest 30 first) dropped it before A–Z ever saw it.
  await app.evalJs(`[...document.querySelectorAll('.wz-open-pages .wz-page-setup-chip')].find(b => b.textContent.trim() === 'A–Z')?.click()`);
  await sleep(300);
  const az = await listState(app);
  ok('S1: sorted A–Z, the oldest page leads — sorting runs over every page, not over a capped slice of the newest',
    az.firstTitle === OLDEST.text, JSON.stringify({ firstTitle: az.firstTitle }));

  ok('S1: on a page there is no board to place onto, so the secondary act is ABSENT rather than present and inert',
    onPage.moreButtons === 0, JSON.stringify({ moreButtons: onPage.moreButtons }));

  // ==========================================================================
  // S2 — FAULT 1, THE TICKET: CLICKING A ROW OPENS THE PAGE.
  // ==========================================================================
  const clickedRow = await realClick(app, `${rowSel(JOURNAL.id)} .wz-open-pages-open`);
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

  const moreClicked = await realClick(app, `${rowSel(LOOSE.id)} .wz-open-pages-more`);
  const menuUp = moreClicked && await app.evalJs(`!!document.querySelector('${rowSel(LOOSE.id)} .wz-open-pages-place')`);
  ok('S3: the ⋯ opens the row\'s secondary act, named by its own verb', menuUp, String(menuUp));

  if (menuUp) await realClick(app, `${rowSel(LOOSE.id)} .wz-open-pages-place`);
  await sleep(900);   // the pin writes through the store; read after the flush
  const placed = await app.evalJs(`(() => {
    const b = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === '${BOARD.id}');
    return { pinned: !!(b && (b.boxes || []).some(x => x.kind === 'page-pin' && x.entryId === '${LOOSE.id}')), hash: location.hash };
  })()`);
  ok('S3: "Place on this board" still PLACES — the loose page lands on the board as a card',
    placed.pinned === true, JSON.stringify(placed));
  // Asserted together with the placement, because "the URL did not move" is
  // trivially true when nothing was clicked at all — on the old code this line
  // passed with no list on screen. It must be unable to pass without a place.
  ok('S3: and placing does NOT navigate — the page lands on the board and the writer stays on the board they were arranging',
    placed.pinned === true && placed.hash === `#/page/${BOARD.id}`, JSON.stringify(placed));

  // The primary act works board-side too: the list means the same thing on
  // every surface.
  await openPageHand(app);
  await realClick(app, `${rowSel(JOURNAL.id)} .wz-open-pages-open`);
  await sleep(500);
  const fromBoard = await where(app);
  ok('S3: from the board, clicking a row\'s NAME opens that page — one list, one meaning, on every surface',
    fromBoard.hash === `#/page/${JOURNAL.id}` && fromBoard.crumb === JOURNAL.text, JSON.stringify(fromBoard));

  // ==========================================================================
  // S4 — THE MENU IS SEEN WHERE IT OPENS. Found by the SITTING, not by a check:
  // the first cut hung the menu below its row, and on the list's LAST row the
  // list's own overflow clipped it out of view — the ⋯ lit up as expanded and
  // nothing appeared. S3 passed through it, because realClick scrolls its
  // target into view first, which is precisely the move a writer would not
  // know to make. So this reads the geometry WITHOUT scrolling to the menu: the
  // writer's view, not the harness's.
  // ==========================================================================
  await app.evalJs(`location.hash = '#/page/${BOARD.id}'`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board again' });
  await sleep(700);
  await openPageHand(app);
  const lastId = await app.evalJs(`(() => {
    const list = document.querySelector('.wz-open-pages .wz-place-page-list');
    if (!list) return null;
    list.scrollTop = list.scrollHeight;   // the last row sits at the list's bottom edge
    const rows = list.querySelectorAll('.wz-open-pages-row');
    return rows.length ? rows[rows.length - 1].getAttribute('data-page-id') : null;
  })()`);
  await sleep(250);
  const lastMore = lastId ? await realClick(app, `${rowSel(lastId)} .wz-open-pages-more`) : false;
  const clip = await app.evalJs(`(() => {
    const list = document.querySelector('.wz-open-pages .wz-place-page-list');
    const m = document.querySelector('.wz-open-pages-menu');
    if (!list || !m) return { menu: !!m };
    const a = m.getBoundingClientRect(), b = list.getBoundingClientRect();
    return { menu: true, inside: a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5 && a.left >= b.left - 0.5 && a.right <= b.right + 0.5,
             menuTop: Math.round(a.top), menuBottom: Math.round(a.bottom), listTop: Math.round(b.top), listBottom: Math.round(b.bottom) };
  })()`);
  ok('S4 (from the SITTING): the menu of the LAST row opens fully inside the visible box of the list, read WITHOUT scrolling to it — the first cut opened it below the row, and the overflow of the list clipped it from view',
    lastMore && clip.menu === true && clip.inside === true, JSON.stringify({ lastId, ...clip }));

  await app.key('Escape');
  await sleep(250);
  const closed = await app.evalJs("!document.querySelector('.wz-open-pages-menu')");
  ok('S4: Escape dismisses the open menu — no stuck state that only a second press of the ⋯ could clear',
    closed === true, String(closed));

  // ==========================================================================
  // S5 — THE RE-SCOPE: OPEN PAGES shows three rows, orders by EDIT, and puts
  // starred pages first.
  //
  // RECENCY IS DRIVEN BY REALLY TYPING, not by a seed. `updatedAt` is
  // deliberately NOT seedable (persistence.ts says so in as many words: the
  // seam does not get a private clock the product does not have), so the only
  // honest way to test "last created OR EDITED" is to edit a page and watch it
  // move. That is also the better test: it exercises the stamp the product
  // actually writes.
  // ==========================================================================
  const sortBy = async (label) => {
    await app.evalJs(`[...document.querySelectorAll('.wz-open-pages .wz-page-setup-chip')].find(b => b.textContent.trim() === ${JSON.stringify(label)})?.click()`);
    await sleep(300);
  };

  // (a) the viewport: three rows visible, the rest reachable by scrolling.
  await app.evalJs(`location.hash = '#/page/${LOOSE.id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page again' });
  await sleep(600);
  await openPageHand(app);
  const viewport = await app.evalJs(`(() => {
    const list = document.querySelector('.wz-open-pages .wz-place-page-list');
    if (!list) return { list: false };
    const b = list.getBoundingClientRect();
    const rows = [...list.querySelectorAll('.wz-open-pages-row')];
    const whole = rows.filter(r => { const a = r.getBoundingClientRect(); return a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5; });
    return { list: true, wholeRows: whole.length, totalRows: rows.length, scrolls: list.scrollHeight > list.clientHeight + 1 };
  })()`);
  ok('S5: OPEN PAGES shows THREE rows and scrolls through the rest — a viewport, not a population cap, so no page is ever out of reach',
    viewport.list === true && viewport.wholeRows === 3 && viewport.scrolls === true && viewport.totalRows > 3,
    JSON.stringify(viewport));

  // (b) recency by EDIT: type into the OLDEST page and it comes to the top.
  await app.evalJs(`location.hash = '#/page/${OLDEST.id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'oldest page' });
  await sleep(600);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(' revised');
  await sleep(1200);   // the debounced flush lands before the probe reads
  await openPageHand(app);
  await sortBy('Date');
  const afterEdit = await listState(app);
  ok('S5: the last EDITED page leads the list, not the last created — a page written long ago and revised this morning is what a writer reaching for recent work means',
    (afterEdit.ids || [])[0] === OLDEST.id, JSON.stringify({ first: (afterEdit.ids || [])[0], expected: OLDEST.id }));

  // (c) starred first, under the same sort.
  await app.evalJs(`location.hash = '#/page/${JOURNAL.id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'journal page' });
  await sleep(600);
  await openPageHand(app);
  const starred = await realClick(app, '.wz-pageface-star');
  await sleep(700);
  await sortBy('Date');
  const afterStar = await listState(app);
  ok('S5: a STARRED page sorts first, above the most recently edited one — a star is the writer saying "this one", and an ordering that ignored it would make them say it twice',
    starred && (afterStar.ids || [])[0] === JOURNAL.id && (afterStar.ids || [])[1] === OLDEST.id,
    JSON.stringify({ first: (afterStar.ids || [])[0], second: (afterStar.ids || [])[1] }));
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
