// BUG #99 - THE BAR FOR THE FREE WRITE SPEED PROBE (fw-latency.mjs). Node only; reads three run logs and prints PASS or FAIL per theme, page size and measure.
// Run: node scripts/harness/writing-audit/fw-latency-bar.mjs A1.log B.log A2.log   (the logs hold `FWLAT {json}` lines; one run's log may hold several themes)
// Fable's bar (Nov 14): for every measure that is a MEDIAN, B's median is within max(1 ms, 10% of A's) of A's, against BOTH A runs; for every measure that is a P95, B's p95 is above neither A run's p95 by more than the gap between the two A runs' p95.
// The measures: letter, enter (the editor's own DOM change after the key) and paintLetter, paintEnter (the end of the next frame).
import { readFileSync } from 'node:fs';

const [fa1, fb, fa2] = process.argv.slice(2);
if (!fa1 || !fb || !fa2) { console.error('usage: fw-latency-bar.mjs A1.log B.log A2.log'); process.exit(2); }
const load = (f) => {
  const out = {};
  for (const l of readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/FWLAT (\{.*\})\s*$/); if (!m) continue; try { const r = JSON.parse(m[1]); out[`${r.theme}/${r.words}`] = r; } catch { /* not a row */ } }
  return out;
};
const A1 = load(fa1), B = load(fb), A2 = load(fa2);
const MEASURES = ['letter', 'enter', 'paintLetter', 'paintEnter'];
let bad = 0, n = 0;
for (const key of Object.keys(B).sort()) {
  const a1 = A1[key], a2 = A2[key], b = B[key];
  if (!a1 || !a2) { console.log(`FAIL  ${key}: no row in both A logs`); bad++; continue; }
  for (const m of MEASURES) {
    const med = (a) => a[`${m}_median`], p95 = (a) => a[`${m}_p95`];
    if ([med(a1), med(a2), med(b), p95(a1), p95(a2), p95(b)].some((x) => typeof x !== 'number')) { console.log(`FAIL  ${key} ${m}: a number is missing`); bad++; continue; }
    n++;
    const okMed = [a1, a2].every((a) => med(b) - med(a) <= Math.max(1, 0.1 * med(a)));
    const gap = Math.abs(p95(a1) - p95(a2));
    const okP95 = [a1, a2].every((a) => p95(b) - p95(a) <= gap);
    const ok = okMed && okP95;
    if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${key} ${m}: median A1 ${med(a1)} B ${med(b)} A2 ${med(a2)}${okMed ? '' : ' (MEDIAN OVER)'}; p95 A1 ${p95(a1)} B ${p95(b)} A2 ${p95(a2)} (A gap ${Math.round(gap * 10) / 10})${okP95 ? '' : ' (P95 OVER)'}`);
  }
}
console.log(bad ? `FW-LATENCY BAR: FAIL (${bad} of ${n})` : `FW-LATENCY BAR: PASS (${n} measures)`);
process.exitCode = bad ? 1 : 0;
