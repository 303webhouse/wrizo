// FLUX3 S4b L1 - THE CIRCUIT GROUND ACROSS THE ROOM (Nick, Nov 9: "the loved look"; flux-mockup-vs-build.md §4 L1). Every check is a sentence of the plan,
// read in the live page behind ?flux3=1 (Flux theme).
//   GROUND   one box (data-flux3-room-ground) sits first in the framed host, behind its content (z-index -1 in the host's own stacking context), inert
//            (no pointer, aria-hidden), and its background image is the circuitry (a picture; NO canvas element in the page: a full-room canvas layer cost
//            ~3 ms a frame on a software renderer), on a Page room and on a Schema (board) room.
//   TAME     no trace is louder than the rest (the Wrizors, Nov 9: one long trace read 3.75:1 and passed for a link): the strongest pixel in the ground's picture, composited on
//            the room's colour, has a lower contrast than the FAINTEST real link (the Schema layer's link colour, read from its source), and the reader goes RED on the old
//            full-strength drawing.
//   RECT     the ground adds nothing to any layout: the page's rect, the host's rect and the editor's are the same with the box shown and with it taken away.
//   ONCE     the ground is drawn once per size, never per key and never per frame: the canvas is cleared the same number of times before and after
//            forty keys and a pause; a resize redraws it. The room is dark in both Page tones, so a tone change leaves it as it is (S5's Room setting changes that).
//   DIAL     Ambiance 0 draws nothing; the default is full strength; 25 is half (opacity = dial / 50).
//   CURRENT  at most three drifting points, every animation on transform or opacity alone; reduced motion: none; a key pauses them and they run again after
//            the quiet (the damping rule).
//   L        the ground adds no typing latency: six interleaved rounds, two readings (the clock and the main-thread cost per key), the ground in J against the same page
//            with the box taken away in C; the control against itself GREEN, +5 / +10 ms RED on the cost reading (on the box; FLUX3_L=1 runs it elsewhere).
//   MUT-*    each reader can go red: the same read, after a change landed in the page (the ground hidden, a fourth point added, the box made a hit target),
//            fails; a mutant that did not land fails the run.
// FLUX3_SHOTS=<dir> writes frames. Run: node scripts/harness/flux3-s4b-l1.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const INSTRUMENT = `(() => {
  if (window.__l1) return;
  const I = window.__l1 = {};
  Object.defineProperty(I, 'clears', { get: () => { const b = document.querySelector('[data-flux3-room-ground]'); return b ? Number(b.dataset.draws || 0) : 0; } });
  I.box = () => document.querySelector('[data-flux3-room-ground]');
  I.read = () => { const b = I.box(); if (!b) return null; const host = b.parentElement; const cs = getComputedStyle(b);
    const px = cs.backgroundImage.indexOf('data:image/png') > 0 ? cs.backgroundImage.length : 0;
    const anims = b.getAnimations({ subtree: true }); const props = new Set(); anims.forEach((a) => (a.effect.getKeyframes() || []).forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p); })));
    return { first: host.firstElementChild === b, host: String(host.className).slice(0, 24), z: cs.zIndex, pe: cs.pointerEvents, aria: b.getAttribute('aria-hidden'), op: +cs.opacity, px, dots: b.querySelectorAll('i').length, openPoints: Number(b.dataset.open || 0), anims: anims.length, running: anims.filter((a) => a.playState === 'running').length, paused: anims.filter((a) => a.playState === 'paused').length, props: [...props], iso: getComputedStyle(host).isolation, canvases: b.querySelectorAll('canvas').length, draws: Number(b.dataset.draws || 0) }; };
  // the strongest pixel of a picture (a data: URL) composited on the room's ground colour, as WCAG contrast against that colour
  I.maxContrast = async (url, bg) => { const img = new Image(); img.src = url; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); const L0 = lum(bg[0], bg[1], bg[2]);
    let max = 1, at = null; for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; if (!a) continue;
      const L1 = lum(d[i] * a + bg[0] * (1 - a), d[i + 1] * a + bg[1] * (1 - a), d[i + 2] * a + bg[2] * (1 - a)); const cr = (Math.max(L0, L1) + 0.05) / (Math.min(L0, L1) + 0.05);
      if (cr > max) { max = cr; at = [(i / 4) % c.width, Math.floor(i / 4 / c.width)]; } }
    return { max, at, w: c.width, h: c.height }; };
  I.picture = () => { const b = I.box(); if (!b) return null; const bi = getComputedStyle(b).backgroundImage; const s = bi.indexOf('data:image'); if (s < 0) return null; const e = bi.lastIndexOf(')'); let u = bi.slice(s, e); if (u.charCodeAt(u.length - 1) === 34) u = u.slice(0, -1); return u; };
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
  const groundOk = (r) => !!r && r.first && r.z === '-1' && r.pe === 'none' && r.aria === 'true' && r.px > 30000 && r.canvases === 0 && r.draws >= 1 && r.iso === 'isolate' && /desk-frame-host/.test(r.host);
  ok('GROUND a Page room: the ground box is first in the framed host, behind its content (z -1, the host isolated), inert, and its background image is the circuitry (a picture, no canvas element in the page)', groundOk(g), JSON.stringify(g));
  await snap('l1-page-dark');
  // ---- TAME: no trace louder than the rest; the strongest ground pixel is fainter than the faintest real link -------------------------------------------------
  const layerSrc = fs.readFileSync(new URL('../../src/flux3/flux3-layer.ts', import.meta.url), 'utf8');
  const darkTone = layerSrc.slice(layerSrc.indexOf('dark: {'), layerSrc.indexOf('light: {'));
  const gm = /ground: '#([0-9a-fA-F]{6})'/.exec(darkTone), lm = /link: 'rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)'/.exec(darkTone);
  const hex = gm ? [0, 2, 4].map((i) => parseInt(gm[1].slice(i, i + 2), 16)) : null;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const cr2 = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const linkC = hex && lm ? cr2([+lm[1], +lm[2], +lm[3]].map((v, i) => v * +lm[4] + hex[i] * (1 - +lm[4])), hex) : null;
  const url0 = await ev('window.__l1.picture()');
  const tame = url0 && hex ? await ev(`window.__l1.maxContrast(${JSON.stringify(url0)}, ${JSON.stringify(hex)})`) : null;
  // the old drawing (a coarse trace at full strength and 2.5 px, its end pad over it) as a picture, for the reader's red proof
  const oldUrl = await ev(`(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 120; const x = c.getContext('2d'); x.strokeStyle = 'rgba(42,106,118,0.550)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(20, 60); x.lineTo(380, 60); x.lineTo(380, 100); x.stroke(); x.fillStyle = 'rgba(87,208,245,0.350)'; x.beginPath(); x.rect(378, 98, 4, 4); x.fill(); return c.toDataURL('image/png'); })()`);
  const oldC = oldUrl && hex ? await ev(`window.__l1.maxContrast(${JSON.stringify(oldUrl)}, ${JSON.stringify(hex)})`) : null;
  ok(`TAME the strongest pixel of the ground (${tame && tame.max.toFixed(2)}:1) is fainter than the faintest real link (${linkC && linkC.toFixed(2)}:1), and the reader goes RED on the old full-strength drawing (${oldC && oldC.max.toFixed(2)}:1)`, !!tame && linkC !== null && tame.max < linkC && !!oldC && oldC.max >= linkC, JSON.stringify({ tame, linkC, oldC, hex }));
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
  ok('CURRENT-OPEN every point drifts on a trace that runs through the open room, not under the page, rail or strip (the current shows)', !!cur && cur.dots >= 1 && cur.openPoints === cur.dots, JSON.stringify({ dots: cur && cur.dots, openPoints: cur && cur.openPoints }));
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
  ok('STILL reduced motion: the ground stands (circuitry drawn) with no point moving', !!still && still.px > 30000 && still.dots === 0 && still.anims === 0, JSON.stringify(still));

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
    ['a hit target', "document.querySelector('[data-flux3-room-ground]').style.setProperty('pointer-events', 'auto', 'important')", "document.querySelector('[data-flux3-room-ground]').style.setProperty('pointer-events', 'none')", async () => !groundOk(await read())],
    ['ground hidden', "document.querySelector('[data-flux3-room-ground]').remove()", null, async () => !groundOk(await read())],
  ];
  ok('MUT-BASE the readers are green on the untouched page before their mutants run', groundOk(base) && curOk(base), JSON.stringify(base));
  for (const [name, apply, undo, red] of muts) {
    await ev(apply); await sleep(250);
    const wentRed = await red();
    if (undo) { await ev(undo); await sleep(250); }
    ok(`MUT-${name.toUpperCase().replace(/ /g, '-')} the reader goes RED on its mutant (${name})${undo ? ' and green again undone' : ''}`, wentRed && (undo ? (groundOk(await read()) && curOk(await read())) : true), name);
  }
  // ---- L: the ground adds no typing latency (six interleaved rounds, TWO readings, the Corridor's method) ----------------------------------------------
  // J: a Page room in BUILD with the ground; C: the SAME page with the ground box taken away right after load (the only difference). The control against itself is GREEN and
  // +5 / +10 ms added to every key of arm J (on the control page) are RED on the cost reading (clock: key -> two frames on; cost: key -> the end of its last event + the frame that paints it).
  if (ON_BOX || process.env.FLUX3_L === '1') {
    const ROUNDS = 6, KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100;
    const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
    const CYCLE = 'the ground sits behind the room and holds still ';
    const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
    const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
    const runL = async (label, extra, groundInJ) => {
      const lat = { C: [], J: [] };
      let cursor = 0;
      for (let round = 0; round <= ROUNDS; round += 1) {
        for (const arm of (round % 2 ? ['J', 'C'] : ['C', 'J'])) {
          const id = `f3l1-lat-${Date.now()}-${seq += 1}`;
          await mk({ id, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
          await sleep(300);
          await open({ id });
          const hadGround = !!(await ev("!!document.querySelector('[data-flux3-room-ground]')"));
          if (!(arm === 'J' && groundInJ)) await ev("(() => { const b = document.querySelector('[data-flux3-room-ground]'); if (b) b.remove(); })()");
          await ev(`(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); window.__lat = []; window.__ks = []; let t0 = 0, cur = null; if (window.__latOff) window.__latOff();
            const kd = () => { t0 = performance.now(); const k = { busy: null, frame: null, s0: t0 }; cur = k; window.__ks.push(k); };
            const inp = () => { const k = cur; if (!k || k.busy !== null || k.posted) return; k.posted = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - k.s0; mc.port1.close(); }; mc.port2.postMessage(0); };
            const spin = () => { ${arm === 'J' && extra ? `const e = performance.now() + ${extra}; while (performance.now() < e) { /* the mutant: a slow key */ }` : ''} };
            const bi = () => { const t = t0, k = cur; requestAnimationFrame(() => { const r = performance.now(); const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - r; mc.port1.close(); };
              mc.port2.postMessage(0); requestAnimationFrame(() => { window.__lat.push(performance.now() - t); }); }); };
            document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', spin, true); document.addEventListener('beforeinput', bi, true); document.addEventListener('beforeinput', inp, false); document.addEventListener('input', inp, false);
            window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', spin, true); document.removeEventListener('beforeinput', bi, true); document.removeEventListener('beforeinput', inp, false); document.removeEventListener('input', inp, false); }; return true; })()`);
          for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[cursor % CYCLE.length]); cursor += 1; await sleep(GAP); }
          await sleep(250);
          const got = await ev('window.__lat.slice()');
          const cost = (await ev('window.__ks.map((k) => (k.busy != null && k.frame != null ? k.busy + k.frame : null))')).filter((x) => x != null);
          const hasGround = await ev("!!document.querySelector('[data-flux3-room-ground]')");
          if (round > 0) lat[arm].push({ lat: got, cost, stood: { hadGround, hasGround } });
        }
      }
      const judge = (f, ceiling) => {
        const cMeds = lat.C.map((r) => stat(r[f]).median), cP95s = lat.C.map((r) => stat(r[f]).p95);
        const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
        const C = stat(lat.C.flatMap((r) => r[f])), J = stat(lat.J.flatMap((r) => r[f]));
        const pass = J.median <= C.median + spreadMed && J.p95 <= C.p95 + spreadP95 && (ceiling == null || J.max <= ceiling);
        return { pass, line: `J median ${r1(J.median)} <= C ${r1(C.median)} + ${r1(spreadMed)}, J p95 ${r1(J.p95)} <= C ${r1(C.p95)} + ${r1(spreadP95)}${ceiling == null ? '' : `, J max ${r1(J.max)} <= ${ceiling}`}`, C, J };
      };
      const enough = [...lat.C, ...lat.J].every((r) => r.lat.length >= MIN_KEYS && r.cost.length >= MIN_KEYS);
      // the arms stood as named: J had the ground when asked, C never did
      const stoodRight = lat.J.every((r) => r.stood.hadGround && r.stood.hasGround === !!groundInJ) && lat.C.every((r) => r.stood.hadGround && !r.stood.hasGround);
      const clock = judge('lat', MAX_MS), costR = judge('cost', null);
      return { pass: enough && stoodRight && clock.pass && costR.pass, line: `${label}: clock [${clock.line}] cost [${costR.line}]`, enough, stoodRight, cost: costR, clock };
    };
    const green = await runL('control against itself (the ground away in both arms)', 0, false);
    ok(`L-METHOD-GREEN the method passes the control against itself: ${green.line}`, green.pass && green.enough && green.stoodRight);
    const l = await runL('the ground in J', 0, true);
    ok(`L the room's ground adds no typing latency beyond the control's own spread: ${l.line}`, l.pass && l.enough && l.stoodRight);
    for (const extra of [5, 10]) {
      const m = await runL(`control + ${extra} ms mutant`, extra, false);
      ok(`L-MUT-${extra} the method calls a key that is ${extra} ms slower RED on the cost reading (the mutant landed: ${m.line})`, !m.cost.pass && m.enough && m.stoodRight);
    }
  } else console.log("INFO L (Actions: timing is the box's to judge; FLUX3_L=1 runs it here)");
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-S4B-L1 VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-S4B-L1 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
