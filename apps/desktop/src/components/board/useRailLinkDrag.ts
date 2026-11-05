import { useEffect, type MutableRefObject } from 'react';
import { getJournalEntryIncludingDeleted } from '../../store/persistence';

export function useRailLinkDrag({ canvasRef, linkedCopyRef, threadArmedFromRef, popupBoxIdRef, id }: {
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  linkedCopyRef: MutableRefObject<(entryId: string, x: number, y: number) => void>;
  threadArmedFromRef: MutableRefObject<string>;
  popupBoxIdRef: MutableRefObject<string>;
  id: string;
}) {
  useEffect(() => {
    let press: { x: number; y: number; entryId: string; label: string } | null = null;
    let ghost: HTMLElement | null = null;
    const finish = () => {
      window.removeEventListener('pointermove', onMove, true); window.removeEventListener('pointerup', onUp, true); window.removeEventListener('pointercancel', onCancel, true);
      ghost?.remove(); ghost = null; delete document.body.dataset.linkDrag; press = null;
    };
    function onMove(e: PointerEvent) {
      if (!press) return;
      if (!ghost) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6) return;
        ghost = document.createElement('div'); ghost.className = 'wz-link-ghost'; ghost.textContent = press.label;
        document.body.appendChild(ghost); document.body.dataset.linkDrag = 'true';
      }
      e.preventDefault();
      ghost.style.left = `${e.clientX + 10}px`; ghost.style.top = `${e.clientY - 20}px`;
    }
    function onUp(e: PointerEvent) {
      const p = press, dragged = !!ghost;
      finish();
      if (!p || !dragged) return;
      // the thumbnail's own click (it travels to the page) must not fire for a drag
      const swallow = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 80);
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const cv = canvasRef.current;
      if (over && cv && cv.contains(over)) linkedCopyRef.current(p.entryId, e.clientX, e.clientY);   // dropped anywhere on the board (empty space or over a card): a card lands there
    }
    function onCancel() { finish(); }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch' || threadArmedFromRef.current != null || popupBoxIdRef.current) return;
      const el = (e.target as Element | null)?.closest?.('[data-link-entry]') as HTMLElement | null;
      if (!el || canvasRef.current?.contains(el)) return;
      if (el.closest('[draggable="true"]') || (e.target as Element).closest('.wz-cascade-thumb-menu-btn, .wz-cascade-thumb-menu, [data-reorder-grip]')) return;   // BIG PROJECTS 1a: a Pages pop-out row's reorder grip keeps its own drag   // a draggable survey row keeps its own (membership) drag
      const eid = el.dataset.linkEntry!;
      if (eid === id || !getJournalEntryIncludingDeleted(eid)) return;
      // the label is the card's WORDS - its hidden marks (a style span's included) are dropped before it is read [BoardEditor §32]
      const words = el.cloneNode(true) as HTMLElement; words.querySelectorAll('.md-mark-hidden').forEach((n) => n.remove());
      press = { x: e.clientX, y: e.clientY, entryId: eid, label: (words.textContent ?? '').trim().split('\n')[0].slice(0, 60) || 'Untitled' };
      window.addEventListener('pointermove', onMove, true); window.addEventListener('pointerup', onUp, true); window.addEventListener('pointercancel', onCancel, true);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => { document.removeEventListener('pointerdown', onDown, true); finish(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
