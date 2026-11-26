// COMPARE STRUCTURES (PRESETS-B item 18, Nov 25), BROWSERLESS. No browser, no box turn: the real structureCompare.ts and planPresets.ts are transpiled and run (with the canonical words as the lexicon), and the panel, the Presets list and the words are read as text.
// Each law is given a mutant that must LAND and turn its own check red.
//   SHAPE    a structure's rows, Acts and steps: Three-Act 12 rows / 3 Acts, the Hero's Journey 15 / 3, every flat one 0 Acts; rows = Acts + steps
//   SHARED   the headings two structures have in common are matched on the words a writer reads (case and spacing ignored), each once, in the first's order; a structure shares every heading with itself
//   PAIR     it opens on Three-Act and the Hero's Journey (PRESETS-B's own default); where either is gone it opens on the first two; an unknown id gives the first structure, never an empty column
//   VIEW     the panel writes nothing: it imports no store, calls `onPick` only from the "Use" button, and Esc / Close call `onClose` only
//   MENU     "Compare Structures" is the LAST row of the Presets list, ahead of nothing; opening it takes the list's place; picking from it closes both and loads through the list's own `onPick`
//   WORDS    every word is a lexicon key, in the canonical words and the DeskTermId union, and the block says PROPOSED; a shared heading is marked by weight and underline, not colour alone
// Run: node scripts/harness/reorg-compare-structures-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const J = (v) => JSON.stringify(v);
function load(src, deps = {}) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { if (deps[p]) return deps[p]; throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const SRC = {
  cmp: rd('reorg/backMenu/structureCompare.ts'), plan: rd('reorg/backMenu/planPresets.ts'), panel: rd('reorg/backMenu/CompareStructures.tsx'), menu: rd('reorg/backMenu/PresetsMenu.tsx'),
  chrome: rd('store/lexicon/canonical/chrome.ts'), decks: rd('store/lexicon/canonical/decks.ts'), terms: rd('store/lexicon/terms.ts'),
};
const KEYS = ['reorgCompare', 'reorgCompareFirst', 'reorgCompareSecond', 'reorgCompareRowsOne', 'reorgCompareRowsMany', 'reorgCompareGroupsOne', 'reorgCompareGroupsMany', 'reorgCompareFlat', 'reorgCompareUse', 'reorgCompareShared', 'reorgCompareSharedNone', 'reorgCompareClose'];
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 200) }; } };
  const plan = load(src.plan);
  const words = { ...load(src.chrome).CANONICAL_CHROME, ...load(src.decks).CANONICAL_DECKS };
  const T = (k) => words[k] ?? k;
  const cmp = () => load(src.cmp, { './planPresets': plan });
  const byId = (id) => plan.PLAN_PRESETS.find((p) => p.id === id);

  t('SHAPE', () => {
    const c = cmp();
    const three = c.shapeOf(byId('three')), hero = c.shapeOf(byId('hero')), circle = c.shapeOf(byId('circle'));
    const flat = plan.PLAN_PRESETS.filter((p) => p.rows.every((r) => r.depth === 0));
    const sums = plan.PLAN_PRESETS.every((p) => { const s = c.shapeOf(p); return s.rows === p.rows.length && s.rows === s.groups + s.steps; });
    const flatOk = flat.length >= 10 && flat.every((p) => c.shapeOf(p).groups === 0);
    return { pass: three.rows === 12 && three.groups === 3 && hero.rows === 15 && hero.groups === 3 && circle.groups === 0 && sums && flatOk, detail: J({ three, hero, circle, sums, flatOk }) };
  });
  t('SHARED', () => {
    const c = cmp();
    const a = { rows: [{ depth: 0, title: 'x1' }, { depth: 0, title: 'x2' }, { depth: 0, title: 'x3' }, { depth: 0, title: 'x1' }] };
    const b = { rows: [{ depth: 0, title: 'y1' }, { depth: 0, title: 'y2' }] };
    const w = { x1: ' Climax ', x2: 'Setup', x3: 'The  End', y1: 'climax', y2: 'the end' };
    const got = c.sharedTitles(a, b, (k) => w[k]);
    const self = c.sharedTitles(byId('seven'), byId('seven'), T);
    return { pass: J(got) === J([' Climax ', 'The  End']) && self.length === byId('seven').rows.length, detail: J({ got, self: self.length }) };
  });
  t('PAIR', () => {
    const c = cmp();
    const [a, b] = c.openingPair();
    const two = c.openingPair([byId('circle'), byId('seven'), byId('imrad')]);
    const one = c.openingPair([byId('circle')]);
    return { pass: a.id === 'three' && b.id === 'hero' && two[0].id === 'circle' && two[1].id === 'seven' && one[1].id === 'circle' && c.structureFor('nope').id === plan.PLAN_PRESETS[0].id && c.structureFor('imrad').id === 'imrad', detail: J({ a: a.id, b: b.id, two: two.map((x) => x.id) }) };
  });
  t('VIEW', () => {
    const p = noComments(src.panel);
    const imp = [...src.panel.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
    const noStore = !imp.some((i) => /persistence|store\/(?!lexicon)/.test(i)) && !/localStorage|sessionStorage|saveBoardBoxes|saveJournal|presetBoxes/.test(p);
    const pickOnlyUse = (p.match(/onPick\(/g) ?? []).length === 1 && /data-compare-use=\{i\} onClick=\{\(\) => onPick\(p\)\}/.test(p);
    const closeOnly = /e\.key === 'Escape'[^}]*onClose\(\)/.test(p) && /data-compare-close="" onClick=\{onClose\}/.test(p);
    return { pass: noStore && pickOnlyUse && closeOnly, detail: J({ imp, noStore, pickOnlyUse, closeOnly }) };
  });
  t('MENU', () => {
    const m = noComments(src.menu);
    const last = m.indexOf('data-plan-compare') > m.indexOf('STRUCTURE_NOTES[p.id]') && m.indexOf('data-plan-compare') < m.indexOf('</ul>') && !/<li/.test(m.slice(m.indexOf('data-plan-compare'), m.indexOf('</ul>')));
    const replaces = /open && comparing &&/.test(m) && /open && !comparing &&/.test(m);
    const viaPick = /onPick=\{\(p\) => \{ setComparing\(false\); setOpen\(false\); onPick\(p\); \}\}/.test(m);
    return { pass: last && replaces && viaPick, detail: J({ last, replaces, viaPick }) };
  });
  t('WORDS', () => {
    const missing = KEYS.filter((k) => typeof words[k] !== 'string' || !src.terms.includes("'" + k + "'"));
    const used = KEYS.filter((k) => (src.panel + src.menu).includes("'" + k + "'"));
    const proposed = /COMPARE STRUCTURES[^\r\n]*PROPOSED/.test(src.chrome);
    const strings = [...src.panel.matchAll(/>([A-Z][A-Za-z ]{4,})</g)].map((m) => m[1]);
    const css = rd('styles/23-reorg-compare.css');
    const marked = /\[data-shared='true'\]\{[^}]*font-weight:600[^}]*text-decoration:underline/.test(css);
    return { pass: missing.length === 0 && used.length === KEYS.length && proposed && strings.length === 0 && marked, detail: J({ missing, used: used.length, proposed, strings, marked }) };
  });
  return R;
}

const sub = (txt, from, to) => { const out = txt.split(from).join(to); return out === txt ? null : out; };
const MUTANTS = [
  ['an Act is counted as a step', 'SHAPE', (s) => ({ ...s, cmp: sub(s.cmp, 'steps: p.rows.length - groups', 'steps: p.rows.length') })],
  ['a flat structure is given an Act', 'SHAPE', (s) => ({ ...s, cmp: sub(s.cmp, "r.depth === 0 && p.rows[i + 1]?.depth === 1", "r.depth === 0") })],
  ['case matters when two headings are matched', 'SHARED', (s) => ({ ...s, cmp: sub(s.cmp, 's.trim().toLowerCase().replace(/\\s+/g, \' \')', 's.trim()') })],
  ['a shared heading is listed twice', 'SHARED', (s) => ({ ...s, cmp: sub(s.cmp, 'if (inB.has(k) && !seen.has(k))', 'if (inB.has(k))') })],
  ['it opens on the first two structures', 'PAIR', (s) => ({ ...s, cmp: sub(s.cmp, "export const DEFAULT_PAIR: readonly [PlanPresetId, PlanPresetId] = ['three', 'hero'];", "export const DEFAULT_PAIR: readonly [PlanPresetId, PlanPresetId] = ['stasis', 'hero'];") })],
  ['an unknown structure leaves a column empty', 'PAIR', (s) => ({ ...s, cmp: sub(s.cmp, 'return list.find((p) => p.id === id) ?? list[0];', 'return list.find((p) => p.id === id) as PlanPreset;') })],
  ['the panel writes the Plan itself', 'VIEW', (s) => ({ ...s, panel: sub(s.panel, "import { STRUCTURE_NOTES } from '../presetNotes';", "import { STRUCTURE_NOTES } from '../presetNotes';\nimport { saveBoardBoxes } from '../../store/persistence';") })],
  ['choosing a structure in a column loads it', 'VIEW', (s) => ({ ...s, panel: sub(s.panel, 'onChange={(e) => set(i, e.target.value)}', 'onChange={(e) => { set(i, e.target.value); onPick(structureFor(e.target.value)); }}') })],
  ['Compare Structures is the first row of the list', 'MENU', (s) => ({ ...s, menu: sub(s.menu, '{PLAN_PRESETS.map((p) => {', '<li><button type="button" data-plan-compare="" onClick={() => setComparing(true)}>x</button></li>{PLAN_PRESETS.map((p) => {').replace(/<li><button type="button" ref=\{compareBtn\}[^\n]*<\/li>\n/, '') })],
  ['the compare panel is drawn under the list, not in its place', 'MENU', (s) => ({ ...s, menu: sub(s.menu, 'open && !comparing &&', 'open &&') })],
  ['a word is a string in the panel', 'WORDS', (s) => ({ ...s, panel: sub(s.panel, "{t('reorgCompareClose')}", 'Back to the list') })],
];

const results = [];
const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
for (const [name, v] of Object.entries(suite(SRC))) check(name, v.pass, v.detail);
for (const [label, expect, mut] of MUTANTS) {
  const m = mut(SRC);
  const landed = Object.values(m).every((x) => x !== null && x !== undefined);
  const R = landed ? suite(m) : {};
  const red = Object.entries(R).filter(([, v]) => !v.pass).map(([k]) => k);
  check('MUTANT: ' + label, landed && red.includes(expect), J({ landed, red }));
}
let fail = 0;
for (const c of results) { if (!c.pass) fail++; console.log((c.pass ? 'PASS  ' : 'FAIL  ') + c.name + (c.pass ? '' : '   ' + c.detail)); }
console.log(fail ? `\nREORG-COMPARE-STRUCTURES-UNIT VERIFY: FAIL - ${fail}/${results.length} failed` : `\nREORG-COMPARE-STRUCTURES-UNIT VERIFY: PASS (${results.length} checks)`);
process.exit(fail ? 1 : 0);
