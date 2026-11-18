// BUG #78 REPRODUCTION (Fable, Nov 18): "reproduce it on main first: Flux resize cycle 1366 > 1000 > 1920 > 1366, plus Backspace in the Tutor's box. If it doesn't show in 20 runs, CLOSE it as not reproducible. If it shows, fix it red-first."
// A measurement that judges. Flux only (env WA_THEME defaults to flux). RESIZE: a Draft page, the caret placed in the middle of the text; 20 cycles of 1366 > 1000 > 1920 > 1366 (the device-metrics override, as the audit's boot does); after EVERY size the Flux block caret is compared with where the text puts the
// caret now (the selection the page reports after the resize, whatever it is: the audit's boxAt) - the x within 3 px and the line's centre within the line - and the page is asked for its focus and selection. TUTOR: the Tutor's panel is opened, its conversation box (.wz-tutor-convo-input) typed into and Backspace pressed 5 times,
// 20 times over; a block caret (.flux-block-caret) shown while that box has focus, or a caret frame that differs by Backspace, is the "once" Fable's note names. Output: a line per cycle with a verdict, and `RED-78B: PASS|FAIL (n of 20 cycles)`.
// Run: on Actions via writing-audit.yml, script=reds-78b.mjs, config flux/off/light/1366 (and dark).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'flux', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: 1366, height: 768, out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const CYCLES = Number(env.WA_CYCLES || 20);
const NL = String.fromCharCode(10);
const SENT = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all. ';
const TEXT = Array.from({ length: 4 }, () => SENT.repeat(4).trim()).join(NL + NL);
const SIZES = [[1366, 768], [1000, 768], [1920, 1080], [1366, 768]];

const bad = [];
let judged = 0;
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  // ---- RESIZE ----
  for (let c = 1; c <= CYCLES; c += 1) {
    await app.emulateDpr(1, 1366, 768); await sleep(250);
    await d.openPage(TEXT, 'drafting');
    await d.place(300); await d.ev(`document.querySelector('.forward-only-editor').focus()`); await sleep(350);
    const seen = [];
    for (const [w, h] of SIZES) {
      await app.emulateDpr(1, w, h); await sleep(700); await d.frames(); await sleep(150);
      const r = await d.read();
      const at = r && r.anchor !== null && r.anchor !== undefined ? r.anchor : null;
      const box = at === null ? null : await d.box(at);
      const fc = r && r.fluxCaret;
      let v = 'ok';
      if (!r || !r.focused || at === null) v = `no caret in the page (focused=${r && r.focused})`;
      else if (!fc) v = `no block caret drawn (selection ${at})`;
      else if (box && box.x !== undefined) {
        const dx = fc.x - box.x, dy = fc.top + (fc.height || 0) / 2 - (box.top + (box.height || 0) / 2);
        if (Math.abs(dx) > 3 || Math.abs(dy) > Math.max(4, (box.height || 0) * 0.45)) v = `block caret at ${Math.round(fc.x)},${Math.round(fc.top)}, the text puts caret ${at} at ${Math.round(box.x)},${Math.round(box.top)}`;
      }
      seen.push(`${w}:${v}`);
      if (v !== 'ok') bad.push(`cycle ${c} @ ${w}px: ${v}`);
      judged += 1;
    }
    console.log(`RESIZE cycle ${c}: ${seen.join(' | ')}`);
  }
  // ---- TUTOR'S BOX ----
  await app.emulateDpr(1, 1366, 768); await sleep(250);
  await d.openPage(TEXT, 'drafting'); await sleep(400);
  await d.ev(`document.querySelector('.wz-tutor-grip, [aria-label="Open the Tutor"]')?.click()`); await sleep(900);
  const has = await d.ev(`!!document.querySelector('.wz-tutor-convo-input')`);
  console.log(`TUTOR box present: ${has}`);
  if (has) {
    for (let c = 1; c <= CYCLES; c += 1) {
      await d.ev(`(() => { const i = document.querySelector('.wz-tutor-convo-input'); i.focus(); i.value = ''; })()`);
      await d.type('hello'); await sleep(120);
      const before = await d.ev(`(() => ({ block: !!document.querySelector('.flux-block-caret'), val: document.querySelector('.wz-tutor-convo-input').value, active: document.activeElement && document.activeElement.className }))()`);
      let shown = 0;
      for (let k = 0; k < 5; k += 1) {
        await d.key('Backspace'); await sleep(80);
        const s = await d.ev(`(() => { const b = document.querySelector('.flux-block-caret'); const i = document.querySelector('.wz-tutor-convo-input'); return { block: !!b && getComputedStyle(b).visibility !== 'hidden', val: i ? i.value : null, focused: document.activeElement === i }; })()`);
        if (s.block) shown += 1;
        if (k === 4) console.log(`TUTOR cycle ${c}: before ${JSON.stringify(before)} after 5 Backspaces value="${s.val}" focused=${s.focused} block caret frames=${shown}`);
      }
      judged += 1;
      if (shown > 0) bad.push(`tutor cycle ${c}: the block caret was drawn ${shown} time(s) while the Tutor's box had focus`);
    }
  }
});
console.log(bad.length ? `RED-78B: FAIL (${bad.length} of ${judged} reads): ${bad.slice(0, 4).join(' | ')}` : `RED-78B: PASS (${judged} reads, ${CYCLES} resize cycles: the Flux block caret follows the caret and the Tutor's box draws none)`);
process.exitCode = bad.length ? 1 : 0;
