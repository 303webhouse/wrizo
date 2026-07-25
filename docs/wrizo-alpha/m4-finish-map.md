# M4 — the Root That Shows · finish map (dossier)

**Purpose:** M4 (item 70; brief = the P1 wave `p1-wave.md` §M4, SV13–SV16). S1+S2
are BUILT + verified on branch `m4-root-that-shows` (tip `2f60eba`, off `main`,
ZERO SCHEMA/SERVER). S3+S4 are root-caused, not yet built. This is the expensive
artifact — the exact files, the render-gating finding, the anchor target, and
what `m4.mjs` must assert across all four slices. Line numbers as of `main`
~`25b9690`; grep-confirm before editing. Standing P1 invariants apply: guard-rail;
both `HARNESS_PARKED`; the **1366×768 leg** (geometry touched); `tsc` ×2;
`build:web`; **full suite read to completion in the main loop before merge**;
report = push; merge through chat 1's lane; deploy held (P1 + SC, one named
manifest).

## S1 — sequenced origins (SV13) · DONE

`rhizomeEngine.ts`: `originsAwake(target) = min(ORIGIN_COUNT, floor(ORIGIN_COUNT *
target / CAP_SEGMENTS) + 1)` (exported + on the `window.__wrizoRhizomeEngine`
seam). `growSegment(...)` takes it as `maxOrigins`; `rootingPhase =
shoots.length < min(origins.length, maxOrigins)`. `growTo` passes
`originsAwake(cap)` where `cap = min(round(target), CAP_SEGMENTS)`. Because
`target = saturationTarget(total words)`, origin k (0-indexed i) wakes when the
target crosses i/7 of CAP — NO new constant. Determinism, paper-avoidance,
forward-only, and the high-water refit are unchanged (only the rooting GATE
moved; a refit rebuilds at the current high-water target, so it never un-wakes an
earned origin).

**m4.mjs S1 asserts (pure engine, via the seam):**
- `originsAwake(saturationTarget(w))` steps 1→7 across w — seam-verified boundary
  samples: `128→1, 129→2, 280→2, 281→3, 466→3, 706→5, 707→5, 1045→6, 3000→7`
  (thresholds ~0/129/281/467/707/1045/1623; ±1–2 words from `saturationTarget`'s
  `Math.round`, which the brief's "approximately" allows).
- `growTo(empty, …, saturationTarget(50))` roots exactly ONE origin's system
  (origin one alone; count DISTINCT origin roots, not `shoots.length` — shoots
  include the branches that grow FROM origin one, which is correct/intended).
- Determinism: same seed + geo + words ⇒ byte-identical field (reuse m3.mjs's
  determinism check shape).

## S2 — the green (SV14) · DONE

`index.css` ~L176: `--rhizome-ink: #4C5942;` (deep low-yellow green, G-dominant so
it reads as a root not the house olive; ~2.3:1 against the `#1F1A16` ground —
`#3F4A37` fell to ~1.85:1, below the band Nick described). Bounded delta.

**m4.mjs S2 asserts:** the live `--rhizome-ink` token resolves to `#4c5942`
(reuse m3.mjs's S1 token check: create a div, set color to the token, read the
computed `rgb()` and compare — or compare the raw token string).

## S3 — the bar comes home (SV15) · TO BUILD

**Render-gating finding:** on the FRAMED desk the progress bar
(`.mode-incentive-row`, `ModeStage.tsx` ~L460) is gated **`!framed`** — AB1 S2
deliberately "reserved the meter track for its later return." **S3 IS that
return.** The rhizome renders in the under-page lane
`.desk-frame-rhizome-anchor` (`DeskFrame.tsx:243`:
`{rhizome && <div className="desk-frame-rhizome-anchor">{rhizome}</div>}`), fed by
the `rhizome` prop (from `PageEditor.tsx:711`,
`rhizome={gateActive ? undefined : <RhizomeField … />}`; `RhizomeField` no-ops
when `progressStyle !== 'rhizome'`).

**Build:** render the progress INSTRUMENT in that one anchor lane on framed —
`RhizomeField` when `progressStyle === 'rhizome'`, else a `ProgressBar` (bar +
rhizome, two styles of one instrument, one location). The `ProgressBar` needs
`frac`/`celebrating`/`label`; `useGoalProgress(value, goal)` supplies them
(`ModeStage.tsx` L276 already computes `{ frac: lapFrac, celebrating }`;
`WORD_GOAL` from `WritingIncentives`). Cleanest wiring: thread the instrument
choice into the `rhizome` slot (either PageEditor computes it, or ModeStage
builds the ProgressBar and passes the chosen node to DeskFrame's `rhizome` prop —
trace `rhizome` PageEditor→ModeStage→DeskFrame first; ModeStage.tsx had no
`<DeskFrame`/`rhizome=` match, so the prop is threaded, not built there). The
tool-menu progress-style toggle (`ModeStage.tsx` L597–600, gear/SettingsPanel)
STAYS a toggle — do not turn it into a home. Placement options are the July-17
follow-on, NOT this ticket.

**m4.mjs S3 asserts (LIVE, at the 1366×768 leg + a wider leg):** with
`progressStyle='bar'` on a framed page, a `.mode-pfill`/progress bar renders
INSIDE `.desk-frame-rhizome-anchor` (same lane the rhizome occupies when
`progressStyle='rhizome'`); NO separate `.mode-incentive-row` bar mounts on the
framed desk; the gear's progress-style toggle still flips bar↔rhizome.

## S4 — the completion moment (SV16) · TO BUILD

**Root-cause (named):** the flare is DEAD on the framed desk. The `ProgressBar`
celebrate (ignition sweep + spark burst, `mode-pfill.celebrate`,
`WritingIncentives.tsx` ~L118+) and the `AmbientGlow` bloom (`ModeStage.tsx`
L333) both render only **`!framed`**, even though `celebrating` IS computed on
framed (`ModeStage.tsx` L276, `onCelebrate` fires L281). Only the rhizome's quiet
`data-flash` (M3, ember) fires today. So the "completion moment" is effectively
absent on the primary (framed) surface.

**Build:** S3 already brings the bar (and thus its celebrate flare) home to the
framed lane. Then make that flare UNMISTAKABLE and ORANGE at the earned goal
(the rhizome's own flash is `--ember`/orange, M3; align the bar's celebrate to an
orange flare rather than brass/lime on the framed lane). Canon-blessed as *humans
acting* — nothing counted, scored, or remembered; the moment happens and is gone
(evental, like the existing `celebrate` class that reverts after `CELEBRATE_MS =
1100`).

**m4.mjs S4 asserts (LIVE, framed):** crossing the word goal fires an
unmistakable orange completion flare on the framed desk (the celebrate class /
flare element appears with an orange/ember computed color); it REVERTS after its
window (evental, not a new at-rest state); nothing numeric is rendered.

## Slices summary for `m4.mjs`

Both `HARNESS_PARKED` settings; the 1366×768 leg for the live S3/S4 geometry.
S1 (pure engine seam) + S2 (token) + S3 (framed bar-in-anchor) + S4 (framed
orange flare on goal). Park nothing unless a pre-existing assertion is falsified
(then A4, verbatim). DoD: one root grows where he can see it, new roots arrive as
earned, the ground reads alive without reading touchable, and crossing the goal
is felt.

— chat 3, 2026-07-25. S1+S2 shipped on `m4-root-that-shows@2f60eba`; S3+S4 are
this map's to finish.
