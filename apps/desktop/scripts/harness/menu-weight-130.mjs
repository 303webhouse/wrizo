// #130 (Nick, Nov 24, Arbor at 2560: "we've overdone it with the heavy, bolded fonts in the menus/rails"). Fable, 11:31 am, RULED, one type pass
// with #126: menu and rail text is regular weight (400); section labels (FONT, FORMAT, ACTIONS and the like) keep their caps style at no more than
// 500; bold (600+) only on the one current item (the active Doc, the chosen option). "Paragraph", "More", drawer and asset names, rail labels and
// buttons are all regular. Each theme keeps its own typefaces. Arbor and Machina (Flux is read and printed, information only).
//
// Each theme as it is LIVE (no pin), the same fixture as menu-cap-126.mjs through the app's seams, her first Part open, Page: Dark, at 1366x768,
// 1920x1080 and 2560x1440. Every visible text in the rail, the top bar, the Front menu (each tab) and the Back menu (each tab) is read with its
// computed font-weight and what it is:
//   CURRENT  the item is marked current - it or an ancestor up to its control carries aria-selected / aria-current / aria-pressed / aria-checked
//            "true", or a current class (active, is-active, is-current, is-selected, selected) - may be any weight
//   LABEL    a section label: drawn in capitals (text-transform uppercase / small-caps, or its own text has letters and none lower-case) - at most 500
//   TEXT     everything else - at most 400
// CHECKS   H-<theme> (machina, plateau = Arbor) no TEXT over 400 and no LABEL over 500, at 1366, 1920 and 2560; the offenders print by class
//          P1 each theme stood where it claims, its Front and Back menus opened, and rail, bar, front and back were each read (a reading of nothing fails)
//          MUT-H a reading with one regular rail label set to 700 turns H's test red (LANDED: the reading changed)
//          INFO the weights in Flux (the ruling names Arbor and Machina; printed so the Wrizors can see it)
//
// Run: node apps/desktop/scripts/harness/menu-weight-130.mjs   (Actions, or a box turn)
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
const SIZES = [[1366, 768], [1920, 1080], [2560, 1440]];
const THEMES = ['machina', 'plateau', 'flux'];
const RULED = ['machina', 'plateau'];
const LINES = Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. The rain had not stopped for three days, and the river was up past the second step of the mill.`);

const READ = (tab) => `(() => {
  const skip = (e) => !!e.closest('.mode-page, .forward-only-editor, .wz-splash, .wz-split-asset');
  const region = (e) => e.closest('.desk-frame-strip') ? 'rail' : e.closest('.chrome-top') ? 'bar' : e.closest('.wz-sliver') ? 'front' : e.closest('.wz-tutor-panel, .wz-tutor') ? 'back' : null;
  const CUR = /(^|\\s)(active|is-active|is-current|is-selected|selected|is-on|current)(\\s|$)/;
  const current = (e) => { for (let a = e, i = 0; a && i < 6; a = a.parentElement, i += 1) {
      if (['aria-selected', 'aria-current', 'aria-pressed', 'aria-checked'].some((k) => { const v = a.getAttribute(k); return v && v !== 'false'; })) return true;
      if (CUR.test(a.getAttribute('class') || '')) return true;
      if (a.matches('button, a, [role="tab"], [role="option"], [role="menuitem"], li')) break; }
    return false; };
  const out = []; const seen = new Map();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode; const s = (t.textContent || '').replace(/\\s+/g, ' ').trim(); if (!s || !/\\p{L}/u.test(s)) continue;
    const e = t.parentElement; if (!e || skip(e)) continue;
    const reg = region(e); if (!reg) continue;
    const cs = getComputedStyle(e); if (cs.visibility !== 'visible' || cs.display === 'none') continue;
    let op = 1; for (let a = e; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity) || 0; if (op < 0.05) continue;
    const rg = document.createRange(); rg.selectNodeContents(t); const rs = rg.getClientRects(); if (!rs.length) continue;
    const r0 = rs[0]; if (r0.width < 2 || r0.height < 2 || r0.right <= 0 || r0.bottom <= 0 || r0.left >= innerWidth || r0.top >= innerHeight) continue;
    const caps = cs.textTransform === 'uppercase' || /small-caps|all-small-caps/.test(cs.fontVariantCaps || '') || /small-caps/.test(cs.fontVariant || '') || (/\\p{Lu}/u.test(s) && !/\\p{Ll}/u.test(s));
    const kind = current(e) ? 'CURRENT' : caps ? 'LABEL' : 'TEXT';
    const cls = e.tagName.toLowerCase() + '.' + ((e.getAttribute('class') || '').split(/\\s+/)[0] || '');
    const base = ${q(tab)} + '|' + reg + '|' + cls + '|' + s.slice(0, 30);
    const n = (seen.get(base) || 0) + 1; seen.set(base, n);
    out.push({ key: base + '#' + n, reg, cls, text: s.slice(0, 30), kind, wt: parseInt(cs.fontWeight, 10), font: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() });
  }
  return out;
})()`;
const OPEN = (root) => `document.querySelector(${q(root)})?.getAttribute('data-open') === 'true'`;
const DRAWERS = { front: { grip: '.wz-sliver-grip', root: '.wz-sliver', tabs: '.wz-sliver [role="tab"]' }, back: { grip: '.wz-tutor-grip', root: '.wz-tutor-panel', tabs: '.wz-tutor-panel [role="tab"]' } };

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 }).catch(() => {});
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* P1 records what follows */ }
  await app.waitFor('!!window.wrizoCreateJournalPage && !!window.wrizoCreateProject', { label: 'the seams', timeout: 20000 });
  await app.evalJs(`(() => { const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    page('mw-1', ${q(['Chapter One', ...LINES].join('\n'))}, { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('mw-2', 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('mw-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page('mw-n', 'Research notes\\nMill wheels turn at about twelve turns a minute.', { origin: 'loose' });
    W.wrizoFlushNow(); return true; })()`);
  await app.waitFor('!!window.wrizoTheme && !!window.wrizoThemePrefs', { label: 'the theme seams', timeout: 20000 });
}
async function visit(app, theme, w, h) {
  await app.evalJs(`window.wrizoTheme.set(${q(theme)}); window.wrizoThemePrefs.set({ page: 'dark' }); null`);
  await sleep(300);
  await app.emulateDpr(1, w, h);
  await app.evalJs("history.replaceState(null, '', '/#/page/mw-1'); null");
  await app.reload();
  await app.waitFor(`!!document.querySelector('.forward-only-editor') && document.documentElement.getAttribute('data-theme') === ${q(theme)}`, { label: `${theme} at ${w}`, timeout: 20000 }).catch(() => {});
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* P1 records it */ }
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await sleep(1200);
}
async function setDrawer(app, d, want) {
  if ((await app.evalJs(OPEN(d.root))) !== want) await app.evalJs(`document.querySelector(${q(d.grip)})?.click(); null`);
  try { await app.waitFor(want ? OPEN(d.root) : `!(${OPEN(d.root)})`, { label: `${d.root} ${want ? 'open' : 'closed'}`, timeout: 5000 }); } catch { /* P1 records it */ }
  await sleep(700);
  return app.evalJs(OPEN(d.root));
}
async function readDrawer(app, name, d, R) {
  R.opened[name] = !!(await setDrawer(app, d, true));
  const tabs = R.opened[name] ? await app.evalJs(`[...document.querySelectorAll(${q(d.tabs)})].filter((t) => t.getBoundingClientRect().width > 0).map((t) => (t.textContent || '').replace(/\\s+/g, ' ').trim())`) : [];
  for (const name2 of tabs) {
    // select by NAME, never by index
    await app.evalJs(`(() => { const t = [...document.querySelectorAll(${q(d.tabs)})].find((x) => (x.textContent || '').replace(/\\s+/g, ' ').trim() === ${q(name2)}); if (t) t.click(); return !!t; })()`);
    await sleep(600);
    R.items.push(...(await app.evalJs(READ(`${name}:${name2}`))).filter((x) => x.reg === name));
  }
  if (!tabs.length && R.opened[name]) R.items.push(...(await app.evalJs(READ(`${name}:-`))).filter((x) => x.reg === name));
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
        const R = { items: [], opened: {}, theme: await app.evalJs("document.documentElement.getAttribute('data-theme')") };
        R.items.push(...(await app.evalJs(READ('rest'))).filter((x) => x.reg === 'rail' || x.reg === 'bar'));
        await readDrawer(app, 'front', DRAWERS.front, R);
        await readDrawer(app, 'back', DRAWERS.back, R);
        read[theme][w] = R;
        const by = (k) => R.items.filter((x) => x.kind === k).length;
        console.log(`MENU-WEIGHT READ ${theme} ${w}: ${R.items.length} texts (rail ${R.items.filter((x) => x.reg === 'rail').length}, bar ${R.items.filter((x) => x.reg === 'bar').length}, front ${R.items.filter((x) => x.reg === 'front').length}, back ${R.items.filter((x) => x.reg === 'back').length}; TEXT ${by('TEXT')}, LABEL ${by('LABEL')}, CURRENT ${by('CURRENT')}); opened ${q(R.opened)}`);
      }
    }
  });
} catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const heavy = (x) => (x.kind === 'TEXT' && x.wt > 400) || (x.kind === 'LABEL' && x.wt > 500);
const hOk = (items) => items.length > 0 && !items.some(heavy);
// the offenders, grouped by class and kind (one line each: the weight, the font, where, and a sample of the words)
const groups = (items) => { const m = new Map(); for (const x of items.filter(heavy)) { const k = `${x.reg} ${x.cls} ${x.kind} ${x.wt} ${x.font}`; const g = m.get(k) || { n: 0, sample: [] }; g.n += 1; if (g.sample.length < 4 && !g.sample.includes(x.text)) g.sample.push(x.text); m.set(k, g); } return [...m].map(([k, g]) => `${k} x${g.n} [${g.sample.join(' | ')}]`); };
const cells = THEMES.flatMap((t) => SIZES.map(([w]) => ({ t, w, R: read[t] && read[t][w] })));
const p1bad = cells.filter(({ t, R }) => !(R && R.theme === t && R.opened.front && R.opened.back && ['rail', 'bar', 'front', 'back'].every((g) => R.items.some((x) => x.reg === g))));
ok(`P1 each theme stood where it claims, its Front and Back menus opened, and rail, bar, front and back were each read, at 1366, 1920 and 2560: ${cells.length - p1bad.length}/${cells.length}`, p1bad.length === 0,
  p1bad.map(({ t, w, R }) => ({ t, w, theme: R && R.theme, opened: R && R.opened, regions: R ? ['rail', 'bar', 'front', 'back'].map((g) => `${g}:${R.items.filter((x) => x.reg === g).length}`).join(' ') : null })));
for (const t of RULED) {
  const all = SIZES.flatMap(([w]) => (read[t] && read[t][w] ? read[t][w].items : []));
  const bad = all.filter(heavy);
  ok(`H-${t} menu and rail text is regular (TEXT at most 400, section LABELs at most 500, 600+ only on the CURRENT item) at 1366, 1920 and 2560: ${bad.length} too heavy of ${all.length} read`, hOk(all), groups(all));
}
{
  const R = read.plateau && read.plateau[1366];
  const pick = R && R.items.find((x) => x.reg === 'rail' && x.kind === 'TEXT' && !heavy(x));
  const mut = pick ? R.items.map((x) => (x.key === pick.key ? { ...x, wt: 700 } : x)) : null;
  ok(`MUT-H a reading with one regular rail label set to 700 turns H's test red (${pick ? pick.key : 'no regular rail label to plant on'})`, !!mut && mut.find((x) => x.key === pick.key).wt !== pick.wt && !hOk(mut), pick && { was: pick.wt, now: 700 });
}
{
  const all = SIZES.flatMap(([w]) => (read.flux && read.flux[w] ? read.flux[w].items : []));
  ok(`INFO Flux (not in the ruling): ${all.filter(heavy).length} would be too heavy of ${all.length} read: ${groups(all).slice(0, 12).join(' ; ')}`, true);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 3000)}`);
const EXPECTED = 5;   // P1, H x2, MUT-H, INFO
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nMENU-WEIGHT-130 VERIFY: PASS (${checks.length} checks)`
  : `\nMENU-WEIGHT-130 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
