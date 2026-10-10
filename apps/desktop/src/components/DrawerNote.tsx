import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// PHASE 1 (S3) - THE SMALL "?" NOTE beside a tab's word. A PRESSABLE note, not a hover tooltip (Nick/Fable, Oct 9): a hover-only tooltip is
// unreachable by keyboard and by touch. Press the "?" (Enter/Space/tap) and a short note opens; Escape, a press anywhere outside, or focus
// leaving it closes it. It is an overlay: it takes no room, so it displaces nothing, and it is NOT part of the tab it sits beside (it lives
// outside the tablist, so pressing it never changes tabs).
//
// The note's words are the theme's own (a lexicon term). A theme whose term has no explainer passes none and gets no "?" at all.

interface Props {
  /** Accessible name of the "?" button (a lexicon term). */
  label: string;
  children: ReactNode;
}

export function DrawerNote({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
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
      {open && <span id={id} role="note" className="wz-drawer-note-pop">{children}</span>}
    </span>
  );
}
