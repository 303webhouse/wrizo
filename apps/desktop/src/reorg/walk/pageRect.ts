// WHERE THE PAGE STANDS, for the walk's card and its chip: the paper itself (in Free Write the column is far wider than the paper), as Cascade.tsx picks it; a copy kept far off screen for measuring is not it.
export function walkPageRect(): DOMRect | null {
  for (const sel of ['.desk-frame-stage--prose .mode-page, .entry-full', '.mode-pagecol']) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth) return r;
    }
  }
  return null;
}
