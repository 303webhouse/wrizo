import type { Box } from '../types';

// BUG 32 - a dealt deck's rows FIT THEIR CARDS. A deal lays its cards on a fixed lattice (decks/layout.ts); a card whose words need more room grows (BoardEditor's reflow floor), and before this
// the rows under it stayed where the deal put them, so the grown card ran under the next row and its words were clipped. This is the one rule that closes that, pure and skin-independent
// (it reads only the stored x / y / w / h, never a theme):
//   1. a row (the dealt cards that share one y) takes its tallest card's height - the shorter cards of a GROWN row grow to match, so the row reads as one band;
//   2. every dealt card that sat clear below a grown card (starting at or past its old bottom, overlapping it sideways) moves down by exactly what the card above it grew, so each gap the deal
//      drew survives, and the move cascades down the column.
// It acts only on DEALT cards (the ones carrying `deckStep`: the board's own freeform cards are never moved), only on a pass in which a card GREW, and only ever grows a height or moves a card
// down: it adds no field, and a pass in which nothing grew returns the same array.
const EPS = 1e-4;
const live = (b: Box) => b.kind === 'text' && !!b.deckStep && !b.deletedAt && !b.purgedAt;
const sideways = (a: Box, b: Box) => a.x < b.x + b.w - EPS && b.x < a.x + a.w - EPS;

/** `before` is the board as it stood, `grown` the same boxes after the reflow floor raised some `h`. Returns the boxes with the dealt rows fitted (the same array when no dealt card grew). */
export function fitDealtRows(before: Box[], grown: Box[]): Box[] {
  const old = new Map(before.map(b => [b.id, b]));
  const dealt = grown.filter(live).filter(b => old.has(b.id));
  const grew = (b: Box) => b.h > old.get(b.id)!.h + EPS;
  if (!dealt.some(grew)) return grown;

  // 1. the row's height: the tallest of its (old y) row-mates, but only a row with a grown card is touched
  const rowKey = (b: Box) => Math.round(old.get(b.id)!.y / EPS);
  const rowH = new Map<number, number>();
  const rowGrew = new Set<number>();
  for (const b of dealt) { const k = rowKey(b); rowH.set(k, Math.max(rowH.get(k) ?? 0, b.h)); if (grew(b)) rowGrew.add(k); }
  const newH = new Map<string, number>();
  for (const b of dealt) newH.set(b.id, rowGrew.has(rowKey(b)) ? Math.max(b.h, rowH.get(rowKey(b))!) : b.h);

  // 2. the shift, row by row from the top (by OLD position): a card is carried down by what the card above it grew plus how far that card was itself carried, and a row moves as ONE - every
  //    card of it takes the largest carry of its row-mates, so the cards of a row keep sharing one y
  const growth = (b: Box) => newH.get(b.id)! - old.get(b.id)!.h;
  const rowShift = new Map<number, number>();
  const keys = [...new Set(dealt.map(rowKey))].sort((a, b) => a - b);
  for (const k of keys) {
    let carry = 0;
    for (const B of dealt.filter(d => rowKey(d) === k)) {
      const oB = old.get(B.id)!;
      for (const A of dealt) {
        const oA = old.get(A.id)!;
        if (rowKey(A) >= k || !sideways(oA, oB)) continue;
        if (oB.y < oA.y + oA.h - EPS) continue;   // not stacked clear below A to begin with: the deal's own tightness is never "fixed"
        carry = Math.max(carry, (rowShift.get(rowKey(A)) ?? 0) + growth(A));
      }
    }
    rowShift.set(k, carry);
  }

  return grown.map(b => {
    if (!live(b) || !old.has(b.id)) return b;
    const h = newH.get(b.id)!;
    const y = old.get(b.id)!.y + (rowShift.get(rowKey(b)) ?? 0);
    return h === b.h && y === b.y ? b : { ...b, h, y };
  });
}
