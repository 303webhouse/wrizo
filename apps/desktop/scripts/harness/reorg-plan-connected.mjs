// CARDS FROM OTHER CONNECTED BOARDS IN THE PLAN (Fable, Nov 21, 12:35 am, ruling on FIX's queue item 5: "follow the Page's own board plus links. The Plan lists its own board's cards in their order, then each connected
// Board's (PageLink Board <-> Doc) cards as a group below, in that Board's order. A card may sit in two Plans (one card, two views). Re-ordering happens on its own board. Nothing new saved."). Nick, Nov 11.
// The Back menu's PLAN tab (reorg/backMenu/BackPlan.tsx, behind ?reorg=1, Machina) lists this Page's own board's rows as it always has. Below them, one GROUP per other board that is connected to this Page (the boards the
// Assets tab lists: a board linked whole, or a board holding a card linked to the Page), headed by the board's name with an Open door, its cards listed in THAT board's own order. A group's rows are a view: no move,
// indent or remove here (those are done on the board itself); each has the "-> Part" door and the tick, as the own rows do.
//
// The fixture (the app's own seams; WS_PLACE=1):
//   cn-1 / cn-2   two Pages, each with its own board (cn-own1: Alpha, Beta; cn-own2: Gamma)
//   cn-x          a Board linked WHOLE to cn-1 and to cn-2; its cards by seq: "X second" (seq 1), "X first" (seq 0), "X third" (seq 2)
//   cn-y          a Board holding a card linked to cn-1 ("Y linked"), and another card that is not ("Y other"); seq: Y other 0, Y linked 1
//   cn-z          a Board linked to nothing
//   C1  cn-1's Plan: its own rows first (Alpha, Beta, numbered 1, 2), then the group of cn-x then the group of cn-y; cn-z is not there
//   C2  a group is headed by its board's name with an Open door, and lists ALL its cards in that board's own order (cn-x: X first, X second, X third; cn-y: Y other, Y linked), not only the linked ones
//   C3  a group's rows are a view: no up, down, indent, outdent or remove, no rename field; each has the "-> Part" door
//   C4  one card, two views: cn-2's Plan also lists cn-x's three cards, and a re-order done on cn-x itself shows in both Plans
//   C5  nothing new is saved: looking at a Plan with connected groups writes nothing, and a group's card is not copied onto the Page's own board
//   C6  the door on a group's row opens a fresh Part for THAT card (the address names cn-x and the card); the empty-Plan line shows only when there is nothing at all (own rows and groups)
//   C7  with the switch off (Machina) and in Arbor with it on, no group is drawn
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-plan-connected.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 900)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const STORE = () => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return JSON.stringify(${ALL}); })()`;
const ENTRY = (id) => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return ${ALL}.find((x) => x.id === ${q(id)}) || null; })()`;
const OWN = "(() => [...document.querySelectorAll('[data-back-plan] > .wz-back-plan-list > [data-plan-row]')].map((r) => ({ id: r.dataset.planRow, num: r.querySelector('.wz-back-plan-num')?.textContent, name: (r.querySelector('[data-plan-name]')?.value ?? r.querySelector('[data-plan-name]')?.textContent) })))()";
const GROUPS = "(() => [...document.querySelectorAll('[data-back-plan] [data-plan-group]')].map((g) => ({ board: g.dataset.planGroup, head: (g.querySelector('[data-plan-group-name]') || {}).textContent, open: !!g.querySelector('[data-plan-group-open]'), rows: [...g.querySelectorAll('[data-plan-row]')].map((r) => ({ id: r.dataset.planRow, name: (r.querySelector('[data-plan-name]')?.value ?? r.querySelector('[data-plan-name]')?.textContent), editable: !!r.querySelector('input'), ctl: r.querySelectorAll('[data-plan-up],[data-plan-down],[data-plan-indent],[data-plan-outdent],[data-plan-remove]').length, door: !!r.querySelector('[data-plan-part]') })) })))()";

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`(() => {
    const W = window;
    const mk = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose', ...extra });
    mk('cn-own1', 'Own board one', { pageType: 'board', boxes: ${q([card('a1', 'Alpha', 0, 0.05), card('a2', 'Beta', 1, 0.2)])} });
    mk('cn-own2', 'Own board two', { pageType: 'board', boxes: ${q([card('g1', 'Gamma', 0, 0.05)])} });
    mk('cn-x', 'X board', { pageType: 'board', boxes: ${q([card('x2', 'X second', 1, 0.2), card('x1', 'X first', 0, 0.05), card('x3', 'X third', 2, 0.35)])} });
    mk('cn-y', 'Y board', { pageType: 'board', boxes: ${q([card('y1', 'Y linked', 1, 0.2), card('y0', 'Y other', 0, 0.05)])} });
    mk('cn-z', 'Z board', { pageType: 'board', boxes: ${q([card('z1', 'Z card', 0, 0.05)])} });
    mk('cn-1', 'The first page', {});
    mk('cn-2', 'The second page', {});
    mk('cn-e', 'An empty page', {});
    W.wrizoPatchEntry('cn-1', { planBoardId: 'cn-own1' });
    W.wrizoPatchEntry('cn-2', { planBoardId: 'cn-own2' });
    W.wrizoAddPageLink('cn-1', { bEntryId: 'cn-x' });
    W.wrizoAddPageLink('cn-1', { bEntryId: 'cn-y', bBoxId: 'y1' });
    W.wrizoAddPageLink('cn-2', { bEntryId: 'cn-x' });
    W.wrizoFlushNow();
    return true;
  })()`);
}
async function openPage(app, id, { theme = 'machina', reorg = true } = {}) {
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const openDrawer = async (app) => {
  const open = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (!open) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
};
const planTab = async (app) => { await app.evalJs("document.getElementById('wz-tutor-tab-plan')?.click()"); await sleep(500); };
const click = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);
const names = (g) => (g ? g.rows.map((r) => r.name).join('|') : null);

await withHarness(async (app) => {
  await seed(app);

  // ---- C1 / C2 / C3 ----
  await openPage(app, 'cn-1'); await openDrawer(app); await planTab(app);
  const own = await app.evalJs(OWN);
  const groups = await app.evalJs(GROUPS);
  const gx = groups.find((g) => g.board === 'cn-x'), gy = groups.find((g) => g.board === 'cn-y');
  ok("C1 the Plan lists its own rows first (Alpha, Beta, numbered 1, 2), then the group of cn-x and the group of cn-y; the unconnected cn-z is not there",
    own.map((r) => `${r.num} ${r.name}`).join('|') === '1 Alpha|2 Beta' && groups.map((g) => g.board).join() === 'cn-x,cn-y', { own, groups: groups.map((g) => g.board) });
  ok("C2 a group is headed by its board's name with an Open door and lists ALL its cards in that board's own order (cn-x: first, second, third; cn-y: other, linked)",
    !!gx && !!gy && gx.head === 'X board' && gx.open && names(gx) === 'X first|X second|X third' && gy.head === 'Y board' && gy.open && names(gy) === 'Y other|Y linked', { gx, gy });
  ok('C3 a group\'s rows are a view: no up, down, indent, outdent or remove, no rename field; each has the "-> Part" door',
    !!gx && !!gy && [...gx.rows, ...gy.rows].every((r) => r.ctl === 0 && r.editable === false && r.door === true), { gx: gx && gx.rows.map((r) => [r.ctl, r.editable, r.door]) });

  // ---- C5 ----
  const before = await app.evalJs(STORE());
  await sleep(1200); await planTab(app); await sleep(500);
  const after = await app.evalJs(STORE());
  const ownBoard = await app.evalJs(ENTRY('cn-own1'));
  ok("C5 nothing new is saved: looking writes nothing, and a group's card is not copied onto the Page's own board (it still holds exactly Alpha and Beta)",
    before === after && ((ownBoard && ownBoard.boxes) || []).filter((b) => !b.deletedAt).map((b) => b.text).join('|') === 'Alpha|Beta', { same: before === after });

  // ---- C6 ----
  const x1 = await click(app, '[data-plan-group="cn-x"] [data-plan-row="x1"] [data-plan-part]');
  await app.waitFor("location.hash.indexOf('/page/new') >= 0", { timeout: 8000, label: 'a fresh page' }).catch(() => {});
  await sleep(700);
  const hash = await app.evalJs('location.hash');
  const hp = new URLSearchParams(hash.split('?')[1] || '');
  await openPage(app, 'cn-e'); await openDrawer(app); await planTab(app);
  const emptyLine = await app.evalJs("(document.querySelector('[data-back-plan-empty]') || {}).textContent || null");
  ok('C6 the door on a group\'s row opens a fresh Part for THAT card (the address names cn-x and x1); the empty-Plan line shows for a Page with nothing at all',
    x1 === true && hp.get('gb') === 'cn-x' && hp.get('gc') === 'x1' && emptyLine === "Nothing is in this doc's plan.", { hash, emptyLine });

  // ---- C4 ----
  await openPage(app, 'cn-2'); await openDrawer(app); await planTab(app);
  const g2 = (await app.evalJs(GROUPS)).find((g) => g.board === 'cn-x');
  // a re-order done on the board itself: X third becomes first
  await app.evalJs(`(() => { const e = ${ALL}.find((x) => x.id === 'cn-x'); const boxes = e.boxes.map((b) => (b.id === 'x3' ? { ...b, seq: -1, updatedAt: new Date().toISOString() } : b)); window.wrizoPatchEntry('cn-x', { boxes }); window.wrizoFlushNow(); return true; })()`);
  await openPage(app, 'cn-2'); await openDrawer(app); await planTab(app);
  const g2b = (await app.evalJs(GROUPS)).find((g) => g.board === 'cn-x');
  await openPage(app, 'cn-1'); await openDrawer(app); await planTab(app);
  const g1b = (await app.evalJs(GROUPS)).find((g) => g.board === 'cn-x');
  ok("C4 one card, two views: cn-2's Plan also lists cn-x's three cards, and a re-order done on cn-x itself (X third to the top) shows in both Plans",
    names(g2) === 'X first|X second|X third' && names(g2b) === 'X third|X first|X second' && names(g1b) === 'X third|X first|X second', { g2: names(g2), g2b: names(g2b), g1b: names(g1b) });

  // ---- C7 ----
  await openPage(app, 'cn-1', { reorg: false }); await openDrawer(app);
  const off = await app.evalJs("document.querySelectorAll('[data-plan-group]').length");
  await openPage(app, 'cn-1', { theme: 'arbor' }); await openDrawer(app);
  const arbor = await app.evalJs("document.querySelectorAll('[data-plan-group]').length");
  ok('C7 with the switch off (Machina) and in Arbor with it on, no group is drawn', off === 0 && arbor === 0, { off, arbor });
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-PLAN-CONNECTED VERIFY: PASS (${checks.length} checks)` : `\nREORG-PLAN-CONNECTED VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
