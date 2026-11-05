# Rulings: `apps/desktop/src/store/proofing.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[proofing §n]` points here.

## proofing §1

From `apps/desktop/src/store/proofing.ts`, line 4 at `7f1c6a84` (the comment that stays: "the proofing store: one nullable jsonb column, users.proofing, per writer; no setFromServer exists - a remote enters only through the commutative mergeRemote, so words added here are never replaced").

```ts
// ITEM 204 PART 2 — THE PROOFING STORE: the writer's personal dictionary, their
// dialect, and harper's own ignore blob.
//
// ONE nullable jsonb column, `users.proofing`, on `users.page_defaults`' recipe —
// Nick's schema word ("1. Yes"), Fable's shape approval. Per WRITER, not per page,
// so it is not `pageSettings`; and deliberately NOT smuggled into `page_defaults`,
// which is the writer's starting DRESS and would be overloaded by a second concept.
//
// ⛔ THE ONE THING THIS FILE EXISTS TO GET RIGHT: `page_defaults`' recipe has a
// DESTRUCTIVE LINE, and it is not copied here.
//
//   `pageDefaults.ts:113` — `if (server) { defaults = server; writeLocal(server); }`
//
// That REPLACES the local copy on every boot. Correct for a dress written by one
// deliberate act from one place; catastrophic for a set edited on every device —
// it would destroy words added here and not yet pushed, every time the server's
// copy was older. So this store has NO `setFromServer`, and there is no way to
// spell one: the only way a remote record enters is `mergeRemote`, and the merge
// is commutative. Fable's ruling: *"the seam makes the destructive form
// unsayable."*
//
// CONVERGENCE (option A, ruled). Per-key merge on BOTH sides of the boundary: the
// client always GETs, merges, and PUTs the MERGED set; the boot pull merges and
// never replaces. An LWW-element-set over `words`, keyed lower-cased, stamped.
//
// ⚠ THE RESIDUAL, NAMED AND OWED TO THE OFFER: a word can be briefly MISSING on
// another device until the device that added it syncs again. It is not lost — each
// device retains its own additions, so the next GET-merge-PUT re-contributes them.
// It is lost permanently only if that device loses local storage first, which
// includes signing out (see `clearProofingLocal`, below — ruled: a signed-out
// device keeps nothing of the writer's).
```

## proofing §2

From `apps/desktop/src/store/proofing.ts`, line 55 at `7f1c6a84` (the comment that stays: "a malformed remote record merges as null: the server does not validate a shape the client owns").

```ts
  // ⛔ A MALFORMED RECORD MERGES AS NULL (Fable's review, 3). The remote arrives
  // from the wire and the server does not validate a shape the client owns — so a
  // string, an array, a number or a record missing `words` must be treated as
  // ABSENT, not merged. Merging one would throw inside `Object.entries` or, worse,
  // yield a record with no word map at all and overwrite a real one on the next
  // push. Validated HERE rather than at the caller, so every path is covered.
```

## proofing §3

From `apps/desktop/src/store/proofing.ts`, line 166 at `7f1c6a84` (the comment that stays: "compaction, not a cap: a removedAt older than 180 days is dropped (a cap would lose the oldest words); a device offline longer can bring a removed word back").

```ts
/**
 * COMPACTION, NOT A CAP (Fable's ruling). A `removedAt` older than 180 days is
 * dropped entirely.
 *
 * Why compaction rather than a cap: a cap on a SET silently loses the writer's
 * OLDEST WORDS, which are the ones they are least likely to notice going. A
 * tombstone's whole job is to expire, so expiring it is the honest bound.
 *
 * ⚠ THE CONSEQUENCE, NAMED: a device offline longer than 180 days can bring a
 * removed word BACK, because the tombstone that would have suppressed it is gone.
 * Ruled benign — the writer removes it again — and named here rather than
 * discovered.
 */
```

## proofing §4

From `apps/desktop/src/store/proofing.ts`, line 239 at `7f1c6a84` (the comment that stays: "signing out takes the dictionary with it (called from resetLocalData); unpushed words on this device go with it").

```ts
/**
 * Signing out takes the dictionary with it — Fable's ruling: *"a signed-out device
 * keeps nothing of the writer's; it goes out the same way every other writer
 * record does."* Called from `resetLocalData`.
 *
 * ⚠ This is the one place the residual above becomes real loss: words added on
 * this device and never pushed go out with it. That is the ruled trade, and the
 * alternative (one account's dictionary outliving its session on a shared device)
 * was the worse one.
 */
```

## proofing §5

From `apps/desktop/src/store/proofing.ts`, line 303 at `7f1c6a84` (the comment that stays: "get, merge, put the merged set, in one function so the steps cannot be split or reordered; the merge is commutative and idempotent, so boot pull and push are one operation").

```ts
/**
 * GET, MERGE, PUT THE MERGED SET — the ruled shape, in one function so the three
 * steps cannot be performed separately or in the wrong order.
 *
 * Used for the boot pull AND for pushing a local change: because the merge is
 * commutative and idempotent, there is only one operation here, not two.
 */
```
