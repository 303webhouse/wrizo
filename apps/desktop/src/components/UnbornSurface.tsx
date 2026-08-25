import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getJournalEntry, setUnbornEntry } from '../store/persistence';
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
  // Set once, at birth. From then on the context yields null, so every child
  // takes the ordinary born path — WITHOUT the surface ever unmounting. See the
  // address note in `birthWith` for why that matters more than it looks.
  const [born, setBorn] = useState(false);
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
  //
  // ITEM 104 (THIRD) — REGISTRATION IS SELF-HEALING, because it and its teardown
  // do NOT share a lifecycle. This used to be a `useMemo` keyed on
  // [id, descriptor, createdAt]. The note above is right that a double RENDER
  // costs nothing — but React 18 StrictMode does not merely double-render: it
  // simulates unmount/remount by cycling EFFECTS while PRESERVING memo state. So
  // the cleanup below ran and cleared the slot, the memo did NOT re-run (its deps
  // had not changed), and the very next render found nothing — `getJournalEntry`
  // returned null on an unborn route that was working a moment earlier. That is
  // what made `#/page/new` throw, and why it reproduced on a dev serve and not on
  // a production bundle.
  //
  // A plain render-time re-registration fixes the mismatch at its root: it keeps
  // the load-bearing property (the slot exists BEFORE children render, so no
  // editor flashes its no-such-page redirect) while healing any teardown that
  // happened underneath it. Guarded on `born` and on the slot actually being
  // absent, so it is a no-op on every ordinary render and can never resurrect a
  // slot for a page that now has a real row.
  if (!born && !getJournalEntry(id)) {
    setUnbornEntry(unbornEntry(id, descriptor, createdAt));
  }

  // Leaving an unborn surface is not a cleanup problem — nothing was stored.
  // Clearing the slot only keeps the invariant "at most one, and only while
  // genuinely unborn."
  //
  // ITEM 104 (THIRD) — THIS TEARDOWN IS RETIRED, and the reasoning matters more
  // than the line. It was HYGIENE, never correctness ("only keeps the
  // invariant"), and it was firing when nothing had actually left: React 18
  // StrictMode simulates unmount/remount by cycling effects, so the cleanup ran
  // on a surface that was still mounted, cleared the slot, and left the very
  // next render of a CHILD with no page. Re-registering in this component's
  // render is not enough to cover that, because a CHILD-LOCAL re-render never
  // re-runs this parent — which is exactly what kept `#/page/new` redirecting to
  // Arrival even after the render-time self-heal above was in place.
  //
  // What is lost by dropping it: a slot can now outlive the surface that made
  // it, until the next unborn mount overwrites it or `birth()` clears it
  // explicitly. That costs nothing real — the slot is a single module variable,
  // it is never serialized, never synced and never enumerated (persistence.ts
  // says so in its own header), so a stale one is unreachable by every derived
  // view. "At most one" still holds; only "and only while genuinely unborn"
  // weakens, and it was buying hygiene at the price of a crash.
  //
  // The render-time re-registration above STAYS as the belt to this braces: it
  // heals any other teardown path, present or future.

  const birthWith = useCallback((content: BirthContent, opts: { pinToBoardId?: string | null } = {}) => {
    const row = birth(id, descriptor, content, opts);

    // THE ADDRESS IS CORRECTED WITHOUT A ROUTE CHANGE, and this is load-bearing
    // for the local-first invariant rather than a cosmetic choice.
    //
    // Found by this ticket's own burst-integrity check, not reasoned about: a
    // `navigate()` here changes the route, which unmounts /page/new's tree and
    // mounts /page/:id's. The newly mounted editor does NOT take focus —
    // ForwardOnlyEditor's `autoFocus` is gated on the page being EMPTY, and by
    // then it isn't — so every keystroke arriving after the remount landed on
    // nothing. A 58-character burst across the birth boundary persisted as
    // "The ". Short bursts won the race; real typing would not have.
    //
    // `history.replaceState` updates the address without firing `hashchange`,
    // so HashRouter is never notified, no route change occurs, the surface is
    // never remounted, focus is never lost, and not one keystroke is dropped.
    // The address still stops describing a door and starts naming a room; a
    // reload reads `#/page/<id>` and resolves the real row. AFTER the write,
    // deliberately: a crash between them loses nothing, because the row is
    // already durable. `replaceState` rather than a push, so Back does not
    // return to a door that has already been walked through.
    try { window.history.replaceState(null, '', `#/page/${row.id}`); } catch { /* address is cosmetic; the row is the truth */ }
    setBorn(true);
    return row;
  }, [id, descriptor]);

  // Withdrawn at birth: `useUnborn` returns null from here on, so way-back
  // re-joins, Star and tags return, the Tutor and the instrument mount, and the
  // debounced autosave takes over — all without a remount.
  const handle = useMemo<UnbornHandle | null>(
    () => (born ? null : { id, descriptor, birthWith }),
    [born, id, descriptor, birthWith],
  );

  return (
    <UnbornContext.Provider value={handle}>
      {children(id, descriptor)}
    </UnbornContext.Provider>
  );
}
