# ITEM 112-A · BUILD RECORD — REVISE STANDS UP
### Lane `item112a` · branch `item112a` off origin/main `89c5955` · worktree `.claude/worktrees/item112a`

**MERGE STATE:** this branch carries origin/main `1c8edd3` merged in (commit `7f48238`).
One conflict, in `PageEditor.tsx`'s `sliverContent` — item 114 (errata E4) added page-kind
and style-guide pickers to the Draft branch while this ticket was in flight. Resolved by
keeping 112-A's three-branch shape with main's fields inside **Draft**; Revise's drawer
stays empty. Those pickers are not 83's Type section (face and size, RV1-RV4 — still
112-C), and 112-A ships no tenants either way. **Merging this branch to main remains
chat 1's act, not this lane's.**

**Brief:** `docs/menus/tutor/item112a-build-brief.md`, blob `75e81367`, **md5 `9619b2a6`** — the
AMENDED tip, Nick's empty-drawer ruling folded. Verified against the blob, not the working
file (a CRLF checkout gives md5 `415742bf`; the LF blob is the byte of record).
**Charter:** `docs/menus/tutor/item112-revise-charter.md`, RS1–RS7, ratified 2026-09-02.
**S0:** `docs/menus/tutor/item112a-s0.md`.

**NOT DEPLOYED. No deploy without Nick's word.** This is source + harness only.

---

## THE STAMP — of record, on the MERGED tree

```
SUITE (default)  68/68  CLEAN   tree=7f48238  bundle=index-CK6B8dF1.js/557023b
SUITE (parked)   68/68  CLEAN   tree=7f48238  bundle=index-CK6B8dF1.js/557023b
```

`7f48238` is 112-A **merged with origin/main `1c8edd3`** (the errata wave, which landed
mid-build). 68 files, not 67 — main's merge brought `item83f.mjs` with it. Clean tree at
both uploads (no `+Ndirty` on either stamp; nothing was written to the tree between the
two runs). Ticket harness `item112a.mjs`: **55 PASS**. `item84b.mjs`: **62 PASS + 1
PARKED**, armed.

**The superseded pre-merge stamp, kept rather than overwritten:** `68/68` replaces
`67/67 CLEAN tree=1dede79 bundle=index-6xniJdoe.js/553583b`, which was the stamp for
112-A **before** origin/main moved. It was a true result for a tree that no longer
exists, and it is recorded here so the two numbers cannot be confused later.

### THE RED THAT WAS NOT A RED, AND HOW IT WAS CLEARED

The first pair at `7f48238` came back **NOT CLEAN twice** — `bm1.mjs` FAIL in the
default run, `s1.mjs` TIMEOUT in the parked run. Neither is this ticket's file, and
neither reproduced.

**Cause: nine orphaned harness browsers**, every one owned by PID `32156`, verified
**dead** — the previous session's runner, which exited without cleaning up. That is the
known leak whose symptom is indistinguishable from a flake: browser starvation surfaces
as a timeout, or as a fixture that never establishes. The evidence fit it exactly —
`bm1`'s failure detail was `paired=false`, its PRECONDITION never setting up rather than
its assertion returning a wrong answer.

Reaped under the verified-dead-owner rule (single owner, confirmed dead, logged:
`36776, 27496, 15772, 42252, 28644, 26792, 42352, 2428, 44608`), machine confirmed at
zero harness browsers, pair re-run. Both files pass on the clean machine — `bm1.mjs`
36 checks, `s1.mjs` 86/87 — and the whole suite is clean in both settings.

**The clearance is the clean-machine RUN, not the diagnosis.** "Passes in isolation" and
"the machine was quiet" are both retired as clearance arguments in this project, so the
orphan finding stayed a hypothesis until a full clean pair confirmed it.

---

## WHAT SHIPS

A Revise the writer can enter from the strip, write freely in, walk at both reference widths
with both hands, and leave — carrying the mirrored-hands machinery and **nothing else**.

The source change is genuinely small, and that is the finding, not an apology for it:
**the room already existed; Revise had simply never been allowed into it.** `Sliver` and
`Tutor` are mounted by `PageEditor`'s framed branch with no reference to `mode` in either
mounting decision, so Revise inherits both hands, their paper anchoring, the coexistence law
and the announce-from-effect invariant without a line of new geometry code.

| file | what changed |
|---|---|
| `ForwardOnlyEditor.tsx` | `EditorMode` gains `'revise'`; internal `drafting` flag becomes `freeEdit` (Draft **or** Revise) |
| `ModeStrip.tsx` | Revise `live: true`, real active state, `onSwitch('revise')`; new `reviseEnabled` opt-out; `data-mode-key` contract marker |
| `ModeSwitcher.tsx` | a Revise tab, gated behind `reviseEnabled` (default **false**) |
| `ModeStage.tsx` | a `revise` entry in the total `RAILS` record |
| `PageEditor.tsx` | persistence allowlist admits `'revise'`; **new `sliverContent` branch** → empty Desk drawer; passes `reviseEnabled` |
| `Tutor.tsx` | two comments corrected — their stated reason expired |
| `ScriptEditor.tsx` | `reviseEnabled={false}` — the Draft-law-only surface keeps its law |
| `item84b.mjs` | one park + three successors (below) |
| `item112a.mjs` | the ticket's harness, 55 checks |

---

## THE TWO S0 ANSWERS

**§2 — mode persists PER PAGE**, `localStorage`, key `wrizo-mode-page-<id>`, written on every
switch, read at mount behind a validity allowlist. Revise is **admitted to that existing
rule** — no new key, no new default, no new lifetime. The allowlist was the whole mechanism
and the whole risk: a stored `'revise'` not named there falls through to the default, so
Revise would have silently forgotten itself on reload while Draft remembered.

**§3 — Revise renders through `ForwardOnlyEditor`'s FREE-EDIT branch**, the same branch Draft
uses. The forward-only instrument is absent **structurally, not by configuration**: on that
branch the runway's listeners never attach, the caret effect returns at its first line,
`insertMarkerRef` is nulled, no run span renders, and `forwardLock` is never read.

### The answer the parked lens needs — **YES**

Revise's rendered text runs through `decorateEditorFor` on every keystroke, and that function
**already carries the decorator override** the flag decorator will use: a fifth parameter,
`decorate`, defaulting to `decorateMarkdown` and already load-bearing for `BoardCardPopup`
(FX5 S6). **The lens needs an argument, not new routing.**

Two constraints ride with the seam, both now on the record:
1. **Character count must stay 1:1** — the caret restore depends on decoration adding only
   `<span>` wrapping. Independent corroboration of the CSS-only flag law: it was always the
   only law this seam permits.
2. **Never `display:none` / `visibility:hidden` a marker** — `readEditorPlainText` reads back
   through `innerText`, defined against RENDERED text, so a hidden character vanishes from the
   STORED text on the next keystroke. `draftDecoration.ts` records this as a measured defect.

---

## THE HAZARD THE SURVEY CAUGHT

`sliverContent` was a two-branch ternary and **Revise fell down the `else`** — inheriting
Draft's Structure control and format rail. Worse than tenant leakage: `applyRailFormat` guards
on `mode !== 'drafting'` and returns, so those controls would have rendered **live-looking and
inert** — the locked door wearing paint G3 forbids. Revise now takes `{ kind: 'empty' }`. The
drawer still **opens**, per Nick's ruling, and still carries the sliver's own standing
furniture; it is empty **of tenants**, which is what was ruled.

Two smaller ones: `RAILS` is a **total** record indexed unguarded on the framed path — a
missing `revise` key is a `TypeError`, not a gap (confirmed by negative control: removing the
entry produces `TS2741`). And the typewriter already excluded Revise by its own recorded
reasoning — *"revision-shaped work the hold would fight"* — so that line was left untouched.

---

## THE PARK — ONE, AND THE FIRST COUNT WAS WRONG

`item84b.mjs` S1 asserted, verbatim:

> *"the Revise tab is inert — clicking it does not leave Draft, so the roster cannot render in
> Revise because Revise has no live surface to render on"*

112-A falsifies its **premise** by ruling. **My sweep missed it and claimed `PARKED COUNT: 0`.**
The sweep searched the suite for `deferred` / `aria-disabled` assertions naming Revise and
found only Workshop and the script surface's Free Write key — sound as far as it went, but
that assertion says *inert*, never *deferred*, so a vocabulary-shaped grep could not see it.

**The full suite caught it** — a red at `item84b.mjs` (1/60) on the first run. This is exactly
item 84's own arithmetic in canon (*a green suite does not prove a park sweep complete; the
count is the check*), and here the **run** did the audit the sweep didn't. The lesson is left
standing in `item112a.mjs`'s park block rather than quietly amended: a vocabulary-shaped grep
proves only that a vocabulary is absent.

**Handled park-never-edit.** The original stands **verbatim** in `item84b.mjs` under
`SUPERSEDED` with a successor pointer. Its live successor is in that same file, and it is a
**stronger** check than the one it replaced: the conclusion used to be true *by construction*
— Revise could not be entered at all — and is now a live surface the roster must actively
decline. Two further checks landed with it (no other roster takes its place; the Counsel panel
is otherwise untouched).

**Ticket park count: 1**, in `item84b.mjs`, the file that owns the assertion. `item112a.mjs`
parks 0 of its own. Both armed and passing under `HARNESS_PARKED=1`.

Two **source comments** were corrected in place, not parked — `Tutor.tsx`'s *"Revise cannot
reach here at all… holds by the TYPE"* and `ModeStrip.tsx`'s *"only Free Write and Draft are
live"*. Both describe live mechanics; the park law governs assertions. Tutor's **conclusion**
is unchanged — Revise renders no roster — only its reason moved from the type to the branch.

---

## A MEASURED FINDING, SURFACED NOT SMOOTHED — the anchor at 1100

Building §7.4 turned up a **pre-existing, app-wide anchor fault**. The ruled contract
(`menus-probe.mjs`: `paper.left − dock.right === 0 ±0.6`) **holds at 1366 (0.0px)** and is
**violated by 29.7px at 1100** — the frame's own minimum width.

**It is not this ticket's, and that was established by control, not by argument.** Clean
`origin/main` **89c5955**, src reverted and rebuilt in this same worktree: main reads the
identical **−29.7** at 1100 in **both** Draft and Free Write. Revise's rects are byte-identical
to Draft's at both widths.

**RE-VERIFIED AFTER THE MERGE, and it survived.** The errata wave changed `Sliver.tsx`
(+305) and `index.css` (+51) — either could have moved the dock and invalidated the pinned
baseline. It did not: all 55 checks pass on the merged tree, the pinned −29.7 check
included. E2's own probe work was about the sliver's FOOT, not the dock/paper anchor. The
fault stands, unchanged, and still belongs to the 117/119 joint pass.

**The lens seam was re-checked too.** The wave touched `draftDecoration.ts` (+27), which is
where §3's recorded answer lives. `decorateEditorFor`'s fifth `decorate` parameter is
unchanged, so the answer above still holds against current main.

Handled per §5's own instruction — *an anchoring fault is a CSS fault, repaired in CSS*, and
*stop and surface, do not reconcile in the build*. **Not repaired here.** The harness asserts
the flush law where the app achieves it, **pins** the 1100 deviation to main's measured
baseline as a regression guard, and names the control SHA inside the check. **This belongs to
the 117/119 joint pass, and is raised for Nick and the desk.**

---

## THE STOP-AND-SURFACE §2 ASKED FOR

Revise joins the unframed `ModeSwitcher` strip **behind an opt-in prop** — the idiom
`ModeStrip` already uses for Free Write on the script surface — so the two sides agree on the
Page while **QuickSprint and ScriptEditor stay byte-identical**. Without it, a page whose mode
persisted as `'revise'` and then loaded below 1100px would render a strip with **no tab
selected at all**: the persistence rule this ticket honours would have produced a state the
strip could not express.

**Draft's `sub: 'revise'` is untouched, and the question goes to Nick:**

> The unframed strip now reads **"Draft / revise"** beside **"Revise / dress"**. Draft's
> sub-label was written when *revise* was a stage of Draft rather than a room of its own.
> Whether it now reads as stale, or as still true (Draft does revise lines), is a founder call,
> not a builder's. Revise's own sub-label is **`dress`**, from the charter's own organizing
> sentence — *"Free Write produces, Draft marks, Revise dresses"* — not coined here.

Also raised, smaller: below 1100px Revise has no hands and no geometry floor — but neither does
Draft, and §2 says make Revise behave exactly as Draft does, so the non-inventing answer was to
let it be live there on the same terms. If the desk would rather Revise be a framed-only
posture, that is one prop and no other line moves.

---

## §8's EXIT, ITEM BY ITEM

| exit clause | where it is proven |
|---|---|
| a writer can **enter** Revise | S1 — live, switchable, no `aria-disabled`, no `deferred`, no flash (Workshop is the control proving the flash still works) |
| **write freely** in it | S2 — backspace really deletes, zero run spans, markdown decorates live |
| **open and close both hands by their own grips** | S7 — both grips visible and hit-testable, both open, both close on a second press |
| per 119 and the **empty-drawer ruling** | S7 — the Desk drawer opens onto zero tool sections without error |
| **walk it at both reference widths** | S3/S4/S5 — every geometry leg runs at 1100 **and** 1366 |
| **the paper's measure untouched** | S3 — sheet rect *and* rendered text column identical with each hand closed, open, and both open, plus a laid-out control so the equalities compare real boxes |
| the **editor-path answer on the record** | S0 §3 above, and asserted live in S2 |

— the 112-A build lane
