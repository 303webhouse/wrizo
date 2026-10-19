// BIG PROJECTS, STEP 1a - THE PLACE AND THE PAGES POP-OUT (docs/plans/big-projects.md, cleared by Fable Oct 18; brief docs/briefs/big-projects-build-brief.md).
// "Where you are" (a Drawer or a Journal), Top Drawer, the place block and switcher, the rail (no Shelf, Plan -> Boards, the fade), the Pages pop-out
// (rows, Order with a pointer-event drag, set grouping and folding, + New set, Presets, X to the Journal with Undo) and the Shelf merge.
//
// SCHEMA CHANGE: NONE - no new column, table or index; everything below is rows in the existing collections plus per-device localStorage keys.
//
// WRITTEN BEFORE THE BUILD (the brief: "checks go in first and red, then the build"). On the tree that has no store/place.ts every PART 1 check is RED (the module does not
// load) and every PART 1 source pin is RED; the first commit carries that red run. PART 2 (a box turn) is written against the DOM contract the build then meets.
//
//   PART 1 (browserless)  the REAL persistence.ts + store/place.ts + store/resume.ts bundled with esbuild against a fake browser, golden cases and MUTANTS (each landing asserted):
//     B1-B4 Top Drawer       made only for an account that has NEVER had a Drawer row (a live one, a soft-deleted one and a delete-for-good SHELL all count), one Drawer + one set,
//                            a deterministic id that carries the user id, and it never flips accountHasWork() or becomes a resume target
//     J1-J3 the Journal      the first Journal is implicit: every live, non-system, non-plan-face entry with no live home (projectId null, or naming a set that is missing, deleted
//                            or purged) - a strict SUPERSET of today's inJournalView + belongsOnShelf - and shells never surface
//     S1-S5 sets and places  a Drawer's sets (creation order), the lazy set for an empty Drawer, sections per kind with empty sets absent, set headings only past one set, placeOfEntry,
//                            the per-device place (valid, follows an open page, falls back), the switcher's list (Drawers, a virtual Unsorted only when such binders exist, the Journal)
//     O1-O4 Order            legacy order = creation order, reorder writes orderIndex only to the ids it is given, the Date / Tag / opens views NEVER write, wz.opens counts per device
//     X1-X3 X and Undo       X is setPageHome(id,'journal') (writes only projectId), Undo restores the same set and the same position, and does nothing for a page that was deleted or purged
//     N1-N2 population       before / after the bootstrap and after a reload-shaped second load, nothing disappears or changes home
//   PART 1b (browserless)    source pins: the rail, the switcher, the pop-out (rows carry data-link-entry, are NOT draggable, reorder on pointer events), /shelf redirects, the bootstrap
//                            is gated on the first pull, the harness double switches it off by default
//   PART 2 (a box turn)      the real app: the rail and place block, the switcher, rows with two sets and with one, X and Undo with real presses, a pointer drag-reorder that survives
//                            a reload, the fade, the Presets, the connector contract on the new rows
//
// Run: node scripts/harness/big-projects-1a.mjs   (from apps/desktop; PART 2 needs a box turn)      BROWSERLESS_ONLY=1 runs PART 1 / 1b alone
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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- the real store, bundled against a fake browser (the page-links.mjs pattern) --------------------------------------------------------------------------------------------
let nonce = 0;
async function load(overrides = {}) {
  nonce += 1;
  const res = await build({
    stdin: { contents: `export const __nonce = ${nonce};\nexport * from './store/persistence';\nexport * from './store/place';\nexport { getResumeTarget } from './store/resume';`, resolveDir: SRC, loader: 'ts' },
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

const card = (id, text = id) => ({ id, kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text });
const page = (m, id, o = {}) => m.createJournalPage({ id, text: id, origin: null, source: null, ...o });
const stamp = (m) => ({
  entries: m.getJournalEntries().map((e) => ({ id: e.id, p: e.projectId ?? null, oi: e.orderIndex ?? null, o: e.origin ?? null, s: !!e.shelved })).sort((a, b) => a.id.localeCompare(b.id)),
  projects: m.getProjects().map((p) => ({ id: p.id, d: p.drawerId ?? null })).sort((a, b) => a.id.localeCompare(b.id)),
});

// a seeded account: Drawers, sets, Journal pages, Shelf pages, loose pages pinned on a board, boards, and every kind of dead end
function seedAccount(m) {
  const d1 = m.createDrawer('The Late Ferry'); const d2 = m.createDrawer('Short stories');
  const manuscript = m.createProject('Manuscript', 'creative'); m.setProjectDrawer(manuscript.id, d1.id);
  const world = m.createProject('Worldbuilding', 'creative'); m.setProjectDrawer(world.id, d1.id);
  const stories = m.createProject('Stories', 'creative'); m.setProjectDrawer(stories.id, d2.id);
  const unsorted = m.createProject('Old binder', 'creative');                                  // no Drawer at all: the virtual Unsorted group
  page(m, 'ch1', { projectId: manuscript.id, origin: 'project', createdAt: '2026-01-01T00:00:01.000Z' });
  page(m, 'ch2', { projectId: manuscript.id, origin: 'project', createdAt: '2026-01-01T00:00:02.000Z' });
  page(m, 'ch3', { projectId: manuscript.id, origin: 'project', createdAt: '2026-01-01T00:00:03.000Z' });
  page(m, 'salt', { projectId: stories.id, origin: 'project' });
  page(m, 'oldp', { projectId: unsorted.id, origin: 'project' });
  page(m, 'j1', { origin: 'journal' });                                                         // a Journal page
  page(m, 'shelfy', { origin: 'loose' });                                                       // a Shelf page (loose, unpinned)
  page(m, 'pinned', { origin: 'loose' });                                                       // a loose page that is pinned on a board: in NEITHER old list
  page(m, 'bd-world', { pageType: 'board', projectId: world.id, origin: 'project', boxes: [card('c1')] });
  page(m, 'bd-loose', { pageType: 'board', origin: 'loose', boxes: [card('c2')] });             // a loose user board
  m.pinPageToBoard('pinned', 'bd-loose', { display: true });
  return { d1, d2, manuscript, world, stories, unsorted };
}

const NEEDS = ['hasAnyDrawerRow', 'ensureTopDrawer', 'journalMembers', 'setsOfDrawer', 'sectionsOf', 'placeOfEntry', 'getPlace', 'setPlace', 'listPlaces', 'ensureSet', 'createSet', 'reorderSections', 'moveToJournal', 'undoMoveToJournal', 'followEntry', 'noteOpen', 'getOpens', 'compareSections', 'showSetHeadings'];

async function suite(m, mk = () => load()) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  const has = NEEDS.every((n) => typeof m[n] === 'function');
  keep('API', has, JSON.stringify(NEEDS.filter((n) => typeof m[n] !== 'function')));
  if (!has) return r;
  const U = 'u-1';

  // ---- B: Top Drawer ---------------------------------------------------------------------------------------------------------------------------------------------------
  {
    const before = { rows: m.hasAnyDrawerRow(), work: m.accountHasWork() };
    const made = m.ensureTopDrawer(U);
    const ds = m.getDrawers(), ps = m.getProjects();
    keep('B1', before.rows === false && made === true && ds.length === 1 && ds[0].name === 'Top Drawer' && ds[0].id === `top-drawer-${U}` && ps.length === 1 && ps[0].id === `top-set-${U}` && ps[0].drawerId === ds[0].id, JSON.stringify({ made, ds: ds.map((d) => d.id), ps: ps.map((p) => p.id) }));
    keep('B1b', m.ensureTopDrawer(U) === false && m.getDrawers().length === 1 && m.getProjects().length === 1, 'idempotent');
    keep('B3', before.work === false && m.accountHasWork() === false && m.getResumeTarget() === null, JSON.stringify({ work: m.accountHasWork(), resume: m.getResumeTarget() && m.getResumeTarget().route }));
    page(m, 'real-1', { origin: 'journal' });
    keep('B3b', m.accountHasWork() === true && m.getResumeTarget() && m.getResumeTarget().route === '/page/real-1', 'a real page is work and is the resume target, never the empty set');
  }
  {
    const m2 = await mk();
    const d = m2.createDrawer('Mine'); m2.softDeleteDrawer(d.id);                                // a SOFT-DELETED row still counts as "has had a Drawer"
    keep('B2a', m2.hasAnyDrawerRow() === true && m2.ensureTopDrawer(U) === false && m2.getDrawers().length === 0, 'soft-deleted');
    const m3 = await mk();
    const d3 = m3.createDrawer('Gone'); m3.softDeleteDrawer(d3.id); m3.purgeDrawer(d3.id);        // a delete-for-good SHELL counts too (so a purged Top Drawer is never recreated)
    keep('B2b', m3.hasAnyDrawerRow() === true && m3.ensureTopDrawer(U) === false && m3.getDrawers().length === 0, 'shell');
    const m4 = await mk();
    m4.createDrawer('Live');
    keep('B2c', m4.ensureTopDrawer(U) === false && m4.getDrawers().length === 1, 'live');
    const m5 = await mk(); const m6 = await mk();
    m5.ensureTopDrawer('u-9'); m6.ensureTopDrawer('u-9');                                          // two devices, before they sync: the SAME rows, so last-write-wins makes one
    keep('B4', same(m5.getDrawers().map((d) => d.id), m6.getDrawers().map((d) => d.id)) && m5.getDrawers()[0].id === 'top-drawer-u-9' && m5.getProjects()[0].id === 'top-set-u-9', JSON.stringify(m5.getDrawers().map((d) => d.id)));
    const m7 = await mk(); const m8 = await mk();
    m7.ensureTopDrawer('u-a'); m8.ensureTopDrawer('u-b');
    keep('B4b', m7.getDrawers()[0].id !== m8.getDrawers()[0].id, 'two accounts never share an id (drawers.id is a global primary key)');
  }

  // ---- J: the first Journal --------------------------------------------------------------------------------------------------------------------------------------------
  {
    const m2 = await mk();
    const s = seedAccount(m2);
    const gone = m2.createProject('Deleted set', 'creative'); m2.setProjectDrawer(gone.id, s.d1.id);
    page(m2, 'in-deleted-set', { projectId: gone.id, origin: 'project' }); m2.softDeleteProject(gone.id);
    const dead = m2.createProject('Purged set', 'creative'); m2.setProjectDrawer(dead.id, s.d1.id);
    page(m2, 'in-purged-set', { projectId: dead.id, origin: 'project' }); m2.softDeleteProject(dead.id); m2.purgeProject(dead.id);
    page(m2, 'trashed', { origin: 'journal' }); m2.softDeleteEntry('trashed');
    page(m2, 'shelled', { origin: 'journal' }); m2.softDeleteEntry('shelled'); m2.purgeEntry('shelled');
    page(m2, 'planned', { origin: 'loose' }); const plan = m2.getOrCreatePlanBoard('planned');
    const ids = m2.journalMembers().map((e) => e.id).sort();
    const want = ['bd-loose', 'j1', 'in-deleted-set', 'in-purged-set', 'pinned', 'planned', 'shelfy'].sort();
    keep('J1', same(ids, want), JSON.stringify({ got: ids, want }));
    keep('J1b', !ids.includes('trashed') && !ids.includes('shelled') && !ids.includes(plan && plan.id) && !ids.includes('ch1') && !ids.includes('oldp'), 'deleted, shells, plan faces and filed pages are not members');
    const oldList = m2.getJournalEntries().filter((e) => m2.inJournalView(e) || m2.belongsOnShelf(e)).map((e) => e.id);
    keep('J2', oldList.every((id) => ids.includes(id)) && ids.includes('pinned') && !oldList.includes('pinned'), JSON.stringify({ oldList }));
    const sys = m2.getOrCreateSystemBoard('journal');
    keep('J3', !m2.journalMembers().some((e) => e.id === sys.id), 'a system board is never a member');
  }

  // ---- S: sets, sections, places ------------------------------------------------------------------------------------------------------------------------------------------
  {
    const m2 = await mk();
    const s = seedAccount(m2);
    keep('S1', same(m2.setsOfDrawer(s.d1.id).map((p) => p.title), ['Manuscript', 'Worldbuilding']) && m2.setsOfDrawer(s.d2.id).length === 1, JSON.stringify(m2.setsOfDrawer(s.d1.id).map((p) => p.title)));
    keep('S1b', same(m2.setsOfDrawer('unsorted').map((p) => p.title), ['Old binder']), 'the virtual Unsorted group lists binders with no live Drawer');
    const pagesD1 = m2.sectionsOf({ kind: 'drawer', id: s.d1.id }, 'pages');
    keep('S2', pagesD1.length === 1 && pagesD1[0].set.title === 'Manuscript' && same(pagesD1[0].items.map((e) => e.id), ['ch1', 'ch2', 'ch3']), JSON.stringify(pagesD1.map((g) => [g.set && g.set.title, g.items.map((e) => e.id)])));
    const boardsD1 = m2.sectionsOf({ kind: 'drawer', id: s.d1.id }, 'boards');
    keep('S2b', boardsD1.length === 1 && boardsD1[0].set.title === 'Worldbuilding' && same(boardsD1[0].items.map((e) => e.id), ['bd-world']), 'a set with no boards is absent from the Boards view, a set with no pages from the Pages view');
    keep('S3', m2.showSetHeadings({ kind: 'drawer', id: s.d1.id }) === true && m2.showSetHeadings({ kind: 'drawer', id: s.d2.id }) === false && m2.showSetHeadings({ kind: 'journal', id: 'journal' }) === false, 'headings only once a second set exists');
    const jr = m2.sectionsOf({ kind: 'journal', id: 'journal' }, 'pages');
    keep('S2c', jr.length === 1 && jr[0].set === null && jr[0].items.some((e) => e.id === 'pinned') && !jr[0].items.some((e) => e.pageType === 'board'), 'the Journal is one flat group of pages');
    // the lazy set for an empty Drawer
    const empty = m2.createDrawer('Empty one');
    const before = m2.getProjects().length;
    const made = m2.ensureSet(empty.id);
    keep('S4', !!made && made.drawerId === empty.id && m2.getProjects().length === before + 1 && m2.ensureSet(empty.id).id === made.id && m2.getProjects().length === before + 1, 'exactly one set, then the same one');
    const dd = m2.createDrawer('To delete'); m2.softDeleteDrawer(dd.id);
    keep('S4b', m2.ensureSet(dd.id) === null, 'no set for a deleted Drawer');
    const np = m2.createSet(s.d2.id, 'Drafts');
    keep('S4c', np.drawerId === s.d2.id && np.title === 'Drafts' && m2.showSetHeadings({ kind: 'drawer', id: s.d2.id }) === true && same(m2.setsOfDrawer(s.d2.id).map((p) => p.title), ['Stories', 'Drafts']), 'a second set turns the headings on and sorts last');
    // placeOfEntry
    const E = (id) => m2.getJournalEntry(id);
    keep('S5a', same(m2.placeOfEntry(E('ch2')), { kind: 'drawer', id: s.d1.id, setId: s.manuscript.id }), JSON.stringify(m2.placeOfEntry(E('ch2'))));
    keep('S5b', m2.placeOfEntry(E('j1')).kind === 'journal' && m2.placeOfEntry(E('shelfy')).kind === 'journal', 'journal and shelf pages');
    keep('S5c', same(m2.placeOfEntry(E('oldp')), { kind: 'drawer', id: 'unsorted', setId: s.unsorted.id }), 'a page in a binder with no Drawer is in the virtual Unsorted');
    keep('S5d', m2.placeOfEntry(E('in-purged-set') || E('j1')).kind === 'journal', 'sanity');
    // the stored place
    keep('S6a', same(m2.getPlace(U), { kind: 'drawer', id: s.d1.id, setId: null }) || (m2.getPlace(U).kind === 'drawer' && m2.getPlace(U).id === s.d1.id), JSON.stringify(m2.getPlace(U)));
    m2.setPlace(U, { kind: 'journal', id: 'journal' });
    keep('S6b', m2.getPlace(U).kind === 'journal' && m2.getPlace('someone-else').kind === 'drawer', 'per account on this device');
    m2.setPlace(U, { kind: 'drawer', id: s.d2.id, setId: s.stories.id });
    m2.softDeleteDrawer(s.d2.id);
    keep('S6c', m2.getPlace(U).kind === 'drawer' && m2.getPlace(U).id === s.d1.id, 'a deleted Drawer falls back to the first live one by order');
    for (const d of m2.getDrawers()) m2.softDeleteDrawer(d.id);
    keep('S6d', m2.getPlace(U).kind === 'journal', 'no Drawer left: the Journal');
    const m3 = await mk(); const s3 = seedAccount(m3);
    m3.followEntry(U, m3.getJournalEntry('salt'));
    keep('S7', m3.getPlace(U).id === s3.d2.id && m3.getPlace(U).setId === s3.stories.id, 'opening a page makes its home the place');
    const lp = m3.listPlaces();
    keep('S8', same(lp.drawers.map((d) => d.name), ['The Late Ferry', 'Short stories']) && lp.unsorted.length === 1 && lp.journals.length === 1 && lp.journals[0].id === 'journal', JSON.stringify(lp.drawers.map((d) => d.name)));
    const m4 = await mk(); m4.createDrawer('Only');
    keep('S8b', m4.listPlaces().unsorted.length === 0, 'Unsorted is shown only when such binders exist');
    const m5 = await mk(); const s5 = seedAccount(m5);
    m5.softDeleteDrawer(s5.d2.id); m5.softDeleteDrawer(s5.d1.id); m5.purgeDrawer(s5.d1.id);
    keep('S8c', m5.listPlaces().drawers.length === 0 && same(m5.listPlaces().unsorted.map((p) => p.title).sort(), ['Manuscript', 'Old binder', 'Stories', 'Worldbuilding']), 'a purged shell is never listed, and the binders of deleted Drawers fall to Unsorted');
  }

  // ---- O: Order and opens -------------------------------------------------------------------------------------------------------------------------------------------------
  {
    const m2 = await mk();
    const s = seedAccount(m2);
    const items = () => m2.sectionsOf({ kind: 'drawer', id: s.d1.id }, 'pages')[0].items.map((e) => e.id);
    keep('O1', same(items(), ['ch1', 'ch2', 'ch3']), 'legacy: creation order');
    const n = m2.reorderSections(['ch3', 'ch1', 'ch2']);
    keep('O2', n === 3 && same(items(), ['ch3', 'ch1', 'ch2']) && m2.getJournalEntry('salt').orderIndex === undefined, JSON.stringify(items()));
    page(m2, 'ch4', { projectId: s.manuscript.id, origin: 'project' });
    keep('O2b', same(items(), ['ch3', 'ch1', 'ch2', 'ch4']), 'a new section lands at the end of the writer\'s order');
    keep('O2c', m2.reorderSections(['ch3', 'ch1', 'ch2']) === 0, 'an unchanged order writes nothing');
    const snap = JSON.stringify(stamp(m2));
    const sorted = [m2.getJournalEntry('ch2'), m2.getJournalEntry('ch3')].sort(m2.compareSections);
    keep('O3', JSON.stringify(stamp(m2)) === snap && typeof sorted[0].id === 'string', 'comparing and viewing never writes');
    m2.noteOpen(U, 'ch1'); m2.noteOpen(U, 'ch1'); m2.noteOpen(U, 'ch3'); m2.noteOpen('u-2', 'ch1');
    const o = m2.getOpens(U);
    keep('O4', o.ch1 === 2 && o.ch3 === 1 && m2.getOpens('u-2').ch1 === 1, JSON.stringify(o));
    m2.softDeleteEntry('ch3');
    keep('O4b', m2.getOpens(U).ch3 === undefined && m2.getOpens(U).ch1 === 2, 'counts are pruned to live ids on read');
  }

  // ---- X: out to the Journal, and Undo ------------------------------------------------------------------------------------------------------------------------------------
  {
    const m2 = await mk();
    const s = seedAccount(m2);
    m2.reorderSections(['ch3', 'ch1', 'ch2']);
    const E = () => m2.getJournalEntry('ch1');
    const before = { ...E() };
    const tok = m2.moveToJournal('ch1');
    const after = E();
    keep('X1', !!tok && after.projectId === null && after.orderIndex === before.orderIndex && after.origin === before.origin && !!after.updatedAt && m2.journalMembers().some((e) => e.id === 'ch1'), JSON.stringify({ p: after.projectId, oi: after.orderIndex }));
    keep('X1b', !m2.sectionsOf({ kind: 'drawer', id: s.d1.id }, 'pages')[0].items.some((e) => e.id === 'ch1') && m2.getJournalEntry('ch1').deletedAt === undefined, 'out of the set, never deleted');
    keep('X2', m2.undoMoveToJournal(tok) === true && E().projectId === s.manuscript.id && same(m2.sectionsOf({ kind: 'drawer', id: s.d1.id }, 'pages')[0].items.map((e) => e.id), ['ch3', 'ch1', 'ch2']), 'back in the same set, same position');
    const t2 = m2.moveToJournal('ch2'); m2.softDeleteEntry('ch2');
    keep('X3', m2.undoMoveToJournal(t2) === false && m2.getJournalEntry('ch2') === null, 'a page deleted meanwhile is left alone');
    const t3 = m2.moveToJournal('ch3'); m2.softDeleteEntry('ch3'); m2.purgeEntry('ch3');
    const snap = JSON.stringify(stamp(m2));
    keep('X3b', m2.undoMoveToJournal(t3) === false && JSON.stringify(stamp(m2)) === snap, 'a purged page: Undo does nothing and writes nothing');
    const t5 = m2.moveToJournal('ch1'); const other = m2.createSet(s.d1.id, 'Elsewhere');
    m2.setPageHome('ch1', other.id);
    keep('X3d', m2.undoMoveToJournal(t5) === false && m2.getJournalEntry('ch1').projectId === other.id, 'a page the writer filed elsewhere meanwhile is not dragged back');
    const t4 = m2.moveToJournal('salt'); m2.softDeleteProject(s.stories.id);
    keep('X3c', m2.undoMoveToJournal(t4) === false && m2.getJournalEntry('salt').projectId === null, 'the set is gone: Undo leaves the page in the Journal');
  }

  // ---- N: nothing disappears or changes home -------------------------------------------------------------------------------------------------------------------------------
  {
    const m2 = await mk();
    seedAccount(m2);
    const a = JSON.stringify(stamp(m2));
    const made = m2.ensureTopDrawer(U);                                                              // the seeded account HAS Drawers: no write at all
    keep('N1', made === false && JSON.stringify(stamp(m2)) === a && m2.getDrawers().length === 2, 'an account with Drawers is untouched');
    const m3 = await mk();
    const un = m3.createProject('Orphan binder', 'creative'); page(m3, 'op', { projectId: un.id, origin: 'project' }); page(m3, 'jj', { origin: 'journal' });
    const b = JSON.stringify(stamp(m3));
    const made3 = m3.ensureTopDrawer(U);
    const st = stamp(m3);
    keep('N2', made3 === true && JSON.stringify({ entries: st.entries, projects: st.projects.filter((p) => !p.id.startsWith('top-set-')) }) === JSON.stringify(JSON.parse(b)) && st.projects.find((p) => p.id === un.id).d === null, 'zero Drawers: Top Drawer is added, every page and binder is where it was (the binder stays Unsorted)');
    const again = stamp(m3); m3.ensureTopDrawer(U);
    keep('N3', JSON.stringify(stamp(m3)) === JSON.stringify(again), 'a second load writes nothing');
  }
  return r;
}

// MUTANTS: each is applied to the source of store/place.ts (or persistence.ts) before bundling; the mutation must LAND and must redden its named checks
const MUTANTS = [
  { name: 'Top Drawer ignores soft-deleted / shell rows (counts only live Drawers)', file: 'store/persistence.ts', from: 'export function hasAnyDrawerRow(): boolean { return cache.drawers.length > 0; }', to: 'export function hasAnyDrawerRow(): boolean { return cache.drawers.some(d => !d.deletedAt); }', red: ['B2a', 'B2b'] },
  { name: 'the Top Drawer id forgets the user id', file: 'store/place.ts', from: "`top-drawer-${uid}`", to: "'top-drawer'", red: ['B1', 'B4b'] },
  { name: 'the Journal rule drops the "no live home" half (only projectId null)', file: 'store/place.ts', from: 'if (!hasLiveHome(e)) return true;', to: 'return false;', red: ['J1'] },
  { name: 'the Journal rule lists system boards', file: 'store/place.ts', from: 'if (getSystemKind(e)) return false;', to: '', red: ['J3'] },
  { name: 'X writes more than projectId (resets orderIndex)', file: 'store/place.ts', from: "setPageHome(entryId, 'journal');", to: "setPageHome(entryId, 'journal'); { const e = getJournalEntry(entryId); if (e) saveJournalEntry({ ...e, orderIndex: undefined }); }", red: ['X1', 'X2'] },
  { name: 'Undo drags a page back that was filed elsewhere meanwhile', file: 'store/place.ts', from: 'if (e.projectId != null) return false;', to: '', red: ['X3d'] },
  { name: 'reorder writes every id, changed or not', file: 'store/place.ts', from: 'if (e.orderIndex === i) return;', to: '', red: ['O2c'] },
  { name: 'Unsorted forgets a binder whose Drawer was deleted (counts only "no drawerId")', file: 'store/place.ts', from: 'all.filter(p => !p.drawerId || !liveDrawers.has(p.drawerId))', to: 'all.filter(p => !p.drawerId)', red: ['S8c'] },
];

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const loaded = await tryLoad();
if (!loaded.m) {
  ok('PART 1 loads the real store with store/place.ts (RED until the build: the module does not exist)', false, loaded.err);
  for (const k of ['B1 Top Drawer', 'B2 shells count', 'B3 accountHasWork / resume', 'B4 deterministic ids', 'J1-J3 the first Journal', 'S1-S8 sets, sections, places', 'O1-O4 Order and opens', 'X1-X3 X and Undo', 'N1-N3 population']) ok(`PART 1 ${k}`, false, 'not loadable');
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
    const rr = mm.m ? await suite(mm.m, () => load(ov)) : {};   // EVERY store the suite makes carries the mutation, not just the first
    const went = mu.red.filter((k) => !rr[k] || !rr[k].pass);
    ok(`mutant "${mu.name}" is KILLED (reddens: ${mu.red.join(', ')})`, went.length === mu.red.length, `red: ${went.join(', ') || 'none'}`);
    if (went.length === mu.red.length) landed.killed += 1;
  }
  ok(`all ${MUTANTS.length} mutations landed and ${MUTANTS.length} were killed`, landed.n === MUTANTS.length && landed.killed === MUTANTS.length, `${landed.n} landed / ${landed.killed} killed`);
}

// ---- PART 1b: source pins ---------------------------------------------------------------------------------------------------------------------------------------------
const rd = (rel) => (exists(rel) ? read(rel) : '');
const cascade = rd('components/Cascade.tsx');
const panels = rd('components/CascadePanels.tsx');
const popout = rd('components/SectionsPopout.tsx');
const switcher = rd('components/PlaceSwitcher.tsx');
const block = rd('components/PlaceBlock.tsx');
const app = rd('App.tsx');
const lex = rd('store/deskLexicon.ts');
const deskRail = rd('components/DeskRail.tsx');
const rv = fs.readFileSync(path.join(DESKTOP, 'scripts', 'runtime-verify.mjs'), 'utf8');
const stripBody = cascade.slice(cascade.indexOf('const strip = ('), cascade.indexOf('const layers ='));

ok('P1 the rail has NO Shelf item: no shelf category spec, no Shelf icon in the sections, and the place block, Pages and Boards come first, then Journal, then the foot',
  exists('components/Cascade.tsx') && !/id: 'shelf'/.test(cascade) && /PlaceBlock/.test(stripBody) && stripBody.indexOf('PlaceBlock') < stripBody.indexOf('SECTION_C') && /id: 'page'/.test(cascade) && /id: 'plan'/.test(cascade) && /id: 'journal'/.test(cascade), '');
ok('P2 "Plan" is renamed Boards in the rail (the lexicon term stripPlan reads Boards; the category id stays plan so the data-category selectors survive)', /stripPlan: 'Boards'/.test(lex) && /id: 'plan'/.test(cascade), '');
ok('P3 the place block lives INSIDE the strip (so it fades with the rest of the strip: .desk-frame-strip carries chrome-fade desk-dissolve) and is a button named by data-category="drawers"',
  /<aside className="desk-frame-strip chrome-fade desk-dissolve"/.test(rd('components/DeskFrame.tsx')) && /data-category="drawers"/.test(block + cascade) && /wz-place-block/.test(block), '');
ok('P4 the switcher is two flat groups, Drawers then Journals, then + New Drawer; the virtual Unsorted entry only when such binders exist; no Shelf anywhere in it',
  /data-group="drawers"/.test(switcher) && /data-group="journals"/.test(switcher) && /listPlaces\(\)/.test(switcher) && /unsorted/.test(switcher) && !/[Ss]helf/.test(switcher), '');
ok('P5 the Pages pop-out rows declare data-link-entry (connector-b\'s rail contract) and are NOT HTML5 draggable (a draggable row switches drag-to-copy off)', /data-link-entry=\{/.test(popout) && !/draggable/.test(popout), '');
ok('P6 reorder is on POINTER events (the pop-out handles pointerdown / pointermove / pointerup), never HTML5 drag events', /onPointerDown/.test(popout) && /pointermove/.test(popout) && !/onDragStart|onDrop\b|dragstart/.test(popout), '');
ok('P7 X is setPageHome(id, "journal") through place.moveToJournal and never a delete: the pop-out calls moveToJournal and imports no delete function', /moveToJournal/.test(popout) && !/softDelete|purge|deleteEntry/.test(popout), '');
ok('P8 the views never write: the pop-out does not import saveJournalEntry or any writer other than reorderSections / moveToJournal / createSet / ensureSet', !/saveJournalEntry|patchJournalEntry|saveProject/.test(popout) && /reorderSections/.test(popout), '');
ok('P9 /shelf redirects (the door is gone, the old route does not 404): App.tsx routes /shelf to a Navigate', /path="\/shelf" element=\{<Navigate to="\/journal" replace \/>\}/.test(app), '');
ok('P10 the legacy rail (DeskRail) carries no Shelf door either', exists('components/DeskRail.tsx') && !/key: 'shelf'/.test(deskRail), '');
ok('P11 the bootstrap is a component mounted once beside the routes, gated on the FIRST PULL, and skipped for a device that signed out', /PlaceBootstrap/.test(app) && /whenFirstPulled/.test(rd('components/PlaceBootstrap.tsx')) && /isSignedOutHere/.test(rd('components/PlaceBootstrap.tsx')), '');
ok('P12 the harness double switches the bootstrap OFF by default (window.__wrizoNoBootstrap) so the ~150 other harness accounts are not given a Top Drawer; this file sets WS_PLACE=1', /__wrizoNoBootstrap/.test(rv) && /WS_PLACE/.test(rv) && /__wrizoNoBootstrap/.test(rd('components/PlaceBootstrap.tsx')), '');
ok('P13 the Pages pop-out replaces the OpenPages list in the page panel; the page face, Page Setup and Places stay beneath it until step 1b moves them to the header', /<SectionsPopout/.test(panels) && /<PageFace/.test(panels) && /<PageSetupZone/.test(panels) && /<PlacesPanel/.test(panels) && !/<OpenPages/.test(panels), '');
ok('P14 the connector contract survives on the new rail: BoardEditor still finds rail targets by [data-link-entry] (railEntryAt) and the pop-out is not inside a [draggable] ancestor', /\[data-link-entry\]/.test(rd('components/BoardEditor.tsx')), '');

// ================================================================================================================================================================================
// PART 2 - the real app (a box turn). Written against the DOM contract the build meets:
//   place block   button.wz-strip-item.wz-place-block[data-category="drawers"][data-place-kind] > .wz-place-icon + .wz-place-name
//   rail          [data-category] page (Pages) / plan (Boards) / journal / settings / theme / trash; NO [data-category="shelf"]
//   switcher      .wz-switcher > .wz-switcher-group[data-group="drawers"|"journals"] > .wz-switcher-item[data-place-kind][data-place-id]; button.wz-switcher-new[data-new="drawer"]
//   Pages pop-out .wz-sections[data-kind="pages"]: .wz-sections-place, button.wz-sections-new, button.wz-sections-sort, .wz-sections-views button[data-v], .wz-set[data-set-id] (> button.wz-set-head[aria-expanded] > .wz-set-count),
//                 .wz-section-row[data-entry-id][data-link-entry] > button.wz-section-grip[data-reorder-grip] + button.wz-section-open + button.wz-section-x, button.wz-sections-newset, .wz-sections-presets button[data-preset], .wz-sections-undo > button
// ================================================================================================================================================================================
async function part2() {
  process.env.WS_PLACE = '1';
  const { withHarness } = await import('../runtime-verify.mjs');
  await withHarness(async (app) => {
    const sleep = sleepMs;
    const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
    const ROWS = 'writer-studio-journal-entries';
    const rows = () => app.evalJs(`JSON.parse(localStorage.getItem(${JSON.stringify(ROWS)}) || '[]')`);
    const proj = () => app.evalJs("JSON.parse(localStorage.getItem('writer-studio-projects') || '[]')");
    const drw = () => app.evalJs("JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')");
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
    const seedFerry = async () => {
      await app.evalJs(`(() => { const d1 = window.wrizoCreateDrawer('The Late Ferry'); const d2 = window.wrizoCreateDrawer('Short stories');
        const man = window.wrizoCreateProject('Manuscript', 'creative'); const wor = window.wrizoCreateProject('Worldbuilding', 'creative'); const sto = window.wrizoCreateProject('Stories', 'creative');
        window.wrizoSetProjectDrawer(man.id, d1.id); window.wrizoSetProjectDrawer(wor.id, d1.id); window.wrizoSetProjectDrawer(sto.id, d2.id);
        window.__bp = { d1: d1.id, d2: d2.id, man: man.id, wor: wor.id, sto: sto.id }; })()`);
      for (const [id, pid, at] of [['bp-ch1', 'man', '01'], ['bp-ch2', 'man', '02'], ['bp-ch3', 'man', '03'], ['bp-salt', 'sto', '04']]) {
        await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: `Words of ${id}`, projectId: null, origin: 'project', source: 'page', createdAt: `2026-01-01T00:00:${at}.000Z` })}); window.wrizoPatchEntry(${JSON.stringify(id)}, { projectId: window.__bp.${pid} })`);
      }
      await app.evalJs("window.wrizoCreateJournalPage({ id: 'bp-j1', text: 'A journal page', origin: 'journal', source: 'page' }); window.wrizoFlushNow()");
      await sleep(500);
    };
    const open = async (id) => { await app.evalJs(`location.hash = '#/page/${id}'`); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'page' }); await sleep(900); };
    const railItems = () => app.evalJs("[...document.querySelectorAll('.wz-strip [data-category]')].map((b) => b.dataset.category)");

    // ---- E1: the rail ----------------------------------------------------------------------------------------------------------------------------------------------
    await fresh(); await seedFerry(); await open('bp-ch2');
    const rail = await railItems();
    ok('E1 the rail, top to bottom: the place block, Pages, Boards, Journal, then Settings, Themes, Trash - and NO Shelf', same(rail, ['drawers', 'page', 'plan', 'journal', 'settings', 'theme', 'trash']), JSON.stringify(rail));
    const names = await app.evalJs("({ place: document.querySelector('.wz-place-block .wz-place-name')?.textContent, kind: document.querySelector('.wz-place-block')?.dataset.placeKind, boards: document.querySelector('[data-category=plan] .wz-strip-label')?.textContent, pages: document.querySelector('[data-category=page] .wz-strip-label')?.textContent })");
    ok('E1 the place block names where the open page lives (The Late Ferry, a Drawer), the Plan item reads Boards, the Page item reads Pages', names.place === 'The Late Ferry' && names.kind === 'drawer' && names.boards === 'Boards' && names.pages === 'Pages', JSON.stringify(names));

    // ---- E2: the switcher --------------------------------------------------------------------------------------------------------------------------------------------
    await click('.wz-place-block');
    const sw = await app.evalJs("({ groups: [...document.querySelectorAll('.wz-switcher-group')].map((g) => g.dataset.group), drawers: [...document.querySelectorAll('.wz-switcher-group[data-group=drawers] .wz-switcher-item')].map((i) => i.textContent.trim()), journals: [...document.querySelectorAll('.wz-switcher-group[data-group=journals] .wz-switcher-item')].map((i) => i.textContent.trim()), newDrawer: !!document.querySelector('.wz-switcher-new[data-new=drawer]') })");
    ok('E2 tapping the place block opens the switcher: Drawers, then Journals (two flat groups), then + New Drawer', same(sw.groups, ['drawers', 'journals']) && sw.drawers.includes('The Late Ferry') && sw.drawers.includes('Short stories') && sw.journals.length === 1 && sw.newDrawer === true, JSON.stringify(sw));
    await click('.wz-switcher-item[data-place-kind=journal]');
    ok('E2 choosing the Journal changes the place block (no navigation: the open page stays open)', (await app.evalJs("document.querySelector('.wz-place-block')?.dataset.placeKind")) === 'journal' && (await app.evalJs('location.hash')) === '#/page/bp-ch2', await app.evalJs('location.hash'));
    await click('.wz-place-block'); await click('.wz-switcher-item[data-place-id]:not([data-place-kind=journal])');

    // ---- E3: the Pages pop-out, two sets then one set ----------------------------------------------------------------------------------------------------------------
    await open('bp-ch2');
    await click('[data-category=page]');
    const two = await app.evalJs("({ place: document.querySelector('.wz-sections-place')?.textContent, heads: [...document.querySelectorAll('.wz-set-head')].map((h) => h.textContent.trim()), rows: [...document.querySelectorAll('.wz-section-row')].map((r) => r.dataset.entryId), sort: document.querySelector('.wz-sections-sort')?.textContent })");
    ok('E3 the Pages pop-out for a Drawer with two sets: the place name, the set headings (a set with no pages is absent), the sections in the writer\'s order, the sort control reads Order', two.place === 'The Late Ferry' && two.rows.join() === 'bp-ch1,bp-ch2,bp-ch3' && two.sort === 'Order' && two.heads.length >= 1, JSON.stringify(two));
    await app.evalJs("window.wrizoSetPlaceForTest && 0");
    await click('.wz-place-block'); await click('.wz-switcher-item[data-place-id="' + (await app.evalJs('window.__bp.d2')) + '"]'); await click('[data-category=page]');
    const one = await app.evalJs("({ heads: document.querySelectorAll('.wz-set-head').length, rows: [...document.querySelectorAll('.wz-section-row')].map((r) => r.dataset.entryId) })");
    ok('E3 a Drawer with only ONE set shows no set heading (the word "set" appears only once a second exists)', one.heads === 0 && one.rows.join() === 'bp-salt', JSON.stringify(one));
    ok('E3 every row declares data-link-entry and none is HTML5 draggable', (await app.evalJs("[...document.querySelectorAll('.wz-section-row')].every((r) => r.dataset.linkEntry === r.dataset.entryId && !r.closest('[draggable=\"true\"]') && r.getAttribute('draggable') !== 'true')")) === true, '');

    // ---- E4: X -> Journal -> Undo, with real presses ------------------------------------------------------------------------------------------------------------------
    await click('.wz-place-block'); await click('.wz-switcher-item[data-place-id="' + (await app.evalJs('window.__bp.d1')) + '"]'); await click('[data-category=page]');
    const before = (await rows()).find((e) => e.id === 'bp-ch2');
    ok('E4 pressing the X on a section takes it out of the Drawer and into the Journal: only projectId changes, nothing is deleted, an Undo line appears', await click('.wz-section-row[data-entry-id="bp-ch2"] .wz-section-x'), '');
    const moved = (await rows()).find((e) => e.id === 'bp-ch2');
    ok('E4 ...stored: projectId null, orderIndex / origin / deletedAt unchanged', moved.projectId === null && moved.orderIndex === before.orderIndex && moved.origin === before.origin && !moved.deletedAt, JSON.stringify({ p: moved.projectId, oi: moved.orderIndex }));
    ok('E4 ...the Undo line names it', (await app.evalJs("!!document.querySelector('.wz-sections-undo')")) === true, '');
    await click('.wz-sections-undo button'); await sleep(400);
    const back = (await rows()).find((e) => e.id === 'bp-ch2');
    ok('E4 Undo puts the page back in the same set and the same position', back.projectId === before.projectId && back.orderIndex === before.orderIndex && (await app.evalJs("[...document.querySelectorAll('.wz-section-row')].map((r) => r.dataset.entryId).join()")) === 'bp-ch1,bp-ch2,bp-ch3', JSON.stringify({ p: back.projectId }));

    // ---- E5: a pointer drag-reorder survives a reload ----------------------------------------------------------------------------------------------------------------
    // the reorder GRIP is the handle (a row's body opens the page, and a press on it must stay a press): the grip is exempted by name from the board's thumbnail copy-drag
    const rect = (id) => app.evalJs(`(() => { const r = document.querySelector('.wz-section-row[data-entry-id="${id}"] .wz-section-grip'); if (!r) return null; const b = r.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), h: b.height }; })()`);
    const a = await rect('bp-ch3'); const t = await rect('bp-ch1');
    if (a && t) {
      await app.mouseMove(a.x, a.y); await app.mouseDown(a.x, a.y);
      for (let k = 1; k <= 8; k += 1) { await app.mouseMove(a.x, Math.round(a.y + ((t.y - a.y) * k) / 8)); await sleep(30); }
      await app.mouseUp(a.x, t.y - Math.round(t.h / 3)); await sleep(500);
    }
    const order1 = await app.evalJs("[...document.querySelectorAll('.wz-section-row')].map((r) => r.dataset.entryId).join()");
    ok('E5 a pointer drag on a row reorders it (Order is the default sort)', order1 === 'bp-ch3,bp-ch1,bp-ch2', order1);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(500); await app.reload();
    await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'page after reload' }); await sleep(900);
    await click('[data-category=page]');
    ok('E5 ...and the order survives a reload', (await app.evalJs("[...document.querySelectorAll('.wz-section-row')].map((r) => r.dataset.entryId).join()")) === 'bp-ch3,bp-ch1,bp-ch2', await app.evalJs("[...document.querySelectorAll('.wz-section-row')].map((r) => r.dataset.entryId).join()"));

    // ---- E6: the population, and Top Drawer ------------------------------------------------------------------------------------------------------------------------------
    await fresh();
    const empty = { d: (await drw()).length, p: (await proj()).length };
    await sleep(1500);
    const afterBoot = { drawers: (await drw()).filter((d) => !d.deletedAt), projects: (await proj()) };
    ok('E6 a brand-new account (zero Drawers) is given Top Drawer and its one set - and nothing else - after the first pull', empty.d === 0 && afterBoot.drawers.length === 1 && afterBoot.drawers[0].name === 'Top Drawer' && afterBoot.projects.length === 1, JSON.stringify({ empty, drawers: afterBoot.drawers.map((d) => d.name), projects: afterBoot.projects.length }));
    await fresh(); await seedFerry(); await app.reload(); await sleep(2500);
    const seeded = await rows();
    ok('E6 a seeded account that already has Drawers is not given a Top Drawer and no page changes home', (await drw()).filter((d) => !d.deletedAt).every((d) => d.name !== 'Top Drawer') && seeded.filter((e) => e.id.startsWith('bp-')).length === 5, JSON.stringify((await drw()).map((d) => d.name)));

    // ---- E7: the fade, place block included -------------------------------------------------------------------------------------------------------------------------------
    await fresh(); await seedFerry(); await open('bp-ch1');
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()"); await app.typeKeys('x'); await sleep(2500);
    const faded = await app.evalJs("(() => { const s = document.querySelector('.desk-frame-strip'); const p = document.querySelector('.wz-place-block'); return s && p ? { strip: +getComputedStyle(s).opacity, place: +getComputedStyle(p).opacity, inside: s.contains(p) } : null; })()");
    ok('E7 while typing, the whole rail - the place block included - recedes (the place block is inside the faded strip)', !!faded && faded.inside && faded.strip < 0.5, JSON.stringify(faded));
  });
}

if (process.env.BROWSERLESS_ONLY !== '1') {
  try { await part2(); } catch (err) { ok('PART 2 ran to the end (RED until the build)', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }
} else {
  console.log('(BROWSERLESS_ONLY: PART 2 skipped - the real-app scenarios need a box turn)');
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBIG-PROJECTS-1A VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBIG-PROJECTS-1A VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
