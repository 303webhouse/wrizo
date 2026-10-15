// FLUX-CARD-INK (Chat 1 ledger 47, Nick: live Journal board, "Flux dark... card
// text on the board is pale teal on cream stock - nearly unreadable"; Arbor is
// fine). Root cause: --card-stock is deliberately un-themed (the SAME cream in
// every theme/tone, index.css FX4 S7) but the card's text/footer/label colour
// read straight from --ink-on-paper, which Flux's dark page flips LIGHT to suit
// its own dark --paper - a light ink landing on the card's own light stock
// regardless. Fix: a card-scoped --ink-on-card/-low pair, aliased to
// --ink-on-paper/-low everywhere that already worked (Arbor, Flux light) and
// overridden only under [data-theme='flux'][data-page='dark'].
//
// Contrast is COMPUTED (WCAG 2.x relative luminance against the first opaque
// ancestor background), never eyeballed, the same method bg2.mjs's own S1/S2
// established. Every theme/tone this ticket names is walked: Plateau (light
// only - canon's own flagged debt, no dark pair), Flux light, Flux dark.
// Run: node scripts/harness/flux-card-ink.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CARD = '[data-box-id="fci-card"]';

const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const click = async (app, p, clickCount = 1) => {
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  await mouse(app, 'mouseReleased', p.x, p.y, clickCount, 0);
};
const centerOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);

// WCAG 2.x contrast, computed element-side, same method as bg2.mjs's own
// CONTRAST_JS: the element's own rendered colour against the first opaque
// background walking up the ancestor chain, never an assumed token.
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

const freshBoard = async (app, theme, page) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the theme premise below still records */ }
  if (theme === 'flux') await app.evalJs("window.wrizoTheme.set('flux')");
  if (page === 'dark') await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' })");
  await sleep(200);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fci-board', text: 'Ink board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
    boxes: [{ id: 'fci-card', kind: 'text', x: 0.1, y: 0.08, w: 0.22, h: 0.14, z: 1, text: 'Card ink check' }] })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/fci-board'");
  await app.waitFor(`!!document.querySelector('${CARD}')`, { label: 'the card' });
  await sleep(600);
};

const openPopup = async (app) => {
  const c = await centerOf(app, CARD);
  if (!c) return false;
  await click(app, c, 1);
  await sleep(60);
  await click(app, c, 2);
  try { await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'card popup open', timeout: 4000 }); } catch { return false; }
  await sleep(250);
  return true;
};

await withHarness(async (app) => {
  const FLOOR = 4.5; // Fable's own line: "contrast at least 4.5:1"

  for (const [theme, page] of [['plateau', 'light'], ['flux', 'light'], ['flux', 'dark']]) {
    const T = `[${theme}/${page}]`;
    await freshBoard(app, theme, page);
    const now = await app.evalJs("(() => ({ theme: document.documentElement.getAttribute('data-theme') || 'plateau', page: document.documentElement.getAttribute('data-page') || 'light' }))()");
    ok(`${T} (premise) the board is in theme=${theme} page=${page}`, now.theme === theme && now.page === page, JSON.stringify(now));

    // C1 - the card's own body text (the symptom Nick saw directly: "card
    // text on the board... nearly unreadable")
    const textC = await contrastOf(app, '.board-text');
    ok(`${T} C1: a card's own body text carries against its stock (computed ${textC?.ratio}:1, >= ${FLOOR})`, !!textC && textC.ratio >= FLOOR, JSON.stringify(textC));

    const opened = await openPopup(app);
    ok(`${T} (premise) a real double-click opens the card's pop-up`, opened);
    if (opened) {
      // C2 - the opened card's own editor text (same stock, same ink family,
      // the card's text as the writer actually edits it)
      const editC = await contrastOf(app, '.board-popup-editor');
      ok(`${T} C2: the card's own editor text carries against the pop-up's stock (computed ${editC?.ratio}:1, >= ${FLOOR})`, !!editC && editC.ratio >= FLOOR, JSON.stringify(editC));

      // C3 - "footers and labels too" (Fable's own words): the eyebrow label
      // and the close-X, both small, both on the SAME card stock.
      const eyebrowC = await contrastOf(app, '.board-popup-eyebrow');
      ok(`${T} C3: the pop-up's eyebrow label carries against its stock (computed ${eyebrowC?.ratio}:1, >= ${FLOOR})`, !!eyebrowC && eyebrowC.ratio >= FLOOR, JSON.stringify(eyebrowC));
      const closeC = await contrastOf(app, '.board-popup-close');
      ok(`${T} C3: the pop-up's close-X carries against its stock (computed ${closeC?.ratio}:1, >= ${FLOOR})`, !!closeC && closeC.ratio >= FLOOR, JSON.stringify(closeC));

      await app.key('Escape');
      await sleep(300);
    }
  }

  // C4 - the mechanism, not just the outcome: --ink-on-card/-low alias to
  // --ink-on-paper/-low verbatim in every tone EXCEPT flux/dark, where they
  // diverge. Proves the fix is the override actually firing, not two
  // separately-tuned values that coincidentally pass contrast the same way.
  for (const [theme, page] of [['plateau', 'light'], ['flux', 'light'], ['flux', 'dark']]) {
    const T = `[${theme}/${page}]`;
    await freshBoard(app, theme, page);
    const vars = await app.evalJs(`(() => { const cs = getComputedStyle(document.documentElement);
      return { card: cs.getPropertyValue('--ink-on-card').trim(), cardLow: cs.getPropertyValue('--ink-on-card-low').trim(),
        paper: cs.getPropertyValue('--ink-on-paper').trim(), paperLow: cs.getPropertyValue('--ink-on-paper-low').trim() }; })()`);
    const shouldAlias = !(theme === 'flux' && page === 'dark');
    ok(`${T} C4: --ink-on-card ${shouldAlias ? 'aliases' : 'diverges from'} --ink-on-paper (${vars.card} vs ${vars.paper})`,
      shouldAlias ? vars.card === vars.paper : vars.card !== vars.paper, JSON.stringify(vars));
    ok(`${T} C4: --ink-on-card-low ${shouldAlias ? 'aliases' : 'diverges from'} --ink-on-paper-low (${vars.cardLow} vs ${vars.paperLow})`,
      shouldAlias ? vars.cardLow === vars.paperLow : vars.cardLow !== vars.paperLow, JSON.stringify(vars));
  }

});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nFLUX-CARD-INK VERIFY: PASS (${checks.length} checks)` : `\nFLUX-CARD-INK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
