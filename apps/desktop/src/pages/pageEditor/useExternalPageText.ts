import { useEffect, type MutableRefObject } from 'react';
import { subscribe } from '../../store/persistence';

// #76 PART 1 and 3 - the record of an open page can change under it: another window saved it. The store tells every screen (store/persistence/syncApply.ts applyOtherWindowWrite, from the browser's `storage` event, and the sync pull);
// this hook runs the page's `reconcile` (PageEditor.tsx) when that happens, so a page with nothing unsaved shows the other window's words at once, and one WITH unsaved words has the two merged (store/textMerge.ts).
// While she is typing in this window (a key in the last IDLE_MS) the page is not rebuilt under her fingers: the reconcile waits for the pause. A save that comes sooner reconciles first anyway (usePageAutosave), so nothing is ever written over the other window's words.
const IDLE_MS = 800;

export function useExternalPageText({ id, unbornRef, lastTypedAtRef, reconcileRef }: {
  id: string;
  unbornRef: MutableRefObject<unknown>;
  lastTypedAtRef: MutableRefObject<number>;
  reconcileRef: MutableRefObject<() => boolean>;
}) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      timer = null;
      const quiet = Date.now() - lastTypedAtRef.current;
      if (quiet < IDLE_MS) { timer = setTimeout(run, IDLE_MS - quiet + 40); return; }
      reconcileRef.current();
    };
    const unsubscribe = subscribe(() => { if (unbornRef.current || timer !== null) return; run(); });
    return () => { unsubscribe(); if (timer !== null) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
