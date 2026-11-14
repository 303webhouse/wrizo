// BUG #101 - THE 65,536 LEAD (Fable, Nov 14): Chrome's HTML parser splits a text node at 65,536 characters when innerHTML is set. A MEASUREMENT, not a check: it prints numbers and passes nothing (exit 1 only if the page could not be reached).
// For each page size IN CHARACTERS (default 60000, 64000, 65000, 65535, 65536, 65537, 66000, 68000, 70000, 73000) this opens Free Write on that text and prints how many text nodes the editor holds, the length of the longest ones, the number of
// child elements, and the Enter cost (keydown -> end of the next frame, and the long-animation-frame's layout part; 15 Enters). One line per size: `FW101T {json}`.
// Run: on Actions via writing-audit.yml, script=fw-101t.mjs, one theme per config.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const SIZES = (env.WA_CHARS || '60000,64000,65000,65535,65536,65537,66000,68000,70000,73000').split(',').map(Number).filter((x) => x > 0);
const N = Number(env.WA_KEYS || 15);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all.';
const NL = String.fromCharCode(10);
const pageText = (chars) => { const lines = []; let len = 0; while (len < chars) { lines.push(PARA); len += PARA.length + 1; } return lines.join(NL).slice(0, chars); };
const pct = (xs, p) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };

let unreachable = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`FW101T-HEAD [${TAG}] (${new Date().toISOString()}) chars=${SIZES.join(',')} keys=${N}`);
  await d.boot();
  const ev = d.ev;
  for (const chars of SIZES) {
    const text = pageText(chars);
    try { await d.openFreeWrite(text); } catch (e) { console.log(`FW101T-ERR ${chars} chars: ${String(e && e.message || e).slice(0, 200)}`); unreachable = true; continue; }
    await d.place(text.length); await sleep(600);
    const nodes = await ev(`(() => {
      const ed = document.querySelector('.forward-only-editor');
      const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const lens = []; let n; while ((n = w.nextNode())) lens.push(n.data.length);
      const top = [...lens].sort((a, b) => b - a).slice(0, 4);
      return { textNodes: lens.length, longest: top, total: lens.reduce((a, b) => a + b, 0), elements: ed.querySelectorAll('*').length, children: ed.children.length };
    })()`);
    await ev(`(() => {
      const ed = document.querySelector('.forward-only-editor'); ed.focus();
      const L = window.__l101t = { paint: [], layout: [] };
      const onKey = (e) => { if (e.key !== 'Enter') return; const start = performance.now(); requestAnimationFrame(() => setTimeout(() => { L.paint.push(performance.now() - start); }, 0)); };
      window.addEventListener('keydown', onKey, true);
      let po = null; try { po = new PerformanceObserver((list) => { for (const e of list.getEntries()) L.layout.push(e.styleAndLayoutStart ? (e.startTime + e.duration) - e.styleAndLayoutStart : null); }); po.observe({ type: 'long-animation-frame', buffered: false }); } catch (e) { /* no LoAF */ }
      L.stop = () => { window.removeEventListener('keydown', onKey, true); if (po) po.disconnect(); };
    })()`);
    for (let i = 0; i < N; i += 1) { await d.key('Enter'); await sleep(120); await d.type('b'); await sleep(120); }
    await sleep(500);
    const L = await ev('(() => { const L = window.__l101t; L.stop(); return { paint: L.paint, layout: L.layout }; })()');
    const row = { theme: cfg.theme, chars, ...nodes, enterPaint_median: pct(L.paint, 0.5), enterPaint_max: pct(L.paint, 1), layout_median: pct(L.layout, 0.5), loafN: L.layout.length, n: L.paint.length };
    console.log(`FW101T ${JSON.stringify(row)}`);
  }
});
process.exitCode = unreachable ? 1 : 0;
