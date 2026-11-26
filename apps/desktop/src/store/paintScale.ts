// THE SCALE AN ELEMENT IS PAINTED AT (#133 follow-on). The prose page lays out at scale 1 and is painted larger by a transform (store/pageScale.ts),
// so a distance read off the screen (getBoundingClientRect, a range's rects) is NOT a distance inside the page: it is divided by this before it meets
// the page's scroller or places a box inside the page. 1 for anything unscaled (and within half a percent of 1: offsetWidth is a whole number), and
// 1 when it cannot be told.
export function paintScaleOf(el: Element | null | undefined): number {
  const he = el as HTMLElement | null | undefined;
  if (!he || !he.offsetWidth) return 1;
  const s = he.getBoundingClientRect().width / he.offsetWidth;
  return s > 0 && Math.abs(s - 1) > 0.005 ? s : 1;
}
