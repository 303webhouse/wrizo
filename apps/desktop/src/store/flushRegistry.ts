// LOGOUT FLUSH — an editor keeps what the writer just typed in memory for up to 2 s before it reaches the record
// (the autosave debounce). A sign-out that decides "is anything unsaved?" from the records alone cannot see that
// text, and the wipe after it would take it. So every editor with such a buffer registers a flush here, and
// handleLogout calls flushAll() FIRST — flush, then decide, then wipe — so the last seconds of writing are counted
// as unsaved, and an editor's own unmount flush, which runs after the wipe, finds nothing left to write.
//
// Pure and dependency-free, so a proof runs the exact functions the editors and App.tsx call.

interface Entry { fn: () => void }
const entries = new Set<Entry>();

/** Register an editor's flush. Returns the unregister function — call it on unmount. Registering the same
 *  function twice (React StrictMode mounts, unmounts and remounts) yields two independent entries. */
export function registerFlush(fn: () => void): () => void {
  const entry: Entry = { fn };
  entries.add(entry);
  return () => { entries.delete(entry); };
}

/** Run every registered flush. One editor failing must never stop the others (and never stop the sign-out's own
 *  decision), so each runs on its own. Order is registration order. */
export function flushAll(): void {
  for (const entry of [...entries]) {
    try { entry.fn(); } catch { /* the editor's own flush failed; the rest still run */ }
  }
}

export function registeredFlushCount(): number { return entries.size; }
