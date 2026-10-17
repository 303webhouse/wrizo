import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { closeHelp, useOpenHelp } from '../store/help';
import { useDeskLexicon } from '../store/deskLexicon';

// HELP BUTTONS — the one shared sentence overlay (mounted ONCE, App.tsx —
// ContextMenuHost.tsx's own proven pattern). position:fixed in a body
// portal: it takes no space in the document anywhere, so no writing surface
// it floats over can ever move or resize for it — page primacy holds by
// construction. Closes on a second tap of the SAME "?" (store/help.ts's own
// toggle), a tap/press anywhere outside it, or Esc; NEVER on a timer (Nick's
// own ruling, the mockup's own commit d4d1c835 removed an earlier one). Esc
// and outside-close both return focus to the "?" that opened it — the SAME
// returnFocus-ref mechanism ContextMenuHost.tsx already uses.
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
    // FIX (Fable, Oct 17, ledger 88-90): this listener only ever excluded the
    // POPOVER (ref) from "outside" — never the "?" that owns it. A second
    // press on that SAME "?" landed here on pointerdown (mousedown, before
    // the button's own click fires), read as outside, and closed the pop —
    // then the button's own onClick toggled the now-closed store back open.
    // Net effect: closes on mousedown, reopens on click (never actually
    // closes). The trigger currently showing this pop always carries
    // aria-expanded="true" (HelpButton.tsx) while it is open, which is
    // exactly "the '?' that owns the pop" — exclude it too, and let ITS OWN
    // click (store/help.ts's toggleHelp) be the one thing that closes it.
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
