// A BOARD IN THE SPLIT, 2a: THE LOOK-ONLY CANVAS (reorg plan v2.1 §3b, ARBOR item 2; stage menus B2, Nick: "A Board in the split keeps its views,
// pans and zooms"; Fable, Nov 20 11:45 pm, RULED as a sequence: 2a a look-only canvas reusing the card drawing, the Board's views, pan by dragging, zoom
// only in the split and never saved; 2b editing straight after, on the SAME surface). A Board opened beside the page draws its cards where they stand on
// the Board (the Board's own card components, at x and y as fractions of the width), offers the Board's views (Open, Storyboard, Outline; the Walk
// and a book's pages stay on the Board's own screen), pans when dragged and zooms with Ctrl+wheel or its buttons, about the pointer. None of it is
// kept: the view, the pan and the zoom live while the split stands. Nothing is written. Machina, ?reorg=1.
//
// The fixture (seams only; WS_PLACE=1): a set "Novel" in a Drawer with one Part wb-1 ("Chapter one."); a loose Board wb-b ("Plot board") with
// three text cards: c1 "Alpha" (x .05, y .05), c2 "Beta" (x .55, y .05), c3 "Gamma" (x .05, y .6), each .3 x .1. She is on wb-1, BUILD,
// 1920x1080; the Board is opened beside the page through the split's own seam (window.wrizoSplit.open).
//
// CANVAS  V1  the split draws the Board on a canvas: three cards, each at its own x and y (fractions of the canvas width), each the Board's
//             own text card carrying its words; the kind reads "Board"
// VIEWS   V2  a view switch offers Open, Storyboard, Outline (the Board's own words), Open pressed; Outline draws three outline rows, every
//             field read-only; Storyboard draws three storyboard cards; Open brings the canvas back
// PAN     P1  a drag on the empty canvas moves every card by exactly the drag
// ZOOM    Z1  Ctrl+wheel zooms in about the pointer (the canvas point under it stays put); Zoom Out zooms out; Fit brings the scale to 1 and the
//             pan home, every card back at its V1 place
//         Z2  none of it is kept: zoomed, panned and on Outline, the split closed and opened again shows Open at scale 1, the pan home
// STORE   N1  every key in storage is byte-identical across all of the above, double-clicks on a card and on the empty canvas included
// LOOK    R1  nothing in the split is editable: no contenteditable, no text field that is not read-only, no card handle
// PAGE    K1  the page's rects (column, page, editor) and the editor node are the same from the split's opening to the end
// SOURCE  S1  the split's Board (reorg/split/SplitBoard.tsx) writes nothing (no save, no prefs, no storage, no board-mode write) and listens on no
//             window or document (its pointers, wheel and keys are its own element's)
// WORDS   W1  every new word is a lexicon key (terms.ts, the canonical table, used in the source)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-split-board.mjs
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
const STORE = "JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))";
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const B = "document.querySelector('.wz-split-asset [data-split-board]')";
// the board's state as it marks itself, and every card's rect
const READ = `(() => { const b = ${B}; if (!b) return null; const c = b.querySelector('[data-split-board-canvas]'); const cr = c ? c.getBoundingClientRect() : null;
  const cards = [...b.querySelectorAll('[data-split-box]')].map((e) => { const r = e.getBoundingClientRect(); return { id: e.getAttribute('data-split-box'), l: r.left, t: r.top, w: r.width, words: (e.querySelector('.board-text')?.textContent || '').trim() }; });
  return { view: b.getAttribute('data-view'), scale: parseFloat(b.getAttribute('data-scale') || 'NaN'), pan: b.getAttribute('data-pan'), canvas: cr && { l: cr.left, t: cr.top, w: cr.width / parseFloat(b.getAttribute('data-scale') || '1') }, cards,
    kind: (document.querySelector('.wz-split-asset .wz-link-dock-kind')?.textContent || '').trim() }; })()`;
const VIEWS = `(() => { const v = ${B}?.querySelector('[data-split-views]'); return v ? [...v.querySelectorAll('[data-split-view]')].map((b) => [b.getAttribute('data-split-view'), b.textContent.trim(), b.getAttribute('aria-pressed')]) : null; })()`;
const press = (sel) => `(() => { const b = ${B}?.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`;
const markEditor = "(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__sbMark = 1; return !!n; })()";
const sameEditor = "!!(document.querySelector('.forward-only-editor') || {}).__sbMark";
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400); }

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
    page('wb-1', 'Chapter one.', { origin: 'project', projectId: novel.id, orderIndex: 0 });
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
  await app.waitFor(`document.querySelector('.reorg-top [data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
}
async function openBoard(app) {
  await app.evalJs("window.wrizoSplit && window.wrizoSplit.open('wb-1', { entryId: 'wb-b' }); null");
  await app.waitFor(`!!${B}`, { label: 'the Board in the split', timeout: 6000 }).catch(() => {});
  await sleep(700);
}
async function closeBoard(app) { await app.evalJs("document.querySelector('[data-split-close]')?.click(); null"); await sleep(700); }
// pointer and wheel events the way the browser hands them to the canvas (its own element, never the window)
const EMPTY = `(() => { const w = ${B}?.querySelector('[data-split-board-wrap]'); if (!w) return null; const r = w.getBoundingClientRect(); return { x: r.left + r.width * 0.8, y: r.top + r.height * 0.85 }; })()`;
const pointer = (type, x, y) => `(() => { const w = ${B}?.querySelector('[data-split-board-wrap]'); if (!w) return false; const t = document.elementFromPoint(${x}, ${y}) || w;
  t.dispatchEvent(new PointerEvent(${q(type)}, { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true, button: 0, buttons: ${type === 'pointerup' ? 0 : 1}, pointerType: 'mouse', clientX: ${x}, clientY: ${y} })); return true; })()`;
const wheel = (x, y, dy) => `(() => { const t = document.elementFromPoint(${x}, ${y}); if (!t) return false; t.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: ${dy}, clientX: ${x}, clientY: ${y} })); return true; })()`;
const dbl = (x, y) => `(() => { const t = document.elementFromPoint(${x}, ${y}); if (!t) return false; t.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: ${x}, clientY: ${y} })); return true; })()`;

await withHarness(async (app) => {
  await seed(app);
  await openAt(app, 'wb-1', 'draft');
  const store0 = await app.evalJs(STORE);
  await openBoard(app);
  const r0 = await app.evalJs(PAGE);
  await app.evalJs(markEditor);

  // ---- CANVAS ----------------------------------------------------------------------------------------------------------------------------
  const v1 = await app.evalJs(READ);
  const want = { c1: [0.05, 0.05, 'Alpha'], c2: [0.55, 0.05, 'Beta'], c3: [0.05, 0.6, 'Gamma'] };
  const placed = (s) => !!s && !!s.canvas && s.cards.length === 3 && s.cards.every((c) => want[c.id] && near(c.l - s.canvas.l, want[c.id][0] * s.canvas.w * s.scale) && near(c.t - s.canvas.t, want[c.id][1] * s.canvas.w * s.scale));
  ok('V1 the split draws the Board on a canvas: three cards, each at its own x and y (fractions of the canvas width), each the Board\'s own text card with its words; the kind reads "Board"',
    placed(v1) && v1.view === 'open' && v1.scale === 1 && v1.cards.every((c) => c.words === want[c.id][2]) && v1.kind === 'Board', v1);

  // ---- VIEWS -----------------------------------------------------------------------------------------------------------------------------
  const views = await app.evalJs(VIEWS);
  await app.evalJs(press('[data-split-view="outline"]')); await sleep(400);
  const outline = await app.evalJs(`(() => { const b = ${B}; const rows = b ? [...b.querySelectorAll('.board-outline-row')] : []; const fields = b ? [...b.querySelectorAll('input, textarea')] : [];
    return { view: b?.getAttribute('data-view'), rows: rows.length, fields: fields.length, editable: fields.filter((f) => !f.readOnly && !f.disabled).length }; })()`);
  await app.evalJs(press('[data-split-view="storyboard"]')); await sleep(400);
  const story = await app.evalJs(`(() => { const b = ${B}; return { view: b?.getAttribute('data-view'), cards: b ? b.querySelectorAll('.board-sb-card').length : 0 }; })()`);
  await app.evalJs(press('[data-split-view="open"]')); await sleep(400);
  const back = await app.evalJs(READ);
  ok('V2 a view switch offers Open, Storyboard, Outline (the Board\'s own words), Open pressed; Outline draws three rows, every field read-only; Storyboard three cards; Open brings the canvas back',
    !!views && views.map((v) => v[0]).join(',') === 'open,storyboard,outline' && views.map((v) => v[1]).join(',') === 'Open,Storyboard,Outline' && views[0][2] === 'true' && views.slice(1).every((v) => v[2] === 'false')
      && outline.view === 'outline' && outline.rows === 3 && outline.editable === 0 && story.view === 'storyboard' && story.cards === 3 && placed(back), { views, outline, story, back: back && back.view });

  // ---- PAN -------------------------------------------------------------------------------------------------------------------------------
  const e0 = await app.evalJs(EMPTY);
  const p0 = await app.evalJs(READ);
  if (e0) {
    await app.evalJs(pointer('pointerdown', e0.x, e0.y));
    await app.evalJs(pointer('pointermove', e0.x - 60, e0.y - 40));
    await app.evalJs(pointer('pointermove', e0.x - 120, e0.y - 80));
    await app.evalJs(pointer('pointerup', e0.x - 120, e0.y - 80));
    await sleep(300);
  }
  const p1 = await app.evalJs(READ);
  const moved = !!p0 && !!p1 && p1.cards.length === 3 && p1.cards.every((c) => { const o = p0.cards.find((x) => x.id === c.id); return !!o && near(c.l - o.l, -120) && near(c.t - o.t, -80); });
  ok('P1 a drag on the empty canvas moves every card by exactly the drag', !!e0 && moved, { e0, before: p0 && p0.cards, after: p1 && p1.cards, pan: p1 && p1.pan });

  // ---- ZOOM ------------------------------------------------------------------------------------------------------------------------------
  const z0 = await app.evalJs(READ);
  const c2 = z0 && z0.cards.find((c) => c.id === 'c2');
  const pt = c2 ? { x: c2.l + 10, y: c2.t + 6 } : null;   // a point on Beta's card
  if (pt) { await app.evalJs(wheel(pt.x, pt.y, -240)); await sleep(300); }
  const z1 = await app.evalJs(READ);
  const c2z = z1 && z1.cards.find((c) => c.id === 'c2');
  // the canvas point under the pointer stays put: Beta's corner keeps its offset from the pointer, scaled
  const anchored = !!c2 && !!c2z && !!pt && z1.scale > 1 && near(pt.x - c2z.l, (pt.x - c2.l) * (z1.scale / z0.scale)) && near(pt.y - c2z.t, (pt.y - c2.t) * (z1.scale / z0.scale));
  await app.evalJs(press('[data-split-zoom="out"]')); await sleep(300);
  const z2 = await app.evalJs(READ);
  await app.evalJs(press('[data-split-zoom="fit"]')); await sleep(300);
  const z3 = await app.evalJs(READ);
  ok('Z1 Ctrl+wheel zooms in about the pointer (the canvas point under it stays put); Zoom Out zooms out; Fit brings the scale to 1 and the pan home, every card at its V1 place',
    anchored && !!z2 && z2.scale < z1.scale && !!z3 && z3.scale === 1 && z3.pan === '0,0' && placed(z3) && JSON.stringify(z3.cards.map((c) => [c.id, Math.round(c.l), Math.round(c.t)])) === JSON.stringify(v1.cards.map((c) => [c.id, Math.round(c.l), Math.round(c.t)])),
    { s: [z0 && z0.scale, z1 && z1.scale, z2 && z2.scale, z3 && z3.scale], anchored, pan: z3 && z3.pan });

  // double-clicks, inside the N1 window: on a card and on the empty canvas
  const c1 = z3 && z3.cards.find((c) => c.id === 'c1');
  if (c1) await app.evalJs(dbl(c1.l + 8, c1.t + 6));
  const e1 = await app.evalJs(EMPTY);
  if (e1) await app.evalJs(dbl(e1.x, e1.y));
  await settle(app);

  // ---- LOOK ------------------------------------------------------------------------------------------------------------------------------
  const look = await app.evalJs(`(() => { const a = document.querySelector('.wz-split-asset'); if (!a) return null; return { ce: a.querySelectorAll('[contenteditable="true"], [contenteditable=""]').length,
    fields: [...a.querySelectorAll('input, textarea')].filter((f) => !f.readOnly && !f.disabled).length, handles: a.querySelectorAll('.board-handle').length }; })()`);
  ok('R1 nothing in the split is editable: no contenteditable, no text field that is not read-only, no card handle', !!look && look.ce === 0 && look.fields === 0 && look.handles === 0, look);

  // ---- Z2: none of it is kept ------------------------------------------------------------------------------------------------------------
  const zz = await app.evalJs(READ);
  const cz = zz && zz.cards.find((c) => c.id === 'c1');
  if (cz) { await app.evalJs(wheel(cz.l + 5, cz.t + 5, -240)); await sleep(200); }
  const ez = await app.evalJs(EMPTY);
  if (ez) { await app.evalJs(pointer('pointerdown', ez.x, ez.y)); await app.evalJs(pointer('pointermove', ez.x - 50, ez.y - 30)); await app.evalJs(pointer('pointerup', ez.x - 50, ez.y - 30)); await sleep(200); }
  await app.evalJs(press('[data-split-view="outline"]')); await sleep(300);
  const changed = await app.evalJs(READ);
  await closeBoard(app);
  await openBoard(app);
  const again = await app.evalJs(READ);
  ok('Z2 none of it is kept: zoomed, panned and on Outline, the split closed and opened again shows Open at scale 1, the pan home',
    !!changed && changed.view === 'outline' && changed.scale !== 1 && changed.pan !== '0,0' && !!again && again.view === 'open' && again.scale === 1 && again.pan === '0,0' && placed(again), { changed: changed && [changed.view, changed.scale, changed.pan], again: again && [again.view, again.scale, again.pan] });

  // ---- PAGE + STORE ----------------------------------------------------------------------------------------------------------------------
  const r1 = await app.evalJs(PAGE);
  ok('K1 the page\'s rects (column, page, editor) and the editor node are the same from the split\'s opening to the end', !!r0 && r0 === r1 && (await app.evalJs(sameEditor)), { r0, r1 });
  await settle(app);
  const store1 = await app.evalJs(STORE);
  ok('N1 every key in storage is byte-identical across all of the above (views, pan, zoom, double-clicks, close and reopen)', store0 === store1, { lens: [store0.length, store1.length] });
});

// ---- SOURCE + WORDS ----------------------------------------------------------------------------------------------------------------------
{
  const read = (f) => (fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '');
  const sb = read('reorg/split/SplitBoard.tsx');
  const code = sb.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const writes = ['saveBoardBoxes', 'saveJournalEntry', 'setPref', 'localStorage', 'setBoardMode', 'wrizoPatchEntry'].filter((w) => code.includes(w));
  const global = /(window|document)\.addEventListener/.test(code);
  ok('S1 the split\'s Board writes nothing (no save, no prefs, no storage, no board-mode write) and listens on no window or document', !!sb && writes.length === 0 && !global, { exists: !!sb, writes, global });
  const terms = read('store/lexicon/terms.ts');
  const canon = read('store/lexicon/canonical/chrome.ts');
  const need = ['reorgSplitViews', 'reorgSplitZoomIn', 'reorgSplitZoomOut', 'reorgSplitZoomFit'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !sb.includes(`'${k}'`));
  ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used in the source)', missing.length === 0, { missing });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 10;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-SPLIT-BOARD VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-SPLIT-BOARD VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
