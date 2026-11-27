// VISUAL 1a.3 - A BOARD'S DRAWING IS NEVER SILENTLY DROPPED OR MISNAMED, BROWSERLESS. A Board can now carry ink in its row's own `strokes`. The real pageExport.ts is transpiled and run with its
// imports stubbed; the drawer table (store/drawerSet.ts), the Front menu's tabs (reorg/frontTabs.ts) and Arbor's regrouping (arbor2/drawerTabs.ts) are run for real; the three lists that name an
// untitled row are read at the source.
//   EXPORT  a Board with ink says so in the export (.md and .txt), beside its cards or alone; a Board without ink exports byte for byte as before
//   TABLE   BUILD and EDIT show the ink zone on the Front menu's INK tab (reorg/frontTabs.ts), a Board on its own INK tab (store/drawerSet.ts); the classic table gives a Draft no ink
//   TABS    the Front menu offers INK only where the host passes an instrument; Arbor's union still equals the table (nothing lost)
//   NAMES   an untitled Board with ink is still named an untitled Board (never "Sketch") in the Docs, Projects and Unfiled lists
// Each law has a mutant that must land and turn it red.
// Run: node scripts/harness/visual-1a3-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const read = (rel) => lf(fs.readFileSync(new URL(`../../src/${rel}`, import.meta.url), 'utf8'));
const J = (v) => JSON.stringify(v);
function load(src, stubs = {}) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => stubs[p] ?? new Proxy({}, { get: () => () => undefined }), m, m.exports);
  return m.exports;
}

const EXPORT = read('store/pageExport.ts');
const SET = read('store/drawerSet.ts');
const FRONT = read('reorg/frontTabs.ts');
const ARBOR = read('arbor2/drawerTabs.ts');
const PANELS = ['reorg/panels/DocsPanel.tsx', 'reorg/panels/ProjectListPanel.tsx', 'reorg/panels/UnfiledPanel.tsx'];

const board = (extra = {}) => ({ id: 'b', pageType: 'board', text: 'Wall', createdAt: '', updatedAt: '', boxes: [{ id: 'c', kind: 'text', x: 0, y: 0, w: 1, h: 1, z: 1, text: 'One card' }], ...extra });
const INK = [{ points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }] }];

function exportLaw(src) {
  const E = load(src, { './entryText': { firstLine: (s) => String(s).split('\n')[0] || 'Untitled' }, './boxTombstones': { liveBoxes: (b) => b ?? [] }, './draftFormat': { stripMarkdownConventions: (s) => s } });
  const plain = E.pageBodyFormatted(board()), inked = E.pageBodyFormatted(board({ strokes: INK })), alone = E.pageBodyPlain(board({ boxes: [], strokes: INK })), none = E.pageBodyFormatted(board({ boxes: [], strokes: [] }));
  return { pass: plain === '## One card\n\nOne card' && inked.startsWith(plain) && /Ink/.test(inked) && /not exported as text/.test(inked) && /not exported as text/.test(alone) && !/No cards/.test(alone) && none === '(No cards on this board.)', detail: J({ plain, inked, alone, none }) };
}
function tableLaw(src, frontSrc = FRONT) {
  const m = load(src);
  const F = load(frontSrc, { '../store/drawerSet': m });
  const got = {};
  for (const k of ['freewrite', 'draft', 'revise', 'board']) got[k] = [m.sectionsFor(k, 'ink'), m.sectionAllowed(k, 'text', 'ink')];
  const front = ['draft', 'revise'].map((k) => [F.frontSectionAllowed(k, 'ink', 'ink'), F.frontSectionAllowed(k, 'ink', 'typeface'), F.frontSectionAllowed(k, 'text', 'ink')]);
  return { pass: J(got) === J({ freewrite: [['ink', 'forwardLock', 'capture'], false], draft: [[], false], revise: [[], false], board: [['ink'], false] }) && J(front) === J([[true, false, false], [true, false, false]]) && m.leftTabsFor('draft', true).length === 0, detail: J({ got, front }) };
}
function tabsLaw(frontSrc, arborSrc) {
  const set = load(SET);
  const F = load(frontSrc, { '../store/drawerSet': set });
  const A = load(arborSrc);
  const front = { draft: F.frontTabsFor('draft', true), draftNo: F.frontTabsFor('draft', false), revise: F.frontTabsFor('revise', true), board: F.frontTabsFor('board', true) };
  const arbor = { board: A.arborToolTabs('board', true), boardNo: A.arborToolTabs('board', false), draft: A.arborToolTabs('draft', false) };
  const table = (k) => [...new Set([...set.sectionsFor(k, 'text'), ...set.sectionsFor(k, 'ink')])].sort();
  const lost = ['freewrite', 'draft', 'revise', 'board'].filter((k) => J([...A.arborSectionsUnion(k)].sort()) !== J(table(k)));
  return { pass: J(front) === J({ draft: ['text', 'ink', 'parts'], draftNo: ['text', 'parts'], revise: ['text', 'ink', 'parts'], board: [] }) && J(arbor) === J({ board: ['format', 'ink'], boardNo: ['format'], draft: ['format', 'presets'] }) && lost.length === 0, detail: J({ front, arbor, lost }) };
}
function namesLaw(sources) {
  // the row's name: ink makes an untitled PAGE a "Sketch", never an untitled Board
  const bad = sources.filter(([, s]) => !/e\.pageType !== 'board' && \(e\.strokes\?\.length \?\? 0\) > 0 \? t\('reorgSketch'\)/.test(s)).map(([f]) => f);
  return { pass: bad.length === 0, detail: J(bad) };
}

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const run = (fn) => { try { return fn(); } catch (e) { return { pass: false, detail: String(e && e.message || e) }; } };
const panels = PANELS.map((f) => [f, read(f)]);

const real = { EXPORT: run(() => exportLaw(EXPORT)), TABLE: run(() => tableLaw(SET)), TABS: run(() => tabsLaw(FRONT, ARBOR)), NAMES: run(() => namesLaw(panels)) };
for (const [k, v] of Object.entries(real)) ok(k, v.pass, v.detail);

const mutant = (key, src, from, to, law) => { const landed = src.includes(from); ok(`mutant ${key}`, landed && run(() => law(src.replace(from, to))).pass === false, landed ? 'did not turn red' : 'did not land'); };
mutant('EXPORT', EXPORT, 'if (entry.strokes && entry.strokes.length > 0) parts.push', 'if (false) parts.push', exportLaw);
mutant('TABLE', SET, "board: { text: ['boardTools'], ink: ['ink'] }", "board: { text: ['boardTools'], ink: [] }", tableLaw);
mutant('TABS', ARBOR, "board: { format: ['boardTools'], ink: ['ink'] }", "board: { format: ['boardTools'] }", (s) => tabsLaw(FRONT, s));
mutant('NAMES', panels[0][1], "e.pageType !== 'board' && ", '', (s) => namesLaw([[PANELS[0], s]]));

const pass = checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 400)}`);
console.log(pass ? `\nVISUAL 1A3 UNIT: PASS (${checks.length})` : `\nVISUAL 1A3 UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
