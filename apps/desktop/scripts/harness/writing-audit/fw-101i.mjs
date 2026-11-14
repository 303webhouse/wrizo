// BUG #101 - THE BOX TURN FOR THE INK-CANVAS FIX: Enter and letter cost in Free Write by page size, on a page WITHOUT ink and on a page WITH ink (six pen strokes near the top, seeded into the page). A MEASUREMENT: it prints numbers and passes nothing.
// Fable's bar for the fix (Nov 14, 3:58 pm): Enter median <= 35 ms at 5,000 words and <= 60 ms at 12,000 (no ink), and a page WITH ink no worse than main (the same file, run on the main tree). WA_INK=0 or 1 (default both, no-ink first). 30 letters and 30 Enters per size.
// Output: `FW101I {json}` per size and ink state: enter/letter median and p95 (keydown to the end of the next frame). Run: node scripts/harness/writing-audit/fw-101i.mjs (from apps/desktop, dist-web built; env WA_THEME plateau|flux|machina).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const WORDS = (env.WA_WORDS || '500,5000,12000,20000').split(',').map(Number).filter((x) => x > 0);
const INKS = env.WA_INK === '0' ? [false] : env.WA_INK === '1' ? [true] : [false, true];
const N = Number(env.WA_KEYS || 30);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const NL = String.fromCharCode(10);
const pageText = (words) => { const per = PARA.split(' ').length - 1; const lines = []; for (let i = 0; i < Math.ceil(words / per); i += 1) lines.push(PARA.trim()); return lines.join(NL); };
const pct = (xs, p) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };
// six wavy strokes near the top of the page (points are fractions of the sheet's width)
const STROKES = Array.from({ length: 6 }, (_, k) => ({ points: Array.from({ length: 24 }, (_, i) => ({ x: 0.08 + i * 0.035, y: 0.03 + k * 0.025 + Math.sin(i / 3 + k) * 0.008, p: 0.5 })) }));

let unreachable = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`FW101I-HEAD [${TAG}] (${new Date().toISOString()}) words=${WORDS.join(',')} ink=${INKS.join(',')} keys=${N}`);
  await d.boot();
  const ev = d.ev;
  for (const ink of INKS) {
    for (const words of WORDS) {
      const text = pageText(words);
      try { await d.openFreeWrite(text, ink ? { strokes: STROKES } : {}); } catch (e) { console.log(`FW101I-ERR ink=${ink} ${words} words: ${String(e && e.message || e).slice(0, 200)}`); unreachable = true; continue; }
      await d.place(text.length); await sleep(600);
      const canvas = await ev(`(() => { const c = document.querySelector('.ink-committed'); return c ? c.width + 'x' + c.height : 'none'; })()`);
      await ev(`(() => {
        const ed = document.querySelector('.forward-only-editor'); ed.focus();
        const L = window.__l101i = { letter: [], enter: [] };
        const onKey = (e) => { const k = e.key === 'Enter' ? 'enter' : 'letter'; const start = performance.now(); requestAnimationFrame(() => setTimeout(() => { L[k].push(performance.now() - start); }, 0)); };
        window.addEventListener('keydown', onKey, true); L.stop = () => window.removeEventListener('keydown', onKey, true);
      })()`);
      for (let i = 0; i < N; i += 1) { await d.type('a'); await sleep(120); }
      for (let i = 0; i < N; i += 1) { await d.key('Enter'); await sleep(150); await d.type('b'); await sleep(120); }
      await sleep(500);
      const L = await ev('(() => { const L = window.__l101i; L.stop(); return { letter: L.letter, enter: L.enter }; })()');
      const row = { theme: cfg.theme, ink, words, canvasAtStart: canvas, letter_median: pct(L.letter.slice(0, N), 0.5), letter_p95: pct(L.letter.slice(0, N), 0.95), enter_median: pct(L.enter, 0.5), enter_p95: pct(L.enter, 0.95), n: { letter: L.letter.length, enter: L.enter.length } };
      console.log(`FW101I ${JSON.stringify(row)}`);
    }
  }
});
process.exitCode = unreachable ? 1 : 0;
