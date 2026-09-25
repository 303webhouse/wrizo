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

## 1 · THE FOUR PIECES, VERBATIM — this is what the byte review reads

### (a) the migration line — `apps/server/src/migrate.ts:197`

```ts
await pool.query(`alter table users add column if not exists proofing jsonb`);
```

*Additive, nullable, no default, no CHECK, no backfill — `users.page_defaults`' recipe exactly. Null on
every existing writer, so a writer who has never proofed is byte-identical to today.*

### (b) + (c) both SQL statements, inside both route handlers — `apps/server/src/sync.ts:413`

```ts
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
  await pool.query(`update users set proofing = $2::jsonb where id = $1`,
    [userId, JSON.stringify(next)]);
  res.json({ proofing: next });
}));
```

*Outside `/sync` for the reason `page_defaults` is: a singleton on the user row with no id and no clock.
The per-key stamps inside `words` are the merge's own data, never a record clock.*

### (d) `mergeRemote` — `apps/desktop/src/store/proofing.ts:159`

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

### (d.ii) and its scalar rule, inside `mergeProofing` — `apps/desktop/src/store/proofing.ts:78`

```ts
  const laterOf = (aAt: string | undefined, bAt: string | undefined): 'a' | 'b' =>
    ((bAt ?? '') > (aAt ?? '') ? 'b' : 'a');
  const dialectWinner = laterOf(a.dialectAt, b.dialectAt);
  const ignoredWinner = laterOf(a.ignoredAt, b.ignoredAt);
  const dialectFrom = dialectWinner === 'b' ? b : a;
  const ignoredFrom = ignoredWinner === 'b' ? b : a;
  return compactProofing({
    dialect: dialectFrom.dialect || a.dialect || b.dialect || PROOFING_DEFAULT_DIALECT,
    dialectAt: dialectFrom.dialectAt ?? a.dialectAt ?? b.dialectAt,
    words,
    ignored: ignoredFrom.ignored || a.ignored || b.ignored || '',
    engine: ignoredFrom.engine || a.engine || b.engine || '',
    ignoredAt: ignoredFrom.ignoredAt ?? a.ignoredAt ?? b.ignoredAt,
  });
```

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
