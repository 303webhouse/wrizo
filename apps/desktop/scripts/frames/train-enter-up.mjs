// TRAIN REVIEW FRAME (Fable, Nov 11): an EMPTY page after Enter, then Up, in Arbor (plateau) and Machina.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<train frames branch> -f themes=plateau,machina -f screens=empty-enter-up -f widths=1366 \
//      -f screens_file=apps/desktop/scripts/frames/train-enter-up.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const key = async (app, p) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
};
export default {
  'empty-enter-up': async (app) => {
    await app.goto('/page/new');
    try { await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'blank page' }); } catch {}
    await sleep(900);
    const pt = await app.evalJs(`(() => { const e = document.querySelector('${ED}'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 40), y: Math.round(r.top + 30) }; })()`);
    if (pt) { await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y); }
    await sleep(500);
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await sleep(500);
    await key(app, { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38, nativeVirtualKeyCode: 38, commands: ['moveUp'] });
    await sleep(700);
  },
};
