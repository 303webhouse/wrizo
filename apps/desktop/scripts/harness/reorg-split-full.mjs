// FULL SCREEN FROM THE SPLIT (reorg plan v2.1 §3b, ARBOR item 3; Nick, Team B row 2: "An asset's pop-out has a 'Full Screen' choice, over a faded
// split background, except a Board. Full Screen on a Board opens the Board's own screen, with a Back button to the page she came from"; Fable,
// Nov 21 11:45 am, RULED: a Block or a Doc over the faded page, which stays mounted and still; Esc or Back gives the split back; a Board opens its
// own screen with the return restoring scroll, caret, stage and split; no Full Screen for a card inside the split's Board). Machina, ?reorg=1.
//
// The fixture (seams only; WS_PLACE=1): a set "Novel" in a Drawer with one Part wb-1 ("Chapter one." and eighty lines, so the page scrolls); a loose
// Doc wb-d ("Notes page", two lines); a loose Board wb-b ("Plot board") with three text cards c1 "Alpha", c2 "Beta", c3 "Gamma". She is on wb-1 in
// EDIT (a stage that is not the page's first), 1920x1080, her caret inside line 40 and the page scrolled down. Each asset is opened beside the page
// through the split's own seam (window.wrizoSplit.open).
//
// PREMISE P0  the page scrolls (its scroll box is down from the top) and her caret is in the page's editor, in EDIT
// HEAD    F0  the split's head draws "Full Screen" beside Close for a Doc, a Block and a Board
// DOC     F1  Full Screen on the Doc: a layer covers the whole window with a shade over the page (opacity between .5 and 1, the page faded, not gone),
//             the Doc's title and lines drawn in it, the split still there under it, and the page's rects (column, page, editor) and its editor node
//             the same as before
//         F2  Escape closes the layer: the split is back on the same Doc, the page's rects and editor node are the same, and nothing was stored
//             (storage byte-identical from before Full Screen to after the close)
// BLOCK   F3  Full Screen on a Block draws its words ("Alpha") in the layer; the layer's Back closes it and the split is back on the same Block
//         F4  closing the layer gives the keyboard back to the split's Full Screen button
// CARD    F8  a card opened in the split's Board (its card editor) has no Full Screen: the only Full Screen in the window is the split head's
// BOARD   F5  Full Screen on the Board opens the Board's own screen (its route, its canvas), with Back first in its top rail, and no split there
//         F6  Back returns to the page: its route, EDIT still chosen, the split open again on the same Board, the page's scroll where it was (2 px)
//             and her caret at the same place in the editor
//         MUT-F6  a caret one place off, or a scroll 40 px off, turns F6's test red (the mutant LANDED: the reading changed)
// OTHER   F7  a Board reached another way shows no Back, and the page reached another way than Back opens with no split (the trip ended): Full Screen
//             on the Board again, then the page opened by its address, then the Board by its address
// SOURCE  S1  nothing of Full Screen is saved: the trip's store and the split's host write no storage, no prefs and no way back of their own
//         MUT-S1  the same source with a storage write turns S1 red (the mutant LANDED: the source changed)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-split-full.mjs
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
const card = (id, text, seq, x, y) => ({ id, kind: 'text', x, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const LINES = Array.from({ length: 80 }, (_, i) => `Line ${i + 1} of the chapter, written long enough to fill the page and make it scroll.`);
const STORE = "JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))";
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const markEditor = "(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__sfMark = 1; return !!n; })()";
const sameEditor = "!!(document.querySelector('.forward-only-editor') || {}).__sfMark";
// her caret, as a count of the editor's characters before it (this file's own reading, the same before and after)
const CARET = "(() => { const ed = document.querySelector('.forward-only-editor'); const s = getSelection(); if (!ed || !s || !s.rangeCount || !ed.contains(s.focusNode)) return null; const r = document.createRange(); r.setStart(ed, 0); r.setEnd(s.focusNode, s.focusOffset); return r.toString().length; })()";
const SCROLL = "(() => { const s = document.querySelector('.mode-scroll'); return s ? { top: s.scrollTop, room: s.scrollHeight - s.clientHeight } : null; })()";
const PUT_CARET = `(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, hit = null;
  while ((n = w.nextNode())) { if (n.textContent.includes('Line 40 ')) { hit = n; break; } } if (!hit) return false;
  const at = hit.textContent.indexOf('Line 40 ') + 4; const r = document.createRange(); r.setStart(hit, at); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`;
const HEAD = `(() => { const a = document.querySelector('.wz-split-asset'); if (!a) return null; const f = a.querySelector('.wz-split-head [data-split-full]'); const c = a.querySelector('.wz-split-head [data-split-close]');
  return { asset: a.getAttribute('data-split-asset'), box: a.getAttribute('data-split-box'), full: f ? f.textContent.trim() : null, close: !!c, board: !!a.querySelector('[data-split-board]') }; })()`;
const LAYER = `(() => { const l = document.querySelector('[data-split-fullscreen]'); if (!l) return null; const r = l.getBoundingClientRect(); const sh = l.querySelector('[data-split-full-shade]');
  const p = l.querySelector('.wz-split-full-panel'); const back = l.querySelector('[data-split-full-back]');
  return { of: l.getAttribute('data-split-fullscreen'), rect: [r.left, r.top, r.width, r.height].map(Math.round), win: [innerWidth, innerHeight], shade: sh ? Number(getComputedStyle(sh).opacity) : null,
    title: p ? (p.querySelector('.wz-link-dock-title') || {}).textContent : null, text: p ? (p.querySelector('.wz-link-dock-text') || {}).textContent : null,
    back: back ? back.textContent.trim() : null, focusIn: l.contains(document.activeElement), split: !!document.querySelector('.wz-split-asset') }; })()`;
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`;
const stageOn = (key) => `document.querySelector('.reorg-top [data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true'`;
const dbl = (x, y) => `(() => { const t = document.elementFromPoint(${x}, ${y}); if (!t) return false; t.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: ${x}, clientY: ${y} })); return true; })()`;
const CARD1 = "(() => { const c = document.querySelector('.wz-split-asset [data-split-board] [data-split-box=\"c1\"]'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.left + 8, y: r.top + 6 }; })()";
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500); }

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
    page('wb-b', 'Plot board', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'Alpha', 0, 0.05, 0.05), card('c2', 'Beta', 1, 0.55, 0.05), card('c3', 'Gamma', 2, 0.05, 0.6)])} });
    page('wb-d', 'Notes page\\nFirst note.\\nSecond note.', { origin: 'loose' });
    page('wb-1', ${q(['Chapter one.', ...LINES].join('\n'))}, { origin: 'project', projectId: novel.id, orderIndex: 0 });
    W.wrizoFlushNow();
    return { novel: novel.id };
  })()`);
}
async function openAt(app, id, key) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`);
  await app.waitFor(`${stageOn(key)} && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
}
async function beside(app, ref) {
  await app.evalJs(`window.wrizoSplit && window.wrizoSplit.open('wb-1', ${q(ref)}); null`);
  await app.waitFor(`document.querySelector('.wz-split-asset')?.getAttribute('data-split-asset') === ${q(ref.entryId)}`, { label: `beside: ${ref.entryId}`, timeout: 6000 }).catch(() => {});
  await sleep(600);
}
// the return's test, as a function of its readings, so the mutants can hand it readings that are off
const f6 = (r) => !!r && r.hash === '#/page/wb-1' && r.stage && r.head && r.head.asset === 'wb-b' && !r.head.box && r.head.board
  && !!r.scroll && !!r.saved.scroll && Math.abs(r.scroll.top - r.saved.scroll.top) <= 2 && r.caret !== null && r.caret === r.saved.caret;

await withHarness(async (app) => {
  await seed(app);
  await openAt(app, 'wb-1', 'revise');
  await app.evalJs(PUT_CARET);
  await sleep(300);
  await app.evalJs("(() => { const s = document.querySelector('.mode-scroll'); if (s) s.scrollTop = Math.min(700, s.scrollHeight - s.clientHeight - 10); return null; })()");
  await sleep(500);
  const saved = { caret: await app.evalJs(CARET), scroll: await app.evalJs(SCROLL) };
  ok('P0 the page scrolls (its scroll box is down from the top) and her caret is in the page\'s editor, in EDIT',
    !!saved.scroll && saved.scroll.top > 100 && typeof saved.caret === 'number' && saved.caret > 0 && await app.evalJs(stageOn('revise')), saved);

  // ---- DOC -------------------------------------------------------------------------------------------------------------------------------
  const heads = {};
  await beside(app, { entryId: 'wb-d' });
  heads.doc = await app.evalJs(HEAD);
  const r0 = await app.evalJs(PAGE);
  await app.evalJs(markEditor);
  const st0 = await app.evalJs(STORE);
  await app.evalJs(press('.wz-split-asset [data-split-full]'));
  await sleep(500);
  const l1 = await app.evalJs(LAYER);
  const r1 = await app.evalJs(PAGE);
  const same1 = await app.evalJs(sameEditor);
  ok('F1 Full Screen on the Doc: a layer covers the window, a shade over the page (opacity .5 to 1), the Doc drawn in it, the split under it, the page\'s rects and editor the same',
    !!l1 && l1.of === 'wb-d' && l1.rect[0] === 0 && l1.rect[1] === 0 && l1.rect[2] === l1.win[0] && l1.rect[3] === l1.win[1] && l1.shade > 0.5 && l1.shade < 1
    && /Notes page/.test(l1.title || '') && /First note\./.test(l1.text || '') && /Second note\./.test(l1.text || '') && l1.split && r1 === r0 && same1, { l1, r0, r1, same1 });
  await app.key('Escape');
  await sleep(500);
  await settle(app);
  const l2 = await app.evalJs(LAYER);
  const h2 = await app.evalJs(HEAD);
  const r2 = await app.evalJs(PAGE);
  const st2 = await app.evalJs(STORE);
  ok('F2 Escape closes the layer: the split is back on the same Doc, the page\'s rects and editor the same, nothing stored (storage byte-identical)',
    l2 === null && !!h2 && h2.asset === 'wb-d' && r2 === r0 && await app.evalJs(sameEditor) && st2 === st0, { l2, h2, r0, r2, storeSame: st2 === st0 });

  // ---- BLOCK -----------------------------------------------------------------------------------------------------------------------------
  await beside(app, { entryId: 'wb-b', boxId: 'c1' });
  heads.block = await app.evalJs(HEAD);
  await app.evalJs(press('.wz-split-asset [data-split-full]'));
  await sleep(500);
  const l3 = await app.evalJs(LAYER);
  await app.evalJs(press('[data-split-fullscreen] [data-split-full-back]'));
  await sleep(500);
  const l3b = await app.evalJs(LAYER);
  const h3 = await app.evalJs(HEAD);
  ok('F3 Full Screen on a Block draws its words in the layer; the layer\'s Back closes it and the split is back on the same Block',
    !!l3 && l3.of === 'wb-b' && /Alpha/.test(`${l3.title || ''} ${l3.text || ''}`) && l3.back === 'Back' && l3b === null && !!h3 && h3.asset === 'wb-b' && h3.box === 'c1', { l3, l3b, h3 });
  const focus4 = await app.evalJs("!!document.activeElement && document.activeElement.matches('.wz-split-asset [data-split-full]')");
  ok('F4 closing the layer gives the keyboard back to the split\'s Full Screen button', focus4, { focus4, l1focus: l1 && l1.focusIn });

  // ---- BOARD -----------------------------------------------------------------------------------------------------------------------------
  await beside(app, { entryId: 'wb-b' });
  heads.board = await app.evalJs(HEAD);
  ok('F0 the split\'s head draws "Full Screen" beside Close for a Doc, a Block and a Board',
    ['doc', 'block', 'board'].every((k) => heads[k] && heads[k].full === 'Full Screen' && heads[k].close) && heads.board.board, heads);

  // CARD: the card editor in the split's Board has no Full Screen of its own
  const c1 = await app.evalJs(CARD1);
  if (c1) await app.evalJs(dbl(c1.x, c1.y));
  await sleep(500);
  const card8 = await app.evalJs("(() => { const p = document.querySelector('.board-popup'); return { popup: !!p, inPopup: p ? p.querySelectorAll('[data-split-full]').length : null, all: document.querySelectorAll('[data-split-full]').length }; })()");
  await app.key('Escape');
  await sleep(500);
  ok('F8 a card opened in the split\'s Board has no Full Screen: the only Full Screen in the window is the split head\'s', card8.popup && card8.inPopup === 0 && card8.all === 1, card8);

  await app.evalJs(press('.wz-split-asset [data-split-full]'));
  await app.waitFor("location.hash === '#/page/wb-b' && !!document.querySelector('.board-canvas')", { label: 'the Board\'s own screen', timeout: 8000 }).catch(() => {});
  await sleep(900);
  const b5 = await app.evalJs(`(() => { const top = document.querySelector('.reorg-top[data-reorg-top=\"board\"]'); const back = top && top.querySelector('[data-top-back]'); const first = top && top.firstElementChild;
    return { hash: location.hash, canvas: !!document.querySelector('.board-canvas'), back: back ? back.textContent.trim() : null, first: !!back && first === back, split: !!document.querySelector('.wz-split-asset') }; })()`);
  ok('F5 Full Screen on the Board opens the Board\'s own screen (its route, its canvas), with Back first in its top rail, and no split there',
    b5.hash === '#/page/wb-b' && b5.canvas && b5.back === 'Back' && b5.first && !b5.split, b5);

  await app.evalJs(press('.reorg-top [data-top-back]'));
  await app.waitFor("location.hash === '#/page/wb-1' && !!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-split-asset')", { label: 'back on the page', timeout: 8000 }).catch(() => {});
  await sleep(1200);
  const ret = { hash: await app.evalJs('location.hash'), stage: await app.evalJs(stageOn('revise')), head: await app.evalJs(HEAD), scroll: await app.evalJs(SCROLL), caret: await app.evalJs(CARET), saved };
  ok('F6 Back returns to the page: its route, EDIT still chosen, the split open again on the same Board, the scroll where it was (2 px) and her caret at the same place', f6(ret), ret);
  const offCaret = { ...ret, caret: typeof ret.caret === 'number' ? ret.caret + 1 : 1 };
  const offScroll = { ...ret, scroll: ret.scroll ? { ...ret.scroll, top: ret.scroll.top + 40 } : { top: 40 } };
  ok('MUT-F6 a caret one place off, or a scroll 40 px off, turns F6\'s test red', offCaret.caret !== ret.caret && !f6(offCaret) && offScroll.scroll.top !== (ret.scroll || {}).top && !f6(offScroll), { offCaret: offCaret.caret, offScroll: offScroll.scroll });

  // ---- ANOTHER WAY -----------------------------------------------------------------------------------------------------------------------
  await app.evalJs(press('.wz-split-asset [data-split-full]'));
  await app.waitFor("location.hash === '#/page/wb-b' && !!document.querySelector('[data-top-back]')", { label: 'the Board again', timeout: 8000 }).catch(() => {});
  await sleep(600);
  await app.evalJs("location.hash = '#/page/wb-1'; null");
  await app.waitFor("location.hash === '#/page/wb-1' && !!document.querySelector('.forward-only-editor')", { label: 'the page by its address', timeout: 8000 }).catch(() => {});
  await sleep(1200);
  const pageAlone = await app.evalJs("!document.querySelector('.wz-split-asset')");
  await app.evalJs("location.hash = '#/page/wb-b'; null");
  await app.waitFor("location.hash === '#/page/wb-b' && !!document.querySelector('.reorg-top[data-reorg-top=\"board\"]')", { label: 'the Board by its address', timeout: 8000 }).catch(() => {});
  await sleep(900);
  const b7 = await app.evalJs("({ top: !!document.querySelector('.reorg-top[data-reorg-top=\"board\"]'), back: !!document.querySelector('[data-top-back]') })");
  ok('F7 the page reached another way than Back opens with no split, and the Board reached another way shows no Back (the trip ended)', pageAlone && b7.top && !b7.back, { pageAlone, b7 });

  // ---- SOURCE ----------------------------------------------------------------------------------------------------------------------------
  const read = (rel) => { try { return fs.readFileSync(path.join(SRC, rel), 'utf8'); } catch { return ''; } };
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const code = strip(read('reorg/split/fullTrip.ts')) + '\n' + strip(read('reorg/split/SplitHost.tsx'));
  const s1 = (c) => { const bad = ['localStorage', 'sessionStorage', 'setPref', 'captureWayBack', 'saveJournalEntry', 'wrizoPatchEntry'].filter((w) => c.includes(w)); return { pass: c.length > 200 && bad.length === 0 && /startBoardTrip/.test(c) && /takeTripBack/.test(c), bad, len: c.length }; };
  const s1r = s1(code);
  ok('S1 nothing of Full Screen is saved: the trip\'s store and the split\'s host write no storage, no prefs and no way back of their own', s1r.pass, s1r);
  const mutCode = code + "\nlocalStorage.setItem('x', '1');";
  ok('MUT-S1 the same source with a storage write turns S1 red', mutCode !== code && !s1(mutCode).pass, s1(mutCode));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 13;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-SPLIT-FULL VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-SPLIT-FULL VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
