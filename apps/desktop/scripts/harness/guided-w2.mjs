// W2 - "WRITE THIS" / "PLACE A PAGE..." / "PLACE THIS..." (Fable's brief Oct 23: Downloads/w2-write-place-brief.md; handoff Oct 26, deploy #9). WRITTEN BEFORE THE BUILD (red on main c0b440d8).
//
// THE CONTRACT (what the build provides; every name below is exercised):
//   store/unbornPage.ts   UnbornDescriptor.graft = { boardId, boxId } | null, riding the ADDRESS (`gb` / `gc`) like `pin` and `deck` - reload-safe, no storage ; unbornHref / readDescriptor carry it ;
//                         birth() writes the page AND the graft in the one synchronous act (a page_links record owned by the board, aBoxId = the card) ; a graft whose card is gone is simply not made (no half graft).
//   store/writePlace.ts   (stepLabel(deck, card) -> "Three-Act · Midpoint" lives in grafts.ts, which names a Deck's step on a page's list) ; planWriteThis({ boardId, boardTitle, setId, origin }, card) -> { href, state } (PURE: writes nothing) ;
//                         searchSteps(query, pageId) -> the Decks' steps from every place, labelled, checked when already placed ; placeThis(pageId, row) -> graftTo(page, card)
//   store/grafts.ts       searchGraftables(query, subject, boxes, only?) - only === 'pages' lists Pages and nothing else ; a Cards row from a DECK reads "Deck · Step" on a page's Grafts list
//   lexicon               walkWrite / walkPlace / graftPlaceThis: Arbor "Write this" / "Place a page…" / "Place this…" ; Flux "[BOOT DOC]" / "[INPUT DOC]" / "PORT TO…" ; Machina "Draft File" / "Attach File…"
//   components            Walk's extraDoors carry the two doors (passing the card) ; the page's return chip names the Deck and carries the W5 hook ; the picker has 'pages' and 'steps' modes
//
// PART 1 (this file, browserless): M the model on the REAL stores (seeded through the app's own save* seams), S the source wiring, L the lexicon, X the seed-guard stays clean. Every check has a mutant, its landing asserted.
// PART 2 (guided-w2-part2.mjs, a box turn): the live app.   Run: node scripts/harness/guided-w2.mjs   (from apps/desktop; browserless, needs no box turn)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const has = (rel) => fs.existsSync(path.join(SRC, rel));
const readRaw = (rel) => (has(rel) ? noCR(fs.readFileSync(path.join(SRC, rel), 'utf8')) : '');
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

// ---- the real modules, bundled against a fake browser; `keep` carries localStorage across a "reload" ------------------------------------------------------------------------------------------------
let nonce = 0;
async function load(over = {}, keep = null) {
  nonce += 1;
  const lines = [`export const __n = ${nonce};`];
  for (const [mod, from] of [['deskLexicon', './store/deskLexicon'], ['persistence', './store/persistence'], ['grafts', './store/grafts'], ['unbornPage', './store/unbornPage'], ['boardKind', './store/boardKind'], ['walk', './store/walk'], ['guided', './store/guided'], ['place', './store/place'], ['writePlace', './store/writePlace']]) {
    if (has(`store/${mod}.ts`)) lines.push(`export * from '${from}';`);
  }
  const res = await build({
    stdin: { contents: lines.join('\n'), resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [path.join(DESKTOP, 'node_modules')], external: ['@fontsource/*', '@fontsource-variable/*'],
    plugins: [{ name: 'ov', setup(b) { b.onLoad({ filter: /\.ts$/ }, (args) => {
      const rel = path.relative(SRC, args.path).split('\\').join('/');
      const text = noCR(fs.readFileSync(args.path, 'utf8'));
      return { contents: over[rel] ? over[rel](text) : text, loader: 'ts' };
    }); } }],
  });
  const map = keep ?? new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }), innerWidth: 1400, setTimeout, clearTimeout };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear(), __map: map };
  const M = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  return { M, map };
}

// ---- the fixture: two Drawers, a Deck in each, pages, all through the app's own save seams -------------------------------------------------------------------------------------------------------------
const NOW = '2026-10-26T12:00:00.000Z';
function seed(M) {
  const d1 = M.createDrawer('Novel'); const d2 = M.createDrawer('Essays');
  const s1 = M.createProject('Novel set', 'creative'); M.setProjectDrawer(s1.id, d1.id);
  const s2 = M.createProject('Essays set', 'creative'); M.setProjectDrawer(s2.id, d2.id);
  const card = (id, text, step, seq) => ({ id, kind: 'text', x: 0, y: 0, w: 200, h: 100, z: seq, seq, text, ...(step ? { deckStep: { deck: 'three-act', step } } : {}) });
  let n = 0; const gid = () => `meta${++n}`;
  const mk = (id, title, setId, cards, deck) => {
    const boxes = deck ? M.withHomeView(cards, 'walk', gid) : cards;
    M.saveJournalEntry({ id, text: title, pageType: 'board', boxes, projectId: setId, source: 'page', createdAt: NOW, updatedAt: NOW });
  };
  mk('deck1', 'Three-Act', s1.id, [card('c1', 'Setup\n', 'setup', 1), card('c2', 'Midpoint\n', 'midpoint', 2)], true);
  mk('deck2', 'Argument', s2.id, [card('e1', 'Claim\n', 'claim', 1)], true);
  mk('plain1', 'A wall', s1.id, [card('p1', 'a loose idea\nwords', null, 1)], false);
  const page = (id, text, setId) => M.saveJournalEntry({ id, text, projectId: setId, source: 'page', createdAt: NOW, updatedAt: NOW });
  page('pg1', 'The rope\nfirst words', s1.id); page('pg2', 'The map\nwords', s1.id); page('pg3', 'An essay page\nwords', s2.id);
  M.flushNow();
  return { d1, d2, s1, s2 };
}
const tally = (M) => ({ entries: M.getJournalEntries().length, links: M.getJournalEntries().reduce((c, e) => c + (e.pageLinks ?? []).length, 0) });
const pagesOnly = (rows) => rows.Pages.length > 0 && rows.Cards.length === 0 && rows.Boards.length === 0;
const unbornFrom = (M, href, id) => { const q = href.includes('?') ? '?' + href.split('?')[1] : ''; const d = M.readDescriptor(q); M.setUnbornEntry(M.unbornEntry(id, d, NOW)); return d; };

// ---- the model scenario: returns { id: [pass, detail] } -------------------------------------------------------------------------------------------------------------------------------------------------
async function model(over = {}) {
  const out = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); out[id] = [!!pass, detail]; } catch (e) { out[id] = [false, 'threw: ' + String((e && e.message) || e).slice(0, 140)]; } };
  const { M, map } = await load(over);
  const fx = seed(M);
  const card2 = M.getJournalEntry('deck1').boxes.find((b) => b.id === 'c2');
  const board = { boardId: 'deck1', boardTitle: 'Three-Act', setId: fx.s1.id, origin: undefined };
  const linkCount = () => M.getJournalEntries().reduce((n, e) => n + (e.pageLinks ?? []).filter((l) => !l.deletedAt).length, 0);
  const count0 = M.getJournalEntries().length, links0 = linkCount();

  // W - Write this: the door is a plan, and a plan writes nothing
  let plan = null;
  chk('W1', () => { plan = M.planWriteThis(board, card2); return [!!plan && typeof plan.href === 'string' && /^\/page\/new\?/.test(plan.href) && M.getJournalEntries().length === count0 && linkCount() === links0, 'pressing the door yields an unborn address and writes no row, no link']; });
  chk('W2', () => { const d = M.readDescriptor('?' + plan.href.split('?')[1]); return [d.graft && d.graft.boardId === 'deck1' && d.graft.boxId === 'c2' && d.binderId === fx.s1.id, `the address carries the card (${JSON.stringify(d.graft)}) and the Deck's set`]; });
  chk('W3', () => [plan.state.fromBoardId === 'deck1' && plan.state.fromBoardTitle === 'Three-Act' && plan.state.fromCardId === 'c2' && plan.state.fromStepLabel === 'Three-Act · Midpoint' && M.stepLabel('Three-Act', 'Midpoint') === 'Three-Act · Midpoint', 'the chip state names the Deck and the step']);
  chk('W4', () => { const a = M.unbornHref({ binderId: 'x' }), b = M.unbornHref({ binderId: 'x', graft: { boardId: 'b1', boxId: 'k1' } }); return [!/gb=|gc=/.test(a) && /gb=b1/.test(b) && /gc=k1/.test(b) && M.readDescriptor('').graft === null, 'the graft rides the address only when asked, and degrades to none']; });

  // B - born on the first keystroke: the page, its set, its graft, in one act
  let pid = 'born1';
  chk('B1', () => { const d = unbornFrom(M, plan.href, pid); const before = M.getJournalEntries().length; const row = M.birth(pid, d, { text: 'The first word' }); return [!!row && M.getJournalEntries().length === before + 1 && M.getJournalEntry(pid).text === 'The first word', 'the first keystroke births the page (one row more)']; });
  chk('B2', () => [M.getJournalEntry(pid).projectId === fx.s1.id && M.placeOfEntry(M.getJournalEntry(pid)).id === fx.d1.id, "the page is in the Deck's set, in the Deck's Drawer"]);
  chk('B3', () => [M.isGrafted({ entryId: 'deck1', boxId: 'c2' }, { entryId: pid }), 'the born page is grafted to the card (a page_links record the board owns)']);
  chk('B4', () => { const g = M.graftsOf({ entryId: pid }); const row = [...g.Cards, ...g.Pages].find((r) => r.entryId === 'deck1'); return [!!row && row.title === 'Three-Act · Midpoint', `the page's Grafts row reads "${row && row.title}"`]; });
  chk('B5', () => [M.kindled('deck1', { id: 'c2', text: 'Midpoint\n' }) === true, 'the card kindles (W3: a graft to a page is kindled)']);
  chk('B6', () => { const l = M.getJournalEntry('deck1').pageLinks.filter((x) => !x.deletedAt); return [l.length === 1 && l[0].aBoxId === 'c2' && l[0].bEntryId === pid && !l[0].bBoxId, 'exactly one link, card -> page, no pin and no second record']; });
  chk('B7', () => { const e = M.getJournalEntry('deck1'); return [!e.boxes.some((b) => b.kind === 'page-pin' || b.kind === 'connection'), 'born from the door it is NOT pinned onto the wall (the graft is the only relation)']; });
  chk('B8', () => [map.get('wrizo-mode-page-' + pid) === 'journal', 'the page opens for writing in Free Write (the device remembers it past a reload)']);

  // R - reload / crash: the page and the graft are one act
  M.flushNow();
  const re = await load(over, map);
  chk('R2', () => [!!re.M.getJournalEntry(pid) && re.M.isGrafted({ entryId: 'deck1', boxId: 'c2' }, { entryId: pid }), 'after a reload the page and its graft are both there']);
  const un = await load(over); const fx2 = seed(un.M);
  const base2 = tally(un.M);
  chk('R3', () => { un.M.planWriteThis({ ...board, setId: fx2.s1.id }, card2); un.M.flushNow(); const now = tally(un.M); return [now.entries === base2.entries && now.links === base2.links, 'a door pressed and never typed in leaves nothing behind (no page, no link)']; });
  chk('R4', () => { const w = un.M.planWriteThis({ boardId: 'deck1', boardTitle: 'Three-Act', setId: fx2.s1.id }, { id: 'gone', text: 'x' }); const d = unbornFrom(un.M, w.href, 'born2'); un.M.birth('born2', d, { text: 'words' }); const e = un.M.getJournalEntry('deck1'); return [!!un.M.getJournalEntry('born2') && !(e.pageLinks ?? []).length, 'a card that is gone: the page is born, no half graft is made']; });

  // P - Place a page: the picker filtered to pages
  const subj = { entryId: 'deck1', boxId: 'c1' };
  chk('P1', () => { const all = M.searchGraftables('', subj); const p = M.searchGraftables('', subj, undefined, 'pages'); return [all.Cards.length > 0 && pagesOnly(p), 'with the filter the picker lists Pages and no Cards or Boards (without it, it lists all)']; });
  chk('P2', () => { const p = M.searchGraftables('rope', subj, undefined, 'pages'); return [p.Pages.length === 1 && p.Pages[0].title === 'The rope', 'the search still filters inside the Pages list']; });
  chk('P3', () => [!M.isGrafted(subj, { entryId: 'pg2' }) && M.graftsOf(subj).Pages.length === 0 && M.kindled('deck1', { id: 'c1', text: 'Setup\n' }) === false, 'looking at the picker grafts nothing (the card is still unkindled)']);
  chk('P4', () => { const made = M.graftTo(subj, { entryId: 'pg2' }); return [made && made.made === 'link' && M.isGrafted(subj, { entryId: 'pg2' }), 'a press grafts the page to the card']; });
  chk('P5', () => [M.graftsOf(subj).Pages.some((r) => r.entryId === 'pg2'), 'the card shows the placed page in its Grafts']);
  chk('P6', () => [M.kindled('deck1', { id: 'c1', text: 'Setup\n' }) === true, 'the card kindles once a page is placed']);
  chk('P7', () => { const again = M.graftTo(subj, { entryId: 'pg2' }); return [again === null, 'placing the same page twice makes nothing (a checked row is inert)']; });

  // T - Place this: the page side
  chk('T1', () => { const rows = M.searchSteps('', 'pg1'); const decks = new Set(rows.map((r) => r.entryId)); return [decks.has('deck1') && decks.has('deck2') && !decks.has('plain1') && rows.length === 3 + 0 && rows.every((r) => r.boxId), `Decks and their steps (${rows.length} rows from ${decks.size} Decks), never a plain board's cards`]; });
  chk('T2', () => { const rows = M.searchSteps('', 'pg1'); const a = rows.find((r) => r.boxId === 'c2'), b = rows.find((r) => r.boxId === 'e1'); return [a && a.title === 'Three-Act · Midpoint' && a.placeDiffers === false && b && b.title === 'Argument · Claim' && b.placeDiffers === true && b.place === 'Essays', 'steps read "Deck · Step"; a step from another Drawer carries its place label']; });
  chk('T3', () => { const rows = M.searchSteps('midpoint', 'pg1'); return [rows.length === 1 && rows[0].boxId === 'c2', 'the search filters steps by deck, step or place']; });
  chk('T4', () => { const before = linkCount(); M.searchSteps('', 'pg1'); return [linkCount() === before, 'listing the steps grafts nothing']; });
  chk('T5', () => { const row = M.searchSteps('', 'pg1').find((r) => r.boxId === 'e1'); const made = M.placeThis('pg1', row); return [made && made.made === 'link' && M.isGrafted({ entryId: 'pg1' }, { entryId: 'deck2', boxId: 'e1' }), 'a press places the page on that step (a record the page owns)']; });
  chk('T6', () => { const g = M.graftsOf({ entryId: 'pg1' }); const r = [...g.Cards, ...g.Pages].find((x) => x.entryId === 'deck2'); return [!!r && r.title === 'Argument · Claim' && r.placeDiffers === true, `the page's Grafts row reads "${r && r.title}"`]; });
  chk('T7', () => [M.kindled('deck2', { id: 'e1', text: 'Claim\n' }) === true, 'the step kindles']);
  chk('T8', () => { const row = M.searchSteps('', 'pg1').find((r) => r.boxId === 'e1'); return [row.checked === true && M.placeThis('pg1', row) === null, 'a placed step is checked and a second press does nothing']; });

  // N - nothing without a press, and the plain card path is untouched
  chk('N1', () => { const g = M.graftsOf({ entryId: 'plain1', boxId: 'p1' }); return [g.Pages.length + g.Cards.length + g.Boards.length === 0, 'a card nobody placed anything on has no grafts']; });
  chk('N2', () => { const g = M.graftsOf({ entryId: 'deck1', boxId: 'c1' }); const t = M.graftsOf({ entryId: 'pg2' }); return [g.Pages.every((r) => r.title === 'The map') && !t.Cards.some((r) => /·/.test(r.title) && r.entryId === 'plain1'), "only the Deck's own steps get the prefix (a plain board's cards read as before)"]; });
  return out;
}

// ---- the lexicon: the word table's strings per theme ------------------------------------------------------------------------------------------------------------------------------------------------------
async function lexicon(over = {}) {
  const out = {}; const { M } = await load(over);
  const T = (k, th) => { try { return M.deskTerm(k, th); } catch { return undefined; } };
  out.L1 = [T('walkWrite', 'plateau') === 'Write this' && T('walkPlace', 'plateau') === 'Place a page…' && T('graftPlaceThis', 'plateau') === 'Place this…', 'Arbor: Write this / Place a page… / Place this…'];
  out.L2 = [T('walkWrite', 'flux') === '[BOOT DOC]' && T('walkPlace', 'flux') === '[INPUT DOC]' && T('graftPlaceThis', 'flux') === 'PORT TO…', 'Flux: [BOOT DOC] / [INPUT DOC] / PORT TO…'];
  out.L3 = [T('walkWrite', 'machina') === 'Draft File' && T('walkPlace', 'machina') === 'Attach File…' && !!T('graftPlaceThis', 'machina') && T('graftPlaceThis', 'machina') !== 'Place this…', 'Machina: Draft File / Attach File… / its own Place-this'];
  out.L4 = [['plateau', 'flux', 'machina'].every((th) => ['graftPlaceSearchPages', 'graftPlaceSearchSteps'].every((k) => !!T(k, th))) && T('graftPlaceSearchPages', 'flux') !== T('graftPlaceSearchPages', 'plateau'), "the filtered pickers' search words exist in every theme (Flux differs from Arbor)"];
  return out;
}

// ---- the source wiring --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function source(over = {}) {
  const out = {}; const rd = (rel) => (over[rel] ? over[rel](readRaw(rel)) : readRaw(rel));
  const walk = strip(rd('components/Walk.tsx')), be = strip(rd('components/BoardEditor.tsx')), pe = strip(rd('pages/PageEditor.tsx')), cp = strip(rd('components/ConnectionsDrawerPanel.tsx')), gp = strip(rd('components/GraftPicker.tsx'));
  out.S1 = [/onOpen: \(card: Box, anchor: HTMLElement\)/.test(walk) && /d\.onOpen\(card, e\.currentTarget\)/.test(walk) && !/Write this|Place a page/.test(walk), "the Walk hands each door the card and the door's own element, and carries no raw door words"];
  out.S2 = [/extraDoors=\{/.test(be) && /key: 'write'/.test(be) && /key: 'place'/.test(be) && /t\('walkWrite'\)/.test(be) && /t\('walkPlace'\)/.test(be) && /planWriteThis\(/.test(be), "BoardEditor wires both doors through extraDoors with the lexicon's words"];
  out.S3 = [/flushNow\(\)/.test((be.match(/const writeThis[\s\S]*?\n  \};/) || [''])[0]) && /navigate\(plan\.href, \{ state: plan\.state \}\)/.test(be) && /saveBoardBoxes\(id, boxesRef\.current\)/.test((be.match(/const writeThis[\s\S]*?\n  \};/) || [''])[0]), 'the door saves the board first, then navigates to the unborn address carrying the chip state (nothing is written for the page)'];
  out.S4 = [/fromStepLabel/.test(pe) && /data-return-chip/.test(pe) && /celebrateReturnChip/.test(readRaw('pages/PageEditor.tsx')), "the page's return chip names the Deck and leaves the one-line W5 hook"];
  out.S5 = [/mode="steps"|mode: 'steps'|'steps'/.test(cp) && /graftPlaceThis/.test(cp) && /mode="pages"/.test(be) && /only === 'pages'|mode === 'pages'/.test(gp), "the page side offers Place this… (steps mode) and the card side the pages-only picker"];
  out.S6 = [/fromStepLabel/.test(cp) && /boxId/.test(gp.match(/export interface CameFrom[^}]*\}/)?.[0] ?? ''), '"Came from" names the step (Deck · Step) and can point at a card'];
  return out;
}

// ---- run, with mutants ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const results = { ...(await model()), ...(await lexicon()), ...source() };
const ids = Object.keys(results);
let fails = ids.filter((i) => !results[i][0]);
for (const i of ids) console.log(`${results[i][0] ? 'PASS' : 'FAIL'}  ${i}  ${results[i][1]}`);

const MUTANTS = [
  { name: 'the door grafts the moment it is pressed', over: { 'store/writePlace.ts': (t) => t.replace('  const href = unbornHref({', "  graftTo({ entryId: board.boardId, boxId: card.id }, { entryId: 'pg1' });\n  const href = unbornHref({") }, red: ['W1'], model: true },
  { name: 'birth forgets the graft', over: { 'store/unbornPage.ts': (t) => t.replace(/if \(d\.graft\) \{\n    const board/, 'if (false as boolean) {\n    const board') }, red: ['B3', 'B5'], model: true },
  { name: 'the pages-only filter is ignored', over: { 'store/grafts.ts': (t) => t.replace(/only === 'pages'/g, "only === 'never'") }, red: ['P1'], model: true },
  { name: 'steps list a plain board too', over: { 'store/writePlace.ts': (t) => t.replace(/&& isDeck\(e\)/g, '') }, red: ['T1'], model: true },
  { name: 'the step label loses its deck', over: { 'store/grafts.ts': (t) => t.replace(/return `\$\{deck\}\$\{STEP_SEP\}\$\{card\}`/, 'return card') }, red: ['W3', 'T2'], model: true },
  { name: 'a step of a deck shows as the bare card on the page', over: { 'store/grafts.ts': (t) => t.replace(/if \(e\.id !== subject\.entryId && isDeck\(e\)\)/, 'if (false as boolean)') }, red: ['B4', 'T6'], model: true },
  { name: 'the page is not set to Free Write', over: { 'store/unbornPage.ts': (t) => t.replace("'journal'); } catch", "'drafting'); } catch") }, red: ['B8'], model: true },
  { name: 'the page is born outside the deck set', over: { 'store/writePlace.ts': (t) => t.replace(/binderId: [^,]*setId[^,]*,/, 'binderId: null,') }, red: ['W2', 'B2'], model: true },
  { name: 'the Walk loses its two doors', over: { 'components/BoardEditor.tsx': (t) => t.replace('extraDoors={walkDoors}', '') }, red: ['S2'], source: true },
  { name: 'the door navigates without saving the board first', over: { 'components/BoardEditor.tsx': (t) => t.replace(/    else saveBoardBoxes\(id, boxesRef\.current\);\n/, '') }, red: ['S3'], source: true },
  { name: 'the return chip loses the step', over: { 'pages/PageEditor.tsx': (t) => t.split('data-return-chip').join('data-x-chip') }, red: ['S4'], source: true },
  { name: 'the page side loses Place this', over: { 'components/ConnectionsDrawerPanel.tsx': (t) => t.replace('mode="steps"', 'mode="all"') }, red: ['S5'], source: true },
  { name: 'the Walk passes no card to its doors', over: { 'components/Walk.tsx': (t) => t.replace('d.onOpen(card, e.currentTarget)', 'd.onOpen(undefined as never, e.currentTarget)') }, red: ['S1'], source: true },
  { name: 'the Flux word reverts to an Arbor noun', over: { 'store/deskLexicon.ts': (t) => t.replace("'[BOOT DOC]'", "'Write this'") }, red: ['L2'], lexicon: true },
];
let landed = 0;
for (const m of MUTANTS) {
  const r = m.lexicon ? await lexicon(m.over) : m.source ? source(m.over) : await model(m.over);
  const redNow = Object.keys(r).filter((k) => !r[k][0]);
  const hit = m.red.every((k) => redNow.includes(k)) && (fails.length > 0 || redNow.length > 0);
  if (hit) landed += 1;
  console.log(`${hit ? 'MUTANT LANDED' : 'MUTANT SURVIVED'}  ${m.name}  (red: ${redNow.join(',') || 'none'}; wanted ${m.red.join(',')})`);
}
const survived = MUTANTS.length - landed;
console.log(`\n${ids.length - fails.length}/${ids.length} checks green, ${landed}/${MUTANTS.length} mutants landed`);
process.exit(fails.length === 0 && survived === 0 ? 0 : 1);
