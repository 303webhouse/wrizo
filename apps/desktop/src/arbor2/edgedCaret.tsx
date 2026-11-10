import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../store/theme';
import { caretRow } from '../components/useTypewriterFade';
import { isArbor2 } from './flag';

// ARBOR v2 MOCKUP (spec §19.2; NICK RULED, Nov 9, 9:14 pm): on the LIGHT page the caret is brass with a 1 px edge in the page's ink #241A10
// (14.6:1 on the paper, 7.9:1 against the brass; plain brass is 1.85:1 on #F3EDE1), 2 px of brass showing. The dark page keeps its plain brass
// caret (styles/arbor-v2.css r7). A native caret can only take one colour, so the edged caret is drawn over it, the way FluxBlockCaret draws Flux's:
// it follows the native caret's rect through the Selection API and never moves the caret. The native one is hidden only on the editor that carries a
// drawn caret (data-arbor2-caret-active, set and cleared here), so where no rect resolves the writer still has the native caret.
// THE LIGHT PAGE: Arbor (flag on, plateau), Page: Light, the page's own editor (not INK's put-down instrument). Typewriter by day keeps the paper,
// so it counts; Typewriter by night is page-less (the words on the room, r22 note 1), so it does not. Flag off, or any other theme: nothing.
const SURFACE = '.mode-page:not([data-instrument="ink"]) .forward-only-editor';
const ATTR = 'data-arbor2-caret-active';

interface Rect { left: number; top: number; height: number }

const onLightPage = (surface: Element): boolean => {
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== 'plateau' || root.getAttribute('data-page') === 'dark') return false;
  const zoomed = !!surface.closest(".mode-pagecol[data-zoom='true']");
  return !(zoomed && root.getAttribute('data-arbor2-room') === 'night');
};

export function ArborEdgedCaret() {
  const theme = useTheme();
  const [rect, setRect] = useState<Rect | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const on = isArbor2() && theme === 'plateau';

  useEffect(() => {
    const clear = () => {
      if (activeRef.current) { activeRef.current.removeAttribute(ATTR); activeRef.current = null; }
      setRect(null);
    };
    if (!on) { clear(); return; }

    // `probe` false: a MOVED caret is redrawn only from a rect the selection already gives, never by inserting the probe span (FluxBlockCaret's rule)
    const update = (probe = true) => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !sel.isCollapsed) { clear(); return; }
      const a = sel.anchorNode;
      const t = a instanceof Element ? a : a?.parentElement;
      const surface = t?.closest?.(SURFACE) as HTMLElement | null;
      if (!surface || !onLightPage(surface)) { clear(); return; }
      const range = sel.getRangeAt(0).cloneRange();
      let r: DOMRect | undefined = range.getClientRects()[0];
      // a caret BETWEEN elements (the anchor an element, e.g. the editor itself after a select-all collapse) has no rect of its own: it stands at
      // the end of the last text before it - read there, never at a row's start (where the native caret is not)
      let boundary = false;
      if (!r && a && a.nodeType === 1 && sel.anchorOffset > 0) {
        let n: Node | null = a.childNodes[sel.anchorOffset - 1] ?? null;
        while (n && n.nodeType === 1 && n.lastChild) n = n.lastChild;
        if (n && n.nodeType === 3 && (n.textContent ?? '').length) {
          const tr = document.createRange(); const len = (n.textContent ?? '').length;
          tr.setStart(n, len - 1); tr.setEnd(n, len);
          const last = [...tr.getClientRects()].pop();
          if (last && last.height) { r = new DOMRect(last.right, last.top, 0, last.height); boundary = true; }
        }
      }
      const row = boundary ? null : caretRow(sel, surface);
      const atRowStart = (): DOMRect | undefined => {
        if (!row) return undefined;
        const rr = row.getBoundingClientRect();
        if (!rr.height) return undefined;
        const cs = getComputedStyle(row);
        const lh = parseFloat(cs.lineHeight) || rr.height;
        const sc = row.offsetHeight > 0 ? rr.height / row.offsetHeight : 1;   // the zoomed page is painted at a scale
        return new DOMRect(rr.left + (parseFloat(cs.paddingLeft) || 0) * sc + (parseFloat(cs.textIndent) || 0) * sc, rr.top, 0, Math.min(rr.height, lh * sc));
      };
      if (!r) r = atRowStart();
      if (!r && !probe) return;
      if (!r) {
        const span = document.createElement('span');
        span.textContent = '​';
        try { range.insertNode(span); r = span.getBoundingClientRect(); span.parentNode?.removeChild(span); } catch { clear(); return; }
      }
      if (!r || (!r.height && !r.top)) { clear(); return; }
      if (row) {   // a rect off the caret's row is the previous line's end (just after Enter): the row's start is the caret
        const rr = row.getBoundingClientRect();
        const mid = r.top + (r.height || 0) / 2;
        if (rr.height && (mid < rr.top - 1 || mid > rr.bottom + 1)) r = atRowStart() ?? r;
      }
      if (activeRef.current && activeRef.current !== surface) activeRef.current.removeAttribute(ATTR);
      activeRef.current = surface;
      surface.setAttribute(ATTR, 'true');
      setRect({ left: Math.round(r.left), top: r.top, height: r.height || 18 });
    };

    const onBlur = () => { setTimeout(() => { if (!document.activeElement?.closest?.(SURFACE)) clear(); }, 120); };
    let raf = 0;
    const onSel = () => update(true);
    const moved = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => update(false)); };
    // the page's tone, the room and the zoom can change under a still caret: each re-reads it
    const mo = new MutationObserver(moved);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-page', 'data-arbor2-room', 'data-theme'] });
    mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-zoom', 'data-instrument'] });
    document.addEventListener('selectionchange', onSel);
    document.addEventListener('focusout', onBlur, true);
    document.addEventListener('scroll', moved, { capture: true, passive: true });
    document.addEventListener('wz-caret-moved', moved);
    window.addEventListener('resize', moved);
    update();
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      document.removeEventListener('selectionchange', onSel);
      document.removeEventListener('focusout', onBlur, true);
      document.removeEventListener('scroll', moved, { capture: true });
      document.removeEventListener('wz-caret-moved', moved);
      window.removeEventListener('resize', moved);
      clear();
    };
  }, [on]);

  if (!on || !rect) return null;
  // keyed on its place, so the blink restarts lit at every move (the native caret's own habit)
  return <div key={`${rect.left},${Math.round(rect.top)}`} aria-hidden="true" className="arbor2-edged-caret" style={{ left: rect.left - 1, top: rect.top, height: rect.height }} />;
}
