// RHIZOME-LATENCY MUTANTS (ticket 150, FIX, Nov 2). rhizome-latency.mjs's live half was made stable by changing what the flash is held against (see its header); that is only worth
// anything if a REAL latency regression still turns it red. This file injects two, from the page (no product change), runs the guard on each, and requires red:
//   M1  RL_MUTANT_MS=40        every key typed while the flash is holding or fading costs 40 ms of main-thread time (a drop-shadow/repaint cost on the keystroke path). 40, not less: the guard's
//                              metric (keydown -> the 2nd frame) hides a per-key cost under about a frame - measured: 10 and 20 ms leave the medians where they were, 40 puts every key at ~43 ms
//   M2  RL_MUTANT_STALL_MS=150 one 150 ms stall at the first key of every fade (Fable's suspect: the filter dropped at the fade's start, one big repaint)
// and for each: the mutant LANDED (the guard's own raw samples show it - M1: the flash and fade medians are >= 10 ms over their controls'; M2: a fade key over 150 ms), and the guard's verdict is the right red:
//   M1 fails B (the flash) AND C (the fade) on the median budget; M2 fails C on the 100 ms budget and B stays green (the stall is in the fade).
// Neither mutant is retried away: the retry in the guard is only for a control burst that caught a box stall, and the injected cost is not in the control.
// Each mutant makes the guard measure twice (a red is confirmed by a second measurement) - about 6 minutes a mutant.
// Run: node scripts/harness/rhizome-latency-mutant.mjs   (from apps/desktop; two live runs of the guard - a box turn; it inherits WS_BOX_TURN)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const GUARD = path.join(here, 'rhizome-latency.mjs');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(0.5 * s.length))] : null; };

const MUTANTS = [
  { id: 'M1', env: { RL_MUTANT_MS: '40' }, what: 'a 40 ms cost on every flash/fade key', red: ['B typing inside the flash', 'C typing inside the fade'], green: [] },
  { id: 'M2', env: { RL_MUTANT_STALL_MS: '150' }, what: 'one 150 ms stall at the first key of every fade', red: ['C typing inside the fade'], green: ['B typing inside the flash'] },
];

for (const m of MUTANTS) {
  const r = spawnSync(process.execPath, [GUARD], { env: { ...process.env, ...m.env }, encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}`;
  const rawLine = out.split('\n').find((l) => l.startsWith('RL-RAW: '));
  const raw = rawLine ? JSON.parse(rawLine.slice(8)) : null;
  const line = (prefix) => out.split('\n').find((l) => l.startsWith('PASS  ' + prefix) || l.startsWith('FAIL  ' + prefix)) || '';
  ok(`${m.id} (ran): the guard ran to its verdict with ${m.what} injected`, r.status !== null && !!raw, `exit=${r.status} raw=${!!raw}`);
  if (!raw) continue;
  const landed = m.id === 'M1'
    ? median(raw.hold) - median(raw.restPre) >= 10 && median(raw.fade) - median(raw.restFast) >= 10
    : Math.max(...raw.fade) >= 150;
  ok(`${m.id} (landed): the injected regression is visible in the guard's own samples`, landed,
    JSON.stringify({ mutantMs: raw.mutantMs, mutantStallMs: raw.mutantStallMs, controlMedian: median(raw.restPre), controlFastMedian: median(raw.restFast), flashMedian: median(raw.hold), fadeMedian: median(raw.fade), fadeMax: Math.max(...raw.fade) }));
  ok(`${m.id}: the guard goes RED on it - ${m.red.join(' and ')} fail${m.green.length ? `, ${m.green.join(' and ')} stay${m.green.length === 1 ? 's' : ''} green` : ''}`,
    r.status === 1 && m.red.every((p) => line(p).startsWith('FAIL')) && m.green.every((p) => line(p).startsWith('PASS')), `exit=${r.status} | ${[...m.red, ...m.green].map((p) => line(p).slice(0, 5) + p).join(' | ')}`);
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
console.log(failed.length ? `\nRHIZOME-LATENCY-MUTANT VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nRHIZOME-LATENCY-MUTANT VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
