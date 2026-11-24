// BOARD ZOOM FOR ARBOR AND MACHINA (ARBOR, Nov 24; Fable's orders-nov24.md, ARBOR item 1; Nick: "in to 4x and out", recorded for after Flux live). The full Board (BoardEditor) in Arbor (theme plateau)
// and Machina gets Flux's zoom (flux-zoom-1, src/flux3/useFluxCamera.ts): THE SAME CAMERA, the same limits (4.00 in; out to the board's longer side at 60% of the stage's shorter side, never below 0.10,
// never above 1.00), the same keys (Ctrl/Cmd + wheel about the pointer, Ctrl + = / - one x1.25 notch about the centre, Ctrl + 0 true size), the two-finger pinch about its midpoint, and NOTHING SAVED
// (the session keeps a board's scale when she leaves and comes back; a reload reads 1.00). Its controls are a small bar over the board frame's lower-left corner, in each theme's own dress, through the
// lexicon's existing words (Zoom Out, Zoom In, Reset zoom (Ctrl + 0)): it takes no room, so the frame never moves. A BROWSER harness (Actions or a box turn).
//   P0    the fixture: the board opened in each theme with its cards
//   <T> = A (Arbor) and M (Machina), each at 1920, Page: Dark:
//   <T>P   true size: the canvas carries no transform, the zoom bar is there with its three controls (out, the readout, in), the readout reads true size, the camera's seam exists
//   <T>K   keys: Ctrl + = is x1.25, Meta + = again, Ctrl + - undoes one, Ctrl + 0 is exactly 1.00 with the transform gone; a notch holds the centre's board point
//   <T>B   the browser's own page zoom never fires: the Ctrl + wheel and the Ctrl + keys arrive defaultPrevented
//   <T>A   the pointer is the anchor: the board point under the pointer holds through a Ctrl + wheel climb and the descent (2.5 board px)
//   <T>L   the limits: Ctrl + wheel in stops at EXACTLY 4.00 (monotonic, a further wheel changes nothing), out stops at the outer limit (60% / 0.10 / 1.00)
//   <T>PI-B the pinch: two fingers spread to twice their distance zoom x2 (5%), about their midpoint: the drift within the scroll's whole-pixel rounding (1 screen px per axis per event, over the
//          scale), a bound under a tenth of an unanchored pinch's drift. (PI, parked Nov 24: a 3 board px guess; it read 3.01 in both legs of run 45423945840. Its successor's mutant: MUT-pinchCorner.)
//   <T>C   the controls: + is one notch, - undoes it, the readout at 2.00 returns to exactly 1.00; each is pressable at its centre (elementFromPoint), the words are the lexicon's; the readout is true at every step
//   <T>F   the page never moves: the board frame, its host, the rail and the zoom bar keep their rects through a sweep of scales (0.5 px), and the page's scroll size is unchanged
//   <T>G   the board's own gestures at scale: a card dragged 80 screen px at 2.00 moves 80 on the screen
//   <T>T   typing at 2.00: every typed character reaches the card (the mechanism; the speed is the box's)
//   <T>N   nothing is saved: ZERO writes to storage or IndexedDB across a zoom session; the board keeps its scale for the session (left at 3.00, back at 3.00); a reload reads 1.00
//   X1    the control: Flux (no flag) has no zoom bar, and Flux under ?flux3=1 keeps its own readout with no second bar (one camera)
//   MUT-*  landed mutants of the served bundle (an anchor found exactly once in index-*.js, replaced in flight) must LAND and turn their check RED
// FRAMES: $RUNNER_TEMP/suite/board-zoom (else the OS temp): each theme x tone x 1366 / 1920 at 1.00, 2.00 and the outer limit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.WS_PLACE = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_REORG = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const OUT = path.join(process.env.RUNNER_TEMP ? path.join(process.env.RUNNER_TEMP, 'suite') : os.tmpdir(), 'board-zoom');
fs.mkdirSync(OUT, { recursive: true });
const BOARD = 'abz-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `  [${String(detail).slice(0, 700)}]`}`); };
const EXPECTED = 1 + 2 * 12 + 1 + 3;

// ---- the outside instrument (installed before any page script)
const INSTRUMENT = `(() => {
  if (window.__z) return;
  const I = window.__z = { keys: [], prevented: [], writes: [] };
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  addEventListener('keydown', (e) => { if (e.ctrlKey || e.metaKey) I.prevented.push(['key', e.key, e.defaultPrevented]); }, false);
  addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) I.prevented.push(['wheel', e.deltaY, e.defaultPrevented]); }, { capture: false, passive: true });
  for (const m of ['setItem', 'removeItem', 'clear']) { const o = Storage.prototype[m]; Storage.prototype[m] = function (...a) { I.writes.push([performance.now(), 'storage.' + m, String(a[0])]); return o.apply(this, a); }; }
  if (window.IDBObjectStore) for (const m of ['put', 'add', 'delete', 'clear']) { const o = IDBObjectStore.prototype[m]; IDBObjectStore.prototype[m] = function (...a) { I.writes.push([performance.now(), 'idb.' + m, String(this.name)]); return o.apply(this, a); }; }
  const rr = (r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
  const q = (s) => document.querySelector(s);
  // the readout's figure as a scale: Arbor's "156%", Machina's "1.56x" (either form), else NaN
  I.readVal = (t) => { t = (t || '').trim(); let m = /^(\\d+)%$/.exec(t); if (m) return Number(m[1]) / 100; m = /^[x×]?\\s*(\\d+\\.\\d+)\\s*[x×]?$/.exec(t); return m ? Number(m[1]) : NaN; };
  I.state = () => {
    const wrap = q('.board-canvas-wrap'), cv = q('.board-canvas'), host = wrap && wrap.parentElement;
    const cr = cv && cv.getBoundingClientRect();
    const bar = q('[data-board-zoom]');
    const btn = (k) => bar && bar.querySelector('[data-board-zoom-act="' + k + '"]');
    const rail = q('.desk-frame-strip') || q('.desk-rail');
    const home = btn('home');
    return {
      s: cr && cv.offsetWidth ? cr.width / cv.offsetWidth : null, tf: cv ? cv.style.transform : null,
      frame: wrap ? rr(wrap.getBoundingClientRect()) : null, host: host ? rr(host.getBoundingClientRect()) : null, rail: rail ? rr(rail.getBoundingClientRect()) : null,
      bar: bar ? rr(bar.getBoundingClientRect()) : null, bars: document.querySelectorAll('[data-board-zoom]').length,
      acts: bar ? [...bar.querySelectorAll('[data-board-zoom-act]')].map((b) => b.getAttribute('data-board-zoom-act')) : [],
      readout: home ? (home.textContent || '').trim() : null, readVal: home ? I.readVal(home.textContent) : NaN, raw: home ? Number(home.getAttribute('data-board-zoom-scale')) : NaN,
      words: bar ? { group: bar.getAttribute('aria-label'), out: btn('out') && btn('out').getAttribute('aria-label'), outTitle: btn('out') && btn('out').getAttribute('title'), into: btn('in') && btn('in').getAttribute('aria-label'), inTitle: btn('in') && btn('in').getAttribute('title'), home: home && home.getAttribute('title') } : null,
      doc: { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight },
      W: cv ? cv.offsetWidth : 0, H: cv ? cv.offsetHeight : 0, cw: wrap ? wrap.clientWidth : 0, ch: wrap ? wrap.clientHeight : 0,
      canvas: cr ? rr(cr) : null, seam: typeof window.wrizoFluxZoomTo, theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'),
      tele: document.querySelectorAll('.flux3-tele').length,
    };
  };
  I.hit = (k) => { const e = q('[data-board-zoom] [data-board-zoom-act="' + k + '"]'); if (!e) return null; const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, t = document.elementFromPoint(x, y); return { x, y, hit: !!t && (t === e || e.contains(t)) }; };
  I.card = (id) => { const e = q('.board-box[data-box-id="' + id + '"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  I.reveal = (ids) => {
    const wrap = q('.board-canvas-wrap'); if (!wrap) return false;
    const rs = ids.map((id) => I.card(id)).filter(Boolean); if (!rs.length) return false;
    const mx = rs.reduce((a, r) => a + (r.l + r.r) / 2, 0) / rs.length, my = rs.reduce((a, r) => a + (r.t + r.b) / 2, 0) / rs.length;
    const wr = wrap.getBoundingClientRect();
    wrap.scrollLeft += mx - (wr.left + wrap.clientWidth / 2); wrap.scrollTop += my - (wr.top + wrap.clientHeight / 2);
    return true;
  };
})();`;

// ---- the landed mutants (anchors written against the build; each must be found exactly once in the served index-*.js)
const MUTANTS = {
  // the camera's theme gate drops Machina: Machina's board gets no camera and no bar
  gateNoMachina: [/([\w$]+)==="plateau"\|\|\1==="machina"/g, '$1==="plateau"'],
  // the readout's click calls nothing (the bar's way home does not open)
  barHomeNoop: [/("data-board-zoom-act":"home",[^}]{0,400}?onClick:\(\)=>)[\w$]+\(\)/g, '$1void 0'],
  // (Nov 24, with PI-B) the pinch zooms about the window's corner, not its midpoint: the camera's two midpoint arguments replaced by 0, 0
  pinchCorner: [/\(([\w$]+)\[0\]\.clientX\+\1\[1\]\.clientX\)\/2,\(\1\[0\]\.clientY\+\1\[1\]\.clientY\)\/2/g, '0,0'],
};
const countOf = (re, text) => { re.lastIndex = 0; let n = 0; while (re.exec(text)) n += 1; re.lastIndex = 0; return n; };

let failedRun = false;
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
  const shot = async (name) => fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const S = () => ev('window.__z.state()');
  const wheel = (x, y, dy, mod = 2) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(x), y: Math.round(y), deltaX: 0, deltaY: dy, modifiers: mod });
  const KEYS = { '=': 187, '-': 189, '0': 48 };
  const key = async (k, mod = 2) => {
    const p = { key: k, code: k === '=' ? 'Equal' : k === '-' ? 'Minus' : 'Digit0', windowsVirtualKeyCode: KEYS[k], nativeVirtualKeyCode: KEYS[k], modifiers: mod };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
  };
  const near = (a, b, e) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= e;
  const centreOf = (s) => ({ x: s.frame.x + s.cw / 2 + 1, y: s.frame.y + s.ch / 2 + 1 });
  const zoomTo = (s) => ev(`typeof window.wrizoFluxZoomTo === 'function' ? window.wrizoFluxZoomTo(${s}) : null`);
  // the readout is true: its figure is the measured scale to its own precision (a whole percent, or two decimals: within half a step, 0.005), and its raw scale within 0.2%
  // (the first draft held the figure to 1% of the scale, Flux's rule for its three-figure mantissa; a whole percent cannot meet that below 50%, e.g. 23% for 0.233. Changed before the file's first green, Nov 24)
  const trueRead = (s) => !!s && near(s.readVal, s.s, 0.0051) && near(s.raw / s.s, 1, 0.002);
  const press = async (k) => { const h = await ev(`window.__z.hit(${JSON.stringify(k)})`); if (!h || !h.hit) return h; await app.mouseMove(h.x, h.y); await mouse('mousePressed', h.x, h.y); await mouse('mouseReleased', h.x, h.y); return h; };

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

  // ---- the board, through the seams (seeded on the Desk, which has no flush handler)
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 15000 });
  const at = '2026-04-01T00:00:00.000Z';
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [
    T('z-a', 0.05, 0.05, 1, 'Card A'), T('z-b', 0.5, 0.05, 2, 'Card B'), T('z-c', 0.05, 0.4, 3, 'Card C'), T('z-d', 0.5, 0.4, 4, 'Card D'),
    T('z-e', 0.05, 0.75, 5, 'Card E'), T('z-f', 0.5, 0.75, 6, 'Card F'), T('z-g', 0.75, 0.4, 7, 'Card G'),
    L('z-ac', 'z-a', 'z-c', 10), L('z-bd', 'z-b', 'z-d', 11), L('z-ef', 'z-e', 'z-f', 12),
    { id: 'z-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1800 },
  ];
  await ev(`(() => { window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Board zoom', pageType: 'board', boxes, createdAt: at, origin: null, source: null })}); window.wrizoFlushNow(); return null; })()`);
  await sleep(500);

  // open the board in a theme and tone (the tone is a pref, not a collection; the theme through its seam), at a width
  const open = async (theme, tone = 'dark', o = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(o.dial ?? 1))}); window.wrizoTheme.set(${JSON.stringify(theme)}); return null; })()`);
    await ev(`history.replaceState(null, '', '${o.flux3 ? '/?flux3=1' : '/'}#/page/${BOARD}'); null`);
    await app.emulateDpr(1, o.w || 1920, o.w === 1366 ? 768 : 1080);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"z-a\"]')", { timeout: 15000, label: `the board in ${theme}` }).catch(() => {});
    await splashGone();
    await sleep(1200);
  };
  const settle = (ms = 900) => sleep(ms);

  const probes = {
    async keys() {
      const s0 = await S(); if (!s0.frame) return { pass: false, detail: 'no board frame' };
      const c = centreOf(s0);
      const bpc = (s) => ({ x: (c.x - s.canvas.x) / s.s, y: (c.y - s.canvas.y) / s.s });
      await app.mouseMove(c.x, c.y);
      await key('='); await settle(600); const k1 = await S();
      await key('=', 4); await settle(600); const k2 = await S();
      await key('-'); await settle(600); const k3 = await S();
      await key('0'); await settle(600); const k4 = await S();
      const drift = Math.hypot(bpc(k1).x - bpc(s0).x, bpc(k1).y - bpc(s0).y);
      return { pass: near(k1.s, 1.25, 0.004) && near(k2.s, 1.5625, 0.005) && near(k3.s, 1.25, 0.004) && near(k4.s, 1, 1e-9) && k4.tf === '' && drift <= 2.5 && trueRead(k1) && trueRead(k2),
        detail: JSON.stringify({ s: [k1.s, k2.s, k3.s, k4.s], tf: k4.tf, drift: +drift.toFixed(2), readouts: [k1.readout, k2.readout] }) };
    },
    async prevented() {
      const s = await S(); if (!s.frame) return { pass: false, detail: 'no board frame' };
      const c = centreOf(s);
      await app.mouseMove(c.x, c.y);
      await ev('window.__z.prevented.length = 0');
      await wheel(c.x, c.y, -120); await sleep(80);
      await key('='); await sleep(80); await key('-'); await sleep(80); await key('0'); await sleep(300);
      const pv = await ev('window.__z.prevented');
      const w = pv.filter((p) => p[0] === 'wheel'), k = pv.filter((p) => p[0] === 'key');
      return { pass: w.length >= 1 && w.every((p) => p[2]) && k.length >= 3 && k.every((p) => p[2]), detail: JSON.stringify(pv) };
    },
    async anchor() {
      const s0 = await S(); if (!s0.frame) return { pass: false, detail: 'no board frame' };
      const pt = { x: Math.round(s0.frame.x + s0.cw * 0.62), y: Math.round(s0.frame.y + s0.ch * 0.42) };
      const bp = (s) => ({ x: (pt.x - s.canvas.x) / s.s, y: (pt.y - s.canvas.y) / s.s });
      await app.mouseMove(pt.x, pt.y);
      for (let i = 0; i < 6; i += 1) { await wheel(pt.x, pt.y, -120); await sleep(40); }
      await settle(); const z1 = await S();
      for (let i = 0; i < 6; i += 1) { await wheel(pt.x, pt.y, 120); await sleep(40); }
      await settle(); const z2 = await S();
      const d1 = Math.hypot(bp(z1).x - bp(s0).x, bp(z1).y - bp(s0).y), d2 = Math.hypot(bp(z2).x - bp(s0).x, bp(z2).y - bp(s0).y);
      await key('0'); await settle(500);
      return { pass: z1.s > 1.5 && d1 <= 2.5 && d2 <= 2.5 && trueRead(z1), detail: JSON.stringify({ up: z1.s, d1: +d1.toFixed(2), down: z2.s, d2: +d2.toFixed(2), readout: z1.readout }) };
    },
    async limits() {
      const s0 = await S(); if (!s0.frame) return { pass: false, detail: 'no board frame' };
      const c = centreOf(s0);
      await app.mouseMove(c.x, c.y);
      const up = [];
      for (let i = 0; i < 45; i += 1) { await wheel(c.x, c.y, -120); await sleep(25); up.push(+(await S()).s.toFixed(4)); }
      const sIn = await S();
      for (let i = 0; i < 5; i += 1) { await wheel(c.x, c.y, -120); await sleep(30); }
      const sIn2 = await S();
      const down = [];
      for (let i = 0; i < 60; i += 1) { await wheel(c.x, c.y, 120); await sleep(25); down.push(+(await S()).s.toFixed(5)); }
      await settle(800);
      const sOut = await S();
      const expected = Math.min(1, Math.max(0.1, (0.6 * Math.min(sOut.cw, sOut.ch)) / Math.max(sOut.W, sOut.H)));
      const monoUp = up.every((v, i) => i === 0 || v >= up[i - 1] - 1e-9), monoDown = down.every((v, i) => i === 0 || v <= down[i - 1] + 1e-9);
      await key('0'); await settle(500);
      return { pass: near(sIn.s, 4, 0.002) && up.every((v) => v <= 4.002) && monoUp && near(sIn2.s, sIn.s, 1e-9) && trueRead(sIn) && near(sOut.s, expected, 0.004) && monoDown && trueRead(sOut),
        detail: JSON.stringify({ in: sIn.s, inRead: sIn.readout, out: sOut.s, expected, outRead: sOut.readout, monoUp, monoDown }) };
    },
    async pinch() {
      const s0 = await S(); if (!s0.frame) return { pass: false, detail: 'no board frame' };
      const c = centreOf(s0);
      const bp = (s) => ({ x: (c.x - s.canvas.x) / s.s, y: (c.y - s.canvas.y) / s.s });
      await app.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      const pts = (d) => [{ x: c.x - d, y: c.y, id: 1 }, { x: c.x + d, y: c.y, id: 2 }];
      try {
        await app.cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(60) });
        for (let i = 1; i <= 10; i += 1) { await app.cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(60 + 6 * i) }); await sleep(30); }
        await app.cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally { await app.cdp('Emulation.setTouchEmulationEnabled', { enabled: false }); }
      await settle(); const s1 = await S();
      const drift = Math.hypot(bp(s1).x - bp(s0).x, bp(s1).y - bp(s0).y);
      await key('0'); await settle(500);
      // PI-B's reading: the camera re-anchors on EVERY pinch event and writes the frame's scroll, which the browser holds in whole pixels, so each of the 10 events may move the anchor by up to
      // 1 screen px on each axis: the worst case is 10 x sqrt(2) screen px, over the final scale in board px. A pinch NOT anchored at its midpoint (about the canvas corner) moves the midpoint's board
      // point by its distance from the corner times (1 - 1/s): the bound must sit far under that (a tenth), or the check could not tell an anchored pinch from an unanchored one.
      const bound = (10 * Math.SQRT2) / (s1.s || 1);
      const unanchored = Math.hypot(bp(s0).x, bp(s0).y) * (1 - 1 / (s1.s || 1));
      return { pass: near(s1.s, 2, 0.1) && drift <= 3 && trueRead(s1),   // PARKED predicate (PI), verbatim: see the PI line below
        passB: near(s1.s, 2, 0.1) && drift <= bound && bound <= unanchored / 10 && trueRead(s1),
        detail: JSON.stringify({ s: s1.s, drift: +drift.toFixed(2), bound: +bound.toFixed(2), unanchored: +unanchored.toFixed(1), readout: s1.readout }) };
    },
    async controls() {
      const s0 = await S(); if (!s0.bar) return { pass: false, homed: false, detail: 'no zoom bar' };
      const hits = {};
      hits.in = await press('in'); await settle(700); const a = await S();
      hits.out = await press('out'); await settle(700); const b = await S();
      await zoomTo(2); await settle(700); const c = await S();
      hits.home = await press('home'); await settle(900); const d = await S();
      const same = (p, q) => !!p && !!q && ['x', 'y', 'w', 'h'].every((k) => near(p[k], q[k], 0.5));
      const allHit = ['in', 'out', 'home'].every((k) => hits[k] && hits[k].hit);
      const homed = near(c.s, 2, 0.01) && near(d.s, 1, 0.002) && d.tf === '';
      return { pass: allHit && near(a.s, 1.25, 0.004) && near(b.s, 1, 0.004) && homed && trueRead(a) && trueRead(b) && trueRead(c) && trueRead(d) && same(d.frame, s0.frame) && same(d.bar, s0.bar),
        homed, detail: JSON.stringify({ hits: Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, v && v.hit])), s: [a.s, b.s, c.s, d.s], readouts: [a.readout, b.readout, c.readout, d.readout] }) };
    },
    async frame() {
      const s0 = await S(); if (!s0.frame) return { pass: false, detail: 'no board frame' };
      const c = centreOf(s0);
      await app.mouseMove(c.x, c.y);
      const same = (a, b) => ['x', 'y', 'w', 'h'].every((k) => near(a[k], b[k], 0.5));
      const bad = [];
      for (const dy of [-120, -120, -120, 120, 120, 120, 120, 120, 120, 120, 120, 120]) {
        for (let i = 0; i < 4; i += 1) { await wheel(c.x, c.y, dy); await sleep(25); }
        await sleep(120);
        const s = await S();
        for (const k of ['frame', 'host', 'rail', 'bar']) if (!s[k] || !s0[k] || !same(s[k], s0[k])) bad.push(`${k}@${(s.s || 0).toFixed(2)}`);
        if (s.doc.sw !== s0.doc.sw || s.doc.sh !== s0.doc.sh) bad.push(`doc@${(s.s || 0).toFixed(2)}`);
      }
      const end = await S();
      await key('0'); await settle(500);
      return { pass: bad.length === 0 && Math.abs(end.s - 1) > 0.05, detail: bad.slice(0, 6).join(', ') || `ended at ${end.s}` };
    },
    async drag() {
      await zoomTo(2); await settle();
      await ev("window.__z.reveal(['z-d'])"); await settle();
      const s = await S(); const g0 = await ev("window.__z.card('z-d')");
      if (!g0 || !near(s.s, 2, 0.01)) return { pass: false, detail: `no card or not at 2.00 (${s.s})` };
      const x = Math.round(g0.l + g0.w * 0.5), y = Math.round(g0.t + g0.h * 0.5);
      await app.mouseMove(x, y); await mouse('mousePressed', x, y);
      for (let i = 1; i <= 8; i += 1) { await mouse('mouseMoved', x + i * 10, y, { buttons: 1 }); await sleep(30); }
      await mouse('mouseReleased', x + 80, y); await settle();
      const g1 = await ev("window.__z.card('z-d')");
      const moved = g1 ? g1.l - g0.l : null;
      await key('0'); await settle(500);
      return { pass: moved != null && near(moved, 80, 3), detail: `moved ${moved} screen px for an 80 px drag at 2.00` };
    },
    async typing() {
      await zoomTo(2); await settle();
      await ev("window.__z.reveal(['z-c'])"); await settle();
      const s = await S(); const b = await ev("window.__z.card('z-c')");
      if (!b || !near(s.s, 2, 0.01)) return { pass: false, detail: `no card or not at 2.00 (${s.s})` };
      await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
      await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
      await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return null; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); return null; })()");
      await settle(800);
      const k0 = await ev('window.__z.keys.length');
      for (const ch of ' the board holds still') { await app.typeKeys(ch); await sleep(70); }
      const n = (await ev('window.__z.keys.length')) - k0;
      const reached = await ev("(document.querySelector('.board-popup-editor')?.textContent || '').includes('the board holds still')");
      const after = await S();
      await ev("document.activeElement && document.activeElement.blur && document.activeElement.blur(); null");
      await app.key('Escape');
      await settle(600);
      return { pass: n >= 20 && reached && near(after.s, 2, 0.01), detail: JSON.stringify({ keys: n, reached, s: after.s }) };
    },
    async saved(theme) {
      await sleep(1200);
      const w0 = await ev('window.__z.writes.length');
      const s = await S(); if (!s.frame) return { pass: false, detail: 'no board frame' };
      const c = centreOf(s);
      await app.mouseMove(c.x, c.y);
      for (let i = 0; i < 6; i += 1) { await wheel(c.x, c.y, -120); await sleep(40); }
      await key('='); await sleep(300); await key('-'); await sleep(300);
      await zoomTo(3); await settle(1200);
      const writes = await ev(`window.__z.writes.slice(${w0})`);
      const z = await S();
      await ev("location.hash = '#/'"); await settle(1500);
      await ev(`location.hash = '#/page/${BOARD}'`);
      await app.waitFor("!!document.querySelector('.board-canvas .board-box')", { timeout: 10000, label: 'the board again' }).catch(() => {});
      await settle(1500);
      const back = await S();
      await open(theme);
      const fresh = await S();
      return { pass: writes.length === 0 && near(z.s, 3, 0.01) && near(back.s, 3, 0.01) && back.tf !== '' && trueRead(back) && near(fresh.s, 1, 0.002) && fresh.tf === '' && trueRead(fresh),
        keeps: near(back.s, 3, 0.01), detail: JSON.stringify({ writes: writes.slice(0, 4).map((x) => x.slice(1)), at: z.s, back: back.s, backRead: back.readout, fresh: fresh.s, freshRead: fresh.readout }) };
    },
  };

  // ============================== the fixture ==============================
  const fixture = {};
  for (const th of ['plateau', 'machina']) { await open(th); const s = await S(); fixture[th] = { theme: s.theme, frame: !!s.frame, W: s.W }; }
  ok('P0 the fixture: the board opened in Arbor and in Machina with its canvas', fixture.plateau.theme === 'plateau' && fixture.machina.theme === 'machina' && fixture.plateau.frame && fixture.machina.frame && fixture.plateau.W > 0 && fixture.machina.W > 0, JSON.stringify(fixture));

  // ============================== each theme ==============================
  for (const [th, P] of [['plateau', 'A'], ['machina', 'M']]) {
    const name = th === 'plateau' ? 'Arbor' : 'Machina';
    await open(th);
    const p = await S();
    ok(`${P}P ${name}: true size has no transform; the zoom bar is there with out, the readout and in; the readout reads true size; the camera's seam exists`,
      p.tf === '' && near(p.s, 1, 0.002) && p.bars === 1 && p.acts.join(',') === 'out,home,in' && trueRead(p) && p.seam === 'function', JSON.stringify({ tf: p.tf, s: p.s, bars: p.bars, acts: p.acts, readout: p.readout, seam: p.seam }));
    { const r = await probes.keys(); ok(`${P}K ${name}: Ctrl + = is x1.25, Meta + = again, Ctrl + - undoes one, Ctrl + 0 is exactly 1.00 with the transform gone; a notch holds the centre`, r.pass, r.detail); }
    { const r = await probes.prevented(); ok(`${P}B ${name}: the Ctrl + wheel and Ctrl + = - 0 arrive defaultPrevented (the browser's page zoom never fires over the board)`, r.pass, r.detail); }
    await open(th);
    { const r = await probes.anchor(); ok(`${P}A ${name}: the board point under the pointer holds through a Ctrl + wheel climb and the descent; the readout is true`, r.pass, r.detail); }
    { const r = await probes.limits(); ok(`${P}L ${name}: Ctrl + wheel in stops at exactly 4.00 (no bounce, a further wheel changes nothing); out stops at the outer limit (60% of the stage's shorter side over the board's longer, 0.10 .. 1.00)`, r.pass, r.detail); }
    await open(th);
    {
      const r = await probes.pinch();
      // PARKED (Nov 24, ARBOR; SUPERSEDED by PI-B): run 45423945840 read Arbor's pinch drift 3.01 board px in BOTH legs (Machina's under 3): the 3 px allowance was a guess, and the camera's anchor moves by
      // the whole-pixel scroll once per pinch event (10 here), which that guess did not count. The original, verbatim, printed on the parked leg and not counted:
      //   { const r = await probes.pinch(); ok(`${P}PI ${name}: two fingers spread to twice their distance zoom x2 about their midpoint`, r.pass, r.detail); }
      // the parked record in the house form (pok, as bug116-script-templates prints it): the original's words under SUPERSEDED, asserting its successor's truth (the first form printed the original's own
      // predicate, which the parked leg's verdict then counted as a red: run 45435045102)
      if (process.env.HARNESS_PARKED === '1') console.log(`${r.passB ? 'PASS' : 'FAIL'} PARKED (was "${P}PI ${name}: two fingers spread to twice their distance zoom x2 about their midpoint", 3 board px) - SUPERSEDED: the allowance did not count the scroll's whole-pixel rounding per pinch event (read 3.01 in both legs of 45423945840); live successor: ${P}PI-B  ${r.detail}`);
      ok(`${P}PI-B ${name} [successor]: two fingers spread to twice their distance zoom x2 about their midpoint: the midpoint's board point drifts no more than the scroll's whole-pixel rounding allows (1 screen px per axis per pinch event, over the scale), a bound under a tenth of an unanchored pinch's drift`, r.passB, r.detail);
    }
    await open(th);
    { const r = await probes.controls(); ok(`${P}C ${name}: the bar's + is one notch, - undoes it, the readout at 2.00 returns to exactly 1.00; each control pressable at its centre; the readout true at every step; the frame and the bar unmoved`, r.pass, r.detail); }
    {
      const w = (await S()).words;
      ok(`${P}C-W ${name}: the bar's words are the lexicon's existing ones: the group "Zoom", out "Zoom Out", in "Zoom In", the readout "Reset zoom (Ctrl + 0)"`,
        !!w && w.group === 'Zoom' && w.out === 'Zoom Out' && w.outTitle === 'Zoom Out' && w.into === 'Zoom In' && w.inTitle === 'Zoom In' && w.home === 'Reset zoom (Ctrl + 0)', JSON.stringify(w));
    }
    await open(th);
    { const r = await probes.frame(); ok(`${P}F ${name}: the board frame, its host, the rail and the zoom bar keep their rects through a sweep of scales, and the page's scroll size is unchanged`, r.pass, r.detail); }
    await open(th);
    { const r = await probes.drag(); ok(`${P}G ${name}: a card dragged 80 screen px at 2.00 moves 80 on the screen`, r.pass, r.detail); }
    await open(th);
    { const r = await probes.typing(); ok(`${P}T ${name}: typing into a card at 2.00 reaches the card (the scale held)`, r.pass, r.detail); }
    await open(th);
    { const r = await probes.saved(th); ok(`${P}N ${name}: nothing is saved by zooming (zero storage or IndexedDB writes); the board keeps 3.00 for the session; a reload reads 1.00`, r.pass, r.detail); }
  }

  // ============================== the control ==============================
  {
    await open('flux'); const f = await S();
    await open('flux', 'dark', { flux3: true }); const f3 = await S();
    ok('X1 the control: Flux without the flag has no zoom bar; Flux under ?flux3=1 keeps its own readout and no second bar (one camera)', f.bars === 0 && f3.bars === 0 && f3.tele === 1 && f3.seam === 'function', JSON.stringify({ plain: { bars: f.bars }, flux3: { bars: f3.bars, tele: f3.tele, seam: f3.seam } }));
  }

  // ============================== frames ==============================
  for (const th of ['plateau', 'machina']) for (const tone of ['dark', 'light']) for (const w of [1366, 1920]) {
    await open(th, tone, { w });
    const tag = `${th === 'plateau' ? 'arbor' : 'machina'}-${tone}-${w}`;
    await shot(`${tag}-100`);
    await zoomTo(2); await settle(); await ev("window.__z.reveal(['z-b', 'z-d'])"); await settle(500); await shot(`${tag}-200`);
    await zoomTo(0.0001); await settle(); await shot(`${tag}-outer`);
    const s = await S();
    console.log(`FRAME ${tag}: s=${s.s && s.s.toFixed(3)} readout=${s.readout} bar=${JSON.stringify(s.bar)} frame=${JSON.stringify(s.frame)}`);
  }

  // ============================== the mutants ==============================
  const mutantRun = async (name, theme, probe, label) => {
    mutant = name; landed[name] = 0;
    let res;
    try { await open(theme); res = await probe(); } catch (e) { res = { pass: false, detail: 'threw ' + String(e.message || e).slice(0, 120) }; }
    mutant = null;
    ok(`MUT-${name} (${label}): the mutant LANDED (${landed[name]} anchor) and its check goes RED`, landed[name] === 1 && res.pass === false, `landed ${landed[name]}; ${res.detail}`);
  };
  await mutantRun('gateNoMachina', 'machina', probes.keys, "the camera's theme gate drops Machina -> MK");
  await mutantRun('barHomeNoop', 'plateau', async () => { const r = await probes.controls(); return { pass: r.homed, detail: r.detail }; }, "the readout's click does nothing -> AC");
  await mutantRun('pinchCorner', 'plateau', async () => { const r = await probes.pinch(); return { pass: r.passB, detail: r.detail }; }, 'the pinch zooms about the corner, not its midpoint -> API-B');
  await open('plateau');
}); } catch (e) { failedRun = true; console.error('HARNESS ERROR', e && e.stack ? e.stack : e); }

const failed = checks.filter((c) => !c.pass).length;
const short = checks.length !== EXPECTED;
console.log(`\nARBOR-BOARD-ZOOM VERIFY: ${failedRun ? 'FAIL - the harness itself threw' : failed ? `FAIL - ${failed}/${checks.length} failed` : short ? `FAIL - ${checks.length} checks ran, ${EXPECTED} expected` : `PASS (${checks.length} checks)`}`);
process.exit(failedRun || failed || short ? 1 : 0);
