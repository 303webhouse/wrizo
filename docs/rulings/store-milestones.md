# Rulings: `apps/desktop/src/store/milestones.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[milestones §n]` points here.

## milestones §1

From `apps/desktop/src/store/milestones.ts`, line 5 at `e2898deb` (the comment that stays: "the milestone projection: a read-only projection of the Plan's beat coverage, never a verdict; a pure selector, no writes").

```ts
// M1 — the milestone projection. A read-only projection of the Plan's beat
// coverage onto a writing surface (the circle-bar) — never a verdict, per
// docs/progress-milestones-canon.md. Pure selector: no writes anywhere in
// this module, confirmed by S0's substrate read (persistence.ts, 2026-07-13):
// `BeatNote.status` has a genuine terminal value ('complete'), `setBeatStatus`
// is Plan-side (StructureBoard's "Mark done" + QuickSprint's pre-existing
// finish-checkbox — both predate this canon and are untouched by it), and
// `JournalEntry.beatId` (J5's `attachToPlanBeat`) is the only "work attached"
// signal this module reads.
```

## milestones §2

From `apps/desktop/src/store/milestones.ts`, line 43 at `e2898deb` (the comment that stays: "beats in framework-authored order: never invent chapters the plan does not have").

```ts
// Beats in framework-authored order — granularity follows the plan as
// authored (the pedagogue's ruling); never invent "chapters" the plan
// doesn't have.
```
