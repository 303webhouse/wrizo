// ITEM 154 — THE REWRITE.
//
// Turns a silent in-string act into a NAMED FAILURE at the site — never a
// removed guard. Two shapes, both from item 151's own S0 example:
//
//   optional chain    RECEIVER?.VERB(ARGS)
//     ->  (() => { const __t = RECEIVER; if (!__t) throw new Error(MSG); return __t.VERB(ARGS); })()
//   if-guard          if (X) STATEMENT
//     ->  if (!X) throw new Error(MSG);\nSTATEMENT
//
// The optional-chain message NAMES THE SELECTOR (`no click target:
// document.querySelector('.wz-sliver-grip')`), because evalJs surfaces an
// in-page throw as `page eval: {exceptionDetails}` and a red that does not
// say WHICH target was missing is a red nobody can diagnose across 130 sites.
//
// WHAT THE FIRST BUILD OF THIS TOOL GOT WRONG, kept on the record:
//   - It converted every syntactic match. Reading the sites showed three
//     different things wear this syntax — silent acts, probe-and-report
//     guards, and expected-absent / control-flow guards — and a throw on
//     the last two turns a green check red (sc1's Typewriter probe expects
//     the control ABSENT). Exemptions are now a NAMED, per-site table
//     (item154-exemptions.mjs), each matching exactly one site.
//   - It skipped every source with a live `${...}` interpolation, because
//     collapsing such a literal to a static string would freeze the other
//     expressions at census-time values. It now edits THOSE sources in
//     place, at RAW offsets inside ONE literal piece, leaving every
//     `${...}` byte-for-byte untouched; an optional chain whose receiver
//     CONTAINS an interpolation is handled by inserting a prefix before the
//     receiver and replacing only the `?.verb()` tail — the receiver text is
//     never copied, so the live expression is never disturbed.
//
// VERIFICATION IS BY BYTE COMPARISON OF THE EXTRACTED ARGUMENT, never "it
// still parses". After every write the file is RE-READ, and for EVERY
// evalJs argument in it (not just the edited ones): an edited argument must
// equal the exact text this tool intended, character for character, with
// its `${...}` expressions unchanged; an UNEDITED argument must be
// byte-identical to before; and the file with every evalJs argument blanked
// out must be byte-identical to the original's — proving nothing OUTSIDE an
// argument moved. A parse of garbage is a parse (the census/rewrite tools
// also compile every rewritten inner text and the whole outer file, but
// that is a separate question from whether the bytes are the intended ones).
//
// Run: node scripts/item154-rewrite.mjs [--dry-run]   (from apps/desktop;
// static analysis only — no browser, no box turn)
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
import { EXEMPTIONS, MANUAL_REWRITES, findExemption, findManual } from './item154-exemptions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = path.join(HERE, 'harness');
const DRY_RUN = process.argv.includes('--dry-run');

const VERBS = new Set(['click', 'focus', 'blur', 'dispatchEvent', 'scrollIntoView', 'submit']);
const PH = '__ITEM154_X__';

// ---------------------------------------------------------------------------
// cooked text -> the RAW form to splice into a template literal. Written with
// split/join, never a regex, and SELF-TESTED below by parsing the result back
// through TypeScript's own tokenizer (item 152: an escape eaten anywhere in a
// pipeline either breaks the file or silently matches nothing — so this is
// executed against real input at startup, not trusted because it parses).
// ---------------------------------------------------------------------------
function cookedToRaw(s) {
  return s.split('\\').join('\\\\').split('`').join('\\`').split('${').join('\\${');
}

function selfTestEncoder() {
  const samples = ['plain', 'back\\slash', 'tick`tick', 'dollar${brace}', 'quote"and\'single', 'mixed \\`${x}\\ end', 'line\nbreak', '\\"'];
  for (const s of samples) {
    const src = '`' + cookedToRaw(s) + '`';
    const sf = ts.createSourceFile('t.js', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const lit = sf.statements[0] && sf.statements[0].expression;
    if (!lit || !ts.isNoSubstitutionTemplateLiteral(lit) || lit.text !== s) {
      throw new Error('cookedToRaw self-test FAILED for ' + JSON.stringify(s) + ' -> ' + JSON.stringify(lit && lit.text));
    }
  }
}
selfTestEncoder();

// ---------------------------------------------------------------------------
// PASS 1 — every evalJs call site, with its argument's extracted text.
// ---------------------------------------------------------------------------
function extractSites(text, filePath) {
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const sites = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isEvalJs = (ts.isPropertyAccessExpression(callee) && callee.name.text === 'evalJs') || (ts.isIdentifier(callee) && callee.text === 'evalJs');
      if (isEvalJs && node.arguments.length > 0) {
        const arg = node.arguments[0];
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const site = { line: line + 1, arg, kind: 'other', parse: null, pieces: null, interp: [] };
        if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
          site.kind = 'static';
          site.parse = arg.text;
        } else if (ts.isTemplateExpression(arg)) {
          site.kind = 'template';
          const pieces = [];
          let joined = '';
          const add = (piece, isTail) => {
            const cooked = piece.text;
            const nodeStart = piece.getStart(sf);
            const nodeEnd = piece.getEnd();
            // head "`...${"  middle "}...${"  tail "}...`" — strip the delimiters
            const rawStart = nodeStart + 1;
            const rawEnd = isTail ? nodeEnd - 1 : nodeEnd - 2;
            const raw = text.slice(rawStart, rawEnd);
            // EVERY harness file is CRLF, and a template literal's cooked text
            // normalises CRLF to LF — so a multi-line piece has raw != cooked
            // for that reason alone. Accept it ONLY when every newline in the
            // raw text is a CRLF and normalising them reproduces the cooked
            // text exactly (a mixed or escaped piece is still refused), and
            // remember it so offsets and inserted newlines can be mapped.
            const exact = raw === cooked;
            const nl = raw.split('\n').length - 1;
            const crnl = raw.split('\r\n').length - 1;
            const crlf = !exact && nl > 0 && nl === crnl && raw.split('\r\n').join('\n') === cooked;
            pieces.push({ ps: joined.length, pe: joined.length + cooked.length, rawStart, rawEnd, cooked, rawEqualsCooked: exact || crlf, crlf });
            joined += cooked;
          };
          add(arg.head, false);
          arg.templateSpans.forEach((span, i) => {
            site.interp.push(span.expression.getText(sf));
            joined += PH;
            add(span.literal, i === arg.templateSpans.length - 1);
          });
          site.parse = joined;
          site.pieces = pieces;
        }
        sites.push(site);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { sf, sites };
}

// ---------------------------------------------------------------------------
// PASS 2 — offender candidates inside one extracted text.
// ---------------------------------------------------------------------------
function consequentThrows(node) {
  let found = false;
  const visit = (n) => { if (found) return; if (ts.isThrowStatement(n)) { found = true; return; } ts.forEachChild(n, visit); };
  visit(node);
  return found;
}

function verbCallsIn(node, out) {
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && VERBS.has(n.expression.name.text)) out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(node);
}

// Same definition as the census: the walk starts at the ACCESS, so a lone
// optional CALL on a non-optional access (`__t.focus?.()`) is not a silent
// target-absent act and is never re-flagged in this tool's own output.
function hasOptionalLink(callExpr) {
  let n = callExpr.expression;
  while (n) {
    if (n.questionDotToken) return true;
    if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n)) n = n.expression;
    else break;
  }
  return false;
}

function display(text) {
  const one = text.split(PH).join('*').split('\n').map((s) => s.trim()).join(' ');
  return one.length > 100 ? one.slice(0, 100) + '...' : one;
}

function analyze(parseText) {
  let sf;
  try { sf = ts.createSourceFile('x.js', parseText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS); }
  catch { return { ok: false, items: [], flagged: [] }; }
  const items = [];
  const flagged = [];

  const calls = [];
  verbCallsIn(sf, calls);
  for (const call of calls) {
    if (!hasOptionalLink(call)) continue;
    const access = call.expression;
    // `x?.focus?.()` keeps its optional CALL: only the missing-TARGET case
    // becomes a named failure; whether the method itself exists is left
    // exactly as the author wrote it.
    const optionalCall = !!call.questionDotToken;
    if (!access.questionDotToken) { flagged.push(`optional chain deeper than the verb access at "${display(call.getText())}"`); continue; }
    const receiver = access.expression;
    let deeper = false;
    for (let bn = receiver; bn; ) {
      if (bn.questionDotToken) deeper = true;
      if (ts.isPropertyAccessExpression(bn) || ts.isElementAccessExpression(bn) || ts.isCallExpression(bn)) bn = bn.expression; else break;
    }
    if (deeper) { flagged.push(`nested optional chain at "${display(call.getText())}" — needs a human read`); continue; }
    const receiverText = receiver.getText();
    if (receiverText.includes('await')) { flagged.push(`receiver contains await at "${display(call.getText())}"`); continue; }
    const verb = access.name.text;
    const args = call.arguments.map((a) => a.getText());
    const msg = `no ${verb} target: ${display(receiverText)}`;
    const suffix = `; if (!__t) throw new Error(${JSON.stringify(msg)}); return __t.${verb}${optionalCall ? '?.' : ''}(${args.join(', ')}); })()`;
    items.push({
      kind: 'optional',
      what: `${verb} <- ${display(receiverText)}`,
      argsHavePH: args.some((a) => a.includes(PH)),
      edits: [
        { start: receiver.getStart(sf), end: receiver.getStart(sf), cooked: '(() => { const __t = ' },
        { start: receiver.getEnd(), end: call.getEnd(), cooked: suffix },
      ],
    });
  }

  const visitIf = (n) => {
    if (ts.isIfStatement(n)) {
      const cond = n.expression.getText();
      const inner = [];
      verbCallsIn(n.thenStatement, inner);
      const hit = inner.some((c) => {
        if (hasOptionalLink(c)) return false;
        const base = c.expression.expression.getText();
        return base === cond || base.startsWith(cond + '.');
      });
      if (hit && !consequentThrows(n.thenStatement)) {
        if (n.elseStatement) flagged.push(`if-guard with an ELSE branch at "if (${display(cond)})" — the rewrite would drop it`);
        else if (!Array.isArray(n.parent.statements)) flagged.push(`if-guard not directly in a statement list at "if (${display(cond)})"`);
        else if (ts.isBlock(n.thenStatement) && n.thenStatement.statements.length !== 1) flagged.push(`multi-statement if-guard body at "if (${display(cond)}) {...}" — needs a human read`);
        else {
          const body = ts.isBlock(n.thenStatement) ? n.thenStatement.statements[0].getText() : n.thenStatement.getText();
          const cooked = `if (!${cond}) throw new Error(${JSON.stringify('no ' + display(cond) + ' target')});\n${body}`;
          items.push({
            kind: 'if',
            what: `if (${display(cond)}) ...`,
            argsHavePH: false,
            edits: [{ start: n.getStart(sf), end: n.getEnd(), cooked }],
          });
        }
      }
    }
    ts.forEachChild(n, visitIf);
  };
  visitIf(sf);

  return { ok: true, items, flagged };
}

function applyEdits(text, edits) {
  const sorted = [...edits].sort((a, b) => (b.start - a.start) || (b.end - a.end));
  let out = text;
  for (const e of sorted) out = out.slice(0, e.start) + (e.replacement ?? e.cooked) + out.slice(e.end);
  return out;
}

function overlaps(edits) {
  const s = [...edits].sort((a, b) => (a.start - b.start) || (a.end - b.end));
  for (let i = 1; i < s.length; i += 1) {
    if (s[i].start < s[i - 1].end || s[i].start === s[i - 1].start) return true;
  }
  return false;
}

function countNewlines(s, upTo) {
  let n = 0;
  for (let i = 0; i < upTo; i += 1) if (s[i] === '\n') n += 1;
  return n;
}

function mapToRaw(site, start, end) {
  for (const p of site.pieces) {
    if (p.ps <= start && end <= p.pe) {
      if (!p.rawEqualsCooked) return { err: 'the literal piece contains escapes (raw != cooked)' };
      // In a CRLF piece each cooked "\n" is TWO raw characters, so a cooked
      // offset k lands at k + (the number of newlines before it).
      const at = (k) => (p.crlf ? k + countNewlines(p.cooked, k) : k);
      return { rawStart: p.rawStart + at(start - p.ps), rawEnd: p.rawStart + at(end - p.ps), crlf: p.crlf };
    }
  }
  return { err: 'the edit would touch a live ${...} interpolation' };
}

// Every evalJs argument blanked out — proves nothing OUTSIDE an argument moved.
function skeleton(text, filePath) {
  const { sf, sites } = extractSites(text, filePath);
  const spans = sites.map((s) => [s.arg.getStart(sf), s.arg.getEnd()]).sort((a, b) => a[0] - b[0]);
  let out = '';
  let cursor = 0;
  for (const [s, e] of spans) {
    if (s < cursor) continue; // nested inside a previous argument
    out += text.slice(cursor, s) + '';
    cursor = e;
  }
  return out + text.slice(cursor);
}

function bareLf(text) {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) if (text[i] === '\n' && text[i - 1] !== '\r') n += 1;
  return n;
}

function sameList(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

// ---------------------------------------------------------------------------
// RUN
// ---------------------------------------------------------------------------
const files = readdirSync(HARNESS_DIR).filter((f) => f.endsWith('.mjs')).sort();
const filesChanged = [];
const flaggedReport = [];
const exemptReport = [];
const rewrittenBy = { optionalStatic: 0, optionalTemplate: 0, ifStatic: 0, ifTemplate: 0, manual: 0 };
const exemptionMatches = new Map();
const manualState = new Map(); // manual rewrite -> 'applied' | 'already'

for (const f of files) {
  const filePath = path.join(HARNESS_DIR, f);
  const originalText = readFileSync(filePath, 'utf8');
  const { sf, sites } = extractSites(originalText, filePath);
  const eol = originalText.includes('\r\n') ? '\r\n' : '\n';
  const outerEdits = [];
  const intended = new Map();

  sites.forEach((site, idx) => {
    if (site.kind === 'other') return;

    // The one hand-written rewrite — same verification as everything else.
    if (site.kind === 'static') {
      const man = findManual(f, site.parse);
      if (man) {
        try { new vm.Script(man.replacement, { filename: `${f}:${site.line}` }); }
        catch (e) { throw new Error(`REFUSING manual rewrite ${f}:${site.line}: does not parse -- ${e.message}`); }
        outerEdits.push({ start: site.arg.getStart(sf), end: site.arg.getEnd(), replacement: JSON.stringify(man.replacement) });
        intended.set(idx, man.replacement);
        manualState.set(man, 'applied');
        rewrittenBy.manual += 1;
        return;
      }
      for (const m of MANUAL_REWRITES) if (m.file === f && m.replacement === site.parse) manualState.set(m, 'already');
    }

    const a = analyze(site.parse);
    if (!a.ok) { flaggedReport.push(`${f}:${site.line} -- the extracted text could not be analysed`); return; }
    if (a.items.length === 0 && a.flagged.length === 0) return;

    const ex = findExemption(f, site.parse);
    if (ex) {
      exemptionMatches.set(ex, (exemptionMatches.get(ex) || 0) + 1);
      exemptReport.push(`${f}:${site.line} -- ${ex.reason.split(':')[0]}`);
      return;
    }

    for (const fl of a.flagged) flaggedReport.push(`${f}:${site.line} -- ${fl}`);

    const accepted = [];
    for (const item of a.items) {
      if (site.kind === 'template') {
        if (item.argsHavePH) { flaggedReport.push(`${f}:${site.line} -- ${item.what}: the call's arguments contain an interpolation`); continue; }
        const mapped = item.edits.map((e) => ({ e, m: mapToRaw(site, e.start, e.end) }));
        const bad = mapped.find((x) => x.m.err);
        if (bad) { flaggedReport.push(`${f}:${site.line} -- ${item.what}: ${bad.m.err}`); continue; }
        // Inserted newlines follow the FILE's convention. (The first cut keyed
        // this on the PIECE, so a single-line piece in a CRLF file got a bare
        // LF — item121.mjs and sc2.mjs each ended up with one. The byte
        // comparison could not see it: cooked text normalises CRLF to LF.)
        item.raw = mapped.map((x) => {
          const rawText = cookedToRaw(x.e.cooked);
          return { start: x.m.rawStart, end: x.m.rawEnd, replacement: eol === '\n' ? rawText : rawText.split('\n').join(eol) };
        });
      }
      accepted.push(item);
    }
    if (accepted.length === 0) return;

    const parseEdits = accepted.flatMap((it) => it.edits);
    if (overlaps(parseEdits)) { flaggedReport.push(`${f}:${site.line} -- overlapping edits within one argument, left for a human read`); return; }

    const newParse = applyEdits(site.parse, parseEdits);
    try { new vm.Script(newParse, { filename: `${f}:${site.line}` }); }
    catch (e) { throw new Error(`REFUSING ${f}:${site.line}: the rewritten inner text does not parse -- ${e.message}\n  ${newParse.slice(0, 300)}`); }

    if (site.kind === 'static') {
      outerEdits.push({ start: site.arg.getStart(sf), end: site.arg.getEnd(), replacement: JSON.stringify(newParse) });
    } else {
      for (const it of accepted) for (const r of it.raw) outerEdits.push(r);
    }
    intended.set(idx, newParse);
    for (const it of accepted) {
      const key = it.kind + (site.kind === 'static' ? 'Static' : 'Template');
      const bucket = key === 'optionalStatic' ? 'optionalStatic' : key === 'optionalTemplate' ? 'optionalTemplate' : key === 'ifStatic' ? 'ifStatic' : 'ifTemplate';
      rewrittenBy[bucket] += 1;
    }
  });

  if (outerEdits.length === 0) continue;

  const newFileText = applyEdits(originalText, outerEdits);

  // `node --check` of the WHOLE new file via a temp copy (the outer file is an
  // ES module with top-level `import`, which vm.Script cannot parse).
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'item154-check-'));
  const tmpFile = path.join(tmpDir, f);
  writeFileSync(tmpFile, newFileText, 'utf8');
  const chk = spawnSync(process.execPath, ['--check', tmpFile], { encoding: 'utf8' });
  rmSync(tmpDir, { recursive: true, force: true });
  if (chk.status !== 0) throw new Error(`REFUSING TO WRITE ${f}: the rewritten file does not parse --\n${chk.stderr}`);

  filesChanged.push({ file: f, path: filePath, originalText, newFileText, intended });
}

// Stale-record checks — a record that matches nothing is a guard passing blind.
let recordProblem = false;
for (const ex of EXEMPTIONS) {
  const n = exemptionMatches.get(ex) || 0;
  const want = ex.expect || 1;
  if (n !== want) { recordProblem = true; console.log(`!! EXEMPTION ${ex.file} [${ex.needle.slice(0, 50)}] matched ${n} offender-bearing site(s), expected exactly ${want}`); }
}
for (const m of MANUAL_REWRITES) {
  if (!manualState.has(m)) { recordProblem = true; console.log(`!! MANUAL REWRITE ${m.file}: neither the original nor the replacement text was found`); }
}

if (!DRY_RUN) for (const fc of filesChanged) writeFileSync(fc.path, fc.newFileText, 'utf8');

// ---------------------------------------------------------------------------
// BYTE-COMPARISON VERIFICATION
// ---------------------------------------------------------------------------
let allMatch = true;
let comparedArgs = 0;
let changedArgs = 0;
for (const fc of filesChanged) {
  const newText = DRY_RUN ? fc.newFileText : readFileSync(fc.path, 'utf8');
  const before = extractSites(fc.originalText, fc.path).sites;
  const after = extractSites(newText, fc.path).sites;
  let ok = before.length === after.length;
  if (ok) {
    for (let i = 0; i < before.length; i += 1) {
      comparedArgs += 1;
      const b = before[i];
      const a = after[i];
      if (b.kind !== a.kind) { ok = false; break; }
      if (fc.intended.has(i)) {
        changedArgs += 1;
        if (a.parse !== fc.intended.get(i) || !sameList(a.interp, b.interp)) { ok = false; break; }
      } else if (a.parse !== b.parse || !sameList(a.interp, b.interp)) { ok = false; break; }
    }
  }
  if (ok && skeleton(fc.originalText, fc.path) !== skeleton(newText, fc.path)) ok = false;
  if (ok && fc.originalText.includes('\r\n') && bareLf(newText) !== bareLf(fc.originalText)) {
    ok = false;
    console.log(`  LINE-ENDING DRIFT: ${fc.file} bare LFs ${bareLf(fc.originalText)} -> ${bareLf(newText)}`);
  }
  if (!ok) allMatch = false;
  fc.verified = ok;
}

console.log(`ITEM 154 REWRITE ${DRY_RUN ? '(DRY RUN)' : ''}`);
console.log(`  files changed:                    ${filesChanged.length}`);
console.log(`  rewritten  optional-chain:        ${rewrittenBy.optionalStatic} static + ${rewrittenBy.optionalTemplate} in-template`);
console.log(`  rewritten  if-guard:              ${rewrittenBy.ifStatic} static + ${rewrittenBy.ifTemplate} in-template`);
console.log(`  rewritten  by hand (verified alike): ${rewrittenBy.manual}`);
console.log(`  EXEMPT (named, justified):        ${exemptReport.length}`);
console.log(`  flagged, not touched:             ${flaggedReport.length}`);
for (const line of exemptReport) console.log(`    exempt  ${line}`);
for (const line of flaggedReport) console.log(`    flagged ${line}`);
console.log(`\nBYTE-COMPARISON (re-read from ${DRY_RUN ? 'in-memory dry-run text' : 'disk'}): ${comparedArgs} evalJs arguments compared across ${filesChanged.length} files —`);
console.log(`  ${changedArgs} edited arguments == the intended text, character for character, with every \${...} expression unchanged;`);
console.log(`  ${comparedArgs - changedArgs} untouched arguments byte-identical to before; the file outside every argument byte-identical to the original; no new bare LF in any CRLF file.`);
for (const fc of filesChanged) if (!fc.verified) console.log(`  MISMATCH: ${fc.file}`);
console.log(allMatch ? 'ALL REWRITTEN FILES: BYTE-VERIFIED' : 'MISMATCH FOUND -- see above');
if (!allMatch || recordProblem) process.exit(1);
