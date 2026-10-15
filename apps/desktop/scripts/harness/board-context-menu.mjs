// BOARD CONTEXT MENU (Nick approved the mockup, cursor/board-context-menu @ 0df8bf30, Oct 15). Right-click a card -> its menu (Ungroup / Edit copy / Restore / Pin to a Board... where they apply, a separator,
// Delete last); right-click empty board -> New Card + Delete board; a board's tile in Drawers -> Delete board. EVERY delete (card, Page, board; menu or key) asks "Send to Trash?" - Cancel / Delete / "Don't
// ask me again" - through ONE gate; one setting, "Ask before deleting" in Settings, per device. A deleted card is a TOMBSTONE (deletedAt, in place): the Trash lists it, Restore brings it back, Ctrl+Z undoes
// it, a permanent delete leaves an id-only marker. The tombstone/merge machinery is proven BROWSERLESS in box-tombstones.mjs; this file is the surfaces.
//
//   S  source pins (browserless): the gate is the only way a delete runs (every softDeleteEntry caller outside persistence sits inside requestDelete), the Delete key goes through it, the dialog is mounted once
//   K1 right-click a plain card: the menu opens at the pointer with Delete ONLY        K2 right-click the corner square: no menu - connection mode (connector-a) as before
//   K3 a grouped card leads with Ungroup, a ported card with Edit copy; separator, then Delete; Ungroup works
//   K4 the menu is an overlay (moves nothing), keyboard-reachable, closes on Esc / outside press
//   K5 Delete -> "Send to Trash?" with Cancel / Delete / Don't ask me again; Cancel, Esc and the scrim keep the card; the dialog moves nothing behind it
//   K6 the dialog's Delete tombstones the card (stored, not removed), hides its connection and footer, toasts "Ctrl+Z"      K7 Ctrl+Z brings it back (and its connection)
//   K8 the Delete / Backspace key asks too - and is immediate once asking is off
//   K9 "Don't ask me again": ticked + Cancel saves nothing, ticked + Delete turns asking off for good, and the Settings switch turns it back on
//   K10 right-click empty board: New Card (a card at the pointer, pop-up open; empty -> discarded) and Delete board
//   K11 Delete board -> the dialog -> the board is soft-deleted and the writer leaves it      K12 a Drawers board tile's right-click -> Delete board
//   K13 the Trash board lists a deleted card (badge "Card"); its menu is Restore + Delete; Restore returns it to its board; a permanent Delete ALWAYS asks, leaves a marker, and unlists it
//   K14 system boards: a derived card has no Delete (Journal), a Shelf card offers only Pin to a Board..., and the Delete key on a derived card does not even ask
//   K15 Flux wears its own word: "Delete circuit"
//
// Seeding goes through the app's seams; input is trusted CDP mouse/key events. Needs a box turn (withHarness refuses without WS_BOX_TURN).
// Run: WS_BOX_TURN=<token> node scripts/harness/board-context-menu.mjs   (from apps/desktop, dist-web built)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const live = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

// ---- S: the source pins -----------------------------------------------------------------------------------------------------------------------------------------------------------------
function walk(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(e.name)) out.push(p); } return out; }
const callers = (srcDir, mutate = {}) => {
  const bad = [];
  for (const f of walk(srcDir)) {
    const rel = path.relative(srcDir, f).split('\\').join('/');
    if (rel === 'store/persistence.ts') continue;
    const text = live(mutate[rel] ? mutate[rel](noCR(fs.readFileSync(f, 'utf8'))) : noCR(fs.readFileSync(f, 'utf8')));
    // each `softDeleteEntry(` CALL (not an import) must sit inside a `requestDelete(` that opened earlier in the file and has not closed on its own line
    const lines = text.split('\n');
    lines.forEach((l, i) => {
      if (!/softDeleteEntry\(/.test(l) || /^\s*import\b/.test(l)) return;
      const window5 = lines.slice(Math.max(0, i - 8), i + 1).join('\n');
      if (!/requestDelete\(/.test(window5)) bad.push(`${rel}:${i + 1}`);
    });
  }
  return bad;
};
{
  const be = noCR(fs.readFileSync(path.join(SRC, 'components/BoardEditor.tsx'), 'utf8'));
  const app = noCR(fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8'));
  const bad = callers(SRC);
  ok('S1: every call of softDeleteEntry outside persistence.ts sits inside requestDelete(...) - the ONE gate: a Page, a board (menu, Plan row, Drawers tile) and a card can only be deleted through "Send to Trash?" or with asking turned off', bad.length === 0, JSON.stringify(bad));
  const mut = callers(SRC, { 'store/pageActions.ts': (t) => t.replace('onDelete: () => requestDelete(() => {', 'onDelete: () => (() => {') });
  ok('S1 (mutant): a delete that skips the gate turns the guard RED (the mutation landed)', mut.length > 0, JSON.stringify(mut));
  ok('S2: the Delete / Backspace key goes through the gate (removeSelectedRef -> requestDelete), a system board never asks, and the dialog + the menu are mounted ONCE in App',
    /removeSelectedRef\.current = \(\) => \{ if \(isSystemBoard\) return; requestDelete\(removeSelected\); \};/.test(be) && /<ContextMenuHost \/>/.test(app) && /<DeleteDialog \/>/.test(app) && (app.match(/<DeleteDialog \/>/g) || []).length === 1, '');
}

// ---- the box half -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
let boardN = 0;
const fresh = async (app, { theme } = {}) => {
  boardN += 1;
  const id = `bcm-board-${boardN}`;
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');${theme ? ` localStorage.setItem('wrizo-theme', '${theme}');` : ''}`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  const src = `bcm-src-${boardN}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: src, text: 'A source page for the ported card', createdAt: new Date().toISOString(), origin: null, source: null })})`);
  const boxes = [
    { id: 'bcm-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.12, z: 1, text: 'Card A' },
    { id: 'bcm-b', kind: 'text', x: 0.5, y: 0.05, w: 0.2, h: 0.12, z: 2, text: 'Card B' },
    { id: 'bcm-g1', kind: 'text', x: 0.05, y: 0.3, w: 0.2, h: 0.12, z: 3, text: 'Grouped one', groupId: 'bcm-grp' },
    { id: 'bcm-g2', kind: 'text', x: 0.3, y: 0.3, w: 0.2, h: 0.12, z: 4, text: 'Grouped two', groupId: 'bcm-grp' },
    { id: 'bcm-p', kind: 'text', x: 0.55, y: 0.3, w: 0.2, h: 0.12, z: 5, text: 'Ported card', sourceEntryId: src },
    { id: 'bcm-ab', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 6, connA: 'bcm-a', connB: 'bcm-b' },
  ];
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Menu board', pageType: 'board', boxes, createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"bcm-a\"]')", { label: 'the board', timeout: 9000 });
  await sleep(900);
  return { there, id, src };
};
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
const pointIn = async (app, sel, fx = 0.3, fy = 0.3) => { const r = await R(app, sel); return r ? { x: Math.round(r.l + r.w * fx), y: Math.round(r.t + r.h * fy) } : null; };
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const rightClick = async (app, x, y) => {
  await app.mouseMove(x, y);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'right', buttons: 2, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'right', buttons: 0, clickCount: 1, pointerType: 'mouse' });
  await sleep(250);
};
const menuItems = (app) => app.evalJs("(() => { const m = document.querySelector('.wz-ctx'); if (!m) return null; return [...m.children].map((c) => (c.classList.contains('wz-ctx-sep') ? '---' : c.textContent.trim())); })()");
const pick = (app, label) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-ctx-item')].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); if (!b) return false; b.click(); return true; })()`);
const dialog = (app) => app.evalJs(`(() => { const d = document.querySelector('.wz-delete-dialog'); if (!d) return null; return { title: d.querySelector('.wz-delete-title')?.textContent || null, buttons: [...d.querySelectorAll('.wz-delete-btn')].map((b) => b.textContent.trim()), dontAsk: d.querySelector('.wz-delete-chk')?.textContent.trim() || null, focused: document.activeElement?.textContent?.trim() || null }; })()`);
const dlgClick = (app, which) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(which === 'go' ? '.wz-delete-go' : '.wz-delete-btn:not(.wz-delete-go)')}); if (!b) return false; b.click(); return true; })()`);
const stored = (app, id) => app.evalJs(`window.wrizoStoredBoxes(${JSON.stringify(id)})`);
const liveIds = (app) => app.evalJs("(window.wrizoBoard() || []).map((b) => b.id)");
const ask = (app, v) => app.evalJs(v === undefined ? 'window.wrizoAskBeforeDelete.get()' : `window.wrizoAskBeforeDelete.set(${v})`);
const canvasRect = (app) => R(app, '.board-canvas');
const select = async (app, id) => { const p = await pointIn(app, `[data-box-id="${id}"]`, 0.3, 0.3); await click(app, p.x, p.y); await sleep(500); };
const footer = (app, id) => app.evalJs(`document.querySelector('[data-box-id="${id}"] .board-card-footer')?.textContent ?? null`);

await withHarness(async (app) => {
  // ============================================================ K1 / K2 / K3 / K4 the card menu
  let f = await fresh(app);
  ok('fixture: the board opened (plain, grouped and ported cards, one link)', f.there, JSON.stringify(f));
  const canvas0 = await canvasRect(app);
  const pa = await pointIn(app, '[data-box-id="bcm-a"]');
  await rightClick(app, pa.x, pa.y);
  const m1 = await menuItems(app); const mr = await R(app, '.wz-ctx');
  ok('K1: a right-click on a plain card opens the small menu AT the pointer with Delete only, and selects the card',
    JSON.stringify(m1) === JSON.stringify(['Delete']) && !!mr && Math.abs(mr.l - pa.x) <= 4 && Math.abs(mr.t - pa.y) <= 4 && (await app.evalJs("document.querySelector('[data-box-id=\"bcm-a\"]').dataset.selected")) === 'true', JSON.stringify({ m1, mr, pa }));
  const canvas1 = await canvasRect(app);
  ok('K4: the menu is an overlay - the canvas rect is identical with it open (page primacy)', JSON.stringify(canvas0) === JSON.stringify(canvas1), JSON.stringify({ canvas0, canvas1 }));
  await app.key('Escape'); await sleep(200);
  ok('K4: Esc closes it', (await menuItems(app)) === null, '');
  await rightClick(app, pa.x, pa.y);
  await click(app, 8, 8); await sleep(200);
  ok('K4: a press outside closes it', (await menuItems(app)) === null, '');
  // K2: the corner square of the selected card is connection mode, not the menu
  await select(app, 'bcm-a');
  const h = await R(app, '[data-box-id="bcm-a"] .board-handle');
  if (!h) ok('K2: the selected card shows its corner square', false, 'absent');
  else {
    const hx = Math.round(h.l + h.w / 2), hy = Math.round(h.t + h.h / 2);
    await app.mouseMove(hx, hy);
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: hx, y: hy, button: 'right', buttons: 2, clickCount: 1, pointerType: 'mouse' });
    await sleep(150);
    const armed = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hx, y: hy, button: 'right', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(250);
    ok('K2: a right-click on the corner square is CONNECTION MODE (armed) and opens NO menu - connector-a is untouched', armed === 'true' && (await menuItems(app)) === null, JSON.stringify({ armed }));
    await app.key('Escape'); await sleep(300);
  }
  // K3: grouped / ported
  const pg = await pointIn(app, '[data-box-id="bcm-g1"]');
  await rightClick(app, pg.x, pg.y);
  const mg = await menuItems(app);
  ok('K3: a GROUPED card\'s menu leads with Ungroup, then a separator, then Delete', JSON.stringify(mg) === JSON.stringify(['Ungroup', '---', 'Delete']), JSON.stringify(mg));
  await pick(app, 'Ungroup'); await sleep(300);
  const grouped = (await app.evalJs('window.wrizoBoard()')).filter((b) => b.groupId).length;
  ok('K3: Ungroup does its act - no card is grouped any more', grouped === 0, String(grouped));
  const pp = await pointIn(app, '[data-box-id="bcm-p"]');
  await rightClick(app, pp.x, pp.y);
  const mp = await menuItems(app);
  ok('K3: a PORTED text card\'s menu leads with Edit copy, a separator, then Delete', JSON.stringify(mp) === JSON.stringify(['Edit copy', '---', 'Delete']), JSON.stringify(mp));
  await app.key('Escape'); await sleep(200);

  // ============================================================ K5 / K6 / K7 the dialog, the tombstone, Ctrl+Z
  f = await fresh(app);
  const a0 = await pointIn(app, '[data-box-id="bcm-a"]');
  const cv0 = await canvasRect(app);
  await rightClick(app, a0.x, a0.y); await pick(app, 'Delete'); await sleep(350);
  const d1 = await dialog(app); const cv1 = await canvasRect(app);
  ok('K5: Delete opens "Send to Trash?" with Cancel / Delete and a "Don\'t ask me again" checkbox, focus on Cancel, and the card is still there', !!d1 && d1.title === 'Send to Trash?' && JSON.stringify(d1.buttons) === JSON.stringify(['Cancel', 'Delete']) && d1.dontAsk === "Don't ask me again" && d1.focused === 'Cancel' && (await liveIds(app)).includes('bcm-a'), JSON.stringify(d1));
  ok('K5: the dialog moves nothing behind it (the canvas rect is identical)', JSON.stringify(cv0) === JSON.stringify(cv1), '');
  await dlgClick(app, 'cancel'); await sleep(250);
  ok('K5: Cancel closes it and keeps the card', (await dialog(app)) === null && (await liveIds(app)).includes('bcm-a'), '');
  await rightClick(app, a0.x, a0.y); await pick(app, 'Delete'); await sleep(300); await app.key('Escape'); await sleep(250);
  ok('K5: Esc cancels it too', (await dialog(app)) === null && (await liveIds(app)).includes('bcm-a'), '');
  await rightClick(app, a0.x, a0.y); await pick(app, 'Delete'); await sleep(300);
  await click(app, 6, 6); await sleep(250);
  ok('K5: a press on the scrim cancels it', (await dialog(app)) === null && (await liveIds(app)).includes('bcm-a'), '');
  // K6
  await rightClick(app, a0.x, a0.y); await pick(app, 'Delete'); await sleep(300);
  await dlgClick(app, 'go'); await sleep(500);
  const sA = (await stored(app, f.id)).find((b) => b.id === 'bcm-a');
  const toast = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
  ok('K6: the dialog\'s Delete REMOVES the card from the board - and STORES it as a tombstone (deletedAt + updatedAt), not a removal', !(await liveIds(app)).includes('bcm-a') && !!sA && !!sA.deletedAt && sA.updatedAt === sA.deletedAt, JSON.stringify(sA));
  ok('K6: a toast names Ctrl+Z', !!toast && /Ctrl\+Z/.test(toast), String(toast));
  ok('K6: the card\'s connection goes with it - Card B no longer shows "grafted to: Card A" - and the connection box is still stored (it returns with the card)', (await footer(app, 'bcm-b')) === null && (await stored(app, f.id)).some((b) => b.id === 'bcm-ab' && !b.deletedAt), String(await footer(app, 'bcm-b')));
  // K7
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', modifiers: 2, key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90 });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', modifiers: 2, key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90 });
  await sleep(500);
  const sA2 = (await stored(app, f.id)).find((b) => b.id === 'bcm-a');
  ok('K7: Ctrl+Z brings the card BACK - on the board and live in storage (no deletedAt, stamped newer) - and its link and footer return with it', (await liveIds(app)).includes('bcm-a') && !!sA2 && !sA2.deletedAt && !!sA2.updatedAt && !!(await footer(app, 'bcm-b')), JSON.stringify({ sA2, footerB: await footer(app, 'bcm-b') }));

  // ============================================================ K8 / K9 the key; "Don't ask me again"; the Settings switch
  await select(app, 'bcm-b');
  await app.key('Delete'); await sleep(350);
  const dk = await dialog(app);
  ok('K8: the Delete key ASKS ("Send to Trash?") - it does not delete at once', !!dk && dk.title === 'Send to Trash?' && (await liveIds(app)).includes('bcm-b'), JSON.stringify(dk));
  await dlgClick(app, 'cancel'); await sleep(250);
  await app.key('Backspace'); await sleep(350);
  ok('K8: so does Backspace', !!(await dialog(app)) && (await liveIds(app)).includes('bcm-b'), '');
  // K9: tick + Cancel saves nothing
  await app.evalJs("document.querySelector('.wz-delete-chk input').click()");
  await dlgClick(app, 'cancel'); await sleep(250);
  ok('K9: "Don\'t ask me again" ticked and then CANCELLED saves nothing - asking stays on', (await ask(app)) === true, String(await ask(app)));
  // tick + Delete turns asking off
  await app.key('Delete'); await sleep(350);
  await app.evalJs("document.querySelector('.wz-delete-chk input').click()");
  await dlgClick(app, 'go'); await sleep(450);
  ok('K9: ticked and CONFIRMED, asking turns OFF for good (per device) and the card is deleted', (await ask(app)) === false && !(await liveIds(app)).includes('bcm-b'), String(await ask(app)));
  await select(app, 'bcm-p');
  await app.key('Delete'); await sleep(400);
  ok('K8: with asking OFF the Delete key is immediate - no dialog, the card is gone', (await dialog(app)) === null && !(await liveIds(app)).includes('bcm-p'), '');
  // the Settings switch turns it back on
  const opened = await app.evalJs("(() => { const b = document.querySelector('.wz-strip-item[data-category=settings]'); if (!b) return false; b.click(); return true; })()");
  await sleep(450);
  const sw0 = await app.evalJs("document.querySelector('.wz-cascade-switch')?.getAttribute('aria-checked') ?? null");
  await app.evalJs("document.querySelector('.wz-cascade-switch')?.click()"); await sleep(250);
  const sw1 = await app.evalJs("document.querySelector('.wz-cascade-switch')?.getAttribute('aria-checked') ?? null");
  ok('K9: Settings carries "Ask before deleting" as a switch - OFF now - and pressing it turns asking back ON', opened && sw0 === 'false' && sw1 === 'true' && (await ask(app)) === true, JSON.stringify({ opened, sw0, sw1 }));
  const label = await app.evalJs("document.querySelector('.wz-cascade-switch')?.textContent.trim() ?? null");
  ok('K9: its label reads "Ask before deleting"', label === 'Ask before deleting', String(label));

  // ============================================================ K10 / K11 the empty-board menu
  f = await fresh(app);
  const ep = await app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
    for (let y = r.top + 280; y < Math.min(r.bottom, innerHeight - 120); y += 25) for (let x = r.left + 40; x < r.right - 60; x += 25) if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) };
    return null; })()`);
  if (!ep) ok('K10 fixture: an empty point on the board exists', false, 'none');
  else {
    await rightClick(app, ep.x, ep.y);
    const me = await menuItems(app);
    ok('K10: a right-click on empty board offers New Card and Delete board', JSON.stringify(me) === JSON.stringify(['New Card', 'Delete board']), JSON.stringify(me));
    const before = (await liveIds(app)).length;
    await pick(app, 'New Card'); await sleep(450);
    const nc = (await app.evalJs('window.wrizoBoard()')).find((b) => b.kind === 'text' && !b.text && b.id !== undefined);
    const ncr = nc ? await R(app, `[data-box-id="${nc.id}"]`) : null;
    ok('K10: New Card makes a card AT the pointer and opens its pop-up', (await liveIds(app)).length === before + 1 && !!ncr && Math.abs(ncr.l - ep.x) <= 6 && Math.abs(ncr.t - ep.y) <= 6 && !!(await app.evalJs("!!document.querySelector('.board-popup')")), JSON.stringify({ ncr, ep }));
    await app.key('Escape'); await sleep(500);
    ok('K10: closed while still empty, that card is discarded', (await liveIds(app)).length === before, String((await liveIds(app)).length));
    // K11
    await rightClick(app, ep.x, ep.y); await pick(app, 'Delete board'); await sleep(350);
    const db = await dialog(app);
    ok('K11: Delete board asks "Send to Trash?" first', !!db && db.title === 'Send to Trash?', JSON.stringify(db));
    await dlgClick(app, 'go'); await sleep(700);
    const row = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(f.id)}) || {})`);
    ok('K11: after Delete the board is soft-deleted (deletedAt stamped, its cards untouched) and the writer has LEFT it', !!row.deletedAt && (row.boxes || []).length === 6 && !(await app.evalJs("!!document.querySelector('.board-canvas')")), JSON.stringify({ deletedAt: row.deletedAt, n: (row.boxes || []).length }));
  }

  // ============================================================ K12 Drawers
  f = await fresh(app);
  await app.evalJs("document.querySelector('.wz-strip-item[data-category=drawers]')?.click()");
  await sleep(500);
  const tile = await app.evalJs(`(() => { const t = [...document.querySelectorAll('.wz-drawers-tile')].find((b) => b.textContent.includes('Menu board')); if (!t) return null; const r = t.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  if (!tile) ok('K12 fixture: the board\'s tile is in the Drawers panel', false, 'absent');
  else {
    await rightClick(app, tile.x, tile.y);
    const mt = await menuItems(app);
    ok('K12: a board tile\'s right-click offers Delete board', JSON.stringify(mt) === JSON.stringify(['Delete board']), JSON.stringify(mt));
    await pick(app, 'Delete board'); await sleep(350);
    ok('K12: and asks "Send to Trash?"', !!(await dialog(app)), '');
    await dlgClick(app, 'go'); await sleep(700);
    const row2 = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(f.id)}) || {})`);
    ok('K12: the board is soft-deleted and its tile is gone from the panel', !!row2.deletedAt && !(await app.evalJs("[...document.querySelectorAll('.wz-drawers-tile')].some((b) => b.textContent.includes('Menu board'))")), JSON.stringify({ deletedAt: row2.deletedAt }));
  }

  // ============================================================ K13 the Trash
  f = await fresh(app);
  await ask(app, false);
  await select(app, 'bcm-a');
  await app.key('Delete'); await sleep(500);
  await app.evalJs('window.wrizoFlushNow()');
  await app.goto('/trash');
  await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'the Trash board', timeout: 9000 });
  await sleep(700);
  const tcard = await app.evalJs(`(() => { const b = (window.wrizoBoard() || []).find((x) => x.trashedFrom); if (!b) return null; const el = document.querySelector('[data-box-id="' + b.id + '"]'); return { id: b.id, from: b.trashedFrom, text: el ? el.textContent : null }; })()`);
  ok('K13: the Trash board lists the deleted CARD - badge "Card", its words, and where it came from', !!tcard && tcard.from.boxId === 'bcm-a' && /Card/.test(tcard.text || '') && /Card A/.test(tcard.text || ''), JSON.stringify(tcard));
  if (tcard) {
    const pt = await pointIn(app, `[data-box-id="${tcard.id}"]`);
    await rightClick(app, pt.x, pt.y);
    const mtr = await menuItems(app);
    ok('K13: its menu is Restore, a separator, Delete', JSON.stringify(mtr) === JSON.stringify(['Restore', '---', 'Delete']), JSON.stringify(mtr));
    await pick(app, 'Restore'); await sleep(600);
    const back = (await stored(app, f.id)).find((b) => b.id === 'bcm-a');
    ok('K13: Restore brings the card back to its board (storage: live, stamped) and it leaves the Trash', !!back && !back.deletedAt && !!back.updatedAt && !(await app.evalJs("(window.wrizoBoard() || []).some((x) => x.trashedFrom)")), JSON.stringify(back));
    await app.evalJs(`location.hash = '#/page/${f.id}'`);
    await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"bcm-a\"]')", { label: 'the card is back on its board', timeout: 6000 });
    ok('K13: and it is on the board again (drawn, with its link)', !!(await R(app, '[data-box-id="bcm-a"]')), '');
    // permanent
    await select(app, 'bcm-a');
    await app.key('Delete'); await sleep(500);
    await app.evalJs('window.wrizoFlushNow()');
    await app.goto('/trash');
    await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'the Trash board again', timeout: 9000 });
    await sleep(700);
    const t2 = await app.evalJs(`(() => { const b = (window.wrizoBoard() || []).find((x) => x.trashedFrom); return b ? b.id : null; })()`);
    if (!t2) ok('K13 fixture: the card is in the Trash again', false, 'absent');
    else {
      const pt2 = await pointIn(app, `[data-box-id="${t2}"]`);
      await rightClick(app, pt2.x, pt2.y);
      await pick(app, 'Delete'); await sleep(350);
      const dp = await dialog(app);
      ok('K13: a PERMANENT delete asks even with asking turned OFF (it is the one that cannot be undone) - and asks "Delete for good?"', !!dp && dp.title === 'Delete for good?' && (await ask(app)) === false, JSON.stringify(dp));
      await dlgClick(app, 'go'); await sleep(600);
      const mark = (await stored(app, f.id)).find((b) => b.id === 'bcm-a');
      ok('K13: it leaves an id-only marker (purgedAt, no words) and is gone from the Trash', !!mark && !!mark.purgedAt && !mark.text && !(await app.evalJs("(window.wrizoBoard() || []).some((x) => x.trashedFrom)")), JSON.stringify(mark));
    }
  }

  // ============================================================ K14 system boards
  await fresh(app);
  await app.evalJs("window.wrizoCreateJournalPage(" + JSON.stringify({ id: 'bcm-journal-page', text: 'A journal page', createdAt: new Date().toISOString(), origin: 'journal', source: 'page' }) + ")");
  await sleep(450);
  await app.evalJs("location.hash = '#/journal'");
  await waitSoft(app, "!!document.querySelector('.board-canvas .board-box')", { label: 'the Journal board with a card', timeout: 9000 });
  await sleep(700);
  const jc = await app.evalJs("(() => { const e = document.querySelector('.board-canvas .board-box'); return e ? e.dataset.boxId : null; })()");
  if (!jc) ok('K14 fixture: the Journal board has a card', false, 'none');
  else {
    const jp = await pointIn(app, `[data-box-id="${jc}"]`);
    await rightClick(app, jp.x, jp.y);
    const mj = await menuItems(app);
    ok('K14: a derived card on the Journal board has NO Delete (its menu is absent)', mj === null || !mj.includes('Delete'), JSON.stringify(mj));
    await app.key('Escape'); await sleep(200);
    await select(app, jc);
    await app.key('Delete'); await sleep(350);
    ok('K14: and the Delete key on it does not even ask', (await dialog(app)) === null, '');
  }

  // ============================================================ K15 Flux
  f = await fresh(app, { theme: 'flux' });
  const fx = await app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
    for (let y = r.top + 280; y < Math.min(r.bottom, innerHeight - 120); y += 25) for (let x = r.left + 40; x < r.right - 60; x += 25) if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) };
    return null; })()`);
  if (!fx) ok('K15 fixture: an empty point on the Flux board', false, 'none');
  else { await rightClick(app, fx.x, fx.y); ok('K15: Flux wears its own word - "Delete circuit"', JSON.stringify(await menuItems(app)) === JSON.stringify(['New Card', 'Delete circuit']), JSON.stringify(await menuItems(app))); }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nBOARD-CONTEXT-MENU VERIFY: PASS (${checks.length} checks)` : `\nBOARD-CONTEXT-MENU VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
