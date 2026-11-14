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
//   - THE MODE (draft 21 §6, Nick Nov 9). JACK IN is the top-bar mode, not a switch: ModeStage turns the Typewriter on for Flux's free-writing slot and
//     never for BUILD (Draft), and offers no toggle for it in either (no "Jack In by default" row, no gear/sliver switch). There is no off inside it.
//     Leaving: an Esc TAP (a key held under ESC_TAP_MS), F9, or a click on the circled X (FluxJackedHints) calls ONE function (jackIn.ts leaveJackedIn), which asks the page editor for BUILD on the same doc, caret at the end of her
//     text, full screen kept (Chrome/Edge: the Escape key is locked while full screen, so a HOLD still exits full screen; F9 is the backup for browsers
//     without the lock). Nothing is saved.
//   - THE CORRIDOR (Nick's pick, Nov 9: Style B, flux-jacked-in-concepts.md) is FluxCorridor.tsx, mounted here while jacked in. Its rules, kept here:
//     ALWAYS DARK (the page tone is held 'dark' on <html> while jacked in and put back on leaving; the saved Page preference is never touched), ONLY THIS
//     SESSION'S LINES COMPILE (the lines at and above the caret's line when she jacked in are never signal), and FINISHED LINES STEP BACK at an even
//     step (ROWS below), six rows, then gone.
import { useEffect, useLayoutEffect, type RefObject } from 'react';
import { useTheme } from '../store/theme';
import { getAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { openPopupCount } from '../store/escapeExit';
import { LEAVE_KEY, LEAVE_KEY_BACKUP, leaveJackedIn, setJacked } from './jackIn';
import { getThemePrefs } from '../store/themePrefs';
import { FluxCorridor } from './FluxCorridor';
import { FluxJackedHints } from './FluxJackedHints';

export const COMPILE_PAUSE_MS = 700;   // the pause the compile waits for (the Glitch bar's and the gutter's own pause)
export const COMPILE_LINES = 2;        // the caret's line is 0, the line above it 1: from 2 up, the words compile
export const DECOMPILE_MS = 420;       // the decompile's fade
export const COMPILE_RETRY_MS = 200;   // a compile the flash budget refused asks again this soon (the budget refills inside a second; the glitch's own flashes can hold it at the very moment she pauses)
// THE SIGNAL: every character, punctuation included, compiles to ONE WHOLE BLOCK (the mockup's filled and hollow blocks). A block is drawn, not
// typed: each character has an equal slot of its word's own width and its block stands inside that slot, so no font metric can clip one (the
// Wrizors' S4 review: glyph runs in a font, squeezed by letter-spacing into the word's box, were cut at their ends).
export const BLOCK_FILL = 0.72;        // a block's share of its slot's width (the rest is the gap between blocks)
const BLOCK_HEIGHT = 0.62;             // a block's height, in the word's own font size
// THE ROWS (r9, the terminal: the spec's draft 13 §6): each row of signal a little smaller toward the top, streaming up into the tunnel. A row's
// blocks shrink INSIDE their own slots (every word's signal stays on its own word's rect, so no block ever stands on another word), by rowShrink
// per row above the first, never below rowMin. Its fading is the Typewriter's own band on the column.
export const SIGNAL = { rowShrink: 0.075, rowMin: 0.4, rowFade: 0.15, rowsShown: 6 };   // the Corridor's step (Nick, Nov 9): -7.5% size and -15% opacity a row, six rows
// THE PAUSE is hers (ruling F): a key restarts it, the page's own scrolling does not. The Typewriter glides a long page to its end line by
// line on opening (30-46 scroll events a second, for seconds), and with every scroll restarting the wait the open's own pause never came:
// no rows at all until she typed and paused (the Wrizors' S4 r9 review). A scroll now starts a compile only when none is waiting
export const PAUSE = { scrollPostpones: false };

export const ESC_TAP_MS = 500;         // an Esc held shorter than this is a tap (leaves Jacked In); longer is a hold (the browser's full-screen exit)

interface Props {
  on: boolean;                          // the page's Typewriter is running (ModeStage's typewriterOn: Flux's free-writing mode)
  scrollRef: RefObject<HTMLDivElement | null>;
  unitCount: number;                    // her words: the same count the Glitch bar's units read (the corridor's glow builds with it)
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

export function FluxJackedIn({ on, scrollRef, unitCount }: Props) {
  const flux = useTheme() === 'flux';
  const jackedIn = flux && on;

  // LEAVING: an Esc tap or F9 asks the page editor for BUILD on the same doc (it owns the mode). A popup open on the page takes its own Esc first.
  useEffect(() => {
    if (!jackedIn) return undefined;
    let escAt = 0;
    const leave = leaveJackedIn;
    const down = (e: KeyboardEvent) => {
      if (e.key === LEAVE_KEY_BACKUP && !e.repeat) { e.preventDefault(); leave(); return; }
      if (e.key === LEAVE_KEY && !e.repeat && !e.isComposing && openPopupCount() === 0) escAt = performance.now();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key !== LEAVE_KEY) return;
      const tap = escAt > 0 && performance.now() - escAt < ESC_TAP_MS;
      escAt = 0;
      if (tap) leave();
    };
    document.addEventListener('keydown', down, true);
    document.addEventListener('keyup', up, true);
    // Chrome/Edge: lock Escape while full screen so a tap reaches the page and only a hold exits full screen (other browsers: F9 is the way out)
    const kb = (navigator as unknown as { keyboard?: { lock?: (keys: string[]) => Promise<void>; unlock?: () => void } }).keyboard;
    const lock = () => { if (document.fullscreenElement) kb?.lock?.(['Escape'])?.catch(() => { /* unsupported or refused: F9 stays */ }); };
    lock();
    document.addEventListener('fullscreenchange', lock);
    return () => {
      document.removeEventListener('keydown', down, true);
      document.removeEventListener('keyup', up, true);
      document.removeEventListener('fullscreenchange', lock);
      try { kb?.unlock?.(); } catch { /* none */ }
    };
  }, [jackedIn]);

  useLayoutEffect(() => {
    setJacked(jackedIn);
    const root = document.documentElement;
    if (jackedIn) { root.setAttribute('data-flux3-jacked', ''); root.setAttribute('data-page', 'dark'); } else root.removeAttribute('data-flux3-jacked');
    // ALWAYS DARK: the tone is the attribute alone, held for the session; leaving puts the writer's own saved tone back
    return () => { setJacked(false); root.removeAttribute('data-flux3-jacked'); root.setAttribute('data-page', getThemePrefs().page); };
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
    // where the signal last stood on the screen (read at each compile, and the scroller's position kept as it scrolls): leaving to BUILD replaces the page's scroller and the layer with it, so the
    // fade runs from here, in a fixed overlay
    const snap = { left: 0, top: 0, s: 1, w: 0, scrollTop: 0, now: 0 };
    let sig = '';
    let timer = 0;
    let raf = 0;
    // THIS SESSION'S LINES ONLY: the caret's line when she jacked in (its top, counted from the editor's top in the editor's own layout px, so the
    // page's zoom cancels) is the floor; a word on that line or above it is the doc's older text and never becomes signal. Read once, at her first
    // key or selection change with a caret in the editor (a key's own keydown comes before its input, so the caret has not moved yet)
    let floor: number | null = null;
    const readFloor = () => {
      if (floor != null) return;
      const ed = scroll.querySelector<HTMLElement>('.forward-only-editor');
      const sel = document.getSelection();
      if (!ed || !sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) return;
      const box = caretBox(sel.getRangeAt(0), ed);
      if (!box) return;
      const er = ed.getBoundingClientRect();
      const k = ed.offsetHeight > 0 ? er.height / ed.offsetHeight : 1;
      floor = (box.top - er.top) / (k || 1);
    };

    readFloor();
    const frame = () => {
      const L = layer.getBoundingClientRect();
      return { L, s: layer.offsetWidth > 0 ? L.width / layer.offsetWidth : 1 };
    };
    const placeOn = (el: HTMLElement, r: DOMRect, L: DOMRect, s: number) => {
      Object.assign(el.style, { left: `${(r.left - L.left) / s}px`, top: `${(r.top - L.top) / s}px`, width: `${r.width / s}px`, height: `${r.height / s}px`, lineHeight: `${r.height / s}px` });
    };

    // (Esc no longer "looks up": it LEAVES to BUILD, see the effect above; leaving runs the decompile in this effect's cleanup.)
    const turnOver = (el: Element) => { el.querySelectorAll('i').forEach((b) => { b.className = b.className === 'f' ? 'h' : 'f'; }); };

    // harness mode only (the flash budget's pattern): why each compile stopped where it did, behind a flag read at call time; unset, nothing
    const W = window as unknown as { __wzVerifyCompile?: boolean; __wzCompileLog?: [number, string][] };
    const why = (w: string) => { if (W.__wzVerifyCompile) (W.__wzCompileLog ??= []).push([Math.round(performance.now()), w]); };
    const compile = () => {
      timer = 0;
      if (!scroll.isConnected) { why('gone'); return; }
      const ed = scroll.querySelector<HTMLElement>('.forward-only-editor');
      const sel = document.getSelection();
      if (!ed || !sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) { why('no-caret'); return; }   // the writing line is the caret's; no caret here, no change
      const caret = caretBox(sel.getRangeAt(0), ed);
      if (!caret) { why('no-caret-box'); return; }
      const { L, s } = frame();
      Object.assign(snap, { left: L.left, top: L.top, s, w: layer.offsetWidth, scrollTop: scroll.scrollTop, now: scroll.scrollTop });
      const lhLayout = parseFloat(getComputedStyle(ed).lineHeight);
      const lh = Number.isFinite(lhLayout) && lhLayout > 0 ? lhLayout * s : caret.height * 1.4;
      const limit = caret.top - (COMPILE_LINES - 0.5) * lh;   // a word whose top is above this sits two lines up or more
      const view = scroll.getBoundingClientRect();
      const found: { r: DOMRect; range: Range; text: string; fs: number; row: number }[] = [];
      const rows = rowsOf(ed);
      const edR = ed.getBoundingClientRect();
      const edTop = edR.top;
      const edK = ed.offsetHeight > 0 ? edR.height / ed.offsetHeight || 1 : 1;
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
            if (floor != null && (r.top - edTop) / edK <= floor + 1) continue;   // the doc's older text: never signal
            const parent = n.parentElement;
            const row = Math.max(COMPILE_LINES, Math.round((caret.top - r.top) / lh));   // the line above the caret's it stands on
            if (row >= COMPILE_LINES + SIGNAL.rowsShown) continue;   // the sixth row is the last: further up, nothing
            found.push({ r, range, text: m[0], fs: parent ? parseFloat(getComputedStyle(parent).fontSize) || 16 : 16, row });
          }
        }
      }
      const next = found.map((f) => `${Math.round((f.r.left - L.left) / s)},${Math.round((f.r.top - L.top) / s)},${f.text}`).join('|');
      if (next === sig) { why(found.length ? 'same' : 'none-found'); return; }   // the same words in the same places: nothing to change
      // refused by the flash budget: asked again COMPILE_RETRY_MS later (the Wrizors' S4 r9 review: an open whose only pause was refused showed no rows at all until she paused again; Nov 9 r2: the
      // harness caught it 4 times in 10 - the idle glitch's flashes (sl-*, f3-glitchbar) were holding the budget at the moment of the pause, and a 700 ms retry could be refused again; a key still
      // resets the wait, so nothing compiles while keys land)
      if (!tryFlash('f3-compile')) { why('refused'); timer = window.setTimeout(compile, COMPILE_RETRY_MS); return; }
      why(`drawn ${found.length}`);
      sig = next;
      layer.replaceChildren();
      words.clear();
      // THE ROWS (Nick's refinement 1, the Wrizors' Corridor review B4): each finished row is ONE holder, scaled as a whole about the corridor's CENTRE LINE (7.5% a row, floor 40%) and faded 15% a row;
      // one transform and one opacity per row, set here when the line ends. The words inside keep their own full-size slots and sit at their true places, so the holder's scale is what pulls the ends in.
      const cx = (window.innerWidth / 2 - L.left) / s;
      const holders = new Map<number, HTMLElement>();
      const holderFor = (row: number, cy: number): HTMLElement => {
        let hd = holders.get(row);
        if (hd) return hd;
        hd = document.createElement('div');
        hd.className = 'flux3-compile-row';
        hd.dataset.row = String(row);
        const k = Math.max(SIGNAL.rowMin, 1 - SIGNAL.rowShrink * (row - COMPILE_LINES + 1));   // the first signal row is one step back from the writing line's size
        Object.assign(hd.style, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '0px', transformOrigin: `${cx}px ${cy}px`, transform: `scale(${k.toFixed(4)})`, opacity: Math.max(0, 1 - SIGNAL.rowFade * (row - COMPILE_LINES + 1)).toFixed(2) });
        hd.dataset.k = k.toFixed(4);
        layer.appendChild(hd);
        holders.set(row, hd);
        return hd;
      };
      found.forEach((f) => {
        const el = document.createElement('span');
        el.className = 'flux3-compile-word';
        el.dataset.word = f.text;   // the word it covers (a check holds the glyphs to that word's own rect)
        el.dataset.row = String(f.row);
        // one block per character, seeded by the word's place in the page's own layout (the layer scrolls with the text, so that place holds)
        const chars = [...f.text];
        const slot = f.r.width / s / chars.length;
        const bw = slot * BLOCK_FILL, bh = Math.min(f.fs * BLOCK_HEIGHT, f.r.height / s);
        Object.assign(el.style, { position: 'absolute', display: 'flex', alignItems: 'center' });
        blocksFor(chars, Math.round((f.r.left - L.left) / s) * 7 + Math.round((f.r.top - L.top) / s) * 13).forEach((filled) => {
          const b = document.createElement('i');
          b.className = filled ? 'f' : 'h';
          Object.assign(b.style, { display: 'block', flex: 'none', boxSizing: 'border-box', width: `${bw}px`, height: `${bh}px`, margin: `0 ${(slot - bw) / 2}px` });
          el.appendChild(b);
        });
        placeOn(el, f.r, L, s);
        holderFor(f.row, (f.r.top + f.r.height / 2 - L.top) / s).appendChild(el);
        words.set(el, { range: f.range, text: f.text });
      });
    };
    const schedule = () => { if (timer) window.clearTimeout(timer); timer = window.setTimeout(compile, COMPILE_PAUSE_MS); };
    const opts = { capture: true, passive: true } as const;
    const DOC_EVENTS = ['keydown', 'beforeinput', 'selectionchange', 'wz-zoom-changed'] as const;
    const onFirst = () => readFloor();
    document.addEventListener('keydown', onFirst, opts);
    document.addEventListener('selectionchange', onFirst, opts);
    DOC_EVENTS.forEach((ev) => document.addEventListener(ev, schedule, opts));
    const onScroll = () => { snap.now = scroll.scrollTop; if (PAUSE.scrollPostpones || !timer) schedule(); };
    scroll.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('keydown', onFirst, opts);
      document.removeEventListener('selectionchange', onFirst, opts);
      DOC_EVENTS.forEach((ev) => document.removeEventListener(ev, schedule, opts));
      scroll.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
      // THE DECOMPILE: when she jacks out in Flux with signal showing (the page staying, or leaving to BUILD); anything else (the still state, another theme) is a cut. A refused flash drops the turn, never the fade
      if (!words.size || still() || document.documentElement.getAttribute('data-theme') !== 'flux') { layer.remove(); return; }
      // LEAVING TO BUILD REPLACES THE PAGE'S SCROLLER, and the layer (and every word's Range) goes with it. The fade then stands on in a fixed overlay at the signal's last screen place, whole,
      // from where its opacity had got to (elapsed ms into the fade), and goes after DECOMPILE_MS (Fable, Nov 9: the rows visible all through the leave; the harness caught them cut ~90 ms in)
      let overlaid = false;
      const toOverlay = (elapsed: number) => {
        if (overlaid) return;
        overlaid = true;
        cancelAnimationFrame(raf);
        const ov = document.createElement('div');
        ov.setAttribute('aria-hidden', 'true');
        ov.style.cssText = `position:fixed;left:${snap.left}px;top:${snap.top - (snap.now - snap.scrollTop) * snap.s}px;width:${snap.w}px;height:0;transform:scale(${snap.s});transform-origin:0 0;pointer-events:none;z-index:70;`;
        layer.classList.remove('decompile');
        layer.style.transition = 'none';
        layer.style.opacity = String(Math.max(0, 1 - elapsed / DECOMPILE_MS));
        ov.appendChild(layer);
        document.body.appendChild(ov);
        requestAnimationFrame(() => requestAnimationFrame(() => { layer.style.transition = `opacity ${Math.max(60, DECOMPILE_MS - elapsed)}ms ease-out`; layer.style.opacity = '0'; }));
        window.setTimeout(() => ov.remove(), DECOMPILE_MS + 120);
      };
      // the signal resolves: every block turns over (filled to hollow, hollow to filled), still whole, and fades off its word. The TURN is the one change the flash budget is asked for; a refusal
      // drops the turn and keeps the fade, so the rows are never cut away while she leaves (Fable, Nov 9: the rows visible all through the leave)
      const flip = tryFlash('f3-decompile');
      layer.querySelectorAll<HTMLElement>('.flux3-compile-row').forEach((hd) => { hd.style.transform = 'none'; hd.style.opacity = '1'; });
      if (flip) words.forEach((_, el) => turnOver(el));
      const start = performance.now();
      const end = start + DECOMPILE_MS;
      if (!scroll.isConnected) { layer.querySelectorAll<HTMLElement>('.flux3-compile-row').forEach((hd) => { hd.style.transform = 'none'; hd.style.opacity = '1'; }); toOverlay(0); return; }
      // each glyph run follows its own word while the page settles out of the zoom (its Range is the word; the page's layout box moves under it)
      const follow = () => {
        if (!scroll.isConnected) { toOverlay(performance.now() - start); return; }
        const { L, s } = frame();
        words.forEach(({ range, text }, el) => {
          const rects = range.getClientRects();
          if (!range.startContainer.isConnected) return;   // its text went with the page's scroller: the overlay takes over on the next frame
          // a word the new layout cannot place (it re-wrapped, or its text node was replaced on the way to BUILD) STANDS where it last was and fades with the rest: the rows are never cut away
          // while she leaves (the harness caught every word being removed within 90 ms)
          if (rects.length !== 1 || range.toString() !== text) return;
          placeOn(el, rects[0], L, s);
        });
        if (!scroll.isConnected) { toOverlay(performance.now() - start); return; }
        if (performance.now() < end && words.size) raf = requestAnimationFrame(follow); else layer.remove();
      };
      raf = requestAnimationFrame(() => { follow(); layer.classList.add('decompile'); });
    };
  }, [jackedIn, scrollRef]);

  return jackedIn ? <><FluxCorridor scrollRef={scrollRef} unitCount={unitCount} /><FluxJackedHints /></> : null;
}
