import type { JournalEntry, Project } from '../types';
import { inJournalView } from './persistence';

// AB3 S2/S5 — "Where it lives," told truthfully. Shared by the Page face on
// both JournalEntry.tsx and PageEditor.tsx so the two hosts can't drift.
// S5: a page's Journal membership is independent of its current home — a
// filed or shelved journal-origin page tells BOTH truths (the primary home
// line, plus "Also in the Journal."). The loose-origin door reads its own
// canon line verbatim ("Loose — belongs nowhere yet").
export function describePageHome(entry: JournalEntry, project: Project | null): { homeLabel: string; memberships: string[] } {
  let homeLabel: string;
  if (entry.projectId) {
    homeLabel = `In ${project?.title || 'Untitled'}`;
  } else if (entry.shelved) {
    homeLabel = 'On the Shelf';
  } else if (entry.origin === 'loose') {
    homeLabel = 'Loose — belongs nowhere yet';
  } else {
    homeLabel = 'In the Journal';
  }
  const memberships: string[] = [];
  if (inJournalView(entry) && homeLabel !== 'In the Journal') memberships.push('Also in the Journal.');
  return { homeLabel, memberships };
}
