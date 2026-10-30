import type { Box } from '../types';

// BUG 32 - a dealt deck's rows FIT THEIR CARDS. A deal lays its cards on a fixed lattice (decks/layout.ts); a card whose words need more room grows (BoardEditor's reflow floor), and before this
// the rows under it stayed where the deal put them, so the grown card ran under the next row and its words were clipped. This is the one rule that closes that, pure and skin-independent
// (it reads only the stored x / y / w / h, never a theme):
//   1. a row (the dealt cards that share one y) takes its tallest card's height - the shorter cards of a CHANGED row (one whose card grew or, BUG 32c, shrank) match it, so the row reads as one band;
//      a card the writer sized by hand (`sizedByHand`) keeps its own height, though it still counts toward the row's height;
//   2. every dealt card that sat clear below a changed card (starting at or past its old bottom, overlapping it sideways) moves by exactly what the card above it changed - down when it grew, back UP
//      when it shrank - so each gap the deal drew survives, and the move cascades down the column. A card never moves up past a card that did not move.
// It acts only on DEALT cards (the ones carrying `deckStep`: the board's own freeform cards are never moved), only on a pass in which a dealt card's height changed, and only ever changes a height or
// a y: it adds no field, and a pass in which nothing changed returns the same array.
const EPS = 1e-4;
const live = (b: Box) => b.kind === 'text' && !!b.deckStep && !b.deletedAt && !b.purgedAt;
const sideways = (a: Box, b: Box) => a.x < b.x + b.w - EPS && b.x < a.x + a.w - EPS;

/** `before` is the board as it stood, `grown` the same boxes after the reflow raised (or lowered) some `h`. Returns the boxes with the dealt rows fitted (the same array when no dealt card's height changed). */
export function fitDealtRows(before: Box[], grown: Box[]): Box[] {
  const old = new Map(before.map(b => [b.id, b]));
  const dealt = grown.filter(live).filter(b => old.has(b.id));
  const moved = (b: Box) => Math.abs(b.h - old.get(b.id)!.h) > EPS;
  if (!dealt.some(moved)) return grown;

  // 1. the row's height: the tallest of its (old y) row-mates, but only a row with a changed card is touched
  const rowKey = (b: Box) => Math.round(old.get(b.id)!.y / EPS);
  const rowH = new Map<number, number>();
  const rowMoved = new Set<number>();
  for (const b of dealt) { const k = rowKey(b); rowH.set(k, Math.max(rowH.get(k) ?? 0, b.h)); if (moved(b)) rowMoved.add(k); }
  const newH = new Map<string, number>();
  for (const b of dealt) newH.set(b.id, rowMoved.has(rowKey(b)) && !b.sizedByHand ? Math.max(b.h, rowH.get(rowKey(b))!) : b.h);

  // 2. the shift, row by row from the top (by OLD position): a card is carried by what the card above it changed plus how far that card was itself carried, and a row moves as ONE - every
  //    card of it takes the largest carry of its row-mates (so a row is never pulled up past a card that stayed), and the cards of a row keep sharing one y
  const growth = (b: Box) => newH.get(b.id)! - old.get(b.id)!.h;
  const rowShift = new Map<number, number>();
  const keys = [...new Set(dealt.map(rowKey))].sort((a, b) => a - b);
  for (const k of keys) {
    let carry: number | null = null;
    for (const B of dealt.filter(d => rowKey(d) === k)) {
      const oB = old.get(B.id)!;
      const above = dealt.filter(A => {
        const oA = old.get(A.id)!;
        // the cards B sat CLEAR below (an earlier row, overlapping sideways, B starting at or past A's old bottom): the deal's own tightness is never "fixed"
        return rowKey(A) < k && sideways(oA, oB) && oB.y >= oA.y + oA.h - EPS;
      });
      if (!above.length) continue;
      const gap = (A: Box) => oB.y - (old.get(A.id)!.y + old.get(A.id)!.h);
      const nearest = Math.min(...above.map(gap));
      for (const A of above) {
        const moveA = (rowShift.get(rowKey(A)) ?? 0) + growth(A);   // how far A's bottom moved
        // the card directly above B keeps its gap (B moves with it, up or down); a card further up only has to stay clear of B, so it asks for less (its own move minus the gap it already had)
        carry = Math.max(carry ?? -Infinity, gap(A) - nearest <= EPS ? moveA : moveA - gap(A));
      }
    }
    rowShift.set(k, carry ?? 0);
  }

  return grown.map(b => {
    if (!live(b) || !old.has(b.id)) return b;
    const h = newH.get(b.id)!;
    const y = old.get(b.id)!.y + (rowShift.get(rowKey(b)) ?? 0);
    return h === b.h && y === b.y ? b : { ...b, h, y };
  });
}
