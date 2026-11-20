// INK ENTER - AN ENTER ON A PAGE THAT HAS INK DOES NOT REPAINT THE INK (#101's follow-up; Fable, Nov 19, 1:35 pm). THE CAUSE (ink-enter-measure.mjs, runs 44606971040 / 44608092229): components/InkStratum.tsx repaints its committed canvas from a ResizeObserver on the sheet; the sheet
// grows by a line on an Enter, so on a page WITH strokes every Enter assigned the canvas's width AND height again (a backing store the size of the WHOLE page: 739 x 22 400 at 5 000 words, 739 x 50 458 at 12 000: the browser allocates and clears it each time)
// and drew every stroke again: an Enter cost 129-142 ms at 5 000 words and 296-302 ms at 12 000 (16 and 18-25 ms with no strokes).
// THE LAW: the ink is positioned in page-width units, so a page that only grows taller does not move it: nothing is assigned or drawn when only the height changed; the backing store reaches the lowest stroke, not the page's foot.
//   I1  25 Enters at the end of a 5 000-word Free Write page holding 7 strokes: the committed canvas's width/height are assigned 0 times (main: 50)
//   I2  ... and the strokes are drawn (clearRect on that canvas) 0 times (main: 25)
//   I3  the ink is where the strokes put it, before and after the Enters: its pixel bounding box matches the strokes' own (x from 0.1 to 0.7 of the page's width, down to 0.9) within 8 px, and the canvas stays inside the sheet (its foot no lower than the sheet's)
//   I4  the page narrows (1400 -> 1100, the narrowest framed width: the stage, and the page with it, is narrower): the ink is redrawn at the new width, and again matches the strokes' own box (the width still repaints)
//   I6  the native caret is still PAINTED at the end of a page with ink, in the normal view and in the Typewriter (#101's will-change law: a page-sized composited canvas was what kept the caret painted; the canvas is now only as tall as the ink)
//   I5  (reading) the Enter's key-to-frame median, printed, not a check (runners differ in speed)
// Run: on Actions (harness.yml, files=ink-enter.mjs). One verdict line: INK-ENTER: PASS|FAIL.
import { withHarness } from '../runtime-verify.mjs';
import { makeDriver } from './writing-audit/lib/driver.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const STROKES = [...Array.from({ length: 6 }, (_, s) => ({ points: Array.from({ length: 40 }, (_, k) => ({ x: 0.1 + 0.6 * (k / 39), y: 0.05 + s * 0.04 + 0.02 * Math.sin(k / 4) })) })),
  { points: Array.from({ length: 20 }, (_, k) => ({ x: 0.2 + 0.4 * (k / 19), y: 0.9 })) }];
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };

const INSTRUMENT = `(() => {
  if (window.__inkInst) return true; window.__inkInst = true;
  window.__inkT0 = 0; window.__inkSizes = 0; window.__inkDraws = 0;
  document.addEventListener('keydown', () => { window.__inkT0 = performance.now(); }, true);
  const isInk = (el) => el && el.classList && el.classList.contains('ink-committed');
  for (const prop of ['width', 'height']) {
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, prop);
    Object.defineProperty(HTMLCanvasElement.prototype, prop, { configurable: true, get() { return d.get.call(this); }, set(v) { if (isInk(this)) window.__inkSizes += 1; d.set.call(this, v); } });
  }
  const cr = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...a) { if (isInk(this.canvas)) window.__inkDraws += 1; return cr.apply(this, a); };
  return !!document.querySelector('.ink-committed'); })()`;
const AFTER = "new Promise((res) => requestAnimationFrame(() => setTimeout(() => res({ dt: performance.now() - window.__inkT0, sizes: window.__inkSizes, draws: window.__inkDraws }), 0)))";
// the ink's own box in the canvas (pixels with alpha), the strokes' expected box from their points, and where the canvas sits against the sheet
const BOX = `(() => { const c = document.querySelector('.ink-committed'); const sh = c.parentElement; const sr = sh.getBoundingClientRect(); const cr = c.getBoundingClientRect(); const W = sr.width; const dpr = window.devicePixelRatio || 1;
  const pt = parseFloat(getComputedStyle(sh).paddingTop) || 0; const oy = pt ? pt * (sh.offsetWidth > 0 ? sr.width / sh.offsetWidth : 1) : 0;
  const ctx = c.getContext('2d'); const w = c.width, h = c.height; const px = ctx.getImageData(0, 0, w, h).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (px[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const exp = { x0: 0.1 * W, x1: 0.7 * W, y1: 0.9 * W + oy };
  return { W: Math.round(W), box: x1 < 0 ? null : { x0: x0 * (cr.width / w), x1: x1 * (cr.width / w), y0: y0 * (cr.height / h), y1: y1 * (cr.height / h) }, exp, canvasBottom: Math.round(cr.bottom * 10) / 10, sheetBottom: Math.round(sr.bottom * 10) / 10, canvasCss: Math.round(cr.height), backing: w + 'x' + h }; })()`;
const boxOk = (b) => !!b && !!b.box && Math.abs(b.box.x0 - b.exp.x0) <= 8 && Math.abs(b.box.x1 - b.exp.x1) <= 8 && Math.abs(b.box.y1 - b.exp.y1) <= 8 && b.canvasBottom <= b.sheetBottom + 1;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  const PAGE = 'inke-5000';
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: PAGE, text: pageOf(5000), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null, strokes: STROKES })})`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${PAGE}', 'journal')`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${PAGE}'`);
  const up = await waitSoft(app, `!!document.querySelector('${ED}') && document.querySelector('${ED}').textContent.length > 1000 && !!document.querySelector('.ink-committed')`, { label: 'the 5 000-word page with ink', timeout: 30000 });
  ok('(premise) the 5 000-word Free Write page with 7 strokes opens, its committed ink canvas there', up);
  if (!up) return;
  await sleep(1800);
  await app.evalJs(INSTRUMENT);
  await app.evalJs(`document.querySelector('${ED}').focus()`);
  await sleep(300);
  const b0 = await app.evalJs(BOX);
  for (let i = 0; i < 5; i += 1) { await app.typeKeys('\n'); await app.evalJs(AFTER); }
  const before = await app.evalJs(AFTER);
  const dts = []; let last = before;
  for (let i = 0; i < 25; i += 1) { await app.typeKeys('\n'); last = await app.evalJs(AFTER); dts.push(last.dt); }
  const sizes = last.sizes - before.sizes, draws = last.draws - before.draws;
  ok(`I1: 25 Enters on a page with ink assign the committed canvas's width/height ${sizes} times (none: the page only grew taller)`, sizes === 0, `main: 50`);
  ok(`I2: ... and draw the strokes ${draws} times (none)`, draws === 0, `main: 25`);
  await sleep(500);
  const b1 = await app.evalJs(BOX);
  ok('I3: the ink is where the strokes put it, before and after the Enters, and the canvas stays inside the sheet', boxOk(b0) && boxOk(b1), JSON.stringify({ before: b0, after: b1 }));
  // I4: the sheet's WIDTH changes (a real ResizeObserver event; the page is only scaled by CSS when the window narrows, so the sheet's own width does not change then): the ink is redrawn at the new width
  await app.evalJs("(() => { const sh = document.querySelector('.ink-committed').parentElement; sh.style.width = '300px'; return true; })()"); await sleep(1000);
  const b2 = await app.evalJs(BOX);
  await app.evalJs("(() => { const sh = document.querySelector('.ink-committed').parentElement; sh.style.width = ''; return true; })()"); await sleep(800);
  const b3 = await app.evalJs(BOX);
  ok('I4: the sheet narrows to 300 layout px: the ink is redrawn at the new width and matches the strokes own box; widened again, it matches at the old one', boxOk(b2) && b2.W < b1.W - 100 && boxOk(b3) && b3.W === b1.W, JSON.stringify({ narrow: b2, back: b3 }));
  console.log(`READING  I5: Enter on the page with ink: key-to-frame median ${med(dts).toFixed(1)} ms (printed, not a check: the runners' speeds differ)`);
  // I6: the native caret is painted at the end of a page with ink (plain view, Typewriter)
  {
    const d = makeDriver(app, { theme: 'plateau', flag: 'off', tone: 'light', width: 1366, height: 768, out: null });
    await d.boot();
    for (const tw of ['off', 'on']) {
      const TEXT = pageOf(300);
      await d.surface('.forward-only-editor', true);
      const id = await d.openPage(TEXT, 'journal', { typewriter: tw });
      await d.ev(`window.wrizoPatchEntry(${JSON.stringify(id)}, { strokes: ${JSON.stringify(STROKES)} }); true`);
      await d.ev("location.hash = '#/'"); await sleep(400);
      await d.ev(`location.hash = '#/page/${id}'`);
      const painted = await waitSoft(app, "!!document.querySelector('.ink-committed') && document.querySelector('.ink-committed').width > 1 && !!document.querySelector('.forward-only-editor')", { label: `the page with ink (typewriter ${tw})`, timeout: 15000 });
      await sleep(900);
      await d.place(TEXT.length); await d.ev("document.querySelector('.forward-only-editor').focus()"); await sleep(500);
      await d.still();
      const px = await d.pixelCaret();
      ok(`I6: the native caret is painted at the end of a page with ink (typewriter ${tw})`, painted && !!px, JSON.stringify({ painted, px: px && { via: px.via, tries: px.tries, w: px.width } }));
    }
  }
});
const bad = checks.filter((c) => !c.pass);
console.log(`INK-ENTER: ${bad.length ? 'FAIL' : 'PASS'} (${checks.length - bad.length}/${checks.length} checks${bad.length ? '; red: ' + bad.map((c) => c.name.split(':')[0]).join(', ') : ''})`);
process.exitCode = bad.length ? 1 : 0;
