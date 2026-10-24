// W1 - THE WALK, BOARD KINDS AND "SHOW AS" (Fable's brief Oct 23: docs/guided-paths/w1-walk-brief.md; design: board-kinds-final, frames 01 / 02 / 02-writing / 02-showas-open / 03 / 04 / 05 / 07 / 10 + 02-trace Flux).
// WRITTEN BEFORE THE BUILD (red on the W3 tip, then on main when W3 lands). This file IS the contract the build is written to.
//
// THE MODEL (Nick's option C): two true kinds, Board and Book. A DECK is a Board whose home view is the Walk (born from a Preset). The JOURNAL is a Book. Saved data = TWO optional additive fields on the
// board-meta box inside the board's own `boxes` jsonb: `boardKind: 'board' | 'book'` and `homeView`. (NOT `kind`: Box.kind is the box discriminator - 'text' / 'ink' / 'page-pin' / 'connection' / 'board-meta'.)
// No column, no migration, no server change - the systemKind precedent. It SYNCS (whole-blob, last write wins), so the sync-completeness law applies: push and pull carry it, with a round trip, and the box-level
// merge (mergeBoxLists) must not lose it: withHomeView STAMPS board-meta.updatedAt so the newer write wins a merge at box grain, not by a tie.
//
// THE CONTRACT (module -> exports the build must provide; every name below is exercised):
//   store/boardKind.ts   BOARD_VIEWS ['open','storyboard','outline','walk'] / BOOK_VIEWS ['flip','thumbnails'] ; kindOf(entry) ; homeViewOf(entry) ; viewsOf(kind) ; isDeck(entry) ;
//                        withHomeView(boxes, view|null, newId) -> boxes (creates board-meta if absent, keeps its other fields, stamps updatedAt, never writes boardKind for a system board) ;
//                        doorHome('new-board' | 'preset' | 'new-journal') -> { boardKind, homeView } ; thumbKind(entry) -> 'board' | 'deck' | 'book'
//   store/boardMode.ts   BoardMode widened to the six views ; getBoardMode(boardId, homeView?) = remembered | homeView | 'open' (device-local, per board) ; an unknown stored value falls back
//   store/walk.ts        WALK {W:700, MIN_W:360, MAX_H:520, SWIPE_MS:280} ; walkOrder(boxes) (live TEXT cards, in the Storyboard / Outline order: boardStructure's seq order) ; walkStep(len, i, dir) (clamped, no wrap) ;
//                        railMarks(order, current, kindledIds, startHereId) -> [{ id, state: 'seed'|'leaf'|'current', startHere }] ; walkCardBox(contentH, stored?) -> { width, height, scroll } ;
//                        swipePlan(dir, reduced) -> { kind: 'slide'|'cut', ms, crossfade:false } ; walkKey(key, { onDoor }) -> 'next'|'prev'|'exit'|'activate'|null ;
//                        addPlacement(view, boxes) -> { mode: 'position' } | { mode: 'append', seq } ; viewsFor(kind, narrow, deck) ; getWalkSize / setWalkSize (device-local per board)
//   components/Walk.tsx  DOM contract for PART 2: .walk > .walk-stage > .walk-card[data-box-id] + .walk-nav[data-dir=prev|next] ; .walk-doors > .walk-door[data-door] ; .walk-rail > .walk-mark[data-state][data-current]
//   components/ShowAs.tsx  .show-as[data-open] > .show-as-btn[data-view][aria-pressed] (icon; the word on hover/title, icon + word while open)
//   lexicon (deskLexicon): boardModeWalk / boardModeFlip / boardModeThumbs (Arbor Walk / Flip / Thumbnails ; Flux Trace / Playback / Index) and the Flux Show-as words Live / Sequence / Spine
//
//   PART 1 (browserless; this file)   K kinds, S show-as + view memory, A adding follows the view, W walk model, M motion, Y keyboard, D dress (stylesheet), X sync round trip (the REAL server handler + the REAL box merge), L lexicon
//   PART 2 (guided-w1-part2.mjs, a box turn)   the live app: home views by door, show-as switching, walk geometry, the page never moves, motion, keyboard, dress in computed style, thumbnails, the Journal as a Book
//   Every check has a mutant, its landing asserted.   Run: node scripts/harness/guided-w1.mjs   (from apps/desktop; takes the box first)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const SERVER = path.resolve(DESKTOP, '..', 'server');
const SERVER_SRC = path.join(SERVER, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const svRequire = createRequire(path.join(SERVER, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const ts = require('typescript');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const has = (rel) => fs.existsSync(path.join(SRC, rel));
const readRaw = (rel) => (has(rel) ? noCR(fs.readFileSync(path.join(SRC, rel), 'utf8')) : '');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- the real modules (those that exist), bundled against a fake browser ----------------------------------------------------------------------------------------------------------------
let nonce = 0;
async function load(over = {}) {
  nonce += 1;
  const lines = [`export const __n = ${nonce};`, "export { deskTerm } from './store/deskLexicon';", "export * from './store/boardStructure';", "export { mergeBoxLists, liveBoxes } from './store/boxTombstones';"];
  for (const [mod, from] of [['boardKind', './store/boardKind'], ['walk', './store/walk'], ['boardMode', './store/boardMode']]) if (has(`store/${mod}.ts`)) lines.push(`export * from '${from}';`);
  const res = await build({
    stdin: { contents: lines.join('\n'), resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [path.join(DESKTOP, 'node_modules')], external: ['@fontsource/*', '@fontsource-variable/*'],
    plugins: [{ name: 'ov', setup(b) { b.onLoad({ filter: /\.ts$/ }, (args) => {
      const rel = path.relative(SRC, args.path).split('\\').join('/');
      const text = noCR(fs.readFileSync(args.path, 'utf8'));
      return { contents: over[rel] ? over[rel](text) : text, loader: 'ts' };
    }); } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }), innerWidth: 1400 };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear(), __map: map };
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
}
async function tryLoad(over) { try { return { M: await load(over) }; } catch (e) { return { err: String((e && e.message) || e).split('\n')[0].slice(0, 220) }; } }

// ---- the REAL server /sync handler with a fake pg that models its journal_entries insert and pull (the 224a pattern: real code, a modelled database) ---------------------------------------------------
const tmpServer = path.join(SERVER, '.w1-harness-scratch');
function stripTypes(src) { return ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText; }
function makeFakeDb(rows) {
  return {
    async query(sql, params = []) {
      if (/select now\(\) as t/i.test(sql)) return { rows: [{ t: new Date().toISOString() }] };
      const ins = /insert into journal_entries\s*\(([^)]*)\)/i.exec(sql);
      if (ins && /values/i.test(sql) && ins[1].includes('boxes')) {
        const cols = ins[1].split(',').map((c) => c.trim());
        const row = {};
        cols.forEach((c, i) => { let v = params[i]; if (typeof v === 'string' && /^(boxes|script|tutor|tags|routed_project_ids|strokes|page_settings|page_links)$/.test(c)) { try { v = JSON.parse(v); } catch { /* keep */ } } row[c] = v; });
        rows.set(row.id, row);
        return { rows: [], rowCount: 1 };
      }
      if (/^select \* from journal_entries/i.test(sql.trim())) return { rows: [...rows.values()] };
      if (/^select \* from/i.test(sql.trim())) return { rows: [] };
      return { rows: [], rowCount: 0 };
    },
  };
}
function loadSyncRouter(rows) {
  fs.rmSync(tmpServer, { recursive: true, force: true });
  fs.mkdirSync(tmpServer, { recursive: true });
  for (const p of Object.keys(svRequire.cache || {})) if (p.startsWith(tmpServer)) delete svRequire.cache[p];
  const write = (rel, text) => { const dest = path.join(tmpServer, rel.replace(/\.ts$/, '.js')); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, text); return dest; };
  for (const f of ['env.ts', 'asyncHandler.ts', 'logSafe.ts', 'build.ts']) if (fs.existsSync(path.join(SERVER_SRC, f))) write(f, stripTypes(fs.readFileSync(path.join(SERVER_SRC, f), 'utf8')));
  fs.writeFileSync(path.join(tmpServer, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\n');
  const dbDest = path.join(tmpServer, 'db.js');
  fs.writeFileSync(dbDest, '');
  svRequire.cache[dbDest] = { id: dbDest, filename: dbDest, loaded: true, exports: { pool: makeFakeDb(rows) } };
  const dest = write('sync.ts', stripTypes(fs.readFileSync(path.join(SERVER_SRC, 'sync.ts'), 'utf8')));
  return svRequire(dest);
}
function findHandler(router, p, method) { for (const l of router.stack) if (l.route && l.route.path === p && l.route.methods[method]) return l.route.stack[l.route.stack.length - 1].handle; throw new Error('route not found ' + p); }
async function callSync(router, body) {
  const req = { body, session: { userId: 'w1-harness-user' } };
  return new Promise((resolve) => { const res = { statusCode: 200 }; res.status = (c) => { res.statusCode = c; return res; }; res.json = (b) => { resolve({ status: res.statusCode, body: b }); return res; }; findHandler(router, '/sync', 'post')(req, res, (err) => resolve({ status: 599, body: { thrown: String(err) } })); });
}
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = 'postgres://unused/unused';
// push a board entry from "device A", pull it on "device B" (a fresh pull with no lastSyncAt): returns the entry as device B receives it
async function roundTrip(entry) {
  const rows = new Map();
  const mod = loadSyncRouter(rows);
  const router = mod.syncRouter;
  const a = await callSync(router, { lastSyncAt: null, push: { journalEntries: [entry] }, pull: false });
  const b = await callSync(router, { lastSyncAt: null, push: {}, pull: true });
  const pulled = JSON.stringify(b.body).includes(entry.id) ? (function find(o) { if (Array.isArray(o)) { for (const x of o) { const r = find(x); if (r) return r; } } else if (o && typeof o === 'object') { if (o.id === entry.id && 'boxes' in o) return o; for (const k of Object.keys(o)) { const r = find(o[k]); if (r) return r; } } return null; })(b.body) : null;
  return { pushStatus: a.status, rejected: a.body && a.body.rejected, pulled };
}

// ---- fixtures ------------------------------------------------------------------------------------------------------------------------------------------------------------------
const NOW = '2026-10-23T00:00:00.000Z';
const card = (id, text, extra = {}) => ({ id, kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text, ...extra });
const meta = (extra = {}) => ({ id: 'meta1', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, ...extra });
const entryOf = (boxes, extra = {}) => ({ id: 'e1', text: 'A board', pageType: 'board', boxes, createdAt: NOW, updatedAt: NOW, ...extra });
const seqCards = () => [card('c3', 'Three\n', { seq: 3 }), card('c1', 'One\n', { seq: 1 }), card('c2', 'Two\n', { seq: 2 }), { id: 'k1', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 9, connA: 'c1', connB: 'c2' }, { id: 'p1', kind: 'page-pin', x: 0, y: 0, w: 0.1, h: 0.1, z: 2, entryId: 'pg' }, meta()];

// ---- the suite ------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function suite(M, read) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  const chk = (k, fn) => { try { const [pass, detail] = fn(); keep(k, pass, detail); } catch (e) { keep(k, false, 'threw: ' + String((e && e.message) || e).slice(0, 160)); } };
  const chkA = async (k, fn) => { try { const [pass, detail] = await fn(); keep(k, pass, detail); } catch (e) { keep(k, false, 'threw: ' + String((e && e.message) || e).slice(0, 160)); } };

  // ---- K: kinds -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('K1', () => [M.BOARD_VIEWS && same(M.BOARD_VIEWS, ['open', 'storyboard', 'outline', 'walk']) && same(M.BOOK_VIEWS, ['flip', 'thumbnails']) && same(M.viewsOf('board'), M.BOARD_VIEWS) && same(M.viewsOf('book'), M.BOOK_VIEWS), 'the view sets per kind, in the brief\'s order']);
  chk('K2', () => [M.kindOf(entryOf([meta()])) === 'board' && M.kindOf(entryOf([])) === 'board' && M.kindOf(entryOf(undefined)) === 'board' && M.homeViewOf(entryOf([meta()])) === 'open' && M.homeViewOf(entryOf([])) === 'open', 'no field = a Board that opens in Open (no migration)']);
  chk('K3', () => [M.kindOf(entryOf([meta({ systemKind: 'journal' })])) === 'book' && M.homeViewOf(entryOf([meta({ systemKind: 'journal' })])) === 'flip' && M.kindOf(entryOf([meta({ systemKind: 'trash' })])) === 'board', 'the Journal system board reports kind book (derived from systemKind), its home is Flip; Trash stays a board']);
  chk('K4', () => [M.kindOf(entryOf([meta({ boardKind: 'book', homeView: 'thumbnails' })])) === 'book' && M.homeViewOf(entryOf([meta({ boardKind: 'book', homeView: 'thumbnails' })])) === 'thumbnails' && M.homeViewOf(entryOf([meta({ homeView: 'walk' })])) === 'walk' && M.isDeck(entryOf([meta({ homeView: 'walk' })])) === true && M.isDeck(entryOf([meta()])) === false && M.isDeck(entryOf([meta({ systemKind: 'journal' })])) === false, 'homeView read back; a Deck is a Board whose home is the Walk']);
  chk('K5', () => [M.homeViewOf(entryOf([meta({ homeView: 'flip' })])) === 'open' && M.homeViewOf(entryOf([meta({ boardKind: 'book', homeView: 'walk' })])) === 'flip' && M.homeViewOf(entryOf([meta({ homeView: 'sideways' })])) === 'open', 'a homeView the kind does not have, or junk, falls back to the kind\'s own default']);
  chk('K6', () => {
    const before = [card('c1', 'One\n'), meta({ canvasW: 900, canvasH: 600, lanes: [{ id: 'l1', title: 'Lane' }], footerOn: false })];
    const after = M.withHomeView(before, 'walk', () => 'newmeta');
    const m = after.find((b) => b.kind === 'board-meta');
    const keptAll = m.canvasW === 900 && m.canvasH === 600 && m.lanes.length === 1 && m.footerOn === false && m.homeView === 'walk' && typeof m.updatedAt === 'string';
    const made = M.withHomeView([card('c1', 'One\n')], 'walk', () => 'newmeta');
    const again = M.withHomeView(after, 'walk', () => 'x');
    const cleared = M.withHomeView(after, null, () => 'x').find((b) => b.kind === 'board-meta');
    const journal = M.withHomeView([meta({ systemKind: 'journal' })], 'thumbnails', () => 'x').find((b) => b.kind === 'board-meta');
    return [keptAll && made.filter((b) => b.kind === 'board-meta').length === 1 && made[made.length - 1].id === 'newmeta' && again === after && !('homeView' in cleared) && after.length === before.length && !('boardKind' in journal) && journal.homeView === 'thumbnails',
      JSON.stringify({ keptAll, made: made.length, same: again === after, cleared: Object.keys(cleared || {}) })];
  });
  chk('K7', () => [M.doorHome && same(M.doorHome('new-board'), { boardKind: 'board', homeView: 'open' }) && same(M.doorHome('preset'), { boardKind: 'board', homeView: 'walk' }) && same(M.doorHome('new-journal'), { boardKind: 'book', homeView: 'flip' }), 'the door chooses, never a picker: New Board = Open, a Preset = a Deck (Walk), New Journal = a Book (Flip)']);
  chk('K8', () => [M.thumbKind(entryOf([meta()])) === 'board' && M.thumbKind(entryOf([meta({ homeView: 'walk' })])) === 'deck' && M.thumbKind(entryOf([meta({ systemKind: 'journal' })])) === 'book' && M.thumbKind(entryOf([meta({ boardKind: 'book' })])) === 'book', 'thumbnails by kind: Board wide, Deck a short stack, Book tall']);
  {
    const types = read('types/index.ts'), be = read('components/BoardEditor.tsx');
    chk('K9', () => [/boardKind\?: 'board' \| 'book';/.test(types) && /homeView\?: /.test(types) && /kind: 'text' \| 'ink' \| 'page-pin' \| 'connection' \| 'board-meta';/.test(types), 'the two fields are on Box (named boardKind / homeView - Box.kind stays the discriminator)']);
    chk('K10', () => [/withHomeView\(/.test(be) && /doorHome\('preset'\)|descriptor\.deck/.test(be) && !/onDeckDealt[\s\S]{0,900}withHomeView/.test(be), 'a Preset-born (unborn, deck descriptor) board writes homeView walk at birth; dealing onto an EXISTING board never touches its view (Fable, assumption 3)']);
  }

  // ---- S: show as + the device-local view memory -------------------------------------------------------------------------------------------------------------------------------------
  chk('S1', () => [M.getBoardMode('b1') === 'open' && M.getBoardMode('b1', 'walk') === 'walk' && M.getBoardMode('b1', 'flip') === 'flip', 'remembered, else the home view, else Open']);
  chk('S2', () => { M.setBoardMode('b1', 'storyboard'); M.setBoardMode('b2', 'walk'); const a = M.getBoardMode('b1', 'walk'), b = M.getBoardMode('b2'), c = M.getBoardMode('b3', 'walk'); M.setBoardMode('bk', 'thumbnails'); return [a === 'storyboard' && b === 'walk' && c === 'walk' && M.getBoardMode('bk', 'flip') === 'thumbnails', 'last shown as is per board and device-local (localStorage), and beats the home view']; });
  chk('S3', () => { const k = [...(globalThis.localStorage.__map.keys())].filter((x) => /board-mode/.test(x)); globalThis.localStorage.setItem(k[0] || 'wrizo-board-mode', JSON.stringify({ b9: 'sideways' })); return [typeof M.getBoardMode === 'function' && M.getBoardMode('b9', 'walk') === 'walk', 'an unknown stored view is ignored']; });
  {
    const bm = read('store/boardMode.ts'), sa = read('components/ShowAs.tsx'), be = read('components/BoardEditor.tsx');
    chk('S4', () => [/'walk'/.test(bm) && /'flip'/.test(bm) && /'thumbnails'/.test(bm) && /localStorage/.test(bm) && !/saveBoardBoxes|saveJournalEntry/.test(bm), 'the view memory stays localStorage-only (no sync, no save)']);
    chk('S5', () => [sa.length > 200 && /className="show-as"/.test(sa) && /show-as-btn/.test(sa) && /aria-pressed=/.test(sa) && /data-view=/.test(sa) && /viewsOf\(/.test(sa) && /title=\{/.test(sa), 'ShowAs: icons first, the word on hover (title), aria-pressed on the current view, the views from viewsOf(kind)']);
    chk('S6', () => [/<ShowAs/.test(be) && !/boardModeTabs\.map\(/.test(be), '"Show as" replaces the three view tabs']);
    chk('S7', () => [!/setBoxes[^;]{0,60}boardMode|setBoardMode[^;]{0,120}setBoxes/.test(be.replace(/\s+/g, ' ')), 'switching view never writes boxes (positions and order are untouched)']);
  }
  chk('S8', () => {
    const o1 = M.walkOrder(seqCards()).map((b) => b.id);
    const lane = M.boardStructure(seqCards()).lanes.flatMap((l) => M.flattenLane(l));
    const noSeq = M.walkOrder([card('a', 'A\n'), card('b', 'B\n'), meta()]).map((b) => b.id);
    return [same(o1, ['c1', 'c2', 'c3']) && same(o1, lane.filter((id) => ['c1', 'c2', 'c3'].includes(id))) && same(noSeq, ['a', 'b']), JSON.stringify({ o1, noSeq })];
  });
  chk('S9', () => [M.viewsFor('board', false, true).includes('open') && same(M.viewsFor('board', true, true), ['walk']) && same(M.viewsFor('board', true, false), M.BOARD_VIEWS) && same(M.viewsFor('book', true, false), M.BOOK_VIEWS), 'below the DeskFrame width a Deck\'s only view is the Walk (frame 07); a plain board keeps its views']);

  // ---- A: adding follows the view -----------------------------------------------------------------------------------------------------------------------------------------------
  chk('A1', () => { const bx = seqCards(); const o = M.addPlacement('open', bx), s = M.addPlacement('storyboard', bx), l = M.addPlacement('outline', bx), w = M.addPlacement('walk', bx), k = M.addPlacement('flip', bx); return [o.mode === 'position' && s.mode === 'append' && l.mode === 'append' && w.mode === 'append' && w.seq > 3 && s.seq === w.seq && k.mode === 'append', JSON.stringify({ o, w, k })]; });
  {
    const be = read('components/BoardEditor.tsx');
    chk('A2', () => [/addPlacement\(/.test(be), 'the board\'s add paths read addPlacement(view, boxes)']);
  }

  // ---- W: the Walk model --------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('W1', () => [M.WALK && M.WALK.W === 700 && M.WALK.MIN_W === 360 && M.WALK.MAX_H === 520 && M.WALK.SWIPE_MS === 280, JSON.stringify(M.WALK)]);
  chk('W2', () => [M.walkStep(9, 0, -1) === 0 && M.walkStep(9, 8, 1) === 8 && M.walkStep(9, 3, 1) === 4 && M.walkStep(9, 3, -1) === 2 && M.walkStep(0, 0, 1) === 0, 'previous / next step one card and stop at the ends (no wrap)']);
  chk('W3', () => { const order = ['a', 'b', 'c', 'd'].map((id) => card(id, id + '\n')); const m = M.railMarks(order, 2, new Set(['a', 'c']), 'a'); return [same(m.map((x) => x.state), ['leaf', 'seed', 'current', 'seed']) && m[0].startHere === true && m.slice(1).every((x) => !x.startHere) && m.length === 4 && !m.some((x) => x.state === 'lit'), 'empty = seed, kindled = leaf, current = ring (current wins); Start Here folds into the first seed; no Lit until W5 - ' + JSON.stringify(m.map((x) => x.state))]; });
  chk('W4', () => { const a = M.walkCardBox(100), b = M.walkCardBox(400), c = M.walkCardBox(520), d = M.walkCardBox(900), e = M.walkCardBox(100, { w: 300 }), f = M.walkCardBox(100, { w: 500, h: 420 }); return [a.width === 700 && a.scroll === false && b.height >= 400 && b.height <= 520 && d.height === 520 && d.scroll === true && c.scroll === false && e.width === 360 && f.width === 500 && f.height >= 420, JSON.stringify({ a, d, e, f })]; });
  chk('W5', () => { M.setWalkSize('bw', { w: 640, h: 450 }); const got = M.getWalkSize('bw'); const other = M.getWalkSize('bw2'); return [got && got.w === 640 && got.h === 450 && !other, 'the size is remembered per board on the device']; });
  chk('W6', () => { const o = ['x', 'y'].map((id) => card(id, id + '\n')); return [M.walkOrder([...o, { ...card('z', ''), deletedAt: NOW }, { id: 'ink', kind: 'ink', x: 0, y: 0, w: 0.1, h: 0.1, z: 1 }]).length === 2, 'the Walk walks live text cards (tombstoned and ink cards are not steps)']; });

  // ---- M: motion (the pure slide) ----------------------------------------------------------------------------------------------------------------------------------------------
  chk('M1', () => { const n = M.swipePlan(1, false), p = M.swipePlan(-1, false), c = M.swipePlan(1, true); return [n.kind === 'slide' && n.ms === 280 && n.ms <= 320 && n.crossfade === false && p.kind === 'slide' && p.ms === 280 && n.outgoing !== p.outgoing && c.kind === 'cut' && c.ms === 0 && c.crossfade === false, JSON.stringify({ n, p, c })]; });
  {
    const css = read('index.css');
    const rules = []; { const re = /([^{}]+)\{([^{}]*)\}/g; let m; while ((m = re.exec(css))) rules.push({ sel: m[1].trim().replace(/\/\*[\s\S]*?\*\//g, '').trim(), body: m[2] }); }
    const walkCss = rules.filter((x) => /\.walk\b|\.walk-|\.show-as/.test(x.sel));
    const keyframes = [...css.matchAll(/@keyframes\s+(walk-[\w-]+)\s*\{([\s\S]*?\n\})/g)].map((m) => ({ name: m[1], body: m[2] }));
    chk('M2', () => [keyframes.length >= 2 && keyframes.every((k) => !/opacity\s*:/.test(k.body) && /transform\s*:/.test(k.body)) && /animation[^;]*280ms/.test(css.slice(css.indexOf('.walk-card'))) || /--walk-swipe:\s*280ms/.test(css), 'the swipe keyframes animate TRANSFORM only (no opacity = no cross-fade) over 280 ms; the soft edge is a mask']);
    chk('M3', () => [/mask(-image)?\s*:\s*linear-gradient/.test(walkCss.map((x) => x.body).join('\n')), 'a soft fade only at the window edges (a mask on the stage)']);
    chk('M4', () => [/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]{0,400}\.walk/.test(css), 'reduced motion = an instant cut (the swipe animation is dropped)']);

    // ---- D: dress -------------------------------------------------------------------------------------------------------------------------------------------------------------
    const blur = (body) => { const m = /box-shadow:\s*([^;]+);/.exec(body); if (!m) return false; return m[1].split(',').some((s) => { const n = s.trim().split(/\s+/).filter((t) => /^-?[\d.]+px$/.test(t)).map((t) => parseFloat(t)); return n.length >= 3 && n[2] > 0; }); };
    chk('D1', () => [walkCss.length >= 6 && walkCss.every((x) => !blur(x.body)), `${walkCss.length} W1 rules; none with a blurred shadow (flat 1 px edges only)`]);
    chk('D2', () => [walkCss.length >= 6 && walkCss.filter((x) => /\.(walk-card|walk-door|walk-nav|show-as-btn|walk-stage)\b/.test(x.sel)).every((x) => !/border-radius\s*:\s*[1-9]/.test(x.body)) && /\.walk-mark[^{]*\{[^}]*border-radius:\s*50%/.test(css), 'square edges on every box; circles only for marks (the rail)']);
    chk('D3', () => { const rest = walkCss.filter((x) => /\.(walk-door|show-as-btn|walk-mark)\b/.test(x.sel) && !/:hover|:focus|\[aria-pressed='true'\]|\[data-current|\[data-state='current'\]|\[aria-pressed="true"\]/.test(x.sel)); return [rest.length >= 3 && rest.every((x) => !/var\(--brass\)|var\(--choice\)|#ff9800/i.test(x.body)), 'Arbor: no brass on a rest-state option (doors, show-as icons, marks); brass is hover / current / chosen only']; });
    chk('D4', () => [/\.walk-nav[^{]*\{[^}]*opacity:\s*\.55/.test(css) && /\.walk-nav:hover[^{]*\{[^}]*(var\(--choice\)|var\(--brass\))/.test(css), 'chevrons rest at about 55% and turn brass (the choice colour) on hover']);
    chk('D5', () => [/\[data-theme='flux'\] \.walk-mark\[data-state='current'\][^{]*\{[^}]*border-left:[^;}]*var\(--orange\)/.test(css), 'Flux: the current tick wears the thin orange LEFT bar']);
    chk('D6', () => [/\.walk-nav[^{]*\{[^}]*(width|min-width):\s*\d+px[^}]*(height|min-height):\s*\d+px/.test(css) || /\.walk-nav[^{]*\{[^}]*aspect-ratio:\s*1/.test(css), 'the chevron hit box is square']);
    const walk = read('components/Walk.tsx');
    chk('D7', () => [/chrome-fade|useChromeDissolve/.test(walk) && /walk-nav/.test(walk), 'the chevrons carry the chrome recede (they recede while the writer types, return on pointer move or when the pointer leaves the card)']);
    chk('D8', () => [walk.length > 500 && /StepHelp/.test(walk) && !/writeThis|placeAPage|walkDoorWrite|walkDoorPlace/.test(walk.replace(/\/\/.*$/gm, '')) && /extraDoors/.test(walk), 'the Walk shows the question mark (W3) and Notes only; "Write this" / "Place a page..." are ABSENT (FIX wires them through extraDoors after W1 merges)']);
    chk('D9', () => [/BoardCardPopup|useCardEditor|CardEditor/.test(walk) && !/<textarea/.test(walk), 'writing in the Walk card is the ordinary card writing engine (the same decoration / undo / paste wall), not a second editor']);
  }

  // ---- Y: keyboard ----------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('Y1', () => [M.walkKey('ArrowRight', { onDoor: false }) === 'next' && M.walkKey('ArrowLeft', { onDoor: false }) === 'prev' && M.walkKey('Escape', { onDoor: false }) === 'exit' && M.walkKey('Enter', { onDoor: true }) === 'activate' && M.walkKey('Enter', { onDoor: false }) === null && M.walkKey('a', { onDoor: false }) === null, 'left / right step, Enter activates the focused door, Esc leaves for the board in its last shown view']);
  chk('Y2', () => { const w = read('components/Walk.tsx'); return [/walkKey\(/.test(w) && /getBoardMode|lastShown/.test(w), 'the Walk reads its keys through walkKey and Esc returns to the last shown view']; });

  // ---- L: lexicon ---------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('L1', () => { const T = (id, th) => M.deskTerm(id, th); return [T('boardModeWalk', 'plateau') === 'Walk' && T('boardModeFlip', 'plateau') === 'Flip' && T('boardModeThumbs', 'plateau') === 'Thumbnails' && T('boardModeWalk', 'flux') === 'Trace' && T('boardModeFlip', 'flux') === 'Playback' && T('boardModeThumbs', 'flux') === 'Index' && T('boardModeOpen', 'flux') === 'Live' && T('boardModeStoryboard', 'flux') === 'Sequence' && T('boardModeOutline', 'flux') === 'Spine', 'Arbor Walk / Flip / Thumbnails; Flux Live / Sequence / Spine / Trace and Playback / Index']; });
  {
    const lex = read('store/deskLexicon.ts');
    const FORBID = /\b(boards?|pages?|links?|grafts?|grafted|shelf|schematics?|drawers?|journals?|settings|themes?|tutor|sections?|binder)\b/i;
    const ids = [...lex.slice(lex.indexOf('const CANONICAL'), lex.indexOf('const OVERRIDES')).matchAll(/^  ([A-Za-z0-9]+): '(?:[^'\\]|\\.)*',?\s*(?:\/\/.*)?$/gm)].map((m) => m[1]);
    const w1 = ids.filter((i) => /^(boardMode(Walk|Flip|Thumbs)|walk[A-Z]|showAs[A-Z])/.test(i));
    chk('L2', () => [w1.length >= 5 && w1.every((i) => !FORBID.test(M.deskTerm(i, 'flux') || '')), `${w1.length} W1 strings, none an Arbor noun under Flux`]);
  }

  // ---- X: the sync-completeness law (the REAL server handler, the REAL box merge) -----------------------------------------------------------------------------------------------------
  const boardWithMeta = (m) => entryOf([card('c1', 'One\n'), meta(m)], { updatedAt: '2026-10-23T10:00:00.000Z' });
  const rt = await roundTrip(boardWithMeta({ boardKind: 'board', homeView: 'walk' }));
  keep('X1', rt.pulled && rt.pulled.boxes && (() => { const m = rt.pulled.boxes.find((b) => b.kind === 'board-meta'); return !!m && m.boardKind === 'board' && m.homeView === 'walk'; })() && !rt.rejected, JSON.stringify({ push: rt.pushStatus, rejected: rt.rejected, meta: rt.pulled && rt.pulled.boxes && rt.pulled.boxes.find((b) => b.kind === 'board-meta') }));
  const rtBook = await roundTrip(entryOf([meta({ boardKind: 'book', homeView: 'thumbnails' })], { updatedAt: '2026-10-23T10:00:00.000Z' }));
  keep('X2', rtBook.pulled && (() => { const m = rtBook.pulled.boxes.find((b) => b.kind === 'board-meta'); return !!m && m.boardKind === 'book' && m.homeView === 'thumbnails'; })(), 'a Book\'s board-meta round-trips too');
  const rtOld = await roundTrip(entryOf([meta()], { updatedAt: '2026-10-23T10:00:00.000Z' }));
  keep('X3', rtOld.pulled && (() => { const m = rtOld.pulled.boxes.find((b) => b.kind === 'board-meta'); return !!m && !('boardKind' in m) && !('homeView' in m); })(), 'no field in, no field out: an existing board round-trips untouched (no migration)');
  chk('X4', () => {
    // box-level merge at pull: the board-meta that was written LAST wins, whichever side the entry's winner is - withHomeView stamps updatedAt, so it is a decision, not a tie
    const older = M.withHomeView([card('c1', 'One\n'), meta()], 'open', () => 'm');
    const olderMeta = { ...older.find((b) => b.kind === 'board-meta'), updatedAt: '2026-10-23T09:00:00.000Z' };
    const newerMeta = { ...olderMeta, homeView: 'walk', updatedAt: '2026-10-23T11:00:00.000Z' };
    const a = M.mergeBoxLists([card('c1', 'One\n'), olderMeta], [card('c1', 'One\n'), newerMeta]).find((b) => b.kind === 'board-meta');
    const b = M.mergeBoxLists([card('c1', 'One\n'), newerMeta], [card('c1', 'One\n'), olderMeta]).find((b) => b.kind === 'board-meta');
    const stamped = M.withHomeView([meta()], 'walk', () => 'm').find((x) => x.kind === 'board-meta').updatedAt;
    return [a.homeView === 'walk' && b.homeView === 'walk' && !!stamped, JSON.stringify({ a: a.homeView, b: b.homeView, stamped })];
  });
  {
    const dbDir = path.join(SERVER_SRC);
    const schema = fs.readdirSync(dbDir).filter((f) => /\.(sql|ts)$/.test(f)).map((f) => fs.readFileSync(path.join(dbDir, f), 'utf8')).join('\n');
    keep('X5', !/board_kind|home_view|boardKind|homeView/.test(schema), 'no column, no migration, no server change: the fields ride the boxes jsonb');
    const sync = readRaw('store/sync.ts') + readRaw('store/api.ts');
    keep('X6', !/homeView|boardKind/.test(sync) && /boxes|journalEntries/.test(sync), 'the client sync layer passes entries whole (no per-field box whitelist to extend)');
  }
  return r;
}

// ---- mutants: each reaches the real source, its LANDING asserted, and must redden exactly the checks it names ------------------------------------------------------------------------------
const MUT = [
  { name: 'the Journal stops being a Book', file: 'store/boardKind.ts', find: /systemKind === 'journal'/, to: "systemKind === 'trash'", red: ['K3'] },
  { name: 'a bad homeView stops falling back', file: 'store/boardKind.ts', find: /return valid \? hv : kindDefault/, to: 'return hv', red: ['K5'] },
  { name: 'withHomeView stops stamping updatedAt', file: 'store/boardKind.ts', find: /updatedAt: new Date\(\)\.toISOString\(\)/, to: 'updatedAt: undefined', red: ['K6', 'X4'] },
  { name: 'withHomeView drops the other board-meta fields', file: 'store/boardKind.ts', find: /\.\.\.existing,/, to: '', red: ['K6'] },
  { name: 'a Preset no longer makes a Deck', file: 'store/boardKind.ts', find: /preset: \{ boardKind: 'board', homeView: 'walk' \}/, to: "preset: { boardKind: 'board', homeView: 'open' }", red: ['K7'] },
  { name: 'the view memory stops falling back to the home view', file: 'store/boardMode.ts', find: /return m && MODES\.includes\(m\) \? m : \(homeView && MODES\.includes\(homeView\) \? homeView : 'open'\)/, to: "return m && MODES.includes(m) ? m : 'open'", red: ['S1'] },
  { name: 'the walk order ignores seq', file: 'store/walk.ts', find: /boardStructure\(boxes\)/, to: 'boardStructure([])', red: ['S8'] },
  { name: 'the Walk wraps at the ends', file: 'store/walk.ts', find: /Math\.max\(0, Math\.min\(len - 1, index \+ dir\)\)/, to: '((index + dir) % Math.max(1, len) + Math.max(1, len)) % Math.max(1, len)', red: ['W2'] },
  { name: 'the rail shows Lit', file: 'store/walk.ts', find: /state: current \? 'current' : kindled \? 'leaf' : 'seed'/, to: "state: current ? 'current' : kindled ? 'lit' : 'seed'", red: ['W3'] },
  { name: 'the card never scrolls', file: 'store/walk.ts', find: /scroll: contentH > WALK\.MAX_H/, to: 'scroll: false', red: ['W4'] },
  { name: 'the swipe cross-fades', file: 'store/walk.ts', find: /crossfade: false, outgoing/, to: 'crossfade: true, outgoing', red: ['M1'] },
  { name: 'the swipe takes 400 ms', file: 'store/walk.ts', find: /SWIPE_MS: 280/, to: 'SWIPE_MS: 400', red: ['W1', 'M1'] },
  { name: 'reduced motion still slides', file: 'store/walk.ts', find: /reduced \? \{ kind: 'cut'/, to: "false ? { kind: 'cut'", red: ['M1'] },
  { name: 'Enter steps the Walk', file: 'store/walk.ts', find: /key === 'Enter' && ctx\.onDoor/, to: "key === 'Enter'", red: ['Y1'] },
  { name: 'adding in the Walk places by position', file: 'store/walk.ts', find: /view === 'open' \? \{ mode: 'position' \}/, to: "view !== 'flip' ? { mode: 'position' }", red: ['A1'] },
  { name: 'a Deck on a small screen keeps Open', file: 'store/walk.ts', find: /narrow && deck \? \['walk'\]/, to: 'false ? [\'walk\']', red: ['S9'] },
  { name: 'the swipe keyframes cross-fade', file: 'index.css', find: /@keyframes walk-in-next\s*\{\s*from\s*\{\s*transform/, to: '@keyframes walk-in-next { from { opacity: 0; transform', red: ['M2'] },
  { name: 'the Walk card gets a drop shadow', file: 'index.css', find: /\.walk-card\s*\{/, to: '.walk-card { box-shadow:0 8px 24px rgba(0,0,0,.4);', red: ['D1'] },
  { name: 'the chevrons stop resting at 55%', file: 'index.css', find: /\.walk-nav\s*\{([^}]*)opacity:\s*\.55/, to: '.walk-nav {$1opacity: 1', red: ['D4'] },
  { name: 'the Walk offers Write this before W2', file: 'components/Walk.tsx', find: /extraDoors/, to: 'extraDoors, writeThis', red: ['D8'] },
  { name: 'Show as drops its pressed state', file: 'components/ShowAs.tsx', find: /aria-pressed=/, to: 'data-pressed=', red: ['S5'] },
  { name: 'the Show-as words lose Trace', file: 'store/deskLexicon.ts', find: /boardModeWalk: 'Trace'/, to: "boardModeWalk: 'Walk'", red: ['L1'] },
];

// ---- run ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
try {
  const base = await tryLoad({});
  if (base.err) ok('the real modules bundle against a fake browser', false, base.err);
  const rd = (over) => (rel) => { const t = readRaw(rel); return over[rel] && t ? over[rel](t) : t; };
  const M0 = base.M || {};
  const res0 = await suite(M0, rd({}));
  for (const [k, v] of Object.entries(res0)) ok(k, v.pass, v.detail);
  ok('the suite ran every check it names', Object.keys(res0).length >= 48, `${Object.keys(res0).length} checks`);

  let landed = 0, killed = 0, notLanded = 0;
  for (const m of MUT) {
    let did = false;
    const over = { [m.file]: (text) => { const out = text.replace(m.find, typeof m.to === 'string' ? () => m.to : m.to); if (out !== text) did = true; return out; } };
    const L = await tryLoad(over);
    let red = []; let how = 'checks';
    if (L.err) { how = 'CRASH'; red = ['(bundle)']; } else {
      let res; try { res = await suite(L.M, rd(over)); } catch (e) { res = { '(suite crash)': { pass: false } }; }
      red = Object.entries(res).filter(([, v]) => !v.pass).map(([k]) => k);
    }
    if (!did) { notLanded += 1; ok(`mutant "${m.name}" LANDED`, false, `no match in ${m.file}${has(m.file) ? '' : ' (the file does not exist yet - the build writes it)'}`); continue; }
    landed += 1;
    const hit = m.red.every((k) => red.includes(k));
    if (hit && how === 'checks') killed += 1;
    ok(`mutant "${m.name}" is KILLED by a check (reddens: ${red.join(', ') || 'none'})`, hit && how === 'checks', hit ? (how === 'CRASH' ? 'crashed the bundle - not evidence' : '') : `expected ${m.red.join(', ')}; got ${red.join(', ') || 'none'}`);
  }
  ok(`all ${MUT.length} mutations landed and ${MUT.length} were killed`, landed === MUT.length && killed === MUT.length, `${landed} landed / ${killed} killed / ${notLanded} found nothing to mutate`);
} finally {
  fs.rmSync(tmpServer, { recursive: true, force: true });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nGUIDED-W1 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nGUIDED-W1 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
