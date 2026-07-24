# M3 — the Rhizome Roams · Fable's post-merge review · 2026-07-24

**Ticket:** M3 (item 58). Built by chat 3 on `m3-rhizome-roams` @
`ccf643b`; merged `7ebe703` by chat 1 in the serialized lane; records
`8f6dae1`; deploy held for the one batched word.
**Method:** house depth — the entire merge read line-by-line: all five
files (681+/26−), including every line of the new 357-line `m3.mjs` and
the new engine half of `rhizomeEngine.ts`. All four park-quoted
originals in `m2.mjs` compared against their deleted lines in the same
diff — byte-identical. Zero schema, zero server files, zero new deps.

## Verdict: GREEN. The three device verdicts are real, the paper-avoidance law holds at full scale with the proof at zero, and the forward-only law survived a harder test than the brief anticipated. Close pends Nick's sitting; the deploy word is now fully unblocked.

## THE THREE VERDICTS, VERIFIED

**Too dark → S1.** `--rhizome-ink` is `#7A6242` at the one seam M2 cut
for exactly this purpose, with the contrast arithmetic and the
bounded-delta status in the comment. Nothing orange at rest is proven
the strong way: a live segment's computed stroke is compared against the
token's own resolved color with the flash flag off.

**Too confined → S2.** Seven origins, blue-noise by best-candidate
sampling with the paper as a repeller in the score itself; origin one
stays the paper's bottom-center (continuity with every ground grown so
far); and the guarantee an origin never roots in the writer's words is
**double-walled** — an in-paper candidate scores zero and loses, and
`outsidePaper` projects any survivor out past the nearest edge, the
exact defense the tight-ground live case demanded. The 40-seed stress
sweep runs at full saturation on a deliberately hostile tight ground and
the numbers are the only acceptable ones: zero origins in the paper,
zero violations, across all forty grounds — plus the single-fixture
grow, plus the live saturated ground, all zero. Full-ground extent
proven both pure (near all four margins) and live.

**Filled by essay length → S3.** `saturationTarget` is the ruled curve
with `SAT_K === 834` exact; the harness proves coverage(0)=0, ≥95% of
CAP at 2,500, ≤CAP for any input including 10⁶, monotone across a fine
sweep, and a bounded tail past the essay. `growTo` is unit-agnostic by
construction — one segment at a time to target, so any path to the same
total reaches the byte-identical shape.

## THE REFIT — the judgment call, ratified in full

The flagged addition is the mandate holding, and the implementation is
better than the flag suggested. `syncField` is the single sync path:
same paper + more words grows forward; a material geometry change (>1px,
so sub-pixel jitter can never thrash) resets the PRNG to the entry's
seed and regrows from empty against the new paper — making the ground
the deterministic image of (seed, geometry, total words), which is
precisely what lets the live revisit check assert **byte-identical**
regrowth. And the forward-only law survives the refit by the high-water
mechanism: a rebuild regrows to the largest count ever seen, so neither
a moved paper nor deleted words can ever shrink the ground. The
ResizeObserver + rAF coalescing + 600ms settle-tail closes the
boot-settle race at its root. StrictMode safety is reasoned in-comment
and holds by construction.

## THE PARK SWEEP — lighter than briefed, and correct

Only the component-observing checks were falsified — the M2 engine
primitives are untouched and still exercised — so only four parks were
owed, and reality outranks the brief's prediction. The burst-boundary
forensics deserve naming: the M2 fixture's 245+6 seeding crosses the
goal BEFORE its own "seven" keystroke under the total-word driver, so
the superseded checks correctly invert to prove the burst's
one-time-ness, while `m3.mjs` re-proves the positive crossing with a
correctly bracketed 244+7 fixture. All four originals quoted verbatim;
successors both in place and positive in `m3.mjs`; `m2.mjs`'s
"growth kept whole" check survives untouched because it was never
false.

## ADVISORIES — non-blocking

1. **The four m2 parks use the comment-record form** (the th1 precedent,
   lawful) — but `m2.mjs` has a parked block, where the pok-record form
   is the house preference. Migrate the four at next touch.
2. **`growTo`'s 200-consecutive-skip bailout** trades completeness for
   liveness on a pathological geometry — stop, never spin. Correct
   priority; named here so a future "ground came up short" report finds
   its mechanism already on the record.
3. **Item 60's remaining scope, now precise:** the boot-settle
   manifestation is closed at the root by the refit. What remains is the
   absolute-offset question — live determinism is proven under
   normalization to the first segment's start; whether the normalization
   can be dropped (absolute determinism) or the frame-offset variance is
   inherent-and-benign is a small post-vacation investigation, and item
   60 closes when it's answered either way.

## Close condition

Nick's sitting — the warm ground under his own eye, the ink value and
the origin count and the K constant all his to nudge as bounded deltas.
Then item 58 closes. **With this review on disk, every ticket in the
batch is merged and reviewed: the deploy word is unblocked.**

— Fable
