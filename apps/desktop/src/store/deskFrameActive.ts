import { useSyncExternalStore } from 'react';

// AB1 S4 — the "is a DeskFrame currently mounted" signal. A tiny pub-sub, the
// same shape as writingSettings.ts's own listener set, so App.tsx's
// GlobalHeader (Fullscreen toggle / Sync indicator / Sign out — the "top-bar
// orphans" S4 names) can collapse those three independent controls into one
// corner glyph + popover specifically while a writing surface's DeskFrame is
// on screen, and render exactly as it always has everywhere else. DeskFrame
// itself is the only writer (mount/unmount effect); every other route never
// touches this and GlobalHeader's default (false) render is untouched.
let active = false;
const listeners = new Set<() => void>();

export function setDeskFrameMounted(v: boolean): void {
  if (v === active) return;
  active = v;
  listeners.forEach(l => l());
}

// useSyncExternalStore, not useState+useEffect: a writer mounting in the same commit as a consumer must not fire into an empty listener set [deskFrameActive §1]
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): boolean {
  return active;
}

export function useDeskFrameMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
