// CARD-LABEL-CONTRAST (Fable, fast lane, after flux-card-ink @ d4c83947) -
// "Nick kept the footers, so they must be readable." Four selectors paint
// straight from the dark-chrome text tiers (--text-low/--text-mid/--accent-
// rest - tuned for --ink-900-family surfaces) onto the board card's own
// --card-stock: .board-card-footer (the connections footer), .board-pin-
// badge (a page-pin's "Board pin"/"Board"/ported-card badge), .board-pin-
// excerpt (folded in, Fable's follow-up: same ask, same rule), .board-
// layer-toggle (the layer-order icon on an overlapping selected card). Unlike
// flux-card-ink's --ink-on-paper (which genuinely flips light/dark by
// theme), --card-stock is itself left un-themed - so ONE value each
// (--ink-on-card-meta, --badge-on-card) clears the floor in every theme by
// construction, no per-tone divergence needed. This file proves that by
// measuring all four across plateau/light, flux/light, flux/dark alike.
//
// Extends flux-card-ink.mjs's own method verbatim: WCAG 2.x contrast,
// computed against the first opaque ancestor background (bg2.mjs's
// original pattern), never eyeballed, never assumed from the token name.
// Run: node scripts/harness/card-label-contrast.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const click = async (app, p, clickCount = 1) => {
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  await mouse(app, 'mouseReleased', p.x, p.y, clickCount, 0);
};
// card-label-contrast round 2 (Fable, Oct 15) — a plain centerOf(A) landed
// INSIDE the zone A and B share: A is x:[0.08,0.30] y:[0.08,0.24], B is
// x:[0.14,0.36] y:[0.12,0.28] (both fractions of the board), so A's own
// geometric center (0.19, 0.16) sits inside the overlap (B covers that
// point at z:2, above A's z:1) - the click hit B, not A, so A never got
// selected and its own data-overlapping attribute never had a chance to
// flip. This reads A's rect and picks a point 12px in from its TOP-LEFT
// corner instead - inside A, outside the region B covers, so the click
// can only ever land on A.
const nonOverlapPointOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const r = el.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + 12) }; })()`);

// WCAG 2.x contrast - the element's own rendered colour against the first
// opaque background walking up the ancestor chain. Copied verbatim from
// flux-card-ink.mjs's own contrastOf (itself bg2.mjs's own method).
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

// A board with: a page-pin (-> .board-pin-badge), two overlapping text cards
// joined by a connection (-> .board-card-footer on both), one of them
// selected while overlapping (-> .board-layer-toggle, per BoardEditor.tsx's
// own data-overlapping attribute - waited on directly rather than guessed
// from geometry).
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
  // multi-line text - notecardExcerpt only fills .board-pin-excerpt from a
  // SECOND line onward (BoardEditor.tsx), so a one-line page would leave it
  // empty and untestable.
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'clc-pin-target', text: 'A page to pin\nwith a second line, so the pin card has an excerpt to show.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: 'clc-board', text: 'Label contrast board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
    boxes: [
      { id: 'clc-text-a', kind: 'text', x: 0.08, y: 0.08, w: 0.22, h: 0.16, z: 1, text: 'Card A' },
      { id: 'clc-text-b', kind: 'text', x: 0.14, y: 0.12, w: 0.22, h: 0.16, z: 2, text: 'Card B' },
      { id: 'clc-conn', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 0, connA: 'clc-text-a', connB: 'clc-text-b' },
      { id: 'clc-pin', kind: 'page-pin', x: 0.5, y: 0.08, w: 0.22, h: 0.16, z: 1, entryId: 'clc-pin-target' },
    ],
  })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/clc-board'");
  await app.waitFor("!!document.querySelector('[data-box-id=\"clc-text-a\"]')", { label: 'the board cards' });
  await sleep(600);
};

await withHarness(async (app) => {
  const FLOOR = 4.5; // Fable's own line: "reach >=4.5:1... in every theme (Arbor included)"

  for (const [theme, page] of [['plateau', 'light'], ['flux', 'light'], ['flux', 'dark']]) {
    const T = `[${theme}/${page}]`;
    await freshBoard(app, theme, page);
    const now = await app.evalJs("(() => ({ theme: document.documentElement.getAttribute('data-theme') || 'plateau', page: document.documentElement.getAttribute('data-page') || 'light' }))()");
    ok(`${T} (premise) the board is in theme=${theme} page=${page}`, now.theme === theme && now.page === page, JSON.stringify(now));

    // C1 - the connections footer (present on BOTH joined cards; measured on A)
    const footerC = await contrastOf(app, '[data-box-id="clc-text-a"] .board-card-footer');
    ok(`${T} C1: the connections footer carries against its own card stock (computed ${footerC?.ratio}:1, >= ${FLOOR})`, !!footerC && footerC.ratio >= FLOOR, JSON.stringify(footerC));

    // C2 - the page-pin's own badge ("Board pin")
    const badgeC = await contrastOf(app, '[data-box-id="clc-pin"] .board-pin-badge');
    ok(`${T} C2: the pin's badge carries against its own card stock (computed ${badgeC?.ratio}:1, >= ${FLOOR})`, !!badgeC && badgeC.ratio >= FLOOR, JSON.stringify(badgeC));

    // C2b - the pin's own excerpt line (folded in, Fable's follow-up: same
    // ask, same >=4.5:1 rule). Premise named explicitly first: notecardExcerpt
    // only fills this from the pin target's SECOND line onward, so if the
    // seeded text or the pin's own render ever regresses, this fails with
    // its own name rather than contrastOf silently returning null into a
    // vague "C2b" red.
    const excerptPremise = await app.evalJs("(() => { const el = document.querySelector('[data-box-id=\"clc-pin\"] .board-pin-excerpt'); return { present: !!el, text: el ? el.textContent : null }; })()");
    ok(`${T} (premise) the pin's own excerpt element exists and is non-empty`, excerptPremise.present && !!excerptPremise.text, JSON.stringify(excerptPremise));
    if (excerptPremise.present) {
      const excerptC = await contrastOf(app, '[data-box-id="clc-pin"] .board-pin-excerpt');
      ok(`${T} C2b: the pin's excerpt carries against its own card stock (computed ${excerptC?.ratio}:1, >= ${FLOOR})`, !!excerptC && excerptC.ratio >= FLOOR, JSON.stringify(excerptC));
    }

    // C3 - the layer-order toggle - select the overlapping card A, wait for
    // the board's own data-overlapping attribute rather than compute the
    // overlap geometry a second time here. Click A's own top-left corner
    // (nonOverlapPointOf), not its center, which sits inside the zone B
    // visually covers (B is z:2, above A's z:1) - a center click would
    // select B instead and A's own data-overlapping would never flip.
    const a = await nonOverlapPointOf(app, '[data-box-id="clc-text-a"]');
    if (a) await click(app, a, 1);
    let overlapping = false;
    try {
      await app.waitFor("document.querySelector('[data-box-id=\"clc-text-a\"]')?.getAttribute('data-overlapping') === 'true'", { label: 'overlap flag', timeout: 2000 });
      overlapping = true;
    } catch { /* recorded as a failed premise below, not a crash */ }
    ok(`${T} (premise) selecting the overlapping card A sets data-overlapping`, overlapping);
    if (overlapping) {
      const toggleC = await contrastOf(app, '[data-box-id="clc-text-a"] .board-layer-toggle');
      ok(`${T} C3: the layer-order toggle carries against its own card stock (computed ${toggleC?.ratio}:1, >= ${FLOOR})`, !!toggleC && toggleC.ratio >= FLOOR, JSON.stringify(toggleC));
    }
  }

  // C4 - a single, un-themed value (not a per-tone override): the three
  // tokens read the identical literal in every tone, proving this fix
  // works BY CONSTRUCTION (one cream stock, one ink) rather than by luck
  // across three separately-tuned values.
  const seen = new Set();
  for (const [theme, page] of [['plateau', 'light'], ['flux', 'light'], ['flux', 'dark']]) {
    const T = `[${theme}/${page}]`;
    await freshBoard(app, theme, page);
    const vars = await app.evalJs("(() => { const cs = getComputedStyle(document.documentElement); return { meta: cs.getPropertyValue('--ink-on-card-meta').trim(), badge: cs.getPropertyValue('--badge-on-card').trim() }; })()");
    seen.add(JSON.stringify(vars));
    ok(`${T} C4: --ink-on-card-meta/--badge-on-card resolve (${vars.meta} / ${vars.badge})`, !!vars.meta && !!vars.badge, JSON.stringify(vars));
  }
  ok('C4: the same two values resolve in every tone - one un-themed ink, not three coincidences', seen.size === 1, JSON.stringify([...seen]));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCARD-LABEL-CONTRAST VERIFY: PASS (${checks.length} checks)` : `\nCARD-LABEL-CONTRAST VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
