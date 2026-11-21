// MACHINA'S LOOK (Fable, Nov 19: "Machina's look SHIPS this weekend (rooms, colours, bars, splash; wow parts out)"; r10's mockup rebased LOOK ONLY,
// on by default in Machina on Arbor's ship pattern). The browser half; the browserless half is machina-look-unit.mjs. Plain navigations (the query
// in this file's own navigations, as arbor-default-on.mjs does):
//   L1  Machina, no query: the look is on (<html data-machina2>, a room in force) and there is NO mockup bar
//   L2  Machina, ?machina2=0 (test-only): the look is off - no data-machina2, no nameplate, the look's host never mounted
//   L3  Machina, ?machina2=1: the look AND the mockup bar ("Machina mockup"), its rows exactly Cast / Lighting / Page (no Run unit, no switches)
//   L4  Arbor and Flux, no query: nothing of the look (no data-machina2, no host)
//   L5  a theme switch in the session, no reload: Machina -> Flux takes data-machina2 and the nameplate away; Flux -> Machina puts them back
//   L6  LOOK ONLY on a Machina page with both drawers opened: none of the features ruled out is in the DOM (command line, its door, the readout,
//       the legend, Outline -> Parts, Open beside, the nonfiction asks, the 11 pt box, r10's Run)
//   L7  THE PAGE NEVER MOVES: the column, the paper and the editor have the same rects with the look on as with ?machina2=0 (the bar is drawn
//       higher by a transform; the nameplate is padding inside the bar)
//   L8  THE ROOM in the Themes pop-out, directly under Page: "Room: Light · Dark · Automatic"; Light -> the light room (ground #E6E8EA), Dark ->
//       the dark room (#151719), Automatic -> the clock's room (12:00 light, 23:00 dark); opening the pop-out and picking leave the page's rect
//   L9  THE BARS dark in both rooms (COOL #1E262E), and their labels >= 4.5:1 on them, measured on screen in each room
//   L10 THE NAMEPLATE: "WRIZ" at the flush bar's left end, 16 px in, inside the bar; the corner mark not drawn while the bar is on screen
//   L11 THE FLUSH BAR: drawn at the window's top (0)
//   L12 THE MARK (r10's splash item): WRIZ in Plex Mono, its square a hairline in the mark's own colour (never brass at rest)
//   L13 THE PAGE: the light page #FBFBFA and the dark page #1A1B1D, their ink >= 7:1, in either room
//   L14 THE ZOOMED PAGE STAYS PAPER (r10 sheet.ts): on Free Write's zoomed page, a dark page in the light room has a sheet behind the column in the
//       page's own colour, inside the page
//   L15 THE DRAWER ALIGNMENT: the open Tools drawer stands flush against the page and its tab rides the drawer's outer edge
//       (PARKED Nov 20, its first run read the panel's inner box: SUCCESSOR L15b, itself PARKED the same day: SUCCESSOR L15c, PARKED too (it read the zoomed Free Write page): SUCCESSOR L15d on a Draft page, mutant M5c)
//   M1  (mutant) data-machina2 forced onto a Flux page (LANDED): L4's read goes red
//   M2  (mutant) a mockup bar put into the default page (LANDED): L1's read goes red
//   M3  (mutant) a command line box put into the page (LANDED): L6's read goes red
//   M4  (mutant) the nameplate hidden (LANDED): L10's read goes red
//   M5c (mutant) the open Tools panel moved 40 px (LANDED, the gap moves by 40): L15d's read goes red
// Seeding goes through the seams (wrizoCreateJournalPage, origin and source carried); the theme through the product's store key read at boot.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const BAR = "[...document.querySelectorAll('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0)";
const READ = `(() => { const r = document.documentElement; return { theme: r.getAttribute('data-theme'), look: r.getAttribute('data-machina2'), room: r.getAttribute('data-machina2-room'),
  host: !!document.getElementById('machina2-mockup'), bar: !!document.querySelector('.machina2-bar'), plate: !!document.querySelector('.machina2-nameplate'),
  barHead: [...document.querySelectorAll('.machina2-bar-head')].some((b) => (b.textContent || '').trim() === 'Machina mockup'),
  rows: [...document.querySelectorAll('.machina2-bar .machina2-bar-row')].map((g) => g.getAttribute('aria-label')), switches: document.querySelectorAll('.machina2-switches, .machina2-switch').length }; })()`;
const l1ok = (m) => !!m && m.theme === 'machina' && m.look === 'true' && (m.room === 'light' || m.room === 'dark') && m.host && !m.bar && !m.barHead;
const l4ok = (m) => !!m && m.theme !== 'machina' && m.look !== 'true' && !m.host;
const OUT = ['.machina2-cmd', '.machina2-door', '.machina2-readout', '.machina2-run', '.machina2-legend', '.machina2-outline-list', '.machina2-plans-outline', '.machina2-beside', '.machina2-files-beside', '.machina2-ask', '.wz-type-num-unit', '.wz-type-num-box'];
const OUTREAD = `(() => ${J(OUT)}.filter((s) => !!document.querySelector(s)))()`;
const RECT = `(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((v) => +v.toFixed(2)); };
  return { col: r('.mode-pagecol'), page: r('.mode-page'), ed: r('.forward-only-editor') }; })()`;
const sameRect = (a, b) => !!a && !!b && ['col', 'page', 'ed'].every((k) => a[k] && b[k] && a[k].every((v, i) => Math.abs(v - b[k][i]) <= 0.5));
// WCAG contrast of two computed rgb() strings
const CONTRAST = `const __rgb = (s) => (String(s).match(/[\\d.]+/g) || []).slice(0, 3).map(Number); const __L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = __rgb(c); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const __C = (a, b) => { const x = __L(a), y = __L(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };`;
const ROOM = `(() => { ${CONTRAST} const r = document.documentElement; const cs = getComputedStyle(r); const bar = ${BAR}; const lab = bar && (bar.querySelector('.crumb-here') || bar.querySelector('.sprint-crumb'));
  const page = document.querySelector('.mode-page'), ed = document.querySelector('.forward-only-editor');
  return { choice: r.getAttribute('data-room'), room: r.getAttribute('data-machina2-room'), ground: cs.getPropertyValue('--ink-950').trim().toUpperCase(), barBg: bar ? getComputedStyle(bar).backgroundColor : null,
    label: lab ? getComputedStyle(lab).color : null, labelC: bar && lab ? __C(getComputedStyle(lab).color, getComputedStyle(bar).backgroundColor) : null,
    paper: page ? getComputedStyle(page).backgroundColor : null, ink: ed ? getComputedStyle(ed).color : null, inkC: page && ed ? __C(getComputedStyle(ed).color, getComputedStyle(page).backgroundColor) : null, tone: r.getAttribute('data-page') }; })()`;
const PLATE = `(() => { const p = document.querySelector('.machina2-nameplate'); const bar = ${BAR}; const bm = document.querySelector('.brand-mark');
  if (!p || !bar) return { plate: !!p, bar: !!bar };
  const a = p.getBoundingClientRect(), b = bar.getBoundingClientRect();
  return { plate: true, bar: true, text: (p.textContent || '').trim(), shown: getComputedStyle(p).display !== 'none' && getComputedStyle(p).opacity !== '0' && a.width > 0, dx: +(a.left - b.left).toFixed(2),
    inBar: a.top >= b.top - 1 && a.bottom <= b.bottom + 1, barTop: +b.top.toFixed(2), markHidden: !bm || getComputedStyle(bm).display === 'none' }; })()`;
const plateOk = (p) => !!p && p.plate && p.bar && p.text === 'WRIZ' && p.shown && Math.abs(p.dx - 16) <= 1 && p.inBar && p.markHidden;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const visit = async (theme, query, extra = '') => {
    await app.goto('/');
    await app.evalJs(`localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', ${J(theme)}); ${extra} true`);
    await app.evalJs(`history.replaceState(null, '', '/' + ${J(query)} + '#/')`); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
    await waitSoft(app, "!!document.querySelector('.wz-arrival') || !!document.querySelector('.desk-frame-stage')", { label: 'desk', timeout: 15000 });
    await sleep(1500);
    return app.evalJs(READ);
  };
  let n = 0;
  const openPage = async (text, mode = null) => {
    const pid = `mlook-${++n}-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`!!window.wrizoCreateJournalPage(${J({ id: pid, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    if (mode) await app.evalJs(`localStorage.setItem('wrizo-mode-page-${pid}', '${mode}'); true`);
    await app.evalJs(`location.hash = '#/page/${pid}'`);
    const up = await waitSoft(app, `!!document.querySelector('.forward-only-editor') && !!(${BAR})`, { label: 'page with its bar', timeout: 20000 });
    await sleep(1200);   // chrome.ts measures every 300 ms
    return up;
  };
  const TEXT = 'Machina look page.\nThe second line of the page.\nA third line, so the page has words on it.';
  const setTheme = (t) => app.evalJs(`(() => { const s = window.wrizoTheme; if (!s || typeof s.set !== 'function') return null; s.set(${J(t)}); return s.get() === ${J(t)} ? 'seam' : 'unchanged'; })()`);
  const clickText = (scope, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${J(scope)})].find((x) => (x.textContent || '').trim() === ${J(text)}); if (!b) return false; b.click(); return true; })()`);
  const openThemes = async () => { await app.evalJs(`(() => { const it = document.querySelector(".wz-strip-item[data-category='theme']"); if (it) it.click(); return !!it; })()`); return waitSoft(app, "!!document.querySelector('.wz-theme-picker')", { label: 'themes', timeout: 5000 }); };
  const closeThemes = async () => { await app.key('Escape'); await sleep(400); if (await app.evalJs("!!document.querySelector('.wz-theme-picker')")) { await app.evalJs(`(() => { const it = document.querySelector(".wz-strip-item[data-category='theme']"); if (it) it.click(); return true; })()`); await sleep(400); } };
  const pickRoom = async (word) => { const did = await clickText('.machina2-theme-room button', word); await sleep(500); return did; };

  // ---- L1-L4 ----
  const l1 = await visit('machina', '');
  ok(`L1 Machina with no query: the look is on (data-machina2, room ${l1 && l1.room}) and there is NO mockup bar`, l1ok(l1), J(l1));
  const l2 = await visit('machina', '?machina2=0');
  ok(`L2 Machina with the test-only ?machina2=0: the look is off (data-machina2 ${l2 && l2.look}, host ${l2 && l2.host}, nameplate ${l2 && l2.plate})`, !!l2 && l2.theme === 'machina' && l2.look !== 'true' && !l2.host && !l2.plate && !l2.bar, J(l2));
  const l3 = await visit('machina', '?machina2=1');
  ok(`L3 Machina with ?machina2=1: the look and the mockup bar, rows ${J(l3 && l3.rows)} (exactly Cast / Lighting / Page; no switches)`,
    !!l3 && l3.look === 'true' && l3.bar && l3.barHead && J(l3.rows) === J(['Cast', 'Lighting', 'Page']) && l3.switches === 0, J(l3));
  const ar = await visit('plateau', ''), fx = await visit('flux', '');
  ok(`L4 Arbor and Flux with no query: nothing of the look (data-machina2 ${ar && ar.look} / ${fx && fx.look}, host ${ar && ar.host} / ${fx && fx.host})`, l4ok(ar) && l4ok(fx) && ar.theme === 'plateau' && fx.theme === 'flux', J({ ar, fx }));

  // ---- L5 a live switch ----
  await visit('machina', '');
  await openPage(TEXT);
  const via1 = await setTheme('flux'); await sleep(1000); const s1 = await app.evalJs(READ);
  const via2 = await setTheme('machina'); await sleep(1500); const s2 = await app.evalJs(READ);
  ok(`L5 a theme switch, no reload (via ${via1}/${via2}): Machina -> Flux takes data-machina2 and the nameplate away (${s1 && s1.look}, ${s1 && s1.plate}); Flux -> Machina puts them back (${s2 && s2.look}, ${s2 && s2.plate})`,
    via1 === 'seam' && via2 === 'seam' && !!s1 && s1.theme === 'flux' && s1.look !== 'true' && !s1.plate && !!s2 && s2.theme === 'machina' && s2.look === 'true' && s2.plate, J({ via1, via2, s1, s2 }));

  // ---- L6 look only, L7 the page never moves ----
  await visit('machina', '?machina2=0');
  await openPage(TEXT);
  const rOff = await app.evalJs(RECT);
  await visit('machina', '');
  await openPage(TEXT);
  const rOn = await app.evalJs(RECT);
  ok(`L7 the page never moves: column, paper and editor rects the same with the look on as with ?machina2=0`, sameRect(rOn, rOff), J({ on: rOn, off: rOff }));
  await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g) g.click(); return !!g; })()"); await sleep(900);
  const toolsOpen = await app.evalJs("!!document.querySelector(\".wz-sliver[data-open='true']\")");
  // L15 (Tools drawer open): flush to the page, its tab on its outer edge
  const d15 = await app.evalJs(`(() => { const slide = document.querySelector('.wz-sliver-panel > .wz-drawer-slide'), grip = document.querySelector('.wz-sliver-grip'), page = document.querySelector('.mode-page');
    if (!slide || !grip || !page) return { slide: !!slide, grip: !!grip, page: !!page }; const s = slide.getBoundingClientRect(), g = grip.getBoundingClientRect(), p = page.getBoundingClientRect();
    return { gap: +(p.left - s.right).toFixed(2), tab: +(s.left - g.right).toFixed(2), slideW: +s.width.toFixed(1) }; })()`);
  // PARKED 2026-11-20 (SUPERSEDED, its first run, Actions 44687762906: the reader read the panel's inner sliding box, which is not the drawer's edge - gap -107.98,
  // tab -130, while drawer-mirror.mjs read the same open drawer on the same run as the PANEL flush to the page (panel 189-373, page left 373) and the tab on the
  // panel's outer edge (tab right 189)). Original, verbatim:
  // ok(`L15 the open Tools drawer stands flush against the page (gap ${d15 && d15.gap}) and its tab rides the drawer's outer edge (${d15 && d15.tab})`, toolsOpen && !!d15 && Math.abs(d15.gap) <= 1 && Math.abs(d15.tab) <= 1 && d15.slideW > 100, J({ toolsOpen, d15 }));
  // SUCCESSOR L15b: the same, read on the PANEL (.wz-sliver-panel, drawer-mirror's own element) - its right edge on the page's left edge, the tab's right edge on
  // the panel's left edge; and the mutant M5 below moves the panel off the page.
  const D15B = `(() => { const panel = document.querySelector('.wz-sliver-panel'), grip = document.querySelector('.wz-sliver-grip'), page = document.querySelector('.mode-page');
    if (!panel || !grip || !page) return { panel: !!panel, grip: !!grip, page: !!page }; const s = panel.getBoundingClientRect(), g = grip.getBoundingClientRect(), p = page.getBoundingClientRect();
    return { gap: +(p.left - s.right).toFixed(2), tab: +(s.left - g.right).toFixed(2), panelW: +s.width.toFixed(1) }; })()`;
  const l15bOk = (d) => !!d && Math.abs(d.gap) <= 1 && Math.abs(d.tab) <= 1 && d.panelW > 100;
  void D15B;
  // PARKED 2026-11-20 (SUPERSEDED, Actions 44691517313: it read exactly what L15 read - gap -107.98, tab -130, width 200 - so the element was not the cause; its
  // page was the FIRST .mode-page and its press an untrusted click read 900 ms later, where drawer-mirror reads '.desk-frame-stage--prose .mode-page' after a
  // trusted press and the slide at rest). Original, verbatim, with its mutant:
  // const d15b = await app.evalJs(D15B);
  // ok(`L15b the open Tools drawer stands flush against the page (panel to page ${d15b && d15b.gap}) and its tab rides the drawer's outer edge (tab to panel ${d15b && d15b.tab})`, toolsOpen && l15bOk(d15b), J({ toolsOpen, d15b }));
  // await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); if (p) p.style.setProperty('translate', '-40px 0'); return !!p; })()"); await sleep(100);
  // const m5 = await app.evalJs(D15B);
  // await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); if (p) p.style.removeProperty('translate'); return !!p; })()"); await sleep(100);
  // ok(`M5 (mutant): the open panel moved 40 px off the page (LANDED: gap ${m5 && m5.gap}) - L15b's read goes RED`, !!m5 && Math.abs(m5.gap - 40) <= 1 && !l15bOk(m5), J(m5));
  // SUCCESSOR L15c: drawer-mirror's own reading - the painted page '.desk-frame-stage--prose .mode-page', the drawer opened by a trusted press on its tab and read once
  // its sliding layer is at rest; every rect in the detail. M5b moves the panel 40 px and must move the gap by 40 (relative, so it is the read that is tested).
  const D15C = `(() => { const R = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: +b.left.toFixed(2), r: +b.right.toFixed(2), w: +b.width.toFixed(2) }; };
    const page = R('.desk-frame-stage--prose .mode-page'), panel = R('.wz-sliver-panel'), tab = R('.wz-sliver-grip');
    return { page, panel, tab, firstPage: R('.mode-page'), slide: R('.wz-sliver-panel .wz-drawer-slide'), open: document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true', w: innerWidth,
      gap: page && panel ? +(page.l - panel.r).toFixed(2) : null, tabGap: panel && tab ? +(panel.l - tab.r).toFixed(2) : null }; })()`;
  const l15cOk = (d) => !!d && d.open && d.gap != null && Math.abs(d.gap) <= 1 && Math.abs(d.tabGap) <= 1 && d.panel.w > 100;
  // PARKED 2026-11-20 (SUPERSEDED, Actions 44695523429: its own rects found the cause - the page was 992 px wide at 1400 (204-1196), the ZOOMED Free Write page: a
  // fresh page opens in Free Write, always the Typewriter now, and r10's drawer alignment leaves the zoom out by design (its rules carry
  // :not(:has(.mode-pagecol[data-zoom='true'])); main hides the tabs in any Typewriter mode). drawer-mirror reads the NORMAL view: a Draft page. Its mutant M5b
  // moved the gap by exactly 40, so the read itself was sound.) Original, verbatim, with its mutant:
  // // close it (the untrusted click above) and open it again by a trusted press, then wait for the slide to rest
  // await app.evalJs("(() => { const g = document.querySelector(\".wz-sliver-grip[data-open='true']\"); if (g) g.click(); return true; })()"); await sleep(900);
  // const at15 = await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (!g) return null; const r = g.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  // if (at15) { await app.mouseMove(at15.x, at15.y); await app.mouseDown(at15.x, at15.y); await app.mouseUp(at15.x, at15.y); }
  // await waitSoft(app, "(() => { const l = document.querySelector('.wz-sliver-panel .wz-drawer-slide'); return !!document.querySelector(\".wz-sliver[data-open='true']\") && (!l || getComputedStyle(l).transform === 'none'); })()", { label: 'tools at rest', timeout: 3000 }); await sleep(300);
  // const d15c = await app.evalJs(D15C);
  // ok(`L15c the open Tools drawer stands flush against the page (panel to page ${d15c && d15c.gap}) and its tab rides the drawer's outer edge (tab to panel ${d15c && d15c.tabGap})`, l15cOk(d15c), J(d15c));
  // await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); if (p) p.style.setProperty('translate', '-40px 0'); return !!p; })()"); await sleep(100);
  // const m5b = await app.evalJs(D15C);
  // await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); if (p) p.style.removeProperty('translate'); return !!p; })()"); await sleep(100);
  // ok(`M5b (mutant): the open panel moved 40 px (LANDED: gap ${d15c && d15c.gap} -> ${m5b && m5b.gap}) - L15c's read goes RED`, !!m5b && !!d15c && m5b.gap != null && d15c.gap != null && Math.abs(m5b.gap - d15c.gap - 40) <= 1 && !l15cOk(m5b), J(m5b));
  // SUCCESSOR L15d: L15c's reading on a DRAFT page (the normal view, as drawer-mirror reads it), with its premise in the check: the page is not zoomed. M5c its mutant.
  await app.evalJs("(() => { const g = document.querySelector(\".wz-sliver-grip[data-open='true']\"); if (g) g.click(); return true; })()"); await sleep(900);
  await openPage(TEXT, 'drafting');
  const zoom15 = await app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'");
  const at15 = await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (!g) return null; const r = g.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  if (at15) { await app.mouseMove(at15.x, at15.y); await app.mouseDown(at15.x, at15.y); await app.mouseUp(at15.x, at15.y); }
  await waitSoft(app, "(() => { const l = document.querySelector('.wz-sliver-panel .wz-drawer-slide'); return !!document.querySelector(\".wz-sliver[data-open='true']\") && (!l || getComputedStyle(l).transform === 'none'); })()", { label: 'tools at rest', timeout: 3000 }); await sleep(300);
  const d15d = await app.evalJs(D15C);
  ok(`L15d on a Draft page (zoomed ${zoom15}), the open Tools drawer stands flush against the page (panel to page ${d15d && d15d.gap}) and its tab rides the drawer's outer edge (tab to panel ${d15d && d15d.tabGap})`, zoom15 === false && l15cOk(d15d), J({ zoom15, d15d }));
  await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); if (p) p.style.setProperty('translate', '-40px 0'); return !!p; })()"); await sleep(100);
  const m5c = await app.evalJs(D15C);
  await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); if (p) p.style.removeProperty('translate'); return !!p; })()"); await sleep(100);
  ok(`M5c (mutant): the open panel moved 40 px (LANDED: gap ${d15d && d15d.gap} -> ${m5c && m5c.gap}) - L15d's read goes RED`, !!m5c && !!d15d && m5c.gap != null && d15d.gap != null && Math.abs(m5c.gap - d15d.gap - 40) <= 1 && !l15cOk(m5c), J(m5c));
  await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g) g.click(); return !!g; })()"); await sleep(900);
  const out6 = await app.evalJs(OUTREAD);
  ok(`L6 look only: with both drawers open, none of the features ruled out is on the page (${J(out6)})`, Array.isArray(out6) && out6.length === 0, J(out6));
  await app.evalJs("(() => { for (const s of ['.wz-sliver-grip', '.wz-tutor-grip']) { const g = document.querySelector(s + \"[data-open='true']\"); if (g) g.click(); } return true; })()"); await sleep(900);

  // ---- L10 L11 the nameplate and the flush bar ----
  const p10 = await app.evalJs(PLATE);
  ok(`L10 the nameplate: "${p10 && p10.text}" ${p10 && p10.dx} px in from the flush bar's left edge, inside the bar; the corner mark not drawn (${p10 && p10.markHidden})`, plateOk(p10), J(p10));
  ok(`L11 the flush bar is drawn at the window's top (${p10 && p10.barTop})`, !!p10 && p10.bar && Math.abs(p10.barTop) <= 0.5, J(p10));
  // ---- L12 the mark ----
  const m12 = await app.evalJs(`(() => { const bm = document.querySelector('.brand-mark'); if (!bm) return null; const cs = getComputedStyle(bm), af = getComputedStyle(bm, '::after');
    return { font: cs.fontFamily, color: cs.color, sq: af.borderTopColor, before: getComputedStyle(bm, '::before').content }; })()`);
  ok(`L12 the mark: WRIZ in Plex Mono (${m12 && m12.font}), its square a hairline in the mark's own colour (${m12 && m12.sq} = ${m12 && m12.color})`,
    !!m12 && /IBM Plex Mono/.test(m12.font) && m12.sq === m12.color && /WRIZ/.test(m12.before), J(m12));

  // ---- L8 L9 L13 the room, the bars, the page ----
  const r0 = await app.evalJs(RECT);
  const themes = await openThemes();
  const row = await app.evalJs(`(() => { const rr = document.querySelector('.wz-theme-picker .machina2-theme-room'); if (!rr) return null; const prev = rr.previousElementSibling;
    return { words: [...rr.querySelectorAll('.mode-seg button')].map((b) => (b.textContent || '').trim()), label: (rr.firstElementChild && rr.firstElementChild.textContent || '').trim(), prev: prev ? (prev.textContent || '').trim().slice(0, 12) : null, help: !!rr.querySelector('.machina2-room-help') }; })()`);
  const rows = {};
  for (const [word, want] of [['Light', 'light'], ['Dark', 'dark']]) {
    const did = await pickRoom(word);
    for (const tone of ['Light', 'Dark']) {
      await app.evalJs(`(() => { const rowP = [...document.querySelectorAll('.wz-theme-picker .mode-crow, .wz-theme-picker .wz-theme-picker-field > *')].find((x) => /^Page/.test((x.textContent || '').trim()) && !x.classList.contains('machina2-theme-room'));
        const b = rowP && [...rowP.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === ${J(tone)}); if (b) b.click(); return !!b; })()`); await sleep(500);
      rows[`${want}/${tone.toLowerCase()}`] = { did, ...(await app.evalJs(ROOM)) };
    }
  }
  await pickRoom('Automatic');
  const noon = await app.evalJs("(() => { const f = window.machina2Clock; return f ? f('12:00') : null; })()"); await sleep(300);
  const autoNoon = await app.evalJs(ROOM);
  const night = await app.evalJs("(() => { const f = window.machina2Clock; return f ? f('23:00') : null; })()"); await sleep(300);
  const autoNight = await app.evalJs(ROOM);
  await app.evalJs("(() => { const f = window.machina2Clock; return f ? f(null) : null; })()");
  await closeThemes();
  const r1 = await app.evalJs(RECT);
  const L = rows['light/light'], D = rows['dark/dark'];
  ok(`L8 the room in the Themes pop-out, under Page (${row && row.prev}): "${row && row.label}: ${row && row.words.join(' · ')}" with its "?"; Light -> ${L && L.room} (${L && L.ground}), Dark -> ${D && D.room} (${D && D.ground}), Automatic -> ${autoNoon.room} at 12:00, ${autoNight.room} at 23:00; the page's rect unchanged`,
    themes && !!row && row.label === 'Room' && J(row.words) === J(['Light', 'Dark', 'Automatic']) && /^Page/.test(row.prev || '') && row.help
    && !!L && L.choice === 'light' && L.room === 'light' && L.ground === '#E6E8EA' && !!D && D.choice === 'dark' && D.room === 'dark' && D.ground === '#151719'
    && autoNoon.choice === null && noon === 'light' && autoNoon.room === 'light' && night === 'dark' && autoNight.room === 'dark' && sameRect(r0, r1),
    J({ themes, row, L, D, autoNoon, autoNight, noon, night, r0, r1 }));
  const bars = Object.entries(rows).map(([k, v]) => [k, v.barBg, v.labelC]);
  ok(`L9 the bars dark in both rooms (COOL #1E262E) with their labels >= 4.5:1 on them: ${J(bars)}`, bars.length === 4 && bars.every(([, bg, c]) => bg === 'rgb(30, 38, 46)' && c >= 4.5), J(bars));
  const pages = Object.entries(rows).map(([k, v]) => [k, v.paper, v.inkC]);
  ok(`L13 the page: light #FBFBFA, dark #1A1B1D in either room, ink >= 7:1: ${J(pages)}`,
    pages.length === 4 && pages.every(([k, paper, c]) => paper === (k.endsWith('/light') ? 'rgb(251, 251, 250)' : 'rgb(26, 27, 29)') && c >= 7), J(pages));

  // ---- L14 the zoomed page stays paper (a dark page in the light room) ----
  await visit('machina', '', "localStorage.setItem('wrizo-writing-settings', JSON.stringify({ typewriter: true }));");
  await openPage(TEXT, 'journal');
  await openThemes(); await pickRoom('Light');
  await app.evalJs(`(() => { const rowP = [...document.querySelectorAll('.wz-theme-picker .mode-crow, .wz-theme-picker .wz-theme-picker-field > *')].find((x) => /^Page/.test((x.textContent || '').trim()) && !x.classList.contains('machina2-theme-room'));
    const b = rowP && [...rowP.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Dark'); if (b) b.click(); return !!b; })()`); await sleep(400);
  await closeThemes(); await sleep(1000);
  const s14 = await app.evalJs(`(() => { const col = document.querySelector(".mode-pagecol[data-zoom='true']"), page = col && col.querySelector('.mode-page'), sh = document.querySelector('.machina2-sheet');
    const r = document.documentElement; if (!col || !page) return { zoom: !!col, room: r.getAttribute('data-machina2-room') };
    const a = page.getBoundingClientRect(), s = sh && sh.getBoundingClientRect();
    return { zoom: true, room: r.getAttribute('data-machina2-room'), tone: r.getAttribute('data-page'), sheet: !!sh, shown: !!sh && getComputedStyle(sh).display !== 'none', bg: sh ? getComputedStyle(sh).backgroundColor : null, paper: getComputedStyle(page).backgroundColor,
      inside: !!s && s.left >= a.left - 1 && s.right <= a.right + 1 && s.top >= a.top - 1 && s.bottom <= a.bottom + 1 && s.width > 50 && s.height > 50 }; })()`);
  ok(`L14 the zoomed page stays paper: a dark page (${s14 && s14.tone}) in the light room (${s14 && s14.room}) has a sheet in the page's colour (${s14 && s14.bg} = ${s14 && s14.paper}) inside the page`,
    !!s14 && s14.zoom && s14.room === 'light' && s14.tone === 'dark' && s14.shown && s14.bg === s14.paper && s14.paper === 'rgb(26, 27, 29)' && s14.inside, J(s14));
  // (the writer's own settings back as they were for the mutants below)
  await app.evalJs("localStorage.removeItem('wrizo-writing-settings'); true");

  // ---- mutants ----
  await visit('flux', '');
  await app.evalJs("document.documentElement.setAttribute('data-machina2', 'true'); (() => { const h = document.createElement('div'); h.id = 'machina2-mockup'; document.body.appendChild(h); })(); true");
  const m1 = await app.evalJs(READ);
  ok(`M1 (mutant): data-machina2 forced onto a Flux page (LANDED: ${m1 && m1.look}) - L4's read goes RED`, !!m1 && m1.look === 'true' && !l4ok(m1), J(m1));
  await visit('machina', '');
  await app.evalJs("(() => { const h = document.getElementById('machina2-mockup') || document.body; const d = document.createElement('div'); d.className = 'machina2-bar'; const b = document.createElement('button'); b.className = 'machina2-bar-head'; b.textContent = 'Machina mockup'; d.appendChild(b); h.appendChild(d); return true; })()");
  const m2 = await app.evalJs(READ);
  ok(`M2 (mutant): a mockup bar put into the default page (LANDED: bar ${m2 && m2.bar}) - L1's read goes RED`, !!m2 && m2.bar && !l1ok(m2), J(m2));
  await openPage(TEXT);
  await app.evalJs("(() => { const d = document.createElement('div'); d.className = 'machina2-cmd'; document.body.appendChild(d); return true; })()");
  const m3 = await app.evalJs(OUTREAD);
  ok(`M3 (mutant): a command line box put into the page (LANDED: ${J(m3)}) - L6's read goes RED`, Array.isArray(m3) && m3.includes('.machina2-cmd'), J(m3));
  await app.evalJs("(() => { const p = document.querySelector('.machina2-nameplate'); if (p) p.style.setProperty('display', 'none', 'important'); return !!p; })()");
  const m4 = await app.evalJs(PLATE);
  ok(`M4 (mutant): the nameplate hidden (LANDED: shown ${m4 && m4.shown}) - L10's read goes RED`, !!m4 && m4.plate && m4.shown === false && !plateOk(m4), J(m4));
  return checks;
}, { label: 'machina-look' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nMACHINA-LOOK PARKED: PASS (0 checks) - HARNESS_PARKED=1 armed; this file parks three originals as quoted comments (L15, L15b with M5, L15c with M5b, Nov 20: the first read the panel\'s inner box), the third the zoomed page), successor L15d and mutant M5c');
const WANT = 20;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nMACHINA-LOOK VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-LOOK VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
