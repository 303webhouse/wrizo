// FLUX-PAGE-INK (Fable, URGENT, fast lane) — the PAGE TEXT itself, not just
// card labels: ForwardOnlyEditor's `penColor` prop (ModeStage.tsx) is an
// unconditional inline-style override of .mode-page's own --ink-on-paper
// colour, applied only in Free Write (RAILS.journal.tools === 'pen'). Its
// default swatch (PEN_INKS[0] = '#1a0f06', "black-brown") is tuned for a
// light page and measured 1.16:1 against Flux dark's --paper (#0B2429) —
// Chat 1 ledger 62/72, docs/evidence/batch-b-ship-f44c66bd/runs/fluxdarktext.mjs
// and flux-dark-page-text-measurement.txt (constant rgb(26, 15, 6) across
// four separate builds, every Flux-dark frame measured).
//
// THE FIX (ModeStage.tsx): effectivePenInk(ink, theme, pageTone) swaps each
// of the three PEN_INKS for a dark-page-safe variant when theme==='flux' &&
// pageTone==='dark', at the ONE hand-off site both the framed host's
// controlled penColorProp (PageEditor.tsx's own, otherwise-dead, penColor
// state — confirmed no setPenColor call site exists, so the framed surface
// always carries PEN_INKS[0]) and the unframed bar's own internal `pen`
// state funnel through.
//
// Draft and Revise never receive a penColor at all (RAILS tools:'format'),
// so they always render .mode-page's own --ink-on-paper — already correct
// by hand WCAG calc (13.9:1 Flux dark) — and P1 below proves that stays true
// rather than assuming it. Arbor (plateau) has no dark-page variant at all
// (canon §11 debt, themePrefs.ts header) — selecting it is a documented
// no-op — so, matching card-label-contrast.mjs's own convention, this file
// never asserts plateau/dark.
//
// Run: node scripts/harness/flux-page-ink.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';

// WCAG 2.x contrast — copied verbatim from card-label-contrast.mjs's own
// contrastOf (itself flux-card-ink.mjs's/bg2.mjs's method): the element's
// own rendered colour against the first opaque ancestor background.
const contrastOf = (app, sel) => app.evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const parse = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  let bgEl = el, bg = null;
  while (bgEl) {
    const c = getComputedStyle(bgEl).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\\(0, 0, 0, 0\\)/.test(c)) { bg = c; break; }
    bgEl = bgEl.parentElement;
  }
  const fg = getComputedStyle(el).color;
  const L1 = lum(parse(fg)), L2 = lum(parse(bg || 'rgb(255,255,255)'));
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  return { fg, bg, ratio: Math.round(ratio * 100) / 100 };
})()`);

const freshPage = async (app, theme, page, { width = 1400, id = 'fpi-page' } = {}) => {
  await app.emulateDpr(1, width, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* theme premise below still records */ }
  if (theme === 'flux') await app.evalJs("window.wrizoTheme.set('flux')");
  if (page === 'dark') await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' })");
  await sleep(200);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id, text: 'Line one of a loose page.\nLine two.\nLine three.\nLine four.\nLine five, the active one.',
    origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
  })})`);
  await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(500);
};

const switchMode = async (app, label) => {
  await app.evalJs(`[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === ${JSON.stringify(label)})?.click()`);
  await sleep(400);
};

await withHarness(async (app) => {
  const FLOOR = 7; // Fable's own line: "page text ... is >=7:1 in Flux dark and light"

  // P1 — the page surface itself, across every mode that reaches it
  // (Free Write/Draft/Revise), across every theme/page tone this app
  // currently ships a dark pair for (plateau/light stands as the
  // already-healthy control).
  for (const [theme, page] of [['plateau', 'light'], ['flux', 'light'], ['flux', 'dark']]) {
    const T = `[${theme}/${page}]`;
    await freshPage(app, theme, page, { id: `fpi-p1-${theme}-${page}` });
    const now = await app.evalJs("(() => ({ theme: document.documentElement.getAttribute('data-theme') || 'plateau', page: document.documentElement.getAttribute('data-page') || 'light' }))()");
    ok(`${T} (premise) the page is in theme=${theme} page=${page}`, now.theme === theme && now.page === page, JSON.stringify(now));

    // ---- PARKED - SUPERSEDED by FLUX WORDS (Nick's Oct 12 pass, folded into flux-v2): under Flux the mode tabs read Wire In / Draft / Patch (Draft is held for Fable's confirmation and still reads Draft); Arbor keeps Free Write / Draft / Revise.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // for (const modeLabel of ['Free Write', 'Draft', 'Revise']) {
    const modeLabels = theme === 'flux' ? ['Wire In', 'Draft', 'Patch'] : ['Free Write', 'Draft', 'Revise'];
    for (const modeLabel of modeLabels) {
      await switchMode(app, modeLabel);
      const active = await app.evalJs("document.querySelector('.desk-mode-tab.active')?.textContent");
      ok(`${T} (premise) ${modeLabel} tab is active after switching`, active === modeLabel, JSON.stringify({ active }));
      const c = await contrastOf(app, ED);
      ok(`${T} P1 ${modeLabel}: the page text carries against its own page (computed ${c?.ratio}:1, >= ${FLOOR})`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
    }
  }

  // P2 — the typewriter fade's CURRENT line. The fade mask (index.css
  // .mode-scroll[data-typewriter='true'][data-scrolled='true']) only dims
  // SCROLLED-PAST history (alpha ramps 15%→100% over --tw-fade-band); the
  // active line always sits in the fully-opaque zone, so its own computed
  // `color` — what contrastOf measures — must carry the identical fix. This
  // proves the typewriter path doesn't reach past the one hand-off site and
  // reapply the raw ink some other way.
  for (const [theme, page] of [['flux', 'dark'], ['flux', 'light']]) {
    const T = `[${theme}/${page}]`;
    await freshPage(app, theme, page, { id: `fpi-p2-${theme}-${page}` });
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
    for (let i = 1; i <= 6; i += 1) { await app.typeKeys(`\nMore history riding up into the page, line ${i}.`); await sleep(120); }
    let scrolled = false;
    try { await app.waitFor("document.querySelector('.mode-scroll')?.dataset.scrolled === 'true'", { label: 'history scrolled', timeout: 6000 }); scrolled = true; } catch { /* recorded as a failed premise below */ }
    ok(`${T} (premise) the typewriter has engaged and the history has scrolled`, scrolled);
    if (scrolled) {
      const c = await contrastOf(app, ED);
      ok(`${T} P2: the typewriter fade's active line keeps the fixed ink (computed ${c?.ratio}:1, >= ${FLOOR}) — the mask dims history, never the current line's own colour`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
    }
  }

  // P3 — the unframed pen bar's own three swatches (ModeStage.tsx, <1100px):
  // the one place a writer can still pick red/blue, not only the framed
  // host's dead-default black-brown. Each of the three PEN_INKS entries
  // must clear the floor once chosen, in Flux dark.
  {
    const T = '[flux/dark unframed]';
    await freshPage(app, 'flux', 'dark', { width: 800, id: 'fpi-p3' });
    const swatchCount = await app.evalJs("document.querySelectorAll('.mode-swatch').length");
    ok(`${T} (premise) the unframed pen bar shows its 3 ink swatches`, swatchCount === 3, JSON.stringify({ swatchCount }));
    for (let i = 0; i < swatchCount; i += 1) {
      await app.evalJs(`document.querySelectorAll('.mode-swatch')[${i}].click()`);
      await sleep(200);
      const c = await contrastOf(app, ED);
      ok(`${T} P3 swatch ${i}: the chosen pen ink carries against Flux dark's page (computed ${c?.ratio}:1, >= ${FLOOR})`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
    }
  }

  // P4 — theme-leftovers (Fable, Oct 16): "Flux light Free Write's default
  // pen ink is Arbor's #1A0F06; use Flux's ink instead." NOT a contrast gap —
  // P1 above already proves Arbor's black-brown carries fine on Flux light's
  // own paper, so it never caught this — it is an IDENTITY gap: the default
  // swatch was never re-pointed to Flux's own ink there at all. Asserts the
  // actual rendered colour, not just that it carries.
  {
    const T = '[flux/light default ink]';
    await freshPage(app, 'flux', 'light', { id: 'fpi-p4' });
    const c = await contrastOf(app, ED);
    // ---- PARKED - SUPERSEDED by FLUX V2 (Fable's brief, Nick Oct 21): Flux light's --ink-on-paper is now #042632 (rgb(4, 38, 50)); the default pen ink still IS that ink - the identity claim is unchanged, the value moved.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // ok(`${T} P4: Free Write's default pen ink is Flux's OWN ink (--ink-on-paper #14231F = rgb(20, 35, 31)), never Arbor's literal #1A0F06 (computed ${c?.fg})`,
    //   !!c && c.fg === 'rgb(20, 35, 31)', JSON.stringify(c));
    ok(`${T} P4 [flux-v2 successor]: Free Write's default pen ink is Flux's OWN ink (--ink-on-paper #042632 = rgb(4, 38, 50)), never Arbor's literal #1A0F06 (computed ${c?.fg})`,
      !!c && c.fg === 'rgb(4, 38, 50)', JSON.stringify(c));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nFLUX-PAGE-INK VERIFY: PASS (${checks.length} checks)` : `\nFLUX-PAGE-INK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
