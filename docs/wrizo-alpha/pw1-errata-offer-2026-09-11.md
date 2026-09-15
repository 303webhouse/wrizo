# PW1 ERRATA (ITEM 131) — THREE FINDINGS FROM NICK'S LIVE SITTING, OFFERED

**Lane:** pw1 · **Branch:** `pw1-errata` · **Worktree:** `.claude/worktrees/pw1-errata`
**Date:** 2026-09-11 · **Standing:** OFFERED, NOT MERGED. The merge is chat 1's act.
No deploy implied; no `railway` command has been run from this lane.

Branched from `origin/main` @ **`eae3f12`**, pinned by SHA, then **`origin/main` @ `e8cad7d`
merged back in for the stamp** (the `d1f4be3` precedent), so the tree that was verified is
the tree that would merge.

**STAMPED AT `2ee57cd`.** This record commits on top of that, so the branch head is one
docs-only commit ahead of the stamped tree — stated rather than left to be inferred.

**Source:** item 131, three errata from Nick's walk of the shipped Boards Connected build
(`39eacae` · railway `479adc19`). All three ratified as built before this record was written.

> **THIS RECORD IS ON THE BRANCH, AND THAT IS THE POINT.** PW1's first offer carried no
> record and no ledger entry, so its 76/76 claim reached chat 1 by relay only and could not
> be verified from the repository. Chat 1 named that gate at the merge and was right.

---

## §1 · THE STAMP — A CLEAN PAIR ON ONE FROZEN TREE

```
SUITE DONE HARNESS_PARKED=unset — 78/78 of 78 returned a passing verdict
SUITE RESULT: CLEAN — tree=2ee57cd bundle=index-ugB_nFty.js/573612b
SUITE DONE HARNESS_PARKED=1     — 78/78 of 78 returned a passing verdict
SUITE RESULT: CLEAN — tree=2ee57cd bundle=index-ugB_nFty.js/573612b NO-REBUILD
```

Same tree SHA both legs, no `+Ndirty`: committed and frozen before the first leg, untouched
between them. `pw1.mjs`: **PASS (41 checks)**, identical in both legs.

**PARK COUNT, AUDITED BY EXECUTION** — extracted from the actual `pok()` results in the
parked leg, not counted off the roster: `cd2` **6**, `ab4` **8**, `b2` **1**, `cd1` **1** =
**16**, matching PW1's standing claim of 16 exactly. **This branch parks nothing new** — the
errata are additive checks plus three fixes, and supersede no existing assertion.

**A CORRECTION TO MY OWN ARITHMETIC, since the count is the check.** The commit message on
`530f7b2` and my relayed summary both said **seven** errata checks. It is **eight**
(33 pre-existing + 8 = 41). I had filed the Shelf precondition as scaffolding rather than as
a check — which is exactly backwards: it is the check that makes the other three worth
trusting. The suite's number is right and my prose was wrong.

---

## §2 · ERRATUM 131 (a) — CONDITION-BOARDS ARE NOT CONNECTIONS

**What Nick saw:** a loose page's "Boards connected" listing **the Shelf**.

**The root cause, and it is not a rendering bug.** Under the three-space canon the Shelf,
Trash and Journal boards are **displays of a CONDITION** (loose; deleted; in-journal-view),
not places. Their `page-pin` boxes are **real rows** — but **DERIVED**, written by
`reconcileSystemBoard` from `qualifyingPagesFor` in reaction to that condition. **The writer
never authored them.** A loose page sits on the Shelf board *by derivation, always*. So the
panel was not mis-rendering a connection; it was reporting a rendering AS a connection, and
telling the writer they had linked something they never touched.

**THE FIX IS A SPLIT, RATIFIED ON MAIN BEFORE IT WAS BUILT** (the ledger's own structural-
form band, 2026-09-10):

| function | the question it answers | callers |
|---|---|---|
| `getBoardsPinning` | *which boards carry a page-pin box for this entry* — **storage**, and it must stay honest about what is stored | **1** — `ExistingPagePicker`'s "already on THIS board", which tests the host board's own kind rather than interpreting it |
| `getBoardsConnecting` | *which boards is this page CONNECTED to* — **membership with the canon applied**, the only form that may feed a list or sentence claiming the writer connected something | **7** — the Plan panel, the four membership lines, the Tutor's Structure lens, the Places checkboxes |

**Why a split rather than a filter at each call site** — the ledger's words, and the reason
this shape was ratified: *"A filter written at the call site is a rule that must be
remembered every time; a named reader is a rule that must be BYPASSED on purpose."* The
erratum was walked on ONE surface and Nick's ruling reached TWO; the split makes the canon
impossible to half-apply, which is how the violation shipped in the first place.

**Visible result:** a loose page shows its own plan board and nothing else; with no plan
board the zone does not render at all (PW9). The Structure lens's `Also connected to…` line
inherits the same rule, as the ruling required.

---

## §3 · ERRATUM 131 (b) — A LEAD SENTENCE THAT WAS FALSE WHERE IT STOOD

`cascadePlanNoProject` — *"File this page to a drawer first to plan around it"* — is true and
useful said to a page with nowhere to plan. Said **directly beneath a listed plan board** it
contradicts the row above it and tells the writer to build what they have already built.

**Not reworded — ABSENT in the state where it would lie**, which is the law the zone itself
already obeys. **Both directions are asserted:** gone when a connection is listed, still
speaking when there is none. The sentence was never wrong; it was wrong *there*.

---

## §4 · ERRATUM 131 (c) — A TRUNCATION THAT CHANGED MEANING. MY OWN DEFECT.

`LocationCrumb` gave the home label `class="crumb-item"`, which carries `max-width:160px` +
`text-overflow:ellipsis`. So **"Loose — belongs nowhere yet"** rendered as
**"Loose — belongs now…"**.

**Why this is not a cosmetic limit, which is the whole erratum:** a clipped **name** still
reads as a name the reader knows was shortened. A clipped **phrase stays grammatical** — so
it does not read as truncation at all. It reads as a *different sentence*, and here as the
**opposite** of the true one: a page that belongs nowhere, reported as belonging now.

**THE LOCATION PHRASE NEVER ELIDES** (`white-space:nowrap`, no max-width, no shrink);
**TRUNCATION TAKES THE TITLE** — the one part of the chain that can be shortened without
lying.

---

## §5 · THE HARNESS — EIGHT CHECKS, AND ONE EXISTS TO PREVENT A VACUOUS PASS

All eight in `pw1.mjs`, both directions of each erratum, plus:

**A PRECONDITION CHECK ON THE SHELF'S DERIVED PIN.** The exclusion check would pass
perfectly against a Shelf board that never carried the pin at all — a green proving nothing.
So the fixture visits `/shelf` first (which is what triggers `reconcileSystemBoard`,
`BoardEditor.tsx:986`) and asserts the derived pin is **genuinely there** before asserting it
is excluded. The exclusion check is only worth trusting because that one stands in front of
it.

**Erratum (c) is measured, not inferred.** `scrollWidth > clientWidth` on the rendered
element is the actual definition of "this box is clipping its own content"; asserting the CSS
I had just written would only have proved I wrote it.

---

## §6 · AN 85-C AUDIT OF THIS BRANCH'S OWN PREMISES

Item 130 merged while this branch was held, and it **killed a premise inside `pw1.mjs`**: the
point-scanning driver's comment stated in the present tense that the stage covers the strip's
right ~54%. That was true — it is the finding that *became* item 130 — and item 130 is now
fixed. Left alone, the comment would have gone on describing a live defect that no longer
exists: the 85-C shape exactly.

Corrected in `2ee57cd`. The helper stays, for reasons that are still live: it is the only
reason the occlusion was ever visible (every other harness used `.click()`, which bypasses
hit-testing — the synthetic event did not invent a false red, it **concealed a true one**),
and a press that silently lands on an overlay is indistinguishable from a product that
ignored it.

**The rest of the branch was audited for the same hazard.** Item 130 touched
`.desk-frame-strip`'s stacking and retired `.mode-nib`; it touched none of `.crumb-here`,
`.crumb-item` or `.wz-crumb-home` — so erratum (c)'s assertions pass because of this branch's
fix and not because something else moved under them.

---

## §7 · GATES AND CHANGE SURFACE

**Browserless, before the box turn:** `pnpm install` (this worktree was new — an uninstalled
worktree fails `run-suite` at its pre-run rebuild, and discovering that during the slot costs
the slot), `tsc --noEmit`, `build:web`, `hooks-order`, and **85-B's `seed-guard` (22 checks,
`pw1.mjs` unflagged)**. Two fixture assumptions verified **by reading source rather than by
running**: that `/shelf` routes, and that `BoardEditor.tsx:986` triggers the reconcile.

**Post-merge call-site census:** one raw `getBoardsPinning` caller, seven
`getBoardsConnecting` readers. No call site returned with the merge.

**Change surface: product-only. ZERO server, ZERO schema** —

```
git diff --stat eae3f12 2ee57cd -- apps/server packages
    (empty)
```
