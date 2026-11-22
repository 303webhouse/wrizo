// FLUX 3 - THE CURRENT, ONE LAYER FOR TWO THINGS (Fable, Nov 21, 4:56 pm and 6:00 pm; flux-full-look-for-monday.md item 8 and section 2; Nick, 4:40 and 4:47 pm). Behind ?flux3=1, in the Flux theme.
//   HANDS    the drawers open as current (POLISH's Oct 28 mockup): a 1 px cyan line shoots from the tab along the menu box's top edge, and an electron runs it for as long as the menu is open; it goes when
//            the menu shuts. The line and the electron belong to the menu: they fade with it when the chrome recedes (the same classes), and the electron rests while she writes.
//   STAGE    the stage current, v2 (flux-stage-current-concept-v2.png): she presses a stage button (WIRE IN / TEXT / PATCH / UPLINK); a 1 px cyan spark about 60 px long leaves that button along the
//            top bar's lower edge to each side, then runs one lap around each menu (a closed menu: its opener tab) in about 0.55 s, and is gone. Nothing stays lit. Wire In has no menus: pressing it sends
//            none; leaving it sends one.
//   ONLY ON A CLICK   the layer has one listener, a click, and nothing on the typing path: no key, input, scroll or selection listener, no timer, no frame loop. A menu that opens by the keyboard or at page
//            load draws no current.
//   QUIET   no spark and no hand current under reduced motion, or at Ambiance 0; without ?flux3=1 none of it loads.
//   SU1..SU5 the stage spark: draws on a change, leaves the pressed button at the bar's lower edge, never inside the page's rectangle, is gone after 0.55 s, runs once per change, none from Wire In
//   HA1..HA4 the hands: the line sits on the menu box's top edge, the electron runs on transform alone, the current goes when the menu shuts, a keyboard open draws none
//   TY1..TY3 the typing path: typing with a hand open adds no run, no mutation in the layer, and the electron rests; the source holds only the click listener (and a resize listener while a hand is open)
//   QU1..QU3 reduced motion, Ambiance 0, and the flag off draw nothing
//   MUT-*    the readers can go red: with the layer's listener taken away the stage reader (SU1) fails; a source with a key listener fails TY3
//   L        the layer adds no typing latency (the L method, on the box; FLUX3_L=1 runs it elsewhere)
// FLUX3_SHOTS=<dir> writes frames (the Wrizors' sheet). Run: node scripts/harness/flux3-current.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { makeL } from '../lib/l-method.mjs';

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const LAYER_SRC = path.join(here, '..', '..', 'src', 'flux3', 'fluxCurrent.ts');
const LAYER_CSS = path.join(here, '..', '..', 'src', 'flux3', 'flux-current.css');
const layerText = fs.existsSync(LAYER_SRC) ? fs.readFileSync(LAYER_SRC, 'utf8') : null;
const layerCss = fs.existsSync(LAYER_CSS) ? fs.readFileSync(LAYER_CSS, 'utf8') : '';

// the typing-path reader, over the layer's own source: ONE click listener, a resize listener only while a hand is open, no key / input / scroll / selection / pointer-move listener, no timer loop, at most two frame requests (the
// two that let a click's re-render settle before the geometry is read)
const FORBIDDEN = /addEventListener\(\s*['"](keydown|keyup|keypress|input|beforeinput|scroll|selectionchange|pointermove|mousemove|wheel|focusin|focusout)['"]/;
function typingPathClean(src) {
  if (src === null) return false;
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const adds = [...code.matchAll(/addEventListener\(\s*['"](\w+)['"]/g)].map((m) => m[1]);
  return !FORBIDDEN.test(code) && !/setInterval\(/.test(code) && (code.match(/requestAnimationFrame\(/g) || []).length <= 2 && adds.every((a) => a === 'click' || a === 'resize') && adds.includes('click');
}

// a function, not a constant: item141's settle guard reads a seam named at the top level as a read before a settle
const READ = () => `(() => {
  const q = (s) => document.querySelector(s);
  const rect = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const w = window.wrizoFluxCurrent || null;
  return { api: !!w, runs: w ? w.runs : null, last: w ? w.last : null,
    sparks: document.querySelectorAll('[data-flux-current]').length,
    hands: [...document.querySelectorAll('[data-flux-hand]')].map((h) => ({ side: h.getAttribute('data-flux-hand'), rect: rect(h), line: rect(h.querySelector('.flux-hand-line')), electron: !!h.querySelector('.flux-hand-electron') })),
    page: rect(q('.mode-page')), sliver: rect(q('.wz-sliver-panel')), tutor: rect(q('.wz-tutor-panel')),
    bar: rect(q('.chrome-top')), openL: q('.wz-sliver-panel') && q('.wz-sliver-panel').getAttribute('data-open'), openR: q('.wz-tutor-panel') && q('.wz-tutor-panel').getAttribute('data-open') };
})()`;
const ELECTRON = `(() => { const e = document.querySelector('[data-flux-hand] .flux-hand-electron'); if (!e) return null; const a = e.getAnimations(); const props = new Set(); a.forEach((x) => (x.effect.getKeyframes() || []).forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p); })));
  return { n: a.length, state: a[0] ? a[0].playState : null, props: [...props] }; })()`;
const SPARKANIMS = `(() => { const svg = document.querySelector('[data-flux-current]'); if (!svg) return null; const a = svg.getAnimations({ subtree: true }); const props = new Set(); a.forEach((x) => (x.effect.getKeyframes() || []).forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p); })));
  return { n: a.length, props: [...props], dur: a[0] ? a[0].effect.getTiming().duration : null }; })()`;

const inside = (p, r) => p[0] > r.left && p[0] < r.right && p[1] > r.top && p[1] < r.bottom;
const crosses = (pts, r) => { for (let i = 1; i < pts.length; i += 1) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; if (Math.max(x0, x1) > r.left && Math.min(x0, x1) < r.right && Math.max(y0, y1) > r.top && Math.min(y0, y1) < r.bottom) return true; } return false; };

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const mk = (row) => ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  const open = async ({ id, flag = true, reduced = false, dial = 50 }) => {
    await ev(`(() => { localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(dial))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`history.replaceState(null, '', '/${flag ? '?flux3=1' : ''}#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1500);
  };
  const page = async (opts = {}) => { const id = `f3cur-${Date.now()}-${seq += 1}`; await mk({ id, text: 'The room behind the page.\nA second line.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' }); await sleep(300); await open({ ...opts, id }); return id; };
  const act = () => ev("[...document.querySelectorAll('.desk-mode-tab')].filter((b) => b.getAttribute('aria-selected') === 'true').map((b) => b.getAttribute('data-mode-key')).join()");
  const tab = (key) => ev(`(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key="${key}"]'); if (!b) return null; const r = b.getBoundingClientRect(); const out = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, active: b.getAttribute('aria-selected') }; b.click(); return out; })()`);
  const read = () => ev(READ());

  // ---- STAGE: SU1..SU5 --------------------------------------------------------------------------------------------------------------------------------
  await page();
  const r0 = await read();
  ok('SU0 the layer is loaded under ?flux3=1 (window.wrizoFluxCurrent) and the page has its Front menu, Back menu, page and bar', r0.api === true && r0.runs === 0 && !!r0.page && !!r0.sliver && !!r0.tutor && !!r0.bar, JSON.stringify({ api: r0.api, page: !!r0.page, sliver: !!r0.sliver, tutor: !!r0.tutor, bar: !!r0.bar }));
  const b1 = await tab('revise');
  await sleep(120);
  const s1 = await read();
  const an1 = await ev(SPARKANIMS);
  await snap('current-stage-spark');
  const L1 = s1.last;
  const sides = L1 && L1.paths ? L1.paths.map((p) => p.side).sort().join(',') : '';
  ok('SU1 a stage change draws a spark: ONE run, kind "stage", a path for each menu (left and right), the spark layer in the page while it runs',
    s1.runs === 1 && !!L1 && L1.kind === 'stage' && sides === 'left,right' && s1.sparks === 1 && !!an1 && an1.n >= 8, JSON.stringify({ runs: s1.runs, kind: L1 && L1.kind, sides, sparks: s1.sparks, anims: an1 && an1.n }));
  const startsOk = !!L1 && !!b1 && L1.paths.every((p) => p.pts[0][0] >= b1.left - 1 && p.pts[0][0] <= b1.right + 1 && Math.abs(p.pts[0][1] - Math.min(s1.bar.bottom, s1.page.top - 2)) <= 3);
  ok('SU2 the spark LEAVES THE PRESSED BUTTON: each path starts at the button\'s own x, on the top bar\'s lower edge (held above the page)', startsOk, JSON.stringify({ btn: b1 && [b1.left, b1.right], starts: L1 && L1.paths.map((p) => p.pts[0]), barBottom: s1.bar && s1.bar.bottom }));
  const gutters = !!L1 && L1.paths.every((p) => p.pts.every((pt) => !inside(pt, s1.page)) && !crosses(p.pts, s1.page) && p.pts.every((pt) => pt[0] >= 0 && pt[0] <= 1920 && pt[1] >= 0 && pt[1] <= 1080));
  ok('SU3 GUTTERS ONLY: no point and no segment of either path is inside the page\'s rectangle (the words), and every point is on the screen', gutters, JSON.stringify({ page: s1.page, nPts: L1 && L1.paths.map((p) => p.pts.length) }));
  const spec = !!L1 && L1.sparkPx === 60 && L1.durationMs === 550 && !!an1 && an1.dur === 550 && an1.props.length === 1 && an1.props[0] === 'strokeDashoffset' && L1.layers === 4 && L1.strokePx === 1;
  ok('SU4 the spark is the v2 one: 60 px, 1 px, four layers, 550 ms, one property (stroke-dashoffset), and one lap round each menu (a path at least the menu\'s perimeter long)', spec && L1.paths.every((p) => p.length > 2 * ((p.menu.right - p.menu.left) + (p.menu.bottom - p.menu.top)) * 0.95), JSON.stringify({ sparkPx: L1 && L1.sparkPx, ms: L1 && L1.durationMs, anim: an1, layers: L1 && L1.layers }));
  await sleep(900);
  const s1b = await read();
  const an1b = await ev(SPARKANIMS);
  ok('SU5 NOTHING STAYS LIT: after the lap there is no spark layer in the page and no animation running in it', s1b.sparks === 0 && an1b === null, JSON.stringify({ sparks: s1b.sparks }));
  // once per change
  await tab('revise'); await sleep(150);
  const s2 = await read();
  ok('SU6 ONCE PER CHANGE: pressing the stage she is already in draws nothing (the run count stands)', s2.runs === 1 && s2.sparks === 0, JSON.stringify({ runs: s2.runs, sparks: s2.sparks }));
  await tab('draft'); await sleep(150);
  const s3 = await read();
  ok('SU7 ...and pressing a different stage draws one more', s3.runs === 2 && s3.sparks === 1, JSON.stringify({ runs: s3.runs, sparks: s3.sparks }));
  await sleep(900);
  // Wire In
  await tab('freewrite'); await sleep(600);
  const s4 = await read();
  const a4 = await act();
  ok('SU8 WIRE IN has no menus: pressing it sends no spark (and Wire In is the stage she is in)', s4.runs === 2 && s4.sparks === 0 && a4 === 'freewrite', JSON.stringify({ runs: s4.runs, sparks: s4.sparks, active: a4, openL: s4.openL }));
  await sleep(500);
  await tab('draft'); await sleep(1200);
  const s5 = await read();
  const a5 = await act();
  ok('SU9 ...and leaving it sends one, to the menus as they return (a run with at least one path)', s5.runs === 3 && !!s5.last && s5.last.paths.length >= 1, JSON.stringify({ runs: s5.runs, paths: s5.last && s5.last.paths.length, active: a5 }));
  await sleep(900);

  // ---- HANDS: HA1..HA4 --------------------------------------------------------------------------------------------------------------------------------
  await page();
  const open0 = await read();
  ok('HA0 both menus start shut and no hand current is drawn', open0.openL === 'false' && open0.openR === 'false' && open0.hands.length === 0, JSON.stringify({ openL: open0.openL, openR: open0.openR, hands: open0.hands.length }));
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()");
  await sleep(500);
  const h1 = await read();
  const el1 = await ev(ELECTRON);
  await snap('current-hand-left');
  const hl = h1.hands.find((h) => h.side === 'left');
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  ok('HA1 the Front menu opens as current: a line sits on the menu box\'s top edge (same left, width and top, 1 px thick) with an electron beside it',
    h1.openL === 'true' && !!hl && !!hl.line && hl.electron && near(hl.line.left, h1.sliver.left, 3) && near(hl.line.right, h1.sliver.right, 3) && near(hl.line.top, h1.sliver.top, 3) && hl.line.bottom - hl.line.top <= 1.5 && !h1.hands.find((h) => h.side === 'right'),
    JSON.stringify({ line: hl && hl.line, box: h1.sliver }));
  ok('HA2 the electron runs the line while the menu is open, on transform alone (one animation, running)', !!el1 && el1.n === 1 && el1.state === 'running' && el1.props.length === 1 && el1.props[0] === 'transform', JSON.stringify(el1));
  await ev("(() => { const g = document.querySelector('.wz-tutor-grip'); g.focus(); g.click(); })()");
  await sleep(500);
  const h2 = await read();
  const hr = h2.hands.find((h) => h.side === 'right');
  ok('HA3 the Back menu does the same on its side, and the two currents are separate', h2.openR === 'true' && !!hr && !!hr.line && near(hr.line.left, h2.tutor.left, 3) && near(hr.line.right, h2.tutor.right, 3) && near(hr.line.top, h2.tutor.top, 3) && h2.hands.length === 2, JSON.stringify({ line: hr && hr.line, box: h2.tutor, hands: h2.hands.length }));
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()");
  await ev("(() => { const g = document.querySelector('.wz-tutor-grip'); g.focus(); g.click(); })()");
  await sleep(800);
  const h3 = await read();
  ok('HA4 the current goes when the menus shut: no hand current left, and no animation of it running', h3.openL === 'false' && h3.openR === 'false' && h3.hands.length === 0, JSON.stringify({ hands: h3.hands.length, openL: h3.openL, openR: h3.openR }));
  // opened by the keyboard: no current
  await ev("window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }))");
  await sleep(600);
  const h4 = await read();
  ok('HA5 ONLY ON A CLICK: a menu opened by the keyboard shortcut (Ctrl+/) draws no current', h4.openL === 'true' && h4.hands.length === 0, JSON.stringify({ openL: h4.openL, hands: h4.hands.length }));
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()"); await sleep(500);   // shut it with a click (the page's own state: open -> shut)
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()"); await sleep(500);   // and open it with one

  // ---- TYPING PATH: TY1..TY3 --------------------------------------------------------------------------------------------------------------------------
  const before = await read();
  await ev("window.__mutN = 0; window.__mutObs && window.__mutObs.disconnect(); window.__mutObs = new MutationObserver((r) => { window.__mutN += r.length; }); document.querySelectorAll('[data-flux-hand], [data-flux-current]').forEach((n) => window.__mutObs.observe(n, { subtree: true, attributes: true, childList: true })); const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); true");
  for (const ch of 'typing with a menu open draws nothing ') { await app.typeKeys(ch); await sleep(30); }
  await sleep(300);
  const after = await read();
  const elT = await ev(ELECTRON);
  const mutN = await ev('window.__mutN');
  ok('TY1 typing with a hand open adds no run and no spark, and nothing in the layer changes (no mutation of its nodes, none added or removed)', after.runs === before.runs && after.sparks === 0 && mutN === 0 && after.hands.length === before.hands.length, JSON.stringify({ runs: [before.runs, after.runs], sparks: after.sparks, mutN, hands: [before.hands.length, after.hands.length] }));
  ok('TY2 the electron rests while she writes (her editor has focus): its animation is paused, not running', !!elT && elT.state === 'paused', JSON.stringify(elT));
  ok('TY3 the layer\'s source holds only a click listener (and a resize listener while a hand is open): no key, input, scroll, selection or pointer-move listener, no timer, at most two frame requests', typingPathClean(layerText), layerText === null ? 'src/flux3/fluxCurrent.ts is missing' : '');
  ok('TY4 the layer\'s styles animate transform and opacity alone (no layout or paint property in a keyframe)', layerCss.length > 0 && [...layerCss.matchAll(/@keyframes[^{]*\{([\s\S]*?\}\s*)\}/g)].every((m) => !/\b(width|height|left|top|right|bottom|margin|padding|background|box-shadow|filter)\s*:/.test(m[1])), layerCss.length ? '' : 'src/flux3/flux-current.css is missing');
  ok('MUT-TY3 the typing-path reader goes RED on a source that listens to keys, runs a timer or loops frames', !typingPathClean((layerText || '') + "\ndocument.addEventListener('keydown', () => {});") && !typingPathClean((layerText || '') + '\nsetInterval(() => {}, 10);') && !typingPathClean((layerText || '') + '\nrequestAnimationFrame(a); requestAnimationFrame(b); requestAnimationFrame(c);'), 'three mutated sources');
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()"); await sleep(600);

  // ---- QUIET: QU1..QU3 --------------------------------------------------------------------------------------------------------------------------------
  await page({ reduced: true });
  await tab('revise'); await sleep(200);
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()"); await sleep(500);
  const q1 = await read();
  ok('QU1 REDUCED MOTION: a stage change draws no spark and a menu opens with no hand current', q1.runs === 0 && q1.sparks === 0 && q1.hands.length === 0 && q1.openL === 'true', JSON.stringify({ runs: q1.runs, sparks: q1.sparks, hands: q1.hands.length, openL: q1.openL }));
  await page({ dial: 0 });
  await tab('revise'); await sleep(200);
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()"); await sleep(500);
  const q2 = await read();
  ok('QU2 AMBIANCE 0: no spark and no hand current either', q2.runs === 0 && q2.sparks === 0 && q2.hands.length === 0 && q2.openL === 'true', JSON.stringify({ runs: q2.runs, sparks: q2.sparks, hands: q2.hands.length }));
  await page({ flag: false });
  await tab('revise'); await sleep(200);
  await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()"); await sleep(500);
  const q3 = await read();
  ok('QU3 WITHOUT ?flux3=1 nothing loads: no window.wrizoFluxCurrent, no spark, no hand current (the Flux theme alone)', q3.api === false && q3.sparks === 0 && q3.hands.length === 0 && q3.openL === 'true', JSON.stringify({ api: q3.api, sparks: q3.sparks, hands: q3.hands.length }));

  // ---- MUT: the stage reader can go red -----------------------------------------------------------------------------------------------------------------
  await page();
  await ev('window.wrizoFluxCurrent && window.wrizoFluxCurrent.detach && window.wrizoFluxCurrent.detach()');
  await tab('revise'); await sleep(200);
  const m1 = await read();
  ok('MUT-SU1 with the layer\'s click listener taken away the stage reader goes RED (a change draws no run)', m1.api === true && m1.runs === 0 && m1.sparks === 0, JSON.stringify({ runs: m1.runs, sparks: m1.sparks }));

  // ---- L: the layer adds no typing latency (the L method, on the box) ---------------------------------------------------------------------------------
  if (ON_BOX || process.env.FLUX3_L === '1') {
    const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
    const L = makeL({
      app, ev, sleep, cycle: 'the current is a click, never a key ',
      prepare: async (arm, on) => {
        const id = `f3cur-lat-${Date.now()}-${seq += 1}`;
        await mk({ id, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
        await sleep(300);
        await open({ id });
        await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()");
        await sleep(600);
        const hadHand = !!(await ev("!!document.querySelector('[data-flux-hand]')"));
        if (!(arm === 'J' && on)) await ev("(() => { document.querySelectorAll('[data-flux-hand]').forEach((n) => n.remove()); window.wrizoFluxCurrent && window.wrizoFluxCurrent.detach && window.wrizoFluxCurrent.detach(); })()");
        await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
        await sleep(400);
        return { hadHand, hasHand: !!(await ev("!!document.querySelector('[data-flux-hand]')")) };
      },
      stoodRight: (arm, on, stood) => !!stood && stood.hadHand && stood.hasHand === (arm === 'J' && on),
    });
    await L.run(ok, { subject: 'the current layer (a hand open while she types)', onlyMethod: false });
  } else console.log("INFO L (Actions: timing is the box's to judge; FLUX3_L=1 runs it here)");
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-CURRENT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-CURRENT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
