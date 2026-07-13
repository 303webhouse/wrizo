# Progress milestones — the committee ruling · 2026-07-12

**Status: RULED — 2026-07-12, on Nick's delegated word via Fable** ("I'll
defer to you on the other options for now, but I want to prioritize
progress over perfection... as long as the architecture isn't fundamentally
broken." — see `docs/w1-close-handoff.md`).
**Answers:** `docs/progress-milestones-committee-brief.md`. Convened per
`AGENTS.md`: the Experts + the Architects, double-pass; Marketing ran real
opposition here (reward mechanics are brand-load-bearing).
**Place at:** `docs/progress-milestones-canon.md`.

## The ruling, in one paragraph

"Complete" is a verdict; the app displays **facts** and never solicits
verdicts on a writing surface. So the circle-bar is ruled as a **read-only
projection of the Plan onto the writing surface**: circles render each
beat's *coverage* — empty (nothing attached), kindled (work attached via
`beatId`), lit (the beat's own Plan-side status has reached its terminal
value) — and light with the house celebration when a state advances *during
the session*. No "mark done" gesture exists on any writing surface; whatever
status-setting the Plan already has (`setBeatStatus`) remains the Plan's,
where convergence judgments belong. Two Minds holds: Middle Door surfaces
may **glance at** Trellis facts; they never ask Trellis questions. Notecards
get the existing `.status-dot` vocabulary, not a bar — a bar needs a
denominator, denominators are quotas, and quotas are vetoed (below). Build:
**M1** (`docs/m1-milestones-brief.md`).

## Question 1 — what counts as "complete"? → Beat coverage + Plan status, never a verdict

**Pass 1.** The motivation psychologist led, per the brief: a manual
"mark chapter done" is checkbox UX importing the un-mark spiral ("is it
*really* done?") — perfectionism bait the canon exists to block. Word-count-
per-chapter makes length a proxy for doneness — padding pressure or
short-chapter shame, both poison. **Coverage is different in kind**: "pages
exist against this beat" is a fact, not a judgment. Phenomenologically it
*is* the completion moment — *I wrote the scene* — without ever asking
whether it's finished. The systems engineer confirmed the substrate is
already live: J5's `attachToPlanBeat` writes `beatId` in prod paths today,
and `setBeatStatus` exists Plan-side. The pedagogue: granularity follows the
StoryPlan's own units as authored — never invent "chapters" the plan doesn't
have.

**Pass 2.** The trim that survived opposition: the *lit* state keys off the
beat's existing Plan-side status vocabulary, not a new field — **M1's
Slice 0 verifies the actual status values and STOPS, returning here, if no
terminal value exists** rather than inventing one mid-build. Manual marking
on writing surfaces: rejected outright. Word targets: rejected outright
(and again at Q4).

## Question 2 — the circle-bar visual spec

**Scope to the writer's horizon:** render the beats of the *container the
active page belongs to* (the chapter/act around you), max ~12 circles, edge-
fade indicating more beyond; flat plans render all up to the cap. A 40-unit
manuscript as 40 dots is noise — your chapter is your horizon. **States in
house tokens:** empty = `--line`-color ring; kindled = ring plus a small
`--brass` center dot (the W1 caret vocabulary, deliberately reused); lit =
solid `--brass` fill. **Celebration:** one grammar app-wide — a ring-pulse
keyframe derived from the shipped `pfill-celebrate` (same duration family,
same shadow weight). `pfill-celebrate` is the interim calibration reference;
**B4 (ember accent finish) is the final authority** — when B4 ratifies the
ember grammar, both the lap bar and the circles consume it. This binds the
ledger's own note that B4 and the reward surface design together.
**Interaction: glanceable-only on writing surfaces** — no tap targets
(`pointer-events: none`). The plotter wanted tap-to-navigate; the interaction
designer and motivation psychologist vetoed it *on the writing surface* — an
exit door embedded in the incentive layer is a departure temptation exactly
where flow lives. Tap-to-navigate belongs on the Plan/Board, where navigation
is native (and W2's return chip guarantees the way back — the two rulings
interlock).

## Question 3 — where the toggle lives

Extend the existing global axis: `writingSettings.progress:
'words' | 'time' | 'project' | 'off'`. The gear offers **project** only when
the current page belongs to a project with a StoryPlan; on any other page
the setting silently degrades to **words** — no greyed states (a greyed
toggle nags; per the brief's own instinct, Journal pages simply never see
it). Per-document overrides: not v1 — setting sprawl without a validated
need.

## Question 4 — Structure Board notecards: the dot, not a bar

A per-notecard fill bar needs a denominator. The only candidates are word
targets (per-scene quotas — the motivation psychologist's hardest veto in
this pass: scene-level padding pressure is *worse* than chapter-level) or
the three-state re-rendered as 0/50/100% (a bar cosplaying as continuous —
it lies about precision). **Ruled: notecards get the existing `.status-dot`
pattern** (`index.css` — "glanceable progress, 10px ink-fill dot, always
paired with a text label") in the same three states and the same celebration
on transition. Nick's ask is honored in spirit — glanceable orange progress
under every notecard — and the bar-specific part is **vetoed with this
reason on the record**, not quietly dropped.

## Question 6 — "anywhere a user is prompted to write," enumerated

Today: PageEditor text pages and QuickSprint (project mode applies when
plan-linked), Journal authored pages (words/time only — no project, by
design), boards (no prose prompt — nothing), script pages (**the S-arc
convergence point**: `Scene.beatId` was reserved-not-built in S1 precisely
for this; wiring it is S-arc work, explicitly out of M1's scope, logged).
Nothing aspirational gets a bar invented for it.

## Opposition note (Marketing, for the record)

Milestone circles screenshot beautifully; a quota bar would demo even
better and would poison the positioning — this is the anti-hustle writing
app, and streak-adjacent mechanics are the one genre of feature the brand
cannot absorb. Reach defers to principle. The circles-as-coverage story
("the app notices what exists; it never grades it") is itself marketable.

## Proposed ledger delta (replaces item 12 on commit)

> 12. ~~Progress-milestones committee pass~~ **RULED — 2026-07-12**
>     (`docs/progress-milestones-canon.md`, pending Nick's word): coverage,
>     never verdicts — circles project beat facts read-only; no marking
>     gestures on writing surfaces; word targets vetoed; notecards get the
>     status-dot, not a bar; one celebration grammar, B4 the final authority.
>     Build: **M1** (`docs/m1-milestones-brief.md`), sequenced after the
>     hardware session, designed with B4.

— Fable, for the committee
