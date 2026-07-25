# SV8 — the data wipe · executed 2026-07-25

**Authority:** Nick's word, 2026-07-25 — "Clean slate," clarified to *"the SV8 data
wipe, ratified at the batch sitting … Execute it now, per protocol."* Not a git
operation (that reading was declined; git cleanup stopped at "just my lane" — the
FX14 worktree/branch pruned, `main` synced, nothing cross-lane touched).

**Backup cited:** this morning's verified "Everything" export (Nick's own,
client-side download). Cited per Nick's word as the wipe's backstop; NOT
independently verifiable by CC (it is a local file), stated plainly.

**System (identified in-session, per the Relay Law):** the Wrizo production DB —
Railway Postgres, project `writer-studio` / environment `production`, read from
`apps/server/src/db.ts` (`pg` Pool over `DATABASE_URL`). Executed against the
Postgres service's public proxy via `railway run --service Postgres -- node …`
(connection string never printed to the transcript, per the "no raw secret dump"
lesson), in ONE self-verifying transaction that would have rolled back on any
anomaly (none occurred).

**Scope:** Nick's user ONLY — `nickhrtzg@gmail.com` = user id
`281106ae-573a-4064-b32b-f61597800e97`, uniquely identified (exactly one email
match; 12 users total). Content rows only. Left byte-untouched: the `users` account
row, the auth `session` store, the schema, and every one of the other 11 users
(their 15 content rows verified unchanged before→after).

## Deleted — 125 rows across 5 writing-content tables (BEFORE → AFTER)

| Table | Before | After |
|---|---:|---:|
| journal_entries | 92 | 0 |
| projects | 19 | 0 |
| story_plans | 7 | 0 |
| drafts | 3 | 0 |
| drawers | 4 | 0 |
| **total** | **125** | **0** |

`journal_entries` breakdown (before): 61 live / 92 total, 13 boards, 3 scripts,
73 cards, 6 inked pages.

## Preserved by the gate — sessions_log (51 rows)

Nick gated the wipe of `sessions_log` on whether any USER-VISIBLE surface reads it.
Verified NONE does: `getSessions()` (persistence.ts) has zero callers, and the
`store/testament.ts` read-model (`selectTestament`/`computeTestament`) is orphaned —
defined but rendered by no component (the homepage moved off it). The migrate
comment ("no app UI reads these") holds. So all 51 rows (all Nick's own TTFK
telemetry; the other users have none) were PRESERVED for canon-debt item 8's TTFK
analysis. Everything Nick sees or edits is wiped; the invisible telemetry stays.

## Why

The FX14 close condition — clearing the "Untitled detritus the old journal doors
bred," so Nick's clean first-run device sitting starts from an empty account. The
browser localStorage still holds the local mirror + first-run UI state; the keys to
clear for a true first-run walk were listed to Nick separately (CC cleared nothing
client-side).

— recorded by CC on Nick's word, 2026-07-25
