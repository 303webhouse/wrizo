// FLUX3 S3 - THE IDLE GLITCH, GLITCH v2 (the flourish spec draft 2 §1, ruled by Nick Nov 26; the first one was the spec's §5 and flux-rulings-oct31.md q4). One beat at a time while she is still,
// closer together and stronger the longer she is still (the table is flux3/glitchRamp.ts; the screen band flux3/glitchScreen.ts).
// AN OVERLAY ONLY. It never touches the page: a glitching word is a separate element laid over the word (the nearest solid ground behind it, code glyphs in it), in a layer on <body> that is
// aria-hidden, takes no pointer and cannot be selected. The page's DOM text, its selection, copy and word count are never changed, the page never moves, and the caret's line is never touched.
//   - Nothing for 30 s of stillness. WORDS: first hers; from 2 minutes her words and the chrome's visible text too. Never text in a field she is typing in.
//   - SCREEN (from 2 minutes): a band across the window that slips the chrome and never the page; at the ceiling one open menu may drop 4 px.
//   - ANY activity is not idle: a key, a pointer moving or pressing, the wheel, a scroll, a selection change. EVERY glitch leaves in the same task and the stillness starts over. Hiding the window
//     clears them too. NOTHING HERE RUNS ON THE KEY PATH BEYOND THAT CLEARING.
//   - THE FLASH LAW: a beat is two changes (it comes on, it goes), it asks the global budget first (store/flashBudget.ts: at most 3 a second across the screen) and a refused beat is skipped, never queued.
//   - Off under reduced motion, at Ambiance 0, with Flicker off, with Flux's flourish off or Distraction Free (store/flourish.ts), and in Wire In (Jacked In).
import { useEffect, type RefObject } from 'react';
import { useTheme } from '../store/theme';
import { useWritingSettings } from '../store/writingSettings';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { flourishPinned, useFlourish } from '../store/flourish';
import { useJacked } from './jackIn';
import { bandHeight, beatOf, stageAt, wordCountFor, type Stage } from './glitchRamp';
import { drawBand } from './glitchScreen';

const TICK_MS = 100;
const CODE = '01#%&$@/\\<>=+*';
const MENU = '.wz-cascade-panel[data-visible="true"]';

/** Harness seam (read-only use): the idle clock can be told it has been still for longer, so a check need not wait. Never set by product code. */
declare global { interface Window { __f3IdleShift?: number } }

interface Found { rect: DOMRect; range: Range; text: string; font: CSSStyleDeclaration; ground: string }

export function FluxIdleGlitch({ paperRef }: { paperRef: RefObject<HTMLElement | null> }) {
  const theme = useTheme();
  const settings = useWritingSettings();
  const dial = useAmbianceDial();
  // FLUX3 S4 - none while Jacked In (the spec's §6: no glitch there; the compile owns the lines above the writing line)
  const jacked = useJacked();
  const flourish = useFlourish('flux');
  const on = theme === 'flux' && settings.flicker && dial > 0 && !jacked && (flourishPinned() || flourish);

  useEffect(() => {
    if (!on || typeof document === 'undefined') return;
    const layer = document.createElement('div');
    layer.className = 'flux3-idle-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('data-flux3-idle', '');
    document.body.appendChild(layer);
    let lastActive = performance.now();
    let lastBeat = -Infinity;
    let beats = 0;
    let leaving = 0;
    const live = new Set<HTMLElement>();      // everything the beat in hand put on screen
    const words = new Map<HTMLElement, { range: Range; text: string }>();
    let raf = 0;
    let dropped: HTMLElement | null = null;
    // the whole beat leaves together
    const clearAll = () => {
      window.clearTimeout(leaving);
      live.forEach((el) => el.remove()); live.clear(); words.clear(); cancelAnimationFrame(raf); raf = 0;
      if (dropped) { dropped.style.translate = ''; dropped = null; }
    };
    const active = () => { lastActive = performance.now(); beats = 0; if (live.size || dropped) clearAll(); };
    const onVis = () => { if (document.hidden) clearAll(); else active(); };
    const opts = { capture: true, passive: true } as const;
    const EVENTS = ['keydown', 'beforeinput', 'pointermove', 'pointerdown', 'wheel', 'scroll', 'selectionchange'] as const;
    EVENTS.forEach((ev) => document.addEventListener(ev, active, opts));
    document.addEventListener('visibilitychange', onVis);

    // the caret's line (its rect's vertical band), wherever the caret is
    const caretBand = (): [number, number] | null => {
      const sel = document.getSelection();
      if (!sel || !sel.rangeCount) return null;
      const r = sel.getRangeAt(0).getClientRects()[0] ?? sel.getRangeAt(0).getBoundingClientRect();
      return r && r.height ? [r.top - 2, r.bottom + 2] : null;
    };
    // the nearest solid ground behind a word
    const groundOf = (el: Element): string => {
      for (let e: Element | null = el; e; e = e.parentElement) {
        const c = getComputedStyle(e).backgroundColor;
        const m = /rgba?\(([^)]+)\)/.exec(c);
        if (m) { const parts = m[1].split(/[ ,/]+/).filter(Boolean); if (parts.length < 4 || Number(parts[3]) > 0.9) return c; }
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    // one word of a text node, if the writer can see it and it is off the caret's line
    const wordIn = (node: Text, view: DOMRect, band: [number, number] | null, onTop: boolean): Found | null => {
      const found = [...(node.nodeValue ?? '').matchAll(/[\p{L}\p{N}'’]{3,}/gu)];
      if (!found.length) return null;
      const w = found[Math.floor(Math.random() * found.length)];
      const range = document.createRange();
      range.setStart(node, w.index ?? 0);
      range.setEnd(node, (w.index ?? 0) + w[0].length);
      const rects = range.getClientRects();
      if (rects.length !== 1) return null;   // a word broken across lines is skipped
      const rect = rects[0];
      if (!rect.width || rect.top < view.top || rect.bottom > view.bottom || rect.left < view.left || rect.right > view.right) return null;
      if (band && rect.bottom > band[0] && rect.top < band[1]) return null;   // never the caret's line
      const parent = node.parentElement;
      if (!parent) return null;
      if (onTop) {   // chrome: only what really shows there (not covered, not faded out)
        const style = getComputedStyle(parent);
        if (style.visibility === 'hidden' || Number(style.opacity) === 0) return null;
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        if (!hit || !(hit === parent || parent.contains(hit) || hit.contains(parent))) return null;
      }
      return { rect, range, text: w[0], font: getComputedStyle(parent), ground: groundOf(parent) };
    };
    const textNodes = (root: Node, skip: (el: Element) => boolean): Text[] => {
      const nodes: Text[] = [];
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const parent = n.parentElement;
        if (parent && (n.nodeValue ?? '').trim() && !skip(parent)) nodes.push(n as Text);
      }
      return nodes;
    };
    // the words one beat may cover: hers (the editor's text), and from the second stage the chrome's visible text too. Never a field, never this layer, never the page's own chrome twice
    const candidates = (page: HTMLElement, stage: Stage): { node: Text; view: DOMRect; chrome: boolean }[] => {
      const editor = page.querySelector<HTMLElement>('.forward-only-editor');
      const scroller = page.querySelector<HTMLElement>('.mode-scroll') ?? page;
      const list: { node: Text; view: DOMRect; chrome: boolean }[] = [];
      if (editor) { const view = scroller.getBoundingClientRect(); textNodes(editor, () => false).forEach((node) => list.push({ node, view, chrome: false })); }
      if (stage.reach !== 'page') {
        const view = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
        textNodes(document.body, (el) => !!el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], .forward-only-editor, .flux3-idle-layer, script, style, svg'))
          .forEach((node) => list.push({ node, view, chrome: true }));
      }
      return list;
    };

    // A WORD IS FOLLOWED, NOT REMEMBERED (S3-r2, the Wrizors' 1920 frame: the glyphs stood a line below their word). The layer is fixed on
    // <body>, and the page can move under it with no scroll and no key (its painted scale re-computed, its column re-laid): a rect taken once
    // goes stale. So each live word keeps its own Range, and every frame while any word lives its glyphs are put back on the word's CURRENT
    // rect; a word that no longer reads as itself (its text re-rendered or gone) resolves at once.
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
    const cover = (got: Found) => {
      const el = document.createElement('span');
      el.className = 'flux3-idle-word';
      el.dataset.word = got.text;   // the word it covers (a check measures that word itself and holds the glyphs to its rect)
      el.textContent = [...got.text].map(() => CODE[Math.floor(Math.random() * CODE.length)]).join('');
      const f = got.font;
      Object.assign(el.style, { fontFamily: f.fontFamily, fontSize: f.fontSize, fontWeight: f.fontWeight, fontStyle: f.fontStyle, letterSpacing: f.letterSpacing, textTransform: f.textTransform, color: f.color, background: got.ground });
      placeOn(el, got.rect);
      layer.appendChild(el);
      live.add(el);
      words.set(el, { range: got.range, text: got.text });
    };
    const beat = (page: HTMLElement, stage: Stage) => {
      const { screen, holdMs } = beatOf(stage, beats);
      beats += 1;
      lastBeat = performance.now();
      if (!tryFlash('f3-idle')) return;   // refused: skipped, never queued
      clearAll();
      const list = candidates(page, stage);
      const band = caretBand();
      const want = wordCountFor(stage, Math.random());
      const taken = new Set<Text>();
      let made = 0;
      for (let tries = 0; tries < 40 && made < want && list.length; tries += 1) {
        const c = list[Math.floor(Math.random() * list.length)];
        if (taken.has(c.node)) continue;
        const got = wordIn(c.node, c.view, band, c.chrome);
        if (!got) continue;
        taken.add(c.node);
        cover(got);
        made += 1;
      }
      if (screen) {
        const height = bandHeight(stage, window.innerHeight, Math.random());
        const sheet = page.querySelector<HTMLElement>('.mode-page') ?? page.closest<HTMLElement>('.mode-page') ?? page;
        const top = Math.floor(Math.random() * Math.max(1, window.innerHeight - height));
        drawBand(layer, { top, height, slip: stage.slip, split: stage.split, page: sheet.getBoundingClientRect(), width: window.innerWidth }).forEach((el) => live.add(el));
        const menu = stage.menuDrop ? document.querySelector<HTMLElement>(MENU) : null;
        if (menu) { menu.style.translate = `0 ${stage.menuDrop}px`; dropped = menu; }
      }
      if (words.size && !raf) raf = requestAnimationFrame(follow);
      leaving = window.setTimeout(clearAll, holdMs);
    };
    const timer = window.setInterval(() => {
      const page = paperRef.current;
      if (!page || document.hidden || prefersReducedMotion()) { if (live.size) clearAll(); return; }
      const stage = stageAt((performance.now() - lastActive) / 1000 + (window.__f3IdleShift ?? 0));
      if (stage && performance.now() - lastBeat >= stage.everyMs) beat(page, stage);
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
