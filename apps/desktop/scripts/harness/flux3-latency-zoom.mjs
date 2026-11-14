// FLUX3-LATENCY-ZOOM (Fable, Nov 12: "the latency line at 0.20, 1.00 and 4.00"; the Flux zoom, step 1: flux-zoom-1). The speed check flux3-latency.mjs types on the WRITING PAGE and never opens the board, so
// it cannot see the zoom camera. This probe types INTO A CARD on the Schema board, at three scales, and judges each against a control by flux3-latency's own method and bar:
//   C     the control: the SAME board, the SAME card, in Arbor (theme plateau, no flag): no camera, no layer, true size
//   Z100  Flux, ?flux3=1, the Schema at true size (1.00)
//   Z020  the same at 0.20 (the whole board, far out: the board is tall enough that the outer limit lies below 0.20, so the seam lands on 0.20 exactly)
//   Z400  the same at 4.00 (the inner limit: one card roughly fills the stage)
//   MUT   Z400 plus a synthetic 24 ms burn on every beforeinput (1.5 frames: a latency is quantised to the 16.7 ms frame, so a 12 ms burn moved the median only ~5 ms on Actions): the mutant that must FAIL the bar
// Each arm: the same nine-card board re-seeded through the app's seam at the Desk (a route with no flush handler), opened, scaled through the camera's own seam (window.wrizoFluxZoomTo), the card
// centred, double-clicked open, the editor focused, then 44 keys one every 90 ms, the latency of each read IN the page as rhizome-latency and flux3-latency read it (keydown -> the second animation
// frame after its beforeinput). The arm order rotates each round; one discarded warm-up. 1920x1080, Page: Dark, Draft not involved (a board).
// VERDICTS (flux3-latency's bar, UNCHANGED; judged against the control's OWN spread):
//   L-zoom@S   at each scale: the arm's pooled median <= C's + C's median spread, p95 <= C's + C's p95 spread, no key over 100 ms       (a TIMING line: it gates on the box, information on Actions)
//   D2         the real layer damps while she types: its own canvas drew in at most one frame per round (the one in flight at the first key), at every scale
//   MUT-z      the burn landed on every key (a count: gates everywhere), lifted the median by >= 8 ms (a timing line) and FAILS the bar (on the box; on Actions only the landing gates)
//   SPLIT      information: median / p95 for C, Z100, Z020, Z400, and each zoomed arm's difference from Z100 (the zoom's own share, apart from Flux's)
//   Premises   each arm stood where it claims (theme, flag, the measured scale, the editor focused), >= 40 keys painted per arm-round, every typed character reached the card, B the build
// COST READING (Nov 14, Fable): the clock cannot see a cost smaller than a frame (the per-key print, Actions run 43626167023: a 24 ms burn on every key made the median FALL, 47.2 -> 29.3, the burn eating the frame wait),
//   so each arm is ALSO judged on lib/l-method.mjs's second reading, per key BUSY + FRAME, against the control's spread CAPPED (CAP_MED / CAP_P95); a control over the cap makes the run VOID. The clock lines stay and still gate.
//   MUT-z is judged on the cost reading (the two clock assertions are parked where they stood); MUT5 / MUT10 are l-method's +5 / +10 ms burns on the control page. DIAG / DIAG-KEYS / DIAG-COST print every key and every round (information).
// RULED Nov 14, 12:24 pm (Fable): THE GATE is the zoom against Z100 (Z020 and Z400, the clock and the cost reading, the control's own spread, the cost capped at 8 / 12 ms, a control over the cap VOID); it gates flux-zoom-1's merge.
//   The three Flux arms against the Arbor control (L-zoom@ / L-zoom-cost@ lines marked INFORMATION) are bug #102, Flux's own cost in the card editor: they gate nothing here.
//   MUT5 / MUT10 / MUT24 are planted at the SAME place (the control page, a synchronous burn on beforeinput capture after the meter); MUTS-ORDER asserts their lifts of the cost median rise with the burn (else the run is not valid);
//   PROBE-SEES prints the smallest burn the probe sees (caught, with a lift of at least twice the allowance; 5 ms only with a quiet control). MUT (24 ms at 4.00) is the zoom bar's own mutant, judged against Z100.
// FLUX3_ROUNDS=<n> (default 4). Run: node scripts/harness/flux3-latency-zoom.mjs   (from apps/desktop; a box turn - this is a timing file; on Actions its timing lines are information)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { isOnBox, timingGate } from '../lib/timing-gate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ROUNDS = Math.max(3, Number(process.env.FLUX3_ROUNDS || 4));
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
const CAP_MED = 8, CAP_P95 = 12;   // PROVISIONAL (Fable confirms before any box turn): half a frame on the median, three quarters on the p95
const costOf = (r) => (r.ks || []).filter((k) => k[3] != null && k[6] != null).map((k) => k[3] + k[6]);
function judgeCost(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(costOf(r)).median), cP95s = cRounds.map((r) => stat(costOf(r)).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap(costOf)), X = stat(xRounds.flatMap(costOf));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const quiet = spreadMed <= CAP_MED && spreadP95 <= CAP_P95;
  const allowMed = Math.min(spreadMed, CAP_MED), allowP95 = Math.min(spreadP95, CAP_P95);
  const within = X.median <= C.median + allowMed && X.p95 <= C.p95 + allowP95;
  return { enough, quiet, within, pass: enough && quiet && within, caught: enough && quiet && !within, C, X, spreadMed, spreadP95, allowMed, allowP95 };
}

const CYCLE = 'the signal holds while she writes on ';
const ARMS = {
  C: { theme: 'plateau', flag: false, scale: null, burn: false },
  Z100: { theme: 'flux', flag: true, scale: 1, burn: false },
  Z020: { theme: 'flux', flag: true, scale: 0.2, burn: false },
  Z400: { theme: 'flux', flag: true, scale: 4, burn: false },
  MUT: { theme: 'flux', flag: true, scale: 4, burn: BURN_MS },
  MUT5: { theme: 'plateau', flag: false, scale: null, burn: 5 },
  MUT10: { theme: 'plateau', flag: false, scale: null, burn: 10 },
  MUT24: { theme: 'plateau', flag: false, scale: null, burn: BURN_MS },
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
    let landed = null;
    if (arm.scale != null && arm.scale !== 1) { landed = await ev(`window.wrizoFluxZoomTo(${arm.scale})`); await sleep(1000); }
    // the card centred in the frame (a scroll is a pan), then opened for editing
    await ev(`(() => { const wrap = document.querySelector('.board-canvas-wrap'), e = document.querySelector('.board-box[data-box-id="f3-d"]'); if (!wrap || !e) return; const r = e.getBoundingClientRect(), w = wrap.getBoundingClientRect(); wrap.scrollLeft += (r.left + r.width / 2) - (w.left + wrap.clientWidth / 2); wrap.scrollTop += (r.top + r.height / 2) - (w.top + wrap.clientHeight / 2); })()`);
    await sleep(900);
    const b = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"f3-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
    if (b) await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    await sleep(IDLE_MS);
    const where = await ev(`(() => { const root = document.documentElement, cv = document.querySelector('.board-canvas'), cr = cv && cv.getBoundingClientRect(), ed = document.querySelector('.board-popup-editor');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
      return { theme: root.getAttribute('data-theme'), flag: new URLSearchParams(location.search).get('flux3'), layer: document.querySelectorAll('[data-flux3-layer]').length,
        scale: cr && cv.offsetWidth ? cr.width / cv.offsetWidth : null, focused: !!ed && document.activeElement === ed, before: ed ? ed.textContent.length : -1,
        served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null, instrument: !!window.__f3z }; })()`);
    // the meter (flux3-latency's, verbatim in method: keydown -> the second animation frame after its beforeinput). DIAG (Nov 14): the same listeners also stamp, per key, the points inside that
    // interval (beforeinput, the first frame, the second frame) and the l-method's BUSY reading (keydown -> the end of the task that handled the key), and an Event Timing observer lists
    // each event's input delay and processing; nothing below changes what the clock measures, it only writes down where the time went.
    await ev(`(() => {
      window.__lat = []; window.__ks = []; window.__et = []; let t0 = 0, cur = null;
      if (window.__latOff) window.__latOff();
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__et.push([e.name, e.startTime, e.processingStart, e.processingEnd, e.duration]); }).observe({ type: 'event', durationThreshold: 16 }); } catch (e) { /* no Event Timing: the DIAG says so */ }
      const kd = () => { t0 = performance.now(); cur = { kd: t0, bi: null, f1: null, f2: null, busy: null, frame: null, b0: null, b1: null }; window.__ks.push(cur); };
      const bi = () => { const t = t0, k = cur; if (k) k.bi = performance.now() - t; requestAnimationFrame(() => { const r = performance.now(); if (k) k.f1 = r - t; const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - r; mc.port1.close(); }; mc.port2.postMessage(0); requestAnimationFrame(() => { const now = performance.now(); if (k) k.f2 = now - t; window.__lat.push({ ms: now - t, key: t, at: now }); }); }); };
      const inp = () => { const k = cur; if (!k || k.busy !== null || k.posted) return; k.posted = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - k.kd; mc.port1.close(); }; mc.port2.postMessage(0); };
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
        ks: window.__ks.map((k) => [k.bi, k.f1, k.f2, k.busy, k.b0, k.b1, k.frame].map((x) => (x == null ? null : Math.round(x * 10) / 10))), et: window.__et.map((e) => e.map((x) => (typeof x === 'number' ? Math.round(x * 10) / 10 : x))) };
    })()`);
    return { name, round, where, landed, typed: typed.length, ...got };
  };

  // warm-up (discarded), then the rounds, the arm order rotating each round
  await runArm('C', 0);
  const order = ['C', 'Z100', 'Z020', 'Z400', 'MUT', 'MUT5', 'MUT10', 'MUT24'];
  const res = { C: [], Z100: [], Z020: [], Z400: [], MUT: [], MUT5: [], MUT10: [], MUT24: [] };
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = order.slice((round - 1) % order.length).concat(order.slice(0, (round - 1) % order.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }
  const all = Object.values(res).flat();

  // ---- premises
  const placed = all.filter((r) => {
    const a = ARMS[r.name], w = r.where;
    const scaleOk = a.scale == null ? true : (w.scale != null && Math.abs(w.scale - a.scale) <= (a.scale === 1 ? 0.003 : 0.002 * a.scale + 0.001));
    return w.theme === a.theme && (a.flag ? w.flag === '1' && w.layer === 1 : w.flag === null && w.layer === 0) && scaleOk && w.focused && w.instrument;
  });
  ok(`P1 every arm stood where it claims (C: Arbor, no flag, no layer; Z: Flux, ?flux3=1, the one layer, the camera at 1.00 / 0.20 / 4.00 as MEASURED on the canvas; the card editor focused; the instrument in place): ${placed.length}/${all.length}`,
    placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 3).map((r) => ({ arm: r.name, round: r.round, where: r.where, landed: r.landed }))));
  const thin = all.filter((r) => r.lat.length < MIN_KEYS);
  ok(`P5 at least ${MIN_KEYS} keys painted in every arm-round (${KEYS} typed each)`, thin.length === 0, JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round, n: r.lat.length }))));
  const lost = all.filter((r) => r.after - r.where.before !== r.typed);
  ok('P6 no key was dropped: in every arm-round the card editor grew by exactly the characters typed', lost.length === 0, JSON.stringify(lost.slice(0, 4).map((r) => ({ arm: r.name, round: r.round, grew: r.after - r.where.before, typed: r.typed }))));

  // ---- DIAG (Nov 14, Fable: "print every key's latency in the mutant arm, and its minimum"). Information only: no check hangs on it.
  //   clock = keydown -> the second frame (the verdict's own reading); bi = keydown -> beforeinput; f1 = -> the first frame; busy = -> the end of the key's task (the l-method's COST reading, first half);
  //   b0/b1 = where the burn started and ended, measured from the keydown; "burn-out" = a clock sample under the burn's own length (that key's burn was left out of its sample).
  const med = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
  const mx = (xs) => { const s = xs.filter((x) => x != null); return s.length ? Math.max(...s) : null; };
  const mn = (xs) => { const s = xs.filter((x) => x != null); return s.length ? Math.min(...s) : null; };
  for (const name of Object.keys(res)) {
    const ks = res[name].flatMap((r) => r.ks || []), col = (i) => ks.map((k) => k[i]), lat = res[name].flatMap((r) => r.lat);
    const bm = ARMS[name].burn || 0, burnOut = lat.filter((x) => x < bm).length;
    const kdE = res[name].flatMap((r) => (r.et || []).filter((e) => e[0] === 'keydown')), inE = res[name].flatMap((r) => (r.et || []).filter((e) => e[0] === 'beforeinput' || e[0] === 'input'));
    const delay = kdE.map((e) => e[2] - e[1]), proc = kdE.map((e) => e[3] - e[2]), dur = kdE.map((e) => e[4]);
    console.log(`DIAG ${name}: ${lat.length} keys | clock min ${r1(mn(lat))} med ${r1(med(lat))} max ${r1(mx(lat))} (under the burn's ${bm} ms: ${burnOut}) | bi med ${r1(med(col(0)))} f1 med ${r1(med(col(1)))} f2 med ${r1(med(col(2)))} busy med ${r1(med(col(3)))} max ${r1(mx(col(3)))}`
      + ` | burn b0 med ${r1(med(col(4)))} b1 med ${r1(med(col(5)))} b1 max ${r1(mx(col(5)))} | f1 minus b1 med ${r1(med(ks.map((k) => (k[1] != null && k[5] != null ? k[1] - k[5] : null))))} f2 minus f1 med ${r1(med(ks.map((k) => (k[2] != null && k[1] != null ? k[2] - k[1] : null))))}`
      + ` | Event Timing: keydown n ${kdE.length}, input delay med ${r1(med(delay))} max ${r1(mx(delay))}, processing med ${r1(med(proc))} max ${r1(mx(proc))}, duration med ${r1(med(dur))} max ${r1(mx(dur))}, >= 48 ms ${dur.filter((x) => x >= 48).length}; beforeinput/input entries ${inE.length}`);
  }
  for (const name of ['C', 'Z400', 'MUT']) for (const r of res[name]) {
    console.log(`DIAG-KEYS ${name} r${r.round} clock=${JSON.stringify(r.lat.map(r1))} min ${r1(mn(r.lat))}`);
    if (name === 'MUT') console.log(`DIAG-KEYS ${name} r${r.round} burn b0-b1=${JSON.stringify(r.ks.map((k) => [k[4], k[5]]))} f1=${JSON.stringify(r.ks.map((k) => k[1]))} f2=${JSON.stringify(r.ks.map((k) => k[2]))}`);
  }

  // ---- the verdicts
  const cRounds = res.C.map((r) => `${r1(stat(r.lat).median)}/${r1(stat(r.lat).p95)}`).join(' ');
  for (const [name, label] of [['Z100', '1.00'], ['Z020', '0.20'], ['Z400', '4.00']]) {
    const j = judge(res.C, res[name]);
    info(`L-zoom@${label} (Flux vs the Arbor control) typing into a card at ${label} adds no latency beyond the control's own spread: ${name} median ${r1(j.X.median)} <= C ${r1(j.C.median)} + ${r1(j.spreadMed)}, p95 ${r1(j.X.p95)} <= C ${r1(j.C.p95)} + ${r1(j.spreadP95)}, no key over ${MAX_MS} ms (max ${r1(j.X.max)})`,
      j.lat, `C ${show(j.C)} | ${name} ${show(j.X)} | C per round median/p95 ${cRounds}`);
    ok(`D2@${label} the real layer damps while she types at ${label}: its own canvas drew in ${j.xLayer} frame(s) while the keys landed (allowed ${res[name].length}, the one in flight at the first key, per round)`,
      j.layerDamp, JSON.stringify(res[name].map((r) => ({ round: r.round, typingFrames: r.frames, layerDrew: r.layerFrames }))));
  }
  const S = Object.fromEntries(Object.keys(res).map((k) => [k, stat(res[k].flatMap((r) => r.lat))]));
  const d = (k) => `${r1(S[k].median - S.Z100.median) >= 0 ? '+' : ''}${r1(S[k].median - S.Z100.median)}/${r1(S[k].p95 - S.Z100.p95) >= 0 ? '+' : ''}${r1(S[k].p95 - S.Z100.p95)}`;
  ok(`SPLIT (information) median/p95 ms: C Arbor ${r1(S.C.median)}/${r1(S.C.p95)} | Z100 ${r1(S.Z100.median)}/${r1(S.Z100.p95)} | Z020 ${r1(S.Z020.median)}/${r1(S.Z020.p95)} (vs Z100 ${d('Z020')}) | Z400 ${r1(S.Z400.median)}/${r1(S.Z400.p95)} (vs Z100 ${d('Z400')})`, true, '');
  // the mutant: the burn landed on every key, and the bar sees it
  const m = judge(res.C, res.MUT);
  const burnLanded = res.MUT.length > 0 && res.MUT.every((r) => r.burned >= MIN_KEYS);
  ok(`MUT-z premise: the ${BURN_MS} ms burn landed on every key (${res.MUT.map((r) => r.burned).join('/')} keys burned)`, burnLanded, JSON.stringify(res.MUT.map((r) => ({ round: r.round, burned: r.burned }))));
  // PARKED (Nov 14, SUPERSEDED): the two assertions below read the CLOCK and the per-key print (Actions run 43626167023) falsified them: the burn lands on every key (min 28.4 ms, none under 24) yet the clock FELL
  // (MUT 29.3 vs Z400 47.2), because the burn eats the frame wait; the clock cannot see a cost smaller than a frame (bug #40's blind spot). Originals verbatim; the live successors read the COST reading, further down.
  // timing(`MUT-z effect the burn lifted the median by >= 8 ms (MUT ${r1(S.MUT.median)} vs Z400 ${r1(S.Z400.median)}: +${r1(S.MUT.median - S.Z400.median)})`, S.MUT.median >= S.Z400.median + 8, JSON.stringify({ mut: show(S.MUT), z400: show(S.Z400) }));
  // ok(`MUT-z the burn FAILS the bar (caught by L: ${m.lat ? 'no' : 'YES'}) - MUT median ${r1(m.X.median)} p95 ${r1(m.X.p95)} max ${r1(m.X.max)}`, burnLanded && (ON_BOX ? !m.lat : true), `C ${show(m.C)} | MUT ${show(m.X)}`);   // on Actions only the landing gates: L is a timing line
  // SUCCESSOR (Nov 14): the same questions asked of the COST reading, where a burn is visible (the clock absorbs it in the frame wait: Actions run 43626167023, MUT clock 29.3 vs Z400 47.2, no key under 24 ms)
  const costS = Object.fromEntries(Object.keys(res).map((k) => [k, stat(res[k].flatMap(costOf))]));
  const cj = {}; for (const k of Object.keys(res)) cj[k] = judgeCost(res.C, res[k]);
  const quietJ = cj.C;   // the control against itself: its spread is the allowance, so `quiet` is the control's own
  const costPerRound = (k) => res[k].map((r) => `${r1(stat(costOf(r)).median)}/${r1(stat(costOf(r)).p95)}`).join(' ');
  console.log(`DIAG-COST per round median/p95: C ${costPerRound('C')} | Z100 ${costPerRound('Z100')} | Z020 ${costPerRound('Z020')} | Z400 ${costPerRound('Z400')} | MUT5 ${costPerRound('MUT5')} | MUT10 ${costPerRound('MUT10')} | MUT ${costPerRound('MUT')}`);
  ok(`SPLIT-COST (information) cost median/p95 ms: C Arbor ${r1(costS.C.median)}/${r1(costS.C.p95)} | Z100 ${r1(costS.Z100.median)}/${r1(costS.Z100.p95)} | Z020 ${r1(costS.Z020.median)}/${r1(costS.Z020.p95)} | Z400 ${r1(costS.Z400.median)}/${r1(costS.Z400.p95)} | C+5 ${r1(costS.MUT5.median)}/${r1(costS.MUT5.p95)} | C+10 ${r1(costS.MUT10.median)}/${r1(costS.MUT10.p95)} | Z400+${BURN_MS} ${r1(costS.MUT.median)}/${r1(costS.MUT.p95)}`, true, '');
  timing(`VOID-check the control is quiet enough to judge anything: its cost spread (median ${r1(quietJ.spreadMed)}, p95 ${r1(quietJ.spreadP95)}) is within the cap (${CAP_MED} / ${CAP_P95}); over the cap the run is VOID`, quietJ.quiet, `C cost ${show(quietJ.C)} | per round ${costPerRound('C')}`);
  for (const [name, label] of [['Z100', '1.00'], ['Z020', '0.20'], ['Z400', '4.00']]) {
    const j = cj[name];
    info(`L-zoom-cost@${label} (Flux vs the Arbor control) typing into a card at ${label} adds no main-thread cost beyond the control's own spread (capped): ${name} cost median ${r1(j.X.median)} <= C ${r1(j.C.median)} + ${r1(j.allowMed)}, p95 ${r1(j.X.p95)} <= C ${r1(j.C.p95)} + ${r1(j.allowP95)}`,
      j.pass, `C ${show(j.C)} | ${name} ${show(j.X)} | spread ${r1(j.spreadMed)}/${r1(j.spreadP95)} cap ${CAP_MED}/${CAP_P95} quiet ${j.quiet}`);
  }
  // THE GATE (RULED Nov 14, 12:24 pm, Fable): the zoom is judged against Z100 (Flux at true size), so the zoom's OWN share is apart from Flux's; this gates flux-zoom-1's merge. The three Flux arms against the Arbor control
  // (the lines above) are information: that gap is bug #102, the new Flux's own cost in the card editor.
  const zq = judgeCost(res.Z100, res.Z100);
  timing(`VOID-check Z100, the zoom's control, is quiet enough to judge anything: its cost spread (median ${r1(zq.spreadMed)}, p95 ${r1(zq.spreadP95)}) is within the cap (${CAP_MED} / ${CAP_P95}); over the cap the run is VOID`, zq.quiet, `Z100 cost ${show(zq.C)} | per round ${costPerRound('Z100')}`);
  for (const [name, label] of [['Z020', '0.20'], ['Z400', '4.00']]) {
    const jc = judge(res.Z100, res[name]);
    timing(`L-zoom-gate@${label} the zoom adds no latency beyond Flux's own at true size (the clock): ${name} median ${r1(jc.X.median)} <= Z100 ${r1(jc.C.median)} + ${r1(jc.spreadMed)}, p95 ${r1(jc.X.p95)} <= Z100 ${r1(jc.C.p95)} + ${r1(jc.spreadP95)}, no key over ${MAX_MS} ms (max ${r1(jc.X.max)})`, jc.lat, `Z100 ${show(jc.C)} | ${name} ${show(jc.X)}`);
    const k = judgeCost(res.Z100, res[name]);
    timing(`L-zoom-cost-gate@${label} the zoom adds no main-thread cost beyond Flux's own at true size (capped): ${name} cost median ${r1(k.X.median)} <= Z100 ${r1(k.C.median)} + ${r1(k.allowMed)}, p95 ${r1(k.X.p95)} <= Z100 ${r1(k.C.p95)} + ${r1(k.allowP95)}`, k.pass, `Z100 ${show(k.C)} | ${name} ${show(k.X)} | spread ${r1(k.spreadMed)}/${r1(k.spreadP95)} cap ${CAP_MED}/${CAP_P95} quiet ${k.quiet}`);
  }
  const cz = judgeCost(res.Z100, res.MUT);   // the zoom bar's own mutant: the burn at 4.00, judged against Z100 as the gate judges
  const mutLanded = (k) => res[k].length > 0 && res[k].every((r) => r.burned >= MIN_KEYS);
  for (const [k, ms] of [['MUT5', 5], ['MUT10', 10], ['MUT24', BURN_MS]]) ok(`${k} premise: the ${ms} ms burn landed on every key of the control page (${res[k].map((r) => r.burned).join('/')} keys burned)`, mutLanded(k), JSON.stringify(res[k].map((r) => ({ round: r.round, burned: r.burned }))));
  timing(`MUT-z effect (cost) the ${BURN_MS} ms burn lifted the cost median by >= 8 ms (MUT ${r1(costS.MUT.median)} vs Z400 ${r1(costS.Z400.median)}: +${r1(costS.MUT.median - costS.Z400.median)})`, costS.MUT.median >= costS.Z400.median + 8, JSON.stringify({ mut: show(costS.MUT), z400: show(costS.Z400) }));
  timing(`MUT-z-cost the ${BURN_MS} ms burn FAILS the zoom bar, judged against Z100 (caught: ${cz.caught ? 'YES' : 'no'}) - MUT cost median ${r1(cz.X.median)} p95 ${r1(cz.X.p95)}`, mutLanded('MUT') && cz.caught, `C ${show(cz.C)} | MUT ${show(cz.X)}`);
  for (const [k, ms] of [['MUT5', 5], ['MUT10', 10], ['MUT24', BURN_MS]]) timing(`${k}-cost a ${ms} ms burn on the control page FAILS the cost bar (caught: ${cj[k].caught ? 'YES' : 'no'}) - cost median ${r1(cj[k].X.median)} vs C ${r1(cj[k].C.median)} + ${r1(cj[k].allowMed)}, p95 ${r1(cj[k].X.p95)} vs C ${r1(cj[k].C.p95)} + ${r1(cj[k].allowP95)}`, mutLanded(k) && cj[k].caught, `C ${show(cj[k].C)} | ${k} ${show(cj[k].X)}`);
  // the three mutants, PLANTED AT THE SAME PLACE (the control page, a synchronous burn on beforeinput capture, installed after the meter): their lifts of the control's cost median must come out in order, or the run is not valid
  const lift = (k) => costS[k].median - costS.C.median;
  const l5 = lift('MUT5'), l10 = lift('MUT10'), l24 = lift('MUT24');
  timing(`MUTS-ORDER the three mutants lift the control's cost median in order, +5 ms -> +${r1(l5)}, +10 ms -> +${r1(l10)}, +${BURN_MS} ms -> +${r1(l24)} (the run is NOT VALID unless the lifts rise with the burn)`, l5 < l10 && l10 < l24,
    JSON.stringify({ c: show(costS.C), m5: show(costS.MUT5), m10: show(costS.MUT10), m24: show(costS.MUT24) }));
  // what the probe can see: a burn counts as SEEN when the bar catches it AND its lift is at least twice the allowance (so 5 ms is seen only with a quiet control)
  const seen = [['MUT5', 5], ['MUT10', 10], ['MUT24', BURN_MS]].filter(([k]) => cj[k].caught && lift(k) >= 2 * cj[k].allowMed).map(([, ms]) => ms);
  const seesLine = `PROBE-SEES this probe sees a burn of ${seen.length ? Math.min(...seen) + ' ms or more' : 'NOTHING'} on the card editor (seen = caught by the cost bar with a lift of at least twice the allowance; the control's spread is ${r1(cj.C.spreadMed)} / ${r1(cj.C.spreadP95)}, the allowance ${r1(cj.C.allowMed)} / ${r1(cj.C.allowP95)}; lifts +5 -> ${r1(l5)}, +10 -> ${r1(l10)}, +${BURN_MS} -> ${r1(l24)}; 5 ms counts only with a quiet control)`;
  console.log(seesLine);
  ok(`${seesLine} (information)`, true, '');

  // ---- the build
  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served.size === 1 && served.has(BUILD.bundle) && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-LATENCY-ZOOM VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-LATENCY-ZOOM VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
