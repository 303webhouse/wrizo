// FLUX3 S1 PREP - THE DRAWING LAYER'S OWN CHECKS (Fable, Nov 4: "Build the Flux drawing layer (links, electrons, the ground) as a standalone module
// carrying data-flux3-layer, plus its checks ... Test it on a harness page with fixture nodes. It must draw lighter than S0's stand-in.")
// The module: apps/desktop/src/flux3/flux3-layer.ts. It is not mounted in the app yet (S1 mounts it on the Schema after #13's BoardEditor split), so
// this file loads the module's OWN SOURCE, type-stripped by vite's esbuild (the transform the app build uses), onto a fixture page: a blank document
// with 12 real DOM nodes and 15 links, a selected node, a draggable node, ctrl+wheel zoom and an editable node body - the board's inputs, nothing else.
//
// Fable's rules (Oct 31, after S0) and the checks that hold the layer to them:
//   D2-KEYS / D2-ZOOM  rule 1, damping = hold the still frame: ZERO draw calls on the layer's canvases while keys land (first key to last)
//        and while the view zooms (first wheel to last). (D2-DRAG, zero during a drag, is PARKED: see the drag ruling below.) Read by an outside instrument (every 2D draw
//        call is wrapped and timestamped, and attributed by `[data-flux3-layer] canvas`), never by the layer's word. Premises: the layer was animating
//        just before each act, the act really happened (keys reached the node, the node moved, the zoom changed), the held frame followed the zoom by
//        a CSS transform, and after the writer settles the layer draws again at the new view.
//   INTERVAL  rule 2, the frame budget is an interval: at rest, full motion (the selected node's electrons, the moving dashes, the ground's current),
//        the median frame interval <= the control's median x 1.10, ON THE BOX. The control is the same fixture page with no layer. Rounds interleave
//        the arms (the order rotates, one discarded warm-up). On a hosted runner (GITHUB_ACTIONS) the numbers print as information: the rule is the box's.
//   SEE  the INTERVAL rule can see a heavy layer: S0's stand-in (copied verbatim from flux3-latency.mjs), judged by the same rule on the same page,
//        fails it (box only; information on Actions).
//   LIGHTER  the layer draws lighter than S0's stand-in: fewer draw calls per second, and a median frame interval no worse.
//   HIDDEN  rule 3: while the window is hidden the layer makes no draw call and runs NO frame loop (zero rAF callbacks), and it resumes when shown.
//        Headless Chrome's tab is never really hidden, so the document's visibility state is overridden and `visibilitychange` dispatched: the browser
//        keeps offering frames, which is exactly what makes a layer that ignores the event visible here.
//   STILL  the law's still frame: under prefers-reduced-motion (emulated) the layer draws the frame once and then makes no draw call and runs no loop;
//        it resumes when the emulation clears.
//   P    premises: the layer carries data-flux3-layer and aria-hidden, takes no pointer, sits under the nodes (the node is what is under a node's
//        centre), and animates at rest; the control drew nothing.
//   MUT-DAMP / MUT-HIDDEN / MUT-STILL  red-first, each a landed source mutant (the anchor is found exactly once in the source and replaced; the mutated
//        source is what loads): the damping gate always open, the hidden gate always false, the reduced-motion read removed. Each must fail its check.
//   B    the build: the module's md5, whether it is committed and clean, the tree. Printed as a BUILD line.
//
// THE DRAG RULING (Fable, Nov 4): "while a card is dragged, its links FOLLOW it, redrawing only that card's links (no electrons, no ground, no
// animation); a link left behind reads as broken. ZERO draws while keys land stays absolute. Add a frame-budget check during a drag."
//   DRAG-ONLY  press to release: no ground draw, no drawImage (electrons, current), the motion canvas touched only by the drag-start redraw (<= 6 calls),
//        and the follow canvas drawing. The instrument attributes each call to its canvas (0 ground, 1 motion, 2 follow) and its method.
//   FOLLOW  after 30 moves the follow canvas has ink where the n10-n11 link meets n11 now, and neither canvas has ink where it met n11 before;
//        read from the canvases' pixels, not the layer's word.
//   D2-HOLD  the pointer held still mid-drag for 1 s: zero draw calls and zero rAF callbacks.   RESUME-DRAG  the following resumes after keys settle.
//   D2-KEYS-IN-DRAG  12 keys mid-drag, each followed by a move (the card keeps moving): zero draw calls from the first key to the last.
//   SETTLE-DRAG-FULL  after the release the full frame carries the moved links and the follow canvas is 0x0 again.
//   DRAG-BUDGET  rounds of a 120-move drag in three arms: the layer's median frame interval press-to-release <= the control's x 1.10, on the box.
//   SEE-DRAG  S0's stand-in undamped through the drag fails the same rule (box only).   MUT-FOLLOW / MUT-KEYGATE  the follow gate shut, and deaf to keys.
//   PARKED (HARNESS_PARKED=1): D2-DRAG, P-LAYER (two canvases), MUT-DAMP (its drag leg) - quoted verbatim with their successors. The count is 3.
//
// FLUX3_SHOTS=<dir> writes frames of the fixture with the layer: both tones at 1920 and 1366, and the still frame. FLUX3_ROUNDS=<n> (default 4).
// Run: node scripts/harness/flux3-layer.mjs   (from apps/desktop; a box turn - this is a timing file)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const SRC = path.resolve(here, '..', '..', 'src', 'flux3', 'flux3-layer.ts');
const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const ROUNDS = Math.max(3, Number(process.env.FLUX3_ROUNDS || 4));
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const VIEW = [1920, 1080];
const REST_MS = 3000, SETTLE_MS = 1500, KEYS = 44, MIN_KEYS = 40, GAP = 90;
const LOAD = { traces: 300, electrons: 120, busyMs: 600 }; // S0's stand-in, as S0 ran it

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const parked = [];
const ok =(name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const info = (name, detail) => checks.push({ name, pass: true, detail, info: true });

// ---- the build this run uses ---------------------------------------------------------------------------------------------------------------------
const SOURCE = fs.readFileSync(SRC, 'utf8');
function buildIdentity() {
  // the md5 is of the LF text, so the box (CRLF checkout) and a hosted runner (LF) print the same number for the same commit
  const out = { md5: crypto.createHash('md5').update(SOURCE.replace(/\r\n/g, '\n')).digest('hex').slice(0, 12), head: null, fileCommit: null, dirty: null };
  try {
    const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    out.head = git('rev-parse', '--short=8', 'HEAD');
    out.fileCommit = git('log', '-1', '--format=%h', '--', 'apps/desktop/src/flux3/flux3-layer.ts') || null;
    out.dirty = git('status', '--porcelain', '--', 'apps/desktop/src/flux3/flux3-layer.ts').length > 0;
  } catch { /* git unavailable: B fails on the nulls */ }
  return out;
}
const BUILD = buildIdentity();
console.log(`BUILD: tree=${BUILD.head} module=src/flux3/flux3-layer.ts md5=${BUILD.md5} lastCommit=${BUILD.fileCommit} dirty=${BUILD.dirty} transform=vite.transformWithEsbuild machine=${ON_BOX ? 'box' : 'actions'}`);

// ---- the module, as source, and its landed mutants -------------------------------------------------------------------------------------------------
const MUTANTS = {
  DAMP: ['return this.held || performance.now() < this.busyUntil;', 'return false;'],
  HIDDEN: ["return typeof document !== 'undefined' && document.hidden;", 'return false;'],
  STILL: ['return !this.opts.motion || !!this.mq?.matches;', 'return !this.opts.motion;'],
  // Nov 4, the drag ruling: the follow gate shut (the links stay behind), and the follow gate deaf to keys
  FOLLOW: ['return this.held && performance.now() >= this.stillUntil;', 'return false;'],
  KEYGATE: ['return this.held && performance.now() >= this.stillUntil;', 'return this.held;'],
};

// the drag's verdicts, read from one drag record (the real module's, or a mutant's)
function dragVerdict(d) {
  const w = d.whatDrag || {}, A = d.A || {}, sum = (o, f) => Object.entries(o || {}).reduce((a, [k, v]) => a + (f(k) ? v : 0), 0);
  const ground = sum(w, (k) => k.startsWith('0:')), images = sum(w, (k) => k.endsWith(':drawImage')), motion = sum(w, (k) => k.startsWith('1:')), follow = sum(w, (k) => k.startsWith('2:'));
  const only = d.during > 0 && ground === 0 && images === 0 && motion <= 6 && follow > 0 && d.groundDuring === 0;
  const strokesA = sum(A.what, (k) => k === '2:stroke');
  const follow1 = !!A.inkNew && A.inkNew.ink > 0 && !!A.inkOld && A.inkOld.ink === 0 && !A.inkOld.out && !!A.inkOldFollow && A.inkOldFollow.ink === 0 && strokesA >= 10;
  const B = d.B || {}, C = d.C || {}, E = d.E || {};
  return {
    only, onlyDetail: `press to release: ${d.during} calls - ground ${ground}, drawImage ${images}, motion canvas ${motion} (<= 6: the drag-start redraw), follow canvas ${follow}; ground draws by the layer's count ${d.groundDuring}`,
    follow: follow1, followDetail: `after 30 moves: ink at the link's new end ${A.inkNew && A.inkNew.ink}/${A.inkNew && A.inkNew.px} px, where n11-n12 left it ${A.inkOld && A.inkOld.ink} (motion) + ${A.inkOldFollow && A.inkOldFollow.ink} (follow); follow strokes ${strokesA} (>= 10); layer's count: ${A.followFrames} follow frames, ${A.bases} drag-start redraw(s)`,
    hold: B.calls === 0 && B.cbs === 0 && B.frames > 30,
    keys: C.keys === 12 && C.movedDuring > 0 && C.calls === 0,
    resume: sum(E.what, (k) => k.startsWith('2:')) > 0,
  };
}
const count = (s, sub) => s.split(sub).length - 1;
async function compile(src) {
  const r = await transformWithEsbuild(src, 'flux3-layer.ts', { format: 'iife', globalName: '__flux3mod', target: 'es2020' });
  return `${r.code}\nwindow.__flux3mod = __flux3mod; true;`;
}
const CODE = { real: await compile(SOURCE) };
const LANDED = {};
for (const [k, [anchor, rep]] of Object.entries(MUTANTS)) {
  LANDED[k] = count(SOURCE, anchor) === 1;
  CODE[k] = LANDED[k] ? await compile(SOURCE.replace(anchor, rep)) : null;
}

// ---- the outside instrument (installed before the layer, in every arm alike) -----------------------------------------------------------------------
const INSTRUMENT = `(() => {
  if (window.__f3i) return true;
  const I = window.__f3i = { frames: [], calls: 0, cbMs: 0, cbs: 0, layer: 0, other: {}, layerAt: [], layerWhat: [] };
  // which of the layer's canvases a call landed on: 0 the ground, 1 the motion, 2 the follow canvas (a drag's links); 's' the stand-in
  const which = (cv) => (cv.classList && cv.classList.contains('flux3-standin') ? 's' : cv.parentElement ? Array.prototype.indexOf.call(cv.parentElement.children, cv) : '?');
  const LAYER = 'canvas.flux3-standin, canvas[data-flux3-layer], [data-flux3-layer] canvas';
  const label = (cv) => { try { return String(cv.className || (cv.parentElement && cv.parentElement.className) || (cv.isConnected ? 'canvas' : 'offscreen')).slice(0, 40); } catch { return 'canvas'; } };
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) {
      I.calls += 1;
      const cv = this.canvas;
      if (cv && cv.matches && cv.matches(LAYER)) { I.layer += 1; if (I.layerAt.length < 400000) { I.layerAt.push(performance.now()); I.layerWhat.push(which(cv) + ':' + m); } }
      else { const k = cv ? label(cv) : 'offscreen'; I.other[k] = (I.other[k] || 0) + 1; }
      return o.apply(this, a);
    };
  }
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => { const t0 = performance.now(); I.cbs += 1; try { cb(ts); } finally { I.cbMs += performance.now() - t0; } });
  let last = performance.now();
  const tick = () => {
    const now = performance.now(), ks = Object.keys(I.other);
    I.frames.push([now, now - last, I.calls, I.cbMs, I.layer, ks.length ? ks.join('+') : null, I.cbs]);
    I.calls = 0; I.cbMs = 0; I.layer = 0; I.other = {}; I.cbs = 0; last = now;
    if (I.frames.length > 40000) I.frames.splice(0, 20000);
    raf(tick);
  };
  raf(tick);
  return true;
})()`;

// ---- S0's stand-in drawing layer, verbatim from flux3-latency.mjs (the "lighter than" reference) ---------------------------------------------------
function standIn(mutant, opts) {
  const stage = document.querySelector('.mode-stage') || document.body;
  const c = document.createElement('canvas');
  c.className = 'flux3-standin';
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;';
  stage.prepend(c);
  const ctx = c.getContext('2d');
  let W = 0, H = 0;
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = Math.round(W * d); c.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); };
  size();
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const traces = Array.from({ length: opts.traces }, () => {
    const x0 = rnd() * W, y0 = rnd() * H, x1 = rnd() * W, y1 = rnd() * H, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const pts = rnd() < 0.5 ? [[x0, y0], [mx, y0], [mx, y1], [x1, y1]] : [[x0, y0], [x0, my], [x1, my], [x1, y1]];
    const seg = [0, 1, 2].map((i) => Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]));
    return { pts, seg, L: seg[0] + seg[1] + seg[2], a: (0.25 + rnd() * 0.35).toFixed(3) };
  });
  const electrons = Array.from({ length: opts.electrons }, (_, i) => ({ tr: traces[(i * 7) % traces.length], ph: rnd(), v: 0.12 + rnd() * 0.2 }));
  const along = (tr, f) => {
    let d = f * tr.L;
    for (let i = 0; i < 3; i++) { if (d <= tr.seg[i]) { const u = tr.seg[i] ? d / tr.seg[i] : 0, a = tr.pts[i], b = tr.pts[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; } d -= tr.seg[i]; }
    return tr.pts[3];
  };
  const draw = (t) => {
    ctx.fillStyle = '#020c10'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(8,40,72,.55)'); g.addColorStop(1, 'rgba(1,8,17,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(29,74,82,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0.5; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0.5; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.setLineDash([6, 5]); ctx.lineDashOffset = -(t / 60) % 11; ctx.lineWidth = 1.4;
    for (const tr of traces) { ctx.strokeStyle = `rgba(0,194,255,${tr.a})`; ctx.beginPath(); ctx.moveTo(tr.pts[0][0], tr.pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(tr.pts[i][0], tr.pts[i][1]); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(87,208,245,.35)';
    for (const tr of traces) { const a = tr.pts[0], b = tr.pts[3]; ctx.fillRect(a[0] - 2, a[1] - 2, 4, 4); ctx.fillRect(b[0] - 2, b[1] - 2, 4, 4); }
    ctx.fillStyle = '#00C2FF'; ctx.shadowColor = '#00C2FF'; ctx.shadowBlur = 10;
    for (const e of electrons) { const q = along(e.tr, ((t / 1000) * e.v + e.ph) % 1); ctx.fillRect(q[0] - 3, q[1] - 3, 6, 6); }
    ctx.shadowBlur = 0;
  };
  const S = { mutant, drawn: 0, held: 0 };
  window.__f3s = S;
  let lastAct = -1e9, dragging = false, raf = 0;
  const act = () => { lastAct = performance.now(); };
  const onDown = () => { dragging = true; act(); };
  const onUp = () => { dragging = false; act(); };
  const onWheel = (e) => { if (e.ctrlKey) act(); };
  const busy = () => dragging || performance.now() - lastAct < opts.busyMs;
  const frame = (t) => { raf = requestAnimationFrame(frame); if (!mutant && busy()) { S.held += 1; return; } draw(t); S.drawn += 1; };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const pause = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const onVis = () => (document.hidden ? pause() : start());
  document.addEventListener('keydown', act, true);
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('pointerup', onUp, true);
  document.addEventListener('pointercancel', onUp, true);
  document.addEventListener('wheel', onWheel, { capture: true, passive: true });
  document.addEventListener('visibilitychange', onVis);
  draw(performance.now()); // the still frame, there before the motion starts
  if (!document.hidden) start();
  return true;
}

// ---- the fixture page: real DOM nodes on a plane, the board's inputs, and (per arm) the layer or the stand-in ------------------------------------------
function fixture(cfg) {
  const dark = cfg.tone !== 'light';
  const ground = dark ? '#020c10' : '#F7FAFA';
  document.documentElement.style.cssText = 'margin:0;height:100%;';
  document.body.style.cssText = `margin:0;height:100%;overflow:hidden;background:${ground};font:13px/1.4 system-ui,sans-serif;`;
  document.body.innerHTML = '';
  const stage = document.createElement('div');
  stage.id = 'stage';
  stage.style.cssText = 'position:fixed;inset:0;overflow:hidden;';
  const plane = document.createElement('div');
  plane.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;z-index:1;';
  stage.append(plane);
  document.body.append(stage);
  const cols = [40, 420, 800, 1180], rows = [40, 330, 620];
  const nodes = [];
  rows.forEach((y, r) => cols.forEach((x, c) => nodes.push({ id: `n${r * 4 + c + 1}`, x, y, w: 240, h: 150 })));
  const links = [[1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [7, 8], [2, 6], [6, 10], [9, 10], [10, 11], [11, 12], [4, 8], [8, 12], [3, 7]].map(([a, b]) => ({ a: `n${a}`, b: `n${b}` }));
  const selected = 'n6';
  const W = innerWidth, H = innerHeight, s0 = Math.min(1, W / 1560, H / 860);
  const view = { s: s0, tx: (W - 1420 * s0) / 2, ty: (H - 770 * s0) / 2 };
  const els = {};
  const place = (n) => { const e = els[n.id]; e.style.left = `${n.x}px`; e.style.top = `${n.y}px`; };
  for (const n of nodes) {
    const e = document.createElement('div');
    e.className = 'fx-node';
    e.dataset.id = n.id;
    const sel = n.id === selected;
    e.style.cssText = `position:absolute;width:${n.w}px;height:${n.h}px;box-sizing:border-box;background:${dark ? 'rgba(14,30,49,.92)' : '#FFFFFF'};color:${dark ? '#E3F1EC' : '#0E1C24'};border:1px solid ${sel ? '#00C2FF' : dark ? '#1D4A52' : '#B7C9CC'};${sel ? 'box-shadow:0 0 0 1px #00C2FF;' : ''}user-select:none;`;
    const hd = document.createElement('div');
    hd.className = 'fx-hd';
    hd.textContent = `NODE 0x${(parseInt(n.id.slice(1), 10) * 2749).toString(16).toUpperCase().padStart(4, '0')} · TEXT`;
    hd.style.cssText = `padding:6px 10px;font:600 11px/1 system-ui;letter-spacing:.14em;color:${dark ? '#6E958D' : '#4F6B70'};border-bottom:1px dashed rgba(0,194,255,.25);cursor:grab;`;
    const bd = document.createElement('div');
    bd.className = 'fx-body';
    bd.textContent = 'He wrote the crossings in pencil and the weather in ink.';
    bd.style.cssText = 'padding:8px 10px;height:96px;overflow:hidden;outline:none;';
    if (n.id === 'n7') { bd.contentEditable = 'true'; bd.style.userSelect = 'text'; bd.style.caretColor = '#FF9800'; }
    e.append(hd, bd);
    plane.append(e);
    els[n.id] = e;
    place(n);
  }
  const FX = window.__fx = { nodes, links, selected, view, els, keys: [], downs: [], ups: [], wheels: [], wrapT: [], layer: null, arm: cfg.arm };
  const applyView = () => { plane.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`; };
  applyView();
  const scene = () => ({ nodes: nodes.map((n) => ({ ...n })), links, selected });
  addEventListener('keydown', () => FX.keys.push(performance.now()), true);
  // the board's inputs: drag a node by its header, ctrl+wheel zooms about the pointer, a plain wheel pans
  let drag = null;
  plane.addEventListener('pointerdown', (e) => {
    const hd = e.target.closest && e.target.closest('.fx-hd');
    FX.downs.push(performance.now());
    if (!hd) return;
    const n = nodes.find((q) => q.id === hd.parentElement.dataset.id);
    drag = { n, x: e.clientX, y: e.clientY, nx: n.x, ny: n.y };
  });
  addEventListener('pointermove', (e) => {
    if (!drag || !e.buttons) return;
    drag.n.x = drag.nx + (e.clientX - drag.x) / view.s;
    drag.n.y = drag.ny + (e.clientY - drag.y) / view.s;
    place(drag.n);
    if (FX.layer) FX.layer.setScene(scene());
  });
  addEventListener('pointerup', () => { FX.ups.push(performance.now()); drag = null; });
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    FX.wheels.push(performance.now());
    if (e.ctrlKey) {
      const k = Math.exp(-e.deltaY * 0.0015), s = Math.max(0.1, Math.min(4, view.s * k)), kk = s / view.s;
      view.tx = e.clientX - (e.clientX - view.tx) * kk; view.ty = e.clientY - (e.clientY - view.ty) * kk; view.s = s;
    } else { view.tx -= e.deltaX; view.ty -= e.deltaY; }
    applyView();
    if (FX.layer) { FX.layer.setView({ ...view }); FX.wrapT.push(FX.layer.el.firstChild.style.transform || ''); }
  }, { passive: false });
  if (cfg.arm === 'layer') {
    FX.layer = new window.__flux3mod.FluxLayer(stage, { tone: cfg.tone });
    FX.layer.setView({ ...view });
    FX.layer.setScene(scene());
  } else if (cfg.arm === 'standin') {
    // eslint-disable-next-line no-new-func
    (new Function('mutant', 'opts', `return (${cfg.standIn})(mutant, opts);`))(!!cfg.undamped, cfg.load);
  }
  return true;
}

// ---- statistics ---------------------------------------------------------------------------------------------------------------------------------------
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const show = (st) => `median ${r1(st.median)} p95 ${r1(st.p95)} (n ${st.n})`;

let PAGE_N = 0;
try { await withHarness(async (app) => {
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  let curView = VIEW;
  const ev = (expr) => app.evalJs(expr);
  // a fresh document per arm: a unique data: URL is a new document every time (no state, no app, no other rAF user)
  async function load(arm, { tone = 'dark', code = CODE.real, view = VIEW, undamped = false } = {}) {
    PAGE_N += 1;
    await app.cdp('Page.navigate', { url: `data:text/html,<!doctype html><title>flux3 fixture ${PAGE_N}</title>` });
    await sleep(300);
    for (let i = 0; i < 30 && !(await ev(`document.title === ${JSON.stringify(`flux3 fixture ${PAGE_N}`)} && document.readyState === 'complete'`)); i += 1) await sleep(100);
    if (view[0] !== curView[0] || view[1] !== curView[1]) { await app.emulateDpr(1, view[0], view[1]); curView = view; }
    await ev(INSTRUMENT);
    if (arm === 'layer') await ev(code);
    await ev(`(${fixture.toString()})(${JSON.stringify({ arm, tone, standIn: standIn.toString(), load: LOAD, undamped })})`);
  }
  // the layer's calls in a window, by canvas and method ('1:stroke' = a stroke on the motion canvas)
  const layerWhatIn = (a, b) => ev(`(() => { const I = window.__f3i, o = {}; I.layerAt.forEach((x, i) => { if (x >= ${a} && x <= ${b}) o[I.layerWhat[i]] = (o[I.layerWhat[i]] || 0) + 1; }); return o; })()`);
  const sumWhere = (o, f) => Object.entries(o || {}).reduce((a, [k, v]) => a + (f(k) ? v : 0), 0);
  // a real drag, by the mouse: press at p, then each step moves by (dx, dy) 16ms apart
  const press = (p) => app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
  const moveTo = (x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, pointerType: 'mouse' });
  const release = (x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
  const headerOf = (id) => ev(`(() => { const r = window.__fx.els.${id}.querySelector('.fx-hd').getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 }; })()`);
  // the n10 -> n11 link's end at n11 (route(): n11 right of n10 -> the end is n11's left edge, at its middle), in layer pixels
  const linkEnd = (nodeJs) => `(() => { const v = window.__fx.layer.stats().view, n = ${nodeJs}; return { x: n.x * v.s + v.tx, y: (n.y + n.h / 2) * v.s + v.ty }; })()`;
  // ink on a layer canvas: alpha > 0 within a strip that ends at (x, y) and runs `len` px back along the link's last (horizontal) leg
  const inkAt = (idx, x, y, len = 16) => ev(`(() => { const cv = window.__fx.layer.el.querySelectorAll('canvas')[${idx}]; if (!cv || !cv.width) return { px: 0, ink: 0 };
    const d = cv.width / (parseFloat(cv.style.width) || cv.width), ox = parseFloat(cv.style.left) || 0, oy = parseFloat(cv.style.top) || 0;
    const x0 = Math.max(0, Math.round((${x} - ${len} - ox) * d)), y0 = Math.max(0, Math.round((${y} - 2 - oy) * d)), w = Math.round(${len} * d), h = Math.round(5 * d);
    if (x0 + w > cv.width || y0 + h > cv.height || w <= 0 || h <= 0) return { px: 0, ink: 0, out: true };
    const a = cv.getContext('2d').getImageData(x0, y0, w, h).data; let ink = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 0) ink += 1;
    return { px: w * h, ink }; })()`);
  // the instrument's records since `t0` (page clock)
  const since = (t0, t1 = 1e15) => ev(`(() => { const I = window.__f3i; const fr = I.frames.filter((f) => f[0] > ${t0} && f[0] <= ${t1});
    return { dts: fr.map((f) => f[1]), cbMs: fr.map((f) => f[3]), layerFrames: fr.filter((f) => f[4] > 0).length, layerCalls: fr.reduce((a, f) => a + f[4], 0),
      cbs: fr.reduce((a, f) => a + f[6], 0), others: [...new Set(fr.map((f) => f[5]).filter(Boolean))], frames: fr.length,
      at: I.layerAt.filter((x) => x >= ${t0} && x <= ${t1}).length }; })()`);
  const now = () => ev('performance.now()');
  const layerCallsIn = (a, b) => ev(`window.__f3i.layerAt.filter((x) => x >= ${a} && x <= ${b}).length`);

  // ---- 1. INTERVAL / SEE / LIGHTER: rounds of three arms at rest (control, layer, S0's stand-in) -------------------------------------------------
  const ARMS = ['control', 'layer', 'standin'];
  const rest = { control: [], layer: [], standin: [] };
  const order = (r) => ARMS.map((_, i) => ARMS[(i + r) % ARMS.length]);
  const restRead = async (arm) => {
    await load(arm);
    await sleep(SETTLE_MS);
    const t0 = await now();
    await sleep(REST_MS);
    return since(t0);
  };
  await restRead('control'); // the discarded warm-up
  for (let r = 0; r < ROUNDS; r += 1) for (const arm of order(r)) rest[arm].push(await restRead(arm));
  const pool = (arm, k) => rest[arm].flatMap((x) => x[k]);
  const C = stat(pool('control', 'dts')), L = stat(pool('layer', 'dts')), S = stat(pool('standin', 'dts'));
  const perSec = (arm, k) => rest[arm].reduce((a, x) => a + x[k], 0) / ((rest[arm].length * REST_MS) / 1000);
  const lCalls = perSec('layer', 'layerCalls'), sCalls = perSec('standin', 'layerCalls'), cCalls = perSec('control', 'layerCalls');
  const lFramesPerSec = perSec('layer', 'layerFrames');
  const limit = C.median * 1.1;
  ok('P-CONTROL the control drew nothing on any canvas', cCalls === 0 && rest.control.every((x) => !x.others.length), `control layer calls/s ${r1(cCalls)}, other canvases ${JSON.stringify([...new Set(rest.control.flatMap((x) => x.others))])}`);
  ok('P-ANIMATES the layer animated at rest (full motion: dashes, the selected node\'s electrons, the current)', lFramesPerSec >= 20, `${r1(lFramesPerSec)} drawing frames/s (>= 20; it draws at 30 Hz)`);
  const intervalDetail = `layer ${show(L)} vs control ${show(C)}: limit ${r1(limit)} ms (control x 1.10)`;
  if (ON_BOX) ok('INTERVAL rule 2: at rest, the layer\'s median frame interval is within 10% of the control\'s (the box)', L.median <= limit, intervalDetail);
  else info('INTERVAL (information: a hosted runner; rule 2 is judged on the box)', `${intervalDetail} -> ${L.median <= limit ? 'within' : 'OVER'}`);
  const seeDetail = `S0 stand-in ${show(S)} vs limit ${r1(limit)}`;
  if (ON_BOX) ok('SEE the interval rule can see a heavy layer: S0\'s stand-in, judged by the same rule, fails it', S.median > limit, seeDetail);
  else info('SEE (information: a hosted runner)', `${seeDetail} -> ${S.median > limit ? 'over (seen)' : 'within'}`);
  ok('LIGHTER the layer draws lighter than S0\'s stand-in: fewer draw calls per second and a median frame interval no worse',
    lCalls < sCalls && L.median <= S.median, `draw calls/s layer ${r1(lCalls)} vs stand-in ${r1(sCalls)}; interval median layer ${r1(L.median)} vs stand-in ${r1(S.median)}`);
  const lCb = stat(pool('layer', 'cbMs')), sCb = stat(pool('standin', 'cbMs'));
  info('COST (information) per frame at 1920x1080, at rest, full motion', `rAF time layer ${show(lCb)} | stand-in ${show(sCb)}; frame interval p95 layer ${r1(L.p95)} / stand-in ${r1(S.p95)} / control ${r1(C.p95)}`);

  // ---- 1b. DRAG-BUDGET / SEE-DRAG (Fable, Nov 4: "Add a frame-budget check during a drag"): the same rule as at rest, read while a card is dragged.
  // Each read: a fresh page, n11 dragged back and forth by its header for DRAG_MOVES moves 16ms apart; the frame intervals from press to release.
  // Arms: the control (no layer), the layer (its links follow), and S0's stand-in undamped (its own mutant flag: the full scene redrawn every frame
  // through the drag) - the heavy drawing the rule must be able to see. Rounds interleave and rotate, after a discarded warm-up.
  const DRAG_MOVES = 120;
  const DARMS = ['control', 'layer', 'standinU'];
  const drag = { control: [], layer: [], standinU: [] };
  const dragRead = async (arm) => {
    await load(arm === 'standinU' ? 'standin' : arm, { undamped: arm === 'standinU' });
    await sleep(SETTLE_MS);
    const p = await headerOf('n11');
    const d0 = await ev('window.__fx.downs.length'), u0 = await ev('window.__fx.ups.length'), x0 = await ev('window.__fx.nodes[10].x');
    await press(p);
    let x = p.x;
    for (let i = 0; i < DRAG_MOVES; i += 1) { x += (Math.floor(i / 30) % 2 ? -6 : 6); await moveTo(x, p.y + (i % 30)); await sleep(16); }
    await release(x, p.y);
    const down = (await ev(`window.__fx.downs.slice(${d0})`))[0], up = (await ev(`window.__fx.ups.slice(${u0})`))[0];
    const r = down && up ? await since(down, up) : { dts: [], at: -1 };
    const what = down && up && arm === 'layer' ? await layerWhatIn(down, up) : null;
    const span = await ev(`window.__fx.nodes[10].x - ${x0}`);
    return { dts: r.dts, calls: r.at, what, ok: !!down && !!up, span };
  };
  await dragRead('control'); // the discarded warm-up
  for (let r = 0; r < ROUNDS; r += 1) for (const arm of DARMS.map((_, i) => DARMS[(i + r) % DARMS.length])) drag[arm].push(await dragRead(arm));
  const DC = stat(drag.control.flatMap((x) => x.dts)), DL = stat(drag.layer.flatMap((x) => x.dts)), DS = stat(drag.standinU.flatMap((x) => x.dts));
  const dLimit = DC.median * 1.1;
  const dFollow = drag.layer.reduce((a, x) => a + sumWhere(x.what, (k) => k.startsWith('2:')), 0);
  ok('P-DRAG-BUDGET every read was a real drag (pressed and released, the card moved), and the layer\'s links followed in each',
    Object.values(drag).every((xs) => xs.every((x) => x.ok)) && drag.layer.every((x) => sumWhere(x.what, (k) => k.startsWith('2:')) > 0) && DS.n > 0,
    `layer follow-canvas calls ${dFollow} over ${drag.layer.length} drags; stand-in undamped layer calls ${drag.standinU.map((x) => x.calls).join('/')}`);
  const dDetail = `layer ${show(DL)} vs control ${show(DC)}: limit ${r1(dLimit)} ms (control x 1.10)`;
  if (ON_BOX) ok('DRAG-BUDGET during a drag, the layer\'s median frame interval is within 10% of the control\'s (the box)', DL.median <= dLimit, dDetail);
  else info('DRAG-BUDGET (information: a hosted runner; the rule is judged on the box)', `${dDetail} -> ${DL.median <= dLimit ? 'within' : 'OVER'}`);
  const dsDetail = `S0 stand-in undamped ${show(DS)} vs limit ${r1(dLimit)}`;
  if (ON_BOX) ok('SEE-DRAG the drag budget can see heavy drawing: S0\'s stand-in, undamped through the drag, fails it', DS.median > dLimit, dsDetail);
  else info('SEE-DRAG (information: a hosted runner)', `${dsDetail} -> ${DS.median > dLimit ? 'over (seen)' : 'within'}`);

  // ---- 2. the layer's acts: premises, D2 (keys, drag, zoom), HIDDEN, STILL - on the real module, then on each mutant ------------------------------
  async function acts(code, which) {
    const out = {};
    await load('layer', { code });
    await sleep(SETTLE_MS);
    if (which.includes('premise')) {
      out.premise = await ev(`(() => { const L = window.__fx.layer, el = L.el, cs = getComputedStyle(el), r = window.__fx.els.n1.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { marker: el.hasAttribute('data-flux3-layer'), aria: el.getAttribute('aria-hidden'), pe: cs.pointerEvents, canvases: el.querySelectorAll('canvas').length,
          underNodes: !!(top && top.closest('.fx-node')), state: L.stats().state, box: L.stats().box }; })()`);
    }
    // keys: into the editable node, focused without a pointer (a click would itself be an act)
    if (which.includes('keys')) {
      await ev(`(() => { const b = window.__fx.els.n7.querySelector('.fx-body'); b.focus(); const s = getSelection(); s.selectAllChildren(b); s.collapseToEnd(); return true; })()`);
      await sleep(SETTLE_MS);
      const tBefore = await now();
      await sleep(500);
      const before = await layerCallsIn(tBefore, tBefore + 500);
      const len0 = await ev(`window.__fx.els.n7.querySelector('.fx-body').textContent.length`);
      const k0 = await ev('window.__fx.keys.length');
      const CYCLE = 'the signal holds while she writes on ';
      for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[i % CYCLE.length]); await sleep(GAP); }
      const ks = await ev(`window.__fx.keys.slice(${k0})`);
      const len1 = await ev(`window.__fx.els.n7.querySelector('.fx-body').textContent.length`);
      const during = ks.length ? await layerCallsIn(ks[0], ks[ks.length - 1]) : -1;
      await sleep(1200);
      const t2 = await now();
      await sleep(600);
      const after = await layerCallsIn(t2, t2 + 600);
      out.keys = { before, keys: ks.length, landed: len1 - len0, during, after };
    }
    // drag (Fable, Nov 4: the links FOLLOW the dragged card; zero draws while keys land stays absolute). One press of n11's header, then:
    //   A. 30 moves (7px, 2px) 16ms apart - the links follow;  B. the pointer held still 1 s - nothing draws;
    //   C. 12 keys, each followed by a 5px move - nothing draws from the first key to the last;  D. 900 ms held (the keys settle);
    //   E. 15 more moves - the following resumes;  then release.
    if (which.includes('drag')) {
      await sleep(SETTLE_MS);
      const p = await headerOf('n11');
      const nx = await ev('window.__fx.nodes[10].x');
      // "left behind" is read where the moved card's OLD links ran and its new ones never do: the start of the n11 -> n12 link at n11's old
      // right edge. (The n10 -> n11 link's old path lies under its new first leg - n11 moves right - so ink there is the new link, not a ghost.)
      const oldEnd = await ev(`(() => { const v = window.__fx.layer.stats().view, n = window.__fx.nodes[10]; return { x: (n.x + n.w) * v.s + v.tx + 16, y: (n.y + n.h / 2) * v.s + v.ty }; })()`);
      const tBefore = await now();
      await sleep(500);
      const before = await layerCallsIn(tBefore, tBefore + 500);
      const st0 = await ev('window.__fx.layer.stats()');
      const d0 = await ev('window.__fx.downs.length'), u0 = await ev('window.__fx.ups.length'), k0 = await ev('window.__fx.keys.length');
      await press(p);
      let x = p.x, y = p.y;
      for (let i = 1; i <= 30; i += 1) { x += 7; y += 2; await moveTo(x, y); await sleep(16); }
      await sleep(60);
      const tA = await now();
      const newEnd = await ev(linkEnd('window.__fx.nodes[10]'));
      const inkNew = await inkAt(2, newEnd.x, newEnd.y);
      const inkOld = await inkAt(1, oldEnd.x, oldEnd.y);
      const inkOldFollow = await inkAt(2, oldEnd.x, oldEnd.y);
      if (SHOTS && which.includes('shots')) fs.writeFileSync(path.join(SHOTS, 's1-layer-dark-1920-drag.png'), Buffer.from(await app.screenshot(), 'base64'));
      const tB0 = await now();
      await sleep(1000);
      const tB1 = await now();
      const xC0 = await ev('window.__fx.nodes[10].x');
      for (let i = 0; i < 12; i += 1) { await app.typeKeys('k'); x += 5; await moveTo(x, y); await sleep(40); }
      const ks = await ev(`window.__fx.keys.slice(${k0})`);
      const xC1 = await ev('window.__fx.nodes[10].x');
      await sleep(900);
      const tE0 = await now();
      for (let i = 1; i <= 15; i += 1) { x += 6; y -= 1; await moveTo(x, y); await sleep(16); }
      await sleep(60);
      const tE1 = await now();
      await release(x, y);
      const down = (await ev(`window.__fx.downs.slice(${d0})`))[0], up = (await ev(`window.__fx.ups.slice(${u0})`))[0];
      const during = down && up ? await layerCallsIn(down, up) : -1;
      const whatDrag = down && up ? await layerWhatIn(down, up) : {};
      const whatA = down ? await layerWhatIn(down, tA) : {};
      const quietB = await since(tB0 + 50, tB1);
      const keysIn = ks.length ? await layerCallsIn(ks[0], ks[ks.length - 1]) : -1;
      const whatE = await layerWhatIn(tE0, tE1);
      const st1 = await ev('window.__fx.layer.stats()');
      const moved = await ev(`window.__fx.nodes[10].x - ${nx}`);
      await sleep(1200);
      const t2 = await now();
      await sleep(600);
      const after = await layerCallsIn(t2, t2 + 600);
      const emptied = await ev(`(() => { const c = window.__fx.layer.el.querySelectorAll('canvas')[2]; return !!c && c.width === 0 && c.height === 0; })()`);
      const settledEnd = await ev(linkEnd('window.__fx.nodes[10]'));
      const inkSettled = await inkAt(1, settledEnd.x, settledEnd.y);
      out.drag = {
        before, during, moved: r1(moved), after, pressed: !!down, released: !!up, whatDrag,
        A: { what: whatA, inkNew, inkOld, inkOldFollow, followFrames: st1.followFrames - st0.followFrames, bases: st1.followBases - st0.followBases },
        B: { calls: quietB.at, cbs: quietB.cbs, frames: quietB.frames },
        C: { keys: ks.length, calls: keysIn, movedDuring: r1(xC1 - xC0) },
        E: { what: whatE },
        settle: { after, emptied, inkSettled }, groundDuring: st1.groundDraws - st0.groundDraws,
      };
    }
    // zoom: 20 ctrl+wheel notches, 50ms apart, about the board's middle
    if (which.includes('zoom')) {
      await sleep(SETTLE_MS);
      const tBefore = await now();
      await sleep(500);
      const before = await layerCallsIn(tBefore, tBefore + 500);
      const s0 = await ev('window.__fx.view.s'), w0 = await ev('window.__fx.wheels.length');
      for (let i = 0; i < 20; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 960, y: 540, deltaX: 0, deltaY: i < 10 ? -40 : 25, modifiers: 2, pointerType: 'mouse' }); await sleep(50); }
      const ws = await ev(`window.__fx.wheels.slice(${w0})`);
      const during = ws.length ? await layerCallsIn(ws[0], ws[ws.length - 1]) : -1;
      const wrapT = await ev(`window.__fx.wrapT.slice(-${ws.length || 1})`);
      const s1 = await ev('window.__fx.view.s');
      await sleep(1200);
      const t2 = await now();
      await sleep(600);
      const after = await layerCallsIn(t2, t2 + 600);
      const settled = await ev(`(() => { const v = window.__fx.view, d = window.__fx.layer.stats().view; return { same: Math.abs(v.s - d.s) < 1e-9 && Math.abs(v.tx - d.tx) < 1e-6 && Math.abs(v.ty - d.ty) < 1e-6, wrap: window.__fx.layer.el.firstChild.style.transform || '' }; })()`);
      out.zoom = { before, wheels: ws.length, during, s0: r1(s0 * 100) / 100, s1: Math.round(s1 * 1000) / 1000, followed: wrapT.filter((x) => x && x !== 'none').length, after, settled };
    }
    // hidden: the document's visibility overridden and the event dispatched; then shown again
    if (which.includes('hidden')) {
      await sleep(SETTLE_MS);
      await ev(`(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); return true; })()`);
      await sleep(300);
      const t0 = await now();
      await sleep(2000);
      const hid = await since(t0, t0 + 2000);
      await ev(`(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); return true; })()`);
      await sleep(400);
      const t1 = await now();
      await sleep(1000);
      const back = await since(t1, t1 + 1000);
      out.hidden = { calls: hid.at, cbs: hid.cbs, frames: hid.frames, resumed: back.at, realVisibility: await ev('document.visibilityState') };
    }
    // still: prefers-reduced-motion emulated, then cleared
    if (which.includes('still')) {
      await sleep(SETTLE_MS);
      const m0 = await ev('window.__fx.layer.stats().motionFrames');
      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await sleep(500);
      const st = await ev('window.__fx.layer.stats()');
      if (SHOTS && which.includes('shots')) fs.writeFileSync(path.join(SHOTS, 's1-layer-dark-1920-still.png'), Buffer.from(await app.screenshot(), 'base64'));
      const t0 = await now();
      await sleep(2000);
      const quiet = await since(t0, t0 + 2000);
      await app.emulateMedia([]);
      await sleep(400);
      const t1 = await now();
      await sleep(1000);
      const back = await since(t1, t1 + 1000);
      out.still = { drewStill: st.motionFrames > m0, state: st.state, calls: quiet.at, cbs: quiet.cbs, resumed: back.at };
    }
    return out;
  }

  const real = await acts(CODE.real, ['premise', 'keys', 'drag', 'zoom', 'hidden', 'still', 'shots']);
  const pr = real.premise || {};
  // P-LAYER (two canvases) is PARKED below (HARNESS_PARKED=1): the drag ruling added a third. Its live successor:
  ok('P-LAYER3 the layer carries data-flux3-layer and aria-hidden, takes no pointer, holds its three canvases (ground, motion, a drag\'s links), and sits under the nodes',
    pr.marker && pr.aria === 'true' && pr.pe === 'none' && pr.canvases === 3 && pr.underNodes, JSON.stringify(pr));
  const k = real.keys || {};
  ok('P-KEYS the keys reached the node, and the layer was drawing just before the first', k.keys >= MIN_KEYS && k.landed >= MIN_KEYS && k.before > 0, JSON.stringify(k));
  ok('D2-KEYS rule 1: ZERO layer draw calls while the keys land (first key to last)', k.during === 0, `${k.during} draw call(s) in the window of ${k.keys} keys`);
  ok('SETTLE-KEYS the layer draws again once she stops', k.after > 0, `${k.after} draw call(s) in 600 ms from 1.2 s after the last key`);
  const d = real.drag || {};
  ok('P-DRAG the node was dragged (pressed, moved, released), and the layer was drawing just before', d.pressed && d.released && d.moved > 100 && d.before > 0, JSON.stringify(d));
  // D2-DRAG (zero draws press to release) is PARKED below: Fable's Nov 4 ruling makes the links follow. Its live successors:
  const dv = dragVerdict(d);
  ok('DRAG-ONLY during a drag the layer draws only the dragged card\'s links: no ground draw, no electron or current (no drawImage), the motion canvas redrawn only at the drag\'s start',
    dv.only, dv.onlyDetail);
  ok('FOLLOW the dragged card\'s links follow it, frame by frame: ink where the n10-n11 link meets the card now, none where the n11-n12 link left it (nothing left behind)',
    dv.follow, dv.followDetail);
  ok('D2-HOLD a pointer held still mid-drag draws nothing and runs no frame loop (no animation)', dv.hold, JSON.stringify(d.B));
  ok('D2-KEYS-IN-DRAG zero draws while keys land stays absolute: keys mid-drag (the card still moving) draw nothing from the first key to the last',
    dv.keys, JSON.stringify(d.C));
  ok('RESUME-DRAG once the keys settle, a drag still under way follows again', dv.resume, JSON.stringify(d.E.what));
  ok('SETTLE-DRAG the layer redraws after the release (the links meet the moved node)', d.after > 0, `${d.after} draw call(s) in 600 ms from 1.2 s after the release`);
  ok('SETTLE-DRAG-FULL after the release the full frame carries the moved links and the follow canvas empties (0x0)',
    d.settle && d.settle.emptied && d.settle.inkSettled.ink > 0, JSON.stringify(d.settle));
  const z = real.zoom || {};
  ok('P-ZOOM the view zoomed (20 ctrl+wheel notches), the held frame followed it by a CSS transform, and the layer was drawing just before',
    z.wheels === 20 && z.s0 !== z.s1 && z.followed > 0 && z.before > 0, JSON.stringify(z));
  ok('D2-ZOOM rule 1: ZERO layer draw calls while the view zooms (first wheel to last)', z.during === 0, `${z.during} draw call(s) across ${z.wheels} wheel notches`);
  ok('SETTLE-ZOOM after the zoom the layer redraws at the new view and drops the transform', z.after > 0 && z.settled && z.settled.same && z.settled.wrap === '', JSON.stringify(z.settled));
  const h = real.hidden || {};
  ok('HIDDEN rule 3: hidden, the layer makes no draw call and runs no frame loop; shown, it resumes',
    h.calls === 0 && h.cbs === 0 && h.frames > 30 && h.resumed > 0, `hidden 2 s: ${h.calls} draw calls, ${h.cbs} rAF callbacks over ${h.frames} offered frames; shown again: ${h.resumed} draw calls in 1 s (headless reports visibilityState '${h.realVisibility}')`);
  const st = real.still || {};
  ok('STILL reduced motion: the layer draws its still frame once, then no draw call and no frame loop; it resumes when the emulation clears',
    st.drewStill && st.state === 'still' && st.calls === 0 && st.cbs === 0 && st.resumed > 0, JSON.stringify(st));

  // ---- red-first: the landed mutants ------------------------------------------------------------------------------------------------------------
  for (const kk of Object.keys(MUTANTS)) ok(`MUT-${kk} premise: the mutant landed (its anchor found exactly once in the source and replaced)`, LANDED[kk], MUTANTS[kk][0]);
  let mdDamp = null;
  if (LANDED.DAMP) {
    const md = await acts(CODE.DAMP, ['keys', 'drag', 'zoom']);
    mdDamp = md;
    // MUT-DAMP's original form (drag caught by "any draw during the drag") is PARKED below; its live successor reads the drag through DRAG-ONLY
    const mv = md.drag ? dragVerdict(md.drag) : null;
    const caught = [md.keys && md.keys.during > 0 ? `keys ${md.keys.during}` : null, mv && !mv.only ? `drag (${mv.onlyDetail})` : null, md.zoom && md.zoom.during > 0 ? `zoom ${md.zoom.during}` : null].filter(Boolean);
    ok('MUT-DAMP2 the damping gate held open fails rule 1 three ways: D2-KEYS and D2-ZOOM see its draw calls, DRAG-ONLY sees it draw more than the dragged card\'s links', caught.length === 3, `caught on: ${caught.join('; ') || 'nothing'}`);
  }
  if (LANDED.FOLLOW) {
    const mf = await acts(CODE.FOLLOW, ['drag']);
    const fv = mf.drag ? dragVerdict(mf.drag) : null;
    ok('MUT-FOLLOW a layer whose links stay behind the dragged card fails FOLLOW', fv && !fv.follow, fv ? fv.followDetail : 'no drag');
  }
  if (LANDED.KEYGATE) {
    const mk = await acts(CODE.KEYGATE, ['drag']);
    const kv = mk.drag ? dragVerdict(mk.drag) : null;
    ok('MUT-KEYGATE a follow that ignores keys fails D2-KEYS-IN-DRAG', kv && !kv.keys && mk.drag.C.keys === 12, mk.drag ? JSON.stringify(mk.drag.C) : 'no drag');
  }
  if (LANDED.HIDDEN) {
    const mh = await acts(CODE.HIDDEN, ['hidden']);
    ok('MUT-HIDDEN a layer that ignores the hidden window fails HIDDEN', mh.hidden && (mh.hidden.calls > 0 || mh.hidden.cbs > 0), JSON.stringify(mh.hidden));
  }
  if (LANDED.STILL) {
    const ms = await acts(CODE.STILL, ['still']);
    ok('MUT-STILL a layer that ignores reduced motion fails STILL', ms.still && (ms.still.calls > 0 || ms.still.cbs > 0), JSON.stringify(ms.still));
  }

  // === PARKED - gated behind HARNESS_PARKED=1, skipped by default. ==================================================================================
  // Fable's ruling, Nov 4: "while a card is dragged, its links FOLLOW it, redrawing only that card's links (no electrons, no ground, no animation);
  // a link left behind reads as broken. ZERO draws while keys land stays absolute." Three checks of 5c9aa855 stopped being true; each is quoted
  // verbatim (name and condition) and re-asserts the new truth under it. Reads the records the live run already made: no extra browser work.
  if (process.env.HARNESS_PARKED === '1') {
    const pok = (name, pass, detail = '') => parked.push({ name, pass: !!pass, detail });
    // ORIGINAL (5c9aa855): ok('D2-DRAG rule 1: ZERO layer draw calls while a node is dragged (press to release)', d.during === 0,
    //   `${d.during} draw call(s) during the drag`);
    pok('PARKED (was "D2-DRAG rule 1: ZERO layer draw calls while a node is dragged (press to release)") - SUPERSEDED Nov 4 (Fable): the dragged card\'s links follow it; live successors DRAG-ONLY, FOLLOW, D2-HOLD, D2-KEYS-IN-DRAG',
      dv.only && dv.follow && dv.hold && dv.keys, `${d.during} draw call(s) during the drag, every one the dragged card's links or the drag-start redraw`);
    // ORIGINAL (5c9aa855): ok('P-LAYER the layer carries data-flux3-layer and aria-hidden, takes no pointer, holds its two canvases, and sits under the nodes',
    //   pr.marker && pr.aria === 'true' && pr.pe === 'none' && pr.canvases === 2 && pr.underNodes, JSON.stringify(pr));
    pok('PARKED (was "P-LAYER the layer carries data-flux3-layer and aria-hidden, takes no pointer, holds its two canvases, and sits under the nodes") - SUPERSEDED Nov 4: a third canvas holds a drag\'s links; live successor P-LAYER3',
      pr.canvases === 3, `${pr.canvases} canvases`);
    // ORIGINAL (5c9aa855): const caught = [..., md.drag && md.drag.during > 0 ? `drag ${md.drag.during}` : null, ...];
    //   ok('MUT-DAMP the damping gate held open fails rule 1 (D2 sees its draw calls)', caught.length === 3, `caught on: ${caught.join(', ') || 'nothing'}`);
    const mv = mdDamp && mdDamp.drag ? dragVerdict(mdDamp.drag) : null;
    pok('PARKED (was "MUT-DAMP the damping gate held open fails rule 1 (D2 sees its draw calls)") - SUPERSEDED Nov 4: a drag now draws by design, so "any draw during the drag" no longer tells the mutant apart; its drag leg reads DRAG-ONLY; live successor MUT-DAMP2',
      !!mv && !mv.only, mv ? mv.onlyDetail : 'the DAMP mutant did not run');
  }

  // ---- frames: both tones at 1920 and 1366 ---------------------------------------------------------------------------------------------------------
  if (SHOTS) {
    for (const [w, hh] of [[1920, 1080], [1366, 768]]) {
      for (const tone of ['dark', 'light']) {
        await load('layer', { tone, view: [w, hh] });
        await sleep(SETTLE_MS + 800);
        fs.writeFileSync(path.join(SHOTS, `s1-layer-${tone}-${w}.png`), Buffer.from(await app.screenshot(), 'base64'));
      }
    }
    await load('standin');
    await sleep(SETTLE_MS);
    fs.writeFileSync(path.join(SHOTS, 's1-s0-standin-1920.png'), Buffer.from(await app.screenshot(), 'base64'));
  }
}); } catch (e) {
  ok('the run completed', false, String(e && e.stack || e).slice(0, 600));
}

ok('B the build: the module is committed and clean, and its md5 is printed', BUILD.head && BUILD.fileCommit && BUILD.dirty === false, `tree ${BUILD.head}, module md5 ${BUILD.md5}, last commit ${BUILD.fileCommit}, dirty ${BUILD.dirty}`);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ': ' + c.detail : ''}`);
const gates = checks.filter((c) => !c.info);
const failed = gates.filter((c) => !c.pass);
console.log(`FLUX3-LAYER VERIFY: ${failed.length ? 'FAIL' : 'PASS'} (${gates.length} checks${failed.length ? `, ${failed.length} failed` : ''})`);
let parkedFailed = 0;
if (process.env.HARNESS_PARKED === '1') {
  for (const c of parked) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ': ' + c.detail : ''}`);
  parkedFailed = parked.filter((c) => !c.pass).length;
  // 3 parks (Nov 4): D2-DRAG, P-LAYER, MUT-DAMP. A count short of 3 is a hole, not a pass.
  const short = parked.length !== 3;
  if (short) parkedFailed += 1;
  console.log(`FLUX3-LAYER PARKED: ${parkedFailed ? 'FAIL' : 'PASS'} (${parked.length} checks of 3${parkedFailed ? `, ${parkedFailed} failed${short ? ' (count short)' : ''}` : ''})`);
}
process.exit(failed.length || parkedFailed ? 1 : 0);
