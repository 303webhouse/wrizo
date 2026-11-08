// FLUX3 S4 - JACKED IN (the spec's §6; flux-rulings-oct31.md q8; Fable's S4 rulings, Nov 6). Flux's Typewriter: the SAME Typewriter on the SAME
// page, under the Typewriter exception (on the framed desk the page zooms ~1.6x by a transform: no reflow, no unmount). Nothing here writes text.
//   - It writes straight into the doc: there is no buffer, so nothing can be lost. Forward Lock is the existing forward-only rule (forwardLock.ts).
//   - Its controls are today's Typewriter controls EXACTLY (ruling C): the same toggle jacks in and out, the same Esc, the same reach-to-summon.
//   - THE COMPILE. Two lines up and beyond, her words compile into signal: on her PAUSE, never per key (ruling F), every word at least two lines
//     above the caret's line is covered by signal blocks (r9, the terminal: no paper; the text there is hidden by the terminal's veil in
//     flux-v3.css, and the rows grow smaller toward the top). An OVERLAY ONLY, in a layer inside the page's own scroller
//     (aria-hidden, no pointer, not selectable), so it scrolls, scales and fades with the text and nothing follows it while keys land. The page's
//     DOM text, selection, copy and word count are never changed; the caret's line and the line just above it are never covered.
//   - THE DECOMPILE. Jacking out while the page stays (the Typewriter turned off) resolves the signal: each glyph run is put back on its own word
//     and fades, and the words are there, already in the doc. One change through the flash budget; the still state is a cut.
//   - THE DEFAULT. Entering Free Write in Flux with "Jack In by default" on lays a session overlay over the shared Typewriter field
//     (writingSettings.setFreeWriteOverlay) before the page paints, so Free Write opens Jacked In while the shared field, and every other theme's
//     Typewriter, stay as they are. The writer's own toggle clears it; leaving Free Write lifts it. Nothing is saved (ruling D).
//   - THE TUNNEL (Nick kept it, Nov 7: ruling B, INK's lean) is FluxTunnel.tsx, mounted here while jacked in.
import { useEffect, useLayoutEffect, type RefObject } from 'react';
import { useTheme } from '../store/theme';
import { setFreeWriteOverlay } from '../store/writingSettings';
import { getAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { getJackInDefault, setJacked } from './jackIn';
import { FluxTunnel } from './FluxTunnel';

export const COMPILE_PAUSE_MS = 700;   // the pause the compile waits for (the Glitch bar's and the gutter's own pause)
export const COMPILE_LINES = 2;        // the caret's line is 0, the line above it 1: from 2 up, the words compile
export const DECOMPILE_MS = 420;       // the decompile's fade
// THE SIGNAL: every character, punctuation included, compiles to ONE WHOLE BLOCK (the mockup's filled and hollow blocks). A block is drawn, not
// typed: each character has an equal slot of its word's own width and its block stands inside that slot, so no font metric can clip one (the
// Wrizors' S4 review: glyph runs in a font, squeezed by letter-spacing into the word's box, were cut at their ends).
export const BLOCK_FILL = 0.72;        // a block's share of its slot's width (the rest is the gap between blocks)
const BLOCK_HEIGHT = 0.62;             // a block's height, in the word's own font size
// THE ROWS (r9, the terminal: the spec's draft 13 §6): each row of signal a little smaller toward the top, streaming up into the tunnel. A row's
// blocks shrink INSIDE their own slots (every word's signal stays on its own word's rect, so no block ever stands on another word), by rowShrink
// per row above the first, never below rowMin. Its fading is the Typewriter's own band on the column.
export const SIGNAL = { rowShrink: 0.12, rowMin: 0.5 };

interface Props {
  on: boolean;                          // the page's Typewriter is running (ModeStage's typewriterOn)
  freeWrite: boolean;                   // the page is in Free Write
  scrollRef: RefObject<HTMLDivElement | null>;
  refresh: () => void;                  // ModeStage's own re-render, so the default's overlay is read before the page paints
}

// a word's blocks (true: filled, false: hollow), one per character, fixed by the word and its place, so a compile that finds the same words
// draws the same signal (no change to see)
const blocksFor = (chars: string[], seed: number): boolean[] => {
  let h = seed | 0;
  for (const ch of chars) h = (Math.imul(h, 31) + (ch.codePointAt(0) ?? 0)) | 0;
  return chars.map(() => { h = (Math.imul(h, 1103515245) + 12345) | 0; return ((h >>> 16) & 7) < 5; });
};
const still = () => prefersReducedMotion() || getAmbianceDial() === 0;
// the editor's lines: its direct children (Draft's are `.wz-row` spans, Free Write's plain line elements: useTypewriterFade's caretRow says the same)
const rowsOf = (ed: HTMLElement): HTMLElement[] => {
  const kids = [...ed.children] as HTMLElement[];
  const rows = kids.filter((c) => c.classList.contains('wz-row'));
  return rows.length ? rows : kids;
};
// the line (a direct child of the editor) that holds a node
const rowOf = (n: Node | null, ed: HTMLElement): HTMLElement | null => {
  let e: Node | null = n;
  while (e && e.parentNode !== ed) e = e.parentNode;
  return e && e.nodeType === Node.ELEMENT_NODE ? (e as HTMLElement) : null;
};
// the caret's line box. A collapsed range often has no rect of its own (at the end of a text node, or between rows), so it falls back to the text
// before the caret in its own row (the last line box of that text is the caret's line), then to the row itself (an empty row)
const caretBox = (at: Range, ed: HTMLElement): DOMRect | null => {
  const own = at.getClientRects()[0];
  if (own && own.height) return own;
  const c = at.startContainer;
  // a caret held at the editor's own boundary counts CHILD NODES (text nodes too), never only elements (the Wrizors' S4 r9 review: on opening,
  // ed.children at that offset was nothing, so the open's own pause found no caret and compiled nothing)
  const before = c === ed ? (ed.childNodes[at.startOffset - 1] ?? null) : null;
  const row: Node | null = c === ed ? before : rowOf(c, ed);
  if (!row) return null;
  const pre = document.createRange();
  pre.selectNodeContents(row);
  if (row.contains(c)) pre.setEnd(c, at.startOffset);
  const rs = [...pre.getClientRects()].filter((r) => r.height > 0);
  if (rs.length) return rs[rs.length - 1];
  if (row.nodeType !== Node.ELEMENT_NODE) return null;
  const rr = (row as Element).getBoundingClientRect();
  return rr.height ? rr : null;
};

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

    // ESC READS (the Wrizors' S4 review, Fable Nov 7): Esc brings the chrome back as it does today, and the page then reads as the Typewriter's
    // does: the signal resolves (each block turns over and fades) and nothing compiles again until she types
    // Looking up also lifts the terminal's veil (flux-v3.css: data-flux3-looking), so the lines above read; writing again lowers it
    let lookingUp = false;
    let fadeTimer = 0;
    const root = document.documentElement;
    const look = (on: boolean) => { lookingUp = on; if (on) root.setAttribute('data-flux3-looking', ''); else root.removeAttribute('data-flux3-looking'); };
    const turnOver = (el: Element) => { el.querySelectorAll('i').forEach((b) => { b.className = b.className === 'f' ? 'h' : 'f'; }); };
    const resolve = () => {
      sig = '';
      if (!words.size) return;
      const els = [...words.keys()];
      words.clear();
      if (still() || !tryFlash('f3-resolve')) { els.forEach((el) => el.remove()); return; }
      const fade = document.createElement('div');
      fade.className = 'flux3-compile-fade';
      fade.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:0;';
      els.forEach((el) => { turnOver(el); fade.appendChild(el); });
      layer.appendChild(fade);
      requestAnimationFrame(() => fade.classList.add('decompile'));
      fadeTimer = window.setTimeout(() => fade.remove(), DECOMPILE_MS + 60);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { look(true); if (timer) window.clearTimeout(timer); timer = 0; resolve(); return; }
      if (lookingUp && (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace')) look(false);   // she writes again: the next pause compiles
    };

    // harness mode only (the flash budget's pattern): why each compile stopped where it did, behind a flag read at call time; unset, nothing
    const W = window as unknown as { __wzVerifyCompile?: boolean; __wzCompileLog?: [number, string][] };
    const why = (w: string) => { if (W.__wzVerifyCompile) (W.__wzCompileLog ??= []).push([Math.round(performance.now()), w]); };
    const compile = () => {
      timer = 0;
      if (lookingUp) { why('looking'); return; }
      if (!scroll.isConnected) { why('gone'); return; }
      const ed = scroll.querySelector<HTMLElement>('.forward-only-editor');
      const sel = document.getSelection();
      if (!ed || !sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) { why('no-caret'); return; }   // the writing line is the caret's; no caret here, no change
      const caret = caretBox(sel.getRangeAt(0), ed);
      if (!caret) { why('no-caret-box'); return; }
      const { L, s } = frame();
      const lhLayout = parseFloat(getComputedStyle(ed).lineHeight);
      const lh = Number.isFinite(lhLayout) && lhLayout > 0 ? lhLayout * s : caret.height * 1.4;
      const limit = caret.top - (COMPILE_LINES - 0.5) * lh;   // a word whose top is above this sits two lines up or more
      const view = scroll.getBoundingClientRect();
      const found: { r: DOMRect; range: Range; text: string; fs: number; row: number }[] = [];
      const rows = rowsOf(ed);
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
            const row = Math.max(COMPILE_LINES, Math.round((caret.top - r.top) / lh));   // the line above the caret's it stands on
            found.push({ r, range, text: m[0], fs: parent ? parseFloat(getComputedStyle(parent).fontSize) || 16 : 16, row });
          }
        }
      }
      const next = found.map((f) => `${Math.round((f.r.left - L.left) / s)},${Math.round((f.r.top - L.top) / s)},${f.text}`).join('|');
      if (next === sig) { why(found.length ? 'same' : 'none-found'); return; }   // the same words in the same places: nothing to change
      // refused by the flash budget: tried again after another pause (the Wrizors' S4 r9 review: an open whose only pause was refused showed no
      // rows at all until she paused again; a key still resets the wait, so nothing compiles while keys land)
      if (!tryFlash('f3-compile')) { why('refused'); timer = window.setTimeout(compile, COMPILE_PAUSE_MS); return; }
      why(`drawn ${found.length}`);
      sig = next;
      layer.replaceChildren();
      words.clear();
      found.forEach((f) => {
        const el = document.createElement('span');
        el.className = 'flux3-compile-word';
        el.dataset.word = f.text;   // the word it covers (a check holds the glyphs to that word's own rect)
        el.dataset.row = String(f.row);
        // one block per character, seeded by the word's place in the page's own layout (the layer scrolls with the text, so that place holds);
        // each row up a little smaller (THE ROWS), still inside its slot
        const chars = [...f.text];
        const slot = f.r.width / s / chars.length;
        const k = Math.max(SIGNAL.rowMin, 1 - SIGNAL.rowShrink * (f.row - COMPILE_LINES));
        const bw = slot * BLOCK_FILL * k, bh = Math.min(f.fs * BLOCK_HEIGHT, f.r.height / s) * k;
        Object.assign(el.style, { position: 'absolute', display: 'flex', alignItems: 'center' });
        blocksFor(chars, Math.round((f.r.left - L.left) / s) * 7 + Math.round((f.r.top - L.top) / s) * 13).forEach((filled) => {
          const b = document.createElement('i');
          b.className = filled ? 'f' : 'h';
          Object.assign(b.style, { display: 'block', flex: 'none', boxSizing: 'border-box', width: `${bw}px`, height: `${bh}px`, margin: `0 ${(slot - bw) / 2}px` });
          el.appendChild(b);
        });
        placeOn(el, f.r, L, s);
        layer.appendChild(el);
        words.set(el, { range: f.range, text: f.text });
      });
    };
    const schedule = () => { if (timer) window.clearTimeout(timer); timer = window.setTimeout(compile, COMPILE_PAUSE_MS); };
    const opts = { capture: true, passive: true } as const;
    const DOC_EVENTS = ['keydown', 'beforeinput', 'selectionchange', 'wz-zoom-changed'] as const;
    document.addEventListener('keydown', onKey, opts);   // before schedule's own keydown, so an Esc never schedules a compile
    DOC_EVENTS.forEach((ev) => document.addEventListener(ev, schedule, opts));
    scroll.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();

    return () => {
      if (timer) window.clearTimeout(timer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
      root.removeAttribute('data-flux3-looking');
      document.removeEventListener('keydown', onKey, opts);
      DOC_EVENTS.forEach((ev) => document.removeEventListener(ev, schedule, opts));
      scroll.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
      // THE DECOMPILE: only when she jacks out and the page stays, in Flux, with signal showing; anything else (leaving, the still state, a refused
      // flash) is a cut
      const stays = scroll.isConnected && document.documentElement.getAttribute('data-theme') === 'flux';
      if (!stays || !words.size || still() || !tryFlash('f3-decompile')) { layer.remove(); return; }
      // the signal resolves: every block turns over (filled to hollow, hollow to filled), still whole, and fades off its word
      words.forEach((_, el) => turnOver(el));
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

  return jackedIn ? <FluxTunnel scrollRef={scrollRef} /> : null;
}
