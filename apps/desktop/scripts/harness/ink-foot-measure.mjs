// INK FOOT - WHERE THE INK'S SHEET ENDS AGAINST THE PAPER (#111, Nick: "ink is cut off along a straight line under the last line of text": Draft, Free Write, Machina, Typewriter zoom). A MEASUREMENT, not a verdict.
// For a short page (30 words) and a long one (3 000), in Free Write ('journal') and Draft ('drafting'), the Typewriter off and on, under Arbor (plateau) and Machina: the rects of the paper (.mode-page), its scroller (.mode-scroll: client / scroll heights,
// padding), the ink sheet (.wz-ink-sheet), the committed canvas and the text, and what element sits a little below the last line and near the paper's foot (the pointer's target there).
// Run: on Actions (harness.yml, files=ink-foot-measure.mjs).
import { withHarness } from '../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './writing-audit/lib/driver.mjs';

const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)]; };
const READ = `(() => {
  const q = (s) => document.querySelector(s); const rr = ${R.toString()};
  const page = q('.mode-page'), sc = q('.mode-scroll'), sh = q('.wz-ink-sheet'), cv = q('.ink-committed'), ed = q('.forward-only-editor'), col = q('.mode-pagecol');
  const csS = sc ? getComputedStyle(sc) : null, csSh = sh ? getComputedStyle(sh) : null, csP = page ? getComputedStyle(page) : null;
  const edR = ed ? ed.getBoundingClientRect() : null;
  const lastLine = (() => { if (!ed) return null; const r = document.createRange(); r.selectNodeContents(ed); const rs = [...r.getClientRects()].filter((x) => x.height > 4); return rs.length ? Math.round(Math.max(...rs.map((x) => x.bottom))) : null; })();
  const pr = page ? page.getBoundingClientRect() : null;
  const below = (y) => { const e = document.elementFromPoint(Math.round((pr ? pr.left + pr.width / 2 : 600)), Math.round(y)); return e ? (e.tagName.toLowerCase() + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).split(' ')[0] : '')) : null; };
  return { zoom: col ? col.getAttribute('data-zoom') : null, page: rr(page), pageScale: page ? Math.round(pr.width / page.offsetWidth * 100) / 100 : null, padB: csP ? csP.paddingBottom : null, scroll: rr(sc), scrollClient: sc ? sc.clientHeight : null, scrollScroll: sc ? sc.scrollHeight : null, scrollTop: sc ? Math.round(sc.scrollTop) : null, scrollPadB: csS ? csS.paddingBottom : null, scrollPadT: csS ? csS.paddingTop : null,
    sheet: rr(sh), sheetMinH: csSh ? csSh.minHeight : null, sheetMT: csSh ? csSh.marginTop : null, sheetMB: csSh ? csSh.marginBottom : null, sheetPT: csSh ? csSh.paddingTop : null, sheetPB: csSh ? csSh.paddingBottom : null, canvas: rr(cv), canvasPx: cv ? cv.width + 'x' + cv.height : null, editor: rr(ed), lastLineBottom: lastLine,
    hitBelowLastLine: lastLine && pr ? below(lastLine + 30) : null, hitNearFoot: pr ? below(pr.bottom - 10) : null, hitInScrollFoot: sc ? below(sc.getBoundingClientRect().bottom - 6) : null }; })()`;

await withHarness(async (app) => {
  for (const theme of (process.env.INK_THEMES || 'plateau,machina').split(',')) {
    const cfg = { theme, flag: 'off', tone: 'light', width: 1366, height: 768, out: null };
    if (!THEMES[theme]) continue;
    const d = makeDriver(app, cfg);
    await d.boot();
    for (const [mode, label] of [['journal', 'Free Write'], ['drafting', 'Draft']]) for (const words of [30, 3000]) for (const tw of ['off', 'on']) {
      try {
        const id = await d.openPage(pageOf(words), mode, { typewriter: tw });
        await d.ev("document.querySelector('.forward-only-editor').focus()"); await sleep(500); await d.still();
        const g = await d.ev(READ);
        console.log(`INKFOOT ${theme} ${label} ${words}w typewriter=${tw} ${JSON.stringify(g)}`);
      } catch (e) { console.log(`INKFOOT ${theme} ${label} ${words}w typewriter=${tw} ERROR ${String(e && e.message || e).slice(0, 160)}`); }
    }
  }
});
console.log('INK-FOOT-MEASURE: PASS (a measurement; the INKFOOT lines are the result)');
