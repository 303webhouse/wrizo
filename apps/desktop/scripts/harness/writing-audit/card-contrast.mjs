// BUG #103 - THE OPEN CARD'S WORDS MUST READ, AND IN MACHINA THE OPEN CARD IS THE BOARD'S CARD. A check (it prints numbers and judges them): for one theme and one page tone (env WA_THEME plateau|flux|machina, WA_TONE light|dark) it opens a text card in its pop-up (a real double-click, as the audit does)
// and reads, from the browser's own computed styles, the colour of the card's words and of the card it sits on, and prints the WCAG contrast ratio. Found on INK's frames (Machina, Page: Dark): the words read 1.13:1 (#E6E9F1 on the cream card #FBF6EA).
// Three things are read: the editor's words (.board-popup-editor), the strip's eyebrow (.board-popup-eyebrow) and the close X (.board-popup-close), each against the pop-up's own background (.board-popup). The law: the words >= 4.5:1, the eyebrow and the X >= 3:1.
// MACHINA ONLY, Fable's ruling (Nov 15): the open card matches the board card on BOTH page tones, the neutral cast included: its background is the board card's background and its words the board card's ink (the same card, open). The neutral cast is read by setting data-cast on the page for a second read.
// One line per read: `CARDCONTRAST {json}`; the verdict line `CARD-CONTRAST: PASS|FAIL`. Run: on Actions via writing-audit.yml, script=card-contrast.mjs, configs theme/off/tone/1366 (six of them cover three themes in both page tones); in the suite through wa-red-103.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }

const lum = ([r, g, b]) => { const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const same = (a, b) => !!a && !!b && a.every((v, i) => Math.abs(v - b[i]) < 1);

const fails = [];
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  await d.openCard('Hello world, the words on this card must read.');
  await sleep(400);
  // (no backslash in this page-side source: a template literal would eat it)
  const read = async (cast) => d.ev(`(() => {
    const root = document.documentElement; const was = root.getAttribute('data-cast');
    if (${JSON.stringify(cast)} === 'neutral') root.setAttribute('data-cast', 'neutral');
    const px = (el, prop) => { const s = getComputedStyle(el)[prop]; if (!/^rgb/.test(s)) return null; const p = s.replace(/[^0-9.,]/g, '').split(',').map((x) => parseFloat(x)); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
    const pop = document.querySelector('.board-popup');
    const out = pop ? { bg: px(pop, 'backgroundColor') } : null;
    if (out) {
      for (const [k, sel] of [['words', '.board-popup-editor'], ['eyebrow', '.board-popup-eyebrow'], ['close', '.board-popup-close']]) { const el = document.querySelector(sel); out[k] = el ? px(el, 'color') : null; }
      const face = document.querySelector('[data-box-id="wa-card"] .board-text') || document.querySelector('[data-box-id="wa-card"]');
      out.board = face ? { bg: px(face, 'backgroundColor'), ink: px(face, 'color') } : null;
    }
    if (${JSON.stringify(cast)} === 'neutral') { if (was === null) root.removeAttribute('data-cast'); else root.setAttribute('data-cast', was); }
    return out;
  })()`);
  const casts = cfg.theme === 'machina' ? ['default', 'neutral'] : ['default'];
  for (const cast of casts) {
    const tag = `${THEMES[cfg.theme].label}/${cfg.tone}${cast === 'neutral' ? '/neutral' : ''}`;
    const r = await read(cast);
    if (!r || !r.bg) { fails.push(`${tag}: the card pop-up did not open`); continue; }
    for (const [k, min] of [['words', 4.5], ['eyebrow', 3], ['close', 3]]) {
      const fg = r[k]; if (!fg) { console.log(`CARDCONTRAST ${JSON.stringify({ tag, part: k, error: 'not found' })}`); continue; }
      const q = ratio(fg.rgb, r.bg.rgb);
      const row = { tag, part: k, fg: hex(fg.rgb), bg: hex(r.bg.rgb), ratio: Math.round(q * 100) / 100, need: min };
      console.log(`CARDCONTRAST ${JSON.stringify(row)}`);
      if (q < min) fails.push(`${tag} ${k} ${hex(fg.rgb)} on ${hex(r.bg.rgb)} reads ${row.ratio}:1, needs ${min}:1`);
    }
    if (cfg.theme === 'machina') {
      const b = r.board;
      const row = { tag, part: 'matches-board', openBg: hex(r.bg.rgb), openWords: r.words ? hex(r.words.rgb) : null, boardBg: b && b.bg ? hex(b.bg.rgb) : null, boardInk: b && b.ink ? hex(b.ink.rgb) : null };
      console.log(`CARDCONTRAST ${JSON.stringify(row)}`);
      if (!b || !b.bg || !b.ink || !r.words) fails.push(`${tag}: the board card could not be read`);
      else if (!same(r.bg.rgb, b.bg.rgb) || !same(r.words.rgb, b.ink.rgb)) fails.push(`${tag}: the open card (${hex(r.words.rgb)} on ${hex(r.bg.rgb)}) is not the board card (${hex(b.ink.rgb)} on ${hex(b.bg.rgb)})`);
    }
  }
});
console.log(fails.length ? `CARD-CONTRAST: FAIL - ${fails.join(' | ')}` : `CARD-CONTRAST: PASS (${THEMES[cfg.theme].label}/${cfg.tone}: the card's words, eyebrow and close X read${cfg.theme === 'machina' ? '; the open card is the board card, both casts' : ''})`);
process.exitCode = fails.length ? 1 : 0;
