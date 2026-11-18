// BUG #90 (Fable's list: "--fade-dur write on <html>, measure on main"): useChromeDissolve.noteWrite writes --fade-dur on the stage, the chrome root and <html> on EVERY forward keystroke, the same value each time (components/useChromeDissolve.ts setFadeDur).
// A MEASUREMENT, in ONE browser (paired, so the runner's noise cancels): on a Draft page of 5,000, 20,000 and 50,000 words, 300 edits with the three writes and 300 without, interleaved; each edit appends a character to the editor and forces a style recalculation (getComputedStyle, which forces it and nothing else), timed.
// It also times the same edit followed by a FORCED LAYOUT (offsetHeight), because a custom property on <html> that something reads in layout costs there. Prints `FADE90 {json}`: median, p95 and mean in ms with and without, and the difference. Exit 1 only if the page or the stage could not be found.
// Run: on Actions via writing-audit.yml, script=fade-90.mjs, config plateau/off/light/1366 (and flux, machina).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: 1366, height: 768, out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const WORDS = (env.WA_WORDS || '5000,20000,50000').split(',').map(Number).filter((x) => x > 0);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const NL = String.fromCharCode(10);
const pageText = (words) => { const per = PARA.split(' ').length - 1; const lines = []; for (let i = 0; i < Math.ceil(words / per); i += 1) lines.push(PARA.trim()); return lines.join(NL); };

let bad = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  for (const words of WORDS) {
    await d.openPage(pageText(words), 'drafting'); await d.place(5); await sleep(700);
    const r = await d.ev(`(() => {
      const ed = document.querySelector('.forward-only-editor'); const stage = document.querySelector('.mode-stage'); const root = document.documentElement;
      if (!ed || !stage) return { error: 'no editor or no stage' };
      const targets = [stage, root]; const probe = ed.parentElement;
      const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 1000) / 1000; };
      const mean = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 1000) / 1000;
      const stat = (xs) => ({ median: q(xs, 0.5), p95: q(xs, 0.95), mean: mean(xs) });
      const styleW = [], styleN = [], layW = [], layN = [];
      for (const t of targets) t.style.setProperty('--fade-dur', '0.4s');
      for (let k = 0; k < 600; k += 1) {
        const withWrite = k % 2 === 0;
        ed.appendChild(document.createTextNode('x'));
        const t0 = performance.now();
        if (withWrite) for (const t of targets) t.style.setProperty('--fade-dur', '0.4s');
        void getComputedStyle(probe).color; void getComputedStyle(ed).color;
        const t1 = performance.now();
        void ed.offsetHeight;
        const t2 = performance.now();
        (withWrite ? styleW : styleN).push(t1 - t0); (withWrite ? layW : layN).push(t2 - t1);
      }
      return { style: { with: stat(styleW), without: stat(styleN) }, layout: { with: stat(layW), without: stat(layN) }, n: styleW.length };
    })()`);
    if (r.error) { bad = true; console.log(`FADE90-ERR ${words}: ${r.error}`); continue; }
    console.log(`FADE90 ${JSON.stringify({ theme: cfg.theme, words, ...r, styleDiffMedian: Math.round((r.style.with.median - r.style.without.median) * 1000) / 1000, styleDiffMean: Math.round((r.style.with.mean - r.style.without.mean) * 1000) / 1000, layoutDiffMean: Math.round((r.layout.with.mean - r.layout.without.mean) * 1000) / 1000 })}`);
  }
});
process.exitCode = bad ? 1 : 0;
