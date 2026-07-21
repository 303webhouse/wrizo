// B3 S2 — small, pure arithmetic helpers every deck's own `deal` function
// may use to convert a (column, row) index into the normalized page-width
// fractions Box.x/y/w/h already use. These do NOT decide layout — each
// deck's own file still chooses which column/row a given beat lands in
// (the brief's own "the deal function itself owns the geometry" law); this
// is only unit conversion, the same role BoardEditor.tsx's own
// ADD_CARD_GAP/NEW_CARD_W constants already play for the "Add card" tool.

export const CARD_H = 0.09;
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
