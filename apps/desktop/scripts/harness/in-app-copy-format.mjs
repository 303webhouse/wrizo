// IN-APP-COPY-FORMAT, THE COPY HALF (Nick's ruling, Oct 16; plan docs/in-app-copy-format-plan.md @ f2a9f956; Fable: build the copy half on
// typed-literal - Q1 = B, ONE deploy with it; Q2 as leaned; Q3 = struck Free Write text left out; Nick confirmed Q1 and Q3, 12:38 pm).
// A copy from a writing surface writes the PLAIN characters for other apps and Wrizo's own markup beside them. Before this, a copy was
// native: the hidden marks and typed-literal's escape backslashes are hidden with font-size 0, never display:none, so they were COPIED -
// a typed `*sigh*` reached an email as `\*sigh\*`. The text rules are pinned browserlessly (scripts/in-app-copy-format-check.mjs); this
// file proves the doors with trusted keys (a keyDown carrying `commands: ['copy' | 'cut' | 'paste']`, the browser's own clipboard):
//   K1  Draft, select all: the clipboard's plain text has no mark, no escape, no structure token; Wrizo's envelope carries the stored text;
//       and the REAL clipboard (pasted into a plain textarea) holds exactly that plain text
//   K2  Draft, a selection that cuts a bold run: the envelope closes the run at the cut; the plain text is the selected words
//   K3  Draft, a CUT through a bold run's middle: the same two formats; the run is cut cleanly (no mark shown), one undo restores it
//   K4  Free Write: the plain text leaves out the struck letters (Q3) and shows the typed star as a star
//   K5  the card pop-up: the same two formats
// Run: node scripts/harness/in-app-copy-format.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const CE = '.board-popup-editor';
const MIME = 'application/x-wrizo-fragment';
const B = String.fromCharCode(92);   // one backslash, built rather than escaped (a cooked template eats `\*`)
const ZW = String.fromCharCode(0x200b);
const unz = (s) => (typeof s === 'string' ? s.split(ZW).join('') : s);

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded by the checks */ }
};
const openPage = async (app, id, text, modeKey) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' }).then(() => true, () => false);
  if (!up) return false;
  await sleep(500);
  const tab = await app.evalJs(`(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key="${modeKey}"]'); if (!b) return false; b.click(); return true; })()`);
  await sleep(900);
  return tab;
};
const openCard = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Card board', pageType: 'board', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page',
    boxes: [{ id: `${id}-c`, kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.16, z: 1, text }] })})`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('[data-box-id="${id}-c"]')`, { label: 'the card' }).then(() => true, () => false);
  if (!up) return false;
  await sleep(600);
  const c = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="${id}-c"]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const m = (type, n, b) => app.cdp('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', buttons: b, clickCount: n, pointerType: 'mouse' });
  await m('mousePressed', 1, 1); await m('mouseReleased', 1, 0); await sleep(60); await m('mousePressed', 2, 1); await m('mouseReleased', 2, 0);
  return app.waitFor(`!!document.querySelector('${CE}')`, { label: 'card popup' }).then(() => true, () => false);
};
// a key as the browser performs it: a keyDown carrying its editing command (a rawKeyDown performs none)
const command = (app, k, code, vk, cmd) => app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 2, commands: [cmd] })
  .then(() => app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 2 }));
const copyKey = (app) => command(app, 'c', 'KeyC', 67, 'copy');
const cutKey = (app) => command(app, 'x', 'KeyX', 88, 'cut');
// what the copy put on the clipboard, read in the event itself by a listener on the window (it runs after the surface's own), and
// whether the surface took the copy over (a native copy is not prevented, and its data is not readable here: it reads empty)
const armCapture = (app) => app.evalJs(`(() => { window.__wzCap = null; if (window.__wzCapOn) return true; window.__wzCapOn = true;
  const rec = (e) => { const d = e.clipboardData; window.__wzCap = { type: e.type, prevented: e.defaultPrevented, plain: d ? d.getData('text/plain') : null, wrizo: d ? d.getData('${MIME}') : null, html: d ? d.getData('text/html') : null }; };
  window.addEventListener('copy', rec); window.addEventListener('cut', rec); return true; })()`);
const captured = async (app) => {
  const c = await app.evalJs('window.__wzCap');
  let env = null;
  try { env = c && c.wrizo ? JSON.parse(c.wrizo) : null; } catch { env = 'unparseable'; }
  return { ...(c || {}), env };
};
// the REAL clipboard: paste it into a plain textarea (no Voice Wall there) and read what arrived
const realClipboard = async (app) => {
  await app.evalJs("(() => { const t = document.createElement('textarea'); t.id = 'wz-clip-probe'; t.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:60px;z-index:99999'; document.body.appendChild(t); t.focus(); return true; })()");
  await command(app, 'v', 'KeyV', 86, 'paste');
  await sleep(250);
  return app.evalJs("(() => { const t = document.getElementById('wz-clip-probe'); const v = t ? t.value : null; if (t) t.remove(); return v; })()");
};
// select the VISIBLE characters [from, to) - text outside every hidden mark - with the editor focused
const selectVisible = (app, sel, from, to) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); if (!ed) return false; ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let n, acc = 0, a = null, b = null;
  while ((n = w.nextNode())) { if (n.parentElement && n.parentElement.closest('.md-mark-hidden')) continue; const d = n.data.split('\\u200b').join('').length === n.data.length ? n.data : null; if (d === null) continue;
    if (!a && acc + d.length > ${from}) a = [n, ${from} - acc]; if (!b && acc + d.length >= ${to}) b = [n, ${to} - acc]; acc += d.length; }
  if (!a || !b) return false; const s = getSelection(); s.setBaseAndExtent(a[0], a[1], b[0], b[1]); return !s.isCollapsed; })()`);
const selectAll = async (app, sel) => { await app.evalJs(`document.querySelector('${sel}')?.focus()`); await app.keyCombo('a'); await sleep(200); return app.evalJs('!getSelection().isCollapsed'); };
const pageText = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const settledBy = async (read) => { await sleep(2600); let last = await read(); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = await read(); same = n === last ? same + 1 : 0; last = n; } return last; };
const seen = (app, sel) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); if (!ed) return null; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, out = '';
  while ((n = w.nextNode())) { if (!(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) out += n.data; }
  return { visible: out.split('\\u200b').join(''), bold: ed.querySelectorAll('.md-bold').length, shownMarks: [...ed.querySelectorAll('.md-mark')].filter(m => !m.classList.contains('md-mark-hidden')).length }; })()`);
const twoFormats = (c, plain, fragment) => !!c && c.prevented === true && c.plain === plain && !!c.env && c.env.v === 1 && c.env.text === fragment && c.env.plain === plain && !c.html;

await withHarness(async (app) => {
  // ---- K1: Draft, select all
  const PAGE1 = `Plain **bold** and ${B}*sigh${B}*\n# Head line`;
  const PLAIN1 = 'Plain bold and *sigh*\nHead line';
  const d1 = await openPage(app, 'cf1', PAGE1, 'draft');
  ok('K1 (setup): the page opens in Draft', d1);
  if (d1) {
    await armCapture(app);
    const selected = await selectAll(app, ED);
    ok('K1 (driver): select-all made a selection', selected);
    await copyKey(app); await sleep(250);
    const c1 = await captured(app);
    ok('K1: a copy from Draft writes the PLAIN characters (no `**`, no escape backslash, no `# `) and Wrizo\'s envelope with the stored text beside it - no HTML',
      twoFormats(c1, PLAIN1, PAGE1), JSON.stringify(c1));
    const real = await realClipboard(app);
    ok('K1: ...and the real clipboard, pasted into a plain text box, holds exactly the plain characters - a typed `*sigh*` reaches another app as `*sigh*`',
      real === PLAIN1, JSON.stringify(real));
  }

  // ---- K2: Draft, a selection that cuts a run
  const d2 = await openPage(app, 'cf2', PAGE1, 'draft');
  if (d2) {
    await armCapture(app);
    const v = 'Plain bold and *sigh*';
    const selected = await selectVisible(app, ED, v.indexOf('ld'), v.indexOf('*si') + 3);
    ok('K2 (driver): the selection "ld and *si" was made', selected);
    await copyKey(app); await sleep(250);
    const c2 = await captured(app);
    ok('K2: a selection that starts inside a bold run copies the run closed at the cut, and the plain text is the selected words',
      twoFormats(c2, 'ld and *si', `**ld** and ${B}*si`), JSON.stringify(c2));
  }

  // ---- K3: Draft, a cut through a bold run's middle
  const PAGE3 = 'One **bold words** two';
  const d3 = await openPage(app, 'cf3', PAGE3, 'draft');
  ok('K3 (setup): the page opens in Draft', d3);
  if (d3) {
    await armCapture(app);
    const v = 'One bold words two';
    const selected = await selectVisible(app, ED, v.indexOf('ld wo'), v.indexOf('ld wo') + 5);
    ok('K3 (driver): the selection "ld wo" was made', selected);
    await cutKey(app); await sleep(400);
    const c3 = await captured(app);
    ok('K3: a cut writes the same two formats', twoFormats(c3, 'ld wo', '**ld wo**') && c3.type === 'cut', JSON.stringify(c3));
    const s3 = await seen(app, ED);
    const st3 = await settledBy(() => pageText(app, 'cf3'));
    ok('K3: ...and cuts the words out cleanly: the run closes over what is left, no mark is shown, and that is what is stored',
      !!s3 && s3.visible === 'One bords two' && s3.bold === 1 && s3.shownMarks === 0 && unz(st3) === 'One **bords** two', JSON.stringify({ s3, st3 }));
    await app.evalJs(`document.querySelector('${ED}')?.focus()`);
    await app.keyCombo('z'); await sleep(400);
    const st3u = await settledBy(() => pageText(app, 'cf3'));
    ok('K3: one undo puts the cut words back', unz(st3u) === PAGE3, JSON.stringify(st3u));
  }

  // ---- K4: Free Write - the struck letters are left out (Q3)
  const d4 = await openPage(app, 'cf4', `Keep ${B}*it${B}*`, 'freewrite');
  ok('K4 (setup): the page opens in Free Write', d4);
  if (d4) {
    await app.evalJs(`document.querySelector('${ED}')?.focus()`);
    await app.typeKeys(' word');
    await app.key('Backspace'); await sleep(400);
    const struck = await app.evalJs(`document.querySelectorAll('${ED} .fo-struck').length`);
    ok('K4 (driver): the Backspace struck a letter (the runway strikes, never erases)', struck >= 1, String(struck));
    await armCapture(app);
    const selected = await selectAll(app, ED);
    ok('K4 (driver): select-all made a selection', selected);
    await copyKey(app); await sleep(250);
    const c4 = await captured(app);
    ok('K4: a copy from Free Write leaves the struck letter out of both formats (Q3) and shows the typed star as a star',
      twoFormats(c4, 'Keep *it* wor', `Keep ${B}*it${B}* wor`), JSON.stringify(c4));
  }

  // ---- K5: the card pop-up
  const CARD = `Card **bold** ${B}*lit${B}*`;
  const d5 = await openCard(app, 'cf5', CARD);
  ok('K5 (setup): a real double-click opens the card pop-up', d5);
  if (d5) {
    await armCapture(app);
    const selected = await selectAll(app, CE);
    ok('K5 (driver): select-all made a selection', selected);
    await copyKey(app); await sleep(250);
    const c5 = await captured(app);
    ok('K5: a copy from the card writes the plain characters and the stored markup', twoFormats(c5, 'Card bold *lit*', CARD), JSON.stringify(c5));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nIN-APP-COPY-FORMAT VERIFY: PASS (${checks.length} checks)` : `\nIN-APP-COPY-FORMAT VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
