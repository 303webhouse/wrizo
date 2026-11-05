import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';

export function useBoardKeys({ popupBoxIdRef, threadArmedFromRef, connectEndRef, selectedConnectionIdRef, setSelectedConnectionId, selectedIdRef, setSelectedId, removeConnection, undoRef, removeSelectedRef }: {
  popupBoxIdRef: MutableRefObject<string>;
  threadArmedFromRef: MutableRefObject<string>;
  connectEndRef: MutableRefObject<(() => void) | null>;
  selectedConnectionIdRef: MutableRefObject<string>;
  setSelectedConnectionId: Dispatch<SetStateAction<string | null>>;
  selectedIdRef: MutableRefObject<string>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  removeConnection: (connId: string) => void;
  undoRef: MutableRefObject<() => void>;
  removeSelectedRef: MutableRefObject<() => void>;
}) {
  // Esc: while the card popup is open, IT owns Escape entirely (its own
  // focus-trap effect closes it — see BoardCardPopup above); this handler
  // stands down so the two can never double-handle the same keypress.
  // Otherwise: disarm a thread-drag, else deselect a connection, else
  // deselect a box. Delete/Backspace: remove a selected connection
  // (confirm-free, S3's own words) — guarded against a stray Backspace
  // while the writer is typing anywhere else on the page (the isEditable
  // check), so an unrelated edit can never eat a hairline.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (popupBoxIdRef.current) return;
      if (e.key === 'Escape') {
        // CONNECTOR-A - Esc cancels connection mode (the pointer effect owns the mode, so it is asked to end it).
        if (threadArmedFromRef.current != null) {
          connectEndRef.current?.();
          return;
        }
        if (selectedConnectionIdRef.current) { setSelectedConnectionId(null); return; }
        if (selectedIdRef.current) { setSelectedId(null); return; }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionIdRef.current) {
        const ae = document.activeElement as HTMLElement | null;
        const editable = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
        if (editable) return;
        e.preventDefault();
        removeConnection(selectedConnectionIdRef.current);
        return;
      }
      // BOARD CONTEXT MENU: Ctrl+Z / Cmd+Z undoes the board's last act (the toast on a deleted card names it). Typing anywhere editable keeps its own undo.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        const ae = document.activeElement as HTMLElement | null;
        const editable = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
        if (editable) return;
        e.preventDefault();
        undoRef.current();
        return;
      }
      // Delete removes the selected card (a selected hairline takes the key first; never while typing or with a modifier); in connection mode the key belongs to the mode [BoardEditor §45]
      if ((e.key === 'Delete' || e.key === 'Backspace') && threadArmedFromRef.current == null && selectedIdRef.current && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const ae = document.activeElement as HTMLElement | null;
        const editable = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
        if (editable) return;
        e.preventDefault();
        removeSelectedRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
