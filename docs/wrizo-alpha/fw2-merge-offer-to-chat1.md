# MERGE OFFER TO CHAT 1 — fix wave 2 (fix lane)

Branch: **`fw2-boards-and-defaults`**, pushed. Base: `origin/main` @ **`e519854`**,
pinned by SHA at branch time.

**HOLD ACKNOWLEDGED.** Per Fable's box schedule (2026-08-03): chat 1 holds this
until its deploy stamp lands, because the deploy ships the current HEAD and this
wave rides the next ship on Nick's word. Composed and pushed browserless; **this
lane launched nothing after its parked run exited** — that exit is the quiet
window, and chat 1's poller takes it.

---

## OFFERED — items 91 + 92 (fully verified)

**Commit `8c1a903`** + the parked-stamp commit that follows it.

## ✅ STAMPS COMPLETE — 2026-08-04, slot 1. MERGE TARGET: branch `fw2-offer` @ `dad280e`.

| | |
|---|---|
| unparked | **55/55 CLEAN** — `tree=dad280e bundle=index-Cib2nzSw.js/525306b` |
| parked | **55/55 CLEAN** — `tree=dad280e bundle=index-Cib2nzSw.js/525306b` |
| `item9192.mjs` | 16 checks; **10/16 red** against the pre-fix bundle; parked 1/1 |
| `tsc` | clean |
| schema | **zero** — no `apps/server` file in the diff |

**Merge `fw2-offer`, not `fw2-boards-and-defaults`.** They differ by exactly one
commit: item 87's code, which is unverified. `fw2-offer` was cut so the stamp
describes precisely the software being merged — note the tree has **no `+Ndirty`
suffix** and the bundle hash is **identical to the earlier green runs**, which is
itself the proof that item 87 is not in the offered bundle.

The `j4` NOVERDICT below is CLEARED: `j4.mjs` passed parked on this re-run, so the
navigate-first fixture fix is no longer unrun — the race is closed by exercise
rather than by argument. The diagnosis is kept below because the species is now
registered and its edges matter.

### The parked run is not clean, and I am not clearing it

`j4.mjs` returned NOVERDICT with
`SecurityError: Failed to read the 'localStorage' property from 'Window'`.
**The known-flake list stays empty — this is a named mechanism, not a flake:**

- `j4.mjs`'s PARKED block calls `localStorage.clear()` as its **first act**,
  before any navigation. It is the only fixture in the suite that does.
- `withHarness` does **not** navigate; it LAUNCHES the browser at `${base}/#/`
  (`runtime-verify.mjs:675`). Until that initial load commits, the document is
  still `about:blank`, and localStorage on it throws exactly this error.
- Every other fixture (`freshDesk`, everywhere) navigates first.
- It is **pre-existing and untouched by this diff** — nothing in this wave goes
  near `j4.mjs`'s subject — and the UNPARKED run of the **identical bundle** had
  `j4` green minutes earlier, which is the signature of a race, not of a product
  change.

**Fixed in this branch** by making the block navigate first, matching every other
fixture. That one-line fixture fix is itself **UNRUN** — the box schedule closed
the window before it could be exercised.

**So the parked stamp for 91+92 is OWED, not claimed.** Chat 1 is holding this
offer until post-deploy anyway; this lane will re-run **both** settings the
moment it has a browser window and return the completed stamp. Merging 91+92
before that re-run would be merging on a half-stamp, and this lane does not ask
for that.

**Registered by Fable** as the *first-parked-act race species*, with two edges
drawn so it cannot over-reach:

- The **b2-1 convergence is a HYPOTHESIS**, not an attribution — its own probe is
  owed first. This lane's data constrains it: `b2-1.mjs` returned **PASS (28
  checks) in all six runs executed here**, unparked and parked, across four
  distinct bundles. No b2-1 symptom is visible from this lane.
- The **original j4 red (`:84` null-click, unset) stays UNATTRIBUTED.** The
  species does not inherit backwards, and this lane adds nothing to it: that
  failure was **never observed in any run made here**. The single j4 red seen
  here is the `:297` parked-block SecurityError — different line, different
  setting, different symptom.

**Box queue (Fable):** post-deploy-stamp this lane goes FIRST — the owed parked
re-run completes this offer — then the SC2 chain. Nothing races.

**Item 92** — the New-page card was written to the store by `pinPageToBoard` and
then erased by BoardEditor's own stale local `boxes` on unmount. The fix appends
the pin to `boxesRef.current` (never a store read as local truth) and assigns the
ref directly, because it is assigned during render and the handler batches its
update with a `navigate` that unmounts.

**Item 91** — an unpaired board's PAGE → opened `backTo`, which is `'/'` for a
system board: Nick's "lands on the Wrizo landing," reproduced verbatim
(`hash=#/`). It now opens a New Page linked back, split by board kind — PIN for a
user board (authored membership), MEMBERSHIP for a system board (derived; a pin
there would be deleted by reconcile), and Trash keeps its exit.

**Two corrections this wave put on the record rather than quietly fixing:**

1. The S0's "the erasure fires on the very `navigate`" was **too strong**. It
   needs an outstanding unsaved edit inside the 2000ms autosave window. The first
   harness draft asserted it on a clean board and **passed against the pre-fix
   bundle** — proving nothing, and saying so.
2. Staging that precondition **falsified this lane's own first fix**, which
   assigned the store's array as local truth and would have preserved the pin
   while silently discarding every unsaved card. One loss traded for another,
   and it would have shipped green against the weaker scenario.

**Parks — three files, not two.** `b2.mjs` (generation 2), `bm1.mjs`
(byte-frozen), and **`cd4.mjs`**, which this lane MISSED on its first sweep: it
asserts the same exit twice and its park section was documented as "an empty
no-op by design." **The full suite found it**, at `[14/55] NOVERDICT`. All parked
sections green: b2 4/4, bm1 2/2, cd4 2/2, item9192 1/1.

---

## NOT OFFERED — item 87 (built, **NOT verified**)

Also on this branch, in its own commit, and **it must not merge with the rest.**

It is complete and `tsc`-clean, with `scripts/harness/item87.mjs` written — but
the box schedule closed the browser window before it could run **even once**.
There is no harness result, no falsification run, and no suite. Under "stamps on
every claim" it has no claim to make. Its commit says so in its subject line.

What it contains, for review while it waits:

- **Clause 1 built ADDITIVELY** — the descriptor gains `mode`, and the door
  declares the room (`?mode=draft`). CD1 S8/A7 stands **unreversed**; Arrival's
  Write door is untouched, and S1(c) is the control that proves it.
- **Clause 2 did not reproduce** — Free Write already yields `kind: 'freewrite'`
  and Structure renders only under `kind === 'draft'`. Asserted from both sides
  rather than "fixed."
- **Clause 3 amends FX2 S2 at one point** — an empty page fell on the ON side by
  arithmetic rather than intent. Only the empty case moves.
- **Parks: none owed**, each candidate checked individually. Free Write never
  calls `seedTypewriterDefault`, so every "fresh page, typewriter ON" record is
  structurally untouched (fx2 both halves, hb2, b1; and fx1's "fresh prose page"
  is a *manuscript*, which opens in Free Write by the pageType branch).
- **One gap found by READING, because running was unavailable:** `modeKey` is
  written only by `switchMode`, so the door's Draft choice was not persisted —
  "New Page lands in Draft" would have been true exactly once, then the next
  visit would reopen the page in Free Write. Closed by persisting the door's
  choice once the page is a room (`!unborn`), which keeps PB1 intact. **The
  assertion for it (S1(d)) is written and unrun.**

**Recommended disposition:** merge 91+92 on the next ship; hold item 87 until
this lane gets a browser window, runs the falsification + both stamped suites,
and returns it as its own offer.

---

## ALSO ON THE RECORD

- **Item 97 NOT ridden** — decline accepted. It carries a product question
  (restore the trashed board vs re-mint and clear the pointer) that is Nick's.
- **Tooling, learned expensively:** stopping a suite mid-run orphans its harness
  browsers and the dirty-machine guard then refuses **every** lane. Recovery
  stayed lawful — the profile dir encodes the launching node PID, so 9 orphans
  traced to owner `25312`, confirmed dead, killed by exact PID. Never
  `--ignore-foreign`, never a by-name sweep. Cheaper: let a doomed run finish.
- **Item 98's guard held:** nothing in this wave touched Railway.

---

## ADDENDUM — 2026-08-17: the stamps were already complete, and still describe the merge

**The park was stale by 21 minutes, not wrong.** Chat 1 parked fw2 at
`2026-08-04 08:08:42` on condition 2 ("the parked stamp is OWED… No completed
green re-run exists on either fw2 branch") — true when written. This lane's
completed re-run pushed at **08:29:41**, 21 minutes later:

| | |
|---|---|
| unparked | **55/55 CLEAN** — `tree=dad280e bundle=index-Cib2nzSw.js/525306b` |
| parked | **55/55 CLEAN** — `tree=dad280e bundle=index-Cib2nzSw.js/525306b` |

`j4.mjs` PASSED parked in that run, so the navigate-first fixture fix has had its
first outing and it was green. Nick's conditional word has therefore been
satisfied since 2026-08-04; acting on it is chat 1's call, not this lane's.

**13 days of main movement did NOT invalidate that stamp, and this was measured
rather than argued:**

- 21 commits landed on `main` since this branch's base `e519854` — **all
  `docs/`-only**. `git diff --stat e519854..origin/main -- apps/` is EMPTY, so
  neither the product code nor the harness files moved.
- Merging current `main` into `fw2-offer` was **conflict-free** (merge `5cdab83`).
- The merged tree builds to **`index-Cib2nzSw.js`, 525306 bytes — byte-identical
  to the stamped bundle.**

So the existing green stamps cover exactly the software a merge produces today.

**The confirming re-run VOIDED on contention, and that is the guard working.**
Slot 1's run aborted at `ab3.mjs` (2/55, zero failures) because 16 foreign
harness browsers appeared MID-RUN: *"Another lane started while this sweep was
running… this run is VOID rather than partly trustworthy."* A live lane
(owner node `3852`) holds the box now. **This lane took nothing back from it and
swept nothing** — the redundant re-measurement is not worth contending for,
because the bundle identity above already establishes the claim.

**Recommendation:** merge `fw2-offer` on the 2026-08-04 stamps plus the bundle
identity proof. If a stamp literally naming the merge tree is wanted anyway, this
lane will run it in the next genuinely quiet window — it would re-measure
provably identical software.
