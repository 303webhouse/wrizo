// BIG PROJECTS, STEP 2 - THE BOARDS POP-OUT (docs/plans/big-projects.md; Fable Oct 19: "1a and step 2 ship in ONE release. Start step 2 now (checks red first)").
// The Boards tab (category id `plan`, label Boards) becomes the Pages pop-out's mirror: where you are, + New Board, the place's boards as SECTIONS in the writer's own
// order (set headings once a second set exists, a set with no boards absent, the current set open and the others folded to one row with a count), + New set, X out to the
// Journal with Undo, and PRESETS - the deck library, one row per deck. The board's starter buttons become New Card, Templates, Connect Pages (no New Page on a board).
//
// SCHEMA CHANGE: NONE. The one new thing is an address field: the unborn descriptor gains `deck`, so a preset opens a new board with that deck's wizard already on its first
// question. Nothing is stored.
//
// WRITTEN BEFORE THE BUILD, and red on the tree that is step 1a alone (the checks below that name `deck`, the Boards mode, the starter row and the preset flow).
//   PART 1  (browserless)  the REAL store (persistence + place + unbornPage) bundled with esbuild: the `deck` descriptor round-trips and a blank or unknown one degrades to none;
//                          the boards view of the place is the writer's order and never writes; X and Undo work for a BOARD exactly as for a page; mutants with their landing asserted
//   PART 1b (browserless)  source pins: the pop-out has a boards mode and PlanPanel renders it; the starter row has no New Page; the presets are the deck library (no second list);
//                          the editor opens the wizard from the address once; the wizard can start at a deck
//   PART 2  (a box turn)   the real app: the Boards pop-out, a row opens its board, X and Undo, a pointer reorder that survives a reload, + New Board files into the set,
//                          a preset opens that deck's wizard and deals into a board filed in the set, the empty board's starters read exactly New Card / Templates / Connect Pages
//
// Run: node scripts/harness/big-projects-2.mjs   (from apps/desktop; PART 2 needs a box turn)      BROWSERLESS_ONLY=1 runs PART 1 / 1b alone
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(SRC, rel));
const rd = (rel) => (exists(rel) ? read(rel) : '');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- the real store, bundled against a fake browser (big-projects-1a.mjs's pattern) ------------------------------------------------------------------------------------------
let nonce = 0;
async function load(overrides = {}) {
  nonce += 1;
  const res = await build({
    stdin: { contents: `export const __nonce = ${nonce};\nexport * from './store/persistence';\nexport * from './store/place';\nexport { readDescriptor, unbornHref } from './store/unbornPage';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    nodePaths: [path.join(DESKTOP, 'node_modules')],
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = path.relative(SRC, args.path).split('\\').join('/');
        const text = noCR(fs.readFileSync(args.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
}
async function tryLoad(overrides) { try { return { m: await load(overrides) }; } catch (e) { return { err: String((e && e.message) || e).split('\n')[0].slice(0, 220) }; } }

const board = (m, id, o = {}) => m.createJournalPage({ id, text: id, pageType: 'board', boxes: [], origin: null, source: null, ...o });

async function suite(m, mk = () => load()) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };

  // ---- U: the `deck` descriptor (the one new thing in the address) -------------------------------------------------------------------------------------------------------
  const d1 = m.readDescriptor('?kind=board&deck=three-act&binder=s1');
  keep('U1', d1.deck === 'three-act' && d1.kind === 'board' && d1.binderId === 's1', JSON.stringify(d1));
  keep('U1b', m.readDescriptor('').deck === null && m.readDescriptor('?deck=').deck === null && m.readDescriptor('?deck=%20').deck === null, 'blank or missing is none');
  const href = m.unbornHref({ kind: 'board', deck: 'worldbuilding', binderId: 's9' });
  keep('U2', /^\/page\/new\?/.test(href) && /[?&]deck=worldbuilding(&|$)/.test(href) && m.readDescriptor(href.slice(href.indexOf('?'))).deck === 'worldbuilding', href);
  keep('U2b', !/deck=/.test(m.unbornHref({ kind: 'board' })) && !/deck=/.test(m.unbornHref({})), 'no deck, no field in the address');

  // ---- S: the boards view of a place ----------------------------------------------------------------------------------------------------------------------------------------
  const d = m.createDrawer('The Late Ferry');
  const man = m.createProject('Manuscript', 'creative'); m.setProjectDrawer(man.id, d.id);
  const wor = m.createProject('Worldbuilding', 'creative'); m.setProjectDrawer(wor.id, d.id);
  m.createJournalPage({ id: 'pg1', text: 'pg1', projectId: man.id, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
  board(m, 'bd1', { projectId: man.id, origin: 'project', createdAt: '2026-01-02T00:00:01.000Z' });
  board(m, 'bd2', { projectId: man.id, origin: 'project', createdAt: '2026-01-02T00:00:02.000Z' });
  board(m, 'bd3', { projectId: man.id, origin: 'project', createdAt: '2026-01-02T00:00:03.000Z' });
  board(m, 'bw1', { projectId: wor.id, origin: 'project', createdAt: '2026-01-02T00:00:04.000Z' });
  board(m, 'loose-bd', { origin: 'loose', createdAt: '2026-01-02T00:00:05.000Z' });
  const place = { kind: 'drawer', id: d.id };
  const secs = m.sectionsOf(place, 'boards');
  keep('S1', secs.length === 2 && same(secs[0].items.map((e) => e.id), ['bd1', 'bd2', 'bd3']) && same(secs[1].items.map((e) => e.id), ['bw1']) && secs.every((g) => g.items.every((e) => e.pageType === 'board')), JSON.stringify(secs.map((g) => [g.set && g.set.title, g.items.map((e) => e.id)])));
  keep('S1b', m.sectionsOf(place, 'pages').length === 1 && m.sectionsOf(place, 'pages')[0].items.every((e) => e.pageType !== 'board'), 'the Pages view carries no board');
  const jb = m.sectionsOf({ kind: 'journal', id: 'journal' }, 'boards');
  keep('S2', jb.length === 1 && same(jb[0].items.map((e) => e.id), ['loose-bd']), JSON.stringify(jb.map((g) => g.items.map((e) => e.id))));
  const n = m.reorderSections(['bd3', 'bd1', 'bd2']);
  keep('S3', n === 3 && same(m.sectionsOf(place, 'boards')[0].items.map((e) => e.id), ['bd3', 'bd1', 'bd2']) && m.getJournalEntry('bw1').orderIndex === undefined, 'a board reorder writes only the ids it is given');
  keep('S3c', m.reorderSections(['bd3', 'bd1', 'bd2']) === 0, 'an unchanged order writes nothing');
  const snap = JSON.stringify(m.getJournalEntries().map((e) => [e.id, e.projectId ?? null, e.orderIndex ?? null]).sort());
  m.sectionsOf(place, 'boards'); m.sectionsOf(place, 'pages'); m.showSetHeadings(place);
  keep('S3b', snap === JSON.stringify(m.getJournalEntries().map((e) => [e.id, e.projectId ?? null, e.orderIndex ?? null]).sort()), 'viewing never writes');

  // ---- X: a board out to the Journal, and Undo ---------------------------------------------------------------------------------------------------------------------------
  const tok = m.moveToJournal('bd1');
  keep('X1', !!tok && m.getJournalEntry('bd1').projectId === null && m.getJournalEntry('bd1').orderIndex === 1 && m.journalMembers().some((e) => e.id === 'bd1') && m.getJournalEntry('bd1').deletedAt === undefined, JSON.stringify({ p: m.getJournalEntry('bd1').projectId, oi: m.getJournalEntry('bd1').orderIndex }));
  keep('X1b', same(m.sectionsOf({ kind: 'journal', id: 'journal' }, 'boards')[0].items.map((e) => e.id).sort(), ['bd1', 'loose-bd']), 'it shows in the Journal place\'s Boards');
  keep('X2', m.undoMoveToJournal(tok) === true && m.getJournalEntry('bd1').projectId === man.id && same(m.sectionsOf(place, 'boards')[0].items.map((e) => e.id), ['bd3', 'bd1', 'bd2']), 'same set, same position');
  const t2 = m.moveToJournal('bd2'); m.softDeleteEntry('bd2');
  keep('X3', m.undoMoveToJournal(t2) === false && m.getJournalEntry('bd2') === null, 'a board deleted meanwhile is left alone');
  return r;
}

const MUTANTS = [
  { name: 'the address drops the deck', file: 'store/unbornPage.ts', from: "if (d.deck) q.set('deck', d.deck);", to: '', red: ['U2'] },
  { name: 'a blank deck is read as a deck', file: 'store/unbornPage.ts', from: "deck: rawDeck && rawDeck.trim() ? rawDeck.trim() : null,", to: 'deck: rawDeck,', red: ['U1b'] },
  { name: 'the Boards view lists pages too', file: 'store/place.ts', from: "const isBoard = (e: JournalEntry): boolean => e.pageType === 'board';", to: "const isBoard = (e: JournalEntry): boolean => true;", red: ['S1', 'S1b'] },
  { name: 'reorder writes every id', file: 'store/place.ts', from: 'if (e.orderIndex === i) return;', to: '', red: ['S3c'] },
];

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const loaded = await tryLoad();
if (!loaded.m) {
  ok('PART 1 loads the real store with the deck descriptor', false, loaded.err);
} else {
  const res = await suite(loaded.m);
  for (const [k, v] of Object.entries(res)) ok(`${k}`, v.pass, v.detail);
  const landed = { n: 0, killed: 0 };
  for (const mu of MUTANTS) {
    const src = read(mu.file);
    const i = src.indexOf(mu.from);
    if (i < 0 || src.indexOf(mu.from, i + 1) >= 0) { ok(`mutant "${mu.name}": the mutation LANDED (anchor found exactly once)`, false, 'anchor missing or not unique'); continue; }
    landed.n += 1;
    const ov = { [mu.file]: (t) => t.replace(mu.from, mu.to) };
    const mm = await tryLoad(ov);
    const rr = mm.m ? await suite(mm.m, () => load(ov)) : {};
    const went = mu.red.filter((k) => !rr[k] || !rr[k].pass);
    ok(`mutant "${mu.name}" is KILLED (reddens: ${mu.red.join(', ')})`, went.length === mu.red.length, `red: ${went.join(', ') || 'none'}`);
    if (went.length === mu.red.length) landed.killed += 1;
  }
  ok(`all ${MUTANTS.length} mutations landed and ${MUTANTS.length} were killed`, landed.n === MUTANTS.length && landed.killed === MUTANTS.length, `${landed.n} landed / ${landed.killed} killed`);
}

// ---- PART 1b: source pins ---------------------------------------------------------------------------------------------------------------------------------------------
const popout = rd('components/SectionsPopout.tsx');
const panels = rd('components/CascadePanels.tsx');
const editor = rd('components/BoardEditor.tsx');
const wizard = rd('components/DeckWizard.tsx');
const unborn = rd('store/unbornPage.ts');
const lex = rd('store/deskLexicon.ts');
const doors = editor.slice(editor.indexOf('const beginningDoors: BeginningDoor[]'), editor.indexOf('// FX5 S4 (c)'));
const planBody = panels.slice(panels.indexOf('function PlanPanel('), panels.indexOf('// Per-board quiet disclosure'));

ok('Q1 the pop-out has a boards mode: a `view` prop of pages | boards, a data-kind that follows it, and sectionsOf is asked for that view', /view\??: 'pages' \| 'boards'/.test(popout) && /data-kind=\{view\}/.test(popout) && /sectionsOf\(place, view\)/.test(popout), '');
ok('Q2 the Boards tab renders the pop-out in boards mode, and the old creation doors (Create a Board, Plot a Story) and the no-project lead are gone from it', /<SectionsPopout[^>]*view="boards"/.test(planBody) && !/cascadePlanCreateBoard|cascadePlanPlotStory|cascadePlanNoProject/.test(planBody), '');
ok('Q3 the connected-boards zone (PW1) stays inside the Boards tab until step 3 moves it to Grafts: still rendered, still keyed by data-link-entry rows', /connectedBoardsFor\(/.test(planBody) && /data-link-entry=\{row\.id\}/.test(panels), '');
ok('Q4 the empty board\'s starters are New Card, Templates, Connect Pages - the default branch of the door table has no newPageCard (the sliver keeps its own tool)', exists('components/BoardEditor.tsx') && /key: 'newCard'[\s\S]*key: 'loadDeck'[\s\S]*key: 'connectPage'/.test(doors) && (doors.match(/key: 'newPageCard'/g) || []).length === 0, `newPageCard x${(doors.match(/key: 'newPageCard'/g) || []).length}`);
ok('Q5 the presets ARE the deck library: the pop-out imports DECKS and names each row by the deck\'s own nameTerm - there is no second list of deck names', /import \{ DECKS \} from '\.\.\/decks\/library'/.test(popout) && /DECKS\.map\(/.test(popout) && /deck\.nameTerm/.test(popout), '');
ok('Q6 a preset opens a new board in the place with its deck in the address (unbornHref carries deck), and presses nothing else', /deck: deck\.id/.test(popout) && /kind: 'board'/.test(popout), '');
ok('Q7 the address carries the deck: the descriptor has a `deck` field, written and read by unbornHref / readDescriptor', /deck: string \| null/.test(unborn) && /q\.set\('deck'/.test(unborn) && /q\.get\('deck'\)/.test(unborn), '');
ok('Q8 the editor opens the wizard ONCE from the address while the board is unborn, and the wizard can start at a deck (startDeckId: no library step)', /descriptor\.deck/.test(editor) && /startDeckId/.test(editor) && /startDeckId/.test(wizard), '');
ok('Q9 the Boards rows keep the connector contract and use no native drag: data-link-entry on every row, reorder on pointer events (the same component as the Pages rows)', /data-link-entry=\{e\.id\}/.test(popout) && !/draggable/.test(popout) && /onPointerDown/.test(popout), '');
ok('Q10 a board section can leave its set with X (moveToJournal) and the more-menu "Place on this board" is a PAGES-mode act only: no board is ever placed on a board from the Boards tab', /moveToJournal/.test(popout) && /view === 'pages' && boardId/.test(popout), '');
ok('Q11 the lexicon: Arbor words for the board door, the empty line and the Boards heading exist', /sectionsNewBoard:/.test(lex) && /sectionsEmptyBoards:/.test(lex), '');

// ================================================================================================================================================================================
// PART 2 - the real app (a box turn). DOM contract (shared with big-projects-1a.mjs's Pages pop-out):
//   Boards tab        [data-category=plan] opens .wz-sections[data-kind="boards"]: .wz-sections-place, button.wz-cascade-action-door "New Board", .wz-set-head, rows .wz-section-row[data-entry-id][data-link-entry]
//                     with .wz-section-grip / .wz-section-open / .wz-section-x, .wz-sections-undo button, button.wz-sections-newset, .wz-sections-presets button[data-preset=<deck id>]
//   empty board       .wz-beginnings[data-beginnings="board"] .wz-beginning[data-beginning=newCard|loadDeck|connectPage]
//   deck wizard       .deck-wizard-dialog (no library step: .deck-wizard-deck-row absent) with the preset's own first question
// ================================================================================================================================================================================
async function part2() {
  process.env.WS_PLACE = '0';
  const { withHarness } = await import('../runtime-verify.mjs');
  await withHarness(async (app) => {
    const sleep = sleepMs;
    const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
    const rows = async () => { await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()'); return app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')"); };
    const click = async (sel) => {
      const pt = await app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const h = document.elementFromPoint(x, y); return h && (h === b || b.contains(h)) ? { x, y } : null; })()`);
      if (!pt) return false;
      await app.mouseMove(pt.x, pt.y); await app.mouseDown(pt.x, pt.y); await sleep(50); await app.mouseUp(pt.x, pt.y); await sleep(350);
      return true;
    };
    const fresh = async () => {
      await app.emulateDpr(1, 1400, 900);
      await app.goto('/');
      await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
      await app.reload();
      await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
      await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
      await sleep(900);
    };
    const seed = async () => {
      await app.evalJs(`(() => { const d1 = window.wrizoCreateDrawer('The Late Ferry'); const man = window.wrizoCreateProject('Manuscript', 'creative'); const wor = window.wrizoCreateProject('Worldbuilding', 'creative');
        window.wrizoSetProjectDrawer(man.id, d1.id); window.wrizoSetProjectDrawer(wor.id, d1.id); window.__bp = { d1: d1.id, man: man.id, wor: wor.id }; })()`);
      for (const [id, pid, at, type] of [['b2-pg', 'man', '00', undefined], ['b2-bd1', 'man', '01', 'board'], ['b2-bd2', 'man', '02', 'board'], ['b2-bd3', 'man', '03', 'board'], ['b2-bw1', 'wor', '04', 'board']]) {
        await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: type ? `Board ${id}` : `Words of ${id}`, projectId: null, origin: 'project', source: 'page', createdAt: `2026-01-01T00:00:${at}.000Z`, ...(type ? { pageType: 'board', boxes: [] } : {}) })}); window.wrizoPatchEntry(${JSON.stringify(id)}, { projectId: window.__bp.${pid} })`);
      }
      await app.evalJs('window.wrizoFlushNow()'); await sleep(500);
    };
    const open = async (id, ready = ".forward-only-editor, .board-canvas") => { await app.evalJs(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${ready}')`, { label: 'surface' }); await sleep(900); };
    const ids = () => app.evalJs("[...document.querySelectorAll('.wz-sections[data-kind=boards] .wz-section-row')].map((r) => r.dataset.entryId).join()");

    await fresh(); await seed(); await open('b2-pg');
    // ---- Y1: the pop-out ------------------------------------------------------------------------------------------------------------------------------------------------------
    await click('[data-category=plan]');
    const y1 = await app.evalJs(`(() => { const r = document.querySelector('.wz-sections[data-kind=boards]'); if (!r) return null; return { place: r.querySelector('.wz-sections-place')?.textContent, door: r.querySelector('.wz-cascade-action-door')?.textContent.trim(), heads: [...r.querySelectorAll('.wz-set-head')].map((h) => h.getAttribute('aria-expanded')), rows: [...r.querySelectorAll('.wz-section-row')].map((x) => x.dataset.entryId), pages: r.querySelectorAll('[data-entry-id=b2-pg]').length, presets: [...r.querySelectorAll('.wz-sections-preset')].map((b) => b.dataset.preset), title: document.querySelector('.wz-cascade-panel-title')?.textContent }; })()`);
    ok('Y1 the Boards tab opens the pop-out in boards mode: the place name, a New Board door, two set headings (the current set open, the other folded), only boards (no page), titled Boards', !!y1 && y1.place === 'The Late Ferry' && y1.door === 'New Board' && same(y1.heads, ['true', 'false']) && same(y1.rows, ['b2-bd1', 'b2-bd2', 'b2-bd3']) && y1.pages === 0 && y1.title === 'Boards', JSON.stringify(y1));
    ok('Y1 the presets are the seven decks, in the library\'s own order', !!y1 && same(y1.presets, ['three-act', 'worldbuilding', 'feature-screenplay', 'thesis', 'grant', 'feature-story', 'character-study']), JSON.stringify(y1 && y1.presets));
    ok('Y1 every row declares data-link-entry equal to its entry (the connector\'s target) and none is natively draggable', (await app.evalJs("[...document.querySelectorAll('.wz-sections[data-kind=boards] .wz-section-row')].every((r) => r.dataset.linkEntry === r.dataset.entryId && !r.closest('[draggable=\"true\"]'))")) === true, '');

    // ---- Y2: a row opens its board -------------------------------------------------------------------------------------------------------------------------------------------
    await click('.wz-sections[data-kind=boards] .wz-section-row[data-entry-id="b2-bd2"] .wz-section-open');
    await waitSoft("location.hash === '#/page/b2-bd2'", { label: 'board opened', timeout: 5000 });
    ok('Y2 pressing a row OPENS that board', (await app.evalJs('location.hash')) === '#/page/b2-bd2', await app.evalJs('location.hash'));

    // ---- Y3: X out to the Journal, and Undo ----------------------------------------------------------------------------------------------------------------------------------
    await sleep(600); await click('[data-category=plan]');
    const before = (await rows()).find((e) => e.id === 'b2-bd3');
    const clickedX = await click('.wz-sections[data-kind=boards] .wz-section-row[data-entry-id="b2-bd3"] .wz-section-x');
    const moved = (await rows()).find((e) => e.id === 'b2-bd3');
    ok('Y3 X on a board takes it out of the Drawer and into the Journal: only projectId changes, nothing is deleted, an Undo line appears', clickedX && moved.projectId === null && moved.orderIndex === before.orderIndex && !moved.deletedAt && (await app.evalJs("!!document.querySelector('.wz-sections-undo')")) === true, JSON.stringify({ clickedX, p: moved && moved.projectId }));
    await click('.wz-sections-undo button'); await sleep(300);
    const back = (await rows()).find((e) => e.id === 'b2-bd3');
    ok('Y3 Undo puts the board back in the same set and position', back.projectId === before.projectId && (await ids()) === 'b2-bd1,b2-bd2,b2-bd3', JSON.stringify({ p: back.projectId, ids: await ids() }));

    // ---- Y4: a pointer reorder survives a reload ----------------------------------------------------------------------------------------------------------------------------
    const grip = (id) => app.evalJs(`(() => { const g = document.querySelector('.wz-sections[data-kind=boards] .wz-section-row[data-entry-id="${id}"] .wz-section-grip'); if (!g) return null; const b = g.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), h: b.height }; })()`);
    const a = await grip('b2-bd3'); const t = await grip('b2-bd1');
    if (a && t) {
      await app.mouseMove(a.x, a.y); await app.mouseDown(a.x, a.y);
      for (let k = 1; k <= 8; k += 1) { await app.mouseMove(a.x, Math.round(a.y + ((t.y - a.y) * k) / 8)); await sleep(30); }
      await app.mouseUp(a.x, t.y - Math.round(t.h / 3)); await sleep(500);
    }
    ok('Y4 a pointer drag on a board row\'s grip reorders it', (await ids()) === 'b2-bd3,b2-bd1,b2-bd2', await ids());
    await app.evalJs('window.wrizoFlushNow()'); await sleep(500); await app.reload();
    await waitSoft("!!document.querySelector('.board-canvas')", { label: 'board after reload' }); await sleep(900);
    await click('[data-category=plan]');
    ok('Y4 ...and the order survives a reload', (await ids()) === 'b2-bd3,b2-bd1,b2-bd2', await ids());

    // ---- Y5: + New Board files into where the writer is -----------------------------------------------------------------------------------------------------------------------
    await click('.wz-sections[data-kind=boards] .wz-cascade-action-door');
    await waitSoft("location.hash.indexOf('/page/new') >= 0", { label: 'unborn board', timeout: 5000 });
    const nb = await app.evalJs('location.hash');
    const manId = (await rows()).find((e) => e.id === 'b2-bd1').projectId;
    ok('Y5 New Board opens an unborn BOARD addressed into the current set', /\/page\/new\?/.test(nb) && /kind=board/.test(nb) && nb.includes(`binder=${manId}`), nb);

    // ---- Y6: a preset opens its deck's wizard and deals into a board filed in the set ---------------------------------------------------------------------------------------
    await fresh(); await seed(); await open('b2-bd1', '.board-canvas');
    await click('[data-category=plan]');
    await click('.wz-sections-preset[data-preset=character-study]');
    const wiz = await waitSoft("!!document.querySelector('.deck-wizard-dialog')", { label: 'wizard open', timeout: 6000 });
    const wiz1 = await app.evalJs("({ library: !!document.querySelector('.deck-wizard-deck-row'), hash: location.hash, eyebrow: document.querySelector('.deck-wizard-eyebrow')?.textContent })");
    ok('Y6 a preset opens a NEW board with that deck\'s wizard already running - no library step (the deck\'s own name is the eyebrow, or it dealt straight away)', (wiz && wiz1.library === false && /kind=board/.test(wiz1.hash) && /deck=character-study/.test(wiz1.hash)) || (!wiz && /\/page\/[^/]+$/.test(await app.evalJs('location.hash'))), JSON.stringify({ wiz, wiz1 }));
    for (let k = 0; k < 6 && (await app.evalJs("!!document.querySelector('.deck-wizard-dialog')")); k += 1) { await click('.deck-wizard-option-btn'); await sleep(300); }
    await sleep(900);
    const dealt = await rows();
    const newest = dealt.filter((e) => e.pageType === 'board' && !e.id.startsWith('b2-')).sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)))[0];
    ok('Y6 the deck dealt cards into a board born in the CURRENT set (the row exists, has cards, and carries the set\'s id)', !!newest && (newest.boxes || []).length > 0 && newest.projectId === (await app.evalJs('window.__bp ? window.__bp.man : null')), JSON.stringify(newest && { id: newest.id, p: newest.projectId, n: (newest.boxes || []).length }));

    // ---- Y7: the empty board's starters --------------------------------------------------------------------------------------------------------------------------------------------
    await fresh();
    await app.evalJs("window.wrizoCreateJournalPage({ id: 'b2-empty', text: 'An empty board', pageType: 'board', boxes: [], origin: 'journal', source: 'page' }); window.wrizoFlushNow()"); await sleep(400);
    await open('b2-empty', '.board-canvas');
    const starters = await app.evalJs("[...document.querySelectorAll('.wz-beginnings[data-beginnings=board] .wz-beginning')].map((b) => b.dataset.beginning)");
    ok('Y7 the empty board\'s starters read New Card, Templates, Connect Pages - and no New Page', same(starters, ['newCard', 'loadDeck', 'connectPage']), JSON.stringify(starters));
    const labels = await app.evalJs("[...document.querySelectorAll('.wz-beginnings[data-beginnings=board] .wz-beginning-label')].map((b) => b.textContent.trim())");
    ok('Y7 ...by those words', same(labels, ['New Card', 'Templates', 'Connect Pages']), JSON.stringify(labels));
  });
}

if (process.env.BROWSERLESS_ONLY !== '1') {
  try { await part2(); } catch (err) { ok('PART 2 ran to the end (RED until the build)', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }
} else {
  console.log('(BROWSERLESS_ONLY: PART 2 skipped - the real-app scenarios need a box turn)');
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBIG-PROJECTS-2 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBIG-PROJECTS-2 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
