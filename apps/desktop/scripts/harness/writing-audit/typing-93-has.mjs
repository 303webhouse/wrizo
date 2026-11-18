// BUG #93 CONDITION, the PAIRED measurement (Fable, Nov 18): hosted runners are noisy, so the :has() rule is measured against itself in ONE browser. On a Flux page of 5,000 and of 12,000 words (Draft), the rule (06-flux-v2.css, `:root:has(.wz-cascade-panel[data-visible='true']..., [data-menus-popout]) .flux-block-caret`)
// is taken out of the live stylesheet (deleteRule) and put back (insertRule) alternately, and each time a character is appended to the editor and the browser is made to recalculate style (getComputedStyle, which forces it and nothing else): 300 edits with the rule, 300 without,
// interleaved. Prints `HAS93 {json}`: the median, p95 and mean of the forced style recalc in ms with and without the rule, and the difference. A MEASUREMENT: it passes nothing (exit 1 only if the rule is not found, which means the fix is not in the tree).
// Run: on Actions via writing-audit.yml, script=typing-93-has.mjs, config flux/off/light/1366 (and dark), on the fix's tree.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'flux', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: 1366, height: 768, out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const WORDS = (env.WA_WORDS || '5000,12000').split(',').map(Number).filter((x) => x > 0);
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
      const find = () => { for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch (e) { continue; } for (let i = 0; i < rules.length; i += 1) { const x = rules[i]; if (x.selectorText && x.selectorText.includes(':has(') && x.selectorText.includes('wz-cascade-panel') && x.selectorText.includes('flux-block-caret')) return { ss, i, text: x.cssText }; } } return null; };
      const found = find(); if (!found) return { error: 'the :has() rule is not in the page' };
      const ed = document.querySelector('.forward-only-editor'); const probe = ed.parentElement;
      const withRule = [], without = []; let have = true;
      const set = (on) => { const f = find(); if (on && !f) { found.ss.insertRule(found.text, found.i); } else if (!on && f) { f.ss.deleteRule(f.i); } };
      const one = () => { ed.appendChild(document.createTextNode('x')); const t = performance.now(); void getComputedStyle(probe).color; void getComputedStyle(ed).color; return performance.now() - t; };
      for (let k = 0; k < 600; k += 1) { const on = k % 2 === 0; set(on); (on ? withRule : without).push(one()); }
      set(true);
      const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 1000) / 1000; };
      const mean = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 1000) / 1000;
      return { rule: found.text.slice(0, 90), withRule: { median: q(withRule, 0.5), p95: q(withRule, 0.95), mean: mean(withRule) }, without: { median: q(without, 0.5), p95: q(without, 0.95), mean: mean(without) }, n: withRule.length };
    })()`);
    if (r.error) { bad = true; console.log(`HAS93-ERR ${words}: ${r.error}`); continue; }
    console.log(`HAS93 ${JSON.stringify({ theme: cfg.theme, tone: cfg.tone, words, ...r, diffMedianMs: Math.round((r.withRule.median - r.without.median) * 1000) / 1000, diffMeanMs: Math.round((r.withRule.mean - r.without.mean) * 1000) / 1000 })}`);
  }
});
process.exitCode = bad ? 1 : 0;
