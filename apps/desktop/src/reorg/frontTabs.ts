import type { DrawerKind, DrawerSection } from '../store/drawerSet';
import { sectionsFor } from '../store/drawerSet';

// THE REORG'S FRONT MENU, its frame (plan step 3.1, behind ?reorg=1 in Machina; Fable's GO Nov 19, 4:20 pm; the prototype's frontMenu, tabs
// TEXT · INK · PARTS). Today's Tools drawer (the Sliver) is the Front menu: this file only REGROUPS what store/drawerSet.ts already lets each
// surface show, as arbor2/drawerTabs.ts does for Arbor. Nothing is added to a tab but two things the reorg moves in: Page setup (from the
// rail's Pages pop-out, which the reorg's rail no longer has) at the foot of TEXT, and the Parts list on its own tab. No section is lost: TEXT
// is drawerSet's text sections, INK its ink sections. The tab she is on is in-session React state; nothing is stored.
export type FrontTab = 'text' | 'ink' | 'parts';

/** The Front menu's tabs on a writing surface: TEXT, then INK only where the host passes an instrument (Free Write, as today), then PARTS.
 *  A Board keeps today's drawer (no tabs): its menus are the stage table's second part, not built. */
export function frontTabsFor(kind: DrawerKind, hasInstrument: boolean): FrontTab[] {
  if (kind === 'board' || kind === 'empty') return [];
  return hasInstrument ? ['text', 'ink', 'parts'] : ['text', 'parts'];
}

/** The sections a tab shows: drawerSet's own, unchanged. PARTS shows none of them (the Parts list is the tab). */
export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection): boolean {
  if (tab === 'parts') return false;
  return sectionsFor(kind, tab).includes(section);
}
