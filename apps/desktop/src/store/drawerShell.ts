// PHASE 1 (docs/plans/phase1-drawers.md) - the two small pieces both side drawers share, in one place instead of hand-written twice.

export type DrawerSide = 'left' | 'right';

/** The arrow on a drawer's fixed tab. ONLY this glyph changes between states - the tab's box does not. It points the way the panel
 *  will travel next: a left-hand drawer opens toward the page's left (so closed shows the outward arrow), a right-hand one mirrors it.
 *  (These are exactly the literals Sliver.tsx and Tutor.tsx each wrote by hand before.) */
export function drawerArrow(side: DrawerSide, open: boolean): string {
  if (side === 'left') return open ? '›' : '‹';   // › open, ‹ closed
  return open ? '‹' : '›';                          // ‹ open, › closed
}

/** A closed drawer must not be reachable. Opacity 0 and pointer-events:none still leave every control inside it in the tab order,
 *  so the closed panel is made `inert` (and the attribute is removed when it opens). Used as a callback ref, so it runs on every
 *  render with the current state; React 18 has no typed `inert` prop, hence the attribute is set directly. */
export function setDrawerInert(el: HTMLElement | null, inert: boolean): void {
  if (!el) return;
  if (inert) {
    if (!el.hasAttribute('inert')) el.setAttribute('inert', '');
  } else if (el.hasAttribute('inert')) {
    el.removeAttribute('inert');
  }
}
