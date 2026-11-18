// RED-FIRST CHECK for #93 (Fable, Nov 18: "while a rail pop-out is open over the page, don't draw the page's caret; every theme"): the Flux block caret showed through the open Config pop-out. The page's caret must not be painted over a rail pop-out in ANY theme.
// For one theme (env WA_THEME, WA_TONE) this opens a long page in Draft, opens the rail's pop-out (`[data-category="settings"]`, then `theme` as a second one), finds a caret place that lies UNDER the pop-out (the window is narrowed if the pop-out does not reach the text), puts the caret there, and takes the caret by DIFFERENCE:
// the same frame with and without the selection (window.__wa.diff, tries 100 ms apart, the caret blinks); a difference that falls inside the pop-out's rectangle is the caret painted through it. Also reports the page-side facts (whether the Flux block caret element is there and where). Prints `RED-93 [tag] PASS|FAIL`.
// Run: node scripts/harness/writing-audit/reds-93.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-93.mjs, one config per theme).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.tone}`;
const NL = String.fromCharCode(10);
const SENT = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const TEXT = Array.from({ length: 12 }, () => SENT.repeat(3).trim()).join(NL + NL);
const CATEGORIES = (env.WA_POPOUTS || 'settings,theme').split(',');

const fails = [];
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  for (const cat of CATEGORIES) {
    let found = null;
    for (const w of [cfg.width, 1200, 1120, 1060]) {
      await app.emulateDpr(1, w, 768); await sleep(300);
      await d.openPage(TEXT, 'drafting');
      await d.place(5); await d.ev(`document.querySelector('.forward-only-editor').focus()`); await sleep(400);
      // open the pop-out with a real press on its rail item
      const pt = await d.ev(`(() => { const b = document.querySelector('[data-category="${cat}"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
      if (!pt) { console.log(`[${TAG}] no rail item for ${cat} at ${w}px`); continue; }
      await d.click(pt.x, pt.y, 1);
      try { await app.waitFor(`!!document.querySelector(".wz-cascade-panel[data-visible='true']")`, { timeout: 4000, label: 'the pop-out' }); } catch { console.log(`[${TAG}] the ${cat} pop-out did not open at ${w}px`); continue; }
      await sleep(1300);
      const panel = await d.ev(`(() => { const p = document.querySelector(".wz-cascade-panel[data-visible='true']"); if (!p) return null; const r = p.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
      if (!panel) continue;
      // a caret place whose drawn box lies inside the pop-out's rectangle
      for (let p = 0; p <= TEXT.length && !found; p += 7) {
        const b = await d.box(p);
        if (b && b.x !== undefined && b.x > panel.x + 4 && b.x < panel.x + panel.w - 4 && b.top > panel.y + 4 && b.top + (b.height || 0) < panel.y + panel.h - 4) found = { p, w, panel, box: b };
      }
      if (found) break;
      console.log(`[${TAG}] ${cat} pop-out at ${w}px: ${Math.round(panel.w)}x${Math.round(panel.h)} at ${Math.round(panel.x)},${Math.round(panel.y)} holds no caret place of the page`);
    }
    if (!found) { console.log(`RED-93 [${TAG} ${cat}] not judged: no caret place under the pop-out`); continue; }
    await d.place(found.p); await sleep(300);
    let through = null;
    for (let i = 0; i < 10 && !through; i += 1) {
      const A = await app.cdp('Page.captureScreenshot', { format: 'png' });
      await d.ev('window.__wa.clear()'); await sleep(60);
      const B = await app.cdp('Page.captureScreenshot', { format: 'png' });
      await d.place(found.p);
      const r = await d.ev(`window.__wa.diff(${JSON.stringify(A.data)}, ${JSON.stringify(B.data)})`);
      if (r && r.x + r.width > found.panel.x && r.x < found.panel.x + found.panel.w && r.top + r.height > found.panel.y && r.top < found.panel.y + found.panel.h) through = r;
      await sleep(100);
    }
    const el = await d.ev(`(() => { const c = document.querySelector('.flux-block-caret'); if (!c) return null; const r = c.getBoundingClientRect(); const s = getComputedStyle(c); return { x: Math.round(r.left), top: Math.round(r.top), display: s.display, visibility: s.visibility, opacity: s.opacity }; })()`);
    console.log(`[${TAG} ${cat}] caret place ${found.p} at ${Math.round(found.box.x)},${Math.round(found.box.top)} (${found.w}px) under the pop-out ${Math.round(found.panel.w)}x${Math.round(found.panel.h)} at ${Math.round(found.panel.x)},${Math.round(found.panel.y)}; flux block caret element: ${JSON.stringify(el)}; drawn through: ${JSON.stringify(through)}`);
    if (through || (el && el.display !== 'none' && el.visibility !== 'hidden')) fails.push(`${cat}: the caret is drawn over the open pop-out (${through ? 'pixels differ at ' + Math.round(through.x) + ',' + Math.round(through.top) : 'the block caret element is shown'})`);
    console.log(`RED-93 [${TAG} ${cat}] ${through || (el && el.display !== 'none' && el.visibility !== 'hidden') ? 'FAIL' : 'PASS'}`);
  }
});
console.log(fails.length ? `RED-93: FAIL - ${fails.join(' | ')}` : `RED-93: PASS (${TAG}: no caret is drawn over an open rail pop-out)`);
process.exitCode = fails.length ? 1 : 0;
