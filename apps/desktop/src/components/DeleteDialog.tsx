import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePendingDelete, resolveDelete } from '../store/deleteGate';
import { useDeskLexicon } from '../store/deskLexicon';

// BOARD CONTEXT MENU - the one "Send to Trash?" dialog (theme words) with Cancel / Delete and "Don't ask me again". Mounted ONCE (App.tsx); every delete opens it through store/deleteGate.ts.
// Portalled to body so it covers the rail too (the deckwizard-backdrop law), a real alertdialog: focus lands on Cancel, Tab stays inside, Esc and a press on the scrim cancel, the focus returns to where it was.
export function DeleteDialog() {
  const pending = usePendingDelete();
  const { t } = useDeskLexicon();
  const [dontAsk, setDontAsk] = useState(false);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!pending) return undefined;
    setDontAsk(false);
    returnFocus.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => cancelRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); resolveDelete(false); return; }
      if (e.key === 'Tab' && boxRef.current) {
        const f = [...boxRef.current.querySelectorAll<HTMLElement>('button, input')];
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      try { returnFocus.current?.focus?.(); } catch { /* gone */ }
    };
  }, [pending]);

  if (!pending) return null;
  return createPortal(
    <div className="wz-delete-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) resolveDelete(false); }}>
      <div ref={boxRef} className="wz-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="wz-delete-title">
        <div className="wz-delete-title" id="wz-delete-title">{pending.title ?? t('deleteDialogTitle')}</div>
        <label className="wz-delete-chk">
          <input type="checkbox" checked={dontAsk} onChange={(e) => setDontAsk(e.target.checked)} />
          <span className="wz-delete-box" aria-hidden="true" />
          <span>{t('deleteDialogDontAsk')}</span>
        </label>
        <div className="wz-delete-btns">
          <button type="button" className="wz-delete-btn" ref={cancelRef} onClick={() => resolveDelete(false)}>{t('deleteDialogCancel')}</button>
          <button type="button" className="wz-delete-btn wz-delete-go" onClick={() => resolveDelete(true, dontAsk)}>{t('deleteDialogConfirm')}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
