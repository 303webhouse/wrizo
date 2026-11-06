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

// r21 LATENCY FIX (Fable's ruling, Nov 5: the attribution turn put the r21 day room's typing at 62 ms a key against r20's 25, and 25 again with the
// shade off): the copies r21 added - the top bar, the rail, the open drawers, the rail's pop-outs, the Mood menu - each held the whole live drawing
// (its blur and ~115 animated leaf clusters). They now draw ONE bitmap, rendered once from the same file at full strength and shared: no live blur,
// breeze or flutter in them (at the page's 3.4% none of it read). Each moves only by the drift's compositor transform, its animation started at
// the room's own start time, so it stands where the room's drawing stands. THE PAGE'S COPY AND THE ROOM ARE r20's, live, unchanged.
let bitmap: string | null = null;
const bitmapWait: ((url: string) => void)[] = [];
function withBitmap(use: (url: string) => void): void {
  if (bitmap) { use(bitmap); return; }
  bitmapWait.push(use);
  if (bitmapWait.length > 1) return;
  const vb = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(svgText), vw = vb ? Number(vb[1]) : 1400, vh = vb ? Number(vb[2]) : 900;
  // once, at the size the window's covering fit asks (device pixels; capped): a later, larger window stretches a blurred shade a little
  const k = Math.min(4096 / vw, Math.max((innerWidth + 32) / vw, (innerHeight + 32) / vh) * (window.devicePixelRatio || 1));
  const W = Math.max(1, Math.round(vw * k)), H = Math.max(1, Math.round(vh * k));
  // full strength (the group's own 20% goes; each copy's element carries the page's alpha, so the bitmap keeps its 8-bit precision)
  const src = svgText.replace(/<style>[\s\S]*?<\/style>/, '').replace(/ width="[^"]*" height="[^"]*"/, ` width="${W}" height="${H}"`).replace(/(<g filter="[^"]*") opacity="[^"]*"/, '$1 opacity="1"');
  const img = new Image();
  const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    c.getContext('2d')?.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(url);
    c.toBlob((b) => { if (!b) return; bitmap = URL.createObjectURL(b); bitmapWait.splice(0).forEach((f) => f(bitmap!)); }, 'image/png');
  };
  img.src = url;
}

// the shade across the paper. §18.1 asks 4% ("the page's text holds 14.1:1"); on this page (paper #F3EDE1, ink #241A10) 4% measured 13.78:1
// at the darkest overlap (run 41903778893), under Fable's 13.9 floor - 3.4% is the strongest that holds it (13.91). HANDED UP to Fable.
const PAGE_ALPHA = '0.034';

/** A copy that draws the shared bitmap: the layer, its drift wrapper (the bitmap covers it, centred - the room's own xMidYMid slice) */
function makeBitmapLayer(alpha: string): { layer: HTMLDivElement; drift: HTMLDivElement } {
  const layer = document.createElement('div');
  layer.className = 'arbor2-pagesh';
  layer.setAttribute('data-bitmap', 'true');
  layer.setAttribute('aria-hidden', 'true');
  const drift = document.createElement('div');
  drift.className = 'arbor2-pergola-drift';
  drift.style.opacity = alpha;
  withBitmap((u) => { drift.style.backgroundImage = `url("${u}")`; });
  layer.appendChild(drift);
  return { layer, drift };
}

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
  // DIAGNOSTIC TEST BUILD (never shipped): the room draws the bitmap too, at the file's own 20%
  const room = (() => { const b = makeBitmapLayer('0.2'); b.layer.className = 'arbor2-pergola'; b.layer.removeAttribute('data-bitmap');
    const d = b.drift.style; d.backgroundRepeat = 'no-repeat'; d.backgroundPosition = 'center'; d.backgroundSize = 'cover'; return b; })();
  document.body.appendChild(room.layer);

  // r21 (spec §18.6, Nick: "the pergola shade crosses any overlapping open menu, at the PAGE's subtle strength"): a copy at the page's strength in
  // every surface that stands over the day room - the page, the open drawers, the rail's pop-outs, the Mood menu, the top bar and the rail -
  // each beneath its own words, each placed where the room's drawing stands on the screen, so it reads as one shadow over everything.
  const HOSTS = [".desk-frame-stage .mode-page",".wz-sliver-panel[data-open='true'] > .wz-drawer-slide",".wz-tutor-panel[data-open='true'] > .wz-drawer-slide",".wz-cascade-panel",".chrome-top.sprint-nav",".desk-frame-strip",".arbor2-bar"];
  const copies = new Map<HTMLElement, { layer: HTMLDivElement; drift: HTMLDivElement }>();
  const ro = new ResizeObserver(() => placeAll());
  // a copy's drawing stands where the room's does: offset by its host's own position, in the host's own units (a host may be scaled)
  const place = (host: HTMLElement, c: { drift: HTMLDivElement }) => {
    const r = host.getBoundingClientRect();
    const k = host.offsetWidth > 0 ? r.width / host.offsetWidth : 1;
    const d = c.drift.style;
    const set = (name: string, v: string) => { if (d.getPropertyValue(name) !== v) d.setProperty(name, v); };
    set('--arbor2-pk', String(k));
    // (a bitmap copy in an unscaled host drifts on literal pixels - arbor2-pergola-drift-px - so its animation runs on the compositor)
    if (c.drift.parentElement?.hasAttribute('data-bitmap')) { const flat = Math.abs(k - 1) < 0.005 ? 'true' : 'false'; const L = c.drift.parentElement; if (L.getAttribute('data-flat') !== flat) { L.setAttribute('data-flat', flat); requestAnimationFrame(() => sync(L)); } }
    set('left', `${(-r.left - 16) / k - host.clientLeft}px`);
    set('top', `${(-r.top - 16) / k - host.clientTop}px`);
    set('width', `${(innerWidth + 32) / k}px`);
    set('height', `${(innerHeight + 32) / k}px`);
  };
  const placeAll = () => copies.forEach((c, h) => place(h, c));
  // the breeze and the drift cross every layer together: each copy's animations take the room's start times
  const sync = (layer: HTMLElement) => {
    const of = (root: HTMLElement) => document.getAnimations().filter((x) => { const t = (x.effect as KeyframeEffect | null)?.target as Element | null; return !!t && root.contains(t); });
    const a = of(room.layer), b = of(layer);
    // a bitmap copy has one animation, the drift: it takes the start time of the room's drift (its wrapper's own animation)
    if (layer.hasAttribute('data-bitmap')) {
      const rd = a.find((x) => ((x.effect as KeyframeEffect | null)?.target as Element | null) === room.drift);
      b.forEach((x) => { if (rd && rd.startTime != null) x.startTime = rd.startTime; });
      return;
    }
    if (a.length !== b.length) return;
    b.forEach((x, i) => { if (a[i].startTime != null) x.startTime = a[i].startTime; });
  };
  const attach = () => {
    const now = new Set<HTMLElement>();
    for (const sel of HOSTS) document.querySelectorAll<HTMLElement>(sel).forEach((h) => { if (h.getBoundingClientRect().width > 0) now.add(h); });
    for (const [h, c] of copies) if (!now.has(h) || !h.contains(c.layer)) { c.layer.remove(); ro.unobserve(h); copies.delete(h); }
    for (const h of now) {
      if (copies.has(h)) continue;
      // the page keeps r20's live copy; every other surface draws the shared bitmap
      // DIAGNOSTIC TEST BUILD: the page's copy is a bitmap copy too
      const c = makeBitmapLayer(PAGE_ALPHA);
      if (room.layer.hasAttribute('data-asleep')) c.layer.setAttribute('data-asleep', 'true');
      h.appendChild(c.layer); copies.set(h, c); ro.observe(h); place(h, c);
      requestAnimationFrame(() => requestAnimationFrame(() => sync(c.layer)));
    }
  };
  // surfaces come and go with routes, drawers and menus: one look per frame at most on a batch of changes
  let looking = false;
  new MutationObserver(() => { if (looking) return; looking = true; requestAnimationFrame(() => { looking = false; attach(); }); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-open'] });
  // one placement per frame at most (a scroll while typing never forces extra layout); a sliding drawer or a lifted bar is followed as it lands
  let queued = false;
  const later = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; placeAll(); }); };
  addEventListener('resize', later);
  addEventListener('scroll', later, true);
  addEventListener('transitionend', later, true);
  addEventListener('animationend', later, true);
  window.setInterval(() => { if (copies.size) placeAll(); }, 500);
  // r21 latency fix, part 2 (Fable's ruling, Nov 5: "take the faded drawing out of style work until it returns"): once the writing fade has
  // run its course the drawing in every shade layer sleeps (data-asleep: content-visibility hidden on its drift wrapper, arbor-v2.css), and it
  // wakes the moment writing ends, before the fade back in. Nothing visible changes - it sleeps only at opacity 0.
  const root = document.documentElement;
  const writing = () => root.getAttribute('data-wz-writing') === 'true';
  const layers = () => [room.layer, ...[...copies.values()].map((c) => c.layer)];
  const sleep = (on: boolean) => layers().forEach((l) => { if (on) l.setAttribute('data-asleep', 'true'); else l.removeAttribute('data-asleep'); });
  let sleepT = 0;
  const onWriting = () => {
    window.clearTimeout(sleepT);
    if (!writing()) { sleep(false); return; }
    // the fade's own length, as the stylesheet sets it while writing (6 s; reduced motion: none), and a quarter second to spare
    const d = getComputedStyle(room.layer).transitionDuration.split(',')[0].trim();
    const ms = (parseFloat(d) || 0) * (d.endsWith('ms') ? 1 : 1000);
    sleepT = window.setTimeout(() => { if (writing()) sleep(true); }, ms + 250);
  };
  new MutationObserver(onWriting).observe(root, { attributes: true, attributeFilter: ['data-wz-writing'] });
  attach();
  onWriting();
}
