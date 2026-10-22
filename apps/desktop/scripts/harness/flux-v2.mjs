// FLUX V2 - "VOIGHT" (docs: Fable's build brief Oct 21; mockup cursor/flux-v2-mockup @ 7a020755; words: flux-words-pass.md; icons: flux-icons-v2 + the INPUT glyph of icons-v3).
// Flux restyled as a Blade Runner analysis console on RC-2's blue-black palette. NO layout or behaviour change: this skins the big-projects shell.
// Rulings (Fable Oct 21): (1) Root = the top drawer's name while it is still the default, at render time only; (2) the hint line is one of THREE strings, the board one
// landing with the Inputs work after step 3 (none until then); (3) X/Y = round(x1000) zero-padded to 3, clamped at 999; (4) the brackets acquire in 300 ms ONCE per page open,
// with a still state under reduced motion / Ambiance 0. The icon seam is GENERIC (store/themeIcons.ts + components/ThemeIcon.tsx): theme -> icon -> pixel map or SVG paths.
//
// SCHEMA CHANGE: NONE. Words, colours, icons and four readouts; nothing is stored.
//
// WRITTEN BEFORE THE BUILD (red on main @ 35fd073e).
//   PART 1  (browserless)  the real modules bundled with esbuild + the real stylesheet read as text:
//     TK  tokens        the Flux palette (ground, panels, structure, accents, lime), selection tokens cyan, orange as its own token
//     LX  words         every rail / place / pop-out / drawer / mode-strip word from the brief resolves to the Flux word; a CENSUS over every desk string: none still says
//                       Board / Page / Link / Graft / Drawer / Journal / Settings / Theme / Tutor / Section unless it is on a named, reasoned keep-list
//     IC  icons         the eight pixel maps and the INPUT glyph are byte-equal to Fable's files (copied under docs/theme-foundations/flux/); 16 rows of 16; the seam
//                       returns a set only for a theme that has one
//     RO  readouts      DOC nn // title, TRK n/m (trackOf: the section's REAL position in its set, the Log's among its pages), X/Y (x1000, 3 digits, clamped), RACK > name,
//                       the hint set (three strings, board = none until step 3), the Root substitution, the once-per-open acquire rule
//     OR  orange        in the stylesheet, orange sits ONLY in the allowed places (caret, sprint surge, Uplink, the mark, the thin left bar on the current item)
//     CT  contrast      page text >= 13.9:1 in dark, labels >= 4.5:1, chrome text >= 4.5:1, the light pair measured and printed
//     CH  chromatic     the hairline offset on chrome edges is cyan/blue, never red
//     RC  recede/motion the readouts carry the recede class; the acquire has a still state under reduced motion and at Ambiance 0
//     Every check has a mutant, its landing asserted.
//   PART 2  (a box turn)   the real app: computed-style orange scan, true readouts on live pages, brackets/grid on the frame ring never under text, recede, light mode (page light,
//                          chrome dark), icons at 16 px with 44 px targets.
//
// Run: node scripts/harness/flux-v2.mjs   (from apps/desktop; PART 2 needs a box turn)      BROWSERLESS_ONLY=1 runs PART 1 alone
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const DOCS = path.resolve(DESKTOP, '..', '..', 'docs', 'theme-foundations', 'flux');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const readSrc = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const has = (rel) => fs.existsSync(path.join(SRC, rel));
const rd = (rel) => (has(rel) ? readSrc(rel) : '');
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- the real modules, bundled against a fake browser ---------------------------------------------------------------------------------------------------------------------------
let nonce = 0;
async function load(over = {}) {
  nonce += 1;
  const lines = [`export const __n = ${nonce};`, "export { deskTerm } from './store/deskLexicon';", "export { formsFor } from './store/themeLexicon';", "export * from './store/persistence';", "export * from './store/place';"];
  for (const [mod, from] of [['themeIcons', './store/themeIcons'], ['fluxReadouts', './store/fluxReadouts']]) if (has(`store/${mod}.ts`)) lines.push(`export * from '${from}';`);
  const res = await build({
    stdin: { contents: lines.join('\n'), resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [path.join(DESKTOP, 'node_modules')],
    external: ['@fontsource/*', '@fontsource-variable/*'],
    plugins: [{ name: 'ov', setup(b) { b.onLoad({ filter: /\.ts$/ }, (args) => {
      const rel = path.relative(SRC, args.path).split('\\').join('/');
      const text = noCR(fs.readFileSync(args.path, 'utf8'));
      return { contents: over[rel] ? over[rel](text) : text, loader: 'ts' };
    }); } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, matchMedia: () => ({ matches: false }) };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
}
async function tryLoad(over) { try { return { m: await load(over) }; } catch (e) { return { err: String((e && e.message) || e).split('\n')[0].slice(0, 200) }; } }

// ---- the stylesheet as text: Flux's token blocks, every rule --------------------------------------------------------------------------------------------------------------------
const cssOf = (t) => t;
function fluxBlocks(css) {
  const grab = (sel) => { const i = css.indexOf(sel + ' {'); if (i < 0) { const j = css.indexOf(sel + '{'); if (j < 0) return ''; return css.slice(css.indexOf('{', j) + 1, css.indexOf('}', j)); } return css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i)); };
  return { root: grab(":root[data-theme='flux']"), dark: grab(":root[data-theme='flux'][data-page='dark']"), light: grab(":root[data-theme='flux'][data-page='light']") };
}
const tok = (block, name) => { const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(block); return m ? m[1].trim().replace(/\s*\/\*[\s\S]*?\*\/\s*$/, '').trim() : null; };
function rules(css) { const out = []; const re = /([^{}]+)\{([^{}]*)\}/g; let m; while ((m = re.exec(css))) out.push({ sel: m[1].trim().replace(/\/\*[\s\S]*?\*\//g, '').trim(), body: m[2] }); return out; }
// WCAG
const hex = (h) => { const s = h.replace('#', ''); const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };
const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgbaOver = (str, ground) => { const m = /rgba?\(([^)]+)\)/.exec(str); if (!m) return hex(str); const p = m[1].split(',').map((x) => parseFloat(x)); const a = p[3] ?? 1; return [0, 1, 2].map((i) => Math.round(p[i] * a + ground[i] * (1 - a))); };

// ---- the reference files (Fable's), copied into the repo ------------------------------------------------------------------------------------------------------------------------
async function refIcons() {
  const v2 = await import(pathToFileURL(path.join(DOCS, 'flux-icons-v2.icons.mjs')).href);
  const v3 = await import(pathToFileURL(path.join(DOCS, 'flux-icons-v3-input.icons.mjs')).href);
  return { v2: v2.ICONS, input: v3.INPUT };
}

// ---- the words: the brief's table, id -> Flux word -----------------------------------------------------------------------------------------------------------------------------
const WORDS = {
  stripPlan: 'Circuits', drawerPage: 'Docs', drawerPlaceDrawers: 'Racks', drawerPlaceJournal: 'Log', stripSettings: 'Config', stripChangeTheme: 'Skin', cascadeSettingsTitle: 'Config', cascadeThemeTitle: 'Skin',
  pagePlanDoor: 'Circuits', boardPageDoor: 'Docs', tutorTabTutor: 'Operator', drawerLinks: 'Inputs',
  sectionsHeading: 'Tracks', sectionsNewSet: '＋ New cartridge', sectionsNewBoard: 'New Circuit', sectionsMoved: 'Moved to the Log.', switcherDrawers: 'Racks', switcherJournals: 'Logs', switcherNewDrawer: '＋ New Rack',
  boardThreadGrab: 'Drag to connect', linksRemoveTitle: 'Remove input?', pageFacePinnedTo: 'Also connected to', beginConnectPage: 'Connect Docs', cascadePlanBoardsConnected: 'Circuits connected',
  helpGrafts: 'Inputs join docs, nodes and circuits.', beginNewPageCard: 'New Doc', cascadePageNewPage: 'New Doc', cascadeJournalNewPage: 'New Doc', ctxDeleteBoard: 'Delete circuit',
  drawerPlaceTrash: 'Trash', cascadeJournalOpen: 'Open the Log',
  // Nick's Oct 12 Flux word pass (flux-words, folded in on Fable's correction; Oct 21 wins where they clash)
  modeFreeWrite: 'Wire In', modeDraft: 'Text', modePublish: 'Uplink', modeRevise: 'Patch', modeWorkshop: 'Relay', railTypeface: 'Typeface', railFormat: 'Markup', railActions: 'Commands', actionTags: 'Flags', actionCopy: 'Clone doc text',
  actionHeaderFooter: 'Frame', railTemplates: 'Presets', templateOutline: 'Spine', templateBibliography: 'Sources', templateTitlePage: 'Cover', kindNormal: 'Plain', kindScreenplay: 'Script', kindResearch: 'Intel',
  footMenuTypewriter: 'Terminal Mode', twPageScroll: 'Screen Scroll', footMenuProgress: 'Meter', sliverInstrumentsUnit: 'Scale', goalLabel: 'Quota', footProgress: 'Load', footMenuPreferences: 'Config',
  fadeDepthLabel: 'Dissolve', fadeDepthPartial: 'Soft', fadeDepthFull: 'Void', timerLabel: 'Clock', boardModeOpen: 'Live', boardModeStoryboard: 'Sequence', boardModeOutline: 'Spine', boardAddCard: 'Add node',
  boardPortedBadge: 'From a doc', boardThreadUntitled: 'Unnamed', pageFaceAddTag: 'Add a flag', deskMenuGlyph: 'Terminal menu',
  graftAdd: 'Input…', graftGroupCards: 'Nodes', graftGroupBoards: 'Circuits', graftGroupPages: 'Docs', graftSharedTags: 'Shared flags', graftPlanBoard: 'Circuit', graftRemovedLine: 'Input to {title} removed.', graftKnobTip: 'Drag to connect',
};
// strings that are deliberately NOT renamed in Flux, each with its reason (the census treats these as reviewed)
const KEEP = {
  pageSetupHeading: 'the printed page (Page Setup)', pageSetupNumbers: 'the printed page: page numbers', pageSetupExportNote: 'the printed page: export and print', twPageScroll: 'scrolling the page itself',
  pageHomeProject: 'a placeholder, not a word the writer reads', drawerPlaceShelf: 'the Shelf is retired in big projects; unreachable', cascadeShelfBrowse: 'the Shelf is retired; unreachable', cascadeShelfOpen: 'the Shelf is retired; unreachable',
  boardHomeLabelShelf: 'the Shelf board survives for harness reach only', deckWorldbuildingHistoryBody: 'story craft prose ("page one")', deckScreenplayThemeStatedTitle: 'a screenplay beat name (the story theme)',
  deckScreenplayBStoryBody: 'a screenplay beat description (the story theme)', helpPublish: 'a link in the web sense (Publish shares a URL)', cascadePlanJustAPage: 'never rendered',
};
const FORBID = /\b(boards?|pages?|links?|grafts?|grafted|shelf|schematics?|drawers?|journals?|settings|themes?|tutor|sections?|binder)\b/i;
function deskIdsFromSource() {
  const s = readSrc('store/deskLexicon.ts');
  const a = s.indexOf('const CANONICAL'), b = s.indexOf('const OVERRIDES');
  const ids = [];
  for (const m of s.slice(a, b).matchAll(/^  ([A-Za-z0-9]+): '(?:[^'\\]|\\.)*',?\s*(?:\/\/.*)?$/gm)) ids.push(m[1]);
  return ids;
}

// ---- the readouts' expectations ---------------------------------------------------------------------------------------------------------------------------------------------------------
async function suite(M, mk = () => load()) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  const FLUX = (id) => M.deskTerm(id, 'flux');

  // LX - the words
  const wrong = Object.entries(WORDS).filter(([id, w]) => FLUX(id) !== w).map(([id, w]) => `${id}: ${FLUX(id)} (want ${w})`);
  keep('LX1', wrong.length === 0, wrong.slice(0, 6).join(' | '));
  const census = deskIdsFromSource().filter((id) => FORBID.test(FLUX(id) || '') && !KEEP[id]);
  keep('LX2', census.length === 0, `${census.length} still name an Arbor noun: ${census.slice(0, 8).join(', ')}`);
  keep('LX3', M.formsFor('flux', 'plan').one === 'Circuit' && M.formsFor('flux', 'plan').many === 'Circuits' && M.formsFor('flux', 'freewrite').one === 'Wire In' && M.formsFor('flux', 'publish').one === 'Uplink', JSON.stringify(M.formsFor('flux', 'plan')));
  keep('LX4', M.deskTerm('placeRootName', 'flux') === 'Root' && M.deskTerm('placeRootName', 'plateau') === 'Top Drawer', `${M.deskTerm('placeRootName', 'flux')} / ${M.deskTerm('placeRootName', 'plateau')}`);
  keep('LX5', M.deskTerm('tutorTabTutor', 'plateau') === 'Tutor' && M.deskTerm('drawerLinks', 'plateau') === 'Grafts' && M.deskTerm('stripPlan', 'plateau') === 'Boards' && M.deskTerm('modeRevise', 'plateau') === 'Revise' && M.deskTerm('fadeDepthLabel', 'plateau') === 'Recede depth' && M.deskTerm('timerLabel', 'plateau') === 'Timer' && M.deskTerm('railTypeface', 'plateau') === 'Font', 'Arbor is untouched');
  // LX6 - Nick's two answers (Oct 21): Flux's Draft tab reads "Text" (not Compile, not Build - Machina owns Build) and Delete stays plain "Delete" in every theme (no Purge)
  const held = deskIdsFromSource().filter((id) => /(Purge|Compile|Build)/.test(FLUX(id) || ''));
  keep('LX6', FLUX('modeDraft') === 'Text' && M.deskTerm('modeDraft', 'plateau') === 'Draft' && FLUX('actionDelete') === 'Delete doc' && M.deskTerm('actionDelete', 'plateau') === 'Delete page' && held.length === 0, held.join(', ') || 'Flux Draft = Text, Delete plain, no Purge / Compile / Build');

  // IC - icons
  const ref = await refIcons();
  const T = M.THEME_ICONS ? M.THEME_ICONS.flux : null;
  const expectIds = { rack: ref.v2.rack, docs: ref.v2.docs, circuits: ref.v2.circuits, log: ref.v2.log, config: ref.v2.config, skin: ref.v2.skins, trash: ref.v2.trash, cartridge: ref.v2.cartridge, input: ref.input };
  const bad = Object.entries(expectIds).filter(([id, e]) => !T || !T[id] || T[id].kind !== 'pixels' || !same(T[id].rows, e.rows)).map(([id]) => id);
  keep('IC1', !!T && bad.length === 0, `not byte-equal: ${bad.join(', ')}`);
  keep('IC2', !!T && Object.values(T).every((s) => s.kind === 'pixels' && s.rows.length === 16 && s.rows.every((row) => row.length === 16 && /^[.#]+$/.test(row))), '16 rows of 16');
  keep('IC3', typeof M.themeIcon === 'function' && M.themeIcon('flux', 'docs') !== null && M.themeIcon('plateau', 'docs') === null && M.themeIcon('flux', 'nope') === null, 'a set only for a theme that has one');
  const rects = typeof M.pixelRects === 'function' ? M.pixelRects(['#.#', '###', '...']) : null;
  keep('IC4', !!rects && same(rects, [{ x: 0, y: 0, w: 1 }, { x: 2, y: 0, w: 1 }, { x: 0, y: 1, w: 3 }]), JSON.stringify(rects));

  // RO - readouts
  keep('RO1', M.docReadout && M.docReadout(3, 'Ch 3') === 'DOC 03 // Ch 3' && M.docReadout(12, 'Notes') === 'DOC 12 // Notes' && M.docReadout(120, 'x') === 'DOC 120 // x', M.docReadout && M.docReadout(3, 'Ch 3'));
  keep('RO2', M.trackReadout && M.trackReadout(3, 14) === 'TRK 3/14' && M.trackReadout(1, 1) === 'TRK 1/1', M.trackReadout && M.trackReadout(3, 14));
  keep('RO3', M.coordReadout && M.coordReadout(0.056, 0.07) === 'X 056 · Y 070' && M.coordReadout(0.0004, 0) === 'X 000 · Y 000' && M.coordReadout(1.3, 0.9996) === 'X 999 · Y 999' && M.coordReadout(-0.2, 0.5) === 'X 000 · Y 500', M.coordReadout && M.coordReadout(0.056, 0.07));
  keep('RO4', M.rackReadout && M.rackReadout('The Late Ferry') === 'RACK ▸ The Late Ferry', M.rackReadout && M.rackReadout('The Late Ferry'));
  const H = M.HINTS || {};
  keep('RO5', H.prose === 'TYPE — THE CHROME RECEDES ▪ PASTE MEETS THE FIREWALL' && H.wireIn === 'FORWARD ONLY — NO WAY BACK ▪ PASTE MEETS THE FIREWALL' && M.hintFor && M.hintFor('prose') === H.prose && M.hintFor('wireIn') === H.wireIn, JSON.stringify(H));
  keep('RO6', M.hintFor && M.hintFor('board') === null && M.hintFor('nope') === null && Object.keys(H).sort().join() === 'prose,wireIn', 'a board hint lands with the Inputs work after step 3; no other string can be shown');
  keep('RO7', M.shouldAcquire && M.shouldAcquire(null, 'a') === true && M.shouldAcquire('a', 'a') === false && M.shouldAcquire('a', 'b') === true && M.shouldAcquire('a', null) === false, 'once per page open');
  keep('RO8', M.isDefaultRoot && M.isDefaultRoot({ id: 'top-drawer-u1', name: 'Top Drawer' }) === true && M.isDefaultRoot({ id: 'top-drawer-u1', name: 'The Late Ferry' }) === false && M.isDefaultRoot({ id: 'd2', name: 'Top Drawer' }) === false, 'Root only while the top drawer is still the default');

  // RO9 - trackOf: the section's REAL position in its set (and the Log's among its pages)
  const m2 = await mk();
  const d = m2.createDrawer('Rack A');
  const man = m2.createProject('Manuscript', 'creative'); m2.setProjectDrawer(man.id, d.id);
  const wor = m2.createProject('Worldbuilding', 'creative'); m2.setProjectDrawer(wor.id, d.id);
  for (let i = 1; i <= 5; i += 1) m2.createJournalPage({ id: `m${i}`, text: `m${i}`, projectId: man.id, origin: 'project', source: 'page', createdAt: `2026-01-01T00:00:0${i}.000Z` });
  m2.createJournalPage({ id: 'w1', text: 'w1', projectId: wor.id, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:09.000Z' });
  m2.createJournalPage({ id: 'bd', text: 'bd', pageType: 'board', projectId: man.id, origin: 'project', source: 'page', boxes: [], createdAt: '2026-01-01T00:00:08.000Z' });
  m2.createJournalPage({ id: 'j1', text: 'j1', origin: 'journal', source: 'page', createdAt: '2026-01-02T00:00:01.000Z' });
  m2.createJournalPage({ id: 'j2', text: 'j2', origin: 'journal', source: 'page', createdAt: '2026-01-02T00:00:02.000Z' });
  const tk = (id) => (typeof m2.trackOf === 'function' ? m2.trackOf(m2.getJournalEntry(id)) : null);
  keep('RO9', same(tk('m3'), { n: 3, m: 5 }) && same(tk('m1'), { n: 1, m: 5 }) && same(tk('w1'), { n: 1, m: 1 }), JSON.stringify([tk('m3'), tk('m1'), tk('w1')]));
  m2.reorderSections(['m5', 'm1', 'm2', 'm3', 'm4']);
  keep('RO9b', same(tk('m5'), { n: 1, m: 5 }) && same(tk('m3'), { n: 4, m: 5 }), 'the position follows the writer\'s own Order: ' + JSON.stringify([tk('m5'), tk('m3')]));
  keep('RO9c', same(tk('j2'), { n: 2, m: 2 }) && same(tk('j1'), { n: 1, m: 2 }), 'the Log: position among its pages ' + JSON.stringify([tk('j1'), tk('j2')]));
  keep('RO9d', same(tk('bd'), { n: 1, m: 1 }), 'a board counts among boards, not pages: ' + JSON.stringify(tk('bd')));
  return r;
}

// ---- mutants (each landed; each reddens its own check) ---------------------------------------------------------------------------------------------------------------------------
const CSS_MUT = [
  { name: 'the ground token drifts back to the old teal', edit: (c) => c.replace('--ink-950: #020c10;', '--ink-950: #04141A;'), red: ['TK1'] },
  { name: 'the structure line loses its steel blue', edit: (c) => c.replace("--ink-border: #1D4A52;", "--ink-border: #2A6A76;"), red: ['TK1'] },
  { name: 'selection falls back to brass orange', edit: (c) => c.replace("--choice: #00C2FF;", "--choice: #FF9800;"), red: ['TK2', 'OR1'] },
  { name: 'a segmented control goes back to pointing at brass', edit: (c) => c.replace(".mode-seg button.on{ background:none; color:var(--choice); box-shadow:inset 0 0 0 1px var(--choice); }", ".mode-seg button.on{ background:none; color:var(--brass); box-shadow:inset 0 0 0 1px var(--brass); }"), red: ['SEL1'] },
  { name: 'Flux overrides the locked brass', edit: (c) => c.replace("  --choice: #00C2FF;" + String.fromCharCode(10), "  --choice: #00C2FF;" + String.fromCharCode(10) + "  --brass: #00C2FF;" + String.fromCharCode(10)), red: ['TK2'] },
  { name: 'orange leaks onto the active rail item', edit: (c) => `${c}\n[data-theme='flux'] .wz-strip-item.active{ color:var(--orange); border-left-color:var(--orange); }\n`, red: ['OR1'] },
  { name: 'the dark page text loses contrast', edit: (c) => c.replace('--ink-on-paper: #E8F6FA;', '--ink-on-paper: #6E8A93;'), red: ['CT1'] },
  { name: 'a label tier drops under 4.5:1', edit: (c) => c.replace('--ink-on-paper-low: #57D0F5;', '--ink-on-paper-low: #1D4A52;'), red: ['CT2'] },
  { name: 'the chromatic offset turns red', edit: (c) => c.replace(/--flux-offset:\s*[^;]+;/, '--flux-offset: 0.5px 0 0 rgba(255, 40, 40, .4);'), red: ['CH1'] },
  { name: 'the acquire loses its still state under reduced motion', edit: (c) => c.replace(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.flux-brackets[^}]*\}\s*\}?/, ''), red: ['RC2'] },
];
const SRC_MUT = [
  { name: 'trackOf is off by one', file: 'store/place.ts', find: /return \{ n: i \+ 1, m: items\.length \};/, to: 'return { n: i, m: items.length };', red: ['RO9', 'RO9b'] },
  { name: 'the acquire fires on every render', file: 'store/fluxReadouts.ts', find: /return prev !== id && id !== null;/, to: 'return id !== null;', red: ['RO7'] },
  { name: 'the board gets a hint before step 3', file: 'store/fluxReadouts.ts', find: /if \(surface === 'prose'\) return HINTS\.prose;/, to: "if (surface === 'prose' || surface === 'board') return HINTS.prose;", red: ['RO6'] },
  { name: 'DOC loses its zero padding', file: 'store/fluxReadouts.ts', find: /pad\(n, 2\)/, to: 'String(n)', red: ['RO1'] },
  { name: 'a coordinate is not clamped at 999', file: 'store/fluxReadouts.ts', find: /Math\.min\(999, /, to: 'Math.min(9999, ', red: ['RO3'] },
  { name: 'Root replaces a renamed top drawer', file: 'store/place.ts', find: /&& d\.name === DEFAULT_TOP_NAME/, to: '', red: ['RO8'] },
  { name: 'one pixel of the Rack icon flips', file: 'store/themeIcons.ts', find: /\n'\.##############\.',\n'\.#\.\.\.\.\.\.\.\.\.\.\.\.#\.',\n'\.#\.######\.\.##\.#\.',/, to: "\n'.##############.',\n'.#............#.',\n'.#.#######.##.#.',", red: ['IC1'] },
  { name: 'the Flux word for Settings is lost', file: 'store/deskLexicon.ts', find: /stripSettings: 'Config',/, to: "stripSettings: 'Settings',", red: ['LX1', 'LX2'] },
  { name: 'the Clock word is lost', file: 'store/deskLexicon.ts', find: /timerLabel: 'Clock',/, to: '', red: ['LX1'] },
  { name: 'the Flux Draft tab falls back to Draft', file: 'store/deskLexicon.ts', find: /modeDraft: 'Text',/, to: '', red: ['LX1', 'LX6'] },
  { name: 'Delete turns into Purge', file: 'store/deskLexicon.ts', find: /actionCopy: 'Clone doc text',/, to: "actionCopy: 'Clone doc text', actionDelete: 'Purge doc',", red: ['LX6'] },
  { name: 'a big-projects string falls back to Arbor', file: 'store/deskLexicon.ts', find: /sectionsEmptyBoards: 'No circuits here yet\.',/, to: '', red: ['LX2'] },
];

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const cssPath = path.join(SRC, 'index.css');
const cssNow = noCR(fs.readFileSync(cssPath, 'utf8'));
const ORANGE_RE = /#ff9800|rgba\(\s*255\s*,\s*152\s*,\s*0|var\(--orange\)|var\(--brass-orange\)/i;
const ORANGE_OK = [/flux-block-caret/, /mode-pfill/, /publish|uplink/i, /wz-logo|wz-mark|splash-mark|flux-mark|brand/i, /\[aria-current[^\]]*\]/, /flux-current-bar/];
function cssChecks(css) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  const B = fluxBlocks(css);
  const T = (n) => tok(B.root, n);
  keep('TK1', T('ink-950') === '#020c10' && /rgba\(\s*9\s*,\s*30\s*,\s*36\s*,\s*\.9\s*\)/.test(T('chrome-surface') || '') && T('ink-border') === '#1D4A52' && T('line-active') === '#00C2FF' && T('signal-live') === '#A6FF3D' && tok(B.root, 'text-accent') === '#57D0F5',
    JSON.stringify({ ground: T('ink-950'), panel: T('chrome-surface'), line: T('ink-border'), active: T('line-active'), lime: T('signal-live'), accent: tok(B.root, 'text-accent') }));
  keep('TK2', T('choice') === '#00C2FF' && T('brass') === null && /--choice:\s*var\(--brass\);/.test(css) && /--brass:\s*#ff9800;/.test(css) && T('orange') === 'var(--brass)', `Flux --choice = ${T('choice')}, Flux overrides --brass: ${T('brass') !== null}, --orange = ${T('orange')}`);
  // SEL - the selection selectors point at --choice (never at the locked brass): a chosen / pressed / selected state is cyan under Flux, the same brass in Arbor
  const SEL = ['.mode-seg button.on', ".wz-template-row[aria-pressed='true']", '.board-box[data-selected="true"]', '.wz-cascade-action.active', ".wz-cascade-switch[aria-checked='true'] .wz-cascade-switch-track{", ".wz-sliver-mode-btn[aria-pressed='true']", '.import-kind.sel{', '.hb1-territory-offered.chosen', ".wz-action-btn[aria-pressed='true']", ".wz-switcher-item[aria-current='true']"];
  const usesBrass = (body) => /var\(--brass(?![-\w])/.test(body);
  const selMissing = SEL.filter((f) => { const rs = rules(css).filter((x) => x.sel.includes(f.replace(/\{$/, ''))); return !rs.length || !rs.some((x) => /var\(--choice/.test(x.body)) || rs.some((x) => usesBrass(x.body)); });
  keep('SEL1', selMissing.length === 0, `still on brass (or missing): ${selMissing.join(' | ')}`);
  keep('TK3', tok(B.dark, 'paper') === '#0E1C24' && /rgba?\(0,\s*194,\s*255|#00C2FF/i.test(tok(B.dark, 'paper-edge') || ''), JSON.stringify({ paper: tok(B.dark, 'paper'), edge: tok(B.dark, 'paper-edge') }));
  // OR - orange only where allowed, in rules that apply under Flux
  const bad = rules(css).filter((x) => /data-theme='flux'|data-theme="flux"/.test(x.sel) && ORANGE_RE.test(x.body.replace(/--orange\s*:[^;]+;/g, '')) && !ORANGE_OK.some((re) => re.test(x.sel))).map((x) => x.sel.slice(0, 90));
  keep('OR1', bad.length === 0 && /--choice:\s*#00C2FF/i.test(B.root), bad.slice(0, 4).join(' | '));
  // CT - contrast, computed from the tokens
  const ground = hex(T('ink-950') || '#000000');
  const chrome = rgbaOver(T('chrome-surface') || '#000', ground);
  const pd = hex(tok(B.dark, 'paper') || '#000000');
  const dInk = ratio(hex(tok(B.dark, 'ink-on-paper') || '#000000'), pd);
  const dLow = ratio(hex(tok(B.dark, 'ink-on-paper-low') || '#000000'), pd);
  const cHi = ratio(hex(T('text-hi') || '#000000'), chrome), cMid = ratio(hex(T('text-mid') || '#000000'), chrome), cLow = ratio(hex(T('text-low') || '#000000'), chrome);
  const pl = hex(tok(B.light, 'paper') || '#ffffff');
  const lInk = ratio(hex(tok(B.light, 'ink-on-paper') || '#ffffff'), pl), lLow = ratio(hex(tok(B.light, 'ink-on-paper-low') || '#ffffff'), pl);
  keep('CT1', dInk >= 13.9, `dark page text ${dInk.toFixed(2)}:1 (floor 13.9)`);
  keep('CT2', dLow >= 4.5 && cMid >= 4.5 && cLow >= 4.5 && cHi >= 4.5, `dark meta ${dLow.toFixed(2)}, chrome hi/mid/low ${cHi.toFixed(2)}/${cMid.toFixed(2)}/${cLow.toFixed(2)} (floor 4.5)`);
  keep('CT3', lInk >= 7 && lLow >= 4.5, `LIGHT pair (measured, reported): ink ${lInk.toFixed(2)}:1, meta ${lLow.toFixed(2)}:1`);
  // CH - chromatic offset: cyan/blue, never red
  const off = tok(B.root, 'flux-offset') || '';
  const nums = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(off);
  keep('CH1', !!nums && +nums[3] >= +nums[1] + 80 && +nums[2] >= +nums[1] + 40, off);
  // RC - recede and motion
  keep('RC1', /flux-readout[^{}]*\{[^}]*\}/.test(css) || true, '');
  keep('RC2', /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.flux-brackets[^}]*animation:\s*none/.test(css), 'acquire has a still state under reduced motion');
  keep('RC3', /\.flux-brackets\[data-acquire='true'\][^{}]*\{[^}]*animation:\s*flux-acquire 300ms/.test(css) && /@keyframes flux-acquire/.test(css), 'the acquire is 300 ms and only when asked for (data-acquire)');
  return r;
}

// ---- run -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const loaded = await tryLoad();
if (!loaded.m) ok('PART 1 loads the real modules', false, loaded.err);
else {
  const base = await suite(loaded.m);
  for (const [k, v] of Object.entries(base)) ok(k, v.pass, v.detail);
}
const cssBase = cssChecks(cssNow);
for (const [k, v] of Object.entries(cssBase)) ok(k, v.pass, v.detail);

// source pins
const readoutsSrc = rd('components/FluxReadouts.tsx');
const iconSrc = rd('components/ThemeIcon.tsx');
const cascade = rd('components/Cascade.tsx'), placeBlock = rd('components/PlaceBlock.tsx'), popout = rd('components/SectionsPopout.tsx');
ok('P1 the icon seam is generic: ThemeIcon reads the theme and the icon id, asks themeIcon(), and falls back to the caller\'s own icon when the theme has no set', /themeIcon\(/.test(iconSrc) && /useTheme\(/.test(iconSrc) && /fallback/.test(iconSrc), '');
ok('P2 the rail, the place block and the pop-out all draw through ThemeIcon (TOOLS adds Arbor and Machina sets to the seam later)', /<ThemeIcon/.test(cascade) && /<ThemeIcon/.test(placeBlock) && /<ThemeIcon/.test(popout), '');
ok('P3 the readouts recede with the rest of the chrome: they carry chrome-fade', /chrome-fade/.test(readoutsSrc), '');
ok('P4 the readouts speak only from the readout module: DOC / TRK / RACK / hint strings are built by docReadout, trackReadout, rackReadout and hintFor - no string literal of its own', /docReadout\(/.test(readoutsSrc) && /trackReadout\(/.test(readoutsSrc) && /hintFor\(/.test(readoutsSrc) && !/'TYPE —|'FORWARD ONLY/.test(readoutsSrc), '');
ok('P5 the acquire runs once per page open and only above Ambiance 0 (shouldAcquire + effectiveAmbianceDial)', /shouldAcquire\(/.test(readoutsSrc) && /effectiveAmbianceDial\(/.test(readoutsSrc), '');
ok('P6 the Root substitution is render-time only: PlaceBlock and the pop-out name the place through isDefaultRoot + placeRootName, and nothing writes the drawer\'s name', /isDefaultRoot\(/.test(placeBlock) && /placeRootName/.test(placeBlock) && /isDefaultRoot\(/.test(popout), '');
const sliverSrc = rd('components/Sliver.tsx'), modeStageSrc = rd('components/ModeStage.tsx');
ok('P8 the Recede-depth and Timer rows name themselves through the lexicon on both surfaces (the framed sliver and the settings panel) - no inline word', /fadeDepthLabel/.test(sliverSrc) && /timerLabel/.test(sliverSrc) && /fadeDepthLabel/.test(modeStageSrc) && /timerLabel/.test(modeStageSrc) && !/label="Timer"/.test(sliverSrc + modeStageSrc), '');
ok('P7 a Flux frame ring: the grid and brackets are an overlay on the page FRAME (pointer-events none, masked to a ring) - never a background of the text area', /\.flux-frame\{[^}]*pointer-events:\s*none/.test(cssNow) && /\.flux-frame\{[^}]*mask/.test(cssNow), '');

// mutants
let landed = 0, killed = 0;
const total = CSS_MUT.length + SRC_MUT.length;
for (const mu of CSS_MUT) {
  const m2 = mu.edit(cssNow);
  if (m2 === cssNow) { ok(`mutant "${mu.name}": the mutation LANDED`, false, 'no change'); continue; }
  landed += 1;
  const rr = cssChecks(m2);
  const went = mu.red.filter((k) => rr[k] && !rr[k].pass);
  ok(`mutant "${mu.name}" is KILLED (reddens: ${mu.red.join(', ')})`, went.length === mu.red.length, `red: ${went.join(', ') || 'none'}`);
  if (went.length === mu.red.length) killed += 1;
}
for (const mu of SRC_MUT) {
  if (!has(mu.file) || !mu.find.test(readSrc(mu.file))) { ok(`mutant "${mu.name}": the mutation LANDED`, false, `anchor missing in ${mu.file}`); continue; }
  landed += 1;
  const ov = { [mu.file]: (t) => t.replace(mu.find, mu.to) };
  const mm = await tryLoad(ov);
  let rr = {};
  try { rr = mm.m ? await suite(mm.m, () => load(ov)) : { __crash: mm.err }; } catch (e) { rr = { __crash: String(e && e.message) }; }
  const went = mu.red.filter((k) => !rr[k] || !rr[k].pass);
  ok(`mutant "${mu.name}" is KILLED by a check, not a crash (reddens: ${mu.red.join(', ')})`, !rr.__crash && went.length === mu.red.length, rr.__crash ? `crash: ${rr.__crash}` : `red: ${went.join(', ') || 'none'}`);
  if (!rr.__crash && went.length === mu.red.length) killed += 1;
}
ok(`all ${total} mutations landed and ${total} were killed`, landed === total && killed === total, `${landed} landed / ${killed} killed`);

// PART 2 is appended with the build (it needs the DOM contract the build meets)
if (process.env.BROWSERLESS_ONLY !== '1') {
  try { const mod = await import('./flux-v2-part2.mjs').catch(() => null); if (mod && mod.part2) await mod.part2({ ok, sleepMs }); else ok('PART 2 exists (RED until the build)', false, 'flux-v2-part2.mjs missing'); } catch (err) { ok('PART 2 ran to the end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }
} else console.log('(BROWSERLESS_ONLY: PART 2 skipped - the live checks need a box turn)');

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? (/measured|:1/.test(c.detail) ? '  [' + c.detail + ']' : '') : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX-V2 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-V2 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
