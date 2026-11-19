// INK FOOT - INK IS DRAWN, SHOWN AND SAVED ANYWHERE ON THE PAPER SHE SEES (#111, Nick: "ink is cut off along a straight line under the last line of text"; Fable's ruling, Nov 19, 2:20 pm). THE CAUSE (ink-foot-measure.mjs, run 44616644220): the ink sheet (.wz-ink-sheet) is the scroller's
// content wrapper and ends where the text ends (+ a min-height of 100% of the scroller's CONTENT box, which leaves out its 30vh bottom padding): 205 px tall on a 435 px scroller in the plain view. Below it the pointer lands on .mode-scroll, so a stroke cannot START there, and a stroke
// that runs down past it is clipped by the canvas (the canvas is the sheet's box). In the Typewriter zoom the sheet already reaches over the scroller's padding, so the zoom is the control.
// THE LAW: the sheet covers the scroller's whole visible area (its padding too), and the committed canvas reaches at least the paper's visible foot and the lowest stroke.
// A page in Free Write, INK instrument, REAL pen events (CDP, pointerType pen), a 1366 x 1400 window (the zoomed paper's foot is in view). Two strokes: A from the last line down to near the scroller's foot, B starting BELOW the last line. For the plain view and the zoom, a short page and a long one (scrolled to its end):
//   K1  the sheet's box reaches the scroller's visible foot (sheet bottom >= scroller bottom - 1) and a point just above that foot hits the sheet (the pointer is routed to the ink there)
//   K2  both strokes are SAVED whole: two strokes stored, A's lowest point within 6 px of where the pen went, and B (it started below the last line) is there with its first point where the pen went down
//   K3  both strokes SHOW whole: the painted ink's bounding box reaches the lowest stored point (within 8 px): nothing is cut off along a line
//   K4  a reload keeps both, and they show as they did (K2 and K3 again, after the reload)
//   K5  Enter on this page (7 strokes seeded below, the old ink-enter law): see ink-enter.mjs, run with this file; here, the canvas is not the whole page: its backing store is under 4 x the scroller's height
// Run: on Actions (harness.yml, files=ink-foot.mjs). One verdict line: INK-FOOT: PASS|FAIL.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const GEOM = `(() => { const q = (s) => document.querySelector(s); const sc = q('.mode-scroll'), sh = q('.wz-ink-sheet'), ed = q(${JSON.stringify(ED)}), cv = q('.ink-committed');
  if (!sc || !sh || !ed) return null; const s = sc.getBoundingClientRect(), h = sh.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(ed); const rs = [...r.getClientRects()].filter((x) => x.height > 4); const last = rs.length ? Math.max(...rs.map((x) => x.bottom)) : null;
  const zoom = (q('.mode-pagecol') || {}).getAttribute ? q('.mode-pagecol').getAttribute('data-zoom') : null; const foot = Math.min(s.bottom, window.innerHeight); const yAbove = foot - 8; const hit = document.elementFromPoint(Math.round(h.left + 140), Math.round(yAbove));
  const hitSheet = !!hit && !!hit.closest('.wz-ink-sheet');
  return { foot, scroll: { top: s.top, bottom: s.bottom, left: s.left, right: s.right }, sheet: { top: h.top, bottom: h.bottom, left: h.left, right: h.right, w: h.width }, lastLine: last, zoom, hitSheet, canvasPx: cv ? cv.width + 'x' + cv.height : null, scrollClient: sc.clientHeight, scrollTop: sc.scrollTop, scrollHeight: sc.scrollHeight }; })()`;
// the stored strokes of a page, in px from the sheet's top (y * width + the text's origin) and the painted ink's own box (css px from the sheet's top)
const READ = (id) => `(() => { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = rows.find((x) => x.id === ${JSON.stringify(id)}); const strokes = (e && e.strokes) || [];
  const cv = document.querySelector('.ink-committed'); const sh = cv.parentElement; const sr = sh.getBoundingClientRect(); const cr = cv.getBoundingClientRect(); const W = sr.width;
  const pt = parseFloat(getComputedStyle(sh).paddingTop) || 0; const oy = pt ? pt * (sh.offsetWidth > 0 ? sr.width / sh.offsetWidth : 1) : 0;
  const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let y1 = -1, y0 = 1e9; for (let y = 0; y < cv.height; y += 1) { let hit = false; for (let x = 0; x < cv.width; x += 1) if (px[(y * cv.width + x) * 4 + 3] > 24) { hit = true; break; } if (hit) { if (y > y1) y1 = y; if (y < y0) y0 = y; } }
  const sy = cr.height / cv.height;
  return { n: strokes.length, pts: strokes.map((s) => s.points.length), low: strokes.map((s) => Math.max(...s.points.map((p) => p.y * W + oy))), first: strokes.map((s) => s.points[0].y * W + oy), paintedLow: y1 < 0 ? null : y1 * sy + (cr.top - sr.top), paintedHigh: y0 > 1e8 ? null : y0 * sy + (cr.top - sr.top), canvasPx: cv.width + 'x' + cv.height }; })()`;

const penPath = async (app, pts) => {
  const ev = (type, p) => app.cdp('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'pen', force: type === 'mouseReleased' ? 0 : 0.5 });
  await ev('mousePressed', pts[0]);
  for (let i = 1; i < pts.length; i += 1) await ev('mouseMoved', pts[i]);
  await ev('mouseReleased', pts[pts.length - 1]);
};
const lerp = (a, b, n) => Array.from({ length: n }, (_, i) => ({ x: a.x + (b.x - a.x) * (i / (n - 1)), y: a.y + (b.y - a.y) * (i / (n - 1)) }));

await withHarness(async (app) => {
  let N = 0;
  const boot = async (zoom) => {
    await app.emulateDpr(1, 1366, 1400);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-writing-settings', JSON.stringify({ typewriter: ${zoom ? 'true' : 'false'} }))`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  };
  const openPage = async (id) => {
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await waitSoft(app, `!!document.querySelector('${ED}') && !!document.querySelector('.ink-committed') && document.querySelector('${ED}').textContent.length > 100`, { label: 'the page', timeout: 30000 });
    await sleep(1500);
  };
  const scenario = async (zoom, words) => {
    const tag = `${zoom ? 'zoom' : 'plain'} ${words}w`;
    await boot(zoom);
    const id = `inkf-${++N}-${words}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: pageOf(words), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'journal')`);
    await sleep(400);
    await openPage(id);
    const tabbed = await waitSoft(app, "!!document.querySelector('#wz-sliver-tab-ink')", { label: 'the INK tab', timeout: 8000 });
    if (tabbed) { await app.evalJs("document.querySelector('#wz-sliver-tab-ink').click()"); await sleep(400); }
    if (words > 200) { await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = sc.scrollHeight; return true; })()"); await sleep(700); }
    const g = await app.evalJs(GEOM);
    ok(`(premise) ${tag}: the page and the INK instrument are there (zoom reads ${g && g.zoom})`, !!g && tabbed && (zoom ? g.zoom === 'true' : g.zoom !== 'true'), JSON.stringify(g));
    if (!g || !tabbed) return;
    ok(`K1 ${tag}: the sheet reaches the paper's visible foot (sheet bottom ${Math.round(g.sheet.bottom)} vs ${Math.round(g.foot)}: the scroller's foot or the window's) and the pointer is routed to the ink just above that foot`, g.sheet.bottom >= g.foot - 1 && g.hitSheet, JSON.stringify({ hitSheet: g.hitSheet, lastLine: g.lastLine }));
    const footY = g.foot - 24;
    const lastY = Math.min(g.lastLine - 8, footY - 60);
    const x0 = g.sheet.left + 120;
    const A = lerp({ x: x0, y: lastY }, { x: x0 + 40, y: footY }, 14);
    const B = lerp({ x: x0 + 160, y: footY - 40 }, { x: x0 + 300, y: footY - 40 }, 10);
    await penPath(app, A); await sleep(900);
    // a long page: the first stroke's commit leaves the scroller at the top (on main too); the second is drawn from the end again
    let sheetTopB = sheetTop;
    if (words > 200) { await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = sc.scrollHeight; return true; })()"); await sleep(800); const g2 = await app.evalJs(GEOM); sheetTopB = g2.sheet.top; }
    await penPath(app, B); await sleep(900);
    const sheetTop = g.sheet.top;   // read before the pen went down
    const want = { A: A[A.length - 1].y - sheetTop, B0: B[0].y - sheetTopB };
    const judge = (r, when) => {
      ok(`K2${when} ${tag}: both strokes are SAVED whole: ${r.n} stored, A's lowest point ${r.low[0] !== undefined ? Math.round(r.low[0]) : '-'} (pen ${Math.round(want.A)}), B's first point ${r.first[1] !== undefined ? Math.round(r.first[1]) : '-'} (pen ${Math.round(want.B0)})`,
        r.n === 2 && Math.abs(r.low[0] - want.A) <= 6 && Math.abs(r.first[1] - want.B0) <= 6 && r.pts[0] >= 12 && r.pts[1] >= 8, JSON.stringify(r));
      ok(`K3${when} ${tag}: both strokes SHOW whole: the painted ink reaches ${r.paintedLow !== null ? Math.round(r.paintedLow) : '-'} px, the lowest stored point is ${r.low.length ? Math.round(Math.max(...r.low)) : '-'}`,
        r.n === 2 && r.paintedLow !== null && Math.abs(r.paintedLow - Math.max(...r.low)) <= 8, JSON.stringify({ paintedLow: r.paintedLow, canvasPx: r.canvasPx }));
    };
    const r1 = await app.evalJs(READ(id));
    judge(r1, '');
    ok(`K5 ${tag}: the canvas is not the page: its backing store (${r1.canvasPx}) ends within 300 px of the lowest ink or the visible foot, whichever is lower down`, Number(String(r1.canvasPx).split('x')[1]) <= Math.max(Math.max(...r1.low), g.scroll.bottom - g.scroll.top) + 300, r1.canvasPx);
    await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    await openPage(id);   // the hash is still the page's: a reload lands on it
    await sleep(1500);
    if (words > 200) { await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = sc.scrollHeight; return true; })()"); await sleep(700); }
    judge(await app.evalJs(READ(id)), ' (after a reload)');
  };
  for (const zoom of [false, true]) for (const words of [30, 3000]) await scenario(zoom, words);
});
const bad = checks.filter((c) => !c.pass);
console.log(`INK-FOOT: ${bad.length ? 'FAIL' : 'PASS'} (${checks.length - bad.length}/${checks.length} checks${bad.length ? '; red: ' + bad.map((c) => c.name.split(':')[0]).join(', ') : ''})`);
process.exitCode = bad.length ? 1 : 0;
