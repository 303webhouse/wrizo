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

/** The themes whose Front menu has the kind menu at its Parts tab's head: the first tab takes the theme's Format word (Arbor's FORMAT, Flux's MARKUP), and the ready-made starts, the kind row and Page setup live in that head menu, not on the first tab (arbor-reorg-spec and flux-reorg-spec section 4). Machina keeps its own reading. */
export const frontKindHead = (theme: string | null | undefined): boolean => theme === 'plateau' || theme === 'flux';

// (the Wrizors' pass 6, NIT 2; Nick's 1A: the kind shows at SECTIONS' head and is not changed in one click once the page is made, so in Arbor FORMAT's Pages Kind row retires with the Presets)
/** The sections a tab shows: drawerSet's own, unchanged, but in Arbor (retirePresets) the ready-made starts (templates) are not on FORMAT: they live in SECTIONS' head menu, the kind menu, as Arbor's Presets tab retires into it. PARTS shows none of them (the Parts list is the tab). */
// VISUAL 1a.3: the last line also gives BUILD and EDIT their INK tab (the ink zone alone), a Front-menu tab only: the classic drawer's table gives Draft and Revise no ink
export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection, retirePresets = false): boolean {
  if (tab === 'parts') return false;
  if (retirePresets && (section === 'templates' || section === 'pageKind')) return false;
  return sectionsFor(kind, tab).includes(section) || (tab === 'ink' && section === 'ink' && (kind === 'draft' || kind === 'revise'));
}
