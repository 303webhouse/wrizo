# PW2 — NESTING AND TRANSFER (items 128 + 123 + 134's rider (a)), OFFERED

**Lane:** pw2 · **Branch:** `pw2-nesting-transfer` · **Worktree:** `.claude/worktrees/pw2-nesting-transfer`
**Date:** 2026-09-17 · **Standing:** OFFERED, NOT MERGED. The merge is chat 1's act.
No deploy implied; no `railway` command has been run from this lane.

Cut from `origin/main` @ `f12c318`, with `origin/main` merged in twice for the
stamps — `eb7a29d`, then **`a3ffdb4`** for this pair.

**STAMPED AT `8f5af65`.** This record commits on top of that, so the branch head is
one docs-only commit ahead of the stamped tree — stated rather than left to be
inferred.

---

## §1 · THE STAMP — A CLEAN PAIR, AND IT IS THE SECOND ONE

```
SUITE DONE HARNESS_PARKED=unset — 90/90 of 90 returned a passing verdict
SUITE RESULT: CLEAN — tree=8f5af65 bundle=index-DfFOCr6L.js/586771b
SUITE DONE HARNESS_PARKED=1     — 90/90 of 90 returned a passing verdict
SUITE RESULT: CLEAN — tree=8f5af65 bundle=index-DfFOCr6L.js/586771b NO-REBUILD
```

Same tree SHA and same bundle both legs, no `+Ndirty`. `pw2.mjs`: **PASS (24
checks)**, identical in both.

**THE FIRST PAIR WAS RED, AND IT IS REPORTED RATHER THAN REPLACED.** On tree
`623ba30`: default 88/89 with `pw1.mjs` red; parked with `ab4.mjs` and `pw1.mjs`
red. `pw2.mjs` itself passed 24/24 in both legs of that pair too, which is what
verified the four harness fixes it was carrying. §5 names the cause — it was
mine.

---

## §2 · S0 — WHAT THE SURVEY FOUND BEFORE ANYTHING WAS BUILT

**(a) NESTING ALREADY WORKED.** `pinPageToBoard` guarded exactly three things —
self-pin, a system-kind SOURCE, and that the TARGET is a board — and **never the
source's `pageType`**. So a board was already pinnable onto a board, carried by
the existing `page-pin` box. S2 is therefore chrome, not plumbing; travel needed
no code at all, because `travelToEntry → routeForEntry` already resolves a board
and already passes `fromBoardId`/`fromBoardTitle`.

**And more was live than the brief assumed:** `BoardEditor` mounts the cascade
with the board as subject, so a board's `BOARDS CONNECTED` zone already listed
its parent boards. Only the drawer caption was genuinely new.

**(b) NO CYCLE GUARD EXISTED.** With (a), A-in-B-in-A was reachable. One guard
existed and was **not reusable**: `boardStructure.ts`'s `wouldCycle` walks BM1's
OUTLINE nesting via `parentId` *within one board's boxes* — a different graph
wearing a similar name. Its SHAPE is the precedent; its edges are not.

**(c)** PW1's surfaces were present and unchanged.

---

## §3 · WHAT WAS BUILT

**S1 · THE GUARD — one seam, three laws, no mode flag.** The no-mode-flag shape
came from a measurement, not a preference: exactly TWO sites create a `page-pin`
box — `pinPageToBoard` (authored) and `placeNewCards`, whose single caller is
`reconcileSystemBoard` (derived). The derived path never routes through the
guard, so the guard never has to tell authored from derived.

- **Law 1 — the source resolves to a LIVE, PINNABLE ENTRY.** Item 134's rider (a)
  in its positive form, and the positive form is the point: a negative
  `if (isDrawer)` would never fire, because a Drawer is not a `JournalEntry` and
  never arrives typed as a drawer — it arrives as an id that resolves to nothing.
  **The guard is about what the id IS, not what it is called.** This makes the
  rider true by construction and closes the wider hole underneath it: before it,
  any foreign id wrote a `page-pin` pointing at nothing.
- **Law 2 — the target is a board the writer may author onto.** The built guard
  checked `getSystemKind` on the SOURCE only; that asymmetry was never
  intentional, just the half B1 needed.
- **Law 3 — no cycle, walked at EVERY write.** A membership lawful when made
  becomes a cycle later when its parent nests somewhere new, so a
  first-write-only guard is exactly the guard that misses its own case.

**ONE WALKER, and the `seen` set is read safety rather than tidiness:** a graph
can arrive ALREADY CYCLIC through sync from an older client, and a walk without
`seen` does not report that cycle — it HANGS. It is a DAG walk, not a chain walk.

**S2 · NESTING.** The board-card teaches its kind by GEOMETRY and spends no
accent — a doubled edge, the job Pass 5 had routed to item 96 as
colour-as-kind-signal. Badge reads `Board` (CA1). Menu twin (PW22) grows only
where a press would not already travel. The nest chain in the crumb keeps the
recursive container's own test passing: **the address stays one line and the way
back stays one press at any depth.** `boardNestChain` is the ordered sibling of
the guard's walker, so an already-cyclic graph renders a SHORT crumb instead of
hanging the surface.

**Nick's amendment:** one heading, two labelled sections (Pages / Boards), a
board thumbnail wider than tall and a page taller than wide, the nested board
under Boards and nowhere else. The drawer is the zone's **caption, not a row** —
a row would have been INERT among pressable ones, which PP4 forbids — and it is
not pressable because no drawer surface exists (G3). Its successor is recorded at
the site.

**S3 · TRANSFER, copy only.** `copyCardToBoard` mints a new box and never touches
the source, so "edits do not follow" is true by construction. **THREADS DO NOT
TRAVEL**, and the mechanism is stated because the omission looks like a bug: a
thread's endpoints are BOX IDS on one board, so a copied one would be a hairline
to nowhere.

**THE COPY IS A WHITELIST, NOT SPREAD-AND-STRIP** — ruled after this function
proved the case itself. Written as `{...box}` minus a strip list, it carried
`sourceEntryId` through when copying a PORTED card, which would have given that
copy a double-click that TRAVELS instead of opening its editor. A strip list is
a rule that must be UPDATED as the shape grows, so it rots silently; a whitelist
must be EXTENDED on purpose, and the worst case is a field missing rather than a
relationship forged by accident.

**A copy got its own field** (`copiedFromBoardId`): `sourceEntryId` means "this
card MIRRORS that entry" and the dispatch is built on that meaning; a copy is the
opposite relationship. One field, one relationship.

**The tray ships only the true clauses.** Item 123's ruled sentence includes "its
tags come with it" — DEFERRED ON THE RECORD (successor C4), because a `Box` has
no tags field and cards cannot carry tags yet. A tray that promises what the
product cannot do is the surprise it exists to prevent.

---

## §4 · THE PARK COUNT — 4 RUNS / 3 CHECKS, AUDITED BY EXECUTION

Extracted from the parked leg's own `pok()` results and the default leg's
successors, not counted off the roster:

| where | file | runs | checks |
|---|---|---|---|
| behind the gate (generation 2) | `ab4.mjs` | **2** (×2 widths) | 1 |
| superseded in place, live | `pw1.mjs` | **2** | 2 |
| **PW2 TOTAL** | | **4** | **3** |

`pw2.mjs` itself parks nothing — its gate is armed and empty.

---

## §5 · THE FIRST PAIR'S RED WAS MINE, AND SO WAS THE CLAIM THAT HID IT

Every red was one of this lane's own PW1 checks, falsified by this lane's own
later rulings.

**The claim that broke:** I wrote into `pw2.mjs` that PW2 "falsifies no existing
assertion." That was true of S1 — and S1 is all the sweep looked at. S2 and S3
were built afterwards and **never re-swept**.

> **A SWEEP TAKEN ONCE CERTIFIES ONLY THE BUILD THAT EXISTED WHEN IT RAN.
> RE-SWEEP WHEN THE SLICE GROWS** — a ruling that lands mid-build reopens it.

**Two causes, three checks:** Nick's heading rename (`pw1` S2 Q4; `ab4` ×2
widths), and S3 giving cards a real act (`pw1` G3 at menu scale).

**The G3 supersession is the finding, not a relabelling.** It asserted
`hasMenu === isMember` — "is a member" as a PROXY for "has an act", true for
exactly one release. My own work falsified the proxy while the rule survived. The
successor asserts the rule directly: open every menu that exists, with REAL
POINTER EVENTS, and require at least one item inside it. **A check built on a
proxy dies the day the proxy and the rule part ways — assert the rule.**

---

## §6 · WHAT THE SECOND MERGE CHANGED, AND ONE COMMENT THAT MATTERED

`a3ffdb4` brought TOOLS' index conversion and VW1's `data-category`.

**The handle is now `data-category`, in both files.** `pw2.mjs` had used the
label's own text — correct when written, because `.wz-strip-item` carried no
per-category attribute, but it made every probe depend on a LEXICON TERM. A
rewording of "Plan" would have broken every check reaching that panel, silently,
in the same green-about-something-else way an index does. **A handle is the name
the code uses, not the word the writer reads.**

**The stale comment was as important as the selector.** It said `.wz-strip-item`
carries no per-category class — true when written, false after VW1 — and left
alone it would have argued the next reader back toward the label handle. **A
stale comment that contradicts the current code is an instruction to undo the
fix.**

**Line 189, both files:** the check named "the strip is mounted with a Plan
category" asserted `.wz-strip-item').length > 2` — a COUNT, a proxy for "index 2
exists". Under a named handle it is wrong twice: three categories with no Plan
passes, and a reordered strip passes while the press lands elsewhere. Same ruling
as G3.

The `length === 8` mount waits elsewhere in the suite are left alone: they wait
and fail LOUDLY on timeout, which is the opposite shape.

**An error of mine, on the record:** between the two pairs I ran `pw2.mjs` once
without a granted turn, telling myself a single harness is not a suite. It is —
one harness is a run — and my own pre-flight had read 2 live processes, which was
FIX's granted pair. Item 139/140 now refuse that case structurally.

---

## §7 · GATES AND SURFACE

Browserless, before the turn: `pnpm install`, `tsc --noEmit`, `build:web`,
`node --check` (pw1/pw2/ab4), and **seed-guard PASS (36)**.

**Item 148 note:** `wrizoCopyCardToBoard` is wrapped in `durableSeam`. It is NOT
enforced — seed-guard finds mutating seams by the verb list
`(Create|Patch|Set|Pin)`, and `Copy` is not on it, so the seam opts out silently.
Proven by mutation: unwrapped, the guard still passed. Reported as item 148; no
table entry is owed until 148 lands.

**Change surface: product-only. ZERO server, ZERO schema.**
