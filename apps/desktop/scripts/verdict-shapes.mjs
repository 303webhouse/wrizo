// The shapes of a harness verdict line, in one place so run-suite.mjs and its
// check read the same definition.
//
// A harness that returned a pass line the runner cannot see comes out of the
// suite as NOVERDICT, which looks like a hole in the evidence, not a pass.
// guided-w2 ("N/M checks green, X/Y mutants landed"), guided-w2-part2
// ("GUIDED-W2 PART 2: PASS (n/m)") and guided-w3-part2 ("GUIDED-W3 PART 2: PASS ...")
// each print a verdict that the old `VERIFY ...:` shape missed (Oct 27, b18).
//
// Every shape is a line-anchored whole-line match, so a log line that merely
// mentions a count cannot be taken for a verdict.

// "<NAME>[ PART n]: PASS|FAIL ..."
const NAMED = /^[A-Z][A-Z0-9-]*(?: [A-Z0-9-]+)*: (?:PASS|FAIL)\b/;
// "<n>/<m> checks green, <x>/<y> mutants landed"
const GREEN = /^(\d+)\/(\d+) checks green, (\d+)\/(\d+) mutants landed\b/;

export function isVerdictLine(line) {
  const l = line.trim();
  return /\bVERIFY\b[^\n]*:/.test(l) || NAMED.test(l) || GREEN.test(l);
}

// Verdicts that are a plain failure. A green-count line fails when any
// fraction is short, whether or not the word FAIL appears.
export function isFailedVerdict(line) {
  const l = line.trim();
  if (/\bFAIL\b/.test(l)) return true;
  const g = GREEN.exec(l);
  return !!g && (g[1] !== g[2] || g[3] !== g[4]);
}
