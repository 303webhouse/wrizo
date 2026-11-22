// DOCS' RECENT, LONG (POLISH; Fable, Nov 20, 12:15 pm: "long DOCS lists (Recent) show five with a scrollbar and a sort"; 1:27 pm: "Recent
// capped at 5"). Machina only, behind ?reorg=1. The rail's DOCS menu lists her recently changed Docs (up to 25, newest first) in a box five
// rows tall that scrolls past the fifth, with a thin scrollbar; a sort over the list reads Changed (the default), Name (A to Z) and Words (most
// first). The sort is the menu's own state while it is open: nothing is stored (a saved sort would be a new users.prefs key, Nick's word).
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and its app-made set): eight pages in Top
// Drawer's set, each a one-Part Doc, with distinct titles and word counts, then touched in a known order (rd-1 first, rd-8 last) through the
// app's own seam, so their changed order is a fact read back:
//   rd-1 Harbor notes for the second act (6)   rd-2 Apple (1)            rd-3 Margins of error and other stories told late (8)
//   rd-4 Zebra crossing at night (4)           rd-5 Chapter 10 begins (3) rd-6 Chapter 2 ends here today (5)
//   rd-7 Basement light (2)                    rd-8 Orchard rows planted in the dry spring of that year (10)
// The open page is rd-1.
//
// LIST   R1  Recent lists more than three Docs: the fixture's eight lead it, newest first (rd-8 ... rd-1), at most 25 rows
// BOX    R2  the list's box is five rows tall (its height is the first five rows' own, within a pixel), it scrolls (overflow auto, more below),
//            its scrollbar is thin, and the sixth row starts at the box's foot
//        R3  scrolled to its end, the last row sits inside the box
// SORT   R4  the sort reads Changed, Name, Words (lexicon words), Changed pressed when the menu opens
//        R5  Name: the rows read A to Z by title, numbers as numbers (Chapter 2 before Chapter 10); the fixture's eight in that order
//        R6  Words: the rows read most words first; the fixture's eight in that order
//        R7  Changed again restores the newest-first order; the box is still five rows tall; nothing stored changed across the three presses
//        R8  a row of a sorted list still opens its Doc, a departure with the return chip
//        R9  closing DOCS and opening it again starts on Changed (nothing kept)
// WORDS  W1  the sort's words are lexicon keys in canonical/chrome.ts, and DocsPanel.tsx writes none of them itself
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-docs-recent.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

const FIX = [
  ['rd-1', 'Harbor notes for the second act'],
  ['rd-2', 'Apple'],
  ['rd-3', 'Margins of error and other stories told late'],
  ['rd-4', 'Zebra crossing at night'],
  ['rd-5', 'Chapter 10 begins'],
  ['rd-6', 'Chapter 2 ends here today'],
  ['rd-7', 'Basement light'],
  ['rd-8', 'Orchard rows planted in the dry spring of that year'],
];
const FIX_IDS = FIX.map((f) => f[0]);
const BY_CHANGED = ['rd-8', 'rd-7', 'rd-6', 'rd-5', 'rd-4', 'rd-3', 'rd-2', 'rd-1'];
const BY_NAME = ['rd-2', 'rd-7', 'rd-6', 'rd-5', 'rd-1', 'rd-3', 'rd-8', 'rd-4'];
const BY_WORDS = ['rd-8', 'rd-3', 'rd-1', 'rd-6', 'rd-4', 'rd-5', 'rd-7', 'rd-2'];
const STORE = "JSON.stringify([localStorage, sessionStorage].map((s) => Object.keys(s).sort().map((k) => [k, s.getItem(k)])))";
const DOCS_OPEN = "!!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-docs')";
const RECENT = `(() => {
  const g = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-docs [data-reorg-group="recent"]');
  if (!g) return null;
  const ul = g.querySelector('ul');
  const lis = ul ? [...ul.querySelectorAll(':scope > li')] : [];
  const r = ul ? ul.getBoundingClientRect() : null;
  const cs = ul ? getComputedStyle(ul) : null;
  const sort = [...g.querySelectorAll('[data-recent-sort] [data-sort]')].map((b) => [b.getAttribute('data-sort'), (b.textContent || '').trim(), b.getAttribute('aria-pressed')]);
  return {
    rows: lis.map((li) => { const t = li.querySelector('.wz-reorg-list-title'), m = li.querySelector('.wz-reorg-row-meta'), lr = li.getBoundingClientRect();
      const words = m ? Number(((m.textContent || '').split('·').pop() || '').replace(/[^0-9]/g, '')) : null;
      return { id: li.getAttribute('data-entry-id'), title: t ? (t.textContent || '').trim() : null, words, top: lr.top, bottom: lr.bottom, h: lr.height }; }),
    box: r ? { top: r.top, bottom: r.bottom, h: r.height, client: ul.clientHeight, scroll: ul.scrollHeight, top0: ul.scrollTop, oy: cs.overflowY, sw: cs.scrollbarWidth } : null,
    sort,
  };
})()`;
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const near = (a, b, tol = 1.01) => Math.abs(a - b) <= tol;
const only = (rows, set) => rows.map((r) => r.id).filter((id) => set.includes(id));
const fiveTall = (d) => !!d && !!d.box && d.rows.length > 5 && near(d.box.h, d.rows[5].top - d.rows[0].top, 1.5);

let topSet = null;
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  topSet = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return p && p.id; })()");
  await app.evalJs(`(() => {
    const W = window;
    ${q(FIX)}.forEach(([id, text], i) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + i + '.000Z', source: 'page', origin: 'project', projectId: ${q(topSet)}, orderIndex: i }));
    W.wrizoFlushNow();
    return null;
  })()`);
}

async function openPage(app, id) {
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('[data-reorg-rail]') && !!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function openDocs(app) {
  if (!(await app.evalJs(DOCS_OPEN))) await app.evalJs(click('[data-reorg-rail] [data-category="reorg-docs"]'));
  await app.waitFor(DOCS_OPEN, { label: 'DOCS open', timeout: 4000 }).catch(() => {});
  await sleep(700);
  return app.evalJs(RECENT);
}
async function sortBy(app, key) {
  await app.evalJs(click(`.wz-reorg-docs [data-recent-sort] [data-sort="${key}"]`));
  await sleep(400);
  return app.evalJs(RECENT);
}

await withHarness(async (app) => {
  await seed(app);
  await openPage(app, 'rd-1');
  // the open page re-saves itself ~1.1 s after it mounts: the touch comes after it settles, with no reload after it (reorg-rails D2's order)
  await sleep(2500);
  const touched = await app.evalJs(`(() => { const out = window.wrizoTouchInOrder ? window.wrizoTouchInOrder(${q(FIX_IDS)}) : []; return out.filter(Boolean).length; })()`);
  await sleep(300);

  const d1 = await openDocs(app);
  ok('R1: Recent lists more than three Docs: the fixture\'s eight lead it, newest first (rd-8 ... rd-1), and it holds at most 25 rows',
    touched === 8 && !!d1 && d1.rows.length >= 8 && d1.rows.length <= 25 && JSON.stringify(d1.rows.slice(0, 8).map((r) => r.id)) === q(BY_CHANGED),
    { touched, rows: d1 && d1.rows.map((r) => r.id) });
  ok('R2: the list\'s box is five rows tall (the first five rows\' own height, within a pixel), it scrolls (overflow auto, more below), its scrollbar is thin, and the sixth row starts at the box\'s foot',
    fiveTall(d1) && d1.box.oy === 'auto' && d1.box.scroll > d1.box.client + 10 && d1.box.sw === 'thin' && d1.box.top0 === 0 && near(d1.rows[0].top, d1.box.top, 1.5) && near(d1.rows[5].top, d1.box.bottom, 1.5),
    { box: d1 && d1.box, tops: d1 && d1.rows.slice(0, 7).map((r) => Math.round(r.top * 10) / 10) });
  await app.evalJs("(() => { const ul = document.querySelector('.wz-reorg-docs [data-reorg-group=\"recent\"] ul'); if (ul) ul.scrollTop = ul.scrollHeight; return null; })()");
  await sleep(300);
  const d3 = await app.evalJs(RECENT);
  const last = d3 && d3.rows[d3.rows.length - 1];
  ok('R3: scrolled to its end, the last row sits inside the box', !!d3 && !!d3.box && !!last && d3.box.top0 > 0 && last.bottom <= d3.box.bottom + 1.5 && last.top >= d3.box.top - 1.5,
    { box: d3 && d3.box, last });
  await app.evalJs("(() => { const ul = document.querySelector('.wz-reorg-docs [data-reorg-group=\"recent\"] ul'); if (ul) ul.scrollTop = 0; return null; })()");

  ok('R4: the sort reads Changed, Name, Words (lexicon words), Changed pressed when the menu opens',
    !!d1 && JSON.stringify(d1.sort) === q([['changed', 'Changed', 'true'], ['name', 'Name', 'false'], ['words', 'Words', 'false']]), { sort: d1 && d1.sort });

  const before = await app.evalJs(STORE);
  const dn = await sortBy(app, 'name');
  const titles = dn ? dn.rows.map((r) => r.title) : [];
  const aToZ = titles.every((t, i) => i === 0 || titles[i - 1].localeCompare(t, undefined, { numeric: true, sensitivity: 'base' }) <= 0);
  ok('R5: Name - the rows read A to Z by title, numbers as numbers (Chapter 2 before Chapter 10); the fixture\'s eight in that order',
    !!dn && aToZ && JSON.stringify(only(dn.rows, FIX_IDS)) === q(BY_NAME) && dn.sort.find((s) => s[0] === 'name')?.[2] === 'true', { titles, order: dn && only(dn.rows, FIX_IDS), sort: dn && dn.sort });
  const dw = await sortBy(app, 'words');
  const counts = dw ? dw.rows.map((r) => r.words) : [];
  ok('R6: Words - the rows read most words first; the fixture\'s eight in that order',
    !!dw && counts.every((c, i) => Number.isFinite(c) && (i === 0 || counts[i - 1] >= c)) && JSON.stringify(only(dw.rows, FIX_IDS)) === q(BY_WORDS) && dw.sort.find((s) => s[0] === 'words')?.[2] === 'true',
    { counts, order: dw && only(dw.rows, FIX_IDS) });
  const dc = await sortBy(app, 'changed');
  const after = await app.evalJs(STORE);
  ok('R7: Changed again restores the newest-first order; the box is still five rows tall; nothing stored changed across the three presses',
    !!dc && JSON.stringify(dc.rows.slice(0, 8).map((r) => r.id)) === q(BY_CHANGED) && fiveTall(dc) && before === after,
    { order: dc && dc.rows.slice(0, 8).map((r) => r.id), same: before === after, box: dc && dc.box });

  // R9 before R8 (R8 leaves the page): closing DOCS and opening it again starts on Changed
  await sortBy(app, 'name');
  await app.evalJs(click('[data-reorg-rail] [data-category="reorg-docs"]'));
  await app.waitFor(`!(${DOCS_OPEN}) || document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel')?.getAttribute('data-visible') === 'false'`, { label: 'DOCS closed', timeout: 4000 }).catch(() => {});
  await sleep(600);
  const closed = await app.evalJs(`!(${DOCS_OPEN}) || document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel')?.getAttribute('data-visible') === 'false'`);
  await app.evalJs(click('[data-reorg-rail] [data-category="reorg-docs"]'));
  await app.waitFor(DOCS_OPEN, { label: 'DOCS open again', timeout: 4000 }).catch(() => {});
  await sleep(700);
  const d9 = await app.evalJs(RECENT);
  ok('R9: closing DOCS and opening it again starts on Changed (nothing kept)',
    closed && !!d9 && d9.sort.find((s) => s[0] === 'changed')?.[2] === 'true' && JSON.stringify(d9.rows.slice(0, 8).map((r) => r.id)) === q(BY_CHANGED), { closed, sort: d9 && d9.sort });

  await sortBy(app, 'name');
  await app.evalJs(click('.wz-reorg-docs [data-reorg-group="recent"] [data-entry-id="rd-4"] .wz-reorg-list-open'));
  await app.waitFor("location.hash === '#/page/rd-4' && !!document.querySelector('.forward-only-editor')", { label: 'the sorted row', timeout: 12000 }).catch(() => {});
  await sleep(900);
  const d8 = await app.evalJs("({ hash: location.hash, chip: !!document.querySelector('.wz-back-to-board') })");
  ok('R8: a row of a sorted list (Name) still opens its Doc, a departure with the return chip', d8.hash === '#/page/rd-4' && d8.chip, d8);

  const chrome = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const panel = fs.readFileSync(path.join(SRC, 'reorg', 'panels', 'DocsPanel.tsx'), 'utf8');
  const keys = [['reorgSortChanged', 'Changed'], ['reorgSortName', 'Name'], ['reorgSortWords', 'Words'], ['reorgRecentSort', null]];
  const declared = keys.map(([k, v]) => [k, new RegExp(`\\b${k}: '([^']*)'`).exec(chrome)?.[1] ?? null, v]);
  const used = keys.map(([k]) => panel.includes(`'${k}'`));
  const literal = /['">](Changed|Name|Words)['"<]/.test(panel);
  ok('W1: the sort\'s words are lexicon keys in canonical/chrome.ts, and DocsPanel.tsx writes none of them itself',
    declared.every(([, got, want]) => got != null && (want == null || got === want)) && used.every(Boolean) && !literal, { declared, used, literal });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 10;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nREORG-DOCS-RECENT VERIFY: PASS (${checks.length} checks)` : `\nREORG-DOCS-RECENT VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
