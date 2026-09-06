# THREE RULED ITEMS — BUILT, RULED, AND OFFERED

**Lane:** errata · **Branch:** `ruled-three` · **Worktree:** `.claude/ruled3`
**Date:** 2026-09-05 · **Standing:** **OFFERED, NOT MERGED.** One branch pushed;
the merge is chat 1's act. No deploy is implied or asked for, and no `railway`
command has been run from this lane.

Branched from `origin/main` @ `7d7f06f`. Ticket: Fable to ERRATA, three small
ruled items, one branch. **All four follow-up rulings (2026-09-05) are ratified
and recorded below; none required a code change** — they rule on findings the
build had already surfaced, which is the shape a lane wants.

---

## §1 · THE OFFER

| SHA | what it landed |
|---|---|
| `ad76e42` | (1) the mode strip's Draft sub-label — `revise` becomes `mark` |
| `2fc7481` | (2) the probe's width matrix gains 1100 — and it sees the trio |
| `1bbf465` | (3) ITEM 109 — the `#/page/new` gate, and the measured reason ten files missed it |
| `40aae87` | (3b) the AST hook-order guard — item 109's other owed half, self-proving |
| `d7c0e1a` | a stray `.bak` I committed by accident, removed |
| *(this commit)* | this record + the ledger entry |

**BOTH SETTINGS CLEAN, ONE TREE, NEITHER STAMP DIRTY — 71/71 each:**

```
SUITE DONE HARNESS_PARKED=unset - 71/71 of 71 returned a passing verdict
SUITE RESULT: CLEAN - tree=d7c0e1a bundle=index-BxYTLPxH.js/557021b
SUITE DONE HARNESS_PARKED=1     - 71/71 of 71 returned a passing verdict
SUITE RESULT: CLEAN - tree=d7c0e1a bundle=index-BxYTLPxH.js/557021b NO-REBUILD
```

The parked pass ran `--no-rebuild` against the byte-identical bundle the default
pass tested, so both stamps name the same software as well as the same tree.

**69 files became 71**, and the two new ones are the cheapest in the suite:

| file | default | parked | cost |
|---|---|---|---|
| `hooks-order-ast.mjs` | PASS (7) | PARKED PASS (0) · VERIFY (7) | **1s**, no browser |
| `item109.mjs` | PASS (9) | PARKED PASS (0) · VERIFY (9) | **11s** |

**Both park nothing, and say so in words** under `HARNESS_PARKED=1`: neither
supersedes an assertion. `item109` adds the gate that was MISSING — a missing
gate falsifies nothing when it finally arrives — and the ten navigation-based
files beside it are untouched and still claim exactly what they claimed. The AST
guard is additive to `hooks-order.mjs`, which is untouched and still passes.

---

## §2 · ITEM 1 — THE SUB-LABEL. Scope accepted as disclosed, not amended.

`sub: 'revise'` → `'mark'`. The word was written when revise was a STAGE of
Draft; 112-A made Revise a room and left it pointing at a door that had moved.

**RULED (accepted):** *the shared MODES table is the truth and QuickSprint's
Draft IS Draft — "revise" was equally false there; "mark" is the ratified verb
everywhere. Disclosed scope, not an amendment.* Recorded as such: **the change
reaches QuickSprint's render**, `QuickSprint.tsx` is untouched and byte-identical,
and no per-surface prop was invented to keep the falsehood on the surface that
had it.

Two things still differ from the ticket's shorthand, and both stay on the record:
the string is **not in the lexicon** (it is inline in `MODES`, beside three
equally-inline siblings — moving one and leaving three is a worse shape than the
one it fixes), and "one line" and "reaches two surfaces" are both true while only
the first is obvious. **Nothing parked:** no harness asserts any mode sub-label;
the `'revise'` matches across the suite are mode KEYS, checked before touching it.

---

## §3 · ITEM 2 — THE PROBE AT 1100, AND THE TRIO THAT CORRECTS THE CLUSTER PASS

The frame's MINIMUM width is now a standing member of the matrix, on the ruling
that *an instrument that never visits the width where the layout law bites cannot
certify the law.* It visited. The law bites, and it bites unevenly:

| surface | dock flush at paper, 1100 | |
|---|---|---|
| prose | **−29.69px** | the ratified figure, exactly |
| screenplay | **−38.00px** | **not** the ratified figure |
| board | **0.00px** | flush — no overhang at all |

**RULED:** *"Pre-existing in every mode" holds as a class and fails as a number —
and the board being FLUSH is the existence proof of C2's target state. This
amends the pass's binding input (chat 1 records it): **C2 designs against the
measured trio, not 29.7.***

That second clause is the part worth pausing on, and it is Fable's, not mine:
the board is not merely a surface without the defect, it is **proof that the
target state is reachable in this layout** — the flush case already exists, so
C2 is closing a gap rather than inventing a geometry.

**RULED:** the KNOWN-keyed instrument is *"exactly the right instrument — drift,
partial fix, or full fix all re-red."* A finding is keyed to **surface + width +
check + the MEASURED PIXEL VALUE** within ±0.75px, never to a check name:

- the same check at another width is not this finding — it goes RED;
- a value outside its band — a regression, a partial fix, **or a full one** —
  fails the probe, and the owner clears the entry in the same change that clears
  the defect;
- `KNOWN` is its own column, names the owning item, and is counted separately.
  Nothing here is silent, and nothing not already ruled pre-existing can enter.

**Probe: 62/66 green, 4 KNOWN (owned), 0 RED.** It was 50/50 at two widths; the
three new width-slots add 16 checks and surface four findings that were always
true and never visible.

---

## §4 · ITEM 3 — THE `#/page/new` GATE, AND THE MECHANISM THE SAGA LACKED

**RULED, both corrections accepted.**

**(a) The gate asserts BG1's beginnings row, not the sleeping invite** — because
*asserting a retired behavior would gate the past.* The ticket said "invite
drawn"; the F6 first-line invite has slept by default since FX15 (the Quiet
Page). Measured on a fresh profile: `.fl-invite` absent, beginnings row present
(Sprout / Plan / Screenplay). That row is what a writer is actually offered, so
that is what the gate asserts — with the reasoning in the file so nobody "fixes"
it back.

**(b) The load-bearing property is the COLD DOCUMENT LOAD**, and the
same-document-navigation finding is *"the mechanism the whole three-reopen saga
lacked."* **109's charter language amends to that; headful stays an honest
opt-in.**

The finding, measured rather than argued: `app.goto()` issues `Page.navigate` to
a URL differing from the current one only in its **hash**, and a hash change is a
same-document navigation — the SPA router handles it client-side and the document
never reloads. Proven with a sentinel planted on `window`: after
`app.goto('/page/new')` **it is still there**. Ten files reach that door and none
has ever mounted the app at it, which is exactly why a mount-time fault shipped
green three times.

**It can fail, demonstrated not asserted.** Against a deliberately dead door (an
origin serving a bare `<div id="root">`) the gate fails **6/9** with `paper:
null`, `rootKids: 0`, `beginnings: []`, `bodyTextLen: 0` — the exact tree-blanking
signature of the crash it exists to catch.

**Headful and deployed-bundle are real and opt-in** (`WS_HEADFUL=1`,
`WS_TARGET_URL`), and the headful run is **verified passing 9/9 and records
`headful: true` on its own face** — added and exercised, not merely offered.
Neither is the default: a 71-file suite throwing a window onto the desk would be
unusable, a headful launch needs a display CI may lack, and a standing file must
not depend on a network or test a build nobody in this run made. I could not
produce a defect that reproduces headful and not headless, and I did not claim
one.

---

## §5 · ITEM 3b — THE AST GUARD, AND THE ONE THAT NEARLY SHIPPED AS A DECORATION

**RULED and REGISTERED:** *the AST guard nearly shipping as a decoration — and
proving itself on four fixtures instead — is the discriminator law applied to a
guard about guards.*

The near-miss, recorded because the registration is about it: the first run
reported `arrowForms: 0` and a clean census, and that reads like success. It is
not. **Both blind spots are EMPTY in the tree today** — there is not one
arrow-defined component or hook in `src`; the line scanner's note about "exactly
one" refers to `const Crumb = (<div …>)`, which is a **JSX element, not a
function**. So the census exercises neither new path and would report a clean `0`
whether the guard worked or did nothing whatsoever.

Four fixtures make the claim real:

| fixture | expected | got |
|---|---|---|
| blind spot 1 — ARROW component, hook below an early return | 1 | **1** (`Panel`/`useState`, `arrowForms: 1`) |
| blind spot 2 — MULTI-LINE return inside an `if {`, hook after | 1 | **1** (`Surface`/`useEffect`) |
| control — every hook above the decision | 0 | **0** |
| control — a hook inside a nested CALLBACK below a return | 0 | **0** |

The clean control is the one that stops a detector that simply flagged everything
from passing the first two; the callback control keeps one verdict carrying one
claim. **Census: 157 components/hooks across 150 files, zero violations. 7/7.**

`hooks-order.mjs` is **untouched and still passes** — this stands beside it, not
in place of it, and nothing is parked because nothing it claims is falsified. If
the two ever disagree, that disagreement is itself a finding worth seeing.

---

## §6 · WHAT THIS LANE DID NOT DO

- **No fix to the 1100 overhang.** Ruled out of scope and owned by the
  115/117/119 pass; the probe reports it and does not gate on it.
- **No per-surface sub-label prop.** That is not one line, and it would encode
  the falsehood on the surface that kept it.
- **No suppression mechanism beyond the keyed, measured, drift-sensitive one.**
  A known finding here is a pinned measurement with an owner, never a mute.
- **No merge, no deploy.** One branch pushed and nothing else.

---

## §7 · THE ASK

**Offered to chat 1. Held for review.** The four rulings above are already
applied as records; nothing in them is outstanding. Two things travel onward and
are chat 1's to record rather than mine: the **C2 binding-input amendment** (the
measured trio, and the board as the existence proof of the target state) and the
**item 109 charter amendment** (the cold document load as the named mechanism).
