// THE REORG'S BACK MENU IN ARBOR, IN THE APP (Fable, Nov 21, 4:58 pm; claude/wrizors/arbor-reorg-spec.md section 5). The live Arbor (plateau, the redesign on by default), ?reorg=1 with the PREVIEW DOOR (&reorglift=plateau.back: reorg/themeGate.ts keeps plateau.back OFF in the table until
// Fable clears it; the door only shows the piece). The stylesheet's half is reorg-arbor-back-css-unit.mjs, the Tutor.tsx sites' reorg-arbor-back-sites-unit.mjs; this proves what only the app can.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": two pages -> two Sections, ab-1 "Arrival" (its Plan is the canvas ab-own: three cards, one attached to it), ab-2 "The town"; the Page's own grafts: a page and a card.
//   AB1  the tab row reads PLAN, GRAFTS, TUTOR, in that order, and the drawer opens on GRAFTS (the Back menu opens on its grafts tab, as Machina's does)
//   AB2  the cloths: PLAN madder (#A8392F), GRAFTS cold blue (#7FA0BC), TUTOR olive (#56632E); the open tab comes forward and the drawer's edge takes its cloth (--arbor2-chosen-r)
//   AB3  the search door heads each tab in the drawer's own field style: 1 px, --arbor-line; and nothing is left raw (the sort row, the group heads and the "+" are drawn in Arbor's dress, no browser-grey fill or border)
//   AB4  Arbor's words show: "→ Section", "Grafts", "This Page"; the box's placeholder reads Arbor's
//   AB5  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after opening the Back menu and moving through its three tabs; the editor is the same node
//   AB6  Free Write: PLAN and GRAFTS are locked and the note reads "In Free Write the Tutor only offers prompts."; only TUTOR is in use
//   AB7  Publish (top and uplink lifted through the door too): three tabs, none called Before you publish; "Before you publish" stands at the head of TUTOR
//   AB8  OFF: without the door Arbor's own drawer stands (TUTOR | GRAFTS | BOARD, no Plan tab); with ?arbor2=0 (the classic Plateau) even the door gives no Back menu
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-arbor-back-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const link = (id, boxId, toEntry) => ({ id, aEntryId: 'ab-own', aBoxId: boxId, bEntryId: toEntry, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' });
const TABS = "(() => { const all = [...document.querySelectorAll('[id^=\"wz-tutor-tab-\"]')]; if (all.length === 0) return null; return all.map((b) => ({ id: b.id.replace('wz-tutor-tab-', ''), text: (b.textContent || '').trim(), on: b.getAttribute('data-on') === 'true', locked: b.getAttribute('data-locked') === 'true' })); })()";
const CS = (sel, props, pseudo) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; const c = getComputedStyle(e${pseudo ? ', ' + q(pseudo) : ''}); return ${q(props)}.reduce((o, p) => { o[p] = c.getPropertyValue(p); return o; }, {}); })()`;

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('ab-own', 'Plan canvas', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'The opening image', 0, 0.05), card('c2', 'The turn', 1, 0.2), card('c3', 'The close', 2, 0.35)])} });
    page('ab-note', 'Field notes\\nThe rain came late.', { origin: 'loose' });
    page('ab-1', 'The harbour was quiet when she arrived.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('ab-2', 'By the second week the town had decided what she was.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    W.wrizoPatchEntry('ab-1', { pageSettings: ${PS}, name: 'Arrival', level: 0 }, planBoardId: 'ab-own' });
    W.wrizoPatchEntry('ab-2', { pageSettings: ${PS}, name: 'The town', level: 0 } });
    W.wrizoPatchEntry('ab-own', { pageLinks: ${q([link('l1', 'c1', 'ab-1')])} });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, { w = 1366, lift = 'plateau.back', arbor2 = true } = {}) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs("window.wrizoTheme.set('plateau'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1${arbor2 ? '' : '&arbor2=0'}${lift ? '&reorglift=' + lift : ''}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const drawer = async (app) => { if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); } };
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click(); null`); await sleep(500); };
const rgb = (id) => CS('#wz-tutor-tab-' + id, ['background-color', 'z-index']);

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'ab-1');
  await app.evalJs("(() => { const D = window.wrizoDocSettings; D.addAsset('ab-1', { entryId: 'ab-note' }); D.addAsset('ab-1', { entryId: 'ab-own', boxId: 'c2' }); window.wrizoFlushNow(); return null; })()");
  await sleep(500);
  await drawer(app);
  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__abMark = 1; " + PAGE);
  const tabs = await app.evalJs(TABS);
  ok('AB1 the tab row reads PLAN, GRAFTS, TUTOR, in that order, and the drawer opens on GRAFTS',
    Array.isArray(tabs) && tabs.map((x) => x.text.toUpperCase()).join(',') === 'PLAN,GRAFTS,TUTOR' && tabs.map((x) => x.id).join(',') === 'plan,links,tutor' && tabs.map((x) => x.on).join(',') === 'false,true,false', tabs);

  const cloth = {};
  for (const id of ['plan', 'links', 'tutor']) { await tab(app, id); cloth[id] = { tab: await app.evalJs(rgb(id)), edge: await app.evalJs("(() => { const s = document.querySelector('.desk-frame-stage'); return s ? getComputedStyle(s).getPropertyValue('--arbor2-chosen-r').trim() : null; })()") }; }
  const want = { plan: ['rgb(168, 57, 47)', '#A8392F'], links: ['rgb(127, 160, 188)', '#7FA0BC'], tutor: ['rgb(86, 99, 46)', '#56632E'] };
  const clothOk = Object.entries(want).every(([id, [bg, hex]]) => cloth[id].tab && cloth[id].tab['background-color'] === bg && String(cloth[id].edge).toUpperCase() === hex && cloth[id].tab['z-index'] === '3');
  ok('AB2 the cloths: PLAN madder, GRAFTS cold blue, TUTOR olive; the open tab comes forward (z-index 3) and the drawer\'s edge takes its cloth', clothOk, cloth);

  await tab(app, 'plan');
  const door = await app.evalJs(CS('.reorg-search-door', ['border-top-width', 'border-top-style', 'border-top-color']));
  const line = await app.evalJs("(() => { const e = document.querySelector('.reorg-search-door'); const probe = document.createElement('i'); probe.style.borderTop = '1px solid var(--arbor-line)'; e.appendChild(probe); const c = getComputedStyle(probe).borderTopColor; probe.remove(); return c; })()");
  await tab(app, 'links');
  const raw = await app.evalJs("(() => { const bad = []; const root = document.querySelector('.wz-tutor-panel'); for (const b of root.querySelectorAll('.wz-assets-sort > button, .wz-assets-add, .wz-back-part-head')) { const c = getComputedStyle(b); if (/^rgb\\((239|233|240), \\1, \\1\\)$/.test(c.backgroundColor) || c.borderTopColor === 'rgb(118, 118, 118)') bad.push(b.className || b.textContent.slice(0, 12)); } return { bad, sortBtns: root.querySelectorAll('.wz-assets-sort > button').length, heads: root.querySelectorAll('.wz-back-part-head').length }; })()");
  ok('AB3 the search door heads each tab in the drawer\'s own field style (1 px --arbor-line); nothing is left raw (sort row, group heads, "+")',
    !!door && door['border-top-width'] === '1px' && door['border-top-style'] === 'solid' && door['border-top-color'] === line && !!raw && raw.bad.length === 0 && raw.sortBtns === 4 && raw.heads >= 1, { door, line, raw });

  const words = await app.evalJs("(() => { const root = document.querySelector('.wz-tutor-panel'); const txt = (root.textContent || ''); return { grafts: /grafts/i.test(txt), thisPage: /this page/i.test(txt) }; })()");
  await tab(app, 'plan');
  const spine = await app.evalJs("(() => { const root = document.querySelector('.wz-tutor-panel'); return { toSection: [...root.querySelectorAll('button')].some((b) => /^\\u2192 Section$/.test((b.textContent || '').trim())), openSection: [...root.querySelectorAll('button')].some((b) => /^Open Section$/.test((b.textContent || '').trim())) }; })()");
  await tab(app, 'tutor');
  const ph = await app.evalJs("(() => { const i = [...document.querySelectorAll('.wz-tutor-panel textarea, .wz-tutor-panel input[placeholder]')].find((x) => (x.getAttribute('placeholder') || '') !== 'Search'); return i ? (i.getAttribute('placeholder') || '') : null; })()");
  ok('AB4 Arbor\'s words show: "→ Section", "Open Section", "Grafts", "This Page"; the lens box asks "Ask about this Page…"', !!words && words.grafts && words.thisPage && !!spine && spine.toSection && spine.openSection && ph === 'Ask about this Page…', { words, spine, ph });

  await tab(app, 'plan'); await tab(app, 'links'); await tab(app, 'tutor');
  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__abMark");
  const geo = { w1366: mark === after && same };
  await open(app, 'ab-1', { w: 1920 });
  await drawer(app);
  const m2 = await app.evalJs(PAGE);
  await tab(app, 'links'); await tab(app, 'tutor'); await tab(app, 'plan');
  geo.w1920 = m2 === (await app.evalJs(PAGE));
  ok('AB5 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after opening the Back menu and moving through its three tabs; the editor is the same node', geo.w1366 && geo.w1920, { geo, mark, after, m2 });

  await open(app, 'ab-1');
  const mode = await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*free write\\s*$/i.test(b.textContent || '')); if (!el) return false; el.click(); return true; })()");
  await sleep(900);
  await drawer(app);
  const free = await app.evalJs(TABS);
  const note = await app.evalJs("(() => { const n = document.querySelector('.wz-sprint-note, [data-sprint-note]'); return n ? (n.textContent || '').trim() : [...document.querySelectorAll('.wz-tutor-panel *')].map((e) => (e.children.length === 0 ? (e.textContent || '').trim() : '')).find((x) => /free write/i.test(x)) || null; })()");
  ok('AB6 Free Write: PLAN and GRAFTS are locked and the note reads "In Free Write the Tutor only offers prompts."; TUTOR is the one in use',
    mode === true && Array.isArray(free) && free.find((x) => x.id === 'plan')?.locked === true && free.find((x) => x.id === 'links')?.locked === true && free.find((x) => x.id === 'tutor')?.on === true && note === 'In Free Write the Tutor only offers prompts.', { mode, free, note });

  await open(app, 'ab-1', { lift: 'plateau.back,plateau.top,plateau.uplink' });
  await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sleep(700);
  await drawer(app); await tab(app, 'tutor');
  const pub = await app.evalJs("(() => { const all = [...document.querySelectorAll('[id^=\"wz-tutor-tab-\"]')]; const ids = all.length ? all.map((b) => b.id.replace('wz-tutor-tab-', '')) : null; const bx = document.querySelector('.wz-tutor-panel [data-back-export]'); const body = document.querySelector('.wz-tutor-panel .wz-drawer-body'); return { ids, bx: !!bx, first: !!bx && !!body && body.contains(bx) && body.firstElementChild !== null }; })()");
  ok('AB7 Publish: three tabs (no tab called Before you publish) and "Before you publish" stands at the head of TUTOR', !!pub && Array.isArray(pub.ids) && pub.ids.join(',') === 'plan,links,tutor' && pub.bx === true, pub);

  await open(app, 'ab-1', { lift: '' });
  await drawer(app);
  const off = await app.evalJs(TABS);
  await open(app, 'ab-1', { arbor2: false });
  await drawer(app);
  const classic = await app.evalJs("(() => { const all = [...document.querySelectorAll('[id^=\"wz-tutor-tab-\"]')]; return { tabs: all.length ? all.map((b) => b.id.replace('wz-tutor-tab-', '')) : null, reorg: !!document.querySelector('.reorg-search-door, .wz-back-assets'), arbor2: document.documentElement.hasAttribute('data-arbor2') }; })()");
  ok('AB8 OFF: without the door Arbor\'s own drawer stands (TUTOR | GRAFTS | BOARD, no Plan tab); with ?arbor2=0 even the door gives no Back menu',
    Array.isArray(off) && off.map((x) => x.id).join(',') === 'tutor,links,board' && !!classic && Array.isArray(classic.tabs) && !classic.tabs.includes('plan') && classic.reorg === false, { off, classic });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 8;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ARBOR-BACK-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ARBOR-BACK-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
