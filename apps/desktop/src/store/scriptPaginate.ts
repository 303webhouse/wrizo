import type { ScriptElType } from '../types';
import { PAGE_LINES } from './scriptMetrics';
import type { LedgerEntry } from './scriptLedger';

// pages are a projection of the line count (lineLedger), recomputed, never stored; no width or font enters, so pagination is viewport-invariant by construction [scriptPaginate §1]

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

// the break rules are a table, not branching: each is assertable alone and a change is one row; unruled cases stay at their defaults rather than guessed [scriptPaginate §2]
export const BREAK_RULES: Record<ScriptElType, BreakRule> = {
  // "A scene heading is never the last line of a page" — it travels whole.
  scene: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
  // a character cue is never the last line of a page: it travels with its dialogue [scriptPaginate §3]
  character: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
  // The one permitted split: an action block longer than a full page cannot
  // move whole, so it breaks at a line boundary.
  action: { neverLast: false, keepWithNext: false, splittable: true, keepWithPrevious: false },
  // No element splits in SC2. Dialogue's row is what SC2.1 edits.
  dialogue: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: false },
  // a parenthetical modifies the line beneath it, so it is never last on a page [scriptPaginate §4]
  paren: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
  // a transition keeps with the previous element, expressed as the same FORWARD move (the previous page's tail moves to join it), so the pass has one direction and terminates [scriptPaginate §5]
  transition: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: true },
  shot: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: false },
  general: { neverLast: false, keepWithNext: false, splittable: false, keepWithPrevious: false },
};

// the table is consulted through this, never indexed directly: an unknown type gets the most conservative default [scriptPaginate §6]
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

// project the LedgerEntry list into pages, pure and viewport-free; the page number is chrome and never costs a body line [scriptPaginate §7]
export function paginate(ledger: LedgerEntry[], linesPerPage: number = PAGE_LINES): Page[] {
  const pages: Placed[][] = [];
  let cur: Placed[] = [];
  let used = 0;

  const flush = () => { if (cur.length) { pages.push(cur); cur = []; used = 0; } };

  for (const entry of ledger) {
    // the first element of a page contributes no space above it; the entries stay position-independent, and position is known here [scriptPaginate §8]
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
