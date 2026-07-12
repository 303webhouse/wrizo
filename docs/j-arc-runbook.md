# J-arc execution runbook — for the fresh CC session

> **EXECUTED IN FULL — 2026-07-11.** Steps 1–2 (J3 + VW merge/deploy), J4
> build → review → merge → deploy, J5 build → review → merge → deploy all
> closed; see `docs/open-threads.md` and `docs/backlog.md`. Kept for pattern
> reference — the runbook proved the chat-independent execution model. The
> ledger (`docs/open-threads.md`) is the living tracker now.

**Place this file at:** `docs/j-arc-runbook.md` and commit it.
**What this is:** the consolidated, chat-independent order of operations to
take the arc from its current state (J3 + VW reviewed on branches, J4/J5
briefed but unstarted) through to J5. The prior session ended before
executing the merge protocol; this file replaces chat relay.

## Authorization boundary (read first)
This runbook carries Nick's standing word for exactly these actions:
committing the brief files, the two required fixes below, merging
`j3-spread-view` and `vw-voice-wall` to `main`, the ONE `railway up` in
Step 2, and STARTING J4. It is NOT authorization to merge or deploy J4 or
J5 — each of those ships on its branch (report = push), routes to Fable for
code review via Nick, and merges only on Nick's subsequent word.

## Step 0 — session hygiene
- Launch Claude Code from the repo root (`writer-studio`) so
  `.claude/settings.local.json` governs the session.
- Nick will drop three files into the working tree; commit them to `main`:
  `docs/j4-board-brief.md`, `docs/j5-spread-console-brief.md`, this runbook.
- Read `AGENTS.md`, `docs/backlog.md`, `docs/j-arc-design.md` before touching
  code. House law: propose, never ship, changes to your own permissions or
  harness config.

## Step 1 — fold the two required review fixes (pre-reviewed, required)
Both branches were code-reviewed GREEN by Fable with exactly one required
one-liner each. Apply each fix ON ITS OWN BRANCH and re-run that branch's
existing checks before merging.

1. **`j3-spread-view` — pointer capture on drag lift.** In `Spread.tsx`,
   where the drag commits (beginDrag path): `grid.setPointerCapture(e.pointerId)`;
   release it in `finishDrag` (guard with `hasPointerCapture` or try/catch).
   Why: without capture, a drag released OUTSIDE the grid never delivers
   `pointerup` to the grid listener — a lifted cell and stale drop line
   strand until the next full drag cycle. No data risk; pure robustness.
2. **`vw-voice-wall` — collapse selection before allowed own-ink paste.**
   In `JournalEntry.tsx`, the allowed-paste path (where `shadowAllows`
   passes and the code calls `document.execCommand('insertText', …)`): if
   the current selection is non-collapsed, `collapseToEnd()` FIRST.
   Why: pasting own ink over a live selection currently REPLACES it —
   select-then-replace through the back door, violating the surface's law.

## Step 2 — merge + deploy (pre-reviewed, required)
1. Merge `j3-spread-view` → `main`. Then merge `vw-voice-wall` → `main`.
2. **Union-resolve** conflicts in `apps/server/src/sync.ts` and
   `apps/server/src/migrate.ts` — the branches edited the same hunks
   (`main` gained `order_index` via J1; VW adds `imported_at`; git may
   conflict, which is fine, or auto-resolve, which is dangerous).
3. **Grep-verify before deploying** — this is the load-bearing check: BOTH
   `journal_entries` mappers (pull `rowTo…` AND push upsert) carry BOTH
   `order_index` AND `imported_at` in column lists, params, on-conflict
   set, and pull field mapping; `migrate.ts` has both add-if-missing lines.
4. `tsc` (desktop + server) + `build:web` + selftest green on merged `main`.
5. Push `main`; `railway up` from the working tree.
6. Live round-trip: verify `imported_at` survives a prod sync cycle
   (`order_index` is already live; D2 precedent for the check pattern).
7. Log the merges in `docs/backlog.md`. Report completion to Nick — this
   deploy is also what unblocks his consolidated S25 gate session
   (J2 eraser feel + J3 drag/scroll probes + the formal stack word).

## Step 3 — build J4 per `docs/j4-board-brief.md`
- Branch `j4-board` off post-merge `main`. Follow the brief exactly; its
  Slice-1 grep now includes `boxes` alongside `order_index` + `imported_at`.
- May proceed in parallel with Nick's S25 session (the reframed gate:
  building continues; TICKETS close on verdicts).
- Ship = push the branch + report. Then STOP: J4 merges only after Fable's
  review returns and Nick relays the word.

## Step 4 — J5
- Re-run the prerequisite gate in `docs/j5-spread-console-brief.md` (it now
  passes if Steps 2–3 landed and J4 merged on Nick's word).
- Build per the brief. Same ship discipline: push, report, hold for review.

## Standing rules restated (fresh-session summary)
Report = push, every time. One ticket's review returns before the next
begins (Steps 1–2 are exempt: already reviewed). Briefs and canon live on
disk, never only in chat. Deploys are `railway up` from the working tree;
none beyond Step 2's without Nick's explicit word. Hardware gates: merge+
deploy is the test on single-user prod, but a ticket is DONE only when
Nick's device verdict lands.
