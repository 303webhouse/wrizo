import { getJournalEntry } from '../store/persistence';
import { graftsOf, planGroupOf } from '../store/grafts';
import { assetGroupsOf } from './backMenu/assetGroups';

// A PART'S ASSETS, COUNTED (the Team B restyle: Decision 2's link badge on each Part row, Nov 20; "Assets (n)" in the Back menu). The count is
// what that Part's Assets tab lists: every row (a card, a doc, a source, the own plan board's cards) and every board linked whole (its head).
// Shared tags are not assets. A read only: nothing is written.
export function assetCountOf(partId: string): number {
  const e = getJournalEntry(partId);
  if (!e) return 0;
  const g = graftsOf({ entryId: partId });
  if (!g) return 0;
  const groups = assetGroupsOf(g, planGroupOf(partId), () => '');
  return groups.reduce((n, grp) => (grp.kind === 'tags' ? n : n + grp.items.length + (grp.head && !grp.own ? 1 : 0)), 0);
}
