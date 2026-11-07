import type { DrawerKind, DrawerSection } from '../store/drawerSet';

// ARBOR v2 WORKING MOCKUP - the Tools drawer's cloth tabs (spec §9; Fable's ruling 3: allowed behind the flag, FIX reviews before it
// leaves the flag). store/drawerSet.ts stays the one statement of what each surface shows; this file only REGROUPS a surface's 'text'
// sections into tabs, and keeps 'ink' as its own tab. No section is added or lost: every section a surface shows today is on one tab here
// (arbor2-23.mjs checks the union against drawerSet). The tab you are on is in-session React state; nothing is stored.
//
//   format  (railFormat)  THE MAIN TAB (r5, spec §9c: "Format = olive, the main tab (Typeface, Ink colour, Page kind, Progress)"): the
//                         typeface, Free Write's forward lock and capture, Draft's format, its actions and the page kind - the r4 "Font" tab
//                         folds in here (three cloths per drawer, green · blue · red)
//   presets (sectionsPresets - Arbor's "Presets")              : Draft's ready-made starts (the templates section)
//   ink     (inkModeInk)                                        : Free Write's ink instrument - picking it IS the instrument switch, as today
//
// A surface with one tab or none shows no tab row (drawerSet's own rule: never a single lonely tab).
export type ArborToolTab = 'format' | 'presets' | 'ink';

const TABS: Record<DrawerKind, Partial<Record<ArborToolTab, readonly DrawerSection[]>>> = {
  empty: {},
  freewrite: { format: ['typeface', 'forwardLock', 'capture'], ink: ['ink', 'forwardLock', 'capture'] },
  draft: { format: ['typeface', 'format', 'actions', 'pageKind'], presets: ['templates'] },
  revise: { format: ['typeface'] },
  board: { format: ['boardTools'] },
};
const ORDER: readonly ArborToolTab[] = ['format', 'presets', 'ink'];

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
