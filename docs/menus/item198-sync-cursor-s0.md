# Item 198 — /sync's incremental pull misses edits — S0 (FIX)

> **UPDATE 2026-09-24 — BUILT, on Nick's "Yes" to the column:** see `docs/menus/item198-synced-at-offer.md`.
> The instrument this document describes was rewritten: the `--semantics server-cursor` mode (a *model* of the
> fix at the pool) is gone, replaced by a pool that interprets the REAL SQL from its own text, with a
> forward-moving clock, K1 on all six collections, K2, K3 and 15 mutants. The S0 numbers below are the
> measurement as it stood, and the original fault is still reproduced by the "pull filters on `updated_at`" mutant.

**Status: MEASURED, not fixed.** The fault is real, reproduced without forging a clock, and it is
worse than the report said (the overwrite destroys the edit on BOTH devices). The smallest fix
that actually closes it **needs a column** — so, per the brief, this **stops here for Nick.**
Nothing under `apps/server` or `apps/desktop/src` is changed by this branch.

Instrument: `apps/desktop/scripts/sync-incremental-pull-proof.mjs` (browserless — no box turn, no
browser, no Postgres). Run: `node apps/desktop/scripts/sync-incremental-pull-proof.mjs`.
Built on TOOLS' `beside-roundtrip-proof.mjs` machinery: the REAL `apps/server/src/sync.ts` router
bundled with esbuild, two REAL client stores (`persistence.ts`), each with its own localStorage,
driven through the real `getDirtyRecords` / `applyRemoteRecords` / `markClean`. Only the pool and
auth are faked; the pool applies the pull's `updated_at > $2` filter as SQL does.

## 1 · The mechanism (two clocks)

| | value | clock |
|---|---|---|
| the client's cursor `lastSyncAt` | `resp.serverTime` from its previous `/sync` (`store/sync.ts`, `setLastSyncAt(resp.serverTime)`) | **the SERVER's** |
| the column the pull filters on | `updated_at` (`apps/server/src/sync.ts` `pull()`: `updated_at > $2`) | **the CLIENT's** — stamped by `new Date()` in the store when the writer edits, stored verbatim by the upsert |

A row becomes visible to another device's incremental pull only if its **client stamp** is later
than that device's last **server** sync time. An edit made *before* the other device's last sync
and pushed *after* it — the ordinary offline-edit / between-ticks shape — is on the server and is
never returned. `updated_at` is also the last-writer-wins key, so it cannot simply be repurposed.

## 2 · Measured (no clock is forged; the fault falls out of ORDER alone)

Order: A edits and does not sync → B syncs → A syncs → B syncs (incremental).

| check | result |
|---|---|
| **K1** B's next incremental pull receives A's edit | **RED.** Server holds `"A OFFLINE EDIT"`; B still reads `"v0"`. Edit stamped `…45.881Z`, B's cursor `…45.897Z` (both real). |
| **K2** B then edits (on top of what it holds); A's words survive somewhere | **RED — and worse than reported.** Server, **A** and **B** all end `"v0 + B EDIT"`. A's edit is gone from **both devices and the server**; A's own local copy is overwritten by B's version on the next pull. |
| **C1** A syncs promptly → B's incremental pull gets it | PASS (the instrument can see a healthy incremental pull) |
| **C2** the edit stamp really is < B's cursor | PASS (the ORDER was reproduced, not a forged clock) |
| **C3** a FULL pull recovers the edit | PASS (it is on the server; only the incremental filter withheld it) |
| **C4** LWW holds exactly what B wrote | PASS (so the loss is the cursor, not a broken LWW guard) |

**The instrument can go green** — proven, not assumed: `--semantics server-cursor --expect fixed`
models "the pool stamps a server-assigned `synced_at` on every accepted write and the pull filters
on it" and K1/K2 flip GREEN with C1–C4 unchanged. (That mode models the *semantics* at the pool; it
tests no SQL. Its only job is to show the claim checks are not stuck-red.)

**"Every collection" — asserted from source, exercised dynamically for one.** The census (N1)
reads `sync.ts`: all six collections (projects, story_plans, sessions_log, drafts, drawers,
journal_entries) go through the ONE `pull()` and its ONE filter (`filterSites: 1`). Only
`journal_entries` is *run* (it is the only table the fake pool models); the other five share the
function, not a re-measurement.

## 3 · Where a full pull happens today (N3, from the source)

**Exactly one place:** `store/sync.ts` `startSync()` → `await syncOnce(true)`, called from
`App.tsx` on `apiMe()` success (app load) and on `handleAuthed` (login). The 20s timer, `online`
and tab-visible are all incremental. `clearLastSyncAt()` (logout) only clears the cursor.
So a missed edit heals at the receiving device's **next app launch or login** — and **never** on a
device left open (a desktop app or PWA tab open for days).

## 4 · What the smallest real fix is, and why it needs a column

**Proposed shape (NOT built — this is the shape for Nick):** a server-assigned sync cursor.

- **Column, ×6:** `alter table <t> add column if not exists synced_at timestamptz not null default now()`
  on projects, story_plans, sessions_log, drafts, drawers, journal_entries — the boot-time
  idempotent-add pattern `migrate.ts` already uses (`drawers`/`journal_entries` are created there;
  the other four in `001_init.sql`). Plus `create index if not exists <t>_user_synced on <t> (user_id, synced_at)`
  ×6 (all six already carry the analogous `(user_id, updated_at)` index — the new one joins it, and the old one stays for anything else that reads by `updated_at`).
- **Write:** each of the six upserts adds `synced_at = now()` to its `on conflict … do update set`
  — *inside* the existing last-writer-wins guard, so only ACCEPTED writes bump it. The insert
  column list is unchanged (the default covers a new row).
- **Read:** `pull()` filters `synced_at > $2` instead of `updated_at > $2` (one line, all six).
- **Client:** no change. The cursor stays the opaque `serverTime` string, and it is now the same
  clock as the filtered column.
- **Backfill is free, and it heals:** `default now()` stamps every existing row with boot time, so
  every device's next incremental pull re-receives everything once (idempotent through
  `applyRemoteRecords` + LWW) — which also **recovers rows currently stranded by this fault**. The
  cost is one full-size download per device, once.
- **Residual, stated:** a row committed by a concurrent request after this request's snapshot but
  stamped before its `serverTime` would be missed. `serverTime` is evaluated first in the response
  literal (before the pulls await), which helps; a small overlap (`synced_at > $2 - interval '5 seconds'`)
  closes it, at the price of a few duplicate rows (idempotent). Argued, not measured.

**Why it cannot be done without a column (each alternative, and where it stops):**

| alternative | verdict |
|---|---|
| overlap window on the client cursor (`lastSyncAt − Δ`) | Fixes only clock skew smaller than Δ. An offline edit of any age is still missed. **Argued, not measured.** |
| periodic full pull (every N syncs) | Bounds how long an edit stays hidden; does **not** remove the overwrite (an edit inside the window still loses), and re-downloads every `strokes`/`boxes` jsonb each time. |
| compare-and-swap push (`baseUpdatedAt`) | Removes the silent overwrite, but needs a conflict UX (what does the writer see when a push is refused?) — a product design, not a fix, and it still leaves K1. |
| Postgres `xmin` as a cursor | No new column, but wraparound/vacuum-freeze semantics make it a trap. **Not recommended.** |

## 5 · What this fix would NOT do (so nobody claims more)

- **Concurrent edits inside one sync interval** are still last-writer-wins by design; the cursor fix
  makes B *see* A's edit at its next tick, not before B has already edited. `/sync` pushes B's dirty
  rows **before** it pulls, so a B edit made before B's next tick still overwrites A's — that is LWW,
  not this fault.
- **Client clock skew** still decides LWW (a fast clock always wins). Untouched.
- **Merge collision:** 144's `beside_links` (branch `item144-board-tabs`) also edits the journal
  upsert. This fix adds one `set` clause and no insert column, so there is no `$N` renumber —
  a textual conflict at most.

## 6 · The question for Nick

**May a `synced_at` column go on the six sync tables?** It is a schema batch — the same kind of
decision as 136's `title` and 172's board type, and it can ride the same wave. If yes, FIX builds
it (server-only; the instrument's `--semantics` mode becomes the real green target, and a
SQL-level check joins it). If no, the honest options are the weaker rows of the table in §4, and
the fault stays open for any long-lived device.

*Nothing was deployed, merged, or written to any server. The instrument ran against the real
router with a fake pool only.*
