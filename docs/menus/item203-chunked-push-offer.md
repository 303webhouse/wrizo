# Item 203 — a real 413, a chunked push, and a page that cannot travel is named — OFFER (FIX)

**Branch `item203-chunked-push`.** Fable's order: P1 (honour `err.status`), P2 (chunk the push so one fat record
cannot block the rest), P5 (a distinct "too large" state the writer sees); check the proxy limit first; **a single
record still over the limit must never be re-sent forever — it stops, it is named to the writer, and everything else
syncs.** The branch **also contains the 198 refinement** (`item198-db-clock` @ `ad02ff3`, byte-reviewed) merged in,
because Fable said it ships with this — one merge, one deploy. The only conflict was the `res.json` literal in
`/sync` (`serverTime,` from 198 and `pull: wantPull ? {` from here); both are kept.

## 0 · The proxy limit, checked first — and how, safely

`docs/evidence/item203/proxy-probe.mjs` (output beside it): **six sequential, UNAUTHENTICATED POSTs to production
`/api/sync`, ~21 MB in total**, of `{"lastSyncAt":null,"push":{}}` padded with trailing whitespace — no cookie, no
credentials, no user data. **Why that cannot hurt:** `express.json` parses first, then the session middleware runs with
`saveUninitialized: false` and no cookie — **no session read or write, no database access** — then `requireAuth`
answers 401. Nothing is authenticated, nothing is written.

| rung | 1 | 2 | 3 | 4 | 4.9 | 5.25 MiB |
|---|---|---|---|---|---|---|
| answer | 401 | 401 | 401 | 401 | 401 | **500** `{"error":"Internal server error"}` |

**Every rung below 5 MiB got the application's own answer; nothing upstream refused early. Express's 5 MiB is the
effective ceiling** (the edge is `railway-hikari`). A proxy limit *above* 5 MiB is unobservable and irrelevant, because
Express refuses first. **Side result: production returns the bare 500 today at 5.25 MiB — the S0 fault, live.**
*(One host, one afternoon. It says nothing about a different route or a future edge change; the client also learns a
lower limit at runtime — below.)*

## 1 · What changed

| | where | what |
|---|---|---|
| **P1** | `apps/server/src/index.ts` | the final error middleware honoured no status. It now answers **`413 { error: 'payload too large', limitBytes: 5242880 }`** for the body-parser's over-limit error, and a malformed JSON body **400** (any `expose`d 4xx keeps its status); everything else is still a logged 500. The limit is a named constant. |
| **P2 server** | `apps/server/src/sync.ts` | `pull: false` = a push-only request: the upserts run, the six pulls do not. Absent (every existing client) it is exactly what it was. |
| **P2 client** | `store/sync.ts`, `store/api.ts` | dirty records are packed into **~1 MB chunks, smallest first**, each its own request, **cleaned the moment it lands** (progress survives a later failure); **only the last request pulls**, so the cursor moves once; **one chunk = one request carrying the push AND the pull — byte-for-byte the old sync.** `apiSync` now throws a `SyncHttpError` that carries the status. |
| **P5** | `store/sync.ts`, `store/syncNotice.ts`, `ChromeControls.tsx`, lexicon | a record whose own size cannot fit in one request is **never sent**: listed (`getTooLargeRecords`), named by `SyncIndicator`: *"“A heavy ink page” is too large to sync — it is saved on this device"* (several: *"2 pages are too large to sync — they are saved on this device"*). **Not "offline"** — the status ends `synced` when everything that could travel did; "Offline" still wins while the network is genuinely down. |

### The rule for a record that cannot travel
- **It is decided by size, before any upload.** `REQUEST_LIMIT_BYTES` mirrors the server's 5 MiB; a record whose
  bytes + a 1 KiB envelope exceed the effective limit is not packed into any request. **It costs zero bytes, ever.**
- **The list is rebuilt from the dirty set on every sync**, so a page that shrinks — the writer erases strokes — goes out
  **on its own** (K5), and the notice clears. It **clears on logout** (K11) so one account's page names never appear for the next.
- **A limit the client did not predict** (a lower proxy, a lowered server limit) is handled by the 413: a multi-record
  chunk is **halved and retried**; a lone record **lowers an in-memory learned limit to its own size** and is listed. The
  next big record is skipped on what the first taught. **Cost: at most one refused upload per fat record per launch** (the
  lesson is not persisted, so it is re-learned — deliberately, so a raised limit is picked up).
- **Smallest first**, so a small edit is never queued behind a big one.

## 2 · Evidence — `sync-chunked-push-proof.mjs` (`chunked-push-proof.output.txt`)

Browserless. **The real `index.ts`** (its real `express.json` and its real error handler), **the real `/sync` router**,
**the real client `syncOnce` + `apiSync` + persistent dirty set**, driven through the real store; only db/session/env are
stubbed. **27 checks green; 13 mutants — each edit removed ALONE — each red on its own claims** (never on the census
alone, never on a claim that had nothing to do with it):

| claim | proves |
|---|---|
| **K1** the wedge | a tiny page written after a **6 MB** page **reaches the server**; the fat page is **never sent** (max request 226 bytes); it is **named** with its title and size; status ends **synced**; **five more syncs upload nothing fat** (max 51 bytes) |
| **K2** chunking | **12 MB** of pages (30 × 400 KB) all sync in 16 requests, none over ~850 KB, **the six pulls run once, not per chunk** |
| **K3** an unpredicted limit | a proxy that refuses over 1.5 MB costs **exactly one** refused upload; the second big page is skipped; both are named; the next sync sends nothing over the limit |
| **K4** P1 | over-limit ⇒ **413 + `limitBytes: 5242880`**; malformed JSON ⇒ **400** |
| **K5** self-healing | erase the ink ⇒ the next sync sends it and the notice clears |
| **K6** | the ordinary sync is **one request** carrying push and pull, unchanged |
| **K7 / K8** | a dead network is still **offline** (and the fat page is still named); chunks that landed **stay clean** when a later one fails |
| **K9** the backfill | the one-time journal backfill — which re-dirties **every** page — now goes out chunked and ends clean (the third realistic big push in the S0) |
| **K10 / K11** | the writer-facing **words**, read from the shipped lexicon source; logout clears the list |

**Mutants** (each red): the server honouring 413 · malformed → 400 · `pull:false` · chunking · the single-chunk shortcut ·
cleaning as a chunk lands · the pre-check · handling a 413 · learning the limit · remembering a refused lone record ·
the "Offline" wording · clearing on logout · setting the list at all.

**Also re-run on the merged tree:** the 198 instrument (23 checks, 16 mutants red) and the 198 real-Postgres check
(17/17) — so the merge did not disturb the cursor work.

## 3 · What is NOT verified, said plainly
- **`SyncIndicator`'s DOM in a browser.** Its text (K10) and the state it reads (K1, K11) are tested; its mount is not. A
  harness card for it waits on a box turn. The browser suite's sync double answers `/api/sync` with a valid pull or a 503
  (which the client still treats as offline), so it does not depend on the request shape — read, not run.
- **Any host other than production**, and any change to the edge after today.
- **Real pen sample rates** and **Nick's actual heaviest page** (S0 §4) — the sizes here are the S0's stated assumption.
- **The other direction:** a full pull returns every row's full content in one response with no cap. Not touched.
- **A single record over 5 MiB still cannot sync.** By the ruling it is named and safe locally, but it does not reach
  another device until it shrinks. **P3 (a larger `/api/sync` limit) and P4 (rounding stroke coordinates, −44%) are the
  ways to actually carry one; neither is in this build.**
- **The S0 evidence files** (`item203-s0` branch) measure the pre-fix code; see the note there — they now read a pinned
  commit so they stay a true record of the fault instead of going red against the fix.

## 4 · Ship notes
The client and server ship in **one deploy** (the server serves `dist-web`), so there is no client/server skew. An **old
client** (a cached PWA) against the new server behaves as before — it still sends one body and reads any failure as
offline — except it now receives a 413 instead of a 500 for an over-limit push. A **new client** against the harness double
behaves as before. No schema. **Server change first in spirit, but atomic in practice.**
