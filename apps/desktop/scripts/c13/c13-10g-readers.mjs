#!/usr/bin/env node
// #13 step 10g: every source reader of components/BoardEditor.tsx answers the same after the split. Browserless.
//
//   node apps/desktop/scripts/c13/c13-10g-readers.mjs --base <rev>
//   node apps/desktop/scripts/c13/c13-10g-readers.mjs --standing     (the guard for every main: see STANDING below)
//
// (1) THE JOIN: MODULE_PARTS['components/BoardEditor.tsx'] names the module and EVERY file in components/board/, and srcText's join of
//     them holds every code line the module had at <base> (a multiset; the split's own added wiring is c13-10g-allow.txt).
// (2) THE READERS: each script that reads the module's TEXT reads it one way - through srcText (the join) or bare (the module's own
//     file) - and every distinctive string or regex literal in that script counts the same on what it reads now as on the file at
//     <base>. A literal whose count moves must be in EXPLAINED below, with the reason it is not a reader's answer changing. A script
//     that names the file but never reads its text is not a reader (it is listed, so a new reader cannot go unseen).
// (3) LIVENESS: a planted edit inside a part, and one inside the module itself, each change a reader's answer;
//     a script that names the file and is in no list fails; an EXPLAINED entry no literal uses fails.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { srcText, MODULE_PARTS } from '../global-css.mjs';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const DESK = path.join(ROOT, 'apps/desktop');
const SRC = path.join(DESK, 'src');
const ts = createRequire(path.join(DESK, 'package.json'))('typescript');
const bi = process.argv.indexOf('--base');
const base = bi > 0 ? process.argv[bi + 1] : null;
// --standing (Fable, Nov 6): the guard for the list run on every main. `--base` is 10g's one-time proof: its claims compare the board
// with the module BEFORE the split, and a later product change to the board (Flux S1 at ab71f1b5 added its mount) was always going to
// move them. Standing runs only what must hold on every main - the join names every part, every script that names the module is in a
// list, every built pattern is named - and their liveness. The base-relative claims and their liveness are not run; their predicates
// are unchanged and `--base` runs them exactly as before.
const STANDING = process.argv.includes('--standing');
// ---- PARKED - SUPERSEDED by --standing (a base is needed only without it). Kept VERBATIM and no longer run:
// if (!base) { console.error('usage: --base <rev>'); process.exit(2); }
if (!base && !STANDING) { console.error('usage: --base <rev> | --standing'); process.exit(2); }
if (base && STANDING) { console.error('--base and --standing are two different proofs: give one'); process.exit(2); }
const MOD = 'components/BoardEditor.tsx';
const LF = (s) => s.replace(/\r\n?/g, '\n');

// the readers, by how they read the module's text (each audited by hand at 10g; see docs/cleanup/c13-10g-notes.md)
const JOIN = ['harness/board-click-create.mjs', 'harness/card-resize-axis.mjs', 'harness/connector-a.mjs', 'harness/deck-rows-logic.mjs',
  'harness/flux-v2.mjs', 'harness/guided-add-scenes.mjs', 'harness/guided-w1.mjs', 'harness/guided-w3.mjs', 'harness/guided-w5.mjs',
  'harness/item207-core.mjs', 'harness/logout-flush.mjs', 'harness/machina-step-source.mjs', 'harness/page-links.mjs',
  'harness/sized-by-hand-logic.mjs', 'harness/theme-fonts-source.mjs', 'harness/walk-open-select.mjs', 'item138-silhouette-proof.mjs',
  'item163-drawer-line-proof.mjs', 'harness/big-projects-1a.mjs',
  // these six read the module's own file until 10g; they read the join now too, so the board has ONE reader (the brief)
  'harness/board-context-menu.mjs', 'harness/box-tombstones.mjs', 'harness/big-projects-2.mjs', 'harness/guided-w2.mjs',
  'harness/help-choose-census.mjs', 'harness/page-scroll-return.mjs'];
const BARE = [];   // none: a bare read of the module is half the board now
// names the file in code but reads no text of it: a browser check's own words, a comment-free label, or a tool that reads by revision
const NOT_A_READER = ['harness/b2.mjs', 'harness/fx7.mjs', 'c13/c13-9-ts-comments.mjs', 'global-css.mjs', 'c13/c13-10g-readers.mjs',
  'typing-latency-readers-guard.mjs',   // walks every file and classifies each DOM-text read by FILE: its own coverage + rot checks prove it
  'c13/c13-10-seams-check.mjs'];   // names the module as MODULE_PARTS's one shipped KEY (A0's successor); reads no text of it

// a literal whose count moves on what its script reads, and why that is not a reader's answer changing: [script, literal source, reason]
const EXPLAINED = [
  // (the first version of this entry said constOf's `^const MIN_PIN_W = ` matched the join once - untested, and false: the join holds
  // `export const`, and 10g's first pair crashed on it. The read is now MEASURED in COMPOSED below; this entry covers only the count.)
  ['harness/card-resize-axis.mjs', '"MIN_PIN_W"', 'the count only: the parts\' import lines name the constant (2 more); its value is read by constOf, measured in COMPOSED'],
  ['harness/flux-v2.mjs', '/([^{}]+)\\{([^{}]*)\\}/g', 'the CSS rule parser, run on index.css, never on the board'],
  ['harness/flux-v2.mjs', '/\\b(boards?|pages?|links?|grafts?|grafted|shelf|schematics?|drawers?|journals?|settings|themes?|tutor|sections?|binder)\\b/i', 'the lexicon words check, run on the deck lexicon, never on the board'],
  ['harness/flux-v2.mjs', '"red: "', "the mutant report's own label"],
  ['harness/guided-w1.mjs', '"./store/boardKind"', 'the module loader list (export * lines it writes), not a read'],
  ['harness/guided-w1.mjs', '/saveBoardBoxes|saveJournalEntry/', 'S4 runs it on store/boardMode.ts'],
  ['harness/guided-w1.mjs', '"cut"', "M1's swipe-plan kind"],
  ['harness/guided-w1.mjs', '/([^{}]+)\\{([^{}]*)\\}/g', 'the CSS rule parser, run on index.css'],
  ['harness/guided-w1.mjs', '/\\b(boards?|pages?|links?|grafts?|grafted|shelf|schematics?|drawers?|journals?|settings|themes?|tutor|sections?|binder)\\b/i', 'the lexicon words check'],
  ['harness/guided-w1.mjs', '/board_kind|home_view|boardKind|homeView/', 'X5 runs it on the server schema'],
  ['harness/guided-w1.mjs', '/homeView|boardKind/', 'X6 runs it on the client sync layer'],
  ['harness/guided-w1.mjs', '/boxes|journalEntries/', 'X6 runs it on the client sync layer'],
  ['harness/guided-w3.mjs', '"voice"', 'a deck step id'],
  ['harness/guided-w3.mjs', '/\\b(boards?|pages?|links?|grafts?|grafted|shelf|schematics?|drawers?|journals?|settings|themes?|tutor|sections?|binder)\\b/i', 'the lexicon words check'],
  ['harness/guided-w3.mjs', "/^import .* from '(.*)';$/gm", "FM2 runs it on the From-my-pages module's own source"],
  ['harness/guided-w3.mjs', '/([^{}]+)\\{([^{}]*)\\}/g', 'the CSS rule parser'],
  ['harness/guided-w5.mjs', '/hasWriterText|bodyIsEmpty|splitCard\\(.*body/g', 'Z4 runs it on deckRewards / useDeckRewards / DeckGaps'],
  ['harness/item207-core.mjs', '/fontFace|fontSize|pageSettings\\.face/', 'run on the server sync.ts'],
  ['harness/item207-core.mjs', '/fontFace|font_face/', 'run on the server migrate.ts'],
  ['harness/logout-flush.mjs', '"flushRegistry"', 'the module loader list'],
  ['harness/theme-fonts-source.mjs', "/'([^']+?)(?: Variable)?'/", 'firstFamily, run on a CSS font-family declaration'],
  ['item163-drawer-line-proof.mjs', '/^import .*persistence/m', 'run on store/pageHome.ts (its presence, not a count)'],
  ...['"deskLexicon"', '"./store/deskLexicon"', '"./store/persistence"', '"./store/grafts"', '"./store/boardKind"', '"./store/guided"']
    .map((s) => ['harness/guided-w2.mjs', s, 'the module loader list (export * lines it writes), not a read']),
  ['harness/help-choose-census.mjs', "/from 'react'|useEffect|addEventListener|document\\.|window\\./", "C8 runs it on decks/helpMeChoose.ts, never on the board"],
];

const parts = MODULE_PARTS[MOD];
const before = STANDING ? null : LF(execFileSync('git', ['show', `${base}:apps/desktop/src/${MOD}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));
const texts = { join: LF(srcText(SRC, MOD)), bare: LF(fs.readFileSync(path.join(SRC, MOD), 'utf8')) };
const results = [];
const res = (name, pass, detail, show = []) => results.push({ name, pass, detail, show });

// (1) the join
const boardDir = fs.readdirSync(path.join(SRC, 'components/board')).map((f) => `components/board/${f}`).sort();
const listed = (parts ?? []).filter((p) => p !== MOD).slice().sort();
res('JOIN-PARTS', !!parts && parts.includes(MOD) && JSON.stringify(listed) === JSON.stringify(boardDir),
  `MODULE_PARTS['${MOD}'] lists the module and ${listed.length} parts; components/board/ holds ${boardDir.length}`,
  boardDir.filter((p) => !listed.includes(p)).map((p) => `not listed: ${p}`));
const codeLines = (t) => t.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim() && !/^import\s/.test(l) && !/^export\s+(type\s+)?(\*|\{[^}]*\})\s+from\s/.test(l)).map((l) => l.replace(/^export (?=(async )?(function|const|let|class|interface|type|enum)\b)/, ''));
const bag = (ls) => { const m = new Map(); for (const l of ls) m.set(l, (m.get(l) || 0) + 1); return m; };
const allow = fs.readFileSync(path.join(ROOT, 'docs/cleanup/c13-10g-allow.txt'), 'utf8').split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
if (!STANDING) {   // JOIN-LINES compares with the module before the split: --base only
  // imports may span lines: drop every line of a multi-line import too
  const strip = (t) => { const out = []; let inImp = false; for (const l of t.split('\n')) { if (inImp) { if (/from\s+['"][^'"]+['"];?\s*$/.test(l)) inImp = false; continue; } if (/^import\s/.test(l) && !/from\s+['"][^'"]+['"];?\s*$/.test(l) && !/^import\s+['"]/.test(l)) { inImp = true; continue; } out.push(l); } return out.join('\n'); };
  const want = bag([...codeLines(strip(before)), ...allow]), got = bag(codeLines(strip(texts.join)));
  const diff = [];
  for (const [l, n] of want) if ((got.get(l) || 0) !== n) diff.push(`${(got.get(l) || 0) - n > 0 ? '+' : '-'} ${l.slice(0, 120)}`);
  for (const [l] of got) if (!want.has(l)) diff.push(`+ ${l.slice(0, 120)}`);
  res('JOIN-LINES', diff.length === 0, `the join holds the module's ${codeLines(strip(before)).length} code lines at ${base} plus the ${allow.length} allowed`, diff.slice(0, 8));
}

// (2) the readers
const SCRIPTS = path.join(DESK, 'scripts');
const namers = execFileSync('git', ['grep', '-l', 'BoardEditor.tsx', '--', 'apps/desktop/scripts'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
  .map((f) => f.slice('apps/desktop/scripts/'.length)).filter((f) => /\.(mjs|cjs|js)$/.test(f))
  .filter((f) => LF(fs.readFileSync(path.join(SCRIPTS, f), 'utf8')).split('\n').some((l) => l.includes('BoardEditor.tsx') && !/^\s*\/\//.test(l)));
function literals(file) {
  const code = fs.readFileSync(path.join(SCRIPTS, file), 'utf8');
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const out = [];
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push({ s: n.text, src: JSON.stringify(n.text) });
    else if (n.kind === ts.SyntaxKind.RegularExpressionLiteral) {
      const t = n.getText(), i = t.lastIndexOf('/');
      try { out.push({ re: new RegExp(t.slice(1, i), t.slice(i + 1).replace('g', '') + 'g'), src: t }); } catch { /* not a JS regex */ }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}
const count = (l, t) => { if (l.re) { let n = 0; for (const _ of t.matchAll(l.re)) { void _; if (++n > 5000) break; } return n; } return l.s.length < 3 ? null : t.split(l.s).length - 1; };
const distinctive = (l, n) => (l.re ? l.src.length >= 14 : l.s.length >= 12) || n <= 3;
function readersRun(tx) {
  const moved = [];
  for (const [mode, list] of [['join', JOIN], ['bare', BARE]]) for (const f of list) for (const l of literals(f)) {
    const b = count(l, before); if (b === null) continue;
    const a = count(l, tx[mode]);
    if ((b === 0 && a === 0) || !distinctive(l, b) || a === b) continue;
    moved.push({ f, mode, src: l.src, b, a });
  }
  const used = new Set();
  const unexplained = moved.filter((m) => { const e = EXPLAINED.findIndex(([f, s]) => f === m.f && s === m.src); if (e >= 0) used.add(e); return e < 0; });
  return { moved, unexplained, stale: EXPLAINED.filter((_, i) => !used.has(i)) };
}
const real = STANDING ? null : readersRun(texts);
const unlisted = namers.filter((f) => ![...JOIN, ...BARE, ...NOT_A_READER].includes(f));
res('READERS-LISTED', unlisted.length === 0, `${namers.length} scripts name ${MOD} in code: ${JOIN.length} read the join, ${BARE.length} read it bare, ${NOT_A_READER.length} read no text of it`, unlisted.map((f) => `in no list: ${f}`));
if (!STANDING) {   // the literal counts compare with the module before the split: --base only
res('READERS-SAME', real.unexplained.length === 0, `every distinctive literal of the ${JOIN.length + BARE.length} readers counts the same now as at ${base}, except ${real.moved.length - real.unexplained.length} explained`,
  real.unexplained.slice(0, 10).map((m) => `${m.f} (${m.mode}): ${m.src.slice(0, 100)}  base ${m.b} now ${m.a}`));
res('EXPLAINED-USED', real.stale.length === 0, `${EXPLAINED.length} explained entries, each one used`, real.stale.map(([f, s]) => `unused: ${f} ${s.slice(0, 80)}`));
}

// (2b) COMPOSED READS: a pattern a reader BUILDS (new RegExp of a non-literal, or a template / + join handed to a text search) is
// invisible to the literal census above - 10g's first pair found one (card-resize-axis constOf, `^const ${name} = `, red on the
// join's `export const`). Every such site in a reader is listed in COMPOSED; a site that runs on the board is MEASURED with the
// names it is called with: the same first capture (or presence) at <base> as now.
const SEARCH = new Set(['indexOf', 'lastIndexOf', 'includes', 'startsWith', 'endsWith', 'split', 'search', 'match', 'matchAll', 'replace', 'replaceAll', 'test', 'exec']);
function composedSites(file) {
  const code = fs.readFileSync(path.join(SCRIPTS, file), 'utf8');
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const out = [];
  const built = (a) => a && !ts.isStringLiteral(a) && !ts.isNoSubstitutionTemplateLiteral(a) && a.kind !== ts.SyntaxKind.RegularExpressionLiteral;
  const textish = (a) => a && (ts.isTemplateExpression(a) || (ts.isBinaryExpression(a) && a.operatorToken.kind === ts.SyntaxKind.PlusToken));
  const visit = (n) => {
    if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'RegExp' && built(n.arguments?.[0])) out.push(n.arguments[0].getText());
    else if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && SEARCH.has(n.expression.name.text) && textish(n.arguments[0])) out.push(n.arguments[0].getText());
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}
// [script, a fragment of the built argument's source that names the site, how many sites it names, how it reads]. A string says why it
// never runs on the board's text; { board: [read, keys, answer] } is MEASURED: answer(text, key) at <base> must equal it now.
const firstCap = (re, t) => { const m = t.match(re); return m ? (m[1] ?? m[0]) : null; };
const notBoard = (why) => why;
const RULING_IDS = [...fs.readFileSync(path.join(ROOT, 'docs/rulings/components-BoardEditor.md'), 'utf8').matchAll(/^## (BoardEditor §\d+)\r?$/gm)].map((m) => m[1]);
const COMPOSED = [
  ['harness/card-resize-axis.mjs', '(?:export )?const ${name} = ', 1,
    { board: ['join', ['MIN_PIN_H', 'MIN_PIN_W'], (t, n) => firstCap(new RegExp(`^(?:export )?const ${n} = ([0-9.]+);`, 'm'), t)] }],
  // S-callers: per FILE over the tree walk (raw reads), on each softDeleteEntry caller's enclosing name; the board's one caller is deleteThisBoard
  ['harness/board-context-menu.mjs', "'\\\\b' + name + '\\\\b'", 1,
    { board: ['bare', ['deleteThisBoard'], (t, n) => t.split('\n').filter((l) => new RegExp('\\b' + n + '\\b').test(l)).map((l) => l.trim()).join(' | ')] }],
  ['harness/board-context-menu.mjs', "'requestDelete\\\\(\\\\s*' + name", 1,
    { board: ['bare', ['deleteThisBoard'], (t, n) => String(t.split('\n').filter((l) => new RegExp('requestDelete\\(\\s*' + n + '\\b').test(l)).length)] }],
  ['harness/board-context-menu.mjs', "(?:const|let)\\\\s+' + name", 1,
    { board: ['bare', ['deleteThisBoard'], (t, n) => String(t.split('\n').filter((l) => new RegExp('^\\s*(?:const|let)\\s+' + n + '\\b|^\\s*(?:async\\s+)?function\\s+' + n + '\\b').test(l)).length)] }],
  // AB4 S4: the rulings entry's id is cited in the board's text - every BoardEditor §n heading, cited at base and now alike
  ['item138-silhouette-proof.mjs', '`[${id}]`', 1, { board: ['join', RULING_IDS, (t, id) => String(t.includes(`[${id}]`))] }],
  ['harness/flux-v2.mjs', "sel + ' {'", 1, notBoard('grab(): a CSS rule by its selector, on index.css')],
  ['harness/flux-v2.mjs', "sel + '{'", 1, notBoard('grab(): a CSS rule by its selector, on index.css')],
  ['harness/flux-v2.mjs', '`--${name}:', 1, notBoard('tok(): a CSS custom property, on a CSS block')],
  ['harness/flux-v2.mjs', '"  --choice: #00C2FF;" + String.fromCharCode(10)', 1, notBoard('a CSS mutant\'s anchor, on index.css')],
  ['harness/flux-v2.mjs', 'sliverSrc + modeStageSrc', 2, notBoard('the searched TEXT (the sliver and ModeStage), not a built pattern')],
  ['harness/guided-w1.mjs', 'a + f', 1, notBoard('the searched TEXT: two lexicon terms (L3)')],
  ['harness/guided-w5.mjs', 'a + f', 1, notBoard('the searched TEXT: two lexicon terms (Q1)')],
  ['harness/guided-w5.mjs', "be + rd('components/DeckGaps.tsx')", 1, notBoard('the searched TEXT (W7: the join and two deck files); its pattern /GoalCelebration/ is a literal the census counts')],
  ['harness/guided-w3.mjs', '`--${name}:', 1, notBoard('tokIn(): a CSS custom property, on index.css')],
  ['harness/item207-core.mjs', '`/${n}`', 3, notBoard("main.tsx's eager font imports")],
  ['harness/item207-core.mjs', '`font-family:', 4, notBoard('the built CSS files')],
  ['harness/theme-fonts-source.mjs', 'page + board + roster', 1, notBoard('the searched TEXT: three font stacks (H)')],
  ['harness/theme-fonts-source.mjs', '`${name}:', 1, notBoard('tokenOf(): a CSS token, on a CSS block')],
  ['item138-silhouette-proof.mjs', '`const ${name}', 1, notBoard('num(): the board aspect constants, on store/persistence.ts')],
  ['item163-drawer-line-proof.mjs', "IN + ' '", 2, notBoard('the lexicon\'s "in" word against a rendered drawer line')],
  // the red-guards batch (17524dba, merged at b15cde4a): CLAIM 0's per-theme successor reads each theme's own "in" word
  ['item163-drawer-line-proof.mjs', "inT + ' '", 2, notBoard('each theme\'s own "in" word against its no-drawer and own-relation forms (CLAIM 0 successor), on the lexicon')],
  ['item163-drawer-line-proof.mjs', "repo.replace(", 1, notBoard('a file path made relative')],
  ['harness/big-projects-1a.mjs', 'block + cascade', 1, notBoard('the searched TEXT: the place block and the cascade panels')],
  ['harness/board-context-menu.mjs', '`/page/${DRAFT}`', 2, notBoard('the location hash, in the browser')],
  ['harness/big-projects-2.mjs', '`binder=${manId}`', 1, notBoard('a New Board href, in the browser')],
  ['harness/help-choose-census.mjs', '`^  ${k}:', 1, notBoard('a lexicon key, on store/deskLexicon.ts')],
  ['harness/help-choose-census.mjs', 'panel + "', 1, notBoard('a script handed to the browser')],
];
function composedRun(tx, table) {
  const sites = [...JOIN, ...BARE].flatMap((f) => composedSites(f).map((src) => ({ f, src })));
  const owners = sites.map((s) => table.filter(([f, key]) => f === s.f && s.src.includes(key)));
  const unlisted = sites.filter((s, i) => owners[i].length !== 1);   // in no entry, or claimed by two
  const miscount = table.filter((e) => owners.filter((o) => o.length === 1 && o[0] === e).length !== e[2]);
  const differs = [];
  for (const [f, key, , how] of table) if (typeof how === 'object' && before !== null) {   // a measured site reads the base: --base only
    const [read, keys, answer] = how.board;
    for (const k of keys) { const b = answer(before, k), a = answer(tx[read], k); if (b !== a || b === null) differs.push(`${f} ${key.slice(0, 40)} [${k}]: base ${b} now ${a}`); }
  }
  return { sites, unlisted, miscount, differs };
}
const comp = composedRun(texts, COMPOSED);
res('COMPOSED-LISTED', comp.unlisted.length === 0 && comp.miscount.length === 0, `${comp.sites.length} built patterns or texts in the readers, each named by exactly one of COMPOSED's ${COMPOSED.length} entries, each entry's count exact`,
  [...comp.unlisted.map((s) => `unlisted or claimed twice: ${s.f} ${s.src.slice(0, 110)}`), ...comp.miscount.map(([f, k, n]) => `miscount: ${f} ${k.slice(0, 60)} (wants ${n})`)]);
if (!STANDING) res('COMPOSED-SAME', comp.differs.length === 0, `every built pattern that runs on the board reads the same at ${base} as now`, comp.differs);

for (const c of results) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}: ${c.detail}`); if (!c.pass) for (const s of c.show) console.log(`        ${s}`); }

// (3) liveness
const live = [];
if (STANDING) { // standing's own liveness for JOIN-PARTS: a board file the join does not name fails it
  const planted = [...boardDir, 'components/board/plantedPart.ts'].sort();
  live.push(['a board file MODULE_PARTS does not name fails JOIN-PARTS', JSON.stringify(listed) !== JSON.stringify(planted)]);
}
if (!STANDING) { // the four liveness checks below read the base (the readers' counts, a measured site): --base only
{ // a part loses a line a join reader reads: big-projects-1a P14's [data-link-entry] lives only in the hooks
  const r = readersRun({ join: texts.join.split('[data-link-entry]').join('[data-gone]'), bare: texts.bare });
  live.push(['a planted edit inside a part changes a join reader\'s answer', r.unexplained.some((m) => m.f === 'harness/big-projects-1a.mjs')]);
}
{ // the module itself loses a line a reader reads: page-scroll-return R1's participatesInWayBack line stays in BoardEditor.tsx
  const r = readersRun({ join: texts.join.split('participatesInWayBack').join('gone'), bare: texts.bare });
  live.push(['a planted edit inside the module itself changes a reader\'s answer', r.unexplained.some((m) => m.f === 'harness/page-scroll-return.mjs')]);
}
}
live.push(['a script that names the file and is in no list fails', [...namers, 'harness/planted.mjs'].filter((f) => ![...JOIN, ...BARE, ...NOT_A_READER].includes(f)).length === 1]);
if (!STANDING) { // the read that crashed 10g's first pair: card-resize-axis's constOf as it stood (`^const ${name} = `) must read differently on the join
  const old = COMPOSED.map((e) => (e[0] === 'harness/card-resize-axis.mjs'
    ? [e[0], e[1], e[2], { board: ['join', ['MIN_PIN_H', 'MIN_PIN_W'], (t, n) => firstCap(new RegExp(`^const ${n} = ([0-9.]+);`, 'm'), t)] }] : e));
  live.push(["card-resize-axis's pre-10g constOf (`^const ${name} = `) fails COMPOSED-SAME on the join", composedRun(texts, old).differs.some((d) => d.startsWith('harness/card-resize-axis.mjs'))]);
}
{ // a built pattern no entry names fails COMPOSED-LISTED
  live.push(['a built pattern that no COMPOSED entry names fails', composedRun(texts, COMPOSED.filter((e) => e[1] !== '`binder=${manId}`')).unlisted.length === 1]);
}
if (!STANDING) { const r = readersRun(texts); live.push(['an explained entry no literal uses fails', EXPLAINED.concat([['harness/flux-v2.mjs', '"planted"', '-']]).length - (EXPLAINED.length - r.stale.length) === 1]); }
for (const [what, red] of live) console.log(`${red ? 'PASS' : 'FAIL'}  LIVENESS: ${what}`);

const all = [...results.map((c) => c.pass), ...live.map(([, r]) => r)];
const passed = all.filter(Boolean).length;
const mode = STANDING ? ' [standing]' : '';
console.log(passed === all.length ? `\nC13-10G READERS${mode}: PASS (${all.length} checks)` : `\nC13-10G READERS${mode}: FAIL - ${all.length - passed}/${all.length} failed`);
process.exit(passed === all.length ? 0 : 1);
