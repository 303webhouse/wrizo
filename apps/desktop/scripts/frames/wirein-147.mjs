// #147 and #148 (FIX, Nov 27) as named screens for the frames job: Wire In with no menus, the B I U bar on a selection, the X with its prompt button, and the prompt card.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=fix-147-wirein-quiet -f themes=flux -f widths=1366,1920 -f screens_file=apps/desktop/scripts/frames/wirein-147.mjs -f screens=<the names below>
// The job offers 1366 and 1920 only, so the 1536 x 706 frames (Nick's own window) are screens of their own (names ending -1536).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ID = 'wirein-147';
const TEXT = 'The tunnel waits for her words. The lamp is warm and the river is loud tonight. She keeps the signal and writes on.';

const open = async (app, w) => {
  if (w) await app.emulateDpr(1, w, 706);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
  await app.evalJs(`(() => { localStorage.setItem('wrizo-writing-settings', JSON.stringify({ instrumentsOn: true, progress: 'words', themeTracker: true }));
    localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' }));
    localStorage.setItem('wrizo-mode-page-${ID}', 'journal'); history.replaceState(null, '', '/?flux3=1&reorg=1#/page/${ID}'); return true; })()`);
  await app.reload();
  await app.waitFor("document.documentElement.hasAttribute('data-flux3-jacked') && !!document.querySelector('.forward-only-editor')", { label: 'Wire In', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await sleep(4800);
};
const move = async (app) => { await app.mouseMove(300, 300); await app.mouseMove(330, 320); await sleep(600); };
const select = async (app, word) => {
  const b = await app.evalJs(`(() => { const ed = document.querySelector('.forward-only-editor'); const t = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let found = null;
    for (let n = t.nextNode(); n; n = t.nextNode()) { const i = n.data.lastIndexOf(${JSON.stringify(word)}); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${word.length}); const q = r.getBoundingClientRect(); found = [q.left, q.top, q.right, q.bottom]; } } return found; })()`);
  if (!b) return;
  const y = (b[1] + b[3]) / 2;
  const held = (x) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, pointerType: 'mouse' });
  await app.mouseMove(b[0] + 1, y); await app.mouseDown(b[0] + 1, y); await held((b[0] + b[2]) / 2); await held(b[2] - 1); await app.mouseUp(b[2] - 1, y); await sleep(500);
};
const press = async (app, sel) => {
  const p = await app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  if (!p) return;
  await app.mouseMove(p[0], p[1]); await app.mouseDown(p[0], p[1]); await app.mouseUp(p[0], p[1]); await sleep(1200);
};

const set = (w) => {
  const tag = w ? `-${w}` : '';
  return {
    [`w-rest${tag}`]: async (app) => { await open(app, w); },
    [`w-select${tag}`]: async (app) => { await open(app, w); await select(app, 'signal'); },
    [`w-x${tag}`]: async (app) => { await open(app, w); await move(app); },
    [`w-prompt${tag}`]: async (app) => { await open(app, w); await move(app); await press(app, '[data-flux3-prompt]'); await move(app); },
  };
};

export default { ...set(0), ...set(1536) };
