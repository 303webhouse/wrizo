// FLUX3 S2 - THE STACK'S STATE: SESSION ONLY (flux-rulings-oct31.md q6: "the camera, the zoom level, the stack index, the hologram: session-only
// in v1"). A module store and nothing else: no localStorage, no account switch, no board field. Whether the Schema shows its Stack, and whether the
// Stack's centre node is open as the hologram. The index lives with the Stack itself (FluxStack.tsx) and dies with it.
import { useSyncExternalStore } from 'react';

export interface StackView {
  /** The Schema's Live view shown as the Stack (the same nodes, flown by CSS 3D transforms). */
  on: boolean;
  /** The Stack's centre node opened as the hologram (only while the Stack is on). */
  holo: boolean;
}

let state: StackView = { on: false, holo: false };
const subs = new Set<() => void>();

export function getStackView(): StackView {
  return state;
}

export function setStackView(next: Partial<StackView>): void {
  const s = { ...state, ...next };
  if (!s.on) s.holo = false;
  if (s.on === state.on && s.holo === state.holo) return;
  state = s;
  subs.forEach((fn) => fn());
}

export function useStackView(): StackView {
  return useSyncExternalStore((fn) => { subs.add(fn); return () => { subs.delete(fn); }; }, getStackView, getStackView);
}
