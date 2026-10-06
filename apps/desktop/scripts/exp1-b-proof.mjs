// EXPERIMENT 1 (b) — THE POSITION-PRESERVING STRIPPER, PROVEN AGAINST main's ONE READER.
//
// Browserless. No box turn, no harness, no browser.
// Run: node apps/desktop/scripts/exp1-b-proof.mjs
//
// ── WHAT THIS FILE USED TO ASK, AND WHY THAT QUESTION IS RETIRED ──────────────────
// PARKED, quoted verbatim and no longer asserted:
//
//   "CLAIM 1 asks ONE question: is `visibleText` byte-identical to THE CHAIN IT
//    REPLACED? That chain is the one on the commit this work was derived from. Using
//    `origin/main` instead made the proof answer a DIFFERENT question — 'does my
//    replay match whatever main's stripper is right now'"
//
// That was the right question while `visibleText` carried its OWN copy of the rules:
// a replay has to be pinned to the thing it replayed, or it drifts. The copy is gone.
// `visibleText` now calls `readLead` and `readMarks` — FIX's `store/markRuns.ts`, the
// one reader the decorator paints from and `hiddenMarks.ts` computes the caret from —
// so there is no replay left to pin, and pinning to a merge-base would now be the
// error rather than the fix.
//
// THE SUCCESSOR QUESTION, which is strictly stronger: does `visibleText(raw).text`
// equal `stripMarkdownConventions(raw)`, main's own stripper, TODAY? Both map the same
// reader over the same lines, so equality is structural — and that is the point. A
// future edit that gives either one a private rule breaks it, which a replay-vs-base
// proof could never see.
//
// ⛔ AND THE READER IS PINNED BY CONTENT, NOT BY CLAIM. Fable asked for a proof
// against 4d3c84e (PR #7). This file verifies that `markRuns.ts` in the working tree
// is byte-identical to its blob at that commit, so "proven against 4d3c84e" is
// measured rather than asserted — origin/main has already moved past it once.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = join(desktop, '..', '..');
const require = createRequire(join(repo, 'apps/server/package.json'));
const ts = require('typescript');
const PINNED = '4d3c84e';

let failures = 0;
const ok = (name, pass, detail = '') => {
  if (!pass) failures += 1;
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? `  ${detail}` : ''}`);
};
const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'buffer' });

const tmp = join(tmpdir(), 'wrizo-exp1-b-proof');
mkdirSync(tmp, { recursive: true });
const tr = (src) => ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

console.log('EXPERIMENT 1 (b) — THE STRIPPER, ON main\'s ONE READER\n');

// ===========================================================================
// CLAIM 0 — THE SUBJECT IS THE COMMIT FABLE NAMED
// ===========================================================================
{
  const relMark = 'apps/desktop/src/store/markRuns.ts';
  const atPinned = git('rev-parse', `${PINNED}:${relMark}`).toString().trim();
  const inTree = git('hash-object', relMark).toString().trim();
  ok(`CLAIM 0: markRuns.ts in this tree is byte-identical to its blob at ${PINNED} — so every claim below is measured against the reader Fable named, not against whatever main holds now`,
    atPinned === inTree, JSON.stringify({ [PINNED]: atPinned.slice(0, 12), tree: inTree.slice(0, 12) }));
}

// --- the REAL modules, transpiled. draftFormat imports markRuns and nothing else ---
writeFileSync(join(tmp, 'markRuns.mjs'), tr(readFileSync(join(desktop, 'src/store/markRuns.ts'), 'utf8')), 'utf8');
{
  let js = tr(readFileSync(join(desktop, 'src/store/draftFormat.ts'), 'utf8'));
  const before = js;
  js = js.replace(/from '\.\/markRuns'/g, "from './markRuns.mjs'");
  if (js === before) {
    console.log("FAIL — draftFormat.ts no longer imports './markRuns'. That is the whole subject of this proof; refusing to continue.");
    process.exit(1);
  }
  // ⚠ STRIP THE WHOLE STATEMENT, not just its `from` clause. The first version of
  // this guard removed `from './markRuns.mjs'` and then tested for /^import /, which
  // still matched the very line it had just edited — the guard fired on its own
  // handiwork and refused a clean file.
  const otherImports = js.replace(/^import[^;]*?from '\.\/markRuns\.mjs';$/gm, '');
  if (/^import /m.test(otherImports)) {
    console.log('FAIL — draftFormat.ts has grown an import this proof does not model. Read it before trusting anything below.');
    process.exit(1);
  }
  writeFileSync(join(tmp, 'draftFormat.mjs'), js, 'utf8');
}
const D = await import(pathToFileURL(join(tmp, 'draftFormat.mjs')).href);
const M = await import(pathToFileURL(join(tmp, 'markRuns.mjs')).href);

// ===========================================================================
// THE CORPUS — every rule the two readers have, and the cases that broke things
// ===========================================================================
const CORPUS = [
  'plain prose with no conventions at all',
  '# A heading',
  '## A smaller heading',
  '\tan indented first line',
  '\t\ttwo levels of indent',
  '>< centred',
  '>> right aligned',
  '>| a block-indented paragraph',
  '>| >| two levels of block',
  '> a quote',
  '- a bullet',
  '-+ a hollow bullet',
  '-= a square bullet',
  '**bold** and *italic* and __underlined__ and ~~struck~~',
  '***bold italic*** together',
  'nested **outer *inner* outer** done',
  // ⚠ THE UNPAIRED CASE, which is the whole reason a reader exists rather than a regex.
  '2 * 3 * 4 is arithmetic, not italics',
  'an empty pair **** sits at a bare caret',
  'a crossing attempt **a *b** c* keeps something literal',
  '> - **a quoted bullet in bold**',
  '\t>| >< **everything at once** on one line',
  'trailing spaces and a marker at the end **x**',
  '**',
  '*',
  '',
  'line one\nline two\nline three',
  '# head\n\n\tindented\n> quoted **bold**\n\nlast',
  'a page that ends in a newline\n',
  'two blank lines\n\n\nand text',
];

// ===========================================================================
// CLAIM 1 — THE SUCCESSOR: visibleText's text IS main's stripper's output
// ===========================================================================
{
  let bad = null;
  for (const raw of CORPUS) {
    const a = D.visibleText(raw).text;
    const b = D.stripMarkdownConventions(raw);
    if (a !== b) { bad = { raw, visibleText: a, stripMarkdownConventions: b }; break; }
  }
  ok(`CLAIM 1: visibleText().text === stripMarkdownConventions() over all ${CORPUS.length} corpus cases — the same reader, line for line, so the map carries no private rules`,
    bad === null, bad ? JSON.stringify(bad) : '');
}

// ===========================================================================
// CLAIM 1b — AND OVER FUZZ, because a corpus only covers what I thought of
// ===========================================================================
{
  // Deterministic: the same inputs every run, so a red is reproducible.
  let seed = 20261005;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const ALPHA = ['a', 'b', ' ', '*', '_', '~', '#', '>', '-', '|', '<', '\t', '\n', '+', '='];
  let n = 0, bad = null;
  for (let i = 0; i < 4000 && !bad; i += 1) {
    let s = '';
    const len = Math.floor(rnd() * 24);
    for (let k = 0; k < len; k += 1) s += ALPHA[Math.floor(rnd() * ALPHA.length)];
    n += 1;
    const a = D.visibleText(s).text;
    const b = D.stripMarkdownConventions(s);
    if (a !== b) bad = { raw: s, visibleText: a, stripMarkdownConventions: b };
  }
  ok(`CLAIM 1b: and over ${n} fuzz inputs drawn from the readers' own alphabet (markers, directives, tabs, newlines)`,
    bad === null, bad ? JSON.stringify(bad) : `${n} inputs`);
}

// ===========================================================================
// CLAIM 2 — THE MAP'S INVARIANTS. It only ever deletes.
// ===========================================================================
{
  const problems = [];
  for (const raw of CORPUS) {
    const v = D.visibleText(raw);
    if (v.map.length !== v.text.length + 1) problems.push(['length', raw, v.map.length, v.text.length + 1]);
    if (v.map[v.map.length - 1] !== raw.length) problems.push(['sentinel', raw, v.map[v.map.length - 1], raw.length]);
    for (let i = 1; i < v.map.length; i += 1) if (v.map[i] <= v.map[i - 1]) { problems.push(['monotone', raw, i]); break; }
    // EVERY visible character is the raw character it points at. This is the one that
    // catches an off-by-one in the lead/marker arithmetic, and it is the arithmetic a
    // second reader gets wrong: readMarks' offsets are relative to the line AFTER the
    // lead, so they need `lead.length` and the line start added.
    for (let i = 0; i < v.text.length; i += 1) if (raw[v.map[i]] !== v.text[i]) { problems.push(['identity', raw, i, raw[v.map[i]], v.text[i]]); break; }
  }
  ok('CLAIM 2: the map is strictly increasing, has text.length + 1 entries, ends at raw.length, and every visible character IS the raw character it points at',
    problems.length === 0, problems.length ? JSON.stringify(problems.slice(0, 3)) : '');
}

// ===========================================================================
// CLAIM 3 — IMPORT, NOT REPLAY. Asserted on the source, with comments blanked.
// ===========================================================================
{
  const src = readFileSync(join(desktop, 'src/store/draftFormat.ts'), 'utf8');
  // A SOURCE CHECK READS CODE, NOT COMMENTS (house law, earned three times). This
  // file's own prose quotes the retired regexes, so a matcher that read prose would
  // find the description and report the thing it describes.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const fnStart = code.indexOf('export function visibleText(');
  const fnEnd = code.indexOf('\nexport ', fnStart + 10);
  const body = code.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);

  ok('CLAIM 3a: visibleText calls readLead and readMarks — the lead and the markers both come from the one reader',
    /\breadLead\s*\(/.test(body) && /\breadMarks\s*\(/.test(body));
  ok('CLAIM 3b ⛔ and its body contains NO regex literal of its own — the replay that drifted is gone, not merely unused',
    !/\/(?![/*])(?:[^/\\\n]|\\.)+\/[gimsuy]*/.test(body), JSON.stringify((body.match(/\/(?![/*])(?:[^/\\\n]|\\.)+\/[gimsuy]*/g) || []).slice(0, 3)));
  ok('CLAIM 3c: and the old LINE_PREFIX_RULES table is gone from the file entirely',
    !/LINE_PREFIX_RULES/.test(code));
  ok('CLAIM 3d (the instrument): the blanked source still holds real code, so 3b searched something',
    body.length > 400 && code.includes('export function stripMarkdownConventions'),
    JSON.stringify({ bodyChars: body.length }));
}

// ===========================================================================
// CLAIM 4 — PER LINE, the map agrees with markRuns' own stripLine
// ===========================================================================
{
  const problems = [];
  for (const raw of CORPUS) {
    const want = raw.split('\n').map(M.stripLine).join('\n');
    const got = D.visibleText(raw).text;
    if (want !== got) problems.push({ raw, want, got });
  }
  ok('CLAIM 4: and line by line it equals markRuns.stripLine — asserted against the READER directly, not only against the wrapper, so a change in the wrapper cannot hide a change in the map',
    problems.length === 0, problems.length ? JSON.stringify(problems[0]) : '');
}

// ===========================================================================
// CLAIM 5 / 6 — THE ROUND TRIP, AND THE ANCHOR TINT'S OWN SPAN
// ===========================================================================
{
  const spanProblems = [];
  const tintProblems = [];
  for (const raw of CORPUS) {
    const v = D.visibleText(raw);
    for (let start = 0; start < v.text.length; start += 1) {
      for (let end = start + 1; end <= v.text.length; end += 1) {
        const [rs, re] = D.toRawRange(v, start, end);
        // 5 — the raw range must begin and end on the right raw characters.
        if (raw[rs] !== v.text[start]) { spanProblems.push(['start', raw, start, end, rs]); break; }
        // 6 ⛔ THE TINT'S OWN QUESTION, REFORMULATED — AND THE FIRST VERSION WAS A
        // WRONG CHECK, which is worth recording because it looked right.
        //
        // It asserted `visibleText(raw.slice(rs, re)).text === v.text.slice(start, end)`
        // and went red on `**bold**`: the span "bold " maps to the raw slice "bold** ",
        // whose `**` has LOST ITS OPENING PARTNER, so readMarks correctly refuses to
        // pair it and keeps it literal. The reader is context-sensitive on purpose —
        // that is the whole reason "2 * 3 * 4" keeps its stars — so re-stripping a
        // slice asks a different question than stripping the line it came from. The
        // code was right; the check re-contextualised its own input.
        //
        // The honest invariant is about COVERAGE, and it is stronger: the raw range
        // must begin at the span's first visible character, end immediately after its
        // last (so no trailing marker is swept in), and the VISIBLE characters it
        // covers must be exactly the span's. Hidden markers sitting BETWEEN two of
        // them are necessarily inside the range — they are zero-width, so the tint
        // reads as continuous — and that is correct rather than a defect.
        if (rs !== v.map[start] || re !== v.map[end - 1] + 1) {
          tintProblems.push({ raw, start, end, rs, re, wantRs: v.map[start], wantRe: v.map[end - 1] + 1 });
          break;
        }
        const coveredVisible = [];
        for (let i = 0; i < v.text.length; i += 1) if (v.map[i] >= rs && v.map[i] < re) coveredVisible.push(i);
        if (coveredVisible.length !== end - start || coveredVisible[0] !== start || coveredVisible[coveredVisible.length - 1] !== end - 1) {
          tintProblems.push({ raw, start, end, covered: coveredVisible.slice(0, 8), want: [start, end - 1] });
          break;
        }
        // and the inverse maps home
        if (D.toVisibleOffset(v, rs) !== start) { spanProblems.push(['inverse', raw, start, rs]); break; }
      }
      if (spanProblems.length || tintProblems.length) break;
    }
  }
  ok('CLAIM 5: every visible span maps to a raw range that starts on the same character, and toVisibleOffset maps it home again',
    spanProblems.length === 0, spanProblems.length ? JSON.stringify(spanProblems.slice(0, 2)) : '');
  ok("CLAIM 6 ⛔ THE ANCHOR TINT: a visible span’s raw range starts on its first visible character, ends immediately after its last, and covers EXACTLY that span’s visible characters — so the tint takes the words the writer chose and no marker beyond them",
    tintProblems.length === 0, tintProblems.length ? JSON.stringify(tintProblems.slice(0, 2)) : '');
}

// ===========================================================================
// CLAIM 7 — HIDDEN MARKERS: the DOM half, which is where this got dangerous
// ===========================================================================
{
  const anchors = readFileSync(join(desktop, 'src/store/anchors.ts'), 'utf8');
  const aCode = anchors.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const deco = readFileSync(join(desktop, 'src/store/draftDecoration.ts'), 'utf8');

  ok('CLAIM 7a: anchors.ts takes DOM positions from main\'s one DOM reader (selectionEnds / domPointFor)',
    /\bselectionEnds\s*\(/.test(aCode) && /\bdomPointFor\s*\(/.test(aCode));
  ok('CLAIM 7b ⛔ and has NO createTreeWalker of its own — the second reader is removed, not left beside the first',
    !/createTreeWalker/.test(aCode), JSON.stringify((aCode.match(/createTreeWalker/g) || []).length));
  ok('CLAIM 7c: anchors.ts never treats a DOM offset as a VISIBLE offset — every visible offset it produces comes through toVisibleOffset',
    /toVisibleOffset\s*\(/.test(aCode));

  // THE PREMISE THE WHOLE REWIRE RESTS ON, asserted against main's source rather than
  // believed: the decorator WRAPS markers, so the DOM still contains them and DOM text
  // is RAW text. If it ever deleted them, every map in this file would be wrong.
  ok('CLAIM 7d ⛔ THE PREMISE: the decorator WRAPS hidden markers in a span (md-mark-hidden) rather than deleting them — which is why DOM text is RAW text and the map is needed at all',
    /md-mark-hidden/.test(deco));
  // And the defect the rewire fixed: the EOF guard is a real character in the DOM.
  ok('CLAIM 7e: the editor appends an EOF-guard character when the text ends in a newline — the reason the retired `textContent !== rawText` guard would have refused on any page ending in a blank line, silently killing the menu\'s captured selection',
    /md-eof-guard/.test(deco) && /endsWith\('\\n'\)/.test(deco));
  ok('CLAIM 7f: and readEditorPlainText removes ONLY that guard, which is what makes selectionEnds\' offsets RAW offsets the map can take',
    /EOF_GUARD/.test(deco) && /export function readEditorPlainText/.test(deco));
}

console.log('\nSTATED BOUNDS — not provable here:');
console.log('  · that the tint PAINTS, and still paints after a keystroke — the box (exp1.mjs / exp1-paint.mjs)');
console.log('  · that a real selection in a real editor yields the offsets CLAIM 7 reasons about — the box');
console.log('  · CLAIM 7 is a SOURCE check on the DOM wiring; it proves the seam is used, not that the browser agrees');

console.log('\n' + (failures === 0
  ? 'EXP1 (b) PROOF: CLEAN — the stripper is the reader\'s, and the map holds'
  : `EXP1 (b) PROOF: ${failures} FAILURE(S)`));
process.exitCode = failures === 0 ? 0 : 1;
