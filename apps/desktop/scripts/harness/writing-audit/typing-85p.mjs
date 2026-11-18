// BUG #85 - WHERE DOES A LETTER IN DRAFT SPEND ITS TIME AT 20,000 AND 50,000 WORDS? (the browser's own sampling profile, CDP Profiler, over 20 letters per size; a MEASUREMENT, it passes nothing). Derived from fw-101p.mjs (#101). Surface: WA_SURFACE draft (default) or free. Output: FW101P lines (js / program (layout, paint, style) / idle per key and the top JS self-time functions).
// The box (Nov 14, fw-101.mjs on the live tree): Enter paints in 87 ms (5,000 words), 191 ms (8,000), 275 ms (12,000), and 33 ms at 20,000; a letter at the same sizes costs 19-47 ms. The long-animation-frame entries show ONE frame of 50-110 ms per Enter, so most of the
// time is not in a frame. This runs the browser's own sampling profiler (CDP Profiler) over 20 Enters at each size (default 5000, 12000, 20000 words; env WA_WORDS) and prints, per size:
//   FW101P {json}   the profile's span, how much of it the main thread was idle, in GC, in "(program)" (the browser's own work: layout, paint, style), and in JS, then the ten JS functions with the most SELF time (name, file:line, ms per Enter).
// The same is run over 20 LETTERS for the size, so the Enter's extra cost is the difference. Run: on Actions via writing-audit.yml, script=fw-101p.mjs, one theme per config; on the box with run-box-3.sh when asked for.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const WORDS = (env.WA_WORDS || '5000,20000,50000').split(',').map(Number).filter((x) => x > 0);
const N = Number(env.WA_KEYS || 20);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const NL = String.fromCharCode(10);
const pageText = (words) => { const per = PARA.split(' ').length - 1; const lines = []; for (let i = 0; i < Math.ceil(words / per); i += 1) lines.push(PARA.trim()); return lines.join(NL); };

const summarise = (profile, keys) => {
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map(); let total = 0;
  const t = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i += 1) { const dt = (t[i + 1] ?? t[i] ?? 0) / 1000; total += dt; self.set(profile.samples[i], (self.get(profile.samples[i]) || 0) + dt); }
  const byFn = new Map(); const special = { idle: 0, gc: 0, program: 0, root: 0, js: 0 };
  for (const [id, ms] of self) {
    const cf = nodes.get(id).callFrame; const nm = cf.functionName || '(anonymous)';
    if (nm === '(idle)') special.idle += ms; else if (nm === '(garbage collector)') special.gc += ms; else if (nm === '(program)') special.program += ms; else if (nm === '(root)') special.root += ms;
    else { special.js += ms; const k = `${nm} ${String(cf.url || '').split('/').pop()}:${cf.lineNumber + 1}:${cf.columnNumber + 1}`; byFn.set(k, (byFn.get(k) || 0) + ms); where.set(k, { scriptId: cf.scriptId, line: cf.lineNumber, col: cf.columnNumber }); }
  }
  const r1 = (x) => Math.round(x * 10) / 10;
  return { spanMs: r1(total), idleMs: r1(special.idle), gcMs: r1(special.gc), programMs: r1(special.program), jsMs: r1(special.js),
    perKey: { spanMs: r1(total / keys), jsMs: r1(special.js / keys), programMs: r1(special.program / keys), idleMs: r1(special.idle / keys) },
    top: [...byFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, ms]) => ({ fn: k, msPerKey: r1(ms / keys), at: where.get(k) })) };
};
const where = new Map();   // function key -> where it stands in the script (so its source text can be read back)

let unreachable = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`FW101P-HEAD [${TAG}] (${new Date().toISOString()}) words=${WORDS.join(',')} keys=${N}`);
  await d.boot();
  const cdp = app.cdp;
  for (const words of WORDS) {
    const text = pageText(words);
    try { if (env.WA_SURFACE === 'free') await d.openFreeWrite(text); else await d.openPage(text, 'drafting'); } catch (e) { console.log(`FW101P-ERR ${words} words: ${String(e && e.message || e).slice(0, 200)}`); unreachable = true; continue; }
    await d.place(text.length); await d.ev(`document.querySelector('.forward-only-editor').focus()`); await sleep(800);
    const row = { theme: cfg.theme, words };
    for (const kind of ['letter']) {
      // a few warm-up keys outside the profile
      for (let i = 0; i < 3; i += 1) { if (kind === 'enter') await d.key('Enter'); else await d.type('a'); await sleep(120); }
      await cdp('Profiler.enable'); await cdp('Profiler.setSamplingInterval', { interval: 250 }); await cdp('Profiler.start');
      for (let i = 0; i < N; i += 1) { if (kind === 'enter') await d.key('Enter'); else await d.type('a'); await sleep(150); }
      const { profile } = await cdp('Profiler.stop'); await cdp('Profiler.disable');
      row[kind] = summarise(profile, N);
      // the source text at each of the top functions (the bundle is minified: the text names what the function does)
      try {
        await cdp('Debugger.enable');
        const cache = {};
        for (const t of row[kind].top.slice(0, 6)) {
          if (!t.at || !t.at.scriptId) continue;
          if (!cache[t.at.scriptId]) cache[t.at.scriptId] = ((await cdp('Debugger.getScriptSource', { scriptId: t.at.scriptId })).scriptSource || '').split(String.fromCharCode(10));
          const ln = cache[t.at.scriptId][t.at.line] || '';
          t.src = ln.slice(t.at.col, t.at.col + 420);
        }
        await cdp('Debugger.disable');
      } catch (e) { row[kind].srcError = String(e && e.message || e).slice(0, 120); }
      await sleep(400);
    }
    console.log(`FW101P ${JSON.stringify(row)}`);
  }
});
process.exitCode = unreachable ? 1 : 0;
