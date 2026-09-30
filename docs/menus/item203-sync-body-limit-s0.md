# Item 203 — `/sync`'s 5 MB request-body limit — S0 (FIX)

**MEASURED, not fixed.** Fable asked two things: how large is the largest realistic push, and is a refused sync
visible to the writer. **Answers: one dense ink page is most of the limit by itself; and a refused sync is
almost invisible, is mislabelled, and never heals.** Nothing in `apps/` changes on this branch.

Instrument: `docs/evidence/item203/body-limit-proof.mjs` (raw output beside it) — **browserless: one local HTTP
server, no Postgres, no browser.** It runs the **real** `apps/server/src/index.ts` (its real `express.json({ limit:
'5mb' })`, its real final error middleware, the real `/sync` router; only `db`/`session`/`env` are stubbed) and the
**real** client `store/sync.ts` `syncOnce` + `apiSync` fetch + persistent dirty set against it. **10/10.**

## 1 · How big is a push (the measured part, and the assumed part, kept apart)

**Measured** (real JSON serialisation of real-shaped points — a stored point is exactly `InkStratum.tsx`'s
`normPoint`: `x`/`y` **unrounded doubles**, pressure rounded to 3 places):

- **56.3 bytes per stored point** (48.4 with no pressure). **The 5 MiB limit = ~93,000 points in one request.**
- `InkStratum.tsx`'s `onMove` pushes one point per `pointermove`, **no decimation** (read from source): that is
  **~26 minutes of continuous pen contact at 60 Hz, ~13 at 120 Hz.**
- The limit is **exactly 5 MiB of raw body** — the largest accepted body was **5,242,880 bytes**, found by bisection
  on the real server.

**Assumed, not measured** (a script cannot know how a person writes — plug your own):
a full handwritten page = 300 words × 6 strokes × 40 points = **72,000 points = 3.87 MB of ONE record** — **77% of
the limit by itself; two such pages in one push are refused.** A text-only writer is nowhere near it
(300 words ≈ 2 KB; it takes ~2,500 pages).

**Why the push is bigger than the last edit.** `syncOnce` sends **every dirty record whole, in one body.** So the
push is *the sum of all pages not yet synced*, not "what changed": a **long offline stretch** = every ink page
touched since the last successful sync. Read from source, three ways a device gets a fat push:
1. **Heavy ink** on one or a few pages (above).
2. **A long offline stretch** — the sum of every dirty page.
3. **The one-time journal backfill** (`maybeBackfillJournal` → `markAllJournalEntriesDirty`) re-dirties **every**
   local journal page, so *that* sync is the whole journal in one body (e.g. 30 pages × 3,000 points = 5.06 MB).
   *(Also plausible and NOT verified: pages written before the first login, pushed in the first sync.)*

## 2 · What the server does at the limit

- A body **under** the limit is accepted; **over** it is refused, and **nothing of it reaches the database** — the
  whole push is all-or-nothing (measured: upsert count unchanged).
- **The refusal is a bare HTTP `500 {"error":"Internal server error"}` — not a 413.** Express raises
  `PayloadTooLargeError` (status 413) and the server's **final error middleware discards `err.status` and answers
  500 for everything**, logging it as `[server error] request entity too large`. **The status that would tell the
  client what happened is thrown away one layer up.**

## 3 · What the writer sees, and what the client does (the real `syncOnce`)

- The client treats **any** failure as **offline**: status → `'offline'`, and `SyncIndicator` (`ChromeControls.tsx`)
  renders the muted text **"Offline — saved here"** — **while the writer is online.** That is the *only* signal.
  It says nothing about other devices, and nothing that it will not clear.
- **The fat record stays dirty** (persistent dirty set, item 89) and is **re-sent in full on every retry.** Measured:
  6 attempts = **36 MB uploaded, 0 succeeded**; the backoff (5s → 10 → 20 → 40 → 80 → **120s cap**) never stops.
  **At the cap: 30 attempts/hour × 6 MB ≈ 180 MB/hour of upload that can never succeed** — real money on mobile data.
- **Head-of-line blocking.** A tiny, unrelated page written **after** the fat one is pushed in the **same body** and
  refused with it. **One fat record wedges every other edit on the device — and every other device never sees any of
  it.** Measured.
- **A soft delete does not unblock it** (measured): the row and its strokes are still pushed whole.
- **No way out for the writer.** Nothing names the page, nothing offers to shrink it, and the only recovery is not a
  product feature.

## 4 · Not measured, said plainly

- **A proxy limit upstream of this server.** Railway's edge could refuse a large body **before** Express does, with a
  different status and no log line here. I cannot reach production; this is the first thing to check before trusting
  "5 MB" as the real ceiling.
- **The size of anyone's real data.** The 3.87 MB page is an assumption stated openly; Nick's actual heaviest ink
  page is one query away and would replace it with a fact.
- **The other direction.** A **full pull** returns every row's full content in one JSON response, with no size cap
  anywhere. A writer with many ink pages has an unbounded pull. Neighbouring risk; not measured here.
- **Anon-then-login pages** (above) and **the journal backfill's real size** are read from source, not run.
- **Real hardware sample rates.** 60 / 120 Hz are the pointer-event rates I assumed; a tablet may differ.

## 5 · The smallest fixes, ranked (none built; no schema, so no word from Nick is needed)

| # | fix | size | what it buys |
|---|---|---|---|
| **P1** | the final error middleware honours `err.status` and answers `413 { error: 'payload too large', limitBytes }` | **~2 lines, server** | the client can finally *tell* a too-big push from an outage; a precondition for P5 |
| **P2** | **chunk the push by bytes** (target ≤ ~1 MB per request, always ≥ 1 record even if fat), `markClean` after each success | client `syncOnce`; the intermediate requests want a "push only, no pull" flag so the cursor moves once | **ends head-of-line blocking:** only a record that is *itself* over the limit is stuck; every other edit syncs. **This is the fix that matters.** |
| **P3** | a larger limit for `/api/sync` only (e.g. 25 MB), keeping 5 MB elsewhere | 1 line, server | moves the cliff; **check the proxy first (§4)** and remember `express.json` buffers the whole body in memory |
| **P4** | round stroke coordinates at capture: **hypothetically 31.7 bytes/point vs 56.3 — 44% smaller** (4 decimals ≈ 0.12 px) | INK lane (product code) | halves *new* ink; **does nothing for strokes already stored**; a fidelity call that is INK's and Nick's |
| **P5** | a distinct sync status for "refused as too large": *"One page is too large to sync — it's saved here"*, naming the page | client + lexicon | makes the failure **honest and actionable** instead of "Offline" |

**Recommendation:** P1 + P2 first (small, no product decision, and P2 removes the wedge for everyone but a
single >limit record); P5 with them, since P1 makes it possible. P3 only after the proxy is checked. P4 is INK's to
weigh. **A single record larger than the limit** still has no answer under P2 alone — P3 or P4, or a per-record
warning, decides it.

## 6 · What I would build first, if asked

**P1 + P2 as one item** (`item203`), on a branch, with the two-device double: the instrument above is already the
red — a fat page plus a tiny page, where today the tiny page never syncs — and it goes green when the tiny page
reaches the server while the fat one waits. **I have not started it.**
