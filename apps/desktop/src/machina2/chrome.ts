// MACHINA v2 MOCKUP, r4 - THE TOP BAR FLUSH TO THE WINDOW'S TOP, WITH THE "..." INSIDE IT (Fable, Nov 1: "as in Arbor (page rect unchanged)";
// Arbor's src/arbor2/chrome.ts, r5 §2c.1, is the model). THE PAGE NEVER MOVES: the bar (each surface's `.chrome-top.sprint-nav`) keeps its place
// in the layout and is DRAWN higher by a transform (styles/machina-v2.css), so nothing below it is laid out again. This module only measures:
//   --machina2-bar-lift    the gap above the bar's laid-out top (its rect's top, plus the lift already applied), so the drawn bar sits at 0
//   --machina2-dots-top    where App.tsx's fixed "..." control goes: centred in the drawn bar's height,
//   --machina2-dots-right  and inside the bar's right end (the bar's own right padding makes the room, beside its last item)
//   --machina2-door-right  THE COMMAND-LINE DOOR (the Wrizors' door 1): its right edge, just left of the "..."
//   data-machina2-dots     'in' while a bar is on screen to hold them (otherwise the "..." keeps its own corner and the door is not drawn)
//   --machina2-bar-left    r5 (spec draft 9 §13b): the bar's left edge, where the NAMEPLATE goes (16 px in from it; doors.tsx Nameplate)
//   --machina2-plate-w     r5: the nameplate's own width (the mark and its tick), so the bar's left padding makes room before the crumb
// Two rect reads, on resize, on route change and every 300 ms (never on a keystroke). Nothing is stored.
const INSET = 12;   // the "..." sits this far inside the bar's right edge
const GAP = 8;      // the door sits this far left of the "..."

export function mountChrome(root: HTMLElement): void {
  let last = '';
  const update = () => {
    const bar = [...document.querySelectorAll<HTMLElement>('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0);
    if (!bar) {
      if (last !== 'none') { last = 'none'; root.style.removeProperty('--machina2-bar-lift'); root.removeAttribute('data-machina2-dots'); }
      return;
    }
    const lifted = parseFloat(getComputedStyle(root).getPropertyValue('--machina2-bar-lift')) || 0;
    const r = bar.getBoundingClientRect();
    const lift = Math.max(0, Math.round((r.top + lifted) * 10) / 10);
    const glyph = document.querySelector<HTMLElement>('.gh-corner-glyph');
    const gb = glyph?.getBoundingClientRect();
    const gh = gb?.height || 30, gw = gb?.width || 30;
    const top = Math.max(0, (r.height - gh) / 2);
    const right = Math.max(0, innerWidth - r.right + INSET);
    const plate = document.querySelector<HTMLElement>('.machina2-nameplate');
    const pw = plate ? Math.round(plate.getBoundingClientRect().width * 10) / 10 : 0;
    const left = Math.round(r.left * 10) / 10;
    const key = `${lift}|${top}|${right}|${gw}|${left}|${pw}`;
    if (key === last) return;
    last = key;
    root.style.setProperty('--machina2-bar-lift', `${lift}px`);
    root.style.setProperty('--machina2-dots-top', `${Math.round(top * 10) / 10}px`);
    root.style.setProperty('--machina2-dots-right', `${Math.round(right * 10) / 10}px`);
    root.style.setProperty('--machina2-door-right', `${Math.round((right + gw + GAP) * 10) / 10}px`);
    root.style.setProperty('--machina2-bar-h', `${Math.round(r.height * 10) / 10}px`);
    root.style.setProperty('--machina2-bar-left', `${left}px`);
    if (pw > 0) root.style.setProperty('--machina2-plate-w', `${pw}px`);
    root.setAttribute('data-machina2-dots', 'in');
  };
  update();
  addEventListener('resize', update);
  addEventListener('hashchange', () => requestAnimationFrame(update));
  setInterval(update, 300);
}
