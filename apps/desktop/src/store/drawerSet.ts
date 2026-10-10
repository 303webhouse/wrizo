// PHASE 1 (docs/plans/phase1-drawers.md 3.1) - WHAT THE LEFT DRAWER SHOWS, in one table.
//
// Which tabs a surface has and which sections each tab holds used to be implied by scattered conditions in Sliver.tsx. This is the
// single statement of it; Sliver.tsx asks it (allowed()) before rendering a section, and the browserless harness tests the table.
// It is pure: no React, no storage. The host still decides whether a section has DATA (a screenplay page passes no type member, so there
// is no Typeface there); this table decides whether the section may APPEAR on that surface and tab at all.
//
// It encodes what the drawers show TODAY plus the tab row. Ruled so far (Nick, Oct 9): Free Write = typeface choices + INK, no Format group
// (B/I/U wait for the typing-path work); the open tab is olive and choices are brass outlines; Actions = Tags, Copy, Delete, Header/Footer (Q3).
// Not yet ruled, so absent here on purpose: an INK tab in Draft/Revise (Q2 - the table gives Draft and Revise no tab row, the current law).

export type DrawerKind = 'empty' | 'freewrite' | 'draft' | 'revise' | 'board';
export type LeftTab = 'text' | 'ink';
/** The right drawer's tabs, in order (S3). The second tab's WORD is the theme's (lexicon term 'drawerLinks'). Phase 3 fills it. */
export const RIGHT_TABS = ['tutor', 'links'] as const;
export type RightTab = typeof RIGHT_TABS[number];

export type DrawerSection = 'typeface' | 'forwardLock' | 'capture' | 'ink' | 'format' | 'actions' | 'templates' | 'pageKind' | 'boardTools';

/** The tabs on a surface's left drawer. Only Free Write has any, and only when its host passes an instrument (a Journal capture page, for
 *  one, has no ink switch). An empty list means: no tab row at all - never a single lonely tab. */
export function leftTabsFor(kind: DrawerKind, hasInstrument: boolean): LeftTab[] {
  return kind === 'freewrite' && hasInstrument ? ['text', 'ink'] : [];
}

const SECTIONS: Record<DrawerKind, { text: DrawerSection[]; ink: DrawerSection[] }> = {
  empty: { text: [], ink: [] },
  // Free Write: the Typeface in TEXT, the pen in INK; the forward lock and the capture list ride both (as they do today).
  freewrite: { text: ['typeface', 'forwardLock', 'capture'], ink: ['ink', 'forwardLock', 'capture'] },
  // Draft: the full set, in the ruled order - Typeface, Format, Actions, Templates (then the page-kind chips, as today).
  draft: { text: ['typeface', 'format', 'actions', 'templates', 'pageKind'], ink: [] },
  // Revise: the Typeface and nothing else (the standing 112-A ruling).
  revise: { text: ['typeface'], ink: [] },
  board: { text: ['boardTools'], ink: [] },
};

/** The sections a surface shows on a tab, in the order they appear. */
export function sectionsFor(kind: DrawerKind, tab: LeftTab): readonly DrawerSection[] {
  return SECTIONS[kind][tab];
}

/** May this section appear on this surface and tab? A surface with no tab row is always on its 'text' tab. */
export function sectionAllowed(kind: DrawerKind, tab: LeftTab, section: DrawerSection): boolean {
  return SECTIONS[kind][tab].includes(section);
}
