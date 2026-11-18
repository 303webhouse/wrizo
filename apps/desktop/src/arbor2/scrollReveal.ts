// ARBOR v2 MOCKUP - THE PAGE'S SCROLLBAR (Nick's Nov 4 rule, all themes: 4 px, writing surface only, only when the page overflows, shown on scroll,
// hover or drag, gone about 1 s after; built here for Arbor under the flag - the Wrizors' 4b, Fable Nov 10: the r22 thumb was 6 px and stood at rest).
// While the page scrolls, or the pointer is over the scrollbar's own strip (a drag scrolls, so it counts as scrolling), the scroller carries
// data-arbor2-sb="on"; 1 s after the last of those it is taken off (styles/arbor-v2.css paints the thumb only then). In-session, nothing stored.
// Never while she writes (html[data-wz-writing]): the Typewriter's glide scrolls the page on her keys, and the recede already hides the bar then.
// (A rebuild of the scrollbar on each change of state was tried for the repaint and is not needed: the variant without it, frames 42777004777, drew
// the thumb on scroll and hover and cleared it after, the same as with it - the first red was the check's own sampling. Removed: no extra layout.)
const HOLD_MS = 1000;
const SCROLLER = '.mode-scroll';

export function mountScrollReveal(): void {
  const timers = new WeakMap<Element, number>();
  const set = (el: HTMLElement, on: boolean) => {
    if ((el.getAttribute('data-arbor2-sb') === 'on') === on) return;
    if (on) el.setAttribute('data-arbor2-sb', 'on'); else el.removeAttribute('data-arbor2-sb');
  };
  const show = (el: HTMLElement) => {
    if (document.documentElement.getAttribute('data-wz-writing') === 'true') return;
    set(el, true);
    const t = timers.get(el);
    if (t) window.clearTimeout(t);
    timers.set(el, window.setTimeout(() => set(el, false), HOLD_MS));
  };
  document.addEventListener('scroll', (e) => {
    const el = e.target;
    if (el instanceof HTMLElement && el.matches(SCROLLER)) show(el);
  }, { capture: true, passive: true });
  // the pointer over the strip itself: a scroller's strip is its box less its client width (only when it overflows; no strip, nothing to show)
  document.addEventListener('pointermove', (e) => {
    const el = e.target instanceof Element ? (e.target.closest(SCROLLER) as HTMLElement | null) : null;
    if (!el || el.scrollHeight <= el.clientHeight + 1) return;
    const strip = el.offsetWidth - el.clientWidth;
    if (strip <= 0) return;
    const r = el.getBoundingClientRect();
    const k = el.offsetWidth > 0 ? r.width / el.offsetWidth : 1;   // the zoomed page is painted at a scale
    if (e.clientX >= r.right - strip * k - 1) show(el);
  }, { passive: true });
}
