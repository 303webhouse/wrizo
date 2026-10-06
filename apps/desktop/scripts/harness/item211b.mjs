// ITEM 211, THE OWNER'S QUEUE (FIX, 2026-10-06), in the browser with real keys.
//   CARD    the board card popup runs the page's editing rules (store/hiddenMarksEditing.ts) and its interim reveal-at-marker rule is
//           retired: no mark shows at any caret; arrows step over hidden marks; Backspace at a styled word's start never takes a lone
//           star; deleting a whole styled word leaves no empty pair; Enter inside a styled run closes and reopens it.
//   ITALIC  Italic (Ctrl+I) at a bare caret writes nothing - an empty italic `**` read as a lone bold marker and stayed on the page -
//           and the next letter typed there is italic; moving away first leaves the text exactly as it was.
//   WORD    Ctrl+Backspace / Ctrl+Delete delete a word as the writer sees it, marks included, never leaving a lone or empty pair.
// Run: node scripts/harness/item211b.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const CE = '.board-popup-editor';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const openDraft = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
  await sleep(600);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  await app.click('Draft'); await sleep(900);
};
const openCard = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Card board', pageType: 'board', createdAt: '2026-04-01T00:00:00.000Z', origin: null,
    boxes: [{ id: `${id}-c`, kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.16, z: 1, text }] })})`);
  await sleep(600);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);
  await app.evalJs(`(() => { const el = document.querySelector('[data-box-id="${id}-c"]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()`);
  return app.waitFor(`!!document.querySelector('${CE}')`, { label: 'card popup' }).then(() => true, () => false);
};
const caretAt = (app, sel, off) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0, node = null, o = 0;
  while ((n = w.nextNode())) { const hidden = n.parentElement && n.parentElement.closest('.md-mark-hidden'); if (acc + n.data.length >= ${off} && !(hidden && acc + n.data.length > ${off} && acc < ${off})) { node = n; o = ${off} - acc; if (!hidden) break; } acc += n.data.length; }
  if (!node) return false; const r = document.createRange(); r.setStart(node, o); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
const offOf = (app, sel) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); const s = getSelection(); if (!s.rangeCount || !ed.contains(s.anchorNode)) return null; const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset); return r.toString().length; })()`);
const shown = (app, sel) => app.evalJs(`[...document.querySelectorAll('${sel} .md-mark')].filter(m => !m.classList.contains('md-mark-hidden') && /^[*_~#]/.test(m.textContent)).map(m => m.textContent)`);
const kev = (app, type, o) => app.cdp('Input.dispatchKeyEvent', { type, ...o });
const KEYS = { Backspace: 8, Delete: 46, ArrowLeft: 37, ArrowRight: 39, Enter: 13 };
const key = async (app, k, mods = 0) => { const p = { key: k, code: k, windowsVirtualKeyCode: KEYS[k], nativeVirtualKeyCode: KEYS[k], modifiers: mods }; await kev(app, 'rawKeyDown', p); await kev(app, 'keyUp', p); await sleep(200); };
const pageText = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const cardText = (app, id) => app.evalJs(`((JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).boxes||[])[0]?.text ?? null`);
const settledBy = async (read) => { await sleep(2600); let last = await read(); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = await read(); same = n === last ? same + 1 : 0; last = n; } return last; };

await withHarness(async (app) => {
  // ======================== CARD ========================
  const T = 'Start **BOLD** end';
  if (await openCard(app, 'c1', T)) {
    await sleep(300);
    await caretAt(app, CE, 0);
    const walk = [];
    for (let i = 0; i < 16; i += 1) { await key(app, 'ArrowRight'); walk.push({ off: await offOf(app, CE), shown: (await shown(app, CE)).length }); }
    ok('CARD: walking the caret right along the card shows NO mark at any stop (the interim reveal-at-marker rule is retired)', walk.every((w) => w.shown === 0), JSON.stringify(walk));
    const stops = walk.map((w) => w.off);
    ok('CARD: the arrows never stop on a hidden mark - no stop at 7 (between the two opening stars) or 13 (between the closing ones)', !stops.includes(7) && !stops.includes(13), JSON.stringify(stops));
    await caretAt(app, CE, 8);   // before B: the visible start of the bold word
    await key(app, 'Backspace');
    const t1 = await settledBy(() => cardText(app, 'c1'));
    ok('CARD: Backspace at a bold word\'s start deletes the SPACE before it, never one of its hidden stars', t1 === 'Start**BOLD** end', JSON.stringify(t1));
  } else ok('CARD (setup): the card popup opened', false);

  if (await openCard(app, 'c2', 'a **bo** z')) {
    await sleep(300);
    await caretAt(app, CE, 6);   // after "bo"
    await key(app, 'Backspace'); await key(app, 'Backspace');
    const t2 = await settledBy(() => cardText(app, 'c2'));
    ok('CARD: deleting a whole bold word letter by letter leaves NO empty pair behind (no `****`)', t2 === 'a  z', JSON.stringify(t2));
  } else ok('CARD (setup): the second card popup opened', false);

  if (await openCard(app, 'c3', 'x **abcd** y')) {
    await sleep(300);
    await caretAt(app, CE, 6);   // between b and c
    await key(app, 'Enter');
    const t3 = await settledBy(() => cardText(app, 'c3'));
    ok('CARD: Enter inside a bold run closes it before the newline and reopens it after - no line is left with one visible mark', t3 === 'x **ab**\n**cd** y', JSON.stringify(t3));
  } else ok('CARD (setup): the third card popup opened', false);

  // ======================== EMPTY ITALIC ========================
  await openDraft(app, 'i1', 'Plain words');
  await caretAt(app, ED, 5);
  await app.keyCombo('i'); await sleep(300);
  const i0 = await settledBy(() => pageText(app, 'i1'));
  ok('ITALIC: Ctrl+I at a bare caret writes NOTHING (no `**` on the page or in the text)', i0 === 'Plain words' && (await shown(app, ED)).length === 0 && !(await app.evalJs(`document.querySelector('${ED}').textContent.includes('**')`)), JSON.stringify(i0));
  await app.typeKeys('xy');
  const i1 = await settledBy(() => pageText(app, 'i1'));
  ok('ITALIC: ...and the letters typed next ARE italic, stored as one italic run', i1 === 'Plain*xy* words' && (await app.evalJs(`document.querySelector('${ED} .md-italic')?.textContent.replace(/\\*/g, '')`)) === 'xy', JSON.stringify(i1));
  await openDraft(app, 'i2', 'Plain words');
  await caretAt(app, ED, 5);
  await app.keyCombo('i'); await sleep(300);
  await caretAt(app, ED, 9); await sleep(300);
  await app.typeKeys('q');
  const i2 = await settledBy(() => pageText(app, 'i2'));
  ok('ITALIC: moving away before typing forgets the italic - the next letter elsewhere is plain and nothing was left behind', i2 === 'Plain wordqs', JSON.stringify(i2));

  // ======================== WORD DELETE ========================
  await openDraft(app, 'w1', 'one **bold** two');
  await caretAt(app, ED, 10);   // after "bold"
  await key(app, 'Backspace', 2);
  const w1 = await settledBy(() => pageText(app, 'w1'));
  ok('WORD: Ctrl+Backspace after a bold word removes the word WITH its marks - no lone or empty `**` left', w1 === 'one  two', JSON.stringify(w1));
  await openDraft(app, 'w2', 'one **bold** two');
  await caretAt(app, ED, 4);    // before the bold word
  await key(app, 'Delete', 2);
  const w2 = await settledBy(() => pageText(app, 'w2'));
  ok('WORD: Ctrl+Delete before a bold word removes it, its marks and the space after it', w2 === 'one two', JSON.stringify(w2));
  await key(app, 'Backspace', 2);
  const w3 = await settledBy(() => pageText(app, 'w2'));
  ok('WORD: and it is ONE undo step each (Ctrl+Z restores the last word delete whole)', await (async () => { await app.keyCombo('z'); return (await settledBy(() => pageText(app, 'w2'))) === 'one two'; })(), JSON.stringify(w3));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nITEM211B VERIFY: PASS (${checks.length} checks)` : `\nITEM211B VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
