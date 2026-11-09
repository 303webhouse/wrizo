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

const seed = async (app, text, o = {}) => {
  const id = `f3s4c-frames-${Date.now()}`;
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50'); (() => { const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: " + (o.typewriter ? 'true' : 'false') + " }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })()");
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs(`localStorage.removeItem('wrizo-mode-page-${id}'); history.replaceState(null, '', '/${o.flag === false ? '' : '?flux3=1'}#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
  await app.mouseMove(8, 8);
  await sleep(1600);
  return id;
};
const type = async (app, text, gap = 40) => { for (const ch of text) { await app.typeKeys(ch); await sleep(gap); } };
const stood = (app) => app.evalJs("({ flag: document.documentElement.hasAttribute('data-flux3'), theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), jacked: document.documentElement.hasAttribute('data-flux3-jacked'), corridor: !!document.querySelector('[data-flux3-corridor]'), rows: document.querySelectorAll('.flux3-compile-word').length, pop: !!document.querySelector('[data-flux3-pop]'), ink: (() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return null; const bx = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), c.overflowY, c.transform === 'none' ? '' : 'T', c.clipPath === 'none' ? '' : 'C']; }; const boxes = { page: bx('.mode-page'), scroll: bx('.mode-scroll'), col: bx('.mode-pagecol'), stage: bx('.mode-stage') }; const c = getComputedStyle(ed); const r = ed.getBoundingClientRect(); return { boxes, color: c.color, ff: c.fontFamily.slice(0, 40), op: c.opacity, vis: c.visibility, mask: (c.webkitMaskImage || c.maskImage || '').slice(0, 30), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], text: ed.textContent.slice(0, 30), last: (() => { const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, l = null; while ((n = w.nextNode())) l = n; if (!l) return null; const g = document.createRange(); g.setStart(l, Math.max(0, l.nodeValue.length - 6)); g.setEnd(l, l.nodeValue.length); const q = g.getBoundingClientRect(); const cx = Math.round(q.left + q.width / 2), cy = Math.round(q.top + q.height / 2); const chain = []; for (let e = ed; e && chain.length < 9; e = e.parentElement) { const s = getComputedStyle(e); chain.push((e.className || e.tagName).toString().slice(0, 22) + ' o' + s.opacity + (s.maskImage !== 'none' ? ' M' : '') + (s.filter !== 'none' ? ' F' : '')); } return { q: [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)], top: document.elementsFromPoint(cx, cy).slice(0, 5).map((e) => (e.className || e.tagName).toString().slice(0, 28)), chain, st: ed.closest('.mode-scroll') ? ed.closest('.mode-scroll').scrollTop : null }; })(), fonts: [...document.fonts].filter((f) => /Crimson/.test(f.family)).map((f) => f.family + ':' + f.status).slice(0, 4) }; })() })");

const SCREENS = {
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

// DIAGNOSTIC screens (INK, Nov 9): the same typed state, one mask lifted at a time, to see which layer hides the writing line in the headless frame
const diag = (name, js) => async (app) => {
  await seed(app, 'An older line she wrote before this session.');
  await type(app, CYCLE + CYCLE + CYCLE, 30);
  await app.evalJs(js);
  await sleep(500);
  console.log(`FLUX3-S4C-FRAME ${name} ${JSON.stringify(await stood(app))}`);
};
SCREENS['diag-nomask-col'] = diag('diag-nomask-col', "document.querySelector('.mode-pagecol').style.setProperty('mask-image','none','important'); document.querySelector('.mode-pagecol').style.setProperty('-webkit-mask-image','none','important')");
SCREENS['diag-nomask-ed'] = diag('diag-nomask-ed', "document.querySelector('.forward-only-editor').style.setProperty('mask-image','none','important'); document.querySelector('.forward-only-editor').style.setProperty('-webkit-mask-image','none','important')");
SCREENS['diag-nomask-both'] = diag('diag-nomask-both', "['.mode-pagecol','.forward-only-editor'].forEach((s) => { const e = document.querySelector(s); e.style.setProperty('mask-image','none','important'); e.style.setProperty('-webkit-mask-image','none','important'); })");
SCREENS['diag-nocorridor'] = diag('diag-nocorridor', "document.querySelector('[data-flux3-corridor]').style.display = 'none'");
SCREENS['diag-rows'] = async (app) => {
  await seed(app, 'An older line she wrote before this session.');
  await type(app, CYCLE + CYCLE + CYCLE, 30);
  const d = await app.evalJs(`(() => { const ed = document.querySelector('.forward-only-editor'); const out = { kids: [...ed.children].map((c) => { const s = getComputedStyle(c); return { tag: c.tagName + '.' + String(c.className).slice(0, 20), o: s.opacity, c: s.color, f: s.webkitTextFillColor, v: s.visibility, d: s.display, h: Math.round(c.getBoundingClientRect().height), t: c.textContent.slice(0, 18), st: s.textShadow.slice(0, 20), bg: s.backgroundClip }; }), edStyle: (() => { const s = getComputedStyle(ed); return { fill: s.webkitTextFillColor, color: s.color, mix: s.mixBlendMode, clip: s.clipPath, ov: s.overflow }; })(), glow: !!document.querySelector('.flux3-compile'), compileLayerOp: (() => { const l = document.querySelector('.flux3-compile'); return l ? getComputedStyle(l).opacity : null; })() }; return out; })()`);
  console.log(`FLUX3-S4C-FRAME diag-rows ${JSON.stringify(d)}`);
};
SCREENS['diag-pink'] = diag('diag-pink', "document.querySelectorAll('.forward-only-editor, .forward-only-editor *').forEach((e) => { e.style.setProperty('color','#ff00ff','important'); e.style.setProperty('-webkit-text-fill-color','#ff00ff','important'); e.style.setProperty('opacity','1','important'); })");
SCREENS['diag-nocompile'] = diag('diag-nocompile', "document.querySelectorAll('.flux3-compile').forEach((e) => { e.style.display = 'none'; })");
SCREENS['diag-nofade'] = diag('diag-nofade', "document.querySelectorAll('.mode-pagecol, .mode-page, .mode-scroll').forEach((e) => { e.style.setProperty('mask-image','none','important'); e.style.setProperty('-webkit-mask-image','none','important'); e.style.setProperty('opacity','1','important'); }); document.querySelectorAll('.forward-only-editor *').forEach((e) => e.style.setProperty('opacity','1','important'))");
SCREENS['diag-resize'] = diag('diag-resize', "window.dispatchEvent(new Event('resize'))");
SCREENS['diag-vars'] = async (app) => {
  await seed(app, 'An older line she wrote before this session.');
  const v = async () => app.evalJs("(() => { const p = document.querySelector('.mode-page'); const c = getComputedStyle(p); const col = document.querySelector('.mode-pagecol'); const st = document.querySelector('.desk-frame-stage'); const g = (e, n) => getComputedStyle(e).getPropertyValue(n).trim(); return { h: g(p, '--wz-page-h'), hl: g(p, '--wz-page-hl'), k: g(p, '--wz-k'), z: g(p, '--wz-zoom'), w: g(p, '--wz-page-w'), height: c.height, inline: p.getAttribute('style'), stage: st && st.className, stageH: st && Math.round(st.getBoundingClientRect().height), colH: Math.round(col.getBoundingClientRect().height), zoom: col.getAttribute('data-zoom'), iw: innerWidth, ih: innerHeight }; })()");
  console.log(`FLUX3-S4C-FRAME diag-vars-jacked ${JSON.stringify(await v())}`);
};
SCREENS['diag-vars-main'] = async (app) => {
  await seed(app, 'An older line she wrote before this session.', { flag: false, typewriter: true });
  console.log(`FLUX3-S4C-FRAME diag-vars-main ${JSON.stringify(await app.evalJs("(() => { const p = document.querySelector('.mode-page'); const col = document.querySelector('.mode-pagecol'); const g = (e, n) => getComputedStyle(e).getPropertyValue(n).trim(); return { hl: g(p, '--wz-page-hl'), h: g(p, '--wz-page-h'), height: getComputedStyle(p).height, zoom: col && col.getAttribute('data-zoom'), flag: document.documentElement.hasAttribute('data-flux3') }; })()"))}`);
};
export default SCREENS;
