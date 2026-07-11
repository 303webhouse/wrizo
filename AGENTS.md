# AGENTS.md — Working rules for agents

## Stage goal (current)
The **F-arc** ("from open to flow") is complete in code — F1 resume (the typed
pointer) → F2 mirror card → F3 Catch → F4 title-later create + the writing picker
→ F5 TTFK instrumentation → F6 first-line invitation — staged on `main` behind two
hardware gates (tablet: F2–F6; phone: I0 pen discipline). **TTFK** (time to first
keystroke) is the north-star metric, now instrumented per surface. Next queue:
**HOME verification** (first-run / anon-gate flow), the **anti-slop paste rail**
(the foreign-voice import wall, PHILOSOPHY.md § Voice Wall), and
**fragments-under-Pages** — with INK **I3** (unlink-to-movable-graphic) married to
that design pass. (See docs/north-star.md v0.2 for the as-built architecture.)

## Stack (do not change unless ticket says so)
- Windows
- pnpm workspace
- Electron + Vite + React + TypeScript

## Repo layout (required)
- apps/desktop
- packages/core
- packages/modules-writing
- docs/

## Hard rules
- Keep changes minimal. No refactors outside ticket scope.
- No new deps unless required by the ticket.
- Stop when Definition of Done is met.

## Harness scenarios persist
Every ticket's verification scenario is a committed artifact, not a throwaway:
`scripts/harness/<ticket>.mjs` (or the ticket's established harness location),
landing in the same commit as the build it verifies. Review fixes re-run the
ticket's scenario verbatim and extend it when a fix adds behavior. J4 is the
first citizen; J3/VW predate the rule and have no scripts to backfill.

## Config changes: propose, never ship
Changes to CC's own permissions, harness configuration, or session settings
are proposed in a report and made only on Nick's explicit word — never shipped
inside a build. (First stated in docs/j-arc-runbook.md.)

## Commands you must run before saying done
- pnpm install
- pnpm dev

## Planning committees

Convene by name for non-trivial decisions; skip routine work. Each runs a double-pass: propose, then critique and trim, then a single recommendation. Product/design hand-off: Experts frame intent and the "why"; Architects shape the build and the "how"; both refine together. Marketing runs on built-in opposition (below). Keep deliberation proportional to the decision.

### The Experts - craft and cognition (guard the "why" and the user)
- Deleuzean philosopher: rhizomatics and divergence; guards "divergence is free, convergence is the product" and theme integrity (PHILOSOPHY.md).
- Cognitive scientist (ADHD, attention): flow, executive function, task initiation; the science under the momentum mechanics.
- Writing-craft pedagogue: generative vs revisional practice; guards the Two Minds (Middle Door, Trellis).
- Motivation psychologist: intrinsic motivation, habit, friction-as-commitment, anti-perfectionism without punishment.
- Professional editor: line and developmental editing; clarity, structure, cutting; the convergence and finishing standard.
- Discovery writer (pantser): emergence-first, writes to discover; momentum over plan; voice of the Middle Door user.
- Structural writer (plotter): outline-first, writes to execute and finish; control and revision; voice of the Trellis user.

### The Architects - build and feel (guard the "how"); roster set by the Experts
- Frontend/app architect: React/Electron/TypeScript; editor state, mode switching, writing-surface performance.
- Systems engineer: local-first, sync, Postgres; the clean-derivedText/struck model and offline durability; owns testing.
- Interaction designer: UX flows, motion, the push-back-to-writing engine (dissolve/glow/progress), accessibility.
- Visual/graphic designer: typography, color, the locked tokens, the four themes, the handwritten identity.

### Marketing - positioning and growth (runs on opposition)
Core tensions to convene against each other: reach vs principle, and metrics vs story. Then resolve to one move.
- Growth/acquisition marketer: reach, channels, funnel, experimentation; the scale pole.
- Brand/positioning strategist: differentiation, the anti-AI-slop identity, niche integrity, long-term equity; the principle pole and counterweight to growth.
- Narrative/content strategist: the founding story (e.g. the logo drawn in-app), voice, emotional hooks.
- Skeptical target-user advocate: the ADHD writer allergic to hype and marketing-speak; the customer's BS detector.
