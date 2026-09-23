// PW's FINDING, CENSUSED — "controls where a POINTER'S REACH IS THE CLAIM".
//
// The brief names `.click()` calls that skip hit-testing the way item 130's
// did. Reading the suite found the defect has three strata, and the sharpest
// one is not a `.click()` at all:
//
//   1. `app.click(label)` — 129 sites, 53 files, ALL routed through ONE page
//      helper (`__click` in runtime-verify.mjs) that ends in `el.click()`.
//      It THROWS when the element is absent, so item 151's silence is already
//      fixed here — but a synthetic `el.click()` performs no hit-testing, so a
//      control that is present and COMPLETELY COVERED still reports success.
//      One helper; the leverage is there, not at the 129.
//   2. in-string `.click()` inside evalJs — 630 raw occurrences. A candidate
//      LIST, not a population: most are fixtures (press a tab to get
//      somewhere), and only the ones whose CHECK claims reach are offenders.
//   3. CLAIMS OF REACH PROVEN BY EXISTENCE — e.g. e3.mjs:76,
//      `ok('the Counsel grip is reachable', !!document.querySelector(...))`.
//      This is the same defect one step EARLIER than the brief's framing: not
//      a weak instrument under a fair claim, but an assertion that says
//      "reachable" and tests "present". An element can exist and be entirely
//      covered — which is precisely what item 130 found (54% of the strip
//      unreachable while fully present in the DOM).
//
// THIS TOOL CENSUSES STRATUM 3, because it is the one no existing instrument
// looks for. It reads every `ok(...)` whose CLAIM TEXT contains a reach word,
// resolves its verdict expression (one level of same-file indirection, the
// item 154 method), and reports WHAT THE CLAIM IS ACTUALLY PROVEN BY.
//
// It reports CANDIDATES, deliberately. Per the band this arc just ratified —
// a count of a syntactic shape is a list of candidates; the population is what
// survives reading each one — nothing here is called an offender by the tool.
//
// Run: node scripts/reach-claims.mjs   (no browser, no box turn)
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.join(HERE, 'harness');

// Words that make a check's claim a claim about THE POINTER GETTING THERE.
const REACH = /\b(reach|reachable|unreachable|hit-test|hittable|occlud|covered|uncovered|press(able)?|clickable|tappable|pointer)\b/i;

// Instruments that genuinely answer "can a pointer get there".
const TRUSTED = /hittablePoint|assertHittable|trustedDispatch|elementFromPoint/;
// Instruments that answer something WEAKER than the claim.
const EXISTENCE = /!!\s*document\.querySelector|!!\s*\w+\s*$|querySelectorAll\([^)]*\)\s*\]?\s*\.length|\bpresent\(/;
const SYNTHETIC = /\.click\(\)|app\.click\(/;

function resolveLocal(sf, name) {
  // One level of same-file indirection, and ONLY when the name is bound once —
  // an ambiguous name resolves to nothing rather than to a guess.
  const hits = [];
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer) {
      hits.push(n.initializer.getText(sf));
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return hits.length === 1 ? hits[0] : null;
}

const rows = [];
for (const f of readdirSync(HARNESS).filter((x) => x.endsWith('.mjs')).sort()) {
  const text = readFileSync(path.join(HARNESS, f), 'utf8');
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
        && (node.expression.text === 'ok' || node.expression.text === 'pok')
        && node.arguments.length >= 2) {
      const claimNode = node.arguments[0];
      const claim = ts.isStringLiteral(claimNode) || ts.isNoSubstitutionTemplateLiteral(claimNode)
        ? claimNode.text
        : claimNode.getText(sf);
      if (!REACH.test(claim)) return;

      const verdict = node.arguments[1];
      let proof = verdict.getText(sf);
      let via = 'inline';
      if (ts.isIdentifier(verdict)) {
        const resolved = resolveLocal(sf, verdict.text);
        if (resolved) { proof = resolved; via = `<- ${verdict.text}`; }
      }

      let instrument;
      if (TRUSTED.test(proof)) instrument = 'HIT-TEST';
      else if (SYNTHETIC.test(proof)) instrument = 'synthetic click';
      else if (EXISTENCE.test(proof)) instrument = 'EXISTENCE';
      else instrument = 'other';

      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      rows.push({ file: f, line: line + 1, instrument, via, claim: claim.replace(/\s+/g, ' ').slice(0, 88), proof: proof.replace(/\s+/g, ' ').slice(0, 78) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const by = (k) => rows.filter((r) => r.instrument === k);
console.log('REACH-CLAIM CENSUS — checks whose CLAIM is about a pointer getting there\n');
console.log(`  checks claiming reach:        ${rows.length}`);
console.log(`    proven by a HIT-TEST:       ${by('HIT-TEST').length}   <- the claim and the instrument agree`);
console.log(`    proven by EXISTENCE:        ${by('EXISTENCE').length}   <- claims reach, tests presence`);
console.log(`    proven by a SYNTHETIC click:${String(by('synthetic click').length).padStart(3)}   <- claims reach, tests a handler`);
console.log(`    other / unresolved:         ${by('other').length}   <- needs a human read, not a verdict\n`);

for (const k of ['EXISTENCE', 'synthetic click', 'other', 'HIT-TEST']) {
  const g = by(k);
  if (!g.length) continue;
  console.log(`--- ${k} (${g.length}) ---`);
  for (const r of g) {
    console.log(`  ${(r.file + ':' + r.line).padEnd(20)} ${r.claim}`);
    console.log(`  ${''.padEnd(20)}   proven by ${r.via}: ${r.proof}`);
  }
  console.log('');
}
console.log('CANDIDATES, not offenders — each still needs reading. A "setup" check that says');
console.log('"reachable" where it means "present" may be honest about its own job; the ones that');
console.log('matter are where the SUITE would report a covered control as a working one.');
