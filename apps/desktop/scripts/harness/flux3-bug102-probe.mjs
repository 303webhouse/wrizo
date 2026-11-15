// FLUX3-BUG102-PROBE (INK, Nov 14; a SCRATCH probe on a throwaway branch, never merged): bug #102 is the new Flux's own cost in the card editor (Z100's p95 sits ~10 ms over Arbor's, clock and paint, while the key's own
// synchronous work is the same, 2.6 vs 2.4 ms). Arms bisect it: Flux theme alone / with every filter, backdrop, shadow, animation, transition, blend and will-change off / with the layer hidden / with the telemetry hidden.
// Information only: prints BUG102 rows. Built from flux3-latency-zoom.mjs's machinery (the card on the Schema board, 44 keys one every 90 ms, the meter, the arm order rotating).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { isOnBox, timingGate } from '../lib/timing-gate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ROUNDS = Math.max(3, Number(process.env.FLUX3_ROUNDS || 8));
const KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100, IDLE_MS = 1500, BURN_MS = 24;
const VIEW = [1920, 1080];
const BOARD = 'f3lz-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const ON_BOX = isOnBox();
const info = (name, pass, detail = '') => ok(`${name} [INFORMATION, bug #102: the measure ${pass ? 'passed' : 'did NOT pass'}; this line gates nothing]`, true, detail);
const timing = (name, pass, detail = '') => {
  const g = timingGate(ON_BOX, pass);
  checks.push({ name: g.info ? `${name} [INFORMATION on Actions: the measure ${g.actual ? 'PASSED' : 'did NOT pass'}; this line gates nothing here]` : name, pass: g.pass, detail });
  if (g.info && !g.actual) console.log(`INFO (would have failed on the box) ${name} -- ${detail}`);
};

// ---- the build this run uses (flux3-latency's own reading)
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
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale}`);

// ---- the outside instrument (a new-document script: in place before the app's first line, on every reload): the real layer's draw calls per frame
const INSTRUMENT = `(() => {
  if (window.__f3z) return;
  const I = window.__f3z = { frames: [], layer: 0 };
  const LAYER = '[data-flux3-layer] canvas';
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) { const cv = this.canvas; if (cv && cv.matches && cv.matches(LAYER)) I.layer += 1; return o.apply(this, a); };
  }
  const raf = window.requestAnimationFrame.bind(window);
  const tick = () => { I.frames.push([performance.now(), I.layer]); I.layer = 0; if (I.frames.length > 40000) I.frames.splice(0, 20000); raf(tick); };
  raf(tick);
})();`;

// ---- statistics (flux3-latency's)
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const show = (st) => JSON.stringify({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
function judge(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(r.lat).median), cP95s = cRounds.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap((r) => r.lat)), X = stat(xRounds.flatMap((r) => r.lat));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const lat = enough && X.median <= C.median + spreadMed && X.p95 <= C.p95 + spreadP95 && X.max <= MAX_MS;
  const xLayer = xRounds.reduce((a, r) => a + r.layerFrames, 0);
  return { lat, layerDamp: xLayer <= xRounds.length, xLayer, C, X, spreadMed, spreadP95, enough };
}

// The COST reading (Nov 14, Fable's ruling after the per-key print: the clock cannot see a cost under a frame): lib/l-method.mjs's second reading, per key BUSY + FRAME. BUSY = keydown -> the end of the
// task that handled the key (a message posted from the key's last event); FRAME = the first animation frame after the input -> the end of that frame's rendering (a message posted from the rAF).
// Judged like the clock (the arm's median and p95 within the control's own round-to-round spread) but with a CAP on that allowance: a control noisier than the cap makes the run VOID (quiet = false), not green.
const CAP_MED = 8, CAP_P95 = 12;   // the cap: CONFIRMED by Fable Nov 14 12:24 pm (a control over it: the run is VOID)
const FLOOR_MED = 1, FLOOR_P95 = 2;   // PROVISIONAL (Nov 14): the allowance is the control's spread clamped to [floor, cap]; a control with no spread must not allow nothing
// SUPERSEDED reading (the comment above says BUSY + FRAME): the Nov 14 candidates run (Actions 43632967969) showed it does not rise with the burn (+5 -> +9, +10 -> +40.2, +24 -> +21.8), so it fails Fable's MUTS-ORDER condition. The COST reading is now WORK:
// the key's own synchronous work, keydown capture -> the `input` event's bubble at the document (no frame in it): the same burns lift it +4.9 / +9.9 / +24.0 and the control's per-round median spread is 0. BUSY and FRAME stay printed (information).
// The original line, parked: // const costOf = (r) => (r.ks || []).filter((k) => k[3] != null && k[6] != null).map((k) => k[3] + k[6]);
const costOf = (r) => (r.ks || []).map((k) => k[7]).filter((x) => x != null);
function judgeCost(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(costOf(r)).median), cP95s = cRounds.map((r) => stat(costOf(r)).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap(costOf)), X = stat(xRounds.flatMap(costOf));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const quiet = spreadMed <= CAP_MED && spreadP95 <= CAP_P95;
  const allowMed = Math.min(Math.max(spreadMed, FLOOR_MED), CAP_MED), allowP95 = Math.min(Math.max(spreadP95, FLOOR_P95), CAP_P95);
  const within = X.median <= C.median + allowMed && X.p95 <= C.p95 + allowP95;
  return { enough, quiet, within, pass: enough && quiet && within, caught: enough && quiet && !within, C, X, spreadMed, spreadP95, allowMed, allowP95 };
}

const CYCLE = 'the signal holds while she writes on ';
const BLUR = '.board-canvas-blurred{filter:none!important}';
const W = '.board-canvas-blur-wrap';
// Fable Nov 14 5:50 pm: (1) pin down which layer holds key-to-paint (the canvases; here the ground and the motion canvas apart: the box measures them, Actions has no compositor to show a canvas's cost),
// (2) the Wrizors' look B: the blur made ONCE when the card opens, then held still, measured against "filter off". Every Flux arm has ?flux3=1; the baseline for the B arms is NOBLUR.
const ARMS = {
  C:       { theme: 'plateau', flag: false, scale: null, css: '', what: 'Arbor (as shipped: the live blur on)' },
  ZSHIP:   { theme: 'flux', flag: true, scale: 1, css: '', what: 'Flux as shipped (the live blur on, the layer on)' },
  NOBLUR:  { theme: 'flux', flag: true, scale: 1, css: BLUR, what: 'Flux, filter OFF (the baseline B is measured against)' },
  BWILL:   { theme: 'flux', flag: true, scale: 1, css: `${W}{will-change:filter,opacity}`, what: 'the live blur, the wrap promoted (will-change: filter, opacity)' },
  BTRANS:  { theme: 'flux', flag: true, scale: 1, css: `${W}{transform:translateZ(0)}`, what: 'the live blur, the wrap on its own layer (translateZ(0))' },
  BPAINT:  { theme: 'flux', flag: true, scale: 1, css: `${W}{contain:paint;isolation:isolate}`, what: 'the live blur, the wrap painted in isolation (contain:paint; isolation)' },
  BIMG:    { theme: 'flux', flag: true, scale: 1, css: '', snap: true, what: 'LOOK B, as a bound: the blurred board captured ONCE after the card opens and laid over the hidden live board as one static image' },
  LNOGCV:  { theme: 'flux', flag: true, scale: 1, css: `${BLUR}[data-flux3-layer] canvas:nth-child(1){display:none!important}`, what: 'filter off + the layer\'s FIRST canvas (the ground) hidden' },
  LNOMCV:  { theme: 'flux', flag: true, scale: 1, css: `${BLUR}[data-flux3-layer] canvas:nth-child(2){display:none!important}`, what: 'filter off + the layer\'s SECOND canvas (the motion) hidden' },
};

// the nine cards and three links (flux3-s1's board), on a TALL canvas so the outer limit lies below 0.20
const makeBoxes = () => {
  const T = (id, x, y, z, text, extra = {}) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [
    T('f3-a', 0.05, 0.05, 1, 'Card A'), T('f3-b', 0.5, 0.05, 2, 'Card B'), T('f3-c', 0.05, 0.4, 3, 'Card C'), T('f3-d', 0.5, 0.4, 4, 'Card D'),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('f3-h', 0.75, 0.05, 8, 'The hook'),
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 3400 },
  ];
};

try { await withHarness(async (app) => {
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });

  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Zoom latency', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const runArm = async (name, round) => {
    const arm = ARMS[name];
    // off the board (the Desk has no flush handler), the cards back to their seed through the seam (it flushes before it returns), then the theme and the flag
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BOARD)}, { boxes: ${JSON.stringify(makeBoxes())} })`);
    await ev(`localStorage.setItem('wrizo-theme', ${JSON.stringify(arm.theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(arm.flag ? '/?flux3=1' : '/')} + '#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"f3-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    if (arm.flag) await app.waitFor("!!document.querySelector('[data-flux3-layer]') && !!document.querySelector('.flux3-tele')", { timeout: 10000, label: 'the Schema' }).catch(() => {});
    await sleep(1400);
    if (arm.css) await ev(`(() => { const s = document.createElement('style'); s.setAttribute('data-probe', '1'); s.textContent = ${JSON.stringify(arm.css)}; document.head.appendChild(s); return true; })()`);
    let landed = null;
    if (arm.scale != null && arm.scale !== 1) { landed = await ev(`window.wrizoFluxZoomTo(${arm.scale})`); await sleep(1000); }
    // the card centred in the frame (a scroll is a pan), then opened for editing
    await ev(`(() => { const wrap = document.querySelector('.board-canvas-wrap'), e = document.querySelector('.board-box[data-box-id="f3-d"]'); if (!wrap || !e) return; const r = e.getBoundingClientRect(), w = wrap.getBoundingClientRect(); wrap.scrollLeft += (r.left + r.width / 2) - (w.left + wrap.clientWidth / 2); wrap.scrollTop += (r.top + r.height / 2) - (w.top + wrap.clientHeight / 2); })()`);
    await sleep(900);
    const b = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"f3-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
    if (b) await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    if (arm.snap) {
      // LOOK B, as a bound on its cost: the board blurred ONCE (the app's own blur, settled), captured as one PNG with the popup's backdrop hidden for the shot, laid over the live board, which is then hidden
      const rect = await ev("(() => { const w = document.querySelector('.board-canvas-blur-wrap'); if (!w) return null; const r = w.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()");
      await ev("(() => { const b = document.querySelector('.board-popup-backdrop'); if (b) b.style.visibility = 'hidden'; })()");
      await sleep(700);
      const shot = rect ? await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 } }) : null;
      if (shot && shot.data) await ev(`(() => { const w = document.querySelector('.board-canvas-blur-wrap'); const img = document.createElement('img'); img.id = '__snap'; img.src = 'data:image/png;base64,${shot.data}'; img.style.cssText = 'position:fixed;left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;z-index:205;pointer-events:none'; document.body.appendChild(img); w.style.visibility = 'hidden'; const b = document.querySelector('.board-popup-backdrop'); if (b) b.style.visibility = ''; const e = document.querySelector('.board-popup-editor'); if (e) { e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); } })()`);
      await sleep(400);
    }
    await sleep(IDLE_MS);
    const where = await ev(`(() => { const root = document.documentElement, cv = document.querySelector('.board-canvas'), cr = cv && cv.getBoundingClientRect(), ed = document.querySelector('.board-popup-editor');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
      return { theme: root.getAttribute('data-theme'), flag: new URLSearchParams(location.search).get('flux3'), layer: document.querySelectorAll('[data-flux3-layer]').length,
        scale: cr && cv.offsetWidth ? cr.width / cv.offsetWidth : null, focused: !!ed && document.activeElement === ed, before: ed ? ed.textContent.length : -1,
        served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null, instrument: !!window.__f3z, canv: [...document.querySelectorAll('[data-flux3-layer] canvas')].map((c) => c.width + 'x' + c.height + ' css ' + Math.round(c.getBoundingClientRect().width) + 'x' + Math.round(c.getBoundingClientRect().height)), filtered: [...document.querySelectorAll('*')].filter((e) => { const f = getComputedStyle(e).filter; return f && f !== 'none'; }).slice(0, 14).map((e) => { const r = e.getBoundingClientRect(); return e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).slice(0, 48) + ' ' + getComputedStyle(e).filter.slice(0, 30) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); }) }; })()`);
    // the meter (flux3-latency's, verbatim in method: keydown -> the second animation frame after its beforeinput). DIAG (Nov 14): the same listeners also stamp, per key, the points inside that
    // interval (beforeinput, the first frame, the second frame) and the l-method's BUSY reading (keydown -> the end of the task that handled the key), and an Event Timing observer lists
    // each event's input delay and processing; nothing below changes what the clock measures, it only writes down where the time went.
    await ev(`(() => {
      window.__lat = []; window.__ks = []; window.__et = []; let t0 = 0, cur = null;
      if (window.__latOff) window.__latOff();
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__et.push([e.name, e.startTime, e.processingStart, e.processingEnd, e.duration]); }).observe({ type: 'event', durationThreshold: 16 }); } catch (e) { /* no Event Timing: the DIAG says so */ }
      const kd = () => { t0 = performance.now(); cur = { kd: t0, bi: null, f1: null, f2: null, busy: null, frame: null, work: null, b0: null, b1: null }; window.__ks.push(cur); };
      const bi = () => { const t = t0, k = cur; if (k) k.bi = performance.now() - t; requestAnimationFrame(() => { const r = performance.now(); if (k) k.f1 = r - t; const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - r; mc.port1.close(); }; mc.port2.postMessage(0); requestAnimationFrame(() => { const now = performance.now(); if (k) k.f2 = now - t; window.__lat.push({ ms: now - t, key: t, at: now }); }); }); };
      const inp = () => { const k = cur; if (k) k.work = performance.now() - k.kd; if (!k || k.busy !== null || k.posted) return; k.posted = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - k.kd; mc.port1.close(); }; mc.port2.postMessage(0); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true); document.addEventListener('beforeinput', inp, false); document.addEventListener('input', inp, false);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); document.removeEventListener('beforeinput', inp, false); document.removeEventListener('input', inp, false); };
      return true; })()`);
    // the burn (the mutant): a synchronous busy-wait on every beforeinput, installed AFTER the meter (the same phase, registered second, so it runs after the meter has stamped the keydown and queued its two
    // animation frames): the frames cannot run until the burn ends, so the cost lands inside the measured interval whatever the frame phase. (Two earlier shapes failed on Actions: a burn on keydown installed
    // BEFORE the meter was invisible - the stamp came after it; installed after the meter it moved the median 5 ms at 12 ms and, at 24 ms, LOWERED it by 19 on a slow runner, the frame phase swallowing it.)
    if (arm.burn) await ev(`(() => { window.__burnN = 0; document.addEventListener('beforeinput', () => { const t = performance.now(); while (performance.now() - t < ${arm.burn}) { /* burn */ } window.__burnN += 1; const k = window.__ks[window.__ks.length - 1]; if (k) { k.b0 = t - k.kd; k.b1 = performance.now() - k.kd; } }, true); return true; })()`);
    let typed = '';
    for (let i = 0; i < KEYS; i += 1) { const ch = CYCLE[(round * 7 + i) % CYCLE.length]; typed += ch; await app.typeKeys(ch); await sleep(GAP); }
    await sleep(250);
    const got = await ev(`(() => {
      const lat = window.__lat.slice(), fr = window.__f3z ? window.__f3z.frames.slice() : [];
      const k0 = lat.length ? Math.min(...lat.map((x) => x.key)) : 0, k1 = lat.length ? Math.max(...lat.map((x) => x.at)) : 0;
      const win = fr.filter((f) => f[0] >= k0 && f[0] <= k1);
      const ed = document.querySelector('.board-popup-editor');
      return { lat: lat.map((x) => x.ms), layerFrames: win.filter((f) => f[1] > 0).length, frames: win.length, after: ed ? ed.textContent.length : -1, burned: window.__burnN || 0,
        ks: window.__ks.map((k) => [k.bi, k.f1, k.f2, k.busy, k.b0, k.b1, k.frame, k.work].map((x) => (x == null ? null : Math.round(x * 10) / 10))), et: window.__et.map((e) => e.map((x) => (typeof x === 'number' ? Math.round(x * 10) / 10 : x))) };
    })()`);
    return { name, round, where, landed, typed: typed.length, ...got };
  };

  // warm-up (discarded), then the rounds, the arm order rotating each round
  await runArm('C', 0);
  const order = Object.keys(ARMS);
  const res = Object.fromEntries(order.map((k) => [k, []]));
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = order.slice((round - 1) % order.length).concat(order.slice(0, (round - 1) % order.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }
  const all = Object.values(res).flat();

  // ---- premises (the zoom probe's, for the arms this probe has)
  const placed = all.filter((r) => { const a = ARMS[r.name], w = r.where; return w.theme === a.theme && (a.flag ? w.flag === '1' && w.layer === 1 : w.flag === null && w.layer === 0) && w.focused && w.instrument; });
  ok(`P1 every arm stood where it claims (theme, flag, the layer, the card editor focused, the instrument in place): ${placed.length}/${all.length}`, placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 3).map((r) => ({ arm: r.name, round: r.round, where: r.where }))));
  const thin = all.filter((r) => r.lat.length < MIN_KEYS);
  ok(`P5 at least ${MIN_KEYS} keys painted in every arm-round`, thin.length === 0, JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round, n: r.lat.length }))));
  const lost = all.filter((r) => r.after - r.where.before !== r.typed);
  ok('P6 no key was dropped', lost.length === 0, JSON.stringify(lost.slice(0, 4).map((r) => ({ arm: r.name, round: r.round, grew: r.after - r.where.before, typed: r.typed }))));

  // ---- the table (information only): where does Flux's gap over Arbor in the card editor come from?
  //   clock = keydown -> the second frame; paint = BUSY + FRAME (the l-method's cost reading: it carries the frame pipeline, which is where the gap lives); work = the key's own synchronous work; late = keys whose Event Timing duration is >= 48 ms
  const paintOf = (r) => (r.ks || []).filter((k) => k[3] != null && k[6] != null).map((k) => k[3] + k[6]);
  const workOf2 = (r) => (r.ks || []).map((k) => k[7]).filter((x) => x != null);
  const T = Object.fromEntries(order.map((k) => {
    const lat = res[k].flatMap((r) => r.lat), paint = res[k].flatMap(paintOf), work = res[k].flatMap(workOf2);
    const dur = res[k].flatMap((r) => (r.et || []).filter((e) => e[0] === 'keydown').map((e) => e[4]));
    const cm = res[k].map((r) => stat(r.lat).median), cp = res[k].map((r) => stat(r.lat).p95);
    const f1 = stat(res[k].flatMap((r) => (r.ks || []).map((x) => x[1]).filter((x) => x != null))), durS = stat(dur);
    return [k, { f1, durS, clock: stat(lat), paint: stat(paint), work: stat(work), late: dur.filter((x) => x >= 48).length, nET: dur.length, spreadMed: Math.max(...cm) - Math.min(...cm), spreadP95: Math.max(...cp) - Math.min(...cp) }];
  }));
  for (const k of order) {
    const t = T[k];
    console.log(`BUG102 ${k.padEnd(8)} clock ${r1(t.clock.median)}/${r1(t.clock.p95)} (round spread ${r1(t.spreadMed)}/${r1(t.spreadP95)}) | paint ${r1(t.paint.median)}/${r1(t.paint.p95)} | work ${r1(t.work.median)}/${r1(t.work.p95)} | first frame ${r1(t.f1.median)}/${r1(t.f1.p95)} | key-to-paint (Event Timing) ${r1(t.durS.median)}/${r1(t.durS.p95)} | late ${t.late}/${t.nET} | ${ARMS[k].what}`);
  }
  for (const k of ['C', 'ZSHIP']) console.log(`BUG102-CANVAS ${k}: ${JSON.stringify((res[k][0] && res[k][0].where.canv) || [])}`);
  for (const k of ['C', 'ZSHIP']) console.log(`BUG102-FILTERED ${k}: ${JSON.stringify((res[k][0] && res[k][0].where.filtered) || [])}`);
  // each arm against NOBLUR (Flux, filter OFF): a B arm that costs the same shows deltas near 0; ZSHIP shows what the live blur costs
  for (const k of order.filter((x) => x !== 'C' && x !== 'NOBLUR')) {
    const d = (f, g) => r1(T[k][f][g] - T.NOBLUR[f][g]);
    console.log(`BUG102-VS-NOBLUR ${k.padEnd(9)} first frame ${d('f1', 'median')} (p95 ${d('f1', 'p95')}) | key-to-paint median ${d('durS', 'median')} | late keys ${T[k].late - T.NOBLUR.late} (of ${T[k].nET}) | paint p95 ${d('paint', 'p95')} | clock p95 ${d('clock', 'p95')}`);
  }
  ok(`BUG102 (information) NOBLUR (Flux, blur off, layer on) against Arbor: first frame ${r1(T.NOBLUR.f1.median)} vs ${r1(T.C.f1.median)}, key-to-paint ${r1(T.NOBLUR.durS.median)} vs ${r1(T.C.durS.median)}, late ${T.NOBLUR.late} vs ${T.C.late}`, true, '');

  // ---- the build
  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served.size === 1 && served.has(BUILD.bundle) && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-BUG102-PROBE VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-BUG102-PROBE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
