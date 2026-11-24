// THE CHROME GROWS WITH THE WINDOW (reorg plan v2.1 §3b, ARBOR item 4; Team B row 5; Fable, Nov 21 11:45 am, RULED: one chrome scale from the
// window's width / 1366, Machina under the reorg only, the page's rect rule untouched; the Wrizors PASSED it, Nov 21 1:05 pm, with carries: the Run
// hides behind the Doc beside the page in the split, at every size; the Doc beside does not grow). Machina with its look, ?reorg=1.
//
// The fixture (seams only): a set "The Mill" in a Drawer with three Parts, the first 24 paragraphs long; a loose Doc "Research notes". She is on the
// first Part in BUILD. The window is 1366x768, 1920x1080 and 2560x1440 in turn; every size is read against the 1366 reading of the same run.
//
// (#126, Fable Nov 24 11:15 am: the chrome stops growing at 1920, so k at 2560 is 1.406: K1 and WANT_K are parked below, K1-B is K1's successor)
// SCALE   K1  k is published only in Machina under the reorg: 'base' at 1366 (no scale), 1.406 at 1920 and 1.874 at 2560 (window / 1366, three places);
//             Machina without the reorg publishes nothing
// RAIL    K2  the rail is 84 x k px wide and its first door is k times as tall as at 1366 (within 5%)
// BAR     K3  the bar's stage tab (BUILD) is k times as tall as at 1366 (within 5%)
// FRONT   K4  the Front menu's first tab is k times as tall as at 1366 (within 5%); the drawer is wider by k where the desk beside the page allows
//             (its cap is 200 x k); and no more of its controls run past its right edge than at 1366
// BACK    K5  the Back menu's first tab is k times as tall as at 1366 (within 5%), and it opens 320 x k px wide where the desk allows
// SPLIT   K6  the Doc beside the page: its head's kind label is k times as tall as at 1366 (within 5%)
// PAGE    K7  at 2560, the page's rect is the same with each drawer open and closed (the rule untouched)
// TRACK   K8  (Fable, Nov 21 3:05 pm, RULED: the Front drawer's track scales by k like the rest) at 1920 and 2560 the Front drawer's track is
//             min(200 x k, the desk beside the page) - the desk measured from the rail's right edge to the page's left, less the 28 px gap - within 3 px
//         MUT-K8  the 2560 reading with the old track (the stage's own half only) turns K8's test red
// PASS 2  (the Wrizors' pass 2, Nov 21 3:20 pm, two REAL; Fable 3:20 pm) K9 at 1366, 1920 and 2560 the window does not scroll (the document is no taller and
//             no wider than the window); K10 the crumb's current Part reads in the bar's label colour, 7:1 or better against the bar, at every size;
//             K11 the "...", the search door and the readout under the page (the Run and its count) are k times as large as at 1366 (5%)
//         MUT-K9  a reading 16 px taller than the window turns K9's test red    MUT-K10  the crumb read at #3A4047 turns K10's test red
// CAP     K12 (Fable, Nov 21 3:52 pm) at 2560, an unrelated 400 px overflow (a block added to the page's foot) leaves the chrome budget's extra at or
//             under its cap - the bar's height at 2560 minus its height at 1366, plus 2 px - and the page's height unchanged
//         MUT-K12  the uncapped loop (the extra grown by the 400 px) turns K12's test red
// CENTRE  K13 (the Wrizors' pass 3 NIT, Nov 21 4:00 pm) at 1366, 1920 and 2560 the readout under the page (the Run and its count) is centred on her
//             page within 2 px, in the plain view and in the split
//         MUT-K13  a readout 75 px off the page's centre turns K13's test red
// RUN     R1  in the split the Run stands under her page - its middle inside the page's left and right, and none of it under the Doc beside - at
//             1366, 1920 and 2560
// MUTANTS MUT-K2  a 2560 reading with the rail's width unscaled turns K2's test red    MUT-R1  a split reading with the Run left unshifted turns R1's test red
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-chrome-scale.mjs
process.env.WS_MACHINA2 = process.env.WS_MACHINA2 || 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const SIZES = [[1366, 768], [1920, 1080], [2560, 1440]];
// SUPERSEDED (#126, Fable Nov 24 11:15 am, RULED: the menus and rails stop growing at their 1920-wide size; k is capped at 1920 / 1366 in
// reorg/chromeScale.ts, menu-cap-126.mjs): k at 2560 is 1.406, no longer 1.874. Every check below that reads WANT_K reads the successor. Verbatim:
//   const WANT_K = { 1366: 1, 1920: 1.406, 2560: 1.874 };
const WANT_K = { 1366: 1, 1920: 1.406, 2560: 1.406 };
const LINES = Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. The rain had not stopped for three days, and the river was up past the second step of the mill.`);
const near = (a, b, tol) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
const ratioOk = (v, base, k) => Number.isFinite(v) && Number.isFinite(base) && base > 0 && Math.abs(v / base - k) <= 0.05 * k;

const box = (sel) => `(() => { const e = [...document.querySelectorAll(${q(sel)})].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, r: r.right }; })()`;
const PAGE = "(() => { const p = document.querySelector('.mode-page'); if (!p) return null; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); })()";
const SCALE = "(() => { const r = document.documentElement; return { attr: r.getAttribute('data-wz-chrome-scale'), k: r.style.getPropertyValue('--wz-chrome-k') || null }; })()";
const SPILL = (panel) => `(() => { const p = document.querySelector(${q(panel)}); if (!p) return null; const pr = p.getBoundingClientRect();
  return [...p.querySelectorAll('button, input, select, [role="tab"]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > pr.right + 1; }).length; })()`;
// pass 2's readings: the window's own scroll sizes, the crumb's Part against the bar, and the "...", the search door and the readout
const PASS2 = `(() => { const se = document.scrollingElement; const bx = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { w: r.width, h: r.height }; };
  const part = document.querySelector('.reorg-top .reorg-top-part-count'); const bar = document.querySelector('.chrome-top.sprint-nav');
  return { sh: se.scrollHeight, sw: se.scrollWidth, ih: innerHeight, iw: innerWidth, part: part ? getComputedStyle(part).color : null, partText: part ? (part.textContent || '').trim() : null, bar: bar ? getComputedStyle(bar).backgroundColor : null,
    dots: bx(document.querySelector('.gh-corner-glyph')), search: bx(document.querySelector('.reorg-top .reorg-top-search')), run: bx(document.querySelector('.machina-run')) }; })()`;
const rgbOf = (c) => { const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const lum = (c) => { const v = rgbOf(c); if (!v) return NaN; const [r, g, b] = v.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const OPEN = (sel) => `document.querySelector(${q(sel)})?.getAttribute('data-open') === 'true'`;

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 }).catch(() => {});
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }).catch(() => {});
  await app.evalJs(`(() => { const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    page('cs-1', ${q(['Chapter One', ...LINES].join('\n'))}, { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('cs-2', 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('cs-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page('cs-n', 'Research notes\\nMill wheels turn at about twelve turns a minute.', { origin: 'loose' });
    W.wrizoFlushNow(); return true; })()`);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); localStorage.setItem('wrizo-theme', 'machina'); null");
}
async function visit(app, w, h, reorg = true) {
  await app.emulateDpr(1, w, h);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/cs-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && document.documentElement.getAttribute('data-machina2') === 'true'", { label: `the Part at ${w}`, timeout: 20000 }).catch(() => {});
  await sleep(900);
  if (reorg) {
    await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
    await app.waitFor("document.querySelector('.reorg-top [data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true'", { label: 'BUILD', timeout: 6000 }).catch(() => {});
  }
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await sleep(900);
}
async function toggle(app, grip, root, want) {
  const is = await app.evalJs(OPEN(root));
  if (is !== want) await app.evalJs(`document.querySelector(${q(grip)})?.click(); null`);
  await app.waitFor(want ? OPEN(root) : `!(${OPEN(root)})`, { label: `${root} ${want ? 'open' : 'closed'}`, timeout: 5000 }).catch(() => {});
  await sleep(700);
}
// the Run under the page: its middle inside the page's span, and none of it under the split's side
const r1 = (s) => !!s && !!s.run && !!s.page && !!s.split && s.run.l + s.run.w / 2 > s.page.l && s.run.l + s.run.w / 2 < s.page.r && s.run.r <= s.split.l;

await withHarness(async (app) => {
  await seed(app);
  const read = {};
  for (const [w, h] of SIZES) {
    await visit(app, w, h);
    const R = { scale: await app.evalJs(SCALE), rail: await app.evalJs(box('.desk-frame-strip')), door: await app.evalJs(box('.wz-reorg-rail button')), tab: await app.evalJs(box('.reorg-top .desk-mode-tab[data-mode-key="draft"]')) };
    R.page0 = await app.evalJs(PAGE);
    R.pass2 = await app.evalJs(PASS2);
    R.runC = await app.evalJs("(() => { const r = document.querySelector('.machina-run'); const p = document.querySelector('.mode-page'); if (!r || !p) return null; const a = r.getBoundingClientRect(), b = p.getBoundingClientRect(); return { run: a.left + a.width / 2, page: b.left + b.width / 2 }; })()");
    R.barH = await app.evalJs("(() => { const b = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0); return b ? b.getBoundingClientRect().height : null; })()");
    if (w === 2560) {
      // K12's reading: the extra and the page before, a 400 px block added at the page's foot (an overflow the budget does not govern), 2 s, then after
      const EXTRA = "parseFloat(document.documentElement.style.getPropertyValue('--wz-chrome-extra')) || 0";
      R.k12 = { before: await app.evalJs(EXTRA), pageBefore: await app.evalJs(PAGE) };
      await app.evalJs("(() => { const d = document.createElement('div'); d.id = 'k12-overflow'; d.style.cssText = 'height:400px;width:10px;'; document.body.appendChild(d); return true; })()");
      await sleep(2000);
      R.k12.after = await app.evalJs(EXTRA); R.k12.pageAfter = await app.evalJs(PAGE); R.k12.scroll = await app.evalJs('document.scrollingElement.scrollHeight - innerHeight');
      await app.evalJs("document.getElementById('k12-overflow')?.remove(); null"); await sleep(300);
    }
    await toggle(app, '.wz-sliver-grip', '.wz-sliver', true);
    R.front = { panel: await app.evalJs(box('.wz-sliver-panel')), tab: await app.evalJs(box('.wz-sliver [role="tab"]')), spill: await app.evalJs(SPILL('.wz-sliver-panel')) };
    R.page1 = await app.evalJs(PAGE);
    await toggle(app, '.wz-sliver-grip', '.wz-sliver', false);
    R.page2 = await app.evalJs(PAGE);
    await toggle(app, '.wz-tutor-grip', '.wz-tutor-panel', true);
    R.back = { panel: await app.evalJs(box('.wz-tutor-panel')), tab: await app.evalJs(box('.wz-tutor-panel [role="tab"]')), stage: await app.evalJs(box('.desk-frame-stage')), paper: await app.evalJs(box('.mode-page')) };
    R.page3 = await app.evalJs(PAGE);
    await toggle(app, '.wz-tutor-grip', '.wz-tutor-panel', false);
    R.page4 = await app.evalJs(PAGE);
    await app.evalJs("window.wrizoSplit && window.wrizoSplit.open('cs-1', { entryId: 'cs-n' }); null");
    await app.waitFor("!!document.querySelector('.wz-split-asset')", { label: 'the split', timeout: 6000 }).catch(() => {});
    await sleep(900);
    R.split = { kind: await app.evalJs(box('.wz-split-head .wz-link-dock-kind')), side: await app.evalJs(box('.wz-split-asset')), run: await app.evalJs(box('.machina-run')), page: await app.evalJs(box('.mode-page')) };
    await app.evalJs("window.wrizoSplit && window.wrizoSplit.close(); null"); await sleep(500);
    read[w] = R;
  }
  // Machina without the reorg, at 2560: nothing published
  await visit(app, 2560, 1440, false);
  const plain = await app.evalJs(SCALE);
  console.log('CHROME-SCALE READINGS ' + JSON.stringify(read));

  const b = read[1366];
  // SUPERSEDED (#126, Fable Nov 24 11:15 am, RULED: the chrome stops growing at its 1920-wide size): K1's 1.874 at 2560 is falsified by the cap;
  // K1-B asserts 1.406 there. Verbatim:
  //   ok(`K1 k only in Machina under the reorg: 1366 ${J(read[1366].scale)}, 1920 ${J(read[1920].scale)}, 2560 ${J(read[2560].scale)}; without the reorg ${J(plain)}`,
  //     read[1366].scale.attr === 'base' && read[1920].scale.attr === 'on' && near(parseFloat(read[1920].scale.k), 1.406, 0.001) && read[2560].scale.attr === 'on' && near(parseFloat(read[2560].scale.k), 1.874, 0.001) && !plain.attr && !plain.k,
  //     { s: SIZES.map(([w]) => read[w].scale), plain });
  ok(`K1-B k only in Machina under the reorg, capped at the 1920 window's (#126): 1366 ${J(read[1366].scale)}, 1920 ${J(read[1920].scale)}, 2560 ${J(read[2560].scale)}; without the reorg ${J(plain)}`,
    read[1366].scale.attr === 'base' && read[1920].scale.attr === 'on' && near(parseFloat(read[1920].scale.k), 1.406, 0.001) && read[2560].scale.attr === 'on' && near(parseFloat(read[2560].scale.k), 1.406, 0.001) && !plain.attr && !plain.k,
    { s: SIZES.map(([w]) => read[w].scale), plain });
  const k2 = (R, k) => !!R.rail && near(R.rail.w, 84 * k, 1.5) && !!R.door && ratioOk(R.door.h, b.door && b.door.h, k);
  ok('K2 the rail is 84 x k px wide and its first door k times as tall as at 1366 (5%)', SIZES.every(([w]) => k2(read[w], WANT_K[w])), SIZES.map(([w]) => ({ w, rail: read[w].rail && read[w].rail.w, door: read[w].door && read[w].door.h })));
  ok('K3 the bar\'s BUILD tab is k times as tall as at 1366 (5%)', SIZES.every(([w]) => !!read[w].tab && ratioOk(read[w].tab.h, b.tab && b.tab.h, WANT_K[w])), SIZES.map(([w]) => ({ w, tab: read[w].tab && read[w].tab.h })));
  const k4 = (R, k) => !!R.front.tab && ratioOk(R.front.tab.h, b.front.tab && b.front.tab.h, k) && !!R.front.panel && (k === 1 || R.front.panel.w > b.front.panel.w + 1) && R.front.spill !== null && R.front.spill <= b.front.spill;
  // SUPERSEDED (Nov 21, before this file's first green; Actions 44952123641, build 092aa428): K4's premise, the Front drawer's words at k, is false where the bigger page leaves
  // less desk: at 2560 the drawer's track was 222 px and its words at 1.874 spilled 12 controls. The drawer's contents now grow by its OWN scale,
  // min(k, its track / 200) (reorg/chromeScale.ts); K4-B reads that scale from the drawer's width. Verbatim:
  // ok('K4 the Front menu\'s tab is k times as tall as at 1366 (5%), the drawer is wider where the desk allows, and no more controls spill past its edge than at 1366',
  //   SIZES.every(([w]) => k4(read[w], WANT_K[w])), SIZES.map(([w]) => ({ w, ...read[w].front })));
  const fk = (R, k) => (R.front.panel ? Math.max(1, Math.min(k, (R.front.panel.w + 16) / 200)) : NaN);
  const k4b = (R, k) => !!R.front.tab && ratioOk(R.front.tab.h, b.front.tab && b.front.tab.h, fk(R, k)) && !!R.front.panel && (k === 1 || R.front.panel.w > b.front.panel.w + 1) && R.front.spill !== null && R.front.spill <= b.front.spill;
  ok('K4-B the Front menu\'s tab grows by the drawer\'s own scale - min(k, its track / 200) - within 5%, the drawer is wider where the desk allows, and no more controls spill past its edge than at 1366',
    SIZES.every(([w]) => k4b(read[w], WANT_K[w])), SIZES.map(([w]) => ({ w, fk: fk(read[w], WANT_K[w]), ...read[w].front })));
  // MUT-K4-B: the 2560 reading with more controls past the edge than at 1366 turns K4-B red (the mutant LANDED: the reading changed)
  const spilled = { ...read[2560], front: { ...read[2560].front, spill: (b.front.spill || 0) + 8 } };
  ok('MUT-K4-B a 2560 Front drawer spilling more than at 1366 turns K4-B red', spilled.front.spill !== read[2560].front.spill && !k4b(spilled, WANT_K[2560]), spilled.front);
  const k5 = (R, k) => !!R.back.tab && ratioOk(R.back.tab.h, b.back.tab && b.back.tab.h, k) && !!R.back.panel && !!R.back.stage && !!R.back.paper
    && (k === 1 || near(R.back.panel.w, Math.min(320 * k, R.back.stage.r - R.back.paper.r - 16), 3) || R.back.panel.w >= 320 * k - 3);
  ok('K5 the Back menu\'s tab is k times as tall as at 1366 (5%), and it opens 320 x k px wide where the desk allows', SIZES.every(([w]) => k5(read[w], WANT_K[w])),
    SIZES.map(([w]) => ({ w, tab: read[w].back.tab && read[w].back.tab.h, panel: read[w].back.panel && read[w].back.panel.w, desk: read[w].back.stage && read[w].back.paper ? read[w].back.stage.r - read[w].back.paper.r : null })));
  ok('K6 the Doc beside the page: its kind label is k times as tall as at 1366 (5%)', SIZES.every(([w]) => !!read[w].split.kind && ratioOk(read[w].split.kind.h, b.split.kind && b.split.kind.h, WANT_K[w])),
    SIZES.map(([w]) => ({ w, kind: read[w].split.kind && read[w].split.kind.h })));
  const big = read[2560];
  // ---- PASS 2 --------------------------------------------------------------------------------------------------------------------------
  const k9 = (p) => !!p && p.sh <= p.ih + 0.5 && p.sw <= p.iw + 0.5;
  ok('K9 at 1366, 1920 and 2560 the window does not scroll: the document is no taller and no wider than the window', SIZES.every(([w]) => k9(read[w].pass2)),
    SIZES.map(([w]) => ({ w, ...(read[w].pass2 ? { sh: read[w].pass2.sh, ih: read[w].pass2.ih, sw: read[w].pass2.sw, iw: read[w].pass2.iw } : {}) })));
  const k10 = (p) => !!p && !!p.part && /Part \d+ of \d+/.test(p.partText || '') && contrast(p.part, p.bar) >= 7;
  ok('K10 the crumb\'s current Part ("Part n of m") reads 7:1 or better against the bar at every size', SIZES.every(([w]) => k10(read[w].pass2)),
    SIZES.map(([w]) => ({ w, part: read[w].pass2 && read[w].pass2.part, bar: read[w].pass2 && read[w].pass2.bar, ratio: read[w].pass2 ? +contrast(read[w].pass2.part, read[w].pass2.bar).toFixed(2) : null })));
  const b2 = b.pass2 || {};
  const k11 = (p, k) => !!p && ['dots', 'search', 'run'].every((n) => !!p[n] && !!b2[n] && ratioOk(p[n].h, b2[n].h, k));
  ok('K11 the "...", the search door and the readout under the page are k times as tall as at 1366 (5%)', SIZES.every(([w]) => k11(read[w].pass2, WANT_K[w])),
    SIZES.map(([w]) => ({ w, dots: read[w].pass2 && read[w].pass2.dots, search: read[w].pass2 && read[w].pass2.search, run: read[w].pass2 && read[w].pass2.run })));
  const cap = Number.isFinite(big.barH) && Number.isFinite(b.barH) ? big.barH - b.barH + 2 : NaN;
  const k12 = (c, cp) => !!c && Number.isFinite(cp) && c.after <= cp + 0.5 && c.pageAfter === c.pageBefore;
  // SUPERSEDED (Nov 21, before this file's first green; Actions 44960231602 on 3355a59e: the extra held at 16 and the page's height held at 1217, but
  // K12 compared the whole rect, and the 400 px block's own window scrollbar narrowed the layout, so the page stood 5 px further left - not the
  // budget's doing): K12's claim is the extra and the page's HEIGHT. K12-B compares the page's top and height. Verbatim:
  //   ok('K12 at 2560 an unrelated 400 px overflow leaves the budget\'s extra at or under its cap (the bar at 2560 minus the bar at 1366, plus 2 px) and the page\'s height unchanged',
  //     k12(big.k12, cap), { cap, ...big.k12 });
  const vert = (s) => { const p = (s || '').split(','); return p.length === 4 ? `${p[1]},${p[3]}` : ''; };   // "left,top,width,height" -> "top,height"
  const k12b = (c, cp) => !!c && Number.isFinite(cp) && c.after <= cp + 0.5 && !!vert(c.pageBefore) && vert(c.pageAfter) === vert(c.pageBefore);
  ok('K12-B at 2560 an unrelated 400 px overflow leaves the budget\'s extra at or under its cap (the bar at 2560 minus the bar at 1366, plus 2 px) and the page\'s top and height unchanged',
    k12b(big.k12, cap), { cap, ...big.k12 });
  const uncapped = big.k12 ? { ...big.k12, after: big.k12.before + 400 } : null;
  // SUPERSEDED with K12 (the same run): its mutant moves to K12-B's test. Verbatim:
  //   ok('MUT-K12 the uncapped loop (the extra grown by the 400 px) turns K12\'s test red', !!uncapped && uncapped.after !== big.k12.after && !k12(uncapped, cap), uncapped && { cap, after: uncapped.after });
  ok('MUT-K12-B the uncapped loop (the extra grown by the 400 px) turns K12-B\'s test red', !!uncapped && uncapped.after !== big.k12.after && !k12b(uncapped, cap), uncapped && { cap, after: uncapped.after });
  const mid = (b) => b ? b.l + b.w / 2 : NaN;
  const k13 = (R) => !!R.runC && Math.abs(R.runC.run - R.runC.page) <= 2 && !!R.split.run && !!R.split.page && Math.abs(mid(R.split.run) - mid(R.split.page)) <= 2;
  ok('K13 the readout under the page is centred on her page within 2 px, plain and in the split, at 1366, 1920 and 2560', SIZES.every(([w]) => k13(read[w])),
    SIZES.map(([w]) => ({ w, plain: read[w].runC && +(read[w].runC.run - read[w].runC.page).toFixed(1), split: +(mid(read[w].split.run) - mid(read[w].split.page)).toFixed(1) })));
  const offC = { ...big, runC: big.runC ? { ...big.runC, run: big.runC.page - 75 } : null };
  ok('MUT-K13 a readout 75 px off the page\'s centre turns K13\'s test red', !!offC.runC && offC.runC.run !== (big.runC && big.runC.run) && !k13(offC), offC.runC);
  const taller = big.pass2 ? { ...big.pass2, sh: big.pass2.ih + 16 } : null;
  ok('MUT-K9 a reading 16 px taller than the window turns K9\'s test red', !!taller && taller.sh !== big.pass2.sh && !k9(taller), taller && { sh: taller.sh, ih: taller.ih });
  const dim = big.pass2 ? { ...big.pass2, part: 'rgb(58, 64, 71)' } : null;
  ok('MUT-K10 the crumb\'s Part read at #3A4047 turns K10\'s test red', !!dim && dim.part !== big.pass2.part && !k10(dim), dim && { part: dim.part, bar: dim.bar });
  // K8: the Front drawer's track against the desk beside the page (the page's painted left edge, as read at rest, less the rail's right edge and the gap)
  const desk = (R) => { const p = (R.page0 || '').split(',').map(Number); return R.rail && p.length === 4 ? p[0] - (R.rail.l + R.rail.w) - 28 : NaN; };
  const k8 = (R, k) => !!R.front.panel && Number.isFinite(desk(R)) && near(R.front.panel.w + 16, Math.min(200 * k, desk(R)), 3);
  ok('K8 at 1920 and 2560 the Front drawer\'s track is min(200 x k, the desk beside the page) within 3 px', [1920, 2560].every((w) => k8(read[w], WANT_K[w])),
    [1920, 2560].map((w) => ({ w, track: read[w].front.panel ? read[w].front.panel.w + 16 : null, desk: desk(read[w]), want: Math.min(200 * WANT_K[w], desk(read[w])) })));
  const oldTrack = { ...big, front: { ...big.front, panel: big.front.panel ? { ...big.front.panel, w: 222 } : null } };
  ok('MUT-K8 the 2560 reading with the old 238 px track turns K8\'s test red', !!oldTrack.front.panel && oldTrack.front.panel.w !== (big.front.panel && big.front.panel.w) && !k8(oldTrack, WANT_K[2560]), oldTrack.front.panel);
  ok('K7 at 2560 the page\'s rect is the same with each drawer open and closed', !!big.page0 && [big.page1, big.page2, big.page3, big.page4].every((p) => p === big.page0), [big.page0, big.page1, big.page2, big.page3, big.page4]);
  const runs = SIZES.map(([w]) => ({ w, run: read[w].split.run, page: read[w].split.page, split: read[w].split.side }));
  ok('R1 in the split the Run stands under her page (its middle inside the page, none of it under the Doc beside) at 1366, 1920 and 2560', runs.every((s) => r1(s)), runs);
  // MUTANTS on the readings (LANDED: the reading changed)
  const flat = { ...big, rail: big.rail ? { ...big.rail, w: 84 } : null };
  ok('MUT-K2 a 2560 reading with the rail unscaled turns K2\'s test red', !!flat.rail && !!big.rail && flat.rail.w !== big.rail.w && !k2(flat, WANT_K[2560]), flat.rail);
  const s0 = runs[0];
  const unshifted = s0 && s0.run && s0.page ? { ...s0, run: { ...s0.run, l: s0.split ? s0.split.l + 10 : s0.run.l, r: s0.split ? s0.split.l + 10 + s0.run.w : s0.run.r } } : null;
  ok('MUT-R1 a split reading with the Run under the Doc beside turns R1\'s test red', !!unshifted && unshifted.run.l !== s0.run.l && !r1(unshifted), unshifted && unshifted.run);
});

function J(v) { return JSON.stringify(v); }
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 22;   // + K13, MUT-K13 (the readout centred, the Wrizors' pass 3 NIT)   // 13 + K9, K10, K11, MUT-K9, MUT-K10 (the Wrizors' pass 2, Nov 21) + K12, MUT-K12 (the cap, Fable 3:52 pm)   // 10 - K4 (parked before the first green, Nov 21) + K4-B + MUT-K4-B; + K8 + MUT-K8 (the Front track, Fable 3:05 pm)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-CHROME-SCALE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-CHROME-SCALE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
