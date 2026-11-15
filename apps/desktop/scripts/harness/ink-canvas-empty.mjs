// INK-CANVAS-EMPTY - bug #101 (Enter in Free Write paints in 87-275 ms at 5,000-12,000 words on the box; the browser's own sampling profile of an Enter puts 23-85 ms per key in `setTransform`, which only the ink canvas calls on a page).
// THE CAUSE: components/InkStratum.tsx repaints its COMMITTED ink canvas from a ResizeObserver on the sheet, and every repaint re-sizes that canvas to the whole sheet (width x height of the page, 40,000+ px tall on a long page): the backing store is thrown away and
// allocated again each time the page grows by a line (every Enter) - on a page with no ink at all. THE LAW: a page with no strokes holds no ink backing store (the committed canvas stays one pixel); the page's size changing must not allocate a canvas the size of the page.
// This opens a long page in Free Write and in Draft, presses Enter five times, and reads the committed ink canvas's size before and after each: with no strokes its area must be a handful of pixels, never the page's. Prints one verdict line.
// Run: node scripts/harness/ink-canvas-empty.mjs (from apps/desktop; dist-web built). On Actions it runs with the pair.
import { withHarness } from './../runtime-verify.mjs';
import { makeDriver, sleep } from './writing-audit/lib/driver.mjs';

const cfg = { theme: process.env.WA_THEME || 'plateau', flag: 'off', tone: 'light', width: 1366, height: 768, out: null };
const NL = String.fromCharCode(10);
const PARA = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all.';
const TEXT = Array.from({ length: 200 }, () => PARA).join(NL);
const MAX_AREA = 16;   // px: one pixel is the law; a few are allowed

let fails = [];
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  const read = () => d.ev(`(() => { const c = document.querySelector('.ink-committed'); const s = document.querySelector('.wz-ink-sheet'); return c ? { w: c.width, h: c.height, sheetH: s ? Math.round(s.getBoundingClientRect().height) : null } : null; })()`);
  const surfaces = [
    ['Free Write', async () => { await d.openFreeWrite(TEXT); }],
    ['Draft', async () => { await d.openPage(TEXT, 'drafting'); }],
  ];
  for (const [name, open] of surfaces) {
    try { await open(); } catch (e) { fails.push(`${name}: could not open (${String(e && e.message || e).slice(0, 120)})`); continue; }
    await d.place(TEXT.length); await d.ev(`(document.querySelector('.forward-only-editor') || document.querySelector('[contenteditable]')).focus()`); await sleep(700);
    const reads = [await read()];
    for (let i = 0; i < 5; i += 1) { await d.key('Enter'); await sleep(250); reads.push(await read()); }
    console.log(`${name}: committed ink canvas ${reads.map((r) => (r ? `${r.w}x${r.h}` : 'none')).join(' > ')} (sheet height ${reads[reads.length - 1] ? reads[reads.length - 1].sheetH : '?'} px)`);
    if (reads.some((r) => !r)) fails.push(`${name}: no committed ink canvas on the page (the check cannot see it)`);
    else if (reads.some((r) => r.w * r.h > MAX_AREA)) fails.push(`${name}: the ink canvas with no strokes is ${reads.map((r) => `${r.w}x${r.h}`).join(' > ')}, the size of the page, not a pixel`);
  }
});
console.log(fails.length ? `INK-CANVAS-EMPTY: FAIL - ${fails.join(' | ')}` : 'INK-CANVAS-EMPTY: PASS (the committed ink canvas stays a pixel on a page with no strokes, through five Enters, in Free Write and Draft)');
process.exitCode = fails.length ? 1 : 0;
