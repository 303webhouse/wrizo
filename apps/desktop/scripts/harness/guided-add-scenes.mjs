// "ADD SCENES..." - CHILD CARDS UNDER A STEP (Fable's brief Oct 25: Downloads\add-scenes-brief.md; mockups s1-s5; Nick APPROVED the design and the word table). WRITTEN BEFORE THE BUILD: red on main c0b440d8.
// No new data: a child is an ordinary text card with the EXISTING `parentId` (nesting, already synced) - same lane, ordered right after its step; its question rides as `prompt` (W3's placeholder: shown in the empty body,
// never part of `text`). The word changes with the deck (the registry's optional `childWord` + the lexicon).
//
// THE CONTRACT (module -> exports):
//   decks/types.ts + decks/library/*   DeckDefinition.childWord?: ChildWord ('scene' | 'beat' | 'moment' | 'entry' | 'subsection' | 'section' | 'point' | 'part')
//   store/childSteps.ts (NEW)          CHILD_MAX (5) CHILD_DEFAULT (3) ; childWordOf(deckId) -> ChildWord | null ; sceneDoorFor(box, isDeck) -> ChildWord | null (ONLY a top-level step dealt from a Deck that has a word) ;
//                                      addChildren(boxes, parentId, n, o: { title, question, newId, now }) -> { boxes, ids } (n clamped 1..5; same lane; seq after the step's last child; titles "<Word> n" CONTINUING; the question is `prompt`) ;
//                                      subStepInfo(order, boxId) -> { parentId, parentTitle, n, m, mainN, mainM } | null ; railGroups(order) -> [{ id, kids: [id] }] (children hang from their parent's mark)
//   store/guided.ts                    kindled(): a parent is kindled when it OR any LIVE child is (children have their own)
//   store/walk.ts                      cardIsEmpty(): a child awaiting its first words (title + question, no body) is EMPTY, so the arrows still step
//   store/fluxReadouts.ts              subTrackReadout(n, k, m) -> "TRK 5.2/9"
//   lexicon                            per word: kidDoor_<w> kidPlural_<w> kidTitle_<w> kidQ_<w> ; generic: kidHowMany kidKicker kidNote kidAdd kidReadout (Flux "n/m")
//   components/ScenesPopover.tsx (NEW) .scenes-pop[role=dialog] > .scenes-kicker + .scenes-q + .scenes-chip[data-n] (1-5, default 3) + .scenes-add + .scenes-note ; Esc closes; nothing is created until Add
//
//   PART 1 (browserless; this file)   A the door, B adding, C the Walk's order, D readouts, E coverage, F rail groups, G keyboard, H lexicon + the word table, X sync round trip, S dress (stylesheet), W wiring (source)
//   PART 2 (guided-add-scenes-part2.mjs, a box turn)   the live app: the door and popover, add 1..5, Esc, the Walk's readout / edge / hanging rail, Outline nesting, Arbor + Flux, dark + light
//   Every check has a mutant, its landing asserted.   Run: node scripts/harness/guided-add-scenes.mjs   (from apps/desktop; no box needed)
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

let nonce = 0;
async function load(over = {}) {
  nonce += 1;
  const lines = [`export const __n = ${nonce};`, "export { deskTerm } from './store/deskLexicon';", "export { mergeBoxLists, liveBoxes } from './store/boxTombstones';", "export { kindled } from './store/guided';", "export { walkOrder, cardIsEmpty } from './store/walk';", "export { trackReadout } from './store/fluxReadouts';", "export { DECKS } from './decks/library';"];
  if (has('store/childSteps.ts')) lines.push("export * from './store/childSteps';");
  if (/subTrackReadout/.test(readRaw('store/fluxReadouts.ts'))) lines.push("export { subTrackReadout } from './store/fluxReadouts';");
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
const tmpServer = path.join(SERVER, '.scenes-harness-scratch');
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
  const req = { body, session: { userId: 'scenes-harness-user' } };
  return new Promise((resolve) => { const res = { statusCode: 200 }; res.status = (c) => { res.statusCode = c; return res; }; res.json = (b) => { resolve({ status: res.statusCode, body: b }); return res; }; findHandler(router, '/sync', 'post')(req, res, (err) => resolve({ status: 599, body: { thrown: String(err) } })); });
}
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = 'postgres://unused/unused';
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
const NOW = '2026-10-26T00:00:00.000Z';
const NAMES = ['Hook', 'Midpoint Reversal', 'Darkest Point', 'Climax', 'Final Image'];
const step = (i, extra = {}) => ({ id: `s${i + 1}`, kind: 'text', x: 0.05 + i * 0.1, y: 0.1, w: 0.2, h: 0.1, z: i + 1, seq: i + 1, text: `${NAMES[i]}\n`, prompt: `What happens at ${NAMES[i]}?`, deckStep: { deck: 'three-act', step: `st${i}` }, ...extra });
const steps = () => NAMES.map((_, i) => step(i));
const meta = (extra = {}) => ({ id: 'meta1', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk', ...extra });
const entryOf = (boxes) => ({ id: 'e1', text: 'Three-Act', pageType: 'board', boxes, createdAt: NOW, updatedAt: NOW });
const Q_SCENE = 'What happens in this scene, and what has changed by its end?';
const add = (M, boxes, parent, n, extra = {}) => { let k = 0; return M.addChildren(boxes, parent, n, { title: 'Scene', question: Q_SCENE, newId: () => `c${++k}-${n}`, now: NOW, ...extra }); };
const read = (rel) => readRaw(rel);
const zone = (text) => { const a = text.indexOf('/* SCENES-BEGIN'); const b = text.indexOf('/* SCENES-END'); return a >= 0 && b > a ? text.slice(a, b) : ''; };
const WORDS = {
  scene: { decks: ['three-act', 'hero-journey', 'story-circle', 'feature-screenplay'], door: 'Add scenes\u2026', plural: 'scenes', title: 'Scene', q: Q_SCENE },
  beat: { decks: ['scene-sequel'], door: 'Add beats\u2026', plural: 'beats', title: 'Beat', q: 'What happens in this beat?' },
  moment: { decks: ['character-study'], door: 'Add moments\u2026', plural: 'moments', title: 'Moment', q: 'What does this moment show about them?' },
  entry: { decks: ['worldbuilding'], door: 'Add entries\u2026', plural: 'entries', title: 'Entry', q: 'What is it, and what does it change for the people here?' },
  subsection: { decks: ['research-paper'], door: 'Add subsections\u2026', plural: 'subsections', title: 'Subsection', q: 'What does this subsection report?' },
  section: { decks: ['thesis', 'feature-story'], door: 'Add sections\u2026', plural: 'sections', title: 'Section', q: 'What does this section argue or show?', qBy: { 'feature-story': 'What does this section of the story do?' } },
  point: { decks: ['argument-essay'], door: 'Add points\u2026', plural: 'points', title: 'Point', q: 'What is the point, and what backs it?' },
  part: { decks: ['business-proposal', 'grant'], door: 'Add parts\u2026', plural: 'parts', title: 'Part', q: 'What does this part need to say?' },
};

async function suite(M, rd) {
  const R = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); R[id] = { pass: !!pass, detail: detail || '' }; } catch (e) { R[id] = { pass: false, detail: 'threw: ' + String((e && e.message) || e).split('\n')[0].slice(0, 160) }; } };
  const T = (id, th) => M.deskTerm(id, th);

  // ---- A: the door ------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('A1', () => { const bad = []; for (const [w, o] of Object.entries(WORDS)) for (const d of o.decks) if (M.childWordOf(d) !== w) bad.push(`${d}:${M.childWordOf(d)}`); const none = M.childWordOf('from-my-pages') === null && M.childWordOf('nope') === null; return [bad.length === 0 && none, 'every deck says its word (the table); From my pages and an unknown deck have none: ' + (bad.join(',') || 'ok')]; });
  chk('A2', () => { const reg = M.DECKS.filter((d) => d.childWord).map((d) => `${d.id}:${d.childWord}`).sort(); const want = Object.entries(WORDS).flatMap(([w, o]) => o.decks.map((d) => `${d}:${w}`)).sort(); return [same(reg, want), 'the word lives in the deck registry (DeckDefinition.childWord), nowhere else: ' + reg.length + ' decks']; });
  chk('A3', () => { const s = step(1); return [M.sceneDoorFor(s, true) === 'scene' && M.sceneDoorFor(step(1, { deckStep: { deck: 'scene-sequel', step: 'x' } }), true) === 'beat', 'a top-level step of a Deck shows the door, in its deck\'s word']; });
  chk('A4', () => { const child = step(1, { parentId: 's1' }); const plain = { id: 'p', kind: 'text', x: 0, y: 0, w: 0.2, h: 0.1, z: 1, text: 'Plain\n' }; const fmp = step(0, { deckStep: { deck: 'from-my-pages', step: 'x' } }); const mirror = step(0, { sourceEntryId: 'pg' }); const ink = { ...step(0), kind: 'ink' }; return [M.sceneDoorFor(child, true) === null && M.sceneDoorFor(plain, true) === null && M.sceneDoorFor(step(0), false) === null && M.sceneDoorFor(fmp, true) === null && M.sceneDoorFor(mirror, true) === null && M.sceneDoorFor(ink, true) === null, 'NOT on a sub-step (one level deep), not on a plain card, not on a plain Board, not on From my pages, not on a mirror']; });
  const s0 = () => step(0);

  // ---- B: adding --------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('B1', () => { const bad = []; for (let n = 1; n <= 5; n++) { const base = steps(); const r = add(M, base, 's2', n); const kids = r.boxes.filter((b) => b.parentId === 's2'); const ok1 = r.boxes.length === base.length + n && kids.length === n && r.ids.length === n && kids.every((k, i) => k.kind === 'text' && k.text === `Scene ${i + 1}\n` && k.id === r.ids[i]); if (!ok1) bad.push(n); } return [bad.length === 0, `N = 1..5 makes exactly N ordinary text cards titled Scene 1..n: bad ${bad.join(',') || 'none'}`]; });
  chk('B2', () => { const base = steps().map((b) => (b.id === 's2' ? { ...b, laneId: 'laneA' } : b)); const r = add(M, base, 's2', 2); const kids = r.boxes.filter((b) => b.parentId === 's2'); const none = add(M, steps(), 's2', 1).boxes.find((b) => b.parentId === 's2'); return [kids.every((k) => k.laneId === 'laneA') && !('laneId' in none), 'the same lane as the step (and no laneId key when the step has none)']; });
  chk('B3', () => { const base = steps(); const r1 = add(M, base, 's2', 2); const kids1 = r1.boxes.filter((b) => b.parentId === 's2'); const r2 = M.addChildren(r1.boxes, 's2', 2, { title: 'Scene', question: Q_SCENE, newId: (() => { let k = 0; return () => `d${++k}`; })(), now: NOW }); const kids2 = r2.boxes.filter((b) => b.parentId === 's2'); const order = M.walkOrder(r2.boxes).map((b) => b.text.split('\n')[0]); return [kids2.length === 4 && same(kids2.slice(2).map((k) => k.text.split('\n')[0]), ['Scene 3', 'Scene 4']) && kids2.slice(2).every((k) => k.seq > Math.max(...kids1.map((x) => x.seq))) && same(order.slice(0, 8), ['Hook', 'Midpoint Reversal', 'Scene 1', 'Scene 2', 'Scene 3', 'Scene 4', 'Darkest Point', 'Climax']), 'adding again CONTINUES the numbering and the order (after the existing children, before the next step): ' + order.join(' / ')]; });
  chk('B4', () => { const base = steps(); const r1 = add(M, base, 's2', 3); const del = r1.boxes.map((b) => (b.id === r1.ids[1] ? { ...b, deletedAt: NOW, updatedAt: NOW } : b)); const r2 = M.addChildren(del, 's2', 1, { title: 'Scene', question: Q_SCENE, newId: () => 'zz', now: NOW }); const t = r2.boxes.find((b) => b.id === 'zz').text.split('\n')[0]; return [t === 'Scene 4', 'the numbering never repeats a title that is still there (Scene 2 deleted of 3: the next is Scene 4, not a second Scene 3): ' + t]; });
  chk('B5', () => { const r = add(M, steps(), 's3', 2); const k = r.boxes.find((b) => b.id === r.ids[0]); return [k.prompt === Q_SCENE && !k.text.includes('What happens') && k.text === 'Scene 1\n' && !('deckStep' in k) && !('sourceEntryId' in k) && !('lit' in k), 'the question is the PLACEHOLDER (the box\'s prompt), never stored in the text; a child is no dealt step (no deckStep, so no "?")']; });
  chk('B6', () => { const base = steps(); const snap = JSON.stringify(base); const r = add(M, base, 's2', 3); const others = r.boxes.filter((b) => !r.ids.includes(b.id)); return [JSON.stringify(base) === snap && others.length === base.length && others.every((b, i) => b === base[i]), 'pure: the input is not touched and every other card comes back as the very same object']; });
  chk('B7', () => { const base = steps(); const a = add(M, base, 's2', 0); const z = add(M, base, 's2', 9); const c = add(M, base, 's2', 2.7); const kids = (x) => x.boxes.filter((b) => b.parentId === 's2').length; return [kids(a) === 1 && kids(z) === 5 && kids(c) === 2, `N is clamped to 1..5 (0 -> ${kids(a)}, 9 -> ${kids(z)}, 2.7 -> ${kids(c)})`]; });
  chk('B8', () => { const r1 = add(M, steps(), 's2', 1); const kid = r1.ids[0]; const r2 = add(M, r1.boxes, kid, 2); const r3 = add(M, steps(), 'nope', 2); const plain = add(M, [{ id: 'p', kind: 'text', x: 0, y: 0, w: 0.2, h: 0.1, z: 1, text: 'Plain\n' }], 'p', 2); return [r2.boxes === r1.boxes && r2.ids.length === 0 && r3.ids.length === 0 && plain.ids.length === 0, 'one level deep: nothing is created under a sub-step, an unknown card or a plain card']; });
  chk('B9', () => { const r = add(M, steps(), 's2', 3); const kids = r.boxes.filter((b) => b.parentId === 's2'); return [kids.every((k) => typeof k.x === 'number' && typeof k.y === 'number' && k.w > 0 && k.h > 0 && k.z > Math.max(...steps().map((s) => s.z))) && new Set(kids.map((k) => `${k.x}|${k.y}`)).size === 3, 'Open gets a place for each: sized, above the others, never stacked exactly on one another']; });
  chk('B10', () => { const noSeq = [{ ...step(0), seq: undefined }, { ...step(1), seq: undefined }, { ...step(2), seq: undefined }].map((b) => { const { seq: _s, ...rest } = b; return rest; }); const r = add(M, noSeq, 's2', 2); const order = M.walkOrder(r.boxes).map((b) => b.id); return [order[1] === 's2' && order[2] === r.ids[0] && order[3] === r.ids[1] && order[4] === 's3', 'a board that was never reordered (no seq anywhere) still walks the children right after their step']; });

  // ---- C/D: the Walk's order and the readouts ---------------------------------------------------------------------------------------------------------------------------------
  const withKids = () => add(M, steps(), 's2', 3);
  chk('C1', () => { const r = withKids(); const w = M.walkOrder(r.boxes); return [w.length === 8 && same(w.slice(0, 5).map((b) => b.id), ['s1', 's2', ...r.ids]) && w[5].id === 's3', 'the Walk is the parent then its children, then the next step (walkOrder keeps flattening)']; });
  chk('D1', () => { const r = withKids(); const w = M.walkOrder(r.boxes); const i = M.subStepInfo(w, r.ids[1]); return [i && i.parentId === 's2' && i.parentTitle === 'Midpoint Reversal' && i.n === 2 && i.m === 3 && i.mainN === 2 && i.mainM === 5 && M.subStepInfo(w, 's2') === null && M.subStepInfo(w, 'nope') === null, JSON.stringify(i)]; });
  chk('D2', () => { const r = withKids(); const w = M.walkOrder(r.boxes); const a = M.subStepInfo(w, r.ids[0]), c = M.subStepInfo(w, r.ids[2]); return [a.n === 1 && a.m === 3 && c.n === 3 && c.m === 3, 'Scene 1 of 3 ... Scene 3 of 3']; });
  chk('D3', () => [M.subTrackReadout(5, 2, 9) === 'TRK 5.2/9' && M.trackReadout(5, 9) === 'TRK 5/9', 'Flux reads TRK 5.2/9: a position, never a count']);
  chk('D4', () => { const a = T('kidReadout', 'plateau'), f = T('kidReadout', 'flux'); const fmt = (s) => s.replace('{parent}', 'Midpoint Reversal').replace('{word}', 'Scene').replace('{n}', '2').replace('{m}', '3'); return [fmt(a) === 'Midpoint Reversal \u203a Scene 2 of 3' && fmt(f) === 'Midpoint Reversal \u203a Scene 2/3', fmt(a) + ' | ' + fmt(f)]; });

  // ---- E: coverage ------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('E1', () => { const r = withKids(); const worded = r.boxes.map((b) => (b.id === r.ids[1] ? { ...b, text: 'Scene 2\nShe opens the door.' } : b)); const parent = worded.find((b) => b.id === 's2'); return [M.kindled('e1', parent, worded) === true && M.kindled('e1', worded.find((b) => b.id === r.ids[1]), worded) === true && M.kindled('e1', worded.find((b) => b.id === r.ids[0]), worded) === false && M.kindled('e1', worded.find((b) => b.id === 's3'), worded) === false, 'a parent is kindled when it OR any child is; the children have their own kindled; an untouched sibling and the next step are not']; });
  chk('E2', () => { const r = withKids(); const worded = r.boxes.map((b) => (b.id === r.ids[1] ? { ...b, text: 'Scene 2\nWords', deletedAt: NOW } : b)); return [M.kindled('e1', worded.find((b) => b.id === 's2'), worded) === false, 'a DELETED child (a tombstone) kindles nothing']; });
  chk('E3', () => { const r = withKids(); return [M.kindled('e1', r.boxes.find((b) => b.id === 's2'), r.boxes) === false && M.kindled('e1', r.boxes.find((b) => b.id === 's2')) === false, 'children with no words kindle nothing; a parent asked without its board reads only itself']; });
  chk('E4', () => { const own = steps().map((b) => (b.id === 's2' ? { ...b, text: 'Midpoint Reversal\nHer words' } : b)); const r = add(M, own, 's2', 2); return [M.kindled('e1', r.boxes.find((b) => b.id === 's2'), r.boxes) === true, 'a parent with its own words stays kindled whatever its children do']; });

  // ---- F: the rail's groups, G: keyboard -------------------------------------------------------------------------------------------------------------------------------------
  chk('F1', () => { const r = withKids(); const g = M.railGroups(M.walkOrder(r.boxes)); return [g.length === 5 && same(g[1], { id: 's2', kids: r.ids }) && g.filter((x) => x.kids.length).length === 1 && g[0].kids.length === 0, 'five main marks; the three small marks hang from Midpoint Reversal\'s']; });
  chk('G1', () => { const r = withKids(); const kid = r.boxes.find((b) => b.id === r.ids[0]); const worded = { ...kid, text: 'Scene 1\nWords' }; return [M.cardIsEmpty(kid, true) === true && M.cardIsEmpty(worded, true) === false && M.cardIsEmpty({ text: 'Plain\n' }) === false && M.cardIsEmpty(kid, false) === false, 'a Deck\'s child awaiting its first words is EMPTY (the arrows step, as for any dealt step); with words it is not, and a nested card on a plain Board keeps its title as the writer\'s']; });

  // ---- H: the lexicon + the word table -----------------------------------------------------------------------------------------------------------------------------------------
  chk('H1', () => { const bad = []; for (const [w, o] of Object.entries(WORDS)) { if (T(`kidDoor_${w}`, 'plateau') !== o.door) bad.push('door ' + w); if (T(`kidPlural_${w}`, 'plateau') !== o.plural) bad.push('plural ' + w); if (T(`kidTitle_${w}`, 'plateau') !== o.title) bad.push('title ' + w); if (T(`kidQ_${w}`, 'plateau') !== o.q && !o.qBy) bad.push('q ' + w); } return [bad.length === 0, 'the word table, verbatim, in Arbor: ' + (bad.join(',') || '8 words x door / plural / title / question')]; });
  chk('H2', () => { const bad = []; for (const [w] of Object.entries(WORDS)) { const d = T(`kidDoor_${w}`, 'flux'); if (d !== `[+ ${T(`kidPlural_${w}`, 'plateau').toUpperCase()}]`) bad.push(w + ':' + d); } return [bad.length === 0, 'Flux sets the door as "[+ SCENES]" and the like: ' + (bad.join(',') || 'ok')]; });
  chk('H4', () => { const q = T('kidQ_section_story', 'plateau'); return [q === WORDS.section.qBy['feature-story'] && M.childQuestionOf('feature-story') === q && M.childQuestionOf('thesis') === WORDS.section.q && M.childQuestionOf('three-act') === Q_SCENE && M.childQuestionOf('from-my-pages') === null, 'Feature Story asks its own section question ("...of the story do?"); every other deck its word\'s']; });
  chk('H5', () => { const bad = []; const ids = Object.keys(WORDS).flatMap((w) => [`kidDoor_${w}`, `kidPlural_${w}`, `kidTitle_${w}`, `kidQ_${w}`]).concat(['kidQ_section_story', 'kidHowMany', 'kidKicker', 'kidNote', 'kidAdd', 'kidReadout']); for (const th of ['plateau', 'flux', 'machina']) for (const id of ids) { const s = T(id, th); if (!s || (th !== 'plateau' && /\bpages?\b/i.test(s))) bad.push(th + ':' + id); } return [bad.length === 0, 'every theme answers every key, and Flux "docs" / Machina "files" never say "pages": ' + (bad.slice(0, 4).join(',') || ids.length + ' keys x 3 themes')]; });
  chk('H6', () => { const hm = T('kidHowMany', 'plateau'), k = T('kidKicker', 'plateau'), n = T('kidNote', 'plateau'); return [hm === 'How many {plural}?' && /^Add \{plural\} under this step$/i.test(k) && n === 'They go right under {step}.' && T('kidAdd', 'plateau') === 'Add', 'How many scenes? / ADD SCENES UNDER THIS STEP / They go right under <step>. / Add']; });

  // ---- S: dress (the stylesheet's SCENES zone) -----------------------------------------------------------------------------------------------------------------------------------
  const z = zone(rd('index.css'));
  chk('S1', () => [z.length > 600, 'the SCENES zone exists in the stylesheet (markers SCENES-BEGIN / SCENES-END)']);
  chk('S2', () => { const sh = [...z.matchAll(/box-shadow:\s*([^;}]+)/g)].map((m) => m[1].trim()).filter((v) => v !== 'none'); const rad = [...z.matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1].trim()); return [z.length > 0 && sh.length === 0 && rad.every((r) => r === '0' || r === '50%'), `square, no shadow (circles only for the small marks): ${sh.join('|') || 'none'}; radii ${[...new Set(rad)].join(',') || 'none'}`]; });
  chk('S3', () => [/\.walk-card\[data-sub='true'\][^{}]*\{[^}]*3px solid #8f7a4c/i.test(z) && /\.walk-subrail[^{}]*\{[^}]*#8f7a4c/i.test(z), 'Arbor: a 3 px bronze #8f7a4c edge on the sub-step card, a bronze hairline for the hanging rail']);
  chk('S4', () => { const orange = z.split(/\n/).filter((l) => /orange/.test(l) && /\{/.test(l)); return [orange.every((l) => /aria-current|data-current='true'/.test(l)), 'Flux: the orange bar only when current, as today (' + orange.length + ' orange rules)']; });
  chk('S5', () => { const kids = /\.walk-mark\[data-sub='true'\][^{}]*\{[^}]*width:\s*(\d+)px/.exec(z); return [!!kids && +kids[1] <= 12, 'the hanging marks are smaller than the main ones']; });
  chk('S6', () => [!/animation\s*:|transition\s*:/.test(z.replace(/transition:\s*none/g, '')), 'no motion at all in the zone: nothing to reduce (the popover simply appears; reduced motion is the same still state)']);
  chk('S7', () => [/\.scenes-chip\b[^{}]*\{[^}]*border-radius:\s*0/.test(z) && /\.scenes-pop\b[^{}]*\{[^}]*border-radius:\s*0/.test(z), 'the popover and its chips are square']);

  // ---- W: wiring (source) -----------------------------------------------------------------------------------------------------------------------------------------------------
  const wk = rd('components/Walk.tsx'), be = rd('components/BoardEditor.tsx'), bp = rd('components/BoardProjection.tsx'), pop = rd('components/ScenesPopover.tsx');
  chk('W1', () => [wk.indexOf("key: 'scenes'") > wk.indexOf('p.extraDoors') && /data-door/.test(wk), 'the scenes door is AFTER W2\'s doors in the Walk\'s row (the last among the step\'s own doors)']);
  chk('W2', () => [/Escape/.test(pop) && /scenes-chip/.test(pop) && /onAdd\(/.test(pop) && /useState(?:<[^>]+>)?\(\s*CHILD_DEFAULT\s*\)/.test(pop) && (pop.match(/\.onAdd\(/g) || []).length === 1, 'Esc closes, the chips are 1-5 with 3 chosen, and nothing is created until Add (onAdd is called only from the Add button)']);
  chk('W3', () => [/addChildren\(/.test(be) && /setWalkJumpId\(/.test(be.slice(be.indexOf('addChildren('), be.indexOf('addChildren(') + 900)), 'the board adds through addChildren and the Walk lands on the first new child']);
  chk('W4', () => [/sceneDoorFor\(/.test(be) && /sceneWord\?\.\(b\)/.test(bp) && /<ScenesDoor/.test(bp) && /sceneWord=\{deckBoard \? sceneWordOf : undefined\}/.test(be), 'Storyboard and Outline offer the same door on a top-level step (and only there)']);
  chk('W5', () => [/data-sub=/.test(wk) && /walk-subrail/.test(wk) && /railGroups\(/.test(wk) && /subStepInfo\(/.test(wk), 'the Walk draws the sub-step edge, the readout and the hanging rail from the pure model']);
  chk('W6', () => { const g = rd('store/guided.ts'); return [/parentId/.test(g.slice(g.indexOf('export function kindled'))) && /liveBoxes/.test(g), 'kindled() reads the live children (one gate, no second definition of "begun")']; });
  chk('W7', () => { const s = rd('store/childSteps.ts').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''); return [s.length > 0 && !/localStorage|toast|setInterval/.test(s) && !/\bchildOf\b|childIds|isScene|childOfId/.test(s), 'no new data: no storage, no new field named anywhere (only parentId, laneId, seq, prompt)']; });
  chk('W8', () => { const t = rd('types/index.ts'); return [!/childWord|isScene|scenes\?:/.test(t), 'the Box type gains nothing']; });
  return R;
}

// ---- mutants ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const MUT = [
  { name: 'the door shows on a sub-step', file: 'store/childSteps.ts', find: /!box\.parentId &&/, to: '', red: ['A4'] },
  { name: 'the door shows on a plain card', file: 'store/childSteps.ts', find: / && !!box\.deckStep\)/, to: ')', red: ['A4'] },
  { name: 'five becomes six', file: 'store/childSteps.ts', find: /CHILD_MAX\s*=\s*5/, to: 'CHILD_MAX = 6', red: ['B7'] },
  { name: 'a second batch lands among the first (seq restarts)', file: 'store/childSteps.ts', find: /Math\.max\(\.\.\.kids\.map\(key\)\) \+ 1/, to: '0', red: ['B3'] },
  { name: 'numbering restarts at 1', file: 'store/childSteps.ts', find: /const start = Math\.max\(kids\.length, \.\.\.numbered, 0\);/, to: 'const start = 0;', red: ['B3'] },
  { name: 'the question is stored in the text', file: 'store/childSteps.ts', find: /text: `\$\{o\.title\} \$\{num\}\\n`/, to: 'text: `${o.title} ${num}\\n${o.question}`', red: ['B5', 'G1'] },
  { name: 'a child lands in the default lane', file: 'store/childSteps.ts', find: /\.\.\.\(parent\.laneId \? \{ laneId: parent\.laneId \} : \{\}\),/, to: '', red: ['B2'] },
  { name: 'the parent is not kindled by a child', file: 'store/guided.ts', find: /return liveBoxes\(boxes\)\.some/, to: 'return false && liveBoxes(boxes).some', red: ['E1'] },
  { name: 'a tombstoned child counts', file: 'store/guided.ts', find: /liveBoxes\(boxes\)\.some/, to: '(boxes as Box[]).some', red: ['E2'] },
  { name: 'the readout says TRK 5/9', file: 'store/fluxReadouts.ts', find: /return `TRK \$\{n\}\.\$\{k\}\/\$\{m\}`;/, to: 'return `TRK ${n}/${m}`;', red: ['D3'] },
  { name: 'Flux door is plain', file: 'store/deskLexicon.ts', find: /kidDoor_scene: '\[\+ SCENES\]'/, to: "kidDoor_scene: 'Add scenes\\u2026'", red: ['H2'] },
  { name: 'Feature Story gets the wrong word', file: 'decks/library/featureStory.ts', find: /childWord: 'section'/, to: "childWord: 'point'", red: ['A1', 'A2'] },
  { name: 'a child blocks the arrows', file: 'store/walk.ts', find: / \|\| \(inDeck && !!box\.parentId\)/, to: '', red: ['G1'] },
];

let failedHard = false;
try {
  const base = await tryLoad({});
  if (base.err) ok('the real modules bundle against a fake browser', false, base.err);
  const rd = (over) => (rel) => { const t = readRaw(rel); return over[rel] && t ? over[rel](t) : t; };
  const M0 = base.M || {};
  const res0 = await suite(M0, rd({}));
  for (const [k, v] of Object.entries(res0)) ok(k, v.pass, v.detail);

  // X: the children ride the existing fields: through the REAL server handler and the REAL box merge
  {
    const kids = typeof M0.addChildren === 'function' ? add(M0, steps(), 's2', 2) : { boxes: steps(), ids: [] };
    const entry = entryOf([...kids.boxes, meta()]);
    let rt; try { rt = await roundTrip(entry); } catch (e) { rt = { err: String(e.message || e).slice(0, 160) }; }
    const pulled = rt.pulled && Array.isArray(rt.pulled.boxes) ? rt.pulled.boxes : [];
    const back = kids.ids.map((id) => pulled.find((b) => b.id === id));
    ok('X1 the children survive push -> pull through the real /sync handler with parentId, seq, laneId and prompt (existing fields only)', kids.ids.length === 2 && back.every((b, i) => !!b && b.parentId === 's2' && b.seq === kids.boxes.find((x) => x.id === kids.ids[i]).seq && b.prompt === Q_SCENE && b.text === `Scene ${i + 1}\n`) && rt.pushStatus === 200 && !rt.err, rt.err || JSON.stringify({ push: rt.pushStatus, back: back.map((b) => b && b.parentId) }));
    const edited = kids.boxes.map((b) => (b.id === kids.ids[0] ? { ...b, text: 'Scene 1\nHer words', updatedAt: '2026-10-26T05:00:00.000Z' } : b));
    const merged = kids.ids.length ? M0.mergeBoxLists(kids.boxes, edited) : [];
    const mk = merged.find((b) => b.id === kids.ids[0]);
    ok('X2 the real box merge: a child edited later on another device wins, and keeps its parentId', kids.ids.length === 2 && !!mk && mk.text === 'Scene 1\nHer words' && mk.parentId === 's2' && merged.filter((b) => b.parentId === 's2').length === 2, mk ? mk.text : 'no child');
    const keys = new Set(kids.boxes.filter((b) => kids.ids.includes(b.id)).flatMap((b) => Object.keys(b)));
    ok('X3 a child carries only existing Box fields', kids.ids.length === 2 && [...keys].every((k) => ['id', 'kind', 'x', 'y', 'w', 'h', 'z', 'text', 'prompt', 'parentId', 'laneId', 'seq'].includes(k)), [...keys].join(','));
  }

  let landed = 0, killed = 0, notLanded = 0;
  for (const m of MUT) {
    let did = false;
    const over = { [m.file]: (text) => { const out = text.replace(m.find, typeof m.to === 'string' ? () => m.to : m.to); if (out !== text) did = true; return out; } };
    const L = await tryLoad(over);
    let red = []; let how = 'checks';
    if (L.err) { how = 'CRASH'; red = ['(bundle)']; } else {
      let res; try { res = await suite(L.M, rd(over)); } catch { res = { '(suite crash)': { pass: false } }; }
      red = Object.entries(res).filter(([, v]) => !v.pass).map(([k]) => k);
    }
    if (!did) { notLanded += 1; ok(`mutant "${m.name}" LANDED`, false, `no match in ${m.file}${has(m.file) ? '' : ' (the file does not exist yet - the build writes it)'}`); continue; }
    landed += 1;
    const hit = m.red.every((k) => red.includes(k));
    if (hit && how === 'checks') killed += 1;
    ok(`mutant "${m.name}" is KILLED by a check (reddens: ${red.join(', ') || 'none'})`, hit && how === 'checks', hit ? (how === 'CRASH' ? 'crashed the bundle - not evidence' : '') : `expected ${m.red.join(', ')}; got ${red.join(', ') || 'none'}`);
  }
  ok(`all ${MUT.length} mutations landed and ${MUT.length} were killed`, landed === MUT.length && killed === MUT.length, `${landed} landed / ${killed} killed / ${notLanded} found nothing to mutate`);
} catch (e) { failedHard = true; ok('the harness ran to the end', false, String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ')); } finally {
  fs.rmSync(tmpServer, { recursive: true, force: true });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length || failedHard ? `\nGUIDED-ADD-SCENES VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nGUIDED-ADD-SCENES VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
