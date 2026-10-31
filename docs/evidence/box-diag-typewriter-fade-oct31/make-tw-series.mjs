import { readFileSync, writeFileSync } from 'node:fs';
const dir = 'C:/Users/nickh/AppData/Local/Temp/claude/c--Users-nickh-writer-studio/95b8fdee-36bf-4020-8d56-59646ce8944f/scratchpad/';
let t = readFileSync(dir + 'tw-tz.mjs', 'utf8');
// 1) start a frame counter right before the eight typed lines
const typed = '  for (let i = 1; i <= 8; i += 1) {';
if (!t.includes(typed)) throw new Error('typed marker');
const counter = [
  "  await app.evalJs('(window.__fr = 0, window.__t0 = performance.now(), (function tick(){ window.__fr++; requestAnimationFrame(tick); })(), 1)');",
  '',
].join('\n');
{ const i = t.lastIndexOf(typed); t = t.slice(0,i) + counter + t.slice(i); }
// 2) after the typed lines + the harness's own 1200ms wait, sample caret line and scrollTop over ~9s
const marker = '  await sleep(1200);   // past the smooth per-line scroll\n';
if (!t.includes(marker)) throw new Error('wait marker');
const series = [
  marker,
  '  const sample = () => app.evalJs(`JSON.stringify((() => { const sc = document.querySelector(".mode-scroll"); const ed = document.querySelector("${ED}"); const s = getSelection(); let y = null; if (s.rangeCount) { const r = s.getRangeAt(0).cloneRange(); let cr = r.getClientRects(); cr = cr[cr.length - 1]; if (cr) y = Math.round((cr.top + cr.bottom) / 2 - sc.getBoundingClientRect().top); } return { st: Math.round(sc.scrollTop), caretY: y, fr: window.__fr, ms: Math.round(performance.now() - window.__t0), vis: document.visibilityState, focus: document.hasFocus() }; })())`);',
  "  for (let k = 0; k < 10; k += 1) { console.log('SERIES ' + await sample()); await sleep(900); }",
  '',
].join('\n');
{ const i = t.lastIndexOf(marker); t = t.slice(0,i) + series + t.slice(i + marker.length); }
writeFileSync(dir + 'tw-series.mjs', t);
console.log('ok');
