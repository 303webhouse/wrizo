// THE REORG'S FRONT MENU: its frame and the Parts list, read-only (POLISH; Fable's GO Nov 19 4:20 pm: plan steps 3.1 and 3.2, built to Cursor's
// prototype's frontMenu, docs/mockups/reorg/app.js, tabs TEXT · INK · PARTS). Machina only, behind ?reorg=1.
//
// Today's Tools drawer (the Sliver) is the Front menu. Its sections are regrouped, never added to or lost (reorg/frontTabs.ts reads
// store/drawerSet.ts): TEXT is today's text sections with Page setup moved in at its foot (from the rail's Pages pop-out, which the reorg's
// rail no longer has), INK is today's ink (Free Write with an instrument), PARTS is the Parts list (reorg/PartsList.tsx, on INK's seam
// reorg/partsSeam.ts). A Board keeps today's drawer. Switch off, or any other theme: the drawer is unchanged.
//
// The fixture is reorg-top-rail.mjs's (seeded through the app's own seams; WS_PLACE=1):
//   Grants / Budget, a set she made: three pages (Budget one, two, three) and a board; Top Drawer's app-made set: a page (a one-Part Doc) and
//   a screenplay; a loose page (Free Write, Unfiled)
//
// OFF   O0  the golden of main's switch-off drawer, open, is committed beside this file (reorg-front-menu-off-golden.json, captured by
//           reorg-front-menu-capture.mjs on main + this file), with the tree it came from
//       O1  [theme x surface] switch OFF, Arbor, Flux and Machina, open on a Draft Part, a Free Write page, a screenplay and a Board: the drawer
//           is main's DOM exactly
//       O2  [theme x surface] switch ON in Arbor and Flux: the same; and ON in Machina on a Board (a Board keeps today's drawer)
// FRAME F1  a Draft Part: the tabs read TEXT · PARTS (no INK: Draft has no instrument), TEXT selected
//       F2  a Free Write page: TEXT · INK · PARTS; INK IS the instrument (picking it puts the page in ink, leaving it puts it back in text)
//       F3  [Draft Part, Free Write page, screenplay] TEXT holds exactly the sections the switch-off drawer holds on that surface, in order, then
//           Page setup at the foot (nothing added but Page setup, nothing lost)
//       F4  Page setup in the Front menu is today's zone and today's act: choosing Narrow margins writes that page's pageSettings.margins and
//           nothing else stored (its name, if any, kept)
// PARTS P1  on Budget two: PARTS lists Budget one, two, three in her order, each with its number and its words, Budget two marked as where she is
//       P2  a row opens that Part (the route is its page) and the list there marks it; nothing is stored by browsing
//       P3  a one-Part Doc lists one row, "Part 1", with its words
//       P4  the list follows a rename made in the top rail (the Part's stored name)
// PAGE  G1  [1366, 1920, 2000] the page's rect is the same with the Front menu closed and open on each tab; the editor is the same node
// WORDS W1  every word the Front menu adds comes from the lexicon
//
// CAPTURE (REORG_FRONT_MODE=capture, through reorg-front-menu-capture.mjs): prints main's switch-off drawer, one GOLDEN line per surface.
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-front-menu.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const GOLDEN_FILE = path.join(HERE, 'reorg-front-menu-off-golden.json');
const CAPTURE = process.env.REORG_FRONT_MODE === 'capture';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const THEMES = ['plateau', 'flux', 'machina'];
const SURFACES = { draft: 'tr-g-2', freewrite: 'tr-l-1', script: 'tr-top-s', board: 'tr-g-b' };

const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const COLLECTIONS = "(() => { const out = {}; for (const k of ['writer-studio-projects', 'writer-studio-story-plans', 'writer-studio-sessions', 'writer-studio-drafts', 'writer-studio-journal-entries', 'writer-studio-drawers']) { if (localStorage.getItem(k) == null) continue; try { out[k] = JSON.parse(localStorage.getItem(k)); } catch { out[k] = localStorage.getItem(k); } } return out; })()";
function diffStores(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k], y = b[k];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (!Array.isArray(x) || !Array.isArray(y)) { out.push([k, '*', ['(whole value)']]); continue; }
    const mx = new Map(x.map((r) => [r && r.id, r])), my = new Map(y.map((r) => [r && r.id, r]));
    for (const id of new Set([...mx.keys(), ...my.keys()])) {
      const r1 = mx.get(id), r2 = my.get(id);
      if (JSON.stringify(r1) === JSON.stringify(r2)) continue;
      if (!r1 || !r2) { out.push([k, id, [r1 ? '(removed)' : '(added)']]); continue; }
      out.push([k, id, [...new Set([...Object.keys(r1), ...Object.keys(r2)])].filter((kk) => JSON.stringify(r1[kk]) !== JSON.stringify(r2[kk]))]);
    }
  }
  return out;
}

let ids = null;
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const top = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return { drawer: d.id, set: p && p.id }; })()");
  const made = await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const budget = W.wrizoCreateProject('Budget'); W.wrizoSetProjectDrawer(budget.id, grants.id);
    page('tr-top-1', 'Notes on the ledgers', { origin: 'project', projectId: ${q(top.set)}, orderIndex: 0 });
    W.wrizoCreateJournalPage({ id: 'tr-top-s', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: 'tr-top-s-h', heading: { id: 'tr-top-s-h', t: 'scene', text: '' }, body: [] }] }, createdAt: '2026-04-01T00:00:02.000Z', origin: 'project', projectId: ${q(top.set)}, orderIndex: 1, source: null });
    page('tr-g-1', 'Budget one has four words', { origin: 'project', projectId: budget.id, orderIndex: 0 });
    page('tr-g-2', 'Budget two', { origin: 'project', projectId: budget.id, orderIndex: 1 });
    page('tr-g-3', 'Budget three is here', { origin: 'project', projectId: budget.id, orderIndex: 2 });
    page('tr-g-b', 'Budget board', { origin: 'project', projectId: budget.id, pageType: 'board', boxes: [] });
    page('tr-l-1', 'A loose page', { origin: 'loose' });
    W.wrizoFlushNow();
    return { grants: grants.id, budget: budget.id };
  })()`);
  ids = { topDrawer: top.drawer, topSet: top.set, ...made };
}

async function open(app, theme, reorg, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-sliver-grip') && !!document.querySelector('.desk-frame-strip')", { label: `the surface ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function openDrawer(app) {
  const already = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!already) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
  await app.waitFor("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", { label: 'the drawer open', timeout: 4000 }).catch(() => {});
  await sleep(600);
}
const NORM = () => `(() => { const ids = ${q(ids)}; return (h) => { let s = h || ''; for (const [k, v] of Object.entries(ids)) if (v) s = s.split(v).join('{' + k + '}'); const seen = new Map(); return s.replace(/:r[0-9a-z]+:/g, (m) => { if (!seen.has(m)) seen.set(m, ':useid' + (seen.size + 1) + ':'); return seen.get(m); }); }; })()`;
const DRAWER = () => `${NORM()}(document.querySelector('.wz-sliver')?.outerHTML ?? null)`;
const TABS = "[...document.querySelectorAll('.wz-sliver [role=\"tab\"]')].map((b) => ({ id: (b.id || '').replace('wz-sliver-tab-', ''), word: (b.textContent || '').trim(), on: b.getAttribute('aria-selected') === 'true' }))";
// the drawer's sections by their headings (the same reading in both switch states), and whether Page setup is there
const SECTIONS = "(() => { const body = document.querySelector('.wz-sliver .wz-sliver-body'); if (!body) return null; return [...body.querySelectorAll(':scope > .wz-sliver-section, :scope > div > .wz-sliver-section')].map((s) => (s.querySelector('.wz-sliver-h')?.textContent || s.className).trim()); })()";
const SETUP = "!!document.querySelector('.wz-sliver .wz-page-setup')";
const PARTS = "(() => { const l = document.querySelector('.wz-sliver [data-reorg-parts]'); if (!l) return null; return [...l.querySelectorAll('[data-part-row]')].map((b) => ({ id: b.getAttribute('data-part-row'), n: b.querySelector('.reorg-parts-num')?.textContent, name: b.querySelector('.reorg-parts-name')?.textContent, words: b.querySelector('.reorg-parts-words')?.textContent, here: b.getAttribute('aria-current') === 'true' })); })()";
const pick = (tab) => `document.querySelector('#wz-sliver-tab-${tab}')?.click(); null`;

await withHarness(async (app) => {
  await seed(app);
  if (CAPTURE) {
    for (const theme of THEMES) for (const [s, id] of Object.entries(SURFACES)) {
      await open(app, theme, false, id); await openDrawer(app);
      const h = await app.evalJs(DRAWER());
      const sec = await app.evalJs(SECTIONS);
      await open(app, theme, false, id); await openDrawer(app);
      const again = await app.evalJs(DRAWER());
      console.log(`GOLDEN ${theme}.${s} ${Buffer.from(h == null ? 'null' : h, 'utf8').toString('base64')}`);
      console.log(`SECTIONS ${theme}.${s} ${JSON.stringify(sec)}`);
      ok(`CAPTURE [${theme}.${s}]: two reads of main's switch-off drawer agree`, h === again && h != null);
    }
    return;
  }
  const golden = fs.existsSync(GOLDEN_FILE) ? JSON.parse(fs.readFileSync(GOLDEN_FILE, 'utf8')) : null;
  ok('O0: the golden of main\'s switch-off drawer is committed beside this file, with the tree it was captured from', !!golden && /^[0-9a-f]{40}$/.test(golden.capturedFrom || '') && !!golden.surfaces, GOLDEN_FILE);
  for (const theme of THEMES) for (const [s, id] of Object.entries(SURFACES)) {
    const want = golden && golden.surfaces[theme] && golden.surfaces[theme][s];
    await open(app, theme, false, id); await openDrawer(app);
    const h = await app.evalJs(DRAWER());
    ok(`O1 [${theme}.${s}]: switch OFF - the drawer is main's DOM exactly`, !!want && h === want, h === want ? '' : `got ${String(h).slice(0, 300)}`);
    if (theme !== 'machina' || s === 'board') {
      await open(app, theme, true, id); await openDrawer(app);
      const hOn = await app.evalJs(DRAWER());
      ok(`O2 [${theme}.${s}]: switch ON - still main's DOM exactly (${theme === 'machina' ? 'a Board keeps today\'s drawer' : 'the Front menu is Machina\'s alone'})`, !!want && hOn === want, hOn === want ? '' : `got ${String(hOn).slice(0, 300)}`);
    }
  }

  // ---- FRAME ---------------------------------------------------------------------------------------------------------------------------
  const offSections = {};
  for (const s of ['draft', 'freewrite', 'script']) { await open(app, 'machina', false, SURFACES[s]); await openDrawer(app); offSections[s] = await app.evalJs(SECTIONS); }
  await open(app, 'machina', true, 'tr-g-2'); await openDrawer(app);
  let tabs = await app.evalJs(TABS);
  ok('F1 a Draft Part: the tabs read TEXT · PARTS (no INK), TEXT selected', JSON.stringify(tabs.map((x) => x.id)) === '["text","parts"]' && tabs[0].on && !tabs[1].on, tabs);
  const onSections = {};
  onSections.draft = { sec: await app.evalJs(SECTIONS), setup: await app.evalJs(SETUP) };
  await open(app, 'machina', true, 'tr-l-1'); await openDrawer(app);
  tabs = await app.evalJs(TABS);
  onSections.freewrite = { sec: await app.evalJs(SECTIONS), setup: await app.evalJs(SETUP) };
  const inst0 = await app.evalJs("document.querySelector('.mode-page')?.getAttribute('data-instrument') ?? null");
  await app.evalJs(pick('ink')); await sleep(500);
  const inst1 = await app.evalJs("document.querySelector('.mode-page')?.getAttribute('data-instrument') ?? null");
  const tabsInk = await app.evalJs(TABS);
  await app.evalJs(pick('text')); await sleep(500);
  const inst2 = await app.evalJs("document.querySelector('.mode-page')?.getAttribute('data-instrument') ?? null");
  ok('F2 a Free Write page: TEXT · INK · PARTS; INK IS the instrument (picking it puts the page in ink, TEXT puts it back)',
    JSON.stringify(tabs.map((x) => x.id)) === '["text","ink","parts"]' && inst0 !== 'ink' && inst1 === 'ink' && tabsInk.find((x) => x.id === 'ink')?.on && inst2 !== 'ink', { tabs, inst0, inst1, inst2 });
  await open(app, 'machina', true, 'tr-top-s'); await openDrawer(app);
  onSections.script = { sec: await app.evalJs(SECTIONS), setup: await app.evalJs(SETUP) };
  ok('F3 [Draft Part, Free Write page, screenplay] TEXT holds exactly the switch-off drawer\'s sections, in order, then Page setup at its foot',
    ['draft', 'freewrite', 'script'].every((s) => Array.isArray(offSections[s]) && JSON.stringify(onSections[s].sec) === JSON.stringify(offSections[s]) && onSections[s].setup), { offSections, onSections });

  await open(app, 'machina', true, 'tr-g-2'); await openDrawer(app);
  const s0 = await app.evalJs(COLLECTIONS);
  const pressed = await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-sliver .wz-page-setup [role=\"radio\"]')].find((x) => /^narrow$/i.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true; })()");
  await sleep(500);
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null');
  await sleep(400);
  const s1 = await app.evalJs(COLLECTIONS);
  const d = diffStores(s0, s1);
  const e1 = (s1['writer-studio-journal-entries'] || []).find((e) => e.id === 'tr-g-2');
  ok('F4 Page setup in the Front menu is today\'s zone and act: Narrow writes that page\'s pageSettings.margins and nothing else stored',
    pressed && d.length === 1 && d[0][0] === 'writer-studio-journal-entries' && d[0][1] === 'tr-g-2' && d[0][2].every((k) => k === 'pageSettings' || k === 'updatedAt') && e1?.pageSettings?.margins === 'narrow', { pressed, d });

  // ---- PARTS ---------------------------------------------------------------------------------------------------------------------------
  await app.evalJs(pick('parts')); await sleep(400);
  let parts = await app.evalJs(PARTS);
  ok('P1 PARTS on Budget two: Budget one, two, three in her order, numbered, with their words, Budget two marked',
    !!parts && JSON.stringify(parts.map((p) => [p.n, p.name, p.here])) === JSON.stringify([['1', 'Budget one has four words', false], ['2', 'Budget two', true], ['3', 'Budget three is here', false]])
      && parts[0].words === '5 words' && parts[1].words === '2 words', parts);
  const b0 = await app.evalJs(COLLECTIONS);
  await app.evalJs("document.querySelector('[data-part-row=\"tr-g-3\"]')?.click(); null");
  await app.waitFor("location.hash === '#/page/tr-g-3' && !!document.querySelector('.forward-only-editor')", { label: 'Part 3', timeout: 8000 }).catch(() => {});
  await sleep(800);
  await openDrawer(app);
  await app.evalJs(pick('parts')); await sleep(400);
  const there = await app.evalJs(PARTS);
  const hash = await app.evalJs('location.hash');
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(300);
  const b1 = await app.evalJs(COLLECTIONS);
  ok('P2 a row opens that Part, and the list there marks it; nothing is stored by browsing', hash === '#/page/tr-g-3' && !!there && there[2]?.here && !there[1]?.here && diffStores(b0, b1).length === 0, { hash, there, d: diffStores(b0, b1) });

  await open(app, 'machina', true, 'tr-top-1'); await openDrawer(app);
  await app.evalJs(pick('parts')); await sleep(400);
  parts = await app.evalJs(PARTS);
  ok('P3 a one-Part Doc lists one row, "Part 1", with its words', !!parts && parts.length === 1 && parts[0].name === 'Part 1' && parts[0].here && parts[0].words === '4 words', parts);

  await open(app, 'machina', true, 'tr-g-2'); await openDrawer(app);
  await app.evalJs(pick('parts')); await sleep(300);
  await app.evalJs("document.querySelector('.reorg-top [data-top-name=\"part\"] button')?.click(); null"); await sleep(250);
  await app.evalJs(`(() => { const i = document.querySelector('.reorg-top input[data-top-rename="part"]'); if (!i) return null; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, 'The middle'); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return null; })()`);
  await sleep(600);
  parts = await app.evalJs(PARTS);
  ok('P4 the list follows a rename made in the top rail', !!parts && parts[1]?.name === 'The middle' && parts[1]?.here, parts);

  // ---- PAGE ----------------------------------------------------------------------------------------------------------------------------
  const geo = {};
  for (const w of [1366, 1920, 2000]) {
    await open(app, 'machina', true, 'tr-g-3', w);
    await app.evalJs("window.__fmEditor = document.querySelector('.forward-only-editor'); null");
    const closed = await app.evalJs(PAGE);
    await openDrawer(app);
    const text = await app.evalJs(PAGE);
    await app.evalJs(pick('parts')); await sleep(400);
    const partsTab = await app.evalJs(PAGE);
    const same = await app.evalJs("document.querySelector('.forward-only-editor') === window.__fmEditor");
    geo[w] = { closed, text, partsTab, same };
  }
  ok('G1 [1366, 1920, 2000] the page\'s rect is the same with the Front menu closed and open on each tab; the editor is the same node',
    Object.values(geo).every((g) => g.closed && g.closed === g.text && g.text === g.partsTab && g.same), geo);
});

if (!CAPTURE) {
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const read = (f) => (fs.existsSync(path.join(SRC, 'reorg', f)) ? fs.readFileSync(path.join(SRC, 'reorg', f), 'utf8') : '');
  const src = read('PartsList.tsx') + read('frontTabs.ts');
  const sliver = fs.readFileSync(path.join(SRC, 'components', 'Sliver.tsx'), 'utf8');
  const used = [...new Set([...src.matchAll(/\bt\('([a-zA-Z0-9]+)'\)/g), ...sliver.matchAll(/'(reorg[A-Za-z]+)'/g)].map((m) => m[1]))].filter((k) => /^reorg/.test(k));
  const missing = used.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon));
  const quoted = [...src.matchAll(/>\s*([A-Z][a-z]+(?: [a-z]+)+)\s*</g)].map((m) => m[1]);
  ok('W1 every word the Front menu adds is a lexicon key, and no sentence is written into its components', used.length >= 4 && missing.length === 0 && quoted.length === 0, { used, missing, quoted });
}

if (CAPTURE) {
  console.log(checks.map((c) => `${c.pass ? 'PASS' : 'FAIL'} ${c.name}`).join('\n'));
  console.log(`\nREORG-FRONT-MENU CAPTURE: ${checks.every((c) => c.pass) ? 'DONE' : 'UNSTABLE'}`);
  process.exit(0);
}
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 1 + THEMES.length * 4 + (2 * 4 + 1) + 4 + 4 + 1 + 1;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-FRONT-MENU VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-FRONT-MENU VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
