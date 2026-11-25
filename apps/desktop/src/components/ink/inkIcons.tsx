import type { StrokeTip } from '../../types';

// ITEM 121 I4 — THE TIPS, as inline SVG (R8: the desk's glyphs are drawn, not
// typed — an emoji or a font glyph would wear whatever the OS decided today).
// 16x16, currentColor, stroke-only so they inherit the zone's own rest/chosen
// colours exactly like every other control here. Moved here from Sliver.tsx (VISUAL 1a.1): the drawer's grip mark and the INK tab (loaded on
// demand) both draw them.
export const TIP_ICONS: Record<StrokeTip, React.ReactNode> = {
  // A nib pen: barrel to a point, with the nib's slit.
  pen: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M11.5 2.2 4.3 9.4 3 13l3.6-1.3 7.2-7.2z" strokeLinejoin="round" />
      <path d="M4.3 9.4 6.6 11.7" />
    </svg>
  ),
  // A pencil: the same barrel, but with the sharpened collar a pencil has.
  pencil: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M11.2 2.5 3.9 9.8 2.7 13.3l3.5-1.2 7.3-7.3z" strokeLinejoin="round" />
      <path d="M9.6 4.1 11.9 6.4" />
      <path d="M2.7 13.3 5 11" />
    </svg>
  ),
  // A marker: a fat barrel with a chisel wedge — the shape the square cap makes.
  marker: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M12.6 2.6 7.4 7.8l-2.6 1 -1 2.6 2.6-1 1-2.6 5.2-5.2z" strokeLinejoin="round" />
      <path d="M2.6 13.4 4.8 11.2" strokeLinecap="round" />
    </svg>
  ),
};
