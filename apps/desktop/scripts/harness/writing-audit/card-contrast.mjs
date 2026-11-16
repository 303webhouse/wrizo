// BUG #103 - THE OPEN CARD'S WORDS MUST READ. A MEASUREMENT that also judges: for one theme and one page tone (env WA_THEME plateau|flux|machina, WA_TONE light|dark) it opens a text card in its pop-up (a real double-click, as the audit does) and reads, from the browser's own computed styles, the colour of the card's words
// and the colour of the card it sits on, and prints the WCAG contrast ratio. Found on INK's frames (Machina, Page: Dark): the words read 1.13:1 (#E6E9F1 on the cream card #FBF6EA).
// Three things are read: the editor's words (.board-popup-editor), the strip's eyebrow (.board-popup-eyebrow) and the close X (.board-popup-close), each against the pop-up's own background (.board-popup). The law: the words >= 4.5:1, the eyebrow and the X >= 3:1.
// One line per read: `CARDCONTRAST {json}`; the verdict line `CARD-CONTRAST: PASS|FAIL`. Run: on Actions via writing-audit.yml, script=card-contrast.mjs, configs theme/off/tone/1366 (six of them cover three themes in both page tones).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.tone}`;

const lum = ([r, g, b]) => { const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const fails = [];
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  await d.openCard('Hello world, the words on this card must read.');
  await sleep(400);
  const read = await d.ev(`(() => {
    const px = (el, prop) => { const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el)[prop]); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
    const pop = document.querySelector('.board-popup');
    if (!pop) return null;
    const out = { bg: px(pop, 'backgroundColor') };
    for (const [k, sel] of [['words', '.board-popup-editor'], ['eyebrow', '.board-popup-eyebrow'], ['close', '.board-popup-close']]) { const el = document.querySelector(sel); out[k] = el ? px(el, 'color') : null; }
    return out;
  })()`);
  if (!read || !read.bg) { fails.push('the card pop-up did not open'); return; }
  for (const [k, min] of [['words', 4.5], ['eyebrow', 3], ['close', 3]]) {
    const fg = read[k]; if (!fg) { console.log(`CARDCONTRAST ${JSON.stringify({ tag: TAG, part: k, error: 'not found' })}`); continue; }
    const r = ratio(fg.rgb, read.bg.rgb);
    const row = { tag: TAG, part: k, fg: hex(fg.rgb), bg: hex(read.bg.rgb), ratio: Math.round(r * 100) / 100, need: min };
    console.log(`CARDCONTRAST ${JSON.stringify(row)}`);
    if (r < min) fails.push(`${TAG} ${k} ${hex(fg.rgb)} on ${hex(read.bg.rgb)} reads ${row.ratio}:1, needs ${min}:1`);
  }
});
console.log(fails.length ? `CARD-CONTRAST: FAIL - ${fails.join(' | ')}` : `CARD-CONTRAST: PASS (${TAG}: the card's words, eyebrow and close X read)`);
process.exitCode = fails.length ? 1 : 0;
