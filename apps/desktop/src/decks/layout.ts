// B3 S2 — small, pure arithmetic helpers every deck's own `deal` function
// may use to convert a (column, row) index into the normalized page-width
// fractions Box.x/y/w/h already use. These do NOT decide layout — each
// deck's own file still chooses which column/row a given beat lands in
// (the brief's own "the deal function itself owns the geometry" law); this
// is only unit conversion, the same role BoardEditor.tsx's own
// ADD_CARD_GAP/NEW_CARD_W constants already play for the "Add card" tool.

// W3: 0.09 -> 0.105. A dealt step now carries a QUESTION of up to three lines in the narrowest columns (Scene-Sequel x5, the Fifteen Beats) beside its title and, under Flux, the card's own X . Y readout in its
// bottom band: the taller card holds all three without the question running into the readout (found in the box-turn frame, not by a check - PART 2 now measures it). Every deck deals from this one constant.
export const CARD_H = 0.105;
export const ROW_GAP = 0.02;
export const START_Y = 0.04;
export const COL_GAP = 0.02;
export const MARGIN_X = 0.03;

// The x for a given column, given how many equal-width columns share the
// page and an optional override for the margin/gap (Feature Screenplay's
// four narrower columns use a tighter margin than a two/three-column deck).
export function colX(col: number, colCount: number, marginX = MARGIN_X, gap = COL_GAP): number {
  const w = colWidth(colCount, marginX, gap);
  return marginX + col * (w + gap);
}

export function colWidth(colCount: number, marginX = MARGIN_X, gap = COL_GAP): number {
  return (1 - 2 * marginX - (colCount - 1) * gap) / colCount;
}

export function rowY(row: number, startY = START_Y, h = CARD_H, gap = ROW_GAP): number {
  return startY + row * (h + gap);
}
