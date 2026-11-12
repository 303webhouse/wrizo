// TRAIN REVIEW FRAMES (Fable, Nov 11, 3:20 pm): an EMPTY page after Enter, and after Enter then Up, in Arbor (plateau) and Machina, WITH THE CARET SHOWING.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<train frames branch> -f themes=plateau,machina -f screens=empty-enter,empty-enter-up -f widths=1366 \
//      -f screens_file=apps/desktop/scripts/frames/train-enter-up.mjs
// WHY THE FIRST SET SHOWED NO CARET: the browser's own caret BLINKS (about half the time it is off) and is a thin dark line; the frame is taken a moment after the key,
// so it landed on the "off" half. Here the editor's caret colour is forced to magenta (a style sheet in <head>; the editor's DOM and the product are untouched, the
// same trick FIX's audit uses), and the frame is taken within about 120 ms of the last key (a key press restarts the blink on its "on" half).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const key = async (app, p) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
};
const arm = (app) => app.evalJs(`(() => { if (document.getElementById('train-caret')) return true; const st = document.createElement('style'); st.id = 'train-caret'; st.textContent = '${ED}, ${ED} * { caret-color: #ff00ff !important; }'; document.head.appendChild(st); return true; })()`);
const toEmptyPage = async (app) => {
  await app.goto('/page/new');
  try { await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'blank page' }); } catch {}
  await sleep(900);
  await arm(app);
  const pt = await app.evalJs(`(() => { const e = document.querySelector('${ED}'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 40), y: Math.round(r.top + 30) }; })()`);
  if (pt) { await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y); }
  await sleep(500);
};
const enter = async (app) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
};
export default {
  'empty-enter': async (app) => {
    await toEmptyPage(app);
    await enter(app);
    await sleep(120);
  },
  'empty-enter-up': async (app) => {
    await toEmptyPage(app);
    await enter(app);
    await sleep(500);
    await key(app, { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38, nativeVirtualKeyCode: 38, commands: ['moveUp'] });
    await sleep(120);
  },
};
