import type { JournalEntry } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { getUserPageDefaults } from '../store/pageDefaults';
import { isMachina2 } from './flag';

// MACHINA v2 MOCKUP r8 (the Wrizors' note, Nov 2, gated by Fable: "New pages start at 11 pt; pages already written keep their size"). A page keeps its size
// in its own pageSettings.size (an existing field; unset reads as the page law's 12), so under the flag a page born now - not a board - carries
// size 11 from birth, its other settings taken the way the app already fills a new page's (the writer's defaults, else the app's floor). A page
// already written is never touched: this runs only where a row is born (createJournalPage, createLooseHomePage, the unborn page's first word).
export const NEW_PAGE_PT = 11;
export function newPageSize(e: JournalEntry): JournalEntry {
  if (!isMachina2() || typeof document === 'undefined' || document.documentElement.getAttribute('data-theme') !== 'machina') return e;
  if (e.pageType === 'board') return e;
  if (e.pageSettings && typeof e.pageSettings.size === 'number') return e;
  e.pageSettings = { ...(e.pageSettings ?? getUserPageDefaults() ?? PAGE_SETTINGS_FALLBACK), size: NEW_PAGE_PT };
  return e;
}
