// ARBOR v2 MOCKUP, r19 - THE DAY ROOM'S PERGOLA SHADOW (spec draft 35 §18.1; handoff-FABLE-arbor-r19.md md5 65ac1b8e; Fable's rulings, Nov 4).
// The Wrizors' painted texture (pergola-shadow.svg: arbor-pergola-shadow.svg md5 1ae1d048 - two beams, ten rafters, a post, ~115 leaf clusters
// on the timber; shade #3F4D22 at 20%, blur 2.8) is drawn twice, from the one file, in the one place on the screen:
//   .arbor2-pergola   the room: fixed under everything (z -1), the SVG fitted to the window;
//   .arbor2-pagesh    the page: inside .mode-page, beneath the words, the same SVG at the same screen position (so the shade runs on across
//                     the paper), its group at 4% (§18.1: "drawn on the paper beneath the words"). At rest only: never while writing, never on
//                     the zoomed page, never in print (styles/arbor-v2.css); aria-hidden, no pointer, no selection, outside the editable text,
//                     so it never enters a copy or an export.
// THE BREEZE AND THE DRIFT are the file's own CSS animations, moved into arbor-v2.css (scoped; the file's <style> is dropped): every leaf
// cluster shivers once every 16 s, staggered left to right over ~2.6 s (each cluster's own delay and pivot are in the file), and the drift
// (12 px over 20 s) moves a wrapper outside the blur, so it is composited and never re-blurs the shade. The page copy's animations are given
// the room's start times, so the breeze crosses both together. Reduced motion: still (the CSS).
// REST <-> WRITING rides the existing recede hook (<html data-wz-writing>, useChromeDissolve): opacity transitions on these two layers and the
// rhizome's, nothing else (arbor-v2.css). Nothing is stored.
import svgText from './pergola-shadow.svg?raw';

// the shade across the paper. §18.1 asks 4% ("the page's text holds 14.1:1"); on this page (paper #F3EDE1, ink #241A10) 4% measured 13.78:1
// at the darkest overlap (run 41903778893), under Fable's 13.9 floor - 3.4% is the strongest that holds it (13.91). HANDED UP to Fable.
const PAGE_ALPHA = '0.034';

function makeLayer(cls: string, alpha: string | null): { layer: HTMLDivElement; drift: HTMLDivElement } {
  const layer = document.createElement('div');
  layer.className = cls;
  layer.setAttribute('aria-hidden', 'true');
  const drift = document.createElement('div');
  drift.className = 'arbor2-pergola-drift';
  drift.innerHTML = svgText.replace(/<style>[\s\S]*?<\/style>/, '');
  const svg = drift.querySelector('svg');
  if (svg) {
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('focusable', 'false');
    if (alpha) svg.querySelector('g[filter]')?.setAttribute('opacity', alpha);
  }
  layer.appendChild(drift);
  return { layer, drift };
}

/** The room's layer, appended to <body>; and the page's, kept inside whichever .mode-page is on screen. */
export function mountPergola(): void {
  const room = makeLayer('arbor2-pergola', null);
  document.body.appendChild(room.layer);

  let page: { layer: HTMLDivElement; drift: HTMLDivElement } | null = null;
  let host: HTMLElement | null = null;
  const ro = new ResizeObserver(() => place());
  // the page copy's drawing stands where the room's does on the screen: offset by the page's own position (its padding box)
  const place = () => {
    if (!page || !host) return;
    const r = host.getBoundingClientRect();
    page.drift.style.left = `${-(r.left + host.clientLeft)}px`;
    page.drift.style.top = `${-(r.top + host.clientTop)}px`;
  };
  // the breeze and the drift cross both layers together: the page's animations take the room's start times
  const sync = () => {
    if (!page) return;
    const of = (root: HTMLElement) => document.getAnimations().filter((a) => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && root.contains(t);
    });
    const a = of(room.layer), b = of(page.layer);
    if (a.length !== b.length) return;
    b.forEach((x, i) => { if (a[i].startTime != null) x.startTime = a[i].startTime; });
  };
  const attach = () => {
    const next = document.querySelector<HTMLElement>('.desk-frame-stage .mode-page');
    if (next === host && page && next?.contains(page.layer)) return;
    if (page) { page.layer.remove(); ro.disconnect(); }
    host = next; page = null;
    if (!host) return;
    page = makeLayer('arbor2-pagesh', PAGE_ALPHA);
    host.appendChild(page.layer);
    ro.observe(host);
    place();
    requestAnimationFrame(() => requestAnimationFrame(sync));
  };
  // a page comes and goes with the route; a cheap look on each batch of changes (no reads unless the page element changed)
  new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
  // one placement per frame at most (a scroll while typing never forces extra layout)
  let queued = false;
  const later = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; place(); }); };
  addEventListener('resize', later);
  addEventListener('scroll', later, true);
  attach();
}
