# SC1 — the Room's True Geometry · Fable's review · 2026-07-25

**Place at:** `docs/wrizo-alpha/sc1-review-fable.md` (records lane).
**Subject:** `e86d016` on `sc1-true-geometry`, parented at `66b2674`.
**Verdict: GREEN.** Clear to merge through chat 1's serialized lane on
the zero-schema pre-authorization. Deploy remains Nick's separate word
on **SC's own manifest** — never folded into the P0 wave.

## Census (read from the commit, not the report)

Ten files, +1336 / −113. Harness: `sc1.mjs` (new, 562 lines) and the
five park-bearing files `ab2`, `fx1`, `fx3`, `fx4`, `fx7`. Source:
`index.css` (+179/−24), `ScriptEditor.tsx` (+45/−36), `Sliver.tsx`
(+19/−3), `ModeStage.tsx` (+9/−2).

**Zero server files. Zero schema. No `package.json` in the diff** —
which independently corroborates the report's claim that Courier Prime
was already a dependency rather than an asset added by this ticket. The
brief's one disclosed new asset turned out to be no asset at all.

**The prose blast radius is two files and 28 added lines**, both behind
`typewriterAvailable` (default `true`, passed `false` on exactly one
condition: `content.kind === 'draft' && content.structure ===
'screenplay'`). That is the smallest possible footprint for the
amendment, and `fx4`'s parked probe was deliberately turned into the
standing guard that prose kept its quarter — a park doing double duty
as a leak detector, which is the right instinct.

## The derivation, checked independently

The geometry is not asserted in the report; it is checked here against
the CSS on the branch and against the arithmetic:

```
font-size: min(1rem, calc(100cqw / 51));
line-height: 1;  width: 51em;  min-height: 66em;
padding: 6em 6em 6em 9em;   (.script-page: container-type: inline-size)
```

At 12pt: 1pt = 4/3px → 12pt = 16px = 1em; 1in = 96px = **6em**. So
8.5in = **51em** ✓, 11in = **66em** ✓, margins 1.5/1/1/1in =
**9/6/6/6em** ✓, measure = 51 − 9 − 6 = **36em** ✓. Courier's 0.6em
advance → 36 / 0.6 = **60ch** ✓, and 96px/in ÷ 9.6px/ch = **10 cpi** ✓.
Six lines per inch requires a line box of 1/6in = 1em → **`line-height:
1`** ✓. The scaling arm `100cqw / 51` is precisely the font-size at
which 51em equals the room ✓.

Every number in the trade standard is a consequence of one font-size,
so no inch can drift from another by construction. This is a better
solution than the brief asked for: I specified a table of offsets; CC
built a derivation, and derivations cannot fall out of sync.

**Property worth knowing, not a defect:** true size is anchored to
`1rem`, so a reader whose browser font size is above 16px gets a
proportionally larger page — proportions exact, absolute scale
following the user's own accessibility preference. That is correct
behavior, and it is also the knob if the page ever reads wrong at a
sitting.

## Park cycles — spot-read, not taken on trust

`fx3` and `ab2` were read on the branch. The discipline holds:

- **The retirement is marked as a retirement**, in words, and
  distinguished from a park at the site (`fx3` — "a retirement rather
  than a [park]"), with the original quoted verbatim inside its `pok`
  record.
- **Generations nest rather than overwrite.** `fx3`'s start-offset park
  reaches generation 2 with the prior generation's full text quoted
  inside the new record; `ab2`'s DoD park does the same. This is the
  `cd1.mjs` four-generation chain applied correctly.
- **Laws survive their probes.** FX3 S5's aria claim is re-asserted on
  prose rather than dying with the script toggle; the accessibility
  point is made explicitly — absent to a screen reader exactly as to the
  eye, never merely hidden from one.
- **AB2 S2's DoD amendment is recorded in all four promised places**,
  framed as built, working, and withdrawn by the writer's judgement
  rather than found wrong. A DoD does not quietly evaporate.

## Verification accepted

41/41 files, both `HARNESS_PARKED` settings, serially, every verdict
read: 1824 VERIFY unset; 139 PARKED + 1926 VERIFY = 2065 at `=1`; zero
failures, zero isolation re-runs, checked against raw JSON rather than
verdict lines. `sc1.mjs` 66/66 both settings. `tsc` ×2 EXIT 0;
`build:web` clean. The two apparent anomalies (FX7's "partial" label,
FX12's five checks) are correctly identified as pre-existing and
additive.

**fx5 is resolved, not deferred.** It did not fail in-suite; DF1 has
already root-caused the historic flake (a `sleep(30)` + CDP sampler
whose interval stretches under contention across an in-flight smooth
scroll) and is BUILT at `24c6173`, so the requested baseline has no
live recipient. The structural exoneration offered instead is the
stronger artifact: SC1 cannot reach `fx5`'s subject —
`useTypewriterFade.ts` untouched, the shared-looking CSS removal
(`.desk-frame-scroll-cap[data-typewriter='true']`) rendered by
`ScriptEditor.tsx` alone, and the prose selector split byte-identical.
**fx9's `rc=127` is confirmed an invocation artifact** — the file exits
through a single `process.exit(pass ? 0 : 1)` and has no path that can
emit 127.

**Also worth recording:** six orphaned `--headless` browsers were swept
before and between passes, four of them leaked by the dead SC session —
the same leak DF1's build note names as what had been failing runs.
Session death has a resource cost, and sweeping before a suite run is
now a lesson with two independent witnesses.

## The merge-order hazard (carried to chat 1)

**FX14's harness sweep and SC1's park cycles collide on four files** —
`fx1`, `fx4`, `fx7`, `ab2`. Read-only `merge-tree` trials come back
conflict-free (SC1 × FX14, SC1 × `main`, SC1 × `df1-deflake`), but a
clean auto-merge is not a safe merge when both tickets rewrite
park-bearing files: git will happily interleave two sets of frozen
records without either failing.

**Binding on whoever merges second:** re-run the full suite on the
combined tree, and verify SC1's frozen park records survived
**byte-identical**. That is the immutability law asserting itself at
merge time rather than at review time, and it is not optional.

Two further carry-backs: `fx5.mjs` has three claimants (FX14's sweep,
DF1's rewrite, the historic file) and needs chat 1's sequencing; and the
primary checkout has merged and reset `fx14-one-page` three times
(`f7bc737`, `857c51d`, `170782e`, each reset back to `origin/main`) —
benign if that is a verification loop, worth a look if it is a stuck
merge.

## Notes forward to SC2

- `min-height: 66em` means the sheet grows past 11in as content
  overflows. Correct and disclosed as the interim; **SC2's derived
  pagination is what turns a tall sheet back into counted pages**, and
  with it the 1-page-is-1-minute claim becomes true rather than
  proportional.
- The permanent scrollbar is now a fact of this surface
  (`scrollbar-gutter: stable both-edges`). SC2's page-break geometry
  must measure against the content box, not the padding box, or it will
  inherit the same 10px error SC1 just removed.

## The brief's own corrections, on the record

Two of my hypotheses were wrong and were corrected with measurement:
`scriptMetrics.ts` was already exact where the brief called it
"approximations" (the offsets only looked wrong applied to a 184px
column), and the floating caret was a static 183px
`--tw-start-offset` padding rather than the typewriter hook, which
`band()`'s C2 guard had been refusing correctly all along. The
reproduce-before-patch discipline is what caught both, and the brief
was the thing it corrected.

— Fable (SC line), review of record, 2026-07-25
