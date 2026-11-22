// THE REORG'S ARBOR WORDS, BROWSERLESS (Fable, Nov 21, 4:58 pm: Arbor's reorg; claude/wrizors/arbor-reorg-spec.md section 1: Page, Drawer, Shelf, Canvas, card, Section, Journal, the Tutor, Grafts, Before you publish; Nick, Nov 20, 4:13 pm: FORMAT, GRAFTS and the cold-blue SHELF).
// No browser, no box. The real overrides/arborReorg.ts is transpiled and run over the real overrides/arbor.ts; each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   EXACT   every string the spec writes out ("Strings that need more than a swap") reads exactly as written there, in Arbor
//   SWAP    the swaps reach the reorg's canonical strings: Doc -> Page, Project -> Drawer, Unfiled -> Shelf, Board -> Canvas, Block -> Card, Part -> Section, Assets -> Grafts, Notebook -> Journal, Consultant -> Tutor (samples, {placeholders} kept)
//   HOLES   a {placeholder} is never swapped or dropped: every string set here has exactly the placeholders its canonical string has (but the spec's own, written out)
//   ONLY    only reorg* keys are set, each one a key the canonical table has, none overwrites a word Arbor already has live (arbor.ts's Canvas words), and the other themes' cells are untouched
//   OFF     with the switch off, or with the redesign off (?arbor2=0), the table IS the live one (the same object): the lexicon reads byte-identically
// SUPERSEDED (Nov 21, 6:54 pm, the Wrizors answered): //   UNSET   what the swaps and the spec do not settle stays unset (it keeps its canonical words, Arbor's own) and is listed in ARBOR_REORG_UNSET for the Wrizors: the five box swatches (five names, Arbor's six) and the lens label
//   ANSWERS the Wrizors' words are set exactly: the box swatches are Arbor's cloths (the five old keys read Olive, Sea, Cold blue, Madder, Honey: never brass for a box), "Your own colour" reads "Custom…", the lens panel is the Tutor's ("Tutor lenses"), the lens box asks "Ask about this Page…"; ARBOR_REORG_UNSET is empty
// Run: node scripts/harness/reorg-arbor-words-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const SRC = rd('store/lexicon/overrides/arborReorg.ts');
const ARBOR = rd('store/lexicon/overrides/arbor.ts');

function run(src, mods) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'exports', 'module', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, m.exports, m);
  return m.exports;
}
const LIVE = run(ARBOR, { '../../theme': {}, '../terms': {}, '../../../arbor2/flag': { arbor2Enabled: () => true } });
const canon = new Map();
for (const f of ['chrome', 'settings', 'decks', 'help']) {
  for (const line of rd(`store/lexicon/canonical/${f}.ts`).split('\n')) {
    const m = /^  (reorg[A-Za-z0-9]*):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`([^`]*)`)\s*,?\s*(?:\/\/.*)?$/.exec(line);
    if (m) canon.set(m[1], (m[2] ?? m[3] ?? m[4]).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\u2026/g, '…'));
  }
}
const holes = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
// the REAL reorg/flag.ts (the switch-over's rule lives there: REORG, REORG_ASKED, REORG_DEFAULT_ON, reorgFor), run with a page load's location: off is ?reorg=0, on is
// ?reorg=1 (Arbor's words come with the ask until its six cells pass; POLISH, the switch-over on train I: a hand stub would test the stub, not the rule)
const FLAG_SRC = rd('reorg/flag.ts');
const realFlag = (reorg) => { const out = ts.transpileModule(FLAG_SRC, TS_OPTS).outputText; const m = { exports: {} };
  new Function('require', 'exports', 'module', 'location', 'window', out)((p) => { throw new Error('flag.ts imports nothing: ' + p); }, m.exports, m, { search: reorg === false ? '?reorg=0' : '?reorg=1' }, undefined);
  return m.exports; };
const load = (src, { reorg = true, arbor2 = true } = {}) => run(src, { '../../theme': {}, '../terms': {}, '../../../reorg/flag': realFlag(reorg), '../../../arbor2/flag': { arbor2Enabled: () => arbor2 }, './arbor': LIVE });

// what the spec writes out exactly (section 1, "Strings that need more than a swap", and the two notes)
const EXACT = {
  reorgBackTabsLabel: 'Plan, grafts and the Tutor',
  reorgDefaults: 'Page defaults · every page',
  reorgNoProjectHeading: 'Writing on the Shelf',
  reorgUnfiledEmpty: 'Nothing on the Shelf.',
  reorgFile: 'Put {name} in a drawer…',
  reorgTopPlaceNoDoc: 'Canvas · no page yet',
  reorgTopPlaceOne: 'Canvas · {name}',
  reorgTopPlaceMany: 'Canvas · {n} pages',
  reorgTopConnect: 'Connect Page',
  reorgTopConnectAnother: 'Connect Page: graft this canvas to another page',
  reorgTopConnectUnborn: 'Add a card first: a canvas is kept once it has one, and then it can join a page.',
  reorgPartsHead: 'Sections ({n})',
  reorgPartN: 'Section {n}',
  reorgTopPartOf: 'Section {n} of {m}',
  reorgPartEnd: 'end of Section {n}',
  reorgSprintLocked: 'In Free Write the Tutor only offers prompts.',
  reorgPubFrozen: 'Format and Ink rest in Publish. Go back to Revise to change the words.',
  reorgNewProject: 'New Drawer',   // section 1's own table: "New Drawer" (Nick, Nov 11)
};
const SAMPLES = {
  reorgBackExport: 'Before you publish', reorgUnfiled: 'Shelf', reorgAllProjects: 'All drawers', reorgPinsLabel: 'Pinned drawers',
  reorgPlanToPart: '→ Section', reorgAssetsHead: 'Grafts ({n})', reorgPartAssetsMany: '{n} grafts', reorgSearchLineAll: 'Every Drawer, the Journal and Shelf',
  reorgPubCopyText: 'Copy text', reorgPubCopyFormatted: 'Copy formatted', reorgDocKindStandard: 'Normal', reorgPubTxt: 'Plain text',
  reorgTagA: 'Olive', reorgTagB: 'Sea', reorgTagC: 'Cold blue', reorgTagD: 'Madder', reorgTagE: 'Honey', reorgTagF: 'Iron',
  reorgAddNewBoard: 'New Canvas', reorgAddNewDoc: 'New Page', reorgBxEmptyMany: '{n} Sections with no words',
};
// SUPERSEDED (Nov 21): const UNSET = ['reorgSwatchPale', 'reorgSwatchGrey', 'reorgSwatchBlue', 'reorgSwatchBrass', 'reorgSwatchOrange', 'reorgLensLabel'];
const ANSWERS = { reorgSwatchPale: 'Olive', reorgSwatchGrey: 'Sea', reorgSwatchBlue: 'Cold blue', reorgSwatchBrass: 'Madder', reorgSwatchOrange: 'Honey', reorgOwnColour: 'Custom…', reorgLensLabel: 'Tutor lenses', reorgLensAskPlaceholder: 'Ask about this Page…' };

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('EXACT', () => {
    const W = load(src).ARBOR_REORG_WORDS;
    const bad = Object.entries(EXACT).filter(([k, v]) => W[k] !== v).map(([k]) => ({ k, got: W[k] }));
    return { pass: bad.length === 0, detail: J(bad) };
  });
  t('SWAP', () => {
    const W = load(src).ARBOR_REORG_WORDS;
    const bad = Object.entries(SAMPLES).filter(([k, v]) => W[k] !== v).map(([k, v]) => ({ k, want: v, got: W[k] }));
    return { pass: bad.length === 0, detail: J(bad) };
  });
  t('HOLES', () => {
    const W = load(src).ARBOR_REORG_WORDS;
    const bad = Object.entries(W).filter(([k, v]) => !canon.has(k) || (holes(v) !== holes(canon.get(k)) && !(k in EXACT))).map(([k, v]) => ({ k, canon: canon.get(k), got: v }));
    return { pass: Object.keys(W).length > 60 && bad.length === 0, detail: J({ n: Object.keys(W).length, bad: bad.slice(0, 5) }) };
  });
  t('ONLY', () => {
    const E = load(src), W = E.ARBOR_REORG_WORDS, live = (LIVE.ARBOR_OVERRIDES.plateau) || {};
    const bad = Object.keys(W).filter((k) => !/^reorg/.test(k) || !canon.has(k) || k in live);
    const merged = E.ARBOR_REORG_OVERRIDES.plateau;
    const kept = Object.keys(live).every((k) => merged[k] === live[k]);
    const others = Object.keys(E.ARBOR_REORG_OVERRIDES).sort().join(',') === 'plateau';
    return { pass: bad.length === 0 && kept && others, detail: J({ bad, kept, others }) };
  });
  t('OFF', () => {
    const off = load(src, { reorg: false }), noRedesign = load(src, { arbor2: false });
    return { pass: off.ARBOR_REORG_OVERRIDES === LIVE.ARBOR_OVERRIDES && noRedesign.ARBOR_REORG_OVERRIDES === LIVE.ARBOR_OVERRIDES, detail: 'the live table itself' };
  });
  // SUPERSEDED (Nov 21, the Wrizors answered): the original UNSET check, kept verbatim:
  // t('UNSET', () => {
  // const E = load(src), W = E.ARBOR_REORG_WORDS;
  // const left = UNSET.filter((k) => k in W);
  // const listed = UNSET.every((k) => (E.ARBOR_REORG_UNSET || []).some((l) => l.startsWith(k)));
  // return { pass: left.length === 0 && listed && UNSET.every((k) => canon.has(k)), detail: J({ left, listed }) };
  // });
  t('ANSWERS', () => {
    const E = load(src), W = E.ARBOR_REORG_WORDS;
    const bad = Object.entries(ANSWERS).filter(([k, v]) => W[k] !== v).map(([k, v]) => ({ k, want: v, got: W[k] }));
    const brass = ['reorgSwatchBrass'].filter((k) => /brass/i.test(W[k] || ''));
    return { pass: bad.length === 0 && brass.length === 0 && Array.isArray(E.ARBOR_REORG_UNSET) && E.ARBOR_REORG_UNSET.length === 0, detail: J({ bad, brass, unset: E.ARBOR_REORG_UNSET }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
for (const k of ['EXACT', 'SWAP', 'HOLES', 'ONLY', 'OFF', 'ANSWERS']) ok(`${k} on the real arborReorg.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'arborReorg.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['the spec string for the Back tabs is reworded', 'EXACT', (t) => t.replace("reorgBackTabsLabel: 'Plan, grafts and the Tutor'", () => "reorgBackTabsLabel: 'Plan, grafts and feedback'")],
  ['the Part word is not swapped', 'SWAP', (t) => t.replace("reorgPlanToPart: '→ Section'", () => "reorgPlanToPart: '→ Part'")],
  ['a placeholder is swapped with the word', 'HOLES', (t) => t.replace("reorgAssetsHead: 'Grafts ({n})'", () => "reorgAssetsHead: 'Grafts ({graft})'")],
  ['a key that is not a reorg key is set', 'ONLY', (t) => t.replace('export const ARBOR_REORG_WORDS = {\n', () => "export const ARBOR_REORG_WORDS = {\n  railTemplates: 'Sets',\n")],
  // SUPERSEDED (the switch-over on train I, Fable, Nov 21, 11:20 pm: arborReorg.ts reads reorgFor('plateau'), not the bare REORG; POLISH). The originals, verbatim
  // (their target is gone, so they no longer land):
  // ['the switch is ignored', 'OFF', (t) => t.replace('REORG && arbor2Enabled()', () => 'arbor2Enabled()')],
  // ['the redesign flag is ignored', 'OFF', (t) => t.replace('REORG && arbor2Enabled()', () => 'REORG')],
  // [successors] the same two mutants aimed at the gate as it now reads
  ['the reorgFor gate is ignored', 'OFF', (t) => t.replace("reorgFor('plateau') && arbor2Enabled()", () => 'arbor2Enabled()')],
  ['the redesign flag is ignored [switch-over successor]', 'OFF', (t) => t.replace("reorgFor('plateau') && arbor2Enabled()", () => "reorgFor('plateau')")],
  // SUPERSEDED (Nov 21): ['a box swatch is guessed at', 'UNSET', (t) => t.replace('export const ARBOR_REORG_WORDS = {\n', () => "export const ARBOR_REORG_WORDS = {\n  reorgSwatchBrass: 'Madder',\n")],
  ['a box swatch is still named for brass', 'ANSWERS', (t) => t.replace("reorgSwatchBrass: 'Madder'", () => "reorgSwatchBrass: 'Brass'")],
  ['the own-colour word is left as it was', 'ANSWERS', (t) => t.replace("reorgOwnColour: 'Custom\u2026'", () => "reorgOwnColour: 'Your own colour'")],
  ['the lens panel is still called Feedback', 'ANSWERS', (t) => t.replace("reorgLensLabel: 'Tutor lenses'", () => "reorgLensLabel: 'Feedback lenses'")],
];
for (const [name, key, fn] of MUT) {
  const after = SRC ? fn(SRC) : SRC;
  const landed = !!SRC && after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

// the lexicon reads the table: the second spread (machinaAndArbor.ts) lays Arbor's reorg words over its Canvas words
const MA = rd('store/lexicon/overrides/machinaAndArbor.ts');
ok("WIRED machinaAndArbor.ts takes Arbor's table from './arborReorg'", /from '\.\/arborReorg'/.test(MA) && /ARBOR_REORG_OVERRIDES/.test(MA), '');

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-ARBOR-WORDS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ARBOR-WORDS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
