// DIAGNOSTIC for #70 (not a check): the Free Write editor's computed line-height and the real line pitch on Arbor and Machina, with and without a trailing newline.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';
const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  for (const text of ['Hello', 'Hello\n', 'Hello\nWorld\n', 'Hello\nWorld\nThird\n']) {
    await d.openFreeWrite(text); await sleep(900);
    const r = await d.ev(`(() => { const e = document.querySelector('.forward-only-editor'); const cs = getComputedStyle(e); const run = e.querySelector('.fo-run'); const rs = run ? getComputedStyle(run) : null; const tops = []; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { for (let i = 0; i < n.data.length; i++) { const g = document.createRange(); g.setStart(n, i); g.setEnd(n, i + 1); const q = [...g.getClientRects()].find((x) => x.height > 0); if (q) tops.push([n.data.charCodeAt(i) === 10 ? 'NL' : n.data.charCodeAt(i) === 8203 ? 'ZW' : n.data[i], Math.round(q.top * 10) / 10, Math.round(q.height * 10) / 10]); } } const g = e.querySelector('.md-eof-guard'); const gr = g ? g.getBoundingClientRect() : null; return { edLH: cs.lineHeight, edFS: cs.fontSize, runLH: rs ? rs.lineHeight : null, tops: tops.slice(-8), guard: gr ? [Math.round(gr.top * 10) / 10, Math.round(gr.height * 10) / 10] : null, tw: !!document.querySelector('[data-typewriter="true"]') }; })()`);
    console.log('DIAG70 ' + cfg.theme + ' ' + JSON.stringify(text) + ' ' + JSON.stringify(r));
  }
});
process.exit(0);
