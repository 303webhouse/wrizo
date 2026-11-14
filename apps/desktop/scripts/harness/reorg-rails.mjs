// THE REORG'S RAILS (POLISH; Fable cleared the plan Nov 14 with five changes, claude/live-feedback-nov14i.md). Steps 1 and 2: the switch and
// the rail's shell, then PROJECTS (counts, New project, pins in memory, list or boxes). Machina only, behind ?reorg=1.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account is given its Top Drawer and Top Drawer's app-made set):
//   Top Drawer (Machina shows it as its root word)  its app-made set holds two pages and a board  -> 2 Docs (each page a one-Part Doc)
//   Grants   a set she made, "Budget": three pages and a board                                      -> 1 Doc (the set)
//   Essays   nothing                                                                                -> 0 Docs
//   the Notebook (the hidden Journal): one journal page                                              -> 1 Doc, listed LAST
//   plus one loose page and one set in no Drawer: writing with no Project (Unfiled), never a row of All projects
// The open page is the first page of Top Drawer's set.
//
// OFF   O1  with the switch off, in Arbor, Flux and Machina, the strip and every pop-out it opens is main's DOM exactly (the golden, captured
//           from origin/main's own build: reorg-rails-off-golden.json, see CAPTURE below)
//       O2  with the switch ON in Arbor and Flux, the same: the rail is Machina's alone
//       O3  with the switch off, Machina's words are the live ones (Plan / Plans / Outline / Consultant); on, the reorg's (Board / Boards / Plan / Feedback)
// SHELL S1  on (Machina): the rail sits in the strip's own track, the old strip's place block is gone, and its four groups read in order:
//           where she is · (no pins on day one) · DOCS, PROJECTS, UNFILED · THEME, SETTINGS (each word from the lexicon)
//       S2  where she is = the open page's Project: its box carries the two letters of its name and is marked as the location
// PROJ  P1  PROJECTS opens All projects: the head counts the rows; the rows are the live Drawers in her order, the Notebook LAST; each row's
//           Docs count is the read-time rule's (2, 1, 0, 1); no Unfiled writing is a row
//       P2  pins: pinning puts a Project in the pinned group (in the order pinned) and its box on the rail; the Project she is in is never drawn
//           twice on the rail; the switch under the pins draws them as a list or as boxes; unpinning takes it off
//       P3  New project: typed and Entered, it adds one Drawer with that name and touches no page and no set (today's own act)
// SAVED N1  pins and list-or-boxes change nothing stored (localStorage and sessionStorage byte-identical, beside a control of the same
//           length with no act), and the in-memory rail holds them; a reload forgets them
// PAGE  G1  the page's rect is identical with the switch off, on at rest, with PROJECTS open, with pins drawn as boxes and as a list, at
//           1366, 1920 and 2000; the editor element is the same node throughout (no remount)
// KEYS  K1  PROJECTS opens on Enter; a row's pin toggles on Enter; Escape from the page closes the pop-out
// FLOOR F1  as drawn: every box's letters hold 4.5:1 on its colour; a row box's 1 px edge holds 3:1 on the pop-out
//
// CAPTURE (REORG_RAILS_MODE=capture): prints main's switch-off DOM, one GOLDEN line per surface, instead of checking. Run it on a tree that is
//   origin/main plus this file (the wrapper reorg-rails-capture.mjs on the branch reorg-rails-golden); the golden file records that tree's SHA.
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-rails.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_FILE = path.join(HERE, 'reorg-rails-off-golden.json');
const CAPTURE = process.env.REORG_RAILS_MODE === 'capture';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THEMES = ['plateau', 'flux', 'machina'];
const CATEGORIES = ['page', 'plan', 'journal', 'drawers', 'settings', 'theme', 'trash'];
const PAGE = "(() => { const p = document.querySelector('.mode-page, .mode-pagecol'); if (!p) return null; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); })()";
const STORE = "JSON.stringify([localStorage, sessionStorage].map((s) => Object.keys(s).sort().map((k) => [k, s.getItem(k)])))";
const q = (s) => JSON.stringify(s);

// ---- the fixture ---------------------------------------------------------------------------------------------------------------------------
let ids = null;   // name -> id, so a captured DOM reads the same in every run (generated ids are swapped for their names)
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  // Top Drawer arrives through the app's own bootstrap (after the first pull); read, never written
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const top = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return { drawer: d.id, set: p && p.id }; })()");
  const made = await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const essays = W.wrizoCreateDrawer('Essays');
    const budget = W.wrizoCreateProject('Budget'); W.wrizoSetProjectDrawer(budget.id, grants.id);
    const orphan = W.wrizoCreateProject('Old binder');
    page('rr-top-1', 'Notes on the ledgers', { origin: 'project', projectId: ${q(top.set)}, orderIndex: 0 });
    page('rr-top-2', 'A second note', { origin: 'project', projectId: ${q(top.set)}, orderIndex: 1 });
    page('rr-top-b', 'Top board', { origin: 'project', projectId: ${q(top.set)}, pageType: 'board', boxes: [] });
    page('rr-g-1', 'Budget one', { origin: 'project', projectId: budget.id, orderIndex: 0 });
    page('rr-g-2', 'Budget two', { origin: 'project', projectId: budget.id, orderIndex: 1 });
    page('rr-g-3', 'Budget three', { origin: 'project', projectId: budget.id, orderIndex: 2 });
    page('rr-g-b', 'Budget board', { origin: 'project', projectId: budget.id, pageType: 'board', boxes: [] });
    page('rr-j-1', 'A journal page', { origin: 'journal' });
    page('rr-l-1', 'A loose page', { origin: 'loose' });
    page('rr-o-1', 'In a binder with no drawer', { origin: 'project', projectId: orphan.id });
    W.wrizoFlushNow();
    return { grants: grants.id, essays: essays.id, budget: budget.id, orphan: orphan.id };
  })()`);
  ids = { topDrawer: top.drawer, topSet: top.set, ...made };
}

// open the fixture's first page under a theme, with or without the switch (a reload re-reads the address, as the app does once at load)
async function openPage(app, theme, reorg) {
  await app.evalJs(`window.wrizoTheme.set('${theme}')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1' : '/'}#/page/rr-top-1')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.desk-frame-strip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}

const NORM = () => `(() => { const ids = ${q(ids)}; return (h) => { let s = h || ''; for (const [k, v] of Object.entries(ids)) if (v) s = s.split(v).join('{' + k + '}'); return s; }; })()`;
// the strip at rest, then each of its pop-outs open (the anchor, once its slide has settled), each closed again before the next
async function captureSurfaces(app) {
  const out = {};
  out.strip = await app.evalJs(`${NORM()}(document.querySelector('.desk-frame-strip')?.outerHTML)`);
  for (const c of CATEGORIES) {
    const pressed = await app.evalJs(`(() => { const b = document.querySelector('.desk-frame-strip [data-category="${c}"]'); if (!b) return false; b.click(); return true; })()`);
    if (!pressed) { out[c] = null; continue; }
    await sleep(600);
    out[c] = await app.evalJs(`${NORM()}(document.querySelector('.desk-frame-cascade-anchor')?.outerHTML)`);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await sleep(600);
  }
  return out;
}

// ---- contrast, as drawn --------------------------------------------------------------------------------------------------------------------
const CONTRAST_FN = `(() => {
  const rgb = (s) => { const m = (s || '').match(/[\\d.]+/g); return m ? m.slice(0, 4).map(Number) : null; };
  const lum = (c) => { const ch = c.slice(0, 3).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && (c.length < 4 || c[3] > 0)) return c; } return [255, 255, 255]; };
  return { rgb, ratio, bgOf };
})()`;

await withHarness(async (app) => {
  await seed(app);
  if (CAPTURE) {
    for (const theme of THEMES) {
      await openPage(app, theme, false);
      const s = await captureSurfaces(app);
      for (const [k, html] of Object.entries(s)) console.log(`GOLDEN ${theme}.${k} ${Buffer.from(html == null ? 'null' : html, 'utf8').toString('base64')}`);
      // a second capture of the same surfaces: what differs between two reads of main is not a DOM main draws the same each time
      const again = await captureSurfaces(app);
      ok(`CAPTURE [${theme}]: two captures of main's switch-off surfaces agree (${Object.keys(s).length} surfaces)`, Object.keys(s).every((k) => s[k] === again[k]), Object.keys(s).filter((k) => s[k] !== again[k]).join(','));
    }
    return checks;
  }

  // ---- OFF -----------------------------------------------------------------------------------------------------------------------------
  const golden = fs.existsSync(GOLDEN_FILE) ? JSON.parse(fs.readFileSync(GOLDEN_FILE, 'utf8')) : null;
  ok('O0: the golden of main\'s switch-off DOM is committed beside this file, with the tree it was captured from', !!golden && /^[0-9a-f]{40}$/.test(golden.capturedFrom || '') && !!golden.surfaces, GOLDEN_FILE);
  const diffOf = (got, theme) => {
    if (!golden) return ['no golden'];
    return Object.keys(golden.surfaces[theme] || {}).filter((k) => (got[k] ?? 'null') !== golden.surfaces[theme][k]);
  };
  for (const theme of THEMES) {
    await openPage(app, theme, false);
    const got = await captureSurfaces(app);
    const bad = diffOf(got, theme);
    ok(`O1 [${theme}]: switch OFF - the strip and its ${CATEGORIES.length} pop-outs are main's DOM exactly`, golden && bad.length === 0 && Object.keys(golden.surfaces[theme] || {}).length === CATEGORIES.length + 1, bad.join(','));
    for (const k of bad.slice(0, 2)) console.log(`DIFF ${theme}.${k} ${Buffer.from(String(got[k]), 'utf8').toString('base64')}`);
    if (theme !== 'machina') {
      await openPage(app, theme, true);
      const on = await captureSurfaces(app);
      const badOn = diffOf(on, theme);
      ok(`O2 [${theme}]: switch ON in ${theme} - still main's DOM exactly (the rail is Machina's alone)`, golden && badOn.length === 0, badOn.join(','));
    }
  }
  const WORDS = "(() => ({ board: window.wrizoLexicon.t('board', 'machina'), boards: window.wrizoLexicon.tMany('board', 'machina'), strip: window.wrizoDeskLexicon.t('stripPlan', 'machina'), outline: window.wrizoDeskLexicon.t('boardModeOutline', 'machina'), tab: window.wrizoDeskLexicon.t('tutorTabTutor', 'machina') }))()";
  await openPage(app, 'machina', false);
  const offWords = await app.evalJs(WORDS);
  await openPage(app, 'machina', true);
  const onWords = await app.evalJs(WORDS);
  ok('O3: Machina\'s words - switch off: Plan / Plans / Plans / Outline / Consultant; switch on: Board / Boards / Boards / Plan / Feedback',
    JSON.stringify(offWords) === JSON.stringify({ board: 'Plan', boards: 'Plans', strip: 'Plans', outline: 'Outline', tab: 'Consultant' })
    && JSON.stringify(onWords) === JSON.stringify({ board: 'Board', boards: 'Boards', strip: 'Boards', outline: 'Plan', tab: 'Feedback' }), JSON.stringify({ offWords, onWords }));

  // ---- SHELL ---------------------------------------------------------------------------------------------------------------------------
  const shell = await app.evalJs(`(() => {
    const rail = document.querySelector('.desk-frame-strip > [data-reorg-rail], .desk-frame-strip [data-reorg-rail]');
    if (!rail) return null;
    const groups = [...rail.children].map((g) => g.classList.contains('wz-reorg-where') ? 'where' : g.classList.contains('wz-reorg-pins') ? 'pins' : g.classList.contains('wz-reorg-doors') ? 'doors' : g.classList.contains('wz-strip-foot') ? 'foot' : g.className);
    const doors = [...rail.querySelectorAll('.wz-reorg-doors [data-category]')].map((b) => [b.dataset.category, b.querySelector('.wz-strip-label').textContent]);
    const foot = [...rail.querySelectorAll('.wz-strip-foot [data-category]')].map((b) => [b.dataset.category, b.querySelector('.wz-strip-label').textContent]);
    const where = rail.querySelector('[data-reorg-where]');
    return { inStrip: !!rail.closest('.desk-frame-strip'), placeBlock: !!document.querySelector('.desk-frame-strip .wz-place-block'), groups, doors, foot,
      where: where && { id: where.dataset.reorgWhere, name: where.querySelector('.wz-reorg-where-name').textContent, letters: where.querySelector('.wz-reorg-box').textContent, current: where.getAttribute('aria-current') },
      words: { docs: window.wrizoLexicon.tMany('page', 'machina'), projects: window.wrizoLexicon.tMany('drawer', 'machina'), unfiled: window.wrizoDeskLexicon.t('reorgUnfiled', 'machina'), theme: window.wrizoDeskLexicon.t('stripChangeTheme', 'machina'), settings: window.wrizoDeskLexicon.t('stripSettings', 'machina'), root: window.wrizoDeskLexicon.t('placeRootName', 'machina') } };
  })()`);
  ok('S1: switch on in Machina - the rail sits in the strip\'s own track (the place block is gone) and reads where · DOCS, PROJECTS, UNFILED · THEME, SETTINGS, every word from the lexicon',
    !!shell && shell.inStrip && !shell.placeBlock && JSON.stringify(shell.groups) === JSON.stringify(['where', 'doors', 'foot'])
    && JSON.stringify(shell.doors) === JSON.stringify([['reorg-docs', shell.words.docs], ['reorg-projects', shell.words.projects], ['reorg-unfiled', shell.words.unfiled]])
    && JSON.stringify(shell.foot) === JSON.stringify([['theme', shell.words.theme], ['settings', shell.words.settings]]), JSON.stringify(shell));
  const letters = (n) => { const w = n.trim().split(/\s+/); return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase(); };
  ok('S2: where she is = the open page\'s Project (Top Drawer, by Machina\'s root word): its two letters, marked as the location',
    !!shell && !!shell.where && shell.where.id === ids.topDrawer && shell.where.name === shell.words.root && shell.where.letters === letters(shell.words.root) && shell.where.current === 'location', JSON.stringify(shell && shell.where));

  // ---- PROJECTS ------------------------------------------------------------------------------------------------------------------------
  const PROJECTS = `(() => { const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-projects'); if (!p) return null;
    return { title: document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel-title')?.textContent, count: document.querySelector('[data-reorg-count]')?.textContent,
      groups: [...p.querySelectorAll('[data-reorg-group]')].map((g) => [g.dataset.reorgGroup, [...g.querySelectorAll('[data-reorg-project]')].map((r) => r.dataset.reorgProject)]),
      rows: [...p.querySelectorAll('[data-reorg-project]')].map((r) => ({ id: r.dataset.reorgProject, name: r.querySelector('.wz-reorg-row-name').textContent, docs: Number(r.querySelector('[data-reorg-docs]').dataset.reorgDocs), meta: r.querySelector('.wz-reorg-row-meta').textContent, notebook: r.dataset.notebook === 'true', current: r.getAttribute('aria-current') })) }; })()`;
  const RAILPINS = "(() => { const g = document.querySelector('[data-reorg-rail] .wz-reorg-pins'); return g ? { view: g.dataset.pinView, pins: [...g.querySelectorAll('[data-reorg-pin]')].map((b) => b.dataset.reorgPin), named: g.querySelectorAll('.wz-reorg-pin-name').length } : null; })()";
  const click = (sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);
  await sleep(2500);   // the page settles (a mode's re-persist lands ~1.1 s after the mount) before the store is read
  const storeBefore = await app.evalJs(STORE);
  await sleep(1500);
  const storeControl = await app.evalJs(STORE);   // the control: the same wait, no act
  const opened = await click('[data-reorg-rail] [data-category="reorg-projects"]');
  await sleep(600);
  const pj = await app.evalJs(PROJECTS);
  const want = [ids.topDrawer, ids.grants, ids.essays, 'notebook'];
  ok('P1: PROJECTS opens All projects - the head counts its rows (4); the rows are Top Drawer, Grants, Essays, then the Notebook LAST; Docs 2, 1, 0, 1 by the read-time rule; no Unfiled writing is a row; the row she is in is marked',
    opened && !!pj && pj.title === 'All projects' && pj.count === '4' && JSON.stringify(pj.rows.map((r) => r.id)) === JSON.stringify(want)
    && JSON.stringify(pj.rows.map((r) => r.docs)) === JSON.stringify([2, 1, 0, 1]) && pj.rows[1].meta === '1 doc' && pj.rows[0].meta === '2 docs'
    && pj.rows[3].notebook && pj.rows[3].name === 'Notebook' && pj.rows[0].current === 'location' && pj.rows.filter((r) => r.current).length === 1, JSON.stringify(pj));

  // P2: pins
  await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await sleep(150);
  await click('[data-reorg-pin-toggle="notebook"]'); await sleep(150);
  await click(`[data-reorg-pin-toggle="${ids.topDrawer}"]`); await sleep(150);
  const pinned3 = await app.evalJs(PROJECTS);
  const rail3 = await app.evalJs(RAILPINS);
  await click('[data-pin-view-btn="list"]'); await sleep(150);
  const railList = await app.evalJs(RAILPINS);
  const pageList = await app.evalJs(PAGE);
  await click('[data-pin-view-btn="boxes"]'); await sleep(150);
  const railBoxes = await app.evalJs(RAILPINS);
  const memory = await app.evalJs('JSON.stringify(window.wrizoRailMemory && window.wrizoRailMemory.get())');
  ok('P2: pinned Grants, the Notebook, then Top Drawer - the pinned group lists them in that order; the rail draws Grants and the Notebook (Top Drawer, where she is, shows once, at the top); the switch draws them as a list, then as boxes',
    !!pinned3 && JSON.stringify(pinned3.groups) === JSON.stringify([['pinned', [ids.grants, 'notebook', ids.topDrawer]], ['rest', [ids.essays]]])
    && !!rail3 && JSON.stringify(rail3.pins) === JSON.stringify([ids.grants, 'notebook']) && rail3.view === 'boxes' && rail3.named === 0
    && !!railList && railList.view === 'list' && railList.named === 2 && !!railBoxes && railBoxes.view === 'boxes' && railBoxes.named === 0,
    JSON.stringify({ groups: pinned3 && pinned3.groups, rail3, railList, railBoxes }));
  await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await sleep(150);
  const unpinned = await app.evalJs(RAILPINS);
  ok('P2b: unpinning Grants takes it off the rail and back among the rest', !!unpinned && JSON.stringify(unpinned.pins) === JSON.stringify(['notebook']), JSON.stringify(unpinned));

  // N1: nothing saved
  const storeAfter = await app.evalJs(STORE);
  const diffKeys = (a, b) => { const A = JSON.parse(a), B = JSON.parse(b); const out = []; A.forEach((s, i) => { const m = new Map(s); const n = new Map(B[i]); for (const k of new Set([...m.keys(), ...n.keys()])) if (m.get(k) !== n.get(k)) out.push(`${i ? 'session' : 'local'}:${k}`); }); return out; };
  const control = diffKeys(storeBefore, storeControl);
  const acted = diffKeys(storeControl, storeAfter);
  ok('N1: four pins, an unpin and both views change nothing stored - localStorage and sessionStorage are byte-identical (a control of the same wait with no act changed: ' + (control.join(',') || 'nothing') + ')',
    acted.length === 0 && control.length === 0, JSON.stringify({ acted, control }));
  ok('N1b: the rail\'s memory held them while she worked (Grants, the Notebook and Top Drawer pinned, in that order; the boxes view)', memory === JSON.stringify({ pins: [ids.grants, 'notebook', ids.topDrawer], pinView: 'boxes' }), memory);

  // P3: New project (today's own act: one Drawer, nothing else)
  const before3 = await app.evalJs("JSON.stringify({ d: JSON.parse(localStorage.getItem('writer-studio-drawers')).length, e: localStorage.getItem('writer-studio-journal-entries'), p: localStorage.getItem('writer-studio-projects') })");
  await click('[data-new="project"]'); await sleep(200);
  await app.evalJs("document.querySelector('.wz-reorg-new-input')?.focus()");
  await app.typeKeys('Thesis\n');
  await sleep(900);
  const after3 = await app.evalJs("JSON.stringify({ d: JSON.parse(localStorage.getItem('writer-studio-drawers')).length, e: localStorage.getItem('writer-studio-journal-entries'), p: localStorage.getItem('writer-studio-projects'), names: JSON.parse(localStorage.getItem('writer-studio-drawers')).map((d) => d.name) })");
  const b3 = JSON.parse(before3), a3 = JSON.parse(after3);
  const pj3 = await app.evalJs(PROJECTS);
  ok('P3: New project "Thesis" adds one Drawer by that name, listed before the Notebook; no page and no set is touched',
    a3.d === b3.d + 1 && a3.names.includes('Thesis') && a3.e === b3.e && a3.p === b3.p && !!pj3 && pj3.rows[pj3.rows.length - 1].notebook && pj3.rows.some((r) => r.name === 'Thesis'), JSON.stringify({ d: [b3.d, a3.d], names: a3.names }));

  // N1c: a reload forgets the rail's memory
  await openPage(app, 'machina', true);
  const forgot = await app.evalJs(`JSON.stringify({ mem: window.wrizoRailMemory && window.wrizoRailMemory.get(), rail: ${RAILPINS} })`);
  ok('N1c: a reload forgets the pins and the view (nothing was kept anywhere)', forgot === JSON.stringify({ mem: { pins: [], pinView: 'boxes' }, rail: null }), forgot);

  // ---- KEYS ----------------------------------------------------------------------------------------------------------------------------
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]').focus()");
  await app.typeKeys('\n'); await sleep(600);
  const kOpen = await app.evalJs("!!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-projects')");
  await app.evalJs(`document.querySelector('[data-reorg-pin-toggle="${ids.essays}"]').focus()`);
  await app.typeKeys('\n'); await sleep(200);
  const kPin = await app.evalJs(RAILPINS);
  await app.evalJs("document.activeElement && document.activeElement.blur(); document.body.focus()");
  await app.key('Escape'); await sleep(600);
  const kClosed = await app.evalJs("!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-projects')");
  ok('K1: PROJECTS opens on Enter; Essays\' pin toggles on Enter (its box joins the rail); Escape from outside the pop-out closes it', kOpen && !!kPin && kPin.pins.includes(ids.essays) && kClosed, JSON.stringify({ kOpen, kPin, kClosed }));

  // ---- FLOOR ---------------------------------------------------------------------------------------------------------------------------
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  const floor = await app.evalJs(`(() => { const C = ${CONTRAST_FN};
    const boxes = [...document.querySelectorAll('.wz-reorg-box')].map((b) => { const s = getComputedStyle(b); return { t: b.textContent, r: C.ratio(C.rgb(s.color), C.rgb(s.backgroundColor)) }; }).filter((x) => x.t);
    const edges = [...document.querySelectorAll('.wz-reorg-box--row')].map((b) => { const s = getComputedStyle(b); return { w: s.borderTopWidth, r: C.ratio(C.rgb(s.borderTopColor), C.bgOf(b.parentElement)) }; });
    return { boxes, edges }; })()`);
  ok('F1: as drawn - every box\'s letters hold 4.5:1 on its colour, and every row box\'s 1 px edge holds 3:1 on the pop-out',
    !!floor && floor.boxes.length >= 5 && floor.boxes.every((b) => b.r >= 4.5) && floor.edges.length >= 4 && floor.edges.every((e) => e.w === '1px' && e.r >= 3), JSON.stringify(floor));
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(600);

  // ---- PAGE ----------------------------------------------------------------------------------------------------------------------------
  for (const [w, h] of [[1366, 768], [1920, 1080], [2000, 1200]]) {
    await app.emulateDpr(1, w, h);
    await openPage(app, 'machina', false);
    const off = await app.evalJs(PAGE);
    await openPage(app, 'machina', true);
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (e) e.__reorgRails = 1; })()");
    const rest = await app.evalJs(PAGE);
    await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
    const open = await app.evalJs(PAGE);
    await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await click('[data-reorg-pin-toggle="notebook"]'); await click(`[data-reorg-pin-toggle="${ids.essays}"]`); await sleep(200);
    const pinsBoxes = await app.evalJs(PAGE);
    await click('[data-pin-view-btn="list"]'); await sleep(200);
    const pinsList = await app.evalJs(PAGE);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(600);
    const closed = await app.evalJs(PAGE);
    const same = await app.evalJs("document.querySelector('.forward-only-editor')?.__reorgRails === 1");
    ok(`G1 [${w}]: the page's rect is the same switch off, on at rest, PROJECTS open, pins as boxes, as a list, and closed (${off}); the editor is the same node throughout`,
      !!off && [rest, open, pinsBoxes, pinsList, closed].every((r) => r === off) && same, JSON.stringify({ off, rest, open, pinsBoxes, pinsList, closed, same }));
  }
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-RAILS VERIFY: PASS (${checks.length} checks)` : `\nREORG-RAILS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
