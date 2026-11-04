# Rulings: `apps/desktop/src/store/scriptPaginate.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[scriptPaginate §n]` points here.

## scriptPaginate §1

From `apps/desktop/src/store/scriptPaginate.ts`, line 5 at `f079d49e` (the comment that stays: "pages are a projection of the line count (lineLedger), recomputed, never stored; no width or font enters, so pagination is viewport-invariant by construction").

```ts
// SC2 S2 — THE SHEET SEQUENCE, DERIVED AND NEVER STORED.
//
// Pages are a PROJECTION of the ledger, recomputed on demand — the same
// constitutional law that makes decks data and modes projections. Nothing about
// pagination enters the doc, the store, or the server. The reason is not tidiness:
// store a page array and the first edit above it makes every subsequent page a
// lie, and there is then a second copy of the truth free to drift from the first.
// A projection cannot drift, because there is only ever one truth to read.
//
// It is also what makes viewport invariance PROVABLE rather than merely observed.
// This function takes a ledger and returns pages; no DOM, no width, no font
// enters it, so the same document cannot paginate differently at 1100px and
// 2200px — not because three renders were measured and agreed, but because the
// width was never an input. (sc2.mjs still cross-checks the RENDER against this
// output at each width: arithmetic proven viewport-invariant is necessary and
// not sufficient — it cannot catch the render disagreeing with the arithmetic.)
```

## scriptPaginate §2

From `apps/desktop/src/store/scriptPaginate.ts`, line 37 at `f079d49e` (the comment that stays: "the break rules are a table, not branching: each is assertable alone and a change is one row; unruled cases stay at their defaults rather than guessed").

```ts
// THE BREAK RULES ARE A TABLE, NOT BRANCHING (Fable, 2026-07-25). Each rule is
// assertable on its own, and a future ruling changes ONE ROW instead of a
// control-flow graph. That is not style: SC2.1's (MORE)/(CONT'D) is already
// scheduled to change `dialogue`'s row. If it is a row, SC2.1 is an edit; if it
// were a branch, SC2.1 would be a rewrite of the thing SC2 just proved correct.
//
// Only the two rules the brief RULES are set. The rest are the trade's open
// questions and are left at their defaults deliberately rather than guessed —
// a parenthetical orphaned at a page foot is arguably wrong too, but nobody has
// ruled it, and inventing a rule here would make it look ruled.
```

## scriptPaginate §3

From `apps/desktop/src/store/scriptPaginate.ts`, line 50 at `f079d49e` (the comment that stays: "a character cue is never the last line of a page: it travels with its dialogue").

```ts
  // "A character cue is never the last line of a page" — it travels with its
  // dialogue (the Half-Hour Writer's ruling).
```

## scriptPaginate §4

From `apps/desktop/src/store/scriptPaginate.ts`, line 58 at `f079d49e` (the comment that stays: "a parenthetical modifies the line beneath it, so it is never last on a page").

```ts
  // RULED 2026-07-25 (Fable): a parenthetical is a MODIFIER on the line beneath
  // it — stranded at a page foot it modifies nothing, and in the trade it can
  // never be the last thing on a page.
```

## scriptPaginate §5

From `apps/desktop/src/store/scriptPaginate.ts`, line 62 at `f079d49e` (the comment that stays: "a transition keeps with the previous element, expressed as the same FORWARD move (the previous page's tail moves to join it), so the pass has one direction and terminates").

```ts
  // TRANSITION — RULED, DEFERRED FROM S2a.1, AND LANDED HERE IN S2b WITH ITS
  // TERMINATION PROOF (see `applyBreakRules` below).
  //
  // The ruling is `keepWithPrevious`: a transition orphaned onto a fresh page,
  // away from the scene it ends, is the mirror of a stranded heading. The column
  // was always the easy part. The hard part was that every other rule pulls an
  // element FORWARD off a page foot, while this one reaches BACKWARD — and
  // mixing directions in one fix-up pass is where oscillation lives (A pulled
  // forward by neverLast, pulled back by keepWithPrevious, forever). This
  // function runs on every keystroke, so an oscillation is not a wrong page
  // count, it is a frozen editor.
  //
  // The resolution is that the rule is EXPRESSED AS THE SAME FORWARD MOVE.
  // Nothing is ever pulled back: a transition at a page top is repaired by
  // pushing the PREVIOUS page's last element forward to join it. Both rules
  // therefore reduce to one action — "pop page p's tail onto page p+1" — and
  // the pass has a single direction, which is what makes the proof possible.
```

## scriptPaginate §6

From `apps/desktop/src/store/scriptPaginate.ts`, line 84 at `f079d49e` (the comment that stays: "the table is consulted through this, never indexed directly: an unknown type gets the most conservative default").

```ts
// SC2 S2b — the table is consulted through this, never indexed directly.
// `BREAK_RULES[t].splittable` on a type outside the table THROWS, and a script
// doc is jsonb that arrives from storage and from other builds (scriptMetrics.ts
// carries the same reasoning and the live example — sc2.mjs's own frozen S0
// fixture seeds a type this build has no row for). The default is the most
// conservative reading of "a block of text with no ruling": it moves whole, it
// may end a page, it may begin one.
```

## scriptPaginate §7

From `apps/desktop/src/store/scriptPaginate.ts`, line 122 at `f079d49e` (the comment that stays: "project the LedgerEntry list into pages, pure and viewport-free; the page number is chrome and never costs a body line").

```ts
/**
 * Project a ledger into pages. Pure, synchronous, viewport-free.
 *
 * `linesPerPage` defaults to the DERIVED 54 (scriptMetrics.ts: 66 − 6 − 6, an
 * 11in page less two 1in margins at 6 lines/inch). The page NUMBER is chrome —
 * it sits in the top margin, outside the body — so it never costs a body line.
 */
```

## scriptPaginate §8

From `apps/desktop/src/store/scriptPaginate.ts`, line 137 at `f079d49e` (the comment that stays: "the first element of a page contributes no space above it; the entries stay position-independent, and position is known here").

```ts
    // The consumer's suppression rule, applied here exactly as the renderer
    // applies it at document start: the first element of a page contributes no
    // space above it. The ledger stays position-independent; this is where
    // position is known.
```

## scriptPaginate §9

From `apps/desktop/src/store/scriptPaginate.ts`, line 253 at `f079d49e` (the comment that stays: "total pages the entries project to; derived, never stored").

```ts
/** Total pages a ledger projects to. Derived; never stored. */
```
