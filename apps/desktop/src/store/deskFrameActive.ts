import { useEffect, useState } from 'react';

// AB1 S4 — the "is a DeskFrame currently mounted" signal. A tiny pub-sub, the
// same shape as writingSettings.ts's own listener set, so App.tsx's
// GlobalHeader (Fullscreen toggle / Sync indicator / Sign out — the "top-bar
// orphans" S4 names) can collapse those three independent controls into one
// corner glyph + popover specifically while a writing surface's DeskFrame is
// on screen, and render exactly as it always has everywhere else. DeskFrame
// itself is the only writer (mount/unmount effect); every other route never
// touches this and GlobalHeader's default (false) render is untouched.
let active = false;
const listeners = new Set<(v: boolean) => void>();

export function setDeskFrameMounted(v: boolean): void {
  if (v === active) return;
  active = v;
  listeners.forEach(l => l(v));
}

export function useDeskFrameMounted(): boolean {
  const [v, setV] = useState(active);
  useEffect(() => {
    const l = (x: boolean) => setV(x);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return v;
}
