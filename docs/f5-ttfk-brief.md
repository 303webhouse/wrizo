# F5 — TTFK instrumentation (SessionLog on the real paths) — build brief

**Branch:** `f5-ttfk` — created FIRST, before the first edit. Off `main` (F1–F4).
**Deploy note:** pure instrumentation — no feel work, no hardware items. It merges
to `main` and rides whatever `railway up` ships next (before or after the arc-F
gate clears; either order is fine).
**Arc:** F — "From open to flow" · ticket 5 of 6 · the arc's proof of work
**Canon:** `docs/state-of-wrizo-2026-07.md` Rev 2 (Finding 4, Part V) · 2026-07-02

## Why

TTFK — time to first keystroke — is the north-star, and today it's unmeasurable
on the paths that matter. `SessionLog.firstKeystrokeAt` exists and syncs, but
only QuickSprint writes sessions; the PageEditor (where books happen) and
authored journal pages log nothing. F5 extends the existing instrumentation —
extend, don't invent — so the funnel the whole arc exists to fix becomes a
number in Railway SQL. No dashboard, no UI, no streaks: measurement only.

## Slice 0 — read before writing (schema reality check)

Read the `SessionLog` type + the `sessions` table in `migrate.ts`/`sync.ts`
FIRST. Expected gaps: a surface discriminator and a funnel timestamp. If absent,
this ticket's ONLY schema is two boot-idempotent columns —
`alter table sessions add column if not exists surface text` and
`... desk_opened_at text` — mirrored through `rowToSession` AND
`upsertSessions` per the sync checklist. If a usable discriminator already
exists, reuse it and skip the DDL entirely.

## Slices

### Slice 1 — sessions on the writing surfaces
- Surfaces logged: PageEditor (`surface:'page'`), authored JournalEntry
  (`surface:'journal'`). QuickSprint behavior unchanged; its NEW writes carry
  `surface:'sprint'` (no historical backfill).
- Lifecycle: `startedAt` = surface mount; `firstKeystrokeAt` = the first
  forward/content keystroke — the SAME onForward/noteWrite seam F2's warm
  release uses (one seam, third consumer); `endedAt` = unmount/flushNow.
- Litter guard: record at unmount ONLY IF a keystroke happened OR dwell ≥ 10s.
  Drive-by navigation logs nothing. "Opened and stalled" (≥10s, zero ink) DOES
  log with a null `firstKeystrokeAt` — that is the failure case TTFK exists to
  expose, not noise.
- `refId` = the entry id; carry `projectId` when it's a binder page.

### Slice 2 — the funnel timestamp (Desk → ink)
- An in-memory, module-level `deskOpenedAt` set on Desk mount. The NEXT session
  that records consumes it into `desk_opened_at` (one-shot — cleared after
  use, never persisted app-side). Desk→ink latency = `firstKeystrokeAt −
  desk_opened_at`, computed in SQL, not in the app.
- No UI anywhere. The Desk renders nothing new.

### Slice 3 — the queries (the deliverable)
Land these at the bottom of this brief's backlog entry AND verify them against a
seeded run. Railway `psql` is the dashboard:

    -- Median TTFK per surface (seconds), last 30 days
    select surface,
           percentile_cont(0.5) within group (order by
             extract(epoch from (first_keystroke_at::timestamptz
                               - started_at::timestamptz))) as median_ttfk_s,
           count(*) as sessions
    from sessions
    where first_keystroke_at is not null
      and started_at > now() - interval '30 days'
    group by surface;

    -- Desk→ink funnel: median open-to-writing + stall rate
    select percentile_cont(0.5) within group (order by
             extract(epoch from (first_keystroke_at::timestamptz
                               - desk_opened_at::timestamptz))) as median_desk_to_ink_s,
           avg(case when first_keystroke_at is null then 1.0 else 0 end) as stall_rate,
           count(*) as sessions
    from sessions
    where desk_opened_at is not null
      and started_at > now() - interval '30 days';

Adjust column casts to the actual schema found in Slice 0.

### Slice 4 — drive-by (from the F2 review, still open)
Two cosmetic one-liners, homed here so they can't orphan if the tablet pass
comes back clean:
- The return card's line falls back to `'Untitled'` when the target page's
  `firstLine` is empty (today an all-deleted page renders an empty quote).
- The journal/shelf crumb branches in `describeTarget` filter empty pieces
  (today a blank loose page renders a trailing "Journal / ").

## Non-goals (other tickets / later)
Any UI, dashboard, chart, or streak — measurement only; anon-gate timing (the
HOME-verification pass owns first-run); the first-line invitation (F6); server
aggregation endpoints; historical backfill of old sessions.

## Invariants
- Zero behavior change to any editor — listeners on existing seams only.
- Logging can never block writing: session writes are fire-and-forget inside
  try/catch; a logging failure is silent and the keystroke always wins.
- Sessions collection only. If Slice 0 adds columns, they appear in BOTH the
  push handler and the pull mapper (the checklist), with a live round-trip
  after deploy.
- Privacy unchanged: this is the user's own synced data, identical in kind to
  the sessions QuickSprint already writes.

## Definition of done (in-harness)
1. A chapter session logs `surface:'page'` with a sane TTFK; an authored
   journal session logs `surface:'journal'`.
2. A <10s, zero-keystroke drive-by logs NOTHING; a ≥10s stall logs with null
   `firstKeystrokeAt`.
3. QuickSprint sessions unchanged; new ones carry `surface:'sprint'`.
4. `desk_opened_at` lands on the first post-Desk session and ONLY that one
   (one-shot consumption proven).
5. Both SQL queries return sane numbers against a seeded run.
6. If columns were added: live prod round-trip after deploy (D2 precedent).
7. Slice 4 drive-bys: empty-page card shows "Untitled"; no trailing crumb sep.
8. `tsc` (desktop + server) + `build:web` + selftest green; CDP checks for 1–4.

## Working environment
- Branch `f5-ttfk` FIRST, before the first edit.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
