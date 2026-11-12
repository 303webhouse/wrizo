// FRAMES for Nick (#60), not a pass/fail check. His flow on an EMPTY page in Draft (Typewriter off): Enter, then Up (then a letter). It takes a picture after each, and for the "after Up" picture it looks until the caret is in view (the caret blinks:
// up to 16 screenshots 90 ms apart, the one with the most ink on the sheet is kept). Run the same script on main's product (before) and on the #60 fix (after) and lay the pictures side by side.
// Run: node scripts/harness/writing-audit/frames-60.mjs (from apps/desktop; on Actions via writing-audit.yml, script=frames-60.mjs). Pictures: WA_OUT/shots/<theme>-<flag>-<tone>-<width>-<label>-<step>.png
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${cfg.theme}-${cfg.flag}-${cfg.tone}-${cfg.width}`;
const LABEL = 'after';   // 'before' or 'after': set by the dispatcher's branch choice; the picture's name carries it

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`FRAMES-60 [${TAG}] ${LABEL} (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  const dir = cfg.out ? path.join(cfg.out, 'shots') : null;
  if (dir) fs.mkdirSync(dir, { recursive: true });
  // ink on the sheet: pixels that differ clearly from the sheet's middle colour (the caret, when it is painted, and any text)
  const ink = (b64, r) => ev(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); const R = ${JSON.stringify(r)}; const x0 = Math.max(0, Math.floor(R.x)), y0 = Math.max(0, Math.floor(R.y)), w = Math.min(c.width - x0, Math.ceil(R.w)), h = Math.min(c.height - y0, Math.ceil(R.h)); const data = x.getImageData(x0, y0, w, h).data; const mid = [0, 1, 2].map((ch) => { const s = []; for (let k = ch; k < data.length; k += 4 * 7) s.push(data[k]); s.sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }); let n = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = (j * w + i) * 4; if (Math.abs(data[k] - mid[0]) + Math.abs(data[k + 1] - mid[1]) + Math.abs(data[k + 2] - mid[2]) > 120) { n++; if (i < minX) minX = i; if (i > maxX) maxX = i; if (j < minY) minY = j; if (j > maxY) maxY = j; } } return { n, box: n ? [x0 + minX, y0 + minY, x0 + maxX, y0 + maxY] : null }; })()`);
  const sheet = () => ev(`(() => { const s = document.querySelector('.mode-page') || document.querySelector('.forward-only-editor'); const r = s.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
  const save = (b64, step) => { if (dir) fs.writeFileSync(path.join(dir, `${TAG}-${LABEL}-${step}.png`), Buffer.from(b64, 'base64')); };
  const shot = async () => (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
  const frame = async (step, tries) => {
    const R = await sheet();
    let best = null;
    for (let i = 0; i < tries; i++) {
      const b64 = await shot(); const k = await ink(b64, R);
      if (!best || k.n > best.k.n) best = { b64, k };
      if (i + 1 < tries) await sleep(90);
    }
    save(best.b64, step);
    console.log(`FRAME-60 ${TAG} ${LABEL} ${step}: sheet ${Math.round(R.x)},${Math.round(R.y)} ${Math.round(R.w)}x${Math.round(R.h)}; most ink ${best.k.n} px${best.k.box ? ` in box ${best.k.box.join(',')}` : ''}`);
  };
  await d.surface('.forward-only-editor', false);
  await d.openPage('', 'drafting', { typewriter: 'off' });
  await d.place(0); await sleep(500); await d.still();
  await frame('0-empty', 16);
  await d.key('Enter'); await sleep(500);
  await frame('1-after-enter', 16);
  await d.key('ArrowUp'); await sleep(500);
  await frame('2-after-up', 16);
  await d.type('x'); await sleep(500);
  await frame('3-after-letter', 6);
  const geo = await ev(`(() => { const s = window.getSelection(); const ed = document.querySelector('.forward-only-editor'); const rows = [...ed.querySelectorAll('.wz-row')].map((r) => { const b = r.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }); const rg = s && s.rangeCount ? s.getRangeAt(0).getBoundingClientRect() : null; return { rows, caretRect: rg ? [Math.round(rg.left), Math.round(rg.top), Math.round(rg.width), Math.round(rg.height)] : null, text: ed.innerText.split(String.fromCharCode(10)).length + ' lines' }; })()`);
  console.log(`FRAME-60 ${TAG} ${LABEL} geometry after the letter: ${JSON.stringify(geo)}`);
});
process.exit(0);
