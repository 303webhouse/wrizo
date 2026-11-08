import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../store/theme';
import { caretWidth } from '../store/fluxReadouts';
import { caretRow } from './useTypewriterFade';

// TH2 Slice 5 — the orange block caret (canon §13); FLUX V2 slimmed it to a third of its old width (store/fluxReadouts.ts caretWidth). One global mount
// point (the VoiceWallWhisper pattern: a single document-level
// `selectionchange` listener rather than wiring every writing surface
// individually) tracking the NATIVE caret's rect via the Selection API —
// the same technique flux-rc2.html's own `bcu()` uses. This is visual-only:
// it draws an overlay at wherever the browser's real caret already is, and
// never touches caret MOVEMENT — that stays entirely native/W2's
// caretOffset.ts territory (no new caret machinery, per the brief).
//
// The native caret is hidden ONLY on the element currently carrying a
// rendered block caret (a `data-flux-caret-active` attribute this
// component sets and clears itself) — never a blanket caret-color rule, so
// a writer never ends up with no visible caret at all if a rect can't be
// resolved (an empty line, a fresh mount, a non-Chromium selection quirk).
const PROSE_SURFACES = '.forward-only-editor, .entry-edit, .board-text, .script-el-active';
// A caret held at an ELEMENT boundary (the editor restoring it as its own child index after a re-render) has no rect of its own, and the row
// fallback took the in-progress word's INLINE span for the "row", so the block stood on the last word's first letter (the Wrizors' S4 r9
// review). An inline span is never a row: the probe finds the caret's place instead [FluxBlockCaret §5]
export const CARET_PLACE = { textEnd: true };

interface Rect { left: number; top: number; width: number; height: number }

export function FluxBlockCaret() {
  const theme = useTheme();
  const [rect, setRect] = useState<Rect | null>(null);
  const activeElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (theme !== 'flux') {
      if (activeElRef.current) { activeElRef.current.removeAttribute('data-flux-caret-active'); activeElRef.current = null; }
      setRect(null);
      return;
    }

    const clearActive = () => {
      if (activeElRef.current) { activeElRef.current.removeAttribute('data-flux-caret-active'); activeElRef.current = null; }
      setRect(null);
    };

    // `probe` false: a MOVED caret (below) is redrawn only from a rect the selection already gives - never by inserting the probe span, which
    // would mutate the editor on every scroll frame (and the typewriter engine observes the editor's mutations).
    const update = (probe = true) => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !sel.isCollapsed) { clearActive(); return; }
      const anchor = sel.anchorNode;
      const target = anchor instanceof Element ? anchor : anchor?.parentElement;
      const surface = target?.closest?.(PROSE_SURFACES) as HTMLElement | null;
      if (!surface) { clearActive(); return; }

      const range = sel.getRangeAt(0).cloneRange();
      let r = range.getClientRects()[0];
      // the caret's row is the truth where the range gives no rect (a fresh empty line) or a rect off the row; the block stands at the row's start, on scrolls and glides too [FluxBlockCaret §1]
      const row0 = caretRow(sel, surface);
      // [FluxBlockCaret §5] an inline span (the in-progress word) is never the caret's row. Without a rect, the caret at an element boundary stands
      // at the END of the text just before it, read without touching the DOM, so it follows scrolls and glides too (a probe may not run then)
      const row = row0 && CARET_PLACE.textEnd && getComputedStyle(row0).display === 'inline' ? null : row0;
      const atTextEnd = (): DOMRect | null => {
        const a = sel.anchorNode;
        if (!CARET_PLACE.textEnd || !a || a.nodeType !== Node.ELEMENT_NODE || sel.anchorOffset === 0) return null;
        for (let s: Node | null = a.childNodes[sel.anchorOffset - 1] ?? null; s; s = s.previousSibling) {
          let t: Text | null = null;
          if (s.nodeType === Node.TEXT_NODE) t = s as Text;
          else { const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if ((n.nodeValue ?? '').replace(/[​﻿]/g, '').length) t = n as Text; }
          const v = t?.nodeValue ?? '';
          let i = v.length;
          while (i > 0 && /[​﻿]/.test(v[i - 1])) i -= 1;
          if (!t || !i) continue;
          const one = document.createRange();
          one.setStart(t, i - 1); one.setEnd(t, i);
          const lr = [...one.getClientRects()].pop();
          if (lr && lr.height) return new DOMRect(lr.right, lr.top, 0, lr.height);
        }
        return null;
      };
      if (!r) { const fromEnd = atTextEnd(); if (fromEnd) r = fromEnd; }
      const atRowStart = (): DOMRect | null => {
        if (!row) return null;
        const rr = row.getBoundingClientRect();
        if (!rr.height) return null;
        const cs = getComputedStyle(row);
        const lh = parseFloat(cs.lineHeight) || rr.height;
        const sc = row.offsetHeight > 0 ? rr.height / row.offsetHeight : 1;   // the page may be painted at a scale
        return new DOMRect(rr.left + (parseFloat(cs.paddingLeft) || 0) * sc + (parseFloat(cs.textIndent) || 0) * sc, rr.top, 0, Math.min(rr.height, lh * sc));
      };
      if (!r) { const fromRow = atRowStart(); if (fromRow) r = fromRow; }
      if (!r && !probe) return;   // keep the drawn caret; the next selectionchange resolves an empty line
      if (!r) {
        // Collapsed at an empty position (e.g. an empty line) — a
        // zero-width probe span resolves a rect the same way the RC-2
        // reference does.
        const probe = document.createElement('span');
        probe.textContent = '​';
        try {
          range.insertNode(probe);
          r = probe.getBoundingClientRect();
          probe.parentNode?.removeChild(probe);
        } catch {
          clearActive();
          return;
        }
      }
      if (!r || (!r.height && !r.top)) { clearActive(); return; }
      // the block follows Enter at once: a rect off the caret's row is the previous line's end, so the row's start is used [FluxBlockCaret §2]
      if (row) {
        const rr = row.getBoundingClientRect();
        const mid = r.top + (r.height || 0) / 2;
        if (rr.height && (mid < rr.top - 1 || mid > rr.bottom + 1)) { const fromRow = atRowStart(); if (fromRow) r = fromRow; }
      }

      if (activeElRef.current && activeElRef.current !== surface) activeElRef.current.removeAttribute('data-flux-caret-active');
      activeElRef.current = surface;
      surface.setAttribute('data-flux-caret-active', 'true');
      const height = r.height || 18;
      setRect({ left: r.left, top: r.top, width: caretWidth(height), height });
    };

    const onBlurCheck = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || !active.closest?.(PROSE_SURFACES)) clearActive();
      }, 120);
    };

    // the caret can move without the selection changing (the zoom, a glide, a resize), so each redraws it, batched into one frame; scroll is heard in the capture phase [FluxBlockCaret §3]
    let raf = 0;
    const onSel = () => update(true);
    const moved = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => update(false)); };
    document.addEventListener('selectionchange', onSel);
    document.addEventListener('focusout', onBlurCheck, true);
    document.addEventListener('scroll', moved, { capture: true, passive: true });
    document.addEventListener('wz-caret-moved', moved);
    window.addEventListener('resize', moved);
    update();
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('selectionchange', onSel);
      document.removeEventListener('focusout', onBlurCheck, true);
      document.removeEventListener('scroll', moved, { capture: true });
      document.removeEventListener('wz-caret-moved', moved);
      window.removeEventListener('resize', moved);
      clearActive();
    };
  }, [theme]);

  if (theme !== 'flux' || !rect) return null;
  return (
    <div
      aria-hidden="true"
      className="flux-block-caret"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
    />
  );
}
