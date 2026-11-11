// MEASURE, not a check (#60): where every row of a page with blank lines is drawn. Run the same script on main and on the #60 fix and compare the ROWTOPS lines: the rows that hold text must be drawn in the SAME place (zero px
// difference); only the blank rows' own boxes may differ (the fix gives an empty row one line of height so Chrome can draw a caret in it).
// Pages: a single blank line, a double blank, a blank FIRST line, a blank LAST line, two blank last lines, a page of blanks only; each with Typewriter off and on.
// Run: node scripts/harness/writing-audit/rowtops-60.mjs (from apps/desktop; on Actions via writing-audit.yml, script=rowtops-60.mjs, configs theme/off/light/<width>). Never fails; it prints
//   ROWTOPS <theme/flag/tone/width> <case> typewriter=<on|off> {"rows":[[top,height,textLength],...],"edH":..,"edSH":..,"sheet":[top,height]}   (tops are relative to the editor's own top, in the page's own units)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const NL = String.fromCharCode(10);
const CASES = [
  ['single-blank', ['First line.', '', 'Third line.', 'Fourth.'].join(NL)],
  ['double-blank', ['Alpha.', '', '', 'Delta.', 'Epsilon.'].join(NL)],
  ['first-line-blank', ['', 'Second line.', 'Third.'].join(NL)],
  ['last-line-blank', ['One.', 'Two.', ''].join(NL)],
  ['last-two-blank', ['One.', 'Two.', '', ''].join(NL)],
  ['blanks-only', ['', '', ''].join(NL)],
];
const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`ROWTOPS-60 [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  for (const tw of ['off', 'on']) {
    for (const [name, text] of CASES) {
      try {
        await d.surface('.forward-only-editor', false);
        await d.openPage(text, 'drafting', { typewriter: tw });
        await sleep(tw === 'on' ? 1800 : 600);   // the Typewriter zoom settles
        const m = await ev(`(() => { const ed = document.querySelector('.forward-only-editor'); const e = ed.getBoundingClientRect(); const s = document.querySelector('.mode-page').getBoundingClientRect(); const r2 = (x) => Math.round(x * 100) / 100;
          const rows = [...ed.querySelectorAll('.wz-row')].map((r) => { const b = r.getBoundingClientRect(); return [r2(b.top - e.top), r2(b.height), r.textContent.split(String.fromCharCode(8203)).join('').length]; });
          return { rows, edH: r2(e.height), edSH: ed.scrollHeight, sheet: [r2(s.top - e.top), r2(s.height)] }; })()`);
        console.log(`ROWTOPS ${TAG} ${name} typewriter=${tw} ${JSON.stringify(m)}`);
      } catch (e) { console.log(`ROWTOPS-ERROR ${TAG} ${name} typewriter=${tw} ${String((e && e.message) || e).slice(0, 200)}`); }
    }
  }
});
process.exit(0);
