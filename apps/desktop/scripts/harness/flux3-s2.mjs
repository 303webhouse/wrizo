// FLUX3 S2 - THE STACK + THE HOLOGRAM; SEQUENCE (Fable's S2 go, Nov 5: "CSS 3D transforms on the same nodes (no new renderer); zero draws while keys
// land; the frame budget on the box; the page-rect + card-rect checks; reduced motion = still; <= 3 flashes/s. Frames -> the Wrizors").
// The build: src/flux3/FluxStack.tsx (the Stack, the hologram, the Stack's button), src/flux3/stackView.ts (session-only state), FluxSchema.tsx (the
// level readout, the layer still under the Stack), flux-v3.css (the veil, the dims, Sequence's dress); mount points in components/ShowAs.tsx and
// components/BoardEditor.tsx. The page-rect law keeps its own guard, flux3-page-rect.mjs (S0), and S1's flux3-s1.mjs keeps the Live view's; both run
// beside this file in every S2 proof.
//
// ONE BOARD, seeded through the app's seams (wrizoCreateJournalPage; never raw storage): two lanes (Act I, Act II) with cards ordered by seq, and
// cards no lane names, so the board's own order (what Sequence shows) is B, A, H | C, D | E, F, G, P. Links A-C, B-D, E-F; H a dealt preset step,
// lit; P a doc pin. THE OUTSIDE INSTRUMENT is S1's (every 2D draw call on [data-flux3-layer], rAF frame intervals, key and wheel times), plus readers
// of each card's rect, its style attribute, its computed transform and transition, and a MutationObserver on the centre mark.
//
//   P      flag on: the Stack's button is in Show as (not pressed); OFF: flag off, no Stack button and no Stack mark anywhere.
//   ENTER  the Stack opens: every card is flown (a transform, the Stack's mark), the centre is the first node in the board's order, the level
//          readout says Stack, and the layer is STILL behind (zero draw calls at rest).
//   ORDER  the arrow keys walk the Stack in exactly the order Sequence shows (read from the Sequence view itself, not from this file's seed).
//   SCALE  the centre stands larger than its card, every other node smaller than the centre.
//   HOLO   a click on the centre opens the hologram: the veil is shown, the centre grows again (>= 1.35x), the level says Hologram; the arrow keys
//          flip; Esc closes the hologram, Esc again the Stack.
//   RECT   the card-rect check, 1366 + 1920 x dark + light (4 cells): after a full visit (the Stack, three flips, the hologram, two flips, Esc, Esc)
//          every card's rect AND its style attribute are exactly as before, no Stack mark is left, the stored board is unchanged and no storage key
//          is new (nothing saved); RESUME: the layer draws again (motion is back).
//   HELD   the Stack is a way of looking: a drag on a node swipes (the centre changes) and moves no card; Delete and Backspace delete nothing; a
//          double-click on a side node opens no editor and no hologram.
//   D2-HOLO  zero draws while keys land: a double-click on the hologram's centre is the board's own (the card's editor); 30 keys typed into it land
//          with ZERO layer draw calls, and the words are stored in the card.
//   F      <= 3 flashes a second, measured: arrow keys held for 3 s and 40 wheel notches; the centre changes (each change recorded from the DOM)
//          never more than 3 times in any 1 s; premise: it stepped at least 6 times.
//   STILL  reduced motion = the still state: the Stack opens with no transition (every node's transition 0 s, its transform final at once), the
//          veil changes at once, the layer makes no draw call, and closing gives every node back at once.
//   SEQ    Sequence (the existing Storyboard view, Flux's "Sequence"): every lane's and card's rect is IDENTICAL with the flag on and off (4 cells), the
//          dress is applied under the flag (the lane's bracket, the card's brackets) and absent without it.
//   C      contrast, both tones: the hologram's count (label and value) against the veil, Sequence's lane title against its lane: >= 4.5:1.
//   BUDGET the frame budget, ON THE BOX: swiping the Stack (a key every 400 ms for 4 s), the median frame interval is within 10% of the same keys on the
//          board with the flag off. Rounds interleave the arms, one warm-up. A hosted runner prints it as information.
//   MUT-GATE / MUT-HOLD / MUT-CLEAN / MUT-STILL  red-first, each a LANDED mutant of the served bundle (a pattern matched exactly once in index-*.js,
//          replaced in flight): the centre's rate gate set to 0 (F fails); the Stack's press handler unbound (HELD fails: the drag moves a card); the
//          transform left behind on closing (RECT fails); reduced motion ignored (STILL fails).
//   B      the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src.
//
// FLUX3_SHOTS=<dir> writes the frames (the Stack and the hologram in both tones at 1366 and 1920; Sequence in both tones). FLUX3_ROUNDS=<n> (4).
// Run: node scripts/harness/flux3-s2.mjs   (from apps/desktop; a box turn: BUDGET is a timing check)
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
const BOARD = 'f3s2-board';
const SETTLE_MS = 1500;   // a flight (550 ms) + the stagger (12 x 34 ms) + the restore, with room

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
  const I = window.__f3 = { log: [], frames: [], keys: [], wheels: [], centres: [] };
  const LAYER = '[data-flux3-layer] canvas';
  const which = (cv) => (cv.parentElement ? Array.prototype.indexOf.call(cv.parentElement.children, cv) : -1);
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) {
      const cv = this.canvas;
      if (cv && cv.matches && cv.matches(LAYER) && I.log.length < 600000) I.log.push([performance.now(), which(cv), m]);
      return o.apply(this, a);
    };
  }
  const raf = window.requestAnimationFrame.bind(window);
  let last = performance.now();
  const tick = () => { const now = performance.now(); I.frames.push([now, now - last]); last = now; if (I.frames.length > 40000) I.frames.splice(0, 20000); raf(tick); };
  raf(tick);
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  addEventListener('wheel', () => I.wheels.push(performance.now()), { capture: true, passive: true });
  const rr = (r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
  I.rr = rr;
  I.calls = (t0, t1) => I.log.filter((e) => e[0] >= t0 && e[0] <= t1).length;
  I.st = () => {
    const cards = [...document.querySelectorAll('.board-canvas .board-box')];
    const wrap = document.querySelector('.board-canvas-wrap'), host = wrap ? wrap.parentElement : null;
    const veil = document.querySelector('.flux3-holo'), tab = document.querySelector('[data-flux3-stack-tab]'), lvl = document.querySelector('.flux3-tele-lvl');
    const by = (f) => Object.fromEntries(cards.map((c) => [c.dataset.boxId, f(c)]));
    const centre = cards.find((c) => c.dataset.flux3Stack === 'centre');
    return {
      tab: tab ? tab.getAttribute('aria-pressed') : null, host: host ? host.getAttribute('data-flux3-stack') : null,
      centre: centre ? centre.dataset.boxId : null, marked: cards.filter((c) => c.dataset.flux3Stack).length,
      transformed: cards.filter((c) => getComputedStyle(c).transform !== 'none').length, n: cards.length,
      veil: veil ? { on: veil.dataset.on, op: +getComputedStyle(veil).opacity, vis: getComputedStyle(veil).visibility, dur: getComputedStyle(veil).transitionDuration } : null,
      level: lvl ? lvl.textContent : null,
      rects: by((c) => rr(c.getBoundingClientRect())), styles: by((c) => c.getAttribute('style')), tf: by((c) => getComputedStyle(c).transform),
      dur: by((c) => getComputedStyle(c).transitionDuration), popup: !!document.querySelector('.board-popup-editor'),
      layerOp: (() => { const l = document.querySelector('[data-flux3-layer]'); return l ? +getComputedStyle(l).opacity : null; })(),
    };
  };
  I.watch = () => {
    I.centres = [];
    const cv = document.querySelector('.board-canvas');
    if (I.mo) I.mo.disconnect();
    if (!cv) return false;
    I.mo = new MutationObserver((ms) => { for (const m of ms) { const t = m.target; if (t.dataset && t.dataset.flux3Stack === 'centre' && m.oldValue !== 'centre') I.centres.push([performance.now(), t.dataset.boxId]); } });
    I.mo.observe(cv, { subtree: true, attributes: true, attributeFilter: ['data-flux3-stack'], attributeOldValue: true });
    return true;
  };
  I.seq = () => {
    const lanes = [...document.querySelectorAll('.board-storyboard .board-lane')], cards = [...document.querySelectorAll('.board-storyboard .board-sb-card')];
    const pe = (e, p) => getComputedStyle(e, p);
    return {
      on: !!document.querySelector('.board-storyboard'), order: cards.map((c) => c.dataset.sbCard),
      lanes: lanes.map((l) => rr(l.getBoundingClientRect())), cards: cards.map((c) => rr(c.getBoundingClientRect())),
      laneDress: lanes.length ? pe(lanes[0], '::before').content : null, cardDress: cards.length ? pe(cards[0], '::before').content : null,
      title: (() => { const t = document.querySelector('.board-storyboard .board-lane-title'); if (!t) return null;
        let e = t, bg = 'rgba(0, 0, 0, 0)'; while (e) { const b = getComputedStyle(e).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') { bg = b; break; } e = e.parentElement; }
        return { fg: getComputedStyle(t).color, bg, base: getComputedStyle(document.body).backgroundColor }; })(),
    };
  };
})();`;

// ---- the landed mutants: a pattern matched exactly once in the served index-*.js, replaced in flight (names are the minifier's, so the patterns
// anchor on what the minifier keeps: the numbers, the strings and the property names) ------------------------------------------------------------
const MUTANTS = {
  gate: [/=350,(\w+)=550,/g, '=0,$1=550,'],
  hold: [/\.addEventListener\("pointerdown",(\w+),!0\),(\w+)\.addEventListener\("click",(\w+),!0\),(\w+)\.addEventListener\("dblclick"/g,
    '.addEventListener("f3-mut-nodown",$1,!0),$2.addEventListener("click",$3,!0),$4.addEventListener("dblclick"'],
  clean: [/\.style\.transform="",(\w+)\.style\.transition="",/g, '.style.f3mut="",$1.style.transition="",'],
  still: [/(\w+)!=="still"&&(\w+)\.motion/g, '$1!=="still"&&!0'],
};

const median = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const lum = (c) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const rgba = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
const ratio = (fgS, bgS, baseS) => {
  const base = rgba(baseS); let bg = rgba(bgS); const fg = rgba(fgS);
  if (!fg || !bg || !base) return NaN;
  bg = over(bg, base); const f = over([...fg.slice(0, 3), fg[3]], bg);
  const [x, y] = [lum(f), lum(bg)].sort((p, q) => q - p);
  return +((x + 0.05) / (y + 0.05)).toFixed(2);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const maxIn1s = (ts) => { let m = 0; for (let i = 0; i < ts.length; i += 1) m = Math.max(m, ts.filter((x) => x >= ts[i] && x < ts[i] + 1000).length); return m; };

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const now = () => ev('performance.now()');
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
  const click = async (x, y) => { await app.mouseMove(x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const centreOf = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: r.width, h: r.height }; })()`);
  const cardAt = (id) => centreOf(`.board-box[data-box-id="${id}"]`);
  const st = () => ev('window.__f3.st()');
  const stored = () => ev('JSON.stringify(window.wrizoBoard ? window.wrizoBoard() : null)');
  const lsKeys = () => ev('Object.keys(localStorage).sort()');
  const rest = async (ms = 1200) => { const t0 = await now(); await sleep(ms); return ev(`window.__f3.calls(${t0}, performance.now())`); };

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
        const n = (text.match(from) || []).length;
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
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'f3s2-doc', text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  const T = (id, x, y, z, text, extra = {}) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [
    T('f3-a', 0.05, 0.05, 1, 'Card A', { laneId: 'act1', seq: 2 }), T('f3-b', 0.5, 0.05, 2, 'Card B', { laneId: 'act1', seq: 1 }),
    T('f3-c', 0.05, 0.4, 3, 'Card C', { laneId: 'act2', seq: 1 }), T('f3-d', 0.5, 0.4, 4, 'Card D', { laneId: 'act2', seq: 2 }),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('f3-h', 0.75, 0.05, 8, 'The hook', { deckStep: { deck: 'three-act', step: 'hook' }, lit: true, laneId: 'act1', seq: 3 }),
    { id: 'f3-p', kind: 'page-pin', entryId: 'f3s2-doc', x: 0.75, y: 0.75, w: 0.2, h: 0.15, z: 9 },
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 2600, lanes: [{ id: 'act1', title: 'Act I' }, { id: 'act2', title: 'Act II' }] },
  ];
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Schema S2', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await sleep(500);

  const open = async (flagOn, tone, view = [1920, 1080]) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); })()`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flagOn ? '/?flux3=1' : '/')} + '#/page/${BOARD}')`);
    await app.emulateDpr(1, view[0], view[1]);
    await app.reload();
    await app.waitFor("!!document.querySelector('.show-as')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    if (flagOn) await app.waitFor("!!document.querySelector('[data-flux3-stack-tab]')", { timeout: 8000, label: 'the Stack button' }).catch(() => {});
    await sleep(1200);
  };
  // Show as: a view by its own button (by name, never by index); the mouse then leaves the group, so its words close and no icon has moved
  const pick = async (sel) => {
    const p = await centreOf(sel);
    if (!p) return false;
    await click(p.x, p.y);
    await app.mouseMove(8, 8);
    await sleep(300);
    return true;
  };
  const toLive = async () => { if (await ev("!!document.querySelector('.board-storyboard')")) { await pick('.show-as [data-view="open"]'); await app.waitFor("!!document.querySelector('.board-canvas .board-box')", { timeout: 6000, label: 'Live' }).catch(() => {}); await sleep(900); } };
  const stackOn = async () => { const was = (await st()).tab; await pick('[data-flux3-stack-tab]'); await sleep(SETTLE_MS); return was; };
  const key = async (k, wait = 420) => { await app.key(k); await sleep(wait); };

  // ---- SEQ (and P / OFF): Sequence's rects, flag off vs on, both tones, both widths -------------------------------------------------------------
  const seqReads = {};
  let seqOrder = null, pOn = null, pOff = null;
  for (const tone of TONES) {
    for (const flagOn of [false, true]) {
      await open(flagOn, tone);
      const s0 = await st();
      if (tone === 'dark') { if (flagOn) pOn = s0; else pOff = { ...s0, anyMark: await ev("document.querySelectorAll('[data-flux3-stack]').length") }; }
      await pick('.show-as [data-view="storyboard"]');
      await app.waitFor("!!document.querySelector('.board-storyboard .board-sb-card')", { timeout: 6000, label: 'Sequence' }).catch(() => {});
      await sleep(700);
      for (const view of VIEWS) {
        await app.emulateDpr(1, view[0], view[1]);
        await sleep(600);
        seqReads[`${flagOn ? 'on' : 'off'}|${tone}|${view[0]}`] = await ev('window.__f3.seq()');
        if (flagOn && view[0] === 1920) await snap(`s2-${tone}-1920-sequence`);
      }
      if (!seqOrder && !flagOn) seqOrder = seqReads[`off|${tone}|1920`].order;
      await app.emulateDpr(1, 1920, 1080);
      await toLive();
    }
  }
  ok('P flag on: the Stack\'s button is in Show as, not pressed', pOn && pOn.tab === 'false' && pOn.n === 9, JSON.stringify(pOn && { tab: pOn.tab, n: pOn.n }));
  ok('OFF flag off: no Stack button and no Stack mark anywhere', pOff && pOff.tab === null && pOff.anyMark === 0 && pOff.n === 9, JSON.stringify(pOff && { tab: pOff.tab, marks: pOff.anyMark, n: pOff.n }));
  let seqCells = 0;
  for (const tone of TONES) for (const [w] of VIEWS) {
    const a = seqReads[`off|${tone}|${w}`], b = seqReads[`on|${tone}|${w}`];
    if (!a || !b || !a.on || !b.on) continue;
    seqCells += 1;
    ok(`SEQ [${tone} ${w}] every lane (${a.lanes.length}) and card (${a.cards.length}) keeps its rect with the flag on, in the same order`,
      a.cards.length === 9 && a.lanes.length >= 2 && same(a.lanes, b.lanes) && same(a.cards, b.cards) && same(a.order, b.order),
      JSON.stringify({ lanes: [a.lanes, b.lanes], cards: a.cards.map((r, i) => (same(r, b.cards[i]) ? null : [a.order[i], r, b.cards[i]])).filter(Boolean) }));
  }
  ok(`SEQ coverage: ${seqCells}/4 cells compared`, seqCells === 4);
  const sd = seqReads['on|dark|1920'], so = seqReads['off|dark|1920'];
  ok('SEQ the dress is applied under the flag (the lane\'s bracket, the card\'s brackets) and absent without it',
    sd && so && sd.laneDress && sd.laneDress !== 'none' && sd.cardDress && sd.cardDress !== 'none' && (so.laneDress === 'none' || so.laneDress === null) && so.cardDress === 'none',
    JSON.stringify({ on: sd && [sd.laneDress, sd.cardDress], off: so && [so.laneDress, so.cardDress] }));

  // ---- ENTER / ORDER / SCALE / HOLO, dark 1920 -------------------------------------------------------------------------------------------------
  await open(true, 'dark');
  const pre = await st();
  const wasPressed = await stackOn();
  const s1 = await st();
  const restStack = await rest(1500);
  ok('ENTER the Stack opens: every card flown (a transform, the Stack\'s mark), the centre the first node in the board\'s order, the level says Stack, the button pressed',
    wasPressed === 'false' && s1.tab === 'true' && s1.host === 'stack' && s1.marked === 9 && s1.transformed === 9 && !!seqOrder && s1.centre === seqOrder[0] && s1.level === 'Stack',
    JSON.stringify({ wasPressed, tab: s1.tab, host: s1.host, marked: s1.marked, transformed: s1.transformed, centre: s1.centre, first: seqOrder && seqOrder[0], level: s1.level }));
  ok('ENTER the layer is still behind the Stack (zero draw calls at rest) and dimmed', restStack === 0 && s1.layerOp < 0.5, JSON.stringify({ restStack, layerOp: s1.layerOp }));
  await snap('s2-dark-1920-stack');
  const sc = { centre: s1.centre, flown: s1.rects[s1.centre], home: pre.rects[s1.centre], sides: Object.entries(s1.rects).filter(([id]) => id !== s1.centre).map(([, r]) => r.w) };
  ok('SCALE the centre stands larger than its card, every other node smaller than the centre',
    sc.flown && sc.home && sc.flown.w > sc.home.w * 1.3 && sc.sides.length === 8 && sc.sides.every((w) => w < sc.flown.w), JSON.stringify(sc));
  await ev('window.__f3.watch()');
  for (let i = 0; i < 8; i += 1) await key('ArrowRight');
  const walked = [s1.centre, ...(await ev('window.__f3.centres.map((c) => c[1])'))];
  ok(`ORDER the arrow keys walk the Stack in exactly the order Sequence shows (${(seqOrder || []).join(' ')})`, !!seqOrder && same(walked, seqOrder), JSON.stringify({ walked, seqOrder }));
  for (let i = 0; i < 8; i += 1) await key('ArrowLeft', 360);
  await sleep(500);
  const s2c = await st();
  const before = s2c.rects[s2c.centre];
  const cp = await cardAt(s2c.centre);
  await click(cp.x, cp.y);
  await sleep(1100);
  const h1 = await st();
  ok('HOLO a click on the centre opens the hologram: the veil shown, the centre grown again (>= 1.35x), the level says Hologram',
    h1.host === 'holo' && h1.veil && h1.veil.on === 'true' && h1.veil.op === 1 && h1.veil.vis === 'visible' && h1.centre === s2c.centre && h1.rects[h1.centre].w >= before.w * 1.35 && h1.level === 'Hologram',
    JSON.stringify({ host: h1.host, veil: h1.veil, centre: [s2c.centre, h1.centre], w: [before.w, h1.rects[h1.centre] && h1.rects[h1.centre].w], level: h1.level }));
  await snap('s2-dark-1920-hologram');
  await key('ArrowRight', 700);
  const h2 = await st();
  await key('Escape', 900);
  const h3 = await st();
  await key('Escape', SETTLE_MS);
  const h4 = await st();
  ok('HOLO the arrow keys flip the hologram; Esc closes it (the Stack again), Esc again closes the Stack',
    h2.host === 'holo' && h2.centre === seqOrder[1] && h3.host === 'stack' && h3.veil.on === 'false' && h4.host === null && h4.tab === 'false' && h4.marked === 0 && h4.level !== 'Stack',
    JSON.stringify({ flip: [h2.host, h2.centre], esc1: [h3.host, h3.veil && h3.veil.on], esc2: [h4.host, h4.tab, h4.marked, h4.level] }));

  // ---- RECT: the card-rect check, 4 cells ------------------------------------------------------------------------------------------------------
  const visit = async () => {
    await stackOn();
    for (let i = 0; i < 3; i += 1) await key('ArrowRight');
    const c = await st();
    const p = c.centre ? await cardAt(c.centre) : null;
    if (p) { await click(p.x, p.y); await sleep(900); }
    const holo = (await st()).host;
    await key('ArrowRight'); await key('ArrowRight');
    await key('Escape', 700);
    await key('Escape', SETTLE_MS);
    return holo;
  };
  const rectCell = async (tone, view) => {
    await open(true, tone, view);
    const a = await st(), sA = await stored(), kA = await lsKeys();
    const holo = await visit();
    const b = await st(), sB = await stored(), kB = await lsKeys();
    const resume = await rest(1200);
    const moved = Object.keys(a.rects).filter((id) => !same(a.rects[id], b.rects[id]));
    const restyled = Object.keys(a.styles).filter((id) => a.styles[id] !== b.styles[id]);
    return { holo, n: Object.keys(a.rects).length, moved, restyled: restyled.map((id) => [id, a.styles[id], b.styles[id]]), marked: b.marked, transformed: b.transformed,
      storedSame: sA === sB && !!sA, newKeys: kB.filter((k) => !kA.includes(k)), resume };
  };
  let rCells = 0;
  const cellRes = {};
  for (const tone of TONES) for (const view of VIEWS) {
    const r = await rectCell(tone, view);
    cellRes[`${tone} ${view[0]}`] = r;
    rCells += 1;
    ok(`RECT [${tone} ${view[0]}] after the Stack and the hologram every card (${r.n}) has its rect and its style attribute back, no mark left, nothing saved`,
      r.holo === 'holo' && r.n === 9 && r.moved.length === 0 && r.restyled.length === 0 && r.marked === 0 && r.transformed === 0 && r.storedSame && r.newKeys.length === 0, JSON.stringify(r));
  }
  ok(`RECT coverage: ${rCells}/4 cells visited`, rCells === 4);
  ok('RECT RESUME the layer draws again once the Stack has closed (motion is back)', Object.values(cellRes).every((r) => r.resume > 0), JSON.stringify(Object.values(cellRes).map((r) => r.resume)));
  if (SHOTS) {
    for (const tone of TONES) for (const view of VIEWS) {
      if (tone === 'dark' && view[0] === 1920) continue;
      await open(true, tone, view);
      await stackOn(); await key('ArrowRight'); await key('ArrowRight');
      await snap(`s2-${tone}-${view[0]}-stack`);
      const c = await st(); const p = c.centre ? await cardAt(c.centre) : null;
      if (p) { await click(p.x, p.y); await sleep(1000); await snap(`s2-${tone}-${view[0]}-hologram`); }
    }
  }

  // ---- HELD: a way of looking ----------------------------------------------------------------------------------------------------------------
  const testHeld = async () => {
    await open(true, 'dark');
    await stackOn();
    const s0 = await st(), b0 = await stored();
    const side = Object.keys(s0.rects).find((id) => id !== s0.centre && s0.rects[id].w > 20 && s0.rects[id].x > s0.rects[s0.centre].x);
    const p = side ? await cardAt(side) : null;
    if (p) {
      await app.mouseMove(p.x, p.y);
      await mouse('mousePressed', p.x, p.y);
      for (let i = 1; i <= 12; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x - i * 25, y: p.y + i * 6, button: 'left', buttons: 1, pointerType: 'mouse' }); await sleep(40); }
      await mouse('mouseReleased', p.x - 300, p.y + 72);
    }
    await sleep(1400);
    const s1h = await st();
    await key('Delete'); await key('Backspace');
    const q = await st(); const sideNow = Object.keys(q.rects).find((id) => id !== q.centre && q.rects[id].w > 20);
    const dp = sideNow ? await cardAt(sideNow) : null;
    if (dp) await app.doubleClick(dp.x, dp.y);
    await sleep(900);
    const s2h = await st(), b1 = await stored();
    await key('Escape', 500); await key('Escape', SETTLE_MS);
    const parse = (s) => (JSON.parse(s) || []).filter((b) => b.kind !== 'board-meta').map((b) => [b.id, b.x, b.y, b.w, b.h, !!b.deletedAt]);
    return { swiped: s1h.centre !== s0.centre, popup: s2h.popup, host: s2h.host, same: same(parse(b0), parse(b1)), n: parse(b1).length, side, pass: s1h.centre !== s0.centre && same(parse(b0), parse(b1)) && !s2h.popup && s2h.host === 'stack' };
  };
  const H = await testHeld();
  ok('HELD a drag on a node swipes and moves no card; Delete and Backspace delete nothing; a double-click on a side node opens no editor and no hologram', H.pass, JSON.stringify(H));

  // ---- D2-HOLO: zero draws while keys land, in the hologram's editor ----------------------------------------------------------------------------
  await open(true, 'dark');
  await stackOn();
  const c0 = await st();
  const cpt = await cardAt(c0.centre);
  await click(cpt.x, cpt.y); await sleep(1100);
  const ce = await cardAt(c0.centre);
  await app.doubleClick(ce.x, ce.y);
  await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
  await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
  await sleep(600);
  const k0 = await ev('window.__f3.keys.length');
  const word = ' written in the hologram ok';   // 27 keys
  for (const ch of word) { await app.typeKeys(ch); await sleep(90); }
  const span = await ev(`(() => { const k = window.__f3.keys.slice(${k0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
  const during = await ev(`window.__f3.calls(${span.a}, ${span.b})`);
  await click(20, 300); await sleep(900);
  const hostAfter = (await st()).host;
  const text = await ev(`((window.wrizoBoard() || []).find((b) => b.id === ${JSON.stringify(c0.centre)}) || {}).text || ''`);
  await key('Escape', 600); await key('Escape', SETTLE_MS);
  const resumeH = await rest(1200);
  ok(`D2-HOLO ZERO layer draw calls while ${span.n} keys land in the hologram's node (the board's own editor), and the words are stored in the card`,
    span.n >= 25 && during === 0 && text.includes(word.trim()) && resumeH > 0, JSON.stringify({ keys: span.n, during, stored: text.slice(-40), hostAfter, resumeH }));

  // ---- F: <= 3 centre changes a second ---------------------------------------------------------------------------------------------------------
  const testFlash = async () => {
    await open(true, 'dark');
    await stackOn();
    await ev('window.__f3.watch()');
    const t0 = Date.now();
    while (Date.now() - t0 < 3000) { await app.key('ArrowRight'); await sleep(50); }
    const w = await centreOf('.board-canvas-wrap');
    for (let i = 0; i < 40; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: w.x, y: w.y, deltaX: 0, deltaY: -120 }); await sleep(50); }
    await sleep(1200);
    const ts = (await ev('window.__f3.centres.map((c) => c[0])')).sort((a, b) => a - b);
    await key('Escape', SETTLE_MS);
    const gaps = ts.slice(1).map((x, i) => Math.round(x - ts[i]));
    return { changes: ts.length, maxPerSec: maxIn1s(ts), minGap: gaps.length ? Math.min(...gaps) : null, pass: ts.length >= 6 && maxIn1s(ts) <= 3 };
  };
  const F = await testFlash();
  ok(`F <= 3 flashes a second, measured: the centre changed ${F.changes} times under held keys and 40 wheel notches, at most ${F.maxPerSec} in any 1 s (closest ${F.minGap} ms)`, F.pass, JSON.stringify(F));

  // ---- STILL: reduced motion -------------------------------------------------------------------------------------------------------------------
  const testStill = async () => {
    await open(true, 'dark');
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await sleep(900);
    await pick('[data-flux3-stack-tab]');
    await sleep(60);
    const a = await st();   // the computed transforms: a flight in progress would read different from its end
    await sleep(900);
    const b = await st();
    const calls = await rest(1200);   // once settled, as S1's STILL reads it
    const p = a.centre ? await cardAt(a.centre) : null;
    if (p) { await click(p.x, p.y); await sleep(80); }
    const v = await st();
    await key('Escape', 80); await key('Escape', 120);
    const c = await st();
    await app.emulateMedia([]);
    await sleep(600);
    const durs = Object.values(a.dur);
    return { marked: a.marked, instant: same(a.tf, b.tf), durs: [...new Set(durs)], calls, veil: v.veil, closed: { marked: c.marked, transformed: c.transformed },
      pass: a.marked === 9 && same(a.tf, b.tf) && durs.every((d) => d === '0s') && calls === 0 && v.veil && v.veil.on === 'true' && v.veil.op === 1 && /^0s/.test(v.veil.dur) && c.marked === 0 && c.transformed === 0 };
  };
  const S = await testStill();
  ok('STILL reduced motion = the still state: the Stack opens with no transition (0 s, its transform final at once), the veil at once, no layer draw, and closing gives every node back at once', S.pass, JSON.stringify(S));

  // ---- C: contrast, both tones -----------------------------------------------------------------------------------------------------------------
  const contrast = async (tone) => {
    await open(true, tone);
    await stackOn();
    const c = await st(); const p = c.centre ? await cardAt(c.centre) : null;
    if (p) { await click(p.x, p.y); await sleep(1100); }
    const read = await ev(`(() => { const v = document.querySelector('.flux3-holo'), n = document.querySelector('.flux3-holo-count'), b = n && n.querySelector('b');
      const L = document.querySelector('[data-flux3-layer]');
      return { veilBg: v ? getComputedStyle(v).backgroundImage : null, label: n ? getComputedStyle(n).color : null, value: b ? getComputedStyle(b).color : null,
        ground: L ? getComputedStyle(L).backgroundColor : null, text: n ? n.textContent : null }; })()`);
    await key('Escape', 500); await key('Escape', SETTLE_MS);
    await pick('.show-as [data-view="storyboard"]');
    await app.waitFor("!!document.querySelector('.board-storyboard .board-lane-title')", { timeout: 6000, label: 'Sequence' }).catch(() => {});
    await sleep(500);
    const seq = (await ev('window.__f3.seq()')).title;
    await toLive();
    const stops = (String(read.veilBg).match(/rgba?\([^)]+\)/g) || []).slice(0, 2);
    const base = read.ground || 'rgb(0, 0, 0)';
    const n = {
      countLabel: Math.min(...stops.map((s) => ratio(read.label, s, base))), countValue: Math.min(...stops.map((s) => ratio(read.value, s, base))),
      laneTitle: seq ? ratio(seq.fg, seq.bg, seq.base) : NaN,
    };
    return { n, text: read.text, pass: stops.length === 2 && n.countLabel >= 4.5 && n.countValue >= 4.5 && n.laneTitle >= 4.5 };
  };
  for (const tone of TONES) {
    const c = await contrast(tone);
    console.log(`CONTRAST ${tone} ${JSON.stringify(c.n)}  (count: "${c.text}")`);
    ok(`C [${tone}] the hologram's count against the veil, Sequence's lane title against its lane: >= 4.5:1`, c.pass, JSON.stringify(c));
  }

  // ---- BUDGET: swiping the Stack vs the same keys on the board with the flag off -----------------------------------------------------------------
  const arm = async (flagOn) => {
    await open(flagOn, 'dark');
    if (flagOn) await stackOn(); else { await app.mouseMove(8, 8); await sleep(900); }
    const t0 = await now();
    for (let i = 0; i < 10; i += 1) await key(i % 4 < 2 ? 'ArrowRight' : 'ArrowLeft', 400);
    return ev(`(() => { const f = window.__f3.frames.filter((r) => r[0] >= ${t0}).map((r) => r[1]); const s = f.slice().sort((a, b) => a - b); const m = s.length >> 1;
      return { n: f.length, median: s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN, centres: document.querySelectorAll('.board-box[data-flux3-stack]').length }; })()`);
  };
  const C = [], Tn = [];
  for (let round = 0; round <= ROUNDS; round += 1) {
    const order = round % 2 ? [true, false] : [false, true];
    for (const flagOn of order) { const r = await arm(flagOn); if (round > 0) (flagOn ? Tn : C).push(r); }
  }
  const cMed = median(C.map((r) => r.median)), tMed = median(Tn.map((r) => r.median)), limit = cMed * 1.10;
  const bDetail = `control ${cMed.toFixed(2)} ms, Stack ${tMed.toFixed(2)} ms, limit ${limit.toFixed(2)} ms; rounds ${JSON.stringify({ C: C.map((r) => +r.median.toFixed(2)), T: Tn.map((r) => +r.median.toFixed(2)) })}`;
  console.log(`BUDGET ${bDetail}`);
  ok('BUDGET premise: the Stack arm was open (its nodes flown) and the control had none', Tn.every((r) => r.centres === 9) && C.every((r) => r.centres === 0), bDetail);
  if (ON_BOX) ok('BUDGET swiping the Stack, the median frame interval is within 10% of the control\'s (the box)', tMed <= limit, bDetail);
  else info('BUDGET (information: a hosted runner; the budget is judged on the box)', `${bDetail} -> ${tMed <= limit ? 'within' : 'OVER'}`);

  // ---- the mutants, each landed in the served bundle ----------------------------------------------------------------------------------------------
  const withMutant = async (name, run) => {
    mutant = name; landed[name] = undefined;
    try { return { landed: landed[name], ...(await run()) }; } finally { mutant = null; }
  };
  const mG = await withMutant('gate', testFlash);
  mG.landed = landed.gate;
  ok('MUT-GATE (landed) the centre\'s rate gate set to 0: F fails (more than 3 changes in a second)', mG.landed === 1 && !mG.pass && mG.maxPerSec > 3, JSON.stringify(mG));
  const mH = await withMutant('hold', testHeld);
  mH.landed = landed.hold;
  ok('MUT-HOLD (landed) the Stack\'s press handler unbound: HELD fails (the drag reaches the board)', mH.landed === 1 && !mH.pass, JSON.stringify(mH));
  const mC = await withMutant('clean', () => rectCell('dark', [1920, 1080]));
  mC.landed = landed.clean;
  ok('MUT-CLEAN (landed) the transform left behind on closing: RECT fails (a style attribute is not given back)', mC.landed === 1 && mC.restyled.length > 0, JSON.stringify({ landed: mC.landed, restyled: mC.restyled.length }));
  const mS = await withMutant('still', testStill);
  mS.landed = landed.still;
  ok('MUT-STILL (landed) reduced motion ignored: STILL fails (the nodes fly)', mS.landed === 1 && !mS.pass, JSON.stringify(mS));

  // ---- B: the build -------------------------------------------------------------------------------------------------------------------------------
  await open(true, 'dark');
  const served = await ev("([...document.scripts].map((s) => s.getAttribute('src') || '').find((s) => /index-/.test(s)) || '').replace(/^.*\\//, '')");
  ok(`B the build: served ${served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-S2 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-S2 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
