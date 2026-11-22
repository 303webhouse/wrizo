// FLUX 3 - THE CURRENT: ONE LAYER FOR TWO THINGS (Fable, Nov 21, 4:56 pm and 6:00 pm; flux-full-look-for-monday.md item 8 and section 2). Loaded only under ?flux3=1 (boot.ts imports it), and it draws only in the Flux theme.
//
//   THE HANDS OPEN AS CURRENT (POLISH's Oct 28 mockup; Nick, 4:40 pm): when she presses a drawer's tab and the menu opens, a 1 px cyan line shoots from the tab along the menu box's top edge, and an electron runs
//   the line for as long as the menu is open. The line and the electron are one small element beside the menu (flux-current.css); it goes when the menu shuts, however it shuts.
//   THE STAGE CURRENT, v2 (flux-stage-current-concept-v2.png; Nick, 4:47 pm: "just a subtle shot of current"): when she changes stage, a 1 px cyan spark about 60 px long leaves the pressed stage button along the
//   top bar's lower edge to each side, then runs one lap around each menu (a closed menu: its opener tab) in about 0.55 s and is gone. Nothing stays lit behind it. Wire In has no menus, so pressing it sends none;
//   leaving it sends one to the menus as they return. The paths are fluxCurrentPath.ts (pure, proved by flux3-current-unit.mjs): the top bar and the gutters only, never the page's rectangle.
//
// THE TYPING PATH IS NEVER TOUCHED. This module has ONE listener, a click on the document (capture), and a resize listener only while a hand is open. It has no key, input, scroll, selection or pointer-move
// listener, no timer loop and no frame loop (two frame requests after a click, so the click's re-render has settled before the geometry is read). A menu that opens by the keyboard or at page load draws no
// current: only a press of the tab or the stage button does. Under reduced motion, or at Ambiance 0, nothing is drawn at all (effectiveAmbianceDial is 0 in both). The electron rests while the page's editor
// has focus (a CSS rule, no script). scripts/harness/flux3-current.mjs proves each of these, and the typing cost on the box.
import { effectiveAmbianceDial } from '../store/ambianceDial';
import { SPARK_MS, SPARK_PX, pathLength, sparkLayers, stagePaths, type Pt, type Rect } from './fluxCurrentPath';

const NS = 'http://www.w3.org/2000/svg';
type Side = 'left' | 'right';

interface RunPath { side: Side; pts: Pt[]; length: number; menu: Rect }
interface Last { kind: 'stage' | 'hand'; at: number; paths: RunPath[]; side?: Side; sparkPx: number; durationMs: number; layers: number; strokePx: number }

const state = { runs: 0, last: null as Last | null };

/** the layer draws only in the Flux theme under the flag, and never at Ambiance 0 or under reduced motion (the effective dial is 0 in both) */
function active(): boolean {
  const root = document.documentElement;
  return root.hasAttribute('data-flux3') && root.getAttribute('data-theme') === 'flux' && effectiveAmbianceDial() > 0;
}

const rectOf = (el: Element | null): Rect | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0 || getComputedStyle(el).visibility === 'hidden') return null;
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
};

/** two frames after a click: the click's own re-render (the stage, the drawer's open state) has settled before any geometry is read */
function afterSettle(fn: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

// ---- the stage spark -----------------------------------------------------------------------------------------------------------------------------

function clearSparks(): void {
  document.querySelectorAll('[data-flux-current]').forEach((n) => n.remove());
}

function drawSpark(paths: RunPath[]): void {
  clearSparks();
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'flux-current');
  svg.setAttribute('data-flux-current', '');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', String(window.innerWidth));
  svg.setAttribute('height', String(window.innerHeight));
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  const anims: Animation[] = [];
  for (const p of paths) {
    const d = p.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    for (const layer of sparkLayers(p.length)) {
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('d', d);
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', layer.color);
      el.setAttribute('stroke-opacity', String(layer.opacity));
      el.setAttribute('stroke-width', String(layer.width));
      el.setAttribute('stroke-dasharray', `${layer.len} ${Math.ceil(p.length) + 24}`);
      el.setAttribute('stroke-dashoffset', String(layer.offsetFrom));
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      if (layer.len <= 3) el.setAttribute('class', 'flux-current-head');
      svg.appendChild(el);
      anims.push(el.animate([{ strokeDashoffset: layer.offsetFrom }, { strokeDashoffset: layer.offsetTo }], { duration: SPARK_MS, easing: 'linear', fill: 'forwards' }));
    }
  }
  document.body.appendChild(svg);
  const remove = () => svg.remove();
  void Promise.allSettled(anims.map((a) => a.finished)).then(remove);
  setTimeout(remove, SPARK_MS + 400);   // belt: a layer that was cancelled or never finished is still gone
}

/** a menu's rectangle for the lap: its open box, else its opener tab */
function menuRect(side: Side): Rect | null {
  const panel = document.querySelector(side === 'left' ? '.wz-sliver-panel' : '.wz-tutor-panel');
  if (panel && panel.getAttribute('data-open') === 'true') {
    const r = rectOf(panel);
    if (r) return r;
  }
  return rectOf(document.querySelector(side === 'left' ? '.wz-sliver-grip' : '.wz-tutor-grip'));
}

function stage(btn: HTMLElement): void {
  if (!btn.isConnected || !active()) return;
  const b = rectOf(btn);
  const page = rectOf(document.querySelector('.mode-page'));
  const bar = rectOf(btn.closest('.chrome-top') || btn.parentElement);
  if (!b || !page || !bar) return;
  const left = menuRect('left');
  const right = menuRect('right');
  const sp = stagePaths({ btn: b, barBottom: bar.bottom, page, left, right });
  const paths: RunPath[] = [];
  if (sp.left && left) paths.push({ side: 'left', pts: sp.left, length: pathLength(sp.left), menu: left });
  if (sp.right && right) paths.push({ side: 'right', pts: sp.right, length: pathLength(sp.right), menu: right });
  if (!paths.length) return;
  state.runs += 1;
  state.last = { kind: 'stage', at: Date.now(), paths, sparkPx: SPARK_PX, durationMs: SPARK_MS, layers: sparkLayers(1).length, strokePx: 1 };
  drawSpark(paths);
}

// ---- the hands' current -----------------------------------------------------------------------------------------------------------------------

interface Hand { el: HTMLElement; panel: Element; mo: MutationObserver }
const hands = new Map<Side, Hand>();

/** put the hand's box on the menu's: its left, top and width, in the coordinates of whatever it is placed in (a transformed ancestor would shift a fixed box, so the offset is read and taken out) */
function place(h: Hand): void {
  const r = h.panel.getBoundingClientRect();
  h.el.style.left = '0px';
  h.el.style.top = '0px';
  const o = h.el.getBoundingClientRect();
  h.el.style.left = `${r.left - o.left}px`;
  h.el.style.top = `${r.top - o.top}px`;
  h.el.style.width = `${r.width}px`;
  h.el.style.setProperty('--run', `${(side(h) === 'left' ? -1 : 1) * Math.max(0, r.width - 4)}px`);
}
const side = (h: Hand): Side => (h.el.getAttribute('data-flux-hand') === 'left' ? 'left' : 'right');

function onResize(): void {
  hands.forEach(place);
}

function showHand(s: Side, panel: Element): void {
  if (hands.has(s)) { place(hands.get(s) as Hand); return; }
  const el = document.createElement('div');
  // the same classes as the menu's own panel: it fades with the chrome when she writes (.desk-dissolve) and takes no pointer
  el.className = 'flux-hand chrome-fade desk-dissolve';
  el.setAttribute('data-flux-hand', s);
  el.setAttribute('data-tab', s === 'left' ? 'right' : 'left');   // the tab is on the menu's page-facing end
  el.setAttribute('aria-hidden', 'true');
  const line = document.createElement('i');
  line.className = 'flux-hand-line';
  const electron = document.createElement('i');
  electron.className = 'flux-hand-electron';
  el.append(line, electron);
  (panel.closest('.desk-frame-host') || document.body).appendChild(el);
  const mo = new MutationObserver(() => { if (panel.getAttribute('data-open') !== 'true') hideHand(s); });
  mo.observe(panel, { attributes: true, attributeFilter: ['data-open'] });
  const h: Hand = { el, panel, mo };
  hands.set(s, h);
  if (hands.size === 1) window.addEventListener('resize', onResize);
  place(h);
  state.runs += 1;
  state.last = { kind: 'hand', side: s, at: Date.now(), paths: [], sparkPx: SPARK_PX, durationMs: SPARK_MS, layers: 0, strokePx: 1 };
}

function hideHand(s: Side): void {
  const h = hands.get(s);
  if (!h) return;
  hands.delete(s);
  h.mo.disconnect();
  if (!hands.size) window.removeEventListener('resize', onResize);
  h.el.classList.add('flux-hand-closing');   // the line retracts to its tab (flux-current.css), then the element goes
  setTimeout(() => h.el.remove(), 200);
}

// ---- the one listener ---------------------------------------------------------------------------------------------------------------------------

function onClick(e: MouseEvent): void {
  const t = e.target as Element | null;
  if (!t || typeof t.closest !== 'function') return;
  const tab = t.closest('.desk-mode-tab') as HTMLElement | null;
  if (tab) {
    // a CHANGE of stage only: the tab she is already in, a tab that is not live, and Wire In (which has no menus) send no spark
    if (tab.getAttribute('aria-selected') === 'true' || tab.getAttribute('aria-disabled') === 'true' || tab.getAttribute('data-mode-key') === 'freewrite') return;
    if (!active()) return;
    afterSettle(() => stage(tab));
    return;
  }
  const grip = t.closest('.wz-sliver-grip, .wz-tutor-grip');
  if (grip) {
    const s: Side = grip.classList.contains('wz-sliver-grip') ? 'left' : 'right';
    const panel = document.querySelector(s === 'left' ? '.wz-sliver-panel' : '.wz-tutor-panel');
    if (!panel) return;
    afterSettle(() => { if (panel.getAttribute('data-open') === 'true' && active()) showHand(s, panel); else hideHand(s); });
  }
}

function attach(): void { document.addEventListener('click', onClick, true); }
function detach(): void {
  document.removeEventListener('click', onClick, true);
  (['left', 'right'] as Side[]).forEach(hideHand);
  clearSparks();
}
attach();

// the seam the checks read: how many runs, the last one's paths, and the way to take the listener away (a check's own control)
Object.defineProperty(window, 'wrizoFluxCurrent', {
  configurable: true,
  value: { get runs() { return state.runs; }, get last() { return state.last; }, hands: () => [...hands.keys()], attach, detach },
});
