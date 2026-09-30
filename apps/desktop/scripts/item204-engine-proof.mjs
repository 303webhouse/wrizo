// ITEM 204 PART 2 — THE ENGINE HALF, PROVEN BROWSERLESSLY.
//
// Runs the REAL `store/proofingEngine.ts` (transpiled, nothing stubbed but the
// linter injection seam) against the REAL harper.js 2.10.0, and settles §8's open
// decision by MEASUREMENT rather than preference.
//
// Run: node apps/desktop/scripts/item204-engine-proof.mjs
//
// ⚠ WHAT IT CANNOT DO, STATED SO ITS ABSENCE IS NOT SILENT: it cannot prove a
// rendered pixel, a Range, or a mark. The engine stops short of the paint by ruling
// (Fable, 2026-09-30) and so does this. §12's paint checks belong to the box harness
// that lands with the paint, after Experiment 1's visibleText re-derivation.
//
// ⚠ AND IT USES A BINARY THE PRODUCT MUST NEVER SHIP. `harper.js/slimBinary` loads
// its wasm from a URL, and in Node on Windows harper's own URL→path conversion
// mangles the drive letter: it asks for 'C:\C:\Users\...' and throws ENOENT. That is
// a Node-only defect (in a browser the URL is http and resolves normally) and it is
// consistent with harper's own note that the worker linter "will not work properly
// in Node". So this proof takes `slimBinaryInlined`, which base64-embeds the wasm and
// touches no filesystem. The PRODUCT takes slimBinary, and §4 forbids the inlined
// variants because they roughly triple the download. A proof ships nothing, so the
// two choices do not conflict — but they must not be confused, which is why this is
// the second paragraph of the file and not a footnote.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = join(desktop, '..', '..');
const require = createRequire(join(repo, 'apps/server/package.json'));
const ts = require('typescript');

let failures = 0;
const ok = (name, pass, detail = '') => {
  if (!pass) failures += 1;
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? `  ${detail}` : ''}`);
};

// ⚠ E10 RUNS FIRST, AND THE MUTATION ROSTER IS WHY. E10 reads the engine's SOURCE,
// so it needs no transpiled module — and when it sat further down, the mutant that
// adds a static harper import killed the proof by CRASHING it: the transpiled module
// cannot resolve a bare 'harper.js' from the OS temp dir, so the file died at import
// time and E10a never ran. A mutant killed by a crash is not evidence that the check
// works. Source checks therefore run before anything is imported.

// ===========================================================================
// E10 — THE LAZY LOAD IS A SOURCE PROPERTY, AND IT IS CHECKED AS ONE
// ===========================================================================
// §4: "Load on entry to Revise. Never at boot, never in Free Write, never in
// Draft." E4c proves harper is not INSTANTIATED outside Revise. This proves the
// other half — that it is not BUNDLED into the main chunk, which is where the 7.7 MB
// would actually be paid by a writer who never opens Revise.
//
// ⚠ IT IS CHECKED AT THE SOURCE, NOT AT THE BUNDLE, AND THAT IS THE DURABLE CHOICE.
// The bundle was measured once, by hand, with a temporary consumer wired into
// main.tsx (the engine has no caller yet, so Rollup tree-shakes the whole module and
// a bundle check on today's build would report "no harper" for the wrong reason —
// green because nothing imports it, not because it splits). Measured that way:
//
//     main chunk        596.64 kB  ->  598.54 kB   (+1.9 kB: the import machinery)
//     harper glue                     130.44 kB    (its own chunk)
//     BinaryModule                     43.56 kB    (its own chunk)
//     slimBinary                        0.24 kB    (its own chunk)
//     harper_wasm_slim_bg.wasm     15,935.20 kB    (its own ASSET, fetched on demand)
//
// So the split is real. But that measurement cannot be re-run without editing
// main.tsx, and a check that needs a source edit is a check nobody runs. What CAN be
// asserted forever is the property that makes the split happen: the harper VALUE
// imports must be dynamic. A single static `import { WorkerLinter } from 'harper.js'`
// at the top of the engine would move all of it into the main chunk while every
// function in the file still looked correct — the failure would be invisible in
// review and invisible in behaviour, and only a writer's first page load would pay.
{
  const src = readFileSync(join(desktop, 'src/store/proofingEngine.ts'), 'utf8');
  // Strip comments before matching: this file's own prose quotes the forbidden form,
  // and a matcher that reads prose as code finds the description instead of the
  // thing. (The house law, earned three times: a source check reads code, not
  // comments.)
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  const staticValueImports = [...code.matchAll(/^\s*import\s+(?!type\b)[^;]*?from\s*'(harper\.js[^']*)'/gm)]
    .map((m) => m[1]);
  ok('E10a ⛔ NO static VALUE import of harper anywhere in the engine — this is the single line that would silently put 16 MB in the main chunk while every function still read correctly',
    staticValueImports.length === 0, JSON.stringify(staticValueImports));

  const typeImports = [...code.matchAll(/^\s*import\s+type\s+[^;]*?from\s*'(harper\.js[^']*)'/gm)].map((m) => m[1]);
  ok('E10b: the harper types ARE imported statically, which is free — `import type` is erased at build time, so naming harper\'s own types costs no bytes and saves a hand-copied paraphrase',
    typeImports.length >= 1, JSON.stringify(typeImports));

  const dynamic = [...code.matchAll(/import\(\s*'(harper\.js[^']*)'\s*\)/g)].map((m) => m[1]).sort();
  ok('E10c: and both harper modules arrive through dynamic import() — the form Vite splits',
    JSON.stringify(dynamic) === JSON.stringify(['harper.js', 'harper.js/slimBinary']), JSON.stringify(dynamic));

  ok('E10d: the INLINED binaries are never imported by the product — §4 forbids them (they base64 the wasm into JS and roughly triple the cost), and this proof\'s own use of slimBinaryInlined is a proof-only affordance that must not leak into src/',
    !code.includes('Inlined'), '');

  // The comment-blanking above must actually have worked, or E10a could be passing
  // because it read nothing. A population of zero means nothing without coverage.
  ok('E10e (the instrument, not the product): the blanked source still contains the engine\'s real code, so E10a searched something',
    code.includes('export async function proofText') && code.length > 1500,
    JSON.stringify({ blankedLength: code.length, rawLength: src.length }));
}

// --- transpile the REAL modules ---------------------------------------------
const tmp = join(tmpdir(), 'wrizo-item204-engine-proof');
mkdirSync(tmp, { recursive: true });
const tr = (src) => ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

const emit = (name, rel, rewrites = []) => {
  let js = tr(readFileSync(join(desktop, 'src', rel), 'utf8'));
  for (const [from, to] of rewrites) {
    const before = js;
    js = js.split(from).join(to);
    if (js === before) {
      console.log(`FAIL — could not rewrite ${JSON.stringify(from)} in ${rel}; refusing to test a module whose imports were not redirected.`);
      process.exit(1);
    }
  }
  writeFileSync(join(tmp, name), js, 'utf8');
};

emit('types.mjs', 'types/index.ts');
emit('proofing.mjs', 'store/proofing.ts', [["from '../types'", "from './types.mjs'"]]);
// ⚠ THE DYNAMIC harper IMPORTS ARE LEFT ALONE ON PURPOSE. They live inside
// `buildLinter`, which this proof never calls — the linter arrives through the test
// seam instead. If a future edit made the engine load harper eagerly, this file
// would fail to import at all, which is the right way to find out.
emit('proofingEngine.mjs', 'store/proofingEngine.ts', [
  ["from '../types'", "from './types.mjs'"],
  ["from './proofing'", "from './proofing.mjs'"],
]);

// localStorage stub — store/proofing.ts mirrors locally and must not throw here.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
  clear: () => mem.clear(),
};

const E = await import(pathToFileURL(join(tmp, 'proofingEngine.mjs')).href);
const P = await import(pathToFileURL(join(tmp, 'proofing.mjs')).href);

console.log('ITEM 204 PART 2 — ENGINE PROOF\n');

// ===========================================================================
// E1 — THE AMBIENT DECLARATION IS NOT ALLOWED TO ROT
// ===========================================================================
// src/types/harper-js.d.ts is a HAND-WRITTEN copy of harper's API, written because
// this package's `moduleResolution: "node"` cannot read an `exports` map. A hand
// copy keeps compiling long after the package it describes has moved, so it is
// checked against the INSTALLED package here rather than trusted.
console.log('E1 — the hand-written harper types match the INSTALLED package');
{
  const dts = readFileSync(join(desktop, 'node_modules/harper.js/dist/index.d.ts'), 'utf8');
  const ambient = readFileSync(join(desktop, 'src/types/harper-js.d.ts'), 'utf8');

  // The Dialect enum, in order — the engine encodes these as bare numbers to keep
  // harper out of the main bundle, so the numbers must be the package's own.
  const enumBlock = dts.slice(dts.indexOf('export declare enum Dialect'));
  const pkgDialects = [...enumBlock.slice(0, enumBlock.indexOf('}')).matchAll(/(\w+) = (\d+)/g)]
    .map((m) => [m[1], Number(m[2])]);
  const want = [['American', 0], ['British', 1], ['Australian', 2], ['Canadian', 3], ['Indian', 4]];
  ok('E1a: harper 2.10.0 declares exactly the five dialects the shape report names, in this order',
    JSON.stringify(pkgDialects) === JSON.stringify(want), JSON.stringify(pkgDialects));
  ok('E1b: and the fifth is INDIAN, not New Zealand — the correction the shape report recorded, re-asserted against the package so it cannot drift back',
    pkgDialects.some(([n, v]) => n === 'Indian' && v === 4));

  const codes = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN'].map((d) => E.dialectCode(d));
  ok('E1c: the engine maps the five ProofingDialect codes onto those five numbers, in the same order',
    JSON.stringify(codes) === JSON.stringify([0, 1, 2, 3, 4]), JSON.stringify(codes));
  ok('E1d: an absent or unknown dialect falls back to the default rather than to 0 by accident',
    E.dialectCode(undefined) === 0 && E.dialectCode(null) === 0 && E.dialectCode('en-XX') === 0);

  // The LintKind union — the population, read from the package, not hand-listed.
  const m = dts.match(/export declare type LintKind = ([^;]+);/);
  const pkgKinds = m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort() : [];
  const mapKinds = [...E.HARPER_LINT_KINDS].sort();
  ok('E1e: the colour map covers EVERY kind harper declares, and invents none — the population comes from the package',
    pkgKinds.length > 0 && JSON.stringify(pkgKinds) === JSON.stringify(mapKinds),
    JSON.stringify({ inPackageNotMapped: pkgKinds.filter((k) => !mapKinds.includes(k)), inMappedNotPackage: mapKinds.filter((k) => !pkgKinds.includes(k)) }));

  for (const name of ['WorkerLinter', 'LocalLinter', 'setDialect', 'importWords', 'clearWords', 'importIgnoredLints', 'clearIgnoredLints', 'lint_kind', 'suggestions']) {
    ok(`E1f: the package still declares ${name}, which the ambient file promises and the engine calls`,
      dts.includes(name), '');
  }
  ok('E1g: and the ambient file declares both linters, so the product/proof split it documents is real',
    ambient.includes('class WorkerLinter') && ambient.includes('class LocalLinter'));
}

// ===========================================================================
// E2 — THE COLOUR MAP IS A PARTITION, NOT A LIST
// ===========================================================================
console.log('\nE2 — the colour map partitions the kinds (§9)');
{
  const reds = [], olives = [], drops = [];
  for (const k of E.HARPER_LINT_KINDS) {
    const c = E.classifyKind(k);
    if (c === 'red') reds.push(k); else if (c === 'olive') olives.push(k); else drops.push(k);
  }
  ok('E2a: 2 red (Spelling, Typo)', JSON.stringify(reds.sort()) === JSON.stringify(['Spelling', 'Typo']), JSON.stringify(reds));
  ok('E2b: 5 dropped, and exactly the brief\'s five',
    JSON.stringify(drops.sort()) === JSON.stringify(['Enhancement', 'Formatting', 'Readability', 'Regionalism', 'Style']), JSON.stringify(drops));
  ok('E2c: 14 olive, and the total partitions the 21 kinds with nothing counted twice',
    olives.length === 14 && reds.length + olives.length + drops.length === E.HARPER_LINT_KINDS.length,
    JSON.stringify({ red: reds.length, olive: olives.length, drop: drops.length, total: E.HARPER_LINT_KINDS.length }));
  ok('E2d ⛔ Miscellaneous is OLIVE, not dropped — it carries "Incorrect indefinite article", and TUTOR\'s desk got this wrong first at the cost of one of six grammar hits',
    E.classifyKind('Miscellaneous') === 'olive');
  ok('E2e ⛔ an UNKNOWN kind DROPS (default-deny) — a harper upgrade cannot put a new Style kind in front of a writer',
    E.classifyKind('SomeKindHarperAddedLater') === null);
  ok('E2f: and the unknown is RECORDED rather than silently discarded, so the gap is visible',
    E.unknownKindsSeen().includes('SomeKindHarperAddedLater'), JSON.stringify(E.unknownKindsSeen()));
}

// ===========================================================================
// E3 — THE NORMALIZER (§5)
// ===========================================================================
console.log('\nE3 — quote normalization is 1:1, and the map-back holds');
{
  const CORPUS = [
    'She don\u2019t know.',
    '\u201CDon\u2019t,\u201D he said, \u201Cnot like that.\u201D',
    'It\u2018s \u201Aodd\u2019 and \u201Bodder\u201F still \u2032 \u2033',
    'Kore\u02BCs name, the 5\u2032 9\u2033 man, and plain \'ASCII\' "quotes".',
    'no quotes at all',
    '',
    'emoji \uD83D\uDE80 and a surrogate pair must not shift anything \u2019',
  ];
  let allSame = true, onlyQuotes = true;
  for (const s of CORPUS) {
    const n = E.normalizeQuotes(s);
    if (n.length !== s.length) { allSame = false; break; }
    // A SAME LENGTH IS NOT A SAME ALIGNMENT, so every index is compared.
    for (let i = 0; i < s.length; i += 1) {
      if (n[i] !== s[i] && !'\u2018\u2019\u201A\u201B\u02BC\u2032\u201C\u201D\u201E\u201F\u2033'.includes(s[i])) { onlyQuotes = false; break; }
    }
  }
  ok('E3a: length is invariant over the corpus, INCLUDING a surrogate pair — the walk is over UTF-16 code units, the same unit harper\'s spans use',
    allSame);
  ok('E3b: and no character changed unless it was a mapped quote — index by index, because a same length is not a same alignment',
    onlyQuotes);
  ok('E3c: all 11 mappings land on ASCII \' or "',
    [...'\u2018\u2019\u201A\u201B\u02BC\u2032'].every((c) => E.normalizeQuotes(c) === "'")
    && [...'\u201C\u201D\u201E\u201F\u2033'].every((c) => E.normalizeQuotes(c) === '"'));
}

// ===========================================================================
// THE REAL HARPER, from here down
// ===========================================================================
const { LocalLinter } = await import('harper.js');
const { slimBinaryInlined } = await import('harper.js/slimBinaryInlined');
const mkLinter = async (dialect = 0) => {
  const l = new LocalLinter({ binary: slimBinaryInlined, dialect });
  await l.setup();
  return l;
};

console.log('\nE3d — the MAP-BACK, against real harper spans');
{
  const original = 'She don\u2019t know what happened.';
  const normalized = E.normalizeQuotes(original);
  const l = await mkLinter();
  const lints = await l.lint(normalized, { language: 'plaintext' });
  const agree = lints.find((x) => x.lint_kind() === 'Agreement');
  ok('E3d-pre: harper finds the Agreement error in the NORMALIZED copy (with the curly apostrophe it finds nothing at all — a sixth of the grammar yield hangs on this one character)',
    !!agree, JSON.stringify(lints.map((x) => x.lint_kind())));
  if (agree) {
    const sp = agree.span();
    const fromOriginal = original.slice(sp.start, sp.end);
    ok('E3d ⛔ a span measured on the normalized copy slices the ORIGINAL correctly, curly apostrophe intact — which is the whole point of the same-length rule',
      fromOriginal.includes('\u2019') && fromOriginal === original.slice(sp.start, sp.end) && fromOriginal.replace('\u2019', "'") === normalized.slice(sp.start, sp.end),
      JSON.stringify({ span: [sp.start, sp.end], fromOriginal, fromNormalized: normalized.slice(sp.start, sp.end) }));
  }
  const zero = await l.lint(original, { language: 'plaintext' });
  ok('E3e: and the un-normalized original really does return no Agreement — the premise, measured rather than repeated from the brief',
    !zero.some((x) => x.lint_kind() === 'Agreement'), JSON.stringify(zero.map((x) => x.lint_kind())));
}

// ===========================================================================
// E4 — THE REVISE GATE (§12.2 — "the whole of his ruling")
// ===========================================================================
console.log('\nE4 — Revise only, and the gate is structural');
{
  E.__setProofingEngineForTests(null);
  const inDraft = await E.proofText('She don\u2019t know. A mispeling.', { mode: 'drafting' });
  const inJournal = await E.proofText('She don\u2019t know. A mispeling.', { mode: 'journal' });
  ok('E4a: a pass in Draft returns nothing', Array.isArray(inDraft) && inDraft.length === 0);
  ok('E4b: a pass in Free Write/journal returns nothing', Array.isArray(inJournal) && inJournal.length === 0);
  ok('E4c ⛔ AND HARPER WAS NEVER LOADED — "never at boot, never in Free Write, never in Draft" is about the 7.7 MB, so returning [] while still downloading would satisfy the letter and miss the point',
    E.proofingEngineLoaded() === false);
  ok('E4d: proofingAllowedIn names the one mode', E.proofingAllowedIn('revise') === true
    && E.proofingAllowedIn('drafting') === false && E.proofingAllowedIn('journal') === false);
}

// ===========================================================================
// E5 / E6 — THE READ-TIME DROPS, ON REAL FINDINGS
// ===========================================================================
console.log('\nE5 — the dictionary drop, and E6 — no style ever reaches the writer');
{
  E.__setProofingEngineForTests(await mkLinter());

  // §10's measured false positive: an invented proper noun is flagged red.
  const NAME_TEXT = 'Aelinor walked home. This is a mispeling.';
  const withoutDict = await E.proofText(NAME_TEXT, { mode: 'revise', language: 'plaintext', record: null });
  const flaggedName = withoutDict.find((f) => NAME_TEXT.slice(f.start, f.end) === 'Aelinor');
  ok('E5-pre: harper flags the invented proper noun RED with no dictionary — the measured cost that makes the dictionary a requirement, not a refinement',
    !!flaggedName && flaggedName.colour === 'red',
    JSON.stringify(withoutDict.map((f) => [NAME_TEXT.slice(f.start, f.end), f.colour, f.kind])));

  const rec = { dialect: 'en-US', words: { Aelinor: { addedAt: '2026-09-30T00:00:00.000Z' } } };
  const withDict = await E.proofText(NAME_TEXT, { mode: 'revise', language: 'plaintext', record: rec });
  ok('E5a ⛔ with the name in the writer\'s dictionary the red mark is GONE',
    !withDict.some((f) => NAME_TEXT.slice(f.start, f.end) === 'Aelinor'),
    JSON.stringify(withDict.map((f) => [NAME_TEXT.slice(f.start, f.end), f.colour])));
  ok('E5b: and the OTHER misspelling still reports — the drop is per-word, not a switch that quietly silences spelling',
    withDict.some((f) => f.colour === 'red' && NAME_TEXT.slice(f.start, f.end) === 'mispeling'),
    JSON.stringify(withDict.map((f) => [NAME_TEXT.slice(f.start, f.end), f.colour])));

  // ⛔ E5d — THE READ-TIME DROP, ISOLATED FROM harper's OWN DICTIONARY.
  //
  // ⚠ E5a ABOVE DOES NOT PROVE WHAT IT SOUNDS LIKE, AND THE FALSIFICATION CAUGHT IT.
  // Removing the read-time drop entirely left the proof CLEAN: `importWords` had
  // already told harper the name was a word, so the mark was gone either way and E5a
  // could not say WHICH mechanism removed it. A check that passes under both branches
  // is not testing the branch it is named for.
  //
  // The read-time drop exists precisely for the case where the import DID NOT take —
  // skipped, failed, or racing a dictionary edit. So that case is built here: a linter
  // whose `importWords` is a no-op, which is exactly how a failed import behaves from
  // the engine's side. If the drop is the guarantee it claims to be, the red mark is
  // still gone; if it is decoration, this goes red. That is the difference between the
  // two mechanisms, and it is the only assertion that can see it.
  {
    const deaf = await mkLinter();
    const realImport = deaf.importWords.bind(deaf);
    let importCalls = 0;
    deaf.importWords = async (w) => { importCalls += 1; void w; /* swallowed on purpose */ };
    E.__setProofingEngineForTests(deaf);

    const rec2 = { dialect: 'en-US', words: { Aelinor: { addedAt: '2026-09-30T00:00:00.000Z' } } };
    const deafResult = await E.proofText(NAME_TEXT, { mode: 'revise', language: 'plaintext', record: rec2 });

    ok('E5d-pre: the engine DID try to hand the word to harper, and this fixture swallowed it — so what follows is measured with harper\'s own dictionary genuinely out of the picture',
      importCalls === 1, String(importCalls));
    ok('E5d ⛔ WITH harper\'s DICTIONARY DEAF, the read-time drop STILL removes the red mark on the writer\'s own name — the guarantee, isolated from the mechanism it backs up',
      !deafResult.some((f) => NAME_TEXT.slice(f.start, f.end) === 'Aelinor'),
      JSON.stringify(deafResult.map((f) => [NAME_TEXT.slice(f.start, f.end), f.colour])));
    ok('E5e: and the deaf linter still reports the OTHER misspelling, so E5d is measured on a linter that was working',
      deafResult.some((f) => NAME_TEXT.slice(f.start, f.end) === 'mispeling'),
      JSON.stringify(deafResult.map((f) => [NAME_TEXT.slice(f.start, f.end), f.colour])));

    deaf.importWords = realImport;
  }

  // The dictionary says "this is a word", never "this phrase is grammatical".
  const GRAM = 'She don\u2019t know.';
  const gramRec = { dialect: 'en-US', words: { "don't": { addedAt: '2026-09-30T00:00:00.000Z' } } };
  const gram = await E.proofText(GRAM, { mode: 'revise', language: 'plaintext', record: gramRec });
  ok('E5c: a dictionary word does NOT suppress an OLIVE finding on the same text — the drop is scoped to red, because a dictionary is about spelling',
    gram.some((f) => f.colour === 'olive'), JSON.stringify(gram.map((f) => [f.kind, f.colour])));

  // TD1 — the style guard. It must be shown that harper DID offer style, or the
  // check passes on absence.
  const STYLE_TEXT = 'It was very cold outside, and it was very cold inside too.';
  const rawLints = await (await mkLinter()).lint(E.normalizeQuotes(STYLE_TEXT), { language: 'plaintext' });
  const rawKinds = rawLints.map((x) => x.lint_kind());
  const droppedKinds = ['Style', 'Readability', 'Enhancement', 'Formatting', 'Regionalism'];
  const harperOfferedStyle = rawKinds.some((k) => droppedKinds.includes(k));
  const through = await E.proofText(STYLE_TEXT, { mode: 'revise', language: 'plaintext', record: null });
  ok(`E6-pre: harper itself offered at least one dropped-kind suggestion on this text (${rawKinds.join(', ') || 'none'}) — without this the guard below would be passing on an absence`,
    harperOfferedStyle, JSON.stringify(rawKinds));
  ok('E6 ⛔ TD1 — and NO dropped kind reached the writer. A style suggestion is composition, which the law forbids; the read-time drop is what keeps that true as harper changes',
    !through.some((f) => droppedKinds.includes(f.kind)),
    JSON.stringify(through.map((f) => [f.kind, f.colour])));
  ok('E6b: every finding that DID come through carries one of the two colours Nick named, and nothing else',
    through.every((f) => f.colour === 'red' || f.colour === 'olive'));
}

// ===========================================================================
// E7 — §8's OPEN DECISION, SETTLED BY MEASUREMENT
// ===========================================================================
// The brief's criterion is "take the one that does not flag the syntax itself",
// and it refuses to guess because the S0 measured plaintext on PLAIN prose while
// the Revise buffer is markdown.
//
// ⚠ THE FIRST VERSION OF THIS CHECK WAS BLIND, AND IT IS WORTH RECORDING HOW.
// It classified a "syntax finding" by testing the finding's PROBLEM TEXT for
// markdown punctuation. Both languages scored 0 by that test, so the verdict came
// out of a `<=` breaking a tie — while printing the words "flags the markup less
// (markdown 0 vs plaintext 0)". A tie dressed as a measurement.
//
// It was blind because a markup-induced FALSE POSITIVE need not contain any markup.
// Measured: on the fixture below, plaintext flags `Miscellaneous` on the problem
// text "A" — the indefinite article in "A [link](http://example.com)" — because it
// cannot see the noun past the brackets. The problem text is one plain letter. No
// character test could ever have caught it.
//
// SO THE CLASSIFIER IS A DIFFERENCE, NOT A PATTERN: lint the same prose twice, once
// WITH markup and once WITHOUT, and a finding that appears only when the markup is
// present is markup-induced. That needs no guess about what markup looks like.
{
  const MARKED = [
    '# The Long Road',
    '',
    'She **don’t** know what *happened* to the mispeling here.',
    '',
    '- one item',
    '- two item',
    '',
    'A [link](http://example.com) and some `code` too.',
  ].join('\n');
  // The SAME sentences with the markup taken out — the control the difference is
  // measured against.
  const BARE = [
    'The Long Road',
    '',
    'She don’t know what happened to the mispeling here.',
    '',
    'one item',
    'two item',
    '',
    'A link and some code too.',
  ].join('\n');

  const l = await mkLinter();
  const run = async (text, language) => {
    const lints = await l.lint(E.normalizeQuotes(text), { language });
    return lints.map((x) => ({ kind: x.lint_kind(), text: x.get_problem_text() }));
  };
  const sig = (f) => `${f.kind}:${f.text}`;

  const results = {};
  for (const language of ['plaintext', 'markdown']) {
    const marked = await run(MARKED, language);
    const bare = await run(BARE, language);
    const bareSigs = new Set(bare.map(sig));
    const markedSigs = new Set(marked.map(sig));
    results[language] = {
      marked, bare,
      // Present WITH markup, absent without it: the markup caused it.
      induced: marked.filter((f) => !bareSigs.has(sig(f))),
      // Present WITHOUT markup, absent with it: the markup hid a real error.
      lost: bare.filter((f) => !markedSigs.has(sig(f))),
    };
  }
  const P0 = results.plaintext;
  const M0 = results.markdown;

  console.log(`    plaintext: ${P0.marked.length} on the marked page, ${P0.bare.length} on the bare prose`
    + ` | markup-INDUCED ${P0.induced.length} ${JSON.stringify(P0.induced.map(sig))}`
    + ` | markup-HIDDEN ${P0.lost.length} ${JSON.stringify(P0.lost.map(sig))}`);
  console.log(`    markdown : ${M0.marked.length} on the marked page, ${M0.bare.length} on the bare prose`
    + ` | markup-INDUCED ${M0.induced.length} ${JSON.stringify(M0.induced.map(sig))}`
    + ` | markup-HIDDEN ${M0.lost.length} ${JSON.stringify(M0.lost.map(sig))}`);

  ok('E7-pre: both languages found the real errors on the BARE prose, so the two are being compared as working configurations rather than one of them being broken',
    P0.bare.length >= 2 && M0.bare.length >= 2,
    JSON.stringify({ plaintext: P0.bare.map(sig), markdown: M0.bare.map(sig) }));

  // ⛔ THE CRITERION IS THE BRIEF'S: fewer markup-induced false positives. It is
  // stated as an explicit chain with a NAMED tie-break, because the previous
  // version's verdict came out of an operator nobody had to defend.
  let winner, why;
  if (P0.induced.length !== M0.induced.length) {
    winner = M0.induced.length < P0.induced.length ? 'markdown' : 'plaintext';
    why = `fewer markup-induced false positives (markdown ${M0.induced.length} vs plaintext ${P0.induced.length})`;
  } else if (P0.lost.length !== M0.lost.length) {
    winner = M0.lost.length < P0.lost.length ? 'markdown' : 'plaintext';
    why = `equal false positives (${M0.induced.length} each), so decided on real errors the markup HID (markdown ${M0.lost.length} vs plaintext ${P0.lost.length})`;
  } else {
    winner = 'markdown';
    why = `a genuine TIE on both measures (induced ${M0.induced.length} each, hidden ${M0.lost.length} each) — broken by harper's OWN default, and named as a tie rather than presented as a result`;
  }

  ok(`E7 ⛔ THE MEASUREMENT: "${winner}" — ${why}`, true,
    JSON.stringify({ plaintext: { induced: P0.induced.map(sig), lost: P0.lost.map(sig) }, markdown: { induced: M0.induced.map(sig), lost: M0.lost.map(sig) } }));
  ok(`E7b: and PROOF_LANGUAGE_DEFAULT records that RESULT (${E.PROOF_LANGUAGE_DEFAULT}) rather than a preference`,
    E.PROOF_LANGUAGE_DEFAULT === winner, JSON.stringify({ default: E.PROOF_LANGUAGE_DEFAULT, measured: winner }));
  ok('E7c: the chosen language still finds real prose errors on the marked page — a language that flagged nothing at all would win a "fewest false positives" contest and be useless',
    (winner === 'markdown' ? M0.marked : P0.marked).some((f) => f.text === 'mispeling'),
    JSON.stringify((winner === 'markdown' ? M0.marked : P0.marked).map(sig)));

  // ⚠ A CEILING FOUND WHILE MEASURING, AND IT BELONGS TO NEITHER LANGUAGE.
  // BOTH lose the Agreement hit on "don't" once it sits inside markup. Probed
  // directly: markdown finds Agreement in "She **don't** know." but returns NOTHING
  // for "*italic* don't know." — so italic markers suppress findings later in the
  // line. This is not a language choice and not a defect this build can fix; it is
  // recorded so a writer's un-flagged error is not later read as our bug. It sits
  // beside §10's named ceiling (harper has no pronoun-case coverage at all).
  const bothLost = M0.lost.filter((f) => P0.lost.some((g) => sig(g) === sig(f)));
  ok(`E7d (a CEILING, recorded not fixed): ${bothLost.length} real finding(s) are hidden by markup under BOTH languages ${JSON.stringify(bothLost.map(sig))} — probed separately, an italic marker suppresses findings later in the line. Named so an un-flagged error is not read as a build defect`,
    true, JSON.stringify({ bothLost: bothLost.map(sig) }));
}

// ===========================================================================
// E8 — NOTHING REACHES THE NETWORK (§12.1)
// ===========================================================================
console.log('\nE8 — no network: grammar and spelling are NEVER AI');
{
  const attempts = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (...args) => { attempts.push(String(args[0])); throw new Error('item204 proof: network blocked'); };
  let passed = [];
  try {
    E.__setProofingEngineForTests(await mkLinter());
    passed = await E.proofText('She don\u2019t know. A mispeling here.', { mode: 'revise', language: 'plaintext', record: null });
  } finally {
    globalThis.fetch = realFetch;
  }
  ok('E8a: a full pass completed with fetch replaced by a throwing recorder', passed.length > 0,
    JSON.stringify(passed.map((f) => [f.kind, f.colour])));
  ok('E8b ⛔ and the attempt list is EMPTY — harper is a rule engine, not a model, and this is the cheap check that keeps that true as the code changes',
    attempts.length === 0, JSON.stringify(attempts));
}

// ===========================================================================
// E9 — THE HANDOVER SHAPE (§11), AND WHAT IT DOES NOT CARRY
// ===========================================================================
console.log('\nE9 — the handover shape, and A13');
{
  E.__setProofingEngineForTests(await mkLinter());
  const TEXT = 'She don\u2019t know. A mispeling here.';
  const f = await E.proofText(TEXT, { mode: 'revise', language: 'plaintext', record: null });
  ok('E9a: every finding carries a span, a colour, a kind, a message and suggestions (§11)',
    f.length > 0 && f.every((x) => Number.isInteger(x.start) && Number.isInteger(x.end) && x.end > x.start
      && (x.colour === 'red' || x.colour === 'olive') && typeof x.kind === 'string'
      && typeof x.message === 'string' && Array.isArray(x.suggestions)),
    JSON.stringify(f));
  ok('E9b: spans index the SOURCE text the caller passed, so slicing it yields the flagged words',
    f.every((x) => TEXT.slice(x.start, x.end).length === x.end - x.start),
    JSON.stringify(f.map((x) => TEXT.slice(x.start, x.end))));

  // ⚠ A13 — the Tutor holds no editor reference and no text setter. `applySuggestion`
  // IS a text write, so the engine must not expose one; accepting a suggestion
  // belongs to whatever owns the editor.
  const exported = Object.keys(E);
  const writers = exported.filter((n) => /^(apply|set)(Suggestion|Text)/.test(n) || n === 'applySuggestion');
  ok('E9c ⛔ A13 — the engine exports NO way to write text back. Reading the page to lint it is fine; writing a correction is not, and the destructive form is simply unsayable through this module',
    writers.length === 0, JSON.stringify({ exports: exported, writers }));
}

console.log('\nSTATED BOUNDS — not provable here, and owed to the paint:');
console.log('  · that a mark PAINTS, and still paints after a keystroke (§12.4/§12.5) — the box, with the paint');
console.log('  · DOM/source length equality over the Revise subtree (§8) — the box, with the paint');
console.log('  · that marks appear in Revise and in no other MODE on a real surface (§12.2) — the gate is proven here at the engine, not yet at the surface');
console.log('  · the 435ms/60k lint cost and the 7.7MB download were measured by the S0, not re-measured here');

console.log('\n' + (failures === 0
  ? 'ITEM 204 ENGINE PROOF: CLEAN'
  : `ITEM 204 ENGINE PROOF: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
