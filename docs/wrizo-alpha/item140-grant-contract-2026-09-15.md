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

## §5 · WHAT IS PROVEN, AND THE ONE THING THAT IS NOT

**`item140.mjs` — 12/12, browserless.** Refusals for: no token, empty token
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

**NOT YET PROVEN: the ALLOW path through `withHarness` end to end** — that a
matching grant lets a real browser open. `checkGrant` returning `ok` for a match
is proven, and the wiring is `if (!verdict.ok) throw`, but the house standard is
that a thing is proven by the box rather than by reading. **That is what 140's
pair is for**, and it is the only part of this item that needs a slot.

---

## §6 · THE ASK

A slot for the pair, between INK and PW2 as ruled — and **a merge that lands this
with chat 1's half, never before it** (§3).
