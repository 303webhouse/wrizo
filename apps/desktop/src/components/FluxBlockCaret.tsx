import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../store/theme';

// TH2 Slice 5 — the wide orange block caret (canon §13). One global mount
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

    const update = () => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !sel.isCollapsed) { clearActive(); return; }
      const anchor = sel.anchorNode;
      const target = anchor instanceof Element ? anchor : anchor?.parentElement;
      const surface = target?.closest?.(PROSE_SURFACES) as HTMLElement | null;
      if (!surface) { clearActive(); return; }

      const range = sel.getRangeAt(0).cloneRange();
      let r = range.getClientRects()[0];
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

      if (activeElRef.current && activeElRef.current !== surface) activeElRef.current.removeAttribute('data-flux-caret-active');
      activeElRef.current = surface;
      surface.setAttribute('data-flux-caret-active', 'true');
      const height = r.height || 18;
      setRect({ left: r.left, top: r.top, width: Math.max(7, Math.round(height * 0.48)), height });
    };

    const onBlurCheck = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || !active.closest?.(PROSE_SURFACES)) clearActive();
      }, 120);
    };

    document.addEventListener('selectionchange', update);
    document.addEventListener('focusout', onBlurCheck, true);
    update();
    return () => {
      document.removeEventListener('selectionchange', update);
      document.removeEventListener('focusout', onBlurCheck, true);
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
