# Item 198 — the server-assigned sync cursor — OFFER (FIX)

**Branch `item198-synced-at`.** Nick's word, verbatim, to "may FIX change the database to fix the sync
bug?": **"Yes."** This builds the shape S0 proposed (`docs/menus/item198-sync-cursor-s0.md`). Server-only:
`apps/server/src/sync.ts` and `apps/server/src/migrate.ts`. **No client change, no `$N` added to any
upsert.** Not merged, not deployed.

## What changed

| edit | where | what |
|---|---|---|
| **E1 column** | `migrate.ts` | `alter table <t> add column if not exists synced_at timestamptz not null default now()` and `create index if not exists <t>_user_synced on <t> (user_id, synced_at)` for all six sync tables, in the same idempotent boot path as every add above it |
| **E2 stamp** | `sync.ts`, six upserts | `synced_at = now()` appended to each `on conflict … do update set`, **inside** the existing `where … excluded.updated_at > …` guard, so only an ACCEPTED write moves it |
| **E3 filter** | `sync.ts` `pull()` | filters on `synced_at` instead of `updated_at` |
| **E4 overlap** | `sync.ts` `pull()` | `synced_at > $2 − 10s`, the 10s passed as the pull's own `$3` |

`updated_at` is untouched: it stays the last-writer-wins key. **The stamp is never a parameter and never
from a client** — it is not in any insert column list (the column default covers an insert) and is set only
by `now()` in SQL. So the upserts' column, placeholder and parameter counts are exactly what they were, and
this cannot collide with `page_links` or `beside_links`'s `$N` renumbering. (The pull gains its own `$3`;
that is a different statement.)

## The in-flight window, named (Fable's item 3)

`now()` is the **start of the writing transaction**. A write whose transaction starts before a pull and
**commits after** it is invisible to that pull's snapshot yet carries a stamp **older than the cursor** the
response hands back — a plain `synced_at > cursor` would miss it for good.

- **How wide:** exactly *(commit − stamp)*. Each upsert is one statement in its own implicit transaction,
  so it is that statement's run time (a lock wait on the same row counts; waiting for a pooled connection
  does not — that happens before the statement starts), **plus** any skew between this process's clock
  (which makes the cursor) and Postgres's (which makes the stamp).
- **How closed:** the pull reaches back **10 seconds** (`PULL_OVERLAP_MS = 10_000`). A write that commits
  within 10s of its own stamp is always caught by the next pull.
- **Why 10s:** a single-row upsert runs in milliseconds; the realistic worst cases are a same-row lock
  wait or a large `strokes`/`boxes` jsonb, which is seconds, and NTP-synced hosts skew by well under one.
  10s is a generous multiple, not a measured maximum — **there is no statement timeout on the pool**, so it
  is a bound, not a guarantee. **Measured:** a write stamped 11s before the cursor slips past it (C6), and a
  full pull still recovers it.
- **Why it is cheap:** the client skips any record not newer than the one it holds and keeps its own
  unsynced edits (`applyCollection`), so the price is a few re-sent rows per pull — only those written in the
  last 10s. **Measured** (C7): an idle second sync re-sent exactly the 1 row written <10s ago; the store was
  byte-identical after.

## The one-time cost — and the cure

`add column … default now()` gives every EXISTING row the one moment the statement first ran (`now()` is
evaluated once per statement), which is newer than every device's cursor. So **each device's next pull
returns everything once — a full pull, one download.** That is also what **heals the rows this fault has
already stranded**. Measured on a populated real Postgres: the row the old server never returned to a
5-minute-old cursor was returned by the very next pull with that same cursor. Later boots find the column
and change nothing (a second boot left every `synced_at` unchanged).

## Evidence (`docs/evidence/item198/`)

1. **`sync-incremental-pull-proof.mjs --mutants`** (`instrument-mutants.output.txt`) — browserless: the real
   router, two real client stores, a fake pool that interprets the SQL **from its own text** and learns which
   tables have the column **from `migrate.ts`'s own alters**. Time passes on one clock that only moves forward;
   nothing is back-dated.
   - **Baseline GREEN, 21 checks:** **K1 on all six collections** (an edit stamped before B's last sync and
     pushed after it reaches B's next incremental pull), **K2** (B edits on top of what it holds and A's words
     survive), **K3** (a write in flight across another device's pull is still delivered), 7 controls, 6 census.
   - **Every server edit, removed alone, turns a dynamic claim red — 15 of 15 mutants:**
     the pull filter back to `updated_at` (**= the S0 fault: K1 ×6 and K2 red**) · the overlap (**K3**) ·
     each of the six upserts' `synced_at = now()` (**that table's K1 only**) · each of the six tables'
     column add (**every K**, with the throw naming the missing relation — `/sync` pulls all six) · the server
     stamp replaced by the client's (**K1[journal], K2**).
   - **Two things the instrument taught me:** at millisecond gaps the 10s overlap MASKS the original fault
     (the first version of this file had every mutant red only on the static census, not K1/K2), so the
     scenarios now let five minutes of offline time pass; and a mutant that turned red only on a source-text
     check was not counted as proof.
2. **`real-postgres-check.mjs`** (`real-postgres-check.output.txt`) — **the SQL on a real Postgres 18.4**
   (the `embedded-postgres` binary wrizo-read carries; the file states the dependency), running the REAL
   `migrate.ts` and `sync.ts`, with the pre-198 server from `git show origin/main:` for the control:
   the old server **reproduces the fault on real SQL**; the new migration runs on a **populated** DB (column
   `NOT NULL default now()` and six indexes on all six tables; every existing row newer than the old cursor;
   **heals**; **idempotent**); all six upserts execute with nothing swallowed; K1 on all six collections;
   a pushed record carrying its own `syncedAt`/`synced_at` is **ignored**; an accepted update moves the stamp
   and a rejected older one does not; and **the in-flight case on a real transaction** — `now()` is the
   transaction start, B's pull misses the uncommitted write, the overlap catches it after the commit, and
   **without the overlap the same pull misses it.** **15/15.**

## What is NOT done, and what I did not check

- **No production run.** Postgres 18.4 here; **I do not know the production version.** Nothing in the SQL is
  version-specific (a constant-`now()` default add, a plain index, an `interval` multiply), but the first real
  proof is the deploy's own boot. Railway boot runs the ALTERs and index creates on the live tables; the
  `create index` is not `concurrently`, so it briefly blocks writes to each table — negligible at this scale.
- **The one-time full pull on every device is real bandwidth** (every `strokes`/`boxes`/`script` jsonb, once,
  per device). I did not measure a production-sized payload.
- **Concurrent edits inside one sync interval are still last-writer-wins.** `/sync` pushes before it pulls;
  a B edit made before B's next tick still overwrites A's. That is LWW by design and is not this fault.
  **Client clock skew** still decides LWW. Both untouched.
- **The client is unchanged**, so the cursor is still the app server's `serverTime`, while the stamp is
  Postgres's clock. The 10s overlap absorbs skew up to 10s; beyond that it does not (C6). I chose this over
  fetching the cursor from Postgres (an extra query per sync) because the overlap already bounds the same
  risk; **a Postgres-side cursor would remove skew from the premise entirely** — say if you want it.
- **The five non-journal tables are exercised dynamically through real client stores** (create + edit +
  read), but only `journal_entries` has the K2 (overwrite) and K3 (in-flight) scenarios; the other five share
  the one `pull()` and the same on-conflict pattern, and the real-Postgres run covers all six upserts and all
  six K1s.

## Cross-lane, for chat 1

- **TOOLS' `beside-roundtrip-proof.mjs`** (on `item144-board-tabs`) checks that every on-conflict clause sets
  a column from its own `excluded` value (`PAIRING: conflict clause "…" does not set a column from its own
  excluded value`). **`synced_at = now()` will trip that check when the two merge** — it needs a one-line
  allowance for `now()`. Its fake pull also filters on `updated_at`, so after the merge it would keep passing
  while modelling the OLD cursor; it should filter on `synced_at` like this instrument's pool does.
- **144's server half edits the same journal upsert.** No `$N` renumber (this adds no column to the insert
  list), but the on-conflict set list is the same hunk: expect a textual conflict; keep both lines.

## The question this leaves for Nick

None new — the column was his "Yes." **One thing worth his eye at deploy:** the first boot after this ships
makes every device do one full pull. Ship it when he is content with that once.
