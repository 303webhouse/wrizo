// THE REORG'S FLUX WORDS, BROWSERLESS (Fable, Nov 21, 3:20 pm: "overrides/fluxReorg.ts behind the switch from the spec's section 1; uncertain keys to the Wrizors"; claude/wrizors/flux-reorg-spec.md: Doc, Drive, Orphans, Circuit,
// Node, Track, Spine, Inputs, the Operator, Log, Clone, Before uplink; Nick, Nov 20, 4:43 pm: SPINE for PLAN). No browser, no box. The real overrides/fluxReorg.ts is transpiled and run over the real overrides/flux.ts; each law is given a mutant
// (a text rewrite of the source) that must LAND and turn its own check red.
//   EXACT   every string the spec writes out ("Strings that need more than a swap") reads exactly as written there, in Flux
//   SWAP    the swaps reach the reorg's canonical strings: Plan -> Spine, Project -> Drive, Unfiled -> Orphans, Board -> Circuit, Block -> Node, Part -> Track, Assets -> Inputs, Notebook -> Log (samples, with their {placeholders} kept)
//   HOLES   a {placeholder} is never swapped or dropped: every string set here has exactly the placeholders its canonical string has
//   ONLY    only reorg* keys are set, each one a key the canonical table has, and none overwrites a word Flux already has live
//   OFF     with the switch off the table IS the live one (the same object): the lexicon reads byte-identically
// SUPERSEDED (Nov 21, the Wrizors answered the six open strings), kept verbatim:
//   UNSET   the strings the swaps do not settle stay unset (they keep their canonical words) and are listed in FLUX_REORG_UNSET for the Wrizors
//   ANSWERS the Wrizors' words are set exactly: Page Setup = Frame, the Typewriter = Wire In and its message in a split, Progress = Meter, the lens box asks "Query this doc…"
//   KEPT    the two they keep (the lens names' panel label, and the "Research paper" preset) stay at their canonical words and are listed in FLUX_REORG_KEPT
//   CASE    Flux's own case: buttons and lines in sentence case ("New circuit", "Add an input", "Plain text"), Flux's live Doc and Docs keep their capital
// Run: node scripts/harness/reorg-flux-words-unit.mjs   (from apps/desktop; browserless: needs no box turn)
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
const SRC = rd('store/lexicon/overrides/fluxReorg.ts');
const FLUX = rd('store/lexicon/overrides/flux.ts');

function run(src, mods) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'exports', 'module', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, m.exports, m);
  return m.exports;
}
const LIVE = run(FLUX, {});
// the reorg's canonical strings, read as the lexicon's own source writes them
const canon = new Map();
for (const f of ['chrome', 'settings', 'decks', 'help']) {
  for (const line of rd(`store/lexicon/canonical/${f}.ts`).split('\n')) {
    const m = /^  (reorg[A-Za-z0-9]*):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`([^`]*)`)\s*,?\s*(?:\/\/.*)?$/.exec(line);
    if (m) canon.set(m[1], (m[2] ?? m[3] ?? m[4]).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\u2026/g, '…'));
  }
}
const holes = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
// the REAL reorg/flag.ts (the switch-over's rule lives there: REORG, REORG_ASKED, REORG_DEFAULT_ON, reorgFor), run with a page load's location: off is
// ?reorg=0, asked is ?reorg=1, the default is no query (POLISH, the bare-switch census, Nov 21: a hand stub would test the stub, not the rule)
const FLAG_SRC = rd('reorg/flag.ts');
const realFlag = (reorg, asked) => { const out = ts.transpileModule(FLAG_SRC, TS_OPTS).outputText; const m = { exports: {} };
  new Function('require', 'exports', 'module', 'location', 'window', out)((p) => { throw new Error('flag.ts imports nothing: ' + p); }, m.exports, m, { search: reorg === false ? '?reorg=0' : asked ? '?reorg=1' : '' }, undefined);
  return m.exports; };
const load = (src, reorg = true) => run(src, { '../../theme': {}, '../terms': {}, '../../../reorg/flag': realFlag(reorg, reorg), './flux': { FLUX_OVERRIDES: LIVE.FLUX_OVERRIDES } });   // on = asked: Flux's words come with the ask

// what the spec writes out exactly (section 1, "Strings that need more than a swap", and the two notes)
const EXACT = {
  reorgBackTabsLabel: 'Spine, inputs and the Operator',
  reorgNoProjectHeading: 'Docs in Orphans',
  reorgUnfiledEmpty: 'No orphans.',
  reorgFile: 'File {name} to a drive…',
  reorgDefaults: 'Doc defaults · every doc',
  reorgTopPlaceNoDoc: 'Circuit · no doc yet',
  reorgTopPlaceOne: 'Circuit · {name}',
  reorgTopPlaceMany: 'Circuit · {n} docs',
  reorgTopConnectAnother: 'Connect Docs: connect this circuit to another doc',
  reorgTopConnectUnborn: 'Add a node first: a circuit is kept once it has one, and then it can join a doc.',
  reorgPartsHead: 'Tracks ({n})',
  reorgPartN: 'Track {n}',
  reorgTopPartOf: 'TRK {n}/{m}',
  reorgPartEnd: 'end of Track {n}',
  reorgUntitled: 'Unnamed',
  reorgSprintLocked: 'Wired in: the Operator sends prompts only.',
  reorgPubFrozen: 'Markup and Ink lock at Uplink. Patch to change the words.',
};
const SAMPLES = {
  reorgBackPlan: 'Spine', reorgBackExport: 'Before uplink', reorgUnfiled: 'Orphans', reorgNewProject: 'New drive', reorgAllProjects: 'All drives',
  reorgPlanToPart: '→ Track', reorgAssetsHead: 'Inputs ({n})', reorgPartAssetsMany: '{n} inputs', // SUPERSEDED (Nov 21, Flux's own case: sentence case for lines): reorgSearchLineAll: 'Every Drive, the Log and Orphans',
  reorgSearchLineAll: 'Every drive, the log and orphans',
  reorgPubCopyText: 'Clone text', reorgPubCopyFormatted: 'Clone formatted', reorgTopConnect: 'Connect Docs', reorgDocKindStandard: 'Plain', reorgDocKindScreenplay: 'Script',
  reorgSpecialTitle: 'Cover', reorgSpecialBibliography: 'Sources', reorgTagA: 'Cyan', reorgTagB: 'Lime', reorgTagC: 'Pink', reorgTagD: 'Ice', reorgTagE: 'Teal', reorgTagF: 'Deep cyan',
};
// SUPERSEDED (Nov 21): const UNSET = ['reorgLensLabel', 'reorgDocPageSetup', 'reorgSplitNoTypewriter', 'reorgKindResearch', 'reorgTypewriter', 'reorgProgressBars'];
const KEPT = ['reorgLensLabel', 'reorgKindResearch'];
const ANSWERS = { reorgDocPageSetup: 'Frame', reorgTypewriter: 'Wire In', reorgSplitNoTypewriter: 'Wire In is off in a split: unplug first.', reorgProgressBars: 'Meter', reorgLensAskPlaceholder: 'Query this doc…' };
const CASE = { reorgAddNewBoard: 'New circuit', reorgAddExistingBoard: 'Existing circuit', reorgAddSearchBoards: 'Find a circuit', reorgAddNewDoc: 'New Doc', reorgAddSearchDocs: 'Find a Doc', reorgAssetsAdd: 'Add an input', reorgAssetsAddTo: 'Add an input to {part}', reorgPubTxt: 'Plain text', reorgPlanOpenPart: 'Open track', reorgSprintAnother: 'Another prompt', reorgDocStyleGuide: 'Style guide', reorgSearchReachProject: 'This drive', reorgPartPrevTo: 'Previous track: {part}', reorgSearchLineProject: 'Its Docs and circuits' };

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('EXACT', () => {
    const W = load(src).FLUX_REORG_WORDS;
    const bad = Object.entries(EXACT).filter(([k, v]) => W[k] !== v).map(([k]) => ({ k, got: W[k] }));
    return { pass: bad.length === 0, detail: J(bad) };
  });
  t('SWAP', () => {
    const W = load(src).FLUX_REORG_WORDS;
    const bad = Object.entries(SAMPLES).filter(([k, v]) => W[k] !== v).map(([k, v]) => ({ k, want: v, got: W[k] }));
    return { pass: bad.length === 0, detail: J(bad) };
  });
  t('HOLES', () => {
    const W = load(src).FLUX_REORG_WORDS;
    const bad = Object.entries(W).filter(([k, v]) => !canon.has(k) || (holes(v) !== holes(canon.get(k)) && !(k in EXACT))).map(([k, v]) => ({ k, canon: canon.get(k), got: v }));
    return { pass: Object.keys(W).length > 80 && bad.length === 0, detail: J({ n: Object.keys(W).length, bad: bad.slice(0, 5) }) };
  });
  t('ONLY', () => {
    const E = load(src), W = E.FLUX_REORG_WORDS, live = (LIVE.FLUX_OVERRIDES.flux) || {};
    const bad = Object.keys(W).filter((k) => !/^reorg/.test(k) || !canon.has(k) || k in live);
    const merged = E.FLUX_OVERRIDES.flux;
    const kept = Object.keys(live).every((k) => merged[k] === live[k]);
    const others = Object.keys(E.FLUX_OVERRIDES).sort().join(',') === Object.keys(LIVE.FLUX_OVERRIDES).sort().join(',');
    return { pass: bad.length === 0 && kept && others, detail: J({ bad, kept, others }) };
  });
  t('OFF', () => {
    const E = load(src, false);
    return { pass: E.FLUX_OVERRIDES === LIVE.FLUX_OVERRIDES, detail: 'the live table itself' };
  });
  // SUPERSEDED (Nov 21, the Wrizors answered): the original UNSET check, kept verbatim:
  // t('UNSET', () => {
  // const E = load(src), W = E.FLUX_REORG_WORDS;
  // const left = UNSET.filter((k) => k in W);
  // const listed = UNSET.every((k) => (E.FLUX_REORG_UNSET || []).some((l) => l.startsWith(k)));
  // return { pass: left.length === 0 && listed && UNSET.every((k) => canon.has(k)), detail: J({ left, listed }) };
  // });
  t('ANSWERS', () => {
    const W = load(src).FLUX_REORG_WORDS;
    const bad = Object.entries(ANSWERS).filter(([k, v]) => W[k] !== v).map(([k, v]) => ({ k, want: v, got: W[k] }));
    return { pass: bad.length === 0, detail: J(bad) };
  });
  t('KEPT', () => {
    const E = load(src), W = E.FLUX_REORG_WORDS;
    const left = KEPT.filter((k) => k in W);
    const listed = KEPT.every((k) => (E.FLUX_REORG_KEPT || []).some((l) => l.startsWith(k)));
    return { pass: left.length === 0 && listed && KEPT.every((k) => canon.has(k)), detail: J({ left, listed }) };
  });
  t('CASE', () => {
    const W = load(src).FLUX_REORG_WORDS;
    const bad = Object.entries(CASE).filter(([k, v]) => (W[k] ?? canon.get(k)) !== v).map(([k, v]) => ({ k, want: v, got: W[k] ?? canon.get(k) }));
    return { pass: bad.length === 0, detail: J(bad) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
for (const k of ['EXACT', 'SWAP', 'HOLES', 'ONLY', 'OFF', 'ANSWERS', 'KEPT', 'CASE']) ok(`${k} on the real fluxReorg.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'fluxReorg.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['the spec string for the Back tabs is reworded', 'EXACT', (t) => t.replace("reorgBackTabsLabel: 'Spine, inputs and the Operator'", () => "reorgBackTabsLabel: 'Spine, inputs and feedback'")],
  ['the Plan word is not swapped', 'SWAP', (t) => t.replace("reorgBackPlan: 'Spine'", () => "reorgBackPlan: 'Plan'")],
  ['a placeholder is swapped with the word', 'HOLES', (t) => t.replace("reorgPlanToPart: '\u2192 Track'", () => "reorgPlanToPart: '\u2192 Track {part}'")],
  ['a key that is not a reorg key is set', 'ONLY', (t) => t.replace('export const FLUX_REORG_WORDS = {\n', () => "export const FLUX_REORG_WORDS = {\n  railTemplates: 'Sets',\n")],
  // SUPERSEDED (the switch-over, Fable, Nov 21, 9:40 pm: the reorg is on by default in Machina ONLY, so Flux's reorg words come with the ASK, REORG_ASKED, not the
  // default; POLISH, reorg-switchover). The original, verbatim (its target line is gone, so it no longer lands):
  // ['the switch is ignored', 'OFF', (t) => t.replace('  REORG ? { flux:', () => '  true ? { flux:')],
  // [successor] the same mutant aimed at the ask: ignoring it must turn OFF red
  // SUPERSEDED (the bare-switch census, Fable, Nov 21, 11:20 pm: Flux's words follow reorgFor('flux'), which moved into reorg/flag.ts; POLISH). The successor of the
  // switch-over park above, verbatim (its target line is gone, so it no longer lands):
  // ['the ask is ignored', 'OFF', (t) => t.replace('  REORG_ASKED ? { flux:', () => '  true ? { flux:')],
  // [successor 2] the same mutant aimed at reorgFor('flux'): ignoring it must turn OFF red
  ['the reorgFor gate is ignored', 'OFF', (t) => t.replace("  reorgFor('flux') ? { flux:", () => '  true ? { flux:')],
  // SUPERSEDED (Nov 21): ['a doubtful string is guessed at', 'UNSET', (t) => t.replace('export const FLUX_REORG_WORDS = {\n', () => "export const FLUX_REORG_WORDS = {\n  reorgTypewriter: 'Typewriter',\n")],
  ['the Typewriter is named for what it was', 'ANSWERS', (t) => t.replace("reorgTypewriter: 'Wire In'", () => "reorgTypewriter: 'Typewriter'")],
  ['a kept string is changed', 'KEPT', (t) => t.replace('export const FLUX_REORG_WORDS = {\n', () => "export const FLUX_REORG_WORDS = {\n  reorgKindResearch: 'Intel paper',\n")],
  ['a button keeps the Title Case it had', 'CASE', (t) => t.replace("reorgAddNewBoard: 'New circuit'", () => "reorgAddNewBoard: 'New Circuit'")],
];
for (const [name, key, fn] of MUT) {
  const after = SRC ? fn(SRC) : SRC;
  const landed = !!SRC && after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

// the lexicon reads the table: deskLexicon.ts takes FLUX_OVERRIDES from fluxReorg, not from flux
const DL = rd('store/deskLexicon.ts');
ok("WIRED deskLexicon.ts takes FLUX_OVERRIDES from './lexicon/overrides/fluxReorg'", /import \{ FLUX_OVERRIDES \} from '\.\/lexicon\/overrides\/fluxReorg';/.test(DL), '');

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FLUX-WORDS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FLUX-WORDS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
