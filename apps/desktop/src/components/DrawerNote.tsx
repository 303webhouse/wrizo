import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// a pressable "?" note, not a hover tooltip (hover is unreachable by keyboard and touch); an overlay outside the tablist, so it displaces nothing and never changes tabs [DrawerNote §1]

interface Props {
  /** Accessible name of the "?" button (a lexicon term). */
  label: string;
  children: ReactNode;
}

// measured once at open: near the viewport's right edge the pop opens leftward so its text stays on screen [DrawerNote §2]
const POP_MAX_WIDTH = 260;
const EDGE_MARGIN = 16;

export function DrawerNote({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const rect = wrap.current?.getBoundingClientRect();
    if (rect) setOpenLeft(rect.left + POP_MAX_WIDTH > window.innerWidth - EDGE_MARGIN);
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  return (
    <span
      ref={wrap}
      className="wz-drawer-note"
      onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } }}
      onBlur={e => { if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <button
        type="button"
        className="wz-drawer-note-btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        title={label}
        onClick={() => setOpen(o => !o)}
      >?</button>
      {open && <span id={id} role="note" className={openLeft ? 'wz-drawer-note-pop wz-drawer-note-pop--left' : 'wz-drawer-note-pop'}>{children}</span>}
    </span>
  );
}
