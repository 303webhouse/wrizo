// BUG #99 - A FREE WRITE KEYSTROKE SPEED PROBE. A MEASUREMENT, not a check: it prints numbers and passes nothing (it exits 1 only if the page or the editor could not be reached).
// The speed probes of the standing work (scripts/typing-latency-probe.mjs and typing-latency-account.mjs) measure Draft. Free Write is the same page in forward-only mode (ForwardOnlyEditor.tsx, mode `journal`): it draws its runs by innerHTML
// on every key, so a change to that builder (#70's guard character) is a change to the keystroke path no Draft probe can see. This measures, per page size, in Free Write, with real CDP keys:
//   letter  keydown -> the first change the editor makes to its own DOM (a MutationObserver on the editor; it answers after the key's handler has run)
//   enter   the same for Enter (the line after a lone Enter is where #70's guard is drawn)
//   paint   keydown -> the end of the next animation frame (what the writer sees), for letters and for Enters
// 40 letters and 40 Enters per size (default 500, 5000, 20000 words; env WA_WORDS), median and p95 in milliseconds. One line per size: `FWLAT {json}`; the table at the end is for reading.
// A, B, A: run the same file on two trees (A = without the change, B = with it) in the order A1, B, A2, then fw-latency-bar.mjs reads the three logs and applies the bar (B's median within 1 ms or 10% of A's, whichever is larger, against both A runs;
// B's p95 above neither A run's p95 by more than the gap between the two A runs' p95).
// Run: node scripts/harness/writing-audit/fw-latency.mjs (from apps/desktop, dist-web built; on Actions via writing-audit.yml, script=fw-latency.mjs, one theme per config)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const WORDS = (env.WA_WORDS || '500,5000,20000').split(',').map(Number).filter((x) => x > 0);
const N = Number(env.WA_KEYS || 40);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const NL = String.fromCharCode(10);
const pageText = (words) => { const per = PARA.split(' ').length - 1; const lines = []; for (let i = 0; i < Math.ceil(words / per); i += 1) lines.push(PARA.trim()); return lines.join(NL); };
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };

let unreachable = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`FWLAT-HEAD [${TAG}] (${new Date().toISOString()}) words=${WORDS.join(',')} keys=${N}`);
  await d.boot();
  const ev = d.ev;
  const rows = [];
  for (const words of WORDS) {
    const text = pageText(words);
    try { await d.openFreeWrite(text); } catch (e) { console.log(`FWLAT-ERR ${words} words: ${String(e && e.message || e).slice(0, 200)}`); unreachable = true; continue; }
    await d.place(text.length); await sleep(600);
    await ev(`(() => {
      const ed = document.querySelector('.forward-only-editor'); ed.focus();
      window.__lat = { letter: [], enter: [], paintLetter: [], paintEnter: [] };
      let t0 = null, kind = null, seen = true;
      window.addEventListener('keydown', (e) => { t0 = performance.now(); kind = e.key === 'Enter' ? 'enter' : 'letter'; seen = false;
        const k = kind, start = t0;
        requestAnimationFrame(() => setTimeout(() => { (k === 'enter' ? window.__lat.paintEnter : window.__lat.paintLetter).push(performance.now() - start); }, 0)); }, true);
      new MutationObserver(() => { if (seen || t0 === null) return; seen = true; window.__lat[kind].push(performance.now() - t0); }).observe(ed, { childList: true, characterData: true, subtree: true });
    })()`);
    for (let i = 0; i < N; i += 1) { await d.type('a'); await sleep(90); }
    for (let i = 0; i < N; i += 1) { await d.key('Enter'); await sleep(90); await d.type('b'); await sleep(90); }
    await sleep(600);
    const lat = await ev('window.__lat');
    const chars = await ev(`document.querySelector('.forward-only-editor').textContent.length`);
    // the letters typed after an Enter are part of the Enter's cost; only the 40 letters of the first loop and the 40 Enters are read
    const row = { theme: cfg.theme, words, chars, letter_median: pct(lat.letter.slice(0, N), 0.5), letter_p95: pct(lat.letter.slice(0, N), 0.95), enter_median: pct(lat.enter, 0.5), enter_p95: pct(lat.enter, 0.95),
      paintLetter_median: pct(lat.paintLetter.slice(0, N), 0.5), paintLetter_p95: pct(lat.paintLetter.slice(0, N), 0.95), paintEnter_median: pct(lat.paintEnter, 0.5), paintEnter_p95: pct(lat.paintEnter, 0.95),
      n: { letter: lat.letter.length, enter: lat.enter.length } };
    rows.push(row);
    console.log(`FWLAT ${JSON.stringify(row)}`);
  }
  console.log(`\nFREE WRITE LATENCY (ms, ${TAG}, caret at the end):`);
  for (const r of rows) console.log(`  ${String(r.words).padStart(6)} words (${r.chars} chars): letter ${r.letter_median} / p95 ${r.letter_p95};  enter ${r.enter_median} / p95 ${r.enter_p95};  paint letter ${r.paintLetter_median} / p95 ${r.paintLetter_p95};  paint enter ${r.paintEnter_median} / p95 ${r.paintEnter_p95}`);
});
process.exitCode = unreachable ? 1 : 0;
