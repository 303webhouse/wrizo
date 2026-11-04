# Rulings: `apps/desktop/src/store/scriptLedger.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[scriptLedger §n]` points here.

## scriptLedger §1

From `apps/desktop/src/store/scriptLedger.ts`, line 4 at `f079d49e` (the comment that stays: "lineLedger: a pure function from a screenplay to the lines it occupies, from scriptMetrics' declared constants (never runtime `ch`), returning a structure the paginator needs, not a count").

```ts
// SC2 S1 — THE LINE LEDGER. A pure, synchronous function from a screenplay
// document to the lines it occupies. No DOM, no font, no measurement: the
// arithmetic is the truth and the rendering is the thing checked against it
// (sc2.mjs does the checking). That direction matters — a ledger that measured
// the render could never catch the render being wrong.
//
// WHY IT CONSUMES DECLARED CONSTANTS AND NOT `ch` UNITS. A `ch` measured at
// runtime resolves against whatever font is loaded; taken a frame before
// Courier Prime arrives it silently computes against a fallback advance, and
// the arithmetic is wrong while looking pure. Every measure here comes from
// scriptMetrics.ts — the same module the renderer uses — so there is one source
// of truth for geometry and no re-derivation anywhere.
//
// WHY IT RETURNS A STRUCTURE AND NOT A COUNT (Fable, 2026-07-25). A scalar
// total is enough to paginate naively and not enough to paginate correctly: the
// paginator has to refuse a scene heading orphaned at a page foot, keep a
// character cue with its first line of dialogue, and — in SC2.1 — split
// dialogue with (MORE)/(CONT'D). All of that needs element identity, so the
// ledger reports per element and the paginator consumes it.
//
// PURITY IS POSITION-INDEPENDENCE. `spaceBefore` is reported for EVERY element
// including the first, because it is an INTRINSIC property of the element type,
// not of where the element happens to sit. The rule "the first element of a
// page contributes zero space" belongs to the CONSUMER: the renderer suppresses
// at document start (index.css, `.script-sheet > *:first-child`), and S2's
// paginator will suppress at every page top. Baking that into the ledger would
// make it position-dependent, and then the same element would ledger
// differently depending on where a page break happened to land — which is
// exactly the circularity a paginator cannot resolve.
```

## scriptLedger §2

From `apps/desktop/src/store/scriptLedger.ts`, line 54 at `f079d49e` (the comment that stays: "lines one element occupies at a measure: a word longer than the measure hard-breaks (the CSS overflow-wrap matches); hard breaks start lines; trailing whitespace is ignored for the wrap only").

```ts
/**
 * Lines occupied by one element's text at a given measure, in characters.
 *
 * The four edge rulings (Fable, 2026-07-25), each chosen rather than
 * discovered:
 *
 * 1. A WORD LONGER THAN ITS MEASURE hard-breaks at the measure. A 70-character
 *    URL in an action line occupies ceil(70/60) lines; it may not claim one
 *    line and overflow silently, or the paginator would place a break the
 *    render contradicts. `.script-el` carries `overflow-wrap:anywhere` so the
 *    CSS breaks the same way — asserted in sc2.mjs, not assumed.
 * 2. HARD BREAKS inside an element each start a new wrapped line, and an empty
 *    segment still costs one. The typed shape is the writer's; the ledger
 *    counts what is there.
 * 3. TRAILING WHITESPACE is stripped for the wrap calculation only, never from
 *    storage — a stray space at column 60 must not cost a line the writer
 *    cannot see. This matches `white-space:pre-wrap`, which `.script-el` ships
 *    and sc2.mjs asserts: under pre-wrap trailing spaces hang at a soft wrap
 *    opportunity and never cause a break. (Under plain `pre` nothing would wrap
 *    at all and this whole function would change shape — hence the assertion.)
 * 4. AN EMPTY ELEMENT is one line, matching the `min-height:1em` that
 *    `.script-el` already ships, so arithmetic and render agree by
 *    construction rather than by coincidence.
 *
 * Internal runs of spaces are PRESERVED, not collapsed — `pre-wrap` keeps them
 * — so they count toward the column. They do not themselves force a break: a
 * space run sitting at the measure hangs rather than wrapping.
 */
```

## scriptLedger §3

From `apps/desktop/src/store/scriptLedger.ts`, line 86 at `f079d49e` (the comment that stays: "the same wrap, as the lines themselves: wrappedLines is its length, so count and cut cannot disagree; the lines concatenate back to the input exactly").

```ts
/**
 * The SAME wrap, reported as the lines themselves rather than as a count.
 *
 * SC2 S2b needs this because the paginator's one permitted split — an action
 * block longer than a whole page — has to RENDER as two blocks carrying two
 * halves of the writer's text, and the halves must fall exactly where the
 * arithmetic said the break was. Counting and slicing therefore cannot be two
 * implementations: `wrappedLines` is now defined as the length of this, so
 * there is one wrap algorithm and it is impossible for the count and the cut to
 * disagree. (Before S2b there was only a count, and a second slicing routine
 * would have been the obvious way to add the cut — and the obvious way to end
 * up with a break the render contradicts.)
 *
 * THE LINES CONCATENATE BACK TO THE INPUT EXACTLY: `wrapToLines(t, w).join('')
 * === t`, for every t and every w. Not approximately, not modulo whitespace —
 * exactly. That is a deliberate contract and it is what the renderer's split
 * rests on: a part's text is then a genuine SUBSTRING of the writer's own, and
 * re-wrapping it at the same measure reproduces the same lines (greedy wrapping
 * from a line start is memoryless). So a split renders identically to no split,
 * and no character is added or lost.
 *
 * The first cut of this returned line CONTENTS and the renderer joined them with
 * '\n'. It rendered correctly and it was wrong: it put 58 newlines the writer
 * never typed into a 60-line block's DOM text, and it dropped the trailing
 * spaces `pre-wrap` deliberately hangs. Neither was visible — sc2.mjs's
 * concatenation check is what found it. Hence break POSITIONS computed on the
 * right-trimmed text (ruling 3: trailing space must not cost a line) and slices
 * taken from the ORIGINAL, with the writer's own newlines put back where they
 * were.
 */
```

## scriptLedger §4

From `apps/desktop/src/store/scriptLedger.ts`, line 131 at `f079d49e` (the comment that stays: "trailing space hangs").

```ts
// ruling 3 — trailing space hangs
```

## scriptLedger §5

From `apps/desktop/src/store/scriptLedger.ts`, line 132 at `f079d49e` (the comment that stays: "an empty line is a line").

```ts
// ruling 2/4 — an empty line is a line
```

## scriptLedger §6

From `apps/desktop/src/store/scriptLedger.ts`, line 140 at `f079d49e` (the comment that stays: "longer than the measure").

```ts
// ruling 1 — longer than the measure
```

## scriptLedger §7

From `apps/desktop/src/store/scriptLedger.ts`, line 156 at `f079d49e` (the comment that stays: "one LedgerEntry per element, in document order; pure and synchronous").

```ts
/**
 * The ledger: one entry per element, in document order. Pure and synchronous —
 * no browser required, so it is testable without one.
 */
```

## scriptLedger §8

From `apps/desktop/src/store/scriptLedger.ts`, line 174 at `f079d49e` (the comment that stays: "total lines, with the first entry contributing no space above it (the paginator applies the same rule at every page top)").

```ts
/**
 * Total lines a ledger occupies, with the consumer's suppression rule applied:
 * the FIRST entry contributes no space above it. This is the document-start
 * case; S2's paginator applies the identical rule at every page top.
 */
```
