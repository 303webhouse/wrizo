// THE REORG'S TOP RAIL (POLISH; Fable's GO, Nov 19 4:20 pm; plan step 2.1; claude/polish-reorg-toprail-plan.md sections 8 and 9, built to
// Cursor's prototype's top bar, docs/mockups/reorg/app.js renderBar and boardBar on cursor/reorg-prototype). Machina only, behind ?reorg=1.
//
// The top rail replaces the header row's CONTENT (LocationCrumb, ModeStrip and its PLAN door, the old Pages button) in the same row
// (.sprint-nav), on a Page, a screenplay and a Board. Left: where she is, as names, each editable in place where today's data carries it
// (Project = drawers.name through renameDrawer; a Doc she made = projects.title; a Part = pageSettings.name, Nick's ruling Nov 19, saved with
// the account). Right: the four stage buttons (Workshop hidden), or on a Board its views in their place, with "Connect Doc" after the Board's
// place; the search door at the end. Switch off (or any other theme): the app is unchanged.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and Top Drawer's app-made set):
//   Top Drawer   its app-made set: a page "Notes on the ledgers" (a one-Part Doc) and a screenplay (a one-Part Doc)
//   Grants       a set she made, "Budget": three pages and a board  -> one Doc, three Parts; the board serves Budget
//                a set she made of boards only, "Moodboards": a board -> a Board with no Doc
//   the Notebook (the hidden Journal): one page; and one loose page (Unfiled)
//
// OFF   O0  the golden of main's switch-off header row is committed beside this file (reorg-top-rail-off-golden.json, captured by
//           reorg-top-rail-capture.mjs on main + this file), with the tree it came from
//       O1  [theme x surface] switch OFF, Arbor, Flux and Machina, on a Part, a one-Part Doc, a screenplay, a Board: the header row is main's
//           DOM exactly
//       O2  [theme x surface] switch ON in Arbor and Flux: the same (the top rail is Machina's alone)
// SHELL T1  on a Part (Budget two): the names read Grants / Budget / "Part 2 of 3 · Budget two"; the stage buttons are the four stage keys in
//           Machina's words (Workshop absent); the search door is there; the PLAN door, the Pages button and the old crumb are gone
//       T2  a one-Part Doc: Top Drawer's word / the page's first line / "Part 1 of 1", no Part name
//       T3  the Notebook's page reads the Notebook's word, and the loose page Unfiled; neither is editable
//       T4  a screenplay: its names and the stage buttons as its strip has them (Build only live)
//       T5  a Board with a Doc: Grants / its name (today's rename control) / "Board · Budget"; Connect Doc stands after the place as a "+" box;
//           the Board's views stand where the stages stand; no stage buttons
//       T6  a Board with no Doc: "Board · no doc yet", and Connect Doc reads as a word
// NAMES R1  Project rename: click, type, Enter -> that Drawer's name and nothing else stored changes (every other collection identical)
//       R2  the Doc's rename (a set she made) -> that set's title only
//       R3  the Part's rename -> that page's pageSettings.name only (its text and every other key identical); emptied, the key is GONE, never ''
//       R4  a one-Part Doc's name is its page's pageSettings.name (one record, one name), and the Part line still names no Part
//       R5  Escape leaves the name and stores nothing; the rename opens in the same box (the row's height does not change)
//       R6  the stored name is what the rail reads after a reload
// CONNECT C1  Connect Doc opens a list: recent Docs first, then "A new doc"; picking one writes nothing (the connect write is HELD, Fable Nov 14
//           ruling B) and says so
// STAGES S1  cycling the stages from the top rail leaves the page's text identical and the stage is today's (data-mode-key active)
// PAGE  G1  [1366, 1920, 2000] the page's rect (column, paper, editor) is the same with the switch off, on at rest, with a rename open, with a
//           long name, and with the Connect list open on a Board's sibling page; the editor is the same node throughout
// SPEED K1  while she types 24 keys on a Part, the names render ZERO times (window.wrizoTopNamesRenders, a counter that exists only under the
//           switch; the left rail's method), and the counter is live (it counted the page's own first render)
// DEFAULT D1  "Set as my default" never carries a Part's name: store/pageDefaults.ts strips `name` at the door (source), and the live seam proves it
// WORDS W1  every top-rail string comes from the lexicon (terms.ts and the canonical table carry each key)
//
// CAPTURE (REORG_TOP_MODE=capture, through reorg-top-rail-capture.mjs): prints main's switch-off header rows, one GOLDEN line each.
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-top-rail.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const GOLDEN_FILE = path.join(HERE, 'reorg-top-rail-off-golden.json');
const CAPTURE = process.env.REORG_TOP_MODE === 'capture';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const THEMES = ['plateau', 'flux', 'machina'];
const SURFACES = { part: 'tr-g-2', one: 'tr-top-1', script: 'tr-top-s', board: 'tr-g-b' };

const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
// every collection the app keeps (persistence/core.ts KEYS), parsed, so a check can say exactly which records changed
const COLLECTIONS = "(() => { const out = {}; for (const k of ['writer-studio-projects', 'writer-studio-story-plans', 'writer-studio-sessions', 'writer-studio-drafts', 'writer-studio-journal-entries', 'writer-studio-drawers']) { if (localStorage.getItem(k) == null) continue; try { out[k] = JSON.parse(localStorage.getItem(k)); } catch { out[k] = localStorage.getItem(k); } } return out; })()";
const ROW = "(() => { const r = document.querySelector('.desk-frame-host > .sprint-nav, .desk-frame-host .chrome-top.sprint-nav'); if (!r) return null; const b = r.getBoundingClientRect(); return Math.round(b.height * 10) / 10; })()";

// what changed between two reads of the collections: [collection, id, keys that differ]
function diffStores(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k], y = b[k];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (!Array.isArray(x) || !Array.isArray(y)) { out.push([k, '*', ['(whole value)']]); continue; }
    const byId = (arr) => new Map(arr.map((r) => [r && r.id, r]));
    const mx = byId(x), my = byId(y);
    for (const id of new Set([...mx.keys(), ...my.keys()])) {
      const r1 = mx.get(id), r2 = my.get(id);
      if (JSON.stringify(r1) === JSON.stringify(r2)) continue;
      if (!r1 || !r2) { out.push([k, id, [r1 ? '(removed)' : '(added)']]); continue; }
      const keys = [...new Set([...Object.keys(r1), ...Object.keys(r2)])].filter((kk) => JSON.stringify(r1[kk]) !== JSON.stringify(r2[kk]));
      out.push([k, id, keys]);
    }
  }
  return out;
}
// the only change allowed: one record of one collection, and only these keys (updatedAt is the store's own stamp on every write)
const onlyChanged = (d, coll, id, keys) => d.length === 1 && d[0][0] === coll && d[0][1] === id && d[0][2].every((k) => keys.includes(k) || k === 'updatedAt');
// a write to a page in a set also stamps that set's resume pointer (F1, persistence/journal.ts stampPageActivity, on every page write: a star,
// a tag or Page setup alike): the page's record, plus at most that one set's lastActivityAt / lastActivePageId pointing at this page, nothing else
const onlyPageChanged = (d, after, pageId, keys) => {
  const page = d.filter((x) => x[0] === 'writer-studio-journal-entries');
  const rest = d.filter((x) => x[0] !== 'writer-studio-journal-entries');
  const entry = (after['writer-studio-journal-entries'] || []).find((e) => e.id === pageId);
  const set = entry && entry.projectId ? (after['writer-studio-projects'] || []).find((p) => p.id === entry.projectId) : null;
  return page.length === 1 && page[0][1] === pageId && page[0][2].every((k) => keys.includes(k) || k === 'updatedAt')
    && rest.every((x) => x[0] === 'writer-studio-projects' && !!set && x[1] === set.id && x[2].every((k) => ['updatedAt', 'lastActivityAt', 'lastActivePageId'].includes(k)) && set.lastActivePageId === pageId);
};

// ---- the fixture ---------------------------------------------------------------------------------------------------------------------------
let ids = null;
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
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
    const moods = W.wrizoCreateProject('Moodboards'); W.wrizoSetProjectDrawer(moods.id, grants.id);
    page('tr-top-1', 'Notes on the ledgers', { origin: 'project', projectId: ${q(top.set)}, orderIndex: 0 });
    W.wrizoCreateJournalPage({ id: 'tr-top-s', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: 'tr-top-s-h', heading: { id: 'tr-top-s-h', t: 'scene', text: '' }, body: [] }] }, createdAt: '2026-04-01T00:00:02.000Z', origin: 'project', projectId: ${q(top.set)}, orderIndex: 1, source: null });
    page('tr-g-1', 'Budget one', { origin: 'project', projectId: budget.id, orderIndex: 0 });
    page('tr-g-2', 'Budget two', { origin: 'project', projectId: budget.id, orderIndex: 1 });
    page('tr-g-3', 'Budget three', { origin: 'project', projectId: budget.id, orderIndex: 2 });
    page('tr-g-b', 'Budget board', { origin: 'project', projectId: budget.id, pageType: 'board', boxes: [] });
    page('tr-m-b', 'Mood board', { origin: 'project', projectId: moods.id, pageType: 'board', boxes: [] });
    page('tr-j-1', 'A journal page', { origin: 'journal' });
    page('tr-l-1', 'A loose page', { origin: 'loose' });
    W.wrizoFlushNow();
    return { grants: grants.id, budget: budget.id, moods: moods.id };
  })()`);
  ids = { topDrawer: top.drawer, topSet: top.set, ...made };
}

async function open(app, theme, reorg, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-frame-host .sprint-nav') && !!document.querySelector('.desk-frame-strip')", { label: `the surface ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const NORM = () => `(() => { const ids = ${q(ids)}; return (h) => { let s = h || ''; for (const [k, v] of Object.entries(ids)) if (v) s = s.split(v).join('{' + k + '}'); const seen = new Map(); return s.replace(/:r[0-9a-z]+:/g, (m) => { if (!seen.has(m)) seen.set(m, ':useid' + (seen.size + 1) + ':'); return seen.get(m); }); }; })()`;
const HEADER = () => `${NORM()}(document.querySelector('.desk-frame-host .sprint-nav')?.outerHTML ?? null)`;

// the top rail, read: every name (its text, whether it is editable), the Part line, the right half, the leavers
const READ_TOP = `(() => {
  const top = document.querySelector('.reorg-top');
  const nav = document.querySelector('.desk-frame-host .sprint-nav');
  const txt = (el) => el ? (el.textContent || '').replace(/\\s+/g, ' ').trim() : null;
  const names = {};
  if (top) for (const el of top.querySelectorAll('[data-top-name]')) names[el.getAttribute('data-top-name')] = { text: txt(el), editable: el.getAttribute('data-editable') === 'true' };
  return {
    top: !!top, kind: top && top.getAttribute('data-reorg-top'),
    names,
    partCount: txt(top && top.querySelector('[data-top-part-count]')),
    place: txt(top && top.querySelector('[data-top-place]')),
    connect: top && top.querySelector('[data-top-connect]') ? { text: txt(top.querySelector('[data-top-connect]')), icon: top.querySelector('[data-top-connect]').classList.contains('is-icon') } : null,
    stages: top ? [...top.querySelectorAll('.desk-mode-tab[data-mode-key]')].map((b) => ({ key: b.getAttribute('data-mode-key'), word: txt(b), live: b.getAttribute('aria-disabled') !== 'true' })) : [],
    views: !!(top && top.querySelector('.board-mode-strip')),
    search: !!(top && top.querySelector('[data-top-search]')),
    // the leavers' hidden struts (data-top-strut: zero width, hidden, out of the tab order) keep the row's height; they are not the controls
    planDoor: !!(nav && nav.querySelector('.page-plan-door:not([data-top-strut])')),
    pagesBtn: !!(nav && nav.querySelector('.sprint-toggle:not([data-top-strut])')),
    oldCrumb: !!(nav && nav.querySelector('.sprint-crumb')),
    workshop: !!(nav && nav.querySelector('[data-mode-key="workshop"]')),
  };
})()`;

async function rename(app, which, value, key = 'Enter') {
  const pressed = await app.evalJs(`(() => { const b = document.querySelector('.reorg-top [data-top-name=${q(which)}] button, .reorg-top button[data-top-name=${q(which)}]'); if (!b) return false; b.click(); return true; })()`);
  if (!pressed) return { opened: false };
  await sleep(200);
  const field = await app.evalJs(`(() => { const i = document.querySelector('.reorg-top input[data-top-rename=${q(which)}]'); if (!i) return null; return { focused: document.activeElement === i, value: i.value }; })()`);
  if (!field) return { opened: false };
  const rowOpen = await app.evalJs(ROW);
  await app.evalJs(`(() => { const i = document.querySelector('.reorg-top input[data-top-rename=${q(which)}]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${q(value)}); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new KeyboardEvent('keydown', { key: ${q(key)}, bubbles: true })); })()`);
  await sleep(500);
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null');
  await sleep(400);
  return { opened: true, field, rowOpen };
}

await withHarness(async (app) => {
  await seed(app);
  if (CAPTURE) {
    for (const theme of THEMES) for (const [s, id] of Object.entries(SURFACES)) {
      await open(app, theme, false, id);
      const h = await app.evalJs(HEADER());
      await open(app, theme, false, id);
      const again = await app.evalJs(HEADER());
      console.log(`GOLDEN ${theme}.${s} ${Buffer.from(h == null ? 'null' : h, 'utf8').toString('base64')}`);
      ok(`CAPTURE [${theme}.${s}]: two reads of main's switch-off header row agree`, h === again && h != null);
    }
    return;
  }

  // ---- OFF ---------------------------------------------------------------------------------------------------------------------------
  const golden = fs.existsSync(GOLDEN_FILE) ? JSON.parse(fs.readFileSync(GOLDEN_FILE, 'utf8')) : null;
  ok('O0: the golden of main\'s switch-off header row is committed beside this file, with the tree it was captured from', !!golden && /^[0-9a-f]{40}$/.test(golden.capturedFrom || '') && !!golden.surfaces, GOLDEN_FILE);
  for (const theme of THEMES) {
    for (const [s, id] of Object.entries(SURFACES)) {
      await open(app, theme, false, id);
      const h = await app.evalJs(HEADER());
      const want = golden && golden.surfaces[theme] && golden.surfaces[theme][s];
      ok(`O1 [${theme}.${s}]: switch OFF - the header row is main's DOM exactly`, !!want && h === want, h === want ? '' : `got ${String(h).slice(0, 300)}`);
      if (theme !== 'machina') {
        await open(app, theme, true, id);
        const hOn = await app.evalJs(HEADER());
        ok(`O2 [${theme}.${s}]: switch ON in ${theme} - still main's DOM exactly (the top rail is Machina's alone)`, !!want && hOn === want, hOn === want ? '' : `got ${String(hOn).slice(0, 300)}`);
      }
    }
  }

  // ---- SHELL ---------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'tr-g-2');
  let r = await app.evalJs(READ_TOP);
  ok('T1 a Part: Grants / Budget / "Part 2 of 3 · Budget two"; the four stages in Machina\'s words, Workshop absent; the search door; no PLAN door, Pages button or old crumb',
    r.top && r.kind === 'page' && r.names.project?.text === 'Grants' && r.names.doc?.text === 'Budget' && r.partCount === 'Part 2 of 3' && r.names.part?.text === 'Budget two'
      && JSON.stringify(r.stages.map((x) => x.key)) === '["freewrite","draft","revise","publish"]' && JSON.stringify(r.stages.map((x) => x.word)) === '["Sprint","Build","Edit","Finalize"]'
      && !r.workshop && r.search && !r.planDoor && !r.pagesBtn && !r.oldCrumb
      && r.names.project.editable && r.names.doc.editable && r.names.part.editable, r);
  // S1: the stages from the top rail
  const text0 = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'tr-g-2')?.text ?? null");
  const seen = [];
  for (const k of ['draft', 'revise', 'freewrite', 'draft']) {
    await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${k}"]')?.click(); null`);
    await sleep(700);
    seen.push(await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${k}"]')?.getAttribute('aria-selected')`));
  }
  await sleep(1300);
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null');
  const text1 = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'tr-g-2')?.text ?? null");
  ok('S1 the stages pressed in the top rail switch the stage (each reads active) and the page\'s text is identical', seen.every((x) => x === 'true') && text0 === text1 && text0 === 'Budget two', { seen, text0, text1 });

  await open(app, 'machina', true, 'tr-top-1');
  r = await app.evalJs(READ_TOP);
  const rootWord = await app.evalJs("document.querySelector('.reorg-top [data-top-name=\"project\"]')?.textContent?.trim() ?? null");
  ok('T2 a one-Part Doc: Top Drawer\'s word / its first line / "Part 1 of 1", with no Part name',
    r.top && !!rootWord && r.names.doc?.text === 'Notes on the ledgers' && r.partCount === 'Part 1 of 1' && !r.names.part && r.names.doc.editable, r);

  await open(app, 'machina', true, 'tr-j-1');
  const rj = await app.evalJs(READ_TOP);
  await open(app, 'machina', true, 'tr-l-1');
  const rl = await app.evalJs(READ_TOP);
  ok('T3 the Notebook\'s page reads the Notebook\'s word and the loose page "Unfiled"; neither place is editable',
    rj.top && rl.top && rj.names.project && !rj.names.project.editable && rl.names.project?.text === 'Unfiled' && !rl.names.project.editable && rj.names.doc?.text === 'A journal page', { rj, rl });

  await open(app, 'machina', true, 'tr-top-s');
  r = await app.evalJs(READ_TOP);
  ok('T4 a screenplay: its names, and the stage buttons as its strip has them (Build the only live one)',
    r.top && r.kind === 'script' && !!r.names.project && !!r.names.doc && r.partCount === 'Part 1 of 1' && r.stages.length === 4 && r.stages.filter((x) => x.live).map((x) => x.key).join(',') === 'draft,publish' && !r.pagesBtn && !r.oldCrumb, r);

  await open(app, 'machina', true, 'tr-g-b');
  r = await app.evalJs(READ_TOP);
  ok('T5 a Board with a Doc: Grants / its name (today\'s rename control) / "Board · Budget"; Connect Doc after the place as a "+" box; its views in the stages\' place, no stages',
    r.top && r.kind === 'board' && r.names.project?.text === 'Grants' && r.names.board?.text === 'Budget board' && r.place === 'Board · Budget' && r.connect && r.connect.icon && r.connect.text === '+'
      && r.views && r.stages.length === 0 && r.search && !r.oldCrumb, r);

  await open(app, 'machina', true, 'tr-m-b');
  r = await app.evalJs(READ_TOP);
  ok('T6 a Board with no Doc: "Board · no doc yet", and Connect Doc reads as a word', r.top && r.place === 'Board · no doc yet' && r.connect && !r.connect.icon && /Connect Doc/.test(r.connect.text || ''), r);

  // ---- CONNECT -------------------------------------------------------------------------------------------------------------------------
  const before = await app.evalJs(COLLECTIONS);
  await app.evalJs("document.querySelector('.reorg-top [data-top-connect]')?.click(); null");
  await sleep(400);
  const list = await app.evalJs("(() => { const l = document.querySelector('[data-top-connect-list]'); if (!l) return null; return { rows: [...l.querySelectorAll('[data-connect-row]')].map((b) => [b.getAttribute('data-connect-row'), (b.textContent || '').trim()]) }; })()");
  await app.evalJs("document.querySelector('[data-top-connect-list] [data-connect-row]')?.click(); null");
  await sleep(400);
  const said = await app.evalJs("document.querySelector('[data-top-connect-said]')?.textContent?.trim() ?? null");
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null');
  await sleep(400);
  const after = await app.evalJs(COLLECTIONS);
  const dc = diffStores(before, after);
  ok('C1 Connect Doc lists recent Docs first, then "A new doc"; picking one writes nothing and says what it would do',
    !!list && list.rows.length >= 2 && list.rows[list.rows.length - 1][0] === 'new' && list.rows.slice(0, -1).every((x) => x[0] === 'doc') && !!said && dc.length === 0, { list, said, dc });

  // ---- NAMES ---------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'tr-g-2');
  const rowRest = await app.evalJs(ROW);
  let s0 = await app.evalJs(COLLECTIONS);
  let res = await rename(app, 'project', 'Grants and bids');
  let s1 = await app.evalJs(COLLECTIONS);
  let d = diffStores(s0, s1);
  ok('R1 the Project\'s rename writes that Drawer\'s name and nothing else stored', res.opened && onlyChanged(d, 'writer-studio-drawers', ids.grants, ['name'])
    && s1['writer-studio-drawers'].find((x) => x.id === ids.grants).name === 'Grants and bids', { res, d });
  ok('R5a the rename opens in the same box: the field takes the name, focused, and the row\'s height does not change', res.opened && res.field?.focused && res.field?.value === 'Grants' && res.rowOpen === rowRest, { res, rowRest });

  s0 = s1;
  res = await rename(app, 'doc', 'Budget, revised');
  s1 = await app.evalJs(COLLECTIONS);
  d = diffStores(s0, s1);
  ok('R2 the Doc\'s rename (a set she made) writes that set\'s title only', res.opened && onlyChanged(d, 'writer-studio-projects', ids.budget, ['title'])
    && s1['writer-studio-projects'].find((x) => x.id === ids.budget).title === 'Budget, revised', d);

  s0 = s1;
  const entriesKey = 'writer-studio-journal-entries';
  res = await rename(app, 'part', 'The second part');
  s1 = await app.evalJs(COLLECTIONS);
  d = diffStores(s0, s1);
  const e1 = s1[entriesKey]?.find((e) => e.id === 'tr-g-2');
  const e0 = s0[entriesKey]?.find((e) => e.id === 'tr-g-2');
  const settingsOnlyName = e0 && e1 && JSON.stringify({ ...(e1.pageSettings || {}), name: undefined }) === JSON.stringify({ ...(e0.pageSettings || {}), name: undefined });
  ok('R3a the Part\'s rename writes pageSettings.name on that page only (beside the set\'s own F1 resume stamp): its text and every other setting identical',
    res.opened && onlyPageChanged(d, s1, 'tr-g-2', ['pageSettings']) && e1.pageSettings?.name === 'The second part' && e1.text === e0.text && settingsOnlyName, { d, ps: e1 && e1.pageSettings });
  const shown = await app.evalJs(READ_TOP);
  ok('R3b the Part line now reads the stored name', shown.names.part?.text === 'The second part' && shown.partCount === 'Part 2 of 3', shown);
  s0 = s1;
  res = await rename(app, 'part', '   ');
  s1 = await app.evalJs(COLLECTIONS);
  const e2 = s1[entriesKey]?.find((e) => e.id === 'tr-g-2');
  ok('R3c an emptied Part name removes the key (never \'\' or null), and the line falls back to the first line', res.opened && !!e2 && !('name' in (e2.pageSettings || {}))
    && (await app.evalJs(READ_TOP)).names.part?.text === 'Budget two', e2 && e2.pageSettings);

  s0 = await app.evalJs(COLLECTIONS);
  res = await rename(app, 'doc', 'Never kept', 'Escape');
  s1 = await app.evalJs(COLLECTIONS);
  const esc = await app.evalJs(READ_TOP);
  ok('R5b Escape leaves the name as it was and stores nothing', res.opened && diffStores(s0, s1).length === 0 && esc.names.doc?.text === 'Budget, revised' && !(await app.evalJs("!!document.querySelector('.reorg-top input[data-top-rename]')")), diffStores(s0, s1));

  await open(app, 'machina', true, 'tr-top-1');
  s0 = await app.evalJs(COLLECTIONS);
  res = await rename(app, 'doc', 'Ledger notes');
  s1 = await app.evalJs(COLLECTIONS);
  d = diffStores(s0, s1);
  const one = s1[entriesKey]?.find((e) => e.id === 'tr-top-1');
  const oneRead = await app.evalJs(READ_TOP);
  ok('R4 a one-Part Doc\'s name is its page\'s pageSettings.name (one record, one name); the Part line still names no Part',
    res.opened && onlyPageChanged(d, s1, 'tr-top-1', ['pageSettings']) && one.pageSettings?.name === 'Ledger notes' && one.text === 'Notes on the ledgers' && oneRead.names.doc?.text === 'Ledger notes' && oneRead.partCount === 'Part 1 of 1' && !oneRead.names.part, { d, oneRead });

  await open(app, 'machina', true, 'tr-g-2');
  const kept = await app.evalJs(READ_TOP);
  ok('R6 after a reload the rail reads what was stored', kept.names.project?.text === 'Grants and bids' && kept.names.doc?.text === 'Budget, revised', kept);

  // ---- PAGE ----------------------------------------------------------------------------------------------------------------------------
  const geo = {};
  for (const w of [1366, 1920, 2000]) {
    await open(app, 'machina', false, 'tr-g-3', w);
    const off = await app.evalJs(PAGE);
    await open(app, 'machina', true, 'tr-g-3', w);
    await app.evalJs("window.__trEditor = document.querySelector('.forward-only-editor'); null");
    const rest = await app.evalJs(PAGE);
    await app.evalJs("document.querySelector('.reorg-top [data-top-name=\"doc\"] button')?.click(); null");
    await sleep(250);
    const renaming = await app.evalJs(PAGE);
    await app.evalJs(`(() => { const i = document.querySelector('.reorg-top input[data-top-rename]'); if (!i) return; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${q('A very long name for a doc that keeps on going well past the width any header row could give it, and then some more')}); i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(250);
    const long = await app.evalJs(PAGE);
    await app.evalJs("(() => { const i = document.querySelector('.reorg-top input[data-top-rename]'); i && i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); })()");
    await sleep(250);
    const same = await app.evalJs("document.querySelector('.forward-only-editor') === window.__trEditor");
    geo[w] = { off, rest, renaming, long, same };
  }
  ok('G1 [1366, 1920, 2000] the page\'s rect is the same with the switch off, on at rest, with a rename open and with a long name; the editor is the same node',
    Object.values(geo).every((g) => g.off && g.off === g.rest && g.rest === g.renaming && g.rest === g.long && g.same), geo);

  // ---- SPEED -------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'tr-g-1');
  // a Part opens in Build; she types in Sprint (Free Write's editor), as the left rail's speed check does; the switch's re-persist lands ~1.1 s later
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"freewrite\"]')?.click(); null");
  await sleep(1300);
  const live0 = await app.evalJs('window.wrizoTopNamesRenders ? window.wrizoTopNamesRenders() : null');
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null");
  await sleep(300);
  const k0 = await app.evalJs('window.wrizoTopNamesRenders ? window.wrizoTopNamesRenders() : null');
  for (const ch of 'and a few more words here') { await app.typeKeys(ch); await sleep(50); }
  await sleep(150);
  const k1 = await app.evalJs('window.wrizoTopNamesRenders ? window.wrizoTopNamesRenders() : null');
  await sleep(1200);
  const typedSaved = await app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'tr-g-1') || {}).text || ''");
  ok('K1 the names render ZERO times while she types 24 keys (the counter is live: it counted the first render of the page), and the typing is saved',
    typeof live0 === 'number' && live0 > 0 && k0 !== null && k1 === k0 && /few more words/.test(typedSaved), { live0, k0, k1, typedSaved });

  // ---- DEFAULT -------------------------------------------------------------------------------------------------------------------------
  const live = await app.evalJs(`(() => { if (!window.wrizoPageDefaultsDress) return 'no seam'; const out = window.wrizoPageDefaultsDress({ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }, name: 'One page only' }); return out && !('name' in out) ? 'stripped' : JSON.stringify(out); })()`);
  const pd = fs.readFileSync(path.join(SRC, 'store', 'pageDefaults.ts'), 'utf8');
  ok('D1 "Set as my default" never carries a Part\'s name: pageDefaults strips `name` at the door (source and the live seam)',
    /const \{[^}]*\bname\b[^}]*\} = v as PageSettings/.test(pd) && live === 'stripped', live);
});

// ---- WORDS (source) ------------------------------------------------------------------------------------------------------------------
if (!CAPTURE) {
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const top = fs.existsSync(path.join(SRC, 'reorg', 'TopRail.tsx')) ? fs.readFileSync(path.join(SRC, 'reorg', 'TopRail.tsx'), 'utf8') : '';
  const used = [...new Set([...top.matchAll(/\bt\('([a-zA-Z0-9]+)'\)/g)].map((m) => m[1]))];
  const missing = used.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon));
  const quoted = [...top.matchAll(/>\s*([A-Z][a-z]+(?: [a-z]+)+)\s*</g)].map((m) => m[1]);
  ok('W1 every top-rail word is a lexicon key (terms.ts and the canonical table), and no sentence is written into the component', used.length >= 6 && missing.length === 0 && quoted.length === 0, { used: used.length, missing, quoted });
}

if (CAPTURE) {
  console.log(checks.map((c) => `${c.pass ? 'PASS' : 'FAIL'} ${c.name}`).join('\n'));
  console.log(`\nREORG-TOP-RAIL CAPTURE: ${checks.every((c) => c.pass) ? 'DONE' : 'UNSTABLE'}`);
  process.exit(0);
}
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 1 + THEMES.length * 4 + 2 * 4 + 6 + 1 + 1 + 9 + 1 + 1 + 1 + 1;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-TOP-RAIL VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-TOP-RAIL VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
