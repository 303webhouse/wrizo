// ITEM 135 — THE SUSPENSION VOID.
//
// WHAT IT IS FOR. A suite that runs for an hour can have the machine sleep
// underneath it. Every timing assertion, every `waitFor` budget and every
// browser connection measured across that gap is measured against a clock that
// jumped, and the files that fail as a result fail for a reason that has nothing
// to do with the code. The run that stamped Batch One lost a pair to exactly
// this, and the failures looked like ordinary reds — which is the whole problem:
// a suspension is indistinguishable from a slow machine unless you look for it.
//
// THE DISCRIMINATOR. Two clocks disagree across a suspension and agree
// otherwise:
//   · WALL CLOCK (`Date.now`) keeps counting while the machine is asleep.
//   · MONOTONIC (`performance.now`) does not — it measures elapsed RUNNING time.
// So wall-minus-monotonic is the time the process did not exist. Under normal
// operation the two track within a few milliseconds over minutes; a suspension
// shows up as seconds or longer.
//
// A SLEPT FILE IS VOID, NOT RED. That distinction is the point of the ticket: a
// red says "the code is wrong", and saying that about a file the machine slept
// through is a false accusation that costs someone a debugging session. VOID says
// "this measurement did not happen" — the same thing the runner already says when
// a foreign browser appears mid-run.
//
// ► THE ONE THING THIS CANNOT PROVE ABOUT ITSELF, stated rather than implied:
// the falsifications below drive the DECISION with supplied clock readings, and
// they are exhaustive. What no test here can establish is the platform premise —
// that `performance.now()` really does stop advancing while Windows suspends.
// Verifying that needs a machine actually put to sleep mid-run, which is not
// something a suite can arrange. If that premise is ever false on some platform,
// this detector degrades to silence (it under-reports), never to a false VOID:
// the two clocks agreeing is exactly the healthy reading.

// Measured against the observed noise floor, not picked: over a 30-minute leg the
// two clocks in this runner drift by single-digit milliseconds. Five seconds is
// three orders of magnitude above that and far below any real suspension, so it
// cannot fire on jitter and cannot miss a sleep.
export const SLEEP_TOLERANCE_MS = 5000;

/**
 * Did the machine stop running between two paired clock samples?
 * @param {number} wallMs      Date.now() delta across the span
 * @param {number} monoMs      performance.now() delta across the same span
 * @param {number} toleranceMs
 * @returns {{slept: boolean, lostMs: number}}
 */
export function suspensionGap(wallMs, monoMs, toleranceMs = SLEEP_TOLERANCE_MS) {
  // Negative drift means the monotonic clock ran AHEAD of the wall clock, which
  // happens when someone moves the system clock backwards. That is not a
  // suspension and must not be reported as one; it is also not this ticket's
  // problem, so it reads as no gap rather than as a gap of negative size.
  const lostMs = Math.max(0, Math.round(wallMs - monoMs));
  return { slept: lostMs > toleranceMs, lostMs };
}

/** A clock pair, sampled together so the two readings describe one instant. */
export function clockPair() {
  return { wall: Date.now(), mono: performance.now() };
}

/** The gap between a `clockPair()` and now. */
export function gapSince(start, toleranceMs = SLEEP_TOLERANCE_MS) {
  const end = clockPair();
  return suspensionGap(end.wall - start.wall, end.mono - start.mono, toleranceMs);
}
