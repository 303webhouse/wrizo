import type { ScriptElType } from '../types';
import { PAGE_LINES } from './scriptMetrics';
import type { LedgerEntry } from './scriptLedger';

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

export interface BreakRule {
  /** This element may never be the last on a page — it travels whole to the next. */
  neverLast: boolean;
  /** This element must travel with the element that follows it. */
  keepWithNext: boolean;
  /** This element may be split across a page boundary. */
  splittable: boolean;
  /**
   * This element may never be the FIRST on a page — it belongs with the element
   * that precedes it. SC2 S2b's fourth column; see `transition`'s row and
   * `applyBreakRules`' termination proof for why it took a slice of its own.
   */
  keepWithPrevious: boolean;
}

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
export const BREAK_RULES: Record<ScriptElType, BreakRule> = {
  // "A scene heading is never the last line of a page" — it travels whole.
  scene: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
  // "A character cue is never the last line of a page" — it travels with its
  // dialogue (the Half-Hour Writer's ruling).
  character: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
  // The one permitted split: an action block longer than a full page cannot
  // move whole, so it breaks at a line boundary.
  action: { neverLast: false, keepWithNext: false, splittable: true, keepWithPrevious: false },
  // No element splits in SC2. Dialogue's row is what SC2.1 edits.
  dialogue: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: false },
  // RULED 2026-07-25 (Fable): a parenthetical is a MODIFIER on the line beneath
  // it — stranded at a page foot it modifies nothing, and in the trade it can
  // never be the last thing on a page.
  paren: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
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
  transition: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: true },
  shot: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: false },
  general: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: false },
};

// SC2 S2b — the table is consulted through this, never indexed directly.
// `BREAK_RULES[t].splittable` on a type outside the table THROWS, and a script
// doc is jsonb that arrives from storage and from other builds (scriptMetrics.ts
// carries the same reasoning and the live example — sc2.mjs's own frozen S0
// fixture seeds a type this build has no row for). The default is the most
// conservative reading of "a block of text with no ruling": it moves whole, it
// may end a page, it may begin one.
const DEFAULT_RULE: BreakRule = { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: false };
export function ruleFor(t: ScriptElType): BreakRule {
  return BREAK_RULES[t] ?? DEFAULT_RULE;
}

export interface Placed {
  entry: LedgerEntry;
  /** Lines this element occupies ON THIS PAGE (differs from entry.lines only for a split). */
  lines: number;
  /** Blank lines above it on this page — zero at a page top, per the consumer rule. */
  spaceBefore: number;
  /** True when the element continues onto the next page. */
  continues: boolean;
  /** True when the element began on a previous page. */
  continuedFrom: boolean;
  /**
   * Index of this part's FIRST line within the element's own wrapped lines —
   * 0 for everything that is not a continuation. SC2 S2b's renderer slices the
   * writer's text with `[lineOffset, lineOffset + lines)` against
   * `wrapToLines()`, which is the same wrap the count came from, so the cut
   * cannot land anywhere but where the arithmetic put the break.
   */
  lineOffset: number;
}

export interface Page {
  index: number;          // 0-based; page ONE is index 0 and prints no number (R1)
  placed: Placed[];
  linesUsed: number;
}

/**
 * Project a ledger into pages. Pure, synchronous, viewport-free.
 *
 * `linesPerPage` defaults to the DERIVED 54 (scriptMetrics.ts: 66 − 6 − 6, an
 * 11in page less two 1in margins at 6 lines/inch). The page NUMBER is chrome —
 * it sits in the top margin, outside the body — so it never costs a body line.
 */
export function paginate(ledger: LedgerEntry[], linesPerPage: number = PAGE_LINES): Page[] {
  const pages: Placed[][] = [];
  let cur: Placed[] = [];
  let used = 0;

  const flush = () => { if (cur.length) { pages.push(cur); cur = []; used = 0; } };

  for (const entry of ledger) {
    // The consumer's suppression rule, applied here exactly as the renderer
    // applies it at document start: the first element of a page contributes no
    // space above it. The ledger stays position-independent; this is where
    // position is known.
    let space = cur.length === 0 ? 0 : entry.spaceBefore;
    let remaining = entry.lines;

    if (used + space + remaining <= linesPerPage) {
      cur.push({ entry, lines: remaining, spaceBefore: space, continues: false, continuedFrom: false, lineOffset: 0 });
      used += space + remaining;
      continue;
    }

    // It does not fit. An element longer than a whole page cannot move whole —
    // if it is splittable it breaks at a line boundary, otherwise it moves.
    if (ruleFor(entry.t).splittable && space + remaining > linesPerPage) {
      let continuedFrom = false;
      let taken = 0;                                  // lines of this element already placed
      while (remaining > 0) {
        const room = linesPerPage - used - space;
        if (room <= 0) { flush(); space = 0; continue; }
        const take = Math.min(room, remaining);
        remaining -= take;
        cur.push({ entry, lines: take, spaceBefore: space, continues: remaining > 0, continuedFrom, lineOffset: taken });
        used += space + take;
        taken += take;
        space = 0;
        continuedFrom = true;
        if (remaining > 0) flush();
      }
      continue;
    }

    flush();
    cur.push({ entry, lines: remaining, spaceBefore: 0, continues: false, continuedFrom: false, lineOffset: 0 });
    used = remaining;
  }
  flush();

  return applyBreakRules(pages, linesPerPage).map((placed, index) => ({
    index,
    placed,
    linesUsed: placed.reduce((n, p) => n + p.spaceBefore + p.lines, 0),
  }));
}

/**
 * Push trailing elements forward until no page ends on an element that may not
 * end one, and no page BEGINS on an element that may not begin one. A page is
 * never emptied to satisfy a rule — an element alone on a page has nowhere to
 * go, and orphan-avoidance must not become an infinite regress.
 *
 * THE PASS HAS EXACTLY ONE MOVE, AND IT ONLY EVER GOES FORWARD (SC2 S2b).
 * Both families of rule are repaired by the same action: pop page p's LAST part
 * and prepend it to page p+1. `neverLast` fires when page p's tail may not end a
 * page; `keepWithPrevious` fires when page p+1's HEAD may not begin one, and it
 * is repaired by sending p's tail forward to join it rather than by pulling the
 * head back. Nothing in this function ever moves a part to a lower page index.
 *
 * TERMINATION, PROVED RATHER THAN CAPPED. This runs on every keystroke, so an
 * oscillation would not be a wrong page count — it would be a frozen editor. A
 * retry limit would hide exactly that, so there is none; the bound is
 * structural:
 *
 *   1. MONOTONICITY. Let Φ = the sum, over every placed part, of the index of
 *      the page it sits on. The primary move takes one part from page p to page
 *      p+1 (+1); the overflow correction takes one part from page p+1 to a fresh
 *      page p+2 (+1). No part's page index ever decreases, and each iteration
 *      strictly increases Φ. A state can therefore never recur — which is what
 *      "cannot oscillate" means precisely.
 *   2. A LINEAR BOUND. `p` only ever increases and a page is visited once. The
 *      inner loop at page p removes one part from page p per iteration and stops
 *      at `page.length < 2`, so it runs at most `|page p| − 1` times. Summed
 *      over pages that is at most N − P primary moves for N parts on P pages,
 *      each followed by at most one correction: AT MOST 2N MOVES, always.
 *   3. THE REFUSALS ARE PART OF THE PROOF, not gaps in it. A page holding a
 *      single part cannot give it up (it would empty the page); the last page
 *      of the document has nowhere to push to; a part that is half of a split
 *      cannot travel alone. In each case the rule yields and the orphan stands.
 *      That is a deliberate, bounded failure to be pretty, chosen over an
 *      unbounded attempt to be perfect.
 *
 * sc2.mjs proves it on the fixture engineered to trip both directions at once —
 * a transition at a page top whose previous page ends on a scene heading — which
 * is the case a two-directional pass would spin on.
 */
function applyBreakRules(pages: Placed[][], linesPerPage: number): Placed[][] {
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    for (;;) {
      if (page.length < 2) break;                      // never empty a page
      // `pages.length` grows as corrections append, so this is re-read, never hoisted.
      if (p === pages.length - 1) break;               // nothing follows it to join
      const last = page[page.length - 1];
      if (last.continues || last.continuedFrom) break; // a split part cannot travel alone
      const next = pages[p + 1];
      const rule = ruleFor(last.entry.t);
      const endsBadly = rule.neverLast || rule.keepWithNext;
      const opensBadly = ruleFor(next[0].entry.t).keepWithPrevious && !next[0].continuedFrom;
      if (!endsBadly && !opensBadly) break;
      page.pop();
      // It becomes the first element of the next page, so it loses its space.
      next.unshift({ ...last, spaceBefore: 0 });
      // The element it displaced is no longer at a page top and regains its own.
      if (next.length > 1) next[1] = { ...next[1], spaceBefore: next[1].entry.spaceBefore };
      // Only re-check if the next page still fits; overflow is corrected below.
      const over = next.reduce((n, x) => n + x.spaceBefore + x.lines, 0) - linesPerPage;
      if (over > 0) {
        const moved = next.pop();
        if (moved) pages.splice(p + 2, 0, [{ ...moved, spaceBefore: 0 }]);
      }
    }
  }
  return pages.filter((pg) => pg.length > 0);
}

/** Total pages a ledger projects to. Derived; never stored. */
export function pageCount(ledger: LedgerEntry[], linesPerPage: number = PAGE_LINES): number {
  return paginate(ledger, linesPerPage).length;
}
