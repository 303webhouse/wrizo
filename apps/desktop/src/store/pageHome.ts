import type { JournalEntry, Project } from '../types';
import { inJournalView } from './persistence';
import { deskTerm } from './deskLexicon';

// AB3 S2/S5 — "Where it lives," told truthfully. Shared by the Page face on
// both JournalEntry.tsx and PageEditor.tsx so the two hosts can't drift.
// S5: a page's Journal membership is independent of its current home — a
// filed or shelved journal-origin page tells BOTH truths (the primary home
// line, plus "Also in the Journal."). The loose-origin door reads its own
// canon line verbatim ("Loose — belongs nowhere yet").
//
// AB4 S2 — `pinnedBoardTitles` (optional, defaults to none — every existing
// call site stays valid unchanged): one truthful membership line PER board
// the page is pinned to, via `deskTerm` (this is a plain function, not a
// hook, so it uses the same non-hook lexicon escape hatch CascadePanels.tsx's
// own `buildSurvey` already relies on — see deskLexicon.ts's header comment).
export function describePageHome(entry: JournalEntry, project: Project | null, pinnedBoardTitles: string[] = []): { homeLabel: string; memberships: string[] } {
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
  for (const title of pinnedBoardTitles) memberships.push(`${deskTerm('pageFacePinnedTo')} ${title}.`);
  return { homeLabel, memberships };
}
