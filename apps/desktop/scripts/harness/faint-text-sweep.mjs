// FAINT-TEXT-SWEEP (Fable, fast lane) — "find every small text on cream
// stock (cards, pins, sheets, wizard) still below 4.5:1 in any theme (the
// '-low' tier you flagged) and raise it."
//
// THE FLAG: flux-card-ink's own comment (index.css, --ink-on-card/-low block)
// and deckwizard-ink's own comment (.deck-wizard-eyebrow) both documented —
// but did not fix — that --ink-on-paper-low/--ink-on-card-low measured under
// 4.5:1 on BOTH this app's cream surfaces: 3.49:1/3.77:1 (Plateau, against
// --paper/--card-stock) and 4.34:1/4.43:1 (Flux light). Flux dark was already
// safe (its own --ink-on-card-low override, flux-card-ink). Since the two
// un-fixed tones share ONE token (--ink-on-paper-low, aliased by
// --ink-on-card-low in both), every consumer of the "-low" tier on cream was
// faint by defect, not by design, in Plateau and Flux light: the page's own
// placeholder/ghost-text/script-ghost, the page-pin's "Missing page" label
// (painted from the DIFFERENT dark-chrome tier, --text-low — card-label-
// contrast's exact bug class, missed in that sweep), the card pop-up's
// eyebrow/close-X (already re-asserted by flux-card-ink.mjs's own successor,
// not duplicated here), the word count, and more.
//
// THE FIX (index.css): --ink-on-paper-low darkened in the two failing blocks
// — Plateau to the already-proven-safe --ink-on-card-meta value (#6B5F4E,
// card-label-contrast), Flux light one step down its own teal ramp (#096986)
// — plus .board-pin-missing repointed from --text-low to --ink-on-card-meta.
// Flux dark's existing override is untouched. The ONE deliberately faint
// exception — .fl-affordance/.fl-prompt/.fl-never's own opacity .55-.75
// (F6's "faint by design" first-line invitation) — is untouched on purpose:
// this sweep raises the base ink, not a named fade.
//
// Contrast is COMPUTED (WCAG 2.x relative luminance against the first opaque
// ancestor background for elements; against the two token backgrounds
// directly for the token-level checks), never eyeballed — the same method
// bg2.mjs/flux-card-ink.mjs/card-label-contrast.mjs all share.
// Run: node scripts/harness/faint-text-sweep.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Token-vs-token contrast — no element needed, so this works even where no
// consumer happens to be mounted this frame: reads both CSS custom
// properties live off :root and computes WCAG against them directly.
const tokenContrastOf = (app, fgVar, bgVar) => app.evalJs(`(() => {
  const cs = getComputedStyle(document.documentElement);
  const parse = (c) => { const m = document.createElement('span'); m.style.color = c; document.body.appendChild(m);
    const rgb = getComputedStyle(m).color.match(/[\\d.]+/g).slice(0, 3).map(Number); m.remove(); return rgb; };
  const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const fg = cs.getPropertyValue(${JSON.stringify(fgVar)}).trim(), bg = cs.getPropertyValue(${JSON.stringify(bgVar)}).trim();
  const L1 = lum(parse(fg)), L2 = lum(parse(bg));
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  return { fg, bg, ratio: Math.round(ratio * 100) / 100 };
})()`);

const freshBoard = async (app, theme, page, { width = 1400 } = {}) => {
  await app.emulateDpr(1, width, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* theme premise below still records */ }
  if (theme === 'flux') await app.evalJs("window.wrizoTheme.set('flux')");
  if (page === 'dark') await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' })");
  await sleep(200);
  // A board whose one box is a page-pin pointing at an entryId that was
  // NEVER created — BoardEditor.tsx's own getJournalEntryIncludingDeleted
  // returns null for it, which is exactly what renders .board-pin-missing
  // ("Missing page") rather than a real card's face.
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: 'fts-board', text: 'Faint text sweep board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
    boxes: [{ id: 'fts-missing-pin', kind: 'page-pin', x: 0.1, y: 0.08, w: 0.22, h: 0.16, z: 1, entryId: 'fts-never-created' }],
  })})`);
  await sleep(300);
  await app.evalJs("location.hash = '#/page/fts-board'");
  await app.waitFor("!!document.querySelector('[data-box-id=\"fts-missing-pin\"]')", { label: 'the board card' });
  await sleep(500);
};

const freshPage = async (app, theme, page, { width = 800, id = 'fts-page' } = {}) => {
  await app.emulateDpr(1, width, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* theme premise below still records */ }
  if (theme === 'flux') await app.evalJs("window.wrizoTheme.set('flux')");
  if (page === 'dark') await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' })");
  await sleep(200);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'A page for the sheet checks.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' });
  await sleep(500);
};

await withHarness(async (app) => {
  const FLOOR = 4.5; // this project's own established floor (card-label-contrast, flux-card-ink)
  const TONES = [['plateau', 'light'], ['flux', 'light'], ['flux', 'dark']];

  // P1 — the token itself, against BOTH cream surfaces it governs. This is
  // the root-cause check: if these hold, every consumer of the "-low" tier
  // on cream carries by construction, not by luck per-selector.
  for (const [theme, page] of TONES) {
    const T = `[${theme}/${page}]`;
    await freshPage(app, theme, page, { id: `fts-p1-${theme}-${page}` });
    const now = await app.evalJs("(() => ({ theme: document.documentElement.getAttribute('data-theme') || 'plateau', page: document.documentElement.getAttribute('data-page') || 'light' }))()");
    ok(`${T} (premise) the page is in theme=${theme} page=${page}`, now.theme === theme && now.page === page, JSON.stringify(now));

    const paperLow = await tokenContrastOf(app, '--ink-on-paper-low', '--paper');
    ok(`${T} P1: --ink-on-paper-low carries against --paper (computed ${paperLow?.ratio}:1, >= ${FLOOR})`, !!paperLow && paperLow.ratio >= FLOOR, JSON.stringify(paperLow));

    const cardLow = await tokenContrastOf(app, '--ink-on-card-low', '--card-stock');
    ok(`${T} P1: --ink-on-card-low carries against --card-stock (computed ${cardLow?.ratio}:1, >= ${FLOOR})`, !!cardLow && cardLow.ratio >= FLOOR, JSON.stringify(cardLow));
  }

  // P2 — the pin: .board-pin-missing was painting from --text-low (the
  // dark-chrome tier), card-label-contrast's exact bug class, on this
  // card's own --card-stock. Now --ink-on-card-meta, already proven safe.
  for (const [theme, page] of TONES) {
    const T = `[${theme}/${page}]`;
    await freshBoard(app, theme, page);
    const c = await contrastOf(app, '[data-box-id="fts-missing-pin"] .board-pin-missing');
    ok(`${T} P2: the missing-page pin's own label carries against its card stock (computed ${c?.ratio}:1, >= ${FLOOR})`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
  }

  // P3 — the sheet: the page's own word-count overlay, painted directly on
  // --paper from --ink-on-paper-low (unframed bar only — ModeStage.tsx's
  // own `!framed` gate; .board-popup-eyebrow/-close, the OTHER cream-stock
  // consumers of this same token pair, are re-asserted by flux-card-ink.mjs's
  // own successor check, not duplicated here).
  for (const [theme, page] of TONES) {
    const T = `[${theme}/${page}]`;
    await freshPage(app, theme, page, { width: 800, id: `fts-p3-${theme}-${page}` });
    const c = await contrastOf(app, '.mode-wordcount');
    ok(`${T} P3: the page's own word-count carries against its sheet (computed ${c?.ratio}:1, >= ${FLOOR})`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nFAINT-TEXT-SWEEP VERIFY: PASS (${checks.length} checks)` : `\nFAINT-TEXT-SWEEP VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
