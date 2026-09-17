// ITEM 147 — THE PARK COUNT AS A CHECK. Browserless, in the seed-guard.mjs shape.
//
//   A VERDICT LINE THAT CANNOT SAY FAIL IS NOT A VERDICT.
//
// WHAT IT IS FOR. A parked check is the successor that keeps a retired
// assertion honest, and it is only worth anything if a failure can reach the
// suite. The runner calls a file FAIL when one of its verdict lines contains
// FAIL or its exit is non-zero — and a file's exit reads its LIVE checks. So a
// parked check fails the suite ONLY through the file's PARKED verdict line. A
// file whose PARKED line is a literal that says PASS has parked checks that can
// fail and a verdict that cannot report it: a file that is STRUCTURALLY green.
//
// item87.mjs was exactly that. Its line read, verbatim,
//   "ITEM87 PARKED: PASS (0 checks) — ... item 87 parks nothing ..."
// which was TRUE when written. Then the 2026-08-17 amendment pushed four parked
// checks and nobody touched the line. It said 0 while four ran, and it said PASS
// whatever those four returned. All four happened to pass, so nothing was
// hidden — yet — and nothing could have been shown either.
//
// ---------------------------------------------------------------------------
// WHY THIS READS SOURCE AND NOT OUTPUT — MEASURED, NOT ASSUMED.
//
// The design first ratified was to compare each file's printed
// "PARKED: PASS (N checks)" with the length of the list the file prints. On a
// real parked leg (87 files) that comparison could not find the list:
//   · BY NAME it read bm1.mjs as 2 claimed / 1 printed — a false alarm; bm1's
//     second parked check is named "BM1 A4 sweep: ...", not "PARKED (...".
//   · BY POSITION ("the last array printed before the verdict") it matched only
//     57 of 70, because files that park nothing print no list at all, so the
//     last array is their LIVE checks.
// Output cannot say which list is the parked one. Source can: the parked list is
// the array the file declares and pushes into, and the verdict either reads that
// array or it does not.
//
// And a STATIC COUNT OF CALLS is wrong for a different measured reason: fx7 has
// 1 call site and runs 3 parked checks, tu2 5 and 10, item9192 0 and 1 (loops and
// helpers), while cd2 has 13 call sites and runs 10 because three are
// PARKED-DRIVER probes on the failure branch of an existence check — reached
// only when an element is ABSENT. A count that varies with the page is not a
// count a source reader can predict. So this guard never compares numbers; it
// asserts the verdict is DERIVED from the array, which makes the number right by
// construction.
//
// ---------------------------------------------------------------------------
// THE CLASSES, every file in exactly one:
//
//   DERIVED         pushes into a parked array; its verdict reads that array's
//                   .length AND has a FAIL form. Lawful — the count cannot lie.
//   DECLARED-EMPTY  pushes nothing; prints an explicit PARKED line anyway.
//                   Lawful — there is nothing that could fail.
//   SILENT          pushes nothing; prints no PARKED line. Lawful — but NAMED
//                   separately from DECLARED-EMPTY, because a file that prints
//                   nothing and a file with nothing to print must not look alike.
//
//   CANNOT-FAIL     pushes, but no code path prints PARKED: FAIL.   (item87)
//   LITERAL-COUNT   pushes, but the count in its line is not the array's length.
//   OTHER-ARRAY     pushes, but its line reads the length of some OTHER array.
//   PARKS-SILENTLY  pushes, and prints no PARKED line at all.
//
// The rule that protects the DECLARED-EMPTY files is the first defect class:
// many of them carry a literal always-PASS line, and each such file is one
// amendment away from being item87. The moment one gains a push without gaining
// a derived line, it stops being DECLARED-EMPTY and becomes CANNOT-FAIL.
//
// (No count is written here on purpose. The first draft of this paragraph said
// "the 21" — measured on one tree — and the next tree had 29. A number in a
// comment is a claim that rots, which is item87's whole defect in miniature; the
// live count is in the check's own detail, where it is measured every run.)
//
// ---------------------------------------------------------------------------
// NOT THIS ITEM'S BUSINESS, AND NAMED SO IT IS NOT MISTAKEN FOR COVERAGE:
// whether a parked check can itself return false. 37 pok() calls in 13 files
// pass a constant `true` — among them item87's four records, whose successor
// (the New Page chooser) is unbuilt, and bm1's "no historic check falsified"
// sweep record. Those are documentary by design, "named rather than invented",
// and a rule forcing them to measure something would push people to invent a
// measurement. This guard proves a failing park CAN REACH the suite; it does not
// prove a park can fail. (Seven constant `false` calls are PARKED-DRIVER probes
// on failure branches — correct, and a different thing again.)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const HERE = path.dirname(fileURLToPath(import.meta.url));

// --- comments out, strings kept ----------------------------------------------
// A parked original is quoted VERBATIM in a comment, and that quote can itself
// contain `parkedChecks.push(` or "PARKED: FAIL". Counting prose as code is how
// an audit reads a comment as a check — it has already happened once in this
// lane, reading ab1 as 16 parked checks against 15 run.
function stripComments(src) {
  let out = '';
  let quote = null;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quote) {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 1; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      if (nl < 0) return out;
      out += '\n';
      i = nl;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) return out;
      i = end + 1;
      continue;
    }
    out += c;
  }
  return out;
}

// Every string or template literal that carries a PARKED verdict.
function verdictLiterals(code) {
  return [...code.matchAll(/`[^`]*\bPARKED:[^`]*`|'[^'\n]*\bPARKED:[^'\n]*'|"[^"\n]*\bPARKED:[^"\n]*"/g)]
    .map((m) => m[0])
    .filter((s) => /PARKED:\s*(PASS|FAIL|\$\{)/.test(s));
}

export function classify(source) {
  const code = stripComments(source);
  // A parked array is any `const|let <name> = []` whose name says so. Detected
  // by DECLARATION and PUSH, never by the shape of a helper — a helper-shaped
  // detector missed item9192, whose parks arrive another way.
  const parkArrays = [...new Set(
    [...code.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\[\s*\]/g)]
      .map((m) => m[1])
      .filter((n) => /park/i.test(n)),
  )];
  const pushes = parkArrays.reduce(
    (n, a) => n + [...code.matchAll(new RegExp(`\\b${a}\\.push\\(`, 'g'))].length, 0);
  const lines = verdictLiterals(code);
  const hasLine = lines.length > 0;
  const canFail = lines.some((l) => /PARKED:\s*FAIL/.test(l));
  const readsParkLength = lines.some((l) => parkArrays.some((a) => l.includes(`${a}.length`)));
  const readsSomeLength = lines.some((l) => /\$\{[^}]*\.length/.test(l));

  let kind;
  if (pushes === 0) kind = hasLine ? 'DECLARED-EMPTY' : 'SILENT';
  else if (!hasLine) kind = 'PARKS-SILENTLY';
  else if (!canFail) kind = 'CANNOT-FAIL';
  else if (!readsParkLength && readsSomeLength) kind = 'OTHER-ARRAY';
  else if (!readsParkLength) kind = 'LITERAL-COUNT';
  else kind = 'DERIVED';
  return { kind, parkArrays, pushes, hasLine, canFail, readsParkLength };
}

const LAWFUL = new Set(['DERIVED', 'DECLARED-EMPTY', 'SILENT']);

// --- the real tree -----------------------------------------------------------
const files = existsSync(HERE) ? readdirSync(HERE).filter((f) => f.endsWith('.mjs')).sort() : [];
const byKind = {};
for (const f of files) {
  if (f === 'item147.mjs') continue;           // this file quotes every shape in prose and fixtures
  const r = classify(readFileSync(path.join(HERE, f), 'utf8'));
  (byKind[r.kind] ||= []).push(f);
}
const defects = Object.entries(byKind).filter(([k]) => !LAWFUL.has(k));
const scanned = Object.values(byKind).reduce((n, l) => n + l.length, 0);

ok(`147: every file's PARKED verdict can say FAIL whenever it has anything that can fail — ${defects.reduce((n, [, l]) => n + l.length, 0)} file(s) in a defect class`,
  defects.length === 0,
  JSON.stringify(Object.fromEntries(defects), null, 1));

// SILENT and DECLARED-EMPTY are both lawful, and they are reported apart on
// purpose: a file that prints nothing and a file with nothing to print must not
// look identical. The detail NAMES each.
ok(`147: silence is lawful only where there is nothing to print — ${(byKind.SILENT || []).length} SILENT file(s) and ${(byKind['DECLARED-EMPTY'] || []).length} DECLARED-EMPTY file(s), none of which pushes a parked check`,
  (byKind.SILENT || []).length + (byKind['DECLARED-EMPTY'] || []).length > 0 && !(byKind['PARKS-SILENTLY'] || []).length,
  JSON.stringify({ SILENT: byKind.SILENT || [], DECLARED_EMPTY: byKind['DECLARED-EMPTY'] || [] }, null, 1));

// COVERAGE — a classifier that put everything in one lawful bucket would report
// a clean tree while having distinguished nothing (item 141's blind green).
ok(`147 (coverage): every file was classified, and the classifier DISTINGUISHES — ${scanned} of ${files.length - 1} files, ${(byKind.DERIVED || []).length} of them DERIVED. A scan that found no derived verdicts would be a broken classifier, not a tree without parks`,
  scanned === files.length - 1 && (byKind.DERIVED || []).length > 20,
  JSON.stringify(Object.fromEntries(Object.entries(byKind).map(([k, l]) => [k, l.length]))));

// --- falsifications ----------------------------------------------------------
// Synthetic files, because proving these against the real tree means breaking it.
const HELPER = "const parkedChecks = [];\nif (process.env.HARNESS_PARKED === '1') {\n  const park = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });\n";
const DERIVED_LINE = "  const parkedPass = parkedChecks.every((c) => c.pass);\n  console.log(parkedPass\n    ? `\\nX PARKED: PASS (${parkedChecks.length} checks)`\n    : `\\nX PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);\n}\n";
const F = {
  item87: `${HELPER}  park('PARKED (was "a")', true);\n  park('PARKED (was "b")', true);\n  console.log('\\nX PARKED: PASS (0 checks) — parks nothing.');\n}\n`,
  derived: `${HELPER}  park('PARKED (was "a")', true);\n${DERIVED_LINE}`,
  honestCountNoFail: `${HELPER}  park('PARKED (was "a")', true);\n  console.log(\`\\nX PARKED: PASS (\${parkedChecks.length} checks)\`);\n}\n`,
  parksSilently: `${HELPER}  park('PARKED (was "a")', true);\n}\n`,
  declaredEmpty: "console.log('\\nX PARKED: PASS (0 checks) — parks nothing.');\n",
  silent: "console.log('X VERIFY: PASS (3 checks)');\n",
  loop: `${HELPER}  for (const w of [800, 1100, 1400]) park(\`PARKED (was "at \${w}")\`, true);\n${DERIVED_LINE}`,
  pushInComment: "// parkedChecks.push({ name: 'PARKED (was ...)' });  -- a verdict quote: X PARKED: FAIL\nconsole.log('X VERIFY: PASS (1 checks)');\n",
  otherArray: `${HELPER}  park('PARKED (was "a")', true);\n  const parkedPass = parkedChecks.every((c) => c.pass);\n  console.log(parkedPass ? \`\\nX PARKED: PASS (\${checks.length} checks)\` : \`\\nX PARKED: FAIL — \${checks.length} failed\`);\n}\n`,
  driverBranch: `${HELPER}  if (!present) { park('PARKED-DRIVER: the row is present', false, 'absent'); } else { park('PARKED (was "row opens")', true); }\n${DERIVED_LINE}`,
};
const k = (name) => classify(F[name]).kind;

ok('147 FALSIFICATION: item87\'s exact shape — parked checks pushed, a literal "PARKED: PASS (0 checks)" line — is CANNOT-FAIL. The file this item exists for',
  k('item87') === 'CANNOT-FAIL', k('item87'));
ok('147 (the control): a derived line with a FAIL form over pushed checks is DERIVED and lawful — so the guard is a matcher rather than a wall',
  k('derived') === 'DERIVED', k('derived'));
ok('147 FALSIFICATION: an HONEST count with no FAIL form is still CANNOT-FAIL — reading the array\'s length fixes the number and not the verdict, and the verdict is the graver half',
  k('honestCountNoFail') === 'CANNOT-FAIL', k('honestCountNoFail'));
ok('147 FALSIFICATION: parked checks pushed with no PARKED line at all are PARKS-SILENTLY — a file whose parks can fail and which never says so is not made lawful by saying nothing',
  k('parksSilently') === 'PARKS-SILENTLY', k('parksSilently'));
ok('147 (the control): a literal PASS line in a file that pushes NOTHING is DECLARED-EMPTY and lawful — the 21 such files are honest today, and flagging them would teach people to delete the declaration',
  k('declaredEmpty') === 'DECLARED-EMPTY', k('declaredEmpty'));
ok('147 (the control): a file with no parks and no line is SILENT — lawful, and a DIFFERENT class from DECLARED-EMPTY, so the two never look alike',
  k('silent') === 'SILENT', k('silent'));
ok('147 (the control): one call site in a LOOP is DERIVED, not a count mismatch — fx7 runs 3 parks from 1 call, and a static call count would have accused it',
  k('loop') === 'DERIVED', k('loop'));
ok('147 (the control): a push and a FAIL form that exist only in a COMMENT count for nothing — a verbatim-quoted original is prose, and this lane has already misread one as a check',
  k('pushInComment') === 'SILENT', k('pushInComment'));
ok('147 FALSIFICATION: a verdict that reads the length of the LIVE checks array is OTHER-ARRAY — a derived-looking line can still count the wrong list',
  k('otherArray') === 'OTHER-ARRAY', k('otherArray'));
ok('147 (the control): a PARKED-DRIVER probe on the failure branch of an existence check is DERIVED — cd2 runs 10 of 13 call sites because three fire only when an element is absent, and that is the house law working',
  k('driverBranch') === 'DERIVED', k('driverBranch'));

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// This file parks nothing, and says so in the form it enforces: derived, and able to fail.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nITEM147 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; item 147 parks nothing`
    : `\nITEM147 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM147 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM147 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
