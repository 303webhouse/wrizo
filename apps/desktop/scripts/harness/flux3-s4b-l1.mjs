// FLUX3 S4b L1 - THE CIRCUIT GROUND ACROSS THE ROOM (Nick, Nov 9: "the loved look"; flux-mockup-vs-build.md §4 L1). Every check is a sentence of the plan,
// read in the live page behind ?flux3=1 (Flux theme).
//   GROUND   one box (data-flux3-room-ground) sits first in the framed host, behind its content (z-index -1 in the host's own stacking context), inert
//            (no pointer, aria-hidden), and its canvas really has circuitry on it (non-transparent pixels), on a Page room and on a Schema (board) room.
//   RECT     the ground adds nothing to any layout: the page's rect, the host's rect and the editor's are the same with the box shown and with it taken away.
//   ONCE     the ground is drawn once per size, never per key and never per frame: the canvas is cleared the same number of times before and after
//            forty keys and a pause; a resize redraws it. The room is dark in both Page tones, so a tone change leaves it as it is (S5's Room setting changes that).
//   DIAL     Ambiance 0 draws nothing; the default is full strength; 25 is half (opacity = dial / 50).
//   CURRENT  at most three drifting points, every animation on transform or opacity alone; reduced motion: none; a key pauses them and they run again after
//            the quiet (the damping rule).
//   MUT-*    each reader can go red: the same read, after a change landed in the page (the ground hidden, a fourth point added, the box made a hit target),
//            fails; a mutant that did not land fails the run.
// FLUX3_SHOTS=<dir> writes frames. Run: node scripts/harness/flux3-s4b-l1.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const INSTRUMENT = `(() => {
  if (window.__l1) return;
  const I = window.__l1 = { clears: 0 };
  const cr = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...a) { const p = this.canvas && this.canvas.parentElement; if (p && p.hasAttribute('data-flux3-room-ground')) I.clears += 1; return cr.apply(this, a); };
  I.box = () => document.querySelector('[data-flux3-room-ground]');
  I.read = () => { const b = I.box(); if (!b) return null; const host = b.parentElement, cv = b.querySelector('canvas'); const cs = getComputedStyle(b);
    let px = 0; try { const g = cv.getContext('2d'); const d = g.getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) px += 1; } catch (e) { px = -1; }
    const anims = b.getAnimations({ subtree: true }); const props = new Set(); anims.forEach((a) => (a.effect.getKeyframes() || []).forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p); })));
    return { first: host.firstElementChild === b, host: String(host.className).slice(0, 24), z: cs.zIndex, pe: cs.pointerEvents, aria: b.getAttribute('aria-hidden'), op: +cs.opacity, px, dots: b.querySelectorAll('i').length, anims: anims.length, running: anims.filter((a) => a.playState === 'running').length, paused: anims.filter((a) => a.playState === 'paused').length, props: [...props], iso: getComputedStyle(host).isolation, cw: cv.width, ch: cv.height }; };
  I.rects = () => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }; return { page: q('.mode-page'), host: q('.desk-frame-host'), editor: q('.forward-only-editor'), board: q('.board-canvas-wrap') }; };
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const mk = (row) => ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  const open = async ({ id, tone = 'dark', dial = 50, reduced = false }) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(dial))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }, {}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor') || !!document.querySelector('.board-canvas-wrap')", { timeout: 15000, label: 'the room' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1800);
  };
  const page = async (opts) => { const id = `f3l1-${Date.now()}-${seq += 1}`; await mk({ id, text: 'The room behind the page.\nA second line.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' }); await sleep(300); await open({ ...opts, id }); return id; };
  const read = () => ev('window.__l1.read()');

  // ---- GROUND + RECT on a Page room --------------------------------------------------------------------------------------------------------------
  await page({ tone: 'dark' });
  const g = await read();
  const groundOk = (r) => !!r && r.first && r.z === '-1' && r.pe === 'none' && r.aria === 'true' && r.px > 2000 && r.iso === 'isolate' && /desk-frame-host/.test(r.host);
  ok('GROUND a Page room: the ground box is first in the framed host, behind its content (z -1, the host isolated), inert, and its canvas has circuitry on it', groundOk(g), JSON.stringify(g));
  await snap('l1-page-dark');
  const rectOn = await ev('window.__l1.rects()');
  await ev("document.querySelector('[data-flux3-room-ground]').style.display = 'none'"); await sleep(250);
  const rectOff = await ev('window.__l1.rects()');
  await ev("document.querySelector('[data-flux3-room-ground]').style.display = ''"); await sleep(100);
  ok('RECT the page, the host and the editor have the same rects with the ground shown and taken away (a ground, never a panel: page primacy)', JSON.stringify(rectOn) === JSON.stringify(rectOff) && !!rectOn.page, JSON.stringify({ rectOn, rectOff }));

  // ---- ONCE: drawn per size and tone, never per key or frame -----------------------------------------------------------------------------------------
  await ev("document.querySelector('.forward-only-editor').focus()");
  const c0 = await ev('window.__l1.clears');
  for (const ch of 'the ground is drawn once and never per key ') { await app.typeKeys(ch); await sleep(35); }
  await sleep(2200);
  const c1 = await ev('window.__l1.clears');
  await app.cdp('Emulation.setDeviceMetricsOverride', { width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false }); await sleep(900);
  const c2 = await ev('window.__l1.clears');
  await ev("document.documentElement.setAttribute('data-page', 'light')"); await sleep(600);
  const c3 = await ev('window.__l1.clears');
  await ev("document.documentElement.setAttribute('data-page', 'dark')"); await sleep(400);
  await app.emulateDpr(1, 1920, 1080); await sleep(600);
  ok(`ONCE the ground is drawn once per size: 0 redraws over 44 keys and a pause (${c1 - c0}), a resize redraws it (${c2 - c1} >= 1), a Page-tone change leaves it (${c3 - c2} == 0: the room is dark in both)`, c1 - c0 === 0 && c2 - c1 >= 1 && c3 - c2 === 0, JSON.stringify({ c0, c1, c2, c3 }));

  // ---- CURRENT + DAMPING ---------------------------------------------------------------------------------------------------------------------------
  await sleep(1200);
  const cur = await read();
  const curOk = (r) => !!r && r.dots >= 1 && r.dots <= 3 && r.anims === r.dots && r.props.length > 0 && r.props.every((p) => p === 'transform' || p === 'opacity');
  ok('CURRENT one to three drifting points, one animation each, transform and opacity alone', curOk(cur), JSON.stringify(cur));
  await ev("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('x'); await sleep(200);
  const damped = await read();
  await sleep(2300);
  const woke = await read();
  ok('DAMP a key pauses the current (all points paused 0.2 s after it) and it runs again after the quiet (all running 2.5 s after)', !!damped && damped.paused === damped.anims && damped.anims >= 1 && !!woke && woke.running === woke.anims, JSON.stringify({ damped: [damped.paused, damped.anims], woke: [woke.running, woke.anims] }));

  // ---- DIAL + REDUCED MOTION -----------------------------------------------------------------------------------------------------------------------
  await page({ dial: 0 });
  const d0 = await read();
  await page({ dial: 25 });
  const d25 = await read();
  await page({ dial: 100 });
  const d100 = await read();
  ok('DIAL Ambiance 0 draws no ground; 25 is half strength (opacity .5); 100 is capped at full', d0 === null && !!d25 && Math.abs(d25.op - 0.5) < 0.02 && !!d100 && d100.op === 1, JSON.stringify({ d0, op25: d25 && d25.op, op100: d100 && d100.op }));
  await page({ reduced: true });
  const still = await read();
  ok('STILL reduced motion: the ground stands (circuitry drawn) with no point moving', !!still && still.px > 2000 && still.dots === 0 && still.anims === 0, JSON.stringify(still));

  // ---- a Schema (board) room ----------------------------------------------------------------------------------------------------------------------
  const bid = `f3l1-board-${Date.now()}`;
  await mk({ id: bid, text: 'Schema L1', pageType: 'board', boxes: [{ id: 'b1', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Card' }], createdAt: new Date().toISOString(), origin: null, source: null });
  await sleep(300);
  await open({ id: bid });
  const bd = await read();
  ok('GROUND a Schema room: the same ground sits first in the board\'s framed host', groundOk(bd), JSON.stringify(bd));
  await snap('l1-board-dark');

  // ---- MUT: each reader goes red on its own mutant (a change landed, then the SAME read; undone after) ---------------------------------------------------
  await page({ tone: 'dark' });
  await sleep(1200);
  const base = await read();
  const muts = [
    ['a fourth point', "(() => { const b = document.querySelector('[data-flux3-room-ground]'); const d = document.createElement('i'); d.className = 'mut'; d.style.cssText = 'position:absolute;left:0;top:0;width:4px;height:4px'; b.appendChild(d); d.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(40px)' }], { duration: 1000, iterations: Infinity }); })()", "document.querySelectorAll('[data-flux3-room-ground] i.mut').forEach((e) => e.remove())", async () => !curOk(await read())],
    ['a hit target', "document.querySelector('[data-flux3-room-ground]').style.setProperty('pointer-events', 'auto', 'important')", "document.querySelector('[data-flux3-room-ground]').style.removeProperty('pointer-events')", async () => !groundOk(await read())],
    ['ground hidden', "document.querySelector('[data-flux3-room-ground]').remove()", null, async () => !groundOk(await read())],
  ];
  ok('MUT-BASE the readers are green on the untouched page before their mutants run', groundOk(base) && curOk(base), JSON.stringify(base));
  for (const [name, apply, undo, red] of muts) {
    await ev(apply); await sleep(250);
    const wentRed = await red();
    if (undo) { await ev(undo); await sleep(250); }
    ok(`MUT-${name.toUpperCase().replace(/ /g, '-')} the reader goes RED on its mutant (${name})${undo ? ' and green again undone' : ''}`, wentRed && (undo ? (groundOk(await read()) && curOk(await read())) : true), name);
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-S4B-L1 VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-S4B-L1 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
