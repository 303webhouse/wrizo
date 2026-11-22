import { useSyncExternalStore } from 'react';
import { getPref, setPref, subscribePrefs } from '../prefsSaved';
import type { AssetGroup, AssetItem } from './assetGroups';

// THE ASSETS TAB'S SORTS (machina-team-b-revisions.md 1F: "Every list sorts A-Z, newest or oldest first, and by Project"; Fable, Nov 20, 11:45 pm:
// "SAVE the sort as a reorg fact in users.prefs"). One choice for every list in the tab: the Doc's own and each Part's. Saved as the reorg fact
// `assetsSort` = { by } (reorg/prefsSaved.ts: the account's users.prefs, merged by stamp), so it follows her to every device. Until she picks one,
// nothing is sorted: each list keeps the order it is read in (today's).
//   - az: by title (numbers in order, case ignored);
//   - new / old: by the date the asset was connected (the link's own date, the Doc-level asset's `at`), newest or oldest first;
//   - project: by the place it lives in (its Project, the Drawer), then by title.
// A tie keeps the order it was read in. Only the rows inside each group move; the groups (a board and its cards, the Docs) keep their places.

export type AssetSort = 'az' | 'new' | 'old' | 'project';
export const ASSET_SORTS: readonly AssetSort[] = ['az', 'new', 'old', 'project'];
const FACT = 'assetsSort';
const isSort = (v: unknown): v is AssetSort => typeof v === 'string' && (ASSET_SORTS as readonly string[]).includes(v);

const read = (): AssetSort | null => { const by = getPref(FACT)?.by; return isSort(by) ? by : null; };

/** Her saved sort, or null (none chosen: today's order). */
export function useAssetsSort(): AssetSort | null {
  return useSyncExternalStore(subscribePrefs, read, read);
}

/** Her pick, saved as a reorg fact (a pick of the same sort writes nothing). */
export function setAssetsSort(by: AssetSort): void {
  if (isSort(by)) setPref(FACT, { by });
}

const byTitle = (a: string, b: string): number => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/** The groups with each group's rows in this order. `dateOf` is when a row was connected ('' when unknown); `placeOf` the place an entry lives in. */
export function sortAssetGroups(groups: readonly AssetGroup[], by: AssetSort | null, dateOf: (it: AssetItem) => string, placeOf: (entryId: string) => string): AssetGroup[] {
  if (!by) return groups.slice();
  const cmp = (a: AssetItem, b: AssetItem): number => {
    if (by === 'az') return byTitle(a.row.title, b.row.title);
    if (by === 'project') return byTitle(placeOf(a.row.entryId), placeOf(b.row.entryId)) || byTitle(a.row.title, b.row.title);
    const da = dateOf(a), db = dateOf(b);
    if (da === db) return 0;
    const up = da < db ? -1 : 1;
    return by === 'old' ? up : -up;
  };
  return groups.map((g) => (g.items.length > 1 ? { ...g, items: g.items.slice().sort(cmp) } : g));
}
