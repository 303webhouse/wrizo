# ITEM 99 — THE AGE FLOOR AND THE PRECONDITION, OFFERED

**Lane:** errata · **Branch:** `item99-age-floor` · **Worktree:** `.claude/agefloor`
**Date:** 2026-09-07 · **Standing:** **OFFERED, NOT MERGED.** One branch pushed;
the merge is chat 1's act. No deploy implied, and no `railway` command has been
run from this lane.

Branched from `origin/main` @ `4ba3670`. Two rulings, in order: the **AGE FLOOR**
(from INK's live observation) and then the **PRECONDITION** (adopting my third
signal as the gate in front of both licences rather than as a third licence).

**MY CHANGE SURFACE IS THREE FILES, ALL HARNESS INFRA, ZERO PRODUCT CODE:**

```
git diff --stat 4ba3670 HEAD -- apps/desktop/src apps/server packages
    (empty)

apps/desktop/scripts/harness/item99.mjs  | 178 +++-
apps/desktop/scripts/orphan-reaper.mjs   | 292 +++++-
apps/desktop/scripts/run-suite.mjs       |   7 +
```

---

## §1 · THE STAMP — AND IT IS NOT A CLEAN PAIR, SAID FIRST

```
SUITE DONE HARNESS_PARKED=unset - 74/74 of 74 returned a passing verdict
SUITE RESULT: CLEAN     - tree=fc09178 bundle=index-DOYnMkS6.js/558457b
SUITE DONE HARNESS_PARKED=1     - 73/74 of 74 returned a passing verdict
SUITE RESULT: NOT CLEAN - tree=fc09178 bundle=index-DOYnMkS6.js/558457b NO-REBUILD
  FAIL: bm1.mjs
```

**Default CLEAN. Parked NOT CLEAN, one red: `bm1.mjs`.** It is named, reproduced,
and attributed below. **`item99.mjs` passes 41/41 in BOTH settings** and parks
nothing.

**I have not re-run the parked pass to look for a green, and I will not.** I know
the rate — roughly one in two — so a green re-run would be a lucky sample
presented as a result, and "passes in isolation" and "the machine was quiet" are
both retired as clearance arguments in this house. The pair above is the pair.

---

## §2 · THE RED: `bm1.mjs` S2 orphan — MEASURED, ATTRIBUTED, AND NOT MINE

**The failure:** `S2 orphan: a paired board is off the Shelf; deleting its page
orphans it onto the Shelf, nothing cascades` — `before=false after=false
paired=false`.

**It is a known signature, and `bm1.mjs` documents it in its own header**, from a
DIFFERENT tree, earlier the same day:

> *"The S2 orphan check failed exactly that way once (parked run at `6d7cdec`,
> 2026-09-07: **before=false after=false paired=false**) … a race in the READ,
> not a defect in the product."*

That is my failure detail character for character. A repair was landed for it
(`0bd5ef4`, a bounded 4000ms `settle` poll on the derived read) and **that repair
is present in my tree and is insufficient.**

### What I measured, rather than argued

| evidence | result |
|---|---|
| `bm1.mjs --parked`, my tree, **quiet box** | **2 pass / 2 fail** |
| the same **with `WS_NO_REAP=1`** — my reaper never loads or runs | **3 pass / 3 fail** |
| **combined** | **5 failures in 10 runs (~50%)** |
| the orphan scenario in isolation, 8 consecutive iterations | **8/8 correct** |
| the derived read polled to 15s on a passing run | correct at t≈0 and stable throughout |

**Attribution is settled by the second row.** `WS_NO_REAP=1` means
`withHarness` never even dynamically imports the reaper, and a standalone harness
run does not involve `run-suite.mjs` at all — so in those six runs **none of my
changed code is in the process**, and it still fails at the same rate. Under the
suite the exclusion is stronger still: `run-suite` sets
`WS_REAPER_PREFLIGHT_DONE=1`, so my reaper is skipped for every one of the 74
files; the only code of mine that executes is one preflight before file 1.

### And the earlier diagnosis does not survive the measurement

The header calls it *"a race in the READ, not a defect in the product."* Two
findings sit against that, and both are handed on rather than acted on:

1. **The read is already guarded** by a 4000ms bounded poll and still returns
   `false` — so if it is a race, it is one that outlasts four seconds, which is a
   different claim from the one that was fixed.
2. **The product orphans correctly, every time, in isolation** — 8/8, with the
   board unpaired and on the Shelf at t≈0 and stable to 15s. So the fault is not
   in orphaning; it is something about `bm1`'s own accumulated fixture state by
   the time that block runs (it has already seeded and paired
   `bm1-eboard`/`bm1-epage` and more).

**I did not fix it.** It is not this ticket, it is another lane's fixture, and
repairing someone's fixture from inside an unrelated offer is how a red gets
quietly absorbed instead of owned. **Recommended: its own item.** The
known-flake list is EMPTY by standing law — *"a red suite means something is
wrong"* — so a measured 50% non-determinism needs an owner, not a shrug, and
this one has now defeated one repair already.

---

## §3 · THE AGE FLOOR (ruled from INK's observation)

**The dead-owner licence is necessary, not sufficient.** On Edge, harness
browsers thirty seconds old reported their owner GONE **while a foreign suite was
actively running them** — detached parentage reads as death. So the single test
this reaper was built on can be confidently wrong about a live run.

**Two licences, both required: verified-dead owner AND stale age.**

**Why five minutes — measured, not picked:**

| | |
|---|---|
| longest per-file browser lifetime, 278 file-runs across four stamped suites | **81s** (`fx5.mjs`) |
| median / p95 | 20s / 53s |
| the probe, one browser for its entire 9-cell matrix | **39s** |
| INK's observation — the failure this closes | **30s** |

Five minutes is **3.7× the longest life ever measured here** and 10× the
observation — and deliberately no larger, because every extra minute is one a
genuine orphan keeps every lane's guard refusing, which is the cost this reaper
exists to remove.

**Falsified as ordered, and the control is what makes it mean anything:**

- `30s`, dead owner → **SPARED** (`youngSpared: 2`) — INK's exact case
- `360s`, same dead owner → **REAPED** (`targets: 2`) — the floor delays a
  corpse, it does not immunise one
- exactly `300s` → reaped, so the boundary is **inclusive and stated** rather
  than an off-by-one anyone has to guess
- unreadable age → **spared** — an age we failed to read is the same kind of
  not-knowing as an owner we failed to resolve

**The floor reaches the profile dirs too** — an extension beyond the letter of
the ruling, made for its identical reason and flagged rather than slipped in:
`withHarness` clears its dir and THEN launches, so a live run mid-launch owns a
dir with no browser yet to hold it, and a dead-reading owner would delete the
profile out from under a browser that is starting up. The cost of waiting is
~nil, because `withHarness` clears its own dir on the way in, so a stale dir
standing five minutes longer harms no later run.

---

## §4 · THE PRECONDITION (your sharpening of my third signal)

Adopted **not as a third licence but as the gate in front of both**: when any
foreign `run-suite` / harness / probe process is alive, the reaper reaps
**nothing** and reports *"live run present — box is theirs."* Only on a box with
no live foreign run do the two licences decide anything at all.

**It closes the age floor's residual gap,** which a floor alone could not: a
pathological file that outruns the floor **keeps its suite alive**, so its
browsers are never reapable however old they look. Age bounds how long a corpse
waits; this bounds whether the question is asked. A live run is now safe from
this reaper by two independent facts, **neither of which trusts the owner PID** —
the reading INK proved untrustworthy.

**"Foreign" is computed, not assumed:** self plus every ancestor, so `run-suite`
calling this from its own preflight does not detect itself and refuse to ever
sweep, and a harness reached through `withHarness` does not detect the suite that
spawned it. The parent walk is bounded, so a cyclic parent map cannot hang it.

### ► A defect I built, which only measuring caught

The first cut matched any process whose **command line mentioned** these paths —
which matched the agent's own shell wrappers. A `bash -c "... node
scripts/harness/x.mjs ..."` **is not a run, it is a sentence about one.** The box
looked permanently busy, and the reaper would have been **disabled entirely and
silently, in the guise of being careful.** That is the worst failure available to
a guard: reporting a safety it is not providing. Narrowed to actual node
processes; measured before and after — **5 matches → 2**, and the two are a real
foreign suite and its child.

**Falsified as ordered, with its control:**

- quiet box, dead owner, `360s` → **REAPED (2)** — both licences hold
- **live foreign run, the same pair → REAPED ZERO** — the gate outranks the licences
- unreadable process table → reaps nothing (undeterminable is "present")
- **precondition omitted → reaps nothing** — the parameter defaults to `null`, so
  a caller who forgets fails safe rather than silently authorising a sweep

**Detection proved separately from decision,** because detection is the half that
rots silently: a real node process running a harness-signature script — spawned
in TEMP, never in `scripts/harness` where the runner would enumerate it — **is
seen**, and this process **never sees itself**.

---

## §5 · WHAT I DID NOT DO

- **Did not fix `bm1.mjs`** — not this ticket; recommended as its own item.
- **Did not re-run the parked pass for a green.** I know the rate.
- **Did not build a third licence.** The gate was ruled; the licences are two.
- **No product code**, no merge, no deploy.

---

## §6 · THE ASK

**Offered to chat 1. Held for review.** One ruling wanted beyond the merge:
whether `bm1.mjs`'s S2 orphan non-determinism opens as its own item, and who
owns it. My recommendation is yes and the board lane — it has already defeated
one repair, and the standing law that the flake list stays empty means it cannot
simply be lived with.
