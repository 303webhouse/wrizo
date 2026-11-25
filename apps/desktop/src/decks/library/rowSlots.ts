import { colX, colWidth, CARD_H } from '../layout';

// PRESETS-B item 4 (load sheet v2, section 4): the decks that deal one kind of card as many times as the writer says put them in ONE ROW of n equal columns (the way Scene-Sequel's scenes and Character Study's characters sit in columns); five and seven narrow the margin and the gap, as Scene-Sequel's five do.
export function rowSlots(n: number): { x: number; w: number }[] {
  const marginX = n >= 5 ? 0.02 : 0.03;
  const gap = n >= 5 ? 0.015 : 0.02;
  const w = colWidth(n, marginX, gap);
  return Array.from({ length: n }, (_, i) => ({ x: colX(i, n, marginX, gap), w }));
}

// THE SEVEN-CARD HEIGHT (Fable, Nov 24, 11:01 am; reorg-presets-b-cards-fit.mjs): a row of seven makes each card about 12% of the page's width, so its question wraps to four lines in Machina and the standard card
// (CARD_H) scrolls before she has typed a word. A row of seven takes a taller card (a third more); a row of fewer keeps the standard one.
export function rowH(n: number): number {
  return n >= 7 ? CARD_H * 1.3 : CARD_H;
}
