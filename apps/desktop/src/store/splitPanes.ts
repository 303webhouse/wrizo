// ITEM 169 — THE SPLIT VIEW'S PANE COUNT (docs/menus/b144-plus-menu-and-unnest-
// amendment.md §5/§7). Nick's counts are the REQUIREMENT: two boards side by side
// on laptops and tablets, three on desktops. "Laptop", "tablet" and "desktop" are
// not values the app can read, so the boundary is ARITHMETIC over the stage's
// measured width, never a device table:
//
//   panes = the largest n <= 3 such that n x SPLIT_PANE_MIN_W + (n-1) x SPLIT_GUTTER
//           <= the stage's width.
//
// THE CONSTANTS, TUNED TO REACH BOTH COUNTS (measured at stage 1, see
// docs/menus/item144-board-tabs-offer.md): at the amendment's first numbers (a
// 560px pane, 28px gutter) three panes needed a 1736px stage and the frame caps the
// stage at 1720 (`--frame-max`) — three were UNREACHABLE at every width the app can
// have, and two began only at ~1221px viewport. So the PANE MINIMUM is tuned, and
// the frame max is left alone (it would only have moved the three-pane threshold):
//   SPLIT_PANE_MIN_W = 480  ->  two panes need 988, three need 1496.
//   The stage is min(viewport - 2 x host padding, 1720): two panes from a 1100px
//   viewport (stage 1034, and still 1019 with a classic 15px scrollbar), three from
//   ~1576px (host padding is 40 above 1333). Laptops/tablets (1100-1575) get two;
//   desktops (1576+) get three; 1680, 1920 and 2200 all get three.
//   The 28px gutter is accepted (Fable, 2026-09-24).
// `CANVAS_MIN_W` (560, BoardEditor.tsx) is the canvas's own RESIZE floor and is NOT
// changed: a pane may be narrower than it, and a board whose persisted canvas width
// is wider than its pane scrolls inside the pane's own wrap.
//
// WHERE A SCREEN TRULY CANNOT FIT TWO READABLE PANES, ONE IS HONEST: below the
// 1100px DeskFrame gate there is no frame at all (DESKFRAME_MIN_WIDTH), so the split
// is absent there — the same rule's floor, not a special case.
//
// WHETHER 480PX IS A READABLE PANE for a board's cards is a founder look, not
// arithmetic; if it proves too tight the constant moves and this rule does not.
export const SPLIT_PANE_MIN_W = 480;
export const SPLIT_GUTTER = 28;
export const SPLIT_MAX_PANES = 3;
/** The frame's own cap on the stage (`--frame-max`, index.css). Restated because CSS custom properties are not readable here; splitPanes.mjs-style checks assert the two agree. */
export const FRAME_MAX_W = 1720;

/** Panes that fit a stage of `stageWidth` px (>= 1; one is the honest floor). */
export function paneCountFor(stageWidth: number): number {
  let n = 1;
  for (let k = 2; k <= SPLIT_MAX_PANES; k++) {
    if (k * SPLIT_PANE_MIN_W + (k - 1) * SPLIT_GUTTER <= stageWidth) n = k;
  }
  return n;
}

/** The stage's width from the viewport's, per the frame's own CSS (`clamp(16px, 3vw, 40px)` host padding each side, single-column grid capped at `--frame-max`). */
export function stageWidthFor(viewportWidth: number): number {
  const pad = Math.min(40, Math.max(16, viewportWidth * 0.03));
  return Math.min(viewportWidth - 2 * pad, FRAME_MAX_W);
}
