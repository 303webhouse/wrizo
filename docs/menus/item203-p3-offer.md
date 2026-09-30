# Item 203 — P3: a single record over 5 MiB can finally carry — OFFER (FIX)

**Branch `item203-ceiling`** (built on `item203-chunked-push` @ `47c082a`, so it **contains the whole of 203** plus this; merge it
*instead of* the earlier branch, or after it). Fable's order: choose **P3 or P4**, whichever carries a single record over 5 MiB
with the least risk — **measuring the proxy's real ceiling above 5 MiB first, with the same safe probe.**

## 1 · The proxy's real ceiling, measured

`docs/evidence/item203/proxy-ceiling-probe.mjs` (output beside it). **Four sequential, UNAUTHENTICATED POSTs to production
`/api/sync`: 8, 16, 32, 64 MiB** of `{"lastSyncAt":null,"push":{}}` padded with whitespace — no cookie, no user data.
**Safe for the same reason as the last probe, and cheaper:** above 5 MiB Express compares `Content-Length` to its limit and
refuses *before* it reads the body, before the session middleware, before the database. **The cost is bandwidth only** (~120 MB
in total), so the ladder is short and stops at the first rung that is not the application's own answer.

| rung | 8 | 16 | 32 | 64 MiB |
|---|---|---|---|---|
| answer | **500** `{"error":"Internal server error"}` | 500 | 500 | 500 (2.1 s) |

**The edge carried a 64 MiB body all the way to Express on every rung.** **No ceiling was observed at or below 64 MiB; Express's own
`express.json` limit is the only ceiling in play** — which is what makes raising it worthwhile. *(One host, one afternoon; not a
statement about a different route or a later change to the edge. The client also learns a lower limit at runtime.)*

## 2 · P3 or P4 — and why P3, scoped

- **P4 (round stroke coordinates, −44%)** halves *new* ink and **does nothing for a record already stored** — it cannot carry
  the single record that is over the limit today. It is also a fidelity call inside INK's code. It stays a *good idea for growth
  rate*, not a way to carry what is stuck now.
- **P3 (raise `/api/sync`'s limit)** carries it — and the measurement above says the **edge** will not stop it. The risk is
  **server memory**, so I measured that too.

**The cost of a big body, measured** (`parse-cost-probe.mjs`, the real `express.json`, real-shaped ink JSON, peak RSS from the OS's
own counter — a sampler is starved by a synchronous `JSON.parse`):

| body | server peak growth | × body |
|---|---|---|
| 5 MiB | 38 MiB | 7.3× |
| 10 MiB | 74 MiB | 7.1× |
| 25 MiB | 195 MiB | 7.5× |
| 50 MiB | 351 MiB | 6.8× |

**About 7× the body, flat with size** — the buffer, the parsed tree, and the handler's `JSON.stringify` of `strokes` for the
database parameter. Production's container memory is **unknown to me**, so I chose the **smallest limit that carries a real
page with headroom**, not the largest the edge allows.

## 3 · What is built

| | where | what |
|---|---|---|
| **P3 server** | `apps/server/src/index.ts` | **`/api/sync` alone** reads up to **16 MiB** (`SYNC_BODY_LIMIT`, ≈ 298,000 points ≈ 41 min of continuous pen at 120 Hz; ≈ **117 MiB** peak for the *one* request). **Every other route keeps 5 MiB, before auth, as ever.** |
| **auth first** | same | the sync parser is mounted **after `requireAuth`**: `app.use('/api/sync', requireAuth, express.json({ limit }))`. **An anonymous request is answered 401 without the server buffering a byte.** *(Before this, any anonymous POST made the server buffer and parse up to 5 MiB before refusing it — a small DoS surface the probe itself relied on. The larger limit would have made it 3× bigger; it is now smaller than before.)* |
| 413 body | same | `limitBytes` is **the limit that applied to that request** (16 MiB for `/api/sync`, 5 MiB elsewhere) |
| **P3 client** | `store/sync.ts` | `REQUEST_LIMIT_BYTES` mirrors it: 16 MiB. A lone record ≤ 16 MiB − envelope is sent (alone: it is over the 1 MB chunk target); over it is still named and never sent, as ruled |

## 4 · Evidence — `sync-chunked-push-proof.mjs` (`chunked-push-proof.output.txt`)

**31 checks green; 17 mutants, each edit removed ALONE, each red on its own claims.** New for P3, each with its mutant:
- **K12** a lone **6 MB** record — over the old 5 MiB, under the new — **now reaches the server**, isn't listed as too large, and the device
  ends clean. *Red when the server limit is not raised, and red when the client keeps mirroring 5 MiB.*
- **K13** an **anonymous** request is **401 at every size — 1 KB, 6 MB, and 17 MB** (over the sync limit, where the body-first order would
  have said 413). *Red when the parser is moved before `requireAuth`.*
- **K4c** every **other** route still refuses over 5 MiB and its 413 says **5,242,880**. *Red when the larger limit is applied to every route.*
- **N5** the client's mirror equals the server's limit (a mirror that drifts sends bodies the server refuses, or hides ones it would take).
- The never-sent cases (K1, K7, K11) now use a **20 MB** record, because 6 MB is no longer too large — **which is the point.**
The 198 instrument is still green on this tree (23 checks).

## 5 · What is NOT verified, and the risks I am carrying
- **Production container memory.** 16 MiB is ~117 MiB for one request; **two concurrent big syncs from one writer's two devices is ~235 MiB.**
  If the container is small this could hurt; the client only sends a body that large for a *lone fat record*, which is rare, and the limit
  is one line to lower. **I would want Nick or Fable to say what Railway gives the service before this deploys.**
- **A record over 16 MiB** is still named and never sent (≈ 41+ min of continuous pen contact at 120 Hz). **P4 is what slows the growth toward it.**
- **The full-pull response is still uncapped** (S0 §4): a 16 MiB record is now *stored*, so a fresh device's full pull returns it — in one
  JSON response, in one piece. **Measured (§6): it works, it is ~16 MiB, it took 0.43 s** — not small, not broken. Still uncapped.
- **Old clients** keep mirroring 5 MiB and simply never send a record over it — unchanged behaviour, not a regression.
- **The probes stop being a probe of the sync route's body handling**: after this deploys an anonymous `/api/sync` request is 401 at every size,
  so the ceiling ladder would read 401 (it now accepts that as "the application's answer"). Its result stands as the pre-P3 measurement.

## 6 · Fable's condition (b) — a 16 MiB jsonb parameter on a REAL Postgres (done)

`docs/evidence/item203/real-postgres-16mib.mjs` (output beside it): the **real** `migrate.ts` and `sync.ts` on **PostgreSQL 18.4**, driven with a
request body of **15.996 MiB** (287,722 real-shaped points — its per-point size *measured for those very points*, after my first sizing used the
average and built a 16.56 MiB body that the check itself refused). **6/6:**

| step | result |
|---|---|
| the real ordinary upsert takes the ~16 MiB `jsonb` parameter | **accepted**, nothing swallowed; **2.2–2.5 s** |
| stored faithfully | **all 287,722 points**; 17.6 MiB as `jsonb` text, **7.8 MiB on disk** (TOAST-compressed) |
| the real pull returns it through the real mapper | every point intact; a fresh device's **full-pull response is 16.00 MiB, in one piece, 0.43 s** |
| an UPDATE of the same row (the on-conflict path) | goes through; the stored count follows (2.2 s) |
| the Node process | peak RSS 148 → 222 MiB after the upsert, 317 MiB over the run — **an upper bound for the handler's own share**, since the same process built the 16 MiB body |

**What this does not settle:** Postgres's own memory for the parameter (the embedded server's process was not instrumented), and **whether the
production service has the ~117–235 MiB to spare — condition (a), which is Nick's answer, not a measurement I can make.**

## 7 · The two follow-ups Fable asked for, on this same branch (Batch Seven carries them)

- **The notice's replacer function.** `syncNoticeText` spliced the title in with `String.replace(pattern, <string>)`, and a replacement
  STRING gives `$&`, `$1`, `$'` and `$$` special meaning — so a page the writer called *"Q&A $& notes"* would have come out mangled, with
  the template's own `{title}` spliced into it. Both substitutions are now replacer *functions* (`() => title`), whose return value is taken
  literally. **K10d** feeds it `Q&A $& $1 $' $$ {n} {title}` and requires it back verbatim; **the mutant that restores the string form goes red on K10d alone.**
- **The noun-neutral plural.** What cannot travel is any synced record — a page, a project, a drawer — so *"2 pages are too large…"* would
  sometimes lie. The lexicon default is now **"{n} items are too large to sync — they are saved on this device"**; the singular already
  names the record by its own title. **K10b** pins the words; **the mutant that restores "pages" goes red on K10b alone.**

Instrument now: **32 checks green; 19 mutants**, each edit removed alone, each red on its own claims.
