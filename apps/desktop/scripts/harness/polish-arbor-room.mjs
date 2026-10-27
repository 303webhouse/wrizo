// POLISH — ARBOR'S ROOM: deep espresso, no outlining on the menus, no pure white anywhere.
//
// Nick (Oct 27): "Let's go with deep espresso, but drop the outlining you've added to the menu bars (a design committee will review their look).
// Also I don't want there to be any pure white. Use a moderate cream/brown for borders and accents, and a light cream/tan for lettering and other
// accent needs not covered by the olive green and brass."
//
// Written BEFORE the CSS (red on main), cosmetic only: computed styles, measured on the real screens.
//
//   R1  the room is deep espresso: --ink-900 (the room / desk ground) #150F0B, --ink-950 #0A0503, --ink-800 #1F1711, lines #2A2018 / #3A2D22
//   R2  NO OUTLINING on the menus: the rail's rule, its dividers and the top bar's rule are the room's own quiet lines again (--ink-border),
//       not bronze; no second rule inside the rail
//   R3  NO PURE WHITE on any Arbor screen: not a colour, a background, a border, a shadow, an icon stroke or fill, a gradient stop (alpha >= .5),
//       and not an image that is mostly white (the logo). Screens: Desk, the writing page, a board, and every rail panel
//   R4  the colours that replace white are the two Nick named, and they are tokens: --arbor-line (a moderate cream-brown, for borders and accents)
//       and --arbor-letter (a light cream-tan, for lettering); lettering >= 4.5:1 and lines >= 3:1 on the room
//   R5  SCOPE: Flux and Machina keep their rooms (their --ink-900 is not the espresso), and the paper (the page) is the very rect and colour it was
//   R6  the menus keep what was asked for before: icons 20% bigger, the foot as big as the places, the top bar still 51 px (the page does not move)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'polish-arbor-room');
const SHOTS = process.env.POLISH_SHOTS ? path.join(OUT, process.env.POLISH_SHOTS) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const near = (a, b, tol = 0.35) => typeof a === 'number' && Math.abs(a - b) <= tol;

const ESPRESSO = { i950: 'rgb(10, 5, 3)', i900: 'rgb(21, 15, 11)', i800: 'rgb(31, 23, 17)', border: 'rgb(42, 32, 24)', strong: 'rgb(58, 45, 34)' };
const BRONZE = 'rgb(143, 122, 76)';
const PAPER_ON_MAIN = { x: 187, y: 107, w: 992, h: 897.6 }; // the paper at 1366x768, as main paints it

const freshWritingPage = async (app, theme) => {
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); ${theme ? `localStorage.setItem('wrizo-theme', '${theme}');` : ''}`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await sleep(600);
};

// Every visible element (and its ::before / ::after), every paint property, every gradient stop; plus every visible image's own pixels.
const SCAN = `(async () => {
  const PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor', 'boxShadow', 'textShadow', 'fill', 'stroke', 'caretColor', 'textDecorationColor', 'backgroundImage', 'filter'];
  const WHITE = /rgba?\\(\\s*25[2-5]\\s*,\\s*25[2-5]\\s*,\\s*25[2-5]\\s*(?:,\\s*([0-9.]+)\\s*)?\\)|color\\(srgb\\s+(?:0?\\.99\\d*|1)\\s+(?:0?\\.99\\d*|1)\\s+(?:0?\\.99\\d*|1)\\s*(?:\\/\\s*([0-9.]+))?\\)/g;
  const hits = new Map();
  const note = (el, pseudo, prop, val, alpha) => {
    const key = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || el.tagName) + (pseudo || '') + '|' + prop;
    if (!hits.has(key)) hits.set(key, { el: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || el.tagName).slice(0, 60) + (pseudo || ''), prop, alpha, value: String(val).slice(0, 120) });
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.02; };
  const scanStyle = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo || null);
    for (const p of PROPS) {
      const v = cs[p]; if (!v || v === 'none' || v === 'normal') continue;
      WHITE.lastIndex = 0; let m;
      while ((m = WHITE.exec(v))) { const a = m[1] !== undefined ? +m[1] : m[2] !== undefined ? +m[2] : 1; if (a >= 0.5) note(el, pseudo, p, v, a); }
    }
  };
  for (const el of document.querySelectorAll('*')) {
    if (!visible(el)) continue;
    scanStyle(el, '');
    for (const ps of ['::before', '::after']) { const c = getComputedStyle(el, ps).content; if (c && c !== 'none' && c !== 'normal') scanStyle(el, ps); }
  }
  // images: a visible <img> that is mostly white (the hand-drawn logo is a white-on-transparent PNG)
  const imgs = [];
  for (const img of document.querySelectorAll('img')) {
    if (!visible(img) || !img.complete || !img.naturalWidth) continue;
    try {
      const w = Math.min(img.naturalWidth, 200), h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data; let solid = 0, white = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 128) { solid++; if (d[i] >= 250 && d[i + 1] >= 250 && d[i + 2] >= 250) white++; } }
      if (solid > 20 && white / solid > 0.3) imgs.push({ src: (img.getAttribute('src') || '').slice(-60), whiteShare: +(white / solid).toFixed(2) });
    } catch (e) { imgs.push({ src: (img.getAttribute('src') || '').slice(-60), error: String(e).slice(0, 60) }); }
  }
  return { css: [...hits.values()], imgs };
})()`;

const MEASURE = `(() => {
  const cs = (el) => getComputedStyle(el), num = (v) => parseFloat(v);
  const rgb = (s) => { const m = /rgba?\\(([^)]+)\\)/.exec(s); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2] }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const A = lum(a), B = lum(b); return +((Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05)).toFixed(2); };
  const root = cs(document.documentElement);
  const tok = (n) => root.getPropertyValue(n).trim();
  const probe = (color) => { const d = document.createElement('i'); d.style.color = color; document.body.appendChild(d); const v = cs(d).color; d.remove(); return v; };
  const aside = document.querySelector('.desk-frame-strip'), nav = document.querySelector('.sprint-nav'), paper = document.querySelector('.mode-page');
  const sep = document.querySelector('.wz-strip-sep'), foot = [...document.querySelectorAll('.wz-strip-foot .wz-strip-glyph')], place = [...document.querySelectorAll('.wz-strip-section .wz-strip-glyph')].filter((g) => !g.closest('.wz-strip-foot') && !g.closest('.wz-place-block'));
  const pr = paper.getBoundingClientRect(), nr = nav.getBoundingClientRect();
  const room = rgb(cs(aside).backgroundColor);
  const line = rgb(probe(tok('--arbor-line') || 'rgb(0,0,0)')), letter = rgb(probe(tok('--arbor-letter') || 'rgb(0,0,0)'));
  return {
    i950: probe(tok('--ink-950')).replace(/^rgba\\(/, 'rgb(').replace(/, 1\\)$/, ')'), i900: cs(aside).backgroundColor, i800: probe(tok('--ink-800')), border: probe(tok('--ink-border')), strong: probe(tok('--ink-border-strong')),
    htmlBg: cs(document.documentElement).backgroundColor,
    rail: cs(aside).borderRightColor, railBg: cs(aside).backgroundImage, sep: sep ? cs(sep).backgroundColor : null, navRule: cs(nav).borderBottomColor,
    bracket: (document.querySelector('.wz-strip-section--bracketed') ? cs(document.querySelector('.wz-strip-section--bracketed')).borderLeftColor : null),
    tokens: { line: tok('--arbor-line'), letter: tok('--arbor-letter'), lineRgb: line, letterRgb: letter },
    ratios: room && line && letter ? { letter: ratio(letter, room), line: ratio(line, room) } : null,
    paper: { x: +pr.x.toFixed(1), y: +pr.y.toFixed(1), w: +pr.width.toFixed(1), h: +pr.height.toFixed(1), bg: cs(paper).backgroundColor },
    navH: +nr.height.toFixed(1),
    glyphs: { place: place.map((g) => num(cs(g).fontSize)), foot: foot.map((g) => num(cs(g).fontSize)) },
  };
})()`;

const snap = async (app, name) => {
  if (!SHOTS) return;
  fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
};
const openPanel = async (app, label) => {
  await app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-strip-item')].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(label.toLowerCase())}); if (b) b.click(); return !!b; })()`);
  await sleep(700);
};

await withHarness(async (app) => {
  // ---- the writing screen: room, menus, paper
  await freshWritingPage(app, null);
  const m = await app.evalJs(MEASURE);
  await snap(app, 'write');
  ok('R1: the room is deep espresso - --ink-900 (the room), --ink-950, --ink-800 and the two line colours',
    m.i900 === ESPRESSO.i900 && m.i950 === ESPRESSO.i950 && m.i800 === ESPRESSO.i800 && m.border === ESPRESSO.border && m.strong === ESPRESSO.strong, JSON.stringify(m));
  ok('R2: NO OUTLINING on the menus - the rail edge, its dividers, its bracket and the top bar rule are the room\'s own quiet lines, not bronze; no second rule drawn inside the rail',
    m.rail !== BRONZE && m.sep !== BRONZE && m.navRule !== BRONZE && m.bracket !== BRONZE && m.railBg === 'none', JSON.stringify({ rail: m.rail, sep: m.sep, nav: m.navRule, bracket: m.bracket, bg: m.railBg }));
  ok('R2: ...and they are the espresso lines (--ink-border) - quiet, as they were', m.rail === ESPRESSO.border && m.navRule === ESPRESSO.border, JSON.stringify({ rail: m.rail, nav: m.navRule }));
  ok('R4: the two replacement colours exist as tokens - --arbor-line and --arbor-letter - and clear their floors on the room (lettering >= 4.5:1, lines >= 3:1)',
    !!m.tokens.line && !!m.tokens.letter && !!m.ratios && m.ratios.letter >= 4.5 && m.ratios.line >= 3, JSON.stringify({ tokens: m.tokens, ratios: m.ratios }));
  ok('R5: the page is the very rect main paints (the room changed; the page did not)', near(m.paper.x, PAPER_ON_MAIN.x, 0.6) && near(m.paper.y, PAPER_ON_MAIN.y, 0.6) && near(m.paper.w, PAPER_ON_MAIN.w, 0.6) && near(m.paper.h, PAPER_ON_MAIN.h, 0.6), JSON.stringify(m.paper));
  ok('R6: the menus keep what was asked before - places 24.48 px, the foot as big (24.48), the top bar still 51 px',
    m.glyphs.place.length > 0 && m.glyphs.place.every((v) => near(v, 24.48)) && m.glyphs.foot.length === 3 && m.glyphs.foot.every((v) => near(v, 24.48)) && Math.abs(m.navH - 51) <= 0.5, JSON.stringify({ glyphs: m.glyphs, navH: m.navH }));

  // ---- R3 on every Arbor screen
  const screens = [];
  screens.push(['writing page', await app.evalJs(SCAN)]);
  for (const label of ['Pages', 'Boards', 'Journal', 'Settings', 'Themes', 'Trash']) {
    await openPanel(app, label);
    await snap(app, `panel-${label.toLowerCase()}`);
    screens.push([`panel: ${label}`, await app.evalJs(SCAN)]);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true"); await sleep(300);
  }
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await sleep(900); await snap(app, 'desk');
  screens.push(['Desk (home)', await app.evalJs(SCAN)]);
  for (const [name, r] of screens) {
    ok(`R3 [${name}]: no pure white - not in a colour, background, border, shadow, icon stroke, gradient stop (alpha >= .5) or filter`, r.css.length === 0, JSON.stringify(r.css));
    ok(`R3 [${name}]: no image that is mostly white (the logo)`, r.imgs.length === 0, JSON.stringify(r.imgs));
  }

  // ---- R5: Flux and Machina keep their own rooms
  for (const theme of ['flux', 'machina']) {
    await freshWritingPage(app, theme);
    const f = await app.evalJs(MEASURE);
    ok(`R5 ${theme}: keeps its own room (not the espresso) and its own menu sizes`, f.i900 !== ESPRESSO.i900 && f.i950 !== ESPRESSO.i950 && f.glyphs.foot.every((v) => near(v, 13.668)), JSON.stringify({ i900: f.i900, i950: f.i950, foot: f.glyphs.foot }));
    await snap(app, `${theme}-write`);
  }
  return checks;
}, { label: 'polish-arbor-room' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nPOLISH-ARBOR-ROOM VERIFY: PASS (${checks.length} checks)` : `\nPOLISH-ARBOR-ROOM VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
