// CARD HELD ITALIC - THE FRAMES (this desk): the harness's own sequence typed with real keys - 'Plain then ', Ctrl+I, 'slanted words', Ctrl+I, ' and plain again' -
// in a card pop-up and on a Draft page; the screenshot shows where the italic ends. Local build of the behb worktree.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/behb/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const CE = '.board-popup-editor';
const WANT = 'Plain then *slanted words* and plain again';
const rows = [];

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded by the rows */ }
};
const openDraft = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' }).then(() => true, () => false);
  if (!up) return false;
  await sleep(500);
  await app.click('Draft'); await sleep(900);
  return true;
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
const caretEnd = (app, sel) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
const italics = (app, sel) => app.evalJs(`[...document.querySelectorAll('${sel} .md-italic')].map(e => e.textContent.replace(/\\*/g, ''))`);
const sequence = async (app) => {
  await app.typeKeys('Plain then ');
  await app.keyCombo('i'); await sleep(250);
  await app.typeKeys('slanted words');
  await app.keyCombo('i'); await sleep(250);
  await app.typeKeys(' and plain again');
  await sleep(300);
};

await withHarness(async (app) => {
  const card = await openCard(app, 'hi1', 'Card start');
  if (card) {
    await caretEnd(app, CE); await app.key('Enter'); await sequence(app);
    const shown = await app.evalJs(`document.querySelector('${CE}').textContent`);
    const it = await italics(app, CE);
    writeFileSync(join(OUT, 'card-popup-held-italic.png'), Buffer.from(await app.screenshot(), 'base64'));
    rows.push({ frame: 'card-popup-held-italic', shown, italics: it, endsWithWant: typeof shown === 'string' && shown.endsWith(WANT) }); console.log(JSON.stringify(rows[rows.length - 1]));
    await app.key('Escape'); await sleep(400);
  } else { rows.push({ frame: 'card-popup-held-italic', error: 'the card pop-up did not open' }); }
  const page = await openDraft(app, 'hi2', 'Page start');
  if (page) {
    await caretEnd(app, ED); await app.key('Enter'); await sequence(app);
    const it = await italics(app, ED);
    const shown = await app.evalJs(`document.querySelector('${ED}').textContent`);
    writeFileSync(join(OUT, 'draft-page-held-italic.png'), Buffer.from(await app.screenshot(), 'base64'));
    rows.push({ frame: 'draft-page-held-italic', shown, italics: it, endsWithWant: typeof shown === 'string' && shown.endsWith(WANT) }); console.log(JSON.stringify(rows[rows.length - 1]));
  } else { rows.push({ frame: 'draft-page-held-italic', error: 'the Draft page did not open' }); }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`HELD ITALIC FRAMES: ${rows.length} rows -> ${OUT}`);
