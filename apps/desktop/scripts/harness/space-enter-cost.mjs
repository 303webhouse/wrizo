// SPACE AND ENTER ON A LONG FREE WRITE PAGE (bug-list #110 and #101; Fable, Nov 22, 2:30 pm: "from INK: removeAllRanges is the Space cost, 1.3 s over its run; Space render ~22 ms. Reproduce on today's main, red first"). A MEASUREMENT FIRST: it never
// fails; one line per page length and kind of key, from real CDP keys at the end of a Free Write page of 5,000 / 20,000 / 50,000 words. For letters, Space and Enter: key-to-frame (rAF + a task) median / p95, and what the page itself spent
// inside the calls the Free Write editor makes after every render: Selection.removeAllRanges + addRange (the caret re-anchor, ForwardOnlyEditor), and every innerHTML write (the rebuild of the committed words), with how many bytes it wrote.
// Run: on Actions (harness.yml, files=space-enter-cost.mjs); the box decides whether a writer feels it (a quiet window).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const SIZES = (process.env.SE_SIZES || '5000,20000,50000').split(',').map(Number);
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const f1 = (x) => (Number.isFinite(x) ? Math.round(x * 10) / 10 : null);

const INSTRUMENT = `(() => {
  if (window.__se) return true;
  const S = window.__se = { t0: 0, sel: 0, selN: 0, html: 0, htmlN: 0, htmlBytes: 0 };
  document.addEventListener('keydown', () => { S.t0 = performance.now(); S.sel = 0; S.selN = 0; S.html = 0; S.htmlN = 0; S.htmlBytes = 0; }, true);
  for (const m of ['removeAllRanges', 'addRange']) { const o = Selection.prototype[m]; Selection.prototype[m] = function (...a) { const t = performance.now(); try { return o.apply(this, a); } finally { S.sel += performance.now() - t; S.selN += 1; } }; }
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, get() { return d.get.call(this); }, set(v) { const t = performance.now(); try { d.set.call(this, v); } finally { S.html += performance.now() - t; S.htmlN += 1; S.htmlBytes += String(v).length; } } });
  return true; })()`;
const AFTER = "new Promise((res) => requestAnimationFrame(() => setTimeout(() => res({ dt: performance.now() - window.__se.t0, sel: window.__se.sel, selN: window.__se.selN, html: window.__se.html, htmlN: window.__se.htmlN, htmlBytes: window.__se.htmlBytes }), 0)))";

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  for (const n of SIZES) {
    const id = `sec-${n}-${Date.now()}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: pageOf(n), createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(500);
    await ev(`(() => { localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 40000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(9000);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); if (document.activeElement !== ed) ed.focus({ preventScroll: true }); return true; })()");
    await ev(INSTRUMENT);
    const kinds = { letter: [], space: [], enter: [] };
    for (let round = 0; round < 14; round += 1) {
      for (const [kind, ch] of [['letter', 'a'], ['letter', 'b'], ['space', ' '], ['letter', 'c'], ['enter', '\n']]) {
        await app.typeKeys(ch);
        kinds[kind].push(await ev(AFTER));
        await sleep(60);
      }
    }
    // THE BROWSER'S OWN PROFILE of 24 keys of each kind: where the time goes (top self times, ms per key)
    for (const [kind, ch] of [['space', ' '], ['letter', 'a'], ['enter', String.fromCharCode(10)]]) {
      await app.cdp('Profiler.enable'); await app.cdp('Profiler.setSamplingInterval', { interval: 250 }); await app.cdp('Profiler.start');
      for (let i = 0; i < 24; i += 1) { await app.typeKeys(ch); await ev(AFTER); }
      const { profile } = await app.cdp('Profiler.stop'); await app.cdp('Profiler.disable');
      const self = new Map(); const byId = new Map(profile.nodes.map((nn) => [nn.id, nn]));
      profile.samples.forEach((id, i) => { const cf = byId.get(id).callFrame; const k = (cf.functionName || '(anonymous)') + ' ' + String(cf.url).split('/').pop() + ':' + (cf.lineNumber + 1); self.set(k, (self.get(k) || 0) + (profile.timeDeltas[i] || 0)); });
      const top = [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 9).map(([k, v]) => k + ' ' + (v / 24000).toFixed(1) + ' ms/key');
      console.log('PROFILE ' + n + 'w ' + kind + ': ' + top.join(' | '));
    }
    for (const [kind, rows] of Object.entries(kinds)) {
      const dts = rows.map((r) => r.dt); const sels = rows.map((r) => r.sel); const htmls = rows.map((r) => r.html);
      console.log(`PROBE ${n}w ${kind}: key-to-frame median ${f1(q(dts, 0.5))} p95 ${f1(q(dts, 0.95))} | selection calls median ${f1(q(sels, 0.5))} ms (n ${f1(q(rows.map((r) => r.selN), 0.5))}) p95 ${f1(q(sels, 0.95))} | innerHTML median ${f1(q(htmls, 0.5))} ms (writes ${f1(q(rows.map((r) => r.htmlN), 0.5))}, bytes ${f1(q(rows.map((r) => r.htmlBytes), 0.5))}) | total selection over ${rows.length} keys ${f1(sels.reduce((a, b) => a + b, 0))} ms`);
    }
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); }
console.log('\nSPACE-ENTER-COST DONE (a measurement: it never fails)');
