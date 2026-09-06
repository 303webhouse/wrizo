// HOOKS-ORDER, THE AST FORM — item 109's other owed half.
//
// `hooks-order.mjs` beside this file is a LINE SCANNER, and it named its own two
// blind spots rather than implying it had none:
//   1. ARROW-DEFINED components and hooks (`const Foo = () => {…}`) are not
//      parsed at all. When it was written exactly one such definition existed
//      and it contained no hook calls, so the gap was EMPTY — but structural,
//      and an empty gap fills silently.
//   2. MULTI-LINE early returns — a `return` on its own deeper-indented line
//      inside an `if {`  — are not matched; only top-level single-statement
//      ones are. Both faults item 104 fixed happened to be of the matched shape,
//      which is luck, not coverage.
//
// This closes both by parsing instead of scanning. TypeScript is already a
// devDependency of this workspace, so the parser costs no new dependency: the
// same compiler that typechecks the app reads it here.
//
// THE RULE, unchanged: React counts hooks per render. A hook below an early
// return runs a different number of times depending on whether that return
// fired, so the instant its condition flips React throws "Rendered fewer hooks
// than expected" and BLANKS THE TREE. Every hook above, the decision below.
//
// WHY STATIC AND NOT A BROWSER SCENARIO — inherited verbatim from the line
// scanner's own reasoning, because it is still true: StrictMode's double-invoke
// is DEVELOPMENT-ONLY and stripped from the production bundle every harness runs
// against, so a CDP scenario cannot bite on this class. The fault is visible in
// the SOURCE, so the source is what gets guarded. item109.mjs guards the other
// end — that the door actually opens — and the two are complementary, not
// duplicates.
//
// SCOPE, STATED SO IT IS NOT OVERSTATED. This walks a component's or hook's OWN
// body and deliberately does NOT descend into nested functions: a hook inside a
// callback is a different violation with a different fix, and reporting it here
// would put a second claim behind one verdict. What it now sees that the scanner
// could not: arrow-defined components/hooks, and returns at any depth of `if` /
// `else` / `try` / block nesting inside the body.
//
// Run: node scripts/harness/hooks-order-ast.mjs   (from apps/desktop)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// KNOWN, REASONED EXCEPTION — carried over verbatim from hooks-order.mjs, and
// for its stated reason, not as a suppression. pages/JournalEntry.tsx has been
// UNROUTED since FX14 (App.tsx redirects /journal/:id to /page/:id and nothing
// imports JournalEntryView), so its violation cannot be reached by a writer. It
// is listed rather than fixed so the entry is a deliberate record and anything
// NEW shows up immediately. If that surface is ever re-routed, delete this line
// first and fix the file.
const ALLOWED = new Set(['src/pages/JournalEntry.tsx']);

const ROOT = 'src';
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e)) files.push(p);
  }
})(ROOT);

const isComponentName = (n) => /^[A-Z]/.test(n);
const isHookName = (n) => /^use[A-Z]/.test(n);
const isInteresting = (n) => !!n && (isComponentName(n) || isHookName(n));

const FN_LIKE = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
]);

/** Walk a node's subtree WITHOUT entering nested function-like bodies. The stop
 *  is the whole reason this reads a component's own render path and not the
 *  contents of every callback it happens to define. */
function walkOwn(node, visit, root = true) {
  if (!root && FN_LIKE.has(node.kind)) return;
  visit(node);
  node.forEachChild((c) => walkOwn(c, visit, false));
}

/** Every function-like node that is NAMED as a component or a hook — including
 *  the arrow and function-expression forms the line scanner cannot see. */
function componentsIn(src) {
  const found = [];
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && isInteresting(node.name.text) && node.body) {
      found.push({ name: node.name.text, body: node.body, form: 'function' });
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && isInteresting(node.name.text)
      && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      && node.initializer.body) {
      // BLIND SPOT 1, CLOSED: `const Foo = () => { … }` / `const useBar = function () { … }`.
      // A CONCISE-body arrow (`=> (<div/>)`) is recorded as its own form and then
      // skipped: it has no statements, so it cannot hold an early return with a
      // hook below it. Counting it as a parsed block form would overstate what
      // this guard has actually looked inside.
      const isBlockBody = ts.isBlock(node.initializer.body);
      found.push({
        name: node.name.text,
        body: isBlockBody ? node.initializer.body : null,
        form: isBlockBody ? 'arrow/expression' : 'arrow/concise',
      });
    }
    node.forEachChild(visit);
  };
  visit(src);
  return found;
}

/** The whole analysis, over ONE source text. Extracted so the guard can be run
 *  against FIXTURES as well as against `src` — see the self-proof below, which
 *  is not optional decoration: with zero arrow-defined components in the tree
 *  today, the arrow path would otherwise never execute, and an unexercised
 *  branch that reports "0 violations" is indistinguishable from a broken one. */
function analyzeSource(fileName, text) {
  const src = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const found = [];
  let components = 0;
  let arrowForms = 0;
  let conciseArrowForms = 0;

  for (const comp of componentsIn(src)) {
    components++;
    if (comp.form === 'arrow/expression') arrowForms++;
    if (comp.form === 'arrow/concise') { conciseArrowForms++; continue; }

    const statements = comp.body.statements;
    if (!statements || statements.length === 0) continue;
    const last = statements[statements.length - 1];

    // EARLY RETURNS at ANY depth inside the body — BLIND SPOT 2, CLOSED. A
    // return is "early" when it is not the body's own final statement; one
    // nested inside `if { … }` is the shape the scanner missed entirely.
    let firstEarlyReturnEnd = Infinity;
    let earlyReturnLine = null;
    walkOwn(comp.body, (n) => {
      if (!ts.isReturnStatement(n)) return;
      if (n === last) return;                       // the body's own final statement
      if (n.end < firstEarlyReturnEnd) {
        firstEarlyReturnEnd = n.end;
        earlyReturnLine = src.getLineAndCharacterOfPosition(n.getStart(src)).line + 1;
      }
    });
    if (firstEarlyReturnEnd === Infinity) continue;

    // …and any hook called BELOW it, in this component's own body.
    walkOwn(comp.body, (n) => {
      if (!ts.isCallExpression(n)) return;
      const callee = n.expression;
      if (!ts.isIdentifier(callee) || !isHookName(callee.text)) return;
      if (n.getStart(src) <= firstEarlyReturnEnd) return;
      found.push({
        file: fileName.replace(/\\/g, '/'),
        component: comp.name,
        form: comp.form,
        hook: callee.text,
        hookLine: src.getLineAndCharacterOfPosition(n.getStart(src)).line + 1,
        earlyReturnLine,
      });
    });
  }
  return { violations: found, components, arrowForms, conciseArrowForms };
}

// --- the census over the real tree ------------------------------------------
const violations = [];
const stats = { files: 0, components: 0, arrowForms: 0, conciseArrowForms: 0 };
for (const file of files) {
  const rel = file.replace(/\\/g, '/');
  const r = analyzeSource(file, readFileSync(file, 'utf8'));
  stats.files++;
  stats.components += r.components;
  stats.arrowForms += r.arrowForms;
  stats.conciseArrowForms += r.conciseArrowForms;
  if (!ALLOWED.has(rel)) violations.push(...r.violations);
}

// --- THE SELF-PROOF ---------------------------------------------------------
// Both blind spots are EMPTY in the tree today: there is not one arrow-defined
// component or custom hook in `src` (the line scanner's note about "exactly one"
// referred to `const Crumb = (<div …>)`, which is a JSX ELEMENT, not a
// function). So the census alone proves nothing about either path — it would
// report a clean 0 whether the new code worked or did nothing at all.
//
// These fixtures are the difference between a guard and a decoration. Each is a
// shape the LINE SCANNER provably cannot see, and each must produce exactly one
// violation. The clean fixture is the control: without it, a detector that
// simply flagged everything would pass the other two.
const FIXTURES = [
  {
    name: 'blind spot 1 — an ARROW-defined component with a hook below an early return',
    file: 'fixture-arrow.tsx',
    expect: 1,
    code: `
const Panel = ({ entry }) => {
  const [a, setA] = useState(0);
  if (!entry) return null;
  const [b, setB] = useState(1);
  return <div>{a}{b}</div>;
};
`,
  },
  {
    name: 'blind spot 2 — a MULTI-LINE early return inside an if-block, followed by a hook',
    file: 'fixture-multiline.tsx',
    expect: 1,
    code: `
export function Surface({ entry }) {
  const [a, setA] = useState(0);
  if (!entry) {
    return null;
  }
  useEffect(() => { setA(1); }, []);
  return <div>{a}</div>;
}
`,
  },
  {
    name: 'the control — every hook ABOVE the decision, which is the lawful shape',
    file: 'fixture-clean.tsx',
    expect: 0,
    code: `
export function Surface({ entry }) {
  const [a, setA] = useState(0);
  useEffect(() => { setA(1); }, []);
  if (!entry) {
    return null;
  }
  return <div>{a}</div>;
}
`,
  },
  {
    name: 'the other control — a hook inside a CALLBACK below a return is NOT this claim, and is not reported here',
    file: 'fixture-callback.tsx',
    expect: 0,
    code: `
export function Surface({ entry }) {
  const [a, setA] = useState(0);
  if (!entry) {
    return null;
  }
  return <div onClick={() => { const later = () => useThing(); later(); }}>{a}</div>;
}
`,
  },
];

const fixtureResults = FIXTURES.map((f) => {
  const r = analyzeSource(f.file, f.code);
  return { name: f.name, expect: f.expect, got: r.violations.length, arrowForms: r.arrowForms, detail: r.violations };
});

// eslint-disable-next-line no-console
console.log(JSON.stringify({ stats, violations }, null, 2));

const checks = [];
checks.push({
  name: `AST: the whole tree parses — ${stats.components} components/hooks across ${stats.files} files`,
  pass: stats.components > 0 && stats.files > 0,
  detail: JSON.stringify(stats),
});

// THE SELF-PROOF IS ITS OWN CHECK, and it is the one that matters. Reported
// honestly: BOTH blind spots are EMPTY in the tree today, so the census above
// exercises neither new path and would read a clean 0 whether this guard worked
// or did nothing whatsoever. These fixtures are what make the claim real.
for (const f of fixtureResults) {
  checks.push({
    name: `AST self-proof: ${f.name} — expected ${f.expect} violation(s)`,
    pass: f.got === f.expect,
    detail: JSON.stringify({ expected: f.expect, got: f.got, arrowForms: f.arrowForms, found: f.detail }),
  });
}
checks.push({
  name: `AST scope, stated not implied: the tree currently contains ZERO arrow-defined components or hooks (${stats.arrowForms} block-bodied, ${stats.conciseArrowForms} concise) — blind spot 1 is closed by CAPABILITY, proven on a fixture, not by having met one in the wild`,
  pass: true,
  detail: JSON.stringify({ arrowForms: stats.arrowForms, conciseArrowForms: stats.conciseArrowForms }),
});
checks.push({
  name: 'AST: NO hook is called below an early return in any routed component or custom hook — returns matched at ANY nesting depth, not only top-level single-statement ones (blind spot 2, closed)',
  pass: violations.length === 0,
  detail: violations.length ? JSON.stringify(violations) : 'none',
});

if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This SUPERSEDES no assertion: hooks-order.mjs keeps
  // claiming exactly what it claimed and keeps passing — this file is the
  // STRONGER form the charter said was still owed, standing beside it rather
  // than replacing it. The line scanner is left in place deliberately: if the
  // two ever disagree, that disagreement is itself a finding worth seeing.
  // eslint-disable-next-line no-console
  console.log('\nHOOKS-ORDER-AST PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing. It is additive to hooks-order.mjs, which is untouched and still asserts its own claim.');
}

// The checks themselves, in the house shape, so a verdict can be audited rather
// than taken on trust — the census JSON above says what was SEEN, this says what
// was CLAIMED about it.
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nHOOKS-ORDER-AST VERIFY: PASS (${checks.length} checks)`
  : `\nHOOKS-ORDER-AST VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
