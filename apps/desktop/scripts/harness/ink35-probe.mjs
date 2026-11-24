// #35 PROBE (Fable, Nov 23/24: "the ink canvas redraws about 3 s into typing"; low). A DIAGNOSTIC: it times every draw on the two canvases that could be
// "the ink canvas" while she types, from her FIRST key, and names what else changed at the same moment. It judges no bar.
//   the page's ink   InkStratum's committed canvas (.ink-committed), on a Draft page that carries saved ink (one stroke, seeded through the app's seam)
//   Flux's layer     the drawing layer under the Schema ([data-flux3-layer] canvas), while she types in a card's pop-up (it must make ZERO draws while keys land)
// Arms: the page in Arbor (the redesign, the default), in Flux (the redesign, the default) and in Machina; the board in Flux. Each: 70 keys, one every 100 ms (7 s).
// The outside instrument (a new-document script) wraps CanvasRenderingContext2D's drawing calls and the canvas width/height setters (a resize clears and
// repaints) and stamps each with performance.now() and which canvas; the same script stamps <html> attribute changes (data-wz-writing, data-chrome-*,
// data-flux-writing...) and every ResizeObserver-visible size change of the page's sheet and scroller, so a draw can be put beside its cause.
// PRINTS per arm: INK35 <arm> draws (ms after the first key, grouped) and what changed around them. Premises gate (the canvas is there and painted before the
// keys, every key reached the editor); the timings are information.
// Run: node scripts/harness/ink35-probe.mjs (from apps/desktop; Actions or a box turn)
import { withHarness } from '../runtime-verify.mjs';

const KEYS = 70, GAP = 100;
const VIEW = [1400, 900];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const words = (n) => Array.from({ length: n }, (_, i) => ['light', 'kettle', 'street', 'table', 'question', 'morning', 'dog', 'answer'][i % 8]).join(' ') + '.';
const STROKE = { points: Array.from({ length: 24 }, (_, i) => ({ x: 0.1 + i * 0.02, y: 0.05 + (i % 6) * 0.004, p: 0.5 })) };
const CYCLE = 'the signal holds while she writes on ';

const INSTRUMENT = `(() => {
  if (window.__i35) return;
  const I = window.__i35 = { log: [], on: false };
  const tag = (cv) => !cv || !cv.matches ? null : cv.matches('.ink-committed') ? 'ink' : cv.matches('[data-flux3-layer] canvas') ? 'layer' : null;
  const stamp = (what, cv) => { if (!I.on) return; const t = tag(cv); if (t) I.log.push([Math.round(performance.now()), t, what]); };
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['clearRect', 'fillRect', 'strokeRect', 'stroke', 'fill', 'drawImage', 'putImageData', 'fillText']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) { stamp(m, this.canvas); return o.apply(this, a); };
  }
  for (const k of ['width', 'height']) {
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k);
    Object.defineProperty(HTMLCanvasElement.prototype, k, { configurable: true, enumerable: d.enumerable, get() { return d.get.call(this); }, set(v) { stamp('set-' + k + '=' + v, this); d.set.call(this, v); } });
  }
  I.watch = () => {
    new MutationObserver((recs) => { if (!I.on) return; for (const r of recs) I.log.push([Math.round(performance.now()), 'html', r.attributeName + '=' + String(document.documentElement.getAttribute(r.attributeName)).slice(0, 40)]); })
      .observe(document.documentElement, { attributes: true });
    const sheet = document.querySelector('.forward-only-editor') && document.querySelector('.forward-only-editor').closest('.mode-page, .mode-sheet') || document.querySelector('.mode-page');
    const sc = document.querySelector('.mode-scroll');
    const ro = new ResizeObserver((es) => { if (!I.on) return; for (const e of es) { const b = e.borderBoxSize && e.borderBoxSize[0]; I.log.push([Math.round(performance.now()), 'size', (e.target === sc ? 'scroller ' : 'sheet ') + (b ? Math.round(b.inlineSize * 10) / 10 + 'x' + Math.round(b.blockSize) : '?')]); } });
    if (sheet) ro.observe(sheet, { box: 'border-box' }); if (sc) ro.observe(sc, { box: 'border-box' });
    return { sheet: !!sheet, scroller: !!sc };
  };
})();`;

const makeBoxes = () => {
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [T('i35-a', 0.05, 0.05, 1, 'Card A'), T('i35-b', 0.5, 0.05, 2, 'Card B'), T('i35-c', 0.05, 0.4, 3, 'Card C'), T('i35-d', 0.5, 0.4, 4, 'Card D'),
    L('i35-ac', 'i35-a', 'i35-c', 10), L('i35-bd', 'i35-b', 'i35-d', 11), { id: 'i35-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 2000 }];
};

const group = (ts) => { const out = []; for (const t of ts) { const g = out[out.length - 1]; if (g && t - g[1] <= 150) { g[1] = t; g[2] += 1; } else out.push([t, t, 1]); } return out.map(([a, b, n]) => (a === b ? `${a}(${n})` : `${a}-${b}(${n})`)); };

try { await withHarness(async (app) => {
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();

  const rec = async (arm) => {
    await ev("window.__i35.log = []; window.__i35.on = true; true");
    const t0 = await ev('performance.now()');
    for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[i % CYCLE.length]); await sleep(GAP); }
    await sleep(1500);
    const log = await ev('(() => { window.__i35.on = false; return window.__i35.log.slice(); })()');
    const rel = (e) => Math.round(e[0] - t0);
    const draws = (t) => log.filter((e) => e[1] === t).map(rel);
    const other = log.filter((e) => e[1] === 'html' || e[1] === 'size').map((e) => `${rel(e)} ${e[1]} ${e[2]}`);
    const sets = log.filter((e) => (e[1] === 'ink' || e[1] === 'layer') && /^set-/.test(e[2])).map((e) => `${rel(e)} ${e[1]} ${e[2]}`);
    console.log(`INK35 ${arm.padEnd(9)} ink draws ${J(group(draws('ink')))} | layer draws ${J(group(draws('layer')))}`);
    console.log(`INK35 ${arm.padEnd(9)} canvas resizes ${J(sets.slice(0, 12))}`);
    console.log(`INK35 ${arm.padEnd(9)} beside them ${J(other.slice(0, 40))}`);
    return { log, inkDraws: draws('ink'), layerDraws: draws('layer') };
  };

  // ---- the page, with saved ink, in each theme
  const PAGES = [['ARBOR', 'plateau', '/'], ['FLUX', 'flux', '/'], ['MACHINA', 'machina', '/']];
  for (const [arm, theme, url] of PAGES) {
    const id = `ink35-${arm.toLowerCase()}`;
    await ev("location.hash = '#/'"); await sleep(300);
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
    await ev(`window.wrizoCreateJournalPage(${J({ id, text: words(300), strokes: [STROKE], createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
    await ev(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-theme', ${J(theme)});`);
    await ev(`history.replaceState(null, '', ${J(url)} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.ink-committed')", { timeout: 15000, label: 'the page and its ink' }).catch(() => {});
    await splashGone();
    await sleep(1500);
    const pre = await ev("(() => { const c = document.querySelector('.ink-committed'); return { theme: document.documentElement.getAttribute('data-theme'), canvas: !!c, w: c ? c.width : null, h: c ? c.height : null, watch: window.__i35.watch() }; })()");
    await ev("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()");
    await sleep(800);
    const before = await ev("document.querySelector('.forward-only-editor').textContent.split('\\u200b').join('').length");
    const r = await rec(arm);
    const after = await ev("document.querySelector('.forward-only-editor').textContent.split('\\u200b').join('').length");
    ok(`P-${arm} (premise) the ${theme} page carries painted ink (a canvas larger than the 1 px blank) and the watchers stand`, pre.theme === theme && pre.canvas && pre.w > 1 && pre.h > 1 && pre.watch.sheet && pre.watch.scroller, J(pre));
    ok(`K-${arm} (premise) every key reached the page (it grew by ${KEYS})`, after - before === KEYS, J({ before, after }));
  }

  // ---- Flux's layer, while she types in a card on the Schema
  await ev("location.hash = '#/'"); await sleep(300);
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await ev(`window.wrizoCreateJournalPage(${J({ id: 'ink35-board', text: 'Probe 35', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await ev("localStorage.setItem('wrizo-theme', 'flux');");
  await ev("history.replaceState(null, '', '/#/page/ink35-board')");
  await app.reload();
  await app.waitFor("!!document.querySelector('[data-flux3-layer]') && !!document.querySelector('.board-box[data-box-id=\"i35-d\"]')", { timeout: 15000, label: 'the Schema' }).catch(() => {});
  await splashGone();
  await sleep(1500);
  const b = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"i35-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
  if (b) await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
  await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
  await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
  await sleep(1500);
  const bpre = await ev("(() => ({ theme: document.documentElement.getAttribute('data-theme'), layer: document.querySelectorAll('[data-flux3-layer]').length, editor: !!document.querySelector('.board-popup-editor'), watch: window.__i35.watch() }))()");
  const bBefore = await ev("(() => { const e = document.querySelector('.board-popup-editor'); return e ? e.textContent.length : -1; })()");
  await rec('BOARD');
  const bAfter = await ev("(() => { const e = document.querySelector('.board-popup-editor'); return e ? e.textContent.length : -1; })()");
  ok('P-BOARD (premise) the Flux Schema stands with its one layer and the card editor open', bpre.theme === 'flux' && bpre.layer === 1 && bpre.editor, J(bpre));
  ok(`K-BOARD (premise) every key reached the card (it grew by ${KEYS})`, bAfter - bBefore === KEYS, J({ bBefore, bAfter }));
}); } catch (e) { ok('the probe ran to the end', false, String(e && e.message || e).slice(0, 400)); }

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 800)}]` : ''}`);
const EXPECTED = 8;
const passed = checks.filter((c) => c.pass).length;
const verdict = passed === checks.length && checks.length === EXPECTED;
console.log(verdict ? `\nINK35-PROBE VERIFY: PASS (${checks.length} checks; the INK35 lines are the reading)` : `\nINK35-PROBE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed${checks.length !== EXPECTED ? `, ${checks.length} of ${EXPECTED} checks ran` : ''}`);
process.exit(verdict ? 0 : 1);
