// SCROLL OPEN - OPENING LANDS AT THE WRITING LINE AT ONCE; THE PAGE DOES NOT DRIFT UNDER A WRITER'S OWN SCROLL (#113 and #112; Fable, Nov 19, 8:10 pm, RULED: "opening lands at the writing line at
// once (a cut); the glide stays only for the follow while typing. Red-first at 5k and 20k, every theme").
// THE CAUSE (scroll-measure.mjs, run 44665401447): on a long Free Write page the Typewriter's first engage owes the whole distance from the top to the writing line, and pays it with the
// staircase meant for typing (two lines per 160 ms glide): ~360 px/s in every theme, at 5k and at 20k alike (scroll 315 at 1 s, 1 027 at 3 s, 3 565 at 10 s, 8 587 at 24 s, still moving, the line
// not reached). The owed advance is added to wherever the box sits, so a writer who scrolls away to look has the page drift on down under her (#112's "jump": a stroke drawn after her own scroll
// found the page 1 167 px further down 3 s later). No jump to the top was seen once the box was left alone: the drift is what a stroke on a long page met.
//
//   O1 [theme, words]  the page lands at once: the scroll position 600 ms after the address changes is within 3 px of where it stands at 5 s, and it does not move between 1 s and 6 s (<= 2 px)
//   O2 [theme, words]  it landed AT THE WRITING LINE: it moved (scroll > 0 at 600 ms) and the page's last line stands inside the scroller's visible box, in its lower two thirds (never off screen)
//   O3 [theme, words]  a writer who scrolls away is left where she put the page: scrolled 1 000 px up, 2 s later it has not moved (<= 2 px)
//   O4 [theme]         the follow still glides: typing six new lines moves the page in steps (no single frame moves it more than 3 line-heights) and the line she is on stays in view
//   F1 [theme]         a stroke drawn after her own scroll (the middle, then the bottom) finds the page where she left it, frame by frame, for 3 s (every look within 3 px of the first)
//   M  (the mutant)    O1's own rule, read on the measured staircase (scroll 55 at 300 ms ... 8 587 at 24 s), goes RED
// Run: on Actions (harness.yml, files=scroll-open.mjs). One verdict line: SCROLL-OPEN: PASS|FAIL.
import { withHarness } from '../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './writing-audit/lib/driver.mjs';

const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const ED = '.forward-only-editor';
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const SAMPLER = `(() => { window.__ss = []; window.__ssOn = true; const t0 = performance.now();
  const tick = () => { if (!window.__ssOn) return; const sc = document.querySelector('.mode-scroll'); if (sc) window.__ss.push([Math.round(performance.now() - t0), Math.round(sc.scrollTop * 10) / 10]); requestAnimationFrame(tick); };
  requestAnimationFrame(tick); return true; })()`;
const atMs = (s, ms) => { let best = null; for (const e of s) if (e[0] <= ms) best = e; return best ? best[1] : null; };
// O1's rule, as a function of a timeline [[ms, scrollTop], ...]: landed at once, then still
const landedAtOnce = (s) => { const a = atMs(s, 600), z = atMs(s, 5000); if (a == null || z == null) return false; const win = s.filter((e) => e[0] >= 1000 && e[0] <= 6000).map((e) => e[1]); return Math.abs(a - z) <= 3 && win.length > 0 && Math.max(...win) - Math.min(...win) <= 2; };
const LINE = `(() => { const sc = document.querySelector('.mode-scroll'), ed = document.querySelector('${ED}'); if (!sc || !ed) return null; const r = document.createRange(); r.selectNodeContents(ed); const rs = [...r.getClientRects()].filter((x) => x.height > 4);
  const last = rs.length ? Math.max(...rs.map((x) => x.bottom)) : null; const s = sc.getBoundingClientRect(); return { frac: last == null ? null : Math.round((last - s.top) / s.height * 100) / 100, top: Math.round(sc.scrollTop), max: sc.scrollHeight - sc.clientHeight }; })()`;
const penStroke = async (app, box) => {
  const ev = (type, p) => app.cdp('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'pen', force: type === 'mouseReleased' ? 0 : 0.5 });
  await ev('mousePressed', { x: box.x, y: box.y });
  for (let i = 1; i <= 12; i += 1) await ev('mouseMoved', { x: box.x + i * 8, y: box.y + (i % 2 ? 6 : -6) });
  await ev('mouseReleased', { x: box.x + 96, y: box.y });
};

// M: the measured staircase on main (scroll-measure.mjs, plateau 5000w): 55 at 300 ms, 315 at 1 s, 1 027 at 3 s, 2 107 at 6 s
const staircase = [[300, 55], [1000, 315], [1500, 480], [3000, 1027], [5000, 1740], [6000, 2107]];
ok('M: O1\'s own rule read on the measured staircase goes RED (the mutant: the glide paid on opening)', !landedAtOnce(staircase) && landedAtOnce([[300, 8000], [600, 8000], [1000, 8000], [5000, 8000], [6000, 8000]]));

await withHarness(async (app) => {
  for (const theme of (process.env.SCROLL_THEMES || 'plateau,flux,machina').split(',')) {
    if (!THEMES[theme]) continue;
    const cfg = { theme, flag: 'off', tone: 'light', width: 1366, height: 768, out: null };
    const d = makeDriver(app, cfg);
    await d.boot();
    for (const words of (process.env.SCROLL_WORDS || '5000,20000').split(',').map(Number)) {
      try {
        const id = `so-${theme}-${words}`;
        await d.ev(`location.hash = '#/'`); await sleep(200);
        await d.ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: pageOf(words), createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
        await d.ev(`localStorage.setItem('wrizo-mode-page-${id}', 'journal')`);
        await d.ev(SAMPLER);
        await d.ev(`location.hash = '#/page/${id}'`);
        await sleep(6500);
        const s = await d.ev('window.__ss');
        const line = await d.ev(LINE);
        ok(`O1 [${theme}, ${words}w]: the page lands at once (600 ms: ${atMs(s, 600)}, 5 s: ${atMs(s, 5000)}) and then stays still`, landedAtOnce(s), JSON.stringify([300, 600, 1000, 3000, 6000].map((ms) => atMs(s, ms))));
        ok(`O2 [${theme}, ${words}w]: it landed AT THE WRITING LINE: moved (${atMs(s, 600)}) and the last line is in the scroller's lower two thirds (${line && line.frac})`, (atMs(s, 600) || 0) > 100 && !!line && line.frac !== null && line.frac >= 0.3 && line.frac <= 1.0, JSON.stringify(line));
        // O3 - she scrolls away; the page stays where she put it
        await d.ev('window.__ssOn = false; true');
        const top0 = await d.ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = Math.max(0, sc.scrollTop - 1000); return Math.round(sc.scrollTop); })()");
        await sleep(2000);
        const top1 = await d.ev("Math.round(document.querySelector('.mode-scroll').scrollTop)");
        ok(`O3 [${theme}, ${words}w]: scrolled 1 000 px up (${top0}), 2 s later the page has not moved (${top1})`, Math.abs(top1 - top0) <= 2, JSON.stringify({ top0, top1 }));
        if (words === 5000) {
          // O4 - the follow still glides
          await d.ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = sc.scrollHeight; return true; })()"); await sleep(800);
          await d.ev(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
          await sleep(600);
          await d.ev(SAMPLER);
          for (let i = 1; i <= 6; i += 1) { await app.typeKeys(`\nAnd the writer goes on, line ${i} of the new ones.`); await sleep(160); }
          await sleep(1800);
          const f = await d.ev('window.__ss'); await d.ev('window.__ssOn = false; true');
          const lh = await d.ev(`parseFloat(getComputedStyle(document.querySelector('${ED}')).lineHeight) || 28`);
          let maxStep = 0; for (let i = 1; i < f.length; i += 1) maxStep = Math.max(maxStep, Math.abs(f[i][1] - f[i - 1][1]));
          const moved = f.length ? Math.abs(f[f.length - 1][1] - f[0][1]) : 0;
          const lineNow = await d.ev(LINE);
          ok(`O4 [${theme}]: typing six lines glides the page in steps (largest single frame ${Math.round(maxStep)} px, 3 line-heights = ${Math.round(lh * 3)}), it moved (${Math.round(moved)}), and the line she is on stays in view (${lineNow && lineNow.frac})`,
            maxStep <= lh * 3 && moved > 5 && !!lineNow && lineNow.frac !== null && lineNow.frac <= 1.0 && lineNow.frac >= 0.05, JSON.stringify({ maxStep, moved, lineNow }));
        }
      } catch (e) { ok(`O [${theme}, ${words}w]: ran`, false, String(e && e.message || e).slice(0, 200)); }
    }
    if (theme === 'flux') continue;
    // F1 - a stroke after her own scroll
    try {
      const id = await d.openPage(pageOf(3000), 'journal', {});
      await sleep(2500);
      const tabbed = await app.waitFor("!!document.querySelector('#wz-sliver-tab-ink')", { label: 'the INK tab', timeout: 8000 }).then(() => true, () => false);
      if (tabbed) { await d.ev("document.querySelector('#wz-sliver-tab-ink').click()"); await sleep(400); }
      for (const where of ['middle', 'bottom']) {
        await d.ev(`(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = ${where === 'middle' ? 'Math.floor((sc.scrollHeight - sc.clientHeight) / 2)' : 'sc.scrollHeight'}; return true; })()`); await sleep(1200);
        const box = await d.ev("(() => { const s = document.querySelector('.wz-ink-sheet').getBoundingClientRect(); const c = document.querySelector('.mode-scroll').getBoundingClientRect(); return { x: s.left + s.width / 2, y: c.top + c.height / 2 }; })()");
        await d.ev(SAMPLER);
        await penStroke(app, box);
        await sleep(3000);
        const f = await d.ev('window.__ss'); await d.ev('window.__ssOn = false; true');
        const first = f.length ? f[0][1] : null;
        const worst = f.reduce((m, e) => Math.max(m, Math.abs(e[1] - first)), 0);
        ok(`F1 [${theme}, ${where}]: a stroke drawn after her own scroll finds the page where she left it for 3 s (largest move ${Math.round(worst)} px over ${f.length} looks)`, first !== null && f.length > 20 && worst <= 3, JSON.stringify({ first, last: f.length ? f[f.length - 1][1] : null }));
      }
    } catch (e) { ok(`F1 [${theme}]: ran`, false, String(e && e.message || e).slice(0, 200)); }
  }
});
const failed = checks.filter((c) => !c.pass).length;
console.log(failed ? `SCROLL-OPEN: FAIL - ${failed}/${checks.length} failed` : `SCROLL-OPEN: PASS (${checks.length} checks)`);
process.exit(failed ? 1 : 0);
