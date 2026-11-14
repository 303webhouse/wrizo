// RED-FIRST CHECK for #78 (Flux: the block caret is off after the window is resized): in Flux the caret is an element drawn at the rectangle the selection gives (components/FluxBlockCaret.tsx). A resize re-wraps the text, and the caret has to follow it.
// This opens a wrapping page in Draft and in Free Write (Flux, light), puts the caret in the text (the middle of the second paragraph in Draft, the end in Free Write), then resizes the window 1366 > 1000 > 760 > 1200 > 1366 px wide (the same call the audit's boot uses), waits for the page to settle, and after EVERY size
// compares the drawn block caret with where the text puts it (the audit reader's own boxAt): the x within 3 px and the line's centre within the line. Prints one verdict line `RED-78: PASS|FAIL` and a line per size. Flux only.
// Run: node scripts/harness/writing-audit/reds-78.mjs (from apps/desktop; dist-web built; on Actions via writing-audit.yml, script=reds-78.mjs, one flux config).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep } from './lib/driver.mjs';

const cfg = { theme: 'flux', flag: 'off', tone: env('WA_TONE', 'light'), width: 1366, height: 768, out: null };
function env(k, d) { return process.env[k] || d; }
const NL = String.fromCharCode(10);
const SENT = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const PARA = SENT.repeat(4).trim();
const TEXT = [PARA, PARA, PARA].join(NL + NL);
const WIDTHS = [1366, 1000, 760, 1200, 1366];

const fails = [];
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  const surfaces = [
    ['Draft', async () => { await d.openPage(TEXT, 'drafting'); return PARA.length + 2 + 150; }],
    ['Free Write', async () => { await d.openFreeWrite(TEXT); return TEXT.length; }],
  ];
  for (const [name, open] of surfaces) {
    await app.emulateDpr(1, 1366, 768); await sleep(300);
    let at;
    try { at = await open(); } catch (e) { fails.push(`${name}: could not open (${String(e && e.message || e).slice(0, 100)})`); continue; }
    await d.place(at); await d.ev(`(document.querySelector('.forward-only-editor') || document.querySelector('[contenteditable]')).focus()`); await sleep(500);
    for (const w of WIDTHS) {
      await app.emulateDpr(1, w, 768);
      await sleep(900); await d.frames(); await sleep(200);
      const r = await d.read(); const box = await d.box(at);
      const fc = r && r.fluxCaret;
      let verdict = 'ok';
      if (!fc) verdict = 'no block caret drawn';
      else if (!box || box.x === undefined) verdict = 'no expected place (not judged)';
      else {
        const dx = fc.x - box.x, cy = fc.top + (fc.height || 0) / 2, ey = box.top + (box.height || 0) / 2, dy = cy - ey;
        if (Math.abs(dx) > 3 || Math.abs(dy) > Math.max(4, (box.height || 0) * 0.45)) verdict = `block caret at ${Math.round(fc.x)},${Math.round(fc.top)} but the text puts it at ${Math.round(box.x)},${Math.round(box.top)} (off by ${dx.toFixed(1)}, ${dy.toFixed(1)})`;
      }
      console.log(`${name} @ ${w}px: ${verdict}`);
      if (verdict !== 'ok' && !/not judged/.test(verdict)) fails.push(`${name} @ ${w}px: ${verdict}`);
    }
  }
});
console.log(fails.length ? `RED-78: FAIL - ${fails.length} of ${2 * WIDTHS.length} reads: ${fails.slice(0, 3).join(' | ')}` : 'RED-78: PASS (the Flux block caret follows the text through every resize, in Draft and in Free Write)');
process.exitCode = fails.length ? 1 : 0;
