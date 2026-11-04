// what the left drawer shows, in one table: Sliver.tsx asks allowed() before rendering a section; pure, tested browserless; the host still decides whether a section has data [drawerSet §1]

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
  // Draft: the full set, in order [drawerSet §2]
  draft: { text: ['typeface', 'format', 'actions', 'templates', 'pageKind'], ink: [] },
  // Revise: the Typeface and nothing else [drawerSet §3]
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
