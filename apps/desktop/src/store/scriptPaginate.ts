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
  scene: { neverLast: true, keepWithNext: true, splittable: false },
  // "A character cue is never the last line of a page" — it travels with its
  // dialogue (the Half-Hour Writer's ruling).
  character: { neverLast: true, keepWithNext: true, splittable: false },
  // The one permitted split: an action block longer than a full page cannot
  // move whole, so it breaks at a line boundary.
  action: { neverLast: false, keepWithNext: false, splittable: true },
  // No element splits in SC2. Dialogue's row is what SC2.1 edits.
  dialogue: { neverLast: false, keepWithNext: false, splittable: false },
  // RULED 2026-07-25 (Fable): a parenthetical is a MODIFIER on the line beneath
  // it — stranded at a page foot it modifies nothing, and in the trade it can
  // never be the last thing on a page.
  paren: { neverLast: true, keepWithNext: true, splittable: false },
  // TRANSITION IS DEFERRED, AND THIS IS THE "SAY SO" (Fable's own option).
  // The ruling is `keepWithPrevious` — a transition orphaned onto a fresh page,
  // away from the scene it ends, is the mirror of a stranded heading. It needs a
  // FOURTH COLUMN, and the column is the easy part; the hard part is that every
  // other rule pulls an element FORWARD off a page foot, while this one is the
  // only rule that reaches BACKWARD. Mixing directions in one fix-up pass is
  // where oscillation lives — A pulled forward by neverLast, pulled back by
  // keepWithPrevious, forever — and this function runs on every keystroke, so an
  // oscillation is not a wrong page count, it is a frozen editor.
  // The safe shape is known (push the PREVIOUS page's last element forward to
  // join the transition, never pull the transition back, so every move stays
  // forward-only and the pass provably terminates). It is deferred to S2b so it
  // lands with a termination proof in the harness rather than under time
  // pressure here. Recorded as owed, not as decided-against.
  transition: { neverLast: false, keepWithNext: false, splittable: false },
  shot: { neverLast: false, keepWithNext: false, splittable: false },
  general: { neverLast: false, keepWithNext: false, splittable: false },
};

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
      cur.push({ entry, lines: remaining, spaceBefore: space, continues: false, continuedFrom: false });
      used += space + remaining;
      continue;
    }

    // It does not fit. An element longer than a whole page cannot move whole —
    // if it is splittable it breaks at a line boundary, otherwise it moves.
    if (BREAK_RULES[entry.t].splittable && space + remaining > linesPerPage) {
      let continuedFrom = false;
      while (remaining > 0) {
        const room = linesPerPage - used - space;
        if (room <= 0) { flush(); space = 0; continue; }
        const take = Math.min(room, remaining);
        remaining -= take;
        cur.push({ entry, lines: take, spaceBefore: space, continues: remaining > 0, continuedFrom });
        used += space + take;
        space = 0;
        continuedFrom = true;
        if (remaining > 0) flush();
      }
      continue;
    }

    flush();
    cur.push({ entry, lines: remaining, spaceBefore: 0, continues: false, continuedFrom: false });
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
 * Pull trailing elements forward until no page ends on an element that may not
 * end one. A page is never emptied to satisfy a rule — an element alone on a
 * page has nowhere to go, and orphan-avoidance must not become an infinite
 * regress.
 */
function applyBreakRules(pages: Placed[][], linesPerPage: number): Placed[][] {
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    for (;;) {
      if (page.length < 2) break;                     // never empty a page
      const last = page[page.length - 1];
      if (last.continues || last.continuedFrom) break; // a split is not an orphan
      const rule = BREAK_RULES[last.entry.t];
      const isLastOfDoc = p === pages.length - 1;
      const orphaned = rule.neverLast || (rule.keepWithNext && !isLastOfDoc);
      if (!orphaned) break;
      if (isLastOfDoc) break;                          // nothing follows it to join
      page.pop();
      const next = pages[p + 1];
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
