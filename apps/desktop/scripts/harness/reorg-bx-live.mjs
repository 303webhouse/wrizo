// BEFORE YOU EXPORT, IN THE APP (reorg-plan-v2, INK queue item 4; the stage menus, F4, and Nick's ruling Nov 20, 1:20 pm: "FINALIZE keeps the Back menu ... Before You Export (F4) stay where they were").
// Machina, ?reorg=1, a Page of a made Doc, the publishing view open (reorg-publish-live.mjs covers the sheet itself); the Back menu's tab row gains BEFORE YOU EXPORT only while the sheet is open.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": three pages -> one Doc of three Parts: bx-1 "Opening" (seventy lines, so the sheet scrolls), bx-2 with no words at all, bx-3 "Close".
//   BX1  the Back menu's tabs: with the sheet closed PLAN, ASSETS, FEEDBACK only; with it open the new tab joins them; closing the sheet takes the tab away and the drawer is not left on a tab that is gone
//   BX2  all three Parts ticked: no block; one line announces "1 Part with no words" (data-bx-note="emptyParts"), and it never disables an export button
//   BX3  pressing that line jumps the sheet to that Part (the Part comes into the sheet's own view; the sheet scrolls, nothing else does) and changes no word, tick or tab
//   BX4  unticking the empty Part takes the line away (an empty Part that is not going out is not announced); ticking it back brings it back
//   BX5  nothing ticked: the block line says so (data-bx-block="noneTicked"), the export and copy buttons are disabled, and the empty-Parts line is gone
//   BX6  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same with the Back menu on the new tab and after every press; the editor is the same node
//   BX7  QUIET: opening the tab, pressing a line and ticking store NOTHING: every entry's text, page settings and links are byte-identical, and no localStorage key is new
//   BX8  no tab outside the switch: with ?reorg off in Machina, and with it on in Plateau, no Before You Export tab; and every word it draws is a lexicon key
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-bx-live.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const ENTRIES = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).map((e) => [e.id, e.text ?? null, e.pageSettings ?? null, e.pageLinks ?? null, e.projectId ?? null, e.orderIndex ?? null])";
const KEYS = "Object.keys(localStorage).sort()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const TABS = "(() => { const row = document.querySelector('.wz-tutor-panel .wz-drawer-tabs'); if (!row) return null; return [...row.querySelectorAll('.wz-drawer-tab')].map((b) => b.id.replace('wz-tutor-tab-', '') + ':' + b.getAttribute('aria-selected')); })()";
const BX = "(() => { const b = document.querySelector('[data-back-export]'); if (!b) return null; const n = b.querySelector('[data-bx-note=\"emptyParts\"]'); const k = b.querySelector('[data-bx-block=\"noneTicked\"]'); return { note: n ? (n.textContent || '').trim() : null, noteIsButton: !!n && n.tagName === 'BUTTON', block: k ? (k.textContent || '').trim() : null }; })()";
const SHEET = "(() => { const s = document.querySelector('[data-reorg-pub]'); if (!s) return null; const sc = s.querySelector('[data-pub-scroll]'); const p = s.querySelector('[data-pub-part=\"bx-2\"]'); const sr = sc.getBoundingClientRect(), pr = p ? p.getBoundingClientRect() : null; const dis = (k) => !!s.querySelector('[data-pub-export=\"' + k + '\"]')?.disabled; return { scrollTop: Math.round(sc.scrollTop), canScroll: sc.scrollHeight > sc.clientHeight + 40, partInView: !!pr && pr.top >= sr.top - 2 && pr.bottom <= sr.bottom + 2, ticks: [...s.querySelectorAll('[data-pub-part]')].map((e) => e.getAttribute('data-pub-in')).join(','), mdOff: dis('md'), copyOff: !!s.querySelector('[data-pub-copy=\"text\"]')?.disabled }; })()";

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
    const long = Array.from({ length: 70 }, (_, i) => 'Line ' + (i + 1) + ' of the opening.').join('\\n');
    page('bx-1', long, { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('bx-2', '', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    page('bx-3', 'Closing words.', { origin: 'project', projectId: brief.id, orderIndex: 2 });
    W.wrizoPatchEntry('bx-1', { pageSettings: ${PS}, name: 'Opening', level: 0 } });
    W.wrizoPatchEntry('bx-2', { pageSettings: ${PS}, level: 0 } });
    W.wrizoPatchEntry('bx-3', { pageSettings: ${PS}, name: 'Close', level: 0 } });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, theme, reorg, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/bx-1')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-frame-host .sprint-nav') && !!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const sheet = async (app, on) => { await app.evalJs(on ? press('.reorg-top .desk-mode-tab[data-mode-key="publish"]') : press('[data-pub-back]')); await sleep(500); };
const drawer = async (app) => {
  if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
};
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click(); null`); await sleep(400); };

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'machina', true);
  await drawer(app);
  const t0 = await app.evalJs(TABS);
  await sheet(app, true);
  const t1 = await app.evalJs(TABS);
  await tab(app, 'export');
  const onTab = await app.evalJs(TABS);
  await sheet(app, false);
  const t2 = await app.evalJs(TABS);
  const names = (t) => (t || []).map((x) => x.split(':')[0]).join(',');
  ok('BX1 the Back menu\'s tabs: PLAN, ASSETS, FEEDBACK with the sheet closed; the new tab joins them while it is open; closing the sheet takes it away, and the drawer is not left on a tab that is gone',
    names(t0) === 'plan,links,tutor' && names(t1) === 'plan,links,tutor,export' && /export:true/.test((onTab || []).join(',')) && names(t2) === 'plan,links,tutor' && !/export/.test((t2 || []).join(',')) && (t2 || []).some((x) => /:true$/.test(x)), { t0, t1, onTab, t2 });

  // ---- the lines ---------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true);
  await sheet(app, true);
  await drawer(app);
  await tab(app, 'export');
  const k0 = await app.evalJs(KEYS), e0 = await app.evalJs(ENTRIES);
  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__bxMark = 1; " + PAGE);
  const lines = await app.evalJs(BX);
  const sh0 = await app.evalJs(SHEET);
  ok('BX2 all Parts ticked: no block; one line announces "1 Part with no words", and it never disables an export button',
    !!lines && lines.block === null && !!lines.note && /^1 Part with no words$/.test(lines.note) && lines.noteIsButton && !!sh0 && sh0.mdOff === false && sh0.copyOff === false && sh0.ticks === 'true,true,true', { lines, sh0 });

  ok('BX2b the sheet is long enough to scroll (the premise of BX3)', !!sh0 && sh0.canScroll && sh0.scrollTop === 0, sh0);
  await app.evalJs(press('[data-bx-note="emptyParts"]')); await sleep(500);
  const sh1 = await app.evalJs(SHEET);
  const stillTab = await app.evalJs(TABS);
  ok('BX3 pressing the line jumps the sheet to that Part: the Part comes into the sheet\'s own view, the sheet scrolls, and the ticks and the tab are as they were',
    !!sh1 && sh1.scrollTop > 0 && sh1.partInView && sh1.ticks === 'true,true,true' && /export:true/.test((stillTab || []).join(',')), { sh1, stillTab });

  await app.evalJs("document.querySelector('[data-pub-part=\"bx-2\"] input[type=checkbox]').click(); null"); await sleep(400);
  const out = await app.evalJs(BX);
  await app.evalJs("document.querySelector('[data-pub-part=\"bx-2\"] input[type=checkbox]').click(); null"); await sleep(400);
  const back = await app.evalJs(BX);
  ok('BX4 unticking the empty Part takes the line away; ticking it back brings it back',
    !!out && out.note === null && out.block === null && !!back && /^1 Part with no words$/.test(back.note || ''), { out, back });

  await app.evalJs("document.querySelector('[data-pub-none]').click(); null"); await sleep(400);
  const nothing = await app.evalJs(BX);
  const sh2 = await app.evalJs(SHEET);
  ok('BX5 nothing ticked: the block line says so, the export and copy buttons are disabled, and the empty-Parts line is gone',
    !!nothing && !!nothing.block && /ticked|tick/i.test(nothing.block) && nothing.note === null && !!sh2 && sh2.mdOff === true && sh2.copyOff === true, { nothing, sh2 });
  await app.evalJs("document.querySelector('[data-pub-all]').click(); null"); await sleep(300);

  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__bxMark");
  const geo = { w1366: mark === after && same };
  await open(app, 'machina', true, 1920);
  await sheet(app, true); await drawer(app); await tab(app, 'export');
  const m2 = await app.evalJs(PAGE);
  await app.evalJs(press('[data-bx-note="emptyParts"]')); await sleep(300);
  await app.evalJs("document.querySelector('[data-pub-none]').click(); null"); await sleep(300);
  await app.evalJs("document.querySelector('[data-pub-all]').click(); null"); await sleep(300);
  geo.w1920 = m2 === (await app.evalJs(PAGE));
  ok('BX6 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same with the Back menu on the new tab and after every press; the editor is the same node', geo.w1366 && geo.w1920, { geo, mark, after, m2 });

  const k1 = await app.evalJs(KEYS), e1 = await app.evalJs(ENTRIES);
  ok('BX7 QUIET: opening the tab, pressing a line and ticking store nothing: every entry\'s text, page settings and links are byte-identical, and no localStorage key is new',
    JSON.stringify(e0) === JSON.stringify(e1) && JSON.stringify(k0) === JSON.stringify(k1), { keysSame: JSON.stringify(k0) === JSON.stringify(k1), entriesSame: JSON.stringify(e0) === JSON.stringify(e1) });

  // ---- outside the switch ------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', false);
  await drawer(app);
  const offTabs = await app.evalJs(TABS);
  await open(app, 'plateau', true);
  await drawer(app);
  const plateauTabs = await app.evalJs(TABS);
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const chrome = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const comp = fs.readFileSync(path.join(SRC, 'reorg', 'BeforeExport.tsx'), 'utf8');
  const keys = [...comp.matchAll(/t\('(\w+)'\)/g)].map((m) => m[1]);
  const inTable = keys.length > 0 && keys.every((k) => terms.includes(`'${k}'`) && new RegExp(`\\b${k}:`).test(chrome));
  ok('BX8 no tab outside the switch (?reorg off in Machina; on in Plateau), and every word the component draws is a lexicon key',
    !/export/.test((offTabs || []).join(',')) && !/export/.test((plateauTabs || []).join(',')) && inTable, { offTabs, plateauTabs, keys });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 9;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-BX-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-BX-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
