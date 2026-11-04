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
// Each mutant makes the guard measure twice (a red is confirmed by a second measurement) - about 6 minutes a mutant.
// Run: node scripts/harness/rhizome-latency-mutant.mjs   (from apps/desktop; four live runs of the guard - a box turn; it inherits WS_BOX_TURN)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const GUARD = path.join(here, 'rhizome-latency.mjs');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(0.5 * s.length))] : null; };

const B = 'B typing inside the flash', C = 'C typing inside the fade', B2 = 'B2 main-thread time', C2 = 'C2 main-thread time';
const MUTANTS = [
  { id: 'M0', env: {}, what: 'nothing (the control)', exit: 0, red: [], green: [B, C, B2, C2] },
  { id: 'M1', env: { RL_MUTANT_MS: '40' }, what: 'a 40 ms cost on every flash/fade key', exit: 1, red: [B, C, B2, C2], green: [] },
  { id: 'M2', env: { RL_MUTANT_STALL_MS: '150' }, what: 'one 150 ms stall at the first key of every fade', exit: 1, red: [C], green: [B, B2] },
  { id: 'M3', env: { RL_MUTANT_MS: '15' }, what: 'a 15 ms cost on every flash/fade key', exit: 1, red: [B2, C2], green: [] },
];

for (const m of MUTANTS) {
  const r = spawnSync(process.execPath, [GUARD], { env: { ...process.env, ...m.env }, encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}`;
  const rawLine = out.split('\n').find((l) => l.startsWith('RL-RAW: '));
  const raw = rawLine ? JSON.parse(rawLine.slice(8)) : null;
  const line = (prefix) => out.split('\n').find((l) => l.startsWith('PASS  ' + prefix) || l.startsWith('FAIL  ' + prefix)) || '';
  ok(`${m.id} (ran): the guard ran to its verdict with ${m.what} injected`, r.status !== null && !!raw, `exit=${r.status} raw=${!!raw}`);
  if (!raw) continue;
  const cost = (k) => median(raw.fine[k].cost);
  const info = { mutantMs: raw.mutantMs, mutantStallMs: raw.mutantStallMs, controlMedian: median(raw.restPre), flashMedian: median(raw.hold), fadeMedian: median(raw.fade), fadeMax: Math.max(...raw.fade),
    costControl: cost('pre'), costFlash: cost('hold'), costFastControl: cost('fast'), costFade: cost('fade') };
  if (m.id !== 'M0') {
    const landed = m.id === 'M1' ? median(raw.hold) - median(raw.restPre) >= 10 && median(raw.fade) - median(raw.restFast) >= 10
      : m.id === 'M2' ? Math.max(...raw.fade) >= 150
        : cost('hold') - cost('pre') >= 10 && cost('fade') - cost('fast') >= 10;
    ok(`${m.id} (landed): the injected regression is visible in the guard's own samples`, landed, JSON.stringify(info));
  }
  ok(`${m.id}: the verdict - ${m.red.length ? `${m.red.join(' and ')} RED` : 'all green'}${m.red.length && m.green.length ? ', ' : ''}${m.red.length && m.green.length ? `${m.green.join(' and ')} stay green` : ''}`,
    r.status === m.exit && m.red.every((p) => line(p).startsWith('FAIL')) && m.green.every((p) => line(p).startsWith('PASS')),
    `exit=${r.status} | ${[...m.red, ...m.green].map((p) => line(p).slice(0, 5) + p).join(' | ')}${m.id === 'M0' ? ' | ' + JSON.stringify(info) : ''}`);
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
console.log(failed.length ? `\nRHIZOME-LATENCY-MUTANT VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nRHIZOME-LATENCY-MUTANT VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
