// FLUX3 S4 - JACKED IN as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/flux3-s4.mjs
// -f screens=jack-frame,jack-compiled,jack-out,jack-edge,jack-switch,jack-esc,jack-esc-control). The pages flux3-s4.mjs seeds (through the app's seams, never raw storage),
// in Free Write under ?flux3=1, the shared Typewriter field off (so the page is Jacked In by the default alone). jack-frame: jacked in at rest.
// jack-compiled: after a burst of typing and the pause (the lines two up and beyond compiled). jack-out: mid-decompile, the toggle just pressed.
// jack-edge: a page one word short of the lap (the burst edge nearly empty). jack-switch: the TOOLS foot open on "Jack In by default".
// Each screen prints what it stood on ("FLUX3-S4-FRAME ...").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PARA = 'The signal runs along these plain words so that the page holds many lines above the writing line, each one long enough to wrap across the measure of the page.';
const LONG_TEXT = Array.from({ length: 10 }, (_, i) => `${i + 1}. ${PARA}`).join('\n');

const seed = async (app, text, { flag = true, typewriter = false } = {}) => {
  const id = `f3s4-frames-${Date.now()}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await app.evalJs("(() => { const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { typewriter: " + JSON.stringify(typewriter) + ", progress: 'words', progressStyle: 'bar', instrumentsOn: true }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })()");
  await sleep(400);
  await app.evalJs(`history.replaceState(null, '', '${flag ? '/?flux3=1' : '/'}#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
  await app.mouseMove(8, 8);
  await sleep(1800);
};
const point = (app, sel, i = 0) => app.evalJs(`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width) return null; return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const click = async (app, p) => {
  await app.mouseMove(p.x, p.y);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
};
const openHand = async (app) => { const g = await point(app, '.wz-sliver-grip'); if (g) { await click(app, g); await sleep(700); } };
const stood = (app) => app.evalJs("({ flag: document.documentElement.hasAttribute('data-flux3'), jacked: document.documentElement.hasAttribute('data-flux3-jacked'), zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') || null, mode: document.querySelector('[data-mode-key][aria-selected=\"true\"]')?.getAttribute('data-mode-key') || null, compiled: document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length, decompile: !!document.querySelector('[data-flux3-compile].decompile'), burst: document.querySelector('[data-flux3-burst]')?.dataset.left ?? null, sw: !!document.querySelector('[data-flux3-jackin-switch]') })");

// ESC (the Wrizors' S4 review, Fable Nov 7): type, Esc, and the frame 1.2 s later; jack-esc under the flag, jack-esc-control the flag-off Typewriter
const escLater = async (app, name, opts) => {
  await seed(app, LONG_TEXT, opts);
  await app.typeKeys(' and the line keeps going');
  await sleep(300);
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(1200);
  const look = await app.evalJs("({ caret: (() => { const e = document.querySelector('.forward-only-editor'), s = getSelection(); return !!e && !!s && s.rangeCount > 0 && e.contains(s.anchorNode); })(), focus: document.activeElement === document.querySelector('.forward-only-editor'), block: !!document.querySelector('.flux-block-caret'), writing: document.documentElement.getAttribute('data-wz-writing') })");
  console.log(`FLUX3-S4-FRAME ${name} ${JSON.stringify({ ...(await stood(app)), ...look })}`);
};

export default {
  'jack-esc': (app) => escLater(app, 'jack-esc', { flag: true, typewriter: false }),
  'jack-esc-control': (app) => escLater(app, 'jack-esc-control', { flag: false, typewriter: true }),
  'jack-frame': async (app) => {
    await seed(app, LONG_TEXT);
    console.log(`FLUX3-S4-FRAME jack-frame ${JSON.stringify(await stood(app))}`);
  },
  'jack-compiled': async (app) => {
    await seed(app, LONG_TEXT);
    await app.typeKeys(' and the line keeps going forward with more plain words now, on and on across the measure of the page until it wraps again');
    await app.mouseMove(8, 8);
    await sleep(1600);
    console.log(`FLUX3-S4-FRAME jack-compiled ${JSON.stringify(await stood(app))}`);
  },
  'jack-out': async (app) => {
    await seed(app, LONG_TEXT);
    await openHand(app);
    const t = await point(app, '[data-mode-toggle="typewriter"]');
    if (t) { await click(app, t); await sleep(140); }
    console.log(`FLUX3-S4-FRAME jack-out ${JSON.stringify(await stood(app))}`);
  },
  'jack-edge': async (app) => {
    await seed(app, Array.from({ length: 249 }, (_, i) => `w${i}`).join(' '));
    console.log(`FLUX3-S4-FRAME jack-edge ${JSON.stringify(await stood(app))}`);
  },
  'jack-switch': async (app) => {
    await seed(app, LONG_TEXT);
    await openHand(app);
    const m = await point(app, '.wz-sliver-instruments-btn');
    if (m) { await click(app, m); await sleep(500); }
    await app.evalJs("document.querySelector('[data-flux3-jackin-switch]')?.scrollIntoView({ block: 'center' })");
    await sleep(300);
    console.log(`FLUX3-S4-FRAME jack-switch ${JSON.stringify(await stood(app))}`);
  },
};
