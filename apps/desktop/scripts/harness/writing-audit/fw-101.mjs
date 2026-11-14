// BUG #101 - WHY IS ENTER IN FREE WRITE SLOWER TO PAINT AT 5,000 WORDS THAN AT 20,000? A MEASUREMENT, not a check; it prints numbers and passes nothing (exit 1 only if the page could not be reached).
// fw-latency.mjs (#99) found: Enter paints in 110-220 ms at 5,000 words in every theme and every run (A1, B, A2, all on Actions), but 32-54 ms at 20,000, while the editor's own DOM change after the key is 6 ms at 5,000 (so the time is after the handler).
// This repeats the probe with the three things that could explain it kept apart:
//   ORDER      sizes run ascending (default) or descending (fw-101r.mjs): if the slow size follows the order, it is state left behind by the earlier size (the probe's own listeners, heap), not the size.
//   WHAT FRAME the browser's long-animation-frame entries for each phase (letters, then Enters): how long the frame was, the script part (start to renderStart), the style-and-layout part, the rest (paint and composite).
//   SCROLL     scroll events and the scroller's scrollTop change in the 300 ms after each Enter (a scroll that follows Enter to keep the caret in view).
// plus a size sweep (WA_WORDS, default 500,2000,3500,5000,8000,12000,20000) and the same Enter with Shift (a soft break) as a control for "Enter makes a new paragraph".
// One line per size: `FW101 {json}`. Run: on Actions via writing-audit.yml, script=fw-101.mjs (or fw-101r.mjs), one theme per config.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const WORDS = (env.WA_WORDS || '500,2000,3500,5000,8000,12000,20000').split(',').map(Number).filter((x) => x > 0);
const N = Number(env.WA_KEYS || 30);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const NL = String.fromCharCode(10);
const pageText = (words) => { const per = PARA.split(' ').length - 1; const lines = []; for (let i = 0; i < Math.ceil(words / per); i += 1) lines.push(PARA.trim()); return lines.join(NL); };
const pct = (xs, p) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };

let unreachable = false;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`FW101-HEAD [${TAG}] (${new Date().toISOString()}) words=${WORDS.join(',')} keys=${N}`);
  await d.boot();
  const ev = d.ev;
  for (const words of WORDS) {
    const text = pageText(words);
    try { await d.openFreeWrite(text); } catch (e) { console.log(`FW101-ERR ${words} words: ${String(e && e.message || e).slice(0, 200)}`); unreachable = true; continue; }
    await d.place(text.length); await sleep(600);
    // one set of listeners per size, removed at the end of it (the #99 probe left its listeners on the window from size to size)
    await ev(`(() => {
      const ed = document.querySelector('.forward-only-editor'); ed.focus();
      let sc = ed; while (sc && sc !== document.documentElement && !(sc.scrollHeight > sc.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
      const L = window.__l101 = { phase: 'letter', paint: { letter: [], enter: [], soft: [] }, dom: { letter: [], enter: [], soft: [] }, loaf: { letter: [], enter: [], soft: [] }, scroll: { enter: [], soft: [] }, scroller: sc ? (sc.className || sc.tagName) : null, h0: sc ? sc.scrollHeight : null, off: [] };
      let t0 = null, kind = null, seen = true, sEv = 0;
      const onKey = (e) => { t0 = performance.now(); kind = e.key === 'Enter' ? (e.shiftKey ? 'soft' : 'enter') : 'letter'; seen = false; sEv = 0; const k = kind, start = t0, st0 = sc ? sc.scrollTop : 0;
        requestAnimationFrame(() => setTimeout(() => { L.paint[k].push(performance.now() - start); }, 0));
        if (k !== 'letter') setTimeout(() => { L.scroll[k].push({ events: sEv, dTop: sc ? Math.round(sc.scrollTop - st0) : null }); }, 300); };
      const onScroll = () => { sEv += 1; };
      window.addEventListener('keydown', onKey, true); document.addEventListener('scroll', onScroll, true);
      const mo = new MutationObserver(() => { if (seen || t0 === null) return; seen = true; L.dom[kind].push(performance.now() - t0); });
      mo.observe(ed, { childList: true, characterData: true, subtree: true });
      let po = null;
      try { po = new PerformanceObserver((list) => { for (const e of list.getEntries()) { const sc2 = (e.scripts || []).reduce((a, s) => a + s.duration, 0);
        L.loaf[L.phase].push({ dur: e.duration, block: e.blockingDuration, script: (e.renderStart || e.startTime) - e.startTime, layout: e.styleAndLayoutStart ? (e.startTime + e.duration) - e.styleAndLayoutStart : null, render: e.renderStart ? (e.startTime + e.duration) - e.renderStart : null, scripts: Math.round(sc2) }); } });
        po.observe({ type: 'long-animation-frame', buffered: false }); } catch (e) { L.loafErr = String(e && e.message || e); }
      L.stop = () => { window.removeEventListener('keydown', onKey, true); document.removeEventListener('scroll', onScroll, true); mo.disconnect(); if (po) po.disconnect(); };
    })()`);
    for (let i = 0; i < N; i += 1) { await d.type('a'); await sleep(90); }
    await sleep(300); await ev("window.__l101.phase = 'enter'");
    for (let i = 0; i < N; i += 1) { await d.key('Enter'); await sleep(90); await d.type('b'); await sleep(90); }
    await sleep(400); await ev("window.__l101.phase = 'soft'");
    for (let i = 0; i < N; i += 1) { await d.key('Enter', { shift: true }); await sleep(90); await d.type('c'); await sleep(90); }
    await sleep(700);
    const L = await ev('(() => { const L = window.__l101; L.stop(); L.h1 = L.scroller ? 1 : null; return { paint: L.paint, dom: L.dom, loaf: L.loaf, scroll: L.scroll, scroller: L.scroller, h0: L.h0, loafErr: L.loafErr || null }; })()');
    const chars = await ev(`document.querySelector('.forward-only-editor').textContent.length`);
    const loafSum = (arr) => ({ n: arr.length, dur_median: pct(arr.map((x) => x.dur), 0.5), dur_max: pct(arr.map((x) => x.dur), 1), script_median: pct(arr.map((x) => x.script), 0.5), layout_median: pct(arr.map((x) => x.layout), 0.5), render_median: pct(arr.map((x) => x.render), 0.5), scripts_median: pct(arr.map((x) => x.scripts), 0.5) });
    const scrollSum = (arr) => ({ events_median: pct(arr.map((x) => x.events), 0.5), dTop_median: pct(arr.map((x) => x.dTop), 0.5) });
    const row = { theme: cfg.theme, words, chars, order: WORDS.join('>'), scroller: L.scroller, loafErr: L.loafErr,
      letterPaint_median: pct(L.paint.letter.slice(0, N), 0.5), enterPaint_median: pct(L.paint.enter, 0.5), enterPaint_p95: pct(L.paint.enter, 0.95), softPaint_median: pct(L.paint.soft, 0.5), softPaint_p95: pct(L.paint.soft, 0.95),
      enterDom_median: pct(L.dom.enter, 0.5), softDom_median: pct(L.dom.soft, 0.5),
      loafLetter: loafSum(L.loaf.letter), loafEnter: loafSum(L.loaf.enter), loafSoft: loafSum(L.loaf.soft), scrollEnter: scrollSum(L.scroll.enter), scrollSoft: scrollSum(L.scroll.soft),
      n: { letter: L.paint.letter.length, enter: L.paint.enter.length, soft: L.paint.soft.length } };
    console.log(`FW101 ${JSON.stringify(row)}`);
  }
});
process.exitCode = unreachable ? 1 : 0;
