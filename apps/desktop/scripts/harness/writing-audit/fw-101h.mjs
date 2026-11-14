// BUG #101 - THE HEIGHT QUESTION (Fable, Nov 14): is the page's drawn height near 16,384 px (a common limit for one drawn layer) either side of the Enter cliff? A MEASUREMENT, not a check: it prints numbers and passes nothing (exit 1 only if the page could not be reached).
// For each page size in CHARACTERS (default 60000, 66000, 68000, 69000, 70000, 72000) it opens Free Write on that text and prints: the editor's drawn height (px), the scroller's scrollHeight (px), the number of drawn lines (height / line pitch),
// the layer count is not readable from the page, so the Enter cost (keydown -> end of the next frame, 12 Enters) is printed beside the heights. One line per size: `FW101H {json}`.
// Run: on Actions via writing-audit.yml, script=fw-101h.mjs, one theme per config.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const SIZES = (env.WA_CHARS || '60000,66000,68000,69000,70000,72000').split(',').map(Number).filter((x) => x > 0);
const N = Number(env.WA_KEYS || 12);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all.';
const NL = String.fromCharCode(10);
const pageText = (chars) => { const lines = []; let len = 0; while (len < chars) { lines.push(PARA); len += PARA.length + 1; } return lines.join(NL).slice(0, chars); };
const pct = (xs, p) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };

let unreachable = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`FW101H-HEAD [${TAG}] (${new Date().toISOString()}) chars=${SIZES.join(',')} keys=${N}`);
  await d.boot();
  const ev = d.ev;
  for (const chars of SIZES) {
    const text = pageText(chars);
    try { await d.openFreeWrite(text); } catch (e) { console.log(`FW101H-ERR ${chars} chars: ${String(e && e.message || e).slice(0, 200)}`); unreachable = true; continue; }
    await d.place(text.length); await sleep(600);
    const geo = await ev(`(() => {
      const ed = document.querySelector('.forward-only-editor');
      let sc = ed; while (sc && sc !== document.documentElement && !(sc.scrollHeight > sc.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
      const cs = getComputedStyle(ed); const lh = parseFloat(cs.lineHeight) || null;
      const r = ed.getBoundingClientRect();
      return { editorH: Math.round(r.height), editorW: Math.round(r.width), scrollerH: sc ? sc.scrollHeight : null, scroller: sc ? (sc.className || sc.tagName) : null, lineH: lh ? Math.round(lh * 10) / 10 : null, lines: lh ? Math.round(r.height / lh) : null, transform: cs.transform, willChange: cs.willChange, contain: cs.contain };
    })()`);
    await ev(`(() => {
      const ed = document.querySelector('.forward-only-editor'); ed.focus();
      const L = window.__l101h = { paint: [] };
      const onKey = (e) => { if (e.key !== 'Enter') return; const start = performance.now(); requestAnimationFrame(() => setTimeout(() => { L.paint.push(performance.now() - start); }, 0)); };
      window.addEventListener('keydown', onKey, true); L.stop = () => window.removeEventListener('keydown', onKey, true);
    })()`);
    for (let i = 0; i < N; i += 1) { await d.key('Enter'); await sleep(120); await d.type('b'); await sleep(120); }
    await sleep(500);
    const L = await ev('(() => { const L = window.__l101h; L.stop(); return { paint: L.paint }; })()');
    const after = await ev(`(() => { const ed = document.querySelector('.forward-only-editor'); return Math.round(ed.getBoundingClientRect().height); })()`);
    console.log(`FW101H ${JSON.stringify({ theme: cfg.theme, chars, ...geo, editorHAfter: after, enterPaint_median: pct(L.paint, 0.5), n: L.paint.length })}`);
  }
});
process.exitCode = unreachable ? 1 : 0;
