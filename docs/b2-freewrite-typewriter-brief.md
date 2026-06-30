# B2 — Free Write & typewriter fixes (CC brief)

**Branch:** `b2-freewrite-typewriter` off `main`.

## Why
Five fixes to the Free Write / typewriter experience surfaced during dogfooding. Mostly cheap — C5 is model-correctness, not polish.

## Scope — the fixes

### C1 — Typewriter scroll starts ~2 lines later
The active line holds too high (~62% of the viewport) and history scrolls up / fades too early. Lower the hold point by roughly two lines so more written context stays visible before a line scrolls off the top and fades. Tune the active-line anchor, not the fade curve.

### C2 — Fresh-page first line must be full opacity (BUG)
On a new page after using typewriter mode, the first line renders FADED, then returns to 100% as more lines are written. A fresh page's first/active line must start at full opacity; the fade applies only to lines that have scrolled above the active line. Root cause is likely the fade state (active-line index / history set) carrying over from the prior page or mis-initializing on a fresh page — reset it on page open so line 1 is never treated as faded history.

### C3 — Typewriter "jolt" on line advance
When the active line reaches the bottom and the text moves up, animate it with a subtle typewriter-like jerk — a small, quick upward jolt / slight overshoot-and-settle — rather than a smooth glide. Keep it subtle: a hint of mechanical paper-feed, not a bounce.

### C4 — Typewriter mode must actually turn off (+ default off)
The gear's Typewriter toggle must fully disable the mechanic (fixed viewport, active-line hold, history fade, the C3 jolt) when off — plain top-to-bottom scrolling. Default it OFF. Per the chrome-work finding: the scroll fights revision, so it's opt-in, not default.

### C5 — Leaving Free Write drops struck (deleted) text
In Free Write, "deleting" strikes text rather than removing it (forward-only). When the user switches from Free write to Draft or Format, the struck text must disappear from the editor so only the clean, unstruck draft persists in view. The struck content stays in the substrate — it is excluded from what Draft/Format render, NOT destroyed. This is likely most of the way there already: Draft/Format should render the derived unstruck text (the fragment spine minus struck runs — `sprintTextOf` excludes struck runs). Confirm the mode switch renders that derived text; if a page's Free Write uses a different strike representation than the fragment substrate, drop the struck spans on the same switch. **Never delete struck content from storage.**

## Invariants / guardrails
- C1-C4 touch only the typewriter view behavior — do not change the forward-only writing rules or the dissolve engine.
- C5 must never destroy struck content in the substrate — it is excluded from the rendered draft, not deleted.
- No new deps; minimal changes.

## Definition of Done
- `tsc` + `build:web` clean.
- C1: history holds ~2 lines longer before scrolling / fading.
- C2: open a fresh page -> line 1 is full opacity immediately; no fade-in-from-faded.
- C3: line advance shows a subtle upward jolt, not a smooth glide.
- C4: toggle off -> normal scrolling, no hold / fade / jolt; default is off.
- C5: type in Free write with struck text -> switch to Draft -> only unstruck text shows; switch back -> struck content still present in the substrate (not lost).
- Harness selftest green; CDP: fresh-page line 1 opacity full; toggle-off disables the mechanic; struck text absent in Draft.
