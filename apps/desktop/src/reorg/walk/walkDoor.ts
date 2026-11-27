import { useSyncExternalStore } from 'react';

// THE WALK'S DOOR (PRESETS-B, Nov 25): which page's Plan she is walking, and which she just left (the chip, her one-tap way back: Page is Primary). In this session only: nothing here is stored.
// (Her PLACE is the saved thing, written by the walk itself: docSettings.ts walk.)

export interface WalkDoorState { open: string | null; left: string | null }
let state: WalkDoorState = { open: null, left: null };
const listeners = new Set<() => void>();
const set = (next: WalkDoorState): void => { if (next.open === state.open && next.left === state.left) return; state = next; listeners.forEach((l) => l()); };

/** Open the walk over this page's Plan. */
export const openWalk = (pageId: string): void => set({ open: pageId, left: null });
/** Close it, keeping the chip back to it. */
export const leaveWalk = (): void => set({ open: null, left: state.open });
/** Close it with no chip (its end card's Close, or a walk with nothing left to walk). */
export const forgetWalk = (): void => set({ open: null, left: null });

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;
export const useWalkDoor = (): WalkDoorState => useSyncExternalStore(subscribe, snapshot, snapshot);
