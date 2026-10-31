// W5 - GAPS, COVERAGE REWARDS AND LIT (Fable's brief Oct 25: Downloads\w5-gaps-rewards-brief.md; Nick's rulings Oct 26: LIT IS APPROVED - an optional `lit: true` on the card's box, the writer can UNMARK it, marking never
// celebrates and never counts toward completion; FULL PAIR; export `celebrateReturnChip()` for FIX's W2). WRITTEN BEFORE THE BUILD: red on main c0b440d8. This file IS the contract the build is written to.
//
// THE CONTRACT (module -> exports):
//   store/deckRewards.ts (NEW)  GAPS_MAX (3) ; gapsOf(order, kindledIds, fromIndex) -> { names: [{ id, name }], more } | null  (NAMES, never a count; the Deck's order starting AFTER the current step, wrapping; null when
//                               every step is kindled; fromIndex -1 = Open: from the first) ; CELEBRATED_KEY ('wrizo-celebrated', the ONE device-local memory: card ids and deck ids) ; hasCelebrated(kind, id) /
//                               markCelebrated(kind, id) (kind 'card' | 'deck') ; kindleMoments({ prev, next, stepIds, celebratedCards, deckDone }) -> { cards, deck } (PURE: a card that turned kindled and was never
//                               celebrated; the deck only when a kindle was the last one missing and the deck never celebrated) ; celebrateReturnChip(el) -> boolean (exported for FIX's W2; one-time per element: idempotent)
//   store/guided.ts             isLit(box) ; withLit(boxes, id, on, now) -> boxes (sets `lit: true` and stamps updatedAt; OFF removes the key and stamps updatedAt: absent = not lit, the writer can unmark)
//   store/walk.ts               RailState gains 'lit' ; railMarks(order, current, kindledIds, startHereId, litIds?) - the current card is ALWAYS 'current'; a lit card is 'lit' (it never changes kindled / coverage)
//   types/index.ts              Box.lit?: boolean (additive inside the board's own boxes jsonb: NO column, NO migration, NO server change - it syncs with the whole blob)
//   components/DeckGaps.tsx (NEW)  .deck-gaps[data-flux] > .deck-gaps-lead + .deck-gap[data-gap-id] buttons (names only) + .deck-gaps-more ("..."); Flux adds the STACK line
//   lexicon                     gapsLead (Arbor "Nothing yet:", Flux "NO SIGNAL:") and deckStack (Flux "STACK")
//
//   PART 1 (browserless; this file)   G gaps, R rewards, M memory, L lit, X sync round trip (the REAL server handler + the REAL box merge), D dress (stylesheet), W wiring (source), Z guardrails, Q lexicon
//   PART 2 (guided-w5-part2.mjs, a box turn)   the live app: the line in the header, the kindle moment once, the completion once, Lit, reduced motion, the page never moves, Arbor + Flux dark + light
//   Every check has a mutant, its landing asserted.   Run: node scripts/harness/guided-w5.mjs   (from apps/desktop; no box needed - it never opens a browser)
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

// ---- the real modules (those that exist), bundled against a fake browser ----------------------------------------------------------------------------------------------------------------
let nonce = 0;
async function load(over = {}) {
  nonce += 1;
  const lines = [`export const __n = ${nonce};`, "export { deskTerm } from './store/deskLexicon';", "export { mergeBoxLists, liveBoxes } from './store/boxTombstones';", "export { kindled } from './store/guided';"];
  for (const [mod, from] of [['deckRewards', './store/deckRewards'], ['walk', './store/walk']]) if (has(`store/${mod}.ts`)) lines.push(`export * from '${from}';`);
  if (has('store/guided.ts')) lines.push("export { isLit, withLit } from './store/guided';");
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
const tmpServer = path.join(SERVER, '.w5-harness-scratch');
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
  write('wordCount.ts', stripTypes(fs.readFileSync(path.join(SERVER_SRC, 'wordCount.ts'), 'utf8')));   // sync.ts imports './wordCount' (polish #10 item 4, format-r7): it has to be in the scratch folder too
  const dest = write('sync.ts', stripTypes(fs.readFileSync(path.join(SERVER_SRC, 'sync.ts'), 'utf8')));
  return svRequire(dest);
}
function findHandler(router, p, method) { for (const l of router.stack) if (l.route && l.route.path === p && l.route.methods[method]) return l.route.stack[l.route.stack.length - 1].handle; throw new Error('route not found ' + p); }
async function callSync(router, body) {
  const req = { body, session: { userId: 'w5-harness-user' } };
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
const LATER = '2026-10-26T01:00:00.000Z';
const card = (id, text, extra = {}) => ({ id, kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text, ...extra });
const meta = (extra = {}) => ({ id: 'meta1', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, ...extra });
const entryOf = (boxes, extra = {}) => ({ id: 'e1', text: 'Three-Act', pageType: 'board', boxes, createdAt: NOW, updatedAt: NOW, ...extra });
// the Deck's steps, in order (a dealt step is `Title\n` - an empty body until the writer writes)
const NAMES = ['Hook', 'Midpoint Reversal', 'Darkest Point', 'Climax', 'Final Image'];
const steps = () => NAMES.map((n, i) => card(`s${i + 1}`, `${n}\n`, { seq: i + 1 }));
const ids = (order) => order.map((b) => b.id);
const set = (...a) => new Set(a);
const read = (rel) => readRaw(rel);
const css = () => read('index.css');
// the W5 zone of the stylesheet: everything the build adds sits between these two markers (the build writes them)
const w5css = (text) => { const a = text.indexOf('/* W5-BEGIN'); const b = text.indexOf('/* W5-END'); return a >= 0 && b > a ? text.slice(a, b) : ''; };

async function suite(M, rd) {
  const R = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); R[id] = { pass: !!pass, detail: detail || '' }; } catch (e) { R[id] = { pass: false, detail: 'threw: ' + String((e && e.message) || e).split('\n')[0].slice(0, 160) }; } };
  const order = steps();
  const names = (g) => (g ? g.names.map((n) => n.name) : null);

  // ---- G: the gaps line -------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('G1', () => { const g = M.gapsOf(order, set('s1'), 1); return [g && same(names(g), ['Darkest Point', 'Climax', 'Final Image']) && g.more === true && g.names.every((n) => typeof n.id === 'string' && /^s\d$/.test(n.id)), 'names, in the Deck\'s order, starting AFTER the current step (the current one - empty - comes last, hidden by the cap); ' + JSON.stringify(names(g))]; });
  chk('G2', () => { const g = M.gapsOf(order, set(), 0); return [g && g.names.length === 3 && g.more === true && M.GAPS_MAX === 3 && !('count' in g) && !('left' in g) && !('total' in g) && same(Object.keys(g).sort(), ['more', 'names']), 'at most three names then "..." (a flag, never "N left"): shape is exactly { names, more }']; });
  chk('G3', () => { const g = M.gapsOf(order, set('s1', 's2', 's3', 's4', 's5'), 2); const e = M.gapsOf([], set(), 0); return [g === null && e === null, 'every step kindled: the line simply disappears (null) - no verdict; an empty deck has no line either']; });
  chk('G4', () => { const g = M.gapsOf(order, set('s1', 's2', 's3'), -1); const h = M.gapsOf(order, set('s1'), -1); return [same(names(g), ['Climax', 'Final Image']) && g.more === false && same(names(h), ['Midpoint Reversal', 'Darkest Point', 'Climax']) && h.more === true, 'Open (no current step) reads from the first; "more" is true only when a fourth gap exists']; });
  chk('G5', () => { const g = M.gapsOf(order, set('s1', 's2', 's3'), 3); return [same(names(g), ['Final Image', 'Climax']) , 'it WRAPS: after the last step the line goes on from the first - the current (empty) step comes last; ' + JSON.stringify(names(g))]; });
  chk('G6', () => { const o = steps(); o[1] = { ...o[1], lit: true }; const g = M.gapsOf(o, set('s1'), 0); return [g && names(g)[0] === 'Midpoint Reversal', 'computed from kindled() ONLY: a hand-marked Lit step with no words is still a gap']; });
  chk('G7', () => { const g1 = M.gapsOf(order, set('s1'), 0); const g2 = M.gapsOf(order, set('s1'), 0); return [same(g1, g2), 'the same state gives the same line, every time (nothing variable)']; });
  chk('G8', () => { const o = [card('a', '\n'), card('b', 'Beat\n')]; const g = M.gapsOf(o, set(), -1); return [g && g.names.length === 2 && g.names.every((n) => n.name.length > 0 && !/\d/.test(n.name)), 'a step with no title still has a NAME (never blank, never a number): ' + JSON.stringify(names(g))]; });
  chk('G9', () => { const long = 'A very long step title that would run the whole header line off the end of the screen'; const g = M.gapsOf([card('a', `${long}\n`)], set(), -1); return [g && g.names[0].name.length <= 40, 'a long title is shortened for the line']; });

  // ---- R: the reward moments (the pure decision) ------------------------------------------------------------------------------------------------------------------------------
  const km = (o) => M.kindleMoments({ prev: null, next: set(), stepIds: ids(order), celebratedCards: set(), deckDone: false, ...o });
  chk('R1', () => { const a = km({ prev: set('s1'), next: set('s1', 's2') }); const b = km({ prev: null, next: set('s1', 's2') }); return [same(a.cards, ['s2']) && a.deck === false && b.cards.length === 0 && b.deck === false, 'a step that turns kindled fires its moment; the FIRST frame (prev null: mount) is a baseline and fires nothing']; });
  chk('R2', () => { const a = km({ prev: set('s1'), next: set('s1', 's2'), celebratedCards: set('s2') }); return [a.cards.length === 0, 'a re-kindle after deleting and retyping fires no second moment (already celebrated on this device)']; });
  chk('R3', () => { const x = km({ prev: set('s1'), next: set('s1', 's2') }); const y = km({ prev: set('s1'), next: set('s1', 's2') }); return [same(x, y), 'identical frames twice: the same input gives the same answer']; });
  chk('R4', () => { const a = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4', 's5') }); const done = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4', 's5'), deckDone: true }); return [a.deck === true && same(a.cards, ['s5']) && done.deck === false && same(done.cards, ['s5']), 'the Deck completes ONCE: on the last kindle, and never again once it has']; });
  chk('R5', () => { const a = km({ prev: set('s1', 's2', 's3', 's4', 's5'), next: set('s1', 's2', 's3', 's4', 's5') }); const b = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4') }); return [a.cards.length === 0 && a.deck === false && b.cards.length === 0 && b.deck === false && !/\blit\b/i.test(rd('store/deckRewards.ts').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')), 'a Lit mark changes no kindled set, so it fires nothing - and the decision never reads Lit at all']; });
  chk('R6', () => { const a = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4') }); const del = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4'), stepIds: ['s1', 's2', 's3', 's4'] }); return [a.deck === false && del.deck === false && del.cards.length === 0, 'deleting the only empty step completes nothing: a reward is for words or pages, never for a click']; });
  chk('R7', () => { const a = km({ prev: set('s1'), next: set('s1', 's2') }); const c = km({ prev: set('s1', 's2'), next: set('s1') }); return [c.cards.length === 0 && c.deck === false && a.cards.length === 1, 'a card that loses its words fires nothing']; });
  chk('R8', () => { const a = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4', 's5'), celebratedCards: set('s5') }); return [a.deck === true && a.cards.length === 0, 'the last kindle completes the Deck even when that card had celebrated before (the Deck has not): one moment, the deck\'s']; });
  chk('R10', () => { const c = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4', 's5'), stepIds: ['s1', 's2', 's3', 's3a', 's4', 's5'], mainIds: ['s1', 's2', 's3', 's4', 's5'] }); const d = km({ prev: set('s1', 's2', 's3', 's4'), next: set('s1', 's2', 's3', 's4', 's5'), stepIds: ['s1', 's2', 's3', 's3a', 's4', 's5'], mainIds: ['s1', 's2', 's3', 's4', 's5', 's6'] }); return [c.deck === true && d.deck === false, 'a Deck completes when every MAIN step is kindled: a sub-step (a child under a step) never blocks it, and a missing main step does']; });
  chk('R9', () => { const a = km({ prev: set(), next: set(), stepIds: [] }); const b = km({ prev: set(), next: set('s1'), stepIds: ['s1'] }); return [a.deck === false && b.deck === true && same(b.cards, ['s1']), 'an empty deck never completes; a one-step deck completes on its one kindle']; });

  // ---- M: the one device-local memory -----------------------------------------------------------------------------------------------------------------------------------------
  chk('M1', () => { const ls = globalThis.localStorage; ls.clear(); const had = M.hasCelebrated('card', 'x'); M.markCelebrated('card', 'x'); M.markCelebrated('deck', 'd1'); M.markCelebrated('card', 'x'); const keys = [...ls.__map.keys()]; const raw = JSON.parse(ls.getItem(M.CELEBRATED_KEY)); return [M.CELEBRATED_KEY === 'wrizo-celebrated' && !had && M.hasCelebrated('card', 'x') && M.hasCelebrated('deck', 'd1') && !M.hasCelebrated('deck', 'x') && same(keys, ['wrizo-celebrated']) && raw.cards.filter((c) => c === 'x').length === 1, 'ids only, one key, no duplicates; a card id and a deck id do not collide: ' + keys.join(',')]; });
  chk('M2', () => { const ls = globalThis.localStorage; const real = ls.setItem; ls.clear(); ls.setItem = () => { throw new Error('blocked'); }; let threw = false; try { M.markCelebrated('card', 'z'); M.hasCelebrated('card', 'z'); } catch { threw = true; } ls.setItem = real; return [!threw, 'storage blocked: this device simply does not remember (no throw)']; });
  chk('M3', () => { const ls = globalThis.localStorage; ls.clear(); ls.setItem('wrizo-celebrated', '{not json'); let r; try { r = M.hasCelebrated('card', 'x'); M.markCelebrated('card', 'x'); } catch { r = 'threw'; } return [r === false && M.hasCelebrated('card', 'x'), 'a corrupt memory reads as empty and is rewritten']; });
  chk('M4', () => { const src = rd('store/deckRewards.ts'); const keys = [...src.matchAll(/(?:getItem|setItem)\(\s*([A-Za-z_'"-][\w'"-]*)/g)].map((m) => m[1]); return [keys.length > 0 && keys.every((k) => k === 'CELEBRATED_KEY'), 'the memory file touches storage through its one named key only: ' + keys.join(',')]; });
  chk('M5', () => { const el = { attrs: {}, classList: { add() {}, remove() {} }, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] ?? null; }, hasAttribute(k) { return k in this.attrs; } }; const a = M.celebrateReturnChip(el); const b = M.celebrateReturnChip(el); const c = M.celebrateReturnChip(null); return [typeof M.celebrateReturnChip === 'function' && a === true && b === false && c === false, 'celebrateReturnChip is exported; the first call glows, the second does nothing (idempotent); null is safe']; });

  // ---- L: Lit -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('L1', () => { const base = steps(); const on = M.withLit(base, 's2', true, NOW); const t = on.find((b) => b.id === 's2'); const other = on.filter((b) => b.id !== 's2'); return [t.lit === true && t.updatedAt === NOW && other.every((b, i) => b === base.filter((x) => x.id !== 's2')[i]) && base.find((b) => b.id === 's2').lit === undefined && M.isLit(t) && !M.isLit(base[0]), 'marking sets lit:true and stamps updatedAt on that card only; the input is not mutated']; });
  chk('L2', () => { const on = M.withLit(steps(), 's2', true, NOW); const off = M.withLit(on, 's2', false, LATER); const t = off.find((b) => b.id === 's2'); return [!('lit' in t) && t.updatedAt === LATER && !M.isLit(t), 'THE WRITER CAN UNMARK IT: off removes the key (absent = not lit) and stamps updatedAt so the unmark wins a merge']; });
  chk('L3', () => { const a = card('s1', 'Hook\n', { lit: true }); const b = card('s1', 'Hook\nwords', { lit: true }); const boards = [a]; return [M.kindled('e1', a, boards) === false && M.kindled('e1', b, [b]) === true, 'Lit never counts toward coverage: kindled() ignores it (an empty lit card is not kindled; words still kindle it)']; });
  chk('L4', () => { const o = steps(); const m = M.railMarks(o, 1, set('s1', 's3'), null, set('s3', 's4', 's2')); const st = m.map((x) => x.state); return [same(st, ['leaf', 'current', 'lit', 'lit', 'seed']) && m[1].current === true && m.filter((x) => x.current).length === 1, 'the rail: lit marks are their own state, the current card is ALWAYS current; ' + st.join(',')]; });
  chk('L5', () => { const o = steps(); const without = M.railMarks(o, 0, set('s2'), 's1'); const withEmpty = M.railMarks(o, 0, set('s2'), 's1', set()); return [same(without, withEmpty) && without[0].startHere === true && without[1].state === 'leaf', 'the old four-argument call and an empty Lit set are the same rail (W1 unchanged)']; });
  chk('L6', () => { const lit = M.withLit(steps(), 's2', true, LATER); const stale = steps().map((b) => (b.id === 's2' ? { ...b, updatedAt: NOW } : b)); const merged = M.mergeBoxLists(stale, lit); const merged2 = M.mergeBoxLists(lit, stale); const off = M.withLit(lit, 's2', false, '2026-10-26T02:00:00.000Z'); const m3 = M.mergeBoxLists(lit, off); return [merged.find((b) => b.id === 's2').lit === true && merged2.find((b) => b.id === 's2').lit === true && !('lit' in m3.find((b) => b.id === 's2')), 'the REAL box merge: a newer mark beats an older copy from either side, and a newer UNMARK beats an older mark']; });
  chk('L7', () => { const types = rd('types/index.ts'); return [/\blit\?: boolean;/.test(types), 'Box declares `lit?: boolean` (additive; the systemKind / seq / onCanvas precedent)']; });
  chk('L8', () => { const migs = fs.existsSync(path.join(SERVER, 'src')) ? fs.readdirSync(SERVER_SRC, { recursive: true }).map(String).filter((f) => /\.(sql|ts)$/.test(f) && /migrat|schema/i.test(f)) : []; const hits = migs.filter((f) => /\blit\b/i.test(fs.readFileSync(path.join(SERVER_SRC, f), 'utf8').replace(/\/\/.*$/gm, ''))); return [hits.length === 0, `no column, no migration, no server change for lit (${migs.length} schema files scanned)`]; });

  // ---- D: dress (the stylesheet's W5 zone) --------------------------------------------------------------------------------------------------------------------------------------
  const z = w5css(rd('index.css'));
  chk('D1', () => [z.length > 800, 'the W5 zone exists in the stylesheet (markers W5-BEGIN / W5-END)']);
  chk('D2', () => { const blur = [...z.matchAll(/box-shadow:\s*([^;}]+)/g)].map((m) => m[1].trim()).filter((v) => v !== 'none'); const rad = [...z.matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1].trim()); return [z.length > 0 && blur.length === 0 && rad.every((r) => r === '0' || r === '50%'), `no shadows, square edges (circles only for marks): ${blur.join(' | ') || 'none'}; radii ${[...new Set(rad)].join(',') || 'none'}`]; });
  chk('D3', () => [/#8f7a4c/i.test(z) && /\.kindle-root/.test(z), 'Arbor: the card\'s root line is bronze #8f7a4c (a hint, never a drawn plant)']);
  chk('D4', () => { const root = [...z.matchAll(/[^{}]*\.kindle-root[^{}]*\{[^}]*\}/g)].map((m) => m[0]).join(' '); return [root.length > 0 && !/var\(--brass\)|#ff9800/i.test(root) && /#8f7a4c/i.test(root), 'the root line is never brass (brass = the pulse ring, the completion flash and Lit only)']; });
  chk('D5', () => { const pulse = /\[data-fx='kindle'\][^{}]*::after[^{}]*\{[^}]*(var\(--brass\)|#ff9800)/i.test(z) && /@keyframes\s+w5-pulse/.test(z); return [pulse, 'Arbor: ONE brass pulse ring on the rail mark (the keyframes w5-pulse)']; });
  chk('D6', () => { const f = z.split(/\n/).filter((l) => /data-theme='flux'/.test(l)).join('\n'); return [/var\(--signal-live\)|#a6ff3d/i.test(f) && /var\(--choice\)|var\(--cyan\)|#57d0f5/i.test(f), 'Flux: lime then cyan (the edge lights lime, rests cyan; the tick goes hollow -> lime)']; });
  chk('D7', () => { const orange = z.split(/\n/).filter((l) => /orange/.test(l) && /\{/.test(l)); return [orange.every((l) => /aria-current|\[data-current='true'\]|\[data-lit='true'\]/.test(l)), 'Flux: the orange bar only ever rides the current / Lit rule: ' + orange.length + ' orange lines']; });
  chk('D8', () => { const durs = [...z.matchAll(/animation:\s*[\w-]+\s+(\d+)ms/g)].map((m) => +m[1]); const secs = [...z.matchAll(/animation:\s*[\w-]+\s+([\d.]+)s/g)].map((m) => Math.round(parseFloat(m[1]) * 1000)); const all = [...durs, ...secs]; return [all.length >= 2 && all.every((d) => d <= 1100) && !/infinite/.test(z) && !/animation-iteration-count:\s*([2-9]|infinite)/.test(z), 'every moment is at most 1.1 s, none repeats or loops (so nothing flashes above 3/s): ' + all.join(',') + ' ms']; });
  chk('D9', () => { const rm = /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^@]*\}/.exec(z.replace(/\n/g, ' ')); const body = rm ? rm[0] : ''; return [/kindle/.test(body) && /animation:\s*none/.test(body), 'reduced motion = the still end state: the animations are off, the root line / leaf / lime-cyan edge stay']; });
  chk('D10', () => [/\.deck-gaps/.test(z) && /\.deck-gap\b/.test(z) && /white-space:\s*nowrap/.test(z) && /text-overflow:\s*ellipsis/.test(z) && /--olive|--accent-door/.test(z), 'the gaps line is one line that never wraps (the page below it never moves) and its names carry the olive door colour']);
  chk('D11', () => [/\[data-lit='true'\][^{}]*\{[^}]*(var\(--brass\)|#ff9800)/i.test(z), 'Arbor Lit: the leaf on the rail and the card mark are brass (a human act)']);

  // ---- W: wiring (source) -----------------------------------------------------------------------------------------------------------------------------------------------------
  const be = rd('components/BoardEditor.tsx'), wk = rd('components/Walk.tsx'), dr = rd('store/deckRewards.ts');
  chk('W1', () => [/useDeckRewards\(/.test(be) && /useDeckRewards\([^)]*deckBoard/.test(be.replace(/\n/g, ' ')), 'the rewards run ONLY on a Deck: the hook is gated by deckBoard (a writer who never opens a Deck sees nothing new)']);
  chk('W2', () => { const door = /key:\s*'lit'/.test(wk) && wk.indexOf("key: 'lit'") > wk.indexOf('p.extraDoors'); return [door && /onToggleLit/.test(wk), 'the Lit door is LAST in the Walk\'s row (after W2\'s extraDoors) and is the same door for mark and unmark']; });
  chk('W3', () => [/withLit\(/.test(be) && /openCardMenu/.test(be) && /ctxLit|litMark|walkLit/.test(be.slice(be.indexOf('const openCardMenu'), be.indexOf('const openBoardMenu'))), 'the card\'s menu offers Mark lit / Unmark through the same withLit']);
  chk('W4', () => [/<DeckGaps/.test(be) && /onJump=\{jumpToGap\}/.test(be) && /gapsOf\(/.test(rd('components/DeckGaps.tsx')) && /const jumpToGap[\s\S]{0,260}setWalkJumpId\(boxId\)[\s\S]{0,400}scrollIntoView/.test(be), 'the line sits in the Deck\'s header and a pressed name jumps the Walk (Open: scrolls to the card and focuses it)']);
  chk('W5', () => { const all = [be, wk, dr, rd('components/DeckGaps.tsx'), rd('components/useDeckRewards.ts')].join('\n'); return [!/celebrateReturnChip\(/.test(all.replace(dr, '')), 'celebrateReturnChip is exported and NOT wired here (FIX calls it from W2)']; });
  chk('W6', () => { const hook = rd('components/useDeckRewards.ts'); return [hook.length > 0 && /CELEBRATE_MS/.test(hook) && /effectiveAmbianceDial|prefersReducedMotion/.test(hook) && /markCelebrated\(/.test(hook) && /kindleMoments\(/.test(hook), 'the hook reads the moment from the pure decision, times it by the celebration grammar\'s own CELEBRATE_MS, and honours reduced motion / Ambiance 0 (the still end state)']; });
  chk('W7', () => { const wi = rd('components/WritingIncentives.tsx'); const used = /GoalCelebration/.test(wi) && /GoalCelebration/.test(be + rd('components/DeckGaps.tsx') + rd('components/useDeckRewards.ts')); const sparks = (wi.match(/SPARK_ANGLES\.map/g) || []).length; return [used && sparks === 1, 'the Deck\'s completion REUSES the existing goal celebration (one shared spark burst, not a fork): ' + sparks + ' SPARK_ANGLES.map']; });
  chk('W9', () => [/deckMain = deckSteps\.filter\(b => !b\.parentId\)/.test(be) && /<DeckGaps order=\{deckMain\}/.test(be) && /useDeckRewards\(.*deckMain\.map/.test(be), 'the gaps line names MAIN steps only and completion reads main steps (a sub-step under a step is walked and begun, never named, never blocking)']);
  chk('W8', () => [/litIds=/.test(be) && /kindlingIds=/.test(be) && /data-lit=/.test(wk) && /data-fx=/.test(wk), 'the Walk is told which cards are lit and which are kindling now']);

  // ---- Z: guardrails ----------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('Z1', () => { const src = [dr, rd('components/useDeckRewards.ts'), rd('components/DeckGaps.tsx')].join('\n').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''); return [src.length > 0 && !/toast|setInterval|Notification|alert\(/i.test(src), 'nothing speaks first: no toast, no timer loop, no notification, no idle nudge']; });
  chk('Z2', () => { const src = [dr, rd('components/useDeckRewards.ts'), rd('components/DeckGaps.tsx')].join('\n').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''); return [src.length > 0 && !/streak|score|percent|\bleft\b|remaining/i.test(src), 'no streaks, no scores, no percentages, no "N left": the words are not in the code']; });
  chk('Z4', () => { const hits = ['store/deckRewards.ts', 'components/useDeckRewards.ts', 'components/DeckGaps.tsx'].map(rd).join('\n').match(/hasWriterText|bodyIsEmpty|splitCard\(.*body/g) || []; return [hits.length === 0, 'the new files never re-derive coverage from the text: kindled() is the only gate']; });

  // ---- Q: lexicon -------------------------------------------------------------------------------------------------------------------------------------------------------------
  chk('Q1', () => { const T = (id, th) => M.deskTerm(id, th); const a = T('gapsLead', 'plateau'), f = T('gapsLead', 'flux'); return [/^Nothing yet:?$/.test(a) && /^NO SIGNAL:?$/.test(f) && T('deckStack', 'flux') === 'STACK' && !/\d/.test(a + f), 'Arbor "Nothing yet:", Flux "NO SIGNAL:" + "STACK" - words, no digit']; });
  chk('Q2', () => { const f = M.deskTerm('gapsLead', 'flux'); const m = M.deskTerm('gapsLead', 'machina'); return [typeof m === 'string' && m.length > 0 && !/Nothing yet/i.test(f), 'Flux says its own word; every other theme falls back to a plain, quiet one']; });
  return R;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- mutants: each one breaks a ruling; the named checks must go red ------------------------------------------------------------------------------------------------------------------------------
const MUT = [
  { name: 'four names instead of three', file: 'store/deckRewards.ts', find: /GAPS_MAX\s*=\s*3/, to: 'GAPS_MAX = 4', red: ['G2'] },
  { name: 'the line starts at the first step, not after the current', file: 'store/deckRewards.ts', find: /\(fromIndex \+ 1 \+ i\)|\(fromIndex \+ 1 \+ k\)|fromIndex \+ 1/, to: '0', red: ['G1'] },
  { name: 'the line shows when everything is kindled', file: 'store/deckRewards.ts', find: /if \(gaps\.length === 0\) return null;/, to: 'if (false) return null;', red: ['G3'] },
  { name: 'a sub-step blocks completion', file: 'store/deckRewards.ts', find: /const main = a\.mainIds \?\? stepIds;/, to: 'const main = stepIds;', red: ['R10'] },
  { name: 'a re-kindle fires again', file: 'store/deckRewards.ts', find: /!celebratedCards\.has\(id\)/, to: 'true', red: ['R2'] },
  { name: 'the Deck completes more than once', file: 'store/deckRewards.ts', find: /!deckDone/, to: 'true', red: ['R4'] },
  { name: 'a baseline frame fires', file: 'store/deckRewards.ts', find: /if \(!prev\) return \{ cards: \[\], deck: false \};/, to: 'if (!prev) return { cards: stepIds.filter((id) => next.has(id)), deck: false };', red: ['R1'] },
  { name: 'completion needs no kindle', file: 'store/deckRewards.ts', find: /newly\.length > 0 &&/, to: '', red: ['R6'] },
  { name: 'the memory key changes', file: 'store/deckRewards.ts', find: /CELEBRATED_KEY\s*=\s*'wrizo-celebrated'/, to: "CELEBRATED_KEY = 'wrizo-celebrated-v2'", red: ['M1'] },
  { name: 'celebrateReturnChip fires every time', file: 'store/deckRewards.ts', find: /if \(el\.hasAttribute\('data-celebrated'\)\) return false;/, to: '', red: ['M5'] },
  { name: 'Lit does not stamp updatedAt', file: 'store/guided.ts', find: /updatedAt: now/, to: 'updatedAt: undefined', red: ['L1', 'L6'] },
  { name: 'unmarking leaves lit: false behind', file: 'store/guided.ts', find: /const \{ lit: _l, \.\.\.rest \} = b;/, to: 'const rest = { ...b, lit: false };', red: ['L2'] },
  { name: 'the rail ignores Lit', file: 'store/walk.ts', find: /litIds\?\.has\(b\.id\)/, to: 'false', red: ['L4'] },
  { name: 'kindled() counts Lit', file: 'store/guided.ts', find: /if \(hasWriterText\(box\)\) return true;/, to: "if (hasWriterText(box) || (box as { lit?: boolean }).lit) return true;", red: ['L3'] },
  { name: 'Flux says the Arbor words', file: 'store/deskLexicon.ts', find: /gapsLead: 'NO SIGNAL:'/, to: "gapsLead: 'Nothing yet:'", red: ['Q1', 'Q2'] },
];

// ---- run ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
let failedHard = false;
try {
  // the X check needs the server, once (not per mutant)
  const base = await tryLoad({});
  if (base.err) ok('the real modules bundle against a fake browser', false, base.err);
  const rd = (over) => (rel) => { const t = readRaw(rel); return over[rel] && t ? over[rel](t) : t; };
  const M0 = base.M || {};
  const res0 = await suite(M0, rd({}));
  for (const [k, v] of Object.entries(res0)) ok(k, v.pass, v.detail);

  // X: the sync round trip of the new field, through the REAL server handler: lit survives push -> pull and the box merge
  {
    const lit = (typeof M0.withLit === 'function' ? M0.withLit(steps(), 's2', true, NOW) : steps().map((b) => (b.id === 's2' ? { ...b, lit: true, updatedAt: NOW } : b)));
    const entry = entryOf([...lit, meta({ homeView: 'walk' })]);
    let rt; try { rt = await roundTrip(entry); } catch (e) { rt = { err: String(e.message || e).slice(0, 160) }; }
    const pulled = rt.pulled && (Array.isArray(rt.pulled.boxes) ? rt.pulled.boxes : []);
    const s2 = pulled && pulled.find((b) => b.id === 's2');
    ok('X1 lit survives push -> pull through the real /sync handler (whole-blob: no column, no server change)', !!s2 && s2.lit === true && rt.pushStatus === 200 && !rt.err, rt.err || JSON.stringify({ push: rt.pushStatus, rejected: rt.rejected, got: s2 && s2.lit }));
    ok('X2 an unmarked card pulls back without the key', (() => { const un = typeof M0.withLit === 'function' ? M0.withLit(lit, 's2', false, LATER) : lit; const t = un.find((b) => b.id === 's2'); return t && !('lit' in t); })(), 'absent = not lit, on the wire too');
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
console.log(failed.length || failedHard ? `\nGUIDED-W5 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nGUIDED-W5 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
