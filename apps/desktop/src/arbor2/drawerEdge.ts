// THE DRAWER ALIGNMENT (Nick, via Fable, Nov 1; all themes, built in this mockup under its flag). Open, a drawer stands flush against the page
// and its opener tab rides the drawer's OUTER edge. This module only measures, into CSS variables on <html> (in memory; nothing is stored):
//   <prefix>-r     the right panel's width (Tutor.tsx sets it when it opens): the right tab's travel
//   <prefix>-gl    the left panel's scrollbar strip, and
//   <prefix>-gr    the right panel's: when a drawer's content scrolls, its sliding box is inset by that strip, so the closed box is parked that
//                  much further in and travels the same distance as the tab
//   <prefix>-room  r13 (the Wrizors, Nov 1): the room between the rail and the page's left edge, which the Tools drawer may take
// and sets data-wz2-drawer-edge, which tells Tutor.tsx to keep the open panel's geometry while it closes (it slides back from where it stood).
// ResizeObservers follow the panels and their sliding boxes; a cheap lookup (on a pointer press, on resize and every 400 ms, never on a
// keystroke) follows the elements themselves when a surface mounts new ones, and re-reads the room (two rects).
export function mountDrawerEdge(root: HTMLElement, prefix: string): void {
  root.setAttribute('data-wz2-drawer-edge', '');
  const SEL = ['.wz-tutor-panel', '.wz-sliver-panel', '.wz-tutor-panel > .wz-drawer-slide', '.wz-sliver-panel > .wz-drawer-slide'];
  let els: (HTMLElement | null)[] = [];
  let room = '';
  const strip = (p: HTMLElement) => `${Math.max(0, p.offsetWidth - p.clientWidth)}px`;
  const readRoom = () => {
    const rail = document.querySelector<HTMLElement>('.desk-frame-strip, .desk-rail');
    const page = document.querySelector<HTMLElement>('.desk-frame-stage .mode-page');
    const next = rail && page ? `${Math.round(page.getBoundingClientRect().left - rail.getBoundingClientRect().right)}px` : '';
    if (next === room) return;
    room = next;
    if (next) root.style.setProperty(`${prefix}-room`, next); else root.style.removeProperty(`${prefix}-room`);
  };
  const write = () => {
    const [rp, lp] = els;
    if (rp) { root.style.setProperty(`${prefix}-r`, `${Math.round(rp.offsetWidth)}px`); root.style.setProperty(`${prefix}-gr`, strip(rp)); }
    if (lp) root.style.setProperty(`${prefix}-gl`, strip(lp));
  };
  const ro = new ResizeObserver(write);
  const find = () => {
    readRoom();
    const next = SEL.map((s) => document.querySelector<HTMLElement>(s));
    if (next.every((e, i) => e === els[i])) return;
    ro.disconnect();
    els = next;
    els.forEach((e) => { if (e) ro.observe(e); });
    write();
  };
  find();
  document.addEventListener('pointerdown', find, true);
  window.addEventListener('resize', find);
  setInterval(find, 400);
}
