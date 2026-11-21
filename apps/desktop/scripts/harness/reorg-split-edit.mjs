// A BOARD IN THE SPLIT, 2b: EDITING IN THE SPLIT (reorg plan v2.1 §3b, ARBOR item 2; Nick: a Board in the split is edited there; Fable, Nov 20 11:45 pm,
// RULED as a sequence, 2a look-only then 2b editing straight after on the SAME surface; Fable, Nov 21 12:10 am, the approach ACCEPTED: one surface,
// reorg/split/SplitBoard.tsx; saved through saveBoardBoxes with tombstones; pointer capture; keys scoped to the split; a double-click adds; the
// Board's own card editor (BoardCardPopup) only if scoping its keys leaves the Board screen byte-identical; ink, link drags and Outline/Storyboard
// editing stay look-only). Machina, ?reorg=1.
//
// The fixture (seams only; WS_PLACE=1): 2a's - a set "Novel" in a Drawer with one Part wb-1 ("Chapter one."); a loose Board wb-b ("Plot board") with
// three text cards: c1 "Alpha" (x .05, y .05), c2 "Beta" (x .55, y .05), c3 "Gamma" (x .05, y .6), each .3 x .1. She is on wb-1, BUILD, 1920x1080; the
// Board is opened beside the page through the split's own seam (window.wrizoSplit.open). Asking before a delete is on (the default).
//
// SELECT  M3  a press on Beta's card without a move selects it and writes nothing
// MOVE    M1  a drag on Alpha's card moves it, and on release the STORED card stands there: x and y each grow by the drag over the canvas width
//             (the Board's own rule, both axes over the width); Beta and Gamma are unmoved in storage
//         M2  zoomed in (Zoom In twice), a drag moves the stored card by the drag over (width x scale): the drag is in the canvas's own units
// RESIZE  Z1  the selected card shows one handle; a drag on it grows the stored w and h by the drag over the width, and a drag far up and left
//             stops at the Board's own minimum (MIN_TEXT_W, MIN_TEXT_H)
// ADD     A2  a double-click on the empty canvas, closed without a word, writes nothing (storage byte-identical) and leaves no new card
//         A1  a double-click on the empty canvas opens the Board's own card editor and writes nothing yet; "Delta" typed and the editor closed
//             (Escape), the board stores a fourth live text card "Delta" whose top-left is where the double-click was
// EDIT    T1  a double-click on Gamma opens the card editor on "Gamma"; " ray+-0" typed and closed, the stored card reads "Gamma ray+-0" and the
//             split draws it
//         T2  the "+", "-" and "0" typed into the card editor are typed, not taken by the canvas (its scale and pan are the same before and after)
// DELETE  D1  Alpha selected, Delete asks the Board's own question (the delete dialog); confirmed, Alpha is a TOMBSTONE in storage (deletedAt set, the
//             card still in the board's boxes) and the split no longer draws it
// UNDO    U1  Ctrl+Z in the split brings Alpha back (live in storage, no deletedAt) and draws it; a second Ctrl+Z takes back the add (Delta gone);
//             Gamma keeps "Gamma ray+-0" throughout (an undo never takes back words)
// SCOPE   K1  with Beta selected, Delete and Ctrl+Z pressed in the PAGE beside touch nothing on the board (stored board byte-identical); Escape in the
//             split lets go of the card and the split stays open
// PAGE    K2  the page's rects (column, page, editor) and the editor node are the same from the split's opening to the end
// LOOK    L1  Outline and Storyboard stay look-only after the edits (no editable field, no contenteditable in the split)
// SOURCE  S1  the split's Board writes the board only through saveBoardBoxes and stashDeletedBoxes (the Board's tombstone path) - never storage,
//             prefs, the board's mode or saveJournalEntry - listens on no window or document, and gates every edit on getSystemKind (a system
//             board stays look-only)
//         MUT-S1  a SplitBoard that wrote localStorage turns S1 red (the mutant LANDED: the source changed)
//         S2  the Board's card editor listens on the document exactly as before unless `scoped` is passed, and the Board screen passes no `scoped`
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-split-edit.mjs
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
// the board as stored: every box, tombstones included
const BOARD = "JSON.stringify((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'wb-b') || {}).boxes || null)";
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const B = "document.querySelector('.wz-split-asset [data-split-board]')";
const READ = `(() => { const b = ${B}; if (!b) return null; const c = b.querySelector('[data-split-board-canvas]'); const cr = c ? c.getBoundingClientRect() : null; const s = parseFloat(b.getAttribute('data-scale') || 'NaN');
  const cards = [...b.querySelectorAll('[data-split-box]')].map((e) => { const r = e.getBoundingClientRect(); return { id: e.getAttribute('data-split-box'), l: r.left, t: r.top, w: r.width, h: r.height, sel: e.getAttribute('data-selected') === 'true', words: (e.querySelector('.board-text')?.textContent || '').trim() }; });
  const hs = [...b.querySelectorAll('[data-split-resize]')].map((h) => { const r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, of: h.closest('[data-split-box]')?.getAttribute('data-split-box') }; });
  return { view: b.getAttribute('data-view'), scale: s, pan: b.getAttribute('data-pan'), canvas: cr && { l: cr.left, t: cr.top, w: cr.width / (s || 1) }, cards, handles: hs }; })()`;
const press = (sel) => `(() => { const b = ${B}?.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`;
const markEditor = "(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__seMark = 1; return !!n; })()";
const sameEditor = "!!(document.querySelector('.forward-only-editor') || {}).__seMark";
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const POPUP = "(() => { const p = document.querySelector('.board-popup'); const e = p && p.querySelector('.board-popup-editor'); return p ? { open: true, text: e ? e.textContent : null, focused: !!e && document.activeElement === e } : { open: false }; })()";
const minOf = (key) => { const m = new RegExp(`export const ${key} = ([0-9.]+)`).exec(fs.readFileSync(path.join(SRC, 'components/board/geometry.ts'), 'utf8')); return m ? Number(m[1]) : NaN; };
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500); }
const board = async (app) => JSON.parse((await app.evalJs(BOARD)) || 'null');
const live = (boxes) => (boxes || []).filter((b) => !b.deletedAt && !b.purgedAt);
const byId = (boxes, id) => (boxes || []).find((b) => b.id === id) || null;

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
// a press lands where the browser would put it (elementFromPoint); its moves and its release go to the canvas, as a captured pointer's do
const down = (x, y) => `(() => { const t = document.elementFromPoint(${x}, ${y}); if (!t) return false;
  t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true, button: 0, buttons: 1, pointerType: 'mouse', clientX: ${x}, clientY: ${y} })); return t.closest('[data-split-box]')?.getAttribute('data-split-box') || t.className || t.tagName; })()`;
const toWrap = (type, x, y) => `(() => { const w = ${B}?.querySelector('[data-split-board-wrap]'); if (!w) return false;
  w.dispatchEvent(new PointerEvent(${q(type)}, { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true, button: 0, buttons: ${type === 'pointerup' ? 0 : 1}, pointerType: 'mouse', clientX: ${x}, clientY: ${y} })); return true; })()`;
async function drag(app, from, dx, dy) {
  const hit = await app.evalJs(down(from.x, from.y));
  for (const f of [0.25, 0.5, 0.75, 1]) { await app.evalJs(toWrap('pointermove', from.x + dx * f, from.y + dy * f)); await sleep(30); }
  await app.evalJs(toWrap('pointerup', from.x + dx, from.y + dy));
  await sleep(250);
  return hit;
}
async function tap(app, at) { const hit = await app.evalJs(down(at.x, at.y)); await app.evalJs(toWrap('pointerup', at.x, at.y)); await sleep(250); return hit; }
const dbl = (x, y) => `(() => { const t = document.elementFromPoint(${x}, ${y}); if (!t) return false; t.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: ${x}, clientY: ${y} })); return true; })()`;
const cardAt = (s, id) => { const c = s && s.cards.find((x) => x.id === id); return c ? { x: c.l + 12, y: c.t + 8 } : null; };
const EMPTY = `(() => { const w = ${B}?.querySelector('[data-split-board-wrap]'); if (!w) return null; const r = w.getBoundingClientRect(); return { x: r.left + r.width * 0.4, y: r.top + r.height * 0.85 }; })()`;
const focusWrap = `(() => { const w = ${B}?.querySelector('[data-split-board-wrap]'); if (!w) return false; w.focus(); return document.activeElement === w; })()`;
const T = 1.5;   // px of rounding in a stored fraction read back through the width

await withHarness(async (app) => {
  await seed(app);
  await openAt(app, 'wb-1', 'draft');
  await openBoard(app);
  const r0 = await app.evalJs(PAGE);
  await app.evalJs(markEditor);
  const b0 = await board(app);
  const s0 = await app.evalJs(READ);
  const W = s0 && s0.canvas ? s0.canvas.w : NaN;

  // ---- SELECT ----------------------------------------------------------------------------------------------------------------------------
  const st0 = await app.evalJs(STORE);
  await tap(app, cardAt(s0, 'c2') || { x: 0, y: 0 });
  await settle(app);
  const m3 = await app.evalJs(READ);
  const st1 = await app.evalJs(STORE);
  ok('M3 a press on Beta\'s card without a move selects it and writes nothing', !!m3 && m3.cards.some((c) => c.id === 'c2' && c.sel) && m3.cards.filter((c) => c.sel).length === 1 && st0 === st1,
    { sel: m3 && m3.cards.filter((c) => c.sel).map((c) => c.id), same: st0 === st1 });

  // ---- MOVE ------------------------------------------------------------------------------------------------------------------------------
  const a0 = cardAt(m3, 'c1');
  if (a0) await drag(app, a0, 60, 30);
  await settle(app);
  const b1 = await board(app);
  const m1 = await app.evalJs(READ);
  const A1 = byId(b1, 'c1'), A0 = byId(b0, 'c1');
  const unmoved = ['c2', 'c3'].every((id) => { const o = byId(b0, id), n = byId(b1, id); return !!o && !!n && o.x === n.x && o.y === n.y; });
  const drawnA = m1 && m1.cards.find((c) => c.id === 'c1'), wasA = s0 && s0.cards.find((c) => c.id === 'c1');
  ok('M1 a drag on Alpha\'s card moves it, and on release the stored card stands there: x and y each grow by the drag over the canvas width; Beta and Gamma unmoved in storage',
    !!A1 && !!A0 && W > 0 && near((A1.x - A0.x) * W, 60, T) && near((A1.y - A0.y) * W, 30, T) && unmoved && !!drawnA && !!wasA && near(drawnA.l - wasA.l, 60, T) && near(drawnA.t - wasA.t, 30, T),
    { W, dx: A1 && A0 && (A1.x - A0.x) * W, dy: A1 && A0 && (A1.y - A0.y) * W, unmoved, drawn: drawnA && wasA && [drawnA.l - wasA.l, drawnA.t - wasA.t] });

  await app.evalJs(press('[data-split-zoom="in"]')); await sleep(200);
  await app.evalJs(press('[data-split-zoom="in"]')); await sleep(300);
  const z = await app.evalJs(READ);
  const a1 = cardAt(z, 'c1');
  if (a1) await drag(app, a1, 100, 0);
  await settle(app);
  const b2 = await board(app);
  const A2 = byId(b2, 'c1');
  ok('M2 zoomed in (Zoom In twice), a drag moves the stored card by the drag over (width x scale): the drag is in the canvas\'s own units',
    !!z && z.scale > 1.5 && !!A2 && !!A1 && near((A2.x - A1.x) * W * z.scale, 100, T) && near(A2.y, A1.y, 1e-9), { scale: z && z.scale, moved: A2 && A1 && (A2.x - A1.x) * W * (z ? z.scale : 1), dy: A2 && A1 && A2.y - A1.y });
  await app.evalJs(press('[data-split-zoom="fit"]')); await sleep(300);

  // ---- RESIZE ----------------------------------------------------------------------------------------------------------------------------
  const f0 = await app.evalJs(READ);
  await tap(app, cardAt(f0, 'c2') || { x: 0, y: 0 });
  const f1 = await app.evalJs(READ);
  const hd = f1 && f1.handles.length === 1 && f1.handles[0].of === 'c2' ? f1.handles[0] : null;
  if (hd) await drag(app, hd, 50, 20);
  await settle(app);
  const b3 = await board(app);
  const f2 = await app.evalJs(READ);
  const hd2 = f2 && f2.handles.length === 1 ? f2.handles[0] : null;
  if (hd2) await drag(app, hd2, -2000, -2000);
  await settle(app);
  const b4 = await board(app);
  const BETA0 = byId(b0, 'c2'), BETA3 = byId(b3, 'c2'), BETA4 = byId(b4, 'c2');
  const MIN_W = minOf('MIN_TEXT_W'), MIN_H = minOf('MIN_TEXT_H');
  ok('Z1 the selected card shows one handle; a drag on it grows the stored w and h by the drag over the width; a drag far up and left stops at the Board\'s own minimum',
    !!hd && !!BETA3 && !!BETA0 && near((BETA3.w - BETA0.w) * W, 50, T) && near((BETA3.h - BETA0.h) * W, 20, T) && !!BETA4 && near(BETA4.w, MIN_W, 1e-6) && near(BETA4.h, MIN_H, 1e-6) && BETA4.x === BETA0.x && BETA4.y === BETA0.y,
    { handles: f1 && f1.handles, grew: BETA3 && BETA0 && [(BETA3.w - BETA0.w) * W, (BETA3.h - BETA0.h) * W], min: BETA4 && [BETA4.w, BETA4.h], want: [MIN_W, MIN_H] });

  // ---- ADD -------------------------------------------------------------------------------------------------------------------------------
  const e0 = await app.evalJs(EMPTY);
  const st2 = await app.evalJs(STORE);
  if (e0) await app.evalJs(dbl(e0.x, e0.y));
  await sleep(500);
  const pa = await app.evalJs(POPUP);
  await app.key('Escape'); await sleep(400);
  await settle(app);
  const st3 = await app.evalJs(STORE);
  const a2 = await app.evalJs(READ);
  ok('A2 a double-click on the empty canvas, closed without a word, writes nothing (storage byte-identical) and leaves no new card',
    !!pa && pa.open && st2 === st3 && !!a2 && a2.cards.length === 3 && !(await app.evalJs("!!document.querySelector('.board-popup')")), { popup: pa, same: st2 === st3, cards: a2 && a2.cards.length });

  const pre = await app.evalJs(READ);
  if (e0) await app.evalJs(dbl(e0.x, e0.y));
  await sleep(500);
  const pb = await app.evalJs(POPUP);
  await settle(app);
  const stOpen = await app.evalJs(STORE);
  await app.evalJs("document.querySelector('.board-popup .board-popup-editor')?.focus(); null");
  await app.typeKeys('Delta'); await sleep(200);
  await app.key('Escape'); await sleep(400);
  await settle(app);
  const b5 = await board(app);
  const D = live(b5).find((b) => b.kind === 'text' && b.text === 'Delta');
  const wantX = pre && e0 ? (e0.x - pre.canvas.l) / W : NaN, wantY = pre && e0 ? (e0.y - pre.canvas.t) / W : NaN;
  const a1r = await app.evalJs(READ);
  ok('A1 a double-click on the empty canvas opens the Board\'s own card editor and writes nothing yet; "Delta" typed and closed (Escape), the board stores a fourth live text card "Delta" whose top-left is where the double-click was',
    !!pb && pb.open && stOpen === st3 && live(b5).length === 4 && !!D && near(D.x * W, wantX * W, 2) && near(D.y * W, wantY * W, 2) && !!a1r && a1r.cards.some((c) => c.words === 'Delta'),
    { popup: pb, nothingYet: stOpen === st3, live: live(b5).length, D: D && [D.x, D.y], want: [wantX, wantY] });

  // ---- EDIT ------------------------------------------------------------------------------------------------------------------------------
  const g0 = await app.evalJs(READ);
  const gp = cardAt(g0, 'c3');
  if (gp) await app.evalJs(dbl(gp.x, gp.y));
  await sleep(500);
  const pg = await app.evalJs(POPUP);
  await app.evalJs("document.querySelector('.board-popup .board-popup-editor')?.focus(); null");
  await app.key('End');
  await app.typeKeys(' ray'); await sleep(150);
  const zk0 = await app.evalJs(READ);
  await app.typeKeys('+-0'); await sleep(300);
  const zk1 = await app.evalJs(READ);
  const typed = await app.evalJs(POPUP);
  await app.key('Escape'); await sleep(400);
  await settle(app);
  const b6 = await board(app);
  const g1 = await app.evalJs(READ);
  ok('T1 a double-click on Gamma opens the card editor on "Gamma"; " ray+-0" typed and closed, the stored card reads "Gamma ray+-0" and the split draws it',
    !!pg && pg.open && pg.text === 'Gamma' && byId(b6, 'c3')?.text === 'Gamma ray+-0' && !!g1 && g1.cards.some((c) => c.id === 'c3' && c.words === 'Gamma ray+-0'), { popup: pg, stored: byId(b6, 'c3')?.text, drawn: g1 && g1.cards.find((c) => c.id === 'c3')?.words });
  ok('T2 the "+", "-" and "0" typed into the card editor are typed, not taken by the canvas (its scale and pan are the same before and after)',
    !!zk0 && !!zk1 && zk0.scale === zk1.scale && zk0.pan === zk1.pan && !!typed && /\+-0$/.test(typed.text || ''), { before: zk0 && [zk0.scale, zk0.pan], after: zk1 && [zk1.scale, zk1.pan], text: typed && typed.text });

  // ---- DELETE ----------------------------------------------------------------------------------------------------------------------------
  const d0 = await app.evalJs(READ);
  await tap(app, cardAt(d0, 'c1') || { x: 0, y: 0 });
  await app.key('Delete'); await sleep(400);
  const asked = await app.evalJs("!!document.querySelector('.wz-delete-dialog')");
  await app.evalJs("document.querySelector('.wz-delete-dialog .wz-delete-go')?.click(); null"); await sleep(400);
  await settle(app);
  const b7 = await board(app);
  const d1 = await app.evalJs(READ);
  const AL = byId(b7, 'c1');
  ok('D1 Alpha selected, Delete asks the Board\'s own question (the delete dialog); confirmed, Alpha is a tombstone in storage (deletedAt set, still in the board\'s boxes) and the split no longer draws it',
    asked && !!AL && !!AL.deletedAt && !!d1 && !d1.cards.some((c) => c.id === 'c1') && d1.cards.length === 3, { asked, alpha: AL && { deletedAt: AL.deletedAt }, drawn: d1 && d1.cards.map((c) => c.id) });

  // ---- UNDO ------------------------------------------------------------------------------------------------------------------------------
  await app.evalJs(focusWrap);
  await app.keyCombo('z'); await sleep(400);
  await settle(app);
  const b8 = await board(app);
  const u1 = await app.evalJs(READ);
  await app.evalJs(focusWrap);
  await app.keyCombo('z'); await sleep(400);
  await settle(app);
  const b9 = await board(app);
  const AU = byId(b8, 'c1');
  ok('U1 Ctrl+Z in the split brings Alpha back (live in storage, no deletedAt) and draws it; a second Ctrl+Z takes back the add (Delta gone); Gamma keeps "Gamma ray+-0" throughout',
    !!AU && !AU.deletedAt && !!u1 && u1.cards.some((c) => c.id === 'c1') && !live(b9).some((b) => b.text === 'Delta') && live(b8).some((b) => b.text === 'Delta')
      && byId(b8, 'c3')?.text === 'Gamma ray+-0' && byId(b9, 'c3')?.text === 'Gamma ray+-0',
    { alpha: AU && { deletedAt: AU.deletedAt ?? null }, deltaAfter1: live(b8).some((b) => b.text === 'Delta'), deltaAfter2: live(b9).some((b) => b.text === 'Delta'), gamma: [byId(b8, 'c3')?.text, byId(b9, 'c3')?.text] });

  // ---- SCOPE -----------------------------------------------------------------------------------------------------------------------------
  const k0 = await app.evalJs(READ);
  await tap(app, cardAt(k0, 'c2') || { x: 0, y: 0 });
  const kSel = await app.evalJs(READ);
  const bk0 = await app.evalJs(BOARD);
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(150);
  await app.key('Delete'); await sleep(150);
  await app.keyCombo('z'); await sleep(400);
  await settle(app);
  const bk1 = await app.evalJs(BOARD);
  const noDialog = !(await app.evalJs("!!document.querySelector('.wz-delete-dialog')"));
  await app.evalJs(focusWrap);
  await app.key('Escape'); await sleep(300);
  const kEsc = await app.evalJs(READ);
  ok('K1 with Beta selected, Delete and Ctrl+Z pressed in the page beside touch nothing on the board (stored board byte-identical); Escape in the split lets go of the card and the split stays open',
    !!kSel && kSel.cards.some((c) => c.id === 'c2' && c.sel) && bk0 === bk1 && noDialog && !!kEsc && kEsc.cards.every((c) => !c.sel) && kEsc.cards.length === kSel.cards.length,
    { selected: kSel && kSel.cards.filter((c) => c.sel).map((c) => c.id), same: bk0 === bk1, noDialog, afterEsc: kEsc && kEsc.cards.filter((c) => c.sel).map((c) => c.id), open: !!kEsc });

  // ---- LOOK ------------------------------------------------------------------------------------------------------------------------------
  const lookIn = async (v) => { await app.evalJs(press(`[data-split-view="${v}"]`)); await sleep(400);
    return app.evalJs(`(() => { const a = document.querySelector('.wz-split-asset'); if (!a) return null; return { view: ${B}?.getAttribute('data-view'), ce: a.querySelectorAll('[contenteditable="true"], [contenteditable=""]').length,
      fields: [...a.querySelectorAll('input, textarea')].filter((f) => !f.readOnly && !f.disabled).length }; })()`); };
  const lo = await lookIn('outline'), ls = await lookIn('storyboard');
  await app.evalJs(press('[data-split-view="open"]')); await sleep(300);
  ok('L1 Outline and Storyboard stay look-only after the edits (no editable field, no contenteditable in the split)',
    !!lo && lo.view === 'outline' && lo.ce === 0 && lo.fields === 0 && !!ls && ls.view === 'storyboard' && ls.ce === 0 && ls.fields === 0, { lo, ls });

  // ---- PAGE ------------------------------------------------------------------------------------------------------------------------------
  const r1 = await app.evalJs(PAGE);
  ok('K2 the page\'s rects (column, page, editor) and the editor node are the same from the split\'s opening to the end', !!r0 && r0 === r1 && (await app.evalJs(sameEditor)), { r0, r1 });
});

// ---- SOURCE ------------------------------------------------------------------------------------------------------------------------------
{
  const read = (f) => (fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '');
  const strip = (s) => s.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const s1 = (src) => {
    const code = strip(src);
    const forbidden = ['saveJournalEntry', 'setPref', 'localStorage', 'setBoardMode', 'wrizoPatchEntry'].filter((w) => code.includes(w));
    const global = /(window|document)\.addEventListener/.test(code);
    const paths = ['saveBoardBoxes(', 'stashDeletedBoxes('].filter((w) => code.includes(w));
    const gated = /getSystemKind\(/.test(code);
    return { pass: !!src && forbidden.length === 0 && !global && paths.length === 2 && gated, forbidden, global, paths, gated };
  };
  const sb = read('reorg/split/SplitBoard.tsx');
  const r = s1(sb);
  ok('S1 the split\'s Board writes the board only through saveBoardBoxes and stashDeletedBoxes (never storage, prefs, the board\'s mode or saveJournalEntry), listens on no window or document, and gates every edit on getSystemKind', r.pass, r);
  // MUT-S1: the same source with a storage write added turns S1 red (the mutant LANDED: the source changed)
  const mut = sb.replace(/\nexport function SplitBoard/, "\nconst __mut = () => localStorage.setItem('x', '1');\nexport function SplitBoard");
  ok('MUT-S1 a SplitBoard that wrote localStorage turns S1 red', mut !== sb && !s1(mut).pass, { landed: mut !== sb, mutant: s1(mut) });
  const pop = strip(read('components/board/BoardCardPopup.tsx'));
  const ed = strip(read('components/BoardEditor.tsx'));
  const docListen = /document\.addEventListener\('keydown', onKeyDown\)/.test(pop);
  const scopedProp = /\bscoped\??:\s*boolean/.test(pop);
  const boardPasses = /<BoardCardPopup[^>]*\bscoped\b/.test(ed.replace(/\n/g, ' '));
  ok('S2 the Board\'s card editor listens on the document exactly as before unless `scoped` is passed, and the Board screen passes no `scoped`', docListen && scopedProp && !boardPasses, { docListen, scopedProp, boardPasses });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 16;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-SPLIT-EDIT VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-SPLIT-EDIT VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
