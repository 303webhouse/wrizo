// SCROLLBAR-FLUSH (Fable Oct 23: Nick, live on Flux — "the page scrollbar is bulky and floats
// INSIDE the page"; Arbor had the same glitch). Round 2 (Fable, after the first box run was RED 24/32): the harness
// asserts Nick's RULE, never a guessed number. The first version asserted "exactly 8px" and "gap < 1", and both were
// the harness's guess, not the rule: Chromium >= 121 (Electron 31 = Chromium 126) IGNORES `::-webkit-scrollbar` on any
// element whose scrollbar-width/scrollbar-color is set, and the systemic `*` rule sets both - so the 8px webkit rule
// was dead and the bar renders the NATIVE thin width (10px). The app now has ONE mechanism (the standard properties;
// the dead webkit rules are deleted), and the rendered width is whatever native thin is, bounded by the rule (<= 10px).
// The 1px "gap" is .mode-page's own border: .mode-scroll sits inside it, so the bar is flush on the page edge when the
// gap is the border's width (<= 1px) - an overshoot past the edge (negative) is the narrow-margin bug.
//
// See the sibling browserless file, scrollbar-flush-source.mjs (7/7 green, confirmed red on the
// pre-fix source), for the full root-cause writeup: FX10 S4's own cancellation (`.mode-scroll`'s
// margin-right/padding-right) was hardcoded to the literal `38px`, `.mode-page`'s own padding at
// the time; ITEM 83 M3 (R6) later made that padding a per-page SETTING (`--wz-page-pad-x`, PAGE
// SETUP's margins: narrow 26px / normal 38px / wide 58px) without updating FX10's own literal —
// any page set to narrow or wide broke the flush cancellation. The fix reads the SAME shared
// variable both rules now share. `scrollbar-minimal`'s custom-overlay branch (Nick's Oct 12
// "option B" by name) is dead code, absent from main, and irrelevant to this fix — the native
// `scrollbar-width`/`::-webkit-scrollbar` system (FX7/FX10), already shipped, achieves the full
// spec ("thin, full height, on the page's edge, barely noticeable, never mid-page") once this
// one hardcoded value is desynced no more.
//
// What is proven, for EACH of 4 theme/page-tone cells (Arbor light, Arbor dark [Plateau's own
// documented no-op — canon §11, "Page:dark has no Plateau values yet" — included to confirm
// nothing breaks there either, not because it looks different from Arbor light], Flux light,
// Flux dark) CROSSED WITH each of the 3 margin settings (normal/narrow/wide) — 12 scenarios:
//   POSITION: .mode-scroll's own border-box right edge sits flush against .mode-page's right edge: the gap
//     (page.right - scroll.right) is at most the page's own 1px border and never negative (no overshoot) — "on the
//     page's edge, never mid-page" — at EVERY margin setting, not just the default
//   WIDTH (the rule, not a number): scrollbar-width resolves to 'thin' AND the rendered bar (offsetWidth -
//     clientWidth, the standard way to measure a native vertical scrollbar when no border is set) is between 1 and 10px
//   TONE: the resolved scrollbar-color carries the cell's own --ink-on-paper-low (theme- and page-tone-aware)
//   FULL HEIGHT (checked once per theme/tone cell, margin-independent): .mode-scroll's own
//     client height equals .mode-page's available content-box height (title/wordcount space
//     excluded) — its native scrollbar's track necessarily spans that whole box; no custom
//     positioning math to get wrong, unlike scrollbar-minimal's own stuck S5
//
// Fixture: a long seeded Draft page (enough text to genuinely overflow .mode-scroll, so a real
// scrollbar paints — a short page has NO scrollbar at all, which would make POSITION/WIDTH
// vacuous). Seeded through the app's own seam (window.wrizoCreateJournalPage, AGENTS.md's
// seeding law), never raw localStorage.
//
// Run (once a box-turn grant is held by this lane — from apps/desktop, dist-web freshly built):
//   node apps/desktop/scripts/harness/scrollbar-flush.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const parkedChecks = [];
const parkReads = { page: [] };   // the default leg's own page-bar reads, for the parked records at the foot (item 3, 3840)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function hexToRgbFragment(hex) {
  const h = hex.replace('#', '');
  return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`;
}

const LONG_TEXT = Array.from({ length: 400 }, (_, i) => `Line ${i + 1} of a long page, written only to force a real vertical scrollbar to paint.`).join('\n');

const seedAndOpen = async (app, theme, pageTone, [vw, vh] = [1400, 900]) => {
  await app.emulateDpr(1, vw, vh);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: pageTone, fade: 'on' }))});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk, theme=${theme}/${pageTone}` });
  // seed a long page through the seam (AGENTS.md's seeding law), while OFF a surface with a
  // flush handler (the Desk, confirmed by freshDesk's own house convention)
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'sbf-${theme}-${pageTone}-${vw}', text: ${JSON.stringify(LONG_TEXT)}, createdAt: now, origin: null, source: 'page' });
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });
  await app.evalJs(`location.hash = '#/page/sbf-${theme}-${pageTone}-${vw}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'The long page, mounted' });
  await sleep(300);
};

const setMargin = async (app, margin) => {
  // PAGE SETUP lives in the "page" cascade panel (data-category="page"), alongside the Pages
  // pop-out, the Page face and Places — open it, find the margin radio by its own TEXT (theme-
  // invariant: 'Normal'/'Narrow'/'Wide' have no OVERRIDES entry under any theme, confirmed by
  // source read), click it, close the panel so it never covers the measurement.
  const label = margin === 'normal' ? 'Normal' : margin === 'narrow' ? 'Narrow' : 'Wide';
  await app.evalJs("document.querySelector('[data-category=\"page\"]')?.click()");
  await app.waitFor("!!document.querySelector('.wz-page-setup-seg')", { label: 'PAGE SETUP open' });
  await app.evalJs(`[...document.querySelectorAll('.wz-page-setup-seg [role="radio"]')].find((b) => b.textContent.trim() === ${JSON.stringify(label)})?.click()`);
  await sleep(150);
  await app.evalJs("document.querySelector('[data-category=\"page\"]')?.click()"); // close
  await sleep(200);
};

const measure = (app) => app.evalJs(`(() => {
  const scroll = document.querySelector('.mode-scroll');
  const page = document.querySelector('.mode-page');
  if (!scroll || !page) return null;
  const sr = scroll.getBoundingClientRect();
  const pr = page.getBoundingClientRect();
  return {
    gapFromPageEdge: pr.right - sr.right,
    pageBorderRight: parseFloat(getComputedStyle(page).borderRightWidth) || 0,
    scrollbarWidth: scroll.offsetWidth - scroll.clientWidth,
    scrollbarWidthProp: getComputedStyle(scroll).scrollbarWidth,
    scrollbarColor: getComputedStyle(scroll).scrollbarColor,
    inkOnPaperLow: getComputedStyle(document.documentElement).getPropertyValue('--ink-on-paper-low').trim(),
    scrollHeight: scroll.scrollHeight,
    clientHeight: scroll.clientHeight,
    pageHeight: page.getBoundingClientRect().height,
    // the applied scale is read from the page's OWN computed transform (matrix(a, ...)), never from the variable the rule reads - an independent measurement
    appliedScale: (() => { const t = getComputedStyle(page).transform; return !t || t === 'none' ? 1 : new DOMMatrixReadOnly(t).a; })(),
    thumbColor: getComputedStyle(scroll, '::-webkit-scrollbar-thumb').backgroundColor,
    stageK: parseFloat(getComputedStyle(document.querySelector('.desk-frame-stage--prose') || document.body).getPropertyValue('--wz-k')) || 1,
    zoomVar: parseFloat(getComputedStyle(document.querySelector('.desk-frame-stage--prose') || document.body).getPropertyValue('--wz-zoom')) || 1.6,
    viewport: [innerWidth, innerHeight],
    // the TEXT COLUMN, in layout px (offsetWidth / clientWidth are layout widths, never the painted ones): the editor's own width, and .mode-scroll's content box (clientWidth less its padding)
    columnEditor: (document.querySelector('.forward-only-editor') || {}).offsetWidth,
    columnScroll: scroll.clientWidth - parseFloat(getComputedStyle(scroll).paddingLeft) - parseFloat(getComputedStyle(scroll).paddingRight),
    scrollPadRight: parseFloat(getComputedStyle(scroll).paddingRight),
    // the padding BEYOND the margin cancellation the plain rule already carries (the page's own right padding, which offsets .mode-scroll's negative margin): the pairing's (10px - the bar)
    scrollPadExtra: parseFloat(getComputedStyle(scroll).paddingRight) - (parseFloat(getComputedStyle(page).paddingRight) || 0),
  };
})()`);

const CELLS = [
  ['plateau', 'light', 'Arbor light'],
  ['plateau', 'dark', 'Arbor dark (Plateau\'s own documented no-op, canon §11)'],
  ['flux', 'light', 'Flux light'],
  ['flux', 'dark', 'Flux dark'],
];
const MARGINS = ['normal', 'narrow', 'wide'];

await withHarness(async (app) => {
  for (const [theme, pageTone, label] of CELLS) {
    await seedAndOpen(app, theme, pageTone);

    // FULL HEIGHT — margin-independent, checked once per cell: the scroll box genuinely
    // overflows (a real scrollbar exists to measure) and fills .mode-page's own available space.
    const baseline = await measure(app);
    ok(`FULL HEIGHT [${label}]: the page genuinely overflows (a real scrollbar paints, not a vacuous measurement)`,
      !!baseline && baseline.scrollHeight > baseline.clientHeight, JSON.stringify(baseline));
    ok(`FULL HEIGHT [${label}]: .mode-scroll's own box is a large fraction of .mode-page's height (flex:1 filling the available space, not a short box leaving a visible gap above/below the track)`,
      !!baseline && baseline.clientHeight > baseline.pageHeight * 0.6, JSON.stringify(baseline));

    for (const margin of MARGINS) {
      await setMargin(app, margin);
      const m = await measure(app);
      ok(`POSITION [${label}, margin=${margin}]: the bar is flush on the page edge - the gap is at most the page's own border (<= 1px) and never negative (no overshoot), never mid-page`,
        !!m && m.gapFromPageEdge >= -0.5 && m.gapFromPageEdge <= Math.max(1, m.pageBorderRight) + 0.01, JSON.stringify(m));
      parkReads.page.push({ label, margin, m });
      // SUPERSEDED (item 3, Fable Oct 23, reading A): the page bar is the ONE webkit exception now (index.css, inside @supports selector(::-webkit-scrollbar)), so `scrollbar-width` and `scrollbar-color` resolve to
      // 'auto' on it. WIDTH used to say "THIN - scrollbar-width resolves to 'thin' and the rendered width is 1-10px" and TONE read the resolved scrollbar-color; both are quoted verbatim in the PARKED records at the
      // foot. Their live successors: the bar is 10px PAINTED (layout width x the applied scale), thin ('thin' is still what every OTHER scroller resolves - the BOARD checks), and its square thumb wears the
      // cell's own paper-toned --ink-on-paper-low (read from the thumb's own pseudo-element style).
      ok(`WIDTH [${label}, margin=${margin}] [item 3 successor]: the page bar is 10px PAINTED - the exception's scrollbar-width resolves to 'auto' (the pseudo rules are honoured), and (layout width x the applied scale) is within the pixel the scale rounds it to`,
        !!m && m.scrollbarWidthProp === 'auto' && m.scrollbarWidth >= 1 && Math.abs(m.scrollbarWidth * m.appliedScale - 10) <= 0.5 * m.appliedScale + 0.25, JSON.stringify(m));
      ok(`TONE [${label}, margin=${margin}] [item 3 successor]: the page bar's SQUARE thumb wears this cell's own paper-toned colour (--ink-on-paper-low), not the dark-chrome default`,
        !!m && !!m.inkOnPaperLow && typeof m.thumbColor === 'string' && m.thumbColor.includes(hexToRgbFragment(m.inkOnPaperLow)), JSON.stringify(m));
    }
  }
  // ITEM 3 (Fable Oct 23: "at 3840 the page scrollbar scales up with the page"): page-size paints the prose page with transform:scale(--wz-k) (k x --wz-zoom while zoomed) and `.mode-scroll` sits inside it, so a
  // native bar would paint at 10 x the scale. The exception makes the layout width 10px / the applied scale; here the PAINTED width - (offsetWidth - clientWidth) x the scale the browser REALLY applied to .mode-page
  // (its computed transform's matrix, not the variable the rule reads) - must be 10px at every size, including zoomed. The scale is asserted > 1 where the scenario claims it (3840, zoom): a check that measures
  // the same 10 because nothing was scaled would pass blind. Pixel rounding: the bar's layout width is whole pixels, so the painted width is within half a layout pixel x the scale of 10.
  const paint = {};
  for (const [name, size, zoom] of [['1366', [1366, 768], false], ['3840', [3840, 2160], false], ['3840 zoomed', [3840, 2160], true], ['1366 zoomed', [1366, 768], true]]) {
    await seedAndOpen(app, 'plateau', 'light', size);
    if (zoom) { await app.evalJs("document.querySelector('.mode-pagecol')?.setAttribute('data-zoom', 'true')"); await sleep(250); }
    let m = await measure(app);
    const want = (q) => (q ? q.stageK * (zoom ? q.zoomVar : 1) : 1);
    for (let i = 0; i < 24 && m && Math.abs(m.appliedScale - want(m)) > 0.005 * want(m); i += 1) { await sleep(250); m = await measure(app); }
    paint[name] = m;
    ok(`PAINT [${name}] settled: the transform the browser applied to .mode-page (${m ? m.appliedScale.toFixed(3) : '?'}) equals the scale page-size intends (--wz-k ${m ? m.stageK : '?'}${zoom ? ' x --wz-zoom ' + (m ? m.zoomVar : '?') : ''}) - the measurement is of the settled page, not a frame mid-arrival`, !!m && Math.abs(m.appliedScale - want(m)) <= 0.005 * want(m), JSON.stringify(m && { applied: m.appliedScale, stageK: m.stageK, zoomVar: m.zoomVar }));
    const tol = m ? 0.5 * m.appliedScale + 0.25 : 0;
    ok(`PAINT [${name}]: the page bar paints 10px (layout width ${m ? m.scrollbarWidth : '?'} x the applied scale ${m ? m.appliedScale.toFixed(3) : '?'}) - never the native bar scaled up with the page`,
      !!m && m.scrollbarWidth >= 1 && Math.abs(m.scrollbarWidth * m.appliedScale - 10) <= tol, JSON.stringify(m));
    if (name !== '1366') ok(`PAINT [${name}] premise: the page really IS scaled up here (applied scale > 1) - so the 10px above is the exception working, not an unscaled page`, !!m && m.appliedScale > 1.0001, m ? String(m.appliedScale) : '');
  }
  ok('PAINT: the page bar is the SAME painted width at 1366 and 3840 and zoomed (within one scaled pixel) - the scale does not leak into it', !!paint['1366'] && !!paint['3840'] && !!paint['3840 zoomed'] && [paint['3840'], paint['3840 zoomed']].every((q) => Math.abs(q.scrollbarWidth * q.appliedScale - paint['1366'].scrollbarWidth * paint['1366'].appliedScale) <= q.appliedScale + 0.5), JSON.stringify(Object.fromEntries(Object.entries(paint).map(([k, q]) => [k, q && [q.scrollbarWidth, q.appliedScale]]))));
  // THE TEXT COLUMN IS ONE WIDTH AT EVERY SCALE (Fable Oct 25, FIX's diagnosis of the L/B x19 + cd2 reds): the bar's layout width is round(10 / the applied scale), so a bar that takes a DIFFERENT layout width at each
  // scale took a different bite out of the column and reflowed the lines. The fix pairs the bar with a right padding of (10px - that width), so bar + padding is always 10 layout px and the column is the SAME width
  // at k = 1, k < 1, k > 1 and zoomed. Measured in layout px (offsetWidth / clientWidth), each against the k = 1 read; the scale is asserted to differ from 1 where the scenario claims it (the blind-pass guard).
  const col = {};
  for (const [name, size, zoom, want] of [['1366', [1366, 768], false, 'one'], ['1100x900', [1100, 900], false, 'scaled'], ['1280x900', [1280, 900], false, 'scaled'], ['3840 (k>1)', [3840, 2160], false, 'scaled'], ['3840 zoomed', [3840, 2160], true, 'scaled'], ['1366 zoomed', [1366, 768], true, 'scaled']]) {
    await seedAndOpen(app, 'plateau', 'light', size);
    if (zoom) { await app.evalJs("document.querySelector('.mode-pagecol')?.setAttribute('data-zoom', 'true')"); await sleep(250); }
    let m = await measure(app);
    const target = (q) => (q ? q.stageK * (zoom ? q.zoomVar : 1) : 1);
    for (let i = 0; i < 24 && m && Math.abs(m.appliedScale - target(m)) > 0.005 * target(m); i += 1) { await sleep(250); m = await measure(app); }
    col[name] = m;
    ok(`COLUMN [${name}] premise: the page really is at the scale the scenario claims (${m ? m.appliedScale.toFixed(3) : '?'} - ${want === 'one' ? 'k = 1' : 'k != 1'})`, !!m && (want === 'one' ? Math.abs(m.appliedScale - 1) < 0.005 : Math.abs(m.appliedScale - 1) > 0.005), m ? String(m.appliedScale) : '');
  }
  {
    const base = col['1366'];
    const sizes = Object.keys(col);
    const ks = sizes.map((n) => col[n] && col[n].appliedScale).filter((x) => typeof x === 'number');
    ok(`COLUMN premise: the scenarios really cover k < 1, k = 1 and k > 1 (applied scales ${ks.map((x) => x.toFixed(3)).join(', ')}) - the equality below is not three reads of an unscaled page`, ks.some((x) => x < 0.995) && ks.some((x) => Math.abs(x - 1) < 0.005) && ks.some((x) => x > 1.005), JSON.stringify(ks));
    ok(`COLUMN: the text column (the editor's layout width) is IDENTICAL at k = 1, k < 1, k > 1 and zoomed (${sizes.map((n) => `${n}: ${col[n] ? col[n].columnEditor : '?'}`).join(', ')})`, !!base && sizes.every((n) => !!col[n] && Math.abs(col[n].columnEditor - base.columnEditor) < 0.5), JSON.stringify(Object.fromEntries(sizes.map((n) => [n, col[n] && col[n].columnEditor]))));
    ok(`COLUMN: .mode-scroll's content box (clientWidth less its padding) is identical at every scale too (${sizes.map((n) => `${n}: ${col[n] ? col[n].columnScroll : '?'}`).join(', ')})`, !!base && sizes.every((n) => !!col[n] && Math.abs(col[n].columnScroll - base.columnScroll) < 0.5), JSON.stringify(Object.fromEntries(sizes.map((n) => [n, col[n] && col[n].columnScroll]))));
    ok(`COLUMN: bar + the pairing's extra right padding is 10 layout px at every scale (${sizes.map((n) => `${n}: ${col[n] ? col[n].scrollbarWidth + '+' + col[n].scrollPadExtra : '?'}`).join(', ')}), and the bar never exceeds 10`, !!base && sizes.every((n) => !!col[n] && col[n].scrollbarWidth <= 10 && Math.abs(col[n].scrollbarWidth + col[n].scrollPadExtra - 10) < 0.5), JSON.stringify(Object.fromEntries(sizes.map((n) => [n, col[n] && [col[n].scrollbarWidth, col[n].scrollPadExtra]]))));
  }
  // THE BOARD CANVAS (Fable Oct 23 - "INK's light board shows a thick dark thumb at the bottom"): the same rule on the board's own
  // scroll wrap - thin, <= 10px, paper-toned (the board's background is var(--paper)). Fixture = fx5's proven one: a tall card forces
  // the wrap to scroll; seeded through the app's seam while off any flush-handler surface (the Desk). The HORIZONTAL bar's thickness
  // is the wrap's offsetHeight - clientHeight (the bottom bar Nick saw), the vertical one's offsetWidth - clientWidth.
  for (const [theme, pageTone, label] of CELLS) {
    await app.emulateDpr(1, 1280, 700);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: pageTone, fade: 'on' }))});`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk (board), ${label}` });
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      window.wrizoCreateJournalPage({ id: 'sbf-board-${theme}-${pageTone}', text: 'Board', pageType: 'board', createdAt: now, origin: null,
        boxes: [{ id: 'sbf-tall', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 3, z: 1, text: 'A very tall card that forces the board canvas wrap to scroll.' }, { id: 'sbf-wide', kind: 'text', x: 0.9, y: 0.05, w: 0.3, h: 0.2, z: 2, text: 'A card past the right edge, to force a bottom bar.' }] });
    })()`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/sbf-board-${theme}-${pageTone}'`);
    await app.waitFor("!!document.querySelector('.desk-frame')", { label: `board framed, ${label}` });
    await sleep(400);
    const b = await app.evalJs(`(() => {
      const w = document.querySelector('.board-canvas-wrap');
      if (!w) return null;
      const cs = getComputedStyle(w);
      return { scrollbarWidthProp: cs.scrollbarWidth, scrollbarColor: cs.scrollbarColor,
        // the wrap carries a 1px inline border (BoardEditor.tsx), and offsetWidth - clientWidth includes it on both sides - the bar is what is LEFT
        vBar: w.offsetWidth - w.clientWidth - (parseFloat(cs.borderLeftWidth) || 0) - (parseFloat(cs.borderRightWidth) || 0),
        hBar: w.offsetHeight - w.clientHeight - (parseFloat(cs.borderTopWidth) || 0) - (parseFloat(cs.borderBottomWidth) || 0),
        wrapBackground: cs.backgroundColor, canvasBackground: getComputedStyle(document.querySelector('.board-canvas')).backgroundColor,
        inkOnPaperLow: getComputedStyle(document.documentElement).getPropertyValue('--ink-on-paper-low').trim() };
    })()`);
    ok(`BOARD [${label}]: the canvas wrap's bars are THIN - scrollbar-width resolves to 'thin' and every bar that paints is 1-10px (a missing bar would be vacuous, so one must paint)`,
      !!b && b.scrollbarWidthProp === 'thin' && (b.vBar > 0 || b.hBar > 0) && b.vBar <= 10 && b.hBar <= 10 && (b.hBar === 0 || b.hBar >= 1), JSON.stringify(b));
    ok(`BOARD [${label}]: the canvas wrap's bar wears the cell's own paper-toned colour (--ink-on-paper-low), not the dark-chrome default`,
      !!b && !!b.inkOnPaperLow && b.scrollbarColor.includes(hexToRgbFragment(b.inkOnPaperLow)), JSON.stringify(b));
    ok(`BOARD [${label}]: the bars sit on the board SURFACE - the wrap paints the same background as the canvas (the gutter beside it and the bar below it are paper, not the dark desk ground)`,
      !!b && !!b.wrapBackground && b.wrapBackground === b.canvasBackground && b.wrapBackground !== 'rgba(0, 0, 0, 0)', JSON.stringify(b));
  }
  return checks;
});

if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  const reads = parkReads.page;
  pok("PARKED (was \"WIDTH [${label}, margin=${margin}]: the bar is THIN - scrollbar-width resolves to 'thin' and the rendered width is 1-10px (whatever the one mechanism renders)\") - item 3 (Fable Oct 23, reading A): the page bar is the one scoped webkit exception, so scrollbar-width resolves to 'auto' on it; live successor: WIDTH [..] [item 3 successor] and PAINT [..]",
    reads.length === 12 && reads.every((r) => r.m && r.m.scrollbarWidthProp === 'auto' && r.m.scrollbarWidth >= 1 && r.m.scrollbarWidth <= 10), JSON.stringify(reads.map((r) => r.m && [r.m.scrollbarWidthProp, r.m.scrollbarWidth])));
  pok("PARKED (was \"TONE [${label}, margin=${margin}]: the bar wears this cell's own paper-toned colour (--ink-on-paper-low), not the dark-chrome default\") - item 3 (Fable Oct 23, reading A): the page bar's scrollbar-color resolves to 'auto' (the exception resets it); the tone is read from the thumb's own pseudo-element; live successor: TONE [..] [item 3 successor]",
    reads.length === 12 && reads.every((r) => r.m && r.m.scrollbarColor === 'auto'), JSON.stringify(reads.map((r) => r.m && r.m.scrollbarColor)));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(parkedChecks.every((c) => c.pass) ? `\nSCROLLBAR-FLUSH PARKED: PASS (${parkedChecks.length} checks) - HARNESS_PARKED=1 armed; this FILE parks 2: the page bar's WIDTH-thin and TONE-scrollbar-color claims` : `\nSCROLLBAR-FLUSH PARKED: FAIL - ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSCROLLBAR-FLUSH VERIFY: PASS (${checks.length} checks)` : `\nSCROLLBAR-FLUSH VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
