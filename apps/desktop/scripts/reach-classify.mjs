// ITEM 194 — THE REPORT-ONLY REACH CLASSIFIER (pure; no browser, no DOM).
//
// The page-side probe (runtime-verify.mjs's `__reachSample`) only SAMPLES: it asks
// `document.elementFromPoint` at a 5x5 grid of fractions across the part of the
// control that is inside the viewport (the same fractions trusted-point.mjs's
// `hittablePointBy` scans) and hands the raw counts back. THE VERDICT IS DECIDED HERE,
// in Node, from those counts — so the judgement is unit-testable without a browser
// (reach-classify-proof.mjs, with its own mutants) and the only thing a box turn has
// to prove is the sampling.
//
// REPORT-ONLY, and it says so: nothing here can change what a check reports. The
// press that follows the probe is still today's `el.click()`. The point is to measure
// which of the suite's presses a PERSON COULD NOT HAVE MADE — Fable's ruling (2026-09-23):
// each one is either a fixture skipping a person's step (a hover, a scroll) — fix the
// fixture to take it — or a real finding. "No exemption table" was the prediction; this
// is the measurement.
//
// VERDICTS, in the order they are decided:
//   disabled      — the control is disabled / aria-disabled: a real press does nothing
//                   (a synthetic el.click() on a disabled button also does nothing, but
//                   on an aria-disabled one it FIRES — the two disagree, which is a finding).
//   not-rendered  — display:none, visibility:hidden or a zero-size box.
//   offscreen     — no part of it is inside the viewport: a person would have to SCROLL
//                   first. The likeliest "fixture skips a person's step" bucket.
//   covered       — part is on screen and NOT ONE sampled point hit-tests to it or its
//                   descendants: something else paints over it. Item 130's defect.
//   partial       — some points reach it, some do not. `centerHit` says whether the
//                   dead centre does (a person aims at the centre).
//   reachable     — every sampled point hit-tests to it.
export const VERDICTS = ['reachable', 'partial', 'covered', 'offscreen', 'not-rendered', 'disabled'];

export function classifyReach(s) {
  const flags = {
    centerHit: s.centerHit ?? null,
    // pointer-events:none makes a control invisible to a real pointer even though it is painted.
    pointerEventsNone: s.pe === 'none',
    // Part of the control lies outside the viewport (a person would scroll to reach the rest).
    clipped: !!s.rect && (s.rect.l < 0 || s.rect.t < 0 || s.rect.l + s.rect.w > s.vw || s.rect.t + s.rect.h > s.vh),
  };
  let verdict;
  if (s.disabled) verdict = 'disabled';
  else if (s.display === 'none' || s.visibility === 'hidden' || !s.rect || s.rect.w <= 0 || s.rect.h <= 0) verdict = 'not-rendered';
  else if (!s.total) verdict = 'offscreen';
  else if (s.hits === 0) verdict = 'covered';
  else if (s.hits === s.total) verdict = 'reachable';
  else verdict = 'partial';
  const by = Object.entries(s.by ?? {}).sort((a, b) => b[1] - a[1]);
  return { verdict, ...flags, hits: s.hits ?? 0, total: s.total ?? 0, by: by.length ? by[0][0] : null };
}

/** A press a person could not have made as-is: everything but `reachable`, and a partial whose centre hits. */
export function couldNotHaveBeenPressed(c) {
  if (c.verdict === 'reachable') return false;
  if (c.verdict === 'partial') return c.centerHit === false;
  return true;
}
