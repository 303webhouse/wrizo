# Item 198 — refinement: the cursor comes from Postgres's own clock (FIX)

**Branch `item198-db-clock`.** Fable's refinement of the merged 198 build: the cursor from Postgres's own
`now()`, the 10s overlap kept, both instruments re-run. One file of product change:
`apps/server/src/sync.ts` (+ comments). No client change, no new column, no `$N` on any upsert.

## What changed

`/sync`'s `serverTime` was `new Date()` in the app process while every `synced_at` is Postgres's `now()` —
two machines' clocks again, only smaller. It is now `dbNow()`: `select now() as t`, read **after the pushes and
before the pulls** (where the literal used to evaluate it), returned as an ISO string.

- **Direction is safe.** `now()` is the start of that statement, so the cursor is never later than any pull's
  snapshot: a row that commits in between is returned now *and* next time (the client skips what is not
  newer) — never missed. node-pg returns the timestamptz as a `Date` in whole milliseconds, truncated **down**,
  which again errs toward returning more.
- **What it removes from the in-flight window.** The window was *(statement run time) + (app↔Postgres clock
  skew)*. It is now the statement's run time alone. The 10s overlap stays; it is now bounding only that.
- **Cost:** one extra round trip (`select now()`) per sync, i.e. per 20s per device.

## Evidence

- **`sync-incremental-pull-proof.mjs --mutants`** — baseline **green, 23 checks** (9 claim, 7 control, 7 census).
  New: **K4** — Postgres's clock 60s *behind* the app's (six times the overlap), an edit pushed after B's last
  sync still reaches B's next incremental pull; **N7** — the cursor comes from `dbNow()`, not `new Date()`.
  **C6 was rewritten**: it used a stamp/cursor skew to show the overlap is a bound, which the refinement
  correctly makes impossible; it now models the honest remaining case — a writing statement that runs **11s**
  (a long lock wait) slips past a 10s overlap, and a full pull recovers it. **16 mutants, each server edit
  removed alone, each red on a dynamic claim.** The new one — *cursor from the app clock again* — turns
  **only K4** red (and N7), so it is attributable.
- **`real-postgres-check.mjs`** — **PostgreSQL 18.4, 17/17.** New: `serverTime` is bracketed by two
  `select now()` reads taken around the call; a row written after that response is stamped by the same clock and
  is not older than the cursor it handed out. **One correction to the script itself:** its "old server" control
  was `git show origin/main:` — which is no longer the old server now that 198 is on main. Its own guard
  refused to run (`… is not the pre-198 server`), which is what the guard was for; it now pins the base commit
  `481894f`.

## Not done / not checked

- No production run; the production Postgres version is unknown (nothing here is version-specific).
- K4 models the skew as a fixed offset on the fake pool's clock. Real skew drifts; the argument that it cannot
  matter is structural (stamp and cursor now read the *same* clock), not a measurement of any real skew.
- Concurrent edits inside one sync interval, and client clock skew deciding last-writer-wins, are unchanged.
