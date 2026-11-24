import { colX, colWidth } from '../layout';

// PRESETS-B item 4 (load sheet v2, section 4): the decks that deal one kind of card as many times as the writer says put them in ONE ROW of n equal columns (the way Scene-Sequel's scenes and Character Study's characters sit in columns); five and seven narrow the margin and the gap, as Scene-Sequel's five do.
export function rowSlots(n: number): { x: number; w: number }[] {
  const marginX = n >= 5 ? 0.02 : 0.03;
  const gap = n >= 5 ? 0.015 : 0.02;
  const w = colWidth(n, marginX, gap);
  return Array.from({ length: n }, (_, i) => ({ x: colX(i, n, marginX, gap), w }));
}
