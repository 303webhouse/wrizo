import { useEffect, useState } from 'react';

// FX9 S2 — "memory, without schema." Per-section open/closed state for the
// cascade's list-bearing headers (DrawersPanel's per-project clusters + its
// documents list, JournalPanel's recent list), client-local only. Same
// FAMILY as store/firstRun.ts / store/tutorDisclosure.ts (HB1 F3's own
// precedent: one localStorage key, a module-level `current` cache, a Set of
// subscriber callbacks, try/catch guards on every localStorage touch) — this
// file's own shape differs only in that ONE key now holds a MAP (section id
// -> the writer's own explicit collapsed choice) rather than a single flag,
// because the ticket has to remember many independent sections, an unbounded
// and dynamic set (one per project cluster) that a single boolean flag can't
// express. Still zero schema: nothing here is a server row, and an absent
// key is simply "never touched," never an error.
//
// Keys ride STABLE, CONTENT-INDEPENDENT identifiers (S2's own ruling — "a
// project cluster's key rides its project id, never its title"): callers
// pass `project:<id>` for a per-project cluster, and a fixed literal for
// every section that isn't per-entity ('drawersLoose', 'journalRecent'). A
// key for a section that no longer exists (a deleted project, a retired
// panel) is simply never read again — inert, left to rot, no reaper (S2's
// own explicit non-goal).
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

// S2's own ruled first-ever default: MORE than six items opens collapsed;
// six or fewer opens expanded — "a hand's worth of items reads at a glance
// and needs no hinge" (Fable's own words).
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
