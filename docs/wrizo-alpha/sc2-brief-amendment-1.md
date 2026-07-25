# SC2 brief — Amendment 1 · S5, corrected by measurement · 2026-07-25

**Place at:** `docs/wrizo-alpha/sc2-brief-amendment-1.md` (records lane).
Travels with `sc2-the-clock-brief.md`; the brief stands except where
amended here.

## The premise was wrong, and the correction is on the record

The brief's S5 states that "pagination recomputes on every keystroke in
the current architecture." **That is withdrawn.** Verified against the
branch, line by line:

- `AUTOSAVE_MS = 2000`; `groupIntoScenes` runs inside the debounced
  autosave effect, plus the flush / visibility-change and publish/copy
  paths and `liveScriptText`. **It is not on the keystroke path.**
- The real per-keystroke cost is React reconciling every
  `StaticScriptElement`, which is a plain function component with **no
  `React.memo`**, receiving **a fresh `onActivate` closure per render**
  (`onActivate={(x, y) => activateAt(i, x, y)}`) and **a fresh style
  object per render** (`style={{ ...elementStyle(el.t), cursor: 'text'
  }}`). Memoizing the component alone would not bite; both props change
  identity every render.

**The conditional in Fable's S5 ruling is therefore discharged:** the
flatten/regroup is not the bottleneck, there is no pre-existing
performance defect to name, and SC2 absorbs nothing hidden.

## The measured baseline (now part of the record)

Caret in the first element — worst case, everything downstream of the
edit — 49 real CDP keystrokes per size, all 49 gated as landed in the
doc before any number was believed:

```
pages  elements   mean    p50    p95    max
 1.0      40     0.73ms   0.6    1.5    2.2
 3.5     160     1.04ms   1.0    1.6    2.1
 9.9     464     1.57ms   1.4    2.1    3.0
19.5     928     2.79ms   2.4    5.0    7.3
29.2    1392     4.46ms   4.1    6.2    9.7
```

Linear: **~0.6 ms fixed + ~2.8 µs per element.** At 20 pages, 2.8 ms
mean and 5.0 ms p95 against a 16.7 ms frame — roughly 11.7 ms of p95
headroom for SC2's ledger to spend. Measured on a fast desktop,
headless, DPR 1.

## S5, as amended

**Build the memoized per-page render from the start** rather than
retrofitting it, paired with **an incremental ledger recomputed from the
edited element forward**. Deferring distant-page reflow is held in
reserve — it buys the least and carries the most correctness risk, and
the clock's correctness is not where to be clever. CC's recommendation,
ratified.

**Memoization requires both props stabilised or it does nothing.**
`elementStyle(el.t)` is a pure function of the element type: precompute
one frozen style object per type at module level. `onActivate` must stop
being a per-index arrow closure. Neither change alters behavior, and
both belong in S5.

**The latency ceiling is redefined as a regression bound, not an
absolute.** An absolute millisecond threshold is a false gate on a
harness that runs on varied hardware. The standard: `sc2.mjs` measures
the pre-SC2 baseline and the post-SC2 figure **in the same run on the
same machine**, and SC2's p95 at 20 pages **must not exceed 2× the
baseline p95**. The absolute figures above are recorded as the reference
observation, not as the gate.

**Hardware margin is a real caution, not a formality.** A laptop 2–3×
slower puts today's 20-page p95 at 10–15 ms — at the frame edge before
SC2 adds anything. The harness proves the regression bound; **the
verdict on feel remains Nick's at a device sitting.**

## Two standing practices earned here

1. **Instrument the right event.** Measuring `keydown` on a
   contenteditable produced a flat 0.1 ms curve across a 35× size
   increase — an artifact: the browser inserts the glyph natively and
   the React work rides the subsequent `input` event. A flat curve
   across a large size sweep is a signal to distrust the instrument.
2. **A timing claim carries a correctness gate.** An earlier run
   recorded plausible latencies while the keystrokes were landing on
   `<body>`. Numbers that look right while nothing happened are the
   measurement form of *presence is not composition*. **Any timing or
   performance claim in this house must assert that the measured work
   actually occurred** — keystrokes landed, focus held, the document
   changed — before the number is believed. Recommended for elevation
   to the house laws at Nick's word.

— Fable (SC line), amending SC2's brief on CC's measurement, 2026-07-25
