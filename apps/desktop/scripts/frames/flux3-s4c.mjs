// FLUX3 S4 - THE CORRIDOR as named screens for the frames job (-f themes=flux -f tones=dark -f screens_file=apps/desktop/scripts/frames/flux3-s4c.mjs
// -f screens=corridor-rest,corridor-fast,corridor-rows,corridor-pop,build-after-esc). Jacked In is always dark, so the light tone repeats the dark one.
// A page is made through the app's seam (never raw storage) as a loose page, which opens in Flux's free-writing mode = Jacked In (draft 21 §6).
//   corridor-rest:    just in; nothing typed (the frames hold still, the glow, the caret at the end)
//   corridor-fast:    a fast burst just ended (the speed is still easing down: the frames streaming, the lime frame at speed)
//   corridor-rows:    a few lines written, paused: finished lines stepped back (-7.5% size / -15% opacity a row, up to six)
//   corridor-pop:     a milestone just filled: the brass tint and one brass CHECKPOINT letter
//   build-after-esc:  an Esc tap: BUILD on the same doc, the caret at the end, the chrome back
// Each screen prints what it stood on ("FLUX3-S4C-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const CYCLE = 'the signal holds while she writes on ';
const LINE = ' and the corridor keeps going forward with more plain words now, on and on across the measure of the page until it wraps again and again, line after line';

const seed = async (app, text) => {
  const id = `f3s4c-frames-${Date.now()}`;
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50'); (() => { const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })()");
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs(`localStorage.removeItem('wrizo-mode-page-${id}'); history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
  await app.mouseMove(8, 8);
  await sleep(1600);
  return id;
};
const type = async (app, text, gap = 40) => { for (const ch of text) { await app.typeKeys(ch); await sleep(gap); } };
const stood = (app) => app.evalJs("({ flag: document.documentElement.hasAttribute('data-flux3'), theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), jacked: document.documentElement.hasAttribute('data-flux3-jacked'), corridor: !!document.querySelector('[data-flux3-corridor]'), rows: document.querySelectorAll('.flux3-compile-word').length, pop: !!document.querySelector('[data-flux3-pop]'), ink: (() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return null; const c = getComputedStyle(ed); const r = ed.getBoundingClientRect(); return { color: c.color, ff: c.fontFamily.slice(0, 40), op: c.opacity, vis: c.visibility, mask: (c.webkitMaskImage || c.maskImage || '').slice(0, 30), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], text: ed.textContent.slice(0, 30), fonts: [...document.fonts].filter((f) => /Crimson/.test(f.family)).map((f) => f.family + ':' + f.status).slice(0, 4) }; })() })");

export default {
  'corridor-rest': async (app) => {
    await seed(app, 'An older line she wrote before this session.');
    console.log(`FLUX3-S4C-FRAME corridor-rest ${JSON.stringify(await stood(app))}`);
  },
  'corridor-fast': async (app) => {
    await seed(app, 'An older line she wrote before this session.');
    await type(app, CYCLE + CYCLE + CYCLE, 30);   // ~30 keys a second, ending right before the shot
    console.log(`FLUX3-S4C-FRAME corridor-fast ${JSON.stringify(await stood(app))}`);
  },
  'corridor-rows': async (app) => {
    await seed(app, 'An older line she wrote before this session.');
    await type(app, LINE + LINE + LINE, 22);
    await app.mouseMove(8, 8);
    await sleep(2000);   // the pause compiles her finished lines
    console.log(`FLUX3-S4C-FRAME corridor-rows ${JSON.stringify(await stood(app))}`);
  },
  'corridor-pop': async (app) => {
    await seed(app, Array.from({ length: 24 }, (_, i) => `w${i}`).join(' '));
    await type(app, ' one two three four five six seven', 30);
    await waitSoft(app, "!!document.querySelector('[data-flux3-pop]')", { label: 'the pop', timeout: 4000 });
    await sleep(120);
    console.log(`FLUX3-S4C-FRAME corridor-pop ${JSON.stringify(await stood(app))}`);
  },
  'build-after-esc': async (app) => {
    await seed(app, 'First line of her text.\nSecond line goes here.');
    await type(app, ' and a little more', 40);
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(60);
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(1800);
    console.log(`FLUX3-S4C-FRAME build-after-esc ${JSON.stringify(await stood(app))}`);
  },
};
