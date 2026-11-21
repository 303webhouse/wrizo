// THE CHROME GROWS WITH THE WINDOW (reorg plan v2.1 §3b, ARBOR item 4; Team B row 5; Fable, Nov 21 11:45 am, RULED: one chrome scale from the
// window's width / 1366, Machina under the reorg only, the page's rect rule untouched; the Wrizors PASSED it, Nov 21 1:05 pm, with carries: the Run
// hides behind the Doc beside the page in the split, at every size; the Doc beside does not grow). Machina with its look, ?reorg=1.
//
// The fixture (seams only): a set "The Mill" in a Drawer with three Parts, the first 24 paragraphs long; a loose Doc "Research notes". She is on the
// first Part in BUILD. The window is 1366x768, 1920x1080 and 2560x1440 in turn; every size is read against the 1366 reading of the same run.
//
// SCALE   K1  k is published only in Machina under the reorg: 'base' at 1366 (no scale), 1.406 at 1920 and 1.874 at 2560 (window / 1366, three places);
//             Machina without the reorg publishes nothing
// RAIL    K2  the rail is 84 x k px wide and its first door is k times as tall as at 1366 (within 5%)
// BAR     K3  the bar's stage tab (BUILD) is k times as tall as at 1366 (within 5%)
// FRONT   K4  the Front menu's first tab is k times as tall as at 1366 (within 5%); the drawer is wider by k where the desk beside the page allows
//             (its cap is 200 x k); and no more of its controls run past its right edge than at 1366
// BACK    K5  the Back menu's first tab is k times as tall as at 1366 (within 5%), and it opens 320 x k px wide where the desk allows
// SPLIT   K6  the Doc beside the page: its head's kind label is k times as tall as at 1366 (within 5%)
// PAGE    K7  at 2560, the page's rect is the same with each drawer open and closed (the rule untouched)
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
const WANT_K = { 1366: 1, 1920: 1.406, 2560: 1.874 };
const LINES = Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. The rain had not stopped for three days, and the river was up past the second step of the mill.`);
const near = (a, b, tol) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
const ratioOk = (v, base, k) => Number.isFinite(v) && Number.isFinite(base) && base > 0 && Math.abs(v / base - k) <= 0.05 * k;

const box = (sel) => `(() => { const e = [...document.querySelectorAll(${q(sel)})].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, r: r.right }; })()`;
const PAGE = "(() => { const p = document.querySelector('.mode-page'); if (!p) return null; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); })()";
const SCALE = "(() => { const r = document.documentElement; return { attr: r.getAttribute('data-wz-chrome-scale'), k: r.style.getPropertyValue('--wz-chrome-k') || null }; })()";
const SPILL = (panel) => `(() => { const p = document.querySelector(${q(panel)}); if (!p) return null; const pr = p.getBoundingClientRect();
  return [...p.querySelectorAll('button, input, select, [role="tab"]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > pr.right + 1; }).length; })()`;
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
  ok(`K1 k only in Machina under the reorg: 1366 ${J(read[1366].scale)}, 1920 ${J(read[1920].scale)}, 2560 ${J(read[2560].scale)}; without the reorg ${J(plain)}`,
    read[1366].scale.attr === 'base' && read[1920].scale.attr === 'on' && near(parseFloat(read[1920].scale.k), 1.406, 0.001) && read[2560].scale.attr === 'on' && near(parseFloat(read[2560].scale.k), 1.874, 0.001) && !plain.attr && !plain.k,
    { s: SIZES.map(([w]) => read[w].scale), plain });
  const k2 = (R, k) => !!R.rail && near(R.rail.w, 84 * k, 1.5) && !!R.door && ratioOk(R.door.h, b.door && b.door.h, k);
  ok('K2 the rail is 84 x k px wide and its first door k times as tall as at 1366 (5%)', SIZES.every(([w]) => k2(read[w], WANT_K[w])), SIZES.map(([w]) => ({ w, rail: read[w].rail && read[w].rail.w, door: read[w].door && read[w].door.h })));
  ok('K3 the bar\'s BUILD tab is k times as tall as at 1366 (5%)', SIZES.every(([w]) => !!read[w].tab && ratioOk(read[w].tab.h, b.tab && b.tab.h, WANT_K[w])), SIZES.map(([w]) => ({ w, tab: read[w].tab && read[w].tab.h })));
  const k4 = (R, k) => !!R.front.tab && ratioOk(R.front.tab.h, b.front.tab && b.front.tab.h, k) && !!R.front.panel && (k === 1 || R.front.panel.w > b.front.panel.w + 1) && R.front.spill !== null && R.front.spill <= b.front.spill;
  ok('K4 the Front menu\'s tab is k times as tall as at 1366 (5%), the drawer is wider where the desk allows, and no more controls spill past its edge than at 1366',
    SIZES.every(([w]) => k4(read[w], WANT_K[w])), SIZES.map(([w]) => ({ w, ...read[w].front })));
  const k5 = (R, k) => !!R.back.tab && ratioOk(R.back.tab.h, b.back.tab && b.back.tab.h, k) && !!R.back.panel && !!R.back.stage && !!R.back.paper
    && (k === 1 || near(R.back.panel.w, Math.min(320 * k, R.back.stage.r - R.back.paper.r - 16), 3) || R.back.panel.w >= 320 * k - 3);
  ok('K5 the Back menu\'s tab is k times as tall as at 1366 (5%), and it opens 320 x k px wide where the desk allows', SIZES.every(([w]) => k5(read[w], WANT_K[w])),
    SIZES.map(([w]) => ({ w, tab: read[w].back.tab && read[w].back.tab.h, panel: read[w].back.panel && read[w].back.panel.w, desk: read[w].back.stage && read[w].back.paper ? read[w].back.stage.r - read[w].back.paper.r : null })));
  ok('K6 the Doc beside the page: its kind label is k times as tall as at 1366 (5%)', SIZES.every(([w]) => !!read[w].split.kind && ratioOk(read[w].split.kind.h, b.split.kind && b.split.kind.h, WANT_K[w])),
    SIZES.map(([w]) => ({ w, kind: read[w].split.kind && read[w].split.kind.h })));
  const big = read[2560];
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
const EXPECTED = 10;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-CHROME-SCALE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-CHROME-SCALE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
