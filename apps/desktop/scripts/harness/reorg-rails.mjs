// THE REORG'S RAILS (POLISH; Fable cleared the plan Nov 14 with five changes, claude/live-feedback-nov14i.md). Steps 1 and 2: the switch and
// the rail's shell, then PROJECTS (counts, New project, pins in memory, list or boxes). Machina only, behind ?reorg=1.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account is given its Top Drawer and Top Drawer's app-made set):
//   Top Drawer (Machina shows it as its root word)  its app-made set holds two pages and a board  -> 2 Docs (each page a one-Part Doc)
//   Grants   a set she made, "Budget": three pages and a board                                      -> 1 Doc (the set)
//            and a set she made of boards only, "Moodboards": one board                             -> no Doc; a Board with no Doc (step 3)
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
// STEP 3, a Project's own list (Nick, Nov 14, 11:14 am; Fable, Nov 14, 2:40 pm):
// LIST  L1  the where-she-is box opens her Project's own list (its name in the head): its Docs (Top Drawer: two one-Part Docs), then its Boards
//           with no Doc; + New doc and + New board side by side; pressing the box again closes it
//       L2  a pin opens its Project's list: Grants shows Budget as ONE Doc with its three Parts and its board indented under it, and Moodboards'
//           board under Boards with no doc, with the set's name beside it
//       L3  a row of All projects opens its list (the Notebook: its one page; Essays: no Docs)
//       L4  REACHABLE: over every Project's list, every page and board of a Project or of the Notebook is listed, each in exactly one Project's
//           list; the two Unfiled entries are in none (UNFILED is step 6)
//       L5  opening a Part is a departure with the return chip, and the rail comes back open on the same list
//       L6  + New board and + New doc go through today's own route: an unborn board in Top Drawer's set; an unborn doc in Grants' first set
//       L7  browsing the lists changes nothing stored
// STEP 4, Box settings (frame R5):
// BOX   B1  one closed drop-down at the foot of PROJECTS, for the Project she is in; open, it sets the letters (the rail's box and the row's
//           read them), No letters, a swatch (brass), her own colour, and a picture (the box shows it), and Remove the picture
//       B2  none of it is stored (a control of the same length changes nothing either) and the memory holds it; a reload forgets it
//       B3  it follows where she is: on a Grants page it is Grants' Box settings
// FLOOR F2  as drawn: the letters hold 4.5:1 on every swatch and on a mid-grey of her own (#777777)
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
// the page as the writer sees it, every layer of it: the column, the paper inside it and the editor on the paper (the first form read only the
// first of '.mode-page, .mode-pagecol' in document order, the column, so a shove of the paper inside it went unseen: mutant page-shoved, run 43641519969)
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
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
    const moods = W.wrizoCreateProject('Moodboards'); W.wrizoSetProjectDrawer(moods.id, grants.id);   // step 3: a set she made of boards only
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
    page('rr-m-b', 'Mood board', { origin: 'project', projectId: moods.id, pageType: 'board', boxes: [] });
    W.wrizoFlushNow();
    return { grants: grants.id, essays: essays.id, budget: budget.id, orphan: orphan.id, moods: moods.id };
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

// React's useId values (":r2:") count mounts, not what is drawn (two reads of main's own Pages pop-out differ only there, run 43639941602),
// so each is replaced by its order of appearance in the surface; every other byte is held
const NORM = () => `(() => { const ids = ${q(ids)}; return (h) => { let s = h || ''; for (const [k, v] of Object.entries(ids)) if (v) s = s.split(v).join('{' + k + '}'); const seen = new Map(); return s.replace(/:r[0-9a-z]+:/g, (m) => { if (!seen.has(m)) seen.set(m, ':useid' + (seen.size + 1) + ':'); return seen.get(m); }); }; })()`;
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
      for (const k of Object.keys(s).filter((x) => s[x] !== again[x])) console.log(`AGAIN ${theme}.${k} ${Buffer.from(String(again[k]), 'utf8').toString('base64')}`);
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
  // SUPERSEDED (Nov 14, run 43641174430 on db2516bc): it held the Notebook as the LAST ROW OVERALL, but here the Notebook is pinned (P2), and a
  // pinned Project lists in the pinned group by design; "last" is the Notebook's place among the UNPINNED rows. The original, verbatim:
  // ok('P3: New project "Thesis" adds one Drawer by that name, listed before the Notebook; no page and no set is touched',
  //   a3.d === b3.d + 1 && a3.names.includes('Thesis') && a3.e === b3.e && a3.p === b3.p && !!pj3 && pj3.rows[pj3.rows.length - 1].notebook && pj3.rows.some((r) => r.name === 'Thesis'),
  const rest3 = pj3 ? (pj3.groups.find((g) => g[0] === 'rest') || ['rest', []])[1] : [];
  ok('P3 [successor]: New project "Thesis" adds one Drawer by that name; the list stays open and shows it among the unpinned rows, after Essays (the Notebook, pinned here, is in the pinned group); no page and no set is touched',
    a3.d === b3.d + 1 && a3.names.includes('Thesis') && a3.e === b3.e && a3.p === b3.p && !!pj3 && pj3.rows.some((r) => r.name === 'Thesis')
    && rest3.indexOf(pj3.rows.find((r) => r.name === 'Thesis')?.id) > rest3.indexOf(ids.essays) && rest3.indexOf(ids.essays) >= 0
    && (!rest3.includes('notebook') || rest3[rest3.length - 1] === 'notebook'),
    JSON.stringify({ d: [b3.d, a3.d], names: a3.names, entriesSame: a3.e === b3.e, setsSame: a3.p === b3.p, rows: pj3 && pj3.rows.map((r) => r.name),
      entriesChanged: a3.e === b3.e ? [] : JSON.parse(a3.e).filter((x) => !JSON.parse(b3.e).some((y) => JSON.stringify(y) === JSON.stringify(x))).map((x) => ({ id: x.id, text: String(x.text).slice(0, 40), u: x.updatedAt })),
      setsChanged: a3.p === b3.p ? [] : JSON.parse(a3.p).filter((x) => !JSON.parse(b3.p).some((y) => JSON.stringify(y) === JSON.stringify(x))).map((x) => ({ id: x.id, title: x.title })) }));

  // N1c: a reload forgets the rail's memory
  await openPage(app, 'machina', true);
  const forgot = await app.evalJs(`JSON.stringify({ mem: window.wrizoRailMemory && window.wrizoRailMemory.get(), rail: ${RAILPINS} })`);
  ok('N1c: a reload forgets the pins and the view (nothing was kept anywhere)', forgot === JSON.stringify({ mem: { pins: [], pinView: 'boxes' }, rail: null }), forgot);

  // ---- KEYS ----------------------------------------------------------------------------------------------------------------------------
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.focus()");
  await app.typeKeys('\n'); await sleep(600);
  const kOpen = await app.evalJs("!!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-projects')");
  await app.evalJs(`document.querySelector('[data-reorg-pin-toggle="${ids.essays}"]')?.focus()`);
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

  // ---- STEP 3: a Project's own list --------------------------------------------------------------------------------------------------
  const LIST = `(() => { const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-list'); if (!p) return null;
    return { id: p.dataset.reorgList, name: document.querySelector('[data-reorg-list-name]')?.textContent || null, title: document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel-title')?.textContent,
      docs: [...p.querySelectorAll('[data-reorg-group="docs"] .wz-reorg-doc')].map((d) => ({ doc: d.dataset.reorgDoc, parts: Number(d.dataset.parts), rows: [...d.querySelectorAll('[data-entry-id]')].map((r) => [r.dataset.entryId, Number(r.dataset.depth), r.dataset.kind]) })),
      boards: [...p.querySelectorAll('[data-reorg-group="boards"] [data-entry-id]')].map((r) => [r.dataset.entryId, r.querySelector('[data-set-name]')?.textContent ?? null]),
      news: [...p.querySelectorAll('[data-new]')].map((b) => [b.dataset.new, b.textContent.replace('+', '').trim()]) }; })()`;
  const idsIn = (l) => (l ? [...new Set([...l.docs.flatMap((d) => d.rows.map((r) => r[0])), ...l.boards.map((b) => b[0])])].sort() : []);
  await openPage(app, 'machina', true);
  await sleep(2500);
  const store3 = await app.evalJs(STORE);
  await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
  const l1 = await app.evalJs(LIST);
  const l1Pressed = await app.evalJs("document.querySelector('[data-reorg-rail] [data-reorg-where]')?.getAttribute('aria-pressed')");
  await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
  const l1Closed = await app.evalJs(LIST);
  ok('L1: the where-she-is box opens Top Drawer\'s own list - its name in the head; two one-Part Docs, then its board under Boards with no doc; + New doc and + New board; pressed again it closes',
    !!l1 && l1.id === ids.topDrawer && l1.name === shell.words.root && JSON.stringify(l1.docs) === JSON.stringify([{ doc: 'rr-top-1', parts: 1, rows: [['rr-top-1', 0, 'page']] }, { doc: 'rr-top-2', parts: 1, rows: [['rr-top-2', 0, 'page']] }])
    && JSON.stringify(l1.boards) === JSON.stringify([['rr-top-b', null]]) && JSON.stringify(l1.news) === JSON.stringify([['doc', 'New doc'], ['board', 'New board']]) && l1Pressed === 'true' && l1Closed === null,
    JSON.stringify({ l1, l1Pressed, l1Closed: !!l1Closed }));
  // L2: pin Grants, then its pin opens its list
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await sleep(200);
  await click(`[data-reorg-rail] [data-reorg-pin="${ids.grants}"]`); await sleep(600);
  const l2 = await app.evalJs(LIST);
  ok('L2: Grants\' pin opens Grants\' list - Budget is ONE Doc, its three Parts and its board indented under it; Moodboards\' board is a Board with no doc, the set\'s name beside it',
    !!l2 && l2.id === ids.grants && JSON.stringify(l2.docs) === JSON.stringify([{ doc: ids.budget, parts: 3, rows: [['rr-g-1', 0, 'page'], ['rr-g-1', 1, 'page'], ['rr-g-2', 1, 'page'], ['rr-g-3', 1, 'page'], ['rr-g-b', 1, 'board']] }])
    && JSON.stringify(l2.boards) === JSON.stringify([['rr-m-b', 'Moodboards']]), JSON.stringify(l2));
  // L3 and L4: every row of All projects opens its list; together they reach every page and board of a Project or of the Notebook, once
  const rowIds = await app.evalJs("(() => { [...document.querySelectorAll('[data-reorg-rail] [data-category=\"reorg-projects\"]')].forEach((b) => b.click()); return true; })()").then(async () => { await sleep(600); return app.evalJs("[...document.querySelectorAll('[data-reorg-project]')].map((r) => r.dataset.reorgProject)"); });
  const lists = {};
  for (const pid of rowIds || []) {
    await app.evalJs(`(() => { if (!document.querySelector('.wz-reorg-projects')) document.querySelector('[data-reorg-rail] [data-category="reorg-projects"]')?.click(); })()`); await sleep(600);
    await click(`[data-reorg-project="${pid}"] .wz-reorg-row-open`); await sleep(600);
    lists[pid] = await app.evalJs(LIST);
  }
  ok('L3: a row of All projects opens its own list - the Notebook: its one page; Essays: no Docs and no boards',
    !!lists.notebook && lists.notebook.id === 'notebook' && JSON.stringify(idsIn(lists.notebook)) === JSON.stringify(['rr-j-1']) && !!lists[ids.essays] && lists[ids.essays].docs.length === 0 && lists[ids.essays].boards.length === 0,
    JSON.stringify({ notebook: lists.notebook, essays: lists[ids.essays] }));
  const want4 = ['rr-g-1', 'rr-g-2', 'rr-g-3', 'rr-g-b', 'rr-j-1', 'rr-m-b', 'rr-top-1', 'rr-top-2', 'rr-top-b'];
  const all4 = Object.values(lists).flatMap(idsIn);
  // SUPERSEDED (run 43644371795 on f0d3357b): it held FOUR lists, but P3 earlier in this run made the Project "Thesis", so All projects has five
  // rows (Thesis's list is empty). The original, verbatim:
  // ok(`L4: REACHABLE - the ${Object.keys(lists).length} lists reach every page and board of a Project or of the Notebook (${want4.length}), each in exactly one list; the two Unfiled entries in none`,
  //   Object.keys(lists).length === 4 && JSON.stringify([...all4].sort()) === JSON.stringify(want4) && !all4.includes('rr-l-1') && !all4.includes('rr-o-1'),
  ok(`L4 [successor]: REACHABLE - every row of All projects opens a list (${Object.keys(lists).length}: the four of the fixture and P3's Thesis), and together they reach every page and board of a Project or of the Notebook (${want4.length}), each in exactly one list; the two Unfiled entries in none`,
    Object.keys(lists).length === (rowIds || []).length && [ids.topDrawer, ids.grants, ids.essays, 'notebook'].every((k) => !!lists[k])
    && JSON.stringify([...all4].sort()) === JSON.stringify(want4) && !all4.includes('rr-l-1') && !all4.includes('rr-o-1'),
    JSON.stringify({ lists: Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, idsIn(v)])) }));
  const store3b = await app.evalJs(STORE);
  ok('L7: opening the lists from the box, a pin and every row changes nothing stored', diffKeys(store3, store3b).length === 0, JSON.stringify(diffKeys(store3, store3b)));
  // L5: a Part is a departure with the return chip, and the rail comes back open on the same list
  await click(`[data-reorg-rail] [data-reorg-pin="${ids.grants}"]`); await sleep(600);
  if (!(await app.evalJs(LIST))) { await click(`[data-reorg-rail] [data-reorg-pin="${ids.grants}"]`); await sleep(600); }
  await click('.wz-reorg-list [data-entry-id="rr-g-2"][data-depth="1"] .wz-reorg-list-open');
  await app.waitFor("location.hash === '#/page/rr-g-2' && !!document.querySelector('.forward-only-editor')", { label: 'the Part', timeout: 12000 }).catch(() => {});
  await sleep(900);
  const l5 = await app.evalJs(`({ hash: location.hash, chip: !!document.querySelector('.wz-back-to-board'), list: ${LIST} })`);
  ok('L5: opening Budget\'s second Part goes to it with the return chip, and the rail is still open on Grants\' list', l5.hash === '#/page/rr-g-2' && l5.chip && !!l5.list && l5.list.id === ids.grants, JSON.stringify({ hash: l5.hash, chip: l5.chip, list: l5.list && l5.list.id }));
  // B3: Box settings follows where she is (she is on a Grants page now)
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  const boxFor = await app.evalJs("document.querySelector('[data-box-settings]')?.dataset.boxSettings ?? null");
  ok('B3: on a Grants page, Box settings is Grants\'', boxFor === ids.grants, String(boxFor));
  // L6: + New board in Top Drawer's list, + New doc in Grants' (today's own route: an unborn page in the set)
  await openPage(app, 'machina', true);
  await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
  await click('.wz-reorg-list [data-new="board"]'); await sleep(900);
  const l6a = await app.evalJs('location.hash');
  await openPage(app, 'machina', true);
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  await click(`[data-reorg-project="${ids.grants}"] .wz-reorg-row-open`); await sleep(600);
  await click('.wz-reorg-list [data-new="doc"]'); await sleep(900);
  const l6b = await app.evalJs('location.hash');
  ok('L6: + New board in Top Drawer\'s list opens an unborn board in its set; + New doc in Grants\' opens an unborn doc in its first set (today\'s route)',
    l6a === `#/page/new?kind=board&binder=${ids.topSet}` && l6b === `#/page/new?binder=${ids.budget}`, JSON.stringify({ l6a, l6b }));

  // ---- STEP 4: Box settings ----------------------------------------------------------------------------------------------------------
  await openPage(app, 'machina', true);
  await sleep(2500);
  const store4 = await app.evalJs(STORE);
  await sleep(1500);
  const store4c = await app.evalJs(STORE);
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  const BOX = `(() => { const s = document.querySelector('[data-box-settings]'); const w = document.querySelector('[data-reorg-rail] [data-reorg-where] .wz-reorg-box'); const r = document.querySelector('[data-reorg-project="${ids.topDrawer}"] .wz-reorg-box');
    const cs = (e) => e && { text: e.textContent, bg: getComputedStyle(e).backgroundColor, ink: getComputedStyle(e).color, pic: e.hasAttribute('data-box-picture') && /^url\\("data:image\\//.test(getComputedStyle(e).backgroundImage) };
    return { id: s?.dataset.boxSettings ?? null, open: s?.dataset.open ?? null, body: !!s?.querySelector('.wz-reorg-box-settings-body'), where: cs(w), row: cs(r) }; })()`;
  const b1closed = await app.evalJs(BOX);
  await click('.wz-reorg-box-settings-head'); await sleep(200);
  await app.evalJs("(() => { const i = document.querySelector('[data-box-letters]'); i?.focus(); i?.select(); })()");
  await app.typeKeys('xy'); await sleep(200);
  const bLetters = await app.evalJs(BOX);
  await click('[data-box-no-letters]'); await sleep(150);
  const bNone = await app.evalJs(BOX);
  await click('[data-swatch="#B9A03A"]'); await sleep(150);
  const bBrass = await app.evalJs(BOX);
  await app.evalJs("(() => { const i = document.querySelector('[data-box-own-colour]'); if (!i) return; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '#777777'); i.dispatchEvent(new Event('input', { bubbles: true })); })()"); await sleep(150);
  const bOwn = await app.evalJs(BOX);
  await app.evalJs(`(async () => { const c = document.createElement('canvas'); c.width = 4; c.height = 4; const g = c.getContext('2d'); g.fillStyle = '#3366cc'; g.fillRect(0, 0, 4, 4);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png')); const dt = new DataTransfer(); dt.items.add(new File([blob], 'box.png', { type: 'image/png' }));
    const i = document.querySelector('[data-box-picture-input]'); if (!i) return; i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(500);
  const bPic = await app.evalJs(BOX);
  await click('[data-box-remove-picture]'); await sleep(150);
  const bNoPic = await app.evalJs(BOX);
  ok('B1: Box settings is one closed drop-down at the foot of PROJECTS, for Top Drawer; open, it sets the letters (XY on the rail and the row), No letters, brass, her own colour, a picture (the box shows it) and Remove the picture',
    b1closed.id === ids.topDrawer && b1closed.open === 'false' && !b1closed.body
    && bLetters.where?.text === 'XY' && bLetters.row?.text === 'XY' && bNone.where?.text === '' && bBrass.where?.bg === 'rgb(185, 160, 58)' && bOwn.where?.bg === 'rgb(119, 119, 119)'
    && bPic.where?.pic === true && bPic.row?.pic === true && bNoPic.where?.pic === false && bNoPic.where?.bg === 'rgb(119, 119, 119)',
    JSON.stringify({ b1closed, bLetters: bLetters.where, bNone: bNone.where, bBrass: bBrass.where, bOwn: bOwn.where, bPic: bPic.where, bNoPic: bNoPic.where }));
  const store4b = await app.evalJs(STORE);
  const boxMem = await app.evalJs(`JSON.stringify(window.wrizoRailMemory && window.wrizoRailMemory.boxes && window.wrizoRailMemory.boxes()[${q(ids.topDrawer)}])`);
  ok('B2: none of it is stored - localStorage and sessionStorage byte-identical (the control changed: ' + (diffKeys(store4, store4c).join(',') || 'nothing') + '); the memory holds it (no letters, #777777, no picture)',
    diffKeys(store4c, store4b).length === 0 && diffKeys(store4, store4c).length === 0 && boxMem === JSON.stringify({ letters: '', colour: '#777777' }), JSON.stringify({ acted: diffKeys(store4c, store4b), boxMem }));
  await openPage(app, 'machina', true);
  const b2r = await app.evalJs(`JSON.stringify({ boxes: window.wrizoRailMemory && window.wrizoRailMemory.boxes(), letters: document.querySelector('[data-reorg-rail] [data-reorg-where] .wz-reorg-box')?.textContent })`);
  ok('B2b: a reload forgets the box\'s look (its letters are derived again)', !!shell && b2r === JSON.stringify({ boxes: {}, letters: letters(shell.words.root) }), b2r);
  // F2: the letters hold 4.5:1 on every swatch and on a mid-grey of her own
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  await click('.wz-reorg-box-settings-head'); await sleep(200);
  const f2 = [];
  for (const sw of ['#C9CED3', '#6A727B', '#41658A', '#B9A03A', '#FF9800', '#777777']) {
    if (sw === '#777777') await app.evalJs("(() => { const i = document.querySelector('[data-box-own-colour]'); if (!i) return; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '#777777'); i.dispatchEvent(new Event('input', { bubbles: true })); })()");
    else await click(`[data-swatch="${sw}"]`);
    await sleep(150);
    f2.push(await app.evalJs(`(() => { const C = ${CONTRAST_FN}; const b = document.querySelector('[data-reorg-rail] [data-reorg-where] .wz-reorg-box'); if (!b) return null; const s = getComputedStyle(b); return { sw: ${q(sw)}, text: b.textContent, r: C.ratio(C.rgb(s.color), C.rgb(s.backgroundColor)) }; })()`));
  }
  ok('F2: as drawn - the letters hold 4.5:1 on all five swatches (brass among them) and on a mid-grey of her own (#777777)', f2.length === 6 && f2.every((x) => !!x && !!x.text && x.r >= 4.5), JSON.stringify(f2));
  await app.key('Escape'); await sleep(600);

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
    await click('.wz-reorg-box-settings-head'); await sleep(300);
    const boxOpen = await app.evalJs(PAGE);
    await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
    const listOpen = await app.evalJs(PAGE);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(600);
    const closed = await app.evalJs(PAGE);
    const same = await app.evalJs("document.querySelector('.forward-only-editor')?.__reorgRails === 1");
    // SUPERSEDED (step 3 and 4 add two states; the original, verbatim):
    // ok(`G1 [${w}]: the page's rect is the same switch off, on at rest, PROJECTS open, pins as boxes, as a list, and closed (${off}); the editor is the same node throughout`,
    //   !!off && [rest, open, pinsBoxes, pinsList, closed].every((r) => r === off) && same, JSON.stringify({ off, rest, open, pinsBoxes, pinsList, closed, same }));
    ok(`G1 [${w}] [successor]: the page's rect is the same switch off, on at rest, PROJECTS open, pins as boxes, as a list, Box settings open, a Project's list open, and closed (${off}); the editor is the same node throughout`,
      !!off && [rest, open, pinsBoxes, pinsList, boxOpen, listOpen, closed].every((r) => r === off) && same && boxOpen !== null,
      JSON.stringify({ off, rest, open, pinsBoxes, pinsList, boxOpen, listOpen, closed, same }));
  }
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-RAILS VERIFY: PASS (${checks.length} checks)` : `\nREORG-RAILS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
