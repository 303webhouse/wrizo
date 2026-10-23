// SCROLLBAR-FLUSH (Fable Oct 23: Nick, live on Flux — "the page scrollbar is bulky and floats
// INSIDE the page"; Arbor had the same glitch). WRITTEN AHEAD, UNRUN: no box-turn grant held by
// this lane at write time (chat1 held the only grant). Syntax-checked only (`node --check`).
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
//   POSITION: .mode-scroll's own border-box right edge (getBoundingClientRect().right) sits
//     flush against .mode-page's own border-box right edge (within 1px) — zero gap, "on the
//     page's edge, never mid-page" — at EVERY margin setting, not just the default
//   WIDTH: the rendered scrollbar is exactly 8px (offsetWidth - clientWidth, the standard way to
//     measure a native vertical scrollbar's own width when no border is set) — "thin"
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
    scrollbarWidth: scroll.offsetWidth - scroll.clientWidth,
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
      ok(`POSITION [${label}, margin=${margin}]: .mode-scroll's border-box sits flush at .mode-page's own right edge (gap ≈ 0, never mid-page)`,
        !!m && Math.abs(m.gapFromPageEdge) < 1, JSON.stringify(m));
      ok(`WIDTH [${label}, margin=${margin}]: the rendered scrollbar is exactly 8px (thin, FX7's own systemic default)`,
        !!m && m.scrollbarWidth === 8, JSON.stringify(m));
    }
  }
  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSCROLLBAR-FLUSH VERIFY: PASS (${checks.length} checks)` : `\nSCROLLBAR-FLUSH VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
