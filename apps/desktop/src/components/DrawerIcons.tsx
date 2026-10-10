// PHASE 1 - the drawer's inline icons ("icons over words" for TOOLS and ACTIONS; the tab words stay words, per Nick). Drawn, not typed: an
// emoji or a font glyph would wear whatever the OS decided today. 16x16, currentColor, stroke-only, so they take the control's own rest and
// chosen colours. Decorative: the button carries the name (aria-label + title).
const base = { viewBox: '0 0 16 16', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const TagsIcon = () => (
  <svg {...base}><path d="M2.4 8.3 8.3 2.4h4.9v4.9l-5.9 5.9a1.3 1.3 0 0 1-1.9 0L2.4 10.2a1.3 1.3 0 0 1 0-1.9z" /><circle cx="10.6" cy="5.4" r=".9" /></svg>
);
export const CopyIcon = () => (
  <svg {...base}><rect x="5.6" y="5.6" width="7.9" height="7.9" rx="1" /><path d="M10.4 3.6V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6.4a1 1 0 0 0 1 1h.6" /></svg>
);
export const DeleteIcon = () => (
  <svg {...base}><path d="M3 4.5h10M6.4 4.5V3h3.2v1.5M4.4 4.5l.6 8.6h6l.6-8.6M7 7v4M9 7v4" /></svg>
);
export const HeaderFooterIcon = () => (
  <svg {...base}><rect x="3" y="2" width="10" height="12" rx="1" /><path d="M3 5h10M3 11h10" /></svg>
);
