# ITEM 140 — THE GRANT IS A FILE ON THE BOX · THE CONTRACT BETWEEN THE TWO HALVES

**Lane:** errata · **Branch:** `item140-grant-file` (pushed) · **Built browserless,
in parallel with the box queue.** Only its pair needs a slot.

**Standing:** **OFFERED, NOT MERGED — AND NOT MERGEABLE ALONE.** See §3, which is
the most important section in this document.

---

## §1 · WHAT IT CHANGES, AND WHY 139 WAS NOT ENOUGH

Item 139 moved the turn refusal into `withHarness`, so every browser crosses it.
But all it could ask was whether `WS_BOX_TURN` was **set** — and:

- a token that is merely present is a token any shell can invent; and
- **a token exported during a turn that has since ENDED keeps working forever.**
  The environment remembers what the box has forgotten. A lane that finished at
  noon could open a browser at midnight and 139 would agree.

The grant is now a **file**. Chat 1 writes it at the announcement and clears it
at the stamp. The lane exports the token it was given. `withHarness` and
`run-suite` refuse unless the exported token **matches the file**. The instant
chat 1 clears, a stale token fails — **that is the entire difference between
this and 139 with extra steps**, and `item140.mjs`'s check 6 is the thing that
says so rather than the thing that assumes it.

**NO EXPIRY, deliberately.** A pair can run for an hour. A guard that refused
mid-run because a clock passed would void a legitimate run at its most expensive
moment. The **forgotten clear** is the hazard instead, and it belongs in chat 1's
half — where the act that ends the turn ends the grant.

---

## §2 · THE PATH, SETTLED AS A CONSTANT RATHER THAN A CONVENTION

```
apps/desktop/scripts/box-grant.mjs   →   export const GRANT_PATH
                                                 = ~/.wrizo/box-turn.json
```

**Both halves import `GRANT_PATH` from that module.** Neither half spells a path.
Two halves that each spell one agree until the day one of them is edited; two
halves that import one constant cannot disagree at all — which is what "one fixed
path both halves compile in, never a convention" has to mean to be worth saying.

It lives under the user's home, **outside every worktree**. A worktree isolates
FILES, and the grant is the one fact that must not be isolated: the box is one
machine with one browser pool, and every lane's checkout must read the same file.
A grant inside a worktree would grant the turn to a directory instead of to the
box. `item140.mjs` asserts this as a property, not a comment.

---

## §3 · THE MERGE HAZARD — READ THIS BEFORE MERGING

**ABSENT REFUSES EVERYTHING.** That is the design and it is correct: no file
means no turn is granted to anyone. It also means that **the moment this merges,
every harness run and every suite on this box refuses until a grant file
exists.**

So the two halves **must land together**, or chat 1's writer must already be
writing the file before this merges. Merging this alone closes the box for every
lane — INK, PW2, TOOLS, FIX and this one — and the symptom will be a clean,
correct refusal that nobody asked for.

**The unblock, if it is ever merged alone or a grant is lost mid-queue,** is one
line from any checkout:

```
node -e "import('./apps/desktop/scripts/box-grant.mjs').then(m=>m.writeGrant('<lane>','<token>'))"
```

That is a recovery, not a workflow: a lane writing its own grant is a lane
granting itself the box, which is the thing the file exists to prevent. It is
written down because an undocumented recovery is how a guard gets deleted at 2am.

---

## §4 · CHAT 1'S HALF — THE EXACT SURFACE

```js
import { writeGrant, clearGrant, GRANT_PATH } from './apps/desktop/scripts/box-grant.mjs';

writeGrant('errata', 'errata-wave3-20260916');  // at the announcement
clearGrant();                                    // at the stamp — put this IN the stamp sequence
```

- `writeGrant(lane, token)` writes `{ lane, token, time }` and returns the path.
  `time` is informational; **nothing reads it to decide anything**, because there
  is no expiry. It writes the file whole, so a reader never sees half a grant.
- `clearGrant()` returns `true` when no grant remains. It is **idempotent** —
  clearing an already-cleared grant is success, because the state it asserts
  ("no turn is granted") is true either way. So a stamp sequence that clears
  twice is harmless, and one that clears after a crash is still correct.

Both are tested against **this lane's own matcher**, not against each half's
separate idea of the format (`item140.mjs`, the real-path round-trip). That
round-trip **skips loudly** if a grant is live, rather than clearing a turn in
flight.

---

## §5 · WHAT IS PROVEN — NOW ALL OF IT

**`item140.mjs` — 13/13, browserless** (12 when first offered; the thirteenth pins
the grant shape chat 1 actually writes, §6). Refusals for: no token, empty token
(`export WS_BOX_TURN=` produces one by accident), no grant file, token mismatch
*naming the lane that holds it*, unreadable grant, a grant with no token, and a
grant containing literal `null` — which parses cleanly and is the shape that
slips past a bare `try/catch`. Plus the control (a match is ALLOWED and reports
the lane), so the refusals are a matcher rather than a wall, and check 6, the
stale-token case.

**Proven live, without opening a browser** (the guard throws first): `withHarness`
refuses with no grant file, and refuses naming the holder on a mismatch.
`run-suite` refuses at **exit 3, before the rebuild** — so an ungranted sweep
costs one clear stop instead of a build nobody wanted and 85 children refusing
one at a time. That last one is proved by *running* the runner, in `item140.mjs`,
with a token that cannot match any grant.

**NOW PROVEN BY THE BOX: the ALLOW path through `withHarness` end to end** — §6.
This section previously listed it as the one thing only a pair could prove. The
pair proved it: every one of the 78 browser harnesses crossed `withHarness`'s
grant check with a matching token and opened a real browser, on both legs.

---

## §6 · THE STAMP — 140's GATE PAIR

**Both legs, same tree, same bundle, no re-roll.** Tree `ac19cc7` contains
`origin/main` @ `827dacd`. Roster **87** = main's 86 + `item140`.

```
SUITE DONE HARNESS_PARKED=unset — 87/87 of 87 returned a passing verdict
SUITE RESULT: CLEAN — tree=ac19cc7 bundle=index-BuX8s8NA.js/582706b

SUITE DONE HARNESS_PARKED=1 — 87/87 of 87 returned a passing verdict
SUITE RESULT: CLEAN — tree=ac19cc7 bundle=index-BuX8s8NA.js/582706b NO-REBUILD
```

**THE ALLOW PATH, OBSERVED ON BOTH LEGS** — the runner's own first line, each time:

```
BOX TURN: granted to lane "ERRATA" — token matches the grant file.
```

**THE PARK COUNT, AUDITED:** `item139` ran **2** parked checks against **2** `pok()`
calls in its source. `item140` parks nothing and defines no `pok()`.

**THE GRANT FILE was read back unchanged after the pair**, and `item140.mjs`'s
real-path round-trip **skipped** on both legs, as designed, because a turn was
live — the self-test never clears the grant for the turn it runs inside.

### It took two pairs, and the first was red

| pair | tree | verdict | what it found |
|---|---|---|---|
| 1 | `d641ec7` | **NOT CLEAN** 85/87; parked leg never ran | `item139` (mine) and `m3` (not 140's) |
| 2 | `ac19cc7` | **CLEAN / CLEAN** 87/87 | the stamp above |

**`item139` — MY DEFECT, AND A SEARCH I OWED BEFORE THE PAIR.** 140 changed what
"a granted turn" means, from *set* to *matches the file*. `item139`'s S2 and S3
granted the turn with the literal string `'granted'` — a grant under 139, a
mismatch under 140 — so both were refused before reaching what they assert. I
had re-checked `item140` and never looked for the test written against the old
rule. Both parked verbatim; the replacements grant with the inherited token; S2b
proves the old string is now refused. The search, done afterwards across every
tracked `WS_BOX_TURN` reference, found `item139` to be the only such test, and
one stale comment in `runtime-verify.mjs`, corrected.

> **A RULE CHANGE BREAKS THE TESTS WRITTEN AGAINST THE OLD RULE — SEARCH FOR THEM
> BEFORE THE PAIR, NOT IN IT.**

**TWO DEFECTS CAUGHT BEFORE THE FIRST PAIR, rather than by it:** `box-grant.mjs`
lived in `scripts/harness/`, whose every `.mjs` the runner executes as a test —
it would have run a module with no verdict line and reported NOVERDICT. It lives
in `scripts/` now, beside the other shared modules. And chat 1's grant was
written as `{ lane, token, granted }` rather than through `writeGrant`'s
`{ lane, token, time }`: the path matched and the format drifted. Only `token`
decides, so the match was safe, but a refusal would have printed "granted
undefined"; the timestamp is now read under either name, and `item140` pins the
shape actually in use. **Chat 1's half should import `writeGrant`** — a shared
module prevents the drift only if both halves use it.

---

## §7 · `m3` — FOR A NUMBER, WITH THE EVIDENCE

Pair 1's other red was `m3.mjs`'s **ROAMS** check (*"the saturated live ground
ROAMS — its rendered extent reaches near all four stage margins"*): `minY` 248 of
a 733px stage, so the field never reached the top margin.

**It is not 140's, and that is measured, not argued.** 140 changes no file under
`apps/desktop/src/` and no build input, and `index-BuX8s8NA.js/582706b` is the
exact bundle — same hash, same byte count — that item 126's pair stamped CLEAN on
main.

**The evidence that it is a real, recurring defect,** on that one fixed bundle:

| run | bundle | `m3` ROAMS |
|---|---|---|
| item 126's pair (main, `17a89ac`) | `index-BuX8s8NA.js/582706b` | **pass** |
| 140 pair 1, default leg (`d641ec7`) | `index-BuX8s8NA.js/582706b` | **FAIL** (`minY` 248) |
| 140 pair 2, both legs (`ac19cc7`) | `index-BuX8s8NA.js/582706b` | **pass**, **pass** |

**The product was held constant and the verdict moved.** That is the
single-`Date.now()`-seed variance already recorded against this check
(`RhizomeField.tsx`'s live seed), now observed flipping on a byte-identical
bundle. Per the 2026-09-16 ruling it stops being *"main's own known variance"*
and should carry a **number** as an open defect — the known-flake list has been
empty all arc, and an unnamed recurring red is how that list fills by default.
The fix belongs to the Rhizome desk, not here: a multi-seed sweep, the live seed
pinned behind a harness seam, or a bound that the tail cannot cross.

**No third pair was run.** Pair 2 was a re-run after a real fix (`item139`), not
a re-roll; its `m3` pass is the variance landing on the other side and clears
nothing.

---

## §8 · THE ASK

**THE MERGE, gated as ruled.** The pair is spent and CLEAN on both legs (§6), so
the allow path — the one part of this item reading could not prove — is proven
by the box.

**Still true, and still the most important sentence here: this half lands WITH
chat 1's writer, never before it** (§3). Absent refuses everything; merged alone,
it closes the box for every lane.

**Two asks of chat 1's half:** import `writeGrant` rather than writing the JSON by
hand, so the format cannot drift again (§6); and put `clearGrant()` in the stamp
sequence, since no expiry makes the forgotten clear the hazard (§1).

**And one for the ledger:** `m3`'s ROAMS check, for a number (§7).

*(This section previously asked for the pair itself. It took two: the first
found a test written against 139's rule that I should have searched for before
it, and a timing variance that is not 140's.)*
