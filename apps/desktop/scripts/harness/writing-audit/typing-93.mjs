// BUG #93 CONDITION (Fable, Nov 18): the fix is one `:has()` rule on :root, which the browser checks against the whole page; the Free Write and Draft typing speed must not move. A MEASUREMENT: it prints numbers and passes nothing (exit 1 only if a page could not be reached).
// In Flux (env WA_THEME, WA_TONE) it types 40 letters and 40 Enters at 500, 5,000 and 12,000 words in Free Write and in Draft, with real CDP keys, and prints the median and p95 of keydown -> the end of the next frame (what the writer sees) and keydown -> the editor's own DOM change.
// Run on main and on the fix (same file on both): `TYPING93 {json}` per surface and size. Run: on Actions via writing-audit.yml, script=typing-93.mjs, config flux/off/light/1366.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'flux', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const WORDS = (env.WA_WORDS || '500,5000,12000').split(',').map(Number).filter((x) => x > 0);
const N = Number(env.WA_KEYS || 40);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const NL = String.fromCharCode(10);
const pageText = (words) => { const per = PARA.split(' ').length - 1; const lines = []; for (let i = 0; i < Math.ceil(words / per); i += 1) lines.push(PARA.trim()); return lines.join(NL); };
const pct = (xs, p) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };

let unreachable = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  for (const surface of ['free', 'draft']) {
    for (const words of WORDS) {
      const text = pageText(words);
      try { if (surface === 'free') await d.openFreeWrite(text); else await d.openPage(text, 'drafting'); } catch (e) { console.log(`TYPING93-ERR ${surface} ${words}: ${String(e && e.message || e).slice(0, 160)}`); unreachable = true; continue; }
      await d.place(text.length); await sleep(600);
      await d.ev(`(() => {
        const ed = document.querySelector('.forward-only-editor'); ed.focus();
        const L = window.__t93 = { paintL: [], paintE: [], domL: [], domE: [] };
        let t0 = null, kind = null, seen = true;
        const onKey = (e) => { t0 = performance.now(); kind = e.key === 'Enter' ? 'E' : 'L'; seen = false; const k = kind, s = t0; requestAnimationFrame(() => setTimeout(() => { L['paint' + k].push(performance.now() - s); }, 0)); };
        window.addEventListener('keydown', onKey, true);
        const mo = new MutationObserver(() => { if (seen || t0 === null) return; seen = true; L['dom' + kind].push(performance.now() - t0); });
        mo.observe(ed, { childList: true, characterData: true, subtree: true });
        L.stop = () => { window.removeEventListener('keydown', onKey, true); mo.disconnect(); };
      })()`);
      for (let i = 0; i < N; i += 1) { await d.type('a'); await sleep(110); }
      for (let i = 0; i < N; i += 1) { await d.key('Enter'); await sleep(140); await d.type('b'); await sleep(110); }
      await sleep(500);
      const L = await d.ev('(() => { const L = window.__t93; L.stop(); return { paintL: L.paintL, paintE: L.paintE, domL: L.domL, domE: L.domE }; })()');
      const row = { theme: cfg.theme, tone: cfg.tone, surface, words, letterPaint_median: pct(L.paintL.slice(0, N), 0.5), letterPaint_p95: pct(L.paintL.slice(0, N), 0.95), enterPaint_median: pct(L.paintE, 0.5), enterPaint_p95: pct(L.paintE, 0.95),
        letterDom_median: pct(L.domL.slice(0, N), 0.5), letterDom_p95: pct(L.domL.slice(0, N), 0.95), enterDom_median: pct(L.domE, 0.5), enterDom_p95: pct(L.domE, 0.95), n: { letter: L.paintL.length, enter: L.paintE.length } };
      console.log(`TYPING93 ${JSON.stringify(row)}`);
    }
  }
});
process.exitCode = unreachable ? 1 : 0;
