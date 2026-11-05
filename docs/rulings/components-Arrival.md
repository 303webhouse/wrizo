# Rulings: `apps/desktop/src/components/Arrival.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Arrival §n]` points here.

## Arrival §1

From `apps/desktop/src/components/Arrival.tsx`, line 18 at `7f1c6a84` (the comment that stays: "the Threshold, route '/' for every boot: Write is local-first and never needs an account; Open resumes an authed session or reaches sign-in").

```ts
// HB1 S1/S5 — the Threshold. Route '/' for every boot, authed or not:
// the mark, a boot bar (real readiness — doors disable until authState
// resolves), and the two doors (flow §1). Write is local-first — it never
// requires an account (F2: "no new visitor hits a login wall"); the page it
// creates persists immediately via createLooseHomePage/saveJournalEntry, the
// same as any loose page, account or none. Open routes by state (F2): an
// authed session resumes; an anon visitor reaches the existing sign-in
// (relocated from the retired HomeFlow, not rebuilt — same apiLogin/
// apiRegister calls, same fields).
//
// Replaces BOTH the pre-auth HomeFlow gate and the authed Desk room (Nick's
// ruling, 2026-07-16, on the HomeFlow/Arrival overlap surfaced before this
// ticket's code was written — not in the brief's own text). App.tsx now
// mounts the router regardless of auth state; Write/Open/Journal/Shelf/
// Drawers all work on local data whether or not an account exists yet —
// sync simply doesn't start until one does (App.tsx's existing authed-only
// startSync() call, untouched).
```

## Arrival §2

From `apps/desktop/src/components/Arrival.tsx`, line 106 at `7f1c6a84` (the comment that stays: "the Write door opens a room, it does not build one: no row until the first word, and the door's meaning (a loose page) rides in the address").

```ts
    // PB1 (item 71) — the Write door opens a room; it does not build one. No
    // row exists until the first word: the door's meaning (a loose page) rides
    // in the address, and the first-run gate's own one-shot state rides beside
    // it exactly as before.
```
