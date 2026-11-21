// MACHINA v2 MOCKUP r10 - THE ZOOMED PAGE STAYS PAPER TO ITS EDGES (the Wrizors' r9 review, wrizors-to-ARBOR-nov4c.md md5 13e5db96: "Page: Dark
// fades to near-white at its top and bottom, so the words sit on grey (far under 13.9:1)"; Fable, Nov 4: "the fade must go to the PAGE's
// colour (likely main's bug #36); measure the page text through it").
// The cause is main's: Typewriter's zoom (Sprint) masks the whole page COLUMN to transparent above and below the writing line
// (13-desk-frame.css `.mode-pagecol[data-zoom='true']`), so the paper itself thins into whatever is behind the column - by day the light room,
// under a dark page. The band mask is the zoom's own (the ruled page-size exception) and stays; behind the column this module keeps an opaque
// sheet in the page's own --paper, the size of the visible page, so the words fade into paper and the paper never fades into the room.
// The sheet is a fixed box inside .mode-stage (one layer under the column, which is positioned z 1): it takes no pointer, is hidden from screen
// readers, never prints, and never moves or sizes the page (it follows the page's rect; it does not set it). It stops at the readout under the
// page (the run strip keeps the room behind it). Two rect reads on resize, on scroll and every 300 ms while a page is zoomed; never a keystroke.
// Nothing is stored. (Arbor's paper.ts solved the same for its rooms; this is Machina's own, the smallest form of it.)
export function mountSheet(): void {
  let sheet: HTMLDivElement | null = null;
  let last = '';
  const place = () => {
    const col = document.querySelector<HTMLElement>(".desk-frame-stage .mode-pagecol[data-zoom='true']");
    const page = col?.querySelector<HTMLElement>('.mode-page') ?? null;
    const stage = col?.closest<HTMLElement>('.mode-stage') ?? null;
    if (!col || !page || !stage) { if (sheet) { sheet.remove(); sheet = null; last = ''; } return; }
    if (!sheet || sheet.parentElement !== stage) {
      sheet?.remove();
      sheet = document.createElement('div');
      sheet.className = 'machina2-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      stage.insertBefore(sheet, stage.firstChild);
      last = '';
    }
    const a = page.getBoundingClientRect(), c = col.getBoundingClientRect();
    let foot = innerHeight;
    for (const el of document.querySelectorAll<HTMLElement>('.machina2-run, .mode-progress')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top > a.top + 40 && r.left < a.right && r.right > a.left) foot = Math.min(foot, r.top);
    }
    const l = Math.max(a.left, c.left, 0), t = Math.max(a.top, c.top, 0), r = Math.min(a.right, c.right, innerWidth), b = Math.min(a.bottom, c.bottom, foot);
    const paper = getComputedStyle(page).backgroundColor;   // the page's own paint, whichever tone (Page: Light / Dark)
    const key = r - l < 2 || b - t < 2 ? 'none' : [l, t, r - l, b - t].map((n) => Math.round(n * 10) / 10).join(',') + '|' + paper;
    if (key === last) return;
    last = key;
    if (key === 'none') { sheet.style.display = 'none'; return; }
    const [x, y, w, h] = key.split('|')[0].split(',');
    Object.assign(sheet.style, { display: 'block', left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, background: paper });
  };
  let queued = false;
  const later = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; place(); }); };
  addEventListener('resize', later);
  addEventListener('scroll', later, true);
  window.setInterval(place, 300);
  place();
}
