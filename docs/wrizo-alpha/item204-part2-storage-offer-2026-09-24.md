# ITEM 204 PART 2 — THE STORAGE HALF · OFFER
### PW build lane · 2026-09-24 · offered for Fable's BYTE REVIEW

**BRANCH:** `exp1-connect-text` · **BASE:** `origin/main` @ `38f5aa0`
**THE TREE UNDER REVIEW: `63c0895`** — the last commit that touches product code (the round trip and
the K4 scalar fix). The two commits after it are this offer and its verbatim check, which add no
product code: `git diff 63c0895..HEAD --stat` is docs plus one script, and the check script proves the
pasted blocks still match. *A record that names the wrong tree certifies nothing, and one that names no
tree is only slightly better.*
**NOTHING MERGES OR DEPLOYS BY MY HAND.**

**WHAT THIS IS:** the storage half of item 204 part 2 — **one nullable jsonb column, `users.proofing`**,
its two routes, and the client store that keeps it convergent. **The engine does not exist yet, and the
column alone is harmless**, so this can ride a batch ahead of it (Fable's own note).

**WHAT THIS IS NOT:** no Settings UI, no dialect picker, no read-time drop, no `harper.js`, no worker.

**AUTHORITY:** Nick's schema word **"1. Yes"** (option 1, one column). Fable's shape approval, plus four
rulings — convergence (A), compaction not a cap (180 days), the logout sweep (yes), scope (unaffected) —
and the **K4 amendment** (`dialectAt`/`ignoredAt`, later-wins, same column).

---

## 1 · THE PIECES, VERBATIM — this is what the byte review reads

**RE-EXTRACTED AFTER THE REVIEW.** Fable's five changes moved two of these blocks, and the offer's own
verbatim check **went red on exactly those two** before they were regenerated — which is what it exists
for. A fifth block joins them: the shape validator that change 3 required.

### (a) the migration line — `apps/server/src/migrate.ts:197`

```ts
await pool.query(`alter table users add column if not exists proofing jsonb`);
```

### (b) + (c) both handlers, both statements, and the `requireAuth` citation — `apps/server/src/sync.ts:413`

```ts
// ⛔ BOTH ROUTES ARE BEHIND `requireAuth`, AND THE MOUNT IS THE ONLY REASON THEY
// CAN CAST. `syncRouter.use(requireAuth)` at the top of this file (line 11) guards
// every route on this router, which is what makes `req.session.userId as string`
// safe here rather than a hopeful cast — the request cannot reach a handler
// unauthenticated. Cited because the cast is the kind of line a reader should be
// able to justify without leaving the function (Fable's review, 5).
syncRouter.get('/proofing', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  const { rows } = await pool.query(`select proofing from users where id = $1`, [userId]);
  res.json({ proofing: rows[0]?.proofing ?? null });
}));

syncRouter.put('/proofing', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  // The body is the MERGED record, or null to clear. Stored as-is: the shape is
  // documented at migrate.ts's own column comment and mirrored in types/index.ts.
  const next = req.body?.proofing ?? null;
  // ⛔ A CLEAR WRITES SQL NULL, NOT jsonb 'null' (Fable's review, 4).
  // `JSON.stringify(null)` is the STRING "null", which Postgres stores as a jsonb
  // null — a value that is not SQL NULL. The column would then have two different
  // "empty" states: absent (never proofed) and a jsonb null (cleared), which
  // `rows[0]?.proofing ?? null` cannot tell apart and which no reader should have
  // to. Passing a real null keeps the column's NULL meaning exactly one thing.
  await pool.query(`update users set proofing = $2::jsonb where id = $1`,
    [userId, next == null ? null : JSON.stringify(next)]);
  res.json({ proofing: next });
}));
```

### (d) `mergeRemote` — `apps/desktop/src/store/proofing.ts:216`

```ts
/**
 * ⛔ THE ONLY DOOR A REMOTE RECORD COMES THROUGH. There is deliberately no
 * `setProofing`/`setFromServer`: see this file's header. A caller cannot replace
 * the local set even by mistake, because nothing here accepts a replacement.
 */
export function mergeRemote(remote: ProofingRecord | null): ProofingRecord {
  current = mergeProofing(current, remote);
  writeLocal(current);
  notify();
  return current;
}
```

### (d.ii) the scalar rule, inside `mergeProofing` — `apps/desktop/src/store/proofing.ts:104`

```ts
  // The tiebreak takes a SECOND value, and Fable's review is why: `engine` follows
  // whichever side won `ignored`, so two records with equal lists AND equal stamps
  // but different engines were still resolved BY POSITION — the one asymmetry left
  // after the value tiebreak, and a direct contradiction of this block's own claim
  // that position decides nothing. A second key closes it: equal stamps, equal
  // lists, then the larger `engine` wins. Arbitrary, symmetric, total.
  const pickSide = (
    aAt: string | undefined, bAt: string | undefined,
    aVal: string, bVal: string,
    aTie = '', bTie = '',
  ): 'a' | 'b' => {
    const aS = aAt ?? '';
    const bS = bAt ?? '';
    if (aS !== bS) return bS > aS ? 'b' : 'a';
    if (aVal !== bVal) return bVal > aVal ? 'b' : 'a';
    return bTie > aTie ? 'b' : 'a';
  };
  const dSide = pickSide(a.dialectAt, b.dialectAt, a.dialect, b.dialect);
  const iSide = pickSide(a.ignoredAt, b.ignoredAt, a.ignored, b.ignored, a.engine, b.engine);
  const dWin = dSide === 'b' ? b : a;
  const iWin = iSide === 'b' ? b : a;
  const dLose = dSide === 'b' ? a : b;
  const iLose = iSide === 'b' ? a : b;
  return compactProofing({
    // A stamped winner is authoritative, empty or not. Unstamped, fall back.
    dialect: dWin.dialectAt
      ? dWin.dialect
      : (dWin.dialect || dLose.dialect || PROOFING_DEFAULT_DIALECT),
    dialectAt: dWin.dialectAt ?? dLose.dialectAt,
    words,
    ignored: iWin.ignoredAt ? iWin.ignored : (iWin.ignored || iLose.ignored || ''),
    engine: iWin.ignoredAt ? iWin.engine : (iWin.engine || iLose.engine || ''),
    ignoredAt: iWin.ignoredAt ?? iLose.ignoredAt,
  });
```

### (e) the shape validator, added by change 3 — `apps/desktop/src/store/proofing.ts:129`

```ts
/**
 * Is this actually a proofing record? (Fable's review, 3.)
 *
 * The remote arrives from the wire, and the PUT route deliberately does not
 * validate a shape the client owns — so the client is the only place that can.
 * A string, an array, a number, a null, or an object with no `words` map is not a
 * record and must merge as ABSENT rather than be merged: `Object.entries` on the
 * wrong thing either throws or yields nonsense that would then be pushed back over
 * a good record.
 *
 * Deliberately SHALLOW: it checks the shape the merge depends on, not every word
 * entry. A malformed individual entry degrades to "this word has no usable stamp"
 * inside `lastActAt`, which loses a comparison rather than corrupting the set.
 */
export function isProofingRecord(v: unknown): v is ProofingRecord {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.dialect !== 'string') return false;
  if (!r.words || typeof r.words !== 'object' || Array.isArray(r.words)) return false;
  return true;
}
```

---

## 1b · THE FIVE REVIEW CHANGES, EACH WITH ITS CLAIM

| # | the finding | what changed | the claim that now holds it |
|---|---|---|---|
| 1 | **a stamped empty could not win** — `'' \|\| a \|\| b` resurrected a cleared `ignored` | the fallback chain applies ONLY when the winner carries no stamp; a stamped winner's value is taken as-is, `''` included. Same for `dialect` and `engine` | **CLAIM 2b** — a later stamped clear survives in BOTH orders, and a later value still beats an older clear |
| 2 | **ties broke by position**, so `merge(a,b) ≠ merge(b,a)` and two devices could each keep their own value forever | a tie breaks by VALUE (lexicographically larger) — arbitrary but SYMMETRIC, which is the property that converges | **CLAIM 2c** — stamped and unstamped ties resolve identically from either side |
| 3 | a **malformed remote** would throw or be merged as a record | `isProofingRecord` gates both sides inside `mergeProofing`, so every path is covered | **CLAIM 2d** — 13 malformed inputs merge as absent; none threw, none destroyed the good record |
| 4 | a clear wrote **jsonb `'null'`**, giving the column two indistinguishable empty states | `next == null ? null : JSON.stringify(next)` | **K6** — a clear passes a real SQL NULL, driven through the route |
| 5 | the handlers **cast `userId`** with no visible justification | the mount is cited: `syncRouter.use(requireAuth)`, `sync.ts:11` (line number verified, not remembered) | — |

**AND A MUTANT THAT SURVIVED, REPORTED RATHER THAN DELETED.** The old mutant "the client pushes its own
record instead of the merged one" swapped `proofing: merged` for `proofing: current` — **byte-identical**,
because `mergeRemote` assigns `current = mergeProofing(...)`. It tested nothing and stayed green. By
198's own standard a green mutant is a defect in the INSTRUMENT, so it is replaced by one that actually
removes the merge. **Two other mutants' anchors had rotted** on the review's edits and reported
*"MUTATION DID NOT LAND"* rather than passing quietly — the branch that exists for exactly that.

**AND THE MUTANT REPORT MIS-ATTRIBUTED ONE.** It printed only the first failing claim, crediting the
SQL-NULL mutation to K3 when it breaks **K6 and nothing else**. It now lists every failing claim, which
also surfaces a mutant that breaks MORE than it should — itself a finding.

---

## 2 · THE ONE THING THIS BUILD EXISTS TO GET RIGHT

`page_defaults`' client recipe contains a **destructive line** — `pageDefaults.ts:113`,
`if (server) { defaults = server; writeLocal(server); }` — which **replaces** the local copy on every
boot. Right for a dress written by one deliberate act from one place; **catastrophic for a set edited on
every device.**

**It is not copied, and the destructive form is UNSAYABLE:** the store exports `mergeRemote` and nothing
that could take its place. The merge proof checks the module's **real exports** (13) and the source for
`setFromServer` / `replaceProofing` / `setProofing` / `hydrateProofing` — a claim about what exists,
not about what was intended.

---

## 3 · EVIDENCE

| instrument | what it proves | result |
|---|---|---|
| `item204-proofing-merge-proof.mjs` | the merge, against the REAL module (only `localStorage` stubbed; the two constants read out of `types/index.ts` so the 180 checked cannot drift from the 180 shipped) | **CLEAN, 7 claims** |
| `item204-proofing-roundtrip-proof.mjs` | **two client stores against the real routes** — real router bundled, real `syncProofing()`, a pool reading the endpoints' own SQL and learning the column from `migrate.ts` | **CLEAN, 5 claims** |
| the same, `--mutants` | 5 load-bearing edits removed ALONE | **every mutant RED** |
| `sync-incremental-pull-proof.mjs` (FIX's 198) | that changing `sync.ts` did not break another lane's proof | **GREEN, 23 checks** |

**THE ROUND TRIP CAUGHT A REAL DEFECT IN THE APPROVED SHAPE.** K4 failed: with no stamp on the scalars,
the merge said "incoming wins when non-empty", so **the server's existing dialect always beat a local
change** — a writer could never have saved one. The merge proof had missed it because it only exercised
`words`. Hence the K4 amendment, approved.

---

## 4 · RESIDUALS — all four named, none guarded

1. **A word can be briefly MISSING on another device** until the device that added it syncs again. Not
   lost: each device retains its own additions, so the next GET-merge-PUT re-contributes them.
2. **A device offline longer than 180 days can bring a removed word BACK**, because the tombstone that
   would have suppressed it has been compacted away. Ruled benign — the writer removes it again — and
   **demonstrated** in the merge proof rather than asserted.
3. **Signing out takes unpushed words with it.** `resetLocalData` clears the mirror (ruled). The
   alternative — one account's dictionary outliving its session on a shared device — was worse.
4. **⚠ A SKEWED DEVICE CLOCK CAN WIN A SCALAR** (and a word). Every stamp here is
   `new Date().toISOString()` on the **device**, so a machine whose clock runs ahead wins `dialect`,
   `ignored`, and any contested word, indefinitely — until the other device makes a later change. There
   is no server clock in this path to correct it, because the routes deliberately do not know the shape.
   *Item 198 gave the `/sync` tables a server-stamped `synced_at` for exactly this class of problem;
   this column is outside `/sync` and has no equivalent.* **Named, not guarded** — the blast radius is
   one writer's own preferences, not their manuscript.

---

## 5 · STATED BOUNDS

- **No browser, no box turn.** Nothing here is a rendered claim.
- **No real Postgres**, and none was needed: the round trip follows FIX's 198 instrument's method (its
  pool reads the real SQL). *The instruction said "on real Postgres as 198 did"; 198's own header says it
  uses none, and this repo has no Postgres available to a script. Fable has since confirmed the
  correction — recorded here because the offer should carry why the instrument is shaped this way.*
- **`harper.js` is unexamined.** `ignored` is opaque by design precisely so this shape does not depend
  on it.
- **The tombstone window is a ruled number, not a measured one** (180 days). What is unmeasured is how
  often a device is offline past it.
