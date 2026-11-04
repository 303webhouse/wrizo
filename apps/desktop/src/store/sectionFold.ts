import { useEffect, useState } from 'react';

// per-section fold state, client-local: one localStorage key holding a map (section id -> the writer's explicit choice), keyed by stable content-independent ids; zero schema [sectionFold §1]
const KEY = 'wrizo-cascade-fold';

type FoldMap = Record<string, boolean>; // true = explicitly collapsed, false = explicitly expanded

function load(): FoldMap {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as FoldMap) : {};
  } catch {
    return {};
  }
}

let current: FoldMap = load();
const subs = new Set<() => void>();

function persist(): void {
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  subs.forEach((fn) => fn());
}

// undefined = the writer has never touched this section's toggle — the
// count-based default (below) still governs. A real boolean means the
// writer's own choice, sovereign forever after (S2: "the count rule never
// overrides it again").
export function getSectionFoldExplicit(sectionKey: string): boolean | undefined {
  return Object.prototype.hasOwnProperty.call(current, sectionKey) ? current[sectionKey] : undefined;
}

export function setSectionFold(sectionKey: string, collapsed: boolean): void {
  if (current[sectionKey] === collapsed) return; // no-op write, no spurious notify
  current = { ...current, [sectionKey]: collapsed };
  persist();
}

// first-ever default: more than six items opens collapsed [sectionFold §2]
export const FOLD_DEFAULT_THRESHOLD = 6;

export function defaultFoldCollapsed(itemCount: number): boolean {
  return itemCount > FOLD_DEFAULT_THRESHOLD;
}

/**
 * The resolved fold state for one section: the writer's own explicit choice
 * if they've ever touched this section's toggle (sovereign), else the
 * count-based default computed fresh from `itemCount` every render (so a
 * section that grows past six AFTER the writer last looked, but that they've
 * never explicitly touched, still degrades to the sensible default rather
 * than freezing whatever it happened to render as once).
 */
export function useSectionFold(sectionKey: string, itemCount: number): [boolean, () => void] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    subs.add(fn);
    return () => { subs.delete(fn); };
  }, []);
  const explicit = getSectionFoldExplicit(sectionKey);
  const collapsed = explicit !== undefined ? explicit : defaultFoldCollapsed(itemCount);
  const toggle = () => setSectionFold(sectionKey, !collapsed);
  return [collapsed, toggle];
}

// Test/inspection seam, matching the wrizoDeskLexicon / wrizoBoard precedent
// other modules already export for exactly this purpose.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoSectionFold?: unknown }).wrizoSectionFold = {
    get: getSectionFoldExplicit, set: setSectionFold, defaultCollapsed: defaultFoldCollapsed,
  };
}
