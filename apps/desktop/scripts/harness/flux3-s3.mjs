// FLUX3 S3 - THE DOC (Fable's S3 rulings, Nov 6: the gutter, the per-doc link ports, the Glitch bar, the idle glitch, the hands as lines).
// The build: src/flux3/FluxDoc.tsx (the gutter + the ports), FluxGlitchBar.tsx, FluxIdleGlitch.tsx, flux-v3.css (+ the hands' colour and line);
// mount points in components/DeskInstrument.tsx only; new words in the lexicon. The page-rect law keeps its own guard (flux3-page-rect.mjs, S0),
// run beside this file in every S3 proof, with S1's and S2's.
//
// THE PAGE, seeded through the app's seams (wrizoCreateJournalPage, wrizoAddPageLink; never raw storage): a loose page of four paragraphs (and two
// blank lines), linked to a card on a board and to another page; a second page one word short of the goal's lap (WORD_GOAL 250) for the goal.
// Writing settings are the app's defaults (Progress: words, the bar style, Flicker on).
//
//   P / OFF  flag on: the gutter (a row per paragraph), the ports (one per link), the Glitch bar in the lane (and no ProgressBar), the idle layer;
//          flag off: none of them, and the ProgressBar is back. B-SWAP: with the rhizome style, GlitchMeter runs off the flag and NOT on it.
//   R      the page-rect check, 1366 + 1920 x dark + light (4 cells): the page's rect and its text are IDENTICAL with the flag on and off, and stay
//          so with a port's box open and with the TOOLS hand open.
//   GUTTER every paragraph's row: its number, its words (the app's own rule: a token with a letter or digit), beside its first line (+-2 px),
//          and wholly outside the page's left edge.
//   PORTS  one per link, named for it, straddling the page's right edge; a press draws the box (the name; Dock; Connect another; Disconnect).
//   TYPE   the recede rule and zero work while keys land: while she types the gutter and the ports are at 0 and the gutter measures NOTHING
//          (its count is the same at the first key and the last); the Glitch bar changes no glyph while keys land. On the pause the gutter is back
//          and measured again (the new words counted), and the unit she filled glitches and resolves, every change granted by the flash budget,
//          never more than 3 in any second.
//   GOAL   crossing the goal: the units hand to orange and read CHECKPOINT.
//   IDLE   the idle glitch (the idle clock told it has been still for 400 s, so the ramp is full): words are covered and resolved, and the page's
//          text, selection and word count never change; never a word on the caret's line; at most 3 changes (appearances + resolutions) in
//          any 1 s; a pointer moving makes the page whole within 300 ms; hidden, nothing appears; reduced motion, Ambiance 0, Flicker off: none.
//   HANDS  the opener tabs keep today's shape, place and arrow (flag off vs on, closed and open); under the flag an open tab draws its line.
//   DISCONNECT  the box's Disconnect, through the app's own confirm, removes that one link (the port goes) and nothing else.
//   C      contrast, both tones: the gutter, the port box, the Glitch bar's letters and count: >= 4.5:1.
//   MUT-*  red-first, each a LANDED mutant (a pattern matched exactly once in index-*.js, replaced in flight): the gutter measuring on every change
//          (TYPE fails); the idle glitch's rate gate at 0 (IDLE rate fails); activity no longer clearing it (IDLE stop fails); the caret's line
//          not avoided (IDLE caret fails); the Glitch bar not waiting for the pause (TYPE fails).
//   B      the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src.
//
// FLUX3_SHOTS=<dir> writes the frames. Run: node scripts/harness/flux3-s3.mjs (from apps/desktop; a box turn).
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
const VIEWS = [[1366, 768], [1920, 1080]];
const TONES = ['dark', 'light'];
const PAGE = 'f3s3-page', OTHER = 'f3s3-other', BOARD = 'f3s3-board', GOALPAGE = 'f3s3-goal', IDLEPAGE = 'f3s3-idle';
// the idle checks' page: two short lines, so the caret's line holds half the words (a word placed at random lands on it half the time)
const IDLE_TEXT = ['Alpha bravo charlie delta echo foxtrot golf hotel', 'India juliet kilo lima mike november oscar papa'].join('\n');
const PARAS = [
  'The first paragraph runs long enough to wrap across a few lines of the page, so that the line holding the caret is only one of the several lines it fills with these plain words.',
  '',
  'A second block, shorter.',
  'Third block keeps going with plain words for the gutter count.',
  '',
  'Fourth and last block closes the page with a handful more words to read.',
];
const goalWords = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

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

// ---- the outside instrument + page-side readers ---------------------------------------------------------------------------------------------------
const INSTRUMENT = `(() => {
  if (window.__f3) return;
  const I = window.__f3 = { keys: [], idle: [], glitch: [], goal: [], moves: [] };
  window.__wzVerifyFlashes = true;
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  addEventListener('pointermove', () => I.moves.push(performance.now()), true);
  const rr = (r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
  I.st = () => {
    const page = document.querySelector('.mode-page'), ed = document.querySelector('.forward-only-editor');
    const gut = document.querySelector('[data-flux3-gutter]'), ports = document.querySelector('[data-flux3-ports]');
    const gb = document.querySelector('[data-flux3-glitchbar]'), box = document.querySelector('[data-flux3-port-box]');
    const grip = (sel) => { const g = document.querySelector(sel); return g ? { r: rr(g.getBoundingClientRect()), glyph: g.textContent, open: g.getAttribute('aria-expanded'), after: getComputedStyle(g, '::after').content } : null; };
    const sel = getSelection();
    return {
      flag: document.documentElement.hasAttribute('data-flux3'), theme: document.documentElement.getAttribute('data-theme'),
      mode: document.querySelector('[data-mode-key][aria-selected="true"]')?.getAttribute('data-mode-key') || null,
      page: page ? rr(page.getBoundingClientRect()) : null, text: ed ? ed.textContent : null,
      paras: [...document.querySelectorAll('.mode-page .wz-row')].filter((r) => (r.textContent || '').trim()).map((r) => ({ text: r.textContent, top: +r.getBoundingClientRect().top.toFixed(2) })),
      gutter: gut ? { x: +gut.getBoundingClientRect().x.toFixed(2), op: +getComputedStyle(gut).opacity, measures: +gut.dataset.measures,
        rows: [...gut.querySelectorAll('.flux3-gutter-row')].map((r) => { const b = r.getBoundingClientRect(); return { n: +r.dataset.block, text: r.textContent, top: +b.top.toFixed(2), right: +b.right.toFixed(2) }; }) } : null,
      ports: ports ? { op: +getComputedStyle(ports).opacity, list: [...ports.querySelectorAll('.flux3-port')].map((p) => ({ label: p.getAttribute('aria-label'), key: p.dataset.portKey, kind: p.dataset.portKind, r: rr(p.getBoundingClientRect()) })) } : null,
      box: box ? { head: box.querySelector('.flux3-port-head')?.textContent || '', acts: [...box.querySelectorAll('[data-port-act]')].map((b) => b.dataset.portAct) } : null,
      glitchbar: gb ? { filled: +gb.dataset.filled, goal: gb.dataset.goal, still: gb.dataset.still, letters: [...gb.querySelectorAll('.flux3-glitchbar-unit')].map((u) => u.textContent).join(''), count: gb.querySelector('.flux3-glitchbar-count')?.textContent || '' } : null,
      progressBar: !!document.querySelector('.desk-frame-instrument .mode-progress'),
      idleLayer: !!document.querySelector('[data-flux3-idle]'), meter: !!document.querySelector('.glitch-meter-layer'),
      idleLive: document.querySelectorAll('[data-flux3-idle] .flux3-idle-word').length,
      sliver: grip('.wz-sliver-grip'), tutor: grip('.wz-tutor-grip'),
      sel: sel && sel.rangeCount ? { s: sel.toString(), r: (() => { const x = sel.getRangeAt(0).getClientRects()[0]; return x ? rr(x) : null; })() } : null,
      served: ([...document.scripts].map((s) => s.getAttribute('src') || '').find((s) => /index-/.test(s)) || '').replace(/^.*\\//, ''),
    };
  };
  // the idle layer's words as they come and go (time, add/remove, the word's box)
  I.watchIdle = () => {
    I.idle = [];
    const L = document.querySelector('[data-flux3-idle]');
    if (I.mi) I.mi.disconnect();
    if (!L) return false;
    I.mi = new MutationObserver((ms) => { const t = performance.now(); for (const m of ms) {
      m.addedNodes.forEach((n) => { const s = n.style; I.idle.push([t, 'add', { x: parseFloat(s.left), y: parseFloat(s.top), w: parseFloat(s.width), h: parseFloat(s.height) }]); });
      m.removedNodes.forEach(() => I.idle.push([t, 'rm'])); } });
    I.mi.observe(L, { childList: true });
    return true;
  };
  // the Glitch bar's glyph changes and its goal mark, as they happen
  I.watchBar = () => {
    I.glitch = []; I.goal = [];
    const gb = document.querySelector('[data-flux3-glitchbar]');
    if (I.mb) I.mb.disconnect();
    if (!gb) return false;
    I.mb = new MutationObserver((ms) => { const t = performance.now(); for (const m of ms) {
      if (m.type === 'attributes' && m.attributeName === 'data-glitch' && m.target.getAttribute('data-glitch') === 'true') I.glitch.push(t);
      if (m.type === 'characterData' || m.type === 'childList') { const u = (m.target.nodeType === 3 ? m.target.parentElement : m.target); if (u && u.closest && u.closest('[data-glitch="true"]')) I.glitch.push(t); }
      if (m.type === 'attributes' && m.attributeName === 'data-goal') I.goal.push([t, gb.dataset.goal, [...gb.querySelectorAll('.flux3-glitchbar-unit')].map((u) => u.textContent).join('')]); } });
    I.mb.observe(gb, { subtree: true, attributes: true, attributeFilter: ['data-glitch', 'data-goal'], characterData: true, childList: true });
    return true;
  };
  I.flashes = (kind) => (window.__wzFlashLog || []).filter((f) => f.kind === kind && f.ok).map((f) => f.t);
})();`;

const MUTANTS = {
  gutterwork: [/=700,(\w+)=72,(\w+)=26,(\w+)=24/g, '=0,$1=72,$2=26,$3=24'],
  rate: [/=45,(\w+)=180,(\w+)=700,/g, '=45,$1=180,$2=0,'],
  stop: [/\(\)=>\{(\w+)=performance\.now\(\),(\w+)\.size&&(\w+)\(\)\}/g, '()=>{$1=performance.now()}'],
  caret: [/(\w+)&&(\w+)\.height\?\[(\w+)\.top-2,(\w+)\.bottom\+2\]:null/g, 'null'],
  pause: [/performance\.now\(\)-(\w+)<(\w+)\)return;(\w+)=(\w+)\.current\.shift\(\)/g, 'performance.now()-$1<0)return;$3=$4.current.shift()'],
};

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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const maxIn1s = (ts) => { let m = 0; for (let i = 0; i < ts.length; i += 1) m = Math.max(m, ts.filter((x) => x >= ts[i] && x < ts[i] + 1000).length); return m; };

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const now = () => ev('performance.now()');
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
  const click = async (x, y) => { await app.mouseMove(x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const centreOf = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const st = () => ev('window.__f3.st()');

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
  await mk({ id: BOARD, text: 'Board S3', pageType: 'board', boxes: [{ id: 'f3-k', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Linked card' }], createdAt: at, origin: null, source: null });
  await mk({ id: OTHER, text: 'Other page\nIts line.', createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: PAGE, text: PARAS.join('\n'), createdAt: at, origin: 'loose', source: 'page' });
  const filler = Array.from({ length: 249 }, (_, i) => `w${i}`).join(' ');
  await mk({ id: GOALPAGE, text: filler, createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: IDLEPAGE, text: IDLE_TEXT, createdAt: at, origin: 'loose', source: 'page' });
  await ev(`window.wrizoAddPageLink(${JSON.stringify(PAGE)}, { bEntryId: ${JSON.stringify(BOARD)}, bBoxId: 'f3-k' })`);
  await ev(`window.wrizoAddPageLink(${JSON.stringify(PAGE)}, { bEntryId: ${JSON.stringify(OTHER)} })`);
  await sleep(400);
  const nLinks0 = await ev(`window.wrizoPageLinksOf(${JSON.stringify(PAGE)}).length`);

  // preferences (not collections), set before the reload as the app reads them at boot
  const open = async (flagOn, tone, view = [1920, 1080], { id = PAGE, dial = 50, prefs = {} } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(dial))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar' }, ${JSON.stringify(prefs)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })()`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flagOn ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.emulateDpr(1, view[0], view[1]);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await ev("(() => { const b = document.querySelector('[data-mode-key=\"draft\"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); })()");
    await app.waitFor("document.querySelector('[data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'Draft' }).catch(() => {});
    await app.mouseMove(8, 8);
    await sleep(2200);   // the gutter measures on the pause (700 ms) and the chrome comes back
  };
  const openBox = async (i) => { const p = await ev(`(() => { const e = document.querySelectorAll('.flux3-port')[${i}]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`); if (p) { await click(p.x, p.y); await sleep(400); } return !!p; };
  const toggleHand = async () => { const p = await centreOf('.wz-sliver-grip'); if (p) { await click(p.x, p.y); await app.mouseMove(8, 8); await sleep(900); } return !!p; };

  // ---- P / OFF / R -------------------------------------------------------------------------------------------------------------------------------
  const reads = {};
  for (const tone of TONES) {
    for (const flagOn of [false, true]) {
      await open(flagOn, tone);
      for (const view of VIEWS) {
        await app.emulateDpr(1, view[0], view[1]);
        await app.mouseMove(8, 8);
        await sleep(1400);
        const key = `${flagOn ? 'on' : 'off'}|${tone}|${view[0]}`;
        const a = await st();
        if (flagOn) await snap(`s3-${tone}-${view[0]}-doc`);
        let withBox = null, withHand = null;
        if (flagOn) {
          await openBox(0); withBox = await st();
          if (tone === 'dark' && view[0] === 1920) await snap('s3-dark-1920-portbox');
          await ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))"); await sleep(300);
        }
        await toggleHand(); withHand = await st();
        if (flagOn) await snap(`s3-${tone}-${view[0]}-hand-open`);
        await toggleHand();
        reads[key] = { a, withBox, withHand };
      }
    }
  }
  const on0 = reads['on|dark|1920'].a, off0 = reads['off|dark|1920'].a;
  ok('P flag on: the gutter (a row per paragraph), the ports (one per link), the Glitch bar in the lane (no ProgressBar), the idle layer',
    on0.flag && on0.mode === 'draft' && on0.gutter && on0.gutter.rows.length === 4 && on0.ports && on0.ports.list.length === 2 && nLinks0 === 2 && on0.glitchbar && !on0.progressBar && on0.idleLayer,
    JSON.stringify({ mode: on0.mode, rows: on0.gutter && on0.gutter.rows.length, ports: on0.ports && on0.ports.list.length, nLinks0, glitchbar: !!on0.glitchbar, progressBar: on0.progressBar, idle: on0.idleLayer }));
  ok('OFF flag off: no gutter, no ports, no Glitch bar, no idle layer; the ProgressBar is in the lane',
    !off0.flag && off0.mode === 'draft' && !off0.gutter && !off0.ports && !off0.glitchbar && off0.progressBar && !off0.idleLayer,
    JSON.stringify({ gutter: !!off0.gutter, ports: !!off0.ports, glitchbar: !!off0.glitchbar, progressBar: off0.progressBar, idle: off0.idleLayer }));
  let rCells = 0;
  for (const tone of TONES) for (const [w] of VIEWS) {
    const a = reads[`off|${tone}|${w}`], b = reads[`on|${tone}|${w}`];
    if (!a || !b) continue;
    rCells += 1;
    ok(`R [${tone} ${w}] the page's rect and text are identical with the flag on and off, with a port's box open, and with the TOOLS hand open`,
      !!a.a.page && same(a.a.page, b.a.page) && a.a.text === b.a.text && !!b.withBox && !!b.withBox.box && same(b.withBox.page, b.a.page) && same(a.withHand.page, b.withHand.page) && same(b.withHand.page, b.a.page),
      JSON.stringify({ off: a.a.page, on: b.a.page, box: b.withBox && [b.withBox.page, !!b.withBox.box], hand: [a.withHand.page, b.withHand.page], text: a.a.text === b.a.text }));
  }
  ok(`R coverage: ${rCells}/4 cells compared`, rCells === 4);

  // ---- GUTTER / PORTS (dark 1920) ----------------------------------------------------------------------------------------------------------------
  const expect = PARAS.filter((p) => p.trim()).map((p, i) => ({ n: i + 1, words: goalWords(p) }));
  const G = on0.gutter;
  const rowsOk = G && G.rows.length === expect.length && G.rows.every((r, i) => r.n === expect[i].n && new RegExp(`^0?${expect[i].n} · ${expect[i].words} words?$`).test(r.text.trim())
    && Math.abs(r.top - on0.paras[i].top) <= 2 && r.right <= on0.page.x - 20);
  ok('GUTTER every paragraph\'s row: its number and its words, beside its first line (+-2 px), outside the page\'s left edge', rowsOk,
    JSON.stringify({ expect, rows: G && G.rows, paras: on0.paras.map((p) => p.top), pageX: on0.page.x }));
  const P = on0.ports;
  const pageRight = on0.page.x + on0.page.w;
  ok('PORTS one per link, named for it, straddling the page\'s right edge',
    P && P.list.length === 2 && P.list.some((p) => /Linked card/.test(p.label)) && P.list.some((p) => /Other page/.test(p.label)) && P.list.every((p) => p.r.x < pageRight && p.r.x + p.r.w > pageRight),
    JSON.stringify({ ports: P && P.list, pageRight }));
  const bx = reads['on|dark|1920'].withBox;
  ok('PORTS a press draws the box: the item\'s name, Dock, Connect another, Disconnect',
    bx && bx.box && /Linked card|Other page/.test(bx.box.head) && ['dock', 'link', 'unlink'].every((a) => bx.box.acts.includes(a)), JSON.stringify(bx && bx.box));

  // ---- TYPE: the recede rule, zero work while keys land, the Glitch bar's glitch on the pause ---------------------------------------------------
  const testType = async () => {
    await open(true, 'dark');
    await ev("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    await sleep(400);
    await ev('window.__f3.watchBar()');
    const s0 = await st();
    const k0 = await ev('window.__f3.keys.length');
    const word = ' one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty';
    let mid = null;
    for (let i = 0; i < word.length; i += 1) { await app.typeKeys(word[i]); await sleep(55); if (i === Math.floor(word.length / 2)) mid = await st(); }
    const last = await st();
    const span = await ev(`(() => { const k = window.__f3.keys.slice(${k0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
    const glitchDuring = await ev(`window.__f3.glitch.filter((t) => t >= ${span.a} && t <= ${span.b}).length`);
    await sleep(4500);
    const after = await st();
    const glitchAfter = await ev(`window.__f3.glitch.filter((t) => t > ${span.b})`);
    const grants = await ev("window.__f3.flashes('f3-glitchbar')");
    const r = { keys: span.n, measuresFirst: s0.gutter && s0.gutter.measures, measuresMid: mid && mid.gutter && mid.gutter.measures, measuresLast: last.gutter && last.gutter.measures,
      measuresAfter: after.gutter && after.gutter.measures, opMid: mid && mid.gutter && [mid.gutter.op, mid.ports && mid.ports.op], opAfter: after.gutter && [after.gutter.op, after.ports && after.ports.op],
      filled: [s0.glitchbar && s0.glitchbar.filled, after.glitchbar && after.glitchbar.filled], glitchDuring, glitchAfter: glitchAfter.length, grants: grants.length, grantsPerSec: maxIn1s(grants),
      lastRowWords: after.gutter && after.gutter.rows.slice(-1)[0] };
    r.zeroWork = r.measuresFirst === r.measuresLast && r.measuresMid === r.measuresFirst;
    r.pass = r.keys >= 120 && r.zeroWork && glitchDuring === 0;
    return r;
  };
  const Ty = await testType();
  ok(`TYPE zero work while ${Ty.keys} keys land: the gutter measured nothing (first key to last), the Glitch bar changed no glyph`, Ty.pass, JSON.stringify(Ty));
  ok('TYPE the recede rule: the gutter and the ports at 0 while she types, back on the pause, and measured again (her new words counted)',
    Ty.opMid && Ty.opMid[0] === 0 && Ty.opMid[1] === 0 && Ty.opAfter && Ty.opAfter[0] === 1 && Ty.opAfter[1] === 1 && Ty.measuresAfter > Ty.measuresLast && Ty.lastRowWords && /\b3[34] words$/.test(Ty.lastRowWords.text.trim()),
    JSON.stringify(Ty));
  ok('TYPE the unit she filled glitches on the pause and resolves, every change granted by the flash budget, at most 3 in any second',
    Ty.filled[0] === 2 && Ty.filled[1] === 3 && Ty.glitchAfter >= 1 && Ty.grants >= 1 && Ty.grantsPerSec <= 3, JSON.stringify(Ty));

  // ---- GOAL ------------------------------------------------------------------------------------------------------------------------------------
  await open(true, 'dark', [1920, 1080], { id: GOALPAGE });
  await ev("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
  await ev('window.__f3.watchBar()');
  for (const ch of ' done ok') { await app.typeKeys(ch); await sleep(60); }
  await sleep(300);
  await snap('s3-dark-1920-goal');
  await sleep(1500);
  const goalSeen = await ev('window.__f3.goal');
  ok('GOAL crossing the goal: the units hand to orange and read CHECKPOINT', goalSeen.some(([, g, letters]) => g === 'true' && letters === 'CHECKPOINT'), JSON.stringify(goalSeen));

  // ---- IDLE --------------------------------------------------------------------------------------------------------------------------------------
  const caretOnFirst = async () => {
    const r = await ev("(() => { const row = [...document.querySelectorAll('.mode-page .wz-row')].find((x) => (x.textContent || '').trim()); if (!row) return null; const b = row.getBoundingClientRect(); return { x: Math.round(b.left + 30), y: Math.round(b.top + 8) }; })()");
    if (r) await click(r.x, r.y);
    await sleep(300);
  };
  const testIdle = async ({ watchMs = 8000, stop = true } = {}) => {
    await open(true, 'dark', [1920, 1080], { id: IDLEPAGE });
    await caretOnFirst();
    const s0 = await st();
    await ev('window.__f3.watchIdle(); window.__f3IdleShift = 400');
    await sleep(watchMs);
    const s1 = await st();
    const log = await ev('window.__f3.idle');
    const adds = log.filter((e) => e[1] === 'add');
    const band = s0.sel && s0.sel.r ? [s0.sel.r.y - 2, s0.sel.r.y + s0.sel.r.h + 2] : null;
    const onCaret = band ? adds.filter((e) => e[2].y + e[2].h > band[0] && e[2].y < band[1]).length : -1;
    const changes = log.map((e) => e[0]);
    let stopMs = null;
    if (stop) {
      await app.waitFor('document.querySelectorAll("[data-flux3-idle] .flux3-idle-word").length > 0', { timeout: 6000, label: 'a word glitching' }).catch(() => {});
      const live = (await st()).idleLive;
      const m0 = await ev('window.__f3.moves.length');
      await ev('window.__f3IdleShift = 0');   // the move starts the stillness over: no word may come back in the read below
      await app.mouseMove(300, 300);
      await sleep(400);
      const mv = await ev(`window.__f3.moves[${m0}]`);
      const rm = await ev(`window.__f3.idle.filter((e) => e[1] === 'rm' && e[0] >= ${mv || 0}).map((e) => e[0])`);
      const leftLive = (await st()).idleLive;
      stopMs = live > 0 && mv ? (leftLive === 0 ? (rm.length ? Math.max(...rm) - mv : 0) : 9999) : null;
    }
    await ev('window.__f3IdleShift = 0');
    return { adds: adds.length, onCaret, band, maxPerSec: maxIn1s(changes), textSame: s0.text === s1.text, selSame: same(s0.sel, s1.sel), countSame: s0.glitchbar && s1.glitchbar && s0.glitchbar.count === s1.glitchbar.count, stopMs };
  };
  const Id = await testIdle();
  ok(`IDLE words glitch and resolve (${Id.adds} in 8 s) while the page's text, selection and word count never change`, Id.adds >= 4 && Id.textSame && Id.selSame && Id.countSame, JSON.stringify(Id));
  ok('IDLE never a word on the caret\'s line', Id.band && Id.onCaret === 0 && Id.adds >= 4, JSON.stringify(Id));
  ok(`IDLE at most 3 changes in any 1 s (appearances and resolutions: ${Id.maxPerSec})`, Id.maxPerSec <= 3 && Id.adds >= 4, JSON.stringify(Id));
  ok('IDLE a pointer moving makes the page whole within 300 ms', Id.stopMs !== null && Id.stopMs <= 300, JSON.stringify(Id));
  if (SHOTS) {
    await open(true, 'dark', [1920, 1080], { id: IDLEPAGE }); await caretOnFirst(); await ev('window.__f3IdleShift = 400');
    await app.waitFor('document.querySelectorAll("[data-flux3-idle] .flux3-idle-word").length > 0', { timeout: 6000, label: 'a word' }).catch(() => {});
    await snap('s3-dark-1920-idle'); await ev('window.__f3IdleShift = 0');
  }
  // hidden; and the three off states
  await open(true, 'dark', [1920, 1080], { id: IDLEPAGE }); await caretOnFirst();
  await ev("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'))");
  await ev('window.__f3.watchIdle(); window.__f3IdleShift = 400'); await sleep(3000);
  const hiddenAdds = (await ev('window.__f3.idle')).filter((e) => e[1] === 'add').length;
  await ev("delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); window.__f3IdleShift = 0");
  ok('IDLE hidden: nothing appears while the window is hidden', hiddenAdds === 0, JSON.stringify({ hiddenAdds }));
  await open(true, 'dark', [1920, 1080], { id: IDLEPAGE }); await caretOnFirst();
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await ev('window.__f3.watchIdle(); window.__f3IdleShift = 400'); await sleep(3000);
  const reducedAdds = (await ev('window.__f3.idle')).filter((e) => e[1] === 'add').length;
  await app.emulateMedia([]); await ev('window.__f3IdleShift = 0');
  await open(true, 'dark', [1920, 1080], { dial: 0 });
  const dial0 = await st();
  await open(true, 'dark', [1920, 1080], { prefs: { flicker: false } });
  const flickOff = await st();
  ok('IDLE off under reduced motion (nothing appears), at Ambiance 0 and with Flicker off (no layer at all)', reducedAdds === 0 && !dial0.idleLayer && !flickOff.idleLayer,
    JSON.stringify({ reducedAdds, dial0: dial0.idleLayer, flickerOff: flickOff.idleLayer }));
  // B-SWAP: the rhizome style - GlitchMeter off the flag, the idle glitch (and no GlitchMeter) on it
  await open(false, 'dark', [1920, 1080], { prefs: { progressStyle: 'rhizome' } });
  const swOff = await st();
  await open(true, 'dark', [1920, 1080], { prefs: { progressStyle: 'rhizome' } });
  const swOn = await st();
  ok('B-SWAP under the flag the idle glitch replaces GlitchMeter (rhizome style: GlitchMeter runs off the flag, not on it; the idle layer on it)',
    swOff.meter && !swOff.idleLayer && !swOn.meter && swOn.idleLayer && !swOn.glitchbar, JSON.stringify({ off: [swOff.meter, swOff.idleLayer], on: [swOn.meter, swOn.idleLayer, !!swOn.glitchbar] }));

  // ---- HANDS -------------------------------------------------------------------------------------------------------------------------------------
  const hands = async (flagOn) => {
    await open(flagOn, 'dark');
    const closed = await st();
    await toggleHand();
    const opened = await st();
    await toggleHand();
    return { closed: { s: closed.sliver, t: closed.tutor }, opened: { s: opened.sliver } };
  };
  const hOff = await hands(false), hOn = await hands(true);
  const shape = (g) => g && { r: g.r, glyph: g.glyph, open: g.open };
  ok('HANDS the opener tabs keep today\'s shape, place and arrow (flag off vs on, closed and open); under the flag an open tab draws its line',
    !!hOff.closed.s && same(shape(hOff.closed.s), shape(hOn.closed.s)) && same(shape(hOff.closed.t), shape(hOn.closed.t)) && same(shape(hOff.opened.s), shape(hOn.opened.s))
      && hOn.opened.s.open === 'true' && hOn.opened.s.after !== 'none' && hOff.opened.s.after === 'none' && hOn.closed.s.after === 'none',
    JSON.stringify({ off: hOff, on: hOn }));

  // ---- DISCONNECT ------------------------------------------------------------------------------------------------------------------------------
  await open(true, 'dark');
  const before = (await st()).ports;
  const iOther = before ? before.list.findIndex((p) => /Other page/.test(p.label)) : -1;
  if (iOther >= 0) await openBox(iOther);
  const un = await centreOf('[data-port-act="unlink"]');
  if (un) { await click(un.x, un.y); await sleep(500); }
  const go = await centreOf('.wz-delete-go');
  if (go) { await click(go.x, go.y); await sleep(900); }
  const afterD = await st();
  const linksAfter = await ev(`window.wrizoPageLinksOf(${JSON.stringify(PAGE)}).map((l) => l.bEntryId)`);
  ok('DISCONNECT through the app\'s own confirm removes that one link (its port goes) and nothing else',
    iOther >= 0 && !!go && afterD.ports && afterD.ports.list.length === 1 && /Linked card/.test(afterD.ports.list[0].label) && same(linksAfter, [BOARD]),
    JSON.stringify({ iOther, confirm: !!go, ports: afterD.ports && afterD.ports.list.map((p) => p.label), linksAfter }));

  // ---- C: contrast, both tones -------------------------------------------------------------------------------------------------------------------
  const contrast = async (tone) => {
    await open(true, tone);
    await openBox(0);
    const c = await ev(`(() => {
      const bgOf = (e) => { while (e) { const b = getComputedStyle(e).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; e = e.parentElement; } return 'rgb(0, 0, 0)'; };
      const g = document.querySelector('.flux3-gutter-row'), gb = g && g.querySelector('b'), box = document.querySelector('.flux3-port-box'), act = document.querySelector('.flux3-port-act');
      const unit = document.querySelector('.flux3-glitchbar-unit[data-on="true"]'), cnt = document.querySelector('.flux3-glitchbar-count');
      const room = bgOf(document.querySelector('.mode-pagecol'));
      return { room, gutter: g && getComputedStyle(g).color, gutterN: gb && getComputedStyle(gb).color, boxBg: box && getComputedStyle(box).backgroundColor, act: act && getComputedStyle(act).color,
        head: box && getComputedStyle(box.querySelector('.flux3-port-head')).color, unitFg: unit && getComputedStyle(unit).color, unitBg: unit && getComputedStyle(unit).backgroundColor,
        cnt: cnt && getComputedStyle(cnt).color, cntBg: cnt ? bgOf(cnt) : null };
    })()`);
    const n = { gutter: ratio(c.gutter, c.room, c.room), gutterN: ratio(c.gutterN, c.room, c.room), act: ratio(c.act, c.boxBg, c.room), head: ratio(c.head, c.boxBg, c.room),
      unit: ratio(c.unitFg, c.unitBg, c.room), count: ratio(c.cnt, c.cntBg, c.cntBg) };
    return { n, raw: c, pass: Object.values(n).every((v) => v >= 4.5) };
  };
  for (const tone of TONES) {
    const c = await contrast(tone);
    console.log(`CONTRAST ${tone} ${JSON.stringify(c.n)}`);
    ok(`C [${tone}] the gutter, the port box, the Glitch bar's letters and count: >= 4.5:1`, c.pass, JSON.stringify(c));
  }

  // ---- the mutants, each landed in the served bundle ----------------------------------------------------------------------------------------------
  const withMutant = async (name, run) => { mutant = name; landed[name] = undefined; try { const r = await run(); return { ...r, landed: landed[name] }; } finally { mutant = null; } };
  // the pause mutant first: its typing must cross a unit (84 -> 104 words crosses 100); the gutter's needs no crossing
  const mP = await withMutant('pause', testType);
  ok('MUT-PAUSE (landed) the Glitch bar not waiting for the pause: TYPE fails (a glyph changed while keys landed)', mP.landed === 1 && mP.glitchDuring > 0, JSON.stringify({ landed: mP.landed, glitchDuring: mP.glitchDuring }));
  const mW = await withMutant('gutterwork', testType);
  ok('MUT-GUTTERWORK (landed) the gutter measuring on every change: TYPE fails (it measured while keys landed)', mW.landed === 1 && !mW.zeroWork, JSON.stringify({ landed: mW.landed, m: [mW.measuresFirst, mW.measuresMid, mW.measuresLast] }));
  const mR = await withMutant('rate', () => testIdle({ stop: false }));
  ok('MUT-RATE (landed) the idle glitch\'s gap at 0: IDLE fails (more than 3 changes in a second)', mR.landed === 1 && mR.maxPerSec > 3, JSON.stringify(mR));
  const mS = await withMutant('stop', () => testIdle({ watchMs: 2500 }));
  ok('MUT-STOP (landed) activity no longer clearing the glitch: IDLE fails (not whole within 300 ms)', mS.landed === 1 && (mS.stopMs === null || mS.stopMs > 300), JSON.stringify(mS));
  const mC = await withMutant('caret', () => testIdle({ watchMs: 9000, stop: false }));
  ok('MUT-CARET (landed) the caret\'s line not avoided: IDLE fails (a word on the caret\'s line)', mC.landed === 1 && mC.onCaret > 0, JSON.stringify(mC));

  // ---- B: the build -----------------------------------------------------------------------------------------------------------------------------
  await open(true, 'dark');
  const served = (await st()).served;
  ok(`B the build: served ${served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-S3 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-S3 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
