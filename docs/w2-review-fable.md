# W2 — the way back · Fable review · 2026-07-13

**Branch:** `w2-way-back` @ `1b10d04`, reviewed via the read pipe (full patch).
**Merge state:** pre-authorized by Nick's word 2026-07-13 (fix-forward mode:
zero-schema, client-only, single-user prod). Fixes below fold as **w2.1**
before the ticket closes.
**Place this file at:** `docs/w2-review-fable.md`.

## Verdict

**REQUIRED — 2** (one verification pass, one small code fix), **3 advisories.**
No data-loss-class findings; no architecture findings. The hard part is
right: continuous ref-tracking instead of at-unmount queries (the
blur-before-cleanup catch is exactly the bug class a naive build ships),
one-shot consume keyed purely on entryId, the dead-entry guard resolving
both persistence shapes and respecting `deletedAt`, `/journal/spread`
excluded from `isWritingRoute`, the chip on the Plan route being the ruled
canon interlock, and the two PAGE IS PRIMARY standing assertions promoting
W1's rect check to a permanent invariant. Strong ticket.

## Required

### R1 — Prove the keying, don't comment it (pager path + QuickSprint identity)
`useWayBack.ts`'s capture-on-unmount is only correct if **every caller
unmounts on entryId change** — the hook's own comment asserts "callers are
keyed by id." If any text surface is *not* keyed (React Router param change,
same component instance — the notebook pager's A→B is the live path), the
effect ordering mislabels the capture: `liveRef` re-renders to B *before*
A's cleanup runs, so A's scroll/caret get written under B's id, and the
restore effect then consumes that slot and **applies A's scroll/caret to B
on arrival**.

**Do:** (a) grep and confirm `key={id}` (or equivalent remount-forcing) at
all three text-surface render sites — the PageEditor text-delegate render,
JournalEntry's view wrapper, QuickSprint (keyed by `draftId`). Fix any site
that isn't. (b) Verify QuickSprint's `draftId` is stable across mounts (a
resumed sprint must produce the same id, or restore can never match) and
that sprint `mode` persists per-draft — if it doesn't, wire `applyMode`
through the hook for that surface (the canon promises mode restore; PageEditor
covers it via its own per-page key, QuickSprint must cover it somehow).
(c) Harness additions to `w2.mjs`: a pager A→B check (scroll A, pager to B,
assert B's scroll is its own natural top and `sessionStorage['wrizo-way-back']`
— if present — names A, not B) and the missing QuickSprint depart/return
scenario (scroll+caret+mode).

### R2 — Cancel restore re-asserts on first real input
The rAF + 80/200/350ms re-assert ladder is the right fix for the
mount-seeding race, but it fights the writer inside its own window: typing
resumed at ~300ms gets the caret yanked back mid-word by the 350ms write;
an immediate flick-scroll gets un-scrolled. **Fix:** in the restore effect,
after the first rAF apply, register one canceller on
`keydown`/`pointerdown`/`wheel`/`touchstart` (window, `{ capture: true }`,
self-removing on first fire) that clears the remaining timers. The initial
apply always lands; the re-asserts only run while the writer hasn't acted.
**Harness:** restore, dispatch a synthetic keydown at ~100ms, assert the
250/350ms writes did not move the caret back (caret equals typed-position,
not the restored offset).

## Advisories

- **A1** — `getCaretOffset` walks a TreeWalker from the editor's start on
  *every* `selectionchange` (every keystroke). Negligible at current node
  counts (µs-scale); if a future editor structure multiplies text nodes
  (per-word spans, heavy run-splitting), switch to storing
  `anchorNode`/`anchorOffset` refs and resolving the linear offset only at
  capture. Add this note to the file header so the future is warned.
- **A2** — `setCaretOffset` calls `el.focus()` *after* `addRange`. Correct
  in Chromium/Electron (harness proves the restored offsets land exactly);
  if a non-Chromium target ever matters, the safe order is focus-then-range.
  Note-level.
- **A3** — A reload on a non-writing route preserves the chip
  (sessionStorage survives same-tab reload). **Judged correct** — the "live
  thread" survives a refresh, dies with the tab — recorded here so nobody
  "fixes" it later.

## Merge / close protocol

Merge is pre-authorized (Nick, 2026-07-13). If not yet executed: merge,
full suite on merged `main` (`tsc` ×2, `build:web`, selftest, `j4` 26 /
`j5` 40 / `s1` 87 / `w1` 18 / `w2` 21), push, `railway up`, liveness only
(zero-schema). If already live: stand. Either way, **w2.1** (R1 + R2 +
their harness additions) folds on the branch-or-main per current state,
re-run `w2.mjs`, push for Fable's delta spot-check. Ticket closes on Nick's
device verdict (feel gates below).

## Proposed doc amendments (CC commits with w2.1)

**1. `docs/open-threads.md` — new item under IN FLIGHT (→ strike to DONE at
merge, item-5 pattern):**

> **W2 — the way back.** Built per `docs/w2-way-back-brief.md` on
> `w2-way-back` @ `1b10d04`; PAGE IS PRIMARY landed in `AGENTS.md` with the
> ticket per the canon. Fable's review: REQUIRED — 2
> (`docs/w2-review-fable.md`): the keying/QuickSprint verification pass
> (R1) + restore re-asserts cancel-on-input (R2). Merge pre-authorized by
> Nick's word 2026-07-13 (fix-forward mode); w2.1 folds before close.
> Device gates join item 2.

**2. `docs/open-threads.md` — item 2 gains an eighth cluster:**

> - W2 · S25 + desktop: chip legibility + thumb reach at the rail's top
>   slot, the restore "snap" (does arriving mid-scroll/mid-caret feel like
>   resuming or like being teleported), and the ember warmth reading as
>   invitation rather than notification.

**3. `docs/w1-close-handoff.md`** — strike Step 3 as executed; Step 4 (M1)
arms when w2.1's delta spot-check comes back green.

— Fable
