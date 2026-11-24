// OWED SUCCESSOR, row 36 (docs/flux-live-pin-list.md, owed after live): scrollbar-flush.mjs's promise - the page's scrollbar sits FLUSH on the page's edge
// at every margin setting, is the 10 px page bar, and wears the paper-toned thumb - read on the Flux a writer gets (the redesign and the reorg by
// default, no ?flux3 or ?reorg in the address). scrollbar-flush.mjs itself stays verbatim on plain Flux (?flux3=0): its door, PAGE SETUP in the
// "page" cascade panel, is gone on live Flux, where the margins are set through TRACKS' head menu (the Doc's kind menu, its "setup" item: PageSetupZone).
// For each Page tone (light, dark) x each margin (normal, narrow, wide), set through that menu by real presses:
//   FX-SET       the press LANDED: the page's stored margins read the margin asked (the radios are pressed by position in their group and VERIFIED by
//                the stored value, so an order change goes red rather than green about another margin), and the page's padding really changed
//   FX-POSITION  scrollbar-flush's POSITION: the gap between the bar's box and the page's right edge is at most the page's own border, never negative
//   FX-WIDTH     scrollbar-flush's WIDTH (item 3 successor): the bar is 10 px PAINTED (layout width x the applied scale), scrollbar-width 'auto'
//   FX-TONE      scrollbar-flush's TONE (item 3 successor): the thumb wears the cell's own --ink-on-paper-low
// plus, per tone, FX-OVERFLOW (the page really overflows, so a real bar is measured) and FX-LIVE (the page is the live Flux).
// Run: node scripts/harness/scrollbar-flush-flux-live.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';
process.env.WS_FLUX3 = 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const hexToRgbFragment = (hex) => { const h = hex.replace('#', ''); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`; };
const LONG_TEXT = Array.from({ length: 400 }, (_, i) => `Line ${i + 1} of a long page, written only to force a real vertical scrollbar to paint.`).join('\n');
const MARGINS = ['normal', 'narrow', 'wide'];   // PagePanel.tsx's own order inside the margins radiogroup
const LIVE = "({ theme: document.documentElement.getAttribute('data-theme'), flux3: document.documentElement.hasAttribute('data-flux3'), top: !!document.querySelector('.reorg-top'), search: location.search })";
const isLive = (l) => !!l && l.theme === 'flux' && l.flux3 && l.top && !/flux3|reorg/.test(l.search);

// scrollbar-flush.mjs's measure, the reads its live checks use
const MEASURE = `(() => {
  const scroll = document.querySelector('.mode-scroll'), page = document.querySelector('.mode-page'); if (!scroll || !page) return null;
  const sr = scroll.getBoundingClientRect(), pr = page.getBoundingClientRect();
  return { gapFromPageEdge: pr.right - sr.right, pageBorderRight: parseFloat(getComputedStyle(page).borderRightWidth) || 0,
    scrollbarWidth: scroll.offsetWidth - scroll.clientWidth, scrollbarWidthProp: getComputedStyle(scroll).scrollbarWidth,
    inkOnPaperLow: getComputedStyle(document.documentElement).getPropertyValue('--ink-on-paper-low').trim(),
    scrollHeight: scroll.scrollHeight, clientHeight: scroll.clientHeight,
    appliedScale: (() => { const t = getComputedStyle(page).transform; return !t || t === 'none' ? 1 : new DOMMatrixReadOnly(t).a; })(),
    thumbColor: getComputedStyle(scroll, '::-webkit-scrollbar-thumb').backgroundColor,
    padX: getComputedStyle(page).getPropertyValue('--wz-page-pad-x').trim() || getComputedStyle(page).paddingLeft };
})()`;

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  const soft = async (expr, timeout = 6000) => { try { await app.waitFor(expr, { timeout, label: expr.slice(0, 60) }); return true; } catch { return false; } };
  const press = async (sel) => {
    const p = await ev(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!p) return false;
    await app.mouseMove(p.x, p.y); await sleep(80); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(250);
    return true;
  };
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')", 20000);
  // the page sits in a Doc (TRACKS' head menu is the Doc's), seeded through the seams at the Desk
  const seeded = await ev(`(() => { const W = window; const doc = W.wrizoCreateProject('Harbour');
    const p = W.wrizoCreateJournalPage({ id: 'sbfx-page', text: ${q(LONG_TEXT)}, createdAt: '2026-04-01T00:00:00.000Z', origin: 'project', projectId: doc.id, orderIndex: 0, source: 'page' });
    W.wrizoFlushNow(); return { doc: !!doc, page: !!p }; })()`);
  const MARG = "((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'sbfx-page') || {}).pageSettings || {}).margins || null";

  for (const tone of ['light', 'dark']) {
    const label = `Flux ${tone}`;
    await ev(`(() => { localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${q(tone)}, fade: 'on' })); localStorage.setItem('wrizo-mode-page-sbfx-page', 'drafting'); history.replaceState(null, '', '/#/page/sbfx-page'); return true; })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the long page', timeout: 20000 });
    await soft("!document.querySelector('.wz-splash')", 25000);
    await soft("document.documentElement.hasAttribute('data-flux3') && !!document.querySelector('.reorg-top')", 10000);
    await sleep(900);
    const live = await ev(LIVE);
    const base = await ev(MEASURE);
    ok(`FX-LIVE [${label}] the page is the live Flux (the redesign and the reorg by default, no ?flux3 or ?reorg) and its Doc was seeded`, isLive(live) && seeded.doc && seeded.page, { live, seeded });
    ok(`FX-OVERFLOW [${label}] the page genuinely overflows (a real scrollbar paints, so the reads below are not vacuous)`, !!base && base.scrollHeight > base.clientHeight, base);
    let prevPad = null;
    // narrow first, so each press moves the setting off its previous value (the page is born normal)
    for (const margin of ['narrow', 'wide', 'normal']) {
      // TRACKS' head menu, by real presses: the drawer's tab, TRACKS, the Doc's kind, its setup item
      if (!(await ev("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true'"))) { await press('.wz-sliver-grip'); await soft("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true'", 4000); await sleep(400); }
      await press('#wz-sliver-tab-parts');
      await soft("!!document.querySelector('.wz-sliver-panel [data-doc-kind]')", 4000);
      if (!(await ev("!!document.querySelector('.wz-sliver-panel [data-doc-menu]')"))) await press('.wz-sliver-panel [data-doc-kind]');
      if (!(await ev("!!document.querySelector('[data-doc-sub=setup]')"))) await press('[data-doc-menu-item=setup]');
      const menu = await soft("!!document.querySelector('[data-doc-sub=setup] .wz-page-setup-seg[role=radiogroup]')", 4000);
      const i = MARGINS.indexOf(margin);
      const radioSel = `[data-doc-sub=setup] .wz-page-setup-seg[role=radiogroup] > [role=radio]:nth-of-type(${i + 1})`;
      const pressed = menu && (await press(radioSel));
      const stored = await soft(`${MARG} === ${q(margin)}`, 6000);
      // the drawer closed again, so nothing covers the bar it measures
      await press('.wz-sliver-grip'); await soft("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') !== 'true'", 4000); await sleep(500);
      const m = await ev(MEASURE);
      ok(`FX-SET [${label}, margin=${margin}] TRACKS' Frame took the press: the stored margins read ${margin}, and the page's padding changed (${prevPad} -> ${m && m.padX})`,
        menu && pressed && stored && !!m && m.padX !== prevPad, { menu, pressed, stored, storedNow: await ev(MARG), padX: m && m.padX, prevPad });
      prevPad = m && m.padX;
      ok(`FX-POSITION [${label}, margin=${margin}] the bar is flush on the page edge: the gap is at most the page's own border, never negative`,
        !!m && m.gapFromPageEdge >= -0.5 && m.gapFromPageEdge <= Math.max(1, m.pageBorderRight) + 0.01, m);
      ok(`FX-WIDTH [${label}, margin=${margin}] the page bar is 10 px PAINTED (scrollbar-width 'auto', layout width x the applied scale within its rounding)`,
        !!m && m.scrollbarWidthProp === 'auto' && m.scrollbarWidth >= 1 && Math.abs(m.scrollbarWidth * m.appliedScale - 10) <= 0.5 * m.appliedScale + 0.25, m);
      ok(`FX-TONE [${label}, margin=${margin}] the bar's thumb wears this cell's own paper-toned --ink-on-paper-low`,
        !!m && !!m.inkOnPaperLow && typeof m.thumbColor === 'string' && m.thumbColor.includes(hexToRgbFragment(m.inkOnPaperLow)), m);
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1200)}`);
const EXPECTED = 28;   // per tone: FX-LIVE, FX-OVERFLOW, and 3 margins x (FX-SET, FX-POSITION, FX-WIDTH, FX-TONE)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nSCROLLBAR-FLUSH-FLUX-LIVE VERIFY: PASS (${checks.length} checks)` : `\nSCROLLBAR-FLUSH-FLUX-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
