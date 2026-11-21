import { useSyncExternalStore } from 'react';

// WHAT GOES OUT, while she is in FINALIZE (Fable, Nov 20: "PARTS only re-orders and ticks"). The Parts she has ticked OUT of the publication, as session state shared by the two places that
// show it: the publishing view's own ticks and the Front menu's PARTS tab. Saved nowhere ("no new saved data"): it starts empty each time the view opens and is gone when it closes or she
// leaves the page. Keyed by the page it was opened on, so a stale pick can never reach another Doc.
interface Pick { key: string | null; off: ReadonlySet<string> }
const EMPTY: ReadonlySet<string> = new Set();
let pick: Pick = { key: null, off: EMPTY };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Start a pick for a page (the view opened). */
export function openPick(key: string): void { pick = { key, off: EMPTY }; emit(); }
/** End it (the view closed). */
export function closePick(key: string): void { if (pick.key === key) { pick = { key: null, off: EMPTY }; emit(); } }
/** The Parts ticked out of this page's publication; empty when the pick is not this page's. */
export function pickOff(key: string): ReadonlySet<string> { return pick.key === key ? pick.off : EMPTY; }
export function setPickOff(key: string, off: ReadonlySet<string>): void { if (pick.key === key) { pick = { key, off }; emit(); } }
export function togglePick(key: string, partId: string): void {
  if (pick.key !== key) return;
  const n = new Set(pick.off);
  if (n.has(partId)) n.delete(partId); else n.add(partId);
  setPickOff(key, n);
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function usePickOff(key: string): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => pickOff(key));
}
