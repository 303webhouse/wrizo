# ITEM 99 — THE ORPHAN REAPER, OFFERED

**Lane:** errata (harness floor) · **Branch:** `item99-orphan-reaper` ·
**Worktree:** `.claude/reaper`
**Date:** 2026-09-04 · **Standing:** **OFFERED, NOT MERGED.** The branch is
pushed; the merge to `main` is chat 1's act. No deploy of any kind is implied or
asked for.

Branched from `origin/main` @ `1c8edd3`. Ticket: Fable to ERRATA, harness-only.
Charter: the ledger's **ITEM 99 — THE ORPHAN REAPER**, opened 2026-08-03.

**ZERO PRODUCT CODE**, and checkable rather than asserted:

```
git diff --stat 1c8edd3 <tip> -- apps/desktop/src apps/server packages
    (empty)
```

---

## §1 · THE OFFER

| SHA | what it landed |
|---|---|
| `0f14b72` | the reaper module, the run-suite preflight, the withHarness inheritance, `item99.mjs` |
| `d5f5048` | the sweep made non-fatal — a failed reap can never take down a harness run |
| `51eb9b6` | the two unexercised safety paths covered: blind enumeration, and the 54-dir backlog |
| *(this commit)* | this record + the ledger entry |

**`item99.mjs`: 26/26, and it launches no browser.**

**BOTH SETTINGS CLEAN, ONE TREE, NEITHER STAMP DIRTY — 68/68 each:**

```
SUITE DONE HARNESS_PARKED=unset - 68/68 of 68 returned a passing verdict
SUITE RESULT: CLEAN - tree=51eb9b6 bundle=index-BS32INXU.js/556707b
SUITE DONE HARNESS_PARKED=1     - 68/68 of 68 returned a passing verdict
SUITE RESULT: CLEAN - tree=51eb9b6 bundle=index-BS32INXU.js/556707b NO-REBUILD
```

**67 files became 68** — `item99.mjs` is the new one, and it is the cheapest file
in the suite: **2 seconds, no browser.** The parked pass ran `--no-rebuild`
against the byte-identical bundle the default pass tested, so both stamps name
the same software as well as the same tree.

**The preflight logged itself on a quiet box, as it must:**

```
REAPER: 0 harness browser(s), 0 owner(s) —  | dead-owner targets=0
REAPER: nothing to reap.
SUITE START HARNESS_PARKED=unset files=68 tree=51eb9b6 …
```

…and the same facts reached `manifest.json` beside the stamp, machine-readably:
`"reaper": { "enumerated": 0, "reaped": [], "liveOwnersUntouched": [],
"profileDirsRemoved": [] }`. An empty, dated, reviewable record is the honest
one — it is the only thing that distinguishes *"the reaper found nothing"* from
*"the reaper never ran."*


---

## §2 · WHAT IT DOES, AND THE FOUR THINGS THE LAW MADE IT DO

The preflight enumerates browsers holding a `ws-runtime-verify-<pid>` profile,
resolves each owner PID, and reaps **only** those whose owner is verified dead —
logged every run, count/PIDs/owners, including the runs that reap nothing. It
also sweeps stale profile dirs of dead owners. It runs in `run-suite.mjs` before
guard 3 reads the machine, and in `withHarness`, which is where **every** browser
this repo launches comes from — so the probe, `selftest-quiescence`, and any
harness a lane runs directly all inherit it without each entry point having to
remember.

**THE S4 LAW is the constraint, not a preference** — *"a runner's live refusal
outranks metadata; signature-kills are never lawful — sweep only on a
verified-dead owner."* Four consequences, each load-bearing:

1. **Enumerate, then kill by PID.** The signature *finds* candidates; it never
   *decides* them. `taskkill /f` and pointedly **not** `/t` — a tree reaches
   processes the sweep never listed, which is the exact width the law forbids.
   Every process in a browser's tree carries the same profile dir, so they are
   already enumerated in their own right and are reaped as themselves.
2. **A dead owner is the only licence.** Owner alive, owner unresolvable, owner
   is us — all spared. Every uncertain path fails toward *not* killing, because
   a wrong reap destroys another lane's run (presenting as a flake it did not
   earn) while a missed one merely costs this run a refusal.
3. **A count that does not fall means the model is wrong.** The 2026-08-04 harm
   was **not** the dead-owner sweeps — the incident's own author calls those
   defensible. It was **escalating** when the count held. On a mismatch this
   reports and stops, and `run-suite` refuses.
4. **The refusal survives the reap.** Corpses only. One live-owner browser still
   blocks the run, and should.

**On PID recycling — the subtle half.** *"The owner PID does not name a live
process"* and *"this browser is an orphan"* are different claims, and the
incident record is explicit that treating the weaker as the stronger is what
went wrong. This is safe in the direction that matters: a recycled PID reads
**alive**, so a corpse is *missed* (costing a refusal), never a live run killed.
The reverse error — a running process absent from the process table — is not
reachable.

---

## §3 · IT WAS TESTED LIVE BY ACCIDENT, AND BETTER THAN ANYTHING I STAGED

While I was building, **item 112-A's suite was running on this box with sixteen
harness browsers under one owner** — the exact shape of the 2026-08-04 incident,
which faced sixteen browsers under owner `23588` and escalated.

```
REAPER: 10 harness browser(s), 1 owner(s) — 44044:alive | dead-owner targets=0
REAPER: profile dirs — 1 found, 0 removed (owner verified dead, unheld), 1 kept.
  kept ws-runtime-verify-44044 — owner 44044 ALIVE
REAPER: nothing to reap — 10 browser(s) belong to LIVE owner(s) 44044 and are untouched.
SUITE REFUSED: 10 harness browser process(es) on this machine were not spawned by this runner.
  browserPid=39440 ownerNodePid=44044
  … (ten of them)
EXIT=2
```

**Reaped 0. Spared all of them. Kept the profile dir. Then refused this run.**
Item 112-A finished undisturbed. That is clauses 2 and 4 working together on a
real machine against a real lane, which is not a thing I could have arranged
safely on purpose.

---

## §4 · HOW IT IS VERIFIED WITHOUT TAKING THE BOX

`item99.mjs` **launches no browser**, deliberately. A reaper whose safety can
only be demonstrated by killing real browsers on a shared box is a reaper whose
safety is never demonstrated — nobody runs that test, and the once someone does,
it is on a machine holding another lane's suite.

So the **kill decision is a pure function** (`selectReapTargets`) driven by
fabricated tables, and `reapOrphans` takes `enumerate`/`kill` seams so the
stop-and-report clause is exercised deterministically:

- **S1** — dead owner targeted (all three of its browsers); live owner spared;
  unresolvable owner spared; our own PID spared *even if the liveness probe lies
  about us*.
- **S2 (the guard on the guard)** — a box holding **only** live-owner browsers
  yields **zero** targets. This is the check that fails if a later hand
  "improves" the reaper into something that clears the board so a blocked run
  can proceed — precisely the temptation that caused the incident.
- **S3** — liveness fails safe: a genuinely dead PID (a child spawned and reaped
  by the test, not a guessed number) reads dead; `0`, `-1`, `NaN`, `1.5`,
  `undefined`, `null` all read **alive**.
- **S4** — real dirs in the real temp dir: dead owner's dir removed, live
  owner's dir survives, a dir with no resolvable owner untouched, and the sweep
  logs itself even with nothing to reap.
- **S5** — asserted against the module's own source: `/f` and never `/t`, and no
  `Stop-Process` anywhere. The failure this guards is a future hand adding a
  wider instrument back under deadline pressure — the 2026-08-04 sequence.
- **S6** — the preflight sits *before* guard 3; guard 3 is unweakened; the
  withHarness gate and the runner's flag both present; the enumerator is
  single-sourced; and a reaper failure cannot take down a harness run.
- **S7** — the stop-and-report clause **exercised**: a kill that claims success
  but changes nothing produces `mismatch: true`, each target attempted exactly
  **once**, no re-sweep, no widening — plus a control proving this is not a
  reaper that always cries wolf.

---

## §5 · THREE THINGS CHAT 1 SHOULD RULE ON, NOT DISCOVER

**(a) I could not find the reference shape.** The ticket names *"the sweep logic
chat 1's hardened loop uses"* as the reference. **There is no committed artifact
for it** — no `.ps1`/`.sh`/loop script anywhere in the tree, and nothing in
`docs/` describing its internals. I built instead from the three authoritative
*committed* sources: item 99's ledger charter, `docs/menus/incident-2026-08-04-s4.md`,
and the ratified S4 LAW. **Please diff mine against the loop's** — the decisions
where a divergence would actually matter are: whether the loop uses `/t`
(mine deliberately does not), whether it sweeps dirs held by a live owner (mine
does not), and whether it treats an unresolvable owner as dead (mine treats it
as alive).

**(b) I made the runner MORE refusing in exactly one case, deliberately.** A
post-sweep count mismatch now refuses, and **`--ignore-foreign` does not
override it**. Reasoning: "run anyway" at that precise moment is the reflex that
cost another lane a suite, so the one escape hatch the incident proves dangerous
is the one I closed. It is one line to reopen if Fable disagrees; I would rather
be told than assume.

**(c) Every standalone harness run now sweeps.** A lane running one harness
directly will see `REAPER:` lines on **stderr** (never stdout — a harness's
stdout is its verdict and the runner scans it), and may remove *another* dead
lane's stale profile dirs. That is the ticket's "every lane inherits it", stated
plainly so nobody meets it as a surprise. Opt-outs: `--no-reap` on the runner,
`WS_NO_REAP=1` in the environment.

---

## §6 · WHAT I DID NOT DO

- **No product code.** `apps/desktop/src`, `apps/server`, `packages` untouched.
- **No mass sweep of TEMP.** `withHarness`'s standing note declining one is
  **refined in place, not overturned**: a live run's dir is still untouchable,
  and the liveness test is exactly what tells the two apart. The note now says
  so, so the next reader does not find code contradicting a comment.
- **No change to `killOwn`.** The runner's per-child timeout sweep still uses
  `/t` on **its own** child, which is lawful and out of this ticket's scope.
- **No orphans reaped by hand.** The only sweeps this lane performed were the
  reaper's own, under its own rules, logged above.

---

## §7 · THE ASK

**Offered to chat 1. Held for review.** One branch pushed, nothing merged,
nothing deployed. Rulings wanted on §5(a), (b) and (c).

---

## §8 · THE RULINGS — RATIFIED 2026-09-05 (Fable, chat 1 reading)

All three returned ratified. Two needed no code. **One did, and it was a real
gap in what §5 offered**, so it is recorded here rather than folded away.

### RULING 1 — there was nothing to diff against, and this is now the canonical shape

Chat 1's hardened loop was **session-local and never committed**, which by the
house's own law (*chat-only = lost*) makes **this runner preflight THE CANONICAL
SHAPE, not a copy of one.** Chat 1 retires its loop in favour of it and records
any divergence as a one-line note rather than a competing implementation.

The three decisions §5(a) offered as conservative defaults are **ratified**:

| decision | ruled |
|---|---|
| an **unresolvable** owner | **SPARED and REPORTED** — unknown ≠ dead |
| **live-owner profile dirs** | **KEPT** |
| **tree-kill** | applies **only** to a verified-dead owner's own browser tree |

**► THE GAP THIS EXPOSED, AND THE FIX (`3d2bd6a`).** `ownerAlive` returned a
**boolean**, so a verified-alive owner and an owner that could not be resolved at
all came out **identical** — both logged `<pid>:alive`. Sparing unknown was
already true; **reporting it was not.** A reader seeing "alive" was being told
the sweep had resolved something it never resolved, and on the strength of that
one word a corpse could pass as another lane's live run indefinitely.

Fixed **at the contract, not the log line**. `resolveOwner` is now **tri-state**
— `alive` | `dead` | `unknown` — because the machine has three cases and
flattening them is the defect itself:

- `ESRCH` → **dead**. The only answer that licenses a reap.
- `EPERM` → **alive**. The process demonstrably exists; we simply may not signal it.
- unparseable pid, or any other error → **unknown**.

`ownerAlive` survives as the one-bit predicate the sweep gates on (anything not
verified dead is spared), kept beside `resolveOwner` because the two answer
different questions: *"may I reap this?"* — one bit, and it must fail safe — and
*"what do I actually know about this owner?"* — three states, and the report must
not flatten them.

**Reported everywhere a reader looks:** the roster token
(`alive`/`DEAD`/`UNKNOWN`), a dedicated line naming unresolvable owners and
stating that unknown is not dead, the profile-dir keep-reason, and
`manifest.json`'s new `unknownOwnersSpared` so two runs can be diffed on it.

**On tree-kill.** The ruling sets a **ceiling**, and this file stays strictly
inside it by using **no tree-kill at all**: every process in a verified-dead
owner's tree carries the same profile dir, so the enumeration already lists each
one and each is reaped as itself. Same outcome, narrower authority. That is now
written into the module's law section so a later reader does not mistake the
absence of `/t` for ignorance of the ruling.

### RULING 2 — the harder refusal stands

A post-sweep count mismatch is **not overridable by `--ignore-foreign`**, for the
reason offered: *"run anyway"* at that moment is the reflex that caused the
incident. Fable's own formulation, now recorded in the module: **a runner that
cannot trust its own count of the machine must not stamp anything.** No code
change; the ratification is written down beside the behaviour.

### RULING 3 — default-on sweeping stands, and the opt-outs get their charter

Verified-dead-only, logged to **stderr** every run. `--no-reap` and
`WS_NO_REAP=1` are **kept and now documented in the runner's own usage header
for their one honest use: PRESERVING A DEAD RUN'S BROWSERS AND PROFILE DIRS FOR
FORENSICS.** When you are diagnosing why a run died, the corpses *are* the
evidence, and the reaper would collect it before you could read it. They are
**not** a way past a refusal — the refusal is not what they turn off, and the
mismatch refusal is not overridable at all.

### VERIFICATION AFTER THE RULINGS

`item99.mjs` **29/29**, still browserless. The tri-state is proven at **both**
levels, because the ruling is about what a reader sees and not only about what
the function returns:

- the pure function reports `unknownOwners` and keeps them out of `liveOwners`;
- an **end-to-end** run with a genuinely unresolvable owner (`0`) names it on its
  own line, while an injected kill that **throws if called** proves nothing was
  reaped on it.

**RE-STAMPED AFTER THE RULINGS — BOTH SETTINGS CLEAN, 68/68 each, one tree,
neither stamp dirty:**

```
SUITE DONE HARNESS_PARKED=unset - 68/68 of 68 returned a passing verdict
SUITE RESULT: CLEAN - tree=3d2bd6a bundle=index-BS32INXU.js/556707b
SUITE DONE HARNESS_PARKED=1     - 68/68 of 68 returned a passing verdict
SUITE RESULT: CLEAN - tree=3d2bd6a bundle=index-BS32INXU.js/556707b NO-REBUILD
```

`manifest.json` now carries the new field beside the stamp:
`"reaper": { "enumerated": 0, "reaped": [], "liveOwnersUntouched": [],
"unknownOwnersSpared": [], "profileDirsRemoved": [] }`.

**► ONE RUN WENT VOID ON THE WAY HERE, and it is worth recording as a success
rather than hiding as noise.** The first re-stamp aborted at file 57 of 68:
eleven foreign browsers appeared mid-run under owner `52852`, and the runner
declared the result **VOID** rather than partly trustworthy. Zero of the 56 files
that had run failed, and `item99.mjs` passed 29/29 inside it. That is the
mid-run guard doing precisely its job — *a sweep cannot be half-clean* — so the
answer was to run it again whole rather than salvage it.
