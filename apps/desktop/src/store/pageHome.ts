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
//
// B2 S3/S7 — a genuine defect found and fixed while retiring the `shelved`
// UI read/write: this function's OWN `entry.shelved` branch is retired
// (the flag is dormant now, never read here either — T3, not a flag,
// decides the Shelf), and its fallback for "no project, not the Journal"
// used to be an UNCONDITIONAL "In the Journal" — flatly wrong for a
// 'project'-origin page that has since been un-filed (reachable for the
// first time via S4's own Places panel, but latent before this ticket
// too: any "file to Shelf" act on a project-origin page already produced
// this exact shape, just papered over by `shelved` happening to read true
// in the one case the old UI could reach). The fix: fall through to
// inJournalView's OWN pinned-law verdict — one truth, not a second
// hand-rolled re-derivation of it — rather than special-casing origins by
// hand. Every existing call site (JournalEntry.tsx, PageEditor.tsx,
// BoardEditor.tsx, ScriptEditor.tsx) is untouched; only what this function
// itself decides changes.
export function describePageHome(entry: JournalEntry, project: Project | null, pinnedBoardTitles: string[] = []): { homeLabel: string; memberships: string[] } {
  let homeLabel: string;
  if (entry.projectId) {
    homeLabel = `In ${project?.title || 'Untitled'}`;
  } else if (inJournalView(entry)) {
    homeLabel = 'In the Journal';
  } else if (entry.origin === 'loose') {
    homeLabel = 'Loose — belongs nowhere yet';
  } else {
    // Not filed, not journal-homed, and not the loose-origin door either
    // (a 'project'-origin page un-filed, or a legacy grandfathered row
    // that used to read `shelved` true) — the honest fact is the same
    // "belongs nowhere yet" the loose door already uses; T3 (persistence.ts)
    // is what actually lands it on the Shelf at the next reconcile.
    homeLabel = 'Loose — belongs nowhere yet';
  }
  const memberships: string[] = [];
  if (inJournalView(entry) && homeLabel !== 'In the Journal') memberships.push('Also in the Journal.');
  for (const title of pinnedBoardTitles) memberships.push(`${deskTerm('pageFacePinnedTo')} ${title}.`);
  return { homeLabel, memberships };
}
