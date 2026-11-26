import { useSyncExternalStore } from 'react';

// VISUAL (Fable, Nov 25) - after a Retry brings the ink code in, the parts that failed to fetch it (the painter, the stroke input) try again. A counter in memory; nothing saved.
let attempts = 0;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const retryInkKit = (): void => { attempts += 1; listeners.forEach((fn) => fn()); };
export const useInkKit = (): number => useSyncExternalStore(subscribe, () => attempts, () => attempts);
