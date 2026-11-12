// FLUX ZOOM, STEP 1 (the Wrizors' spec claude/wrizors/flux-zoom-step1.md; Nick's go, Nov 11): the Schema's smooth zoom, behind ?flux3=1. A BROWSER harness (Actions or a box turn); the pure parts and the
// source wiring have their own browserless file, flux-zoom1-logic.mjs. THE SPEC'S EIGHT GUARDS and its hands, each a check here; mutants of the served bundle (an anchor found exactly once in index-*.js and
// replaced in flight) must LAND and turn their check RED.
// ONE BOARD through the app's seam (wrizoCreateJournalPage; never raw storage): flux3-s1's nine cards and three links on a tall canvas, opened under ?flux3=1, Flux, dark and light.
//   P     premises: the Schema is mounted (the layer, the readout), true size reads 1.00×10⁰, the canvas carries no transform and no data-f3-zoomed (true size is exactly today's board), the seam exists
//   ZR    the readout is TRUE and still: after a Ctrl+wheel climb the figure equals the measured scale (the canvas's drawn width over its layout width, to 1%), and it holds still for 800 ms after she stops
//   ZA    the pointer is the anchor: the board point under the pointer does not move (2 board px) through a Ctrl+wheel climb and a descent; a key notch holds the centre
//   ZL    the limits: Ctrl+wheel in stops at EXACTLY 4.00 (readout 4.00×10⁰), out stops at the outer limit (the board's longer side = 60% of the stage's shorter side, >= 0.10, <= 1.00), the run of scales
//         is monotonic (no bounce) and a further wheel changes nothing
//   ZK    keys: Ctrl + `=` is x1.25 about the centre (and Meta works too), Ctrl + `-` undoes it, Ctrl + `0` is exactly 1.00 with the canvas's transform gone; nothing needs a wheel
//   ZB    the browser's own page zoom never fires: the Ctrl+wheel and the Ctrl+ keys arrive defaultPrevented (read after our handler)
//   ZF    guard 1: the board frame, its host, the rail and the footer never move or resize through every scale (0.5 px), and the page's scroll size is unchanged
//   ZRM   guard 3: reduced motion = the new scale on the very next frame with no easing; Ambiance 0 likewise; with motion on, a notch is mid-glide at ~40 ms (the contrast: the easing exists)
//   ZD    guard 4: ZERO layer draw calls from the first Ctrl+wheel to the last of a 12-notch sweep, and the ground resumes about half a second after she stops (350 ms .. 1.5 s)
//   ZT    guard 5 (the mechanism): ZERO layer draw calls while she types 20 keys into a card at 0.50, 1.00 and 2.00 (the probe the box speed check reads: flux3-latency, run beside this file on the box)
//   ZH    guard 6: no hairline is drawn thinner than 1 px at any scale: the node brackets (computed width x scale), the board links (non-scaling stroke >= 1 px), every stroke the layer draws (lineWidth >= 1),
//         and the link colour is #57's at every scale
//   ZFL   guard 2: <= 3 flashes a second: a full zoom out and in sampled ~8 times a second, the board's mean light/dark direction reverses at most 3 times in any second
//   ZN    guard 7: nothing new is saved: ZERO writes to storage or IndexedDB across a zoom session (counted at the API), and leaving the board and coming back reads 1.00
//   ZS    the Stack: zoom is OFF there (the scale goes back to 1.00, the readout names the Stack, a Ctrl+wheel and a key change nothing and are still prevented)
//   ZG    the board's own gestures at scale: a card dragged 80 screen px at 2.00 (and 40 px at 0.50) moves 80 (40) on the screen: the pointer maths carries the scale
//   ZHOME the way home (Nick, Nov 11): the ZOOM readout is a button; at 2.00 a click on it glides to exactly 1.00 (a run of frames between), the canvas's transform gone, the frame, host and footer unmoved, no card made or lost; its hint reads
//         "Reset zoom (Ctrl + 0)"; the strip around it still takes no pointer (the button takes its own); under reduced motion the same click is a JUMP (the first changed frame is 1.00, nothing between)
//   ZFL   (below) also runs the flash count by KEYS and under reduced motion: ZFL-K (key notches out and back), ZFL-RM (the wheel sweep) and ZFL-RM-K (the key sweep) - each <= 3 flashes in any second
//   ZW    guard 8: the only word is ZOOM (the footer's second span is the existing flux3ReadZoom key's word)
//   MUT-* six landed mutants of the bundle (the sixth: the readout's click does nothing -> ZHOME): page zoom not prevented (ZB), no clamp (ZL), the drag not scaled (ZG), the camera drawn by layout zoom (ZF), the layer told scale 1 (ZA)
// FLUX_ZOOM_SHOTS=<dir> writes the frames (the Wrizors' list, §6, has its own frames file: scripts/frames/flux-zoom1.mjs). Run: node scripts/harness/flux-zoom1.mjs   (from apps/desktop; ZT/ZRM timing-free)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = process.env.FLUX_ZOOM_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const BOARD = 'fz1-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `  [${String(detail).slice(0, 700)}]`}`); };

// ---- the outside instrument (installed before any page script): layer draw calls with their lineWidth, key/wheel stamps, defaultPrevented of wheels and keys (read in the bubble phase, after our handlers)
const INSTRUMENT = `(() => {
  if (window.__z) return;
  const I = window.__z = { log: [], keys: [], wheels: [], prevented: [] };
  const LAYER = '[data-flux3-layer] canvas';
  const which = (cv) => (cv.parentElement ? Array.prototype.indexOf.call(cv.parentElement.children, cv) : -1);
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) {
      const cv = this.canvas;
      if (cv && cv.matches && cv.matches(LAYER) && I.log.length < 600000) I.log.push([performance.now(), which(cv), m, m === 'stroke' ? this.lineWidth : 0]);
      return o.apply(this, a);
    };
  }
  addEventListener('keydown', (e) => I.keys.push(performance.now()), true);
  addEventListener('keydown', (e) => { if (e.ctrlKey || e.metaKey) I.prevented.push(['key', e.key, e.defaultPrevented]); }, false);
  addEventListener('wheel', () => I.wheels.push(performance.now()), { capture: true, passive: true });
  addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) I.prevented.push(['wheel', e.deltaY, e.defaultPrevented]); }, { capture: false, passive: true });
  // every write to storage or IndexedDB, with its key (guard 7: nothing is saved by zooming)
  I.writes = [];
  for (const m of ['setItem', 'removeItem', 'clear']) { const o = Storage.prototype[m]; Storage.prototype[m] = function (...a) { I.writes.push([performance.now(), 'storage.' + m, String(a[0])]); return o.apply(this, a); }; }
  if (window.IDBObjectStore) for (const m of ['put', 'add', 'delete', 'clear']) { const o = IDBObjectStore.prototype[m]; IDBObjectStore.prototype[m] = function (...a) { I.writes.push([performance.now(), 'idb.' + m, String(this.name)]); return o.apply(this, a); }; }
  // the board's scale on every frame for ms milliseconds (the glide is a run of frames; a jump is one)
  I.series = [];
  I.track = (ms) => { I.series = []; const cv = document.querySelector('.board-canvas'), t0 = performance.now(); const tick = () => { const r = cv.getBoundingClientRect(); I.series.push(+(r.width / cv.offsetWidth).toFixed(4)); if (performance.now() - t0 < ms) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
  const rr = (r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
  I.calls = (t0, t1, f) => I.log.filter((e) => e[0] >= t0 && e[0] <= t1 && (!f || f(e))).length;
  I.minStroke = (t0) => { const w = I.log.filter((e) => e[0] >= t0 && e[2] === 'stroke').map((e) => e[3]); return w.length ? Math.min(...w) : null; };
  I.state = () => {
    const wrap = document.querySelector('.board-canvas-wrap'), cv = document.querySelector('.board-canvas'), host = wrap && wrap.parentElement;
    const cr = cv && cv.getBoundingClientRect();
    const tele = document.querySelector('.flux3-tele'), spans = tele ? [...tele.children] : [];
    const b = tele && tele.querySelector('b[data-f3-zoom-readout]');
    return {
      s: cr && cv.offsetWidth ? cr.width / cv.offsetWidth : null, tf: cv ? cv.style.transform : null, zoomedAttr: cv ? cv.getAttribute('data-f3-zoomed') : null,
      readout: b ? b.textContent : null, readoutRaw: b ? +b.getAttribute('data-f3-zoom-readout') : null, label: spans[1] ? spans[1].firstChild.textContent.trim() : null, level: spans[0] ? spans[0].textContent : null,
      frame: wrap ? rr(wrap.getBoundingClientRect()) : null, host: host ? rr(host.getBoundingClientRect()) : null,
      rail: document.querySelector('.desk-rail') ? rr(document.querySelector('.desk-rail').getBoundingClientRect()) : null, tele: tele ? rr(tele.getBoundingClientRect()) : null,
      doc: { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight },
      W: cv ? cv.offsetWidth : 0, H: cv ? cv.offsetHeight : 0, cw: wrap ? wrap.clientWidth : 0, ch: wrap ? wrap.clientHeight : 0, scroll: wrap ? [wrap.scrollLeft, wrap.scrollTop] : null,
      canvas: cr ? rr(cr) : null, layers: document.querySelectorAll('[data-flux3-layer]').length, seam: typeof window.wrizoFluxZoomTo, page: document.documentElement.getAttribute('data-page'),
      stackOn: !!document.querySelector('[data-flux3-stack-tab][aria-pressed="true"]'),
    };
  };
  I.card = (id) => { const e = document.querySelector('.board-box[data-box-id="' + id + '"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  I.reveal = (ids) => {
    const wrap = document.querySelector('.board-canvas-wrap'); if (!wrap) return false;
    const rs = ids.map((id) => I.card(id)).filter(Boolean); if (!rs.length) return false;
    const mx = rs.reduce((a, r) => a + (r.l + r.r) / 2, 0) / rs.length, my = rs.reduce((a, r) => a + (r.t + r.b) / 2, 0) / rs.length;
    const wr = wrap.getBoundingClientRect();
    wrap.scrollLeft += mx - (wr.left + wrap.clientWidth / 2); wrap.scrollTop += my - (wr.top + wrap.clientHeight / 2);
    return true;
  };
  I.bracket = () => { const n = document.querySelector('.board-canvas .flux3-node'); if (!n) return null; const cs = getComputedStyle(n, '::before'); return parseFloat(cs.borderTopWidth) || parseFloat(cs.borderLeftWidth) || 0; };
  I.links = () => [...document.querySelectorAll('.board-connection-line')].map((l) => { const cs = getComputedStyle(l); return { sw: parseFloat(cs.strokeWidth), ve: cs.vectorEffect, stroke: cs.stroke }; });
  I.ink = (x0, y0, x1, y1) => {
    const cv = document.querySelectorAll('[data-flux3-layer] canvas')[1];
    if (!cv || !cv.width) return -1;
    const r = cv.getBoundingClientRect(), sx = cv.width / r.width, sy = cv.height / r.height;
    const px = Math.max(0, Math.floor((x0 - r.left) * sx)), py = Math.max(0, Math.floor((y0 - r.top) * sy));
    const pw = Math.min(cv.width - px, Math.ceil((x1 - x0) * sx)), ph = Math.min(cv.height - py, Math.ceil((y1 - y0) * sy));
    if (pw <= 0 || ph <= 0) return 0;
    const d = cv.getContext('2d').getImageData(px, py, pw, ph).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n += 1;
    return n;
  };
  // the board frame's mean light, from a screenshot's data (decoded here, shrunk to 24 x 14)
  I.mean = async (b64, rect) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
    const c = document.createElement('canvas'); c.width = 24; c.height = 14;
    const g = c.getContext('2d');
    g.drawImage(bmp, rect.x, rect.y, rect.w, rect.h, 0, 0, 24, 14);
    const d = g.getImageData(0, 0, 24, 14).data; let s = 0;
    for (let i = 0; i < d.length; i += 4) s += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    return s / (d.length / 4);
  };
})();`;

// ---- the landed mutants: an anchor (a RegExp with its replacement) found exactly once in the served index-*.js, replaced in flight
const MUTANTS = {
  noPrevent: [/\(\w+\.ctrlKey\|\|\w+\.metaKey\)&&\((\w+)\.preventDefault\(\),/g, (m, e) => m.replace(`${e}.preventDefault(),`, '0,')],
  noClamp: [/const (\w+)=(\w+)\(\),(\w+)=(\w+)\((\w+),(\w+)\(\)\);if\(\3===\1\)return;const (\w+)=(\w+)\.getBoundingClientRect\(\)/g, (m, q, pn, L, Lg, M) => `const ${q}=${pn}(),${L}=${M};if(${L}===${q})return;const ${m.split('const ').pop()}`],
  dragNotScaled: [/(\.clientX-\w+\)\/)\((\w+)\*\w+\(\)\)(,\w+=\(\w+\.clientY-\w+\)\/)\(\2\*\w+\(\)\)/g, '$1$2$3$2'],
  // the camera drawn by CSS zoom instead of a transform: zoom changes LAYOUT, so the board's frame (auto height) would move and resize
  zoomByLayout: [/(\w+)\.style\.transform=`translate\(\$\{\w+\}px, \$\{\w+\}px\) scale\(\$\{(\w+)\}\)`/g, '$1.style.zoom=String($2)'],
  layerScale1: [/s:\w+\(\)\}\)\};/g, 's:1})};'],
  // the readout's click calls nothing (the way home's button is there, the door does not open)
  homeNoop: [/(className:"flux3-tele-zoom",tabIndex:-1,title:\w+\("flux3ZoomReset"\),"data-f3-zoom-home":"true",onPointerDown:\w+=>\w+\.stopPropagation\(\),onClick:\w+=>\{\w+\.stopPropagation\(\),)\w+\(\)\}/g, '$1void 0}'],
};
const countOf = (re, text) => { re.lastIndex = 0; let n = 0; while (re.exec(text)) n += 1; re.lastIndex = 0; return n; };

let failedRun = false;
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const S = () => ev('window.__z.state()');
  const wheel = (x, y, dy, mod = 2) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(x), y: Math.round(y), deltaX: 0, deltaY: dy, modifiers: mod });
  const KEYS = { '=': 187, '-': 189, '0': 48 };
  const key = async (k, mod = 2) => {
    const p = { key: k, code: k === '=' ? 'Equal' : k === '-' ? 'Minus' : 'Digit0', windowsVirtualKeyCode: KEYS[k], nativeVirtualKeyCode: KEYS[k], modifiers: mod };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
  };
  const centreOf = (s) => ({ x: s.frame.x + s.cw / 2 + 1, y: s.frame.y + s.ch / 2 + 1 });
  const near = (a, b, e) => Math.abs(a - b) <= e;
  // the figure a measured scale must read as (the mantissa x 10^exp), to 1%
  const readVal = (txt) => { const m = /^(\d\.\d\d)×10(−?)(\d+)$/.exec((txt || '').trim()); return m ? Number(m[1]) * Math.pow(10, (m[2] ? -1 : 1) * Number(m[3])) : NaN; };
  const trueRead = (s) => s && near(readVal(s.readout) / s.s, 1, 0.012) && near(s.readoutRaw / s.s, 1, 0.002);

  let mutant = null;
  const landed = {};
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/index-*.js', requestStage: 'Response' }] });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      if (mutant) {
        const [re, to] = MUTANTS[mutant];
        const n = countOf(re, text);
        landed[mutant] = n;
        if (n === 1) text = text.replace(re, to);
      }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* the request is gone */ } }
  });
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });

  // ---- the board, through the seams
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const at = new Date().toISOString();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fz1-doc', text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  const T = (id, x, y, z, text, extra = {}) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [
    T('f3-a', 0.05, 0.05, 1, 'Card A'), T('f3-b', 0.5, 0.05, 2, 'Card B'), T('f3-c', 0.05, 0.4, 3, 'Card C'), T('f3-d', 0.5, 0.4, 4, 'Card D'),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('f3-h', 0.75, 0.05, 8, 'The hook', { deckStep: { deck: 'three-act', step: 'hook' }, lit: true }),
    { id: 'f3-p', kind: 'page-pin', entryId: 'fz1-doc', x: 0.75, y: 0.75, w: 0.2, h: 0.15, z: 9 },
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1800 },
  ];
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Zoom step 1', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await sleep(500);

  const open = async (tone, o = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(o.dial ?? 1))}); })()`);
    await ev(`history.replaceState(null, '', '/?flux3=1#/page/${BOARD}')`);
    await app.emulateDpr(1, 1920, 1080);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"f3-a\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await app.waitFor("!!document.querySelector('[data-flux3-layer]') && !!document.querySelector('.flux3-tele')", { timeout: 8000, label: 'the Schema' }).catch(() => {});
    await sleep(1400);
  };
  const settle = (ms = 1000) => sleep(ms);

  // ---- the probes: each returns { pass, detail }; the mutants run the same probe and must fail it
  const probes = {
    // the way home: at 2.00 (or 4.00 under reduced motion) a click on the ZOOM readout returns the board to exactly 1.00
    async home(reduced = false) {
      await open('dark');
      const s0 = await S();
      if (reduced) await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      const from = reduced ? 4 : 2;
      await ev(`window.wrizoFluxZoomTo(${from})`); await settle(900);
      const z = await S();
      const b = await ev(`(() => { const e = document.querySelector('.flux3-tele-zoom'); if (!e) return null; const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, hit = document.elementFromPoint(cx, cy); const tele = document.querySelector('.flux3-tele'), tr = tele.getBoundingClientRect(); const away = document.elementFromPoint(tr.left + 6, tr.top + 11);   /* the strip takes no pointer, so elementFromPoint SKIPS it: a point in the strip away from the button lands on the board beneath */ return { x: cx, y: cy, title: e.getAttribute('title'), pe: getComputedStyle(e).pointerEvents, strip: getComputedStyle(tele).pointerEvents, hit: !!(hit && e.contains(hit)), awayInStrip: !!(away && tele.contains(away)), boxes: document.querySelectorAll('.board-box').length, text: e.textContent }; })()`);
      if (!b) { if (reduced) await app.emulateMedia([]); return { pass: false, detail: 'no .flux3-tele-zoom button' }; }
      await app.mouseMove(b.x, b.y); await sleep(60);
      await ev('window.__z.track(900)'); await sleep(60);
      await mouse('mousePressed', b.x, b.y); await mouse('mouseReleased', b.x, b.y);
      await sleep(1000);
      const ser = await ev('window.__z.series');
      const a = await S();
      const nb = await ev("document.querySelectorAll('.board-box').length");
      if (reduced) await app.emulateMedia([]);
      const same = (p, q) => ['x', 'y', 'w', 'h'].every((k) => near(p[k], q[k], 0.5));
      const moved = ser.filter((v) => v > 1.0001 && v < from - 0.0001);
      const pass = near(z.s, from, 0.01) && near(a.s, 1, 0.002) && a.tf === '' && a.readout === '1.00×100' && b.title === 'Reset zoom (Ctrl + 0)' && b.pe === 'auto' && b.strip === 'none' && b.hit && !b.awayInStrip
        && same(a.frame, s0.frame) && same(a.host, s0.host) && same(a.tele, s0.tele) && nb === b.boxes && (reduced ? moved.length === 0 : moved.length >= 2);
      return { pass, homed: near(a.s, 1, 0.002), detail: JSON.stringify({ from: z.s, after: a.s, tf: a.tf, readout: a.readout, title: b.title, pe: b.pe, strip: b.strip, hit: b.hit, away: b.awayInStrip, boxes: [b.boxes, nb], between: moved.length, frames: ser.length }) };
    },
    async prevented() {
      await open('dark');
      const s = await S(); const c = centreOf(s);
      await app.mouseMove(c.x, c.y);
      await ev('window.__z.prevented.length = 0');
      await wheel(c.x, c.y, -120); await sleep(80);
      await key('='); await sleep(80); await key('-'); await sleep(80); await key('0'); await sleep(300);
      const pv = await ev('window.__z.prevented');
      const wheelP = pv.filter((p) => p[0] === 'wheel'), keyP = pv.filter((p) => p[0] === 'key');
      return { pass: wheelP.length >= 1 && wheelP.every((p) => p[2]) && keyP.length >= 3 && keyP.every((p) => p[2]), detail: JSON.stringify(pv) };
    },
    async limitIn() {
      await open('dark');
      const s0 = await S(); const c = centreOf(s0);
      await app.mouseMove(c.x, c.y);
      const run = [];
      for (let i = 0; i < 45; i += 1) { await wheel(c.x, c.y, -120); await sleep(25); const s = await S(); run.push(+s.s.toFixed(4)); }
      const last = run[run.length - 1];
      return { pass: near(last, 4, 0.002) && run.every((v) => v <= 4.002), detail: `max ${Math.max(...run)} last ${last}`, run };
    },
    async frame() {
      await open('dark');
      const s0 = await S(); const c = centreOf(s0);
      await app.mouseMove(c.x, c.y);
      const same = (a, b) => ['x', 'y', 'w', 'h'].every((k) => near(a[k], b[k], 0.5));
      const bad = [];
      for (const target of [-120, -120, -120, 120, 120, 120, 120, 120, 120, 120, 120, 120]) {
        for (let i = 0; i < 4; i += 1) { await wheel(c.x, c.y, target); await sleep(25); }
        await sleep(120);
        const s = await S();
        for (const k of ['frame', 'host', 'rail', 'tele']) if (s[k] && s0[k] && !same(s[k], s0[k])) bad.push(`${k}@${s.s.toFixed(2)}`);
        if (s.doc.sw !== s0.doc.sw || s.doc.sh !== s0.doc.sh) bad.push(`doc@${s.s.toFixed(2)}`);
      }
      return { pass: bad.length === 0, detail: bad.slice(0, 6).join(', ') };
    },
    async drag(scale, px) {
      await open('dark');
      await ev(`window.wrizoFluxZoomTo(${scale})`); await settle(900);
      await ev("window.__z.reveal(['f3-d'])"); await settle(900);
      const s = await S(); const g0 = await ev("window.__z.card('f3-d')");
      if (!g0 || !s.s) return { pass: false, detail: 'no card' };
      const x = Math.round(g0.l + g0.w * 0.5), y = Math.round(g0.t + g0.h * 0.5);
      await app.mouseMove(x, y);
      await mouse('mousePressed', x, y);
      for (let i = 1; i <= 8; i += 1) { await mouse('mouseMoved', x + Math.round((px * i) / 8), y, { buttons: 1 }); await sleep(30); }
      await mouse('mouseReleased', x + px, y);
      await sleep(900);
      const g1 = await ev("window.__z.card('f3-d')");
      const moved = g1 ? g1.l - g0.l : null;
      return { pass: moved != null && near(moved, px, 3), detail: `moved ${moved} screen px for a ${px} px drag at ${scale}` };
    },
    async align() {
      await open('dark');
      const bad = [];
      for (const sc of [1, 2, 0.5]) {
        await ev(`window.wrizoFluxZoomTo(${sc})`); await settle(1700);
        await ev("window.__z.reveal(['f3-b', 'f3-d'])"); await settle(1700);
        const a = await ev("window.__z.card('f3-b')"), cc = await ev("window.__z.card('f3-d')");
        if (!a || !cc) { bad.push(`no cards@${sc}`); continue; }
        const x0 = Math.max(a.l, 0), x1 = Math.min(a.r, 99999), y0 = a.b, y1 = cc.t;
        const n = y1 - y0 > 4 ? await ev(`window.__z.ink(${x0}, ${y0}, ${x1}, ${y1})`) : -2;
        if (!(n > 0)) bad.push(`ink ${n}@${sc}`);
      }
      return { pass: bad.length === 0, detail: bad.join(', ') };
    },
  };

  // ============================== P + the unmutated run (dark, then light for the hairlines) ==============================
  await open('dark');
  const p0 = await S();
  ok('P the Schema is mounted (one layer, the readout), true size reads 1.00×10⁰, the canvas carries no transform and no data-f3-zoomed, the zoom seam exists',
    p0.layers === 1 && p0.readout === '1.00×100' && p0.tf === '' && p0.zoomedAttr === null && near(p0.s, 1, 0.002) && p0.seam === 'function', JSON.stringify({ layers: p0.layers, readout: p0.readout, tf: p0.tf, zoomedAttr: p0.zoomedAttr, s: p0.s, seam: p0.seam }));
  ok('ZW guard 8: the footer\'s zoom word is ZOOM (the existing key), shown in capitals by the footer\'s own styling', /^zoom$/i.test(p0.label || ''), p0.label);
  { const r = await probes.home(false); ok(`ZHOME a click on the ZOOM readout at 2.00 glides to exactly 1.00 (a run of frames between), the transform gone, the frame, host and footer unmoved, no card made or lost, the hint "Reset zoom (Ctrl + 0)", the strip around the button still takes no pointer`, r.pass, r.detail); }
  { const r = await probes.home(true); ok(`ZHOME-RM under reduced motion the same click at 4.00 is a JUMP to 1.00 (nothing between)`, r.pass, r.detail); }
  await open('dark');
  const storeSnap = () => ev("JSON.stringify({ ls: Object.fromEntries(Object.entries(localStorage).sort()), board: window.wrizoBoard ? window.wrizoBoard() : null })");
  const stored0 = await storeSnap();
  const c0 = centreOf(p0);
  const point = { x: Math.round(p0.frame.x + p0.cw * 0.62), y: Math.round(p0.frame.y + p0.ch * 0.42) };
  await app.mouseMove(point.x, point.y);
  const boardPt = (s) => ({ x: (point.x - s.canvas.x) / s.s, y: (point.y - s.canvas.y) / s.s });
  const bp0 = boardPt(p0);

  // ZR / ZA: a climb of 6 Ctrl+wheel notches, then a descent
  const trail = [];
  for (let i = 0; i < 6; i += 1) { await wheel(point.x, point.y, -120); await sleep(40); }
  await settle(900);
  const z1 = await S(); trail.push(z1);
  const r1 = (await S()).readout; await sleep(800); const r2 = (await S()).readout;
  ok(`ZR the readout is TRUE after a climb (${z1.readout} for a measured ${z1.s.toFixed(3)}) and holds still for 800 ms after she stops (${r1} then ${r2})`, z1.s > 1.5 && trueRead(z1) && r1 === r2, JSON.stringify({ readout: z1.readout, raw: z1.readoutRaw, s: z1.s }));
  const bp1 = boardPt(z1);
  ok(`ZA the board point under the pointer holds through the climb (moved ${Math.hypot(bp1.x - bp0.x, bp1.y - bp0.y).toFixed(2)} board px)`, Math.hypot(bp1.x - bp0.x, bp1.y - bp0.y) <= 2.5, JSON.stringify({ bp0, bp1 }));
  for (let i = 0; i < 6; i += 1) { await wheel(point.x, point.y, 120); await sleep(40); }
  await settle(900);
  const z2 = await S(); const bp2 = boardPt(z2);
  ok(`ZA and through the descent (back to ${z2.s.toFixed(3)}; moved ${Math.hypot(bp2.x - bp0.x, bp2.y - bp0.y).toFixed(2)} board px); the readout is still true`, Math.hypot(bp2.x - bp0.x, bp2.y - bp0.y) <= 2.5 && trueRead(z2), JSON.stringify({ z2: z2.s, readout: z2.readout }));
  await key('0'); await settle(700);

  // ZL: the limits
  {
    const run = await probes.limitIn();
    const sIn = await S();
    const mono = run.run.every((v, i) => i === 0 || v >= run.run[i - 1] - 1e-9);
    for (let i = 0; i < 5; i += 1) { await wheel(centreOf(sIn).x, centreOf(sIn).y, -120); await sleep(30); }
    const sIn2 = await S();
    ok(`ZL Ctrl+wheel in stops at EXACTLY 4.00 (${run.run[run.run.length - 1]}), reads 4.00×10⁰ (${sIn.readout}), climbs monotonically (no bounce) and a further wheel changes nothing`, run.pass && mono && sIn.readout === '4.00×100' && near(sIn2.s, sIn.s, 1e-9), run.detail);
    await snap('zoom-400');
    const cOut = centreOf(sIn2);
    const out = [];
    for (let i = 0; i < 60; i += 1) { await wheel(cOut.x, cOut.y, 120); await sleep(25); const s = await S(); out.push(+s.s.toFixed(5)); }
    await settle(800);
    const sOut = await S();
    const expected = Math.min(1, Math.max(0.1, (0.6 * Math.min(sOut.cw, sOut.ch)) / Math.max(sOut.W, sOut.H)));
    const monoOut = out.every((v, i) => i === 0 || v <= out[i - 1] + 1e-9);
    ok(`ZL Ctrl+wheel out stops at the outer limit (${sOut.s.toFixed(4)}, expected ${expected.toFixed(4)} = 60% of the stage's shorter side over the board's longer), no bounce, the readout true (${sOut.readout})`,
      near(sOut.s, expected, 0.004) && sOut.s >= 0.1 - 1e-6 && sOut.s <= 1 && monoOut && trueRead(sOut), JSON.stringify({ s: sOut.s, expected, min: Math.min(...out), readout: sOut.readout }));
    await snap('zoom-outer');
    await key('0'); await settle(700);
  }

  // ZK: keys
  {
    const s0 = await S(); const c = centreOf(s0);
    const bpc = (s) => ({ x: (c.x - s.canvas.x) / s.s, y: (c.y - s.canvas.y) / s.s });
    await key('='); await settle(600); const k1 = await S();
    await key('=', 4); await settle(600); const k2 = await S();     // Meta
    await key('-'); await settle(600); const k3 = await S();
    await key('0'); await settle(600); const k4 = await S();
    ok(`ZK Ctrl+= is ×1.25 (${k1.s.toFixed(4)}), Meta+= again ×1.25 (${k2.s.toFixed(4)}), Ctrl+- undoes one (${k3.s.toFixed(4)}), Ctrl+0 is exactly 1.00 with the canvas's transform gone`,
      near(k1.s, 1.25, 0.004) && near(k2.s, 1.5625, 0.005) && near(k3.s, 1.25, 0.004) && near(k4.s, 1, 1e-9) && k4.tf === '' && k4.zoomedAttr === null && k4.readout === '1.00×100', JSON.stringify([k1.s, k2.s, k3.s, k4.s, k4.tf]));
    ok(`ZK a key notch zooms about the CENTRE (the centre board point moved ${Math.hypot(bpc(k1).x - bpc(s0).x, bpc(k1).y - bpc(s0).y).toFixed(2)} board px)`, Math.hypot(bpc(k1).x - bpc(s0).x, bpc(k1).y - bpc(s0).y) <= 2.5);
  }
  // ZB: the browser's own page zoom never fires
  { const r = await probes.prevented(); ok('ZB the Ctrl+wheel and Ctrl + = - 0 arrive defaultPrevented (the browser\'s page zoom never fires over the Schema)', r.pass, r.detail); await open('dark'); }

  // ZF: the page never moves
  { const r = await probes.frame(); ok('ZF guard 1: the board frame, its host, the rail and the footer never move or resize through every scale, and the page\'s scroll size is unchanged', r.pass, r.detail); }

  // ZRM: reduced motion / Ambiance 0 jump; motion on glides
  {
    await open('dark');
    // after the key returns, sample the scale as fast as the harness can: the first sample, and whether any sample sat strictly between true size and the target
    // a per-frame series starts BEFORE the key; the key is pressed; the series says whether the scale ever sat between true size and the target, and what the first changed frame read
    const k = async () => {
      await ev('window.__z.track(1100)'); await sleep(80);
      await key('='); await sleep(1250);
      const ser = await ev('window.__z.series');
      const changed = ser.find((v) => Math.abs(v - 1) > 1e-6);
      return { s: changed == null ? 1 : changed, mid: ser.some((v) => v > 1.0001 && v < 1.2499), last: ser[ser.length - 1], frames: ser.length };
    };
    await key('0'); await settle(400);
    const glideRead = await k(); await key('0'); await settle(500);
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const redRead = await k(); await settle(500);
    await app.emulateMedia([]);
    await key('0'); await settle(400);
    await open('dark', { dial: 0 });
    const ambRead = await k();
    ok(`ZRM with motion on a notch glides (a sample sat between 1.00 and 1.25: ${glideRead.mid}); under reduced motion it is exactly 1.25 on the first frame with nothing between (${redRead.s.toFixed(3)}, mid ${redRead.mid}); with Ambiance 0 likewise (${ambRead.s.toFixed(3)}, mid ${ambRead.mid})`,
      glideRead.mid && near(glideRead.last, 1.25, 0.002) && near(redRead.s, 1.25, 1e-3) && !redRead.mid && near(ambRead.s, 1.25, 1e-3) && !ambRead.mid, JSON.stringify({ glideRead, redRead, ambRead }));
    await key('0'); await settle(300);
  }

  // ZD: the ground and the electrons damp while she zooms, and resume about half a second after
  {
    await open('dark');
    const s = await S(); const c = centreOf(s);
    await app.mouseMove(c.x, c.y); await settle(1400);
    const before = await ev('window.__z.calls(performance.now() - 1200, performance.now())');
    const w0 = await ev('window.__z.wheels.length');
    for (let i = 0; i < 12; i += 1) { await wheel(c.x, c.y, i < 6 ? -120 : 120); await sleep(60); }
    const span = await ev(`(() => { const k = window.__z.wheels.slice(${w0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
    const during = await ev(`window.__z.calls(${span.a}, ${span.b})`);
    await settle(2000);
    const firstAfter = await ev(`(() => { const e = window.__z.log.find((x) => x[0] > ${span.b}); return e ? e[0] - ${span.b} : null; })()`);
    ok(`ZD ZERO layer draw calls across a 12-notch Ctrl+wheel sweep (${during}), the layer was animating before (${before} calls), and the ground resumes ${firstAfter == null ? 'never' : Math.round(firstAfter) + ' ms'} after she stops (350 ms .. 1.5 s)`,
      span.n >= 12 && before > 0 && during === 0 && firstAfter != null && firstAfter >= 350 && firstAfter <= 1500, JSON.stringify({ before, during, firstAfter, n: span.n }));
  }

  // ZT: typing at three scales
  {
    const out = [];
    for (const sc of [0.5, 1, 2]) {
      await open('dark');
      await ev(`window.wrizoFluxZoomTo(${sc})`); await settle(900);
      await ev("window.__z.reveal(['f3-d'])"); await settle(900);
      const b = await ev("window.__z.card('f3-d')");
      await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
      await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
      await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
      await settle(1500);
      const k0 = await ev('window.__z.keys.length');
      for (const ch of ' the schema holds still') { await app.typeKeys(ch); await sleep(80); }
      const span = await ev(`(() => { const k = window.__z.keys.slice(${k0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
      const during = await ev(`window.__z.calls(${span.a}, ${span.b})`);
      const reached = await ev("(document.querySelector('.board-popup-editor')?.textContent || '').includes('the schema holds still')");
      out.push({ sc, keys: span.n, during, reached });
      await mouse('mousePressed', 20, 300); await mouse('mouseReleased', 20, 300); await sleep(500);
    }
    ok(`ZT guard 5 (the mechanism): ZERO layer draw calls while she types 22 keys into a card at 0.50, 1.00 and 2.00; the words reached the card (the speed check reads flux3-latency on the box)`,
      out.every((o) => o.keys >= 20 && o.during === 0 && o.reached), JSON.stringify(out));
  }

  // ZH: hairlines, both tones
  for (const tone of ['dark', 'light']) {
    await open(tone);
    const bad = [];
    let linkCount = 0;
    for (const sc of [0.0001, 0.5, 1, 2, 4]) {
      const t0 = await ev('performance.now()');
      await ev(`window.wrizoFluxZoomTo(${sc})`); await settle(1800);
      const s = await S();
      const br = await ev('window.__z.bracket()'), links = await ev('window.__z.links()'), minStroke = await ev(`window.__z.minStroke(${t0})`);
      const want = tone === 'dark' ? 'rgb(58, 143, 165)' : 'rgb(53, 133, 158)';
      if (!(br * s.s >= 0.99)) bad.push(`bracket ${br}x${s.s.toFixed(2)}`);
      linkCount = links.length;
      if (!links.every((l) => l.sw >= 1 && /non-scaling/.test(l.ve))) bad.push(`link width@${sc} ${JSON.stringify(links[0])}`);
      if (!links.every((l) => l.stroke === want || l.stroke === 'rgb(0, 194, 255)' || l.stroke === 'rgb(0, 113, 156)')) bad.push(`link colour ${links[0] && links[0].stroke}@${sc}`);
      if (minStroke != null && minStroke < 1 - 1e-9) bad.push(`layer stroke ${minStroke}@${sc}`);
      if (sc === 0.5 || sc === 2) await snap(`zoom-${tone}-${sc === 0.5 ? '050' : '200'}`);
    }
    ok(`ZH (${tone}) no hairline is drawn thinner than 1 px at 0.10..4.00: the node brackets (width × scale), the board's own SVG links where drawn (${linkCount}: non-scaling, >= 1 px, #57's colours) and every stroke the layer draws (lineWidth >= 1)`, bad.length === 0, bad.join(', '));
  }

  // ZA (the layer follows the scale: the route between A and C is drawn in the gap at three scales)
  { const r = await probes.align(); ok('ZA the drawing layer is told the scale: the B-D link route is inked in the gap between the cards at 1.00, 2.00 and 0.50', r.pass, r.detail); }

  // ZG: the board's gestures at scale
  {
    const a = await probes.drag(2, 80), b = await probes.drag(0.5, 40);
    ok(`ZG a card dragged 80 screen px at 2.00 (and 40 at 0.50) moves that far on the screen: ${a.detail}; ${b.detail}`, a.pass && b.pass, a.detail + ' | ' + b.detail);
  }

  // ZFL: <= 3 flashes a second
  {
    await open('dark');
    const s = await S(); const c = centreOf(s);
    await app.mouseMove(c.x, c.y);
    const frameRect = s.frame;
    const samples = [];
    const sample = async () => { const shot = await app.cdp('Page.captureScreenshot', { format: 'png' }); samples.push([Date.now(), await ev(`window.__z.mean(${JSON.stringify(shot.data)}, ${JSON.stringify({ x: Math.round(frameRect.x), y: Math.round(frameRect.y), w: Math.round(frameRect.w), h: Math.round(frameRect.h) })})`)]); };
    for (let i = 0; i < 28; i += 1) { await wheel(c.x, c.y, i < 14 ? -120 : 120); if (i % 2 === 0) await sample(); await sleep(40); }
    for (let i = 0; i < 6; i += 1) { await sample(); await sleep(60); }
    const range = Math.max(...samples.map((x) => x[1])) - Math.min(...samples.map((x) => x[1]));
    // a flash = a reversal of direction larger than 15% of the board's own light range (a full dark/light swing), counted in every 1 s window
    let dir = 0, flips = []; for (let i = 1; i < samples.length; i += 1) { const d = samples[i][1] - samples[i - 1][1]; if (Math.abs(d) > 0.15 * Math.max(range, 0.05)) { const nd = Math.sign(d); if (dir !== 0 && nd !== dir) flips.push(samples[i][0]); dir = nd; } }
    const worst = flips.length ? Math.max(...flips.map((t) => flips.filter((u) => u >= t && u < t + 1000).length)) : 0;
    ok(`ZFL guard 2: a full zoom in and out (${samples.length} frames sampled) reverses the board's light/dark direction at most 3 times in any second (worst ${worst}; range ${range.toFixed(3)})`, samples.length >= 15 && worst <= 3, JSON.stringify({ samples: samples.length, worst, range }));
  }

  // the flash count again, by KEYS (a notch is a glide with motion on) and under reduced motion (every notch a jump): ZFL-K, ZFL-RM, ZFL-RM-K
  for (const [name, reduced, byKeys] of [['ZFL-K', false, true], ['ZFL-RM', true, false], ['ZFL-RM-K', true, true]]) {
    await open('dark');
    if (reduced) await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const s = await S(); const c = centreOf(s);
    await app.mouseMove(c.x, c.y);
    const rect = { x: Math.round(s.frame.x), y: Math.round(s.frame.y), w: Math.round(s.frame.w), h: Math.round(s.frame.h) };
    const samples = [];
    const sample = async () => { const shot = await app.cdp('Page.captureScreenshot', { format: 'png' }); samples.push([Date.now(), await ev(`window.__z.mean(${JSON.stringify(shot.data)}, ${JSON.stringify(rect)})`)]); };
    if (byKeys) { for (let i = 0; i < 14; i += 1) { await key(i < 7 ? '-' : '=', 2); if (i % 1 === 0) await sample(); await sleep(60); } }
    else { for (let i = 0; i < 28; i += 1) { await wheel(c.x, c.y, i < 14 ? -120 : 120); if (i % 2 === 0) await sample(); await sleep(40); } }
    for (let i = 0; i < 6; i += 1) { await sample(); await sleep(60); }
    const range = Math.max(...samples.map((x) => x[1])) - Math.min(...samples.map((x) => x[1]));
    let dir = 0; const flips = []; for (let i = 1; i < samples.length; i += 1) { const d = samples[i][1] - samples[i - 1][1]; if (Math.abs(d) > 0.15 * Math.max(range, 0.05)) { const nd = Math.sign(d); if (dir !== 0 && nd !== dir) flips.push(samples[i][0]); dir = nd; } }
    const worst = flips.length ? Math.max(...flips.map((t) => flips.filter((u) => u >= t && u < t + 1000).length)) : 0;
    const end = await S();
    if (reduced) await app.emulateMedia([]);
    ok(`${name} the flash count of a full zoom out and back (${byKeys ? 'key notches' : 'the wheel'}, ${reduced ? 'reduced motion' : 'motion on'}; ${samples.length} frames sampled, ended at ${end.s.toFixed(3)}) reverses the board's light/dark direction at most 3 times in any second (worst ${worst}; range ${range.toFixed(3)})`, samples.length >= 18 && worst <= 3 && end.s > 0.05, JSON.stringify({ samples: samples.length, worst, range, end: end.s }));
  }

  // ZS: the Stack
  {
    await open('dark');
    await ev('window.wrizoFluxZoomTo(2)'); await settle(1200);
    const zin = await S();
    await ev("document.querySelector('[data-flux3-stack-tab]').click()"); await settle(1500);
    const st = await S();
    const c = centreOf(st);
    await ev('window.__z.prevented.length = 0');
    await app.mouseMove(c.x, c.y);
    await wheel(c.x, c.y, -120); await sleep(100); await key('='); await settle(600);
    const st2 = await S(); const pv = await ev('window.__z.prevented');
    await snap('zoom-stack');
    ok(`ZS the Stack: zoom was ${zin.s.toFixed(2)}; with the Stack open the scale is back to 1.00 (${st.readout}), the level names the Stack (${(st.level || '').trim()}), a Ctrl+wheel (the Stack's own hand swallows it and flips a card) and Ctrl+= change nothing (${st2.s.toFixed(3)}), and the key is still prevented`,
      near(zin.s, 2, 0.01) && st.stackOn && near(st.s, 1, 0.002) && st.tf === '' && near(st2.s, 1, 0.002) && pv.some((p) => p[0] === 'key') && pv.filter((p) => p[0] === 'key').every((p) => p[2]), JSON.stringify({ zin: zin.s, st: st.s, st2: st2.s, level: st.level, pv }));
    await ev("document.querySelector('[data-flux3-stack-tab]').click()"); await settle(900);
  }

  // ZN: nothing new is saved: ZERO writes to storage or IndexedDB across a zoom session; leaving the board and coming back reads 1.00
  {
    await open('dark');
    await sleep(1500);
    const w0 = await ev('window.__z.writes.length');
    const s = await S(); const c = centreOf(s);
    await app.mouseMove(c.x, c.y);
    for (let i = 0; i < 6; i += 1) { await wheel(c.x, c.y, -120); await sleep(40); }
    await key('='); await sleep(300); await key('-'); await sleep(300);
    await ev('window.wrizoFluxZoomTo(3)'); await settle(1500);
    await key('0'); await settle(1500);
    const writes = await ev(`window.__z.writes.slice(${w0})`);
    await ev('window.wrizoFluxZoomTo(3)'); await settle(600);
    await ev("location.hash = '#/'"); await settle(1500);
    await ev(`location.hash = '#/page/${BOARD}'`);
    await app.waitFor("!!document.querySelector('.flux3-tele')", { timeout: 10000, label: 'the Schema again' }).catch(() => {});
    await settle(1500);
    const back = await S();
    ok(`ZN guard 7: nothing new is saved (${writes.length} writes to storage or IndexedDB across a session of wheel, key and seam zooms${writes.length ? ': ' + JSON.stringify(writes.slice(0, 4).map((x) => x.slice(1))) : ''}), and leaving the board and coming back reads 1.00 (${back.readout}, no transform)`,
      writes.length === 0 && near(back.s, 1, 0.002) && back.tf === '' && back.readout === '1.00×100', JSON.stringify({ writes: writes.slice(0, 6), back: back.s, readout: back.readout }));
  }

  // ============================== the mutants: each must LAND and turn its check RED ==============================
  const mutantRun = async (name, probe, label) => {
    mutant = name; landed[name] = 0;
    let res;
    try { res = await probe(); } catch (e) { res = { pass: false, detail: 'threw ' + String(e.message || e).slice(0, 120) }; }
    mutant = null;
    ok(`MUT-${name} (${label}): the mutant LANDED (${landed[name]} anchor) and its check goes RED`, landed[name] === 1 && res.pass === false, `landed ${landed[name]}; ${res.detail}`);
  };
  await mutantRun('noPrevent', probes.prevented, 'the browser\'s page zoom not prevented -> ZB');
  await mutantRun('noClamp', probes.limitIn, 'no clamp -> ZL');
  await mutantRun('dragNotScaled', () => probes.drag(2, 80), 'the drag not scaled -> ZG');
  await mutantRun('zoomByLayout', probes.frame, 'the camera drawn by layout zoom, not a transform -> ZF');
  await mutantRun('layerScale1', probes.align, 'the layer told scale 1 -> ZA');
  await mutantRun('homeNoop', async () => { const r = await probes.home(false); return { pass: r.homed, detail: r.detail }; }, 'the readout\'s click does nothing, the board stays zoomed -> ZHOME');
  await open('dark');
}); } catch (e) { failedRun = true; console.error('HARNESS ERROR', e && e.stack ? e.stack : e); }

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nFLUX-ZOOM1 VERIFY: ${failedRun ? 'FAIL - the harness itself threw' : failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS (${checks.length} checks)`}`);
process.exit(failedRun || failed ? 1 : 0);
