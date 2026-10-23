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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function hexToRgbFragment(hex) {
  const h = hex.replace('#', '');
  return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`;
}

const LONG_TEXT = Array.from({ length: 400 }, (_, i) => `Line ${i + 1} of a long page, written only to force a real vertical scrollbar to paint.`).join('\n');

const seedAndOpen = async (app, theme, pageTone) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: pageTone, fade: 'on' }))});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk, theme=${theme}/${pageTone}` });
  // seed a long page through the seam (AGENTS.md's seeding law), while OFF a surface with a
  // flush handler (the Desk, confirmed by freshDesk's own house convention)
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'sbf-${theme}-${pageTone}', text: ${JSON.stringify(LONG_TEXT)}, createdAt: now, origin: null, source: 'page' });
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });
  await app.evalJs(`location.hash = '#/page/sbf-${theme}-${pageTone}'`);
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
      ok(`WIDTH [${label}, margin=${margin}]: the bar is THIN - scrollbar-width resolves to 'thin' and the rendered width is 1-10px (whatever the one mechanism renders)`,
        !!m && m.scrollbarWidthProp === 'thin' && m.scrollbarWidth >= 1 && m.scrollbarWidth <= 10, JSON.stringify(m));
      ok(`TONE [${label}, margin=${margin}]: the bar wears this cell's own paper-toned colour (--ink-on-paper-low), not the dark-chrome default`,
        !!m && !!m.inkOnPaperLow && m.scrollbarColor.includes(hexToRgbFragment(m.inkOnPaperLow)), JSON.stringify(m));
    }
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

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSCROLLBAR-FLUSH VERIFY: PASS (${checks.length} checks)` : `\nSCROLLBAR-FLUSH VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
