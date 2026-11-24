// PRESETS-B item 5, BROWSERLESS: the search words (Fable, Nov 23, 11:23 pm: "items 4 and 5 from sections 4-5; the team's calls D1-D5 and S1-S4 are accepted"; the PRESETS load sheet v2, section 5, copied word for word, never retyped).
// No browser, no box: the real reorg/searchWords.ts is transpiled and run, and the ids it must cover are read from the real sources (reorg/docKinds.ts, reorg/backMenu/planPresets.ts, decks/library/*.ts);
// each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   COVER    every preset (38), plan structure (15) and deck (22) the app has carries search words, and nothing else does: 75 built items, no id invented
//   WORDS    each item's words are the sheet's, in the sheet's order; the four gated items (Braided Essay, Zuihitsu, the Game Design Document, Kishotenketsu) keep their words ready, attached to nothing the app builds (S1: 79 items in all)
//   RULES    the sheet's rules: all lower case; a word or a short phrase; an item's own name is not repeated (it always matches); no product or brand name and no how-to book title (S2); a person's surname only where that item's "?" credits them (S3)
//   NAMES    a word the sheet gives a NEW item is attached to the item of that name (the preset's label, the structure's and the deck's lexicon name)
// The search box itself is build item 8 (More). This build stores the words beside each item and offers one reader, searchWordsOf(kind, id); nothing here matches, shows or stores anything a writer types.
// Run: node scripts/harness/reorg-presets-b-search-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const SRC = new URL('../../src/', import.meta.url);
const rd = (p) => { try { return lf(fs.readFileSync(new URL(p, SRC), 'utf8')); } catch { return ''; } };
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}

// THE SHEET, as data: kind, the app's id, the sheet's name, whether the sheet marks it (gated), its words.
const SHEET = [
  {"kind":"preset","id":"short-story","name":"Short Story","gated":false,"words":["story","short fiction","fiction","tale"]},
  {"kind":"preset","id":"novel","name":"Novel","gated":false,"words":["book","fiction","manuscript","chapters"]},
  {"kind":"preset","id":"personal-essay","name":"Personal Essay","gated":false,"words":["essay","creative nonfiction","personal narrative","first person"]},
  {"kind":"preset","id":"poem","name":"Poem","gated":false,"words":["poetry","verse","lyric"]},
  {"kind":"preset","id":"memoir","name":"Memoir","gated":false,"words":["life story","autobiography","my story","family history"]},
  {"kind":"preset","id":"flash-fiction","name":"Flash Fiction","gated":false,"words":["microfiction","very short story","short short","sudden fiction"]},
  {"kind":"preset","id":"novella","name":"Novella","gated":false,"words":["short novel","long story","novelette"]},
  {"kind":"preset","id":"lyric-essay","name":"Lyric Essay","gated":false,"words":["poetic essay","experimental essay","creative nonfiction","fragments"]},
  {"kind":"preset","id":"collage-essay","name":"Collage Essay","gated":false,"words":["fragments","segmented essay","mosaic essay","experimental essay"]},
  {"kind":"preset","id":"treatment","name":"Treatment","gated":false,"words":["film treatment","story outline","pitch document","prose outline"]},
  {"kind":"preset","id":"how-to-guide","name":"How-To Guide","gated":false,"words":["instructions","tutorial","manual","step by step","how to"]},
  {"kind":"preset","id":"braided-essay","name":"Braided Essay","gated":true,"words":["braid","woven essay","threads","strands"]},
  {"kind":"preset","id":"zuihitsu","name":"Zuihitsu","gated":true,"words":["following the brush","pillow book","miscellany","lists","fragments"]},
  {"kind":"preset","id":"academic-research","name":"Academic Research","gated":false,"words":["research paper","imrad","scientific paper","study","paper"]},
  {"kind":"preset","id":"argumentative-essay","name":"Argumentative Essay","gated":false,"words":["argument","persuasive essay","position paper","essay"]},
  {"kind":"preset","id":"literature-review","name":"Literature Review","gated":false,"words":["lit review","review of the literature","sources","synthesis"]},
  {"kind":"preset","id":"class-essay","name":"Class Essay","gated":false,"words":["school essay","five paragraph essay","homework","assignment","essay"]},
  {"kind":"preset","id":"thesis-or-dissertation","name":"Thesis or Dissertation","gated":false,"words":["phd","doctorate","masters","capstone"]},
  {"kind":"preset","id":"lab-report","name":"Lab Report","gated":false,"words":["experiment","science report","lab write-up","practical"]},
  {"kind":"preset","id":"research-proposal","name":"Research Proposal","gated":false,"words":["prospectus","research plan","study plan","proposal"]},
  {"kind":"preset","id":"memo","name":"Memo","gated":false,"words":["memorandum","internal note","to from re"]},
  {"kind":"preset","id":"report","name":"Report","gated":false,"words":["business report","findings","executive summary","recommendations"]},
  {"kind":"preset","id":"proposal","name":"Proposal","gated":false,"words":["business proposal","bid","quote","statement of work"]},
  {"kind":"preset","id":"meeting-minutes","name":"Meeting Minutes","gated":false,"words":["minutes","meeting notes","action items","agenda"]},
  {"kind":"preset","id":"grant-application","name":"Grant Application","gated":false,"words":["grant","funding","grant proposal","funder","nonprofit"]},
  {"kind":"preset","id":"one-pager","name":"One-Pager","gated":false,"words":["one page","summary","brief","fact sheet"]},
  {"kind":"preset","id":"decision-memo","name":"Decision Memo","gated":false,"words":["decision","options","recommendation","briefing note"]},
  {"kind":"preset","id":"product-spec","name":"Product Spec","gated":false,"words":["spec","requirements","prd","product requirements","feature spec"]},
  {"kind":"preset","id":"status-update","name":"Status Update","gated":false,"words":["update","progress report","weekly update","where things stand"]},
  {"kind":"preset","id":"blog-post","name":"Blog Post","gated":false,"words":["blog","post","article","web article"]},
  {"kind":"preset","id":"newsletter","name":"Newsletter","gated":false,"words":["email newsletter","issue","mailing list"]},
  {"kind":"preset","id":"news-story","name":"News Story","gated":false,"words":["news","article","news article","reporting"]},
  {"kind":"preset","id":"feature","name":"Feature","gated":false,"words":["feature story","article","longform","magazine piece"]},
  {"kind":"preset","id":"op-ed","name":"Op-Ed","gated":false,"words":["opinion","opinion piece","editorial","commentary"]},
  {"kind":"preset","id":"profile","name":"Profile","gated":false,"words":["portrait","interview piece","person"]},
  {"kind":"preset","id":"explainer","name":"Explainer","gated":false,"words":["explain","how it works","background","questions and answers"]},
  {"kind":"preset","id":"screenplay-feature","name":"Feature","gated":false,"words":["screenplay","film script","movie","script"]},
  {"kind":"preset","id":"tv-half-hour","name":"TV Half-Hour","gated":false,"words":["sitcom","comedy pilot","tv script","teleplay","episode"]},
  {"kind":"preset","id":"tv-hour","name":"TV Hour","gated":false,"words":["drama pilot","tv script","teleplay","episode"]},
  {"kind":"preset","id":"short-film","name":"Short Film","gated":false,"words":["short","short screenplay","film script","script"]},
  {"kind":"preset","id":"game-design-document","name":"Game Design Document","gated":true,"words":["gdd","game design","design doc","game doc"]},
  {"kind":"structure","id":"three","name":"Three-Act","gated":false,"words":["three act structure","three acts","beginning middle end","plot"]},
  {"kind":"structure","id":"hero","name":"The Hero's Journey","gated":false,"words":["hero's journey","monomyth","quest","call to adventure"]},
  {"kind":"structure","id":"stasis","name":"Stasis Theory","gated":false,"words":["stasis","rhetoric","what is at issue","finding the argument"]},
  {"kind":"structure","id":"circle","name":"Story Circle","gated":false,"words":["circle","eight steps","character change","harmon"]},
  {"kind":"structure","id":"seven","name":"Seven-Point","gated":false,"words":["seven point","7 point","plot points","pinch points","wells"]},
  {"kind":"structure","id":"freytag","name":"Freytag's Pyramid","gated":false,"words":["freytag","pyramid","five act","tragedy","rising action","falling action"]},
  {"kind":"structure","id":"beats","name":"Fifteen Beats","gated":false,"words":["beat sheet","beats","15 beats","screenplay beats"]},
  {"kind":"structure","id":"scene","name":"Scene–Sequel","gated":false,"words":["scene and sequel","scene sequel","pacing","goal conflict disaster","swain"]},
  {"kind":"structure","id":"toulmin","name":"Toulmin","gated":false,"words":["claim","grounds","warrant","argument model"]},
  {"kind":"structure","id":"rogerian","name":"Rogerian","gated":false,"words":["common ground","both sides","compromise","rogers"]},
  {"kind":"structure","id":"oration","name":"Classical Oration","gated":false,"words":["oration","classical argument","rhetoric","speech","six parts"]},
  {"kind":"structure","id":"cars","name":"CARS: Create a Research Space","gated":false,"words":["cars","research introduction","introduction","niche","gap","swales"]},
  {"kind":"structure","id":"imrad","name":"IMRaD","gated":false,"words":["introduction methods results discussion","scientific paper","research paper"]},
  {"kind":"structure","id":"answer","name":"Answer First","gated":false,"words":["bottom line up front","bluf","pyramid","executive summary","minto"]},
  {"kind":"structure","id":"inverted","name":"Inverted Pyramid","gated":false,"words":["news writing","most important first","lede"]},
  {"kind":"structure","id":"kishotenketsu","name":"Kishōtenketsu","gated":true,"words":["kishotenketsu","four part","four-part turn","ki sho ten ketsu","no conflict"]},
  {"kind":"deck","id":"three-act","name":"Three-Act","gated":false,"words":["three act structure","acts","plot","outline"]},
  {"kind":"deck","id":"hero-journey","name":"Hero's Journey","gated":false,"words":["monomyth","quest","journey"]},
  {"kind":"deck","id":"story-circle","name":"Story Circle","gated":false,"words":["circle","eight steps","character change"]},
  {"kind":"deck","id":"scene-sequel","name":"Scene–Sequel","gated":false,"words":["scene and sequel","pacing","scenes"]},
  {"kind":"deck","id":"feature-screenplay","name":"Fifteen Beats","gated":false,"words":["beat sheet","beats","screenplay beats"]},
  {"kind":"deck","id":"character-study","name":"Character Study","gated":false,"words":["characters","character sheet","cast","want and need","backstory"]},
  {"kind":"deck","id":"worldbuilding","name":"Worldbuilding","gated":false,"words":["world","setting","lore","map","fantasy","science fiction"]},
  {"kind":"deck","id":"from-my-pages","name":"From My Pages","gated":false,"words":["reverse outline","outline from draft","what i have"]},
  {"kind":"deck","id":"thesis","name":"Thesis","gated":false,"words":["dissertation","research question","chapters"]},
  {"kind":"deck","id":"argument-essay","name":"Argumentative Essay","gated":false,"words":["argument","claim","counterclaim","evidence"]},
  {"kind":"deck","id":"research-paper","name":"Research Paper (IMRaD)","gated":false,"words":["imrad","scientific paper","methods","results"]},
  {"kind":"deck","id":"business-proposal","name":"Business Proposal","gated":false,"words":["proposal","pitch","problem and solution","budget"]},
  {"kind":"deck","id":"grant","name":"Grant","gated":false,"words":["grant application","funding","need statement","funder"]},
  {"kind":"deck","id":"feature-story","name":"Feature Story","gated":false,"words":["feature","profile","lede","nut graf","kicker"]},
  {"kind":"deck","id":"relationship-map","name":"Relationship Map","gated":false,"words":["relationships","character map","cast","who knows who","family"]},
  {"kind":"deck","id":"timeline","name":"Timeline","gated":false,"words":["chronology","dates","events","what happened when"]},
  {"kind":"deck","id":"literature-map","name":"Literature Map","gated":false,"words":["lit review","themes","sources","synthesis"]},
  {"kind":"deck","id":"narrow-my-question","name":"Narrow My Question","gated":false,"words":["research question","topic","narrow down","focus","choosing a topic"]},
  {"kind":"deck","id":"pitch-story","name":"Pitch Story","gated":false,"words":["pitch","presentation","elevator pitch","investors"]},
  {"kind":"deck","id":"logic-model","name":"Logic Model","gated":false,"words":["theory of change","inputs outputs outcomes","programme plan","evaluation"]},
  {"kind":"deck","id":"interview-notes","name":"Interview Notes","gated":false,"words":["interviews","sources","quotes","reporting"]},
  {"kind":"deck","id":"memory-map","name":"Memory Map","gated":false,"words":["memories","memoir","remembering","life events"]}
];
const GATED = ['braided-essay', 'zuihitsu', 'game-design-document', 'kishotenketsu'];
const BRAND = /\b(save the cat|snyder|campbell|vogler|scrivener|final draft|celtx|notion|google docs?|microsoft|ms word|grammarly|chatgpt|story grid|hollywood|netflix)\b/i;
const SURNAME = ['freytag', 'harmon', 'wells', 'swain', 'rogers', 'swales', 'minto', 'toulmin'];

// the ids the app builds, read from the real sources
const SOURCES = {
  docKinds: () => rd('reorg/docKinds.ts'),
  plan: () => rd('reorg/backMenu/planPresets.ts'),
  chrome: () => rd('store/lexicon/canonical/chrome.ts'),
  decks: () => rd('store/lexicon/canonical/decks.ts'),
};
const deckFiles = () => fs.readdirSync(new URL('decks/library/', SRC)).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => rd('decks/library/' + f));
const presetIds = (kinds) => [...kinds.matchAll(/\b(?:std|scr)\('([a-z-]+)'/g)].map((m) => m[1]);
const presetLabels = (kinds) => Object.fromEntries([...kinds.matchAll(/\bstd\('([a-z-]+)', '[a-z]+', '((?:[^'\\]|\\.)*)'/g)].map((m) => [m[1], m[2].replace(/\\'/g, "'")]).concat([...kinds.matchAll(/\bscr\('([a-z-]+)', '((?:[^'\\]|\\.)*)'/g)].map((m) => [m[1], m[2]])));
const structIds = (plan) => [...plan.matchAll(/\{ id: '([a-z]+)', name: '(reorgPre[A-Za-z]+)'/g)].map((m) => [m[1], m[2]]);
const deckIds = () => deckFiles().map((t) => (/^  id: '([a-z-]+)',/m.exec(t) || [])[1]).filter(Boolean);
const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

function suite(searchText) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail: String(detail).slice(0, 320) }; };
  let M;
  try { M = load(searchText); } catch (e) { for (const k of ['COVER', 'WORDS', 'RULES', 'NAMES']) keep(k, false, 'searchWords.ts does not load: ' + String(e.message).slice(0, 120)); return r; }
  const kinds = SOURCES.docKinds(), plan = SOURCES.plan();
  const built = { preset: presetIds(kinds), structure: structIds(plan).map((x) => x[0]), deck: deckIds() };
  const table = { preset: M.PRESET_SEARCH || {}, structure: M.STRUCTURE_SEARCH || {}, deck: M.DECK_SEARCH || {} };
  const sheetBuilt = (k) => SHEET.filter((x) => x.kind === k && !GATED.includes(x.id));

  // COVER
  {
    const bad = [];
    for (const k of ['preset', 'structure', 'deck']) {
      const have = Object.keys(table[k]).sort(), want = built[k].slice().sort();
      if (!same(have, want)) bad.push(`${k}: missing ${want.filter((x) => !have.includes(x)).join(',') || '-'} / extra ${have.filter((x) => !want.includes(x)).join(',') || '-'}`);
    }
    keep('COVER', bad.length === 0 && built.preset.length === 38 && built.structure.length === 15 && built.deck.length === 22, bad.join(' | ') + ` ${built.preset.length}/${built.structure.length}/${built.deck.length}`);
  }
  // WORDS
  {
    const bad = [];
    for (const x of SHEET) {
      if (GATED.includes(x.id)) {
        const g = (M.GATED_SEARCH && (M.GATED_SEARCH[x.kind === 'structure' ? 'structures' : 'presets'] || {})[x.id]) || null;
        if (!same(g, x.words)) bad.push('gated ' + x.id);
        if ((table[x.kind] || {})[x.id]) bad.push('gated ' + x.id + ' is attached to a built item');
      } else if (!same(table[x.kind][x.id], x.words)) bad.push(x.kind + ' ' + x.id);
    }
    const read = typeof M.searchWordsOf === 'function' && same(M.searchWordsOf('preset', 'poem'), SHEET.find((x) => x.id === 'poem').words) && same(M.searchWordsOf('deck', 'memory-map'), SHEET.find((x) => x.id === 'memory-map').words) && same(M.searchWordsOf('preset', 'zuihitsu'), []) && same(M.searchWordsOf('deck', 'nope'), []);
    keep('WORDS', bad.length === 0 && SHEET.length === 79 && read, bad.slice(0, 4).join(' | ') + (read ? '' : ' (reader)'));
  }
  // RULES
  {
    const bad = [];
    const chrome = SOURCES.chrome();
    const credit = (id) => { const m = new RegExp('reorgPreNote' + id[0].toUpperCase() + id.slice(1) + 'Credit: "((?:[^"\\\\]|\\\\.)*)"').exec(chrome); return m ? m[1].toLowerCase() : ''; };
    for (const x of SHEET) {
      const t = x.kind === 'structure' ? (M.STRUCTURE_SEARCH || {}) : x.kind === 'deck' ? (M.DECK_SEARCH || {}) : (M.PRESET_SEARCH || {});
      const words = GATED.includes(x.id) ? (((M.GATED_SEARCH || {})[x.kind === 'structure' ? 'structures' : 'presets'] || {})[x.id] || []) : (t[x.id] || []);
      for (const w of words) {
        if (w !== w.toLowerCase()) bad.push(`${x.id} "${w}" not lower case`);
        if (w.trim() !== w || w.split(/\s+/).length > 6 || !w) bad.push(`${x.id} "${w}" is not a word or short phrase`);
        if (norm(w) === norm(x.name)) bad.push(`${x.id} "${w}" repeats the item's own name`);
        if (BRAND.test(w)) bad.push(`${x.id} "${w}" is a product or brand name`);
        if (x.kind === 'structure' && !GATED.includes(x.id) && SURNAME.includes(w) && !credit(x.id).includes(w)) bad.push(`${x.id} "${w}" names a person its "?" does not credit`);
      }
      if (x.kind !== 'structure' || GATED.includes(x.id)) for (const w of words) if (SURNAME.includes(w)) bad.push(`${x.id} "${w}" is a person's name`);
    }
    keep('RULES', bad.length === 0, bad.slice(0, 4).join(' | '));
  }
  // NAMES
  {
    const bad = [];
    const labels = presetLabels(SOURCES.docKinds());
    const chrome = SOURCES.chrome(), decks = SOURCES.decks();
    const lexName = (src, key) => { const m = new RegExp('\\b' + key + ': (?:"((?:[^"\\\\]|\\\\.)*)"|\'((?:[^\'\\\\]|\\\\.)*)\')').exec(src); return m ? (m[1] ?? m[2]).replace(/\\'/g, "'") : null; };
    const newPresets = ['poem', 'memoir', 'flash-fiction', 'novella', 'lyric-essay', 'collage-essay', 'treatment', 'how-to-guide', 'class-essay', 'thesis-or-dissertation', 'lab-report', 'research-proposal', 'grant-application', 'one-pager', 'decision-memo', 'product-spec', 'status-update', 'op-ed', 'profile', 'explainer'];
    for (const x of SHEET.filter((y) => y.kind === 'preset' && newPresets.includes(y.id))) if (labels[x.id] !== x.name) bad.push(`preset ${x.id}: ${labels[x.id]}`);
    const newStructs = structIds(SOURCES.plan()).filter(([id]) => !['stasis', 'hero', 'three'].includes(id));
    for (const [id, key] of newStructs) { const sx = SHEET.find((y) => y.kind === 'structure' && y.id === id); const nm = lexName(chrome, key) || lexName(decks, key); if (!sx || !nm || norm(nm) !== norm(sx.name)) bad.push(`structure ${id}: ${nm}`); }
    const newDecks = ['relationship-map', 'timeline', 'literature-map', 'narrow-my-question', 'pitch-story', 'logic-model', 'interview-notes', 'memory-map'];
    for (const id of newDecks) { const sx = SHEET.find((y) => y.kind === 'deck' && y.id === id); const key = 'deckName' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); const nm = lexName(decks, key); if (!sx || !nm || norm(nm) !== norm(sx.name)) bad.push(`deck ${id}: ${nm}`); }
    keep('NAMES', bad.length === 0, bad.slice(0, 4).join(' | '));
  }
  return r;
}
function same(a, b) { return J(a) === J(b); }

const MUTANTS = [
  ['a preset\'s word is changed', 'WORDS', (t) => t.replace('["poetry", "verse", "lyric"]', () => '["poetry", "verse"]')],
  ['a word is capitalised', 'RULES', (t) => t.replace('"imrad", "scientific paper"', () => '"IMRaD", "scientific paper"')],
  ['an item loses its words (a deck is left out)', 'COVER', (t) => t.replace(/^  "memory-map": .*\n/m, () => '')],
  ['a deck that is not built is given words', 'COVER', (t) => t.replace('export const DECK_SEARCH: Readonly<Record<string, readonly string[]>> = {\n', () => 'export const DECK_SEARCH: Readonly<Record<string, readonly string[]>> = {\n  "ghost-deck": ["ghost"],\n')],
  ['a gated item is attached to a built preset', 'WORDS', (t) => t.replace('export const PRESET_SEARCH: Readonly<Record<string, readonly string[]>> = {\n', () => 'export const PRESET_SEARCH: Readonly<Record<string, readonly string[]>> = {\n  zuihitsu: ["following the brush", "pillow book", "miscellany", "lists", "fragments"],\n')],
  ['an item repeats its own name', 'RULES', (t) => t.replace('timeline: ["chronology"', () => 'timeline: ["timeline", "chronology"')],
  ['a product name is a search word', 'RULES', (t) => t.replace('["poetry", "verse", "lyric"]', () => '["poetry", "verse", "lyric", "scrivener"]')],
  ['a structure names a person its "?" does not credit', 'RULES', (t) => t.replace('toulmin: ["claim"', () => 'toulmin: ["freytag", "claim"')],
  ['a word is a long sentence, not a short phrase', 'RULES', (t) => t.replace('"what happened when"', () => '"what happened when and why and to whom and in what order and for how long"')],
  ['the reader returns another item\'s words', 'WORDS', (t) => t.replace('return TABLE[kind][id] ?? [];', () => 'return TABLE[kind][id] ?? Object.values(TABLE[kind])[0];')],

];

const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass: !!pass, detail });
const text = rd('reorg/searchWords.ts');
const S = suite(text);
for (const k of ['COVER', 'WORDS', 'RULES', 'NAMES']) ok(`${k} on the real reorg/searchWords.ts and the sources it must cover`, S[k].pass, S[k].detail);
for (const [name, key, fn] of MUTANTS) {
  const mut = fn(text);
  const landed = !!text && mut !== text;
  const red = landed && !suite(mut)[key].pass;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, red, J({ landed }));
}
let failed = 0;
for (const x of results) { if (!x.pass) failed += 1; console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.name}${x.pass ? '' : '  -- ' + x.detail}`); }
console.log(`REORG-PRESETS-B-SEARCH-UNIT VERIFY: ${failed ? `FAIL - ${failed}/${results.length} failed` : `PASS (${results.length} checks)`}`);
process.exit(failed ? 1 : 0);
