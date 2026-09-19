// ITEM 154 — THE REAL BOUNDARY CENSUS, TWO PASSES, NEITHER ONE A REGEX.
//
// ~88% of item 151's original 152-count silent-act pattern lives inside
// `app.evalJs("...")` STRING ARGUMENTS — invisible to a real outer parser by
// design, not by bug (a JS AST reader cannot see structure written as text
// inside a string literal). The 134 figure carried forward from that finding
// was a SAMPLE taken by a heuristic that had already miscounted the outer
// population twice (the VW1 census laws: "a static census sees spellings,
// not dependencies" / "an index passed as an argument is invisible to every
// instrument looking beside the selector"). This item does not inherit that
// number; it re-derives it.
//
// PASS 1 — find every `evalJs(...)` call site in every harness file and
// extract its argument's INNER TEXT using AST NODE OFFSETS, never a
// string/regex edit. Item 152's own lesson: a hand-rolled unescape is where
// `\b`/`\n` silently collapse. TypeScript's own tokenizer already produces
// the correctly-cooked text for every string/template-literal piece
// (`.text` on a StringLiteral, NoSubstitutionTemplateLiteral, TemplateHead,
// TemplateMiddle, TemplateTail) — that cooked value is trusted directly,
// nothing is re-decoded by hand. Each `${...}` interpolation is replaced by
// a single safe identifier placeholder at the SPAN the AST already located,
// not by matching `${` and `}` as characters (which breaks on a nested
// template or a brace inside a string).
//
// PASS 2 — parse that inner text as its OWN standalone JS program (a fresh
// `ts.createSourceFile`) and walk IT for the same six-verb silent-act shape
// item 151/155's own census used: `click`, `focus`, `blur`, `dispatchEvent`,
// `scrollIntoView`, `submit`, reached through an optional chain (`x?.verb()`)
// or an `if (x) x.verb()` / `x && x.verb()` guard whose own branch never
// throws. Never "it still parses" — a text that parses is not a text whose
// guard actually fails named; VALIDITY (does the extracted text compile at
// all, via `node:vm`, a real V8 parse) and PATTERN (does it carry the
// silent-act shape) are two separate questions, asked separately.
//
// Run: node scripts/item154-census.mjs   (from apps/desktop; no browser, no
// box turn — this is static analysis only, safe regardless of pair state)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = path.join(HERE, 'harness');

const VERBS = new Set(['click', 'focus', 'blur', 'dispatchEvent', 'scrollIntoView', 'submit']);
const PLACEHOLDER = '__ITEM154_X__';

// ---------------------------------------------------------------------------
// PASS 1
// ---------------------------------------------------------------------------

function extractInnerText(arg) {
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
    return { text: arg.text, hadInterpolation: false };
  }
  if (ts.isTemplateExpression(arg)) {
    let out = arg.head.text;
    for (const span of arg.templateSpans) {
      out += PLACEHOLDER;
      out += span.literal.text; // TemplateMiddle/TemplateTail — already cooked
    }
    return { text: out, hadInterpolation: true };
  }
  return null; // not a literal at all
}

// ONE LEVEL OF SAME-FILE INDIRECTION, resolved the same way item 151's own
// build had to (`pressOn` -> `hittablePoint` -> `hittablePointBy`), covering
// TWO shapes found in this file set:
//   (a) `rectOf('.sel')` — a call to a same-file helper of the exact shape
//       `const NAME = (params) => <string-or-template-literal>`, an arrow
//       function whose entire body IS the literal;
//   (b) `evalJs(DRAG_HELPER)` — a bare identifier bound ONCE, at any scope
//       in the file, directly to a string/template literal (a shared JS
//       blob referenced by name rather than inlined).
// Both close a large, homogeneous slice of "not statically extractable"
// (80 call-sites, 108 identifier-sites) without guessing at the genuinely
// dynamic remainder (concatenation, a name bound more than once — shadowed
// across two functions, where picking either risks reading the WRONG one).
// A name declared more than once in the file is left UNRESOLVED rather than
// guessed at — ambiguous is not the same as safe.
function findLocalTemplateHelpers(sf) {
  const byName = new Map(); // name -> array of extracted values (to detect ambiguity)
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
      const init = node.initializer;
      let extracted = extractInnerText(init);
      if (!extracted && ts.isArrowFunction(init) && !ts.isBlock(init.body)) {
        extracted = extractInnerText(init.body);
      }
      if (extracted) {
        const list = byName.get(node.name.text) || [];
        list.push(extracted);
        byName.set(node.name.text, list);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  const helpers = new Map();
  for (const [name, list] of byName) {
    if (list.length === 1) helpers.set(name, list[0]);
    // length > 1: the same name bound to more than one literal in this
    // file (shadowed across scopes) — left OUT of the map on purpose, so
    // every call site referencing it falls through to "not statically
    // extractable" rather than silently resolving to whichever binding
    // happened to be visited first.
  }
  return helpers;
}

function findEvalJsSites(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const localHelpers = findLocalTemplateHelpers(sf);
  const sites = [];

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isEvalJs =
        (ts.isPropertyAccessExpression(callee) && callee.name.text === 'evalJs') ||
        (ts.isIdentifier(callee) && callee.text === 'evalJs');
      if (isEvalJs && node.arguments.length > 0) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const arg = node.arguments[0];
        let extracted = extractInnerText(arg);
        let resolvedVia = null;
        if (!extracted && ts.isCallExpression(arg) && ts.isIdentifier(arg.expression)) {
          const helper = localHelpers.get(arg.expression.text);
          if (helper) { extracted = helper; resolvedVia = arg.expression.text; }
        }
        if (!extracted && ts.isIdentifier(arg)) {
          const helper = localHelpers.get(arg.text);
          if (helper) { extracted = helper; resolvedVia = arg.text; }
        }
        sites.push({
          file: path.basename(filePath),
          line: line + 1,
          argKind: ts.SyntaxKind[arg.kind],
          resolvedVia,
          extracted,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return sites;
}

// ---------------------------------------------------------------------------
// PASS 2
// ---------------------------------------------------------------------------

// Does this consequent subtree ever throw? A guard that already fails named
// is not an offender — this is the fix's own shape, so a file already
// carrying it must not be double-counted.
function consequentThrows(node) {
  let found = false;
  const visit = (n) => {
    if (found) return;
    if (ts.isThrowStatement(n)) { found = true; return; }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

function verbCallsIn(node, out) {
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      if (ts.isPropertyAccessExpression(callee) && VERBS.has(callee.name.text)) {
        out.push(n);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
}

function receiverBaseText(callExpr) {
  // callExpr.expression is the PropertyAccessExpression `X.verb`; its own
  // `.expression` is X, the receiver whose text we compare a guard against.
  return callExpr.expression.expression.getText();
}

function hasOptionalLink(callExpr) {
  // Walk the access chain from the call outward: `a?.b.verb()`,
  // `a.b?.verb()`, `a?.b?.verb?.()` — any QuestionDotToken anywhere in the
  // chain up to and including the call itself makes the whole call silent
  // on a miss, which is the offender shape regardless of WHERE the `?.` sits.
  let n = callExpr;
  while (n) {
    if (n.questionDotToken) return true;
    if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n)) {
      n = n.expression;
    } else {
      break;
    }
  }
  return false;
}

function censusInnerAst(innerSf) {
  const offenders = [];
  const guardedSafe = [];

  // Class 1 — optional chain reaching one of the six verbs.
  const allVerbCalls = [];
  verbCallsIn(innerSf, allVerbCalls);
  for (const call of allVerbCalls) {
    if (hasOptionalLink(call)) {
      offenders.push({ kind: 'optional-chain', text: call.getText().slice(0, 120) });
    }
  }

  // Class 2 — if (X) [...X.verb()...], and its `X && X.verb()` cousin.
  const visit = (n) => {
    if (ts.isIfStatement(n)) {
      const condText = n.expression.getText();
      const calls = [];
      verbCallsIn(n.thenStatement, calls);
      for (const call of calls) {
        if (hasOptionalLink(call)) continue; // already counted as class 1
        const base = receiverBaseText(call);
        if (base === condText || base.startsWith(condText + '.')) {
          if (consequentThrows(n.thenStatement)) {
            guardedSafe.push({ kind: 'if-guard-throws', text: n.getText().slice(0, 120) });
          } else {
            offenders.push({ kind: 'if-guard-silent', text: `if (${condText}) ... ${call.getText().slice(0, 80)}` });
          }
        }
      }
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      const leftText = n.left.getText();
      const calls = [];
      verbCallsIn(n.right, calls);
      for (const call of calls) {
        if (hasOptionalLink(call)) continue;
        const base = receiverBaseText(call);
        if (base === leftText || base.startsWith(leftText + '.')) {
          offenders.push({ kind: 'and-guard-silent', text: n.getText().slice(0, 120) });
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(innerSf);

  return { offenders, guardedSafe };
}

// ---------------------------------------------------------------------------
// RUN
// ---------------------------------------------------------------------------

const files = readdirSync(HARNESS_DIR).filter((f) => f.endsWith('.mjs')).sort();
const perFile = [];
let totalSites = 0;
let totalExtracted = 0;
let totalResolvedViaHelper = 0;
let totalNotStaticallyExtractable = 0;
let totalUnparseable = 0;
let totalOffenders = 0;
let totalGuardedSafe = 0;

for (const f of files) {
  const filePath = path.join(HARNESS_DIR, f);
  const sites = findEvalJsSites(filePath);
  totalSites += sites.length;

  let fileOffenders = 0;
  let fileGuardedSafe = 0;
  const fileDetail = [];

  for (const site of sites) {
    if (!site.extracted) {
      totalNotStaticallyExtractable += 1;
      fileDetail.push({ line: site.line, note: 'NOT STATICALLY EXTRACTABLE (argKind=' + site.argKind + ')' });
      continue;
    }
    totalExtracted += 1;
    if (site.resolvedVia) totalResolvedViaHelper += 1;
    const { text } = site.extracted;

    // VALIDITY — a real V8 parse, separate from the AST walk below.
    try {
      // eslint-disable-next-line no-new
      new vm.Script(text, { filename: `${f}:${site.line}` });
    } catch (e) {
      totalUnparseable += 1;
      fileDetail.push({ line: site.line, note: 'UNPARSEABLE AS STANDALONE JS -- ' + e.message });
      continue;
    }

    const innerSf = ts.createSourceFile(`${f}:${site.line}`, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const { offenders, guardedSafe } = censusInnerAst(innerSf);
    if (offenders.length) {
      fileOffenders += offenders.length;
      fileDetail.push({ line: site.line, note: `${offenders.length} offender(s)`, offenders });
    }
    if (guardedSafe.length) {
      fileGuardedSafe += guardedSafe.length;
      fileDetail.push({ line: site.line, note: `${guardedSafe.length} already-guarded-safe`, guardedSafe });
    }
  }

  totalOffenders += fileOffenders;
  totalGuardedSafe += fileGuardedSafe;
  if (fileOffenders > 0 || fileGuardedSafe > 0) {
    perFile.push({ file: f, offenders: fileOffenders, guardedSafe: fileGuardedSafe, sites: sites.length, detail: fileDetail });
  }
}

perFile.sort((a, b) => b.offenders - a.offenders);

console.log(`ITEM 154 CENSUS`);
console.log(`  harness files scanned:            ${files.length}`);
console.log(`  evalJs(...) call sites found:      ${totalSites}`);
console.log(`  statically extractable arguments:  ${totalExtracted}`);
console.log(`    (of which, resolved via a same-file template helper: ${totalResolvedViaHelper})`);
console.log(`  NOT statically extractable:        ${totalNotStaticallyExtractable}`);
console.log(`  unparseable after extraction:      ${totalUnparseable}`);
console.log(`  ALREADY-GUARDED-SAFE (throws):     ${totalGuardedSafe}`);
console.log(`  OFFENDERS (the real boundary):     ${totalOffenders}`);
console.log('');
console.log('Leading files (offenders desc):');
for (const pf of perFile.slice(0, 25)) {
  console.log(`  ${pf.file.padEnd(16)} offenders=${pf.offenders}  guarded-safe=${pf.guardedSafe}  evalJs-sites=${pf.sites}`);
}

writeFileSync(
  path.join(HERE, '..', '..', '..', 'item154-census-detail.json'),
  JSON.stringify({ totalSites, totalExtracted, totalResolvedViaHelper, totalNotStaticallyExtractable, totalUnparseable, totalGuardedSafe, totalOffenders, perFile }, null, 2),
);
console.log('\nFull detail: item154-census-detail.json (repo root)');
