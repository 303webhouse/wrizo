#!/usr/bin/env node
// #13 step 10g: every source reader of components/BoardEditor.tsx answers the same after the split. Browserless.
//
//   node apps/desktop/scripts/c13/c13-10g-readers.mjs --base <rev>
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
if (!base) { console.error('usage: --base <rev>'); process.exit(2); }
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
  'typing-latency-readers-guard.mjs'];   // the last walks every file and classifies each DOM-text read by FILE: its own coverage + rot checks prove it

// a literal whose count moves on what its script reads, and why that is not a reader's answer changing: [script, literal source, reason]
const EXPLAINED = [
  ['harness/card-resize-axis.mjs', '"MIN_PIN_W"', 'the hooks import the constant by name; constOf reads `^const MIN_PIN_W = ` (multiline), which the join holds once'],
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
const before = LF(execFileSync('git', ['show', `${base}:apps/desktop/src/${MOD}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));
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
{
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
const real = readersRun(texts);
const unlisted = namers.filter((f) => ![...JOIN, ...BARE, ...NOT_A_READER].includes(f));
res('READERS-LISTED', unlisted.length === 0, `${namers.length} scripts name ${MOD} in code: ${JOIN.length} read the join, ${BARE.length} read it bare, ${NOT_A_READER.length} read no text of it`, unlisted.map((f) => `in no list: ${f}`));
res('READERS-SAME', real.unexplained.length === 0, `every distinctive literal of the ${JOIN.length + BARE.length} readers counts the same now as at ${base}, except ${real.moved.length - real.unexplained.length} explained`,
  real.unexplained.slice(0, 10).map((m) => `${m.f} (${m.mode}): ${m.src.slice(0, 100)}  base ${m.b} now ${m.a}`));
res('EXPLAINED-USED', real.stale.length === 0, `${EXPLAINED.length} explained entries, each one used`, real.stale.map(([f, s]) => `unused: ${f} ${s.slice(0, 80)}`));

for (const c of results) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}: ${c.detail}`); if (!c.pass) for (const s of c.show) console.log(`        ${s}`); }

// (3) liveness
const live = [];
{ // a part loses a line a join reader reads: big-projects-1a P14's [data-link-entry] lives only in the hooks
  const r = readersRun({ join: texts.join.split('[data-link-entry]').join('[data-gone]'), bare: texts.bare });
  live.push(['a planted edit inside a part changes a join reader\'s answer', r.unexplained.some((m) => m.f === 'harness/big-projects-1a.mjs')]);
}
{ // the module itself loses a line a reader reads: page-scroll-return R1's participatesInWayBack line stays in BoardEditor.tsx
  const r = readersRun({ join: texts.join.split('participatesInWayBack').join('gone'), bare: texts.bare });
  live.push(['a planted edit inside the module itself changes a reader\'s answer', r.unexplained.some((m) => m.f === 'harness/page-scroll-return.mjs')]);
}
live.push(['a script that names the file and is in no list fails', [...namers, 'harness/planted.mjs'].filter((f) => ![...JOIN, ...BARE, ...NOT_A_READER].includes(f)).length === 1]);
{ const r = readersRun(texts); live.push(['an explained entry no literal uses fails', EXPLAINED.concat([['harness/flux-v2.mjs', '"planted"', '-']]).length - (EXPLAINED.length - r.stale.length) === 1]); }
for (const [what, red] of live) console.log(`${red ? 'PASS' : 'FAIL'}  LIVENESS: ${what}`);

const all = [...results.map((c) => c.pass), ...live.map(([, r]) => r)];
const passed = all.filter(Boolean).length;
console.log(passed === all.length ? `\nC13-10G READERS: PASS (${all.length} checks)` : `\nC13-10G READERS: FAIL - ${all.length - passed}/${all.length} failed`);
process.exit(passed === all.length ? 0 : 1);
