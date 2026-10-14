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
// PHASE 1 (S4) - the two mode toggles beside the "..." button. Same drawing rules: 16x16, stroke-only, currentColor, so ON is the control's
// brass and OFF its quiet colour with nothing else changing.
export const TypewriterModeIcon = () => (
  <svg {...base}><rect x="2.2" y="2.6" width="11.6" height="6.2" rx="1" /><path d="M4.4 8.8v2.1M11.6 8.8v2.1M3.6 13.6h8.8l-.9-2.7H4.5zM4.6 5.7h1.1M7.4 5.7h1.1M10.2 5.7h1.1" /></svg>
);
export const ProgressModeIcon = () => (
  <svg {...base}><rect x="2" y="5.8" width="12" height="4.4" rx="2.2" /><path d="M4.2 8h4.6" /></svg>
);
export const HeaderFooterIcon = () => (
  <svg {...base}><rect x="3" y="2" width="10" height="12" rx="1" /><path d="M3 5h10M3 11h10" /></svg>
);
