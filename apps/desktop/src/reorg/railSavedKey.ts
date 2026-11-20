// The rail's local copy: ONE localStorage key (Fable accepted it, Nov 18, 2:45 pm: "local key writer-studio-rail ... within Nick's 'A'").
// It holds the rail record (reorg/railSaved.ts) and any box picture not yet uploaded. Its own small module, so that sign-out
// (persistence/syncApply.ts resetLocalData) can clear it without importing the rail store, which imports the sync engine.
export const RAIL_KEY = 'writer-studio-rail';
// the reorg's account preferences' local copy (prefsSaved.ts, the Back menu's split width and the rest): it goes with the rail on sign-out, whether or not its module has loaded yet
export const PREFS_LOCAL_KEY = 'wrizo-reorg-prefs';

const resetHooks = new Set<() => void>();

/** The rail store registers here to forget its memory when the account signs out. */
export function onRailReset(fn: () => void): void {
  resetHooks.add(fn);
}

// sign-out takes the rail with it, as it takes proofing: the next account never sees this one's pins, and acts not yet uploaded go too
export function clearRailLocal(): void {
  try { localStorage.removeItem(RAIL_KEY); localStorage.removeItem(PREFS_LOCAL_KEY); } catch { /* storage blocked */ }
  resetHooks.forEach((fn) => { try { fn(); } catch { /* a hook never breaks sign-out */ } });
}
