// THE ASSETS "+" MENU, ITS SORTS AND DOC-LEVEL ASSETS (reorg-plan-v2 §3b item 1; machina-team-b-revisions.md 1F; Fable, Nov 20 11:45 pm and
// 11:55 pm: "BUILD each Part heading's '+' (New or Existing Board or Doc) and the sorts ... SAVE the sort as a reorg fact in users.prefs";
// Nick ruled A: "Doc-level assets YES. Home: the Doc's settings column (projects.doc_settings), key `assets` = [{entryId, boxId?, at}], read
// and written through INK's docSettings.ts; no migration. Dragging one into a Part makes the Part's link through graftTo". Import stays out.
// A Doc-level asset dragged into a Part STAYS in the Doc's list and also shows in the Part (1F: "where they also show").
// Machina, ?reorg=1.
//
// The fixture (seams only): a set "Novel" (drawer Fiction), Parts wa-1..wa-3, she is on wa-1. Boards wa-b1 "Beta board", wa-b2 "Alpha
// board". Three docs for the sorts, each in its own set in its own drawer: wa-dA "Alpha doc" (drawer Mid), wa-dB "Beta doc" (Ant), wa-dC
// "Gamma doc" (Zed); wa-1 links them B, C, A, a day apart. A loose doc wa-d3 "Middle doc" for the Doc's own list.
//
// MENU   M1  the Assets head carries a "+" for the whole Doc and her Part's head its own, each named for a screen reader; the menu reads
//            New Board, Existing Board, New Doc, Existing Doc, and nothing else (no Import)
// SORT   S1  wa-1's Docs sort oldest first by default (B, C, A: the order connected), A-Z (A, B, C), newest first (A, C, B) and by Project
//            (the drawer: Ant B, Mid A, Zed C)
//        S2  the sort is saved as a reorg fact in users.prefs (wrizoPrefs: assetsSort = { by }), and a reload keeps it
// PART   M2  Existing Board from her Part's "+": the picker lists boards only; a pick makes wa-1's own page link to it and its group is drawn
// DOC    M3  Existing Doc from the Doc's "+": the picker lists docs only; a pick writes the Doc's docSettings.assets = [{ entryId, at }] (no
//            other key), the Doc's list draws it, and "Assets (n)" counts it
// DRAG   M4  dragging the Doc-level row onto a Part in the Parts tab connects it there (graftTo, a page link of that Part), her own Part
//            included (not "already connected"); the asset stays in the Doc's list and in docSettings.assets
// NEW    M5  New Doc from a Part's "+" opens a new page (born on its first keystroke) with the way back to her page; born, it is that Part's
//            asset (its page link)
//        M6  New Board from the Doc's "+" opens a new board for the Doc, with the way back to her page
// PAGE   P1  the page's rects and editor node are the same across opening the menu, the picker and a pick
// WORDS  W1  every new word is a lexicon key used in the source
// DATA   D1  the Doc's assets are typed on DocSettings and written only through reorg/docSettings.ts, which touches no storage of its own
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-assets-plus.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';   // the Desk's bootstrap mints the Top Drawer the seed waits on
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const src = (f) => { const p = path.join(SRC, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`;

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  return app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const set = (title, drawerName) => { const d = W.wrizoCreateDrawer(drawerName); const p = W.wrizoCreateProject(title); W.wrizoSetProjectDrawer(p.id, d.id); return p; };
    const novel = set('Novel', 'Fiction');
    page('wa-1', 'Chapter one', { origin: 'project', projectId: novel.id, orderIndex: 0 });
    page('wa-2', 'Chapter two', { origin: 'project', projectId: novel.id, orderIndex: 1 });
    page('wa-3', 'Chapter three', { origin: 'project', projectId: novel.id, orderIndex: 2 });
    page('wa-b1', 'Beta board', { origin: 'loose', pageType: 'board', boxes: [] });
    page('wa-b2', 'Alpha board', { origin: 'loose', pageType: 'board', boxes: [] });
    page('wa-dA', 'Alpha doc', { origin: 'project', projectId: set('Set A', 'Mid').id, orderIndex: 0 });
    page('wa-dB', 'Beta doc', { origin: 'project', projectId: set('Set B', 'Ant').id, orderIndex: 0 });
    page('wa-dC', 'Gamma doc', { origin: 'project', projectId: set('Set C', 'Zed').id, orderIndex: 0 });
    page('wa-d3', 'Middle doc', { origin: 'loose' });
    // wa-1 links B, C, A, a day apart (its own page links, through the patch seam: the dates are what the newest/oldest sorts read)
    const link = (id, b, day) => ({ id, aEntryId: 'wa-1', bEntryId: b, createdAt: '2026-05-0' + day + 'T00:00:00.000Z', updatedAt: '2026-05-0' + day + 'T00:00:00.000Z' });
    W.wrizoPatchEntry('wa-1', { pageLinks: [link('wl-b', 'wa-dB', 1), link('wl-c', 'wa-dC', 2), link('wl-a', 'wa-dA', 3)] });
    W.wrizoFlushNow();
    return { novel: novel.id };
  })()`);
}

async function openBuild(app, id) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.waitFor("document.querySelector('.reorg-top [data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'BUILD' }).catch(() => {});
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-tutor-tab-links')?.click(); null"); await sleep(500);
}
async function partsTab(app) {
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(400);
}
// the order of the docs in a Part's list (rows whose entry is one of the sort fixture's)
const DOCS_OF = (part) => `[...document.querySelectorAll('[data-assets-part="${part}"] [data-back-asset][data-graft-entry]')].map((r) => r.getAttribute('data-graft-entry')).filter((id) => /^wa-d[ABC]$/.test(id)).map((id) => id.slice(-1)).join('')`;
// a Part's own page links, read through the store's seam (the cache, never storage: no flush to wait for)
const LINKS = (id) => `(window.wrizoPageLinksOf(${q(id)}) || []).filter((l) => !l.deletedAt).map((l) => l.bEntryId)`;
const DOC_ASSETS = "(() => { const D = window.wrizoDocSettings; if (!D) return { seam: false }; const s = D.of('wa-1') || {}; return { seam: true, assets: s.assets ?? null }; })()";
const DOC_ROWS = "[...document.querySelectorAll('[data-assets-doc] [data-back-asset][data-graft-entry]')].map((r) => r.getAttribute('data-graft-entry'))";
const HEAD = "((document.querySelector('[data-back-assets-head]') || {}).textContent || '').replace(/\\s+/g, ' ').trim()";
async function openMenu(app, target) {
  await app.evalJs(click(`[data-assets-add="${target}"]`)); await sleep(350);
}
async function pickKind(app, kind) {
  await app.evalJs(click(`[data-assets-add-menu] [data-add-kind="${kind}"]`)); await sleep(450);
}
const PICKER = "[...document.querySelectorAll('[data-assets-picker] [data-assets-pick]')].map((b) => b.getAttribute('data-graft-entry'))";
// a drag from one element to another with one DataTransfer (Chromium builds one in page script): dragstart fills it, dragover + drop read it
const DRAG = (fromSel, toSel) => `(() => { const a = document.querySelector(${q(fromSel)}), b = document.querySelector(${q(toSel)}); if (!a || !b) return { from: !!a, to: !!b };
  const dt = new DataTransfer(); const ev = (type, el) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
  ev('dragstart', a); ev('dragenter', b); ev('dragover', b); ev('drop', b); ev('dragend', a); return { from: true, to: true, types: [...dt.types] }; })()`;

await withHarness(async (app) => {
  const ids = await seed(app);
  await openBuild(app, 'wa-1');

  // ---- MENU ------------------------------------------------------------------------------------------------------------------------------
  const m1a = await app.evalJs(`(() => { const d = document.querySelector('[data-assets-add="doc"]'), p = document.querySelector('[data-assets-part="wa-1"] [data-assets-add="wa-1"]');
    return { doc: d ? { tag: d.tagName, label: d.getAttribute('aria-label') } : null, part: p ? { tag: p.tagName, label: p.getAttribute('aria-label') } : null }; })()`);
  await openMenu(app, 'wa-1');
  const m1b = await app.evalJs("[...document.querySelectorAll('[data-assets-add-menu] [data-add-kind]')].map((b) => [b.getAttribute('data-add-kind'), (b.textContent || '').trim()])");
  await app.evalJs(click('[data-assets-add="wa-1"]')); await sleep(250);
  ok('M1 the Assets head carries a "+" for the whole Doc and her Part\'s head its own, each named for a screen reader; the menu reads New Board, Existing Board, New Doc, Existing Doc and nothing else',
    !!m1a.doc && m1a.doc.tag === 'BUTTON' && /Add an Asset/.test(m1a.doc.label || '') && !!m1a.part && m1a.part.tag === 'BUTTON' && /Add an Asset/.test(m1a.part.label || '') && /Chapter one/.test(m1a.part.label || '')
      && JSON.stringify(m1b) === JSON.stringify([['new-board', 'New Board'], ['existing-board', 'Existing Board'], ['new-doc', 'New Doc'], ['existing-doc', 'Existing Doc']]), { ids, m1a, m1b });

  // ---- SORT ------------------------------------------------------------------------------------------------------------------------------
  const order = {};
  order.default = await app.evalJs(DOCS_OF('wa-1'));
  for (const by of ['az', 'new', 'project', 'old']) { await app.evalJs(click(`[data-assets-sort] [data-sort="${by}"]`)); await sleep(300); order[by] = await app.evalJs(DOCS_OF('wa-1')); }
  const pressedOld = await app.evalJs("document.querySelector('[data-assets-sort] [data-sort=\"old\"]')?.getAttribute('aria-pressed')");
  ok('S1 wa-1\'s Docs sort oldest first by default (BCA), A-Z (ABC), newest first (ACB) and by Project, its drawer (BAC)',
    order.default === 'BCA' && order.az === 'ABC' && order.new === 'ACB' && order.project === 'BAC' && order.old === 'BCA' && pressedOld === 'true', { order, pressedOld });
  await app.evalJs(click('[data-assets-sort] [data-sort="az"]')); await sleep(400);
  const fact = await app.evalJs("(() => { const p = window.wrizoPrefs; const f = p ? p.pref('assetsSort') : null; return f ? { by: f.by, at: !!f.at, keys: Object.keys(f).sort() } : null; })()");
  await openBuild(app, 'wa-1');
  const after = { order: await app.evalJs(DOCS_OF('wa-1')), pressed: await app.evalJs("document.querySelector('[data-assets-sort] [data-sort=\"az\"]')?.getAttribute('aria-pressed')") };
  ok('S2 the sort is saved as a reorg fact in users.prefs (assetsSort = { by }), and a reload keeps it',
    !!fact && fact.by === 'az' && fact.at && JSON.stringify(fact.keys) === JSON.stringify(['at', 'by']) && after.order === 'ABC' && after.pressed === 'true', { fact, after });
  await app.evalJs(click('[data-assets-sort] [data-sort="old"]')); await sleep(300);

  // ---- PART: Existing Board ----------------------------------------------------------------------------------------------------------------
  const r0 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__apMark = 1; return null; })()");
  await openMenu(app, 'wa-1');
  const r1 = await app.evalJs(PAGE);
  await pickKind(app, 'existing-board');
  const boardsListed = await app.evalJs(PICKER);
  const r2 = await app.evalJs(PAGE);
  await app.evalJs(click('[data-assets-picker] [data-assets-pick][data-graft-entry="wa-b2"]')); await sleep(500);
  const r3 = await app.evalJs(PAGE);
  const kept = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__apMark");
  const m2 = { links: await app.evalJs(LINKS('wa-1')), head: await app.evalJs("!!document.querySelector('[data-assets-part=\"wa-1\"] [data-back-board=\"wa-b2\"]')") };
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(250);
  ok('M2 Existing Board from her Part\'s "+": the picker lists boards only; a pick makes wa-1\'s own page link to it and its group is drawn',
    boardsListed.includes('wa-b1') && boardsListed.includes('wa-b2') && !boardsListed.some((id) => /^wa-d/.test(id)) && m2.links.includes('wa-b2') && m2.head, { boardsListed, m2 });
  ok('P1 the page\'s rects and editor node are the same across opening the menu, the picker and a pick (the pick having landed)',
    !!r0 && r0 === r1 && r1 === r2 && r2 === r3 && kept && m2.links.includes('wa-b2'), { r0, r1, r2, r3, kept });

  // ---- DOC: Existing Doc -------------------------------------------------------------------------------------------------------------------
  await openMenu(app, 'doc');
  await pickKind(app, 'existing-doc');
  const docsListed = await app.evalJs(PICKER);
  await app.evalJs(click('[data-assets-picker] [data-assets-pick][data-graft-entry="wa-d3"]')); await sleep(500);
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(250);
  const m3 = { stored: await app.evalJs(DOC_ASSETS), rows: await app.evalJs(DOC_ROWS), head: await app.evalJs(HEAD), wa1: await app.evalJs(LINKS('wa-1')) };
  const a3 = m3.stored.assets;
  ok('M3 Existing Doc from the Doc\'s "+": the picker lists docs only; a pick writes docSettings.assets = [{ entryId, at }], the Doc\'s list draws it, "Assets (n)" counts it, and her Part gains no link',
    docsListed.includes('wa-d3') && !docsListed.some((id) => /^wa-b/.test(id)) && Array.isArray(a3) && a3.length === 1 && a3[0].entryId === 'wa-d3' && !!a3[0].at
      && JSON.stringify(Object.keys(a3[0]).sort()) === JSON.stringify(['at', 'entryId']) && m3.rows.includes('wa-d3') && m3.head === 'Assets (5)' && !m3.wa1.includes('wa-d3'), { docsListed, m3 });

  // ---- DRAG into a Part (the Parts tab) ----------------------------------------------------------------------------------------------------
  await partsTab(app);
  const d2 = await app.evalJs(DRAG('[data-assets-doc] [data-back-asset][data-graft-entry="wa-d3"]', '.wz-sliver [data-reorg-parts] [data-part-row="wa-2"]')); await sleep(400);
  const d1 = await app.evalJs(DRAG('[data-assets-doc] [data-back-asset][data-graft-entry="wa-d3"]', '.wz-sliver [data-reorg-parts] [data-part-row="wa-1"]')); await sleep(400);
  const m4 = { wa2: await app.evalJs(LINKS('wa-2')), wa1: await app.evalJs(LINKS('wa-1')), rows: await app.evalJs(DOC_ROWS), stored: await app.evalJs(DOC_ASSETS),
    said: await app.evalJs("((document.querySelector('[data-parts-said]') || {}).textContent || '').trim()") };
  ok('M4 dragging the Doc-level row onto a Part in the Parts tab connects it there (a page link), her own Part included; it stays in the Doc\'s list and in docSettings.assets',
    m4.wa2.includes('wa-d3') && m4.wa1.includes('wa-d3') && m4.rows.includes('wa-d3') && Array.isArray(m4.stored.assets) && m4.stored.assets.some((a) => a.entryId === 'wa-d3'), { d2, d1, m4 });

  // ---- NEW Doc from a Part's "+" (wa-2 is listed now: it has an asset) ------------------------------------------------------------------------
  await openBuild(app, 'wa-1');
  await openMenu(app, 'wa-2');
  await pickKind(app, 'new-doc');
  const nav5 = await app.evalJs("({ hash: location.hash, from: (history.state && history.state.usr && history.state.usr.fromBoardId) || null })");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the new page', timeout: 8000 }).catch(() => {});
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(200);
  await app.typeKeys('Fresh'); await sleep(1500);
  const born = await app.evalJs("(() => { const m = /#\\/page\\/([^/?#]+)/.exec(location.hash); return m ? decodeURIComponent(m[1]) : null; })()");
  const m5 = { born, wa2: await app.evalJs(LINKS('wa-2')) };
  ok('M5 New Doc from a Part\'s "+" opens a new page with the way back to her page; born on its first keystroke, it is that Part\'s asset (its page link)',
    /#\/page\/new\?/.test(nav5.hash) && /[?&]ap=wa-2\b/.test(nav5.hash) && nav5.from === 'wa-1' && !!born && born !== 'new' && m5.wa2.includes(born), { nav5, m5 });

  // ---- NEW Board from the Doc's "+" ------------------------------------------------------------------------------------------------------
  await openBuild(app, 'wa-1');
  await openMenu(app, 'doc');
  await pickKind(app, 'new-board');
  const nav6 = await app.evalJs("({ hash: location.hash, from: (history.state && history.state.usr && history.state.usr.fromBoardId) || null })");
  ok('M6 New Board from the Doc\'s "+" opens a new board for the Doc, with the way back to her page',
    /#\/page\/new\?/.test(nav6.hash) && /[?&]kind=board\b/.test(nav6.hash) && /[?&]ad=wa-1\b/.test(nav6.hash) && nav6.from === 'wa-1', nav6);
});

// ---- WORDS + DATA (source) ---------------------------------------------------------------------------------------------------------------
{
  const terms = src('store/lexicon/terms.ts'), canon = src('store/lexicon/canonical/chrome.ts');
  const used = ['components/ConnectionsDrawerPanel.tsx', 'reorg/backMenu/AssetPartGroups.tsx', 'reorg/backMenu/AssetAddMenu.tsx'].map(src).join('\n');
  const need = ['reorgAssetsAdd', 'reorgAddNewBoard', 'reorgAddExistingBoard', 'reorgAddNewDoc', 'reorgAddExistingDoc', 'reorgAssetsSortAz', 'reorgAssetsSortNew', 'reorgAssetsSortOld', 'reorgAssetsSortProject'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !used.includes(`'${k}'`));
  ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used in the source)', missing.length === 0, { missing });
  const rec = src('types/records.ts'), ds = src('reorg/docSettings.ts').replace(/\/\/.*$/gm, '');
  ok('D1 the Doc\'s assets are typed on DocSettings and written only through reorg/docSettings.ts (saveProject), which touches no storage of its own',
    /export type DocSettings = \{[^}]*assets\?: DocAsset\[\]/.test(rec) && /export function addDocAsset\(/.test(ds) && /saveProject\(/.test(ds) && !/localStorage|sessionStorage|indexedDB/.test(ds), {});
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 11;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ASSETS-PLUS VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ASSETS-PLUS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
