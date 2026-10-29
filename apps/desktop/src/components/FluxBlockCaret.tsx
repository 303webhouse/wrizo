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
      // POLISH #10 item 17: the row the caret sits in is the truth where the range gives no rect (a fresh empty line) or a rect off the row; the block stands
      // at that row's start, one line tall - on a scroll or glide too, so it follows the hold instead of keeping its last place.
      const row = caretRow(sel, surface);
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
      // (Nick, Oct 25) the block follows Enter AT ONCE: a rect that is not on the caret's row is the previous line's end - the row's start is used instead.
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

    // PAGE-SIZE (the Oct 13 addendum: the block caret went stale when Typewriter toggled) - the caret can MOVE without the selection changing:
    // the zoom transforms the page, a typewriter glide scrolls it, a resize rescales it. Each now redraws it too, batched into one frame (scroll
    // is heard in the CAPTURE phase so an inner scroller's scroll counts; `wz-caret-moved` is ModeStage's own announcement when the zoom toggles).
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
