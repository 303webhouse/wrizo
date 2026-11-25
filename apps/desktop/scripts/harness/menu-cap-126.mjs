// #126 (live, Machina, Nick's 30" 4K screen): THE MENUS STOP GROWING AT THEIR 1920-WIDE SIZE. At 2560 wide, FONT, Selection, Whole document,
// the asset names and the rest of the menus overwhelmed the page. Fable, Nov 24 11:15 am, RULED: "the menus and rails stop growing at their
// 1920-wide size; the page keeps its own size rule. Measure Arbor and Flux at 2560 too, and fix the same way if they overgrow."
//
// Each theme as it is LIVE (Arbor's redesign, Machina's look, FLUX3, the reorg: no pin), the same fixture through the app's seams (a set "The Mill"
// in a Drawer with three Parts, a loose Doc), her first Part open, Page: Dark. The window is 1920x1080, then 2560x1440. At each size every visible
// piece of chrome text is read - at rest, then with the Front menu open on each of its tabs, then the Back menu on each of its tabs - as its
// RENDERED size: the computed font size times the zoom it is drawn at (Element.currentCSSZoom), and its first line box's height (a Range, which also
// sees a transform). The page's own words (the page, the editor, the splash) are not chrome and are not read.
//
// PREMISES  P0  the browser reports currentCSSZoom (else every size below is blind)
//           P1  each theme stood where it claims (data-theme), its Front and Back menus opened at both sizes, and every region was read at both
//               sizes (the counts print: a reading of nothing is a failure, not a pass)
// GROWTH    G-<theme>  (machina, plateau = Arbor, flux) no chrome text read at both sizes is drawn larger at 2560 than at 1920 (font x zoom
//               within 1% + 0.05 px; first line box within 1 px). The ten largest growths print.
// TRACKS    B-<theme>  the rail's width and the top bar's height are the same at 2560 as at 1920 (1 px)
// MUTANT    MUT-G  Machina's 2560 reading with one menu word a third larger (the old k, 1.874 / 1.406) turns G's test red (LANDED: the reading changed)
// INFO      the page's rect at 1920 and 2560 in each theme (the page keeps its own rule; information only)
//
// Run: node apps/desktop/scripts/harness/menu-cap-126.mjs   (Actions, or a box turn)
process.env.WS_MACHINA2 = 'default';
process.env.WS_ARBOR2 = 'default';
process.env.WS_FLUX3 = 'default';
process.env.WS_REORG = '1';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const SIZES = [[1920, 1080], [2560, 1440]];
const THEMES = ['machina', 'plateau', 'flux'];
const LINES = Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. The rain had not stopped for three days, and the river was up past the second step of the mill.`);

// every visible chrome text: region, a stable key, the drawn font size (font x zoom), the first line box's height
const READ = (tab) => `(() => {
  const skip = (e) => !!e.closest('.mode-page, .forward-only-editor, .wz-splash, .wz-split-asset');
  const region = (e) => e.closest('.desk-frame-strip') ? 'rail' : e.closest('.chrome-top') ? 'bar' : e.closest('.wz-sliver') ? 'front' : e.closest('.wz-tutor-panel, .wz-tutor') ? 'back' : 'other';
  const out = []; const seen = new Map(); let zoomless = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode; const s = (t.textContent || '').replace(/\\s+/g, ' ').trim(); if (!s) continue;
    const e = t.parentElement; if (!e || skip(e)) continue;
    const cs = getComputedStyle(e); if (cs.visibility !== 'visible' || cs.display === 'none') continue;
    let op = 1; for (let a = e; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity) || 0; if (op < 0.05) continue;
    const rg = document.createRange(); rg.selectNodeContents(t); const rs = rg.getClientRects(); if (!rs.length) continue;
    const r0 = rs[0]; if (r0.width < 2 || r0.height < 2 || r0.right <= 0 || r0.bottom <= 0 || r0.left >= innerWidth || r0.top >= innerHeight) continue;
    const z = typeof e.currentCSSZoom === 'number' ? e.currentCSSZoom : NaN; if (!Number.isFinite(z)) zoomless += 1;
    const reg = region(e);
    const base = ${q(tab)} + '|' + reg + '|' + e.tagName.toLowerCase() + '.' + ((e.getAttribute('class') || '').split(/\\s+/)[0] || '') + '|' + s.slice(0, 40);
    const n = (seen.get(base) || 0) + 1; seen.set(base, n);
    out.push({ key: base + '#' + n, reg, px: Math.round(parseFloat(cs.fontSize) * z * 100) / 100, lh: Math.round(r0.height * 100) / 100 });
  }
  return { out, zoomless };
})()`;
const BOXES = `(() => { const bx = (s) => { const e = [...document.querySelectorAll(s)].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; };
  const p = document.querySelector('.mode-page'); const pr = p ? p.getBoundingClientRect() : null;
  return { theme: document.documentElement.getAttribute('data-theme'), rail: bx('.desk-frame-strip'), bar: bx('.chrome-top'), page: pr ? [pr.left, pr.top, pr.width, pr.height].map((n) => Math.round(n)).join(',') : null }; })()`;
const OPEN = (root) => `document.querySelector(${q(root)})?.getAttribute('data-open') === 'true'`;
const DRAWERS = { front: { grip: '.wz-sliver-grip', root: '.wz-sliver', tabs: '.wz-sliver [role="tab"]' }, back: { grip: '.wz-tutor-grip', root: '.wz-tutor-panel', tabs: '.wz-tutor-panel [role="tab"]' } };

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 }).catch(() => {});
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the premises record what follows */ }
  await app.waitFor('!!window.wrizoCreateJournalPage && !!window.wrizoCreateProject', { label: 'the seams', timeout: 20000 });
  await app.evalJs(`(() => { const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    page('mc-1', ${q(['Chapter One', ...LINES].join('\n'))}, { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('mc-2', 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('mc-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page('mc-n', 'Research notes\\nMill wheels turn at about twelve turns a minute.', { origin: 'loose' });
    W.wrizoFlushNow(); return true; })()`);
  await app.waitFor('!!window.wrizoTheme && !!window.wrizoThemePrefs', { label: 'the theme seams', timeout: 20000 });
}
async function visit(app, theme, w, h) {
  await app.evalJs(`window.wrizoTheme.set(${q(theme)}); window.wrizoThemePrefs.set({ page: 'dark' }); null`);
  await sleep(300);
  await app.emulateDpr(1, w, h);
  await app.evalJs("history.replaceState(null, '', '/#/page/mc-1'); null");
  await app.reload();
  await app.waitFor(`!!document.querySelector('.forward-only-editor') && document.documentElement.getAttribute('data-theme') === ${q(theme)}`, { label: `${theme} at ${w}`, timeout: 20000 }).catch(() => {});
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* P1 records it */ }
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await sleep(1200);
}
async function setDrawer(app, d, want) {
  const is = await app.evalJs(OPEN(d.root));
  if (is !== want) await app.evalJs(`document.querySelector(${q(d.grip)})?.click(); null`);
  try { await app.waitFor(want ? OPEN(d.root) : `!(${OPEN(d.root)})`, { label: `${d.root} ${want ? 'open' : 'closed'}`, timeout: 5000 }); } catch { /* P1 records it */ }
  await sleep(700);
  return app.evalJs(OPEN(d.root));
}
async function readDrawer(app, name, d, R) {
  const opened = await setDrawer(app, d, true);
  R.opened[name] = !!opened;
  const tabs = opened ? await app.evalJs(`[...document.querySelectorAll(${q(d.tabs)})].filter((t) => t.getBoundingClientRect().width > 0).map((t) => (t.textContent || '').replace(/\\s+/g, ' ').trim())`) : [];
  R.tabs[name] = tabs;
  for (let i = 0; i < tabs.length; i += 1) {
    // select by NAME, never by index (memory: harness-select-by-name-not-index)
    await app.evalJs(`(() => { const t = [...document.querySelectorAll(${q(d.tabs)})].find((x) => (x.textContent || '').replace(/\\s+/g, ' ').trim() === ${q(tabs[i])}); if (t) t.click(); return !!t; })()`);
    await sleep(600);
    const r = await app.evalJs(READ(`${name}:${tabs[i]}`));
    R.zoomless += r.zoomless; R.items.push(...r.out.filter((x) => x.reg === name || x.reg === 'other'));
  }
  if (!tabs.length && opened) { const r = await app.evalJs(READ(`${name}:-`)); R.zoomless += r.zoomless; R.items.push(...r.out.filter((x) => x.reg === name)); }
  await setDrawer(app, d, false);
}

const read = {};
try {
  await withHarness(async (app) => {
    await seed(app);
    for (const theme of THEMES) {
      read[theme] = {};
      for (const [w, h] of SIZES) {
        await visit(app, theme, w, h);
        const R = { items: [], zoomless: 0, opened: {}, tabs: {} };
        R.boxes = await app.evalJs(BOXES);
        const rest = await app.evalJs(READ('rest'));
        R.zoomless += rest.zoomless; R.items.push(...rest.out);
        await readDrawer(app, 'front', DRAWERS.front, R);
        await readDrawer(app, 'back', DRAWERS.back, R);
        read[theme][w] = R;
        console.log(`MENU-CAP READ ${theme} ${w}: ${R.items.length} texts (rail ${R.items.filter((x) => x.reg === 'rail').length}, bar ${R.items.filter((x) => x.reg === 'bar').length}, front ${R.items.filter((x) => x.reg === 'front').length}, back ${R.items.filter((x) => x.reg === 'back').length}, other ${R.items.filter((x) => x.reg === 'other').length}); opened ${JSON.stringify(R.opened)}; tabs ${JSON.stringify(R.tabs)}; boxes ${JSON.stringify(R.boxes)}`);
      }
    }
  });
} catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

// ---- the verdicts (pure: the same function judges the reading and the mutant)
const grows = (a, b) => {
  const A = new Map((a?.items || []).map((x) => [x.key, x]));
  const both = (b?.items || []).filter((x) => A.has(x.key));
  const g = both.map((x) => ({ key: x.key, px: [A.get(x.key).px, x.px], lh: [A.get(x.key).lh, x.lh] }))
    .filter((x) => !(Number.isFinite(x.px[0]) && Number.isFinite(x.px[1])) || x.px[1] > x.px[0] * 1.01 + 0.05 || x.lh[1] > x.lh[0] + 1);
  return { matched: both.length, grown: g };
};
const gOk = (a, b) => { const r = grows(a, b); return r.matched >= 20 && r.grown.length === 0; };
const has = (R) => !!R && ['rail', 'bar', 'front', 'back'].every((reg) => R.items.some((x) => x.reg === reg));
const zl = THEMES.reduce((n, t) => n + SIZES.reduce((m, [w]) => m + ((read[t] && read[t][w] && read[t][w].zoomless) || 0), 0), 0);
const anyRead = THEMES.some((t) => read[t] && read[t][1920] && read[t][1920].items.length);
ok(`P0 the browser reports currentCSSZoom (texts without it: ${zl})`, anyRead && zl === 0, { zoomless: zl });
const placed = THEMES.flatMap((t) => SIZES.map(([w]) => ({ t, w, R: read[t] && read[t][w] })));
const bad = placed.filter(({ t, R }) => !(R && R.boxes && R.boxes.theme === t && R.opened.front && R.opened.back && has(R)));
ok(`P1 each theme stood where it claims, its Front and Back menus opened, and rail, bar, front and back were each read, at 1920 and 2560: ${placed.length - bad.length}/${placed.length}`, bad.length === 0,
  bad.map(({ t, w, R }) => ({ t, w, theme: R && R.boxes && R.boxes.theme, opened: R && R.opened, regions: R ? ['rail', 'bar', 'front', 'back'].map((g) => `${g}:${R.items.filter((x) => x.reg === g).length}`).join(' ') : null })));
for (const t of THEMES) {
  const a = read[t] && read[t][1920], b = read[t] && read[t][2560];
  const r = grows(a, b);
  const top = r.grown.slice().sort((x, y) => (y.px[1] / y.px[0]) - (x.px[1] / x.px[0])).slice(0, 10);
  ok(`G-${t} no chrome text is drawn larger at 2560 than at 1920 (font x zoom within 1% + 0.05 px, line box within 1 px): ${r.grown.length} grown of ${r.matched} read at both sizes`, gOk(a, b), top);
  const bx = (R, k, f) => R && R.boxes && R.boxes[k] ? R.boxes[k][f] : NaN;
  const same = (x, y) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 1;
  ok(`B-${t} the rail's width (${bx(a, 'rail', 'w')} -> ${bx(b, 'rail', 'w')}) and the top bar's height (${bx(a, 'bar', 'h')} -> ${bx(b, 'bar', 'h')}) are the same at 2560 as at 1920 (1 px)`,
    same(bx(a, 'rail', 'w'), bx(b, 'rail', 'w')) && same(bx(a, 'bar', 'h'), bx(b, 'bar', 'h')), { 1920: a && a.boxes, 2560: b && b.boxes });
}
{
  const a = read.machina && read.machina[1920], b = read.machina && read.machina[2560];
  const pick = b && b.items.find((x) => (x.reg === 'front' || x.reg === 'back') && a && a.items.some((y) => y.key === x.key));
  const mut = pick ? { ...b, items: b.items.map((x) => (x.key === pick.key ? { ...x, px: Math.round(x.px * (1.874 / 1.406) * 100) / 100, lh: Math.round(x.lh * (1.874 / 1.406) * 100) / 100 } : x)) } : null;
  const landed = !!mut && mut.items.find((x) => x.key === pick.key).px !== pick.px;
  ok(`MUT-G Machina's 2560 reading with one menu word a third larger turns G's test red (${pick ? pick.key : 'no word to plant on'})`, landed && !gOk(a, mut), pick && { was: pick.px, now: mut.items.find((x) => x.key === pick.key).px });
}
ok(`INFO the page's rect (left,top,width,height) at 1920 -> 2560: ${THEMES.map((t) => `${t} ${read[t]?.[1920]?.boxes?.page} -> ${read[t]?.[2560]?.boxes?.page}`).join(' | ')} (information; the page keeps its own rule)`, true);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 10;   // P0, P1, G x3, B x3, MUT-G, INFO
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nMENU-CAP-126 VERIFY: PASS (${checks.length} checks)`
  : `\nMENU-CAP-126 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
