import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOpenContextMenu, closeContextMenu } from '../store/contextMenu';

// BOARD CONTEXT MENU - the menu itself: a small themed list at the pointer, kept inside the viewport. Mounted ONCE (App.tsx). It closes on a press anywhere outside it, on Esc, on scroll or resize, and
// after a pick; Up/Down/Home/End move, Enter picks, and focus returns to where it was. Page primacy: it is an overlay (position:fixed in a portal) - it never moves or resizes anything beneath it.
export function ContextMenuHost() {
  const menu = useOpenContextMenu();
  const ref = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!menu) { setPos(null); return; }
    const r = ref.current?.getBoundingClientRect();
    const w = r?.width ?? 160, h = r?.height ?? 80;
    setPos({
      left: Math.max(4, Math.min(menu.x, window.innerWidth - w - 4)),
      top: Math.max(4, Math.min(menu.y, window.innerHeight - h - 4)),
    });
  }, [menu]);

  useEffect(() => {
    if (!menu) return undefined;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('button')?.focus());
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) closeContextMenu(); };
    const onKey = (e: KeyboardEvent) => {
      if (!ref.current) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeContextMenu(); return; }
      const items = [...ref.current.querySelectorAll<HTMLElement>('button')];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
    };
    const close = () => closeContextMenu();
    document.addEventListener('mousedown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('blur', close);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('blur', close);
      try { returnFocus.current?.focus?.(); } catch { /* gone */ }
    };
  }, [menu]);

  if (!menu) return null;
  return createPortal(
    <div
      ref={ref}
      className="wz-ctx"
      role="menu"
      style={{ left: pos?.left ?? menu.x, top: pos?.top ?? menu.y, visibility: pos ? 'visible' : 'hidden' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.items.map((it, i) => (it === null
        ? <div key={`s${i}`} className="wz-ctx-sep" role="separator" />
        : <button key={`${i}-${it.label}`} type="button" role="menuitem" className="wz-ctx-item" onClick={() => { closeContextMenu(); it.onSelect(); }}>{it.label}</button>))}
    </div>,
    document.body,
  );
}
