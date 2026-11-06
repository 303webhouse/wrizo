// RHIZOME-LATENCY REFERENCE (coarse-C stabilising, Nov 6, FIX). The fade's keys land a few ms behind the fast control's on this box (rhizome-latency.mjs, REF_DEFAULT); C and C2 are held to the MAIN
// CONTROL'S OWN shift of the same turn. This reads the logs of the main control runs (each holds an `RL-RAW:` line) and prints the reference to hand the guard:
//   RL_REF='{"c":9,"p95":17.5,"c2":2.8,"runs":4}' node scripts/harness/rhizome-latency.mjs
// Each number is the MEDIAN over the control runs of that run's fade-minus-fast-control shift (the fade's median, its p95, and its main-thread cost median). Four control runs or more; a reference from fewer than
// three is refused (one run's shift is just that run's luck). Browserless: node scripts/rhizome-latency-ref.mjs <log> [<log> ...]   (prints the JSON on the last line; --env prints RL_REF='...' instead)
import fs from 'node:fs';

const args = process.argv.slice(2);
const asEnv = args.includes('--env');
const files = args.filter((a) => !a.startsWith('--'));
const pct = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const r1 = (x) => Math.round(x * 10) / 10;
const shifts = [];
for (const f of files) {
  const line = fs.readFileSync(f, 'utf8').split('\n').find((l) => l.startsWith('RL-RAW: '));
  if (!line) { console.error(`no RL-RAW line in ${f} (skipped)`); continue; }
  const raw = JSON.parse(line.slice(8));
  if (!raw.fade?.length || !raw.restFast?.length || !raw.fine?.fade?.cost?.length || !raw.fine?.fast?.cost?.length) { console.error(`${f}: incomplete samples (skipped)`); continue; }
  if (raw.mutantMs || raw.mutantStallMs || raw.mutantFadeMs) { console.error(`${f}: a mutant run is not a control (skipped)`); continue; }
  shifts.push({ f, c: pct(raw.fade, 0.5) - pct(raw.restFast, 0.5), p95: pct(raw.fade, 0.95) - pct(raw.restFast, 0.95), c2: pct(raw.fine.fade.cost, 0.5) - pct(raw.fine.fast.cost, 0.5) });
}
for (const s of shifts) console.error(`${s.f}: fade shift median ${r1(s.c)} p95 ${r1(s.p95)} cost ${r1(s.c2)}`);
if (shifts.length < 3) { console.error(`REFUSED: ${shifts.length} usable control run(s); a reference needs at least 3`); process.exit(2); }
const ref = { c: r1(pct(shifts.map((s) => s.c), 0.5)), p95: r1(pct(shifts.map((s) => s.p95), 0.5)), c2: r1(pct(shifts.map((s) => s.c2), 0.5)), runs: shifts.length };
console.log(asEnv ? `RL_REF='${JSON.stringify(ref)}'` : JSON.stringify(ref));
