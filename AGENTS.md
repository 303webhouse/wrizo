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
