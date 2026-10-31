// ARBOR v2 MOCKUP, r5 - §2c.1: the top bar flush to the window's top, with the "..." inside it (Nick's pick, Oct 31 1:34 pm; Arbor only,
// under the flag, in the mockup). THE PAGE NEVER MOVES: the bar (each surface's `.chrome-top.sprint-nav`) keeps its place in the layout and
// is DRAWN higher by a transform (styles/arbor-v2.css), so nothing below it is laid out again. This module only measures:
//   --arbor2-bar-lift    the gap above the bar's laid-out top (its rect's top, plus the lift already applied), so the drawn bar sits at 0
//   --arbor2-dots-top    where App.tsx's fixed "..." control goes: centred in the drawn bar's height,
//   --arbor2-dots-right  and inside the bar's right end (the bar's own right padding makes the room, beside its last item)
//   data-arbor2-dots     'in' while a bar is on screen to hold it (otherwise the "..." keeps its own corner)
// Two rect reads, on resize, on route change and every 300 ms (never on a keystroke). Nothing is stored.
const INSET = 12;   // the "..." sits this far inside the bar's right edge

export function mountChrome(root: HTMLElement): void {
  let last = '';
  const update = () => {
    const bar = [...document.querySelectorAll<HTMLElement>('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0);
    if (!bar) {
      if (last !== 'none') { last = 'none'; root.style.removeProperty('--arbor2-bar-lift'); root.removeAttribute('data-arbor2-dots'); }
      return;
    }
    const lifted = parseFloat(getComputedStyle(root).getPropertyValue('--arbor2-bar-lift')) || 0;
    const r = bar.getBoundingClientRect();
    const lift = Math.max(0, Math.round((r.top + lifted) * 10) / 10);
    const glyph = document.querySelector<HTMLElement>('.gh-corner-glyph');
    const gh = glyph ? glyph.getBoundingClientRect().height || 30 : 30;
    const top = Math.max(0, (r.height - gh) / 2);
    const right = Math.max(0, innerWidth - r.right + INSET);
    const key = `${lift}|${top}|${right}`;
    if (key === last) return;
    last = key;
    root.style.setProperty('--arbor2-bar-lift', `${lift}px`);
    root.style.setProperty('--arbor2-dots-top', `${Math.round(top * 10) / 10}px`);
    root.style.setProperty('--arbor2-dots-right', `${Math.round(right * 10) / 10}px`);
    root.setAttribute('data-arbor2-dots', 'in');
  };
  update();
  addEventListener('resize', update);
  addEventListener('hashchange', () => requestAnimationFrame(update));
  setInterval(update, 300);
}
