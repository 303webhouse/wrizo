// INK ENTER - THE COST OF AN ENTER ON A PAGE THAT HAS INK (#101's follow-up; Fable, Nov 19, 1:35 pm: "measure on Actions, red-first, report the cause before the fix"). A MEASUREMENT, not a verdict.
// #101 made a page with NO strokes hold a one-pixel ink canvas. A page WITH strokes still repaints its committed canvas from the ResizeObserver on the sheet on every height change (every Enter that opens a line):
// the backing store is sized to the whole sheet again (width x height x dpr, 40 000+ px tall at length) and every stroke is drawn again.
// For Free Write pages of 5 000 and 12 000 words, with 0 strokes and with 6 strokes, real CDP Enters at the end of the page: key-to-frame (rAF + a task) median / p95, the committed canvas's size, how many times the canvas was RESIZED
// (instrumented: width/height setters) and how many times the strokes were drawn (clearRect on that canvas), and the browser's profile of 20 Enters (top self times).
// Run: on Actions (harness.yml, files=ink-enter-measure.mjs).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const SIZES = (process.env.INK_SIZES || '5000,12000').split(',').map(Number);
const strokesOf = (n) => Array.from({ length: n }, (_, s) => ({ points: Array.from({ length: 40 }, (_, k) => ({ x: 0.1 + 0.6 * (k / 39), y: 0.05 + s * 0.04 + 0.02 * Math.sin(k / 4) })) }));
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');

const INSTRUMENT = `(() => {
  if (window.__inkInst) return true; window.__inkInst = true;
  window.__inkT0 = 0; window.__inkSizes = 0; window.__inkDraws = 0;
  document.addEventListener('keydown', () => { window.__inkT0 = performance.now(); }, true);
  const c = document.querySelector('.ink-committed');
  if (c) {
    for (const prop of ['width', 'height']) {
      const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, prop);
      Object.defineProperty(c, prop, { configurable: true, get() { return d.get.call(this); }, set(v) { if (d.get.call(this) !== v) window.__inkSizes += 1; d.set.call(this, v); } });
    }
    const ctx = c.getContext('2d'); const cr = ctx.clearRect.bind(ctx); ctx.clearRect = (...a) => { window.__inkDraws += 1; return cr(...a); };
  }
  return !!c; })()`;
const AFTER = "new Promise((res) => requestAnimationFrame(() => setTimeout(() => res({ dt: performance.now() - window.__inkT0, sizes: window.__inkSizes, draws: window.__inkDraws, w: (document.querySelector('.ink-committed') || {}).width, h: (document.querySelector('.ink-committed') || {}).height, sheet: Math.round((document.querySelector('.wz-ink-sheet') || document.body).getBoundingClientRect().height) }), 0)))";

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  for (const words of SIZES) for (const nStrokes of [0, 6]) {
    const PAGE = `inkm-${words}-${nStrokes}`;
    const seed = pageOf(words);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: PAGE, text: seed, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null, ...(nStrokes ? { strokes: strokesOf(nStrokes) } : {}) })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${PAGE}', 'journal')`);
    await sleep(500);
    await app.evalJs(`location.hash = '#/page/${PAGE}'`);
    const up = await waitSoft(app, `!!document.querySelector('${ED}') && document.querySelector('${ED}').textContent.length > 1000 && !!document.querySelector('.ink-committed')`, { label: `the ${words}-word page (${nStrokes} strokes)`, timeout: 30000 });
    if (!up) { console.log(`INKENTER words=${words} strokes=${nStrokes} the page did not open`); continue; }
    await sleep(1500);
    const inst = await app.evalJs(INSTRUMENT);
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    await sleep(300);
    const dts = []; let last = null;
    for (let i = 0; i < 6; i += 1) { await app.typeKeys('\n'); await app.evalJs(AFTER); }
    const before = await app.evalJs(AFTER);
    for (let i = 0; i < 25; i += 1) { await app.typeKeys('\n'); last = await app.evalJs(AFTER); dts.push(last.dt); }
    const sizes = last.sizes - before.sizes, draws = last.draws - before.draws;
    await app.cdp('Profiler.enable'); await app.cdp('Profiler.setSamplingInterval', { interval: 250 }); await app.cdp('Profiler.start');
    for (let i = 0; i < 20; i += 1) { await app.typeKeys('\n'); await app.evalJs(AFTER); }
    const { profile } = await app.cdp('Profiler.stop'); await app.cdp('Profiler.disable');
    const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    profile.samples.forEach((id, i) => { const cf = byId.get(id).callFrame; const k = `${cf.functionName || '(anonymous)'} ${String(cf.url).split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (profile.timeDeltas[i] || 0)); });
    const top = [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 7).map(([k, v]) => `${k} ${(v / 20000).toFixed(1)} ms/Enter`);
    console.log(`INKENTER words=${words} strokes=${nStrokes} instrumented=${inst} | Enter key-to-frame median ${f1(q(dts, 0.5))} ms p95 ${f1(q(dts, 0.95))} ms | over 25 Enters: canvas resized ${sizes}x, strokes drawn ${draws}x | canvas ${last.w}x${last.h}, sheet ${last.sheet} px | profile: ${top.join(' | ')}`);
    await app.evalJs("location.hash = '#/'"); await sleep(800);
  }
});
console.log('INK-ENTER-MEASURE: PASS (a measurement; the INKENTER lines are the result)');
