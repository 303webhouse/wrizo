// THE DRAWER ALIGNMENT (Nick, via Fable, Nov 1; all themes, built in this mockup under its flag). Open, a drawer stands flush against the page
// and its opener tab rides the drawer's OUTER edge. The left tab's travel is pure CSS (its panel is a fixed share of its own anchor). The right
// panel's width is set by Tutor.tsx when it opens, so this reads that width into one CSS variable on <html>, which the stylesheet uses as the
// right tab's travel. In memory only: nothing is stored. A ResizeObserver follows the panel's width; a cheap lookup (on a pointer press and
// every 400 ms, never on a keystroke) follows the panel itself when a surface mounts a new one.
export function mountDrawerEdge(root: HTMLElement, varName: string): void {
  let panel: HTMLElement | null = null;
  const write = (el: HTMLElement) => root.style.setProperty(varName, `${Math.round(el.offsetWidth)}px`);
  const ro = new ResizeObserver(() => { if (panel) write(panel); });
  const find = () => {
    const p = document.querySelector<HTMLElement>('.wz-tutor-panel');
    if (p === panel) return;
    if (panel) ro.unobserve(panel);
    panel = p;
    if (p) { ro.observe(p); write(p); }
  };
  find();
  document.addEventListener('pointerdown', find, true);
  setInterval(find, 400);
}
