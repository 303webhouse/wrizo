// The rail's local copy: ONE localStorage key (Fable accepted it, Nov 18, 2:45 pm: "local key writer-studio-rail ... within Nick's 'A'").
// It holds the rail record (reorg/railSaved.ts) and any box picture not yet uploaded. Its own small module, so that sign-out
// (persistence/syncApply.ts resetLocalData) can clear it without importing the rail store, which imports the sync engine.
export const RAIL_KEY = 'writer-studio-rail';

const resetHooks = new Set<() => void>();

/** The rail store registers here to forget its memory when the account signs out. */
export function onRailReset(fn: () => void): void {
  resetHooks.add(fn);
}

// sign-out takes the rail with it, as it takes proofing: the next account never sees this one's pins, and acts not yet uploaded go too
export function clearRailLocal(): void {
  try { localStorage.removeItem(RAIL_KEY); } catch { /* storage blocked */ }
  resetHooks.forEach((fn) => { try { fn(); } catch { /* a hook never breaks sign-out */ } });
}
