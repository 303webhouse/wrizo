# FIX LANE HANDOFF — 2026-08-03 (chat 6's successor)

Branch: **`item89-persist-dirty`** (pushed; holds BOTH P0s — the name is from the
first ticket on it, not its whole contents). Base: `origin/main` @ `c7878ed`,
pinned by SHA at branch time per the standing "origin/main moves mid-session" law.

---

## MERGE OFFER TO CHAT 1

Three commits, **zero schema** (no `apps/server` file in any diff), fix-class
throughout, freeze-lawful. Pre-authorized class per Nick's standing word.

| commit | what |
|---|---|
| `8875343` | Item 89 (P0) — persist the dirty set |
| `37d0826` | Item 89 — the parked suite lands (records only) |
| `2b17b40` | Items 88a+88b (P0+P1) — validate the filing target; stop birthing pages by a side door |

Both P0s from the pre-flight sitting are **closed**. Each carries a committed
harness that was **proven to bite** against its own pre-fix bundle, and a full
suite in both settings.

---

## WHAT SHIPPED

### Item 89 — the dirty set is persisted (P0, S8)

`dirty` was module-scope memory, and `getDirtyRecords()` filters the cache BY it —
so it was never a hint, it was the sole gate on what sync may send. A reload did
not delay a push, it made the push impossible.

It was **silent** because every list in the product reads the local cache; no
surface in Wrizo asks the server what pages exist. A stranded row renders exactly
like a synced one on the device that owns it.

Fix: journal the ids to `writer-studio-dirty-v1`, restore at boot, prune to ids
present in the cache. The prune is load-bearing — an unpruned phantom would make
`applyCollection` skip that id forever, blocking the *server's* copy from landing.

Verification: `scripts/harness/item89.mjs`, 14 checks. **8/14 fail pre-fix.**
Suite 53/53 both settings, identical bundle hash.

### Items 88a+88b — the filing target is validated (P0 S5 + P1 S6)

88a as recorded and confirmed: any string became a `projectId`, and a projectId
naming no live binder makes a page invisible to every enumerator including export.

**88b's recorded mechanism was FALSIFIED by its own harness.** `getJournalEntry`
falls through to the unborn slot, so filing an unborn page never no-opped and the
toast never lied — it **birthed an empty page through a side door**, bypassing
`birth()` and minting the `text:''` litter PB1 exists to prevent. `setPageHome`
now reads the cache directly, so an unborn surface is not a filing subject at all.

Verification: `scripts/harness/item88.mjs`, 10 checks. **5/10 fail pre-fix**, with
S3 (the honest filing path) passing on both builds as the control.

### Shared-infra addition

`runtime-verify.mjs` gains **`/api/_sync_mode`** (`{fail:true}` → a real 503), on
the exact precedent of TU2's `/api/_tutor_mode`, defaulting to `{}` so every
pre-existing harness file sees byte-identical behavior. Needed because the harness
double is authed AND online: a scenario about unsent work must make the send
genuinely fail, and a page-side `fetch` trap dies on reload.

---

## PARKED, WITH MECHANISM PROVEN — pick these up first

### Item 92 — S0 PAID, fix unbuilt (~20 lines)

**Not** "Plan minted a second board." `onAddPageCard` (`BoardEditor.tsx:1162-1166`)
really does create and pin; the door is absent on system boards (`:1704`), so
reconcile cannot reach it.

**Actual mechanism:** `pinPageToBoard` writes the board's row in the STORE, but
BoardEditor holds cards in local state initialized once (`:658`) and never re-read
on a user board (the `subscribe()` lives inside the system-board-only reconcile
effect). `onAddPageCard` never calls `setBoxes`, so the unmount cleanup (`:981`)
writes the pre-pin array back over the pin and `flushNow()`s it. The card is
written and then erased by the surface that created it.

The law it breaks is documented at `BoardEditor.tsx:665-676` — card creation goes
through `setBoxes` because "a direct `saveBoardBoxes` call here instead would race
that same debounced autosave." `onAddPageCard` is the one door that reaches around
it.

**Fix shape:** route the new card through `setBoxes` like every sibling door, or
re-read the board after `pinPageToBoard` and `setBoxes` the result before
navigating.

### Item 91 — and why it is probably the SAME fix

`birth()` accepts `opts.pinToBoardId`, and `UnbornSurface.birthWith` threads it —
but **no call site anywhere supplies it.** All four `birthWith(` callers pass
content only. `UnbornDescriptor`/`unbornHref` have no pin field to carry it.

That is exactly Nick's verdict for 91 ("a New Page carrying the board's binder/pin
descriptor via `unbornHref`"). Adding `pinBoardId` to the descriptor
(`unbornPage.ts:19-44`) and passing it at birth is what lets a board's New Page
door say "born pinned here" in one act — which is also 92's cure.

### A separate second-plan-board bug (new ticket owed)

`getJournalEntry` returns null for SOFT-DELETED rows (`persistence.ts:1545`), so
trashing a plan board makes its page's `planBoardId` dangle and the next flip
re-mints (`getOrCreatePlanBoard`, `:1616-1620` — the "board hard-gone" comment
fires for merely soft-deleted too). The sitting log's instinct was sound; it was
aimed at the wrong symptom.

---

## NOT STARTED

- **79** (markdown markers visible while styling applies) — untouched.
- **87** (New Page lands in Draft; Free Write hides Structure presets; typewriter
  off on fresh pages) — **not built, but read far enough to warn the next lane that
  this is NOT a small defaults flip.** Its typewriter clause is a **reversal of a
  RULED default**, not a bug fix. `seedTypewriterDefault` is called with
  `lineEquivalents < DRAFT_TYPEWRITER_LINE_THRESHOLD (10)`
  (`store/writingSettings.ts:114-159`), so a FRESH page — 0 lines — seeds typewriter
  **ON** today, deliberately: FX2 S2's own ruling is "Draft opens with typewriter ON
  unless the page already holds 10+ line-equivalents." Nick's S3/87 verdict inverts
  exactly that case.
  So this ticket must **park** every committed assertion that encodes the old ruling
  (fx2's own, at minimum) with a SUPERSEDED note and a successor pointer — never
  rewrite them in place. That is what Nick's brief means by "harness re-points
  disclosed," and it is why this was not squeezed in at the end of a session: parking
  a ruled default wrong is worse than not touching it. Budget a full pass, not an
  afternoon's tail.
- **fix (b)** (j5 `makePage` through `wrizoCreateJournalPage` + the `:311` comment).
  Read but not built. Note the shape of the problem for whoever takes it:
  `makePage` (`j5.mjs:120-144`) needs a **specific id** (`j5-src-N`), a **specific
  `createdAt`** (deliberate 1s gaps, which the Spread's ordering checks depend on),
  and optional `strokes` — none of which `createJournalPage` accepts, since it mints
  its own id and timestamp. That is why it is still a raw write, and why this is not
  the one-liner it looks like. The `:311` comment already CLAIMS
  "makePage -> wrizoCreateJournalPage", which is **false today** — that comment is
  drift of exactly the kind `93f6ee3` was written to catch.

---

## STANDING HAZARDS RE-CONFIRMED LIVE THIS SESSION

- **The Railway near-miss (item 88's) is STILL LIVE.** `railway status` from a
  worktree resolves to project **`fabulous-essence`** — an unrelated production
  system. The link map is path-keyed and the worktrees are absent from it, so the
  CLI walks UP to `C:\Users\nickh`, which is linked to that other product. Run
  read-only queries from the **primary checkout** (correctly linked to
  `writer-studio`), with `--service Postgres` for a reachable URL. No `railway
  link` is needed and none was issued — it mutates shared CLI state that five lanes
  share.
- **`93f6ee3`** (`th2` comment fix) remains **branch-parked and pushed** on
  `item82-fix1-celebration-gate`, unmerged. Zero loss; not this lane's to merge.
