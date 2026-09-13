// ITEM 135 — THE SUSPENSION VOID, falsified. Browserless: the decision is pure
// arithmetic over two clock readings, so it costs no suite time and cannot flake.
//
// WHY THE TICKET EXISTS. The run that stamped Batch One lost a pair because the
// machine slept mid-suite. Every timing assertion and waitFor budget measured
// across that gap was measured against a clock that jumped, and the resulting
// failures looked like ordinary reds — a false accusation against the code, and
// an afternoon of debugging something that was never wrong.
//
// WHAT IS PROVEN HERE and what is not, said plainly because the boundary matters:
// these checks drive the DECISION exhaustively — both sides of the threshold, the
// boundary itself, a backwards system clock, and a healthy run. What no check
// here can establish is the PLATFORM PREMISE: that performance.now() really does
// stop advancing while Windows suspends. Proving that needs a machine actually
// put to sleep mid-run, which a suite cannot arrange. The premise fails SAFE —
// if the monotonic clock did advance through a sleep, the two readings would
// agree and this detector would stay silent. It can under-report; it cannot
// invent a VOID.
import { suspensionGap, SLEEP_TOLERANCE_MS, clockPair, gapSince } from '../sleep-detect.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// --- S1: the decision, both sides and the boundary --------------------------
{
  // A 20-minute file that actually ran for 20 minutes: the clocks agree.
  const healthy = suspensionGap(20 * 60 * 1000, 20 * 60 * 1000 - 3);
  ok('S1 (the control): a file whose wall and monotonic clocks agree is NOT slept — 3ms of drift across twenty minutes is the real noise floor, and a detector that fired on this would VOID every honest run',
    healthy.slept === false && healthy.lostMs === 3, JSON.stringify(healthy));

  // The same file with an hour of suspension inside it.
  const slept = suspensionGap(80 * 60 * 1000, 20 * 60 * 1000);
  ok('S1: an hour of wall clock with no elapsed running time IS slept, and the lost time is reported so the log says how much',
    slept.slept === true && slept.lostMs === 60 * 60 * 1000, JSON.stringify(slept));

  // The boundary, stated inclusively rather than left for someone to guess.
  const at = suspensionGap(10_000 + SLEEP_TOLERANCE_MS, 10_000);
  const justOver = suspensionGap(10_001 + SLEEP_TOLERANCE_MS, 10_000);
  ok(`S1: the boundary is EXCLUSIVE at exactly the tolerance (${SLEEP_TOLERANCE_MS}ms drift is not a sleep) and fires one millisecond past it — stated here so nobody has to read the operator to find out`,
    at.slept === false && justOver.slept === true, JSON.stringify({ at, justOver }));
}

// --- S2: a backwards system clock is not a suspension ------------------------
{
  // Someone moves the machine's clock back, or NTP steps it. Wall time then runs
  // BEHIND monotonic. That is a different fault and must not be laundered into
  // "the machine slept" — a wrong diagnosis sends the next reader hunting a
  // power setting instead of a clock change.
  const backwards = suspensionGap(5 * 60 * 1000, 25 * 60 * 1000);
  ok('S2: a wall clock that runs BEHIND the monotonic clock (a backwards time step, not a sleep) reports NO gap — negative drift clamps to zero rather than reading as a negative-length suspension',
    backwards.slept === false && backwards.lostMs === 0, JSON.stringify(backwards));
}

// --- S3: the live sampler agrees with the arithmetic -------------------------
{
  // The fixtures above prove the decision; this proves the SAMPLER, which is the
  // half that could silently rot — a clockPair that returned the same clock
  // twice would make every gap zero and this guard would pass forever while
  // guarding nothing.
  const start = clockPair();
  const spin = Date.now() + 60;
  while (Date.now() < spin) { /* burn 60ms of real, awake time */ }
  const live = gapSince(start);
  ok('S3: a real 60ms of awake time reports NO sleep — the live sampler, not just the arithmetic',
    live.slept === false, JSON.stringify(live));

  const pair = clockPair();
  ok('S3: clockPair returns two DIFFERENT clocks — a pair that sampled one clock twice would make every gap zero and this guard would pass forever while guarding nothing (wall is epoch-scale, monotonic is process-scale)',
    pair.wall > 1e12 && pair.mono < 1e9 && pair.wall !== pair.mono, JSON.stringify(pair));
}

// --- S4: the runner wires it in ---------------------------------------------
{
  // A detector the runner does not consult is a decoration. Asserted against the
  // runner's source rather than its behaviour, because reproducing a suspension
  // to observe the VOID is exactly what cannot be arranged.
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const path = (await import('node:path')).default;
  const runner = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'run-suite.mjs'), 'utf8');
  ok('S4: run-suite.mjs imports the detector and samples it per file — a detector the runner never consults would pass every check in this file and protect nothing',
    /from '\.\/sleep-detect\.mjs'/.test(runner) && /clockPair\(\)/.test(runner) && /gapSince\(/.test(runner), '');
  ok('S4: a slept file outranks every other status, INCLUDING a pass — an unmeasured file must not be laundered into a clean sweep as OK',
    /r\.slept \? 'SLEPT'/.test(runner), '');
  ok('S4: and the suite reports VOID, never NOT CLEAN — the sleptAt branch is tested BEFORE bad.length, so a suspension can never be reported as red against the code',
    /sleptAt \? `VOID \(the machine slept during/.test(runner), '');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nITEM135 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 135 parks nothing. It adds a status the runner did not have; no existing assertion changes meaning.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM135 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM135 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
