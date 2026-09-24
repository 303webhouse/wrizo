// ITEM 147 — THE PARK COUNT AS A CHECK: the classifier. Pure (source text in, a class out); no browser.
//
//   A VERDICT LINE THAT CANNOT SAY FAIL IS NOT A VERDICT.   (band, 2026-09-16)
//
// THE DEFECT, from the record: `run-suite` reds a file only on a verdict line matching /\bFAIL\b/, a
// non-zero exit, a timeout or no verdict. A parked check therefore reaches the suite ONLY through the file's
// `PARKED` verdict line — so a file whose PARKED line is a literal saying PASS has parked checks that can
// fail and a verdict that cannot report it. It is structurally green. item87.mjs was that file: its line said
// `PASS (0 checks)` while four `pok()` records ran (they were added after the line was written).
//
// WHY THIS READS SOURCE AND NEVER COMPARES NUMBERS (re-derived on the current tree, not inherited): the
// ratified comparison — "the printed N against the length of the list the file prints" — cannot be made from
// OUTPUT, because output does not identify the list; and a STATIC count of park calls is wrong for measured
// reasons (a loop parks 3 with one call; helpers multiply; a failure-branch `PARKED-DRIVER` probe only fires
// when something is missing). So the guard asserts the verdict is DERIVED from the array the file pushes
// into — which makes the count right by construction — and that the line has a FAIL form.
//
// PARKS ARE DETECTED BY DECLARATION AND PUSH, NEVER BY THE SHAPE OF A HELPER (`pok`, `park`, …): a helper-shaped
// detector misses whatever a file names its helper. It reads the AST, so a push that exists only in a comment
// is not a push.
//
// Every file lands in exactly ONE class:
//   lawful    DERIVED         pushes; a PARKED line reads that array's own .length; a FAIL form exists
//             DECLARED-EMPTY  pushes nothing; prints a PARKED line anyway ("nothing to park", said out loud)
//             SILENT          pushes nothing; prints no PARKED line (nothing to say)
//   defect    CANNOT-FAIL     pushes; no path prints `PARKED: FAIL`                      (item 87)
//             LITERAL-COUNT   pushes; the PARKED line's count is not the array's length
//             OTHER-ARRAY     pushes; the PARKED line counts some OTHER array
//             PARKS-SILENTLY  pushes; prints no PARKED line at all
// A file that declares no park array and never mentions HARNESS_PARKED is NOT-GATED and is reported as such.
import ts from 'typescript';

export const LAWFUL = ['DERIVED', 'DECLARED-EMPTY', 'SILENT', 'NOT-GATED'];
export const DEFECTS = ['CANNOT-FAIL', 'LITERAL-COUNT', 'OTHER-ARRAY', 'PARKS-SILENTLY'];

const PARK_NAME = /^parked/i;

export function classifyParkFile(src) {
  const sf = ts.createSourceFile('f.mjs', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const arrays = new Set();        // identifiers declared as a park array (`const parkedChecks = []`)
  const pushed = new Set();        // park arrays that something pushes into
  const lines = [];                // every string/template literal containing `PARKED:`
  const mentionsGate = /HARNESS_PARKED/.test(src);

  const textOf = (n) => n.getText(sf);
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && PARK_NAME.test(n.name.text)
        && n.initializer && ts.isArrayLiteralExpression(n.initializer)) arrays.add(n.name.text);
    // arr.push(...)  — anywhere, including inside a helper's arrow body.
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
        && n.expression.name.text === 'push' && ts.isIdentifier(n.expression.expression)) {
      pushed.add(n.expression.expression.text);
    }
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && /PARKED:/.test(n.text)) lines.push({ node: n, text: n.text, exprs: [] });
    if (ts.isTemplateExpression(n)) {
      const whole = [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join('');
      if (/PARKED:/.test(whole)) lines.push({ node: n, text: whole, exprs: n.templateSpans.map((s) => textOf(s.expression)) });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);

  const parkArrays = [...arrays];
  const pushesToPark = parkArrays.filter((a) => pushed.has(a));
  const pushes = pushesToPark.length > 0;
  const hasLine = lines.length > 0;
  const hasFailForm = lines.some((l) => /PARKED:\s*FAIL/.test(l.text));
  // The array names a line's own expressions read via .length / .filter / .every / .some / .map.
  const referenced = (l) => {
    const out = new Set();
    for (const e of l.exprs) for (const a of parkArrays) if (new RegExp(`\\b${a}\\b`).test(e)) out.add(a);
    return out;
  };
  const derivedFrom = new Set();
  for (const l of lines) for (const a of referenced(l)) derivedFrom.add(a);
  const usesLength = lines.some((l) => l.exprs.some((e) => parkArrays.some((a) => new RegExp(`\\b${a}\\.length\\b`).test(e))));

  let cls;
  if (!pushes) {
    cls = hasLine ? 'DECLARED-EMPTY' : (parkArrays.length || mentionsGate ? 'SILENT' : 'NOT-GATED');
  } else if (!hasLine) {
    cls = 'PARKS-SILENTLY';
  } else if (!hasFailForm) {
    cls = 'CANNOT-FAIL';
  } else if (derivedFrom.size === 0 || !usesLength) {
    cls = 'LITERAL-COUNT';
  } else if (![...derivedFrom].every((a) => pushed.has(a)) || ![...pushesToPark].every((a) => derivedFrom.has(a))) {
    cls = 'OTHER-ARRAY';
  } else {
    cls = 'DERIVED';
  }
  return {
    cls,
    arrays: parkArrays,
    pushes,
    lineCount: lines.length,
    hasFailForm,
    // A DECLARED-EMPTY line that is a literal `(0 checks)`/PASS is one amendment away from being item 87 —
    // reported (never failed): the live count is printed by the guard, not written here.
    literalZeroLine: !pushes && lines.some((l) => /PARKED:\s*PASS\s*\(0 checks\)/.test(l.text)),
  };
}

/** The parked records that pass a constant `true` — informational (a park that cannot itself fail). */
export function constantTrueParks(src) {
  const sf = ts.createSourceFile('f.mjs', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  let constTrue = 0; let constFalse = 0;
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && /^(pok|park)$/i.test(n.expression.text) && n.arguments.length >= 2) {
      const a = n.arguments[1];
      if (a.kind === ts.SyntaxKind.TrueKeyword) constTrue += 1;
      else if (a.kind === ts.SyntaxKind.FalseKeyword) constFalse += 1;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { constTrue, constFalse };
}
