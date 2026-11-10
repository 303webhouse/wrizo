// ARBOR v2 MOCKUP - THE PAGE'S SCROLLBAR (Nick's Nov 4 rule, all themes: 4 px, writing surface only, only when the page overflows, shown on scroll,
// hover or drag, gone about 1 s after; built here for Arbor under the flag - the Wrizors' 4b, Fable Nov 10: the r22 thumb was 6 px and stood at rest).
// While the page scrolls, or the pointer is over the scrollbar's own strip (a drag scrolls, so it counts as scrolling), the scroller carries
// data-arbor2-sb="on"; 1 s after the last of those it is taken off (styles/arbor-v2.css paints the thumb only then). In-session, nothing stored.
// Never while she writes (html[data-wz-writing]): the Typewriter's glide scrolls the page on her keys, and the recede already hides the bar then.
// THE REPAINT (frames r23 run 42775628857: with the attribute on, the strip stayed clear): Chromium keeps a ::-webkit-scrollbar's parts as styled
// until the scrollbar is rebuilt, so each change of state rebuilds it once - overflow hidden for one layout, the scroll position put back. Twice
// a scroll (on, then off), never per scroll event, never on a key.
const HOLD_MS = 1000;
const SCROLLER = '.mode-scroll';

export function mountScrollReveal(): void {
  const timers = new WeakMap<Element, number>();
  let rebuilding = false;
  const rebuild = (el: HTMLElement) => {
    rebuilding = true;
    const top = el.scrollTop;
    el.style.overflowY = 'hidden';
    void el.offsetWidth;
    el.style.overflowY = '';
    void el.offsetWidth;
    if (el.scrollTop !== top) el.scrollTop = top;
    rebuilding = false;
  };
  const set = (el: HTMLElement, on: boolean) => {
    if ((el.getAttribute('data-arbor2-sb') === 'on') === on) return;
    if (on) el.setAttribute('data-arbor2-sb', 'on'); else el.removeAttribute('data-arbor2-sb');
    rebuild(el);
  };
  const show = (el: HTMLElement) => {
    if (rebuilding || document.documentElement.getAttribute('data-wz-writing') === 'true') return;
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
