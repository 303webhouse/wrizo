// ITEM 194 — READS A REPORT-ONLY REACH RUN. Browserless.
//
//   HARNESS_REACH_REPORT=<file> node scripts/run-suite.mjs        (the one short box use)
//   node scripts/reach-report.mjs <file>
//
// The run appends one JSON line per `app.click(label)` press (runtime-verify.mjs's
// report-only mode; verdicts never move). This tool turns those lines into the
// measurement Fable's ruling asks for: WHICH OF THE SUITE'S PRESSES A PERSON COULD NOT
// HAVE MADE — each one either a fixture skipping a person's step (a scroll, a hover:
// fix the fixture to take it) or a real finding.
//
// THE COVERAGE NUMBER SITS BESIDE THE COUNT, ALWAYS. A report that says "0 unreachable"
// after exercising a fraction of the call sites has said nothing: the static census
// (a regex over the harness for `app.click(`) is printed against the files that
// actually produced a press, and every file with sites but NO observed press is listed
// as UNCOVERED. A guard can pass while blind; this one says how blind.
//
// Stratum 2 (in-string `.click()` inside evalJs — 630 raw candidates) is NOT measured
// by this mode and is not counted here; it stays a candidate list until read per site.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERDICTS, couldNotHaveBeenPressed } from './reach-classify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.join(HERE, 'harness');
const file = process.argv[2] || process.env.HARNESS_REACH_REPORT;
if (!file) { console.error('usage: node scripts/reach-report.mjs <report.jsonl>'); process.exit(2); }

const rows = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l, i) => {
  try { return JSON.parse(l); } catch { throw new Error(`report line ${i + 1} is not JSON — the report is truncated or corrupt`); }
});

// --- the static census: `app.click(` call sites per harness file -------------
const sites = {};
for (const f of readdirSync(HARNESS).filter((x) => x.endsWith('.mjs'))) {
  const n = (readFileSync(path.join(HARNESS, f), 'utf8').match(/\bapp\.click\(/g) || []).length;
  if (n) sites[f] = n;
}
const siteFiles = Object.keys(sites);
const siteTotal = siteFiles.reduce((a, f) => a + sites[f], 0);

const byVerdict = Object.fromEntries(VERDICTS.map((v) => [v, rows.filter((r) => r.verdict === v)]));
const observedFiles = new Set(rows.map((r) => r.file));
const uncovered = siteFiles.filter((f) => !observedFiles.has(f));
const distinct = new Set(rows.map((r) => `${r.file}\u0000${r.label}`));
const blocked = rows.filter((r) => couldNotHaveBeenPressed(r));

console.log('REACH REPORT (report-only; no verdict moved) — app.click presses a person could not have made\n');
console.log(`  presses observed:            ${rows.length}   (${distinct.size} distinct file+label)`);
console.log(`  from files:                  ${observedFiles.size} of ${siteFiles.length} files that HAVE app.click sites`);
console.log(`  static call sites:           ${siteTotal}   <- the population; observed presses are a subset until every file has run`);
for (const v of VERDICTS) console.log(`    ${v.padEnd(13)} ${String(byVerdict[v].length).padStart(5)}`);
console.log(`  COULD NOT HAVE BEEN PRESSED: ${blocked.length}   (everything except reachable, and a partial whose centre hits)\n`);

if (uncovered.length) {
  console.log(`  ⚠ UNCOVERED — ${uncovered.length} file(s) have app.click sites and produced NO press in this run (a run that never reached them says nothing about them):`);
  console.log('    ' + uncovered.map((f) => `${f}(${sites[f]})`).join('  ') + '\n');
}

if (blocked.length) {
  console.log('  THE LIST — each is a fixture skipping a person\'s step, or a real finding. Read each; do not batch them.');
  const groups = {};
  for (const r of blocked) (groups[r.file] ??= []).push(r);
  for (const f of Object.keys(groups).sort()) {
    console.log(`  --- ${f} (${groups[f].length}) ---`);
    for (const r of groups[f]) {
      const why = r.verdict === 'covered' ? `covered by ${r.by ?? '?'}` : r.verdict === 'partial' ? `partial ${r.hits}/${r.total}, centre ${r.centerHit ? 'hits' : 'MISSES'}${r.by ? `, rest under ${r.by}` : ''}` : r.verdict;
      console.log(`    ${JSON.stringify(r.label).padEnd(34)} ${why}${r.pointerEventsNone ? ' [pointer-events:none]' : ''}${r.clipped ? ' [partly off-screen]' : ''}`);
    }
  }
  console.log('');
}

// The same press seen under two different verdicts is a reach that depends on state or timing —
// worth its own line, because a single verdict per (file,label) would hide it.
const seen = {};
for (const r of rows) (seen[`${r.file} ${r.label}`] ??= new Set()).add(r.verdict);
const mixed = Object.entries(seen).filter(([, v]) => v.size > 1);
if (mixed.length) {
  console.log(`  STATE-DEPENDENT — ${mixed.length} press(es) reached under one state and not another:`);
  for (const [k, v] of mixed) console.log(`    ${k}  ->  ${[...v].join(' / ')}`);
  console.log('');
}
