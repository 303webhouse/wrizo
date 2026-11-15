// MEASURE, not a check (#70): where every line of a Free Write page is drawn, with and without a trailing newline. Run the same script on main and on the #70 fix and compare the ROWTOPS70 lines: every line that holds a character must be
// drawn in the SAME place (zero px difference); only the empty last line (after a trailing newline) may differ - on main it has no box at all, with the fix its guard character gives it one line of height.
// Pages: one word; two lines; three lines; a trailing newline after one, two, three lines; a blank line then a trailing newline. Each with the Typewriter on (its default) and off.
// Run: node scripts/harness/writing-audit/rowtops-70.mjs (from apps/desktop; on Actions via writing-audit.yml, script=rowtops-70.mjs, configs theme/off/light/<width>). Never fails; it prints
//   ROWTOPS70 <theme/flag/tone/width> <case> typewriter=<on|off> {"lines":[[char,top,height],...],"edH":..,"edSH":..,"sheet":[top,height]}   (one entry per character: its glyph's top and height relative to the editor's top; the newline and the guard are named NL and ZW)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const NL = String.fromCharCode(10);
const CASES = [
  ['one-word', 'Hello'],
  ['two-lines', ['Hello world', 'Second line'].join(NL)],
  ['three-lines', ['One', 'Two', 'Three'].join(NL)],
  ['one-then-newline', 'Hello' + NL],
  ['two-then-newline', ['One', 'Two', ''].join(NL)],
  ['three-then-newline', ['One', 'Two', 'Three', ''].join(NL)],
  ['blank-then-newline', ['One', '', '', ''].join(NL)],
];
const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`ROWTOPS70 [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  for (const tw of ['on', 'off']) {
    for (const [name, text] of CASES) {
      try {
        await d.surface('.forward-only-editor', true);
        await d.openPage(text, 'journal', { typewriter: tw });
        await sleep(tw === 'on' ? 1800 : 600);   // the Typewriter zoom settles
        const m = await ev(`(() => { const ed = document.querySelector('.forward-only-editor'); const e = ed.getBoundingClientRect(); const s = document.querySelector('.mode-page').getBoundingClientRect(); const r2 = (x) => Math.round(x * 100) / 100;
          const lines = []; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
          while ((n = w.nextNode())) { for (let i = 0; i < n.data.length; i++) { const g = document.createRange(); g.setStart(n, i); g.setEnd(n, i + 1); const q = [...g.getClientRects()].find((x) => x.height > 0); const c = n.data.charCodeAt(i); const nm = c === 10 ? 'NL' : c === 8203 ? 'ZW' : n.data[i]; lines.push(q ? [nm, r2(q.top - e.top), r2(q.height)] : [nm, null, null]); } }
          return { lines, edH: r2(e.height), edSH: ed.scrollHeight, sheet: [r2(s.top - e.top), r2(s.height)] }; })()`);
        console.log(`ROWTOPS70 ${TAG} ${name} typewriter=${tw} ${JSON.stringify(m)}`);
      } catch (e) { console.log(`ROWTOPS70-ERROR ${TAG} ${name} typewriter=${tw} ${String((e && e.message) || e).slice(0, 200)}`); }
    }
  }
});
process.exit(0);
