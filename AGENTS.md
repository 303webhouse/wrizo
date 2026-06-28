# AGENTS.md — Working rules for agents

## Stage 1 goal (M1)
Build a Writer Studio with a guided flow by default:
Session Launcher → Structure Wizard → Beat Wizard → Structure Board.

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
