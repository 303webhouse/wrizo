// FLUX 3 - THE CURRENT: ONE LAYER FOR TWO THINGS (Fable, Nov 21, 4:56 pm and 6:00 pm; flux-full-look-for-monday.md item 8 and section 2). Loaded only under ?flux3=1 (boot.ts imports it), and it draws only in the Flux theme.
//
//   THE HANDS OPEN AS CURRENT (POLISH's Oct 28 mockup; Nick, 4:40 pm): when she presses a drawer's tab and the menu opens, a 1 px cyan line shoots from the tab along the menu box's top edge, and an electron runs
//   the line for as long as the menu is open. THE MENU'S OWN BOX DRAWS IT (flux-current.css): this module only puts a mark, data-flux-hand, on the panel after a press of its tab opens it, and takes it off when the
//   menu shuts however it shuts. The line is the panel's ::before and the electron its ::after: no element is added to the page, no geometry is read, nothing is laid out for it. (The first form, a separate
//   element placed over the menu, cost the box's frame clock 1.4 to 2.7 ms in two L runs, 02:21Z and 04:41Z.)
//   THE STAGE CURRENT, v2 (flux-stage-current-concept-v2.png; Nick, 4:47 pm: "just a subtle shot of current"): when she changes stage, a 1 px cyan spark about 60 px long leaves the pressed stage button along the
//   top bar's lower edge to each side, then runs one lap around each menu (a closed menu: its opener tab) in about 0.55 s and is gone. Nothing stays lit behind it. Wire In has no menus, so pressing it sends none;
//   leaving it sends one to the menus as they return. The paths are fluxCurrentPath.ts (pure, proved by flux3-current-unit.mjs): the top bar and the gutters only, never the page's rectangle.
//
// THE TYPING PATH IS NEVER TOUCHED. This module has a click listener on the document (capture) and a focus-in and a focus-out listener (capture): the focus moves when she clicks into her page or leaves it, never
// per key. It has no key, input, scroll, selection or pointer-move listener, no timer loop and no frame loop (two frame requests after a click, so the click's re-render has settled before the geometry is read).
// A menu that opens by the keyboard or at page load draws no current: only a press of the tab or the stage button does. Under reduced motion, or at Ambiance 0, nothing is drawn at all (effectiveAmbianceDial is 0 in
// both). The electron rests the moment her cursor is in the page: the focus-in sets data-flux-writing on the root and a CSS rule pauses and hides it (no script per key, and no :has()). scripts/harness/flux3-current.mjs
// proves each of these, and the typing cost on the box.
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

/** the geometry may not be there yet (leaving Wire In, the page and its menus come back): a few later tries, 150 ms apart, then it is let go - never a loop */
function later(fn: () => void, tries: number): void {
  if (tries > 0) setTimeout(fn, 150);
}

function stage(btn: HTMLElement, tries = 4): void {
  if (!btn.isConnected || !active()) return;
  const b = rectOf(btn);
  const page = rectOf(document.querySelector('.mode-page'));
  const bar = rectOf(btn.closest('.chrome-top') || btn.parentElement);
  if (!b || !page || !bar) { later(() => stage(btn, tries - 1), tries); return; }
  const left = menuRect('left');
  const right = menuRect('right');
  const sp = stagePaths({ btn: b, barBottom: bar.bottom, page, left, right });
  const paths: RunPath[] = [];
  if (sp.left && left) paths.push({ side: 'left', pts: sp.left, length: pathLength(sp.left), menu: left });
  if (sp.right && right) paths.push({ side: 'right', pts: sp.right, length: pathLength(sp.right), menu: right });
  if (!paths.length) { later(() => stage(btn, tries - 1), tries); return; }
  state.runs += 1;
  state.last = { kind: 'stage', at: Date.now(), paths, sparkPx: SPARK_PX, durationMs: SPARK_MS, layers: sparkLayers(1).length, strokePx: 1 };
  drawSpark(paths);
}

// ---- the hands' current -----------------------------------------------------------------------------------------------------------------------
// The mark on the menu's panel is all there is (see the header): flux-current.css draws the line and the electron from it, and only while the panel is open.

interface Hand { panel: Element; mo: MutationObserver }
const hands = new Map<Side, Hand>();

function showHand(s: Side, panel: Element): void {
  if (hands.has(s)) return;
  panel.setAttribute('data-flux-hand', '');
  // however the menu shuts (its tab, Esc, the shortcut), the mark goes with it
  const mo = new MutationObserver(() => { if (panel.getAttribute('data-open') !== 'true') hideHand(s); });
  mo.observe(panel, { attributes: true, attributeFilter: ['data-open'] });
  hands.set(s, { panel, mo });
  state.runs += 1;
  state.last = { kind: 'hand', side: s, at: Date.now(), paths: [], sparkPx: SPARK_PX, durationMs: SPARK_MS, layers: 0, strokePx: 1 };
}

function hideHand(s: Side): void {
  const h = hands.get(s);
  if (!h) return;
  hands.delete(s);
  h.mo.disconnect();
  h.panel.removeAttribute('data-flux-hand');
}

// ---- the electron rests while she is in her page ---------------------------------------------------------------------------------------------------

const inPage = (e: Event): boolean => { const t = e.target as Element | null; return !!t && typeof t.closest === 'function' && !!t.closest('.forward-only-editor'); };
function onFocusIn(e: FocusEvent): void { if (inPage(e)) document.documentElement.setAttribute('data-flux-writing', ''); }
function onFocusOut(e: FocusEvent): void { if (inPage(e)) document.documentElement.removeAttribute('data-flux-writing'); }

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

function attach(): void {
  document.addEventListener('click', onClick, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  const ae = document.activeElement;
  if (ae && typeof ae.closest === 'function' && ae.closest('.forward-only-editor')) document.documentElement.setAttribute('data-flux-writing', '');
}
function detach(): void {
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('focusin', onFocusIn, true);
  document.removeEventListener('focusout', onFocusOut, true);
  (['left', 'right'] as Side[]).forEach(hideHand);
  document.documentElement.removeAttribute('data-flux-writing');
  clearSparks();
}
attach();

// the seam the checks read: how many runs, the last one's paths, and the way to take the listener away (a check's own control)
Object.defineProperty(window, 'wrizoFluxCurrent', {
  configurable: true,
  value: { get runs() { return state.runs; }, get last() { return state.last; }, hands: () => [...hands.keys()], attach, detach },
});
