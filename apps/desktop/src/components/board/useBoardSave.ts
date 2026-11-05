import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { reconcileSystemBoard, saveBoardBoxes, subscribe, getJournalEntry, generateId, flushNow, type SystemBoardKind } from '../../store/persistence';
import { AUTOSAVE_MS } from './geometry';
import { type Box } from '../../types';
import { graftTo } from '../../store/grafts';
import { registerFlush } from '../../store/flushRegistry';
import { type UnbornHandle } from '../UnbornSurface';

export function useBoardSave({ systemKind, id, setBoxes, lastSavedRef, boxes, unbornRef, boxesRef, pendingGraftsRef, unborn }: {
  systemKind: SystemBoardKind;
  id: string;
  setBoxes: Dispatch<SetStateAction<Box[]>>;
  lastSavedRef: MutableRefObject<Box[]>;
  boxes: Box[];
  unbornRef: MutableRefObject<UnbornHandle>;
  boxesRef: MutableRefObject<Box[]>;
  pendingGraftsRef: MutableRefObject<{ boxId: string; entryId: string }[]>;
  unborn: UnbornHandle;
}) {
  // B1 S2 — the reconcile. Runs once on mount (a system Board may have
  // qualifying pages the writer hasn't visited it since) and again on every
  // subsequent store change while mounted (persistence.ts's own subscribe —
  // the SAME notify() every write in the app already fires), so a capture
  // or a delete happening ANYWHERE reaches whichever system Board is
  // currently open without the writer lifting a finger. Applies directly
  // (saveBoardBoxes + setBoxes + lastSavedRef, mirroring undo()'s own
  // apply-and-mark-saved shape above) rather than going through the
  // debounced autosave effect below — a reconciled card set is not an
  // in-flight edit to coalesce, it's a fact that just became true.
  // Idempotent by construction (reconcileSystemBoard returns null when
  // nothing changed), so the notify() this effect's OWN save fires back
  // into itself resolves to a single further no-op check, not a loop.
  // Completely inert for an ordinary Board (`systemKind` falsy) — S3's own
  // "User Boards are untouched by this slice" law, held by one early return.
  useEffect(() => {
    if (!systemKind) return;
    const runReconcile = () => {
      const reconciled = reconcileSystemBoard(id);
      if (reconciled === null) return;
      saveBoardBoxes(id, reconciled);
      setBoxes(reconciled);
      lastSavedRef.current = reconciled;
    };
    runReconcile();
    return subscribe(runReconcile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, systemKind]);

  // Autosave — debounced, like PageEditor's text; flush on hide/unmount.
  // PB1 — on an UNBORN board the first box births the row synchronously,
  // carrying the boxes with it, instead of waiting for this debounce: the
  // board's content must reach disk on exactly the schedule it always did, and
  // a debounced birth would open a window in which the writer's first card
  // existed only in memory. Once born, `unbornRef` nulls itself and the
  // ordinary debounce below resumes for every later change.
  useEffect(() => {
    if (boxes === lastSavedRef.current) return;
    if (unbornRef.current) {
      if (boxes.length === 0) return; // still nothing in the room
      lastSavedRef.current = boxes;
      unbornRef.current.birthWith({ boxes });
      return;
    }
    const h = setTimeout(() => { saveBoardBoxes(id, boxesRef.current); lastSavedRef.current = boxesRef.current; }, AUTOSAVE_MS);
    return () => clearTimeout(h);
  }, [boxes, id]);

  // W3 - FROM MY PAGES: the dealt cards are GRAFTED to their pages through the ordinary Grafts path (store/grafts.ts graftTo) - but only once the cards are on a board whose ROW exists: an unborn board is born by
  // its first box (the effect above), and a graft is a record owned by the board's row, so it is made on the render after the birth. A page already pinned on this board comes back as a connection,
  // which is a box in this same array. Nothing is queued for any other deck. The pages themselves are never touched (it shows only).
  useEffect(() => {
    if (pendingGraftsRef.current.length === 0 || unbornRef.current || !getJournalEntry(id)) return;
    const todo = pendingGraftsRef.current;
    pendingGraftsRef.current = [];
    const connections: Box[] = [];
    let z = boxes.reduce((m, b) => Math.max(m, b.z), 0) + 1;
    for (const g of todo) {
      if (!boxes.some(b => b.id === g.boxId)) continue;
      const made = graftTo({ entryId: id, boxId: g.boxId }, { entryId: g.entryId }, boxes);
      if (made && made.made === 'connection') connections.push({ id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: z++, connA: made.a, connB: made.b });
    }
    if (connections.length) setBoxes(prev => [...prev, ...connections]);
  }, [boxes, id, unborn]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !unbornRef.current && boxesRef.current !== lastSavedRef.current) {
        saveBoardBoxes(id, boxesRef.current);
        lastSavedRef.current = boxesRef.current;
        flushNow();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    // LOGOUT FLUSH — the 2 s boxes debounce has no blur flush, so a sign-out would otherwise miss the last two seconds
    // of board edits. It flushes them first, the same way the hide handler does, so they are counted as unsaved.
    const unregisterFlush = registerFlush(() => {
      if (!unbornRef.current && boxesRef.current !== lastSavedRef.current) {
        saveBoardBoxes(id, boxesRef.current);
        lastSavedRef.current = boxesRef.current;
      }
    });
    return () => {
      unregisterFlush();
      document.removeEventListener('visibilitychange', onHide);
      // PB1 — an unborn board leaves nothing behind: no row was written, so
      // there is nothing to flush and nothing to clean up.
      if (!unbornRef.current && boxesRef.current !== lastSavedRef.current) saveBoardBoxes(id, boxesRef.current);
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
