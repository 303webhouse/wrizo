# FX11 — the Board's Hands · Fable's post-merge review · 2026-07-24

**Ticket:** FX11 (item 57). Built by chat 3 on `fx11-boards-hands` @
`fe3ce82`; merged `7f8e943` by chat 1 under the zero-schema
pre-authorization, the TU5 close pattern exactly; deploy held for the
batch with M3.
**Method:** house depth — census via stats (6 files, 301+/9−, all
`apps/desktop/`, zero server, zero schema, zero deps, `deskLexicon`
untouched), then `full_patch` line-by-line on the entire merge,
including all 221 lines of the new `fx11.mjs`.

## Verdict: GREEN. All five debts retired at their sources, the one unreachable path escalated honestly to the only hand that can reach it. Close pends Nick's sitting (his eye on the retired debts + the S-Pen resize-then-move attempt).

## VERIFIED, debt by debt

**S1 — the ghost grip (FX8 A1).** The fix is the review's own
prescription — `setIsDragging(false)` in the `[pageWidthPx]` effect's
cleanup — and the in-code comment states the mechanism even more
sharply than the original finding: the re-run arrives as a fresh
closure at `phase='idle'`, so the stranded flag wasn't merely
uncleared, it was *unclearable*, with no live gesture left to ever call
`finish()`. Correctly placed after the listener teardown; correctly a
no-op when no drag is in flight. The harness proof carries a
**precondition assert** (the wrap width provably moved, so the effect
provably re-ran) before asserting the fix — the vacuity-guard
discipline applied exactly where a passing check could otherwise lie.

**S2 — resize-then-can't-move (Nick's glitch).** The brief demanded
root-cause-first and forbade blind patching; the build honored both to
the letter. The reproduction matrix under genuine trusted pointer —
grow both axes, shrink, immediate move, and a viewport resize between —
moves the card every time, with a control clean-move proving the
technique. The root distinction is *proven*, not asserted: a card
resize never changes `pageWidthPx` (`setCanvasOverrideW` fires only
from the canvas handle), so S1's leak mechanism cannot be this glitch's
mechanism. What shipped is a regression guard on the DoD ("a card
resized is a card still movable"), at 1280 framed plus a legacy sanity,
and the one path a mouse harness structurally cannot make — the
touch/pen long-press branch, Nick's S-Pen — is named as the sole
residual, on Nick's own word, with FX5 S4's precedent cited. **The
sitting is the real check, and the sitting agenda carries it.**

**S3 — lane titles ride the export (E1.1 advisory 2, as ruled).** One
`Lanes:` line atop the board block, titles in declared lane order,
empty-named lanes filtered by a type-narrowed trim, laneless boards
emitting nothing — and the empty-board-with-named-lanes edge still
carries its titles. The stale "zero writer text" comment corrected in
the same touch with the precise truth: `lanes[]` ARE writer words; the
box's other fields are not. Body text, outside the lexicon, boundary
cited — and held structurally, since `deskLexicon` isn't in the diff.
The corpus board's new three-lane fixture (two named, one empty) proves
both the riding and the filtering, and the exactly-one-`Lanes:`-line
check proves the no-hinge rule across every other board in the export.

**S4 — the rootless-cycle guard, both layers (BM1 advisory 1).**
`wouldCycle` walks the ancestor chain with exactly the right
semantics: it refuses only a nest that would close a cycle *through
this card*, terminates safely on pre-existing upstream loops, and
leaves those to S4(b)'s defense. The refusal is the store's own
grammar — a same-reference no-op, which the harness asserts by
reference identity, the sharpest possible form of that proof.
`buildNodes` promotes any post-walk unvisited card to a root and builds
it, deterministically by the total order, so a pre-existing A↔B from an
older client renders every card instead of silently dropping both —
proven in the structure seam, STORYBOARD, and OUTLINE, with OPEN
confirmed unaffected. The never-silently-missing law now covers
projections as fully as exports.

**S5 — FX10's missing leg.** `WIDE_W` joins the S4 width loop and the
header now tells the truth about every width it names. A live-section
addition, correctly unparked — the old header was description, not
assertion.

## ADVISORIES — non-blocking

1. **The sitting inherits S2's residual formally:** resize a card with
   the S-Pen, long-press, move it — the one proof only Nick's hand can
   make. Already on the ledger; named here so the agenda carries it.
2. **S4(a)'s refusal is silent** — the gesture simply doesn't take,
   matching the house's silent no-op grammar (`pairBoardWithPage`'s own
   manner). Defensible and consistent; if Nick's hand ever finds the
   silence confusing at a sitting, a future micro can add a quiet
   settle animation. Not now.

## Close condition

Nick's device sitting: his eye on the five retirements and the S-Pen
attempt. Then item 57 closes. **M3 (item 58) unblocks the moment this
review lands on `main` — by the brief's own terms, no gate relaxed.**

— Fable
