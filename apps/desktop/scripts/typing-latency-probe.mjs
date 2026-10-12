// ITEM 211, THE OWNER'S QUEUE - TYPING LATENCY ON A LONG PAGE. A MEASUREMENT, not a check: it prints numbers and passes nothing.
// The page's editor reads `el.innerText` (a layout-forcing read of the WHOLE page) on every input and on every caret move - the 211
// controller's plainNow(), the snap, the reveal and the strip's marksAt each read it - and redecorates the whole page's HTML on every
// keystroke. On a long page that is the suspect. This measures, per page size, in Draft:
//   keystroke  keydown -> the end of the editor's own input work (a bubbling `input` listener on the document runs after the editor's)
//   to paint   keydown -> the next animation frame after that (what the writer sees)
//   caret move ArrowRight keydown -> the end of the selectionchange work it triggers (the next frame)
// 40 keystrokes and 40 arrow presses per size, real CDP keys; median and p95 in milliseconds.
// Run by hand on a granted box turn:  node scripts/typing-latency-probe.mjs   (from apps/desktop, dist-web built)
import { withHarness } from './runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const PARA = 'The writer keeps a **steady** pace through the *long* draft, and ~~nothing~~ __slows__ the page down at all. ';
const page = (words) => { const per = PARA.split(' ').length; const n = Math.ceil(words / per); const lines = []; for (let i = 0; i < n; i += 1) lines.push(PARA.repeat(1).trim()); return lines.join('\n'); };
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10 : null; };

await withHarness(async (app) => {
  const rows = [];
  for (const words of [500, 5000, 20000, 50000]) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    const text = page(words);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'lat', text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
    await sleep(800);
    await app.reload();
    await app.evalJs("location.hash = '#/page/lat'");
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page', timeout: 30000 });
    await sleep(1500);
    await app.click('Draft'); await sleep(3000);
    // caret in the MIDDLE of the page (the worst case for offset walks is not the end)
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0; const target = Math.floor(ed.textContent.length / 2);
      while ((n = w.nextNode())) { if (acc + n.data.length >= target && !(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) { const r = document.createRange(); r.setStart(n, target - acc); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return; } acc += n.data.length; } })()`);
    await sleep(500);
    await app.evalJs(`(() => {
      window.__lat = { key: [], paint: [], move: [] };
      let t0 = null, kind = null;
      window.addEventListener('keydown', (e) => { t0 = performance.now(); kind = e.key === 'ArrowRight' ? 'move' : 'key'; }, true);
      const done = () => { if (t0 === null) return; const t1 = performance.now(); const k = kind, start = t0; t0 = null;
        if (k === 'key') window.__lat.key.push(t1 - start);
        requestAnimationFrame(() => { (k === 'key' ? window.__lat.paint : window.__lat.move).push(performance.now() - start); }); };
      document.addEventListener('input', done);
      document.addEventListener('keyup', (e) => { if (e.key === 'ArrowRight') done(); });
    })()`);
    for (let i = 0; i < 40; i += 1) { await app.typeKeys('a'); await sleep(60); }
    for (let i = 0; i < 40; i += 1) { await app.key('ArrowRight'); await sleep(60); }
    await sleep(500);
    // SCROLL (Fable, 2026-10-12): the page's own scroller moved one line at a time, 20 steps, the caret collapsed (no heading pop) -
    // what each scroll costs: the page-wide innerText reads it triggers, and the time from the scroll to the end of its next frame.
    // Before the fix every scroll ran the full strip recompute (innerText + marksAt + heading level); after it, a scroll with no pop
    // shown does nothing at all.
    const scrollM = await app.evalJs(`(async () => {
      const scroll = document.querySelector('.mode-scroll'); const ed = document.querySelector('${ED}');
      if (!scroll || !ed) return null;
      const lh = parseFloat(getComputedStyle(ed).lineHeight) || 28;
      const it = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');
      let reads = 0;
      Object.defineProperty(HTMLElement.prototype, 'innerText', { configurable: true, set: it.set, get() { reads++; return it.get.call(this); } });
      const frame = () => new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0)));
      const times = [], perStep = [];
      try {
        scroll.scrollTop = Math.max(0, scroll.scrollTop - 20 * lh);
        await frame(); await new Promise((r) => setTimeout(r, 120));
        for (let i = 0; i < 20; i++) {
          const before = reads, t0 = performance.now();
          scroll.scrollTop += lh;
          await frame();
          times.push(performance.now() - t0);
          await new Promise((r) => setTimeout(r, 40));
          perStep.push(reads - before);
        }
      } finally { Object.defineProperty(HTMLElement.prototype, 'innerText', it); }
      const sorted = [...times].sort((a, b) => a - b);
      return { steps: times.length, innerTextReadsTotal: perStep.reduce((a, b) => a + b, 0), innerTextReadsPerStepMax: Math.max(...perStep),
        scrollToFrame_median: Math.round(sorted[Math.floor(sorted.length / 2)] * 10) / 10, scrollToFrame_p95: Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] * 10) / 10 };
    })()`);
    const lat = await app.evalJs('window.__lat');
    const chars = await app.evalJs(`document.querySelector('${ED}').textContent.length`);
    const row = { words, chars, keystroke_median: pct(lat.key, 0.5), keystroke_p95: pct(lat.key, 0.95), toPaint_median: pct(lat.paint, 0.5), toPaint_p95: pct(lat.paint, 0.95), caretMove_median: pct(lat.move, 0.5), caretMove_p95: pct(lat.move, 0.95), n: [lat.key.length, lat.paint.length, lat.move.length] };
    row.scroll = scrollM;
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  console.log('\nSCROLL (one line per step, 20 steps, no heading pop): page-wide innerText reads, and ms from the scroll to its next frame');
  for (const r of rows) console.log(`  ${String(r.words).padStart(6)} words: ${r.scroll ? `${r.scroll.innerTextReadsTotal} innerText reads in ${r.scroll.steps} scrolls (max ${r.scroll.innerTextReadsPerStepMax}/step); scroll-to-frame ${r.scroll.scrollToFrame_median} / p95 ${r.scroll.scrollToFrame_p95}` : 'n/a'}`);
  console.log('\nTYPING LATENCY (ms, Draft, caret mid-page):');
  for (const r of rows) console.log(`  ${String(r.words).padStart(6)} words (${r.chars} chars): keystroke ${r.keystroke_median} / p95 ${r.keystroke_p95};  to paint ${r.toPaint_median} / p95 ${r.toPaint_p95};  caret move ${r.caretMove_median} / p95 ${r.caretMove_p95}`);
});
