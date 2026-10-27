// POLISH — ARBOR'S MENUS: the left rail and the top bar, 20% bigger, the foot as big as the rest, and their own look.
//
// Nick (Oct 27): "differentiate the look of Arbor's left-hand and top menus from Machina and Flux ... make the icons and menu bars in
// Arbor 20% bigger and have the Themes/Settings/Trash icons restored to being the same size as the Pages/Boards icons."
//
// Written BEFORE the CSS (red first on main), then re-run green on the branch. Cosmetic only: every assertion is a computed style.
//
//   P1  rail items (Pages, Boards, Journal) are 20% bigger than the shipped 20.4 / 21.6 / 10.8 px glyph / mark / label
//   P2  the foot (Settings, Themes, Trash) is the SAME size as the rest (it shipped a third smaller)
//   P3  nothing in the rail is clipped at 768 tall (the rail clips what overflows; Trash is the last item and the first to go)
//   P4  the top bar's tabs are 20% bigger (10.4 px -> 12.48 px) and the bar itself did NOT grow past the 63 px the page's height budget
//       (--fx3-chrome-budget: 167) was measured against - the page must not move or resize because a menu got bigger
//   P5  their own look: muted bronze rules (#8f7a4c), a lifted hover tile, an olive ribbon on the open item
//   P6  the rules of the house: square corners, no drop shadows, labels >= 4.5:1, rail marks >= 4.5:1 (measured)
//   P7  SCOPE: Flux and Machina are untouched (same sizes as shipped, no bronze)
//   P8  THE PAGE DOES NOT MOVE: the paper's rect is the same in the rail's rest state and with the theme switched around (it is a
//       property of the page, not of the menu); the rect is recorded so the evidence names it
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'polish-arbor-chrome');
const SHOTS = process.env.POLISH_SHOTS ? path.join(OUT, process.env.POLISH_SHOTS) : null; // POLISH_SHOTS=before|after writes screenshots
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const near = (a, b, tol = 0.35) => typeof a === 'number' && Math.abs(a - b) <= tol;

// The shipped (pre-POLISH) values, from index.css: .wz-strip-glyph 20.4, svg 21.6, label 10.8; foot 13.668 / 14.472 / 7.236; .desk-mode-tab 10.4.
const WAS = { glyph: 20.4, svg: 21.6, label: 10.8, footGlyph: 13.668, footSvg: 14.472, footLabel: 7.236, tab: 10.4 };
const NOW = { glyph: +(WAS.glyph * 1.2).toFixed(3), svg: +(WAS.svg * 1.2).toFixed(3), label: +(WAS.label * 1.2).toFixed(3), tab: +(WAS.tab * 1.2).toFixed(3) };
const NAV_BUDGET_PX = 63; // --fx3-chrome-budget's own measured nav row
const BRONZE = 'rgb(143, 122, 76)'; // #8f7a4c, Arbor's decorative line

const VIEWPORTS = [[1366, 768], [1920, 1080]];

const freshProsePage = async (app, w, h, theme) => {
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); ${theme ? `localStorage.setItem('wrizo-theme', '${theme}');` : ''}`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, w, h);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(450);
};

const MEASURE = `(() => {
  const cs = (el) => getComputedStyle(el);
  const num = (v) => parseFloat(v);
  const rgb = (s) => { const m = /rgba?\\(([^)]+)\\)/.exec(s); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const A = lum(a), B = lum(b); return +((Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05)).toFixed(2); };
  const aside = document.querySelector('.desk-frame-strip');
  const nav = document.querySelector('.sprint-nav');
  const paper = document.querySelector('.mode-page');
  const items = [...document.querySelectorAll('.wz-strip-item')];
  if (!aside || !nav || !paper || items.length < 5) return { ok: false, aside: !!aside, nav: !!nav, paper: !!paper, items: items.length };
  const foot = [...document.querySelectorAll('.wz-strip-foot .wz-strip-item')];
  const placeBlock = document.querySelector('.wz-place-block');
  const place = items.filter((i) => !foot.includes(i) && i !== placeBlock);
  const sizes = (it) => { const g = it.querySelector('.wz-strip-glyph'), s = it.querySelector('.wz-strip-glyph svg, .wz-strip-glyph .theme-icon-pixels, .wz-strip-glyph img'), l = it.querySelector('.wz-strip-label');
    return { name: (l && l.textContent || '').trim(), glyph: num(cs(g).fontSize), svg: s ? num(cs(s).width) : null, label: num(cs(l).fontSize), labelColor: cs(l).color, glyphColor: cs(g).color }; };
  const ab = aside.getBoundingClientRect(), pr = paper.getBoundingClientRect(), nr = nav.getBoundingClientRect();
  const tab = document.querySelector('.desk-mode-tab');
  const asideBg = rgb(cs(aside).backgroundColor), navBg = rgb(cs(nav).backgroundColor);
  const sep = document.querySelector('.wz-strip-sep');
  // the open item's look, measured by marking one item open (the class the app itself sets) - restored after
  const probe = place[0]; const had = probe.classList.contains('active'); probe.classList.add('active');
  const act = { borderLeft: cs(probe).borderLeftColor, bgImage: cs(probe).backgroundImage, color: cs(probe.querySelector('.wz-strip-label')).color };
  if (!had) probe.classList.remove('active');
  const hoverProbe = place[1]; const hoverBgRest = cs(hoverProbe).backgroundColor;
  const lastBottom = Math.max(...items.map((i) => i.getBoundingClientRect().bottom));
  const flat = (el) => ({ radius: cs(el).borderTopLeftRadius + '/' + cs(el).borderBottomRightRadius, shadow: cs(el).boxShadow });
  return {
    ok: true,
    place: place.map(sizes), foot: foot.map(sizes), placeBlock: placeBlock ? sizes(placeBlock) : null,
    aside: { ...flat(aside), right: cs(aside).borderRightColor, top: ab.top, bottom: ab.bottom, w: +ab.width.toFixed(1), bg: cs(aside).backgroundColor },
    lastItemBottom: +lastBottom.toFixed(1),
    clipped: items.filter((i) => i.getBoundingClientRect().bottom > ab.bottom + 0.5).map((i) => (i.textContent || '').trim()),
    sep: sep ? cs(sep).backgroundColor : null,
    nav: { ...flat(nav), h: +nr.height.toFixed(1), bottom: cs(nav).borderBottomColor, bg: cs(nav).backgroundColor },
    tab: tab ? { size: num(cs(tab).fontSize), color: cs(tab).color, shadow: cs(tab).boxShadow, radius: cs(tab).borderTopLeftRadius, tx: cs(tab).textTransform } : null,
    paper: { x: +pr.x.toFixed(1), y: +pr.y.toFixed(1), w: +pr.width.toFixed(1), h: +pr.height.toFixed(1) },
    act, hoverBgRest,
    ratios: {
      railLabelRest: asideBg && rgb(sizes(place[0]).labelColor) ? ratio(rgb(sizes(place[0]).labelColor), asideBg) : null,
      footLabelRest: asideBg && rgb(sizes(foot[0]).labelColor) ? ratio(rgb(sizes(foot[0]).labelColor), asideBg) : null,
      openMark: asideBg && rgb(act.color) ? ratio(rgb(act.color), asideBg) : null,
      tabRest: tab && navBg ? ratio(rgb(cs(tab).color), navBg) : null,
    },
    inkTokens: { ink800: cs(document.documentElement).getPropertyValue('--ink-800').trim() },
  };
})()`;

// A genuine hover (trusted CDP pointer-move onto the second rail item), then its painted background, read while hovered.
const HOVER_AT = `(() => { const r = document.querySelectorAll('.wz-strip-item')[1].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`;
const HOVER_BG = `getComputedStyle(document.querySelectorAll('.wz-strip-item')[1]).backgroundColor`;

const snap = async (app, name) => {
  if (!SHOTS) return;
  const b64 = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
  fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from(b64, 'base64'));
};

await withHarness(async (app) => {
  const papers = {};
  for (const [w, h] of VIEWPORTS) {
    const tag = `@ ${w}x${h}`;
    await freshProsePage(app, w, h, null);
    const m = await app.evalJs(MEASURE);
    ok(`POLISH ${tag}: the rail, the top bar and the paper are present to measure (Arbor)`, !!m && m.ok === true, JSON.stringify(m));
    if (!m || !m.ok) continue;
    await snap(app, `arbor-${w}x${h}`);
    papers[`${w}x${h}`] = m.paper;

    // P1 / P2
    const allOf = (list, key, want) => list.length > 0 && list.every((s) => near(s[key], want));
    ok(`P1 ${tag}: the rail's places (Pages, Boards, Journal) are 20% bigger - glyph ${NOW.glyph}, mark ${NOW.svg}, label ${NOW.label} px (shipped ${WAS.glyph} / ${WAS.svg} / ${WAS.label})`,
      allOf(m.place, 'glyph', NOW.glyph) && allOf(m.place, 'svg', NOW.svg) && allOf(m.place, 'label', NOW.label), JSON.stringify(m.place));
    ok(`P2 ${tag}: Settings, Themes and Trash are the SAME size as the places (they shipped a third smaller: ${WAS.footGlyph} / ${WAS.footSvg} / ${WAS.footLabel} px)`,
      allOf(m.foot, 'glyph', NOW.glyph) && allOf(m.foot, 'svg', NOW.svg) && allOf(m.foot, 'label', NOW.label) && m.foot.length === 3, JSON.stringify(m.foot));

    ok(`P1 ${tag}: the place block's name is 20% bigger too (13.8 px; shipped 11.5)`, !!m.placeBlock && near(m.placeBlock.label, 13.8), JSON.stringify(m.placeBlock));

    // P3
    ok(`P3 ${tag}: nothing in the rail is cut off at the bottom (Trash is the last item; the rail clips what overflows)`,
      m.clipped.length === 0, JSON.stringify({ clipped: m.clipped, lastItemBottom: m.lastItemBottom, asideBottom: m.aside.bottom }));

    // P4
    ok(`P4 ${tag}: the top bar's tabs are 20% bigger (${NOW.tab} px; shipped ${WAS.tab})`, !!m.tab && near(m.tab.size, NOW.tab), JSON.stringify(m.tab));
    ok(`P4 ${tag}: the top bar did NOT grow past ${NAV_BUDGET_PX} px - the page's height budget was measured against it, so the page cannot be made to move by a bigger menu`,
      m.nav.h <= NAV_BUDGET_PX + 0.5, JSON.stringify(m.nav));

    // P5
    ok(`P5 ${tag}: their own look - the rail's outer rule, its dividers and the top bar's rule are muted bronze ${BRONZE}`,
      m.aside.right === BRONZE && m.sep === BRONZE && m.nav.bottom === BRONZE, JSON.stringify({ rail: m.aside.right, sep: m.sep, nav: m.nav.bottom }));
    ok(`P5 ${tag}: the open item wears an olive ribbon (the full-height bar and the wash are Flux's), its label stays olive`,
      m.act.borderLeft === 'rgba(0, 0, 0, 0)' && /gradient/.test(m.act.bgImage) && /rgb\(150, 160, 90\)/.test(m.act.color), JSON.stringify(m.act));
    const at = await app.evalJs(HOVER_AT);
    await app.mouseMove(at.x - 6, at.y - 6); await app.mouseMove(at.x, at.y); await sleep(260);
    const hov = await app.evalJs(HOVER_BG);
    await snap(app, `arbor-${w}x${h}-hover`);
    await app.mouseMove(w - 5, h - 5);
    ok(`P5 ${tag}: a hovered item lifts to a visible tile (it shipped as the rail's own colour, so hover showed nothing)`,
      !!hov && hov !== m.aside.bg && hov !== 'rgba(0, 0, 0, 0)', JSON.stringify({ hov, rail: m.aside.bg }));

    // P6
    ok(`P6 ${tag}: square corners and NO drop shadow on the rail, the top bar and its tabs`,
      m.aside.shadow === 'none' && m.nav.shadow === 'none' && (!m.tab || m.tab.shadow === 'none')
        && /^0px\/0px$/.test(m.aside.radius) && /^0px\/0px$/.test(m.nav.radius) && (!m.tab || m.tab.radius === '0px'),
      JSON.stringify({ aside: m.aside, nav: m.nav, tab: m.tab }));
    ok(`P6 ${tag}: labels >= 4.5:1 (rail rest, foot rest, open mark, top-bar tab rest) - measured`,
      Object.values(m.ratios).every((r) => typeof r === 'number' && r >= 4.5), JSON.stringify(m.ratios));
  }

  // P7 - SCOPE. Flux and Machina keep their shipped sizes and carry no bronze.
  for (const theme of ['flux', 'machina']) {
    await freshProsePage(app, 1366, 768, theme);
    const m = await app.evalJs(MEASURE);
    ok(`P7 ${theme}: untouched - places ${WAS.glyph} px, foot ${WAS.footGlyph} px (smaller), top-bar tab ${WAS.tab} px, no bronze rule`,
      !!m && m.ok === true
        && m.place.every((s) => near(s.glyph, WAS.glyph)) && m.foot.every((s) => near(s.glyph, WAS.footGlyph))
        && !!m.tab && near(m.tab.size, WAS.tab) && m.aside.right !== BRONZE && m.nav.bottom !== BRONZE,
      JSON.stringify(m && m.ok ? { place: m.place.map((s) => s.glyph), foot: m.foot.map((s) => s.glyph), tab: m.tab, rail: m.aside.right, nav: m.nav.bottom } : m));
    if (m && m.ok) { await snap(app, `${theme}-1366x768`); papers[`${theme}-1366x768`] = m.paper; }
  }

  // P8 - the page is the same box in every skin at the same window: the paper's size does not depend on which menu is drawn.
  const a = papers['1366x768'], f = papers['flux-1366x768'], mc = papers['machina-1366x768'];
  ok('P8 @ 1366x768: THE PAGE DOES NOT MOVE OR RESIZE - the paper is the same size in Arbor, Flux and Machina (the menus changed; the page did not)',
    !!a && !!f && !!mc && near(a.w, f.w, 0.6) && near(a.h, f.h, 0.6) && near(a.w, mc.w, 0.6) && near(a.h, mc.h, 0.6) && near(a.x, f.x, 0.6) && near(a.y, f.y, 0.6),
    JSON.stringify({ arbor: a, flux: f, machina: mc }));

  return checks;
}, { label: 'polish-arbor-chrome' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nPOLISH-ARBOR-CHROME VERIFY: PASS (${checks.length} checks)`
  : `\nPOLISH-ARBOR-CHROME VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
