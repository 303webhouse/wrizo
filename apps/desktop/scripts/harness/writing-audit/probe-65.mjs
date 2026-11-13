// PROBE for #65 (ArrowUp from a paragraph's first line into a wrapped paragraph above lands on its FIRST visual line, skipping its lower lines): not a pass/fail check, a measurement. For each STYLE VARIANT (injected into the page) it opens
// a Draft page of a long wrapped paragraph over a short one, puts the caret at the start of the short one, presses ArrowUp once, and prints which visual line of the long paragraph the caret landed on (1 = first, N = last) and how many
// visual lines the paragraph has. The variants change one property of the row (`.wz-row`: inline-block, width 100%, contain: layout style) at a time, to find which one makes the browser enter the paragraph at its top.
// Also: the same in a board CARD's pop-up (no rows there), and a THREE-line paragraph. Run: node scripts/harness/writing-audit/probe-65.mjs (from apps/desktop; on Actions via writing-audit.yml, script=probe-65.mjs). Never fails.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const NL = String.fromCharCode(10);
const WORDS = 'the quick brown fox jumps over the lazy dog and keeps running through the long grass until the evening comes down';
const para = (n) => Array.from({ length: n }, () => WORDS).join(' ');
const VARIANTS = [
  ['base', ''],
  ['row-block', '.forward-only-editor .wz-row{ display:block !important; }'],
  ['row-no-contain', '.forward-only-editor .wz-row{ contain:none !important; }'],
  ['row-inline', '.forward-only-editor .wz-row{ display:inline !important; width:auto !important; }'],
  ['row-baseline', '.forward-only-editor .wz-row{ vertical-align:baseline !important; }'],
];

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`PROBE-65 [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  // the visual lines of the long paragraph: the distinct tops of its characters' rectangles; the caret's line is the one whose top is nearest the caret's rectangle
  const measure = (sel, firstLen) => ev(`(() => { const ed = document.querySelector(${JSON.stringify(sel)}); const s = getSelection(); if (!s.rangeCount) return null; const rg = s.getRangeAt(0); const cr = [...rg.getClientRects()].find((q) => q.height > 0) || rg.getBoundingClientRect();
    const tops = []; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, seen = 0; while ((n = w.nextNode()) && seen < ${firstLen}) { for (let i = 0; i < n.data.length && seen < ${firstLen}; i++, seen++) { const g = document.createRange(); g.setStart(n, i); g.setEnd(n, i + 1); const q = [...g.getClientRects()].find((x) => x.height > 0); if (q) { const t = Math.round(q.top); if (!tops.length || Math.abs(tops[tops.length - 1] - t) > 3) tops.push(t); } } }
    let at = 0, best = 1e9; tops.forEach((t, i) => { const dd = Math.abs(t - cr.top); if (dd < best) { best = dd; at = i + 1; } }); return { lines: tops.length, landedOn: at, caretTop: Math.round(cr.top), tops }; })()`);
  const style = (css) => ev(`(() => { let s = document.getElementById('probe65'); if (!s) { s = document.createElement('style'); s.id = 'probe65'; document.head.appendChild(s); } s.textContent = ${JSON.stringify(css)}; return true; })()`);

  for (const [pname, text1] of [['2-3 lines', para(2)], ['3-4 lines', para(3)]]) {
    for (const [name, css] of VARIANTS) {
      try {
        await d.surface('.forward-only-editor', false);
        await d.openPage(text1 + NL + 'Short.', 'drafting', { typewriter: 'off' });
        await style(css); await sleep(300);
        await d.place(text1.length + 1); await sleep(300);
        await d.key('ArrowUp'); await sleep(400);
        const m = await measure('.forward-only-editor', text1.length);
        console.log(`PROBE65 ${TAG} draft ${pname} variant=${name}: ${JSON.stringify(m)}`);
      } catch (e) { console.log(`PROBE65-ERROR ${TAG} draft ${pname} ${name}: ${String((e && e.message) || e).slice(0, 160)}`); }
    }
  }
  // a board card's pop-up (no rows)
  try {
    const t1 = para(3);
    await d.openCard(t1 + NL + 'Short.');
    await d.place(t1.length + 1); await sleep(300);
    await d.key('ArrowUp'); await sleep(400);
    console.log(`PROBE65 ${TAG} card 3-4 lines variant=base: ${JSON.stringify(await measure('.board-popup-editor', t1.length))}`);
  } catch (e) { console.log(`PROBE65-ERROR ${TAG} card: ${String((e && e.message) || e).slice(0, 160)}`); }
});
process.exit(0);
