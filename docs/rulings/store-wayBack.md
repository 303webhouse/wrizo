# Rulings: `apps/desktop/src/store/wayBack.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[wayBack §n]` points here.

## wayBack §1

From `apps/desktop/src/store/wayBack.ts`, line 3 at `f079d49e` (the comment that stays: "the way back: one session-scoped slot (sessionStorage) for scroll, caret and mode; the latest departure wins; a same-tab reload keeps the chip, by design").

```ts
// W2 — the way back. A session-scoped (sessionStorage, one slot) capture of
// the last writing session a departure left behind, so a later return can
// restore more than the route: scroll, caret, and mode. Session-scoped by
// design (docs/w2-way-back-brief.md) — a way back is a live thread, not a
// bookmark; it never survives an app restart and there is no history (the
// most recent departure always wins — "opening a different writing surface
// replaces the slot").
//
// S0 finding (confirmed by code inspection, no separate empirical harness
// step): before W2, browser/router back-navigation restores the ROUTE (React
// Router's own history) but nothing else — no surface anywhere persisted
// scroll position or caret offset across an unmount. This module is the fix.
//
// Fable W2-review advisory A3 (2026-07-13): a reload on a non-writing route
// preserves the chip, since sessionStorage survives a same-tab reload. Judged
// CORRECT, not a bug — the "live thread" should survive a refresh; it dies
// with the tab. Recorded here so this isn't "fixed" by a future pass.
```
