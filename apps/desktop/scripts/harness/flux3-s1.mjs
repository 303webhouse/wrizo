// FLUX3 S1 - THE SCHEMA LIVE VIEW, ON THE BOARD (Fable's S1 go, Nov 5: "the Schema Live view behind ?flux3=1, mounting your cleared layer on the split
// board ... Proof per the S1 rules (zero draws while keys land, the frame budget, hidden pause, the page-rect check) + frames for the Wrizors").
// The build: src/flux3/ (flag.ts, boot.ts, FluxSchema.tsx, FluxNodeRecord.tsx, lastTouched.ts, flux-v3.css, the layer flux3-layer.ts) and two mount
// points in components/BoardEditor.tsx. The page-rect law has its own guard, flux3-page-rect.mjs (S0), run beside this file in every S1 proof.
//
// ONE BOARD, seeded through the app's seams (wrizoCreateJournalPage; never raw storage): six text cards A..F linked A-C, B-D, E-F; G with no link (the
// control); H a dealt preset step marked lit; P a doc pin (a real page). A tall canvas (board-meta canvasH) so the board scrolls.
// THE OUTSIDE INSTRUMENT (installed before any page script on every document): every 2D draw call is wrapped and, when it lands on a canvas inside
// [data-flux3-layer], logged with its time, its canvas (0 the ground, 1 the motion, 2 a drag's follow canvas), its method, a drawImage's width and a
// stroke's style. rAF is wrapped for the frame intervals. Keys, wheels and right-button releases are timestamped from the window's capture phase.
// Nothing reads the layer's own word for what it did.
//
//   P    premises (flag on): the root carries data-flux3, flux-v3.css is applied (the canvas is clear), ONE layer, aria-hidden, no pointer, hosted by
//        the board frame and under the cards (the card is what is under its centre), a node record on every card, the readouts true (nodes, links).
//   OFF  flag off: no layer, no record, no readouts, no data-flux3, and the flag's chunk (boot-*.css/js) was never fetched.
//   G    the geometry law, 1366 + 1920 x dark + light (4 cells): the board frame's rect and every card's rect are IDENTICAL with the flag on and off;
//        every card's text is the same (the record adds none); the stored board is unchanged by the flag-on visits (nothing new saved).
//   LINKS  each seeded link is drawn: ink on the motion canvas along its first segment, out of the from-card's facing side; none beside G (no link).
//   E    electrons only on the selected node's links: per motion frame, exactly 2 electron sprites per link of the selected card (A: 1 link -> 2;
//        G: 0 links -> 0; E: 1 link -> 2). An electron is a drawImage of the sprite at its size (>= 16 px); the ground's current is 14 px.
//   D2-KEYS  rule 1: ZERO layer draw calls from the first key to the last while she types 40 keys into a card (the card's own editor); premises:
//        the layer animated just before, the words reached the card; RESUME: the layer draws again after she settles.
//   D2-WHEEL / D2-SCROLL  ZERO layer draw calls while the board scrolls, by the wheel (12 notches) and with no wheel or pointer at all (the scroll
//        position stepped, as a scrollbar drag moves it); premises: the board really scrolled and the held frame moved with it (a CSS transform);
//        RESUME-SCROLL: after settling the layer redraws the ground at the new view.
//   HIDDEN  rule 3: while the window is hidden, ZERO layer draw calls; it draws again when shown.
//   STILL  reduced motion = the still frame: after it settles, ZERO layer draw calls, and the links are still drawn.
//   F    <= 3 flashes a second, measured: four links made in a burst (four right-drags inside one second) each light ONCE, and no 1 s window holds
//        more than three flash starts. A flash start is read from its stroke (alpha = 0.5 + 0.5 x what is left of it, over FLASH_MS = 1100 ms).
//   C    contrast, both tones, measured from the computed colours against the ground (the layer's own fill) or the strip: labels >= 4.5:1, the LAST
//        node's name >= 7:1 (the handoff's floors). The numbers are printed.
//   BUDGET  rule 2: at rest, full motion (a selected node's electrons, the dashes, the current), the median frame interval with the flag on is within
//        10% of the same board with the flag off, ON THE BOX (a hosted runner prints it as information). Rounds interleave the arms, one warm-up.
//   MUT-DAMP / MUT-SCROLL / MUT-HIDDEN / MUT-FLASH  red-first, each a LANDED mutant of the served bundle (its anchor found exactly once in index-*.js
//        and replaced in flight): the damping gate always open; the layer deaf to scroll; the hidden gate always false; the flash spacing removed.
//        Each must fail its check.
//   B    the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src.
//
// FLUX3_SHOTS=<dir> writes the frames (flag on: dark + light at 1366 and 1920, A selected; the flag-off control). FLUX3_ROUNDS=<n> (default 4).
// Run: node scripts/harness/flux3-s1.mjs   (from apps/desktop; a box turn: BUDGET is a timing check)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const ROUNDS = Math.max(3, Number(process.env.FLUX3_ROUNDS || 4));
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const VIEWS = [[1366, 768], [1920, 1080]];
const TONES = ['dark', 'light'];
const BOARD = 'f3s1-board';
const FLASH_MS = 1100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const info = (name, detail) => console.log(`INFO  ${name}  ${detail}`);

// ---- the build this run uses ------------------------------------------------------------------------------------------------------------------------
function buildIdentity() {
  const out = { bundle: null, builtAt: null, head: null, srcCommitAt: null, dirtySrc: null, stale: null };
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = html.match(/assets\/(index-[\w-]+\.js)/);
    out.bundle = m ? m[1] : null;
    out.builtAt = fs.statSync(path.join(DIST, 'index.html')).mtime.toISOString();
  } catch { /* no bundle: withHarness refuses on its own */ }
  try {
    const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    out.head = git('rev-parse', '--short=8', 'HEAD');
    out.srcCommitAt = new Date(Number(git('log', '-1', '--format=%ct', '--', 'apps/desktop/src')) * 1000).toISOString();
    out.dirtySrc = git('status', '--porcelain', '--', 'apps/desktop/src').split('\n').filter(Boolean).length;
    out.stale = out.builtAt ? Date.parse(out.builtAt) < Date.parse(out.srcCommitAt) : null;
  } catch { /* git unavailable: reported as null, and B fails on it */ }
  return out;
}
const BUILD = buildIdentity();
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale} machine=${ON_BOX ? 'box' : 'actions'}`);

// ---- the outside instrument + page-side readers (on every document, before any page script) --------------------------------------------------------
const INSTRUMENT = `(() => {
  if (window.__f3) return;
  const I = window.__f3 = { log: [], frames: [], keys: [], wheels: [], rup: [] };
  const LAYER = '[data-flux3-layer] canvas';
  const which = (cv) => (cv.parentElement ? Array.prototype.indexOf.call(cv.parentElement.children, cv) : -1);
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) {
      const cv = this.canvas;
      if (cv && cv.matches && cv.matches(LAYER) && I.log.length < 600000) {
        I.log.push([performance.now(), which(cv), m, m === 'drawImage' ? Math.round(+a[3] || 0) : 0, m === 'stroke' ? String(this.strokeStyle) : '']);
      }
      return o.apply(this, a);
    };
  }
  const raf = window.requestAnimationFrame.bind(window);
  let last = performance.now();
  const tick = () => { const now = performance.now(); I.frames.push([now, now - last]); last = now; if (I.frames.length > 40000) I.frames.splice(0, 20000); raf(tick); };
  raf(tick);
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  addEventListener('wheel', () => I.wheels.push(performance.now()), { capture: true, passive: true });
  addEventListener('pointerup', (e) => { if (e.button === 2) I.rup.push(performance.now()); }, true);
  // readers
  const rr = (r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
  I.calls = (t0, t1, f) => I.log.filter((e) => e[0] >= t0 && e[0] <= t1 && (!f || f(e))).length;
  I.state = () => {
    const root = document.documentElement, wrap = document.querySelector('.board-canvas-wrap'), cv = document.querySelector('.board-canvas');
    const layers = [...document.querySelectorAll('[data-flux3-layer]')], L = layers[0];
    const cards = [...document.querySelectorAll('.board-canvas .board-box')];
    const tele = document.querySelector('.flux3-tele');
    const res = performance.getEntriesByType('resource').map((e) => e.name);
    let under = null;
    const a = document.querySelector('.board-box[data-box-id="f3-a"]');
    if (a) { const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); under = !!(hit && a.contains(hit)); }
    return {
      theme: root.getAttribute('data-theme'), page: root.getAttribute('data-page'), flag: new URLSearchParams(location.search).get('flux3'), rootMark: root.hasAttribute('data-flux3'),
      canvasBg: cv ? getComputedStyle(cv).backgroundColor : null, layers: layers.length,
      layerAria: L ? L.getAttribute('aria-hidden') : null, layerPe: L ? getComputedStyle(L).pointerEvents : null,
      hostOk: !!(L && wrap && L.parentElement === wrap.parentElement), under,
      frame: wrap ? rr(wrap.getBoundingClientRect()) : null,
      cards: Object.fromEntries(cards.map((c) => [c.dataset.boxId, rr(c.getBoundingClientRect())])),
      texts: Object.fromEntries(cards.map((c) => [c.dataset.boxId, c.textContent])),
      records: document.querySelectorAll('.board-canvas .board-box > .flux3-node').length, nCards: cards.length,
      tele: tele ? tele.textContent : null, chunk: res.filter((n) => /\\/assets\\/boot-/.test(n)).map((n) => n.replace(/^.*\\//, '')),
      served: ([...document.scripts].map((s) => s.getAttribute('src') || '').find((s) => /index-/.test(s)) || '').replace(/^.*\\//, ''),
    };
  };
  // ink on the motion canvas inside a client-space rect (alpha > 0 pixels)
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
  I.layerTransform = () => { const w = document.querySelector('[data-flux3-layer] > div'); return w ? w.style.transform || '' : null; };
})();`;

// ---- the landed mutants: an anchor found exactly once in the served index-*.js, replaced in flight ---------------------------------------------------
const MUTANTS = {
  damp: ['damped(){return this.held||performance.now()<this.busyUntil}', 'damped(){return!1}'],
  scroll: ['addEventListener("scroll",this.onActivity', 'addEventListener("f3-mut-noscroll",this.onActivity'],
  hidden: ['hidden(){return typeof document<"u"&&document.hidden}', 'hidden(){return!1}'],
  flash: ['-this.lastFlashAt>=', '-this.lastFlashAt>=0*'],
};

const median = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const lum = (c) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const rgba = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
const ratio = (fgS, bgS, baseS) => {
  const base = rgba(baseS); let bg = rgba(bgS); const fg = rgba(fgS);
  if (!fg || !bg || !base) return NaN;
  bg = over(bg, base); const f = over(fg, bg);
  const [x, y] = [lum(f), lum(bg)].sort((p, q) => q - p);
  return +((x + 0.05) / (y + 0.05)).toFixed(2);
};

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const now = () => ev('performance.now()');
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
  const click = async (x, y) => { await app.mouseMove(x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const cardRect = (id) => ev(`(() => { const e = document.querySelector('.board-box[data-box-id="${id}"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
  const selectCard = async (id) => { const r = await cardRect(id); if (!r) return false; await click(Math.round(r.l + r.w * 0.3), Math.round(r.t + r.h * 0.3)); await sleep(700); return true; };

  // the mutant interceptor: every index-*.js response passes through; while a mutant is armed its anchor is replaced (exactly once, or not at all)
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
        const [from, to] = MUTANTS[mutant];
        const n = text.split(from).length - 1;
        landed[mutant] = n;
        if (n === 1) text = text.replace(from, to);
      }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* the request is gone */ } }
  });
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });

  // ---- the board, through the seams --------------------------------------------------------------------------------------------------------------
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const at = new Date().toISOString();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'f3-doc', text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  const T = (id, x, y, z, text, extra = {}) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [
    T('f3-a', 0.05, 0.05, 1, 'Card A'), T('f3-b', 0.5, 0.05, 2, 'Card B'), T('f3-c', 0.05, 0.4, 3, 'Card C'), T('f3-d', 0.5, 0.4, 4, 'Card D'),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('f3-h', 0.75, 0.05, 8, 'The hook', { deckStep: { deck: 'three-act', step: 'hook' }, lit: true }),
    { id: 'f3-p', kind: 'page-pin', entryId: 'f3-doc', x: 0.75, y: 0.75, w: 0.2, h: 0.15, z: 9 },
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 2600 },
  ];
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Schema S1', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await sleep(500);

  const open = async (flagOn, tone, view = [1920, 1080]) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); })()`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flagOn ? '/?flux3=1' : '/')} + '#/page/${BOARD}')`);
    await app.emulateDpr(1, view[0], view[1]);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"f3-a\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    if (flagOn) await app.waitFor("!!document.querySelector('[data-flux3-layer]') && getComputedStyle(document.querySelector('.board-canvas')).backgroundColor === 'rgba(0, 0, 0, 0)'", { timeout: 8000, label: 'the Schema' }).catch(() => {});
    await sleep(1400);
  };
  const state = () => ev('window.__f3.state()');
  const stored = () => ev('JSON.stringify(window.wrizoBoard ? window.wrizoBoard() : null)');

  // ---- P / OFF / G: the geometry law, flag off vs on, both tones, both widths ---------------------------------------------------------------------
  const reads = {};
  let storedBefore = null, storedAfterOn = null;
  for (const tone of TONES) {
    for (const flagOn of [false, true]) {
      await open(flagOn, tone);
      if (!storedBefore && !flagOn) storedBefore = await stored();
      for (const view of VIEWS) {
        await app.emulateDpr(1, view[0], view[1]);
        await sleep(600);
        reads[`${flagOn ? 'on' : 'off'}|${tone}|${view[0]}`] = await state();
        if (flagOn) await snap(`s1-${tone}-${view[0]}-rest`);
        else if (tone === 'dark' && view[0] === 1920) await snap('s1-control-flag-off-dark-1920');
      }
      if (flagOn) storedAfterOn = await stored();
    }
  }
  const on0 = reads['on|dark|1920'], off0 = reads['off|dark|1920'];
  ok('P1 flag on: the root carries data-flux3, flux-v3.css is applied (the canvas is clear), the theme is flux, the flag is in the URL',
    on0 && on0.rootMark && on0.canvasBg === 'rgba(0, 0, 0, 0)' && on0.theme === 'flux' && on0.flag === '1', JSON.stringify(on0 && { rootMark: on0.rootMark, canvasBg: on0.canvasBg, theme: on0.theme, flag: on0.flag }));
  ok('P2 ONE layer, aria-hidden, taking no pointer, hosted by the board frame, and under the cards (card A is what is under its own centre)',
    on0 && on0.layers === 1 && on0.layerAria === 'true' && on0.layerPe === 'none' && on0.hostOk && on0.under === true, JSON.stringify(on0 && { layers: on0.layers, aria: on0.layerAria, pe: on0.layerPe, host: on0.hostOk, under: on0.under }));
  ok(`P3 a node record on every card (${on0 && on0.records}/${on0 && on0.nCards}), and the readouts are true (9 nodes, 3 links)`,
    on0 && on0.nCards === 9 && on0.records === 9 && /\b9\b/.test(on0.tele || '') && /\b3\b/.test(on0.tele || ''), JSON.stringify(on0 && { records: on0.records, cards: on0.nCards, tele: on0.tele }));
  ok('OFF flag off: no layer, no record, no readouts, no root mark, and the flag\'s chunk was never fetched',
    off0 && off0.layers === 0 && off0.records === 0 && off0.tele === null && !off0.rootMark && off0.chunk.length === 0 && off0.theme === 'flux',
    JSON.stringify(off0 && { layers: off0.layers, records: off0.records, tele: off0.tele, mark: off0.rootMark, chunk: off0.chunk }));
  let cells = 0;
  for (const tone of TONES) for (const [w] of VIEWS) {
    const a = reads[`off|${tone}|${w}`], b = reads[`on|${tone}|${w}`];
    if (!a || !b) continue;
    cells += 1;
    const ids = Object.keys(a.cards);
    const moved = ids.filter((id) => JSON.stringify(a.cards[id]) !== JSON.stringify(b.cards[id]));
    const retexted = ids.filter((id) => a.texts[id] !== b.texts[id]);
    ok(`G [${tone} ${w}] the board frame and all ${ids.length} cards keep their rects with the flag on, and every card its text`,
      ids.length === 9 && JSON.stringify(a.frame) === JSON.stringify(b.frame) && moved.length === 0 && retexted.length === 0,
      JSON.stringify({ frame: [a.frame, b.frame], moved: moved.map((id) => [id, a.cards[id], b.cards[id]]), retexted }));
  }
  ok(`G coverage: ${cells}/4 cells compared`, cells === 4);
  ok('G the board\'s boxes (what it saves) are unchanged by the flag-on visits (nothing new is saved)', !!storedBefore && storedBefore === storedAfterOn,
    `${(storedBefore || '').length} vs ${(storedAfterOn || '').length} chars`);

  // ---- the shared measures -------------------------------------------------------------------------------------------------------------------------
  const rest = async (ms = 1200) => { const t0 = await now(); await sleep(ms); return ev(`window.__f3.calls(${t0}, performance.now())`); };
  const linkInk = async (fromId) => {   // ink in the 22 px just out of the from-card's right side, at its middle (every seeded link leaves rightwards)
    const r = await cardRect(fromId);
    return ev(`window.__f3.ink(${r.r + 2}, ${r.t + r.h / 2 - 3}, ${r.r + 24}, ${r.t + r.h / 2 + 3})`);
  };
  const electronsPerFrame = async () => {
    const t0 = await now(); await sleep(1500);
    return ev(`(() => { const L = window.__f3.log.filter((e) => e[0] >= ${t0}); const frames = L.filter((e) => e[1] === 1 && e[2] === 'clearRect').length;
      const el = L.filter((e) => e[2] === 'drawImage' && e[3] >= 16).length; return { frames, el }; })()`);
  };

  const testKeys = async () => {
    const r = await cardRect('f3-b');
    await app.doubleClick(Math.round(r.l + r.w * 0.5), Math.round(r.t + r.h * 0.4));
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    const before = await rest(1500);
    const k0 = await ev('window.__f3.keys.length');
    const word = ' the schema holds still while she types';
    for (const ch of word) { await app.typeKeys(ch); await sleep(90); }
    const span = await ev(`(() => { const k = window.__f3.keys.slice(${k0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
    const during = await ev(`window.__f3.calls(${span.a}, ${span.b})`);
    const reached = await ev(`(document.querySelector('.board-popup-editor')?.textContent || '').includes(${JSON.stringify(word.trim())})`);
    const after = await rest(1300);
    await click(20, 300);   // the backdrop, away from the popup: the card closes and keeps its words
    await sleep(600);
    return { before, keys: span.n, during, reached, after, pass: during === 0 };
  };
  const testWheel = async () => {
    await ev("document.querySelector('.board-canvas-wrap').scrollTop = 0");
    const before = await rest(1200);
    const r = await ev("(() => { const r = document.querySelector('.board-canvas-wrap').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 }; })()");
    const tf0 = await ev('window.__f3.layerTransform()');
    const w0 = await ev('window.__f3.wheels.length');
    for (let i = 0; i < 12; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(r.x), y: Math.round(r.y), deltaX: 0, deltaY: 120 }); await sleep(60); }
    const span = await ev(`(() => { const k = window.__f3.wheels.slice(${w0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
    const during = await ev(`window.__f3.calls(${span.a}, ${span.b})`);
    const scrolled = await ev("document.querySelector('.board-canvas-wrap').scrollTop");
    const tf1 = await ev('window.__f3.layerTransform()');
    const t1 = await now(); await sleep(1300);
    const ground = await ev(`window.__f3.calls(${t1}, performance.now(), (e) => e[1] === 0)`);
    return { before, wheels: span.n, during, scrolled, moved: tf0 !== tf1, tf1, ground, pass: during === 0 };
  };
  const testScroll = async () => {
    await ev("document.querySelector('.board-canvas-wrap').scrollTop = 0");
    const before = await rest(1300);
    const span = await ev(`new Promise((res) => { const w = document.querySelector('.board-canvas-wrap'); const ts = []; let i = 0;
      const step = () => { w.scrollTop += 60; ts.push(performance.now()); i += 1; if (i < 10) setTimeout(step, 50); else setTimeout(() => res({ a: ts[0], b: ts[ts.length - 1] + 16, top: w.scrollTop }), 20); }; step(); })`);
    const during = await ev(`window.__f3.calls(${span.a}, ${span.b})`);
    const after = await rest(1300);
    return { before, during, top: span.top, after, pass: during === 0 };
  };
  const testHidden = async () => {
    const before = await rest(1000);
    await ev("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'))");
    const t0 = await now(); await sleep(1500);
    const during = await ev(`window.__f3.calls(${t0}, performance.now())`);
    await ev("delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'))");
    const after = await rest(1200);
    return { before, during, after, pass: during === 0 };
  };
  const testFlash = async (src, targets) => {
    await selectCard(src);
    await sleep(900);
    const t0 = await now();
    const r0 = await ev('window.__f3.rup.length');
    for (const tid of targets) {
      const h = await ev(`(() => { const e = document.querySelector('.board-box[data-box-id="${src}"] .board-handle'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
      const tr = await cardRect(tid);
      if (!h || !tr) continue;
      const to = { x: Math.round(tr.l + tr.w / 2), y: Math.round(tr.t + tr.h / 2) };
      await app.mouseMove(h.x, h.y);
      await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: h.x, y: h.y, button: 'right', buttons: 2, clickCount: 1, pointerType: 'mouse' });
      for (let i = 1; i <= 4; i += 1) await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(h.x + ((to.x - h.x) * i) / 4), y: Math.round(h.y + ((to.y - h.y) * i) / 4), button: 'right', buttons: 2, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'right', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    }
    const ups = await ev(`window.__f3.rup.slice(${r0})`);
    await sleep(4200);
    const conns = await ev('(window.wrizoBoard() || []).filter((b) => b.kind === "connection").map((b) => [b.connA, b.connB])');
    const made = targets.filter((t) => conns.some(([a, b]) => (a === src && b === t) || (a === t && b === src))).length;
    // the flash strokes: the inner stroke's alpha = 0.5 + 0.5 x lf (lf = what is left of the flash), so its start = t - (1 - lf) x FLASH_MS
    const strokes = await ev(`window.__f3.log.filter((e) => e[0] >= ${t0} && e[2] === 'stroke' && /rgba\\(166, ?240, ?255/.test(e[4])).map((e) => [e[0], e[4]])`);
    const starts = [];
    for (const [t, s] of strokes) {
      const a = (rgba(s) || [0, 0, 0, 0])[3];
      if (a < 0.5) continue;
      const st = t - (1 - (2 * a - 1)) * FLASH_MS;
      if (!starts.some((x) => Math.abs(x - st) < 60)) starts.push(st);
    }
    starts.sort((x, y) => x - y);
    let maxPerSec = 0; for (let i = 0; i < starts.length; i += 1) maxPerSec = Math.max(maxPerSec, starts.filter((x) => x >= starts[i] && x < starts[i] + 1000).length);
    const gaps = starts.slice(1).map((x, i) => Math.round(x - starts[i]));
    const burst = ups.length >= 2 ? Math.round(ups[ups.length - 1] - ups[0]) : null;
    return { made, ups: ups.length, burst, flashes: starts.length, maxPerSec, gaps, pass: starts.length === made && made === targets.length && maxPerSec <= 3 };
  };

  // ---- dark, 1920: LINKS, E, D2, HIDDEN, STILL, F, C, frames ---------------------------------------------------------------------------------------
  await open(true, 'dark');
  const inks = { ac: await linkInk('f3-a'), bd: await linkInk('f3-b'), ef: await linkInk('f3-e'), g: await linkInk('f3-g') };
  ok('LINKS each seeded link is drawn on the motion canvas out of its from-card (A-C, B-D, E-F), and nothing beside G, which has no link',
    inks.ac > 0 && inks.bd > 0 && inks.ef > 0 && inks.g === 0, JSON.stringify(inks));

  await selectCard('f3-a'); await sleep(900);
  const eA = await electronsPerFrame();
  await snap('s1-dark-1920-selected');
  await selectCard('f3-g'); await sleep(900);
  const eG = await electronsPerFrame();
  await selectCard('f3-e'); await sleep(900);
  const eE = await electronsPerFrame();
  ok('E electrons only on the selected node\'s links: 2 per motion frame per link (A: 1 link, G: none, E: 1 link)',
    eA.frames >= 10 && eA.el === 2 * eA.frames && eG.frames >= 10 && eG.el === 0 && eE.frames >= 10 && eE.el === 2 * eE.frames, JSON.stringify({ A: eA, G: eG, E: eE }));

  const K = await testKeys();
  ok(`D2-KEYS ZERO layer draw calls while ${K.keys} keys land in a card (first key to last)`, K.pass && K.keys >= 40, JSON.stringify(K));
  ok('D2-KEYS premises: the layer animated just before, the words reached the card, and it draws again after she settles', K.before > 0 && K.reached && K.after > 0, JSON.stringify(K));
  const Wh = await testWheel();
  ok(`D2-WHEEL ZERO layer draw calls while the board scrolls by the wheel (${Wh.wheels} notches)`, Wh.pass && Wh.wheels >= 12, JSON.stringify(Wh));
  ok('D2-WHEEL premises: the board scrolled, the held frame moved with it (a transform), and the ground was redrawn at the new view after settling', Wh.before > 0 && Wh.scrolled > 0 && Wh.moved && Wh.ground > 0, JSON.stringify(Wh));
  const Sc = await testScroll();
  ok('D2-SCROLL ZERO layer draw calls while the board scrolls with no wheel and no pointer (the scroll position stepped, as a scrollbar drag moves it)', Sc.pass && Sc.top > 0, JSON.stringify(Sc));
  ok('D2-SCROLL premises: the layer animated before and draws again after', Sc.before > 0 && Sc.after > 0, JSON.stringify(Sc));
  const Hd = await testHidden();
  ok('HIDDEN ZERO layer draw calls while the window is hidden; it draws again when shown', Hd.pass && Hd.before > 0 && Hd.after > 0, JSON.stringify(Hd));

  await ev("document.querySelector('.board-canvas-wrap').scrollTop = 0");
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await sleep(1300);
  const stillCalls = await rest(1500);
  const stillInk = await linkInk('f3-a');
  await app.emulateMedia([]);
  const stillAfter = await rest(1300);
  ok('STILL reduced motion = the still frame: ZERO layer draw calls once settled, the links still drawn, and motion resumes when it clears',
    stillCalls === 0 && stillInk > 0 && stillAfter > 0, JSON.stringify({ stillCalls, stillInk, stillAfter }));

  const F = await testFlash('f3-a', ['f3-b', 'f3-d', 'f3-f', 'f3-g']);
  ok(`F <= 3 flashes a second, measured: ${F.made} links made in a ${F.burst} ms burst each lit once (${F.flashes} flashes), at most ${F.maxPerSec} starts in any 1 s`,
    F.pass && F.burst !== null && F.burst < 1000, JSON.stringify(F));

  // ---- C: contrast, both tones (B carries the LAST mark from the typing; in light, a short typing again) ------------------------------------------
  const contrast = async (tone) => ev(`(() => {
    const L = document.querySelector('[data-flux3-layer]'), ground = getComputedStyle(L).backgroundColor;
    const pick = (sel, pseudo) => { const e = document.querySelector(sel); return e ? getComputedStyle(e, pseudo || null).color : null; };
    const tele = document.querySelector('.flux3-tele');
    return { tone: ${JSON.stringify(tone)}, ground, strip: tele ? getComputedStyle(tele).backgroundColor : null,
      addr: pick('.flux3-node-h', '::before'), kind: pick('.board-box[data-box-id="f3-a"] .flux3-node-h', '::after'), preset: pick('.board-box[data-box-id="f3-h"] .flux3-node-h', '::after'),
      links: pick('.flux3-node-f', '::before'), ok: pick('.board-box[data-box-id="f3-h"] .flux3-node-f', '::after'),
      teleLabel: tele ? getComputedStyle(tele).color : null, teleValue: pick('.flux3-tele b'), lvl: pick('.flux3-tele-lvl'), you: pick('.flux3-tele-you'),
      youText: document.querySelector('.flux3-tele-you')?.textContent || '' };
  })()`);
  const judge = (c) => {
    const g = c.ground;
    const n = {
      addr: ratio(c.addr, 'rgba(0,0,0,0)', g), kind: ratio(c.kind, 'rgba(0,0,0,0)', g), preset: ratio(c.preset, 'rgba(0,0,0,0)', g),
      links: ratio(c.links, 'rgba(0,0,0,0)', g), ok: ratio(c.ok, 'rgba(0,0,0,0)', g),
      teleLabel: ratio(c.teleLabel, c.strip, g), teleValue: ratio(c.teleValue, c.strip, g), lvl: ratio(c.lvl, c.strip, g), you: ratio(c.you, c.strip, g),
    };
    const labels = ['addr', 'kind', 'preset', 'links', 'ok', 'teleLabel', 'teleValue', 'lvl'];
    return { n, pass: labels.every((k) => n[k] >= 4.5) && n.you >= 7 && c.youText !== '—' && c.youText.length > 0 };
  };
  const cDark = await contrast('dark');
  const jDark = judge(cDark);
  console.log(`CONTRAST dark  ${JSON.stringify(jDark.n)}  (last: "${cDark.youText}")`);
  ok('C [dark] labels >= 4.5:1 against the ground or the strip, the LAST node\'s name >= 7:1', jDark.pass, JSON.stringify({ ...jDark.n, last: cDark.youText }));

  await open(true, 'light');
  await selectCard('f3-a'); await sleep(900);
  await snap('s1-light-1920-selected');
  const K2 = await testKeys();
  const cLight = await contrast('light');
  const jLight = judge(cLight);
  console.log(`CONTRAST light ${JSON.stringify(jLight.n)}  (last: "${cLight.youText}")`);
  ok('C [light] labels >= 4.5:1 against the ground or the strip, the LAST node\'s name >= 7:1', jLight.pass && K2.reached, JSON.stringify({ ...jLight.n, last: cLight.youText }));
  if (SHOTS) { await app.emulateDpr(1, 1366, 768); await sleep(700); await snap('s1-light-1366-last'); await open(true, 'dark', [1366, 768]); await selectCard('f3-a'); await sleep(900); await snap('s1-dark-1366-selected'); }

  // ---- BUDGET: at rest, full motion, flag on vs off, interleaved rounds ----------------------------------------------------------------------------
  const arm = async (flagOn) => {
    await open(flagOn, 'dark');
    await selectCard('f3-a');
    await sleep(1500);
    const t0 = await now(); await sleep(4000);
    return ev(`(() => { const f = window.__f3.frames.filter((r) => r[0] >= ${t0}).map((r) => r[1]); const s = f.slice().sort((a, b) => a - b); const m = s.length >> 1;
      return { n: f.length, median: s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN, layerCalls: window.__f3.calls(${t0}, performance.now()) }; })()`);
  };
  const C = [], Tn = [];
  for (let round = 0; round <= ROUNDS; round += 1) {
    const order = round % 2 ? [true, false] : [false, true];
    for (const flagOn of order) { const r = await arm(flagOn); if (round > 0) (flagOn ? Tn : C).push(r); }
  }
  const cMed = median(C.map((r) => r.median)), tMed = median(Tn.map((r) => r.median)), limit = cMed * 1.10;
  const bDetail = `control ${cMed.toFixed(2)} ms, Schema ${tMed.toFixed(2)} ms, limit ${limit.toFixed(2)} ms; rounds ${JSON.stringify({ C: C.map((r) => +r.median.toFixed(2)), T: Tn.map((r) => +r.median.toFixed(2)) })}; layer calls per 4 s ${JSON.stringify(Tn.map((r) => r.layerCalls))}`;
  ok('BUDGET premise: the Schema arm drew (full motion at rest) and the control drew nothing', Tn.every((r) => r.layerCalls > 0) && C.every((r) => r.layerCalls === 0), bDetail);
  if (ON_BOX) ok('BUDGET rule 2: at rest, the Schema\'s median frame interval is within 10% of the control\'s (the box)', tMed <= limit, bDetail);
  else info('BUDGET (information: a hosted runner; rule 2 is judged on the box)', `${bDetail} -> ${tMed <= limit ? 'within' : 'OVER'}`);

  // ---- the mutants, each landed in the served bundle ----------------------------------------------------------------------------------------------
  const withMutant = async (name, run) => {
    mutant = name; landed[name] = undefined;
    try { await open(true, 'dark'); return { landed: landed[name], ...(await run()) }; } finally { mutant = null; }
  };
  const mD = await withMutant('damp', testKeys);
  ok('MUT-DAMP (landed) the damping gate always open: D2-KEYS fails', mD.landed === 1 && !mD.pass, JSON.stringify(mD));
  const mS = await withMutant('scroll', testScroll);
  ok('MUT-SCROLL (landed) the layer deaf to scroll: D2-SCROLL fails', mS.landed === 1 && !mS.pass, JSON.stringify(mS));
  const mH = await withMutant('hidden', testHidden);
  ok('MUT-HIDDEN (landed) the hidden gate always false: HIDDEN fails', mH.landed === 1 && !mH.pass, JSON.stringify(mH));
  const mF = await withMutant('flash', () => testFlash('f3-e', ['f3-a', 'f3-b', 'f3-c', 'f3-d']));
  ok('MUT-FLASH (landed) the flash spacing removed: F fails (more than 3 starts in a second)', mF.landed === 1 && mF.made === 4 && mF.maxPerSec > 3, JSON.stringify(mF));

  // ---- B: the build -------------------------------------------------------------------------------------------------------------------------------
  await open(true, 'dark');
  const served = (await state()).served;
  ok(`B the build: served ${served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-S1 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-S1 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
