import { useEffect, useState } from 'react';

// B10.1 — THE STALE-CLIENT GUARD's state. Set once, when the server reports a build different from the one this tab is
// running (see clientBuild.ts and sync.ts). It never clears: the only way out is a reload, which loads the new build.
//
// A stale tab is READ-ONLY, not merely sync-stopped. Every tab on this origin shares one localStorage, and a tab flushes its
// WHOLE in-memory cache over the collection keys — so an old tab that kept saving would overwrite what the live tab wrote.
// persistence.ts therefore holds its automatic writes while this is set (its one exception is the explicit Reload, which
// flushes once so the unsent edits survive into the new build), and App renders the banner and makes the page inert.
//
// A leaf module on purpose (no imports from the stores): persistence.ts, sync.ts and the banner all read it.
let stale = false;
const listeners = new Set<(v: boolean) => void>();

export function isStaleClient(): boolean {
  return stale;
}

export function markStaleClient(): void {
  if (stale) return;
  stale = true;
  listeners.forEach(fn => fn(true));
}

export function subscribeStaleClient(fn: (v: boolean) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useStaleClient(): boolean {
  const [value, setValue] = useState(stale);
  useEffect(() => {
    const fn = (v: boolean) => setValue(v);
    listeners.add(fn);
    setValue(stale);
    return () => { listeners.delete(fn); };
  }, []);
  return value;
}
