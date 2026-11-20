// THE DRAWER ALIGNMENT (Nick, via Fable, Nov 1; all themes, built in this mockup under its flag). Open, a drawer stands flush against the page
// and its opener tab rides the drawer's OUTER edge. This module only measures, into CSS variables on <html> (in memory; nothing is stored):
//   <prefix>-r    the right panel's width (Tutor.tsx sets it when it opens): the right tab's travel
//   <prefix>-gl   the left panel's scrollbar strip (its outer side, the panel is rtl), and
//   <prefix>-gr   the right panel's (its outer side): when a drawer's content scrolls, its sliding box is inset by that strip, so the closed
//                 box is parked that much further in and travels the same distance as the tab (they move together, the strip between them)
// and sets data-wz2-drawer-edge, which tells Tutor.tsx to keep the open panel's geometry while it closes (it slides back from where it stood).
// ResizeObservers follow the panels and their sliding boxes; a cheap lookup (on a pointer press and every 400 ms, never on a keystroke) follows
// the elements themselves when a surface mounts new ones.
export function mountDrawerEdge(root: HTMLElement, prefix: string): void {
  root.setAttribute('data-wz2-drawer-edge', '');
  const SEL = ['.wz-tutor-panel', '.wz-sliver-panel', '.wz-tutor-panel > .wz-drawer-slide', '.wz-sliver-panel > .wz-drawer-slide'];
  let els: (HTMLElement | null)[] = [];
  const strip = (p: HTMLElement) => `${Math.max(0, p.offsetWidth - p.clientWidth)}px`;
  const write = () => {
    const [rp, lp] = els;
    if (rp) { root.style.setProperty(`${prefix}-r`, `${Math.round(rp.offsetWidth)}px`); root.style.setProperty(`${prefix}-gr`, strip(rp)); }
    if (lp) root.style.setProperty(`${prefix}-gl`, strip(lp));
  };
  const ro = new ResizeObserver(write);
  const find = () => {
    const next = SEL.map((s) => document.querySelector<HTMLElement>(s));
    if (next.every((e, i) => e === els[i])) return;
    ro.disconnect();
    els = next;
    els.forEach((e) => { if (e) ro.observe(e); });
    write();
  };
  find();
  document.addEventListener('pointerdown', find, true);
  setInterval(find, 400);
}
