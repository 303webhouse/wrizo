import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setUnbornEntry } from '../store/persistence';
import {
  birth, mintUnbornId, readDescriptor, unbornEntry,
  type BirthContent, type UnbornDescriptor,
} from '../store/unbornPage';
import type { JournalEntry } from '../types';

// PB1 — the unborn surface's own context (item 71; specification at
// docs/wrizo-alpha/pb1-unborn-surface.md).
//
// A surface is "unborn" while the writer has opened it but not yet put anything
// in it. It is fully live and typeable; it simply has no row. Both editors
// (PageEditorView, BoardEditor) reach that fact through `useUnborn(id)` rather
// than through prop-drilling, because the fact is about the SURFACE's
// lifecycle, not about any one control's props — and because the editors are
// deep trees whose children (the cascade, the Page face, the sliver) each need
// to answer for it independently.
//
// `useUnborn(id)` returns null the moment the surface is born, so every call
// site reads as "if this is still unborn, …" and the born path is the ordinary
// one, unchanged.

export interface UnbornHandle {
  id: string;
  descriptor: UnbornDescriptor;
  // Birth: write the row WITH this content in the same act, then swap the
  // address from the door to the room. Returns the row that was written.
  birthWith: (content: BirthContent, opts?: { pinToBoardId?: string | null }) => JournalEntry;
}

const UnbornContext = createContext<UnbornHandle | null>(null);

export function useUnborn(id: string): UnbornHandle | null {
  const handle = useContext(UnbornContext);
  return handle && handle.id === id ? handle : null;
}

export function UnbornProvider({ children }: { children: (id: string, descriptor: UnbornDescriptor) => ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Minted once and kept for the whole unborn session: per-page localStorage
  // keys, React keys and the cascade's own subject id all hang off it, and it
  // becomes the row's id at birth — the surface never changes identity under
  // the writer. A reload mints a fresh one, which is correct: nothing was
  // stored, so there is nothing to be the same as.
  const [id] = useState(mintUnbornId);
  const [createdAt] = useState(() => new Date().toISOString());
  const descriptor = useMemo(() => readDescriptor(location.search), [location.search]);

  // Register the record-shaped object in persistence's unborn slot BEFORE the
  // children render, so their very first getJournalEntry(id) resolves — an
  // effect would run too late and the editors would flash their "no such page"
  // redirect. Idempotent, so a double render (StrictMode) costs nothing.
  useMemo(() => {
    setUnbornEntry(unbornEntry(id, descriptor, createdAt));
    return null;
  }, [id, descriptor, createdAt]);

  // Leaving an unborn surface is not a cleanup problem — nothing was stored.
  // Clearing the slot only keeps the invariant "at most one, and only while
  // genuinely unborn."
  useEffect(() => () => setUnbornEntry(null), []);

  const birthWith = useCallback((content: BirthContent, opts: { pinToBoardId?: string | null } = {}) => {
    const born = birth(id, descriptor, content, opts);
    // The address stops describing a door and starts naming a room. AFTER the
    // write, deliberately: a crash between the two loses nothing, because the
    // row is already durable and the writer is merely on an address that no
    // longer matters. `replace` so Back does not return to a door that has
    // already been walked through.
    navigate(`/page/${born.id}`, { replace: true });
    return born;
  }, [id, descriptor, navigate]);

  const handle = useMemo<UnbornHandle>(() => ({ id, descriptor, birthWith }), [id, descriptor, birthWith]);

  return (
    <UnbornContext.Provider value={handle}>
      {children(id, descriptor)}
    </UnbornContext.Provider>
  );
}
