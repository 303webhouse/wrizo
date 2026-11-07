// FLUX3 S4 - JACKED IN + THE JACK IN DEFAULT (flux-rulings-oct31.md q8; Fable's S4 rulings, Nov 6: A the idle line is out; C Jacked In keeps
// today's Typewriter controls EXACTLY, the same Esc and the same reach-to-summon; D the switch is in-session; E the dress on every Flux Typewriter,
// the default on Free Write only; F the compile on the pause; G the burst edge drains with the goal's lap; B the tunnel waits for Nick).
// The build: src/flux3/FluxJackedIn.tsx (the default, the compile, the decompile), FluxBurstEdge.tsx, jackIn.ts (the session state), the
// Free Write overlay in store/writingSettings.ts (read by ModeStage and the Sliver), the switch in the Sliver's foot, flux-v3.css; mount points
// in ModeStage and DeskInstrument; the idle glitch is off while jacked in. The page-rect law keeps its own guard (flux3-page-rect.mjs).
//
// THE PAGES, seeded through the app's seams (wrizoCreateJournalPage; never raw storage): loose pages open in Free Write (the app's own rule:
// origin 'loose'); a Draft page (origin null) with its own Typewriter memory set ('wrizo-typewriter-page-<id>', a preference, not a collection).
// Every open sets the shared Typewriter field OFF (the writing settings), so a Free Write page that opens jacked in did so by the default alone.
//
//   DEF    flag on, Flux: a loose page opens in Free Write JACKED IN (zoomed, data-flux3-jacked) while the shared field stays off; the first frame
//          with the editor is already zoomed (never painted un-jacked); Draft -> Free Write jacks in again. Flag off, or another theme: not jacked.
//          A Draft page whose own memory is off is not jacked (the default is Free Write's only).
//   SWITCH the "Jack In by default" switch: in the TOOLS foot under the flag in Flux only (absent off the flag and in another theme); Off -> Free
//          Write opens un-jacked; On -> jacked again; flipping it writes NOTHING to storage (in-session, ruling D).
//   TOGGLE today's Typewriter toggle jacks out (zoom off, shared field still off) and back in (it writes the shared field, as today).
//   RESTORE (q8) jacking in and out on a Draft page: the jacked rect is the Typewriter's own zoom rect (flag on = flag off), and on leaving the
//          rect, the scroll, the caret and the text are exactly as before (and as the control's).
//   COMPILE (F) on the pause, words two lines up and beyond are covered by signal: no layer change and no compile grant while keys land; after
//          the pause every covered word is >= 2 lines above the caret, none on the caret's line or the line above (which has words: coverage);
//          every glyph run stands on its OWN word's rect (+-1 px), also after a scroll with no re-compile; the text, the caret and the Glitch
//          bar's count are unchanged; the layer is aria-hidden, takes no pointer and cannot be selected.
//   DECOMPILE jacking out with signal showing: one decompile grant, the glyph runs on their words as the page settles, the layer gone by 700 ms,
//          the text unchanged. STILL: reduced motion and Ambiance 0 cut it (gone at once, no grant).
//   FLASH  no second with more than 3 granted flashes, across the compile and decompile runs.
//   IDLE   no idle glitch while jacked in (the idle clock told it has been still 400 s); it is back after jacking out (premise).
//   EDGE   (G) the burst edge: a 2 px line on the window's top, holding 1 - the lap (249 of 250 words: 0.004), drawn by a transform with no
//          transition; at the goal it empties, then fills for the next lap; absent once jacked out and with Progress off.
//   ESC / REACH (C) while jacked in, Esc does what it does today (the chrome comes back; still jacked in), and an edge dwell summons the chrome:
//          both identical to the control (flag off, the Typewriter on).
//   FL     Forward Lock is today's: Backspace in Jacked In strikes and never deletes, exactly as the control.
//   L      the Jacked In arm (box only; information on Actions): key -> paint (rhizome-latency's method) against the control (Flux, flag off, the
//          Typewriter on), interleaved rounds: J median <= C median + C's spread, p95 likewise, no key over 100 ms; no canvas drew more while
//          keys landed than in the control.
//   MUT-*  red-first, each a LANDED mutant (a pattern matched exactly once in index-*.js, replaced in flight): the compile per key (COMPILE-ZERO
//          fails); the compile one line up (COMPILE lines fails); the default not laid (DEF fails); the toggle not clearing the default (TOGGLE
//          fails); the idle glitch running while jacked (IDLE fails); the edge filling instead of draining (EDGE fails); the still state ignored
//          (STILL fails).
//   B      the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src.
//
// FLUX3_SHOTS=<dir> writes the frames. Run: node scripts/harness/flux3-s4.mjs (from apps/desktop; a box turn).
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
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const LONG = 'f3s4-long', DRAFTP = 'f3s4-draft', GOAL = 'f3s4-goal', FL_ON = 'f3s4-fl-on', FL_OFF = 'f3s4-fl-off';
const PARA = 'The signal runs along these plain words so that the page holds many lines above the writing line, each one long enough to wrap across the measure of the page.';
const LONG_TEXT = Array.from({ length: 10 }, (_, i) => `${i + 1}. ${PARA}`).join('\n');
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const ROUNDS = 3, KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

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

// ---- the outside instrument (a new-document script, in place before the app's first line) + page-side readers -----------------------------------
const INSTRUMENT = `(() => {
  if (window.__f4) return;
  const I = window.__f4 = { keys: [], first: null, layerMut: [], draws: 0, frames: [] };
  window.__wzVerifyFlashes = true;
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  // the first frame in which the editor exists: was the page already zoomed (jacked in)?
  const watchFirst = () => { const ed = document.querySelector('.forward-only-editor'); if (ed) { const c = document.querySelector('.mode-pagecol'); I.first = { at: performance.now(), zoom: c ? c.getAttribute('data-zoom') : null, jacked: document.documentElement.hasAttribute('data-flux3-jacked') }; return; } requestAnimationFrame(watchFirst); };
  requestAnimationFrame(watchFirst);
  // canvas draw calls, bucketed per frame (the latency arm's damping read)
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) { I.draws += 1; return o.apply(this, a); };
  }
  const raf = window.requestAnimationFrame.bind(window);
  const tick = () => { I.frames.push([performance.now(), I.draws]); I.draws = 0; if (I.frames.length > 20000) I.frames.splice(0, 10000); raf(tick); };
  raf(tick);
  const rr = (r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
  I.ed = () => document.querySelector('.forward-only-editor');
  // the caret: its rect, and how much of the editor's text stands before it. A collapsed range at the end of the text has no rect of its own
  // (the first Actions run read 0,0,0,0 there), so the rect falls back to the last line box of the text before the caret
  I.caret = () => { const ed = I.ed(), s = getSelection(); if (!ed || !s || !s.rangeCount || !ed.contains(s.anchorNode)) return null; const r0 = s.getRangeAt(0);
    const pre = document.createRange(); pre.selectNodeContents(ed); pre.setEnd(r0.startContainer, r0.startOffset);
    let r = r0.getClientRects()[0]; if (!r || !r.height) { const rs = [...pre.getClientRects()].filter((x) => x.height > 0); r = rs.length ? rs[rs.length - 1] : r0.getBoundingClientRect(); }
    return { before: pre.toString().length, r: rr(r) }; };
  I.toEnd = () => { const ed = I.ed(); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; };
  // the caret at the end of row i (a row on screen at the top of the page: the writer's caret in view)
  I.toRow = (i) => { const ed = I.ed(), row = ed && [...ed.querySelectorAll('.wz-row')][i]; if (!row) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(row); s.collapseToEnd(); return true; };
  I.lh = () => { const ed = I.ed(), L = document.querySelector('[data-flux3-compile]') || (ed && ed.parentElement); if (!ed) return null; const raw = parseFloat(getComputedStyle(ed).lineHeight); const s = ed.offsetWidth ? ed.getBoundingClientRect().width / ed.offsetWidth : 1; return Number.isFinite(raw) && raw > 0 ? raw * s : null; };
  // every word in the editor with its rect (one rect each), for the compile's checks
  I.words = () => { const ed = I.ed(); if (!ed) return []; const out = []; const walk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) { for (const m of (n.nodeValue || '').matchAll(/\\S+/gu)) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const rs = r.getClientRects(); if (rs.length === 1) out.push({ t: m[0], r: rr(rs[0]) }); } }
    return out; };
  // the compiled words: each glyph run, and the nearest word of the same text (its own rect), and how far apart they stand
  I.compiled = () => { const L = document.querySelector('[data-flux3-compile]'); if (!L) return null; const ws = I.words();
    const list = [...L.querySelectorAll('.flux3-compile-word')].map((g) => { const gr = rr(g.getBoundingClientRect()); let best = null;
      for (const w of ws) if (w.t === g.dataset.word) { const off = Math.max(Math.abs(w.r.x - gr.x), Math.abs(w.r.y - gr.y), Math.abs(w.r.w - gr.w), Math.abs(w.r.h - gr.h)); if (!best || off < best.off) best = { off: +off.toFixed(2), w: w.r }; }
      return { word: g.dataset.word, g: gr, off: best ? best.off : null, glyphs: g.textContent }; });
    const cs = getComputedStyle(L), g0 = L.querySelector('.flux3-compile-word'), gs = g0 ? getComputedStyle(g0) : null;
    return { list, decompile: L.classList.contains('decompile'), aria: L.getAttribute('aria-hidden'), pe: cs.pointerEvents, us: gs ? gs.userSelect : null, inScroll: !!L.parentElement && L.parentElement.classList.contains('mode-scroll') }; };
  I.watchLayer = () => { I.layerMut = []; const L = document.querySelector('[data-flux3-compile]'); if (I.ml) I.ml.disconnect(); if (!L) return false;
    I.ml = new MutationObserver((ms) => { const t = performance.now(); for (const m of ms) I.layerMut.push(t); }); I.ml.observe(L, { childList: true, subtree: true, attributes: true, characterData: true }); return true; };
  I.flashes = (kind) => (window.__wzFlashLog || []).filter((f) => f.ok && (!kind || f.kind === kind)).map((f) => f.t);
  I.st = () => {
    const root = document.documentElement, page = document.querySelector('.mode-page'), ed = I.ed(), col = document.querySelector('.mode-pagecol'), sc = document.querySelector('.mode-page .mode-scroll');
    const burst = document.querySelector('[data-flux3-burst]'), bi = burst && burst.querySelector('i');
    let shared = null; try { shared = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}').typewriter; } catch { shared = 'unreadable'; }
    const tog = document.querySelector('[data-mode-toggle="typewriter"]'), gb = document.querySelector('[data-flux3-glitchbar]');
    return {
      flag: root.hasAttribute('data-flux3'), theme: root.getAttribute('data-theme'), jacked: root.hasAttribute('data-flux3-jacked'), writing: root.getAttribute('data-wz-writing'),
      mode: document.querySelector('[data-mode-key][aria-selected="true"]')?.getAttribute('data-mode-key') || null,
      zoom: col ? col.getAttribute('data-zoom') : null, typewriter: sc ? sc.getAttribute('data-typewriter') : null, shared,
      page: page ? rr(page.getBoundingClientRect()) : null, text: ed ? ed.textContent : null, scrollTop: sc ? sc.scrollTop : null, caret: I.caret(),
      toggle: tog ? tog.getAttribute('aria-pressed') : null, sw: !!document.querySelector('[data-flux3-jackin-switch]'),
      burst: burst ? { left: +burst.dataset.left, r: rr(burst.getBoundingClientRect()), t: bi ? getComputedStyle(bi).transform : null, td: bi ? getComputedStyle(bi).transitionDuration : null, vw: innerWidth } : null,
      compile: !!document.querySelector('[data-flux3-compile]'), idleLayer: !!document.querySelector('[data-flux3-idle]'), idleLive: document.querySelectorAll('[data-flux3-idle] .flux3-idle-word').length,
      count: gb ? (gb.querySelector('.flux3-glitchbar-count')?.textContent || '') : null,
      struck: ed ? ed.querySelectorAll('s, del, [class*="strike"], [class*="struck"]').length : null,
      served: ([...document.scripts].map((s) => s.getAttribute('src') || '').find((s) => /index-/.test(s)) || '').replace(/^.*\\//, ''),
    };
  };
})();`;

const MUTANTS = {
  perkey: [/=700,([\w$]+)=2,([\w$]+)=420,/g, '=0,$1=2,$2=420,'],
  lines: [/=700,([\w$]+)=2,([\w$]+)=420,/g, '=700,$1=1,$2=420,'],
  default: [/return ([\w$]+)\(\)&&\(([\w$]+)\(!0\),([\w$]+)\(\)\),\(\)=>\{([\w$]+)\(!1\)\}/g, 'return ()=>{$4(!1)}'],
  clear: [/\{([\w$]+)=!1,([\w$]+)\(\{typewriter:e\}\)/g, '{$2({typewriter:e})'],
  idle: [/\.flicker&&([\w$]+)>0&&![\w$]+;/g, '.flicker&&$1>0;'],
  edge: [/\?0:Math\.max\(0,Math\.min\(1,1-([\w$]+)\)\)/g, '?0:Math.max(0,Math.min(1,$1))'],
  still: [/\.size\|\|([\w$]+)\(\)\|\|!([\w$]+)\("f3-decompile"\)/g, '.size||!1||!$2("f3-decompile")'],
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const maxIn1s = (ts) => { let m = 0; for (let i = 0; i < ts.length; i += 1) m = Math.max(m, ts.filter((x) => x >= ts[i] && x < ts[i] + 1000).length); return m; };
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
  const click = async (x, y) => { await app.mouseMove(x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const centreOf = (sel, i = 0) => ev(`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width) return null; return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const st = () => ev('window.__f4.st()');

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

  // ---- the pages, through the seams (on the Desk: no flush handler is mounted) -------------------------------------------------------------------
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const at = new Date().toISOString();
  const mk = (row) => ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  await mk({ id: LONG, text: LONG_TEXT, createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: DRAFTP, text: LONG_TEXT, createdAt: at, origin: null, source: 'page' });
  await mk({ id: GOAL, text: Array.from({ length: 249 }, (_, i) => `w${i}`).join(' '), createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: FL_ON, text: 'Forward lock line', createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: FL_OFF, text: 'Forward lock line', createdAt: at, origin: 'loose', source: 'page' });
  await sleep(400);

  // preferences (not collections), set before the reload as the app reads them at boot; the shared Typewriter field is OFF unless a test says so
  const open = async ({ flag = true, id = LONG, theme = 'flux', tone = 'dark', view = [1920, 1080], dial = 50, prefs = {}, mode = null, reduced = false, pageTw = null } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(dial))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }, ${JSON.stringify(prefs)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.removeItem('wrizo-mode-page-${id}');
      ${pageTw ? `localStorage.setItem('wrizo-typewriter-page-${id}', ${JSON.stringify(pageTw)});` : ''} })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.emulateDpr(1, view[0], view[1]);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    if (mode) await pickMode(mode);
    await ev('window.__f4.toEnd()');
    await app.mouseMove(8, 8);
    await sleep(1600);
  };
  const pickMode = async (key) => {
    await ev(`(() => { const b = document.querySelector('[data-mode-key="${key}"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); })()`);
    await app.waitFor(`document.querySelector('[data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
    await sleep(500);
    await ev('window.__f4.toEnd()');
  };
  // the TOOLS hand (it overlays the zoomed page; nothing is displaced), its foot menu, and today's Typewriter toggle in it
  const hand = async (want) => {
    const isOpen = await ev("document.querySelector('.wz-sliver-grip')?.getAttribute('aria-expanded') === 'true'");
    if (isOpen !== want) { const p = await centreOf('.wz-sliver-grip'); if (p) { await click(p.x, p.y); await sleep(700); } }
    return ev("document.querySelector('.wz-sliver-grip')?.getAttribute('aria-expanded') === 'true'");
  };
  const pressToggle = async () => {
    await hand(true);
    const p = await centreOf('[data-mode-toggle="typewriter"]');
    if (p) await click(p.x, p.y);
    await sleep(80);
    return !!p;
  };
  const footMenu = async () => {
    await hand(true);
    const open = await ev("document.querySelector('.wz-sliver-instruments-btn')?.getAttribute('aria-expanded') === 'true'");
    if (!open) { const p = await centreOf('.wz-sliver-instruments-btn'); if (p) { await click(p.x, p.y); await sleep(400); } }
    return ev("!!document.querySelector('[data-flux3-jackin-switch]')");
  };
  const pickSwitch = async (on) => { const p = await centreOf('[data-flux3-jackin-switch] .mode-seg button', on ? 0 : 1); if (p) { await click(p.x, p.y); await sleep(300); } return !!p; };
  const storageSnap = () => ev('JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))');

  // ---- DEF: the default ---------------------------------------------------------------------------------------------------------------------------
  const testDefault = async () => {
    await open();
    const a = await st(), first = await ev('window.__f4.first');
    if (SHOTS) for (const tone of ['dark', 'light']) for (const view of [[1366, 768], [1920, 1080]]) {
      if (!(tone === 'dark' && view[0] === 1920)) await open({ tone, view });
      await ev('window.__f4.toEnd()'); await sleep(1600);
      await snap(`s4-${tone}-${view[0]}-jacked`);
    }
    if (SHOTS) await open();
    await pickMode('draft');
    const inDraft = await st();
    await pickMode('freewrite');
    const back = await st();
    return { a, first, inDraft, back };
  };
  const d = await testDefault();
  ok('DEF flag on, Flux: a loose page opens in Free Write JACKED IN (zoomed, marked) while the shared Typewriter field stays off',
    d.a.mode === 'freewrite' && d.a.zoom === 'true' && d.a.typewriter === 'true' && d.a.jacked && d.a.shared === false, JSON.stringify({ mode: d.a.mode, zoom: d.a.zoom, tw: d.a.typewriter, jacked: d.a.jacked, shared: d.a.shared }));
  ok('DEF-FIRST the first frame with the editor is already jacked in (the page never paints un-jacked first)', d.first && d.first.zoom === 'true', JSON.stringify(d.first));
  ok('DEF-TAB Draft (its own memory: off) is not jacked; back to Free Write jacks in again', d.inDraft.mode === 'draft' && d.inDraft.zoom !== 'true' && !d.inDraft.jacked && d.back.mode === 'freewrite' && d.back.zoom === 'true' && d.back.jacked,
    JSON.stringify({ draft: [d.inDraft.mode, d.inDraft.zoom, d.inDraft.jacked], back: [d.back.mode, d.back.zoom, d.back.jacked] }));
  await open({ flag: false });
  const dOff = await st();
  ok('DEF-OFF flag off: the same page opens un-jacked (the shared field rules, as today)', !dOff.flag && dOff.mode === 'freewrite' && dOff.zoom !== 'true' && !dOff.jacked, JSON.stringify({ zoom: dOff.zoom, jacked: dOff.jacked }));
  await open({ theme: 'plateau' });
  const dArbor = await st();
  ok('DEF-THEME flag on, another theme (Arbor): un-jacked, and no switch', dArbor.theme === 'plateau' && dArbor.zoom !== 'true' && !dArbor.jacked && !(await footMenu()), JSON.stringify({ theme: dArbor.theme, zoom: dArbor.zoom, jacked: dArbor.jacked }));
  await open({ id: DRAFTP, pageTw: 'off' });
  const dDraft = await st();
  ok('DEF-DRAFT a Draft page whose own memory is off opens un-jacked (the default is Free Write\'s only)', dDraft.mode === 'draft' && dDraft.zoom !== 'true' && !dDraft.jacked, JSON.stringify({ mode: dDraft.mode, zoom: dDraft.zoom }));
  await open({ id: DRAFTP, pageTw: 'on' });
  const dDraftOn = await st();
  ok('DEF-DRESS (E) a Draft page whose own Typewriter is on is Jacked In too (the dress on every Flux Typewriter)', dDraftOn.mode === 'draft' && dDraftOn.zoom === 'true' && dDraftOn.jacked && dDraftOn.compile, JSON.stringify({ mode: dDraftOn.mode, zoom: dDraftOn.zoom, jacked: dDraftOn.jacked, compile: dDraftOn.compile }));

  // ---- SWITCH ----------------------------------------------------------------------------------------------------------------------------------------
  const testSwitch = async () => {
    await open();
    const shown = await footMenu();
    if (SHOTS) await snap('s4-dark-1920-switch');
    const before = await storageSnap();
    await pickSwitch(false);
    const after = await storageSnap();
    await hand(false);
    await pickMode('draft'); await pickMode('freewrite');
    const offRun = await st();
    await footMenu(); await pickSwitch(true); await hand(false);
    await pickMode('draft'); await pickMode('freewrite');
    const onRun = await st();
    await open({ flag: false });
    const offFlag = await footMenu();
    return { shown, saved: before !== after, offRun, onRun, offFlag };
  };
  const s = await testSwitch();
  ok('SWITCH "Jack In by default" is in the TOOLS foot under the flag in Flux, and absent off the flag', s.shown && !s.offFlag, JSON.stringify({ shown: s.shown, offFlag: s.offFlag }));
  ok('SWITCH Off: Free Write opens un-jacked; On: jacked again', s.offRun.mode === 'freewrite' && s.offRun.zoom !== 'true' && !s.offRun.jacked && s.onRun.mode === 'freewrite' && s.onRun.zoom === 'true' && s.onRun.jacked,
    JSON.stringify({ off: [s.offRun.zoom, s.offRun.jacked], on: [s.onRun.zoom, s.onRun.jacked] }));
  ok('SWITCH flipping it writes nothing to storage (in-session, ruling D)', !s.saved);

  // ---- TOGGLE: today's control jacks out and back in ----------------------------------------------------------------------------------------------
  const testToggle = async () => {
    await open();
    const a = await st();
    await pressToggle(); await sleep(600);
    const out = await st();
    await pressToggle(); await sleep(600);
    const back = await st();
    await hand(false);
    return { a, out, back };
  };
  const t = await testToggle();
  ok('TOGGLE today\'s Typewriter toggle jacks out (zoom off, unmarked; the shared field still off) and back in (it writes the shared field, as today)',
    t.a.jacked && t.a.toggle === 'true' && t.out.zoom !== 'true' && !t.out.jacked && t.out.toggle === 'false' && t.out.shared === false && t.back.zoom === 'true' && t.back.jacked && t.back.shared === true,
    JSON.stringify({ a: [t.a.jacked, t.a.toggle], out: [t.out.zoom, t.out.jacked, t.out.toggle, t.out.shared], back: [t.back.zoom, t.back.jacked, t.back.shared] }));

  // ---- RESTORE: in and out on a Draft page, against the control ---------------------------------------------------------------------------------
  const testRestore = async (flag) => {
    await open({ flag, id: DRAFTP, pageTw: 'off' });
    // the writer's caret in view: the end of the second row, at the top of an unscrolled page (the first Actions run put the caret at the end of the
    // text while the page sat at scroll 0, a caret out of view; the control moved its scroll too, 0 -> 464, so that read was the scenario's)
    await ev('(() => { const s = document.querySelector(".mode-page .mode-scroll"); if (s) s.scrollTop = 0; window.__f4.toRow(1); })()');
    await sleep(600);
    const before = await st();
    await pressToggle(); await sleep(900);
    const inside = await st();
    await pressToggle(); await sleep(900);
    await hand(false); await app.mouseMove(8, 8); await sleep(600);
    const after = await st();
    return { before, inside, after };
  };
  const rOn = await testRestore(true), rOff = await testRestore(false);
  ok('RESTORE the jacked rect is the Typewriter\'s own zoom rect (flag on = flag off), and Jacked In while on', rOn.inside.jacked && rOn.inside.zoom === 'true' && rOff.inside.zoom === 'true' && same(rOn.inside.page, rOff.inside.page),
    JSON.stringify({ on: rOn.inside.page, off: rOff.inside.page }));
  // THE SCROLL IS HELD TO THE CONTROL, NOT TO "BEFORE" (Actions runs 42342032987 + 42343730035, both legs): the control - today's Typewriter, flag
  // off - leaves at a different scroll than it entered (0 -> 79 with the caret in view at the top of the page), so an exact-scroll check is a claim
  // about the Typewriter itself, not about Jacked In. S4's claim is that Jacked In leaves exactly as the Typewriter does; the absolute scroll is
  // printed as a FINDING for Fable, never silently dropped.
  const restored = (r) => same(r.before.page, r.after.page) && r.before.text === r.after.text && !!r.before.caret && !!r.after.caret && r.before.caret.before === r.after.caret.before;
  ok('RESTORE on leaving, the rect, the caret and the text are exactly as before (flag on), and the scroll is the control\'s (Jacked In leaves as the Typewriter does)',
    restored(rOn) && same(rOn.after.page, rOff.after.page) && rOn.after.scrollTop === rOff.after.scrollTop && rOn.before.scrollTop === rOff.before.scrollTop,
    JSON.stringify({ on: { b: [rOn.before.page, rOn.before.scrollTop, rOn.before.caret], a: [rOn.after.page, rOn.after.scrollTop, rOn.after.caret] }, off: { restored: restored(rOff), b: rOff.before.scrollTop, a: [rOff.after.page, rOff.after.scrollTop] } }));
  console.log(`FINDING RESTORE-SCROLL the Typewriter's own exit: scroll ${rOff.before.scrollTop} -> ${rOff.after.scrollTop} on the control (flag off), ${rOn.before.scrollTop} -> ${rOn.after.scrollTop} under the flag${rOff.before.scrollTop === rOff.after.scrollTop ? ' (exact)' : ' (NOT exact on the control: a Typewriter question, not S4\'s)'}`);

  // ---- COMPILE ---------------------------------------------------------------------------------------------------------------------------------------
  const testCompile = async ({ snapName = null } = {}) => {
    await open();
    await sleep(600);
    await ev('window.__f4.watchLayer()');
    const g0 = (await ev('window.__f4.flashes("f3-compile")')).length;
    const k0 = await ev('window.__f4.keys.length');
    // long enough to wrap the writing line at least twice, so lines rise while keys land (and must not compile until the pause)
    const words = ' and the line keeps going forward with more plain words now, on and on across the measure of the page until it wraps, and then it wraps again as the writing line moves down the page';
    for (const ch of words) { await app.typeKeys(ch); await sleep(40); }
    const typed = await st();
    const span = await ev(`(() => { const k = window.__f4.keys.slice(${k0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
    const mutDuring = await ev(`window.__f4.layerMut.filter((t) => t >= ${span.a} && t <= ${span.b} + 30).length`);
    const grantsDuring = await ev(`window.__f4.flashes("f3-compile").filter((t) => t >= ${span.a} && t <= ${span.b} + 30).length`);
    await sleep(1500);
    const after = await st();
    const comp = await ev('window.__f4.compiled()');
    const lh = await ev('window.__f4.lh()');
    const caret = after.caret;
    const allWords = await ev('window.__f4.words()');
    if (snapName) await snap(snapName);
    // which line above the caret each covered word stands on, and the words of the line just above (none may be covered)
    const lineOf = (r) => (caret && lh ? Math.round((caret.r.y - r.y) / lh) : null);
    const covered = (comp && comp.list) || [];
    const lines = covered.map((c) => lineOf(c.g));
    const lineAbove = allWords.filter((w) => lineOf(w.r) === 1);
    const lineAboveCovered = lineAbove.filter((w) => covered.some((c) => Math.abs(c.g.x - w.r.x) < 1 && Math.abs(c.g.y - w.r.y) < 1)).length;
    const maxOff = covered.length ? Math.max(...covered.map((c) => (c.off === null ? 999 : c.off))) : null;
    // a scroll with no re-compile: the glyph runs move with the text
    await ev('(() => { const s = document.querySelector(".mode-page .mode-scroll"); if (s) s.scrollTop -= 120; })()');
    await sleep(120);
    const scrolled = await ev('window.__f4.compiled()');
    const maxOffScrolled = scrolled && scrolled.list.length ? Math.max(...scrolled.list.map((c) => (c.off === null ? 999 : c.off))) : null;
    return { typed, span, mutDuring, grantsDuring, grantsAfter: (await ev('window.__f4.flashes("f3-compile")')).length - g0, after, comp, lh, lines, lineAbove: lineAbove.length, lineAboveCovered, maxOff, maxOffScrolled, nScrolled: scrolled ? scrolled.list.length : 0 };
  };
  const c = await testCompile({ snapName: 's4-dark-1920-compiled' });
  ok(`COMPILE-ZERO while keys land: no layer change and no compile grant (${c.span.n} keys)`, c.span.n >= 50 && c.mutDuring === 0 && c.grantsDuring === 0, JSON.stringify({ keys: c.span.n, mut: c.mutDuring, grants: c.grantsDuring }));
  ok(`COMPILE on the pause, words two lines up and beyond are covered (${c.comp ? c.comp.list.length : 0} words), none on the caret's line or the line above (${c.lineAbove} words there, ${c.lineAboveCovered} covered)`,
    c.comp && c.comp.list.length >= 8 && c.lines.every((n) => n !== null && n >= 2) && c.lineAbove >= 3 && c.lineAboveCovered === 0 && c.grantsAfter >= 1,
    JSON.stringify({ n: c.comp && c.comp.list.length, lines: [...new Set(c.lines)], lh: c.lh, lineAbove: c.lineAbove, lineAboveCovered: c.lineAboveCovered, grants: c.grantsAfter }));
  ok(`COMPILE-PLACE every glyph run stands on its own word's rect (+-1 px; worst ${c.maxOff}), and still after a scroll with no re-compile (worst ${c.maxOffScrolled}, ${c.nScrolled} runs)`,
    c.maxOff !== null && c.maxOff <= 1 && c.maxOffScrolled !== null && c.maxOffScrolled <= 1, JSON.stringify((c.comp && c.comp.list.slice(0, 4)) || null));
  ok('COMPILE-TEXT the text, the caret and the Glitch bar\'s count are unchanged by the compile', c.typed.text === c.after.text && c.typed.caret && c.after.caret && c.typed.caret.before === c.after.caret.before && c.typed.count === c.after.count,
    JSON.stringify({ text: c.typed.text === c.after.text, caret: [c.typed.caret && c.typed.caret.before, c.after.caret && c.after.caret.before], count: [c.typed.count, c.after.count] }));
  ok('COMPILE-A11Y the layer sits in the page\'s own scroller, aria-hidden, no pointer, not selectable', c.comp && c.comp.inScroll && c.comp.aria === 'true' && c.comp.pe === 'none' && c.comp.us === 'none', JSON.stringify(c.comp && { inScroll: c.comp.inScroll, aria: c.comp.aria, pe: c.comp.pe, us: c.comp.us }));

  // ---- DECOMPILE + STILL -----------------------------------------------------------------------------------------------------------------------------
  const testDecompile = async ({ reduced = false, dial = 50, snapName = null } = {}) => {
    await open({ reduced, dial });
    // wait on the signal itself (Actions 42344491441: a fixed 600 ms read 0 words, and the compile landed while the hand opened); a page that never
    // compiles fails on `had`, never here
    await app.waitFor("document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length > 0", { timeout: 8000, label: 'the signal' }).catch(() => {});
    await sleep(300);
    const had = await ev('window.__f4.compiled()');
    const g0 = (await ev('window.__f4.flashes("f3-decompile")')).length;
    const text0 = (await st()).text;
    await pressToggle();
    await sleep(40);
    const early = await ev('window.__f4.compiled()');
    await sleep(80);
    const mid = await ev('window.__f4.compiled()');
    if (snapName) await snap(snapName);
    await sleep(700);
    const late = await st();
    await hand(false);
    const grants = (await ev('window.__f4.flashes("f3-decompile")')).length - g0;
    const midOff = mid && mid.list.length ? Math.max(...mid.list.map((x) => (x.off === null ? 999 : x.off))) : null;
    return { had: had ? had.list.length : 0, early: early ? early.list.length : 0, mid: mid ? { n: mid.list.length, decompile: mid.decompile, off: midOff } : null, gone: !late.compile, jackedOut: !late.jacked, textSame: late.text === text0, grants };
  };
  const dc = await testDecompile({ snapName: 's4-dark-1920-decompile' });
  ok(`DECOMPILE jacking out with signal showing (${dc.had} words): one grant, the glyph runs on their words as the page settles (worst ${dc.mid && dc.mid.off}), gone by 700 ms, the text unchanged`,
    dc.had >= 8 && dc.jackedOut && dc.grants === 1 && dc.mid && dc.mid.n > 0 && dc.mid.decompile && dc.mid.off !== null && dc.mid.off <= 1 && dc.gone && dc.textSame, JSON.stringify(dc));
  const dcR = await testDecompile({ reduced: true });
  const dcZ = await testDecompile({ dial: 0 });
  const stillOk = (x) => x.had >= 8 && x.jackedOut && x.early === 0 && x.grants === 0 && x.gone && x.textSame;
  ok('STILL reduced motion and Ambiance 0 cut the decompile (gone at once, no grant)', stillOk(dcR) && stillOk(dcZ), JSON.stringify({ reduced: dcR, dial0: dcZ }));
  const allFlashes = await ev('window.__f4.flashes()');
  ok(`FLASH no second holds more than 3 granted flashes across the compile and decompile runs (max ${maxIn1s(allFlashes)})`, maxIn1s(allFlashes) <= 3);

  // ---- IDLE ------------------------------------------------------------------------------------------------------------------------------------------
  const testIdle = async () => {
    await open();
    await ev('window.__f3IdleShift = 400');
    await sleep(3000);
    const jackedIn = await st();
    await pressToggle(); await hand(false);
    await app.mouseMove(8, 8);
    await ev('window.__f3IdleShift = 400');
    await sleep(500);
    const out = await st();
    await ev('window.__f3IdleShift = 0');
    return { jackedIn, out };
  };
  const id = await testIdle();
  ok('IDLE no idle glitch while jacked in (still 400 s on its clock); it is back once jacked out (premise)', id.jackedIn.jacked && !id.jackedIn.idleLayer && id.jackedIn.idleLive === 0 && !id.out.jacked && id.out.idleLayer,
    JSON.stringify({ in: [id.jackedIn.jacked, id.jackedIn.idleLayer, id.jackedIn.idleLive], out: [id.out.jacked, id.out.idleLayer] }));

  // ---- EDGE ------------------------------------------------------------------------------------------------------------------------------------------
  // each run on its OWN fresh page one word short of the lap (the first Actions run's mutant run reused the page an earlier run had typed past the
  // goal, so it read 250 words, not 249)
  let edgeRun = 0;
  const testEdge = async () => {
    edgeRun += 1;
    const pid = `${GOAL}-${edgeRun}`;
    await mk({ id: pid, text: Array.from({ length: 249 }, (_, i) => `w${i}`).join(' '), createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
    await sleep(300);
    await open({ id: pid });
    const a = await st();
    if (SHOTS) await snap('s4-dark-1920-edge');
    await app.typeKeys(' x');
    await sleep(250);
    const goal = await st();
    await sleep(1800);
    const next = await st();
    await pressToggle(); await sleep(300);
    const out = await st();
    await hand(false);
    await open({ id: pid, prefs: { progress: 'off' } });
    const off = await st();
    return { a, goal, next, out, off };
  };
  const e = await testEdge();
  const scaleOf = (b) => { const m = b && b.t && b.t.match(/matrix\(([^,]+)/); return m ? +(+m[1]).toFixed(4) : (b && b.t === 'none' ? 1 : null); };
  ok(`EDGE a 2 px line on the window's top holds 1 - the lap (249/250 words: ${e.a.burst && e.a.burst.left}), drawn by a transform with no transition`,
    e.a.jacked && e.a.burst && Math.abs(e.a.burst.left - 0.004) < 1e-6 && Math.abs(scaleOf(e.a.burst) - 0.004) < 1e-3 && e.a.burst.r.y === 0 && e.a.burst.r.h === 2 && e.a.burst.r.x === 0 && e.a.burst.r.w >= e.a.burst.vw - 20 && /^0s(,|$)/.test(e.a.burst.td),
    JSON.stringify(e.a.burst));
  ok('EDGE at the goal it empties, then fills for the next lap; gone once jacked out and with Progress off',
    e.goal.burst && e.goal.burst.left === 0 && e.next.burst && e.next.burst.left === 1 && !e.out.burst && e.off.jacked && !e.off.burst,
    JSON.stringify({ goal: e.goal.burst && e.goal.burst.left, next: e.next.burst && e.next.burst.left, out: !!e.out.burst, off: [e.off.jacked, !!e.off.burst] }));

  // ---- ESC / REACH: today's Typewriter controls, against the control ------------------------------------------------------------------------------
  const testControls = async (flag) => {
    await open({ flag, prefs: flag ? {} : { typewriter: true } });
    for (const ch of ' more words') { await app.typeKeys(ch); await sleep(60); }
    await sleep(300);
    const typing = await st();
    await app.key('Escape');
    await sleep(500);
    const esc = await st();
    for (const ch of ' and more') { await app.typeKeys(ch); await sleep(60); }
    await sleep(300);
    const typing2 = await st();
    await app.mouseMove(2, 540);
    await sleep(700);
    const reach = await st();
    return { typing: [typing.zoom, typing.writing], esc: [esc.zoom, esc.writing, esc.jacked], typing2: [typing2.zoom, typing2.writing], reach: [reach.zoom, reach.writing] };
  };
  const kOn = await testControls(true), kOff = await testControls(false);
  ok('ESC while jacked in, Esc does what it does today (the chrome comes back, still in the Typewriter), the same as the control', kOn.esc[2] === true && kOn.esc[0] === 'true' && same(kOn.typing, kOff.typing) && same(kOn.esc.slice(0, 2), kOff.esc.slice(0, 2)),
    JSON.stringify({ on: kOn, off: kOff }));
  ok('REACH an edge dwell summons the chrome while jacked in, the same as the control', same(kOn.typing2, kOff.typing2) && same(kOn.reach, kOff.reach), JSON.stringify({ on: [kOn.typing2, kOn.reach], off: [kOff.typing2, kOff.reach] }));

  // ---- FL: Forward Lock is today's -------------------------------------------------------------------------------------------------------------------
  const testFL = async (flag, id) => {
    await open({ flag, id, prefs: flag ? {} : { typewriter: true } });
    await app.typeKeys(' abc');
    await sleep(200);
    await app.key('Backspace'); await sleep(120); await app.key('Backspace');
    await sleep(1500);
    const x = await st();
    return { text: x.text, struck: x.struck, zoom: x.zoom };
  };
  const fOn = await testFL(true, FL_ON), fOff = await testFL(false, FL_OFF);
  ok('FL Backspace in Jacked In strikes and never deletes, exactly as the control', fOn.zoom === 'true' && /abc/.test(fOn.text) && fOn.text === fOff.text && fOn.struck === fOff.struck, JSON.stringify({ on: fOn, off: fOff }));

  // ---- L: the Jacked In arm --------------------------------------------------------------------------------------------------------------------------
  const lat = { C: [], J: [] };
  let cursor = 0;
  for (let round = 0; round <= ROUNDS; round += 1) {
    for (const arm of (round % 2 ? ['J', 'C'] : ['C', 'J'])) {
      const pid = `f3s4-lat-${arm}-${round}`;
      // the arm's own fresh page, through the seam (it enters the cache and flushes before it returns, so seeding from any surface is safe)
      await mk({ id: pid, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
      await sleep(300);
      await open({ flag: arm === 'J', id: pid, prefs: arm === 'J' ? {} : { typewriter: true } });
      const stood = await st();
      await ev(`(() => { window.__lat = []; let t0 = 0; if (window.__latOff) window.__latOff();
        const kd = () => { t0 = performance.now(); };
        const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { const now = performance.now(); window.__lat.push({ ms: now - t, key: t, at: now }); })); };
        document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
        window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`);
      for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[cursor % CYCLE.length]); cursor += 1; await sleep(GAP); }
      await sleep(250);
      const got = await ev(`(() => { const l = window.__lat.slice(), fr = window.__f4.frames; const a = l.length ? Math.min(...l.map((x) => x.key)) : 0, b = l.length ? Math.max(...l.map((x) => x.at)) : 0;
        return { lat: l.map((x) => x.ms), drawFrames: fr.filter((f) => f[0] >= a && f[0] <= b && f[1] > 0).length }; })()`);
      if (round > 0) lat[arm].push({ ...got, stood: { flag: stood.flag, zoom: stood.zoom, jacked: stood.jacked, theme: stood.theme } });
    }
  }
  const cMeds = lat.C.map((r) => stat(r.lat).median), cP95s = lat.C.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(lat.C.flatMap((r) => r.lat)), J = stat(lat.J.flatMap((r) => r.lat));
  const enough = lat.C.every((r) => r.lat.length >= MIN_KEYS) && lat.J.every((r) => r.lat.length >= MIN_KEYS);
  const stoodRight = lat.J.every((r) => r.stood.flag && r.stood.jacked && r.stood.zoom === 'true') && lat.C.every((r) => !r.stood.flag && r.stood.zoom === 'true' && r.stood.theme === 'flux');
  const latOk = enough && stoodRight && J.median <= C.median + spreadMed && J.p95 <= C.p95 + spreadP95 && J.max <= MAX_MS;
  const drawsOk = lat.J.reduce((a, r) => a + r.drawFrames, 0) <= lat.C.reduce((a, r) => a + r.drawFrames, 0) + lat.J.length;
  const latLine = `J median ${r1(J.median)} <= C ${r1(C.median)} + ${r1(spreadMed)}, J p95 ${r1(J.p95)} <= C ${r1(C.p95)} + ${r1(spreadP95)}, J max ${r1(J.max)} <= ${MAX_MS}`;
  if (ON_BOX) ok(`L the Jacked In arm adds no latency beyond the control's own spread: ${latLine}`, latOk, JSON.stringify({ C, J, cMeds, cP95s, stoodRight, enough }));
  else console.log(`INFO L (Actions: timing is the box's to judge) ${latOk ? 'within' : 'OUTSIDE'} the control's spread: ${latLine}`);
  ok(`L-DRAW no canvas drew more while keys landed in Jacked In than in the control (J ${lat.J.map((r) => r.drawFrames).join('/')} vs C ${lat.C.map((r) => r.drawFrames).join('/')})`, drawsOk && stoodRight && enough,
    JSON.stringify({ stoodRight, enough, n: [lat.C.map((r) => r.lat.length), lat.J.map((r) => r.lat.length)] }));

  // ---- the mutants, each landed in the served bundle ----------------------------------------------------------------------------------------------
  const withMutant = async (name, run) => { mutant = name; landed[name] = undefined; try { const r = await run(); return { r, landed: landed[name] }; } finally { mutant = null; } };
  const mK = await withMutant('perkey', testCompile);
  ok('MUT-PERKEY (landed) the compile not waiting for the pause: COMPILE-ZERO fails (the layer changed while keys landed)', mK.landed === 1 && mK.r.mutDuring > 0, JSON.stringify({ landed: mK.landed, mut: mK.r.mutDuring }));
  const mL = await withMutant('lines', testCompile);
  ok('MUT-LINES (landed) the compile one line up: COMPILE fails (a word on the line above covered)', mL.landed === 1 && mL.r.lineAboveCovered > 0, JSON.stringify({ landed: mL.landed, covered: mL.r.lineAboveCovered }));
  const mD = await withMutant('default', async () => { await open(); return st(); });
  ok('MUT-DEFAULT (landed) the default not laid: DEF fails (Free Write opens un-jacked)', mD.landed === 1 && mD.r.zoom !== 'true' && !mD.r.jacked, JSON.stringify({ landed: mD.landed, zoom: mD.r.zoom }));
  const mC = await withMutant('clear', testToggle);
  ok('MUT-CLEAR (landed) the toggle not clearing the default: TOGGLE fails (it cannot jack out)', mC.landed === 1 && mC.r.out.zoom === 'true', JSON.stringify({ landed: mC.landed, out: mC.r.out.zoom }));
  const mI = await withMutant('idle', testIdle);
  ok('MUT-IDLE (landed) the idle glitch running while jacked: IDLE fails', mI.landed === 1 && mI.r.jackedIn.idleLayer, JSON.stringify({ landed: mI.landed, layer: mI.r.jackedIn.idleLayer }));
  const mE = await withMutant('edge', testEdge);
  ok('MUT-EDGE (landed) the edge filling instead of draining: EDGE fails', mE.landed === 1 && mE.r.a.burst && Math.abs(mE.r.a.burst.left - 0.004) > 0.5, JSON.stringify({ landed: mE.landed, left: mE.r.a.burst && mE.r.a.burst.left }));
  const mS = await withMutant('still', () => testDecompile({ reduced: true }));
  ok('MUT-STILL (landed) the still state ignored: STILL fails (a decompile ran under reduced motion)', mS.landed === 1 && !stillOk(mS.r), JSON.stringify({ landed: mS.landed, r: mS.r }));

  // ---- B: the build -----------------------------------------------------------------------------------------------------------------------------
  await open();
  const served = (await st()).served;
  ok(`B the build: served ${served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-S4 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-S4 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
