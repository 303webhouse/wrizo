import type { DrawerKind, DrawerSection } from '../store/drawerSet';

// ARBOR v2 WORKING MOCKUP - the Tools drawer's cloth tabs (spec §9; Fable's ruling 3: allowed behind the flag, FIX reviews before it
// leaves the flag). store/drawerSet.ts stays the one statement of what each surface shows; this file only REGROUPS a surface's 'text'
// sections into tabs, and keeps 'ink' as its own tab. No section is added or lost: every section a surface shows today is on one tab here
// (arbor2-23.mjs checks the union against drawerSet). The tab you are on is in-session React state; nothing is stored.
//
//   type    (the lexicon's railTypeface - Arbor says "Font") : the typeface, plus Free Write's forward lock and capture
//   format  (railFormat)                                        : Draft's format, its actions, and the page kind
//   presets (sectionsPresets - Arbor's "Presets")              : Draft's ready-made starts (the templates section)
//   ink     (inkModeInk)                                        : Free Write's ink instrument - picking it IS the instrument switch, as today
//
// A surface with one tab or none shows no tab row (drawerSet's own rule: never a single lonely tab).
export type ArborToolTab = 'type' | 'format' | 'presets' | 'ink';

const TABS: Record<DrawerKind, Partial<Record<ArborToolTab, readonly DrawerSection[]>>> = {
  empty: {},
  freewrite: { type: ['typeface', 'forwardLock', 'capture'], ink: ['ink', 'forwardLock', 'capture'] },
  draft: { type: ['typeface'], format: ['format', 'actions', 'pageKind'], presets: ['templates'] },
  revise: { type: ['typeface'] },
  board: { type: ['boardTools'] },
};
const ORDER: readonly ArborToolTab[] = ['type', 'format', 'presets', 'ink'];

/** The tabs a surface shows, in order. Free Write's ink tab exists only when its host passes an instrument (as drawerSet.leftTabsFor). */
export function arborToolTabs(kind: DrawerKind, hasInstrument: boolean): ArborToolTab[] {
  return ORDER.filter((tab) => !!TABS[kind][tab] && (tab !== 'ink' || hasInstrument));
}

/** May this section appear on this surface under this tab? */
export function arborSectionAllowed(kind: DrawerKind, tab: ArborToolTab, section: DrawerSection): boolean {
  return (TABS[kind][tab] ?? []).includes(section);
}

/** Every section the Arbor tabs can show on a surface (for the no-section-lost check). */
export function arborSectionsUnion(kind: DrawerKind): DrawerSection[] {
  return [...new Set(Object.values(TABS[kind]).flat())] as DrawerSection[];
}
