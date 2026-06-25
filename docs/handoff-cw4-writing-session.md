# CW4 — WritingSession context + app-level no-interruption

**Branch:** off `m1-creative-flow` with CW1 merged in (CW4 refactors WritingShell/useChromeFade). Sibling to dm1/cw1/cw2.

## Goal
Finish Principle #8 at the app level. CW1 recedes the sprint's own chrome during writing; the global App frame — the top-right header (Full screen / "All changes saved" / Sign out) — still sits there the whole time. CW4 introduces a WritingSession context so writing-mode is a single source of truth the whole app can read, then uses it to recede that global header with the same fade. When you're writing, the entire frame drops below the attention threshold, not just the sprint's local chrome. This is the exact work CW1 deferred into this ticket.

## What CW4 introduces
WritingSession context — provider + `useWritingSession()` hook — the single source of truth for:
- `isWriting` — active forward input within the settle window (the writing-mode CW1 already computes).
- `inSession` / `activeSurface` (optional, minimal) — whether a writing surface is mounted, and which.

Keep it minimal and surface-agnostic. This is the abstraction the journal (CW3), the gate, and HOME subscribe to later — build it clean for that, but don't build for them now.

## The refactor (don't regress CW1)
- Lift writing-mode state out of `useChromeFade`'s local ownership up into WritingSession. The shell keeps owning the recede mechanics — the `data-chrome-receded` convention, the 500ms settle, the intent/idle restore. CW4 only re-homes the state so other surfaces can read it.
- Hard requirement: zero behavior change on the sprint surface. All 11 CW1 checks must still pass — starts at rest, recedes on write to opacity-0 + pointer-events:none, editor/caret/warmth never fade, Esc/pointer/tap-outside/idle all restore. We're moving where the state lives, not how it behaves.

## New behavior — global header recede
- Make App.tsx's global header a consumer of WritingSession: when `isWriting`, it recedes using the same `.chrome-fade` + `data-chrome-receded` convention CC already established (reduced-motion → instant). Same feel as the sprint chrome.
- Restore is already wired: the existing intent signals (pointer move / tap outside text / Esc) and the idle horizon flip the same writing-mode state, so they now restore the global header and the sprint chrome together, in one coherent motion — confirm it reads as a single frame settling back, not two staggered fades.
- Confirm the ember handle brings the global header back too (or that restore-on-reveal already covers it) — it stays the universal way back.

## No-interruption, app level
Nothing global asserts during active writing — the header, the "All changes saved" indicator, any app-level banner. This is consistent, not new policy: autosave is already silent; now its indicator recedes too. Nice side effect — at rest, "All changes saved" returns for reassurance; while writing, it's gone, because you're writing, not watching the save state.

## Judgment call — flag for redline
Recede the global header fully — Sign out and Full screen included — during active writing. My call: purity wins. "Everything that isn't the words goes" should mean everything; the ember handle is the universal escape hatch and restore is forgiving, so nothing's trapped. The flag: Sign out / Full screen vanishing mid-write can read as liberating or disorienting, and that's felt — so it's on the tablet list. (On Full screen specifically: if it's how a user enters focus, it vanishing after they've started writing is fine — they've already entered focus by writing — and it returns on intent.) If it's wrong on hardware, fallback is one minimal always-present app-level anchor; try full-recede first.

## Coordinate / preserve
Don't regress CW1 or CW2. Don't touch the editor's input internals (CW2 owns those). Don't touch `apps/server/**` or sync. Respect prefers-reduced-motion (instant). All shipped A/J features keep working.

## Out of scope (later tickets)
- CW3 (journal adopts shell + editor + WritingSession) — separate; lands cleaner after this.
- The gate, HOME, TG2.
- Any new contenteditable surface.

## Definition of done
- `tsc` + `build:web` pass; harness green.
- WritingSession context/provider + `useWritingSession()` exist; writing-mode read from context as the single source of truth.
- During active writing on the sprint surface, the global header recedes with the same fade convention; on intent/idle it returns together with the sprint chrome in one coherent motion.
- No CW1/CW2 regression — all prior CW1 checks still pass; editor/caret/warmth never fade; autosave silent; no modal/toast/focus-steal during writing, now including app-level.
- Reduced-motion → instant.
- Context is surface-agnostic — ready for journal/gate/home to subscribe.
- Zero `apps/server/**` or sync changes. Don't push or deploy — leave for review.
- Harness verifies the state transitions (global header receded during writing; restored on Esc/pointer/idle); the feel of the combined recede wants the tablet pass — flag it with CW1's timing items.
