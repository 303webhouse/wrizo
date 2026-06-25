# CW1 — The Middle Door (chrome-fade / no-interruption shell)

**Branch:** off `m1-creative-flow` (sibling to dm1, cw2).

## Goal
Build the writing environment that surrounds the CW2 editor so that, in the act of writing, the interface recedes below the attention threshold and nothing interrupts. This is PHILOSOPHY Principle #8 ("the interface recedes in the act of writing") and the emergence-first Middle Door made real for v0.1. Build it as a reusable primitive — the journal page (CW3) and the gate adopt the same recede behavior next, exactly the way they adopt the CW2 editor.

## What "recede" means
Two states on the sprint surface:

- **Writing** (active forward input): non-essential chrome fades out — the page becomes the words, the caret, and the ambient warmth field, nothing else.
- **At rest** (intent to act, or genuine idle): chrome eases back, gently, no hard cut.

**Fades during writing:** the header/title, word count, timer/session indicator, the "Take a nudge" button, the Finish control, any exit/back/nav affordance — everything that isn't the editor, the caret, and the ambient field.

**Never fades:** the editor, the caret, and the J5 ambient warmth (that's atmosphere, not chrome — it stays, and may intensify with writing; see Coordinate).

## Trigger model (the part to get right)

- **Fade in (to writing):** the CW2 editor already emits `onForward` on every forward keystroke. Hook it: forward input → enter writing mode → fade chrome, after a brief settle so a single stray key doesn't strobe the UI.
- **Restore (to rest):** intent-driven, not pause-driven. Chrome returns on a clear signal the writer wants out or wants to act — pointer moved toward the chrome / screen edges, tap or click outside the text, Esc — and on genuine idle (reuse the existing idle horizon). It does not return on short think-pauses. A pause to think is not failure (Principle #5); don't punish it by flooding the clutter back. The writer stays receded through thinking and surfaces the chrome only when they reach for it.

**My call — flag for redline:** intent + long-idle restore; short-pause stays hidden. The watch-point is discoverability — a writer must never feel trapped with no way back to Finish / word-count. Mitigate with forgiving intent signals (any edge-ward pointer movement, any tap outside text, Esc) and one ever-present minimal affordance (a barely-there handle, or the ember at an edge) that on hover/tap reveals the chrome. If in doubt, make restore easier to trigger, never harder.

## No-interruption (hard rule while writing)
Nothing pops, modals, toasts, or steals focus during active writing. Concretely:

- A1 autosave stays silent (it already is) — no save toasts, ever.
- A7 finish is user-triggered only; it never fires itself.
- J7 echo and J5 warmth stay ambient and non-modal — they may shift the atmosphere, never seize attention.
- Idle nudges (A6/A8) appear only on idle — which is, by definition, not during writing — so they're already consistent with this rule; don't change when they fire.
- Any state change that would otherwise surface mid-writing waits for the rest state or renders ambiently.

## Coordinate with shipped features (preserve, don't rebuild)
Read QuickSprint as it stands post-CW2 and keep all of this working untouched: A1 autosave, J1 commit, A9 sessions, A7 finish + stats, J7 echo, A4 beat bridge, J5 warmth, the sprintText mirror. CW1 orchestrates the recede/return of existing chrome — it does not redesign the chrome elements, and it does not touch the editor's input internals (CW2 owns those). Respect prefers-reduced-motion: under reduced-motion the fade is instant (or near-instant), not animated.

## Reusable primitive
Build the recede behavior as a hook/wrapper (e.g. `useChromeFade` / a `<WritingShell>`), bound to the editor's `onForward` plus the idle/intent signals — not QuickSprint-specific. The journal page (CW3) and the gate opt in with one wire-up. If it only works inside QuickSprint, it's wrong (same standard as CW2).

## Out of scope (later tickets)
- The richer "fragment field / write from heat" Middle Door (heat-based entry) — v0.2, on the convergence engine.
- The ember-intensifies-with-progress curve — that's the B4 ember pass; CW1 just must not fade or fight the existing warmth.
- The idle-nudge content reconciliation (25-prompt / 60s / cap-3 / third-persists) — still deferred; CW1 keeps the nudges firing as they do now and only treats the nudge button as chrome.
- The gate, the journal refactor (CW3), HOME.

## Definition of done
- `tsc` + `build:web` pass.
- On the sprint surface: during active writing the chrome recedes below attention; on intent or genuine idle it returns gently; reduced-motion respected.
- No modal / toast / focus-steal during active writing.
- The recede behavior is a reusable hook/wrapper, ready for journal + gate.
- Every shipped feature above still works; warmth stays ambient (not faded); autosave silent.
- Zero `apps/server/**` or sync changes. Don't push or deploy — leave it for review.
- The fade logic (mode transitions on `onForward` / idle / intent) can be checked in the harness; the timing and feel (settle delay, restore responsiveness) want a real-hardware pass — same lesson as CW2's IME caveat. Verify what you can in the harness; flag the rest for the tablet.
