// THE TEAM B RESTYLE, slice 3: THE ASSETS TAB AND THE SPLIT (Fable's 12:15 pm cut, Nov 20: "1F: the labels and the Open Beside icon; 1G (no
// Graphic icon yet); 1H; row 2's hidden scrollbars"; Nick, Nov 20: 1F '"Assets of this doc" becomes "Assets (11)"', '"Open Beside" becomes an
// icon: a split-screen icon with a ">"'; 1G '"BLOCK", "PDF" and the like become icons for the broad kinds'; 1H 'when the Assets tab first opens,
// only the Part she is in is open. Every other Part is closed'; row 2 'In the split, every scrollbar is hidden. Both sides still scroll'; the
// Wrizors: "Every icon keeps its words on hover and for screen readers"). Machina, ?reorg=1. Nothing here writes: it is the look of what exists.
//
// The fixture (seams only; WS_PLACE=1): a set "Novel", Parts wb-1..wb-3; wb-1's plan board wb-own (a1) and links to x1 (board wb-x) and the doc
// wb-q (three assets); wb-2 links the board wb-y whole (one asset); wb-3 none; wb-2 coloured slot d. She is on wb-1.
//
// HEAD   A1  the Assets tab's head reads "Assets (4)": every asset of the Doc's Parts
// PARTS  A2  one group per Part with assets, in the Doc's order (wb-1, wb-2; none for wb-3): wb-1's open (aria-expanded true) with its rows
//            (a1, x1, wb-q), wb-2's closed with none drawn; each head names its Part and its count, and wb-2's carries its tag "D"
//        A3  pressing wb-2's head opens it (the Y board's head drawn) and wb-1 stays open; opened again, the tab starts with only wb-1 open
// ICONS  A4  "Open Beside" is an icon (an svg, no visible word), its words on hover (title) and for a screen reader ("Open Beside: <title>")
//        A5  each row's kind is an icon with its word on hover and for a screen reader: Block for a card, Doc for a doc, Board for a board's
//            head; no Graphic
// SPLIT  H1  with a card open beside, every scroller on the stage (the page's own and the asset's side) has its scrollbar hidden
//            (scrollbar-width none), and both still scroll
// PAGE   P1  the page's rects and editor node are the same with the groups opened and closed
// WORDS  W1  every new word is a lexicon key, Machina's in Title Case
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-b-assets.mjs
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
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const LONG = Array.from({ length: 160 }, (_, i) => `Line ${i + 1} of a long first chapter, written to make the page scroll.`).join('\n');
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const txt = (el) => `((${el})?.textContent || '').replace(/\\s+/g, ' ').trim()`;

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  return app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction');
    const novel = W.wrizoCreateProject('Novel'); W.wrizoSetProjectDrawer(novel.id, drawer.id);
    page('wb-own', 'Own board', { origin: 'loose', pageType: 'board', boxes: ${q([card('a1', 'Alpha', 0, 0.05)])} });
    page('wb-x', 'X board', { origin: 'loose', pageType: 'board', boxes: ${q([card('x1', LONG, 0, 0.05)])} });
    page('wb-y', 'Y board', { origin: 'loose', pageType: 'board', boxes: [] });
    page('wb-q', 'A linked doc', { origin: 'loose' });
    page('wb-1', ${q('Chapter one\n' + LONG)}, { origin: 'project', projectId: novel.id, orderIndex: 0 });
    page('wb-2', 'Chapter two', { origin: 'project', projectId: novel.id, orderIndex: 1 });
    page('wb-3', 'Chapter three', { origin: 'project', projectId: novel.id, orderIndex: 2 });
    W.wrizoPatchEntry('wb-1', { planBoardId: 'wb-own' });
    const l1 = W.wrizoAddPageLink('wb-1', { bEntryId: 'wb-x', bBoxId: 'x1' });
    const l2 = W.wrizoAddPageLink('wb-1', { bEntryId: 'wb-q' });
    const l3 = W.wrizoAddPageLink('wb-2', { bEntryId: 'wb-y' });
    const P = W.wrizoParts; const coloured = !!P && P.setPartColor('wb-2', 'd');
    W.wrizoFlushNow();
    return { links: !!(l1 && l2 && l3), coloured };
  })()`);
}

async function openBuild(app, id) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.waitFor("document.querySelector('.reorg-top [data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'BUILD' }).catch(() => {});
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-tutor-tab-links')?.click(); null"); await sleep(400);
}
const GROUPS = `(() => [...document.querySelectorAll('[data-assets-part]')].map((g) => { const h = g.querySelector('[data-assets-part-toggle]');
  return { id: g.getAttribute('data-assets-part'), expanded: h ? h.getAttribute('aria-expanded') : null, name: ${txt("g.querySelector('.wz-back-part-name')")},
    count: ${txt("g.querySelector('.wz-back-part-count')")}, tag: ${txt("g.querySelector('.wz-back-part-head [data-colour-slot]')")},
    rows: [...g.querySelectorAll('[data-back-asset]')].map((r) => r.getAttribute('data-graft-box') || r.getAttribute('data-graft-entry')),
    heads: [...g.querySelectorAll('[data-back-board]')].map((b) => b.getAttribute('data-back-board')) }; }))()`;

await withHarness(async (app) => {
  const ids = await seed(app);
  await openBuild(app, 'wb-1');

  const head = await app.evalJs(txt("document.querySelector('[data-back-assets-head]')"));
  ok('A1 the Assets tab\'s head reads "Assets (4)": every asset of the Doc\'s Parts', ids.links && head === 'Assets (4)', { ids, head });

  const g0 = await app.evalJs(GROUPS);
  const w1 = g0.find((g) => g.id === 'wb-1'), w2 = g0.find((g) => g.id === 'wb-2');
  ok('A2 one group per Part with assets, in order (wb-1, wb-2): wb-1 open with a1, x1, wb-q; wb-2 closed, none drawn; heads name the Part and its count; wb-2 wears "D"',
    g0.map((g) => g.id).join(',') === 'wb-1,wb-2' && !!w1 && w1.expanded === 'true' && ['a1', 'x1', 'wb-q'].every((r) => w1.rows.includes(r))
      && !!w2 && w2.expanded === 'false' && w2.rows.length === 0 && w2.heads.length === 0 && /Chapter one/.test(w1.name) && w1.count === '3' && /Chapter two/.test(w2.name) && w2.count === '1'
      && ids.coloured && w2.tag === 'D', g0);

  const r0 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__baMark = 1; return null; })()");
  await app.evalJs("document.querySelector('[data-assets-part=\"wb-2\"] [data-assets-part-toggle]')?.click(); null"); await sleep(350);
  const g1 = await app.evalJs(GROUPS);
  const r1 = await app.evalJs(PAGE);
  await app.evalJs("document.querySelector('[data-assets-part=\"wb-1\"] [data-assets-part-toggle]')?.click(); null"); await sleep(350);
  const r2 = await app.evalJs(PAGE);
  const same = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__baMark");
  await app.evalJs("document.getElementById('wz-tutor-tab-tutor')?.click(); null"); await sleep(300);
  await app.evalJs("document.getElementById('wz-tutor-tab-links')?.click(); null"); await sleep(400);
  const g2 = await app.evalJs(GROUPS);
  const a3w1 = g1.find((g) => g.id === 'wb-1'), a3w2 = g1.find((g) => g.id === 'wb-2');
  ok('A3 pressing wb-2\'s head opens it (the Y board\'s head drawn) and wb-1 stays open; opened again, the tab starts with only wb-1 open',
    !!a3w2 && a3w2.expanded === 'true' && a3w2.heads.includes('wb-y') && !!a3w1 && a3w1.expanded === 'true'
      && g2.map((g) => `${g.id}:${g.expanded}`).join(',') === 'wb-1:true,wb-2:false', { g1, g2 });
  ok('P1 the page\'s rects and editor node are the same with the groups opened and closed', r0 === r1 && r1 === r2 && same, { r0, r1, r2, same });

  const a4 = await app.evalJs(`(() => { const b = document.querySelector('[data-assets-part="wb-1"] [data-back-asset][data-graft-box="x1"] [data-back-beside]'); if (!b) return null;
    const vis = [...b.childNodes].filter((n) => n.nodeType === 3 ? (n.textContent || '').trim() : !(n.classList && n.classList.contains('wz-sr-only')) && n.tagName !== 'svg' && (n.textContent || '').trim()).length;
    return { svg: !!b.querySelector('svg'), visibleWords: vis, title: b.getAttribute('title'), label: b.getAttribute('aria-label') }; })()`);
  ok('A4 "Open Beside" is an icon (an svg, no visible word), its words on hover and for a screen reader',
    !!a4 && a4.svg && a4.visibleWords === 0 && a4.title === 'Open Beside' && /^Open Beside: /.test(a4.label || ''), a4);

  const a5 = await app.evalJs(`(() => { const kinds = [...document.querySelectorAll('[data-assets-part="wb-1"] .wz-back-asset-kind, [data-assets-part] .wz-back-boardhead .wz-back-asset-kind')];
    return kinds.map((k) => ({ icon: k.getAttribute('data-kind-icon'), svg: !!k.querySelector('svg'), title: k.getAttribute('title'), sr: ${txt("k.querySelector('.wz-sr-only')")} })); })()`);
  const kindsOk = a5.length >= 3 && a5.every((k) => k.svg && k.title && k.title === k.sr) && a5.some((k) => k.icon === 'card' && k.title === 'Block') && a5.some((k) => k.icon === 'page' && k.title === 'Doc')
    && a5.some((k) => k.icon === 'board' && k.title === 'Board') && !a5.some((k) => /graphic/i.test(k.icon || '') || /graphic/i.test(k.title || ''));
  ok('A5 each kind is an icon with its word on hover and for a screen reader: Block, Doc, Board; no Graphic', kindsOk, a5);

  // ---- SPLIT -----------------------------------------------------------------------------------------------------------------------------
  await openBuild(app, 'wb-1');
  await app.evalJs("document.querySelector('[data-assets-part=\"wb-1\"] [data-back-asset][data-graft-box=\"x1\"] [data-back-beside]')?.click(); null"); await sleep(900);
  const h1 = await app.evalJs(`(() => { const st = document.querySelector('.desk-frame-stage[data-split="true"]'); if (!st) return null;
    // the asset's side is portalled into <body> (SplitHost), outside the stage: both are searched (Nov 20, Actions 44825171366: the stage alone found no side)
    const scrollers = [...st.querySelectorAll('*'), ...document.querySelectorAll('.wz-split-asset, .wz-split-asset *')].filter((e) => { const cs = getComputedStyle(e); return /auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 4; });
    const out = scrollers.map((e) => { const before = e.scrollTop; e.scrollTop = before + 40; const moved = e.scrollTop !== before; e.scrollTop = before;
      return { cls: String(e.className).slice(0, 40), sw: getComputedStyle(e).scrollbarWidth, gutter: e.offsetWidth - e.clientWidth - parseFloat(getComputedStyle(e).borderLeftWidth) - parseFloat(getComputedStyle(e).borderRightWidth), moved }; });
    return { n: out.length, page: !!scrollers.find((e) => e.contains(document.querySelector('.forward-only-editor'))), side: !!scrollers.find((e) => e.closest('.wz-split-asset')), out }; })()`);
  ok('H1 with a card open beside, every scroller on the stage (the page\'s and the asset\'s side) hides its scrollbar, and both still scroll',
    !!h1 && h1.n >= 2 && h1.page && h1.side && h1.out.every((o) => o.sw === 'none' && Math.round(o.gutter) === 0 && o.moved), h1);
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const used = ['components/ConnectionsDrawerPanel.tsx', 'reorg/backMenu/AssetPartGroups.tsx', 'reorg/backMenu/AssetGroupsList.tsx'].map((f) => fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '').join('\n');
  const need = ['reorgAssetsHead', 'reorgAssetsPartToggle'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !used.includes(`'${k}'`));
  ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used in the source); the head reads "Assets ({n})"', missing.length === 0 && canon.includes("reorgAssetsHead: 'Assets ({n})'"), { missing });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 8;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-B-ASSETS VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-B-ASSETS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
