// FLUX3 S3 - THE IDLE GLITCH (the spec's §5; flux-rulings-oct31.md q4; Fable's S3 ruling B: under the flag it REPLACES GlitchMeter, so Flux has one
// idle glitch; its switch is the existing Flicker setting; off the flag GlitchMeter is unchanged).
// An OVERLAY ONLY. It never touches the page: a glitching word is a separate element laid over the word (the page's own paper colour behind it,
// code glyphs in it), in a layer on <body> that is aria-hidden, takes no pointer and cannot be selected. The page's DOM text, its selection,
// copy and word count are never changed, and the caret's line is never touched.
//   - Nothing for IDLE_GATE_S of stillness; then over RAMP_S it builds from one word now and then to a word every MIN_GAP_MS.
//   - ANY activity is not idle (q4): a key, a pointer moving or pressing, the wheel, a scroll, a selection change. It stops the glitch AT ONCE
//     (every overlay word removed in the same task: whole within 300 ms) and starts the stillness over.
//   - It pauses while the window is hidden (and coming back counts as activity).
//   - At most 3 changes a second: a word appears at most once per MIN_GAP_MS and resolves SHOW_MS later. Four consecutive changes (appear,
//     resolve, appear, resolve, or resolve, appear, resolve, appear) then span at least min(gap + show, 2 x gap - show) = 1200 ms with these
//     numbers (and > 1000 ms even with a resolve timer 200 ms late), so no second holds four. Every appearance also asks the global flash budget
//     (store/flashBudget.ts) first. (700 ms was not enough: Actions measured four in a second.)
//   - Off under reduced motion, at Ambiance 0, and with Flicker off.
import { useEffect, type RefObject } from 'react';
import { useTheme } from '../store/theme';
import { useWritingSettings } from '../store/writingSettings';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';

export const IDLE_GATE_S = 45;
export const RAMP_S = 180;
export const MIN_GAP_MS = 900;      // the closest two appearances can come (at the top of the ramp)
const START_GAP_MS = 2600;          // the first minute: one word now and then
export const SHOW_MS = 600;         // a word resolves within ~600 ms
const TICK_MS = 100;
const CODE = '01#%&$@/\\<>=+*';

/** Harness seam (read-only use): the idle clock can be told it has been still for longer, so a check need not wait 45 s. Never set by product code. */
declare global { interface Window { __f3IdleShift?: number } }

export function FluxIdleGlitch({ paperRef }: { paperRef: RefObject<HTMLElement | null> }) {
  const theme = useTheme();
  const settings = useWritingSettings();
  const dial = useAmbianceDial();
  const on = theme === 'flux' && settings.flicker && dial > 0;

  useEffect(() => {
    if (!on || typeof document === 'undefined') return;
    const layer = document.createElement('div');
    layer.className = 'flux3-idle-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('data-flux3-idle', '');
    document.body.appendChild(layer);
    let lastActive = performance.now();
    let lastShown = -Infinity;
    const live = new Set<HTMLElement>();
    const clearAll = () => { live.forEach((el) => el.remove()); live.clear(); words.clear(); cancelAnimationFrame(raf); raf = 0; };
    const active = () => { lastActive = performance.now(); if (live.size) clearAll(); };
    const onVis = () => { if (document.hidden) clearAll(); else active(); };
    const opts = { capture: true, passive: true } as const;
    const EVENTS = ['keydown', 'beforeinput', 'pointermove', 'pointerdown', 'wheel', 'scroll', 'selectionchange'] as const;
    EVENTS.forEach((ev) => document.addEventListener(ev, active, opts));
    document.addEventListener('visibilitychange', onVis);

    // the caret's line (its rect's vertical band), if the page holds the caret
    const caretBand = (page: HTMLElement): [number, number] | null => {
      const sel = document.getSelection();
      if (!sel || !sel.rangeCount || !page.contains(sel.anchorNode)) return null;
      const r = sel.getRangeAt(0).getClientRects()[0] ?? sel.getRangeAt(0).getBoundingClientRect();
      return r && r.height ? [r.top - 2, r.bottom + 2] : null;
    };
    // a random word the writer can see, off the caret's line
    const pickWord = (page: HTMLElement): { rect: DOMRect; range: Range; text: string; font: CSSStyleDeclaration } | null => {
      const scroller = page.querySelector<HTMLElement>('.mode-scroll') ?? page;
      const view = scroller.getBoundingClientRect();
      const band = caretBand(page);
      const nodes: Text[] = [];
      const walk = document.createTreeWalker(scroller, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) if ((n.nodeValue ?? '').trim()) nodes.push(n as Text);
      for (let tries = 0; tries < 24 && nodes.length; tries += 1) {
        const node = nodes[Math.floor(Math.random() * nodes.length)];
        const words = [...(node.nodeValue ?? '').matchAll(/[\p{L}\p{N}'’]{3,}/gu)];
        if (!words.length) continue;
        const w = words[Math.floor(Math.random() * words.length)];
        const range = document.createRange();
        range.setStart(node, w.index ?? 0);
        range.setEnd(node, (w.index ?? 0) + w[0].length);
        const rects = range.getClientRects();
        if (rects.length !== 1) continue;   // a word broken across lines is skipped
        const rect = rects[0];
        if (rect.top < view.top || rect.bottom > view.bottom || rect.left < view.left || rect.right > view.right) continue;
        if (band && rect.bottom > band[0] && rect.top < band[1]) continue;   // never the caret's line
        const parent = node.parentElement;
        if (!parent) continue;
        return { rect, range, text: w[0], font: getComputedStyle(parent) };
      }
      return null;
    };
    // A WORD IS FOLLOWED, NOT REMEMBERED (S3-r2, the Wrizors' 1920 frame: the glyphs stood a line below their word). The layer is fixed on
    // <body>, and the page can move under it with no scroll and no key (its painted scale re-computed, its column re-laid): a rect taken once
    // goes stale. So each live word keeps its own Range, and every frame while any word lives its glyphs are put back on the word's CURRENT
    // rect; a word that no longer reads as itself (its text re-rendered or gone) resolves at once.
    const words = new Map<HTMLElement, { range: Range; text: string }>();
    let raf = 0;
    const placeOn = (el: HTMLElement, r: DOMRect) => {
      Object.assign(el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, lineHeight: `${r.height}px` });
    };
    const drop = (el: HTMLElement) => { el.remove(); live.delete(el); words.delete(el); };
    const follow = () => {
      raf = 0;
      words.forEach(({ range, text }, el) => {
        const rects = range.getClientRects();
        if (rects.length !== 1 || range.toString() !== text) { drop(el); return; }
        const r = rects[0], s = el.style;
        const off = Math.max(Math.abs(parseFloat(s.left) - r.left), Math.abs(parseFloat(s.top) - r.top), Math.abs(parseFloat(s.width) - r.width), Math.abs(parseFloat(s.height) - r.height));
        if (off > 0.25) placeOn(el, r);
      });
      if (words.size) raf = requestAnimationFrame(follow);
    };
    const show = (page: HTMLElement) => {
      const got = pickWord(page);
      if (!got || !tryFlash('f3-idle')) return;
      const el = document.createElement('span');
      el.className = 'flux3-idle-word';
      el.dataset.word = got.text;   // the word it covers (a check measures that word itself and holds the glyphs to its rect)
      el.textContent = [...got.text].map(() => CODE[Math.floor(Math.random() * CODE.length)]).join('');
      const f = got.font, paper = getComputedStyle(page).backgroundColor;
      Object.assign(el.style, { fontFamily: f.fontFamily, fontSize: f.fontSize, fontWeight: f.fontWeight, fontStyle: f.fontStyle, letterSpacing: f.letterSpacing, color: f.color, background: paper });
      placeOn(el, got.rect);
      layer.appendChild(el);
      live.add(el);
      words.set(el, { range: got.range, text: got.text });
      if (!raf) raf = requestAnimationFrame(follow);
      lastShown = performance.now();
      window.setTimeout(() => drop(el), SHOW_MS);
    };
    const timer = window.setInterval(() => {
      const page = paperRef.current;
      if (!page || document.hidden || prefersReducedMotion()) { if (live.size) clearAll(); return; }
      const idle = (performance.now() - lastActive) / 1000 + (window.__f3IdleShift ?? 0);
      if (idle < IDLE_GATE_S) return;
      const u = Math.min(1, (idle - IDLE_GATE_S) / RAMP_S);
      const gap = START_GAP_MS - (START_GAP_MS - MIN_GAP_MS) * u;
      if (performance.now() - lastShown >= gap) show(page);
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
      EVENTS.forEach((ev) => document.removeEventListener(ev, active, opts));
      document.removeEventListener('visibilitychange', onVis);
      clearAll();
      layer.remove();
    };
  }, [on, paperRef]);

  return null;
}
