// SCROLL - MEASURE (#113 and #112; Fable, Nov 19, 7:55 and 8:10 pm). A MEASUREMENT, not a verdict. Two questions, one file.
//
// A (#113, ARBOR found it, on main too): "on a long page, Free Write's Typewriter glides slowly to the end after the page opens (~340 px/s, still moving 10 s later at 20k words)".
//   For 5k and 20k words, in each theme, Free Write with the Typewriter on: open the page (a sampler runs from the moment the address changes) and read, per look, the scroll position,
//   the scroll height, where the caret's line stands in the scroller, and the typewriter hook's own trace (mount, engage, step, land, wait counts).
// B (#112): "the scroll jump after a stroke on a long Free Write page". 3 000 words, Free Write, INK instrument, the Typewriter off and on: scroll to the middle, draw one pen stroke
//   (real CDP pen events), and read the scroll position every frame across the commit with a log of what changed in the editor's DOM and in the scroller's height.
// Run: on Actions (harness.yml, files=scroll-measure.mjs). Prints SCROLL-A and SCROLL-B lines.
import { withHarness } from '../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './writing-audit/lib/driver.mjs';

const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const ED = '.forward-only-editor';

// the sampler: one entry per animation frame once the scroller exists, [ms since it was installed, scrollTop, scrollHeight, clientHeight]
const SAMPLER = `(() => { window.__ss = []; window.__ssOn = true; const t0 = performance.now(); window.__ssT0 = t0;
  const tick = () => { if (!window.__ssOn) return; const sc = document.querySelector('.mode-scroll'); if (sc) window.__ss.push([Math.round(performance.now() - t0), Math.round(sc.scrollTop * 10) / 10, sc.scrollHeight, sc.clientHeight]); requestAnimationFrame(tick); };
  requestAnimationFrame(tick); return true; })()`;
const CARET_LINE = `(() => { const sc = document.querySelector('.mode-scroll'), ed = document.querySelector('${ED}'); if (!sc || !ed) return null; const r = document.createRange(); r.selectNodeContents(ed); const rs = [...r.getClientRects()].filter((x) => x.height > 4);
  const last = rs.length ? Math.max(...rs.map((x) => x.bottom)) : null; const s = sc.getBoundingClientRect(); return { lastLineBottomInScroller: last == null ? null : Math.round(last - s.top), clientHeight: sc.clientHeight, tw: sc.getAttribute('data-typewriter'), scrollTop: Math.round(sc.scrollTop), maxTop: sc.scrollHeight - sc.clientHeight }; })()`;

await withHarness(async (app) => {
  for (const theme of (process.env.SCROLL_THEMES || 'plateau,flux,machina').split(',')) {
    if (!THEMES[theme]) continue;
    const cfg = { theme, flag: 'off', tone: 'light', width: 1366, height: 768, out: null };
    const d = makeDriver(app, cfg);
    await d.boot();
    // ---- A: the open
    for (const words of (process.env.SCROLL_WORDS || '5000,20000').split(',').map(Number)) {
      try {
        const id = `sm-${theme}-${words}`;
        await d.ev(`location.hash = '#/'`); await sleep(200);
        await d.ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: pageOf(words), createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
        await d.ev(`localStorage.setItem('wrizo-mode-page-${id}', 'journal')`);
        await d.ev('window.__wzTwTrace = []');
        await d.ev(SAMPLER);
        await d.ev(`location.hash = '#/page/${id}'`);
        await sleep(25000);
        const look = await d.ev(`(() => { window.__ssOn = false; const s = window.__ss; const at = (ms) => { let best = null; for (const e of s) if (e[0] <= ms) best = e; return best; };
          const T = window.__wzTwTrace || []; const n = {}; for (const e of T) n[e.d] = (n[e.d] || 0) + 1;
          let lastMove = 0, maxV = 0; for (let i = 1; i < s.length; i += 1) { const dy = Math.abs(s[i][1] - s[i - 1][1]); const dt = s[i][0] - s[i - 1][0]; if (dy > 0.5) lastMove = s[i][0]; if (dt > 0 && dt < 100) maxV = Math.max(maxV, dy / dt * 1000); }
          return { first: s.length ? s[0][0] : null, samples: s.length, at: [300, 1000, 3000, 6000, 10000, 15000, 24000].map((ms) => [ms, (at(ms) || [])[1] ?? null]), end: s.length ? s[s.length - 1][1] : null, endMax: s.length ? s[s.length - 1][2] - s[s.length - 1][3] : null, lastMoveMs: lastMove, maxPxPerS: Math.round(maxV), trace: n }; })()`);
        const line = await d.ev(CARET_LINE);
        console.log(`SCROLL-A ${theme} ${words}w ${JSON.stringify({ look, line })}`);
      } catch (e) { console.log(`SCROLL-A ${theme} ${words}w ERROR ${String(e && e.message || e).slice(0, 200)}`); }
    }
    // ---- B: the stroke
    if (theme === 'flux') continue;
    for (const tw of ['off', 'on']) {
      try {
        const id = await d.openPage(pageOf(3000), 'journal', { typewriter: tw });
        const tabbed = await app.waitFor("!!document.querySelector('#wz-sliver-tab-ink')", { label: 'the INK tab', timeout: 8000 }).then(() => true, () => false);
        if (tabbed) { await d.ev("document.querySelector('#wz-sliver-tab-ink').click()"); await sleep(400); }
        await d.ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = Math.floor((sc.scrollHeight - sc.clientHeight) / 2); return true; })()"); await sleep(800);
        const before = await d.ev(CARET_LINE);
        const box = await d.ev("(() => { const s = document.querySelector('.wz-ink-sheet').getBoundingClientRect(); const c = document.querySelector('.mode-scroll').getBoundingClientRect(); return { x: s.left + s.width / 2, y: c.top + c.height / 2 }; })()");
        await d.ev(`(() => { window.__ss = []; window.__ssOn = true; const sc = document.querySelector('.mode-scroll'), ed = document.querySelector('${ED}'); window.__mut = [];
          const mo = new MutationObserver((ms) => { for (const m of ms) window.__mut.push([Math.round(performance.now()), m.type, m.target === ed ? 'editor' : (m.target.className && m.target.className.baseVal === undefined ? String(m.target.className).split(' ')[0] : m.target.nodeName), m.addedNodes.length, m.removedNodes.length]); });
          mo.observe(sc, { childList: true, subtree: true, characterData: true }); window.__moOff = () => mo.disconnect();
          const t0 = performance.now(); window.__ssT0 = t0; const tick = () => { if (!window.__ssOn) return; window.__ss.push([Math.round(performance.now() - t0), Math.round(sc.scrollTop * 10) / 10, sc.scrollHeight, ed ? ed.offsetHeight : -1]); requestAnimationFrame(tick); };
          requestAnimationFrame(tick); return true; })()`);
        const ev = (type, p) => app.cdp('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'pen', force: type === 'mouseReleased' ? 0 : 0.5 });
        await ev('mousePressed', { x: box.x, y: box.y });
        for (let i = 1; i <= 12; i += 1) await ev('mouseMoved', { x: box.x + i * 8, y: box.y + (i % 2 ? 6 : -6) });
        await ev('mouseReleased', { x: box.x + 96, y: box.y });
        await sleep(3000);
        const res = await d.ev(`(() => { window.__ssOn = false; window.__moOff(); const s = window.__ss; const first = s.length ? s[0][1] : null; let minTop = 1e9, minAt = -1; s.forEach((e, i) => { if (e[1] < minTop) { minTop = e[1]; minAt = e[0]; } });
          const jumps = []; for (let i = 1; i < s.length; i += 1) if (Math.abs(s[i][1] - s[i - 1][1]) > 40) jumps.push([s[i][0], s[i - 1][1], s[i][1], s[i - 1][2], s[i][2]]);
          return { first, last: s.length ? s[s.length - 1][1] : null, minTop, minAt, jumps: jumps.slice(0, 6), mutations: window.__mut.length, mutKinds: window.__mut.slice(0, 12), heights: [...new Set(s.map((e) => e[2]))].slice(0, 6) }; })()`);
        const strokes = await d.ev(`((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(id)}) || {}).strokes || []).length`);
        console.log(`SCROLL-B ${theme} typewriter=${tw} ${JSON.stringify({ before, strokes, res })}`);
      } catch (e) { console.log(`SCROLL-B ${theme} typewriter=${tw} ERROR ${String(e && e.message || e).slice(0, 200)}`); }
    }
  }
});
console.log('SCROLL-MEASURE: PASS (a measurement; the SCROLL-A and SCROLL-B lines are the result)');
