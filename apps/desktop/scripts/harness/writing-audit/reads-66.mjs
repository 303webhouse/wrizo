// BUG #66, the READS (Fable, Nov 18: "#66's one-read tweak and its numbers"): how many times the page reads its text and its selection per keystroke, and what a letter costs, on the Draft page and on the card pop-up. A MEASUREMENT (it passes nothing).
// The page-side counters wrap HTMLElement.prototype.innerText (the whole-text read), Selection.prototype.getRangeAt and Range.prototype.toString (the selection's offsets) and count them across 40 typed letters and across 20 Shift+Arrow presses, per key.
// Run the same file on three trees: A = main + the checks (no fix), F = the fix with its extra read, T = the fix reading once. `READS66 {json}`: per surface and page size, reads per key for each counter, and the letter's paint (keydown -> the end of the next frame) median and p95.
// Run: on Actions via writing-audit.yml, script=reads-66.mjs, config plateau/off/light/1366 (and flux, machina).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: 1366, height: 768, out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const WORDS = (env.WA_WORDS || '500,5000').split(',').map(Number).filter((x) => x > 0);
const N = 40;
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const NL = String.fromCharCode(10);
const pageText = (words) => { const per = PARA.split(' ').length - 1; const lines = []; for (let i = 0; i < Math.ceil(words / per); i += 1) lines.push(PARA.trim()); return lines.join(NL); };
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };
const COUNT = `(() => {
  if (window.__c66) return; const C = window.__c66 = { inner: 0, range: 0, str: 0, paint: [] };
  const it = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText'); Object.defineProperty(HTMLElement.prototype, 'innerText', { configurable: true, set: it.set, get() { C.inner++; return it.get.call(this); } });
  const gr = Selection.prototype.getRangeAt; Selection.prototype.getRangeAt = function (...a) { C.range++; return gr.apply(this, a); };
  const ts = Range.prototype.toString; Range.prototype.toString = function () { C.str++; return ts.call(this); };
  window.addEventListener('keydown', () => { const s = performance.now(); requestAnimationFrame(() => setTimeout(() => C.paint.push(performance.now() - s), 0)); }, true);
})()`;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  for (const surface of ['draft', 'card']) {
    for (const words of (surface === 'card' ? [100] : WORDS)) {
      const text = pageText(words);
      if (surface === 'card') await d.openCard(text); else await d.openPage(text, 'drafting');
      await d.place(text.length); await sleep(600);
      await d.ev(COUNT);
      const read = () => d.ev('(() => { const C = window.__c66; const o = { inner: C.inner, range: C.range, str: C.str, paint: C.paint.slice() }; C.inner = 0; C.range = 0; C.str = 0; C.paint = []; return o; })()');
      await read();
      for (let i = 0; i < N; i += 1) { await d.type('a'); await sleep(110); }
      const L = await read();
      for (let i = 0; i < 10; i += 1) { await d.key('ArrowLeft', { shift: true }); await sleep(110); }
      for (let i = 0; i < 10; i += 1) { await d.key('ArrowRight', { shift: true }); await sleep(110); }
      const S = await read();
      const per = (n, k) => Math.round(n / k * 100) / 100;
      console.log(`READS66 ${JSON.stringify({ theme: cfg.theme, surface, words, letter: { innerPerKey: per(L.inner, N), rangePerKey: per(L.range, N), toStringPerKey: per(L.str, N), paint_median: pct(L.paint, 0.5), paint_p95: pct(L.paint, 0.95) }, shiftArrow: { innerPerKey: per(S.inner, 20), rangePerKey: per(S.range, 20), toStringPerKey: per(S.str, 20) } })}`);
    }
  }
});
