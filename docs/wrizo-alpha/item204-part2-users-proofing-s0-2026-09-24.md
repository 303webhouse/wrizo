# ITEM 204 PART 2 · S0 — THE `users.proofing` SHAPE REPORT
### PW build lane · 2026-09-24 · **HARD STOP** — Fable's review before anything is built

**READ FROM THE DOCUMENTS ON MAIN, NOT THE RELAY:** PLAN DESK's
`docs/menus/item204-part2-writer-facing-design.md` and TUTOR's
`docs/menus/tutor/item204-part2-build-brief-engine.md` (both on `origin/main`; the design's branch
`plan-204-proofing` @ `3f40677` confirmed an ancestor of main, TUTOR's `item204-part2-brief` @ `365a922`
likewise).

**NICK'S SCHEMA WORD IS "1. Yes"** — option (1), **ONE nullable jsonb column `users.proofing`**.

**NOTHING IS BUILT. No file outside `docs/` is touched by this report.**

---

## 1 · THE PRECEDENT, MEASURED ON DISK

The design names `users.page_defaults`' recipe (`migrate.ts:169`). I read all four of its parts rather
than trusting the citation:

| part | site | what it actually does |
|---|---|---|
| the column | `apps/server/src/migrate.ts:169` | `alter table users add column if not exists page_defaults jsonb` — additive, nullable, no default, no backfill |
| the read | `apps/server/src/sync.ts:363` | `GET /page-defaults` → `{ pageDefaults: rows[0]?.page_defaults ?? null }` |
| the write | `apps/server/src/sync.ts:369` | `PUT /page-defaults` → `update users set page_defaults = $2::jsonb` — **the whole blob, overwritten** |
| the client | `apps/desktop/src/store/pageDefaults.ts` | a `localStorage` mirror (`writer-studio-page-defaults`) + fire-and-forget PUT + a boot pull |

**Two properties of that recipe matter here, and neither is a defect in it:**

- **IT IS DELIBERATELY OUTSIDE `/sync`.** `sync.ts:352` says why, in its own words: `page_defaults` is
  *"one singleton value on the user row with no id and no clock of its own — forcing it into that shape
  would mean inventing a record type and a timestamp for a field the writer edits from one place."*
- **THE PUT IS A WHOLE-BLOB OVERWRITE WITH NO CLOCK AND NO CONFLICT CHECK.** Correct for a field
  written by one deliberate act ("set as my defaults"), from one place.

---

## 2 · ⛔ THE FINDING: THE RECIPE, COPIED VERBATIM, WOULD LOSE WORDS

`proofing` is **not** "a field the writer edits from one place." Its `words` map is edited from **every
device**, and the design states the requirement outright: *"two devices editing a set offline must
converge, and last-writer-wins on a bare list LOSES words."*

**(a) THE BOOT PULL IS A REPLACE, NOT A MERGE.** `pageDefaults.ts:113`, inside
`hydrateUserPageDefaults` (line 107) — `if (server) { defaults = server; writeLocal(server); notify(); }`.
It **overwrites the local copy wholesale**.
Copied as-is, every boot where the server's copy is older than the device's would **destroy words the
writer added on that device and had not yet pushed.** This is the single most dangerous line to copy,
and its own comment explains why it is right *for defaults* ("a null server value never erases a local
default") — a guard against the null case, not against a stale non-null one.

**(b) THE PUT HAS NO CLOCK, SO THE TRANSPORT IS STILL WHOLE-BLOB LAST-WRITE-WINS.** The design's
per-key merge (an LWW-element-set over `words`, stamped `addedAt`/`removedAt`) is **necessary and not
sufficient by itself**: a word added on device B *between* device A's GET and A's PUT is absent from A's
merge and is overwritten by it.

**(c) BUT IT IS NOT PERMANENT LOSS, AND THAT IS THE THING WORTH GETTING RIGHT.** Because each device
**retains its own additions locally**, B's next GET-merge-PUT re-contributes the word. The set converges
**as long as the adding device still holds its local copy.** So the honest statement is:

> **Eventual convergence holds. The window is not "a word is lost" but "a word is missing from other
> devices until the device that added it syncs again." A word is lost permanently only if that device
> loses its local copy before a successful merge** (reinstall, cleared storage, `resetLocalData` on
> logout — which, measured at `persistence.ts:3007`: it clears every collection in `KEYS`, their dirty
> sets and the dirty journal, so whether a `proofing` mirror falls inside that sweep is a DECISION
> nobody has made yet, not a given).

---

## 3 · THE OPTIONS, WITH MY LEAN AND ITS OWN UNMEASURED RISK

| option | what changes | verdict |
|---|---|---|
| **(A) the `page_defaults` recipe + a per-key merge on BOTH sides of the boundary — MY LEAN** | one column, `GET`/`PUT` as they are; the client merges on **hydrate** (not replace) and again before each push | **smallest honest change that meets the requirement.** No new contract, no server-side shape knowledge. Convergence is eventual, per §2(c) |
| (B) a server-side MERGE in the PUT | the server unions `words` by per-key stamp | convergence regardless of interleaving — **but the server would then know the shape**, and `sync.ts:369`'s own comment says it deliberately *"does not re-validate a shape the client owns."* A merge is not validation, but it is the same boundary |
| (C) a version/ETag with compare-and-set, client retries | a new element in the contract | correct and the most machinery; buys only the narrow window (A) already recovers from |

**THE UNMEASURED RISK SITS ON MY OWN OPTION, and it is (c) above:** I have **not measured** how often a
device loses local storage between adding a word and syncing, and there is **no instrumentation that
could tell me** — the same honest gap item 138's resize-vs-move frequency hit. If that turns out to be
common, (A) leaks words quietly and (B) is the answer. **I recommend (A) and would not argue that (B) is
wrong — only that it buys a narrower case than it costs.**

---

## 4 · THE SHAPE, AS I WOULD BUILD IT UNDER (A)

```
users.proofing jsonb, nullable, no default, no backfill        -- migrate.ts, one line
{
  dialect: 'en-US' | 'en-GB' | 'en-AU' | 'en-CA' | 'en-IN',    -- §3 of the design; default American
  words:   { "<lower-cased word>": { display: string, addedAt: string, removedAt?: string } },
  ignored: string,                                              -- harper's export, OPAQUE
  engine:  string,                                              -- the version that wrote `ignored`
}
```

**⚠ CORRECTED 2026-09-24, AFTER APPROVAL — the fifth dialect is INDIAN, not New Zealand.** The
design's §3 names harper's five as *American, British, Australian, Canadian, Indian*; my first draft of
this block wrote `en-NZ` from memory instead of reading the line. The shape was approved with my error
in it, so the correction is recorded here rather than made quietly — and the build uses the five the
design actually names. *A shape report that paraphrases the document it is reporting on is the same
fault as a comment written from a restart note.*

**Five shape notes, each with its reason:**

1. **`words` is keyed lower-cased with the writer's own casing as `display`** — the design says matching
   is case-insensitive and the writer's casing is kept. Two facts, so two fields; deriving one from the
   other would lose the casing on the first match.
2. **A removed word keeps a `removedAt` TOMBSTONE** rather than being deleted — that is what makes the
   merge an LWW-element-**set** rather than a losing union.
3. **⚠ THE TOMBSTONES GROW WITHOUT BOUND, AND NOTHING IN THE DESIGN CAPS THEM.** `ignored` is capped
   (proposed 500, marked UNMEASURED); `words` is not. A writer who adds and removes freely accumulates
   entries that never leave. **A cap or a compaction rule is owed** — my lean is compaction on write
   (drop tombstones older than some age), because a cap on a *set* silently loses the oldest words,
   while a tombstone's whole job is to expire. **Raised as an open question, not decided.**
4. **`ignored` is opaque and versioned together** — `engine` exists so a future engine that cannot
   import the blob can drop and rebuild it. The design's own words: *"an ignore is a convenience, never
   data."* So `ignored` must never be merged per-key; it is last-writer-wins whole, and that is correct.
5. **`dialect` is a single scalar, last-writer-wins** — no merge, and no per-device variation. A writer
   has one dialect.

**And it is NOT `/sync`.** `proofing` has no id and no clock, exactly like `page_defaults`; forcing it
into `/sync` would mean inventing a record type, which is the thing `sync.ts:352` already refused for
the same reason. **The per-key stamps inside `words` are not a record clock** — they are the merge's
own data.

---

## 5 · THE INTERIM SEAM, AND THE ONE THING IT MUST GET RIGHT

The design's interim (so nothing waits on the schema) is a per-device store behind **one
`proofingStore` interface**, switching to the column when it lands. That is right, and the migration is
a **union** so no writer loses words to the switch.

**⛔ The interface must NOT expose the `page_defaults` hydrate shape.** Its one boot method has to be
`mergeRemote(record)`, never `setFromServer(record)` — because the moment a caller can *replace* the
local set, §2(a)'s data loss is one line away and will look like a reasonable simplification to whoever
writes it. **The seam should make the destructive version unsayable.**

---

## 6 · WHAT I AM ASKING FOR

1. **(A), (B) or (C)** — the convergence shape. My lean is (A); its unmeasured risk is named in §3.
2. **The tombstone question** (§4.3): cap, compact, or leave unbounded and state it.
3. **Whether a `proofing` mirror is inside `resetLocalData`'s logout sweep.** If it is, a logout
   discards unpushed words; if it is not, one account's dictionary outlives its session on a shared
   device. **Both readings are defensible and it is not mine to choose.**
4. **Scope** — the design offers "all your work" vs per-project as a second, smaller question for Nick,
   with the lean on all-your-work. Nothing here presumes an answer; the shape above is unaffected either
   way (a per-project axis would be a key inside `words`, not a different column).

---

## 7 · STATED BOUNDS

- **Nothing measured in a browser or against a database.** Every citation above is source read on disk
  at `4c25dec`, with file:line.
- **`harper.js` itself is unexamined here.** Its bundle size, its worker contract and its ignore-list
  export format are TUTOR's engine brief's ground, not this report's; §4.4 takes `ignored` as opaque
  precisely so this shape does not depend on them.
- **The engine's own S0** (`item204-part2-grammar-engine-s0.md`) is read but not audited — this report
  is the storage shape only, which is what the hard stop is for.
- **A merge of `origin/main` is owed before my next BUILD** (not before this review): main has moved to
  `38f5aa0` and touched `BoardEditor.tsx` and `CascadePanels.tsx`, both of which 138 and 163 changed.
  Reported now so it is a planned step rather than a surprise.
