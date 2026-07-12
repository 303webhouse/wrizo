# Project-progress toggle + milestone circles (committee brief for Fable)

**For:** Fable. Convene **the Experts** and **the Architects** per `AGENTS.md`'s roster, **at max
thinking effort**, double-pass protocol. This touches motivation psychology (streak/completion
mechanics are explicitly flagged as risky territory in existing canon) and a new visual language —
not routine work.

**Requested by:** Nick, 2026-07-11, as part of the same writing-surface batch as
`docs/page-primacy-committee-brief.md` — read that one too if scheduling one combined session;
they were requested together but are separable decisions.

**Deliverable:** a ratified design decision + a CC-ready build brief (`docs/*-brief.md` format).

---

## What CC already shipped this session (context, don't re-solve)

The linear word/time progress bar was redesigned per Nick's spec and is live in both writing
surfaces (`PageEditor`/`QuickSprint` via `ModeStage`, and `JournalEntry`), verified via the app's
own CDP harness:

- New shared component `apps/desktop/src/components/WritingIncentives.tsx`:
  - `useGoalProgress(value, goal)` — treats the metric as a repeating **lap**: returns the
    fraction within the current lap (0..1) and a `celebrating` flag that pulses true for ~1.1s
    whenever the value crosses a goal multiple, then the bar resets for the next lap.
  - `ProgressBar` — subtler brown/cream track (`var(--paper-dim)` track, a muted tan fill), a
    small **orange caret** (a dot, `var(--brass)`) riding the fill's leading edge as a "you are
    here" marker, and on goal-cross the whole fill flashes full orange with a box-shadow pulse
    (`@keyframes pfill-celebrate`) before resetting.
  - `AmbientGlow` — unchanged concept, cumulative session warmth (doesn't reset per lap, unlike
    the bar).
  - `TypewriterToggle` — unrelated to progress, but lives in the same file/incentive-row.
- Default goal: `WORD_GOAL = 250` words (existing constant, unchanged this session — Nick's
  message floated "250 or 500" as options; 250 was already the shipped default and nothing in this
  session's ask required changing it, so it was left as-is). `TIME_GOAL_MS = 25 * 60 * 1000` (25
  min) is the Time-metric equivalent.
- This is now **decoupled from B5's in-document pagination** (the old `.mode-page.flipping`
  page-turn animation on physical sheet overflow) — that still exists and still animates the page
  itself on overflow, but no longer drives the progress bar's fill (it used to; that conflated
  "how full is the current physical sheet" with "progress toward a writing goal," which didn't
  match what Nick described wanting). The page-turn "p.N" label still shows beside the bar as
  informational context.

**This is the piece to build ON, not redo.** The questions below are additive — a new *mode* for
the bar, and a new *place* it appears — not a redesign of what's shipped.

## The ask that's still open

From Nick's message:

> "If the writer is working on a draft, the progress bar should be toggle-able from word count to
> project progress. I'm open to suggestions on how to track that for different kinds of progress,
> but that bar should be a line with section breaks delineated by open circles, and once a chapter
> or scene, e.g., is completed, the progress bar should hit the next circle, [and] also lights up
> orange with a subtle but noticeable animating effect. (Same also goes for the progress bar
> beneath the plot structure note cards, and anywhere else that a user is prompted to write.)"

So: a **second progress-bar mode** — a linear track with open circles at section boundaries
(chapters/scenes), each circle filling/lighting orange with a celebration on completion — plus the
**same visual language reused under Structure Board notecards**.

## Why this needs the committee, not just a build ticket

- **Motivation psychologist:** `AGENTS.md`'s Experts roster exists partly to "guard... friction-
  as-commitment... and no streak mechanics, ever." A per-chapter completion tracker is adjacent to
  streak/checklist mechanics — worth an explicit read on whether a "mark chapter done" gesture
  creates all-or-nothing pressure that fights the anti-perfectionism principle already established
  for this app (see `docs/state-of-wrizo-2026-07.md` Part III, motivation-psychologist section).
- **What counts as "complete" is a real design fork**, not an implementation detail — the answer
  changes what gets built:
  - **Manual** (writer marks a chapter/scene done) — simplest to build, but is it a checkbox-list
    UX the app has deliberately avoided elsewhere? Does it need an "undo/unmark"?
  - **Inferred from structure** — e.g., every scene in `StoryPlan`/`Scene` (see `types/index.ts`)
    already has a `beatId?` reserved field (per `fragments-under-pages-canon.md` §2) for linking a
    Page to a Plan beat; if a Page is linked to a beat, does the beat's own status
    (`setBeatStatus`/`getStoryPlanByProjectId` already exist in `persistence.ts`) drive the circle?
  - **Word-count-per-chapter** — some implied or configurable per-chapter target, mechanically
    close to the existing lap logic but scoped per-Page instead of per-session.
  
  These aren't equivalent — manual is a UI-only ticket; beat-linked requires the `beatId` wiring
  (dormant since S1, per canon, reserved for exactly this) to actually activate; word-count-per-
  chapter needs a new per-Page target field. The Architects (systems engineer especially) should
  pick one with the actual data model in hand, not guess.
- **Visual/interaction spec for the circles is genuinely undesigned** — how many show at once (all
  chapters vs. a windowed/scrollable view for a 40-chapter novel), what an *in-progress* chapter
  looks like (partially filled segment vs. binary done/not-done dot), and whether tapping a circle
  navigates to that chapter. This is squarely the interaction designer's + visual designer's brief.

## Questions for the committee

1. **What counts as "chapter/scene complete"?** Manual mark, beat-linked (via the dormant
   `beatId`), word-count-per-chapter, or something else? Motivation psychologist leads; systems
   engineer confirms buildability against the actual schema.
2. **Circle-bar visual spec:** count/overflow behavior for long manuscripts; in-progress vs. done
   states; tap/click behavior (navigate to that chapter, or just a glance indicator); does it share
   the exact orange-celebration keyframe already shipped (`pfill-celebrate`) or need its own,
   given it's discrete circles rather than a continuous fill?
3. **Where does the Words⟷Project toggle live?** Per-document (a page-local preference, like
   `wrizo-mode-page-${id}`'s pattern), per-project, or a global writing setting alongside the
   existing gear (`writingSettings.ts`'s `progress: 'words'|'time'|'off'` — does this become
   `'words'|'time'|'project'|'off'`, or is "project" a separate axis entirely, e.g. only offered
   when the page belongs to a project with a StoryPlan)? Journal pages have no project — confirm
   the toggle simply doesn't render there (defaulting to words), not that it's disabled/greyed.
4. **Does this extend to Structure Board notecards**, and if so, what does an individual notecard's
   bar track — the linked Page's word count against a per-scene target, or just the beat's binary
   status? Should it use the linear fill-bar (small, under a notecard) or a miniature version of
   the circle-bar (unlikely to fit at notecard scale — the committee should just confirm the fill
   variant is right for notecards specifically, distinct from the chapter-level circle-bar which is
   for the whole manuscript).
5. **Visual/graphic designer:** confirm both variants (linear fill + circle-bar) read as one
   system with what's already shipped — same orange (`--brass` family), same "subtle but
   noticeable" animation weight (the shipped `pfill-celebrate` pulse is the calibration reference),
   square-corner/solid-border house style.
6. Nick's message also said "and anywhere else that a user is prompted to write" — the committee
   should enumerate what that actually covers today (Free write, Draft, script pages once S4 lands
   Free-write there) versus what's aspirational/out of scope for this pass (e.g., don't invent new
   writing-prompt surfaces just to give them a bar).

## Invariants / guardrails

- No new deps.
- Reuse `useGoalProgress`/the `WritingIncentives.tsx` module and its celebration language where it
  genuinely fits — don't fork a parallel progress system for the circle-bar if the lap logic
  applies to a per-chapter-index count too (a chapter "goal" of 1 chapter = laps of 1, is a
  plausible reuse — let the frontend architect judge).
- Must not regress the already-shipped word/time bar (default mode, currently the ONLY mode for
  Journal pages and for any Page without a StoryPlan).
- If `beatId`-linking is the chosen mechanism, it activates a currently-dormant field — treat that
  activation itself as in-scope for the resulting build brief's Slice 0 (verify current state)
  per the `fragments-under-pages-canon.md` convention.

## Definition of done (for the eventual CC ticket, once ratified)

- The toggle switches a Page's progress bar between Words/Time (existing) and Project (new) modes
  where applicable.
- Completing a chapter/scene (by whatever mechanism is ratified) lights its circle orange with the
  celebration animation.
- The same visual pattern (fill-bar variant) appears under Structure Board notecards, driven by
  whatever per-notecard metric is ratified.
- `tsc` + `build:web` clean; a harness scenario (CDP) proving at least one full lap-completion →
  celebration → reset cycle for the new mode, per `AGENTS.md`'s harness-persistence rule.
