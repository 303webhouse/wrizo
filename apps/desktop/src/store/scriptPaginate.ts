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
  // An action block longer than a full page cannot move whole, so it breaks at
  // a line boundary.
  action: { neverLast: false, keepWithNext: false, splittable: true, keepWithPrevious: false },
  // SCRIPT batch 2, items 1 and 2 (the review's findings 2 and 12): a speech's dialogue breaks at a page foot, preferring a sentence end,
  // keeping at least two of its lines on each side, with (MORE) under it and the cue with (CONT'D) over the rest (see `paginate`). A dialogue
  // line with no cue above it is in no speech: it breaks only when it is longer than a page, as action does.
  dialogue: { neverLast: false, keepWithNext: false, splittable: true, keepWithPrevious: false },
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
  /** SCRIPT batch 2, item 2: the speech goes on past this page after this line, so (MORE) is drawn under it. One line. */
  more: boolean;
  /** SCRIPT batch 2, item 2: this line continues a speech from the page before, so its cue with (CONT'D) is drawn above it. `entry.contdLines` lines. */
  contd: boolean;
}

/** The furniture lines a placed part carries: (MORE) under it, the cue with (CONT'D) over it. */
export const furnitureOf = (p: Placed): number => (p.more ? 1 : 0) + (p.contd ? p.entry.contdLines : 0);
const heightOf = (page: Placed[]): number => page.reduce((n, x) => n + x.spaceBefore + x.lines + furnitureOf(x), 0);

// at least this many lines of a speech stay on a page before (MORE), and go on after it
const MIN_SPEECH_LINES = 2;
// a parenthetical or dialogue line of a speech (the cue is the speech's head, not one of its lines)
const isSpeechLine = (e: LedgerEntry): boolean => e.speech !== null && e.t !== 'character';

// SCRIPT batch 2, item 2 — how many of a speech's remaining lines go on this page before (MORE): the latest sentence end that keeps at least
// two lines on each side, or, where no sentence ends in that range, as many as fit. 0 when two cannot stay and two go.
function speechTake(entry: LedgerEntry, taken: number, remaining: number, room: number): number {
  const most = Math.min(room, remaining - MIN_SPEECH_LINES);
  if (most < MIN_SPEECH_LINES) return 0;
  for (let i = entry.sentenceEnds.length - 1; i >= 0; i--) {
    const take = entry.sentenceEnds[i] - taken;
    if (take < MIN_SPEECH_LINES) break;
    if (take <= most) return take;
  }
  return most;
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

  const L = linesPerPage;
  const flush = () => { if (cur.length) { pages.push(cur); cur = []; used = 0; } };
  const place = (p: Placed) => { cur.push(p); used += p.spaceBefore + p.lines + furnitureOf(p); };
  const unplace = (): Placed => { const p = cur.pop() as Placed; used -= p.spaceBefore + p.lines + furnitureOf(p); return p; };

  for (let k = 0; k < ledger.length; k++) {
    const entry = ledger[k];
    const next = ledger[k + 1];
    // SCRIPT batch 2, item 2: a line of a speech that the speech goes on after keeps one line free under it, so (MORE) always has its line
    // if the page breaks right after it.
    const reserve = isSpeechLine(entry) && next !== undefined && next.speech === entry.speech ? 1 : 0;
    let remaining = entry.lines;
    let taken = 0;                                    // lines of this element already placed
    let contd = false;                                // the next part placed opens a page that continues this speech

    for (;;) {
      // the first element of a page contributes no space above it; the entries stay position-independent, and position is known here [scriptPaginate §8]
      const space = cur.length === 0 ? 0 : entry.spaceBefore;
      const furniture = contd ? entry.contdLines : 0;
      if (used + furniture + space + remaining + reserve <= L) {
        place({ entry, lines: remaining, spaceBefore: space, continues: false, continuedFrom: taken > 0, lineOffset: taken, more: false, contd });
        break;
      }

      // It does not fit. A speech's dialogue breaks here with (MORE) under it, when two of its lines can stay and two go (SCRIPT batch 2, item 2).
      if (entry.t === 'dialogue' && entry.speech !== null) {
        const take = speechTake(entry, taken, remaining, L - used - furniture - space - 1);
        if (take > 0) {
          place({ entry, lines: take, spaceBefore: space, continues: true, continuedFrom: taken > 0, lineOffset: taken, more: true, contd });
          taken += take; remaining -= take;
          flush(); contd = true;
          continue;
        }
      } else if (ruleFor(entry.t).splittable && space + remaining > L) {
        // An element longer than a whole page cannot move whole: an action block (or a dialogue line in no speech) breaks at a line boundary.
        const room = L - used - space;
        if (room > 0) {
          place({ entry, lines: room, spaceBefore: space, continues: true, continuedFrom: taken > 0, lineOffset: taken, more: false, contd: false });
          taken += room; remaining -= room;
        }
        flush();
        continue;
      }

      // Alone on a fresh page and still too long, and it may not break: it stands alone and overflows (the stated bound, sc2 P4).
      if (cur.length === 0) {
        place({ entry, lines: remaining, spaceBefore: 0, continues: false, continuedFrom: taken > 0, lineOffset: taken, more: false, contd });
        break;
      }

      // It moves to the next page. Inside a speech the break then falls between two of its lines (SCRIPT batch 2, item 2): a parenthetical
      // left at the foot goes with it, (MORE) goes under the dialogue above, and the cue with (CONT'D) over the next page. When only the cue
      // is left above, the cue goes too and the speech simply starts on the next page.
      const carry: Placed[] = [];
      contd = false;
      if (isSpeechLine(entry)) {
        const tail = () => cur[cur.length - 1];
        while (cur.length > 1 && tail().entry.speech === entry.speech && tail().entry.t === 'paren') carry.unshift(unplace());
        const last = tail();
        if (last && last.entry.speech === entry.speech && last.entry.t === 'dialogue') {
          cur[cur.length - 1] = { ...last, more: true };
          used += 1;
          contd = true;
        } else if (cur.length > 1 && last && last.entry.speech === entry.speech && last.entry.t === 'character') {
          carry.unshift(unplace());
        }
      }
      flush();
      carry.forEach((c, j) => place({ ...c, spaceBefore: j === 0 ? 0 : c.entry.spaceBefore, more: false, contd: j === 0 && contd }));
      if (carry.length) contd = false;                // the furniture went over the first carried line
    }
  }
  flush();

  return markSpeechBreaks(applyBreakRules(pages, linesPerPage)).map((placed, index) => ({
    index,
    placed,
    linesUsed: heightOf(placed),
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
      const over = heightOf(next) - linesPerPage;
      if (over > 0) {
        const moved = next.pop();
        if (moved) pages.splice(p + 2, 0, [{ ...moved, spaceBefore: 0 }]);
      }
    }
  }
  return pages.filter((pg) => pg.length > 0);
}

// SCRIPT batch 2, item 2 — the furniture is a fact about where the pages break, so it is read off the final pages: a boundary that falls
// between two lines of one speech carries (MORE) above it and the cue with (CONT'D) below it, and no other boundary or line does. The
// filling loop has already placed and counted it; this keeps it true at a boundary the repair pass above moved.
function markSpeechBreaks(pages: Placed[][]): Placed[][] {
  const inside = (a: Placed | undefined, b: Placed | undefined) =>
    !!a && !!b && isSpeechLine(a.entry) && isSpeechLine(b.entry) && a.entry.speech === b.entry.speech;
  return pages.map((page, p) => {
    const after = pages[p + 1];
    const before = pages[p - 1];
    const breaksAfter = !!after && inside(page[page.length - 1], after[0]);
    const breaksBefore = !!before && inside(before[before.length - 1], page[0]);
    return page.map((x, j) => {
      const more = breaksAfter && j === page.length - 1;
      const contd = breaksBefore && j === 0;
      return x.more === more && x.contd === contd ? x : { ...x, more, contd };
    });
  });
}
