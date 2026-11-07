// ARBOR v2 MOCKUP, ROUND r13 - the Wrizors' three fixes, as named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/
// scripts/frames/arbor2-r13.mjs). Sources: Fable, Nov 1 ("Arbor r13 = the Wrizors' three fixes: Downloads\wrizors-to-ARBOR-nov1d.md (md5
// efd6b91b). The Tools drawer must stop AT the page edge (today it runs under the page and cuts INK / PRESETS / Pages Kind); the Tutor cloths
// start below the opener; lift the night drawer panel a step off the dark page's colour"). The Wrizors' note gives the numbers:
//   1. the Tools drawer gets the room between the rail and the page - at 1366 ~280 px with an 8 px gutter, the same width at 2000 - and its
//      three cloths are laid across it (nothing in it is cut);
//   2. the Tutor cloths start below the opener: TUTOR's top >= the opener's bottom + 12 px; the opener keeps its y;
//   3. by night the open drawer is lifted off the dark page (#1B120C against #1A1510): an espresso-brown around #2A1E15 (~ +8 L*), its labels
//      and cloths re-measured >= 4.5:1, so the page stays the darker sheet.
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R13 <screen> {...}"). Written red-first: run against
// r12 (8b7c2a53) before the r13 build. Seeds go through window.wrizo*.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R13 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R13-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id, mode = 'Draft') => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
  if (mode) { await clickText(app, '.desk-mode-tab', mode); await sleep(1200); }
  // the mockup's own control panel (never shipped) is hidden: at 1366 it lies over the page's foot and the right drawer
  await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); document.querySelector('.forward-only-editor')?.blur(); return true; })()");
};
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(600); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); return true; })()";
const openSide = async (app, side) => {
  const sel = side === 'left' ? ".wz-sliver[data-open='true']" : ".wz-tutor-panel[data-open='true']";
  if (!(await app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`))) await app.evalJs(`document.querySelector(${JSON.stringify(side === 'left' ? '.wz-sliver-grip' : '.wz-tutor-grip')})?.click()`);
  await waitSoft(app, `!!document.querySelector(${JSON.stringify(sel)})`, { label: side + ' drawer', timeout: 3000 });
  await app.evalJs(FINISH); await sleep(500); await app.evalJs(FINISH);
};
const R = `const q = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, r: Math.round(r.right * 10) / 10, t: Math.round(r.top * 10) / 10, b: Math.round(r.bottom * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; };
  const shown = (e) => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };`;

// ---- a pixel instrument: each text run under the given roots against what is painted behind it (text hidden for the picture) ----
const COLLECT = (sel) => `(() => {
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const runs = [];
  for (const root of document.querySelectorAll(${JSON.stringify(sel)})) { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const box = root.getBoundingClientRect();
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; let op = 1, hidden = false;
      for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; } op *= Number(cs.opacity); }
      const c = parse(getComputedStyle(el).color); if (hidden || !c || c.a * op < 0.05) continue; const rg = document.createRange(); rg.selectNodeContents(n);
      const rects = [...rg.getClientRects()].filter((x) => x.width >= 2 && x.height >= 4 && x.left < box.right && x.right > box.left && x.top < box.bottom && x.bottom > box.top && x.top < innerHeight)
        .map((x) => [Math.max(x.left, box.left), Math.max(x.top, box.top), Math.min(x.right, box.right), Math.min(x.bottom, box.bottom, innerHeight)]);
      if (rects.length) runs.push({ where: root.className.split(' ')[0], text: n.textContent.trim().slice(0, 24), fg: [c.r, c.g, c.b, c.a * op], rects, disabled: !!el.closest(':disabled, [aria-disabled="true"]') }); } }
  window.__r13runs = runs; return runs.length; })()`;
const HIDE = "(() => { const s = document.createElement('style'); s.id = 'r13-hide'; s.textContent = '*, *::before, *::after{ color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important; caret-color:transparent !important; }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()";
const SHOW = "(() => { document.getElementById('r13-hide')?.remove(); return true; })()";
const MEASURE = (b64) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const k = img.width / innerWidth; const data = cx.getImageData(0, 0, img.width, img.height).data;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return window.__r13runs.map((run) => { const [fr, fg, fb, fa] = run.fg; const ratios = [];
    for (const [x0, y0, x1, y1] of run.rects) { const sx = Math.max(1, (x1 - x0) / 24), sy = Math.max(1, (y1 - y0) / 8);
      for (let y = y0; y < y1; y += sy) for (let x = x0; x < x1; x += sx) { const i = (Math.floor(y * k) * img.width + Math.floor(x * k)) * 4; const r = data[i], g = data[i + 1], b = data[i + 2];
        const lb = L(r, g, b), lf = L(fr * fa + r * (1 - fa), fg * fa + g * (1 - fa), fb * fa + b * (1 - fa)); ratios.push((Math.max(lb, lf) + 0.05) / (Math.min(lb, lf) + 0.05)); } }
    ratios.sort((a, b) => a - b); return { where: run.where, text: run.text, disabled: run.disabled, p2: ratios.length ? Math.round(ratios[Math.floor(ratios.length * 0.02)] * 100) / 100 : null }; }); })()`;
const pixels = async (app, sel) => { await app.evalJs(COLLECT(sel)); await app.evalJs(HIDE); const shot = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data; await app.evalJs(SHOW); return app.evalJs(MEASURE(shot)); };
// CIE L* of a CSS colour (for "a visible step", ~ +8 L*)
const LSTAR = (expr) => `(() => { const m = String(${expr}).match(/\\d+(\\.\\d+)?/g); if (!m) return null; const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const Y = 0.2126 * lin(+m[0]) + 0.7152 * lin(+m[1]) + 0.0722 * lin(+m[2]); return Math.round((Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y) * 10) / 10; })()`;

// ---- 1. THE TOOLS DRAWER FITS: its panel stops at the page edge, takes the room between the rail and the page (280 px with its tab, an 8 px
// gutter from the rail; less only where the room is less), and nothing in it is cut: the three cloths and every row lie inside its own box.
const FIT = `(() => { ${R}
  const rail = q(document.querySelector('.desk-frame-strip, .desk-rail')), page = q(document.querySelector('.desk-frame-stage .mode-page')), tab = q(document.querySelector('.wz-sliver-grip'));
  const panel = document.querySelector('.wz-sliver-panel'), slide = document.querySelector('.wz-sliver-panel > .wz-drawer-slide');
  const P = q(panel), S = q(slide);
  const cut = [...slide.querySelectorAll('*')].filter((e) => shown(e) && e.children.length === 0 || (shown(e) && /wz-drawer-tab\\b/.test(e.className))).map((e) => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && r.top < innerHeight && r.right > S.r + 0.5).map(({ e, r }) => ({ cls: String(e.className).split(' ')[0] || e.tagName, text: (e.textContent || '').trim().slice(0, 16), right: Math.round(r.right * 10) / 10 }));
  const cloths = [...slide.querySelectorAll('.wz-drawer-tab')].map((e) => ({ text: e.textContent.trim(), r: q(e), shown: shown(e) }));
  return { rail, page, tab, panel: P, slide: S, cut, cloths, zoom: !!document.querySelector(".mode-pagecol[data-zoom='true']"), w: innerWidth }; })()`;
const fitCheck = async (app, name, want3 = false) => {
  await app.evalJs(`document.querySelector('${ED}')?.__r13 || (document.querySelector('${ED}').__r13 = 1)`);
  const closedPage = await app.evalJs(`(() => { ${R} return q(document.querySelector('.desk-frame-stage .mode-page')); })()`);
  await openSide(app, 'left');
  const s = await app.evalJs(FIT);
  const room = s.page.l - s.rail.r;   // the room between the rail and the page
  const drawer = s.panel.w + 16;      // the drawer with its tab
  const ok = {
    notZoom: !s.zoom,
    atEdge: Math.abs(s.panel.r - s.page.l) <= 1,
    width: Math.abs(drawer - Math.min(280, room - 8)) <= 1,
    gutter: s.tab.l - s.rail.r >= 8 - 0.5,
    // (amendment before any green, after green look 41354772471: the Ink cloth exists only where the page can take ink - Free Write
    // (Sliver.tsx arborToolTabs) - so Draft's drawer has two cloths and "three" was not its count. Original:
    // threeCloths: s.cloths.length === 3 && s.cloths.every((c) => c.shown && c.r.l >= s.slide.l - 0.5 && c.r.r <= s.slide.r + 0.5),
    // Successor: every cloth the drawer has is shown whole inside its box (at least two), and on Free Write all three, Ink among them.)
    // (second amendment, run 41355446362: Free Write's drawer has Format + Ink, Presets is not offered there - so no page shows three; the
    // check asks for at least two, all whole inside, and on Free Write the Ink cloth among them. Previous: s.cloths.length >= (want3 ? 3 : 2))
    cloths: s.cloths.length >= 2 && s.cloths.every((c) => c.shown && c.r.l >= s.slide.l - 0.5 && c.r.r <= s.slide.r + 0.5)
      && (!want3 || s.cloths.some((c) => /^ink$/i.test(c.text))),
    nothingCut: s.cut.length === 0,
    pageStill: !!closedPage && ['l', 'r', 't', 'b'].every((k) => Math.abs(closedPage[k] - s.page[k]) <= 0.5) && await app.evalJs(`document.querySelector('${ED}')?.__r13 === 1`),
  };
  const brief = { ok, w: s.w, room, drawer, panel: s.panel, slide: s.slide, tab: s.tab, rail: s.rail, page: s.page, cloths: s.cloths.map((c) => [c.text, c.r.l, c.r.r]), cut: s.cut.slice(0, 8) };
  if (Object.values(ok).some((x) => !x)) fail(name, brief);
  say(name, brief);
};
// r17: FIT with the Tools tabs read where Nick's C2 folder tabs stand (beside the opener, over the drawer's top edge), for fitCheck2
const FIT2 = FIT.replace("[...slide.querySelectorAll('.wz-drawer-tab')]", "[...document.querySelectorAll('.arbor2-c2--left .wz-drawer-tab')]");
if (FIT2 === FIT) throw new Error('FIT2 did not take');
// r19: FIT2 with each folder tab's state and colours too (chosen, fill, word, underline), for fitCheck2's successor of cloths (spec draft 35 §18.3)
const FIT3 = FIT2.replace("({ text: e.textContent.trim(), r: q(e), shown: shown(e) })", "({ text: e.textContent.trim(), r: q(e), shown: shown(e), on: e.getAttribute('data-on') === 'true', bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e).color, deco: getComputedStyle(e).textDecorationLine })");
if (FIT3 === FIT2) throw new Error('FIT3 did not take');
// r19 (§18.3): each Tools cloth in its own colour with its own word - Format olive, Presets cold blue, Ink madder; cream on olive and madder, walnut on blue
const CLOTH19 = { format: ['rgb(86, 99, 46)', 'rgb(239, 228, 203)'], presets: ['rgb(127, 160, 188)', 'rgb(43, 29, 18)'], ink: ['rgb(168, 57, 47)', 'rgb(239, 228, 203)'] };
const fitCheck2 = async (app, name, want3 = false) => {
  await app.evalJs(`document.querySelector('${ED}')?.__r13 || (document.querySelector('${ED}').__r13 = 1)`);
  const closedPage = await app.evalJs(`(() => { ${R} return q(document.querySelector('.desk-frame-stage .mode-page')); })()`);
  await openSide(app, 'left');
  const s = await app.evalJs(FIT3);   // (r19 instrument: FIT2 plus each tab's chosen state and colours, for the successor of cloths; every other read is FIT2's)
  const room = s.page.l - s.rail.r;   // the room between the rail and the page
  const drawer = s.panel.w + 16;      // the drawer with its tab
  const ok = {
    notZoom: !s.zoom,
    atEdge: Math.abs(s.panel.r - s.page.l) <= 1,
    width: Math.abs(drawer - Math.min(280, room - 8)) <= 1,
    gutter: s.tab.l - s.rail.r >= 8 - 0.5,
    // (amendment before any green, after green look 41354772471: the Ink cloth exists only where the page can take ink - Free Write
    // (Sliver.tsx arborToolTabs) - so Draft's drawer has two cloths and "three" was not its count. Original:
    // threeCloths: s.cloths.length === 3 && s.cloths.every((c) => c.shown && c.r.l >= s.slide.l - 0.5 && c.r.r <= s.slide.r + 0.5),
    // Successor: every cloth the drawer has is shown whole inside its box (at least two), and on Free Write all three, Ink among them.)
    // (second amendment, run 41355446362: Free Write's drawer has Format + Ink, Presets is not offered there - so no page shows three; the
    // check asks for at least two, all whole inside, and on Free Write the Ink cloth among them. Previous: s.cloths.length >= (want3 ? 3 : 2))
    // (SUCCESSOR's cloths, r17: the folder tabs stand on the drawer's top edge - shown whole, their bottoms on that edge, within the drawer's width)
    // PARKED 2026-11-04 (SUPERSEDED by r19, spec draft 35 §18.3 (Nick, Nov 4; handoff-FABLE-arbor-r19.md §1 A), frames run 41911788199, Arbor 8dd766dc:
    // the chosen tab comes forward, +8 px out and +8 long, and reaches 3 px INTO the drawer's new 3 px border of its own cloth, so its foot is 3 px
    // below the drawer's top edge, not on it; and it keeps its own cloth - no brass on any tab). Original, verbatim:
    // cloths: s.cloths.length >= 2 && s.cloths.every((c) => c.shown && c.r.l >= s.slide.l - 0.5 && c.r.r <= s.slide.r + 0.5 && Math.abs(c.r.b - s.slide.t) <= 1)
    //   && (!want3 || s.cloths.some((c) => /^ink$/i.test(c.text))),
    // SUCCESSOR clothsB: every folder tab shown whole within the drawer's width; the unchosen ones' feet on the drawer's top edge, the one chosen
    // tab's foot 3 px into the border; each in its own cloth with its own word (Format olive, Presets cold blue, Ink madder), no brass and no
    // underline on any tab; on Free Write the Ink cloth among them.
    clothsB: s.cloths.length >= 2 && s.cloths.filter((c) => c.on).length === 1
      && s.cloths.every((c) => c.shown && c.r.l >= s.slide.l - 0.5 && c.r.r <= s.slide.r + 0.5 && Math.abs(c.r.b - (c.on ? s.slide.t + 3 : s.slide.t)) <= 1)
      && s.cloths.every((c) => { const k = CLOTH19[c.text.trim().toLowerCase()]; return !!k && c.bg === k[0] && c.fg === k[1] && !/underline/.test(String(c.deco)) && c.bg !== 'rgb(255, 152, 0)' && c.fg !== 'rgb(255, 152, 0)'; })
      && (!want3 || s.cloths.some((c) => /^ink$/i.test(c.text))),
    nothingCut: s.cut.length === 0,
    pageStill: !!closedPage && ['l', 'r', 't', 'b'].every((k) => Math.abs(closedPage[k] - s.page[k]) <= 0.5) && await app.evalJs(`document.querySelector('${ED}')?.__r13 === 1`),
  };
  const brief = { ok, w: s.w, room, drawer, panel: s.panel, slide: s.slide, tab: s.tab, rail: s.rail, page: s.page, cloths: s.cloths.map((c) => [c.text, c.r.l, c.r.r]), cut: s.cut.slice(0, 8) };
  brief.clothsAt = s.cloths.map((c) => [c.text, c.on, c.r.t, c.r.b, c.bg, c.fg, c.deco]);   // (r19: the successor's numbers)
  if (Object.values(ok).some((x) => !x)) fail(name, brief);
  say(name, brief);
};

export default {
  // PARKED 2026-11-02 (SUPERSEDED by Nick's C2 folder tabs, Nov 2 (spec draft 23 §9c; the Wrizors' note md5 a17aae25, gated by Fable): the tabs stand OFF the drawer - the Tools tabs up from its top edge, the Tutor tabs off its right edge - so they are no longer inside it). Kept verbatim under the name r13-tools-fit-v1 (not in the run list); SUCCESSOR r13-tools-fit below (fitCheck2).
  'r13-tools-fit-v1': async (app) => { await page(app, 'arbor-r13-fit'); await fitCheck(app, 'R13-TOOLS-FIT'); },
  'r13-tools-fit': async (app) => { await page(app, 'arbor-r13-fit'); await fitCheck2(app, 'R13-TOOLS-FIT'); },
  // PARKED 2026-11-02 (SUPERSEDED by Nick's C2 folder tabs, Nov 2 (spec draft 23 §9c; the Wrizors' note md5 a17aae25, gated by Fable): the tabs stand OFF the drawer - the Tools tabs up from its top edge, the Tutor tabs off its right edge - so they are no longer inside it). Kept verbatim under the name r13-tools-fit-2000-v1 (not in the run list); SUCCESSOR r13-tools-fit-2000 below (fitCheck2).
  'r13-tools-fit-2000-v1': async (app) => { await app.emulateDpr(1, 2000, 1125); await page(app, 'arbor-r13-fit2'); await fitCheck(app, 'R13-TOOLS-FIT-2000'); },
  'r13-tools-fit-2000': async (app) => { await app.emulateDpr(1, 2000, 1125); await page(app, 'arbor-r13-fit2'); await fitCheck2(app, 'R13-TOOLS-FIT-2000'); },
  // Free Write, where the drawer has its three cloths (Ink among them): Free Write opens in Typewriter's zoom, which keeps today's drawers
  // (ruled), so the writer's own Typewriter switch in the drawer is turned off first, as she would
  // PARKED 2026-11-02 (SUPERSEDED by Nick's C2 folder tabs, Nov 2 (spec draft 23 §9c; the Wrizors' note md5 a17aae25, gated by Fable): the tabs stand OFF the drawer - the Tools tabs up from its top edge, the Tutor tabs off its right edge - so they are no longer inside it). Kept verbatim under the name r13-tools-fit-freewrite-v1 (not in the run list); SUCCESSOR r13-tools-fit-freewrite below.
  'r13-tools-fit-freewrite-v1': async (app) => {
    await page(app, 'arbor-r13-fit-fw', null);
    await openSide(app, 'left');
    if (await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]')?.getAttribute('aria-pressed') === 'true'")) await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]').click()");
    await waitSoft(app, "!document.querySelector(\".mode-pagecol[data-zoom='true']\")", { label: 'typewriter off', timeout: 3000 });
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await app.evalJs(FINISH); await sleep(600);
    await fitCheck(app, 'R13-TOOLS-FIT-FREEWRITE', true);
  },
  'r13-tools-fit-freewrite': async (app) => {
    await page(app, 'arbor-r13-fit-fw', null);
    await openSide(app, 'left');
    if (await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]')?.getAttribute('aria-pressed') === 'true'")) await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]').click()");
    await waitSoft(app, "!document.querySelector(\".mode-pagecol[data-zoom='true']\")", { label: 'typewriter off', timeout: 3000 });
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await app.evalJs(FINISH); await sleep(600);
    await fitCheck2(app, 'R13-TOOLS-FIT-FREEWRITE', true);
  },

  // ---- 2. THE TUTOR CLOTHS START BELOW THE OPENER: TUTOR's top >= the opener's bottom + 12 px; the opener keeps its y (open and closed)
  // PARKED 2026-11-02 (SUPERSEDED by Nick's C2 folder tabs, Nov 2 (spec draft 23 §9c; the Wrizors' note md5 a17aae25, gated by Fable): the tabs stand OFF the drawer - the Tools tabs up from its top edge, the Tutor tabs off its right edge - so they are no longer inside it). Kept verbatim under the name r13-tutor-cloths-v1 (not in the run list); SUCCESSOR r13-tutor-cloths below.
  'r13-tutor-cloths-v1': async (app) => {
    await page(app, 'arbor-r13-cloths');
    const shut = await app.evalJs(`(() => { ${R} return q(document.querySelector('.wz-tutor-grip')); })()`);
    await openSide(app, 'right');
    const s = await app.evalJs(`(() => { ${R} const g = q(document.querySelector('.wz-tutor-grip')); const cloths = [...document.querySelectorAll('.wz-tutor-panel .wz-drawer-tab')].filter(shown).map((e) => ({ text: e.textContent.trim(), r: q(e) }));
      const notes = [...document.querySelectorAll('.wz-tutor-panel .wz-drawer-tabnote-cell')].filter(shown).map((e) => q(e)); return { g, cloths, notes }; })()`);
    const first = s.cloths[0];
    const ok = { cloths: s.cloths.length === 3, below: !!first && first.r.t >= s.g.b + 12 - 0.5, allBelow: s.cloths.every((c) => c.r.t >= s.g.b + 12 - 0.5), notesBelow: s.notes.every((n) => n.t >= s.g.b + 12 - 0.5), openerKeepsY: !!shut && Math.abs(shut.t - s.g.t) <= 0.5 };
    const brief = { ok, opener: s.g, openerShut: shut, cloths: s.cloths.map((c) => [c.text, c.r.t, c.r.b]), notes: s.notes.map((n) => [n.t, n.b]) };
    if (Object.values(ok).some((x) => !x)) fail('R13-TUTOR-CLOTHS', brief);
    say('r13-tutor-cloths', brief);
  },
  'r13-tutor-cloths': async (app) => {
    await page(app, 'arbor-r13-cloths');
    const shut = await app.evalJs(`(() => { ${R} return q(document.querySelector('.wz-tutor-grip')); })()`);
    await openSide(app, 'right');
    const s = await app.evalJs(`(() => { ${R} const g = q(document.querySelector('.wz-tutor-grip')); const cloths = [...document.querySelectorAll('.arbor2-c2--right .wz-drawer-tab')].filter(shown).map((e) => ({ text: e.textContent.trim(), r: q(e) }));
      const notes = [...document.querySelectorAll('.arbor2-c2--right .wz-drawer-tabnote-cell')].filter(shown).map((e) => q(e)); return { g, cloths, notes }; })()`);
    const first = s.cloths[0];
    const ok = { cloths: s.cloths.length === 3, below: !!first && first.r.t >= s.g.b + 12 - 0.5, allBelow: s.cloths.every((c) => c.r.t >= s.g.b + 12 - 0.5), notesBelow: s.notes.every((n) => n.t >= s.g.b + 12 - 0.5), openerKeepsY: !!shut && Math.abs(shut.t - s.g.t) <= 0.5 };
    const brief = { ok, opener: s.g, openerShut: shut, cloths: s.cloths.map((c) => [c.text, c.r.t, c.r.b]), notes: s.notes.map((n) => [n.t, n.b]) };
    if (Object.values(ok).some((x) => !x)) fail('R13-TUTOR-CLOTHS', brief);
    say('r13-tutor-cloths', brief);
  },

  // ---- 3. THE NIGHT DRAWER: by night the open drawers' ground is the lifted espresso-brown (#2A1E15), a visible step lighter than the page
  // (>= +6 L*, the note's ~ +8, on the dark page; the light page is far lighter still), and every label and cloth in them >= 4.5:1 against the
  // pixels behind it. The scrollbar's track follows the ground. The job's two tones give both pages.
  'r13-night-drawers': async (app) => {
    await page(app, 'arbor-r13-night');
    await setRoom(app, 'night');
    await openSide(app, 'left'); await openSide(app, 'right');
    await app.evalJs("(() => { if (!document.getElementById('r13-lit')) { const s = document.createElement('style'); s.id = 'r13-lit'; s.textContent = '*{ --arbor2-dim:1 !important; }'; document.head.appendChild(s); } document.documentElement.setAttribute('data-arbor2-lit', ''); return true; })()"); await sleep(300);
    const g = await app.evalJs(`(() => { const l = document.querySelector('.wz-sliver-panel > .wz-drawer-slide'), r = document.querySelector('.wz-tutor-panel > .wz-drawer-slide'), p = document.querySelector('.desk-frame-stage .mode-page');
      const sc = String(getComputedStyle(document.querySelector('.wz-sliver-panel')).scrollbarColor); return { left: l ? getComputedStyle(l).backgroundColor : null, right: r ? getComputedStyle(r).backgroundColor : null, page: p ? getComputedStyle(p).backgroundColor : null,
        track: sc.slice(Math.max(0, sc.lastIndexOf('rgb'))), tone: document.documentElement.getAttribute('data-page'), room: document.documentElement.getAttribute('data-arbor2-room') }; })()`);
    // (amendment before any green, after measuring the note's two numbers against each other: #2A1E15 as written is only +5.3 L* off the dark
    // page #1A1510, and a true +8 (#31231A) takes the olive text to 4.44:1; #2E2118 is the nearest brown at +6.9 L* with olive at 4.57. Original
    // colour checked: rgb(42, 30, 21).)
    const lD = await app.evalJs(LSTAR(JSON.stringify(g.left))), lP = await app.evalJs(LSTAR(JSON.stringify(g.page)));
    const px = await pixels(app, '.wz-sliver-panel, .wz-tutor-panel');
    // (instrument amendment after red leg 41354444846, before any green: the only runs under 4.5 were the two "Selection" controls, inactive
    // until there is a selection - WCAG 1.4.3 exempts inactive controls - so runs inside a disabled control are reported, not floored. Original:
    // const low = px.filter((x) => x.p2 != null && x.p2 < 4.5);)
    const low = px.filter((x) => x.p2 != null && x.p2 < 4.5 && !x.disabled);
    const inactive = px.filter((x) => x.disabled).map((x) => [x.text, x.p2]);
    const ok = { night: g.room === 'night', lifted: g.left === 'rgb(46, 33, 24)' && g.right === 'rgb(46, 33, 24)', track: g.track === g.left,
      stepOffPage: g.tone !== 'dark' || (lD != null && lP != null && lD - lP >= 6), measured: px.length >= 10, floors: low.length === 0 };
    const brief = { ok, ground: g, lstar: { drawer: lD, page: lP }, runs: px.length, lowest: px.filter((x) => x.p2 != null && !x.disabled).sort((a, b) => a.p2 - b.p2).slice(0, 4), low: low.slice(0, 8), inactive };
    if (Object.values(ok).some((x) => !x)) fail('R13-NIGHT-DRAWERS', brief);
    say('r13-night-drawers', brief);
  },
};
