// FLUX3 S4 - JACKED IN (the spec's §6; flux-rulings-oct31.md q8; Fable's S4 rulings, Nov 6). Flux's Typewriter: the SAME Typewriter on the SAME
// page, under the Typewriter exception (on the framed desk the page zooms ~1.6x by a transform: no reflow, no unmount). Nothing here writes text.
//   - It writes straight into the doc: there is no buffer, so nothing can be lost. Forward Lock is the existing forward-only rule (forwardLock.ts).
//   - Its controls are today's Typewriter controls EXACTLY (ruling C): the same toggle jacks in and out, the same Esc, the same reach-to-summon.
//   - THE COMPILE. Two lines up and beyond, her words compile into signal: on her PAUSE, never per key (ruling F), every word at least two lines
//     above the caret's line is covered by signal glyphs on the page's own paper. An OVERLAY ONLY, in a layer inside the page's own scroller
//     (aria-hidden, no pointer, not selectable), so it scrolls, scales and fades with the text and nothing follows it while keys land. The page's
//     DOM text, selection, copy and word count are never changed; the caret's line and the line just above it are never covered.
//   - THE DECOMPILE. Jacking out while the page stays (the Typewriter turned off) resolves the signal: each glyph run is put back on its own word
//     and fades, and the words are there, already in the doc. One change through the flash budget; the still state is a cut.
//   - THE DEFAULT. Entering Free Write in Flux with "Jack In by default" on lays a session overlay over the shared Typewriter field
//     (writingSettings.setFreeWriteOverlay) before the page paints, so Free Write opens Jacked In while the shared field, and every other theme's
//     Typewriter, stay as they are. The writer's own toggle clears it; leaving Free Write lifts it. Nothing is saved (ruling D).
//   - No tunnel here: it waits for Nick's ruling (B).
import { useEffect, useLayoutEffect, type RefObject } from 'react';
import { useTheme } from '../store/theme';
import { setFreeWriteOverlay } from '../store/writingSettings';
import { getAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { getJackInDefault, setJacked } from './jackIn';

export const COMPILE_PAUSE_MS = 700;   // the pause the compile waits for (the Glitch bar's and the gutter's own pause)
export const COMPILE_LINES = 2;        // the caret's line is 0, the line above it 1: from 2 up, the words compile
export const DECOMPILE_MS = 420;       // the decompile's fade
const SIGNAL = '▮▯';         // the mockup's signal glyphs (a filled and a hollow block)
const CODE = '01#%&$@/\\<>=+*';

interface Props {
  on: boolean;                          // the page's Typewriter is running (ModeStage's typewriterOn)
  freeWrite: boolean;                   // the page is in Free Write
  scrollRef: RefObject<HTMLDivElement | null>;
  refresh: () => void;                  // ModeStage's own re-render, so the default's overlay is read before the page paints
}

// a word's glyphs are fixed by the word and its place, so a compile that finds the same words draws the same signal (no change to see)
const glyphsFor = (text: string, seed: number): string => {
  let h = seed | 0;
  for (let i = 0; i < text.length; i += 1) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  let out = '';
  for (const ch of text) { h = (Math.imul(h, 1103515245) + 12345) | 0; out += /\s/.test(ch) ? ch : SIGNAL[((h >>> 16) & 7) < 5 ? 0 : 1]; }
  return out;
};
const still = () => prefersReducedMotion() || getAmbianceDial() === 0;

export function FluxJackedIn({ on, freeWrite, scrollRef, refresh }: Props) {
  const flux = useTheme() === 'flux';
  const jackedIn = flux && on;

  // THE DEFAULT: laid in a layout effect and read by a synchronous re-render, so the page never paints un-jacked first
  useLayoutEffect(() => {
    if (!(flux && freeWrite)) return undefined;
    if (getJackInDefault()) { setFreeWriteOverlay(true); refresh(); }
    return () => { setFreeWriteOverlay(false); };
  }, [flux, freeWrite, refresh]);

  useLayoutEffect(() => {
    setJacked(jackedIn);
    const root = document.documentElement;
    if (jackedIn) root.setAttribute('data-flux3-jacked', ''); else root.removeAttribute('data-flux3-jacked');
    return () => { setJacked(false); root.removeAttribute('data-flux3-jacked'); };
  }, [jackedIn]);

  // THE COMPILE and THE DECOMPILE
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!jackedIn || !scroll) return undefined;
    const layer = document.createElement('div');
    layer.className = 'flux3-compile';
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('data-flux3-compile', '');
    // the structural styles are inline, so the layer can never fall into the page's flow (whatever theme a decompile ends in)
    layer.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:0;pointer-events:none;user-select:none;-webkit-user-select:none;z-index:3;';
    scroll.appendChild(layer);
    const words = new Map<HTMLElement, { range: Range; text: string }>();
    let sig = '';
    let timer = 0;
    let raf = 0;

    const frame = () => {
      const L = layer.getBoundingClientRect();
      return { L, s: layer.offsetWidth > 0 ? L.width / layer.offsetWidth : 1 };
    };
    const placeOn = (el: HTMLElement, r: DOMRect, L: DOMRect, s: number) => {
      Object.assign(el.style, { left: `${(r.left - L.left) / s}px`, top: `${(r.top - L.top) / s}px`, width: `${r.width / s}px`, height: `${r.height / s}px`, lineHeight: `${r.height / s}px` });
    };

    const compile = () => {
      timer = 0;
      if (!scroll.isConnected) return;
      const ed = scroll.querySelector<HTMLElement>('.forward-only-editor');
      const sel = document.getSelection();
      if (!ed || !sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) return;   // the writing line is the caret's; no caret here, no change
      const at = sel.getRangeAt(0);
      const caret = at.getClientRects()[0] ?? at.getBoundingClientRect();
      if (!caret || !caret.height) return;
      const { L, s } = frame();
      const lhLayout = parseFloat(getComputedStyle(ed).lineHeight);
      const lh = Number.isFinite(lhLayout) && lhLayout > 0 ? lhLayout * s : caret.height * 1.4;
      const limit = caret.top - (COMPILE_LINES - 0.5) * lh;   // a word whose top is above this sits two lines up or more
      const view = scroll.getBoundingClientRect();
      const found: { r: DOMRect; range: Range; text: string; fs: number }[] = [];
      const rows = [...ed.children].filter((c) => c.classList.contains('wz-row')) as HTMLElement[];
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        const rr = rows[i].getBoundingClientRect();
        if (rr.top >= limit) continue;
        if (rr.bottom <= view.top) break;   // every row above this one is out of sight too
        const walk = document.createTreeWalker(rows[i], NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          const v = n.nodeValue ?? '';
          for (const m of v.matchAll(/\S+/gu)) {
            const range = document.createRange();
            range.setStart(n, m.index ?? 0);
            range.setEnd(n, (m.index ?? 0) + m[0].length);
            const rects = range.getClientRects();
            if (rects.length !== 1) continue;   // a word broken across lines stays as it is
            const r = rects[0];
            if (r.top >= limit || r.bottom <= view.top || r.top >= view.bottom || r.width <= 0) continue;
            const parent = n.parentElement;
            found.push({ r, range, text: m[0], fs: parent ? parseFloat(getComputedStyle(parent).fontSize) || 16 : 16 });
          }
        }
      }
      const next = found.map((f) => `${Math.round((f.r.left - L.left) / s)},${Math.round((f.r.top - L.top) / s)},${f.text}`).join('|');
      if (next === sig) return;                    // the same words in the same places: nothing to change
      if (!tryFlash('f3-compile')) return;         // refused: skipped, the next pause tries again
      sig = next;
      layer.replaceChildren();
      words.clear();
      const paper = getComputedStyle(scroll.closest('.mode-page') ?? scroll).backgroundColor;
      found.forEach((f) => {
        const el = document.createElement('span');
        el.className = 'flux3-compile-word';
        el.dataset.word = f.text;   // the word it covers (a check holds the glyphs to that word's own rect)
        // seeded by the word's place in the page's own layout (the layer scrolls with the text, so that place holds while the page scrolls)
        el.textContent = glyphsFor(f.text, Math.round((f.r.left - L.left) / s) * 7 + Math.round((f.r.top - L.top) / s) * 13);
        const gfs = f.fs * 0.7;
        const n = [...f.text].length;
        const ls = Math.max(0, (f.r.width / s - n * 0.62 * gfs) / n);
        Object.assign(el.style, { position: 'absolute', overflow: 'hidden', whiteSpace: 'pre', fontSize: `${gfs}px`, letterSpacing: `${ls}px`, background: paper });
        placeOn(el, f.r, L, s);
        layer.appendChild(el);
        words.set(el, { range: f.range, text: f.text });
      });
    };
    const schedule = () => { if (timer) window.clearTimeout(timer); timer = window.setTimeout(compile, COMPILE_PAUSE_MS); };
    const opts = { capture: true, passive: true } as const;
    const DOC_EVENTS = ['keydown', 'beforeinput', 'selectionchange', 'wz-zoom-changed'] as const;
    DOC_EVENTS.forEach((ev) => document.addEventListener(ev, schedule, opts));
    scroll.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();

    return () => {
      if (timer) window.clearTimeout(timer);
      DOC_EVENTS.forEach((ev) => document.removeEventListener(ev, schedule, opts));
      scroll.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
      // THE DECOMPILE: only when she jacks out and the page stays, in Flux, with signal showing; anything else (leaving, the still state, a refused
      // flash) is a cut
      const stays = scroll.isConnected && document.documentElement.getAttribute('data-theme') === 'flux';
      if (!stays || !words.size || still() || !tryFlash('f3-decompile')) { layer.remove(); return; }
      words.forEach(({ text }, el) => { el.textContent = [...text].map((ch) => (/\s/.test(ch) ? ch : CODE[Math.floor(Math.random() * CODE.length)])).join(''); });
      const end = performance.now() + DECOMPILE_MS;
      // each glyph run follows its own word while the page settles out of the zoom (its Range is the word; the page's layout box moves under it)
      const follow = () => {
        const { L, s } = frame();
        words.forEach(({ range, text }, el) => {
          const rects = range.getClientRects();
          if (rects.length !== 1 || range.toString() !== text) { el.remove(); words.delete(el); return; }
          placeOn(el, rects[0], L, s);
        });
        if (performance.now() < end && words.size) raf = requestAnimationFrame(follow); else layer.remove();
      };
      raf = requestAnimationFrame(() => { follow(); layer.classList.add('decompile'); });
    };
  }, [jackedIn, scrollRef]);

  return null;
}
