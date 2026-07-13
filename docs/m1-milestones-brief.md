# M1 — milestone circles + notecard dots (build brief)

**Branch:** `m1-milestones` · off `main` at build time
**Authorized by:** `docs/progress-milestones-canon.md` (build on Nick's
ratification). **Sequenced:** after W2's review/merge cycle; designed with
B4 via tokens — `pfill-celebrate` is the interim calibration reference until
B4 ratifies the ember grammar. (Fable's amendment under Nick's
progress-over-perfection directive, `docs/w1-close-handoff.md` — supersedes
the canon's original "after the consolidated hardware session" sequencing.)

## Why

The ruled second progress mode: a read-only projection of the Plan's beat
coverage onto the writing surface (circles) and the Structure Board
(status-dots) — the completion *feeling* without ever soliciting a
completion *verdict*. Substrate already live: J5's `attachToPlanBeat`
writes `beatId`; `setBeatStatus` exists Plan-side.

## Scope (slices)

- **S0 — verify the substrate (gate).** Enumerate the actual
  `setBeatStatus` vocabulary and current `beatId` attachment shapes in
  `persistence.ts`/`types/index.ts` and prod-shaped fixtures. **If no
  terminal status value exists, STOP and return to the committee** — do not
  invent one mid-build. Confirm which container units the StoryPlan
  actually authors (beats/scenes/acts) — granularity follows the plan as
  authored.
- **S1 — the projection model.** A pure selector:
  `projectMilestones(pageId) → { beats: Array<{ id, label, state:
  'empty'|'kindled'|'lit' }>, windowed: boolean }` — beats of the active
  page's container, capped ~12 with edge-fade overflow. `kindled` = ≥1 page
  attached via `beatId`; `lit` = terminal Plan status. No writes anywhere
  in this module. Unit-style harness coverage on the selector alone.
- **S2 — the circle-bar.** New member of `WritingIncentives.tsx`:
  `MilestoneBar` — `--line` ring / ring + `--brass` center dot / solid
  `--brass` fill; ring-pulse celebration derived from `pfill-celebrate`
  (token-driven per the B4 note); `pointer-events: none` (glanceable-only —
  the canon's veto on writing-surface tap-navigation is an invariant, not a
  style choice). **Apply the W1-R1 lesson as law: seed state on mount;
  celebrate only transitions that occur during the session.**
- **S3 — the toggle.** `writingSettings.progress` gains `'project'`; the
  gear offers it only when the page belongs to a project with a StoryPlan;
  every other page silently renders words. Journal never sees it. No greyed
  states anywhere.
- **S4 — notecard dots.** StructureBoard notecards render the existing
  `.status-dot` (with its required text label) in the same three states,
  same celebration-on-transition. No bars on notecards.
- **S5 — harness (`scripts/harness/m1.mjs`).** Fixture a planned project:
  assert circle states from seeded attachments; advance a beat to terminal
  status Plan-side and assert exactly one celebration on the open writing
  surface; **reload with a lit beat and assert no celebration on mount**;
  assert the toggle absent on a Journal page and on a plan-less project;
  assert notecard dot states + labels; assert `pointer-events` inert on
  writing-surface circles.

## Non-goals

Any "mark done" gesture on a writing surface. Per-scene or per-chapter word
targets, ever (vetoed on the record). Tap-to-navigate from writing-surface
circles (Plan/Board interactions are their own later question). Script-beat
wiring (`Scene.beatId` stays reserved — S-arc's convergence point, not
M1's). New celebration vocabulary. Per-document toggle overrides. Any
schema change — **zero new fields is an S0-verified invariant, not an
assumption.**

## Invariants

No new deps. Read-only projection — M1 introduces no write path to beats or
plans from any writing surface. Reuse `useGoalProgress`'s mount-seeding
pattern, `WritingIncentives` as the home, `.status-dot` as shipped, house
tokens only (the brass family; square corners; solid borders). Must not
regress the words/time bar (w1.mjs re-runs green). Vocabulary discipline:
user-facing copy says what the Plan says (beats/scenes as authored), never
invents "chapters."

## Definition of done

Toggle live per S3; a beat reaching lit during a session celebrates exactly
once on the open surface and never on mount; notecard dots live with
labels; `tsc` + `build:web` + selftest + `w1.mjs` + `m1.mjs` green;
harness committed. Report = push; merge on Fable's review + Nick's word;
circle legibility at S25 + the celebration's felt weight join the hardware
gates. Nick's device verdict closes the ticket.

— Fable
