// MOBILE slice 1, item 1 (MOBILE-B, Nov 26) - WHAT THE PHONE'S SCREENS LIST. RED FIRST: written before src/mobile/shelf.ts existed.
// The phone must list what the desk lists, by the desk's own read-time rule (reorg/railData.ts, reorg/partsSeam.ts), and only READ. The REAL store, bundled with the repo's esbuild and run in Node.
//   SH-DOCS     a set she made is ONE Doc; a loose page, a Notebook page and each page of an app-made set are Docs of their own
//   SH-OPEN     every listed Doc opens with its Parts (a loose page too, which the first build could not open)
//   SH-PROJECT  a Project lists its Docs and its Boards with no Doc; Unfiled lists loose pages and Boards
//   SH-FIND     Find reaches a word in a Part, in a loose page and on a card (a Doc's Board too), and never in anything deleted
//   SH-PLAN     the Plan is one list across the Doc's Parts: each row ticked when its Part has words and naming it, else no Part; a hidden row is left out
//   SH-ASSETS   a Part's assets and the whole Doc's assets, as cards and Boards
//   SH-PLACES   choosing a loose page as the place offers the Boards linked to it, and never every Board of its app-made set
//   SH-PINS     Pinned shows her pinned Projects in her order, an unpinned one left out
//   SH-READONLY none of the above writes anything
// Browserless. Run: node scripts/harness/mobile-shelf-unit.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');

if (!fs.existsSync(path.join(SRC, 'mobile', 'shelf.ts'))) {
  console.log('FAIL src/mobile/shelf.ts does not exist yet\n\n0/9 pass');
  process.exit(1);
}

const bundled = await build({
  stdin: {
    contents: [
      "export * as store from './store/persistence';",
      "export * as shelf from './mobile/shelf';",
      "export * as docs from './reorg/docSettings';",
      "export * as grafts from './store/grafts';",
    ].join('\n'),
    resolveDir: SRC, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
  nodePaths: [path.join(DESKTOP, 'node_modules')],
  loader: { '.css': 'empty', '.png': 'empty', '.svg': 'empty', '.woff2': 'empty' },
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"production"' },
});

const map = new Map();
const storage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear(), key: (i) => [...map.keys()][i] ?? null, get length() { return map.size; } };
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, localStorage: storage, location: { hash: '', search: '' }, setTimeout, clearTimeout };
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null, documentElement: { getAttribute: () => null, setAttribute() {} } };
globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/m/', search: '', hash: '' };
globalThis.localStorage = storage;
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
const { store: s, shelf: h, docs, grafts } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const scenario = (name, fn) => { try { const [pass, detail] = fn(); ok(name, pass, detail); } catch (e) { ok(name, false, 'the check threw: ' + (e && e.message || e)); } };

// ---- her things, born through the app's own functions ----------------------------------------------------------------------------------------------------------
const drawer = s.createDrawer('Novels');
const made = s.createBinder('The Salt Road', 'book', drawer.id);
let order = 0;   // two Parts born in one millisecond have no order of their own: give them one, as a move on the desk does
const part = (docId, text) => { const p = s.createBinderPage(docId, 'manuscript'); s.saveJournalEntry({ ...s.getJournalEntry(p.id), text, orderIndex: order++ }); return p.id; };
const p1 = part(made.id, 'The ferry left at dawn with a cargo of limestone.');
const p2 = part(made.id, '');
const loose = s.createLooseHomePage(); s.saveJournalEntry({ ...s.getJournalEntry(loose.id), text: 'Grocery thoughts: persimmon' });
const jot = s.createJournalPage({ text: 'Notebook line about herons' });
const card = (id, text, extra = {}) => ({ id, kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text, ...extra });
const docBoard = s.createBoardPage(made.id, 'Research wall'); s.saveBoardBoxes(docBoard.id, [card('c-ferry', 'Ferry timetables, 1911')]);
const freeBoard = s.createJournalPage({ text: 'Loose wall', pageType: 'board', boxes: [card('c-quince', 'quince jam')], origin: 'loose' });
const gone = s.createJournalPage({ text: 'vermilion', origin: 'loose' }); s.softDeleteEntry(gone.id);
// the Plan of Part 1: two rows, one of which has a Part with words
const plan = s.getOrCreatePlanBoard(p1);
s.saveBoardBoxes(plan.id, [card('r1', 'Departure', { seq: 0 }), card('r2', 'Arrival', { seq: 1 }), card('r3', 'Hidden row', { seq: 2 })]);
s.addPageLink(plan.id, { aBoxId: 'r1', bEntryId: p1 });
s.saveJournalEntry({ ...s.getJournalEntry(p1), pageSettings: { ...(s.getJournalEntry(p1).pageSettings ?? {}), hiddenPlanCards: ['r3'] } });
docs.addDocAsset(p1, { entryId: freeBoard.id });
// a loose page's own connected Board
const linked = s.createJournalPage({ text: 'Linked to the loose page', pageType: 'board', boxes: [], origin: 'loose' });
s.addPageLink(loose.id, { bEntryId: linked.id });

const snapshot = () => JSON.stringify([s.getJournalEntries(), s.getProjects(), s.getDrawers()]);
const before = snapshot();
const names = (rows) => rows.map((r) => r.name).sort().join(' | ');

scenario('SH-DOCS a set she made is one Doc; loose and Notebook pages are Docs of their own', () => {
  const rows = h.docLines('Untitled');
  const n = names(rows);
  return [rows.filter((r) => r.name === 'The Salt Road').length === 1 && n.includes('Grocery thoughts: persimmon') && n.includes('Notebook line about herons') && !n.includes('vermilion'), n];
});
scenario('SH-OPEN every listed Doc opens with its Parts, a loose page too', () => {
  const rows = h.docLines('Untitled');
  const views = rows.map((r) => h.docView(r.id, 'Untitled'));
  const novel = views.find((v) => v && v.name === 'The Salt Road');
  const own = h.docView(loose.id, 'Untitled');
  return [views.every((v) => v && v.parts.length > 0) && novel.parts.map((p) => p.id).join() === [p1, p2].join() && own.parts[0].id === loose.id && own.setId === null && novel.setId === made.id, `Parts: ${views.map((v) => v?.parts.length).join()}`];
});
scenario('SH-PROJECT a Project lists its Docs and Boards; Unfiled lists loose pages and Boards', () => {
  const projects = h.projectLines('Notebook', 'Top Drawer');
  const inside = h.projectContents(drawer.id, 'Untitled');
  const un = h.unfiledLines('Untitled');
  return [projects.some((p) => p.name === 'Novels') && projects.at(-1).name === 'Notebook' && names(inside.docs) === 'The Salt Road' && names(inside.boards) === 'Research wall' && un.docs.some((d) => d.id === loose.id) && un.boards.some((b) => b.id === freeBoard.id) && !un.docs.some((d) => d.id === jot.id), `projects: ${names(projects)}; unfiled docs ${un.docs.length}, boards ${un.boards.length}`];
});
scenario('SH-FIND Find reaches Parts, loose pages and cards, never anything deleted', () => {
  const at = (q) => h.findLines(q, 'Untitled');
  const a = at('limestone'), b = at('persimmon'), c = at('timetables'), d = at('quince'), e = at('vermilion'), f = at('salt road');
  return [a.length === 1 && a[0].to[0] === 'doc' && a[0].to[3] === p1 && b.length === 1 && b[0].to[0] === 'doc' && c.length === 1 && c[0].to[0] === 'card' && d.length === 1 && e.length === 0 && f.some((x) => x.to[0] === 'doc'), [a, b, c, d, e, f].map((x) => x.length).join()];
});
scenario('SH-KIND what Find lists says what each thing is: a Doc, a Board or a Card', () => {
  const k = (q) => h.findLines(q, 'Untitled').map((x) => x.kind).join();
  const got = [k('limestone'), k('salt road'), k('research wall'), k('quince')];
  return [got.join('|') === 'doc|doc|board|card', JSON.stringify(got)];
});
scenario('SH-PLAN one list; a written Part ticks its row and names it; a row with none says so; a hidden row is out', () => {
  const rows = h.planView(p2, 'Untitled');
  const dep = rows.find((r) => r.title === 'Departure'), arr = rows.find((r) => r.title === 'Arrival');
  return [rows.length === 2 && dep.written === true && !!dep.partName && arr.written === false && arr.partName === null, JSON.stringify(rows.map((r) => [r.title, r.written, r.partName]))];
});
scenario('SH-ASSETS the Part\'s assets and the whole Doc\'s assets, as cards and Boards', () => {
  const v = h.assetsView(p1, 'Untitled');
  const partCards = v.part.cards.map((c) => c.name).join(), docBoards = v.doc.boards.map((b) => b.name).sort().join();
  return [partCards.includes('Departure') && !partCards.includes('Hidden row') && docBoards === 'Loose wall,Research wall', `part cards: ${partCards}; doc boards: ${docBoards}`];
});
scenario('SH-PLACES a loose page offers the Boards linked to it, never every Board around it', () => {
  const p = h.placesFor(loose.id);
  const ids = p.kind === 'one' ? [p.board.id] : p.kind === 'many' ? p.boards.map((b) => b.id) : [];
  const q = h.placesFor(p1);
  const qIds = q.kind === 'one' ? [q.board.id] : q.kind === 'many' ? q.boards.map((b) => b.id) : [];
  return [ids.join() === linked.id && qIds.sort().join() === [docBoard.id, freeBoard.id].sort().join(), `loose: ${ids.length}; the Doc: ${qIds.length}`];
});
scenario('SH-PINS her pinned Projects in her order, an unpinned one left out', () => {
  const rail = { pins: { [drawer.id]: { order: 1, at: '2026-11-01T00:00:00.000Z' }, notebook: { order: 0, at: '2026-11-01T00:00:00.000Z' }, gone: { order: 2, at: '2026-11-01T00:00:00.000Z', removedAt: '2026-11-02T00:00:00.000Z' } }, boxes: {} };
  const p = h.pinnedLines(rail, 'Notebook', 'Top Drawer').map((x) => x.name).join();
  return [p === 'Notebook,Novels' && h.pinnedLines(null, 'Notebook', 'Top Drawer').length === 0, p];
});
scenario('SH-READONLY nothing above wrote anything', () => [snapshot() === before, snapshot() === before ? 'unchanged' : 'CHANGED']);

const bad = checks.filter((c) => !c.pass);
for (const c of checks) console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
console.log(`\n${checks.length - bad.length}/${checks.length} pass`);
console.log(`MOBILE-SHELF VERIFY: ${bad.length ? 'FAIL' : 'PASS'} (${checks.length} checks)`);
process.exit(bad.length ? 1 : 0);
