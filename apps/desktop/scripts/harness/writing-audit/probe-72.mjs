// PROBE for #72 (the card: select all, then Backspace, leaves a stray newline): prints what the card editor's DOM holds after each step. A diagnostic, not a check.
// Run: node scripts/harness/writing-audit/probe-72.mjs (from apps/desktop; on Actions via writing-audit.yml, script=probe-72.mjs)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';
const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  const ev = d.ev;
  const snap = (label) => ev(`(() => { const e = document.querySelector('.board-popup-editor'); return JSON.stringify({ label: ${JSON.stringify(label)}, html: e.innerHTML.slice(0, 300), innerText: e.innerText, textContent: e.textContent, kids: [...e.childNodes].map((n) => n.nodeName + (n.nodeType === 3 ? ':' + JSON.stringify(n.data) : '')).slice(0, 8), saved: (() => { try { return JSON.stringify(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').slice(-1)[0].boxes.map((b) => b.text)); } catch (x) { return 'n/a'; } })() }); })()`);
  await d.openCard('Hello world\nSecond line');
  await d.place(5); await sleep(300);
  console.log('P72', await snap('start'));
  await d.key('a', { ctrl: true }); await sleep(200);
  await d.key('Backspace'); await sleep(900);
  console.log('P72', await snap('after select-all + Backspace'));
  await d.type('x'); await sleep(900);
  console.log('P72', await snap('then typing x'));
  await d.key('Backspace'); await sleep(900);
  console.log('P72', await snap('then Backspace'));
});
