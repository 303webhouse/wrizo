# Rulings: `apps/desktop/src/components/WritingIncentives.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[WritingIncentives §n]` points here.

## WritingIncentives §1

From `apps/desktop/src/components/WritingIncentives.tsx`, line 16 at `7f1c6a84` (the comment that stays: "shared incentive pieces for ModeStage and JournalEntry; the word goal is a lap: crossing it fills the bar orange with a pulse, then it resets").

```ts
// Shared incentive-layer pieces (glow + progress bar + typewriter toggle) used
// by both ModeStage (Free write/Draft/Format) and JournalEntry (the ink-capable
// Journal route) so the two writing surfaces the app actually has stop
// diverging in feel. Word-count-goal is a "lap": crossing the goal fills the
// bar fully orange with a celebration pulse, then it resets for the next lap —
// per Nick's spec (subtler brown/cream track, an orange caret marking the
// current edge of progress, full-orange + animate + reset on goal).
```

## WritingIncentives §2

From `apps/desktop/src/components/WritingIncentives.tsx`, line 38 at `7f1c6a84` (the comment that stays: "laps are seeded from the first render, so a page opened with words already written never celebrates an earlier session's laps").

```ts
  // Seed from the first-render value/goal (Fable W1-R1) — a page opened with
  // e.g. 600 words already written must NOT celebrate laps completed in some
  // earlier session; only a lap crossed DURING this mount should fire.
```

## WritingIncentives §3

From `apps/desktop/src/components/WritingIncentives.tsx`, line 170 at `7f1c6a84` (the comment that stays: "milestone celebrations: seeded per plan (scopeKey) from the FULL lit set on the first render after boot, so only beats lit this app-load celebrate; seenLit commits when the pulse completes, so an interrupted one is shown again").

```ts
// M1 — the milestone circle-bar's celebration tracking, the useGoalProgress
// mount-seeding law generalized to a keyed collection (per the canon: "Apply
// the W1-R1 lesson as law: seed state on mount; celebrate only transitions
// that occur during the session"). `beats` is a fresh array every call (the
// selector is pure and stateless) — comparing its CONTENTS each render, not
// relying on referential stability, is the point.
//
// Unlike useGoalProgress's per-document lap count, a beat is Plan-side state
// visible from several surfaces at once (every page attached to it, Structure
// Board, QuickSprint) — so "the session" here is scoped to this app-load (a
// module-level seen-set), not to any one component's mount, and PARTITIONED
// by `scopeKey` (the StoryPlan's id). Beat ids are framework-authored strings
// ('midpoint', 'climax', ...) that every project on the same framework shares
// verbatim — an unscoped id space would cross-talk the moment two projects
// pick the same framework (a false celebration for one project's old beat, or
// a swallowed celebration for another's genuine one). Baseline-seeding reads
// `allLitIds` — the FULL, unwindowed lit set for the plan — never the
// (possibly windowed/capped) `beats` being displayed: a beat already lit but
// outside whichever window first renders this plan must still be captured in
// the baseline, or it misfires as newly-lit the first time a wider view
// shows it. Baseline is seeded once per scopeKey, the first time ANY
// consumer renders that plan after boot; a beat that turns lit while no
// celebration-consumer is looking (e.g. QuickSprint's finish-and-navigate
// flow) still celebrates exactly once, on whichever surface shows it to the
// writer next — never a beat that was already lit before this app-load
// began. A hard reload clears the module (fresh boot, fresh baseline).
//
// Fable A1: that "still celebrates" claim holds only when the plan's scope
// was already established (some consumer for this plan rendered) *before*
// the transition. If the writer completes a beat while Progress is Words
// (no milestone-consumer for this plan has rendered at all yet) and switches
// to Project later in the same app-load, that switch's first render IS the
// scope's baseline-establishing render — it seeds the already-lit beat as
// quiet, no pulse. Inherent to storage-free, app-load-only memory (there is
// nowhere to durably record "already celebrated" without adding persistence,
// which would trade this for the worse failure — a false pulse on a
// different device or a later session); this cold-path errs in the correct
// direction, a missed pulse rather than a false one, and is not a bug.
//
// `seenLit` is committed lazily, when a celebration's timer actually completes
// — never at the moment the transition is first detected. App.tsx force-
// renders the whole routed tree on every persistence change (its sync/reactive-
// screens subscription), so a surface that's mid-navigation-away (e.g.
// QuickSprint's finish-and-save, which calls setBeatStatus then navigate() in
// the same handler) can get one invisible interim render reflecting the new
// status before it unmounts. If that render committed `seenLit` immediately,
// the celebration would be silently consumed without ever being painted. By
// deferring the commit to the timer's completion, an interrupted (unmounted)
// celebration leaves the id unseen, so the next surface that renders the beat
// gets a full, uninterrupted chance to show it.
```

## WritingIncentives §4

From `apps/desktop/src/components/WritingIncentives.tsx`, line 259 at `7f1c6a84` (the comment that stays: "the circle-bar projects beat coverage, glanceable only; pointer-events:none is an invariant (no exit door on a writing surface); rightSlot keeps the timer beside it").

```ts
// The circle-bar: a read-only projection of Plan beat coverage onto the
// writing surface — glanceable only, never a verdict (docs/progress-
// milestones-canon.md). pointer-events:none is an INVARIANT, not a style
// choice: no tap-to-navigate on a writing surface (an exit door embedded in
// the incentive layer is a departure temptation exactly where flow lives —
// the interaction designer's and motivation psychologist's veto, on the
// record). Empty = a quiet ring; kindled = ring + a small brass center dot
// (the W1 progress-caret vocabulary, deliberately reused); lit = solid brass
// fill, with the shared pfill-celebrate-derived ring-pulse on the transition
// into it. `windowed` shows an edge-fade (both sides — a centered window can
// truncate on either end) hinting more beats exist beyond the cap. Takes the
// whole Milestones object (not just `beats`) so it can hand the celebration
// hook the plan-scoped id and the full unwindowed lit set — see the comment
// above useMilestoneCelebration. `rightSlot` mirrors ProgressBar's — Fable
// R1: Timer:On is independent of the Progress metric and must survive
// Progress:Project the same way it survives Progress:Off, so the page
// number + session clock ride alongside the circles rather than vanishing
// when the milestone bar replaces the word/time track.
```
