// ITEM 154 — THE REWRITE, SCOPED TO WHAT CAN BE DONE SAFELY.
//
// The census (item154-census.mjs) found 156 offenders. This tool rewrites
// the subset that can be transformed with a PROVEN-CORRECT, mechanical
// splice, and FLAGS the remainder by name rather than guess at them:
//
//   AUTO-REWRITTEN, both gates must pass:
//     (a) the evalJs argument is a StringLiteral or
//         NoSubstitutionTemplateLiteral — NO live `${...}` interpolation
//         anywhere in it. This sidesteps the one genuinely hard problem
//         (mapping a position found in a placeholder-joined analysis text
//         back to a raw source offset while never touching a live
//         interpolation) by only ever operating where that problem cannot
//         occur: re-encoding the WHOLE new cooked text via
//         `JSON.stringify` is unconditionally correct here, because there
//         is nothing else in the literal that a rewrite could clobber.
//     (b) the offender's own shape is SIMPLE: a single optional-chain with
//         no deeper `?.` in the same access chain, or an if-guard whose
//         consequent is ONE statement (braced or not) with no throw
//         already in it. The two sites that are NOT this shape (a nested
//         optional chain, a multi-statement if-body) are flagged, not
//         guessed at — restructuring a multi-statement block correctly
//         needs a human reading it, not a splice.
//
//   FLAGGED, not touched: everything else — sites whose source literal
//   carries a live interpolation elsewhere (15, by the census), and the
//   two complex-shape sites above. Reported by file:line with the reason,
//   the same posture as the census's own 48 unresolved sites: a boundary
//   this pass could not safely reach is a named gap, not an absence.
//
// THE TRANSFORM ITSELF (both classes reduce to the item 151 S0 example):
//   before (optional chain):  RECEIVER?.VERB(ARGS)
//   after:  (() => { const __t = RECEIVER; if (!__t) throw new Error(MSG); return __t.VERB(ARGS); })()
//
//   before (if-guard):        if (X) STATEMENT
//   after:                    if (!X) throw new Error(MSG);\nSTATEMENT
//   (the redundant `if (X)` wrapper is dropped, matching item 151's own
//   S0 example precisely — the act is unconditional AFTER the throw,
//   because a throw already ruled out the falsy case)
//
// VERIFICATION, per Fable's own instruction: BYTE COMPARISON of the
// extracted argument after rewriting, never "it still parses." Every
// write is followed by re-reading the FILE FROM DISK, re-running the
// SAME Pass-1 extraction the census uses, and comparing the re-extracted
// cooked text against the exact text this tool intended to write —
// character for character, not re-parsed and judged "looks right."
//
// Run: node scripts/item154-rewrite.mjs [--dry-run]   (from apps/desktop;
// no browser, no box turn — pure static rewrite)
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = path.join(HERE, 'harness');
const DRY_RUN = process.argv.includes('--dry-run');

const VERBS = new Set(['click', 'focus', 'blur', 'dispatchEvent', 'scrollIntoView', 'submit']);

function consequentThrows(node) {
  let found = false;
  const visit = (n) => { if (found) return; if (ts.isThrowStatement(n)) { found = true; return; } ts.forEachChild(n, visit); };
  visit(node);
  return found;
}

function verbCallsIn(node, out) {
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      if (ts.isPropertyAccessExpression(callee) && VERBS.has(callee.name.text)) out.push(n);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
}

function hasOptionalLink(callExpr) {
  let n = callExpr;
  while (n) {
    if (n.questionDotToken) return true;
    if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n)) n = n.expression;
    else break;
  }
  return false;
}

function receiverBaseText(callExpr) {
  return callExpr.expression.expression.getText();
}

// Find offenders in COOKED TEXT (no interpolation — the only shape this
// tool rewrites), each carrying enough to build its own replacement span
// (start/end offset INTO THE COOKED TEXT, and the pieces needed to build
// the new text).
function findRewritableOffenders(cookedText) {
  let sf;
  try { sf = ts.createSourceFile('x.js', cookedText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS); }
  catch { return { ok: false, reason: 'inner text does not parse' }; }

  const edits = []; // { start, end, replacement } into cookedText, plus a human note
  const flagged = [];

  const allVerbCalls = [];
  verbCallsIn(sf, allVerbCalls);
  for (const call of allVerbCalls) {
    if (!hasOptionalLink(call)) continue;
    const access = call.expression; // PropertyAccessExpression X?.verb
    if (!access.questionDotToken) { flagged.push('optional chain deeper than the verb access — not this tool\'s shape'); continue; }
    const receiver = access.expression;
    // Deeper-optional check: anything ABOVE the receiver also carrying `?.`
    let deeper = false;
    let bn = receiver;
    while (bn) {
      if (bn.questionDotToken) deeper = true;
      if (ts.isPropertyAccessExpression(bn) || ts.isElementAccessExpression(bn) || ts.isCallExpression(bn)) bn = bn.expression; else break;
    }
    if (deeper) { flagged.push(`nested optional chain at "${call.getText().slice(0, 60)}" — needs a human read`); continue; }

    const verb = access.name.text;
    const receiverText = receiver.getText();
    const argsText = call.arguments.map((a) => a.getText()).join(', ');
    const msg = `no ${verb} target`;
    const replacement = `(() => { const __t = ${receiverText}; if (!__t) throw new Error(${JSON.stringify(msg)}); return __t.${verb}(${argsText}); })()`;
    edits.push({ start: call.getStart(sf), end: call.getEnd(), replacement, note: `optional-chain ${verb}` });
  }

  const visitIf = (n) => {
    if (ts.isIfStatement(n)) {
      const condText = n.expression.getText();
      const calls = [];
      verbCallsIn(n.thenStatement, calls);
      for (const call of calls) {
        if (hasOptionalLink(call)) continue; // handled above
        const base = receiverBaseText(call);
        if (base === condText || base.startsWith(condText + '.')) {
          if (consequentThrows(n.thenStatement)) continue; // already safe
          const isBlock = ts.isBlock(n.thenStatement);
          if (isBlock && n.thenStatement.statements.length !== 1) {
            flagged.push(`multi-statement if-guard body at "if (${condText}) { ... }" — needs a human read to unwrap correctly`);
            continue;
          }
          const bodyText = isBlock ? n.thenStatement.statements[0].getText() : n.thenStatement.getText();
          const msg = `no ${condText} target`;
          const replacement = `if (!${condText}) throw new Error(${JSON.stringify(msg)});\n${bodyText}`;
          edits.push({ start: n.getStart(sf), end: n.getEnd(), replacement, note: `if-guard ${condText}` });
        }
      }
    }
    ts.forEachChild(n, visitIf);
  };
  visitIf(sf);

  return { ok: true, edits, flagged };
}

function applyEdits(text, edits) {
  // Last-to-first so earlier offsets stay valid.
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of sorted) out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  return out;
}

// ---------------------------------------------------------------------------
// RUN
// ---------------------------------------------------------------------------

const files = readdirSync(HARNESS_DIR).filter((f) => f.endsWith('.mjs')).sort();
let totalRewritten = 0;
let totalFlagged = 0;
const flaggedReport = [];
const filesChanged = [];

for (const f of files) {
  const filePath = path.join(HARNESS_DIR, f);
  const originalText = readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, originalText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);

  const outerEdits = []; // { start, end, replacement } into the OUTER file
  const intendedByArgStart = new Map(); // argStart -> intended new cooked text (for byte-compare later)

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isEvalJs = (ts.isPropertyAccessExpression(callee) && callee.name.text === 'evalJs') || (ts.isIdentifier(callee) && callee.text === 'evalJs');
      if (isEvalJs && node.arguments.length > 0) {
        const arg = node.arguments[0];
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const isSafeKind = ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg);
        if (!isSafeKind) {
          // helper-calls/identifiers: zero offenders live there (verified in
          // the S0 census), nothing to flag. TemplateExpression: only flag
          // if it ACTUALLY carries an offender -- most template-argument
          // evalJs calls are plain reads and would otherwise flood this
          // report for every one of them, which is the overcount trap this
          // whole item exists to refuse.
          if (ts.isTemplateExpression(arg)) {
            let joined = arg.head.text;
            for (const span of arg.templateSpans) { joined += ' PLACEHOLDER '; joined += span.literal.text; }
            const probe = findRewritableOffenders(joined);
            const count = probe.ok ? probe.edits.length + probe.flagged.length : 0;
            if (count > 0) flaggedReport.push(`${f}:${line + 1} -- ${count} offender(s) in a source with a live interpolation elsewhere, not rewritten this pass`);
          }
          return;
        }
        const cookedText = arg.text;
        const result = findRewritableOffenders(cookedText);
        if (!result.ok) { flaggedReport.push(`${f}:${line + 1} -- ${result.reason}`); return; }
        for (const flag of result.flagged) { flaggedReport.push(`${f}:${line + 1} -- ${flag}`); totalFlagged += 1; }
        if (result.edits.length === 0) return;
        const newCooked = applyEdits(cookedText, result.edits);
        // VALIDITY of the rewritten INNER text -- a real V8 parse, the same
        // separate check the census itself runs, before this text is ever
        // trusted to be re-encoded.
        try { new vm.Script(newCooked, { filename: `${f}:${line + 1}` }); }
        catch (e) { throw new Error(`REFUSING TO REWRITE ${f}:${line + 1}: new inner text does not parse -- ${e.message}\n  text: ${newCooked.slice(0, 300)}`); }
        const newLiteralSource = JSON.stringify(newCooked);
        outerEdits.push({ start: arg.getStart(sf), end: arg.getEnd(), replacement: newLiteralSource });
        intendedByArgStart.set(arg.getStart(sf), newCooked);
        totalRewritten += result.edits.length;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (outerEdits.length === 0) continue;

  const newFileText = applyEdits(originalText, outerEdits);

  // A real `node --check` of the WHOLE new file, via a temp copy, before
  // it is trusted at all -- the outer file is an ES module (top-level
  // `import`), which `vm.Script` cannot parse, so this uses the actual
  // Node parser the harness itself runs under, the same instrument this
  // whole session has used for every outer-file syntax check.
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'item154-check-'));
  const tmpFile = path.join(tmpDir, f);
  writeFileSync(tmpFile, newFileText, 'utf8');
  const checkResult = spawnSync(process.execPath, ['--check', tmpFile], { encoding: 'utf8' });
  rmSync(tmpDir, { recursive: true, force: true });
  if (checkResult.status !== 0) {
    throw new Error(`REFUSING TO WRITE ${f}: rewritten file does not parse --\n${checkResult.stderr}`);
  }

  filesChanged.push({ file: f, edits: outerEdits.length, path: filePath, newFileText, intendedByArgStart });
}

console.log(`ITEM 154 REWRITE ${DRY_RUN ? '(DRY RUN)' : ''}`);
console.log(`  files changed:          ${filesChanged.length}`);
console.log(`  offenders rewritten:    ${totalRewritten}`);
console.log(`  flagged, not touched:   ${flaggedReport.length}`);

if (!DRY_RUN) {
  for (const fc of filesChanged) writeFileSync(fc.path, fc.newFileText, 'utf8');
}

console.log(`\nFlagged sites (not rewritten this pass):`);
for (const line of flaggedReport) console.log(`  ${line}`);

// ---------------------------------------------------------------------------
// BYTE-COMPARISON VERIFICATION — re-read from DISK (or, in --dry-run, the
// in-memory new text), re-run the SAME Pass-1 extraction, compare the
// re-extracted cooked text against what this tool intended, byte for byte.
// ---------------------------------------------------------------------------
if (filesChanged.length > 0) {
  console.log(`\nBYTE-COMPARISON VERIFICATION (re-read from ${DRY_RUN ? 'in-memory dry-run text' : 'disk'}, re-extracted, compared to intent):`);
  let allMatch = true;
  let totalIntended = 0;
  let totalMatched = 0;
  for (const fc of filesChanged) {
    const verifyText = DRY_RUN ? fc.newFileText : readFileSync(fc.path, 'utf8');
    const sf2 = ts.createSourceFile(fc.path, verifyText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    // Re-extract every evalJs string-literal argument's cooked text, same
    // Pass-1 rule the census itself uses, applied to the file AFTER the
    // write -- this is what actually shipped, not what was asked for.
    const presentCooked = [];
    const visit2 = (node) => {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        const isEvalJs = (ts.isPropertyAccessExpression(callee) && callee.name.text === 'evalJs') || (ts.isIdentifier(callee) && callee.text === 'evalJs');
        if (isEvalJs && node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
          presentCooked.push(node.arguments[0].text);
        }
      }
      ts.forEachChild(node, visit2);
    };
    visit2(sf2);
    const presentSet = new Set(presentCooked);
    let fileOk = true;
    for (const intended of fc.intendedByArgStart.values()) {
      totalIntended += 1;
      if (presentSet.has(intended)) totalMatched += 1;
      else { fileOk = false; allMatch = false; }
    }
    console.log(`  ${fc.file}: ${fileOk ? 'BYTE-MATCH' : 'MISMATCH'} (${fc.intendedByArgStart.size} intended edit${fc.intendedByArgStart.size === 1 ? '' : 's'})`);
    if (!fileOk) console.log(`    INTENDED (first site, 200 chars): ${[...fc.intendedByArgStart.values()][0].slice(0, 200)}`);
  }
  console.log(`\n${totalMatched}/${totalIntended} intended rewrites confirmed byte-identical in the ${DRY_RUN ? 'dry-run text' : 'file actually on disk'}.`);
  console.log(allMatch ? 'ALL REWRITTEN FILES: BYTE-VERIFIED' : 'MISMATCH FOUND -- see above');
  if (!allMatch) process.exit(1);
}
