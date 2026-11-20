// SCROLL FLUX PROBE (#113; polish10-hint H1 in Flux: after the opening landing the writing line stands at 537 where main's stands at 425, and raising the hint (Backspace) moves it 53 px down onto
// the hint). A MEASUREMENT: Flux Free Write (Wire In, always zoomed), a 44-line page opened, then ' and on' typed and seven Backspaces, with the scroller's scrollTop / scrollHeight / client height,
// the writing line's top and the typewriter trace read at each step.
// Run: on Actions (harness.yml, files=scroll-flux-probe.mjs). Prints PROBE lines.
import { withHarness } from '../runtime-verify.mjs';
import { makeDriver, sleep } from './writing-audit/lib/driver.mjs';

const SENTENCES = [
  'The rope was already there, and the well took the bucket back colder still.',
  'Whatever is worth carrying is already with you, and the rest the wind can have.',
  'We left the map on the stone and walked until the light went thin over the ridge.',
];
const text = Array.from({ length: 44 }, (_, i) => SENTENCES[i % 3]).join('\n');
const READ = `(() => { const sc = document.querySelector('.mode-scroll'), ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, l = null; while ((n = w.nextNode())) if (n.data.trim()) l = n;
  let line = null; if (l) { const r = document.createRange(); r.setStart(l, Math.max(0, l.data.trimEnd().length - 1)); r.setEnd(l, l.data.trimEnd().length); const q = r.getClientRects()[0]; line = q ? Math.round(q.top) : null; }
  const col = document.querySelector('.mode-pagecol'); const T = (window.__wzTwTrace || []).slice(-6).map((e) => e.d + (e.over != null ? ':' + e.over : '') + (e.to != null ? '>' + e.to : ''));
  return { top: Math.round(sc.scrollTop), max: sc.scrollHeight - sc.clientHeight, client: sc.clientHeight, endPad: getComputedStyle(sc).getPropertyValue('--tw-end-pad'), startOff: getComputedStyle(sc).getPropertyValue('--tw-start-offset'), line, zoom: col && col.getAttribute('data-zoom'), trace: T }; })()`;

await withHarness(async (app) => {
  const cfg = { theme: 'flux', flag: 'off', tone: 'light', width: 1366, height: 768, out: null };
  const d = makeDriver(app, cfg);
  await d.boot();
  const id = `sfp-1`;
  await d.ev(`location.hash = '#/'`); await sleep(200);
  await app.waitFor('!!window.wrizoCreateJournalPage', { label: 'the page seam', timeout: 20000 });
  await d.ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
  await d.ev(`localStorage.setItem('wrizo-mode-page-${id}', 'journal')`);
  await d.ev('window.__wzTwTrace = []');
  await d.ev(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  for (const ms of [300, 700, 1500, 3000]) { await sleep(ms === 300 ? 300 : ms - ({ 700: 300, 1500: 700, 3000: 1500 })[ms]); console.log(`PROBE open+${ms}ms ${JSON.stringify(await d.ev(READ))}`); }
  await d.ev("(() => { const e = document.querySelector('.forward-only-editor'); e.focus({ preventScroll: true }); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  await sleep(600);
  console.log(`PROBE focused ${JSON.stringify(await d.ev(READ))}`);
  await app.typeKeys(' and on'); await sleep(900);
  console.log(`PROBE typed ${JSON.stringify(await d.ev(READ))}`);
  for (let i = 1; i <= 7; i += 1) { await d.key('Backspace'); await sleep(250); console.log(`PROBE backspace ${i} ${JSON.stringify(await d.ev(READ))}`); }
  const hint = await d.ev("(() => { const n = document.querySelector('.fo-nudge'); if (!n) return null; const r = n.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; })()");
  console.log(`PROBE hint ${JSON.stringify(hint)}`);
});
console.log('SCROLL-FLUX-PROBE: PASS (a measurement; the PROBE lines are the result)');
