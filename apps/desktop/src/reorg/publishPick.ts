import { useSyncExternalStore } from 'react';

// WHAT GOES OUT, while she is in FINALIZE (Fable, Nov 20: "PARTS only re-orders and ticks"). The Parts she has ticked OUT of the publication, as session state shared by the two places that
// show it: the publishing view's own ticks and the Front menu's PARTS tab. Saved nowhere ("no new saved data"): it starts empty each time the view opens and is gone when it closes or she
// leaves the page. Keyed by the page it was opened on, so a stale pick can never reach another Doc.
interface Pick { key: string | null; off: ReadonlySet<string>; plan: boolean }
const EMPTY: ReadonlySet<string> = new Set();
let pick: Pick = { key: null, off: EMPTY, plan: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Start a pick for a page (the view opened). */
export function openPick(key: string, plan = false): void { pick = { key, off: EMPTY, plan }; emit(); }
/** End it (the view closed). */
export function closePick(key: string): void { if (pick.key === key) { pick = { key: null, off: EMPTY, plan: false }; emit(); } }
/** The Parts ticked out of this page's publication; empty when the pick is not this page's. */
export function pickOff(key: string): ReadonlySet<string> { return pick.key === key ? pick.off : EMPTY; }
export function setPickOff(key: string, off: ReadonlySet<string>): void { if (pick.key === key) { pick = { key, off, plan: pick.plan }; emit(); } }
/** "Include the Plan in what goes out" (item 5a): off each time the view opens, shared by the view and the Back menu's Plan tab, stored nowhere. */
export function setIncludePlan(key: string, on: boolean): void { if (pick.key === key && pick.plan !== on) { pick = { ...pick, plan: on }; emit(); } }
export function includePlanNow(key: string): boolean { return pick.key === key && pick.plan; }
export function togglePick(key: string, partId: string): void {
  if (pick.key !== key) return;
  const n = new Set(pick.off);
  if (n.has(partId)) n.delete(partId); else n.add(partId);
  setPickOff(key, n);
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
/** Whether the publishing view is open on this page (the pick exists only while it is): the Back menu's Before You Export tab is there exactly then. */
export function usePublishing(key: string): boolean {
  return useSyncExternalStore(subscribe, () => pick.key === key);
}
export function useIncludePlan(key: string): boolean {
  return useSyncExternalStore(subscribe, () => includePlanNow(key));
}
export function usePickOff(key: string): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => pickOff(key));
}
