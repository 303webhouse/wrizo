// FREE WRITE - THE PER-KEY COST OF THE WHOLE PAGE (Fable, Nov 19, 11:05 am: "GO on Free Write's whole-page decorate (#85's remainder): measure first, then a red-first fix"). A MEASUREMENT, not a verdict.
// Free Write (ForwardOnlyEditor, mode 'journal') renders `content.map(run => decorateMarkdownForCard(run.text))` in its render body, and `force()` runs on EVERY key (changed() in handleInput), so a
// letter re-decorates the whole page and React sets the editable's innerHTML again (the string changed: the active word is part of it).
// For pages of 500 / 5 000 / 20 000 / 50 000 words (the page open in Free Write, caret at the tip), real CDP keys: a letter, a space (commits a word), Enter; each read from the keydown to the frame after it
// (rAF + a task), and the editable's own innerHTML assignment time (instrumented). Prints one line per size and key class: median, p95 over the keys.
// Run: on Actions (harness.yml, files=freewrite-perkey-measure.mjs). Not a box turn locally.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 40 + (i % 90); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const SIZES = (process.env.FW_SIZES || '500,5000,20000,50000').split(',').map(Number);
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');

const INSTRUMENT = `(() => {
  if (window.__fwInst) return true; window.__fwInst = true;
  window.__fwIH = 0; window.__fwT0 = 0;
  document.addEventListener('keydown', () => { window.__fwT0 = performance.now(); window.__fwIH = 0; }, true);
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, get: d.get, set(v) { if (this.classList && this.classList.contains('forward-only-editor')) { const t = performance.now(); d.set.call(this, v); window.__fwIH += performance.now() - t; window.__fwLen = String(v).length; } else d.set.call(this, v); } });
  return true; })()`;
const AFTER = "new Promise((res) => requestAnimationFrame(() => setTimeout(() => res({ dt: performance.now() - window.__fwT0, ih: window.__fwIH, len: window.__fwLen || 0 }), 0)))";

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  for (const words of SIZES) {
    const PAGE = 'fwm-' + words;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: PAGE, text: pageOf(words), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${PAGE}', 'journal')`);
    await sleep(500);
    await app.evalJs(`location.hash = '#/page/${PAGE}'`);
    const up = await waitSoft(app, `!!document.querySelector('${ED}') && document.querySelector('${ED}').textContent.length > ${Math.min(words * 3, 1000)}`, { label: `the ${words}-word page in Free Write`, timeout: 30000 });
    if (!up) { console.log(`FWKEY words=${words} the page did not open`); continue; }
    await sleep(1500);
    await app.evalJs(INSTRUMENT);
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    await sleep(300);
    const rows = { letter: [], space: [], enter: [] };
    const ih = { letter: [], space: [], enter: [] };
    let lenAt = 0;
    const one = async (cls, ch) => {
      await app.typeKeys(ch);
      const r = await app.evalJs(AFTER);
      rows[cls].push(r.dt); ih[cls].push(r.ih); lenAt = r.len;
    };
    for (let i = 0; i < 12; i += 1) await one('letter', 'abcdefghijkl'[i]);     // warm
    rows.letter.length = 0; ih.letter.length = 0;
    for (let i = 0; i < 40; i += 1) await one('letter', 'xyzabcdefg'[i % 10]);
    for (let i = 0; i < 20; i += 1) { await one('space', ' '); for (const c of 'ab') await one('letter', c); }
    rows.letter.length = 0; ih.letter.length = 0;
    for (let i = 0; i < 40; i += 1) await one('letter', 'mnopqrstuv'[i % 10]);
    for (let i = 0; i < 20; i += 1) { await one('enter', '\n'); for (const c of 'ab') await one('letter', c); }
    // the browser's own profile of 40 letters at this size: the top self-time functions (JS only; "(program)" is the browser's own layout, style and paint)
    if (words >= 20000) {
      await app.cdp('Profiler.enable'); await app.cdp('Profiler.setSamplingInterval', { interval: 250 }); await app.cdp('Profiler.start');
      for (let i = 0; i < 40; i += 1) await one('letter', 'pqrstuvwxy'[i % 10]);
      const { profile } = await app.cdp('Profiler.stop'); await app.cdp('Profiler.disable');
      const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n]));
      profile.samples.forEach((id, i) => { const n = byId.get(id); const cf = n.callFrame; const k = `${cf.functionName || '(anonymous)'} ${String(cf.url).split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (profile.timeDeltas[i] || 0)); });
      const total = [...self.values()].reduce((x, y) => x + y, 0) || 1;
      const top = [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k, v]) => `${k} ${(v / 40000).toFixed(1)} ms/key (${Math.round((100 * v) / total)}%)`);
      console.log(`FWPROFILE words=${words} per key, self time: ${top.join(' | ')}`);
    }
    const line = (cls) => `${cls} n=${rows[cls].length} key-to-frame median ${f1(q(rows[cls], 0.5))} ms p95 ${f1(q(rows[cls], 0.95))} ms; editable innerHTML median ${f1(q(ih[cls], 0.5))} ms p95 ${f1(q(ih[cls], 0.95))} ms`;
    console.log(`FWKEY words=${words} html=${lenAt} chars | ${line('letter')} | ${line('space')} | ${line('enter')}`);
    await app.evalJs("location.hash = '#/'"); await sleep(800);
  }
});
console.log('FREEWRITE-MEASURE: PASS (a measurement; the lines above are the result)');
