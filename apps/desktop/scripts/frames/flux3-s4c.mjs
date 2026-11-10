// FLUX3 S4 - THE CORRIDOR as named screens for the frames job (-f themes=flux -f tones=dark -f screens_file=apps/desktop/scripts/frames/flux3-s4c.mjs
// -f screens=corridor-entry,corridor-rest,...). Jacked In is always dark, so the light tone repeats the dark one. 1366 and 1920 come from the job.
// A page is made through the app's seam (never raw storage) as a loose page, which opens in Flux's free-writing mode = Jacked In (draft 21 §6).
// The Wrizors' re-shoot list (Fable, Nov 9 3:45 pm and 4:00 pm):
//   corridor-entry:      inside the first 3 s (the exit line: JACKED IN · ESC TO JACK OUT)
//   corridor-pop:        inside the pop's 0.3 s (the brass tint and the brass frame; the page's own timers are held for the still, its animation clock stepped to 120 ms)
//   corridor-fast:       full pace with the lime frame (the page's own attribute, held for the still)
//   corridor-still:      reduced motion (the frames at their places, nothing running)
//   corridor-esc:        0.3 s after an Esc tap (the decompile)
//   corridor-rest:       at rest (the frames hold still; no exit line; the glow at the start of a lap)
//   corridor-glow-floor: 7.5 s after the goal: the glow at its 40% floor (hold 2 s, ease 3 s)
//   corridor-glow-25 / -50 / -100: the glow BUILDING with the goal (62, 125 words of 250; at the goal the lap's celebration holds it full)
//   corridor-x:          the circled X showing (the pointer moved, nothing typed)
//   corridor-nudge:      the 4 s nudge showing under her text
//   corridor-rows:       finished lines stepped back about the centre line (7.5% a row, 15% fainter)
// Each screen prints what it stood on ("FLUX3-S4C-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const CYCLE = 'the signal holds while she writes on ';
const LINE = ' and the corridor keeps going forward with more plain words now, on and on across the measure of the page until it wraps again and again, line after line';
const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

const seed = async (app, text, { settle = 1600, reduced = false } = {}) => {
  const id = `f3s4c-frames-${Date.now()}`;
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50'); (() => { const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })();");
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs(`localStorage.removeItem('wrizo-mode-page-${id}'); history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
  await sleep(settle);
  return id;
};
const type = async (app, text, gap = 40) => { for (const ch of text) { await app.typeKeys(ch); await sleep(gap); } };
const tapEsc = async (app, held = 60) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(held);
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
};
const stood = (app) => app.evalJs(`(() => { const r = document.documentElement; const q = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const g = document.querySelector('.flux3-cor-glow'); const ex = document.querySelector('.flux3-exit-line'); const nx = document.querySelector('.flux3-nudge'); const lx = document.querySelector('.flux3-leave-x');
  return { flag: r.hasAttribute('data-flux3'), theme: r.getAttribute('data-theme'), page: r.getAttribute('data-page'), jacked: r.hasAttribute('data-flux3-jacked'), corridor: q('[data-flux3-corridor]'), pageRect: q('.mode-page'),
    glow: g ? +getComputedStyle(g).opacity : null, exitLine: ex ? ex.textContent : null, nudge: nx ? nx.textContent : null, leaveX: lx ? { on: lx.hasAttribute('data-on'), rect: q('.flux3-leave-x') } : null, dot: document.elementsFromPoint(14, 15).slice(0, 4).map((e) => (e.tagName + '.' + String(e.className).slice(0, 40) + ' ' + getComputedStyle(e).backgroundColor)), fast: !!document.querySelector('[data-flux3-corridor][data-fast]'), pop: !!document.querySelector('[data-flux3-corridor][data-pop]') }; })()`);
// hold a page's own state for a still (the page's animations and timers are its own; only the clock or the removal is held)
const holdAttr = (app, attr) => app.evalJs(`(() => { const c = document.querySelector('[data-flux3-corridor]'); if (!c) return false; c.setAttribute('${attr}', ''); window.__hold = window.setInterval(() => c.setAttribute('${attr}', ''), 30); return true; })()`);

export default {
  'corridor-entry': async (app) => {
    await seed(app, 'An older line she wrote before this session.', { settle: 500 });
    console.log(`FLUX3-S4C-FRAME corridor-entry ${JSON.stringify(await stood(app))}`);
  },
  'corridor-rest': async (app) => {
    await seed(app, 'An older line she wrote before this session.', { settle: 3750 });   // the exit line (3 s + 0.6 s fade) has gone, the 4 s nudge has not come
    console.log(`FLUX3-S4C-FRAME corridor-rest ${JSON.stringify(await stood(app))}`);
  },
  'corridor-still': async (app) => {
    await seed(app, 'An older line she wrote before this session.', { reduced: true });
    console.log(`FLUX3-S4C-FRAME corridor-still ${JSON.stringify(await stood(app))}`);
  },
  'corridor-fast': async (app) => {
    await seed(app, 'An older line she wrote before this session.');
    await type(app, CYCLE + CYCLE + CYCLE, 30);   // ~30 keys a second
    await holdAttr(app, 'data-fast');
    await sleep(200);
    console.log(`FLUX3-S4C-FRAME corridor-fast ${JSON.stringify(await stood(app))}`);
  },
  'corridor-rows': async (app) => {
    await seed(app, 'An older line she wrote before this session.');
    await type(app, LINE + LINE + LINE, 22);
    await waitSoft(app, "document.querySelectorAll('[data-flux3-compile] .flux3-compile-row').length >= 3", { label: 'the rows', timeout: 8000 });   // the pause compiles her finished lines
    await sleep(400);
    console.log(`FLUX3-S4C-FRAME corridor-rows ${JSON.stringify(await stood(app))}`);
  },
  'corridor-pop': async (app) => {
    // HOW THIS SHOT IS MADE: a real milestone (49 words, then three more: the 50th fills the second letter, so C is earned = lime and H is the newest = brass), the corridor's tint is the page's own
    // 0.3 s attribute held on, the brass frame's own animation clock stepped to mid-flight, the letters' own 2 s fade paused at full and their node kept on the page, and the 4 s idle line
    // kept out of the shot (it would come up in the seconds the frames job takes). Nothing is drawn by the script.
    await seed(app, words(49));
    await type(app, ' one', 30);
    // the real pop fired at the 50th word; its letters stand for 2 s, its 0.3 s tint is gone by the time this runs, so the tint is held on below
    await waitSoft(app, "!!document.querySelector('[data-flux3-pop]')", { label: 'the pop letters', timeout: 4000 });
    await holdAttr(app, 'data-pop');
    await sleep(60);
    await app.evalJs("(() => { const c = document.querySelector('[data-flux3-corridor]'); c.getAnimations({ subtree: true }).forEach((a) => { const t = a.effect && a.effect.target; if (t && t.getAttribute('data-kind') === 'brass') { a.pause(); a.currentTime = 120; } }); const p = document.querySelector('[data-flux3-pop]'); p.getAnimations().forEach((a) => { a.pause(); a.currentTime = 700; }); const st = document.createElement('style'); st.textContent = '.flux3-nudge{display:none !important}'; document.head.appendChild(st); new MutationObserver(() => { if (!document.body.contains(p)) document.body.appendChild(p); }).observe(document.body, { childList: true }); return true; })()");
    await sleep(100);
    console.log(`FLUX3-S4C-FRAME corridor-pop ${JSON.stringify(await stood(app))}`);
  },
  'corridor-glow-25': async (app) => {
    await seed(app, words(62));
    console.log(`FLUX3-S4C-FRAME corridor-glow-25 ${JSON.stringify(await stood(app))}`);
  },
  'corridor-glow-50': async (app) => {
    await seed(app, words(125));
    console.log(`FLUX3-S4C-FRAME corridor-glow-50 ${JSON.stringify(await stood(app))}`);
  },
  'corridor-glow-100': async (app) => {
    await seed(app, words(249));
    await type(app, ' one two three', 30);   // the goal: the lap's celebration holds the glow full for ~1.1 s
    await app.evalJs("(() => { const g = document.querySelector('.flux3-cor-glow'); window.__hold = window.setInterval(() => { g.style.opacity = '1'; }, 30); return true; })()");
    await sleep(900);
    console.log(`FLUX3-S4C-FRAME corridor-glow-100 ${JSON.stringify(await stood(app))}`);
  },
  'corridor-glow-floor': async (app) => {
    await seed(app, words(249));
    await type(app, ' one two three', 30);   // the goal; the hold (2 s) and the ease (3 s) go by, and the glow stands at 40%
    await sleep(7500);
    console.log(`FLUX3-S4C-FRAME corridor-glow-floor ${JSON.stringify(await stood(app))}`);
  },
  'corridor-x': async (app) => {
    await seed(app, 'An older line she wrote before this session.');
    const vw = await app.evalJs('innerWidth'), vh = await app.evalJs('innerHeight');   // by the window's own size (a 1366 window has no x 1500)
    await app.mouseMove(Math.round(vw * 0.75), Math.round(vh * 0.65));
    await sleep(120);
    await app.mouseMove(Math.round(vw * 0.77), Math.round(vh * 0.67));
    await sleep(500);
    console.log(`FLUX3-S4C-FRAME corridor-x ${JSON.stringify(await stood(app))}`);
  },
  'corridor-nudge': async (app) => {
    await seed(app, 'An older line she wrote before this session.', { settle: 4800 });
    await sleep(1400);   // the nudge's 0.8 s fade-in is done
    console.log(`FLUX3-S4C-FRAME corridor-nudge ${JSON.stringify(await stood(app))}`);
  },
  'corridor-esc': async (app) => {
    await seed(app, 'First line of her text.\nSecond line goes here.');
    await type(app, ' and a little more written now so there is signal to resolve');
    await type(app, LINE, 15);
    await waitSoft(app, "document.querySelectorAll('[data-flux3-compile] .flux3-compile-row').length >= 2", { label: 'the rows', timeout: 8000 });   // the pause compiles her finished lines
    await tapEsc(app);
    await sleep(100);    // the shot lands ~0.3 s after the tap (the job's own delay): the decompile under way
    console.log(`FLUX3-S4C-FRAME corridor-esc ${JSON.stringify(await stood(app))}`);
  },
  'build-after-esc': async (app) => {
    await seed(app, 'First line of her text.\nSecond line goes here.');
    await type(app, ' and a little more', 40);
    await tapEsc(app);
    await sleep(1800);
    console.log(`FLUX3-S4C-FRAME build-after-esc ${JSON.stringify(await stood(app))}`);
  },
};
