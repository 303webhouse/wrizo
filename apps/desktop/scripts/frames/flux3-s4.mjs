// FLUX3 S4 - JACKED IN as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/flux3-s4.mjs
// -f screens=jack-frame,jack-compiled,jack-burst-300,jack-out,jack-out-later,jack-out-esc,jack-out-esc-control,jack-edge,jack-switch,jack-esc,jack-esc-control,jack-tunnel,jack-tunnel-fast). The pages flux3-s4.mjs seeds (through the app's seams, never raw storage),
// in Free Write under ?flux3=1, the shared Typewriter field off (so the page is Jacked In by the default alone). jack-frame: jacked in at rest.
// jack-compiled: after a burst of typing and the pause (the lines two up and beyond compiled). jack-out: mid-decompile, the toggle just pressed.
// jack-edge: a page one word short of the lap (the burst edge nearly empty). jack-switch: the TOOLS foot open on "Jack In by default".
// Each screen prints what it stood on ("FLUX3-S4-FRAME ...").
import { installArms, STAND as ARM_STAND, READ as ARM_READ, STOOD } from '../flux3-s4-arms.mjs';

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
const pressEsc = async (app) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
};
const lookOf = (app) => app.evalJs("({ caret: (() => { const e = document.querySelector('.forward-only-editor'), s = getSelection(); return !!e && !!s && s.rangeCount > 0 && e.contains(s.anchorNode); })(), focus: document.activeElement === document.querySelector('.forward-only-editor'), block: !!document.querySelector('.flux-block-caret'), hand: document.querySelector('.wz-sliver-grip')?.getAttribute('aria-expanded') || null, writing: document.documentElement.getAttribute('data-wz-writing') })");
const escLater = async (app, name, opts) => {
  await seed(app, LONG_TEXT, opts);
  await app.typeKeys(' and the line keeps going');
  await sleep(300);
  await pressEsc(app);
  await sleep(1200);
  console.log(`FLUX3-S4-FRAME ${name} ${JSON.stringify({ ...(await stood(app)), ...(await lookOf(app)) })}`);
};
// JACK OUT, THEN ESC (the Wrizors' S4 r7 review, Fable Nov 7): today's toggle in the TOOLS hand, Esc, and the frame 1.2 s later; jack-out-esc under
// the flag, jack-out-esc-control the flag-off Typewriter, the same steps (a caret missing on both is the Typewriter's, bug #49, not S4's)
const outLater = async (app, name, opts) => {
  await seed(app, LONG_TEXT, opts);
  await openHand(app);
  const t = await point(app, '[data-mode-toggle="typewriter"]');
  if (t) { await click(app, t); await sleep(700); }
  await pressEsc(app);
  await sleep(1200);
  console.log(`FLUX3-S4-FRAME ${name} ${JSON.stringify({ ...(await stood(app)), toggled: !!t, ...(await lookOf(app)) })}`);
};

const tunnelOf = (app) => app.evalJs("(() => { const t = document.querySelector('[data-flux3-tunnel]'); if (!t) return null; const a = t.getAnimations({ subtree: true }); return { anims: a.length, rates: [...new Set(a.map((x) => x.playbackRate))], fast: t.hasAttribute('data-fast'), still: t.hasAttribute('data-still'), writing: document.documentElement.getAttribute('data-wz-writing') }; })()");

// THE LATENCY EXPERIMENT'S ARMS (Fable, Nov 8: frames per arm, light and dark; Nick picks). Each arm is an in-flight patch of the served files
// (scripts/flux3-s4-arms.mjs), armed for the screen's own load only. arm-*: after a burst and the pause (the rows compiled); arm-*-typing: shot
// while she is still typing (the hold's only difference shows there). Each prints whether every patch landed once and what stood.
const armShot = async (app, name, arm, typing) => {
  const arms = await installArms(app);
  arms.set(arm);
  try { await seed(app, LONG_TEXT); } finally { arms.set(null); }
  const landed = arms.landed(arm);
  await app.evalJs(ARM_STAND);
  const burst = ' the signal holds while she writes on and on';
  for (let i = 0; i < (typing ? 60 : 44); i += 1) { await app.typeKeys(burst[i % burst.length]); await sleep(typing ? 35 : 60); }
  const mid = typing ? await app.evalJs(ARM_READ) : null;
  if (!typing) { await app.mouseMove(8, 8); await sleep(1600); }
  const rest = typing ? null : await app.evalJs(ARM_READ);
  const ok = typing ? (arm === 'hold' ? !!mid && mid.hold && mid.running === 0 : !!mid && mid.running > 0) : STOOD[arm](rest, null);
  console.log(`FLUX3-S4-ARM-FRAME ${name} ${JSON.stringify({ arm, landed, counts: arms.counts(), stood: ok, ...(await stood(app)), read: rest || mid })}`);
};
const ARM_SCREENS = Object.fromEntries([
  ['arm-j', 'J', false], ['arm-j-typing', 'J', true], ['arm-hold-typing', 'hold', true],
  ['arm-light', 'light', false], ['arm-margins', 'margins', false], ['arm-veil', 'veil', false],
].map(([name, arm, typing]) => [name, (app) => armShot(app, name, arm, typing)]));

export default {
  ...ARM_SCREENS,
  // THE TUNNEL (Nick kept it, Nov 7): at rest, and mid-burst (shot while she is still typing fast: the speed re-set, the streaks on)
  'jack-tunnel': async (app) => {
    await seed(app, LONG_TEXT);
    console.log(`FLUX3-S4-FRAME jack-tunnel ${JSON.stringify({ ...(await stood(app)), tunnel: await tunnelOf(app) })}`);
  },
  // the Wrizors' S4 r9 review (Fable, Nov 7): the frame 300 ms after a burst (the caret at the text's end; the rows of the last pause still there)
  'jack-burst-300': async (app) => {
    await seed(app, LONG_TEXT);
    const burst = ' the signal holds while she writes on and on and on whil';
    for (const ch of burst) { await app.typeKeys(ch); await sleep(35); }
    await sleep(300);
    const at = await app.evalJs("(() => { const bc = document.querySelector('.flux-block-caret'), ed = document.querySelector('.forward-only-editor'); let last = null; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if ((n.nodeValue || '').trim()) last = n; let end = null; if (last) { const i = last.nodeValue.trimEnd().length; const r = document.createRange(); r.setStart(last, i - 1); r.setEnd(last, i); end = [...r.getClientRects()].pop(); } return { caretX: bc ? Math.round(bc.getBoundingClientRect().left) : null, endX: end ? Math.round(end.right) : null }; })()");
    console.log(`FLUX3-S4-FRAME jack-burst-300 ${JSON.stringify({ ...(await stood(app)), ...at })}`);
  },
  'jack-tunnel-fast': async (app) => {
    await seed(app, LONG_TEXT);
    const burst = ' the signal holds while she writes on and on';
    for (let i = 0; i < 110; i += 1) { await app.typeKeys(burst[i % burst.length]); await sleep(35); }
    console.log(`FLUX3-S4-FRAME jack-tunnel-fast ${JSON.stringify({ ...(await stood(app)), tunnel: await tunnelOf(app) })}`);
  },
  'jack-esc':(app) => escLater(app, 'jack-esc', { flag: true, typewriter: false }),
  'jack-esc-control': (app) => escLater(app, 'jack-esc-control', { flag: false, typewriter: true }),
  'jack-out-esc': (app) => outLater(app, 'jack-out-esc', { flag: true, typewriter: false }),
  // the Wrizors' last S4 item (Fable, Nov 7): the plain page >= 1 s after jacking out (past the 420 ms fade): clean words, no signal
  'jack-out-later': async (app) => {
    await seed(app, LONG_TEXT);
    await openHand(app);
    const t = await point(app, '[data-mode-toggle="typewriter"]');
    if (t) { await click(app, t); await sleep(1200); }
    console.log(`FLUX3-S4-FRAME jack-out-later ${JSON.stringify({ ...(await stood(app)), toggled: !!t, layers: await app.evalJs("document.querySelectorAll('[data-flux3-compile]').length") })}`);
  },
  'jack-out-esc-control': (app) => outLater(app, 'jack-out-esc-control', { flag: false, typewriter: true }),
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
