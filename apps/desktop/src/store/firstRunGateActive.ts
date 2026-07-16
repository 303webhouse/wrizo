import { useEffect, useState } from 'react';

// HB1 S3 — a tiny ephemeral (non-persisted) pub-sub signal, the same shape
// and job as store/deskFrameActive.ts: "is the first-run veil/gate currently
// on screen." Written only by the gate's own mount/unmount effect
// (PageEditorView); read by App.tsx's GlobalHeader so the corner-glyph menu
// goes fully inert (not just visually collapsed) while the gate holds — the
// veil's accessibility invariant applies to every piece of chrome, not just
// the one component that happens to render it.
let current = false;
const subs = new Set<(v: boolean) => void>();

export function setFirstRunGateActive(next: boolean): void {
  if (current === next) return;
  current = next;
  subs.forEach(fn => fn(current));
}

export function useFirstRunGateActive(): boolean {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: boolean) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}
