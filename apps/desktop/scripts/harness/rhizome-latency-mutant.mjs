// RHIZOME-LATENCY MUTANTS (tickets 150 and 150b, FIX). rhizome-latency.mjs's live half is only worth anything if a REAL latency regression still turns it red. This file injects them from the
// page (no product change), runs the guard on each, and requires the right verdict:
//   M0  (control)              nothing injected: the guard is GREEN - every check, including the finer B2/C2 (main passes)
//   M1  RL_MUTANT_MS=40        every key typed while the flash is holding or fading costs 40 ms of main-thread time. The frame clock sees this (B and C: the keys land ~43 ms late) and so does the finer measure
//   M2  RL_MUTANT_STALL_MS=150 one 150 ms stall at the first key of every fade (Fable's suspect: the filter dropped at the fade's start, one big repaint): C (the 100 ms ceiling) red, B and B2 green
//   M3  RL_MUTANT_MS=15        (150b) a 15 ms cost on every flash/fade key - the case the frame clock HIDES: keydown -> the 2nd frame still makes the frame it was going to make, so B and C
//                              may stay green (measured: 10 and 20 ms leave their medians where they were). The finer measure - the key's handler task plus the frame that paints it, in
//                              main-thread ms - sees it: B2 and C2 must be RED. No assertion is made about B and C here: that they are blind to it is the reason B2/C2 exist.
// For each mutant: it LANDED (the guard's own raw samples show it), and the verdict is the one above. None is retried away: the guard's reruns are for a control burst that caught a box stall (void) and
// for a red that does not reproduce; an injected cost is in every measurement.
// (M4 adds RL_MUTANT_FADE_MS=10: a moderate cost on the fade alone - C or C2 must stay red. Five mutants now, about 30 minutes in all.)
// RL_REF (the same turn's main control, `node scripts/rhizome-latency-ref.mjs --env <control logs>`) passes through to every guard run below; without it the guard's default reference stands. C and C2 are
// held to the fade's reference shift (it is ~9 ms behind the fast control's on this box even on main), so M1/M2/M4 must clear THAT, not +5: M4's +10 ms per fade key adds to a ~9 shift and ~3 cost.
// Each mutant makes the guard measure twice (a red is confirmed by a second measurement) - about 6 minutes a mutant.
// THE SWAP KEY (Nick's ruling 1, Nov 6): by day the first key of a control burst may run to 70 ms, and nothing else is excused. Two mutants hold it shut, run on an Arbor day build
// (WS_URL_SEARCH='?arbor2=1&arbor2room=day', which passes through to the guard):
//   M5  RL_MUTANT_SWAP_MS=80    80 ms on the first key of every control burst (the swap key): A+S RED, A+ green (the other keys are untouched)
//   M6  RL_MUTANT_SECOND_MS=35  35 ms on the SECOND key of every control burst (it lands ~52-68 ms: under the swap key's 70, over 50): A+ RED, A+S green. It only counts as landed when a
//                              second key fell between 50 and 70 ms - a second key over 70 would be red under ANY 70 ms rule and so would test the cap, not the place (a green mutant may test another guard).
// Both voids every measurement (an injected cost is in each), so each takes the guard's four measurements - about 10 minutes a mutant.
// RL_MUTANTS=M0,M5,M6 runs only those (default: all).
// PARKED - SUPERSEDED by the reference-shift check (Fable, Nov 6; coarse-C stabilising). The line(s) that stood, verbatim (the successor is the line below this block):
// // Run: node scripts/harness/rhizome-latency-mutant.mjs   (from apps/desktop; four live runs of the guard - a box turn; it inherits WS_BOX_TURN)
// Run: node scripts/harness/rhizome-latency-mutant.mjs   (from apps/desktop; five mutants, each a live run or two of the guard - a box turn; it inherits WS_BOX_TURN)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const GUARD = path.join(here, 'rhizome-latency.mjs');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(0.5 * s.length))] : null; };

const B = 'B typing inside the flash', C = 'C typing inside the fade', B2 = 'B2 main-thread time', C2 = 'C2 main-thread time';
const AP = 'A+ the rest baselines', AS = 'A+S THE SWAP KEY';   // THE SWAP KEY's two checks
const MUTANTS = [
  { id: 'M0', env: {}, what: 'nothing (the control)', exit: 0, red: [], green: [B, C, B2, C2] },
  { id: 'M1', env: { RL_MUTANT_MS: '40' }, what: 'a 40 ms cost on every flash/fade key', exit: 1, red: [B, C, B2, C2], green: [] },
  { id: 'M2', env: { RL_MUTANT_STALL_MS: '150' }, what: 'one 150 ms stall at the first key of every fade', exit: 1, red: [C], green: [B, B2] },
  { id: 'M3', env: { RL_MUTANT_MS: '15' }, what: 'a 15 ms cost on every flash/fade key', exit: 1, red: [B2, C2], green: [] },
  // M4 (coarse-C stabilising, Nov 5, Fable): a MODERATE cost on the FADE's keys alone. The 100 ms ceiling only catches a stall (M2); a per-key cost of ~10 ms is below it and, with C's median slack widened, may be below C's budget
  // too - so the requirement is that C OR C2 still goes red (C2 is the one built for it), and the hold (B, B2), which this does not touch, stays green.
  { id: 'M4', env: { RL_MUTANT_FADE_MS: '10' }, what: 'a 10 ms cost on the fade\'s keys alone', exit: 1, red: [], redAny: [C, C2], green: [B, B2] },
  // THE SWAP KEY (Nick's ruling 1, Nov 6): each mutant reds its own half of the rule and leaves the other half green
  { id: 'M5', env: { RL_MUTANT_SWAP_MS: '80' }, what: '80 ms on the swap key (the first key of every control burst)', exit: 1, red: [AS], green: [AP] },
  { id: 'M6', env: { RL_MUTANT_SECOND_MS: '35' }, what: 'a second slow key in every control burst (35 ms on its second key)', exit: 1, red: [AP], green: [AS] },
];
const ONLY = process.env.RL_MUTANTS ? process.env.RL_MUTANTS.split(',').map((s) => s.trim()).filter(Boolean) : null;

for (const m of MUTANTS.filter((x) => !ONLY || ONLY.includes(x.id))) {
  const r = spawnSync(process.execPath, [GUARD], { env: { ...process.env, ...m.env }, encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}`;
  const rawLine = out.split('\n').find((l) => l.startsWith('RL-RAW: '));
  const raw = rawLine ? JSON.parse(rawLine.slice(8)) : null;
  const line = (prefix) => out.split('\n').find((l) => l.startsWith('PASS  ' + prefix) || l.startsWith('FAIL  ' + prefix)) || '';
  ok(`${m.id} (ran): the guard ran to its verdict with ${m.what} injected`, r.status !== null && !!raw, `exit=${r.status} raw=${!!raw}`);
  if (!raw) continue;
  const cost = (k) => median(raw.fine[k].cost);
  const bursts = raw.bursts ? [...raw.bursts.pre, ...raw.bursts.fast] : [];
  // M5 landed: every burst was typed by day (else it tests nothing about the day rule) and the swap keys carry the 80 ms
  const swapLanded = () => bursts.length > 0 && bursts.every((b) => b.day) && bursts.every((b) => b.ms.length && b.ms[0] >= 80);
  // M6 landed: every burst by day, and at least one SECOND key fell between 50 and 70 ms (where only the place in the burst can red it)
  const secondLanded = () => bursts.length > 0 && bursts.every((b) => b.day) && bursts.some((b) => b.ms.length > 1 && b.ms[1] > 50 && b.ms[1] <= 70);
  const placeInfo = m.id === 'M5' || m.id === 'M6' ? { bursts: bursts.length, day: bursts.filter((b) => b.day).length, first: bursts.map((b) => Math.round(b.ms[0])), second: bursts.map((b) => Math.round(b.ms[1])) } : null;
  const info = { mutantMs: raw.mutantMs, mutantStallMs: raw.mutantStallMs, controlMedian: median(raw.restPre), flashMedian: median(raw.hold), fadeMedian: median(raw.fade), fadeMax: Math.max(...raw.fade),
    costControl: cost('pre'), costFlash: cost('hold'), costFastControl: cost('fast'), costFade: cost('fade') };
  if (m.id !== 'M0') {
    const landed = m.id === 'M1' ? median(raw.hold) - median(raw.restPre) >= 10 && median(raw.fade) - median(raw.restFast) >= 10
      : m.id === 'M2' ? Math.max(...raw.fade) >= 150
        // PARKED - SUPERSEDED by the reference-shift check (Fable, Nov 6; coarse-C stabilising). The line(s) that stood, verbatim (the successor is the line below this block):
//         : cost('hold') - cost('pre') >= 10 && cost('fade') - cost('fast') >= 10;
        : m.id === 'M5' ? swapLanded(raw)
        : m.id === 'M6' ? secondLanded(raw)
        : m.id === 'M4' ? cost('fade') - cost('fast') >= 6 && cost('hold') - cost('pre') < 4   // 10 ms on every fade key adds +6.5..+14 to the fade's cost median; the hold is untouched
          : cost('hold') - cost('pre') >= 10 && cost('fade') - cost('fast') >= 10;
    ok(`${m.id} (landed): the injected regression is visible in the guard's own samples`, landed, JSON.stringify(placeInfo ? { ...info, ...placeInfo } : info));
  }
  // PARKED - SUPERSEDED by the reference-shift check (Fable, Nov 6; coarse-C stabilising). The line(s) that stood, verbatim (the successor is the line below this block):
//   ok(`${m.id}: the verdict - ${m.red.length ? `${m.red.join(' and ')} RED` : 'all green'}${m.red.length && m.green.length ? ', ' : ''}${m.red.length && m.green.length ? `${m.green.join(' and ')} stay green` : ''}`,
//     r.status === m.exit && m.red.every((p) => line(p).startsWith('FAIL')) && m.green.every((p) => line(p).startsWith('PASS')),
//     `exit=${r.status} | ${[...m.red, ...m.green].map((p) => line(p).slice(0, 5) + p).join(' | ')}${m.id === 'M0' ? ' | ' + JSON.stringify(info) : ''}`);
  const redAny = m.redAny || null;   // at least one of these goes red (M4: the coarse C or the finer C2 - which one is not the point, that the fade's cost cannot slip through both is)
  ok(`${m.id}: the verdict - ${redAny ? `${redAny.join(' or ')} RED` : m.red.length ? `${m.red.join(' and ')} RED` : 'all green'}${(m.red.length || redAny) && m.green.length ? ', ' : ''}${(m.red.length || redAny) && m.green.length ? `${m.green.join(' and ')} stay green` : ''}`,
    r.status === m.exit && m.red.every((p) => line(p).startsWith('FAIL')) && (!redAny || redAny.some((p) => line(p).startsWith('FAIL'))) && m.green.every((p) => line(p).startsWith('PASS')),
    `exit=${r.status} | ${[...m.red, ...(redAny || []), ...m.green].map((p) => line(p).slice(0, 5) + p).join(' | ')}${m.id === 'M0' ? ' | ' + JSON.stringify(info) : ''}`);
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
console.log(failed.length ? `\nRHIZOME-LATENCY-MUTANT VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nRHIZOME-LATENCY-MUTANT VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
