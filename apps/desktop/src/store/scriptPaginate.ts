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
   * that precedes it. SC2 S2b's fourth column; see `transition`'s row and the
   * termination note after `paginate` for why it took a slice of its own.
   */
  keepWithPrevious: boolean;
}

// the break rules are a table, not branching: each is assertable alone and a change is one row; unruled cases stay at their defaults rather than guessed [scriptPaginate §2]
export const BREAK_RULES: Record<ScriptElType, BreakRule> = {
  // "A scene heading is never the last line of a page" — it travels whole.
  scene: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
  // a character cue is never the last line of a page: it travels with its dialogue [scriptPaginate §3]
  character: { neverLast: true, keepWithNext: true, splittable: false, keepWithPrevious: false },
  // SCRIPT batch 2, item 4 (the review's finding 15): an action block that does not fit breaks at a sentence end when two of its lines can
  // stay and two go (FD §1.10.1.3.3); with no sentence end in reach it moves whole, unless it is longer than a full page, which cannot move
  // whole and breaks at a line boundary.
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

// SCRIPT batch 2, item 4 — how many of an action block's remaining lines stay on this page: the latest sentence end that keeps at least two
// lines on each side. 0 when there is none, and the block moves whole (FD breaks action only at a sentence).
const MIN_ACTION_LINES = 2;
function actionTake(entry: LedgerEntry, taken: number, remaining: number, room: number): number {
  const most = Math.min(room, remaining - MIN_ACTION_LINES);
  for (let i = entry.sentenceEnds.length - 1; i >= 0; i--) {
    const take = entry.sentenceEnds[i] - taken;
    if (take < MIN_ACTION_LINES) break;
    if (take <= most) return take;
  }
  return 0;
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
      } else if (entry.t === 'action' && actionTake(entry, taken, remaining, L - used - space) > 0) {
        // An action block breaks at a sentence end, no furniture (SCRIPT batch 2, item 4).
        const take = actionTake(entry, taken, remaining, L - used - space);
        place({ entry, lines: take, spaceBefore: space, continues: true, continuedFrom: taken > 0, lineOffset: taken, more: false, contd: false });
        taken += take; remaining -= take;
        flush();
        continue;
      } else if (ruleFor(entry.t).splittable && space + remaining > L) {
        // An element longer than a whole page cannot move whole: an action block with no sentence end in reach (or a dialogue line in no
        // speech) breaks at a line boundary.
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

      // It moves to the next page, and the page it leaves must end well (SCRIPT batch 2, item 3, the review's finding 13). Lines that may not
      // end a page (a scene heading, a cue, a parenthetical: neverLast) go over with it, as many as end the page; a line that may not open a
      // page (a transition: keepWithPrevious) takes the line above it over too. The rules are kept HERE, while the pages fill, so what moves
      // takes everything after it along and the pages after it flow on: no page is opened for one line, and no cue is left alone on one. A
      // page is never emptied, and half of a split line never travels alone (the stated refusals; in each the rule yields).
      const carry: Placed[] = [];
      const tail = () => cur[cur.length - 1];
      const movable = () => cur.length > 1 && !tail().continues && !tail().continuedFrom;
      const endsBadly = () => { const r = ruleFor(tail().entry.t); return r.neverLast || r.keepWithNext; };
      while (movable() && endsBadly()) carry.unshift(unplace());
      if (!carry.length && ruleFor(entry.t).keepWithPrevious && movable()) {
        carry.unshift(unplace());
        while (movable() && endsBadly()) carry.unshift(unplace());
      }
      // Inside a speech the break then falls between two of its lines (item 2): (MORE) goes under the dialogue above, and the cue with
      // (CONT'D) over the next page. Its line is always free: a speech line the speech goes on after keeps one (`reserve`).
      contd = false;
      const last = tail();
      const firstOver = carry.length ? carry[0].entry : entry;
      if (last && isSpeechLine(last.entry) && isSpeechLine(firstOver) && last.entry.speech === firstOver.speech) {
        cur[cur.length - 1] = { ...last, more: true };
        used += 1;
        contd = true;
      }
      flush();
      carry.forEach((c, j) => place({ ...c, spaceBefore: j === 0 ? 0 : c.entry.spaceBefore, more: false, contd: j === 0 && contd }));
      if (carry.length) contd = false;                // the furniture went over the first carried line
    }
  }
  flush();

  return markSpeechBreaks(pages).map((placed, index) => ({
    index,
    placed,
    linesUsed: heightOf(placed),
  }));
}

/*
 * SCRIPT batch 2, item 3 (the review's finding 13) — THE BREAK RULES ARE KEPT WHILE THE PAGES FILL. They used to be a second pass over
 * finished pages (`applyBreakRules`, SC2 S2b): it pushed a page's bad tail onto the next page, and when that page then overflowed it opened a
 * NEW page for the one line it pushed out, instead of letting the pages after it flow on. The panel's short showed five pages for four, one
 * holding four lines, and a cue could end up alone on a page. Now a line that may not end a page goes over with what follows it at the
 * moment the page is closed, so everything after it simply fills on from there.
 *
 * TERMINATION, structural as before (this runs on every keystroke; an oscillation would be a frozen editor, so there is no retry cap). Each
 * turn of the inner loop either places a part, or closes a page that holds at least one part, so the document is consumed in order and the
 * page count only grows. Lines only ever travel FORWARD, onto the page being opened, and only from the tail of the page being closed. The
 * refusals stay part of the proof: a page is never emptied (`cur.length > 1`), half of a split line never travels alone, and the last page has
 * nothing after it to keep with. sc2.mjs's two-directions fixture (a transition opening a page after a heading) is the case a two-way pass
 * would spin on; here the heading and the line above the transition simply go over together.
 */

// SCRIPT batch 2, item 2 — the furniture is a fact about where the pages break, so it is read off the final pages: a boundary that falls
// between two lines of one speech carries (MORE) above it and the cue with (CONT'D) below it, and no other boundary or line does. The
// filling loop has already placed and counted it; this re-reads it from the finished pages, so the drawing can never disagree with a break.
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
