# Item 82 — fix (b): j5's `makePage` goes through the seam · 2026-08-03

**Branch `item82-fixb-j5-seam`, code commit `bc6f53c`, now parented at `main` @
`7abd1e7` (the fw2 merge `a18115c` beneath it).** Branched 2026-08-03 at
`origin/main` @ `4a638f1`, pinned by SHA per the standing "origin/main moves
mid-session" law, then rebased forward twice — `4a638f1` → `d00bca9` → `7abd1e7`
— both times conflict-free. §5b records why the second rebase was required.

Fable approved fix (b) at item 82 fix 2's close — *"route `makePage` through the
seam; it removes the mechanism rather than dodging the timing."* The minimal seam
extension (optional params, `persistence.ts`, census disclosed, never
seam-plus-raw) was pre-approved by Nick before this build.

**Status: BUILT + VERIFIED + STAMPED — merge offered 2026-08-17. See §5b.**
Built browserless on 2026-08-03 under Fable's order (no suite until chat 1's
deploy stamp landed and the box passed); verified on the box 2026-08-17.

---

## 1. THE SEAM EXTENSION — and its census

`createJournalPage()` minted its own `id` and `createdAt` and had no `text` or
`strokes`, which is precisely why `j5` never called it. It now takes an optional
`JournalPageSeed`:

```ts
export interface JournalPageSeed {
  id?: string;
  text?: string;
  createdAt?: string;
  strokes?: Stroke[];
}
export function createJournalPage(seed?: JournalPageSeed): JournalEntry
```

**CENSUS, and it is the reason this is a small change: `createJournalPage` has
ZERO call sites in `apps/desktop/src`.** It is reachable only through
`window.wrizoCreateJournalPage`. The two other mentions in `src` are comments
(`DeskRail.tsx:59`, `useCatch.ts:6`) naming it as Catch's underlying model. So
the extension's product blast radius is **empty**, not merely small — no product
door passes `seed`, because no product door calls this function at all today.

**Back-compatibility is structural, not asserted:** every field is optional and
falls back to exactly the old expression (`generateId()`, `''`, `now`), and
`strokes` is set only when seeded, so an unseeded row is byte-identical to the
one this function wrote before.

**`updatedAt` is deliberately NOT seedable, and this is disclosed rather than
hidden.** `upsert` stamps it on every write; the seam does not get a private
clock the product does not have. The fixture's raw rows used to carry
`updatedAt === createdAt` (stepped into the near future); seeded rows carry a
real `updatedAt`. **Nothing this scenario asserts reads it** — `j5` has zero
`updatedAt` reads, `notebookKey` is `orderIndex ?? createdAt`, and the Spread's
"Newest" lens sorts on `createdAt` — so both of the file's orderings are
unchanged by construction.

Zero schema, zero server, zero deps. `src` diff: `persistence.ts` only.

## 2. THE MECHANISM — with one new piece of evidence

Item 82 fix 2 proved the cache mechanism. Reading the file against it turned up
**which write actually pulls the trigger, and it is not the one the fixture's
comments blamed**:

- Mounting `/journal` mints/reconciles the Journal system board
  (`JournalBoardGate` → `getOrCreateSystemBoard` → `saveJournalEntry` →
  `scheduleFlush`). That schedules a **300ms flush of `journalEntries`**, which
  serializes the cache **wholesale** over a localStorage that holds rows the
  cache has never seen.
- **`BoardEditor`'s unmount cleanup calls `flushNow()` UNCONDITIONALLY** — the
  bare call in the effect's cleanup, outside the
  `boxesRef.current !== lastSavedRef.current` guard that gates the
  `visibilitychange` path two lines above. `flushNow()` writes **every**
  collection. So leaving `/journal` is a guaranteed wholesale rewrite, and
  `/journal` is the most dangerous surface in the app to hold a raw seed on.
  It was `BoardEditor.tsx:982` when measured on 2026-08-03 and is **`:983` at
  `bc6f53c`** — fw2's merge added one import above it without touching the
  effect. Cited by anchor because a line number is measured at a head, never
  carried across one.
- `scheduleFlush` does **not** re-arm: `if (flushTimers[name] !== null) return`.
  The pending timer is 300ms from the FIRST write, not the last.

That closes the loop on both recorded `j5` symptoms with one clock:

| site | what the fixture did | what happened |
|---|---|---|
| A–D (`:161` pre-fix) | seed raw on the Desk, `goto('/journal')`, patch, reload | `goto` sleeps 200ms; the board's flush fires at 300ms. Reload first → green. Lose that **~80ms** → A–D erased → *"No loose pages yet"*, the 2026-07-25 symptom |
| E / `j5-src-7` (`:468` pre-fix) | seed raw on the Desk, `goto('/journal')`, seed the plan, reload | same window, one page later — A–D and G,H are already in the cache from their own reloads, so the Spread renders **POPULATED with E alone missing**: the fifth suite of record's exact failure at `:482` |

Empty and partial are one mechanism at two amplitudes, exactly as the ledger's
sharper hypothesis said — and the amplitude is just *how many rows had already
been rehydrated into the cache when the flush landed*.

Seeding through the seam puts the row in the cache. No flush can erase it. The
mechanism is removed, not out-timed.

## 3. WHAT CHANGED IN `j5.mjs`

**(a) `makePage` → the seam.** The raw read-modify-write is gone; it calls
`window.wrizoCreateJournalPage({ id, text, createdAt, strokes })`. No raw
follow-up write — the row is complete as authored, per "never seam-plus-raw."

**The one behavioural difference the migration absorbs:** the raw write was
synchronous to localStorage; the seam's is debounced 300ms. Seven call sites read
`localJSON` immediately after `makePage` returns, so `makePage` restores its old
post-condition — *the row is on disk when it returns* — with a `waitFor` on the
row's arrival. **Observed settle, not a sleep** (DF1.1 species 1). Without it the
`4 fixture pages created` check would have gone red on the first run: with
`scheduleFlush` not re-arming, A and B land at t≈300ms while C and D are still
only in the cache.

**The Desk hop stays,** and its comment now says why honestly: it is no longer
load-bearing against a flush, but `makePage`'s post-condition ("the browser is
standing on the Desk when this returns") is relied on by later call sites.

**(b) The `:311` comment.** `makePage -> wrizoCreateJournalPage` is **true again,
by construction**. It is annotated rather than silently repaired — the record
should show it was false from FX14 S2 until this fix, that item 82's diagnosis
caught it, and that the fix moved the *code* back rather than weakening the
*claim*.

**(c) Three ordering corrections, required by the law, not volunteered.**
`AGENTS.md`'s seeding law binds any edit to a raw-writing harness file: *"any
edit to one of the 47 raw-writing harness files checks that file's own exposure
before it lands."* `j5` has three other raw writes. All three were checked; all
three are exposed; all three now seed from the **Desk**, reload from there, and
navigate afterwards — the original M1 ordering rule verbatim. **Every navigation
they used to perform is kept, moved after the reload.** Nothing asserted changed.

| site | raw write | why it had to move |
|---|---|---|
| star + tag B | `starred`/`tags` onto an existing row | Post-fix, A–D are safe in the cache but this patch would have become the **new casualty** of the same 300ms flush — fix (b) would have traded a page-loss race for a lens-flag race. A seam page carrying a raw amendment is the half-migrated shape the law forbids. |
| the StoryPlan | `writer-studio-story-plans` | Narrower exposure and worth recording as such: a scheduled `flush(name)` writes ONE collection, so the board's flush never threatened it — only a `flushNow()` does, and BoardEditor's unmount fires one. Same mechanism, same cure. |
| the seed Board | a `pageType:'board'` row with pre-seeded `boxes` | Was seeding on `/journal` inside a ~40ms margin, under a `waitFor` labelled **"safe pre-seed landing"** — a false claim of the same class as the `:311` comment. |

**Two comments were falsified by this and are corrected in place, with the old
reasoning quoted and the correction named** (they are prose, not committed
assertions — no park is owed for either):

1. *"Navigate away from the entry view FIRST — its unmount flush would otherwise
   re-save its own stale in-memory copy"* — there has been no entry view to leave
   since FX14 S2, and the `/journal` it navigated to is the hazard, not the
   refuge.
2. The B1 park sweep's *"dropping the navigation … would have silently
   reintroduced that exact race"* — the lesson it cites is real; the conclusion
   drawn from it is backwards. **The navigation itself is kept** (it is the
   parked check's own, and this ticket does not delete another ticket's fixture
   shape); only the seed steps off it.

## 4. WHAT IS **NOT** DONE — and stays open for item 85

- **The star/tag patch and the seed-Board row are still raw writes.** Neither has
  a seam to migrate to: `starred`/`tags` are an *amendment* to an existing row and
  no `wrizo*` seam exposes one; the seed Board is a `pageType:'board'` page with
  pre-seeded `boxes`, and `createBoardPage` is neither exposed on `window` nor
  takes boxes. Authoring those seams is **item 85 phase 2's** work, not something
  to smuggle in under a fix. Their ordering is closed in the meantime; their
  migration is not.
- **The census is not re-derived.** Chat 6's 47-of-52 count keeps its caveat
  verbatim. This build qualifies exactly one file.
- **`j4`, `b2-1`, `fx6` stay UNATTRIBUTED.** `j4` uses the identical raw vehicle
  with the CORRECT ordering (reloads at `j4.mjs:68` before navigating), so this
  mechanism still does not explain it, and it does not inherit anything from this
  fix. Recorded again because the tempting move is to let a fix claim neighbours
  for free.
- **No park is owed.** Every check name in `j5.mjs` is preserved verbatim; no
  assertion was weakened, re-pointed, or removed; check count is unchanged.

## 5. VERIFICATION — what is done and what is owed

Done, browserless:

- `tsc --noEmit -p apps/desktop/tsconfig.json` — **clean**.
- `node --check apps/desktop/scripts/harness/j5.mjs` — **clean**.
- `pnpm run build:web` — **clean**, `index-Cj7zbELe.js` / 524.44 kB.
- No eslint config exists in this workspace; there is no lint step to run.

## 5b. VERIFICATION — DONE (2026-08-17, on the box)

Branch rebased twice: `d65581e` → `85a094c` (on `d00bca9`) → **`bc6f53c`** (on
`7abd1e7`, the fw2 merge `a18115c` beneath it). Both rebases were conflict-free —
fw2 touched neither `persistence.ts` nor `j5.mjs`.

**Standalone repeats, scaled to the observed rarity per DF1.1's law — 37
consecutive runs, zero verdict failures:**

| head | unset | parked |
|---|---|---|
| `85a094c` | 11/11 PASS (37 checks) | 10/10 PASS (37 + 3 parked) |
| `bc6f53c` | 8/8 PASS (37 checks) | 8/8 PASS (37 + 3 parked) |

**The stamped pair, at the true merge-candidate head:**

```
SUITE RESULT: CLEAN — tree=bc6f53c bundle=index-Ch4juzEe.js/525431b   (unset, 55/55)
SUITE RESULT: CLEAN — tree=bc6f53c bundle=index-Ch4juzEe.js/525431b   (parked, 55/55)
```

Identical tree AND bundle across both halves. Zero FAIL/TIMEOUT/NOVERDICT. No
contamination line, committed runner, rebuilt immediately before running, no
`--ignore-foreign`. `j5` PASS 37 in both.

**A FIRST PAIR WAS DISCARDED, AND IT WAS GREEN.** It ran at tree `85a094c` —
**54/54 CLEAN both settings**, `j5` PASS 37 both — and `main` moved under it
mid-sweep when chat 1 unparked and merged fw2. A stamp naming a tree fw2 was not
in is the unfalsifiable identity 77(c) closes, so it is recorded as a green
observation and is **not** this offer's evidence. Not ceremony: fw2 changed
`BoardEditor.tsx` (+92), the surface this mechanism turns on, and the rebuild
proves the software differed — `index-Cj7zbELe.js` → `index-Ch4juzEe.js`. Checked
rather than assumed: fw2's hunks land at lines 11 / 1160 / 2184 and leave the
unmount cleanup intact, so the mechanism stands and only its citation moved
(`BoardEditor.tsx:982` → `:983`), which is why the ledger cites the anchor.

**ONE BOOT CRASH, recorded not swallowed.** The day's first standalone attempt
died in 2s before any check ran: `EBUSY … DevToolsActivePort`. `readCdpPort`
(`runtime-verify.mjs:281-289`) polls `existsSync` then calls `readFileSync` with
**no try/catch**, so a read landing while the browser still holds that file dies
instead of polling again — a different species from DF1.1's stale-profile-dir
cause (fresh dir, file mid-write, not a fresh process finding an old port file).
The cure is one line, but `runtime-verify.mjs` is shared infra and patching it
mid-verification would taint this lane's own provenance. **Unfixed, unclaimed — a
ticket is owed to whoever owns the harness floor.** No recurrence in 37 standalone
runs or four sweeps.

**A note on what a green suite here does and does not prove.** It does not close
item 82. It closes `j5`'s attributed mechanism, which is the one member fix 2
proved. The family's other members are untouched by it in both directions.

— SC2-chain lane, 2026-08-03
