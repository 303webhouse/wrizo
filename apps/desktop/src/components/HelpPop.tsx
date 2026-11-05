import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { closeHelp, useOpenHelp } from '../store/help';
import { useDeskLexicon } from '../store/deskLexicon';

// the one help overlay, position:fixed in a body portal so no writing surface moves for it; closes on the same "?", an outside press or Esc - never on a timer - and returns focus to its "?" [HelpPop §1]
const EDGE_MARGIN = 8;

export function HelpPop() {
  const open = useOpenHelp();
  const { t } = useDeskLexicon();
  const ref = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const el = ref.current;
    const pw = el?.offsetWidth ?? 240, ph = el?.offsetHeight ?? 60;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = open.anchor.left;
    if (left + pw > vw - EDGE_MARGIN) left = Math.max(EDGE_MARGIN, open.anchor.right - pw);
    let top = open.anchor.bottom + 4;
    if (top + ph > vh - EDGE_MARGIN) top = Math.max(EDGE_MARGIN, open.anchor.top - ph - 4);
    setPos({ left, top });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    returnFocus.current = document.activeElement as HTMLElement | null;
    // the "?" that owns the pop (aria-expanded=true) is not "outside": its own click is what closes it [HelpPop §2]
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (ref.current?.contains(target)) return;
      if (target?.closest?.('.wz-help[aria-expanded="true"]')) return;
      closeHelp();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeHelp(); }
    };
    const onScrollOrResize = () => closeHelp();
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      try { returnFocus.current?.focus?.(); } catch { /* gone */ }
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      ref={ref}
      role="note"
      className="wz-help-pop"
      style={{ left: pos?.left ?? open.anchor.left, top: pos?.top ?? open.anchor.bottom + 4, visibility: pos ? 'visible' : 'hidden' }}
    >
      {t(open.key)}
    </div>,
    document.body,
  );
}
